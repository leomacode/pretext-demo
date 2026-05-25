import type { ReactNode } from "react";
import type { StreamState } from "../hooks/useStream";
import { T } from "../theme";

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
}: StreamPaneProps) {
  const visible = stream.text || stream.active;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${color}15`,
          flexShrink: 0,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: T.textaa,
            fontFamily: T.fontSans,
          }}
        >
          {header}
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
        <div
          style={{
            fontSize: 15,
            color: T.textaa,
            marginBottom: 10,
            lineHeight: 1.6,
            fontFamily: T.fontSans,
          }}
        >
          {intro}
        </div>
        {visible && (
          <div>
            <div
              style={{
                borderRadius: "10px 10px 10px 2px",
                padding: "8px 12px",
                background: T.fill1,
                border: reserveHeight ? `1px solid ${color}20` : `1px solid ${T.line}`,
                ...(reserveHeight && stream.predictedH
                  ? { minHeight: stream.predictedH }
                  : {}),
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  color: reserveHeight ? color + "60" : T.text99,
                  marginBottom: 4,
                  fontFamily: T.fontSans,
                }}
              >
                {bubbleCaption}
              </div>
              <div
                style={{
                  fontSize: 15,
                  lineHeight: "24px",
                  color: "#a0a0b0",
                  fontFamily: T.fontMono,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {stream.text}
                {stream.active && (
                  <span style={{ animation: "blink 0.7s infinite" }}>▌</span>
                )}
              </div>
            </div>
            {indicator}
            {stream.done && doneFooter}
          </div>
        )}
        {!visible && (
          <div
            style={{
              fontSize: 15,
              color: T.text77,
              fontFamily: T.fontSans,
            }}
          >
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
