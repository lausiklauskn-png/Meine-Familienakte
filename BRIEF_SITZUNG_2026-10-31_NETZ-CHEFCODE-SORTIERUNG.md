# Brief: Familienakte ins Netz der Pro-Apps und Briefkopf-Sortierung (Klaus 2026-10-31)

Der ganze Plan steht zentral in **BookLedgerPro `BRIEF_SITZUNG_PRO-UMBAU-14.md`** (Sitzungen A–D). Für dieses Repo gilt daraus:

- **Sitzung B** (nach dem Chef-PIN-Umbau in Private Brain Pro):
  - **Aktualisieren oben**: Knopf in der Kopfleiste neben dem Internetschalter (`app/netz-schalter.tsx`), dieselbe Prüfung wie heute der Tipp
    auf die Versionszeile (`docs/UPDATES-EIGENER-SERVER.md`), nur bei Internet an.
  - **Mycel/SBKIM** (Kanon-Module byte-1:1 aus Sage unter `public/sbkim/`, eigene Schublade), **Chefcode** und **„Überall suchen“** über die
    gemeinsamen Bausteine der Pro-Apps (Quelle Private Brain Pro), Quellen hier: Dokumente, Memory, Vorgänge.
- **Sitzung D**: Briefkopf lesen (Briefdatum, Absender, Empfänger, Kunden-/Auftrags-/Rechnungsnummer, Aktenzeichen, Wichtigkeit) und danach
  sortieren, dazu **nach Thema** — die 18 Lebensbereiche in `lib/family-categories.ts` (mit Aliassen und Zuordnungsvorschlag) sind schon da und
  werden das Vorbild für die anderen Apps. Baustein aus Workflow-PDF, hier zuletzt; `documentDate` (heute von Hand) und Mailkopf (`lib/central-intake.ts`) werden Vorgabe/Quelle.

## Gebaut am 2026-10-31 (PR #30): „Mit KI arbeiten“

Klaus: „eine Anonymisierung, wenn ich von einer KI … die App umbauen lassen möchte“ · „nicht alle Dokumente mitschicken … Dokumentenauswahl“ ·
„auch der Zurückweg muss gegeben sein“. Seine Antworten: Knopf fest unten rechts · ChatGPT und Claude/Claude Code · Sitzungs-Link je Seite merken ·
Text und Bilder unkenntlich, Vorschau vor dem Öffnen, Beispieldaten prüfen.

- Knopf `.ki-fab` unten rechts auf jeder Seite, Fenster `app/ki-auftrag-dialog.tsx` (ersetzt `ChatGPTEditDialog`, Fußzeile heißt „Mit KI arbeiten“).
- **App ändern**: es geht nie eine Unterlage mit, nur Wunsch + Seite + Repo-Link. **Unterlage bearbeiten**: höchstens 5 gewählte Unterlagen
  (aus der Akte oder „Datei wählen“), Text aus PDF-Textebene (`pdfText` in `app/file-viewer.tsx`), Word, E-Mail, Text.
- Unkenntlich: Modul 25 byte-1:1 (`public/native/25_pseudonym.js`, SHA-Pin in `scripts/run-ki-auftrag-tests.mjs`) + Namen aus der Akte
  (Personen, Firmen, Objekte, Vertragsnummern, Empfänger) + Namensmuster aus BookLedgerPro (`lib/namensmuster.ts`) + Anschrift, PLZ/Ort,
  Telefon mit Leerzeichen, Kennzeichen, Versicherten-/Vertragsnummern (`lib/ki-auftrag.ts`). Vorschau „Das sieht die KI“, bei Klartext-Rest geht nichts hinaus.
- Öffnen: ChatGPT `chatgpt.com/?q=` und Claude `claude.ai/new?q=` mit Text, Claude Code über die Zwischenablage; gemerkte Sitzung je Seite und KI
  (nur https-Link der gewählten KI). Rückweg: Antwort einfügen → echte Angaben einsetzen (nur auf dem Gerät) → Kopieren oder in die Eingangszentrale.
- ⚠ Grenzen: **Bilder und gescannte Seiten ohne Textebene gehen noch nicht mit** (kein OCR in der Familienakte; Schwärzen im Bild ist der nächste
  Schritt, siehe Sitzung F). Die Zuordnung Platzhalter → Klartext lebt nur bis der Tab zu ist (sessionStorage). Ein automatischer Rückweg aus der
  KI-Sitzung ist ohne Schnittstelle nicht möglich: die Antwort wird eingefügt. Namen in GROSSBUCHSTABEN und Nachnamen ohne Anrede erkennt das Muster nicht.
  Am Tablet und mit einer echten KI nicht gemessen.

## Sitzung F (neu, Klaus 2026-10-31): Workflow PDF in der Familienakte

Klaus: „scanne ich in der Familienakte Dokumente ein, die ausgefüllt werden müssen … das komplette Programm von Workflow PDF … Felder erkennen mit
oder ohne KI … beschriften … wieder zurücksenden mit Unterschrift“.
- Vorbild und Quelle: Workflow-PDF (`assets/scanner.js`, `scan-bild.js`, `erkennung.js`, `export.js`, `html-export.js`, `blatt.js`, `uebersetzung.js`,
  `eingang.js`, `reinigung.js`, pdf-lib/fontkit/Noto, `vendor/scanic`, Texterkennung `vendor/tesseract`) — **byte-1:1 kopiert und gepinnt**, wie in
  BookLedgerPro (`assets/wfpdf/HERKUNFT.json`, `tools/wfpdf-nachziehen.mjs`) und den WorkFlohs (`werkzeug.js` als Klebstoff). Hier ein eigener
  Klebstoff für React.
- Weg: Unterlage in der Akte → „Ausfüllen“ → Felder erkennen (offline, auf Wunsch mit KI über den KI-Weg oben, unkenntlich) oder selbst setzen
  (Text, Datum, Kästchen, Unterschrift) → ausfüllen → festes / ausfüllbares PDF als **neue** Unterlage neben dem Original (Original bleibt) →
  Teilen/Senden. Vorlage zum späteren Ausfüllen merken („muss noch ausgefüllt werden“ als Status, erscheint im Cockpit).
- Mit dabei: Scanner (Foto → PDF, Ecken, Filter, Texterkennung → **damit gehen dann auch Scans unkenntlich an die KI**), Dateien auswählen/umbenennen.
- Offen für Klaus: Feldnamen aus der Akte vorbelegen (Name, Anschrift, Geburtsdatum der gewählten Person)? Unterschrift einmal speichern (verschlüsselt im Tresor)?

Geprüft am 2026-10-31 (Stand `cdcd3b4`): Aktualisieren oben, Mycel, Chefcode, Überall suchen und Briefkopf sind hier noch nicht gebaut; die Themen (Lebensbereiche) schon. Es gelten die Regeln dieses Repos (Oberfläche des Freundes bleibt,
sichtbare Änderungen nur mit Klaus' Ja je Punkt, Beispieldaten erfunden, kein Release ohne sein Wort).

## Startauftrag zum Einfügen

```
Familienakte ins Netz: zuerst BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md lesen (Sitzung B), dazu CLAUDE.md und BRIEF_ABSCHLUSS_2026-10-29_FASSUNG-2.28.3-UND-ABGLEICH.md hier.
Repos: Meine-Familienakte, Privat-Brain-Pro (Bausteine), Sage-Protokol (Kanon-Module, nur lesen/kopieren). Branch wie vorgegeben.
Aktualisieren-Knopf oben, Mycel, Chefcode, Überall suchen. Oberfläche des Freundes nur mit meinem Ja je sichtbarer Änderung.
Kein Release ohne mein Wort, keine Schlüssel/PINs/Chefcodes in Dateien oder im Chat, Kanon-Module byte-1:1.
Am Ende Abschlussbrief mit Startauftrag.
```
