import { T } from "../theme";

interface ColHeaderProps {
  label: string;
  color: string;
  tag: string;
  sub: string;
}

export function ColHeader({ label, color, tag, sub }: ColHeaderProps) {
  return (
    <div
      style={{
        padding: "9px 14px",
        borderBottom: `1px solid ${color}20`,
        background: `${color}07`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 5px ${color}`,
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color,
            letterSpacing: "0.12em",
            fontFamily: T.fontMono,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 15,
            padding: "1px 5px",
            borderRadius: 3,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            color: color + "bb",
            fontFamily: T.fontMono,
          }}
        >
          {tag}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          color: T.textaa,
          marginTop: 2,
          fontFamily: T.fontSans,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
