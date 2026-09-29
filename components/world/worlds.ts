import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { col, fbm, rng, makeSky, makeTerrain, makeGrass, makeWater, makeRidges, makeMist, makeFireflies, makeFlowers, disposeAll, type Height } from "./nature";
import { Card, type CardProject } from "./cards";
import { makeEnv, makeStudioEnv, makeChromeEnv, chrome, makeLogo, makeRays, makeMotes, makeLilies, makeBirds, makeCloudSea, makeIsland, makeMushrooms } from "./ethereal";

/* As paisagens da The Force. Cada página é um habitat e só existe enquanto
   a página está aberta — o motor dissolve uma na outra. Todas etéreas: luz
   difusa que irradia (bloom), raios atravessando a névoa, coisas flutuando
   no ar, e a marca em metal refletindo o lugar.
     Index    → GALERIA (sala branca, TVs de inox em pedestal)
     Projetos → FLORESTA à noite
     Sobre    → ÁGUA (a marca em metal líquido; rolar mergulha)
     Contato  → ESPELHO (a marca em pé sobre piso espelhado)                                          */

export type Frame = { t: number; dt: number; pointer: THREE.Vector2; rawPointer: THREE.Vector2; pointerSpeed: number; scroll: number; clicks: number };
export type Bloom = { strength: number; radius: number; threshold: number };
export type World = {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; bloom: Bloom;
  update(f: Frame): void; resize(w: number, h: number): void; dispose(): void;
  api?: any; hovered?: () => string | null;
};
export type WorldOpts = { low: boolean; renderer: THREE.WebGLRenderer };

const ray = new THREE.Raycaster();
const tmp = new THREE.Vector3();
function onPlane(cam: THREE.Camera, p: THREE.Vector2, y: number, out: THREE.Vector3) {
  ray.setFromCamera(p, cam);
  if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), tmp)) out.lerp(tmp, 0.15);
  return out;
}
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
// Em tela em pé (celular) o campo de visão abre para manter o enquadramento
// horizontal — senão a marca e a paisagem ficam enormes e cortadas.
function aspect(cam: THREE.PerspectiveCamera, w: number, h: number) {
  const base = cam.userData.fov ?? (cam.userData.fov = cam.fov);
  cam.aspect = w / h;
  const ref = 1.25;
  cam.fov = cam.aspect >= ref ? base : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(base / 2)) * ref / cam.aspect));
  cam.fov = Math.min(cam.fov, 88);
  cam.updateProjectionMatrix();
}

/* =================================================================
   GALERIA — índice
   Uma sala branca de galeria: piso claro acetinado, trilhos de luz no teto
   e sombras de verdade. No centro, a marca em metal sobre um pedestal. Os
   trabalhos selecionados passam em TVs finas de inox, de pé em pedestais
   de inox, cada uma sob o seu spot. Descendo a página a câmera percorre a
   sala e muda de ponto de vista a cada TV (lados e ângulos diferentes).
   ================================================================= */
export function createGallery({ low, renderer }: WorldOpts): World {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const WHITE = "#FFFFFF";
  scene.background = col(WHITE);
  scene.fog = new THREE.Fog(col(WHITE), 34, 90);
  scene.add(new THREE.HemisphereLight(col("#FFFFFF"), col("#ECEAE6"), 2.2));
  // uma luz alta e difusa só para as sombras suaves no piso
  const sun = new THREE.DirectionalLight(col("#FFFFFF"), 0.9);
  sun.position.set(4, 14, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -14, near: 1, far: 40 });
  sun.shadow.bias = -0.0005; sun.shadow.radius = 8;
  scene.add(sun, sun.target);

  const studio = makeStudioEnv(renderer);
  const wallM = new THREE.MeshStandardMaterial({ color: col("#FFFFFF"), roughness: 0.96, emissive: col("#FFFFFF"), emissiveIntensity: 0.55 });
  const floorM = new THREE.MeshStandardMaterial({ color: col("#FFFFFF"), roughness: 0.42, envMap: studio, envMapIntensity: 0.12, emissive: col("#FFFFFF"), emissiveIntensity: 0.36 });
  // TVs: estúdio de faixas de luz (contraste escuro/claro = metal de verdade)
  const tvEnv = makeChromeEnv(renderer);
  const inox = chrome(tvEnv); inox.roughness = 0.06;
  const black = new THREE.MeshStandardMaterial({ color: col("#141416"), roughness: 0.35, metalness: 0.4, envMap: studio, envMapIntensity: 0.6 });

  // a galeria: um corredor largo e branco, TVs em pares simétricos,
  // viradas para o centro; se sobrar uma, ela fecha o corredor ao fundo
  const ROW0 = -13, GAP = 14, SIDE = 5.6, DOOR = -3.5, DW = 2.4, DH = 3.8;
  const rowZ = (r: number) => ROW0 - r * GAP;
  const RW = 18, RD = 90, RH = 14, Z0 = 10;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), floorM);
  floor.rotation.x = -Math.PI / 2; floor.position.z = Z0 - RD / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = (w: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), wallM);
    m.position.set(x, RH / 2, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m);
  };
  wall(RD, -RW / 2, Z0 - RD / 2, Math.PI / 2); wall(RD, RW / 2, Z0 - RD / 2, -Math.PI / 2);
  // parede com passagem: da antessala só se vê a marca
  const seg = (RW - DW) / 2;
  for (const sd of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(seg, RH, 0.02), wallM);
    m.position.set(sd * (DW / 2 + seg / 2), RH / 2, DOOR); m.receiveShadow = true; scene.add(m);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DW, RH - DH, 0.02), wallM);
  lintel.position.set(0, DH + (RH - DH) / 2, DOOR); scene.add(lintel);
  // riscos finos que desenham o espaço: piso com paredes e o contorno da passagem
  const lineM = new THREE.MeshBasicMaterial({ color: col("#CFCFCF"), fog: true });
  const line = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lineM); m.position.set(x, y, z); scene.add(m);
  };
  const LW = 0.018;
  line(LW, LW, RD, -RW / 2 + 0.01, 0.005, Z0 - RD / 2);
  line(LW, LW, RD, RW / 2 - 0.01, 0.005, Z0 - RD / 2);
  // parede do fundo do salão, com o risco no chão e nas quinas
  const ZEND = ROW0 - GAP - 11;
  wall(RW, 0, ZEND, 0);
  line(RW, LW, LW, 0, 0.005, ZEND + 0.01);
  for (const sd of [-1, 1]) {
    line(LW, RH, LW, sd * (RW / 2 - 0.01), RH / 2, ZEND + 0.01);
    line(LW, RH, LW, sd * (RW / 2 - 0.01), RH / 2, DOOR - 0.02);
  }
  for (const sd of [-1, 1]) {
    line(seg, LW, LW, sd * (DW / 2 + seg / 2), 0.005, DOOR + 0.022);
    line(LW, DH, LW, sd * DW / 2, DH / 2, DOOR + 0.022);
  }
  line(DW, LW, LW, 0, DH, DOOR + 0.022);

  // a marca grande, sozinha na abertura; ao começar a andar ela sobe e abre caminho
  const logo = makeLogo(studio, { scale: 1.05, env: 1, mirror: true });
  logo.group.position.set(0, 2.1, 0);
  logo.group.traverse((o: any) => { if (o.isMesh) o.castShadow = true; });
  scene.add(logo.group);

  const SH = 3.4, SW = SH * 9 / 16, POLE = 0.75, CY = POLE + 0.25 + SH / 2;
  type Slot = { x: number; z: number; ry: number; side: number };
  let slots: Slot[] = [];
  const layout = (n: number) => {
    const out: Slot[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / 2);
      // em zigue-zague: a câmera segue pelo mesmo lado ao trocar de fileira
      const side = (i % 2 ? 1 : -1) * (r % 2 ? -1 : 1);
      out.push({ x: side * SIDE, z: rowZ(r), ry: -side * 1.0, side });
    }
    return out;
  };
  const tvs: { g: THREE.Group; card: Card }[] = [];
  let walk = 0, focus = 0, portrait = false, liftS = 0;
  let hover: Card | null = null;

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
  const HERO = new THREE.Vector3(0, 1.8, 5.6), HEROL = new THREE.Vector3(0, 2.0, 0);
  camera.position.copy(HERO);
  const look = HEROL.clone();
  let yawS = Math.PI, pitchS = 0;
  const wrapA = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const pA = new THREE.Vector3(), lA = new THREE.Vector3(), pB = new THREE.Vector3(), lB = new THREE.Vector3();
  // paradas: 0 = a marca; 1 = um passo à frente (a porta abre); 2 = na
  // passagem, olhando o corredor; j = i+3 = diante da TV i
  const stop = (j: number, P: THREE.Vector3, L: THREE.Vector3) => {
    // no desktop a câmera fica mais longe da marca (em tela cheia ela ficava enorme)
    const back = portrait ? 0 : 2.6;
    if (j <= 0) { P.copy(HERO); P.z += back; L.copy(HEROL); return; }
    // enquanto se lê o texto, a marca vai para o lado (desktop) ou para baixo (celular) e libera o texto
    if (j === 1) { P.set(0, 1.8, HERO.z - 0.7 + back); L.set(0, portrait ? 2.6 : 2.0, 0); return; }
    const t = slots[j - 3];
    if (j === 2 || !t) { P.set(0, 1.75, DOOR - 0.6); L.set(0, 1.6, DOOR - 12); return; }
    // na altura do centro da tela e mais perto: a TV ocupa o quadro e a vizinha fica de fora
    const d = portrait ? 5.4 : 8.4;
    P.set(t.x + Math.sin(t.ry) * d, CY - 0.1, t.z + Math.cos(t.ry) * d);
    const off = 0;   // TV centrada, igual em qualquer tela
    L.set(t.x - Math.cos(t.ry) * off, CY - 0.05, t.z + Math.sin(t.ry) * off);
  };

  return {
    scene, camera, bloom: { strength: 0, radius: 0.1, threshold: 1 },
    api: {
      setWorks(list: CardProject[]) {
        tvs.forEach((t) => { scene.remove(t.g); t.card.dispose(); });
        tvs.length = 0;
        const works = list.slice(0, 8);
        slots = layout(works.length);
        works.forEach((p, i) => {
          const { x, z, ry } = slots[i];
          const g = new THREE.Group();
          // bloco maciço no chão + coluna larga atrás da tela + moldura grossa
          const base = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.16, 0.8, 2, 0.012), inox); base.position.set(0, 0.08, -0.3);
          const pole = new THREE.Mesh(new RoundedBoxGeometry(0.34, POLE + SH * 0.55, 0.26, 2, 0.012), inox); pole.position.set(0, (POLE + SH * 0.55) / 2 + 0.16, -0.3);
          const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.5, 0.18, 2, 0.012), inox); bracket.position.set(0, CY, -0.14);
          const body = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.22, SH + 0.22, 0.16, 2, 0.012), inox); body.position.set(0, CY, -0.03);
          const bezel = new THREE.Mesh(new THREE.PlaneGeometry(SW + 0.04, SH + 0.04), black); bezel.position.set(0, CY, 0.056);
          [base, pole, bracket, body].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
          const card = new Card(p, { fog: WHITE });
          card.u.uFogNear.value = 34; card.u.uFogFar.value = 90;
          card.setSize(SW, SH);
          card.mesh.position.set(0, CY, 0.06);
          g.add(base, pole, bracket, body, bezel, card.mesh);
          g.position.set(x, 0, z); g.rotation.y = ry;
          scene.add(g);
          tvs.push({ g, card });
        });
      },
      setDive(d: number) { walk = d; },
      setFocus(v: number) { focus = v; },
    },
    hovered: () => (hover ? hover.p.id : null),
    update(f) {
      // o caminho: marca → TV 0 → TV 1 … (u = parada, com fração)
      const u = walk < 0.62 ? walk / 0.62 : walk < 0.86 ? 1 + (walk - 0.62) / 0.24
        : walk < 1 || !tvs.length ? 2 + (walk - 0.86) / 0.14 : 3 + Math.min(focus, tvs.length - 1);
      const ja = Math.floor(u), jb = Math.min(tvs.length + 2, ja + 1);
      let k = u - ja;
      // entre TVs: a câmera fica parada diante de cada uma (início e fim do trecho)
      // e só anda no meio; a legenda troca na metade, com a câmera já a caminho
      if (ja >= 3) k = Math.min(1, Math.max(0, (k - 0.3) / 0.4));
      stop(ja, pA, lA); stop(jb, pB, lB);
      // o olhar gira por ângulo (não por ponto), com curva bem suave nas pontas
      const kl = k * k * k * (k * (k * 6 - 15) + 10);
      const yA = Math.atan2(lA.x - pA.x, lA.z - pA.z), yB = Math.atan2(lB.x - pB.x, lB.z - pB.z);
      const tA = Math.atan2(lA.y - pA.y, Math.hypot(lA.x - pA.x, lA.z - pA.z));
      const tB = Math.atan2(lB.y - pB.y, Math.hypot(lB.x - pB.x, lB.z - pB.z));
      const yawT = yA + wrapA(yB - yA) * kl, pitchT = tA + (tB - tA) * kl;
      // passos: o trecho se divide em passadas (~1 m cada); cada passada
      // acelera e assenta, e a cabeça sobe e desce de leve
      const n = Math.max(1, Math.round(pA.distanceTo(pB) / 1.1));
      const q = k * n, sn = Math.floor(q), fr = q - sn;
      const st = fr < 0.5 ? 4 * fr * fr * fr : 1 - Math.pow(-2 * fr + 2, 3) / 2;
      // passada suave: metade contínua, para não dar tontura
      k = THREE.MathUtils.lerp(k, Math.min(1, (sn + st) / n), 0.45);
      const bob = ja === jb ? 0 : -Math.sin(fr * Math.PI) * 0.022;
      pA.lerp(pB, k);
      pA.y += bob;
      pA.x += f.pointer.x * 0.15; pA.y += f.pointer.y * 0.05;
      camera.position.lerp(pA, damp(2.6, f.dt));
      yawS += wrapA(yawT - yawS) * damp(2.1, f.dt);
      pitchS += (pitchT - pitchS) * damp(2.1, f.dt);
      look.set(camera.position.x + Math.sin(yawS) * Math.cos(pitchS) * 5, camera.position.y + Math.sin(pitchS) * 5,
        camera.position.z + Math.cos(yawS) * Math.cos(pitchS) * 5);
      camera.lookAt(look);

      // porta e marca deslizam devagar, com inércia própria (mesmo rolando rápido)
      liftS += (THREE.MathUtils.smootherstep(walk, 0.52, 0.74) - liftS) * damp(1.4, f.dt);
      logo.group.position.y = 2.1 + liftS * 7;
      logo.group.rotation.y = f.t * 0.3;
      // a luz acompanha o visitante, para as sombras no piso
      sun.position.set(camera.position.x + 4, 14, camera.position.z + 2);
      sun.target.position.set(camera.position.x, 0, camera.position.z - 8);

      const cur = walk > 0.9 ? Math.round(Math.min(focus, tvs.length - 1)) : -1;
      tvs.forEach((t, i) => { t.card.setFocus(i === cur); t.card.update(f.dt); });
      let h: Card | null = null;
      if (tvs.length) {
        ray.setFromCamera(f.rawPointer, camera);
        const hit = ray.intersectObjects(tvs.map((t) => t.card.mesh), false)[0];
        h = (hit?.object.userData.card as Card) || null;
      }
      hover = h;
    },
    // no desktop a lente fecha um pouco: a TV em foco ocupa o quadro e as vizinhas ficam de fora
    resize: (w, h) => { portrait = w / h < 1; camera.userData.fov = portrait ? 46 : 40; aspect(camera, w, h); },
    dispose() { tvs.forEach((t) => t.card.dispose()); disposeAll(scene); studio.dispose(); tvEnv.dispose(); },
  };
}

/* =================================================================
   FLORESTA À NOITE — projetos
   Troncos em silhueta, luar entrando em raios, neblina rasteira, cogumelos
   que brilham, esporos subindo, vagalumes — e a marca em metal lá no fundo,
   refletindo a lua.
   ================================================================= */
export function createForest({ low, renderer }: WorldOpts): World {
  const scene = new THREE.Scene();
  const BG = "#040505";
  scene.background = col(BG);
  scene.fog = new THREE.Fog(col(BG), 7, 50);
  scene.add(makeSky("#040505", "#0B0F12", { dir: new THREE.Vector3(-0.45, 0.4, -1), color: "#C9D6FF", size: 0.45 }));
  scene.add(new THREE.HemisphereLight(col("#2B3550"), col("#000000"), 1));
  const moon = new THREE.DirectionalLight(col("#A9BCEB"), 0.7); moon.position.set(-10, 12, -10); scene.add(moon);

  const h: Height = (x, z) => (fbm(x * 0.05, z * 0.05, 3) - 0.5) * 2.2 - 3;
  scene.add(makeTerrain(h, "#0B0F0D", "#121814", 200, 120));
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.2, 1, 7), new THREE.MeshLambertMaterial({ color: col("#161C1A") }), low ? 150 : 300);
  const r = rng(21), m = new THREE.Matrix4();
  for (let i = 0; i < trunks.count; i++) {
    let x = 0, z = 0;
    do { x = (r() - 0.5) * 80; z = -r() * 62 + 2; } while (Math.abs(x) < 3.5 + (2 - z) * 0.05);
    const H = 12 + r() * 12, s = 0.7 + r() * 0.9;
    m.makeScale(s, H, s).setPosition(x, h(x, z) + H / 2 - 0.3, z);
    trunks.setMatrixAt(i, m);
  }
  scene.add(trunks);
  const ferns = makeGrass({ count: low ? 5000 : 14000, area: [-24, 24, -34, 7], height: h, h: [0.3, 0.9], width: 0.09,
    base: "#070907", tip: "#1F2C24", fog: BG, fogNear: 7, fogFar: 44, seed: 9 });
  ferns.u.uWind.value = 0.25;
  scene.add(ferns.mesh);
  scene.add(makeMushrooms(low ? 35 : 70, [-16, 16, -28, 6], h, "#7CF2DF"));

  const env = makeEnv(renderer, "#0A0E14", "#1B2433");
  const logo = makeLogo(env, { scale: 1.5, ring: "#C9D2E0", glow: "#6B84C9", env: 0.5 });
  logo.group.position.set(0, 2.2, -24);
  scene.add(logo.group);

  const rays = makeRays(3, new THREE.Vector3(-40, 40, -70), new THREE.Vector3(4, -3, -14), "#9DB5FF", 0.05, 20, 5, true);
  scene.add(rays.group);
  const mist = makeMist("#8FA3A8", -2.4, 7, 70, 0.13);
  scene.add(mist.group);
  const spores = makeMotes(low ? 50 : 110, [-20, 20, -3, 5, -30, 8], "#8FFFE6", { size: 45, rise: 0.25, drift: 0.05, additive: true, alpha: 0.9 });
  scene.add(spores.pts);
  const fire = makeFireflies(low ? 180 : 320, [-22, 22, -2.8, 4.5, -32, 8], "#E6F07A", 95);
  scene.add(fire.pts);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1400);
  camera.position.set(0, 0.2, 15);
  const target = new THREE.Vector3(), ptrW = new THREE.Vector3();
  return {
    scene, camera, bloom: { strength: 1.15, radius: 0.75, threshold: 0.12 },
    update(f) {
      target.set(f.pointer.x * 1.4, 0.2 + f.pointer.y * 0.6, 15 - Math.sin(f.t * 0.06) * 2);
      camera.position.lerp(target, damp(1.8, f.dt));
      camera.lookAt(f.pointer.x * 0.6, 0.8, -8);
      logo.group.rotation.y = f.t * 0.1;
      logo.group.position.y = 2.2 + Math.sin(f.t * 0.4) * 0.15;
      logo.update(f.t, f.rawPointer, camera);
      fire.update(f.t); mist.update(f.t); rays.update(f.t); spores.update(f.t);
      onPlane(camera, f.rawPointer, -2.6, ptrW);
      ferns.u.uTime.value = f.t; ferns.u.uPtr.value.copy(ptrW); ferns.u.uPtrStr.value = f.pointerSpeed;
    },
    resize: (w, hh) => aspect(camera, w, hh),
    dispose() { disposeAll(scene); env.dispose(); },
  };
}

/* =================================================================
   ÁGUA — sobre
   A marca em metal líquido flutuando sobre um espelho d'água claro, com a
   superfície da marca ondulando como mercúrio. Rolar mergulha: embaixo
   d'água a luz fica aqua clara, a superfície brilha lá em cima e gotas do
   metal líquido afundam devagar.
   ================================================================= */
export function createClouds({ low, renderer }: WorldOpts): World {
  const scene = new THREE.Scene();
  const FOG = "#FFFFFF", DEEP = "#DFE7E8";
  const fogA = col(FOG), fogB = col(DEEP);
  scene.fog = new THREE.Fog(col(FOG), 20, 95);
  const sky = makeSky("#FFFFFF", "#FFFFFF");
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(col("#FFFFFF"), col("#C9D3D3"), 1.3));

  const water = makeWater("#CFD8D9", FOG, low, 18, 120, 0.5);
  water.u.uShade.value = 1;
  scene.add(water.mesh);

  const env = makeEnv(renderer, "#FFFFFF", "#E4EAEA");
  const studio = makeStudioEnv(renderer);
  const logo = makeLogo(studio, { scale: 1.6, env: 1, mirror: true });
  scene.add(logo.group);

  // embaixo d'água
  const under = new THREE.Group(); under.visible = false;
  const ceilM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.0); }`,
    fragmentShader: `uniform float uT; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1,0)), u.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), u.x), u.y); }
      void main(){
        vec2 p = vW.xz * 0.35;
        float caus = pow(1.0 - abs(sin(n(p + uT * 0.25) * 6.0 + n(p * 2.1 - uT * 0.2) * 4.0)), 6.0);
        float far = smoothstep(60.0, 8.0, length(vW.xz));
        gl_FragColor = vec4(mix(vec3(0.88, 0.9, 0.9), vec3(1.0), caus), (0.55 + caus * 0.35) * far);
        #include <colorspace_fragment>
      }`,
  });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), ceilM);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = -0.05;
  under.add(ceil);
  const uRays = makeRays(4, new THREE.Vector3(6, 2, -30), new THREE.Vector3(-2, -18, -34), "#FFFFFF", 0.25, 30, 11);
  const bubbles = makeMotes(low ? 50 : 110, [-14, 14, -18, -0.5, -60, 6], "#FFFFFF", { size: 34, rise: 0.8, drift: 0.02, alpha: 0.85 });
  under.add(uRays.group, bubbles.pts);
  scene.add(under);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1400);
  camera.position.set(0, 1.8, 14);
  const target = new THREE.Vector3(), look = new THREE.Vector3(0, 2, -8), lookT = new THREE.Vector3(), ptrW = new THREE.Vector3();
  let portrait = false;
  let dive = 0, deep = 0, diveS = 0, deepS = 0;
  return {
    scene, camera, bloom: { strength: 0, radius: 0.1, threshold: 1 },
    api: { setDive(d: number, after: number) { dive = d; deep = after; } },
    update(f) {
      // mergulho guiado pela segunda parte da página (ver AboutPage)
      diveS += (dive - diveS) * damp(7, f.dt); deepS += (deep - deepS) * damp(5, f.dt);
      const k = diveS * diveS * (3 - 2 * diveS);
      const y = THREE.MathUtils.lerp(1.8, -4.5, k) - deepS * 10;
      target.set(f.pointer.x * 1.4 * (1 - k * 0.5), y + f.pointer.y * 0.4 * (1 - k), 14 - k * 3);
      lookT.set(f.pointer.x * 0.5 + (portrait ? 0 : 1.6), THREE.MathUtils.lerp(2.2, -4.2, k) - deepS * 10, -8);
      camera.position.lerp(target, damp(4, f.dt));   // pouco atraso: o mergulho acompanha a rolagem
      look.lerp(lookT, damp(2.4, f.dt));
      camera.lookAt(look);
      const lp = portrait ? tmp.set(0, 7.4, -11) : tmp.set(4.2, 2.6, -8);
      logo.group.position.set(lp.x, lp.y + Math.sin(f.t * 0.5) * 0.1, lp.z);
      logo.group.rotation.y = Math.sin(f.t * 0.2) * 0.4 + f.pointer.x * 0.25;
      logo.update(f.t);

      const u = THREE.MathUtils.smoothstep(-camera.position.y, -0.05, 2.5);
      const isUnder = camera.position.y < 0;
      water.mesh.visible = !isUnder; sky.visible = !isUnder; under.visible = u > 0.01;
      logo.group.visible = !isUnder;   // a marca fica na superfície: some quando mergulhamos
      const fog = scene.fog as THREE.Fog;
      fog.color.copy(fogA).lerp(fogB, u);
      fog.near = THREE.MathUtils.lerp(20, 4, u); fog.far = THREE.MathUtils.lerp(95, 42, u);
      scene.background = isUnder ? fog.color : null;

      onPlane(camera, f.rawPointer, 0, ptrW);
      water.u.uTime.value = f.t; water.u.uMouse.value.set(ptrW.x, ptrW.z);
      water.u.uMouseStr.value += (Math.min(1, f.pointerSpeed * 1.4) - water.u.uMouseStr.value) * damp(3, f.dt);
      water.u.uCam.value.copy(camera.position);
      ceilM.uniforms.uT.value = f.t; uRays.update(f.t); bubbles.update(f.t);
    },
    resize: (w, h) => { portrait = w / h < 1; aspect(camera, w, h); },
    dispose() { disposeAll(scene); env.dispose(); },
  };
}

/* =================================================================
   ESPELHO — contato
   Vazio branco com piso espelhado; a marca de metal grande, em pé, girando
   devagar e refletida no chão, ao lado do e-mail.
   ================================================================= */
export function createDusk({ low, renderer }: WorldOpts): World {
  const scene = new THREE.Scene();
  const WHITE = "#FFFFFF";
  scene.background = col(WHITE);
  scene.fog = new THREE.Fog(col(WHITE), 18, 70);
  scene.add(new THREE.HemisphereLight(col("#FFFFFF"), col("#D6D4CF"), 1.3));

  // piso espelhado (reflexo limpo, sem ondas)
  const floorShader = {
    uniforms: { color: { value: null as any }, tDiffuse: { value: null as any }, textureMatrix: { value: null as any },
      uFog: { value: col(WHITE) }, uCam: { value: new THREE.Vector3() } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color, uFog, uCam; uniform sampler2D tDiffuse; varying vec4 vUv; varying vec3 vW;
      void main(){
        vec3 refl = texture2DProj(tDiffuse, vUv).rgb;
        vec3 c = mix(color, refl, 0.55);
        c = mix(c, uFog, smoothstep(14.0, 70.0, length(vW - uCam)));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  };
  const res = low ? 512 : 1024;
  const floor = new Reflector(new THREE.PlaneGeometry(300, 300), { color: col("#FFFFFF") as any, textureWidth: res, textureHeight: res, clipBias: 0.003, shader: floorShader });
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const fu = (floor.material as THREE.ShaderMaterial).uniforms;

  const env = makeEnv(renderer, "#FFFFFF", "#E6E4DF");
  const studio = makeStudioEnv(renderer);
  const logo = makeLogo(studio, { scale: 1.9, env: 1, mirror: true });
  scene.add(logo.group);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
  camera.position.set(0, 2.2, 14);
  const target = new THREE.Vector3(), look = new THREE.Vector3();
  let portrait = false;
  return {
    scene, camera, bloom: { strength: 0, radius: 0.1, threshold: 1 },
    update(f) {
      // o texto do contato fica à esquerda (desktop) ou embaixo (celular):
      // a marca vai para o lado livre
      const lp = portrait ? tmp.set(0, 6.4, -10) : tmp.set(4.2, 3.4, -7);
      logo.group.position.set(lp.x, lp.y + Math.sin(f.t * 0.5) * 0.08, lp.z);
      logo.group.rotation.y = f.t * 0.3;
      target.set(f.pointer.x * 1.2, 2.2 + f.pointer.y * 0.4, 14 - f.scroll * 3);
      camera.position.lerp(target, damp(2, f.dt));
      look.lerp(tmp.set(f.pointer.x * 0.4 + (portrait ? 0 : 1.4), 2.4, -7), damp(2, f.dt));
      camera.lookAt(look);
      fu.uCam.value.copy(camera.position);
    },
    resize: (w, hh) => { portrait = w / hh < 1; aspect(camera, w, hh); },
    dispose() { disposeAll(scene); env.dispose(); },
  };
}

/* =================================================================
   PROJETO — fundo preto puro: nada disputa com as imagens do projeto.
   ================================================================= */
export function createVoid(_: WorldOpts): World {
  const scene = new THREE.Scene();
  scene.background = col("#050505");
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
  return { scene, camera, bloom: { strength: 0, radius: 0.1, threshold: 1 }, update() {}, resize: (w, h) => aspect(camera, w, h), dispose() {} };
}
