# Panduan Eksekusi Live Demo: KerjaCerdas

Dokumen ini disusun sebagai panduan langkah demi langkah (*step-by-step*) bagi presenter saat mendemonstrasikan kapabilitas teknis platform KerjaCerdas. Demonstrasi ini dirancang secara terukur untuk memvalidasi bagaimana *Semantic Matching*, *Explainable AI*, dan arsitektur *AI Swarm* mampu menyelesaikan krisis ketimpangan ganda (*oversupply* pelamar umum dan *undersupply* talenta digital).

---

## Persiapan Sebelum Presentasi

1. **Pastikan Lingkungan Aktif:**
   Jalankan perintah `docker compose up --build` atau `npm run dev` (Frontend) & `uvicorn backend.app.main:app` (Backend).
2. **Kondisi Basis Data:**
   Sistem secara bawaan telah diinjeksi dengan data lowongan dan profil kandidat dasar untuk memastikan visualisasi *Live Pool* berfungsi optimal.
3. **Pembersihan Cache / Mode Penyamaran:**
   Buka mode penyamaran (*Incognito Window*) di browser untuk memastikan sesi bersih.

---

## 🎬 Sesi 1: Perspektif Pencari Kerja (Seeker Flow)

*Tujuan: Mendemonstrasikan bagaimana AI secara aktif memecahkan kebingungan pelamar melalui Semantic Matching, Explainable AI, Skill Gap Analysis, dan Phone OTP.*

### Langkah 1.1 — Inisialisasi & Ekstraksi Profil Otomatis
- **Aksi:** Login menggunakan akun `budi.santoso@example.com` (Sandi: `demo`). Unggah berkas contoh CV PDF di halaman **Upload CV** (`/profil`).
- **Narasi Juri:** *"Kelemahan portal kerja tradisional adalah kandidat harus mengisi puluhan kolom form secara manual. Di KerjaCerdas, kandidat cukup mengunggah CV PDF, dan AI Gemini mengekstrak data terstruktur dalam 2 detik sebelum otomatis mengarahkan ke halaman hasil pencocokan."*
- **Teknis:** FastAPI menerima PDF, Gemini multimodal mengurai teks ke JSON terstruktur, lalu di-embed menjadi vektor 768-dimensi dan disimpan di PostgreSQL dengan pgvector index HNSW.

### Langkah 1.2 — AI Autopilot Matching & Explainable AI
- **Aksi:** Buka halaman **Job Match** (`/lowongan`), klik salah satu kartu rekomendasi untuk membuka **Job Detail Modal**.
- **Narasi Juri:** *"Tanpa pelamar mengetik keyword apa pun, mesin pencocokan semantik langsung memetakan kecocokan ke dalam band (Strong, Possible, Stretch). Dan perhatikan: sistem kami bukan kotak hitam (black-box). Kandidat dapat melihat rincian kalkulasi Explainable AI: Relevansi Semantik 50%, Irisan Skill 30%, Lokasi 10%, Ekspektasi Gaji 5%, dan Pengalaman 5%."*

### Langkah 1.3 — Proactive Skill Gap Analysis
- **Aksi:** Pada lowongan di kategori *Stretch*, klik tombol **"Lihat skill yang perlu dilengkapi →"** atau buka menu **Skill Gap** (`/skill-gap`).
- **Narasi Juri:** *"Jika kandidat belum 100% cocok, sistem tidak sekadar menolak. AI membedah celah keahlian (missing skills) dan langsung menyajikan rekomendasi kursus terkurasi dari mitra pelatihan digital."*

### Langkah 1.4 — Verifikasi Identitas & Phone OTP
- **Aksi:** Buka menu **Verifikasi** (`/verifikasi`). Klik verifikasi pada kartu **Nomor HP**. Masukkan nomor internasional (misal: `+6281234567890`), lalu klik **Kirim Kode OTP**. Masukkan 6 digit kode yang tampil di toast demo.
- **Narasi Juri:** *"Untuk menjamin integritas data tanpa membebani biaya SMS pada tahap pengujian, kami menerapkan Demo OTP Engine yang mengembalikan kode verifikasi instan, yang siap dihubungkan ke WhatsApp Gateway resmi pada tahap produksi."*

### Langkah 1.5 — Pelacakan Lamaran (Application Milestone Tracking)
- **Aksi:** Buka menu **Lamaran Saya** (`/lamaran`). Tunjukkan visual timeline tahapan lamaran (*Tersimpan* $\rightarrow$ *Melamar* $\rightarrow$ *Ditinjau* $\rightarrow$ *Interview* $\rightarrow$ *Diterima*).
- **Narasi Juri:** *"Kandidat tidak lagi dibiarkan dalam kegelapan. Setiap progres seleksi dapat dipantau secara transparan dan terstruktur."*

---

## 🎬 Sesi 2: Perspektif Perusahaan (Employer Flow)

*Tujuan: Mendemonstrasikan bagaimana AI mengeliminasi keletihan administratif HRD (oversupply), alur onboarding bertahap, dan model bisnis Pay-to-Unlock.*

### Langkah 2.1 — Onboarding Terpandu & Verifikasi NPWP
- **Aksi:** Buka tab baru, login sebagai akun employer `hr@goto.id` (Sandi: `demo`). Buka menu **Profil Perusahaan** (`/employer/profil`) dan **Verifikasi NPWP** (`/employer/verifikasi`).
- **Narasi Juri:** *"Employer dipandu melalui timeline 3 langkah (1. Profil $\rightarrow$ 2. Verifikasi NPWP $\rightarrow$ 3. Pasang Lowongan). Verifikasi NPWP ke DJP Online memastikan hanya institusi legal yang dapat mempublikasikan lowongan."*

### Langkah 2.2 — Bulk Job Pack Uploader (PDF)
- **Aksi:** Buka menu **Upload Job Pack** (`/employer/upload`). Seret (*drag-and-drop*) dokumen PDF job description.
- **Narasi Juri:** *"Untuk perusahaan yang memiliki puluhan pembukaan posisi sekaligus, Job Pack Uploader kami memecah dan mempublikasikan seluruh lowongan secara otomatis hanya dari satu dokumen PDF."*

### Langkah 2.3 — Pasang Lowongan & AI Live Pool Estimation
- **Aksi:** Buka menu **Pasang Lowongan** (`/employer/pasang`). Ketik jabatan: **"Senior Backend Engineer"**.
- **Narasi Juri:** *"Saat HRD mengetik kualifikasi, widget AI Live Pool di panel kanan memprediksi estimasi ketersediaan talenta yang cocok (>80% score) secara real-time sebelum lowongan diterbitkan."*

### Langkah 2.4 — Shortlisting Bebas Bias & Pay-to-Unlock
- **Aksi:** Buka menu **Top Kandidat** (`/employer/kandidat`). Tunjukkan daftar kandidat yang telah diurutkan AI berdasarkan kecocokan teknis.
- **Narasi Juri:** *"Nama kandidat disensor cerdas menggunakan The Teaser Method (misal: 'Someone at Tokopedia' atau 'Someone from ITB'). HRD dapat mengevaluasi kualitas dan skor kandidat terlebih dahulu, lalu membayar biaya mikro Rp 50.000 via Pay-to-Unlock hanya saat ingin menghubungi kandidat terpilih."*

---

## 💡 Q&A Antisipasi Juri

**Tanya:** *Bagaimana jika pelamar memasukkan keyword tersembunyi (white text) di CV?*  
**Jawab:** Gemini multimodal mengevaluasi pemahaman semantik dan konteks kalimat utuh pada dokumen CV. Spam kata kunci tanpa relasi logis akan diabaikan oleh Semantic Matching Engine.

**Tanya:** *Bagaimana perlindungan data pribadi pelamar diterapkan?*  
**Jawab:** Seluruh data identitas terenkripsi dengan AES-256-GCM. Informasi kontak disensor secara default dan hanya dibuka melalui mekanisme otorisasi Pay-to-Unlock sesuai mandat UU PDP No.27/2022.
