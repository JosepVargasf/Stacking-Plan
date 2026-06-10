/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A237E',
          light: '#E8EAF6',
          muted: '#7986CB',
        },
      },
    },
  },
  plugins: [],
}
