# Plan Sortiersieb – Prüf- und Sortierwerkzeug (12.11.2026)

Auftrag (Klaus, 12.11.2026): ein recht einfaches Prüf- und Sortierwerkzeug **neben Auslieferungsprüfer und Sende-Prüfer**.
Dateien von Scanner, Kamera oder sonst woher kommen in **einen Eingangsordner**. Danach sortiert das Werkzeug **Klick für Klick
feiner – wie ein Sieb**: erst nach Art (Bild, Dokument), dann nach dem Kopf (Briefkopf, Metadaten: Rechnung, Mahnung,
Aufforderung, Termin, Foto …), dann nach Kategorie und Nummern, dann nach Absender, am Ende nach Inhalt (wer ist angesprochen,
worum geht es). Dafür **schnelle kleine Modelle statt großer Sprachmodelle**, die nur **Teile** des Textes lesen. Am Ende ist jede
Datei unter mehreren Gesichtspunkten auffindbar.

Arbeitsname „Sortiersieb“. Nur Plan, nichts gebaut. Wo das Werkzeug wohnt, ist Frage S1.

## Leitgedanke: jede Stufe liest nur so viel, wie sie braucht

| Stufe (ein Klick) | Liest | Ergebnis (Ordner / Sicht) | Zeit je Datei (Ziel, vor Messung) |
|---|---|---|---|
| **0 Eingang** | nichts | alle Dateien in `Eingang/` | – |
| **1 Art** | Dateikopf (erste Bytes), Endung, Größe, Fingerabdruck | `Bilder/`, `Dokumente/`, `E-Mails/`, `Sonstiges/`, `Doppelt/`, `Auffällig/` (Endung passt nicht zum Kopf, Daten hinter dem Bildende) | Millisekunden |
| **2 Kopf** | PDF: Textebene der ersten Seite, nur oberes Drittel; Scan/Foto: Texterkennung nur oberes Drittel in kleiner Auflösung; Bild: Metadaten (EXIF), „ist das ein Blatt?“; E-Mail: Kopfzeilen | Art des Schriftstücks: `Rechnung/`, `Mahnung/`, `Bescheid-Aufforderung/`, `Termin-Einladung/`, `Vertrag/`, `Brief/`, `Foto/`, `Unklar/` | unter 1 s |
| **3 Kategorie und Nummern** | dieselben Teile + Betreffzeile | Lebensbereich (`Auto/`, `Gesundheit/`, `Versicherung/` …), Nummern (Kunden-, Rechnungs-, Vertragsnummer, Aktenzeichen, Kennzeichen) | unter 1 s |
| **4 Absender** | Briefkopf (Absender, Datum), E-Mail-Absender | `Absender/<Name>/`, Abgleich mit bekannten Absendern | unter 1 s |
| **5 Inhalt** | ganzer Text (volle Texterkennung, im Hintergrund) | angesprochene Person (Adressfeld, Anrede), Thema, Fristen und Beträge, Termine | Sekunden, im Hintergrund |

- Jede Stufe zeigt ihr Ergebnis, bevor die nächste läuft. Fehler korrigiert man durch Verschieben in den richtigen Ordner –
  das Werkzeug **lernt daraus** (Stufe L).
- Stufe 1 bis 4 sind schnell, weil sie nur Kopf und Anfang lesen. Die langsame volle Texterkennung kommt erst in Stufe 5 und
  läuft im Hintergrund (gleicher Gedanke wie „erst ablegen, dann lesen“ im Plan Bilder, `docs/PLAN_2026-11-12_BILDER.md` Stufe C).
- Ein Klick kann auch „alle Stufen“ heißen; die Stufen bleiben trotzdem einzeln sichtbar und rückgängig zu machen.

## Die „schnellen KIs“

Kein großes Sprachmodell. Drei Stufen von schnell nach klug, alle auf dem Gerät:

1. **Regeln und Muster** (sofort): Wörter im Kopf („Rechnung“, „Mahnung“, „Zahlungserinnerung“, „Bescheid“, „Einladung“,
   „Termin“, „Kündigung“), Nummernmuster (`nummernAusText` in `lib/briefkopf-titel.ts`), Datum, Beträge, IBAN, Kennzeichen.
2. **Briefkopf-Leser** aus Workflow PDF (`briefkopf.js`, byte-1:1 im Klon): Absender, Empfänger, Datum, Betreff, Nummern aus der
   Lage auf dem Blatt – ohne Sprachmodell.
3. **Kleines Bedeutungsmodell** (Vektor-Modell, das die Familienakte für die Bedeutungssuche schon lädt, Stufe G): vergleicht
   den Anfang eines Dokuments mit Beispielen, die der Nutzer schon richtig einsortiert hat („nächster Nachbar“). Lernt so ohne
   Training, wird mit jeder Korrektur besser, Millisekunden je Vergleich. Nur, wenn Regeln und Briefkopf unsicher sind.

Ein großes Sprachmodell (Mistral EU, eigener Schlüssel) höchstens auf ausdrücklichen Knopf für einzelne unklare Dateien –
nicht Teil der ersten Fassung (Frage S5).

## Prüfung (warum es neben den beiden Prüfern steht)

- Auslieferungsprüfer und Sende-Prüfer kontrollieren den **Ausgang**. Das Sieb ist die **Eingangskontrolle**.
- Stufe 1 macht nur die schnellen Strukturprüfungen (Kopf ↔ Endung, Daten hinter dem Bildende, Programme, Makros) – derselbe
  Prüfkern (`pruefer-anhang.js`, `pruefer-formate.js`), keine zweite Fassung. Auffälliges landet in `Auffällig/` und wird nicht
  weiter gelesen.
- Die gründliche Prüfung (versteckte Botschaften in Bildpunkten, Barcode-Inhalte, Anweisungen an eine KI im Text) läuft im
  Hintergrund nur für Dateien, die es brauchen (fremde Quelle, Barcode gefunden) – Frage S4, wie im Plan Bilder F2.

## Ordner: echt oder als Sicht

Die Sortierung erzeugt zwei Dinge:

- **Ein echter Ablageort je Datei** (Original, unverändert, nie doppelt gespeichert). Vorschlag: `Archiv/<Jahr>/<Art>/` oder nach
  Wahl `Archiv/<Absender>/` – eine Ordnerordnung, die man auch ohne das Werkzeug im Explorer versteht.
- **Sichten** „nach Art“, „nach Absender“, „nach Person“, „nach Kategorie“, „nach Datum“, „offene Fristen“: dieselbe Datei
  erscheint unter jedem Gesichtspunkt, ohne Kopie. Eine Sicht kann auf Wunsch als Ordnerbaum mit Verknüpfungen (Windows) oder als
  Liste/HTML-Seite ausgegeben werden.
- Jede Bewegung steht im **Verlauf** (`sieb-verlauf.json` im Eingangsordner): wer, wann, woher, wohin – jede Stufe ist rückgängig.
- Am Ende je Datei eine kleine Begleitdatei oder ein Eintrag in `sieb-index.json` mit allem, was erkannt wurde (Art, Absender,
  Empfänger, Datum, Nummern, Kategorie, Fristen, Prüfstand). Damit kann die Familienakte (und jede Pro-App) die Datei ohne
  erneutes Lesen übernehmen.

## Bausteine, die es schon gibt

| Baustein | Wo | Rolle im Sieb |
|---|---|---|
| Dateiart erkennen | `detectCentralIntakeFileKind` (`lib/central-intake.ts`), Dateikopf im Prüfkern | Stufe 1 |
| Doppelte, Fotoserien, Wert (wichtig/prüfen/doppelt/gering), Lernsignale | `lib/fawoga-inventory.ts` („Bestand prüfen“) | Stufe 1, Lernen |
| Eingangsordner in Blöcken zu 20, schon Gesehenes merken, Android-Dienst | `lib/eingang-bloecke.ts`, `ArbeitDienst` | Eingang, große Mengen |
| Briefkopf, Nummern, Titel | `briefkopf.js` (Klon), `lib/briefkopf-titel.ts` | Stufe 2–4 |
| Fristen, Datum, Aufgaben im Text | `erkenneFristen`, `erkenneDokumentDatum` (`lib/central-intake.ts`) | Stufe 5 |
| Lebensbereiche | `lib/family-categories.ts`, `INTAKE_DOCUMENT_TYPES` | Stufe 3 |
| Texterkennung | Tesseract aus dem Klon (`app/wfpdf-kern.ts`) | Stufe 2 (Ausschnitt), 5 (voll) |
| Bedeutungsmodell | `app/browser-modelle.ts`, `app/private-meaning-index.ts` | „schnelle KI“ |
| Metadaten, Kennzeichen, Barcodes | Plan Bilder, Stufen B, D, E | Stufe 2–3 für Bilder |
| Prüfkern | `dateiPruefen` (`app/wfpdf-kern.ts`) | Prüfung |

Fehlt: die Teil-Texterkennung (nur oberes Drittel, kleine Auflösung), die Art des Schriftstücks als eigene Liste (Rechnung,
Mahnung, Bescheid/Aufforderung, Termin/Einladung, Vertrag, Kündigung, Brief, Werbung, Foto), Empfänger aus Adressfeld und Anrede,
das Verschieben in echte Ordner mit Verlauf, die Sichten.

## Stufen des Baus

- **A Vorschau (HTML):** ein Eingangsordner mit 20 erfundenen Dateien, Klick für Klick die Stufen 1–5 als Ordnerbaum und als Sicht,
  Korrektur durch Ziehen, Verlauf, Rückgängig. Klaus antwortet mit Ja/Nein je Punkt.
- **B Kern (rein, in Node prüfbar):** `lib/sieb.ts` – Stufen als reine Funktionen (`stufeArt`, `stufeKopf`, `stufeKategorie`,
  `stufeAbsender`, `stufeInhalt`), jede gibt Ergebnis + Sicherheit + Grund zurück; Schriftstück-Arten mit Mustern; Empfänger aus
  Anrede/Adressfeld; Index- und Verlaufsformat. Proben `scripts/run-sieb-tests.mjs` mit erfundenen Texten.
- **C Teil-Lesen:** PDF erste Seite oberes Drittel; Texterkennung nur auf dem Kopfausschnitt; Zeit je Stufe messen.
- **D Ordner und Verlauf:** echter Ordner über die vorhandene Ordnerwahl (Windows/Tauri, Android SAF, Chrome/Edge
  File System Access); Verschieben nur nach Bestätigung je Stufe; Rückgängig aus dem Verlauf.
- **E Lernen:** Korrekturen werden Beispiele; Bedeutungsmodell sucht den nächsten Nachbarn; Regeln bleiben vorne.
- **F Übergabe:** `sieb-index.json` → Familienakte-Eingang übernimmt Art, Absender, Nummern, Fristen ohne erneutes Lesen.

## Fragen an Klaus

- **S1 Wo wohnt das Werkzeug?** (a) eigene Web-App neben Auslieferungsprüfer und Sende-Prüfer (eigenes Repo, in der Geschenkbox),
  der Kern als byte-gleicher Baustein in Familienakte und Pro-Apps; (b) nur als Teil der Familienakte (Eingangszentrale).
  Vorschlag: (a), Kern zuerst hier gebaut und geprüft, dann ausgelagert – wie Workflow PDF.
- **S2 Echte Ordner verschieben** oder nur Sichten (Dateien bleiben im Eingang)? Vorschlag: echter Ablageort `Archiv/<Jahr>/<Art>/`
  plus Sichten, jede Stufe mit Bestätigung und Rückgängig.
- **S3 Reihenfolge der Siebe** so (Art → Kopf → Kategorie/Nummern → Absender → Inhalt) oder Absender vor Kategorie?
- **S4 Gründliche Prüfung** nur für fremde Quellen und Barcode-Funde, im Hintergrund?
- **S5 Großes Sprachmodell** für unklare Einzelfälle auf Knopf – später oder gar nicht?
- **S6 Ein Klick je Stufe** oder ein Knopf „ganz durchsieben“ mit Halt bei Unsicherem?
