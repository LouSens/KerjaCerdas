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
        extra="ignore",       # ignore unknown keys in .env
    )

    # ── Application ──────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    # ── Auth ─────────────────────────────────────────────────────────────
    jwt_secret_key: str = ""
    jwt_access_token_expire_minutes: int = 1440

    # ── Gemini / Vertex AI — models ──────────────────────────────────────
    # Auth: either set GEMINI_API_KEY (AI Studio) OR set
    # VERTEX_AI_PROJECT + VERTEX_AI_LOCATION (Vertex AI; uses ADC creds).
    gemini_api_key: str = ""
    vertex_ai_project: str = ""
    vertex_ai_location: str = "us-central1"
    # Gemini Embedding 2 — Vertex model id is `gemini-embedding-001`
    # (was experimental as `gemini-embedding-exp-03-07`). 3072-dim, MRL-truncatable.
    gemini_embed_model: str = "gemini-embedding-001"
    gemini_embed_dim: int = 3072  # truncate to 768/1536 if you index w/ pgvector
    # Chat / generation — Gemini 3.1 Flash Lite (cheap, fast, JSON-mode).
    gemini_chat_model: str = "gemini-3.1-flash-lite"

    # ── Database ─────────────────────────────────────────────────────────
    # Empty string → dev falls back to SQLite under data/
    database_url: str = ""

    # ── JSON store root ──────────────────────────────────────────────────
    kerja_data_root: str = "data"

    # ── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── CORS ─────────────────────────────────────────────────────────────
    cors_allow_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # ── Admin bootstrap ──────────────────────────────────────────────────
    admin_emails: list[str] = ["admin@kerjacerdas.id"]

    # ── Matching tuning ──────────────────────────────────────────────────
    matching_top_k: int = 10
    matching_cosine_weight: float = 0.50
    matching_skill_weight: float = 0.30
    matching_region_weight: float = 0.10
    matching_salary_weight: float = 0.05
    matching_experience_weight: float = 0.05

    # ── Agent temperatures ───────────────────────────────────────────────
    advisor_temperature: float = 0.7
    skill_gap_temperature: float = 0.2
    parser_temperature: float = 0.1

    # ── Derived ──────────────────────────────────────────────────────────
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def effective_database_url(self) -> str:
        """Return the DB URL to actually use (auto-SQLite in dev)."""
        if self.database_url:
            return self.database_url
        return f"sqlite+aiosqlite:///{self.kerja_data_root}/kerjacerdas.db"


settings = Settings()
