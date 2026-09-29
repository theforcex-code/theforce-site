import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { col, fbm, rng, makeSky, type Height } from "./nature";

/* Elementos que deixam os mundos etéreos, e a marca em metal. */

/* ------------------------------------------------------------ metal */
// Estúdio para os reflexos: a sala neutra do three (RoomEnvironment) tingida
// com o céu do mundo. O cromado reflete paredes claras, cantos escuros e a
// cor do lugar — é esse contraste que faz o metal parecer metal.
export function makeEnv(r: THREE.WebGLRenderer, top: string, horizon: string) {
  const room = new RoomEnvironment();
  const sky = makeSky(top, horizon);
  sky.scale.setScalar(0.06);
  room.add(sky);
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(room, 0.035).texture;
  pm.dispose();
  room.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}

// Estúdio de fotografia para o cromado: fundo cinza escuro com degradê e
// três softboxes. O metal espelhado reflete faixas claras e escuras — é o
// contraste que faz ele parecer metal em vez de uma mancha branca.
/** ambiente das TVs de inox (a marca continua no makeStudioEnv) */
export function makeChromeEnv(r: THREE.WebGLRenderer) {
  // estúdio de foto de produto: fundo grafite, chão cinza e softboxes em
  // faixas muito claras. É o contraste entre o escuro e as faixas de luz no
  // reflexo que faz o cromado parecer metal (um ambiente todo branco deixa
  // o metal com cara de plástico cinza).
  const scene = new THREE.Scene();
  const mats: THREE.Material[] = [], geos: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, c: THREE.Color, p: [number, number, number], look = true, side: THREE.Side = THREE.DoubleSide) => {
    const m = new THREE.MeshBasicMaterial({ color: c, side });
    const o = new THREE.Mesh(g, m); o.position.set(...p); if (look) o.lookAt(0, 0, 0);
    scene.add(o); mats.push(m); geos.push(g); return o;
  };
  const hdr = (v: number) => new THREE.Color(v, v, v);
  // cúpula com degradê: grafite em cima, quase preto no horizonte
  const dome = new THREE.SphereGeometry(30, 48, 24);
  const dm = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "varying vec3 vP; void main(){ float y = vP.y; vec3 c = mix(vec3(0.09), vec3(0.34), smoothstep(-0.05, 0.9, y)); c = mix(c, vec3(0.45), smoothstep(-0.05, -0.6, y)); gl_FragColor = vec4(c, 1.0); }" });
  scene.add(new THREE.Mesh(dome, dm)); mats.push(dm); geos.push(dome);
  // softboxes
  add(new THREE.PlaneGeometry(10, 3.2), hdr(5), [0, 11, 0]);             // teto
  add(new THREE.PlaneGeometry(1.4, 12), hdr(7), [-9, 3, 4]);             // faixa esquerda
  add(new THREE.PlaneGeometry(1.4, 12), hdr(7), [9, 3, 4]);              // faixa direita
  add(new THREE.PlaneGeometry(0.6, 10), hdr(4), [-4, 2, -10]);           // contraluz
  add(new THREE.PlaneGeometry(0.6, 10), hdr(4), [5, 2, -10]);
  add(new THREE.PlaneGeometry(16, 1.1), hdr(3), [0, 1.6, 12]);           // faixa frontal baixa
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(scene, 0.015).texture;
  pm.dispose();
  mats.forEach((m) => m.dispose()); geos.forEach((g) => g.dispose());
  return tex;
}

export function makeStudioEnv(r: THREE.WebGLRenderer) {
  // a sala neutra do three (paredes, janelas e luzes: detalhe no reflexo) com
  // um chão escuro — o cromado ganha o horizonte claro/escuro de foto de produto
  const room = new RoomEnvironment();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.06, 0.065) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.2;
  room.add(floor);
  const pm = new THREE.PMREMGenerator(r);
  const tex = pm.fromScene(room, 0.03).texture;
  pm.dispose();
  room.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}

// A marca em 3D: anel de prata acetinada e bola de prata espelhada, nas
// proporções do 3D do Next Wave (anel 1.4, tubo 0.24, bola 0.58). Sólida:
// não deforma com o cursor.
/** o mesmo cromo espelhado do anel da marca, para as TVs e suportes */
export function chrome(env: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({ metalness: 1, envMap: env, color: col("#DCE0E6"), roughness: 0.04,
    clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 1.4 });
}

export function makeLogo(env: THREE.Texture, o: { scale: number; ring?: string; ball?: string; glow?: string; env?: number; mirror?: boolean; liquid?: boolean }) {
  const ek = o.env ?? 1;   // mundos escuros refletem menos (senão o metal "acende")
  const g = new THREE.Group();
  const ringM = new THREE.MeshPhysicalMaterial({ metalness: 1, envMap: env, color: col(o.ring || "#DCE0E6"), roughness: o.mirror ? 0.04 : 0.28,
    clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 1.4 * ek });
  const ballM = new THREE.MeshPhysicalMaterial({ metalness: 1, envMap: env, color: col(o.ball || "#E9ECF1"), roughness: o.mirror ? 0.01 : 0.12,
    clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.5 * ek,
    emissive: col(o.glow || "#000"), emissiveIntensity: o.glow ? 0.25 : 0 });
  const uT = { value: 0 };
  if (o.liquid) {
    // metal líquido: ondas lentas percorrem a superfície (como mercúrio)
    for (const m of [ringM, ballM]) {
      m.onBeforeCompile = (sh: any) => {
        sh.uniforms.uT = uT;
        sh.vertexShader = `uniform float uT;\n${sh.vertexShader}`.replace("#include <begin_vertex>", `#include <begin_vertex>
          float lq = sin(position.x * 3.1 + uT * 1.3) * sin(position.y * 2.7 - uT * 1.1) + sin(position.z * 3.6 + uT * 0.9) * 0.6;
          transformed += normal * lq * 0.045;`);
      };
    }
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.24, 64, 220), ringM);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.58, 96, 64), ballM);
  g.add(ring, ball); g.scale.setScalar(o.scale);
  return { group: g, ring, ball, update(t: number, _p?: THREE.Vector2, _c?: THREE.Camera) { uT.value = t; } };
}

/* ------------------------------------------------------------ raios */
// Lâminas aditivas longas, mais fortes perto da fonte, com um tremor lento:
// luz atravessando névoa, copa de árvore ou nuvem.
// Em mundo claro a luz é névoa (mistura normal, bem fraca); no escuro, soma.
export function makeRays(n: number, origin: THREE.Vector3, target: THREE.Vector3, color: string, strength = 0.18, spread = 10, seed = 1, additive = false) {
  const g = new THREE.Group();
  const r = rng(seed);
  const mats: THREE.ShaderMaterial[] = [];
  const dir = target.clone().sub(origin);
  const len = dir.length();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const w = 0.6 + r() * 2.6;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uC: { value: col(color) }, uT: { value: 0 }, uS: { value: strength * (0.4 + r() * 0.8) }, uP: { value: r() * 10 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uT, uS, uP; varying vec2 vUv;
        void main(){
          float along = vUv.y;
          float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
          float flick = 0.75 + 0.25 * sin(uT * 0.6 + uP) * sin(uT * 0.23 + uP * 2.0);
          gl_FragColor = vec4(uC, pow(across, 2.0) * pow(along, 1.4) * smoothstep(0.0, 0.3, along) * uS * flick);
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
    const off = new THREE.Vector3((r() - 0.5) * spread, (r() - 0.5) * spread * 0.15, (r() - 0.5) * spread);
    m.position.copy(origin).add(target).multiplyScalar(0.5).add(off);
    // o eixo +y do plano aponta para a fonte da luz
    m.quaternion.setFromUnitVectors(up, dir.clone().normalize().negate());
    m.rotateY(r() * Math.PI);
    g.add(m); mats.push(mat);
  }
  return { group: g, update: (t: number) => mats.forEach((m) => (m.uniforms.uT.value = t)) };
}

/* ------------------------------------------------------------ partículas no ar */
// Pólen, sementes, esporos, poeira de luz: sobem, derivam com o vento e
// piscam de leve.
export function makeMotes(count: number, box: [number, number, number, number, number, number], color: string,
  o: { size?: number; additive?: boolean; rise?: number; drift?: number; alpha?: number } = {}) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count), r = rng(count + 3);
  for (let i = 0; i < count; i++) { p.set([box[0] + r() * (box[1] - box[0]), box[2] + r() * (box[3] - box[2]), box[4] + r() * (box[5] - box[4])], i * 3); s[i] = r(); }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uT: { value: 0 }, uC: { value: col(color) }, uSize: { value: o.size ?? 40 }, uRise: { value: o.rise ?? 0.15 }, uDrift: { value: o.drift ?? 0.3 },
      uH: { value: box[3] - box[2] }, uY0: { value: box[2] }, uA: { value: o.alpha ?? 0.8 }, uPR: { value: Math.min(window.devicePixelRatio, 2) } },
    vertexShader: `uniform float uT, uSize, uRise, uDrift, uH, uY0, uPR; attribute float aS; varying float vA;
      void main(){
        vec3 p = position; float s = aS * 60.0;
        p.y = uY0 + mod(p.y - uY0 + uT * uRise * (0.5 + aS), uH);
        p.x += sin(uT * 0.3 + s) * 1.2 + uT * uDrift * (0.4 + aS);
        p.x = mod(p.x + 40.0, 80.0) - 40.0;
        p.z += cos(uT * 0.25 + s * 0.7) * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (0.4 + fract(s * 1.7) * 0.8) / -mv.z;
        float yy = (p.y - uY0) / uH;
        vA = smoothstep(0.0, 0.1, yy) * smoothstep(1.0, 0.85, yy) * (0.55 + 0.45 * sin(uT * 1.1 + s));
      }`,
    fragmentShader: `uniform vec3 uC; uniform float uA; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = pow(max(0.0, 1.0 - d * 2.0), 2.0);
        gl_FragColor = vec4(uC, a * vA * uA); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { pts, update: (t: number) => { mat.uniforms.uT.value = t; } };
}

/* ------------------------------------------------------------ lago */
// Vitórias-régias (folha redonda com o recorte) e flores de lótus.
export function makeLilies(pads: number, flowers: number, area: [number, number, number, number], avoid: (x: number, z: number) => boolean, seed = 4) {
  const g = new THREE.Group();
  const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  const padGeo = new THREE.CircleGeometry(0.55, 24, 0.35, Math.PI * 2 - 0.35); padGeo.rotateX(-Math.PI / 2);
  const padMesh = new THREE.InstancedMesh(padGeo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), pads);
  const pick = (): [number, number] => {
    let x = 0, z = 0;
    for (let k = 0; k < 40; k++) {
      x = area[0] + r() * (area[1] - area[0]); z = area[2] + r() * (area[3] - area[2]);
      if (!avoid(x, z) && fbm(x * 0.2, z * 0.2, 2) > 0.45) break;
    }
    return [x, z];
  };
  const spots: [number, number][] = [];
  for (let i = 0; i < pads; i++) {
    const [x, z] = pick(); spots.push([x, z]);
    const s = 0.5 + r() * 1.1;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
    m.compose(new THREE.Vector3(x, 0.02, z), q, new THREE.Vector3(s, 1, s));
    padMesh.setMatrixAt(i, m); padMesh.setColorAt(i, c.set("#8BA88D").offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.08));
  }
  g.add(padMesh);
  const petal = new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42); petal.rotateX(Math.PI); petal.translate(0, 0.2, 0);
  const lotus = new THREE.InstancedMesh(petal, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: col("#FFDCE6"), emissiveIntensity: 0.35 }), flowers);
  for (let i = 0; i < flowers; i++) {
    const [x, z] = spots[Math.floor(r() * spots.length)];
    const s = 0.8 + r() * 0.8;
    m.compose(new THREE.Vector3(x + (r() - 0.5) * 0.4, 0.03, z + (r() - 0.5) * 0.4), new THREE.Quaternion(), new THREE.Vector3(s, s * 1.2, s));
    lotus.setMatrixAt(i, m); lotus.setColorAt(i, c.set(r() < 0.5 ? "#FFF5F8" : "#F8CCDA"));
  }
  g.add(lotus);
  return g;
}

/* ------------------------------------------------------------ pássaros */
// Um V que bate as asas; o bando cruza o céu devagar e recomeça.
export function makeBirds(n: number, center: THREE.Vector3, color = "#4A4F57", seed = 8) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.25, -1, 0, 0, 0, 0, -0.15, 0, 0, 0.25, 1, 0, 0, 0, 0, -0.15], 3));
  geo.setAttribute("aSide", new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0], 1));
  const ph = new Float32Array(n); const r = rng(seed); for (let i = 0; i < n; i++) ph[i] = r() * 10;
  const ig = new THREE.InstancedBufferGeometry(); ig.copy(geo as any); ig.setAttribute("aPh", new THREE.InstancedBufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, uniforms: { uT: { value: 0 }, uC: { value: col(color) } },
    vertexShader: `uniform float uT; attribute float aSide, aPh;
      void main(){ vec3 p = position; p.y = abs(aSide) * sin(uT * 7.0 + aPh) * 0.55;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p * 0.45, 1.0); }`,
    fragmentShader: `uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 0.7);
      #include <colorspace_fragment>
    }`,
  });
  const mesh = new THREE.InstancedMesh(ig, mat, n);
  mesh.frustumCulled = false;
  const off = Array.from({ length: n }, () => new THREE.Vector3((r() - 0.5) * 9, (r() - 0.5) * 2.2, (r() - 0.5) * 6));
  const d = new THREE.Object3D();
  return {
    mesh,
    update(t: number) {
      mat.uniforms.uT.value = t;
      const x = ((t * 1.5) % 130) - 65;
      for (let i = 0; i < n; i++) {
        d.position.set(center.x + x + off[i].x, center.y + off[i].y + Math.sin(t * 0.7 + i) * 0.3, center.z + off[i].z);
        d.rotation.set(0, -Math.PI / 2, 0); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------ nuvens */
let cloudTex: THREE.Texture | null = null;
function cloudTexture() {
  if (cloudTex) return cloudTex;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const r = rng(77);
  for (let i = 0; i < 26; i++) {
    const px = 60 + r() * 136, py = 90 + r() * 90, rad = 30 + r() * 60;
    const gr = x.createRadialGradient(px, py, 0, px, py, rad);
    gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  }
  cloudTex = new THREE.CanvasTexture(c); cloudTex.colorSpace = THREE.SRGBColorSpace;
  return cloudTex;
}
// Mar de nuvens: quatro camadas de ruído animado (dão volume) e nuvens soltas.
export function makeCloudSea(y: number, tint: string, shade: string, puffs: number, seed = 2) {
  const g = new THREE.Group();
  const mats: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uT: { value: 0 }, uC: { value: col(tint) }, uS: { value: col(shade) }, uL: { value: i / 3 } },
      vertexShader: `varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.0); }`,
      fragmentShader: `uniform vec3 uC, uS; uniform float uT, uL; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(h(i), h(i + vec2(1,0)), u.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ s += a * n(p); p *= 2.02; a *= 0.5; } return s; }
        void main(){
          vec2 q = vW.xz * 0.045 + vec2(uT * 0.006, uT * 0.003) + uL * 3.1;
          float d = fbm(q + fbm(q * 1.7 + uT * 0.004));
          float dens = smoothstep(0.42 + uL * 0.08, 0.78, d);
          vec3 c = mix(uS, uC, smoothstep(0.4, 0.9, d) * 0.7 + uL * 0.3);
          float far = smoothstep(170.0, 40.0, length(vW.xz));
          gl_FragColor = vec4(c, dens * (0.55 + uL * 0.15) * far);
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), mat);
    m.rotation.x = -Math.PI / 2; m.position.y = y + i * 0.45;
    g.add(m); mats.push(mat);
  }
  const r = rng(seed);
  const sm = new THREE.SpriteMaterial({ map: cloudTexture(), color: col(tint), transparent: true, depthWrite: false, opacity: 0.85 });
  const sprites: THREE.Sprite[] = [];
  for (let i = 0; i < puffs; i++) {
    const s = new THREE.Sprite(sm);
    const sc = 8 + r() * 16;
    s.scale.set(sc * 1.6, sc, 1);
    s.position.set((r() - 0.5) * 130, y + 1 + r() * 3, -r() * 110 + 10);
    s.userData.v = 0.2 + r() * 0.5;
    g.add(s); sprites.push(s);
  }
  return {
    group: g,
    update(t: number, dt: number) {
      mats.forEach((m) => (m.uniforms.uT.value = t));
      sprites.forEach((s) => { s.position.x += s.userData.v * dt; if (s.position.x > 70) s.position.x = -70; });
    },
  };
}

/* ------------------------------------------------------------ ilhas */
// Rocha irregular de topo achatado e base em ponta, com a cobertura verde.
export function makeIsland(seed: number, size: number) {
  const g = new THREE.Group();
  const rock = new THREE.DodecahedronGeometry(1, 2);
  const p = rock.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + (fbm(v.x * 1.7 + seed, v.z * 1.7 + v.y, 3) - 0.5) * 0.7);
    if (v.y > 0) v.y *= 0.25; else v.y *= 1.7;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  rock.computeVertexNormals();
  g.add(new THREE.Mesh(rock, new THREE.MeshStandardMaterial({ color: col("#C3B6AE"), roughness: 0.95, flatShading: true })));
  const top = new THREE.Mesh(new THREE.SphereGeometry(1.02, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.22),
    new THREE.MeshStandardMaterial({ color: col("#B3CBA2"), roughness: 1 }));
  top.scale.set(1, 0.35, 1); top.position.y = -0.08;
  g.add(top);
  g.scale.setScalar(size);
  return g;
}

/* ------------------------------------------------------------ cogumelos */
// Cogumelos que brilham no escuro, em grupinhos pelo chão da floresta.
export function makeMushrooms(n: number, area: [number, number, number, number], height: Height, color: string, seed = 6) {
  const g = new THREE.Group();
  const cap = new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const stem = new THREE.CylinderGeometry(0.03, 0.045, 0.3, 6); stem.translate(0, -0.15, 0);
  const caps = new THREE.InstancedMesh(cap, new THREE.MeshBasicMaterial({ color: col(color) }), n);
  const stems = new THREE.InstancedMesh(stem, new THREE.MeshBasicMaterial({ color: col("#9DB8B2") }), n);
  const r = rng(seed), m = new THREE.Matrix4();
  let cx = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    if (i % 5 === 0) { cx = area[0] + r() * (area[1] - area[0]); cz = area[2] + r() * (area[3] - area[2]); }
    const x = cx + (r() - 0.5) * 0.9, z = cz + (r() - 0.5) * 0.9, s = 0.6 + r() * 1.2;
    m.makeScale(s, s, s).setPosition(x, height(x, z) + 0.3 * s, z);
    caps.setMatrixAt(i, m); stems.setMatrixAt(i, m);
  }
  g.add(stems, caps);
  return g;
}
