/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glucose-low': '#ef4444',
        'glucose-in-range': '#22c55e',
        'glucose-high': '#f59e0b',
        'glucose-very-high': '#dc2626',
      }
    },
  },
  plugins: [],
}
