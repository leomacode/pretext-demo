# Pretext Demo

[![CI](https://github.com/leomacode/pretext-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/leomacode/pretext-demo/actions/workflows/ci.yml)

**[Live Demo](https://pretext-demo-a8bxsx6mn-leomacodes-projects.vercel.app/)**

A side-by-side interactive demo exploring [@chenglou/pretext](https://github.com/chenglou/pretext) — a new JS/TS library for DOM-free text measurement that went from 0 to 7,000 GitHub stars in days.

## What this demonstrates

Most chat apps need to know how tall each message is before rendering it.
The traditional approach asks the browser to measure each element via `getBoundingClientRect()`,
which forces a synchronous layout reflow — pausing the entire page each time.

Pretext solves this with a two-phase approach:

1. **prepare()** — measures word widths once via Canvas, caches at word level
2. **layout()** — pure arithmetic from that point on, zero DOM reads

## Three tabs

| Tab                   | What it shows                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 📐 Height Calculation | Press Load — left side measures messages one by one (watch the counter), right side calculates all heights instantly |
| 💬 Live Streaming     | Same text streamed simultaneously — left container jumps on every new line, right container is locked from the start |
| 📊 Speed Test         | Real benchmark — actual DOM nodes rendered and measured, compared against Pretext math                               |

## Benchmark Results

Measured in Chrome 132 on MacBook Pro M1 Pro. Times are median of 5 runs.

| Messages | DOM measure | Pretext | Speedup |
| -------: | ----------: | ------: | ------: |
|      100 |        XX ms |    X ms |      Xx |
|     1000 |       XXX ms |    X ms |     XXx |
|     5000 |      XXXX ms |   XX ms |    XXXx |

![Speed Test screenshot](./public/speed-test.png)

## Technical highlights

- Shared `OffscreenCanvas` — one instance reused across all measurements
- Word-level width cache — shared vocabulary measured once across all messages
- `Float32Array` for height storage — less GC pressure
- `ResizeObserver` throttled with `requestAnimationFrame`

## Stack

React 19 · TypeScript · Vite · No UI libraries

## Run locally

```bash
npm install
npm run dev
```

## Why I built this

I built this to deeply understand Pretext's architecture after seeing it go viral.
The key insight: most AI chat apps batch streaming tokens specifically to hide layout instability.
Pretext removes the root cause, so you can render every token as it arrives
and still have a stable layout — a better user experience that most teams don't know is possible.

## What I Learned

- **Forced sync layout has a compounding cost.** Every `getBoundingClientRect()` call forces the browser to flush pending style/DOM mutations before returning a number. With 1000 messages, that's 1000 separate layout flushes — each pausing the main thread.
- **Canvas measurement is constant-time per unique word.** `ctx.measureText()` is fast, and a word-level cache means a 10,000-message conversation with shared vocabulary measures in roughly the time it takes to measure the unique words once.
- **Why streaming chat apps batch tokens.** Every new token triggers layout, layout is synchronous, so batching hides the resulting jank. Pretext removes the root cause, allowing per-token rendering with a stable layout.
- **`OffscreenCanvas` + `Float32Array` matter at scale.** Reusing one canvas across all measurements avoids GPU context churn. Typed-array storage for heights drops GC pressure to near-zero when streaming.

## When NOT to Use Pretext

- **Small message lists (< 100 messages).** DOM measurement is plenty fast. The engineering and bundle cost isn't justified.
- **Heavy font / style variance per message.** The word-level width cache assumes stable typography. If every message has different fonts or sizes, cache hit rate collapses and the Canvas measurement loses its advantage.
- **Right-to-left scripts or complex Unicode.** `ctx.measureText` doesn't handle bidirectional text or grapheme clustering (emoji ZWJ sequences, combining marks) the way the layout engine does. DOM still wins here.
- **Content that depends on dynamic container styles.** Pretext's `prepare()` phase locks assumptions about line-height, padding, and width. If those change at runtime, the cached layout is wrong.
