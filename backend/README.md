# GDGoC Blast Email — Backend API

Sistem backend untuk mengotomatisasi pengiriman email massal (*blast*) beserta lampiran PDF (sertifikat/surat) kepada peserta *event*. Dibangun dengan arsitektur berlapis (*layered architecture*) menggunakan **FastAPI**, **Celery**, **Redis**, dan **PostgreSQL** agar proses pengiriman ratusan email berjalan secara *asynchronous* tanpa membekukan server.

---

## 🗂️ Penjelasan Struktur Folder

```
backend/
├── src/
│   ├── api/routes/       # HTTP endpoints
│   ├── core/             # Konfigurasi (.env)
│   ├── db/               # Koneksi & model database
│   ├── infrastructure/   # Adapter Google API (OAuth, Gmail, Drive)
│   ├── repositories/     # Akses database per tabel
│   ├── schemas/          # Validasi data (Pydantic)
│   ├── services/         # Logika bisnis
│   ├── worker/           # Celery app & task blast email
│   └── main.py           # Entry point FastAPI
├── alembic/versions/     # Migrasi database
├── tests/                # Unit test (pytest)
├── requirements.txt
└── requirements-dev.txt  # + pytest & watchdog untuk development
```

| Folder / File | Fungsi |
|---|---|
| `src/api/routes/` | `blast.py` (mulai blast, cek status, kirim email uji coba), `campaigns.py` (CRUD campaign), `history.py` (riwayat pengiriman), `auth.py` (login OAuth Google). Hanya menerima request lalu meneruskan ke service. |
| `src/core/config.py` | Membaca environment variable dari `.env` dengan Pydantic `BaseSettings` (`DATABASE_URL`, `REDIS_URL`, `SENDER_EMAIL`, dll). |
| `src/db/` | `database.py` (koneksi async SQLAlchemy) dan `models.py` (tabel `campaigns`, `email_logs`, `system_configs`). |
| `src/infrastructure/` | `google_auth.py` (ambil/refresh token OAuth yang disimpan di DB), `gmail_adapter.py` (bangun MIME + kirim via Gmail API, dengan retry), `google_drive.py` (cari & unduh PDF dari folder Drive berdasarkan nama penerima). |
| `src/repositories/` | Query DB per tabel: `campaign_repo.py`, `email_log_repo.py`, `system_config_repo.py`. |
| `src/services/campaign_service.py` | Validasi input blast lalu kirim task ke Celery, serta membaca status task. |
| `src/worker/tasks.py` | Task `blast_email_task`: untuk setiap baris CSV → cari PDF di Drive → kirim email → catat hasil ke `email_logs` → laporkan progress ke Redis. |
| `temp_certs/` | Dibuat otomatis saat runtime untuk menampung PDF yang diunduh dari Drive; file dihapus setelah diproses. Jangan di-commit. |

### Bagaimana PDF dicocokkan dengan penerima?

Worker mencari file di folder Drive milik role penerima (atau folder `default` / satu-satunya folder) dengan urutan:

1. **Exact** — nama file (tanpa ekstensi) sama dengan nama di CSV.
2. **Nama lengkap** — semua kata nama CSV ada di nama file (suffix seperti `_pembicara` boleh).
3. **2 kata pertama** — untuk nama file yang lebih pendek dari nama di CSV. Tidak dipakai jika ada penerima lain dengan 2 kata pertama yang sama.

Jika lebih dari satu file cocok, penerima ditandai **gagal** (bukan asal pilih). Campaign sertifikat tanpa PDF **tidak dikirim**.

---

## ⚙️ Prasyarat (Prerequisites)

1. **Python 3.10+**
2. **Docker** (untuk PostgreSQL & Redis)
3. **Google API Credentials**: `credentials.json` (OAuth 2.0 Client ID dari Google Cloud Console, format lihat `credentials-example.json`) diletakkan di `backend/credentials.json`. Untuk client tipe *Web application*, daftarkan redirect URI `http://localhost:8000/api/auth/google/callback`. Token hasil login disimpan di database (tabel `system_configs`), bukan di file.

---

## 🚀 Cara Menjalankan Aplikasi

> Cara cepat dari root proyek: `make install`, `make infra-up`, lalu `make backend`, `make worker`, `make frontend` di terminal terpisah.

### 1. Instalasi Dependencies
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# Sesuaikan DATABASE_URL, REDIS_URL, FRONTEND_URL, SENDER_EMAIL
```

### 3. Jalankan Database & Redis
```bash
# Dari root proyek
docker compose up -d redis db
# Port 5432 sudah dipakai? POSTGRES_PORT=5433 docker compose up -d redis db
# lalu ubah DATABASE_URL di .env ke port 5433
```

### 4. Jalankan Migrasi Database
```bash
alembic upgrade head
```

### 5. Jalankan Celery Worker (terminal terpisah)
```bash
celery -A src.worker.celery_app worker --loglevel=info
# Windows: tambahkan --pool=solo
```

> ⚠️ Celery worker tidak auto-reload. Restart manual setiap kali kode worker diubah, atau pakai `make worker` (auto-restart via watchdog).

### 6. Jalankan FastAPI Server (terminal terpisah)
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ⚡ Shortcut via Makefile

Dari **root folder proyek** (default pakai Docker; podman: tambahkan `DOCKER=podman`):

| Perintah | Fungsi |
|---|---|
| `make install` | Buat venv backend + install dependency backend & frontend |
| `make infra-up` / `make infra-down` | Nyalakan / matikan PostgreSQL & Redis |
| `make backend` | Jalankan FastAPI server |
| `make worker` | Jalankan Celery worker (auto-restart) |
| `make frontend` | Jalankan UI (Vite + React) |
| `make test` | Jalankan unit test backend |
| `make dev-backend` | Backend + Worker sekaligus |

---

## 🧪 Menjalankan Test

Test tidak butuh Google API, Redis, maupun PostgreSQL (semuanya di-mock).

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest tests
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

### Google Auth

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/auth/google/status` | Cek apakah token Google valid |
| `GET` | `/api/auth/google/login` | Mulai login OAuth Google |
| `GET` | `/api/auth/google/callback` | Callback OAuth (dipanggil oleh Google) |

---

## 🛠 Panduan untuk Maintainer

- **Menambah variabel dinamis di email?**
  Tambahkan `.replace('{{variabel_baru}}', nilai)` di `src/worker/tasks.py` bagian templating.

- **Ganti domain CORS?**
  Ubah `FRONTEND_URL` di `.env` production.

- **Email sering kena rate limit Gmail?**
  Jangan hapus `time.sleep(random.randint(2, 5))` di `src/worker/tasks.py`. Batas Gmail: ±500 email/hari untuk akun gratis. Jika kuota habis di tengah blast, sisa penerima ditandai gagal dan bisa dikirim ulang lewat tombol **Resend yang Gagal**.

- **Menambah tabel baru di database?**
  1. Tambahkan model baru di `src/db/models.py`
  2. Buat file migrasi: `alembic revision --autogenerate -m "deskripsi"`
  3. Terapkan: `alembic upgrade head`

---

*Dikembangkan oleh Tim GDGoC UNSRI*
