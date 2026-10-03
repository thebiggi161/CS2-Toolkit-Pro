const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://thebiggi161.github.io';
function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

const { clearSessionCookie, clearGoogleSessionCookie } = require('./_auth');

module.exports = (req, res) => {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  clearSessionCookie(res);
  clearGoogleSessionCookie(res);
  return res.status(200).json({ ok: true });
};
