# Authentication & Request Hardening

Files:
- `backend/app/api/services/auth_service.py` — hashing, JWT issue/verify
- `backend/app/api/routers/auth.py` — register/login endpoints
- `backend/app/api/dependencies.py` — `get_current_user`, role guards
- `backend/app/api/middleware/rate_limiter.py` — sliding-window limiter
- `backend/app/api/middleware/sanitization.py` — input scrubbing

## Registration — `POST /api/v1/auth/register`

1. Payload: email, name, password, role (`seeker` | `employer`).
2. Password hashed with **bcrypt** (`bcrypt.hashpw`, salted per-hash).
3. `User` row written to PostgreSQL; identity mirrored to the repository layer (`repos.users.upsert`).
4. **Employer auto-profile:** employers get an `Employer` profile immediately, defaulting `region_code="3171"` (Jakarta Pusat), so job posting works without a separate onboarding step.

## Login — `POST /api/v1/auth/login`

Validates via `bcrypt.checkpw`, returns `TokenResponse`:

```json
{ "access_token": "<jwt>", "user": { "id": "...", "name": "...", "role": "seeker" } }
```

## JWT Details

| Property | Value |
|---|---|
| Algorithm | HS256, key = `JWT_SECRET_KEY` env |
| Expiry | 24 h (`_ACCESS_TOKEN_EXPIRE_MINUTES = 1440`) |
| Claims | `sub` (user UUID), `role`, `name`, `exp`, `iat` |

Deliberately **no email/PII in the payload** (removed in security hardening — JWTs are base64, not encrypted; anything in them is readable by the client and by anyone who logs one).

## Request Authorization

- `get_current_user` (in `dependencies.py`): decodes the Bearer token, loads the user from DB by `sub` — a deleted user's token dies immediately even if unexpired.
- `require_seeker` / `require_employer`: role gates layered on top; wrong role → 403.
- Protected surfaces include the agent, uploads, and verification endpoints. `POST /uploads/cv` and `POST /employer/jobs/{id}/candidates` don't even accept a target profile/job-owner id from the client — they always resolve the acting seeker/employer from the JWT (`require_seeker`/`require_employer` + `find_*_by_user_id`), so cross-user access is structurally impossible rather than merely checked after the fact. Employer job mutations (`PATCH`/`DELETE`) do take a `job_id` and *do* need an explicit ownership check (`_require_owned_job` in `employer.py`) before acting on it.

## Rate Limiting

In-memory **sliding window** per `(IP, route bucket)` pair with an `asyncio.Lock` per key (`middleware/rate_limiter.py`). Counters are keyed by the matched rule prefix (or `__default__`), not by the raw request path — otherwise every distinct URL (e.g. `/api/v1/jobs/<uuid>`) would get its own allowance and the map would be attacker-growable.

| Scope | Limit |
|---|---|
| `/auth/login`, `/auth/register` | 10 req / 60 s (brute-force guard) |
| `/agent/invoke` | 20 req / 60 s (LLM cost guard) |
| `/uploads/cv`, `/uploads/job-pack` | 10 req / 60 s |
| `/verify/otp/send` | 5 req / 60 s (SMS cost guard) |
| `/verify/otp/verify`, `/verify/identity` | 10 req / 60 s |
| `/seeker/skill-gap` | 20 req / 60 s (calls Gemini) |
| `/employer/jobs*` | 30 req / 60 s (candidates/estimate call Gemini) |
| everything else | **300 req / 60 s** (`_DEFAULT_LIMIT`) |

The tracked-key map is capped at 10,000 `(ip, bucket)` entries with LRU eviction (never evicting a counter that's currently throttled, so eviction can't hand out a fresh allowance), plus a periodic prune of stale/expired windows.

The client IP is the **TCP peer address** by default. A forwarded `X-Real-IP` header is trusted only when the request also carries a shared-secret header (`X-Internal-Proxy-Secret`, compared with `hmac.compare_digest`) matching `settings.proxy_shared_secret` — set by KerjaCerdas's own Nginx in `docker-compose.prod.yml`. An IP/CIDR allowlist was deliberately avoided: a container's published-port traffic can appear to originate from inside its own subnet (hairpin NAT), so only a secret the proxy alone knows can prove "this came through our Nginx." With `PROXY_SHARED_SECRET` unset (the default), the header is never trusted and every proxied client shares one bucket keyed by the proxy's own peer address.

Being in-memory, limits reset on restart and are per-process — fine for a single-instance deployment, needs a central store if horizontally scaled.

## Input Sanitization

`SanitizedStr` (a Pydantic annotated type, `middleware/sanitization.py`) and the `sanitize_text()` helper applied to user-supplied strings:
- truncates to `max_length`,
- strips control characters (`\x00`–`\x1f`, `\x7f`, newlines excepted when `allow_newlines=True`),
- strips dangerous HTML/script tags via a targeted regex (`<script>`, `<iframe>`, `<form>`, etc.) rather than `html.escape` — this avoids double-encoding legitimate text like "C++ & Python" while still neutralizing markup-based XSS,
- **prompt-injection regex** — patterns including "ignore all previous instructions", "system:"/"assistant:"/"user:" role-prefix spoofing, `<script>` tags, `javascript:`, encoded `<`/`>`, "jailbreak", "DAN mode", "pretend/act as", 6+ blank-line bombs, "reveal your system prompt", and "base64/hex decode" → request rejected with HTTP 422. This exists because user text (headline, resume) flows into LLM prompts downstream; see `05-ai-agent.md` for the prompt-side defenses.

A second function, `clean_extracted_text()`, applies the same tag-stripping and control-character rules to AI-*extracted* document text (CV/job-pack parsing, see `03-cv-upload-parsing.md`) but **neutralizes** injection patterns by replacing them with `[filtered]` instead of raising — a CV containing a phrase that happens to match an injection pattern shouldn't hard-fail the whole upload.

`RequestSizeMiddleware` separately rejects any request (except `/uploads/*`, which streams and is capped by its own `MAX_PDF_BYTES` check) whose `Content-Length` exceeds 10 MB.
