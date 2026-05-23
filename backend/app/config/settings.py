"""
KerjaCerdas - Application Settings
====================================
Pydantic-based settings loaded from environment variables.
Centralized configuration for all services, agents, and ML pipeline.

ANTIGRAVITY PROTOCOL: RULE-01 — No hardcoded secrets. All config via .env.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ──────────────────────────────────────────────────────
    app_env: str = "development"
    demo_mode: bool = True
    log_level: str = "INFO"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    jwt_secret_key: str = ""
    jwt_access_token_expire_minutes: int = 60 * 24

    # ── Google Gemini API ────────────────────────────────────────────────
    gemini_api_key: str = ""

    # ── Database ─────────────────────────────────────────────────────────
    database_url: str = "postgresql://kerja:password@localhost:5432/kerjacerdas"

    # ── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── MLflow ───────────────────────────────────────────────────────────
    mlflow_tracking_uri: str = "http://localhost:5001"
    vite_api_url: str = "http://localhost:8000"

    # ── Agent Configuration ──────────────────────────────────────────────
    orchestrator_temperature: float = 0.2
    orchestrator_timeout_sec: int = 30
    matching_confidence_threshold: float = 0.75
    matching_top_k: int = 10
    matching_region_weight: float = 0.3
    skill_gap_temperature: float = 0.4
    advisor_temperature: float = 0.7
    advisor_language: str = "id"

    @property
    def is_demo(self) -> bool:
        """Check if running in demo mode."""
        return self.demo_mode

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.app_env == "production"


# Singleton instance
settings = Settings()
