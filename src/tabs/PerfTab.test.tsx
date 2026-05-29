import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerfTab } from "./PerfTab";
import type { Message } from "../types";

// Small list for the two display panes (the benchmark generates its own
// internal messages from the selected size).
const messages: Message[] = Array.from({ length: 2 }, (_, i) => ({
  id: i,
  role: i % 2 === 0 ? "user" : "assistant",
  text: `Display bubble ${i}.`,
  timestamp: new Date(0),
}));

// runPerf chains setTimeout(60) → setTimeout(80) before measuring.
const RUN_MS = 200;

describe("PerfTab", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders idle: size selector and a Run button, no results yet", () => {
    render(<PerfTab messages={messages} appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    expect(screen.getByRole("button", { name: "100" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "5k" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Run/ }).textContent).toContain(
      "1000 messages",
    );
    expect(screen.queryByText(/faster/)).toBeNull();
  });

  it("reflects the selected size on the Run button", () => {
    render(<PerfTab messages={messages} appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(screen.getByRole("button", { name: "100" }));
    expect(screen.getByRole("button", { name: /Run/ }).textContent).toContain(
      "100 messages",
    );
  });

  it("runs the benchmark and renders both result panes", () => {
    render(<PerfTab messages={messages} appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    // Keep the run cheap.
    fireEvent.click(screen.getByRole("button", { name: "100" }));
    const runBtn = screen.getByRole("button", { name: /Run/ }) as HTMLButtonElement;

    fireEvent.click(runBtn);
    expect(runBtn.disabled).toBe(true);

    act(() => vi.advanceTimersByTime(RUN_MS));

    // Result rendered: speedup badge + per-pane bubble footers.
    expect(screen.getByText(/faster/)).toBeTruthy();
    expect(screen.getAllByText(/measured via DOM reflow/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/height from Canvas math/).length,
    ).toBeGreaterThan(0);
    expect(runBtn.disabled).toBe(false);
  });
});
