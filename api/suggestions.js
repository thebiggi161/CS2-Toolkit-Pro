const crypto = require('crypto');

const REPO = process.env.GITHUB_REPOSITORY || 'thebiggi161/CS2-Toolkit-Pro';
const API = 'https://api.github.com';
const LIMIT = 5;

function json(res, status, body) {
  res.status(status).json(body);
}

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const ip = String(forwarded).split(',')[0].trim();
  return crypto.createHash('sha256').update(ip + '|' + (process.env.SUGGESTION_RATE_SECRET || process.env.ADMIN_SESSION_SECRET || 'cs2')).digest('hex');
}

async function github(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN fehlt');
  const response = await fetch(API + path, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'GitHub API Fehler');
  return data;
}

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getRecentSuggestions() {
  const q = encodeURIComponent('repo:' + REPO + ' label:toolkit-suggestion is:open');
  return github('/search/issues?q=' + q + '&sort=created&order=desc&per_page=100');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const data = await getRecentSuggestions();
      return json(res, 200, {
        items: (data.items || []).map(issue => ({
          id: issue.number,
          text: String(issue.body || '').slice(0, 150),
          player: issue.user?.login === 'github-actions[bot]' ? 'Anonym' : (issue.body || '').match(/Spieler: (.*)/)?.[1] || 'Anonym',
          time: issue.created_at,
          url: issue.html_url
        }))
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return json(res, 405, { error: 'Methode nicht erlaubt' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const text = String(body.text || '').trim();
    const player = String(body.player || 'Anonym').trim().slice(0, 40) || 'Anonym';

    if (!text) return json(res, 400, { error: 'Bitte einen Vorschlag eingeben.' });
    if (text.length > 150) return json(res, 400, { error: 'Maximal 150 Zeichen.' });

    const today = dateKey();
    const data = await getRecentSuggestions();
    const key = clientKey(req);

    const ownToday = (data.items || []).filter(issue => {
      const marker = String(issue.body || '').match(/Rate-Key: ([a-f0-9]{64})/);
      return marker && marker[1] === key && String(issue.created_at || '').slice(0, 10) === today;
    });

    if (ownToday.length >= LIMIT) {
      return json(res, 429, { error: 'Tageslimit erreicht. Morgen sind wieder 5 Vorschläge möglich.' });
    }

    const issue = await github('/repos/' + REPO + '/issues', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Spielervorschlag: ' + text.slice(0, 70),
        body: 'Vorschlag: ' + text + '\n\nSpieler: ' + player + '\nRate-Key: ' + key,
        labels: ['toolkit-suggestion']
      })
    });

    return json(res, 201, {
      item: { id: issue.number, text, player, time: issue.created_at, url: issue.html_url }
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Speichern fehlgeschlagen.' });
  }
};
