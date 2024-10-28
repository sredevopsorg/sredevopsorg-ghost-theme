/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.hbs",
    "./**/*.hbs",
    "./assets/js/*.js",
    "./node_modules/**/*.hbs",
    "./assets/built/*.js"
  ],
  theme: {
    extend: {
      colors: {
        darker: "#0f0f0f", // Global background
        dark: "#212121", // Secondary background
        lighter: "#fefefe", // Main texts, links, headings
        light: "#C2C2C2", // Contents, body, text
        highlight: "#600ba0"
      },
    },
  },
  plugins: [require("@tailwindcss/typography", "@tailwindcss/forms")],
};
