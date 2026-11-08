# Abschluss 07.11.2026: Sitzung 4 (Hilfe als Baum, Landkarte der App) – Fassungen 2.28.36 und 2.28.37

Startauftrag aus `BRIEF_ABSCHLUSS_2026-11-07_EMAIL.md` (jetzt `docs/briefe-archiv/`). Erst Plan- und Vorschaurunde, parallel zur
Ausgabe 2.28.35 durch Sitzung 3 (per Nachricht abgestimmt: nichts ausgeben, keine Fassungsdateien, bis Sitzung 3 fertig war).
Klaus: „Alles wie vorgeschlagen, bauen sobald Sitzung 3 fertig ist“, danach „PWA, APK und Windows mit der nächsten Nummer“,
dann „in allen Abschnitten nachziehen“ und „danach automatisch weiterbauen, Forschungseinträge, Brief an die neue Sitzung,
Apps veröffentlichen“.

## Was getan wurde

- **Vorschau** `docs/vorschau/hilfe-baum-2.28.36.html` (https://claude.ai/artifact/JwEDVRstiyNsa7QV5hPvyC), Fragen A–J,
  von Klaus wie vorgeschlagen entschieden. Bestand vorher gemessen: 59 Hilfe-Themen, 6 mit Bild, rund 25 reiner Fließtext.
- **2.28.36** (#123): Landkarte der App ganz oben in der Hilfe (`app/app-landkarte-hilfe.tsx`, Daten `lib/app-landkarte.ts`,
  Stand je Kasten `lib/app-stand.ts` wie status.json; rot „einschalten“ wird grün, wenn auf dem Gerät eingerichtet). Goldrand
  für Geändertes bis zum Antippen, höchstens 14 Tage; am Handy als Liste mit Umschalter Karte · Liste. `app/landkarte.tsx`
  rechnet beim Aufklappen neu (ResizeObserver). E-Mail-Hilfe nimmt Mail-Wege und Stand aus derselben Liste.
  Welle 1: zehn Themen als Bild mit höchstens drei Merkpunkten, alter Text unter „Ausführlich“ (`app/hilfe-bilder.tsx`).
  **Vollbild und Drehen:** Android immer Vollbild (Leisten per Wischen), `screenOrientation="fullUser"` (Drehsperre gilt);
  Windows startet maximiert, F11 (`app/vollbild.ts`); Web-App `orientation: any`, bleibt standalone (s. Grenzen).
- **2.28.37** (#125): Vorschau `docs/vorschau/hilfe-alle-2.28.37.html` (https://claude.ai/artifact/5JcY8w8yTSMQW6vSM8uvAo).
  Alle übrigen 33 Themen (auch Fachliches) als Ablaufbild, Karte (`DatenmodellKarte`) oder Kastenreihe (`KastenReihe`),
  höchstens drei Kernpunkte mit dem Wichtigsten **fett**, langer Text unter „Ausführlich“; 14 kurze Themen mit Ablaufbild.
  **Vorschaufenster „Wo in der App?“** (`app/hilfe-vorschau.tsx`): Maus kurz auf das Thema oder ▣; Skizze aus gemessenen
  Kartentiteln (`lib/hilfe-seiten.ts`), Stelle rot, „Hingehen ›“ mit rotem Rahmen, Esc/✕. **„?“-Erklärfenster** bis 560 px
  breit und 75 % hoch, **„Neu“** ab Tablet bis 960 px quer, Einträge nebeneinander (Klaus: „nicht alles angezeigt“).
- Nachweise `docs/VEROEFFENTLICHUNG-2.28.36.json` und `-2.28.37.json`.

## Geprüft

- Lint 0 Fehler (13 alte Warnungen), `npm run build`, `npm run check` (neu `scripts/run-landkarte-tests.mjs`) grün.
- UI neu: `app-landkarte` 45/0, `hilfe-alle` 30/0. Angepasst an den neuen Aufbau (inneres „Ausführlich“, Themenzahl):
  `hilfe-ordnung`, `neu-knopf`, `ruecksprung`, `hilfe-gestaltung`, `hilfe-zu`; dazu grün: `email-hilfe`, `kalender`,
  `mein-kalender`, `aktensicherung`, `vollsicherung`, `pwa`, `android`, `kurzhinweise`, `rundgang`, `knoepfe-*`,
  `zurueck-und-hinweise`, `demo-*`.
- CI #123 (810fcfa) und #125 (098661a) je 6/6 grün.
- Unterwegs rot und behoben: Emulator-Probe API 31/35 („foreground=android“, der einmalige Android-Hinweis zum Vollbild nimmt
  den Fokus; die Probe bestätigt ihn jetzt wie ein Nutzer); vier Proben mit Wählern, die das innere „Ausführlich“ mittrafen;
  Sprung auf Seitentitel rahmte das kleine „?“ (Seitentitel führen jetzt nur zur Seite).
- **Wichtig:** `step()` in `tests/ui/_harness.mjs` wertet einen zurückgegebenen Text als grün. Die eigenen neuen Proben nutzen
  jetzt `soll()` und scheitern echt; ältere Proben mit dem Muster `cond ? true : text` können Fehler übersehen (nicht geändert).

## Ausgabe

- **2.28.36**: APK `android-v2.28.36` (Lauf 42412087983), Windows `windows-v2.28.36` (Lauf 42412090280), beide `server=ja`;
  PWA Pages Lauf 144. Downloads anonym, SHA-256 = SHA256SUMS.
- **2.28.37**: APK `android-v2.28.37` (Lauf 42416890823), Windows `windows-v2.28.37` (Lauf 42416892756), beide `server=ja`;
  PWA Pages Lauf 146/147. APK `a1fa8b78…0198` (19 918 881 Bytes, innen 2.28.37 / fb48ddd), Einzeldatei `775a7e06…6e49`,
  Setup `f6f505b6…deb2` (34 096 839 Bytes), `latest.json` nennt 2.28.37. Nachweis `docs/VEROEFFENTLICHUNG-2.28.37.json`.

## Nicht geprüft / offen

- Kein Gerät: Vollbild und Drehen (einmaliger Android-Hinweis), F11, Landkarte als Liste am Handy, Vorschaufenster am Tablet
  (Tipp auf ▣), „?“ und „Neu“ in der neuen Breite.
- Web-App ohne echtes Vollbild: der gepinnte Baustein `public/native/installieren.js` erkennt nur `display-mode: standalone`
  als installiert. Änderung nur über seine Quelle (`native/HERKUNFT.json`).
- Vorschaufenster Weg B (echte Stelle mit Beispielfamilie) nicht gebaut – nur falls die Skizze zu abstrakt ist.
- Ältere UI-Proben auf `soll()` umstellen (siehe oben), damit sie nicht still grün melden.
- E-Mail: Entscheidungen von Klaus und Jens aus der E-Mail-Karte abwarten. Punkt 10 (Abgleich zwischen Geräten): u–z offen.
- Später: Landkarte für Rückmeldungen anderer Nutzer (nur Text annehmen, nichts ausführen).

## Stundennachweis

Spanne aus Sitzungsbeginn (Reflog 18:33 UTC), Commit- und Laufzeiten, Obergrenze; Pausen nicht abgezogen, Klaus' eigene
Angabe geht vor. Zeiten in MEZ.

| Block | von | bis | Dauer | Inhalt |
|---|---|---|---|---|
| 1 | 19:33 | 19:47 | 14 min | Lesen, Releases prüfen, Hilfe vermessen, Vorschau, Abstimmung mit Sitzung 3 |
| 2 | 19:47 | 20:14 | 27 min | Vollbild/Drehen in die Vorschau, Freigabe A–J, warten auf Sitzung 3 |
| 3 | 20:14 | 21:12 | 58 min | Bau 2.28.36, Proben, PR #123, Emulator- und Proben-Korrekturen |
| 4 | 21:12 | 21:55 | 43 min | Zusammenführen und Ausgabe 2.28.36, Vorschau und Bau 2.28.37 |
| 5 | 21:55 | 22:40 | 45 min | Nachweis 2.28.36, „?“ und „Neu“ breiter, Prüfungen, Zusammenführen #125 |
| 6 | 22:40 | 23:15 | 35 min | Ausgabe 2.28.37, Nachweis, Abschluss, KimHub |

Zusammen: 19:33 (Reflog) bis 23:15 = **3 h 42 min**.

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 5, Brief vom 07.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-07_HILFE-BAUM.md, docs/PLAN_2026-11-07.md (Punkt 10, „Weiter zu besprechen“).
Stand: 2.28.37 auf main und ausgegeben (APK, PWA, Windows; Nachweis docs/VEROEFFENTLICHUNG-2.28.37.json).
Erst die tatsächlichen Releases prüfen. Nächste freie Fassung 2.28.38.

Vorlagen (wiederverwenden, nichts doppelt bauen):
- Hilfe-Bausteine: app/hilfe-bilder.tsx (BildThema, KastenReihe, sprung), app/ablaufbild.tsx, app/landkarte.tsx,
  Vorschaufenster app/hilfe-vorschau.tsx mit Kartentiteln lib/hilfe-seiten.ts (Probe hilfe-alle prüft sie gegen die App).
- Stand der Landkarte: lib/app-stand.ts – bei jeder Fassung eintragen, was sich ändert (Goldrand zeigt es dem Nutzer).

Auftrag (erst Klaus fragen, was zuerst; sichtbare Änderungen erst als HTML-Vorschau):
1. Gerätetest-Rückmeldung zu 2.28.36/2.28.37 einarbeiten (Vollbild, Drehen, Landkarte, Vorschaufenster, „?“ und „Neu“).
2. Ältere UI-Proben von `cond ? true : text` auf soll() umstellen (step() wertet Text als grün) – eigener PR, Funde benennen.
3. E-Mail bauen, sobald Klaus' und Jens' Entscheidungen aus der E-Mail-Karte vorliegen: zuerst Anhang-Prüfung mit dateiPruefen,
   echtes PDF ohne Befund mit einem Tipp, Mail-App öffnen; danach Microsoft (Mail.Read/Mail.Send). Gmail-Abholen auslassen.
4. Punkt 10 (Abgleich zwischen Geräten) erst nach Klaus' Antworten auf u–z in docs/vorschau/daten-2.28.34.html.

Regeln: Je Paket ein Commit; Lint vor dem Push; keine Prüfungen abschalten. Codex-Durchsicht am PR auslassen.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag, KimHub-Eintrag.
```
