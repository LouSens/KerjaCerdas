# KerjaCerdas API Specification

> **ANTIGRAVITY PROTOCOL §3.1 RULE-04** — Schema defined BEFORE implementation.
> All endpoints are documented here and implemented in `src/api/main.py`.

Infrastruktur API KerjaCerdas direkayasa khusus untuk memitigasi latensi pemrosesan data pelamar berskala masif. Spesifikasi ini mendemonstrasikan bagaimana rute pangkalan data yang dieksekusi secara asinkron (*asynchronous endpoints*) mampu mereduksi *Time-to-Shortlist* HRD dari ukuran hari menjadi milidetik. Desain arsitektural ini memampukan platform untuk secara andal melayani hingga 50.000 kueri aktif harian pada fase adopsi awal, memastikan kelancaran alur integrasi B2B tanpa terhalang *bottleneck* performa.

## Base URL

```
Development: http://localhost:8000
Production:  https://api.kerjacerdas.id
```

## Authentication

Demo mode: No authentication required.
Production: Bearer token via `Authorization: Bearer <token>` header.

---

## Endpoints

### `GET /health`

System health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "KerjaCerdas API",
  "version": "0.1.0",
  "mode": "demo"
}
```

---

### `POST /api/v1/match`

Match a seeker profile against available job postings.

**Request Body:**
```json
{
  "seeker_profile": {
    "name": "Budi Santoso",
    "skills": ["Python", "SQL", "Excel"],
    "experience_years": 1,
    "education_level": "S1",
    "region_code": "3171",
    "preferred_regions": ["3171", "3172"],
    "salary_expectation": 12000000,
    "resume_text": ""
  },
  "top_k": 10,
  "region_filter": "3171"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "matches": [
    {
      "job_id": "job-001",
      "title": "Data Analyst",
      "company": "Bank Mandiri",
      "match_score": 0.91,
      "skill_overlap": 0.80,
      "region_match": true,
      "salary_in_range": true,
      "explanation": "Kecocokan tinggi: 4/5 skill sesuai"
    }
  ],
  "total_found": 5,
  "processing_time_ms": 142
}
```

---

### `POST /api/v1/skill-gap`

Analyze skill gap between seeker and target job.

**Request Body:**
```json
{
  "seeker_skills": ["Python", "SQL", "Excel"],
  "target_job_id": "job-002",
  "target_job_title": "Machine Learning Engineer",
  "required_skills": ["Python", "TensorFlow", "PyTorch", "SQL", "Docker"]
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "missing_skills": ["tensorflow", "pytorch", "docker"],
  "matching_skills": ["python", "sql"],
  "gap_severity": "high",
  "match_percentage": 40.0,
  "recommended_courses": [
    {
      "name": "Deep Learning Specialization",
      "provider": "Coursera",
      "duration": "3 bulan"
    }
  ],
  "estimated_readiness_months": 3,
  "confidence": 0.82,
  "summary": "Kamu sudah memiliki 2 dari 5 skill yang dibutuhkan."
}
```

---

### `POST /api/v1/advisor`

AI career advisor chat endpoint.

**Request Body:**
```json
{
  "message": "Karier apa yang cocok untuk saya?",
  "seeker_profile": { "...SeekerProfile schema..." },
  "conversation_history": [
    { "role": "assistant", "content": "Halo! Mau tanya apa?" }
  ]
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "response": "Berdasarkan profil kamu...",
  "agent": "advisor_agent",
  "confidence": 0.88
}
```

---

### `GET /api/v1/jobs`

List available job postings.

**Query Parameters:**
- `limit` (int, default 10, max 50)
- `region` (string, optional, BPS region code)

**Response:**
```json
{
  "jobs": [ "...JobPosting objects..." ],
  "total": 5
}
```

---

## Error Handling

All errors return:
```json
{
  "detail": "Human-readable error message",
  "status_code": 400
}
```

## Middleware

- **CORS:** Enabled for frontend communication
- **Request logging:** All requests logged with UUID, method, path, status, latency
- **X-Request-ID:** Added to all response headers for tracing
