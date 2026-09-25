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

    # ── Email OTP ────────────────────────────────────────────────────────
    # Email verification codes are sent through Resend's HTTP API when
    # RESEND_API_KEY is set (free tier: 3,000 emails/month). Without a key,
    # /verify/email/send can only hand the code back in its own response —
    # a demo affordance, allowed only while OTP demo mode is on.
    #
    # Leave OTP_DEMO_MODE unset and it follows the environment — on outside
    # production, off inside it — so returning live codes from production is
    # always an explicit decision.
    otp_demo_mode: bool | None = None
    resend_api_key: str = ""
    email_from: str = "KerjaCerdas <no-reply@kerjacerdas.tech>"

    # ── Admin surfaces ───────────────────────────────────────────────────
    # Admin = an authenticated account whose email is in ADMIN_EMAILS, and
    # only while ADMIN_ROUTES_ENABLED is on. Admins review held job postings,
    # "Ditinjau admin" requests and activate manually-paid plan orders.
    admin_routes_enabled: bool = False
    admin_emails: list[str] = []

    # ── Trust & moderation ───────────────────────────────────────────────
    # Hold an employer's first posting for admin review unless the employer
    # has a verified company-domain email or the "Ditinjau admin" badge.
    moderation_first_job_review: bool = True
    # Distinct candidate reports that automatically hide a job for review.
    # Kept for the admin view's wording only. The automatic threshold is now a
    # WEIGHTED score (services/trust/rules.FLAG_WEIGHT_THRESHOLD), because a
    # count of accounts measures coordination, not harm.
    moderation_report_threshold: int = 3

    # ── Plans (prices in IDR) ────────────────────────────────────────────
    plan_price_beacon: int = 49_000  # per job, 30 days
    plan_price_lighthouse: int = 149_000  # per 30 days, up to 5 active jobs
    plan_price_prism: int = 15_000  # seeker, per 30 days
    # 0 = no cap. Ranked applicants are uncapped on every tier: the ranking is
    # a free computation, so capping it never saved us money, it only hid
    # candidates from the employer who asked for them. The paywall moved to
    # reverse matching (plans.talent_search_limit), which is sourcing.
    spark_ranked_applicant_limit: int = 0
    # Enforce plan limits (Spark: 1 active job, 20 ranked applicants; premium
    # features need Beacon/Lighthouse). Switchable for live demos / tests.
    plan_limits_enforced: bool = True
    # Employer paid plans (Beacon / Lighthouse). Off: every employer feature is
    # free and uncapped — all applicants ranked, interview kit, CSV, any number
    # of active jobs (the AutoMod strike limit still applies) — and the plans
    # are not sold. The seeker plan (Prism) and advisor metering are unaffected.
    # The gating code stays so a deployment can bring the plans back.
    employer_plans_enabled: bool = False
    # DEMO: every quota and rate limit off — advisor messages, plan limits,
    # candidate-search allowance and the per-IP rate limiter (a booth puts
    # every visitor's phone behind ONE venue IP). ON by default for the
    # DIGDAYA demo. Set DEMO_UNLIMITED=false for any public deployment:
    # unmetered advisor chat is unmetered Gemini spend, and the rate limiter
    # is also the login brute-force guard.
    demo_unlimited: bool = True
    # Shown on the payment screen until a payment gateway is live.
    payment_instructions: str = (
        "Bayar via QRIS / transfer bank ke rekening KerjaCerdas, lalu kirim bukti "
        "dengan kode pesanan sebagai berita transfer. Admin mengaktifkan paket "
        "setelah pembayaran dicek."
    )

    # ── Cost reporting (admin metrics) ───────────────────────────────────
    # USD per 1M tokens (input, output), from ai.google.dev/gemini-api/docs/pricing.
    # gemini-3.1-flash-lite is not on the public list, so it is priced at the
    # listed 3.5 Flash-Lite rate as a conservative proxy.
    ai_prices_usd_per_million: dict[str, tuple[float, float]] = {
        "gemini-3.1-flash-lite": (0.30, 2.50),
        "gemini-3.5-flash-lite": (0.30, 2.50),
        "gemini-3.6-flash": (0.75, 3.75),
        "gemini-2.5-flash-lite": (0.10, 0.40),
    }
    usd_to_idr: float = 17_600.0  # JISDOR ~Rp17,536-17,727 in Sep 2026

    # ── Gemini / Vertex AI — models ──────────────────────────────────────
    # Auth: either set GEMINI_API_KEY (AI Studio) OR set
    # VERTEX_AI_PROJECT + VERTEX_AI_LOCATION (Vertex AI; uses ADC creds).
    gemini_api_key: str = ""
    vertex_ai_project: str = ""
    vertex_ai_location: str = "us-central1"
    # Gemini Embedding 1
    gemini_embed_model: str = "gemini-embedding-1"
    gemini_embed_dim: int = 768  # must match vector(768) pgvector column
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
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    # ── Matching tuning ──────────────────────────────────────────────────
    # The score formula's per-factor weights (cosine/proof-weighted skill/
    # experience/education) are fixed constants in matcher.py, not settings — see that
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
        """Whether /verify/email/send may return the code it just generated."""
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
