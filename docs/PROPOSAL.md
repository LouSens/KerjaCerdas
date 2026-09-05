# PROPOSAL SUBMISSION — KERJACERDAS

> **Dokumen Proposal Solusi Inovasi & Bisnis**: Mencerminkan solusi utuh, arsitektur teknis, validasi masalah pengguna, diferensiasi pasar, pemodelan finansial terukur, dan rencana eksekusi MVP KerjaCerdas.

---

## 1. Final Solution Title

**KerjaCerdas: Platform Karir Berbasis AI untuk Mengatasi Ketimpangan Struktural Pasar Kerja melalui Semantic Job Matching, Explainable AI, Skill Gap Analysis, dan Pay-to-Unlock Recruitment**

---

## 2. Final Team Composition (Maksimal 100 kata)

- **David Kurniawan** (Ketua Tim) — *Project Lead & AI Engineer*. Bertanggung jawab atas arsitektur sistem Agentic AI, pengembangan Semantic Matching Engine berbasis embedding, desain pipeline LangGraph, implementasi vector database (`pgvector`), serta keamanan dan reliabilitas sistem MVP end-to-end.
- **Darren Cornelius Suwandi** — *Product Manager, UI/UX Designer & Research Analyst*. Mengarahkan visi produk, merancang pengalaman pengguna berbasis Zero Learning Curve, melakukan problem validation, serta menganalisis kebutuhan pengguna dan pasar tenaga kerja.
- **Vanessa Serenina Prawirayasa** — *System Analyst & Impact Strategist*. Merancang arsitektur alur sistem backend-to-product, definisi KPI dan metrik dampak platform, serta memastikan keselarasan solusi dengan ekosistem ketenagakerjaan.
- **Jason Clarence Setya Budhi** — *Business & Market Strategist, Backend & Integration Engineer*. Mengelola strategi monetisasi dan go-to-market, serta implementasi integrasi API, microservices orchestration, dan deployment cloud.

---

## 3. Final Solution Summary (Maksimal 150 kata)

KerjaCerdas adalah platform karier berbasis kecerdasan buatan (*AI-powered talent infrastructure*) yang menyelesaikan krisis ketimpangan ganda (*Triple Mismatch*) di pasar tenaga kerja Indonesia dari dua sisi: pencari kerja (B2C) yang kesulitan mengidentifikasi peluang relevan dan memahami celah keahlian mereka, serta perusahaan/HRD (B2B) yang kewalahan menyaring volume lamaran tidak relevan.

Sistem mengonversi CV dan lowongan menjadi representasi vektor semantik 768-dimensi menggunakan Gemini Embeddings, lalu mencocokkannya melalui algoritma **Hybrid Ranking** (Semantik 50%, Skill 30%, Lokasi 10%, Gaji 5%, Pengalaman 5%) dengan **Explainable AI Score Breakdown** yang transparan. *Pipeline AI prosedural* berbasis LangGraph menganalisis celah keahlian (*skill gap*) dan merekomendasikan pelatihan terstruktur. HRD menyaring kandidat terbaik dalam hitungan menit dan membayar biaya mikro bersahabat (**Pay-to-Unlock Rp 50.000 / 10 kandidat atau Rp 5.000/kontak**) tanpa beban langganan mahal di muka.

**Status saat ini:** MVP v1.0.0 fungsional penuh — dieksekusi via Docker dengan latensi API <200ms, mencakup infrastruktur CI/CD otomatis, A/B testing, Onboarding Wizard, Kanban Pipeline Employer, dan dual-layer caching.

---

## 4. Progress and Change Log (Maksimal 150 kata)

Sejak 2nd submission, terdapat sepuluh peningkatan signifikan menuju MVP v1.0.0:

1. **Routing & URL Deep Linking** — Migrasi penuh ke `react-router-dom` dengan bridge `NavigationSync`, mendukung *deep linking* dan proteksi rute berbasis peran.
2. **Explainable AI Score Breakdown** — Transparansi 5 komponen skor pencocokan (Semantik 50%, Skill 30%, Lokasi 10%, Gaji 5%, Pengalaman 5%) dengan visual progress bar.
3. **Application Milestone Tracking** — Halaman pelacakan lamaran visual interaktif (*Tersimpan* $\rightarrow$ *Melamar* $\rightarrow$ *Ditinjau* $\rightarrow$ *Interview* $\rightarrow$ *Diterima/Ditolak*).
4. **Job Pack Bulk Uploader** — Ekstraksi banyak posisi sekaligus dari 1 PDF dengan *drag-and-drop*, validasi ukuran <10 MB, dan indikator progres.
5. **Phone OTP Verification** — Endpoint kirim & verifikasi OTP dengan mode demo (tampil di UI) dan arsitektur integrasi WhatsApp Gateway produksi.
6. **Employer Step Timeline** — Alur terstruktur (1. Profil Perusahaan $\rightarrow$ 2. Verifikasi NPWP DJP $\rightarrow$ 3. Pasang Lowongan).
7. **Pay-to-Unlock Backend API** — Endpoint monetisasi mikro (`POST /employer/jobs/{id}/unlock/{seeker_id}`) untuk membuka kontak kandidat.
8. **Token Efficiency Gate & Hallucination Guard** — Menghemat 40% token; mengeliminasi referensi job ID palsu dari output LLM.
9. **Async Embedding & Dual-Tier Cache** — Caching LRU in-process 512 entri + tabel query embedding persisten di PostgreSQL.
10. **Middleware Security Layer** — Rate Limiter sliding-window per IP, Request Sanitizer (10 MB), dan PII redaction sesuai UU PDP No.27/2022.

---

## 5. Validated User Problem and Evidence (Maksimal 250 kata)

**Pengguna Utama:**
- **B2C:** Lulusan baru dan mahasiswa tingkat akhir usia 18–25 tahun dari institusi vokasi (SMK, Politeknik) dan perguruan tinggi D4/S1, yang aktif mencari kerja secara digital namun belum memiliki peta skill yang jelas.
- **B2B:** HRD dari UMKM, startup teknologi, dan perusahaan menengah yang tidak memiliki anggaran untuk lisensi ATS enterprise (Workday, SAP SuccessFactors) namun menghadapi volume lamaran tinggi dan tidak relevan.

**Kapan Masalah Terjadi:**
Di setiap siklus rekrutmen — saat HRD membuka lowongan dan menerima ratusan CV tidak sesuai, serta saat kandidat mengirim lamaran massal tanpa memahami skill gap mereka.

**Penyebab Utama:**
- *Structural Mismatch:* Oversupply pelamar umum vs. undersupply talenta digital spesifik.
- *Relevance Mismatch:* ATS konvensional berbasis keyword gagal memahami kesetaraan semantik ("backend engineer" $\neq$ "software developer" di mata sistem lama; di mata vektor Gemini, keduanya identik).
- *Visibility Gap:* Pencari kerja tidak tahu skill apa yang perlu dikembangkan untuk kompetitif di pasar.

**Dampak:**
- HRD menyaring >80% lamaran di tahap awal secara manual, menyita waktu produktif berhari-hari.
- Kandidat menghabiskan berjam-jam per minggu menelaah JD secara manual tanpa feedback berarti.

**Bukti:**
- BPS 2026: 7,24 juta penganggur terbuka dengan *qualification mismatch* mencapai 35,36% pada pekerja muda.
- Wawancara internal dengan kandidat: kesulitan menemukan lowongan relevan dengan skill aktual.
- Kuesioner HR: >80% pelamar tersaring di tahap awal pada proses rekrutmen yang disurvei.
- Kutipan HR: *"Yang kita butuh itu bukan lebih banyak pelamar. Kita butuh lebih sedikit pelamar, tapi yang beneran cocok."*

---

## 6. End-to-end Use Case and Feature-to-Pain Mapping (Maksimal 300 kata)

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

**Peta Fitur $\rightarrow$ Pain Point:**

| Fitur KerjaCerdas | Pain Point yang Diselesaikan |
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

## 7. Operational Context, Solution Boundary, and Adoption (Maksimal 200 kata)

**Lingkungan Penggunaan:**
Aplikasi web (React 18 + FastAPI), diakses secara publik via browser dengan navigasi `react-router-dom`. Infrastruktur beroperasi **100% Full Online & Cloud-Native (Dedicated Cloud VPS / Google Cloud Run + Cloud-Hosted PostgreSQL pgvector + Cloudflare R2 CDN Storage)** yang aktif 24/7 tanpa ketergantungan pada perangkat komputer lokal.

**Pihak yang Terlibat:**
- **Pencari Kerja:** Upload CV, lihat match & score breakdown, analisis gap, bookmark, lacak status lamaran, verifikasi identitas.
- **HRD/Employer:** Buat profil perusahaan, verifikasi NPWP DJP, upload Job Pack PDF, lihat AI shortlist (teaser method), unlock kontak via Pay-to-Unlock, kelola lowongan.
- **Mitra EdTech (Rencana):** Dicoding, Coursera, Skill Academy — rekomendasi kursus dari skill gap output.

**Yang Dapat Dilakukan (saat ini):**
Semantic matching real-time, explainable score breakdown, skill gap analysis, pelacakan lamaran visual, verifikasi identitas & OTP (mock/demo), natural language AI response, Job Pack bulk uploader, Employer Step Timeline, Pay-to-Unlock backend API, A/B testing, event tracking, rate limiting & sanitasi input.

**Yang Belum Dapat Dilakukan:**
Payment gateway produksi (Midtrans/Xendit live token), E-KYC dengan API pemerintah langsung (Vida/Privy live B2B agreement), fine-tuning dari feedback loop nyata, integrasi ATS enterprise.

**Hambatan Adopsi & Mitigasi:**
- *UMKM literasi digital rendah* $\rightarrow$ Zero Learning Curve: timeline step terpandu (1 $\rightarrow$ 2 $\rightarrow$ 3), Job Pack bulk uploader, dan Pay-to-Unlock Rp 50.000/kandidat.
- *Ketergantungan API Gemini* $\rightarrow$ Graceful degradation: fallback ke anonymous seeker jika embedding gagal; cosine=0 tetap menghasilkan structured ranking.
- *Kepercayaan terhadap AI* $\rightarrow$ Setiap skor disertai Explainable AI Progress Bar 5 komponen dan `explanation` natural language.

---

## 8. Innovation Level (Maksimal 50 kata)

**Level: Functional Prototype — Advanced MVP (v1.0.0)**

Bukti: Platform berjalan end-to-end via Docker; 11 router API aktif; Hybrid Ranking Algorithm tervalidasi dengan 5 komponen skor; LangGraph-assisted response layer berfungsi; middleware keamanan berlapis aktif; 21 lowongan + 20 kandidat Indonesia sebagai demo data real.

---

## 9. Current Technical Reality, Data, and Integration (Maksimal 300 kata)

KerjaCerdas bukan sekadar prototipe konsep — ini adalah platform beroperasi end-to-end yang dapat dijalankan langsung via satu perintah orkestrasi kontainer tunggal. Berikut pemisahan jujur antara apa yang sudah berjalan, apa yang masih disimulasikan, apa yang sedang dikembangkan, dan apa yang masih direncanakan.

**Sudah berfungsi penuh.** Seluruh inti platform berjalan nyata dan tervalidasi:
- Autentikasi JWT dengan kontrol akses berbasis peran (seeker/employer), aktif di 11 router API FastAPI yang terpisah.
- Pipeline CV Parsing: dari dokumen PDF ke vektor 768 dimensi menggunakan Gemini multimodal dan model embedding text-embedding-2 (MRL-truncated dari 3072 dimensi), tersimpan di PostgreSQL dengan ekstensi pgvector berindeks HNSW (ef_construction=64, m=16).
- Hybrid Semantic Matching dua tingkat: ANN prefilter pgvector diikuti structured reranking dengan formula skor yang dapat diaudit.
- Pipeline AI prosedural terhubung ke LangGraph response layer dengan tahap: route_intent, run_matcher, run_skill_gap, dan run_advisor — klasifikasi intent menggunakan Gemini zero-shot JSON dengan fallback regex Bahasa Indonesia.
- Skill Gap Analyzer menghasilkan gap analysis dan rekomendasi kursus dari tiga sumber berlapis: LLM Gemini, database kursus internal, serta katalog 35+ skill dari 12 provider Indonesia.
- Employer Reverse Matching dengan pengelompokan band deterministik (Strong/Possible/Stretch) dan pengacakan berbasis SHA256(job_id) dalam satu band.
- Keamanan berlapis fungsional: Rate Limiter sliding-window per IP, batas ukuran request 10 MB, modul sanitasi teks dengan 10 pola regex prompt-injection guard, HTML escape, serta security headers. Informasi pribadi (email, nomor telepon) di-redact via regex sebelum menyentuh LLM — kepatuhan UU PDP No.27/2022 diterapkan di lapisan preprocessing.

**Masih berupa simulasi/mock.** E-KYC untuk verifikasi identitas (KTP), ijazah, dan NPWP menghasilkan respons valid namun belum terhubung ke Dukcapil, SIVIL, atau DJP asli. Payment gateway sudah memiliki logika Direct Contact Unlock di sisi server, namun transaksi nyata belum aktif.

**Data saat ini.** 21 lowongan dan 20 profil kandidat Indonesia nyata di-seed otomatis saat sistem pertama kali berjalan. Query embedding dicache dua lapis: LRU in-process 512 entry dan tabel query_embeddings PostgreSQL yang persisten lintas restart.

---

## 10. Quantified Value, Business Model, and Financial Projections

**Pihak yang Terlibat & Nilai yang Diterima:**

| Pihak | Nilai yang Diterima | Model Monetisasi |
|---|---|---|
| **Pencari Kerja (B2C)** | Match presisi + peta skill gap + panduan karier personal + verifikasi identitas | Freemium (Gratis) |
| **HRD / UMKM (B2B)** | Shortlist dalam <10 menit vs. 14 hari manual; reduksi beban screening 90% | Freemium (5 free unlock) + Pay-to-Unlock (Rp 50.000 / 10 kontak) |
| **Penyedia Pelatihan / LPK** | Penyaluran langsung ke talenta dengan skill gap terverifikasi | Komisi Afiliasi (10%–15% per referral) |

### 4.2 Struktur Monetisasi & Titik Impas (*Break-Even Point*)

1. **Pay-to-Unlock Mikro:** Rp 50.000 per 10 kontak kandidat terverifikasi (Rp 5.000/kontak) dengan bonus 5 unlock gratis bagi employer baru di awal (Margin kotor: 84% setelah E-KYC pass-through & payment gateway MDR).
2. **KerjaCerdas Pro (SaaS):** Rp 299.000/bulan — kuota unlock lebih besar, analitik rekrutmen lanjutan, prioritas AI shortlist.
3. **Affiliate EdTech:** Komisi 10–15% (rata-rata Rp 48.000 per transaksi kursus) dari pembelian pelatihan terarah.
4. **Enterprise API License:** Lisensi kustom mulai Rp 5.000.000/bulan untuk korporasi dan headhunter.

**Alokasi Budget yang Dibutuhkan (Bulan ke-1 Pilot):**
- Total Kebutuhan Bulan 1: **Rp 3.850.000 / bulan** (Server Cloud VPS: 11.7%, Database & Cache: 2.6%, Kuota API LLM: 13.0%, WhatsApp OTP Gateway: 7.8%, Domain & SSL: 6.5%, Program Validasi Pilot 5 UMKM: 46.7%, Cadangan Kontinjensi: 11.7%). Budget awal yang rasional untuk operasional dan validasi pilot (rentang Rp 2–5 juta/bulan).

**Analisis Titik Impas (BEP):**
- Biaya Operasional Tetap Bulanan (Fixed OPEX Level 1 Full Cloud): **Rp 1.200.000 / bulan**
- Marjin Kontribusi per Pay-to-Unlock: **Rp 45.000**
- **BEP Bulanan:** **27 Transaksi Unlock / Bulan** (senilai **Rp 1.350.000 / bulan**), setara aktivitas rekrutmen 5–7 UMKM aktif.
- Target Pencapaian BEP: **Bulan ke-3 operasional**.

**Proforma Income Statement (Tahun 1 — Target Realistis: 5.000 Seeker & 60 UMKM):**
- **Gross Revenue:** **Rp 50.182.000** (Pay-to-Unlock 800 unlock + 15 SaaS Pro + 100 Referral EdTech)
- **HPP / Variable COGS (E-KYC pass-through & MDR):** (Rp 4.000.000)
- **Gross Profit:** **Rp 46.182.000 (Margin 92.0%)**
- **Total OPEX (Infrastruktur Cloud Level 1 Rp 14,4jt, Pemasaran & Operasional Tim):** (Rp 36.400.000)
- **EBITDA:** **Rp 9.782.000**
- **Laba Bersih (*Net Income* setelah PPh Final UMKM 0.5%):** **Rp 9.531.090 (Net Margin 19.0%)**
- **Metrik Unit Economics:** CAC B2B **Rp 100.000**, LTV B2B **Rp 749.500**, Rasio **LTV:CAC 7.5×**, Payback Period **< 2 Bulan**.

---

## 11. Continuation Readiness & Team Execution

**Target 6–12 Bulan Pasca-Inkubasi:**
- **Q3 2026:** Playwright E2E testing suite lengkap + aktivasi Midtrans sandbox.
- **Q4 2026:** Closed beta 5 employer pilot + integrasi E-KYC resmi B2B.
- **Q1 2027:** Peluncuran publik di 5 provinsi utama Jawa (Target: 50.000 seeker, 600 B2B).
- **Q2 2027:** Ekspansi luar Jawa + rilis Enterprise API Copilot.

**Rujukan Dokumen Spesialisasi:**
- Peta jalan teknis, arsitektur A/B testing, dan mitigasi dependensi: [Technical Roadmap](TECHNICAL_ROADMAP.md)
- Pemodelan finansial mendalam, tabel 3 skenario proforma, dan BEP: [Business Model](BUSINESS_MODEL.md)
- Skrip presentasi demonstrasi langsung beserta 20 akun uji coba: [Demo Guide](DEMO_GUIDE.md)
- Spesifikasi kontrak endpoint API: [API Specification](API_SPEC.md)
