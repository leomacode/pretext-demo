import type { Message } from "../types";

interface MsgBubbleProps {
  msg: Message;
  color: string;
  highlight: boolean;
}

export function MsgBubble({ msg, color, highlight }: MsgBubbleProps) {
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
}
