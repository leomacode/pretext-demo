import type { ReactNode } from "react";
import s from "./CenterRail.module.css";

interface CenterRailProps {
  children: ReactNode;
}

/** Center column between the two side panes — dark strip with side borders. */
export function CenterRail({ children }: CenterRailProps) {
  return <div className={s.rail}>{children}</div>;
}
