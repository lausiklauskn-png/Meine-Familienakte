# Meine Familienakte

Private Familienakte als Web-App: Gesundheit & Vorsorge, Arbeit, Familie & Personen,
Wohnen, Fahrzeuge, Käufe & Garantien, Dokumente, Assistent, Erinnerungen, Export und Hilfe.

**Alle enthaltenen Daten sind frei erfundene Beispieldaten.** Es gibt keine echten
Personen, Orte, Firmen oder Nummern.

## Starten (lokal im Browser)

Voraussetzung: Node.js 22 und pnpm.

```
pnpm install --frozen-lockfile
pnpm run dev -- --hostname 127.0.0.1
```

Dann im Browser öffnen: http://127.0.0.1:5173/signin-with-chatgpt?return_to=/
(lokale Test-Anmeldung).

`pnpm run build` führt alle automatischen Prüfungen aus und baut die App.

## Technik

React 19, Next.js-kompatibel über Vinext und Vite, ausgelegt auf Cloudflare Workers
(Datenbank D1, Dateispeicher R2). Weitere Hinweise zur Laufzeitumgebung:
[docs/TECHNIK.md](docs/TECHNIK.md).

## Weiterentwicklung

Der nächste Arbeitsauftrag steht in [NEUSTART_AUFTRAG.md](NEUSTART_AUFTRAG.md).
