import { useState, type CSSProperties } from "react";
import { ColHeader } from "./components/ColHeader";
import { PERF_MESSAGES, SCROLL_MESSAGES } from "./data";
import { HeightCalcTab } from "./tabs/HeightCalcTab";
import { PerfTab } from "./tabs/PerfTab";
import { StreamTab } from "./tabs/StreamTab";
import { L, R } from "./theme";
import s from "./App.module.css";

type TabId = "scroll" | "stream" | "perf";

const TABS: { id: TabId; label: string }[] = [
  { id: "scroll", label: "📐 Height Calculation" },
  { id: "stream", label: "💬 Live Streaming" },
  { id: "perf", label: "📊 Speed Test" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("scroll");

  return (
    <div className={s.app}>
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
              type="button"
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
          <HeightCalcTab messages={SCROLL_MESSAGES} />
        </div>
        <div className={s.panel} data-show={tab === "stream"}>
          <StreamTab />
        </div>
        <div className={s.panel} data-show={tab === "perf"}>
          <PerfTab messages={PERF_MESSAGES} />
        </div>
      </div>
    </div>
  );
}
