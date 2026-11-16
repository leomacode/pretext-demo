import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pretextLayout, pretextPrepare, domMeasureHeight } from "../pretext";
import { FONT, LINE_HEIGHT } from "../types";
import { STREAM_TEXT } from "../data";

const WORDS = STREAM_TEXT.split(" ");

// StreamPane bubble: 12px padding each side + 1px border (StreamPane.module.css).
const BUBBLE_CHROME_X = 26;

/** Convert a measured text height (px, no padding) to its line count. */
export function heightToLineCount(height: number): number {
  return Math.round(height / LINE_HEIGHT);
}

export function useStream(usePretext: boolean, onShift?: () => void) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);
  const [predictedH, setPredictedH] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLines = useRef(0);

  // Keep onShift in a ref so its identity doesn't churn `start`'s deps.
  // Callers can pass an inline anonymous function each render without
  // forcing every consumer to wrap it in their own useCallback.
  // No dep array on purpose: callers pass a fresh closure every render, so
  // `[onShift]` would never match and the effect must run every commit anyway.
  const onShiftRef = useRef(onShift);
  useEffect(() => {
    onShiftRef.current = onShift;
  });

  /** `boxWidth`: the bubble's outer width, read by the caller at click time. */
  const start = useCallback((boxWidth: number) => {
    if (timer.current) clearInterval(timer.current);
    prevLines.current = 0;
    const textWidth = Math.max(1, boxWidth - BUBBLE_CHROME_X);
    setPredictedH(
      usePretext
        ? pretextLayout(pretextPrepare(STREAM_TEXT, FONT), textWidth)
        : null,
    );
    setText("");
    setActive(true);
    setDone(false);
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      const partial = WORDS.slice(0, i).join(" ");
      setText(partial);
      if (!usePretext) {
        const lines = heightToLineCount(
          domMeasureHeight(partial, textWidth, FONT),
        );
        if (lines > prevLines.current) {
          onShiftRef.current?.();
          prevLines.current = lines;
        }
      }
      if (i >= WORDS.length) {
        if (timer.current) clearInterval(timer.current);
        setActive(false);
        setDone(true);
      }
    }, 60);
  }, [usePretext]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  return useMemo(
    () => ({ text, active, predictedH, start, done }),
    [text, active, predictedH, start, done],
  );
}

export type StreamState = ReturnType<typeof useStream>;
