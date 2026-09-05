# Product Overview

## Problem

Conventional recruitment channels — keyword-based job portals, manual forms, spreadsheets — fail to capture semantic equivalence between job terms ("backend engineer" vs. "software developer" read as unrelated to a keyword matcher) and give job seekers no concrete direction on what to improve. On the employer side, small and mid-sized companies without an enterprise ATS budget have to screen recruiting volume by hand.

Three root causes drive this:
1. **Relevance mismatch** — keyword search treats semantically equivalent job terms as unrelated.
2. **Visibility gap** — candidates don't know which specific skills are keeping them out of a role.
3. **Screening fatigue** — HR teams without an ATS filter applications manually, one at a time.

National context: Indonesia's official open unemployment rate (TPT) was 4.65% as of May 2026, with average worker pay at Rp 3.39 million ([BPS, released 5 August 2026](https://www.bps.go.id/id/pressrelease/2026/08/05/2606/tingkat-pengangguran-terbuka--tpt--sebesar-4-65-persen---rata-rata-upah-buruh-sebesar-3-39-juta-rupiah-.html)).

## Users

- **Job seekers (B2C):** fresh graduates and recent vocational/university graduates (SMK, Politeknik, D3/S1), typically 18–25, who struggle to identify relevant openings and their own skill gaps.
- **Employers (B2B):** HR teams at SMEs, startups, and mid-sized companies without budget for enterprise ATS licenses, dealing with a high volume of irrelevant applications.
- **Potential partners:** ed-tech course providers, for referral-based skill-gap recommendations (no affiliate contracts in place yet — this is a roadmap item, not a current integration).

## Core Use Case

```
Candidate doesn't know which openings fit them
  → Upload CV (PDF)
  → Gemini extracts skills/experience/education → 768-dim embedding → pgvector HNSW search
     → Hybrid ranking (cosine 45% + skill overlap 25% + experience 15% + education 10% + recency 5%)
  → Result: banded job list (Strong/Possible/Stretch) with a per-factor score breakdown
  → Outcome: candidate picks a job with a reason, not a guess
```

For a target job that isn't a full match, the flow continues into the **Skill Gap Analyzer**: the skill gap is computed deterministically, then Gemini narrates a learning plan and recommends courses from a curated internal catalogue.

On the employer side: **company profile → NPWP verification (demo mode) → post a job or bulk-upload a Job Pack PDF → the system reverse-matches available candidates → banded, confidence-scored shortlist.**

See [Architecture](ARCHITECTURE.md) for the full system diagram, and [Sequence Diagrams](SEQUENCE_DIAGRAMS.md) for the request-level flows.

## Differentiation

| Dimension | Conventional job portal (keyword) | Manual/spreadsheet process | KerjaCerdas |
|---|---|---|---|
| Matching | Exact/keyword match | Manual, subjective | Semantic embedding + 5-factor hybrid ranking |
| Score transparency | None | None | Explainable AI breakdown per factor |
| Skill direction | None | None | Skill Gap Analyzer with targeted course recommendations |
| Employer cost | Expensive upfront ATS subscription, or free with no AI | High manual screening time | Pay-to-Unlock micro-transactions (payment gateway not yet connected — see [Architecture](ARCHITECTURE.md)) |

## Current Scope

**Works today:** semantic matching, explainable score breakdown, skill-gap analysis, application tracking, employer job posting and bulk import, candidate sourcing with tenant-ownership guards, A/B assignment and event logging, natural-language AI responses.

**Demo mode:** identity/OTP verification (format checks only, no live Dukcapil/SIVIL/DJP integration), Pay-to-Unlock (accepts any token, no live payment gateway).

**Not yet built:** production payment gateway (Midtrans/Xendit), government e-KYC integration, a fine-tuning feedback loop from real usage, enterprise ATS integrations.

## Business Model

See [Business Model](BUSINESS_MODEL.md) for the full monetization structure, cost breakdown, and financial projections. In short: freemium for job seekers, Pay-to-Unlock micro-transactions and a Pro subscription for employers, and affiliate commission on ed-tech course referrals.

## Adoption Path

A narrow pilot — one job family, a handful of SME employers, roughly a hundred seekers, one verified course catalogue — before wider rollout. Production payment processing and official e-KYC integration are dependencies for scaling past the pilot; see [Roadmap](ROADMAP.md).

## Team

| Member | Role | Focus |
|---|---|---|
| David Kurniawan | Project Lead & AI Engineer | System architecture, semantic matching engine, LangGraph pipeline, pgvector, end-to-end reliability |
| Darren Cornelius Suwandi | Product Manager, UI/UX, Research | Product vision, UX design, problem validation, market research |
| Vanessa Serenina Prawirayasa | System Analyst & Impact Strategist | Backend-to-product flow architecture, KPI and impact metric design |
| Jason Clarence Setya Budhi | Business/Market Strategist, Backend & Integration | Monetization, go-to-market, API integration, cloud deployment |
