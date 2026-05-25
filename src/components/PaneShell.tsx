import type { ReactNode } from "react";
import { T } from "../theme";

interface PaneShellProps {
  color: string;
  /** Right border between this pane and the next column. */
  borderRight?: boolean;
  /** Status line on the left of the header bar. */
  header: ReactNode;
  /** Optional progress chip on the right of the header bar. */
  chip?: ReactNode;
  children: ReactNode;
}

/** Column shell with a color-tinted header bar and a scrollable body. */
export function PaneShell({
  color,
  borderRight = false,
  header,
  chip,
  children,
}: PaneShellProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        borderRight: borderRight ? `1px solid ${T.line}` : undefined,
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${color}18`,
          background: `${color}05`,
          flexShrink: 0,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: T.textbb,
            fontFamily: T.fontSans,
          }}
        >
          {header}
        </div>
        {chip}
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 6 }}>{children}</div>
    </div>
  );
}
