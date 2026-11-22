# Brief: Familienakte Sitzung B (Netz) und Veröffentlichung (Stand 2026-10-31 abends)

Vorgänger: `BRIEF_ABSCHLUSS_2026-10-31_AUSFUELLEN-SITZUNG-F.md` (Ausfüllen, gemergt als #32), Plan B im Ganzen:
BookLedgerPro `BRIEF_SITZUNG_PRO-UMBAU-14.md` (Abschnitt „Sitzung B“) und `BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md`.

## Klaus' Wort (2026-10-31): spätestens nach dieser Sitzung liegen die Fassungen online

> „Wichtig ist, dass spätestens nach der nächsten Sitzung die Dateien hochgeladen werden … sodass ich sie aktualisieren kann. Das ist wichtig,
> damit wir nicht hängen bleiben zwischendrin und ich notfalls prüfen kann, bevor das Limit aufgebraucht ist.“

Klaus' Nachtrag (2026-10-31): „Die App soll trotzdem funktionsfähig bleiben. Nicht, dass einfach veröffentlicht wird, wenn eine Arbeit
nicht abgeschlossen ist oder eine Gegenprobe … Der Plan ist, die App so zu gestalten, Stück für Stück, dass bevor mein Kontingent zu Ende
ist, ich sie benutzen kann und testen kann.“

Daraus folgt: **in Stücken bauen, und nur ein fertiges Stück wird veröffentlicht.**

**Wann ein Stück fertig ist** (alle Punkte, sonst wird es nicht veröffentlicht):
1. gebaut, mit eigener Probe, und die Gegenprobe (absichtlich kaputt → rot) gefahren;
2. `npm run build`, `npm run lint` und alle Oberflächenproben (`node tests/run-ui.mjs`) grün; CI grün;
3. was es vorher gab, geht weiter (Ausfüllen, Eingang, Cockpit, Aktualisieren);
4. Klaus hat jede sichtbare Änderung darin vorher bestätigt.

Dann: Merge → Fassung um eins erhöhen → Android und Windows auf den eigenen Server (server = ja) → Klaus sagen, was er prüfen soll.
**Ein angefangenes Stück wird nicht veröffentlicht**: es bleibt auf einem Zweig (oder hinter einem Schalter, der ab Werk aus ist und
nichts Sichtbares ändert). Geht das Kontingent mitten in einem Stück aus, liegt draußen die letzte fertige Fassung, und sie funktioniert.

**Die Stücke, in dieser Reihenfolge** (jedes für sich benutzbar, das kleinste zuerst):

| Stück | Inhalt | Fassung |
| --- | --- | --- |
| 0 | Heutiger `main` (Ausfüllen, Sitzung F — mit allen Proben fertig) veröffentlichen | 2.28.4 |
| 1 | „Überall suchen“ nur in der eigenen Akte (Dokumente, Memory, Vorgänge), ohne Netz | 2.28.5 |
| 2 | Mycel/SBKIM-Kanon einbauen, beim Laden nichts ins Netz, Verbinden nur auf Tipp | 2.28.6 |
| 3 | Chefcode (eigenes Netz) und „Überall suchen“ auch im eigenen Netz | 2.28.7 |
| 4 | Tresorordner-Anbindung — erst, wenn das Paket die Fächer hat (Pro-Umbau-Sitzung) | 2.28.8 |

Reicht die Zeit nur für Stück 0 und 1, ist das ein gutes Ergebnis. Ein Stück lieber kleiner schneiden als halb liefern.
⚠ Die **sichtbare** „Version 2.28.1“ (`APP_VERSION` in `app/health-portal.tsx`) bleibt (Oberfläche des Freundes), solange Klaus nichts
anderes sagt; erhöht wird `package.json` und Android `versionCode` (vorher die Releases lesen). Danach im Lauf-Log prüfen, dass
`aktuell-android.json`/`aktuell-windows.json` die neue Fassung nennen, und Klaus bitten, im Browser nachzusehen.

⚠ **CI braucht das öffentliche Repo** (privat: keine Freiminuten, Läufe brechen nach 3 s ab, auch Pages). Vor jedem Push und jedem Release
Klaus bitten, das Repo kurz öffentlich zu stellen; nach dem Merge laufen die Läufe auf `main` ebenfalls nur öffentlich (am 31.10. mussten
sie von Hand neu gestartet werden). Prüfen mit `curl -s -o /dev/null -w "%{http_code}" https://github.com/lausiklauskn-png/Meine-Familienakte` (200 = öffentlich).

## Wer baut was — Abgrenzung zur Sitzung „Pro-Umbau 14 nach A2“

Am 31.10. läuft parallel die Sitzung „Pro-Umbau 14 nach A2“ (Workflow PDF Pro, Tresor-Paket, Netz). Ihr Plan enthält auch die Familienakte.
Damit nichts doppelt entsteht:

| Teil | wer |
| --- | --- |
| Tresor-Paket: Fächer „Familienakte“ und „Eingang-Familienakte“ in `Fach.java` (Quelle Workflow PDF Pro, nachziehen in BLP/PB) | **Pro-Umbau-Sitzung** |
| Alles **in diesem Repo**: Mycel/SBKIM, Chefcode, „Überall suchen“, Anbindung an den Tresorordner | **diese Familienakte-Sitzung** |

**Zuerst nachsehen**, ob in `Meine-Familienakte` ein fremder offener Zweig oder PR liegt (`git fetch`, `list_pull_requests`) und was der
neueste BookLedgerPro-Brief sagt. Arbeitet dort schon jemand an der Familienakte: nicht doppelt bauen, Klaus fragen.

## Stand am 31.10. (gemessen)

- **Aktualisieren oben ist fertig** (#30): Knopf `aktualisieren-knopf` in der Kopfleiste, `FamilienakteApp.aktualisieren` in
  `public/native/familienakte-app.js` (Android/Windows über die Hülle, PWA über den Service Worker, nur bei Internet an). Aus Plan B gestrichen.
- **Nicht da:** Mycel/SBKIM, Chefcode, „Überall suchen“, Tresorordner-Anbindung.
- **Da:** 18 Lebensbereiche (`lib/family-categories.ts`), Internetschalter (`app/netz-schalter.tsx`), Unkenntlich-Weg (Modul 25 byte-1:1,
  `lib/ki-auftrag.ts`), Workflow-PDF-Kern byte-1:1 (`public/wfpdf/`).
- PRs #29 und #1 sind geschlossen (überholt), offen ist nichts.

## Sitzung B — was zu bauen ist

1. **Mycel/SBKIM:** Kanon-Module byte-1:1 aus Sage-Protokol (01, 02, 03, 04, 05b, 23, 23-UI; Liste und Fassung aus dem BLP-Plan), eigene
   Schublade `familienakte`, Pins wie `native/HERKUNFT.json`, Prüfung in `npm run check:herkunft`. Beim Laden geht **nichts** ins Netz
   (Internetschalter gilt), Verbinden nur auf Tipp.
2. **Chefcode** über den gemeinsamen Baustein `pro-chefcode` (Quelle Private Brain Pro, Fassung aus Sitzung A; Nachzieh-Werkzeug wie
   BookLedgerPro `tools/native/bedienung-nachziehen.mjs`). Keine Codes in Dateien oder im Chat.
3. **„Überall suchen“** über `pro-ueberall`; Quellen: Dokumente, Memory, Vorgänge. Geschützte Gesundheitsangaben nur datensparsam (wie im Cockpit).
4. **Tresorordner-Anbindung** (Fach „Familienakte“, Eingang „Eingang-Familienakte“), sobald das Paket die Fächer hat — Plan dazu in
   `docs/POSTFACH-UND-WERKZEUGE-PLAN.md`. Byte-gleiche Kopie des Pakets, nie nachbauen.

Jede sichtbare Änderung an der Oberfläche des Freundes **vorher** einzeln von Klaus bestätigen lassen (Knopf, Kasten, Menüpunkt).

## Noch offen von Sitzung F (Fragen an Klaus, nicht vergessen)

1. Direkter Einstieg „Formular scannen und ausfüllen“ ohne vorhandene Unterlage? 2. Gesundheitsunterlagen ausfüllbar? 3. Anschrift, E-Mail,
Telefon an Personen speichern (für Vorbelegen)? 4. Einzeldatei: Workflow-PDF-Kern ohne Texterkennung (~1 MB) einbetten?

## Was nicht passieren darf

Forschungseinträge in diesem Repo (nur Kimhub, siehe `CLAUDE.md`). Schlüssel, PINs, Chefcodes oder Passwörter in Dateien oder im Chat.
Kanon-Module oder Bausteine von Hand ändern. Oberfläche des Freundes ohne Klaus' Ja. Ein Release ohne erhöhte Fassung. Ein Release mit einem angefangenen Stück oder ohne Gegenprobe. Merge ohne grüne CI
(Ausnahme nur mit Klaus' Wort und lokalem vollem Probenlauf, benannt). Force-Push auf `main`.

## Stundennachweis Sitzung F (2026-10-31, UTC)

| Zeit | Arbeit |
| --- | --- |
| 12:16–13:40 | Ausfüllen gebaut, Proben, PR #32 (siehe Abschlussbrief F) |
| 13:40–14:10 | Forschungs-Regel in `CLAUDE.md`, Umzug nach Kimhub (Dublette zur Parallel-Sitzung erkannt, Kimhub #414 geschlossen), drei weitere Proben |
| 14:10–14:40 | Konflikt mit #31/#33 gelöst, CI-Befund (Systemschrift) behoben, Merge #32, PRs #29/#1 geschlossen |
| 14:40–15:10 | Läufe auf `main` neu gestartet (alle grün, PWA ausgeliefert), Abgleich mit der Parallel-Sitzung, dieser Brief |

Erste Spur 12:16, letzte ≈ 15:10: **≈ 2 h 55 min** (Obergrenze, inkl. Wartezeit auf CI ≈ 30 min). Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```
Familienakte Sitzung B. Repo lausiklauskn-png/Meine-Familienakte (bauen), dazu Sage-Protokol (Kanon-Module, nur kopieren), Privat-Brain-Pro (Bausteine pro-chefcode/pro-ueberall, nur kopieren), BookLedgerPro (Plan, Vorbild Nachzieh-Werkzeuge). Branch wie vorgegeben, Deutsch.
Zuerst lesen: Meine-Familienakte/CLAUDE.md, BRIEF_SITZUNG_2026-11-01_SITZUNG-B-NETZ-UND-RELEASE.md, BRIEF_ABSCHLUSS_2026-10-31_AUSFUELLEN-SITZUNG-F.md, docs/UPDATES-EIGENER-SERVER.md; BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md (Sitzung B) und den neuesten BookLedgerPro-Brief.
Mein Wort: in Stücken bauen (Tabelle im Brief), nur ein fertiges Stück veröffentlichen (Probe + Gegenprobe + alle Proben + CI grün, Altes geht weiter). Stück 0 zuerst: heutiger main als 2.28.4 für Android und Windows auf den eigenen Server (server = ja). Ein angefangenes Stück bleibt auf dem Zweig, die App draußen muss immer funktionieren. Repo zum Pushen kurz öffentlich – frag mich vorher.
Dann prüfen, ob eine andere Sitzung schon in der Familienakte arbeitet (Zweige, PRs, Pro-Umbau-14-Brief); kein Doppelbau. Das Tresor-Paket (Fächer Familienakte/Eingang-Familienakte) baut die Pro-Umbau-Sitzung in Workflow PDF Pro, du nur die Anbindung hier.
Stücke: 1 „Überall suchen“ in der eigenen Akte (Dokumente, Memory, Vorgänge) · 2 Mycel/SBKIM (byte-1:1, Schublade familienakte) · 3 Chefcode + Suche im eigenen Netz · 4 Tresorordner-Anbindung. Sichtbare Änderungen an der Oberfläche des Freundes nur mit meinem Ja je Punkt. Nach jedem fertigen Stück veröffentlichen und mir sagen, was ich prüfen soll.
Nicht: Forschung in diesem Repo (nur Kimhub), Schlüssel/PINs/Chefcodes in Dateien oder im Chat, Bausteine von Hand ändern, sichtbare „Version 2.28.1“ ändern.
Offene Fragen aus Sitzung F zuerst stellen (Einstieg Formular scannen, Gesundheitsunterlagen, Anschrift/E-Mail/Telefon an Personen, Einzeldatei).
Am Ende Abschlussbrief mit Stundennachweis und Startauftrag.
```
