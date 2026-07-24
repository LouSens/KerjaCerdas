# Identity Verification (e-KYC / SIVIL / NPWP)

Files:
- `backend/app/api/routers/verify.py` — endpoints (auth required)
- `backend/app/api/services/identity_verifier.py` — `MockIdentityVerificationService`

> **Status: mock.** The service simulates the government integrations the product design targets (Dukcapil e-KYC, SIVIL diploma registry, DJP NPWP). Swapping in real APIs means replacing one service class; router contracts stay stable.

## Endpoints

| Endpoint | Verifies | Input rules |
|---|---|---|
| `POST /api/v1/verify/identity` | NIK + full name (e-KYC vs Dukcapil) | NIK must be 16 digits |
| `POST /api/v1/verify/education` | Diploma number (SIVIL — Kemdikbud registry) | diploma/certificate number |
| `POST /api/v1/verify/npwp` | Employer tax ID | 15 numeric digits |

## Mock Semantics (demo-friendly determinism)

- NIKs starting with **"99"** → verification **fails** (lets you demo the rejection path on stage without real data).
- Everything else → passes with a **98.5% match score**.
- Output includes a deterministic **SHA-256 `verification_hash`** over the submitted identity — the stored proof-of-verification without storing the raw NIK itself.

## Data-Protection Posture

- Responses return **masked file ids** (`doc_3f8a…`) instead of raw document references.
- PII redaction & handling framed for **UU PDP 2022** (Indonesia's data-protection law) compliance: raw identity numbers are used transiently for the check, the hash is what persists.
- Verified status surfaces publicly as a boolean only — e.g., job listings carry `verified: true` from the employer's verification state (see `06-jobs-employer-features.md`), never the underlying data.

## Trust Model

Verification feeds the marketplace's trust signals:

```
Employer verifies NPWP ──▶ employer.verified = true ──▶ "verified" badge on all their listings
Seeker verifies NIK    ──▶ seeker credibility signal for employers
Seeker verifies degree ──▶ education claims backed by SIVIL check
```

The badge is the product feature; the verification service is deliberately an implementation detail behind it.
