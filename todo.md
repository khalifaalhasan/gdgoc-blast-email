# Todo List: Web App Bulk Email & Certificate (FastAPI + Next.js)

## Phase 1: Project Setup & Arsitektur Dasar
- [x] 1.1 Inisialisasi struktur folder untuk Backend (FastAPI) dan Frontend (Next.js).
- [x] 1.2 Setup `docker-compose.yml` khusus untuk Redis (sebagai message broker kita).
- [x] 1.3 Setup Virtual Environment Python dan instalasi *dependencies* awal (FastAPI, Uvicorn, Celery, Redis).

## Phase 2: Refactoring & Google API Integration
- [x] 2.1 Refactor `mailer.py` yang sudah ada agar lebih modular dan bisa dipanggil dari FastAPI/Celery.
- [x] 2.2 Buat service/fungsi baru untuk **Google Drive API**: Bisa membaca isi dari "Link Folder Drive" dan mencari nama file.
- [x] 2.3 Buat fungsi untuk mengunduh (download) file dari Drive secara *temporary* berdasarkan nama yang cocok dengan CSV.

## Phase 3: Background Worker (Celery) & API Endpoints
- [ ] 3.1 Setup konfigurasi Celery untuk terkoneksi ke Redis.
- [ ] 3.2 Buat Celery Task `blast_email_task`: menerima data (CSV data, Drive link, Template body/subject) lalu menjalankan proses loop pengiriman email di *background*.
- [ ] 3.3 Buat API Endpoint `POST /api/campaign/start` untuk menerima file CSV, form template, dan men-*trigger* Celery Task.
- [ ] 3.4 Buat API Endpoint `GET /api/campaign/status/{task_id}` untuk memantau *progress* (berapa sukses, berapa gagal).

## Phase 4: Frontend Development (Next.js + UI Premium)
- [ ] 4.1 Inisialisasi Next.js app (Tailwind CSS, modern typography).
- [ ] 4.2 Buat komponen Layout & Sidebar untuk Dashboard.
- [ ] 4.3 Buat halaman **Create Campaign**: Form input untuk Subject, Body (Template Editor), input Link Drive, dan Upload CSV.
- [ ] 4.4 Integrasi form Frontend ke Endpoint `POST /api/campaign/start`.
- [ ] 4.5 Buat komponen **Progress Tracker**: Progress bar *real-time* yang menarik (memanggil endpoint status secara periodik) dan menampilkan log/error.

## Phase 5: Finalization & Deployment Prep
- [ ] 5.1 End-to-end Testing (Simulasi upload CSV dan kirim ke email tester).
- [ ] 5.2 Cleanup temporary files (Sertifikat yang didownload dari Drive harus dihapus otomatis setelah dikirim).
- [ ] 5.3 Dokumentasi Deployment (Update docker-compose untuk siap di-deploy ke VPS).
