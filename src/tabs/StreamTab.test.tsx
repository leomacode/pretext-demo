import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Drive the measurement layer: real domMeasureHeight returns 0 in happy-dom
// (no layout engine), so the left pane would never register a "page jump".
// Mock it to grow with word count so the jump counter is exercised.
vi.mock("../pretext", () => ({
  pretextPrepare: vi.fn((text: string) => ({ text })),
  pretextLayout: vi.fn(() => 100),
  domMeasureHeight: vi.fn((text: string) => {
    const words = text ? text.split(" ").length : 0;
    return 16 + 24 * Math.max(1, Math.ceil(words / 8));
  }),
}));

import { StreamTab } from "./StreamTab";
import { STREAM_TEXT } from "../data";

const WORDS = STREAM_TEXT.split(" ").length;
const FINISH_MS = (WORDS + 1) * 60; // 60ms per word

function streamButton(): HTMLButtonElement {
  return screen.getByRole("button") as HTMLButtonElement;
}

describe("StreamTab", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders idle with a Stream button and placeholders", () => {
    render(<StreamTab appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    expect(streamButton().textContent).toContain("Stream both");
    expect(screen.getByText(/Press the button in the middle to start/)).toBeTruthy();
    expect(screen.getByText("Waiting…")).toBeTruthy();
  });

  it("disables the button and shows streaming state on click", () => {
    render(<StreamTab appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(streamButton());
    expect(streamButton().disabled).toBe(true);
    expect(streamButton().textContent).toContain("Streaming");
  });

  it("counts left-side page jumps and locks the right side at zero", () => {
    render(<StreamTab appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(streamButton());
    act(() => vi.advanceTimersByTime(FINISH_MS));

    // Left pane registered real layout shifts.
    expect(screen.getAllByText(/page jump/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/The page jumped/)).toBeTruthy();
    // Right pane stayed locked.
    expect(screen.getByText(/Zero page jumps\./)).toBeTruthy();
    // Button re-enabled after completion.
    expect(streamButton().disabled).toBe(false);
  });

  it("reserves a predicted height on the right (Pretext) bubble", () => {
    render(<StreamTab appWidth={800} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(streamButton());
    // pretextLayout mocked to 100, hook adds 16px → 116px reserved.
    expect(screen.getByText(/space reserved: 116px/)).toBeTruthy();
  });
});
