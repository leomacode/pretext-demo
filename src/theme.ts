// Per-side colors. The values live once in index.css (--col-l / --col-r);
// components receive these as the `--c` custom property and tint with
// color-mix(), so no hex math happens in JS.
export const L = "var(--col-l)"; // "without Pretext" (red)
export const R = "var(--col-r)"; // "with Pretext" (green)
