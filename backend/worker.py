import os
import time
import random
from celery import Celery
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

@celery_app.task(bind=True)
def blast_email_task(self, rows, drive_links_json, subject_template, body_template):
    total = len(rows)
    success_count = 0
    fail_count = 0
    logs = []

    failed_rows = []

    def update_progress():
        self.update_state(state='PROGRESS', meta={
            'total': total,
            'processed': success_count + fail_count,
            'success': success_count,
            'fail': fail_count,
            'logs': logs[-10:]
        })

    logs.append("Mempersiapkan otentikasi Google APIs...")
    update_progress()

    try:
        gmail_service = google_auth.get_gmail_service()
        drive_service = google_auth.get_drive_service()
        
        # Parse JSON link drive
        try:
            links_dict = json.loads(drive_links_json)
            folder_ids = {k: google_drive.extract_folder_id(v) for k, v in links_dict.items()}
        except Exception:
            # Fallback jika ternyata hanya 1 link biasa
            folder_ids = {'default': google_drive.extract_folder_id(drive_links_json)}
            
    except Exception as e:
        logs.append(f"Gagal otentikasi API: {str(e)}")
        update_progress()
        return {'status': 'Failed', 'logs': logs, 'failed_rows': rows}

    temp_dir = os.path.join(os.path.dirname(__file__), 'temp_certs')
    os.makedirs(temp_dir, exist_ok=True)

    try:
        for i, row in enumerate(rows):
            nama = row.get('Nama') or row.get('Name') or row.get('nama')
            email = row.get('Email') or row.get('email')
            role = row.get('Role', 'Participant')

            if not nama or not email:
                fail_count += 1
                failed_row = row.copy()
                failed_row['_error_reason'] = "Nama/Email kosong"
                failed_rows.append(failed_row)
                logs.append(f"Row {i+1} SKIP: Nama/Email kosong.")
                update_progress()
                continue
                
            # Dapatkan folder ID yang sesuai dengan Role (atau fallback ke default/pertama)
            current_folder_id = folder_ids.get(role) or folder_ids.get('default') or list(folder_ids.values())[0]

            logs.append(f"Mencari sertifikat untuk '{nama}' ({role})...")
            update_progress()
            
            file_match = google_drive.find_file_in_drive(drive_service, current_folder_id, nama)
            if not file_match:
                fail_count += 1
                failed_row = row.copy()
                failed_row['_error_reason'] = "Sertifikat tidak ditemukan di Drive"
                failed_rows.append(failed_row)
                logs.append(f"❌ GAGAL: Sertifikat tidak ditemukan di Drive untuk '{nama}'")
                update_progress()
                continue
                
            file_id = file_match['id']
            file_name = file_match['name']
            save_path = os.path.join(temp_dir, file_name)
            
            if not google_drive.download_file(drive_service, file_id, save_path):
                fail_count += 1
                failed_row = row.copy()
                failed_row['_error_reason'] = "Gagal mendownload sertifikat"
                failed_rows.append(failed_row)
                logs.append(f"❌ GAGAL: Gagal mendownload sertifikat untuk '{nama}'")
                update_progress()
                continue

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
                logs.append(f"✅ SUKSES: Email terkirim ke {nama} ({email})")
            else:
                fail_count += 1
                failed_row = row.copy()
                failed_row['_error_reason'] = "Gagal mengirim email (Cek alamat email valid)"
                failed_rows.append(failed_row)
                logs.append(f"❌ GAGAL: Gagal mengirim email ke {email}")

            try:
                os.remove(save_path)
            except:
                pass

            update_progress()
            time.sleep(random.randint(2, 5))
            
    except Exception as e:
        logs.append(f"❌ FATAL ERROR: {str(e)}")
        update_progress()
        return {'status': 'Failed', 'logs': logs, 'failed_rows': failed_rows}

    return {
        'total': total,
        'success': success_count,
        'fail': fail_count,
        'logs': logs,
        'failed_rows': failed_rows
    }

