# Panduan Eksekusi Live Demo & Kredensial Akun: KerjaCerdas

Dokumen ini disusun sebagai panduan operasional langkah demi langkah (*step-by-step*) bagi presenter dan penguji saat mendemonstrasikan kapabilitas teknis platform KerjaCerdas. Panduan ini mencakup alur lengkap pencari kerja (*Seeker*), perusahaan (*Employer*), serta daftar seluruh akun uji coba (*pre-seeded demo accounts*).

---

## 🔑 Daftar Akun Demo (Pre-Seeded Credentials)

Semua akun menggunakan kata sandi default: **`demo`** (atau nilai dari `SEED_DEFAULT_PASSWORD`).

### 1. Akun Pencari Kerja (Seeker Accounts)

| Email | Nama Kandidat | Latar Belakang / Profil |
|---|---|---|
| **`budi.santoso@example.com`** *(Recommended)* | Budi Santoso | Teknisi otomotif & Junior Developer (5 thn) |
| `andi.pratama@example.com` | Andi Pratama | Fresh-grad Statistika UI — Data Analytics |
| `siti.nurhaliza@example.com` | Siti Nurhaliza | Akuntan Junior (2 thn) |
| `reza.pahlawan@example.com` | Reza Pahlawan | Senior Backend Engineer (Go/Java 6 thn) |
| `putri.maharani@example.com` | Putri Maharani | Apoteker Fresh-grad UGM |
| `rina.wijaya@example.com` | Rina Wijaya | UI/UX Designer Freelance (3 thn) |
| `maya.sari@example.com` | Maya Sari | Admin Retail SMA (Entry-level) |
| `joko.widodo.p@example.com` | Joko Widodo Pratama | Supply Chain Analyst (3 thn) |
| `dewi.kartika@example.com` | Dewi Kartika | Content Writer & Digital Marketer (4 thn) |
| `linda.halim@example.com` | Linda Halim | Banker BCA (7 thn) |

### 2. Akun Perusahaan (Employer Accounts)

| Email | Nama Perusahaan | Sektor Industri |
|---|---|---|
| **`hr@goto.id`** *(Recommended)* | GoTo Group (Gojek / Tokopedia) | Teknologi / E-Commerce |
| **`hr@mandiri.id`** | Bank Mandiri | Perbankan & Keuangan |
| `hr@telkom.id` | Telkom Indonesia | Telekomunikasi |
| `hr@bca.id` | Bank Central Asia (BCA) | Perbankan |
| `hr@pertamina.id` | Pertamina | Energi & Migas |
| `hr@traveloka.id` | Traveloka | Tech / Online Travel |
| `hr@ruangguru.id` | Ruangguru | Ed-Tech |
| `hr@halodoc.id` | Halodoc | Healthtech |
| `hr@astra.id` | Astra International | Otomotif & Konglomerat |
| `hr@kalbe.id` | Kalbe Farma | Farmasi & Kesehatan |

---

## 🎬 Sesi 1: Alur Pencari Kerja (Seeker Flow)

*Tujuan: Memvalidasi kemampuan AI dalam membaca CV PDF, pencocokan semantik otomatis, Explainable AI, analisis celah skill, dan verifikasi OTP.*

### Langkah 1.1 — Inisialisasi & Ekstraksi CV Otomatis
- **Aksi:** Login sebagai `budi.santoso@example.com` (Sandi: `demo`). Buka halaman **Upload CV** (`/profil`), unggah berkas contoh CV PDF.
- **Narasi Juri:** *"Kandidat tidak perlu mengisi puluhan isian form manual. AI Gemini mengekstrak skill, riwayat kerja, dan pendidikan secara terstruktur dalam 2 detik, lalu sistem otomatis mengarahkan ke hasil pencocokan."*
- **Teknis:** Ekstraksi teks PyMuPDF $\rightarrow$ Gemini Multimodal Parsing $\rightarrow$ Vektor 768-dimensi di-upsert ke PostgreSQL pgvector (HNSW).

### Langkah 1.2 — AI Job Matching & Explainable AI Transparency
- **Aksi:** Buka menu **Job Match** (`/lowongan`), klik salah satu kartu lowongan untuk membuka **Job Detail Modal**.
- **Narasi Juri:** *"Sistem mengelompokkan lowongan ke dalam 3 band (Strong, Possible, Stretch). Melalui modal detail, kandidat dapat melihat rincian kalkulasi Explainable AI: Relevansi Semantik 50%, Irisan Skill 30%, Lokasi 10%, Ekspektasi Gaji 5%, dan Pengalaman 5% — membuktikan AI bukan kotak hitam."*

### Langkah 1.3 — Proactive Skill Gap Analysis
- **Aksi:** Pada lowongan kategori *Stretch*, klik tombol **"Lihat skill yang perlu dilengkapi →"** atau navigasi ke `/skill-gap`.
- **Narasi Juri:** *"Jika kandidat belum 100% cocok, AI tidak hanya menolak melainkan merinci missing skills dan merekomendasikan kursus terkurasi dari mitra Ed-Tech untuk menutup celah tersebut."*

### Langkah 1.4 — Verifikasi Identitas & Phone OTP
- **Aksi:** Buka menu **Verifikasi** (`/verifikasi`). Klik verifikasi pada kartu **Nomor HP**, masukkan nomor (misal `+6281234567890`), klik **Kirim Kode OTP**. Masukkan 6 digit kode OTP yang tertera pada notifikasi toast demo.
- **Narasi Juri:** *"Sistem verifikasi kami menjamin validitas pelamar dengan enkripsi AES-256-GCM. Fitur OTP demo ini siap dihubungkan langsung ke WhatsApp Gateway resmi di tahap komersial."*

### Langkah 1.5 — Pelacakan Lamaran (Milestone Pipeline)
- **Aksi:** Buka menu **Lamaran Saya** (`/lamaran`). Tunjukkan visual timeline progres lamaran (*Tersimpan* $\rightarrow$ *Melamar* $\rightarrow$ *Ditinjau* $\rightarrow$ *Interview* $\rightarrow$ *Diterima*).
- **Narasi Juri:** *"Kandidat mendapatkan transparansi status seleksi secara real-time tanpa ketidakpastian."*

---

## 🎬 Sesi 2: Alur Perusahaan (Employer Flow)

*Tujuan: Memvalidasi efisiensi penyaringan talenta, onboarding bertahap, dan model bisnis Pay-to-Unlock bagi UMKM.*

### Langkah 2.1 — Onboarding Terpandu (Timeline 1 -> 2 -> 3)
- **Aksi:** Buka tab baru di browser, login sebagai `hr@goto.id` (Sandi: `demo`). Buka menu **Profil Perusahaan** (`/employer/profil`) dan **Verifikasi NPWP** (`/employer/verifikasi`).
- **Narasi Juri:** *"Employer diarahkan melalui alur terstruktur 3 langkah sebelum mempublikasikan lowongan, memastikan seluruh lowongan berasal dari badan usaha yang terverifikasi di DJP Online."*

### Langkah 2.2 — Bulk Job Pack Uploader (PDF)
- **Aksi:** Buka menu **Upload Job Pack** (`/employer/upload`). Seret (*drag-and-drop*) berkas PDF berisi kumpulan lowongan.
- **Narasi Juri:** *"Untuk perusahaan dengan banyak kebutuhan rekrutmen sekaligus, Job Pack Uploader mengekstrak dan mempublikasikan seluruh lowongan dalam satu dokumen PDF secara otomatis."*

### Langkah 2.3 — Pasang Lowongan & AI Live Pool Estimation
- **Aksi:** Buka menu **Pasang Lowongan** (`/employer/pasang`). Ketik judul posisi seperti **"Senior Backend Engineer"**.
- **Narasi Juri:** *"Saat HRD mengetik spesifikasi, widget AI Live Pool memprediksi ketersediaan kandidat yang cocok (>80% match score) secara real-time sebelum lowongan diterbitkan."*

### Langkah 2.4 — Shortlisting Bebas Bias & Pay-to-Unlock
- **Aksi:** Buka menu **Top Kandidat** (`/employer/kandidat`). Tunjukkan daftar kandidat yang telah disortir AI.
- **Narasi Juri:** *"Nama kandidat disamarkan dengan The Teaser Method (contoh: 'Someone at Tokopedia'). HRD dapat mengevaluasi kualitas dan skor kandidat terlebih dahulu, lalu membayar biaya mikro Rp 50.000 via Pay-to-Unlock hanya ketika ingin menghubungi kandidat terpilih."*

---

## 💡 Q&A Antisipasi Dewan Juri

**Tanya:** *Bagaimana KerjaCerdas mencegah kecurangan manipulasi kata kunci putih (invisible keywords) pada CV?*  
**Jawab:** Model multimodal Gemini membaca pemahaman konteks semantik secara menyeluruh. Kumpulan kata kunci yang tidak memiliki keterkaitan logis dengan riwayat pengalaman akan diabaikan oleh Semantic Matching Engine.

**Tanya:** *Bagaimana jaminan keamanan data pribadi pelamar diterapkan?*  
**Jawab:** Seluruh data identitas dienkripsi menggunakan AES-256-GCM. Informasi kontak disensor secara default dan hanya dibuka melalui mekanisme Pay-to-Unlock terotorisasi sesuai ketentuan UU PDP No.27/2022.
