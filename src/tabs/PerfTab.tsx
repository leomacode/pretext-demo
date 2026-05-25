import { useCallback, useState } from "react";
import { runRealBenchmark } from "../benchmark";
import { CenterRail } from "../components/CenterRail";
import { PerfPane } from "../components/PerfPane";
import { generateMessages } from "../data";
import { T } from "../theme";
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
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 130px 1fr",
        minHeight: 0,
      }}
    >
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
          <div
            style={{
              fontSize: 15,
              color: T.textcc,
              fontFamily: T.fontSans,
            }}
          >
            to measure {perfResult?.msgCount} messages
          </div>
        }
        statFooter={
          <>
            ⏱ {perMsgMs.toFixed(2)}ms per message ·{" "}
            <span style={{ color: L }}>
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
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 8,
            width: 110,
            justifyContent: "center",
          }}
        >
          {SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setPerfSize(n)}
              disabled={perfRunning}
              style={{
                flex: 1,
                padding: "4px 0",
                fontSize: 12,
                fontFamily: T.fontMono,
                background: perfSize === n ? T.fill15 : T.fill4,
                border: `1px solid ${perfSize === n ? T.fill40 : T.fill10}`,
                borderRadius: 4,
                color: perfSize === n ? "#fff" : T.text88,
                cursor: perfRunning ? "not-allowed" : "pointer",
              }}
            >
              {n >= 1000 ? `${n / 1000}k` : n}
            </button>
          ))}
        </div>
        <button
          onClick={runPerf}
          disabled={perfRunning}
          style={{
            width: 110,
            padding: "10px 0",
            fontSize: 15,
            fontFamily: T.fontSans,
            fontWeight: 600,
            background: perfRunning ? T.fill4 : T.fill8,
            border: `1px solid ${T.fill20}`,
            borderRadius: 8,
            color: perfRunning ? T.textaa : T.text99,
            cursor: perfRunning ? "not-allowed" : "pointer",
            textAlign: "center",
            lineHeight: 1.5,
            transition: "all 0.2s",
          }}
        >
          {perfRunning ? "⏳" : "▶ Run"}
          <br />
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            {perfRunning ? perfStep : `${perfSize} messages`}
          </span>
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: T.text55,
            textAlign: "center",
            fontFamily: T.fontSans,
            lineHeight: 1.5,
            width: 90,
          }}
        >
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
            <div
              style={{
                padding: "2px 8px",
                background: `${R}20`,
                border: `1px solid ${R}40`,
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 700,
                color: R,
                fontFamily: T.fontSans,
              }}
            >
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
