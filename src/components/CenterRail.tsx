import type { ReactNode } from "react";
import { T } from "../theme";

interface CenterRailProps {
  children: ReactNode;
}

/** Center column between the two side panes — dark strip with side borders. */
export function CenterRail({ children }: CenterRailProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 10,
        background: T.surface,
        borderLeft: `1px solid ${T.line}`,
        borderRight: `1px solid ${T.line}`,
      }}
    >
      {children}
    </div>
  );
}
