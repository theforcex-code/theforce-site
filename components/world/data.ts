import type { SceneKey } from "./engine";

export type Media = { type: "image" | "video"; src: string; w?: number; h?: number; poster?: string };
export type Project = {
  id: string; title: any; kind: string; year?: string; location?: string; client?: any;
  description?: any; cover?: Media; gallery?: Media[]; credits?: any[]; videoUrl?: string; order?: number;
};
export type Content = { settings: any; projects: Project[] };

// Mesma chave e mesma API do editor: o que for editado em /editor aparece aqui.
const KEY = "tf_portfolio_v6";

export async function loadContent(): Promise<Content> {
  const r = await fetch(`/api/content?key=${KEY}`);
  const { value } = await r.json();
  const data = typeof value === "string" ? JSON.parse(value) : value;
  const projects: Project[] = (data?.projects || [])
    .filter((p: any) => p && p.id)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  return { settings: data?.settings || {}, projects };
}

export type Route =
  | { page: "index" } | { page: "projects" } | { page: "project"; id: string }
  | { page: "about" } | { page: "contact" } | { page: "nextwave" };

export function parse(path: string): Route {
  const p = path.replace(/\/+$/, "").split("/").filter(Boolean);
  if (p[0] === "projects" && p[1]) return { page: "project", id: decodeURIComponent(p[1]) };
  if (p[0] === "projects") return { page: "projects" };
  if (p[0] === "about") return { page: "about" };
  if (p[0] === "contact") return { page: "contact" };
  if (p[0] === "next-wave") return { page: "nextwave" };
  return { page: "index" };
}

export function pathOf(r: Route) {
  if (r.page === "project") return `/projects/${encodeURIComponent(r.id)}`;
  if (r.page === "nextwave") return "/next-wave";
  return r.page === "index" ? "/" : `/${r.page}`;
}

export const sceneOf = (r: Route): SceneKey => r.page;

// Tom do texto por cima de cada cenário.
export const toneOf = (r: Route) => (r.page === "projects" || r.page === "project" ? "dark" : "light");

export const mediaOf = (p: Project): Media | null => {
  if (p.videoUrl) return { type: "video", src: p.videoUrl };
  return p.cover?.src ? p.cover : null;
};
export const ratio = (m?: Media | null, fb = 16 / 9) => (m?.w && m?.h ? m.w / m.h : fb);
