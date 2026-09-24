# KerjaCerdas API Specification

> **Schema-first contract** — Every endpoint here corresponds 1-to-1 with a FastAPI router module.
> Interactive Swagger UI is available at `http://localhost:8000/docs` when the server is running.

API KerjaCerdas menggunakan endpoint asinkron (FastAPI + SQLAlchemy async) dan indeks vektor HNSW pada `pgvector`, yang secara desain menghindari full-table scan pada pencarian kesamaan vektor. Target latensi <200ms adalah target desain arsitektur; belum ada hasil load test produksi yang tersimpan di repositori ini untuk memvalidasi angka tersebut pada skala nyata.

## Base URL

```
Development: http://localhost:8000
Production:  https://api.kerjacerdas.tech
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
| **3. CORS** | `CORSMiddleware` | Explicit allowlist only (`settings.cors_allow_origins`: localhost:3000/3001/5000 by default) plus this Replit workspace's own named origins (`REPLIT_DEV_DOMAIN`/`REPLIT_DOMAINS`). No wildcard/regex — a broad `*.replit.dev` regex was deliberately removed (see `backend/app/api/main.py::_replit_origins`) because combined with `allow_credentials=True` it would trust any Replit account's subdomain |
| **4. Rate Limiter** | `RateLimiterMiddleware` | Sliding window per (IP, route bucket) — auth login/register: 10 req/60s · agent invoke: 20 req/60s · uploads (cv, job-pack): 10 req/60s each · verify/email/send: 5 req/60s · verify/email/verify: 10 req/60s · public/jobs (public page, QR, reports): 60 req/60s · quiz: 30 req/60s · billing: 20 req/60s · seeker/skill-gap: 20 req/60s · employer/jobs (incl. `/candidates`, `/estimate`): 30 req/60s · everything else: 300 req/60s shared per IP. Memory bounded at 10,000 (ip, bucket) keys with LRU eviction |
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
  "profile_completeness_nudge": "progress_bar"
}
```
(Live experiment registry, `EXPERIMENTS` in `backend/app/api/routers/experiments.py`. Values above are the current experiments and one possible variant each — actual variant per user depends on the MD5 hash.)

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

**Request:** `{ "job_id": "job-001", "cover_letter": "...", "source": "board|link" }`

`source` records where the applicant came from — `link` for the job's QR / share link, `board` for the
public job board — so `/admin/metrics` can report whether QR traffic converts better.

**Response `201`:**
```json
{ "application_id": "uuid", "job_id": "job-001", "status": "applied", "already_applied": false,
  "match_score": 0.61, "band": "possible",
  "skill_proof": [ { "name": "Excel", "status": "quiz" }, { "name": "Administrasi", "status": "claimed" } ] }
```
The score and a snapshot of the applicant's proof levels are stored on the application at apply time,
so the platform can later measure whether proven skills actually predict interviews and hires.

**Errors:** `409` the job is no longer accepting applications (closed or held by moderation).

---

### `GET /api/v1/seeker/applications/{application_id}/rank`

**Free, on every tier, deliberately.** Exact standing in that job's applicant queue plus the
evidence behind it. Every figure is read from rows written when the candidate applied — no embedding
call, no LLM call, **Rp0 per request**.

This was briefly gated behind Prism. The score and the ordering were identical either way, so it
looked fair — but a candidate who knows they are 14th of 62, and which claimed skill costs them, can
act where one who does not know cannot. That is advantage bought with money, charged to the side of
the market with the least of it, and it contradicts the product's own promise. `402` was removed and
`test_seeing_your_own_standing_is_never_sold` fails if it returns.

Only ownership is checked. An application belonging to someone else returns `404`, never `403`, so
the endpoint cannot be used to probe which application ids exist.

```json
{
  "application_id": "uuid", "job_id": "job-001",
  "rank": 14, "total_applicants": 62, "percentile": 79,
  "score": 0.765,
  "skills": [{ "skill": "Excel", "level": "quiz" }],
  "proven_count": 2, "claimed_count": 1,
  "how_to_improve": "1 skill masih berupa klaim. Lulus kuisnya menaikkan bobot…"
}
```

Ties share a rank (two identical stored scores are genuinely level). `percentile` is `null` when
fewer than 10 people applied — "top 50%" out of two applicants is noise. `total_applicants` counts
only people who actually applied; `SAVED` bookmarks are excluded, so the field matches the one the
employer's applicant list shows.

**Nothing here is sold.** Paying buys neither the position nor visibility of it — an earlier draft
of this section said otherwise and contradicted the endpoint. The ordering reported is the same one
the employer sees on every tier, and the endpoint has no write path.

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

**Response `201`:**
```json
{ "job_id": "uuid", "title": "Senior Backend Engineer", "created": true,
  "public_code": "K7RPX2M", "share_path": "/j/K7RPX2M",
  "moderation_status": "published",
  "moderation_reasons": [],
  "notice": "Lowongan tayang.",
  "strike": null }
```
(`created: false` on an idempotent `client_ref` replay — the existing row is returned, not re-inserted.)

Every new posting passes **AutoMod** first (`services/trust/automod.py`): asking candidates for money
is `rejected` (and adds a strike), discriminatory or suspicious wording is `held` for admin review,
and an employer's **first** posting is held unless they already hold the company-email or
"Ditinjau admin" badge (`MODERATION_FIRST_JOB_REVIEW`). A job that is not `published` is always kept
inactive, so every existing `is_active` filter hides it. `notice` is the ready-to-show poster message
naming the rule, the flagged sentence and how to fix it.

**Errors:** `402` the plan's active-job limit is reached (Spark 1, Lighthouse 5, plus any
Beacon-covered job) · `403` account suspended after 3 strikes.

Job is automatically embedded via `embed_job()` (pgvector) upon creation. An unrecognized or omitted `education_min` falls back to `SMA` — the floor, meaning "no requirement stated" — rather than rejecting the request (the field is advisory for matching, not a hard gate). It is deliberately NOT `S1`: that would make a posting demand a degree the employer never asked for.

---

### `PATCH /api/v1/employer/jobs/{job_id}`

Partially update a job the caller's employer profile owns (403 if it belongs to a different employer, 404 if it doesn't exist). Only fields present in the request body are touched (`exclude_unset`). Re-embeds the job if `description` or `required_skills` changed.

Editing content (`title`, `description`, `responsibilities`, salary) re-runs AutoMod — this is how a
poster fixes a held/rejected ad ("edit & resubmit"). Setting `is_active: true` is refused with `409`
while the job is not `published`, and with `402` when the plan's active-job limit is reached.

**Response `200`:** `{ "job_id": "uuid", "updated": ["description", "salary_max"], "moderation_status": "published", "moderation_reasons": [], "notice": "Lowongan tayang." }`

### `DELETE /api/v1/employer/jobs/{job_id}`

Delete a job the caller's employer profile owns. **Response `204`**, no body.

### `POST /api/v1/employer/jobs/estimate`

Rate limited under the `/employer/jobs` bucket (**30 req / 60 s per IP**) — cheap heuristic pool-size preview for the job-posting wizard, called on every debounced keystroke. No auth dependency beyond the router's `require_employer`, no LLM call (pure skill-overlap + location heuristic over the seeker store).

**Request Body:** `{ "required_skills": [...], "location": "jakarta", "salary_min": 8000000, "salary_max": 14000000 }`

**Response `200`:** `{ "pool_size": 340, "match_score": 82, "tip": "Naikin gaji ke Rp 35-50jt → perkiraan pool naik ~80%." }`

---

### `POST /api/v1/employer/jobs/{job_id}/candidates`

Rate limited under the `/employer/jobs` bucket (**30 req / 60 s per IP** — reverse-matching calls Gemini per request, same cost class as `/agent/invoke`). Return AI-ranked candidates for a job posting the caller's employer profile owns (403 on cross-tenant access via `_require_owned_job`). Uses `SemanticMatcher.rank_seekers_for_job` reverse ranking. Candidates who have **not** applied to this job are fully anonymised: `full_name` becomes `"Kandidat #N"` and the headline is blank. Only someone who applied to this very job (`already_applied: true`) is shown by name — they handed their details over voluntarily. The old `"Someone at {company}"` teaser was removed because company + school + region + experience was enough to re-identify the person elsewhere. Each row carries `skill_proof` (per required skill) and `proven_skill_count`.

**Request Body (optional, `CandidateSearchRequest`):** `{ "top_k": 10, "filters": { "location": "...", "experience_min": 2 } }`

**Plan-gated — this is sourcing, not screening.** Searching candidates who have *not* applied is the
employer feature that is actually sold, so it carries a quota (`_check_talent_search_quota`):

| Tier | Searches / 30 days | Scope | Response when exhausted |
|---|---|---|---|
| Spark (free) | 0 | — | `402 Payment Required` — names Beacon and Lighthouse |
| Beacon | 30 | **per job** | `429 Too Many Requests` — offers Lighthouse |
| Lighthouse | 150 | per account | `429 Too Many Requests` |

**Beacon is checked and counted against the job in the path, not the account.** It is sold per job,
so asking only "does this account hold a Beacon?" would let a Beacon bought for job A unlock
sourcing on every unpaid Spark job the same employer owns, and a single shared counter would make
two Beacon purchases split one 30-search allowance. The quota bucket is therefore
`talent_search:{job_id}` on Beacon and `talent_search` on Lighthouse, which is account-wide by
design.

Ranked **applicants** (`GET /employer/applications`) are deliberately uncapped on every tier,
including free: scoring someone who already applied costs Rp0 to compute, so capping it saves
nothing and only hides candidates. The quota is consumed via `consume_quota` on the `talent_search`
event and skipped entirely when `PLAN_LIMITS_ENFORCED=false`.

---

### `GET /api/v1/employer/applications/{application_id}/interview-kit`

AI interview questions for one applicant, focused on skills that are still only *claimed*
("explain your own answer" questions for quiz-proven ones). Falls back to deterministic
templates when no Gemini key is configured.

Requires the job to be covered by **Beacon** or **Lighthouse** — otherwise `402 Payment Required`.

```json
{
  "application_id": "…",
  "source": "template",
  "questions": [
    { "skill": "Administrasi", "proof": "claimed",
      "question": "Ceritakan satu situasi nyata saat kamu memakai Administrasi. Apa yang kamu lakukan dan apa hasilnya?" }
  ]
}
```

---

### `POST /api/v1/employer/applications/{application_id}/confirm-skills`

HR confirmation after the interview — the strongest proof level (weight 1.0). Only allowed once the
application has reached `interview`, `offered`, `hired` or `rejected` (409 otherwise). Skill names
outside the job's requirements or the candidate's profile are ignored.

```json
{ "skills": [ { "name": "Excel", "confirmed": true }, { "name": "Administrasi", "confirmed": false } ] }
```

---

### `GET /api/v1/employer/jobs/{job_id}/applicants.csv`

CSV export (name, email, score, band, proven skills, status, source, applied date), ranked by score.
Beacon/Lighthouse only (402 otherwise).

---

### `POST /api/v1/employer/jobs/{job_id}/appeal`

Appeal a held/rejected posting: `{ "message": "…" }` (10–2000 chars). A rejected job moves back to
`held` for admin review and the appeal is written to the moderation audit log.

---

### `GET /api/v1/employer/trust` · `POST /api/v1/employer/trust/review-request`

Trust badges (`email_verified`, `company_email`, `admin_reviewed`), strike state, and the
"Ditinjau admin" request (1–5 public `links`, e.g. Google Maps or Instagram business).

---

### `GET /api/v1/employer/applications`

List applications submitted to jobs the caller's employer profile owns (excludes `saved`/bookmark-only rows). Optional `?job_id=<job_id>` filters to one posting (ignored if it isn't one of the caller's own jobs).

Applicants are ranked by a **live** proof-weighted match score (a candidate who passes a quiz after
applying moves up). On the free **Spark** tier only the first `SPARK_RANKED_APPLICANT_LIMIT` (default
20) applicants per job are ranked and shown; the rest come back as `locked: true` with no score or
personal data until the job is covered by Beacon/Lighthouse.

**Response `200`:**
```json
{ "total": 2, "ranked_limit": null,
  "items": [
    { "id": "…", "application_id": "…", "job_id": "…", "job_title": "Admin & Customer Service",
      "seeker_id": "…", "seeker_name": "Rina Paramitha", "seeker_email": "rina@example.com",
      "email_verified": true, "headline": "Lulusan SMK Akuntansi",
      "skills": ["Excel", "Customer Service"],
      "skill_proof": [ { "name": "Excel", "status": "quiz" }, { "name": "Administrasi", "status": "claimed" } ],
      "band": "possible", "match_score": 0.61, "match_score_at_apply": 0.52,
      "status": "applied", "source": "link", "note": "", "cover_letter": "",
      "applied_at": "2026-09-20 09:12", "updated_at": "2026-09-20 09:12", "locked": false },
    { "id": "…", "application_id": "…", "job_id": "…", "seeker_name": "Pelamar terkunci",
      "locked": true, "match_score": null,
      "lock_reason": null }   // ranked applicants are uncapped on every tier
  ] }
```

### `PATCH /api/v1/employer/applications/{application_id}/status`

Move an application through the recruitment pipeline. Status transitions are checked against a state machine (`APPLICATION_TRANSITIONS` in `db/schemas.py`): the pipeline only moves forward and `hired`/`rejected`/`withdrawn` are terminal. Re-sending the application's current status is a no-op (idempotent retries), not an error. An employer may only set `reviewed`, `interview`, `offered`, `hired`, or `rejected` (`EMPLOYER_SETTABLE_STATUSES`) — `saved` and `withdrawn` belong to the seeker. Also accepts common Indonesian status aliases (e.g. `"diterima"` → `hired`, `"wawancara"` → `interview`).

**Request Body:** `{ "status": "interview", "note": "Jadwalkan minggu depan" }` (both optional/independent — a request may update only `note`)

**Response `200`:** `{ "id", "application_id", "status", "note", "updated_at" }`

Every status change is also written to `application_status_events` (from, to, match score at apply
time), which is what `GET /admin/metrics` uses to report the interview rate per score band.

**Errors:** `404` application not found · `403` not the owning employer · `400` unrecognized status string · `409` transition not allowed from the current status.

---

## Verification Router — `/api/v1/verify`

Email verification is the **only** identity check the platform performs. NIK/KTP, ijazah numbers and
NPWP are **not collected at all** (UU PDP data minimisation) — the employer checks identity documents
at the interview. The former `/verify/identity`, `/verify/education`, `/verify/npwp`,
`/verify/documents` and `/verify/otp/*` endpoints were removed in v2.

### `GET /api/v1/verify/status`

```json
{ "email": "rina@example.com", "email_verified": true }
```

---

### `POST /api/v1/verify/email/send`

Rate limit: **5 / 60 s**. Sends a 6-digit code (valid 10 minutes) to the account's own email via
Resend when `RESEND_API_KEY` is configured. Without a provider the endpoint only works while OTP demo
mode is on (never in production by default) and returns the code in `demo_code`; otherwise it fails
closed with `503`.

```json
{ "request_id": "…", "status": "SENT", "email": "rina@example.com",
  "expires_in_seconds": 600, "mode": "email" }
```

---

### `POST /api/v1/verify/email/verify`

Rate limit: **10 / 60 s**. Body `{ "code": "123456" }`. Max 5 attempts per code; codes are stored as
SHA-256 hashes only. `400` wrong code (with attempts left), `410` expired, `429` too many attempts.

---

## Quiz Router — `/api/v1/quiz` (seeker only)

Rate limit: **30 / 60 s** across the router, so the question bank cannot be scraped.

### `GET /api/v1/quiz/skills?job_id=…`

Skills with an available quiz plus this seeker's proof status
(`claimed` / `quiz` / `hr_confirmed` / `missing`).

### `POST /api/v1/quiz/start`

Body `{ "skill": "Excel" }`. Returns 5 randomly drawn questions with per-attempt shuffled options and
a server-side deadline (45 s per question). **Correct answers are never included.** An unsubmitted
attempt within its deadline is resumed instead of drawing new questions.

`400` if the skill has no bank **and** is not on the seeker's profile (only a claimed skill may
trigger paid question generation); `503` while a bank is still being prepared; `429` while the
retake cooldown is active — **1 day, identical on every plan**.

A retake never redraws the previous attempt's questions. When a bank is still too thin to honour
that, the quiz is served anyway but **cannot award a badge**: `proof_eligible` is `false`,
`repeated_questions` says how many had to be reused, and `notice` explains it to the candidate.

```json
{ "attempt_id": "…", "skill": "excel", "skill_label": "Excel",
  "deadline_at": "2026-09-20T09:15:00Z", "seconds_per_question": 45, "pass_mark": 4,
  "resumed": false, "draft_bank": true,
  "proof_eligible": true, "repeated_questions": 0,
  "questions": [ { "id": "…", "question": "…", "options": ["…", "…", "…", "…"] } ] }
```

### `POST /api/v1/quiz/submit`

Body `{ "attempt_id": "…", "answers": [0,3,1,2,0] }`. Graded server-side against the answer key (no AI
call). Passing (4/5) sets that skill's proof level to `quiz` for 180 days and records evidence —
**unless the attempt was not `proof_eligible`**, in which case it is scored and returned normally but
writes no evidence. `proof_granted` in the response says which of the two happened.
Returns which answers were right — never which option was correct.

### `POST /api/v1/quiz/abandon`

Body `{ "attempt_id": "…", "elapsed_seconds": 42 }` (`elapsed_seconds` optional; measured from the
attempt's start when omitted). Called when a seeker leaves a quiz before submitting. Under 30 seconds
the attempt stays open (`"status": "in_progress"`, `"used_attempt": false`). From 30 seconds on it is
closed as failed with score 0 (`"status": "abandoned"`, `"used_attempt": true`), so leaving a quiz to
see the questions still counts as an attempt. An already submitted attempt is returned unchanged.
`404` if the attempt is not this seeker's.

---

## Public Jobs Router — `/api/v1/public/jobs`

The shareable job link / QR surface. Rate limit: **60 / 60 s**.

### `GET /api/v1/public/jobs/rules`

The published posting rulebook, `{ "rules": [...] }`: the same list shown to employers before posting,
to seekers when reporting, and to the AI reviewer. Source of truth: `services/trust/rules.py`
(human-readable copy in [`RULES.md`](RULES.md)).

### `GET /api/v1/public/jobs/{code}`

Public job page data (no login): job fields, company name, location, employer trust badges,
`accepting_applications`, `share_path`, and the report reason list. Internal fields (`embedding`,
`client_ref`, moderation reasons) are never exposed.

### `GET /api/v1/public/jobs/{code}/qr.svg?origin=…`

Printable QR poster image (SVG, rendered server-side with `segno`). `origin` is honoured only when it
is in the CORS allow-list, so a QR can never be pointed at another site.

### `POST /api/v1/public/jobs/{code}/report`

Login required; one report per user per job. Body `{ "reason": "minta_biaya|palsu|diskriminatif|kontak_mencurigakan|lainnya", "detail": "…" }`.
Reports are **weighted, not counted** (`services/trust/rules.py`): each must cite a published rule (`GET /public/jobs/rules`), and reporter weight comes from verified email, account age, whether they applied, and whether their past reports held up. Reaching the weighted threshold sets `moderation_status = "flagged"` — the posting **stays visible** — and the AI reviewer then checks it against the cited rules only. Only a **hard**-rule violation hides it; anything else queues a human.

---

## Billing Router — `/api/v1/billing`

Manual payment until a gateway is live. Rate limit: **20 / 60 s**.

### `GET /api/v1/billing/plans`

Public catalogue: Spark / Beacon / Lighthouse (employer) and Free / Prism (seeker), with prices from
settings and the payment instructions text.

### `GET /api/v1/billing/me`

Current entitlements (`lighthouse_until`, `beacon_jobs`, `prism_until`) and recent orders.

### `POST /api/v1/billing/orders`

Body `{ "plan": "beacon|lighthouse|prism", "job_id": "…" }` (`job_id` required for Beacon, and must be
a job the caller owns). Creates a **pending** order and returns an order code + payment instructions.
An admin activates it for 30 days after checking the QRIS / transfer.

---

## Admin Router — `/api/v1/admin`

Only for accounts whose email is in `ADMIN_EMAILS`, and only while `ADMIN_ROUTES_ENABLED=true`;
everyone else gets `403`.

| Endpoint | Purpose |
|---|---|
| `GET /admin/moderation/queue?limit=50&offset=0` | Postings awaiting a human, from three sources: `held` (AutoMod), `flagged` (community threshold reached, still publicly visible) and `published` jobs carrying unresolved reports that never reached the threshold. Each item has AutoMod reasons, open reports and the last 10 moderation events. Paged — `limit` 1–200 (default 50); the response carries `total`, `count`, `limit`, `offset` |
| `POST /admin/moderation/jobs/{job_id}` | `{ "decision": "publish\|reject", "note": "…" }` — reject adds a strike |
| `GET /admin/employer-reviews` · `POST /admin/employer-reviews/{employer_id}` | "Ditinjau admin" badge requests / decision |
| `GET /admin/orders?status_filter=pending` · `POST /admin/orders/{id}/activate` · `POST /admin/orders/{id}/cancel` | Manual payment activation |
| `GET /admin/questions` · `POST /admin/questions/{id}` | Quiz bank review (`reviewed`, `active`) |
| `GET /admin/metrics` | AI cost per action (from `ai_logs` tokens × Gemini price × USD/IDR), applications by source, interview rate per score band, quiz pass rates, plan revenue, moderation counts |

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
