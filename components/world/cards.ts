import * as THREE from "three";
import { thumb, video, videoReady, release } from "./media";

/* Um projeto como objeto 3D: um plano com a capa em "cover", que troca a
   miniatura pelo vídeo quando está em foco. O mesmo material serve à grade
   da página de projetos (em pixels, curvando com o arrasto) e aos painéis
   espalhados no cenário da home (em metros, com neblina). */

export type CardProject = { id: string; cover?: any; videoUrl?: string };

const VERT = `
  uniform float uBend, uFull, uSide; uniform vec2 uRes, uVel;
  varying vec2 vUv; varying float vDepth, vEdge;
  void main(){
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    #ifdef GRID
      // grade em pixels: a superfície curva como o fundo de uma tigela, mais
      // quanto mais rápido o arrasto; e o card pode crescer até a tela toda
      vec2 q = w.xy / (uRes * 0.5);
      w.z -= dot(q, q) * uBend;
      // distorção nas laterais: a grade curva como uma parede em volta, e o
      // que chega na borda estica e se afasta
      float sx = q.x * q.x;
      w.z -= sx * uSide;
      w.y *= 1.0 + sx * 0.1 * (uSide / 260.0);
      w.x *= 1.0 + sx * 0.06 * (uSide / 260.0);
      vEdge = smoothstep(0.35, 1.1, abs(q.x));
      w.xy += uVel * (1.0 - dot(q, q) * 0.25) * 0.6;
      vec3 full = vec3((uv - 0.5) * uRes, 0.0);
      w.xyz = mix(w.xyz, full, uFull);
    #endif
    #ifndef GRID
      vEdge = 0.0;
    #endif
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = `
  uniform sampler2D uTex, uVid; uniform float uTexA, uVidA, uPlaneA, uVidMix, uHover, uAlpha, uReveal, uFull;
  uniform vec2 uVel, uRes; uniform vec3 uFog; uniform float uFogNear, uFogFar;
  varying vec2 vUv; varying float vDepth, vEdge;
  vec2 cover(vec2 uv, float pa, float ta){
    vec2 s = pa > ta ? vec2(1.0, ta / pa) : vec2(pa / ta, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  void main(){
    float pa = mix(uPlaneA, uRes.x / uRes.y, uFull);
    vec2 zoom = (vUv - 0.5) * (1.0 - uHover * 0.07) + 0.5;
    vec2 d = uVel * 0.0004 + vec2(0.012 * vEdge, 0.0);   // cor se separa na borda
    vec2 a = cover(zoom, pa, uTexA), b = cover(zoom, pa, uVidA);
    vec3 t = vec3(texture2D(uTex, a + d).r, texture2D(uTex, a).g, texture2D(uTex, a - d).b);
    vec3 v = vec3(texture2D(uVid, b + d).r, texture2D(uVid, b).g, texture2D(uVid, b - d).b);
    vec3 c = mix(t, v, uVidMix);
    // entrada: fade simples e rápido
    float rv = smoothstep(0.0, 1.0, uReveal);

    #ifdef FOG
      c = mix(c, uFog, smoothstep(uFogNear, uFogFar, vDepth));
    #endif
    gl_FragColor = vec4(c, uAlpha * rv);
    #include <colorspace_fragment>
  }`;

const EMPTY = (() => { const t = new THREE.DataTexture(new Uint8Array([236, 234, 238, 255]), 1, 1); t.needsUpdate = true; return t; })();

export class Card {
  mesh: THREE.Mesh;
  u: Record<string, THREE.IUniform>;
  p: CardProject;
  private hover = 0; private hoverT = 0;
  private vid: THREE.VideoTexture | null = null;
  private focus = false;
  alphaT = 1;
  fadeSlow = false;

  constructor(p: CardProject, opts: { grid?: boolean; fog?: string; segs?: number } = {}) {
    this.p = p;
    this.u = {
      uTex: { value: EMPTY }, uVid: { value: EMPTY }, uTexA: { value: 16 / 9 }, uVidA: { value: 16 / 9 }, uPlaneA: { value: 16 / 9 },
      uVidMix: { value: 0 }, uHover: { value: 0 }, uAlpha: { value: 1 }, uReveal: { value: 0 }, uFull: { value: 0 },
      uBend: { value: 0 }, uSide: { value: 0 }, uVel: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(1, 1) },
      uFog: { value: new THREE.Color(opts.fog || "#000") }, uFogNear: { value: 12 }, uFogFar: { value: 60 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      defines: { ...(opts.grid ? { GRID: "" } : {}), ...(opts.fog ? { FOG: "" } : {}) },
    });
    const s = opts.segs ?? 16;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, s, s), mat);
    this.mesh.frustumCulled = !opts.grid;
    this.mesh.userData.card = this;
    thumb(p).then(({ tex, aspect }) => { this.u.uTex.value = tex; this.u.uTexA.value = aspect; });
  }

  setSize(w: number, h: number) { this.mesh.scale.set(w, h, 1); this.u.uPlaneA.value = w / h; }

  /** em foco: toca o vídeo por cima da miniatura */
  setFocus(on: boolean) {
    if (on === this.focus) return;
    this.focus = on;
    this.hoverT = on ? 1 : 0;
    if (on && !this.vid) {
      this.vid = video(this.p);
      if (this.vid) this.u.uVid.value = this.vid;
    } else if (!on && this.vid) {
      release(this.p.id);
      const v = this.vid;
      this.vid = null;
      // deixa o último frame e some com o vídeo devagar
      setTimeout(() => { if (!this.vid && this.u.uVid.value === v) this.u.uVid.value = EMPTY; }, 900);
    }
  }

  update(dt: number) {
    const k = 1 - Math.pow(0.001, dt);
    this.hover += (this.hoverT - this.hover) * k * 0.9;
    this.u.uHover.value = this.hover;
    const vidOn = this.vid && videoReady(this.vid) ? 1 : 0;
    if (this.vid) {
      const el = this.vid.image as HTMLVideoElement;
      if (el.videoWidth) this.u.uVidA.value = el.videoWidth / el.videoHeight;
    }
    this.u.uVidMix.value += (vidOn - this.u.uVidMix.value) * k * 0.6;
    this.u.uReveal.value = Math.min(1, this.u.uReveal.value + dt * 2.5);
    this.u.uAlpha.value += (this.alphaT - this.u.uAlpha.value) * k * (this.fadeSlow ? 0.12 : 0.7);
    if (this.alphaT === 0 && this.u.uAlpha.value < 0.01) this.mesh.visible = false;
  }

  dispose() {
    if (this.vid) release(this.p.id);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
