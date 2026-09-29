import type { NextApiRequest, NextApiResponse } from 'next';

// Temporary endpoint for direct Blob uploads (bypasses 4.5MB serverless limit)
// Protected by a one-time secret key in the query string
// desativado: entregava a chave de gravação do Blob a quem soubesse uma senha fixa no código
const SECRET = process.env.BLOB_UPLOAD_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development' || !SECRET || req.query.secret !== SECRET) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    // Returns the BLOB_READ_WRITE_TOKEN so client can upload directly
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'no blob token' });
    return res.json({ token });
  }

  res.status(405).end();
}
