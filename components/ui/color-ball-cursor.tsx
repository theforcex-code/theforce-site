'use client';

// Color-cycling ball cursor for the Next Wave page.
// A flat, solid dot (no glow — per THE FORCE identity) that follows the
// pointer and eases continuously through the brand accent palette.
// Rendered via a portal on document.body so a transformed ancestor can't
// capture its fixed positioning; pointer-events:none so it never eats clicks.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Next Wave pillar accents — turquoise → coral → sunny → lavender.
const FORCE_PALETTE = ['#1FC8B4', '#FF6F91', '#FFC93C', '#9B7EDE'];

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface ColorBallCursorProps {
  /** Hex colors the ball eases through, in order. */
  colors?: string[];
  /** Diameter in px. */
  size?: number;
  /** Milliseconds to ease from one color to the next. */
  segmentMs?: number;
}

export function ColorBallCursor({
  colors = FORCE_PALETTE,
  size = 22,
  segmentMs = 2200,
}: ColorBallCursorProps = {}) {
  const ballRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const ball = ballRef.current;
    if (!ball) return;

    const rgbs = colors.map(hexToRgb);
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...mouse };
    let visible = false;
    let pressed = false;
    let primed = false;
    const start = performance.now();
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!primed) {
        primed = true;
        pos.x = mouse.x;
        pos.y = mouse.y;
      }
      visible = true;
    };
    const onLeave = () => { visible = false; };
    const onEnter = () => { visible = true; };
    const onDown = () => { pressed = true; };
    const onUp = () => { pressed = false; };

    const tick = (now: number) => {
      // Ease toward the pointer; converges exactly on the target at rest, so
      // the ball sits on the real click point whenever the mouse stops.
      pos.x = lerp(pos.x, mouse.x, 0.35);
      pos.y = lerp(pos.y, mouse.y, 0.35);

      // Continuous color cycle across the palette. Math.max(0, …) evita tempo
      // negativo: o timestamp do 1º frame do RAF pode vir ANTES do performance.now()
      // capturado em `start` (o efeito rodou no meio do frame) → seg/i negativo →
      // rgbs[-1] === undefined → crash. O clamp garante i sempre em [0, length-1].
      const seg = (Math.max(0, now - start) / segmentMs) % rgbs.length;
      const i = Math.floor(seg);
      const t = seg - i;
      const a = rgbs[i];
      const b = rgbs[(i + 1) % rgbs.length];
      if (!a || !b) { raf = requestAnimationFrame(tick); return; } // nunca crasha
      const r = Math.round(lerp(a[0], b[0], t));
      const g = Math.round(lerp(a[1], b[1], t));
      const bl = Math.round(lerp(a[2], b[2], t));

      const scale = (visible ? 1 : 0) * (pressed ? 0.7 : 1);
      ball.style.background = `rgb(${r}, ${g}, ${bl})`;
      ball.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) scale(${scale})`;
      ball.style.opacity = visible ? '1' : '0';

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('blur', onUp);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('blur', onUp);
    };
  }, [mounted, colors, size, segmentMs]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={ballRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        transition: 'opacity .25s ease, transform .12s ease-out',
        willChange: 'transform, background',
      }}
    />,
    document.body
  );
}
