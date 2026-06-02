<div align="center">

<img src="frontend/public/vite.svg" alt="KerjaCerdas Logo" width="120" height="120">

# KerjaCerdas
**Autonomous Recruitment Platform powered by Semantic Matching & Multi-Agent Swarm**

[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com) [![Frontend: React 18](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://react.dev) [![AI: Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev) [![Agents: LangGraph](https://img.shields.io/badge/Agents-LangGraph-FF6F00?style=flat-square)](https://langchain-ai.github.io/langgraph/) [![Tooling: Vite](https://img.shields.io/badge/Tooling-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev) 

*An enterprise-grade talent matching infrastructure utilizing high-dimensional vector search and ReAct-based autonomous agents to streamline recruitment pipelines.*

<br>
</div>

---

## 📌 Problem We Solve

Indonesia memiliki **7,86 juta pengangguran terbuka** (BPS, Feb 2025). Di sisi lain, sektor industri mengeluhkan kesulitan mencari talenta yang tepat. Akar permasalahan ini adalah **ketimpangan ganda (Triple Mismatch)**:

| Mismatch | Dampak |
|---|---|
| **Structural Mismatch** (Kelebihan pelamar umum vs Kekurangan talenta digital) | Ekspansi industri modern terhambat oleh kelangkaan SDM berkualifikasi. |
| **Relevance Mismatch** (Pencarian *keyword* yang mengabaikan semantik) | Kandidat berkualitas tidak terdeteksi; kandidat yang kurang tepat masuk daftar pendek (shortlist). |
| **Trust Mismatch** (CV tak terverifikasi & penipuan lowongan) | Talenta terhambat validasi; pelamar berisiko terkena penipuan (*fraud*). |

Portal pekerjaan konvensional beroperasi sebagai **mesin pencari berbasis kata kunci (keyword)** yang statis. KerjaCerdas memecahkan masalah ini dengan memahami konteks dan semantik kompetensi.

---

## ✨ Key Differences

| Fitur | Portal Konvensional | **KerjaCerdas (Enterprise AI)** |
|---|---|---|
| **Mesin Pencocokan** | Filter *Keyword* Kaku | **Gemini Semantic Embeddings (3072-dim)** |
| **Arsitektur Agen** | Chat Bot Sederhana | **ReAct Multi-Agent Supervisor Swarm** |
| **Sistem Navigasi UI** | Linear & Searah | **Dual-Track (AI Autopilot & Manual Search)** |
| **Analisis Celah Keahlian** | Tidak Ada | **Identifikasi spesifik + Rekomendasi program Ed-Tech** |
| **Monetisasi B2B** | Biaya Berlangganan di Muka | **Hybrid: Pay-to-Unlock (Rp 50rb/10 kandidat) & SaaS Pro** |

---

## 🎯 Fitur Utama (Live Demo Ready)

### 1. AI Job Matching (Pencocokan Pekerjaan AI)
Fitur ini mengubah cara kandidat mencari pekerjaan dengan menggantikan sistem pencarian *keyword* manual (seperti mengetik "Python Backend Developer") menjadi pencocokan semantik otomatis. Saat kandidat mengunggah CV PDF, model AI Gemini bertugas membaca dan mengekstrak keahlian, pengalaman, serta pendidikan kandidat secara *real-time*, lalu mengubahnya menjadi "Vektor Semantik" berdimensi tinggi. Vektor ini kemudian dicocokkan dengan seluruh vektor lowongan pekerjaan yang ada di *database* PostgreSQL menggunakan algoritma Cosine Similarity. Hasilnya, kandidat langsung mendapatkan rekomendasi pekerjaan dengan persentase skor kecocokan yang sangat akurat, karena sistem memahami konteks keahlian pelamar—bukan sekadar kemiripan kata.

### 2. Proactive Skill Gap Analyzer (Analisis Celah Keahlian Proaktif)
Sistem tidak hanya menolak kandidat jika kemampuannya kurang sesuai, tetapi secara proaktif memberi tahu apa kelemahan mereka. Melalui arsitektur *Multi-Agent Swarm* (agen AI otonom dari LangGraph), sistem akan menganalisis kesenjangan (gap) antara spesifikasi lowongan yang dilamar dan keahlian yang tercantum di CV kandidat. Jika kandidat memiliki skor kecocokan rendah (misalnya kurang menguasai "AWS" atau "Google Analytics"), agen AI akan merinci kelemahan tersebut secara interaktif dan langsung memberikan rekomendasi program *upskilling* spesifik (seperti pelatihan dari Prakerja atau platform Ed-Tech) agar kandidat bisa meningkatkan keahliannya sebelum mencoba melamar kembali.

### 3. Employer Dashboard & Direct Contact Unlock (Dasbor Perusahaan & Buka Kontak)
Modul ini dirancang untuk menyelesaikan masalah kelelahan administratif (*screening fatigue*) bagi HRD serta menawarkan model monetisasi yang bersahabat bagi UMKM. Saat HRD mengetik rancangan lowongan baru, AI memprediksi ketersediaan jumlah talenta yang cocok secara *real-time* dari *Live Pool* sebelum lowongan diterbitkan. Setelah lowongan tayang, agen AI sudah menyortir ratusan pelamar ke dalam daftar pendek (*Shortlist*) Top-5 Kandidat Terbaik lengkap dengan ringkasan alasan kecocokannya. Alih-alih mengharuskan HRD atau UMKM membayar biaya berlangganan mahal di muka, platform ini menggunakan sistem transaksi mikro (*Pay-to-Unlock*): profil asli dan skor kandidat disajikan secara transparan, namun akses email/telepon disensor. Perusahaan hanya perlu membayar biaya mikro (misal Rp 50.000) pada saat mereka memutuskan untuk menghubungi kandidat unggulan tersebut.

---

## 📸 Screenshots

<div align="center">
  <img src="docs/assets/seeker_dashboard.png" alt="Seeker Dashboard" width="32%">
  <img src="docs/assets/job_matches.png" alt="AI Job Matches" width="32%">
  <img src="docs/assets/employer_dashboard.png" alt="Employer Dashboard" width="32%">
</div>

---

## 🚀 Quick Start

### Persyaratan Sistem
- **Docker Desktop** beroperasi pada sistem.
- (Opsional) Kunci API `GEMINI_API_KEY` dari Google AI Studio.

### Langkah 1 — Inisialisasi Repositori
```powershell
git clone https://github.com/LouSens/KerjaCerdas.git
cd KerjaCerdas
Copy-Item .env.example .env
```
Konfigurasi kredensial pada berkas `.env` (isi dengan kredensial Anda):
```env
JWT_SECRET_KEY=kredensial-rahasia-anda
GEMINI_API_KEY=kunci-api-gemini-anda
```

### Langkah 2 — Eksekusi Kontainer
Jalankan perintah berikut di terminal:
```powershell
docker compose up --build
```
*(Proses ini akan membangun image backend dan frontend, memuat basis data PostgreSQL lokal (pgvector), serta memuat data awal (21 lowongan dan 20 kandidat) otomatis via `init.sql`).*

### Langkah 3 — Akses Lingkungan Demo
- **Frontend App:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Documentation (Swagger):** `http://localhost:8000/docs`

---

## 🧠 Arsitektur Sistem Inti

Platform kami tidak mengandalkan *Prompt Wrapper* statis. Pusat logika diorkestrasi oleh arsitektur *Autonomous Multi-Agent Swarm* memanfaatkan framework **LangGraph** dan model **Gemini 3.1 Flash**.

### 1. Eksekusi Otonom Paralel (Parallel Function Calling)
*Supervisor Node* merutekan permintaan kandidat secara dinamis. Apabila kandidat meminta pencarian lowongan sekaligus evaluasi CV, sistem akan mengeksekusi modul `SearchJobsAgent` dan `ResumeReviewAgent` secara bersamaan, kemudian mensintesis laporan gabungan.

### 2. Hibridisasi Penilaian (Hybrid Ranking)
Sistem menggunakan komposit metrik matematis untuk mereplikasi prioritas SDM:
```python
final_score = (
    cosine_similarity * 0.50 +   # Relevansi Semantik (Vektor Gemini)
    skill_overlap     * 0.30 +   # Irisan Keahlian Eksplisit
    region_boost      * 0.10 +   # Kesesuaian Geografis
    salary_fit        * 0.05 +   # Penyesuaian Anggaran
    experience_fit    * 0.05     # Validasi Masa Kerja
)
```

### 3. Kepatuhan Privasi (Data Isolation)
Sebelum diproses oleh model eksternal, komponen PII (Personally Identifiable Information) dimitigasi secara otomatis oleh modul penyaring Regex guna memenuhi standar kepatuhan operasional.

---

## 📂 Struktur Repositori

```
KerjaCerdas/
│
├── backend/                  # API FastAPI & Logika LangGraph Swarm
│   ├── app/
│   │   ├── api/              # Interface Endpoints FastAPI
│   │   │   ├── routers/
│   │   │   │   ├── agent.py       # Endpoint streaming SSE untuk LangGraph
│   │   │   │   ├── auth.py        # Login/Register (JWT)
│   │   │   │   ├── employer.py    # Endpoint perusahaan & kandidat pelamar
│   │   │   │   ├── jobs.py        # Pencarian dan paginasi lowongan
│   │   │   │   ├── seeker.py      # Profil, bookmark, history aplikasi
│   │   │   │   ├── uploads.py     # Endpoint Multi-modal PDF Parser
│   │   │   │   └── verify.py      # E-KYC Dukcapil/SIVIL webhook
│   │   │   ├── schemas/           # Pydantic validation schemas
│   │   │   └── services/          # Business logic helpers
│   │   ├── agents/           # Arsitektur Multi-Agent & LLM
│   │   │   ├── graph/
│   │   │   │   ├── builder_v2.py  # Konstruktor ReAct Supervisor Swarm
│   │   │   │   └── nodes.py       # Worker Nodes (Search, SkillGap, Advisor)
│   │   │   ├── tools/
│   │   │   │   └── superpowers.py # Kumpulan fungsi (tools) untuk Gemini
│   │   │   ├── memory/            # Checkpointer & conversational state
│   │   │   └── telemetry/         # Logger & tracing performa AI
│   │   ├── services/
│   │   │   └── matching/          # Core Recommendation Engine
│   │   │       ├── embeddings/    # Gemini Vector generator
│   │   │       ├── matcher.py     # Algoritma Cosine Similarity + Heuristik
│   │   │       └── ranker.py      # Pembobotan skor
│   │   ├── db/
│   │   │   ├── postgres_store.py  # Abstraksi Async Session & SQLAlchemy Repository
│   │   │   ├── models.py          # Definisi Skema Tabel PostgreSQL (pgvector)
│   │   │   ├── schemas.py         # Skema Validasi Pydantic
│   │   │   └── session.py         # Konfigurasi Koneksi Asyncpg
│   │   └── config/
│   │       └── settings.py        # Manajemen variabel lingkungan (.env)
│   ├── tests/                # Unit & Integration Tests (Pytest)
│   ├── alembic/              # Skrip Migrasi Basis Data (Alembic)
│   ├── scripts/
│   │   ├── seed_all.py       # Skrip data utama
│   │   ├── seed_employers.py # Data Perusahaan
│   │   ├── seed_seekers.py   # Data Kandidat
│   │   └── seed_courses.py   # Data Kursus
│   └── requirements.txt
│
├── frontend/                 # Aplikasi Web React.js (Vite)
│   ├── src/
│   │   ├── components/       # UI Library (Neo-Brutalism)
│   │   │   ├── _design.jsx           # Komponen dasar desain sistem (Button, Card)
│   │   │   ├── SeekerDashboard.jsx   # Dasbor utama pencari kerja
│   │   │   ├── SeekerMatchResults.jsx# UI visualisasi skor kecocokan vektor
│   │   │   ├── SeekerSearch.jsx      # Dual-Track Manual Search
│   │   │   ├── SkillGapPanel.jsx     # Panel rekomendasi kursus Ed-Tech
│   │   │   ├── FloatingAdvisor.jsx   # Antarmuka chat interaktif dengan Swarm
│   │   │   ├── EmployerDashboard.jsx # Analitik kolam kandidat untuk HRD
│   │   │   ├── EmployerCandidates.jsx# AI Shortlist & tombol "Unlock Kontak"
│   │   │   ├── EmployerPostJob.jsx   # Form pembuatan lowongan instan
│   │   │   ├── CVUploader.jsx        # Komponen unggah PDF kandidat
│   │   │   ├── AuthModal.jsx         # Popup Login/Register terintegrasi
│   │   │   ├── PublicHeader.jsx      # Navigasi utama
│   │   │   └── LandingHero.jsx       # Halaman pendaratan publik
│   │   ├── services/
│   │   │   └── api.js        # Wrapper fetch API dengan auto-logout 401
│   │   ├── store/
│   │   │   └── useStore.js   # State Management global (Zustand)
│   │   └── App.jsx
│   └── package.json
│
├── database/                 # Basis Data
│   └── init.sql              # Dump awal PostgreSQL (pgvector)
│
├── docs/                     # Dokumentasi Resmi & Presentasi
│   ├── PROPOSAL_FINAL.md     # Proposal Bisnis Lengkap
│   ├── VERIFICATION_DEMO.md  # Skenario Demo Produk & Panduan Presentasi
│   ├── BUSINESS_MODEL.md     # Dokumen Detail Keuangan & Arus Kas
│   ├── ROADMAP_TECH_STACK.md # Roadmap Infrastruktur Skala Korporasi
│   └── API_SPEC.md           # Spesifikasi API OpenAPI/Swagger

---

## 📚 Dokumen Referensi

Semua panduan demonstrasi, proposal korporat, dokumen finansial, dan pemetaan arsitektur masa depan kini dipisahkan ke dalam struktur dokumentasi formal (folder `docs/`) untuk memudahkan peninjauan komprehensif oleh dewan juri dan investor.

| Dokumen | Deskripsi | Tautan |
|---|---|---|
| **Business Proposal** | Penjelasan problem, solusi, validasi ekosistem pasar, dan strategi produk terpadu KerjaCerdas. | [PROPOSAL_FINAL.md](docs/PROPOSAL_FINAL.md) |
| **Panduan Live Demo** | Skrip presentasi rinci (*step-by-step*) simulasi alur pencari kerja dan pewawancara untuk demonstrasi. | [VERIFICATION_DEMO.md](docs/VERIFICATION_DEMO.md) |
| **Laporan Finansial & Bisnis** | Model keuntungan (Profit Model), proyeksi arus kas, *Unit Economics*, dan *Pro Forma Income Statement*. | [BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md) |
| **Roadmap Arsitektur** | Transformasi infrastruktur *Cloud SQL, PostgreSQL pgvector, Vertex AI*, dan arsitektur data pasca-MVP. | [ROADMAP_TECH_STACK.md](docs/ROADMAP_TECH_STACK.md) |

---
<div align="center">

**KerjaCerdas © 2026** — *Enterprise Talent AI Infrastructure*

<br>

[![Docs](https://img.shields.io/badge/Documentation-docs%2F-009688?style=flat-square)](#) [![API](https://img.shields.io/badge/API_Reference-Swagger-009688?style=flat-square)](http://localhost:8000/docs) 

</div>
