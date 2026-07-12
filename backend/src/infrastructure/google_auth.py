"""
infrastructure/google_auth.py

Infrastructure adapter untuk Google OAuth credentials.
Bertanggung jawab atas: ambil/refresh credentials, build Gmail/Drive service.

Yang TIDAK ada di sini (sudah dipindah ke repositories/system_config_repo.py):
- Semua DB access (_get_token_from_db, _save_token_to_db, _delete_token_from_db)

Infrastructure layer tidak boleh tahu tentang skema DB.
"""
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.exceptions import RefreshError

from src.core.config import config
from src.repositories.system_config_repo import get_system_config, set_system_config, delete_system_config

import json

_GOOGLE_TOKEN_KEY = "google_token"


def get_credentials() -> Credentials:
    """
    Ambil credentials Google dari DB.
    Jika token expired, coba refresh otomatis.
    Jika tidak bisa refresh (token hilang/dicabut), raise TokenMissingError.
    """
    creds = None
    token_data = get_system_config(_GOOGLE_TOKEN_KEY)

    if token_data:
        creds = Credentials.from_authorized_user_info(token_data, config.SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                set_system_config(_GOOGLE_TOKEN_KEY, json.loads(creds.to_json()))
            except RefreshError:
                delete_system_config(_GOOGLE_TOKEN_KEY)
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
    """Simpan credentials Google ke DB."""
    set_system_config(_GOOGLE_TOKEN_KEY, json.loads(creds.to_json()))


def check_token_status() -> dict:
    """
    Cek apakah token saat ini valid.
    Return dict {'valid': bool, 'message': str}.
    """
    token_data = get_system_config(_GOOGLE_TOKEN_KEY)
    if not token_data:
        return {"valid": False, "message": "Token tidak ditemukan. Login diperlukan."}

    try:
        creds = Credentials.from_authorized_user_info(token_data, config.SCOPES)
        if creds.valid:
            return {"valid": True, "message": "Token aktif dan valid."}
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            set_system_config(_GOOGLE_TOKEN_KEY, json.loads(creds.to_json()))
            return {"valid": True, "message": "Token berhasil di-refresh otomatis."}
        return {"valid": False, "message": "Token tidak valid. Login diperlukan."}
    except Exception as e:
        return {"valid": False, "message": f"Token error: {str(e)}"}


def get_gmail_service():
    """Build dan return Gmail API service."""
    creds = get_credentials()
    return build('gmail', 'v1', credentials=creds)


def get_drive_service():
    """Build dan return Google Drive API service."""
    creds = get_credentials()
    return build('drive', 'v3', credentials=creds)


class TokenMissingError(Exception):
    """Raised ketika token Google tidak ada atau tidak bisa di-refresh."""
    pass
