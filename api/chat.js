const { verifySession } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifySession(req)) return res.status(401).json({ error: 'Admin-Login erforderlich.' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY ist im Backend noch nicht konfiguriert.' });
  }

  const { messages = [] } = req.body || {};
  const safeMessages = Array.isArray(messages)
    ? messages.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-20)
    : [];

  if (!safeMessages.length) return res.status(400).json({ error: 'Keine Nachricht übergeben.' });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      instructions: [
        'Du bist der Admin-Assistent für das Projekt CS2 Toolkit Pro.',
        'Antworte auf Deutsch und konzentriere dich auf konkrete Änderungen, Fehleranalyse und Weiterentwicklung der Website.',
        'Du darfst Änderungen planen und Code erklären. Führe keine Änderung selbstständig aus; eine spätere Bestätigung durch den Admin ist erforderlich.',
        'Wenn der Nutzer eine Änderung beschreibt, fasse zuerst kurz zusammen, was geändert werden soll, welche Datei vermutlich betroffen ist und welche Risiken es gibt.'
      ].join('\n'),
      input: safeMessages.map(m => ({ role: m.role, content: m.content }))
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({ error: data?.error?.message || 'OpenAI-Anfrage fehlgeschlagen.' });
  }

  const text = data.output_text || (data.output || [])
    .flatMap(item => item.content || [])
    .map(part => part.text || '')
    .join('\n')
    .trim();

  return res.status(200).json({ reply: text || 'Keine Antwort erhalten.' });
};
