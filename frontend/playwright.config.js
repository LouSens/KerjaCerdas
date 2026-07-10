import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration for KerjaCerdas.
 *
 * Assumes the app is running locally at http://localhost:3000
 * (started via `npm run dev`).
 *
 * In CI the `webServer` block auto-starts the dev server before tests run.
 */
export default defineConfig({
    testDir: './src/tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ],
    // Auto-start the dev server in CI / when not already running
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
