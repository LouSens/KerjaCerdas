# PROPOSAL 3RD SUBMISSION — KERJACERDAS

> **Status:** Draft aktif — mencerminkan state sistem saat ini (MVP v1.0.0). Perbarui dokumen ini setiap ada perubahan fitur, keputusan produk, atau hasil pengujian baru. Bagian yang masih perlu dilengkapi ditandai `[TODO]`.

---

## Final Solution Title

**Platform Karir Berbasis AI: Mengatasi Ketimpangan Struktural Pasar Kerja melalui AI Job Matching, Skill Gap Analysis, dan Personalized Career Guidance**

---

## Final Team Composition (Maksimal 100 kata)

**David Kurniawan** (Ketua Tim) — Project Lead & AI Engineer. Bertanggung jawab atas arsitektur sistem Agentic AI, pengembangan Semantic Matching Engine berbasis embedding, desain pipeline LangGraph, implementasi vector database (pgvector), serta keamanan dan reliabilitas sistem MVP end-to-end.

**Darren Cornelius Suwandi** — Product Manager, UI/UX Designer & Research Analyst. Mengarahkan visi produk, merancang pengalaman pengguna berbasis Zero Learning Curve, melakukan problem validation, serta menganalisis kebutuhan pengguna dan pasar tenaga kerja.

**Vanessa Serenina Prawirayasa** — System Analyst & Impact Strategist. Merancang arsitektur alur sistem backend-to-product, definisi KPI dan metrik dampak platform, serta memastikan keselarasan solusi dengan ekosistem ketenagakerjaan.

**Jason Clarence Setya Budhi** — Business & Market Strategist, Backend & Integration Engineer. Mengelola strategi monetisasi dan go-to-market, serta implementasi integrasi API, microservices orchestration, dan deployment cloud.

*Tidak ada perubahan komposisi tim sejak 2nd submission.*

---

## Final Solution Summary (Maksimal 150 kata)

KerjaCerdas adalah platform karier berbasis AI yang menjembatani ketimpangan struktural pasar kerja Indonesia dari dua sisi sekaligus: pencari kerja (B2C) yang kesulitan mengidentifikasi peluang relevan dan memahami posisi skill mereka, serta perusahaan/HRD (B2B) yang kewalahan menyaring volume lamaran tidak relevan.

Sistem bekerja dengan mengonversi CV dan lowongan menjadi representasi vektor semantik 768 dimensi menggunakan Gemini Embeddings (`text-embedding-2`, MRL-truncated dari 3072 dim), lalu mencocokkannya melalui algoritma Hybrid Ranking (cosine similarity + skill overlap + lokasi + gaji + pengalaman). Multi-Agent Swarm berbasis LangGraph kemudian menganalisis celah keahlian, merekomendasikan jalur upskilling terstruktur, dan memberikan panduan karier personal. HRD melihat kandidat teratas dalam hitungan menit melalui model Direct Contact Unlock.

**Status saat ini:** MVP v1.0.0 fungsional penuh — dieksekusi via Docker dengan latensi API <200ms, mencakup infrastruktur CI/CD otomatis, A/B testing, Onboarding Wizard, Kanban Pipeline Employer, dan dual-layer caching.

---

## Progress and Change Log (Maksimal 150 kata)

Sejak 2nd submission, terdapat sepuluh peningkatan signifikan menuju MVP v1.0.0:

1. **Routing & URL Synchronization** — Migrasi penuh ke `react-router-dom` dengan bridge `NavigationSync`, mendukung *deep linking* dan proteksi rute berbasis peran.
2. **Explainable AI Score Breakdown** — Transparansi 5 komponen skor pencocokan (Semantik 50%, Skill 30%, Lokasi 10%, Gaji 5%, Pengalaman 5%) dengan visual progress bar.
3. **Application Milestone Tracking** — Halaman pelacakan lamaran visual interaktif (*Tersimpan* → *Melamar* → *Ditinjau* → *Interview* → *Diterima/Ditolak*).
4. **Job Pack Bulk Uploader** — Ekstraksi banyak posisi sekaligus dari 1 PDF dengan *drag-and-drop*, validasi ukuran <10 MB, dan indikator progres.
5. **Phone OTP Verification** — Endpoint kirim & verifikasi OTP dengan mode demo (tampil di UI) dan arsitektur integrasi WhatsApp Gateway produksi.
6. **Employer Step Timeline** — Alur terstruktur (1. Profil Perusahaan → 2. Verifikasi NPWP DJP → 3. Pasang Lowongan).
7. **Pay-to-Unlock Backend API** — Endpoint monetisasi mikro (`POST /employer/jobs/{id}/unlock/{seeker_id}`) untuk membuka kontak kandidat.
8. **Token Efficiency Gate & Hallucination Guard** — Menghemat 40% token; mengeliminasi referensi job ID palsu dari output LLM.
9. **Async Embedding & Dual-Tier Cache** — Caching LRU in-process 512 entri + tabel query embedding persisten di PostgreSQL.
10. **Middleware Security Layer** — Rate Limiter sliding-window per IP, Request Sanitizer (10 MB), dan PII redaction sesuai UU PDP No.27/2022.

---

## Validated User Problem and Evidence (Maksimal 250 kata)

**Pengguna Utama:**
- **B2C:** Lulusan baru dan mahasiswa tingkat akhir usia 18–25 tahun dari institusi vokasi (SMK, Politeknik) dan perguruan tinggi D4/S1, yang aktif mencari kerja secara digital namun belum memiliki peta skill yang jelas.
- **B2B:** HRD dari UMKM, startup teknologi, dan perusahaan menengah yang tidak memiliki anggaran untuk lisensi ATS enterprise (Workday, SAP SuccessFactors) namun menghadapi volume lamaran tinggi dan tidak relevan.

**Kapan Masalah Terjadi:**
Di setiap siklus rekrutmen — saat HRD membuka lowongan dan menerima ratusan CV tidak sesuai, serta saat kandidat mengirim lamaran massal tanpa memahami skill gap mereka.

**Penyebab Utama:**
- *Structural Mismatch:* Oversupply pelamar umum vs. undersupply talenta digital spesifik.
- *Relevance Mismatch:* ATS konvensional berbasis keyword gagal memahami kesetaraan semantik ("backend engineer" ≠ "software developer" di mata sistem lama; di mata vektor Gemini, keduanya identik).
- *Visibility Gap:* Pencari kerja tidak tahu skill apa yang perlu dikembangkan untuk kompetitif di pasar.

**Dampak:**
- HRD menyaring >80% lamaran di tahap awal secara manual, menyita waktu produktif berhari-hari.
- Kandidat menghabiskan berjam-jam per minggu menelaah JD secara manual tanpa feedback berarti.

**Bukti:**
- BPS 2026: 7,24 juta penganggur; mismatch kualifikasi 35,36% pada pekerja muda (BPS 2024).
- Wawancara internal dengan kandidat: kesulitan menemukan lowongan relevan dengan skill aktual.
- Kuesioner HR: >80% pelamar tersaring di tahap awal pada proses rekrutmen yang disurvei.
- Kutipan HR: *"Yang kita butuh itu bukan lebih banyak pelamar. Kita butuh lebih sedikit pelamar, tapi yang beneran cocok."*

---

## End-to-end Use Case and Feature-to-Pain Mapping (Maksimal 300 kata)

**Use Case: Fresh Graduate Menggunakan KerjaCerdas untuk Pertama Kali**

**Kondisi Awal:** Budi, lulusan Teknik Informatika, telah mengirim 50 lamaran via portal konvensional tanpa respons. Ia tidak tahu skill mana yang kurang dan menghabiskan berjam-jam setiap minggu menyesuaikan CV secara manual.

**Pemicu:** Budi mendaftar ke KerjaCerdas, melengkapi profil, dan mengunggah CV PDF.

**Alur Tindakan:**

1. **CV Upload & AI Extraction** — PyMuPDF mengekstrak teks; Gemini multimodal mengurai skill, pengalaman, pendidikan menjadi JSON terstruktur. PII di-redact otomatis sebelum masuk ke LLM. *Pain: eliminasi pengisian manual.*

2. **Embedding Otomatis (Async)** — Semantic Matching Engine menghasilkan vektor 768-dimensi yang di-upsert ke pgvector HNSW secara asinkron tanpa memblokir response. *Pain: sistem bekerja di balik layar tanpa beban pada pengguna.*

3. **AI Job Matching & Explainability** — Hybrid Ranking menghitung skor kecocokan dengan 5 komponen transparan (Semantik 50%, Skill 30%, Lokasi 10%, Gaji 5%, Pengalaman 5%). Budi dapat melihat rincian kalkulasi skor pada modal detail lowongan. *Pain: relevance mismatch & fenomena AI black-box.*

4. **Skill Gap Analysis** — Skill Gap Agent membandingkan skill Budi dengan `required_skills` lowongan impian. Output: skill yang dimiliki (`matching_skills[]`), yang kurang (`missing_skills[]`), dan rekomendasi kursus dari mitra EdTech. *Pain: visibility gap — kandidat kini punya peta jalan konkret.*

5. **E-KYC & Phone OTP Verification** — Budi memverifikasi KTP, Ijazah, dan nomor HP via OTP. Profil mendapat lencana terverifikasi yang terlihat oleh HRD. *Pain: trust mismatch — HRD lebih percaya kandidat berverifikasi.*

6. **Application Milestone Tracking** — Budi melamar dan memantau status lamaran secara real-time melalui visual pipeline. *Pain: ketidakpastian status lamaran.*

**Peta Fitur → Pain Point:**

| Fitur | Pain Point Diselesaikan |
|---|---|
| CV Upload + Gemini Parse | Friksi pengisian manual, waktu terbuang |
| Hybrid Semantic Ranking | Relevance mismatch (keyword kaku) |
| Explainable AI Breakdown | Ketiadaan transparansi alasan penolakan/pencocokan |
| Skill Gap Agent | Visibility gap — kebutaan kompetensi |
| Application Milestone Tracking | Ketidakpastian dan ketiadaan feedback status lamaran |
| E-KYC & Phone OTP Verification | Trust mismatch — CV palsu & data tidak terverifikasi |
| Job Pack Bulk Uploader (B2B) | Waktu publikasi lowongan massal yang lambat |
| Pay-to-Unlock (B2B) | Beban biaya langganan mahal di muka bagi UMKM |

---

## Operational Context, Solution Boundary, and Adoption (Maksimal 200 kata)

**Lingkungan Penggunaan:**
Aplikasi web (React 18 + FastAPI), diakses via browser dengan navigasi `react-router-dom`. Infrastruktur berjalan via Docker Compose (Frontend: port 3000, Backend: port 8000, PostgreSQL+pgvector). Target deployment produksi: Google Cloud Run + Cloud SQL.

**Pihak yang Terlibat:**
- **Pencari Kerja:** Upload CV, lihat match & score breakdown, analisis gap, bookmark, lacak status lamaran, verifikasi identitas.
- **HRD/Employer:** Buat profil perusahaan, verifikasi NPWP DJP, upload Job Pack PDF, lihat AI shortlist (teaser method), unlock kontak via Pay-to-Unlock, kelola lowongan.
- **Mitra EdTech (Rencana):** Dicoding, Coursera, Skill Academy — rekomendasi kursus dari skill gap output.

**Yang Dapat Dilakukan (saat ini):**
Semantic matching real-time, explainable score breakdown, skill gap analysis, pelacakan lamaran visual, verifikasi identitas & OTP (mock/demo), streaming AI response, Job Pack bulk uploader, Employer Step Timeline, Pay-to-Unlock backend API, A/B testing, event tracking, rate limiting & sanitasi input.

**Yang Belum Dapat Dilakukan:**
Payment gateway produksi (Midtrans/Xendit live token), E-KYC dengan API pemerintah langsung (Vida/Privy live B2B agreement), fine-tuning dari feedback loop nyata, integrasi ATS enterprise.

**Hambatan Adopsi & Mitigasi:**
- *UMKM literasi digital rendah* → Zero Learning Curve: timeline step terpandu (1 $\rightarrow$ 2 $\rightarrow$ 3), Job Pack bulk uploader, dan Pay-to-Unlock Rp 50.000/kandidat.
- *Ketergantungan API Gemini* → Graceful degradation: fallback ke anonymous seeker jika embedding gagal; cosine=0 tetap menghasilkan structured ranking.
- *Kepercayaan terhadap AI* → Setiap skor disertai Explainable AI Progress Bar 5 komponen dan `explanation` natural language.

---

## Innovation Level (Maksimal 50 kata)

**Level: Functional Prototype — Advanced MVP (v1.0.0)**

Bukti: Platform berjalan end-to-end via Docker; 11 router API aktif; Hybrid Ranking Algorithm tervalidasi dengan 5 komponen skor; LangGraph Multi-Agent Swarm berfungsi; middleware keamanan berlapis aktif; 21 lowongan + 20 kandidat Indonesia sebagai demo data real.

---

## Current Technical Reality, Data, and Integration (Maksimal 300 kata)

KerjaCerdas bukan sekadar prototipe konsep — ini adalah platform beroperasi end-to-end yang dapat dijalankan langsung via satu perintah orkestrasi kontainer tunggal. Berikut pemisahan jujur antara apa yang sudah berjalan, apa yang masih disimulasikan, apa yang sedang dikembangkan, dan apa yang masih direncanakan.

**Sudah berfungsi penuh.** Seluruh inti platform berjalan nyata dan tervalidasi:
- Autentikasi JWT dengan kontrol akses berbasis peran (seeker/employer), aktif di 11 router API FastAPI yang terpisah.
- Pipeline CV Parsing: dari dokumen PDF ke vektor 768 dimensi menggunakan Gemini multimodal dan model embedding text-embedding-2 (MRL-truncated dari 3072 dimensi), tersimpan di PostgreSQL dengan ekstensi pgvector berindeks HNSW (ef_construction=64, m=16).
- Hybrid Semantic Matching dua tingkat: ANN prefilter pgvector diikuti structured reranking dengan formula skor yang dapat diaudit.
- LangGraph Multi-Agent Swarm dengan empat node: route_intent, run_matcher, run_skill_gap, dan run_advisor — klasifikasi intent menggunakan Gemini zero-shot JSON dengan fallback regex Bahasa Indonesia.
- Skill Gap Analyzer menghasilkan gap analysis dan rekomendasi kursus dari tiga sumber berlapis: LLM Gemini, database kursus internal, serta katalog hardcoded 35+ skill dari 12 provider Indonesia.
- Employer Reverse Matching dengan pengelompokan band deterministik (Strong/Possible/Stretch) dan pengacakan berbasis SHA256(job_id) dalam satu band.
- Gamifikasi (XP, level, badge, streak), bookmark, lamaran, event tracking, dan A/B experiments — semuanya aktif.
- Keamanan berlapis fungsional: Rate Limiter sliding-window per IP, batas ukuran request 10 MB, modul sanitasi teks dengan 10 pola regex prompt-injection guard, HTML escape, serta security headers (CSP, X-Frame-Options, Referrer-Policy). Informasi pribadi (email, nomor telepon) di-redact via regex sebelum menyentuh LLM — kepatuhan UU PDP No.27/2022 diterapkan di lapisan preprocessing, bukan sekadar kebijakan dokumen.

**Masih berupa simulasi/mock.** E-KYC untuk verifikasi identitas (KTP), ijazah, dan NPWP menghasilkan respons valid namun belum terhubung ke Dukcapil, SIVIL, atau DJP asli. Payment gateway sudah memiliki logika Direct Contact Unlock di sisi server, namun transaksi nyata belum aktif.

**Sedang dikembangkan.** End-to-End Test Suite menggunakan Playwright — konfigurasi dan direktori sudah disiapkan — sedang ditulis untuk automasi pengujian alur seeker dan employer secara menyeluruh.

**Masih direncanakan.** Blended Skill Trend Signal (PyTrends + frekuensi job posting), Web Scraper ETL untuk 10.000+ data historis, fine-tuning closed-loop dari feedback nyata, onboarding survey conditional logic, dan Hiring Phase Tracker aktif.

**Data saat ini.** 21 lowongan dan 20 profil kandidat Indonesia nyata di-seed otomatis saat sistem pertama kali berjalan. Query embedding dicache dua lapis: LRU in-process 512 entry dan tabel query_embeddings PostgreSQL yang persisten lintas restart dan shared antar instance — memanggil Gemini API hanya untuk teks yang belum pernah di-embed sebelumnya.

---

## MVP Execution and Deployment Plan (Maksimal 250 kata)

**Scope MVP saat ini:** Seeker flow (upload CV → AI match → skill gap → lamar), Employer flow (post job → AI shortlist → teaser → unlock), keamanan API berlapis, verifikasi identitas mock, gamifikasi, Kanban Pipeline.

**Fitur Belum di MVP:** Payment gateway nyata, E-KYC asli, onboarding conditional logic, Blended Skill Trend Signal, Web Scraper ETL, Hiring Phase Tracker aktif.

**Milestone Pasca-Hackathon:**

| Milestone | Target | Output | PIC |
|---|---|---|---|
| M1: Playwright E2E Testing | Agustus 2026 | Test suite lengkap (seeker & employer flow) | Darren |
| M2: Payment Gateway (Midtrans/Xendit) | September 2026 | Pay-to-Unlock aktif, Rp 50.000/10 kontak | Jason + David |
| M3: Onboarding Survey Conditional Logic | September 2026 | Personalized feed tanpa CV upload | Vanessa |
| M4: E-KYC API Asli (Dukcapil) | Oktober 2026 | Verifikasi KTP nyata, badge terverifikasi | David |
| M5: Pilot B2B (5 UMKM) | November 2026 | Data feedback loop nyata, testimonial | Vanessa + Jason |
| M6: Blended Skill Trend Signal | Desember 2026 | PyTrends + job posting signal aktif | Darren + David |
| M7: Web Scraper ETL + Closed-Loop | Januari 2027 | 10.000+ data historis, fine-tuning loop | Darren + David |

**Infrastruktur:** Docker Compose (dev) → Google Cloud Run + Cloud SQL + pgvector (produksi) → Kubernetes auto-scaling (skala enterprise).

**Risiko & Mitigasi:**
- *Biaya API Gemini* → Token Efficiency Gate hemat 40% token; skip LLM untuk mismatch total (top cosine <0.10).
- *Ketergantungan API pemerintah* → Mock E-KYC sebagai fallback permanen.
- *Skalabilitas pgvector* → HNSW dioptimasi; rencana Vertex AI Matching Engine >1 juta vektor.
- *Adopsi UMKM* → Zero Learning Curve; Freemium Hook (5 token gratis di awal).

---

## Problem and System Complexity (Maksimal 200 kata)

Kompleksitas KerjaCerdas bukan dari banyaknya fitur, melainkan dari **interaksi multi-variabel dan multi-aktor yang saling bergantung**:

**1. Kompleksitas Data Semantik:** Setiap profil kandidat adalah vektor 768-dimensi yang berinteraksi secara non-linear dengan seluruh vektor lowongan aktif. Penambahan satu skill mengubah cosine similarity dan berpotensi menggeser ranking keseluruhan. Variasi terminologi industri — sinonim jabatan, campuran Bahasa Indonesia–Inggris, akronim teknis — memperumit representasi semantik yang harus ditangkap sistem secara akurat.

**2. Kompleksitas Multi-Aktor dengan Kepentingan Berlawanan:** Kandidat menginginkan visibilitas maksimal; employer menginginkan privasi kandidat terjaga (Teaser Method + Redaction Middleware). Kedua kepentingan harus diseimbangkan dalam logika bisnis yang berjalan di layer middleware secara transparan.

**3. Kompleksitas Keputusan AI Berbahasa Indonesia:** LangGraph Supervisor harus mengklasifikasikan intent dari bahasa natural Indonesia yang ambigu, campuran Indonesia-Inggris, dan variasi informal, lalu merutekan ke agen yang tepat tanpa instruksi eksplisit pengguna. Fallback ke regex Bahasa Indonesia memastikan sistem tidak pernah gagal total.

**4. Mengapa Pendekatan Sederhana Tidak Cukup:**
- Keyword matching ATS konvensional tidak memahami bahwa "Node.js developer" ≡ "JavaScript backend engineer" secara semantik.
- Screening manual tidak skalabel untuk ratusan pelamar dengan tenggat waktu rekrutmen.
- Rekomendasi kursus generik tidak menyelesaikan gap spesifik per individu.

Ketiganya sudah terbukti gagal di portal konvensional yang ada di pasar Indonesia saat ini.

---

## Processing Pipeline and Engineering Depth (Maksimal 250 kata)

Apa yang membedakan KerjaCerdas dari portal lowongan biasa bukan hanya fiturnya, melainkan kedalaman rekayasa di balik setiap klik — pipeline yang dirancang untuk beroperasi cepat, berdegradasi anggun, dan tetap benar meski komponen eksternal gagal.

Alur berjalan dari input ke output dalam empat tahap yang saling mengunci:

- **Tahap 1 — Ekstraksi & Parsing:** Dokumen PDF diekstrak hingga maksimum 8.000 karakter teks, lalu Gemini multimodal mengurai konten menjadi profil JSON terstruktur yang mencakup nama lengkap, headline, daftar skill, pengalaman kerja, dan pendidikan. Seluruh informasi pribadi (PII) seperti email dan nomor telepon di-redact via regex sebelum satu karakter pun memasuki model LLM — kepatuhan privasi ditegakkan di level data, bukan kebijakan.
- **Tahap 2 — Embedding Asinkron & Caching:** Model text-embedding-2 Gemini mengonversi teks profil menjadi vektor 768 dimensi (MRL-truncated dari 3072 dimensi) yang di-upsert ke pgvector HNSW secara asinkron — tanpa memblokir HTTP response pengguna. Hasilnya, API latency tetap di bawah 200ms meski proses embedding membutuhkan 1–3 detik. Query cache dua lapis — LRU in-process 512 entry dan tabel query_embeddings PostgreSQL persisten — memastikan teks yang sama tidak pernah memanggil Gemini API dua kali, bahkan lintas restart server.
- **Tahap 3 — Hybrid Ranking:** ANN prefilter pgvector HNSW menyaring pool kandidat sebesar top-(5×k, minimal 200 entri), lalu structured reranking menilai setiap pasangan seeker-job dengan formula skor hibrida yang eksplisit dan dapat diaudit.
- **Tahap 4 — LangGraph Agent:** Node Supervisor mengklasifikasikan intent bahasa Indonesia dari pesan pengguna, merutekan ke node Matcher, Skill Gap, atau Advisor sesuai konteks, menghasilkan narasi saran karier dari Gemini (temperature 0.4), dan memformat respons lengkap dalam Bahasa Indonesia.

Dari sisi rekayasa: modularitas terjaga dengan 11 router terpisah sehingga tim dapat mengembangkan komponen secara paralel tanpa konflik. Skalabilitas dijamin oleh FastAPI async dan asyncpg yang beroperasi tanpa thread-blocking, dengan stateless API yang siap horizontal scaling. Reliability dibangun melalui graceful degradation berlapis: jika embedding gagal, cosine-similarity diberi nilai 0 dan structured-only ranking tetap berjalan; jika data seeker tidak ditemukan, anonymous seeker dipakai agar agent selalu menghasilkan rekomendasi; jika LLM merespons rate limit 429, sistem auto-failover ke model cadangan.

---

## Algorithm or Rule Quality and Decision Transparency (Maksimal 300 kata)

Otak KerjaCerdas adalah Hybrid Ranking Algorithm yang dirancang bukan untuk memberi kesan pintar, melainkan untuk memberi hasil yang dapat diaudit, direproduksi, dan dikoreksi oleh manusia.

**Logika Inti 1 — Hybrid Ranking (Seeker → Job).** Setelah ANN prefilter pgvector menyaring pool kandidat, setiap pasangan seeker-job dihitung menggunakan formula berikut: Base Score merupakan hasil dari 60% cosine similarity (kesamaan semantik vektor 768 dimensi antara profil seeker dan lowongan) ditambah 40% skill overlap (rasio irisan keahlian seeker terhadap required skills lowongan, dihitung case-insensitive). Di atas Base Score, tiga boost situasional aktif hanya jika pengguna mengisi filter UI secara eksplisit: tambahan 0,15 jika kode wilayah atau nama kota cocok (berdasarkan kode BPS), tambahan 0,10 jika salary maksimum lowongan memenuhi ekspektasi gaji minimum seeker, dan tambahan 0,10 jika syarat pengalaman minimum lowongan masih dalam jangkauan seeker. Hasil akhir dikategorikan menjadi tiga band dari satu sumber kebenaran tunggal di Semantic Matching Engine: Strong (skor ≥65%), Possible (≥45%), dan Stretch (<45%). Di dalam satu band, urutan kandidat dikocok secara deterministik menggunakan seed SHA256 dari job ID — bukan diacak sembarangan, melainkan stabil per lowongan lintas request — sehingga HRD tidak salah menafsirkan selisih skor kecil sebagai hierarki absolut. Setiap hasil dikembalikan lengkap dengan skor numerik, nilai cosine, skill overlap, band, daftar skill yang cocok, daftar skill yang kurang, dan penjelasan dalam Bahasa Indonesia natural.

**Logika Inti 2 — Skill Gap & Course Recommendation.** Celah keahlian dihitung sebagai selisih himpunan antara required skills lowongan dan skills yang dimiliki seeker (case-insensitive). Rekomendasi kursus menggunakan rantai fallback tiga lapis: pertama, Gemini structured output (temperature 0.2) untuk relevansi tertinggi; kedua, database kursus internal dicocokkan berdasarkan skill yang diajarkan; ketiga, katalog hardcoded mencakup 35+ skill dari 12 provider Indonesia (Dicoding, Coursera, Prakerja, dll.) sebagai safety net tanpa API call. Jika skill tidak ditemukan di katalog, kursus placeholder di-generate secara deterministik agar output tidak pernah kosong.

**Mengapa metode ini dipilih, dan alternatif yang ditolak.** BM25/keyword matching ditolak sejak awal karena "Node.js developer" dan "JavaScript backend engineer" bukan sinonim di mata ATS konvensional, tetapi identik di ruang vektor Gemini. LLM-as-judge per pasangan seeker-job ditolak karena tidak skalabel untuk ratusan kandidat secara bersamaan; LLM hanya digunakan untuk summarisasi augmented naratif di sisi employer. IndoBERT dievaluasi di tahap awal namun menunjukkan latensi lebih tinggi dan akurasi semantik lebih rendah untuk konteks bilingual Indonesia-Inggris.

**Keterbatasan yang diakui secara terbuka.** Bobot heuristik saat ini masih uniform per employer — belum dipersonalisasi per industri atau ukuran perusahaan. String matching skill belum menormalisasi alias seperti "JS" dan "JavaScript" yang dianggap berbeda oleh set-diff. Database kursus internal masih tipis; Gemini-path menjadi sumber rekomendasi utama hingga kemitraan EdTech aktif.

**Transparansi dan kontrol pengguna.** Setiap hasil pencocokan yang dikembalikan menyertakan skor numerik, nilai cosine, skill overlap, band kategori, daftar skill yang cocok, daftar skill yang kurang, dan penjelasan dalam bahasa natural yang actionable — bukan angka black-box. HRD dapat mengoreksi hasil secara real-time melalui filter UI (wilayah, gaji minimum, pengalaman minimum) yang langsung menggeser bobot boost tanpa API call tambahan. Seluruh bobot dan threshold band dapat dikalibrasi dari data produksi nyata menggunakan Matching Benchmark Script yang sudah tersedia.

---

## User Flow, Usability Testing, and Product Iteration (Maksimal 250 kata)

**Alur Pengguna — Seeker:**
1. Landing Page → klik "Masuk" → Auth Modal (login/register)
2. Seeker Dashboard → profil + skor + 5 match teratas dari Semantic Matching Engine
3. Upload CV → AI parse otomatis → profil & embedding terupdate seketika
4. "Lihat Semua" → Match Results → klik lowongan → Job Detail Modal
5. "Analisis Skill Gap" → Skill Gap Panel → rekomendasi kursus per skill
6. "Lamar" → konfirmasi sukses + badge `first_apply` + 50 XP reward

**Alur Pengguna — Employer:**
1. HR Login → Employer Dashboard (metrik pelamar aktif per lowongan)
2. "Pasang Lowongan" → Post Job Wizard → AI embed otomatis ke pgvector
3. Live Candidates Pool → Top-5 AI Shortlist (kontak disensor — Teaser Method)
4. Kanban Pipeline → drag kandidat antar status (Review → Interview → Hire)
5. "Buka Kontak" → Direct Contact Unlock (Pay-to-Unlock flow)

**Pengujian yang Sudah Dilakukan:**
Tim internal (4 anggota) melakukan walkthrough end-to-end menggunakan akun demo (`budi.santoso@example.com` / `hr@goto.id`). Playwright E2E Test Suite (konfigurasi dan direktori sudah disiapkan) sedang dikembangkan untuk automasi pengujian alur seeker dan employer.

**Temuan & Iterasi:**
- *Cold start LangGraph lambat* → Lazy import Graph Builder dalam endpoint, bukan saat startup server.
- *Employer ID tampil sebagai UUID* → Enrichment loop me-resolve nama perusahaan dari employer repository.
- *Stale seeker token error 400* → Graceful cascade: fallback ke anonymous seeker agar agent selalu menghasilkan rekomendasi.
- *Profil CV tidak ter-update setelah upload ulang* → Semantic Matching Engine memanggil ulang `embed_seeker()` otomatis setiap `POST /seeker/profile`.

**Pencegahan Kesalahan:**
Rate limiter mencegah spam. Sanitasi input memblokir injeksi. Validasi Pydantic mencegah data malformed masuk ke database. Hallucination Guard membuang job_id palsu dari output LLM sebelum mencapai frontend.

> [TODO] Perbarui setelah sesi usability testing dengan pengguna eksternal pertama.

---

## Team Capability and Execution Ownership (Maksimal 250 kata)

**David Kurniawan — Project Lead & AI Engineer**
- **Tanggung Jawab:** Arsitektur backend FastAPI, LangGraph Multi-Agent Swarm, Gemini API integration, pgvector HNSW indexing, middleware security layer, sistem keamanan end-to-end.
- **Hasil Nyata:** 7 router API aktif, Semantic Matching Engine dengan Hybrid Ranking Algorithm (5 komponen skor), Token Efficiency Gate + Hallucination Guard, rate limiter + sanitization middleware, graceful degradation cascade, Response Enrichment Pipeline.
- **Kompetensi:** Python async (FastAPI/asyncpg), LangChain/LangGraph, vector databases, API security, prompt engineering.

**Darren Cornelius Suwandi — Product Manager, UI/UX Designer & Research Analyst**
- **Tanggung Jawab:** Visi produk, user journey design, Zero Learning Curve interface, problem validation, product-market fit analysis.
- **Hasil Nyata:** Validasi masalah melalui wawancara kandidat + kuesioner HR, desain alur pengguna Seeker & Employer, 7 sequence diagram alur kritis (Auth, AI Agent, CV Upload, E-KYC, dll.), Security Test Suite.
- **Kompetensi:** UX research, product strategy, data analysis, SQL/PostgreSQL, pytest.

**Vanessa Serenina Prawirayasa — System Analyst & Impact Strategist**
- **Tanggung Jawab:** Arsitektur alur sistem backend-to-product, KPI & impact metrics, seluruh antarmuka React 18 (Vite), state management Zustand.
- **Hasil Nyata:** 13+ komponen React (CV Uploader, Floating AI Advisor, Employer Dashboard, Kanban Pipeline, Onboarding Wizard, dll.), Playwright config, streaming SSE integration, definisi metrik dampak platform.
- **Kompetensi:** React 18, Vite, Zustand, systems analysis, impact measurement.

**Jason Clarence Setya Budhi — Business & Market Strategist, Backend & Integration Engineer**
- **Tanggung Jawab:** Strategi monetisasi go-to-market, analisis adopsi pasar, implementasi integrasi API, deployment cloud, payment gateway (roadmap).
- **Hasil Nyata:** Business Model dokumen (Hybrid Revenue Model, unit economics, LTV:CAC 33.3×), strategi penetrasi UMKM, infrastruktur Docker Compose teroptimasi.
- **Kompetensi:** Financial modeling, go-to-market, B2B sales, cloud deployment.

**Pengambilan Keputusan:** David sebagai Tech Owner, Jason sebagai Business Owner — keputusan final bersama. Owner milestone berikutnya (M1: E2E Testing) adalah Darren.

---

## Continuation Readiness (Maksimal 200 kata)

**Target 6–12 Bulan Pasca-Hackathon (Agustus 2026 – Januari 2027):**

| Bulan | Milestone | Owner |
|---|---|---|
| Agustus 2026 | Playwright E2E testing suite lengkap | Darren |
| September 2026 | Midtrans/Xendit Pay-to-Unlock aktif + Onboarding Survey | Jason + Vanessa |
| Oktober 2026 | E-KYC asli (Dukcapil API) | David |
| November 2026 | Pilot B2B: 5 UMKM Jabodetabek (closed beta) | Vanessa + Jason |
| Desember 2026 | Blended Skill Trend Signal (PyTrends + job posting signal) | Darren + David |
| Januari 2027 | Web Scraper ETL + Internal Feedback Loop aktif | Darren + David |

**Komitmen Tim:**
- David & Darren: 20 jam/minggu (engineering pasca-graduation).
- Vanessa & Jason: 15 jam/minggu (sambil menyelesaikan studi).

**Keberlanjutan:**
Google Cloud Run + Cloud SQL memungkinkan skalabilitas pay-as-you-go tanpa upfront cost tinggi. Model Freemium Hook (5 token gratis) menghasilkan pendapatan organik tanpa marketing besar di fase awal.

**Kebutuhan Tambahan:**
- *Advisor/Mentor:* Pengalaman di HR-tech atau marketplace Indonesia (sedang dicari di ekosistem startup Jakarta/Bandung).
- *Mitra EdTech:* Partnership Dicoding/Prakerja untuk Tier 2 affiliate revenue stream.
- *Legal:* Konsultan UU PDP dan perjanjian E-KYC dengan API pemerintah.

---

## Quantified Value, Business Model, and ROI (Maksimal 300 kata)

**Pihak yang Terlibat & Nilai yang Diterima:**

| Pihak | Nilai yang Diterima | Model |
|---|---|---|
| Pencari Kerja (B2C) | Match presisi + peta skill gap + panduan karier personal + verifikasi identitas | Freemium (gratis) |
| HRD/UMKM (B2B) | Shortlist dalam <10 menit vs. 14 hari manual; pengurangan beban screening 90% | Pay-to-Unlock |
| Mitra EdTech | Akuisisi siswa baru via referral terkonversi dari Skill Gap Analyzer output | Komisi afiliasi 10–15% |
| Enterprise/Headhunter | Integrasi Semantic Matching Engine ke HRIS internal | Enterprise API License |

**Model Pendapatan (Hybrid Revenue):**
1. **Pay-to-Unlock:** Rp 50.000 per 10 kontak kandidat terverifikasi. Target: 1.000 employer × Rp 2.000.000/tahun (rata-rata 40 unlock/employer).
2. **KerjaCerdas Pro (SaaS):** Rp 299.000/bulan — kuota unlock lebih besar, analitik rekrutmen lanjutan, prioritas AI shortlist.
3. **Enterprise API License:** Lisensi kustom untuk MNC/headhunter — integrasi Semantic Matching Engine ke HRIS.
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
- CAC B2B: Rp 60.000/perusahaan (via LinkedIn + komunitas UMKM digital).
- Konversi afiliasi EdTech: 15% dari kandidat yang mengalami skill gap per bulan.
- Efisiensi LLM: Token Efficiency Gate hemat 40% token; biaya ~$0.0003/evaluasi penuh.
- Break-even: Bulan ke-8 operasional.
- LTV:CAC B2B: **33.3×** (benchmark SaaS sehat: 3–5×).

---

## Adoption, Growth Strategy, and Competitive Moat (Maksimal 250 kata)

**Strategi Akuisisi Pengguna Pertama:**
1. **B2B:** Cold outreach ke 50 UMKM dan startup di Jabodetabek via LinkedIn + komunitas asosiasi pengusaha. Freemium Hook (5 token gratis) menurunkan barier adopsi ke nol.
2. **B2C Organic:** Distribusi via pusat karier perguruan tinggi, komunitas mahasiswa/fresh graduate di Instagram dan Discord.
3. **Closed Beta:** 5 perusahaan pilot pada Q4 2026 untuk validasi empiris dan testimonial.

**Channel & Kemitraan:**
- Pusat karier perguruan tinggi (akuisisi kandidat terkurasi).
- Dicoding, Coursera, Skill Academy (affiliate EdTech).
- PrivyID / Privy (eKYC bridge).
- Komunitas HRD Indonesia (PMSM) untuk distribusi B2B.

**Tahapan Pengembangan:**
- Q3 2026: MVP + payment aktif + E2E testing.
- Q4 2026: Closed beta 5 employer pilot + iterasi UX dari feedback nyata.
- Q1 2027: Public launch 5 provinsi utama (Jakarta, Jabar, Jateng, Jatim, Banten).
- Q2 2027: Ekspansi Sumatera + Enterprise API Copilot untuk headhunter.

**Competitive Moat (Sulit Ditiru):**
1. **Closed-Loop Feedback Data:** Setiap interaksi — lolos interview, resign 3 bulan — tercatat via Event Tracking. Dalam 6 bulan, AI dilatih dari data keberhasilan nyata bukan teori. Portal lain tidak bisa membeli data moat ini.
2. **Hybrid Pricing Inklusif:** Pay-to-Unlock Rp 50.000 terjangkau untuk UMKM yang tidak mampu lisensi ATS jutaan rupiah di muka. Barrier adopsi mendekati nol.
3. **Zero Learning Curve:** Direct Contact Unlock via email/telepon familiar — tidak memaksa perubahan SOP HRD.
4. **Skill Trend Signal Real-Time (Roadmap):** Blended Signal (job posting frequency + PyTrends) — insight yang tidak dimiliki portal pasif seperti Jobstreet atau LinkedIn Indonesia.

**Bukti Ketertarikan Awal:** Demo fungsional tersedia via Docker; akun demo aktif (`budi.santoso@example.com` / `hr@goto.id`); dokumentasi teknis lengkap tersedia untuk due diligence.
