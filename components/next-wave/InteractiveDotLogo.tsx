import { useEffect, useRef } from "react";

type Dot = {
  restX: number;
  restY: number;
  entryX: number;
  entryY: number;
  delay: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const INTERACTION_RADIUS = 60;
const FLEE_STRENGTH = 60;
const SPRING = 0.14;
const DAMPING = 0.8;
const ENTRY_DURATION = 900;
const ENTRY_MAX_DELAY = 500;

const PAD_X = 170;
const PAD_Y = 140;

const STACK_BREAKPOINT = 640;
const SPLIT_X = 783;
const LINE_GAP = 40;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function InteractiveDotLogo({
  src = "/next-wave-logo.png",
  color = "#171417",
}: {
  src?: string;
  color?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // touch: o logo é escalado pra bem menor (scale pequeno), então o raio de
    // interação em unidades do canvas vira ~12px de tela e fica impossível mexer
    // nos pontos. No toque convertemos raio/força de px-de-tela → canvas (÷ scale).
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let dots: Dot[] = [];
    let paddedW = 0;
    let paddedH = 0;
    let displayW = 0;
    let displayH = 0;
    let scale = 1;
    let raf = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let startTime = 0;

    function resize() {
      if (!paddedW) return;
      const rect = wrap!.getBoundingClientRect();
      displayW = rect.width;
      displayH = rect.height;
      scale = displayW / paddedW;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = displayW * dpr;
      canvas!.height = displayH * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = (e.clientX - rect.left) / scale;
      pointerY = (e.clientY - rect.top) / scale;
    }
    function onLeave() {
      pointerX = -9999;
      pointerY = -9999;
    }
    // no toque: registra o ponto ao encostar e SOLTA (volta os pontos) ao levantar
    // o dedo; no mouse, soltar não reseta (o ponteiro continua ali).
    function onDown(e: PointerEvent) { onMove(e); }
    function onUp(e: PointerEvent) { if (e.pointerType !== "mouse") onLeave(); }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onLeave);
    window.addEventListener("pointerleave", onLeave);

    function step(now: number) {
      ctx!.clearRect(0, 0, displayW, displayH);
      const elapsed = now - startTime;
      // no toque, raio/força vêm de px-de-tela convertidos pro espaço do canvas
      // (÷ scale) — área de toque generosa e os pontos se afastam bem mais.
      const iRadius = coarse ? 90 / (scale || 1) : INTERACTION_RADIUS;
      const iFlee = coarse ? 105 / (scale || 1) : FLEE_STRENGTH;
      const iImpulse = coarse ? 0.11 : 0.08;

      for (const d of dots) {
        const localElapsed = elapsed - d.delay;
        let alpha = 1;

        if (!reduce && localElapsed < ENTRY_DURATION) {
          const raw = Math.max(localElapsed, 0) / ENTRY_DURATION;
          const t = easeOutCubic(raw);
          d.x = d.entryX + (d.restX - d.entryX) * t;
          d.y = d.entryY + (d.restY - d.entryY) * t;
          // invisível antes do próprio delay e faint enquanto ainda longe do lugar,
          // então nunca se vê um ponto "cortado" na borda durante a formação
          alpha = localElapsed < 0 ? 0 : Math.min(1, raw * 1.8);
        } else if (!reduce) {
          const dx = d.x - pointerX;
          const dy = d.y - pointerY;
          const dist = Math.hypot(dx, dy);
          if (dist < iRadius) {
            const force = (1 - dist / iRadius) * iFlee;
            d.vx += (dx / (dist || 1)) * force * iImpulse;
            d.vy += (dy / (dist || 1)) * force * iImpulse;
          }
          d.vx += (d.restX - d.x) * SPRING;
          d.vy += (d.restY - d.y) * SPRING;
          d.vx *= DAMPING;
          d.vy *= DAMPING;
          d.x += d.vx;
          d.y += d.vy;
        } else {
          d.x = d.restX;
          d.y = d.restY;
        }

        // no mobile (empilhado) os pontos ficam um pouco maiores p/ legibilidade
        const dotR = Math.max(d.radius * scale * (stacked ? 1.18 : 1), stacked ? 1.8 : 1.4);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = color;
        ctx!.beginPath();
        ctx!.arc(d.x * scale, d.y * scale, dotR, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      if (!reduce) raf = requestAnimationFrame(step);
    }

    // O logo NUNCA quebra em 2 linhas (é uma marca) — sempre numa linha só,
    // escalada pra caber na largura, inclusive no mobile.
    const stacked = false;

    // padding menor no mobile (sem hover pra os pontos fugirem) => logo maior
    const isNarrow = window.matchMedia("(max-width: 640px)").matches;
    const padX = isNarrow ? 48 : PAD_X;
    const padY = isNarrow ? 40 : PAD_Y;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      const logoW = img.naturalWidth;
      const logoH = img.naturalHeight;

      const off = document.createElement("canvas");
      off.width = logoW;
      off.height = logoH;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, 0, 0);
      const data = offCtx.getImageData(0, 0, logoW, logoH).data;

      const dark = new Uint8Array(logoW * logoH);
      for (let i = 0; i < logoW * logoH; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        dark[i] = a > 100 && (r + g + b) / 3 < 70 ? 1 : 0;
      }

      const visited = new Uint8Array(logoW * logoH);
      const stack: number[] = [];
      const blobs: { cx: number; cy: number; radius: number; minX: number; maxX: number; minY: number; maxY: number }[] =
        [];

      for (let y = 0; y < logoH; y++) {
        for (let x = 0; x < logoW; x++) {
          const startIdx = y * logoW + x;
          if (!dark[startIdx] || visited[startIdx]) continue;

          let sumX = 0;
          let sumY = 0;
          let count = 0;
          let minX = x;
          let maxX = x;
          let minY = y;
          let maxY = y;
          stack.push(startIdx);
          visited[startIdx] = 1;

          while (stack.length) {
            const cur = stack.pop()!;
            const cx = cur % logoW;
            const cy = (cur / logoW) | 0;
            sumX += cx;
            sumY += cy;
            count++;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const candidates = [cur - 1, cur + 1, cur - logoW, cur + logoW];
            for (const n of candidates) {
              if (n < 0 || n >= logoW * logoH || !dark[n] || visited[n]) continue;
              const nx = n % logoW;
              if (Math.abs(nx - cx) > 1) continue;
              visited[n] = 1;
              stack.push(n);
            }
          }

          if (count > 4) {
            blobs.push({ cx: sumX / count, cy: sumY / count, radius: Math.max(maxX - minX, maxY - minY) / 2, minX, maxX, minY, maxY });
          }
        }
      }

      const sortedRadii = blobs.map((b) => b.radius).sort((a, b) => a - b);
      const medianRadius = sortedRadii[Math.floor(sortedRadii.length / 2)] || 6;

      let line1OffsetX = 0;
      let line2OffsetX = 0;
      let stackedContentW = logoW;
      if (stacked) {
        let l1Min = Infinity;
        let l1Max = -Infinity;
        let l2Min = Infinity;
        let l2Max = -Infinity;
        for (const b of blobs) {
          if (b.cx < SPLIT_X) {
            l1Min = Math.min(l1Min, b.minX);
            l1Max = Math.max(l1Max, b.maxX);
          } else {
            l2Min = Math.min(l2Min, b.minX - SPLIT_X);
            l2Max = Math.max(l2Max, b.maxX - SPLIT_X);
          }
        }
        const l1Width = l1Max - l1Min;
        const l2Width = l2Max - l2Min;
        stackedContentW = Math.max(l1Width, l2Width);
        line1OffsetX = (stackedContentW - l1Width) / 2 - l1Min;
        line2OffsetX = (stackedContentW - l2Width) / 2 - l2Min;
      }

      paddedW = (stacked ? stackedContentW : logoW) + padX * 2;
      paddedH = (stacked ? logoH * 2 + LINE_GAP : logoH) + padY * 2;

      function addDot(cxIn: number, cyIn: number, radius: number) {
        let cx = cxIn;
        let cy = cyIn;
        if (stacked) {
          if (cx < SPLIT_X) {
            cx += line1OffsetX;
          } else {
            cx = cx - SPLIT_X + line2OffsetX;
            cy += logoH + LINE_GAP;
          }
        }
        const rx = cx + padX;
        const ry = cy + padY;
        const angle = Math.random() * Math.PI * 2;
        const dist = logoH * (0.12 + Math.random() * 0.3);
        dots.push({
          restX: rx,
          restY: ry,
          entryX: rx + Math.cos(angle) * dist,
          entryY: ry + Math.sin(angle) * dist,
          delay: Math.random() * ENTRY_MAX_DELAY,
          x: rx,
          y: ry,
          vx: 0,
          vy: 0,
          radius: Math.max(radius, 3),
        });
      }

      for (const b of blobs) {
        if (b.radius <= medianRadius * 1.7) {
          addDot(b.cx, b.cy, b.radius);
          continue;
        }

        const gridStep = Math.max(medianRadius * 1.7, 4);
        for (let gy = b.minY; gy <= b.maxY; gy += gridStep) {
          for (let gx = b.minX; gx <= b.maxX; gx += gridStep) {
            const idx = Math.floor(gy) * logoW + Math.floor(gx);
            if (dark[idx]) addDot(gx, gy, medianRadius);
          }
        }
      }

      wrap!.style.aspectRatio = `${paddedW} / ${paddedH}`;
      resize();
      startTime = performance.now();
      raf = requestAnimationFrame(step);
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [src, color]);

  return (
    <div ref={wrapRef} style={{ width: "100%", aspectRatio: "1768 / 295" }}>
      {/* touchAction:none => tocar/arrastar no logo mexe nos pontos em vez de
          rolar a página (senão o scroll cancela o pointermove no toque) */}
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />
    </div>
  );
}
