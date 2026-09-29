/* Estilo do site novo. Tudo prefixado com w- para não esbarrar no editor
   antigo (/editor), que continua usando o próprio CSS. */
export function WorldStyle() {
  return <style>{CSS}</style>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;0,500;1,300&display=swap');

:root {
  --w-ink: #16181B; --w-soft: #6A6C70; --w-line: rgba(22,24,27,.14);
  --w-bg: #FFFFFF; --w-acc: #C23B7A;
  --w-sans: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --w-mono: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --w-edge: clamp(16px, 2.4vw, 36px);
  --w-ease: cubic-bezier(.19,1,.22,1);
}
html { background: var(--w-bg); }
body.w-body { margin: 0; background: var(--w-bg); overscroll-behavior: none; }
html.w-lock, html.w-lock body { overflow: hidden; height: 100%; }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }

.w-root { font-family: var(--w-sans); color: var(--w-ink); -webkit-font-smoothing: antialiased;
  min-height: 100vh; overflow-x: clip; transition: color .8s var(--w-ease); }
.w-root *, .w-root *::before, .w-root *::after { box-sizing: border-box; }
.w-root.tone-dark { --w-ink: #F2F3EE; --w-soft: rgba(242,243,238,.55); --w-line: rgba(242,243,238,.16); }
.w-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; }
.w-root a { color: inherit; text-decoration: none; }
.w-root ::selection { background: var(--w-ink); color: var(--w-bg); }
html.tf-ball .w-root, html.tf-ball .w-root button, html.tf-ball .w-root a { cursor: none; }
.w-mono { font-family: var(--w-mono); font-size: 15px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase; font-feature-settings: "tnum"; }
.w-label { color: var(--w-soft); margin: 0 0 clamp(18px, 3vh, 32px); }
.w-pad { padding-left: var(--w-edge); padding-right: var(--w-edge); }

.w-canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; z-index: 0; }

/* ------------------------------------------------ loader */
.w-loader { position: fixed; inset: 0; z-index: 200; background: #FFFFFF; color: #16181B;
  font-family: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  transition: clip-path 1.2s var(--w-ease), opacity .6s ease 1s; clip-path: inset(0 0 0 0); }
.w-loader.out { clip-path: inset(0 0 100% 0); }
.w-loader-letter { font-size: clamp(28px, 3vw, 40px); letter-spacing: .2em; font-weight: 300; line-height: 1; height: 1.1em;
  animation: wLetter .19s steps(1) both; }
@keyframes wLetter { from { opacity: 0; transform: translateY(8%); } to { opacity: 1; transform: none; } }
.w-loader-name { margin-top: clamp(14px, 2.4vh, 24px); font-size: 16px; letter-spacing: .02em; }
.w-loader-name sup, .w-logo sup { font-size: .55em; }
.w-loader-sub { max-width: 34ch; margin: 10px auto 0; font-size: 16px; line-height: 1.35; color: rgba(22,24,27,.65); padding: 0 20px; }

/* ------------------------------------------------ marca */
.w-mark { display: inline-block; width: 1em; height: 1em; overflow: visible; }
.w-mark-ring { stroke-dasharray: 1; stroke-dashoffset: 0; transform: rotate(-90deg); transform-origin: 50% 50%; }
.w-mark.draw .w-mark-ring { animation: wRing 2.4s cubic-bezier(.65,0,.35,1) var(--skip, 0ms) both; }
.w-mark.draw .w-mark-ball { transform-origin: 50% 50%; animation: wBall 1.2s cubic-bezier(.34,1.56,.64,1) calc(.9s + var(--skip, 0ms)) both, wPulse 2.2s ease-in-out calc(2.2s + var(--skip, 0ms)) infinite; }
@keyframes wRing { from { stroke-dashoffset: 1; } }
@keyframes wBall { from { transform: scale(0); } }
@keyframes wPulse { 50% { transform: scale(.86); } }
.w-loader-mark { width: clamp(64px, 7vw, 92px); height: auto; margin-bottom: clamp(22px, 4vh, 38px); color: #16181B; }
.w-logo { display: inline-flex; align-items: center; gap: 9px; }
.w-logo-mark { width: 17px; height: 17px; transition: transform .8s var(--w-ease); }
.w-logo:hover .w-logo-mark { transform: rotate(180deg) scale(1.08); }

/* ------------------------------------------------ header / menu */
.w-head { position: fixed; top: 0; left: 0; right: 0; z-index: 60; display: flex; align-items: center; gap: 24px;
  padding: clamp(14px, 2.4vh, 26px) var(--w-edge); pointer-events: none; }
.w-head > * { pointer-events: auto; }
.w-logo { font-size: 17px; font-weight: 500; letter-spacing: .01em; margin-right: auto; }
.w-nav { display: flex; gap: clamp(18px, 2.4vw, 36px); font-size: 16px; }
.w-nav-a { position: relative; opacity: .62; transition: opacity .3s; }
.w-nav-a:hover, .w-nav-a.on { opacity: 1; }
.w-nav-a.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 1px; background: currentColor;
  transform-origin: left; animation: wLine .8s var(--w-ease) both; }
@keyframes wLine { from { transform: scaleX(0); } }
.w-roll { display: inline-grid; overflow: hidden; vertical-align: top; }
.w-roll > span { grid-area: 1 / 1; transition: transform .45s var(--w-ease); }
.w-roll > span + span { transform: translateY(105%); }
button:hover > .w-roll > span:first-child, a:hover > .w-roll > span:first-child { transform: translateY(-105%); }
button:hover > .w-roll > span + span, a:hover > .w-roll > span + span { transform: none; }

.w-burger { width: 34px; height: 34px; display: grid; place-content: center; gap: 6px; margin-left: 8px; }
.w-burger i { display: block; width: 22px; height: 1.5px; background: currentColor; transition: transform .5s var(--w-ease); }
.w-burger.x i:first-child { transform: translateY(3.75px) rotate(45deg); }
.w-burger.x i:last-child { transform: translateY(-3.75px) rotate(-45deg); }

.w-menu { position: fixed; inset: 0; z-index: 55; display: grid; grid-template-columns: 1fr auto; align-items: end;
  gap: 40px; padding: 120px var(--w-edge) clamp(60px, 9vh, 90px);
  background: rgba(246,247,245,.8); backdrop-filter: blur(20px) saturate(1.1); -webkit-backdrop-filter: blur(20px) saturate(1.1);
  color: #16181B; clip-path: inset(0 0 100% 0); transition: clip-path .9s var(--w-ease); }
.tone-dark .w-menu { background: rgba(5,6,5,.78); color: #F2F3EE; }
.w-menu.on { clip-path: inset(0 0 0 0); }
.menu-open .w-head { color: #16181B; }
.tone-dark.menu-open .w-head { color: #F2F3EE; }
.w-menu-nav { display: flex; flex-direction: column; }
.w-menu-nav button { display: flex; align-items: baseline; gap: 18px; font-size: clamp(44px, 8.5vw, 124px); font-weight: 300;
  line-height: 1.02; letter-spacing: -.04em; opacity: 0; transform: translateY(40%); transition: opacity .6s ease, transform .9s var(--w-ease); }
.w-menu.on .w-menu-nav button { opacity: 1; transform: none; }
.w-menu-nav .w-mono { font-size: 15px; letter-spacing: .06em; transform: translateY(-1.6em); }
.w-menu-side { display: flex; flex-direction: column; gap: 10px; font-family: var(--w-mono); font-size: 15px; letter-spacing: .06em;
  text-transform: uppercase; text-align: right; }
.w-menu-side a:hover { opacity: .6; }

/* ------------------------------------------------ rodapé fixo */
.w-foot { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; padding: clamp(12px, 2vh, 22px) var(--w-edge); pointer-events: none; }
.w-foot > * { pointer-events: auto; }
.w-foot-mid { justify-self: center; color: var(--w-soft); }
.w-foot-r { justify-self: end; display: flex; align-items: center; gap: 22px; }
.w-lang button { opacity: .5; padding: 0 3px; } .w-lang button.on { opacity: 1; }
.w-sound { display: inline-flex; align-items: flex-end; gap: 2px; height: 12px; }
.w-sound i { display: block; width: 2px; height: 3px; background: currentColor; }
.w-sound[aria-pressed="true"] i { animation: wBar 1s ease-in-out infinite alternate; }
@keyframes wBar { from { height: 3px; } to { height: 12px; } }
.w-sound .w-mono { margin-left: 8px; line-height: 1; }

/* ------------------------------------------------ cursor */
.w-cursor { position: fixed; left: 0; top: 0; z-index: 300; pointer-events: none; mix-blend-mode: difference; color: #fff; }
.w-cursor-ring { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; border-radius: 50%; background: #fff;
  transition: transform .4s var(--w-ease), background .3s; }
.w-cursor.hot .w-cursor-ring { transform: scale(3.4); background: transparent; box-shadow: inset 0 0 0 .6px #fff; }
.w-cursor.txt .w-cursor-ring { transform: scale(7.2); background: #fff; box-shadow: none; }
.w-cursor-label { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); white-space: nowrap; color: #000;
  opacity: 0; transition: opacity .25s; font-size: 14px; mix-blend-mode: normal; }
.w-cursor.txt .w-cursor-label { opacity: 1; }
.w-cursor.txt { mix-blend-mode: normal; }
.world-hover .w-page { cursor: none; }

/* ------------------------------------------------ troca de página */
.w-page { position: relative; z-index: 10; }
.w-page.phase-out { opacity: 0; transform: translateY(-2vh); filter: blur(6px);
  transition: opacity .5s ease, transform .6s var(--w-ease), filter .5s ease; }
.w-page.phase-in { opacity: 1; transition: opacity .9s ease .35s; }
.w-lines { display: inline; }
.w-word { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .08em; margin-bottom: -.08em; }
.w-word > span { display: inline-block; transform: translateY(105%); transition: transform 1.2s var(--w-ease); }
.is-ready .phase-in .w-word > span { transform: none; }
.w-reveal { opacity: 0; transform: translateY(40px); transition: opacity 1s ease, transform 1.3s var(--w-ease); }
.w-reveal.on { opacity: 1; transform: none; }
.w-media { position: relative; overflow: hidden; background: rgba(0,0,0,.08); width: 100%; }
.w-media img, .w-media video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.w-media-poster ~ video { opacity: 0; transition: opacity .6s ease; }
.w-media-poster ~ video.on { opacity: 1; }

/* ------------------------------------------------ index */
.w-index { position: relative; }
.w-hero { height: 100vh; height: 100svh; display: flex; flex-direction: column; justify-content: flex-end;
  padding: 0 var(--w-edge) clamp(64px, 10vh, 104px); }
.w-hero-t { margin: 0; font-weight: 300; font-size: clamp(44px, 7vw, 124px); line-height: .94; letter-spacing: -.045em; max-width: 10ch; }
.w-hero-hint { margin: clamp(18px, 3vh, 28px) 0 0; color: var(--w-soft); display: flex; align-items: center; gap: 12px; }
.w-hero-hint::before { content: ""; width: 28px; height: 1px; background: currentColor; }
/* frase que acende na leitura */
.w-stmt { height: 230vh; padding: 0 var(--w-edge); }
.w-stmt-t { position: sticky; top: clamp(110px, 20vh, 200px); margin: 0; font-size: clamp(26px, 3.3vw, 54px); font-weight: 300; line-height: 1.14;
  letter-spacing: -.03em; max-width: 21ch; text-shadow: 0 0 22px rgba(255,255,255,.95), 0 0 6px rgba(255,255,255,.9); }
.w-stmt-t { transition: opacity .3s linear; }
.w-stmt-t span { opacity: .32; transition: opacity .35s linear; }
/* trabalhos selecionados, embaixo d'água: legenda fixa enquanto a câmera
   passa pelas telas */
.w-sel { position: relative; }
.w-sel-stick { position: sticky; top: 0; height: 100vh; height: 100svh; display: flex; flex-direction: column; justify-content: flex-end;
  padding-top: clamp(80px, 12vh, 120px); padding-bottom: clamp(70px, 11vh, 110px); pointer-events: none; }
.w-sel-stick > * { pointer-events: auto; }
.w-sel-lab { margin: 0 0 clamp(12px, 2vh, 18px); font-size: 16px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase;
  color: var(--w-soft); display: flex; gap: 14px; animation: wFade .9s ease .2s both; }
.w-sel-n { font-feature-settings: "tnum"; }
.w-sel-n b { color: var(--w-ink); font-weight: 500; }
.w-sel-bot { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; }
.w-sel-cap { max-width: min(34vw, 460px); }
.w-sel-t { margin: 0 0 clamp(18px, 3vh, 26px); font-size: clamp(30px, 3.3vw, 56px); font-weight: 300; letter-spacing: -.035em; line-height: 1.02; }
.w-sel-meta { display: flex; gap: clamp(24px, 3vw, 44px); margin: 0 0 clamp(22px, 3.6vh, 32px); padding-top: 14px; border-top: 1px solid var(--w-line);
  animation: wFade .9s ease .35s both; }
.w-sel-meta div { display: flex; flex-direction: column; gap: 5px; }
.w-sel-meta dt { font-size: 16px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase; color: var(--w-soft); }
.w-sel-meta dd { margin: 0; font-size: 16px; }
.w-sel-cap .w-cta { animation: wFade .9s ease .5s both; margin-top: 0; }
@keyframes wFade { from { opacity: 0; transform: translateY(12px); } }
.w-sel-side { display: flex; flex-direction: column; align-items: flex-end; gap: 18px; }
.w-sel-all { font-size: 16px; }
.w-sel-dots { display: flex; gap: 8px; padding-bottom: 8px; }
.w-sel-dots i { width: 22px; height: 2px; background: var(--w-line); transition: background .4s, width .6s var(--w-ease); }
.w-sel-dots i.on { background: var(--w-ink); width: 44px; }
.w-sel .w-word > span { transform: none; }
.w-sel-cap .w-word > span { animation: wUp 1.1s var(--w-ease) both; }
@keyframes wUp { from { transform: translateY(105%); } }
.w-work-end { display: flex; justify-content: center; padding-top: 10vh; padding-bottom: 24vh; }
@media (max-width: 860px) {
  .w-sel-stick { padding-bottom: clamp(40px, 7vh, 64px); }
  .w-sel-bot { flex-direction: column; align-items: stretch; gap: 20px; margin: 0 calc(-1 * var(--w-edge)); padding: 48px var(--w-edge) 0;
    background: linear-gradient(to top, rgba(255,255,255,.94) 55%, rgba(255,255,255,0)); }
  .w-sel-cap { max-width: 100%; }
  .w-sel-side { flex-direction: row-reverse; justify-content: space-between; align-items: center; }
  .w-sel-dots { padding-bottom: 0; }
  .w-sel-t { font-size: clamp(28px, 8vw, 40px); }
}

/* ------------------------------------------------ projects */
.w-projects { position: relative; min-height: 100vh; }
.w-pbar { position: fixed; top: 0; left: 0; right: 0; z-index: 20; display: grid; grid-template-columns: auto 1fr auto; align-items: end;
  gap: 20px 40px; padding: calc(clamp(14px, 2.4vh, 26px) + 44px) var(--w-edge) 0; pointer-events: none; }
.w-pbar > * { pointer-events: auto; }
.mode-list .w-pbar { position: relative; }
.w-ptitle { margin: 0; font-size: clamp(40px, 6vw, 96px); font-weight: 300; letter-spacing: -.05em; line-height: .9; }
.w-ptitle sup { font-size: 15px; vertical-align: top; margin-left: 6px; letter-spacing: .06em; }
.w-filters { display: flex; flex-wrap: wrap; gap: 6px 16px; padding-bottom: 6px; }
.w-filters button, .w-modes button { opacity: .5; transition: opacity .25s; }
.w-filters button:hover, .w-filters button.on, .w-modes button.on, .w-modes button:hover { opacity: 1; }
.w-filters button.on::before { content: "● "; font-size: 7px; vertical-align: 2px; }
.w-modes { padding-bottom: 6px; display: flex; gap: 6px; }
/* véus no topo e na base: a interface fica legível sobre as capas */
.mode-grid::before, .mode-grid::after { content: ""; position: fixed; left: 0; right: 0; z-index: 15; pointer-events: none; }
.mode-grid::before { top: 0; height: clamp(200px, 34vh, 300px); background: linear-gradient(#050605 18%, rgba(5,6,5,.65) 55%, rgba(5,6,5,0)); }
.mode-grid::after { bottom: 0; height: clamp(90px, 16vh, 150px); background: linear-gradient(rgba(5,6,5,0), #050605 85%); }
.w-grid { position: fixed; inset: 0; overflow: hidden; touch-action: none; user-select: none; z-index: 10; }
.w-grid.is-drag { cursor: grabbing; }
/* legendas da grade 3D: só texto, posicionadas pelo arrasto */
.w-cap { position: absolute; left: 0; top: 0; display: flex; justify-content: space-between; gap: 10px; font-size: 15px;
  pointer-events: none; opacity: .55; transition: opacity .4s ease; will-change: transform; }
.w-cap.on { opacity: 1; }
.w-cap span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-cap .w-mono { font-size: 14px; opacity: .6; white-space: nowrap; }
.w-grid.is-diving .w-cap { opacity: 0; transition: opacity .25s; }
.w-grid.is-diving ~ .w-drag-hint, .w-projects:has(.is-diving) .w-pbar { opacity: 0; transition: opacity .3s; }
.w-drag-hint { position: fixed; left: 50%; bottom: clamp(46px, 7vh, 70px); transform: translateX(-50%); z-index: 20; color: var(--w-soft); pointer-events: none; }
.w-list { padding: clamp(30px, 6vh, 70px) var(--w-edge) 22vh; }
.w-list-row { width: 100%; display: grid; grid-template-columns: 60px 1fr 220px 60px; align-items: baseline; gap: 20px;
  padding: clamp(12px, 2vh, 20px) 0; border-bottom: 1px solid var(--w-line); transition: opacity .3s; }
.w-list:hover .w-list-row { opacity: .4; } .w-list .w-list-row:hover { opacity: 1; }
.w-list-t { font-size: clamp(24px, 3.6vw, 56px); font-weight: 300; letter-spacing: -.04em; line-height: 1.02; }
.w-list-n, .w-list-k, .w-list-y { color: var(--w-soft); }
.w-list-y { text-align: right; }
.w-list-prev { position: fixed; left: 0; top: 0; width: min(26vw, 380px); aspect-ratio: 4/3; overflow: hidden; pointer-events: none;
  z-index: 30; opacity: 0; transition: opacity .35s ease; }
.w-list-prev.on { opacity: 1; }
.w-list-prev img, .w-list-prev video { width: 100%; height: 100%; object-fit: cover; }

/* ------------------------------------------------ project */
.w-proj { padding-bottom: 0; }
.w-proj-head { padding-top: clamp(110px, 20vh, 200px); padding-bottom: clamp(30px, 5vh, 56px); }
.w-back { color: var(--w-soft); margin-bottom: clamp(20px, 4vh, 40px); display: inline-block; }
.w-back:hover { color: var(--w-ink); }
.w-proj-t { margin: 0 0 clamp(26px, 5vh, 56px); font-size: clamp(44px, 8.4vw, 150px); font-weight: 300; letter-spacing: -.05em; line-height: .92; max-width: 14ch; }
.w-proj-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin: 0; border-top: 1px solid var(--w-line); padding-top: 16px; }
.w-proj-meta dt { color: var(--w-soft); margin-bottom: 6px; }
.w-proj-meta dd { margin: 0; font-size: 17px; }
.w-proj-hero { margin-bottom: clamp(60px, 12vh, 140px); }
.w-proj-desc { display: grid; grid-template-columns: 5fr 4fr; gap: clamp(30px, 6vw, 110px); margin-bottom: clamp(60px, 12vh, 140px); }
.w-proj-lead { margin: 0; font-size: clamp(22px, 2.5vw, 38px); font-weight: 300; line-height: 1.18; letter-spacing: -.025em; }
.w-proj-body p { margin: 0 0 1.1em; font-size: 15.5px; line-height: 1.6; color: var(--w-soft); max-width: 58ch; }
.w-gal { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px, 1.2vw, 18px); align-items: start; }
.w-gal-i.full { grid-column: 1 / -1; }
.w-credits { margin-top: clamp(60px, 10vh, 120px); }
.w-credits ul { list-style: none; margin: 0; padding: 0; columns: 3 220px; }
.w-credits li { margin-bottom: 8px; font-size: 16px; }
.w-next { position: relative; display: block; width: 100%; margin-top: clamp(80px, 16vh, 180px); padding: clamp(40px, 8vh, 90px) var(--w-edge) clamp(90px, 14vh, 140px);
  border-top: 1px solid var(--w-line); overflow: hidden; }
.w-next > .w-mono { color: var(--w-soft); display: block; margin-bottom: 14px; }
.w-next-t { position: relative; z-index: 2; display: block; font-size: clamp(40px, 8vw, 140px); font-weight: 300; letter-spacing: -.05em; line-height: .95; }
.w-next-m { position: absolute !important; right: var(--w-edge); top: 50%; width: min(34vw, 520px); transform: translateY(-40%) scale(.9); opacity: .0;
  transition: opacity .6s ease, transform 1s var(--w-ease); z-index: 1; }
.w-next:hover .w-next-m { opacity: 1; transform: translateY(-50%) scale(1); }
.w-404 { padding-top: 30vh; }

/* ------------------------------------------------ about */
.w-about { padding-bottom: 22vh; }
.w-about-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding-top: 80px; }
.w-about-lead { margin: 0; font-size: clamp(32px, 5.2vw, 88px); font-weight: 300; letter-spacing: -.045em; line-height: 1.02; max-width: 18ch; }
.w-about-sec { padding-top: clamp(80px, 18vh, 200px); }
.w-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(40px, 7vh, 80px) clamp(20px, 6vw, 110px); }
.w-about-block:nth-child(even) { transform: translateY(clamp(0px, 8vh, 90px)); }
.w-about-block.w-reveal:nth-child(even):not(.on) { transform: translateY(calc(clamp(0px, 8vh, 90px) + 40px)); }
.w-about-block h2 { margin: 0 0 14px; font-size: clamp(28px, 3.4vw, 54px); font-weight: 300; letter-spacing: -.04em; line-height: 1.02;
  display: flex; align-items: baseline; gap: 14px; }
.w-about-block h2 .w-mono { font-size: 15px; color: var(--w-soft); }
.w-about-block h2 sup { font-size: 14px; color: var(--w-soft); }
.w-about-block ul { list-style: none; margin: 0; padding: 0 0 0 34px; }
.w-about-block li button { font-size: 16px; line-height: 1.8; color: var(--w-soft); transition: color .25s; }
.w-about-block li button:hover { color: var(--w-ink); }
.w-clients { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--w-line); border-left: 1px solid var(--w-line); }
.w-client { aspect-ratio: 2 / 1; display: grid; place-items: center; border-right: 1px solid var(--w-line); border-bottom: 1px solid var(--w-line);
  padding: 12% 18%; font-size: 18px; }
.w-client { min-width: 0; overflow: hidden; }
.w-client img { width: auto; height: auto; max-width: 100%; max-height: 64px; object-fit: contain; filter: grayscale(1) brightness(.35); opacity: .75; }

/* ------------------------------------------------ next wave */
.w-nav-a.nw span, .w-menu-nav button:nth-child(4) .w-roll span { background: linear-gradient(90deg, #8B5CF6, #EC4899, #F97316, #EAB308, #22C55E, #06B6D4, #8B5CF6);
  background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: wNw 6s linear infinite; }
.w-nav-a.nw { opacity: 1; }
@keyframes wNw { to { background-position: 300% 0; } }
.w-nw { padding-bottom: 22vh; }
.w-nw-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: clamp(80px, 14vh, 140px); }
.w-nw-sub { margin: 0; font-size: clamp(26px, 3.6vw, 58px); font-weight: 300; line-height: 1.06; letter-spacing: -.035em; max-width: 22ch; }
.w-nw-sec { padding-top: clamp(80px, 16vh, 180px); }
.w-nw-pillars { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(10px, 1.4vw, 20px); }
/* painel de gel: vidro colorido, desfocado, com a borda acesa */
.w-gel { position: relative; padding: clamp(20px, 2.4vw, 34px); min-height: clamp(180px, 26vh, 280px); border-radius: 22px;
  background: rgba(255,255,255,.55);
  backdrop-filter: blur(24px) saturate(1.3); -webkit-backdrop-filter: blur(24px) saturate(1.3);
  box-shadow: inset 0 0 0 1px rgba(22,24,27,.08), 0 20px 50px -30px rgba(22,24,27,.35); }
.w-gel::before { content: ""; display: block; width: 8px; height: 8px; border-radius: 50%; background: var(--gel); margin-bottom: 18px;
  box-shadow: 0 0 18px var(--gel); }
.w-gel h2 { margin: 0 0 12px; font-size: clamp(22px, 2.2vw, 34px); font-weight: 400; letter-spacing: -.02em; }
.w-gel p { margin: 0; font-size: 17px; line-height: 1.5; color: var(--w-soft); }
.w-nw-reel { border-radius: 22px; overflow: hidden; aspect-ratio: 16/9; }
.w-nw-reel video { width: 100%; height: 100%; object-fit: cover; display: block; }
.w-nw-open-t { margin: 0 0 22px; font-size: clamp(34px, 5.6vw, 96px); font-weight: 300; letter-spacing: -.045em; line-height: .98; max-width: 15ch; }
.w-nw-open-b { margin: 0 0 clamp(26px, 5vh, 48px); font-size: clamp(16px, 1.3vw, 19px); line-height: 1.55; max-width: 52ch; color: var(--w-soft); }
.w-nw-cta { display: inline-flex; align-items: baseline; gap: 16px; padding: 18px 28px; border-radius: 999px; font-size: clamp(17px, 1.4vw, 21px);
  background: linear-gradient(90deg, #8B5CF6, #EC4899, #F97316); color: #fff !important; box-shadow: 0 10px 40px -10px #EC4899; }
.w-nw-cta .w-mono { opacity: .85; font-size: 15px; }
.w-nw-link { display: inline-flex; align-items: baseline; gap: .35em; font-size: clamp(28px, 3.4vw, 56px); font-weight: 300; letter-spacing: -.045em;
  line-height: 1.05; color: var(--w-ink); border-bottom: 1px solid currentColor; padding-bottom: 6px; transition: opacity .2s; }
.w-nw-link:hover { opacity: .6; }
.w-nw-link span { font-size: .7em; }
.w-nw-mail { margin: 16px 0 0; font-size: 17px; color: var(--w-soft); }
@media (max-width: 860px) { .w-nw-pillars { grid-template-columns: 1fr 1fr; } }
@media (max-width: 520px) { .w-nw-pillars { grid-template-columns: 1fr; } }

/* ------------------------------------------------ contact */
.w-contact { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding-top: 110px; padding-bottom: 14vh; }
.w-contact-t { margin: 0 0 clamp(30px, 6vh, 60px); font-size: clamp(48px, 9vw, 160px); font-weight: 300; letter-spacing: -.05em; line-height: .92; max-width: 12ch; }
.w-contact-mail { align-self: flex-start; font-size: clamp(22px, 3vw, 46px); font-weight: 300; letter-spacing: -.03em; border-bottom: 1px solid currentColor; padding-bottom: 6px; }
.w-contact-grid { display: flex; flex-wrap: wrap; gap: 30px 80px; margin-top: clamp(40px, 8vh, 80px); font-size: 17px; }
.w-contact-grid p { margin: 0; }
.w-contact-grid .w-label { margin-bottom: 8px; }
.w-contact-social { display: flex; gap: 16px; flex-wrap: wrap; }
.w-contact-grid a:hover { opacity: .6; }

/* ------------------------------------------------ responsivo */
@media (max-width: 860px) {
  .w-nav { display: none; }
  .w-filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; white-space: nowrap; margin-right: calc(var(--w-edge) * -1); }
  .w-filters::-webkit-scrollbar { display: none; }
  .w-foot-mid { display: none; }
  .w-foot { grid-template-columns: 1fr auto; }
  .w-menu { grid-template-columns: 1fr; }
  .w-menu-side { text-align: left; }
  .w-pbar { grid-template-columns: 1fr auto; }
  .w-filters { grid-column: 1 / -1; grid-row: 2; }
  .w-list-row { grid-template-columns: 34px 1fr; }
  .w-list-k, .w-list-y, .w-list-prev { display: none; }
  .w-proj-meta { grid-template-columns: 1fr 1fr; }
  .w-proj-desc { grid-template-columns: 1fr; }
  .w-gal { grid-template-columns: 1fr; }
  .w-about-grid { grid-template-columns: 1fr; }
  .w-about-block:nth-child(even), .w-about-block.w-reveal:nth-child(even):not(.on) { transform: none; }
  .w-clients { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .w-feat-prev, .w-next-m { display: none; }
  .w-stmt-r { justify-content: flex-start; } .w-stmt-s { text-align: left; }
}
/* no site publicado as páginas novas entram sem animação de palavras/blocos */
.w-embed .w-reveal, .w-embed .w-word > span { opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  .w-word > span, .w-reveal { transition: none !important; transform: none !important; opacity: 1 !important; }
  .w-loader-letter { animation: none; }
  /* sem deslocamentos: só cross-fade */
  .w-sel-k, .w-sel-meta, .w-sel-cap .w-cta, .w-sel-lab { animation: none !important; }
  .w-sel-cap .w-word > span { animation: none !important; }
  .w-loader.out { clip-path: none; opacity: 0; transition: opacity .3s ease; }
}
/* transparência reduzida: vidros viram superfícies sólidas */
@media (prefers-reduced-transparency: reduce) {
  .w-root [class*="glass"], .w-root [class*="panel"] { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background: #FFFFFF !important; }
}
/* contraste alto: textos secundários mais firmes */
@media (prefers-contrast: more) {
  :root { --w-soft: rgba(22,24,27,.82); --w-line: rgba(22,24,27,.4); }
}
/* resposta no toque */
.w-cta:active, .w-back:active, .w-filters button:active { transform: scale(.97); transition: transform 100ms ease-out; }
`;
