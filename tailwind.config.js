/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        apple: {
          gray: '#F5F5F7',
          dark: '#1D1D1F',
          blue: '#0071E3',
        }
      },
      borderRadius: {
        'apple': '20px',
      }
    },
  },
  plugins: [],
}
