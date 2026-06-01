import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    // In Docker, VITE_API_URL is set to http://api:8000 via docker-compose.
    // In local dev, it falls back to http://localhost:8000.
    const apiTarget = env.VITE_API_URL || 'http://localhost:8000'

    return {
        plugins: [react()],
        server: {
            port: 3000,
            host: '0.0.0.0',
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
    }
})
