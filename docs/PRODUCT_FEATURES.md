# Product Features: KerjaCerdas

Dokumen ini menjelaskan fitur utama dari platform KerjaCerdas, sebagaimana yang siap didemonstrasikan dan diuji.

---

## 1. AI Job Matching & Explainable AI Transparency

Fitur ini mengubah cara kandidat mencari pekerjaan dengan menggantikan sistem pencarian *keyword* manual menjadi pencocokan semantik otomatis. Saat kandidat mengunggah CV PDF, model AI Gemini bertugas membaca dan mengekstrak keahlian, pengalaman, serta pendidikan kandidat secara *real-time*, lalu mengubahnya menjadi Vektor Semantik 768-dimensi.

Vektor ini dicocokkan dengan seluruh lowongan aktif di database PostgreSQL (didukung index HNSW `pgvector`) menggunakan algoritma **Hybrid Ranking**:

```python
final_score = (
    cosine_similarity * 0.45 +   # Relevansi Semantik (Vektor Gemini)
    skill_overlap     * 0.25 +   # Irisan Keahlian Eksplisit
    experience_fit    * 0.15 +   # Validasi Masa Kerja
    education_fit     * 0.10 +   # Kesesuaian Pendidikan
    recency_activity  * 0.05     # Aktivitas Kandidat
)
```

Filter lokasi dan gaji yang diaktifkan pengguna diterapkan sebagai eliminasi langsung (hard filter), bukan bagian dari bobot skor di atas.

### 🔍 Transparansi Skor (Explainable AI)
Kandidat dapat membuka kartu lowongan untuk melihat rincian kalkulasi skor (*Score Breakdown*):
- **Relevansi Semantik (45%)**: Kecocokan konteks latar belakang CV dengan deskripsi pekerjaan.
- **Irisan Keahlian (25%)**: Berapa banyak skill wajib yang terpenuhi vs celah (*gap*) yang belum dikuasai.
- **Validasi Pengalaman (15%)**: Tingkat senioritas kandidat terhadap kualifikasi posisi.
- **Kesesuaian Pendidikan (10%)**: Apakah kandidat memiliki riwayat pendidikan yang tercantum.
- **Aktivitas Kandidat (5%)**: Faktor aktivitas terkini (saat ini bernilai tetap untuk semua kandidat).

Lihat [`docs/internals/01-matching-algorithm.md`](internals/01-matching-algorithm.md) untuk detail implementasi lengkap.

**Komponen terkait:** `CVUploader`, `SeekerDashboard`, `SeekerMatchResults`, `JobDetailModal`, `FloatingAdvisor`  
**API:** `POST /api/v1/uploads/cv`, `POST /api/v1/agent/invoke`, `GET /api/v1/jobs`

---

## 2. Proactive Skill Gap Analyzer (Analisis Celah Keahlian)

Sistem tidak hanya menyortir kandidat, tetapi secara proaktif memberi tahu apa kekurangan mereka terhadap target posisi impian. Melalui pipeline pemrosesan AI, sistem menganalisis kesenjangan (*gap*) antara spesifikasi lowongan dan keahlian yang tercantum di CV.

Jika kandidat memiliki celah kemampuan (misalnya belum menguasai *Docker* atau *Go Concurrency*), agen AI akan:
1. Merinci daftar skill yang hilang (*missing skills*).
2. Memberikan ringkasan rencana pembelajaran terfokus (*action plan*).
3. Merekomendasikan modul pelatihan/sertifikasi terkurasi dari mitra Ed-Tech (seperti Dicoding, Prakerja) yang dapat langsung diakses.

**Komponen terkait:** `SkillGapPanel`, `FloatingAdvisor`  
**API:** `POST /api/v1/seeker/skill-gap`, `GET /api/v1/seeker/skill-gap/latest`, `POST /api/v1/agent/invoke`

---

## 3. Employer Onboarding, Job Pack Uploader & Direct Contact Unlock

Modul ini dirancang untuk menyelesaikan beban administratif (*screening fatigue*) bagi HRD serta menawarkan model monetisasi mikro (**Pay-to-Unlock**).

### 📋 Alur Onboarding Berjenjang (Horizontal Step Timeline)
1. **Langkah 1 (Profil Perusahaan):** Input nama badan usaha, NPWP, industri, ukuran tim, dan deskripsi institusi.
2. **Langkah 2 (Verifikasi NPWP):** Pencocokan otomatis ke sistem DJP Online untuk memastikan keabsahan legalitas perusahaan.
3. **Langkah 3 (Pasang Lowongan / Upload Job Pack):** Akses pembuatan lowongan individual atau unggah massal.

### 📄 Job Pack Bulk Uploader (PDF)
Perusahaan dapat mengunggah 1 dokumen PDF berisi kumpulan banyak posisi sekaligus. AI mengekstrak setiap jabatan, kualifikasi teknis, ekspektasi kompensasi, dan menerbitkannya secara serentak dalam hitungan detik.

### 🔓 Pay-to-Unlock Model
- Profil kandidat dalam daftar pendek (*Shortlist*) ditampilkan dengan **The Teaser Method** (misal: "Someone at Tokopedia", "Someone from ITB") lengkap dengan skor kecocokan teknis.
- Perusahaan dapat membuka akses kontak langsung (Nama lengkap, email, nomor HP) dengan tarif mikro **Rp 50.000 / 10x unlock**. Integrasi payment gateway produksi belum tersedia — endpoint saat ini menerima token pembayaran apa pun, sehingga fitur berjalan sebagai demo alur interaksi lengkap tanpa transaksi nyata.

**Komponen terkait:** `EmployerDashboard`, `EmployerJobs`, `EmployerPostJob`, `JobPackUploader`, `EmployerProfile`, `EmployerCandidates`, `PricingPage`  
**API:** `POST /api/v1/employer/jobs`, `POST /api/v1/uploads/job-pack`, `POST /api/v1/employer/jobs/{id}/candidates`, `POST /api/v1/employer/jobs/{id}/unlock/{seeker_id}`, `GET/POST /api/v1/employer/profile`

---

## 4. E-KYC Identity, Credential & Phone OTP Verification

> **Status: Mock/Demo.** Fitur verifikasi saat ini menggunakan mock endpoint internal untuk demonstrasi alur pengguna. Integrasi resmi dengan API Dukcapil, SIVIL Kemdikbud, dan DJP Online memerlukan kontrak kerjasama resmi dengan instansi terkait serta kepatuhan terhadap regulasi yang berlaku.

Platform ini dirancang untuk menyelesaikan krisis kepercayaan (*Trust Crisis*) dengan validasi kredensial berlapis:

| Dokumen / Identitas | Integrasi Validasi | Field yang Diperiksa |
|---|---|---|
| **KTP / NIK** | Dukcapil E-KYC | NIK (16 digit), Nama Lengkap Sesuai KTP, Tanggal Lahir |
| **Ijazah Akademik** | SIVIL Kemdikbud | Nomor Ijazah, Nama Perguruan Tinggi, Program Studi |
| **NPWP Perusahaan** | DJP Online | Nomor Pokok Wajib Pajak (15 digit), Nama Badan Usaha |
| **Akta Perusahaan** | AHU Kemenkumham | Nomor Akta Pendirian, Nama Notaris |
| **Nomor HP / WhatsApp** | Phone OTP Gateway | Kode OTP 6-digit via WhatsApp / SMS |

### 📱 Phone OTP (Demo & Produksi)
- **Demo Testing:** Sistem menampilkan kode 6-digit langsung pada respons API / toast notifikasi sehingga pengujian alur verifikasi nomor HP berjalan 100% tanpa biaya vendor.
- **Produksi:** Terintegrasi langsung dengan WhatsApp Gateway (Fonnte) atau Twilio SMS Verify API.
- **Catatan implementasi:** respons `GET /api/v1/verify/documents` menyertakan label `"encryption": "AES-256-GCM"` (`backend/app/api/routers/verify.py`) sebagai deskripsi desain target produksi — ini adalah string literal pada respons demo, bukan enkripsi yang benar-benar dijalankan di codebase saat ini. NIK dan kode OTP disimpan sebagai hash SHA-256 satu arah, yang memenuhi tujuan non-reversibilitas tetapi bukan enkripsi simetris.

**Komponen terkait:** `VerificationDashboard`, `EmployerVerification`  
**API:** `POST /api/v1/verify/identity`, `POST /api/v1/verify/education`, `POST /api/v1/verify/npwp`, `POST /api/v1/verify/otp/send`, `POST /api/v1/verify/otp/verify`, `GET /api/v1/verify/documents`

---

## 5. Interactive Milestone Application Tracking

Pencari kerja dapat melacak progres setiap lamaran pekerjaan secara *real-time* melalui visual timeline tahapan:
- **Tersimpan** $\rightarrow$ **Melamar** $\rightarrow$ **Ditinjau HRD** $\rightarrow$ **Interview** $\rightarrow$ **Diterima / Ditolak**

Setiap kartu lamaran dilengkapi informasi status, riwayat tanggal lamar, dan catatan transparansi proses seleksi dari perusahaan terkait.

**Komponen terkait:** `ApplicationsPage`, `Sidebar`  
**API:** `POST /api/v1/seeker/apply`, `GET /api/v1/seeker/applications`, `GET/POST/DELETE /api/v1/seeker/bookmarks`

---

## 6. A/B Testing & Closed-Loop Analytics Architecture

Platform dilengkapi fondasi eksperimentasi produk:
- **Stateless Feature Flagging:** Menugaskan varian A/B (misal: alur onboarding 3 langkah vs langsung ke dashboard) menggunakan hash deterministik dari `user_id`.
- **Event Tracking:** Setiap aksi interaktif (`job_viewed`, `cv_uploaded`, `apply_submitted`) dicatat untuk melatih ulang AI (*fine-tuning*) dan mengoptimalkan konversi rekrutmen.

Detail teknis A/B testing dan roadmap pengembangan lengkap dapat dibaca pada [Roadmap](ROADMAP.md).

**Komponen terkait:** `OnboardingWizard`, `useStore`  
**API:** `GET /api/v1/experiments/assignments`, `POST /api/v1/events/track`
