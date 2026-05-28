import type { CSSProperties } from "react";
import s from "./ColHeader.module.css";

interface ColHeaderProps {
  label: string;
  color: string;
  tag: string;
  sub: string;
}

export function ColHeader({ label, color, tag, sub }: ColHeaderProps) {
  return (
    <div className={s.header} style={{ "--c": color } as CSSProperties}>
      <div className={s.row}>
        <div className={s.dot} />
        <span className={s.label}>{label}</span>
        <span className={s.tag}>{tag}</span>
      </div>
      <div className={s.sub}>{sub}</div>
    </div>
  );
}
