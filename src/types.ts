export interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface BenchmarkResult {
  dom: string;
  pretext: string;
  ratio: string;
  msgCount: number;
}

export type Phase = "idle" | "running" | "done";

// Single source of truth for the bubble text metrics. Both the rendered
// bubbles (MsgBubble) and the height measurement (pretext/DOM via FONT) must
// use the same size, or predicted heights won't match what's drawn.
export const FONT_SIZE = 15;
export const FONT = `${FONT_SIZE}px 'IBM Plex Mono', monospace`;
