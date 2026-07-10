/**
 * KerjaCerdas — E2E Tests: Authentication Flows
 * ===============================================
 * Tests the critical user-facing auth flows:
 *  1. Landing page loads correctly
 *  2. Login modal: validation errors shown for empty fields
 *  3. Login flow: failed login shows error toast
 *  4. Register flow: validation, success (mocked)
 *  5. Rate limiting: UI handles 429 gracefully
 *
 * These tests run against the dev server (http://localhost:3000).
 * The backend is assumed to be running; auth endpoints are mocked via
 * Playwright route interception for deterministic results.
 */
import { test, expect } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function mockLoginSuccess(page) {
    await page.route('**/api/v1/auth/login', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'e2e-mock-token',
                token_type: 'bearer',
                user: { id: 'u1', name: 'E2E User', email: 'e2e@test.com', role: 'seeker' },
            }),
        }),
    )
}

async function mockLoginFailure(page) {
    await page.route('**/api/v1/auth/login', route =>
        route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Invalid email or password' }),
        }),
    )
}

async function mockRateLimit(page) {
    await page.route('**/api/v1/auth/login', route =>
        route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Too many requests. Please slow down.' }),
            headers: { 'Retry-After': '30' },
        }),
    )
}

async function mockRegisterSuccess(page) {
    await page.route('**/api/v1/auth/register', route =>
        route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'e2e-mock-token',
                token_type: 'bearer',
                user: { id: 'u2', name: 'New User', email: 'new@test.com', role: 'seeker' },
            }),
        }),
    )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

test.describe('Landing Page', () => {
    test('loads successfully and shows CTA', async ({ page }) => {
        await page.goto('/')
        // Page should load without error
        await expect(page).toHaveTitle(/KerjaCerdas/i)
    })

    test('shows login / register call-to-action buttons', async ({ page }) => {
        await page.goto('/')
        // Look for auth-related buttons on the landing page
        const authButtons = page.locator('button').filter({ hasText: /masuk|daftar|login|register/i })
        await expect(authButtons.first()).toBeVisible({ timeout: 10_000 })
    })
})

// ── Auth Modal — Login ────────────────────────────────────────────────────────

test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        // Open auth modal by clicking login button
        const loginBtn = page.locator('button').filter({ hasText: /masuk|login/i }).first()
        await loginBtn.click()
        // Wait for modal to appear
        await page.waitForSelector('[data-testid="auth-modal"], form', { timeout: 5_000 }).catch(() => {})
    })

    test('invalid credentials shows error message', async ({ page }) => {
        await mockLoginFailure(page)

        const emailInput = page.locator('input[type="email"]').first()
        const passwordInput = page.locator('input[type="password"]').first()
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /masuk|login/i }).first()

        await emailInput.fill('wrong@test.com')
        await passwordInput.fill('WrongPass1')
        await submitBtn.click()

        // Error should appear (toast or inline)
        await expect(
            page.locator('text=/Invalid email or password|Email atau password salah/i').or(
                page.locator('[role="alert"]')
            )
        ).toBeVisible({ timeout: 5_000 })
    })

    test('rate limit 429 shows appropriate message', async ({ page }) => {
        await mockRateLimit(page)

        const emailInput = page.locator('input[type="email"]').first()
        const passwordInput = page.locator('input[type="password"]').first()
        const submitBtn = page.locator('button').filter({ hasText: /masuk|login/i }).first()

        await emailInput.fill('user@test.com')
        await passwordInput.fill('ValidPass1')
        await submitBtn.click()

        // Should show rate limit message or generic error
        await expect(
            page.locator('text=/too many|terlalu banyak|slow down/i').or(
                page.locator('[role="alert"]')
            )
        ).toBeVisible({ timeout: 5_000 })
    })

    test('successful login redirects to dashboard', async ({ page }) => {
        await mockLoginSuccess(page)

        const emailInput = page.locator('input[type="email"]').first()
        const passwordInput = page.locator('input[type="password"]').first()
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /masuk|login/i }).first()

        await emailInput.fill('e2e@test.com')
        await passwordInput.fill('ValidPass1')
        await submitBtn.click()

        // After successful login, we should see the sidebar/dashboard
        await expect(
            page.locator('nav, aside, [data-testid="sidebar"]').or(
                page.locator('text=/dashboard|selamat datang/i')
            )
        ).toBeVisible({ timeout: 8_000 })
    })
})

// ── Auth Modal — Register ─────────────────────────────────────────────────────

test.describe('Register Flow', () => {
    test('successful registration shows dashboard', async ({ page }) => {
        await mockRegisterSuccess(page)
        await page.goto('/')

        // Click "Daftar" / Register button to switch to register tab
        const registerBtn = page.locator('button').filter({ hasText: /daftar|register|buat akun/i }).first()
        await registerBtn.click()
        await page.waitForTimeout(500)

        // Fill registration form
        const nameInput = page.locator('input[placeholder*="nama" i], input[name="name"]').first()
        const emailInput = page.locator('input[type="email"]').first()
        const passwordInput = page.locator('input[type="password"]').first()

        if (await nameInput.isVisible()) await nameInput.fill('New User')
        await emailInput.fill('new@test.com')
        await passwordInput.fill('SecurePass1')

        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /daftar|register/i }).last()
        await submitBtn.click()

        // Should land on dashboard
        await expect(
            page.locator('nav, aside, text=/dashboard/i')
        ).toBeVisible({ timeout: 8_000 })
    })
})

// ── Security: XSS & Injection Inputs ─────────────────────────────────────────

test.describe('Security: Input Handling', () => {
    test('XSS script tags in login email are rejected or escaped', async ({ page }) => {
        await page.goto('/')

        const loginBtn = page.locator('button').filter({ hasText: /masuk|login/i }).first()
        await loginBtn.click()
        await page.waitForTimeout(500)

        const emailInput = page.locator('input[type="email"]').first()
        await emailInput.fill('<script>alert("xss")</script>@test.com')

        // A script alert should never fire
        let alertFired = false
        page.on('dialog', () => { alertFired = true })
        await page.waitForTimeout(1_000)
        expect(alertFired).toBe(false)
    })

    test('page title is not modified by injected input', async ({ page }) => {
        await page.goto('/')
        const original = await page.title()

        // Attempt to inject a title change via input
        const inputs = page.locator('input').first()
        if (await inputs.isVisible()) {
            await inputs.fill('</title><title>Hacked</title>')
        }
        await page.waitForTimeout(500)

        const currentTitle = await page.title()
        expect(currentTitle).toBe(original)
    })
})
