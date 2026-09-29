import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Base color/size match the brand cursor trail (Next Wave page).
const DEFAULT_COLORS = ["219, 254, 2"]; // #DBFE02

function hexToRgbString(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function parseRgb(s: string): [number, number, number] {
  const [r, g, b] = s.split(",").map((n) => parseInt(n.trim(), 10));
  return [r, g, b];
}

function lerpRgb(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseRgb(a);
  const [br, bg, bb] = parseRgb(b);
  return `${Math.round(ar + (br - ar) * t)}, ${Math.round(ag + (bg - ag) * t)}, ${Math.round(ab + (bb - ab) * t)}`;
}

// How long the trail spends easing from one palette color into the next.
const CYCLE_SEGMENT_MS = 3000;

const SETTINGS = {
  idle: { size: 26, lifetime: 1600, minInterval: 30 },
  drag: { size: 16, lifetime: 850, minInterval: 12 },
  burst: { count: 14, size: 12, minDist: 20, maxDist: 60, lifetime: 700 },
  ring: { lifetime: 550, maxRadius: 46 },
  dragThreshold: 6,
  maxActive: 500,
};

type Circle = {
  x: number;
  y: number;
  born: number;
  size: number;
  life: number;
  color: string;
  vx?: number;
  vy?: number;
};

type Ring = { x: number; y: number; born: number; color: string };

export default function DropletCursor({
  colors,
  enableBurst = true,
}: { colors?: string[]; enableBurst?: boolean } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Rendered through a portal on document.body so the fixed canvas is
  // positioned against the real viewport — not against an ancestor that
  // establishes a containing block via `transform` (the page-transition
  // wrapper does), which otherwise stretches the trail vertically.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = (colors && colors.length > 0 ? colors : DEFAULT_COLORS).map(hexToRgbString);
    function nextColor() {
      if (palette.length === 1) return palette[0];
      const segment = (performance.now() / CYCLE_SEGMENT_MS) % palette.length;
      const idx = Math.floor(segment);
      const t = segment - idx;
      return lerpRgb(palette[idx], palette[(idx + 1) % palette.length], t);
    }

    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    const circles: Circle[] = [];
    const rings: Ring[] = [];

    function pushCircle(c: Circle) {
      circles.push(c);
      if (circles.length > SETTINGS.maxActive) circles.splice(0, circles.length - SETTINGS.maxActive);
    }

    let lastSpawn = 0;
    function spawnTrail(x: number, y: number, mode: "idle" | "drag") {
      const cfg = SETTINGS[mode];
      const now = performance.now();
      if (now - lastSpawn < cfg.minInterval) return;
      lastSpawn = now;
      pushCircle({ x, y, born: now, size: cfg.size, life: cfg.lifetime, color: nextColor() });
    }

    function spawnBurst(x: number, y: number) {
      rings.push({ x, y, born: performance.now(), color: nextColor() });
      for (let i = 0; i < SETTINGS.burst.count; i++) {
        const angle = (Math.PI * 2 * i) / SETTINGS.burst.count + Math.random() * 0.4;
        const dist = SETTINGS.burst.minDist + Math.random() * (SETTINGS.burst.maxDist - SETTINGS.burst.minDist);
        pushCircle({
          x,
          y,
          born: performance.now(),
          size: SETTINGS.burst.size,
          life: SETTINGS.burst.lifetime,
          color: nextColor(),
          vx: Math.cos(angle) * dist,
          vy: Math.sin(angle) * dist,
        });
      }
    }

    let isDown = false;
    let dragging = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;

    function handleMove(x: number, y: number) {
      lastX = x;
      lastY = y;
      if (isDown) {
        if (!dragging && Math.hypot(x - downX, y - downY) > SETTINGS.dragThreshold) {
          dragging = true;
        }
        if (dragging) spawnTrail(x, y, "drag");
      } else {
        spawnTrail(x, y, "idle");
      }
    }

    function handleDown(x: number, y: number) {
      isDown = true;
      dragging = false;
      downX = x;
      downY = y;
      lastX = x;
      lastY = y;
    }

    function handleUp() {
      if (enableBurst && isDown && !dragging) spawnBurst(lastX, lastY);
      isDown = false;
      dragging = false;
    }

    function onMove(e: MouseEvent) {
      handleMove(e.clientX, e.clientY);
    }
    function onDown(e: MouseEvent) {
      handleDown(e.clientX, e.clientY);
    }
    function onUp() {
      handleUp();
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      handleMove(t.clientX, t.clientY);
    }
    // No touch, cada toque gera um "ripple" (anel + splash curto) como feedback,
    // e a trilha segue o dedo. Tudo tem vida curta, então nada fica travado no
    // último toque — some sozinho ~600ms depois de levantar o dedo.
    function touchRipple(x: number, y: number) {
      const now = performance.now();
      rings.push({ x, y, born: now, color: nextColor() });
      pushCircle({ x, y, born: now, size: 22, life: 600, color: nextColor() });
    }
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      handleDown(t.clientX, t.clientY);
      touchRipple(t.clientX, t.clientY);
    }
    function onTouchEnd() {
      handleUp();
      isDown = false;
      dragging = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    let raf = 0;
    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const now = performance.now();
      ctx!.clearRect(0, 0, w, h);

      for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i];
        const age = now - c.born;
        if (age >= c.life) {
          circles.splice(i, 1);
          continue;
        }
        const t = age / c.life;
        const alpha = 1 - t;
        const radius = (c.size / 2) * (1 - t * 0.3);
        const x = c.vx ? c.x + c.vx * (1 - Math.pow(1 - t, 2)) : c.x;
        const y = c.vy ? c.y + c.vy * (1 - Math.pow(1 - t, 2)) : c.y;
        ctx!.fillStyle = `rgba(${c.color}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        const age = now - r.born;
        if (age >= SETTINGS.ring.lifetime) {
          rings.splice(i, 1);
          continue;
        }
        const t = age / SETTINGS.ring.lifetime;
        const radius = SETTINGS.ring.maxRadius * (1 - Math.pow(1 - t, 2));
        const alpha = 1 - t;
        ctx!.strokeStyle = `rgba(${r.color}, ${alpha})`;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [mounted, colors, enableBurst]);

  if (!mounted) return null;
  return createPortal(<canvas ref={canvasRef} />, document.body);
}
