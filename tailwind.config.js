/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy:  '#3949ab',
        coral: '#ef5b5b',
        page:  '#2b3a99',
        panel: '#f0f3fa',
      },
    },
  },
  plugins: [],
}
