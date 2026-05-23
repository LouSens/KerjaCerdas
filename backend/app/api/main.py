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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.database import init_db, reconfigure
from backend.app.api.routers.admin import router as admin_router
from backend.app.api.routers.agent import router as agent_router
from backend.app.api.routers.auth import router as auth_router
from backend.app.api.routers.employer import router as employer_router  # prefix=/employer
from backend.app.api.routers.jobs import router as jobs_router
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

    # Auto-seed demo data on first boot (idempotent — upsert semantics mean
    # running this on a populated store is safe and fast).
    await _maybe_seed()

    yield
    logger.info("KerjaCerdas API shutting down")


async def _maybe_seed() -> None:
    """Seed demo jobs/seekers/employers if the store is empty."""
    from backend.app.db.json_store import get_repositories
    try:
        repos = get_repositories()
        jobs = await repos.jobs.list()
        if jobs:
            logger.info("JSON store has %d job(s) — skipping auto-seed.", len(jobs))
            return
        logger.info("Empty store detected — running demo seed…")
        from scripts.seed_json import main as seed_main
        await seed_main()
        logger.info("Demo seed complete.")
    except Exception as exc:
        logger.warning("Auto-seed failed (non-fatal): %s", exc)


app = FastAPI(
    title="KerjaCerdas API",
    description="AI-powered job-matching platform for Indonesia",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth_router, seeker_router, employer_router, jobs_router,
          uploads_router, verify_router, agent_router, admin_router):
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


@app.get("/")
async def root():
    return {"service": "KerjaCerdas API", "docs": "/docs", "health": "/health"}
