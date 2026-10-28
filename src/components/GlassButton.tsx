/**
 * @file GlassButton.tsx
 * Light Glass Button (Originkit), adapted for this app.
 *
 * Kept from the supplied component: backdrop-blur glass tint, pointer-following light,
 * gradient glass stroke with a travelling conic highlight, settle-then-stop animation loop.
 *
 * Adapted for this app (all deliberate):
 * - Renders a real <button> that forwards ref, type, disabled, onClick, aria-* and className.
 *   The supplied version hard-coded type="button" and dropped all of these, which would break submit buttons.
 * - Takes children instead of a label string, so icons and layout classes keep working.
 * - Tones with enough tint to keep text readable (the supplied white-on-16%-white is unreadable on a light UI).
 * - Blur lowered from 20px to 12px and stroke width to 1.5px for compact controls and cheap phones.
 * - Pointer light is off for touch, reduced motion and disabled buttons. Reduced transparency gets a solid look.
 */

import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type GlassTone =
  | 'teal'
  | 'blue'
  | 'amber'
  | 'rose'
  | 'dark'
  | 'neutral'
  | 'tealSoft'
  | 'roseSoft'
  | 'amberSoft';

type ToneDef = { fill: string; alpha: number; text: string };

/** Text and fill pairs checked for contrast (see PROGRESS notes). Alpha is the glass tint strength. */
const TONES: Record<GlassTone, ToneDef> = {
  teal: { fill: '#115e59', alpha: 0.9, text: '#ffffff' },
  blue: { fill: '#1e40af', alpha: 0.9, text: '#ffffff' },
  amber: { fill: '#92400e', alpha: 0.9, text: '#ffffff' },
  rose: { fill: '#9f1239', alpha: 0.9, text: '#ffffff' },
  dark: { fill: '#1e293b', alpha: 0.92, text: '#ffffff' },
  neutral: { fill: '#ffffff', alpha: 0.7, text: '#0f172a' },
  tealSoft: { fill: '#ccfbf1', alpha: 0.8, text: '#134e4a' },
  roseSoft: { fill: '#ffe4e6', alpha: 0.8, text: '#881337' },
  amberSoft: { fill: '#fef3c7', alpha: 0.8, text: '#451a03' },
};

const BLUR = 12;
const STROKE_BRIGHTNESS = 140;
const LIGHT_FADE = 0.6;
const AIM_BLEND = 0.18;
const SMOOTHNESS = 65;
const LIGHT_SIZE = 40;
const LIGHT_INTENSITY = 100;

const LIGHT_FALLOFF: Array<[number, number]> = [
  [0, 1],
  [0.08, 0.95],
  [0.18, 0.85],
  [0.3, 0.7],
  [0.42, 0.54],
  [0.55, 0.38],
  [0.68, 0.24],
  [0.8, 0.13],
  [0.9, 0.06],
  [0.96, 0.02],
  [1, 0],
];

const radiusFromPercent = (w: number, h: number, pct: number) =>
  (Math.min(w, h) / 2) * (Math.max(0, Math.min(100, pct)) / 100);

const lightRadius = (w: number, h: number, pct: number) =>
  Math.max(w, h) * (Math.max(0, Math.min(100, pct)) / 100);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function supportsBackdrop(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) return true;
  return (
    CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)')
  );
}

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.max(0, Math.min(1, a))})`;

const RING_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  maskClip: 'border-box, content-box',
  maskComposite: 'exclude',
  WebkitMaskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  WebkitMaskClip: 'border-box, content-box',
  WebkitMaskComposite: 'xor',
} as React.CSSProperties;

const LIGHT_RGB: RGB = { r: 255, g: 255, b: 255 };
const LIGHT_ALPHA = 0.45;

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: GlassTone;
  /** Corner radius as a percent of half the shorter side (supplied component semantics). */
  rounded?: number;
  /** Classes for the outer wrapper (width and display). Everything else in className goes on the button. */
  wrapperClassName?: string;
  /** Glass ring width in px. */
  strokeWidth?: number;
}

function usePrefs() {
  const [prefs, setPrefs] = useState({ glassy: true, motion: true, fine: true, solid: false });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mqs = {
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)'),
      fine: window.matchMedia('(pointer: fine)'),
      transp: window.matchMedia('(prefers-reduced-transparency: reduce)'),
    };
    const read = () =>
      setPrefs({
        glassy: supportsBackdrop(),
        motion: !mqs.reduce.matches,
        fine: mqs.fine.matches,
        solid: mqs.transp.matches,
      });
    read();
    const list = Object.values(mqs);
    list.forEach((m) => m.addEventListener?.('change', read));
    return () => list.forEach((m) => m.removeEventListener?.('change', read));
  }, []);
  return prefs;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  {
    tone = 'neutral',
    rounded = 30,
    wrapperClassName = '',
    strokeWidth = 1.5,
    className = '',
    style,
    type = 'button',
    disabled,
    children,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    ...rest
  },
  forwardedRef
) {
  const def = TONES[tone];
  const prefs = usePrefs();
  const glassy = prefs.glassy && !prefs.solid;
  const lightOn = prefs.motion && prefs.fine && !disabled;

  const scope = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLButtonElement | null>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  const strokeRef = useRef<HTMLSpanElement>(null);

  const setRefs = useCallback(
    (el: HTMLButtonElement | null) => {
      glassRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    },
    [forwardedRef]
  );

  const [radiusBox, setRadiusBox] = useState({ w: 0, h: 0 });
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const read = () =>
      setRadiusBox((prev) =>
        prev.w === el.offsetWidth && prev.h === el.offsetHeight ? prev : { w: el.offsetWidth, h: el.offsetHeight }
      );
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const radiusPx = radiusFromPercent(radiusBox.w, radiusBox.h, rounded);

  const tgt = useRef({ x: 0.5, y: 0.5, on: 0 });
  const cur = useRef({ x: 0.5, y: 0.5, on: 0 });
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const box = useRef({ w: 0, h: 0 });

  useEffect(() => {
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  useEffect(() => {
    const el = glassRef.current;
    const root = scope.current;
    if (!el || !root) return;
    const write = () => {
      const r = el.getBoundingClientRect();
      box.current = { w: r.width, h: r.height };
      const R = lightRadius(r.width, r.height, LIGHT_SIZE);
      root.style.setProperty('--lr', `${R.toFixed(1)}px`);
    };
    write();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stop the loop and clear the light when light becomes unavailable (disabled, touch, reduced motion).
  useEffect(() => {
    if (lightOn) return;
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    tgt.current.on = 0;
    cur.current.on = 0;
    if (lightRef.current) lightRef.current.style.opacity = '0';
    if (strokeRef.current) strokeRef.current.style.opacity = '0';
  }, [lightOn]);

  const paint = () => {
    const root = scope.current;
    const c = cur.current;
    if (root) {
      root.style.setProperty('--mx', `${(c.x * 100).toFixed(2)}%`);
      root.style.setProperty('--my', `${(c.y * 100).toFixed(2)}%`);
    }
    const amt = LIGHT_INTENSITY / 100;
    if (lightRef.current) lightRef.current.style.opacity = (c.on * amt).toFixed(3);

    const el = strokeRef.current;
    if (el) {
      const w = box.current.w;
      const h = box.current.h;
      const d = clamp01(Math.max(Math.abs(c.x - 0.5), Math.abs(c.y - 0.5)) * 2);
      let ang = 0;
      let half = 30;
      if (w > 0 && h > 0) {
        const px = c.x * w;
        const py = c.y * h;
        const s = Math.max(1, Math.min(w, h) * AIM_BLEND);
        const sides: Array<[number, number, number]> = [
          [px, 0, py],
          [w - px, w, py],
          [py, px, 0],
          [h - py, px, h],
        ];
        const near = Math.min(...sides.map((v) => v[0]));
        let wt = 0;
        let ax = 0;
        let ay = 0;
        for (const [dist, sx, sy] of sides) {
          const k = Math.exp(-(dist - near) / s);
          wt += k;
          ax += k * sx;
          ay += k * sy;
        }
        const ex = ax / wt - w / 2;
        const ey = ay / wt - h / 2;
        ang = (Math.atan2(ey, ex) * 180) / Math.PI + 90;
        const L = Math.max(1, Math.hypot(ex, ey));
        const reach = lightRadius(w, h, LIGHT_SIZE) * LIGHT_FADE;
        half = (Math.atan(reach / L) * 180) / Math.PI;
      }
      el.style.setProperty('--la', ang.toFixed(1));
      el.style.setProperty('--lw', Math.max(3, Math.min(70, half)).toFixed(1));
      el.style.opacity = clamp01(c.on * d * d * amt).toFixed(3);
    }
  };

  const tick = (t: number) => {
    const c = cur.current;
    const g = tgt.current;
    const dt = last.current ? Math.min(0.05, (t - last.current) / 1000) : 1 / 60;
    last.current = t;
    const s = SMOOTHNESS / 100;
    const per = 0.5 - s * 0.46;
    const k = 1 - Math.pow(1 - per, dt * 60);
    c.x += (g.x - c.x) * k;
    c.y += (g.y - c.y) * k;
    c.on += (g.on - c.on) * k;
    paint();
    const settled =
      Math.abs(g.x - c.x) < 0.001 && Math.abs(g.y - c.y) < 0.001 && Math.abs(g.on - c.on) < 0.002;
    // The loop stops as soon as the light has faded out, so idle buttons cost nothing.
    if (settled && g.on === 0) {
      c.x = g.x;
      c.y = g.y;
      c.on = 0;
      paint();
      raf.current = null;
      last.current = 0;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (raf.current == null) {
      last.current = 0;
      raf.current = requestAnimationFrame(tick);
    }
  };

  const trackPointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = glassRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    tgt.current.x = (e.clientX - r.left) / r.width;
    tgt.current.y = (e.clientY - r.top) / r.height;
    kick();
  };

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e);
    if (lightOn) trackPointer(e);
  };

  const handleEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(e);
    if (!lightOn || e.pointerType === 'touch') return;
    const el = glassRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        tgt.current.x = x;
        tgt.current.y = y;
        if (cur.current.on === 0) {
          cur.current.x = x;
          cur.current.y = y;
        }
      }
    }
    tgt.current.on = 1;
    kick();
  };

  const handleLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(e);
    if (!lightOn) return;
    trackPointer(e);
    tgt.current.on = 0;
    kick();
  };

  const backdrop = glassy ? `blur(${BLUR}px) saturate(160%) brightness(108%)` : 'none';
  const fillRGB = hexToRgb(def.fill);
  // Without backdrop blur the tint carries the whole look, so make it nearly solid.
  const glassBackground = rgba(fillRGB, glassy ? def.alpha : Math.max(def.alpha, 0.97));

  const softStops = (peak: number) =>
    LIGHT_FALLOFF.map(([at, k]) => `${rgba(LIGHT_RGB, peak * k)} ${Math.round(at * 100)}%`).join(', ');
  const lightGradient = [
    `radial-gradient(circle var(--lr, 0px) at var(--mx) var(--my), ${softStops(LIGHT_ALPHA)})`,
    `radial-gradient(circle calc(var(--lr, 0px) * 1.9) at var(--mx) var(--my), ${softStops(LIGHT_ALPHA * 0.34)})`,
  ].join(', ');

  const strokePx = Math.max(0, Math.round(strokeWidth * 2) / 2);
  const strokeBackdrop = glassy && prefs.fine ? `saturate(220%) brightness(${STROKE_BRIGHTNESS}%)` : 'none';
  const strokeBase = `linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))`;
  const strokeLightGradient = `conic-gradient(from calc((var(--la, 0) - var(--lw, 30)) * 1deg), ${rgba(LIGHT_RGB, 0)} 0deg, ${rgba(LIGHT_RGB, 1)} calc(var(--lw, 30) * 1deg), ${rgba(LIGHT_RGB, 0)} calc(var(--lw, 30) * 2deg))`;

  const hasItems = /(^|\s)items-/.test(className);
  const hasJustify = /(^|\s)justify-/.test(className);
  const layout = `${hasItems ? '' : 'items-center'} ${hasJustify ? '' : 'justify-center'}`.trim();
  const wrapperDisplay = /(^|\s)(inline-flex|flex)(\s|$)/.test(wrapperClassName) ? '' : 'inline-flex';

  return (
    <div
      ref={scope}
      className={`relative ${wrapperDisplay} ${wrapperClassName}`.trim()}
      style={{
        minWidth: 40,
        minHeight: 32,
        borderRadius: radiusPx,
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.14)',
        ['--mx' as string]: '50%',
        ['--my' as string]: '50%',
      }}
    >
      <button
        {...rest}
        ref={setRefs}
        type={type}
        disabled={disabled}
        onPointerMove={handleMove}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        className={`relative z-[1] flex flex-1 overflow-hidden ${layout} ${className} ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
          disabled ? 'opacity-60' : ''
        }`}
        style={{
          boxSizing: 'border-box',
          border: 'none',
          borderRadius: radiusPx,
          color: def.text,
          background: glassBackground,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          ...style,
        }}
      >
        {lightOn && (
          <span
            ref={lightRef}
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              opacity: 0,
              pointerEvents: 'none',
              borderRadius: radiusPx,
              background: lightGradient,
              mixBlendMode: 'screen',
            }}
          />
        )}
        {children}
      </button>

      {strokePx > 0 && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -strokePx,
            borderRadius: radiusPx + strokePx,
            padding: strokePx,
            background: strokeBase,
            backdropFilter: strokeBackdrop,
            WebkitBackdropFilter: strokeBackdrop,
            pointerEvents: 'none',
            zIndex: 3,
            ...RING_MASK,
          }}
        />
      )}

      {strokePx > 0 && lightOn && (
        <span
          ref={strokeRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: -strokePx,
            borderRadius: radiusPx + strokePx,
            padding: strokePx,
            background: strokeLightGradient,
            opacity: 0,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 4,
            ['--la' as string]: '0',
            ['--lw' as string]: '30',
            ...RING_MASK,
          }}
        />
      )}
    </div>
  );
});

export default GlassButton;
