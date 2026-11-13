# Plan Bilder in der Familienakte (12.11.2026)

Auftrag (Klaus, 12.11.2026): Bilder in die Familienakte holen – einscannen, Text in Bildern erkennen (z. B. **Kennzeichen**,
damit ein Fahrzeug gleich zugeordnet wird), **Metadaten** lesen (Aufnahme, Gerät, Ort, Einstellungen, alles was zum Bild gehört),
so weit wie möglich mit dem, was **Workflow PDF** schon kann. Die Bilder kommen aus dem privaten Bereich (eigene Fotos oder vorher
geprüftes E-Mail-Konto), Gefahr durch versteckte KI-Anweisungen oder Schadsoftware ist gering. Ausnahme: **Barcodes / QR-Codes**
auf den Bildern – deren Inhalt wird geprüft. Die Prüfung („Scan“) dauert heute lange; sie soll **im Hintergrund** laufen, damit das
Ablegen in die Akte nicht wartet.

Dies ist ein Plan, nichts davon ist gebaut. Sichtbare Änderungen kommen vor dem Bau als HTML-Vorschau (Stufe A). Bau in Stufen,
je Stufe ein PR auf `main`, gesammelt als **eine** Fassung ausgeben (Klaus 11.11.; nächste freie Fassung 2.28.66).

## Was es heute schon gibt (Bestand, nicht neu erfinden)

| Baustein | Wo | Was er kann | Grenze |
|---|---|---|---|
| Dokumentscan (Kamera → PDF) | `lib/document-scan.ts`, Stapel `app/stapel*.ts(x)`, `scan-bild.js` im Klon | Blatt erkennen (zwei Verfahren), entzerren, Filter, Seiten zu einem PDF | macht aus jedem Foto ein **Dokument**; ein Foto als Foto (Auto, Schaden, Gerät) gibt es nicht |
| Original-Foto im Stapel | Stufe H, 2.28.47 | Original bleibt neben dem PDF | nur im Stapel |
| Texterkennung | `app/wfpdf-kern.ts` (Tesseract `deu` aus dem Klon), `dokumentTextLesen` in `app/health-portal.tsx` | Textebene oder OCR, höchstens 5 Seiten, auf dem Gerät | läuft **vor** dem Ablegen, der Nutzer wartet; auf Fotos von Autos (schräg, klein, Spiegelung) schwach |
| Metadaten lesen | `pruefer-anhang.js` im Klon (byte-1:1) | EXIF-Textfelder (Hersteller, Modell, Software, Kommentar …), erkennt **ob** GPS drin ist | keine Aufnahmezeit, keine Koordinaten, keine Kameraeinstellungen; liefert Befunde, keine Daten |
| Metadaten entfernen | `reinigung.js` im Klon | EXIF/XMP/IPTC/Kommentar herausnehmen | wird in der Akte nicht benutzt |
| Prüfkern („Scan“) | `dateiPruefen` in `app/wfpdf-kern.ts` (pruefer-formate/-mail/-anhang) | Daten hinter dem Bildende, Skripte, Makros, falsche Endung; versteckte Botschaften in Bildpunkten nur auf Knopf (`verdachtPruefen`) | nur auf Wahl im Stapel, **nacheinander und im Vordergrund** – Ursache der langen Wartezeit |
| Bildbeschreibung (Modell) | `bildbeschreibung.js` im Klon | Foto in Worten beschreiben, eigenes Feld für eigene Worte | 256 MB Modell, rund 3 s je Bild, in der Akte nicht angeschlossen |
| Verkleinern | `app/verkleinern.ts` | Foto über der Gerätegrenze verkleinern, OCR-Gegenprobe 98 % | Neukodieren über die Leinwand **verliert alle Metadaten** – vorher lesen! |
| Zuordnungsvorschläge | `lib/family-context-linking.ts`, „Zuordnung prüfen“ | Vorschlag mit Sicherheit sicher/wahrscheinlich/unklar | kennt keine Kennzeichen; Fahrzeuge haben nur `name`/`objectType`, Kennzeichen steht höchstens in der Notiz |
| Hintergrundarbeit Android | `ArbeitDienst` (Eingangsordner in Blöcken, 2.28.44) | Dauer-Meldung, läuft weiter | nur für den Eingangsordner |
| Barcode / QR | – | – | gibt es nirgends (Akte, Klon, Android, Windows) |

## Grundsätze

1. **Erst ablegen, dann lesen.** Das Bild ist nach einem Tipp in der Akte (Original unverändert, Metadaten schon gelesen – das
   dauert Millisekunden). Texterkennung, Kennzeichen, Barcode, Prüfung und Bildbeschreibung laufen danach in der **Nacharbeit**
   (Stufe C) und melden sich mit Vorschlägen. Nichts wird still zugeordnet.
2. **Foto bleibt Foto.** Ein Papier-Dokument wird wie heute zum PDF. Ein Foto (Fahrzeug, Schaden, Zählerstand, Gerät,
   Typenschild, Kassenbon-Foto mit Ware) bleibt Bild mit Originaldatei. Die App schlägt die Art vor (Blatt erkannt → Dokument,
   sonst Foto), der Nutzer kann umstellen.
3. **Originale bewahren.** Das Originalfoto wird nie neu kodiert; Vorschaubilder sind Arbeitskopien und dürfen wegfallen.
   Muss verkleinert werden (Gerätegrenze), werden die Metadaten **vorher** gelesen und am Eintrag gespeichert.
4. **Alles auf dem Gerät.** OCR, Metadaten, Barcode, Prüfung, Bildbeschreibung ohne Netz. Ortsnamen aus GPS nur offline
   (siehe D3); eine Karte öffnet sich nur auf ausdrücklichen Tipp.
5. **Barcode-Inhalt ist fremder Text.** Nie automatisch öffnen, nie als Anweisung an eine KI, Links nur angezeigt.
6. **Werkzeuge aus Workflow PDF wiederverwenden**, byte-1:1-Dateien nie von Hand ändern. Fehlt im Klon etwas (vollständige
   EXIF-Werte), entsteht ein eigener kleiner Leser in der Familienakte; ein späterer Abgleich mit Workflow PDF ist eine Frage an
   Klaus (F1).

## Stufen

### A · Vorschau (HTML, vor dem Bau)

`docs/vorschau/bilder-2.28.66.html` mit: Foto ablegen (ein Tipp), Karte „Was zum Bild gehört“, Nacharbeit-Anzeige am Eintrag,
Vorschlag „Kennzeichen BSP-FA 0 → Fahrzeug Brummwerk Kombi 300“, Barcode-Fund mit Prüfstand, Fotoansicht in der Bibliothek.
Erfundene Beispieldaten, ungültige Kennzeichen. Klaus antwortet je Punkt mit Ja/Nein.

### B · Fotos als eigene Art und Metadaten lesen

- **Neuer Leser** `lib/bild-metadaten.ts` (eigener Code, rein, in Node prüfbar): JPEG (APP1 EXIF + XMP), PNG (`eXIf`, `tEXt`/`iTXt`),
  WebP (`EXIF`/`XMP `), HEIC/HEIF (ISO-BMFF `Exif`-Item) – nur lesen, mit festen Obergrenzen wie im Prüfkern (`META_MAX`).
  Felder:
  - **Aufnahme:** Datum/Uhrzeit (`DateTimeOriginal`, `OffsetTimeOriginal`), sonst Dateidatum mit Kennzeichnung „Dateidatum“.
  - **Gerät:** Hersteller, Modell, Objektiv, Software.
  - **Einstellungen:** Blende, Belichtungszeit, ISO, Brennweite (und 35-mm-Wert), Blitz, Weißabgleich, Ausrichtung, Bildgröße in Pixeln.
  - **Ort:** Breite, Länge, Höhe, Richtung (GPS).
  - **Beschreibungen:** Titel, Kommentar, Stichworte, Urheber (EXIF, XMP, IPTC).
  - **Datei:** Name, Größe, Typ, Fingerabdruck SHA-256 (Doppelte erkennen).
- **Speichern** am Dokument als eigenes Feld `bild` (nicht in `notes`): `{ art: "foto"|"dokument", meta: {...}, vorschau?: … }`.
  Gesucht werden Aufnahmedatum, Gerät, Ort (als Name, siehe D3), Stichworte.
- **Aufnahmedatum = Dokumentdatum** als Vorschlag (heute: Erkennung aus Text oder Ablagedatum).
- **Eingang:** `detectCentralIntakeFileKind` kennt „Foto / Bild“ schon; dazu die Art-Wahl Foto/Dokument (Blatt-Erkennung aus
  `scan-bild.js`), Fotoserien bleiben gruppiert (`groupCentralIntakeAnalyses`).
- **Ansicht:** Karte „Was zum Bild gehört“ am Eintrag (kurz: Datum, Gerät, Ort; „Mehr“ für Einstellungen), Bibliothek mit
  kleinem Vorschaubild in der Zeile, Filter „Fotos“.
- **HEIC:** Lesen der Metadaten geht überall; **Anzeigen** nicht in jeder WebView (Chrome/WebView2 können HEIC nicht malen).
  Android liefert über die Auswahl meist JPEG; sonst Original behalten und eine JPEG-Vorschau nativ erzeugen (Android
  `ImageDecoder` ab API 28, Windows über WIC) – Umfang nach Messung am Gerät.

### C · Nacharbeit im Hintergrund (das lange Warten weg)

- **Warteschlange** `lib/nacharbeit.ts` (rein) + `app/nacharbeit.ts` (Läufer): je Dokument Aufträge `ocr`, `kennzeichen`,
  `barcode`, `pruefung`, `beschreibung`, `vektor`; gespeichert in IndexedDB, übersteht Neustart; ein Auftrag nach dem anderen,
  Tesseract im Worker (wie heute), Pause wenn die App verdeckt ist (außer Android-Dienst, siehe unten).
- **Ablegen wartet nicht mehr** auf: `dokumentTextLesen` (heute im Ablagefenster vor dem Speichern), Prüfkern im Stapel
  (`pruefen` in `app/stapel-seite.tsx`, heute nacheinander im Vordergrund), Sammelablage im Eingang. Was der Text für den
  Zuordnungsvorschlag beim Ablegen braucht, wird als „vorläufig“ markiert und nach der Nacharbeit nachgezogen.
- **Anzeige am Eintrag:** kleiner Stand „wird gelesen …“ / „gelesen ✓“ / „1 Vorschlag“ / „bitte prüfen“ (Warnung aus der
  Prüfung). Sammelanzeige im Kopf nur, solange etwas läuft („Nacharbeit 3 von 12“), Tipp öffnet die Liste.
- **Ergebnisse als Vorschläge** in „Zuordnung prüfen“ (bestehende Oberfläche, `ContextLinkSuggestion`), nicht still eingetragen.
- **Android:** große Mengen (ab z. B. 20 Bildern) über den vorhandenen `ArbeitDienst` mit Dauer-Meldung, damit Android den Lauf
  nicht beendet. **Windows/PWA:** läuft, solange die App offen ist; Rest beim nächsten Start.
- **Messen zuerst:** in der Probe die Zeit je Schritt festhalten (Metadaten, OCR je Seite, Prüfkern, Barcode), damit belegt ist,
  was das Ablegen heute bremst – nicht vermuten.

### D · Text im Bild, Kennzeichen, Zuordnung

- **D1 Kennzeichen-Feld am Fahrzeug:** Objekte der Art Auto/Motorrad/Anhänger/Fahrzeug bekommen die Felder `kennzeichen`
  (mehrere erlaubt, z. B. Saison- oder Wechselkennzeichen) und `fin`. Beim Start werden Kennzeichen aus vorhandenen Notizen
  und Fahrzeugscheinen als **Vorschlag** übernommen (nie still).
- **D2 Kennzeichen finden** `lib/kennzeichen.ts` (rein): deutsches Muster (1–3 Buchstaben Bezirk, 1–2 Buchstaben, 1–4 Ziffern,
  optional E/H), typische OCR-Verwechslungen (0/O, 1/I, 8/B, 5/S) ausgleichen, Abgleich gegen die eigenen Fahrzeuge mit
  Ähnlichkeit statt Gleichheit. Treffer → Vorschlag „Fahrzeug Brummwerk Kombi 300 (sicher/wahrscheinlich)“.
  Tesseract liest Kennzeichen auf Fotos schlecht: mehrere Durchgänge (ganzes Bild, kontrastverstärkt, vergrößerte helle
  Rechtecke mit Seitenverhältnis eines Schildes) – Umfang nach Messung an erfundenen Probebildern. **Besseres Lesen am Gerät**
  wäre auf Android ML Kit (Texterkennung auf dem Gerät, ohne Netz), Frage F3.
- **D3 Ort:** GPS-Koordinaten gegen eigene Orte abgleichen (Wohnadresse, Garage, Ferienhaus – Orte mit Koordinaten am Objekt),
  Anzeige „bei: Wohnung“, sonst nur Koordinaten. Ortsnamen aus dem Netz (Geodienst) nicht ohne Klaus' Ja (F4).
- **D4 Weitere Zuordnungen aus Bildtext:** Zählernummer → Zähler/Wohnung, Seriennummer/Typenschild → Gerät (Garantie),
  Namen und Organisationen über die bestehende Verknüpfung (`buildContextLinkSuggestions`).
- **D5 Bildbeschreibung (Modell) – später, auf Knopf:** `bildbeschreibung.js` aus dem Klon anschließen, Modell nur bewusst laden
  (256 MB, Hinweis vorher), eigenes Feld „eigene Worte“ mit Diktat; beides durchsuchbar. Nicht Teil der ersten Fassung.

### E · Barcodes und QR-Codes (mit Prüfung)

- **Lesen:** `BarcodeDetector` (Chrome Android / Android-WebView) wo vorhanden; sonst eine kleine Bibliothek auf dem Gerät
  (z. B. ZXing als WebAssembly) im Paket, mit Pin wie die übrigen Fremdbausteine – Wahl nach Größe, F5.
- **Was nützt der Familie:**
  - **GiroCode (EPC-QR)** auf Rechnungen → Empfänger, IBAN, Betrag, Verwendungszweck als Vorschlag für Frist/Zahlung.
  - **Medikationsplan** (Data-Matrix auf dem bundeseinheitlichen Plan) → nur anzeigen und durchsuchbar, Gesundheitsschutz bleibt.
  - **Sendungsnummern**, **EAN/Artikelnummer** (Garantie, Kassenbon), **Links** (nur angezeigt, Öffnen auf Tipp mit Warnung).
- **Prüfung** (Klaus' Wunsch): Bilder **mit** gefundenem Code bekommen in der Nacharbeit den Prüfkern (`dateiPruefen`) und eine
  Textprüfung des Code-Inhalts (Steuerzeichen, Skript-/Datenadressen, Befehle an eine KI). Ergebnis am Eintrag
  (sauber/Warnung/ungeprüft). Bilder **ohne** Code aus eigener Quelle werden nicht geprüft (spart Rechenzeit) – Einstellung F2.
- Code-Inhalt geht an die Assistenz/KI nur als markierter Fremdtext.

### F · Teilen und Senden ohne Ort

- Beim Teilen, Mailen, Paket und Tresor-Leser kann der Ort (GPS) mitgehen. Vorschlag: beim Senden nach außen Metadaten mit
  `reinigung.js` entfernen (Original in der Akte bleibt unverändert), Haken „Aufnahmeort mitsenden“ ab Werk aus. Frage F6.

### G · Proben

- `scripts/run-bild-metadaten-tests.mjs`: erzeugte Probebilder (JPEG/PNG/WebP/HEIC-Kopf) mit bekannten EXIF/XMP/GPS-Werten,
  kaputte und zu große Blöcke, Bild ohne Metadaten.
- `scripts/run-kennzeichen-tests.mjs`: Muster, OCR-Verwechslungen, Ähnlichkeit, nur erfundene, ungültige Kennzeichen.
- UI-Proben (`node tests/run-ui.mjs bilder`): Foto ablegen ohne Warten, Nacharbeit läuft und meldet Vorschlag, Vorschlag annehmen,
  Neustart mitten in der Nacharbeit, Barcode-Fund mit Prüfstand, Teilen ohne Ort. Mit `soll()`, keine Prüfung abschalten.
- Zeitmessung je Schritt als Teil der Probe (C, „Messen zuerst“).
- Am Gerät (ungeprüft, bis Klaus es sagt): echte Handyfotos mit GPS, HEIC vom iPhone, Kennzeichen draußen bei Tag/Nacht,
  großer Stapel mit Android-Dienst.

## Reihenfolge

1. A Vorschau → Klaus' Ja.
2. B Fotos + Metadaten (größter Nutzen, wenig Risiko).
3. C Nacharbeit im Hintergrund (beseitigt die Wartezeit für alles, auch Dokumente).
4. D1–D4 Kennzeichen und Zuordnung.
5. E Barcodes mit Prüfung.
6. F Teilen ohne Ort.
7. D5 Bildbeschreibung, wenn gewünscht.

Ausgabe gesammelt als 2.28.66 nach B–F (oder in zwei Fassungen, wenn Klaus früher testen will). `lib/app-stand.ts` (Landkarte)
und `lib/fassungen.ts` je Stufe nachziehen.

## Fragen an Klaus

- **F1 Metadaten-Leser:** eigener Leser in der Familienakte (schnell gebaut) – und später nach Workflow PDF zurückgeben, damit
  alle Pro-Apps denselben haben? Vorschlag: ja, erst hier, dann als gemeinsamer Baustein.
- **F2 Prüfung:** Bilder ohne Barcode aus eigener Quelle gar nicht prüfen; mit Barcode immer im Hintergrund. Einstellung
  „Bilder prüfen: nur mit Code / immer / nie“? Vorschlag: „nur mit Code“ ab Werk; E-Mail-Anhänge wie bisher nach Wahl.
- **F3 Android ML Kit** für Text und Barcodes (deutlich besser bei Kennzeichen, auf dem Gerät, macht die APK einige MB größer,
  Bibliothek von Google)? Oder bei Tesseract/Web bleiben? Vorschlag: erst Tesseract messen, dann entscheiden.
- **F4 Ortsnamen:** nur eigene Orte (offline) – oder auf Wunsch einen Ortsnamen aus dem Netz holen?
- **F5 Barcode-Bibliothek** für Windows/PWA (ZXing-WebAssembly, rund 1 MB) ins Paket aufnehmen?
- **F6 Beim Senden** Ort und Kameradaten ab Werk entfernen?
- **F7 Fotos ohne Text** (z. B. Auto von außen ohne lesbares Schild): trotzdem einem Fahrzeug zuordnen lassen per Wahl im
  Ablegen-Fenster („Gehört zu …“)? Vorschlag: ja.
- **F8 Bildbeschreibung (Modell, 256 MB)** überhaupt in die Akte? Vorschlag: später, nur auf Knopf.
