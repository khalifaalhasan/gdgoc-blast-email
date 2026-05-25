import os
import base64
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from src import google_auth

def get_gmail_service():
    """Wrapper untuk memanggil service dari google_auth"""
    return google_auth.get_gmail_service()

def create_message(to_email, subject, html_body, pdf_path=None, sender_name="Sistem Bulk Email", sender_email="sender@gmail.com"):
    """
    Membuat objek email secara dinamis (Hanya berisi HTML Body dan Opsional Attachment).
    """
    msg_root = MIMEMultipart('mixed')
    msg_root['to'] = to_email
    msg_root['from'] = f"{sender_name} <{sender_email}>"
    msg_root['subject'] = subject

    # 1. Attach HTML Body
    msg_html = MIMEText(html_body, 'html')
    msg_root.attach(msg_html)

    # 2. Attach PDF/File Sertifikat (jika ada)
    if pdf_path and os.path.exists(pdf_path):
        ctype, encoding = mimetypes.guess_type(pdf_path)
        if ctype is None or encoding is not None:
            ctype = 'application/octet-stream'
        maintype, subtype = ctype.split('/', 1)

        with open(pdf_path, 'rb') as f:
            msg_pdf = MIMEBase(maintype, subtype)
            msg_pdf.set_payload(f.read())
        
        encoders.encode_base64(msg_pdf)
        filename = os.path.basename(pdf_path)
        msg_pdf.add_header('Content-Disposition', 'attachment', filename=filename)
        msg_root.attach(msg_pdf)

    return {'raw': base64.urlsafe_b64encode(msg_root.as_bytes()).decode()}

def send_email(service, message):
    try:
        service.users().messages().send(userId="me", body=message).execute()
        return True
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False