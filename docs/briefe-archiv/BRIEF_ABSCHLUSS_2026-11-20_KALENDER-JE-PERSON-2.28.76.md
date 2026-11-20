# Abschlussbrief 20.11.2026: Kalender je Person, flacher Fuß – Fassung 2.28.76 ausgegeben

## Erledigt (Klaus 20.11., Wort: „selbstständig mergen und online stellen … Familienakte und Privat Akte“)

1. **Fuß flach** (Bild vom Tablet): eine Zeile, rund 40 statt 420 px, alle Links bleiben.
2. **Kalender je Person** (Vorschau `docs/vorschau/kalender-person-familie.html`, Ja: „so bauen, privat-Schalter passt“): Handy gehört einer
   Person (`app/handy-besitzer.ts`), „Kalender von …“ mit eigenen Terminen; Eintragen fest/vorläufig, „Für wen noch“, privat, Hinweis bei
   Überschneidung; „Fristen und Aufgaben“ = ganze Familie mit Filter/Farbe je Person, „belegt“, „passt/passt nicht“.
   Kern `lib/kalender-familie.ts`, `updateLocalScheduleFamilie`.
3. **CI-Fix:** Maven Central lieferte zweimal 404 für vorhandene Dateien – `tools/native/model-json-dependency.mjs` versucht dann den nächsten Server.
4. **Ausgegeben 2.28.76:** Android und Windows (beide Update-Server), PWA über Pages. Nachweis `docs/VEROEFFENTLICHUNG-2.28.76.json`.
5. Private Akte 0.9.5 mit diesem Stand als Klon ausgegeben (Repo Private-Akte, Nachweis `docs/VEROEFFENTLICHUNG-0.9.5.md`).

## Eigene Entscheidungen
- „Mein Kalender“ zeigt die eigenen Termine **und** solche ohne Person (sonst wären alte Einträge verschwunden).
- Überschneidung: selbe Person, selber Tag, beide mit Uhrzeit, unter einer Stunde.
- Private Termine gehen nicht in den verbundenen Kalender.
- Wer einen Termin angelegt hat, kann ihn nicht selbst mit „passt“ beantworten; vorläufig → fest, wenn alle anderen „passt“ sagen.

## Proben
`npm run build` grün; `run-kalender-familie-tests` 7; UI `kalender-person` 7, dazu 19 weitere Proben rund um Kalender, Fristen, Fuß grün.
**Am Gerät ungeprüft.**

## Stundennachweis
Sitzung 20.11.2026, rund 3 Stunden (Fuß, Vorschau, Bau, Proben, CI, Ausgabe).

## Startauftrag
```
Lies CLAUDE.md der Familienakte und BRIEF_ABSCHLUSS_2026-11-20_KALENDER-JE-PERSON-2.28.76.md. Klaus' Rückmeldung vom Tablet zu 2.28.76
(Kalender je Person, flacher Fuß) einarbeiten. Dann Stufe 3: Abgleich der Termine zwischen den Handys der Familie – über den vorhandenen
Netz-/Cloud-Ordner-Abgleich, nur Termine (deadline/task mit fuer/von/vorlaeufig/privat/antworten), von selbst, sobald sich die Geräte
sehen; erst als Vorschau zeigen. Nächste freie Fassung 2.28.77. Freibrief: tokensparend, Fragen selbst nach Logik und
Nutzerfreundlichkeit beantworten, zum Schluss Abschlussbrief mit Startauftrag.
```
