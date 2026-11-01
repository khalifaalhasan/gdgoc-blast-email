import json

import pytest

from src.infrastructure import google_drive
from src.infrastructure.gmail_adapter import GmailSendError
from src.worker import tasks
from src.worker.tasks import blast_email_task

FOLDERS = {
    'participant': 'folder-participant',
    'committee': 'folder-committee',
}


@pytest.fixture
def env(monkeypatch, tmp_path):
    """Jalankan task tanpa Google API, Redis, maupun Postgres."""
    state = {
        'drive': {},        # folder_id -> list nama file
        'sent': [],         # (email, nama file lampiran)
        'send_errors': {},  # email -> exception
        'download_errors': set(),
        'logs': [],
        'messages': [],     # (email, subject, body)
    }

    monkeypatch.setattr(tasks.google_auth, 'get_gmail_service', lambda: object())
    monkeypatch.setattr(tasks.google_auth, 'get_drive_service', lambda: object())
    monkeypatch.setattr(tasks.time, 'sleep', lambda s: None)
    monkeypatch.setattr(blast_email_task, 'update_state', lambda **kw: None)

    def fake_find(service, folder_id, target_name, require_full_name=False):
        names = state['drive'].get(folder_id, [])
        items = [{'id': f'{folder_id}/{n}', 'name': n} for n in names]
        return google_drive.match_file(items, target_name, require_full_name=require_full_name)

    def fake_download(service, file_id, save_path):
        if file_id in state['download_errors']:
            raise RuntimeError("Google Drive Download Error: 500")
        with open(save_path, 'wb') as f:
            f.write(b'%PDF-')
        return True

    def fake_send(service, message):
        to = message['to']
        if to in state['send_errors']:
            raise state['send_errors'][to]
        state['sent'].append((to, message['attachment']))
        state['messages'].append((to, message['subject'], message['body']))

    def fake_create_message(to_email, subject, html_body, pdf_path=None, **kwargs):
        import os
        return {
            'to': to_email,
            'subject': subject,
            'body': html_body,
            'attachment': os.path.basename(pdf_path) if pdf_path else None,
        }

    def fake_log(task_id, campaign_id, nama, email, role, status, reason=None):
        state['logs'].append((email, status, reason))

    monkeypatch.setattr(tasks.google_drive, 'find_file_in_drive', fake_find)
    monkeypatch.setattr(tasks.google_drive, 'download_file', fake_download)
    monkeypatch.setattr(tasks.gmail_adapter, 'send_email', fake_send)
    monkeypatch.setattr(tasks.gmail_adapter, 'create_message', fake_create_message)
    monkeypatch.setattr(tasks.email_log_repo, 'log_email_result', fake_log)
    return state


def run(rows, drive_links=None, campaign_type='sertifikat',
        subject='Sertifikat {{nama}}', body='Halo {{nama}}'):
    links = drive_links if drive_links is not None else {
        role: f'https://drive.google.com/drive/folders/{fid}' for role, fid in FOLDERS.items()
    }
    result = blast_email_task.apply(
        args=(rows, json.dumps(links), subject, body, campaign_type),
    ).get()
    return result


def row(nama, email, role='Participant'):
    return {'Nama': nama, 'Email': email, 'Role': role}


def reasons(result):
    return {r['Email']: r['_error_reason'] for r in result['failed_rows']}


def test_each_person_gets_their_own_certificate(env):
    env['drive']['folder-participant'] = ['Muhammad Rizki Akbar.pdf', 'Muhammad Rizki Baskara.pdf']
    result = run([
        row('Muhammad Rizki Akbar', 'akbar@x.com'),
        row('Muhammad Rizki Baskara', 'baskara@x.com'),
    ])
    assert result['success'] == 2
    assert sorted(env['sent']) == [
        ('akbar@x.com', 'Muhammad Rizki Akbar.pdf'),
        ('baskara@x.com', 'Muhammad Rizki Baskara.pdf'),
    ]


def test_missing_certificate_is_not_replaced_by_namesake(env):
    # Sertifikat Cahyo belum ada; dulu Cahyo bisa menerima file milik Akbar.
    env['drive']['folder-participant'] = ['Muhammad Rizki Akbar.pdf']
    result = run([
        row('Muhammad Rizki Akbar', 'akbar@x.com'),
        row('Muhammad Rizki Cahyo', 'cahyo@x.com'),
    ])
    assert env['sent'] == [('akbar@x.com', 'Muhammad Rizki Akbar.pdf')]
    assert 'awalan nama yang sama' in reasons(result)['cahyo@x.com']


def test_certificate_without_drive_folder_is_not_sent(env):
    result = run([row('Budi Santoso', 'budi@x.com', role='Speaker')])
    assert env['sent'] == []
    assert "role 'Speaker'" in reasons(result)['budi@x.com']


def test_single_default_folder_is_used_for_any_role(env):
    env['drive']['folder-all'] = ['Budi Santoso.pdf']
    result = run(
        [row('Budi Santoso', 'budi@x.com', role='Speaker')],
        drive_links={'default': 'https://drive.google.com/drive/folders/folder-all'},
    )
    assert env['sent'] == [('budi@x.com', 'Budi Santoso.pdf')]
    assert result['fail'] == 0


def test_one_download_error_does_not_stop_the_blast(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf', 'Siti Aminah.pdf']
    env['download_errors'].add('folder-participant/Budi Santoso.pdf')
    result = run([
        row('Budi Santoso', 'budi@x.com'),
        row('Siti Aminah', 'siti@x.com'),
    ])
    assert env['sent'] == [('siti@x.com', 'Siti Aminah.pdf')]
    assert 'Download Error' in reasons(result)['budi@x.com']
    assert result['success'] == 1 and result['fail'] == 1


def test_ambiguous_files_are_reported(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf', 'budi santoso.PDF']
    result = run([row('Budi Santoso', 'budi@x.com')])
    assert env['sent'] == []
    assert 'Ditemukan 2 file' in reasons(result)['budi@x.com']


def test_quota_exhausted_marks_remaining_rows_failed(env):
    env['drive']['folder-participant'] = ['A Satu.pdf', 'B Dua.pdf', 'C Tiga.pdf']
    env['send_errors']['b@x.com'] = GmailSendError("Kuota kirim harian Gmail habis", quota_exceeded=True)
    result = run([row('A Satu', 'a@x.com'), row('B Dua', 'b@x.com'), row('C Tiga', 'c@x.com')])
    assert env['sent'] == [('a@x.com', 'A Satu.pdf')]
    assert 'kuota' in reasons(result)['c@x.com'].lower()
    assert result['success'] == 1 and result['fail'] == 2
    # Semua yang gagal tercatat di DB supaya bisa di-resend
    assert [s for _, s, _ in env['logs']].count('failed') == 2


def test_any_csv_column_can_be_used_as_placeholder(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf']
    rows = [{'Nama': 'Budi Santoso', 'Email': 'budi@x.com', 'Role': 'Participant', 'Division': 'UI/UX'}]
    run(rows, subject='{{nama}} - {{ Division }}', body='{{role}} in the {{division}} Division')
    assert env['messages'] == [('budi@x.com', 'Budi Santoso - UI/UX', 'Participant in the UI/UX Division')]


def test_placeholder_column_name_with_spaces_and_symbols(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf']
    rows = [{'Nama': 'Budi Santoso', 'Email': 'budi@x.com', 'Role': 'Participant', 'Award Type': 'Overall'}]
    run(rows, body='{{award_type}} / {{Award Type}}')
    assert env['messages'][0][2] == 'Overall / Overall'


def test_unknown_placeholder_fails_row_without_sending(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf']
    result = run([row('Budi Santoso', 'budi@x.com')], body='Divisi {{divison}}')
    assert env['sent'] == []
    assert '{{divison}}' in reasons(result)['budi@x.com']


def test_empty_placeholder_value_fails_row(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf']
    rows = [{'Nama': 'Budi Santoso', 'Email': 'budi@x.com', 'Role': 'Participant', 'Division': ''}]
    result = run(rows, body='{{division}}')
    assert env['sent'] == []
    assert 'kosong' in reasons(result)['budi@x.com']


def test_placeholder_values_are_html_escaped_in_body_only(env):
    env['drive']['folder-participant'] = ['Budi Santoso.pdf']
    rows = [{'Nama': 'Budi Santoso', 'Email': 'budi@x.com', 'Role': 'Participant', 'Division': 'R&D <Lab>'}]
    run(rows, subject='{{division}}', body='{{division}}')
    assert env['messages'][0][1:] == ('R&D <Lab>', 'R&amp;D &lt;Lab&gt;')


def test_sertifikat_column_overrides_file_lookup(env):
    # Ejaan nama di data berbeda dengan nama file di Drive
    env['drive']['folder-participant'] = ['Dimas Pratamaa.pdf']
    rows = [{'Nama': 'Dimas Pratama', 'Email': 'dimas@x.com', 'Role': 'Participant',
             'Sertifikat': 'Dimas Pratamaa'}]
    run(rows, body='Hi {{nama}}')
    assert env['sent'] == [('dimas@x.com', 'Dimas Pratamaa.pdf')]
    assert env['messages'][0][2] == 'Hi Dimas Pratama'


def test_sertifikat_column_separates_namesakes(env):
    env['drive']['folder-participant'] = ['Siti Rahma.pdf', 'Siti Rahma UIUX.pdf']
    rows = [
        {'Nama': 'Siti Rahma', 'Email': 'pm@x.com', 'Role': 'Participant', 'Sertifikat': ''},
        {'Nama': 'Siti Rahma', 'Email': 'uiux@x.com', 'Role': 'Participant',
         'Sertifikat': 'Siti Rahma UIUX'},
    ]
    run(rows)
    assert sorted(env['sent']) == [
        ('pm@x.com', 'Siti Rahma.pdf'),
        ('uiux@x.com', 'Siti Rahma UIUX.pdf'),
    ]
