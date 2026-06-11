// Gurudedo brand palette — keep in sync with tailwind.config.js
export const Colors = {
  saffron: "#FF6B35", // primary — Indian saffron
  navy: "#1B2B4B", // secondary — deep navy
  cream: "#FFF8F0", // background — warm cream
  white: "#FFFFFF",
  success: "#22C55E",
  warning: "#F59E0B",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
} as const;

export type ColorName = keyof typeof Colors;
