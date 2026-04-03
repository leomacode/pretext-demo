# Pretext Demo

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

## Technical highlights

- Shared `OffscreenCanvas` — one instance reused across all measurements
- Word-level width cache — shared vocabulary measured once across all messages
- `Float32Array` for height storage — less GC pressure
- `ResizeObserver` throttled with `requestAnimationFrame`

## Stack

React 18 · TypeScript · Vite · No UI libraries

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Why I built this

I built this to deeply understand Pretext's architecture after seeing it go viral.
The key insight: most AI chat apps batch streaming tokens specifically to hide layout instability.
Pretext removes the root cause, so you can render every token as it arrives
and still have a stable layout — a better user experience that most teams don't know is possible.
