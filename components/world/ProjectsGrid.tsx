import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../i18n";
import { mediaOf, type Project } from "./data";
import type { Engine } from "./engine";

type Props = { projects: Project[]; open: (id: string) => void; engine: Engine | null; onHover: (label: string) => void; tick: () => void };

/* Grade infinita arrastável. Os projetos são desenhados no mundo 3D (cards.ts,
   cenário "Órbita"); aqui fica só a física do arrasto e as legendas. Os cards
   formam um ladrilho que se repete nos dois eixos, e as colunas ímpares descem
   meio card. A velocidade curva a grade e acelera os anéis do fundo. Clicar
   num projeto faz a capa crescer até a tela antes de abrir a página. */
type GridApi = {
  setItems(list: Project[], w: number, h: number): void; setPos(i: number, x: number, y: number): void;
  setVel(x: number, y: number): void; setHover(i: number): void; dive(i: number): Promise<void>; clear(): void;
};

export function DragGrid({ projects, open, engine, onHover, tick }: Props) {
  const { tx } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const [layout, setLayout] = useState({ cw: 300, ch: 225, gx: 40, gy: 60, cols: 6, reps: 1 });
  const [hov, setHov] = useState(-1);

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const mob = vw < 760;
      // cards maiores, em grade regular (sem colunas desencontradas)
      const cw = Math.round(mob ? vw * 0.72 : Math.min(460, vw * 0.27));
      const ch = Math.round(cw * 0.625);
      const gx = mob ? 20 : Math.round(vw * 0.028), gy = mob ? 62 : 86;
      const cols = Math.max(3, Math.ceil((vw + cw * 2) / (cw + gx)));
      let reps = 1;
      while (Math.ceil((projects.length * reps) / cols) * (ch + gy) < vh + ch * 3.5 && reps < 8) reps++;
      setLayout({ cw, ch, gx, gy, cols, reps });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [projects.length]);

  const items = useMemo(() => {
    const out: { p: Project; k: string }[] = [];
    for (let r = 0; r < layout.reps; r++) projects.forEach((p) => out.push({ p, k: `${p.id}-${r}` }));
    return out;
  }, [projects, layout.reps]);

  useEffect(() => {
    const el = wrap.current;
    const g = engine?.api<GridApi>("projects");
    if (!el) return;
    const { cw, ch, gx, gy, cols } = layout;
    g?.setItems(items.map((x) => x.p), cw, ch);
    const rows = Math.ceil(items.length / cols);
    const TW = cols * (cw + gx), TH = rows * (ch + gy);
    const vw = () => window.innerWidth, vh = () => window.innerHeight;
    let x = vw() / 2 - cw / 2, y = vh() / 2 - ch / 2 + 20;
    let vx = 0, vy = 0, drag = false, lx = 0, ly = 0, moved = 0, downAt = 0, mx = -1, my = -1;
    let raf = 0, hovI = -1, diving = false;
    const px = new Float32Array(items.length), py = new Float32Array(items.length);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!drag) { x += vx; y += vy; vx *= 0.94; vy *= 0.94; }
      engine?.setVelocity(Math.hypot(vx, vy));
      g?.setVel(vx, vy);
      let hit = -1;
      for (let i = 0; i < items.length; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const bx = col * (cw + gx), by = row * (ch + gy);
        const X = ((bx + x + cw) % TW + TW) % TW - cw;
        const Y = ((by + y + ch * 1.5) % TH + TH) % TH - ch * 1.5;
        px[i] = X; py[i] = Y;
        g?.setPos(i, X, Y);
        if (mx >= X && mx <= X + cw && my >= Y && my <= Y + ch) hit = i;
        const c = caps.current[i];
        if (c) c.style.transform = `translate3d(${X.toFixed(1)}px, ${(Y + ch + 12).toFixed(1)}px, 0)`;
      }
      if (!drag && hit !== hovI && !diving) { hovI = hit; g?.setHover(hit); setHov(hit); onHover(hit >= 0 ? "View" : "Drag"); }
    };
    raf = requestAnimationFrame(frame);

    const down = (e: PointerEvent) => {
      if (diving) return;
      drag = true; moved = 0; lx = e.clientX; ly = e.clientY; downAt = performance.now();
      el.setPointerCapture(e.pointerId); el.classList.add("is-drag");
    };
    const move = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!drag) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      x += dx; y += dy; vx = dx; vy = dy;
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      drag = false; el.classList.remove("is-drag");
      if (moved < 6 && performance.now() - downAt < 450) {
        vx = vy = 0;
        let i = -1;
        for (let k = 0; k < items.length; k++) if (e.clientX >= px[k] && e.clientX <= px[k] + cw && e.clientY >= py[k] && e.clientY <= py[k] + ch) i = k;
        if (i >= 0) {
          diving = true; tick(); onHover("");
          el.classList.add("is-diving");
          (g ? g.dive(i) : Promise.resolve()).then(() => (open as any)(items[i].p.id, true));
        }
      }
    };
    const wheel = (e: WheelEvent) => { e.preventDefault(); vx -= e.deltaX * 0.08; vy -= e.deltaY * 0.08; };
    const key = (e: KeyboardEvent) => {
      const k: Record<string, [number, number]> = { ArrowLeft: [18, 0], ArrowRight: [-18, 0], ArrowUp: [0, 18], ArrowDown: [0, -18] };
      if (k[e.key]) { vx += k[e.key][0]; vy += k[e.key][1]; }
    };
    const leave = () => { mx = my = -1; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      engine?.setVelocity(0);
      g?.setVel(0, 0);
      g?.clear();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
    };
  }, [items, layout, engine, open, tick, onHover]);

  return (
    <div ref={wrap} className="w-grid" data-cursor="Drag">
      {items.map(({ p, k }, i) => (
        <div key={k} ref={(el) => { caps.current[i] = el; }} className={`w-cap ${hov === i ? "on" : ""}`} style={{ width: layout.cw }}>
          <span>{tx(p.title)}</span>
          <span className="w-mono">{tx(p.kind)}</span>
        </div>
      ))}
    </div>
  );
}

/* Lista: índice, título grande, categoria e ano. A capa do projeto em hover
   segue o cursor com atraso. */
export function ProjectList({ projects, open, tick }: { projects: Project[]; open: (id: string) => void; tick: () => void }) {
  const { tx } = useLang();
  const prev = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState<Project | null>(null);

  useEffect(() => {
    let x = 0, y = 0, tx0 = 0, ty0 = 0, raf = 0;
    const mv = (e: PointerEvent) => { tx0 = e.clientX; ty0 = e.clientY; };
    const f = () => {
      raf = requestAnimationFrame(f);
      x += (tx0 - x) * 0.12; y += (ty0 - y) * 0.12;
      if (prev.current) prev.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${((tx0 - x) * 0.03).toFixed(2)}deg)`;
    };
    window.addEventListener("pointermove", mv); raf = requestAnimationFrame(f);
    return () => { window.removeEventListener("pointermove", mv); cancelAnimationFrame(raf); };
  }, []);

  const m = hov ? mediaOf(hov) : null;
  return (
    <div className="w-list">
      {projects.map((p, i) => (
        <button key={p.id} className="w-list-row" onClick={() => { tick(); open(p.id); }}
                onPointerEnter={() => setHov(p)} onPointerLeave={() => setHov(null)} data-cursor="View">
          <span className="w-mono w-list-n">{String(i + 1).padStart(2, "0")}</span>
          <span className="w-list-t">{tx(p.title)}</span>
          <span className="w-mono w-list-k">{tx(p.kind)}</span>
          <span className="w-mono w-list-y">{p.year || ""}</span>
        </button>
      ))}
      <div ref={prev} className={`w-list-prev ${hov ? "on" : ""}`}>
        {m?.type === "video" ? <video key={m.src} src={m.src} muted loop playsInline autoPlay /> :
         m?.type === "image" ? <img key={m.src} src={m.src} alt="" /> : null}
      </div>
    </div>
  );
}
