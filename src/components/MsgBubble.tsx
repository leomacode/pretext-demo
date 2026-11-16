import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import s from "./MsgBubble.module.css";
import { FONT_SIZE, type Message } from "../types";

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
  /** Softer user-bubble tint (lighter background + thinner border). */
  softUser?: boolean;
}

// White fills that don't depend on the pane color.
const ASSISTANT_BG = "var(--fill-25)";
const ASSISTANT_BD = "var(--fill-6)";

/** Pane color at `pct`% opacity. `--c` is set on the row below. */
const tint = (pct: number) =>
  `color-mix(in srgb, var(--c) ${pct}%, transparent)`;

// Memoized: bubble lists are large (120+ per pane) and parent tabs re-render
// on fast timers (reveal/stream intervals), but each bubble's props are stable.
export const MsgBubble = memo(function MsgBubble({
  msg,
  color,
  highlight = false,
  dense = false,
  rowFlash = false,
  flashIndex,
  footer,
  softUser = false,
}: MsgBubbleProps) {
  const isUser = msg.role === "user";
  const showFlash = flashIndex !== undefined;

  // Intl time formatting is comparatively expensive; the timestamp never
  // changes, so cache the formatted string across flash/highlight re-renders.
  const timeLabel = useMemo(
    () =>
      msg.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [msg.timestamp],
  );

  // Bubble tint is a function of (highlight, isUser, softUser, dense). Too
  // combinatorial for class selectors — compute the two color strings here
  // and hand them to CSS as custom properties.
  const bubbleBg = highlight
    ? tint(isUser ? 16 : 8)
    : isUser
      ? tint(softUser ? 3 : 6)
      : ASSISTANT_BG;
  const bubbleBd = isUser
    ? tint(highlight ? 33 : softUser ? 13 : dense ? 13 : 16)
    : ASSISTANT_BD;
  const textColor = isUser ? "#d0ffd0" : dense ? "#909090" : "#a8a8b8";

  const vars = {
    "--c": color,
    "--bubble-bg": bubbleBg,
    "--bubble-bd": bubbleBd,
    "--text-color": textColor,
    "--font-size": `${FONT_SIZE}px`,
  } as CSSProperties;

  return (
    <div
      className={s.row}
      data-user={isUser}
      data-highlight={highlight}
      data-flash={rowFlash}
      style={vars}
    >
      <div className={s.bubble} data-user={isUser} data-dense={dense}>
        {showFlash && (
          <div
            className={s.flash}
            style={{
              animation: `benchFlash ${0.05 + (flashIndex % 5) * 0.02}s ease infinite alternate`,
            }}
          />
        )}
        <div className={s.meta} data-dense={dense}>
          {isUser ? "YOU" : "AI"} · {timeLabel}
        </div>
        <div className={s.text} data-dense={dense}>
          {msg.text}
        </div>
        {footer && (
          <div className={s.footer}>{footer}</div>
        )}
      </div>
    </div>
  );
});
