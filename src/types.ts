export interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface BenchmarkResult {
  /** DOM measurement time, ms. */
  dom: number;
  /** Pretext layout time, ms. */
  pretext: number;
  /** dom / pretext. */
  ratio: number;
  msgCount: number;
}

export type Phase = "idle" | "running" | "done";

// Single source of truth for the bubble text metrics. Both the rendered
// bubbles (MsgBubble, StreamPane) and the height measurement (pretext/DOM)
// must use the same values, or predicted heights won't match what's drawn.
export const FONT_SIZE = 15;
export const LINE_HEIGHT = 24;
export const FONT = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;

/**
 * Widest text-content width a MsgBubble can wrap at inside a list of
 * `listWidth`. Mirrors MsgBubble.module.css: .row padding 12px each side,
 * .bubble max-width 82%, padding 10px each side + 1px border.
 */
export function bubbleTextWidth(listWidth: number): number {
  return Math.max(1, (listWidth - 24) * 0.82 - 22);
}
