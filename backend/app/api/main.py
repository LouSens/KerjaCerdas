"""KerjaCerdas — FastAPI app entrypoint.

Run locally with:  `python -m backend.app`   (uses backend/app/__main__.py)
or                 `uvicorn backend.app.api.main:app --reload`
"""
from __future__ import annotations

import logging
import os
import secrets
import time
import uuid
from contextlib import asynccontextmanager

# Make outbound HTTPS work on conda/Windows where the system CA store is empty.
try:
    import certifi as _certifi
    os.environ.setdefault("SSL_CERT_FILE", _certifi.where())
    os.environ.setdefault("REQUESTS_CA_BUNDLE", _certifi.where())
except ImportError:
    pass

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.middleware.rate_limiter import RateLimiterMiddleware
from backend.app.api.middleware.sanitization import RequestSizeMiddleware

from backend.app.api.database import init_db, reconfigure
from backend.app.api.routers.agent import router as agent_router
from backend.app.api.routers.auth import router as auth_router
from backend.app.api.routers.employer import router as employer_router  # prefix=/employer
from backend.app.api.routers.jobs import router as jobs_router
from backend.app.api.routers.karirhub import router as karirhub_router
from backend.app.api.routers.seeker import router as seeker_router
from backend.app.api.routers.uploads import router as uploads_router
from backend.app.api.routers.verify import router as verify_router
from backend.app.api.services.auth_service import configure as configure_auth
from backend.app.config.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("KerjaCerdas API starting up | env=%s | embed=%s | chat=%s",
                settings.app_env, settings.gemini_embed_model, settings.gemini_chat_model)
    reconfigure(settings.effective_database_url)
    await init_db()

    jwt_secret = settings.jwt_secret_key or secrets.token_urlsafe(32)
    if not settings.jwt_secret_key and settings.is_production:
        raise RuntimeError("JWT_SECRET_KEY must be set in production")
    if not settings.jwt_secret_key:
        logger.warning("JWT_SECRET_KEY missing — using ephemeral dev secret")
    configure_auth(secret_key=jwt_secret, expire_minutes=settings.jwt_access_token_expire_minutes)



    yield
    logger.info("KerjaCerdas API shutting down")





app = FastAPI(
    title="KerjaCerdas API",
    description="AI-powered job-matching platform for Indonesia",
    version="0.3.0",
    lifespan=lifespan,
)

# Middleware is applied in LIFO order (last-added = outermost).
# Execution order: CORSMiddleware → RateLimiterMiddleware → RequestSizeMiddleware → route

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting — prevents brute-force & DoS
app.add_middleware(RateLimiterMiddleware)

# Payload size guard — rejects oversized JSON bodies
app.add_middleware(RequestSizeMiddleware)

for r in (auth_router, seeker_router, employer_router, jobs_router,
          uploads_router, verify_router, agent_router, karirhub_router):
    app.include_router(r, prefix="/api/v1")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:8]
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    logger.info("[%s] %s %s -> %d (%dms)",
                request_id, request.method, request.url.path, response.status_code, duration_ms)
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "KerjaCerdas API", "version": app.version, "mode": "demo"}


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    """Attach security-hardening headers to every response."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'none'; frame-ancestors 'none'",
    )
    return response


@app.get("/")
async def root():
    return {"service": "KerjaCerdas API", "docs": "/docs", "health": "/health"}
