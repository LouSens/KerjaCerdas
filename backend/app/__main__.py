"""Run the API with `python -m backend.app`."""
from __future__ import annotations

import os

# Windows / conda Python often ships without an OS-level CA bundle on PATH,
# which makes outbound HTTPS to Gemini fail with CERTIFICATE_VERIFY_FAILED.
# Point both `ssl` and `requests`/`httpx` at certifi's bundle before any
# network module loads.
try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
except ImportError:
    pass

import uvicorn


def main() -> None:
    uvicorn.run(
        "backend.app.api.main:app",
        host=os.environ.get("API_HOST", "127.0.0.1"),
        port=int(os.environ.get("API_PORT", 8000)),
        reload=os.environ.get("API_RELOAD", "1") == "1",
        reload_dirs=["backend"],
    )


if __name__ == "__main__":
    main()
