import type { NextApiRequest, NextApiResponse } from 'next';

// sem senha padrão no código: sem SITE_PASSWORD configurado, o login fica fechado
const PASSWORD = process.env.SITE_PASSWORD;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body as { password: string };

  if (PASSWORD && password === PASSWORD) {
    const maxAge = 60 * 60 * 24 * 30;
    res.setHeader('Set-Cookie', `tf_auth=${PASSWORD}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
    return res.json({ ok: true });
  }

  res.status(401).json({ error: 'wrong password' });
}
