const { createSession, setSessionCookie } = require('./_auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME || '';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!expectedUser || !expectedPassword || username !== expectedUser || password !== expectedPassword) {
    return res.status(401).json({ error: 'Ungültige Zugangsdaten.' });
  }

  setSessionCookie(res, createSession(username));
  return res.status(200).json({ ok: true, username });
};
