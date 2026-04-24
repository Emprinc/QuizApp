/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#EC4899',
        success: '#10B981',
        danger: '#EF4444',
        gold: '#F59E0B',
        silver: '#9CA3AF',
        bronze: '#D97706',
        background: '#0F172A',
        surface: '#1E293B',
        'surface-light': '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.5s ease-in-out infinite',
        'bounce-glow': 'bounceGlow 1s ease-in-out infinite',
      },
      keyframes: {
        bounceGlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}