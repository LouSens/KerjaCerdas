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
                brand: {
                    50: '#fff5f2',
                    100: '#ffe8e0',
                    200: '#ffcfbd',
                    300: '#ffad91',
                    400: '#ff7f56',
                    500: '#ff5722', // Deep vibrant orange
                    600: '#f03a08',
                    700: '#c82a04',
                    800: '#9e220b',
                    900: '#7f210f',
                    950: '#450d03',
                },
                surface: {
                    50: '#FAFAFA',
                    100: '#F4F4F5',
                    200: '#E4E4E7',
                    300: '#D4D4D8',
                    400: '#A1A1AA',
                    500: '#71717A',
                    600: '#52525B',
                    700: '#3F3F46',
                    800: '#27272A',
                    900: '#18181B',
                    950: '#09090B', // Almost black
                },
                ink: {
                    DEFAULT: '#09090B',
                    lighter: '#27272A',
                    muted: '#71717A'
                }
            },
            boxShadow: {
                'brutal': '4px 4px 0px 0px rgba(9, 9, 11, 1)',
                'brutal-sm': '2px 2px 0px 0px rgba(9, 9, 11, 1)',
                'brutal-hover': '2px 2px 0px 0px rgba(9, 9, 11, 1)',
                'brutal-active': '0px 0px 0px 0px rgba(9, 9, 11, 1)',
                'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.04)',
                'premium': '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)'
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'marquee': 'marquee 25s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            },
        },
    },
    plugins: [],
}
