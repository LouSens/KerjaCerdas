# Compliance & Regulation Guidelines (KerjaCerdas)

As an AI-powered HR-Tech platform operating in Indonesia, KerjaCerdas is strictly bound by national data protection laws and ethical AI standards. This document outlines the compliance requirements for the Agentic System.

## 1. UU PDP (Perlindungan Data Pribadi) Compliance

KerjaCerdas adheres to **UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi**.

*   **Lawful Basis for Processing:** AI processing of CVs and job matching is performed under the legal basis of "Explicit Consent" and "Contractual Necessity" to provide the matching service.
*   **Data Minimization:** The AI agents are only provided with the data strictly necessary for their specific task. For example, the `SkillGapAgent` receives the user's skills and target job, but NOT the user's name, phone number, or home address.
*   **Right to Erasure:** If a user deletes their account, all associated embeddings in the vector database and cached contexts in the agent's memory must be purged immediately.

## 2. PII (Personally Identifiable Information) Redaction

Before any user-uploaded document (e.g., CV PDF) is sent to external LLMs (like the Gemini API) for extraction or reasoning, it must pass through a sanitization layer:

*   **Regex Scrubbing:** A middleware runs regex patterns to strip out National Identity Numbers (NIK), phone numbers, exact residential addresses, and email addresses.
*   **LLM Prompt Constraints:** The System Prompt for extraction agents explicitly forbids the extraction or storing of sensitive PII into the structured database schemas.

## 3. Ethical AI & Bias Mitigation

AI models can inherit societal biases. KerjaCerdas implements the following safeguards to ensure fair job matching:

*   **Blind Matching Protocol:** The semantic matching engine computes scores based strictly on skills, experience years, and education alignment. Variables such as gender, age, race, and religion are explicitly excluded from the vector embedding process.
*   **Fairness Auditing:** Model outputs are periodically audited to ensure that match rates do not disproportionately favor specific demographics over others (e.g., ensuring female candidates receive equal visibility for technical roles).

## 4. Fraud Prevention & KYC

To protect Job Seekers from job scams and human trafficking, the platform enforces compliance checks on Employers:

*   **Automated LLM Verification:** The `Job Compliance Check` agent scans newly posted job descriptions for red flags (e.g., requests for upfront payment, multi-level marketing language, overly vague requirements for high salaries).
*   **Integration with SIVIL/NPWP:** Employer verification utilizes official government databases (or mock equivalents during MVP) to verify company legitimacy (NPWP) and candidate education credentials (SIVIL). Unverified employers are heavily down-ranked in the recommendation engine.

## 5. Security Standards

*   **Encryption:** All data at rest is encrypted (AES-256 equivalent via database provider). Data in transit uses TLS 1.3.
*   **No Hardcoded Secrets:** Agents must never have access to raw API keys in their prompts. API calls must be proxied through secure backend services that inject credentials via environment variables (`.env`).
