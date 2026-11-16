# Abschlussbrief 16.11.2026 – Pseudo-Fenster: Kopieren, Meldung, Austauschordner

Anlass (Klaus 16.11., Tablet, Pro 2.28.71, 43 PDFs im Pseudo-Fenster): „An Claude“, „Nur kopieren“ und „Als Datei“ zeigten keine
Wirkung, in den Ordner wurde nichts gelegt.

## Gefunden
- Die Rückmeldung stand über der Dateiliste. Bei 43 Zeilen lag sie weit außerhalb des Bildes – es sah aus, als geschehe nichts.
- Kopiert wurde erst nach dem Sichern des Auftrags. Die Android-WebView erlaubt die Zwischenablage nur kurz nach dem Tipp;
  ein Ersatzweg fehlte.
- Der Austauschordner hing an der Ordnerwahl des Browsers; die gibt es in der Android-App nicht, die Wahl wurde dort gar nicht angeboten.

## Geändert (`app/pseudo-knopf.tsx`, #213)
- Meldung steht direkt unter den Knöpfen und rückt ins Bild.
- Erst kopieren, dann Auftrag sichern; Ersatzweg ohne Zwischenablage-Erlaubnis (`textKopieren`); Hinweis bei sehr langem Text.
- Austauschordner in der Android- und Windows-App über die Ordnerwahl der App-Hülle (`nativenOrdnerWaehlen`), gilt bis zum Schließen;
  Ordnerfehler in Klartext.
- Probe `pseudo-knopf` um einen Schritt ergänzt (20 grün); `pseudo-auftraege`, `rueckmeldung-d`, `npm run build` grün.

## Ausgabe 2.28.72 (Klaus 16.11.: „führen und veröffentlichen“)
- #213 auf main (`0fd7cd5`), darin #214 der Datei-Organizer-Sitzung (neue Kategorie als Lebensbereich) eingemischt.
- Android `android-v2.28.72` (82,0 MB) und Windows `windows-v2.28.72` (96,5 MB) mit Update-Server, Web-App über Pages; beide Downloads
  anonym per SHA-256 nachgeprüft, Nachweis `docs/VEROEFFENTLICHUNG-2.28.72.json`. Geschenkbox Version 37, Landkarte neu gebaut.
- Unterwegs: Windows-Probe der Bedeutungssuche (`test-model-installed.mjs:72`) zweimal rot, je beim Neustart grün; eine Android-
  Produktprobe an Maven Central (429) gescheitert, Neustart grün; Android-Ausgabe stand 33 Minuten in der Warteschlange.

## Grenzen
- Nicht am Gerät geprüft. Ob Android 43 PDFs als Text in die Zwischenablage nimmt (Grenze rund 1 MB), ist offen – dann „Als Datei“.
- Warum „Als Datei“ am Tablet nichts tat, ist nicht geklärt; die Meldung dazu ist jetzt sichtbar.
- Die wackelnde Windows-Probe ist nicht untersucht.

## Stundennachweis
16.11.2026, rund 1,5 Std. (Fehlersuche, Umbau, Proben, Zusammenführen, Ausgabe, Nachweis; Wartezeiten der CI nicht gerechnet).

## Startauftrag
```
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-16_PSEUDO-KOPIEREN.md. Nimm Klaus' Rückmeldung zu 2.28.72 vom Tablet auf (Pseudo-Fenster mit
vielen PDFs: Meldung bei den Knöpfen, Kopieren, „Als Datei“, Austauschordner). Suche danach die Ursache der wackelnden Windows-Probe
windows/tools/test-model-installed.mjs:72 (Knopf „Nach Bedeutung suchen“ nach dem Neuladen gesperrt), ohne die Probe abzuschalten.
```
