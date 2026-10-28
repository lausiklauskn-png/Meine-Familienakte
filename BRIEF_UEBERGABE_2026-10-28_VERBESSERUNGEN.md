# Brief an die parallele Bau-Sitzung: Verbesserungen aus der Repo-Analyse übernehmen

Datum: 28.10.2026. Von: Analyse-Sitzung (PR #8). An: die Sitzung, die gerade nach
`BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md` baut (Internetschalter, PWA, APK, Windows).

## Worum es geht

Ich habe das Repo auf dem Stand `main` (Commit 22d0b40, Version 2.28.1) vollständig
durchgesehen: Code, Lighthouse gegen den Produktionsbuild, Playwright-Rundgang,
Bundle-Analyse. Das Ergebnis ist eine priorisierte Vorschlagsliste ohne Code:

**`docs/VERBESSERUNGSVORSCHLAEGE_2026-10-28.md`** (Branch `claude/repo-audit-suggestions-5tblkn`,
PR #8, Entwurf). Bitte diese Datei zuerst ganz lesen. Dieser Brief sagt nur, wie du damit
umgehen sollst, und wiederholt sie nicht.

Du darfst die Liste **übernehmen, selbst umsetzen, umordnen oder begründet verwerfen**.
Sie ist ein Vorschlag, kein Auftrag von Klaus. Wo du anders entscheidest, schreib einen
Satz dazu in den Abschluss-Brief, damit Klaus es nachlesen kann.

## Wie das zu deinem Bauauftrag passt

Dein Auftrag (Teil 2 des Sitzungsbriefs) ist: Internetschalter, PWA, APK, Windows. Die
Analyse ändert daran nichts, aber sie zeigt Dinge, die du **vor** oder **während** des
Baus mitnehmen solltest, weil sie sonst in drei Hüllen dreifach ausgeliefert werden.

**Vor dem ersten Hüllen-Build (klein, je ein eigener PR oder gesammelt in einem):**

1. **A1 Systemprüfung rot im Produktionsbuild.** Selbsttests in `app/local-vault.ts`
   (ab Zeile 1867) und `lib/family-assistant.ts` (Zeile 195) prüfen den eigenen Quelltext
   per `toString().includes(...)`. Der Build benennt Funktionen um, deshalb meldet die
   eingebaute Abschlussprüfung in jeder gebauten Fassung ROT. Das würde in PWA, APK und
   Windows sofort auffallen. Diese Prüfpunkte entfernen oder durch Verhaltenstests ersetzen,
   `npm run check` entsprechend anpassen (nicht abschalten).
2. **A7 Navigation läuft über den Rand** bei 1024 bis 1366 px Breite (`.nav-cluster`).
   Das ist die normale Notebook-Breite und wird in der Windows-App als Erstes sichtbar.
3. **A8 pdf.js vom CDN** (`app/file-viewer.tsx` Zeile 49). Dein Internetschalter
   (Standard: aus) würde die PDF-Vorschau sonst komplett abschalten. pdf.js als Paket
   einbauen, Worker lokal. Das steht auch schon in den gemeinsamen Grundsätzen deines Briefs.
4. **A11 ErrorBoundary** in `src/main.tsx`. In einer APK oder Windows-App gibt es keine
   Adressleiste zum Neuladen; eine weiße Seite ist dort eine tote App.
5. **B3 Reste der Vorgänger-App:** „Ausloggen“ ohne Login, leere Upload-Stubs
   (`app/browser-uploads.ts`, `fetch(item.downloadUrl)`), `"use client"`, `pnpm` als
   Testbefehl. Beim „Ausloggen“ bitte Klaus fragen, ob der Knopf bleiben soll (Wortlaut-Regel),
   die Stubs können weg.
6. **D3 Node-Version:** `engines` auf `>=22.18.0` und README anpassen, sonst laufen die
   Prüfskripte in deiner CI nicht (Type-Stripping).

**Beim Bau der Hüllen gleich richtig machen:**

- **E1 Code-Splitting:** `React.lazy` für Systemprüfung, Benutzerabnahme, Hilfe,
  Versionshistorie, Scan-Dialog, Dateivorschau; React und lucide als Vendor-Chunk. Der
  Service Worker cacht dann kleine Teile statt ein 1,08-MB-Paket bei jedem Update.
- **E6 Manifest:** PNG-Symbole 192/512 und `maskable`, `apple-touch-icon`,
  `<meta name="color-scheme">`. Steht in deinem Brief, hier nur die Bestätigung, dass es fehlt.
- **E2 Start:** Die Beispielfamilie braucht beim ersten Start rund 6 Sekunden. In einer APK
  wirkt das wie ein Hänger. Startbild oder Skelett zeigen, Beispielfamilie im Hintergrund
  oder auf Knopfdruck anlegen.
- **B2 Entwicklungswerkzeuge** („Automatische Testumgebung“, Windows-Diagnose mit Pfad
  `G:\01GPT-SOFTWARE\…`, „Website-Version 40“): in ein eigenes Modul, das nur im
  Entwicklungsmodus geladen wird, oder hinter einen Expertenschalter. Nicht in die APK.
- **D1 Werkzeuge:** Wenn du ohnehin `.github/workflows` für APK und Windows anlegst, nimm
  einen Workflow dazu, der bei jedem PR `typecheck`, `check`, Lint und Build ausführt.
  ESLint (`typescript-eslint`, `react-hooks`, `jsx-a11y`) und Prettier dazu.

**Datensicherheit (A2 bis A6, B1), eigener PR, vor der APK:**

Stiller Wechsel OPFS auf IndexedDB, Lesen außerhalb der Schreibsperre, Stammordner-Wahl,
Schreibreihenfolge ohne Rollback, große Dateien komplett im Speicher. Auf dem Handy mit
wenig Speicher und einem App-Speicher statt OPFS sind das die Dinge, die Daten verlieren.
Mindestens: Speicherwahl merken und melden, Lesen und Schreiben gemeinsam sperren,
Web Locks API gegen zwei Tabs. Verschlüsselung (B1) ist eine Entscheidung von Klaus,
bitte fragen, nicht raten.

**Nach den Hüllen oder in einer späteren Sitzung:**

C1/C2 (Aufteilung der beiden Riesendateien), C4 (Routing), C5 (Dialoge), F (Kontraste,
Schriftgrößen, Touch-Ziele), G (Menü-Duplikate, Begriffe, Toasts, Startseite),
H (Nachtmodus). Diese Punkte sind groß oder berühren die Gestaltung, siehe nächster Abschnitt.

## Regel „Gestaltung und Wortlaut bleiben“

Dein Brief sagt: Design, Aufbau und Wortlaut der Oberfläche des Freundes bleiben. Einige
Vorschläge der Liste widersprechen dem (Menü-Duplikate entfernen, Begriffe vereinheitlichen,
Schriftgrößen anheben, Startseite entrümpeln, Nachtmodus). **Die Regel gilt weiter.**
Deshalb:

- Umsetzen ohne Rückfrage: alles, was unsichtbar ist (A, B2, B3-Stubs, C, D, E) und
  Barrierefreiheit, die nichts am Aussehen ändert (Beschriftungen, `aria`-Attribute,
  Fokusstile, Tabellen-`caption`).
- Vor dem Umsetzen Klaus fragen, mit einem Satz je Punkt: Kontraste und Schriftgrößen (ändert
  das Aussehen leicht), Menü-Duplikate, Begriffe, Toasts, Startseite, Löschdialog mit
  Schlüsselwörtern, Nachtmodus. Klaus hat zum Design gesagt, es sei „so einigermaßen in
  Ordnung“. Das ist kein Nein zu Verbesserungen, aber auch kein Ja.
- Nachtmodus: Der Farb-Token-Umbau (Abschnitt H, Schritt 1) ändert nichts am hellen Aussehen
  und kann ohne Rückfrage gemacht werden, wenn Zeit ist. Dunkle Werte und Schalter erst nach
  Klaus’ Ja.

## Zahlen zum Festhalten (Ausgangslage, damit du Fortschritt messen kannst)

| Messwert (Produktionsbuild) | Stand 28.10.2026 |
| --- | --- |
| Lighthouse Handy: Leistung / Barrierefreiheit / Best Practices / SEO | 90 / 91 / 100 / 91 |
| Lighthouse Desktop | 100 / 91 / 100 / 91 |
| JavaScript | 1 Paket, 1,08 MB, 306 KB gzip, 202 KB beim Start ungenutzt |
| davon `app/health-portal.tsx` | 413 KB |
| CSS | 141 KB, 27 KB gzip, rund ein Viertel tot |
| Erster Start bis Beispielfamilie steht | rund 6 s |
| Eingebaute Systemprüfung im Build | ROT (4 offene Punkte), im Dev-Modus grün |
| `npm run check`, `tsc --noEmit`, `vite build` | grün |

Lighthouse selbst kannst du so wiederholen (Chromium liegt unter `/opt/pw-browsers/chromium`
in der Cloud-Sitzung): `vite preview` starten, dann
`npx lighthouse http://127.0.0.1:4173/ --chrome-flags="--headless --no-sandbox"`.

## Was nicht passieren darf (gilt zusätzlich zu deinem Brief)

- Prüfpunkte der Systemprüfung nicht einfach auf „bestanden“ setzen, damit sie grün wird.
  Entweder echter Test oder weg.
- Die Vorschlagsliste nicht als Pflichtenheft abarbeiten und dabei den Bauauftrag liegen
  lassen. Reihenfolge: Sofortfixes (oben), dann dein Teil 2, Datensicherheit dazwischen.
- Nichts aus Abschnitt G oder H sichtbar ändern, ohne Klaus zu fragen.
- Keine neuen Abhängigkeiten ohne Grund. Vitest, ESLint, Prettier und pdf.js als Paket sind
  begründet; Routing-Bibliotheken oder UI-Frameworks nicht.

## Abgabe

- Jeder Punkt, den du umsetzt, als eigener kleiner PR oder gebündelt nach Abschnitt (A, D,
  E), mit Verweis auf die Nummer aus der Liste im PR-Text.
- Im Abschluss-Brief eine Tabelle: Nummer, umgesetzt / verworfen / an Klaus, ein Satz warum.
- PR #8 (die Liste) kannst du zusammenführen, sobald du sie gelesen hast; sie ändert keinen
  Code. Oder du nimmst die Datei in deinen Branch und schließt #8.

## Startauftrag zum Einfügen

```
Zusätzlich zu deinem laufenden Bauauftrag (BRIEF_SITZUNG_ANALYSE-UND-ERSTBAU.md):

Lies BRIEF_UEBERGABE_2026-10-28_VERBESSERUNGEN.md und danach
docs/VERBESSERUNGSVORSCHLAEGE_2026-10-28.md (beide auf Branch
claude/repo-audit-suggestions-5tblkn, PR #8). Du darfst die Vorschläge übernehmen,
selbst umsetzen, umordnen oder begründet verwerfen.

Reihenfolge:
1. Sofortfixes vor dem ersten Hüllen-Build, eigener PR: A1 (toString-Selbsttests, Systemprüfung
   ist im Build rot), A7 (Navigation läuft über den Rand), A8 (pdf.js als Paket statt CDN),
   A11 (ErrorBoundary), B3 (Stubs und Next.js-Reste; „Ausloggen“ nur nach meinem Wort),
   D3 (Node >= 22.18).
2. Datensicherheit A2 bis A6 als eigener PR vor der APK. Verschlüsselung (B1) erst nach
   meiner Entscheidung.
3. Beim Bau der Hüllen: Code-Splitting (E1), Manifest-Symbole (E6), Startbild statt
   6-Sekunden-Hänger (E2), Entwicklungswerkzeuge aus dem Produkt (B2), CI mit Lint (D1).
4. Alles Sichtbare aus Abschnitt F (Kontraste, Schriftgrößen), G (Menü, Begriffe, Toasts,
   Startseite) und H (Nachtmodus) nur nach meinem Ja; frag mich je Punkt mit einem Satz.
   Den Farb-Token-Umbau (H, Schritt 1) darfst du ohne Rückfrage machen, er ändert nichts am
   hellen Aussehen.

Regeln bleiben: Gestaltung und Wortlaut der Oberfläche bleiben, Prüfungen nie abschalten,
nichts auf „bestanden“ setzen, keine Schlüssel im Repo, nichts veröffentlichen ohne mein Wort.
Im Abschluss-Brief: Tabelle Nummer / umgesetzt / verworfen / an mich, je ein Satz warum.
```
