import type { ReactNode } from "react";
import s from "./EmptyHint.module.css";

interface EmptyHintProps {
  children: ReactNode;
}

/** Centered placeholder text shown inside an empty scroll area. */
export function EmptyHint({ children }: EmptyHintProps) {
  return <div className={s.hint}>{children}</div>;
}
