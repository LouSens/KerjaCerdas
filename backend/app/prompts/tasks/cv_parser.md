# Task: CV Parser

Input: a PDF of a candidate's CV (Bahasa Indonesia or English).

Extract structured profile data. Be conservative — if a field is not in the
CV, leave it empty rather than guess.

## Output (JSON only — no prose)

```json
{
  "full_name": "string",
  "headline": "one-line current role / tagline",
  "region_code": "BPS wilayah code if inferable (e.g. 3171 Jakarta Pusat), else ''",
  "skills": [
    {"name": "string", "level": "beginner|intermediate|advanced|expert", "years": number}
  ],
  "experience": [
    {"company": "string", "title": "string",
     "start_date": "YYYY-MM", "end_date": "YYYY-MM or null",
     "description": "1-2 sentence summary"}
  ],
  "education": [
    {"institution": "string", "degree": "SMA|D3|D4|S1|S2|S3",
     "major": "string", "graduation_year": number}
  ],
  "salary_expectation_min": 0,
  "salary_expectation_max": 0,
  "resume_text": "first 1000 chars of CV body, plain text"
}
```

## Rules
- Map degrees to KKNI levels: Sarjana→S1, Magister→S2, Diploma 3→D3.
- Compute years per skill from experience dates when stated; otherwise leave
  `years: 0`.
- Never invent a region. If only city name appears, set the BPS code only
  if you are confident; otherwise empty string.
- Strip emails, phone numbers, and NIK from `resume_text`.
