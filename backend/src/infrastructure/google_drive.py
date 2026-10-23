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

class AmbiguousFileMatch(Exception):
    """Raised ketika lebih dari satu file di folder Drive cocok dengan nama penerima."""

    def __init__(self, target_name, candidates):
        self.target_name = target_name
        self.candidates = candidates
        names = ", ".join(sorted(c['name'] for c in candidates))
        super().__init__(
            f"Ditemukan {len(candidates)} file yang cocok untuk '{target_name}': {names}. "
            f"Rapikan nama file di Drive agar hanya ada satu yang cocok."
        )


def _tokenize(text):
    """Lowercase + pecah jadi token huruf/angka. 'M. Rizki_Pembicara' → ['m', 'rizki', 'pembicara']."""
    return re.findall(r'[a-z0-9]+', str(text).lower())


def _file_tokens(filename):
    # Hapus ekstensi file sebelum matching (misal .pdf, .docx, .png)
    stem = re.sub(r'\.[a-z0-9]{2,5}$', '', filename.lower())
    return _tokenize(stem)


def _merged_prefix_match(target_words, file_tokens):
    """
    True jika gabungan target_words sama persis dengan gabungan N token pertama nama file.
    Menangani beda spasi: CSV "khalifa alhasan" vs file "khalifa al hasan_pembicara" → ✅
    Tapi TIDAK cocok di tengah kata: "muhammad rizki" vs "muhammad rizkiansyah" → ❌
    """
    merged_target = ''.join(target_words)
    if not merged_target:
        return False
    merged = ''
    for tok in file_tokens:
        merged += tok
        if merged == merged_target:
            return True
        if len(merged) >= len(merged_target):
            return False
    return False


def _words_match(target_words, file_tokens):
    """
    Semua kata target harus ada di nama file:
    - kata penuh (len > 1): sebagai token mandiri, atau lewat merged-prefix (beda spasi)
    - singkatan 1 huruf ("M." → "m"): cukup prefix dari salah satu token file ("muhammad")
    """
    full_words = [w for w in target_words if len(w) > 1]
    abbrev_words = [w for w in target_words if len(w) == 1]
    file_words_set = set(file_tokens)

    full_ok = (
        all(w in file_words_set for w in full_words)
        or _merged_prefix_match(full_words, file_tokens)
    )
    abbrev_ok = all(any(fw.startswith(aw) for fw in file_words_set) for aw in abbrev_words)
    return full_ok and abbrev_ok


def match_file(items, target_name, require_full_name=False):
    """
    Pilih SATU file dari `items` (list dict {'id', 'name'}) untuk `target_name`.

    Urutan prioritas:
    1. Exact  — nama file (tanpa ekstensi & tanda baca) sama persis dengan nama CSV.
    2. Full   — SEMUA kata nama CSV ada di nama file (suffix seperti "_pembicara" boleh).
    3. Partial — hanya 2 kata pertama yang cocok. Untuk kasus file "Riza Aqilah.pdf"
                 sedangkan di CSV "Riza Aqilah Nashifah". Dimatikan dengan
                 require_full_name=True (dipakai saat ada penerima lain dengan 2 kata
                 pertama yang sama, misal "Muhammad Rizki A" & "Muhammad Rizki B").

    Di setiap level: tepat 1 kandidat → dipakai, >1 kandidat → AmbiguousFileMatch,
    0 kandidat → lanjut ke level berikutnya. Tidak pernah "asal ambil yang pertama".
    Return None jika tidak ada yang cocok.
    """
    target_words = _tokenize(target_name.strip())
    if not target_words:
        return None

    tokenized = [(item, _file_tokens(item['name'])) for item in items]

    def pick(candidates):
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            raise AmbiguousFileMatch(target_name, candidates)
        return None

    exact = [item for item, toks in tokenized if ''.join(toks) == ''.join(target_words)]
    full = [item for item, toks in tokenized if _words_match(target_words, toks)]

    result = pick(exact) or pick(full)
    if result or require_full_name or len(target_words) <= 2:
        return result

    # Gunakan MAKSIMAL 2 KATA PERTAMA sebagai patokan
    partial = [item for item, toks in tokenized if _words_match(target_words[:2], toks)]
    return pick(partial)


def find_file_in_drive(service, folder_id, target_name, require_full_name=False):
    """
    Mencari file di dalam folder spesifik berdasarkan nama target.
    Aturan pemilihan file ada di match_file().

    Return dict {'id', 'name'} atau None jika tidak ditemukan.
    Raise AmbiguousFileMatch jika lebih dari satu file cocok.
    Raise RuntimeError jika Drive API error (bukan dianggap "tidak ditemukan").

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

    all_words = _tokenize(target_name.strip())
    if not all_words:
        return None

    # --- Pilih kata untuk query Drive API ---
    # PENTING: Gunakan KATA PERTAMA (nama depan), BUKAN kata terpanjang.
    # Alasan: nama seperti "khalifa alhasan" di CSV mungkin jadi "khalifa al hasan" di Drive.
    # Jika query pakai "alhasan", Drive API text search tidak akan menemukan "al hasan"
    # (beda substring) → hasilnya 0 sebelum Python sempat filter.
    full_words = [w for w in all_words[:2] if len(w) > 1]
    if full_words:
        query_word = full_words[0]
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
        except Exception as e:
            print(f"❌ Drive API Error during search (folder_id={folder_id}): {e}")
            raise RuntimeError(f"Google Drive API Error saat mencari file: {str(e)}")
        items_list.extend(res.get('files', []))
        page_token = res.get('nextPageToken')
        if not page_token:
            break

    return match_file(items_list, target_name, require_full_name=require_full_name)


def name_key(target_name):
    """Kunci 2 kata pertama, dipakai worker untuk mendeteksi penerima dengan awalan nama sama."""
    return ' '.join(_tokenize(target_name)[:2])

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
