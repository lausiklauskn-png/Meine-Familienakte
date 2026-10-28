# Brief an die nächste Sitzung: Antworten einarbeiten, Farb-Token, Postfach-Boden

Repo `lausiklauskn-png/Meine-Familienakte`, Branch steht im ersten Prompt der Sitzung. Deutsch. Freibrief: eigene PRs
mergen, wenn die Prüfungen grün sind. Veröffentlichen (Release-Workflows starten) nur auf Klaus' Wort je Fassung.

## Zuerst lesen

1. `BRIEF_ABSCHLUSS_2026-10-28_ANALYSE-UND-ERSTBAU.md` (Stand, Tabelle der Vorschläge, 17 Fragen an Klaus)
2. `docs/PLATTFORMEN.md` (drei Hüllen, Update-Wege, was Klaus selbst tun muss)
3. `docs/UEBERGABE.md` und `docs/POSTFACH-UND-WERKZEUGE-PLAN.md`
4. `docs/analyse/BERICHT.md` (fünf wichtigste Befunde) und `docs/VERBESSERUNGSVORSCHLAEGE_2026-10-28.md`
5. `docs/MIKROFONAUSWAHL-WINDOWS-PLAN.md`

## Was als Nächstes ansteht (in dieser Reihenfolge)

1. **Klaus' Antworten auf die 17 Fragen** einarbeiten – jede Nummer ein eigener kleiner PR, sichtbare Änderungen nur mit seinem Ja.
2. **H Schritt 1, Farb-Token** (ohne sichtbare Änderung, schon freigegeben): 321 feste Farbwerte in `app/globals.css` auf
   25–30 Tokens; Probe: Bildschirmfotos vorher/nachher pixelgleich (Playwright) bei 360/768/1280 px.
3. **Postfach-Boden 3a** (wenn Klaus Ja sagt): `.eml`-Leser nach Vorlage BookLedgerPro `src/domain/mailEml.js`, Anhänge als
   eigene Eingänge, Probe mit erfundenen Mails.
4. **Signatur Android**: sobald Klaus die drei Secrets angelegt hat, `android-release.yml` erneut starten; die Wegwerf-APK
   muss dann einmal deinstalliert werden (im Release-Text vermerken).
5. **Gerätebefunde** von Klaus (Tablet, PC) in `docs/PLATTFORMEN.md` nachtragen; Fehler zuerst.

## Was nicht passieren darf

- Design, Aufbau und Wortlaut der Oberfläche des Freundes verändern (nur nach Ja je Punkt).
- Echte Daten verwenden; Beispieldaten bleiben erfunden.
- Schlüssel, Passwörter, Signaturen ins Repo. In anderen Repos etwas ändern (nur notieren).
- Prüfungen abschalten; nichts auf „bestanden“ setzen.
- Veröffentlichen ohne Klaus' Wort für die jeweilige Fassung.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Meine-Familienakte, Branch wie vorgegeben, Deutsch. Freibrief: eigene PRs mergen, wenn grün; Releases nur auf mein Wort.
Lies zuerst: BRIEF_ABSCHLUSS_2026-10-28_ANALYSE-UND-ERSTBAU.md, docs/PLATTFORMEN.md, docs/POSTFACH-UND-WERKZEUGE-PLAN.md, docs/analyse/BERICHT.md.
Meine Antworten auf die 17 Fragen: [Nummer: ja/nein/Satz]
Dann: 1) Antworten einarbeiten, je Nummer ein PR. 2) Farb-Token-Umbau (H Schritt 1) ohne sichtbare Änderung, Bildschirmfotos pixelgleich. 3) Postfach-Boden 3a (.eml-Anhänge einzeln), falls ich Ja gesagt habe.
Regeln: Oberfläche des Freundes bleibt, Beispieldaten erfunden, keine Schlüssel im Repo, andere Repos nur lesen, Prüfungen anpassen statt abschalten, nichts auf „bestanden“ setzen, kein Release ohne mein Wort.
Am Ende: Abschlussbrief mit Tabelle (Nummer / umgesetzt / verworfen / an mich) und Startauftrag für die nächste Sitzung als Codeblock.
```
