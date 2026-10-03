const { clearSessionCookie, clearGoogleSessionCookie } = require('./_auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  clearSessionCookie(res);
  clearGoogleSessionCookie(res);
  return res.status(200).json({ ok: true });
};
