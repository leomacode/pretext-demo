import { useCallback, useState } from "react";
import { CenterRail } from "../components/CenterRail";
import { StreamPane } from "../components/StreamPane";
import { useStream } from "../hooks/useStream";
import { T } from "../theme";

interface StreamTabProps {
  appWidth: number;
  L: string;
  R: string;
}

export function StreamTab({ appWidth, L, R }: StreamTabProps) {
  const [leftShifts, setLeftShifts] = useState(0);

  const leftStream = useStream(appWidth / 2, false, () =>
    setLeftShifts((s) => s + 1),
  );
  const rightStream = useStream(appWidth / 2, true);

  const streamBoth = useCallback(() => {
    setLeftShifts(0);
    leftStream.start();
    rightStream.start();
  }, [leftStream, rightStream]);

  const running = leftStream.active || rightStream.active;

  // Left-side indicator: animated arrow + page-jump counter card.
  const leftIndicator = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: L,
          animation: leftShifts > 0 ? "bounceUp 0.6s ease infinite" : "none",
          lineHeight: 1,
          paddingTop: 2,
        }}
      >
        ↑
      </div>
      <div
        style={{
          flex: 1,
          padding: "8px 12px",
          background: leftShifts === 0 ? T.fill1 : `${L}10`,
          border: `1px solid ${leftShifts === 0 ? T.line : L + "40"}`,
          borderRadius: 8,
          fontFamily: T.fontSans,
          transition: "all 0.2s",
        }}
      >
        {leftShifts === 0 ? (
          <div style={{ fontSize: 15, color: T.textaa }}>
            Waiting for first jump…
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, color: L }}>
              {leftShifts} page jump{leftShifts !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 14, color: T.textcc, marginTop: 2 }}>
              Each time the bubble grew taller, everything on the page shifted.
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Right-side indicator: static "Zero jumps" card.
  const rightIndicator = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 16, color: R, lineHeight: 1, paddingTop: 2 }}>↑</div>
      <div
        style={{
          flex: 1,
          padding: "8px 12px",
          background: `${R}08`,
          border: `1px solid ${R}30`,
          borderRadius: 8,
          fontFamily: T.fontSans,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: R }}>
          Zero jumps 🔒
        </div>
        <div style={{ fontSize: 14, color: T.textcc, marginTop: 2 }}>
          The space was calculated before streaming started. The page never
          moved.
        </div>
      </div>
    </div>
  );

  const doneFooterStyle = (color: string) => ({
    marginTop: 8,
    padding: "8px 12px",
    background: `${color}0a`,
    border: `1px solid ${color}25`,
    borderRadius: 8,
    fontSize: 15,
    color: color + "99",
    fontFamily: T.fontSans,
    animation: "slideUp 0.3s ease",
  });

  return (
    <>
      <StreamPane
        color={L}
        header="No height prediction — bubble grows word by word."
        intro="The bubble grows word by word. Every new line pushes everything below it down."
        stream={leftStream}
        bubbleCaption="AI · height changes on every new line"
        indicator={leftIndicator}
        doneFooter={
          <div style={doneFooterStyle(L)}>
            Finished. The page jumped{" "}
            <strong style={{ color: L }}>{leftShifts} times</strong> while that
            one message was typing.
          </div>
        }
        emptyText="Press the button in the middle to start."
      />

      <CenterRail>
        <button
          onClick={streamBoth}
          disabled={running}
          style={{
            width: 110,
            padding: "10px 8px",
            fontSize: 15,
            fontFamily: T.fontSans,
            fontWeight: 600,
            background: running ? T.fill4 : T.fill8,
            border: `1px solid ${T.fill20}`,
            borderRadius: 8,
            color: running ? T.textaa : T.text99,
            cursor: running ? "not-allowed" : "pointer",
            textAlign: "center",
            lineHeight: 1.5,
            transition: "all 0.2s",
          }}
        >
          {running ? "●" : "▶ Stream both"}
          <br />
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            {running ? "Streaming…" : "at the same time"}
          </span>
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: T.text55,
            textAlign: "center",
            fontFamily: T.fontSans,
            lineHeight: 1.5,
            width: 90,
          }}
        >
          Same text,
          <br />
          same timing
        </div>
      </CenterRail>

      <StreamPane
        color={R}
        header="Pretext locks the height before streaming starts."
        intro="The full space is reserved before the first word arrives. Nothing below ever moves."
        stream={rightStream}
        reserveHeight
        bubbleCaption={
          <>AI · space reserved: {rightStream.predictedH}px 🔒</>
        }
        indicator={rightIndicator}
        doneFooter={
          <div style={doneFooterStyle(R)}>
            Finished. <strong style={{ color: R }}>Zero page jumps.</strong>{" "}
            Pretext predicted the height before the first word arrived.
          </div>
        }
        emptyText="Waiting…"
      />
    </>
  );
}
