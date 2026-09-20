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
          bg: '#0B0D10',
          panel: '#12151A',
          border: '#252A31',
          text: '#F1F3F5',
          muted: '#8B949E',
        },
        status: {
          critical: '#EF4444',
          high: '#F97316',
          warning: '#EAB308',
          success: '#22C55E',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
