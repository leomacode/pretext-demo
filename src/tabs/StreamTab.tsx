import { useCallback, useState } from "react";
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

  return (
    <>
      {/* LEFT — without Pretext */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${L}15`,
            flexShrink: 0,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textaa,
              fontFamily: T.fontSans,
            }}
          >
            No height prediction — bubble grows word by word.
          </div>
        </div>
        <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
          <div
            style={{
              fontSize: 15,
              color: T.textaa,
              marginBottom: 10,
              lineHeight: 1.6,
              fontFamily: T.fontSans,
            }}
          >
            The bubble grows word by word. Every new line pushes everything
            below it down.
          </div>
          {(leftStream.text || leftStream.active) && (
            <div>
              <div
                style={{
                  borderRadius: "10px 10px 10px 2px",
                  padding: "8px 12px",
                  background: T.fill1,
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    color: T.text99,
                    marginBottom: 4,
                    fontFamily: T.fontSans,
                  }}
                >
                  AI · height changes on every new line
                </div>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: "24px",
                    color: "#a0a0b0",
                    fontFamily: T.fontMono,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {leftStream.text}
                  {leftStream.active && (
                    <span style={{ animation: "blink 0.7s infinite" }}>▌</span>
                  )}
                </div>
              </div>
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      color: L,
                      animation:
                        leftShifts > 0
                          ? "bounceUp 0.6s ease infinite"
                          : "none",
                      lineHeight: 1,
                    }}
                  >
                    ↑
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background:
                      leftShifts === 0 ? T.fill1 : `${L}10`,
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
                      <div
                        style={{ fontSize: 20, fontWeight: 700, color: L }}
                      >
                        {leftShifts} page jump{leftShifts !== 1 ? "s" : ""}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: T.textcc,
                          marginTop: 2,
                        }}
                      >
                        Each time the bubble grew taller, everything on the
                        page shifted.
                      </div>
                    </>
                  )}
                </div>
              </div>
              {leftStream.done && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: `${L}0a`,
                    border: `1px solid ${L}25`,
                    borderRadius: 8,
                    fontSize: 15,
                    color: L + "99",
                    fontFamily: T.fontSans,
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  Finished. The page jumped{" "}
                  <strong style={{ color: L }}>{leftShifts} times</strong>{" "}
                  while that one message was typing.
                </div>
              )}
            </div>
          )}
          {!leftStream.text && !leftStream.active && (
            <div
              style={{
                fontSize: 15,
                color: T.text77,
                fontFamily: T.fontSans,
              }}
            >
              Press the button in the middle to start.
            </div>
          )}
        </div>
      </div>

      {/* CENTER BUTTON */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 10,
          background: T.surface,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={streamBoth}
          disabled={running}
          style={{
            width: 110,
            padding: "10px 8px",
            fontSize: 15,
            fontFamily: T.fontSans,
            fontWeight: 600,
            background: running
              ? T.fill4
              : T.fill8,
            border: "1px solid rgba(255,255,255,0.2)",
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
      </div>

      {/* RIGHT — with Pretext */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${R}15`,
            flexShrink: 0,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textaa,
              fontFamily: T.fontSans,
            }}
          >
            Pretext locks the height before streaming starts.
          </div>
        </div>
        <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
          <div
            style={{
              fontSize: 15,
              color: T.textaa,
              marginBottom: 10,
              lineHeight: 1.6,
              fontFamily: T.fontSans,
            }}
          >
            The full space is reserved before the first word arrives. Nothing
            below ever moves.
          </div>
          {(rightStream.text || rightStream.active) && (
            <div>
              <div
                style={{
                  borderRadius: "10px 10px 10px 2px",
                  padding: "8px 12px",
                  background: T.fill1,
                  border: `1px solid ${R}20`,
                  ...(rightStream.predictedH
                    ? { minHeight: rightStream.predictedH }
                    : {}),
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    color: R + "60",
                    marginBottom: 4,
                    fontFamily: T.fontSans,
                  }}
                >
                  AI · space reserved: {rightStream.predictedH}px 🔒
                </div>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: "24px",
                    color: "#a0a0b0",
                    fontFamily: T.fontMono,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {rightStream.text}
                  {rightStream.active && (
                    <span style={{ animation: "blink 0.7s infinite" }}>▌</span>
                  )}
                </div>
              </div>
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
                    color: R,
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
                    background: `${R}08`,
                    border: `1px solid ${R}30`,
                    borderRadius: 8,
                    fontFamily: T.fontSans,
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700, color: R }}>
                    Zero jumps 🔒
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: T.textcc,
                      marginTop: 2,
                    }}
                  >
                    The space was calculated before streaming started. The page
                    never moved.
                  </div>
                </div>
              </div>
              {rightStream.done && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: `${R}0a`,
                    border: `1px solid ${R}25`,
                    borderRadius: 8,
                    fontSize: 15,
                    color: R + "99",
                    fontFamily: T.fontSans,
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  Finished. <strong style={{ color: R }}>Zero page jumps.</strong>{" "}
                  Pretext predicted the height before the first word arrived.
                </div>
              )}
            </div>
          )}
          {!rightStream.text && !rightStream.active && (
            <div
              style={{
                fontSize: 15,
                color: T.text77,
                fontFamily: T.fontSans,
              }}
            >
              Waiting…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
