import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';

// Repassa imagens e vídeos do storage pela mesma origem do site. O bucket R2
// não manda cabeçalho CORS, e sem isso o navegador não deixa usar a mídia como
// textura WebGL. Só aceita os hosts de mídia do site (não é um proxy aberto) e
// repassa Range, para o vídeo poder tocar e pular sem baixar o arquivo todo.
// Se um dia o bucket ganhar CORS, dá para ligar NEXT_PUBLIC_MEDIA_CORS=1 e o
// site passa a buscar direto de lá.
const ALLOWED = [/\.r2\.dev$/, /\.public\.blob\.vercel-storage\.com$/];

export const config = { api: { responseLimit: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const u = String(req.query.u || '');
  let url: URL;
  try { url = new URL(u); } catch { return res.status(400).end(); }
  if (url.protocol !== 'https:' || !ALLOWED.some((r) => r.test(url.hostname))) return res.status(403).end();

  const headers: Record<string, string> = {};
  if (req.headers.range) headers.Range = String(req.headers.range);
  const up = await fetch(url, { headers });

  res.status(up.status);
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const v = up.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (!up.body) return res.end();
  Readable.fromWeb(up.body as any).pipe(res);
}
