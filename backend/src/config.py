import os

# --- PATH CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
DATA_DIR = os.path.join(BASE_DIR, 'data')

# File Paths
CSV_FILE = os.path.join(DATA_DIR, 'recipients.csv')
CERTIFICATES_DIR = os.path.join(ASSETS_DIR, 'certificates')
HEADER_IMG = os.path.join(ASSETS_DIR, 'header.png')
FOOTER_IMG = os.path.join(ASSETS_DIR, 'footer.png')
TOKEN_PATH = os.path.join(BASE_DIR, 'token.json')
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'credentials.json')

# --- EMAIL CONFIGURATION ---
SENDER_NAME = "GDG on Campus UNSRI"
SENDER_EMAIL = "dscunsri@gmail.com"  
EMAIL_SUBJECT = "E-Certificate: Gamejam 2026 Participation"

# --- GOOGLE API ---
SCOPES = ['https://www.googleapis.com/auth/gmail.send']


# --- SOCIAL MEDIA LINKS ---
LINK_INSTAGRAM = "https://www.instagram.com/gdgunsri/"
LINK_WEBSITE = "https://linktr.ee/gdgunsri"
LINK_LINKEDIN = "https://www.linkedin.com/company/gdgunsri/"
LINK_TIKTOK = "https://www.tiktok.com/@gdgunsri"

URL_HEADER = "https://khalifaalhasan.vercel.app/gdg/headergdgijo2.jpg"
URL_ICON = "https://khalifaalhasan.vercel.app/gdg/icongdgijo2.png"

# --- FOOTER ASSETS ---
LOGO_GDG = os.path.join(ASSETS_DIR, 'icon.png') 
ICON_DOWNLOAD = os.path.join(ASSETS_DIR, 'icon.png') 
ICON_DRIVE = os.path.join(ASSETS_DIR, 'icon.png')       
ICON_PHOTOS = os.path.join(ASSETS_DIR, 'icon.png')     