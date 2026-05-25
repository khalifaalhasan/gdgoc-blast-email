import io
import re
from googleapiclient.http import MediaIoBaseDownload
from src import google_auth

def extract_folder_id(drive_link):
    """Mengekstrak Folder ID dari URL Google Drive."""
    match = re.search(r"folders/([a-zA-Z0-9_-]+)", drive_link)
    if match:
        return match.group(1)
    
    # Format lain seperti id=...
    match = re.search(r"id=([a-zA-Z0-9_-]+)", drive_link)
    if match:
        return match.group(1)
        
    return drive_link # Jika ternyata sudah ID

def find_file_in_drive(service, folder_id, target_name):
    """
    Mencari file di dalam folder spesifik yang namanya mengandung target_name.
    """
    # Bersihkan target name
    clean_target = target_name.strip().lower()
    
    # Query untuk mencari file di dalam folder (menggunakan contains)
    # Catatan: Drive API tidak support pure case-insensitive contains via API secara presisi,
    # kita ambil semua file di folder, lalu filter di Python.
    query = f"'{folder_id}' in parents and trashed = false"
    
    try:
        results = service.files().list(q=query, fields="nextPageToken, files(id, name)").execute()
        items = results.get('files', [])
        
        for item in items:
            filename = item['name'].lower()
            if clean_target in filename:
                return item
        return None
    except Exception as e:
        print(f"❌ Drive Search Error: {e}")
        return None

def download_file(service, file_id, save_path):
    """
    Mengunduh file dari Drive ke path lokal.
    """
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.FileIO(save_path, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        return True
    except Exception as e:
        print(f"❌ Download Error: {e}")
        return False
