/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        },
        dw: {
          bg: 'var(--dw-bg)',
          accent: 'var(--dw-accent)',
        },
      },
      borderRadius: {
        'card': 'var(--dw-radius-card)',
        'control': 'var(--dw-radius-control)',
      },
    },
  },
  plugins: [],
}