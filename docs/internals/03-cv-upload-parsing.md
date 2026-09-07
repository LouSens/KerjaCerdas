# CV Upload & Parsing

Files:
- `backend/app/api/routers/uploads.py` — endpoint, validation, IDOR guard
- `backend/app/services/pdf_parser.py` — Gemini extraction + offline fallback

## Flow — `POST /api/v1/uploads/cv`

```
PDF upload (≤10 MB, application/pdf only, must start with %PDF- magic bytes)
        │  auth: require_seeker — the seeker profile is always resolved from
        │  the caller's own JWT (find_seeker_by_user_id); no profile id is
        │  ever accepted from the client, so there is nothing to IDOR
        ▼
pdf_parser.parse_cv():
  1. Truncate to the first 3 pages (_MAX_GEMINI_PAGES) — Gemini bills
     multimodal PDFs per page, so this caps per-upload cost regardless of
     how long the uploaded file is.
  2. Send the (capped) PDF blob to Gemini with mime_type=application/pdf,
     walking a model fallback chain (settings.gemini_chat_model, then
     gemini_chat_fallback_models) with a 30s timeout and a single retry
     per model, demanding structured JSON (skills, experience, education,
     salary expectation) per tasks/cv_parser.md's schema.
  3. Gemini output is coerced/sanitized field-by-field via
     _validate_cv_schema() — every string field goes through
     clean_extracted_text() (see 02-authentication.md), which neutralizes
     rather than rejects, so odd CV wording can't 422 the whole upload.
        │
        │  no API key, non-quota failure, timeout, or malformed JSON
        ▼
_fallback_extract(): PyMuPDF (fitz) text extraction + regex/vocabulary
  heuristics for name, headline, skills (~90-word vocabulary), education
  year and degree level; also PII-redacts email/phone/NIK-shaped strings
  out of the stored resume_text. Returns the same shape, tagged
  "_offline": true.
        │
        ▼
uploads.py: if parsed["_offline"] is true → HTTP 503
  "Parser AI sedang tidak tersedia. Coba lagi nanti." — the upload is
  REJECTED, not silently completed with the heuristic result.
        │  (only reached when Gemini extraction actually succeeded)
        ▼
map to SeekerProfile fields
        ▼
SemanticMatcher.embed_seeker(profile)   ← re-embed so matching
        ▼                                  reflects the new CV
persist profile
```

## Key Design Points

- **Native PDF, not text-first.** The PDF goes to Gemini as a document blob rather than pre-extracted text — Gemini's document understanding handles multi-column CV layouts, tables, and mixed Indonesian/English content far better than regexing extracted text.
- **The offline/heuristic fallback exists in `pdf_parser.py` but is a dead end for this endpoint today.** `_fallback_extract()` (and `_offline_stub()`) always tag their result `"_offline": true`, and `uploads.py` explicitly turns that flag into an HTTP 503 rather than persisting it — so a seeker without a working Gemini call gets a clear "try again later" error, not a lower-quality auto-filled profile. The heuristic extractor is real, tested code, just not reachable from the live upload flow as currently wired; treat "graceful degrade to regex heuristics" as **not** how `/uploads/cv` actually behaves.
- **Structured output contract.** The prompt requires a JSON schema (skills with levels, work history with dates, education, salary expectation) that maps 1:1 onto `SeekerProfile` — parse failures (bad JSON, etc.) fall through to the offline path above, which then 503s the request rather than storing garbage.
- **Cost caps.** PDFs are truncated to 3 pages before being sent to Gemini, and each model attempt gets a 30s timeout with one retry before the next model in `gemini_chat_fallback_models` is tried.
- **Immediate re-embedding.** The profile embedding is regenerated in the same request, so the next match request already reflects the uploaded CV. No background job, no staleness window.
- **Validation:** `application/pdf`/`application/octet-stream` content type, a `%PDF-` magic-byte check, and `MAX_PDF_BYTES = 10 MB` cap enforced before any parsing.

## Failure Modes

| Scenario | Behavior |
|---|---|
| No `GEMINI_API_KEY` / all models in the fallback chain fail / malformed JSON | `_fallback_extract` runs internally but the endpoint returns **HTTP 503** — nothing is persisted |
| Non-PDF, missing `%PDF-` header, or >10 MB | 4xx rejection before any parsing |
| Embedding call fails after a successful Gemini parse | profile text is still saved (`embed_seeker` leaves the row unembedded rather than raising); match quality degrades until the next re-embed |
