/**
 * @file CursorGlow.tsx
 * Subtle pointer-follow light for desktop mouse users.
 * - Only runs for fine pointers that can hover (not touch) and when reduced motion is not requested.
 * - Purely decorative: pointer-events none, aria-hidden, native cursor is untouched.
 * - One rAF loop moves two fixed layers with transform only (a soft glow and a small ring).
 */
import React, { useEffect, useRef, useState } from 'react';

export const CursorGlow: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener('change', update);
    reduce.addEventListener('change', update);
    return () => {
      fine.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const glow = glowRef.current;
    const ring = ringRef.current;
    if (!glow || !ring) return;

    let tx = -1000, ty = -1000;
    let gx = tx, gy = ty, rx = tx, ry = ty;
    let raf = 0;
    let visible = false;
    let interactive = false;

    const setVisible = (v: boolean) => {
      if (v === visible) return;
      visible = v;
      glow.style.opacity = v ? '1' : '0';
      ring.style.opacity = v ? '1' : '0';
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX;
      ty = e.clientY;
      const el = e.target as Element | null;
      const hot = !!el?.closest?.('button, a, [role="button"], select, label');
      if (hot !== interactive) {
        interactive = hot;
        ring.style.setProperty('--ring-scale', hot ? '1.7' : '1');
      }
      if (!visible) {
        gx = rx = tx;
        gy = ry = ty;
        setVisible(true);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => setVisible(false);

    const tick = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      rx += (tx - rx) * 0.28;
      ry += (ty - ry) * 0.28;
      glow.style.transform = `translate3d(${gx - 160}px, ${gy - 160}px, 0)`;
      ring.style.transform = `translate3d(${rx - 14}px, ${ry - 14}px, 0) scale(var(--ring-scale, 1))`;
      const settled = Math.abs(tx - gx) < 0.3 && Math.abs(ty - gy) < 0.3 && Math.abs(tx - rx) < 0.3 && Math.abs(ty - ry) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-80 w-80 rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(15,118,110,0.22) 0%, rgba(15,118,110,0.10) 40%, rgba(15,118,110,0) 70%)',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-7 w-7 rounded-full border border-teal-700/50 opacity-0 transition-opacity duration-300"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
};
