/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F46E5',
          700: '#3730A3',
          900: '#1E1B4B',
        },
        saffron: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        bull: '#16A34A',
        bear: '#DC2626',
        neutral: '#6B7280',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
};
