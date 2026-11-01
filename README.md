# 📧 GDGoC Certificate Blast Mailer

Aplikasi web untuk mengirim **e-sertifikat dan surat massal** lewat Gmail kepada peserta/panitia acara **GDG on Campus Universitas Sriwijaya**.

------------------------------------------------------------------------

## 🚀 Fitur Utama

- **Dashboard campaign** — buat campaign, upload & edit CSV penerima langsung di browser, atur template email (`{{nama}}`, `{{role}}`, atau kolom CSV lain seperti `{{division}}`) dengan preview.
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

- Python 3.10+, Node.js 20+, Make, Docker dengan Docker Compose v2 (atau Podman + `podman-compose`)
- `backend/credentials.json` — OAuth Client ID dari Google Cloud Console (format: `backend/credentials-example.json`). File ini rahasia, jangan di-commit.

------------------------------------------------------------------------

## ⚡ Menjalankan di Local

Jalankan perintah berikut dari root proyek. Contoh shell memakai Bash (Linux/macOS).

### 1. Siapkan dependency dan konfigurasi

```bash
make install                         # venv backend + npm ci frontend
cp backend/.env.example backend/.env # sesuaikan bila perlu
```

Salin `.env.example` hanya saat setup pertama agar konfigurasi yang sudah ada tidak tertimpa. Siapkan juga `backend/credentials.json` mengikuti [panduan kredensial Google](#kredensial-google-oauth).

### 2. Jalankan Docker Compose

Pastikan Docker sudah berjalan, lalu:

```bash
docker compose version
docker compose up -d
docker compose ps
docker compose exec db pg_isready -U user -d blast_email
docker compose exec redis redis-cli ping
```

PostgreSQL harus menjawab `accepting connections` dan Redis menjawab `PONG` sebelum backend dijalankan. Jika belum siap, cek `docker compose logs --tail=50 db redis`, lalu ulangi pengecekan.

Compose development menjalankan layanan berikut; API, worker, dan frontend dijalankan terpisah pada langkah 4.

| Layanan | Alamat dari komputer lokal |
|---|---|
| PostgreSQL 15 | `localhost:5432` |
| Redis | `localhost:6379` |
| RedisInsight (GUI Redis) | `http://localhost:8001` |

Jika hanya membutuhkan database dan Redis, gunakan `docker compose up -d db redis`. Shortcut untuk seluruh infrastruktur: `make infra-up`.

**Alternatif Podman** — gunakan ini sebagai pengganti perintah Docker di atas:

```bash
podman-compose up -d
podman-compose ps
podman-compose exec db pg_isready -U user -d blast_email
podman-compose exec redis redis-cli ping
```

Shortcut: `make infra-up DOCKER=podman`. Untuk perintah log dan stop di bawah, ganti `docker compose` dengan `podman-compose` jika memakai Podman.

### 3. Jalankan migrasi database

```bash
(cd backend && venv/bin/alembic upgrade head)
```

Tanda kurung menjaga terminal tetap di root proyek. Pada Windows, jalankan `venv\Scripts\alembic upgrade head` dari folder `backend`, lalu kembali ke root proyek.

### 4. Jalankan aplikasi dan login

Jalankan masing-masing perintah di terminal terpisah, semuanya dari root proyek:

```bash
make backend    # http://localhost:8000 (Swagger: /docs)
make worker
make frontend   # http://localhost:5173
```

Buka http://localhost:5173, login dengan akun Google pengirim, lalu buat campaign.

### Port database bentrok

Jika port 5432 sudah digunakan, jalankan:

```bash
POSTGRES_PORT=5433 docker compose up -d
# Podman: POSTGRES_PORT=5433 podman-compose up -d
```

Sesuaikan `backend/.env` dan restart backend serta worker:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5433/blast_email
```

Gunakan `POSTGRES_PORT=5433` setiap menjalankan Compose, atau simpan `POSTGRES_PORT=5433` dalam `.env` di **root proyek**. Compose membaca `.env` root untuk port container; aplikasi membaca `backend/.env` untuk koneksi database.

### Log, restart, dan mematikan infrastruktur

```bash
docker compose logs --tail=50 db redis
docker compose restart db redis
docker compose down
```

`down` mempertahankan volume PostgreSQL. Jangan tambahkan `-v` jika ingin menyimpan campaign dan token Google: opsi tersebut menghapus volume database. Untuk menjalankan kembali, gunakan `docker compose up -d`.

Compose development memakai PostgreSQL 15 karena volume yang ada dibuat dengan versi 15. Mengganti image langsung ke versi 16 dapat menyebabkan `database files are incompatible with server`. Upgrade major membutuhkan migrasi data; untuk volume versi 15 yang gagal dibuka oleh versi 16, gunakan kembali `postgres:15-alpine` lalu jalankan `docker compose up -d --no-deps db`.

Detail arsitektur backend, API, dan cara kerja pencocokan PDF ada di [backend/README.md](backend/README.md).

------------------------------------------------------------------------

## Kredensial Google OAuth

`credentials.json` berisi identitas aplikasi (Client ID dan client secret) dari Google Cloud. **Token akses dibuat setelah pengguna login**, lalu backend menyimpannya di tabel `system_configs`. Tidak perlu membuat atau mengunduh `token.json` secara manual.

### Membuat atau memakai OAuth Client

1. Buka [Google Cloud Console](https://console.cloud.google.com/), lalu pilih project aplikasi.
2. Di **APIs & Services → Library**, aktifkan **Gmail API** dan **Google Drive API**.
3. Siapkan consent screen melalui **Google Auth Platform** sesuai akun pengguna aplikasi.
4. Buka **Google Auth Platform → Clients** (atau **APIs & Services → Credentials → OAuth 2.0 Client IDs**). Pilih client bertipe **Web application** yang sesuai, atau buat melalui **Create client → Web application**.
5. Pada **Authorized redirect URIs**, tambahkan `http://localhost:8000/api/auth/google/callback`, lalu simpan. URI ini harus sama persis dengan `${BACKEND_URL}/api/auth/google/callback`; mengisi **Authorized JavaScript origins** saja belum cukup.
6. Saat client dibuat, simpan secret yang ditampilkan dan unduh JSON bila tersedia. Letakkan JSON tersebut sebagai `backend/credentials.json`.

Untuk server dengan domain sendiri, daftarkan juga callback HTTPS domain backend dan sesuaikan `BACKEND_URL` di konfigurasi aplikasi. Referensi: [Google OAuth untuk aplikasi web](https://developers.google.com/identity/protocols/oauth2/web-server).

### Client sudah ada, tetapi JSON atau secret lama hilang

Google tidak menyediakan tampilan atau unduhan ulang secret lama. Jika masih punya JSON yang valid, gunakan file itu. Jika hilang, buka client yang sama, klik **Add secret**, dan simpan secret baru saat ditampilkan. Pertahankan secret lama sampai semua aplikasi yang memakainya sudah beralih; client bisa dipakai juga oleh server lain. Lihat [panduan pengelolaan dan rotasi secret Google](https://support.google.com/cloud/answer/15549257?hl=en).

Jika tidak tersedia unduhan JSON, gunakan contoh sebagai struktur awal (hanya jika `backend/credentials.json` belum ada):

```bash
cp backend/credentials-example.json backend/credentials.json
```

Edit file tersebut secara lokal: isi `client_id` dengan Client ID lengkap, `project_id` dengan ID project, dan `client_secret` dengan secret asli yang baru disimpan. Pertahankan struktur `web` dan endpoint Google; sesuaikan `redirect_uris` dengan callback yang terdaftar. Nilai `YOUR_...` pada contoh adalah placeholder dan tidak dapat dipakai login.

### Memasang kredensial dan mendapatkan token

Lokasi default adalah `backend/credentials.json`. Jika disimpan di lokasi lain, atur path absolut dalam `backend/.env`:

```dotenv
CREDENTIALS_PATH=/lokasi/absolut/credentials.json
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Restart backend setelah mengubah `.env`. Buka http://localhost:5173, klik **Login dengan Google Workspace**, pilih akun pengirim, lalu setujui akses. Setelah berhasil, aplikasi mengarahkan ke dashboard dan menyimpan token otomatis di database. Status dapat diperiksa lewat `http://localhost:8000/api/auth/google/status` (`valid: true` ketika token valid).

File `credentials.json` sudah diabaikan Git. Simpan secret di backend; jangan memasukkannya ke source frontend, commit, atau chat. Pada `docker-compose.prod.yml`, file `backend/credentials.json` dipasang ke `/app/credentials.json` dalam container backend dan worker; file tersebut harus tersedia sebelum stack dijalankan.

------------------------------------------------------------------------

## ⚙️ Format CSV

Header minimal: kolom nama, email, dan (opsional) role. Nama kolom fleksibel (`Nama`/`Name`, `Email`/`E-mail`, `Role`).

    Nama,Email,Role
    Budi Santoso,budi@gmail.com,Participant
    Siti Aminah,siti@yahoo.com,Committee

Nama file PDF di Drive sebaiknya sama dengan kolom nama, misal `Budi Santoso.pdf`.

Kolom tambahan bisa dipakai di template email sebagai placeholder, misal kolom `Division` → `{{division}}`. Jika nama file PDF berbeda dari nama penerima, isi kolom opsional `Sertifikat` dengan nama file-nya:

    Nama,Email,Role,Division,Sertifikat
    Budi Santoso,budi.pm@gmail.com,Member,Project Management,
    Budi Santoso,budi.ui@gmail.com,Member,UI/UX,Budi Santoso UIUX

------------------------------------------------------------------------

## ⚠️ Troubleshooting

- **`credentials.json` tidak ditemukan / login belum dikonfigurasi** — ikuti [panduan kredensial](#kredensial-google-oauth); pastikan file berisi JSON OAuth asli dan `CREDENTIALS_PATH` benar.
- **`redirect_uri_mismatch`** — samakan Authorized redirect URI di Google Cloud dengan `${BACKEND_URL}/api/auth/google/callback`, termasuk skema, port, dan path.
- **Koneksi ditolak di `localhost:5432`** — periksa `docker compose ps`, log database, dan `pg_isready`. Cocokkan port dengan `DATABASE_URL`; jika log menyebut versi data tidak kompatibel, ikuti panduan versi PostgreSQL di atas.
- **Token Google expired / dicabut** — login ulang dari halaman login aplikasi.
- **Sertifikat tidak ditemukan / ambigu** — cek pesan di tabel riwayat campaign; rapikan nama file di Drive lalu klik **Resend yang Gagal**.
- **Kuota Gmail habis** — akun Gmail gratis dibatasi ±500 email/hari. Sisa penerima otomatis ditandai gagal; kirim ulang keesokan harinya.

------------------------------------------------------------------------

## 👨‍💻 Maintainer

**Backend Division**\
GDG on Campus Universitas Sriwijaya
