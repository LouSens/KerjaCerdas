// Product switches for the frontend.
//
// QUIZ_ENABLED — the skill quiz is off in the seeker journey. A 5-question
// multiple-choice check was hard to explain as "proof", so the loop now runs
// target job → skill gap → learn → apply → HR feedback, and a skill becomes
// confirmed only when HR confirms it after the interview. The quiz backend
// (/api/v1/quiz) and its tests are untouched; flip this to bring the UI back.
export const QUIZ_ENABLED = false

// PAID_PLANS_ENABLED — mirrors the backend's PAID_PLANS_ENABLED (default off).
// Off: no upgrade / payment screen can open anywhere; every feature is free to
// try. The plan UI (UpgradeModal, 402 upsell prompts) stays in the code for a
// deployment that turns paid plans back on — flip both flags together.
export const PAID_PLANS_ENABLED = false
