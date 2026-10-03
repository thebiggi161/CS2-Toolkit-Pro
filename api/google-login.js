const { createSession, setGoogleSessionCookie } = require('./_auth');

async function verifyGoogleCredential(idToken) {
  const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
  const data = await response.json();
  if (!response.ok || data.error_description) throw new Error('Google-Token konnte nicht verifiziert werden.');

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID fehlt im Server.');
  if (data.aud !== clientId) throw new Error('Google-Client-ID stimmt nicht mit dem Server überein.');
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(data.iss)) throw new Error('Ungültiger Google-Aussteller.');
  if (data.exp && Number(data.exp) * 1000 < Date.now()) throw new Error('Google-Token ist abgelaufen.');
  if (data.email_verified !== 'true') throw new Error('Das Google-Konto ist nicht verifiziert.');

  return {
    sub: data.sub,
    email: data.email,
    name: data.name || data.email,
    picture: data.picture || ''
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { credential } = req.body || {};
  if (!credential || typeof credential !== 'string' || credential.length > 12000) {
    return res.status(400).json({ error: 'Ungültige Google-Anmeldung.' });
  }

  try {
    const user = await verifyGoogleCredential(credential);
    const session = createSession(user.email, {
      provider: 'google',
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture
    });
    setGoogleSessionCookie(res, session);
    return res.status(200).json({ ok: true, user });
  } catch (error) {
    return res.status(401).json({ error: error.message || 'Google-Anmeldung fehlgeschlagen.' });
  }
};
