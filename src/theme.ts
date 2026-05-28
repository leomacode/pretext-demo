// Per-tab semantic colors, passed into components as the `--c` CSS custom
// property. All other design tokens (greys, fills, fonts) now live as CSS
// variables in index.css ':root' — see the styling notes there.
// Keep these in sync with --col-l / --col-r.
export const T = {
  L: "#ff6b6b", // "without Pretext" (red)
  R: "#00ff9d", // "with Pretext" (green)
} as const;
