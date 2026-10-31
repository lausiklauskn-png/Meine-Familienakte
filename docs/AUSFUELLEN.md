# Ausfüllen mit Workflow PDF (Sitzung F, 2026-10-31)

Klaus: „scanne ich in der Familienakte Dokumente ein, die ausgefüllt werden müssen … das komplette Programm von Workflow PDF … Felder
erkennen mit oder ohne KI … beschriften … wieder zurücksenden mit Unterschrift“ · Eingabe-Speicher: „textunterstützender Speicher …
Autoausfüllung. Ausschalten oder einschalten.“

## Bedienung

1. **Unterlage → „Ausfüllen“** (Dokumentenbibliothek: Knopf auf der Karte; Eingangszentrale: Knopf in der Zeile). Geht mit PDFs und
   Fotos (JPEG, PNG, WebP). **Seit 2.28.5** auch geschützte Gesundheitsunterlagen (Klaus 2026-10-31) — dort ohne „Mit KI benennen“
   (nichts geht an eine KI); die ausgefüllte Fassung trägt die Angaben des Originals mit und bleibt geschützt.
   **Direkter Einstieg (2.28.5):** Eingangszentrale → **„Formular scannen und ausfüllen“** → Scanner von Workflow PDF → der Scan
   liegt als Unterlage (Bereich „Formular“) in der Akte und das Ausfüllen öffnet sich.
2. **Felder setzen**
   - **Felder erkennen** – offline: Linien, Rahmen, Kästchen (Workflow PDF `erkennung.js`), Beschriftung aus der Textebene; bei Scans
     ohne Textebene liest die Texterkennung (Tesseract, auf dem Gerät) die Beschriftungen. Echte Formularfelder eines PDF werden
     beim Öffnen übernommen.
   - **Mit KI benennen** – über denselben Weg wie „Mit KI arbeiten“: nur Text (nummerierte Eingabestellen mit Lage und dem Text
     daneben, Seitentext), **keine eingetragenen Werte, kein Bild**. Unkenntlich über Modul 25 + Namen der Akte + Namensmuster;
     Text, der auf der Seite nicht zu sehen ist, fällt vorher weg (Workflow PDF `reinigung.js`). Vorschau „Das sieht die KI“,
     dann ChatGPT/Claude öffnen oder kopieren, Antwort (JSON) einfügen → Benennungen übernommen, Platzhalter zurückgesetzt.
   - **Neues Feld** – Art wählen (Text, Datum, Kästchen, Unterschrift, E-Mail, Telefon), auf die Seite tippen. Ziehen verschiebt,
     der Punkt unten rechts ändert die Größe; Beschriftung, Art, mehrzeilig und Löschen im Kasten darüber.
   - **Neu scannen** – Scanner von Workflow PDF (Ecken, gerade ziehen, Filter, Texterkennung → PDF mit Textebene). Der Scan wird
     die Vorlage; gespeichert wird er mit der ausgefüllten Fassung.
3. **Ausfüllen**
   - **Angaben aus der Akte**: Person wählen → **Vorbelegen** füllt leere Felder (Name, Vorname, Nachname, Geburtsdatum und, falls
     an der Person vorhanden, Anschrift/E-Mail/Telefon). Vorschläge sind **gelb**, bis man sie ändert.
     **Anschrift und Kontakt eintragen (2.28.5):** Person öffnen (z. B. über die Suche) → in der Detailansicht **„Anschrift und
     Kontakt“** aufklappen → Straße, PLZ, Ort, E-Mail, Telefon → Speichern. Bleibt im Register auf dem Gerät (`lib/person-kontakt.ts`).
   - **Eingabe-Speicher**: was in ein Feld getippt und gespeichert wurde, merkt die Akte je Feldart (E-Mail, Telefon, Straße, PLZ/Ort …;
     sonst je Beschriftung). Beim nächsten Mal genügen die ersten Buchstaben („to“ → „tommy…“). Schalter **„Eingaben merken und
     vorschlagen“** an/aus, **„Gemerkte Eingaben löschen (N)“**, in der Vorschlagsliste „Diese Vorschläge löschen“. Kästchen und
     Unterschriften werden nie gemerkt.
   - **Unterschrift**: Feld antippen, mit Finger/Stift/Maus zeichnen. **„Diese Unterschrift verschlüsselt merken“** mit eigenem Passwort
     (mind. 8 Zeichen) je Person oder „Ich“; später „Einsetzen“ mit dem Passwort. Falsches Passwort → Hinweis, Feld bleibt offen.
4. **Ausgabe**: **Festes PDF** (Einträge Teil der Seite) oder **ausfüllbares PDF** (echte Formularfelder) — als **neue Unterlage**
   „<Name> (ausgefuellt JJJJ-MM-TT).pdf“ im selben Bereich, mit denselben Verknüpfungen. **Das Original bleibt unverändert.**
   Danach **Teilen** (Teilen-Fenster des Geräts, sonst Herunterladen).
5. **Später ausfüllen (vormerken)**: merkt die Felder am Original und setzt „Muss noch ausgefüllt werden“ → Cockpit-Kasten
   „Muss noch ausgefüllt werden“, ein Tipp öffnet das Ausfüllen. „Vormerkung entfernen“ nimmt es zurück.

Marken an der Unterlage: „Muss noch ausgefüllt werden“ (Original, vorgemerkt) · „Ausgefüllt“ (Original, Fassung erstellt) ·
„Ausgefüllte Fassung“ (die neue Unterlage).

**Mit KI arbeiten** liest jetzt auch **Fotos und gescannte PDF-Seiten** (Texterkennung auf dem Gerät, höchstens 5 Seiten) und
schickt den Text unkenntlich mit; die Liste sagt „per Texterkennung gelesen — bitte in der Vorschau prüfen“.

## Aufbau

| Teil | Datei |
| --- | --- |
| Kern von Workflow PDF, **byte-1:1** (Scanner, Bild, Blatt, ZIP, Erkennung, Export, Reinigung, Schloss, pdf-lib, fontkit, Noto, Scanic, Tesseract DE/EN/RU) | `public/wfpdf/` · Pins `public/wfpdf/HERKUNFT.json` · Nachziehen `node tools/wfpdf-nachziehen.mjs` (Klon `../Workflow-PDF` oder `WFPDF_KLON=…`) — **nie von Hand ändern** |
| Lader und Rückrufe (Familienakte-eigen) | `app/wfpdf-kern.ts` |
| Scanner-Stil in Familienakte-Farben (aus BookLedgerPro übernommen) | `public/wfpdf-fa/scanner.css` |
| Fenster | `app/ausfuellen-dialog.tsx` |
| Reine Rechnung (Feldart, Vorbelegen, Eingabe-Speicher, Stand, KI-Auftrag/Antwort) | `lib/ausfuellen.ts` |
| Ablage | `app/local-vault.ts`: `ausfuellen` am Dokument, `ausfuellSpeicher`/`ausfuellUnterschriften` im Register |
| Proben | `scripts/run-ausfuellen-tests.mjs` (Pins + 8 Fälle, in `npm run check`), `tests/ui/ausfuellen.test.mjs` (17), `tests/ui/ausfuellen-foto.test.mjs` (8: Foto mit Texterkennung, ausfüllbares PDF, Scanner öffnet), `tests/ui/ki-ocr.test.mjs` (4) |

Die PWA legt Texterkennung und Blatterkennung (zusammen ~25 MB) **nicht** beim Installieren in den Vorrat (`scripts/build-pwa.mjs`),
sondern beim ersten Gebrauch.

## Grenzen (benannt)

- **Nicht am Tablet, nicht am Windows-PC gemessen.** Teilen in der Android-App (WebView) und unter Windows ist ungemessen; der Testbrowser
  hat kein Teilen und lädt herunter.
- **Das Register ist nicht verschlüsselt.** Der Eingabe-Speicher liegt dort lesbar wie die übrigen Angaben der Akte. Nur Unterschriften sind
  verschlüsselt (Schloss aus Workflow PDF, PBKDF2 600 000 Runden + AES-GCM). Passwort vergessen = Unterschrift neu zeichnen.
- **Vorbelegen** kennt an Personen heute nur Name und Geburtsdatum (mehr steht im Datenmodell nicht). Anschrift/E-Mail/Telefon kommen
  aus dem Eingabe-Speicher.
- **KI-Weg nur mit Text** (kein Seitenbild, wie „Mit KI arbeiten“). Mit einer echten KI-Antwort nicht gemessen.
- **Erkennung**: eine Unterschriftslinie mit Beschriftung **darunter** heißt „Feld …“ (Beschriftung wird links/oben gesucht).
- Höchstens 20 Seiten im Fenster. Fotos werden zu einem PDF in A4-Breite.
- **Einzeldatei** (`dist-single`): der Kern liegt nicht darin — „Felder erkennen“ und „Speichern“ melden „Baustein von Workflow PDF fehlt“.
- **App-Größe**: der Kern bringt ~26 MB ins Paket (APK, Windows).
- **Befund beim Bau:** Chromium im Prüf-Behälter legt im Browser-Speicher (OPFS) keine Datei mit Umlaut im Namen an (TypeMismatchError).
  Deshalb heißt die Fassung „ausgefuellt“. Ob echte Geräte das auch tun, ist nicht gemessen; vorhandene Uploads mit Umlauten sind davon
  unabhängig (nicht angefasst).

## Einzeldatei (2.28.5)

Die Einzeldatei (`scripts/build-single-file.mjs`) trägt den Kern fürs Ausfüllen eingebettet, byte-1:1: pdf-lib, Export, Erkennung,
Reinigung, Schloss (~0,6 MB). **Nicht** dabei: Scanner und Texterkennung (zu groß) und die Noto-Schrift — in der Einzeldatei gehen
also PDFs mit Textebene; Fotos bekommen Felder aus den Linien, aber keine Beschriftung; Einträge außerhalb von Latin-1 gehen dort nicht.

## Proben 2.28.5

`tests/ui/ausfuellen-gesundheit.test.mjs` 5 · `tests/ui/formular-scannen.test.mjs` 6 (Scanner im Prüfbrowser durch einen Stellvertreter
ersetzt, der ein erfundenes PDF liefert) · `tests/ui/person-kontakt.test.mjs` 6 · `tests/ui/einzeldatei.test.mjs` 6 ·
`scripts/run-ausfuellen-tests.mjs` (+3 Kontakt) · Gegenprobe `node tests/gegenprobe-sitzung-b.mjs` 9/9.
