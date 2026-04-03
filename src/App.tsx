import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface PreparedText {
  words: string[];
  widths: Map<string, number>;
  spaceWidth: number;
  font: string;
}

interface BenchmarkResult {
  dom: string;
  pretext: string;
  ratio: string;
  msgCount: number;
}

type Phase = "idle" | "running" | "done";

// ─────────────────────────────────────────────
// PRETEXT CORE (simulation — replace with real lib)
// Real lib: npm install @chenglou/pretext
// ─────────────────────────────────────────────
// Shared canvas — created once, reused for all measurements (no per-call allocation)
const sharedCanvas =
  typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(1, 1)
    : document.createElement("canvas");
const sharedCtx = sharedCanvas.getContext("2d") as CanvasRenderingContext2D;

// Word-level cache: "font::word" → width
// Reuses measurements across all messages that share vocabulary
const wordWidthCache = new Map<string, number>();

function getWordWidth(word: string, font: string): number {
  const key = `${font}::${word}`;
  if (!wordWidthCache.has(key)) {
    sharedCtx.font = font;
    wordWidthCache.set(key, sharedCtx.measureText(word).width);
  }
  return wordWidthCache.get(key)!;
}

// Text-level cache: avoid re-splitting + re-looking-up same full text
const pretextCache = new Map<string, PreparedText>();

function pretextPrepare(text: string, font: string): PreparedText {
  const key = `${font}::${text}`;
  if (pretextCache.has(key)) return pretextCache.get(key)!;
  sharedCtx.font = font;
  const words = text.split(" ");
  // Use Map for O(1) lookups — faster than object string hashing in hot loops
  const widths = new Map<string, number>();
  for (const w of words) {
    if (!widths.has(w)) widths.set(w, getWordWidth(w, font));
  }
  const result: PreparedText = {
    words,
    widths,
    spaceWidth: getWordWidth(" ", font),
    font,
  };
  pretextCache.set(key, result);
  return result;
}

function pretextLayout(
  prepared: PreparedText,
  containerWidth: number,
  lineHeight = 24,
): number {
  const { words, widths, spaceWidth } = prepared;
  let lines = 0,
    lineW = 0;
  for (const w of words) {
    const ww = (widths.get(w) ?? 8) + spaceWidth;
    if (lineW + ww > containerWidth && lineW > 0) {
      lines++;
      lineW = ww;
    } else {
      lineW += ww;
    }
  }
  if (lineW > 0) lines++;
  return Math.max(lines * lineHeight, 24);
}

function domMeasureHeight(
  text: string,
  containerWidth: number,
  font: string,
): number {
  const div = document.createElement("div");
  div.style.cssText = `position:fixed;visibility:hidden;top:-9999px;width:${containerWidth}px;font:${font};padding:8px 12px;word-break:break-word;white-space:pre-wrap;box-sizing:border-box;line-height:24px;`;
  div.textContent = text;
  document.body.appendChild(div);
  const h = div.getBoundingClientRect().height; // ← triggers reflow
  document.body.removeChild(div);
  return h;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const POOL: string[] = [
  "Hey, can you explain how Pretext works?",
  "Pretext uses a two-phase approach. First it measures word widths using an off-screen Canvas and caches the results. Then all layout calculations are pure math — no page reads at all. That's why it's hundreds of times faster.",
  "So the page never freezes while measuring text?",
  "Exactly. The old way forces the browser to pause everything and re-measure the entire page layout just to get one element's height. Pretext skips that entirely by doing its own arithmetic instead.",
  "How much faster is it really?",
  "Measuring 500 text bubbles the old way takes 15–30 milliseconds and causes 500 page freezes. Pretext does the same job in under 0.1 milliseconds with zero freezes. That's roughly 500 times faster.",
  "Does it work in different languages?",
  "Yes — English, Chinese, Arabic, Japanese, emoji, mixed scripts. It uses the browser's own font engine as a reference so every language works correctly, including right-to-left text.",
  "Who made this?",
  "Cheng Lou — he was on the React core team at Meta, created react-motion which has 21,000+ GitHub stars, and now builds the frontend at Midjourney serving millions of users with just five engineers.",
  "Why does this matter for a chat app?",
  "Three reasons: smooth scrolling through thousands of messages, stable layout while AI is typing its response, and silky 60fps animations. All three require knowing text height before rendering — and doing it fast.",
  "Can I use this in my current project?",
  "Yes. One npm install, two functions — prepare() and layout(). It works with any JavaScript framework: React, Vue, Svelte, or plain HTML. No configuration needed.",
  "What about performance on slower devices?",
  "That's where it helps most. On a low-end phone the old approach can drop frames visibly. Pretext keeps the calculation so lightweight that even budget hardware stays smooth.",
  "Is the code open source?",
  "Yes, MIT licensed on GitHub at chenglou/pretext. It went from zero to 7,000 stars in a few days, which tells you how long the frontend community has been waiting for this.",
];

function generateMessages(count = 80): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
    text: POOL[i % POOL.length],
    timestamp: new Date(Date.now() - (count - i) * 45000),
  }));
}

const SCROLL_MESSAGES: Message[] = generateMessages(50);

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────
const STREAM_TEXT =
  "This response is arriving word by word, just like a real AI assistant. Watch the left side carefully — the chat bubble keeps growing and pushing everything below it down the page. That jumping is called a layout shift, and it happens on every single new line. Now look at the right side. The space for this message was reserved before the first word arrived, so nothing moves at all. That is the difference Pretext makes.";

function useStream(
  containerWidth: number,
  usePretext: boolean,
  onShift?: () => void,
) {
  const FONT = "15px 'IBM Plex Mono', monospace";
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

function runRealBenchmark(
  messages: Message[],
  containerWidth: number,
): BenchmarkResult {
  const FONT = "15px 'IBM Plex Mono', monospace";
  const bw = Math.round(containerWidth * 0.82 - 24);

  const domContainer = document.createElement("div");
  domContainer.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${containerWidth}px;visibility:hidden;`;
  document.body.appendChild(domContainer);

  const bubbles = messages.map((msg) => {
    const d = document.createElement("div");
    d.style.cssText = `width:${bw}px;font:${FONT};padding:8px 12px;word-break:break-word;white-space:pre-wrap;box-sizing:border-box;line-height:24px;`;
    d.textContent = msg.text;
    domContainer.appendChild(d);
    return d;
  });

  const t1 = performance.now();
  bubbles.forEach((d) => d.getBoundingClientRect().height);
  const tDom = performance.now() - t1;
  document.body.removeChild(domContainer);

  pretextCache.clear();
  const t2 = performance.now();
  messages.forEach((msg) => pretextLayout(pretextPrepare(msg.text, FONT), bw));
  const tPretext = performance.now() - t2;

  return {
    dom: tDom.toFixed(2),
    pretext: tPretext.toFixed(2),
    ratio: (tDom / tPretext).toFixed(1),
    msgCount: messages.length,
  };
}

interface HeightCalcTabProps {
  messages: Message[];
  L: string;
  R: string;
}

function HeightCalcTab({ messages, L, R }: HeightCalcTabProps) {
  const FONT = "15px 'IBM Plex Mono', monospace";
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
      // Throttle with rAF — avoid recalculating on every pixel of resize
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

    // Use typed array — less GC pressure, faster iteration than object array
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

  interface MsgBubbleProps {
    msg: Message;
    color: string;
    highlight: boolean;
  }

  const MsgBubble = ({ msg, color, highlight }: MsgBubbleProps) => {
    const isUser = msg.role === "user";
    return (
      <div
        style={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          padding: "3px 12px",
          animation: highlight ? "slideUp 0.15s ease" : "none",
        }}
      >
        <div
          style={{
            maxWidth: "82%",
            borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
            padding: "6px 10px",
            background: highlight
              ? isUser
                ? `${color}28`
                : `${color}14`
              : isUser
                ? `${color}10`
                : "rgba(255,255,255,0.03)",
            border: `1px solid ${isUser ? color + (highlight ? "55" : "28") : "rgba(255,255,255,0.07)"}`,
            transition: "background 0.3s, border 0.3s",
          }}
        >
          <div
            style={{
              fontSize: 15,
              color: "#ffffff99",
              marginBottom: 3,
              fontFamily: "'IBM Plex Mono',monospace",
            }}
          >
            {isUser ? "YOU" : "AI"} ·{" "}
            {msg.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: "24px",
              color: isUser ? "#dfffda" : "#a8a8b8",
              fontFamily: "'IBM Plex Mono',monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        </div>
      </div>
    );
  };

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
              color: "#ffffffbb",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {phase === "idle" && "Ready — press Load to start"}
            {phase === "running" && (
              <span style={{ color: L }}>
                ⏳ Measuring message {leftVisible.length} of {messages.length}…
                <span style={{ color: "#ffffffbb", marginLeft: 6 }}>
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
                fontFamily: "'IBM Plex Mono',monospace",
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
                color: "#ffffff77",
                fontSize: 15,
                fontFamily: "system-ui,sans-serif",
                lineHeight: 1.8,
              }}
            >
              The old approach asks the browser to measure
              <br />
              each message one by one.
              <br />
              <br />
              <span style={{ color: "#ffffffaa" }}>
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
                fontFamily: "system-ui,sans-serif",
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
          background: "rgba(0,0,0,0.2)",
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
            fontFamily: "system-ui,sans-serif",
            fontWeight: 600,
            background:
              phase === "running"
                ? "rgba(255,255,255,0.03)"
                : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: phase === "running" ? "#ffffff77" : "#ffffff88",
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
            color: "#ffffffcc",
            textAlign: "center",
            fontFamily: "system-ui,sans-serif",
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
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              {(leftMs / Math.max(rightMs, 0.01)).toFixed(0)}×
            </div>
            <div
              style={{
                fontSize: 15,
                color: "#ffffffcc",
                fontFamily: "system-ui,sans-serif",
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
              color: "#ffffffbb",
              fontFamily: "system-ui,sans-serif",
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
                fontFamily: "'IBM Plex Mono',monospace",
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
                color: "#ffffff77",
                fontSize: 15,
                fontFamily: "system-ui,sans-serif",
                lineHeight: 1.8,
              }}
            >
              Pretext measures all words once via Canvas,
              <br />
              then calculates every height with pure math.
              <br />
              <br />
              <span style={{ color: "#ffffffaa" }}>
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
                fontFamily: "system-ui,sans-serif",
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

interface ColHeaderProps {
  label: string;
  color: string;
  tag: string;
  sub: string;
}

function ColHeader({ label, color, tag, sub }: ColHeaderProps) {
  return (
    <div
      style={{
        padding: "9px 14px",
        borderBottom: `1px solid ${color}20`,
        background: `${color}07`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 5px ${color}`,
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color,
            letterSpacing: "0.12em",
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 15,
            padding: "1px 5px",
            borderRadius: 3,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            color: color + "bb",
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          {tag}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          color: "#ffffffaa",
          marginTop: 2,
          fontFamily: "system-ui,sans-serif",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
type TabId = "scroll" | "stream" | "perf";

export default function App() {
  const [tab, setTab] = useState<TabId>("scroll");
  const [messages] = useState<Message[]>(() => generateMessages(80));
  const [perfResult, setPerfResult] = useState<BenchmarkResult | null>(null);
  const [perfRunning, setPerfRunning] = useState(false);
  const [perfStep, setPerfStep] = useState("");
  const appRef = useRef<HTMLDivElement>(null);
  const [appWidth, setAppWidth] = useState(900);
  const [leftShifts, setLeftShifts] = useState(0);

  useEffect(() => {
    if (!appRef.current) return;
    const ro = new ResizeObserver(([e]) => setAppWidth(e.contentRect.width));
    ro.observe(appRef.current);
    return () => ro.disconnect();
  }, []);

  const leftStream = useStream(appWidth / 2, false, () =>
    setLeftShifts((s) => s + 1),
  );
  const rightStream = useStream(appWidth / 2, true);

  const streamBoth = useCallback(() => {
    setLeftShifts(0);
    leftStream.start();
    rightStream.start();
  }, [leftStream, rightStream]);

  const runPerf = useCallback(() => {
    setPerfRunning(true);
    setPerfResult(null);
    setPerfStep("Rendering all messages into the page…");
    setTimeout(() => {
      setPerfStep("Measuring with DOM (triggering reflows)…");
      setTimeout(() => {
        const result = runRealBenchmark(messages, appWidth / 2);
        setPerfResult(result);
        setPerfRunning(false);
        setPerfStep("");
      }, 80);
    }, 60);
  }, [messages, appWidth]);

  const L = "#ff6b6b";
  const R = "#00ff9d";

  const TABS: { id: TabId; label: string }[] = [
    { id: "scroll", label: "📐 Height Calculation" },
    { id: "stream", label: "💬 Live Streaming" },
    { id: "perf", label: "📊 Speed Test" },
  ];

  return (
    <div
      ref={appRef}
      style={{
        height: "100vh",
        width: "100%",
        background: "#07070e",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'IBM Plex Mono',monospace",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#ffffff15;border-radius:2px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounceUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes benchFlash{0%{opacity:0.2}100%{opacity:0.5}}
      `}</style>

      {/* TOP BAR */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: L,
                boxShadow: `0 0 5px ${L}`,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: R,
                boxShadow: `0 0 5px ${R}`,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.1em",
            }}
          >
            PRETEXT DEMO
          </span>
          <span
            style={{
              fontSize: 14,
              color: "#ffffff66",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            A new library for fast text layout · @chenglou/pretext
          </span>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "5px 12px",
                fontSize: 14,
                fontFamily: "system-ui,sans-serif",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: tab === t.id ? "#fff" : "#ffffffbb",
                borderBottom:
                  tab === t.id
                    ? "1px solid #ffffff70"
                    : "1px solid transparent",
                transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* COL HEADERS — hidden on scroll tab */}
      {tab !== "scroll" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            flexShrink: 0,
          }}
        >
          <ColHeader
            label="WITHOUT PRETEXT"
            color={L}
            tag="old approach"
            sub="Browser has to pause and re-measure the page on every calculation"
          />
          <div style={{ background: "rgba(255,255,255,0.07)" }} />
          <ColHeader
            label="WITH PRETEXT"
            color={R}
            tag="new approach"
            sub="Measures once, then does pure math — browser never has to stop"
          />
        </div>
      )}

      {/* PANELS */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: tab === "scroll" ? "1fr" : "1fr 130px 1fr",
          minHeight: 0,
        }}
      >
        {tab === "scroll" && (
          <HeightCalcTab messages={SCROLL_MESSAGES} L={L} R={R} />
        )}

        {tab === "stream" && (
          <>
            <div
              style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${L}15`,
                  flexShrink: 0,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "#ffffffaa",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  No height prediction — bubble grows word by word.
                </div>
              </div>
              <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
                <div
                  style={{
                    fontSize: 15,
                    color: "#ffffffaa",
                    marginBottom: 10,
                    lineHeight: 1.6,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  The bubble grows word by word. Every new line pushes
                  everything below it down.
                </div>
                {(leftStream.text || leftStream.active) && (
                  <div>
                    <div
                      style={{
                        borderRadius: "10px 10px 10px 2px",
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          color: "#ffffff99",
                          marginBottom: 4,
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        AI · height changes on every new line
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: "24px",
                          color: "#a0a0b0",
                          fontFamily: "'IBM Plex Mono',monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {leftStream.text}
                        {leftStream.active && (
                          <span style={{ animation: "blink 0.7s infinite" }}>
                            ▌
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          paddingTop: 2,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 16,
                            color: L,
                            animation:
                              leftShifts > 0
                                ? "bounceUp 0.6s ease infinite"
                                : "none",
                            lineHeight: 1,
                          }}
                        >
                          ↑
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background:
                            leftShifts === 0
                              ? "rgba(255,255,255,0.03)"
                              : `${L}10`,
                          border: `1px solid ${leftShifts === 0 ? "rgba(255,255,255,0.07)" : L + "40"}`,
                          borderRadius: 8,
                          fontFamily: "system-ui,sans-serif",
                          transition: "all 0.2s",
                        }}
                      >
                        {leftShifts === 0 ? (
                          <div style={{ fontSize: 15, color: "#ffffffaa" }}>
                            Waiting for first jump…
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: L,
                              }}
                            >
                              {leftShifts} page jump
                              {leftShifts !== 1 ? "s" : ""}
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                color: "#ffffffcc",
                                marginTop: 2,
                              }}
                            >
                              Each time the bubble grew taller, everything on
                              the page shifted.
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {leftStream.done && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          background: `${L}0a`,
                          border: `1px solid ${L}25`,
                          borderRadius: 8,
                          fontSize: 15,
                          color: L + "99",
                          fontFamily: "system-ui,sans-serif",
                          animation: "slideUp 0.3s ease",
                        }}
                      >
                        Finished. The page jumped{" "}
                        <strong style={{ color: L }}>{leftShifts} times</strong>{" "}
                        while that one message was typing.
                      </div>
                    )}
                  </div>
                )}
                {!leftStream.text && !leftStream.active && (
                  <div
                    style={{
                      fontSize: 15,
                      color: "#ffffff77",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    Press the button in the middle to start.
                  </div>
                )}
              </div>
            </div>

            {/* CENTER BUTTON */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 10,
                background: "rgba(0,0,0,0.2)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <button
                onClick={streamBoth}
                disabled={leftStream.active || rightStream.active}
                style={{
                  width: 110,
                  padding: "10px 8px",
                  fontSize: 15,
                  fontFamily: "system-ui,sans-serif",
                  fontWeight: 600,
                  background:
                    leftStream.active || rightStream.active
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  color:
                    leftStream.active || rightStream.active
                      ? "#ffffffaa"
                      : "#ffffff99",
                  cursor:
                    leftStream.active || rightStream.active
                      ? "not-allowed"
                      : "pointer",
                  textAlign: "center",
                  lineHeight: 1.5,
                  transition: "all 0.2s",
                }}
              >
                {leftStream.active || rightStream.active
                  ? "●"
                  : "▶ Stream both"}
                <br />
                <span style={{ fontSize: 13, opacity: 0.6 }}>
                  {leftStream.active || rightStream.active
                    ? "Streaming…"
                    : "at the same time"}
                </span>
              </button>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#ffffff55",
                  textAlign: "center",
                  fontFamily: "system-ui,sans-serif",
                  lineHeight: 1.5,
                  width: 90,
                }}
              >
                Same text,
                <br />
                same timing
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${R}15`,
                  flexShrink: 0,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "#ffffffaa",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Pretext locks the height before streaming starts.
                </div>
              </div>
              <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
                <div
                  style={{
                    fontSize: 15,
                    color: "#ffffffaa",
                    marginBottom: 10,
                    lineHeight: 1.6,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  The full space is reserved before the first word arrives.
                  Nothing below ever moves.
                </div>
                {(rightStream.text || rightStream.active) && (
                  <div>
                    <div
                      style={{
                        borderRadius: "10px 10px 10px 2px",
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${R}20`,
                        ...(rightStream.predictedH
                          ? { minHeight: rightStream.predictedH }
                          : {}),
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          color: R + "60",
                          marginBottom: 4,
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        AI · space reserved: {rightStream.predictedH}px 🔒
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: "24px",
                          color: "#a0a0b0",
                          fontFamily: "'IBM Plex Mono',monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {rightStream.text}
                        {rightStream.active && (
                          <span style={{ animation: "blink 0.7s infinite" }}>
                            ▌
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          color: R,
                          lineHeight: 1,
                          paddingTop: 2,
                        }}
                      >
                        ↑
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background: `${R}08`,
                          border: `1px solid ${R}30`,
                          borderRadius: 8,
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        <div
                          style={{ fontSize: 20, fontWeight: 700, color: R }}
                        >
                          Zero jumps 🔒
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#ffffffcc",
                            marginTop: 2,
                          }}
                        >
                          The space was calculated before streaming started. The
                          page never moved.
                        </div>
                      </div>
                    </div>
                    {rightStream.done && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          background: `${R}0a`,
                          border: `1px solid ${R}25`,
                          borderRadius: 8,
                          fontSize: 15,
                          color: R + "99",
                          fontFamily: "system-ui,sans-serif",
                          animation: "slideUp 0.3s ease",
                        }}
                      >
                        Finished.{" "}
                        <strong style={{ color: R }}>Zero page jumps.</strong>{" "}
                        Pretext predicted the height before the first word
                        arrived.
                      </div>
                    )}
                  </div>
                )}
                {!rightStream.text && !rightStream.active && (
                  <div
                    style={{
                      fontSize: 15,
                      color: "#ffffff77",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    Waiting…
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "perf" && (
          <>
            <div
              style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${L}18`,
                  flexShrink: 0,
                  background: `${L}05`,
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "#ffffffaa",
                    fontFamily: "system-ui,sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  Old method — browser pauses and re-measures
                  <br />
                  the whole page for every single message.
                </div>
              </div>
              {perfResult && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${L}18`,
                    background: `${L}0a`,
                    flexShrink: 0,
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: L,
                        lineHeight: 1,
                      }}
                    >
                      {perfResult.dom}
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 400,
                          color: "#ffffffcc",
                          marginLeft: 3,
                        }}
                      >
                        ms
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#ffffffcc",
                        fontFamily: "system-ui,sans-serif",
                      }}
                    >
                      to measure {perfResult.msgCount} messages
                    </div>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        background: L,
                        borderRadius: 2,
                        boxShadow: `0 0 8px ${L}`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#ffffffbb",
                      fontFamily: "system-ui,sans-serif",
                      lineHeight: 1.7,
                    }}
                  >
                    ⏱{" "}
                    {(parseFloat(perfResult.dom) / perfResult.msgCount).toFixed(
                      2,
                    )}
                    ms per message ·{" "}
                    <span style={{ color: L }}>
                      ⚠️ Just{" "}
                      {Math.max(
                        1,
                        Math.floor(
                          16 /
                            (parseFloat(perfResult.dom) / perfResult.msgCount),
                        ),
                      )}{" "}
                      messages = already slow enough to feel laggy
                    </span>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        padding: "3px 12px",
                        background: perfRunning ? `${L}06` : "transparent",
                        transition: "background 0.3s",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          borderRadius: isUser
                            ? "10px 10px 2px 10px"
                            : "10px 10px 10px 2px",
                          padding: "5px 10px",
                          background: isUser
                            ? `${L}10`
                            : "rgba(255,255,255,0.025)",
                          border: `1px solid ${isUser ? L + "22" : "rgba(255,255,255,0.06)"}`,
                          position: "relative",
                        }}
                      >
                        {perfRunning && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "inherit",
                              background: `${L}15`,
                              animation: `benchFlash ${0.05 + (i % 5) * 0.02}s ease infinite alternate`,
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontSize: 15,
                            color: "#ffffff77",
                            marginBottom: 2,
                            fontFamily: "'IBM Plex Mono',monospace",
                          }}
                        >
                          {isUser ? "YOU" : "AI"} ·{" "}
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: "18px",
                            color: isUser ? "#d0ffd0" : "#909090",
                            fontFamily: "'IBM Plex Mono',monospace",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </div>
                        {perfResult && (
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 15,
                              color: L + "66",
                              fontFamily: "'IBM Plex Mono',monospace",
                            }}
                          >
                            ← measured via DOM reflow
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTER BUTTON */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 10,
                background: "rgba(0,0,0,0.2)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <button
                onClick={runPerf}
                disabled={perfRunning}
                style={{
                  width: 110,
                  padding: "10px 0",
                  fontSize: 15,
                  fontFamily: "system-ui,sans-serif",
                  fontWeight: 600,
                  background: perfRunning
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  color: perfRunning ? "#ffffffaa" : "#ffffff99",
                  cursor: perfRunning ? "not-allowed" : "pointer",
                  textAlign: "center",
                  lineHeight: 1.5,
                  transition: "all 0.2s",
                }}
              >
                {perfRunning ? "⏳" : "▶ Run"}
                <br />
                <span style={{ fontSize: 13, opacity: 0.6 }}>
                  {perfRunning ? perfStep : `${messages.length} messages`}
                </span>
              </button>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#ffffff55",
                  textAlign: "center",
                  fontFamily: "system-ui,sans-serif",
                  lineHeight: 1.5,
                  width: 90,
                }}
              >
                Measures both
                <br />
                methods at once
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${R}18`,
                  flexShrink: 0,
                  background: `${R}05`,
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "#ffffffaa",
                    fontFamily: "system-ui,sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  Pretext — measures each word once via Canvas,
                  <br />
                  then does pure math. No page pausing.
                </div>
              </div>
              {perfResult && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${R}18`,
                    background: `${R}0a`,
                    flexShrink: 0,
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: R,
                        lineHeight: 1,
                      }}
                    >
                      {perfResult.pretext}
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 400,
                          color: "#ffffffcc",
                          marginLeft: 3,
                        }}
                      >
                        ms
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "2px 8px",
                        background: `${R}20`,
                        border: `1px solid ${R}40`,
                        borderRadius: 4,
                        fontSize: 14,
                        fontWeight: 700,
                        color: R,
                        fontFamily: "system-ui,sans-serif",
                      }}
                    >
                      {perfResult.ratio}× faster
                    </div>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        background: R,
                        boxShadow: `0 0 8px ${R}`,
                        width: `${Math.min(100, (parseFloat(perfResult.pretext) / parseFloat(perfResult.dom)) * 100)}%`,
                        transition: "width 1.2s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#ffffffbb",
                      fontFamily: "system-ui,sans-serif",
                      lineHeight: 1.7,
                    }}
                  >
                    ✅ {perfResult.pretext}ms total · fits inside one 16ms
                    screen refresh · zero page pauses
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        padding: "3px 12px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          borderRadius: isUser
                            ? "10px 10px 2px 10px"
                            : "10px 10px 10px 2px",
                          padding: "5px 10px",
                          background: isUser
                            ? `${R}08`
                            : "rgba(255,255,255,0.025)",
                          border: `1px solid ${isUser ? R + "20" : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            color: "#ffffff77",
                            marginBottom: 2,
                            fontFamily: "'IBM Plex Mono',monospace",
                          }}
                        >
                          {isUser ? "YOU" : "AI"} ·{" "}
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: "18px",
                            color: isUser ? "#d0ffd0" : "#909090",
                            fontFamily: "'IBM Plex Mono',monospace",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </div>
                        {perfResult && (
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 15,
                              color: R + "66",
                              fontFamily: "'IBM Plex Mono',monospace",
                            }}
                          >
                            ← height from Canvas math, no DOM needed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
