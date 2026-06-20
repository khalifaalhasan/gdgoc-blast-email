# 📋 Product Requirements Document (PRD)
# devlivery — Event Management & Certificate Delivery Platform

**Versi Dokumen**: 1.1.0  
**Tanggal**: 31 Mei 2026  
**Status**: Draft — Menunggu Review  
**Author**: Tim Produk devlivery  
**Changelog**: v1.1.0 — Klarifikasi plan/quota, mekanisme QR, email konfirmasi, UX duplikasi email, job queue payload, simplifikasi F-11, AC performa, Open Questions.

---

## 1. Ringkasan Eksekutif

**devlivery** adalah platform SaaS (*Software as a Service*) multi-tenant yang membantu organisasi, komunitas, dan instansi dalam mengelola siklus hidup event secara end-to-end — mulai dari **pendaftaran peserta** via form dinamis, **absensi digital** via QR Code, hingga **pengiriman sertifikat** yang dipersonalisasi melalui email secara otomatis.

Setiap organisasi mendapatkan *workspace* yang sepenuhnya terisolasi. Tidak ada satu pun data yang bisa bocor antar organisasi.

### Nilai Utama (Core Value Proposition)
| Sebelum devlivery | Sesudah devlivery |
|---|---|
| Form Google Forms terpisah, data tersebar | Form dinamis terintegrasi langsung ke sistem |
| Absensi manual, rentan kesalahan | Scan QR Code, langsung tercatat real-time |
| Kirim sertifikat satu-satu, makan waktu berjam-jam | Sertifikat terkirim otomatis dalam hitungan menit |
| Desainer & copywriter tidak bisa kolaborasi langsung | Link berbagi khusus untuk setiap peran |
| Tiap departemen pakai tools berbeda | Satu platform untuk seluruh alur event |

---

## 2. Proses Bisnis (Business Process)

Berikut adalah alur proses bisnis utama devlivery dari awal hingga akhir event.

### 2.1 Gambaran Alur Besar

```
[Organisasi Daftar & Setup] 
        ↓
[Panitia Membuat Campaign / Event]
        ↓
    ┌───────────────────────────────────────┐
    │         FASE PERSIAPAN                │
    │  1. Buat Form Pendaftaran Dinamis     │
    │  2. Custom Body Email (Copywriter)    │
    │  3. Custom Desain Header + Sertif     │
    │     (Designer melalui share link)     │
    └───────────────────────────────────────┘
        ↓
[Link Pendaftaran Publik Disebarkan]
        ↓
[Peserta Mengisi Form → Tersimpan ke Sistem]
        ↓
[Hari H Event: QR Code Absensi Aktif]
        ↓
    ┌─────────────────────────────────────────┐
    │         FASE ABSENSI                    │
    │  Peserta Scan QR → Tercatat Hadir       │
    │  Non-Peserta Scan → Pesan "Tidak Terdaftar" │
    └─────────────────────────────────────────┘
        ↓
[Panitia Trigger Pengiriman Sertifikat]
        ↓
[Sistem Generate Sertifikat Dinamis per Peserta]
        ↓
[Email + Sertifikat Terkirim Otomatis]
        ↓
[Dashboard: Monitoring Status Pengiriman]
```

### 2.2 Alur Detail Per Aktor

#### A. Alur Panitia / Event Organizer (EO)
1. Login ke workspace organisasi.
2. Klik **"Buat Campaign Baru"** → isi nama event, tanggal, deskripsi.
3. **[FORM]** Masuk ke Builder Form Pendaftaran:
   - Tambah/hapus/susun kolom (nama, email, instansi, role, dll.)
   - Atur kolom wajib vs opsional.
   - Preview form dari sudut pandang peserta.
   - Salin **Link Publik Form** → sebarkan ke calon peserta.
4. **[EMAIL]** Masuk ke Editor Konten Email:
   - Tulis body email penyambutan / konfirmasi pendaftaran.
   - Tulis body email pengiriman sertifikat.
   - Gunakan variabel dinamis: `{{nama}}`, `{{role}}`, `{{event}}`, dll.
   - Salin **Link Berbagi Editor** → kirim ke tim *copywriter* untuk diedit secara kolaboratif.
5. **[DESAIN]** Masuk ke Editor Desain Visual:
   - Upload atau kustomisasi template header email.
   - Upload atau kustomisasi template sertifikat (posisi nama, role, tanggal, dsb.)
   - Salin **Link Berbagi Desain** → kirim ke tim *desainer* untuk dikerjakan.
6. Panitia memvalidasi keseluruhan tampilan email + sertifikat melalui fitur **Preview Lengkap**.
7. **[QR]** Saat hari H, aktifkan **Mode Absensi**:
   - Sistem generate QR Code unik per campaign.
   - Tampilkan QR Code di layar proyektor / cetak / bagikan.
8. Setelah event selesai, klik **"Kirim Sertifikat"**:
   - Pilih filter peserta (semua yang hadir / semua yang daftar / manual select).
   - Konfirmasi pengiriman → sistem mulai *blast* secara background.
9. Pantau progress pengiriman di **Dashboard Real-time**.

#### B. Alur Peserta
1. Buka link publik pendaftaran yang disebarkan panitia.
2. Isi form dinamis yang telah dikonfigurasi panitia.
3. Submit → menerima **email konfirmasi otomatis** (jika dikonfigurasi).
4. Di hari event:
   - Scan QR Code yang disediakan panitia.
   - Jika terdaftar → status absensi terupdate menjadi "Hadir", muncul pesan sukses.
   - Jika **tidak terdaftar** → muncul halaman fallback "Anda tidak terdaftar di event ini."
5. Setelah event, menerima **email sertifikat** yang dipersonalisasi.

#### C. Alur Copywriter (Kolaborator Konten)
1. Menerima link berbagi khusus dari panitia.
2. Membuka link → langsung masuk ke halaman editor konten email campaign tersebut **tanpa perlu login** ke sistem utama (akses terbatas hanya ke editor konten campaign ini).
3. Menulis dan mengedit body email.
4. Panitia dapat melihat perubahan dan memberikan persetujuan.

#### D. Alur Desainer (Kolaborator Visual)
1. Menerima link berbagi khusus dari panitia.
2. Membuka link → langsung masuk ke halaman editor desain (header email + template sertifikat) **tanpa login** ke sistem utama.
3. Upload aset visual, atur tata letak elemen dinamis (posisi nama, tanda tangan, logo, dsb.)
4. Panitia memvalidasi hasil desain melalui fitur preview.

---

## 3. Target Pengguna (User Personas)

| Persona | Deskripsi | Pain Point Saat Ini |
|---|---|---|
| **Ketua Panitia / EO** | Mengelola keseluruhan event, butuh kontrol penuh | Tools terfragmentasi, koordinasi via chat tidak efisien |
| **Divisi Registrasi** | Mengelola data peserta, absensi | Data manual di spreadsheet, rentan duplikasi |
| **Divisi Dokumentasi / Desain** | Membuat template sertifikat | File desain tidak terintegrasi ke sistem pengiriman |
| **Copywriter** | Menulis konten email | Tidak punya akses ke sistem, kirim teks via chat |
| **Peserta Event** | Mendaftar, hadir, terima sertif | Proses panjang, terkadang sertif tidak terkirim |
| **Admin Organisasi** | Mengelola anggota tim & akses | Tidak ada sistem hak akses yang terpusat |

---

## 4. Fitur Produk (Feature Requirements)

### 4.1 Modul Autentikasi & Multi-Tenancy

#### F-01: Registrasi Organisasi
- Organisasi mendaftar dengan nama, domain (opsional), dan akun admin utama.
- Setelah registrasi, organisasi mendapatkan *workspace* yang terisolasi penuh.
- Tidak ada data yang bisa diakses lintas organisasi pada level apapun.

#### F-02: Manajemen Anggota Tim (RBAC)
- Admin organisasi dapat mengundang anggota dengan email.
- **Role yang tersedia**:
  - `Owner` — akses penuh, kelola billing, hapus organisasi.
  - `Admin` — kelola semua campaign dan anggota (kecuali billing).
  - `Manager` — buat dan kelola campaign miliknya sendiri.
  - `Viewer` — hanya bisa melihat data, tidak bisa mengubah.
- Setiap anggota hanya bisa melihat data di dalam *workspace* organisasinya sendiri.

#### F-03: Akses Kolaborator Tanpa Login (Share Link)
- Panitia bisa generate **link berbagi** untuk:
  - Editor konten email (untuk copywriter).
  - Editor desain visual (untuk desainer).
- Link ini menghasilkan akses terbatas (*scoped access*) hanya ke resource spesifik tersebut.
- Link bisa dinonaktifkan/di-*revoke* kapan saja oleh panitia.
- Link memiliki opsi kedaluwarsa (expire dalam X jam/hari).

---

### 4.2 Modul Campaign

#### F-04: Pembuatan & Manajemen Campaign
- Panitia membuat campaign baru dengan mengisi:
  - Nama event, tanggal pelaksanaan, deskripsi singkat.
  - Gambar banner/cover event (opsional).
- Campaign memiliki status lifecycle: `Draft` → `Published` → `Ongoing` → `Completed`.
- Panitia bisa menduplikasi campaign sebelumnya sebagai template.

---

### 4.3 Modul Form Pendaftaran Dinamis

#### F-05: Form Builder
- Panitia dapat membangun form pendaftaran dengan antarmuka **drag-and-drop** atau *block-based* (seperti Google Forms).
- **Jenis field yang tersedia**:
  - Text pendek, Text panjang (textarea).
  - Email (dengan validasi format otomatis).
  - Nomor telepon.
  - Pilihan tunggal (radio button).
  - Pilihan ganda (checkbox).
  - Dropdown.
  - Upload file (foto/dokumen).
  - Tanggal.
- Setiap field bisa ditandai sebagai **wajib** atau **opsional**.
- Panitia bisa mengatur urutan field dengan drag.
- Panitia bisa menambah, menghapus, dan mengedit field kapan saja (selama form belum *published* / dengan konfirmasi jika sudah ada data masuk).

#### F-06: Publikasi Form & Pengumpulan Data
- Form yang sudah siap bisa di-*publish* dan menghasilkan **URL publik unik** (contoh: `devlivery.io/f/abc123xyz`).
- URL publik bisa diakses siapa saja tanpa login.
- Setiap *submission* tersimpan ke database dan dapat dilihat di dashboard organisasi.
- Panitia bisa mengekspor data peserta ke format **CSV / Excel**.
- Panitia bisa melihat respons individual peserta.
- Sistem mendeteksi dan mencegah duplikasi pendaftaran berdasarkan email.

**UX Duplikasi Email**:
- Saat peserta submit form dengan email yang sudah terdaftar di campaign yang sama, sistem menampilkan pesan error di halaman form:
  > _"Email ini sudah terdaftar di event ini. Jika ingin mengubah data, silakan hubungi panitia."_
- Peserta **tidak bisa** mengedit sendiri data yang sudah dikirim (mencegah manipulasi data).
- Panitia dapat melakukan **override manual** dari dashboard: edit nilai jawaban peserta tertentu atau hapus submission dan meminta peserta mendaftar ulang.

#### F-06b: Email Konfirmasi Pendaftaran (WAJIB MVP)

> **Status**: Wajib MVP karena diperlukan untuk pengiriman QR Code unik peserta (lihat F-08).

- Sistem secara otomatis mengirim email konfirmasi setelah form berhasil di-submit.
- **Isi email konfirmasi** (dapat dikustomisasi panitia di F-10):
  - Pesan ucapan selamat datang / konfirmasi.
  - Detail event (nama, tanggal, lokasi).
  - **QR Code unik peserta** (attachment PNG + inline image) untuk digunakan saat absensi.
- **Konfigurasi oleh panitia**:
  - Toggle on/off pengiriman email konfirmasi per campaign.
  - Jika off, `attendance_token` tetap di-generate tetapi QR tidak dikirim (absensi manual saja).
- **Template email konfirmasi terpisah** dari template email sertifikat (dua template berbeda di F-10).
- Trigger: segera setelah `form_submission` berhasil dibuat (synchronous atau job dengan prioritas tinggi).

---

### 4.4 Modul QR Code Absensi

#### F-07: Generasi QR Code per Campaign
- Setiap campaign memiliki **satu QR Code publik** yang sama untuk semua orang (ditampilkan di proyektor/dicetak).
- QR Code mengarah ke halaman verifikasi: `/scan/[campaign_qr_token]`.
- QR Code bisa diunduh dalam format PNG/SVG dan dicetak.

#### F-08: Mekanisme Identifikasi Peserta saat Scan (KEPUTUSAN DESAIN)

> **Keputusan**: Menggunakan **Opsi B — QR Code unik per peserta**, dikirim via email konfirmasi pendaftaran.

**Alasan memilih Opsi B**:
- Tidak perlu peserta menginput email saat scan (lebih cepat, tidak ada typo).
- Lebih aman — token UUID tidak bisa ditebak.
- Konsisten dengan alur event profesional.

**Alur teknis**:
1. Saat peserta submit form → sistem generate `attendance_token` (UUID v4) unik per `form_submission`.
2. Email konfirmasi dikirim otomatis berisi QR Code unik peserta (encode dari `attendance_token`).
3. Saat hari H, peserta scan QR Code miliknya sendiri.
4. Sistem decode token → cari `form_submission` dengan token tersebut:
   - **Token valid & belum absen** → tampil halaman sukses dengan nama peserta, buat `attendance_record`.
   - **Token valid & sudah absen** → tampil pesan "Anda sudah tercatat hadir pukul [waktu]" (idempotent).
   - **Token tidak dikenali / bukan campaign ini** → tampil halaman fallback "QR Code tidak valid atau bukan untuk event ini."
5. Scan QR Code campaign publik (bukan milik peserta) oleh siapapun → redirect ke halaman info event, bukan absensi.

**Fallback manual**: Panitia tetap bisa melakukan absensi manual via dashboard jika peserta tidak menerima email.

#### F-09: Dashboard Absensi Real-time
- Panitia dapat melihat daftar peserta hadir secara live.
- Tampilkan: Total Terdaftar, Total Hadir, Persentase Kehadiran.
- Panitia bisa melakukan absensi manual untuk peserta yang bermasalah.
- Panitia bisa re-kirim email konfirmasi (beserta QR Code peserta) untuk peserta tertentu.

---

### 4.5 Modul Pengiriman Sertifikat via Email

#### F-10: Editor Konten Email (Copywriter-Friendly)
- WYSIWYG Editor untuk menulis body email.
- Dukungan **variabel dinamis** yang secara otomatis diganti per peserta:
  - `{{nama}}` — Nama peserta.
  - `{{role}}` — Role/jabatan peserta (dari data form).
  - `{{event}}` — Nama event/campaign.
  - `{{tanggal_event}}` — Tanggal pelaksanaan.
  - `{{organisasi}}` — Nama organisasi penyelenggara.
  - *Variabel kustom bisa ditambahkan dari field form*.
- Preview email secara real-time.
- Tombol **"Salin Link Editor"** untuk dibagikan ke copywriter.

#### F-11: Editor Desain Visual (Designer-Friendly) — MVP Scope

> **Keputusan Simplifikasi MVP**: Antarmuka drag-and-drop visual **tidak termasuk MVP** karena membutuhkan 2–3 minggu pengembangan tambahan. MVP menggunakan pendekatan **input koordinat + preview statis**. Drag-and-drop interaktif masuk roadmap V1.1.

- **Header Email**:
  - Upload gambar header (URL publik atau upload ke R2/S3).
  - Input warna background footer dan teks footer.
- **Template Sertifikat**:
  - Upload gambar background sertifikat (PNG/JPG).
  - Untuk setiap elemen teks dinamis, desainer mengisi form dengan field:
    - `Variabel` (dropdown: `{{nama}}`, `{{role}}`, `{{tanggal_event}}`, atau teks statis)
    - `Posisi X` (pixel dari kiri)
    - `Posisi Y` (pixel dari atas)
    - `Font Family` (dropdown pilihan terbatas: Arial, Times New Roman, Roboto, Montserrat)
    - `Font Size` (angka, dalam pixel)
    - `Font Color` (color picker, hex)
    - `Font Weight` (Normal / Bold)
    - `Text Align` (Left / Center / Right)
  - Tombol **"Tambah Elemen"** untuk menambah baris elemen baru.
  - **Preview Statis**: Setelah simpan, sistem me-render preview sertifikat dengan data sampel (nama: "Budi Santoso", role: "Peserta") dan menampilkan hasilnya sebagai gambar PNG.
- Tombol **"Salin Link Desain"** untuk dibagikan ke desainer.

#### F-12: Generasi & Pengiriman Sertifikat
- Panitia menentukan filter peserta yang menerima sertifikat:
  - Semua yang hadir (absen via QR).
  - Semua yang terdaftar (sudah isi form, hadir atau tidak).
  - Pilih manual dari daftar.
- Konfirmasi pengiriman dengan preview jumlah penerima.
- Sistem men-*generate* sertifikat PDF/PNG yang unik per peserta secara otomatis di *background*.
- Sertifikat dikirim melalui email dengan konten yang sudah dikustomisasi.
- **Pengiriman berjalan di background** (job queue), tidak menggantungkan browser panitia.

#### F-13: Monitoring Pengiriman Real-time
- Dashboard menampilkan progress:
  - Total email terkirim.
  - Total sukses, total gagal (beserta alasan kegagalan).
  - Estimasi waktu selesai.
- Log detail per peserta (bisa difilter dan dicari).
- Tombol **"Kirim Ulang"** untuk email yang gagal.

---

### 4.6 Modul Dashboard & Analitik

#### F-14: Dashboard Utama Organisasi
- Ringkasan semua campaign (aktif, selesai, draft).
- Metrik kunci per campaign: peserta terdaftar, tingkat kehadiran, sertifikat terkirim.
- Aktivitas terbaru (activity log) dari semua anggota tim.

---

## 5. Arsitektur Sistem & Keamanan

### 5.1 Isolasi Data Multi-Tenant (KRITIS)

> ⚠️ Ini adalah requirement keamanan paling kritis di devlivery.

- **Database Level**: Setiap query ke database **wajib** menggunakan filter `tenant_id`. Tidak boleh ada satu pun query yang bisa mengembalikan data dari tenant yang berbeda.
- **Middleware Auth**: Setiap request yang masuk divalidasi token-nya dan `tenant_id` di-*inject* ke context. Semua service layer menggunakan context ini, bukan parameter bebas.
- **Row-Level Security (RLS)**: Bila menggunakan PostgreSQL dengan Supabase, aktifkan RLS di semua tabel yang menyimpan data tenant.
- **Storage Isolation**: File yang diupload (template sertifikat, header, dsb.) disimpan dalam *bucket* atau *prefix path* yang dipartisi per `tenant_id`.

### 5.2 Alur Autentikasi
- Gunakan **JWT (JSON Web Token)** dengan masa berlaku pendek (access token: 15 menit, refresh token: 7 hari).
- Refresh token disimpan di database, ter-*rotasi* setiap kali digunakan.
- **Share Link Kolaborator**: Menggunakan token sementara (*scoped token*) yang:
  - Hanya bisa mengakses resource spesifik (satu campaign, satu bagian saja).
  - Tidak bisa digunakan untuk mengakses endpoint lain.
  - Bisa di-*revoke* kapan saja.

### 5.3 Stack Teknologi yang Direkomendasikan

| Layer | Teknologi | Alasan |
|---|---|---|
| **API Utama (Auth, RBAC, Campaign, Form, Peserta)** | **NestJS (TypeScript)** | Terstruktur, familiar, mendukung module isolation yang baik untuk multi-tenant |
| **Worker / Background Job** | **Python (FastAPI/Celery)** | Memanfaatkan codebase existing untuk generate sertifikat & blast email |
| **Database** | **PostgreSQL** | Relasional, mendukung RLS, ideal untuk multi-tenant |
| **Job Queue** | **Redis + Celery / BullMQ** | Background processing yang proven |
| **Frontend** | **Next.js (TypeScript)** | SSR, routing, komponen yang bisa di-compose |
| **File Storage** | **Cloudflare R2 / AWS S3** | Object storage berbiaya rendah, scalable |
| **Email Delivery** | **SMTP Gmail / SendGrid / Resend** | Reliable, support attachment sertifikat |
| **Deployment** | **Docker Compose / Kubernetes** | Portabilitas & skalabilitas |

### 5.4 Komunikasi Antar Service
```
Frontend (Next.js)
      ↓ REST API / tRPC
NestJS API (Auth, RBAC, Campaign, Form, QR, Trigger)
      ↓ Job Queue (Redis / BullMQ)
Python Worker (Generate Sertifikat, Blast Email)
      ↑ Baca data dari PostgreSQL (dengan tenant_id filter)
      ↑ Simpan file ke R2/S3
```

### 5.5 Contoh Payload Job Queue (NestJS → Python Worker)

Berikut adalah kontrak payload untuk mencegah bottleneck koordinasi antar tim.

**Job: `generate_and_send_certificate`**
```json
{
  "job_type": "generate_and_send_certificate",
  "delivery_job_id": "dlv_abc123",
  "tenant_id": "org_xyz789",
  "campaign_id": "cmp_def456",
  "submission_id": "sub_ghi012",
  "recipient": {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "dynamic_fields": {
      "role": "Peserta",
      "instansi": "Universitas Indonesia"
    }
  },
  "certificate_template": {
    "background_image_url": "https://r2.devlivery.io/org_xyz789/cmp_def456/cert_bg.png",
    "output_format": "pdf",
    "width_px": 2480,
    "height_px": 1754,
    "elements": [
      { "variable": "{{nama}}", "x": 1240, "y": 700, "font_family": "Montserrat", "font_size": 72, "font_color": "#1a1a1a", "font_weight": "bold", "text_align": "center" },
      { "variable": "{{role}}", "x": 1240, "y": 820, "font_family": "Arial", "font_size": 40, "font_color": "#555555", "font_weight": "normal", "text_align": "center" }
    ]
  },
  "email_template": {
    "subject": "Sertifikat Kehadiran — {{event}}",
    "body_html": "<p>Halo {{nama}}, berikut sertifikat Anda...</p>",
    "header_image_url": "https://r2.devlivery.io/org_xyz789/cmp_def456/email_header.png"
  },
  "sender": {
    "provider": "gmail_oauth",
    "email": "panitia@organisasi.com",
    "name": "Panitia GDGoC"
  }
}
```

**Respons yang diharapkan Python Worker** (update ke DB, bukan return value):
```json
{
  "email_log_id": "log_jkl345",
  "status": "sent",
  "sent_at": "2026-05-31T10:30:00Z",
  "certificate_file_url": "https://r2.devlivery.io/org_xyz789/cmp_def456/certs/budi_santoso.pdf",
  "error_message": null
}
```

**Job: `send_confirmation_email`** (untuk email konfirmasi + QR Code peserta)
```json
{
  "job_type": "send_confirmation_email",
  "tenant_id": "org_xyz789",
  "campaign_id": "cmp_def456",
  "submission_id": "sub_ghi012",
  "recipient": { "name": "Budi Santoso", "email": "budi@example.com" },
  "attendance_token": "550e8400-e29b-41d4-a716-446655440000",
  "email_template": { "subject": "Konfirmasi Pendaftaran", "body_html": "..." },
  "sender": { "provider": "gmail_oauth", "email": "panitia@organisasi.com", "name": "Panitia GDGoC" }
}
```

---

## 6. RBAC (Role-Based Access Control) — Detail

| Fitur | Owner | Admin | Manager | Viewer | Kolaborator (Share Link) |
|---|---|---|---|---|---|
| Kelola Anggota & Role | ✅ | ✅ | ❌ | ❌ | ❌ |
| Buat Campaign | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Campaign Milik Sendiri | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Campaign Orang Lain | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lihat Data Peserta | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export Data Peserta | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Konten Email | ✅ | ✅ | ✅ | ❌ | ✅ (via link) |
| Edit Desain Visual | ✅ | ✅ | ✅ | ❌ | ✅ (via link) |
| Generate & Kirim Sertifikat | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate Share Link | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke Share Link | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lihat Billing | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 7. Model Data Utama (Core Data Model)

### 7.1 Definisi Plan & Quota

> **Apa yang dibatasi oleh `email_quota_limit`?**  
> Kuota mengacu pada **jumlah email yang dikirim per bulan** (bukan jumlah campaign atau peserta). Setiap email yang dikirim (konfirmasi pendaftaran + sertifikat) masing-masing dihitung 1 kuota.

| Plan | `email_quota_limit` | Maks Campaign Aktif | Maks Peserta/Campaign | Harga |
|---|---|---|---|---|
| `free` | 500 email/bulan | 3 campaign | 200 peserta | Gratis |
| `pro` | 5.000 email/bulan | Unlimited | 1.000 peserta | (TBD) |
| `enterprise` | Unlimited | Unlimited | Unlimited | (TBD) |

> **Catatan MVP**: Semua organisasi di MVP mendapat plan `free`. Enforcement kuota belum aktif, namun field wajib diisi agar tidak perlu migrasi saat billing diaktifkan.

**Kapan dan siapa yang meng-increment `email_quota_used`?**
- **Python Worker** yang meng-increment field ini, **bukan NestJS**, karena hanya Worker yang tahu apakah email benar-benar terkirim ke SMTP/Gmail.
- Increment dilakukan **setelah `email_log.status` diupdate menjadi `sent`** (bukan saat job di-enqueue atau saat dimulai).
- Implementasi: satu `UPDATE organization SET email_quota_used = email_quota_used + 1 WHERE id = $tenant_id` dijalankan atomik per email sukses.
- Email yang gagal (`failed` / `bounced`) **tidak** dihitung ke kuota.
- Reset `email_quota_used = 0` dilakukan oleh NestJS via scheduled job (cron) setiap awal bulan berdasarkan `quota_reset_at`.

### 7.2 Struktur Data

```
Organization (Tenant)
├── id, name, slug, plan (free|pro|enterprise), email_quota_limit, email_quota_used, created_at
│
├── Members
│   └── user_id, role (owner|admin|manager|viewer), invited_at, status
│
└── Campaigns
    ├── id, name, date, status, tenant_id
    │
    ├── FormSchema
    │   └── fields[] { id, type, label, required, options[] }
    │
    ├── FormSubmissions
    │   └── { submission_id, respondent_email, attendance_token (UUID unik per peserta), submitted_at }
    │
    ├── EmailTemplate
    │   ├── subject, body_html (dengan variabel {{...}})
    │   ├── confirmation_subject, confirmation_body_html
    │   ├── header_image_url
    │   └── share_link_token (copywriter)
    │
    ├── CertificateTemplate
    │   ├── background_image_url
    │   ├── elements[] { type, x, y, font_family, font_size, font_color, variable }
    │   └── share_link_token (desainer)
    │
    ├── AttendanceRecords
    │   └── { submission_id, scanned_at, method: 'qr_token'|'manual' }
    │
    └── EmailLogs
        └── { submission_id, type: 'confirmation'|'certificate', status, sent_at, error_message }
```

---

## 8. Halaman & Navigasi Utama (Sitemap)

```
/ (Landing Page devlivery)
├── /auth/login
├── /auth/register (Daftar Organisasi Baru)
│
└── /dashboard (Workspace Organisasi — perlu login)
    ├── /dashboard/campaigns (List semua campaign)
    ├── /dashboard/campaigns/new (Buat campaign baru)
    ├── /dashboard/campaigns/[id]
    │   ├── /overview (Statistik campaign)
    │   ├── /form (Builder form + data peserta)
    │   ├── /email (Editor konten email)
    │   ├── /design (Editor desain sertifikat & header)
    │   ├── /attendance (Dashboard absensi + QR Code)
    │   └── /delivery (Trigger & monitor pengiriman sertifikat)
    └── /dashboard/settings
        ├── /profile (Profil organisasi)
        └── /members (Manajemen anggota & RBAC)

--- HALAMAN PUBLIK (Tanpa Login) ---
/f/[token] (Form pendaftaran peserta)
/scan/[campaign_id] (Halaman hasil scan QR Code)

--- HALAMAN KOLABORATOR (Tanpa Login Penuh) ---
/collab/email/[share_token] (Editor konten email untuk copywriter)
/collab/design/[share_token] (Editor desain untuk desainer)
```

---

## 9. Acceptance Criteria (Kriteria Penerimaan MVP)

Produk dianggap siap untuk MVP jika memenuhi semua kriteria berikut:

**Fungsional:**
- [ ] **AC-01**: Sebuah organisasi bisa mendaftar, login, dan membuat campaign dari nol.
- [ ] **AC-02**: Panitia bisa membuat form dengan minimal 5 jenis field berbeda dan mempublikasikannya.
- [ ] **AC-03**: Peserta bisa mengisi form melalui URL publik tanpa login.
- [ ] **AC-04**: Data peserta muncul di dashboard panitia dalam 5 detik setelah submit.
- [ ] **AC-05**: Setelah submit form, peserta menerima email konfirmasi beserta QR Code unik dalam waktu < 60 detik.
- [ ] **AC-06**: QR Code unik peserta (dari email konfirmasi) berhasil diverifikasi saat scan dan mencatat absensi.
- [ ] **AC-07**: Scan QR Code dengan token tidak valid → menampilkan halaman "QR Code tidak valid".
- [ ] **AC-08**: Pendaftaran ulang dengan email yang sama di campaign yang sama → ditolak dengan pesan error yang jelas.
- [ ] **AC-09**: Panitia bisa membuat dan menyimpan template email dengan variabel dinamis dan melihat preview.
- [ ] **AC-10**: Share link copywriter hanya bisa mengakses editor email, tidak bisa mengakses data lain.
- [ ] **AC-11**: Share link desainer hanya bisa mengakses editor desain, tidak bisa mengakses data lain.
- [ ] **AC-12**: Preview statis sertifikat ditampilkan dengan benar setelah desainer menyimpan konfigurasi elemen.
- [ ] **AC-13**: Sistem bisa men-generate sertifikat PDF dengan nama/variabel yang benar per peserta.
- [ ] **AC-14**: Sertifikat terkirim ke email peserta dengan attachment PDF yang benar.
- [ ] **AC-15**: Progress pengiriman dapat dipantau di dashboard secara real-time.
- [ ] **AC-16**: **[ISOLASI]** Pengguna dari Organisasi A tidak bisa mengakses data Organisasi B dalam kondisi apapun.

**Performa:**
- [ ] **AC-17**: Form publik bisa menerima minimal **200 submission dalam 1 jam** tanpa degradasi (mendukung batas peserta plan `free`).
- [ ] **AC-18**: Endpoint scan QR (`POST /attendance/scan`) harus merespons dalam **< 500ms** di P95 untuk mendukung scan bersamaan saat check-in event.
- [ ] **AC-19**: Sistem dapat menangani minimal **50 concurrent scan QR** dalam waktu bersamaan tanpa error atau duplikasi attendance record.
- [ ] **AC-20**: Endpoint kritis (submit form, verify QR, trigger delivery) harus merespons dalam **< 1 detik** di P95 pada kondisi normal.
- [ ] **AC-21**: Sistem bisa menyelesaikan pengiriman sertifikat ke **500 peserta dalam < 30 menit** (estimasi ~3.6 email/detik dengan throttling).

---

## 10. Tahapan Pengembangan (Roadmap MVP)

### Fase 0 — Fondasi (Minggu 1-2)
- [ ] Setup monorepo / multi-service project structure.
- [ ] Setup database PostgreSQL dengan schema core (Tenant, User, Campaign).
- [ ] Implementasi Auth (Register, Login, JWT, Refresh Token).
- [ ] Implementasi RBAC Middleware.
- [ ] Setup Row-Level Security (RLS) di database.

### Fase 1 — Form & Peserta (Minggu 3-4)
- [ ] Implementasi Form Builder (Backend API + Frontend UI).
- [ ] Publikasi form & URL publik.
- [ ] Halaman pengisian form untuk peserta.
- [ ] Dashboard daftar peserta + export CSV.

### Fase 2 — Absensi QR Code & Email Konfirmasi (Minggu 5)
- [ ] Generate `attendance_token` (UUID v4) per `form_submission` saat peserta submit form.
- [ ] Generate QR Code unik per peserta dari `attendance_token` (encode ke QR PNG).
- [ ] **Generate & kirim email konfirmasi + QR Code unik peserta** (F-06b — WAJIB MVP).
- [ ] Halaman verifikasi scan QR peserta: sukses, sudah hadir (idempotent), token tidak valid.
- [ ] Generate QR Code publik per campaign (untuk ditampilkan di proyektor).
- [ ] Dashboard absensi real-time.
- [ ] Absensi manual oleh panitia.
- [ ] Fitur re-kirim email konfirmasi untuk peserta tertentu dari dashboard.

### Fase 3 — Email & Sertifikat (Minggu 6-7)
- [ ] Editor konten email dengan variabel dinamis.
- [ ] Editor desain template sertifikat.
- [ ] Share link untuk copywriter dan desainer.
- [ ] Engine generate sertifikat PDF per peserta.
- [ ] Background job blast email + sertifikat.
- [ ] Dashboard monitoring pengiriman.

### Fase 4 — Polish & Launch (Minggu 8)
- [ ] Landing page devlivery.
- [ ] Manajemen anggota tim (RBAC lengkap).
- [ ] Notifikasi in-app.
- [ ] Testing end-to-end seluruh alur.
- [ ] Deployment ke VPS/Cloud dengan Docker.

---

## 11. Asumsi & Batasan

### Asumsi
- Setiap organisasi bertanggung jawab atas akun email pengirim mereka sendiri (dihubungkan via OAuth atau SMTP credentials).
- Peserta memiliki akses ke email aktif untuk menerima sertifikat.
- Template sertifikat menggunakan gambar latar belakang statis yang di-*overlay* dengan teks dinamis.

### Batasan MVP
- Pembayaran/billing tidak termasuk dalam MVP (semua akun gratis).
- Analitik lanjutan (open rate email, dsb.) tidak termasuk MVP.
- Import peserta via CSV di luar pengisian form tidak termasuk MVP (bisa ditambahkan di V1.1).

---

## 12. Open Questions

Daftar pertanyaan yang belum diputuskan secara final dan perlu didiskusikan tim sebelum development dimulai.

| # | Pertanyaan | Dampak | Status |
|---|---|---|---|
| OQ-01 | Apakah email konfirmasi (+ QR peserta) wajib dikirim, atau bisa di-off-kan per campaign? | Jika off, mekanisme absensi fallback ke manual saja. Berdampak ke alur F-08 & F-06b. | **Diputuskan**: Bisa dikonfigurasi on/off, default on. |
| OQ-02 | Apakah satu peserta bisa mendaftar ke lebih dari satu campaign dalam organisasi yang sama? | Jika ya, constraint unique hanya di level (campaign_id + email), bukan (org_id + email). | **Diputuskan**: Ya, boleh. Unique hanya per campaign. |
| OQ-03 | Siapa yang hosting infrastruktur email? Apakah tiap org pakai Gmail OAuth mereka sendiri, atau devlivery menyediakan shared SMTP? | Berdampak ke desain `organization_email_credential`, onboarding flow, dan deliverability. | **Belum diputuskan** — ⚠️ **deadline keputusan: sebelum Minggu 4** (sebelum Fase 2 selesai), bukan saat Fase 3 dimulai, karena konfigurasi sender dibutuhkan sejak email konfirmasi di Fase 2. |
| OQ-04 | Apakah batas kuota per plan (500/5000/unlimited email) sudah final? | Menentukan nilai default di DB dan logika enforcement saat billing aktif. | **Belum final** — angka sementara, perlu validasi bisnis. |
| OQ-05 | Apakah desainer perlu bisa upload font kustom (TTF/OTF), atau cukup dengan pilihan font yang sudah ditentukan? | Upload font kustom menambah kompleksitas storage & rendering di Python Worker. | **Diputuskan**: MVP hanya font preset. V1.1 tambah upload font. |
| OQ-06 | Bagaimana penanganan timezone? Apakah `event_date` disimpan dalam UTC lalu dikonversi per user, atau mengikuti timezone organisasi? | Berdampak ke tampilan di email konfirmasi dan sertifikat. | **Belum diputuskan**. |
| OQ-07 | Apakah share link kolaborator (copywriter/desainer) bisa diedit oleh lebih dari satu orang sekaligus (concurrent edit)? | Jika ya, perlu conflict resolution strategy (last-write-wins atau locking). | **Diputuskan**: MVP pakai last-write-wins, tanpa real-time collaboration. |

---

*Dokumen ini adalah PRD hidup (living document). Perubahan akan dicatat dengan update versi dan tanggal.*

*Disiapkan untuk project **devlivery** — 31 Mei 2026.*
