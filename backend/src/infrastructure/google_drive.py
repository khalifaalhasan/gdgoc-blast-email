import io
import re
from googleapiclient.http import MediaIoBaseDownload
from src.infrastructure import google_auth

def extract_folder_id(drive_link):
    """
    Mengekstrak Folder ID dari URL Google Drive.
    Mengembalikan folder ID string, atau None jika link bukan folder Drive yang valid.
    """
    if not drive_link or not str(drive_link).strip():
        return None

    drive_link = str(drive_link).strip()

    # Format standar: https://drive.google.com/drive/folders/<ID>
    match = re.search(r"folders/([a-zA-Z0-9_-]+)", drive_link)
    if match:
        return match.group(1)

    # Format dengan query param: ?id=<ID> (biasanya untuk folder shared)
    match = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", drive_link)
    if match:
        return match.group(1)

    # ⚠️ JANGAN tangkap /file/d/<ID> — itu adalah link FILE, bukan FOLDER.
    # Jika URL mengandung /file/d/, ini adalah link file yang salah diinput sebagai folder.
    if re.search(r"/file/d/", drive_link):
        print(f"⚠️ extract_folder_id: URL yang diberikan adalah link FILE, bukan FOLDER: {drive_link}")
        return None

    # Jika string sudah berbentuk ID murni (tanpa http), kembalikan langsung
    if re.fullmatch(r"[a-zA-Z0-9_-]{20,}", drive_link):
        return drive_link

    # Tidak bisa mengenali format link ini
    print(f"⚠️ extract_folder_id: Tidak dapat mengenali format link Drive: {drive_link}")
    return None

def find_file_in_drive(service, folder_id, target_name):
    """
    Mencari file di dalam folder spesifik berdasarkan nama target.

    Strategi matching yang robust:
    - Hanya 2 KATA PERTAMA dari nama CSV yang dijadikan patokan matching.
      Contoh: "Riza Aqilah Nashifah" → patokan: ["riza", "aqilah"]
      Ini aman untuk kasus file bernama "Riza Aqilah_pembicara.pdf" atau "Riza Aqilah Nashifah.pdf".
    - Mendukung singkatan nama seperti "M." atau "M" (untuk "Muhammad", "Mohammad", dll):
      Singkatan 1 huruf dicocokkan prefix, bukan exact match.
      Contoh: "M. Ahmad" → "m" cocok dengan kata "muhamad" di nama file.
    - Ekstensi file (.pdf, .docx, dll) diabaikan saat matching.
    - Suffix ekstra seperti "_pembicara", "_speaker", "-WL2" di nama file diabaikan
      karena hanya 2 kata pertama yang dicek.

    PENTING: Tidak ada fallback ke Drive global — hanya cari di folder_id yang diberikan.
    """
    # Validasi folder_id — jangan lanjutkan jika tidak valid
    if not folder_id or not str(folder_id).strip():
        print(f"❌ find_file_in_drive: folder_id kosong atau None, pencarian dibatalkan.")
        return None

    # Pastikan folder_id bukan URL mentah (bisa terjadi jika extract_folder_id gagal)
    if str(folder_id).startswith('http'):
        print(f"❌ find_file_in_drive: folder_id masih berupa URL, bukan ID: {folder_id}")
        return None

    # --- Persiapan kata-kata dari nama target ---
    clean_target = target_name.strip().lower()
    # Ekstrak semua token (huruf/angka), abaikan titik, koma, tanda hubung, dll
    all_words = re.findall(r'[a-z0-9]+', clean_target)

    if not all_words:
        return None

    # Gunakan MAKSIMAL 2 KATA PERTAMA sebagai patokan
    # Ini mencegah perbedaan di kata ke-3+ (suffix/middle name) menyebabkan mismatch
    match_words = all_words[:2]

    # Pisahkan: kata penuh (len > 1) vs singkatan 1 huruf (misal "m" dari "M.")
    full_words   = [w for w in match_words if len(w) > 1]
    abbrev_words = [w for w in match_words if len(w) == 1]

    # --- Pilih kata untuk query Drive API ---
    # PENTING: Gunakan KATA PERTAMA (nama depan), BUKAN kata terpanjang.
    # Alasan: nama seperti "khalifa alhasan" di CSV mungkin jadi "khalifa al hasan" di Drive.
    # Jika query pakai "alhasan", Drive API text search tidak akan menemukan "al hasan"
    # (beda substring) → hasilnya 0 sebelum Python sempat filter.
    # Nama depan (kata pertama) hampir selalu muncul apa adanya di nama file.
    if full_words:
        query_word = full_words[0]  # kata pertama = nama depan, selalu verbatim di file
    else:
        # Semua kata di posisi 1-2 adalah singkatan — cari kata panjang dari kata ke-3+
        longer_candidates = [w for w in all_words[2:] if len(w) > 1]
        query_word = max(longer_candidates, key=len) if longer_candidates else all_words[0]

    # Query ketat: hanya cari di dalam folder_id yang diberikan
    query = f"'{folder_id}' in parents and name contains '{query_word}' and trashed = false"

    items_list = []
    page_token = None
    while True:
        try:
            res = service.files().list(
                q=query,
                pageSize=1000,
                fields="nextPageToken, files(id, name)",
                pageToken=page_token
            ).execute()
            items_list.extend(res.get('files', []))
            page_token = res.get('nextPageToken')
            if not page_token:
                break
        except Exception as e:
            print(f"❌ Drive API Error during search (folder_id={folder_id}): {e}")
            # Kembalikan None — TIDAK ada fallback ke pencarian global
            return None

    # ❌ TIDAK ADA fallback pencarian global.
    # Jika file tidak ditemukan di folder yang ditentukan, kembalikan None.

    try:
        for item in items_list:
            raw_name = item['name'].lower()  # case-insensitive: selalu lowercase

            # Hapus ekstensi file sebelum matching (misal .pdf, .docx, .png)
            filename_stem = re.sub(r'\.[a-z0-9]{2,5}$', '', raw_name)

            # Ekstrak token kata BERURUTAN dari nama file (urutan dipertahankan untuk merged check)
            file_tokens = re.findall(r'[a-z0-9]+', filename_stem)
            file_words_set = set(file_tokens)

            # === STRATEGI 1: Word-level exact match ===
            # Semua full_words harus ada sebagai token mandiri di nama file.
            # Contoh: CSV="riza aqilah" vs file="riza aqilah_pembicara" → ✅
            word_match = all(w in file_words_set for w in full_words)

            # === STRATEGI 2: Merged-string prefix match ===
            # Gabungkan semua token (hilangkan semua separator), lalu cek prefix.
            # Ini menangani perbedaan spasi/pemisah dalam nama gabungan:
            #   CSV:  "khalifa alhasan"  → full_words=["khalifa","alhasan"] → merged="khalifaalhasan"
            #   File: "khalifa al hasan_pembicara" → tokens=[khalifa,al,hasan,pembicara]
            #                                      → merged_file="khalifaalhasan pembicara"
            #   "khalifaalhasanpembicara".startswith("khalifaalhasan") → ✅
            merged_target = ''.join(full_words)   # "khalifaalhasan"
            merged_file   = ''.join(file_tokens)  # "khalifaalhasanpembicara"
            merged_match  = bool(merged_target) and merged_file.startswith(merged_target)

            # full_match jika salah satu strategi berhasil
            full_match = word_match or merged_match

            # === STRATEGI 3: Singkatan (1 huruf) — prefix matching ===
            # Singkatan seperti "M." → token "m" cocok dengan kata yang diawali "m"
            # Contoh: "m" cocok dengan "muhamad", "muhammad", "m"
            abbrev_match = all(
                any(fw.startswith(aw) for fw in file_words_set)
                for aw in abbrev_words
            )

            if full_match and abbrev_match:
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
