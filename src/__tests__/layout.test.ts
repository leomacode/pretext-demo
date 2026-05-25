import { describe, it, expect } from "vitest";
import { layout, domMeasureHeight } from "../pretext";

const FONT = "16px sans-serif";
const WIDTH = 400;
const LINE_HEIGHT = 24;

// @chenglou/pretext needs a Canvas 2D context, which happy-dom doesn't
// provide. Probe once; skip layout assertions when unavailable.
const canvasWorks = (() => {
  try {
    layout("probe", WIDTH, FONT);
    return true;
  } catch {
    return false;
  }
})();

// happy-dom has no layout engine, so getBoundingClientRect().height returns 0.
const domWorks = domMeasureHeight("probe", WIDTH, FONT) > 0;

describe("layout(): Pretext height calculation", () => {
  const cases: Array<[string, string]> = [
    ["short", "Hello world"],
    [
      "long single line",
      "The quick brown fox jumps over the lazy dog and keeps going for a while.",
    ],
    [
      "multi-line",
      "Line one.\nLine two is a bit longer.\nLine three.\nLine four.",
    ],
    ["unicode", "Café résumé — naïve façade, jalapeño piñata."],
    ["empty", ""],
  ];

  it.skipIf(!canvasWorks).each(cases)(
    "returns a positive height for %s",
    (_label, text) => {
      const h = layout(text, WIDTH, FONT);
      expect(h).toBeGreaterThanOrEqual(LINE_HEIGHT);
    },
  );

  it.skipIf(!canvasWorks)(
    "returns more height for text that overflows a single line",
    () => {
      const short = layout("Hi", WIDTH, FONT);
      const long = layout("word ".repeat(200).trim(), WIDTH, FONT);
      expect(long).toBeGreaterThan(short);
    },
  );

  // Real cross-validation — only runs in environments with both a Canvas
  // context and a CSS layout engine (real browsers, jsdom-with-css).
  it.skipIf(!canvasWorks || !domWorks).each(cases)(
    "matches DOM within ±2px for %s",
    (_label, text) => {
      const pretextHeight = layout(text, WIDTH, FONT);
      const domHeight = domMeasureHeight(text, WIDTH, FONT);
      expect(Math.abs(pretextHeight - domHeight)).toBeLessThanOrEqual(2);
    },
  );
});
