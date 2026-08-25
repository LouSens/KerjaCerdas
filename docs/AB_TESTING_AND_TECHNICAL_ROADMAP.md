# A/B Testing, Technical Roadmap & Budget Requirements

> Dokumen ini menjelaskan fitur-fitur yang sudah ada sebagai kerangka (mock/stub) dalam codebase, apa yang perlu diimplementasikan untuk produksi, dan berapa budget yang diperlukan. Dibuat untuk kepentingan pitching investor, partner, dan perencanaan sprint.

---

## Bagian 1 — A/B Testing: Apa, Mengapa, dan Bagaimana

### 1.1 Apa itu A/B Testing?

A/B Testing (juga disebut split testing) adalah metode eksperimen di mana dua atau lebih varian dari sebuah fitur UI/UX diperlihatkan secara acak ke kelompok pengguna yang berbeda, kemudian hasilnya diukur untuk menentukan mana yang lebih efektif berdasarkan metrik yang relevan (misalnya: konversi, retensi, klik tombol, completion rate).

**Contoh konkret untuk KerjaCerdas:**

| Eksperimen | Variant A (Control) | Variant B | Metrik yang Diukur |
|---|---|---|---|
| `onboarding_flow` | Langsung ke dashboard | Wizard 3 langkah (Welcome → Upload CV → Run Match) | % pengguna yang upload CV dalam 24 jam pertama |
| `match_cta_label` | Tombol "Refresh Match" | Tombol "Temukan Pekerjaan Impian" | CTR (click-through rate) |
| `skill_gap_prompt` | Langsung tampilkan skill gap | Tanya dulu: "Target posisi kamu?" | % pengguna yang klik kursus rekomendasi |
| `pricing_layout` | Tabel harga horizontal | Tabel harga vertikal dengan highlight | Conversion rate ke plan berbayar |

### 1.2 Infrastruktur A/B Testing di KerjaCerdas (Status: Kerangka Tersedia)

**Yang sudah ada di codebase:**

```javascript
// useStore.js
experiments: {},
loadExperiments: async () => {
    const data = await fetchExperimentAssignments() // GET /api/v1/experiments/assignments
    set({ experiments: data || {} })
},
getExperiment: (name) => get().experiments[name] ?? null,
```

**Yang sudah ada di store, namun BELUM dipakai di komponen manapun:**

```javascript
// Contoh cara memakai A/B test yang benar (belum diimplementasikan):
function OnboardingWizard() {
    const { getExperiment } = useStore()
    const variant = getExperiment('onboarding_flow') // 'control' | 'variant_a' | 'variant_b'
    
    if (variant === 'variant_a') return <WizardFlow />  // 3-step onboarding
    return <DirectDashboard />  // langsung ke dashboard (control)
}
```

### 1.3 Apa yang Perlu Dibangun untuk A/B Testing Berfungsi

**Backend (saat ini stub/tidak ada):**

```python
# GET /api/v1/experiments/assignments
# Perlu: database tabel experiments + user_assignments
# Mengembalikan assignment per user berdasarkan user_id hash
{
    "onboarding_flow": "variant_a",
    "match_cta_label": "control",
    "skill_gap_prompt": "variant_b"
}
```

**Implementasi recommended (gratis/murah):**
- **Posthog** (open source, self-hosted gratis): Feature flags + A/B testing + analytics
- **GrowthBook** (open source): A/B testing framework yang bisa self-hosted
- Atau implementasi sederhana sendiri: hash `user_id` mod jumlah variant → deterministik

**Event tracking (sudah ada di codebase):**

```javascript
// api.js — sudah ada, hanya perlu dipakai secara konsisten
export const trackEvent = (eventType, extra = {}) =>
    request(`${API_BASE}/events/track`, { method: 'POST', ... })

// Contoh cara tracking konversi A/B:
trackEvent('cv_uploaded', {
    experiment: 'onboarding_flow',
    variant: getExperiment('onboarding_flow'),
    time_to_upload_seconds: 120
})
```

### 1.4 Sprint Plan untuk A/B Testing Aktif

| Sprint | Task | Estimasi |
|---|---|---|
| Sprint 1 | Setup Posthog/GrowthBook self-hosted | 2 hari |
| Sprint 2 | Buat tabel `experiments` dan `user_assignments` di DB | 1 hari |
| Sprint 3 | Implementasi `/experiments/assignments` endpoint | 1 hari |
| Sprint 4 | Wire `getExperiment()` ke OnboardingWizard, MatchCTA | 2 hari |
| Sprint 5 | Dashboard monitoring A/B test results (Posthog UI) | 0 hari (pakai Posthog) |

---

## Bagian 2 — Infrastruktur: Status & Budget

### 2.1 Database: PostgreSQL + pgvector

**Status saat ini:** PostgreSQL tersedia di Replit (schema `database/init.sql` sudah ada). Lokal development menggunakan fallback JSON store.

**Agar pgvector aktif di semua environment:**

| Environment | Cara Aktivasi | Biaya |
|---|---|---|
| Lokal Dev | `docker-compose up` (db service sudah ada) | Rp 0 |
| Replit | Set `DATABASE_URL` di Replit Secrets | Rp 0 (Replit plan) |
| Production | Neon.tech (serverless Postgres + pgvector) | FREE hingga 500MB |
| Scale | Supabase Pro atau Railway | ~$25/bulan |

**Langkah fix untuk lokal:**
```bash
# docker-compose.yml sudah ada service 'db'
# Hanya perlu menambahkan env DATABASE_URL di .env:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/kerjacerdas

# Dan auto-run alembic di startup:
# backend/Dockerfile: CMD ["sh", "-c", "alembic upgrade head && uvicorn ..."]
```

### 2.2 Redis — Rate Limiting & Caching

**Status:** `redis_url` tersedia di `settings.py`, tapi tidak ada yang menggunakannya. Rate limiting saat ini in-memory (tidak safe untuk multi-worker).

**Untuk testing lokal (gratis):**
```bash
# Tambah ke docker-compose.yml:
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
```

**Untuk production:**

| Provider | Biaya | Catatan |
|---|---|---|
| Redis Cloud Free Tier | Rp 0 | 30MB, cukup untuk demo/beta |
| Upstash (serverless Redis) | $0 free tier / $0.2 per 100K req | Recommended untuk cloud |
| Railway Redis | ~$5/bulan | Simple deployment |

**Budget requirement untuk production Redis:** ~$5–10/bulan

**Implementasi yang dibutuhkan:**
```python
# Replace in-process RateLimiterMiddleware with slowapi + Redis:
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.redis_url)
```

### 2.3 Background Job Queue (Celery/Cloud Tasks)

**Status:** FastAPI `BackgroundTasks` (in-process, tidak aman untuk scale).

**Upgrade path:**

| Option | Biaya | Complexity |
|---|---|---|
| Celery + Redis (self-hosted) | Rp 0 (pakai Redis yang sudah ada) | Medium |
| Google Cloud Tasks | ~$0.0001/task | Low (managed) |
| Railway Worker | ~$5/bulan | Low |

**Budget requirement:** $0–5/bulan tergantung volume

### 2.4 Persistent CV/Document Storage

**Status:** CV di-parse langsung dari memory, tidak disimpan. Tidak ada storage layer.

**Opsi gratis untuk demo/testing:**

| Option | Kapasitas Gratis | Catatan |
|---|---|---|
| Cloudflare R2 | 10GB gratis | S3-compatible API, no egress fee |
| Backblaze B2 | 10GB gratis | $6/TB setelahnya |
| Google Cloud Storage | $0.020/GB/bulan | Bucket di project GCP yang sudah ada |

**Implementasi yang dibutuhkan:**
```python
# backend/app/services/storage.py (perlu dibuat)
import boto3  # atau google.cloud.storage
async def upload_cv(file_bytes: bytes, filename: str) -> str:
    """Upload ke R2/GCS, return public URL atau signed URL."""
    ...

# Setelah upload, simpan URL di SeekerProfile.cv_url
```

**Anggaran yang direkomendasikan:** Cloudflare R2 gratis (10GB) cukup untuk 10.000+ CV

**Catatan dalam README untuk investor:**
> CV storage menggunakan Cloudflare R2 (gratis hingga 10GB). Untuk 100K pengguna (rata-rata CV 200KB), dibutuhkan ~$4/bulan. Enkripsi AES-256 ditambahkan sebagai wrapper di application layer sebelum upload, sesuai UU PDP No.27/2022.

---

## Bagian 3 — Integrasi Partner & Ekosistem

### 3.1 Dicoding API Integration (Prioritas)

**Status:** Kursus rekomendasi saat ini menggunakan Gemini-generated fallback atau catalog mock.

**Realita Dicoding:**
- Dicoding **tidak memiliki public API** saat ini (per 2025)
- Untuk integrasi resmi, perlu menghubungi tim BD Dicoding: **hello@dicoding.com**
- Potensial: Affiliate/referral program (Dicoding sudah memiliki program ini untuk institusi pendidikan)

**Apa yang bisa diimplementasikan sekarang (tanpa partner):**

```javascript
// Katalog kursus Dicoding yang diketahui publik (scraped/hardcoded)
const DICODING_CATALOG = [
    {
        id: 'bfwd', title: 'Belajar Fundamental Front-End Web Development',
        url: 'https://www.dicoding.com/academies/163',
        skills: ['JavaScript', 'HTML', 'CSS', 'React'],
        level: 'Intermediate', duration_hours: 45, is_free: false, price_idr: 450000,
    },
    {
        id: 'bcc', title: 'Belajar Dasar Pemrograman JavaScript',
        url: 'https://www.dicoding.com/academies/256',
        skills: ['JavaScript'],
        level: 'Beginner', duration_hours: 15, is_free: true,
    },
    // ... lebih banyak dari katalog publik
]
```

**Roadmap integrasi resmi:**

| Tahap | Action | Estimasi |
|---|---|---|
| **Sekarang** | Hardcode katalog publik Dicoding (50+ kursus) | Sprint 1 |
| **3 bulan** | Hubungi Dicoding BD untuk affiliate partnership | 1 email |
| **6 bulan** | Negosiasi API access atau data feed | Tergantung Dicoding |
| **12 bulan** | White-label integration atau co-marketing | Revenue share deal |

**Revenue model dari integrasi Dicoding:**
- Affiliate commission: 5–15% dari setiap pembelian kursus yang direferral
- Estimasi: Jika 1000 user/bulan klik kursus dan 5% beli (rata-rata Rp 400K), = Rp 20jt/bulan affiliate revenue

### 3.2 Prakerja API Integration

**Status:** Disebutkan di dokumen tapi tidak diimplementasikan.

**Realita Prakerja:**
- Prakerja memiliki API untuk platform mitra (Tokopedia, Bukalapak, dll.)
- Syarat: Harus terdaftar sebagai **Lembaga Pelatihan Kerja (LPK)** atau **Platform Digital Mitra Prakerja**
- Proses: Daftar di https://vendor.prakerja.go.id dan ikuti seleksi Kemenko Perekonomian
- Timeline pendaftaran: 3–6 bulan

**Yang bisa dilakukan sekarang:**
- Rekomendasi kursus Prakerja berdasarkan platform mitra yang sudah ada (Ruangguru, Skill Academy, dll.)
- Tidak perlu jadi mitra langsung — cukup link ke platform mitra yang ada

### 3.3 Dukcapil E-KYC (KTP Verification)

**Status:** Mock implementation menggunakan `MockIdentityVerificationService`.

**Untuk integrasi nyata:**
- Dukcapil tidak membuka API langsung ke startup
- Jalur resmi: Melalui **BSSN (Badan Siber dan Sandi Negara)** atau agregator seperti:
  - **Vida** (vida.id): E-KYC as a Service, sudah integrasi Dukcapil — ~Rp 5.000–15.000/verifikasi
  - **Privy** (privy.id): Digital identity, ~Rp 3.000–10.000/verifikasi
  - **VerifyID**: ~Rp 2.000–8.000/verifikasi

**Budget requirement:** Rp 3.000–15.000 per pengguna yang verifikasi KTP

**ROI case:** Dengan 1.000 pengguna terverifikasi = Rp 3–15 juta. Offset dengan tingginya kualitas kandidat yang dihasilkan.

### 3.4 SIVIL Dikti (Ijazah Verification)

**Status:** Mock, endpoint tersedia tapi selalu return VERIFIED jika nomor ijazah valid format.

**Untuk integrasi nyata:**
- API SIVIL tersedia melalui: https://sivil.kemdikbud.go.id/
- Akses memerlukan MoU dengan Kemendikbudristek
- Alternatif agregator: Sama dengan E-KYC — Vida, Privy sudah cover SIVIL

### 3.5 Payment Gateway (Midtrans/Xendit)

**Status:** Backend unlock endpoint sudah ada (demo mode), frontend paywall UI belum ada.

**Untuk integrasi:**

| Provider | Setup | MDR | Catatan |
|---|---|---|---|
| **Midtrans** | Gratis (Sandbox) | 1.5–2.9% | Bank transfer, QRIS, VA gratis |
| **Xendit** | Gratis | 1.5–2.9% | QRIS lebih murah |
| **DOKU** | Gratis | 1.5–2.5% | Lokal, mudah daftar |

**Budget requirement:** Rp 0 setup + MDR per transaksi (tidak ada biaya tetap)

**Estimasi revenue dari Pay-to-Unlock:**
- 100 employer aktif × 5 unlock/bulan × Rp 50.000 = **Rp 25 juta/bulan**
- Setelah MDR (2%) = Rp 24.5 juta net

---

## Bagian 4 — Fitur Komunitas & Diferensiasi

### 4.1 Score Explainability (Implementable Sekarang)

Setiap match score memiliki 4 komponen:

```python
final_score = (
    cosine_similarity * 0.50 +   # Relevansi Semantik
    skill_overlap     * 0.30 +   # Irisan Keahlian
    region_boost      * 0.10 +   # Kesesuaian Geografis
    salary_fit        * 0.05 +   # Penyesuaian Anggaran
    experience_fit    * 0.05     # Validasi Masa Kerja
)
```

**Implementasi di frontend (JobDetailModal / SeekerMatchResults):**

```jsx
// Komponen ScoreBreakdown — tampilkan 4 bar chart per match
function ScoreBreakdown({ match }) {
    const components = [
        { label: 'Relevansi Semantik', value: match.cosine_score * 100, weight: '50%', color: KC.orange },
        { label: 'Irisan Skill', value: match.skill_score * 100, weight: '30%', color: KC.cyan },
        { label: 'Lokasi', value: match.region_score * 100, weight: '10%', color: KC.lime },
        { label: 'Budget Fit', value: match.salary_score * 100, weight: '5%', color: KC.yellow },
    ]
    // Render sebagai horizontal progress bars
}
```

**Nilai bisnis:** "Explainable AI" adalah differentiator kuat — kandidat tahu MENGAPA mereka match 87%, bukan hanya angkanya.

### 4.2 Fitur Komunitas Ringan (Phase 2)

**Yang bisa diimplementasikan tanpa backend baru:**

1. **Skill Endorsement** — Seeker bisa request endorsement skill dari koneksi (kolega lama)
   - Backend: Tambah tabel `endorsements(from_user_id, to_seeker_id, skill, message)`
   - Frontend: Button "Minta Endorsement" di profil seeker
   - Nilai: Sosial proof yang terverifikasi tanpa perlu verifikasi dokumen

2. **Hiring Events** (Employer broadcast)
   - Backend: Tambah tabel `events(employer_id, title, date, slots, description)`
   - Frontend: Widget "Event Hiring Mendatang" di Seeker Dashboard
   - Nilai: Engagement loop employer ↔ seeker tanpa biaya iklan

3. **Forum Tanya Jawab** (Lightweight)
   - Backend: Table `forum_posts(author_id, topic, body, role)` + table `replies`
   - Frontend: Forum page dengan tabs (Karier, Skill, Gaji)
   - Nilai: SEO content yang organik, komunitas yang aktif = sticky product

**Estimasi effort:**
- Skill Endorsement: 1 sprint (5 hari)
- Hiring Events: 1 sprint (5 hari)  
- Forum: 2 sprint (10 hari)

---

## Bagian 5 — Budget Summary untuk Operasional Penuh

| Komponen | Sekarang | Demo/Beta | Production Scale |
|---|---|---|---|
| Hosting Backend | Replit (ada) | VPS $10/bulan | Cloud Run $30–50/bulan |
| Database PostgreSQL + pgvector | Replit DB (ada) | Neon Free (500MB) | Neon/Supabase $25/bulan |
| Redis | Tidak ada | Redis Cloud Free | Upstash $5/bulan |
| CV/Doc Storage | Tidak ada | Cloudflare R2 Free (10GB) | R2 $0.015/GB |
| LLM (Gemini API) | Free tier | Gemini Free tier | ~$50–200/bulan |
| E-KYC (Vida/Privy) | Mock | Rp 5K/verifikasi | Rp 3K–5K/verifikasi |
| SMS/WA OTP (Fonnte) | Demo code in response | Rp 200/pesan | Rp 150–200/pesan |
| Payment Gateway (Midtrans) | Mock | Sandbox (free) | MDR 1.5–2.9% |
| Domain + SSL | Tidak ada | ~$12/tahun | $12/tahun |
| **Total Estimasi** | **Rp 0** | **~$25/bulan** | **~$150–300/bulan** |

### Pre-Seed Budget Request

Untuk 6 bulan runway operasional penuh:

| Item | Estimasi 6 Bulan |
|---|---|
| Infrastruktur cloud (hosting + DB + Redis) | $300 |
| LLM API (Gemini/Vertex AI) | $600 |
| E-KYC integration (1000 verifikasi) | Rp 5.000.000 |
| OTP SMS/WA (5000 OTP) | Rp 1.000.000 |
| Domain & SSL | $72 |
| Legal & compliance (UU PDP) | Rp 5.000.000 |
| BD outreach (Dicoding, Prakerja) | Rp 2.000.000 |
| **Total Pre-Seed Technical Budget** | **~Rp 25.000.000** |

---

## Bagian 6 — Prerequisite untuk Operasional Penuh

### Yang Diperlukan SEBELUM Go-Live

1. **Partner E-KYC/SIVIL** — Kontrak dengan Vida atau Privy (B2B agreement)
2. **Payment Gateway** — Registrasi Midtrans/Xendit (butuh akta PT dan NPWP)
3. **Badan Hukum** — Minimal CV atau PT untuk bisa mendaftar payment gateway dan WA Business API
4. **WhatsApp Business API** — Untuk OTP via WA (butuh Facebook Business Verification)
5. **Data Center Indonesia** — Sesuai UU PDP, data sensitif warga negara harus tersimpan di server Indonesia

### Yang Bisa Dilakukan TANPA Bergantung Partner

- [x] AI Job Matching (Gemini sudah terintegrasi)
- [x] Seeker profil + CV upload
- [x] Employer post job + kandidat shortlist
- [x] Skill gap analysis + kursus rekomendasi (catalog hardcoded)
- [x] Verifikasi mock (demo mode) untuk presentasi
- [x] OTP demo (code shown in response, no SMS needed)
- [x] Pay-to-Unlock backend (stub, demo mode)
- [ ] E-KYC real (butuh Vida/Privy partner)
- [ ] SIVIL real (butuh MoU Kemendikbud)
- [ ] Payment real (butuh badan hukum + registrasi gateway)
- [ ] WA OTP real (butuh WA Business API approval)
