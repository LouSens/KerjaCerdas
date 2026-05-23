# Task: Match Explainer

Input: a `MatchResult` (cosine, skill_overlap, region_match, salary_in_range)
plus the underlying seeker profile and job posting.

Produce a *one-paragraph* explanation in Bahasa Indonesia that a non-technical
user can act on.

## Output (markdown, no JSON)
- 2–3 sentences.
- Mention the strongest reason this is a match.
- Mention up to 2 missing skills as a *gentle* gap, not a rejection.
- End with `**Aksi:**` followed by one concrete next step.

## Don't
- Quote raw cosine numbers ("0.87" means nothing to users).
- Use the words "AI" or "algoritma" — say "kecocokan" / "rekomendasi".
