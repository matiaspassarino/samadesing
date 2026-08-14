/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/industrias-sur/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0fa',
          500: '#005ba3',
          900: '#002442',
        },
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        neutral: {
          50: '#f8fafc',
          200: '#e2e8f0',
          800: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
