import type { CSSProperties, ReactNode } from "react";
import s from "./DoneNote.module.css";

interface DoneNoteProps {
  color: string;
  children: ReactNode;
}

/** Slide-in summary card shown at the bottom of a pane when work completes. */
export function DoneNote({ color, children }: DoneNoteProps) {
  return (
    <div className={s.note} style={{ "--c": color } as CSSProperties}>
      {children}
    </div>
  );
}
