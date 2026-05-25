import { Canvas } from "@napi-rs/canvas";

// happy-dom does not provide a working Canvas 2D context, so @chenglou/pretext
// (which depends on `ctx.measureText`) crashes on import. Polyfill
// `globalThis.OffscreenCanvas` with the @napi-rs/canvas implementation so
// pretext can measure text in Node — this lets the layout tests actually run
// instead of skipping all 11 of them.
class OffscreenCanvasShim {
  width: number;
  height: number;
  private impl: Canvas;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.impl = new Canvas(width, height);
  }
  getContext(type: string) {
    if (type !== "2d") return null;
    return this.impl.getContext("2d") as unknown as CanvasRenderingContext2D;
  }
}

// @ts-expect-error - patching a browser global into the Node test env on purpose
globalThis.OffscreenCanvas = OffscreenCanvasShim;
