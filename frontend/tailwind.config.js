/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#1e3a5f", // deep blue
        accent: "#f97316", // orange
      },
    },
  },
  plugins: [],
};
