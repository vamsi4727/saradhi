/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        admin: {
          bg: '#0f1419',
          surface: '#1a2332',
          border: '#2d3a4d',
          muted: '#6b7c93',
          accent: '#3b82f6',
          danger: '#ef4444',
          success: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
