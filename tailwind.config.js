/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        deepBlue: '#2d2d2d',
        lightBlue: '#a8a8a8',
        secondary: '#6b7280',
        background: '#FFFFFF',
        secondaryBg: '#f5f5f5',
        border: '#e0e0e0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
