// Shared design tokens. Keep names short — they're used everywhere in JSX.
export const T = {
  // Text greys on dark bg (low → high contrast)
  text55: "#ffffff55",
  text66: "#ffffff66",
  text77: "#ffffff77",
  text88: "#ffffff88",
  text99: "#ffffff99",
  textaa: "#ffffffaa",
  textbb: "#ffffffbb",
  textcc: "#ffffffcc",
  // Panel backgrounds & borders
  line: "rgba(255,255,255,0.07)",
  line5: "rgba(255,255,255,0.05)",
  fill1: "rgba(255,255,255,0.03)",
  fill25: "rgba(255,255,255,0.025)",
  fill4: "rgba(255,255,255,0.04)",
  fill5: "rgba(255,255,255,0.05)",
  fill6: "rgba(255,255,255,0.06)",
  fill8: "rgba(255,255,255,0.08)",
  fill10: "rgba(255,255,255,0.1)",
  fill15: "rgba(255,255,255,0.15)",
  fill20: "rgba(255,255,255,0.2)",
  fill40: "rgba(255,255,255,0.4)",
  fill70: "rgba(255,255,255,0.7)",
  surface: "rgba(0,0,0,0.2)",
  // App
  bgApp: "#07070e",
  bgBar: "rgba(0,0,0,0.7)",
  // Per-tab semantic colors
  L: "#ff6b6b", // "without Pretext" (red)
  R: "#00ff9d", // "with Pretext" (green)
  // Fonts
  fontMono: "'IBM Plex Mono',monospace",
  fontSans: "system-ui,sans-serif",
} as const;
