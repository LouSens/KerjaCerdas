"""
KerjaCerdas — Input Sanitization Layer
=======================================
Pydantic validators and helper functions to protect against:
  1. Prompt injection (LLM jailbreaks embedded in user text)
  2. XSS / script-injection in string fields (without breaking normal text like 'C++ & Python')
  3. Oversized payloads (body-size abuse)
  4. Malicious filenames on upload

Usage:
  - Import `sanitize_text` to clean any user-supplied string before it enters
    an LLM prompt or is stored.
  - Use `SanitizedStr` as a type alias in Pydantic models where you want
    automatic stripping + injection detection.

Convention: every field that reaches an LLM prompt must be sanitized first.
"""

from __future__ import annotations

import logging
import re
from typing import Annotated

from fastapi import HTTPException, Request, status
from pydantic import AfterValidator
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────────────────────────────────────

# Maximum request body size: 10 MB (for file uploads we rely on FastAPI limits)
MAX_BODY_BYTES = 10 * 1024 * 1024

# Patterns that indicate prompt injection attempts
_INJECTION_PATTERNS: list[re.Pattern] = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions?", re.I),
    re.compile(r"(system|assistant|user)\s*:\s*", re.I),
    re.compile(r"<\s*(?:script|iframe|object|embed|form|link|meta|style)", re.I),
    re.compile(r"javascript\s*:", re.I),
    re.compile(r"\\u003c|\\u003e|%3C|%3E", re.I),  # encoded < >
    re.compile(r"jailbreak", re.I),
    re.compile(r"DAN\s*mode", re.I),
    re.compile(r"(pretend|act)\s+as\s+(if\s+you\s+are|a\s+)", re.I),
    re.compile(r"(\r?\n){6,}"),  # large blank-line bombs
    re.compile(r"reveal\s+(your\s+)?(system\s+)?prompt", re.I),
    re.compile(r"(base64|hex)\s*decode", re.I),
]

# Characters and sequences that must never reach an LLM context boundary
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Dangerous HTML tag pattern to remove without double-encoding ampersands/math
_DANGEROUS_HTML = re.compile(
    r"<\/?(?:script|iframe|object|embed|form|input|button|style|meta|link)[^>]*>", re.I
)

# Allowed filename characters (alphanumeric, dash, underscore, dot)
_SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9._\-\s]")


# ──────────────────────────────────────────────────────────────────────────────
#  Core sanitization helpers
# ──────────────────────────────────────────────────────────────────────────────


def sanitize_text(
    text: str,
    *,
    max_length: int = 4_000,
    allow_newlines: bool = True,
    field_name: str = "input",
) -> str:
    """
    Clean and validate a user-supplied string.

    Steps:
    1. Truncate to `max_length` characters.
    2. Strip dangerous control characters (except \n, \t if allow_newlines).
    3. Strip dangerous HTML/script tags (prevents XSS while avoiding entity double-encoding).
    4. Detect prompt-injection patterns → raise 422.

    Returns the sanitized string.
    Raises HTTPException 422 on injection attempt.
    """
    if not isinstance(text, str):
        return ""

    # 1. Truncate
    text = text[:max_length]

    # 2. Strip dangerous control characters
    if allow_newlines:
        text = _CONTROL_CHARS.sub("", text)
    else:
        text = re.sub(r"[\x00-\x1f\x7f]", "", text)

    # 3. Strip dangerous HTML tags to prevent XSS without corrupting plain text
    text = _DANGEROUS_HTML.sub("", text)

    # 4. Injection detection
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning("Prompt injection attempt detected in field '%s'", field_name)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Input field '{field_name}' contains disallowed content.",
            )

    return text.strip()


def clean_extracted_text(
    text: str,
    *,
    max_length: int = 4_000,
    allow_newlines: bool = True,
) -> str:
    """
    Soft sanitization for extracted document text (e.g. CVs, Job Packs).
    Instead of raising 422, it neutralizes injection patterns and control chars
    so downstream processing and UI rendering stay safe without blocking the user.
    """
    if not isinstance(text, str):
        return ""
    text = text[:max_length]
    if allow_newlines:
        text = _CONTROL_CHARS.sub("", text)
    else:
        text = re.sub(r"[\x00-\x1f\x7f]", "", text)
    text = _DANGEROUS_HTML.sub("", text)

    # Neutralize injection patterns by replacing with benign marker
    for pattern in _INJECTION_PATTERNS:
        text = pattern.sub("[filtered]", text)

    return text.strip()


def sanitize_filename(filename: str, max_length: int = 100) -> str:
    """
    Return a safe filename by removing non-alphanumeric characters.
    Keeps dots (extension), dashes, underscores, spaces.
    """
    filename = filename[:max_length]
    filename = _SAFE_FILENAME.sub("_", filename)
    # Prevent path traversal
    filename = filename.replace("..", "_")
    return filename.strip()


def _pydantic_sanitize(v: str) -> str:
    """AfterValidator for use in Pydantic models."""
    return sanitize_text(v, max_length=2_000)


# Pydantic type alias: use `SanitizedStr` in models for automatic sanitization
SanitizedStr = Annotated[str, AfterValidator(_pydantic_sanitize)]


# ──────────────────────────────────────────────────────────────────────────────
#  Request size guard middleware
# ──────────────────────────────────────────────────────────────────────────────


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """
    Reject requests whose Content-Length exceeds MAX_BODY_BYTES (10 MB).
    File upload endpoints (uploads/*) are exempt — they stream directly.
    """

    def __init__(self, app: ASGIApp, max_bytes: int = MAX_BODY_BYTES) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        # Skip size check for file uploads
        if "/uploads/" in request.url.path:
            return await call_next(request)

        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_bytes:
            logger.warning(
                "Request body too large: %s bytes from %s",
                content_length,
                request.client,
            )
            return Response(
                content='{"detail":"Request payload too large."}',
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                media_type="application/json",
            )

        return await call_next(request)
