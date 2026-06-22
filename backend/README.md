# GDGoC Blast Email — Backend API

Sistem backend untuk mengotomatisasi pengiriman email massal (*blast*) beserta lampiran PDF (sertifikat/surat) kepada peserta *event*. Dibangun dengan arsitektur **Clean Architecture**, menggunakan **FastAPI**, **Celery**, dan **Redis** agar proses pengiriman ratusan email berjalan secara *asynchronous* tanpa membekukan server.

---

## 🗂️ Penjelasan Struktur Folder

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   ├── core/
│   ├── db/
│   ├── infrastructure/
│   ├── schemas/
│   └── services/
├── alembic/
│   └── versions/
├── assets/
├── data/
├── temp_certs/
├── main.py
├── worker.py
└── requirements.txt
```

---

### 📁 `app/` — Inti Aplikasi

Seluruh logika aplikasi tinggal di sini. Dibagi menjadi beberapa sub-folder sesuai tanggung jawabnya masing-masing (prinsip *Separation of Concerns*).

---

#### 📁 `app/api/routes/` — HTTP Endpoints (Layer Presentasi)

Tempat semua **route/endpoint API** didefinisikan. Setiap file mewakili satu kelompok fitur.

| File | Fungsi |
|---|---|
| `blast.py` | Endpoint utama blast email: `POST /api/campaign/start` (mulai blast), `GET /api/campaign/status/{task_id}` (cek progress), `POST /api/campaign/test-email` (kirim email uji coba) |
| `campaigns.py` | CRUD untuk data Campaign yang disimpan di PostgreSQL: buat, baca, ubah, hapus campaign |
| `history.py` | Endpoint riwayat pengiriman: `GET /api/history/task/{task_id}`, `GET /api/history/campaign/{campaign_id}`, `GET /api/history/summary/task/{task_id}` |

> **Analogi:** Ini seperti "resepsionis" — hanya menerima request dari luar, lalu meneruskannya ke bagian yang tepat. Tidak ada logika bisnis di sini.

---

#### 📁 `app/core/` — Konfigurasi Inti

| File | Fungsi |
|---|---|
| `config.py` | Membaca semua environment variable dari file `.env` menggunakan Pydantic `BaseSettings`. Semua bagian aplikasi mengambil konfigurasi dari sini (misal: `REDIS_URL`, `DATABASE_URL`, `SENDER_EMAIL`). |

> **Analogi:** Ini seperti "buku pengaturan" — kalau mau ganti konfigurasi, cukup ubah `.env`, tidak perlu korek-korek kode.

---

#### 📁 `app/db/` — Database (PostgreSQL)

| File | Fungsi |
|---|---|
| `database.py` | Inisialisasi koneksi ke PostgreSQL menggunakan SQLAlchemy Async. Menyediakan `get_db()` sebagai dependency injection untuk setiap request API yang butuh akses DB. |
| `models.py` | Definisi tabel-tabel di database dalam bentuk class Python (ORM). Saat ini ada tiga tabel: **`Campaign`** (data campaign), **`TaskHistory`** (riwayat task Celery), **`EmailLog`** (log pengiriman per penerima — sukses/gagal). |

> **Analogi:** Ini seperti "blueprint gedung" — mendefinisikan bagaimana data disimpan dan diambil dari database.

---

#### 📁 `app/infrastructure/` — Integrasi Layanan Eksternal

Berisi kode yang berkomunikasi langsung dengan **Google API** (layanan pihak ketiga).

| File | Fungsi |
|---|---|
| `google_auth.py` | Menangani autentikasi OAuth 2.0 ke Google. Membaca `credentials.json` dan `token.json`, lalu mengembalikan *service object* untuk Gmail (`get_gmail_service()`) dan Google Drive (`get_drive_service()`). |
| `google_drive.py` | Logika operasi Google Drive: `extract_folder_id()` (ekstrak ID folder dari URL Drive), `find_file_in_drive()` (cari file PDF berdasarkan nama penerima di dalam folder), `download_file()` (unduh file PDF ke lokal sebelum dilampirkan ke email). |

> **Analogi:** Ini seperti "penerjemah" — menjembatani aplikasi kita dengan layanan Google agar keduanya bisa "bicara" satu sama lain.

---

#### 📁 `app/schemas/` — Validasi Data (Pydantic Models)

| File | Fungsi |
|---|---|
| `campaign.py` | Schema untuk validasi input/output API Campaign: `CampaignCreate`, `CampaignUpdate`, `CampaignResponse`. Digunakan oleh route `campaigns.py`. |
| `certificate.py` | Schema untuk data sertifikat (model Pydantic sederhana). |

> **Analogi:** Ini seperti "formulir resmi" — memastikan data yang masuk dan keluar sudah sesuai format yang diharapkan sebelum diproses lebih lanjut.

---

#### 📁 `app/services/` — Logika Bisnis (Business Logic Layer)

Berisi aturan dan proses inti aplikasi.

| File | Fungsi |
|---|---|
| `campaign_service.py` | Mengorkestrasi proses blast: mem-parsing JSON dari frontend, memvalidasi data, lalu mengirim task ke Celery worker via `.delay()`. Ini jembatan antara route API dan worker. |
| `certificate_svc.py` | Menyediakan fungsi `get_certificate_email_body()` yang merender template HTML email sertifikat (dengan warna tema, nama event, dll). |
| `mailer_svc.py` | Membangun objek email MIME (`create_message()`) yang berisi HTML body + lampiran PDF, lalu mengirimkannya via Gmail API (`send_email()`). |

> **Analogi:** Ini "dapur" dari aplikasi — di sinilah semua pekerjaan nyata dilakukan.

---

### 📁 `alembic/` — Migrasi Database

Mengelola perubahan skema database secara terstruktur dan terlacak (seperti *version control* untuk database).

| Sub-folder/File | Fungsi |
|---|---|
| `versions/` | Berisi file-file migrasi (tiap file = satu perubahan skema). Contoh: `add_email_logs_table.py` untuk menambah tabel `email_logs`. |
| `env.py` | Konfigurasi Alembic: menghubungkan Alembic ke database dan model SQLAlchemy kita. |

> **Cara pakai:** Jalankan `alembic upgrade head` untuk menerapkan semua migrasi yang belum dijalankan ke database.

---

### 📁 `assets/` — File Statis Lokal

Menyimpan file-file statis yang dibutuhkan aplikasi, misalnya gambar atau logo yang digunakan di dalam template email HTML.

---

### 📁 `data/` — Data Referensi / Seed

Folder untuk menyimpan file data contoh atau referensi (misal: file CSV template, data dummy untuk testing).

---

### 📁 `temp_certs/` — File Sementara (Temporary)

Folder ini **dibuat otomatis** saat runtime. Celery worker mengunduh file PDF dari Google Drive ke sini sebelum melampirkannya ke email. Setelah email terkirim, file di sini langsung dihapus otomatis oleh worker.

> ⚠️ **Jangan simpan file permanen di sini.** Folder ini bersifat *transient* dan isinya tidak perlu di-commit ke Git.

---

### 📄 File di Root `backend/`

| File | Fungsi |
|---|---|
| `main.py` | Entry point aplikasi FastAPI. Menginisialisasi app, mendaftarkan semua router (blast, campaigns, history), mengatur CORS, dan menjalankan `create_all` tabel DB saat startup. |
| `worker.py` | File eksekusi **Celery worker**. Berisi task `blast_email_task` yang memproses pengiriman email per penerima secara berurutan, mencatat hasilnya ke DB, dan melaporkan progress ke Redis. **Harus dijalankan sebagai proses terpisah.** |
| `requirements.txt` | Daftar seluruh dependensi Python yang dibutuhkan proyek. |
| `credentials.json` | File OAuth 2.0 dari Google Cloud Console. **Wajib ada, jangan di-commit ke Git.** |
| `token.json` | Token akses Google yang di-generate otomatis saat login pertama. **Jangan di-commit ke Git.** |
| `.env` | File environment variable (secret). Salin dari `.env.example`. **Jangan di-commit ke Git.** |

---

## ⚙️ Prasyarat (Prerequisites)

1. **Python 3.10+**
2. **PostgreSQL** — database utama untuk menyimpan campaign dan riwayat email
3. **Redis** — message broker untuk Celery (bisa via Docker)
4. **Google API Credentials**:
   - `credentials.json` (OAuth 2.0 Client ID dari Google Cloud Console)
   - `token.json` (di-generate otomatis saat login pertama)

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Instalasi Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env sesuai kebutuhan (DATABASE_URL, REDIS_URL, SENDER_EMAIL, dll)
```

### 3. Jalankan Database & Redis
```bash
# Dari root proyek
docker-compose up -d postgres redis
```

### 4. Jalankan Migrasi Database
```bash
alembic upgrade head
```

### 5. Jalankan Celery Worker (terminal terpisah)
```bash
# Dari root proyek (pakai Makefile)
make worker

# Atau manual
cd backend && ./venv/bin/celery -A worker.celery_app worker --loglevel=info
```

> ⚠️ **Penting:** Celery worker adalah proses terpisah dari FastAPI dan **tidak auto-reload**. Setiap kali `worker.py` diubah, worker harus di-restart manual (`Ctrl+C` lalu jalankan ulang).

### 6. Jalankan FastAPI Server (terminal terpisah)
```bash
make backend
# Atau: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## ⚡ Shortcut via Makefile

Dari **root folder proyek**:

| Perintah | Fungsi |
|---|---|
| `make backend` | Jalankan FastAPI server |
| `make worker` | Jalankan Celery worker |
| `make frontend` | Jalankan UI Next.js |
| `make redis-up` | Nyalakan Redis via container |
| `make redis-down` | Matikan Redis |
| `make dev-backend` | Backend + Worker sekaligus |

```bash
make help  # Lihat semua perintah yang tersedia
```

---

## 📖 API Endpoints

Dokumentasi interaktif Swagger tersedia di: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Blast Email

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/campaign/start` | Mulai blast email (multipart/form-data) |
| `GET` | `/api/campaign/status/{task_id}` | Cek progress blast realtime |
| `POST` | `/api/campaign/test-email` | Kirim email uji coba ke 1 alamat |

### Campaign Management

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/campaigns` | Daftar semua campaign |
| `POST` | `/api/campaigns` | Buat campaign baru |
| `GET` | `/api/campaigns/{id}` | Detail campaign |
| `PUT` | `/api/campaigns/{id}` | Update campaign |
| `DELETE` | `/api/campaigns/{id}` | Hapus campaign |

### Riwayat Pengiriman

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/history/task/{task_id}` | Semua log per task blast |
| `GET` | `/api/history/campaign/{campaign_id}` | Semua log per campaign (bisa filter `?status=failed`) |
| `GET` | `/api/history/summary/task/{task_id}` | Ringkasan sukses/gagal + detail error per task |

---

## 🛠 Panduan untuk Maintainer

- **Menambah variabel dinamis di email?**
  Tambahkan `.replace('{{variabel_baru}}', nilai)` di `worker.py` bagian templating.

- **Ganti domain CORS?**
  Ubah `FRONTEND_URL` di `.env` production.

- **Email sering kena rate limit Gmail?**
  Jangan hapus `time.sleep(random.randint(2, 5))` di `worker.py`. Batas default Gmail: 500 email/hari untuk akun gratis.

- **Menambah tabel baru di database?**
  1. Tambahkan model baru di `app/db/models.py`
  2. Buat file migrasi: `alembic revision --autogenerate -m "deskripsi"`
  3. Terapkan: `alembic upgrade head`

---

*Dikembangkan oleh Tim GDGoC UNSRI*
