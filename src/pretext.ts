// Thin adapter around @chenglou/pretext so the rest of the app uses one
// stable surface (and tests can stub it).
import {
  prepare,
  layout as pretextLibLayout,
  clearCache,
  type PreparedText as LibPreparedText,
} from "@chenglou/pretext";

export type PreparedText = LibPreparedText;

export function pretextPrepare(text: string, font: string): PreparedText {
  return prepare(text, font);
}

export function pretextLayout(
  prepared: PreparedText,
  containerWidth: number,
  lineHeight = 24,
): number {
  const { height } = pretextLibLayout(prepared, containerWidth, lineHeight);
  return Math.max(height, lineHeight);
}

// Convenience: prepare + layout in one call.
export function layout(
  text: string,
  containerWidth: number,
  font: string,
  lineHeight = 24,
): number {
  return pretextLayout(prepare(text, font), containerWidth, lineHeight);
}

export function clearPretextCache(): void {
  clearCache();
}

export function domMeasureHeight(
  text: string,
  containerWidth: number,
  font: string,
): number {
  const div = document.createElement("div");
  div.style.cssText = `position:fixed;visibility:hidden;top:-9999px;width:${containerWidth}px;font:${font};padding:8px 12px;word-break:break-word;white-space:pre-wrap;box-sizing:border-box;line-height:24px;`;
  div.textContent = text;
  document.body.appendChild(div);
  const h = div.getBoundingClientRect().height;
  document.body.removeChild(div);
  return h;
}
