# GDGoC Blast Email - Backend API

Sistem backend ini dibangun untuk mengotomatisasi pengiriman e-certificate bagi peserta *event* secara massal (*bulk*). 
Dikembangkan dengan arsitektur **Clean Architecture (Domain-Driven Design)**, backend ini menggunakan **FastAPI**, **Celery**, dan **Redis** agar antrean email dapat berjalan secara *asynchronous* tanpa memberatkan server.

---

## 🏗️ Struktur Proyek (Clean Architecture)

```
backend/
├── app/                      
│   ├── api/                  # Layer Presentasi (Endpoints & HTTP Routes)
│   │   └── routes/
│   │       └── blast.py      # Endpoint utama (POST start, GET status)
│   ├── core/                 # Konfigurasi Inti (BaseSettings)
│   │   └── config.py         # Membaca variabel dari .env
│   ├── infrastructure/       # External APIs (Google Auth & Drive)
│   │   ├── google_auth.py
│   │   └── google_drive.py
│   ├── schemas/              # Pydantic Models (Validasi Input)
│   │   └── certificate.py
│   └── services/             # Business Logic Layer
│       ├── certificate_svc.py# Logika generate template
│       └── mailer_svc.py     # Logika pembuatan & pengiriman email
├── temp_certs/               # Folder dinamis tempat sertifikat sementara diunduh dari Drive
├── main.py                   # Entry point aplikasi (Inisialisasi FastAPI)
├── worker.py                 # File eksekusi untuk Celery (Message Broker)
├── .env.example              # Referensi environment (Local)
├── .env.production.example   # Referensi environment (Production VPS)
└── requirements.txt
```

---

## ⚙️ Prasyarat (Prerequisites)
Pastikan server/lokal Anda memiliki:
1. **Python 3.10+**
2. **Redis Server** (Bisa di-install langsung atau menggunakan Docker via `docker-compose.yml` di root proyek).
3. **Google API Credentials**:
   - `credentials.json` (File OAuth 2.0 Client ID dari Google Cloud Console).
   - `token.json` (File yang akan otomatis dihasilkan setelah Anda login pertama kali).

*Harap menaruh file `credentials.json` dan `token.json` di root directory folder `backend/`!*

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Instalasi Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Setup Environment Variables
Buat file `.env` (bisa di-*copy* dari `.env.example`):
```bash
cp .env.example .env
```
Sesuaikan nilainya, terutama `REDIS_URL`. Jika Redis dijalankan di localhost, biarkan saja. Jika menggunakan *Docker Network* atau *Managed Redis*, sesuaikan URL-nya.

### 3. Menjalankan Message Broker (Redis)
Jika belum memiliki Redis, jalankan via Docker di root:
```bash
docker-compose up -d redis
```

### 4. Menjalankan Celery Worker
Buka terminal baru, masuk ke folder `backend`, dan jalankan:
```bash
celery -A worker.celery_app worker --loglevel=info
```
Celery *worker* harus selalu berjalan di *background*. Aplikasi inilah yang mengeksekusi pengiriman ratusan email secara mandiri.

### 5. Menjalankan FastAPI Server
Buka terminal baru, masuk ke folder `backend`, dan jalankan:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Alternatif: Anda juga bisa menjalankan `python main.py` langsung.

---

## ⚡ Shortcuts Menggunakan Makefile
Untuk mempermudah pekerjaan sehari-hari, telah disediakan `Makefile` di root proyek. Karena Anda menggunakan Podman, default engine-nya sudah diset ke `podman`.
Kembali ke **root folder proyek**, Anda bisa menggunakan perintah-perintah praktis berikut:

- `make redis-up` : Menyalakan Redis container via podman-compose.
- `make redis-down` : Mematikan Redis.
- `make backend` : Menjalankan FastAPI server.
- `make worker` : Menjalankan Celery worker.
- `make frontend` : Menjalankan UI Next.js.
- `make dev-backend` : Menjalankan Backend & Worker sekaligus.

*(Cukup ketik `make help` untuk melihat seluruh daftarnya).*

---

## 📖 Swagger Documentation & API Usage

Backend ini menggunakan **FastAPI**, sehingga dokumentasi interaktif **Swagger UI** (OpenAPI) sudah otomatis ter-generate.

Untuk melihat dan menguji endpoint API, buka browser dan navigasikan ke:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Ringkasan Endpoint

1. **`POST /api/campaign/start`**
   - **Tujuan:** Memulai campaign blast email.
   - **Input (Multipart/Form-Data):** 
     - `file`: File CSV (Kolom minimal: Nama, Email).
     - `drive_link`: Link folder Google Drive yang berisi kumpulan sertifikat (format file harus menyertakan nama peserta di CSV).
     - `subject_template`: Teks judul email (contoh: `Sertifikat untuk {{nama}}`).
     - `body_template`: HTML body email (mendukung tag {{nama}}, {{role}}).
   - **Output:** Menghasilkan `task_id`.

2. **`GET /api/campaign/status/{task_id}`**
   - **Tujuan:** Mengetahui progress realtime (0% - 100%) dari campaign.
   - **Output:** Status progress (Jumlah total, sukses, gagal, dan 10 log realtime terakhir untuk ditampilkan di UI).

---

## 🛠 Panduan Untuk *Maintainer* (Legacy Organisasi)

Jika di tahun kepengurusan selanjutnya Anda perlu menambah fitur, berikut panduannya:
- **Ingin menambah variabel dinamis baru?**
  Misalnya ingin mengganti `{{universitas}}`, cukup tambahkan `.replace('{{universitas}}', ...)` di `backend/worker.py` pada bagian *Templating Sederhana*.
- **Ingin mengganti domain web API?**
  Cukup ubah `FRONTEND_URL` di file `.env` pada server production Anda agar tidak terkena *CORS Block*.
- **Sertifikat sering gagal terkirim (Rate Limit Gmail)?**
  Google secara *default* memiliki batasan 500 email per hari untuk akun gratis. Pastikan jarak (delay) di dalam file `worker.py` `time.sleep(random.randint(2, 5))` tidak dihapus, karena fungsinya menghindari deteksi SPAM.

-- **Dikembangkan oleh Tim GDGoC UNSRI** --
