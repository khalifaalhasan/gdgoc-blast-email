import csv
import time
import random
import os
import glob
from src import config, mailer, template

def find_certificate(name):
    """
    Mencari file PDF di folder certificates yang namanya mengandung string 'name'.
    Case insensitive (Budi.pdf akan ketemu walau inputnya BUDI).
    """
    search_pattern = os.path.join(config.CERTIFICATES_DIR, "*.png")
    files = glob.glob(search_pattern)
    
    # Bersihkan nama target (hapus spasi berlebih, lowercase)
    target_name = name.strip().lower()
    
    for file_path in files:
        filename = os.path.basename(file_path).lower()
        # Logika Matching: Apakah 'nama di csv' ada di dalam 'nama file pdf'?
        # Contoh: CSV="Budi Santoso", File="Sertifikat Budi Santoso.pdf" -> MATCH
        if target_name in filename:
            return file_path
            
    return None

def main():
    print("🚀 MEMULAI BLAST EMAIL GDGoC UNSRI...")
    print(f"📂 Asset Folder: {config.ASSETS_DIR}")
    
    # 1. Login Gmail
    service = mailer.get_gmail_service()
    print("✅ Login Berhasil!")

    # 2. Baca CSV
    try:
        with open(config.CSV_FILE, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            total = len(rows)
            print(f"📊 Total Data: {total} penerima\n")

            for i, row in enumerate(rows):
                # Ambil data (Handle jika nama kolom beda huruf besar/kecil)
                # Pastikan CSV header: Nama, Email, Role
                nama = row.get('Nama') or row.get('Name')
                email = row.get('Email')
                role = row.get('Role', 'Participant') # Default Participant

                if not nama or not email:
                    print(f"⚠️  Row {i+1} SKIP: Data Nama/Email kosong.")
                    continue

                print(f"[{i+1}/{total}] Processing: {nama} ({email})...")

                # 3. Cari Sertifikat
                pdf_path = find_certificate(nama)
                
                if not pdf_path:
                    print(f"   ❌ GAGAL: Sertifikat tidak ditemukan untuk '{nama}'")
                    # Bisa tambahkan logic catat log error ke file lain disini
                    continue

                # 4. Siapkan Email
                html_body = template.get_certificate_email_body(nama, role, certificate_link=pdf_path)
                message = mailer.create_message(
                    to_email=email, 
                    subject=config.EMAIL_SUBJECT, 
                    html_body=html_body, 
                    pdf_path=pdf_path
                )

                # 5. Kirim!
                # UNCOMMENT BARIS DI BAWAH INI UNTUK MENGIRIM BENERAN
                success = mailer.send_email(service, message)
                
                if success:
                    print(f"   ✅ Email Terkirim + Attach: {os.path.basename(pdf_path)}")
                
                # 6. Jeda Anti-Spam
                sleep_time = random.randint(3, 6)
                time.sleep(sleep_time)

    except FileNotFoundError:
        print(f"❌ ERROR: File CSV tidak ditemukan di {config.CSV_FILE}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    main()