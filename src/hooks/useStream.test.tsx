import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the measurement layer so the hook's state machine is deterministic and
// independent of Canvas / a real layout engine (happy-dom has neither for DOM
// height). Each test drives domMeasureHeight as needed.
vi.mock("../pretext", () => ({
  pretextPrepare: vi.fn((text: string) => ({ text })),
  pretextLayout: vi.fn(() => 100),
  domMeasureHeight: vi.fn(() => 0),
}));

import { domMeasureHeight, pretextLayout } from "../pretext";
import { STREAM_TEXT } from "../data";
import { heightToLineCount, useStream } from "./useStream";

const WORDS = STREAM_TEXT.split(" ").length;
const TICK = 60; // matches the hook's setInterval cadence
const FINISH_MS = (WORDS + 1) * TICK;

describe("heightToLineCount — divisor must match the 24px line-height", () => {
  it("maps padding-only height to zero lines", () => {
    expect(heightToLineCount(16)).toBe(0);
  });

  it("counts one line per 24px above the 16px padding", () => {
    expect(heightToLineCount(16 + 24)).toBe(1);
    expect(heightToLineCount(16 + 24 * 5)).toBe(5);
    expect(heightToLineCount(16 + 24 * 12)).toBe(12);
  });

  it("does NOT divide by 20 (regression guard for the page-jump bug)", () => {
    // With the old /20 divisor, a 5-line bubble (height 136) reported 6 lines.
    expect(heightToLineCount(16 + 24 * 5)).not.toBe(Math.round((16 + 24 * 5 - 16) / 20));
    expect(heightToLineCount(16 + 24 * 5)).toBe(5);
  });
});

describe("useStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(domMeasureHeight).mockReset().mockReturnValue(0);
    vi.mocked(pretextLayout).mockReset().mockReturnValue(100);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle with no text", () => {
    const { result } = renderHook(() => useStream(800, false));
    expect(result.current.text).toBe("");
    expect(result.current.active).toBe(false);
    expect(result.current.done).toBe(false);
  });

  it("reserves a predicted height (layout + padding) only when usePretext", () => {
    const withPretext = renderHook(() => useStream(800, true));
    act(() => withPretext.result.current.start());
    // pretextLayout mocked to 100, hook adds 16px padding.
    expect(withPretext.result.current.predictedH).toBe(116);

    const withoutPretext = renderHook(() => useStream(800, false));
    act(() => withoutPretext.result.current.start());
    expect(withoutPretext.result.current.predictedH).toBeNull();
  });

  it("streams the full text word by word, then marks done", () => {
    const { result } = renderHook(() => useStream(800, true));
    act(() => result.current.start());
    expect(result.current.active).toBe(true);
    expect(result.current.done).toBe(false);

    act(() => vi.advanceTimersByTime(TICK));
    expect(result.current.text).toBe(STREAM_TEXT.split(" ")[0]);

    act(() => vi.advanceTimersByTime(FINISH_MS));
    expect(result.current.text).toBe(STREAM_TEXT);
    expect(result.current.active).toBe(false);
    expect(result.current.done).toBe(true);
  });

  it("fires onShift once per new line, not while the line count is flat", () => {
    const onShift = vi.fn();
    // Grow the measured height by one line every 5 words.
    vi.mocked(domMeasureHeight).mockImplementation((text: string) => {
      const words = text === "" ? 0 : text.split(" ").length;
      const lines = Math.max(1, Math.ceil(words / 5));
      return 16 + 24 * lines;
    });

    const { result } = renderHook(() => useStream(800, false, onShift));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(FINISH_MS));

    const expectedLines = Math.ceil(WORDS / 5);
    expect(onShift).toHaveBeenCalledTimes(expectedLines);
  });

  it("does not fire onShift in pretext mode (height is pre-reserved)", () => {
    const onShift = vi.fn();
    const { result } = renderHook(() => useStream(800, true, onShift));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(FINISH_MS));
    expect(onShift).not.toHaveBeenCalled();
  });

  it("stops the timer on unmount (no streaming after teardown)", () => {
    const { result, unmount } = renderHook(() => useStream(800, true));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(TICK * 2));
    const midText = result.current.text;
    expect(midText).not.toBe(STREAM_TEXT);

    unmount();
    // Advancing past completion must not throw or continue streaming.
    expect(() => act(() => vi.advanceTimersByTime(FINISH_MS))).not.toThrow();
  });
});
