"""Object storage on any S3-compatible service (Cloudflare R2 in production).

Configured by S3_ENDPOINT_URL / S3_BUCKET / S3_ACCESS_KEY_ID /
S3_SECRET_ACCESS_KEY. Like services/email, a missing configuration is not an
error: every call returns False / None and the caller decides how to degrade.
Network failures are logged and reported the same way, so a storage outage can
never fail the request that triggered it.

boto3 is synchronous, so each call runs in a worker thread.
"""

from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from typing import Any

from backend.app.config.settings import settings

logger = logging.getLogger(__name__)


def storage_configured() -> bool:
    return all(
        (
            settings.s3_endpoint_url,
            settings.s3_bucket,
            settings.s3_access_key_id,
            settings.s3_secret_access_key,
        )
    )


@lru_cache(maxsize=1)
def _client() -> Any:
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=settings.s3_region,
        config=Config(
            signature_version="s3v4",
            connect_timeout=5,
            read_timeout=30,
            retries={"max_attempts": 3, "mode": "standard"},
        ),
    )


def reset_client() -> None:
    """Drop the cached client — call after changing S3_* settings at runtime."""
    _client.cache_clear()


def full_key(key: str) -> str:
    key = key.lstrip("/")
    if not key or ".." in key.split("/"):
        raise ValueError(f"invalid object key: {key!r}")
    return f"{settings.s3_key_prefix}{key}"


async def put_object(key: str, data: bytes, content_type: str = "application/octet-stream") -> bool:
    """Upload bytes. Returns True only if the store accepted them."""
    if not storage_configured():
        return False
    try:
        await asyncio.to_thread(
            _client().put_object,
            Bucket=settings.s3_bucket,
            Key=full_key(key),
            Body=data,
            ContentType=content_type,
        )
        return True
    except Exception as exc:  # botocore raises many unrelated exception types
        logger.warning("Storage put failed for %s: %s", key, exc)
        return False


async def get_object(key: str) -> bytes | None:
    """Download bytes, or None if unconfigured, missing, or unreachable."""
    if not storage_configured():
        return None
    try:
        resp = await asyncio.to_thread(
            _client().get_object, Bucket=settings.s3_bucket, Key=full_key(key)
        )
        return await asyncio.to_thread(resp["Body"].read)
    except Exception as exc:
        logger.warning("Storage get failed for %s: %s", key, exc)
        return None


async def delete_object(key: str) -> bool:
    if not storage_configured():
        return False
    try:
        await asyncio.to_thread(
            _client().delete_object, Bucket=settings.s3_bucket, Key=full_key(key)
        )
        return True
    except Exception as exc:
        logger.warning("Storage delete failed for %s: %s", key, exc)
        return False


async def presigned_url(key: str, expires_in: int | None = None) -> str | None:
    """A time-limited GET URL for a private object; the bucket stays private."""
    if not storage_configured():
        return None
    try:
        return await asyncio.to_thread(
            _client().generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": full_key(key)},
            ExpiresIn=expires_in or settings.s3_presign_expire_seconds,
        )
    except Exception as exc:
        logger.warning("Storage presign failed for %s: %s", key, exc)
        return None


async def storage_health() -> dict:
    """Configuration + reachability summary for the admin surface (no secrets)."""
    if not storage_configured():
        return {"configured": False, "reachable": False, "bucket": settings.s3_bucket or None}
    try:
        await asyncio.to_thread(_client().head_bucket, Bucket=settings.s3_bucket)
        return {"configured": True, "reachable": True, "bucket": settings.s3_bucket}
    except Exception as exc:
        logger.warning("Storage health check failed: %s", exc)
        return {"configured": True, "reachable": False, "bucket": settings.s3_bucket}
