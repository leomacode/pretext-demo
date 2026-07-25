import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import grid from "./layout.module.css";
import s from "./HeightCalcTab.module.css";
import { FONT, type Message, type Phase } from "../types";

interface HeightCalcTabProps {
  messages: Message[];
  L: string;
  R: string;
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className={s.chip} style={{ "--c": color } as CSSProperties}>
      {children}
    </div>
  );
}

export function HeightCalcTab({ messages, L, R }: HeightCalcTabProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  // Reveal progress on the left pane — bubbles always appear in order, so a
  // count is enough (no need to track an index array).
  const [leftCount, setLeftCount] = useState(0);
  const [leftMs, setLeftMs] = useState<number | null>(null);
  const [rightMs, setRightMs] = useState<number | null>(null);
  // Only read inside handleLoad, never rendered — a ref keeps the observer
  // from re-rendering the whole pane on every resize frame.
  const panelWidthRef = useRef(400);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      // Ignore zero-width fires triggered when the tab is hidden via display:none.
      if (e.contentRect.width > 0) {
        panelWidthRef.current = e.contentRect.width / 2 - 1;
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    if (phase === "running") return;
    setPhase("running");
    setLeftCount(0);
    setLeftMs(null);
    setRightMs(null);

    const bw = panelWidthRef.current * 0.82 - 24;

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
    if (revealTimer.current) clearInterval(revealTimer.current);
    revealTimer.current = setInterval(() => {
      i++;
      setLeftCount(i);
      if (i >= messages.length) {
        if (revealTimer.current) clearInterval(revealTimer.current);
        setLeftMs(leftTime);
        setPhase("done");
      }
    }, 35);
  }, [phase, messages]);

  const reset = useCallback(() => {
    if (revealTimer.current) clearInterval(revealTimer.current);
    setPhase("idle");
    setLeftCount(0);
    setLeftMs(null);
    setRightMs(null);
  }, []);

  // Clear the reveal interval on unmount so it can't fire setState after the
  // component is gone (or leak if the tab tree is ever torn down mid-run).
  useEffect(
    () => () => {
      if (revealTimer.current) clearInterval(revealTimer.current);
    },
    [],
  );

  // Header content for the left (DOM) pane.
  const leftHeader = (
    <>
      {phase === "idle" && "Ready — press Load to start"}
      {phase === "running" && (
        <span className={s.cL}>
          ⏳ Measuring message {leftCount} of {messages.length}…
          <span className={s.dim}>each one pauses the page</span>
        </span>
      )}
      {phase === "done" && leftMs !== null && (
        <span>
          Took <strong className={`${s.cL} ${s.ms}`}>{leftMs}ms</strong> ·{" "}
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
        <span className={s.cR}>
          ✅ Done in <strong className={s.ms}>{rightMs}ms</strong> — all{" "}
          {messages.length} heights at once
        </span>
      )}
      {phase === "running" && rightMs === null && (
        <span className={s.cR}>⚡ Calculating…</span>
      )}
      {phase === "done" && rightMs !== null && (
        <span>
          Took <strong className={`${s.cR} ${s.ms}`}>{rightMs}ms</strong> · zero
          page pauses
        </span>
      )}
    </>
  );

  return (
    <div ref={wrapperRef} className={grid.grid}>
      {/* LEFT — DOM */}
      <PaneShell
        color={L}
        borderRight
        header={leftHeader}
        chip={
          phase !== "idle" && (
            <Chip color={L}>
              {leftCount} / {messages.length}
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
            <span style={{ color: "var(--text-aa)" }}>
              Press "Load" to see it happen.
            </span>
          </EmptyHint>
        )}
        {messages.slice(0, leftCount).map((msg, idx) => (
          <MsgBubble
            key={msg.id}
            msg={msg}
            color={L}
            highlight={idx === leftCount - 1}
          />
        ))}
        {phase === "done" && (
          <DoneNote color={L}>
            ✅ Done. The browser paused{" "}
            <strong style={{ color: L }}>{messages.length} times</strong> — once
            per message — before anything could be shown.
          </DoneNote>
        )}
      </PaneShell>

      {/* CENTER */}
      <div className={s.center}>
        <button
          type="button"
          onClick={phase === "done" ? reset : handleLoad}
          disabled={phase === "running"}
          className={s.btn}
        >
          {phase === "running" ? "⏳" : phase === "done" ? "↺ Reset" : "▶ Load"}
          <br />
          <span className={s.btnSub}>
            {phase === "running"
              ? "loading…"
              : phase === "done"
                ? "try again"
                : `${messages.length} messages`}
          </span>
        </button>
        <div className={s.method}>
          Same messages,
          <br />
          different method
        </div>
        {phase === "done" && leftMs !== null && rightMs !== null && (
          <div className={s.speedup} style={{ "--c": R } as CSSProperties}>
            <div className={s.speedupNum}>
              {(leftMs / Math.max(rightMs, 0.01)).toFixed(0)}×
            </div>
            <div className={s.speedupLabel}>faster</div>
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
            <span style={{ color: "var(--text-aa)" }}>
              All messages appear at the same moment.
            </span>
          </EmptyHint>
        )}
        {phase !== "idle" &&
          messages.map((msg) => (
            <MsgBubble key={msg.id} msg={msg} color={R} />
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
