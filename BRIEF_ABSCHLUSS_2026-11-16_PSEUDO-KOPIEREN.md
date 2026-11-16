# Abschlussbrief 16.11.2026 – Pseudo-Fenster: Kopieren, Meldung, Austauschordner

Anlass (Klaus 16.11., Tablet, Pro 2.28.71, 43 PDFs im Pseudo-Fenster): „An Claude“, „Nur kopieren“ und „Als Datei“ zeigten keine
Wirkung, in den Ordner wurde nichts gelegt.

## Gefunden
- Die Rückmeldung stand über der Dateiliste. Bei 43 Zeilen lag sie weit außerhalb des Bildes – es sah aus, als geschehe nichts.
- Kopiert wurde erst nach dem Sichern des Auftrags. Die Android-WebView erlaubt die Zwischenablage nur kurz nach dem Tipp;
  ein Ersatzweg fehlte.
- Der Austauschordner hing an der Ordnerwahl des Browsers; die gibt es in der Android-App nicht, die Wahl wurde dort gar nicht angeboten.

## Geändert (`app/pseudo-knopf.tsx`, Fassung nicht erhöht, nicht ausgegeben)
- Meldung steht direkt unter den Knöpfen und rückt ins Bild.
- Erst kopieren, dann Auftrag sichern; Ersatzweg ohne Zwischenablage-Erlaubnis (`textKopieren`); Hinweis bei sehr langem Text.
- Austauschordner in der Android- und Windows-App über die Ordnerwahl der App-Hülle (`nativenOrdnerWaehlen`), gilt bis zum Schließen;
  Ordnerfehler in Klartext.
- Probe `pseudo-knopf` um einen Schritt ergänzt (20 grün); `pseudo-auftraege`, `rueckmeldung-d`, `npm run build` grün.

## Grenzen
- Nicht am Gerät geprüft. Ob Android 43 PDFs als Text in die Zwischenablage nimmt (Grenze rund 1 MB), ist offen – dann „Als Datei“.
- Wird erst mit der nächsten Ausgabe (2.28.72) am Tablet sichtbar.

## Stundennachweis
16.11.2026, rund 0,5 Std. (Fehlersuche, Umbau, Proben).

## Startauftrag
```
Lies CLAUDE.md und BRIEF_ABSCHLUSS_2026-11-16_PSEUDO-KOPIEREN.md. Frage Klaus, ob das Pseudo-Fenster (Kopieren, Meldung bei den
Knöpfen, Austauschordner) mit der nächsten Fassung 2.28.72 ausgegeben werden soll, und nimm seine Rückmeldung vom Tablet auf.
```
