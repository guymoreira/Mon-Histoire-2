/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#79d4e7',
          DEFAULT: '#395872',
          dark: '#0a3d62',
        },
        secondary: {
          light: '#d5b8f6',
          DEFAULT: '#5c4683',
          dark: '#4a3669',
        },
        cream: '#fff8e1',
      },
      fontFamily: {
        fredoka: ['Fredoka', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '36px',
        '3xl': '36px',
      },
      boxShadow: {
        'card': '0 8px 34px rgba(76,195,247,0.11), 0 3px 12px rgba(180,150,240,0.10)'
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}