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
- Protected surfaces include the agent, uploads (with an IDOR check — you can only upload a CV to *your own* profile), and verification endpoints.

## Rate Limiting

In-memory **sliding window** per IP with an `asyncio.Lock`:

| Scope | Limit |
|---|---|
| `/auth/login`, `/auth/register` | **10 req / 60 s** |
| everything else | 60 req / 60 s |

The client IP comes from the **TCP peer address**, not `X-Forwarded-For` — a client-supplied XFF header is attacker-controlled and was previously spoofable to bypass the limiter. (Trade-off: behind Replit's proxy all requests may share the proxy's peer IP; acceptable for current scale.)

Being in-memory, limits reset on restart and are per-process — fine for a single-instance deployment, needs Redis/central store if horizontally scaled.

## Input Sanitization

`SanitizedStr` (a Pydantic annotated type) applied to user-supplied strings:
- `html.escape` — neutralizes stored-XSS payloads at write time,
- strips control characters,
- **prompt-injection regex** — patterns like "ignore all previous instructions", "DAN mode" → request rejected with 422. This exists because user text (headline, resume) flows into LLM prompts downstream; see `05-ai-agent.md` for the prompt-side defenses.
