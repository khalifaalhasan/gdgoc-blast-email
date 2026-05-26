import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.exceptions import RefreshError
from app.core.config import config

def get_credentials():
    creds = None
    if os.path.exists(config.TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(config.TOKEN_PATH, config.SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except RefreshError:
                print("⚠️ Token lama kadaluwarsa atau scope berubah! Membuka browser untuk login ulang...")
                if os.path.exists(config.TOKEN_PATH):
                    os.remove(config.TOKEN_PATH)
                flow = InstalledAppFlow.from_client_secrets_file(config.CREDENTIALS_PATH, config.SCOPES)
                creds = flow.run_local_server(port=8080)
        else:
            flow = InstalledAppFlow.from_client_secrets_file(config.CREDENTIALS_PATH, config.SCOPES)
            creds = flow.run_local_server(port=8080)
        with open(config.TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
    return creds

def get_gmail_service():
    creds = get_credentials()
    return build('gmail', 'v1', credentials=creds)

def get_drive_service():
    creds = get_credentials()
    return build('drive', 'v3', credentials=creds)
