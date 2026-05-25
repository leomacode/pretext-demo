import type { ReactNode } from "react";
import { T } from "../theme";

interface EmptyHintProps {
  children: ReactNode;
}

/** Centered placeholder text shown inside an empty scroll area. */
export function EmptyHint({ children }: EmptyHintProps) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: T.text77,
        fontSize: 15,
        fontFamily: T.fontSans,
        lineHeight: 1.8,
      }}
    >
      {children}
    </div>
  );
}
