import { describe, it, expect } from "vitest";
import { layout, domMeasureHeight } from "../pretext";

const FONT = "16px sans-serif";
const WIDTH = 400;
const LINE_HEIGHT = 24;
// domMeasureHeight renders with `padding: 8px 12px`, so its height includes
// 16px of vertical padding that layout() (pure text height) does not. The app
// accounts for this the same way (useStream adds 16 to the predicted height).
const PADDING_Y = 16;

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
  // context and a CSS layout engine (real browser via the `browser` Vitest
  // project). Validates that Pretext's soft-wrapping matches the browser's.
  // Excludes:
  //  - "empty": a 0-char DOM bubble collapses its line box to padding-only
  //    while layout() clamps to one line-height — never a real stream state.
  //  - "multi-line": layout() collapses hard "\n" newlines whereas
  //    domMeasureHeight renders them via white-space:pre-wrap. The app's
  //    content has no hard newlines, so this isn't a representative case.
  const skipLabels = new Set(["empty", "multi-line"]);
  const matchCases = cases.filter(([label]) => !skipLabels.has(label));
  it.skipIf(!canvasWorks || !domWorks).each(matchCases)(
    "matches DOM within ±2px for %s",
    (_label, text) => {
      const pretextHeight = layout(text, WIDTH, FONT) + PADDING_Y;
      const domHeight = domMeasureHeight(text, WIDTH, FONT);
      expect(Math.abs(pretextHeight - domHeight)).toBeLessThanOrEqual(2);
    },
  );
});
