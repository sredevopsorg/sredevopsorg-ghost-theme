/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.hbs",
    "./**/*.hbs",
    "./assets/js/*.js",
    "./node_modules/**/*.hbs",
    "./assets/built/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: [
          "Roboto Mono",
          "ui-monospace",
          "monospace",
          "SFMono-Regular",
          "Consolas",
          "Menlo",
          "Liberation Mono",
        ],
      },
      colors: {
        dark: {
          bg: "#0d0e11",
          card: "#14161a",
          border: "#2a2c35",
          text: "#f3f4f6",
          muted: "#9ca3af",
        },
        brand: {
          blue: "#3b82f6",
          red: "#e53e3e",
          orange: "#fa431a",
          purple: "#7d27d9",
        },
      },
    },
  },
  plugins: [],
};
