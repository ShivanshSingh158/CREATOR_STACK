/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Electric Purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        matte: {
          50: '#ffffff',
          100: '#fcfcfc',
          200: '#f8f9fa', // Matte White
          300: '#f1f3f5',
          400: '#e9ecef',
          800: '#212529',
          900: '#121212', // Stark black
        },
        accent: {
          neon: '#ccff00', // GenZ Neon Yellow/Lime
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-hover': '2px 2px 0px 0px rgba(18, 18, 18, 1)',
        'brutal-sm': '2px 2px 0px 0px rgba(18, 18, 18, 1)',
        'soft-glow': '0 10px 40px -10px rgba(124, 58, 237, 0.3)',
      }
    },
  },
  plugins: [],
}
