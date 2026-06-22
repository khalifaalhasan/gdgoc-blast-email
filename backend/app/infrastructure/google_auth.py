import os
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.exceptions import RefreshError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import config
from app.db.models import SystemConfig

# Setup koneksi sinkron ke database
db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/blast_email")
sync_db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def _get_token_from_db():
    with SessionLocal() as db:
        config_record = db.query(SystemConfig).filter(SystemConfig.key == "google_token").first()
        if config_record and config_record.value:
            return config_record.value
    return None

def _save_token_to_db(token_json: str):
    token_dict = json.loads(token_json)
    with SessionLocal() as db:
        config_record = db.query(SystemConfig).filter(SystemConfig.key == "google_token").first()
        if config_record:
            config_record.value = token_dict
        else:
            new_record = SystemConfig(key="google_token", value=token_dict)
            db.add(new_record)
        db.commit()

def _delete_token_from_db():
    with SessionLocal() as db:
        config_record = db.query(SystemConfig).filter(SystemConfig.key == "google_token").first()
        if config_record:
            db.delete(config_record)
            db.commit()

def get_credentials():
    """
    Ambil credentials Google. Jika token expired, coba refresh otomatis.
    Jika tidak bisa refresh (token hilang/dicabut), raise TokenMissingError
    agar caller tahu perlu trigger OAuth flow via /api/auth/google/login.
    """
    creds = None
    token_data = _get_token_from_db()

    if token_data:
        # Convert dictionary back to json string to create Credentials
        token_str = json.dumps(token_data)
        creds = Credentials.from_authorized_user_info(token_data, config.SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                _save_token_to_db(creds.to_json())
            except RefreshError:
                _delete_token_from_db()
                raise TokenMissingError(
                    "Token Google kadaluwarsa dan tidak bisa di-refresh. "
                    "Silakan login ulang melalui /api/auth/google/login"
                )
        else:
            raise TokenMissingError(
                "Token Google tidak ditemukan. "
                "Silakan login melalui /api/auth/google/login"
            )

    return creds

def save_credentials(creds: Credentials):
    """Simpan credentials ke database (SystemConfig)."""
    _save_token_to_db(creds.to_json())

def check_token_status() -> dict:
    """
    Cek status token saat ini.
    Return dict dengan 'valid' (bool) dan 'message'.
    """
    token_data = _get_token_from_db()
    if not token_data:
        return {"valid": False, "message": "Token tidak ditemukan. Login diperlukan."}

    try:
        creds = Credentials.from_authorized_user_info(token_data, config.SCOPES)
        if creds.valid:
            return {"valid": True, "message": "Token aktif dan valid."}
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            _save_token_to_db(creds.to_json())
            return {"valid": True, "message": "Token berhasil di-refresh otomatis."}
        return {"valid": False, "message": "Token tidak valid. Login diperlukan."}
    except Exception as e:
        return {"valid": False, "message": f"Token error: {str(e)}"}

def get_gmail_service():
    creds = get_credentials()
    return build('gmail', 'v1', credentials=creds)

def get_drive_service():
    creds = get_credentials()
    return build('drive', 'v3', credentials=creds)

class TokenMissingError(Exception):
    """Raised ketika token Google tidak ada atau tidak bisa di-refresh."""
    pass
