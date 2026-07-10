# KerjaCerdas API Specification

> **Schema-first contract** — Every endpoint here corresponds 1-to-1 with a FastAPI router in `backend/app/api/routers/`.
> Interactive Swagger UI is available at `http://localhost:8000/docs` when the server is running.

Infrastruktur API KerjaCerdas direkayasa khusus untuk memitigasi latensi pemrosesan data pelamar berskala masif. Spesifikasi ini mendemonstrasikan bagaimana rute pangkalan data yang dieksekusi secara asinkron (*asynchronous endpoints*) mampu mereduksi *Time-to-Shortlist* HRD dari ukuran hari menjadi milidetik. Desain arsitektural ini memampukan platform untuk secara andal melayani hingga 50.000 kueri aktif harian pada fase adopsi awal, memastikan kelancaran alur integrasi B2B tanpa terhalang *bottleneck* performa.

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

| Layer | Class | Policy |
|---|---|---|
| **Rate Limiter** | `RateLimiterMiddleware` | Sliding window per IP — auth: 10 req/60s · agent: 20 req/60s · uploads: 10 req/60s |
| **Sanitization** | `SanitizationMiddleware` | Rejects `Content-Length > 10 MB`; strips control characters |
| **Security Headers** | `SecurityHeadersMiddleware` | Attaches `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` |
| **CORS** | `CORSMiddleware` | Enabled for frontend origin |
| **Request Logging** | Internal | Every request logged with UUID, method, path, status, latency ms |

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
  "version": "0.3.0",
  "mode": "demo"
}
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

> `role` must be `"seeker"` or `"employer"`.

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
| `limit` | int | 20 | Max items to return (max 50) |
| `offset` | int | 0 | Pagination offset |
| `region` | string | — | BPS region code filter |
| `q` | string | — | Full-text search on title & description |
| `job_type` | string | — | Work type filter (e.g. `full_time`) |
| `experience_min` | int | — | Max years of experience required |
| `remote_allowed` | bool | — | Filter remote-friendly roles |
| `salary_min` | int | — | Minimum salary (IDR) |

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
      "experience_years_min": 1
    }
  ]
}
```

---

### `GET /api/v1/jobs/{job_id}`

Return a single job posting by ID.

**Response `200`:** Full `JobPosting` object.
**Response `200 {error: "not_found"}`:** Job does not exist.

---

## Agent Router — `/api/v1/agent`

Rate limited: **20 req / 60 s per IP**. Auth optional (anonymous seeker created automatically if no `seeker_id` provided).

### `POST /api/v1/agent/invoke`

Unified AI agent entry point. Routes to `SearchJobs`, `ResumeReview`, or `SkillGap` sub-agents based on message intent. Input is sanitized via `sanitize_text()` (max 2000 chars, HTML-escaped, injection patterns blocked).

**Seeker resolution cascade (never returns 400):**
1. `seeker_id` found in store → use it.
2. `seeker_id` stale/missing → fall through to inline `seeker`.
3. Neither → create anonymous seeker (`region_code: "3171"`).

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
    "region": "3171",
    "salary_min": 10000000
  }
}
```

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
      "url": "https://dicoding.com/...",
      "duration_weeks": 4
    }
  ]
}
```

**Errors:** `422` input contains disallowed content (injection detected) · `429` rate limited.

---

## Seeker Router — `/api/v1/seeker`

🔒 **Auth required** — JWT with `role = "seeker"`.

### `GET /api/v1/seeker/profile`

Return the logged-in seeker's profile.

**Response `200`:** Full `SeekerProfile` object.
**Response `404`:** Profile not yet created.

---

### `POST /api/v1/seeker/profile`

Create or overwrite seeker profile. Re-embeds the profile vector via Gemini Embeddings on every call. Automatically creates or updates `GamificationStats` (awards `profile_complete` badge + 100 XP if skills provided).

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

### `GET /api/v1/seeker/gamification`

Return XP, level, streak, badges, and completed quests for the logged-in seeker.

```json
{
  "xp": 350,
  "level": 2,
  "streak_days": 5,
  "badges": ["profile_complete", "first_apply"],
  "quests_completed": ["upload_cv", "apply_3_jobs"]
}
```

---

### `POST /api/v1/seeker/bookmarks` · `GET /api/v1/seeker/bookmarks` · `DELETE /api/v1/seeker/bookmarks/{job_id}`

Save, list, or remove a saved job. Awards XP on apply actions.

**Save Request:** `{ "job_id": "job-001" }`
**Save Response `201`:** `{ "id": "uuid", "job_id": "job-001", "status": "saved" }`

---

### `POST /api/v1/seeker/apply`

Submit a job application (idempotent — returns existing record if already applied).

**Request:** `{ "job_id": "job-001", "cover_letter": "..." }`
**Response `201`:** `{ "application_id": "uuid", "job_id": "job-001", "status": "applied", "already_applied": false }`

Awards 50 XP and `first_apply` badge on first submission.

---

### `GET /api/v1/seeker/applications`

Return all job applications for the logged-in seeker with job and employer metadata.

```json
[
  {
    "application_id": "uuid",
    "job_id": "job-001",
    "title": "Data Analyst",
    "company": "Bank Mandiri",
    "status": "applied",
    "applied_at": "2026-06-25T10:00:00+07:00"
  }
]
```

---

## Uploads Router — `/api/v1/uploads`

🔒 **Auth required**. Rate limited: **10 req / 60 s per IP**.

### `POST /api/v1/uploads/cv`

Upload a PDF CV. Extracts text via **PyMuPDF**, sends to **Gemini API** for structured extraction, and upserts the seeker profile.

- Max file size: **10 MB** (enforced by `SanitizationMiddleware`)
- Accepted MIME type: `application/pdf` only
- Filename sanitized via `sanitize_filename()` before storage

**Request:** `multipart/form-data` with field `file` (PDF).

**Response `200`:**
```json
{ "seeker_id": "uuid", "skills_count": 12 }
```

**Errors:** `422` invalid MIME type · `429` rate limited.

---

## Employer Router — `/api/v1/employer`

🔒 **Auth required** — JWT with `role = "employer"`.

### `GET /api/v1/employer/profile` · `PUT /api/v1/employer/profile`

Get or update the employer company profile (company name, industry, size, logo URL, NPWP).

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
  "experience_years_min": 3
}
```

**Response `201`:** `{ "job_id": "uuid", "title": "Senior Backend Engineer" }`

Job is automatically embedded via `embed_job()` (pgvector) upon creation.

---

### `GET /api/v1/employer/jobs/{job_id}/candidates`

Return AI-ranked candidates for a specific job posting. Uses `ResumeReviewAgent` shortlist. Applies *teaser method*: email/phone fields censored until employer unlocks contact.

---

### `POST /api/v1/employer/jobs/{job_id}/unlock/{seeker_id}`

Unlock full contact details for a candidate (Pay-to-Unlock monetization gate — returns `402 Payment Required` in production mode).

---

## Verification Router — `/api/v1/verify`

Identity and credential verification (mock E-KYC in demo mode, real API in production).

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

Verify KTP identity via mock Dukcapil E-KYC.

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
  "status": "VERIFIED",
  "match_percentage": 0.97,
  "verification_hash": "sha256:...",
  "pii_redacted": true,
  "message": "Identitas terverifikasi (mode demo)."
}
```

---

### `POST /api/v1/verify/education`

Verify academic diploma via mock SIVIL Kemdikbud.

**Request:** `{ "ijazah_number": "...", "university_name": "...", "major": "..." }`

**Response `200`:**
```json
{
  "request_id": "uuid",
  "status": "VERIFIED",
  "message": "Ijazah terverifikasi di SIVIL.",
  "verified_data": {
    "university": "Universitas Indonesia",
    "major": "Ilmu Komputer",
    "graduation_year": "2023",
    "degree": "S1",
    "status": "Lulus"
  }
}
```

---

### `POST /api/v1/verify/npwp`

Verify company NPWP via mock DJP Online.

**Request:** `{ "npwp": "12.345.678.9-012.000", "company_name": "PT Contoh" }`

**Response `200`:** `{ "request_id": "uuid", "status": "VERIFIED", "verified_data": { ... } }`
