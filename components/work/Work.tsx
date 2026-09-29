import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../i18n";
import { Mark } from "../world/Site";
import { Engine } from "../world/engine";

/* Obras, página de projeto e rodapé no espírito Apple: fundo branco,
   superfícies cinza-claras (#F5F5F7), cantos bem arredondados, tipografia
   grande e firme, mídia como protagonista. Os projetos vêm de
   components/work.json (gerado por scripts/import-work.mjs). */

export type Media = { type: "video" | "image"; src: string; poster?: string; w?: number; h?: number; hq?: string };
export type Work = {
  id: string; title: string; client?: string; kind?: string; year?: string;
  description?: string | { en?: string; pt?: string }; credits?: string[]; cover: Media; gallery: Media[];
  date?: string; scope?: string; partner?: string;
};

const L = {
  en: { work: "Work", all: "All", projects: "projects", client: "Client", year: "Year", discipline: "Discipline",
    credits: "Credits", next: "Next project", back: "All work", view: "View project", cta: "Let’s create something together.",
    write: "Write to us", explore: "Explore", studio: "Studio", follow: "Follow", top: "Back to top",
    home: "Home", about: "About", nextwave: "Next Wave", contact: "Contact",
    practice: "What we do", clients: "Clients and partners", studio2: "The studio", location: "Location", more: "Next projects", media: "videos and photos", allWorks: "All works", scope: "Scope", date: "Date", partner: "Partner", expand: "View full screen", close: "Close", prev: "Previous", nextM: "Next",
    careers: "Careers", join: "Join us and create the future.", apply: "Apply", open: "Open positions",
    joinText: "We are always looking for people who want to work where art and technology meet. Send your portfolio and tell us which position you are applying for.",
    enquiries: "Enquiries", address: "Address", social: "Social",
    s0: "The Force sails the ocean of art and curatorship for diverse projects developing state-of-the-art pieces for cultural institutions, major exhibitions, events and marketing actions.",
    s1: "The Force is an art technology collective headed by the designer Luciano Ferrarezi, the composer Antonio Curti and the filmmaker Breno Lenhard, based in São Paulo, Brazil. It was conceived in late 2015 with the proposal to use technology as state of the art to connect people and tech and change the architectures of physical and cyberspace.",
    s2: "In mid-2017, The Force merged with Arte 3, one of the biggest cultural companies in Brazil, responsible for several art biennials and major exhibitions, with over 800 projects in the country and abroad.",
    s3: "With over 10 years of experience in Brazil, the team has worked with some of the most recognisable names in the industry. We work with agencies and brands to bring new ideas to life, blending art and technology in virtual and physical environments with a full range of digital tools, light technologies and special effects.",
    services: "Services", index: "All projects",
    lead: "We’re a global creative studio that specializes in delivering high-quality interactive stories.",
    lead2: "We create immersive experiences through any and all media.",
    intro1: "Changing the architectures of physical and cyberspace.",
    intro2: "We are in a constant process to rebuild and revolutionize the awareness of modern living, creating site-specific installations and immersive experiences to transform the way we see the world." },
  pt: { work: "Trabalhos", all: "Todos", projects: "projetos", client: "Cliente", year: "Ano", discipline: "Disciplina",
    credits: "Créditos", next: "Próximo projeto", back: "Todos os trabalhos", view: "Ver projeto", cta: "Vamos criar algo juntos.",
    write: "Fale com a gente", explore: "Navegar", studio: "Estúdio", follow: "Siga", top: "Voltar ao topo",
    home: "Início", about: "Sobre", nextwave: "Next Wave", contact: "Contato",
    practice: "O que fazemos", clients: "Clientes e parceiros", studio2: "O estúdio", location: "Local", more: "Próximos projetos", media: "vídeos e fotos", allWorks: "Todos os trabalhos", scope: "Escopo", date: "Data", partner: "Parceria", expand: "Ver em tela cheia", close: "Fechar", prev: "Anterior", nextM: "Próxima",
    careers: "Carreiras", join: "Junte-se a nós e crie o futuro.", apply: "Candidatar-se", open: "Vagas abertas",
    joinText: "Estamos sempre em busca de pessoas que queiram trabalhar onde arte e tecnologia se encontram. Envie seu portfólio e diga para qual vaga está se candidatando.",
    enquiries: "Contato comercial", address: "Endereço", social: "Redes",
    s0: "A The Force navega pelo oceano da arte e da curadoria em projetos diversos, desenvolvendo peças de ponta para instituições culturais, grandes exposições, eventos e ações de marketing.",
    s1: "A The Force é um coletivo de arte e tecnologia liderado pelo designer Luciano Ferrarezi, pelo compositor Antonio Curti e pelo cineasta Breno Lenhard, com base em São Paulo. Nasceu no fim de 2015 com a proposta de usar a tecnologia de ponta para conectar pessoas e tecnologia e transformar as arquiteturas do espaço físico e do ciberespaço.",
    s2: "Em meados de 2017 a The Force se uniu à Arte 3, uma das maiores empresas culturais do Brasil, responsável por diversas bienais de arte e grandes exposições, com mais de 800 projetos no país e no exterior.",
    s3: "Com mais de 10 anos de experiência no Brasil, o time já trabalhou com alguns dos nomes mais reconhecidos do mercado. Trabalhamos com agências e marcas para dar vida a novas ideias, unindo arte e tecnologia em ambientes virtuais e físicos com ferramentas digitais, tecnologias de luz e efeitos especiais.",
    services: "Serviços", index: "Todos os projetos",
    lead: "Somos um estúdio criativo global especializado em histórias interativas de alta qualidade.",
    lead2: "Criamos experiências imersivas em todos os meios.",
    intro1: "Mudando as arquiteturas do espaço físico e do ciberespaço.",
    intro2: "Estamos em um processo constante de reconstruir e revolucionar a percepção da vida moderna, criando instalações site-specific e experiências imersivas que transformam a forma como vemos o mundo." },
};
/* contato e vagas do site antigo (pasta _Site) */
export const SERVICES = [
  { name: "Studio", example: "alok", items: ["Films", "Virtual Production", "VFX", "VR / AR", "Content", "Games", "Mobile", "Web", "Platforms"] },
  { name: "Live", example: "heineken-rock-in-rio", items: ["Concerts", "Stage Design", "Installations", "Ceremonies", "Events", "Public Spaces", "Art Exhibitions", "Cultural & Educational"] },
];
export const STUDIO = {
  enquiries: "luciano@theforce.cc",
  address: "Alameda Eduardo Prado 667, Campos Elíseos, São Paulo, SP",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/theforcex/" },
    { label: "Facebook", href: "https://www.facebook.com/theforcex/" },
  ],
  jobs: ["Produtor Técnico Júnior", "Designer digital & social media", "Desenvolvedor JavaScript", "Unreal Generalist",
    "Art & Tech Trainee", "Head of Strategic Connections", "Head of Business Operations", "Event & Facilities Manager",
    "Senior Digital Designer", "Creative Developer TouchDesigner", "Design Intern & Social Media"],
};

function useT() { const { lang } = useLang() as any; return L[lang === "pt" ? "pt" : "en"]; }

/* vídeo que toca só quando está na tela (ou no hover, nos cards) */
function Clip({ m, hover = false, eager = false, className = "", onReady }: { m: Media; hover?: boolean; eager?: boolean; className?: string; onReady?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v || m.type !== "video") return;
    // o celular só deixa tocar sozinho vídeo com o atributo muted (o React não o escreve)
    v.muted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    // perto da tela: começa a carregar; visível: toca; longe: pausa. O play é pedido
    // de novo quando chegam dados, porque o load() cancela um play() em andamento.
    // os cards também tocam sozinhos (estáticos pareciam quebrados); fora da tela pausam
    let visible = false;
    const tryPlay = () => { if (visible && v.paused) v.play().catch(() => {}); };
    // no hover (ou toque) garante o play, mesmo que o navegador tenha segurado o autoplay
    const host = hover ? v.closest("button") : null;
    const poke = () => { visible = true; start(); v.play().catch(() => {}); };
    host?.addEventListener("pointerenter", poke); host?.addEventListener("touchstart", poke, { passive: true });
    const start = () => { if (v.preload !== "auto") { v.preload = "auto"; v.load(); } };
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: "600px 0px" });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { start(); tryPlay(); } else v.pause();
    }, { threshold: 0.25 });
    v.addEventListener("loadeddata", tryPlay); v.addEventListener("canplay", tryPlay);
    near.observe(v); io.observe(v);
    return () => { near.disconnect(); io.disconnect(); v.removeEventListener("loadeddata", tryPlay); v.removeEventListener("canplay", tryPlay);
      host?.removeEventListener("pointerenter", poke); host?.removeEventListener("touchstart", poke); };
  }, [m, hover]);
  const orient = (w: number, h: number, el: HTMLElement) => el.classList.toggle("tall", h > w * 1.05);
  if (m.type === "image") return <img className={className} src={m.src} alt="" loading={eager ? "eager" : "lazy"} decoding="async"
    onLoad={(e) => orient(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, e.currentTarget)} />;
  return <video ref={ref} className={className} src={m.src} poster={m.poster} muted loop playsInline preload={eager ? "auto" : "none"}
    onLoadedMetadata={(e) => orient(e.currentTarget.videoWidth, e.currentTarget.videoHeight, e.currentTarget)}
    onCanPlay={onReady} />;
}

/* "Setembro 2022" / "September 2022" na língua do site */
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
};
function dateIn(d: string, lang: string) {
  const [m, y] = d.split(/\s+/);
  if (!y) return d;
  const k = [...MONTHS.en, ...MONTHS.pt].findIndex((x) => x.slice(0, 3).toLowerCase() === m.slice(0, 3).toLowerCase());
  return k < 0 ? d : `${MONTHS[lang === "pt" ? "pt" : "en"][k % 12]} ${y}`;
}

/* tela de celular (muda o arranjo da galeria) */
/* capa vertical vai para a lateral só se couber: na altura da tela ela deve ocupar no máximo
   55% da largura (em tela em pé, como tablet, fica em tela cheia) */
function sideCover(m: Media) {
  if (typeof window === "undefined" || window.innerWidth <= 760) return false;
  const ar = (m.w || 16) / (m.h || 9);
  if (ar >= 1 / 1.05) return false;
  const pad = Math.min(56, Math.max(16, window.innerWidth * 0.04));
  const top = Math.min(124, Math.max(92, window.innerHeight * 0.12));
  return (window.innerHeight - top - pad) * ar <= window.innerWidth * 0.55;
}
function useViewportKey() {
  const [k, setK] = useState(0);
  useEffect(() => { const on = () => setK((x) => x + 1); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  return k;
}

function usePhone() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 760px)");
    const on = () => setV(q.matches); on();
    q.addEventListener("change", on); return () => q.removeEventListener("change", on);
  }, []);
  return v;
}

const arOf = (m: Media) => (m.w && m.h ? m.w / m.h : 16 / 9);

/* abrir projeto (sem animação com "reduzir movimento") */
function zoomOpen(el: HTMLElement, _m: Media, done: () => void, p?: Work) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
  // celular: a capa ocupa o topo; computador com capa vertical: o vídeo fica à direita sobre branco.
  // Nos dois casos o card vira a capa no lugar exato dela.
  if (window.matchMedia("(max-width: 760px)").matches) { openFit(el, done, p, "top"); return; }
  if (p && sideCover(p.cover)) { openFit(el, done, p, "side"); return; }
  // computador: a capa do projeto sobe e ocupa a tela (a imagem assenta em outra
  // velocidade); a página monta por baixo com essa mesma capa e o painel some em fade.
  // Sem título na cortina: o nome aparece uma vez só, na página.
  const lenis = (window as any).__tfLenis?.();
  lenis?.stop?.();
  el.classList.add("wk-press");
  const ov = document.createElement("div");
  ov.className = "wk-curtain";
  const img = p?.cover?.poster || (p?.cover?.type === "image" ? p.cover.src : "");
  ov.innerHTML = `<div class="wk-curtain-bg"></div><div class="wk-curtain-shade"></div>`;
  if (img) (ov.querySelector(".wk-curtain-bg") as HTMLElement).style.backgroundImage = `url("${img}")`;
  document.body.appendChild(ov);
  let went = false;
  const go = () => { if (!went) { went = true; ov.classList.add("in"); } };
  requestAnimationFrame(() => requestAnimationFrame(go)); window.setTimeout(go, 60);
  window.setTimeout(() => {
    done();
    lenis?.start?.();
    window.setTimeout(() => {
      // garante o topo antes de revelar (a rolagem suave pode ter guardado um alvo antigo)
      const l = (window as any).__tfLenis?.(); l?.scrollTo?.(0, { immediate: true, force: true }); window.scrollTo(0, 0);
      ov.classList.add("out");
      window.setTimeout(() => ov.remove(), 800);
    }, 320);
  }, 820);
}

/* celular: o card vira a capa do projeto (que ocupa só o topo da tela).
   Uma janela recortada abre do tamanho do card até o da capa, enquanto a imagem
   dentro cresce por igual (sem esticar). Parte do frame em que o vídeo do card
   estava; o cabeçalho fica por cima o tempo todo; a página monta depois do encaixe. */
function openFit(el: HTMLElement, done: () => void, p: Work | undefined, where: "top" | "side") {
  const lenis = (window as any).__tfLenis?.();
  lenis?.stop?.();
  const from = el.getBoundingClientRect();
  // destino exato: a mesma regra de altura da capa no celular (72svh, mínimo 380px)
  const probe = document.createElement("div");
  // as mesmas regras de posição da capa na página (celular: topo 72svh; computador: vídeo à direita)
  const ar = (p?.cover.w || 16) / (p?.cover.h || 9);
  probe.style.cssText = where === "top"
    ? "position:fixed;left:0;top:0;width:100%;height:72svh;min-height:380px;visibility:hidden;pointer-events:none"
    : `position:fixed;top:clamp(92px,12vh,124px);bottom:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);aspect-ratio:${ar};visibility:hidden;pointer-events:none`;
  document.body.appendChild(probe);
  const to = probe.getBoundingClientRect(); probe.remove();

  // área que contém o card e a capa (o recorte anima dentro dela)
  const U = { l: Math.min(from.left, to.left), t: Math.min(from.top, to.top), r: Math.max(from.right, to.right), b: Math.max(from.bottom, to.bottom) };
  const inset = (x: DOMRect, rad: number) =>
    `inset(${x.top - U.t}px ${U.r - x.right}px ${U.b - x.bottom}px ${x.left - U.l}px round ${rad}px)`;
  const radius = parseFloat(getComputedStyle(el).borderRadius) || 0;

  const ov = document.createElement("div");
  ov.className = "wk-fit";
  const box = document.createElement("div");
  box.className = "wk-fit-box";
  Object.assign(box.style, { left: `${U.l}px`, top: `${U.t}px`, width: `${U.r - U.l}px`, height: `${U.b - U.t}px`, clipPath: inset(from, radius) });

  // a imagem no tamanho e lugar finais (a capa); começa encolhida por igual sobre o card
  const v = el.querySelector("video") as HTMLVideoElement | null;
  let media: HTMLElement;
  if (v && v.readyState >= 2 && v.videoWidth) {
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    try { c.getContext("2d")?.drawImage(v, 0, 0); } catch {}
    media = c;
  } else {
    const i = document.createElement("img");
    i.src = p?.cover?.poster || (p?.cover?.type === "image" ? p.cover.src : "");
    media = i;
  }
  media.className = "wk-fit-media";
  const k = Math.max(from.width / to.width, from.height / to.height);
  const dx = (from.left + from.width / 2) - (to.left + to.width / 2), dy = (from.top + from.height / 2) - (to.top + to.height / 2);
  Object.assign(media.style, { left: `${to.left - U.l}px`, top: `${to.top - U.t}px`, width: `${to.width}px`, height: `${to.height}px`,
    transform: `translate3d(${dx}px, ${dy}px, 0) scale(${k})` });
  box.appendChild(media);
  ov.appendChild(box);
  document.body.appendChild(ov);
  el.style.visibility = "hidden";
  // os outros vídeos da página param: a animação fica com o processador só para ela
  const t0 = v ? v.currentTime : 0;
  document.querySelectorAll("video").forEach((x) => { if (!ov.contains(x)) x.pause(); });

  let went = false;
  const go = () => {
    if (went) return; went = true;
    ov.classList.add("in");
    box.style.clipPath = inset(to, where === "side" ? Math.min(26, Math.max(18, window.innerWidth * 0.018)) : 0);
    media.style.transform = "translate3d(0, 0, 0) scale(1)";
  };
  requestAnimationFrame(() => requestAnimationFrame(go)); window.setTimeout(go, 50);
  // encaixou: monta a página por baixo (coberta), põe o vídeo da capa no mesmo instante
  // do card e só então some em fade — sem troca de quadro nem salto
  window.setTimeout(() => {
    done();
    const l = (window as any).__tfLenis?.(); l?.start?.(); l?.scrollTo?.(0, { immediate: true, force: true }); window.scrollTo(0, 0);
    let shown = false;
    const reveal = () => {
      if (shown) return; shown = true;
      ov.classList.add("out");
      el.style.visibility = "";
      window.setTimeout(() => ov.remove(), 400);
    };
    const tryHero = (n = 0) => {
      const hv = document.querySelector(".wk-phero video") as HTMLVideoElement | null;
      if (!hv) { if (n < 10) requestAnimationFrame(() => tryHero(n + 1)); else reveal(); return; }
      const sync = () => { try { if (t0 && hv.duration && t0 < hv.duration) hv.currentTime = t0; } catch {} hv.play().catch(() => {}); };
      if (hv.readyState >= 1) sync(); else hv.addEventListener("loadedmetadata", sync, { once: true });
      hv.addEventListener("playing", () => requestAnimationFrame(reveal), { once: true });
    };
    tryHero();
    window.setTimeout(reveal, 520);   // no máximo: não espera o vídeo para sempre
  }, 640);
}

/* entra na tela uma vez: sobe e aparece (desligado com "reduzir movimento") */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { (e.target as HTMLElement).classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    if (el.classList.contains("rv")) io.observe(el);
    return () => io.disconnect();
  });
  return ref;
}

/* ------------------------------------------------------------ obras ---- */
// Cada projeto ocupa a tela inteira; ao rolar, o próximo sobe por cima do
// anterior (telas empilhadas, sticky).
export function WorkIndex({ projects, open }: { projects: Work[]; open: (id: string) => void }) {
  const t = useT();
  const kinds = useMemo(() => Array.from(new Set(projects.map((p) => p.kind).filter(Boolean))) as string[], [projects]);
  const [kind, setKind] = useState("all");
  const list = projects.filter((p) => kind === "all" || p.kind === kind);
  const total = String(list.length).padStart(2, "0");
  return (
    <div className="wk wk-index" ref={useReveal<HTMLDivElement>()}>
      <header className="wk-intro">
        <h1 className="wk-display">{t.work}</h1>
        <nav className="wk-filter" aria-label="Filter">
          {["all", ...kinds].map((k) => {
            const n = k === "all" ? projects.length : projects.filter((p) => p.kind === k).length;
            return (
              <button key={k} aria-pressed={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                {k === "all" ? t.all : k}
              </button>
            );
          })}
        </nav>
      </header>
      {/* parede: dois por fileira, alternando largo/estreito (7/5, 5/7) */}
      <div className="wk-wall" key={kind}>
      {list.map((p, i) => <Tile key={p.id} p={p} i={i} total={total} open={open} last={i === list.length - 1} />)}
      </div>
    </div>
  );
}

// card grande: dois por fileira, alternando largo/estreito (7/5, 5/7)
function Tile({ p, i, open, last }: { p: Work; i: number; total?: string; open: (id: string) => void; last?: boolean }) {
  const t = useT();
  // fileiras 7/5 e 5/7; se o último ficar sozinho, ocupa a fileira inteira
  const size = last && i % 2 === 0 ? "full" : (Math.floor(i / 2) % 2 === 0) === (i % 2 === 0) ? "big" : "small";
  const strip = p.gallery.slice(0, 3);
  return (
    <section className={`wk-tile rv ${size}`} style={{ ["--d" as any]: `${(i % 2) * 90}ms` }}>
      <button className="wk-screen wk-card2" style={{ ["--ar" as any]: arOf(p.cover) }} onClick={(e) => zoomOpen(e.currentTarget, p.cover, () => open(p.id), p)} aria-label={`${t.view}: ${p.title}`}>
        <span className="wk-screen-media"><Clip m={p.cover} eager={i < 2} hover /></span>
        <span className="wk-screen-shade" />
        <span className="wk-screen-top">
          <span>{p.client}</span>
          <span>{p.year}</span>
        </span>
        {/* no hover: três quadros do projeto, uma prévia do que há dentro */}
        {!!strip.length && (
          <span className="wk-strip" aria-hidden>
            {strip.map((m, k) => <img key={k} src={m.poster || m.src} alt="" loading="lazy" style={{ transitionDelay: `${k * 60}ms` }} />)}
          </span>
        )}
        <span className="wk-screen-bottom">
          <span className="wk-screen-t">{p.title}</span>
          <span className="wk-screen-m"><span>{p.kind}</span></span>
        </span>
      </button>
    </section>
  );
}

/* abertura da Home: o texto do site antigo */
export function WorkIntro() {
  const t = useT();
  return (
    <section className="wk wk-intro-home">
      <p className="wk-ih-1">{t.intro1}</p>
      <p className="wk-ih-2">{t.intro2}</p>
    </section>
  );
}

/* seleção da Home, no mesmo desenho de All Works */
export function WorkSelected({ projects, open, all, title }: { projects: Work[]; open: (id: string) => void; all: () => void; title: string }) {
  const t = useT();
  const sec = useRef<HTMLElement>(null);
  useRailDrag(sec);
  return (
    <section className="wk wk-selected" ref={sec}>
      <header className="wk-sel-head">
        <h2 className="wk-h2">{title}</h2>
        <button className="wk-link" onClick={all}>{t.allWorks} →</button>
      </header>
      <div className="wk-wall wk-sel-rail" ref={useReveal<HTMLDivElement>()} data-lenis-prevent-touch>
        {projects.map((p, i) => <Tile key={p.id} p={p} i={i} open={open} last={i === projects.length - 1} />)}
      </div>
    </section>
  );
}

/* fileira do celular: com o dedo rola sozinha; com mouse (ou no painel de teste)
   arrasta também, e ao soltar encaixa no card mais próximo. Arrasto não abre projeto. */
function useRailDrag(sec: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const rail = sec.current?.querySelector(".wk-sel-rail") as HTMLElement | null;
    if (!rail) return;
    let down = false, moved = false, x0 = 0, s0 = 0, endedAt = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || rail.scrollWidth <= rail.clientWidth) return;
      down = true; moved = false; x0 = e.clientX; s0 = rail.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; rail.style.scrollSnapType = "none"; rail.style.cursor = "grabbing"; }
      if (moved) { rail.scrollLeft = s0 - dx; e.preventDefault(); }
    };
    const onUp = () => {
      if (!down) return; down = false;
      if (!moved) return;
      endedAt = performance.now(); moved = false;
      // encaixa no card mais próximo
      const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      const kids = Array.from(rail.children) as HTMLElement[];
      const near = kids.reduce((b, k) => Math.abs(k.offsetLeft - pad - rail.scrollLeft) < Math.abs(b.offsetLeft - pad - rail.scrollLeft) ? k : b, kids[0]);
      const target = near.offsetLeft - pad, startL = rail.scrollLeft, t0 = performance.now();
      // desliza até o card (feito aqui: o smooth do navegador era interrompido) e só então religa o encaixe
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - k, 3);
        rail.scrollLeft = startL + (target - startL) * e;
        if (k < 1) requestAnimationFrame(step);
        else { rail.style.scrollSnapType = ""; rail.style.cursor = ""; }
      };
      requestAnimationFrame(step);
    };
    // o clique que termina um arrasto não abre o projeto
    const onClick = (e: MouseEvent) => { if (performance.now() - endedAt < 300) { e.preventDefault(); e.stopPropagation(); } };
    rail.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    rail.addEventListener("click", onClick, true);
    rail.addEventListener("dragstart", (e) => e.preventDefault());
    return () => {
      rail.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      rail.removeEventListener("click", onClick, true);
    };
  }, [sec]);
}

/* ------------------------------------------------------- projeto ---- */
export function WorkProject({ p, all, open, back }: { p: Work; all: Work[]; open: (id: string) => void; back: () => void }) {
  const t = useT();
  const i = all.findIndex((x) => x.id === p.id);
  const next = all[(i + 1) % all.length];
  const nexts = [1, 2].map((k) => all[(i + k) % all.length]).filter((q) => q && q.id !== p.id);
  const [full, setFull] = useState(false);
  // o corpo entra no quadro seguinte à capa; o timeout garante isso também em aba de fundo (sem rAF)
  useEffect(() => { setFull(false); const k = requestAnimationFrame(() => setFull(true)); const t = window.setTimeout(() => setFull(true), 120);
    return () => { cancelAnimationFrame(k); clearTimeout(t); }; }, [p.id]);
  // todo projeto abre do topo (para a rolagem suave que ainda estiver em curso)
  useEffect(() => {
    const top = () => { const l = (window as any).__tfLenis?.(); l?.scrollTo?.(0, { immediate: true, force: true }); window.scrollTo(0, 0); };
    top(); const k = requestAnimationFrame(top); return () => cancelAnimationFrame(k);
  }, [p.id]);
  const { lang } = useLang() as any;
  const phone = usePhone();
  const d = p.description;
  useViewportKey();   // recalcula o arranjo da capa quando a janela muda
  const tallCover = !phone && sideCover(p.cover);
  const heroMedia = !phone && p.cover.hq ? { ...p.cover, src: p.cover.hq } : p.cover;
  const all0 = String((typeof d === "object" ? (lang === "pt" ? d?.pt || d?.en : d?.en || d?.pt) : d) || "").split(/\n+/).filter(Boolean);
  // a frase de abertura vai grande; o resto do texto segue em colunas
  const first = all0[0] || "", cutAt = first.search(/[.!?](\s|$)/);
  const lead = cutAt > 40 && first.length > 200 ? first.slice(0, cutAt + 1) : first;
  const paras = [lead, ...(lead !== first ? [first.slice(lead.length).trim()] : []), ...all0.slice(1)].filter(Boolean);
  // abertura curta (frase + 1 parágrafo); o resto entra entre as fileiras da galeria
  const extra = paras.slice(2);
  // fileiras justificadas: vídeo largo sozinho; o resto se junta até a fileira
  // ficar larga o bastante. Nada é cortado e nada fica sozinho no meio.
  const ar = (m: Media) => (m.w && m.h ? m.w / m.h : 16 / 9);
  const [big, setBig] = useState(-1);   // mídia aberta em tela cheia (-1 = nenhuma)
  const rows: Media[][] = [];
  let cur: Media[] = [];
  const sum = (r: Media[]) => r.reduce((a, m) => a + ar(m), 0);
  if (phone) {
    // celular: horizontal ocupa a largura; verticais lado a lado, de dois em dois
    for (const m of p.gallery) {
      // vertical esperando par continua esperando (não fica sozinho entre horizontais)
      if (ar(m) >= 1.15) { rows.push([m]); continue; }
      cur.push(m);
      if (cur.length === 2) { rows.push(cur); cur = []; }
    }
    // vertical que sobrou sozinho ocupa a largura toda: no celular nunca mais de 2 por fileira
    if (cur.length) rows.push(cur);
  } else
  for (const m of p.gallery) {
    if (ar(m) >= 1.5 && m.type === "video") { if (cur.length) { rows.push(cur); cur = []; } rows.push([m]); continue; }
    cur.push(m);
    if (sum(cur) >= 1.9 || cur.length === 3) { rows.push(cur); cur = []; }
  }
  if (cur.length && !phone) {
    // sobra estreita: junta com a fileira anterior (ou com o vídeo largo vizinho)
    const prev = rows[rows.length - 1];
    if (sum(cur) < 1.3 && prev) prev.push(...cur); else rows.push(cur);
  }
  return (
    <div className="wk wk-proj" ref={useReveal<HTMLDivElement>()}>
      <section className="wk-slide wk-phero">
        {/* no computador a capa usa a versão em alta; capa vertical em tela horizontal vai
            inteira na lateral direita, sobre fundo branco, com o texto à esquerda */}
        <div className={`wk-screen${tallCover ? " wk-tallhero" : ""}`} style={{ ["--ar" as any]: arOf(p.cover) }}>
          <span className="wk-screen-media">
            <Clip m={heroMedia} eager onReady={() => window.dispatchEvent(new Event("wk-hero-ready"))} />
          </span>
          {!tallCover && <span className="wk-screen-shade" />}
          <span className="wk-screen-bottom">
            <h1 className="wk-screen-t"><span>{p.title}</span></h1>
            <dl className="wk-hero-facts">
              {p.client && <div><dt>{t.client}</dt><dd>{p.client}</dd></div>}
              {p.kind && <div><dt>{t.discipline}</dt><dd>{p.kind}</dd></div>}
              {p.year && <div><dt>{t.year}</dt><dd>{p.year}</dd></div>}
            </dl>
          </span>
        </div>
      </section>

      {full && <>
      <section className="wk-story">
        {paras[0] && <p className="wk-story-lead rv">{paras[0]}</p>}
        <div className="wk-story-grid rv">
          {paras[1] && <div className="wk-desc"><p>{paras[1]}</p></div>}
        </div>
      </section>

      <section className="wk-gallery">
        {rows.map((r, k) => {
          const txt = extra[k];
          return (
            <Fragment key={k}>
              <div className="wk-jrow">
                {r.map((m, j) => (
                  // soma das proporções < 1 (um vertical sozinho) faria o flex usar só parte da largura
                  <button key={j} type="button" className="wk-frame" aria-label={t.expand}
                    onClick={() => setBig(p.gallery.indexOf(m))}
                    style={{ flex: `${ar(m) / Math.min(1, sum(r))} 1 0%`, aspectRatio: String(ar(m)) }}>
                    <Clip m={m} />
                  </button>
                ))}
              </div>
              {txt && <p className={`wk-interlude ${k % 2 ? "right" : "left"}`}>{txt}</p>}
            </Fragment>
          );
        })}
        {/* sobras de texto (galeria curta) vão no fim, na mesma coluna */}
        {extra.slice(rows.length).map((x, k) => <p key={"x" + k} className="wk-interlude left">{x}</p>)}
      </section>

      {!!(p.credits?.length || p.scope || p.date || p.partner) && (
        <section className="wk-credits">
          {/* sem créditos: só escopo/parceiro/data, sem o título Credits */}
          <h2>{p.credits?.length ? t.credits : ""}</h2>
          <div className="wk-credits-body">
            {(p.scope || p.date || p.partner) && (
              <dl className="wk-credits-facts">
                {p.scope && <div><dt>{t.scope}</dt><dd>{p.scope}</dd></div>}
                {p.partner && <div><dt>{t.partner}</dt><dd>{p.partner}</dd></div>}
                {p.date && <div><dt>{t.date}</dt><dd>{dateIn(p.date, lang)}</dd></div>}
              </dl>
            )}
            {!!p.credits?.length && <ul>{p.credits.map((c, k) => <li key={k}>{c}</li>)}</ul>}
          </div>
        </section>
      )}

      </>}
      {big >= 0 && <Lightbox items={p.gallery} i={big} set={setBig} />}
      {full && nexts.length > 0 && (
        <section className="wk-more">
          <h2 className="wk-h2">{t.more}</h2>
          <div className="wk-wall">
            {nexts.map((q, k) => <Tile key={q.id} p={q} i={k} open={open} last={k === nexts.length - 1 && nexts.length % 2 === 1} />)}
          </div>
        </section>
      )}
    </div>
  );
}

/* tela cheia: a mídia inteira sobre fundo preto, abaixo de uma faixa com o × (que não
   fica em cima de nada). Fecha só no × (ou Esc). Zoom: pinça, rodinha/trackpad ou toque
   duplo (1x ↔ 2,5x no ponto tocado); com zoom, arrastar move. Sem zoom, deslizar para o
   lado ou as setas passam para a próxima. */
function Lightbox({ items, i, set }: { items: Media[]; i: number; set: (n: number) => void }) {
  const t = useT();
  const m = items[i];
  const stage = useRef<HTMLDivElement>(null), layer = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const z = useRef({ s: 1, x: 0, y: 0 });
  const close = () => { if (leaving) return; setLeaving(true); window.setTimeout(() => set(-1), 220); };
  const go = (d: number) => { reset(); set((i + d + items.length) % items.length); };
  const apply = (anim = false) => {
    const el = layer.current; if (!el) return;
    el.style.transition = anim ? "transform .28s cubic-bezier(.22,1,.36,1)" : "none";
    el.style.transform = `translate3d(${z.current.x}px, ${z.current.y}px, 0) scale(${z.current.s})`;
    el.style.cursor = z.current.s > 1 ? "grab" : "zoom-in";
  };
  const reset = () => { z.current = { s: 1, x: 0, y: 0 }; apply(true); };
  // zoom em torno de um ponto da tela (cx, cy)
  const zoomAt = (ns: number, cx: number, cy: number, anim = false) => {
    const st = stage.current?.getBoundingClientRect(); if (!st) return;
    const s0 = z.current.s, s1 = Math.min(5, Math.max(1, ns));
    const ox = cx - (st.left + st.width / 2), oy = cy - (st.top + st.height / 2);
    z.current.x = ox - (ox - z.current.x) * (s1 / s0);
    z.current.y = oy - (oy - z.current.y) * (s1 / s0);
    z.current.s = s1;
    if (s1 === 1) { z.current.x = 0; z.current.y = 0; }
    apply(anim);
  };
  useEffect(() => {
    const l = (window as any).__tfLenis?.(); l?.stop?.();
    return () => { l?.start?.(); };
  }, []);
  useEffect(() => { reset(); }, [i]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    // rodinha / pinça do trackpad
    const st = stage.current;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(z.current.s * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); };
    st?.addEventListener("wheel", onWheel, { passive: false });
    return () => { window.removeEventListener("keydown", onKey); st?.removeEventListener("wheel", onWheel); };
  });
  // ponteiros: 1 dedo arrasta (com zoom) ou desliza (sem zoom); 2 dedos fazem pinça
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const g = useRef({ d0: 0, s0: 1, x0: 0, y0: 0, sx: 0, sy: 0, moved: false, lastTap: 0 });
  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = Array.from(pts.current.values());
    if (p.length === 2) { g.current.d0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); g.current.s0 = z.current.s; }
    else { g.current.sx = e.clientX; g.current.sy = e.clientY; g.current.x0 = z.current.x; g.current.y0 = z.current.y; g.current.moved = false; }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = Array.from(pts.current.values());
    if (p.length === 2) {
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      zoomAt(g.current.s0 * (d / (g.current.d0 || d)), (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
      g.current.moved = true; return;
    }
    const dx = e.clientX - g.current.sx, dy = e.clientY - g.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.current.moved = true;
    if (z.current.s > 1) { z.current.x = g.current.x0 + dx; z.current.y = g.current.y0 + dy; apply(); }
  };
  const onUp = (e: React.PointerEvent) => {
    const wasTwo = pts.current.size === 2;
    pts.current.delete(e.pointerId);
    if (wasTwo) return;
    const dx = e.clientX - g.current.sx, dy = e.clientY - g.current.sy;
    if (z.current.s === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && items.length > 1) { go(dx < 0 ? 1 : -1); return; }
    if (!g.current.moved) {
      // toque duplo / duplo clique: 1x <-> 2,5x no ponto
      const now = performance.now();
      if (now - g.current.lastTap < 300) { zoomAt(z.current.s > 1 ? 1 : 2.5, e.clientX, e.clientY, true); g.current.lastTap = 0; }
      else g.current.lastTap = now;
    }
  };
  return (
    <div className={`wk-lb${leaving ? " out" : ""}`} role="dialog" aria-modal="true">
      <div className="wk-lb-bar">
        <button type="button" className="wk-lb-x" aria-label={t.close} onClick={close}>×</button>
      </div>
      <div ref={stage} className="wk-lb-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div ref={layer} className="wk-lb-media">
          {m.type === "video"
            ? <video key={m.src} src={m.hq || m.src} poster={m.poster} autoPlay loop muted playsInline draggable={false} />
            : <img key={m.src} src={m.src} alt="" draggable={false} />}
        </div>
        {items.length > 1 && <>
          <button type="button" className="wk-lb-nav prev" aria-label={t.prev} onPointerDown={(e) => e.stopPropagation()} onClick={() => go(-1)}>←</button>
          <button type="button" className="wk-lb-nav next" aria-label={t.nextM} onPointerDown={(e) => e.stopPropagation()} onClick={() => go(1)}>→</button>
        </>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- sobre ---- */
// a marca de metal sobre o piso espelhado (mesmo cenário do Contato), fixa
// atrás da abertura; o resto da página passa por cima
function AboutLogo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let e: Engine | null = null;
    try { e = new Engine(ref.current, "contact" as any); } catch {}
    return () => e?.dispose();
  }, []);
  return <canvas ref={ref} className="wk-ab-3d" aria-hidden="true" />;
}

export function WorkAbout({ text, projects, clients, open }: { text: string; projects: Work[]; clients: any[]; open: (id: string) => void }) {
  const t = useT();
  const reel = projects.find((p) => p.id === "the-force-reel");
  const [hot, setHot] = useState<Work | null>(null);
  // clientes reais, tirados dos próprios projetos
  const names = Array.from(new Set(projects.filter((p) => p.id !== reel?.id)
    .map((p) => String(p.client || "").split(",")[0].trim()).filter((n) => n && n !== "THE FORCE")));
  // o projeto mais recente daquele cliente (a lista já vem do mais novo)
  const byClient = (n: string) => projects.find((p) => String(p.client || "").split(",")[0].trim() === n) || null;
  const float = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => { const el = float.current; if (el) el.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 120}px)`; };
  return (
    <div className="wk wk-about-p" ref={useReveal<HTMLDivElement>()}>
      <AboutLogo />
      <section className="wk-ab-hero">
        <h1 className="wk-ab-lead"><span>{t.lead}</span></h1>
      </section>
      <div className="wk-ab-body">

      <section className="wk-ab-studio">
        <h2 className="wk-h2 rv">{t.studio2}</h2>
        <div className="wk-ab-studio-text rv">
          <p className="big">{t.lead2} {t.s0}</p>
          <p>{t.s1}</p>
          <p>{t.s2}</p>
          <p>{t.s3}</p>
        </div>
      </section>


      <section className="wk-ab-do">
        <h2 className="wk-h2 rv">{t.services}</h2>
        <div className="wk-ab-list">
          {SERVICES.map((g, i) => (
            <div key={g.name} className="wk-ab-row rv" style={{ ["--d" as any]: `${i * 60}ms` }}>
              <span className="wk-ab-k">{g.name}</span>
              <span className="wk-ab-items">{g.items.map((x) => <span key={x}>{x}</span>)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* clientes: no hover aparece o vídeo do projeto daquele cliente; o clique abre o projeto */}
      <section className="wk-ab-clients" onMouseMove={move} onMouseLeave={() => setHot(null)}>
        <h2 className="wk-h2 rv">{t.clients}</h2>
        <p className="wk-ab-names rv">
          {names.map((n, i) => {
            const pr = byClient(n);
            return (
              <Fragment key={n}>
                <button className="wk-ab-name" onMouseEnter={() => setHot(pr)} onFocus={() => setHot(pr)} onBlur={() => setHot(null)}
                  onClick={(e) => pr && zoomOpen(e.currentTarget, pr.cover, () => open(pr.id), pr)}>{n}</button>
                {i < names.length - 1 ? ", " : "."}
              </Fragment>
            );
          })}
        </p>
        <div ref={float} className={`wk-ab-float ${hot ? "on" : ""}`} aria-hidden>
          {hot && <Clip key={hot.id} m={hot.cover} eager />}
        </div>
      </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- carreiras ---- */
export function WorkCareers({ s }: { s: any }) {
  const t = useT();
  const email = s?.contactEmail || "theforce@theforce.cc";
  return (
    <div className="wk wk-careers">
      <header className="wk-intro wk-car-head">
        <h1 className="wk-display">{t.join}</h1>
        <p className="wk-car-text">{t.joinText}</p>
      </header>
      <section className="wk-car-list" aria-label={t.open}>
        <h2 className="wk-h2">{t.open}</h2>
        <ul>
          {STUDIO.jobs.map((j) => (
            <li key={j}>
              <a href={`mailto:${email}?subject=${encodeURIComponent(j)}`}>
                <span className="wk-car-role">{j}</span>
                <span className="wk-car-where">THE FORCE LIVE, São Paulo</span>
                <span className="wk-car-apply">{t.apply} <span aria-hidden>→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------- rodapé ---- */
export function WorkFooter({ s, nav }: { s: any; nav: any }) {
  const t = useT();
  const { lang, setLang } = useLang() as any;
  const email = s?.contactEmail || "theforce@theforce.cc";
  return (
    <footer className="wk wk-foot">
      <div className="wk-foot-row">
        <span className="wk-foot-brand"><Mark className="wk-foot-mark" /> THE FORCE</span>
        <nav className="wk-foot-nav" aria-label={t.explore}>
          <button onClick={() => nav.home()}>{t.home}</button>
          <button onClick={() => nav.goAbout()}>{t.about}</button>
          <button onClick={() => nav.allWork()}>{t.work}</button>
          <button onClick={() => nav.goNextWave()}>{t.nextwave}</button>
          <button onClick={() => nav.goContact()}>{t.contact}</button>
          <button onClick={() => nav.goCareers()}>{t.careers}</button>
        </nav>
      </div>
      <div className="wk-foot-mid">
        <a className="wk-foot-mail" href={`mailto:${email}`}>{email}</a>
        <div className="wk-foot-info">
          <div><span>{t.enquiries}</span><a href={`mailto:${STUDIO.enquiries}`}>{STUDIO.enquiries}</a></div>
          <div><span>{t.address}</span><p>{STUDIO.address}</p></div>
          <div><span>{t.social}</span><p className="wk-foot-social">{STUDIO.social.map((x) => <a key={x.label} href={x.href} target="_blank" rel="noreferrer">{x.label}</a>)}</p></div>
        </div>
      </div>
      <div className="wk-foot-bottom">
        <span>© {new Date().getFullYear()} THE FORCE</span>
        <span className="wk-foot-lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
        </span>
        <button onClick={() => nav.top()}>{t.top} ↑</button>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------- estilo ---- */
export function WorkStyle() { return <style>{CSS}</style>; }
const CSS = `
.wk { --wk-ink: #111214; --wk-soft: #6B6D71; --wk-surface: #F3F3F1; --wk-line: rgba(17,18,20,.1);
  --wk-r-l: 28px; --wk-r: 22px; --wk-ease: cubic-bezier(.2,.8,.2,1);
  --wk-pad: clamp(16px, 4vw, 56px);
  font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--wk-ink); background: #FFFFFF; -webkit-font-smoothing: antialiased; }
.wk * { box-sizing: border-box; }
.wk button { font: inherit; color: inherit; background: none; border: 0; padding: 0; text-align: inherit; }
.wk a { color: inherit; text-decoration: none; }
.wk :focus-visible { outline: 1px solid currentColor; outline-offset: 4px; border-radius: 6px; }
.wk sup { font-size: .22em; font-weight: 500; letter-spacing: .04em; vertical-align: top; position: relative; top: .5em; margin-left: .35em;
  font-feature-settings: "tnum"; color: var(--wk-soft); }
.wk-display { margin: 0; font-size: clamp(56px, 10vw, 150px); font-weight: 300; letter-spacing: -.06em; line-height: .92; }
.wk-lbl, .wk-eyebrow { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase; color: var(--wk-soft); }
.wk-link { font-size: 16px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; }
.wk-link:hover { opacity: .6; }

/* telas grandes (obras, capa do projeto, próximo): dentro das margens da
   página, ~80% da altura; um só recuo interno (--in) alinha tudo no card */
.wk-intro { padding: clamp(110px, 16vh, 160px) var(--wk-pad) clamp(30px, 6vh, 60px); }
.wk-filter { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: clamp(26px, 5vh, 44px); }
.wk-filter button { position: relative; font-size: 19px; letter-spacing: -.01em; color: var(--wk-soft); padding: 6px 0; transition: color .2s; }
.wk-filter button sup { font-size: 10px; top: -.1em; }
.wk-filter button:hover, .wk-filter button.on { color: var(--wk-ink); }
.wk-filter button::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: left; transition: transform .5s var(--wk-ease); }
.wk-filter button.on::after, .wk-filter button:hover::after { transform: scaleX(1); }
.wk-slide { padding: 0 var(--wk-pad); margin-bottom: clamp(18px, 4vh, 40px); }
.wk-selected { padding-top: clamp(64px, 12vh, 130px); }
.wk-sel-head .wk-link { white-space: nowrap; }
.wk-sel-head { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; padding: 0 var(--wk-pad) clamp(36px, 6vh, 64px); }
.wk-h2 { margin: 0; font-size: clamp(40px, 6vw, 96px); font-weight: 300; letter-spacing: -.055em; line-height: .95; }
.wk-wall { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(14px, 1.8vw, 24px); padding: 0 var(--wk-pad) clamp(40px, 8vh, 90px); }
.wk-tile.big { grid-column: span 7; }
.wk-tile.full { grid-column: span 12; }
.wk-tile.full .wk-screen { height: min(72vh, 46vw); }
.wk-tile.small { grid-column: span 5; }
.wk-wall .wk-screen { height: min(66vh, 44vw); min-height: 380px; }
/* proporção: tamanho do título e recuo seguem a largura do próprio card (container query) */
.wk-wall .wk-screen-t { font-size: clamp(30px, 7.4cqi, 104px); }
.wk-wall .wk-screen-m { font-size: clamp(18px, 1.9cqi, 22px); }
.wk .wk-screen, .wk-screen { container-type: inline-size; --in: clamp(18px, 4.2cqi, 44px); position: relative; display: block; width: 100%; height: min(78vh, 60vw); min-height: 420px;
  overflow: hidden; border-radius: clamp(22px, 2.4vw, 36px); background: #0B0B0C; color: #FFFFFF; text-align: left; isolation: isolate;
  box-shadow: 0 -12px 40px rgba(0,0,0,.08); }
.wk-screen-media video, .wk-screen-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  transition: transform 1.6s var(--wk-ease); }
button.wk-screen:hover .wk-screen-media video, button.wk-screen:hover .wk-screen-media img { transform: scale(1.012); }
.wk-screen-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 45%),
  linear-gradient(to bottom, rgba(0,0,0,.3) 0%, rgba(0,0,0,0) 22%); pointer-events: none; }
.wk-screen-top { position: absolute; top: var(--in); left: var(--in); right: var(--in);
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px; font-size: 11px; font-weight: 500; letter-spacing: .09em;
  text-transform: uppercase; color: rgba(255,255,255,.88); font-feature-settings: "tnum"; }
.wk-screen-bottom { position: absolute; left: var(--in); right: var(--in); bottom: var(--in);
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 12px 32px; }
.wk-screen-t { margin: 0; font-size: clamp(44px, 7.4vw, 128px); font-weight: 300; letter-spacing: -.06em; line-height: .9; max-width: 11ch;
  text-wrap: balance; margin-bottom: -.08em; }
.wk-screen-m { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; padding-bottom: .35em; font-size: 19px; font-weight: 400;
  letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.88); white-space: nowrap; text-align: right; }
.wk-screen-cta { transition: transform .45s var(--wk-ease); }
button.wk-screen:hover .wk-screen-cta { transform: translateX(3px); }
.wk-back { font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit; }
.wk-back:hover { opacity: .7; }

/* projeto */
.wk-nextslide { position: relative; top: auto; padding: clamp(80px, 11vh, 100px) 0 0; margin: 0; }
/* card: cliente/ano em cima em texto normal, tira de quadros no hover */
.wk-card2 .wk-screen-top { text-transform: none; letter-spacing: -.005em; font-size: clamp(18px, 1.9cqi, 22px); font-weight: 400; }
.wk-card2 .wk-screen-m { text-transform: none; letter-spacing: -.005em; }
.wk-strip { position: absolute; right: var(--in); bottom: calc(var(--in) + 2.6em); display: flex; gap: 8px; pointer-events: none; }
.wk-strip img { width: clamp(64px, 11cqi, 132px); aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; display: block;
  opacity: 0; transform: translateY(8px); transition: opacity .35s ease, transform .5s var(--wk-ease); box-shadow: 0 8px 24px rgba(0,0,0,.25); }
@media (hover: hover) { button.wk-card2:hover .wk-strip img, button.wk-card2:focus-visible .wk-strip img { opacity: 1; transform: none; } }
button.wk-screen:focus-visible { outline: 2px solid var(--wk-ink); outline-offset: 4px; }
/* capa do projeto: bloco de dados à direita, alinhado à base do título */
.wk-hero-facts { margin: 0; display: flex; gap: clamp(20px, 3vw, 48px); align-self: end; padding-bottom: .5em; }
.wk-hero-facts div { display: flex; flex-direction: column; gap: 4px; }
.wk-hero-facts dt { font-size: 16px; color: rgba(255,255,255,.7); }
.wk-hero-facts dd { margin: 0; font-size: 20px; color: #FFFFFF; white-space: nowrap; }
/* próximos projetos */
.wk-more { position: relative; z-index: 2; background: #FFFFFF; padding-top: clamp(64px, 12vh, 130px); }
.wk-more .wk-h2 { padding: 0 var(--wk-pad) clamp(24px, 4vh, 40px); }
/* capa e próximo projeto: textos na mesma margem do resto do site */
.wk-phero .wk-screen, .wk-nextslide .wk-screen { --in: var(--wk-pad); }
.wk-nextslide .wk-screen { height: 100vh; height: 100svh; min-height: 520px; border-radius: 0; box-shadow: none; }
.wk-nextslide .wk-screen-t { font-size: clamp(56px, 9vw, 160px); }

/* capa do projeto: tela cheia, de ponta a ponta (como o hero da Home) */
.wk-phero { position: relative; padding: 0; margin: 0; }
.wk-proj { padding-top: 0; }
.wk-phero .wk-screen { height: 100vh; height: 100svh; min-height: 520px; border-radius: 0; box-shadow: none; }
.wk-phero .wk-screen-top { top: clamp(84px, 12vh, 110px); }
.wk-phero .wk-screen-t { font-size: clamp(56px, 9vw, 160px); }
/* texto do projeto: uma coluna de leitura, frase de abertura moderada */
.wk-story { position: relative; z-index: 2; background: #FFFFFF; padding: clamp(64px, 12vh, 130px) var(--wk-pad) clamp(44px, 8vh, 90px); }
.wk-story-lead { margin: 0 0 clamp(36px, 6vh, 64px); max-width: 26ch; font-size: clamp(28px, 3vw, 46px); font-weight: 300;
  letter-spacing: -.035em; line-height: 1.16; color: var(--wk-ink); text-wrap: pretty; }
.wk-story-grid { display: block; }
.wk-desc { max-width: 62ch; margin: 0; }
.wk-desc p { margin: 0 0 1.35em; font-size: clamp(19px, 1.4vw, 22px); line-height: 1.7; letter-spacing: -.005em; color: #45474B; }
.wk-desc p:last-child { margin-bottom: 0; }
.wk-interlude { margin: clamp(48px, 9vh, 110px) 0; max-width: 58ch; font-size: clamp(19px, 1.4vw, 22px); line-height: 1.7;
  letter-spacing: -.005em; color: #45474B; padding: 0 calc(var(--wk-pad) - clamp(10px, 1.4vw, 20px)); }
.wk-interlude.right { margin-left: 50%; padding-left: 0; }
/* galeria: fileiras justificadas (sem corte, sem mídia sozinha no meio) */
.wk-gallery { position: relative; z-index: 2; background: #FFFFFF; padding: 0 clamp(10px, 1.4vw, 20px); display: flex; flex-direction: column; gap: clamp(10px, 1.4vw, 20px); }
.wk-jrow { display: flex; gap: clamp(10px, 1.4vw, 20px); }
.wk-frame { position: relative; min-width: 0; overflow: hidden; border-radius: clamp(16px, 1.8vw, 26px); background: var(--wk-surface); }
.wk-frame video, .wk-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.wk-credits { position: relative; z-index: 2; background: #FFFFFF; padding: clamp(56px, 10vh, 100px) var(--wk-pad);
  display: grid; grid-template-columns: minmax(200px, 1fr) 2.4fr; gap: clamp(24px, 6vw, 96px); }
.wk-credits h2 { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase; color: var(--wk-soft); }
.wk-credits ul { margin: 0; padding: 0; list-style: none; columns: 2 240px; column-gap: 32px; }
.wk-credits li { font-size: 19px; line-height: 1.65; color: #3B3D41; break-inside: avoid; }
.wk-credits-body { display: flex; flex-direction: column; gap: 28px; min-width: 0; }
.wk-credits-facts { margin: 0; display: flex; flex-wrap: wrap; gap: 16px clamp(28px, 4vw, 64px); }
.wk-credits-facts div { display: flex; flex-direction: column; gap: 4px; }
.wk-credits-facts dt { font-size: 16px; color: var(--wk-soft); }
.wk-credits-facts dd { margin: 0; font-size: 20px; color: var(--wk-ink); }


/* rodapé */
.wk-foot { position: relative; z-index: 1; background: #FFFFFF; padding: clamp(28px, 5vh, 44px) var(--wk-pad) 22px; border-top: 1px solid var(--wk-line); }
.wk-foot-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.wk-foot-brand { display: inline-flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 500; letter-spacing: .005em; }
.wk-foot-mark { width: 18px; height: 18px; transition: transform 1s var(--wk-ease); }
.wk-foot-brand:hover .wk-foot-mark { transform: rotate(180deg); }
.wk-foot-nav { display: flex; flex-wrap: wrap; gap: 4px clamp(18px, 2.4vw, 34px); }
.wk-foot-nav button { min-height: 40px; font-size: 20px; color: #45474B; transition: color .2s; }
.wk-foot-nav button:hover { color: var(--wk-ink); }
.wk-foot-mid { display: flex; justify-content: space-between; align-items: flex-end; gap: 28px; flex-wrap: wrap; padding: clamp(72px, 14vh, 150px) 0 clamp(40px, 7vh, 72px); }
.wk-foot-mail { font-size: clamp(34px, 5.4vw, 92px); font-weight: 300; letter-spacing: -.055em; line-height: 1; transition: opacity .2s; word-break: break-word; }
.wk-foot-mail:hover { opacity: .55; }
.wk-foot-info { display: grid; grid-template-columns: repeat(3, auto); gap: 24px clamp(28px, 4vw, 64px); padding-bottom: .4em; }
.wk-foot-info > div { display: flex; flex-direction: column; gap: 6px; }
.wk-foot-info span { font-size: 16px; color: var(--wk-soft); }
.wk-foot-info p, .wk-foot-info a { margin: 0; font-size: 20px; color: #45474B; }
.wk-foot-info p { max-width: 22ch; }
.wk-foot-info a:hover { color: var(--wk-ink); }
.wk-foot-info p.wk-foot-social { display: flex; gap: 14px; flex-wrap: wrap; max-width: none; }

/* capa do projeto: vertical em tela horizontal -> vídeo inteiro à direita, fundo branco */
.wk-phero .wk-tallhero { background: #FFFFFF; color: var(--wk-ink); box-shadow: none; }
.wk-tallhero .wk-screen-media { position: absolute; display: block; top: clamp(92px, 12vh, 124px); bottom: var(--wk-pad); right: var(--wk-pad);
  aspect-ratio: var(--ar); overflow: hidden; border-radius: clamp(18px, 1.8vw, 26px); background: var(--wk-surface); }
.wk-tallhero .wk-screen-media video, .wk-tallhero .wk-screen-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.wk-tallhero .wk-screen-bottom { right: calc(var(--wk-pad) * 2.5 + (100svh - clamp(92px, 12vh, 124px) - var(--wk-pad)) * var(--ar));
  grid-template-columns: 1fr; gap: clamp(24px, 4vh, 40px); }
.wk-tallhero .wk-screen-t { color: var(--wk-ink); max-width: 9ch; }
.wk-tallhero .wk-hero-facts dt { color: var(--wk-soft); }
.wk-tallhero .wk-hero-facts dd { color: var(--wk-ink); }

/* galeria: mídia clicável e tela cheia */
button.wk-frame { display: block; padding: 0; border: 0; cursor: zoom-in; }
.wk-lb { position: fixed; inset: 0; z-index: 200; background: #08080A; display: flex; flex-direction: column;
  animation: wkLbIn .26s ease both; transition: opacity .22s ease; }
.wk-lb.out { opacity: 0; }
@keyframes wkLbIn { from { opacity: 0; } to { opacity: 1; } }
/* faixa do topo: o × fica aqui, fora da mídia */
.wk-lb-bar { flex: 0 0 auto; display: flex; justify-content: flex-end; align-items: center;
  padding: max(12px, env(safe-area-inset-top)) 14px 10px; }
.wk-lb-x { width: 48px; height: 48px; border: 0; border-radius: 999px; background: rgba(255,255,255,.12); color: #FFFFFF;
  font-size: 28px; line-height: 1; cursor: pointer; transition: background .2s, transform .2s; }
.wk-lb-x:hover { background: rgba(255,255,255,.24); }
.wk-lb-x:active { transform: scale(.94); }
.wk-lb-stage { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center;
  touch-action: none; padding: 0 16px max(16px, env(safe-area-inset-bottom)); }
.wk-lb-media { transform-origin: 50% 50%; will-change: transform; cursor: zoom-in; user-select: none; }
.wk-lb-media video, .wk-lb-media img { display: block; max-width: calc(100vw - 32px); max-height: calc(100svh - 96px); width: auto; height: auto;
  object-fit: contain; border-radius: 12px; pointer-events: none; -webkit-user-drag: none; }
.wk-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border: 0; border-radius: 999px;
  background: rgba(255,255,255,.12); color: #FFFFFF; font-size: 22px; cursor: pointer; transition: background .2s; }
.wk-lb-nav:hover { background: rgba(255,255,255,.24); }
.wk-lb-nav.prev { left: 16px; } .wk-lb-nav.next { right: 16px; }
@media (max-width: 760px) {
  .wk-lb-nav { display: none; }
  .wk-lb-stage { padding: 0 0 max(12px, env(safe-area-inset-bottom)); }
  .wk-lb-media video, .wk-lb-media img { max-width: 100vw; max-height: calc(100svh - 90px); border-radius: 0; }
}

/* home: abertura */
.wk-intro-home { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: clamp(24px, 5vw, 80px); align-items: end;
  padding: clamp(72px, 14vh, 150px) var(--wk-pad) clamp(24px, 4vh, 48px); }
.wk-ih-1 { margin: 0; font-size: clamp(34px, 4.6vw, 76px); font-weight: 300; letter-spacing: -.05em; line-height: 1.02; max-width: 16ch; text-wrap: balance; }
.wk-ih-2 { margin: 0; max-width: 40ch; font-size: clamp(19px, 1.4vw, 22px); line-height: 1.62; color: #45474B; }

/* carreiras */
.wk-careers { padding-bottom: clamp(64px, 12vh, 140px); }
.wk-car-head .wk-display { max-width: 11ch; }
.wk-car-text { margin: clamp(24px, 4vh, 40px) 0 0; max-width: 46ch; font-size: clamp(19px, 1.4vw, 22px); line-height: 1.6; color: #45474B; }
.wk-car-list { padding: clamp(48px, 9vh, 100px) var(--wk-pad) 0; }
.wk-car-list .wk-h2 { margin-bottom: clamp(20px, 3vh, 32px); }
.wk-car-list ul { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--wk-line); }
.wk-car-list li { border-bottom: 1px solid var(--wk-line); }
.wk-car-list a { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto; align-items: baseline; gap: 16px;
  padding: clamp(18px, 2.6vh, 26px) 0; transition: opacity .2s; }
.wk-car-role { font-size: clamp(20px, 2vw, 30px); font-weight: 300; letter-spacing: -.03em; }
.wk-car-where { font-size: 18px; color: var(--wk-soft); }
.wk-car-apply { font-size: 18px; color: var(--wk-ink); }
.wk-car-apply span { display: inline-block; transition: transform .35s var(--wk-ease); }
@media (hover: hover) { .wk-car-list a:hover .wk-car-apply span { transform: translateX(4px); } .wk-car-list ul:hover a:not(:hover) { opacity: .45; } }
.wk-foot-bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding-top: 16px; border-top: 1px solid var(--wk-line); font-size: 17px; color: var(--wk-soft); }
.wk-foot-lang { display: inline-flex; gap: 14px; }
.wk-foot-lang button { color: var(--wk-soft); min-height: 28px; }
.wk-foot-lang button.on { color: var(--wk-ink); }
.wk-foot-bottom > button { min-height: 28px; }
.wk-foot-bottom > button:hover { color: var(--wk-ink); }

/* movimento contido: hover dos vídeos, sublinhado do filtro e a cortina ao abrir projeto */
.wk-curtain { position: fixed; inset: 0; z-index: 9000; overflow: hidden; background: #0E0F11; pointer-events: none;
  transform: translate3d(0, 100%, 0); transition: transform .8s cubic-bezier(.76,0,.24,1), opacity .7s ease; will-change: transform, opacity; }
.wk-curtain.in { transform: translate3d(0, 0, 0); }
/* sai sem se mexer: some por cima da capa igual da página */
.wk-curtain.out { transform: translate3d(0, 0, 0); opacity: 0; }
.wk-curtain-bg { position: absolute; inset: 0; background: center / cover no-repeat;
  transform: translate3d(0, -12%, 0) scale(1.1); transition: transform 1.1s cubic-bezier(.2,.8,.2,1); will-change: transform; }
.wk-curtain.in .wk-curtain-bg, .wk-curtain.out .wk-curtain-bg { transform: none; }
/* celular: o card vira a capa (recorte que abre + imagem que cresce por igual) */
.wk-fit { position: fixed; inset: 0; z-index: 101; pointer-events: none; background: rgba(255,255,255,0); transition: background .4s ease, opacity .3s ease; }
.wk-fit.in { background: #FFFFFF; }
.wk-fit.out { opacity: 0; }
.wk-fit-box { position: absolute; will-change: clip-path; transition: clip-path .6s cubic-bezier(.32,.72,0,1); }
.wk-fit-media { position: absolute; object-fit: cover; display: block; transform-origin: 50% 50%; will-change: transform;
  transition: transform .6s cubic-bezier(.32,.72,0,1); }
.wk-curtain-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.35), rgba(0,0,0,0) 45%); }
/* resposta ao toque no card clicado */
.wk-press { transform: scale(.985); transition: transform .4s cubic-bezier(.2,.8,.2,1); }

/* sobre */
.wk-about-p { position: relative; }
.wk-ab-3d { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; display: block; }
.wk-ab-hero { position: relative; z-index: 1; min-height: 100vh; min-height: 100svh; display: flex; align-items: flex-end;
  padding: clamp(120px, 18vh, 190px) var(--wk-pad) clamp(40px, 9vh, 96px); pointer-events: none; }
.wk-ab-body { position: relative; z-index: 1; background: #FFFFFF; padding-bottom: clamp(40px, 8vh, 90px); }
.wk-about-p ~ .wk-foot, .tf .wk-foot { position: relative; z-index: 1; background: #FFFFFF; }
.wk-ab-lead { margin: 0; max-width: 17ch; font-size: clamp(34px, 4.4vw, 76px); font-weight: 300; letter-spacing: -.05em; line-height: 1.02; text-wrap: balance; }
.wk-ab-reel { padding: 0 var(--wk-pad); }
.wk-ab-reel video, .wk-ab-reel img { display: block; width: 100%; height: auto; border-radius: clamp(18px, 2vw, 30px); background: var(--wk-surface); }
.wk-ab-studio { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: clamp(24px, 5vw, 80px); align-items: start;
  padding: clamp(80px, 16vh, 170px) var(--wk-pad) 0; }
.wk-ab-studio-text p { margin: 0 0 1.2em; max-width: 38em; font-size: clamp(19px, 1.4vw, 22px); line-height: 1.62; color: #3B3D41; }
.wk-ab-studio-text p.big { font-size: clamp(22px, 2.2vw, 34px); line-height: 1.24; letter-spacing: -.03em; color: var(--wk-ink); font-weight: 300; }
.wk-ab-names { margin: clamp(28px, 5vh, 52px) 0 0; max-width: 30ch; font-size: clamp(30px, 4.2vw, 68px); font-weight: 300; letter-spacing: -.045em; line-height: 1.08; }
.wk-ab-name { font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; transition: color .3s; }
@media (hover: hover) { .wk-ab-names:hover .wk-ab-name { color: #B7B8BB; } .wk-ab-names .wk-ab-name:hover { color: var(--wk-ink); } }
.wk-ab-do { position: relative; padding: clamp(80px, 16vh, 170px) var(--wk-pad) 0; }
.wk-ab-list { margin-top: clamp(28px, 5vh, 52px); border-top: 1px solid var(--wk-line); }
.wk-ab-row { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; align-items: baseline; padding: clamp(14px, 2.4vh, 22px) 0; }
.wk-ab-k { font-size: clamp(32px, 4.4vw, 72px); font-weight: 300; letter-spacing: -.05em; line-height: 1; color: var(--wk-ink);
  transition: transform .6s var(--wk-ease), color .3s; }

@media (hover: hover) { .wk-ab-list:hover .wk-ab-k { color: #B7B8BB; } .wk-ab-row:hover .wk-ab-k { color: var(--wk-ink); transform: translateX(10px); } }
.wk-ab-items { display: flex; flex-wrap: wrap; gap: 4px 18px; }
.wk-ab-items span { font-size: 20px; color: var(--wk-soft); transition: color .2s; }
.wk-ab-row:hover .wk-ab-items span { color: var(--wk-ink); }
.wk-ab-float { position: fixed; left: 0; top: 0; z-index: 50; width: min(26vw, 380px); aspect-ratio: 4 / 3; overflow: hidden; pointer-events: none;
  border-radius: 18px; opacity: 0; transform: translate(-999px, -999px); transition: opacity .35s ease; }
.wk-ab-float.on { opacity: 1; }
.wk-ab-float video, .wk-ab-float img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wk-ab-clients { padding: clamp(80px, 16vh, 170px) var(--wk-pad) clamp(40px, 8vh, 80px); }
.wk-logos { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: clamp(28px, 4vw, 56px) clamp(20px, 3vw, 44px);
  margin-top: clamp(32px, 6vh, 60px); align-items: center; }
.wk-logo { display: flex; align-items: center; justify-content: center; height: 64px; }
.wk-logo img { max-width: 100%; max-height: 42px; object-fit: contain; filter: grayscale(1); opacity: .72; transition: opacity .3s, filter .3s; }
.wk-logo:hover img { opacity: 1; filter: none; }
.wk-logo > span { font-size: 15px; color: var(--wk-soft); }

@media (max-width: 760px) {
  .wk-interlude, .wk-interlude.right { margin: 36px 0 40px; margin-left: 0; padding: 0; font-size: 18px; line-height: 1.65; }
  /* celular: texto dentro do card, quadro 4:5 (capa do projeto igual, de ponta a ponta) */
  .wk .wk-screen, .wk-screen, .wk-wall .wk-screen, .wk-tile.full .wk-screen { height: auto; min-height: 0; aspect-ratio: 4 / 5; }
  .wk-phero .wk-screen, .wk-nextslide .wk-screen { height: auto; min-height: 0; aspect-ratio: 4 / 5; }
  .wk-phero { padding: 0; }
  .wk-nextslide { padding: 64px 0 0; }
  .wk-tile .wk-screen-top { display: none; }
  .wk-phero .wk-screen-top { top: 72px; }
  .wk-screen-bottom { grid-template-columns: 1fr; gap: 8px; }
  .wk .wk-screen-t, .wk-wall .wk-screen-t, .wk-phero .wk-screen-t, .wk-nextslide .wk-screen-t { font-size: clamp(32px, 10vw, 48px); margin: 0; }
  .wk-screen-m, .wk-wall .wk-screen-m { flex-direction: row; justify-content: space-between; align-items: baseline; font-size: 17px; }
  .wk-hero-facts { gap: 18px; flex-wrap: wrap; }
  .wk-hero-facts dd { font-size: 17px; }
  .wk-tile .wk-screen-top { display: flex; }
  .wk-strip { display: none; }
  .wk-sel-head { align-items: flex-end; }
  .wk-h2 { font-size: clamp(36px, 11vw, 56px); }
  .wk-tile.full { grid-column: span 12; }
  .wk-ab-row { grid-template-columns: 1fr; gap: 10px; }
  .wk-ab-studio { grid-template-columns: 1fr; }
  /* galeria no celular: mesma margem do texto, fileiras já montadas para a tela */
  .wk-gallery { padding: 0 var(--wk-pad); gap: 8px; }
  .wk-jrow { gap: 8px; }
  .wk-frame { border-radius: 14px; }
  .wk-ab-float { display: none; }
  .wk-logos { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .wk-filter { flex-wrap: wrap; gap: 4px 18px; }
  .wk-filter button { white-space: nowrap; min-height: 40px; }
  .wk .wk-screen, .wk-screen { height: 72svh; min-height: 380px; }
  .wk-tile.big, .wk-tile.small { grid-column: span 12; }
  .wk-wall .wk-screen { height: 62svh; min-height: 340px; }
  .wk-screen-bottom { grid-template-columns: 1fr; }
  .wk-screen-t { font-size: clamp(40px, 12vw, 64px); }
  .wk-screen-m { flex-direction: row; justify-content: space-between; align-items: baseline; }
  .wk-story-grid, .wk-credits { grid-template-columns: 1fr; }
  .wk-foot-row { flex-direction: column; align-items: flex-start; }
  .wk-foot-info { grid-template-columns: 1fr; gap: 18px; }
  .wk-foot-nav { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; column-gap: 28px; }
  .wk-car-list a { grid-template-columns: 1fr auto; row-gap: 4px; }
  .wk-intro-home { grid-template-columns: 1fr; padding-top: 64px; }
  .wk-car-where { grid-column: 1; grid-row: 2; }
  .wk-car-apply { grid-row: 1 / 3; grid-column: 2; align-self: center; }
}
/* tablet: rodapé em duas colunas (três espremiam o e-mail) */
@media (min-width: 761px) and (max-width: 1100px) {
  .wk-foot-mid { flex-direction: column; align-items: flex-start; }
  .wk-foot-info { width: 100%; grid-template-columns: 1fr 1fr; gap: 28px 32px; }
  .wk-foot-info > div:nth-child(2) { grid-column: 1 / -1; order: 3; }
  .wk-foot-info p { max-width: none; }
  .wk-foot-nav { flex-wrap: wrap; }
}
/* celular: Selected work em fileira arrastável e rodapé mais organizado */
@media (max-width: 760px) {
  /* espaço entre cards maior que a margem: o card anterior sai com folga (sem o risco de 1px na borda) */
  .wk-sel-rail { display: flex; gap: calc(var(--wk-pad) + 10px); overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory;
    scroll-padding: 0 var(--wk-pad); padding: 0 var(--wk-pad) 8px; margin-bottom: clamp(40px, 8vh, 90px); scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .wk-sel-rail::-webkit-scrollbar { display: none; }
  .wk-sel-rail .wk-tile { flex: 0 0 82%; scroll-snap-align: start; }
  .wk-sel-rail .wk-screen { height: auto; min-height: 0; aspect-ratio: 4 / 5; }
  .wk-sel-rail .wk-screen-t { font-size: clamp(32px, 10vw, 44px); }
  .wk-selected { padding-top: 56px; }
  .wk-sel-head { padding-bottom: 40px; }
  /* o logo do cabeçalho fixo já está na tela: sem a marca repetida no rodapé */
  .wk-foot-brand { display: none; }

  .wk-foot { padding: 36px var(--wk-pad) 24px; }
  .wk-foot-row { gap: 22px; }
  .wk-foot-nav { width: 100%; display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px; row-gap: 0; }
  .wk-foot-nav button { min-height: 44px; font-size: 20px; text-align: left; }
  .wk-foot-mid { padding: 48px 0 32px; gap: 28px; flex-direction: column; align-items: flex-start; }
  .wk-foot-mail { font-size: clamp(30px, 9.4vw, 42px); }
  .wk-foot-info { width: 100%; grid-template-columns: 1fr 1fr; gap: 24px 16px; }
  .wk-foot-info > div:nth-child(2) { grid-column: 1 / -1; order: 3; }
  .wk-foot-info p { max-width: none; }
  .wk-foot-info p.wk-foot-social { flex-direction: column; gap: 6px; }
  .wk-foot-info > div { gap: 6px; }
  .wk-foot-info p, .wk-foot-info a { font-size: 18px; }
  .wk-foot-bottom { display: grid; grid-template-columns: 1fr auto; row-gap: 14px; font-size: 15px; }
  .wk-foot-bottom > span:first-child { grid-column: 1; }
  .wk-foot-lang { grid-column: 2; justify-self: end; }
  .wk-foot-bottom > button { grid-column: 1 / -1; justify-self: start; }
}
@media (prefers-reduced-motion: reduce) {
  .wk-screen-media video, .wk-screen-media img, .wk-foot-mark { transition: none; transform: none !important; }
}
`;
