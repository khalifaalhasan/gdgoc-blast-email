"""
app/worker/tasks.py

Celery task untuk blast email.

Tanggung jawab file ini:
- Menerima parameter task dari CampaignService
- Orchestrate alur per-penerima (ambil file, kirim email)
- Update state Celery (PROGRESS)
- Delegasikan DB logging ke email_log_repo (bukan nulis DB di sini sendiri)
- Delegasikan file search ke google_drive (infrastructure)
- Delegasikan pengiriman email ke gmail_adapter (infrastructure)

Yang TIDAK ada di sini:
- Business logic matching nama (ada di google_drive.py)
- DB session setup (ada di app/worker/db_utils.py)
- Celery app config (ada di app/worker/__init__.py)
"""
import os
import json
import time
import random
import traceback as _traceback
from collections import Counter

from src.worker import celery_app
from src.infrastructure import google_auth, google_drive
from src.infrastructure import gmail_adapter
from src.repositories import email_log_repo
from src.core.config import config


@celery_app.task(bind=True)
def blast_email_task(
    self,
    rows,
    drive_links_json,
    subject_template,
    body_template,
    campaign_type="sertifikat",
    surat_files_map=None,
    campaign_id=None,
):
    total = len(rows)
    success_count = 0
    fail_count = 0
    logs = []
    failed_rows = []
    successful_rows = []

    if not campaign_id:
        campaign_id = (self.request.kwargs or {}).get("campaign_id")

    # --- Normalisasi surat_files_map ---
    if isinstance(surat_files_map, str):
        path_str = surat_files_map
        if path_str and os.path.exists(path_str):
            key = os.path.splitext(os.path.basename(path_str))[0].strip().lower()
            surat_files_map = {key: path_str}
        else:
            surat_files_map = None
    elif surat_files_map is not None and not isinstance(surat_files_map, dict):
        surat_files_map = None

    # --- Normalisasi drive_links_json ---
    if isinstance(drive_links_json, dict):
        drive_links_json = json.dumps(drive_links_json)

    def update_progress():
        self.update_state(
            state='PROGRESS',
            meta={
                'total': total,
                'processed': success_count + fail_count,
                'success': success_count,
                'fail': fail_count,
                'logs': logs[-10:],
            },
        )

    def record_fail(row, nama, email, role, reason):
        nonlocal fail_count
        fail_count += 1
        failed_row = row.copy()
        failed_row['_error_reason'] = reason
        failed_rows.append(failed_row)
        logs.append(f"❌ GAGAL [{nama or '?'} <{email or '?'}>]: {reason}")
        email_log_repo.log_email_result(self.request.id, campaign_id, nama, email, role, 'failed', reason)
        update_progress()

    logs.append("Mempersiapkan otentikasi Google APIs...")
    update_progress()

    try:
        gmail_service = google_auth.get_gmail_service()

        folder_ids = {}
        drive_service = None
        if drive_links_json and drive_links_json not in ('{}', '""'):
            drive_service = google_auth.get_drive_service()
            try:
                links_dict = json.loads(drive_links_json)
                for k, v in links_dict.items():
                    if not str(v).strip():
                        continue
                    extracted = google_drive.extract_folder_id(v)
                    if extracted is None:
                        logs.append(
                            f"⚠️ Peringatan: Link Drive untuk role '{k}' tidak valid atau bukan link folder. "
                            f"Pastikan link yang diinput adalah link FOLDER Google Drive, bukan link file. "
                            f"(Diterima: {v})"
                        )
                        print(f"⚠️ worker: extract_folder_id mengembalikan None untuk key='{k}', value='{v}'")
                    else:
                        folder_ids[k.strip().lower()] = extracted
            except Exception:
                if isinstance(drive_links_json, str):
                    extracted = google_drive.extract_folder_id(drive_links_json)
                    if extracted:
                        folder_ids = {'default': extracted}
                    else:
                        logs.append(
                            f"⚠️ Peringatan: Link Drive tunggal tidak valid atau bukan link folder. "
                            f"Pastikan link yang diinput adalah link FOLDER Google Drive. "
                            f"(Diterima: {drive_links_json})"
                        )

    except Exception as e:
        tb = _traceback.format_exc()
        logs.append(f"Gagal otentikasi API: {str(e)}\n{tb}")
        update_progress()
        return {'status': 'Failed', 'logs': logs, 'failed_rows': rows}

    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'temp_certs')
    os.makedirs(temp_dir, exist_ok=True)

    # Penerima dengan 2 kata pertama nama yang sama (misal "Muhammad Rizki A" & "Muhammad Rizki B")
    # wajib cocok NAMA LENGKAP di Drive, supaya sertifikat tidak tertukar.
    name_key_counts = Counter(
        google_drive.name_key(nama) for nama, _, _ in map(_extract_fields, rows) if nama
    )

    quota_exhausted = False

    for row in rows:
        nama, email, role = _extract_fields(row)

        if quota_exhausted:
            record_fail(
                row, nama, email, role,
                "Belum dikirim: kuota harian Gmail habis. Kirim ulang lewat 'Resend yang Gagal' besok.",
            )
            continue

        if not nama or not email:
            record_fail(row, nama, email, role, "Kolom nama atau email kosong / tidak ditemukan di dataset CSV")
            continue

        if '@' not in email or '.' not in email.split('@')[-1]:
            record_fail(row, nama, email, role, f"Format email tidak valid: '{email}'")
            continue

        save_path = None
        sent_attempted = False
        try:
            # --- Tentukan folder Drive berdasarkan role ---
            # Fallback ke 'default' atau ke satu-satunya folder. Jika ada beberapa folder dan
            # role tidak cocok, JANGAN tebak folder lain (bisa mengambil sertifikat role lain).
            normalized_role = role.strip().lower()
            current_folder_id = folder_ids.get(normalized_role) or folder_ids.get('default')
            if not current_folder_id and len(folder_ids) == 1:
                current_folder_id = next(iter(folder_ids.values()))

            require_full_name = name_key_counts[google_drive.name_key(nama)] > 1

            # --- Cari / download file lampiran ---
            if campaign_type == 'surat':
                if surat_files_map:
                    nama_key = nama.strip().lower()
                    save_path = surat_files_map.get(nama_key)
                    if not save_path or not os.path.exists(save_path):
                        save_path = None
                        record_fail(
                            row, nama, email, role,
                            f"File surat tidak ditemukan untuk '{nama}'. "
                            f"Pastikan ada file bernama '{nama}.pdf' di antara file yang diupload. "
                            f"Nama file harus sama persis (case-insensitive) dengan kolom nama di CSV.",
                        )
                        continue
                elif current_folder_id:
                    logs.append(f"Mencari surat untuk '{nama}' di Google Drive...")
                    update_progress()
                    file_match = google_drive.find_file_in_drive(
                        drive_service, current_folder_id, nama, require_full_name=require_full_name
                    )
                    if not file_match:
                        record_fail(
                            row, nama, email, role,
                            f"File PDF tidak ditemukan di folder Drive untuk '{nama}'. "
                            f"Pastikan ada file bernama '{nama}.pdf' di folder Drive tersebut.",
                        )
                        continue
                    save_path = os.path.join(temp_dir, file_match['name'])
                    google_drive.download_file(drive_service, file_match['id'], save_path)
            else:
                # Sertifikat WAJIB punya lampiran — jangan kirim email kosong.
                if not current_folder_id:
                    record_fail(
                        row, nama, email, role,
                        f"Link folder Drive untuk role '{role}' belum diisi atau tidak valid. "
                        f"Email tidak dikirim karena sertifikat wajib terlampir.",
                    )
                    continue
                logs.append(f"Mencari sertifikat untuk '{nama}' ({role})...")
                update_progress()
                file_match = google_drive.find_file_in_drive(
                    drive_service, current_folder_id, nama, require_full_name=require_full_name
                )
                if not file_match:
                    hint = (
                        " Ada penerima lain dengan awalan nama yang sama, jadi nama file harus memuat nama lengkap."
                        if require_full_name else ""
                    )
                    record_fail(
                        row, nama, email, role,
                        f"Sertifikat tidak ditemukan di Google Drive untuk '{nama}' (role: {role}). "
                        f"Pastikan nama file PDF sama persis dengan kolom nama di CSV.{hint}",
                    )
                    continue
                save_path = os.path.join(temp_dir, file_match['name'])
                google_drive.download_file(drive_service, file_match['id'], save_path)

            # --- Kirim email ---
            actual_subject = subject_template.replace('{{nama}}', nama).replace('{{role}}', role)
            actual_body = body_template.replace('{{nama}}', nama).replace('{{role}}', role)

            message = gmail_adapter.create_message(
                to_email=email,
                subject=actual_subject,
                html_body=actual_body,
                pdf_path=save_path,
                sender_name=config.SENDER_NAME,
                sender_email=config.SENDER_EMAIL,
            )

            sent_attempted = True
            gmail_adapter.send_email(gmail_service, message)

            success_count += 1
            success_row = row.copy()
            success_row['_status'] = 'success'
            successful_rows.append(success_row)
            logs.append(f"✅ SUKSES: Email terkirim ke {nama} ({email})")
            email_log_repo.log_email_result(self.request.id, campaign_id, nama, email, role, 'success')
            update_progress()

        except google_drive.AmbiguousFileMatch as e:
            record_fail(row, nama, email, role, str(e))
        except gmail_adapter.GmailSendError as e:
            record_fail(row, nama, email, role, str(e))
            if e.quota_exceeded:
                quota_exhausted = True
                logs.append("⛔ Kuota harian Gmail habis. Sisa penerima ditandai gagal agar bisa dikirim ulang.")
                update_progress()
        except Exception as e:
            # Error satu penerima (Drive/download/dll) tidak boleh menghentikan seluruh blast
            print(_traceback.format_exc(), flush=True)
            record_fail(row, nama, email, role, f"Error saat memproses penerima: {str(e)}")
        finally:
            # Hapus file lampiran temp setelah diproses
            if save_path and os.path.exists(save_path):
                try:
                    os.remove(save_path)
                except Exception:
                    pass

        if sent_attempted and not quota_exhausted:
            time.sleep(random.randint(2, 5))

    return {
        'total': total,
        'success': success_count,
        'fail': fail_count,
        'logs': logs,
        'failed_rows': failed_rows,
        'successful_rows': successful_rows,
    }


def _extract_fields(row):
    """Ambil (nama, email, role) dari baris CSV dengan header yang fleksibel."""
    nama = None
    email = None
    role = "Participant"
    for k, v in row.items():
        if not k:
            continue
        k_lower = str(k).lower().replace('﻿', '').strip()
        if any(x in k_lower for x in ['nama', 'name']) and not nama:
            nama = str(v).strip() if v else None
        elif any(x in k_lower for x in ['email', 'e-mail']) and not email:
            email = str(v).strip() if v else None
        elif 'role' in k_lower and role == "Participant":
            role = str(v).strip() if v else "Participant"
    return nama, email, role
