# Abschluss 16.11.2026: Übernahme aus dem Datei-Organizer, Fassung 2.28.71

Sitzung „Datei-Organizer“ (sie hat auf Klaus' Wort auch diese Ausgabe gemacht). Abgestimmt mit der Sitzung Private Brain Pro über
`BRIEF_ABGLEICH_2026-11-16_PRIVATE-BRAIN-PRO.md`.

## Was jetzt da ist
- **2.28.71 ausgegeben** (Android, Windows, Web-App über Pages), Nachweis `docs/VEROEFFENTLICHUNG-2.28.71.json`. Nicht erneut ausgeben;
  nächste freie Fassung 2.28.72.
- **Übernahme aus dem Datei-Organizer (#203):** Eingangsordner mit `organizer-index.json` → seine Angaben als Vorschlag im Prüf-Fenster
  (vorhandene Karte „Vorschläge aus …“, kein neuer Knopf); der Index ist keine Unterlage; Doppelte laut Organizer bleiben im Ordner;
  Gesperrtes kommt mit Warnung. `lib/organizer-uebernahme.ts`, Anschluss `scanSelectedInbox`.
- **Vorsortierung aus Private Brain Pro und Kern @ `e4205fa` (#199, Nachbarsitzung)**, **Discovery @ `b3517cc` (#200)**.
- Landkarte der App: Kasten „Aus dem Datei-Organizer“. Geschenkbox Version 36.
- Pakete sind mit Discovery deutlich größer: APK 82,0 MB, Windows 96,5 MB.

## Grenzen
- Übernahme: nur Dateien direkt im Ordner (Name + Größe); die Frist des Organizers steht im Hinweis, sie wird nicht als Frist angelegt.
- Nichts am Gerät geprüft (Liste unter „Offen“ in `CLAUDE.md`). Meldungen der Vorsortierung nur Deutsch, von Klaus nicht gesehen.

## Wie es weitergeht
Die offenen Punkte stehen im Repo Datei-Organizer: `docs/BRIEF_SITZUNG_2026-11-16_OFFENE-PUNKTE-LANDKARTE.md` (Freibrief von Klaus).

## Startauftrag zum Einfügen
```
Repo Datei-Organizer (dazu Meine-Familienakte, BookLedgerPro, BookLedger-Basic). Lies zuerst CLAUDE.md und
docs/BRIEF_SITZUNG_2026-11-16_OFFENE-PUNKTE-LANDKARTE.md, dann in Meine-Familienakte CLAUDE.md,
BRIEF_ABSCHLUSS_2026-11-16_UEBERNAHME-ORGANIZER-2.28.71.md und BRIEF_ABGLEICH_2026-11-16_PRIVATE-BRAIN-PRO.md.
Freibrief von Klaus: die offenen Punkte der Reihe nach selbstständig umsetzen, eigene geprüfte PRs zusammenführen.
Beginne mit Punkt 1 (Kern in BookLedgerPro nachziehen), dann Punkt 2 (Übernahme: Unterordner, Frist als Vorgabe).
Nicht: App-Ausgaben ohne Klaus' Wort, neue Filme, byte-gleiche Bausteine von Hand ändern, echte Daten im Repo.
```
