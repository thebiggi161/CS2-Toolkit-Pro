const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://thebiggi161.github.io';
function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

const { verifySession } = require('./_auth');

module.exports = (req, res) => {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const google = verifySession(req, 'cs2_google_session');
  if (google) {
    return res.status(200).json({
      authenticated: true,
      provider: 'google',
      username: google.u,
      user: {
        email: google.email || google.u,
        name: google.name || google.u,
        picture: google.picture || ''
      }
    });
  }

  const admin = verifySession(req, 'cs2_admin_session');
  if (admin) return res.status(200).json({ authenticated: true, provider: 'admin', username: admin.u });

  return res.status(401).json({ authenticated: false });
};
