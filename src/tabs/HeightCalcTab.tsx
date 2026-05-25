import { useCallback, useEffect, useRef, useState } from "react";
import { DoneNote } from "../components/DoneNote";
import { EmptyHint } from "../components/EmptyHint";
import { MsgBubble } from "../components/MsgBubble";
import { PaneShell } from "../components/PaneShell";
import {
  clearPretextCache,
  domMeasureHeight,
  pretextLayout,
  pretextPrepare,
} from "../pretext";
import { T } from "../theme";
import { FONT, type Message, type Phase } from "../types";

interface HeightCalcTabProps {
  messages: Message[];
  L: string;
  R: string;
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: `${color}15`,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: "3px 10px",
        fontFamily: T.fontMono,
        fontSize: 15,
        color,
      }}
    >
      {children}
    </div>
  );
}

export function HeightCalcTab({ messages, L, R }: HeightCalcTabProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [leftVisible, setLeftVisible] = useState<number[]>([]);
  const [leftMs, setLeftMs] = useState<number | null>(null);
  const [rightMs, setRightMs] = useState<number | null>(null);
  const [panelWidth, setPanelWidth] = useState(400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    let rafId: number;
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Ignore zero-width fires triggered when the tab is hidden via display:none.
        if (e.contentRect.width > 0) {
          setPanelWidth(e.contentRect.width / 2 - 1);
        }
      });
    });
    ro.observe(wrapperRef.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (phase === "running") return;
    setPhase("running");
    setLeftVisible([]);
    setLeftMs(null);
    setRightMs(null);

    const bw = panelWidth * 0.82 - 24;

    // Pretext's pitch: prepare ONCE upfront, then layout is pure math on
    // every reflow. Time only the layout phase to match what production code
    // actually pays per re-render. Matches runRealBenchmark in Speed Test tab.
    clearPretextCache();
    const prepared = messages.map((msg) => pretextPrepare(msg.text, FONT));
    // Warm-up pass: JIT-compile the layout call and prime CPU caches so the
    // measurement isn't dominated by first-call setup at small N.
    for (const p of prepared) pretextLayout(p, bw);
    const t2 = performance.now();
    for (const p of prepared) pretextLayout(p, bw);
    const rightTime = parseFloat((performance.now() - t2).toFixed(2));
    setRightMs(rightTime);

    const leftStart = performance.now();
    for (let i = 0; i < messages.length; i++) {
      domMeasureHeight(messages[i].text, bw, FONT);
    }
    const leftTime = parseFloat((performance.now() - leftStart).toFixed(2));

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLeftVisible((prev) => [...prev, i - 1]);
      if (i >= messages.length) {
        clearInterval(interval);
        setLeftMs(leftTime);
        setPhase("done");
      }
    }, 35);
  }, [phase, messages, panelWidth]);

  const reset = useCallback(() => {
    setPhase("idle");
    setLeftVisible([]);
    setLeftMs(null);
    setRightMs(null);
  }, []);

  // Header content for the left (DOM) pane.
  const leftHeader = (
    <>
      {phase === "idle" && "Ready — press Load to start"}
      {phase === "running" && (
        <span style={{ color: L }}>
          ⏳ Measuring message {leftVisible.length} of {messages.length}…
          <span style={{ color: T.textbb, marginLeft: 6 }}>
            each one pauses the page
          </span>
        </span>
      )}
      {phase === "done" && leftMs !== null && (
        <span>
          Took <strong style={{ color: L, fontSize: 13 }}>{leftMs}ms</strong> ·{" "}
          {messages.length} page pauses
        </span>
      )}
    </>
  );

  // Header content for the right (Pretext) pane.
  const rightHeader = (
    <>
      {phase === "idle" && "Ready — Pretext will load instantly"}
      {phase === "running" && rightMs !== null && (
        <span style={{ color: R }}>
          ✅ Done in <strong style={{ fontSize: 13 }}>{rightMs}ms</strong> — all{" "}
          {messages.length} heights at once
        </span>
      )}
      {phase === "running" && rightMs === null && (
        <span style={{ color: R }}>⚡ Calculating…</span>
      )}
      {phase === "done" && rightMs !== null && (
        <span>
          Took <strong style={{ color: R, fontSize: 13 }}>{rightMs}ms</strong> ·
          zero page pauses
        </span>
      )}
    </>
  );

  return (
    <div
      ref={wrapperRef}
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 130px 1fr",
        minHeight: 0,
      }}
    >
      {/* LEFT — DOM */}
      <PaneShell
        color={L}
        borderRight
        header={leftHeader}
        chip={
          phase !== "idle" && (
            <Chip color={L}>
              {leftVisible.length} / {messages.length}
            </Chip>
          )
        }
      >
        {phase === "idle" && (
          <EmptyHint>
            The old approach asks the browser to measure
            <br />
            each message one by one.
            <br />
            <br />
            <span style={{ color: T.textaa }}>
              Press "Load" to see it happen.
            </span>
          </EmptyHint>
        )}
        {leftVisible.map((idx) => (
          <MsgBubble
            key={idx}
            msg={messages[idx]}
            color={L}
            highlight={idx === leftVisible.length - 1}
          />
        ))}
        {phase === "done" && (
          <DoneNote color={L}>
            ✅ Done. The browser paused{" "}
            <strong style={{ color: L }}>{messages.length} times</strong> —
            once per message — before anything could be shown.
          </DoneNote>
        )}
      </PaneShell>

      {/* CENTER */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 10,
          background: T.surface,
          borderRight: `1px solid ${T.line}`,
        }}
      >
        <button
          onClick={phase === "done" ? reset : handleLoad}
          disabled={phase === "running"}
          style={{
            width: 110,
            padding: "10px 0",
            fontSize: 15,
            fontFamily: T.fontSans,
            fontWeight: 600,
            background: phase === "running" ? T.fill1 : T.fill8,
            border: `1px solid ${T.fill20}`,
            borderRadius: 8,
            color: phase === "running" ? T.text77 : T.text88,
            cursor: phase === "running" ? "not-allowed" : "pointer",
            textAlign: "center",
            lineHeight: 1.5,
            boxShadow: phase === "running" ? "none" : "0 0 12px rgba(255,255,255,0.05)",
            transition: "all 0.2s",
          }}
        >
          {phase === "running" ? "⏳" : phase === "done" ? "↺ Reset" : "▶ Load"}
          <br />
          <span style={{ fontSize: 15, opacity: 0.6 }}>
            {phase === "running"
              ? "loading…"
              : phase === "done"
                ? "try again"
                : `${messages.length} messages`}
          </span>
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 15,
            color: T.textcc,
            textAlign: "center",
            fontFamily: T.fontSans,
            lineHeight: 1.5,
            width: 90,
          }}
        >
          Same messages,
          <br />
          different method
        </div>
        {phase === "done" && leftMs !== null && rightMs !== null && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 8px",
              background: "rgba(0,255,157,0.06)",
              border: "1px solid rgba(0,255,157,0.2)",
              borderRadius: 8,
              textAlign: "center",
              animation: "slideUp 0.4s ease",
              width: 110,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: R,
                fontFamily: T.fontMono,
              }}
            >
              {(leftMs / Math.max(rightMs, 0.01)).toFixed(0)}×
            </div>
            <div
              style={{
                fontSize: 15,
                color: T.textcc,
                fontFamily: T.fontSans,
                marginTop: 2,
              }}
            >
              faster
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Pretext */}
      <PaneShell
        color={R}
        header={rightHeader}
        chip={
          phase !== "idle" && (
            <Chip color={R}>
              {messages.length} / {messages.length}
            </Chip>
          )
        }
      >
        {phase === "idle" && (
          <EmptyHint>
            Pretext measures all words once via Canvas,
            <br />
            then calculates every height with pure math.
            <br />
            <br />
            <span style={{ color: T.textaa }}>
              All messages appear at the same moment.
            </span>
          </EmptyHint>
        )}
        {phase !== "idle" &&
          messages.map((msg, idx) => (
            <MsgBubble key={idx} msg={msg} color={R} />
          ))}
        {phase === "done" && (
          <DoneNote color={R}>
            ✅ Done. Zero page pauses. Pretext calculated all{" "}
            {messages.length} heights before rendering anything.
          </DoneNote>
        )}
      </PaneShell>
    </div>
  );
}
