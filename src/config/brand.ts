/**
 * Identidad de marca centralizada.
 * Los colores viven como variables CSS en src/styles/index.css (@theme);
 * aquí se exponen para usos en JS/SVG (canvas, meta theme-color, etc.).
 */
export const brand = {
  name: "PUBLICALLE",
  legalName: "Publicalle HN",
  displayName: "Publicalle",
  tagline: "Publicidad territorial medible.",
  signature: "Moviendo tu marca",
  colors: {
    blue: "#1560C8",
    blueDark: "#0A2F72",
    blueElectric: "#3AA8F0",
    green: "#22C9B4",
    white: "#F4F6FA",
    graphite: "#141A28",
    background: "#050A17",
  },
} as const;

export type BrandColor = keyof typeof brand.colors;
