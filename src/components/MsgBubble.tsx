import type { ReactNode } from "react";
import { T } from "../theme";
import type { Message } from "../types";

interface MsgBubbleProps {
  msg: Message;
  color: string;
  /** Highlight ring + slide-in animation. */
  highlight?: boolean;
  /** Compact paddings + tighter line-height (used in dense lists like Speed Test). */
  dense?: boolean;
  /** Row-level background flash while a benchmark is in flight. */
  rowFlash?: boolean;
  /** Animated overlay on the bubble itself, staggered by index. */
  flashIndex?: number;
  /** Caption shown beneath the text (e.g. "← measured via DOM reflow"). */
  footer?: ReactNode;
}

export function MsgBubble({
  msg,
  color,
  highlight = false,
  dense = false,
  rowFlash = false,
  flashIndex,
  footer,
}: MsgBubbleProps) {
  const isUser = msg.role === "user";
  const showFlash = flashIndex !== undefined;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "3px 12px",
        animation: highlight ? "slideUp 0.15s ease" : "none",
        background: rowFlash ? `${color}06` : "transparent",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
          padding: dense ? "5px 10px" : "6px 10px",
          background: highlight
            ? isUser
              ? `${color}28`
              : `${color}14`
            : isUser
              ? dense
                ? `${color}10`
                : `${color}10`
              : T.fill25,
          border: `1px solid ${
            isUser
              ? color + (highlight ? "55" : dense ? "22" : "28")
              : T.fill6
          }`,
          transition: "background 0.3s, border 0.3s",
          position: "relative",
        }}
      >
        {showFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: `${color}15`,
              animation: `benchFlash ${0.05 + (flashIndex % 5) * 0.02}s ease infinite alternate`,
            }}
          />
        )}
        <div
          style={{
            fontSize: 15,
            color: dense ? T.text77 : T.text99,
            marginBottom: dense ? 2 : 3,
            fontFamily: T.fontMono,
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
            lineHeight: dense ? "18px" : "24px",
            color: isUser ? "#d0ffd0" : dense ? "#909090" : "#a8a8b8",
            fontFamily: T.fontMono,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg.text}
        </div>
        {footer && (
          <div
            style={{
              marginTop: 3,
              fontSize: 15,
              color: color + "66",
              fontFamily: T.fontMono,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
