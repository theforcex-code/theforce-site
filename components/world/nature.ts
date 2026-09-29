import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

/* Peças de paisagem, no espírito dos tutoriais de Blender/Unreal: céu em
   degradê com sol, neblina, relevo por ruído, capim instanciado com vento,
   espelho d'água, montanhas em camadas, troncos, flores, vagalumes e a
   marca em 3D. Cada mundo (worlds.ts) monta a sua paisagem com elas. */

export const col = (h: string) => new THREE.Color(h);

/* ------------------------------------------------------------ ruído (JS) */
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, o = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
export function rng(seed: number) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------ céu */
export function makeSky(top: string, horizon: string, sun?: { dir: THREE.Vector3; color: string; size: number }) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: col(top) }, uHor: { value: col(horizon) }, uSun: { value: col(sun?.color || horizon) },
      uDir: { value: (sun?.dir || new THREE.Vector3(0, 0.1, -1)).clone().normalize() }, uSize: { value: sun?.size ?? 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uDir; uniform float uSize; varying vec3 vP;
      void main(){
        vec3 c = mix(uHor, uTop, pow(smoothstep(-0.02, 0.7, vP.y), 0.8));
        float g = max(0.0, dot(vP, uDir));
        c += uSun * (pow(g, 900.0) * 1.2 + pow(g, 40.0) * 0.25 + pow(g, 6.0) * 0.12) * uSize;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat);
  m.renderOrder = -1;
  return m;
}

/* ------------------------------------------------------------ relevo */
export type Height = (x: number, z: number) => number;
export function makeTerrain(h: Height, c1: string, c2: string, size = 220, seg = 220) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const a = col(c1), b = col(c2), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = h(x, z);
    p.setY(i, y);
    t.copy(a).lerp(b, Math.min(1, Math.max(0, fbm(x * 0.06, z * 0.06, 3) * 1.4 - 0.2)));
    colors.set([t.r, t.g, t.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

/* ------------------------------------------------------------ capim */
// Fios instanciados; vento em rajadas que atravessam o campo como ondas
// (a "ressonância" do lugar) e o cursor abre caminho por onde passa.
export function makeGrass(opts: {
  count: number; area: [number, number, number, number]; height: Height; h: [number, number];
  base: string; tip: string; fog: string; fogNear: number; fogFar: number; width?: number; avoid?: (x: number, z: number) => boolean; seed?: number;
}) {
  const blade = new THREE.BufferGeometry();
  const segs = 4, w = opts.width ?? 0.07;
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const y = i / segs, hw = w * (1 - y * 0.92) * 0.5;
    pos.push(-hw, y, 0, hw, y, 0);
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  blade.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  blade.setIndex(idx);
  const g = new THREE.InstancedBufferGeometry();
  g.index = blade.index; g.attributes.position = blade.attributes.position;
  const n = opts.count, off = new Float32Array(n * 3), hh = new Float32Array(n), ang = new Float32Array(n), tint = new Float32Array(n);
  const r = rng(opts.seed ?? 7);
  const [x0, x1, z0, z1] = opts.area;
  for (let i = 0; i < n; i++) {
    let x = 0, z = 0;
    for (let k = 0; k < 20; k++) {
      // mais denso perto da câmera
      z = z1 - Math.pow(r(), 1.5) * (z1 - z0); x = x0 + r() * (x1 - x0);
      if (!opts.avoid || !opts.avoid(x, z)) break;
    }
    off.set([x, opts.height(x, z) - 0.05, z], i * 3);
    const clump = fbm(x * 0.15, z * 0.15, 2);
    hh[i] = opts.h[0] + (opts.h[1] - opts.h[0]) * (r() * 0.6 + clump * 0.6);
    ang[i] = r() * Math.PI; tint[i] = r();
  }
  g.setAttribute("aOff", new THREE.InstancedBufferAttribute(off, 3));
  g.setAttribute("aH", new THREE.InstancedBufferAttribute(hh, 1));
  g.setAttribute("aAng", new THREE.InstancedBufferAttribute(ang, 1));
  g.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 1));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPtr: { value: new THREE.Vector3(999, 0, 999) }, uPtrStr: { value: 0 },
      uBase: { value: col(opts.base) }, uTip: { value: col(opts.tip) }, uFog: { value: col(opts.fog) },
      uFogNear: { value: opts.fogNear }, uFogFar: { value: opts.fogFar }, uWind: { value: 1 } },
    vertexShader: `
      uniform float uTime, uPtrStr, uFogNear, uFogFar, uWind; uniform vec3 uPtr;
      attribute vec3 aOff; attribute float aH, aAng, aTint; varying float vY, vTint, vFog;
      void main(){
        vec3 p = position; float y = p.y; p.y *= aH;
        float c = cos(aAng), s = sin(aAng); p.xz = mat2(c, -s, s, c) * p.xz;
        // rajadas: uma onda larga atravessando o campo + tremor de cada fio
        float gust = sin(dot(aOff.xz, vec2(0.23, 0.11)) - uTime * 1.7) * 0.5 + 0.5;
        float wind = (gust * 0.9 + sin(uTime * 2.3 + aOff.x * 1.7 + aOff.z) * 0.18) * uWind;
        vec2 bend = vec2(wind * 0.55, wind * 0.2);
        vec2 d = aOff.xz - uPtr.xz;
        bend += normalize(d + 1e-4) * exp(-dot(d, d) * 0.45) * uPtrStr * 1.1;
        vec3 w = aOff + p;
        w.xz += bend * y * y * aH; w.y -= length(bend) * y * y * aH * 0.3;
        vY = y; vTint = aTint;
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vFog = smoothstep(uFogNear, uFogFar, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uBase, uTip, uFog; varying float vY, vTint, vFog;
      void main(){
        vec3 c = mix(uBase, uTip, pow(vY, 1.3)) * (0.82 + vTint * 0.3);
        gl_FragColor = vec4(mix(c, uFog, vFog), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return { mesh, u: mat.uniforms };
}

/* ------------------------------------------------------------ água */
const WaterShader = {
  uniforms: {
    color: { value: null as any }, tDiffuse: { value: null as any }, textureMatrix: { value: null as any },
    uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) }, uMouseStr: { value: 0 },
    uFog: { value: new THREE.Color() }, uFogNear: { value: 8 }, uFogFar: { value: 60 }, uCam: { value: new THREE.Vector3() }, uMix: { value: 0.7 },
    // gotas: (x, z, instante em que caiu) — cada uma abre anéis que se espalham
    uDrops: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)) },
    uShade: { value: 0 },
  },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform vec3 color; uniform sampler2D tDiffuse; uniform float uTime, uMouseStr, uFogNear, uFogFar, uMix;
    uniform vec2 uMouse; uniform vec3 uFog, uCam; uniform vec3 uDrops[8]; uniform float uShade; varying vec4 vUv; varying vec3 vW;
    void main(){
      vec2 p = vW.xz; float d = distance(p, uMouse);
      float ring = sin(d * 4.0 - uTime * 2.6) * exp(-d * 0.55) * uMouseStr;
      for (int i = 0; i < 8; i++) {
        float age = uTime - uDrops[i].z;
        if (age > 0.0 && age < 7.0) {
          float r = distance(p, uDrops[i].xy);
          ring += sin(r * 6.0 - age * 7.5) * exp(-abs(r - age * 1.7) * 1.8) * exp(-age * 0.6) * 0.7;
        }
      }
      float w = sin(p.x * 0.6 + uTime * 0.4) * 0.5 + sin(p.y * 1.1 - uTime * 0.3 + p.x * 0.3) * 0.5;
      w += sin(p.x * 3.1 + p.y * 2.3 + uTime * 1.3) * 0.15;
      ring = clamp(ring, -1.0, 1.0);
      vec4 uv = vUv; uv.xy += vec2(w * 0.004 + ring * 0.018, w * 0.003 + ring * 0.013) * uv.w;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb;
      float fres = pow(1.0 - abs(normalize(uCam - vW).y), 3.0);
      vec3 c = mix(color, refl, clamp(uMix + fres * 0.3, 0.0, 1.0)) + ring * 0.03;
      // ondas com luz e sombra, e brilho na crista (só onde uShade > 0)
      float wv = sin(p.x * 1.4 + uTime * 0.9 + sin(p.y * 0.7) * 1.5) * 0.5 + sin(p.y * 2.1 - uTime * 0.7 + p.x * 0.4) * 0.5;
      c *= 1.0 - (wv * 0.5 + 0.5) * uShade * 0.12;
      c += vec3(1.0) * pow(max(0.0, wv), 12.0) * uShade * 0.35;
      c -= ring * uShade * 0.06;
      gl_FragColor = vec4(mix(c, uFog, smoothstep(uFogNear, uFogFar, length(vW - uCam))), 1.0);
      #include <colorspace_fragment>
    }`,
};
export function makeWater(color: string, fog: string, low: boolean, near: number, far: number, mix = 0.7) {
  const res = low ? 512 : Math.min(1024, Math.round(window.innerHeight * Math.min(window.devicePixelRatio, 1.5)));
  const w = new Reflector(new THREE.PlaneGeometry(500, 500), { color: col(color) as any, textureWidth: Math.round(res * 1.8), textureHeight: res, clipBias: 0.003, shader: WaterShader, multisample: low ? 0 : 4 });
  w.rotation.x = -Math.PI / 2;
  const u = (w.material as THREE.ShaderMaterial).uniforms;
  u.uFog.value = col(fog); u.uFogNear.value = near; u.uFogFar.value = far; u.uMix.value = mix;
  return { mesh: w, u };
}

/* ------------------------------------------------------------ montanhas */
// Silhuetas em camadas (como aquarela): cada camada é um plano com o recorte
// de um perfil de ruído e a cor cada vez mais perto da neblina.
export function makeRidges(layers: { z: number; h: number; color: string; seed: number; scale?: number }[], width = 320) {
  const g = new THREE.Group();
  for (const L of layers) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uC: { value: col(L.color) }, uSeed: { value: L.seed }, uScale: { value: L.scale ?? 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uSeed, uScale; varying vec2 vUv;
        float h(float x){ return fract(sin(x * 127.1 + uSeed) * 43758.5453); }
        float n(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.0), f * f * (3.0 - 2.0 * f)); }
        void main(){
          float x = vUv.x * 9.0 * uScale;
          float ridge = n(x) * 0.5 + n(x * 2.1) * 0.25 + n(x * 4.3) * 0.12 + n(x * 9.0) * 0.05;
          float top = 0.25 + ridge * 0.7;
          if (vUv.y > top) discard;
          // a base se desfaz em névoa
          float a = smoothstep(0.0, 0.35, vUv.y);
          gl_FragColor = vec4(uC, a);
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, L.h), mat);
    m.position.set(0, -3 + L.h / 2 - 1, L.z);
    m.renderOrder = -0.5;
    g.add(m);
  }
  return g;
}

/* ------------------------------------------------------------ névoa rasteira */
export function makeMist(color: string, y: number, count = 6, spread = 60, opacity = 0.35) {
  const g = new THREE.Group();
  const mats: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uC: { value: col(color) }, uT: { value: 0 }, uO: { value: opacity * (0.6 + Math.random() * 0.4) }, uS: { value: Math.random() * 10 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uT, uO, uS; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(h(i), h(i + vec2(1,0)), u.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), u.x), u.y); }
        void main(){
          vec2 q = vUv * vec2(5.0, 2.0) + vec2(uT * 0.02 + uS, 0.0);
          float c = n(q) * 0.6 + n(q * 2.3 + uT * 0.01) * 0.4;
          float e = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
          gl_FragColor = vec4(uC, smoothstep(0.35, 0.8, c) * e * uO);
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(spread, 7), mat);
    m.position.set((Math.random() - 0.5) * 20, y + Math.random() * 1.2, -4 - i * 7);
    g.add(m); mats.push(mat);
  }
  return { group: g, update: (t: number) => mats.forEach((m) => (m.uniforms.uT.value = t)) };
}

/* ------------------------------------------------------------ vagalumes */
export function makeFireflies(count: number, box: [number, number, number, number, number, number], color = "#E9F27B", size = 60) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count);
  const r = rng(99);
  for (let i = 0; i < count; i++) {
    p.set([box[0] + r() * (box[1] - box[0]), box[2] + r() * (box[3] - box[2]), box[4] + r() * (box[5] - box[4])], i * 3);
    s[i] = r();
  }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uC: { value: col(color) }, uSize: { value: size }, uPR: { value: Math.min(window.devicePixelRatio, 2) } },
    vertexShader: `uniform float uT, uSize, uPR; attribute float aS; varying float vB;
      void main(){
        vec3 p = position;
        float s = aS * 50.0;
        p += vec3(sin(uT * 0.31 + s) * 1.6, sin(uT * 0.47 + s * 1.3) * 0.7, cos(uT * 0.27 + s * 0.7) * 1.4);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // pisca num ritmo próprio: aceso por pouco tempo, apagado por mais
        vB = pow(max(0.0, sin(uT * (0.5 + fract(s) * 0.8) + s)), 5.0) * 0.9 + 0.1;
        gl_PointSize = uSize * uPR * (0.5 + fract(s * 3.7) * 0.7) / -mv.z;
      }`,
    fragmentShader: `uniform vec3 uC; varying float vB;
      void main(){ float d = length(gl_PointCoord - 0.5);
        float a = pow(max(0.0, 1.0 - d * 2.0), 2.2) * 0.7 + smoothstep(0.1, 0.0, d);
        gl_FragColor = vec4(uC * (0.8 + vB * 0.6), a * vB); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { pts, update: (t: number) => { mat.uniforms.uT.value = t; } };
}

/* ------------------------------------------------------------ flores */
export function makeFlowers(count: number, area: [number, number, number, number], height: Height, colors: string[], seed = 5) {
  const head = new THREE.SphereGeometry(0.06, 8, 6);
  const mesh = new THREE.InstancedMesh(head, new THREE.MeshLambertMaterial(), count);
  const r = rng(seed), m = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const z = area[3] - Math.pow(r(), 1.4) * (area[3] - area[2]), x = area[0] + r() * (area[1] - area[0]);
    const s = 0.5 + r() * 0.8;
    m.makeScale(s, s * 0.55, s).setPosition(x, height(x, z) + 0.35 + r() * 0.5, z);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.set(colors[Math.floor(r() * colors.length)]));
  }
  return mesh;
}

export function disposeAll(o: THREE.Object3D) {
  o.traverse((x: any) => {
    x.geometry?.dispose?.();
    const m = x.material; if (Array.isArray(m)) m.forEach((y) => y.dispose()); else m?.dispose?.();
    if (x.isReflector) x.dispose?.();
  });
}
