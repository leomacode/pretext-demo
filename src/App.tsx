import { useEffect, useRef, useState } from "react";
import { ColHeader } from "./components/ColHeader";
import { SCROLL_MESSAGES, generateMessages } from "./data";
import { HeightCalcTab } from "./tabs/HeightCalcTab";
import { PerfTab } from "./tabs/PerfTab";
import { StreamTab } from "./tabs/StreamTab";
import { T } from "./theme";
import type { Message } from "./types";

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
    const ro = new ResizeObserver(([e]) => setAppWidth(e.contentRect.width));
    ro.observe(appRef.current);
    return () => ro.disconnect();
  }, []);

  const { L, R } = T;

  return (
    <div
      ref={appRef}
      style={{
        height: "100vh",
        width: "100%",
        background: T.bgApp,
        display: "flex",
        flexDirection: "column",
        fontFamily: T.fontMono,
        overflow: "hidden",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: T.bgBar,
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: L,
                boxShadow: `0 0 5px ${L}`,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: R,
                boxShadow: `0 0 5px ${R}`,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.1em",
            }}
          >
            PRETEXT DEMO
          </span>
          <span
            style={{
              fontSize: 14,
              color: T.text66,
              fontFamily: T.fontSans,
            }}
          >
            A new library for fast text layout · @chenglou/pretext
          </span>
        </div>
        <div style={{ display: "flex" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "5px 12px",
                fontSize: 14,
                fontFamily: T.fontSans,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: tab === t.id ? "#fff" : T.textbb,
                borderBottom:
                  tab === t.id
                    ? "1px solid #ffffff70"
                    : "1px solid transparent",
                transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* COL HEADERS — hidden on scroll tab */}
      {tab !== "scroll" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            flexShrink: 0,
          }}
        >
          <ColHeader
            label="WITHOUT PRETEXT"
            color={L}
            tag="old approach"
            sub="Browser has to pause and re-measure the page on every calculation"
          />
          <div style={{ background: T.line }} />
          <ColHeader
            label="WITH PRETEXT"
            color={R}
            tag="new approach"
            sub="Measures once, then does pure math — browser never has to stop"
          />
        </div>
      )}

      {/* PANELS */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: tab === "scroll" ? "1fr" : "1fr 130px 1fr",
          minHeight: 0,
        }}
      >
        {tab === "scroll" && (
          <HeightCalcTab messages={SCROLL_MESSAGES} L={L} R={R} />
        )}
        {tab === "stream" && <StreamTab appWidth={appWidth} L={L} R={R} />}
        {tab === "perf" && (
          <PerfTab messages={messages} appWidth={appWidth} L={L} R={R} />
        )}
      </div>
    </div>
  );
}
