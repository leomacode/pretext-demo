import type { ReactNode } from "react";
import { T } from "../theme";

interface DoneNoteProps {
  color: string;
  children: ReactNode;
}

/** Slide-in summary card shown at the bottom of a pane when work completes. */
export function DoneNote({ color, children }: DoneNoteProps) {
  return (
    <div
      style={{
        margin: "10px 12px",
        padding: "10px 14px",
        background: `${color}0a`,
        border: `1px solid ${color}25`,
        borderRadius: 8,
        fontFamily: T.fontSans,
        fontSize: 15,
        color: color + "99",
        animation: "slideUp 0.3s ease",
      }}
    >
      {children}
    </div>
  );
}
