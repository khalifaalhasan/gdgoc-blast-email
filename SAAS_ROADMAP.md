# 🚀 ROADMAP: Evolusi Menuju Multi-Tenant SaaS

Dokumen ini adalah rancangan arsitektur masa depan untuk mengubah **GDGoC Blast Email** (Single-Tenant) menjadi **Platform SaaS Multi-Tenant** yang dapat digunakan secara mandiri oleh berbagai instansi, BEM, atau organisasi lain.

> **Status Saat Ini (V1)**: Cepat, efisien, dan ditujukan untuk satu organisasi tunggal dengan kredensial tersentralisasi.
> **Status Target (V2 SaaS)**: Mandiri, berskala besar, berlangganan, dengan kredensial independen per organisasi.

---

## 1. Arsitektur Database & Multi-Tenancy

Diperlukan penambahan Database Relasional (contoh: PostgreSQL) untuk mengelola data setiap penyewa (*Tenant*).

### Desain Skema Inti (Core Schema)
- **`Tenant` (Organisasi)**: 
  Menyimpan nama organisasi, kuota pengiriman, dan status langganan.
- **`User` (Pengguna)**: 
  Karyawan/Panitia yang terhubung ke satu atau banyak *Tenant*.
- **`GoogleCredential`**: 
  Tabel paling krusial. Menyimpan `refresh_token`, `access_token`, dan `email_pengirim` milik masing-masing *Tenant* secara terenkripsi.
- **`Campaign` & `CampaignLog`**: 
  Menyimpan riwayat *blast* email (Subjek, Tanggal, Jumlah Sukses/Gagal).

---

## 2. Revolusi Otentikasi Google (OAuth 2.0)

Sistem `token.json` yang manual akan sepenuhnya ditinggalkan.
Sebagai gantinya:
1. Anda membuat **1 Aplikasi Google Cloud Console** atas nama perusahaan Anda (SaaS).
2. Di Dashboard Frontend, akan ada tombol **"Hubungkan Akun Google Workspace Organisasi Anda"**.
3. User akan login menggunakan email resmi organisasinya dan memberikan izin `gmail.send` serta `drive.readonly`.
4. Backend akan menangkap kode otorisasi dan menyimpan *Refresh Token* ke Database (`GoogleCredential`).
5. Setiap kali Celery menjalankan *blast* untuk *Tenant A*, ia akan menarik *Refresh Token Tenant A* dan membuat *service instance* yang terisolasi.

---

## 3. Isolasi & Fair Queuing (Celery)

Celery sangat mumpuni untuk SaaS, namun perlu modifikasi agar pengiriman adil:
- **Tenant ID pada Task**: Setiap tugas (Task) Celery yang dilempar harus disematkan `tenant_id`.
- **Fair Queuing Mechanism**: Jangan menaruh semua pengiriman di satu "pipa" raksasa. Gunakan fitur *Celery Routing* atau antrean berdasarkan *Priority* agar organisasi kecil yang mengirim 10 email tidak perlu menunggu organisasi besar yang sedang mengirim 100.000 email.

---

## 4. Keamanan & Efisiensi Penyimpanan

- **In-Memory / S3 Storage**: File sertifikat dari Google Drive jangan lagi disimpan ke folder sementara di disk VPS lokal (`temp_certs`). Alihkan unduhan ke *buffer* memori (jika kecil) atau gunakan AWS S3 / Cloudflare R2 sebagai wadah penampungan sementara per *Tenant* untuk menghindari disk VPS penuh secara tiba-tiba.
- **Encryption at Rest**: Semua *Refresh Token* di database harus dienkripsi menggunakan kunci enkripsi level sistem (misal: Fernet) agar jika *database bocor*, token Google milik pengguna tetap aman.

---

## 5. Model Bisnis (Monetisasi)
- **Sistem Kuota Terpusat**: Saat *worker* mencoba mengirim email, backend akan mengecek tabel `Tenant` untuk melihat apakah batas kuota bulanan organisasi tersebut masih tersisa.
- **Pembatasan Rate Limit per Tenant**: Terapkan mekanisme pengaman agar sebuah organisasi tidak secara tidak sengaja melanggar batas harian Google (500 email per hari untuk akun gratis), sambil menyarankan mereka menggunakan Google Workspace (*Paid*) jika ingin limit tak terbatas.

---
*Roadmap ini dicatat pada Fase 1 Pembangunan Sistem. Untuk saat ini, kita berfokus pada MVP (Minimum Viable Product) yang bisa berjalan cepat demi memenuhi kebutuhan mendesak organisasi.*
