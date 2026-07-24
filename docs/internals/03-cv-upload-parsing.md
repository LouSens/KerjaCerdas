# CV Upload & Parsing

Files:
- `backend/app/api/routers/uploads.py` — endpoint, validation, IDOR guard
- `backend/app/services/pdf_parser.py` — Gemini extraction + offline fallback

## Flow — `POST /api/v1/uploads/cv`

```
PDF upload (≤10 MB, application/pdf only)
        │  auth: must be the seeker who owns the profile (IDOR check)
        ▼
┌─ Primary path ─────────────────────────────┐
│ Gemini native PDF ingestion:               │
│ the raw PDF blob is sent with              │
│ mime_type=application/pdf and a prompt     │
│ demanding structured JSON (skills,         │
│ experience, education, salary expectation) │
└──────────────┬─────────────────────────────┘
               │ no API key / call fails
               ▼
┌─ Fallback path ────────────────────────────┐
│ PyMuPDF (fitz) text extraction →           │
│ _fallback_extract: regex heuristics for    │
│ name, skills, years                        │
└──────────────┬─────────────────────────────┘
               ▼
map to SeekerProfile fields
               ▼
SemanticMatcher.embed_seeker(profile)   ← re-embed so matching
               ▼                           reflects the new CV
persist profile
```

## Key Design Points

- **Native PDF, not text-first.** The PDF goes to Gemini as a document blob rather than pre-extracted text — Gemini's document understanding handles multi-column CV layouts, tables, and mixed Indonesian/English content far better than regexing extracted text. The fallback exists so the feature degrades (rather than dies) offline.
- **Structured output contract.** The prompt requires a JSON schema (skills with levels, work history with dates, education, salary expectation) that maps 1:1 onto `SeekerProfile` — parse failures fall through to the heuristic path instead of storing garbage.
- **Immediate re-embedding.** The profile embedding is regenerated in the same request, so the next match request already reflects the uploaded CV. No background job, no staleness window.
- **Validation:** `application/pdf` content type and `MAX_PDF_BYTES = 10 MB` cap; the IDOR check prevents uploading a CV into someone else's profile (added during security hardening).

## Failure Modes

| Scenario | Behavior |
|---|---|
| No `GEMINI_API_KEY` | fallback heuristics (lower quality, still functional) |
| Gemini returns malformed JSON | fallback heuristics |
| Non-PDF or >10 MB | 4xx rejection before any parsing |
| Embedding call fails | profile text saved; match quality degrades until next re-embed |
