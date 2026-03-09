/** @type {import('tailwindcss').Config} */
export default {
<<<<<<< HEAD
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
        // 3. Optional: Add your brand color here for easier use
        // Now you can use 'bg-brand' or 'text-brand' in your components
        brand: {
          DEFAULT: '#BD5E0A',
          dark: '#964B08',
        },
        // Custom dark backgrounds for your POS look
        darkBg: {
          900: '#1A110B', // The color you used in your logout modal
          800: '#2B1D14',
        }
=======
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4B2E2B",
        "background-light": "#FFF8F0",
        accent: "#F5E6D3",
>>>>>>> feature/merge-develop/staff-dashboard
      },
    },
  },
  plugins: [],
<<<<<<< HEAD
}
=======
};
>>>>>>> feature/merge-develop/staff-dashboard
