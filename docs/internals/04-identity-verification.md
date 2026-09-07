# Identity Verification (e-KYC / SIVIL / NPWP)

Files:
- `backend/app/api/routers/verify.py` — endpoints (auth required)
- `backend/app/api/services/identity_verifier.py` — `MockIdentityVerificationService` (used by `/identity` only)
- `backend/app/db/models.py` — `OTPRecord` (database-backed phone OTP)

> **Status: mock / demo mode.** All four surfaces below (e-KYC, education, NPWP, phone OTP) simulate the real integrations the product design targets (Dukcapil e-KYC, SIVIL diploma registry, DJP NPWP, an SMS/WhatsApp provider). None of them call an external verification or SMS provider today.

## Endpoints

| Endpoint | Verifies | Check logic | Input rules |
|---|---|---|---|
| `POST /api/v1/verify/identity` | NIK + full name (e-KYC vs Dukcapil) | `MockIdentityVerificationService.verify_identity` | NIK must be exactly 16 digits |
| `POST /api/v1/verify/education` | Diploma number (SIVIL — Kemdikbud registry) | inline `_looks_like_placeholder()` check — **not** `MockIdentityVerificationService` | ≥6 chars, rejects obviously-fake values (`"000000"`, `"test"`, all-same-character, …) |
| `POST /api/v1/verify/npwp` | Employer tax ID | inline digit/length check — **not** `MockIdentityVerificationService` | 15 numeric digits after stripping `.`/`-`, not all zeros |
| `POST /api/v1/verify/otp/send` | Phone number ownership (step 1) | generates + DB-persists a 6-digit code | E.164 format (`+62...`); gated by `settings.otp_demo_enabled` |
| `POST /api/v1/verify/otp/verify` | Phone number ownership (step 2) | compares hash against the DB record | 5 attempts max, 5-minute TTL |

Only `/identity` goes through `MockIdentityVerificationService`; `/education` and `/npwp` are separate, simpler ad-hoc format checks in `verify.py` itself — there is no shared "mock verification" abstraction across all three.

## Mock Semantics (demo-friendly determinism)

- NIKs starting with **"99"** → verification **fails** (lets you demo the rejection path on stage without real data).
- Everything else (any 16-digit string) → passes with a **98.5% match score**. `full_name` is accepted into the request and folded into `verification_hash`, but it is never checked against anything — the mock cannot confirm the NIK belongs to the submitting seeker.
- Output includes a deterministic **SHA-256 `verification_hash`** over the submitted identity — the stored proof-of-verification without storing the raw NIK itself.
- **A passing NIK or education check persists `nik_verified` / `ijazah_verified` as `"pending"`, never `"verified"`.** Because the check has no real evidentiary basis (previous point), it has no authority to grant a "verified" status — `"verified"` is reserved for a real Dukcapil/SIVIL integration this build doesn't have. `PENDING` is still durable (survives a reload or a login from another browser/device) — durability and authority are independent properties.
- **NPWP is the exception: a passing check returns `status: "VERIFIED"` directly, and it is not persisted anywhere.** `/verify/npwp` never writes to the `employers` table — there is no `update_employer_verification_status`-equivalent call in the codebase (`postgres_store.py` only has `update_seeker_verification_status`, for the NIK/education pair above). The employer's `verified` field (read by `jobs.py`'s `_is_employer_verified()` to decide the "verified" badge) defaults to `UNVERIFIED` and nothing in this codebase ever flips it to `VERIFIED`. See the Trust Model section below.
- **The frontend keeps the NIK/education distinction, not just the database.** `ktp_verified`/`ijazah_verified` (Trust Score, checklist checkmarks, the "Selesai ✓" treatment) are true only for a genuine `verified` status; `ktp_pending`/`ijazah_pending` render their own distinct amber "Menunggu ⏳ — menunggu verifikasi resmi" state in `VerificationDashboard.jsx`. A pending submission does not raise the Trust Score — only a real verification would.

## Phone OTP (`/verify/otp/send`, `/verify/otp/verify`)

Unlike the three checks above, OTP is **database-backed**, not a stateless mock:

- `POST /otp/send` generates a random 6-digit code, hashes it (SHA-256) and stores it in the `otps` table (`OTPRecord`: `user_id`, `phone`, `code_hash`, `expires_at`, `attempts`, `verified`) with a 5-minute TTL, after deleting any prior unverified OTP for that `(user_id, phone)`. It is gated behind `settings.otp_demo_enabled` (on outside production; off in production unless `OTP_DEMO_MODE` is explicitly set) and fails closed with HTTP 503 when disabled.
- **There is no SMS/WhatsApp provider wired in**, so the only delivery channel is the response body itself — the endpoint returns `demo_code` in plaintext JSON. This is a deliberate demo affordance, not an oversight: whoever can call the endpoint for a phone number also learns that phone's code, so passing OTP verification proves nothing about who controls the number in this build.
- `POST /otp/verify` compares a SHA-256 hash of the submitted code against the stored `code_hash`, enforces a 5-attempt cap and the TTL (expired/over-attempts records are deleted with a 410/429), and sets `verified=True` on success. It does not, on its own, flip `nik_verified`/any Trust Score field — it is a standalone phone-ownership check.
- Both endpoints sit behind their own rate limits (5 req/60s for `send`, 10 req/60s for `verify` — see `02-authentication.md`) on top of the per-record attempt counter.

## Data-Protection Posture

- Responses return **masked file ids** (`doc_3f8a…`) instead of raw document references.
- PII redaction & handling framed for **UU PDP 2022** (Indonesia's data-protection law) compliance: raw identity numbers are used transiently for the check, the hash is what persists.
- Verified status surfaces publicly as a boolean only — e.g., job listings carry `verified: true` from the employer's verification state (see `06-jobs-employer-features.md`), never the underlying data.

## Trust Model — Built vs. Planned

```
Employer submits NPWP  ──▶ /verify/npwp returns status: "VERIFIED" in the response  [BUILT, DEMO MODE]
Employer submits NPWP  ──▶ employer.verified = VERIFIED persisted to the DB          [PLANNED — not wired]
employer.verified       ──▶ "verified" badge on that employer's job listings         [BUILT] (reads a field
                                                                                        nothing sets to VERIFIED)
Seeker verifies NIK    ──▶ self-facing "Trust Score" completion on VerificationDashboard          [BUILT]
Seeker verifies NIK    ──▶ candidate ranking/curation boost visible to employers                  [PLANNED]
```

**The NPWP → "verified" badge chain is not actually wired end to end.** `jobs.py`'s
`_is_employer_verified()` correctly reads `employer.verified` and gates the badge on it — that
part is real code. But `POST /verify/npwp` only returns `"status": "VERIFIED"` in its JSON
response; it never writes to the `employers` table (there is no
`update_employer_verification_status` or equivalent anywhere in `postgres_store.py`, unlike the
seeker-side `update_seeker_verification_status`). `Employer.verified` defaults to
`VerificationStatus.UNVERIFIED` in `db/schemas.py` and nothing in this codebase — no route, no
seed script — ever flips it. So today, no employer's job listings can actually show `verified:
true` through this flow; the badge mechanism exists but is currently unreachable. Treat this as a
small, scoped gap (persist the NPWP result to `employer.verified`) rather than a working feature.

Separately, the frontend's own copy ("prioritas kurasi hingga 3× lipat" — up to 3× curation
priority for a verified profile, shown in `SeekerDashboard.jsx` and `VerificationDashboard.jsx`)
promises the seeker-side ranking-boost row above, but nothing in `matcher.py` or `employer.py`
currently reads `nik_verified` / `ijazah_verified` when ranking or shortlisting candidates —
verification today only affects what the seeker sees about themselves, not what an employer sees
about them. Wiring that promise up is a real, scoped piece of future work, not something to claim
as already built.
