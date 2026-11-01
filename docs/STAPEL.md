# Stapel direkt übernehmen (2.28.11, Klaus 2026-11-01)

Klaus: „Input von Dokumenten über den Scanner … direkt übernehmen … ein ganzer Packen Dokumente … automatisch gerade gezogen … nur für
Nacharbeiten einzeln aufgerufen“ · „unterbrechen oder weitermachen oder erstmal ungeprüft einpflegen und dann später … einordnen“ ·
„eine Liste … die Vorschaubilder erst bei Klick … Einordnen rechts oben ein eigener Button“.

## Bedienung

1. **Eingangszentrale → „Stapel direkt übernehmen“** (oder Menü Dokumente → **„Stapel (noch einordnen)“** → „Fotos oder Scans hinzufügen“):
   viele Fotos und/oder PDFs auf einmal wählen.
2. Bild für Bild findet die Akte das Blatt mit den drei Verfahren von Workflow PDF (Blatterkennung, Kanten, Modell). Sind sich zwei einig,
   wird das Blatt **gerade gezogen** (Seitengröße automatisch, A4 bei passendem Verhältnis). Sonst bleibt das **ganze Foto** stehen und die
   Unterlage heißt „… (Ecken prüfen)“ — es wird nie still abgeschnitten. PDFs vom Scanner gehen unverändert durch.
3. Während des Einscannens: **Anhalten**, **Weiter**, **Abbrechen** (das gerade gerechnete Blatt wird noch fertig; Fertige bleiben).
4. Ergebnis: eine **schlanke Liste ohne Vorschaubilder**, gespeichert auf dem Gerät — sie bleibt nach dem Neuladen, bis eingeordnet wird.
5. **Antippen einer Zeile** zeigt die große Vorschau und: **In Workflow PDF öffnen** (anpassen, zuschneiden, prüfen) · **Einordnen** · **Entfernen**.
6. **„Einordnen (N)“ rechts oben**: gibt die gewählten (Kästchen) oder alle an die Eingangszentrale. Erst dort laufen Text lesen,
   Einordnen und Zusammenhang.

## Klaus' Antworten (2.28.12)

- **Zusammenfassen:** Haken „Alle Blätter eines Durchgangs zu einem Brief zusammenfassen“ (gemerkt) · mehrere Zeilen anhaken →
  **„Zusammenfügen (N)“** · eine Zeile am Griff ⠿ auf eine andere **ziehen** (Maus, Finger, Stift) → die gezogene kommt hinter die
  Ziel-Zeile in ein PDF. Name „<erstes Blatt> (N Blätter)“, Seiten in Listen-Reihenfolge.
- **Farbe und Schärfe:** wie im Scanner von Workflow PDF — Original · Farbe verbessern · Graustufen · Dokument (Schatten weg, Papier weiß) ·
  Schwarzweiß, Schärfe 0–100 (Vorgabe Original, 40). Gemerkt je Gerät (`fa_stapel_einst_v1`). Gerechnet mit `ScanBild.filtern`.
- **Prüfbericht nur auf Wahl:** an der Zeile „Prüfen (versteckter Text, Anweisungen an eine KI)“ oder über die Auswahl „Prüfen (N)“.
  Beim Einlesen läuft keine Prüfung, der Prüfkern wird nicht einmal geladen (Amtspost braucht ihn nicht). Prüfkern byte-1:1 im Klon,
  Klebstoff `dateiPruefen` in `app/wfpdf-kern.ts`. Ergebnis an der Zeile (geprüft / Prüfung: Befund / ungeprüft) und als kurzer Bericht.
- **Titel aus dem Briefkopf** (im Eingang, `docs/WORKFLOW-PDF-KLON.md`): nach dem Lesen des Textes schlägt der Eingang
  „Brief von <Absender>, <TT.MM.JJJJ>“ vor (briefkopf.js aus dem Klon, `lib/briefkopf-titel.ts`). Ohne erkannten Absender bleibt der alte Titel.

## Aufbau

| Teil | Datei |
| --- | --- |
| Ablauf (Blatt finden, entzerren, PDF bauen; Anhalten/Weiter/Abbrechen, läuft beim Seitenwechsel weiter) | `app/stapel.ts` |
| Ablage auf dem Gerät (IndexedDB `FamilienakteStapel1`) | `app/stapel-ablage.ts` |
| Seite | `app/stapel-seite.tsx` |
| Rechnung byte-1:1 aus Workflow PDF | `public/wfpdf/scan-bild.js`, `blatt.js`, `pdf-lib.min.js`; Scanic im Klon `public/apps/workflow-pdf/vendor/scanic/` |

## Proben

2.28.12: `tests/ui/stapel.test.mjs` 19 · `tests/ui/stapel-pruefen.test.mjs` 5 · `tests/ui/briefkopf-titel.test.mjs` 5 · Gegenprobe
`"Stapel:"` 8/8, `"Prüfen2:"` und `"Briefkopf:"` je 2.


`tests/ui/stapel.test.mjs` 13 (erfundene Bilder: schräges Blatt → sicher, A4 · Bild ohne Blatt → ganzes Foto, „Ecken prüfen“ · PDF ·
Liste ohne Bilder · Vorschau beim Antippen · nach Neuladen noch da · Einordnen leert · Anhalten/Weiter · Abbrechen · Handy) ·
Gegenprobe `node tests/gegenprobe-sitzung-b.mjs "Stapel:"` 4/4.

## Grenzen

- Nicht am Tablet, nicht mit echten Fotos gemessen (nur gezeichnete Blätter). Eine Seite je Bild; mehrseitige Briefe sind mehrere Unterlagen
  (in Workflow PDF zusammenfügbar).
- 200 dpi, JPEG 90 %. Texterkennung erst beim Einordnen (Eingangszentrale). Ein zusammengefügtes PDF lässt sich hier nicht wieder trennen
  (in Workflow PDF schon). Der Titel-Vorschlag erscheint nur im Eingangs-Fenster (wo der Text gelesen wird), nicht in der Warteschlange.
- Die Stapel-Ablage liegt im Browser-Speicher des Geräts (nicht im Tresor), bis „Einordnen“.
