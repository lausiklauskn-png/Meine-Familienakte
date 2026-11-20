# Abschlussbrief 20.11.2026: Knopf „Aktualisieren“ (⟳) in der PWA – Sitzungsende

Diese Sitzung (20.11.) hat nacheinander gebaut und ausgegeben: Fuß flach, Kalender je Person (2.28.76, Brief
`docs/briefe-archiv/BRIEF_ABSCHLUSS_2026-11-20_KALENDER-JE-PERSON-2.28.76.md`) und zuletzt den Knopf ⟳ für die Web-App.
Gleichzeitig im Repo Private-Akte: 0.9.4 (Steckbrief) und 0.9.5 (Klon 2.28.76), beide veröffentlicht.

## Erledigt zuletzt (Klaus 20.11.: „Aktualisierungsbutton, da ich nicht immer Hard Reload machen kann“; „bitte veröffentlichen … in den PWAs, die wir hier bearbeitet haben“)

1. **⟳ im Kopf der PWA** (`PwaAktualisieren` in `app/update-fahne.tsx`, Klasse `pwa-aktualisieren`): Tipp = `FamilienakteApp.aktualisieren()`
   (Service Worker holt die neue Fassung und lädt neu, sonst „Du verwendest die aktuelle Fassung …“). In Android/Windows nicht da
   (dort Versionszeile und Fähnchen).
2. **Am Handy in der Demo hinter „‹“** – die CI-Probe `demo-tresor-status` zeigte: neben dem roten DEMO-Knopf wurde „FAMILIENAKTE“
   abgeschnitten (`app/globals.css`, Regel unter `max-width: 900px`). Sonst steht ⟳ auch am Handy direkt im Kopf.
3. **PR #226** squash auf `main`, über Pages online. Fassung nicht erhöht (kein Android-/Windows-Lauf nötig).
4. Private Akte: ⟳ neben der Fassungsmarke (PR #79 dort), ebenfalls online.

## Proben
UI `pwa-aktualisieren` 5, `demo-tresor-status` 10, `neugestaltung-kopf`, `uebersichtlich`, `kurzhinweise`, `update-fahne-auto` grün;
CI `pruefung`, `android`, `windows` grün. **Am Gerät ungeprüft.** Wirkt erst, nachdem Klaus die PWA einmal auf die alte Art neu lädt.

## Offen
- Kalender je Person am Tablet (2.28.76): Rückmeldung von Klaus steht aus.
- Abgleich der Termine zwischen den Handys (Stufe 3) – nicht gebaut.
- PWA: „So fängst du an“ zeigt den Schritt Speicherort noch offen (eigener Speicher je App; die APK hat ihn schon erledigt) – kein Fehler,
  aber verwirrend; ggf. nur in der PWA anders erklären.

## Stundennachweis
Sitzung 20.11.2026 gesamt rund 6 Stunden (geschätzt): Steckbrief/0.9.4 und Klon 0.9.5 (Private Akte), Fuß flach, Kalender je Person mit
Vorschau, Bau, Proben, CI-Fixes, Ausgabe 2.28.76, ⟳ in beiden PWAs mit CI-Fix.

## Startauftrag
```
Lies CLAUDE.md der Familienakte und BRIEF_ABSCHLUSS_2026-11-20_PWA-AKTUALISIEREN.md. Klaus' Rückmeldung vom Tablet zu 2.28.76
(Kalender je Person, flacher Fuß) und zum Knopf ⟳ in der PWA einarbeiten. Dann Stufe 3: Abgleich der Termine zwischen den Handys der
Familie – über den vorhandenen Netz-/Cloud-Ordner-Abgleich, nur Termine (deadline/task mit fuer/von/vorlaeufig/privat/antworten), von
selbst, sobald sich die Geräte sehen; erst als Vorschau zeigen. Nächste freie Fassung 2.28.77. Freibrief: tokensparend, Fragen selbst
nach Logik und Nutzerfreundlichkeit beantworten, zum Schluss Abschlussbrief mit Startauftrag.
```
