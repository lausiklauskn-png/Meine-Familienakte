# Paket B: Beispiele, Tipps und Rückfragen in der Familienakte

Stand 2026-10-28, gelesen im Quelltext von `main` (Version 2.28.1 als Browser-App). Die Tabelle steht
auch als `BEISPIELE-TIPPS-RUECKFRAGEN.csv`. Zeilennummern beziehen sich auf `app/health-portal.tsx`,
wenn nicht anders angegeben.

## Zusammenfassung

| Art | Stellen | davon regelbasiert (Wortmuster) | davon „KI vorgesehen“ (nur Text, kein Code) | ohne Automatik (reiner Hinweis) |
| --- | --- | --- | --- | --- |
| Beispiele (Platzhalter „Zum Beispiel …“, Beispielsätze, Suchbeispiele) | 17 | 6 (Suche, Tagebuch, Assistenzfrage, Dokumentenart, Scan-Hinweis, Hilfe-Suchbeispiele) | 0 | 11 |
| Tipps (ⓘ-Knöpfe mit `UI_HELP`, Hinweiskästen, Hilfeseite) | 89 ⓘ-Knöpfe mit 51 Texten + 6 Hinweiskästen + 23 Hilfe-Abschnitte | 0 (reine Erklärungen) | 1 („Aktuell recherchiert … noch nicht sicher eingerichtet“) | alle übrigen |
| Rückfragen (Bestätigungsdialoge, Eingabe-Dialoge, fachliche Rückfragen) | 21 `askConfirm`/`askPrompt` + 5 fachliche Rückfragen | 5 fachliche (Tagebuch-Rückfrage, offener Punkt, „scheint erledigt“, Dublette, Zuordnungsvorschlag) | 0 | 21 (Bestätigungen) |

**Kernbefund:** Hinter keinem Beispiel, Tipp oder keiner Rückfrage steckt eine KI. Alle automatischen
Auswertungen sind **feste Wortlisten und reguläre Ausdrücke** in `lib/`. „KI“ kommt nur in drei Formen vor:

1. **„Mit ChatGPT arbeiten“** (Zeile 3344–3361): Die App baut einen Auftragstext und kopiert ihn. Der
   Nutzer öffnet chatgpt.com selbst. Text: „Hier wird keine OpenAI-API verwendet.“
2. **Assistenz „Aktuell recherchiert“** (`lib/family-assistant.ts` Zeile 124): fest `not_configured`,
   Meldung „Aktuelle Internetrecherche ist in dieser privaten Testfassung noch nicht sicher angebunden.“
3. **Systemprüfung**: `lib/system-check-manifest.json` nennt „Memory, Erinnerungsprotokoll und
   interaktiver KI-Assistent v1“ als fertig; gemeint ist der regelbasierte Assistent. „Kostenpflichtige
   APIs“ stehen in `pausedCapabilities`. Die Versionshistorie (Zeile 2835–2866) betont in jeder Version,
   dass **kein** OpenAI-Schlüssel und keine externe KI eingebaut wurde.

Die Texte passen fast überall zur Funktion. Abweichungen stehen unten unter „Text ≠ Funktion“.

## Beispiele (Platzhalter und Beispielsätze)

| Nr. | Text (gekürzt) | Ort | passt? | Auswertung dahinter |
| --- | --- | --- | --- | --- |
| B1 | „Zum Beispiel: Zeige mir meine Krankenkasse-Schreiben …“ | Suchfeld, Kopfleiste, Z. 1090 | ja | **Regeln:** `interpretFamilySearchQuery` (`lib/family-search.ts` Z. 55–78), 15 Absichten mit festen Auslösewörtern („krankenkasse“, „rente“, „tüv“ …); Anzeige „Verstanden als:“ (Z. 1654) |
| B2 | „Zum Beispiel: Welche Unterlagen fehlen für meine Reklamation und wie formuliere ich die E-Mail?“ | Assistenz, Frage, `app/assistant-center.tsx` Z. 121 | ja | **Regeln:** `buildAssistantAnalysis` (`lib/family-assistant.ts`): Wortüberlappung mit Vorgängen, Muster `/(arzt|termin|…)/`, `/(widerspruch|kündigung|frist|…)/`; Optionen sind feste Sätze |
| B3 | „Person oder Organisation“ (Empfänger) | Assistenz, Entwurf, `assistant-center.tsx` Z. 141 | ja | keine |
| B4 | „Zum Beispiel: Krankenkasse Schreiben Zuschuss“ | Dokument fotografieren, `app/document-scan-dialog.tsx` Z. 140 | ja | **Regeln:** der Hinweis geht als `textHint` in `classifyFile` (`lib/document-intake.ts` Z. 42–66): Wortlisten je Lebensbereich |
| B5 | „Zum Beispiel: Der Elektriker war heute da. Die zweite Lampe flackert weiterhin …“ | Tagebuch, Z. 1491 | ja | **Regeln:** `buildMemoryAnalysis` (`lib/family-memory.ts`): Lebensbereich (Z. 110–127), Ereignisart, offener Punkt (Z. 243–255: „weiterhin“, „aber“, „keine antwort“ …), Aufgabe (Z. 257–260: „muss“, „sollte“ …), Schlagwörter (Z. 263–267) |
| B6 | „Antwort ist freiwillig“ (Rückfrage-Feld) | Tagebuch, Z. 1543 | ja | Antwort fließt als `followUpAnswer` in dieselbe Analyse |
| B7 | „Optional auswählen oder neu eingeben“ (persönlicher Lebensbereich) | Bestand prüfen, Zuordnung, Z. 1702 | ja | keine |
| B8 | „Zum Beispiel Rechnung“ (Dokumentenart) | Bestand prüfen, Z. 1703 | ja | Vorschlag aus `INTAKE_DOCUMENT_TYPES` + Dateiname (`lib/document-intake-metadata.ts`) |
| B9 | „Stichworte durch Komma trennen“ | Bestand prüfen, Z. 1704 | ja | Stichworte werden als Lernsignal gespeichert (`inventoryLearningSignals`) |
| B10 | „Zum Beispiel: Ich selbst, Mutter“ / „Versicherung oder Handwerksfirma“ / „Haus, Auto, Smartphone“ / „Smartphone-Reparatur“ | Bestand prüfen, Person/Organisation/Objekt/Vorgang, Z. 1705–1708 | ja | **Regeln:** `proposeFamilyAssignment` (`lib/family-assignment.ts` Z. 155–230): Punktzahl aus Wortüberlappung und Kennungen, Vertrauen hoch/mittel/niedrig |
| B11 | „Titel, Dateiname, Person, Vorgang, Aktenzeichen …“ | Dokumentenbibliothek, Filter, Z. 3076 | ja | Wortsuche `filterDocumentLibraryItems` |
| B12 | „Nur bestätigte eigene Notiz eintragen“ | Cockpit, Notiz, Z. 3237 | ja | keine; Notiz wird nach Bestätigung angehängt |
| B13 | „Zum Beispiel: Antwort an Krankenkasse“ / „Schreiben vom 07.10.2026“ / `PER-000001` / `OBJ-000001` / `VORG-000001` / `DOC-000001 oder lokale Dokument-ID` | Fristen und Aufgaben, Formular, Z. 3300 | teils | keine; die Kennungs-Platzhalter verlangen vom Nutzer technische IDs (siehe „Text ≠ Funktion“) |
| B14 | „Zum Beispiel: Ergänze im Bereich Fahrzeuge einen Unterpunkt für TÜV-Termine.“ | „Mit ChatGPT arbeiten“, Z. 3358 | ja | keine Auswertung; Text wird in einen Auftrag eingebettet und kopiert |
| B15 | „Bezeichnung des neuen Vorgangs“ / „Zum Beispiel: Antwort auf meine Anfrage vom 02.10.2026“ | Neue Unterlage prüfen und lokal ablegen, Z. 3518–3520 | ja | keine |
| B16 | „Was hat nicht funktioniert? Kurzer Hinweis genügt.“ | Praktische Abnahme, `app/practical-acceptance.tsx` Z. 40 | ja | keine |
| B17 | Suchbeispiele „Schreiben der Krankenkasse zum Zuschuss“, „Rechnung der Waschmaschine“, „Mietvertrag Pustelblumenweg“, „Impfpass und Vorsorge“ | Hilfe, Z. 2124 | ja | wie B1 |

## Tipps (ⓘ-Knöpfe, Hinweiskästen, Hilfe)

Alle 89 ⓘ-Knöpfe rufen `InfoPopover` mit einem Text aus `UI_HELP` (`lib/ui-help.ts`, 51 Einträge). Die
Hilfeseite listet dieselben 51 Texte unter „Hilfe zu Karten und Funktionen“. Es gibt keinen Text, der
eine Auswertung ankündigt, die es nicht gibt. Besonders deutliche Hinweise:

| Nr. | Text (gekürzt) | Ort | passt? | Bemerkung |
| --- | --- | --- | --- | --- |
| T1 | „Die lokale interaktive Suche erkennt häufige Alltagssätze und ordnet sie einem passenden Bereich zu.“ | `UI_HELP` „Wie suche ich etwas?“, Hilfe Z. 2124 | ja | Regeln, siehe B1 |
| T2 | „Gesucht wird nur in bereits vorhandenen Angaben; PDF- oder Word-Inhalte werden nicht automatisch gelesen und es werden keine Treffer erfunden.“ | Hilfe Z. 2124 | ja | **Wichtig für Paket C:** keine Volltexterkennung, keine OCR |
| T3 | „Die Familienakte schlägt Werte vor. Du kannst vorhandene Einträge wählen oder einen neuen Vorschlag erfassen.“ | `UI_HELP` „Zuordnung prüfen und bestätigen“ | ja | Regeln, siehe B10 |
| T4 | „Die Assistenz prüft zuerst vorhandene Vorgänge, Relationen und freigegebene Dokumente. Sie legt nichts automatisch an.“ | `UI_HELP` „Was möchtest du klären?“ | ja | Regeln, siehe B2 |
| T5 | „Eine aktuelle Internetrecherche ist in dieser privaten Testfassung noch nicht sicher eingerichtet und wird deshalb ausdrücklich als nicht verfügbar angezeigt.“ | Hilfe, Abschnitt Assistenz, Z. 2136 ff. | ja | **einzige Stelle, die eine künftige Online-/KI-Recherche andeutet**; Code: `research.status = "not_configured"` |
| T6 | „Beschreibe deinen Wunsch. Die Familienakte erstellt daraus einen passenden Auftrag für ChatGPT.“ | `UI_HELP` „Familienakte mit ChatGPT ändern“ | ja | Auftrag = Schablone + Nutzertext; keine Schnittstelle |
| T7 | „Es erfolgt keine kostenpflichtige Online-Analyse.“ | `UI_HELP` „Neue Unterlage prüfen und lokal ablegen“ | ja | Eingangszentrale nutzt nur `classifyFile`-Wortlisten |
| T8 | „Aus Dokumenten erkannte Angaben werden hier nicht automatisch übernommen. Medizinische und behördliche Fristen benötigen immer deine Bestätigung.“ | `UI_HELP` „Frist oder Aufgabe anlegen“ | ja | Fristvorschläge aus `findPossibleDeadline` (`lib/central-intake.ts` Z. 222) nur als Hinweis |
| T9 | „Nach der Assistenzfreigabe wird die Schaltfläche wieder weiß.“ / Assistenzfreigabe-ⓘ: „… nicht an einen kostenpflichtigen externen Dienst übertragen“ | Bestand prüfen, Z. 2096, 2104 | ja | Freigabe setzt nur die Marke `assistantReleased`; danach liest der regelbasierte Assistent den Titel |
| T10 | „Die vorhandene Spracherkennung des Browsers kann je nach Browser eine Internetverbindung und Verarbeitung durch dessen Anbieter benötigen.“ | Hilfe, Mikrofon, Z. 2136 ff. | ja | ehrlich: Web Speech API sendet Audio an Google/Apple; wichtig für den Internetschalter |
| T11 | „Diese Fragen gehören ausschließlich zu bereits bestätigten Erinnerungen.“ | `UI_HELP` „Offene Memory-Punkte“ | ja | |
| T12 | „Die Strukturierung verwendet lokale, nachvollziehbare Regeln und keinen kostenpflichtigen API-Schlüssel.“ | Hilfe, Tagebuch | ja | bestätigt den Befund „Regeln, keine KI“ |
| T13 | Beispieldaten-Hinweis „Alle Daten sind Beispieldaten.“ mit Knopf „Beispieldaten entfernen“ | Kopfbereich jeder Seite, Z. 1093–1094 | ja | neu aus PR #2 |
| T14 | Hinweiskasten „Antwort der Krankenkasse steht noch aus – Die Beispielanfrage vom 02.03.2026 ist dokumentiert.“ | Gesundheit → Krankenkasse & Leistungen, Z. 3319 | **nein** | fest verdrahteter Beispieltext aus `app/health-data.json`, unabhängig vom Tresor (siehe unten) |
| T15 | Info-Kasten „Verwende den bereits vorbereiteten und verbundenen Testbestand …“ | Bestand prüfen, Z. 2120 | teils | bezieht sich auf die Entwicklungsumgebung des Freundes (ZIP, „SOFTWARE TESTORDNER“) |
| T16 | Hilfe-Abschnitt „Testakte für Weiterentwicklung“ mit festem Ordner „SOFTWARE TESTORDNER“ | Hilfe, Z. 2140 ff. | teils | Entwicklerwerkzeug, im Browser-Tresor ohne Funktion (keine Ordnerwahl auf Handy/eingebettet) |

Hinweiskästen ohne Auswertung (reine Meldungen): `info-notice` (Z. 2936, allgemeiner Infokasten),
`inventory-process-hint` (Z. 2104), `empty-state`-Leerzustände (rund 25, z. B. „Noch keine Erinnerungen
gespeichert“), `dictation-hint` (Z. 3520), `callout warning` (Z. 3319).

## Rückfragen

### Bestätigungs- und Eingabedialoge (`askConfirm`/`askPrompt`, `app/page-dialogs.tsx`)

Seit PR #3 laufen alle als Dialog in der Seite; eingebettet (claude.ai) funktionieren sie deshalb.

| Nr. | Frage (gekürzt) | Ort | passt? |
| --- | --- | --- | --- |
| R1 | „Alle Beispieldaten entfernen? Entfernt werden nur die erfundenen Beispieleinträge …“ | Beispieldaten entfernen, Z. 523 | ja |
| R2 | „N ausgewählte Dateien als geprüfte Kopie archivieren? Die Originale bleiben unverändert.“ | Bestand prüfen → Dateien archivieren, Z. 783 | ja |
| R3 | „N archivierte Dateien für Bibliothek, Suche und Familienassistent freigeben?“ | Bestand prüfen → Assistenzfreigabe, Z. 794 | ja |
| R4 | „N markierte Testdateien auf ‚Quelle analysiert‘ zurücksetzen? …“ | Bestand prüfen → Dateien zurücksetzen, Z. 806 | ja |
| R5 | „Scan verwerfen? Die aufgenommenen Seiten wurden noch nicht … gespeichert.“ | Dokument fotografieren, `document-scan-dialog.tsx` Z. 93 | ja |
| R6 | „Diesen noch nicht bearbeiteten Memory-Entwurf wirklich löschen?“ | Tagebuch, Entwurfsliste, Z. 960 | ja |
| R7 | „Soll der Status von … wirklich auf ‚…‘ gesetzt werden?“ | Cockpit, To-do-Status, Z. 1021 | ja |
| R8 | „Soll diese Notiz wirklich beim ausgewählten Datensatz ergänzt werden?“ | Cockpit, Notiz, Z. 1027 | ja |
| R9 | „Nur diese Verbindung lösen? Dokument, Erinnerung und Vorgang bleiben vollständig erhalten.“ | Zusammenhänge lösen, Z. 1042 | ja |
| R10 | „Aktuelle Erinnerung wurde noch nicht übernommen. Soll sie jetzt in die Warteschlange gelegt werden?“ | Tagebuch, Seite verlassen, Z. 1481 | ja |
| R11 | „Aktuelle Eingabe verwerfen und das Tagebuch öffnen?“ | Erinnerungsprotokoll auf der Startseite, Z. 1486 | ja |
| R12 | „Soll dieser offene Punkt wirklich auf ‚…‘ gesetzt werden?“ | Tagebuch, offene Punkte, Z. 1596 | ja |
| R13 | `askPrompt` „Titel des Memory-Eintrags“ / „Gespeicherten Text ergänzen oder bearbeiten“ + Bestätigung | Tagebuch, Eintrag bearbeiten, Z. 1607–1611 | ja |
| R14 | „Diesen gespeicherten Memory-Eintrag wirklich löschen? …“ + `askPrompt` „… Bitte VERBLEIBEN, MITLÖSCHEN oder ABBRECHEN eingeben.“ | Tagebuch, Eintrag löschen, Z. 1619–1622 | **teils** – Eingabe eines Großbuchstaben-Worts ist umständlich; am Handy fehleranfällig |
| R15 | „Nur der eindeutig gekennzeichnete Ordner ‚Familienakte_Automatische_Testumgebung_2.28.1‘ wird gelöscht …“ | Testakte, Zurücksetzen, Z. 1954 | ja (Entwicklerwerkzeug) |
| R16 | „N vorbereitete Testdokumente jetzt in das bestehende Testregister übernehmen? …“ | Testakte, Z. 1991 | ja (Entwicklerwerkzeug) |

### Fachliche Rückfragen (aus Regeln erzeugt)

| Nr. | Frage | Ort | Regel dahinter |
| --- | --- | --- | --- |
| F1 | „Eine gezielte Rückfrage“ im Tagebuch, z. B. zur Lebensbereich-Zuordnung | Z. 1543 | `assistantQuestion` (`lib/family-memory.ts` Z. 301): nur wenn die Zuordnung mehrdeutig ist; „höchstens eine Rückfrage“ ist im Selbsttest festgeschrieben (Z. 375) |
| F2 | „Ist die Reparatur inzwischen vollständig abgeschlossen?“ / „Hat sich dieser offene Punkt inzwischen geklärt?“ | Offene Memory-Punkte, Cockpit | `openPointFromText` (Z. 243–255): Muster „teilweise“, „aber“, „weiterhin“, „keine antwort“ … |
| F3 | „Der offene Punkt ‚…‘ scheint erledigt zu sein. Als erledigt markieren?“ | Tagebuch, beim nächsten Eintrag | `lib/family-memory.ts` Z. 348: Wortüberlappung mit offenen Punkten, Vertrauen ab Punktzahl 2 |
| F4 | „Mögliche Dublette“ mit „Trotzdem übernehmen“ | Eingangszentrale | `buildDocumentIntakePlan` (`lib/document-intake.ts` Z. 100): gleicher Dateiname **und** gleiche Größe; `lib/central-intake.ts` Z. 284 setzt `requiresReview` |
| F5 | Zuordnungsvorschlag „Sicher / Wahrscheinlich / Unklar“ mit Auswahl | Bestand prüfen, Z. 1699 | `proposeFamilyAssignment`, Vertrauen aus Punktzahl (`confidenceFor`, Z. 149) |

## Text ≠ Funktion (Abweichungen)

1. **Gesundheit & Arbeit zeigt feste Beispieldaten, nicht den Tresor.** Die Seiten „Diagnosen, AU &
   ICD-Codes“, „Krankenkasse & Leistungen“, „Arbeit & Arbeitgeber“ (Z. 3309–3335, 394–410) lesen
   `app/health-data.json` (statische Datei, 180 Zeilen). Der Knopf „Beispieldaten entfernen“ wirkt dort
   nicht. Der Kasten „Antwort der Krankenkasse steht noch aus“ (T14) bleibt immer stehen. Der Freund hat
   diese Daten offenbar als Vorführung angelegt; ein echter Gesundheitsbereich aus Tresor-Datensätzen fehlt.
2. **Fristen-Formular verlangt technische Kennungen** (B13): Platzhalter `PER-000001`, `OBJ-000001`,
   `VORG-000001`, `DOC-000001`. Ein Laie kennt diese IDs nicht; eine Auswahl aus vorhandenen Datensätzen
   gibt es an dieser Stelle nicht (im Gegensatz zu „Bestand prüfen“, B10).
3. **Memory löschen per Tippwort** (R14): „VERBLEIBEN, MITLÖSCHEN oder ABBRECHEN eingeben“ ist ein
   Behelf für `prompt()`; ein Dialog mit drei Knöpfen wäre die saubere Form.
4. **Entwicklerwerkzeuge in der Nutzeroberfläche** (T15, T16, R15, R16): „Testakte für
   Weiterentwicklung“ und „Automatische Testumgebung“ gehören zur Entwicklung des Freundes
   (Windows-Pfad `G:\01GPT-SOFTWARE\…` in `app/local-vault.ts` Z. 160). Für Klaus’ Tests am Handy
   sind sie ohne Funktion (keine Ordnerwahl).
5. **„KI-Assistent v1“** im Manifest (`lib/system-check-manifest.json`) klingt nach KI; es ist der
   regelbasierte Assistent (T4, T12). Der Name sollte in Paket C als „Regel-Assistent“ eingeordnet werden.

## Folgerung für Paket C

Es gibt keine Stelle, die Dokumentinhalte liest, anonymisiert oder an eine KI übergibt. Vorbereitet
sind nur die **Haken**: die Freigabe-Marke `assistantReleased` (Bestand prüfen), die drei
Datenschutzklassen `allgemein / vertraulich / besonders geschützt` (`INTAKE_PRIVACY_CLASSES`) und die
Maskierung sensibler Einträge (`lib/family-privacy.ts`, `buildSensitiveIds`). Alles Weitere steht in
`KI-UND-ANONYMISIERUNG.md`.
