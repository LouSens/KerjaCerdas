# KerjaCerdas API Specification

> **Schema-first contract** — Every endpoint here corresponds 1-to-1 with a FastAPI router module.
> Interactive Swagger UI is available at `http://localhost:8000/docs` when the server is running.

API KerjaCerdas menggunakan endpoint asinkron (FastAPI + SQLAlchemy async) dan indeks vektor HNSW pada `pgvector`, yang secara desain menghindari full-table scan pada pencarian kesamaan vektor. Target latensi <200ms adalah target desain arsitektur; belum ada hasil load test produksi yang tersimpan di repositori ini untuk memvalidasi angka tersebut pada skala nyata.

## Base URL

```
Development: http://localhost:8000
Production:  https://api.kerjacerdas.id
```

## Authentication

All protected endpoints require a Bearer token obtained from `/api/v1/auth/login` or `/api/v1/auth/register`.

```
Authorization: Bearer <access_token>
```

---

## Middleware Stack

Requests traverse the following layers **in order** before reaching any router:

| Layer | Class / Handler | Policy |
|---|---|---|
| **1. Request Logging** | `log_requests` | Generates `X-Request-ID` and logs method, path, status, latency ms |
| **2. Security Headers** | `security_headers` | Attaches `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy` |
| **3. CORS** | `CORSMiddleware` | Explicit allowlist only (`settings.cors_allow_origins`: localhost:3000/3001/5173 by default) plus this Replit workspace's own named origins (`REPLIT_DEV_DOMAIN`/`REPLIT_DOMAINS`). No wildcard/regex — a broad `*.replit.dev` regex was deliberately removed (see `backend/app/api/main.py::_replit_origins`) because combined with `allow_credentials=True` it would trust any Replit account's subdomain |
| **4. Rate Limiter** | `RateLimiterMiddleware` | Sliding window per (IP, route bucket) — auth login/register: 10 req/60s · agent invoke: 20 req/60s · uploads (cv, job-pack): 10 req/60s each · OTP send: 5 req/60s · OTP verify: 10 req/60s · verify/identity: 10 req/60s · seeker/skill-gap: 20 req/60s · employer/jobs (incl. `/candidates`, `/estimate`): 30 req/60s · everything else: 300 req/60s shared per IP. Memory bounded at 10,000 (ip, bucket) keys with LRU eviction |
| **5. Request Size Guard** | `RequestSizeMiddleware` | Rejects payloads exceeding 10 MB (`MAX_BODY_BYTES`) via `Content-Length` before parsing. Exempts any `/uploads/*` path (those endpoints stream the file directly and enforce their own 10 MB cap after reading the body) |

All responses carry `X-Request-ID` for distributed tracing.

---

## Error Handling

All errors return a uniform envelope:

```json
{
  "detail": "Human-readable error message",
  "status_code": 400
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Bad request / business rule violation (e.g. duplicate email) |
| `401` | Missing or invalid JWT |
| `403` | Valid JWT but wrong role (seeker vs employer) |
| `404` | Resource not found |
| `422` | Pydantic validation error or sanitization rejection |
| `429` | Rate limit exceeded — `Retry-After: N` header included |

---

## Endpoints

### `GET /health`

System liveness check.

```json
{
  "status": "healthy",
  "service": "KerjaCerdas API",
  "version": "1.0.0",
  "mode": "demo"
}
```

---

## Analytics & A/B Testing Router — `/api/v1/experiments` & `/api/v1/events`

Both endpoints accept an **optional** Bearer token (`get_current_user_optional`) — anonymous callers are bucketed under the literal user id `"anonymous"` (experiments) or `null` `user_id` (events) rather than being rejected. Neither takes a `session_id` query/body param for identity; `events/track` accepts `session_id` as a free-text body field only.

### `GET /api/v1/experiments/assignments`

Returns the full variant-assignment map for every registered experiment for the current user (or `"anonymous"`). Assignment is deterministic — `MD5(user_id:experiment_name)` bucketed against each experiment's traffic allocation — so no query parameters are accepted.

**Response `200`:**
```json
{
  "onboarding_flow": "cv_first",
  "band_legend_default": "collapsed",
  "stretch_band_copy": "challenge_framing",
  "unlock_cta_copy": "buka_kontak",
  "profile_completeness_nudge": "progress_bar"
}
```
(Live experiment registry, `EXPERIMENTS` in `backend/app/api/routers/experiments.py`. Values above are the current five experiments and one possible variant each — actual variant per user depends on the MD5 hash.)

### `GET /api/v1/experiments/list`

Returns the experiment definitions (variants, allocation, description) for admin/debug tooling. No auth required.

### `POST /api/v1/events/track`

Records a fire-and-forget analytics event. Always returns `202` even if the DB write fails (failure is logged, never surfaced to the caller).

**Request Body (`TrackEventRequest`):**
```json
{
  "event_type": "job_viewed",
  "job_id": "xxx-yyy-zzz",
  "band": "strong",
  "ab_variant": "cv_first",
  "session_id": "ab123",
  "payload": { "extra": "context" }
}
```
All fields except `event_type` are optional.

**Response `202`:**
```json
{ "ok": true, "event_type": "job_viewed" }
```

---

## Auth Router — `/api/v1/auth`

Rate limited: **10 req / 60 s per IP**.

### `POST /api/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "budi@example.com",
  "password": "SecurePass1",
  "name": "Budi Santoso",
  "role": "seeker"
}
```

> `role` must be `"seeker"` or `"employer"`. `password` must be 8-128 chars with at least one uppercase letter and one digit (`UserRegisterRequest.password_strength`). `name` is 2-100 chars and passes through the shared sanitizer (`SanitizedStr`).

**Response `201`:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "role": "seeker"
  }
}
```

**Errors:** `400` email already exists · `422` validation failure · `429` rate limited.

---

### `POST /api/v1/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "budi@example.com",
  "password": "SecurePass1"
}
```

**Response `200`:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "role": "seeker"
  }
}
```

**Errors:** `401` invalid credentials · `400` account inactive · `429` rate limited.

---

## Jobs Router — `/api/v1/jobs`

Public — no auth required.

### `GET /api/v1/jobs`

Return paginated, optionally filtered job listings.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 20 | Max items to return (1-100) |
| `offset` | int | 0 | Pagination offset |
| `region` | string | — | Exact BPS region code match (`j.region_code == region`) |
| `q` | string | — | Case-insensitive substring search on title & description |
| `job_type` | string | — | `remote` or `hybrid` → `remote_allowed == true`; `onsite` → `remote_allowed == false`. `JobPosting` has no separate `work_type` field, so any other value matches nothing |
| `experience_min` | int | — | Keeps jobs whose `experience_years_min` is **at most** this value (i.e. "jobs I already qualify for with this much experience", not a floor) |
| `remote_allowed` | bool | — | Exact match on `remote_allowed` |
| `salary_min` | int | — | Keeps jobs whose `salary_min` is **at least** this value |
| `industry` | string | — | Matches the employer's `industry` label (or `"Lainnya"` if unset) — see `GET /jobs/industries` for the live label set |

Each item is enriched with `verified` (employer verification status), `location` (region display name, with `· Remote OK` suffix when `remote_allowed`), and `industry`; `embedding`/`embedding_model` are stripped from the response.

**Response `200`:**
```json
{
  "total": 21,
  "offset": 0,
  "limit": 20,
  "items": [
    {
      "id": "job-001",
      "title": "Data Analyst",
      "employer_id": "emp-001",
      "required_skills": ["Python", "SQL", "Tableau"],
      "salary_min": 8000000,
      "salary_max": 14000000,
      "region_code": "3171",
      "remote_allowed": false,
      "experience_years_min": 1,
      "verified": true,
      "location": "Jakarta Pusat",
      "industry": "Teknologi"
    }
  ]
}
```

---

### `GET /api/v1/jobs/regions`

Distinct region codes present among currently active jobs, each with a display name and a live job count — powers the frontend's location filter from real data.

**Response `200`:**
```json
{ "items": [ { "code": "3171", "name": "Jakarta Pusat", "job_count": 12 } ] }
```

### `GET /api/v1/jobs/industries`

Distinct employer industries present among currently active jobs (falling back to `"Lainnya"` for employers with no industry set), each with a live job count.

**Response `200`:**
```json
{ "items": [ { "name": "Teknologi", "job_count": 8 } ] }
```

---

### `GET /api/v1/jobs/{job_id}`

Return a single job posting by ID, enriched the same way as list items (`verified`, `location`, `industry`; `embedding` fields stripped).

**Response `200`:** Full `JobPosting` object + enrichment fields.
**Response `404`:** `{"detail": "Lowongan tidak ditemukan"}` — job does not exist (a real HTTP 404, not a 200 with an error body).

---

## Agent Router — `/api/v1/agent`

🔒 **Auth required** (any authenticated role). Rate limited: **20 req / 60 s per IP**. There is no separate seeker/employer sub-agent split — a single LLM node produces the natural-language `final_response`; job matching itself is deterministic (`SemanticMatcher`), not an LLM "sub-agent".

### `POST /api/v1/agent/invoke`

Unified AI agent entry point: runs `SemanticMatcher.rank_jobs_for_seeker` procedurally, then invokes a single-node LangGraph call to generate the natural-language reply. Input is sanitized via `sanitize_text()` (max 2000 chars for `user_message`, max 200 for `explicit_intent`; control chars stripped, dangerous HTML tags stripped, injection patterns rejected with 422 — not "HTML-escaped").

**Seeker resolution cascade (never returns 400, but does require a valid JWT):**
1. Inline `seeker` provided and its `user_id` matches the caller → use it.
2. `seeker_id` provided and owned by the caller → use it.
3. `seeker_id` stale, not found, or owned by a different user → fall through to the caller's own profile (`fallback_used: true`).
4. Caller has no profile at all → an in-memory anonymous placeholder (`region_code: "3171"`, `fallback_used: true`); `seeker_id` in the response is `null` in this case.

**Request Body:**
```json
{
  "user_message": "Carikan saya lowongan Backend Developer di Jakarta",
  "seeker_id": "uuid-or-null",
  "seeker": null,
  "target_job_id": null,
  "explicit_intent": "match_jobs",
  "session_id": "thread-uuid",
  "filters": {
    "location": "jakarta",
    "salary_min": 10000000
  }
}
```
`filters` is normalized by `SemanticMatcher._normalize_filters`, which only recognizes the keys `location` (free-text, matched against the BPS region display name — a numeric region *code* like `"3171"` will not match unless it equals `j.region_code` verbatim), `salary_min`, and `experience_min`. Any other key (e.g. `region`) is silently ignored rather than rejected. Setting `location` or `salary_min` applies a **hard filter** (non-matching jobs are excluded outright, not merely de-prioritized).

**Response `200`:**
```json
{
  "intent": "match_jobs",
  "final_response": "Berdasarkan profil Anda, berikut 5 lowongan terbaik...",
  "seeker_id": "uuid",
  "matches": [
    {
      "job_id": "job-001",
      "seeker_id": "seeker-001",
      "score": 0.91,
      "cosine": 0.87,
      "skill_overlap": 0.80,
      "region_match": true,
      "salary_in_range": true,
      "rank": 1,
      "band": "strong",
      "explanation": "Kecocokan tinggi: 4/5 skill sesuai",
      "title": "Backend Developer",
      "company": "GoTo Group",
      "location": "3171 · Remote OK",
      "salary_range": "Rp 12–18jt",
      "salary_min": 12000000,
      "salary_max": 18000000,
      "remote_allowed": true,
      "required_skills": ["Python", "FastAPI", "PostgreSQL"],
      "matching_skills": ["Python", "FastAPI"],
      "missing_skills": ["PostgreSQL"],
      "experience_years_min": 2
    }
  ],
  "missing_skills": [],
  "matching_skills": [],
  "recommended_courses": [
    {
      "name": "PostgreSQL for Developers",
      "provider": "Dicoding",
      "duration": "1 bulan",
      "url": "https://dicoding.com/...",
      "price": "Rp 500.000",
      "rating": 4.5,
      "description": "...",
      "category": "tech"
    }
  ],
  "fallback_used": false,
  "band_distribution": { "strong": 2, "possible": 2, "stretch": 1 },
  "routing_confidence": 0.7,
  "hallucinated_ids_removed": 0,
  "early_exit": false
}
```
`recommended_courses` items follow the `CourseRecommendation` schema (`name`, `provider`, `duration`, `url`, `price`, `rating`, `description`, `category`) — there is no `duration_weeks` field. The trailing observability fields (`fallback_used` through `early_exit`) are always present: `fallback_used` is true when `seeker_id` was stale/absent/not-owned by the caller and the endpoint fell back to the caller's own profile or an anonymous seeker; `early_exit` is true when the token-efficiency gate skipped the LLM call entirely because every match scored below 0.10.

**Errors:** `422` input contains disallowed content (injection detected) · `429` rate limited. Note: unlike most routers, `/agent/invoke` requires authentication (`Depends(get_current_user)`) — there is no fully anonymous path; an unauthenticated caller gets `401`, and only the *seeker profile* falls back to an in-memory anonymous placeholder when the authenticated user has none.

---

## Seeker Router — `/api/v1/seeker`

🔒 **Auth required** — JWT with `role = "seeker"`.

### `GET /api/v1/seeker/profile`

Return the logged-in seeker's profile.

**Response `200`:** Full `SeekerProfile` object.
**Response `404`:** Profile not yet created.

---

### `POST /api/v1/seeker/profile`

Create or overwrite seeker profile. Re-embeds the profile vector via Gemini Embeddings on every call.

**Request Body:**
```json
{
  "full_name": "Budi Santoso",
  "headline": "Junior Backend Developer",
  "region_code": "3171",
  "skills": ["Python", "FastAPI", "SQL"],
  "salary_expectation_min": 8000000,
  "salary_expectation_max": 14000000,
  "resume_text": "...",
  "open_to_remote": true
}
```

**Response `201`:**
```json
{ "seeker_id": "uuid", "skills_count": 3 }
```

---

### `POST /api/v1/seeker/bookmarks` · `GET /api/v1/seeker/bookmarks` · `DELETE /api/v1/seeker/bookmarks/{job_id}`

Save, list, or remove a saved job for the authenticated seeker.

**Save Request:** `{ "job_id": "job-001" }`
**Save Response `201`:** `{ "id": "uuid", "job_id": "job-001", "status": "saved" }`

**List Response `200` (Enriched for UI Cards):**
```json
[
  {
    "application_id": "uuid",
    "job_id": "job-001",
    "title": "Senior Backend Engineer",
    "company": "PT KerjaCerdas Nusantara",
    "status": "saved",
    "saved_at": "2026-08-26T10:00:00+07:00",
    "salary_range": "Rp 28–42jt",
    "salary_min": 28000000,
    "salary_max": 42000000,
    "region_code": "3171",
    "remote_allowed": true
  }
]
```

---

### `POST /api/v1/seeker/apply`

Submit a job application (idempotent — returns existing record if already applied).

**Request:** `{ "job_id": "job-001", "cover_letter": "..." }`
**Response `201`:** `{ "application_id": "uuid", "job_id": "job-001", "status": "applied", "already_applied": false }`

---

### `GET /api/v1/seeker/applications`

Return all job applications for the logged-in seeker with interactive milestone progress tracking (`saved` → `applied` → `reviewed` → `interview` → `hired` / `rejected`).

```json
[
  {
    "application_id": "uuid",
    "job_id": "job-001",
    "title": "Data Analyst",
    "company": "Bank Mandiri",
    "status": "applied",
    "applied_at": "2026-08-25T10:00:00+07:00"
  }
]
```

---

### `POST /api/v1/seeker/skill-gap`

Rate limited: **20 req / 60 s per IP** (same cost class as `/agent/invoke` — calls Gemini for course narration). Runs `SemanticMatcher` to find the seeker's top job match (or a caller-supplied `target_job_id`), computes the skill gap via canonicalized set difference, and persists a `SkillGapResult` row.

**Request Body:** `{ "target_job_id": "uuid-or-null" }`

**Response `200`:**
```json
{
  "seeker_id": "uuid",
  "target_job_id": "job-001",
  "target_job_title": "Data Analyst",
  "missing_skills": ["Tableau"],
  "matching_skills": ["Python", "SQL"],
  "recommended_courses": [{ "name": "...", "provider": "...", "duration": "..." }],
  "match_before": 62.5,
  "match_after": 87.6,
  "estimated_hours": 10,
  "gap_severity": "low"
}
```
`match_after` is a **transparent scenario estimate** ("if you closed every missing skill"), not a measured or promised outcome. `estimated_hours` is `min(missing_skills_count * 10, 120)`. `gap_severity` is `high` (≥50% of required skills missing), `medium` (≥25%), or `low`.

**Errors:** `404` no seeker profile yet.

### `GET /api/v1/seeker/skill-gap/latest`

Returns the most recently persisted `SkillGapResult` for the logged-in seeker (or `null` if none exists yet), recomputing `match_after` and `estimated_hours` the same way `POST /skill-gap` does so both endpoints stay consistent.

**Errors:** `404` no seeker profile yet.

---

## Uploads Router — `/api/v1/uploads`

🔒 **Auth required** (`require_seeker` for `/cv`, `require_employer` for `/job-pack`). Rate limited: **10 req / 60 s per IP**, per endpoint.

### `POST /api/v1/uploads/cv`

Upload a PDF CV. Gemini extracts structured fields (with a PyMuPDF-based text-extraction path as part of `parse_cv`'s multi-strategy fallback), and the seeker profile is upserted synchronously (embedding runs inline here, not backgrounded like `POST /seeker/profile`).

- Max file size: **10 MB** (`MAX_PDF_BYTES` in `uploads.py`) — checked in the handler itself; `RequestSizeMiddleware` explicitly exempts `/uploads/*` paths since these stream the file
- Accepted `Content-Type`: `application/pdf` or `application/octet-stream`, and the first 5 bytes must be the `%PDF-` magic header (checked after MIME type)

**Request:** `multipart/form-data` with field `file` (PDF).

**Response `200`:**
```json
{
  "seeker_id": "uuid",
  "parsed_offline": false,
  "summary": { "skills_count": 12, "experience_count": 2, "education_count": 1 }
}
```

**Errors:** `400` unsupported content-type or missing `%PDF-` magic header · `413` file exceeds 10 MB · `503` parser AI unavailable (offline fallback triggered) · `429` rate limited. (Not `422` — MIME/format rejections here are raised as `400`, unlike the Pydantic-validation `422`s elsewhere in this API.)

### `POST /api/v1/uploads/job-pack`

Upload a bulk Job Pack PDF containing one or multiple job descriptions. AI
parses each job and populates skill requirements, salary brackets, and
region codes — **nothing is published yet**; the employer reviews the
parsed list and confirms which postings to publish via one `POST
/employer/jobs` call per posting (same endpoint the manual "Pasang
Lowongan" form uses, passing back the `client_ref` this response attaches
to each job for idempotent retries).

Retrying an upload of the identical file (a lost response, a reload, a
different browser or device) replays a server-side cache
(`job_pack_parse_cache`, keyed by `sha256(employer_id + file bytes)`)
instead of re-invoking Gemini — this keeps every field, and therefore the
derived `client_ref`, byte-identical across retries, so a retried publish
can't be mistaken for a new posting.

**Request:** `multipart/form-data` with field `file` (PDF).

**Response `200`:**
```json
{
  "employer_id": "uuid",
  "jobs": [
    {
      "local_id": "a1b2c3d4e5f6a7b8-0",
      "title": "Senior Backend Engineer",
      "details": "Jakarta · 3 skill wajib",
      "description": "...",
      "required_skills": ["Python", "FastAPI", "Docker"],
      "region_code": "3171",
      "salary_min": 15000000,
      "salary_max": 25000000
    }
  ],
  "parsed_offline": false
}
```

---

## Employer Router — `/api/v1/employer`

🔒 **Auth required** — JWT with `role = "employer"`.

### `GET /api/v1/employer/profile` · `POST /api/v1/employer/profile`

Get or update the employer company profile (company name, NPWP, industry, size, region code, website, description).

---

### `GET /api/v1/employer/jobs` · `POST /api/v1/employer/jobs`

List the employer's own job postings, or create a new one.

**Create Request Body (validated via `JobCreate` Pydantic schema):**
```json
{
  "title": "Senior Backend Engineer",
  "description": "...",
  "required_skills": ["Python", "FastAPI", "Docker"],
  "salary_min": 15000000,
  "salary_max": 25000000,
  "region_code": "3171",
  "remote_allowed": true,
  "experience_years_min": 3,
  "client_ref": "optional — see /uploads/job-pack above"
}
```
`client_ref` is an optional idempotency token: retrying a create with the same `(employer_id, client_ref)` returns the already-created job (`created: false`) instead of inserting a duplicate. The manual "Pasang Lowongan" form omits it (each submit is a deliberate new posting); the Job Pack confirm flow always sets it.

**Response `201`:** `{ "job_id": "uuid", "title": "Senior Backend Engineer", "created": true }` (`created: false` on an idempotent `client_ref` replay — the existing row is returned, not re-inserted.)

Job is automatically embedded via `embed_job()` (pgvector) upon creation. An unrecognized `education_min` value silently falls back to `S1` rather than rejecting the request (the field is advisory for matching, not a hard gate).

---

### `PATCH /api/v1/employer/jobs/{job_id}`

Partially update a job the caller's employer profile owns (403 if it belongs to a different employer, 404 if it doesn't exist). Only fields present in the request body are touched (`exclude_unset`). Re-embeds the job if `description` or `required_skills` changed.

**Response `200`:** `{ "job_id": "uuid", "updated": ["description", "salary_max"] }`

### `DELETE /api/v1/employer/jobs/{job_id}`

Delete a job the caller's employer profile owns. **Response `204`**, no body.

### `POST /api/v1/employer/jobs/estimate`

Rate limited under the `/employer/jobs` bucket (**30 req / 60 s per IP**) — cheap heuristic pool-size preview for the job-posting wizard, called on every debounced keystroke. No auth dependency beyond the router's `require_employer`, no LLM call (pure skill-overlap + location heuristic over the seeker store).

**Request Body:** `{ "required_skills": [...], "location": "jakarta", "salary_min": 8000000, "salary_max": 14000000 }`

**Response `200`:** `{ "pool_size": 340, "match_score": 82, "tip": "Naikin gaji ke Rp 35-50jt → perkiraan pool naik ~80%." }`

---

### `POST /api/v1/employer/jobs/{job_id}/candidates`

Rate limited under the `/employer/jobs` bucket (**30 req / 60 s per IP** — reverse-matching calls Gemini per request, same cost class as `/agent/invoke`). Return AI-ranked candidates for a job posting the caller's employer profile owns (403 on cross-tenant access via `_require_owned_job`). Uses `SemanticMatcher.rank_seekers_for_job` reverse ranking. Applies the *teaser method*: `full_name` is masked (e.g. `"Someone at Tokopedia"`, `"Someone from Universitas Indonesia"`, or `"Hidden Candidate"` with no usable signal) unless the candidate already applied directly to this job (`already_applied: true`), in which case their real name is shown — Pay-to-Unlock only gates candidates sourced from the wider pool, not direct applicants.

**Request Body (optional, `CandidateSearchRequest`):** `{ "top_k": 10, "filters": { "location": "...", "experience_min": 2 } }`

---

### `POST /api/v1/employer/jobs/{job_id}/unlock/{seeker_id}`

**[BUILT, DEMO MODE]** Unlock full contact details (name, email, phone) for a candidate. `unlock_cost_idr` is `0` if the candidate already applied directly to this job (their contact is already free/visible via `GET /employer/applications` — charging again would be double-billing for the same access), otherwise `50000`. In demo mode any `payment_token` value (including none) is accepted — there is no real payment-gateway call; a comment in `employer.py` marks where Midtrans/Xendit validation belongs. Idempotent per (employer, seeker) — re-unlocking an already-unlocked candidate returns the same contact info without re-charging.

**Request Body (optional):**
```json
{
  "payment_token": "tok_midtrans_sandbox_123"
}
```

**Response `200`:**
```json
{
  "unlocked": true,
  "seeker_id": "uuid",
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "phone": "+628123456789",
  "unlock_id": "unlock_emp123_seek456",
  "unlock_cost_idr": 50000,
  "note": "[DEMO] Dalam produksi, verifikasi payment_token Midtrans/Xendit terlebih dahulu."
}
```

---

### `GET /api/v1/employer/applications`

List applications submitted to jobs the caller's employer profile owns (excludes `saved`/bookmark-only rows). Optional `?job_id=<job_id>` filters to one posting (ignored if it isn't one of the caller's own jobs).

**Response `200`:** `{ "total": N, "items": [ { "id", "application_id", "job_id", "job_title", "seeker_id", "seeker_name", "seeker_email", "seeker_phone", "headline", "skills", "status", "note", "cover_letter", "match_score", "applied_at", "updated_at" } ] }`

### `PATCH /api/v1/employer/applications/{application_id}/status`

Move an application through the recruitment pipeline. Status transitions are checked against a state machine (`APPLICATION_TRANSITIONS` in `db/schemas.py`): the pipeline only moves forward and `hired`/`rejected`/`withdrawn` are terminal. Re-sending the application's current status is a no-op (idempotent retries), not an error. An employer may only set `reviewed`, `interview`, `offered`, `hired`, or `rejected` (`EMPLOYER_SETTABLE_STATUSES`) — `saved` and `withdrawn` belong to the seeker. Also accepts common Indonesian status aliases (e.g. `"diterima"` → `hired`, `"wawancara"` → `interview`).

**Request Body:** `{ "status": "interview", "note": "Jadwalkan minggu depan" }` (both optional/independent — a request may update only `note`)

**Response `200`:** `{ "id", "application_id", "status", "note", "updated_at" }`

**Errors:** `404` application not found · `403` not the owning employer · `400` unrecognized status string · `409` transition not allowed from the current status.

---

## Verification Router — `/api/v1/verify`

**[BUILT, DEMO MODE]** All endpoints below require authentication (`Depends(get_current_user)`) — none are public. Rate limits: `/identity` **10 req/60s per IP**, `/otp/send` **5 req/60s per IP** (kept tight — this is the one endpoint that would cost real money once a real SMS/WhatsApp vendor is wired in), `/otp/verify` **10 req/60s per IP** (a brute-force guard layered on top of the per-record `_OTP_MAX_ATTEMPTS = 5` counter). `/education`, `/npwp`, `/documents` share the 300 req/60s default bucket.

### `GET /api/v1/verify/documents`

Return the current user's verified documents registry.

```json
{
  "encryption": "AES-256-GCM",
  "region": "id-jakarta",
  "compliance": ["UU-PDP-2022", "ISO-27001"],
  "documents": []
}
```

---

### `POST /api/v1/verify/identity`

Mock Dukcapil E-KYC — a NIK *format* check (16 digits, not a "99"-prefixed
demo-fail value), not a real identity confirmation. A passing check
persists `nik_verified: "pending"` to the seeker's profile — never
`"verified"`, which is reserved for a real Dukcapil integration this build
doesn't have. `PENDING` is still durable: it survives a reload or a login
from another browser/device.

**Request:**
```json
{
  "nik": "3171010101010001",
  "full_name": "Budi Santoso",
  "date_of_birth": "1995-01-01",
  "selfie_image_base64": null
}
```

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "PENDING",
  "match_percentage": 0.97,
  "verification_hash": "sha256:...",
  "pii_redacted": true,
  "message": "Format NIK diterima — menunggu verifikasi resmi (mode demo, bukan konfirmasi identitas)."
}
```
`status` is `"FAILED"` (NIK prefixed "99" — the demo fail rule) when the check rejects it.

---

### `POST /api/v1/verify/education`

Mock SIVIL Kemdikbud diploma-number format check — the mirror of
`/verify/identity` above, including the PENDING-not-VERIFIED persistence
(`ijazah_verified`) for the same reason.

**Request:** `{ "ijazah_number": "...", "university_name": "...", "major": "..." }`

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "PENDING",
  "message": "Format nomor ijazah diterima — menunggu verifikasi resmi (mode demo).",
  "verified_data": {
    "university": "Universitas Indonesia",
    "major": "Ilmu Komputer",
    "graduation_year": "2023",
    "degree": "S1",
    "status": "Lulus"
  }
}
```
`status` is `"NOT_FOUND"` for an obviously-placeholder number (e.g. `"000000"`, `"test"`).

---

### `POST /api/v1/verify/npwp`

Verify company NPWP via mock DJP Online.

**Request:** `{ "npwp": "12.345.678.9-012.000", "company_name": "PT Contoh" }`

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "VERIFIED",
  "message": "NPWP terverifikasi di DJP Online (mode demo).",
  "verified_data": {
    "npwp": "12.345.678.9-012.000",
    "company_name": "PT Contoh",
    "status": "AKTIF",
    "valid_until": "2027-12-31"
  }
}
```

---

### `POST /api/v1/verify/otp/send`

Generate and dispatch a 6-digit OTP for phone/contact verification. In demo mode, `demo_code` is returned in response for testing without third-party vendor expenses. In production, dispatched via Fonnte (WhatsApp Gateway) or Twilio Verify.

**Request:** `{ "phone": "+6281234567890" }`

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "SENT",
  "phone": "+6281234567890",
  "expires_in_seconds": 300,
  "demo_code": "123456",
  "message": "[DEMO MODE] Kode OTP: 123456. Dalam produksi kode akan dikirim via WhatsApp/SMS."
}
```

---

### `POST /api/v1/verify/otp/verify`

Validate the submitted 6-digit OTP code against the active session.

**Request:** `{ "phone": "+6281234567890", "code": "123456" }`

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "VERIFIED",
  "phone": "+6281234567890",
  "message": "Nomor HP berhasil diverifikasi."
}
```

**Errors:** `404` no pending OTP for this phone (send one first) · `410` OTP expired (5-minute TTL; the record is deleted) · `429` more than 5 verify attempts against this OTP record (also deletes it) · `400` wrong code (remaining-attempts count included in the message).

---

## Inquiries Router — `/api/v1/inquiries`

Partnership / university / training-partner / enterprise-recruiting contact intake from public marketing pages.

### `POST /api/v1/inquiries`

Public — auth optional (`get_current_user_optional`; the submitter identity isn't used, this just avoids forcing a login for a contact form).

**Request Body (`CreateInquiryRequest`):**
```json
{
  "category": "university_partnership",
  "name": "Budi Santoso",
  "organization": "Universitas Indonesia",
  "email": "budi@ui.ac.id",
  "message": "Kami tertarik kerja sama kampus."
}
```

**Response `201`:** `{ "ok": true, "id": "uuid", "message": "Permohonan kemitraan berhasil dikirim. Tim kami akan menghubungi Anda." }`

### `GET /api/v1/inquiries` · `PATCH /api/v1/inquiries/{inquiry_id}`

**[BUILT, DEMO MODE]** Admin-only listing/status-update of submitted inquiries. Both require a valid JWT (any role) **and** `settings.admin_routes_enabled = true` (`ADMIN_ROUTES_ENABLED` env var, off by default) — `get_current_user` alone only proves the caller is *some* logged-in seeker or employer, not an administrator, so with the flag off both routes return `404` for every caller regardless of role. There is no dedicated admin role/permission system yet; this flag is a stopgap until one exists.

`GET` supports optional `?category=` and `?status_filter=` query filters. `PATCH` body: `{ "status": "contacted", "notes": "..." }` (`status` must be one of `pending|contacted|reviewed|closed`).
