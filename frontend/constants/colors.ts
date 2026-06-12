// Gurudedo brand palette — extracted from the official logo.
// Keep in sync with tailwind.config.js.

export const Colors = {
  // Primary brand colors (the "ગુરુ દે DO" wordmark)
  purple: "#5B2C8C", // primary — deep violet from "ગુરુ" / center swirl
  purpleDark: "#3E1F73", // hover / pressed
  red: "#E63946", // accent — vibrant red from "દે"
  teal: "#1FA9B3", // accent — cool teal from "DO" and tagline accents
  pink: "#E63ED4", // highlight — hot pink from the underline strokes

  // Surfaces
  cream: "#FFFBF5", // page background — soft warm white
  white: "#FFFFFF",
  surface: "#FAF6FF", // subtle purple-tinted surface

  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",

  // Text
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
  border: "#E8E0F0",

  // Category petal colors (from the logo's surrounding icons)
  // Indexed by category slug so each tile gets its own vibrant color.
  category: {
    academics: "#4CAF50",   // green book
    music: "#E91E63",       // magenta music note
    dance: "#FF6FB5",       // pink dancer
    fitness: "#2196F3",     // blue ball
    art: "#FF9800",         // orange brush
    cooking: "#F44336",     // red chef
    beauty: "#E63ED4",      // hot pink
    language: "#9C27B0",    // purple
    tech: "#00BCD4",        // cyan code
    spiritual: "#7E57C2",   // soft purple lotus
    photography: "#5B2C8C", // deep purple
    other: "#FFC107",       // yellow star
  },
} as const;

export type ColorName = keyof typeof Colors;
