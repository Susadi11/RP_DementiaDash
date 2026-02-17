/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',
        deepBlue: '#1E3A8A',
        lightBlue: '#7DD3FC',
        secondary: '#64748B',
        accent: '#0284C7',
        background: '#FFFFFF',
        secondaryBg: '#F9FAFB',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
