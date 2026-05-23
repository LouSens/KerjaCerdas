"""
KerjaCerdas - FastAPI Application
===================================
Main API entrypoint. Exposes all job matching, skill gap, and advisor endpoints.

ANTIGRAVITY PROTOCOL: All endpoints must be typed, documented, and logged.
"""
from __future__ import annotations

import logging
import secrets
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config.settings import Settings, settings
from src.api.database import init_db, reconfigure
from src.api.services.auth_service import configure as configure_auth

# Import our new routers
from src.api.routers.auth import router as auth_router
from src.api.routers.employer import router as employer_router
from src.api.routers.seeker import router as seeker_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_DEFAULT_DATABASE_URL = Settings.model_fields["database_url"].default


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class SeekerProfile(BaseModel):
    """Seeker profile for job matching."""
    seeker_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    skills: list[str]
    experience_years: int = Field(ge=0, le=50)
    education_level: str  # KKNI level
    region_code: str      # BPS wilayah code
    preferred_regions: list[str] = []
    salary_expectation: int = Field(ge=0)
    resume_text: str = ""


class JobPosting(BaseModel):
    """Job posting schema."""
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    region_code: str
    salary_min: int
    salary_max: int
    required_skills: list[str]
    education_min: str
    experience_years_min: int
    description: str
    kbji_code: str = ""


class MatchRequest(BaseModel):
    """Request for job matching."""
    seeker_profile: SeekerProfile
    top_k: int = Field(default=10, ge=1, le=50)
    region_filter: str | None = None


class MatchResult(BaseModel):
    """Single match result."""
    job_id: str
    title: str
    company: str
    match_score: float
    skill_overlap: float
    region_match: bool
    salary_in_range: bool
    explanation: str
    required_skills: list[str] = []
    region_code: str = ""
    region_name: str = ""
    salary_min: int = 0
    salary_max: int = 0
    education_min: str = "S1"
    experience_years_min: int = 0


class MatchResponse(BaseModel):
    """Response from job matching endpoint."""
    request_id: str
    matches: list[MatchResult]
    total_found: int
    processing_time_ms: int


class SkillGapRequest(BaseModel):
    """Request for skill gap analysis."""
    seeker_skills: list[str]
    target_job_id: str | None = None
    target_job_title: str | None = None
    required_skills: list[str] = []


class ChatMessage(BaseModel):
    """Single message in career advisor chat."""
    role: str  # user | assistant
    content: str


class AdvisorRequest(BaseModel):
    """Request to career advisor agent."""
    message: str
    seeker_profile: SeekerProfile
    conversation_history: list[ChatMessage] = []


class CourseRecommendation(BaseModel):
    """Recommended course from skill gap analysis."""
    name: str
    provider: str
    duration: str


class SkillGapResponse(BaseModel):
    """Response from skill gap analysis endpoint."""
    request_id: str
    missing_skills: list[str]
    matching_skills: list[str]
    gap_severity: str
    match_percentage: float
    recommended_courses: list[CourseRecommendation]
    estimated_readiness_months: int
    confidence: float
    summary: str


class AdvisorResponse(BaseModel):
    """Response from career advisor endpoint."""
    request_id: str
    response: str
    agent: str
    confidence: float


class EkycVerificationRequest(BaseModel):
    """Request for e-KYC identity verification (Mock Dukcapil/PSrE)."""
    nik: str = Field(..., min_length=16, max_length=16)
    full_name: str
    date_of_birth: str
    selfie_image_base64: str | None = None


class EkycVerificationResponse(BaseModel):
    """Response from e-KYC verification."""
    request_id: str
    status: str  # e.g., "VERIFIED", "FAILED", "PENDING_MANUAL_REVIEW"
    match_percentage: float
    message: str
    verification_hash: str | None = None
    pii_redacted: bool = True  # generic privacy indicator


class SivilVerificationRequest(BaseModel):
    """Request for diploma verification (Mock SIVIL/Dikti)."""
    ijazah_number: str
    university_name: str
    major: str


class SivilVerificationResponse(BaseModel):
    """Response from diploma verification."""
    request_id: str
    status: str  # e.g., "VERIFIED", "NOT_FOUND"
    message: str
    verified_data: dict | None = None


# ─── Mock Data (Demo Mode) ────────────────────────────────────────────────────

MOCK_JOBS = [
    {
        "job_id": "job-001",
        "title": "Data Analyst",
        "company": "Bank Mandiri",
        "region_code": "3171",  # Jakarta Pusat
        "salary_min": 8000000,
        "salary_max": 15000000,
        "required_skills": ["Python", "SQL", "Excel", "Tableau", "Statistics"],
        "education_min": "S1",
        "experience_years_min": 1,
        "match_score": 0.91,
        "skill_overlap": 0.80,
        "region_match": True,
        "salary_in_range": True,
        "explanation": "Kecocokan tinggi: 4/5 skill sesuai, lokasi Jakarta cocok"
    },
    {
        "job_id": "job-002",
        "title": "Machine Learning Engineer",
        "company": "Gojek",
        "region_code": "3171",
        "salary_min": 15000000,
        "salary_max": 30000000,
        "required_skills": ["Python", "TensorFlow", "PyTorch", "SQL", "Docker"],
        "education_min": "S1",
        "experience_years_min": 2,
        "match_score": 0.84,
        "skill_overlap": 0.60,
        "region_match": True,
        "salary_in_range": True,
        "explanation": "Kecocokan baik: skill Python dan SQL sesuai, perlu belajar PyTorch"
    },
    {
        "job_id": "job-003",
        "title": "Business Intelligence Analyst",
        "company": "Tokopedia",
        "region_code": "3171",
        "salary_min": 10000000,
        "salary_max": 18000000,
        "required_skills": ["SQL", "Python", "Tableau", "Business Analysis"],
        "education_min": "S1",
        "experience_years_min": 1,
        "match_score": 0.79,
        "skill_overlap": 0.75,
        "region_match": True,
        "salary_in_range": True,
        "explanation": "Cocok untuk karier BI: skill analitik kuat, tambah business analysis"
    },
    {
        "job_id": "job-004",
        "title": "Data Engineer",
        "company": "Traveloka",
        "region_code": "3171",
        "salary_min": 12000000,
        "salary_max": 22000000,
        "required_skills": ["Python", "SQL", "Spark", "Kafka", "Airflow"],
        "education_min": "S1",
        "experience_years_min": 2,
        "match_score": 0.72,
        "skill_overlap": 0.40,
        "region_match": True,
        "salary_in_range": True,
        "explanation": "Potensi besar: Python sesuai, perlu belajar ekosistem big data"
    },
    {
        "job_id": "job-005",
        "title": "Software Engineer - Backend",
        "company": "Bukalapak",
        "region_code": "3171",
        "salary_min": 10000000,
        "salary_max": 20000000,
        "required_skills": ["Python", "Go", "PostgreSQL", "Redis", "Docker"],
        "education_min": "S1",
        "experience_years_min": 1,
        "match_score": 0.68,
        "skill_overlap": 0.40,
        "region_match": True,
        "salary_in_range": True,
        "explanation": "Python backend cocok, perlu tambah Go dan infrastructure skills"
    },
]


# ─── App Lifespan ────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("🚀 KerjaCerdas API starting up...")

    # In demo/development, keep the app bootable without a live local Postgres instance.
    database_url = settings.database_url
    if not settings.is_production and database_url == _DEFAULT_DATABASE_URL:
        database_url = "sqlite+aiosqlite:///./kerjacerdas.db"

    logger.info("Startup database selected: %s", database_url)
    reconfigure(database_url)
    await init_db()

    # Configure Auth Service from env; production must provide a stable secret.
    jwt_secret = settings.jwt_secret_key
    if not jwt_secret and settings.is_production:
        raise RuntimeError("JWT_SECRET_KEY must be set")
    if not jwt_secret:
        jwt_secret = secrets.token_urlsafe(32)
        logger.warning(
            "JWT_SECRET_KEY is not set; using an ephemeral development secret. "
            "Tokens will be invalid after restart."
        )

    configure_auth(
        secret_key=jwt_secret,
        expire_minutes=settings.jwt_access_token_expire_minutes,
    )

    # In production: initialize further connections, load ML models, warm up agents
    yield
    logger.info("KerjaCerdas API shutting down...")


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="KerjaCerdas API",
    description="AI-Powered Job Matching Platform for Indonesia",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the newly refactored routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(employer_router, prefix="/api/v1")
app.include_router(seeker_router, prefix="/api/v1")


# ─── Middleware: Request Logging ──────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing."""
    request_id = str(uuid.uuid4())[:8]
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    logger.info(f"[{request_id}] {request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)")
    response.headers["X-Request-ID"] = request_id
    return response


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "KerjaCerdas API",
        "version": "0.1.0",
        "mode": "demo"
    }


# ─── Job Matching Endpoint ────────────────────────────────────────────────────

@app.post("/api/v1/match", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    """
    Match a seeker profile against available job postings.

    Uses bi-encoder BERT model for fast retrieval + cross-encoder for reranking.
    In demo mode: returns mock results with realistic scoring.
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())

    logger.info(f"Match request for seeker {request.seeker_profile.seeker_id}")

    # Demo mode: return mock jobs sorted by match score
    region_names = {
        "3171": "Jakarta Pusat", "3174": "Jakarta Selatan",
        "3573": "Malang", "3578": "Surabaya",
    }
    matches = [
        MatchResult(
            job_id=job["job_id"],
            title=job["title"],
            company=job["company"],
            match_score=job["match_score"],
            skill_overlap=job["skill_overlap"],
            region_match=job["region_match"],
            salary_in_range=job["salary_in_range"],
            explanation=job["explanation"],
            required_skills=job.get("required_skills", []),
            region_code=job.get("region_code", ""),
            region_name=region_names.get(job.get("region_code", ""), job.get("region_code", "")),
            salary_min=job.get("salary_min", 0),
            salary_max=job.get("salary_max", 0),
            education_min=job.get("education_min", "S1"),
            experience_years_min=job.get("experience_years_min", 0),
        )
        for job in sorted(MOCK_JOBS, key=lambda x: x["match_score"], reverse=True)[:request.top_k]
    ]

    processing_time = int((time.time() - start_time) * 1000)

    return MatchResponse(
        request_id=request_id,
        matches=matches,
        total_found=len(matches),
        processing_time_ms=processing_time
    )


# ─── Skill Gap Endpoint ───────────────────────────────────────────────────────

@app.post("/api/v1/skill-gap", response_model=SkillGapResponse)
async def analyze_skill_gap(request: SkillGapRequest):
    """
    Analyze skill gap between seeker's current skills and target job requirements.
    Returns missing skills, matching skills, and recommended learning paths.
    """
    seeker_set = set(s.lower() for s in request.seeker_skills)
    required_set = set(s.lower() for s in request.required_skills)

    matching = list(seeker_set & required_set)
    missing = list(required_set - seeker_set)

    gap_ratio = len(missing) / max(len(required_set), 1)
    severity = "low" if gap_ratio < 0.3 else "medium" if gap_ratio < 0.6 else "high"

    courses = []
    if "pytorch" in missing or "tensorflow" in missing:
        courses.append({"name": "Deep Learning Specialization", "provider": "Coursera", "duration": "3 bulan"})
    if "sql" in missing:
        courses.append({"name": "SQL untuk Analisis Data", "provider": "Dicoding", "duration": "1 bulan"})
    if "docker" in missing:
        courses.append({"name": "Docker & Container Fundamentals", "provider": "Dicoding", "duration": "1 bulan"})
    if not courses:
        courses.append({"name": "Advanced Python Programming", "provider": "Skill Academy", "duration": "2 bulan"})

    return {
        "request_id": str(uuid.uuid4()),
        "missing_skills": missing,
        "matching_skills": matching,
        "gap_severity": severity,
        "match_percentage": round((1 - gap_ratio) * 100, 1),
        "recommended_courses": courses,
        "estimated_readiness_months": len(missing) * 1,
        "confidence": 0.82,
        "summary": f"Kamu sudah memiliki {len(matching)} dari {len(required_set)} skill yang dibutuhkan. "
                   f"Fokus belajar {', '.join(missing[:3])} untuk meningkatkan peluang."
    }


# ─── Career Advisor Endpoint ──────────────────────────────────────────────────

@app.post("/api/v1/advisor", response_model=AdvisorResponse)
async def career_advisor(request: AdvisorRequest):
    """
    AI career advisor powered by Google Gemini.
    Provides personalized career guidance in Bahasa Indonesia.
    """
    try:
        from src.agents.advisor_agent import AdvisorAgent, AdvisorContext

        advisor = AdvisorAgent(demo_mode=True)
        context = AdvisorContext(
            seeker_name=request.seeker_profile.name,
            seeker_skills=request.seeker_profile.skills,
            seeker_experience_years=request.seeker_profile.experience_years,
            seeker_region=request.seeker_profile.region_code,
        )

        result = await advisor.advise(request.message, context)

        return {
            "request_id": result.request_id,
            "response": result.response_text,
            "agent": result.agent,
            "confidence": result.confidence,
        }

    except Exception as e:
        logger.error(f"Advisor agent error: {e}")
        raise HTTPException(status_code=500, detail="Advisor agent unavailable")


# ─── Jobs Listing Endpoint ────────────────────────────────────────────────────

@app.get("/api/v1/jobs")
async def list_jobs(limit: int = 10, region: str | None = None):
    """List available job postings, optionally filtered by region."""
    jobs = MOCK_JOBS[:limit]
    return {"jobs": jobs, "total": len(jobs)}


# ─── Verification Endpoints (e-KYC & SIVIL) ───────────────────────────────────

@app.post("/api/v1/verify/identity", response_model=EkycVerificationResponse)
async def verify_identity(request: EkycVerificationRequest):
    """
    Mock e-KYC integration with Dukcapil/PSrE to verify candidate identity.
    Simulates checking NIK and identity metadata using demo-only rules.
    """
    from src.api.services.identity_verifier import MockIdentityVerificationService

    verification_result = MockIdentityVerificationService.verify_identity(
        nik=request.nik,
        full_name=request.full_name
    )

    return EkycVerificationResponse(
        request_id=str(uuid.uuid4()),
        status="VERIFIED" if verification_result["is_valid"] else "FAILED",
        match_percentage=verification_result["match_score"],
        message="Identitas berhasil diverifikasi pada mode demo."
        if verification_result["is_valid"]
        else "Verifikasi identitas gagal pada mode demo.",
        verification_hash=verification_result["verification_hash"],
        pii_redacted=verification_result["pii_redacted"]
    )


@app.post("/api/v1/verify/education", response_model=SivilVerificationResponse)
async def verify_education(request: SivilVerificationRequest):
    """
    Mock integration with SIVIL (Sistem Informasi Verifikasi Ijazah Elektronik)
    to verify candidate's university degree authenticity.
    """
    # Demo logic: if ijazah number is empty or "0000", simulate not found.
    is_valid = request.ijazah_number and request.ijazah_number != "0000"
    
    verified_data = None
    if is_valid:
        verified_data = {
            "university": request.university_name,
            "major": request.major,
            "graduation_year": "2023",
            "degree": "S1",
            "status": "Lulus"
        }
        
    return SivilVerificationResponse(
        request_id=str(uuid.uuid4()),
        status="VERIFIED" if is_valid else "NOT_FOUND",
        message="Ijazah terdaftar resmi di SIVIL (Kemdikbudristek)." if is_valid else "Nomor Ijazah tidak ditemukan di database SIVIL.",
        verified_data=verified_data
    )
