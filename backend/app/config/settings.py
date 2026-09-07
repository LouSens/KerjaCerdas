"""
KerjaCerdas — application settings.

Every tunable value lives here and is readable from .env.
No model name, weight, or timeout should be hard-coded anywhere else.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # ignore unknown keys in .env
    )

    # ── Application ──────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    # ── Auth ─────────────────────────────────────────────────────────────
    jwt_secret_key: str = ""
    jwt_access_token_expire_minutes: int = 1440

    # ── Phone OTP ────────────────────────────────────────────────────────
    # No SMS/WhatsApp provider is wired in yet. Until one is, /verify/otp/send
    # can only work by handing the code straight back in its own response,
    # which is a demo affordance and nothing else: anyone who can call the
    # endpoint for a phone number also learns the code for it.
    #
    # Leave unset and the mode follows the environment — on outside
    # production, off inside it. Set OTP_DEMO_MODE explicitly to override, so
    # that returning live OTP codes from a production deployment is always a
    # decision someone made on purpose rather than a default nobody noticed.
    otp_demo_mode: bool | None = None

    # ── Admin surfaces ───────────────────────────────────────────────────
    # There is no admin role/authentication layer yet. Routes that expose
    # cross-user data (e.g. partnership inquiries) stay disabled until one
    # exists, rather than being reachable by any authenticated seeker/employer.
    admin_routes_enabled: bool = False

    # ── Gemini / Vertex AI — models ──────────────────────────────────────
    # Auth: either set GEMINI_API_KEY (AI Studio) OR set
    # VERTEX_AI_PROJECT + VERTEX_AI_LOCATION (Vertex AI; uses ADC creds).
    gemini_api_key: str = ""
    vertex_ai_project: str = ""
    vertex_ai_location: str = "us-central1"
    # Gemini Embedding 2 — 3072-dim, MRL-truncatable to 768.
    gemini_embed_model: str = "gemini-embedding-2"
    gemini_embed_dim: int = 768  # must match vector(768) pgvector column; MRL-truncated from 3072
    # Chat / generation — primary + rate-limit fallback chain (free tier RPM in parens):
    #   gemini-3.1-flash-lite (15) → gemini-3.5-flash-lite (15) → gemini-3.6-flash (5, last resort)
    gemini_chat_model: str = "gemini-3.1-flash-lite"
    gemini_chat_fallback_models: list[str] = ["gemini-3.5-flash-lite", "gemini-3.6-flash"]

    # ── Database ─────────────────────────────────────────────────────────
    # Empty string → dev falls back to SQLite under data/
    database_url: str = ""
    # When set, dev server connects to this URL instead of the local dev DB.
    # Useful for testing against production data without a full deployment.
    prod_database_url: str = ""

    # ── JSON store root ──────────────────────────────────────────────────
    kerja_data_root: str = "data"

    # ── Reverse proxy trust ──────────────────────────────────────────────
    # X-Real-IP is only trusted as the client's address when the request also
    # carries this exact shared secret in X-Internal-Proxy-Secret (set by our
    # own Nginx — see frontend/nginx.conf.template) — never based on the
    # direct TCP peer's IP/subnet. docker-compose.prod.yml exposes the
    # backend's port 8000 directly to the internet alongside the Nginx proxy
    # on 3000, and depending on the host's Docker/iptables setup, traffic
    # arriving through a published port can appear to come from inside the
    # container network's own subnet (hairpin NAT) — so an IP/CIDR allowlist
    # cannot reliably tell "this came through our Nginx" from "this hit the
    # API directly", and a wrong allowlist silently opens a rate-limit bypass
    # instead of closing one. A secret only Nginx knows cannot be forged by a
    # client hitting the API port directly, regardless of what address that
    # connection appears to come from.
    #
    # Defaults to empty — trust nothing, X-Real-IP is never read — so every
    # proxied client shares one rate-limit bucket keyed by Nginx's own peer
    # address. That's safe but under-counts distinct clients; set
    # PROXY_SHARED_SECRET (docker-compose.prod.yml, same value in both the
    # `api` and `frontend` services) once you're actually routing browser
    # traffic through Nginx to fix that.
    proxy_shared_secret: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────
    cors_allow_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # ── Matching tuning ──────────────────────────────────────────────────
    # The score formula's per-factor weights (cosine/skill/experience/education/
    # recency) are fixed constants in matcher.py, not settings — see that
    # module's docstring for why they aren't .env-tunable.
    matching_top_k: int = 10
    # Band thresholds for the recruiter shortlist (employer-side). Tunable so
    # they can be calibrated against the real score distribution
    # (see scripts/benchmark_matching.py). Scores are in [0..1].
    band_strong_threshold: float = 0.65
    band_possible_threshold: float = 0.45
    # Below this many active rows, matcher.py scores every row directly
    # instead of prefiltering via pgvector ANN (cosine-only ordering can
    # exclude a candidate the full hybrid formula would otherwise rank well —
    # see SemanticMatcher._job_candidates's docstring). 0 forces the ANN path
    # unconditionally, which is how test_matching_parity.py deliberately
    # exercises it against a tiny seeded dataset.
    matching_full_scan_safe_limit: int = 500

    # ── Agent temperatures ───────────────────────────────────────────────
    advisor_temperature: float = 0.7
    skill_gap_temperature: float = 0.2
    parser_temperature: float = 0.1

    # ── Derived ──────────────────────────────────────────────────────────
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def otp_demo_enabled(self) -> bool:
        """Whether /verify/otp/send may return the code it just generated."""
        if self.otp_demo_mode is not None:
            return self.otp_demo_mode
        return not self.is_production

    @property
    def effective_database_url(self) -> str:
        """Return the DB URL to actually use.

        Priority: PROD_DATABASE_URL > DATABASE_URL > local fallback.
        PROD_DATABASE_URL lets dev connect to the production Neon DB
        without a full deployment.
        """
        if self.prod_database_url:
            return self.prod_database_url
        if self.database_url:
            return self.database_url
        return "postgresql+asyncpg://postgres:postgres@localhost:5432/kerjacerdas"


settings = Settings()
