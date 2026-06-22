# 📧 GDGoC Certificate Blast Mailer

Tools otomatisasi berbasis **Python** untuk mengirimkan **E-Sertifikat
massal** kepada peserta/panitia acara **GDG on Campus Universitas
Sriwijaya**.

Script ini telah di-refactor menggunakan prinsip **Clean Architecture**
untuk memisahkan konfigurasi, logika email, dan template.

------------------------------------------------------------------------

## 🚀 Fitur Utama

### ✅ Smart PDF Matching

Otomatis mencocokkan file PDF di folder `assets/certificates/`
berdasarkan nama peserta di CSV.\
Tidak perlu input link manual.

### ✅ Local Attachment

Mengirim file PDF sebagai lampiran fisik (bukan link Drive), memastikan
penerima bisa langsung mengunduh file tanpa masalah izin akses.

### ✅ Embedded Images (CID)

Header dan Logo dikirim sebagai inline image agar tampilan email rapi
dan profesional di semua klien email.

### ✅ Anti-Spam Mechanism

Menggunakan random delay antar pengiriman untuk menghindari rate limit
atau blokir dari Gmail.

### ✅ Modular & Configurable

Pengaturan folder, subject, dan sender terpusat di `src/config.py`.

------------------------------------------------------------------------

## 📂 Struktur Project

    ├── 📁 assets
    │   ├── 📁 certificates      # Taruh semua file PDF sertifikat di sini
    │   │   └── 📕 Sertifikat Budi Santoso.pdf
    │   ├── 🖼️ header.png        # Gambar Header Email (600px width recommended)
    │   └── 🖼️ logo.png          # Logo Footer/Signature
    ├── 📁 data
    │   └── 📄 recipients.csv    # Database penerima (Format: Nama, Email, Role)
    ├── 📁 src
    │   ├── 🐍 config.py         # Konfigurasi path & variabel global
    │   ├── 🐍 mailer.py         # Logic autentikasi & pengiriman Gmail API
    │   └── 🐍 template.py       # Render HTML body email
    ├── ⚙️ .gitignore
    ├── 📝 README.md
    └── 🐍 main.py               # Entry point (Jalankan file ini)

------------------------------------------------------------------------

## 🛠️ Prasyarat

-   Python 3.8+ terinstall
-   Google Cloud Credentials: `credentials.json` (OAuth Client ID -
    Desktop App)
-   Data Sertifikat: Pastikan nama file PDF mengandung nama peserta
    (Case-insensitive)

Contoh:\
Peserta **"Budi Santoso"** → File **"Sertifikat Budi Santoso.pdf"**
(Akan terdeteksi)

------------------------------------------------------------------------

## 📦 Instalasi

### 1️⃣ Clone Repository & Masuk ke Direktori

``` bash
git clone [REPO_URL]
cd gdgoc-boilerplate-blast-email
```

### 2️⃣ Buat Virtual Environment (Recommended)

``` bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3️⃣ Install Dependencies

``` bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 4️⃣ Setup Auth

Letakkan file `credentials.json` di root folder project.

------------------------------------------------------------------------

## ⚙️ Persiapan Data (`data/recipients.csv`)

Pastikan file CSV memiliki header berikut (Case-sensitive sesuai script
`main.py`):

    Nama,Email,Role

Contoh:

    Nama,Email,Role
    Budi Santoso,budi@gmail.com,Participant
    Siti Aminah,siti@yahoo.com,Committee

📌 Catatan:\
Kolom **Role** digunakan untuk menyesuaikan isi body email\
(Misal: *"Thank you for joining as a Participant"*).

------------------------------------------------------------------------

## 🚀 Cara Menjalankan

1.  Pastikan semua aset (PDF & Gambar) sudah lengkap di folder `assets/`
2.  Jalankan perintah:

``` bash
python main.py
```

3.  Login:\
    Saat pertama kali dijalankan, browser akan terbuka untuk login akun
    Gmail pengirim.

4.  Verifikasi:\
    Script akan mencetak log proses di terminal.

```{=html}
<!-- -->
```
    ✅  → Email terkirim
    ❌  → File PDF tidak ditemukan atau email invalid

------------------------------------------------------------------------

## ⚠️ Troubleshooting

### 🔐 Token Expired

Jika terjadi error autentikasi, hapus file `token.json` (jika ada), lalu
jalankan ulang script untuk login kembali.

### 📄 File Not Found

Pastikan nama di CSV tidak mengandung typo dibandingkan nama file PDF.\
Script menggunakan pencarian substring (misal: "Budi" di CSV akan cocok
dengan "Sertifikat Budi.pdf").

### 📊 Quota Exceeded

Gmail API membatasi pengiriman sekitar ±500 email/hari untuk akun gratis
(non-Workspace).

------------------------------------------------------------------------

## 👨‍💻 Maintainer

**Backend Division**\
GDG on Campus Universitas Sriwijayaa
