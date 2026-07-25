import { useCallback, useState, type CSSProperties } from "react";
import { runRealBenchmark } from "../benchmark";
import { CenterRail } from "../components/CenterRail";
import { PerfPane } from "../components/PerfPane";
import { generateMessages } from "../data";
import grid from "./layout.module.css";
import s from "./PerfTab.module.css";
import type { BenchmarkResult, Message } from "../types";

interface PerfTabProps {
  messages: Message[];
  appWidth: number;
  L: string;
  R: string;
}

const SIZES = [100, 1000, 5000];

export function PerfTab({ messages, appWidth, L, R }: PerfTabProps) {
  const [perfResult, setPerfResult] = useState<BenchmarkResult | null>(null);
  const [perfRunning, setPerfRunning] = useState(false);
  const [perfStep, setPerfStep] = useState("");
  const [perfSize, setPerfSize] = useState(1000);

  const runPerf = useCallback(() => {
    setPerfRunning(true);
    setPerfResult(null);
    setPerfStep(`Rendering ${perfSize} messages into the page…`);
    setTimeout(() => {
      setPerfStep("Measuring with DOM (triggering reflows)…");
      setTimeout(() => {
        const benchMsgs = generateMessages(perfSize);
        const result = runRealBenchmark(benchMsgs, appWidth / 2);
        setPerfResult(result);
        setPerfRunning(false);
        setPerfStep("");
      }, 80);
    }, 60);
  }, [perfSize, appWidth]);

  const perMsgMs = perfResult
    ? parseFloat(perfResult.dom) / perfResult.msgCount
    : 0;

  const pretextBarWidth = perfResult
    ? `${Math.min(100, (parseFloat(perfResult.pretext) / parseFloat(perfResult.dom)) * 100)}%`
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
        value={perfResult?.dom}
        valueSuffix={
          <div className={s.suffixText}>
            to measure {perfResult?.msgCount} messages
          </div>
        }
        statFooter={
          <>
            ⏱ {perMsgMs.toFixed(2)}ms per message ·{" "}
            <span className={s.warn} style={{ "--c": L } as CSSProperties}>
              ⚠️ Just {Math.max(1, Math.floor(16 / perMsgMs))} messages = already
              slow enough to feel laggy
            </span>
          </>
        }
        bubbleFooter="← measured via DOM reflow"
        messages={messages}
        showFlash={perfRunning}
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
        value={perfResult?.pretext}
        valueSuffix={
          perfResult && (
            <div className={s.badge} style={{ "--c": R } as CSSProperties}>
              {perfResult.ratio}× faster
            </div>
          )
        }
        barWidth={pretextBarWidth}
        statFooter={
          perfResult && (
            <>
              ✅ {perfResult.pretext}ms total · fits inside one 16ms screen
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
