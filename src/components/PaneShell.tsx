import type { CSSProperties, ReactNode } from "react";
import s from "./PaneShell.module.css";

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
      className={s.shell}
      data-border-right={borderRight}
      style={{ "--c": color } as CSSProperties}
    >
      <div className={s.header}>
        <div className={s.headerText}>{header}</div>
        {chip}
      </div>
      <div className={s.body}>{children}</div>
    </div>
  );
}
