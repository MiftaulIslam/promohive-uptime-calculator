'use client';

import { useEffect, useRef, useState } from 'react';
import { calm } from './client';

const COLS = 24;
const ROWS = 30;
const CELLS = COLS * ROWS;
const GAP = 2;
const RADIUS = 2;
const STAGGER_MS = 300;
const FADE_MS = 180;
const ease = (p: number) => 1 - (1 - p) ** 4;

/**
 * One hour cell, indexed by hours before the end of the month.
 * h, e, eo are the target; gh, ge, geo are what is drawn, which keep their last value while a cell fades out.
 */
interface Cell { h: number; e: number; eo: number; gh: number; ge: number; geo: number; oh: number; oe: number; fromH: number; fromE: number; t0: number; delay: number }

function createPainter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(canvas);
  const honey = css.getPropertyValue('--honey').trim();
  const ember = css.getPropertyValue('--ember').trim();
  const cells: Cell[] = Array.from({ length: CELLS }, () => ({ h: 0, e: 0, eo: 0, gh: 0, ge: 0, geo: 0, oh: 0, oe: 0, fromH: 0, fromE: 0, t0: -1, delay: 0 }));
  let w = 0, h = 0, cw = 0, ch = 0, sx = 1, sy = 1;
  let honeyH = 0, emberH = 0, drawn = false, raf = 0;

  const fillCell = (x: number, y: number, frac: number, offset: number, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, RADIUS);
    if (frac >= 1) { ctx.fill(); return; }
    ctx.save();
    ctx.clip();
    ctx.fillRect(x + cw * (1 - offset - frac), y, cw * frac, ch);
    ctx.restore();
  };

  const paint = () => {
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let k = 0; k < CELLS; k += 1) {
      const c = cells[k];
      if (c.oh <= 0 && c.oe <= 0) continue;
      const i = CELLS - 1 - k;
      const x = (i % COLS) * (cw + GAP), y = Math.floor(i / COLS) * (ch + GAP);
      if (c.oe > 0 && c.ge > 0) fillCell(x, y, c.ge, c.geo, ember, c.oe);
      if (c.oh > 0 && c.gh > 0) fillCell(x, y, c.gh, 0, honey, c.oh);
    }
  };

  const tick = (now: number) => {
    let busy = false;
    for (const c of cells) {
      if (c.t0 < 0) continue;
      const p = (now - c.t0 - c.delay) / FADE_MS;
      if (p <= 0) { busy = true; continue; }
      const onH = c.h > 0 ? 1 : 0, onE = c.e > 0 ? 1 : 0;
      if (p >= 1) { c.oh = onH; c.oe = onE; c.t0 = -1; continue; }
      const q = ease(p);
      c.oh = c.fromH + (onH - c.fromH) * q;
      c.oe = c.fromE + (onE - c.fromE) * q;
      busy = true;
    }
    paint();
    raf = busy ? requestAnimationFrame(tick) : 0;
  };

  /** Brings every cell to the current budget and says whether any cell started to fade. */
  const apply = (animate: boolean) => {
    const minFrac = 2 / cw; // keeps a sub-pixel sliver findable; the label says when this applies
    const total = Math.min(CELLS, honeyH + emberH);
    const gains: { k: number; h: number; e: number; eo: number }[] = [];
    const drops: typeof gains = [];
    for (let k = 0; k < CELLS; k += 1) {
      let nh = Math.max(0, Math.min(k + 1, honeyH) - k);
      if (k === 0 && honeyH > 0) nh = Math.max(nh, minFrac);
      const a = Math.max(k, honeyH), b = Math.min(k + 1, total);
      const ne = b > a ? b - a : 0;
      const neo = ne > 0 ? a - k : 0;
      const prev = cells[k];
      if (prev.h === nh && prev.e === ne && prev.eo === neo) continue;
      (nh + ne >= prev.h + prev.e ? gains : drops).push({ k, h: nh, e: ne, eo: neo });
    }
    // Light runs backwards through the month; dark retreats towards its end.
    drops.reverse();
    const now = performance.now();
    for (const list of [gains, drops]) {
      const spread = animate ? Math.min(STAGGER_MS, list.length * 7) : 0;
      list.forEach((item, i) => {
        const c = cells[item.k];
        c.h = item.h; c.e = item.e; c.eo = item.eo;
        if (item.h > 0) c.gh = item.h;
        if (item.e > 0) { c.ge = item.e; c.geo = item.eo; }
        if (animate) {
          c.fromH = c.oh; c.fromE = c.oe; c.t0 = now;
          c.delay = list.length > 1 ? Math.round((i / (list.length - 1)) * spread) : 0;
        } else {
          c.oh = item.h > 0 ? 1 : 0; c.oe = item.e > 0 ? 1 : 0; c.t0 = -1;
        }
      });
    }
    return gains.length + drops.length > 0;
  };

  return {
    /** Takes the box in CSS pixels and in device pixels, and returns the cell width. */
    size(cssW: number, cssH: number, devW: number, devH: number) {
      if (cssW === w && cssH === h && devW === canvas.width && devH === canvas.height) return cw;
      w = cssW; h = cssH;
      cw = (w + GAP) / COLS - GAP;
      ch = (h + GAP) / ROWS - GAP;
      canvas.width = devW; canvas.height = devH;
      sx = devW / w; sy = devH / h;
      apply(false);
      paint();
      return cw;
    },
    draw(nextHoney: number, nextEmber: number) {
      honeyH = nextHoney; emberH = nextEmber;
      const animate = drawn && !calm();
      drawn = true;
      if (!w) return; // the first size() applies this
      if (apply(animate) && animate) { if (!raf) raf = requestAnimationFrame(tick); }
      else paint();
    },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
}

export default function MonthGrid({ honeyH, emberH, ok, month, over }: { honeyH: number; emberH: number; ok: boolean; month: string; over: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const painterRef = useRef<ReturnType<typeof createPainter>>(null);
  const [cw, setCw] = useState(32);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const painter = createPainter(canvas);
    painterRef.current = painter;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width) return;
      const dev = entry.devicePixelContentBoxSize?.[0];
      setCw(painter.size(width, height, dev ? dev.inlineSize : Math.round(width * devicePixelRatio), dev ? dev.blockSize : Math.round(height * devicePixelRatio)));
    });
    // Reports device pixels directly, and also fires when the window moves to a screen with another scale. Not in Safari.
    try { ro.observe(canvas, { box: 'device-pixel-content-box' }); } catch { ro.observe(canvas); }
    return () => { ro.disconnect(); painter.stop(); painterRef.current = null; };
  }, []);

  useEffect(() => { painterRef.current?.draw(honeyH, emberH); }, [honeyH, emberH]);

  const thin = ok && honeyH * cw < 1;
  const label = ok
    ? `A month of 720 hour cells, ${month} lit from the end${over ? `, plus ${over} the chain uses beyond the target` : ''}`
    : 'A month of 720 hour cells, none lit';

  return (
    <figure className="month">
      <figcaption className="month__cap">A 30-day month, drawn to scale<span className="cap-long">: days down, hours across</span>, one cell an hour</figcaption>
      <div className="plot">
        <div className="plot__hours" aria-hidden="true">
          {[0, 6, 12, 18].map((c) => <span key={c} style={{ '--c': c }}>{String(c).padStart(2, '0')}</span>)}
        </div>
        <div className="plot__days" aria-hidden="true">
          {[1, 5, 10, 15, 20, 25, 30].map((d) => <span key={d} style={{ '--r': d - 1 }}>{d}</span>)}
        </div>
        <div className="cells"><canvas ref={canvasRef} role="img" aria-label={label} /></div>
        <div className={ok ? 'lead' : 'lead is-off'} aria-hidden="true" style={{ '--hf': honeyH }}>
          <i className="lead__line" />
          <p className="lead__label">
            <span className="lead__over" hidden={!over}>{over ? `${over} over` : ''}</span>
            <span className="lead__allow">{ok ? `${month} allowed${thin ? ', thinner than a pixel here' : ''}` : ''}</span>
          </p>
        </div>
      </div>
    </figure>
  );
}
