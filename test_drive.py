import sys, os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.infrastructure import google_auth, google_drive
from app.core.config import config

service = google_auth.get_drive_service()
folder_id = '1X46FzxY10AUSAvjesYB_vl9al-2q2W_N' # Let's assume this is the one
query = f"'{folder_id}' in parents and name contains 'Adelia' and trashed = false"
res = service.files().list(q=query, pageSize=5, fields="files(id, name, parents)").execute()
print(f"Query: {query}")
print("Results:")
for f in res.get('files', []):
    print(f"Name: {f['name']}, ID: {f['id']}, Parents: {f.get('parents')}")
