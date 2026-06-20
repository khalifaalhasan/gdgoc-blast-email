import io
import re
from googleapiclient.http import MediaIoBaseDownload
from app.infrastructure import google_auth

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
    # Bersihkan target name dan pecah jadi kata-kata (hanya ambil huruf/angka)
    clean_target = target_name.strip().lower()
    target_words = set(re.findall(r'[a-z0-9]+', clean_target))
    
    if not target_words:
        return None

    # Pilih kata pencarian terpanjang agar filter API efektif
    longest_word = max(list(target_words), key=len)
    
    # Query untuk mencari file di dalam folder
    query = f"'{folder_id}' in parents and name contains '{longest_word}' and trashed = false"
    
    def fetch_items(q):
        items_list = []
        page_token = None
        while True:
            try:
                res = service.files().list(
                    q=q, 
                    pageSize=1000,
                    fields="nextPageToken, files(id, name)",
                    pageToken=page_token
                ).execute()
                items_list.extend(res.get('files', []))
                page_token = res.get('nextPageToken')
                if not page_token:
                    break
            except Exception as e:
                print(f"❌ Drive API Error during search: {e}")
                break
        return items_list

    items = fetch_items(query)
    
    # Jika tidak ketemu di dalam folder spesifik, mungkin ada di subfolder atau link salah.
    # Kita lakukan pencarian fallback (seluruh drive)
    if not items:
        fallback_query = f"name contains '{longest_word}' and trashed = false"
        items = fetch_items(fallback_query)
        
    try:
        for item in items:
            filename = item['name'].lower()
            # Pecah nama file jadi kumpulan kata (pisahkan spasi, _, -, dll)
            file_words = set(re.findall(r'[a-z0-9]+', filename))
            
            # Cek apakah SEMUA kata di target ada di dalam file
            if target_words.issubset(file_words):
                return item
        return None
    except Exception as e:
        print(f"❌ Drive Search Error: {e}")
        raise RuntimeError(f"Google Drive API Error: {str(e)}")

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
        raise RuntimeError(f"Google Drive Download Error: {str(e)}")
