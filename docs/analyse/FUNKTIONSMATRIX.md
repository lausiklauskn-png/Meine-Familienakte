# Funktionsmatrix – alle Bedienelemente der Familienakte (Stand 2026-10-28)

Zwei Inventare, gegeneinander abgeglichen:

| Quelle | Werkzeug | Ergebnis |
| --- | --- | --- |
| Quelltext (`app/*.tsx`) | `node tools/analyse/inventar-aus-code.mjs` → `docs/analyse/inventar-code.json` | **400 Bedienelemente**: 356 × Knopf, 16 × Auswahlliste, 16 × Schalter, 8 × Datei-Eingang, 2 × Ablagefläche, 2 × Link-Knopf |
| laufende App (Rundgang) | `node tests/run-ui.mjs rundgang` → `docs/analyse/inventar-laufend.json` | 60 Orte (Desktop) besucht, 839 verschiedene sichtbare Bedienelemente (Text + Art) |

Die Zahl aus dem Code ist höher als „rund 350 Knöpfe“ aus dem Auftrag, weil viele Knöpfe auf **einer** Quelltextzeile stehen (`grep -c` zählt Zeilen). Der Rundgang sieht andere Zahlen, weil ein Knopf im Code zu vielen Knöpfen auf dem Schirm wird (je Dokument, je Frist …) und umgekehrt viele Knöpfe nur in Dialogen oder bei bestimmten Zuständen erscheinen (Dubletten, offene Vorschläge, OneDrive verbunden, laufende Analyse, Fehlerbericht). Diese bedingten Knöpfe stehen in der CSV mit Handler und Bedingung in der Spalte „Bemerkung“.

**Ergebnis je Bedienelement (Desktop-Chrome, 1440 px):** ✅ 381 · ❓ 11 · – 1 · ⚠️ 5 · ❌ 2
**Handy-Ansicht (390 px, Chromium):** ✅ 345 · – 2 · 🔒 42 · ❓ 2 · ⚠️ 9

Legende: ✅ funktioniert (gemessen) · ✅ (Rundgang) nur Navigation/Anzeige/Eingabe, Zielseite im Rundgang fehlerfrei · ⚠️ teilweise · ❌ defekt · 🔒 in dieser Umgebung gesperrt · ❓ Absicht unklar oder nicht einzeln gemessen · – nicht vorhanden in dieser Ansicht.
Die vollständige Tabelle mit Fundstelle, Handler, Fachfunktion und Absicht: [FUNKTIONSMATRIX.csv](FUNKTIONSMATRIX.csv) (Trennzeichen `;`, UTF-8 mit BOM, in Excel/LibreOffice direkt zu öffnen).

## Echte Defekte und Einschränkungen (mit Reproduktion)

| Nr | Befund | Reproduktion | Fundstelle | Schwere |
| --- | --- | --- | --- | --- |
| D1 | **„Beispieldaten entfernen“ ist mit der Maus nicht erreichbar** (Desktop ab ca. 1130 px Breite). Der Zierkreis des Startbanners (`.family-hero:after`, 310 px, `top: -160px`) liegt über dem Hinweis „Alle Daten sind Beispieldaten“ und fängt den Klick ab. Tastatur (Tab + Enter) funktioniert. | Startseite öffnen, auf den Knopf klicken → nichts passiert; `document.elementFromPoint` liefert `section.family-hero` | `app/globals.css` Zeile 501 (`.family-hero:after` ohne `pointer-events: none`); Hinweis aus PR #2 | hoch (Klaus’ erster Handgriff) |
| D2 | **PDF-Vorschau braucht Netz**: pdf.js wird von cdnjs.cloudflare.com geladen. Ohne Netz oder mit Internetschalter „aus“: „Die PDF-Vorschau ist hier nicht verfügbar.“ | Dokumentenbibliothek → Karte „öffnen“ bei getrenntem Netz | `app/file-viewer.tsx` (PDFJS von cdnjs) | hoch für den Offline-Bau (Teil 2: ins Paket legen) |
| D3 | **„Jetzt Abgleich durchführen“ (Sicherheitscenter) scheitert mit dem Browser-Datentresor** und springt nach „Bestand prüfen“: „Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner. Bitte … „SOFTWARE TESTORDNER“ auswählen.“ Der Text nennt den Testordner des Freundes. | Sicherheitscenter → „Jetzt Abgleich durchführen“ | `app/health-portal.tsx` `startVaultInventoryComparison` | mittel |
| D4 | **Systemprüfung ist immer ROT** (4 offene Punkte): Die „Abschlussprüfung 2.28.1“ verlangt den Entwicklungs-Pilot des Freundes (OneDrive-Testbestand, Bestandsanalyse pausieren/fortsetzen, 2 Lernsignale, Archivierung + Assistenz-Freigabe). Für Klaus ohne diesen Pilot nicht erreichbar; „Systemprüfung reparieren“ ändert daran nichts. | Hilfe → Systemprüfung → „Abschlussprüfung 2.28.1 starten“ | `app/health-portal.tsx` `SystemCheck`, `lib/system-check-manifest.json` | mittel (Verständnis) |
| D5 | **„Testumgebung automatisch einrichten und prüfen“** setzt den festen Windows-Pfad `G:\01GPT-SOFTWARE\…` voraus; im Browser-Tresor endet es mit einem technischen Fehlerbericht (136 Diagnoseereignisse). | Bestand prüfen → Knopf | `app/local-vault.ts` `AUTOMATED_TEST_WINDOWS_BASE_PATH` | niedrig (Entwicklerwerkzeug) |
| D6 | **„Ausloggen“ loggt nichts aus**: Es gibt kein Konto mehr; der Link lädt die Seite neu, alle Daten bleiben. Für Klaus irreführend, aber Wortlaut des Freundes. | Kopfzeile → Ausloggen | `app/health-portal.tsx` `.logout-button` | niedrig (Wortlaut) |
| D7 | **„Online-Bestand lokal kopieren“** bleibt immer gesperrt (kein Online-Altbestand mehr, Rest der Cloudflare-Fassung); „Abgleich prüfen“ nur mit OneDrive + PC-Ordner. | Sicherheitscenter | `SecurityCenter` | niedrig |
| D8 | **Sperren → leere Startseite**: Nach „Sperren“ des PC-/USB-Tresors ist bis zum Neuladen kein Datentresor verbunden; nach Neuladen ist der Browser-Datentresor automatisch wieder da (Beispieldaten erhalten). | Sicherheitscenter → Sperren → Startseite | `lockLocalVault` | niedrig (Verhalten dokumentieren) |
| D9 | **„Nicht übernehmen“ in der Eingangszentrale** ändert den Zustand des Eingangs, die Zahl „Eingänge“ bleibt gleich (Eingang bleibt in der Liste). | Eingangszentrale → Eingang ankreuzen → Nicht übernehmen | `app/central-intake-center.tsx` | niedrig |
| D10 | **Aktivitätszeilen nach Systemprüfung doppelt**: Beide Zeilen zeigen denselben Text „Systemprüfung abgeschlossen · ROT“ (Prüfung und automatische Reparatur melden gleich). | Systemprüfung starten, oben lesen | `SystemCheck` `onCompleted` | niedrig |

Umgebungsgrenzen (keine Defekte, aber für Klaus wichtig): Ordnerauswahl (Tresor, OneDrive, Eingangsordner, Bestand, Export, Sicherung) nur in Chrome/Edge am PC; Mikrofon nur über https (oder localhost) in Chrome/Edge/Safari; Drucken, neue Fenster und Downloads auf claude.ai nicht; Firefox ohne Spracherkennung. Alles weitere je Bedienelement in der CSV, Spalte „Firefox/Safari/claude.ai/Einzeldatei“.

## Proben (Playwright, Chromium, gegen `vite preview`)

`node tests/run-ui.mjs` fährt alle; einzeln mit Filter, z. B. `node tests/run-ui.mjs knoepfe-start`.

| Probe | Umfang | Stand |
| --- | --- | --- |
| `rundgang` | 8 Hauptmenüs, 35 Menüeinträge, 16 Fußzeilen-Einträge, 2 Dialoge, Handy-Navigation, Querlaufen | 73 grün |
| `knoepfe-start` | Kopf-/Fußzeile, Suche inkl. „Verstanden als:“, Diktat (gestellt), Drucken, Ausloggen, Objekt-Cockpit, Dokumenteneingang-Kacheln, Erinnerung erfassen, Beispieldaten entfernen/laden | 33 grün, 1 bekannter Defekt (D1) |
| `knoepfe-cockpit` | Cockpit (Kacheln, Dossier, Statuswechsel, Notiz, Verknüpfen), Fristen (Filter, Diktat, anlegen, erledigt, zurückstellen, Verweise), Tagebuch (Entwurf, Prüfen, Ergänzen, Löschen, Zusammenfassung, Memory bearbeiten/löschen, Verbindung lösen) | 27 grün |
| `knoepfe-dokumente` | Bibliothek (Suche, Filter, Vorschau, Kacheln), Ablage-Dialog (Vorschlag, Auswahlfenster, Speichern, Dublette), Eingangszentrale (4 Dateitypen, E-Mail-Anlage, Zustände, Sammelknöpfe), Dokument fotografieren (2 Seiten → PDF) | 22 grün, 1 bekannter Defekt (D2) |
| `knoepfe-sicherheit` | Sicherheitscenter (Abgleich, Export, Vollsicherung, Wiederherstellung, OneDrive, Ordner wechseln, Sperren), Hilfe-Verweise, Bestand prüfen (Ordner, Analyse, Archiv, Diagnose, Testumgebung, Testregister), Systemprüfung (voll, Änderungen, reparieren), Praktische Abnahme | 29 grün, 1 bekannter Defekt (D3) |
| `kopieren` | Aktivitätszeilen 1/2, „Auftrag kopieren“, Assistenz „Kopieren“, jeweils mit und ohne Zwischenablage-Berechtigung | 11 grün |
| `knoepfe-assistenz` | Assistenz (Modi, Diktat, Prüfung, Fakten, Schreiben, Textbausteine, Speichern), Unterseiten Gesundheit & Arbeit, Familie, Wohnen/Fahrzeuge/Käufe, Verzeichnis, Was gibt’s Neues, Unterlagen & Quellen | 22 grün |
| `knoepfe-leer` | Akte ohne Beispieldaten: 16 Seiten, Suche, Cockpit, Frist, Erinnerung, Systemprüfung, Beispieldaten wieder laden | 25 grün |

Gestellt (Ersatzobjekte in `tests/ui/_stubs.mjs`): Spracherkennung (beide Namen), Ordnerauswahl (echte OPFS-Ordner), `window.print`, `window.open`, gesperrte Zwischenablage. Nicht messbar headless: echtes Mikrofon, echte Kamera, Drag & Drop mit der Maus, Druckausgabe, Downloads auf dem Handy → [HANDPRUEFUNG.md](HANDPRUEFUNG.md).

## Bedienelemente je Seite

### Bestand prüfen (42: ⚠️ 1 · ✅ 36 · ❓ 5)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 174 | Testumgebung wird eingerichtet und geprüft … / Testumgebung automatisch einrichten und prü | `runAutomaticTestEnvironment` → chooseDevelopmentBaseFolder (app/local-vault.ts); setupAutomatedTestEnvironment  | ⚠️ | 🔒 | setzt den festen Windows-Pfad G:\01GPT-SOFTWARE\… des Freundes voraus; im Browser-Tresor endet es mit einem Fehlerbericht (136 Diagnoseereignisse) |
| 175 | Windows-Diagnose läuft … / Windows-Dateisystem diagnostizieren | `runStorageDiagnostic` → chooseDevelopmentBaseFolder (app/local-vault.ts); runAutomatedStorageDiagnostic  | ✅ | ⚠️ | Bericht wird erzeugt und kopiert (Zwischenablage-Berechtigung) |
| 176 | Testakte für Weiterentwicklung | `chooseAndInspectWorkspace` | ✅ (Ordnerwahl) | 🔒 | braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC) |
| 177 | Testregister wird vorbereitet … / Testregister vorbereiten | `prepareTestRegister` → inspectTestWorkspace (app/local-vault.ts); prepareTestRegisterPreview (app/local | ✅ | 🔒 | Vorschau/Hinweis |
| 178 | Testakte wird geprüft … / Gespeicherte Testakte erneut prüfen | `setTestWorkspaceOpen, inspectWorkspace` → inspectTestWorkspace (app/local-vault.ts) | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |
| 179 | Anderen Hauptordner wählen / Hauptordner einschließlich Unterordner auswählen | `onSelectSource` | ✅ (Ordnerwahl) | 🔒 |  |
| 180 | Analyse läuft … / Analyse fortsetzen / Bestand jetzt prüfen | `onScan` | ✅ | 🔒 | Analyse des gewählten Ordners (1 Datei geprüft) |
| 181 | Analyse pausieren | `onPause` | ✅ | 🔒 | Analyse des gewählten Ordners (1 Datei geprüft) |
| 182 | Archiv neu verbinden / Archivdatenträger auswählen | `onSelectArchive` | ✅ (Ordnerwahl) | 🔒 |  |
| 183 | Windows-Diagnosebericht kopiert / Windows-Diagnosebericht kopieren | `copyStorageDiagnostic` | ✅ | ⚠️ | Bericht wird erzeugt und kopiert (Zwischenablage-Berechtigung) |
| 184 | Allgemeiner Fehlerbericht kopiert / Allgemeinen technischen Fehlerbericht kopieren | `copyAutomaticTestFailure` | ✅ | ⚠️ |  |
| 185 | Hilfe öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 186 | Systemprüfung öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 187 | Windows-Diagnosebericht kopiert / Windows-Diagnosebericht kopieren | `copyStorageDiagnostic` | ✅ | ⚠️ | Bericht wird erzeugt und kopiert (Zwischenablage-Berechtigung) |
| 188 | Erneut prüfen | `runAutomaticTestEnvironment` → chooseDevelopmentBaseFolder (app/local-vault.ts); setupAutomatedTestEnvironment  | ✅ (Ordnerwahl) | 🔒 | braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC) |
| 189 | Testumgebung kontrolliert zurücksetzen | `resetAutomaticTestWorkspace` → resetAutomatedTestEnvironment (app/local-vault.ts) | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |
| 190 | Test-Hauptordner erneut auswählen | `chooseAndInspectWorkspace` | ✅ (Ordnerwahl) | 🔒 |  |
| 191 | Test-Hauptordner erneut auswählen | `chooseAndInspectWorkspace` | ✅ (Ordnerwahl) | 🔒 |  |
| 192 | Test-Hauptordner erneut auswählen | `chooseAndInspectWorkspace` | ✅ (Ordnerwahl) | 🔒 |  |
| 193 | Testdatentresor erneut verbinden | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 194 | Testregister ausdrücklich übernehmen | `confirmPreparedTestRegister` → savePreparedTestRegister (app/local-vault.ts) | ✅ | 🔒 | Vorschau/Hinweis |
| 195 | Vorschau verwerfen | `setTestRegisterPreview, setTestRegisterSaved` | ✅ | 🔒 | Vorschau/Hinweis |
| 196 | Sicherheitscenter öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 197 | {summary.total} Dateien analysiert | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 198 | {summary.newFiles} neu | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 199 | {summary.unchanged} unverändert | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 200 | {summary.changed} verändert | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 201 | {summary.moved} verschoben erkannt | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 202 | {summary.recommended} empfohlen | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 203 | {summary.review} noch prüfen | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 204 | {summary.duplicate} Dubletten | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 205 | {summary.low} geringe Relevanz | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 206 | {summary.archived} archiviert | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 207 | {summary.assistantReleased} Assistenz freigegeben | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 208 | (ohne Text) | `openGroup` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 209 | Dateien auswählen | `selectVisible` | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |
| 210 | Auswahl aufheben | `setSelected` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 211 | {archiveIds.length ? `$ {archiveIds.length} Dateien archivieren` : "Dateien archivieren"} | `onArchive` | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |
| 212 | Assistenzfreigabe | `onRelease` | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |
| 213 | {resetIds.length ? `$ {resetIds.length} Dateien zurücksetzen` : "Dateien zurücksetzen"} | `onReset` | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |
| 214 | (ohne Text) | `toggle` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 215 | Ansehen | `setPreviewItemId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Interaktives Cockpit (32: ✅ 32)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 304 | Jetzt wichtig {counts.urgent} überfällig oder heute · anzeigen | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 305 | Aktive To-dos {counts.todos} {snapshot.completedTaskCount} in der Historie erledigt · anze | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 306 | Offene Vorgänge {counts.cases} aus verknüpften Datensätzen · anzeigen | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 307 | Neu hinzugekommen {counts.news} aktuell relevante Einträge · anzeigen | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 308 | {item.title} · {item.detail} | `openPriority` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 309 | Alle Fristen und Aufgaben | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 310 | Verknüpfen | `onConfirmContext, suggestion.reasons.join` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 311 | Vorgang öffnen | `focus` | ✅ | ✅ |  |
| 312 | Nicht verknüpfen | `onRejectContext` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 313 | Gesamtes Verzeichnis | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 314 | {item.title} Status: {item.status} · zuletzt de-DE {item.nextTask ? `Nächste Aufgabe: $ {i | `onGo, focus` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 315 | {item.title} {item.objectType} · {item.caseCount} Vorgänge · {item.documentCount} Dokument | `onGo, focus` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 316 | Alle Erinnerungen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 317 | {item.title} {item.detail} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 318 | Alle Neuigkeiten anzeigen | `onGo` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |
| 319 | {item.area} Neuer geschützter Eintrag {item.dateLabel} · Einzelheiten nur im geschützten F | `onGo, onOpenDocument, focus` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 320 | Geschützten Gesundheitsbereich öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 321 | Detailansicht schließen | `setSelectedId` | ✅ | ✅ |  |
| 322 | Gesundheitsakte öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 323 | Memory-Fragen | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 324 | Aufgaben | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 325 | Fristen | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 326 | Assistenz fragen | `onAssistant` | ✅ | ✅ | Dossier → Assistenz mit Vorgang |
| 327 | Ereignis ergänzen | `onAddMemoryToCase` | ✅ (Code) | ✅ | Dossier → Startseite, Erinnerung mit vorgeschlagenem Vorgang; nicht einzeln geklickt |
| 328 | Dokument hinzufügen | `onAddDocumentToCase` | ✅ (Code) | ✅ | Dossier → Ablage-Dialog mit vorgeschlagenem Vorgang; nicht einzeln geklickt |
| 329 | Was ist noch offen? | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 330 | {item.type} {item.title} {item.at ? new Intl.DateTimeFormat("de-DE", medium / short ).form | `onGo, onOpenDocument, focus` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 331 | {reference.label} {reference.id} | `openReference` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 332 | Assistenz &amp; Schreiben | `onAssistant` | ✅ | ✅ | Dossier → Assistenz mit Vorgang |
| 333 | Dokument öffnen | `onOpenDocument` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 334 | Zuordnung prüfen | `document.getElementById, scrollIntoView` | ✅ | ✅ | öffnet den Ablage-Dialog mit der Datei |
| 335 | Wird gespeichert … / Notiz nach Bestätigung ergänzen | `saveNote` | ✅ | ✅ | Rückfrage, Notiz protokolliert |

### Hilfe (25: ✅ 25)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 216 | Dokumente finden Bibliothek durchsuchen und filtern | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 217 | Bestand prüfen Testordner analysieren und bewerten | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 218 | Dokument ablegen lokal auf PC oder USB-Stick | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 219 | Erinnerung festhalten diktieren, prüfen und lokal speichern | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 220 | Datentresor öffnen verbinden, prüfen oder sperren | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 221 | Systemprüfung prüfen, Bericht öffnen oder sicher reparieren | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 222 | Was gibt’s Neues? Neue Inhalte und wichtige Veränderungen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 223 | {example} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |
| 224 | Assistenz öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 225 | Bestand prüfen öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 226 | Testakte öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 227 | FaWoGa-OneDrive-Test öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 228 | Lernfähige Zuordnung testen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 229 | Sicherung im Sicherheitscenter öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 230 | Tagebuch & Erinnerungen öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 231 | Bearbeitungswarteschlange öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 232 | Zusammenhänge im Cockpit prüfen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 233 | Eingangszentrale öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 234 | Was gibt’s Neues? öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 235 | Dokumentenbibliothek öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 236 | Interaktives Cockpit öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 237 | Datentresor verwalten | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 238 | Export im Sicherheitscenter öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 239 | Fristen und Aufgaben öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 240 | Familienakte jetzt prüfen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Eingangszentrale (22: ✅ 21 · ❓ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 19 | Hilfe | `onGo` | ✅ | ✅ | führt zur Hilfe |
| 20 | sr-only | `add` | ✅ | ✅ | Dateiauswahl des Browsers |
| 21 | image/* | `Array.from, if, onStartDocumentScan` | ✅ | ✅ | Dateiauswahl des Browsers |
| 22 | central-drop ${dragging ? "dragging" : ""} | `setDragging, add` | ✅ (Code) | – | Drag & Drop; headless nicht gezogen, derselbe Weg wie „Datei auswählen“ |
| 23 | Datei auswählen | `click` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 24 | Dokument fotografieren Vorhandene Mehrseiten- und PDF-Funktion / Zuerst lokalen Tresor ver | `click, onGo` | ✅ (Dateiwahl) | ✅ Kamera | öffnet die Kamera/Dateiauswahl (capture=environment), danach Scan-Dialog |
| 25 | Eingangsordner jetzt prüfen / Eingangsordner auswählen {inboxFolderName ? `Freigegeben: $  | `–` | ✅ (Ordnerwahl) | 🔒 | braucht showDirectoryPicker (nur Chrome/Edge am PC); gemessen mit gestelltem OPFS-Ordner |
| 26 | OneDrive-Familienordner prüfen {oneDriveConnected ? `Verbunden · letzte Prüfung: $ {lastCh | `onScanOneDrive` | ✅ → Sicherheitscenter | 🔒 | ohne verbundenen OneDrive-Ordner führt der Knopf ins Sicherheitscenter |
| 27 | {counts.total} Eingänge | `activeQueue.forEach, onToggle` | ✅ | ✅ | Zähl-Knöpfe rollen zum Abschnitt / wählen alle |
| 28 | {counts.ready} bereit | `document.getElementById, scrollIntoView` | ✅ | ✅ | Zähl-Knöpfe rollen zum Abschnitt / wählen alle |
| 29 | {counts.review} prüfen | `document.getElementById, scrollIntoView` | ✅ | ✅ | Zähl-Knöpfe rollen zum Abschnitt / wählen alle |
| 30 | {counts.deferred} zurückgestellt | `document.getElementById, scrollIntoView` | ✅ | ✅ | Zähl-Knöpfe rollen zum Abschnitt / wählen alle |
| 31 | Als gemeinsames Scan-Dokument prüfen | `onStartDocumentScan, selectedImages.map` | ❓ | ❓ | nur mit mindestens zwei Bildern in der Warteschlange; nicht ausgelöst |
| 32 | Sichere Vorschläge vormerken | `onSetStatus` | ✅ | ✅ | Sammelknöpfe erscheinen nach Ankreuzen; „Nicht übernehmen“ ändert den Zustand, die Zahl „Eingänge“ bleibt |
| 33 | Zurückstellen | `onSetStatus` | ✅ | ✅ | Fristen: ohne Rückfrage, Status sofort gesetzt; Eingangszentrale: Status der Warteschlange |
| 34 | Nicht übernehmen | `onSetStatus` | ✅ | ✅ | Sammelknöpfe erscheinen nach Ankreuzen; „Nicht übernehmen“ ändert den Zustand, die Zahl „Eingänge“ bleibt |
| 35 | (ohne Text) | `onToggle` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 36 | Anlagen in Warteschlange prüfen | `onExtractAttachments` | ✅ | ✅ | E-Mail-Anlage wird eigener Eingang |
| 37 | Zuordnung prüfen | `onReview` | ✅ | ✅ | öffnet den Ablage-Dialog mit der Datei |
| 38 | Zurückstellen | `onSetStatus` | ✅ | ✅ | Fristen: ohne Rückfrage, Status sofort gesetzt; Eingangszentrale: Status der Warteschlange |
| 39 | Weiterbearbeiten | `onSetStatus` | ✅ | ✅ | Sammelknöpfe erscheinen nach Ankreuzen; „Nicht übernehmen“ ändert den Zustand, die Zahl „Eingänge“ bleibt |
| 40 | Übernommene Dokumente anzeigen Bibliothek, Suche und Vorgänge verwenden denselben Dokument | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Dialog › Dokument fotografieren (19: ✅ 19)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 41 | Scan schließen | `requestClose` | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 42 | image/* | `addFiles` | ✅ | ✅ | Dateiauswahl des Browsers |
| 43 | image/* | `addFiles` | ✅ | ✅ | Dateiauswahl des Browsers |
| 44 | Nächste Seite fotografieren / Erste Seite fotografieren | `setReplaceIndex, click` | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 45 | Foto auswählen | `click` | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 46 | Aufnahme prüfen | `setReviewReady, setError` | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 47 | Seite (aria: Seite ${index + 1} öffnen) | `setSelectedId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 48 | Seite ${index + 1} nach oben | `movePage` → moveScanPage (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 49 | Seite ${index + 1} nach unten | `movePage` → moveScanPage (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 50 | Seite ${index + 1} drehen | `updatePage, rotateScanPage` → rotateScanPage (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 51 | Seite ${index + 1} neu fotografieren | `setReplaceIndex, click` | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 52 | Seite ${index + 1} entfernen | `removePage` → removeScanPage (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 53 | Drehen | `updatePage, rotateScanPage` → rotateScanPage (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |
| 54 | none / Ränder behutsam zuschneiden / Zuschnitt zurücksetzen | `updatePage` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 55 | Originaldarstellung / Lesbarkeit leicht verbessern | `updatePage` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 56 | (ohne Text) | `setKeepOriginals` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 57 | (ohne Text) | `setKeepOriginals` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 58 | Abbrechen | `requestClose` | ✅ | ✅ |  |
| 59 | (ohne Text) | `buildPdf` → createDocumentScanPdf (lib/document-scan.ts) | ✅ | ✅ (Kamera) | Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog |

### Dialog › Neue Unterlage ablegen (19: ✅ 19)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 370 | Fenster schließen | `onClose` | ✅ | ✅ |  |
| 371 | .pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip | `selectFile` → buildDocumentIntakePlan (lib/document-intake.ts) | ✅ | ✅ | Dateiauswahl des Browsers |
| 372 | Datei hier ablegen oder auswählen PDF, DOCX, XLSX, MSG, VTT, ZIP oder Bilddatei · höchsten | `click` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 373 | Lebensbereich auswählen | `openChoice` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 374 | Dokumentenart auswählen | `openChoice` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 375 | Datenschutzstufe auswählen | `openChoice` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 376 | Bereich auswählen | `openChoice` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 377 | Vorhandenes Dokument {id} öffnen | `onOpenExisting` | ✅ | ✅ | bei Dublette |
| 378 | (ohne Text) | `setAllowDuplicate, reportActivity` → buildDocumentIntakePlan (lib/document-intake.ts) | ✅ | ✅ | Haken bei Dublette |
| 379 | Verknüpfen | `setSelectedCaseId, setNewCaseTitle, setRejectedContext` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 380 | (ohne Text) | `setSelectedCaseId, setNewCaseTitle, setRejectedContext` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 381 | Nicht verknüpfen | `setSelectedCaseId, setNewCaseTitle, setRejectedContext` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 382 | (ohne Text) | `setResolveOpenPointEventId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 383 | Abbrechen | `onClose` | ✅ | ✅ |  |
| 384 | Wird lokal gespeichert … / Geprüft lokal speichern | `–` | ✅ | ✅ | Dokument wird im Tresor angelegt; Dublette ohne Haken wird abgewiesen |
| 385 | Auswahlfenster schließen | `setChoiceField` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 386 | {option} | `applyChoice` | ✅ | ✅ | Auswahlfenster: Option übernehmen |
| 387 | Übernehmen | `applyChoice` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |
| 388 | Ohne Änderung schließen | `setChoiceField` | ✅ | ✅ | Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich) |

### Assistenzzentrale (18: ✅ 18)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 1 | {item.icon} {item.label} | `setMode` | ✅ | ✅ | Modus-Wahl (aria-pressed) |
| 2 | (ohne Text) | `setCaseId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 3 | Familienakte prüfen und Vorschlag vorbereiten | `analyze` → buildAssistantAnalysis (lib/family-assistant.ts); buildCorrespondenceDraft (lib/ | ✅ | ✅ | Regelauswertung der Akte (keine KI); Fakten, Vorgang, Vorschlag |
| 4 | {fact.kind} · {fact.title} | `onOpenDocument, onOpenRecord` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 5 | Vorgang öffnen | `onOpenRecord` | ✅ | ✅ |  |
| 6 | Schreiben vorbereiten | `prepareDraft` → buildCorrespondenceDraft (lib/family-assistant.ts) | ✅ | ✅ | nur im Modus „Schreiben oder E-Mail erstellen“ |
| 7 | (ohne Text) | `setKind` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 8 | (ohne Text) | `setTone` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 9 | Kürzer | `setBody, reviseCorrespondenceText` → reviseCorrespondenceText (lib/family-assistant.ts) | ✅ | ✅ | feste Textbausteine (lib/family-assistant.ts), keine KI |
| 10 | Freundlicher | `setBody, reviseCorrespondenceText` → reviseCorrespondenceText (lib/family-assistant.ts) | ✅ | ✅ | feste Textbausteine (lib/family-assistant.ts), keine KI |
| 11 | Bestimmter | `setBody, reviseCorrespondenceText` → reviseCorrespondenceText (lib/family-assistant.ts) | ✅ | ✅ | feste Textbausteine (lib/family-assistant.ts), keine KI |
| 12 | Sachlicher | `setBody, reviseCorrespondenceText` → reviseCorrespondenceText (lib/family-assistant.ts) | ✅ | ✅ | feste Textbausteine (lib/family-assistant.ts), keine KI |
| 13 | Kopieren | `copyDraft` | ✅ | ✅ | Assistenz: Betreff + Entwurf |
| 14 | (ohne Text) | `setConfirmed` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 15 | Als Entwurf speichern | `save` | ✅ | ✅ | nur mit Bestätigungshaken; legt Korrespondenz-Datensatz an |
| 16 | Als versandbereit speichern | `save` | ✅ | ✅ | nur mit Bestätigungshaken; legt Korrespondenz-Datensatz an |
| 17 | Als versendet speichern | `save` | ✅ | ✅ | nur mit Bestätigungshaken; legt Korrespondenz-Datensatz an |
| 18 | Schreiben · · Empfänger offen | `onOpenRecord, String` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Fußzeile (18: ✅ 18)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 75 | Interaktives Cockpit | `go → Seite "cockpit"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 76 | Tagebuch & Erinnerungen | `go → Seite "memory"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 77 | Fristen und Aufgaben | `go → Seite "reminders"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 78 | Gesamtes Verzeichnis | `go → Seite "directory"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 79 | Lebensbereiche | `openLifeAreas` | ✅ | ✅ | Startseite, rollt zu den Lebensbereichen |
| 80 | Dokumentenbibliothek | `go → Seite "documents"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 81 | Eingangszentrale | `go → Seite "inbox"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 82 | Bestand prüfen | `go → Seite "inventory"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 83 | Was gibt’s Neues? | `go → Seite "changelog"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 84 | Hilfe | `go → Seite "help"` | ✅ | ✅ | führt zur Hilfe |
| 85 | Mit ChatGPT arbeiten | `openChatGPTEdit` | ✅ | ✅ | öffnet den ChatGPT-Dialog (nur Auftrag kopieren + Link) |
| 86 | Systemprüfung | `go → Seite "systemcheck"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 87 | Prüfberichte | `openFooterSystemReports` | ✅ | ✅ | Systemprüfung, rollt zu den Prüfberichten |
| 88 | Sicherheitscenter | `go → Seite "security"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 89 | Familienakte exportieren | `setExportOpen, reportActivity` → buildDocumentIntakePlan (lib/document-intake.ts) | ✅ (Ordnerwahl) | 🔒 | Export schreibt einen Ordner Familienakte_Export_…; Start erst nach Zielordner + Umfang |
| 90 | Versionshistorie | `go → Seite "versions"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 91 | Beispieldaten laden | `loadSampleData` → seedSampleFamily (app/sample-family.ts) | ✅ | ✅ | legt die Beispielfamilie neu an, eigene Einträge bleiben |
| 92 | Datenschutz & Sicherheit | `go → Seite "security"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Tagebuch & Erinnerungen (18: ✅ 17 · ❓ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 148 | oldest / Älteste zuerst / Neueste zuerst | `setDraftDirection` | ✅ | ✅ |  |
| 149 | Vorläufiger Titel {draft.provisionalTitle} {draft.originalText ? `$ $ : ` : "Nur Medien au | `onOpenDraft` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 150 | Prüfen | `onOpenDraft` | ✅ | ✅ | öffnet den Prüf-Dialog des Entwurfs |
| 151 | Ergänzen | `onEditDraft` | ✅ | ✅ | führt zur Startseite und holt den Entwurf ins Eingabefeld (Entwurf bleibt in der Warteschlange) |
| 152 | Entwurf löschen | `onDeleteDraft` | ✅ | ✅ | Rückfrage, nur dieser Entwurf |
| 153 | Zusammenfassung schließen / Tag zusammenfassen | `setShowSummary` | ✅ | ✅ |  |
| 154 | {item.title} Uhr | `setSelectedId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 155 | {drafts.length} Erinnerungen sind noch nicht geprüft Sie gehören noch nicht zur endgültige | `document.getElementById, scrollIntoView` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 156 | Unbehandelte Erinnerungen: {drafts.length} noch prüfen und endgültig speichern | `document.getElementById, scrollIntoView` | ✅ | ✅ |  |
| 157 | Offene Memory-Fragen: {openPoints.length} gehören zu bereits gespeicherten Einträgen | `document.getElementById, scrollIntoView` | ✅ | ✅ |  |
| 158 | {point.title} {point.lifeArea} · Einzelheiten im geschützten Gesundheitsbereich | `onGo, setSelectedId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 159 | Als erledigt bestätigen | `changeOpenStatus` → updateLocalMemoryOpenPointStatus (app/local-vault.ts) | ✅ | ✅ | offener Memory-Punkt |
| 160 | Weiter beobachten | `changeOpenStatus` → updateLocalMemoryOpenPointStatus (app/local-vault.ts) | ✅ | ✅ | offener Memory-Punkt |
| 161 | video Geschützter Gesundheitseintrag {new Intl.DateTimeFormat("de-DE", medium / short ).fo | `onGo, setSelectedId` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 162 | Gesundheitsakte öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 163 | video {item.name} · lokal öffnen | `openMedia` → readLocalMemoryMediaFile (app/local-vault.ts) | ❓ | ❓ | Tagebuch: Foto/Video eines Eintrags öffnen; keine Medien in den Beispieldaten |
| 164 | Memory bearbeiten | `editSavedMemory` → updateLocalMemoryRecord (app/local-vault.ts) | ✅ | ✅ | zwei Eingabe-Dialoge (Titel, Text) + Bestätigung |
| 165 | Memory löschen | `deleteSavedMemory` → getLocalMemoryDeleteImpact (app/local-vault.ts); deleteLocalMemoryRecord (app/lo | ✅ (Rückfrage) | ✅ |  |

### Dialog › Erinnerung prüfen (14: ✅ 14)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 125 | Schließen | `onClose` | ✅ | ✅ |  |
| 126 | Verknüpfen | `setChosenCaseId, setRejectedContext` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 127 | (ohne Text) | `setChosenCaseId, setRejectedContext` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 128 | Nicht verknüpfen | `setChosenCaseId, setRejectedContext` | ✅ | ✅ | Zusammenhangs-Vorschlag annehmen/ablehnen |
| 129 | {id} öffnen | `onOpenDocument` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 130 | (ohne Text) | `setLifeArea` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 131 | Art der Aussage ${index + 1} | `setStatementRows, current.map` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 132 | Verwerfen / Übernehmen | `setStatementRows, current.map` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 133 | (ohne Text) | `setSelectedIds, Set, if, next.add, next.delete` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 134 | (ohne Text) | `setCreateTask` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 135 | (ohne Text) | `setCreateDeadline` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 136 | (ohne Text) | `setConfirmed` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 137 | Zur Warteschlange | `onClose` | ✅ | ✅ |  |
| 138 | Wird gespeichert … / Bestätigt speichern | `save` | ✅ | ✅ | speichert den Memory-Eintrag, Abschluss-Dialog |

### Dokumentenbibliothek (13: ✅ 13)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 265 | Dokumentensuche löschen | `setQuery` | ✅ | ✅ |  |
| 266 | Alle ansehen | `showAll` | ✅ | ✅ |  |
| 267 | Neue Unterlage | `onUpload` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 268 | Alle ansehen | `showAll` | ✅ | ✅ |  |
| 269 | Unterlage hinzufügen | `onUpload` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 270 | {group.name} {group.items.length} Dokument : · Alle ansehen | `showAll` | ✅ | ✅ |  |
| 271 | Alle ansehen | `showAll` | ✅ | ✅ |  |
| 272 | Zur Bibliotheksübersicht | `setView, setQuery, setArea, setDocumentType, setStartDate, s` | ✅ | ✅ |  |
| 273 | (ohne Text) | `setArea` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 274 | (ohne Text) | `setDocumentType` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 275 | (ohne Text) | `setSort` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 276 | {visible.length} Datensätze anzeigen | `showAll` | ✅ | ✅ |  |
| 277 | Filter zurücksetzen | `showAll` | ✅ | ✅ |  |

### Sicherheitscenter (13: ✅ 12 · ❌ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 288 | Anderen OneDrive-Ordner wählen / OneDrive-Ordner verbinden | `onConnectOneDrive` | ✅ (Ordnerwahl) | 🔒 |  |
| 289 | Sperren | `onLockOneDrive` | ✅ | ✅ | trennt in diesem Browser, löscht nichts; danach ist die Startseite leer bis zum Neuladen |
| 290 | Anderen PC-/USB-Ordner wählen / PC-/USB-Ordner verbinden | `onConnectLocal` | ✅ (Ordnerwahl) | 🔒 | stellt auf den gewählten Ordner um |
| 291 | Sperren | `onLockLocal` | ✅ | ✅ | trennt in diesem Browser, löscht nichts; danach ist die Startseite leer bis zum Neuladen |
| 292 | Jetzt Abgleich durchführen | `onCompare` | ❌ (Browser-Datentresor) | 🔒 | mit dem Browser-Datentresor sofort „Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner … SOFTWARE TESTORDNER“ und Sprung nach „Bestand prüfe |
| 293 | Datentresor verbinden | `onConnectLocal` | ✅ (Ordnerwahl) | 🔒 | braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC) |
| 294 | Hilfe | `onHelp` | ✅ | ✅ | führt zur Hilfe |
| 295 | Vollständige Sicherung erstellen | `onFullBackup` | ✅ (Ordnerwahl) | 🔒 | Ordner Familienakte_Vollsicherung_… mit Register, Medien, Prüfsummen |
| 296 | Wiederherstellung testen | `onRestoreTest` | ✅ (2 × Ordnerwahl) | 🔒 | Sicherung → leerer Ordner, per Prüfsummen bestätigt |
| 297 | Export vorbereiten | `onExport` | ✅ (Ordnerwahl) | 🔒 | Export schreibt einen Ordner Familienakte_Export_…; Start erst nach Zielordner + Umfang |
| 298 | Prüfung läuft … / Abgleich prüfen | `onCheckSync` | ✅ / ⚠️ | 🔒 | „Abgleich prüfen“ nur mit OneDrive + PC-Ordner; „Online-Bestand lokal kopieren“ bleibt ohne Online-Altbestand gesperrt (Altlast aus der Cloudflare-Fassung) |
| 299 | {syncPreview.missingDocuments} fehlende Datei : jetzt sichern | `onRunSync` | ✅ (Ordnerwahl) | 🔒 | braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC) |
| 300 | Sicherung läuft … / Online-Bestand lokal kopieren | `onMigrate` | ✅ / ⚠️ | 🔒 | „Abgleich prüfen“ nur mit OneDrive + PC-Ordner; „Online-Bestand lokal kopieren“ bleibt ohne Online-Altbestand gesperrt (Altlast aus der Cloudflare-Fassung) |

### Startseite (12: ✅ 12)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 93 | {hasCockpitData ? Aktive Objekte {cockpit.objects.length} Offene Vorgänge {openCases.lengt | `onGo` | ✅ | ✅ | führt ins Cockpit |
| 94 | Arbeitsübersicht öffnen | `onGo` | ✅ | ✅ | führt ins Cockpit |
| 95 | Was gibt’s Neues? | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 96 | Datentresor verbunden / Erneut verbinden / Datentresor verbinden Zugriff erneut freigeben  (aria: ${vaultConnected ? "Datentresor verbunden" : vaultRemembered ? "Datentresor erneut verbinden" : "Datentresor verbinden"}. Status: ${actionStateLabel[vaultActionState]}) | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 97 | Neue Unterlage ablegen einzeln prüfen und speichern (aria: Neue Unterlage ablegen. Status: ${actionStateLabel[actionStates.upload]}) | `onStartIntake` | ✅ | ✅ | öffnet den Ablage-Dialog |
| 98 | Abgleich durchführen {newDocumentCount ? `$ {newDocumentCount} neue Datei$ : ` : "Ordner k (aria: Abgleich durchführen. Status: ${actionStateLabel[actionStates.compare]}) | `onCompare` | ✅ (Ordnerwahl) | 🔒 | braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC) |
| 99 | Akte aktualisieren {reviewedDocumentCount ? `$ {reviewedDocumentCount} geprüft` : "bestäti (aria: Akte aktualisieren. Status: ${actionStateLabel[actionStates.update]}) | `onUpdate` | ✅ | ✅ | Statuskachel; ohne geprüfte Dokumente Hinweis |
| 100 | {item.title} · {item.detail} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 101 | Alle Unterbereiche | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 102 | {status} {title} {text} Öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 103 | persönlich {area.name} {area.documentCount} gespeicherte Unterlage ist / Unterlagen sind d | `onOpenLifeArea` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 104 | Systemprüfung öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Startseite › Dokumenteneingang (12: ✅ 9 · ❓ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 105 | Hilfe | `onGo` | ✅ | ✅ | führt zur Hilfe |
| 106 | .pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip | `acceptFiles` | ✅ | ✅ | Dateiauswahl des Browsers |
| 107 | image/* | `Array.from, if, onStartDocumentScan` | ✅ | ✅ | Dateiauswahl des Browsers |
| 108 | intake-method-card intake-drop ${dragging ? "dragging" : ""} | `setDragging, acceptFiles` | ✅ (Code) | – | Drag & Drop; headless nicht gezogen, derselbe Weg wie „Datei auswählen“ |
| 109 | Datei auswählen | `click` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 110 | Fotofunktion öffnen Eine oder mehrere Seiten als PDF prüfen / Zuerst lokalen Datentresor v | `click, onStartDocumentScan` | ✅ (Dateiwahl) | ✅ Kamera | öffnet die Kamera/Dateiauswahl (capture=environment), danach Scan-Dialog |
| 111 | Eingangsordner jetzt prüfen / Ordner auswählen {inboxFolderName ? `Freigegeben: $ {inboxFo | `–` | ✅ (Ordnerwahl) | 🔒 | braucht showDirectoryPicker (nur Chrome/Edge am PC); gemessen mit gestelltem OPFS-Ordner |
| 112 | OneDrive-Ordner prüfen {oneDriveConnected ? `Verbunden · letzte Prüfung: $ {lastChecked} ` | `onScanOneDrive` | ✅ → Sicherheitscenter | 🔒 | ohne verbundenen OneDrive-Ordner führt der Knopf ins Sicherheitscenter |
| 113 | {incomingFiles.length} neue oder geänderte Datei : | `setShowAll` | ❓ (nur mit Eingangsordner-Treffern) | 🔒 | Dokumenteneingang-Kachel: erscheint nach „Eingangsordner prüfen“ mit Treffern; nicht ausgelöst |
| 114 | {item.name} · prüfen und erfassen | `onFile` | ❓ (nur mit Eingangsordner-Treffern) | 🔒 | Dokumenteneingang-Kachel: erscheint nach „Eingangsordner prüfen“ mit Treffern; nicht ausgelöst |
| 115 | Kompakt anzeigen / Alle Eingangsfälle ansehen | `setShowAll` | ❓ (nur mit Eingangsordner-Treffern) | 🔒 | Dokumenteneingang-Kachel: erscheint nach „Eingangsordner prüfen“ mit Treffern; nicht ausgelöst |
| 116 | Dokument erfolgreich erfasst {receipt.title} · {receipt.category} · {receipt.source} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Fristen und Aufgaben (11: ✅ 11)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 336 | : {id} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 337 | Als erledigt markieren | `changeStatus` → updateLocalScheduleStatus (app/local-vault.ts) | ✅ | ✅ | Fristen: ohne Rückfrage, Status sofort gesetzt; Eingangszentrale: Status der Warteschlange |
| 338 | Zurückstellen | `changeStatus` → updateLocalScheduleStatus (app/local-vault.ts) | ✅ | ✅ | Fristen: ohne Rückfrage, Status sofort gesetzt; Eingangszentrale: Status der Warteschlange |
| 339 | Wieder öffnen | `changeStatus` → updateLocalScheduleStatus (app/local-vault.ts) | ✅ | ✅ | Fristen: Statuswechsel ohne Rückfrage |
| 340 | Überfällig {counts.overdue} Anzeigen | `setViewFilter` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 341 | Bald fällig {counts.dueSoon} Anzeigen | `setViewFilter` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 342 | Offen {counts.open} Anzeigen | `setViewFilter` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 343 | (ohne Text) | `setRecordType` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 344 | (ohne Text) | `setConfirmed` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 345 | Wird gespeichert … / Frist oder Aufgabe bestätigt anlegen | `–` | ✅ | ✅ | Knopf erst nach Bestätigungshaken frei; Eintrag erscheint unter „Offen“ |
| 346 | Alle offenen anzeigen | `setViewFilter` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Eingangszentrale › Lokale Unterlagen / Online-Altbestand (10: ✅ 10)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 278 | Einzelne Unterlage prüfen | `onUpload` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 279 | Neu laden | `onRefresh` | ✅ | ✅ |  |
| 280 | (ohne Text) | `onOpenDocument` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 281 | Abgleich vormerken | `onLocalStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |
| 282 | Als geprüft bestätigen | `onLocalStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |
| 283 | Als eingearbeitet bestätigen | `onLocalStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |
| 284 | (ohne Text) | `onOpenDocument` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 285 | Abgleich vormerken | `onStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |
| 286 | Als geprüft bestätigen | `onStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |
| 287 | Als eingearbeitet bestätigen | `onStatus` | ✅ | ✅ | Statuswechsel lokaler Unterlagen |

### Startseite/Tagebuch › Erinnerung erfassen (8: ✅ 8)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 117 | image/*,video/* | `setFiles, Array.from, slice` | ✅ | ✅ | Dateiauswahl des Browsers |
| 118 | Fotos oder Videos | `click` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 119 | Tagebuch öffnen | `leaveToMemory` | ✅ | ✅ |  |
| 120 | Nächste Eingabe | `queue` | ✅ | ✅ | legt einen Entwurf in die Warteschlange |
| 121 | Eintrag prüfen | `review` | ✅ | ✅ | ein Entwurf: Prüf-Dialog; mehrere: Warteschlange im Tagebuch |
| 122 | Unbehandelte Erinnerungen: {queueCount} Zur Bearbeitungswarteschlange / Zurzeit wartet kei | `onOpenQueue` | ✅ | ✅ |  |
| 123 | Offene Memory-Fragen: {openPointCount} Bereits gespeicherte Einträge mit Klärungsbedarf | `onGo` | ✅ | ✅ |  |
| 124 | Erinnerung gespeichert {receipt.title} · {receipt.mediaCount} Medium : | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Dokumentenbibliothek › Karte (8: ⚠️ 1 · ✅ 7)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 257 | ${item.title} öffnen | `onOpen` | ⚠️ | ⚠️ | Vorschau-Dialog öffnet; PDF-Seiten erscheinen nur, wenn pdf.js von cdnjs.cloudflare.com geladen werden kann (Netz nötig; mit Internetschalter aus oder ohne Netz |
| 258 | {item.area} | `onArea` | ✅ (Rundgang) | ✅ | Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis |
| 259 | {item.documentType} | `onType` | ✅ (Rundgang) | ✅ | Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis |
| 260 | {item.title} | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 261 | Ohne Dokumentdatum | `onDate` | ✅ (Rundgang) | ✅ | Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis |
| 262 | (ohne Text) | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 263 | {reference.label} | `onReference` | ✅ (Rundgang) | ✅ | Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis |
| 264 | ${item.title} öffnen | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Dialog › Familienakte exportieren (7: ✅ 7)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 363 | Fenster schließen | `onClose` | ✅ | ✅ |  |
| 364 | (ohne Text) | `setSelected` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 365 | (ohne Text) | `toggle` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 366 | {destination ? `Ziel: $ {destination.name} ` : "Lokalen Zielordner auswählen"} | `selectDestination` → chooseExportDestination (app/local-vault.ts) | ✅ (Ordnerwahl) | 🔒 | Export schreibt einen Ordner Familienakte_Export_…; Start erst nach Zielordner + Umfang |
| 367 | (ohne Text) | `setIncludeOriginals` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 368 | Abbrechen | `onClose` | ✅ | ✅ |  |
| 369 | Export wird erstellt … / Export jetzt bewusst starten | `startExport` | ✅ (Ordnerwahl) | 🔒 | Export schreibt einen Ordner Familienakte_Export_…; Start erst nach Zielordner + Umfang |

### Dialog › Erinnerung gespeichert (6: ✅ 6)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 139 | Schließen | `onClose` | ✅ | ✅ |  |
| 140 | Nächstes unbehandeltes Memory bearbeiten | `onNext` | ✅ | ✅ | zwei Eingabe-Dialoge (Titel, Text) + Bestätigung |
| 141 | Chronologie anzeigen / Zur Übersicht der unbehandelten Ereignisse | `onNext` | ✅ | ✅ | Abschluss-Dialog nach dem Speichern |
| 142 | Zur Startseite | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 143 | Tagesübersicht öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 144 | Weitere Erinnerung erfassen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Systemprüfung › Praktische Abnahme (6: ✅ 6)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 391 | · {entry.title} Ja /5 bestanden | `onBlock` | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |
| 392 | Prüfung fortsetzen | `onResume` | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |
| 393 | (ohne Text) | `onChoice` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 394 | Nein / Diesen Test erneut prüfen / Diesen Test jetzt prüfen | `onRetry` | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |
| 395 | Alle 5 Prüfergebnisse übermitteln | `onSubmit` | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |
| 396 | Ergebnisse speichern und Testphase unterbrechen | `onSubmit` | ✅ | ✅ | Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten |

### Was gibt’s Neues? (5: ✅ 5)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 244 | ${item.preview.label}: ${item.title} | `onOpen` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |
| 245 | (ohne Text) | `setPeriod` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 246 | {item.title} | `open` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |
| 247 | ${item.title} öffnen | `open` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |
| 248 | Versionshistorie öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Kopfzeile (4: – 1 · ✅ 2 · ⚠️ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 63 | Hauptmenü öffnen | `setMobileOpen` | – | ✅ | nur in der Handy-Ansicht sichtbar |
| 64 | MMI FAMILIENAKTE Version {APP_VERSION} | `go → Seite "overview"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 65 | Aktuelle Seite drucken | `window.print` | ✅ (window.print) | ✅ | ruft den Druckdialog des Browsers; auf claude.ai ohne Wirkung |
| 66 | Ausloggen | `window.location.reload` | ⚠️ | ⚠️ | kein Konto: der Link lädt nur die Seite neu (location.reload); Daten bleiben |

### Hauptnavigation (Mega-Menü) (4: ✅ 4)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 67 | Startseite | `go → Seite "overview"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 68 | {area.label} | `setMegaOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 69 | Bereich öffnen | `go` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 70 | {item.label} {item.detail} | `go` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Rahmen (Breadcrumb, Suche, Hinweise) (4: ✅ 3 · ❌ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 71 | Suche löschen | `setQuery` | ✅ | ✅ |  |
| 72 | Beispieldaten entfernen | `removeSampleData` | ❌ Maus · ✅ Tastatur | ✅ | Zierkreis des Startbanners (.family-hero:after) liegt über dem Knopf und fängt den Mausklick ab (Desktop 1440 px); Dialog und Entfernen selbst funktionieren |
| 73 | Startseite | `go → Seite "overview"` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 74 | {parentArea.label} | `go` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Diagnosen, AU & ICD-Codes (4: ✅ 4)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 347 | {item.codes} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |
| 348 | {item.diagnosis} {item.evidence} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |
| 349 | {item.name} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |
| 350 | {item.codes} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |

### Dialog › Dokumentvorschau (3: ✅ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 60 | Vorschau schließen | `close` | ✅ | ✅ | schließt den Dialog |
| 61 | In neuem Fenster versuchen | `openOutside` | ✅ (window.open) | ⚠️ | Blob-URL in neuem Tab; auf claude.ai und in der APK nicht möglich |
| 62 | Schließen | `close` | ✅ | ✅ |  |

### Zusammenhang-Leiste (Tagebuch, Bibliothek) (3: ✅ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 145 | case / Vorgang / event / Memory Geschützter Eintrag {item.id} | `openRelated` | ✅ (Rundgang) | ✅ | Zusammenhang-Leiste: öffnet Vorgang/Memory (geschützte Einträge → Gesundheitsbereich) |
| 146 | (ohne Text) | `onChange` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 147 | Verbindung lösen | `onUnlink` | ✅ (Rückfrage) | ✅ |  |

### Bestand prüfen › Zuordnung (3: ✅ 2 · ❓ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 168 | (ohne Text) | `setter, if, newSetter` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 169 | (ohne Text) | `setLifeArea` | ✅ (Rundgang) | ✅ (Rundgang) | Eingabe-Element, in den Abläufen mitbenutzt |
| 170 | Zuordnung bestätigen | `onConfirm, personalArea.trim, documentType.trim, buildChoice` | ❓ (nur mit Analyse-Treffern) | 🔒 | Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst |

### Bestand prüfen › Vorschau (3: ✅ 2 · ⚠️ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 171 | Vorschau schließen | `onClose` | ✅ | ✅ | schließt den Dialog |
| 172 | Geschützte Gesundheitsakte öffnen | `onClose, onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 173 | Original öffnen | `window.open` | ⚠️ | 🔒 | Bestand-Vorschau: window.open der Originaldatei; nur mit Analyse-Treffern sichtbar, nicht ausgelöst |

### Systemprüfung (3: ⚠️ 1 · ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 241 | full / Prüfung läuft … / Abschlussprüfung 2.28.1 starten | `runCheck` | ⚠️ | ⚠️ | läuft, Ergebnis immer ROT (4 offene Punkte): die Abschlussprüfung verlangt den Pilot des Freundes (OneDrive-Testbestand, Bestandsanalyse, Lernsignale, Archivier |
| 242 | changes / Prüfung läuft … / Änderungen prüfen | `runCheck` | ✅ | ✅ |  |
| 243 | Systemprüfung reparieren | `runRepair` | ✅ | ✅ |  |

### Cockpit › To-do (3: ✅ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 301 | {item.title} {item.dueAt ? `Fällig: $ ` : "Ohne Fälligkeitsdatum"} · Priorität {item.prior | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 302 | (ohne Text) | `setNextStatus` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 303 | Wird gespeichert … / Status bestätigen | `apply` | ✅ | ✅ | Rückfrage, dann Status gespeichert; Abbrechen ändert nichts |

### Unterlagen & Quellen (3: ✅ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 357 | Alle Dokumente ansehen | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 358 | {item.name} | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 359 | {item.area} | `onDocuments` | ✅ (Rundgang) | ✅ | Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis |

### Dialog › Mit ChatGPT arbeiten (3: ✅ 3)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 360 | Fenster schließen | `onClose` | ✅ | ✅ |  |
| 361 | Auftrag kopieren | `copyPrompt` | ✅ | ✅ | kopiert den vorbereiteten ChatGPT-Auftrag; ohne Berechtigung klarer Hinweis |
| 362 | ChatGPT öffnen | `onStateChange` | ✅ (Link) | ✅ | normaler Link auf chatgpt.com in neuem Tab; keine API |

### Suche (Trefferliste) (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 166 | {item.kind} {item.title} {item.detail} {item.reason} | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 167 | Zusammenhang öffnen | `onOpen` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Familie & Personen (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 251 | Öffnen {action.label} {action.detail} Anzeigen | `open` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |
| 252 | Gesamtes Verzeichnis | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Wohnen / Fahrzeuge / Käufe & Garantien (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 253 | Unterlage hinzufügen | `onUpload` | ✅ | ✅ | Dateiauswahl des Browsers bzw. Ablage-Dialog |
| 254 | {title} {text} Dokumente anzeigen | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Gesamtes Verzeichnis (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 255 | {area.label} Hauptbereich öffnen | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 256 | {item.label} {item.detail} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Krankenkasse & Leistungen (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 351 | {item.period} {item.group} {item.clarification} {item.amount} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |
| 352 | {item.code} {item.diagnosis} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |

### Anfragen & Antworten (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 355 | {item.subject} | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |
| 356 | {item.title} {item.next} {item.priority} | `onSearch` | ✅ | ✅ | startet eine Suche / filtert die Bibliothek |

### Rückfrage-Dialog (Seite) (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 389 | Abbrechen | `cancel` | ✅ | ✅ |  |
| 390 | prompt / Übernehmen / Ja, fortfahren | `–` | ✅ | ✅ | Rückfrage-Dialog in der Seite (Ersatz für confirm/prompt) |

### ⓘ-Hinweis (überall) (2: ✅ 2)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 398 | {label} | `if, window.dispatchEvent, CustomEvent, setOpen` | ✅ | ✅ | ⓘ-Hinweis |
| 399 | Hinweis schließen | `setOpen` | ✅ | ✅ | ⓘ öffnet/schließt den Hinweistext |

### Bereichsseiten (Aktionskarten) (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 249 | {action.label} {action.detail} | `open` | ✅ | ✅ | Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich) |

### Gesundheit & Arbeit (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 250 | assessment / work / benefits {area.count} {area.title} {area.text} | `onGo` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Arbeit & Arbeitgeber (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 353 | {file} | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Anträge & Bescheide (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 354 | {file} | `onDocuments` | ✅ (Rundgang) | ✅ (Rundgang) | Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt |

### Aktivitätszeilen (oben) (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 397 | Copy (aria: Aktivitätszeile ${position} kopieren) | `copy` → copyActivityText (lib/ui-activity.ts) | ✅ (Berechtigung) · ⚠️ ohne | ⚠️ | kopiert genau den Zeilentext; ohne Zwischenablage-Berechtigung „Kopieren nicht möglich“; Knopf liegt rechts oben, auf 1440 px nicht vom Zierkreis verdeckt (geme |

### Mikrofon (überall) (1: ✅ 1)

| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| 400 | ${label}: ${listening ? "Diktat beenden" : "Diktat starten"} | `toggle` | ✅ (gestellt) | 🔒 Einzeldatei · ✅ https | Web Speech des Browsers; headless mit Ersatz gemessen: Text wird eingesetzt, Tippen beendet das Diktat; echtes Mikrofon → HANDPRUEFUNG.md |

