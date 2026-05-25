import { useCallback, useEffect, useRef, useState } from "react";
import { pretextLayout, pretextPrepare, domMeasureHeight } from "../pretext";
import { FONT } from "../types";
import { STREAM_TEXT } from "../data";

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
      if (!usePretext && onShift) {
        const bw2 = containerWidth * 0.82 - 24;
        const h = domMeasureHeight(partial, bw2, FONT);
        const lines = Math.round((h - 16) / 20);
        if (lines > prevLines.current) {
          onShift();
          prevLines.current = lines;
        }
      }
      if (i >= words.length) {
        if (timer.current) clearInterval(timer.current);
        setActive(false);
        setDone(true);
      }
    }, 60);
  }, [containerWidth, usePretext, onShift]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  return { text, active, predictedH, start, done };
}

export type StreamState = ReturnType<typeof useStream>;
