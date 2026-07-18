# Product Features: KerjaCerdas

Dokumen ini menjelaskan fitur utama dari platform KerjaCerdas, sebagaimana yang siap didemonstrasikan.

---

## 1. AI Job Matching (Pencocokan Pekerjaan AI)

Fitur ini mengubah cara kandidat mencari pekerjaan dengan menggantikan sistem pencarian *keyword* manual (seperti mengetik "Python Backend Developer") menjadi pencocokan semantik otomatis. Saat kandidat mengunggah CV PDF, model AI Gemini bertugas membaca dan mengekstrak keahlian, pengalaman, serta pendidikan kandidat secara *real-time*, lalu mengubahnya menjadi "Vektor Semantik" berdimensi tinggi.

Vektor ini kemudian dicocokkan dengan seluruh vektor lowongan pekerjaan yang ada di database PostgreSQL menggunakan algoritma **Hybrid Ranking**:

```python
final_score = (
    cosine_similarity * 0.50 +   # Relevansi Semantik (Vektor Gemini)
    skill_overlap     * 0.30 +   # Irisan Keahlian Eksplisit
    region_boost      * 0.10 +   # Kesesuaian Geografis
    salary_fit        * 0.05 +   # Penyesuaian Anggaran
    experience_fit    * 0.05     # Validasi Masa Kerja
)
```

Hasilnya, kandidat langsung mendapatkan rekomendasi pekerjaan dengan persentase skor kecocokan yang sangat akurat, karena sistem memahami konteks keahlian pelamar—bukan sekadar kemiripan kata.

**Komponen terkait:** `CVUploader`, `SeekerDashboard`, `SeekerMatchResults`, `FloatingAdvisor`
**API:** `POST /api/v1/uploads/cv`, `POST /api/v1/agent/invoke`

---

## 2. Proactive Skill Gap Analyzer (Analisis Celah Keahlian Proaktif)

Sistem tidak hanya menolak kandidat jika kemampuannya kurang sesuai, tetapi secara proaktif memberi tahu apa kelemahan mereka. Melalui arsitektur *Multi-Agent Swarm* (agen AI otonom dari LangGraph), sistem akan menganalisis kesenjangan (*gap*) antara spesifikasi lowongan yang dilamar dan keahlian yang tercantum di CV kandidat.

Jika kandidat memiliki skor kecocokan rendah (misalnya kurang menguasai "AWS" atau "Google Analytics"), agen AI akan merinci kelemahan tersebut secara interaktif dan langsung memberikan rekomendasi program *upskilling* spesifik — seperti pelatihan dari Prakerja atau platform Ed-Tech — agar kandidat bisa meningkatkan keahliannya sebelum mencoba melamar kembali.

**Komponen terkait:** `SkillGapPanel`, `FloatingAdvisor`
**API:** `POST /api/v1/agent/invoke` (dengan `explicit_intent: "skill_gap"`)

---

## 3. Employer Dashboard & Direct Contact Unlock (Dasbor Perusahaan & Buka Kontak)

Modul ini dirancang untuk menyelesaikan masalah kelelahan administratif (*screening fatigue*) bagi HRD serta menawarkan model monetisasi yang bersahabat bagi UMKM. Saat HRD mengetik rancangan lowongan baru, AI memprediksi ketersediaan jumlah talenta yang cocok secara *real-time* dari *Live Pool* sebelum lowongan diterbitkan.

Setelah lowongan tayang, agen AI sudah menyortir ratusan pelamar ke dalam daftar pendek (*Shortlist*) Top-5 Kandidat Terbaik lengkap dengan ringkasan alasan kecocokannya. Fitur **Kanban Pipeline** memungkinkan HRD memindahkan status kandidat (*Review*, *Wawancara*, *Hire*) dengan antarmuka yang sangat ramah pengguna. Alih-alih mengharuskan HRD atau UMKM membayar biaya berlangganan mahal di muka, platform ini menggunakan sistem transaksi mikro (**Pay-to-Unlock**): profil asli dan skor kandidat disajikan secara transparan, namun akses email/telepon disensor. Perusahaan hanya perlu membayar biaya mikro (misal Rp 50.000) pada saat mereka memutuskan untuk menghubungi kandidat unggulan tersebut.

**Komponen terkait:** `EmployerDashboard`, `EmployerCandidates`, `EmployerPostJob`, `PricingPage`
**API:** `POST /api/v1/employer/jobs`, `GET /api/v1/employer/jobs/{id}/candidates`, `POST /api/v1/employer/jobs/{id}/unlock/{seeker_id}`

---

## 4. E-KYC Identity & Credential Verification (Verifikasi Identitas & Ijazah)

Platform ini menyelesaikan krisis kepercayaan (*Trust Crisis*) yang menjangkiti pasar tenaga kerja digital. Kandidat dapat memverifikasi tiga jenis dokumen:

| Dokumen | Integrasi Mock | Field |
|---|---|---|
| **KTP / NIK** | Dukcapil E-KYC | NIK (16 digit), Nama Lengkap, Selfie |
| **Ijazah** | SIVIL Kemdikbud | Nomor Ijazah, Universitas, Jurusan |
| **NPWP** | DJP Online | NPWP (15 digit), Nama Perusahaan |

Setelah verifikasi berhasil, profil kandidat mendapatkan **lencana terverifikasi** yang terlihat oleh semua HRD. Seluruh data sensitif disimpan dengan enkripsi **AES-256-GCM** dan proses *redaksi PII* otomatis, memenuhi standar **UU PDP No.27/2022** dan **ISO-27001**. Dalam mode demo, semua endpoint menggunakan layanan mock yang mensimulasikan respons nyata dari API pemerintah.

**Komponen terkait:** `VerificationDashboard`
**API:** `POST /api/v1/verify/identity`, `POST /api/v1/verify/education`, `POST /api/v1/verify/npwp`, `GET /api/v1/verify/documents`

---

## 5. Data-Driven UX & Closed-Loop Analytics (A/B Testing & Event Tracking)

Sistem ini didesain tidak hanya untuk fungsionalitas, tetapi juga untuk optimalisasi konversi dan pengalaman pengguna menggunakan metrik nyata. Platform dilengkapi dengan:
- **Onboarding Wizard**: Alur interaktif ramah pengguna bagi kandidat baru (Welcome ➔ Upload CV ➔ Jalankan Match) yang didorong oleh *Stateless Feature Flagging* (A/B Testing) guna mengukur tingkat retensi.
- **Event Tracking Terintegrasi**: Setiap aksi kritis (seperti melihat lowongan, mengubah profil, melamar) dicatat secara *closed-loop* ke dalam basis data analitik. Data ini akan membentuk *moat* organik untuk melatih ulang AI (*fine-tuning*) berdasarkan *historical hires*, menjadikan algoritma pencocokan semakin presisi tanpa bantuan manual.
- **Progressive UI & Error Handling**: *Skeleton loader* transisional yang mensimulasikan langkah AI (misal: "Menganalisis skill gap..."), serta penanganan kesalahan dengan sistem Notifikasi Global (Toast) untuk sesi *Auth*, mencegah kebingungan teknis pada pengguna non-IT.

**Komponen terkait:** `OnboardingWizard`, `useStore` (Zustand), `api.js` (Interceptors)
**API:** `GET /api/v1/experiments/assignments`, `POST /api/v1/events/track`
