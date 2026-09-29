import * as THREE from "three";

/* Texturas dos projetos. A capa em miniatura (public/thumbs/<id>.jpg, gerada
   por scripts/thumbs.mjs) carrega na hora e serve para tudo que está parado;
   o vídeo só entra quando o projeto está em foco (hover, destaque). Os
   arquivos originais passam por /api/media porque o bucket não manda CORS. */

export type Tex = { tex: THREE.Texture; aspect: number };

const DIRECT = process.env.NEXT_PUBLIC_MEDIA_CORS === "1";
export const viaProxy = (src: string) =>
  DIRECT || src.startsWith("/") ? src : `/api/media?u=${encodeURIComponent(src)}`;

const loader = new THREE.TextureLoader();
const thumbs = new Map<string, Promise<Tex>>();
const videos = new Map<string, { el: HTMLVideoElement; tex: THREE.VideoTexture; users: number }>();

function prep(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

/** miniatura; se ela ainda não existir (projeto novo), usa a capa original */
export function thumb(p: { id: string; cover?: any; videoUrl?: string }): Promise<Tex> {
  let hit = thumbs.get(p.id);
  if (hit) return hit;
  hit = new Promise<Tex>((res) => {
    const ok = (t: THREE.Texture) => res({ tex: prep(t), aspect: (t.image as any).width / (t.image as any).height || 16 / 9 });
    loader.load(`/thumbs/${encodeURIComponent(p.id)}.jpg`, ok, undefined, () => {
      const c = p.cover;
      if (c?.type === "image") loader.load(viaProxy(c.src), ok, undefined, () => res(blank()));
      else if (c?.src || p.videoUrl) firstFrame(p.videoUrl || c.src).then(res, () => res(blank()));
      else res(blank());
    });
  });
  thumbs.set(p.id, hit);
  return hit;
}

function firstFrame(src: string): Promise<Tex> {
  return new Promise((res, rej) => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous"; v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = viaProxy(src);
    v.addEventListener("loadeddata", () => { v.currentTime = Math.min(1, v.duration / 3 || 0); }, { once: true });
    v.addEventListener("seeked", () => {
      const c = document.createElement("canvas");
      c.width = 640; c.height = Math.round(640 * v.videoHeight / v.videoWidth) || 360;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      v.removeAttribute("src"); v.load();
      res({ tex: prep(new THREE.CanvasTexture(c)), aspect: c.width / c.height });
    }, { once: true });
    v.addEventListener("error", rej, { once: true });
  });
}

function blank(): Tex {
  const d = new Uint8Array([60, 52, 70, 255]);
  const t = new THREE.DataTexture(d, 1, 1); t.needsUpdate = true;
  return { tex: prep(t), aspect: 16 / 9 };
}

/** vídeo tocando como textura; devolve null se a capa não é vídeo */
export function video(p: { id: string; cover?: any; videoUrl?: string }): THREE.VideoTexture | null {
  const src = p.videoUrl || (p.cover?.type === "video" ? p.cover.src : "");
  if (!src) return null;
  let v = videos.get(p.id);
  if (!v) {
    const el = document.createElement("video");
    el.crossOrigin = "anonymous"; el.muted = true; el.loop = true; el.playsInline = true; el.preload = "auto";
    // prévia leve na mesma origem (public/previews, scripts/previews.mjs);
    // se ainda não existir para este projeto, cai para o original via proxy
    el.src = `/previews/${encodeURIComponent(p.id)}.mp4`;
    el.addEventListener("error", () => { if (!el.src.includes("/api/media")) { el.src = viaProxy(src); el.play().catch(() => {}); } }, { once: true });
    v = { el, tex: prep(new THREE.VideoTexture(el)) as THREE.VideoTexture, users: 0 };
    videos.set(p.id, v);
  }
  v.users++;
  v.el.play().catch(() => {});
  return v.tex;
}
export function videoReady(t: THREE.VideoTexture) {
  const el = t.image as HTMLVideoElement;
  return el.readyState >= 2 && !el.paused;
}
export function release(id: string) {
  const v = videos.get(id);
  if (!v) return;
  v.users = Math.max(0, v.users - 1);
  if (!v.users) v.el.pause();
}
