import os
import base64
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from src import config

def get_gmail_service():
    """Melakukan otentikasi ke Google API"""
    creds = None
    if os.path.exists(config.TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(config.TOKEN_PATH, config.SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(config.CREDENTIALS_PATH, config.SCOPES)
            creds = flow.run_local_server(port=8080)
        with open(config.TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def create_message(to_email, subject, html_body, pdf_path):
    """
    Membuat objek email (Hanya berisi HTML Body dan PDF Attachment).
    Sangat ringan dan clean karena gambar dipanggil via URL internet.
    """
    # Root message (mixed) untuk menampung konten utama dan lampiran PDF
    msg_root = MIMEMultipart('mixed')
    msg_root['to'] = to_email
    msg_root['from'] = f"{config.SENDER_NAME} <{config.SENDER_EMAIL}>"
    msg_root['subject'] = subject

    # 1. Attach HTML Body langsung ke Root
    msg_html = MIMEText(html_body, 'html')
    msg_root.attach(msg_html)

    # 2. Attach PDF Sertifikat
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
        print(f"   ❌ API Error: {e}")
        return False