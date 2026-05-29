# Design notes

Short record of the decisions behind this demo and the tradeoffs each one
made. It is intentionally a single file, not a formal ADR set — the project is
small enough that one page of judgment beats a folder of ceremony.

---

## 1. Make the benchmark honest, even when honesty looks slower

**Context.** The demo's whole purpose is the DOM-vs-Pretext comparison, so the
measurement *is* the product. An early version timed the DOM side by appending
every bubble first and reading heights afterward.

**Problem.** That batches into a single layout flush — it measures one reflow
for the whole set, not the per-message cost a streaming chat app actually pays.
It made the DOM side look ~2× faster than reality.

**Decision.** Measure the DOM side the way production hurts: append one bubble,
read `getBoundingClientRect()`, remove it, repeat — forcing one reflow per
message. Time only Pretext's `layout()` phase (not `prepare()`), because
`prepare()` is amortized once and `layout()` is what re-renders pay.

**Tradeoffs.** A naïve "measure each in a shared growing container" fix is
correct *and* O(n²) — it froze the tab at 5k messages. The shipped version
removes each node so the container stays size-1: honest per-message reflow,
O(n) total. The numbers are now larger but real, and the README states the
methodology so they can't be read as marketing.

---

## 2. Two-tier tests: fast logic in Node, the correctness claim in a browser

**Context.** Pretext's pitch is "Canvas math equals the browser's layout." That
claim can only be verified against a real layout engine. happy-dom has none
(`getBoundingClientRect` returns 0).

**Decision.** Split the suite into two Vitest projects: a `unit` project
(happy-dom) for hook/state-machine logic, and a `browser` project
(Playwright/Chromium) that cross-validates Pretext height vs the DOM within
±2px. CI runs both.

**Why not just skip the DOM tests (the original approach).** Skipping hid a
real bug: the test compared raw `layout()` against padded `domMeasureHeight()`.
Running it for real surfaced both that bug and a Pretext limitation
(`layout()` collapses hard `\n` newlines). A skipped test proves nothing; a
test that runs where it *can* run proves the central claim.

**Tradeoffs.** The browser project needs a Chromium download (~92MB) and adds
~30s to CI. Acceptable for the one test that justifies the whole library.

---

## 3. CSS Modules + a `--c` custom property, not Tailwind or inline styles

**Context.** Components render in two accent colors (red "without" / green
"with"), with many alpha tints derived from that color.

**Decision.** Static layout/typography live in `.module.css`; the per-pane
color flows down as a single `--c` CSS custom property and tints are built with
`color-mix()`. State variants use `data-*` attributes.

**Alternatives weighed.** Tailwind would still need inline styles for the
runtime-computed alpha colors (no static class for `${color}15`), so it
wouldn't actually remove the dynamic-style problem. Plain global CSS loses
scoping. CSS Modules is zero-dependency, Vite-native, and the `--c` indirection
means one class set serves both columns.

**Tradeoffs.** `color-mix` rounds hex-alpha to whole percents (≈0.2% drift on
subtle tints — invisible) and needs a modern browser. Fine for a demo.

---

## 4. A single measurement boundary and an explicit height contract

**Decision.** `src/pretext.ts` is the only module that touches
`@chenglou/pretext`; the rest of the app and the tests depend on it. `layout()`
returns text height only, so a rendered bubble's height is always
`layout() + 16` (8px top/bottom padding). That `+16` is defined once and the
browser test asserts it.

**Why.** A single seam makes the library swappable and the tests mockable, and
pinning the padding contract in one place stops the render and the prediction
from silently drifting (they had — the font size and a line-height divisor were
both off before this work).

---

## What I would do differently at real scale

This is a focused demo; a production version would need more, and naming it is
part of the point:

- **Virtualize the message list.** Pretext's killer feature is knowing every
  height up front — that enables windowing 10k+ messages without measuring the
  off-screen ones. The demo renders all nodes; a real app must not.
- **Decouple measurement from React render.** Right now timing lives inside
  component callbacks. At scale it belongs in a worker or a measurement service
  so layout never blocks the main thread.
- **Resilience and a11y.** Loading/empty/error states, keyboard navigation,
  `prefers-reduced-motion`, and a stable layout under font-loading races.
- **Observability.** Real per-frame timing (Long Animation Frames API) instead
  of a synthetic benchmark, with a perf budget enforced in CI.
