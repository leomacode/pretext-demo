import { pretextPrepare, pretextLayout, clearPretextCache, domMeasureHeight } from "./pretext";
import { FONT, type BenchmarkResult, type Message } from "./types";

/**
 * Time measuring every message's height both ways at `textWidth`. Shared by
 * the Height Calculation and Speed Test tabs so their numbers are comparable.
 */
export function runRealBenchmark(
  messages: Message[],
  textWidth: number,
): BenchmarkResult {
  // Warm both paths once so neither number is dominated by first-call setup
  // (JIT, style recalc of a cold document) at small N.
  domMeasureHeight("warm-up", textWidth, FONT);

  // Honest worst case: one forced reflow PER message — the "browser pauses
  // for every message" cost the demo dramatizes. Each probe is removed after
  // reading, so each reflow stays O(1) and the total O(n), not O(n²).
  const t1 = performance.now();
  for (const msg of messages) domMeasureHeight(msg.text, textWidth, FONT);
  const dom = performance.now() - t1;

  // Pretext's pitch: prepare ONCE upfront, then layout is pure math on every
  // reflow. Time only the layout phase — what production code pays per
  // re-render.
  clearPretextCache();
  const prepared = messages.map((msg) => pretextPrepare(msg.text, FONT));
  for (const p of prepared) pretextLayout(p, textWidth);
  const t2 = performance.now();
  for (const p of prepared) pretextLayout(p, textWidth);
  const pretext = performance.now() - t2;

  return {
    dom,
    pretext,
    ratio: dom / Math.max(pretext, 0.01),
    msgCount: messages.length,
  };
}
