import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ReactLenis } from "lenis/react";
import { Play, InstagramLogo, EnvelopeSimple, ArrowUp, PaperPlaneRight, Sun, Moon } from "@phosphor-icons/react";
import DropletCursor from "./DropletCursor";
import MediaLightbox from "./MediaLightbox";
import { LangContext, useLang, STRINGS, type Lang } from "./i18n";
import { Loader as WorldLoader, Mark as WorldMark, Roll as WorldRoll, WorldPage } from "./world/Site";
import { WorldStyle } from "./world/style";
import WORK_JSON from "./work.json";
import { WorkIndex, WorkProject, WorkFooter, WorkStyle, WorkSelected, WorkAbout, WorkCareers, WorkIntro, type Work } from "./work/Work";

// Projetos agora vêm só da pasta importada (components/work.json, ver
// scripts/import-work.mjs). O conteúdo antigo do banco fica intacto como
// backup: com USE_WORK ligado, o site não grava nada por cima dele.
const WORK = WORK_JSON as unknown as Work[];
const USE_WORK = true;
const WORK_PROJECTS = WORK.map((p, k) => ({ ...p, order: k, location: "São Paulo, Brasil", videoUrl: "", featured: k < 4 }));
const pickIds = (ids: string[]) => ids.filter((id) => WORK.some((p) => p.id === id));
import { MouseTrailComponent } from "@/components/ui/mouse-trail";
import { ColorBallCursor } from "@/components/ui/color-ball-cursor";
import { RuixenGradientFooter } from "@/components/ui/ruixen-gradient-footer";
import FluidBlobs from "./next-wave/FluidBlobs";
import InteractiveDotLogo from "./next-wave/InteractiveDotLogo";
import LabCore from "./next-wave/LabCore";
import LogoFinale from "./next-wave/LogoFinale";
import Reveal from "./next-wave/Reveal";
import { ACCENTS } from "./next-wave/accents";

// Tap real vs. scroll/roçar: só abre se o dedo mal se moveu (< SLOP px) e foi um
// toque curto. `pointercancel` (o browser assumindo o scroll) aborta o tap.
// Resolve o "abre página só de esbarrar o dedo" no mobile — substitui o onClick
// cru da mídia, que disparava com qualquer toque leve.
function useTap(onTap: (x: number, y: number) => void, disabled = false) {
  const g = useRef<{ x: number; y: number; t: number; ok: boolean; id: number } | null>(null);
  const SLOP = 12, MAX_MS = 700;
  return {
    onPointerDown: (e: any) => {
      if (disabled || e.isPrimary === false) { g.current = null; return; }
      g.current = { x: e.clientX, y: e.clientY, t: Date.now(), ok: true, id: e.pointerId };
    },
    onPointerMove: (e: any) => {
      const s = g.current;
      if (!s || e.pointerId !== s.id) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) s.ok = false;
    },
    onPointerUp: (e: any) => {
      const s = g.current;
      g.current = null;
      if (!s || e.pointerId !== s.id || !s.ok) return;
      if (Date.now() - s.t < MAX_MS) onTap(e.clientX, e.clientY);
    },
    onPointerCancel: () => { g.current = null; },
  };
}

/* ============================================================
   THE FORCE — Portfolio
   Hero carrossel (dots) · Trusted by · Selected work · All work
   Conteúdo → API /api/content (JSON no servidor)
   Mídia → API /api/upload (arquivos em public/uploads)
   ============================================================ */

// Cores como variáveis CSS → permitem dark mode em runtime (o toggle troca o
// tema no <html>). Os valores light ficam idênticos aos originais, então o
// visual padrão (claro) não muda.
const INK = "var(--ink)";
const GRAY = "var(--gray)";
const LINE = "var(--line)";
const BG = "var(--bg)";
const KEY = "tf_portfolio_v6";

const SEED = [
  ["Nubank — Natal Ultravioleta", "Branded Experience", "2024", true],
  ["Alok — Alive", "Show Design", "2020", true],
  ["SESC 24 de Maio — Isso não é uma cidade", "Exhibition", "2017", true],
  ["MASP + Gucci — Festa Beneficente", "Branded Experience", "2025", true],
  ["Nonotak — Japan House", "Exhibition", "2018", true],
  ["Adidas — Refraction", "Installation", "2017", true],
  ["Melissa — Klydroshi", "Installation", "2017", false],
  ["Paradise Guerilla", "Original Film", "2021", false],
  ["Paco Rabanne", "Campaign", "2021", false],
  ["Melissa Connect", "Branded Experience", "2022", false],
  ["Givenchy", "Campaign", "2021", false],
  ["Tommy Hilfiger", "Campaign", "2025", false],
  ["Bottega Veneta", "Campaign", "2023", false],
  ["Schutz", "Campaign", "2022", false],
  ["Chilli Beans — 5MM", "Branded Experience", "2022", false],
  ["Rosa Chá", "Campaign", "2017", false],
  ["Elle Part II", "Editorial", "2017", false],
  ["GQ Collect", "Editorial", "2017", false],
  ["Nike — Hyperadapt", "Product Launch", "2018", false],
  ["Nike Airforce", "Campaign", "2021", false],
  ["Pedacinho — Nubank", "Branded Experience", "2021", false],
  ["Bradesco", "Branded Experience", "2021", false],
  ["Itaú", "Campaign", "2017", false],
  ["Einstein", "Branded Content", "2022", false],
  ["Heineken — DGTL", "Stage Design", "2018", false],
  ["Coca-Cola — SPFW", "Branded Experience", "2017", false],
  ["Coca-Cola — Jenas Mila", "Branded Content", "2021", false],
  ["Becks", "Branded Experience", "2021", false],
  ["Orloff — Lighthouse", "Installation", "2018", false],
  ["Souza Cruz — Infinite Mirror", "Installation", "2017", false],
  ["Kent — Rock in Rio", "Stage Design", "2017", false],
  ["Boma", "Stage Design", "2023", false],
  ["Esfer — Desfile", "Runway", "2021", false],
  ["Pabllo Vittar", "Show Design", "2021", false],
  ["Boiler Room", "Stage Design", "2021", false],
  ["Timewarp", "Stage Design", "2024", false],
  ["Monte Carlo", "Show Design", "2021", false],
  ["Sippys × Starzo", "Show Design", "2023", false],
  ["Festa Hernani", "Show Design", "2021", false],
  ["Game XP", "Stage Design", "2021", false],
  ["Mareh — OCA", "Installation", "2017", false],
  ["Mareh — Pirâmide", "Installation", "2017", false],
  ["Mareh — Hyperboloide", "Installation", "2017", false],
  ["Mareh — Bar da Praia", "Installation", "2017", false],
  ["Downtown 1", "Installation", "2017", false],
  ["Downtown 2", "Installation", "2017", false],
  ["Downtown 3", "Installation", "2017", false],
  ["Ahead — Antitempo", "Original Work", "2018", false],
  ["Amarello", "Original Work", "2019", false],
  ["Mis", "Exhibition", "2023", false],
  ["Mvf", "Installation", "2023", false],
  ["A.I Simbiose", "Installation", "2021", false],
  ["Laser Grid", "Installation", "2024", false],
  ["Dois Tempos", "Installation", "2023", false],
  ["Only Memories Remains", "Original Work", "2017", false],
  ["Fotoluminescente", "Installation", "2018", false],
  ["Perestroika", "Installation", "2017", false],
  ["Rosewood", "Branded Experience", "2024", false],
  ["Future Forest", "Original Work", "2019", false],
  ["Jade Picon", "Branded Content", "2022", false],
] as const;

const CLIENTS = [
  "Nubank", "Nike", "Adidas", "Coca-Cola",
  "Heineken", "Itaú", "Bradesco", "Gucci",
  "Givenchy", "Melissa", "Bottega Veneta", "Tommy Hilfiger",
];

const slug = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CATEGORIES = [
  "Branded Experience", "Show Design", "Exhibition", "Installation",
  "Campaign", "Original Film", "Stage Design", "Branded Content",
  "Editorial", "Product Launch", "Runway", "Original Work",
];

const defaults = () => ({
  logo: null as string | null,
  logoText: "THE FORCE",
  heroHeadline: "Presence is the medium.",
  heroIds: [] as string[],
  featuredIds: [] as string[],
  trustedLabel: "Trusted by",
  selectedTitle: "Selected Works",
  selectedCount: 6,
  allTitle: "All work",
  allCta: "Ver todos os projetos",
  categories: CATEGORIES,
  contactEmail: "hello@theforce.cc",
  contactAddress: "Alameda Eduardo Prado, 667 · São Paulo",
  aboutText: "THE FORCE é um estúdio de criação fundado em São Paulo, especializado em experiências visuais que cruzam arte, tecnologia e cultura contemporânea.",
  nextWaveLogo: null as string | null,
  clients: CLIENTS.map((name, i) => ({ id: slug(name) + i, name, logo: null as string | null })),
});

const seedProjects = () =>
  SEED.map(([title, kind, year, featured], i) => ({
    id: slug(title), order: i, title, kind, year, featured: featured as boolean,
    location: "São Paulo, Brasil", description: "",
    videoUrl: "",
    credits: [] as { role: string; name: string }[],
    cover: null as { type: string; src: string } | null,
    gallery: [] as { type: string; src: string }[],
  }));

/* Armazena no servidor via /api/content */
const storage = {
  get: async (key: string) => {
    try {
      const r = await fetch(`/api/content?key=${encodeURIComponent(key)}`);
      const data = await r.json();
      return { value: data.value as string | null };
    } catch { return { value: null }; }
  },
  set: async (key: string, val: string) => {
    await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: val }),
    });
  },
  delete: async (key: string) => {
    await fetch(`/api/content?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
  },
};

/* Upload: local (dev) ou Vercel Blob (prod) */
const uploadMedia = async (file: File): Promise<{ type: string; src: string } | null> => {
  const type = file.type.startsWith('video') ? 'video' : 'image';
  try {
    if (process.env.NODE_ENV === 'development') {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload-local', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return { type, src: data.url };
    }
    const { upload } = await import('@vercel/blob/client');
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob-handle-upload',
      headers: { 'x-upload-secret': process.env.NEXT_PUBLIC_UPLOAD_SECRET || '' },
      contentType: file.type || undefined,
    });
    return { type, src: blob.url };
  } catch (e: any) {
    alert(`Upload falhou: ${e.message}`);
    return null;
  }
};

/* Cache de instância ffmpeg entre compressões */
let _ffmpegInst: any = null;
let _ffmpegLoadP: Promise<void> | null = null;

async function compressVideo(file: File, onStatus: (s: string) => void): Promise<File> {
  if (!_ffmpegLoadP) {
    onStatus('carregando ffmpeg (~30MB, só na 1ª vez)…');
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    _ffmpegInst = new FFmpeg();
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    _ffmpegLoadP = _ffmpegInst.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }
  await _ffmpegLoadP;

  const { fetchFile } = await import('@ffmpeg/util');
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const inName = `in.${ext}`;

  const onProgress = ({ progress }: { progress: number }) =>
    onStatus(`comprimindo ${Math.round(Math.min(progress * 100, 99))}%…`);
  _ffmpegInst.on('progress', onProgress);

  await _ffmpegInst.writeFile(inName, await fetchFile(file));
  onStatus('comprimindo…');
  await _ffmpegInst.exec([
    '-i', inName,
    '-vf', "scale='min(iw,1280)':-2",
    '-c:v', 'libx264', '-crf', '28', '-preset', 'fast',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    'out.mp4',
  ]);

  _ffmpegInst.off('progress', onProgress);
  const data = (await _ffmpegInst.readFile('out.mp4')) as Uint8Array;
  try { await _ffmpegInst.deleteFile(inName); await _ffmpegInst.deleteFile('out.mp4'); } catch {}

  const outName = file.name.replace(/\.[^.]+$/, '.mp4');
  return new File([data.buffer as ArrayBuffer], outName, { type: 'video/mp4' });
}

/* Hook: intercepts large video files and offers compression before upload */
function useVideoCompress() {
  const [pending, setPending] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const resolveRef = useRef<((f: File) => void) | null>(null);

  const maybeCompress = (file: File): Promise<File> => {
    /* Only offer compression for videos ≥ 20 MB */
    if (!file.type.startsWith('video') || file.size < 20 * 1024 * 1024) {
      return Promise.resolve(file);
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setPending(file);
    });
  };

  const doCompress = async () => {
    if (!pending) return;
    const f = pending;
    setPending(null);
    try {
      const compressed = await compressVideo(f, setStatus);
      setStatus(null);
      resolveRef.current?.(compressed);
    } catch {
      setStatus(null);
      resolveRef.current?.(f);
    }
    resolveRef.current = null;
  };

  const doSkip = () => {
    if (!pending) return;
    const f = pending;
    setPending(null);
    resolveRef.current?.(f);
    resolveRef.current = null;
  };

  const ui = status !== null ? (
    <span className="mono" style={{ fontSize: 9, color: "#aaa", display: "block", marginTop: 4 }}>{status}</span>
  ) : pending ? (
    <div className="edit-row" style={{ marginTop: 5 }}>
      <span className="mono" style={{ fontSize: 9, color: "#aaa", flex: 1 }}>
        {(pending.size / 1024 / 1024).toFixed(0)} MB — comprimir antes de enviar?
      </span>
      <button className="ebtn" onClick={doCompress}>🗜️ sim</button>
      <button className="ebtn" onClick={doSkip}>não</button>
    </div>
  ) : null;

  return { maybeCompress, ui, busy: status !== null || pending !== null };
}

/* Mídia como URL: nada a descartar ao salvar */
const stripMedia = (s: any) => s;

const normalizeUrl = (url: string) => {
  if (!url) return "";
  const u = url.trim();
  const drive = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  const dbox = u.match(/dropbox\.com\/(.+)/);
  if (dbox) return u.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace(/[?&]dl=0/, "");
  return u;
};

const sourceOf = (p: any) => {
  if (p?.videoUrl) return { type: "video", src: normalizeUrl(p.videoUrl), hosted: true };
  if (p?.cover) return { ...p.cover, hosted: false };
  return null;
};

/* ============================ custom cursor ============================ */

// true só em dispositivos com ponteiro fino (mouse). Usado pra desligar os
// cursores customizados no touch (mobile), onde eles falhavam.
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(!!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return fine;
}

function CustomCursor() {
  const ballRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const mouse = useRef({ x: -300, y: -300 });
  const lerped = useRef({ x: -300, y: -300 });
  const sizeTarget = useRef(20);
  const sizeCur = useRef(20);
  const raf = useRef<number>();
  const visible = useRef(false);
  // Só ativa o cursor customizado em ponteiro fino (mouse). No touch (mobile)
  // ele falhava/engasgava, então fica desligado e o toque volta ao normal.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // acompanha a troca de dispositivo (ex.: emulação de celular ligada/desligada)
    const mq = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const on = () => setEnabled(!!mq?.matches);
    on(); mq?.addEventListener?.("change", on);
    return () => mq?.removeEventListener?.("change", on);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("tf-ball", enabled);
    return () => document.documentElement.classList.remove("tf-ball");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const updateFrom = (x: number, y: number) => {
      mouse.current = { x, y };
      if (!visible.current) {
        lerped.current = { x, y };
        visible.current = true;
      }
      const el = document.elementFromPoint(x, y);
      const over = !!el?.closest('.wblock-media, button.wk-screen') && !el?.closest('.editing');
      sizeTarget.current = over ? 76 : 20;
    };

    const onMove = (e: MouseEvent) => updateFrom(e.clientX, e.clientY);

    const onLeave = () => { visible.current = false; };
    const onEnter = () => { visible.current = true; };

    const tick = () => {
      lerped.current.x = lerp(lerped.current.x, mouse.current.x, 0.1);
      lerped.current.y = lerp(lerped.current.y, mouse.current.y, 0.1);
      sizeCur.current = lerp(sizeCur.current, sizeTarget.current, 0.12);

      const { x, y } = lerped.current;
      const s = sizeCur.current;

      if (ballRef.current) {
        ballRef.current.style.transform = `translate(${x - s / 2}px, ${y - s / 2}px)`;
        ballRef.current.style.width = `${s}px`;
        ballRef.current.style.height = `${s}px`;
        ballRef.current.style.opacity = visible.current ? '1' : '0';
      }
      if (labelRef.current) {
        labelRef.current.style.opacity = String(Math.max(0, Math.min(1, (s - 50) / 26)));
      }

      raf.current = requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={ballRef} className="cursor-ball" style={{ width: 20, height: 20, opacity: 0 }}>
      <span ref={labelRef} className="cursor-view-label" style={{ opacity: 0 }}>VIEW</span>
    </div>
  );
}

/* ============================ preloader ============================ */

// Loading do início: só a bolinha girando sobre fundo preto (sem o branco do
// topo). Segura ~1.4s e some com fade, revelando o hero (que também é preto).
function Preloader({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1400);
    const t2 = setTimeout(onDone, 1720);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className="preloader" style={{ opacity: fading ? 0 : 1 }}>
      <span className="pre-ball" />
    </div>
  );
}

/* ============================================================ */

export default function App() {
  const [state, setState] = useState<any>(null);
  const [view, setView] = useState<any>({ page: "home" });
  const historyRef = useRef<any[]>([]);      // pilha de páginas visitadas (para "voltar")
  const [canBack, setCanBack] = useState(false);
  const lenisRef = useRef<any>(null);                  // instância do smooth-scroll (Lenis)
  // as páginas novas (Work) acessam o Lenis para parar/voltar ao topo
  useEffect(() => { (window as any).__tfLenis = () => lenisRef.current?.lenis; }, []);
  // vai pro topo de forma instantânea, respeitando o Lenis quando ativo
  const scrollTop = () => {
    // force: a rolagem suave pode estar parada (animação de abrir projeto)
    const l = lenisRef.current?.lenis;
    l?.scrollTo?.(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  };
  // toda troca de página começa do topo, depois que a página nova já montou
  useEffect(() => {
    scrollTop();
    const k = requestAnimationFrame(scrollTop), t = window.setTimeout(scrollTop, 80);
    return () => { cancelAnimationFrame(k); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.page, view.id]);
  const pullRef = useRef<HTMLDivElement>(null);        // wrapper que desliza no overscroll
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [pullDir, setPullDir] = useState<null | "top" | "bottom">(null);
  const [edit, setEdit] = useState(false);
  // Edição só é permitida rodando localmente (localhost). No site público não há botão "edit".
  const allowEdit = useState(() => typeof window !== "undefined"
    && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))[0];
  const [save, setSave] = useState("idle");
  // Tema (light padrão / dark). Aplica a classe .dark no <html> e persiste.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("tf_theme") : null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("tf_theme", theme); } catch {}
  }, [theme]);

  // Idioma (inglês padrão / português). Persiste em localStorage.
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("tf_lang") : null;
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);
  useEffect(() => { try { localStorage.setItem("tf_lang", lang); } catch {} }, [lang]);
  const t = (k: string) => STRINGS[lang]?.[k] ?? STRINGS.en[k] ?? k;

  // history nativo: registra o estado inicial e reage ao voltar/avançar do browser
  useEffect(() => {
    try { history.replaceState({ tfView: { page: "home" } }, ""); } catch {}
    const onPop = (e: PopStateEvent) => {
      setView(e.state?.tfView || { page: "home" });
      const l = lenisRef.current?.lenis;
      if (l?.scrollTo) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [circlePhase, _setCirclePhase] = useState<'idle'|'growing'|'shrinking'>('idle');
  const circlePhaseRef = useRef<'idle'|'growing'|'shrinking'>('idle');
  const setCirclePhase = useCallback((p: 'idle'|'growing'|'shrinking') => {
    circlePhaseRef.current = p;
    _setCirclePhase(p);
  }, []);
  const circleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const dirty = useRef(false);

  const navigate = useCallback((navFn: () => void, ox?: number, oy?: number, plain?: boolean) => {
    if (circlePhaseRef.current !== 'idle') return;
    // plain: navega direto, sem a transição de círculo (invert). Usado ao abrir
    // projeto no mobile.
    // troca de página direta, sem o círculo (fora do modo edição)
    if (plain || !document.querySelector(".tf.editing")) { navFn(); scrollTop(); return; }
    const el = circleRef.current;
    if (!el) { navFn(); return; }

    const x = ox ?? window.innerWidth / 2;
    const y = oy ?? window.innerHeight / 2;
    const maxR = Math.ceil(Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )) + 100;

    setCirclePhase('growing');
    el.style.display = 'block';
    el.animate([
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${maxR}px at ${x}px ${y}px)` },
    ], { duration: 380, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' });

    setTimeout(() => {
      navFn();
      scrollTop();
      setCirclePhase('shrinking');
      el.animate([
        { clipPath: `circle(${maxR}px at ${x}px ${y}px)` },
        { clipPath: `circle(0px at ${x}px ${y}px)` },
      ], { duration: 440, easing: 'cubic-bezier(0,0,0.2,1)', fill: 'forwards' });
      setTimeout(() => {
        el.getAnimations().forEach(a => a.cancel());
        el.style.display = 'none';
        setCirclePhase('idle');
      }, 460);
    }, 390);
  }, [setCirclePhase]);

  // Overscroll elástico (mobile): puxar além do topo/fundo mostra um loading e
  // solta de volta com mola. Só age quando já está no limite do scroll.
  useEffect(() => {
    const RESIST = 0.42, MAX = 130, TRIGGER = 48;
    let startY = 0, active = false, pulling = false, dir = 0, offset = 0;
    const atTop = () => window.scrollY <= 0;
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      active = true; pulling = false; dir = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const wrap = pullRef.current;
      if (!wrap) return;
      const dy = e.touches[0].clientY - startY;
      if (!pulling) {
        if (dy > 6 && atTop()) { pulling = true; dir = 1; setPullDir("top"); }
        else if (dy < -6 && atBottom()) { pulling = true; dir = -1; setPullDir("bottom"); }
        else return;
      }
      // segura o overscroll nativo e assume o controle
      if (e.cancelable) e.preventDefault();
      offset = dy * RESIST;
      if ((dir === 1 && offset < 0) || (dir === -1 && offset > 0)) offset = 0;
      offset = Math.max(-MAX, Math.min(MAX, offset));
      wrap.style.transition = "none";
      wrap.style.transform = `translateY(${offset.toFixed(1)}px)`;
      const ind = indicatorRef.current;
      if (ind) {
        const prog = Math.min(1, Math.abs(offset) / TRIGGER);
        ind.style.opacity = String(prog);
        ind.style.transform = `translateX(-50%) scale(${0.6 + prog * 0.4}) rotate(${offset * 3}deg)`;
      }
    };
    const onEnd = () => {
      active = false;
      const wrap = pullRef.current;
      if (pulling && wrap) {
        wrap.style.transition = "transform .55s cubic-bezier(.16,1,.3,1)";
        wrap.style.transform = "translateY(0)";
        // sem transform residual (senão o 3D fixo passa a rolar junto)
        window.setTimeout(() => { wrap.style.transform = ""; wrap.style.transition = ""; }, 600);
      }
      if (pulling) setPullDir(null);
      pulling = false; offset = 0;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  useEffect(() => {
    (async () => {
      let stored: any = null;
      try {
        const r = await storage.get(KEY);
        if (r?.value) stored = JSON.parse(r.value);
      } catch (e) { /* primeira visita */ }

      const base = seedProjects();

      if (stored?.projects?.length) {
        const shape = {
          location: "São Paulo, Brasil", description: "", videoUrl: "",
          credits: [], featured: false,
        };
        const merged = stored.projects
          .map((p: any) => ({ ...shape, ...p }))
          .sort((a: any, b: any) => a.order - b.order)
          .map((p: any, k: number) => ({ ...p, order: k }));

        const storedFeaturedIds = stored.settings?.featuredIds;
        const featuredIds = storedFeaturedIds?.length
          ? storedFeaturedIds
          : merged.filter((p: any) => p.featured).map((p: any) => p.id);

        setState({
          settings: {
            ...defaults(), ...(stored.settings || {}),
            featuredIds,
            clients: Array.isArray(stored.settings?.clients)
              ? stored.settings.clients
              : defaults().clients,
            categories: Array.isArray(stored.settings?.categories)
              ? stored.settings.categories
              : defaults().categories,
          },
          projects: merged,
        });
      } else {
        setState({
          settings: { ...defaults(), heroIds: base.filter((p) => p.featured).slice(0, 3).map((p) => p.id) },
          projects: base,
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!USE_WORK) return;
    setState((st: any) => {
      if (!st || st.__work) return st;
      // Selected work (e o carrossel do topo): escolha do estúdio
      const feat = pickIds(["antitempo", "nonotak-dimensao", "future-forest"]);
      const hero = feat.slice(0, 4);
      return { __work: true, projects: WORK_PROJECTS,
        settings: { ...st.settings, heroIds: hero, featuredIds: feat, selectedCount: 3, heroHeadline: "Connecting people and tech.",
          categories: Array.from(new Set(WORK.map((p) => p.kind).filter(Boolean))) } };
    });
  }, [state]);

  const commit = useCallback((fn: (s: any) => any) => {
    dirty.current = true;
    setState((prev: any) => fn(prev));
  }, []);

  useEffect(() => {
    if (!state || !dirty.current || USE_WORK) return;
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const payload = JSON.stringify(stripMedia(state));
      try {
        await storage.set(KEY, payload);
        dirty.current = false;
        setSave("saved");
        setTimeout(() => setSave("idle"), 1800);
      } catch (e) {
        console.error("save falhou:", e);
        setSave("error");
      }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state]);

  // Revela a home só quando o 1º vídeo do hero (capa do 1º Selected Work) pode
  // tocar — assim o vídeo entra sem o "preto" de carregando. Fallback de 8s.
  useEffect(() => {
    if (!state) return;
    const feat = (state.settings.featuredIds || [])
      .map((id: string) => state.projects.find((p: any) => p.id === id)).filter(Boolean);
    const cover = feat.length ? sourceOf(feat[0]) : null;
    let cancelled = false;
    const done = () => { if (!cancelled) setLoading(false); };
    if (cover?.type === "video") {
      const v = document.createElement("video");
      v.muted = true; v.preload = "auto"; v.playsInline = true;
      if (cover.start) v.addEventListener("loadedmetadata", () => { try { v.currentTime = cover.start; } catch {} }, { once: true });
      v.addEventListener("canplay", done, { once: true });
      v.addEventListener("error", done, { once: true });
      v.src = cover.src;
    } else {
      setTimeout(done, 500);
    }
    const to = setTimeout(done, 8000);
    return () => { cancelled = true; clearTimeout(to); };
  }, [state]);

  // intro nova (a mesma do site novo): o boot estático do _document sai assim
  // que o app monta e o loader com a marca se desenhando fica no lugar
  useEffect(() => { document.getElementById("tf-boot")?.remove(); }, []);
  const [minIntro, setMinIntro] = useState(false);
  useEffect(() => { const k = setTimeout(() => setMinIntro(true), 2600); return () => clearTimeout(k); }, []);
  useEffect(() => {
    if (!state || loading || !minIntro) return;
    (window as any).__tfIntroDone = true;
    window.dispatchEvent(new Event("tf-intro-done"));
  }, [state, loading, minIntro]);

  // a intro fica por conta da página (BootIntro): aqui só avisamos quando está tudo pronto
  if (!state) return null;

  const { settings, projects } = state;
  const sorted = [...projects].sort((a: any, b: any) => a.order - b.order);

  const patchSettings = (patch: any) => commit((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const patchProject = (id: string, patch: any) =>
    commit((s) => ({ ...s, projects: s.projects.map((p: any) => (p.id === id ? { ...p, ...patch } : p)) }));

  const move = (id: string, dir: number) =>
    commit((s) => {
      const arr = [...s.projects].sort((a: any, b: any) => a.order - b.order);
      const i = arr.findIndex((p: any) => p.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, projects: arr.map((p: any, k: number) => ({ ...p, order: k })) };
    });

  const toggleFeatured = (id: string) =>
    commit((s) => {
      const ids: string[] = s.settings.featuredIds || [];
      const has = ids.includes(id);
      return {
        ...s,
        settings: { ...s.settings, featuredIds: has ? ids.filter((x) => x !== id) : [...ids, id] },
        projects: s.projects.map((p: any) => p.id === id ? { ...p, featured: !has } : p),
      };
    });

  const moveFeatured = (id: string, dir: number) =>
    commit((s) => {
      const arr = [...(s.settings.featuredIds || [])];
      const i = arr.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, settings: { ...s.settings, featuredIds: arr } };
    });

  const toggleHero = (id: string) =>
    commit((s) => {
      const has = s.settings.heroIds.includes(id);
      return {
        ...s,
        settings: {
          ...s.settings,
          heroIds: has ? s.settings.heroIds.filter((x: string) => x !== id) : [...s.settings.heroIds, id],
        },
      };
    });

  const moveHero = (id: string, dir: number) =>
    commit((s) => {
      const arr = [...s.settings.heroIds];
      const i = arr.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, settings: { ...s.settings, heroIds: arr } };
    });

  const addProject = () => {
    const id = "projeto-" + Date.now().toString(36);
    commit((s) => ({
      ...s,
      projects: [
        { id, order: -1, title: "Novo projeto", kind: s.settings.categories[0] || "Installation",
          year: String(new Date().getFullYear()), featured: false,
          location: "São Paulo, Brasil", description: "", videoUrl: "",
          credits: [], cover: null, gallery: [] },
        ...s.projects,
      ].map((p: any, k: number) => ({ ...p, order: k })),
    }));
    setView({ page: "project", id });
    setEdit(true);
    scrollTop();
  };

  const removeProject = (id: string) => {
    setView({ page: "all" });
    commit((s) => ({
      ...s,
      settings: { ...s.settings, heroIds: s.settings.heroIds.filter((x: string) => x !== id) },
      projects: s.projects.filter((p: any) => p.id !== id).map((p: any, k: number) => ({ ...p, order: k })),
    }));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(stripMedia(state), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "theforce-conteudo.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetAll = async () => {
    if (!confirm("Apagar tudo e voltar ao conteúdo inicial? Não dá pra desfazer.")) return;
    try { await storage.delete(KEY); } catch (e) {}
    const base = seedProjects();
    dirty.current = false;
    setState({
      settings: { ...defaults(), heroIds: base.filter((p) => p.featured).slice(0, 3).map((p) => p.id) },
      projects: base,
    });
    setView({ page: "home" });
    scrollTop();
  };

  const current = view.page === "project" ? projects.find((p: any) => p.id === view.id) : null;

  // registra a página atual na pilha antes de trocar (para poder voltar)
  // Navegação via history nativo do browser: cada mudança empurra um estado, e
  // o botão voltar/avançar do navegador (Safari/Chrome/Edge) navega de verdade.
  const go = (target: any, ox?: number, oy?: number) => {
    if (target.page === view.page && (target.id || null) === (view.id || null)) return;
    const commit = () => { setView(target); try { history.pushState({ tfView: target }, ""); } catch {} };
    // Abrir projeto vai direto, sem a transição de círculo (invert) — em desktop
    // e mobile. As outras páginas (Home/About/Work/Next Wave/Contact) mantêm o invert.
    navigate(commit, ox, oy, target.page === "project");
  };
  const goBack = () => { try { history.back(); } catch {} };
  const open = (id: string, ox?: number, oy?: number) => go({ page: "project", id }, ox, oy);
  const home = (ox?: number, oy?: number) => go({ page: "home" }, ox, oy);
  const allWork = (ox?: number, oy?: number) => go({ page: "all" }, ox, oy);
  const goNextWave = (ox?: number, oy?: number) => go({ page: "nextwave" }, ox, oy);
  const goAbout = (ox?: number, oy?: number) => go({ page: "about" }, ox, oy);
  const goContact = (ox?: number, oy?: number) => go({ page: "contact" }, ox, oy);
  const goCareers = (ox?: number, oy?: number) => go({ page: "careers" }, ox, oy);

  return (
    <ReactLenis root ref={lenisRef}
      options={{ lerp: 0.075, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 }}>
    <LangContext.Provider value={{ lang, setLang }}>
    <div className={`tf${edit ? " editing" : ""}${view.page === "nextwave" ? " nw-page" : ""}`}>
      <Style />
      <WorldStyle />
      <WorkStyle />
      <CustomCursor />

      <div ref={circleRef} className="page-circle" />

      <Header s={settings} edit={edit} setEdit={setEdit} allowEdit={allowEdit} save={save} onAdd={addProject}
              onExport={exportJSON} onReset={resetAll} goHome={home}
              patchSettings={patchSettings} goWork={allWork} goNextWave={goNextWave}
              goAbout={goAbout} goContact={goContact} goCareers={goCareers}
              page={view.page} />

      {pullDir && (
        <div ref={indicatorRef} className={`pull-load pull-load-${pullDir}`} style={{ opacity: 0 }}>
          <span className="pull-spinner" />
        </div>
      )}

      <div className={loading ? "app-hidden" : "app-in"}>
      <div ref={pullRef} className="pull-wrap">
      {view.page === "home" && (
        <Home s={settings} projects={sorted} edit={edit}
              patchSettings={patchSettings} patchProject={patchProject}
              move={move} moveHero={moveHero} toggleHero={toggleHero}
              toggleFeatured={toggleFeatured} moveFeatured={moveFeatured}
              open={open} allWork={allWork} />
      )}

      {view.page === "all" && !edit && <WorkIndex projects={WORK} open={(id) => open(id)} />}
      {view.page === "all" && edit && (
        <AllWork s={settings} projects={sorted} edit={edit}
                 patchSettings={patchSettings} patchProject={patchProject}
                 move={move} toggleHero={toggleHero} toggleFeatured={toggleFeatured}
                 open={open} back={goBack} onRemove={removeProject} />
      )}

      {view.page === "project" && current && (edit
        ? <ProjectPage key={current.id} p={current} all={sorted} edit={edit}
          categories={settings.categories}
          patch={(patch: any) => patchProject(current.id, patch)}
          remove={() => removeProject(current.id)} back={goBack} open={open} />
        : <WorkProject key={current.id} p={current as Work} all={WORK} open={(id) => open(id)} back={() => allWork()} />
      )}

      {view.page === "nextwave" && (edit
        ? <NextWave s={settings} edit={edit} patchSettings={patchSettings}
                  nav={{ home, allWork, goAbout, goContact }} />
        : <WorldPage page="nextwave" data={{ settings, projects: sorted }} open={(id) => open(id)} />
      )}

      {view.page === "about" && !edit && (
        <AboutNew s={settings} open={(id: string) => open(id)} />
      )}
      {view.page === "about" && edit && (
        <About s={settings} edit={edit} patchSettings={patchSettings} projects={sorted} open={open} />
      )}

      {view.page === "contact" && (edit
        ? <Contact s={settings} edit={edit} patchSettings={patchSettings} />
        : <WorldPage page="contact" data={{ settings, projects: sorted }} open={(id) => open(id)} />
      )}

      {view.page === "careers" && <WorkCareers s={settings} />}

      {!edit && !["nextwave", "contact"].includes(view.page) && (
        <WorkFooter s={settings} nav={{ home, goAbout, allWork, goNextWave, goContact, goCareers,
          top: () => { const l = lenisRef.current?.lenis; if (l?.scrollTo) l.scrollTo(0, { duration: 1.1 }); else window.scrollTo({ top: 0, behavior: "smooth" }); } }} />
      )}
      {edit && <BlurFooter s={settings} edit={edit} patch={patchSettings} noLogo={false}
        logo3d={view.page === "nextwave"}
        theme={theme} onToggleTheme={() => {
          document.documentElement.classList.add("theme-instant");
          setTheme((t) => (t === "dark" ? "light" : "dark"));
          requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("theme-instant")));
        }}
        nav={{ home, goAbout, allWork, goNextWave, goContact,
               top: () => { const l = lenisRef.current?.lenis; if (l?.scrollTo) l.scrollTo(0, { duration: 1.1 }); else window.scrollTo({ top: 0, behavior: "smooth" }); } }} />}
      </div>
      </div>
      {edit && <EditHint />}
    </div>
    </LangContext.Provider>
    </ReactLenis>
  );
}

/* ============================ CSS ============================ */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');

      /* Tema — light (padrão, idêntico ao original) e dark (via .dark no html) */
      :root {
        --ink: #0A0A0A; --gray: #6B6B6B; --line: #E9E9E9;
        --bg: #ffffff; --bg-soft: #fafafa;
      }
      html.dark {
        --ink: #ededed; --gray: #8b8b8b; --line: #2a2a2a;
        --bg: #0b0b0b; --bg-soft: #151515;
      }
      html { background: var(--bg); }
      body { background: var(--bg); color: var(--ink); transition: background .3s ease, color .3s ease; }
      /* ao trocar o tema, desativa TODAS as transições → muda tudo de uma vez */
      html.theme-instant, html.theme-instant *, html.theme-instant *::before, html.theme-instant *::after { transition: none !important; }

      *, *::before, *::after { box-sizing: border-box; margin: 0; }
      /* trava o arrasto/scroll horizontal (mobile) — página fixa no eixo X */
      html, body { overflow-x: hidden; max-width: 100%; overscroll-behavior-x: none; }

      /* Lenis (smooth scroll) */
      html.lenis, html.lenis body { height: auto; }
      .lenis.lenis-smooth { scroll-behavior: auto !important; }
      .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
      .lenis.lenis-stopped { overflow: hidden; }
      .lenis.lenis-smooth iframe { pointer-events: none; }
      .tf {
        font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: ${INK}; background: ${BG}; min-height: 100vh;
        -webkit-font-smoothing: antialiased; overflow-x: hidden; max-width: 100vw;
        transition: background .3s ease, color .3s ease;
      }
      .tf button { cursor: pointer; font-family: inherit; }
      .tf ::selection { background: ${INK}; color: #fff; }

      .mono { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
      .pad  { padding-left: clamp(20px, 4.5vw, 60px); padding-right: clamp(20px, 4.5vw, 60px); }

      .tf-header {
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        display: flex; justify-content: space-between; align-items: center;
        /* env(safe-area-inset-top): com viewport-fit=cover o hero vai edge-to-edge
           (sem faixa branca no notch); o header desce pra não ficar sob o notch */
        padding: max(18px, env(safe-area-inset-top)) clamp(20px,4.5vw,60px) 18px;
        color: #fff; pointer-events: none;
        mix-blend-mode: difference;
      }
      /* sem barra de rolagem visível: ela comia ~15px da direita e descentralizava a página */
      html { scrollbar-width: none; }
      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }
      .tf-header { transition: transform .45s cubic-bezier(.22,1,.36,1); }
      .tf-header.tf-tuck { transform: translateY(-110%); }
      .app-in, .app-hidden { isolation: auto; }

      .hero-track { display: flex; height: 100%; transition: transform .7s cubic-bezier(.4,0,.2,1); }
      /* só o slide da vez (e o que sai, até a troca acabar) fica visível: o vizinho fora da tela
         vazava 1px e desenhava um risco preto na borda esquerda */
      .hero-slide { flex: 0 0 100%; height: 100%; position: relative; overflow: hidden; visibility: hidden; transition: visibility 0s linear .75s; }
      .hero-slide.on, .hero-dragging .hero-slide { visibility: visible; transition-delay: 0s; }
      /* hero cobre a TELA INTEIRA no mobile: 100vh (no iOS = viewport grande, vai
         atrás das barras) + 100lvh explícito. As barras do Safari ficam POR CIMA
         do vídeo (topo e base), em vez de encolher a área do vídeo (era 100svh). */
      .hero-full { height: 100vh; height: 100lvh; min-height: 540px; }
      .dots { display: flex; gap: 9px; align-items: center; }
      .dot {
        width: 7px; height: 7px; border-radius: 999px; padding: 0; border: none;
        background: rgba(255,255,255,.38); transition: background .3s, width .3s;
      }
      .dot.on { background: #fff; width: 22px; }

      .preloader {
        position: fixed; inset: 0; z-index: 200; background: #000;
        display: grid; place-items: center;
        transition: opacity .45s ease; pointer-events: none;
      }
      /* loading do início: só a bolinha girando (sem fundo/texto branco no topo) */
      .pre-ball { width: 30px; height: 30px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,.16); border-top-color: #fff;
        animation: preSpin .8s linear infinite; }
      @keyframes preSpin { to { transform: rotate(360deg); } }
      /* loader ao abrir um projeto: fundo do tema + bolinha na cor da tinta */
      .proj-loader { position: fixed; inset: 0; z-index: 150; background: var(--bg);
        display: grid; place-items: center; }
      .pre-ball--ink { border: 2px solid var(--line); border-top-color: var(--ink); }

      .app-hidden { opacity: 0; }
      .app-in { animation: fadeUp .9s cubic-bezier(.2,.6,.2,1) both; }
      /* só opacidade: um transform aqui quebrava o position:fixed dos cenários 3D */
      @keyframes fadeUp { from { opacity: 0; } to { opacity: 1; } }

      .wblock { opacity: 0; transform: translateY(30px); filter: blur(6px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1), filter .8s ease; }
      .wblock.in { opacity: 1; transform: none; filter: none; }
      .no-reveal .wblock { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
      .wblock-inner { }
      .wblock-media { aspect-ratio: 4/3; overflow: hidden; background: #0a0a0a; position: relative; }
      .wblock-media img, .wblock-media video { object-fit: cover; width: 100%; height: 100%; display: block; transition: filter .45s cubic-bezier(.22,1,.36,1); }
      @media (hover: hover) and (pointer: fine) {
        .wblock.in:hover .wblock-media img,
        .wblock.in:hover .wblock-media video { filter: invert(1) brightness(1.05); }
      }
      .wblock-view {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity .4s cubic-bezier(.22,1,.36,1); pointer-events: none;
      }
      .wblock.in:hover .wblock-view { opacity: 1; }
      .wblock-view-label {
        font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; letter-spacing: .28em; text-transform: uppercase;
        font-size: 12px; color: #fff; font-weight: 500;
        border: 1px solid rgba(255,255,255,.55); padding: 9px 20px; border-radius: 999px;
        backdrop-filter: blur(4px); background: rgba(0,0,0,.18);
      }
      .wblock-info { padding-top: 10px; margin-top: 10px; border-top: 1px solid ${LINE}; display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
      .wblock-title { font-size: 16px; font-weight: 400; letter-spacing: -.01em; line-height: 1.35; flex: 1; min-width: 0; min-height: 2.7em; }
      @media (max-width: 599px) { .wblock-title { min-height: 0; } }
      .wblock-meta { display: flex; gap: 8px; align-items: baseline; flex-shrink: 0; }

      .page-circle {
        position: fixed; inset: 0; z-index: 998; pointer-events: none;
        background: #fff; mix-blend-mode: difference;
        display: none;
      }

      .work-grid { display: grid; grid-template-columns: 1fr; column-gap: clamp(16px,2vw,26px); row-gap: clamp(36px,5.5vh,64px); }
      @media (min-width: 600px) { .work-grid { grid-template-columns: repeat(2,1fr); } }
      @media (min-width: 900px) { .work-grid { grid-template-columns: repeat(3,1fr); } }

      .proj-grid { display: grid; grid-template-columns: 1fr; row-gap: clamp(28px,4vh,48px); }
      @media (min-width: 860px) {
        .proj-grid { grid-template-columns: minmax(0,2fr) minmax(0,3fr); column-gap: clamp(48px,5.5vw,88px); row-gap: 0; align-items: start; }
        .proj-left { position: sticky; top: 88px; align-self: start; }
      }
      @media (max-width: 560px) {
        .proj-grid { row-gap: clamp(20px,3vh,32px); }
      }

      .filt { border: 1px solid ${LINE}; border-radius: 999px; padding: 9px 16px; font-size: 9.5px; background: ${BG}; color: ${GRAY}; transition: background .25s, color .25s, border-color .25s; }
      .filt:hover { border-color: ${INK}; color: ${INK}; }
      .filt.on { background: ${INK}; color: ${BG}; border-color: ${INK}; }
      .tb-logo { opacity: .6; filter: grayscale(1); transition: filter .3s ease, opacity .3s ease; }
      html.dark .tb-logo { opacity: .82; filter: grayscale(1) invert(1) brightness(1.15); }
      .tb-marquee { overflow: hidden; padding: 8px 0;
        -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
        mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); }
      .tb-track { display: flex; align-items: center; width: max-content; will-change: transform; }
      .tb-cell { flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
        width: clamp(96px,20vw,150px); height: clamp(28px,7vw,44px); margin-right: clamp(20px,5vw,64px); overflow: hidden; }
      .tb-cell img { max-width: 100%; }
      @keyframes tb-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
      @media (prefers-reduced-motion: reduce) { .tb-track { animation: none; } }

      .logo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 46px 18px; align-items: center; }
      @media (min-width: 760px)  { .logo-grid { grid-template-columns: repeat(4, 1fr); gap: 54px 26px; } }
      @media (min-width: 1180px) { .logo-grid { grid-template-columns: repeat(6, 1fr); } }
      .logo-cell { display: flex; align-items: center; justify-content: center; height: 56px; }
      .logo-cell img { height: 34px; width: 100%; max-width: 140px; object-fit: contain; }

      .ebtn { border: 1px dashed #b9b9b9; background: rgba(255,255,255,.96); color: #3a3a3a; border-radius: 4px; padding: 5px 10px; font-size: 11px; font-weight: 500; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; line-height: 1.4; white-space: nowrap; }
      .ebtn:hover { border-color: ${INK}; color: ${INK}; }
      .ebtn.on { background: ${INK}; color: #fff; border-style: solid; }
      .ebtn.dark { background: rgba(0,0,0,.55); color: #fff; border-color: rgba(255,255,255,.45); }
      .ebtn.dark:hover { background: #fff; color: #000; }
      .ebtn.danger { border-color: #d7a49e; color: #a5352a; }

      .einput { border: 1px dashed #c9c9c9; border-radius: 4px; background: #fffdf7; padding: 5px 8px; width: 100%; color: inherit; font: inherit; letter-spacing: inherit; }
      .einput:focus { outline: none; border-color: ${INK}; background: #fff; }
      select.einput { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 22px; background-image: linear-gradient(45deg, transparent 50%, #888 50%), linear-gradient(135deg, #888 50%, transparent 50%); background-position: calc(100% - 12px) 52%, calc(100% - 8px) 52%; background-size: 4px 4px, 4px 4px; background-repeat: no-repeat; }
      .einput.dark { background: rgba(0,0,0,.45); color: #fff; border-color: rgba(255,255,255,.5); }
      .einput.dark::placeholder { color: rgba(255,255,255,.5); }

      .pill { background: var(--bg-soft); border: 1px solid ${LINE}; border-radius: 999px; padding: 11px 22px; font-size: 11px; color: ${INK}; transition: transform .45s cubic-bezier(.22,1,.36,1), background .25s, border-color .25s; }
      .pill:hover { background: ${INK}; color: ${BG}; border-color: ${INK}; transform: scale(1.05); }

      .pair { display: grid; gap: 12px; grid-template-columns: 1fr; }
      .meta-row { display: flex; flex-wrap: wrap; gap: 20px 32px; }
      .edit-row { display: flex; gap: 6px; flex-wrap: wrap; }
      @media (min-width: 700px) {
        .pair { grid-template-columns: repeat(var(--pc, 2), 1fr); gap: clamp(14px, 2vw, 22px); }
        .meta-row { gap: 24px clamp(32px, 6vw, 64px); }
      }

      @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      .rise { animation: rise .7s cubic-bezier(.2,.6,.2,1) both; }
      @keyframes heroIn { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
      .hero-h1 { animation: heroIn 1s cubic-bezier(.2,.6,.2,1) both; animation-delay: .15s; }
      .pill, .dot, .row, .wblock-title { transition: all .3s cubic-bezier(.2,.6,.2,1); }

      @media (prefers-reduced-motion: reduce) {
        .rise, .hero-h1, .app-in { animation: none; }
        .hero-track { transition: none; }
        .wblock { opacity: 1; transform: none; transition: none; }
        .wblock:hover .wblock-media img, .wblock:hover .wblock-media video { transform: none; }
      }
      @media (max-width: 560px) { .hide-sm { display: none !important; } }
      .hide-nav { display: none !important; }
      @media (min-width: 901px) { .hide-nav { display: revert !important; } }
      .show-nav { display: none !important; }
      @media (max-width: 900px) { .show-nav { display: block !important; } }

      .gallery-grid { grid-template-columns: repeat(2,1fr); align-items: start; }
      @media (max-width: 560px) { .gallery-grid { grid-template-columns: 1fr; } }
      .gal-full { grid-column: span 2; }
      @media (max-width: 560px) { .gal-full { grid-column: auto; } }
      .gal-item { position: relative; border-radius: 8px; overflow: hidden; background: var(--bg-soft); touch-action: pan-x pan-y pinch-zoom; }
      .gal-item img, .gal-item video { width: 100%; height: auto; display: block; }
      .gal-cover { position: relative; border-radius: 8px; overflow: hidden; background: var(--bg-soft); touch-action: pan-x pan-y pinch-zoom; }

      /* Masonry (view) — colunas via flex (distribuídas no JS), sem buracos */
      .gal-masonry .gal-item { margin: 0; width: 100%; }

      .nav-link { background: none; border: none; color: inherit; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; padding: 6px 0; opacity: .65; transition: opacity .2s; cursor: pointer; white-space: nowrap; }
      /* Cluster fixo de controles (direita): tema + idioma */
      .floating-controls { position: fixed; right: clamp(10px,1.6vw,20px); top: 50%; transform: translateY(-50%);
        z-index: 106; display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: auto; }
      .fc-theme { width: 38px; height: 38px; border-radius: 999px; background: ${BG}; border: 1px solid ${LINE};
        color: ${INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,.10); transition: background .2s, color .2s, transform .2s; }
      .fc-theme:hover { transform: scale(1.06); }
      .fc-lang { display: flex; flex-direction: column; align-items: stretch; background: ${BG};
        border: 1px solid ${LINE}; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,.10);
        font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; }
      .fc-lang button { background: none; border: none; color: ${INK}; cursor: pointer; padding: 6px 9px;
        font-size: 10px; letter-spacing: .06em; opacity: .45; transition: opacity .2s, background .2s, color .2s; }
      .fc-lang button.on { opacity: 1; background: ${INK}; color: ${BG}; }
      @media (max-width: 640px) { .floating-controls { right: 8px; gap: 6px; } .fc-theme { width: 34px; height: 34px; } }

      /* Navegação prev/next da página de projeto */
      .proj-nav-btn { max-width: 46%; min-width: 0; color: ${INK}; -webkit-tap-highlight-color: transparent; }
      .proj-nav-btn .mono { color: ${GRAY}; }
      .proj-nav-title { font-size: clamp(18px,3vw,30px); font-weight: 400; letter-spacing: -.03em; color: ${INK}; }
      @media (max-width: 600px) {
        .proj-nav-title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }
      /* Next Wave no navbar — gradiente neon em movimento (a estética do nome) */
      /* cores pré-invertidas: o header usa mix-blend difference, então sobre
         o branco elas viram o neon real do nome (rosa/ciano/amarelo/roxo) */
      .nav-nextwave { opacity: 1 !important; font-weight: 600;
        background: linear-gradient(90deg, #00F05F, #FF0A2B, #0015FF, #4EB100, #00F05F);
        background-size: 300% 100%;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; color: transparent;
        animation: nwGrad 5s linear infinite; }
      @keyframes nwGrad { from { background-position: 0% 50%; } to { background-position: 300% 50%; } }
      .tf-wlogo { font-family: var(--w-sans); pointer-events: auto; }
      /* apple-design: resposta no toque (pointer-down), não só no clique */
      .nav-link { transition: opacity .2s, transform 100ms ease-out; }
      .w-cta, .w-back, .dot, .ebtn { transition: transform 100ms ease-out; }
      .nav-link:active, .w-cta:active, .w-back:active, .dot:active { transform: scale(.97); }
      /* navegação por teclado: foco visível e discreto */
      .tf button:focus-visible, .tf a:focus-visible { outline: 1px solid currentColor; outline-offset: 4px; border-radius: 2px; }
      @media (prefers-reduced-motion: reduce) {
        .hero-track { transition: opacity .2s ease !important; }
        .w-roll > span { transition: opacity .2s ease !important; transform: none !important; }
        .w-roll > span + span { opacity: 0; }
        button:hover > .w-roll > span:first-child { opacity: 0; }
        button:hover > .w-roll > span + span { opacity: 1; }
      }
      /* texto que sobe no hover: o degradê do Next Wave vai para as duas cópias */
      .nav-nextwave .w-roll > span { background: linear-gradient(90deg, #00F05F, #FF0A2B, #0015FF, #4EB100, #00F05F); background-size: 300% 100%; -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; animation: nwGrad 5s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .nav-nextwave { animation: none; } }
      .nav-link:hover { opacity: 1; }

      /* menu mobile — liquid glass moderno */
      .mobile-menu { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; justify-content: center;
        padding: clamp(28px,8vw,64px);
        background: linear-gradient(135deg, rgba(26,22,32,0.66), rgba(14,12,18,0.58));
        backdrop-filter: blur(30px) saturate(1.7); -webkit-backdrop-filter: blur(30px) saturate(1.7);
        animation: menuIn .45s cubic-bezier(.16,1,.3,1); }
      @keyframes menuIn { from { opacity: 0; } to { opacity: 1; } }
      .mobile-menu-list { display: flex; flex-direction: column; gap: 2px; }
      .mobile-menu-item { background: none; border: none; text-align: left; padding: 11px 0;
        color: rgba(255,255,255,.55); font-weight: 500; font-size: clamp(36px,9.5vw,62px);
        line-height: 1.08; letter-spacing: -.03em; cursor: pointer; transform-origin: left;
        transition: color .25s ease, transform .2s cubic-bezier(.16,1,.3,1); }
      .mobile-menu-item.active { color: #fff; }
      .mobile-menu-item:active { transform: scale(.97); }
      .mm-nextwave { font-weight: 700;
        background: linear-gradient(90deg, #FF0FA0, #00F5D4, #FFEA00, #B14EFF, #FF0FA0);
        background-size: 300% 100%; -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; color: transparent;
        animation: nwGrad 5s linear infinite; }
      .mobile-menu-close { position: absolute; top: 20px; right: 20px; width: 42px; height: 42px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
        color: #fff; font-size: 17px; cursor: pointer; line-height: 1;
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }

      /* overscroll elástico + loading (mobile) */
      .pull-wrap { }
      .pull-load { position: fixed; left: 50%; z-index: 150; pointer-events: none;
        display: flex; align-items: center; justify-content: center; transform: translateX(-50%); }
      .pull-load-top { top: clamp(66px,11vh,94px); }
      .pull-load-bottom { bottom: clamp(22px,5vh,44px); }
      .pull-spinner { width: 26px; height: 26px; border-radius: 50%;
        border: 2.5px solid rgba(0,0,0,.14); border-top-color: ${INK};
        animation: pullSpin .7s linear infinite; }
      @keyframes pullSpin { to { transform: rotate(360deg); } }
      .nav-link.active { opacity: 1; border-bottom: 1.5px solid currentColor; padding-bottom: 4px; }

      .scattered-outer { overflow: hidden; cursor: grab; user-select: none; -webkit-user-select: none; height: clamp(500px,68vh,720px); padding-top: clamp(20px,3vh,36px); }

      /* Rodapé masthead — sem blur */
      .site-footer { position: relative; background: ${BG}; border-top: 1px solid ${LINE}; padding: clamp(36px,6vh,64px) clamp(20px,4.5vw,60px) clamp(28px,4vh,48px); overflow: hidden; }
      .site-footer-top { display: flex; flex-wrap: wrap; gap: 26px 48px; justify-content: space-between; align-items: flex-start; margin-bottom: clamp(24px,4vh,44px); }
      .footer-nologo .site-footer-top { margin-bottom: 0; }
      .footer-col { display: flex; flex-direction: column; gap: 7px; }
      .footer-col.right { text-align: right; align-items: flex-end; }
      .footer-lbl { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; color: ${GRAY}; }
      .footer-link { background: none; border: none; padding: 0; font-size: 14px; color: ${INK}; text-decoration: none; cursor: pointer; transition: opacity .2s; text-align: left; align-self: flex-start; }
      .footer-link:hover { opacity: .55; }
      .footer-muted { font-size: 12px; color: #6a6a6a; }
      .footer-nav { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; }
      .footer-navlink { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6a6a6a; background: none; border: none; cursor: pointer; padding: 2px 0; transition: color .2s; }
      .footer-navlink:hover { color: ${INK}; }
      .footer-mark { position: relative; width: 100%; display: flex; justify-content: center; align-items: center; line-height: 0; text-align: center; }
      .footer-mark-text { display: block; width: 100%; text-align: center; white-space: nowrap; font-weight: 700; letter-spacing: -.045em; line-height: .8; color: ${INK}; font-size: 19vw; }
      .footer-mark-img { height: clamp(84px,14vw,180px); width: auto; max-width: 100%; display: block; object-fit: contain; pointer-events: none; user-select: none; }
      @media (max-width: 700px) { .footer-mark-text { font-size: 21vw; } .site-footer-top { gap: 20px 32px; } .footer-col.right { text-align: left; align-items: flex-start; } }

      /* Footer elaborado */
      .footer-grid { display: grid; grid-template-columns: 1.5fr 0.85fr 1fr 0.7fr 0.7fr; gap: clamp(24px,3vw,48px); align-items: start; margin-bottom: clamp(30px,5vh,52px); }
      /* tablet: CTA em largura total + as 4 colunas numa linha só */
      @media (max-width: 900px) { .footer-grid { grid-template-columns: repeat(4, 1fr); column-gap: 24px; row-gap: 34px; } .footer-cta { grid-column: 1 / -1; } }
      /* celular: CTA cheio + colunas 2-a-2 (organizado, sem virar pilha longa) */
      @media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr 1fr; row-gap: 30px; } .footer-col { min-width: 0; } .footer-link { overflow-wrap: anywhere; } }
      @media (max-width: 340px) { .footer-grid { grid-template-columns: 1fr; } }
      .footer-cta-title { font-size: clamp(21px,2.5vw,30px); font-weight: 400; letter-spacing: -.03em; line-height: 1.15; margin-bottom: 12px; max-width: 15ch; }
      .footer-news { position: relative; max-width: 340px; }
      .footer-news input { width: 100%; padding: 12px 46px 12px 16px; border: 1px solid ${LINE}; border-radius: 999px; background: var(--bg-soft); color: ${INK}; font: inherit; font-size: 13px; outline: none; transition: border-color .2s; }
      .footer-news input:focus { border-color: ${INK}; }
      .footer-news input::placeholder { color: ${GRAY}; }
      .footer-news button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border: none; border-radius: 999px; background: ${INK}; color: ${BG}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s; }
      .footer-news button:hover { transform: translateY(-50%) scale(1.06); }
      .footer-social { display: flex; gap: 10px; margin-top: 4px; }
      .footer-soc { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 1px solid ${LINE}; border-radius: 999px; color: ${INK}; transition: background .2s, color .2s, border-color .2s; }
      .footer-soc:hover { background: ${INK}; color: ${BG}; border-color: ${INK}; }
      .footer-theme { display: flex; align-items: center; gap: 9px; color: ${INK}; }
      .footer-lang { display: flex; align-items: center; gap: 5px; margin-top: 14px; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 12px; color: ${INK}; }
      .footer-lang button { background: none; border: none; color: inherit; cursor: pointer; padding: 3px 2px; opacity: .45; transition: opacity .2s; font: inherit; letter-spacing: .06em; }
      .footer-lang button.on { opacity: 1; font-weight: 500; }
      .footer-lang span { opacity: .35; }
      .theme-switch { position: relative; width: 42px; height: 22px; border-radius: 999px; border: 1px solid ${LINE}; background: var(--bg-soft); cursor: pointer; padding: 0; transition: background .2s; }
      .theme-switch.on { background: ${INK}; border-color: ${INK}; }
      .theme-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: ${INK}; transition: transform .25s cubic-bezier(.16,1,.3,1), background .2s; }
      .theme-switch.on .theme-knob { transform: translateX(20px); background: ${BG}; }
      .footer-copy { display: flex; flex-wrap: wrap; gap: 10px 20px; justify-content: space-between; align-items: center; margin-top: clamp(20px,3vh,30px); padding-top: 18px; border-top: 1px solid ${LINE}; }
      .footer-nologo .footer-mark { display: none; }
      html.dark .footer-mark-img { filter: invert(1) hue-rotate(180deg); }
      .footer-anim { width: 100%; height: clamp(240px, 42vh, 480px); }
      .footer-anim canvas { display: block; width: 100%; height: 100%; filter: contrast(.9) brightness(1.1); opacity: .9; }
      /* o logo do rodapé NÃO inverte no dark — fica igual ao do fundo branco */
      html.dark .footer-anim canvas { filter: contrast(.9) brightness(1.1); opacity: .9; }
      /* logo 3D verde (Next Wave) — sem filtro/invert, tamanho do logo do footer */
      .footer-logo3d { width: 100%; height: clamp(240px, 42vh, 480px); }
      /* Next Wave: footer com o design padrão MAS fundo transparente (mostra o
         fundo do Next Wave) e cores fixas — sem dark mode (design próprio). */
      .site-footer--nw { --ink: #171417; --gray: rgba(23,20,23,.55); --line: rgba(23,20,23,.14);
        --bg: transparent; --bg-soft: rgba(0,0,0,.05); background: transparent; }
      /* Next Wave é branco padrão (design próprio) — imune ao dark mode, footer incluso.
         Sem isso, o footer transparente revelava o fundo escuro do dark mode. */
      html.dark .tf.nw-page { --ink: #0A0A0A; --gray: #6B6B6B; --line: #E9E9E9; --bg: #ffffff; --bg-soft: #fafafa; }

      /* Contact — página com as informações (o rodapé fica sem contato) */
      .contact-page { min-height: 100vh; background: ${BG}; display: flex; align-items: center; justify-content: flex-start; padding: clamp(100px,15vh,150px) clamp(20px,5vw,60px); }
      .contact-inner { width: 100%; max-width: 940px; display: flex; flex-direction: column; gap: clamp(28px,5vh,52px); }
      .contact-eyebrow { font-size: 10px; color: ${GRAY}; letter-spacing: .18em; }
      .contact-headline { font-size: clamp(34px,6vw,72px); font-weight: 400; letter-spacing: -.03em; line-height: 1.04; color: ${INK}; max-width: 15ch; margin: 0; }
      .contact-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: clamp(22px,4vw,48px);
        border-top: 1px solid ${LINE}; padding-top: clamp(24px,4vh,40px); }
      .contact-item { display: flex; flex-direction: column; gap: 9px; }
      .contact-label { font-size: 9.5px; color: ${GRAY}; letter-spacing: .16em; }
      .contact-value { font-size: clamp(15px,1.8vw,19px); color: ${INK}; text-decoration: none; word-break: break-word; }
      a.contact-value { transition: opacity .2s; }
      a.contact-value:hover { opacity: .55; }

      .hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.32); border: 1px solid rgba(255,255,255,.22); color: #fff; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: background .2s, opacity .2s; opacity: 0; pointer-events: auto; z-index: 10; }
      .hero-arrow:hover { background: rgba(0,0,0,.62); }
      section:hover .hero-arrow { opacity: 1; }
      :fullscreen .hero-arrow, :-webkit-full-screen .hero-arrow { opacity: 1; }
      .hero-fs-btn { position: absolute; bottom: clamp(20px,4vh,36px); right: clamp(20px,4vw,36px); background: rgba(0,0,0,.32); border: 1px solid rgba(255,255,255,.22); color: #fff; border-radius: 6px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; transition: background .2s; pointer-events: auto; z-index: 10; }
      .hero-fs-btn:hover { background: rgba(0,0,0,.62); }

      /* esconde o cursor nativo só quando há a bolinha (ponteiro fino/mouse);
         no touch (mobile) o cursor customizado é desligado e o toque é normal */
      /* só some quando a bolinha está ligada de verdade (classe no <html>) */
      html.tf-ball .tf:not(.editing), html.tf-ball .tf:not(.editing) * { cursor: none !important; }
      .tf input, .tf textarea, .tf select { cursor: text !important; }
      .tf.editing .cursor-ball { opacity: 0 !important; }
      /* Next Wave: o cursor é a bolinha colorida (ColorBallCursor), que cicla
         a paleta da marca. Esconde o cursor nativo do SO; a bolinha segue o
         ponteiro com precisão (converge exato ao parar) e é pointer-events:none,
         então clicar continua exato. A .cursor-ball do site fica oculta. */
      @media (hover: hover) and (pointer: fine) {
        .tf.nw-page.nw-own-cursor:not(.editing), .tf.nw-page.nw-own-cursor:not(.editing) * { cursor: none !important; }
      }
      /* a página nova do Next Wave não tem cursor próprio: o do site continua */
      .tf.nw-page.nw-own-cursor .cursor-ball { display: none !important; }
      .nw-pulse { animation: nwPulse 1.7s ease-in-out infinite; }
      @keyframes nwPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .3; transform: scale(.72); } }
      .nw-cta { transition: background .2s ease, transform .2s ease; }
      .nw-cta:hover { background: #2a2a2a !important; transform: translateY(-1px); }

      /* ---- Next Wave — footer (Ruixen gradient) ---- */
      .nw-foot { position: relative; z-index: 10; color: #171417; }
      .nw-foot-inner { max-width: 1152px; margin: 0 auto; padding: 72px 24px 0; }
      .nw-foot-grid { display: flex; flex-wrap: wrap; gap: 40px 56px; padding-bottom: 40px; }
      .nw-foot-brand { flex: 1 1 300px; min-width: 240px; }
      .nw-foot-word { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 15px; letter-spacing: .2em; text-transform: uppercase; color: #171417; margin: 0; }
      .nw-foot-word-img { height: 22px; width: auto; object-fit: contain; }
      .nw-foot-tag { margin: 16px 0 0; max-width: 34ch; font-size: 14px; line-height: 1.55; color: rgba(23,20,23,.62); }
      .nw-foot-cols { display: flex; flex-wrap: wrap; gap: 40px 56px; }
      .nw-foot-col { min-width: 120px; }
      .nw-foot-h { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #171417; margin: 0 0 16px; font-weight: 500; }
      .nw-foot-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
      .nw-foot-link { font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: rgba(23,20,23,.62); background: none; border: none; padding: 0; text-align: left; text-decoration: none; transition: color .2s ease; }
      .nw-foot-link:hover { color: #171417; }
      .nw-foot-bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(23,20,23,.14); padding: 22px 0; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: rgba(23,20,23,.55); }
      .nw-foot-status { display: inline-flex; align-items: center; gap: 8px; }
      .nw-foot-dot { width: 6px; height: 6px; border-radius: 50%; background: #12B76A; display: inline-block; }
      @media (prefers-reduced-motion: reduce) { .nw-pulse { animation: none; } }

      .cursor-ball {
        position: fixed; top: 0; left: 0; border-radius: 50%;
        background: #fff; mix-blend-mode: difference;
        pointer-events: none; z-index: 9999;
        will-change: transform, width, height;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; transition: opacity .3s;
      }
      .cursor-view-label {
        font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 9.5px;
        letter-spacing: .22em; text-transform: uppercase;
        color: #fff; font-weight: 500;
        pointer-events: none; user-select: none; white-space: nowrap;
        position: absolute;
      }

      /* ============ NEXT WAVE — novo design (portado do pacote) ============ */
      .nw2-main {
        background: #ffffff; color: #171417; position: relative; overflow: hidden;
        min-height: 100vh;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .nw2-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
      .nw2-wrap { position: relative; z-index: 10; max-width: 1280px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }

      /* fundo fluido (gooey blobs) */
      .nw-fluid-layer { position: absolute; inset: 0; opacity: 0.65; filter: blur(28px) contrast(9); }
      .nw-fluid-cluster { position: absolute; }
      .nw-fluid-dot {
        position: absolute; border-radius: 50%;
        animation-name: nw-fluid-drift; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
      }
      @keyframes nw-fluid-drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(38px, -30px) scale(1.18); }
        50% { transform: translate(-24px, 34px) scale(0.84); }
        75% { transform: translate(-34px, -22px) scale(1.12); }
      }

      /* hero */
      .nw2-hero { padding-top: clamp(72px, 11vh, 104px); }
      /* grid assimétrico: texto/criatura | reel (o reel um pouco maior) */
      .nw2-hero-grid { display: grid; grid-template-columns: 1fr; gap: clamp(28px,4vw,44px); margin-top: clamp(20px,3.5vh,36px); }
      @media (min-width: 900px) { .nw2-hero-grid { grid-template-columns: 0.82fr 1.18fr; gap: clamp(32px,4vw,60px); align-items: center; } }
      .nw2-hero-copy { display: flex; flex-direction: column; gap: clamp(20px,3vh,32px); }
      .nw2-hero-reel { width: 100%; }
      .nw2-sub { max-width: 42rem; font-size: clamp(16px, 2.2vw, 24px); line-height: 1.55; color: #525252; margin: 0; }
      .nw2-anchor {
        margin-top: 28px; display: inline-flex; align-items: center; gap: 8px;
        font-size: 14px; font-weight: 600; text-decoration: underline; text-decoration-thickness: 2px;
        text-underline-offset: 4px; transition: opacity .2s ease;
      }
      .nw2-anchor:hover { opacity: .7; }
      .nw2-labcore { height: 160px; width: 224px; flex-shrink: 0; }
      @media (min-width: 640px) { .nw2-labcore { height: 192px; width: 256px; } }
      /* logo dot-matrix — bem grande, ocupa quase toda a largura da viewport */
      .nw2-logo { width: min(1680px, 96vw); position: relative; left: 50%; transform: translateX(-50%); }
      @media (max-width: 767px) {
        .nw2-hero { padding-top: clamp(40px,7vh,64px); }
        .nw2-labcore { margin: 6px auto 0; }
        .nw2-finale { height: 300px; padding-bottom: 40px; }
        .nw2-sub { font-size: clamp(15px,4.4vw,19px); }
      }

      /* reel */
      .nw2-video-panel {
        aspect-ratio: 16 / 9; width: 100%; overflow: hidden;
        border-radius: 28px; border: 1.5px dashed rgba(155,126,222,0.45); background: #faf8ff;
        transition: transform .5s ease;
      }
      .nw2-video-panel:hover { transform: scale(1.01); }
      .nw2-video-panel.has-video { border-style: solid; border-color: rgba(0,0,0,.08); background: #000; }
      .nw2-video-panel.editable { cursor: pointer; }
      .nw2-video-panel.editable:hover { border-color: rgba(155,126,222,0.85); background: #f3eefe; }
      .nw2-video { height: 100%; width: 100%; object-fit: cover; display: block; }
      .nw2-video-empty { display: flex; height: 100%; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #a3a3a3; }
      .nw2-video-empty .ring { display: flex; height: 48px; width: 48px; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid rgba(23,20,23,0.1); }
      .nw2-video-empty .cap { font-size: 12px; letter-spacing: .04em; }

      /* seções */
      .nw2-section { padding-top: clamp(48px, 7vh, 64px); padding-bottom: clamp(64px, 10vh, 112px); }
      .nw2-h2 { max-width: 36rem; font-size: clamp(24px, 3.5vw, 40px); font-weight: 900; letter-spacing: -0.02em; color: #171417; margin: 0; }
      .nw2-pillars { margin-top: 48px; display: grid; grid-template-columns: 1fr; gap: 40px 48px; }
      @media (min-width: 640px) { .nw2-pillars { grid-template-columns: 1fr 1fr; } }
      /* laboratório assimétrico: título fica numa coluna estreita à esquerda,
         pilares ocupam a coluna larga à direita */
      @media (min-width: 900px) {
        .nw2-lab { display: grid; grid-template-columns: 0.62fr 1.38fr; gap: clamp(40px,5vw,80px); align-items: start; }
        .nw2-lab .nw2-pillars { margin-top: 6px; }
        .nw2-lab-head { position: sticky; top: 96px; }
      }
      .nw2-bar { display: block; height: 4px; width: 32px; margin-bottom: 12px; transition: width .3s ease; }
      .nw2-pillar:hover .nw2-bar { width: 56px; }
      .nw2-pillar h3 { font-size: clamp(24px, 3vw, 30px); font-weight: 900; letter-spacing: -0.02em; margin: 0; }
      .nw2-pillar p { margin: 8px 0 0; max-width: 20rem; font-size: 14px; line-height: 1.5; color: #525252; }

      /* open call */
      .nw2-opencall { border-top: 1px solid #f5f5f5; padding-top: clamp(48px, 7vh, 64px); padding-bottom: clamp(64px, 10vh, 112px); }
      .nw2-body { margin-top: 16px; max-width: 42rem; font-size: clamp(14px, 1.6vw, 16px); line-height: 1.55; color: #525252; }
      .nw2-cta {
        margin-top: 32px; display: inline-flex; align-items: center; gap: 8px;
        border-radius: 9999px; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #fff;
        text-decoration: none; transition: transform .3s ease;
      }
      .nw2-cta:hover { transform: translateY(-2px); }
      .nw2-email { margin-top: 12px; font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 500; font-size: 11px; letter-spacing: .06em; color: #a3a3a3; }

      /* finale */
      .nw2-finale { position: relative; z-index: 10; margin: 0 auto; height: 380px; width: 100%; max-width: 768px; padding: 0 24px 64px; }
      @media (min-width: 640px) { .nw2-finale { height: 600px; padding-bottom: 96px; } }

      @media (prefers-reduced-motion: reduce) { .nw-fluid-dot { animation: none !important; } }

      /* botão voltar (global) */
      .back-pill { position: fixed; top: clamp(60px,8.5vh,84px); left: clamp(16px,4.5vw,60px); z-index: 105;
        display: inline-flex; align-items: center; gap: 7px;
        background: ${BG}; border: 1px solid ${LINE}; color: ${INK}; border-radius: 999px;
        padding: 9px 16px; font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
        cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.06); pointer-events: auto;
        transition: transform .2s cubic-bezier(.2,.6,.2,1), box-shadow .2s; }
      .back-pill .bp-arrow { font-size: 13px; line-height: 1; letter-spacing: 0; display: block; }
      .back-pill:hover { transform: translateX(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
      /* no mobile: só a setinha, num círculo perfeitamente centralizado */
      @media (max-width: 700px) {
        .back-pill { top: 50px; left: 14px; padding: 0; width: 36px; height: 36px; gap: 0;
          align-items: center; justify-content: center; letter-spacing: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,.14); }
        .back-pill .bp-label { display: none; }
        .back-pill .bp-arrow { font-size: 16px; line-height: 1; }
      }

      /* ============ ALL WORKS — grade de 12 colunas, larguras 6/2/4 ============ */
      .aw-page { padding-top: 84px; }
      .aw-head { display: flex; align-items: baseline; justify-content: space-between;
        gap: 16px 32px; flex-wrap: wrap; padding-top: clamp(18px,5vh,64px); }
      .aw-title { font-size: clamp(46px,12vw,180px); font-weight: 400; line-height: .88;
        letter-spacing: -.045em; text-transform: uppercase; margin: 0; }
      .aw-count { font-size: 11px; color: ${GRAY}; white-space: nowrap; }
      .aw-filt-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 10px;
        font-size: 11px; padding: clamp(30px,6vh,72px) 0 clamp(30px,6vh,70px); }
      .aw-filt-item { display: inline-flex; gap: 10px; }
      .aw-filt { background: none; border: none; padding: 0; font: inherit; letter-spacing: inherit;
        text-transform: inherit; color: ${GRAY}; transition: color .2s ease; }
      .aw-filt:hover, .aw-filt.on { color: ${INK}; }
      .aw-filt.on::before { content: "\\2022  "; }
      .aw-filt-sep { color: ${LINE}; }
      html.dark .aw-filt-sep { color: #444; }
      /* Uma fileira por projeto: capa + 3 mídias da galeria, alinhadas pela
         base. A capa tem largura fixa e as outras dividem o resto; a altura
         de cada uma sai da proporção real da peça. */
      .aw-grid { display: flex; flex-direction: column; gap: clamp(48px,8vh,96px); }
      .aw-strip { display: flex; align-items: flex-end; gap: clamp(8px,1vw,14px); }
      .aw-grid .wblock-media { background: var(--bg-soft); cursor: pointer; }
      .aw-grid .wblock-media img, .aw-grid .wblock-media video { width: 100%; height: 100%; object-fit: cover; display: block; }
      .aw-cover { flex: 0 0 40%; }
      .aw-extra { flex: 1 1 0; min-width: 0; max-height: 70vh; }
      .aw-grid .wblock-info { border-top: none; margin-top: 0; padding-top: 10px; }
      .aw-grid .wblock-title { font-size: 14px; min-height: 0; line-height: 1.3; cursor: pointer; }
      .aw-grid .wblock-meta .mono { font-size: 10px; color: ${GRAY}; white-space: nowrap; }
      /* No celular a capa ocupa a linha toda e as outras três ficam embaixo,
         ainda alinhadas pela base. */
      @media (max-width: 760px) {
        .aw-strip { flex-wrap: wrap; gap: 6px; }
        .aw-cover { flex-basis: 100%; }
      }

      /* ============ ABOUT — editorial, blocos em zigue-zague ============ */
      .about-page { padding-top: 84px; padding-bottom: clamp(50px,10vh,120px); }
      .about-hero { min-height: calc(100vh - 84px); min-height: calc(100lvh - 84px);
        display: flex; flex-direction: column; justify-content: center; gap: clamp(18px,3vh,30px); }
      .about-label { display: block; font-size: 10px; color: ${GRAY}; }
      .about-lead { font-size: clamp(30px,5vw,76px); font-weight: 400; line-height: 1.06;
        letter-spacing: -.035em; max-width: 20ch; text-wrap: balance; margin: 0; }
      .about-sec { display: grid; grid-template-columns: repeat(12, 1fr);
        column-gap: clamp(10px,1vw,14px); row-gap: clamp(22px,4vh,46px);
        padding-top: clamp(56px,15vh,190px); align-items: start; }
      .about-close { padding-bottom: clamp(30px,8vh,90px); }
      .about-block-head { display: flex; align-items: baseline; gap: 12px;
        margin-bottom: clamp(10px,1.6vh,16px); }
      .about-block-t { font-size: clamp(23px,2.9vw,40px); font-weight: 400; line-height: 1.1;
        letter-spacing: -.03em; margin: 0; }
      .about-block-n { font-size: 10px; color: ${GRAY}; }
      .about-block-list, .about-clients { list-style: none; margin: 0; padding: 0;
        font-size: clamp(15px,1.3vw,18px); line-height: 1.75; color: ${GRAY}; }
      .about-block-list button { background: none; border: none; padding: 0; font: inherit;
        color: inherit; text-align: left; transition: color .2s ease; }
      .about-block-list button:hover { color: ${INK}; }
      /* Os pares descem um pouco mais: quebra o alinhamento por fileira. */
      .about-practice > .about-block:nth-of-type(even) { margin-top: clamp(0px,5vh,64px); }
      @media (max-width: 860px) {
        .about-sec { display: flex; flex-direction: column;
          gap: clamp(18px,3vh,30px); padding-top: clamp(48px,10vh,90px); }
        .about-sec > * { margin-top: 0 !important; }
      }
      /* ---- revisão de design (HIG): tamanhos mínimos e áreas de toque ---- */
      /* rótulos pequenos nunca abaixo de 11px (antes 9.5–10px) */
      .footer-lbl, .aw-grid .wblock-meta .mono, .nw2-email { font-size: 11px; }
      .mono { letter-spacing: .09em; }
      .nav-link { font-size: 12.5px; letter-spacing: .09em; }
      /* bolinhas do hero: visual de 7px, área de clique de 28px */
      .dot { position: relative; }
      .dot::after { content: ""; position: absolute; inset: -11px; }
      /* indicadores do carrossel: a pílula cresce e encolhe suave; dentro dela a barra marca o tempo do slide */
      .tf:not(.editing) .dots { gap: 8px; }
      .tf:not(.editing) .dot { width: 7px; height: 7px; background: rgba(255,255,255,.34);
        transition: width .7s cubic-bezier(.22,1,.36,1), background .4s ease, transform 100ms ease-out; }
      .tf:not(.editing) .dot.on { width: 38px; background: rgba(255,255,255,.28); }
      .tf:not(.editing) .dot:hover:not(.on) { background: rgba(255,255,255,.7); }
      .dot i { position: absolute; inset: 0; border-radius: inherit; background: #fff; clip-path: inset(0 100% 0 0 round 999px); pointer-events: none; }
      .dot.on i { animation: tfDotFill 15s linear forwards; }
      @keyframes tfDotFill { from { clip-path: inset(0 100% 0 0 round 999px); } to { clip-path: inset(0 0 0 0 round 999px); } }
      @media (prefers-reduced-motion: reduce) { .dot.on i { animation: none; clip-path: none; } }
      /* links do rodapé e idioma com área de toque confortável */
      .footer-navlink, .footer-lang button { min-height: 28px; padding: 5px 0; }
      @media (pointer: coarse) { .footer-navlink, .footer-lang button, .nav-link { min-height: 44px; } }
      /* navbar mais elegante: minúsculas, peso regular, sublinhado fino animado */
      .tf:not(.editing) .tf-header { padding: max(20px, env(safe-area-inset-top)) clamp(18px, 3.2vw, 48px) 20px; }
      .tf:not(.editing) .tf-header > div { gap: clamp(18px, 2.4vw, 34px) !important; }
      .tf:not(.editing) .nav-link { position: relative; font-size: 18px; font-weight: 400; letter-spacing: -.005em; text-transform: none; opacity: .62; padding: 6px 0; border-bottom: 0; }
      .tf:not(.editing) .nav-link:hover, .tf:not(.editing) .nav-link.active { opacity: 1; }
      .tf:not(.editing) .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: currentColor;
        transform: scaleX(0); transform-origin: right; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
      .tf:not(.editing) .nav-link.active::after { transform: scaleX(1); transform-origin: left; }
      .tf:not(.editing) .nav-link.nav-nextwave::after { background: linear-gradient(90deg, #00F05F, #FF0A2B, #0015FF); }
      .tf-wlogo { font-size: 15px; font-weight: 500; letter-spacing: .005em; gap: 10px; }
      .tf-wlogo .w-logo-mark { width: 18px; height: 18px; }
      /* menu do celular: folha branca, links grandes que sobem em sequência */
      .mm-toggle { width: 44px; height: 44px; margin-right: -10px; background: none; border: 0; color: inherit; position: relative; pointer-events: auto; cursor: pointer; }
      .mm-toggle i, .mm-close i { position: absolute; left: 12px; right: 12px; height: 1.5px; background: currentColor; border-radius: 2px; }
      .mm-toggle i:first-child { top: 18px; } .mm-toggle i:last-child { top: 25px; }
      .mm { position: fixed; inset: 0; z-index: 300; display: flex; flex-direction: column; background: #FFFFFF; color: #111214;
        padding: max(12px, env(safe-area-inset-top)) clamp(18px, 5vw, 32px) max(24px, env(safe-area-inset-bottom)); animation: mmIn .45s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes mmIn { from { opacity: 0; transform: translateY(-12px); } }
      .mm-top { display: flex; justify-content: space-between; align-items: center; min-height: 56px; }
      .mm-close { width: 44px; height: 44px; margin-right: -10px; position: relative; background: none; border: 0; color: inherit; cursor: pointer; }
      .mm-close i { top: 21px; } .mm-close i:first-child { transform: rotate(45deg); } .mm-close i:last-child { transform: rotate(-45deg); }
      .mm-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
      .mm-item { align-self: flex-start; background: none; border: 0; padding: 6px 0; color: inherit; font-family: 'Inter Tight', sans-serif;
        font-size: clamp(40px, 12vw, 64px); font-weight: 300; letter-spacing: -.055em; line-height: 1; text-align: left; cursor: pointer;
        animation: mmItem .7s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes mmItem { from { opacity: 0; transform: translateY(24px); } }
      .mm-item.on { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .14em; }
      .mm-item.nw { background: linear-gradient(90deg, #00F05F, #FF0A2B, #0015FF, #4EB100); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      .mm-item:active { transform: scale(.98); }
      .mm-foot { display: flex; flex-direction: column; gap: 6px; padding-top: 18px; border-top: 1px solid rgba(17,18,20,.1); font-size: 15px; }
      .mm-foot a { color: #3B3D41; min-height: 36px; display: flex; align-items: center; }
      html.mm-open, html.mm-open body { overflow: hidden; }
      @media (prefers-reduced-motion: reduce) { .mm, .mm-item { animation: none; } }
      .tf:not(.editing) .nav-nextwave, .tf:not(.editing) .nav-nextwave .w-roll > span { background: none !important; -webkit-text-fill-color: currentColor !important; color: inherit !important; animation: none !important; font-weight: 400; }
      .tf:not(.editing) .nav-link.nav-nextwave::after { background: currentColor; }
      .mm-item.nw { background: none; -webkit-text-fill-color: currentColor; }
      /* hero da Home no celular: quadro menos alto (menos corte no vídeo) */

      /* uma só margem lateral para o site inteiro: menu, conteúdo, rodapé e páginas novas alinham na mesma borda */
      :root { --tf-gutter: clamp(18px, 3.6vw, 56px); }
      .tf .pad { padding-left: var(--tf-gutter) !important; padding-right: var(--tf-gutter) !important; }
      .tf:not(.editing) .tf-header { padding-left: var(--tf-gutter); padding-right: var(--tf-gutter); }
      .tf .wk { --wk-pad: var(--tf-gutter); }
      .tf .w-root { --w-edge: var(--tf-gutter); }
      .tf .mm { padding-left: var(--tf-gutter); padding-right: var(--tf-gutter); }
      .tf-editbtn { border-radius: 999px !important; padding: 4px 12px !important; font-size: 11px !important; opacity: .7; }
    `}</style>
  );
}

/* ============================ header ============================ */

// Marca do canto (aparece em todas as páginas) — usa `markLogo`, um asset
// próprio, separado do wordmark grande do rodapé (`logo`). Imagem renderiza
// em blend normal (cores reais); o texto padrão adapta via mix-blend do header.
function Logo({ s, edit, patch, onClick, height = "clamp(18px, 2.5vw, 24px)" }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => patch({ markLogo: r.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
      <button onClick={onClick} style={{ background: "none", border: "none", padding: 0,
                                         color: "inherit", display: "flex", alignItems: "center" }}>
        {s.markLogo ? (
          <img src={s.markLogo} alt={s.logoText || "THE FORCE"}
               style={{ height, width: "auto", display: "block", mixBlendMode: "normal", isolation: "isolate" }} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: height, letterSpacing: "-.02em", lineHeight: 1 }}>
            {s.logoText || "THE FORCE"}
          </span>
        )}
      </button>
      {edit && (
        <>
          <button className="ebtn dark" style={{ padding: "2px 6px", fontSize: 9 }}
                  onClick={() => ref.current?.click()}>⇪ marca</button>
          {s.markLogo && (
            <button className="ebtn dark" style={{ padding: "2px 6px", fontSize: 9 }}
                    onClick={() => patch({ markLogo: null })}>txt</button>
          )}
          <input ref={ref} type="file" accept="image/svg+xml,image/*" hidden onChange={onFile} />
        </>
      )}
    </div>
  );
}

function Header({ s, edit, setEdit, allowEdit, save, onAdd, onExport, onReset, goHome, patchSettings, goWork, goNextWave, goAbout, goContact, goCareers, page }: any) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang } = useLang() as any;
  // rolando para baixo o cabeçalho sai (não fica em cima do texto); rolando para cima ele volta
  const [tuck, setTuck] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY, d = y - last;
      if (Math.abs(d) < 6) return;
      setTuck(d > 0 && y > 140);
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setTuck(false); }, [page]);

  const navItems = [
    { label: t("nav.home"),     nextwave: false, active: page === "home",      fn: goHome },
    { label: t("nav.about"),    nextwave: false, active: page === "about",     fn: goAbout },
    { label: t("nav.work"),     nextwave: false, active: page === "all",       fn: goWork },
    { label: t("nav.nextwave"), nextwave: true,  active: page === "nextwave",  fn: goNextWave },
    { label: t("nav.contact"),  nextwave: false, active: page === "contact",   fn: goContact },
    { label: lang === "pt" ? "Carreiras" : "Careers", nextwave: false, active: page === "careers", fn: goCareers },
  ];

  const goNav = (fn: any, e: React.MouseEvent) => {
    fn(e.clientX, e.clientY);
    setMobileOpen(false);
  };
  // com o menu aberto a página por trás não rola
  useEffect(() => {
    document.documentElement.classList.toggle("mm-open", mobileOpen);
    const l = (window as any).__tfLenis?.(); if (mobileOpen) l?.stop?.(); else l?.start?.();
    return () => document.documentElement.classList.remove("mm-open");
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && (
        <div className="mm" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mm-top">
            <span className="w-logo tf-wlogo"><WorldMark className="w-logo-mark" />THE FORCE</span>
            <button className="mm-close" aria-label="Close" onClick={() => setMobileOpen(false)}><i /><i /></button>
          </div>
          <nav className="mm-list">
            {navItems.map((item, k) => (
              <button key={item.label} style={{ animationDelay: `${80 + k * 55}ms` }}
                className={`mm-item${item.active ? " on" : ""}${item.nextwave ? " nw" : ""}`}
                onClick={(e) => goNav(item.fn, e)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mm-foot">
            <a href={`mailto:${s.contactEmail || "theforce@theforce.cc"}`}>{s.contactEmail || "theforce@theforce.cc"}</a>
            <a href={`https://instagram.com/${String(s.contactInstagram || "@theforcex").replace(/^@/, "")}`} target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
        </div>
      )}

      <header className={`tf-header${tuck && !edit && !mobileOpen ? " tf-tuck" : ""}`}>
        {/* clicar no wordmark THE FORCE não navega (só o menu HOME leva pra home) */}
        {edit
          ? <Logo s={s} edit={edit} patch={patchSettings} onClick={undefined} />
          : <span className="w-logo tf-wlogo"><WorldMark className="w-logo-mark" />THE FORCE</span>}
        <div style={{ display: "flex", gap: "clamp(12px,2.5vw,32px)", alignItems: "center", pointerEvents: "auto" }}>
          <button className={`nav-link hide-nav ${page === "home" ? "active" : ""}`} onClick={(e) => goHome(e.clientX, e.clientY)}><WorldRoll>{t("nav.home")}</WorldRoll></button>
          <button className={`nav-link hide-nav ${page === "about" ? "active" : ""}`} onClick={(e) => goAbout(e.clientX, e.clientY)}><WorldRoll>{t("nav.about")}</WorldRoll></button>
          <button className={`nav-link hide-nav ${page === "all" ? "active" : ""}`} onClick={(e) => goWork(e.clientX, e.clientY)}><WorldRoll>{t("nav.work")}</WorldRoll></button>
          <button className={`nav-link nav-nextwave hide-nav ${page === "nextwave" ? "active" : ""}`} onClick={(e) => goNextWave(e.clientX, e.clientY)}><WorldRoll>{t("nav.nextwave")}</WorldRoll></button>
          <button className={`nav-link hide-nav ${page === "contact" ? "active" : ""}`} onClick={(e) => goContact(e.clientX, e.clientY)}><WorldRoll>{t("nav.contact")}</WorldRoll></button>
          {edit && <span style={{ width: 1, height: 14, background: "currentColor", opacity: .25, flexShrink: 0 }} className="hide-nav" />}
          {edit && <span className="mono hide-sm"
                style={{ fontSize: 9.5, minWidth: 44, textAlign: "right",
                         opacity: save === "error" ? 1 : .6,
                         color: save === "error" ? "#ff5c47" : "inherit" }}>
            {save === "saving" ? t("save.saving") : save === "saved" ? t("save.saved") : save === "error" ? t("save.error") : ""}
          </span>}
          {edit && (
            <>
              <button className="ebtn dark hide-sm" onClick={onReset}>↺</button>
              <button className="ebtn dark hide-sm" onClick={onExport}>⇩</button>
              <button className="ebtn dark" onClick={onAdd}>+</button>
            </>
          )}
          {allowEdit && (
            <button className="ebtn dark tf-editbtn" onClick={() => setEdit(!edit)}
                    style={edit ? { background: "#fff", color: "#000", borderStyle: "solid" } : undefined}>
              {edit ? "editing ✓" : "edit"}
            </button>
          )}
          <button className="show-nav mm-toggle" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}>
            <i /><i />
          </button>
        </div>
      </header>
    </>
  );
}

// Cluster fixo na direita: só o seletor de idioma (o tema fica no footer).
function FloatingControls() {
  const { lang, setLang } = useLang();
  return (
    <div className="floating-controls">
      <div className="fc-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
      </div>
    </div>
  );
}

function Menu({ s, close, goWork }: any) {
  const items = ["Work", "Studio", "Galpão", "Contact"];
  return (
    <div onClick={close} className="pad"
         style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(255,255,255,.98)",
                  display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {items.map((it, i) => (
        <button key={it} onClick={(e) => { e.stopPropagation(); if (i === 0) goWork(); }}
          style={{ background: "none", border: "none", textAlign: "left", padding: "3px 0",
                   color: i === 0 ? INK : "#cfcfcf", fontWeight: 500,
                   fontSize: "clamp(36px,8.5vw,78px)", lineHeight: 1.14, letterSpacing: "-.035em",
                   cursor: i === 0 ? "pointer" : "default" }}>
          {it}
          {i !== 0 && <span className="mono" style={{ fontSize: 9.5, marginLeft: 12, verticalAlign: "middle" }}>soon</span>}
        </button>
      ))}
      <span className="mono" style={{ marginTop: 40, fontSize: 11, color: GRAY }}>{s.contactEmail}</span>
    </div>
  );
}

/* ============================ home ============================ */

function Home({ s, projects, edit, patchSettings, patchProject, move, moveHero, toggleHero, toggleFeatured, moveFeatured, open, allWork }: any) {
  const { t, tx, tl } = useLang();
  const [showEditor, setShowEditor] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const byId = Object.fromEntries(projects.map((p: any) => [p.id, p]));
  const heroes = s.heroIds.map((id: string) => (byId as any)[id]).filter(Boolean);
  const featuredIds: string[] = s.featuredIds || [];
  const selected = featuredIds
    .map((id: string) => (byId as any)[id])
    .filter(Boolean)
    .slice(0, s.selectedCount);

  return (
    <main>
      {showEditor && (
        <SelectedEditor
          projects={projects} featuredIds={featuredIds}
          onClose={() => setShowEditor(false)}
          onToggle={toggleFeatured} onMove={moveFeatured}
        />
      )}
      {showHeroEditor && (
        <HeroEditor
          projects={projects} heroIds={s.heroIds}
          onClose={() => setShowHeroEditor(false)}
          onToggle={toggleHero} onMove={moveHero}
        />
      )}
      {/* hero = capas dos Selected Works (segue featuredIds/selectedCount), 15s cada */}
      <HeroCarousel heroes={edit ? selected : selected.slice(0, 4)} s={s} edit={edit}
                    patchSettings={patchSettings} patchProject={patchProject}
                    moveHero={moveFeatured} open={open} />

      {!edit && <WorkIntro />}
      {!edit && <WorkSelected projects={selected} open={(id) => open(id)} all={() => allWork()} title={tl(s.selectedTitle, "home.selected")} />}
      {edit && <section style={{ paddingTop: "clamp(56px,8vh,88px)", paddingBottom: "clamp(56px,8vh,88px)" }}>
        <div className="pad" style={{ marginBottom: "clamp(26px,5vh,44px)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            {edit ? (
              <input className="einput" value={s.selectedTitle}
                     onChange={(e) => patchSettings({ selectedTitle: e.target.value })}
                     style={{ fontSize: "clamp(30px,5.4vw,54px)", fontWeight: 400, letterSpacing: "-.03em", maxWidth: 480 }} />
            ) : (
              <h2 style={{ fontSize: "clamp(28px,4.8vw,52px)", fontWeight: 400, letterSpacing: "-.03em" }}>
                {tl(s.selectedTitle, "home.selected")}
              </h2>
            )}
            {edit && (
              <button className="ebtn" onClick={() => setShowEditor(true)}
                      style={{ fontSize: 11, padding: "6px 14px" }}>
                ✎ selecionar projetos
              </button>
            )}
          </div>
          {edit && (
            <div className="edit-row" style={{ marginTop: 12, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 9.5, color: GRAY }}>mostrar</span>
              {[3, 6, 9, 12].map((n) => (
                <button key={n} className={`ebtn ${s.selectedCount === n ? "on" : ""}`}
                        style={{ padding: "3px 9px" }}
                        onClick={() => patchSettings({ selectedCount: n })}>{n}</button>
              ))}
              <span className="mono" style={{ fontSize: 9.5, color: GRAY, marginLeft: 6 }}>
                {featuredIds.length} selecionados
              </span>
            </div>
          )}
        </div>

        {selected.length === 0 ? (
          <div className="pad">
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 4, padding: "44px 20px",
                          textAlign: "center", color: "#bdbdbd", fontSize: 14 }}>
              Nenhum destaque — em All work, marque ★ nos projetos que devem aparecer aqui.
            </div>
          </div>
        ) : (
          <div className="pad work-grid no-reveal">
            {selected.map((p: any) => (
              <WorkBlock key={p.id} p={p} edit={edit} open={open}
                         categories={s.categories}
                         patch={(x: any) => patchProject(p.id, x)} />
            ))}
          </div>
        )}

        <div className="pad" style={{ marginTop: "clamp(30px,6vh,56px)" }}>
          {edit ? (
            <input className="einput" value={s.allCta}
                   onChange={(e) => patchSettings({ allCta: e.target.value })}
                   style={{ maxWidth: 260, fontSize: 12 }} />
          ) : (
            <button className="pill mono" onClick={(e) => allWork(e.clientX, e.clientY)}>{tl(s.allCta, "home.allcta")} →</button>
          )}
        </div>
      </section>}

      {edit && <TrustedBy s={s} edit={edit} patch={patchSettings} />}
    </main>
  );
}

function HeroCarousel({ heroes, s, edit, patchSettings, patchProject, moveHero, open, onOpenHeroEditor }: any) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState<any>(null);
  const [isFs, setIsFs] = useState(false);
  const vids = useRef<any>({});
  const fallback = useRef<any>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFs = () => {
    if (!document.fullscreenElement) {
      sectionRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const n = heroes.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => { if (i >= n && n > 0) setI(0); }, [n, i]);

  useEffect(() => {
    Object.entries(vids.current).forEach(([k, v]: any) => {
      if (!v) return;
      if (Number(k) === i) { v.currentTime = sourceOf(heroes[i])?.start || 0; v.play?.().catch(() => {}); }
      else v.pause?.();
    });
    if (fallback.current) clearTimeout(fallback.current);
    // 15s por slide (vídeo ou imagem), depois avança pro próximo Selected Work
    if (n > 1) {
      fallback.current = setTimeout(() => go(i + 1), 15000);
    }
    return () => { if (fallback.current) clearTimeout(fallback.current); };
  }, [i, n, heroes, go]);

  const onTouchStart = (e: any) => setDrag({ x: e.touches[0].clientX, dx: 0 });
  const onTouchMove = (e: any) => drag && setDrag({ ...drag, dx: e.touches[0].clientX - drag.x });
  const onTouchEnd = () => {
    if (!drag) return;
    if (Math.abs(drag.dx) > 55) go(i + (drag.dx < 0 ? 1 : -1));
    setDrag(null);
  };

  // Drag com MOUSE (desktop), igual ao swipe do toque. pointerType !== mouse cai
  // nos handlers de toque acima (mobile intacto). setPointerCapture segue o mouse
  // mesmo saindo da área; preventDefault mata o arrasto nativo da imagem/vídeo.
  const onPointerDown = (e: any) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ x: e.clientX, dx: 0, mouse: true });
  };
  const onPointerMove = (e: any) => {
    if (!drag?.mouse || e.pointerType !== "mouse") return;
    setDrag({ ...drag, dx: e.clientX - drag.x });
  };
  const onPointerUp = () => {
    if (!drag?.mouse) return;
    if (Math.abs(drag.dx) > 40) go(i + (drag.dx < 0 ? 1 : -1));
    setDrag(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  if (!n) {
    return (
      <section className="hero-full" style={{ background: "#000", position: "relative" }}>
        <LaserPlaceholder />
        <div className="pad" style={{ position: "absolute", inset: 0, display: "flex",
                                      flexDirection: "column", justifyContent: "flex-end",
                                      paddingBottom: "clamp(40px,10vh,90px)" }}>
          <HeroHeadline s={s} edit={edit} patch={patchSettings} />
          <p className="mono" style={{ marginTop: 18, fontSize: 11, color: "rgba(255,255,255,.7)" }}>
            Nenhum vídeo no hero — em All work, marque ▶ nos projetos que devem entrar no carrossel.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="hero-full" style={{ position: "relative", background: "#000", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none" }}
             onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
             onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
             onDragStart={(e) => e.preventDefault()}>
      <div className={`hero-track${drag ? " hero-dragging" : ""}`}
           style={{ transform: `translateX(calc(${-i * 100}% + ${drag?.dx || 0}px))`, willChange: "transform" }}>
        {heroes.map((p: any, k: number) => {
          const src = sourceOf(p);
          return (
            <div className={`hero-slide${k === i ? " on" : ""}`} key={p.id}>
              {src?.type === "video" ? (
                <video ref={(el) => { vids.current[k] = el; if (el) { el.muted = true; el.setAttribute("muted", ""); } }} src={src.src}
                       poster={(src as any).poster} muted loop playsInline preload="metadata" draggable={false}
                       style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
              ) : src?.type === "image" ? (
                <img src={src.src} alt={p.title} draggable={false}
                     style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
              ) : (
                <LaserPlaceholder label={p.title} />
              )}
            </div>
          );
        })}
      </div>

      <div className="pad" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    justifyContent: "flex-end", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + clamp(56px,12vh,110px))",
                    background: "linear-gradient(transparent 38%, rgba(0,0,0,.58))", pointerEvents: "none" }}>
        <HeroHeadline s={s} edit={edit} patch={patchSettings} />
        <div className="dots" style={{ marginTop: "clamp(22px,4vh,34px)", pointerEvents: "auto" }}>
          {heroes.map((p: any, k: number) => (
            <button key={p.id} className={`dot ${k === i ? "on" : ""}`}
                    aria-label={`ir para ${p.title}`} onClick={() => go(k)}>
              {/* a barra enche no tempo do slide (15s); a key reinicia a cada troca */}
              <i key={k === i ? `on-${i}` : "off"} />
            </button>
          ))}
        </div>
        {edit && (
          <div className="edit-row" style={{ marginTop: 14, pointerEvents: "auto" }}>
            <HeroSlideEditor p={heroes[i]} patch={(x: any) => patchProject(heroes[i].id, x)} />
            <button className="ebtn dark" onClick={() => moveHero(heroes[i].id, -1)}>←</button>
            <button className="ebtn dark" onClick={() => moveHero(heroes[i].id, +1)}>→</button>
            <button className="ebtn dark" onClick={() => open(heroes[i].id)}>✎ projeto</button>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroSlideEditor({ p, patch }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const compress = useVideoCompress();
  const onFile = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    const fileToUpload = await compress.maybeCompress(f);
    const result = await uploadMedia(fileToUpload);
    patch({ cover: result });
  };
  return (
    <>
      <input className="einput dark mono" value={p.videoUrl || ""}
             placeholder="cole o link do vídeo (fica salvo)"
             onChange={(e) => patch({ videoUrl: e.target.value })}
             style={{ maxWidth: 280, fontSize: 9.5 }} />
      <button className="ebtn dark" onClick={() => ref.current?.click()}>⇪ upload</button>
      {(p.gallery || []).length > 0 && (
        <button className="ebtn dark" onClick={() => setPickerOpen(v => !v)} title="escolher da galeria">📁</button>
      )}
      {p.cover && <button className="ebtn dark" onClick={() => patch({ cover: null })}>✕</button>}
      {pickerOpen && (
        <GalleryPicker
          gallery={p.gallery || []}
          onPick={(item) => {
                const newGallery = (p.gallery || []).filter((g: any) => g.src !== item.src);
                if (p.cover) newGallery.unshift(p.cover);
                patch({ cover: item, gallery: newGallery });
                setPickerOpen(false);
              }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <input ref={ref} type="file" accept="video/*,image/*" hidden onChange={onFile} />
      {compress.ui}
    </>
  );
}

function HeroHeadline({ s, edit, patch }: any) {
  if (edit)
    return (
      <textarea className="einput dark" rows={2} value={s.heroHeadline}
                onChange={(e) => patch({ heroHeadline: e.target.value })}
                style={{ fontWeight: 400, fontSize: "clamp(34px,6.4vw,74px)", lineHeight: 1.06,
                         letterSpacing: "-.03em", maxWidth: 900, resize: "vertical", pointerEvents: "auto" }} />
    );
  return (
    <h1 className="hero-h1" style={{ color: "#fff", fontWeight: 400, fontSize: "clamp(36px,6.8vw,78px)",
                                     lineHeight: 1.06, letterSpacing: "-.03em", maxWidth: 920 }}>
      {s.heroHeadline}
    </h1>
  );
}

function LaserPlaceholder({ label }: any) {
  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                  background: "radial-gradient(120% 90% at 68% 12%, #1c1c1c 0%, #000 62%)" }}>
      {[12, 28, 44, 58, 72, 88].map((x, i) => (
        <div key={i} style={{ position: "absolute", top: "-12%", left: `${x}%`, width: 1.5, height: "124%",
          background: "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.12), rgba(255,255,255,0))",
          transform: `rotate(${(i - 2.5) * 6}deg)`, transformOrigin: "top" }} />
      ))}
      {label && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <span style={{ fontWeight: 500, fontSize: "clamp(26px,5vw,56px)", letterSpacing: "-.03em",
                         color: "rgba(255,255,255,.1)", padding: "0 8vw", textAlign: "center" }}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function TrustedBy({ s, edit, patch }: any) {
  const { tl } = useLang();
  const setClient = (id: string, p: any) => patch({ clients: s.clients.map((c: any) => (c.id === id ? { ...c, ...p } : c)) });
  const removeClient = (id: string) => patch({ clients: s.clients.filter((c: any) => c.id !== id) });
  const addClient = () => {
    if (s.clients.length >= 24) return;
    patch({ clients: [...s.clients, { id: "c" + Date.now().toString(36), name: "Nova marca", logo: null }] });
  };
  return (
    <section style={{ paddingTop: "clamp(22px,3.5vh,40px)", paddingBottom: "clamp(40px,6vh,64px)", borderTop: `1px solid ${LINE}` }}>
      <div className="pad" style={{ marginBottom: "clamp(20px,3vh,28px)" }}>
        {edit ? (
          <input className="einput" value={s.trustedLabel}
                 onChange={(e) => patch({ trustedLabel: e.target.value })}
                 style={{ maxWidth: 220, fontSize: 20, color: GRAY }} />
        ) : (
          <h2 style={{ fontSize: "clamp(16px,2vw,22px)", fontWeight: 400, color: GRAY }}>{tl(s.trustedLabel, "trusted.default")}</h2>
        )}
      </div>
      {edit ? (
        <div className="pad" style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          {s.clients.map((c: any) => (
            <ClientLogo key={c.id} c={c} edit={edit}
              onName={(v: string) => setClient(c.id, { name: v })}
              onLogo={(src: string) => setClient(c.id, { logo: src })}
              onRemove={() => removeClient(c.id)} />
          ))}
          {s.clients.length < 24 && (
            <button className="ebtn" style={{ padding: "12px 10px" }} onClick={addClient}>+ marca</button>
          )}
        </div>
      ) : (
        <ClientMarquee clients={s.clients} />
      )}
      {edit && (
        <p className="mono pad" style={{ marginTop: 16, fontSize: 9, color: GRAY }}>
          {s.clients.length}/24 marcas · ⇪ sobe png/svg oficial · txt volta pro nome
        </p>
      )}
    </section>
  );
}

// Marquee infinito via RAF (arrastável). As células têm largura FIXA (.tb-cell),
// então scrollWidth não muda ao carregar imagens → o loop não "pula/some".
// 4 cópias garantem que meia-esteira seja sempre maior que a tela (sem vão).
function ClientMarquee({ clients }: { clients: any[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dragRef = useRef<{ x: number; pos: number } | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !clients?.length) return;
    const SPEED = 0.4;
    const half = () => track.scrollWidth / 2;
    const tick = () => {
      if (!dragRef.current) posRef.current -= SPEED;
      const h = half();
      if (h > 0) {
        while (posRef.current <= -h) posRef.current += h;
        while (posRef.current > 0) posRef.current -= h;
      }
      track.style.transform = `translate3d(${posRef.current}px,0,0)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [clients]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, pos: posRef.current };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLDivElement).style.cursor = "grabbing";
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    posRef.current = dragRef.current.pos - (dragRef.current.x - e.clientX);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    (e.currentTarget as HTMLDivElement).style.cursor = "grab";
  };

  if (!clients?.length) return null;
  const all = [...clients, ...clients, ...clients, ...clients];
  return (
    <div className="tb-marquee" style={{ cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
         onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp as any}>
      <div ref={trackRef} className="tb-track">
        {all.map((c: any, i: number) => (
          <div key={`${c.id}-${i}`} className="tb-cell">
            {c.logo ? (
              <img src={c.logo} alt={c.name} className="tb-logo" loading="eager" decoding="async"
                   style={{ height: "clamp(16px,4.6vw,28px)", maxWidth: "clamp(62px,20vw,110px)", objectFit: "contain", pointerEvents: "none" }} />
            ) : (
              <span style={{ fontSize: "clamp(12px,3.4vw,17px)", fontWeight: 600, letterSpacing: "-.02em",
                             opacity: 0.45, whiteSpace: "nowrap", pointerEvents: "none" }}>{c.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientLogo({ c, edit, onName, onLogo, onRemove }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onLogo(r.result);
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div className="logo-cell">
        {c.logo ? (
          <img src={c.logo} alt={c.name} />
        ) : edit ? (
          <input className="einput" value={c.name} onChange={(e) => onName(e.target.value)}
                 style={{ fontSize: 15, textAlign: "center", fontWeight: 600 }} />
        ) : (
          <span style={{ fontSize: "clamp(15px,1.9vw,20px)", fontWeight: 600, letterSpacing: "-.02em", color: INK }}>{c.name}</span>
        )}
      </div>
      {edit && (
        <div className="edit-row" style={{ justifyContent: "center", marginTop: 7 }}>
          <button className="ebtn" style={{ padding: "2px 7px", fontSize: 10 }} onClick={() => ref.current?.click()}>⇪</button>
          {c.logo && <button className="ebtn" style={{ padding: "2px 7px", fontSize: 10 }} onClick={() => onLogo(null)}>txt</button>}
          <button className="ebtn" style={{ padding: "2px 7px", fontSize: 10 }} onClick={onRemove}>✕</button>
          <input ref={ref} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      )}
    </div>
  );
}

function WorkBlock({ p, i = 0, edit, open, patch, categories }: any) {
  const tap = useTap((x, y) => open(p.id, x, y), edit);
  const { tx } = useLang();
  const ref = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [vis, setVis] = useState(false);
  const [shown, setShown] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const compress = useVideoCompress();
  const src = sourceOf(p);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { setVis(e.isIntersecting); if (e.isIntersecting) setShown(true); }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (vis) v.play?.().catch(() => {}); else v.pause?.();
  }, [vis, src?.src]);

  const onCover = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    const fileToUpload = await compress.maybeCompress(f);
    const result = await uploadMedia(fileToUpload);
    if (result) patch({ cover: result });
  };

  return (
    <article ref={ref} className={`wblock ${shown ? "in" : ""}`} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
      <div className="wblock-inner">
        <div className="wblock-media" {...tap}>
          {src?.type === "video" ? (
            <video ref={vid} src={src.src} muted loop playsInline preload="metadata"
                   style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : src?.type === "image" ? (
            <img src={src.src} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <Placeholder title={p.title} />
          )}
          {edit && (
            <div className="edit-row" style={{ position: "absolute", left: 8, right: 8, bottom: 8 }}>
              <button className="ebtn" onClick={() => fileRef.current?.click()}>⇪ capa</button>
              <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onCover} />
              <button className="ebtn" onClick={() => open(p.id)}>✎</button>
            </div>
          )}
        </div>
        <div className="wblock-info">
          {edit ? (
            <input className="einput" value={p.title} onChange={(e) => patch({ title: e.target.value })}
                   style={{ fontSize: 13, fontWeight: 500 }} />
          ) : (
            <h3 onClick={() => open(p.id)} className="wblock-title">{tx(p.title)}</h3>
          )}
          <div className="wblock-meta">
            <span className="mono" style={{ fontSize: 11, color: GRAY }}>{tx(p.kind)}</span>
          </div>
        </div>
        {edit && (
          <div className="edit-row" style={{ marginTop: 8 }}>
            <input className="einput mono" value={p.videoUrl || ""} placeholder="link vídeo"
                   onChange={(e) => patch({ videoUrl: e.target.value })} style={{ flex: 1, fontSize: 9 }} />
            <button className={`ebtn ${p.featured ? "on" : ""}`} onClick={() => patch({ featured: !p.featured })}>★</button>
            {(p.gallery || []).length > 0 && (
              <button className="ebtn" onClick={() => setPickerOpen(v => !v)} title="escolher capa da galeria">📁</button>
            )}
          </div>
        )}
        {pickerOpen && (
          <GalleryPicker
            gallery={p.gallery || []}
            onPick={(item) => {
                const newGallery = (p.gallery || []).filter((g: any) => g.src !== item.src);
                if (p.cover) newGallery.unshift(p.cover);
                patch({ cover: item, gallery: newGallery });
                setPickerOpen(false);
              }}
            onClose={() => setPickerOpen(false)}
          />
        )}
        {compress.ui}
      </div>
    </article>
  );
}

function Placeholder({ title }: any) {
  const initials = (title || "").split(/[\s—×+\-]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0d0d0d,#262626)" }}>
      <span style={{ fontWeight: 600, fontSize: "clamp(24px,4vw,44px)", color: "rgba(255,255,255,.12)", letterSpacing: "-.03em" }}>{initials}</span>
    </div>
  );
}

function GalleryPicker({ gallery, onPick, onClose }: { gallery: any[]; onPick: (item: any) => void; onClose: () => void }) {
  if (!gallery.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "6px 0", alignItems: "center" }}>
      {gallery.map((item: any, i: number) => (
        <div key={i} onClick={() => onPick(item)} title="usar como capa"
             style={{ width: 52, height: 52, cursor: "pointer", borderRadius: 4, overflow: "hidden",
                      border: "1.5px solid #444", flexShrink: 0 }}>
          {item.type === "video" ? (
            <video src={item.src} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={item.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      ))}
      <button className="ebtn" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
    </div>
  );
}

function AllWork({ s, projects, edit, patchSettings, patchProject, move, toggleHero, toggleFeatured, open, back, onRemove }: any) {
  const { t, tx, tl } = useLang();
  const [kind, setKind] = useState("Todos");

  const used = Array.from(new Set(projects.map((p: any) => p.kind)));
  const orphans = (used as string[]).filter((k) => !s.categories.includes(k));
  // Categoria sem nenhum projeto vira beco sem saída: fica fora do filtro
  // (no modo edição aparecem todas, para dar para gerenciar).
  const all = [...s.categories, ...orphans].filter((k) => k && (edit || (used as string[]).includes(k)));

  const list = projects.filter((p: any) => kind === "Todos" || p.kind === kind);

  const countOf = (k: string) => projects.filter((p: any) => p.kind === k).length;

  return (
    <main className="rise aw-page">
      <div className="pad">
        {edit ? (
          <input className="einput" value={s.allTitle}
                 onChange={(e) => patchSettings({ allTitle: e.target.value })}
                 style={{ fontSize: "clamp(40px,9vw,120px)", lineHeight: .9, textTransform: "uppercase", letterSpacing: "-.04em" }} />
        ) : (
          <div className="aw-head">
            <h1 className="aw-title">{tl(s.allTitle, "work.alltitle")}</h1>
            <span className="aw-count mono">{list.length} {t("work.projects")}</span>
          </div>
        )}
        {/* Categorias em texto, separadas por barra, com o ponto marcando a
            ativa — no lugar dos botões-pílula e da busca. */}
        <div className="aw-filt-row mono">
          <button onClick={() => setKind("Todos")} className={`aw-filt ${kind === "Todos" ? "on" : ""}`}>{t("work.all")}</button>
          {all.map((k: string) => (
            <span key={k} className="aw-filt-item">
              <span className="aw-filt-sep">/</span>
              <button onClick={() => setKind(k)} className={`aw-filt ${kind === k ? "on" : ""}`}>
                {tx(k)}{edit && <span style={{ opacity: .5, marginLeft: 6 }}>{countOf(k)}</span>}
              </button>
            </span>
          ))}
        </div>
        {edit && <CategoryManager s={s} projects={projects} orphans={orphans} patchSettings={patchSettings} patchProject={patchProject} />}
      </div>
      <div className="pad aw-grid no-reveal" style={{ paddingBottom: "clamp(48px,9vh,90px)" }}>
        {list.length === 0 ? (
          <div style={{ border: `1px dashed ${LINE}`, borderRadius: 4, padding: "44px 20px", textAlign: "center", color: "#bdbdbd", fontSize: 14, gridColumn: "1/-1" }}>
            {t("work.empty")} "{kind === "Todos" ? t("work.all") : kind}".
          </div>
        ) : (
          list.map((p: any, i: number) => (
            <AllBlock key={p.id} i={i} p={p} edit={edit} open={open} categories={all}
                      inHero={s.heroIds.includes(p.id)} toggleHero={() => toggleHero(p.id)}
                      inFeatured={(s.featuredIds || []).includes(p.id)} toggleFeatured={() => toggleFeatured(p.id)}
                      patch={(x: any) => patchProject(p.id, x)} move={move}
                      onRemove={() => onRemove(p.id)} />
          ))
        )}
      </div>
    </main>
  );
}

function CategoryManager({ s, projects, orphans, patchSettings, patchProject }: any) {
  const [novo, setNovo] = useState("");
  const add = () => {
    const v = novo.trim();
    if (!v || s.categories.includes(v)) return;
    patchSettings({ categories: [...s.categories, v] });
    setNovo("");
  };
  const rename = (old: string, v: string) => {
    const nv = v.trim();
    if (!nv) return;
    patchSettings({ categories: s.categories.map((c: string) => (c === old ? nv : c)) });
    projects.filter((p: any) => p.kind === old).forEach((p: any) => patchProject(p.id, { kind: nv }));
  };
  const remove = (k: string) => {
    const n = projects.filter((p: any) => p.kind === k).length;
    if (n && !confirm(`"${k}" está em ${n} projeto(s). Remover mesmo assim?`)) return;
    patchSettings({ categories: s.categories.filter((c: string) => c !== k) });
  };
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 6, padding: 14, marginBottom: "clamp(24px,5vh,40px)" }}>
      <div className="mono" style={{ fontSize: 9.5, color: GRAY, marginBottom: 10 }}>categorias — o nome muda em todos os projetos que a usam</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {s.categories.map((k: string) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <input className="einput" defaultValue={k}
                   onBlur={(e) => e.target.value !== k && rename(k, e.target.value)}
                   onKeyDown={(e: any) => e.key === "Enter" && e.target.blur()}
                   style={{ width: `${Math.max(k.length, 8)}ch`, fontSize: 11 }} />
            <button className="ebtn" style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => remove(k)}>✕</button>
          </span>
        ))}
      </div>
      <div className="edit-row" style={{ marginTop: 10 }}>
        <input className="einput" value={novo} placeholder="nova categoria"
               onChange={(e) => setNovo(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && add()}
               style={{ maxWidth: 180, fontSize: 11 }} />
        <button className="ebtn" onClick={add}>+ categoria</button>
      </div>
      {orphans.length > 0 && (
        <p className="mono" style={{ marginTop: 10, fontSize: 9, color: "#c07a2a" }}>
          fora da lista, mas em uso: {orphans.join(" · ")}
        </p>
      )}
    </div>
  );
}

function AllBlock({ p, i = 0, edit, open, categories, inHero, toggleHero, inFeatured, toggleFeatured, patch, move, onRemove }: any) {
  const tap = useTap((x, y) => open(p.id, x, y), edit);
  const { tx } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLElement>(null);
  const [vis, setVis] = useState(false);
  const [shown, setShown] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const compress = useVideoCompress();
  const src = sourceOf(p);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { setVis(e.isIntersecting); if (e.isIntersecting) setShown(true); }, { threshold: 0.05, rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Todos os vídeos da fileira tocam juntos quando ela está na tela.
  useEffect(() => {
    ref.current?.querySelectorAll("video").forEach((v) => {
      if (vis) v.play?.().catch(() => {}); else v.pause?.();
    });
  }, [vis, shown, src?.src]);

  const onCover = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    const fileToUpload = await compress.maybeCompress(f);
    const result = await uploadMedia(fileToUpload);
    if (result) patch({ cover: result });
  };

  // Cada projeto é uma fileira: a capa e mais três mídias da galeria, todas
  // alinhadas pela base. As alturas variam com a proporção real de cada peça
  // (w/h gravados no conteúdo), então o espaço já fica reservado antes de
  // carregar e a fileira não pula.
  const extras = (p.gallery || [])
    .filter((m: any) => m?.src && m.src !== src?.src && m.src !== p.cover?.src)
    .slice(0, 3);
  const arOf = (m: any) => (m?.w && m?.h ? `${m.w} / ${m.h}` : "4 / 3");

  return (
    <article ref={ref} className={`wblock aw-row ${shown ? "in" : ""}`}>
      <div className="wblock-inner">
      <div className="aw-strip">
        <div className="wblock-media aw-cover" style={{ aspectRatio: arOf(p.cover) }} {...tap}>
          {src?.type === "video" ? (
            <video src={src.src} muted loop playsInline preload="metadata" />
          ) : src?.type === "image" ? (
            <img src={src.src} alt={p.title} />
          ) : (
            <Placeholder title={p.title} />
          )}
          {edit && (
            <div className="edit-row" style={{ position: "absolute", left: 8, right: 8, bottom: 8 }}>
              <button className="ebtn" onClick={() => fileRef.current?.click()}>⇪</button>
              <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onCover} />
              <button className={`ebtn ${inHero ? "on" : ""}`} onClick={toggleHero}>▶ hero</button>
              <button className="ebtn" onClick={() => open(p.id)}>✎</button>
            </div>
          )}
        </div>
        {extras.map((m: any) => (
          <div key={m.src} className="wblock-media aw-extra" style={{ aspectRatio: arOf(m) }}
               onClick={() => !edit && open(p.id)}>
            {/* Só carrega quando a fileira chega perto da tela. */}
            {shown && (m.type === "video" ? (
              <video src={m.src} muted loop playsInline preload="metadata" />
            ) : (
              <img src={m.src} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        ))}
      </div>
        <div className="wblock-info">
          {edit ? (
            <input className="einput" value={p.title} onChange={(e) => patch({ title: e.target.value })}
                   style={{ fontSize: 13, fontWeight: 500 }} />
          ) : (
            <h3 onClick={() => open(p.id)} className="wblock-title">{tx(p.title)}</h3>
          )}
          <div className="wblock-meta">
            <span className="mono">{tx(p.kind)}</span>
          </div>
        </div>
        {edit && (
          <div className="edit-row" style={{ marginTop: 8 }}>
            <input className="einput mono" value={p.videoUrl || ""} placeholder="link vídeo"
                   onChange={(e) => patch({ videoUrl: e.target.value })} style={{ flex: 1, fontSize: 9 }} />
            <button className={`ebtn ${inFeatured ? "on" : ""}`} onClick={toggleFeatured}>★</button>
            <button className="ebtn" onClick={() => move(p.id, -1)}>↑</button>
            <button className="ebtn" onClick={() => move(p.id, +1)}>↓</button>
            {(p.gallery || []).length > 0 && (
              <button className="ebtn" onClick={() => setPickerOpen(v => !v)} title="escolher capa da galeria">📁</button>
            )}
            {onRemove && (
              <button className="ebtn danger" onClick={() => { if (confirm(`Excluir "${p.title}"?`)) onRemove(); }}>excluir</button>
            )}
          </div>
        )}
        {pickerOpen && (
          <GalleryPicker
            gallery={p.gallery || []}
            onPick={(item) => {
                const newGallery = (p.gallery || []).filter((g: any) => g.src !== item.src);
                if (p.cover) newGallery.unshift(p.cover);
                patch({ cover: item, gallery: newGallery });
                setPickerOpen(false);
              }}
            onClose={() => setPickerOpen(false)}
          />
        )}
        {compress.ui}
      </div>
    </article>
  );
}

function ProjectPage({ p, all, edit, patch, remove, back, open, categories }: any) {
  const { t, tx, wx } = useLang();
  const heroRef = useRef<HTMLInputElement>(null);
  const [heroPicker, setHeroPicker] = useState(false);
  const heroCompress = useVideoCompress();
  const pinchRef = useRef<HTMLElement>(null);

  const onHero = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    const fileToUpload = await heroCompress.maybeCompress(f);
    const result = await uploadMedia(fileToUpload);
    if (result) patch({ cover: result });
  };

  // Pinch-zoom (mobile, 2 dedos): dá pra "espiar" com zoom e ao soltar volta ao
  // normal com mola. touch-action pan-y desativa o zoom nativo (que não volta).
  useEffect(() => {
    const el = pinchRef.current;
    if (!el) return;
    let startDist = 0, active = false;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      active = true;
      startDist = dist(e.touches) || 1;
      const r = el.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      el.style.transformOrigin = `${((cx - r.left) / r.width) * 100}% ${((cy - r.top) / r.height) * 100}%`;
      el.style.transition = "none";
    };
    const onMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2) return;
      e.preventDefault();
      const scale = Math.max(1, Math.min(3, dist(e.touches) / startDist));
      el.style.transform = `scale(${scale})`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!active || e.touches.length >= 2) return;
      active = false;
      el.style.transition = "transform .45s cubic-bezier(.16,1,.3,1)";
      el.style.transform = "scale(1)";
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [p.id]);

  // Loader do projeto: bolinha girando enquanto as mídias carregam; só revela
  // quando estão prontas — evitando o "preto" do vídeo carregando na hora. A
  // CAPA espera 'canplay' JÁ no ponto de início (start) → toca sem preto; a
  // galeria espera o 1º frame. Fallback de 14s pra não travar em mídia grande.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (edit) { setReady(true); return; }
    setReady(false);
    const main = sourceOf(p);
    const gallery = (p.gallery || []).filter((m: any) => m?.src);
    const total = (main?.src ? 1 : 0) + gallery.length;
    if (!total) { setReady(true); return; }
    let done = 0, cancelled = false;
    const finish = () => { if (cancelled) return; done++; if (done >= total) setReady(true); };
    const cleaners: Array<() => void> = [];
    const preVideo = (src: string, start: number, gate: "canplay" | "loadeddata") => {
      const v = document.createElement("video");
      v.muted = true; v.preload = "auto"; v.playsInline = true;
      const onMeta = () => { if (start) { try { v.currentTime = start; } catch {} } };
      v.addEventListener("loadedmetadata", onMeta, { once: true });
      v.addEventListener(gate, finish, { once: true });
      v.addEventListener("error", finish, { once: true });
      v.src = src;
      cleaners.push(() => { v.removeEventListener(gate, finish); v.removeAttribute("src"); try { v.load(); } catch {} });
    };
    const preImg = (src: string) => {
      const img = new Image();
      img.onload = img.onerror = finish;
      img.src = src;
      cleaners.push(() => { img.onload = null; img.onerror = null; });
    };
    if (main?.src) { main.type === "video" ? preVideo(main.src, main.start || 0, "canplay") : preImg(main.src); }
    gallery.forEach((g: any) => { g.type === "video" ? preVideo(g.src, g.start || 0, "loadeddata") : preImg(g.src); });
    const to = setTimeout(() => { if (!cancelled) setReady(true); }, 14000);
    return () => { cancelled = true; clearTimeout(to); cleaners.forEach((c) => c()); };
  }, [p.id, edit]);

  const i = all.findIndex((x: any) => x.id === p.id);
  const next = all[(i + 1) % all.length];
  const prev = all[(i - 1 + all.length) % all.length];
  const hasNav = all.length > 1;

  return (
    <main ref={pinchRef} className="rise" style={{ paddingTop: "clamp(96px,13vh,120px)", touchAction: "pan-y" }}>
      {/* portal no body: escapa do transform do .rise/.app-in — assim o loader
          fica REALMENTE fixo na viewport (centralizado, sem se mover) e cobre a
          tela toda (o vídeo carregando não vaza por baixo). */}
      {!ready && !edit && typeof document !== "undefined" && createPortal(
        <div className="proj-loader"><span className="pre-ball pre-ball--ink" /></div>,
        document.body
      )}
      <div className="pad proj-grid">
        {/* LEFT: info */}
        <div className="proj-left">
          <div>
            {edit ? (
              <select className="einput mono" value={p.kind} onChange={(e) => patch({ kind: e.target.value })} style={{ maxWidth: 240, fontSize: 10.5 }}>
                {!(categories || []).includes(p.kind) && <option value={p.kind}>{p.kind} (fora da lista)</option>}
                {(categories || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <span className="mono" style={{ fontSize: 11, color: GRAY }}>{tx(p.kind)}</span>
            )}
          </div>

          {edit ? (
            <input className="einput" value={p.title} onChange={(e) => patch({ title: e.target.value })}
                   style={{ marginTop: 8, fontSize: "clamp(22px,2.6vw,36px)", fontWeight: 400, letterSpacing: "-.03em", width: "100%" }} />
          ) : (
            <h1 style={{ marginTop: 8, fontSize: "clamp(24px,2.8vw,40px)", fontWeight: 400, letterSpacing: "-.03em", lineHeight: 1.08 }}>
              {tx(p.title)}
            </h1>
          )}

          {edit ? (
            <textarea className="einput" rows={5} value={tx(p.description) || ""}
                      placeholder={"Project description — editing the current language. Paragraphs separated by a blank line."}
                      onChange={(e) => patch({ description: wx(p.description, e.target.value) })}
                      style={{ marginTop: 20, fontSize: 14, lineHeight: 1.6, width: "100%", resize: "vertical" }} />
          ) : tx(p.description) ? (
            <div style={{ marginTop: 20 }}>
              {String(tx(p.description)).split(/\n{2,}/).map((par: string, k: number) => (
                <p key={k} style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 16, fontWeight: 400, color: "var(--ink)", opacity: .74 }}>{par}</p>
              ))}
            </div>
          ) : null}

          <div style={{ marginTop: "clamp(24px,4vh,40px)", display: "flex", gap: "clamp(24px,4vw,48px)", flexWrap: "wrap" }}>
            {edit && <MetaItem label={t("proj.year")} value={p.year} edit={edit} onChange={(v: string) => patch({ year: v })} />}
            <MetaItem label={t("proj.location")} value={tx(p.location)} edit={edit} onChange={(v: string) => patch({ location: v })} />
          </div>

          <div style={{ marginTop: "clamp(20px,3vh,32px)" }}>
            <Credits credits={p.credits} edit={edit} onChange={(c: any) => patch({ credits: c })} />
          </div>

          {edit && (
            <div style={{ marginTop: 20 }}>
              <input className="einput mono" value={p.videoUrl || ""}
                     placeholder="link do vídeo principal (drive, r2, bunny…)"
                     onChange={(e) => patch({ videoUrl: e.target.value })}
                     style={{ fontSize: 10, marginBottom: 8 }} />
              <div className="edit-row">
                <button className="ebtn" onClick={() => heroRef.current?.click()}>⇪ capa</button>
                <input ref={heroRef} type="file" accept="image/*,video/*" hidden onChange={onHero} />
                {(p.gallery || []).length > 0 && (
                  <button className="ebtn" onClick={() => setHeroPicker(v => !v)} title="escolher capa da galeria">📁 galeria</button>
                )}
              </div>
              {heroPicker && (
                <GalleryPicker
                  gallery={p.gallery || []}
                  onPick={(item) => {
                    const newGallery = (p.gallery || []).filter((g: any) => g.src !== item.src);
                    if (p.cover) newGallery.unshift(p.cover);
                    patch({ cover: item, gallery: newGallery });
                    setHeroPicker(false);
                  }}
                  onClose={() => setHeroPicker(false)}
                />
              )}
              {heroCompress.ui}
            </div>
          )}
        </div>

        {/* RIGHT: media grid */}
        <div>
          <MediaGrid p={p} edit={edit} patch={patch} />
        </div>
      </div>

      <section className="pad proj-nav" style={{ borderTop: `1px solid ${LINE}`, marginTop: "clamp(32px,6vh,60px)", paddingTop: 30, paddingBottom: 60,
                                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "nowrap" }}>
        {hasNav ? (
          <button className="proj-nav-btn" onClick={() => open(prev.id)} style={{ background: "none", border: "none", textAlign: "left", padding: 0, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 9.5, color: GRAY, marginBottom: 6 }}>{t("proj.prev")}</div>
            <div className="proj-nav-title">← {tx(prev.title)}</div>
          </button>
        ) : <span />}
        {edit && (
          <button className="ebtn danger" onClick={() => { if (confirm(`Excluir "${tx(p.title)}"?`)) remove(); }}>excluir projeto</button>
        )}
        {hasNav && (
          <button className="proj-nav-btn" onClick={() => open(next.id)} style={{ background: "none", border: "none", textAlign: "right", padding: 0, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 9.5, color: GRAY, marginBottom: 6 }}>{t("proj.next")}</div>
            <div className="proj-nav-title">{tx(next.title)} →</div>
          </button>
        )}
      </section>
    </main>
  );
}

/* 9-point position picker para gallery items com object-fit:cover */
const POS_MAP = [
  ["0% 0%",   "50% 0%",   "100% 0%"],
  ["0% 50%",  "50% 50%",  "100% 50%"],
  ["0% 100%", "50% 100%", "100% 100%"],
];
function PosPicker({ value, onChange }: { value?: string; onChange: (p: string) => void }) {
  const cur = value || "50% 50%";
  return (
    <div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3,10px)", gap: 3,
                  padding: "6px 7px", background: "rgba(0,0,0,.65)", borderRadius: 6 }}>
      {POS_MAP.flat().map((pos) => (
        <button key={pos} onClick={() => onChange(pos)} style={{
          width: 10, height: 10, borderRadius: "50%", border: "none", padding: 0,
          background: cur === pos ? "#fff" : "rgba(255,255,255,.3)",
          transition: "background .15s",
        }} />
      ))}
    </div>
  );
}

function MediaGrid({ p, edit, patch }: any) {
  const galRef = useRef<HTMLInputElement>(null);
  const live = useRef(p);
  useEffect(() => { live.current = p; }, [p]);
  const galCompress = useVideoCompress();
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const main = sourceOf(p);
  const gallery: any[] = p.gallery || [];
  const gap = "clamp(10px,1.6vw,18px)";
  // lista completa de mídias do projeto (capa + galeria) p/ navegar no lightbox
  const allMedia = [...(main ? [main] : []), ...gallery].map((m: any) => ({ type: m.type, src: m.src }));
  const coverIdx = 0;
  const galBase = main ? 1 : 0;

  const onGallery = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[];
    e.target.value = "";
    for (const f of files) {
      const fileToUpload = await galCompress.maybeCompress(f);
      const result = await uploadMedia(fileToUpload);
      if (result) patch({ gallery: [...(live.current.gallery || []), result] });
    }
  };

  const updateItem = (idx: number, upd: any) =>
    patch({ gallery: live.current.gallery.map((g: any, i: number) => i === idx ? { ...g, ...upd } : g) });
  const delCover = () => (main as any)?.hosted ? patch({ videoUrl: "" }) : patch({ cover: null });
  const delGallery = (idx: number) => patch({ gallery: gallery.filter((_: any, i: number) => i !== idx) });

  const showEmpty = !main && gallery.length === 0;
  if (showEmpty && !edit)
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 8, padding: "48px 20px", textAlign: "center", color: "#bdbdbd", fontSize: 13 }}>
        Sem mídia neste projeto.
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>

      {/* Capa — full width, proporção natural */}
      {main && (
        <div className="gal-cover" style={{ cursor: edit ? "default" : "zoom-in", aspectRatio: (main.w && main.h) ? `${main.w} / ${main.h}` : undefined }}
             onClick={() => !edit && setLbIndex(coverIdx)}>
          <MediaNatural m={main} />
          {edit && <button className="ebtn" style={{ position: "absolute", top: 8, right: 8 }} onClick={delCover}>✕ capa</button>}
        </div>
      )}

      {/* Galeria — VIEW: masonry (colunas via flex) com reveal ao rolar */}
      {!edit && gallery.length > 0 && (
        <GalleryMasonry gallery={gallery} gap={gap} onOpen={(galIdx: number) => setLbIndex(galBase + galIdx)} />
      )}

      {/* Galeria — EDIT: grade responsiva com controles (inalterada) */}
      {edit && (
        <div className="gallery-grid" style={{ display: "grid", gap }}>
          {gallery.map((g: any, idx: number) => {
            const fullWidth = g.span === 2;
            return (
              <div key={g.src || idx} className={`gal-item${fullWidth ? " gal-full" : ""}`}
                   style={{ aspectRatio: (g.w && g.h) ? `${g.w} / ${g.h}` : undefined }}>
                <MediaGalleryItem m={g} />
                <>
                  <button className="ebtn" style={{ position: "absolute", top: 8, right: 8 }}
                          onClick={() => delGallery(idx)}>✕</button>
                  <button className="ebtn" style={{ position: "absolute", top: 8, right: 42,
                                                    fontSize: 10, padding: "4px 7px" }}
                          title={fullWidth ? "meia largura" : "largura total"}
                          onClick={() => updateItem(idx, { span: fullWidth ? 1 : 2 })}>
                    {fullWidth ? "½" : "↔"}
                  </button>
                </>
              </div>
            );
          })}

          {/* Botão + integrado no grid */}
          <button onClick={() => galRef.current?.click()}
            style={{
              aspectRatio: "3/2", border: `1px dashed ${LINE}`, borderRadius: 8,
              background: "none", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
              color: "#b0b0b0", transition: "border-color .2s, color .2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = INK; (e.currentTarget as HTMLButtonElement).style.color = INK; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = LINE; (e.currentTarget as HTMLButtonElement).style.color = "#b0b0b0"; }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 300 }}>+</span>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em" }}>adicionar mídia</span>
          </button>
        </div>
      )}

      <input ref={galRef} type="file" accept="image/*,video/*" multiple hidden onChange={onGallery} />
      {galCompress.ui}

      {showEmpty && edit && (
        <div style={{ border: `1px dashed ${LINE}`, borderRadius: 8, padding: "40px 20px", textAlign: "center", color: "#bdbdbd", fontSize: 13 }}>
          Cole o link do vídeo na coluna esquerda, ou use o botão + acima para subir mídia.
        </div>
      )}

      <MediaLightbox items={lbIndex !== null ? allMedia : null} index={lbIndex ?? 0}
                     onIndex={setLbIndex} onClose={() => setLbIndex(null)} />
    </div>
  );
}

// Masonry via flex: distribui os itens em N colunas (round-robin) empacotando
// cada coluna de cima pra baixo — sem os buracos do CSS multicolumn. Cada item
// revela com `whileInView` quando ELE entra na viewport (reveal ao rolar), no
// mesmo padrão do Reveal.tsx. Funciona com o Lenis (scroll nativo → IO dispara).
function GalleryMasonry({ gallery, gap, onOpen }: any) {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setCols(w < 560 ? 1 : w < 980 ? 2 : 3);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const columns: any[][] = Array.from({ length: cols }, () => []);
  gallery.forEach((g: any, idx: number) => columns[idx % cols].push({ g, idx }));

  return (
    <div className="gal-masonry" style={{ display: "flex", alignItems: "flex-start", gap }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap }}>
          {col.map(({ g, idx }: any) => (
            <motion.div
              key={idx}
              className="gal-item"
              style={{ cursor: "zoom-in", aspectRatio: (g.w && g.h) ? `${g.w} / ${g.h}` : undefined }}
              onClick={() => onOpen(idx)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <MediaGalleryItem m={g} />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Vídeo que só carrega/toca quando entra na viewport (preload=metadata).
// Evita que uma galeria com dezenas de vídeos carregue todos de uma vez.
function LazyVideo({ src, style, start, eager }: any) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const seek = () => { if (start && v.currentTime < 0.3) { try { v.currentTime = start; } catch {} } };
    // eager (capa): já buffera/toca de imediato; senão, carrega/toca ao entrar
    // na viewport (rootMargin) pra não baixar dezenas de vídeos de uma vez.
    if (eager) { seek(); v.play?.().catch(() => {}); }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { seek(); v.play?.().catch(() => {}); }
      else if (!eager) v.pause?.();
    }, { threshold: 0.01, rootMargin: "500px 0px 500px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, [src, start, eager]);
  return <video ref={ref} src={start ? `${src}#t=${start}` : src} muted loop playsInline preload={eager ? "auto" : "metadata"} controls={false}
                style={{ background: "#0a0a0a", ...style }} />;
}

function MediaGalleryItem({ m }: any) {
  // se a mídia tem dimensão (w/h), preenche o container que já reservou o
  // aspect-ratio → não cresce/pula ao carregar. Senão, height:auto (fallback).
  const fill = (m?.w && m?.h)
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: "100%", height: "auto" as const };
  // galeria: só o 1º frame (preload=metadata, sem autoplay) → carrega rápido;
  // o vídeo toca de verdade ao clicar (lightbox). Evita baixar dezenas de MB.
  if (m?.type === "video")
    return <video src={`${m.src}#t=0.1`} muted playsInline preload="metadata" controls={false}
                  style={{ ...fill, display: "block", background: "#0a0a0a" }} />;
  if (m?.type === "image")
    return <img src={m.src} alt="" loading="lazy" decoding="async" style={{ ...fill, display: "block" }} />;
  return null;
}

function MediaNatural({ m }: any) {
  const fill = (m?.w && m?.h)
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }
    : { width: "100%", height: "auto" as const, maxWidth: "100%" };
  if (m?.type === "video")
    return <LazyVideo src={m.src} start={m.start} eager style={{ ...fill, display: "block" }} />;
  if (m?.type === "image")
    return <img src={m.src} alt="" loading="lazy" decoding="async" style={{ ...fill, display: "block" }} />;
  return null;
}

function MediaCover({ m }: any) {
  const pos = m?.pos || "50% 50%";
  if (m?.type === "video")
    return <video src={m.src} muted loop autoPlay playsInline controls={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, display: "block" }} />;
  if (m?.type === "image")
    return <img src={m.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, display: "block" }} />;
  return null;
}

function Media({ m, title }: any) {
  if (m?.type === "video")
    return <video src={m.src} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />;
  if (m?.type === "image")
    return <img src={m.src} alt={title || ""} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />;
  return <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0d0d0d,#242424)" }} />;
}

function MetaItem({ label, value, onChange, edit, placeholder }: any) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: GRAY, marginBottom: 6 }}>{label}</div>
      {edit ? (
        <input className="einput" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 14, minWidth: 130 }} />
      ) : (
        <div style={{ fontSize: "clamp(14px,1.6vw,16px)", fontWeight: 400 }}>{value || "—"}</div>
      )}
    </div>
  );
}

function Credits({ credits, edit, onChange }: any) {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  if (!edit && !(credits || []).length) return null;
  const add = () => {
    if (role.trim() && name.trim()) {
      onChange([...(credits || []), { role: role.trim(), name: name.trim() }]);
      setName("");
    }
  };
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, color: GRAY, marginBottom: 12 }}>credits</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(credits || []).map((c: any, i: number) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: GRAY, flexShrink: 0, fontWeight: 400 }}>{c.role}</span>
            <span style={{ fontSize: 13, fontWeight: 400 }}>{c.name}</span>
            {edit && <button className="ebtn" style={{ padding: "1px 7px" }} onClick={() => onChange(credits.filter((_: any, j: number) => j !== i))}>✕</button>}
          </div>
        ))}
      </div>
      {edit && (
        <div className="edit-row" style={{ marginTop: 12 }}>
          <input className="einput" style={{ maxWidth: 190 }} placeholder="Função — Direção Criativa" value={role} onChange={(e) => setRole(e.target.value)} />
          <input className="einput" style={{ maxWidth: 190 }} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && add()} />
          <button className="ebtn" onClick={add}>+ adicionar</button>
        </div>
      )}
    </div>
  );
}

function SelectedEditor({ projects, featuredIds, onClose, onToggle, onMove }: any) {
  const [q, setQ] = useState("");
  const byId = Object.fromEntries(projects.map((p: any) => [p.id, p]));
  const selected = (featuredIds as string[]).map((id) => byId[id]).filter(Boolean);
  const available = projects
    .filter((p: any) => !featuredIds.includes(p.id))
    .filter((p: any) => !q || p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "20px clamp(20px,4.5vw,60px)", borderBottom: `1px solid ${LINE}`,
                                    position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: GRAY, marginBottom: 4 }}>edit mode</div>
          <h2 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 400, letterSpacing: "-.02em" }}>Selected Works</h2>
        </div>
        <button className="ebtn" onClick={onClose} style={{ padding: "8px 16px", fontSize: 12 }}>✕ fechar</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}
           className="pad">
        {/* Esquerda: selecionados em ordem */}
        <div style={{ padding: "clamp(20px,3vh,32px) clamp(20px,4.5vw,60px) clamp(20px,3vh,32px) 0",
                      borderRight: `1px solid ${LINE}`, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Na vitrine</span>
            <span className="mono" style={{ fontSize: 9, color: GRAY }}>{selected.length} projetos</span>
          </div>
          {selected.length === 0 && (
            <p style={{ fontSize: 13, color: "#bdbdbd" }}>Nenhum projeto selecionado ainda.</p>
          )}
          {selected.map((p: any, i: number) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                                     borderBottom: `1px solid ${LINE}` }}>
              <span style={{ fontSize: 10, color: GRAY, fontFamily: "'IBM Plex Mono',monospace",
                             minWidth: 18, textAlign: "right" }}>{i + 1}</span>
              {p.cover || p.videoUrl ? (
                <div style={{ width: 44, height: 32, background: "#0a0a0a", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                  {p.cover?.type === "image"
                    ? <img src={p.cover.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111,#222)" }} />}
                </div>
              ) : (
                <div style={{ width: 44, height: 32, background: "#f0f0f0", borderRadius: 4, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div className="mono" style={{ fontSize: 9, color: GRAY }}>{p.kind} · {p.year}</div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button className="ebtn" style={{ padding: "3px 8px" }} onClick={() => onMove(p.id, -1)}>↑</button>
                <button className="ebtn" style={{ padding: "3px 8px" }} onClick={() => onMove(p.id, +1)}>↓</button>
                <button className="ebtn danger" style={{ padding: "3px 8px" }} onClick={() => onToggle(p.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Direita: todos os disponíveis */}
        <div style={{ padding: "clamp(20px,3vh,32px) 0 clamp(20px,3vh,32px) clamp(20px,4.5vw,60px)", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Adicionar</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar projeto…"
                   style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 14px",
                            fontSize: 11, outline: "none", fontFamily: "inherit", maxWidth: 200 }} />
          </div>
          {available.length === 0 && (
            <p style={{ fontSize: 13, color: "#bdbdbd" }}>
              {q ? `Nenhum resultado para "${q}".` : "Todos os projetos já estão na vitrine."}
            </p>
          )}
          {available.map((p: any) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                                     borderBottom: `1px solid ${LINE}` }}>
              {p.cover?.type === "image"
                ? <div style={{ width: 44, height: 32, background: "#0a0a0a", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                    <img src={p.cover.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                : <div style={{ width: 44, height: 32, background: "#f0f0f0", borderRadius: 4, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div className="mono" style={{ fontSize: 9, color: GRAY }}>{p.kind} · {p.year}</div>
              </div>
              <button className="ebtn" style={{ padding: "3px 10px", flexShrink: 0 }} onClick={() => onToggle(p.id)}>+ add</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroEditor({ projects, heroIds, onClose, onToggle, onMove }: any) {
  const [q, setQ] = useState("");
  const byId = Object.fromEntries(projects.map((p: any) => [p.id, p]));
  const selected = (heroIds as string[]).map((id: string) => byId[id]).filter(Boolean);
  const available = projects
    .filter((p: any) => !heroIds.includes(p.id) && (p.videoUrl || p.cover))
    .filter((p: any) => !q || p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div className="pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "20px clamp(20px,4.5vw,60px)", borderBottom: `1px solid ${LINE}`,
                                    position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: GRAY, marginBottom: 4 }}>edit mode</div>
          <h2 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 400, letterSpacing: "-.02em" }}>Hero Videos</h2>
        </div>
        <button className="ebtn" onClick={onClose} style={{ padding: "8px 16px", fontSize: 12 }}>✕ fechar</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }} className="pad">
        <div style={{ padding: "clamp(20px,3vh,32px) clamp(20px,4.5vw,60px) clamp(20px,3vh,32px) 0",
                      borderRight: `1px solid ${LINE}`, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>No carousel</span>
            <span className="mono" style={{ fontSize: 9, color: GRAY }}>{selected.length} vídeos</span>
          </div>
          {selected.length === 0 && <p style={{ fontSize: 13, color: "#bdbdbd" }}>Nenhum vídeo selecionado.</p>}
          {selected.map((p: any, idx: number) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
              <span style={{ fontSize: 10, color: GRAY, fontFamily: "'IBM Plex Mono',monospace", minWidth: 18, textAlign: "right" }}>{idx + 1}</span>
              <div style={{ width: 44, height: 32, background: "#0a0a0a", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                {p.cover?.type === "image"
                  ? <img src={p.cover.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111,#333)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>▶</span></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div className="mono" style={{ fontSize: 9, color: GRAY }}>{p.kind} · {p.year}</div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button className="ebtn" style={{ padding: "3px 8px" }} onClick={() => onMove(p.id, -1)}>↑</button>
                <button className="ebtn" style={{ padding: "3px 8px" }} onClick={() => onMove(p.id, +1)}>↓</button>
                <button className="ebtn danger" style={{ padding: "3px 8px" }} onClick={() => onToggle(p.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "clamp(20px,3vh,32px) 0 clamp(20px,3vh,32px) clamp(20px,4.5vw,60px)", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Adicionar</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar projeto…"
                   style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 14px",
                            fontSize: 11, outline: "none", fontFamily: "inherit", maxWidth: 200 }} />
          </div>
          {available.length === 0 && <p style={{ fontSize: 13, color: "#bdbdbd" }}>{q ? `Nenhum resultado para "${q}".` : "Nenhum projeto com mídia disponível."}</p>}
          {available.map((p: any) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
              <div style={{ width: 44, height: 32, background: "#0a0a0a", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                {p.cover?.type === "image"
                  ? <img src={p.cover.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111,#333)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>▶</span></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div className="mono" style={{ fontSize: 9, color: GRAY }}>{p.kind} · {p.year}</div>
              </div>
              <button className="ebtn" style={{ padding: "3px 10px", flexShrink: 0 }} onClick={() => onToggle(p.id)}>+ add</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NEXT WAVE — fonte 5x5 dot-matrix (extraída do animator)
   ============================================================ */
const NW_FONT: Record<string, string[]> = {
  'A':["01110","10001","11111","10001","10001"],'B':["11110","10001","11110","10001","11110"],
  'C':["01110","10001","10000","10001","01110"],'D':["11110","10001","10001","10001","11110"],
  'E':["01110","10001","11110","10000","01110"],'F':["11111","10000","11110","10000","10000"],
  'G':["01110","10000","10011","10001","01110"],'H':["10001","10001","11111","10001","10001"],
  'I':["01110","00100","00100","00100","01110"],'J':["00111","00010","00010","10010","01100"],
  'K':["10001","10010","11100","10010","10001"],'L':["10000","10000","10000","10000","01110"],
  'M':["10001","11011","10101","10001","10001"],'N':["01110","10001","10001","10001","10001"],
  'O':["01110","10001","10001","10001","01110"],'P':["11110","10001","11110","10000","10000"],
  'Q':["01110","10001","10101","10010","01101"],'R':["11110","10001","11110","10010","10001"],
  'S':["01111","10000","01110","00001","11110"],'T':["01000","11110","01000","01000","00111"],
  'U':["10001","10001","10001","10001","01110"],'V':["10001","10001","10001","10001","01110"],
  'W':["10101","10101","10101","10101","01010"],'X':["10001","10001","01110","10001","10001"],
  'Y':["10001","01010","00100","00100","00100"],'Z':["11111","00010","00100","01000","11111"],
  ' ':["00000","00000","00000","00000","00000"],
};

const NW_PALETTE = ["#8B5CF6","#EC4899","#3B82F6","#22C55E","#EAB308","#F97316","#06B6D4","#A855F7","#F43F5E","#14B8A6"];

function nwCells(ch: string): [number, number][] {
  const p = NW_FONT[ch] || NW_FONT[' '];
  const o: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (p[r][c] === '1') o.push([c, r]);
  return o;
}

// Defaults da Next Wave — usados quando o campo ainda não foi editado.
const NW_DEFAULTS = {
  heroSubtext: "Onde a THE FORCE testa ideias com inteligência artificial, código e forma, antes de virarem projeto.",
  anchorLabel: "Ver a chamada aberta",
  labTitle: "O laboratório",
  pillars: [
    { title: "IA", accent: "turquoise" as const, description: "Modelos generativos e visão computacional." },
    { title: "3D", accent: "coral" as const, description: "Formas e cenas em tempo real." },
    { title: "DESIGN", accent: "lavender" as const, description: "Tipografia e sistemas visuais." },
    { title: "CÓDIGO CRIATIVO", accent: "sunny" as const, description: "Shaders e interfaces experimentais." },
  ],
  openTitle: "Chamada aberta para artistas e desenvolvedores.",
  openBody: "Buscamos criadores que trabalham com creative coding, inteligência artificial, novas mídias e arte generativa para colaborar com o laboratório.",
  openCta: "Enviar portfólio",
  openEmail: "nextwave@theforce.cc",
};

function NextWave({ s, edit, patchSettings, nav }: any) {
  const logoRef = useRef<HTMLInputElement>(null);
  const reelRef = useRef<HTMLInputElement>(null);
  const [reelStatus, setReelStatus] = useState("");
  const finePointer = useFinePointer();

  // Trilha do cursor: variante fluorescente da paleta da marca; burst no clique desativado.
  const CURSOR_COLORS = ["#FF0FA0", "#00F5D4", "#FFEA00", "#B14EFF"];

  // valores atuais (edição sobrescreve os defaults)
  const heroSubtext = s.nwHeroSubtext ?? NW_DEFAULTS.heroSubtext;
  const anchorLabel = s.nwAnchorLabel ?? NW_DEFAULTS.anchorLabel;
  const labTitle = s.nwLabTitle ?? NW_DEFAULTS.labTitle;
  const pillars = (s.nwPillars && s.nwPillars.length ? s.nwPillars : NW_DEFAULTS.pillars) as typeof NW_DEFAULTS.pillars;
  const openTitle = s.nwOpenTitle ?? NW_DEFAULTS.openTitle;
  const openBody = s.nwOpenBody ?? NW_DEFAULTS.openBody;
  const openCta = s.nwOpenCta ?? NW_DEFAULTS.openCta;
  const openEmail = s.nwOpenEmail ?? NW_DEFAULTS.openEmail;

  const onLogo = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => patchSettings({ nextWaveLogo: r.result as string });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const onReel = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    setReelStatus("enviando vídeo…");
    const up = await uploadMedia(f);
    setReelStatus("");
    if (up) patchSettings({ nwReelUrl: up.src });
  };

  const setPillar = (i: number, key: "title" | "description", val: string) => {
    const next = pillars.map((p, idx) => (idx === i ? { ...p, [key]: val } : p));
    patchSettings({ nwPillars: next });
  };

  return (
    <main className="nw2-main">
      {/* fundo — blobs fluidos (gooey) */}
      <div className="nw2-bg" aria-hidden="true">
        <FluidBlobs />
      </div>

      {/* cursor da Next Wave = trilha de imagens (flair) + bolinha colorida por
          cima. Ambos em portal no document.body (imunes ao transform do wrapper
          de transição) e pointer-events:none, então nunca bloqueiam cliques. */}
      {finePointer && <MouseTrailComponent overlay threshold={70} imageSize={90} />}
      {finePointer && <ColorBallCursor />}

      {/* Hero — logo em dot-matrix interativo + criatura 3D (LabCore) */}
      <div className="nw2-wrap nw2-hero">
        <h1 className="nw2-logo" style={{ margin: 0 }}>
          {s.nextWaveLogo ? (
            <img src={s.nextWaveLogo} alt="Next Wave"
                 style={{ maxHeight: "clamp(110px,20vw,240px)", maxWidth: "100%", width: "auto", objectFit: "contain" }} />
          ) : (
            <InteractiveDotLogo />
          )}
        </h1>

        {/* grid assimétrico: texto + criatura de um lado, reel do outro
            (evita o "tudo centralizado", dá um respiro editorial) */}
        <div className="nw2-hero-grid">
          <Reveal className="nw2-hero-copy" style={{ marginTop: 8 }}>
            <div>
              {edit ? (
                <textarea className="einput" rows={3} value={heroSubtext}
                          onChange={(e) => patchSettings({ nwHeroSubtext: e.target.value })}
                          style={{ width: "100%", maxWidth: "42rem", fontSize: 18, lineHeight: 1.5, resize: "vertical" }} />
              ) : (
                <p className="nw2-sub">{heroSubtext}</p>
              )}
              {edit ? (
                <input className="einput" value={anchorLabel}
                       onChange={(e) => patchSettings({ nwAnchorLabel: e.target.value })}
                       style={{ marginTop: 12, width: 260, fontWeight: 600, color: ACCENTS.coral.text }} />
              ) : (
                <a href="#open-call" className="nw2-anchor"
                   style={{ color: ACCENTS.coral.text, textDecorationColor: ACCENTS.coral.bright }}>
                  {anchorLabel}
                </a>
              )}
            </div>
            <LabCore className="nw2-labcore" />
          </Reveal>

          {/* Reel — vídeo enviado ou placeholder (clicável no modo edição) */}
          <Reveal className="nw2-hero-reel">
            <div className={`nw2-video-panel${s.nwReelUrl ? " has-video" : ""}${edit ? " editable" : ""}`}
                 onClick={edit ? () => reelRef.current?.click() : undefined}
                 role={edit ? "button" : undefined}>
              {s.nwReelUrl ? (
                <video className="nw2-video" src={s.nwReelUrl} autoPlay muted loop playsInline controls={false} />
              ) : (
                <div className="nw2-video-empty">
                  <span className="ring"><Play size={18} weight="fill" /></span>
                  <span className="cap">{reelStatus || (edit ? "Clique para enviar o vídeo do reel" : "Reel em produção")}</span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Laboratório — título à esquerda, pilares à direita (grid assimétrico) */}
      <div className="nw2-wrap nw2-section nw2-lab">
        <Reveal className="nw2-lab-head">
          {edit ? (
            <input className="einput" value={labTitle}
                   onChange={(e) => patchSettings({ nwLabTitle: e.target.value })}
                   style={{ maxWidth: "36rem", fontSize: 34, fontWeight: 900, letterSpacing: "-.02em" }} />
          ) : (
            <h2 className="nw2-h2">{labTitle}</h2>
          )}
        </Reveal>

        <div className="nw2-pillars">
          {pillars.map((pillar, i) => {
            const colors = ACCENTS[pillar.accent] || ACCENTS.coral;
            return (
              <Reveal key={i} delay={i * 0.08} className="nw2-pillar">
                <span className="nw2-bar" style={{ background: colors.bright }} aria-hidden="true" />
                {edit ? (
                  <>
                    <input className="einput" value={pillar.title}
                           onChange={(e) => setPillar(i, "title", e.target.value)}
                           style={{ width: "100%", color: colors.text, fontWeight: 900, fontSize: 24, letterSpacing: "-.02em" }} />
                    <textarea className="einput" rows={2} value={pillar.description}
                              onChange={(e) => setPillar(i, "description", e.target.value)}
                              style={{ width: "100%", marginTop: 8, fontSize: 14, lineHeight: 1.5, resize: "vertical" }} />
                  </>
                ) : (
                  <>
                    <h3 style={{ color: colors.text }}>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                  </>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Chamada aberta */}
      <Reveal className="nw2-wrap nw2-opencall">
        <div id="open-call">
          {edit ? (
            <>
              <textarea className="einput" rows={2} value={openTitle}
                        onChange={(e) => patchSettings({ nwOpenTitle: e.target.value })}
                        style={{ width: "100%", maxWidth: "36rem", fontSize: 30, fontWeight: 900, letterSpacing: "-.02em", resize: "vertical" }} />
              <textarea className="einput" rows={4} value={openBody}
                        onChange={(e) => patchSettings({ nwOpenBody: e.target.value })}
                        style={{ width: "100%", maxWidth: "42rem", marginTop: 12, fontSize: 15, lineHeight: 1.55, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
                <input className="einput" value={openCta}
                       onChange={(e) => patchSettings({ nwOpenCta: e.target.value })}
                       style={{ width: 200, fontWeight: 600 }} placeholder="texto do botão" />
                <input className="einput mono" value={openEmail}
                       onChange={(e) => patchSettings({ nwOpenEmail: e.target.value })}
                       style={{ width: 240, fontSize: 12 }} placeholder="email" />
              </div>
            </>
          ) : (
            <>
              <h2 className="nw2-h2">{openTitle}</h2>
              <p className="nw2-body">{openBody}</p>
              <a href={`mailto:${openEmail}`} className="nw2-cta" style={{ background: ACCENTS.coral.bright }}>
                {openCta}
              </a>
              <p className="nw2-email">{openEmail}</p>
            </>
          )}
        </div>
      </Reveal>

      {/* O rodapé agora é o padrão (BlurFooter) — o logo 3D verde entra no lugar
          do logo do footer, renderizado no próprio BlurFooter. */}

      {edit && (
        <div className="edit-row" style={{ position: "absolute", top: 64, right: 18, justifyContent: "flex-end", zIndex: 20, flexWrap: "wrap", maxWidth: "60vw", gap: 8, background: "rgba(255,255,255,.92)", padding: 8, borderRadius: 10 }}>
          <button className="ebtn" onClick={() => reelRef.current?.click()}>⇪ {reelStatus ? reelStatus : "vídeo do reel"}</button>
          {s.nwReelUrl && (
            <button className="ebtn" onClick={() => patchSettings({ nwReelUrl: null })}>✕ remover vídeo</button>
          )}
          <button className="ebtn" onClick={() => logoRef.current?.click()}>⇪ logo next wave</button>
          {s.nextWaveLogo && (
            <button className="ebtn" onClick={() => patchSettings({ nextWaveLogo: null })}>✕ remover logo</button>
          )}
          <input ref={logoRef} type="file" accept="image/svg+xml,image/*" hidden onChange={onLogo} />
          <input ref={reelRef} type="file" accept="video/*" hidden onChange={onReel} />
        </div>
      )}
    </main>
  );
}

const SCATTER = [
  { w: "clamp(240px,26vw,360px)", ar: "4/3",  mt: "0px" },
  { w: "clamp(150px,17vw,230px)", ar: "3/4",  mt: "140px" },
  { w: "clamp(310px,34vw,460px)", ar: "16/9", mt: "30px" },
  { w: "clamp(170px,19vw,260px)", ar: "1/1",  mt: "200px" },
  { w: "clamp(270px,30vw,400px)", ar: "4/3",  mt: "60px" },
  { w: "clamp(140px,15vw,210px)", ar: "3/4",  mt: "120px" },
  { w: "clamp(330px,36vw,480px)", ar: "16/9", mt: "15px" },
  { w: "clamp(200px,22vw,310px)", ar: "4/3",  mt: "160px" },
];

function ScatteredPhotos({ projects }: { projects: any[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const dragRef = useRef<{ startX: number; startPos: number; prevX: number; prevT: number; vx: number } | null>(null);
  const rafRef = useRef<number>();

  const covers = projects.filter((p: any) => p.cover?.src);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || covers.length === 0) return;
    const AUTO = 0.5, FRICTION = 0.94;
    const tick = () => {
      if (!dragRef.current) {
        posRef.current += AUTO + velRef.current;
        velRef.current *= FRICTION;
        if (Math.abs(velRef.current) < 0.03) velRef.current = 0;
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        if (posRef.current < 0) posRef.current += half;
        el.scrollLeft = posRef.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [covers.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLDivElement).style.cursor = "grabbing";
    velRef.current = 0;
    dragRef.current = { startX: e.clientX, startPos: posRef.current, prevX: e.clientX, prevT: Date.now(), vx: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !wrapRef.current) return;
    const now = Date.now();
    const dt = now - dragRef.current.prevT;
    if (dt > 0) {
      const inst = (dragRef.current.prevX - e.clientX) / dt * 16;
      dragRef.current.vx = dragRef.current.vx * 0.6 + inst * 0.4;
    }
    dragRef.current.prevX = e.clientX;
    dragRef.current.prevT = now;
    const dx = dragRef.current.startX - e.clientX;
    let next = dragRef.current.startPos + dx;
    const half = wrapRef.current.scrollWidth / 2;
    if (next < 0) next += half;
    if (next >= half) next -= half;
    posRef.current = next;
    wrapRef.current.scrollLeft = next;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    velRef.current = dragRef.current.vx;
    dragRef.current = null;
    (e.currentTarget as HTMLDivElement).style.cursor = "grab";
  };

  if (covers.length === 0) return null;
  const all = [...covers, ...covers];

  return (
    <div
      ref={wrapRef}
      className="scattered-outer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp as any}
    >
      <div style={{ display: "flex", gap: "clamp(30px,4vw,56px)", width: "max-content",
                    alignItems: "flex-start", padding: "0 clamp(20px,4.5vw,60px) 20px" }}>
        {all.map((p: any, i: number) => {
          const sz = SCATTER[i % SCATTER.length];
          return (
            <div key={`${p.id}-${i}`}
                 style={{ width: sz.w, aspectRatio: sz.ar, marginTop: sz.mt,
                          flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#111" }}>
              {p.cover.type === "video" ? (
                <video src={`${p.cover.src}#t=0.1`} muted playsInline preload="metadata"
                       style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
              ) : (
                <img src={p.cover.src} alt={p.title} loading="lazy" decoding="async" draggable={false}
                     style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// About editorial: frase de abertura grande e, abaixo, blocos numa grade de 12
// colunas que alternam de posição, então a leitura desce em zigue-zague. O
// conteúdo vem do que o site já tem (texto do About, categorias com seus
// projetos e clientes), sem texto inventado.
function AboutNew({ s, open }: any) {
  const { tx } = useLang();
  return <WorkAbout text={tx(s.aboutText) || ""} projects={WORK} clients={(s.clients || []).filter((c: any) => c?.name)} open={open} />;
}

function About({ s, edit, patchSettings, projects, open }: any) {
  const { t: tr, tx, wx } = useLang();

  const practice = (s.categories as string[])
    .map((k) => ({ k, items: projects.filter((p: any) => p.kind === k) }))
    .filter((b) => b.items.length > 0);
  const clients: any[] = (s.clients || []).filter((c: any) => c?.name);
  // Clientes em três colunas, preenchidas de cima para baixo.
  const perCol = Math.ceil(clients.length / 3);
  const clientCols = [0, 1, 2].map((c) => clients.slice(c * perCol, (c + 1) * perCol)).filter((c) => c.length);

  // Posição de cada bloco na grade: [coluna inicial, largura].
  const passo = (i: number) => (i % 2 === 0 ? [1, 5] : [7, 5]);

  return (
    <main className="rise about-page">
      <section className="about-hero pad">
        <span className="about-label mono">{tr("about.eyebrow")}</span>
        {edit ? (
          <textarea className="einput" rows={5} value={tx(s.aboutText) || ""}
                    onChange={(e) => patchSettings({ aboutText: wx(s.aboutText, e.target.value) })}
                    style={{ fontSize: "clamp(22px,3vw,40px)", lineHeight: 1.15, width: "min(1100px,100%)", resize: "vertical" }} />
        ) : (
          <p className="about-lead">{tx(s.aboutText)}</p>
        )}
      </section>

      {practice.length > 0 && (
        <section className="about-sec pad about-practice">
          <span className="about-label mono" style={{ gridColumn: "1 / span 12" }}>{tr("about.practice")}</span>
          {practice.map((b, i) => {
            const [c, w] = passo(i);
            return (
              <div key={b.k} className="about-block" style={{ gridColumn: `${c} / span ${w}` }}>
                <div className="about-block-head">
                  <h2 className="about-block-t">{tx(b.k)}</h2>
                  <span className="about-block-n mono">{b.items.length}</span>
                </div>
                <ul className="about-block-list">
                  {b.items.slice(0, 4).map((p: any) => (
                    <li key={p.id}><button onClick={() => open(p.id)}>{tx(p.title)}</button></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {clientCols.length > 0 && (
        <section className="about-sec pad about-close">
          <span className="about-label mono" style={{ gridColumn: "1 / span 12" }}>{tr("about.clients")}</span>
          {clientCols.map((col, i) => (
            <ul key={i} className="about-clients" style={{ gridColumn: `${1 + i * 4} / span 4` }}>
              {col.map((c: any) => <li key={c.id}>{c.name}</li>)}
            </ul>
          ))}
        </section>
      )}
    </main>
  );
}

// Contact — declaração de marca minimalista. Os dados de contato (e-mail,
// endereço) vivem no rodapé, então a página em si mostra só a marca + convite,
// sem repetir informação e sem fundo "diferente".
function Contact({ s, edit, patchSettings }: any) {
  const { t, tx, wx } = useLang();
  const tagline = tx(s.contactTagline) || "Let's create something together.";
  const email = s.contactEmail ?? "";
  const address = tx(s.contactAddress) ?? "";
  const instagram = s.contactInstagram ?? "@theforcex";
  const igUrl = `https://instagram.com/${instagram.replace(/^@/, "")}`;
  return (
    <main className="contact-page">
      <div className="contact-inner rise">
        <span className="contact-eyebrow mono">{t("contact.eyebrow")}</span>
        {edit ? (
          <textarea className="einput" rows={2} value={tx(s.contactTagline) || ""}
                    onChange={(e) => patchSettings({ contactTagline: wx(s.contactTagline, e.target.value) })}
                    style={{ width: "100%", maxWidth: "14ch", fontSize: 40, fontWeight: 400, letterSpacing: "-.03em", resize: "vertical" }} />
        ) : (
          <h1 className="contact-headline">{tagline}</h1>
        )}

        <div className="contact-details">
          <div className="contact-item">
            <span className="contact-label mono">{t("contact.email")}</span>
            {edit ? (
              <input className="einput" value={email} onChange={(e) => patchSettings({ contactEmail: e.target.value })} style={{ fontSize: 17 }} />
            ) : (
              <a href={`mailto:${email}`} className="contact-value">{email}</a>
            )}
          </div>
          <div className="contact-item">
            <span className="contact-label mono">{t("contact.address")}</span>
            {edit ? (
              <input className="einput" value={address} onChange={(e) => patchSettings({ contactAddress: e.target.value })} style={{ fontSize: 17 }} />
            ) : (
              <span className="contact-value">{address}</span>
            )}
          </div>
          <div className="contact-item">
            <span className="contact-label mono">{t("contact.instagram")}</span>
            {edit ? (
              <input className="einput" value={instagram} onChange={(e) => patchSettings({ contactInstagram: e.target.value })} style={{ fontSize: 17 }} />
            ) : (
              <a href={igUrl} target="_blank" rel="noreferrer" className="contact-value">{instagram}</a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Rodapé elaborado (base na referência): "get in touch" + navegação + contato
// + redes com toggle de tema (sol/lua). A marca gigante fecha a página e o ©
// vem logo abaixo dela. noLogo=true (Next Wave): sem a marca gigante.
// Logo animado no rodapé: sequência de 95 frames WebP num canvas, com o frame
// seguindo o scroll (scroll-scrub). Conforme o usuário chega ao fim da página,
// chega ao frame final ("de frente"). Responsivo ao scroll e ao tamanho da tela.
function FooterLogoAnim() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const N = 95;

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= N; i++) {
      const img = new Image();
      img.src = `/footer-anim/f${String(i).padStart(3, "0")}.webp`;
      imgs.push(img);
    }
    framesRef.current = imgs;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0, lastIdx = -1;
    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const ih = window.innerHeight || 1;
      // progress 0→1: 0 quando o bloco entra por baixo; 1 quando fica totalmente
      // visível (chega ao fundo da página → frame final "de frente").
      let progress = (ih - rect.top) / (rect.height || 1);
      progress = Math.max(0, Math.min(1, progress));
      // invertido: a animação começa "de frente" (f001), então ao rolar até o
      // fim (progress→1) voltamos ao f001 → termina de frente, como pedido.
      const idx = Math.min(N - 1, Math.max(0, Math.round((1 - progress) * (N - 1))));
      const img = framesRef.current[idx];
      if (!img || !img.complete || !img.naturalWidth) { lastIdx = -1; return; }
      if (idx === lastIdx) return;
      lastIdx = idx;
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
      let dw: number, dh: number;
      // no mobile a marca (círculo quadrado, centralizado, com muito branco dos
      // lados) fica pequena com "contain" → usa "cover": preenche a altura e corta
      // só o vazio lateral, deixando o círculo bem maior sem cortar a marca.
      const cover = cw <= 640;
      if (cover ? ir > cr : ir <= cr) { dh = ch; dw = ch * ir; }
      else { dw = cw; dh = cw / ir; }
      ctx.clearRect(0, 0, cw, ch);
      // o logo está ~2.5% à esquerda do centro dentro do frame; compensa p/ ficar
      // no meio exato (mais visível no mobile, onde o "cover" amplia o offset)
      ctx.drawImage(img, (cw - dw) / 2 + dw * 0.025, (ch - dh) / 2, dw, dh);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = r.width + "px";
      canvas.style.height = r.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastIdx = -1;
      draw();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    // redraw enquanto os frames ainda estão carregando
    const iv = setInterval(() => { lastIdx = -1; draw(); }, 200);
    setTimeout(() => clearInterval(iv), 5000);
    resize();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, []);

  return (
    <div ref={wrapRef} className="footer-anim">
      <canvas ref={canvasRef} />
    </div>
  );
}

function BlurFooter({ s, edit, patch, noLogo, nav, theme, onToggleTheme, logo3d }: any) {
  const { t, tx, lang, setLang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const onFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => patch({ logo: r.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const email = s.contactEmail || "";
  const address = s.contactAddress || "";
  const instagram = s.contactInstagram || "@theforcex";
  const igUrl = `https://instagram.com/${instagram.replace(/^@/, "")}`;
  const tagline = tx(s.contactTagline) || t("footer.getintouch");
  const go = (fn: any) => (e: any) => fn?.(e.clientX, e.clientY);

  const submit = (e: any) => {
    e.preventDefault();
    if (!email) return;
    const body = msg ? `?body=${encodeURIComponent(msg)}` : "";
    window.location.href = `mailto:${email}${body}`;
  };

  return (
    <footer className={`site-footer${noLogo ? " footer-nologo" : ""}${logo3d ? " site-footer--nw" : ""}`}>
      <div className="footer-grid">
        {/* Get in touch */}
        <div className="footer-cta">
          <h2 className="footer-cta-title">{tagline}</h2>
          <p className="footer-muted" style={{ marginBottom: 14, maxWidth: "34ch" }}>{t("footer.getintouch.sub")}</p>
          <form className="footer-news" onSubmit={submit}>
            <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)}
                   placeholder={t("footer.message")} aria-label={t("footer.message")} />
            <button type="submit" aria-label="Send"><PaperPlaneRight size={16} weight="fill" /></button>
          </form>
        </div>

        {/* Quick links */}
        <div className="footer-col">
          <span className="footer-lbl">{t("footer.menu")}</span>
          <button className="footer-link" onClick={go(nav?.home)}><WorldRoll>{t("nav.home")}</WorldRoll></button>
          <button className="footer-link" onClick={go(nav?.goAbout)}><WorldRoll>{t("nav.about")}</WorldRoll></button>
          <button className="footer-link" onClick={go(nav?.allWork)}><WorldRoll>{t("nav.work")}</WorldRoll></button>
          <button className="footer-link" onClick={go(nav?.goNextWave)}><WorldRoll>{t("nav.nextwave")}</WorldRoll></button>
          <button className="footer-link" onClick={go(nav?.goContact)}><WorldRoll>{t("nav.contact")}</WorldRoll></button>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <span className="footer-lbl">{t("footer.contact")}</span>
          {email && <a className="footer-link" href={`mailto:${email}`}>{email}</a>}
          {address && <span className="footer-muted">{tx(address)}</span>}
          <a className="footer-link" href={igUrl} target="_blank" rel="noreferrer">{instagram}</a>
        </div>

        {/* Follow */}
        <div className="footer-col">
          <span className="footer-lbl">{t("footer.follow")}</span>
          <div className="footer-social">
            <a href={igUrl} target="_blank" rel="noreferrer" className="footer-soc" aria-label="Instagram"><InstagramLogo size={18} /></a>
          </div>
        </div>

        {/* Theme + language (no Next Wave o dark mode não aparece) */}
        <div className="footer-col">
          <span className="footer-lbl">{logo3d ? (lang === "pt" ? "Idioma" : "Language") : t("footer.theme")}</span>
          {!logo3d && (
            <div className="footer-theme">
              <Sun size={15} weight={theme === "dark" ? "regular" : "fill"} />
              <button type="button" role="switch" aria-checked={theme === "dark"} aria-label="Toggle dark mode"
                      className={`theme-switch${theme === "dark" ? " on" : ""}`} onClick={() => onToggleTheme?.()}>
                <span className="theme-knob" />
              </button>
              <Moon size={15} weight={theme === "dark" ? "fill" : "regular"} />
            </div>
          )}
          <div className="footer-lang">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
            <span>/</span>
            <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
          </div>
        </div>
      </div>

      {!noLogo && (
        <div className="footer-mark">
          {logo3d
            ? <div className="footer-logo3d"><LogoFinale style={{ height: "100%", width: "100%" }} /></div>
            : <FooterLogoAnim />}
        </div>
      )}

      <div className="footer-copy">
        <span className="footer-muted">© 2026 {s.logoText || "THE FORCE"}. {t("footer.rights")}</span>
        <button className="footer-navlink" onClick={() => nav?.top?.()}>{t("footer.backtotop")} <ArrowUp size={12} weight="bold" style={{ verticalAlign: "middle" }} /></button>
      </div>
    </footer>
  );
}

function EditHint() {
  return (
    <div className="mono" style={{ position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 70,
      background: "rgba(0,0,0,.84)", color: "#fff", fontSize: 8.5, padding: "7px 14px",
      borderRadius: 999, letterSpacing: ".06em", maxWidth: "92vw", textAlign: "center" }}>
      texto · ordem · categorias · links · uploads → tudo salva no servidor
    </div>
  );
}
