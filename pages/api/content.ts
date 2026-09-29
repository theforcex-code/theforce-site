import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'content.json');

function fileGet(): string | null {
  try { return fs.readFileSync(dataFile, 'utf8'); } catch { return null; }
}
function fileSet(value: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, value, 'utf8');
}
function fileDel() {
  try { fs.unlinkSync(dataFile); } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  // o site publicado só lê: gravar ou apagar o conteúdo fica restrito ao ambiente local
  if (req.method !== 'GET' && process.env.NODE_ENV !== 'development') return res.status(403).json({ error: 'read only' });

  if (!process.env.USE_LOCAL_STORAGE && process.env.KV_REST_API_URL) {
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;
    const KEY = 'tf_portfolio_v6';

    if (req.method === 'GET') {
      const r = await fetch(`${KV_URL}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await r.json();
      const raw = data.result;
      const value = raw === null || raw === undefined ? null : typeof raw === 'string' ? raw : JSON.stringify(raw);
      return res.json({ value });
    }

    if (req.method === 'PUT') {
      const value: string = (req.body as any).value;
      await fetch(`${KV_URL}/set/${KEY}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: value,
      });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await fetch(`${KV_URL}/del/${KEY}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      return res.json({ ok: true });
    }

    return res.status(405).end();
  }

  // local fallback
  if (req.method === 'GET') return res.json({ value: fileGet() });
  if (req.method === 'PUT') { fileSet((req.body as any).value); return res.json({ ok: true }); }
  if (req.method === 'DELETE') { fileDel(); return res.json({ ok: true }); }
  res.status(405).end();
}
