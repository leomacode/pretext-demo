// Thin adapter around @chenglou/pretext so the rest of the app uses one
// stable surface (and tests can stub it).
import {
  prepare,
  layout as pretextLibLayout,
  clearCache,
  type PreparedText as LibPreparedText,
} from "@chenglou/pretext";
import { LINE_HEIGHT } from "./types";

export type PreparedText = LibPreparedText;

export function pretextPrepare(text: string, font: string): PreparedText {
  return prepare(text, font);
}

/** Pure text height (no padding) at the given text-content width. */
export function pretextLayout(
  prepared: PreparedText,
  textWidth: number,
  lineHeight = LINE_HEIGHT,
): number {
  const { height } = pretextLibLayout(prepared, textWidth, lineHeight);
  return Math.max(height, lineHeight);
}

// Convenience: prepare + layout in one call.
export function layout(
  text: string,
  textWidth: number,
  font: string,
  lineHeight = LINE_HEIGHT,
): number {
  return pretextLayout(prepare(text, font), textWidth, lineHeight);
}

export function clearPretextCache(): void {
  clearCache();
}

/**
 * The "old way": render the text off-screen and read its height back. The
 * append → read → remove sequence forces one synchronous reflow per call.
 * Returns pure text height (no padding), comparable to pretextLayout.
 */
export function domMeasureHeight(
  text: string,
  textWidth: number,
  font: string,
): number {
  const div = document.createElement("div");
  div.style.cssText = `position:fixed;visibility:hidden;top:-9999px;width:${textWidth}px;font:${font};line-height:${LINE_HEIGHT}px;white-space:pre-wrap;word-break:break-word;`;
  div.textContent = text;
  document.body.appendChild(div);
  const h = div.getBoundingClientRect().height;
  div.remove();
  return h;
}
