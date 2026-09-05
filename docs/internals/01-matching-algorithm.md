# Matching Algorithm — Deep Dive

Core files:
- `backend/app/services/matching/matcher.py` — scoring, banding, explanations
- `backend/app/services/matching/embeddings/gemini.py` — embedding client
- `backend/app/config/settings.py` — thresholds and top-k
- `backend/app/db/models.py` — `vector(768)` pgvector columns
- `backend/alembic/versions/3ec45615212f_add_events_table_and_hnsw_indexes.py` — HNSW index definitions

The pipeline is a **bi-encoder semantic ranker with structured boosts and band-based presentation**, run in three stages: embed → score → band.

---

## 1. Embedding Stage (offline, at write time)

**Model:** `gemini-embedding-001`, requested at `output_dimensionality=768`.
The native model is 3072-dim; Gemini applies **Matryoshka Representation Learning (MRL)** truncation, so the first 768 dims retain most of the semantic signal. 768 was chosen to match the `vector(768)` pgvector column.

**Task types matter:** documents are embedded with `task_type="RETRIEVAL_DOCUMENT"`, queries with `"RETRIEVAL_QUERY"`. Gemini optimizes the two spaces to be asymmetric-retrieval-compatible (like DPR/GTR-style dual encoders).

**What text is embedded** (`_build_seeker_text` / `_build_job_text` in `matcher.py`):

```
Seeker:  {headline}
         Keahlian: {skill1, skill2, ...}
         Pengalaman: {title @ company | ...}
         Pendidikan: {degree major @ institution | ...}
         Catatan: {resume_text}

Job:     {title}
         {description}
         Skill wajib: {required_skills}
         Nice to have: {nice_to_have_skills}
         Tanggung jawab: {responsibilities}
```

Embeddings are computed when a profile/job is created or updated (`embed_seeker` / `embed_job`) and stored on the row. Job re-embedding triggers on `description` or `required_skills` changes (`routers/employer.py`). If Gemini is unavailable, the row is left unembedded rather than storing a junk vector — it degrades to a cosine of 0 at query time instead of crashing.

## 2. Retrieval Stage (online, per request)

Candidate retrieval runs DB-side through the pgvector HNSW index (`embedding <=> query`, `m=16, ef_construction=64`) rather than scanning every row in Python: `_job_candidates` / `_seeker_candidates` fetch a prefiltered pool of `max(top_k * 5, 200)` candidates with their cosine already computed by Postgres, plus any rows still missing an embedding (scored at cosine 0). If the query embedding or the pgvector index is unavailable, the matcher falls back to a full in-memory scan instead of failing the request.

The query vector itself is cached two ways: an in-process LRU (512 entries, keyed by `sha256(model + text)`) and a persistent `query_embeddings` table in Postgres, so repeat requests for the same profile/job text skip the ~1s Gemini embedding call entirely. Any edit to the underlying text changes the cache key automatically.

## 3. Scoring Stage

Both directions (`rank_jobs_for_seeker`, `rank_seekers_for_job`) share one formula (`_hybrid_score`):

```python
final_score = (
    cosine_similarity   * 0.45 +   # _W_COSINE
    skill_overlap       * 0.25 +   # _W_SKILL
    experience_fit_boost         +   # up to 0.15 (_W_EXPERIENCE), scaled by shortfall
    education_boost              +   # 0.10 (_W_EDUCATION) flat if the seeker has any listed education
    recency_boost                    # 0.05 (_W_RECENCY), currently flat for every candidate
)
```

These five weights are fixed constants in `matcher.py`, not `.env`-configurable settings — the module docstring is explicit that they're a hand-calibrated starting point for the current dataset, not yet validated against a labelled evaluation set.

**Components:**

| Component | Definition | Notes |
|---|---|---|
| `cosine_similarity` | cosine similarity of the two 768-dim vectors, floored at 0 | precomputed by pgvector during retrieval when available, else computed in Python |
| `skill_overlap` | `\|seeker_skills ∩ required_skills\| / \|required_skills\|` | skills are canonicalized first via `_normalize_skill()`/`_CANONICAL_SKILL_MAP` (e.g. `React.js`, `ReactJS` → `react`) before the exact-match comparison |
| `experience_fit_boost` | `0.15` if `years_exp >= required_years_min` (or the posting has no minimum), else scaled linearly by `years_exp / required_years_min` | `years_exp` comes from `_experience_years()`, which merges overlapping work-history date ranges before summing calendar duration — a freelancer with three concurrent 2024 contracts is not credited with 3 years |
| `education_boost` | flat `0.10` if the seeker has any listed education, else `0` | not weighted by degree level |
| `recency_boost` | flat `0.05` for every candidate today | named as its own term so a real recency signal can replace the constant without touching the rest of the formula |

**Region and salary filters are hard eliminations, not soft boosts.** When a seeker actively sets a location or salary filter (or an employer sets a location/experience filter), non-matching candidates are dropped from the result set entirely rather than merely scored lower.

## 4. Banding & Presentation Stage

Raw scores map to confidence bands (`_band_label`, shared by both ranking directions so seeker-side and employer-side bands can't drift apart):

| Band | Condition (`settings.py`) | Seeker-facing framing |
|---|---|---|
| `strong` | `score ≥ 0.65` (`band_strong_threshold`) | "Skill kamu nyambung kuat…" |
| `possible` | `score ≥ 0.45` (`band_possible_threshold`) | worth a look, some gaps |
| `stretch` | below | growth option |

Results are then shuffled within each band using a seed stable per job (seeker view) or per seeker (employer view) — order is deterministic across requests, but a tiny score delta (0.612 vs 0.608) never implies a ranking the model can't actually support. The employer card never displays the numeric score, only the band.

**Explanations:**
- Seeker side: template-based Bahasa Indonesia (`_seeker_summary`), driven by band + matched/missing skill lists. No LLM call.
- Employer side: a neutral evidence summary (`_candidate_summary`, matched/missing skills against required skills) — optionally upgraded to a ≤15-word Gemini-generated evaluation per candidate when an API key is configured.

## 5. Serving Paths

| Entry point | Flow |
|---|---|
| `POST /api/v1/agent/invoke` | rank jobs via the ANN-backed path → token gate: if `max_score < 0.10`, skip the LLM entirely and return a cheap templated reply |
| `POST /api/v1/employer/jobs/{id}/candidates` | rank all seekers against one job |
| `POST /api/v1/employer/jobs/estimate` | no-LLM heuristic (skill overlap + location) to preview candidate-pool size while composing a job |

`matching_top_k = 10` limits returned results by default.

---

## Known Limitations & Research Directions

1. **Skill matching is still exact string match after canonicalization.** The alias map (`_CANONICAL_SKILL_MAP`) covers common cases (`React.js`/`ReactJS` → `react`, `PostgreSQL`/`Postgres` → `postgres`, …) but has no fuzzy or hierarchical matching — `PostgreSQL` still won't credit a candidate who only lists `SQL`. A proper skill taxonomy (ESCO, O*NET) with subsumption relationships would generalize this; see [`ROADMAP.md`](../ROADMAP.md) §1.4.
2. **Weights are uncalibrated.** `0.65`/`0.45` band thresholds and the five hybrid weights were picked by inspection against the demo dataset, not validated against a labelled evaluation set. Recalibrating requires a golden set of human-labeled seeker-job pairs (~200+) and tracking nDCG@10/Recall@50 offline before changing constants.
3. **One embedding vector per entity.** Profile and job text are each embedded as a single concatenated string, so a long, detailed CV can dilute the signal against a short job description. A separate role-summary vector and hard-skills vector, combined via late interaction or reciprocal rank fusion, is the natural next step — see [`ROADMAP.md`](../ROADMAP.md) §1.4.
4. **Fairness auditing has not been done.** Before scaling, exposure parity across gender/age/region groups within each band should be measured, and Indonesian job descriptions scanned for language that would be unlawful to score on under local labor regulation and UU PDP 2022.
5. **No learning-to-rank loop yet.** `events.py` logs `job_viewed`/`apply_clicked`/band data, which is enough to eventually train a ranking model (e.g. LambdaMART) on real click/apply signal — see [`ROADMAP.md`](../ROADMAP.md) for A/B testing and event-tracking status.
