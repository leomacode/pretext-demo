import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pretextLayout, pretextPrepare, domMeasureHeight } from "../pretext";
import { FONT } from "../types";
import { STREAM_TEXT } from "../data";

// Bubble box metrics — must match domMeasureHeight's CSS (8px top + 8px bottom
// padding, 24px line-height). Used to turn a measured pixel height into a line
// count so we can detect when streaming added a new line (= a layout shift).
export const BUBBLE_PADDING_Y = 16;
export const BUBBLE_LINE_HEIGHT = 24;

/** Convert a measured bubble height (px) to its rendered line count. */
export function heightToLineCount(height: number): number {
  return Math.round((height - BUBBLE_PADDING_Y) / BUBBLE_LINE_HEIGHT);
}

export function useStream(
  containerWidth: number,
  usePretext: boolean,
  onShift?: () => void,
) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(false);
  const [predictedH, setPredictedH] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLines = useRef(0);

  // Keep onShift in a ref so its identity doesn't churn `start`'s deps.
  // Callers can pass an inline anonymous function each render without
  // forcing every consumer to wrap it in their own useCallback.
  const onShiftRef = useRef(onShift);
  useEffect(() => {
    onShiftRef.current = onShift;
  }, [onShift]);

  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    prevLines.current = 0;
    const bw = containerWidth * 0.82 - 24;
    if (usePretext) {
      setPredictedH(pretextLayout(pretextPrepare(STREAM_TEXT, FONT), bw) + 16);
    } else {
      setPredictedH(null);
    }
    setText("");
    setActive(true);
    setDone(false);
    const words = STREAM_TEXT.split(" ");
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      const partial = words.slice(0, i).join(" ");
      setText(partial);
      if (!usePretext) {
        const bw2 = containerWidth * 0.82 - 24;
        const h = domMeasureHeight(partial, bw2, FONT);
        const lines = heightToLineCount(h);
        if (lines > prevLines.current) {
          onShiftRef.current?.();
          prevLines.current = lines;
        }
      }
      if (i >= words.length) {
        if (timer.current) clearInterval(timer.current);
        setActive(false);
        setDone(true);
      }
    }, 60);
  }, [containerWidth, usePretext]);

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
