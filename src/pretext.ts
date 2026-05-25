// Pretext simulation — two-phase text height calculation.
// Real lib: npm install @chenglou/pretext

export interface PreparedText {
  words: string[];
  widths: Map<string, number>;
  spaceWidth: number;
  font: string;
}

function createCtx(): CanvasRenderingContext2D | null {
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const c = new OffscreenCanvas(1, 1);
      const ctx = c.getContext("2d");
      if (ctx) return ctx as unknown as CanvasRenderingContext2D;
    }
    if (typeof document !== "undefined") {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (ctx) return ctx;
    }
  } catch {
    /* fall through */
  }
  return null;
}

const sharedCtx = createCtx();

const wordWidthCache = new Map<string, number>();

// Fallback estimator when no Canvas 2D context is available (e.g. happy-dom).
// Parses `<size>px ...` from the font string and approximates width per char.
function estimateWordWidth(word: string, font: string): number {
  const match = /(\d+(?:\.\d+)?)px/.exec(font);
  const size = match ? parseFloat(match[1]) : 16;
  return word.length * size * 0.55;
}

export function getWordWidth(word: string, font: string): number {
  const key = `${font}::${word}`;
  if (!wordWidthCache.has(key)) {
    if (sharedCtx) {
      sharedCtx.font = font;
      wordWidthCache.set(key, sharedCtx.measureText(word).width);
    } else {
      wordWidthCache.set(key, estimateWordWidth(word, font));
    }
  }
  return wordWidthCache.get(key)!;
}

const pretextCache = new Map<string, PreparedText>();

export function pretextPrepare(text: string, font: string): PreparedText {
  const key = `${font}::${text}`;
  if (pretextCache.has(key)) return pretextCache.get(key)!;
  if (sharedCtx) sharedCtx.font = font;
  const words = text.split(" ");
  const widths = new Map<string, number>();
  for (const w of words) {
    if (!widths.has(w)) widths.set(w, getWordWidth(w, font));
  }
  const result: PreparedText = {
    words,
    widths,
    spaceWidth: getWordWidth(" ", font),
    font,
  };
  pretextCache.set(key, result);
  return result;
}

export function pretextLayout(
  prepared: PreparedText,
  containerWidth: number,
  lineHeight = 24,
): number {
  const { words, widths, spaceWidth } = prepared;
  let lines = 0,
    lineW = 0;
  for (const w of words) {
    const ww = (widths.get(w) ?? 8) + spaceWidth;
    if (lineW + ww > containerWidth && lineW > 0) {
      lines++;
      lineW = ww;
    } else {
      lineW += ww;
    }
  }
  if (lineW > 0) lines++;
  return Math.max(lines * lineHeight, lineHeight);
}

// Convenience: prepare + layout in one call.
export function layout(
  text: string,
  containerWidth: number,
  font: string,
  lineHeight = 24,
): number {
  return pretextLayout(pretextPrepare(text, font), containerWidth, lineHeight);
}

export function clearPretextCache(): void {
  pretextCache.clear();
}

export function domMeasureHeight(
  text: string,
  containerWidth: number,
  font: string,
): number {
  const div = document.createElement("div");
  div.style.cssText = `position:fixed;visibility:hidden;top:-9999px;width:${containerWidth}px;font:${font};padding:8px 12px;word-break:break-word;white-space:pre-wrap;box-sizing:border-box;line-height:24px;`;
  div.textContent = text;
  document.body.appendChild(div);
  const h = div.getBoundingClientRect().height;
  document.body.removeChild(div);
  return h;
}
