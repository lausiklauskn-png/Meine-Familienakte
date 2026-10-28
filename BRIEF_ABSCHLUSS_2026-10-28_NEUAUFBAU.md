# Abschluss der Sitzung vom 28.10.2026: Neuaufbau der Familienakte

## Auftrag

1. Den Brief `NEUSTART_AUFTRAG.md` umsetzen.
2. Klaus’ Zusatz: Die neue App soll von der Vorgänger-App des Freundes **in Aufbau, Funktionen
   und Aussehen nicht zu unterscheiden** sein.
3. Die Beispieldaten sollen sich mit einem Klick entfernen lassen.
4. Am Ende einen Link liefern, mit dem sich die App direkt öffnen lässt.

## Ergebnis

| PR | Inhalt |
| --- | --- |
| #2 | Oberfläche der Original-App (2.28.1) als reine Browser-App: Vite + React statt Next.js/Cloudflare. Datentresor im Browser (OPFS), eigener Ordner weiterhin wählbar. Erfundene Beispielfamilie Lindqvist-Arenberg mit 16 selbst erzeugten Beispiel-PDFs und dem Knopf **„Beispieldaten entfernen“** (eigene Einträge bleiben) bzw. „Beispieldaten laden“. Gesundheits-Beispielinhalte ohne Codes und ohne Ärzte. Absturz auf „Familie & Personen“ behoben. README und Screenshots. |
| #3 | Eingebettet und einzeln nutzbar: Rückfragen als Dialog in der Seite, Dokumentvorschau in der Seite (PDF über pdf.js), Speicher-Rückfall IndexedDB, `npm run build:single`. |
| #4 | Einzeldatei: Ersatzzeichen U+FFFD als Escape-Folge (sonst lehnt die Veröffentlichung ab). |
| #5 | Mikrofon deaktivieren, wo der Browser es grundsätzlich sperrt (lokale Datei, eingebettete Seite). Kein „Fehlgeschlagen“ mehr beim Antippen. |
| #6 | Auftrag `docs/ANALYSE_AUFTRAG.md`, Forschungseintrag, dieser Abschluss und der Brief für die nächste Sitzung. |

**Link zur App (privat, nur Klaus):** https://claude.ai/artifact/QeYH2B9qwU5tqphrCAtQhc

**Prüfung:**

- Alle 24 Prüfskripte und die Systemprüfung sind grün; die Typprüfung ist sauber.
- Eingebettet unter eingeschränkter CSP getestet, mit OPFS und mit IndexedDB: Beispieldaten
  laden, PDF-Vorschau, Entfernen über den Dialog, wieder laden.

## Was Klaus gesehen bzw. gemeldet hat

- Das Design ist „so einigermaßen in Ordnung“.
- Das Mikrofon ging nicht, als die Einzeldatei auf dem Handy geöffnet war (`content://…`, keine
  sichere Adresse). Behoben ist nur die Fehlermeldung. Damit das Diktat wirklich geht, braucht
  es eine https-Adresse oder eine APK mit nativem Diktat.

## Offen bzw. an die nächste Sitzung

- Analyse aller Knöpfe, Dateieingang, KI und Anonymisierung, Geräte-Eingang:
  `docs/ANALYSE_AUFTRAG.md`
- Erster Bau: offline-fähige PWA, APK und Windows-App mit Internetschalter wie in Private Brain
  Pro. Siehe `BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md`.
- Entscheidung zur https-Adresse (öffentliches Auslieferungs-Repo plus Pages).
- Nicht gemacht: Service Worker / Offline-Cache, Teilen-Ziel, Mikrofonauswahl, KI-Anbindung.

## Hinweise für Nachfolger

- Nicht an Gestaltung und Wortlaut der Oberfläche drehen: Sie soll der Original-App gleichen.
  Abweichungen nur, wo der Browser es erzwingt, und dann im README benennen.
- Prüfskripte lesen den Quelltext auf feste Wörter (z. B. Bestätigungsdialoge). Bei Umbauten die
  Prüfung **anpassen, nie abschalten**.
- Die Schutzlogik verbirgt alles, was nach Gesundheit, Rente, Finanzen, Behörde oder
  „persönlich“ klingt, und vererbt das über Verknüpfungen. Beispieldaten deshalb so anlegen,
  dass nichts fälschlich verborgen wird (siehe `app/sample-family.ts`).
