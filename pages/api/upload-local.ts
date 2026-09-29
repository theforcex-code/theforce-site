import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') return res.status(403).json({ error: 'local only' });
  if (req.method !== 'POST') return res.status(405).end();

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true, maxFileSize: 2 * 1024 * 1024 * 1024 });

  form.parse(req, (err, _fields, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const f = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!f) return res.status(400).json({ error: 'no file' });

    const origName = f.originalFilename ?? path.basename(f.filepath);
    const dest = path.join(uploadDir, origName);

    try { fs.renameSync(f.filepath, dest); } catch {
      fs.copyFileSync(f.filepath, dest);
      try { fs.unlinkSync(f.filepath); } catch {}
    }

    res.json({ url: `/uploads/${origName}` });
  });
}
