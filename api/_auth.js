const crypto = require('crypto');

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createSession(username) {
  const payload = JSON.stringify({ u: username, exp: Date.now() + 8 * 60 * 60 * 1000 });
  const encoded = base64url(payload);
  return encoded + '.' + sign(encoded);
}

function verifySession(req) {
  const header = req.headers.cookie || '';
  const match = header.match(/(?:^|;\s*)cs2_admin_session=([^;]+)/);
  if (!match || !getSecret()) return null;

  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const expected = sign(parts[0]);
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!session.u || !session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', [
    'cs2_admin_session=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800'
  ]);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    'cs2_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ]);
}

module.exports = { createSession, verifySession, setSessionCookie, clearSessionCookie };
