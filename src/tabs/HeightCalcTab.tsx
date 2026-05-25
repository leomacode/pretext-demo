import { useCallback, useEffect, useRef, useState } from "react";
import { pretextLayout, pretextPrepare, domMeasureHeight } from "../pretext";
import { MsgBubble } from "../components/MsgBubble";
import { T } from "../theme";
import { FONT, type Message, type Phase } from "../types";

interface HeightCalcTabProps {
  messages: Message[];
  L: string;
  R: string;
}

export function HeightCalcTab({ messages, L, R }: HeightCalcTabProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [leftVisible, setLeftVisible] = useState<number[]>([]);
  const [leftMs, setLeftMs] = useState<number | null>(null);
  const [rightMs, setRightMs] = useState<number | null>(null);
  const [panelWidth, setPanelWidth] = useState(400);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    let rafId: number;
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPanelWidth(e.contentRect.width / 2 - 1);
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

    const rightHeights = new Float32Array(messages.length);
    const t2 = performance.now();
    for (let i = 0; i < messages.length; i++) {
      rightHeights[i] = pretextLayout(
        pretextPrepare(messages[i].text, FONT),
        bw,
      );
    }
    const rightTime = parseFloat((performance.now() - t2).toFixed(2));
    setRightMs(rightTime);

    const leftHeights = new Float32Array(messages.length);
    const leftStart = performance.now();
    for (let i = 0; i < messages.length; i++) {
      leftHeights[i] = domMeasureHeight(messages[i].text, bw, FONT);
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

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 130px 1fr",
        minHeight: 0,
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            borderBottom: `1px solid ${L}18`,
            background: `${L}05`,
            flexShrink: 0,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textbb,
              fontFamily: T.fontSans,
            }}
          >
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
                Took{" "}
                <strong style={{ color: L, fontSize: 13 }}>{leftMs}ms</strong> ·{" "}
                {messages.length} page pauses
              </span>
            )}
          </div>
          {phase !== "idle" && (
            <div
              style={{
                background: `${L}15`,
                border: `1px solid ${L}33`,
                borderRadius: 6,
                padding: "3px 10px",
                fontFamily: T.fontMono,
                fontSize: 15,
                color: L,
              }}
            >
              {leftVisible.length} / {messages.length}
            </div>
          )}
        </div>
        <div
          ref={leftRef}
          style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}
        >
          {phase === "idle" && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: T.text77,
                fontSize: 15,
                fontFamily: T.fontSans,
                lineHeight: 1.8,
              }}
            >
              The old approach asks the browser to measure
              <br />
              each message one by one.
              <br />
              <br />
              <span style={{ color: T.textaa }}>
                Press "Load" to see it happen.
              </span>
            </div>
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
            <div
              style={{
                margin: "10px 12px",
                padding: "10px 14px",
                background: `${L}0a`,
                border: `1px solid ${L}25`,
                borderRadius: 8,
                fontFamily: T.fontSans,
                fontSize: 15,
                color: L + "99",
                animation: "slideUp 0.3s ease",
              }}
            >
              ✅ Done. The browser paused{" "}
              <strong style={{ color: L }}>{messages.length} times</strong> —
              once per message — before anything could be shown.
            </div>
          )}
        </div>
      </div>

      {/* CENTER */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 10,
          background: T.surface,
          borderRight: "1px solid rgba(255,255,255,0.07)",
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
            background:
              phase === "running"
                ? T.fill1
                : T.fill8,
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: phase === "running" ? T.text77 : T.text88,
            cursor: phase === "running" ? "not-allowed" : "pointer",
            textAlign: "center",
            lineHeight: 1.5,
            boxShadow:
              phase === "running" ? "none" : "0 0 12px rgba(255,255,255,0.05)",
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
                color: "#00ff9d",
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

      {/* RIGHT */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            padding: "8px 14px",
            borderBottom: `1px solid ${R}18`,
            background: `${R}05`,
            flexShrink: 0,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textbb,
              fontFamily: T.fontSans,
            }}
          >
            {phase === "idle" && "Ready — Pretext will load instantly"}
            {phase === "running" && rightMs !== null && (
              <span style={{ color: R }}>
                ✅ Done in <strong style={{ fontSize: 13 }}>{rightMs}ms</strong>{" "}
                — all {messages.length} heights at once
              </span>
            )}
            {phase === "running" && rightMs === null && (
              <span style={{ color: R }}>⚡ Calculating…</span>
            )}
            {phase === "done" && rightMs !== null && (
              <span>
                Took{" "}
                <strong style={{ color: R, fontSize: 13 }}>{rightMs}ms</strong>{" "}
                · zero page pauses
              </span>
            )}
          </div>
          {phase !== "idle" && (
            <div
              style={{
                background: `${R}15`,
                border: `1px solid ${R}33`,
                borderRadius: 6,
                padding: "3px 10px",
                fontFamily: T.fontMono,
                fontSize: 15,
                color: R,
              }}
            >
              {messages.length} / {messages.length}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}>
          {phase === "idle" && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: T.text77,
                fontSize: 15,
                fontFamily: T.fontSans,
                lineHeight: 1.8,
              }}
            >
              Pretext measures all words once via Canvas,
              <br />
              then calculates every height with pure math.
              <br />
              <br />
              <span style={{ color: T.textaa }}>
                All messages appear at the same moment.
              </span>
            </div>
          )}
          {phase !== "idle" &&
            messages.map((msg, idx) => (
              <MsgBubble key={idx} msg={msg} color={R} highlight={false} />
            ))}
          {phase === "done" && (
            <div
              style={{
                margin: "10px 12px",
                padding: "10px 14px",
                background: `${R}0a`,
                border: `1px solid ${R}25`,
                borderRadius: 8,
                fontFamily: T.fontSans,
                fontSize: 15,
                color: R + "99",
                animation: "slideUp 0.3s ease",
              }}
            >
              ✅ Done. Zero page pauses. Pretext calculated all{" "}
              {messages.length} heights before rendering anything.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
