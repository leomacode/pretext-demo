import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { runRealBenchmark } from "../benchmark";
import { CenterRail } from "../components/CenterRail";
import { PerfPane } from "../components/PerfPane";
import { generateMessages } from "../data";
import { L, R } from "../theme";
import grid from "./layout.module.css";
import s from "./PerfTab.module.css";
import { bubbleTextWidth, type BenchmarkResult, type Message } from "../types";

interface PerfTabProps {
  messages: Message[];
}

const SIZES = [100, 1000, 5000];

export function PerfTab({ messages }: PerfTabProps) {
  const [perfResult, setPerfResult] = useState<BenchmarkResult | null>(null);
  const [perfRunning, setPerfRunning] = useState(false);
  const [perfStep, setPerfStep] = useState("");
  const [perfSize, setPerfSize] = useState(1000);
  const listRef = useRef<HTMLDivElement>(null);
  const stepTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Don't let a pending step fire setState after unmount.
  useEffect(() => () => clearTimeout(stepTimer.current), []);

  const runPerf = useCallback(() => {
    setPerfRunning(true);
    setPerfResult(null);
    setPerfStep(`Rendering ${perfSize} messages into the page…`);
    // Two short pauses so each step label paints before the blocking run.
    stepTimer.current = setTimeout(() => {
      setPerfStep("Measuring with DOM (triggering reflows)…");
      stepTimer.current = setTimeout(() => {
        const width = bubbleTextWidth(listRef.current?.clientWidth ?? 0);
        setPerfResult(runRealBenchmark(generateMessages(perfSize), width));
        setPerfRunning(false);
        setPerfStep("");
      }, 80);
    }, 60);
  }, [perfSize]);

  const perMsgMs = perfResult ? perfResult.dom / perfResult.msgCount : 0;

  const pretextBarWidth = perfResult
    ? `${Math.min(100, (perfResult.pretext / Math.max(perfResult.dom, 0.01)) * 100)}%`
    : "100%";

  return (
    <div className={grid.grid}>
      <PerfPane
        color={L}
        header={
          <>
            Old method — browser pauses and re-measures
            <br />
            the whole page for every single message.
          </>
        }
        result={perfResult}
        value={perfResult?.dom.toFixed(2)}
        valueSuffix={
          <div className={s.suffixText}>
            to measure {perfResult?.msgCount} messages
          </div>
        }
        statFooter={
          <>
            ⏱ {perMsgMs.toFixed(2)}ms per message
            {perMsgMs > 0 && (
              <>
                {" · "}
                <span className={s.warn} style={{ "--c": L } as CSSProperties}>
                  ⚠️ Just {Math.max(1, Math.floor(16 / perMsgMs))} messages =
                  already slow enough to feel laggy
                </span>
              </>
            )}
          </>
        }
        bubbleFooter="← measured via DOM reflow"
        messages={messages}
        showFlash={perfRunning}
        listRef={listRef}
      />

      <CenterRail>
        <div className={s.sizes}>
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPerfSize(n)}
              disabled={perfRunning}
              className={s.sizeBtn}
              data-active={perfSize === n}
            >
              {n >= 1000 ? `${n / 1000}k` : n}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={runPerf}
          disabled={perfRunning}
          className={s.runBtn}
        >
          {perfRunning ? "⏳" : "▶ Run"}
          <br />
          <span className={s.runSub}>
            {perfRunning ? perfStep : `${perfSize} messages`}
          </span>
        </button>
        <div className={s.caption}>
          Measures both
          <br />
          methods at once
        </div>
      </CenterRail>

      <PerfPane
        color={R}
        header={
          <>
            Pretext — measures each word once via Canvas,
            <br />
            then does pure math. No page pausing.
          </>
        }
        result={perfResult}
        value={perfResult?.pretext.toFixed(2)}
        valueSuffix={
          perfResult && (
            <div className={s.badge} style={{ "--c": R } as CSSProperties}>
              {perfResult.ratio.toFixed(1)}× faster
            </div>
          )
        }
        barWidth={pretextBarWidth}
        statFooter={
          perfResult && (
            <>
              ✅ {perfResult.pretext.toFixed(2)}ms total · fits inside one 16ms screen
              refresh · zero page pauses
            </>
          )
        }
        bubbleFooter="← height from Canvas math, no DOM needed"
        messages={messages}
        softUser
      />
    </div>
  );
}
