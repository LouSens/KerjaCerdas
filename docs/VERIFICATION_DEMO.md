# Panduan Eksekusi Live Demo: KerjaCerdas

Dokumen ini disusun sebagai panduan langkah demi langkah (*step-by-step*) bagi presenter saat mendemonstrasikan kapabilitas teknis platform KerjaCerdas. Demonstrasi ini dirancang secara terukur untuk memvalidasi bagaimana *Semantic Matching* dan arsitektur *AI Swarm* mampu menyelesaikan krisis ketimpangan ganda (*oversupply* pelamar umum dan *undersupply* talenta digital). Melalui simulasi beban riil, dewan juri dapat membuktikan langsung reduksi latensi pencarian (*Time-to-Shortlist*) hingga di bawah 10 menit, memastikan platform ini siap diadopsi oleh 1.000 UMKM pada tahun pertama operasional untuk merombak efisiensi rekrutmen domestik secara relevan dan terukur.

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
- **Aksi:** Login menggunakan akun `budi.santoso@example.com` (Sandi: `demo`). Unggah berkas contoh CV PDF di panel dasbor.
- **Narasi Juri:** *"Kelemahan portal kerja tradisional adalah kandidat harus mengisi form panjang. Di KerjaCerdas, kandidat cukup mengunggah CV PDF."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Frontend:** React mengirimkan fail PDF melalui *multipart/form-data* ke *endpoint* unggahan Backend.
> 2. **Backend:** FastAPI menerima *file*. Agen ekstraksi memanggil **Gemini Pro (Multimodal)** dengan *Structured Output JSON* untuk mengekstrak kompetensi murni (membuang narasi kosong).
> 3. **Embedder:** JSON hasil ekstraksi digabungkan menjadi teks representasional, kemudian dikonversi oleh model *Embedding* menjadi Vektor 768-dimensi dan disimpan menggunakan ekstensi **`pgvector`** di PostgreSQL.

### Langkah 1.2 — AI Autopilot Matching (Pencocokan Semantik)
- **Aksi:** Arahkan kursor ke bagian **"Rekomendasi Pekerjaan AI"**.
- **Narasi Juri:** *"Tanpa pelamar mengetik apa pun, mesin SemanticMatcher kami langsung memetakan vektor CV melawan vektor lowongan. Ini bukan sekadar pencarian keyword, melainkan pemahaman konteks keahlian murni."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Backend (`matcher.py`):** Modul `SemanticMatcher.rank_jobs_for_seeker` dijalankan secara asinkron.
> 2. **Kalkulasi *Base Score*:** Algoritma menghitung **Cosine Similarity** (60% bobot) antara vektor kandidat dan seluruh lowongan aktif, ditambah rasio **Skill Overlap** (40% bobot).
> 3. **Output:** Menghasilkan skor kecocokan absolut (misal: 92%) yang sepenuhnya didasarkan pada kompetensi teknis, tanpa intervensi bias lokasi/gaji di tahap awal ini.

### Langkah 1.3 — Dual-Track Search & User-Driven Hybrid AI
- **Aksi:** Beralih ke tab **"Pencarian Kustom"**. HRD atau Pelamar menyalakan filter "Lokasi: Jakarta Selatan" dan "Gaji > Rp 10 Juta".
- **Narasi Juri:** *"Kecerdasan AI kami bersifat hybrid dan dikendalikan pengguna (User-Driven). Saat filter dinyalakan, AI beradaptasi."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Frontend:** React menangkap perubahan *state* filter dan mengirimkan objek `filters: { location: "3171", salary_min: 10000000 }` ke API.
> 2. **Backend (Hybrid Boost):** `rank_jobs_for_seeker` mendeteksi keberadaan objek filter. Sistem mengambil *Base Score* murni dari langkah 1.2, lalu memberikan **Boost Heuristik**.
> 3. Jika lokasi cocok, skor akhir otomatis ditambah **+0.15**. Jika batas gaji masuk akal, ditambah **+0.10**. *Ranking* seketika berubah di layar, merefleksikan preferensi hibrida antara kecocokan *skill* murni dan kebutuhan logistik pengguna.

### Langkah 1.4 — Proactive Skill Gap & Dynamic Routing
- **Aksi:** Pada lowongan berskor rendah, klik tombol **"🧠 Cek Gap Keahlian"**.
- **Hasil:** Agen AI merinci kelemahan dan memberikan *micro-learning*.
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Routing ke LangGraph:** Frontend menembak POST `/agent/invoke` memicu **ReAct Loop** (`create_react_agent`) di `builder.py`.
> 2. **Mini-Survey Injection (`seeker_advisor.md`):** Jika *prompt* pengguna terdeteksi terlalu pendek (misal: "gimana ya?"), AI menolak berhalusinasi dan langsung merespons dengan 2 pertanyaan klarifikasi tajam.
> 3. **Analisis Semantik Gemini:** `nodes.py` > `review_resume` menggunakan `SemanticMatcher` (Gemini 3.1 Flash untuk *embeddings*) membandingkan JSON kandidat dengan JSON *Job*.
> 4. **Dynamic Routing Token Saver (`superpowers.py`):** Jika pelamar absolut tidak memiliki *skill* wajib (mismatch 100%), *tool* simulasi ditolak sistem. Mekanisme *circuit breaker* menghemat 40% pemborosan token.
> 5. **Micro-Learning Tier 1:** *Tool* `analyze_skill_gap_tool` mengembalikan JSON internal untuk *micro-project* 15 menit, dirender rapi oleh UI.

---

## 🎬 Sesi 2: Perspektif Perusahaan (Employer Flow)

*Tujuan: Mendemonstrasikan bagaimana AI mengeliminasi keletihan administratif HRD (oversupply) dan model bisnis mikrotransaksi.*

### Langkah 2.1 — Penciptaan Lowongan & AI Live Pool
- **Aksi:** Buka tab penyamaran (*Incognito*), login sebagai `hr@goto.id`. Mulai ketik jabatan: **"Senior Data Engineer"**.
- **Narasi Juri:** *"Perhatikan angka ketersediaan talenta di pojok kanan berdetak secara real-time. HRD tahu estimasi talenta bahkan sebelum menekan tombol publikasi."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Frontend Debouncer:** Setiap ketikan tombol (*keystroke*) ditahan selama 300ms (*debounce*) sebelum menembak `POST /jobs/estimate`.
> 2. **Backend Heuristic:** Untuk memangkas biaya LLM, API ini tidak menggunakan vektor. Sistem menggunakan set irisan (*intersection*) statis antara *required_skills* yang sedang diketik dan pangkalan data pelamar aktif. Menghasilkan respons ultra-cepat <50ms.

### Langkah 2.2 — Shortlisting Bebas Bias & The Teaser Method
- **Aksi:** Buka dasbor lowongan yang tayang, klik menu **"Kandidat"**.
- **Narasi Juri:** *"Biasanya HRD harus membaca 500 PDF. Di sini, sistem sudah mengurutkan (Rerank) kandidat. Dan perhatikan, nama mereka disensor cerdas layaknya LinkedIn."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. **Backend Reverse Matching:** `matcher.py` membalik logika vektor. Vektor *Job Posting* kini bertindak sebagai *Query* mencari kandidat terdekat (`rank_seekers_for_job`).
> 2. **Redaction Middleware (`employer.py`):** Sebelum JSON dikirim ke Frontend, iterasi *middleware* mencegat *payload*. Properti `full_name` dihancurkan dan diganti menggunakan **The Teaser Method**.
> 3. Algoritma menengok objek `experience` kandidat. Jika ada riwayat bekerja di "Telkomsel", namanya direkayasa menjadi **"Someone at Telkomsel"**. Jika profil mahasiswa (kosong), diganti berdasarkan kode area **"Someone from 3171"**. Informasi kontak (`email`, `phone`) dihapus total dari memori respons.

### Langkah 2.3 — Eksekusi Monetisasi (Conceptual Pay-to-Unlock)
- **Aksi:** Tunjukkan tombol **"Buka Akses Kontak (Rp 50.000 / Kandidat)"**.
- **Narasi Juri:** *"UMKM tidak perlu membayar jutaan rupiah di muka. Dengan konsep Pay-to-Unlock, mereka hanya membayar biaya mikro per kepala. Gesekan adopsi (friction) menjadi nol."*
> **⚙️ Di Balik Layar (Technical Flow):**
> 1. Mengikuti kaidah *Minimum Viable Product*, fitur perpindahan token secara *database* diabaikan untuk menjaga kelancaran Demo.
> 2. Antarmuka UI bertindak sebagai purwarupa fungsional (*functional prototype*) dari cetak biru model bisnis B2B KerjaCerdas yang akan dikembangkan secara utuh pada fase pasca-inkubasi.

---

## 💡 Q&A Antisipasi Juri

**Tanya:** *Bagaimana jika pelamar menggunakan trik "Invisible Keyword" (Teks putih di CV)?*
**Jawab:** LLM Gemini (Multimodal) memproses CV bukan sebagai teks murni biasa, namun mengevaluasi konteks kalimat utuh. Spam *keyword* tanpa narasi logis akan ditandai anomali oleh agen *Resume Reviewer* kami, menihilkan manipulasi ATS kuno.

**Tanya:** *Apakah latensi LangGraph tidak terlalu lama untuk web interaktif?*
**Jawab:** KerjaCerdas menggunakan arsitektur aliran *Asynchronous Server-Sent Events (SSE)*. Pengguna melihat agen AI sedang "berpikir" dan merespons secara progresif, memanipulasi *perceived latency* menjadi sebuah pengalaman interaktif layaknya dialog manusia.
