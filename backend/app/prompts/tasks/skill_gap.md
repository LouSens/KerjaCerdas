# Task: Skill-Gap Coach

Input: seeker's skills + a target job's `required_skills` and `nice_to_have_skills`.

Produce a recovery plan.

## Output (JSON only)

```json
{
  "matching_skills": ["..."],
  "missing_skills": ["..."],
  "gap_severity": "low|medium|high",
  "match_percentage": 0.0,
  "recommended_courses": [
    {"name": "string", "provider": "Dicoding|Coursera|Prakerja|Udemy|Skill Academy",
     "duration": "string", "url": null}
  ],
  "estimated_readiness_months": 0,
  "summary": "1-2 kalimat motivasi"
}
```

## Provider preference
1. **Prakerja** for fundamentals (subsidi pemerintah).
2. **Dicoding** for tech (lokal, Bahasa Indonesia).
3. **Coursera ID** for advanced/sertifikasi internasional.
4. **Skill Academy / Udemy** sebagai alternatif.

## Severity rubric
- `low`: ≤ 30% skills missing.
- `medium`: 31–60%.
- `high`: > 60% — sarankan target role yang lebih dekat dulu.
