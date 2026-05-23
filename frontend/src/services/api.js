/**
 * KerjaCerdas — API Service
 *
 * Connects frontend to FastAPI backend on :8000.
 * Vite proxy handles /api/* → localhost:8000 (no CORS issues).
 *
 * Referenced by: src/store/useStore.js, all components
 */

const API_BASE = '/api/v1'

/**
 * Match seeker profile to jobs.
 * POST /api/v1/match
 */
export async function matchJobs(seekerProfile, topK = 5) {
    const res = await fetch(`${API_BASE}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            seeker_profile: seekerProfile,
            top_k: topK,
        }),
    })
    if (!res.ok) throw new Error(`Match API error: ${res.status}`)
    return res.json()
}

/**
 * Analyze skill gaps.
 * POST /api/v1/skill-gap
 */
export async function analyzeSkillGap(seekerSkills, requiredSkills) {
    const res = await fetch(`${API_BASE}/skill-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            seeker_skills: seekerSkills,
            required_skills: requiredSkills,
        }),
    })
    if (!res.ok) throw new Error(`Skill gap API error: ${res.status}`)
    return res.json()
}

/**
 * Get career advice from AI advisor.
 * POST /api/v1/advisor
 */
export async function getCareerAdvice(message, seekerProfile, conversationHistory = []) {
    const res = await fetch(`${API_BASE}/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            seeker_profile: seekerProfile,
            conversation_history: conversationHistory,
        }),
    })
    if (!res.ok) throw new Error(`Advisor API error: ${res.status}`)
    return res.json()
}

/**
 * List available jobs.
 * GET /api/v1/jobs
 */
export async function listJobs(limit = 20, offset = 0) {
    const res = await fetch(`${API_BASE}/jobs?limit=${limit}&offset=${offset}`)
    if (!res.ok) throw new Error(`Jobs API error: ${res.status}`)
    return res.json()
}

/**
 * Verify candidate identity via e-KYC.
 * POST /api/v1/verify/identity
 */
export async function verifyIdentity(payload) {
    const res = await fetch(`${API_BASE}/verify/identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Identity verification API error: ${res.status}`)
    return res.json()
}

/**
 * Verify education credentials.
 * POST /api/v1/verify/education
 */
export async function verifyEducation(payload) {
    const res = await fetch(`${API_BASE}/verify/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Education verification API error: ${res.status}`)
    return res.json()
}

/**
 * Health check.
 * GET /health
 */
export async function healthCheck() {
    const res = await fetch('/health')
    if (!res.ok) throw new Error('API unreachable')
    return res.json()
}
