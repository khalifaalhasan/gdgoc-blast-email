"""
infrastructure/gmail_adapter.py

Adapter untuk Gmail API — infrastructure layer, bukan service.
Bertanggung jawab hanya atas: build MIME message dan kirim via Gmail API.

Sebelumnya ini ada di app/services/mailer_svc.py — nama dan lokasi keliru
karena tidak ada business logic di sini, hanya wrap external API.
"""
import os
import time
import base64
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from googleapiclient.errors import HttpError

# Status HTTP yang biasanya hilang sendiri kalau dicoba lagi
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 3
BACKOFF_SECONDS = (2, 5)

# Penanda error "kuota kirim harian habis" dari Gmail API — percuma di-retry
QUOTA_MARKERS = ('dailylimitexceeded', 'daily user sending limit', 'sending limit exceeded')


class GmailSendError(Exception):
    """Gagal kirim email. quota_exceeded=True berarti kuota harian Gmail habis."""

    def __init__(self, message, quota_exceeded=False):
        super().__init__(message)
        self.quota_exceeded = quota_exceeded


def create_message(
    to_email: str,
    subject: str,
    html_body: str,
    pdf_path: str = None,
    sender_name: str = "Sistem Bulk Email",
    sender_email: str = "sender@gmail.com",
) -> dict:
    """
    Membuat objek email (MIME) dengan HTML body dan opsional attachment file.
    Return dict {'raw': <base64url encoded string>} siap dikirim via Gmail API.
    """
    msg_root = MIMEMultipart('mixed')
    msg_root['to'] = to_email
    msg_root['from'] = f"{sender_name} <{sender_email}>"
    msg_root['subject'] = subject

    # HTML body
    msg_root.attach(MIMEText(html_body, 'html'))

    # Attachment (opsional: PDF sertifikat/surat)
    if pdf_path and os.path.exists(pdf_path):
        ctype, encoding = mimetypes.guess_type(pdf_path)
        if ctype is None or encoding is not None:
            ctype = 'application/octet-stream'
        maintype, subtype = ctype.split('/', 1)

        with open(pdf_path, 'rb') as f:
            msg_pdf = MIMEBase(maintype, subtype)
            msg_pdf.set_payload(f.read())

        encoders.encode_base64(msg_pdf)
        msg_pdf.add_header('Content-Disposition', 'attachment', filename=os.path.basename(pdf_path))
        msg_root.attach(msg_pdf)

    return {'raw': base64.urlsafe_b64encode(msg_root.as_bytes()).decode()}


def _is_quota_error(error: HttpError) -> bool:
    return any(marker in str(error).lower() for marker in QUOTA_MARKERS)


def send_email(gmail_service, message: dict, sleep=time.sleep) -> None:
    """
    Kirim email menggunakan Gmail API service object.

    Error sementara (429/5xx, koneksi putus) dicoba ulang sampai MAX_ATTEMPTS kali.
    Raise GmailSendError jika tetap gagal; quota_exceeded=True jika kuota harian habis.
    """
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            gmail_service.users().messages().send(userId="me", body=message).execute()
            return
        except HttpError as e:
            print(f"❌ Gmail API Error (percobaan {attempt}/{MAX_ATTEMPTS}): {e}")
            if _is_quota_error(e):
                raise GmailSendError(f"Kuota kirim harian Gmail habis: {e}", quota_exceeded=True)
            if e.resp.status not in RETRYABLE_STATUSES or attempt == MAX_ATTEMPTS:
                raise GmailSendError(f"Gmail API error {e.resp.status}: {e}")
        except (OSError, TimeoutError) as e:
            print(f"❌ Koneksi ke Gmail API gagal (percobaan {attempt}/{MAX_ATTEMPTS}): {e}")
            if attempt == MAX_ATTEMPTS:
                raise GmailSendError(f"Koneksi ke Gmail API gagal: {e}")
        sleep(BACKOFF_SECONDS[min(attempt - 1, len(BACKOFF_SECONDS) - 1)])
