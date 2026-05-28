import { pretextPrepare, pretextLayout, clearPretextCache } from "./pretext";
import { FONT, type BenchmarkResult, type Message } from "./types";

export function runRealBenchmark(
  messages: Message[],
  containerWidth: number,
): BenchmarkResult {
  const bw = Math.round(containerWidth * 0.82 - 24);

  const domContainer = document.createElement("div");
  domContainer.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${containerWidth}px;visibility:hidden;`;
  document.body.appendChild(domContainer);

  // Honest worst case: append each bubble, read its height, then remove it.
  // Interleaving a layout-invalidating write with a read forces the browser
  // to reflow once PER MESSAGE — the "browser pauses for every message" cost
  // the demo dramatizes. Appending all-then-reading would batch into a single
  // reflow and undercount. Removing each node keeps the container at one child
  // so each reflow stays O(1) instead of O(n) — total O(n), not O(n²) (which
  // froze the main thread and the flash animation at large N). Matches
  // domMeasureHeight in HeightCalcTab.
  const t1 = performance.now();
  for (const msg of messages) {
    const d = document.createElement("div");
    d.style.cssText = `width:${bw}px;font:${FONT};padding:8px 12px;word-break:break-word;white-space:pre-wrap;box-sizing:border-box;line-height:24px;`;
    d.textContent = msg.text;
    domContainer.appendChild(d);
    void d.getBoundingClientRect().height;
    domContainer.removeChild(d);
  }
  const tDom = performance.now() - t1;
  document.body.removeChild(domContainer);

  // Pretext's pitch: prepare ONCE upfront, then layout is pure math on
  // every container-width / re-render. Time only the layout phase to match
  // what production code actually pays per reflow.
  clearPretextCache();
  const prepared = messages.map((msg) => pretextPrepare(msg.text, FONT));
  const t2 = performance.now();
  for (const p of prepared) pretextLayout(p, bw);
  const tPretext = performance.now() - t2;

  return {
    dom: tDom.toFixed(2),
    pretext: tPretext.toFixed(2),
    ratio: (tDom / Math.max(tPretext, 0.01)).toFixed(1),
    msgCount: messages.length,
  };
}
