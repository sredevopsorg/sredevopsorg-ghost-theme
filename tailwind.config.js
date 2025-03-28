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
      fontSize: {
        '2xs': '0.625rem', // 10px
        '3xs': '0.5rem', // 8px
        '4xs': '0.375rem', // 6px
        '5xs': '0.25rem' // 4px
      },
      colors: {
        darker: "#0f0f0f", // Global background
        dark: "#212121", // Secondary background
        lighter: "#ffffff", // Main texts, links, headings
        // light: "#C2C2C2", // Contents, body, text
        light: "#e6e6e6",
        highlight: "#600ba0"
      },
      fontFamily: {
        'body': [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ],
        'sans': [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
          ],
        'serif': [
          'ui-serif', 
          'Georgia', 
          'Cambria', 
          'Times New Roman', 
          'Times', 
          'serif'
        ],
        'mono': [
          'ui-monospace', 
          'SFMono-Regular', 
          'Consolas', 
          'Liberation Mono', 
          'Menlo', 
          'monospace'
        ]
      }
    },
  },
  plugins: [require("@tailwindcss/typography", "@tailwindcss/forms")],
};
