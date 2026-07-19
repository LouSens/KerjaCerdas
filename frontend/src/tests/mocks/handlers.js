/**
 * MSW (Mock Service Worker) handlers for unit tests.
 * Intercepts fetch calls so tests don't hit a real backend.
 */
import { http, HttpResponse } from 'msw'

export const handlers = [
    // ── Auth ─────────────────────────────────────────────────────────────
    http.post('/api/v1/auth/login', async ({ request }) => {
        const body = await request.json()
        if (body.email === 'valid@test.com' && body.password === 'ValidPass1') {
            return HttpResponse.json({
                access_token: 'mock-jwt-token',
                token_type: 'bearer',
                user: { id: 'u1', name: 'Test User', email: body.email, role: 'seeker' },
            })
        }
        return HttpResponse.json(
            { detail: 'Invalid email or password' },
            { status: 401 },
        )
    }),

    http.post('/api/v1/auth/register', async ({ request }) => {
        const body = await request.json()
        if (body.email === 'existing@test.com') {
            return HttpResponse.json(
                { detail: 'User with this email already exists' },
                { status: 400 },
            )
        }
        return HttpResponse.json(
            {
                access_token: 'mock-jwt-token',
                token_type: 'bearer',
                user: { id: 'u2', name: body.name, email: body.email, role: body.role },
            },
            { status: 201 },
        )
    }),

    // ── Health ────────────────────────────────────────────────────────────
    http.get('/health', () =>
        HttpResponse.json({ status: 'healthy', service: 'KerjaCerdas API', version: '1.0.0' }),
    ),

    // ── Jobs ──────────────────────────────────────────────────────────────
    http.get('/api/v1/jobs', () =>
        HttpResponse.json({
            items: [
                { id: 'j1', title: 'Backend Developer', company: 'TechCorp', salary_min: 10000000, salary_max: 15000000 },
                { id: 'j2', title: 'Data Analyst', company: 'DataFirm', salary_min: 8000000, salary_max: 12000000 },
            ],
            total: 2,
        }),
    ),

    // ── Agent invoke ──────────────────────────────────────────────────────
    http.post('/api/v1/agent/invoke', () =>
        HttpResponse.json({
            intent: 'match_jobs',
            final_response: 'Here are matching jobs for you.',
            matches: [],
            missing_skills: [],
            matching_skills: [],
            recommended_courses: [],
        }),
    ),

    // ── Rate limit simulation ─────────────────────────────────────────────
    http.post('/api/v1/auth/login-rate-limited', () =>
        HttpResponse.json({ detail: 'Too many requests. Please slow down.' }, { status: 429 }),
    ),
]
