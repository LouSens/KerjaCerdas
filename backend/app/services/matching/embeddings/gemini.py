"""
Gemini embedding service.

Supported models (set GEMINI_EMBED_MODEL in .env):
  gemini-embedding-exp-03-07  — 3072-d (default, best quality, experimental)
  text-embedding-004          — 768-d  (stable fallback)

Task types:
  RETRIEVAL_DOCUMENT  — use when indexing job postings / seeker profiles
  RETRIEVAL_QUERY     — use at query time (must be different from document type)

Both sides MUST use the same model for cosine scores to be meaningful.

When Gemini is unavailable (no key / SSL / quota) the service silently
degrades to a deterministic hash embedder so the platform never crashes.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Literal

logger = logging.getLogger(__name__)

TaskType = Literal[
    "RETRIEVAL_DOCUMENT",
    "RETRIEVAL_QUERY",
    "SEMANTIC_SIMILARITY",
    "CLASSIFICATION",
    "CLUSTERING",
]

# Fallback dim used by HashEmbedder and when Gemini is unreachable.
_FALLBACK_DIM = 768


def _get_settings():
    from backend.app.config.settings import settings
    return settings


class GeminiEmbedder:
    """Async wrapper around the Gemini embedding endpoint."""

    def __init__(self, model: str | None = None) -> None:
        s = _get_settings()
        self.model = model or s.gemini_embed_model
        self.dim = s.gemini_embed_dim
        self._api_key: str = (
            s.gemini_api_key
            or os.environ.get("GEMINI_API_KEY", "")
            or os.environ.get("GOOGLE_API_KEY", "")
        )
        self._vertex_project: str = (
            s.vertex_ai_project or os.environ.get("VERTEX_AI_PROJECT", "")
            or os.environ.get("GOOGLE_CLOUD_PROJECT", "")
        )
        self._vertex_location: str = (
            s.vertex_ai_location or os.environ.get("VERTEX_AI_LOCATION", "us-central1")
        )
        self._client = None
        self._broken = False  # latched True on first network/SSL failure

    def _client_or_raise(self):
        if self._client is not None:
            return self._client
        from google import genai
        # Prefer Vertex AI when project is set — uses Application Default
        # Credentials (gcloud auth application-default login OR a service
        # account JSON pointed to by GOOGLE_APPLICATION_CREDENTIALS).
        if self._vertex_project:
            self._client = genai.Client(
                vertexai=True,
                project=self._vertex_project,
                location=self._vertex_location,
            )
            return self._client
        if not self._api_key:
            raise RuntimeError("No Gemini auth configured (set GEMINI_API_KEY or VERTEX_AI_PROJECT)")
        self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def embed(self, text: str, task_type: TaskType = "RETRIEVAL_QUERY") -> list[float]:
        return (await self.embed_batch([text], task_type))[0]

    async def embed_batch(
        self, texts: list[str], task_type: TaskType = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        if self._broken:
            return await _hash_fallback().embed_batch(texts, task_type)
        try:
            client = self._client_or_raise()
        except RuntimeError:
            self._broken = True
            return await _hash_fallback().embed_batch(texts, task_type)

        def _sync():
            from google.genai import types
            cfg_kwargs: dict = {"task_type": task_type}
            # Gemini Embedding 2 supports Matryoshka truncation via output_dimensionality
            if self.dim and self.dim != 3072:
                cfg_kwargs["output_dimensionality"] = self.dim
            resp = client.models.embed_content(
                model=self.model,
                contents=texts,
                config=types.EmbedContentConfig(**cfg_kwargs),
            )
            return [list(e.values) for e in resp.embeddings]

        try:
            return await asyncio.to_thread(_sync)
        except Exception as exc:
            logger.warning("Gemini embed failed (%s) — latching HashEmbedder", exc)
            self._broken = True
            return await _hash_fallback().embed_batch(texts, task_type)


class HashEmbedder:
    """Deterministic pseudo-embedding for offline / no-key mode.

    Produces _FALLBACK_DIM-dimensional unit vectors. Cosine scores will be
    low (~0.0) but the ranking pipeline won't crash.
    """

    model = "hash-fallback"

    async def embed(self, text: str, task_type: TaskType = "RETRIEVAL_QUERY") -> list[float]:
        return (await self.embed_batch([text], task_type))[0]

    async def embed_batch(
        self, texts: list[str], task_type: TaskType = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        import hashlib, math, struct

        results: list[list[float]] = []
        for text in texts:
            vec = [0.0] * _FALLBACK_DIM
            tokens = text.lower().split()
            for token in tokens:
                raw = hashlib.sha256(token.encode()).digest()
                for i in range(min(_FALLBACK_DIM, 32)):
                    vec[i] += (raw[i] - 128) / 128.0
            norm = math.sqrt(sum(v * v for v in vec)) or 1.0
            results.append([v / norm for v in vec])
        return results


def _hash_fallback() -> HashEmbedder:
    return HashEmbedder()


def get_embedder() -> GeminiEmbedder | HashEmbedder:
    s = _get_settings()
    has_api_key = bool(
        s.gemini_api_key
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    has_vertex = bool(s.vertex_ai_project or os.environ.get("VERTEX_AI_PROJECT")
                      or os.environ.get("GOOGLE_CLOUD_PROJECT"))
    if has_api_key or has_vertex:
        logger.debug("Using GeminiEmbedder model=%s (vertex=%s)", s.gemini_embed_model, has_vertex)
        return GeminiEmbedder()
    logger.info("No Gemini auth — using offline HashEmbedder.")
    return HashEmbedder()
