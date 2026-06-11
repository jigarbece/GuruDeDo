/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        saffron: "#FF6B35",
        navy: "#1B2B4B",
        cream: "#FFF8F0",
        success: "#22C55E",
        warning: "#F59E0B",
        "text-dark": "#1A1A1A",
        "text-muted": "#6B7280",
        "brand-border": "#E5E7EB",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
