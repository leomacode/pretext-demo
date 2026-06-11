import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ColHeader } from "./components/ColHeader";
import { SCROLL_MESSAGES, generateMessages } from "./data";
import { HeightCalcTab } from "./tabs/HeightCalcTab";
import { PerfTab } from "./tabs/PerfTab";
import { StreamTab } from "./tabs/StreamTab";
import { T } from "./theme";
import type { Message } from "./types";
import s from "./App.module.css";

type TabId = "scroll" | "stream" | "perf";

const TABS: { id: TabId; label: string }[] = [
  { id: "scroll", label: "📐 Height Calculation" },
  { id: "stream", label: "💬 Live Streaming" },
  { id: "perf", label: "📊 Speed Test" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("scroll");
  const [messages] = useState<Message[]>(() => generateMessages(80));
  const appRef = useRef<HTMLDivElement>(null);
  const [appWidth, setAppWidth] = useState(900);

  useEffect(() => {
    if (!appRef.current) return;
    let rafId: number;
    // Coalesce resize bursts to one update per frame — all three tabs stay
    // mounted, so each appWidth change re-renders the whole tree.
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setAppWidth(e.contentRect.width));
    });
    ro.observe(appRef.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const { L, R } = T;

  return (
    <div ref={appRef} className={s.app}>
      {/* TOP BAR */}
      <div className={s.bar}>
        <div className={s.brand}>
          <div className={s.dots}>
            <div className={s.dot} style={{ "--c": L } as CSSProperties} />
            <div className={s.dot} style={{ "--c": R } as CSSProperties} />
          </div>
          <span className={s.title}>PRETEXT DEMO</span>
          <span className={s.subtitle}>
            A new library for fast text layout · @chenglou/pretext
          </span>
        </div>
        <div className={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={s.tab}
              data-active={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* COL HEADERS — hidden on scroll tab */}
      {tab !== "scroll" && (
        <div className={s.colHeaders}>
          <ColHeader
            label="WITHOUT PRETEXT"
            color={L}
            tag="old approach"
            sub="Browser has to pause and re-measure the page on every calculation"
          />
          <div className={s.colLine} />
          <ColHeader
            label="WITH PRETEXT"
            color={R}
            tag="new approach"
            sub="Measures once, then does pure math — browser never has to stop"
          />
        </div>
      )}

      {/* PANELS — all three stay mounted so per-tab state (benchmark
          results, stream progress) persists across tab switches. */}
      <div className={s.panels}>
        <div className={s.panel} data-show={tab === "scroll"}>
          <HeightCalcTab messages={SCROLL_MESSAGES} L={L} R={R} />
        </div>
        <div className={s.panel} data-show={tab === "stream"}>
          <StreamTab appWidth={appWidth} L={L} R={R} />
        </div>
        <div className={s.panel} data-show={tab === "perf"}>
          <PerfTab messages={messages} appWidth={appWidth} L={L} R={R} />
        </div>
      </div>
    </div>
  );
}
