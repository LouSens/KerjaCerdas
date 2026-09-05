# Panduan Live Demo: KerjaCerdas

Dokumen ini disusun sebagai panduan operasional langkah demi langkah (*step-by-step*) bagi presenter dan penguji saat mendemonstrasikan kapabilitas teknis platform KerjaCerdas. Panduan ini mencakup alur lengkap pencari kerja (*Seeker*) dan perusahaan (*Employer*).

Daftar lengkap seluruh akun uji coba (*pre-seeded demo accounts*) ada di [Demo Accounts](DEMO_ACCOUNTS.md). Semua akun menggunakan kata sandi default: **`demo`** (atau nilai dari `SEED_DEFAULT_PASSWORD`). Akun yang direkomendasikan untuk demo:

- **Seeker:** `budi.santoso@example.com` — teknisi otomotif & junior developer.
- **Employer:** `hr@goto.id` (GoTo Group) atau `hr@mandiri.id` (Bank Mandiri).

---

## 🎬 Sesi 1: Alur Pencari Kerja (Seeker Flow)

*Tujuan: Memvalidasi kemampuan AI dalam membaca CV PDF, pencocokan semantik otomatis, Explainable AI, analisis celah skill, dan verifikasi OTP.*

### Langkah 1.1 — Inisialisasi & Ekstraksi CV Otomatis
- **Aksi:** Login sebagai `budi.santoso@example.com` (Sandi: `demo`). Buka halaman **Upload CV** (`/profil`), unggah berkas contoh CV PDF.
- **Yang ditunjukkan:** Kandidat tidak perlu mengisi puluhan isian form manual. Gemini mengekstrak skill, riwayat kerja, dan pendidikan secara terstruktur dalam hitungan detik, lalu sistem otomatis mengarahkan ke hasil pencocokan.
- **Teknis:** Ekstraksi teks PyMuPDF → Gemini multimodal parsing → vektor 768-dimensi di-upsert ke PostgreSQL pgvector (HNSW).

### Langkah 1.2 — AI Job Matching & Explainable AI Transparency
- **Aksi:** Buka menu **Job Match** (`/lowongan`), klik salah satu kartu lowongan untuk membuka **Job Detail Modal**.
- **Yang ditunjukkan:** Sistem mengelompokkan lowongan ke dalam 3 band (Strong, Possible, Stretch). Modal detail menampilkan rincian kalkulasi Explainable AI: Relevansi Semantik 45%, Irisan Skill 25%, Pengalaman 15%, Pendidikan 10%, Aktivitas 5% — skor bukan kotak hitam.

### Langkah 1.3 — Proactive Skill Gap Analysis
- **Aksi:** Pada lowongan kategori *Stretch*, klik tombol **"Lihat skill yang perlu dilengkapi →"** atau navigasi ke `/skill-gap`.
- **Yang ditunjukkan:** Jika kandidat belum 100% cocok, sistem merinci skill yang hilang dan merekomendasikan kursus terkurasi untuk menutup celah tersebut.

### Langkah 1.4 — Verifikasi Identitas & Phone OTP *(Demo/Mock)*
- **Aksi:** Buka menu **Verifikasi** (`/verifikasi`). Klik verifikasi pada kartu **Nomor HP**, masukkan nomor (misal `+6281234567890`), klik **Kirim Kode OTP**. Masukkan 6 digit kode OTP yang tertera pada notifikasi toast demo.
- **Yang ditunjukkan:** Alur verifikasi mendemonstrasikan pengalaman pengguna yang dirancang untuk integrasi dengan WhatsApp Gateway resmi di tahap komersial. Saat ini kode OTP ditampilkan langsung di layar untuk keperluan pengujian.
- **⚠️ Catatan:** Endpoint OTP bersifat mock — tidak terhubung ke provider SMS/WhatsApp sungguhan.

### Langkah 1.5 — Pelacakan Lamaran (Milestone Pipeline)
- **Aksi:** Buka menu **Lamaran Saya** (`/lamaran`). Tunjukkan visual timeline progres lamaran (*Tersimpan* → *Melamar* → *Ditinjau* → *Interview* → *Diterima*).
- **Yang ditunjukkan:** Kandidat mendapatkan transparansi status seleksi secara real-time.

---

## 🎬 Sesi 2: Alur Perusahaan (Employer Flow)

*Tujuan: Memvalidasi efisiensi penyaringan talenta, onboarding bertahap, dan model bisnis Pay-to-Unlock bagi UMKM.*

### Langkah 2.1 — Onboarding Terpandu (Timeline 1 -> 2 -> 3)
- **Aksi:** Buka tab baru di browser, login sebagai `hr@goto.id` (Sandi: `demo`). Buka menu **Profil Perusahaan** (`/employer/profil`) dan **Verifikasi NPWP** (`/employer/verifikasi`).
- **Yang ditunjukkan:** Employer diarahkan melalui alur terstruktur 3 langkah sebelum mempublikasikan lowongan.

### Langkah 2.2 — Bulk Job Pack Uploader (PDF)
- **Aksi:** Buka menu **Upload Job Pack** (`/employer/upload`). Seret (*drag-and-drop*) berkas PDF berisi kumpulan lowongan.
- **Yang ditunjukkan:** Untuk perusahaan dengan banyak kebutuhan rekrutmen sekaligus, Job Pack Uploader mengekstrak dan mempublikasikan seluruh lowongan dalam satu dokumen PDF secara otomatis.

### Langkah 2.3 — Pasang Lowongan & AI Live Pool Estimation
- **Aksi:** Buka menu **Pasang Lowongan** (`/employer/pasang`). Ketik judul posisi seperti **"Senior Backend Engineer"**.
- **Yang ditunjukkan:** Saat HRD mengetik spesifikasi, widget AI Live Pool memprediksi ketersediaan kandidat yang cocok secara real-time sebelum lowongan diterbitkan.

### Langkah 2.4 — Sourcing Kandidat AI & Pipeline Rekrutmen
- **Aksi:** Buka menu **Top Kandidat** (`/employer/kandidat`). Tunjukkan daftar kandidat yang telah di-rank oleh sistem matching.
- **Yang ditunjukkan:** Sistem mencocokkan profil pencari kerja yang tersedia dengan kebutuhan lowongan menggunakan hybrid ranking (semantik + skill). HRD dapat melihat skor kecocokan, skill yang sesuai, dan alasan kecocokan untuk setiap kandidat.
- **⚠️ Catatan:** Model monetisasi Pay-to-Unlock (Rp 50.000/kontak) telah dirancang namun belum terintegrasi dengan payment gateway di prototipe ini.

---

## 💡 Pertanyaan yang Umum Muncul

**T:** *Bagaimana KerjaCerdas mencegah manipulasi kata kunci tersembunyi (invisible keywords) pada CV?*
**J:** Model multimodal Gemini membaca pemahaman konteks semantik secara menyeluruh. Kumpulan kata kunci yang tidak memiliki keterkaitan logis dengan riwayat pengalaman akan diabaikan oleh Semantic Matching Engine.

**T:** *Bagaimana jaminan keamanan data pribadi pelamar diterapkan?*
**J:** NIK dan kode OTP disimpan sebagai hash SHA-256 satu arah, bukan sebagai teks biasa. Informasi kontak disensor secara default (*The Teaser Method*) dan hanya dibuka melalui mekanisme Pay-to-Unlock. AES-256-GCM saat ini adalah label deskriptif pada respons mock endpoint verifikasi, bukan enkripsi yang benar-benar berjalan di codebase. Payment gateway (Pay-to-Unlock) sendiri belum terhubung ke provider produksi; endpoint menerima token pembayaran apa pun untuk keperluan demo.
