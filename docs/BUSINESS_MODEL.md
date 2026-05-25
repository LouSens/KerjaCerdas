# KerjaCerdas — Business Model

> One-pager covering the problem, the stakeholders, the differentiation,
> and how we plan to make money without taxing the people who can't afford it.

## 1. The real-world problem

Indonesia's labor market has three compounding failures:

1. **Volume mismatch** — 7.9 M unemployed (BPS, Feb 2025) while employers
   still complain they "can't find people".
2. **Skill mismatch** — 62% of fresh graduates work outside their field
   (BPS, 2024). Curriculum and market move at different speeds.
3. **Trust mismatch** — CV inflation, fake ijazah, and unverifiable
   experience claims make HR over-rely on "name-brand campus" signals,
   which excludes regional talent.

Existing portals (Jobstreet, LinkedIn-ID, Glints, Kalibrr) solve none of
these well: they're keyword-search engines with paywalls in front of the
*employer* and "premium seeker" upsells behind the *candidate*.

## 2. Stakeholders

| Stakeholder | Pain point | What KerjaCerdas does |
|---|---|---|
| **Pencari Kerja** (fresh-grad, kota lapis-2/3) | Lamaran tidak dibaca; tidak tahu skill apa yang kurang | Semantic match + skill-gap coach + AI advisor — gratis |
| **Employer / HR SME** | Manual screening 200 CV per posting; banyak fake | Job-pack PDF → posting otomatis, top-K kandidat ter-rank, badge "verified" |
| **Penyedia kursus** (Prakerja, Dicoding, Coursera ID) | Sulit ditarget ke yang butuh persis | Course recommendations dipasangkan ke skill gap konkret (affiliate-ready) |
| **Regulator** (Kemnaker, Kemdikbudristek) | Tidak ada visibility ke kualitas matching nasional | Audit log lengkap, KBJI-aligned, e-KYC compliant |

## 3. Differentiation vs incumbents

| Dimensi | Jobstreet / LinkedIn / Glints | **KerjaCerdas** |
|---|---|---|
| Matching | Keyword + filter | Embedding semantik (Gemini text-embedding-004) + rerank |
| Skill gap | Tidak ada / generic | Spesifik per lowongan, dengan jalur kursus |
| Verifikasi | Tidak / opsional | e-KYC Dukcapil + SIVIL Dikti, terintegrasi |
| Bahasa | Terjemahan | Bahasa Indonesia kelas satu, KBJI/KKNI-aware |
| Pricing seeker | Premium upsell | **Selalu gratis** |
| Audit AI | Tertutup | Log per-call terbuka untuk admin + regulator |

## 4. Revenue model

### Phase 1 (now → 6 bulan)

- **Pay-per-post (Employer Standard)** — Rp 499rb / lowongan / 30 hari.
  Unlimited semantic match, top-10 kandidat, funnel analytics. Target SME
  yang biasanya tidak bisa membayar Jobstreet Rp 3-5 juta/post.
- **Pencari Pro** — Rp 49rb / bulan. Unlimited CV parsing, mock interview
  AI mingguan, prioritas dalam shortlist (5-10% kandidat pasar premium).
- **Affiliate kursus** — komisi 8-15% dari Dicoding/Coursera ID untuk
  setiap "skill-gap → enrollment". Konsisten dengan misi: kami benar-benar
  ingin user upskill.

### Phase 2 (6–18 bulan, perlu modul billing)

- **Employer Enterprise** — Rp 25 juta / bulan flat: ATS integration,
  dedicated CSM, SLA 99.9%, white-label dashboard.
- **Verified Talent Pool** — Rp 1 juta / kandidat untuk akses kandidat
  yang sudah e-KYC + SIVIL + skill-tested.
- **Government / NGO licensing** — Kemnaker, Disnaker provinsi, BLK:
  per-seat license untuk dashboard analitik regional.

### Unit economics (estimasi konservatif)

- CAC employer SME: Rp 300rb (content + sales pipeline).
- LTV employer SME (12 bulan, 1.4 posting/bulan rata-rata): Rp 8.4 juta.
- LTV/CAC ≈ 28× — viable bahkan dengan churn 40%/tahun.
- Margin kotor: 78% (biaya utama: token Gemini ~Rp 30/seeker/month).

## 5. Path to sustainability

| Milestone | Target | Sinyal sehat |
|---|---|---|
| Month 3  | 10 employer SME pilot | NPS > 40, ≥ 3 posting/employer |
| Month 6  | 100 employer + 5k seeker | MRR Rp 50 jt, churn < 8%/bulan |
| Month 12 | 500 employer, 50k seeker, 2 govt pilot | MRR Rp 250 jt, gross margin > 70% |
| Month 18 | Break-even | LTV/CAC > 4×, server cost < 12% revenue |

## 6. Why now

- Gemini API harga turun ~70% dari 2024 — embedding mass-scale ekonomis.
- Kemnaker Satu Data tahap 2 (2025-2026) butuh API partner pasar kerja.
- Prakerja angkatan 4 mencari channel untuk distribusi kursus skill-gap.
- LinkedIn-ID secara aktif mengurangi free reach — momentum migrasi
  kandidat ke alternatif lokal yang lebih relevan.

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Token cost spike (Gemini) | Cache embedding per dokumen (refresh kalau profil berubah), batch query. |
| Hallucination → bad advice | Guardrails MD + per-call admin review queue + thumbs feedback. |
| Privacy backlash (NIK) | Server-side mask di payload, PII redaction policy di prompts/. |
| Incumbent banting harga | Posisikan sebagai "verified + semantic" — moat di trust, bukan harga. |
| Adoption SME lambat | Bundling dengan akun BPJS Ketenagakerjaan / Disnaker. |
