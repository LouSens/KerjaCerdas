"""KerjaCerdas — Structured logging configuration.

Configures structlog with:
  - JSON output in production (APP_ENV=production)
  - Colourised human-readable output in development
  - Standard-library logging bridge so existing `logging.getLogger(__name__)`
    calls are captured and emitted through structlog processors

Usage
-----
    from backend.app.config.logging import configure_logging, get_logger
    configure_logging()           # call once at startup (main.py)
    log = get_logger(__name__)    # use anywhere instead of logging.getLogger
    log.info("request handled", method="GET", path="/health", latency_ms=12)
"""

from __future__ import annotations

import logging
import os
import sys

try:
    import structlog  # type: ignore[import-untyped]

    _HAS_STRUCTLOG = True
except ImportError:  # pragma: no cover
    _HAS_STRUCTLOG = False


def configure_logging(level: str = "INFO") -> None:
    """Configure the root logger and structlog processor chain.

    Call once at application start-up before any logging is emitted.
    In production (`APP_ENV=production`) output is JSON-formatted;
    in development it is human-readable with colour.
    """
    is_production = os.getenv("APP_ENV", "development").lower() in {"production", "prod", "staging"}
    log_level = getattr(logging, level.upper(), logging.INFO)

    # ── stdlib root logger ──────────────────────────────────────────────────
    logging.basicConfig(
        format="%(message)s"
        if _HAS_STRUCTLOG
        else "%(asctime)s %(levelname)s %(name)s — %(message)s",
        stream=sys.stdout,
        level=log_level,
        force=True,
    )
    # Silence noisy third-party loggers
    for name in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(name).setLevel(logging.WARNING)

    if not _HAS_STRUCTLOG:
        # Graceful degradation — structlog not installed
        return

    # ── shared processors (always applied) ────────────────────────────────
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if is_production:
        # JSON output — parse-friendly for log aggregation (GCP, Datadog, etc.)
        renderer = structlog.processors.JSONRenderer()
    else:
        # Human-readable colourised output for local development
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        cache_logger_on_first_use=True,
    )

    # Bridge stdlib loggers → structlog processors
    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ExtraAdder(),
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
        ]
        + shared_processors
        + [renderer],
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)


def get_logger(name: str | None = None) -> "structlog.BoundLogger":  # type: ignore[name-defined]
    """Return a structlog-bound logger, falling back to stdlib if unavailable."""
    if _HAS_STRUCTLOG:
        return structlog.get_logger(name)  # type: ignore[return-value]
    return logging.getLogger(name)  # type: ignore[return-value]
