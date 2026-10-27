/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#025CE2",
        "primary-container": "#024EBE",
        "primary-fixed": "#DAE2FF",
        "primary-fixed-dim": "#B2C5FF",
        "on-primary": "#ffffff",
        "secondary": "#64748B",
        "secondary-container": "#E2E8F0",
        "on-secondary": "#ffffff",
        "surface": "#F8FAFC",
        "surface-dim": "#E2E8F0",
        "surface-container": "#E2E8F0",
        "surface-container-low": "#F1F5F9",
        "surface-container-high": "#CBD5E1",
        "on-surface": "#0F172A",
        "on-surface-variant": "#334155",
        "outline": "#94A3B8",
        "outline-variant": "#CBD5E1",
        "error": "#EF4444",
        "sidebar-bg": "#ffffff",
        "sidebar-card": "#F8FAFC",
        "sidebar-border": "#E2E8F0"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
}
