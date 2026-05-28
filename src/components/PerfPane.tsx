import type { CSSProperties } from "react";
import { MsgBubble } from "./MsgBubble";
import s from "./PerfPane.module.css";
import type { BenchmarkResult, Message } from "../types";

interface PerfPaneProps {
  color: string;
  header: React.ReactNode;
  result: BenchmarkResult | null;
  /** Big number (e.g. `result.dom`). */
  value?: string;
  /** Right of the big number — plain text label or a tinted badge. */
  valueSuffix?: React.ReactNode;
  /** Progress-bar fill width as percentage (e.g. "100%" or "12%"). */
  barWidth?: string;
  /** Footer line under the bar. */
  statFooter?: React.ReactNode;
  /** Footer line on each message bubble when a result exists. */
  bubbleFooter?: string;
  messages: Message[];
  /** Animated flash overlay on bubbles while a benchmark is in flight. */
  showFlash?: boolean;
  /** Softer user-bubble tint (used by the Pretext side). */
  softUser?: boolean;
}

export function PerfPane({
  color,
  header,
  result,
  value,
  valueSuffix,
  barWidth = "100%",
  statFooter,
  bubbleFooter,
  messages,
  showFlash = false,
  softUser = false,
}: PerfPaneProps) {
  return (
    <div
      className={s.pane}
      style={{ "--c": color, "--bar-width": barWidth } as CSSProperties}
    >
      <div className={s.header}>
        <div className={s.headerText}>{header}</div>
      </div>

      {result && value !== undefined && (
        <div className={s.stat}>
          <div className={s.statTop}>
            <div className={s.value}>
              {value}
              <span className={s.valueUnit}>ms</span>
            </div>
            {valueSuffix}
          </div>
          <div className={s.bar}>
            <div className={s.barFill} />
          </div>
          {statFooter && <div className={s.statFooter}>{statFooter}</div>}
        </div>
      )}

      <div className={s.list}>
        {messages.map((msg, i) => (
          <MsgBubble
            key={msg.id}
            msg={msg}
            color={color}
            dense
            softUser={softUser}
            rowFlash={showFlash}
            flashIndex={showFlash ? i : undefined}
            footer={result && bubbleFooter ? bubbleFooter : undefined}
          />
        ))}
      </div>
    </div>
  );
}
