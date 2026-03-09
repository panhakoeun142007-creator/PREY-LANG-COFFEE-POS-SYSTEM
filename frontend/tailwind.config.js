/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4B2E2B",
        "background-light": "#FFF8F0",
        accent: "#F5E6D3",
      },
    },
  },
  plugins: [],
};
