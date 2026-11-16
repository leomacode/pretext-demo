import type { CSSProperties, ReactNode, Ref } from "react";
import s from "./StreamPane.module.css";
import type { StreamState } from "../hooks/useStream";

interface StreamPaneProps {
  color: string;
  /** Top header bar text (left/right description). */
  header: ReactNode;
  /** Intro paragraph above the bubble. */
  intro: ReactNode;
  /** Stream state from the useStream hook. */
  stream: StreamState;
  /** Whether to reserve the predicted height on the bubble (only the Pretext side). */
  reserveHeight?: boolean;
  /** Optional caption inside the bubble header (e.g. "AI · space reserved …"). */
  bubbleCaption: ReactNode;
  /** Custom indicator block shown below the bubble (jump counter vs zero-jumps card). */
  indicator: ReactNode;
  /** Footer card shown when stream completes. */
  doneFooter: ReactNode;
  /** Placeholder shown before the stream starts. */
  emptyText: string;
  /** Always-rendered element as wide as the bubble — caller reads clientWidth. */
  boxRef?: Ref<HTMLDivElement>;
}

export function StreamPane({
  color,
  header,
  intro,
  stream,
  reserveHeight,
  bubbleCaption,
  indicator,
  doneFooter,
  emptyText,
  boxRef,
}: StreamPaneProps) {
  const visible = stream.text || stream.active;

  return (
    <div className={s.pane} style={{ "--c": color } as CSSProperties}>
      <div className={s.header}>
        <div className={s.headerText}>{header}</div>
      </div>
      <div className={s.body}>
        <div ref={boxRef} className={s.intro}>{intro}</div>
        {visible && (
          <div>
            <div className={s.bubble} data-reserve={!!reserveHeight}>
              <div className={s.caption} data-reserve={!!reserveHeight}>
                {bubbleCaption}
              </div>
              {/* Reserve on the text box itself: predictedH is pure text
                  height, so caption/padding/border don't need accounting. */}
              <div
                className={s.text}
                style={
                  reserveHeight && stream.predictedH
                    ? { minHeight: stream.predictedH }
                    : undefined
                }
              >
                {stream.text}
                {stream.active && <span className={s.cursor}>▌</span>}
              </div>
            </div>
            {indicator}
            {stream.done && doneFooter}
          </div>
        )}
        {!visible && <div className={s.empty}>{emptyText}</div>}
      </div>
    </div>
  );
}
