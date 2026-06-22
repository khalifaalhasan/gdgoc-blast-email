import os
import time
import random
import uuid
from datetime import datetime
from celery import Celery
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.infrastructure import google_auth, google_drive
from app.services import mailer_svc
from app.core.config import config

# Konfigurasi Celery (Menggunakan Redis)
celery_app = Celery(
    'blast_tasks',
    broker=config.REDIS_URL,
    backend=config.REDIS_URL
)

celery_app.conf.update(
    result_expires=3600,
)

import json

# --- Sync DB session untuk Celery worker (worker berjalan di konteks sync) ---
def _get_sync_db_url():
    db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/blast_email")
    # Konversi asyncpg ke psycopg2 untuk worker sync
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "postgresql://" in db_url and "+psycopg2" not in db_url and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
    return db_url

_sync_engine = None
_SyncSession = None

def get_sync_session():
    global _sync_engine, _SyncSession
    if _sync_engine is None:
        _sync_engine = create_engine(_get_sync_db_url(), pool_pre_ping=True)
        _SyncSession = sessionmaker(bind=_sync_engine)
    return _SyncSession()

def log_email_result(task_id, campaign_id, nama, email, role, status, error_reason=None):
    """Simpan hasil pengiriman email ke tabel email_logs di PostgreSQL."""
    try:
        from app.db.models import EmailLog
        session = get_sync_session()
        try:
            log = EmailLog(
                id=uuid.uuid4(),
                task_id=task_id,
                campaign_id=campaign_id,
                nama=nama,
                email=email,
                role=role,
                status=status,
                error_reason=error_reason,
                sent_at=datetime.utcnow()
            )
            session.add(log)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"⚠️ Gagal menyimpan log ke DB: {e}")
        finally:
            session.close()
    except Exception as e:
        print(f"⚠️ DB log error (non-fatal): {e}")


@celery_app.task(bind=True)
def blast_email_task(self, rows, drive_links_json, subject_template, body_template, campaign_type="sertifikat", surat_files_map=None, campaign_id=None):
    import traceback as _traceback

    total = len(rows)
    success_count = 0
    fail_count = 0
    logs = []
    failed_rows = []
    successful_rows = []

    # Jika campaign_id tidak diparsing via parameter, coba ambil dari request kwargs
    if not campaign_id:
        campaign_id = (self.request.kwargs or {}).get("campaign_id")

    # --- Normalisasi surat_files_map ---
    # Backward compat: kode lama mengirim string path, kode baru mengirim dict {nama: path}
    if isinstance(surat_files_map, str):
        # Format lama: single file path string
        path_str = surat_files_map
        if path_str and os.path.exists(path_str):
            key = os.path.splitext(os.path.basename(path_str))[0].strip().lower()
            surat_files_map = {key: path_str}
        else:
            surat_files_map = None
    elif surat_files_map is not None and not isinstance(surat_files_map, dict):
        # Tipe tidak dikenal — abaikan
        surat_files_map = None

    # --- Normalisasi drive_links_json ---
    # Celery kadang otomatis parse JSON string menjadi dict
    if isinstance(drive_links_json, dict):
        drive_links_json = json.dumps(drive_links_json)

    def update_progress():
        self.update_state(state='PROGRESS', meta={
            'total': total,
            'processed': success_count + fail_count,
            'success': success_count,
            'fail': fail_count,
            'logs': logs[-10:]
        })

    def record_fail(row, nama, email, role, reason):
        nonlocal fail_count
        fail_count += 1
        failed_row = row.copy()
        failed_row['_error_reason'] = reason
        failed_rows.append(failed_row)
        logs.append(f"❌ GAGAL [{nama or '?'} <{email or '?'}>]: {reason}")
        log_email_result(self.request.id, campaign_id, nama, email, role, 'failed', reason)
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
                folder_ids = {
                    k.strip().lower(): google_drive.extract_folder_id(v)
                    for k, v in links_dict.items() if str(v).strip()
                }
            except Exception:
                if isinstance(drive_links_json, str):
                    folder_ids = {'default': google_drive.extract_folder_id(drive_links_json)}

    except Exception as e:
        tb = _traceback.format_exc()
        logs.append(f"Gagal otentikasi API: {str(e)}\n{tb}")
        update_progress()
        return {'status': 'Failed', 'logs': logs, 'failed_rows': rows}

    temp_dir = os.path.join(os.path.dirname(__file__), 'temp_certs')
    os.makedirs(temp_dir, exist_ok=True)

    try:
        for i, row in enumerate(rows):
            nama = None
            email = None
            role = "Participant"

            for k, v in row.items():
                if not k:
                    continue
                k_lower = str(k).lower().strip()
                if k_lower in ['nama', 'name', 'full name', 'fullname', 'nama lengkap']:
                    nama = str(v).strip() if v else None
                elif k_lower in ['email', 'e-mail', 'email address', 'alamat email']:
                    email = str(v).strip() if v else None
                elif k_lower == 'role':
                    role = str(v).strip() if v else "Participant"

            # --- Validasi input ---
            if not nama or not email:
                record_fail(row, nama, email, role,
                    "Kolom nama atau email kosong / tidak ditemukan di dataset CSV")
                continue

            if '@' not in email or '.' not in email.split('@')[-1]:
                record_fail(row, nama, email, role,
                    f"Format email tidak valid: '{email}'")
                continue

            # --- Tentukan folder Drive berdasarkan role ---
            normalized_role = role.strip().lower()
            current_folder_id = None
            if folder_ids:
                current_folder_id = (
                    folder_ids.get(normalized_role)
                    or folder_ids.get('default')
                    or (list(folder_ids.values())[0] if folder_ids else None)
                )

            # --- Cari / download file lampiran ---
            save_path = None

            if campaign_type == 'surat':
                if surat_files_map:
                    # Mode upload lokal: cocokkan nama file (tanpa ekstensi) dengan nama penerima
                    nama_key = nama.strip().lower()
                    save_path = surat_files_map.get(nama_key)
                    if not save_path or not os.path.exists(save_path):
                        record_fail(row, nama, email, role,
                            f"File surat tidak ditemukan untuk '{nama}'. "
                            f"Pastikan ada file bernama '{nama}.pdf' di antara file yang diupload. "
                            f"Nama file harus sama persis (case-insensitive) dengan kolom nama di CSV.")
                        continue
                elif current_folder_id:
                    # Mode Google Drive folder: cari PDF by nama
                    logs.append(f"Mencari surat untuk '{nama}' di Google Drive...")
                    update_progress()
                    file_match = google_drive.find_file_in_drive(drive_service, current_folder_id, nama)
                    if not file_match:
                        record_fail(row, nama, email, role,
                            f"File PDF tidak ditemukan di folder Drive untuk '{nama}'. "
                            f"Pastikan ada file bernama '{nama}.pdf' di folder Drive tersebut.")
                        continue
                    file_id = file_match['id']
                    file_name = file_match['name']
                    save_path = os.path.join(temp_dir, file_name)
                    if not google_drive.download_file(drive_service, file_id, save_path):
                        record_fail(row, nama, email, role,
                            f"Gagal mengunduh file dari Google Drive untuk '{nama}'. "
                            f"Periksa koneksi atau izin akses folder Drive.")
                        continue

            else:
                # Mode sertifikat: cari di folder Drive per role
                if current_folder_id:
                    logs.append(f"Mencari sertifikat untuk '{nama}' ({role})...")
                    update_progress()
                    file_match = google_drive.find_file_in_drive(drive_service, current_folder_id, nama)
                    if not file_match:
                        record_fail(row, nama, email, role,
                            f"Sertifikat tidak ditemukan di Google Drive untuk '{nama}' (role: {role}). "
                            f"Pastikan nama file PDF sama persis dengan kolom nama di CSV.")
                        continue
                    file_id = file_match['id']
                    file_name = file_match['name']
                    save_path = os.path.join(temp_dir, file_name)
                    if not google_drive.download_file(drive_service, file_id, save_path):
                        record_fail(row, nama, email, role,
                            f"Gagal mengunduh sertifikat dari Google Drive untuk '{nama}'.")
                        continue

            # --- Kirim email ---
            actual_subject = subject_template.replace('{{nama}}', nama).replace('{{role}}', role)
            actual_body = body_template.replace('{{nama}}', nama).replace('{{role}}', role)

            message = mailer_svc.create_message(
                to_email=email,
                subject=actual_subject,
                html_body=actual_body,
                pdf_path=save_path,
                sender_name=config.SENDER_NAME,
                sender_email=config.SENDER_EMAIL
            )

            if mailer_svc.send_email(gmail_service, message):
                success_count += 1
                success_row = row.copy()
                success_row['_status'] = 'success'
                successful_rows.append(success_row)
                logs.append(f"✅ SUKSES: Email terkirim ke {nama} ({email})")
                log_email_result(self.request.id, campaign_id, nama, email, role, 'success')
            else:
                record_fail(row, nama, email, role,
                    f"Gmail API mengembalikan error saat mengirim ke '{email}'. "
                    f"Periksa apakah alamat email valid dan kuota Gmail belum habis.")

            # Hapus file temp setelah dikirim
            if save_path and os.path.exists(save_path):
                try:
                    os.remove(save_path)
                except Exception:
                    pass

            update_progress()
            time.sleep(random.randint(2, 5))

    except Exception as e:
        tb = _traceback.format_exc()
        logs.append(f"❌ FATAL ERROR: {str(e)}")
        logs.append(f"Detail: {tb}")
        update_progress()
        return {
            'status': 'Failed',
            'logs': logs,
            'failed_rows': failed_rows,
            'successful_rows': successful_rows
        }

    return {
        'total': total,
        'success': success_count,
        'fail': fail_count,
        'logs': logs,
        'failed_rows': failed_rows,
        'successful_rows': successful_rows
    }
