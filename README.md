<div align="center">

<pre>
╭────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│  ██╗  ██╗███████╗██████╗      ██╗ █████╗  ██████╗███████╗██████╗ ██████╗  █████╗ ███████╗  │
│  ██║ ██╔╝██╔════╝██╔══██╗     ██║██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝  │
│  █████╔╝ █████╗  ██████╔╝     ██║███████║██║     █████╗  ██████╔╝██║  ██║███████║███████╗  │
│  ██╔═██╗ ██╔══╝  ██╔══██╗██   ██║██╔══██║██║     ██╔══╝  ██╔══██╗██║  ██║██╔══██║╚════██║  │
│  ██║  ██╗███████╗██║  ██║╚█████╔╝██║  ██║╚██████╗███████╗██║  ██║██████╔╝██║  ██║███████║  │
│  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝  │
│                                                                                            │
│                              Enterprise Talent AI Infrastructure                           │
│                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────╯
</pre>
**Autonomous Recruitment Platform powered by Semantic Matching & Multi-Agent Swarm**

[![Backend: FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Frontend: React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![AI: Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Agents: LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Database: PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Cloud: Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Deploy: Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

*An enterprise-grade talent matching infrastructure utilizing high-dimensional vector search and ReAct-based autonomous agents to streamline recruitment pipelines.*

<br>
 
</div>

---

## 📌 Platform Overview

**KerjaCerdas** memecahkan masalah ketimpangan ganda (*Triple Mismatch*) di pasar tenaga kerja melalui pendekatan AI semantik. Untuk melihat detail latar belakang masalah dan perbedaan dengan portal konvensional, silakan baca [Business Proposal](docs/PROPOSAL.md).

## 🎯 Fitur Utama

- **AI Job Matching**: Pencocokan otomatis menggunakan AI dengan infrastruktur vector search.
- **Proactive Skill Gap Analyzer**: Analisis kelemahan skill dan rekomendasi *upskilling* spesifik.
- **Employer Dashboard & Kanban Pipeline**: *Shortlisting* kandidat instan, manajemen *pipeline* ala Kanban, dengan model monetisasi mikro (*Pay-to-Unlock*).
- **A/B Testing & Event Tracking**: Analitik *closed-loop* mandiri untuk optimalisasi konversi dan pengalaman pengguna (Onboarding Wizard).

Detail lengkap mengenai fitur produk dapat dilihat di [Product Features](docs/PRODUCT_FEATURES.md).

## 🚀 Pembaruan MVP v1.0.0 (Latest Release)
Sistem telah berevolusi menjadi arsitektur yang tangguh dan siap pakai untuk uji beta publik, dengan peningkatan berikut:
- **Performa Backend**: Pemrosesan asinkron untuk ekstraksi CV (<200ms latency), TTL Caching pada korpus pencarian, dan index HNSW pgvector.
- **Agentic AI & Keamanan**: *Token Efficiency Gate* (mencegah *cost overrun* LLM jika *vector match* terlalu rendah), *Hallucination Guards*, serta filter kata teknis untuk UI yang lebih humanis.
- **UX & Frontend**: Alur Onboarding Wizard yang ramah, *Empty States* cerdas dengan rekomendasi, *Mobile-First CSS*, dukungan pengeditan profil pasca-unggah PDF, dan sistem Notifikasi Global (Toast) untuk *Error/Auth Session*.
- **DevOps & CI/CD**: Workflow terotomasi dengan 4 fase pengecekan (Linting, Unit Test, Integrasi Database, Latency Benchmark), serta *Docker Compose* produksi yang dioptimasi.

## 🧩 Component Architecture & Business Value

Setiap komponen dalam aplikasi ini dirancang tidak hanya untuk fungsi teknis, melainkan untuk memberikan nilai bisnis dan *user experience* terbaik.

### 💼 Frontend Components (React 18 & React Router & Zustand)
| Komponen UI | Fungsi Teknikal | Dampak Bisnis & UX |
|---|---|---|
| **`LandingHero` & `PublicHeader`** | Entry point SPA dengan animasi responsif dan direct route navigation. | Mengkonversi pengunjung (Lead Gen) melalui CVR yang dioptimasi dan copy persuasif. |
| **`CVUploader`** | Menghandle PDF parsing multipart form data + auto-navigate ke match. | Menghilangkan friksi data entry manual. AI Gemini mengekstrak data JSON dalam detik. |
| **`SeekerDashboard`** | Mengorkestrasi data profil (trust score, matches) dari `useStore`. | Memberikan umpan balik instan ke kandidat, membangun retensi Active Users. |
| **`SeekerMatchResults`** | Render array `matches` dari vector search + HNSW distance. | Menyajikan hasil pencocokan berbasis band (Strong, Possible, Stretch). |
| **`JobDetailModal`** | Modal detail lowongan dengan **Explainable AI Score Breakdown**. | Transparansi 5 komponen skor pencocokan (Semantik, Skill, Lokasi, Gaji, Pengalaman) untuk trust kandidat. |
| **`ApplicationsPage`** | Visual milestone pipeline status lamaran interaktif. | Menghilangkan ketidakpastian kandidat dengan pelacakan tahapan lamaran real-time. |
| **`SkillGapPanel`** | Membandingkan array `skills` pengguna dengan top lowongan (Set Difference). | Agregasi Ed-Tech: menghubungkan pengguna ke kursus/bootcamp partner (potensi komisi referal). |
| **`FloatingAdvisor`** | Interface chatbot dengan streaming completion LangGraph. | Memberikan layanan career coaching 24/7 berskala massal dengan Zero Marginal Cost. |
| **`EmployerDashboard`** | Dasbor analitik (KPIs) pelamar real-time per lowongan dengan context passing. | Meminimalisasi beban kognitif HRD dengan funnel view pelamar yang jelas. |
| **`EmployerPostJob`** | Wizard pasang lowongan berjenjang (1: Profil $\rightarrow$ 2: NPWP $\rightarrow$ 3: Lowongan). | Memandu HRD melalui onboarding terstruktur sebelum mempublikasikan lowongan. |
| **`JobPackUploader`** | Drag-and-drop uploader untuk file PDF berisi kumpulan lowongan massal. | Mereduksi waktu input lowongan dari jam menjadi detik dengan AI auto-parsing. |
| **`EmployerProfile`** | Formulir informasi legalitas dan identitas institusi perusahaan. | Membangun kredibilitas perusahaan sebelum proses verifikasi NPWP. |
| **`EmployerCandidates`** | Menampilkan hasil sortir (*Shortlist*) `ResumeReviewAgent`. | Mendorong monetisasi *Pay-to-Unlock* (Rp 50.000/kontak) dengan Teaser Method. |
| **`PricingPage`** | Konfigurasi limit tiering, paywall, dan ATS enterprise coming soon. | Transparansi harga B2B/B2C dengan strategi freemium untuk akuisisi awal agresif. |
| **`VerificationDashboard`** | Integrasi E-KYC KTP Dukcapil, Ijazah SIVIL, NPWP DJP, dan Phone OTP. | Solusi krisis Trust dengan verifikasi dokumen terenkripsi AES-256-GCM. |

---

## 📸 UI / UX Prototype Flow & Screenshots (Live Interface)

Platform **KerjaCerdas** mengadopsi arsitektur desain **Modern Neobrutalism** yang bersih, profesional, berani (*high-contrast*), dan mudah dinavigasi tanpa *visual clutter*. Di bawah ini adalah peta alur lengkap (*user flow*) interaktif untuk **Pencari Kerja (Job Seeker)** dan **Perusahaan / Rekruter (Employer / HR)** beserta tangkapan layar antarmuka langsung (*live screenshots*).

---

### 🌐 1. Landing & Public Onboarding Flow

```mermaid
flowchart LR
    classDef public fill:#FF4800,stroke:#090A0F,stroke-width:2.5px,color:#fff,font-weight:bold
    classDef modal fill:#C8F26B,stroke:#090A0F,stroke-width:2.5px,color:#090A0F,font-weight:bold
    classDef portal fill:#00D2D3,stroke:#090A0F,stroke-width:2.5px,color:#090A0F,font-weight:bold

    A["🏠 Landing Hero\n(Interactive Match Preview)"]:::public --> B["✨ Fitur Utama &\nArsitektur Nilai"]:::public
    A --> C["💳 Skema Harga &\nTiering Transparan"]:::public
    A -->|Tombol Masuk / Coba Gratis| D["🔐 Dual-Role Auth Modal"]:::modal
    D -->|Kategori: Pencari Kerja| E["👨‍💼 Portal Pencari Kerja\n(Seeker Dashboard)"]:::portal
    D -->|Kategori: Employer / HR| F["🏢 Portal Perusahaan\n(Employer Hub)"]:::portal
```

| 1. Landing Hero (Neobrutalism) | 2. Keunggulan Platform | 3. Skema Harga Transparan |
|:---:|:---:|:---:|
| <img src="docs/assets/01_landing_hero.png" width="380" alt="Landing Hero"> | <img src="docs/assets/02_landing_features.png" width="380" alt="Features"> | <img src="docs/assets/03_pricing_plans.png" width="380" alt="Pricing"> |

| 4. Modal Autentikasi (Masuk Akun) | 5. Modal Pendaftaran (Daftar Akun) |
|:---:|:---:|
| <img src="docs/assets/04_auth_modal_login.png" width="450" alt="Login Modal"> | <img src="docs/assets/05_auth_modal_register.png" width="450" alt="Register Modal"> |

---

### 👨‍💼 2. Alur Pencari Kerja (Seeker Flow)

```mermaid
flowchart TD
    classDef page fill:#FAF9F5,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold
    classDef ai fill:#FF4800,stroke:#090A0F,stroke-width:2px,color:#fff,font-weight:bold
    classDef modal fill:#C8F26B,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold
    classDef action fill:#00D2D3,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold

    A["📊 Dasbor Pencari Kerja\n(Metrik & Top 3 Match)"]:::page --> B["📄 Unggah CV PDF / Edit"]:::page
    B -->|AI Gemini 3.1 Parser| C["🎯 Hasil Pencocokan AI\n(Semantic & Skill Match)"]:::ai
    
    C -->|Buka Detail| D["🔍 Modal Detail Lowongan\nExplainable AI 5-Dimensi"]:::modal
    D -->|Lamar Instan| E["📬 Pelacakan Status Lamaran\n(Milestone Timeline)"]:::action
    D -->|Simpan| F["⭐ Lowongan Tersimpan"]:::page
    
    A --> G["📈 Analisis Skill Gap\n(Rekomendasi Kursus Ed-Tech)"]:::page
    A --> H["🔎 Pencarian Cepat Multi-Filter"]:::page
    A --> I["🛡️ Verifikasi E-KYC &\nIjazah SIVIL Dikti"]:::action
    A --> J["💬 Konsultasi AI Career Advisor\n(Tanya Jawab & Rekomendasi Karir)"]:::ai
```

| 6. Dasbor Analitik Pencari Kerja | 7. Hasil Pencocokan AI (Top Matches) | 8. Explainable AI Score Modal |
|:---:|:---:|:---:|
| <img src="docs/assets/06_seeker_dashboard.png" width="380" alt="Seeker Dashboard"> | <img src="docs/assets/07_seeker_job_match.png" width="380" alt="Job Match Results"> | <img src="docs/assets/08_job_detail_modal.png" width="380" alt="Explainable AI Detail"> |

| 9. Analisis Skill Gap & Kursus | 10. Pencarian Cepat & Filter | 11. Lowongan Tersimpan |
|:---:|:---:|:---:|
| <img src="docs/assets/09_seeker_skill_gap.png" width="380" alt="Skill Gap Analysis"> | <img src="docs/assets/10_seeker_search.png" width="380" alt="Quick Search"> | <img src="docs/assets/11_seeker_saved_jobs.png" width="380" alt="Saved Jobs"> |

| 12. Pelacakan Lamaran Saya | 13. Verifikasi Identitas E-KYC | 14. Ekstraksi CV PDF Cerdas |
|:---:|:---:|:---:|
| <img src="docs/assets/12_seeker_applications.png" width="380" alt="Application Tracker"> | <img src="docs/assets/13_seeker_verification.png" width="380" alt="Verification Dashboard"> | <img src="docs/assets/14_seeker_cv_upload.png" width="380" alt="CV Extraction"> |

| 22. Konsultasi Interaktif AI Career Advisor (Tanya Jawab & Rekomendasi Karir) |
|:---:|
| <img src="docs/assets/22_ai_career_advisor.png" width="450" alt="AI Career Advisor Dialog"> |

---

### 🏢 3. Alur Perusahaan & Rekruter (Employer / HR Flow)

```mermaid
flowchart TD
    classDef page fill:#FAF9F5,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold
    classDef step fill:#FFCB05,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold
    classDef ai fill:#FF4800,stroke:#090A0F,stroke-width:2px,color:#fff,font-weight:bold
    classDef modal fill:#C8F26B,stroke:#090A0F,stroke-width:2px,color:#090A0F,font-weight:bold

    A["🏢 Dasbor Rekrutmen HR\n(KPI & Lowongan Aktif)"]:::page --> B["📋 Kelola Daftar Lowongan"]:::page
    
    subgraph Wizard_Pasang ["📝 Alur Pasang Lowongan Terstruktur"]
        C["1. Profil Lembaga"]:::step --> D["2. Validasi NPWP DJP"]:::step
        D --> E["3. Form Lowongan &\nEstimasi AI Pool"]:::ai
    end
    
    A --> C
    A -->|Impor Banyak Sekaligus| F["📦 Upload Bulk Job Pack (PDF)"]:::page
    
    B -->|Lihat Kandidat AI| G["👥 Evaluasi Top Kandidat\n(Confidence Bands: Strong/Possible/Stretch)"]:::ai
    G -->|Tinjau Profil Asli| H["📄 CV Viewer Terstruktur"]:::modal
    G -->|Buka Kontak Resmi| I["💳 Pay-to-Unlock Rp 50.000\n(Grounded Skill Summary)"]:::modal
    
    A --> J["🏛️ Verifikasi NPWP DJP"]:::page
    A --> K["🏢 Profil Entitas Bisnis"]:::page
```

| 15. Dasbor Perusahaan & HR Hub | 16. Manajemen Daftar Lowongan | 17. Wizard Pasang Lowongan (AI Estimator) |
|:---:|:---:|:---:|
| <img src="docs/assets/15_employer_dashboard.png" width="380" alt="Employer Dashboard"> | <img src="docs/assets/16_employer_jobs.png" width="380" alt="Employer Jobs"> | <img src="docs/assets/17_employer_post_job.png" width="380" alt="Post Job Wizard"> |

| 18. Bulk Job Pack PDF Uploader | 19. Evaluasi Top Kandidat AI | 20. Verifikasi NPWP Perusahaan |
|:---:|:---:|:---:|
| <img src="docs/assets/18_employer_job_pack_upload.png" width="380" alt="Job Pack Upload"> | <img src="docs/assets/19_employer_candidates.png" width="380" alt="Candidates Shortlist"> | <img src="docs/assets/20_employer_verification.png" width="380" alt="Tax Verification"> |

| 21. Profil Entitas & Legalitas Bisnis |
|:---:|
| <img src="docs/assets/21_employer_profile.png" width="420" alt="Employer Profile"> |

---

## 🚀 Quick Start (Panduan Eksekusi Lengkap)

### Persyaratan Sistem
- **Docker Desktop** terinstal dan berjalan pada sistem Anda.
- **Git** untuk mengklon repositori.
- **Kunci API Gemini (`GEMINI_API_KEY`)** dari Google AI Studio (Wajib untuk fitur *Resume Parsing* dan *Skill Gap Analyzer*).

### Langkah 1 — Kloning & Konfigurasi
```powershell
git clone https://github.com/LouSens/KerjaCerdas.git
cd KerjaCerdas
Copy-Item .env.example .env
```
Buka berkas `.env` yang baru saja dibuat, lalu isi dengan kredensial Anda:
```env
# Contoh konfigurasi .env
JWT_SECRET_KEY=rahasia-jwt-kerjacerdas-super-aman
GEMINI_API_KEY=AIzaSy... (Masukkan kunci Gemini Anda)
```

### Langkah 2 — Menjalankan Seluruh Ekosistem (Docker Compose)
Platform ini diorkestrasi sepenuhnya menggunakan Docker. Jalankan perintah berikut di terminal/PowerShell pada *root directory* proyek:
```powershell
docker compose up --build
```
> [!NOTE]
> Proses ini akan mengunduh *image* yang diperlukan, meng-kompilasi *frontend* React, membangun *backend* FastAPI, serta menjalankan PostgreSQL 16 lengkap dengan ekstensi `pgvector`. Basis data akan secara **otomatis terisi** dengan 21 lowongan pekerjaan asli Indonesia dan 20 kandidat (via skrip `init.sql`). Tunggu hingga terminal menampilkan log bahwa *backend* dan *frontend* telah siap (biasanya memakan waktu 1-3 menit).

### Langkah 3 — Akses Lingkungan Demo
Setelah semua kontainer berjalan (*healthy*), buka tautan berikut di *browser*:
- **Aplikasi Web (Frontend):** [http://localhost:3000](http://localhost:3000)
- **API Server (Backend):** [http://localhost:8000/health](http://localhost:8000/health)
- **Dokumentasi API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Langkah 4 — Uji Coba (Akun Demo)
Gunakan kredensial bawaan berikut untuk langsung mengeksplorasi fitur tanpa perlu mendaftar dari awal:

**A. Sebagai Pencari Kerja (Seeker):**
- **Email:** `budi.santoso@example.com`
- **Sandi:** `demo`
- *(Fokus Uji Coba: Unggah CV, AI Job Matching, Skill Gap Analyzer)*

**B. Sebagai HRD Perusahaan (Employer):**
- **Email:** `hr@goto.id` (GoTo Group) atau `hr@mandiri.id` (Bank Mandiri)
- **Sandi:** `demo`
- *(Fokus Uji Coba: Pembuatan Lowongan Instan, AI Candidate Shortlisting, Buka Akses Kontak)*

### Langkah 5 — Menghentikan & Membersihkan Sistem
Jika ingin menghentikan sistem, tekan `CTRL+C` pada terminal yang menjalankan *docker-compose*.
Untuk menghapus kontainer dan menghapus basis data (reset total), gunakan:
```powershell
docker compose down -v
```

### Langkah 6 — Deployment ke VPS (Produksi)
Proyek ini menggunakan **GitHub Actions** (`release.yml`) untuk membangun (build) dan mempublikasikan image Docker ke GitHub Container Registry (`ghcr.io`) secara otomatis saat Anda membuat Rilis (Release) dengan *git tag* (contoh: `v1.0.0`).

**Langkah-langkah di server VPS:**
1. Clone repositori ke server VPS Anda.
2. Buat file `.env` (lihat bagian `VPS Production Deployment` di `.env.example`).
3. Setel `IMAGE_TAG` ke versi rilis yang ingin digunakan (contoh: `v1.0.0`) atau `latest`.
4. Jalankan perintah berikut untuk mengunduh dan menyalakan kontainer:
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

> **Catatan Pengembangan di Masa Depan (Future Improvement):**  
> Proses ini dapat diotomatisasi 100% menggunakan aksi `appleboy/ssh-action` di dalam `release.yml`. Ketika kunci SSH VPS sudah tersedia, tambahkan *step* deployment otomatis sehingga server VPS langsung menarik (pull) image baru tanpa perlu intervensi manual (login SSH) setiap kali ada rilis versi baru.

---

## 🧠 Arsitektur Sistem Inti

Platform kami tidak mengandalkan *Prompt Wrapper* statis. Pusat logika diorkestrasi oleh arsitektur *Autonomous Multi-Agent Swarm* memanfaatkan framework **LangGraph** dan model **Gemini 3.1 Flash**.

```mermaid
flowchart TD
    %% Modern Startup Aesthetics
    classDef user fill:#1A1A1A,stroke:#646CFF,stroke-width:2px,color:#FFF,font-weight:bold
    classDef api fill:#2D3748,stroke:#38B2AC,stroke-width:2px,color:#FFF,font-weight:bold
    classDef supervisor fill:#4A5568,stroke:#F6E05E,stroke-width:3px,color:#FFF,font-weight:bold
    classDef worker fill:#2B6CB0,stroke:#63B3ED,stroke-width:2px,color:#FFF
    classDef state fill:#2C7A7B,stroke:#81E6D9,stroke-width:2px,color:#FFF,stroke-dasharray: 5 5
    classDef db fill:#276749,stroke:#68D391,stroke-width:2px,color:#FFF
    classDef llm fill:#702459,stroke:#D6BCFA,stroke-width:2px,color:#FFF,font-weight:bold

    User((👤 Seeker / Employer)):::user

    subgraph API_Layer ["API Gateway & Security Layer"]
        FastAPI["⚡ FastAPI / ASGI"]:::api
        Middleware["🛡️ Rate Limiter (Sliding Window)\n+ PII Redaction & Sanitizer"]:::api
        FastAPI --- Middleware
    end

    subgraph LangGraph_Swarm ["🧠 Multi-Agent Swarm (LangGraph)"]
        Supervisor{"👑 Supervisor Node\n(Routing & Synthesis)"}:::supervisor
        
        %% Agents
        SearchAgent["🔍 SearchJobs Agent"]:::worker
        ReviewAgent["📄 ResumeReview Agent"]:::worker
        GapAgent["🎯 SkillGap Agent"]:::worker
        AdvisorAgent["💬 CareerAdvisor Agent"]:::worker
        
        GraphState[("💬 Conversational\nMemory / State")]:::state

        Supervisor <--> SearchAgent
        Supervisor <--> ReviewAgent
        Supervisor <--> GapAgent
        Supervisor <--> AdvisorAgent
        
        Supervisor -.-> GraphState
        SearchAgent -.-> GraphState
        AdvisorAgent -.-> GraphState
    end

    subgraph Infrastructure ["Vector & LLM Engine"]
        Gemini{"✨ Google Gemini\n3.1 Flash (MRL 768-dim)"}:::llm
        PG[("🐘 PostgreSQL 16\n(pgvector HNSW ef=64)")]:::db
        Cache[("⚡ LRU / Redis\nQuery Embeddings Cache")]:::db
        
        Gemini ~~~ PG
        PG ~~~ Cache
    end

    %% Vertical Data Flow
    User -->|HTTP / SSE Stream| FastAPI
    FastAPI -->|Submit Task| Supervisor
    FastAPI <-->|Stream Response| GraphState

    %% Agents to Infrastructure
    SearchAgent -->|HNSW ANN Search| PG
    GapAgent -->|Read Skills & Courses| PG
    ReviewAgent -->|Multimodal Parsing| Gemini
    GapAgent -->|Reasoning & Roadmaps| Gemini
    Supervisor -->|Intent Classification| Gemini
    SearchAgent -->|Query Vectors| Cache
```

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

### 4. Skema Basis Data (Entity-Relationship)
Infrastruktur relasional kami direkayasa untuk menangani entitas dalam skala tinggi (High-Volume) sekaligus memfasilitasi pencarian jarak vektor komputasional menggunakan `pgvector`.

### 5. Data Acquisition & AI Feedback Loop
Sistem mengakuisisi data riwayat lowongan (*historical data*) melalui tiga jalur: **B2B Web Scraping (ETL)** terhadap lowongan lama, **Kemitraan Data B2G** dengan Kemnaker/BPS, serta yang paling krusial, **Internal Feedback Loop**. Platform mencatat aktivitas kandidat secara *closed-loop* (lolos wawancara, tingkat retensi). Data organik ini akan melatih-ulang (*fine-tuning*) rekomendasi agen AI agar relevansinya mengungguli pangkalan data rekrutmen manapun.

```mermaid
---
title: Core Relational Schema (PostgreSQL 16 + pgvector)
---
erDiagram
    USERS ||--o| SEEKERS : "has_profile"
    USERS ||--o| EMPLOYERS : "has_profile"
    USERS ||--o{ CHAT_SESSIONS : "owns_history"
    USERS ||--o{ EVENTS : "logs_analytics"
    USERS ||--o{ OTPS : "verifies_phone"
    EMPLOYERS ||--o{ JOBS : "posts"
    SEEKERS ||--o{ APPLICATIONS : "submits"
    JOBS ||--o{ APPLICATIONS : "receives"
    JOBS ||--o{ EVENTS : "tracked_on"
    SEEKERS ||--o{ SKILL_GAPS : "analyzed_for"

    USERS {
        UUID id PK
        VARCHAR email "Unique Index"
        VARCHAR password_hash
        VARCHAR role "Seeker / Employer"
        TIMESTAMP created_at
    }
    SEEKERS {
        UUID id PK
        UUID user_id FK
        VARCHAR full_name
        VARCHAR nik "SHA-256 (UU-PDP Compliant)"
        JSONB skills "Extracted via LLM"
        JSONB experience
        VECTOR_768 embedding "HNSW Indexed"
    }
    EMPLOYERS {
        UUID id PK
        UUID user_id FK
        VARCHAR company_name
        VARCHAR industry
        VARCHAR size
    }
    JOBS {
        UUID id PK
        UUID employer_id FK
        VARCHAR title
        JSONB required_skills
        INTEGER salary_max
        VECTOR_768 embedding "HNSW Indexed"
    }
    APPLICATIONS {
        UUID id PK
        UUID job_id FK
        UUID seeker_id FK
        VARCHAR status "Applied / Shortlisted"
        FLOAT match_score "Cosine Similarity"
    }
    SKILL_GAPS {
        UUID id PK
        UUID seeker_id FK
        UUID target_job_id FK
        JSONB missing_skills
        JSONB recommended_courses
        FLOAT match_percentage
    }
    EVENTS {
        UUID id PK
        UUID user_id FK
        UUID job_id FK
        VARCHAR event_type "A/B Testing & Funnel"
        JSONB payload
    }
    OTPS {
        UUID id PK
        UUID user_id FK
        VARCHAR phone
        VARCHAR code_hash "SHA-256"
        TIMESTAMP expires_at
        BOOLEAN verified
    }
```

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
│   │   │   │   ├── events.py      # Analytics event tracking
│   │   │   │   ├── experiments.py # A/B testing flag retrieval
│   │   │   │   ├── inquiries.py   # Endpoint kemitraan & enterprise
│   │   │   │   ├── jobs.py        # Pencarian dan paginasi lowongan
│   │   │   │   ├── seeker.py      # Profil, bookmark, history aplikasi
│   │   │   │   ├── uploads.py     # Endpoint Multi-modal PDF Parser (%PDF- validated)
│   │   │   │   └── verify.py      # E-KYC Dukcapil/SIVIL & DB-backed OTP
│   │   │   ├── schemas/           # Pydantic validation schemas
│   │   │   └── services/          # Business logic helpers
│   │   ├── agents/           # Arsitektur Multi-Agent & LLM
│   │   │   ├── graph/
│   │   │   │   ├── builder.py     # Konstruktor ReAct Supervisor Swarm
│   │   │   │   └── nodes.py       # Worker Nodes (Search, SkillGap, Advisor)
│   │   │   ├── tools/
│   │   │   │   └── superpowers.py # Kumpulan fungsi (tools) untuk Gemini
│   │   │   ├── memory/            # Checkpointer & conversational state
│   │   │   └── telemetry/         # Logger & tracing performa AI
│   │   ├── services/
│   │   │   └── matching/          # Core Recommendation Engine
│   │   │       ├── embeddings/    # Gemini Vector generator
│   │   │       └── matcher.py     # Algoritma Cosine Similarity + Heuristik
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
├── frontend/                 # Aplikasi Web React.js (Vite + React Router)
│   ├── src/
│   │   ├── components/       # UI Library (Neo-Brutalism)
│   │   │   ├── _design.jsx           # Komponen dasar desain sistem (Button, Card, Tag)
│   │   │   ├── SeekerDashboard.jsx   # Dasbor utama pencari kerja
│   │   │   ├── SeekerMatchResults.jsx# UI visualisasi skor kecocokan vektor
│   │   │   ├── SeekerSearch.jsx      # Dual-Track Manual Search
│   │   │   ├── SkillGapPanel.jsx     # Panel rekomendasi kursus Ed-Tech
│   │   │   ├── ApplicationsPage.jsx  # Pelacakan status lamaran milestone
│   │   │   ├── FloatingAdvisor.jsx   # Antarmuka chat interaktif dengan Swarm
│   │   │   ├── JobDetailModal.jsx    # Detail lowongan + Explainable AI Breakdown
│   │   │   ├── EmployerDashboard.jsx # Analitik kolam kandidat untuk HRD
│   │   │   ├── EmployerCandidates.jsx# AI Shortlist & tombol "Unlock Kontak"
│   │   │   ├── EmployerHelpPanel.jsx # Panel panduan rekrutmen untuk HRD
│   │   │   ├── EmployerPostJob.jsx   # Form pembuatan lowongan (Timeline Step)
│   │   │   ├── EmployerProfile.jsx   # Pengaturan data profil perusahaan
│   │   │   ├── JobPackUploader.jsx   # Bulk PDF job parser dengan drag-drop
│   │   │   ├── CVUploader.jsx        # Komponen unggah PDF kandidat
│   │   │   ├── VerificationDashboard.jsx # E-KYC KTP, Ijazah, NPWP, dan Phone OTP
│   │   │   ├── PricingPage.jsx       # Halaman harga B2B/B2C & ATS Enterprise
│   │   │   ├── AuthModal.jsx         # Popup Login/Register terintegrasi
│   │   │   ├── OnboardingWizard.jsx  # Alur onboarding pengguna baru
│   │   │   ├── PublicHeader.jsx      # Navigasi utama
│   │   │   ├── Footer.jsx            # Footer aplikasi
│   │   │   └── LandingHero.jsx       # Halaman pendaratan publik
│   │   ├── services/
│   │   │   └── api.js        # Wrapper fetch API dengan auto-logout 401 & auth header
│   │   ├── store/
│   │   │   └── useStore.js   # State Management global (Zustand) + Router Bridge
│   │   └── App.jsx           # Root layout & React Router routing table
│   └── package.json
│
├── database/                 # Basis Data
│   └── init.sql              # Dump awal PostgreSQL (pgvector)
│
├── docs/                     # Dokumentasi Resmi & Presentasi
│   ├── PROPOSAL.md           # Proposal Solusi Inovasi & Bisnis Lengkap
│   ├── PRODUCT_FEATURES.md   # Deskripsi Detail Fitur Utama Produk
│   ├── BUSINESS_MODEL.md     # Dokumen Detail Keuangan, Arus Kas & Anggaran Pre-Seed
│   ├── TECHNICAL_ROADMAP.md  # Roadmap Teknis, A/B Testing & Skalabilitas Cloud
│   ├── DEMO_GUIDE.md         # Panduan Live Demo & Daftar Akun Pengujian
│   ├── API_SPEC.md           # Spesifikasi API Lengkap (semua endpoint + schema)
│   ├── SEQUENCE_DIAGRAMS.md  # 7 Diagram Alur Mermaid (Auth, AI, E-KYC, dll.)
│   └── internals/            # Dokumentasi Teknis Internal Modul (00-09)
```

---

## 📚 Dokumen Referensi

Semua panduan demonstrasi, proposal korporat, dokumen finansial, dan pemetaan arsitektur masa depan kini dipisahkan ke dalam struktur dokumentasi formal (folder `docs/`) untuk memudahkan peninjauan komprehensif oleh dewan juri dan investor.

| Dokumen | Deskripsi | Tautan |
|---|---|---|
| **Proposal Solusi & Bisnis** | Proposal solusi inovasi lengkap — problem, validasi pengguna, arsitektur, pemetaan fitur, dan rencana eksekusi. | [PROPOSAL.md](docs/PROPOSAL.md) |
| **Fitur Produk** | Uraian mendalam kapabilitas AI, Explainable AI, Phone OTP, Job Pack Uploader, dan pelacakan lamaran. | [PRODUCT_FEATURES.md](docs/PRODUCT_FEATURES.md) |
| **Laporan Finansial & Bisnis** | Model keuntungan (Profit Model), budget awal pilot bulan 1 (Rp 3,85jt/bln), peta pemicu upgrade infrastruktur, dan proyeksi realistis 3 tahun. | [BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md) |
| **Peta Jalan Teknis & A/B Testing** | Arsitektur A/B testing, mitigasi dependensi vendor, integrasi mitra, dan roadmap skalabilitas cloud. | [TECHNICAL_ROADMAP.md](docs/TECHNICAL_ROADMAP.md) |
| **Panduan Live Demo & Akun** | Skrip presentasi rinci (*step-by-step*) beserta daftar seluruh akun uji coba (*pre-seeded credentials*). | [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) |
| **Spesifikasi API** | Kontrak lengkap semua endpoint FastAPI: skema request/response, rate limit, middleware, dan error codes. | [API_SPEC.md](docs/API_SPEC.md) |
| **Diagram Alur (Sequence)** | 7 diagram Mermaid yang mendokumentasikan alur kerja kritis: Auth, AI Agent, CV Upload, E-KYC, dan lainnya. | [SEQUENCE_DIAGRAMS.md](docs/SEQUENCE_DIAGRAMS.md) |

---
<div align="center">

**KerjaCerdas © 2026** — *Enterprise Talent AI Infrastructure*

<br>

[![Docs](https://img.shields.io/badge/Documentation-docs%2F-009688?style=flat-square)](#) [![API](https://img.shields.io/badge/API_Reference-Swagger-009688?style=flat-square)](http://localhost:8000/docs) 

</div>
