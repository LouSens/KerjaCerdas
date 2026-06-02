# Panduan Eksekusi Live Demo: KerjaCerdas

Dokumen ini disusun sebagai panduan langkah demi langkah (*step-by-step*) bagi presenter saat mendemonstrasikan kapabilitas teknis platform KerjaCerdas di hadapan dewan juri atau investor. Panduan ini dirancang untuk menyoroti keunggulan kompetitif inti: *Semantic Matching* dan *AI Swarm*.

---

## Persiapan Sebelum Presentasi

1. **Pastikan Lingkungan Aktif:**
   Jalankan perintah `docker compose up --build` di terminal. Pastikan indikator status kontainer Frontend (Port 3000) dan Backend (Port 8000) berstatus sehat (*healthy*).
2. **Kondisi Basis Data:**
   Sistem secara bawaan telah diinjeksi dengan 21 lowongan kerja (*mock data*) dan 20 profil kandidat dasar untuk memastikan visualisasi *Live Pool* berfungsi optimal.
3. **Pembersihan Cache:**
   Buka mode penyamaran (*Incognito Window*) di browser untuk memastikan tidak ada *state* sesi lama yang tersisa.

---

## 🎬 Sesi 1: Perspektif Pencari Kerja (Seeker Flow)

*Tujuan: Mendemonstrasikan bagaimana AI secara aktif memecahkan kebingungan pelamar (undersupply) dan melakukan "Skill Gap Analysis".*

### Langkah 1.1 — Inisialisasi & Ekstraksi Profil Otomatis
- **Aksi:** Login menggunakan akun `budi.santoso@example.com` (Sandi: `demo`).
- **Narasi Juri:** *"Kelemahan portal kerja tradisional adalah kandidat harus mengisi form panjang. Di KerjaCerdas, kandidat cukup mengunggah CV PDF. Mari kita lihat..."*
- **Aksi:** Unggah berkas contoh CV PDF di panel dasbor.
- **Hasil:** Gemini AI langsung melakukan parsing seketika (*real-time*). Keahlian teknis (Python, SQL), riwayat pendidikan, dan pengalaman langsung diekstrak dan dikonversi menjadi Vektor 3072-dimensi.

### Langkah 1.2 — AI Autopilot Matching (Pencocokan Semantik)
- **Aksi:** Arahkan kursor ke bagian **"Rekomendasi Pekerjaan AI"**.
- **Narasi Juri:** *"Tanpa pelamar mengetik apa pun, mesin SemanticMatcher kami langsung memetakan vektor CV Andi melawan 21 vektor lowongan di basis data. Sistem menghasilkan skor 'Match Ranking' (misal: 92% kecocokan). Ini bukan sekadar pencarian keyword, melainkan pemahaman konteks keahlian."*

### Langkah 1.3 — Dual-Track Search (Momen "Aha!")
- **Aksi:** Beralih ke tab **"Pencarian Kustom"**. Ketik secara manual jabatan yang sama sekali tidak terkait dengan Andi, misalnya: **"Digital Marketing Manager"**.
- **Narasi Juri:** *"Bagaimana jika Andi melamar posisi yang salah? Saat Andi mencari lowongan di luar ranah teknologinya, lowongan tetap muncul, TETAPI sistem dengan tegas memberikan lencana skor rendah (misal: 25%)."*
- **Highlight:** Tekankan bahwa KerjaCerdas tidak buta terhadap eksplorasi manual; AI tetap menyematkan posisinya secara objektif.

### Langkah 1.4 — Proactive Skill Gap & Upskilling
- **Aksi:** Pada lowongan berskor rendah tadi, klik tombol **"🧠 Cek Gap Keahlian"**.
- **Hasil:** Panel *LangGraph Swarm* akan terbuka. Agen AI merinci kelemahan spesifik Andi (misal: "Anda kurang pemahaman SEO dan Google Analytics").
- **Narasi Juri:** *"Kami tidak membuang kandidat yang underqualified. Agen AI kami menganalisis gap mereka dan seketika menyalurkan mereka ke kursus pelatihan terverifikasi (Prakerja/Dicoding) untuk menutup gap tersebut."*

---

## 🎬 Sesi 2: Perspektif Perusahaan (Employer Flow)

*Tujuan: Mendemonstrasikan bagaimana AI mengeliminasi keletihan administratif HRD (oversupply) dan model bisnis mikrotransaksi.*

### Langkah 2.1 — Penciptaan Lowongan & AI Live Pool
- **Aksi:** Buka tab penyamaran (*Incognito*) baru, login sebagai `hr@goto.id` (Sandi: `demo`). Masuk ke menu **"Pasang Lowongan"**.
- **Aksi:** Mulai ketik jabatan: **"Senior Data Engineer"**.
- **Narasi Juri:** *"Sesaat setelah HRD mengetik, perhatikan angka di pojok kanan. Algoritma vektor kami memprediksi ketersediaan talenta secara real-time. 'Terdapat 14 kandidat dengan profil 80% mirip di pangkalan data'. HRD tahu sebelum lowongan diterbitkan."*

### Langkah 2.2 — Shortlisting Bebas Bias (Anti-Fatigue)
- **Aksi:** Buka dasbor lowongan yang sudah tayang, lalu klik menu **"Kandidat"**.
- **Narasi Juri:** *"Biasanya HRD harus membaca 500 PDF. Di sini, sistem LangGraph sudah mengurutkan (Rerank) kandidat menjadi Top-5 terbaik berdasarkan Jaccard Intersection dan Cosine Similarity. HRD bisa langsung melihat rangkuman 'Mengapa kandidat ini cocok'."*

### Langkah 2.3 — Eksekusi Monetisasi (Direct Contact Unlock)
- **Aksi:** Klik nama kandidat teratas (misal: "Budi Santoso"). Informasi email dan telepon aslinya terlihat disensor (***@***.com).
- **Aksi:** Klik tombol **"Buka Akses Kontak (Rp 500.000 / 10 Kandidat)"**.
- **Narasi Juri:** *"UMKM tidak perlu membayar jutaan rupiah di muka untuk langganan bulanan. Dengan konsep Pay-to-Unlock, mereka hanya membayar biaya mikro Rp 50.000 per kepala ketika mereka yakin kandidat ini berkualitas. Gesekan adopsi (friction) bagi UMKM menjadi nol."*

---

## 💡 Q&A Antisipasi Juri

**Tanya:** *Bagaimana jika pelamar menggunakan trik "Invisible Keyword" (Teks putih di CV)?*
**Jawab:** LLM Gemini (Multimodal) memproses CV bukan sebagai teks murni biasa, namun mengevaluasi konteks kalimat utuh. Spam *keyword* tanpa narasi logis akan ditandai anomali oleh agen *Resume Reviewer* kami, menurunkan skor probabilitasnya.

**Tanya:** *Apakah latensi LangGraph tidak terlalu lama untuk web interaktif?*
**Jawab:** KerjaCerdas menggunakan arsitektur aliran *Asynchronous Server-Sent Events (SSE)*. Pengguna melihat agen AI sedang "berpikir" dan merespons secara progresif (layaknya ChatGPT), memanipulasi *perceived latency* menjadi sebuah pengalaman interaktif yang menawan alih-alih layar memuat (*loading screen*) statis.
