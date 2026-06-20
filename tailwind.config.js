/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Legacy brand purple (auth pages, shared UI) ──────────────────────
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },

        // ── CREATOR persona — YouTube Red Energy System ──────────────────────
        creator: {
          50: '#fff5f5',
          100: '#ffe0df',
          200: '#ffbdbb',
          300: '#ff8f8c',
          400: '#ff5f5a',
          500: '#e8473f', // YouTube-red primary
          600: '#cc2f27',
          700: '#a8221b',
          800: '#7d1a14',
          900: '#4d0f0b',
          dark: '#1a0800',
          surface: '#fff8f5',
        },

        // ── BRAND persona — Navy Authority System ────────────────────────────
        biz: {
          50: '#f0f7ff',
          100: '#dbeeff',
          200: '#b0d8ff',
          300: '#7abbff',
          400: '#3d96f7',
          500: '#0f6fd4',
          600: '#0f3460', // Deep navy primary
          700: '#0a2447',
          800: '#061630',
          900: '#030a18',
          accent: '#00b4d8', // Teal KPI accent
          surface: '#f0f7ff',
        },

        matte: {
          50: '#ffffff',
          100: '#fcfcfc',
          200: '#f8f9fa',
          300: '#f1f3f5',
          400: '#e9ecef',
          800: '#212529',
          900: '#121212',
        },

        accent: {
          neon: '#ccff00',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      boxShadow: {
        // Depth hierarchy — more important = bigger shadow
        brutal: '4px 4px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-sm': '2px 2px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-md': '6px 6px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-xl': '12px 12px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-2xl': '16px 16px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-hover': '2px 2px 0px 0px rgba(18, 18, 18, 1)',
        // Persona glows
        'creator-glow': '0 0 0 3px rgba(232, 71, 63, 0.2)',
        'biz-glow': '0 0 0 3px rgba(0, 180, 216, 0.2)',
        'soft-glow': '0 10px 40px -10px rgba(124, 58, 237, 0.3)',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scalePop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-right': 'slideRight 0.2s ease-out both',
        shimmer: 'shimmer 1.5s infinite linear',
        'scale-pop': 'scalePop 0.3s ease-out both',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
