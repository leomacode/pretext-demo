import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { runRealBenchmark } from "../benchmark";
import { DoneNote } from "../components/DoneNote";
import { EmptyHint } from "../components/EmptyHint";
import { MsgBubble } from "../components/MsgBubble";
import { PaneShell } from "../components/PaneShell";
import { L, R } from "../theme";
import grid from "./layout.module.css";
import s from "./HeightCalcTab.module.css";
import {
  bubbleTextWidth,
  type BenchmarkResult,
  type Message,
  type Phase,
} from "../types";

interface HeightCalcTabProps {
  messages: Message[];
}

function Chip({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className={s.chip} style={{ "--c": color } as CSSProperties}>
      {children}
    </div>
  );
}

export function HeightCalcTab({ messages }: HeightCalcTabProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  // Reveal progress on the left pane — bubbles always appear in order, so a
  // count is enough (no need to track an index array).
  const [leftCount, setLeftCount] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  // Width is read once per Load from the left pane's list, so no resize
  // subscription (and no re-render on resize).
  const listRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLoad = useCallback(() => {
    if (phase === "running") return;
    // Same measurement as the Speed Test tab — one shared implementation.
    const width = bubbleTextWidth(listRef.current?.clientWidth ?? 0);
    setResult(runRealBenchmark(messages, width));
    setPhase("running");
    setLeftCount(0);

    let i = 0;
    if (revealTimer.current) clearInterval(revealTimer.current);
    revealTimer.current = setInterval(() => {
      i++;
      setLeftCount(i);
      if (i >= messages.length) {
        if (revealTimer.current) clearInterval(revealTimer.current);
        setPhase("done");
      }
    }, 35);
  }, [phase, messages]);

  const reset = useCallback(() => {
    if (revealTimer.current) clearInterval(revealTimer.current);
    setPhase("idle");
    setLeftCount(0);
    setResult(null);
  }, []);

  // Clear the reveal interval on unmount so it can't fire setState after the
  // component is gone (or leak if the tab tree is ever torn down mid-run).
  useEffect(
    () => () => {
      if (revealTimer.current) clearInterval(revealTimer.current);
    },
    [],
  );

  const leftMs = result?.dom.toFixed(2);
  const rightMs = result?.pretext.toFixed(2);

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
      {phase === "done" && result && (
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
      {phase === "running" && result && (
        <span className={s.cR}>
          ✅ Done in <strong className={s.ms}>{rightMs}ms</strong> — all{" "}
          {messages.length} heights at once
        </span>
      )}
      {phase === "done" && result && (
        <span>
          Took <strong className={`${s.cR} ${s.ms}`}>{rightMs}ms</strong> · zero
          page pauses
        </span>
      )}
    </>
  );

  return (
    <div className={grid.grid}>
      {/* LEFT — DOM */}
      <PaneShell
        color={L}
        borderRight
        bodyRef={listRef}
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
        {phase === "done" && result && (
          <div className={s.speedup} style={{ "--c": R } as CSSProperties}>
            <div className={s.speedupNum}>
              {result.ratio.toFixed(0)}×
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
