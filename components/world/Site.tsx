import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { LangContext, useLang, type Lang } from "../i18n";
import { Engine } from "./engine";
import { ambient, resetAmbient, type Ambient } from "./audio";
import { loadContent, parse, pathOf, sceneOf, toneOf, mediaOf, ratio, type Content, type Project, type Route, type Media } from "./data";
import { DragGrid, ProjectList } from "./ProjectsGrid";
import { WorldStyle } from "./style";

const NAV: { r: Route; key: string; n: string }[] = [
  { r: { page: "index" }, key: "nav.index", n: "01" },
  { r: { page: "projects" }, key: "nav.projects", n: "02" },
  { r: { page: "about" }, key: "nav.about", n: "03" },
  { r: { page: "nextwave" }, key: "nav.nextwave", n: "04" },
  { r: { page: "contact" }, key: "nav.contact", n: "05" },
];

export default function Site() {
  const [lang, setLang] = useState<Lang>(() => {
    try { const s = localStorage.getItem("tf_lang"); if (s === "pt" || s === "en") return s; } catch {}
    return "en";
  });
  useEffect(() => { try { localStorage.setItem("tf_lang", lang); } catch {} document.documentElement.lang = lang; }, [lang]);
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <World />
    </LangContext.Provider>
  );
}

function World() {
  const { t } = useLang();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [data, setData] = useState<Content | null>(null);
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [ready, setReady] = useState(false);
  const [gl, setGl] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sound, setSound] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");
  const [toneOver, setToneOver] = useState<string | null>(null);
  const [worldHover, setWorldHover] = useState<string | null>(null);
  const amb = useRef<Ambient>();
  if (!amb.current) { resetAmbient(); amb.current = ambient(); }
  // som para ao sair da aba e ao desmontar o site
  useEffect(() => {
    const vis = () => { if (document.hidden && amb.current?.on) { amb.current.toggle(false); setSound(false); } };
    document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); resetAmbient(); };
  }, []);
  const lenis = useRef<Lenis | null>(null);
  const busy = useRef(false);

  // o loader do _document some assim que o app monta; daqui pra frente é o nosso
  useEffect(() => {
    document.getElementById("tf-boot")?.remove(); document.body.classList.add("w-body");
    // cada página abre do topo: o navegador não restaura a rolagem antiga
    try { history.scrollRestoration = "manual"; } catch {}
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadContent().then(setData).catch(() => setData({ settings: {}, projects: [] }));
  }, []);

  useEffect(() => {
    if (!canvas.current) return;
    let e: Engine | null = null;
    try {
      e = new Engine(canvas.current, sceneOf(parse(window.location.pathname)));
      e.onFirstFrame = () => { setGl(true); e!.warm(); };
      setEngine(e);
    } catch { setGl(true); /* sem WebGL: o site segue, só sem cenário */ }
    return () => e?.dispose();
  }, []);

  useEffect(() => {
    const l = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.current = l;
    let raf = 0;
    const f = (tm: number) => { l.raf(tm); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => { cancelAnimationFrame(raf); l.destroy(); };
  }, []);

  // fast: vindo da capa que cresceu até a tela — a página entra direto,
  // sem a pausa de saída
  const go = useCallback(async (r: Route, push = true, fast = false) => {
    if (busy.current) return;
    const same = pathOf(r) === window.location.pathname;
    if (same && push) { setMenu(false); return; }
    busy.current = true;
    setMenu(false);
    setCursorLabel("");
    if (push) history.pushState({}, "", pathOf(r));
    if (!fast) setPhase("out");
    engine?.goTo(sceneOf(r));
    if (!fast) await wait(550);
    setRoute(r);
    lenis.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    engine?.setScroll(0);
    requestAnimationFrame(() => setPhase("in"));
    busy.current = false;
  }, [engine]);

  useEffect(() => {
    const pop = () => go(parse(window.location.pathname), false);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [go]);

  // rolagem da página vira progresso do cenário (câmera anda com a leitura)
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      engine?.setScroll(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [engine]);

  // grade de projetos não rola a página
  useEffect(() => {
    const lock = route.page === "projects" && gridMode() === "grid";
    if (lock) lenis.current?.stop(); else lenis.current?.start();
    document.documentElement.classList.toggle("w-lock", lock);
  }, [route]);

  const minDone = useMinTime(2600);
  useEffect(() => { if (data && gl && minDone) setReady(true); }, [data, gl, minDone]);

  const tick = useCallback(() => amb.current?.tick(), []);
  const open = useCallback((id: string, fast = false) => go({ page: "project", id }, true, fast), [go]);

  // projetos que vivem dentro do mundo 3D (painéis da home): hover vira rótulo
  // do cursor e o clique em área vazia da página abre o projeto
  useEffect(() => {
    if (!engine) return;
    engine.onHover = (id) => setWorldHover(id);
    const click = (e: MouseEvent) => {
      const id = engine.hovered;
      if (!id || (e.target as HTMLElement).closest("button, a, input, .w-grid")) return;
      tick(); open(id);
    };
    window.addEventListener("click", click);
    return () => { engine.onHover = null; window.removeEventListener("click", click); };
  }, [engine, open, tick]);
  useEffect(() => {
    if (!engine || !data) return;
    const s = data.settings;
    const ids: string[] = [...(s.featuredIds || []), ...(s.heroIds || [])];
    const list = Array.from(new Set(ids)).map((id) => data.projects.find((p) => p.id === id)).filter(Boolean) as Project[];
    engine.api("index")?.setFeatured?.((list.length ? list : data.projects).slice(0, 6));
  }, [engine, data]);

  const tone = toneOver ?? toneOf(route);
  return (
    <div className={`w-root tone-${tone} ${ready ? "is-ready" : ""} ${menu ? "menu-open" : ""} ${worldHover ? "world-hover" : ""}`}>
      <WorldStyle />
      <canvas ref={canvas} className="w-canvas" aria-hidden="true" />
      <Loader done={ready} s={data?.settings} />
      <Cursor label={cursorLabel || (worldHover ? "View" : "")} />

      <Header route={route} go={go} menu={menu} setMenu={setMenu} tick={tick} />
      <Menu open={menu} go={go} s={data?.settings} tick={tick} />

      <main className={`w-page phase-${phase}`} key={pathOf(route)}>
        {data && ready && (
          route.page === "index" ? <IndexPage data={data} go={go} open={open} engine={engine} setTone={setToneOver} /> :
          route.page === "projects" ? <ProjectsPage data={data} open={open} engine={engine} tick={tick} setLabel={setCursorLabel} /> :
          route.page === "project" ? <ProjectPage data={data} id={route.id} go={go} open={open} /> :
          route.page === "about" ? <AboutPage data={data} open={open} engine={engine} /> :
          route.page === "nextwave" ? <NextWavePage data={data} /> :
          <ContactPage data={data} />
        )}
      </main>

      <footer className="w-foot">
        <span className="w-mono">©{new Date().getFullYear()} THE FORCE</span>
        <span className="w-mono w-foot-mid"><SaoPauloTime /></span>
        <span className="w-foot-r">
          <LangToggle />
          <button className="w-sound" aria-label={t("sound.toggle")} aria-pressed={sound}
                  onClick={() => setSound(amb.current!.toggle())}>
            {[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * -0.23}s` }} />)}
            <span className="w-mono">{sound ? t("sound.on") : t("sound.off")}</span>
          </button>
        </span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------ loader ---- */
// A marca se desenha no centro enquanto o cenário carrega.
/* a intro da abertura, montada uma única vez pela página (pages/index), fora do app:
   assim ela não recomeça quando os dados chegam. Some quando o app avisa (tf-intro-done). */
export function BootIntro() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const on = () => setDone(true);
    if ((window as any).__tfIntroDone) setDone(true);
    window.addEventListener("tf-intro-done", on);
    return () => window.removeEventListener("tf-intro-done", on);
  }, []);
  return <><WorldStyle /><Loader done={done} /></>;
}

export function Loader({ done }: { done: boolean; s?: any }) {
  // a intro pode ser montada de novo quando os dados chegam: ela continua do ponto
  // em que estava (atraso negativo nas animações), em vez de recomeçar
  const [skip] = useState(() => {
    const w = window as any;
    if (!w.__tfIntroT0) w.__tfIntroT0 = performance.now();
    return Math.round(performance.now() - w.__tfIntroT0);
  });
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const k = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(k);
  }, [done]);
  if (gone) return null;
  return (
    <div className={`w-loader ${done ? "out" : ""}`} style={{ ["--skip" as any]: `${-skip}ms` }}>
      <Mark className="w-loader-mark" draw />
      <div className="w-loader-name">THE FORCE</div>
      <p className="w-loader-sub">Connecting people and tech.</p>
    </div>
  );
}

/* ------------------------------------------------------------- marca ---- */
// A marca da The Force: a bola dentro do anel (a mesma do Next Wave e do
// favicon). Com draw, o anel se desenha e a bola cresce.
export function Mark({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg className={`w-mark ${draw ? "draw" : ""} ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <circle className="w-mark-ring" cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="9" pathLength={1} />
      <circle className="w-mark-ball" cx="50" cy="50" r="16.5" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------ header ---- */
export function Roll({ children }: { children: string }) {
  // texto que rola para cima no hover (a cópia entra por baixo)
  return <span className="w-roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}

function Header({ route, go, menu, setMenu, tick }: any) {
  const { t } = useLang();
  const cur = route.page === "project" ? "projects" : route.page;
  return (
    <header className="w-head">
      <button className="w-logo" onClick={() => go({ page: "index" })} onPointerEnter={tick}><Mark className="w-logo-mark" />THE FORCE<sup>®</sup></button>
      <nav className="w-nav">
        {NAV.map((n) => (
          <button key={n.key} className={`w-nav-a ${cur === n.r.page ? "on" : ""} ${n.r.page === "nextwave" ? "nw" : ""}`} onClick={() => go(n.r)} onPointerEnter={tick}>
            <Roll>{t(n.key)}</Roll>
          </button>
        ))}
      </nav>
      <button className={`w-burger ${menu ? "x" : ""}`} aria-label="Menu" aria-expanded={menu} onClick={() => { tick(); setMenu(!menu); }}>
        <i /><i />
      </button>
    </header>
  );
}

function Menu({ open, go, s, tick }: any) {
  const { t } = useLang();
  const ig = s?.contactInstagram ? String(s.contactInstagram).replace(/^@/, "") : "theforce.cc";
  return (
    <div className={`w-menu ${open ? "on" : ""}`} aria-hidden={!open}>
      <nav className="w-menu-nav">
        {NAV.map((n, i) => (
          <button key={n.key} style={{ transitionDelay: open ? `${0.12 + i * 0.06}s` : "0s" }}
                  onClick={() => go(n.r)} onPointerEnter={tick} tabIndex={open ? 0 : -1}>
            <span className="w-mono">{n.n}</span><Roll>{t(n.key)}</Roll>
          </button>
        ))}
      </nav>
      <div className="w-menu-side">
        {s?.contactEmail && <a href={`mailto:${s.contactEmail}`} tabIndex={open ? 0 : -1}>↳ {s.contactEmail}</a>}
        <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>↳ INSTAGRAM</a>
        {s?.contactAddress && <span>↳ {s.contactAddress}</span>}
      </div>
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <span className="w-lang w-mono">
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>/
      <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
    </span>
  );
}

function SaoPauloTime() {
  const [s, setS] = useState("");
  useEffect(() => {
    const f = () => setS(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    f(); const k = setInterval(f, 15000); return () => clearInterval(k);
  }, []);
  return <>São Paulo — {s}</>;
}

/* ------------------------------------------------------------ cursor ---- */
// Anel que segue o mouse; ganha rótulo sobre o que é clicável/arrastável.
function Cursor({ label }: { label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState("");
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setFine(true);
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const mv = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const c = (e.target as HTMLElement)?.closest?.("[data-cursor], a, button") as HTMLElement | null;
      setAuto(c ? (c.dataset.cursor || "•") : "");
    };
    const f = () => { raf = requestAnimationFrame(f); x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      if (el.current) el.current.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
    window.addEventListener("pointermove", mv); raf = requestAnimationFrame(f);
    return () => { window.removeEventListener("pointermove", mv); cancelAnimationFrame(raf); };
  }, []);
  if (!fine) return null;
  const txt = label || (auto !== "•" ? auto : "");
  return (
    <div ref={el} className={`w-cursor ${auto ? "hot" : ""} ${txt ? "txt" : ""}`}>
      <span className="w-cursor-ring" /><span className="w-cursor-label w-mono">{txt}</span>
    </div>
  );
}

/* ================================================================ páginas */

function Reveal({ children, className = "", as: Tag = "div", delay = 0, ...rest }: any) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`w-reveal ${on ? "on" : ""} ${className}`} style={{ transitionDelay: `${delay}s` }} {...rest}>{children}</Tag>;
}

function Lines({ text, className = "" }: { text: string; className?: string }) {
  // cada palavra sobe de dentro de uma máscara, em cascata
  const words = String(text || "").split(/\s+/).filter(Boolean);
  return (
    <span className={`w-lines ${className}`}>
      {words.map((w, i) => (
        <Fragment key={i}><span className="w-word"><span style={{ transitionDelay: `${0.25 + i * 0.035}s` }}>{w}</span></span>{" "}</Fragment>
      ))}
    </span>
  );
}

function Mediabox({ m, className = "", eager = false, poster, delay = 0 }: { m: Media | null; className?: string; eager?: boolean; poster?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let t = 0;
    if (eager) t = window.setTimeout(() => setOn(true), delay);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !eager) setOn(true);
      const v = el.querySelector("video");
      if (v) { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }
    }, { rootMargin: "300px 0px" });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [eager, delay]);
  return (
    <div ref={ref} className={`w-media ${className}`} style={{ aspectRatio: String(ratio(m)) }}>
      {poster && <img className="w-media-poster" src={poster} alt="" decoding="async" />}
      {on && m && (m.type === "video"
        ? <video className={playing || !poster ? "on" : ""} src={m.src} muted loop playsInline autoPlay preload="metadata" onPlaying={() => setPlaying(true)} />
        : <img src={m.src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />)}
    </div>
  );
}

/* ---------------------------------------------------------------- index */
// A home é um passeio: rolar leva a câmera da margem até o portal, e três
// frases entram e saem no caminho. No fim, os trabalhos em destaque.
function IndexPage({ data, go, open, engine, setTone }: { data: Content; go: any; open: any; engine: Engine | null; setTone: (t: string | null) => void }) {
  const { t, tx } = useLang();
  const s = data.settings;
  // só os trabalhos selecionados no editor (se não houver, os quatro primeiros)
  const featured = useMemo(() => {
    const ids: string[] = [...(s.featuredIds || [])];
    // OCA entra antes de Antitempo
    if (!ids.includes("mareh-oca")) { const at = ids.indexOf("gq-collect"); ids.splice(at < 0 ? ids.length : at, 0, "mareh-oca"); }
    const list = ids.map((id) => data.projects.find((p) => p.id === id)).filter(Boolean) as Project[];
    return list.length ? list : data.projects.slice(0, 4);
  }, [data, s]);
  const diveRef = useRef<HTMLElement>(null);
  const selRef = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(0);
  const [under, setUnder] = useState(false);

  useEffect(() => { engine?.api<any>("index")?.setWorks(featured); }, [engine, featured]);
  // a rolagem conduz o mergulho e qual trabalho está diante da câmera
  useEffect(() => {
    const on = () => {
      const vh = window.innerHeight, y = window.scrollY;
      const dv = diveRef.current, sel = selRef.current;
      if (!dv || !sel) return;
      const dive = Math.min(1, Math.max(0, (y - (dv.offsetTop - vh * 0.6)) / (dv.offsetHeight + vh * 0.5)));
      const focus = Math.min(featured.length - 1, Math.max(0, (y - sel.offsetTop) / vh));
      const api = engine?.api<any>("index");
      api?.setDive(dive); api?.setFocus(focus);
      const c = Math.round(focus);
      setCur((v) => (v === c ? v : c));
      const u = dive > 0.7;
      setUnder((v) => (v === u ? v : u));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [engine, featured.length]);
  useEffect(() => { setTone(null); }, [under, setTone]);
  useEffect(() => () => setTone(null), [setTone]);

  const p = featured[cur];
  return (
    <div className="w-index">
      <section className="w-hero">
        <h1 className="w-hero-t"><Lines text={tx(s.heroHeadline) || "Creative Experience Studio"} /></h1>
        <p className="w-mono w-hero-hint">{t("index.scroll")}</p>
      </section>

      <section ref={diveRef} className="w-stmt">
        <ScrollWords text={tx(s.aboutText) || ""} />
      </section>

      <section ref={selRef} className="w-sel" style={{ height: `${featured.length * 100}vh` }}>
        <div className="w-sel-stick w-pad">
          <div className="w-sel-bot">
            {p && (
              <div className="w-sel-cap" key={p.id}>
                <p className="w-sel-lab">{t("home.selected")}<span className="w-sel-n"><b>{String(cur + 1).padStart(2, "0")}</b> / {String(featured.length).padStart(2, "0")}</span></p>
                <h2 className="w-sel-t"><Lines text={tx(p.title)} /></h2>
                <dl className="w-sel-meta">
                  {p.kind && <div><dt>{t("proj.category")}</dt><dd>{tx(p.kind)}</dd></div>}
                  {p.year && <div><dt>{t("home.year")}</dt><dd>{p.year}</dd></div>}
                </dl>
                <button className="w-cta" onClick={() => open(p.id)}><Roll>{t("home.view")}</Roll> <span>→</span></button>
              </div>
            )}
            <div className="w-sel-side">
              <button className="w-cta w-sel-all" onClick={() => go({ page: "projects" })}><Roll>{t("home.allcta")}</Roll> <span>→</span></button>
              <div className="w-sel-dots">
                {featured.map((q, i) => <i key={q.id} className={i === cur ? "on" : ""} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// Frase em que as palavras acendem conforme a leitura avança na rolagem.
function ScrollWords({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = String(text).split(/\s+/).filter(Boolean);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const spans = Array.from(el.querySelectorAll("span"));
    const on = () => {
      // o texto fica parado (sticky) e acende ao longo da seção inteira
      // mesmo progresso da caminhada da galeria (IndexPage): lê-se com a
      // porta fechada; o texto some antes de a porta abrir e as TVs aparecerem
      const sec = (el.parentElement || el).getBoundingClientRect(), vh = window.innerHeight;
      const w = (vh * 0.6 - sec.top) / (sec.height + vh * 0.5);
      const lit = Math.min(1, Math.max(0, (w - 0.02) / 0.34)) * spans.length;
      spans.forEach((sp, i) => { (sp as HTMLElement).style.opacity = String(0.32 + 0.68 * Math.min(1, Math.max(0, lit - i))); });
      el.style.opacity = String(Math.min(1, Math.max(0, (0.54 - w) / 0.08)));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [text]);
  return <p ref={ref} className="w-stmt-t">{words.map((w, i) => <span key={i}>{w} </span>)}</p>;
}

/* ------------------------------------------------------------- projects */
let gridModeMem: "grid" | "list" = "grid";
const gridMode = () => gridModeMem;

function ProjectsPage({ data, open, engine, tick, setLabel }: any) {
  const { t, tx } = useLang();
  const [mode, setMode] = useState<"grid" | "list">(gridModeMem);
  const [kind, setKind] = useState("all");
  const cats: string[] = (data.settings.categories || []).filter((k: string) => data.projects.some((p: Project) => p.kind === k));
  const list = useMemo(() => data.projects.filter((p: Project) => kind === "all" || p.kind === kind), [data, kind]);
  const setM = (m: "grid" | "list") => {
    gridModeMem = m; setMode(m);
    document.documentElement.classList.toggle("w-lock", m === "grid");
    window.scrollTo(0, 0);
  };
  useEffect(() => () => setLabel(""), [setLabel]);
  return (
    <div className={`w-projects mode-${mode}`}>
      <div className="w-pbar">
        <h1 className="w-ptitle">{t("nav.projects")} <sup className="w-mono">{list.length}</sup></h1>
        <div className="w-filters w-mono">
          <button className={kind === "all" ? "on" : ""} onClick={() => setKind("all")}>{t("work.all")}</button>
          {cats.map((k) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{tx(k)}</button>)}
        </div>
        <div className="w-modes w-mono">
          <button className={mode === "grid" ? "on" : ""} onClick={() => setM("grid")}>{t("view.grid")}</button>/
          <button className={mode === "list" ? "on" : ""} onClick={() => setM("list")}>{t("view.list")}</button>
        </div>
      </div>
      {mode === "grid"
        ? <DragGrid key={kind} projects={list} open={open} engine={engine} tick={tick} onHover={setLabel} />
        : <ProjectList projects={list} open={open} tick={tick} />}
      {mode === "grid" && <p className="w-mono w-drag-hint">{t("view.drag")}</p>}
    </div>
  );
}

/* -------------------------------------------------------------- project */
function ProjectPage({ data, id, go, open }: any) {
  const { t, tx } = useLang();
  const i = data.projects.findIndex((p: Project) => p.id === id);
  const p: Project | undefined = data.projects[i];
  if (!p) return (
    <div className="w-pad w-404"><h1 className="w-ptitle">404</h1>
      <button className="w-cta" onClick={() => go({ page: "projects" })}><Roll>{t("back.all")}</Roll></button></div>
  );
  const next: Project = data.projects[(i + 1) % data.projects.length];
  const gallery = (p.gallery || []).filter((m) => m?.src && m.src !== p.cover?.src);
  const desc = String(tx(p.description) || "").split(/\n+/).filter(Boolean);
  const meta = [
    [t("proj.category"), tx(p.kind)], [t("proj.year"), p.year], [t("proj.location"), tx(p.location)], [t("proj.client"), tx(p.client)],
  ].filter(([, v]) => v);
  return (
    <article className="w-proj">
      <header className="w-proj-head w-pad">
        <button className="w-mono w-back" onClick={() => go({ page: "projects" })}>← {t("back.all")}</button>
        <h1 className="w-proj-t"><Lines text={tx(p.title)} /></h1>
        <dl className="w-proj-meta">
          {meta.map(([k, v]) => <div key={k}><dt className="w-mono">{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </header>
      <div className="w-pad"><Mediabox m={mediaOf(p)} className="w-proj-hero" eager delay={900} poster={`/thumbs/${encodeURIComponent(p.id)}.jpg`} /></div>
      {desc.length > 0 && (
        <section className="w-proj-desc w-pad">
          <Reveal as="p" className="w-proj-lead">{desc[0]}</Reveal>
          <div className="w-proj-body">{desc.slice(1).map((d, k) => <Reveal key={k} as="p" delay={k * 0.05}>{d}</Reveal>)}</div>
        </section>
      )}
      {gallery.length > 0 && (
        <section className="w-gal w-pad">
          {gallery.map((m, k) => {
            // ritmo: a cada três peças, uma ocupa a largura toda
            const full = k % 3 === 0 && ratio(m) > 1.2;
            return <Reveal key={m.src} className={`w-gal-i ${full ? "full" : ""}`}><Mediabox m={m} /></Reveal>;
          })}
        </section>
      )}
      {!!p.credits?.length && (
        <section className="w-credits w-pad">
          <p className="w-mono w-label">{t("proj.credits")}</p>
          <ul>{p.credits.map((c: any, k: number) => <li key={k}>{typeof c === "string" ? c : <><span className="w-mono">{c.role || c.label}</span> {c.name || c.value}</>}</li>)}</ul>
        </section>
      )}
      <button className="w-next" onClick={() => open(next.id)} data-cursor="Next">
        <span className="w-mono">{t("proj.next")}</span>
        <span className="w-next-t">{tx(next.title)}</span>
        <Mediabox m={mediaOf(next)} className="w-next-m" />
      </button>
    </article>
  );
}

/* ---------------------------------------------------------------- about */
function AboutPage({ data, open, engine }: any) {
  const { t, tx } = useLang();
  const s = data.settings;
  // o mergulho acompanha a segunda parte: começa quando ela entra na tela e
  // termina quando chega ao topo; depois, desce devagar até o fim da página
  const secRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const on = () => {
      const el = secRef.current; if (!el) return;
      // a câmera já está embaixo d'água quando o título da segunda parte
      // aparece (cruza a superfície com ele a ~75% da tela)
      const vh = window.innerHeight;
      const head = (el.firstElementChild as HTMLElement) || el;
      const top = head.getBoundingClientRect().top;
      const dive = Math.min(1, Math.max(0, (vh * 0.98 - top) / (vh * 0.55)));
      const max = document.documentElement.scrollHeight - vh;
      const after = Math.max(0, window.scrollY - (el.offsetTop - vh * 0.15)) / Math.max(1, max - (el.offsetTop - vh * 0.15));
      engine?.api("about")?.setDive(dive, Math.min(1, after));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [engine]);
  const practice = (s.categories || [])
    .map((k: string) => ({ k, items: data.projects.filter((p: Project) => p.kind === k) }))
    .filter((b: any) => b.items.length);
  const clients: any[] = (s.clients || []).filter((c: any) => c?.name);
  return (
    <div className="w-about w-pad">
      <section className="w-about-hero">
        <p className="w-mono w-label">{t("about.eyebrow")}</p>
        <h1 className="w-about-lead"><Lines text={tx(s.aboutText)} /></h1>
      </section>
      <section ref={secRef} className="w-about-sec">
        <Reveal as="p" className="w-mono w-label">{t("about.practice")}</Reveal>
        <div className="w-about-grid">
          {practice.map((b: any, i: number) => (
            <Reveal key={b.k} className="w-about-block" delay={(i % 2) * 0.08}>
              <h2><span className="w-mono">{String(i + 1).padStart(2, "0")}</span>{tx(b.k)}<sup className="w-mono">{b.items.length}</sup></h2>
              <ul>{b.items.slice(0, 4).map((p: Project) => <li key={p.id}><button onClick={() => open(p.id)}>{tx(p.title)}</button></li>)}</ul>
            </Reveal>
          ))}
        </div>
      </section>
      {clients.length > 0 && (
        <section className="w-about-sec">
          <Reveal as="p" className="w-mono w-label">{t("about.clients")}</Reveal>
          <div className="w-clients">
            {clients.map((c, i) => (
              <Reveal key={c.id || i} className="w-client" delay={(i % 4) * 0.05}>
                {c.logo ? <img src={c.logo} alt={c.name} /> : <span>{c.name}</span>}
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ next wave */
// Universo próprio: textos por cima da parede de LED, em painéis de "gel"
// (vidro colorido desfocado). Conteúdo editável no /editor (campos nw*).
const NW = {
  heroSubtext: "Onde a THE FORCE testa ideias com inteligência artificial, código e forma, antes de virarem projeto.",
  labTitle: "O laboratório",
  pillars: [
    { title: "IA", description: "Modelos generativos e visão computacional." },
    { title: "3D", description: "Formas e cenas em tempo real." },
    { title: "DESIGN", description: "Tipografia e sistemas visuais." },
    { title: "CÓDIGO CRIATIVO", description: "Shaders e interfaces experimentais." },
  ],
  openTitle: "Chamada aberta para artistas e desenvolvedores.",
  openBody: "Buscamos criadores que trabalham com creative coding, inteligência artificial, novas mídias e arte generativa para colaborar com o laboratório.",
  openCta: "Enviar portfólio",
  openEmail: "nextwave@theforce.cc",
};
const GELS = ["#8B5CF6", "#EC4899", "#06B6D4", "#EAB308"];
function NextWavePage({ data }: any) {
  const { tx, lang } = useLang() as any;
  const s = data.settings;
  const pillars = (s.nwPillars?.length ? s.nwPillars : NW.pillars) as any[];
  const email = s.contactEmail || "theforce@theforce.cc";
  return (
    <div className="w-nw">
      <section className="w-nw-hero w-pad">
        <p className="w-mono w-label">THE FORCE Lab</p>
        <p className="w-nw-sub"><Lines text={tx(s.nwHeroSubtext) || NW.heroSubtext} /></p>
      </section>
      <section className="w-nw-sec w-pad">
        <Reveal as="p" className="w-mono w-label">{tx(s.nwLabTitle) || NW.labTitle}</Reveal>
        <div className="w-nw-pillars">
          {pillars.map((p, i) => (
            <Reveal key={i} className="w-gel" delay={i * 0.08} style={{ ["--gel" as any]: GELS[i % GELS.length] }}>
              <h2>{tx(p.title)}</h2>
              <p>{tx(p.description)}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="w-nw-sec w-nw-open w-pad">
        <Reveal as="h2" className="w-nw-open-t">{tx(s.nwOpenTitle) || NW.openTitle}</Reveal>
        <Reveal as="p" className="w-nw-open-b" delay={0.08}>{tx(s.nwOpenBody) || NW.openBody}</Reveal>
        <a className="w-nw-link" href={`mailto:${email}?subject=Next%20Wave`}>{lang === "pt" ? "Envie seu portfólio" : "Send your portfolio"} <span aria-hidden>→</span></a>
        <p className="w-nw-mail">{email}</p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------- contact */
function ContactPage({ data }: any) {
  const { t, tx, lang } = useLang() as any;
  const s = data.settings;
  const ig = s.contactInstagram ? String(s.contactInstagram).replace(/^@/, "") : "";
  return (
    <div className="w-contact w-pad">
      <p className="w-mono w-label">{t("contact.eyebrow")}</p>
      <h1 className="w-contact-t"><Lines text={tx(s.contactTagline) || t("footer.getintouch")} /></h1>
      {s.contactEmail && (
        <a className="w-contact-mail" href={`mailto:${s.contactEmail}`} data-cursor="Write"><Roll>{s.contactEmail}</Roll></a>
      )}
      {/* contato comercial, endereço e redes do site antigo */}
      <div className="w-contact-grid">
        <div><p className="w-mono w-label">{lang === "pt" ? "Contato comercial" : "Enquiries"}</p><a href="mailto:luciano@theforce.cc">luciano@theforce.cc</a></div>
        <div><p className="w-mono w-label">{t("contact.address")}</p><p>Alameda Eduardo Prado 667, Campos Elíseos, São Paulo, SP</p></div>
        <div><p className="w-mono w-label">{lang === "pt" ? "Redes" : "Social"}</p>
          <p className="w-contact-social">
            <a href={`https://www.instagram.com/${ig || "theforcex"}/`} target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.facebook.com/theforcex/" target="_blank" rel="noreferrer">Facebook</a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- util */
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function useMinTime(ms: number) {
  const [d, setD] = useState(false);
  useEffect(() => { const k = setTimeout(() => setD(true), ms); return () => clearTimeout(k); }, [ms]);
  return d;
}

/* ------------------------------------------------------ página avulsa ---- */
// Usada pelo site publicado (Portfolio): Projetos, Next Wave e Contato novos,
// cada um com o seu cenário 3D, dentro do cabeçalho e da navegação antigos.
export function WorldPage({ page, id, data, open, nav }: { page: "projects" | "nextwave" | "contact" | "project"; id?: string; data: Content; open: (id: string) => void; nav?: (r: Route) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!canvas.current) return;
    let e: Engine | null = null;
    try { e = new Engine(canvas.current, sceneOf({ page } as Route)); setEngine(e); } catch {}
    return () => e?.dispose();
  }, [page]);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      engine?.setScroll(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [engine]);
  // a grade de projetos não rola a página
  useEffect(() => {
    document.documentElement.classList.toggle("w-lock", page === "projects" && gridMode() === "grid");
    return () => document.documentElement.classList.remove("w-lock");
  }, [page]);
  const tick = useCallback(() => {}, []);
  const go = useCallback((id: string) => open(id), [open]);
  const route = useCallback((r: Route) => { if (r.page === "project") open(r.id); else nav?.(r); }, [open, nav]);
  return (
    <div className={`w-root w-embed tone-${toneOf({ page } as Route)} is-ready`} data-label={label}>
      <canvas ref={canvas} className="w-canvas" aria-hidden="true" />
      <main className="w-page phase-in">
        {page === "projects" ? <ProjectsPage data={data} open={go} engine={engine} tick={tick} setLabel={setLabel} /> :
         page === "nextwave" ? <NextWavePage data={data} /> :
         page === "project" ? <ProjectPage key={id} data={data} id={id} go={route} open={go} /> :
         <ContactPage data={data} />}
      </main>
    </div>
  );
}
