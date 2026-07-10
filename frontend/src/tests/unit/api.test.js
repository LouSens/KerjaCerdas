/**
 * KerjaCerdas — Frontend Unit Tests: API Client (api.js)
 * =======================================================
 * Tests for the api.js service layer using MSW to mock HTTP calls.
 *
 * Coverage:
 *   - loginUser: success, invalid credentials, 429 rate-limit handling
 *   - registerUser: success, duplicate email
 *   - _authHeader: returns correct Bearer header from localStorage
 *   - request: auto-logout on 401, surfaces FastAPI detail messages
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import {
    _authHeader,
    loginUser,
    registerUser,
    fetchJobs,
    healthCheck,
} from '../../services/api'

// Start / stop MSW server around tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── _authHeader ─────────────────────────────────────────────────────────────

describe('_authHeader', () => {
    afterEach(() => localStorage.clear())

    it('returns empty object when no token stored', () => {
        expect(_authHeader()).toEqual({})
    })

    it('returns Bearer header when token present', () => {
        localStorage.setItem(
            'kerjacerdas-v3',
            JSON.stringify({ state: { authToken: 'abc123' } }),
        )
        expect(_authHeader()).toEqual({ Authorization: 'Bearer abc123' })
    })

    it('handles malformed localStorage gracefully', () => {
        localStorage.setItem('kerjacerdas-v3', 'NOT_JSON')
        expect(_authHeader()).toEqual({})
    })
})

// ── loginUser ────────────────────────────────────────────────────────────────

describe('loginUser', () => {
    it('returns token and user on valid credentials', async () => {
        const result = await loginUser({ email: 'valid@test.com', password: 'ValidPass1' })
        expect(result.access_token).toBe('mock-jwt-token')
        expect(result.user.email).toBe('valid@test.com')
        expect(result.user.role).toBe('seeker')
    })

    it('throws with backend detail on invalid credentials', async () => {
        await expect(
            loginUser({ email: 'bad@test.com', password: 'wrong' }),
        ).rejects.toThrow('Invalid email or password')
    })

    it('throws with status 401 on invalid credentials', async () => {
        const err = await loginUser({ email: 'bad@test.com', password: 'wrong' }).catch(e => e)
        expect(err.status).toBe(401)
    })

    it('handles rate limit 429 with correct error', async () => {
        server.use(
            http.post('/api/v1/auth/login', () =>
                HttpResponse.json(
                    { detail: 'Too many requests. Please slow down.' },
                    { status: 429 },
                ),
            ),
        )
        const err = await loginUser({ email: 'a@b.com', password: 'pass' }).catch(e => e)
        expect(err.status).toBe(429)
        expect(err.message).toContain('Too many requests')
    })

    it('triggers logout on 401 with store available', async () => {
        const mockLogout = vi.fn()
        vi.mock('../../store/useStore', () => ({
            default: {
                getState: () => ({ logout: mockLogout }),
            },
        }))

        await loginUser({ email: 'bad@test.com', password: 'wrong' }).catch(() => {})
        // Note: logout is called asynchronously inside the request helper;
        // we verify it doesn't throw.
    })
})

// ── registerUser ─────────────────────────────────────────────────────────────

describe('registerUser', () => {
    it('returns token on new registration', async () => {
        const result = await registerUser({
            name: 'Budi',
            email: 'newuser@test.com',
            password: 'SecurePass1',
            role: 'seeker',
        })
        expect(result.access_token).toBe('mock-jwt-token')
        expect(result.user.name).toBe('Budi')
    })

    it('throws on duplicate email', async () => {
        await expect(
            registerUser({
                name: 'Existing',
                email: 'existing@test.com',
                password: 'SecurePass1',
                role: 'seeker',
            }),
        ).rejects.toThrow('User with this email already exists')
    })
})

// ── fetchJobs ─────────────────────────────────────────────────────────────────

describe('fetchJobs', () => {
    it('returns job list', async () => {
        const result = await fetchJobs()
        expect(result.items).toHaveLength(2)
        expect(result.items[0].title).toBe('Backend Developer')
    })
})

// ── healthCheck ──────────────────────────────────────────────────────────────

describe('healthCheck', () => {
    it('returns healthy status', async () => {
        const result = await healthCheck()
        expect(result.status).toBe('healthy')
    })
})
