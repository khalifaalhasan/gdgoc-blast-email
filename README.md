# 📧 GDGoC Certificate Blast Mailer

Aplikasi web untuk mengirim **e-sertifikat dan surat massal** lewat Gmail kepada peserta/panitia acara **GDG on Campus Universitas Sriwijaya**.

------------------------------------------------------------------------

## 🚀 Fitur Utama

- **Dashboard campaign** — buat campaign, upload & edit CSV penerima langsung di browser, atur template email (`{{nama}}`, `{{role}}`) dengan preview.
- **PDF dari Google Drive** — setiap role dipetakan ke satu folder Drive; PDF dicocokkan otomatis dengan nama penerima. Jika ada lebih dari satu file yang cocok, penerima ditandai gagal (tidak asal pilih), dan sertifikat tanpa PDF tidak dikirim.
- **Pengiriman di background** — Celery + Redis, progress realtime, jeda acak antar email untuk menghindari rate limit Gmail.
- **Riwayat & kirim ulang** — setiap pengiriman dicatat; penerima yang gagal bisa dikirim ulang dengan tombol **Resend yang Gagal**.
- **Login Google OAuth** — akun pengirim (misal `dscunsri@gmail.com`) login sekali, token disimpan di database.

------------------------------------------------------------------------

## 📂 Struktur Project

    ├── backend/    # FastAPI + Celery + PostgreSQL (lihat backend/README.md)
    ├── frontend/   # React + Vite + Tailwind
    ├── docker-compose.yml        # PostgreSQL & Redis untuk development
    ├── docker-compose.prod.yml   # Stack lengkap untuk server
    └── Makefile                  # Shortcut perintah development

------------------------------------------------------------------------

## 🛠️ Prasyarat

- Python 3.10+, Node.js 20+, Docker
- `backend/credentials.json` — OAuth Client ID dari Google Cloud Console (format: `backend/credentials-example.json`). File ini rahasia, jangan di-commit.

------------------------------------------------------------------------

## ⚡ Menjalankan di Local

```bash
make install                         # venv backend + npm ci frontend
cp backend/.env.example backend/.env # sesuaikan bila perlu
make infra-up                        # PostgreSQL & Redis (Docker)
cd backend && venv/bin/alembic upgrade head   # Windows: venv\Scripts\alembic
```

Lalu di tiga terminal terpisah:

```bash
make backend    # http://localhost:8000 (Swagger: /docs)
make worker
make frontend   # http://localhost:5173
```

Buka http://localhost:5173, login dengan akun Google pengirim, lalu buat campaign.

> Port 5432 sudah dipakai aplikasi lain? Jalankan `POSTGRES_PORT=5433 make infra-up` dan ubah `DATABASE_URL` di `backend/.env` ke port 5433.

Detail arsitektur backend, API, dan cara kerja pencocokan PDF ada di [backend/README.md](backend/README.md).

------------------------------------------------------------------------

## ⚙️ Format CSV

Header minimal: kolom nama, email, dan (opsional) role. Nama kolom fleksibel (`Nama`/`Name`, `Email`/`E-mail`, `Role`).

    Nama,Email,Role
    Budi Santoso,budi@gmail.com,Participant
    Siti Aminah,siti@yahoo.com,Committee

Nama file PDF di Drive sebaiknya sama dengan kolom nama, misal `Budi Santoso.pdf`.

------------------------------------------------------------------------

## ⚠️ Troubleshooting

- **Token Google expired / dicabut** — login ulang dari halaman login aplikasi.
- **Sertifikat tidak ditemukan / ambigu** — cek pesan di tabel riwayat campaign; rapikan nama file di Drive lalu klik **Resend yang Gagal**.
- **Kuota Gmail habis** — akun Gmail gratis dibatasi ±500 email/hari. Sisa penerima otomatis ditandai gagal; kirim ulang keesokan harinya.

------------------------------------------------------------------------

## 👨‍💻 Maintainer

**Backend Division**\
GDG on Campus Universitas Sriwijaya
