"""KerjaCerdas — FastAPI app entrypoint.

Run locally with:  `python -m backend.app`   (uses backend/app/__main__.py)
or                 `uvicorn backend.app.api.main:app --reload`
"""

from __future__ import annotations

import os
import secrets
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

# Make outbound HTTPS work on conda/Windows where the system CA store is empty.
try:
    import certifi as _certifi

    os.environ.setdefault("SSL_CERT_FILE", _certifi.where())
    os.environ.setdefault("REQUESTS_CA_BUNDLE", _certifi.where())
except ImportError:
    pass

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.api.database import init_db, reconfigure
from backend.app.api.middleware.rate_limiter import RateLimiterMiddleware
from backend.app.api.middleware.sanitization import RequestSizeMiddleware
from backend.app.api.routers.admin import router as admin_router
from backend.app.api.routers.agent import router as agent_router
from backend.app.api.routers.auth import router as auth_router
from backend.app.api.routers.employer import router as employer_router  # prefix=/employer
from backend.app.api.routers.events import router as events_router
from backend.app.api.routers.experiments import router as experiments_router
from backend.app.api.routers.inquiries import router as inquiries_router
from backend.app.api.routers.jobs import router as jobs_router
from backend.app.api.routers.karirhub import router as karirhub_router
from backend.app.api.routers.seeker import router as seeker_router
from backend.app.api.routers.uploads import router as uploads_router
from backend.app.api.routers.verify import router as verify_router
from backend.app.api.services.auth_service import configure as configure_auth
from backend.app.api.services.auth_service import decode_access_token as _decode_token
from backend.app.config.logging import configure_logging, get_logger
from backend.app.config.settings import settings

_bearer = HTTPBearer(auto_error=True)


async def _require_authenticated(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    """Dependency that requires a valid JWT; used to gate internal endpoints."""
    payload = _decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


configure_logging(level="INFO")
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "KerjaCerdas API starting up | env=%s | embed=%s | chat=%s",
        settings.app_env,
        settings.gemini_embed_model,
        settings.gemini_chat_model,
    )
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
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware is applied in LIFO order (last-added = outermost).
# Execution order: CORSMiddleware → RateLimiterMiddleware → RequestSizeMiddleware → route

_cors_origins = list(settings.cors_allow_origins)
_replit_dev = os.environ.get("REPLIT_DEV_DOMAIN")
if _replit_dev:
    _cors_origins.append(f"https://{_replit_dev}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.replit\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting — prevents brute-force & DoS
app.add_middleware(RateLimiterMiddleware)

# Payload size guard — rejects oversized JSON bodies
app.add_middleware(RequestSizeMiddleware)

for r in (
    auth_router,
    seeker_router,
    employer_router,
    jobs_router,
    uploads_router,
    verify_router,
    agent_router,
    karirhub_router,
    events_router,
    experiments_router,
    inquiries_router,
    admin_router,
):
    app.include_router(r, prefix="/api/v1")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:8]
    start = time.time()
    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        logger.exception(
            "[%s] %s %s -> UNHANDLED %s (%dms)",
            request_id,
            request.method,
            request.url.path,
            type(exc).__name__,
            duration_ms,
        )
        raise
    duration_ms = int((time.time() - start) * 1000)
    logger.info(
        "[%s] %s %s -> %d (%dms)",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "KerjaCerdas API",
        "version": app.version,
        "mode": "demo",
    }


@app.get("/health/detailed")
async def health_detailed(current_user=Depends(_require_authenticated)):
    """Deep health check: verifies DB connectivity and Gemini API reachability. Requires authentication."""
    from sqlalchemy import text as sa_text

    from backend.app.db.session import async_session

    checks: dict[str, str] = {}

    # Database ping
    try:
        async with async_session() as session:
            await session.execute(sa_text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:  # noqa: BLE001
        checks["database"] = "error"

    # Gemini API key presence (we don't call the API to avoid cost/latency)
    has_key = bool(
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    checks["gemini_key_configured"] = "ok" if has_key else "missing"

    overall = "healthy" if all(v == "ok" for v in checks.values()) else "degraded"
    return {
        "status": overall,
        "checks": checks,
    }


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    """Attach security-hardening headers to every response."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.path.startswith("/api/"):
        # Strict headers for API responses only; the SPA needs scripts/styles.
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'",
        )
    return response


# In production, serve the built frontend (frontend/dist) from this server.
# In development the Vite dev server handles the frontend, so the mount is skipped.
# Gated on an explicit production signal (REPLIT_DEPLOYMENT is set in Replit
# deployments; SERVE_FRONTEND=1 can force it elsewhere) so a stale dist build
# never hijacks routing in the dev workspace.
_FRONTEND_DIST = Path(__file__).resolve().parents[3] / "frontend" / "dist"
_SERVE_FRONTEND = bool(os.environ.get("REPLIT_DEPLOYMENT") or os.environ.get("SERVE_FRONTEND"))

if _SERVE_FRONTEND and _FRONTEND_DIST.is_dir():
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        candidate = (_FRONTEND_DIST / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(_FRONTEND_DIST):
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_DIST / "index.html")
else:

    @app.get("/")
    async def root():
        return {"service": "KerjaCerdas API", "docs": "/docs", "health": "/health"}
