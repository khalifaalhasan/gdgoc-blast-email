import os
from pydantic_settings import BaseSettings

# BASE_DIR is backend folder (app/core/config.py -> core -> app -> backend)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    # --- PATH CONFIGURATION ---
    BASE_DIR: str = BASE_DIR
    ASSETS_DIR: str = os.path.join(BASE_DIR, 'assets')
    DATA_DIR: str = os.path.join(BASE_DIR, 'data')
    
    # File Paths
    CSV_FILE: str = os.path.join(DATA_DIR, 'recipients.csv')
    CERTIFICATES_DIR: str = os.path.join(ASSETS_DIR, 'certificates')
    TOKEN_PATH: str = os.path.join(BASE_DIR, 'token.json')
    CREDENTIALS_PATH: str = os.path.join(BASE_DIR, 'credentials.json')
    
    # --- EMAIL CONFIGURATION ---
    SENDER_NAME: str = "GDG on Campus UNSRI"
    SENDER_EMAIL: str = "dscunsri@gmail.com"  
    
    # --- GOOGLE API ---
    SCOPES: list[str] = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/drive.readonly'
    ]
    
    # --- SYSTEM SETTINGS ---
    REDIS_URL: str = "redis://localhost:6379/0"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = os.path.join(BASE_DIR, '.env')
        env_file_encoding = 'utf-8'

config = Settings()