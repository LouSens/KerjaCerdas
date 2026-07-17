# PROPOSAL 3RD SUBMISSION — KERJACERDAS

> **Status:** Draft aktif — mencerminkan state sistem saat ini (MVP v0.4.0). Perbarui dokumen ini setiap ada perubahan fitur, keputusan produk, atau hasil pengujian baru. Bagian yang masih perlu dilengkapi ditandai `[TODO]`.

---

## Final Solution Title

**Platform Karir Berbasis AI: Mengatasi Ketimpangan Struktural Pasar Kerja melalui JobMatching, Skill Gap Analysis, dan Personalized Career Guidance**

---

## Final Team Composition (Maksimal 100 kata)

**David Kurniawan** (Ketua Tim) — Project Lead & AI Engineer. Bertanggung jawab atas arsitektur sistem Agentic AI, pengembangan semantic matching engine berbasis embedding, desain pipeline LangGraph, implementasi vector database (pgvector), serta keamanan dan reliabilitas sistem MVP end-to-end.

**Darren Cornelius Suwandi** — Product Manager, UI/UX Designer & Research Analyst. Mengarahkan visi produk, merancang pengalaman pengguna dan interface berbasis Zero Learning Curve, melakukan problem validation, serta menganalisis kebutuhan pengguna dan pasar tenaga kerja.

**Vanessa Serenina Prawirayasa** — System Analyst & Impact Strategist. Merancang arsitektur alur sistem backend-to-product, definisi KPI dan metrik dampak platform, serta memastikan keselarasan solusi dengan ekosistem ketenagakerjaan.

**Jason Clarence Setya Budhi** — Business & Market Strategist, Backend & Integration Engineer. Mengelola strategi monetisasi dan go-to-market, serta implementasi integrasi API, microservices orchestration, dan deployment cloud.

*Tidak ada perubahan komposisi tim sejak 2nd submission.*

---

## Final Solution Summary (Maksimal 150 kata)

KerjaCerdas adalah platform karier berbasis AI yang menjembatani ketimpangan struktural pasar kerja Indonesia dari dua sisi sekaligus: **pencari kerja (B2C)** yang kesulitan mengidentifikasi peluang relevan dan memahami posisi skill mereka, serta **perusahaan/HRD (B2B)** yang kewalahan menyaring volume lamaran tidak relevan.

Sistem bekerja dengan mengonversi CV dan lowongan menjadi representasi vektor semantik menggunakan Gemini Embeddings, lalu mencocokkannya melalui algoritma Hybrid Ranking (cosine similarity + skill overlap + lokasi + gaji). Autonomous Multi-Agent Swarm berbasis LangGraph kemudian menganalisis celah keahlian, merekomendasikan jalur upskilling, dan memberikan panduan karier personal. HRD melihat kandidat teratas dalam hitungan menit melalui model Direct Contact Unlock.

**Status saat ini:** MVP v0.4.0 fungsional penuh — dapat dijalankan via Docker dengan performa tinggi (<200ms API latency), mencakup infrastruktur CI/CD otomatis, A/B testing, Onboarding Wizard, Kanban Pipeline untuk Employer, dan caching berlapis. Target: pengurangan waktu screening hingga 90% dengan biaya akses mulai Rp 50.000.

---

## Progress and Change Log (Maksimal 150 kata)

Sejak 2nd submission, terdapat lima perubahan signifikan berdasarkan hasil pengujian internal dan review teknis:

1. **Middleware Security Layer** — Implementasi `RateLimiterMiddleware` (sliding window per IP: auth 10 req/60s, agent 20 req/60s) dan `RequestSizeMiddleware` (batas 10 MB). *Alasan: temuan kerentanan dari stress testing.*

2. **Input Sanitization & Prompt Injection Guard** — Modul `sanitization.py` dengan `sanitize_text()` aktif memblokir injeksi prompt dan karakter berbahaya sebelum mencapai model LLM. *Alasan: mitigasi risiko pada endpoint `/agent/invoke`.*

3. **Gamification Engine** — Sistem XP, level, streak, dan badge (`profile_complete`, `first_apply`) diaktifkan pada setiap aksi pengguna. *Alasan: meningkatkan retensi B2C.*

4. **Response Enrichment Pipeline** — Response API kini menyertakan metadata penuh (nama perusahaan, gaji, lokasi) dalam satu panggilan. *Alasan: mengurangi round-trip dari frontend.*

5. **Unit Testing** — `test_security.py` ditambahkan untuk validasi sanitasi dan keamanan token. *Alasan: quality gate sebelum demo.*

**Tambahan perubahan menuju MVP v0.4.0 (Tahap 3):**
6. **Agentic AI & Keamanan** — Implementasi *Token Efficiency Gate* dan *Hallucination Guard* untuk menghemat biaya API dan menghilangkan respons halusinasi, serta pembersihan jargon teknis (*Gemini, Vector*) pada antarmuka.
7. **Performa & Infrastruktur Backend** — Pemrosesan *asynchronous embedding* (menurunkan latensi dari ~3 detik ke <200ms), In-Memory Caching (TTL) untuk pencarian lowongan, dan optimasi *pgvector HNSW index* melalui Alembic migrations.
8. **Product & UX Frontend** — Alur *Onboarding Wizard* (Welcome ➔ Upload CV ➔ Match) terintegrasi A/B testing, dukungan revisi manual profil CV, sistem Notifikasi Global, serta *Mobile-First CSS Audit*.
9. **Analisis Data & CI/CD** — Fondasi *Event Tracking* (closed-loop data), framework *A/B Testing* tanpa status (*stateless feature flagging*), dan 4-tahap *GitHub Actions CI/CD* (Linting, Testing, Integrasi, Latency Benchmark).
10. **Business/Employer Side** — Fitur *Kanban Pipeline* untuk melacak status rekrutmen setiap kandidat.

> [TODO] Perbarui bagian ini setiap ada perubahan fitur, pivot, atau temuan dari pengujian pengguna.

---

## Validated User Problem and Evidence (Maksimal 250 kata)

**Pengguna Utama:**
- **B2C:** Lulusan baru dan mahasiswa tingkat akhir usia 18–25 tahun dari institusi vokasi (SMK, Politeknik) dan perguruan tinggi D4/S1, yang aktif mencari kerja secara digital namun belum memiliki peta skill yang jelas.
- **B2B:** HRD dari UMKM, startup teknologi, dan perusahaan menengah yang tidak memiliki anggaran untuk lisensi ATS enterprise (Workday, SAP) namun menghadapi volume lamaran yang tinggi dan tidak relevan.

**Kapan Masalah Terjadi:**
Di setiap siklus rekrutmen — saat HRD membuka lowongan dan menerima ratusan CV tidak sesuai, serta saat kandidat mengirim lamaran massal tanpa mengetahui skill gap mereka.

**Penyebab Utama:**
- *Structural Mismatch*: Oversupply pelamar umum vs undersupply talenta digital spesifik.
- *Relevance Mismatch*: ATS konvensional berbasis keyword gagal memahami kesetaraan semantik ("backend engineer" ≠ "software developer" di mata sistem lama).
- *Visibility Gap*: Pencari kerja tidak tahu skill apa yang perlu dikembangkan untuk kompetitif.

**Dampak:**
- HRD menyaring 80%+ lamaran di tahap awal secara manual, menyita waktu produktif berhari-hari.
- Kandidat menghabiskan jam per minggu menelaah JD secara manual tanpa feedback berarti.

**Bukti:**
- BPS 2026: 7,24 juta penganggur; mismatch kualifikasi 35,36% pada pekerja muda (BPS 2024).
- Wawancara internal dengan kandidat: kesulitan menemukan lowongan relevan dengan skill aktual.
- Kuesioner HR: >80% pelamar tersaring di tahap awal pada proses rekrutmen yang disurvei.
- Kutipan HR: *"Yang kita butuh itu bukan lebih banyak pelamar. Kita butuh lebih sedikit pelamar, tapi yang beneran cocok."*

> [TODO] Tambahkan hasil wawancara pengguna eksternal atau survei formal jika sudah tersedia.

---

## End-to-end Use Case and Feature-to-Pain Mapping (Maksimal 300 kata)

**Use Case: Fresh Graduate Menggunakan KerjaCerdas untuk Pertama Kali**

**Kondisi Awal:** Budi, lulusan Teknik Informatika, telah mengirim 50 lamaran via portal konvensional tanpa respons. Ia tidak tahu skill mana yang kurang dan menghabiskan berjam-jam setiap minggu menyesuaikan CV secara manual.

**Pemicu:** Budi mendaftar ke KerjaCerdas, mengisi onboarding survey singkat, dan mengunggah CV PDF.

**Alur Tindakan:**

1. **Upload CV** (`POST /api/v1/uploads/cv`) — PyMuPDF mengekstrak teks; Gemini API mengurai skill, pengalaman, pendidikan menjadi JSON terstruktur. PII (email, telepon) di-redact otomatis sebelum masuk ke LLM. *Pain: eliminasi pengisian manual.*

2. **Embedding Otomatis** — `SemanticMatcher.embed_seeker()` menghasilkan vektor 768-dimensi yang disimpan di pgvector dengan indeks HNSW. *Pain: sistem bekerja di balik layar tanpa beban pada pengguna.*

3. **AI Job Matching** (`POST /api/v1/agent/invoke`) — LangGraph Supervisor merutekan ke `SearchJobsAgent`. Hybrid Ranking: `score = cosine(0.5) + skill_overlap(0.3) + region(0.1) + salary(0.05) + experience(0.05)`. Budi mendapat 5 lowongan teratas dengan skor eksplisit dan breakdown alasan. *Pain: relevance mismatch — sistem memahami "React Developer" ≈ "Frontend Engineer".*

4. **Skill Gap Analysis** — `SkillGapAgent` membandingkan skill Budi dengan `required_skills` lowongan rank #1. Output: skill yang dimiliki, yang kurang, dan rekomendasi kursus gratis/berbayar per skill. *Pain: visibility gap — kandidat kini punya peta jalan konkret.*

5. **Verifikasi Identitas** — Budi verifikasi KTP via `VerificationDashboard`. Profil mendapat lencana terverifikasi yang terlihat oleh semua HRD. *Pain: trust mismatch — HRD lebih percaya kandidat berverifikasi.*

6. **Lamar & Gamifikasi** — Budi melamar; sistem memberikan badge `first_apply` dan 50 XP, mendorong engagement berkelanjutan.

**Peta Fitur → Pain Point:**

| Fitur | Pain Point Diselesaikan |
|---|---|
| CV Upload + Gemini Parse | Friksi pengisian manual, waktu terbuang |
| Hybrid Semantic Ranking | Relevance mismatch (keyword kaku) |
| Skill Gap Agent | Visibility gap — kebutaan kompetensi |
| Dual-Track Search UI | Kebebasan pilih AI autopilot atau eksplorasi manual |
| E-KYC Verification (mock) | Trust mismatch — CV tidak terverifikasi |
| Gamification (XP, Badge) | Retensi dan engagement rendah |
| Direct Contact Unlock (B2B) | Beban administrasi HRD, screening fatigue |

---

## Operational Context, Solution Boundary, and Adoption (Maksimal 200 kata)

**Lingkungan Penggunaan:**
Aplikasi web (React 18 + FastAPI), diakses via browser. Infrastruktur berjalan via Docker Compose (Frontend: 3000, Backend: 8000, PostgreSQL+pgvector). Target deployment produksi: Google Cloud Run + Cloud SQL.

**Pihak yang Terlibat:**
- **Pencari Kerja:** Upload CV, lihat match, analisis gap, bookmark, lamar.
- **HRD/Employer:** Buat lowongan (auto-embed), lihat AI shortlist (teaser), unlock kontak.
- **Mitra EdTech (Rencana):** Dicoding, Coursera — rekomendasi kursus dari skill gap output.

**Yang Dapat Dilakukan (saat ini):**
Semantic matching real-time, skill gap analysis, gamifikasi, verifikasi identitas (mock), streaming AI response via SSE, bookmark & riwayat lamaran, rate limiting & sanitasi input.

**Yang Belum Dapat Dilakukan:**
Payment gateway nyata (Midtrans/Xendit), E-KYC dengan API pemerintah asli (Dukcapil/SIVIL), fine-tuning dari feedback loop nyata, integrasi ATS enterprise, onboarding survey berbasis conditional logic (masih manual form), Hiring Phase Tracker aktif.

**Hambatan Adopsi & Mitigasi:**
- *UMKM literasi digital rendah* → Prinsip Zero Learning Curve: formulir lowongan sederhana, hasil AI diringkas, Direct Contact Unlock via email/telepon familiar.
- *Ketergantungan API Gemini* → Graceful degradation: fallback ke anonymous seeker jika embedding gagal.
- *Kepercayaan terhadap AI* → Setiap skor disertai `explanation` natural language dan breakdown komponen.

---

## Innovation Level (Maksimal 50 kata)

**Level: Functional Prototype — Advanced MVP (v0.3.0)**

Bukti: Platform berjalan end-to-end via Docker; 7 router API aktif; Hybrid Ranking Algorithm tervalidasi dengan 5 komponen skor; Multi-Agent Swarm (LangGraph + 4 tools) berfungsi; middleware keamanan berlapis aktif; 21 lowongan + 20 kandidat Indonesia sebagai demo data real.

---

## Current Technical Reality, Data, and Integration (Maksimal 300 kata)

**1. Sudah Berfungsi:**
- **Authentication:** JWT-based login/register dengan SQLAlchemy + bcrypt password hashing.
- **CV Parsing Pipeline:** Upload PDF → PyMuPDF extraction → Gemini structured JSON → PII redaction → auto-embed ke pgvector (HNSW index).
- **Hybrid Semantic Matching:** Cosine similarity (pgvector) + 4 heuristik booster: region, salary_fit, skill_overlap, experience_fit. Formula: `score = cosine(0.5) + skill_overlap(0.3) + region(0.1) + salary(0.05) + experience(0.05)`.
- **Multi-Agent Swarm:** LangGraph Supervisor + 4 tools: `search_jobs_tool`, `analyze_skill_gap_tool`, `interview_prep_tool`, `resume_review_tool`. Intent classification otomatis → routing ke agent yang tepat.
- **Employer Flow:** Post job (auto-embed via Gemini), lihat AI-ranked candidates, teaser method (kontak tersensor), endpoint unlock.
- **Gamification:** XP, level (XP÷250), streak, badge (`profile_complete` +100 XP, `first_apply` +50 XP).
- **Middleware Stack:** Rate limiter sliding window per IP, payload size guard 10 MB, prompt injection blocker, security headers (CSP, X-Frame-Options, Referrer-Policy), request logging dengan UUID.
- **Bookmarks & Applications:** Simpan lowongan, lamar (idempotent), lihat riwayat.
- **Response Enrichment:** Satu API call mengembalikan `EnrichedMatch[]` lengkap dengan nama perusahaan, gaji, lokasi, skill breakdown.

**2. Masih Berupa Simulasi/Mock:**
- E-KYC (Dukcapil, SIVIL Kemdikbud, DJP Online) — respons valid namun tidak terhubung ke API pemerintah asli.
- Payment Gateway — logika unlock tersedia, proses pembayaran nyata belum aktif.

**3. Sedang Dikembangkan:**
- Playwright E2E test suite (`frontend/playwright.config.js` + `src/tests/` tersedia, belum lengkap).
- Sequence diagrams 7 alur kritis (`SEQUENCE_DIAGRAMS.md`).

**4. Masih Direncanakan:**
- Onboarding survey berbasis conditional logic (saat ini masih form biasa).
- Blended Skill Trend Signal (70% job posting frequency + 30% Google Trends via PyTrends).
- Web scraper ETL untuk data lowongan historis.
- Fine-tuning model dari internal feedback loop (closed-loop analytics).
- Integrasi ATS enterprise (API-first Headhunter Copilot).
- Hiring Phase Tracker, Historical Application Dashboard, Notification System.

**Data:** 21 lowongan asli Indonesia + 20 profil kandidat di `database/init.sql`, diisi otomatis saat Docker startup.

**Keamanan:** PII di-redact sebelum masuk ke LLM. Dokumen dienkripsi AES-256-GCM. Kepatuhan UU PDP No.27/2022.

---

## MVP Execution and Deployment Plan (Maksimal 250 kata)

**Scope MVP saat ini:** Seeker flow (upload CV → AI match → skill gap → lamar), Employer flow (post job → AI shortlist → teaser → unlock), keamanan API dasar, verifikasi identitas mock, gamifikasi.

**Fitur Belum di MVP:** Payment gateway nyata, E-KYC asli, onboarding conditional logic, Blended Skill Trend Signal, web scraper ETL, Hiring Phase Tracker.

**Milestone Pasca-Hackathon:**

| Milestone | Target | Output | PIC |
|---|---|---|---|
| M1: Playwright E2E Testing | Agustus 2026 | Test suite lengkap | Darren |
| M2: Payment Gateway (Midtrans/Xendit) | September 2026 | Pay-to-Unlock aktif | Jason + David |
| M3: Onboarding Survey Conditional Logic | September 2026 | Personalized feed tanpa CV | Vanessa |
| M4: E-KYC API Asli (Dukcapil) | Oktober 2026 | Verifikasi KTP nyata | David |
| M5: Pilot B2B (5 UMKM) | November 2026 | Data feedback loop nyata | Vanessa + Jason |
| M6: Blended Skill Trend Signal | Desember 2026 | PyTrends + job posting signal | Darren + David |
| M7: Web Scraper ETL + Closed-Loop | Januari 2027 | 10.000+ data historis | Darren + David |

**Infrastruktur:** Docker Compose (dev) → Google Cloud Run + Cloud SQL + pgvector (produksi) → Kubernetes auto-scaling (skala enterprise).

**Risiko & Mitigasi:**
- *Biaya API Gemini* → Dynamic routing hemat 40% token; skip LLM untuk mismatch total.
- *Ketergantungan API pemerintah* → Mock E-KYC sebagai fallback permanen.
- *Skalabilitas pgvector* → HNSW dioptimasi; rencana Vertex AI Matching Engine >1 juta vektor.
- *Adopsi UMKM* → Zero Learning Curve; Freemium Hook (5 token gratis di awal).

---

## Problem and System Complexity (Maksimal 200 kata)

Kompleksitas KerjaCerdas bukan dari banyaknya fitur, melainkan dari **interaksi multi-variabel dan multi-aktor yang saling bergantung**:

**1. Kompleksitas Data Semantik:** Setiap profil kandidat adalah vektor 768-dimensi yang berinteraksi secara non-linear dengan seluruh vektor lowongan aktif. Penambahan satu skill mengubah ranking keseluruhan. Variasi terminologi industri (sinonim jabatan, campuran Bahasa Indonesia–Inggris, akronim) memperumit representasi semantik yang harus ditangkap sistem.

**2. Kompleksitas Multi-Aktor dengan Kepentingan Berlawanan:** Kandidat menginginkan visibilitas maksimal; employer menginginkan privasi kandidat terjaga (teaser method). Kedua kepentingan harus diseimbangkan dalam logika bisnis yang berjalan di layer middleware.

**3. Kompleksitas Keputusan AI Berbahasa Indonesia:** Supervisor LangGraph harus mengklasifikasikan intent dari bahasa natural Indonesia yang ambigu, campuran Indonesia-Inggris, dan variasi informal, lalu merutekan ke agent yang tepat tanpa instruksi eksplisit pengguna.

**4. Mengapa Pendekatan Sederhana Tidak Cukup:**
- Keyword matching ATS konvensional tidak memahami bahwa "Node.js developer" ≡ "JavaScript backend engineer" secara semantik.
- Screening manual tidak skalabel untuk ratusan pelamar.
- Rekomendasi kursus generik tidak menyelesaikan gap spesifik per individu.

Ketiganya sudah terbukti gagal di portal konvensional yang ada di pasar Indonesia saat ini.

---

## Processing Pipeline and Engineering Depth (Maksimal 250 kata)

**Alur Input → Output (CV Parsing + Matching):**

```
Input: PDF CV
  ↓
[1] PyMuPDF — Ekstraksi teks mentah
  ↓
[2] Gemini API — Structured JSON extraction
    → {full_name, headline, skills[], experience[], education}
  ↓
[3] Redaction Middleware — PII masking (email, phone via Regex)
  ↓
[4] Gemini Embeddings (text-embedding-004) → Vector[768]
  ↓
[5] pgvector HNSW — upsert seeker embedding
  ↓
[6] Hybrid Ranking Engine
    score = cosine(0.5) + skill_overlap(0.3) + region(0.1)
           + salary_fit(0.05) + experience_fit(0.05)
  ↓
[7] LangGraph Supervisor
    Intent classification → SearchAgent | SkillGapAgent | AdvisorAgent
  ↓
[8] Agent Execution (parallel jika diperlukan):
    - search_jobs_tool: keyword + vector search di pgvector
    - analyze_skill_gap_tool: set difference (required − seeker skills)
                              + rekomendasi sumber belajar per skill
    - interview_prep_tool: generate pertanyaan kontekstual per posisi
    - resume_review_tool: ATS-style critique
  ↓
[9] Response Enrichment
    MatchResult → EnrichedMatch (+ title, company, salary, skill breakdown)
  ↓
Output: EnrichedMatch[] + final_response (Bahasa Indonesia)
        + recommended_courses[] + missing_skills[]
```

**Aspek Rekayasa:**
- **Modularitas:** 7 router + 4 agent tools + layered middleware — pengembangan paralel tanpa konflik.
- **Skalabilitas:** pgvector HNSW mendukung jutaan vektor. FastAPI + asyncpg mencegah blocking I/O. Stateless API memungkinkan horizontal scaling.
- **Reliability:** Graceful degradation cascade — seeker tidak ditemukan fallback ke anonymous seeker, tidak pernah error 400.
- **Keamanan:** Rate limiter + sanitasi sebelum LLM + security headers pada setiap response.

---

## Algorithm or Rule Quality and Decision Transparency (Maksimal 300 kata)

**Logika Inti: Hybrid Ranking Algorithm**

```python
final_score = (
    cosine_similarity * 0.50 +
    # Kedekatan semantik antara embedding CV dan embedding JD (pgvector)
    skill_overlap     * 0.30 +
    # |seeker_skills ∩ required_skills| / |required_skills|
    region_boost      * 0.10 +
    # 1.0 jika region_code cocok; 0.5 jika remote_allowed; else 0.0
    salary_fit        * 0.05 +
    # 1.0 jika ekspektasi gaji dalam range lowongan; else 0.0
    experience_fit    * 0.05
    # 1.0 jika tahun pengalaman ≥ minimum required; else 0.0
)
```

**Input:** Vektor embedding kandidat (768-dim) + vektor embedding lowongan + metadata (skills[], region_code, salary_min/max, experience_years_min).
**Output:** Skor 0–1 per pasangan, diranking descending. Top-5 dikembalikan ke frontend.

**Kondisi Pengecualian & Efisiensi Token:**
Jika `cosine_similarity < threshold` (kandidat dan lowongan tidak memiliki overlap semantik bermakna), Supervisor Agent merutekan langsung ke `analyze_skill_gap_tool` dan melewati `interview_prep_tool`. Ini menghemat konsumsi token LLM hingga 40% per session pada kasus mismatch tinggi.

**Mengapa Metode Ini Dipilih:**
Cosine similarity murni dapat merekomendasikan kandidat dengan latar belakang mirip tapi berlokasi berbeda atau bergaji tidak sesuai. Bobot heuristik menambahkan "logika HRD dunia nyata" yang tidak bisa ditangkap oleh embedding saja.

**Alternatif yang Dipertimbangkan:**
- *BM25 keyword scoring* — ditolak; tidak menangkap sinonim dan konteks industri.
- *LLM-as-judge ranking* — biaya terlalu tinggi untuk evaluasi ratusan kandidat secara masif; digunakan hanya untuk sintesis respons akhir.
- *IndoBERT + BGE-M3* (digunakan di tahap awal) — kebutuhan komputasi lebih tinggi, digantikan Gemini Embeddings yang lebih efisien dan akurat.

**Keterbatasan Saat Ini:**
- Bobot heuristik bersifat statis (belum dipersonalisasi per employer).
- Skill overlap menggunakan string matching — "JS" dan "JavaScript" bisa tidak cocok jika tidak dinormalisasi.

**Transparansi bagi Pengguna:**
Setiap `EnrichedMatch` menyertakan: `score`, `cosine`, `skill_overlap`, `matching_skills[]`, `missing_skills[]`, dan `explanation` (natural language). Pengguna dan HRD dapat melihat *mengapa* kecocokan terjadi. HRD dapat mengoreksi secara real-time melalui filter UI (region, salary_min) yang memodifikasi parameter `filters` di request API.

---

## User Flow, Usability Testing, and Product Iteration (Maksimal 250 kata)

**Alur Pengguna — Seeker:**
1. Landing Page → klik "Masuk" → Auth Modal (login/register)
2. Seeker Dashboard → profil + skor + 5 match teratas
3. Upload CV → AI parse otomatis → profil & embedding terupdate
4. "Lihat Semua" → Match Results → klik lowongan → Job Detail Modal
5. "Analisis Skill Gap" → Skill Gap Panel → rekomendasi kursus per skill
6. "Lamar" → konfirmasi sukses + badge + XP reward

**Alur Pengguna — Employer:**
1. HR Login → Employer Dashboard (metrik pelamar aktif)
2. "Pasang Lowongan" → Post Job Wizard → AI embed otomatis
3. Live Candidates Pool → Top-5 AI Shortlist (kontak disensor — teaser method)
4. "Buka Kontak" → Direct Contact Unlock (Pay-to-Unlock flow)

**Pengujian yang Sudah Dilakukan:**
Tim internal (4 anggota) melakukan walkthrough end-to-end menggunakan akun demo (`budi.santoso@example.com`, `hr@goto.id`). Playwright test config (`frontend/playwright.config.js`) dan direktori test (`src/tests/`) sudah disiapkan, pengujian otomatis sedang dikembangkan.

**Temuan & Iterasi:**
- *Cold start LangGraph lambat* → Lazy import `get_graph()` dalam endpoint, bukan saat startup.
- *Employer ID tampil sebagai UUID* → Enrichment loop `employer_cache` me-resolve nama perusahaan dari repository.
- *Stale seeker token error 400* → Graceful cascade: fallback ke anonymous seeker agar agent selalu menghasilkan rekomendasi.
- *Profil CV tidak ter-update setelah upload ulang* → `embed_seeker()` dipanggil ulang otomatis setiap `POST /seeker/profile`.

**Pencegahan Kesalahan:**
Rate limiter mencegah spam. Sanitasi input memblokir injeksi. Validasi Pydantic mencegah data malformed masuk ke database.

> [TODO] Perbarui setelah sesi usability testing dengan pengguna eksternal pertama.

---

## Team Capability and Execution Ownership (Maksimal 250 kata)

**David Kurniawan — Project Lead & AI Engineer**
- **Tanggung Jawab:** Arsitektur backend FastAPI, LangGraph Multi-Agent Swarm, Gemini API integration, pgvector HNSW indexing, middleware security layer, sistem keamanan end-to-end.
- **Hasil Nyata:** 7 router API, supervisor agent dengan 4 tools, hybrid ranking algorithm, rate limiter + sanitization middleware, graceful degradation cascade, response enrichment pipeline.
- **Kompetensi:** Python async (FastAPI/asyncpg), LangChain/LangGraph, vector databases, API security.

**Darren Cornelius Suwandi — Product Manager, UI/UX Designer & Research Analyst**
- **Tanggung Jawab:** Visi produk, user journey design, Zero Learning Curve interface, problem validation, product-market fit analysis.
- **Hasil Nyata:** Validasi masalah melalui wawancara kandidat + kuesioner HR, desain alur pengguna Seeker & Employer, `SEQUENCE_DIAGRAMS.md` (7 alur Mermaid), `test_security.py`.
- **Kompetensi:** UX research, product strategy, data analysis, SQL/PostgreSQL, pytest.

**Vanessa Serenina Prawirayasa — System Analyst & Impact Strategist**
- **Tanggung Jawab:** Arsitektur alur sistem backend-to-product, KPI & impact metrics, keselarasan solusi dengan ekosistem ketenagakerjaan, seluruh antarmuka React 18 (Vite), state management Zustand.
- **Hasil Nyata:** 13 komponen React (CVUploader, FloatingAdvisor, EmployerDashboard, dll.), Playwright config, streaming SSE integration, definisi metrik dampak platform.
- **Kompetensi:** React 18, Vite, Zustand, systems analysis, impact measurement.

**Jason Clarence Setya Budhi — Business & Market Strategist, Backend & Integration Engineer**
- **Tanggung Jawab:** Strategi monetisasi go-to-market, analisis adopsi pasar, implementasi integrasi API, deployment cloud, payment gateway (roadmap).
- **Hasil Nyata:** `BUSINESS_MODEL.md` (Hybrid Revenue Model, unit economics, LTV:CAC), strategi penetrasi UMKM, infrastruktur Docker Compose.
- **Kompetensi:** Financial modeling, go-to-market, B2B sales, cloud deployment.

**Pengambilan Keputusan:** David sebagai Tech Owner, Jason sebagai Business Owner — keputusan final bersama. Owner milestone berikutnya (M1: E2E Testing) adalah Darren.

---

## Continuation Readiness (Maksimal 200 kata)

**Target 6–12 Bulan Pasca-Hackathon (Agustus 2026 – Januari 2027):**

| Bulan | Milestone | Owner |
|---|---|---|
| Agustus 2026 | Playwright E2E testing suite | Darren |
| September 2026 | Midtrans/Xendit Pay-to-Unlock aktif + Onboarding Survey | Jason + Vanessa |
| Oktober 2026 | E-KYC asli (Dukcapil API) | David |
| November 2026 | Pilot B2B: 5 UMKM Jabodetabek (closed beta) | Vanessa + Jason |
| Desember 2026 | Blended Skill Trend Signal (PyTrends) | Darren + David |
| Januari 2027 | Web Scraper ETL + Internal Feedback Loop aktif | Darren + David |

**Komitmen Tim:**
- David & Darren: 20 jam/minggu (engineering pasca-graduation).
- Vanessa & Jason: 15 jam/minggu (sambil menyelesaikan studi).

**Keberlanjutan:**
Google Cloud Run + Cloud SQL memungkinkan skalabilitas pay-as-you-go. Model Freemium (5 token gratis) menghasilkan pendapatan organik tanpa marketing besar.

**Kebutuhan Tambahan:**
- *Advisor/Mentor:* Pengalaman di HR-tech atau marketplace Indonesia (sedang dicari di ekosistem startup Jakarta/Bandung).
- *Mitra EdTech:* Partnership Dicoding/Prakerja untuk Tier 2 affiliate revenue.
- *Legal:* Konsultan UU PDP dan perjanjian E-KYC dengan pemerintah.

---

## Quantified Value, Business Model, and ROI (Maksimal 300 kata)

**Pihak yang Terlibat & Nilai yang Diterima:**

| Pihak | Nilai yang Diterima | Model |
|---|---|---|
| Pencari Kerja (B2C) | Match presisi, peta skill gap, panduan karier personal, verifikasi identitas | Freemium (gratis) |
| HRD/UMKM (B2B) | Shortlist dalam <10 menit vs 14 hari manual, pengurangan beban screening 90% | Pay-to-Unlock |
| Mitra EdTech | Akuisisi siswa baru via referral terkonversi dari skill gap output | Komisi afiliasi 10–15% |
| Enterprise/Headhunter | Integrasi AI matching engine ke HRIS internal | Enterprise API License |

**Model Pendapatan (Hybrid Revenue):**
1. **Pay-to-Unlock:** Rp 50.000 per 10 kontak kandidat terverifikasi. Target: 1.000 employer × Rp 2.000.000/tahun (rata-rata 40 unlock/employer).
2. **KerjaCerdas Pro (SaaS):** Rp 299.000/bulan — kuota unlock lebih besar, analitik rekrutmen lanjutan.
3. **Enterprise API License:** Lisensi kustom untuk MNC/headhunter — integrasi semantic matching ke HRIS.
4. **Affiliate EdTech:** Komisi 10–15% dari kursus yang dibeli melalui rekomendasi Skill Gap Analyzer.

**Proyeksi Tahun 1:**

| Komponen | Nilai (IDR) |
|---|---|
| Pay-to-Unlock (1.000 B2B × Rp 2 jt) | 2.000.000.000 |
| KerjaCerdas Pro (300 × Rp 299rb × 2 bln) | 179.400.000 |
| Afiliasi EdTech (500 trx × Rp 200rb) | 100.000.000 |
| **Total Pendapatan** | **Rp 2.279.400.000** |
| Biaya Operasional (Cloud, R&D, Marketing, Legal) | (300.000.000) |
| **EBITDA** | **~Rp 1,98 miliar** |

**Asumsi Utama:**
- CAC B2B: Rp 60.000/perusahaan (via LinkedIn + komunitas UMKM).
- Konversi afiliasi EdTech: 15% dari kandidat yang mengalami skill gap per bulan.
- Efisiensi LLM: Dynamic routing hemat 40% token; biaya $0.0003/evaluasi penuh.
- Break-even: Bulan ke-8 operasional.
- LTV:CAC B2B: **33.3×** (benchmark SaaS: 3–5×).

---

## Adoption, Growth Strategy, and Competitive Moat (Maksimal 250 kata)

**Strategi Akuisisi Pengguna Pertama:**
1. **B2B:** Cold outreach ke 50 UMKM dan startup di Jabodetabek via LinkedIn + komunitas asosiasi pengusaha. Freemium Hook (5 token gratis) menurunkan barier adopsi ke nol.
2. **B2C Organic:** Distribusi via pusat karier perguruan tinggi, komunitas mahasiswa/fresh graduate di Instagram dan Discord.
3. **Closed Beta:** 5 perusahaan pilot pada Q4 2026 untuk validasi dan testimonial.

**Channel & Kemitraan:**
- Pusat karier perguruan tinggi (akuisisi kandidat terkurasi).
- Dicoding, Coursera, Skill Academy (affiliate EdTech).
- PrivyID (eKYC).
- Komunitas HRD Indonesia (PMSM) untuk distribusi B2B.

**Tahapan Pengembangan:**
- Q3 2026: MVP + payment aktif + E2E testing.
- Q4 2026: Closed beta 5 employer pilot.
- Q1 2027: Public launch 5 provinsi utama (Jakarta, Jabar, Jateng, Jatim, Banten).
- Q2 2027: Ekspansi Sumatera + Enterprise API Copilot.

**Competitive Moat (Sulit Ditiru):**
1. **Closed-Loop Feedback Data:** Setiap interaksi — lolos interview, resign 3 bulan — tercatat. Dalam 6 bulan, AI dilatih dari data keberhasilan nyata bukan teori. Portal lain tidak bisa membeli data moat ini.
2. **Hybrid Pricing Inklusif:** Pay-to-Unlock Rp 50.000 terjangkau untuk UMKM yang tidak mampu lisensi ATS jutaan rupiah di muka. Barrier adopsi mendekati nol.
3. **Zero Learning Curve:** Direct Contact Unlock via email/telepon familiar — tidak memaksa perubahan SOP HRD.
4. **Skill Trend Signal Real-Time:** Blended Signal (job posting + PyTrends) — insight yang tidak dimiliki portal pasif seperti Jobstreet atau LinkedIn Indonesia.

**Bukti Ketertarikan Awal:** Demo fungsional tersedia via Docker; akun demo aktif (`budi.santoso@example.com`, `hr@goto.id`); dokumentasi teknis lengkap untuk due diligence.
