/** @type {import('tailwindcss').Config} */
export default {
  // 1. Enable dark mode using the 'class' strategy
  darkMode: 'class',

  // 2. Ensure Tailwind scans all your React files
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          DEFAULT: '#BD5E0A',
          dark: '#964B08',
        },
        primary: "#4B2E2B",
        "background-light": "#FFF8F0",
        accent: "#F5E6D3",
        // Custom dark backgrounds for your POS look
        darkBg: {
          900: '#1A110B',
          800: '#2B1D14',
        }
      },
    },
  },
  plugins: [],
}
