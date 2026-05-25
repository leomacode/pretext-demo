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

export const FONT = "15px 'IBM Plex Mono', monospace";
