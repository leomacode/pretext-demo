import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeightCalcTab } from "./HeightCalcTab";
import type { Message } from "../types";

const messages: Message[] = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  role: i % 2 === 0 ? "user" : "assistant",
  text: `Message number ${i} with a little text.`,
  timestamp: new Date(0),
}));

// 35ms reveal cadence; 3 messages → ~105ms to reach "done".
const FINISH_MS = 3 * 35 + 50;

function loadButton(): HTMLButtonElement {
  return screen.getByRole("button") as HTMLButtonElement;
}

describe("HeightCalcTab phase machine", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders the idle state with a Load button and hints", () => {
    render(<HeightCalcTab messages={messages} L="#ff6b6b" R="#00ff9d" />);
    expect(loadButton().textContent).toContain("Load");
    expect(loadButton().textContent).toContain("3 messages");
    expect(screen.getByText(/Press "Load" to see it happen/)).toBeTruthy();
    expect(loadButton().disabled).toBe(false);
  });

  it("disables the button and shows progress while running", () => {
    render(<HeightCalcTab messages={messages} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(loadButton());
    expect(loadButton().disabled).toBe(true);
    expect(loadButton().textContent).toContain("loading");
  });

  it("reaches done: shows Reset, a speedup card, and the zero-pauses note", () => {
    render(<HeightCalcTab messages={messages} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(loadButton());
    act(() => vi.advanceTimersByTime(FINISH_MS));

    expect(loadButton().textContent).toContain("Reset");
    expect(loadButton().disabled).toBe(false);
    expect(screen.getByText("faster")).toBeTruthy();
    expect(screen.getByText(/Zero page pauses/)).toBeTruthy();
  });

  it("returns to idle when Reset is clicked", () => {
    render(<HeightCalcTab messages={messages} L="#ff6b6b" R="#00ff9d" />);
    fireEvent.click(loadButton());
    act(() => vi.advanceTimersByTime(FINISH_MS));
    expect(loadButton().textContent).toContain("Reset");

    fireEvent.click(loadButton());
    expect(loadButton().textContent).toContain("Load");
    expect(screen.getByText(/Press "Load" to see it happen/)).toBeTruthy();
  });
});
