import { MsgBubble } from "./MsgBubble";
import { T } from "../theme";
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${color}18`,
          flexShrink: 0,
          background: `${color}05`,
          minHeight: 52,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: T.textaa,
            fontFamily: T.fontSans,
            lineHeight: 1.5,
          }}
        >
          {header}
        </div>
      </div>

      {/* Stat card */}
      {result && value !== undefined && (
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${color}18`,
            background: `${color}0a`,
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
                color,
                lineHeight: 1,
              }}
            >
              {value}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  color: T.textcc,
                  marginLeft: 3,
                }}
              >
                ms
              </span>
            </div>
            {valueSuffix}
          </div>
          <div
            style={{
              height: 4,
              background: T.line5,
              borderRadius: 2,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: "100%",
                width: barWidth,
                background: color,
                borderRadius: 2,
                boxShadow: `0 0 8px ${color}`,
                transition: "width 1.2s ease",
              }}
            />
          </div>
          {statFooter && (
            <div
              style={{
                fontSize: 14,
                color: T.textbb,
                fontFamily: T.fontSans,
                lineHeight: 1.7,
              }}
            >
              {statFooter}
            </div>
          )}
        </div>
      )}

      {/* Bubble list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
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
