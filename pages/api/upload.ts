import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = { api: { bodyParser: false } };

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // upload só no ambiente local (o site publicado não edita)
  if (process.env.NODE_ENV !== 'development') return res.status(403).json({ error: 'local only' });

  const form = formidable({ uploadDir: os.tmpdir(), keepExtensions: true, maxFileSize: 500 * 1024 * 1024 });

  try {
    const [, files] = await form.parse(req);
    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: 'no file' });
    const type = (file.mimetype || '').startsWith('video') ? 'video' : 'image';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const buffer = fs.readFileSync(file.filepath);
      const blob = await put(path.basename(file.filepath), buffer, {
        access: 'public',
        contentType: file.mimetype || 'application/octet-stream',
      });
      try { fs.unlinkSync(file.filepath); } catch {}
      return res.json({ url: blob.url, type });
    }

    // local fallback
    fs.mkdirSync(uploadDir, { recursive: true });
    const dest = path.join(uploadDir, path.basename(file.filepath));
    fs.renameSync(file.filepath, dest);
    return res.json({ url: `/uploads/${path.basename(dest)}`, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
