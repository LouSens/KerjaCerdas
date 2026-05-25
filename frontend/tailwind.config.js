/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                kc: {
                    cream: '#faf8f2',
                    dark: '#0b0b0f',
                    darker: '#1a1a20',
                    gray: '#6b6760',
                    border: '#e5e0d6',
                    lime: '#c8f26b',
                    cyan: '#7ae7f0',
                    pink: '#ffb7d5',
                    yellow: '#ffcb05',
                    peach: '#ffe0d4',
                    orange: '#ff5722',
                },
                // Aliases so existing index.css component classes still compile
                ink: '#0b0b0f',
                surface: {
                    50: '#faf8f2',
                    100: '#f5f1e8',
                    200: '#e5e0d6',
                    300: '#ccc7bd',
                    400: '#a8a39a',
                    500: '#6b6760',
                    600: '#4a4742',
                    700: '#302e2a',
                    800: '#1a1a20',
                    900: '#0b0b0f',
                },
                brand: {
                    50: '#fff5f2',
                    100: '#ffe8e0',
                    200: '#ffcfbd',
                    300: '#ffad91',
                    400: '#ff7f56',
                    500: '#ff5722',
                    600: '#f03a08',
                    700: '#c82a04',
                    800: '#9e220b',
                    900: '#7f210f',
                    950: '#450d03',
                },
            },
            boxShadow: {
                'brutal': '4px 4px 0px 0px #0b0b0f',
                'brutal-sm': '2px 2px 0px 0px #0b0b0f',
                'brutal-hover': '2px 2px 0px 0px #0b0b0f',
                'brutal-active': '0px 0px 0px 0px #0b0b0f',
            },
            animation: {
                'shimmer': 'kcShimmer 2s linear infinite',
                'spin-slow': 'kcSpin 3s linear infinite',
                'marquee': 'marquee 25s linear infinite',
            },
            keyframes: {
                kcShimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                kcSpin: {
                    to: { transform: 'rotate(360deg)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
            },
        },
    },
    plugins: [],
}
