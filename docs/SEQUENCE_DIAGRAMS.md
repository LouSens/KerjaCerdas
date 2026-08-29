# KerjaCerdas — Sequence Diagrams

Common workflows documented as Mermaid sequence diagrams.

## Table of Contents

1. [User Registration](#1-user-registration)
2. [User Login with Rate Limiting](#2-user-login-with-rate-limiting)
3. [AI Agent Invoke with Input Sanitization](#3-ai-agent-invoke-with-input-sanitization)
4. [JWT-Protected Endpoint Access](#4-jwt-protected-endpoint-access)
5. [CV Upload & Profile Extraction](#5-cv-upload--profile-extraction)
6. [Employer Posts a Job](#6-employer-posts-a-job)
7. [E-KYC Identity & Education Verification](#7-e-kyc-identity--education-verification)

---

## 1. User Registration

```mermaid
sequenceDiagram
    actor U as User (Browser)
    participant F as Frontend (React)
    participant RL as RateLimiterMiddleware
    participant SZ as SanitizationMiddleware
    participant AR as Auth Router
    participant DB as PostgreSQL
    participant JS as JSON Store

    U->>F: Fill registration form (name, email, password, role)
    F->>F: Client-side validation (Zod schema)
    F->>RL: POST /api/v1/auth/register
    RL->>RL: Check IP: max 10 req/60s
    alt Rate limit exceeded
        RL-->>F: 429 Too Many Requests + Retry-After header
        F-->>U: Show "Too many attempts" toast
    end
    RL->>SZ: Forward request
    SZ->>SZ: Check Content-Length ≤ 10MB
    SZ->>AR: Forward validated request
    AR->>AR: Pydantic validates UserRegisterRequest<br/>(email format, password strength, role enum)
    alt Validation fails
        AR-->>F: 422 Unprocessable Entity
        F-->>U: Show field-level error
    end
    AR->>AR: bcrypt.hashpw(password)
    AR->>DB: INSERT user (email, name, password_hash, role)
    alt Email already exists (IntegrityError)
        DB-->>AR: IntegrityError
        AR-->>F: 400 User already exists
        F-->>U: Show error message
    end
    DB-->>AR: new_user (id, email, role)
    AR->>JS: upsert JsonUser + Employer profile (if role=employer)
    AR->>AR: jwt.encode(payload, SECRET_KEY)
    AR-->>F: 201 {access_token, user: {id, name, email, role}}
    F->>F: Zustand: setAuth(token, user)
    F->>F: localStorage.setItem('kerjacerdas-v3', ...)
    F-->>U: Redirect to Dashboard
```

---

## 2. User Login with Rate Limiting

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant RL as RateLimiter (10 req/60s)
    participant AR as Auth Router
    participant DB as PostgreSQL

    U->>F: Enter email + password, click Login
    loop Up to 10 attempts within 60 seconds
        F->>RL: POST /api/v1/auth/login
        RL->>RL: Sliding window: count(ip, path) in last 60s
        alt Count ≥ 10
            RL-->>F: 429 {detail: "Too many requests"}<br/>Retry-After: Ns
            F-->>U: Show rate-limit warning + countdown
        end
        RL->>AR: Forward request
        AR->>DB: SELECT user WHERE email = ?
        alt User not found
            AR-->>F: 401 Invalid email or password
        end
        AR->>AR: bcrypt.checkpw(password, hash)
        alt Wrong password
            AR-->>F: 401 Invalid email or password
        end
        alt Account inactive
            AR-->>F: 400 User account is inactive
        end
        AR->>AR: create_access_token(user_id, role, name, email)
        AR-->>F: 200 {access_token, user}
        F->>F: Zustand: setAuth(token, user)
        F-->>U: Redirect to Dashboard
    end
```

---

## 3. AI Agent Invoke with Input Sanitization

```mermaid
sequenceDiagram
    actor S as Seeker
    participant F as Frontend
    participant RL as RateLimiter (20 req/60s)
    participant DP as Dependencies (JWT guard)
    participant AG as Agent Router
    participant SN as sanitize_text()
    participant LG as LangGraph / Gemini
    participant DB as JSON Store (Jobs, Seekers)

    S->>F: Type message in FloatingAdvisor chat
    F->>RL: POST /api/v1/agent/invoke<br/>{user_message, seeker_id, explicit_intent}
    RL->>RL: Sliding window check (20/60s per IP)
    RL->>AG: Forward
    AG->>SN: sanitize_text(user_message, max=2000)
    SN->>SN: Truncate → strip control chars → HTML-escape<br/>→ check injection patterns
    alt Injection detected
        SN-->>AG: raise HTTPException 422
        AG-->>F: 422 {detail: "Input contains disallowed content"}
        F-->>S: Show error toast
    end
    AG->>DB: Resolve seeker profile (by seeker_id or inline)
    AG->>DB: Load all job postings
    AG->>LG: ainvoke({messages: [("user", sanitized_context)]})
    LG->>LG: ReAct agent: route intent → tool call (e.g. SemanticMatcher)
    LG->>LG: Token Efficiency Gate: Check if top_cosine < 0.10. If yes, skip LLM.
    LG-->>AG: {messages: [...], intent, matches}
    AG->>AG: Hallucination Guard: Verify match job_ids exist in DB. Drop invalid.
    AG->>AG: Enrich valid matches with job metadata + employer names
    AG-->>F: 200 AgentInvokeResponse
    F-->>S: Render job cards + AI response
```

---

## 4. JWT-Protected Endpoint Access

```mermaid
sequenceDiagram
    actor C as Client (Seeker/Employer)
    participant F as Frontend
    participant SH as SecurityHeadersMiddleware
    participant DP as get_current_user()
    participant R as Protected Router
    participant DB as PostgreSQL

    C->>F: Navigate to protected view (e.g., Dashboard)
    F->>F: _authHeader() → read token from localStorage
    F->>SH: GET /api/v1/seeker/profile<br/>Authorization: Bearer <jwt>
    SH->>DP: Forward
    DP->>DP: oauth2_scheme → extract Bearer token
    DP->>DP: jwt.decode(token, SECRET_KEY)
    alt Token expired
        DP-->>F: 401 Could not validate credentials
        F->>F: useStore.logout() → clear localStorage
        F-->>C: Redirect to Landing page
    end
    alt Token invalid / tampered
        DP-->>F: 401 Could not validate credentials
        F-->>C: Show auth error
    end
    DP->>DB: SELECT user WHERE id = payload["sub"]
    alt User not found or inactive
        DP-->>F: 401 / 400
        F-->>C: Show error
    end
    DP->>R: Inject current_user
    R->>R: role check (require_seeker / require_employer)
    alt Wrong role
        R-->>F: 403 Employer access required
        F-->>C: Show permission error
    end
    R-->>F: 200 + payload
    SH->>SH: Attach security headers<br/>(X-Content-Type-Options, X-Frame-Options, CSP)
    F-->>C: Render protected content
```

---

## 5. CV Upload & Profile Extraction

```mermaid
sequenceDiagram
    actor S as Seeker
    participant F as Frontend
    participant RL as RateLimiter (10 req/60s)
    participant UP as Uploads Router
    participant SZ as sanitize_filename()
    participant GM as Gemini API (PDF extraction)
    participant DB as JSON Store

    S->>F: Drop PDF file on CVUploader
    F->>F: Validate: file.type === 'application/pdf'<br/>file.size ≤ 10MB
    F->>RL: POST /api/v1/uploads/cv (multipart/form-data)
    RL->>UP: Forward after rate-limit check
    UP->>SZ: sanitize_filename(file.filename)
    UP->>UP: Validate MIME type (must be PDF)
    UP->>UP: PyMuPDF → extract raw text
    UP->>GM: Send text + extraction prompt
    GM-->>UP: Structured JSON (skills, experience, education)
    UP->>DB: upsert SeekerProfile with extracted data
    UP-->>F: 200 {seeker_id, skills_count}
    F-->>S: Show "Profile updated" + skill badges
```

---

## 6. Employer Posts a Job

```mermaid
sequenceDiagram
    actor E as Employer
    participant F as Frontend
    participant RL as RateLimiter
    participant DP as require_employer()
    participant EP as Employer Router
    participant DB as JSON Store
    participant SM as SemanticMatcher (embed)

    E->>F: Fill job form (title, skills, salary, etc.)
    F->>RL: POST /api/v1/employer/jobs
    RL->>DP: Forward (after rate-limit OK)
    DP->>DP: Verify JWT + role == "employer"
    alt Not employer
        DP-->>F: 403 Employer access required
    end
    DP->>EP: Inject current_user
    EP->>EP: Validate JobCreate schema (Pydantic)
    EP->>SM: embed_job(job_posting) → pgvector embedding
    EP->>DB: upsert JobPosting
    EP-->>F: 201 {job_id, title}
    F-->>E: Show success toast + update jobs list
```

---

## 7. E-KYC Identity & Education Verification

```mermaid
sequenceDiagram
    actor S as Seeker
    participant F as Frontend (VerificationDashboard)
    participant VR as Verify Router (/api/v1/verify)
    participant ID as MockIdentityVerificationService
    participant SI as SIVIL Mock (Kemdikbud)
    participant DJ as DJP Online Mock (NPWP)

    note over F,VR: All data handling complies with UU PDP No.27/2022<br/>NIK is hashed via SHA-256; raw identity numbers are never stored in plaintext

    %% Step 1 — KTP Identity
    S->>F: Enter NIK (16 digits) + Full Name + optional selfie
    F->>F: Validate NIK length === 16, name non-empty
    F->>VR: POST /api/v1/verify/identity<br/>{nik, full_name, date_of_birth, selfie_image_base64}
    VR->>VR: Compute SHA-256 hash of NIK
    VR->>ID: verify_identity(nik, full_name)
    ID->>ID: Fuzzy-match name against registry<br/>Compute match_score (0–1)
    alt Match score ≥ 0.7
        ID-->>VR: {is_valid: true, match_score, verification_hash, pii_redacted: true}
        VR->>DB: Update SeekerProfile (nik=nik_hash, nik_verified='verified')
        VR-->>F: 200 {status: "VERIFIED", match_percentage: 0.97, verification_hash}
        F-->>S: Show green "Identitas Terverifikasi ✓" badge
    else Match failed
        ID-->>VR: {is_valid: false, match_score}
        VR-->>F: 200 {status: "FAILED", message: "Verifikasi identitas gagal."}
        F-->>S: Show red "Gagal" badge + retry prompt
    end

    %% Step 2 — Ijazah / Education
    S->>F: Enter Ijazah Number + University + Major
    F->>VR: POST /api/v1/verify/education<br/>{ijazah_number, university_name, major}
    VR->>SI: Query SIVIL registry (mock)
    alt Ijazah found & valid
        SI-->>VR: {ok: true, graduation_year, degree, status: "Lulus"}
        VR-->>F: 200 {status: "VERIFIED", verified_data: {university, major, degree}}
        F-->>S: Show "Ijazah Terverifikasi ✓"
    else Not found (ijazah_number == "0000" or empty)
        SI-->>VR: {ok: false}
        VR-->>F: 200 {status: "NOT_FOUND", message: "Ijazah tidak ditemukan."}
        F-->>S: Show warning
    end

    %% Step 3 — NPWP (Employer only)
    note over S,DJ: NPWP verification is used by Employer accounts
    S->>F: Enter NPWP (15 numeric digits) + Company Name
    F->>VR: POST /api/v1/verify/npwp<br/>{npwp, company_name}
    VR->>DJ: Validate NPWP format (15 digits, non-zero)
    alt Valid NPWP
        DJ-->>VR: {ok: true, status: "AKTIF", valid_until: "2027-12-31"}
        VR-->>F: 200 {status: "VERIFIED", verified_data: {npwp, company_name, status}}
        F-->>S: Show "NPWP Terverifikasi ✓" + DJP badge
    else Invalid format or blacklisted
        DJ-->>VR: {ok: false}
        VR-->>F: 200 {status: "NOT_FOUND"}
        F-->>S: Show error
    end

    %% Document registry
    S->>F: View verified documents panel
    F->>VR: GET /api/v1/verify/documents
    VR-->>F: {encryption: "AES-256-GCM", compliance: ["UU-PDP-2022","ISO-27001"], documents: [...]}
    F-->>S: Render privacy promise row with masked file_id
```
