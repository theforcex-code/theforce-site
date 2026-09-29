import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// sem senha padrão no código: sem BLOB_UPLOAD_SECRET configurado, ninguém gera token
const UPLOAD_SECRET = process.env.BLOB_UPLOAD_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as HandleUploadBody;

  // Only token generation needs authentication; completion callbacks come from Vercel
  if ((body as any)?.type === 'blob.generate-client-token') {
    const secret = req.headers['x-upload-secret'] as string;
    if (!UPLOAD_SECRET || secret !== UPLOAD_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/*', 'video/*'],
        maximumSizeInBytes: 500 * 1024 * 1024,
      }),
      onUploadCompleted: async () => { /* no-op */ },
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
