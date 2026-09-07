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
- Everything else (any 16-digit string) → passes with a **98.5% match score**. `full_name` is accepted into the request and folded into `verification_hash`, but it is never checked against anything — the mock cannot confirm the NIK belongs to the submitting seeker.
- Output includes a deterministic **SHA-256 `verification_hash`** over the submitted identity — the stored proof-of-verification without storing the raw NIK itself.
- **A passing check persists `nik_verified` / `ijazah_verified` as `"pending"`, never `"verified"`.** Because the check has no real evidentiary basis (previous point), it has no authority to grant a "verified" status — `"verified"` is reserved for a real Dukcapil/SIVIL integration this build doesn't have. `PENDING` is still durable (survives a reload or a login from another browser/device) — durability and authority are independent properties.

## Data-Protection Posture

- Responses return **masked file ids** (`doc_3f8a…`) instead of raw document references.
- PII redaction & handling framed for **UU PDP 2022** (Indonesia's data-protection law) compliance: raw identity numbers are used transiently for the check, the hash is what persists.
- Verified status surfaces publicly as a boolean only — e.g., job listings carry `verified: true` from the employer's verification state (see `06-jobs-employer-features.md`), never the underlying data.

## Trust Model — Built vs. Planned

```
Employer verifies NPWP ──▶ employer.verified = true ──▶ "verified" badge on all their listings   [BUILT]
Seeker verifies NIK    ──▶ self-facing "Trust Score" completion on VerificationDashboard          [BUILT]
Seeker verifies NIK    ──▶ candidate ranking/curation boost visible to employers                  [PLANNED]
```

The frontend's own copy ("prioritas kurasi hingga 3× lipat" — up to 3× curation priority for a
verified profile, shown in `SeekerDashboard.jsx` and `VerificationDashboard.jsx`) promises the
third row above, but nothing in `matcher.py` or `employer.py` currently reads `nik_verified` /
`ijazah_verified` when ranking or shortlisting candidates — verification today only affects what
the seeker sees about themselves, not what an employer sees about them. Wiring that promise up is
a real, scoped piece of future work, not something to claim as already built.
