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
        // Primary brand
        purple: "#5B2C8C",
        "purple-dark": "#3E1F73",
        red: "#E63946",
        teal: "#1FA9B3",
        pink: "#E63ED4",
        // Surfaces
        cream: "#FFFBF5",
        surface: "#FAF6FF",
        // Semantic
        success: "#22C55E",
        warning: "#F59E0B",
        // Text
        "text-dark": "#1A1A1A",
        "text-muted": "#6B7280",
        "brand-border": "#E8E0F0",
        // Category rainbow
        "cat-academics": "#4CAF50",
        "cat-music": "#E91E63",
        "cat-dance": "#FF6FB5",
        "cat-fitness": "#2196F3",
        "cat-art": "#FF9800",
        "cat-cooking": "#F44336",
        "cat-beauty": "#E63ED4",
        "cat-language": "#9C27B0",
        "cat-tech": "#00BCD4",
        "cat-spiritual": "#7E57C2",
        "cat-photography": "#5B2C8C",
        "cat-other": "#FFC107",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
