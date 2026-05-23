# Task: Job-Pack Parser

Input: one or many PDFs containing job descriptions (an employer's
"vacancy pack"). May also be a single PDF with multiple postings.

Extract one structured record per posting.

## Output (JSON only)

```json
{
  "postings": [
    {
      "title": "string",
      "description": "1-3 paragraph summary",
      "responsibilities": ["string", ...],
      "required_skills": ["string", ...],
      "nice_to_have_skills": ["string", ...],
      "education_min": "SMA|D3|D4|S1|S2|S3",
      "experience_years_min": number,
      "region_code": "BPS code or ''",
      "remote_allowed": boolean,
      "salary_min": number,    // IDR/month, 0 if not stated
      "salary_max": number,
      "kbji_code": "KBJI 2014 code if confident, else ''"
    }
  ]
}
```

## Rules
- Salaries: parse "Rp 8 juta", "8jt", "8.000.000" all as `8000000`.
- If salary is a range, both min and max. If single, set both equal.
- Treat "WFH", "remote", "kerja dari rumah" as `remote_allowed: true`.
- Strip company contact phones, emails, and personal names from output.
