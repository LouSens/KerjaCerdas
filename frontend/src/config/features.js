// Product switches for the frontend.
//
// QUIZ_ENABLED — the skill quiz is off in the seeker journey. A 5-question
// multiple-choice check was hard to explain as "proof", so the loop now runs
// target job → skill gap → learn → apply → HR feedback, and a skill becomes
// confirmed only when HR confirms it after the interview. The quiz backend
// (/api/v1/quiz) and its tests are untouched; flip this to bring the UI back.
export const QUIZ_ENABLED = false
