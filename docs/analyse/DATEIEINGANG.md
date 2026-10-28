# Paket D: Dateieingang mit erfundenen Testdateien

Stand 2026-10-28, gemessen mit Playwright (Chromium, Desktop 1440 px) gegen den gebauten Stand
von `main` (`vite build` + `vite preview`), mit Beispielfamilie im Browser-Datentresor.
Probe: `node tests/run-ui.mjs dateieingang` (76 grün · 0 rot). Testdateien und ihre Herkunft:
`tests/testdateien/README.md` (`node tests/testdateien/erzeugen.mjs` erzeugt sie neu).

Zeichen: ✅ funktioniert · ⚠️ teilweise/mit Einschränkung · ❌ defekt · 🔒 in dieser Umgebung
gesperrt · ❓ nicht gemessen bzw. Absicht unklar.

## 1. Die Wege in die Akte

| Weg | Ort | Ergebnis | Befund |
| --- | --- | --- | --- |
| Dateiauswahl (mehrere Dateien) | Eingangszentrale → „Datei auswählen“ | ✅ | Ohne Typfilter: alle 14 Testdateien werden angenommen und analysiert. |
| Drag & Drop (mehrere Dateien) | Eingangszentrale, Ablagefläche | ✅ | Gleiche Verarbeitung wie die Dateiauswahl (`queueCentralIntakeFiles`). |
| Dateiauswahl (eine Datei) | Startseite „Neue Dokumente erfassen“, Dialog „Neue Unterlage prüfen“ | ⚠️ | Nur **eine** Datei; `accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip"` – **`.eml` fehlt** in der Liste, obwohl die Eingangszentrale E-Mails versteht (`app/health-portal.tsx` Z. 1427, 3512). Drag & Drop nimmt dort nur die erste Datei. |
| „Dokument fotografieren“ | Eingangszentrale und Startseite | ✅ | Zwei Fotos (PNG + JPG) → Seitenprüfung → „Fertig – PDF erstellen“ → PDF (12 KB) im Dokumenteneingang mit Quelle „PDF aus fotografierten Dokumentseiten“, immer „Prüfung erforderlich“. Ohne verbundenen Tresor Sprung ins Sicherheitscenter. Echte Kamera nicht messbar (Handprüfung). |
| Eingangsordner auswählen / jetzt prüfen | Eingangszentrale | ✅ (gestellt) 🔒 (Handy, Firefox, eingebettet) | Mit gestelltem `showDirectoryPicker` (Modus `read`): neue Dateien landen in der Warteschlange, schon bekannte (Name + Größe) werden übersprungen, zweiter Lauf findet nichts Neues. Liest **nur die oberste Ebene** (`scanDirectory`, `app/local-vault.ts` Z. 311), keine Unterordner. Braucht Chrome/Edge am PC. |
| OneDrive-Familienordner prüfen | Eingangszentrale | ⚠️ / ❓ | Ohne Verbindung: Hinweis und Sprung ins Sicherheitscenter (✅). Mit Verbindung liest die App den Unterordner `00_Posteingang` des OneDrive-Tresors – nicht gemessen (braucht einen schreibbaren echten Ordner). |
| „Bestand prüfen“ (Inventar) | Dokumente → Bestand prüfen | ✅ (gestellt) | Gestellter Hauptordner mit 3 Dateien + Unterordner mit 2 Dateien: **5 analysiert, 3 empfohlen, 2 noch prüfen, 0 Dubletten**. Unterordner werden einbezogen, DOCX-Inhalt wird gelesen („Dateiname oder lesbarer Inhalt deutet auf … Vertrag … hin“), „Ansehen“ zeigt den Text der TXT-Datei, „Dateien archivieren“ bleibt ohne Archivdatenträger gesperrt mit klarer Meldung. |
| E-Mail-Datei (.eml) mit Anhängen | Eingangszentrale → „Anlagen in Warteschlange prüfen“ | ✅ | Absender, Betreff als Titel, Anlagenzahl, mögliche Frist („bis zum 05.11.2026“) und Aufgabe („Antwort erforderlich“) werden erkannt. PDF-, PNG- und TXT-Anlagen werden als eigene Eingänge herausgelöst (`extractEmlAttachments`); beim Speichern verknüpft die App Mutter und Anlage mit „enthält Anlage“ (Code gelesen, Verknüpfung nicht gemessen). |
| ZIP | alle Wege | ⚠️ | Wird als „Archivdatei“ erkannt und **nicht entpackt**; Inhalt wird nicht gelesen (Lebensbereich „Archiv“). Speichern als ganze Datei möglich. |
| Outlook-E-Mail (.msg) | alle Wege | ⚠️ / ❓ | Die App liest `.msg` nur als UTF-16-Text (`extractDocumentIntakeTextHint`). Die Minimal-Testdatei wird gelesen (Frist erkannt, Energie & Versorgung). Eine **echte** Outlook-Datei (OLE/CFB-Container) konnte ohne Bibliothek nicht erzeugt werden: dort kommen nur Textfetzen zwischen Binärdaten an (❓, Handprüfung mit einer echten Datei). |
| Teilen vom Handy / andere Apps | – | ❌ (fehlt) | Kein `share_target`, kein Android-Intent. Siehe Paket G (`DATEI-EINGANG-GERAETE.md`). |

## 2. Dateitypen in der Eingangszentrale (Dateiauswahl)

| Testdatei | Erkannt als | Inhalt gelesen? | Lebensbereich (Vorschlag) | Status | Anmerkung |
| --- | --- | --- | --- | --- | --- |
| `Nebenkostenabrechnung_2025_Arenberg-Hof.pdf` (Textebene) | PDF | **nein** | Einkäufe, Rechnungen & Garantien | Prüfung erforderlich | ❌ Falscher Bereich: „rechnung“ (aus „Abrechnung“) wird vor „nebenkosten“ geprüft (`lib/document-intake.ts`, `classifyFile`). PDF-Textebene wird im Eingang nicht gelesen, nur der Dateiname zählt. |
| `Garantiebeleg_Waschautomat_Lavorix.pdf` | PDF | nein | Einkäufe, Rechnungen & Garantien | Prüfung erforderlich | ✅ Bereich „Garantie / Reparatur“, Dokumentenart „Rechnung / Garantie“, vertraulich. |
| `Scan_Garantiebeleg_nur_Bild.pdf` (ohne Textebene) | PDF | nein | Einkäufe, Rechnungen & Garantien | Prüfung erforderlich | ✅ wie oben, keine Texterkennung (OCR) vorhanden. |
| `Foto_Garantiebeleg_Lavorix.png` + `…_Seite2.jpg` | Foto / Bild | nein | Einkäufe, Rechnungen & Garantien | Prüfung erforderlich | ✅ „Mögliche Fotoserie mit 2 Bildern“; Sammelauswahl beider Bilder bietet „Als gemeinsames Scan-Dokument prüfen“. |
| `Mietvertrag_Arenberg-Hof_Nachtrag.docx` | Word-Dokument | **nein** (nur in „Bestand prüfen“) | Verträge & Abonnements | Prüfung erforderlich | ❌ „Mietvertrag“ enthält nicht „miete“ → nicht Haus & Wohnung. In „Bestand prüfen“ wird derselbe Nachtrag mit gelesenem Inhalt **richtig** als Haus & Wohnung eingeordnet. |
| `Nebenkosten_Uebersicht_2025.xlsx` | Tabelle | nein | Haus & Wohnung | Prüfung erforderlich | ✅ |
| `Notiz_Fahrradkauf_Velotrix.txt` | Text / Protokoll | ja | Einkäufe, Rechnungen & Garantien | Prüfung erforderlich | ✅ Text wird gelesen, „Kauf“ erkannt. |
| `Protokoll_Schulausflug.vtt` | Text / Protokoll | ja | Korrespondenz | Prüfung erforderlich | ⚠️ „Elternbrief“ im Text zieht nach Korrespondenz; es gibt keinen Bereich für Schule/Kinder. |
| `Mail_Garantiefall_mit_PDF.eml` | E-Mail (.eml) | ja | Einkäufe, Rechnungen & Garantien | **Bereit zur Übernahme** | ✅ einziger Eingang mit „eindeutig“: Organisation/Vorgang aus Betreff und Text. |
| `Mail_Schulausflug_mit_Foto.eml` | E-Mail (.eml) | ja | Korrespondenz | Prüfung erforderlich | ✅ 2 Anlagen (PNG, TXT) herauslösbar. |
| `Outlook_Nachricht_Stromtarif.msg` | Outlook-E-Mail (.msg) | ja (UTF-16) | Energie & Versorgung | Prüfung erforderlich | ✅ Frist erkannt; echte MSG-Datei siehe oben. |
| `Unterlagen_Umzug_Paket.zip` | Archivdatei | nein | Archiv | Prüfung erforderlich | ⚠️ nicht entpackt. |
| `Programm_nicht_erlaubt.exe` | Unbekannter Dateityp | nein | Archiv | Prüfung erforderlich | ⚠️ **keine Sperre**: lässt sich nach „Zuordnung prüfen“ speichern (Hinweis im Infokasten: „Unbekannte Dateitypen bleiben erhalten und werden zur manuellen Prüfung vorgemerkt“). Der Startseiten-Dialog filtert ihn über `accept`. |
| `.laufzeit/Zu_gross_21MB.pdf` | PDF | nein | – | Prüfung erforderlich | ⚠️ Die Warteschlange nimmt die Datei an und berechnet die Prüfsumme; erst „Geprüft lokal speichern“ lehnt ab: „Die Datei ist größer als 20 MB.“ (`saveLocalDocument`, `app/local-vault.ts` Z. 2496). Die Grenze steht nur im Startseiten-Dialog („höchstens 20 MB“). |

## 3. Zuordnung, Dubletten, Vorgang

| Prüfung | Ergebnis | Befund |
| --- | --- | --- |
| Zuordnungsvorschlag (Lebensbereich, Dokumentenart, Datenschutz, Bereich) | ✅ | Vier Karten, jede über das Menüsymbol änderbar (Liste + eigene Bezeichnung), Kennzeichnung „von dir gewählt“ / „Vorschlag der Software“. Beispiel: Garantiebeleg → Einkäufe · Rechnung / Garantie · vertraulich · Garantie / Reparatur, Vertrauensgrad „wahrscheinlich“. |
| Dublette: gleicher Name + gleiche Größe gegen den Bestand | ✅ | Warteschlange: „Mögliche Dublette: vorhandenes Dokument zuerst vergleichen.“ Dialog: Dublettenkasten mit Link „Vorhandenes Dokument … öffnen“ und Haken **„Trotzdem übernehmen“**. Speichern ohne Haken wird abgewiesen, mit Haken legt die App eine zweite Kopie ab. |
| Dublette: gleicher Inhalt, anderer Name, im selben Stapel | ✅ | „Mögliche Dublette innerhalb dieser Auswahl – bitte vergleichen.“ (Prüfsumme je Stapel). |
| Dublette: gleicher Inhalt, anderer Name, später hinzugefügt | ❌ | Warteschlange und Dialog zeigen **keine** Warnung (nur Name + Größe werden gegen den Bestand verglichen). Erst der Tresor erkennt die Prüfsumme beim Speichern: „Mögliche Dublette: ‹ID›. Bitte das vorhandene Dokument zuerst vergleichen oder die bewusste Übernahme bestätigen.“ – **und es gibt im Dialog keinen Weg, diese Übernahme zu bestätigen** (der Haken „Trotzdem übernehmen“ erscheint nur bei Name+Größe-Treffern). Sackgasse, nur Umbenennen hilft nicht. Fundstelle: `UploadDialog` (`app/health-portal.tsx` Z. 3500/3516) und `saveLocalDocument` (`app/local-vault.ts` Z. 2499). |
| Vorgangsvorschlag („Dieses Dokument passt wahrscheinlich zu …“) | ❓ | Erscheint nur, wenn ein vorhandener Vorgang zu Dateiname/Notiz passt (`suggestIncomingDocumentContext`). Mit den Testdateien kam kein Treffer; die Logik ist durch `scripts/run-context-linking-tests.mjs` abgedeckt. |
| Sammelaktionen | ✅ | Zurückstellen → Weiterbearbeiten; zwei Häkchen → „Nicht übernehmen“ (bleibt in der Liste, nichts gelöscht). |

## 4. Nach der Übernahme

| Prüfung | Ergebnis | Befund |
| --- | --- | --- |
| Ablage im Tresor | ✅ | `Me_Myself_and_I_Familienakte/01_Dokumente/‹Bereich›/‹Datum›_‹ID-8›_‹Dateiname›`, Register `00_Register/Familienakte_Register.json` (Dokument, Verknüpfungen, Prüfprotokoll „Dokument erfasst“). Scan-Originale optional unter `‹Bereich›/Scan-Originale/‹ID›/`. |
| Liste unter der Eingangszentrale | ✅ | Zeigt Titel, Bereich, Datum, Größe, Pfad, Hinweise; Statusknöpfe. |
| Statuswechsel | ✅ | hochgeladen → „Abgleich vormerken“ → „Als geprüft bestätigen“ → „Als eingearbeitet bestätigen“. |
| Dokumentenbibliothek, Suche | ✅ | Suchfeld „Titel, Dateiname, …“ findet „Lavorix“; Startseitensuche ebenso. |
| „Was gibt’s Neues?“, Cockpit | ✅ | Neue Unterlage erscheint; Cockpit lädt ohne Fehler. |
| Vorschau (Original öffnen) | ✅ am PC · ❌ offline/eingebettet | Am PC: neues Fenster mit `blob:`-Adresse. Eingebettet (claude.ai) oder bei blockiertem Fenster: Vorschau in der Seite; PDFs dort über **pdf.js von cdnjs** (`app/file-viewer.tsx`) – im Prüfbehälter ohne Netz `ERR_TUNNEL_CONNECTION_FAILED`, also keine PDF-Vorschau ohne Internet. Für PWA/APK/Windows muss pdf.js ins Paket. |
| Löschen / Archivieren einzelner Dokumente | ❓ / fehlt | Es gibt **keinen Knopf**, ein einzelnes übernommenes Dokument aus dem Tresor zu entfernen (nur „Beispieldaten entfernen“ für den ganzen Beispielsatz, „Nicht übernehmen“ in der Warteschlange und „Dateien archivieren“ als Kopie in „Bestand prüfen“). Das ist die Absicht des Freundes („Nicht übernehmen bedeutet niemals löschen“), für eine Fehlablage aber eine Lücke. |

## 5. Die wichtigsten Befunde aus Paket D

1. **Sackgasse bei Inhalts-Dubletten:** Eine Datei mit gleichem Inhalt und anderem Namen wird im Dialog nicht gewarnt, beim Speichern vom Tresor aber abgewiesen – ohne Bestätigungsweg. (`app/health-portal.tsx` Z. 3500, `app/local-vault.ts` Z. 2499)
2. **Die Eingangszentrale liest PDF-, DOCX- und XLSX-Inhalte nicht**, nur Dateinamen (und Text bei TXT/VTT/EML/MSG). „Bestand prüfen“ kann DOCX lesen; der Dokumenteneingang nutzt das nicht. Dadurch landen „Nebenkostenabrechnung“ unter Einkäufe und „Mietvertrag“ unter Verträge statt Haus & Wohnung (Regelreihenfolge und fehlende Wortformen in `classifyFile`).
3. **20-MB-Grenze und nicht erlaubte Typen werden erst spät oder gar nicht abgefangen:** die Warteschlange nimmt 21 MB an, erst der Speicherbefehl lehnt ab; `.exe` lässt sich über die Eingangszentrale speichern.
4. **Startseiten-Dialog ohne `.eml`** in der Dateiauswahl und nur eine Datei je Vorgang; die Eingangszentrale ist der vollständige Weg.
5. **Offline-Lücken:** PDF-Vorschau in der Seite hängt an cdnjs; Eingangsordner liest keine Unterordner; ZIP wird nicht entpackt; kein Teilen-Ziel vom Handy.

## 6. Nicht gemessen

- Echte Kamera auf dem Handy („Dokument fotografieren“ mit Live-Aufnahme), echte Ordnerauswahl am PC (nur gestellte Handles), OneDrive-Ordner mit echter Verbindung.
- Echte Outlook-MSG-Datei (OLE-Container).
- Verknüpfung „enthält Anlage“ zwischen E-Mail und gespeicherter Anlage (nur im Code gelesen).
- Firefox/Safari (kein `showDirectoryPicker`, dort 🔒 für alle Ordnerwege).
