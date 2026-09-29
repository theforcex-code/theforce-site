import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createGallery, createForest, createClouds, createDusk, createVoid, type World, type Frame, type WorldOpts } from "./worlds";
import { createNextWave } from "./nextwave";
import { GridLayer } from "./grid";

export type SceneKey = "index" | "projects" | "project" | "about" | "contact" | "nextwave";
type Land = "gallery" | "forest" | "clouds" | "dusk" | "nextwave" | "void";

const LAND: Record<SceneKey, Land> = { index: "gallery", projects: "forest", project: "void", about: "clouds", contact: "dusk", nextwave: "nextwave" };
const MAKE: Record<Land, (o: WorldOpts) => World> = { gallery: createGallery, forest: createForest, clouds: createClouds, dusk: createDusk, nextwave: createNextWave, void: createVoid };

/* Composição: a paisagem que sai se dissolve na que entra por uma máscara de
   ruído orgânico (como tinta se espalhando na água). Por cima, só um grão fino
   e uma vinheta leve — o conteúdo tem que continuar legível. */
const COMPOSITE = {
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tA, tB; uniform float uProg, uTime; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y); }
    float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){
      vec2 uv = vUv, asp = vec2(uRes.x / uRes.y, 1.0);
      float n = fbm(uv * asp * 2.2 + uTime * 0.05);
      float edge = uProg * 1.5 - 0.25;
      float m = smoothstep(edge - 0.08, edge + 0.08, n + length((uv - 0.5) * asp) * 0.35); // 1 = ainda A
      // a borda da tinta desloca um pouco a imagem, como água
      vec2 warp = (vec2(fbm(uv * 6.0), fbm(uv * 6.0 + 7.0)) - 0.5) * 0.04 * m * (1.0 - m) * 4.0;
      vec3 c = mix(texture2D(tB, uv + warp).rgb, texture2D(tA, uv - warp).rgb, m);
      // pixel inválido (NaN/infinito) vira preto antes do bloom — senão o blur
      // espalha um bloco preto pela tela
      if (!(c.r >= 0.0 && c.r < 1e4)) c.r = 0.0;
      if (!(c.g >= 0.0 && c.g < 1e4)) c.g = 0.0;
      if (!(c.b >= 0.0 && c.b < 1e4)) c.b = 0.0;
      float r = length((uv - 0.5) * asp);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class Engine {
  renderer: THREE.WebGLRenderer;
  private rtA: THREE.WebGLRenderTarget; private rtB: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh; private quadScene = new THREE.Scene(); private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private worlds: Partial<Record<Land, World>> = {};
  private cur: Land; private next: Land | null = null;
  private prog = 0; private dur = 2;
  private resolveT: (() => void) | null = null;
  private grid = new GridLayer();
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private raf = 0; private clock = new THREE.Clock();
  private low: boolean; private reduced: boolean;
  private w = 1; private h = 1;
  private f: Frame = { t: 0, dt: 0, pointer: new THREE.Vector2(), rawPointer: new THREE.Vector2(), pointerSpeed: 0, scroll: 0, clicks: 0 };
  private last = new THREE.Vector2();
  private scrollT = 0;
  onFirstFrame: (() => void) | null = null;
  onHover: ((id: string | null) => void) | null = null;
  private drawn = 0;

  constructor(canvas: HTMLCanvasElement, start: SceneKey) {
    this.low = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.low, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.low ? 1.25 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const opt = { type: THREE.HalfFloatType, samples: this.low ? 0 : 4 };
    this.rtA = new THREE.WebGLRenderTarget(1, 1, opt); this.rtB = new THREE.WebGLRenderTarget(1, 1, opt);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { tA: { value: this.rtA.texture }, tB: { value: this.rtB.texture }, uProg: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
      vertexShader: COMPOSITE.vertexShader, fragmentShader: COMPOSITE.fragmentShader, depthTest: false, depthWrite: false,
    }));
    this.quadScene.add(this.quad);
    // bloom suave: a luz irradia (sol, reflexos no metal, vagalumes, LED)
    this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.composer.addPass(new RenderPass(this.quadScene, this.quadCam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.8, 0.8);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.cur = LAND[start];
    this.get(this.cur);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onDown, { passive: true });
    document.addEventListener("visibilitychange", this.onVis);
    this.loop();
  }

  private get(k: Land) {
    if (!this.worlds[k]) { const w = MAKE[k]({ low: this.low, renderer: this.renderer }); w.resize(this.w, this.h); this.worlds[k] = w; }
    return this.worlds[k]!;
  }
  api<T = any>(k: SceneKey): T { return (k === "projects" ? this.grid.api : this.get(LAND[k]).api ?? null) as T; }
  private hov: string | null = null;
  get hovered() { return this.hov; }

  /** monta as outras paisagens aos poucos, para a primeira troca não travar */
  warm() {
    const ks = (Object.keys(MAKE) as Land[]).filter((k) => !this.worlds[k]);
    const step = () => { const k = ks.shift(); if (!k) return; try { const w = this.get(k); this.renderer.compile(w.scene, w.camera); } catch {} setTimeout(step, 400); };
    setTimeout(step, 800);
  }

  goTo(key: SceneKey): Promise<void> {
    const k = LAND[key];
    if (k === this.cur && !this.next) return Promise.resolve();
    if (this.next) { this.cur = this.next; this.next = null; this.resolveT?.(); }
    if (k === this.cur) return Promise.resolve();
    this.get(k); this.next = k; this.prog = 0;
    this.dur = this.reduced ? 0.01 : k === "void" || this.cur === "void" ? 0.7 : 2;
    return new Promise((r) => { this.resolveT = r; });
  }
  setScroll(p: number) { this.scrollT = p; }
  setVelocity(_: number) {}

  private onPointer = (e: PointerEvent) => { this.f.rawPointer.set((e.clientX / this.w) * 2 - 1, -(e.clientY / this.h) * 2 + 1); };
  private onDown = () => { this.f.clicks++; };
  private onVis = () => { cancelAnimationFrame(this.raf); if (!document.hidden) { this.clock.getDelta(); this.loop(); } };
  private resize = () => {
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    const pr = this.renderer.getPixelRatio();
    this.rtA.setSize(this.w * pr, this.h * pr); this.rtB.setSize(this.w * pr, this.h * pr);
    (this.quad.material as THREE.ShaderMaterial).uniforms.uRes.value.set(this.w * pr, this.h * pr);
    this.composer?.setPixelRatio(pr);
    this.composer?.setSize(this.w, this.h);
    this.bloom?.resolution.set(this.w / 2, this.h / 2);
    for (const w of Object.values(this.worlds)) w?.resize(this.w, this.h);
    this.grid.resize(this.w, this.h);
  };

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 1 / 25), f = this.f;
    f.dt = dt; f.t += dt;
    f.pointer.lerp(f.rawPointer, this.reduced ? 1 : 1 - Math.exp(-3 * dt));
    const sp = f.rawPointer.distanceTo(this.last) / Math.max(dt, 1e-3); this.last.copy(f.rawPointer);
    f.pointerSpeed += (Math.min(1, sp * 0.25) - f.pointerSpeed) * (1 - Math.exp(-6 * dt));
    f.scroll += (this.scrollT - f.scroll) * (1 - Math.exp(-4 * dt));
    const u = (this.quad.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = f.t;
    const r = this.renderer, a = this.get(this.cur);
    a.update(f); r.setRenderTarget(this.rtA); r.render(a.scene, a.camera);
    if (this.next) {
      const b = this.get(this.next);
      b.update(f); r.setRenderTarget(this.rtB); r.render(b.scene, b.camera);
      this.prog = Math.min(1, this.prog + dt / this.dur);
      u.uProg.value = this.prog < 0.5 ? 4 * this.prog ** 3 : 1 - Math.pow(-2 * this.prog + 2, 3) / 2;
    } else u.uProg.value = 0;
    // o bloom acompanha o mundo (e passa de um para o outro na troca)
    const want = this.next ? mixBloom(a.bloom, this.get(this.next).bloom, u.uProg.value) : a.bloom;
    const kb = 1 - Math.exp(-4 * dt);
    this.bloom.strength += (want.strength - this.bloom.strength) * kb;
    this.bloom.radius += (want.radius - this.bloom.radius) * kb;
    this.bloom.threshold += (want.threshold - this.bloom.threshold) * kb;
    this.composer.render(dt);
    // o composer devolve o alvo que estava ativo; a grade vai direto na tela
    r.setRenderTarget(null);
    this.grid.render(r, dt);
    if (this.next && this.prog >= 1) {
      [this.rtA, this.rtB] = [this.rtB, this.rtA];
      u.tA.value = this.rtA.texture; u.tB.value = this.rtB.texture;
      this.cur = this.next; this.next = null; u.uProg.value = 0;
      this.resolveT?.(); this.resolveT = null;
    }
    // projeto sob o cursor dentro do mundo (vira rótulo do cursor e clique)
    const h = this.next ? null : a.hovered?.() ?? null;
    if (h !== this.hov) { this.hov = h; this.onHover?.(h); }
    if (++this.drawn === 3) this.onFirstFrame?.();
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onDown);
    document.removeEventListener("visibilitychange", this.onVis);
    for (const w of Object.values(this.worlds)) w?.dispose();
    this.grid.dispose(); this.rtA.dispose(); this.rtB.dispose(); this.composer.dispose(); this.renderer.dispose();
  }
}

function mixBloom(a: { strength: number; radius: number; threshold: number }, b: typeof a, t: number) {
  return { strength: a.strength + (b.strength - a.strength) * t, radius: a.radius + (b.radius - a.radius) * t, threshold: a.threshold + (b.threshold - a.threshold) * t };
}
