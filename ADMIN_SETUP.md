# CS2 Toolkit Pro – Admin-Backend

Der TestLab-Admin läuft über serverseitige Vercel Functions. Dadurch liegen Passwort, Session-Schlüssel und OpenAI-Schlüssel nicht im öffentlichen Frontend.

## Deployment

1. Repository in Vercel importieren.
2. Die Domain der Vercel-Bereitstellung öffnen.
3. Unter **Settings → Environment Variables** diese Variablen setzen:
   - `ADMIN_USERNAME` – dein Admin-Benutzername
   - `ADMIN_PASSWORD` – ein langes, zufälliges Admin-Passwort
   - `ADMIN_SESSION_SECRET` – mindestens 32 zufällige Zeichen
   - `OPENAI_API_KEY` – dein OpenAI API-Key
   - `OPENAI_MODEL` – optional; falls leer, wird `gpt-5-mini` verwendet
4. Neu deployen.
5. Im Test-Reiter mit den gesetzten Zugangsdaten anmelden.

## Sicherheit

- Die Login-Session wird als HttpOnly/Secure/SameSite-Cookie ausgegeben und läuft nach 8 Stunden ab.
- OpenAI-Schlüssel werden ausschließlich serverseitig verwendet.
- Keine Zugangsdaten in `index.html` oder anderen öffentlichen Dateien hinterlegen.
- GitHub Pages kann die `/api/*`-Funktionen nicht ausführen. Für den Admin-Bereich muss die Seite über Vercel (oder einen vergleichbaren Serverless-Host) ausgeliefert werden.

## Nächster Ausbau

Die vorhandene Struktur ist bewusst so vorbereitet, dass anschließend ein bestätigungspflichtiger GitHub-Änderungsworkflow ergänzt werden kann:
**Anfrage → Analyse → Diff/Vorschau → Admin bestätigt → GitHub-Commit.**
