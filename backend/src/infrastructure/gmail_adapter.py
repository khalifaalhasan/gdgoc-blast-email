"""
infrastructure/gmail_adapter.py

Adapter untuk Gmail API — infrastructure layer, bukan service.
Bertanggung jawab hanya atas: build MIME message dan kirim via Gmail API.

Sebelumnya ini ada di app/services/mailer_svc.py — nama dan lokasi keliru
karena tidak ada business logic di sini, hanya wrap external API.
"""
import os
import base64
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders


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


def send_email(gmail_service, message: dict) -> bool:
    """
    Kirim email menggunakan Gmail API service object.
    Return True jika berhasil, False jika gagal.
    """
    try:
        gmail_service.users().messages().send(userId="me", body=message).execute()
        return True
    except Exception as e:
        print(f"❌ Gmail API Error: {e}")
        return False
