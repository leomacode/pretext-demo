import { useCallback, useRef, useState, type CSSProperties } from "react";
import { CenterRail } from "../components/CenterRail";
import { StreamPane } from "../components/StreamPane";
import { useStream } from "../hooks/useStream";
import { L, R } from "../theme";
import grid from "./layout.module.css";
import s from "./StreamTab.module.css";

export function StreamTab() {
  const [leftShifts, setLeftShifts] = useState(0);

  const leftStream = useStream(false, () => setLeftShifts((n) => n + 1));
  const rightStream = useStream(true);
  // Read pane widths at click time — no resize subscription needed.
  const leftBox = useRef<HTMLDivElement>(null);
  const rightBox = useRef<HTMLDivElement>(null);

  const streamBoth = useCallback(() => {
    setLeftShifts(0);
    leftStream.start(leftBox.current?.clientWidth ?? 0);
    rightStream.start(rightBox.current?.clientWidth ?? 0);
  }, [leftStream, rightStream]);

  const running = leftStream.active || rightStream.active;

  // Left-side indicator: animated arrow + page-jump counter card.
  const leftIndicator = (
    <div className={s.indicator} style={{ "--c": L } as CSSProperties}>
      <div className={s.arrow} data-bounce={leftShifts > 0} />
      <div className={s.card} data-state={leftShifts === 0 ? "waiting" : "jumped"}>
        {leftShifts === 0 ? (
          <div className={s.waitText}>Waiting for first jump…</div>
        ) : (
          <>
            <div className={s.bigNum}>
              {leftShifts} page jump{leftShifts !== 1 ? "s" : ""}
            </div>
            <div className={s.subText}>
              Each time the bubble grew taller, everything on the page shifted.
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Right-side indicator: static "Zero jumps" card.
  const rightIndicator = (
    <div className={s.indicator} style={{ "--c": R } as CSSProperties}>
      <div className={s.arrow} />
      <div className={s.card} data-state="zero">
        <div className={s.bigNum}>Zero jumps 🔒</div>
        <div className={s.subText}>
          The space was calculated before streaming started. The page never
          moved.
        </div>
      </div>
    </div>
  );

  return (
    <div className={grid.grid}>
      <StreamPane
        color={L}
        header="No height prediction — bubble grows word by word."
        intro="The bubble grows word by word. Every new line pushes everything below it down."
        stream={leftStream}
        boxRef={leftBox}
        bubbleCaption="AI · height changes on every new line"
        indicator={leftIndicator}
        doneFooter={
          <div className={s.doneFooter} style={{ "--c": L } as CSSProperties}>
            Finished. The page jumped{" "}
            <strong className={s.strong}>{leftShifts} times</strong> while that
            one message was typing.
          </div>
        }
        emptyText="Press the button in the middle to start."
      />

      <CenterRail>
        <button
          type="button"
          onClick={streamBoth}
          disabled={running}
          className={s.btn}
        >
          {running ? "●" : "▶ Stream both"}
          <br />
          <span className={s.btnSub}>
            {running ? "Streaming…" : "at the same time"}
          </span>
        </button>
        <div className={s.caption}>
          Same text,
          <br />
          same timing
        </div>
      </CenterRail>

      <StreamPane
        color={R}
        header="Pretext locks the height before streaming starts."
        intro="The full space is reserved before the first word arrives. Nothing below ever moves."
        stream={rightStream}
        boxRef={rightBox}
        reserveHeight
        bubbleCaption={<>AI · space reserved: {rightStream.predictedH}px 🔒</>}
        indicator={rightIndicator}
        doneFooter={
          <div className={s.doneFooter} style={{ "--c": R } as CSSProperties}>
            Finished. <strong className={s.strong}>Zero page jumps.</strong>{" "}
            Pretext predicted the height before the first word arrived.
          </div>
        }
        emptyText="Waiting…"
      />
    </div>
  );
}
