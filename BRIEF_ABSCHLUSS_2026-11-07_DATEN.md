# Abschluss 07.11.2026: Sitzung 2 (Daten) – Fassung 2.28.34

Startauftrag aus `docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-07_HILFE.md`. Bau freigegeben (Klaus 07.11.), Ausgabe am Ende der
Sitzung; Klaus während der Sitzung: „Weiter, nach grüner CI zusammenführen und ausgeben.“ PR #119 (je Paket ein Commit, ein PR,
weil nur ein Sitzungszweig), zusammengeführt als fbd6325.

## Was getan wurde

- **P4 Gerätegrenze und Verkleinern (Punkt 1):** sichere Dateigröße aus der vorhandenen Geräteprüfung (`ProGeraet.messen`):
  unter 3 GB 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB, ohne Messwert 20 MB, Pro-Tresor höchstens 20 MB (`lib/geraete-grenze.ts`).
  Ansage „Die Datei hat X MB. Dieses Gerät schafft sicher Y MB.“ nur mit **Verkleinern** · **Abbrechen**. Verkleinern: Qualität
  80/72 %, dann Kante in Schritten bis 3508 px (300 dpi A4); Foto-PDF ohne Textebene neu mit 300 dpi; Gegenprobe mit Tesseract
  auf Original und kleiner Fassung, unter 98 % der Wörter verworfen; Notiz „verkleinert von X MB, Text geprüft“ (`app/verkleinern.ts`).
  Dateiausgabe 100 MB (Android stückweise wie bisher, Windows neu stückweise). Hilfe-Thema „Datei zu groß“.
- **P5 Vollsicherung Android und Windows (Punkt 2a):** frei gewählter Ordner über den nativen Dialog – Android
  `FamilienakteOrdnerPlugin` (Speicherzugriff, nutzt `SafAblage` unverändert), Windows `FamilyFolders.java` in der Java-Engine
  (Swing-Dialog, Rust-Freigabeliste). Die Seite bekommt nur eine Kennung; `app/nativer-ordner.ts` macht daraus einen Ordner-Handle,
  sodass Vollsicherung, Export und Wiederherstellungstest unverändert laufen. Android legt die eigene APK daneben, Windows einen
  Lies-mich mit Download-Adresse und SHA-256 aus dem unterschriebenen Update-Feed (`fa_setup_angaben`, nur für genau diese Fassung).
  Kein allgemeines Löschen: nur Dateien, die die App in dieser Sitzung selbst angelegt hat (die bestehende Windows-Probe gegen
  `dateiLoeschen` bleibt unverändert).
- **P6 Sicherung einlesen (Punkt 2b):** Knopf im Sicherheitscenter, Probe ohne Schreiben (Register- und jede Datei-Prüfsumme),
  nur in eine leere Akte, nie überschreiben, Register zuletzt (`sicherungProben`/`sicherungEinlesen`, `app/sicherung-einlesen.tsx`).
  Vergleich mit BookLedgerPro und Private Brain Pro nur gelesen: `docs/SICHERUNG-VERGLEICH.md`.
- **P7 Demo als Kopie (Punkt 3):** mit eigenen Daten kopiert der Start Register und Dateien in den Demo-Bereich (nur im
  Dateispeicher; nutzt der Browser nur IndexedDB, Beispielfamilie). Original unverändert, kein Pro-Tresor in der Demo. Menü
  „DEMO ▾“ bei der Kopie: „Übernehmen …“ mit Liste „Was ändert sich?“ (entfernt · geändert · neu, Kalender markiert), gesperrt,
  wenn die Akte seit dem Start geändert wurde; Registersicherung vorher, keine Originaldatei gelöscht. Eine passende Demo läuft
  beim nächsten Start weiter wie bisher.
- **Punkt 10:** nur die Vorschlagsrunde in `docs/vorschau/daten-2.28.34.html`
  (https://claude.ai/artifact/2wECZ4S96eYLgL9mKkXhDN). Nichts gebaut.
- **Fassung 2.28.34**, Versionshistorie, Knopf „Neu“ mit „Sichern auch am Handy“.

## Geprüft

- Neue Proben: `scripts/run-daten-tests.mjs` (in build/check), UI `verkleinern` 5/0, `vollsicherung` 6/0,
  `sicherung-einlesen` 8/0, `demo-kopie` 7/0; Java-Engine-Probe (Ordner, Pfadschutz, Stücke, Ausgabe 21 MB, fremde Datei bleibt);
  Rust `update` 10/10 lokal (eigenes Setup nur für genau diese Fassung).
- Angepasst auf die neue Regel (mit eigenen Daten Kopie): `demo-workspace` (beide Speicherarten 15/0), `knoepfe-start` 35/0,
  `knoepfe-leer` 25/0; `dateieingang` 76/0, `neu-knopf` 15/0, `knoepfe-sicherheit` 33/0. Lokal grün auch Android-Hülle,
  Windows-Hülle, PWA, Hilfe-Ordnung/-Gestaltung, Aktensicherung, Demo-Status.
- CI auf #119 (5841f18): 7/7 grün (pruefung, webview, android, windows, transport, product 31/35).
- Unterwegs rot und behoben: Lint (unbenutzter Import), Windows-Probe `nur_tresoraktionen` (dateiLoeschen → eigeneDateiEntfernen),
  Demo-Proben (alte Regel), Demo-Kopie im IndexedDB-Speicher.

## Ausgabe

AUSGABE_PLATZHALTER

## Nicht geprüft / offen

- Kein Gerät: Android-Ordnerdialog und APK beilegen, Windows-Ordnerdialog und Lies-mich, Verkleinern an echten Kamerafotos
  (Kleingedrucktes), Einlesen nach echter Neuinstallation, Demo-Kopie mit großem Bestand (Speicherbedarf verdoppelt sich).
- Android-Plugin nur in der CI übersetzt; lokal kein Android-SDK.
- Gegenprobe der Texterkennung lief an einem erfundenen Textfoto (16 MB → 7,8 MB, Text geprüft); OCR auf 4600×6500 kann am
  Handy lange dauern.
- Nicht gebaut: Einlesen in eine volle Akte (Zusammenführen), Erinnerung „lange nicht gesichert“, Ränder abschneiden beim
  Verkleinern, Punkt 10 (Fragen u–z an Klaus).

## Stundennachweis

Spanne aus Reflog-, Commit- und Laufzeiten, Obergrenze; Pausen nicht abgezogen, Klaus' eigene Angabe geht vor. Zeiten in MEZ.

STUNDEN_PLATZHALTER

## Startauftrag zum Einfügen

```
Familienakte – Sitzung 3 (E-Mail), Brief vom 07.11.2026.
Repo lausiklauskn-png/Meine-Familienakte, frisch von origin/main, Zweig wie für die Sitzung vorgegeben.
Zuerst lesen: CLAUDE.md, BRIEF_ABSCHLUSS_2026-11-07_DATEN.md, docs/PLAN_2026-11-07.md (Punkt 8, Wege A–H, Frage r).
Stand: 2.28.34 auf main und ausgegeben (APK, PWA, Windows); nächste freie Fassung 2.28.35.
Erst Plansitzung: Private Brain Pro holen (add_repo) und dessen E-Mail-Weg beschreiben, gegen die Familienakten-Regeln abgleichen
(nichts geht still hinaus; Entwurf, Prüfung, ausdrücklicher Befehl; Gesundheitsdaten neutral; keine Schlüssel in Dateien;
Speicherwege wie in CLAUDE.md), Wege bei Google und Microsoft nachprüfen, dann HTML-Vorschau. Erst nach Klaus' Ja bauen:
A sichtbar (Teilen), B Senden über die Mail-App, dann C Microsoft; D/E nur nach Kostenentscheidung, G nicht.
Offen aus Sitzung 2: Punkt 10 (Abgleich zwischen Geräten) – Klaus' Antworten auf u–z in docs/vorschau/daten-2.28.34.html abwarten.
Sichtbare Änderungen erst als HTML-Vorschau zeigen. Je Paket ein Commit; keine Prüfungen abschalten.
Nicht: Schlüssel/Tokens in Dateien oder Chat, Forschung im Repo (nur KimHub).
Am Ende Abschlussbrief mit Stundennachweis und KimHub-Eintrag.
```
