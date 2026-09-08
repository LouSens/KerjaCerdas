import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    // API_PROXY_TARGET (not VITE_-prefixed) is this dev server's own proxy
    // target — see its docker-compose.yml comment for why it must stay
    // separate from VITE_API_URL, which api.js reads client-side to build
    // an absolute fetch URL. Falling back to VITE_API_URL keeps this
    // working for anyone with an older .env that only set that one: dev
    // outside Docker with no proxy target configured at all falls back to
    // localhost:8000, which the local Vite process can resolve directly.
    const apiTarget = env.API_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:8000'

    return {
        plugins: [react()],
        server: {
            port: 5000,
            host: '0.0.0.0',
            allowedHosts: true,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/health': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
        // ── Vitest ──────────────────────────────────────────────────────
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/tests/setup.js'],
            include: ['src/tests/**/*.test.{js,jsx,ts,tsx}'],
            coverage: {
                reporter: ['text', 'lcov'],
                include: ['src/**/*.{js,jsx}'],
                exclude: ['src/tests/**', 'src/main.jsx'],
            },
        },
    }
})
