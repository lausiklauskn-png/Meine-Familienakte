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

## Entscheidungen (Klaus, 12.11.2026)

- **S1: eigene App.** Zuerst für die Familienakte gemacht, später Vorarbeit für andere Werkzeuge. Kern gemeinsam (siehe unten).
- **S2: alles in einem Ordner.** Keine echten Unterordner nötig. Die Dateien liegen in **einem** Ordner; das Sieb zeigt sie wie
  ein Explorer als **Baum**, der sich selbst sortiert. Zweige wählbar: nach Datum, Art, Name/Absender, Ansprechpartner
  (angesprochene Person), Termin, Dringlichkeit (Frist/Mahnstufe), Kundennummer, Auftrags-/Rechnungsnummer, Kategorie und
  Unterkategorie, Inhalt (Wortsuche) und Bedeutung (Vektoren). Ein Baum ist nur eine Sicht auf `sieb-index.json` – nichts wird
  verschoben oder kopiert. Damit entfällt das Verschieben aus Stufe D; der Verlauf hält nur Korrekturen fest.
- **S7: kompatibel mit der Familienakte.** Der vorsortierte Ordner wird in der Familienakte nur noch **eingefügt/übernommen**
  („Ordner übernehmen“ in der Eingangszentrale). Die Akte liest `sieb-index.json`, übernimmt Kategorie, Unterkategorie, Art,
  Absender, Nummern, Fristen, Text und Abschnitte und ordnet automatisch zu (Personen, Organisationen, Fahrzeuge, Vorgänge über
  Nummern und Namen). Zur Bestätigung bleibt nur, was unsicher ist – wenige Handgriffe. Dateien ohne Index nimmt die Akte wie heute.
- **Geteilte Arbeit:** Das Sieb kennt Schriftstück, Absender und Nummern. Wer in **dieser** Familie gemeint ist (welche Person,
  welches Auto, welcher Vertrag), weiß nur die Akte – diesen letzten Schritt macht sie beim Übernehmen.
- Neu im Steckbrief: **Dringlichkeit** (Frist überschritten / diese Woche / später / keine; Mahnstufe aus „Mahnung“,
  „letzte Zahlungsaufforderung“).
- Offen bleiben S3–S6 (Reihenfolge der Siebe, gründliche Prüfung, Sprachmodell auf Knopf, ein Klick je Stufe oder ganz durch).
- Bau: eigenes Repo nötig (Name und Anlage durch Klaus); der Kern `lib/sieb.ts` kann vorher hier entstehen und wird dann wie
  Workflow PDF byte-gleich mit Pin übernommen.

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

## Zweck: Vorarbeit für Familienakte, andere Programme und KI (Klaus, Nachtrag 12.11.)

Das Sieb ist **Vorbereitung**: alte Bestände, alte Dokumente und neue Dokumente bekommen eine Vorsortierung, damit sie die
Familienakte und jedes andere Programm, das solche Daten braucht, jederzeit leicht zuordnen kann. Zugleich werden sie **leichter
auffindbar für KI**: für Sprachmodelle (LLM) und für Embedding-Modelle (Vektorsuche).

Was das Sieb dafür neben jede Datei legt (eine Begleitdatei bzw. ein Eintrag im `sieb-index.json`, offenes JSON mit Fassungsnummer):

- **Steckbrief** in festen Feldern: Art des Schriftstücks, Absender, Empfänger/angesprochene Person, Datum, Betreff, Nummern,
  Kategorie, Fristen, Beträge, Prüfstand, Herkunft (Scanner, Kamera, E-Mail, Altbestand), Fingerabdruck der Originaldatei.
  Programme lesen diese Felder direkt, ohne die Datei erneut zu öffnen.
- **Kurzfassung in einem Satz** und **gelesener Text** (Textebene oder Texterkennung) als reiner Text – das ist, was ein
  Sprachmodell braucht, ohne das ganze PDF zu bekommen. Text aus Barcodes und fremden Quellen ist als Fremdtext markiert.
- **Abschnitte für die Vektorsuche:** der Text in sinnvolle Stücke geteilt (Briefkopf, Betreff, Absätze), jedes Stück mit
  Steckbrief-Feldern als Kopf, damit ein Embedding-Modell auch den Zusammenhang sieht („Rechnung · Stadtwerke · 03/2026 · …“).
  Vektoren tragen Modellname und Textstand; Modelle werden nicht vermischt (Speicherwege-Regel). Die Vektoren selbst sind
  ersetzbar, der Text bleibt die Quelle.
- **Altbestände:** ganze Ordner in Blöcken (wie der Eingangsordner, `lib/eingang-bloecke.ts`), schon Gelesenes wird am
  Fingerabdruck erkannt und nicht noch einmal gelesen. Originale bleiben, wo und wie sie sind, wenn nur vorbereitet werden soll.
- **Übernahme:** die Familienakte liest `sieb-index.json` im Eingang und übernimmt Steckbrief, Text und Vorschläge; andere
  Pro-Apps (Private Brain Pro, BookLedgerPro) über dasselbe Format.

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
- **S7 Format für andere Programme:** ein gemeinsames offenes Format (`sieb-index.json` + Begleittexte) für alle Pro-Apps, mit
  Abschnitten für Embedding-Modelle und Kurzfassung für Sprachmodelle? Vorschlag: ja, als Teil des Kerns, in jeder App gleich.

## E-Mail-Anhänge (Klaus, 12.11.2026)

- Einfachster Weg wie vorgeschlagen: im Mail-Programm „Anhang speichern unter“ → Download-Ordner → in den Sieb-Ordner schieben.
- **Noch einfacher:** die ganze E-Mail in den Sieb-Ordner ziehen. Thunderbird legt dabei eine `.eml`-Datei an; die Familienakte
  packt Anhänge aus `.eml` schon heute aus (`extractEmlAttachments`, beliebig tief). Absender, Datum und Betreff der Mail kommen
  so gleich mit in den Steckbrief – beim Weg über „Speichern unter“ gehen sie verloren.
- **Lücke:** Outlook (klassisch) zieht `.msg`-Dateien. Die werden erkannt („Outlook-E-Mail (.msg)“), aber ihre Anhänge werden
  nicht ausgepackt. Für das Sieb nachrüsten (OLE-Format, nur lesen).
- Android: „Teilen“ aus der Mail-App an Sieb bzw. Familienakte (gibt es für die Akte schon).
- Automatisches Ablegen aller Anhänge (Thunderbird-Erweiterungen wie Attachment Extractor) ist laut Nutzerberichten bei neuen
  Thunderbird-Fassungen unzuverlässig – nicht darauf bauen.

## Vergleich mit vorhandenen Programmen (Stand 12.11.2026, aus Hersteller- und Nutzerquellen, nicht selbst getestet)

| Programm | Art | Was es gut macht | Schwäche / was wir nicht übernehmen |
|---|---|---|---|
| **Paperless-ngx** (frei, Server/NAS) | Dokumentenarchiv | Eingangsordner („consume“), Texterkennung, Zuordnung von Absender, Dokumentart, Schlagworten, Ablagepfad; je Merkmal wählbar: genaues Wort, Regex, unscharf oder „Auto“ (lernt aus bisherigen Zuordnungen); Marke „Posteingang“ bis zur Durchsicht; Archivnummer (ASN) für Papieroriginale | braucht Server (Docker); „Auto“ braucht viele Beispiele und Gegenbeispiele; falsche Zuordnungen beim Massen-Import lernt es mit; Ablagepfad hängt an der Dokumentart – falsche Art = falscher Ort, spätere Änderungen gelten nur für neue Dateien; mehrere Treffer = keine Zuordnung; lernt nur etwa stündlich neu |
| **Paperless-AI / paperless-gpt** (Zusätze) | Sprachmodell zum Einordnen | Einordnung und Texterkennung mit Sprachmodellen (lokal über Ollama, z. B. 8-Mrd.-Modelle) | schwerer Rechner nötig, langsam je Dokument; legt ungebremst neue Schlagworte an; besser gelöst bei „Paperless AIssist“: Modell wählt nur aus vorhandenen Werten |
| **Docspell** (frei, Server) | Dokumentenarchiv | holt Mails per IMAP mit Anhängen; gleicht mit einem **Adressbuch** ab: Absender **und** „betrifft“ (Person oder Sache) | Server nötig; Bedienung technisch |
| **Mayan EDMS** (frei, Server) | Unternehmens-DMS | starke Abläufe, Auto-Klassifizierung | schwer einzurichten, für Familien überdimensioniert |
| **DEVONthink** (Mac, Kauf) | Wissens-Datenbank | „Smart Groups“ = gespeicherte Sichten ohne Verschieben; „Classify“ schlägt Gruppen vor, „Siehe auch“ ähnliche Dokumente | Nutzer berichten von unzuverlässigem Auto-Einordnen (seltsame Gruppen); verschiebt beim Auto-Einordnen selbst; nur Apple |
| **fileee**, **Docutain** (Apps, DE) | Scan-Apps für Privatleute | erkennen Fristen, Beträge, Adressen; erinnern an Fristen; Docutain arbeitet auf dem Gerät | fileee mit Cloud; eigene Ablage, schwer in andere Programme zu übernehmen; Erkennung nicht unabhängig geprüft |
| **Hazel** (Mac), **File Juggler**, **DropIt** (Windows) | Regel-Sortierer für Ordner | beobachten Ordner, verschieben/benennen nach Regeln; File Juggler auch nach Wörtern und Datum im Inhalt | nur Regeln, kein Verständnis, keine Sichten; DropIt liest den Inhalt nicht |

### Was wir übernehmen

1. **Marke „Eingang“ bis zur Durchsicht** (Paperless): jede Datei bleibt sichtbar „ungeprüft“, bis sie bestätigt ist.
2. **Je Merkmal eine wählbare Regel** (Paperless): genaues Wort, Muster, unscharf, „lernt“ – Regeln zuerst, Lernen danach.
3. **Absender und „betrifft“ getrennt** über das Adressbuch (Docspell) – bei uns Absender aus dem Briefkopf, „betrifft“ aus der
   Familienakte (Personen, Fahrzeuge, Verträge) beim Übernehmen.
4. **Sichten statt Verschieben** (DEVONthink Smart Groups) – entspricht S2.
5. **Fristen, Beträge, Termine erkennen** (fileee, Docutain) – haben wir schon (`erkenneFristen`).
6. **Sprachmodell nur mit fester Auswahl** (Paperless AIssist): wenn überhaupt, wählt es aus vorhandenen Kategorien, erfindet keine.
7. **Archivnummer für Papier** (ASN): eine fortlaufende Nummer auf dem Papieroriginal, damit man den Ordner im Regal findet.
   Frage S8.
8. **Feldnamen anschlussfähig** an Paperless-ngx (Absender = correspondent, Art = document_type, Schlagworte = tags,
   Datum = created, Archivnummer = ASN), damit ein Wechsel oder Export später möglich ist.

### Was wir vermeiden (schlechte Muster)

1. **Massen-Import lernt Fehler mit** (Paperless): Altbestand erst mit einer kleinen Probe (z. B. 50 Dateien) sieben, bestätigen,
   dann den Rest. Das Sieb **lernt nur aus Bestätigtem**, nie aus eigenen Vorschlägen.
2. **Ort hängt an einem einzigen Merkmal** (Paperless-Ablagepfad): bei uns liegt keine Datei wegen einer Einordnung woanders; Sichten
   werden jedes Mal neu berechnet, eine Korrektur wirkt sofort auch auf alte Dateien.
3. **Stilles Verschieben** (DEVONthink-Auto-Einordnen): nie. Jeder Vorschlag mit Sicherheit und **Grund** („Wort ‚Mahnung‘ im
   Betreff“), Unsicheres bleibt im Eingang.
4. **Mehrere Treffer = gar nichts** (Paperless): stattdessen die zwei besten Treffer zur Wahl zeigen.
5. **Ungebremst neue Schlagworte** (LLM-Zusätze): feste Listen; Neues nur, wenn der Nutzer es anlegt.
6. **Server-Pflicht** (Paperless, Docspell, Mayan): wir laufen auf dem Gerät (Windows, Android, Browser), ohne Docker.
7. **Eigene geschlossene Ablage** (fileee): Dateien bleiben normale Dateien in einem normalen Ordner, der Index ist offenes JSON.

### Wo wir schwächer sind (ehrlich)

- **Kein Dauerbetrieb:** ein Server sortiert rund um die Uhr; das Sieb nur, solange die App offen ist (Android mit Dienst länger).
  Ein Scanner, der direkt in einen Netzordner scannt, wird erst beim nächsten Öffnen gesiebt.
- **Texterkennung:** Tesseract ist schwächer als kaufbare Texterkennung oder Bild-Sprachmodelle, besonders bei Fotos und Handschrift.
- **Kleine Modelle** erkennen ungewöhnliche Schreiben schlechter als ein großes Sprachmodell – dafür schnell, ohne Netz, ohne Server.
- **Neu und ungeprüft:** Paperless-ngx hat Jahre an Nutzung und eine große Gemeinschaft; wir fangen an.
- **Zwei Programme** (Sieb und Familienakte): nur tragbar mit einem gemeinsamen Kern, sonst sortieren beide bald verschieden.
- **Browser-Grenzen:** Ordnerzugriff im Browser nur in Chrome/Edge am PC; am Handy nur über die App.
- **Index und Dateien können auseinanderlaufen**, wenn jemand außerhalb umbenennt oder verschiebt – deshalb Zuordnung am
  Fingerabdruck (SHA-256), nicht am Dateinamen.

### Messwerte, an denen wir uns messen

Echte Zahlen der anderen gibt es nicht unabhängig geprüft. Deshalb eigene Messlatte mit erfundenen Probedateien (100 Stück:
Rechnungen, Mahnungen, Bescheide, Termine, Verträge, Fotos), in jeder Fassung gleich:

- Anteil richtig erkannter **Art** und **Absender** (Ziel vor dem Bau festlegen, z. B. ≥ 90 % bei Brief mit Textebene).
- Anteil **„unsicher“** statt falsch – lieber unsicher als falsch.
- **Zeit** je Stufe und Datei am PC und am Handy.
- **Handgriffe** bis alles bestätigt ist (Ziel: nur Unsicheres anfassen).

- **S8 Archivnummer für Papieroriginale** (fortlaufende Nummer, die man auf das Papier schreibt bzw. klebt)?
