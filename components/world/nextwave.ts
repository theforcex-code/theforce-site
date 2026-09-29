import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { World, WorldOpts } from "./worlds";
import { makeChromeEnv, chrome } from "./ethereal";

/* NEXT WAVE — um universo à parte, claro e colorido. Um estúdio branco onde
   flutuam TVs de plástico brilhante, cada tela com um visual
   generativo próprio, e gelatina por toda parte: bolhas, cubos e gotas
   translúcidas que balançam — e, no centro, a marca da The Force feita de
   gelatina (o anel e a bolinha). */

const CANDY = ["#FF5FA2", "#7C5CFF", "#23D5C8", "#FFB23E", "#3E8BFF", "#B6F03B"];

// Doze visuais generativos. Por cima, a textura de tela: curvatura leve,
// linhas de varredura, grade de pixels e reflexo do vidro.
const SCREEN_FRAG = `
  uniform float uT, uKind, uAsp, uLogoA, uHasLogo; uniform sampler2D uLogo; uniform vec3 uC[6];
  varying vec2 vUv;
  float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h1(i), h1(i + vec2(1,0)), u.x), mix(h1(i + vec2(0,1)), h1(i + vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * n(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
  vec3 pal(float x){ x = fract(x) * 6.0; float f = smoothstep(0.0, 1.0, fract(x)); int i = int(floor(x));
    vec3 a = uC[0], b = uC[1];
    for (int k = 0; k < 6; k++){ if (k == i){ a = uC[k]; b = uC[k == 5 ? 0 : k + 1]; } }
    return mix(a, b, f); }
  vec3 visual(vec2 uv){
    vec2 q = (uv - 0.5) * vec2(uAsp, 1.0);
    float t = uT; int k = int(uKind + 0.5);
    if (k == 0) {                         // linhas de fluxo
      float a = fbm(q * 1.6 + t * 0.05) * 6.2832;
      return pal(fbm(q * 2.0) + t * 0.03) * pow(sin((q.x * cos(a) + q.y * sin(a)) * 26.0 - t * 2.5) * 0.5 + 0.5, 2.0);
    } else if (k == 1) {                  // anéis de ressonância
      float d = length(q); return mix(uC[2] * 0.15, uC[1], pow(sin(d * 34.0 - t * 3.5) * 0.5 + 0.5, 3.0));
    } else if (k == 2) {                  // ruído deformado
      float v = fbm(q * 2.4 + fbm(q * 2.0 + t * 0.06) * 1.6); return pal(v * 1.6 + t * 0.04);
    } else if (k == 3) {                  // a marca da Next Wave inteira, parada, com a cor correndo por dentro
      float fw = 0.86;
      vec2 lu = vec2((uv.x - 0.5) / fw + 0.5, (uv.y - 0.5) / (fw * uAsp / uLogoA) + 0.5);
      float inside = step(0.0, lu.x) * step(lu.x, 1.0) * step(0.0, lu.y) * step(lu.y, 1.0);
      vec4 lt = texture2D(uLogo, lu);
      float m = smoothstep(0.2, 0.6, inside * uHasLogo * lt.a * (1.0 - dot(lt.rgb, vec3(0.333))));
      vec3 fill = pal(lu.x * 0.9 - t * 0.08) * 1.15;
      vec3 bg = vec3(0.05, 0.05, 0.07) + pal(uv.x * 0.3 + t * 0.03) * 0.05;
      return mix(bg, fill, m);
    } else if (k == 4) {                  // células
      vec2 p = q * 5.0; vec2 ip = floor(p), fp = fract(p); float md = 9.0, md2 = 9.0; vec2 mid = vec2(0.0);
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 o = vec2(float(x), float(y)); vec2 r = o + 0.5 + 0.4 * sin(t * 0.7 + 6.2832 * vec2(h1(ip + o), h1(ip + o + 7.1))) - fp;
        float d = dot(r, r); if (d < md){ md2 = md; md = d; mid = ip + o; } else if (d < md2) md2 = d; }
      return mix(pal(h1(mid)), vec3(1.0), 1.0 - smoothstep(0.0, 0.07, sqrt(md2) - sqrt(md)));
    } else if (k == 5) {                  // plasma
      float v = sin(q.x * 6.0 + t) + sin(q.y * 7.0 - t * 1.3) + sin((q.x + q.y) * 5.0 + t * 0.7) + sin(length(q) * 9.0 - t * 1.6);
      return pal(v * 0.12 + t * 0.02);
    } else if (k == 6) {                  // equalizador
      float bars = 18.0; float b = floor(uv.x * bars);
      float hgt = 0.15 + 0.8 * pow(n(vec2(b * 1.7, t * 2.2)), 1.5);
      float seg = step(0.25, fract(uv.y * 22.0));
      return (uv.y < hgt ? pal(b / bars * 0.8 + 0.1) : vec3(0.06)) * seg + vec3(0.03);
    } else if (k == 7) {                  // azulejos (Truchet) animados
      vec2 p = q * 6.0; vec2 ip = floor(p), fp = fract(p) - 0.5;
      if (h1(ip + floor(t * 0.5)) > 0.5) fp.x = -fp.x;
      float d = min(abs(length(fp - vec2(0.5, 0.5)) - 0.5), abs(length(fp + vec2(0.5, 0.5)) - 0.5));
      return mix(uC[3], uC[1], smoothstep(0.08, 0.04, d));
    } else if (k == 8) {                  // túnel
      float r = length(q), a = atan(q.y, q.x);
      float v = fract(0.3 / (r + 0.05) + t * 0.5); float s = fract(a / 6.2832 * 12.0 + t * 0.1);
      return pal(v + s * 0.2) * smoothstep(0.02, 0.4, r) * (0.5 + 0.5 * step(0.5, fract(v * 4.0)));
    } else if (k == 9) {                  // interferência (moiré)
      float a = sin(length(q - vec2(0.25 * sin(t * 0.5), 0.0)) * 60.0);
      float b = sin(length(q + vec2(0.25 * cos(t * 0.4), 0.1)) * 60.0);
      return mix(uC[5], uC[4], smoothstep(-0.2, 0.2, a * b));
    } else if (k == 10) {                 // bolhas de cor (metaballs)
      float f = 0.0;
      for (int i = 0; i < 5; i++){ float fi = float(i); vec2 c = 0.35 * vec2(sin(t * 0.7 + fi * 1.7) * uAsp, cos(t * 0.9 + fi * 2.3)); f += 0.03 / dot(q - c, q - c); }
      return mix(vec3(0.97), pal(f * 0.05 + t * 0.03), smoothstep(0.9, 1.3, f));
    }
    vec2 g = floor(uv * vec2(40.0 * uAsp, 40.0)); float on = step(0.72, h1(g + floor(t * 6.0)));   // bits
    return mix(vec3(0.05), pal(g.x * 0.02 + t * 0.05), on);
  }
  void main(){
    vec2 c = vUv - 0.5; c *= 1.0 + dot(c, c) * 0.12; vec2 uv = c + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.05, 0.05, 0.06, 1.0); return; }
    vec3 col = visual(uv);
    col *= 0.88 + 0.12 * sin(uv.y * 520.0);
    vec2 px = fract(uv * vec2(160.0 * uAsp, 160.0));
    col *= 0.85 + 0.15 * step(0.18, px.x) * step(0.18, px.y);
    col *= 1.0 - dot(c, c) * 0.9;
    col += vec3(1.0) * pow(max(0.0, 1.0 - length(c - vec2(-0.22, 0.28)) * 2.4), 3.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export function createNextWave({ low, renderer }: WorldOpts): World {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  camera.position.set(0, 0, 16);

  // fundo: estúdio em tons de bala, manchas de cor mudando devagar
  const bgMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color("#FFFFFF") }, uB: { value: new THREE.Color("#FFFFFF") },
      uC2: { value: new THREE.Color("#FFFFFF") }, uD: { value: new THREE.Color("#FFFFFF") } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uT; uniform vec3 uA, uB, uC2, uD; varying vec3 vP;
      void main(){
        vec2 p = vec2(atan(vP.x, -vP.z), vP.y);
        float a = sin(p.x * 1.3 + uT * 0.07) * 0.5 + 0.5, b = sin(p.y * 2.2 - uT * 0.05 + p.x) * 0.5 + 0.5;
        gl_FragColor = vec4(mix(mix(uA, uB, a), mix(uC2, uD, a), b), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), bgMat));
  scene.fog = new THREE.Fog(new THREE.Color("#FFFFFF"), 20, 62);

  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose();
  // luz mais contida: o inox e a gelatina estouravam no branco
  scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color("#E6E6EE"), 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(-6, 8, 10); scene.add(key);

  // TVs brutalistas de inox escovado: caixas retas, sem arredondamento
  const studio = makeChromeEnv(renderer);
  const inox = chrome(studio);
  if ("envMapIntensity" in inox) (inox as any).envMapIntensity = ((inox as any).envMapIntensity ?? 1) * 0.72;
  const bezelM = new THREE.MeshStandardMaterial({ color: new THREE.Color("#141416"), roughness: 0.35, metalness: 0.4, envMap: env, envMapIntensity: 0.6 });
  const cands = CANDY.map((c) => new THREE.Color(c));
  const screens: THREE.ShaderMaterial[] = [];
  const logoTex = new THREE.TextureLoader().load("/next-wave-logo.png", (t) => {
    const img = t.image as HTMLImageElement;
    screens.forEach((m) => { m.uniforms.uLogoA.value = img.width / img.height; m.uniforms.uHasLogo.value = 1; });
  });
  logoTex.colorSpace = THREE.SRGBColorSpace;
  // [x, y, z, largura da tela, rotY, rotX, visual]
  const TVS: number[][] = [
    [0, 0.6, -3, 8.4, 0, 0, 3], [7.4, -0.6, -6, 3.0, -0.5, 0.1, 0], [-6.8, 3.4, -8, 2.8, 0.45, -0.1, 5],
    [1.2, -3.2, -4, 2.4, -0.15, -0.12, 6], [9.5, 4.6, -13, 3.6, -0.6, 0, 2], [-3.5, -1.4, -11, 2.6, 0.3, 0.08, 8],
    [5.2, -5.4, -9, 3.0, -0.4, 0.14, 4], [-9.5, -3.8, -14, 3.4, 0.55, 0, 9], [0.4, 5.8, -12, 2.4, 0.05, -0.2, 10],
    [-1.4, -7.8, -7, 2.8, 0.2, 0.18, 7], [11, -3.4, -18, 3.2, -0.7, 0, 1], [-12, 1, -20, 3.6, 0.7, 0, 11],
  ];
  const tvs = TVS.slice(0, low ? 8 : 12).map((T, i) => {
    const w = T[3], h = T[6] === 3 ? w / 3.4 : w * 0.72;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(w + 0.5, h + 0.5, 0.9, 2, 0.015), inox);
    body.position.z = -0.45;
    const bezel = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.08, h + 0.08), bezelM);
    bezel.position.z = 0.01;
    const sm = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uKind: { value: T[6] }, uAsp: { value: w / h }, uLogo: { value: logoTex }, uLogoA: { value: 10 }, uHasLogo: { value: 0 }, uC: { value: cands } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: SCREEN_FRAG,
    });
    screens.push(sm);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm);
    screen.position.z = 0.07;
    g.add(body, bezel, screen);
    g.position.set(T[0], T[1], T[2]); g.rotation.set(T[5], T[4], 0);
    g.userData = { base: g.position.clone(), ry: T[4], ph: i * 1.37 };
    scene.add(g);
    return g;
  });

  // gelatina: translúcida, colorida, balançando como gelatina
  const jigT = { value: 0 };
  const jellyMat = (c: string, amp: number, ph: number) => {
    const col = new THREE.Color(c);
    const m = new THREE.MeshPhysicalMaterial({
      color: col, emissive: col, emissiveIntensity: 0.14, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.03, envMap: env, envMapIntensity: 0.8, sheen: 1, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.3,
      iridescence: 0.35, iridescenceIOR: 1.3, depthWrite: false,
    });
    m.onBeforeCompile = (sh: any) => {
      sh.uniforms.uT = jigT;
      sh.vertexShader = `uniform float uT;\n${sh.vertexShader}`.replace("#include <begin_vertex>", `#include <begin_vertex>
        float tt = uT + ${ph.toFixed(2)};
        float jig = sin(position.y * 2.6 + tt * 3.1) * sin(position.x * 2.2 - tt * 2.3) + sin(position.z * 3.0 + tt * 2.7) * 0.5;
        transformed += normal * jig * ${amp.toFixed(3)};
        transformed.y *= 1.0 + sin(tt * 2.2) * ${(amp * 0.6).toFixed(3)};`);
    };
    return m;
  };
  const jellies: { m: THREE.Mesh; base: THREE.Vector3; ph: number }[] = [];
  const blob = new THREE.IcosahedronGeometry(1, low ? 12 : 24);
  const cube = new RoundedBoxGeometry(1.6, 1.6, 1.6, 6, 0.45);
  const drop = new THREE.SphereGeometry(1, 48, 32); drop.scale(1, 1.25, 1);
  const JELLY: [THREE.BufferGeometry, string, [number, number, number], number][] = [
    [blob, "#FF5FA2", [5.6, 0.6, 1], 0.9], [cube, "#23D5C8", [-5.2, 1.2, -3], 1.0], [drop, "#FFB23E", [2.2, -1.2, 2], 0.55],
    [blob, "#7C5CFF", [-2.5, 4.2, -5], 0.8], [cube, "#B6F03B", [8.5, 2.8, -9], 0.9], [drop, "#3E8BFF", [-7.5, -1.8, -6], 0.8],
    [blob, "#23D5C8", [4, -4.6, -2], 0.7], [cube, "#FF5FA2", [-4.4, -5.2, -9], 0.8], [blob, "#FFB23E", [11, 1, -14], 1.2],
    [drop, "#7C5CFF", [0.6, -6.4, -1], 0.5], [blob, "#B6F03B", [-10, 5, -15], 1.1], [cube, "#3E8BFF", [6.5, 6.2, -12], 0.8],
  ];
  JELLY.slice(0, low ? 7 : 12).forEach(([g, c, p, s], i) => {
    const mesh = new THREE.Mesh(g, jellyMat(c, 0.06, i * 1.9));
    mesh.position.set(...p); mesh.scale.setScalar(s); mesh.renderOrder = 2;
    scene.add(mesh);
    jellies.push({ m: mesh, base: mesh.position.clone(), ph: i * 1.9 });
  });

  // a marca da The Force em gelatina: anel rosa e a bolinha turquesa
  const logo = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.3, 48, 180), jellyMat("#FF5FA2", 0.03, 0));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.6, 64, 48), jellyMat("#23D5C8", 0.05, 1));
  ring.renderOrder = ball.renderOrder = 3;
  logo.add(ring, ball);
  scene.add(logo);

  let k = 1, portrait = false;
  return {
    scene, camera, bloom: { strength: 0.1, radius: 0.35, threshold: 0.98 },
    update(f) {
      const t = f.t;
      jigT.value = t;
      bgMat.uniforms.uT.value = t;
      screens.forEach((m) => (m.uniforms.uT.value = t));
      tvs.forEach((g) => {
        const b = g.userData.base as THREE.Vector3;
        g.position.set(b.x * k, b.y + Math.sin(t * 0.4 + g.userData.ph) * 0.25, b.z);
        g.rotation.y = g.userData.ry + Math.sin(t * 0.25 + g.userData.ph) * 0.08;
      });
      jellies.forEach((j) => {
        // no celular a tela do Next Wave ocupa a largura: as gelatinas que
        // ficariam na frente dela vão para cima ou para baixo da faixa da tela
        let by = j.base.y;
        if (portrait && j.base.z > -7 && Math.abs(by - 0.6) < 2.8) by = 0.6 + (by >= 0.6 ? 3.1 : -3.1) + (by - 0.6) * 0.3;
        j.m.position.set(j.base.x * k, by + Math.sin(t * 0.6 + j.ph) * 0.35, j.base.z);
        j.m.rotation.set(Math.sin(t * 0.3 + j.ph) * 0.4, t * 0.2 + j.ph, 0);
      });
      logo.position.set(portrait ? 1.6 : 4.6, portrait ? 4.8 : 3.6, 1 - f.scroll * 1.5);
      logo.rotation.set(Math.sin(t * 0.4) * 0.15 + f.pointer.y * 0.2, Math.sin(t * 0.3) * 0.5 + f.pointer.x * 0.4, 0);
      camera.position.x += (f.pointer.x * 1.8 - camera.position.x) * 0.05;
      camera.position.y += (f.pointer.y * 1.0 - f.scroll * 7 - camera.position.y) * 0.05;
      camera.lookAt(0, -f.scroll * 7, -4);
    },
    resize(w, h) {
      camera.aspect = w / h;
      portrait = w / h < 1;
      k = Math.min(1, (w / h) * 1.15);
      camera.fov = portrait ? 60 : 40;
      camera.updateProjectionMatrix();
    },
    dispose() {
      scene.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      env.dispose(); logoTex.dispose(); studio.dispose();
    },
  };
}
