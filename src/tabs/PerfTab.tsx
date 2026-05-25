import { useCallback, useState } from "react";
import { runRealBenchmark } from "../benchmark";
import { generateMessages } from "../data";
import { T } from "../theme";
import type { BenchmarkResult, Message } from "../types";

interface PerfTabProps {
  messages: Message[];
  appWidth: number;
  L: string;
  R: string;
}

export function PerfTab({ messages, appWidth, L, R }: PerfTabProps) {
  const [perfResult, setPerfResult] = useState<BenchmarkResult | null>(null);
  const [perfRunning, setPerfRunning] = useState(false);
  const [perfStep, setPerfStep] = useState("");
  const [perfSize, setPerfSize] = useState(1000);

  const runPerf = useCallback(() => {
    setPerfRunning(true);
    setPerfResult(null);
    setPerfStep(`Rendering ${perfSize} messages into the page…`);
    setTimeout(() => {
      setPerfStep("Measuring with DOM (triggering reflows)…");
      setTimeout(() => {
        const benchMsgs = generateMessages(perfSize);
        const result = runRealBenchmark(benchMsgs, appWidth / 2);
        setPerfResult(result);
        setPerfRunning(false);
        setPerfStep("");
      }, 80);
    }, 60);
  }, [perfSize, appWidth]);

  return (
    <>
      {/* LEFT — DOM */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${L}18`,
            flexShrink: 0,
            background: `${L}05`,
            minHeight: 52,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textaa,
              fontFamily: T.fontSans,
              lineHeight: 1.5,
            }}
          >
            Old method — browser pauses and re-measures
            <br />
            the whole page for every single message.
          </div>
        </div>
        {perfResult && (
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${L}18`,
              background: `${L}0a`,
              flexShrink: 0,
              animation: "slideUp 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: L,
                  lineHeight: 1,
                }}
              >
                {perfResult.dom}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: T.textcc,
                    marginLeft: 3,
                  }}
                >
                  ms
                </span>
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: T.textcc,
                  fontFamily: T.fontSans,
                }}
              >
                to measure {perfResult.msgCount} messages
              </div>
            </div>
            <div
              style={{
                height: 4,
                background: T.line5,
                borderRadius: 2,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "100%",
                  background: L,
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${L}`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 14,
                color: T.textbb,
                fontFamily: T.fontSans,
                lineHeight: 1.7,
              }}
            >
              ⏱{" "}
              {(parseFloat(perfResult.dom) / perfResult.msgCount).toFixed(2)}
              ms per message ·{" "}
              <span style={{ color: L }}>
                ⚠️ Just{" "}
                {Math.max(
                  1,
                  Math.floor(
                    16 / (parseFloat(perfResult.dom) / perfResult.msgCount),
                  ),
                )}{" "}
                messages = already slow enough to feel laggy
              </span>
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  padding: "3px 12px",
                  background: perfRunning ? `${L}06` : "transparent",
                  transition: "background 0.3s",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    borderRadius: isUser
                      ? "10px 10px 2px 10px"
                      : "10px 10px 10px 2px",
                    padding: "5px 10px",
                    background: isUser ? `${L}10` : T.fill25,
                    border: `1px solid ${isUser ? L + "22" : T.fill6}`,
                    position: "relative",
                  }}
                >
                  {perfRunning && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        background: `${L}15`,
                        animation: `benchFlash ${0.05 + (i % 5) * 0.02}s ease infinite alternate`,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: 15,
                      color: T.text77,
                      marginBottom: 2,
                      fontFamily: T.fontMono,
                    }}
                  >
                    {isUser ? "YOU" : "AI"} ·{" "}
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: "18px",
                      color: isUser ? "#d0ffd0" : "#909090",
                      fontFamily: T.fontMono,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                  {perfResult && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        color: L + "66",
                        fontFamily: T.fontMono,
                      }}
                    >
                      ← measured via DOM reflow
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 8,
            width: 110,
            justifyContent: "center",
          }}
        >
          {[100, 1000, 5000].map((n) => (
            <button
              key={n}
              onClick={() => setPerfSize(n)}
              disabled={perfRunning}
              style={{
                flex: 1,
                padding: "4px 0",
                fontSize: 12,
                fontFamily: T.fontMono,
                background:
                  perfSize === n
                    ? T.fill15
                    : T.fill4,
                border: `1px solid ${perfSize === n ? T.fill40 : T.fill10}`,
                borderRadius: 4,
                color: perfSize === n ? "#fff" : T.text88,
                cursor: perfRunning ? "not-allowed" : "pointer",
              }}
            >
              {n >= 1000 ? `${n / 1000}k` : n}
            </button>
          ))}
        </div>
        <button
          onClick={runPerf}
          disabled={perfRunning}
          style={{
            width: 110,
            padding: "10px 0",
            fontSize: 15,
            fontFamily: T.fontSans,
            fontWeight: 600,
            background: perfRunning
              ? T.fill4
              : T.fill8,
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: perfRunning ? T.textaa : T.text99,
            cursor: perfRunning ? "not-allowed" : "pointer",
            textAlign: "center",
            lineHeight: 1.5,
            transition: "all 0.2s",
          }}
        >
          {perfRunning ? "⏳" : "▶ Run"}
          <br />
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            {perfRunning ? perfStep : `${perfSize} messages`}
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
          Measures both
          <br />
          methods at once
        </div>
      </div>

      {/* RIGHT — Pretext */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: `1px solid ${R}18`,
            flexShrink: 0,
            background: `${R}05`,
            minHeight: 52,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: T.textaa,
              fontFamily: T.fontSans,
              lineHeight: 1.5,
            }}
          >
            Pretext — measures each word once via Canvas,
            <br />
            then does pure math. No page pausing.
          </div>
        </div>
        {perfResult && (
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${R}18`,
              background: `${R}0a`,
              flexShrink: 0,
              animation: "slideUp 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: R,
                  lineHeight: 1,
                }}
              >
                {perfResult.pretext}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: T.textcc,
                    marginLeft: 3,
                  }}
                >
                  ms
                </span>
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  background: `${R}20`,
                  border: `1px solid ${R}40`,
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  color: R,
                  fontFamily: T.fontSans,
                }}
              >
                {perfResult.ratio}× faster
              </div>
            </div>
            <div
              style={{
                height: 4,
                background: T.line5,
                borderRadius: 2,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: R,
                  boxShadow: `0 0 8px ${R}`,
                  width: `${Math.min(100, (parseFloat(perfResult.pretext) / parseFloat(perfResult.dom)) * 100)}%`,
                  transition: "width 1.2s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 14,
                color: T.textbb,
                fontFamily: T.fontSans,
                lineHeight: 1.7,
              }}
            >
              ✅ {perfResult.pretext}ms total · fits inside one 16ms screen
              refresh · zero page pauses
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  padding: "3px 12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    borderRadius: isUser
                      ? "10px 10px 2px 10px"
                      : "10px 10px 10px 2px",
                    padding: "5px 10px",
                    background: isUser ? `${R}08` : T.fill25,
                    border: `1px solid ${isUser ? R + "20" : T.fill6}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      color: T.text77,
                      marginBottom: 2,
                      fontFamily: T.fontMono,
                    }}
                  >
                    {isUser ? "YOU" : "AI"} ·{" "}
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: "18px",
                      color: isUser ? "#d0ffd0" : "#909090",
                      fontFamily: T.fontMono,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                  {perfResult && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        color: R + "66",
                        fontFamily: T.fontMono,
                      }}
                    >
                      ← height from Canvas math, no DOM needed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
