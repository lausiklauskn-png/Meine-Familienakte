// Baut docs/analyse/FUNKTIONSMATRIX.csv und .md aus dem Code-Inventar (inventar-code.json), dem Rundgang
// (inventar-laufend.json) und den Messergebnissen der Proben unter tests/ui/ (hier als Regeltabelle eingetragen).
// Aufruf: node tools/analyse/inventar-aus-code.mjs && node tools/analyse/matrix-bauen.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const inventar = JSON.parse(readFileSync(path.join(ROOT, "docs/analyse/inventar-code.json"), "utf8"));
let laufend = []; try { laufend = JSON.parse(readFileSync(path.join(ROOT, "docs/analyse/inventar-laufend.json"), "utf8")); } catch { /* Rundgang noch nicht gelaufen */ }
const helpSrc = readFileSync(path.join(ROOT, "lib/ui-help.ts"), "utf8");
const UI_HELP = {}; for (const m of helpSrc.matchAll(/^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/gm)) UI_HELP[m[1]] = m[2].replace(/\\"/g, '"');

const ORT = {
  Overview: "Startseite", DocumentIntakePanel: "Startseite › Dokumenteneingang", MemoryCapturePanel: "Startseite/Tagebuch › Erinnerung erfassen",
  MemoryReviewDialog: "Dialog › Erinnerung prüfen", MemoryCompletionDialog: "Dialog › Erinnerung gespeichert", RelatedContextPanel: "Zusammenhang-Leiste (Tagebuch, Bibliothek)",
  MemoryCenter: "Tagebuch & Erinnerungen", SearchPanel: "Suche (Trefferliste)", InventoryAssignmentEditor: "Bestand prüfen › Zuordnung", InventoryPreviewDialog: "Bestand prüfen › Vorschau",
  InventoryCenter: "Bestand prüfen", HelpCenter: "Hilfe", SystemCheck: "Systemprüfung", NewsPreview: "Was gibt’s Neues?", WhatsNew: "Was gibt’s Neues?", SubpageActions: "Bereichsseiten (Aktionskarten)",
  HealthHub: "Gesundheit & Arbeit", FamilyArea: "Familie & Personen", PreparedArea: "Wohnen / Fahrzeuge / Käufe & Garantien", Directory: "Gesamtes Verzeichnis", DocumentLibraryCard: "Dokumentenbibliothek › Karte",
  DocumentLibrary: "Dokumentenbibliothek", Inbox: "Eingangszentrale › Lokale Unterlagen / Online-Altbestand", SecurityCenter: "Sicherheitscenter", CockpitTodoRow: "Cockpit › To-do", InteractiveCockpit: "Interaktives Cockpit",
  ReminderCenter: "Fristen und Aufgaben", Medical: "Diagnosen, AU & ICD-Codes", Benefits: "Krankenkasse & Leistungen", Work: "Arbeit & Arbeitgeber", Assessment: "Anträge & Bescheide", Correspondence: "Anfragen & Antworten",
  Sources: "Unterlagen & Quellen", KiAuftragDialog: "Dialog › Mit KI arbeiten", ExportDialog: "Dialog › Familienakte exportieren", UploadDialog: "Dialog › Neue Unterlage ablegen", PageDialogHost: "Rückfrage-Dialog (Seite)",
  PracticalAcceptanceView: "Systemprüfung › Praktische Abnahme", ActivityRow: "Aktivitätszeilen (oben)", InfoPopover: "ⓘ-Hinweis (überall)", DictationButton: "Mikrofon (überall)", AssistantCenter: "Assistenzzentrale",
  CentralIntakeCenter: "Eingangszentrale", DocumentScanDialog: "Dialog › Dokument fotografieren", FileViewerHost: "Dialog › Dokumentvorschau",
};
function ortVon(e) {
  if (e.komponente === "HealthPortalContent") {
    if (/mega|nav-cluster|Bereich öffnen/.test(e.className + e.beschriftung) || /^\{area\.label\}|^\{item\.label\}/.test(e.beschriftung)) return "Hauptnavigation (Mega-Menü)";
    if (e.zeile >= 1218 && e.zeile <= 1232) return "Fußzeile";
    if (e.zeile <= 1075) return "Kopfzeile";
    if (e.zeile <= 1085) return "Hauptnavigation (Mega-Menü)";
    return "Rahmen (Breadcrumb, Suche, Hinweise)";
  }
  return ORT[e.komponente] || e.komponente;
}
const ORDNER = /chooseVault|chooseOneDriveVault|chooseInboxFolder|chooseInventorySourceFolder|chooseInventoryArchiveFolder|chooseDevelopmentBaseFolder|chooseExportDestination|requestVaultPermission|onSelectSource|onSelectArchive|onConnectLocal|onConnectOneDrive|onFullBackup|onRestoreTest|selectDestination|onSelectInbox|selectInboxFolder|chooseAndInspectWorkspace|runAutomaticTestEnvironment|onCompare|onCheckSync|onRunSync|onMigrate|onScanOneDrive|checkOneDriveInbox/;
// Messergebnisse (Regeltabelle, Reihenfolge wichtig): Muster auf Beschriftung/aria/Handler → [Desktop, Handy, Bemerkung, Probe]
const MESSUNG = [
  [/Beispieldaten entfernen/, "❌ Maus · ✅ Tastatur", "✅", "Zierkreis des Startbanners (.family-hero:after) liegt über dem Knopf und fängt den Mausklick ab (Desktop 1440 px); Dialog und Entfernen selbst funktionieren", "knoepfe-start"],
  [/Beispieldaten laden/, "✅", "✅", "legt die Beispielfamilie neu an, eigene Einträge bleiben", "knoepfe-start, knoepfe-leer"],
  [/Aktuelle Seite drucken/, "✅ (window.print)", "✅", "ruft den Druckdialog des Browsers; auf claude.ai ohne Wirkung", "knoepfe-start"],
  [/Ausloggen/, "⚠️", "⚠️", "kein Konto: der Link lädt nur die Seite neu (location.reload); Daten bleiben", "knoepfe-start"],
  [/Hauptmenü öffnen/, "–", "✅", "nur in der Handy-Ansicht sichtbar", "rundgang"],
  [/Suche löschen/, "✅", "✅", "", "knoepfe-start"],
  [/Aktivitätszeile \d kopieren|^Copy$/, "✅ (Berechtigung) · ⚠️ ohne", "⚠️", "kopiert genau den Zeilentext; ohne Zwischenablage-Berechtigung „Kopieren nicht möglich“; Knopf liegt rechts oben, auf 1440 px nicht vom Zierkreis verdeckt (gemessen)", "kopieren"],
  [/Auftrag kopieren/, "✅", "✅", "kopiert den vorbereiteten ChatGPT-Auftrag; ohne Berechtigung klarer Hinweis", "kopieren"],
  [/ChatGPT öffnen/, "✅ (Link)", "✅", "normaler Link auf chatgpt.com in neuem Tab; keine API", "rundgang"],
  [/^Kopieren$/, "✅", "✅", "Assistenz: Betreff + Entwurf", "kopieren"],
  [/Diktat starten|Diktat beenden/, "✅ (gestellt)", "🔒 Einzeldatei · ✅ https", "Web Speech des Browsers; headless mit Ersatz gemessen: Text wird eingesetzt, Tippen beendet das Diktat; echtes Mikrofon → HANDPRUEFUNG.md", "knoepfe-start, knoepfe-cockpit, knoepfe-assistenz"],
  [/erklären$|Weitere Informationen|Hinweis schließen/, "✅", "✅", "ⓘ öffnet/schließt den Hinweistext", "knoepfe-start"],
  [/Objekt-Cockpit|Arbeitsübersicht öffnen/, "✅", "✅", "führt ins Cockpit", "knoepfe-start"],
  [/Fotofunktion öffnen|Dokument fotografieren/, "✅ (Dateiwahl)", "✅ Kamera", "öffnet die Kamera/Dateiauswahl (capture=environment), danach Scan-Dialog", "knoepfe-start, knoepfe-dokumente"],
  [/Datei auswählen|Fotos oder Videos|Neue Unterlage$|Unterlage hinzufügen|Einzelne Unterlage prüfen|Datei hier ablegen/, "✅", "✅", "Dateiauswahl des Browsers bzw. Ablage-Dialog", "knoepfe-start, knoepfe-dokumente, knoepfe-assistenz"],
  [/Ordner auswählen|Eingangsordner auswählen|Eingangsordner jetzt prüfen/, "✅ (Ordnerwahl)", "🔒", "braucht showDirectoryPicker (nur Chrome/Edge am PC); gemessen mit gestelltem OPFS-Ordner", "knoepfe-start"],
  [/OneDrive-Ordner prüfen|OneDrive-Familienordner prüfen/, "✅ → Sicherheitscenter", "🔒", "ohne verbundenen OneDrive-Ordner führt der Knopf ins Sicherheitscenter", "knoepfe-start"],
  [/Nächste Eingabe/, "✅", "✅", "legt einen Entwurf in die Warteschlange", "knoepfe-start, knoepfe-cockpit"],
  [/Eintrag prüfen/, "✅", "✅", "ein Entwurf: Prüf-Dialog; mehrere: Warteschlange im Tagebuch", "knoepfe-start"],
  [/Bestätigt speichern/, "✅", "✅", "speichert den Memory-Eintrag, Abschluss-Dialog", "knoepfe-start, knoepfe-leer"],
  [/Tagebuch öffnen|Unbehandelte Erinnerungen|Offene Memory-Fragen/, "✅", "✅", "", "knoepfe-start"],
  [/Status bestätigen/, "✅", "✅", "Rückfrage, dann Status gespeichert; Abbrechen ändert nichts", "knoepfe-cockpit"],
  [/Notiz nach Bestätigung ergänzen/, "✅", "✅", "Rückfrage, Notiz protokolliert", "knoepfe-cockpit"],
  [/^Verknüpfen$|Nicht verknüpfen/, "✅", "✅", "Zusammenhangs-Vorschlag annehmen/ablehnen", "knoepfe-cockpit, knoepfe-dokumente"],
  [/Detailansicht schließen/, "✅", "✅", "", "knoepfe-cockpit"],
  [/Frist oder Aufgabe bestätigt anlegen/, "✅", "✅", "Knopf erst nach Bestätigungshaken frei; Eintrag erscheint unter „Offen“", "knoepfe-cockpit, knoepfe-leer"],
  [/Als erledigt markieren|Zurückstellen$/, "✅", "✅", "Fristen: ohne Rückfrage, Status sofort gesetzt; Eingangszentrale: Status der Warteschlange", "knoepfe-cockpit, knoepfe-dokumente"],
  [/^Prüfen$/, "✅", "✅", "öffnet den Prüf-Dialog des Entwurfs", "knoepfe-start"],
  [/^Ergänzen$/, "✅", "✅", "führt zur Startseite und holt den Entwurf ins Eingabefeld (Entwurf bleibt in der Warteschlange)", "knoepfe-cockpit"],
  [/Entwurf löschen/, "✅", "✅", "Rückfrage, nur dieser Entwurf", "knoepfe-cockpit"],
  [/Tag zusammenfassen|Zusammenfassung schließen|Älteste zuerst|Neueste zuerst/, "✅", "✅", "", "knoepfe-cockpit"],
  [/Als erledigt bestätigen|Weiter beobachten/, "✅", "✅", "offener Memory-Punkt", "knoepfe-cockpit"],
  [/Memory bearbeiten/, "✅", "✅", "zwei Eingabe-Dialoge (Titel, Text) + Bestätigung", "knoepfe-cockpit"],
  [/Memory löschen/, "✅ (Rückfrage)", "✅", "", "knoepfe-cockpit"],
  [/Verbindung lösen/, "✅ (Rückfrage)", "✅", "", "knoepfe-cockpit"],
  [/Zur Warteschlange/, "✅", "✅", "", "knoepfe-cockpit"],
  [/Alle ansehen|Filter zurücksetzen|Zur Bibliotheksübersicht|Datensätze anzeigen|Dokumentensuche löschen/, "✅", "✅", "", "knoepfe-dokumente"],
  [/library-preview|\.pdf öffnen|^\{visibleDocumentTitle\(item\)\} öffnen$/, "⚠️", "⚠️", "Vorschau-Dialog öffnet; PDF-Seiten erscheinen nur, wenn pdf.js von cdnjs.cloudflare.com geladen werden kann (Netz nötig; mit Internetschalter aus oder ohne Netz: „Die PDF-Vorschau ist hier nicht verfügbar“)", "knoepfe-dokumente"],
  [/In neuem Fenster versuchen/, "✅ (window.open)", "⚠️", "Blob-URL in neuem Tab; auf claude.ai und in der APK nicht möglich", "knoepfe-dokumente"],
  [/Lebensbereich auswählen|Dokumentenart auswählen|Datenschutzstufe auswählen|Bereich auswählen|Ohne Änderung schließen|Auswahlfenster schließen|^Übernehmen$/, "✅", "✅", "Auswahlfenster im Ablage-Dialog (22 Optionen beim Lebensbereich)", "knoepfe-dokumente"],
  [/Geprüft lokal speichern/, "✅", "✅", "Dokument wird im Tresor angelegt; Dublette ohne Haken wird abgewiesen", "knoepfe-dokumente"],
  [/Trotzdem übernehmen/, "✅", "✅", "Haken bei Dublette", "knoepfe-dokumente"],
  [/Vorhandenes Dokument .* öffnen/, "✅", "✅", "bei Dublette", "knoepfe-dokumente"],
  [/Anlagen in Warteschlange prüfen/, "✅", "✅", "E-Mail-Anlage wird eigener Eingang", "knoepfe-dokumente"],
  [/Zuordnung prüfen$/, "✅", "✅", "öffnet den Ablage-Dialog mit der Datei", "knoepfe-dokumente"],
  [/Weiterbearbeiten|Nicht übernehmen|Sichere Vorschläge vormerken/, "✅", "✅", "Sammelknöpfe erscheinen nach Ankreuzen; „Nicht übernehmen“ ändert den Zustand, die Zahl „Eingänge“ bleibt", "knoepfe-dokumente"],
  [/Als gemeinsames Scan-Dokument prüfen/, "❓", "❓", "nur mit mindestens zwei Bildern in der Warteschlange; nicht ausgelöst", "–"],
  [/Eingänge$|^\{counts\./, "✅", "✅", "Zähl-Knöpfe rollen zum Abschnitt / wählen alle", "knoepfe-dokumente"],
  [/Als geprüft bestätigen|Als eingearbeitet bestätigen|Abgleich vormerken/, "✅", "✅", "Statuswechsel lokaler Unterlagen", "knoepfe-dokumente"],
  [/Neu laden/, "✅", "✅", "", "knoepfe-dokumente"],
  [/Fertig – PDF erstellen|Seite \d+ (öffnen|nach oben|nach unten|entfernen|neu fotografieren)|drehen|Scan schließen|Weitere Seite|Fotos? aus Galerie|Reihenfolge prüfen|Zuschneiden|Verbessern|buildPdf|movePage|removePage|rotateScanPage|setReviewReady|cameraRef|photoRef/, "✅", "✅ (Kamera)", "Scan-Dialog: zwei Bilder → Seiten ordnen, drehen → PDF → Ablage-Dialog", "knoepfe-dokumente"],
  [/Jetzt Abgleich durchführen/, "❌ (Browser-Datentresor)", "🔒", "mit dem Browser-Datentresor sofort „Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner … SOFTWARE TESTORDNER“ und Sprung nach „Bestand prüfen“", "knoepfe-sicherheit"],
  [/Export vorbereiten|Familienakte exportieren|Lokalen Zielordner auswählen|Export jetzt bewusst starten/, "✅ (Ordnerwahl)", "🔒", "Export schreibt einen Ordner Familienakte_Export_…; Start erst nach Zielordner + Umfang", "knoepfe-sicherheit"],
  [/Vollständige Sicherung erstellen/, "✅ (Ordnerwahl)", "🔒", "Ordner Familienakte_Vollsicherung_… mit Register, Medien, Prüfsummen", "knoepfe-sicherheit"],
  [/Wiederherstellung testen/, "✅ (2 × Ordnerwahl)", "🔒", "Sicherung → leerer Ordner, per Prüfsummen bestätigt", "knoepfe-sicherheit"],
  [/OneDrive-Ordner verbinden/, "✅ (Ordnerwahl)", "🔒", "", "knoepfe-sicherheit"],
  [/Anderen PC-\/USB-Ordner wählen|PC-\/USB-Ordner verbinden/, "✅ (Ordnerwahl)", "🔒", "stellt auf den gewählten Ordner um", "knoepfe-sicherheit"],
  [/^Sperren$/, "✅", "✅", "trennt in diesem Browser, löscht nichts; danach ist die Startseite leer bis zum Neuladen", "knoepfe-sicherheit"],
  [/Abgleich prüfen|Online-Bestand lokal kopieren/, "✅ / ⚠️", "🔒", "„Abgleich prüfen“ nur mit OneDrive + PC-Ordner; „Online-Bestand lokal kopieren“ bleibt ohne Online-Altbestand gesperrt (Altlast aus der Cloudflare-Fassung)", "knoepfe-sicherheit"],
  [/Hauptordner einschließlich Unterordner auswählen|Test-Hauptordner erneut auswählen/, "✅ (Ordnerwahl)", "🔒", "", "knoepfe-sicherheit"],
  [/Bestand jetzt prüfen|Analyse pausieren|Analyse fortsetzen/, "✅", "🔒", "Analyse des gewählten Ordners (1 Datei geprüft)", "knoepfe-sicherheit"],
  [/Archivdatenträger auswählen/, "✅ (Ordnerwahl)", "🔒", "", "knoepfe-sicherheit"],
  [/Windows-Dateisystem diagnostizieren|Diagnose kopieren|copyStorageDiagnostic/, "✅", "⚠️", "Bericht wird erzeugt und kopiert (Zwischenablage-Berechtigung)", "knoepfe-sicherheit"],
  [/Testumgebung automatisch einrichten und prüfen/, "⚠️", "🔒", "setzt den festen Windows-Pfad G:\\01GPT-SOFTWARE\\… des Freundes voraus; im Browser-Tresor endet es mit einem Fehlerbericht (136 Diagnoseereignisse)", "knoepfe-sicherheit"],
  [/Fehlerbericht kopieren|copyAutomaticTestFailure/, "✅", "⚠️", "", "knoepfe-sicherheit"],
  [/Testregister vorbereiten|Vorschau verwerfen|confirmPreparedTestRegister/, "✅", "🔒", "Vorschau/Hinweis", "knoepfe-sicherheit"],
  [/Abschlussprüfung 2\.28\.1 starten/, "⚠️", "⚠️", "läuft, Ergebnis immer ROT (4 offene Punkte): die Abschlussprüfung verlangt den Pilot des Freundes (OneDrive-Testbestand, Bestandsanalyse, Lernsignale, Archivierung) – kein Fehler der App, aber für Klaus nicht erreichbar", "knoepfe-sicherheit, knoepfe-leer"],
  [/Änderungen prüfen|Systemprüfung reparieren/, "✅", "✅", "", "knoepfe-sicherheit"],
  [/Alle 5 Prüfergebnisse übermitteln|Ergebnisse speichern und Testphase unterbrechen|Prüfung fortsetzen|erneut prüfen|\d · |onBlock|onResume|onRetry|onSubmit/, "✅", "✅", "Praktische Abnahme: 15 Auswahlfelder, Übermitteln nach 5 Antworten", "knoepfe-sicherheit"],
  [/Familienakte prüfen und Vorschlag vorbereiten/, "✅", "✅", "Regelauswertung der Akte (keine KI); Fakten, Vorgang, Vorschlag", "knoepfe-assistenz"],
  [/Schreiben vorbereiten/, "✅", "✅", "nur im Modus „Schreiben oder E-Mail erstellen“", "knoepfe-assistenz"],
  [/Kürzer|Freundlicher|Bestimmter|Sachlicher/, "✅", "✅", "feste Textbausteine (lib/family-assistant.ts), keine KI", "knoepfe-assistenz"],
  [/Als Entwurf speichern|Als versandbereit speichern|Als versendet speichern/, "✅", "✅", "nur mit Bestätigungshaken; legt Korrespondenz-Datensatz an", "knoepfe-assistenz"],
  [/Vorgang öffnen/, "✅", "✅", "", "knoepfe-assistenz"],
  [/Ich habe ein Problem|Mich beraten lassen|Schreiben oder E-Mail erstellen|Termin vorbereiten|Bestehenden Vorgang weiterbearbeiten|assistant-mode-action/, "✅", "✅", "Modus-Wahl (aria-pressed)", "knoepfe-assistenz"],
  [/Brillenpass Mattis|Vorsorgekalender|Schreiben der Krankenkasse|Rechnung der Waschmaschine|Mietvertrag Pustelblumenweg|Impfpass und Vorsorge|onSearch\(/, "✅", "✅", "startet eine Suche / filtert die Bibliothek", "knoepfe-assistenz, knoepfe-start"],
  [/Fenster schließen|^Schließen$|^Abbrechen$|Scan schließen/, "✅", "✅", "", "rundgang, knoepfe-*"],
  [/Ja, fortfahren/, "✅", "✅", "Rückfrage-Dialog in der Seite (Ersatz für confirm/prompt)", "knoepfe-*"],
  [/news-preview|Alle Neuigkeiten anzeigen|^open$/, "✅", "✅", "Vorschau-Karten / Aktionskarten öffnen die Quelle (118 Karten, 19 geschützt → Gesundheitsbereich)", "knoepfe-assistenz"],
  [/^Lebensbereiche$|openLifeAreas/, "✅", "✅", "Startseite, rollt zu den Lebensbereichen", "rundgang"],
  [/^Prüfberichte$|openFooterSystemReports/, "✅", "✅", "Systemprüfung, rollt zu den Prüfberichten", "rundgang"],
  [/openChatGPTEdit|Mit KI arbeiten/, "✅", "✅", "öffnet den ChatGPT-Dialog (nur Auftrag kopieren + Link)", "rundgang, kopieren"],
  [/onStartIntake|Neue Unterlage ablegen/, "✅", "✅", "öffnet den Ablage-Dialog", "knoepfe-start"],
  [/onUpdate|Akte aktualisieren/, "✅", "✅", "Statuskachel; ohne geprüfte Dokumente Hinweis", "knoepfe-start"],
  [/onLockOneDrive|onLockLocal/, "✅", "✅", "Sperren: trennt die Ordnerfreigabe in diesem Browser, löscht nichts", "knoepfe-sicherheit"],
  [/^onHelp$|^Hilfe$/, "✅", "✅", "führt zur Hilfe", "knoepfe-sicherheit"],
  [/onConfirmContext|onRejectContext/, "✅", "✅", "Zusammenhangs-Vorschlag (nur bei offenem Vorschlag sichtbar)", "knoepfe-cockpit"],
  [/onAssistant|Assistenz fragen|Assistenz &amp/, "✅", "✅", "Dossier → Assistenz mit Vorgang", "knoepfe-cockpit"],
  [/onAddMemoryToCase|Ereignis ergänzen/, "✅ (Code)", "✅", "Dossier → Startseite, Erinnerung mit vorgeschlagenem Vorgang; nicht einzeln geklickt", "–"],
  [/onAddDocumentToCase|Dokument hinzufügen/, "✅ (Code)", "✅", "Dossier → Ablage-Dialog mit vorgeschlagenem Vorgang; nicht einzeln geklickt", "–"],
  [/Wieder öffnen|changeStatus/, "✅", "✅", "Fristen: Statuswechsel ohne Rückfrage", "knoepfe-cockpit"],
  [/applyChoice|^\{option\}$/, "✅", "✅", "Auswahlfenster: Option übernehmen", "knoepfe-dokumente"],
  [/^onClose$|^close$|^cancel$|^requestClose$|Vorschau schließen|^Schließen$|^Abbrechen$/, "✅", "✅", "schließt den Dialog", "knoepfe-*"],
  [/^onNext$|Chronologie anzeigen|Zur Übersicht der unbehandelten/, "✅", "✅", "Abschluss-Dialog nach dem Speichern", "knoepfe-start"],
  [/openRelated/, "✅ (Rundgang)", "✅", "Zusammenhang-Leiste: öffnet Vorgang/Memory (geschützte Einträge → Gesundheitsbereich)", "rundgang"],
  [/Original öffnen/, "⚠️", "🔒", "Bestand-Vorschau: window.open der Originaldatei; nur mit Analyse-Treffern sichtbar, nicht ausgelöst", "–"],
  [/Zuordnung bestätigen|Dateien archivieren|Assistenzfreigabe|Dateien zurücksetzen|selectVisible|Dateien auswählen|Testumgebung kontrolliert zurücksetzen|onArchive|onRelease|onReset|onConfirm/, "❓ (nur mit Analyse-Treffern)", "🔒", "Bestand prüfen: erscheint nach einer Analyse mit Treffern bzw. nach der Testumgebung; Handler vorhanden (lib/fawoga-inventory.ts), nicht ausgelöst", "–"],
  [/Kompakt anzeigen|Alle Eingangsfälle ansehen|setShowAll|^onFile$|prüfen und erfassen|neue oder geänderte Datei/, "❓ (nur mit Eingangsordner-Treffern)", "🔒", "Dokumenteneingang-Kachel: erscheint nach „Eingangsordner prüfen“ mit Treffern; nicht ausgelöst", "–"],
  [/openMedia|lokal öffnen/, "❓", "❓", "Tagebuch: Foto/Video eines Eintrags öffnen; keine Medien in den Beispieldaten", "–"],
  [/^onArea$|^onType$|^onDate$|^onReference$|^\{item\.area\}$|^\{item\.documentType\}$|Ohne Dokumentdatum|^\{reference\.label\}$/, "✅ (Rundgang)", "✅", "Bibliotheks-Karte: Klick setzt den Filter (Bereich/Art/Datum) bzw. öffnet den Verweis", "knoepfe-dokumente"],
  [/^onUpload$/, "✅", "✅", "öffnet den Ablage-Dialog", "knoepfe-dokumente"],
  [/^copy$|^copyDraft$/, "✅", "⚠️", "Zwischenablage", "kopieren"],
  [/^onSetStatus$|^onReview$/, "✅", "✅", "Eingangszentrale: Zustand setzen / Zuordnung prüfen", "knoepfe-dokumente"],
  [/^\{label\}$|start-info-trigger/, "✅", "✅", "ⓘ-Hinweis", "knoepfe-start"],
];
const NAV = /\bgo\(|scrollIntoView|setMegaOpen|setMobileOpen|setQuery|onGo|onOpen|onSearch|onDocuments|openGroup|setView|setSelectedId|setMode|setChoiceField|openChoice|setShowSummary|setDraftDirection|focus\(|openPriority|openReference|setPreviewItemId|setGroup|setNextStatus|setKind|setTone|setCaseId|setConfirmed|toggle\(|setSelected|setIncludeOriginals|setAllowDuplicate|setResolveOpenPointEventId|setStatementRows|setChosenCaseId|setRejectedContext|setNewCaseTitle|setSelectedCaseId|setRecordType|setDueAt|setReminderAt|setPersonId|setObjectId|setCaseId|setDocumentId|setArea|setDocumentType|setStartDate|setEndDate|setSort|onChoice|onToggle|setFiles|updatePage|setMode/;
function bewertung(e) {
  const text = `${e.beschriftung} ${e.ariaLabel} ${e.title} ${e.className} ${e.handlerAusdruck}`;
  const felder = [e.beschriftung.replace(/\s+/g, " ").trim(), e.ariaLabel, e.handler, text];
  for (const [re, d, h, bem, probe] of MESSUNG) if (felder.some((f) => f && re.test(f))) return { desktop: d, handy: h, bemerkung: bem, probe };
  if (e.art === "Datei-Eingang") return { desktop: "✅", handy: "✅", bemerkung: /capture/.test(e.handlerAusdruck + e.beschriftung) ? "Kamera (Handy) bzw. Dateiauswahl" : "Dateiauswahl des Browsers", probe: "knoepfe-dokumente" };
  if (e.art === "Ablagefläche") return { desktop: "✅ (Code)", handy: "–", bemerkung: "Drag & Drop; headless nicht gezogen, derselbe Weg wie „Datei auswählen“", probe: "–" };
  if (ORDNER.test(e.handlerAusdruck)) return { desktop: "✅ (Ordnerwahl)", handy: "🔒", bemerkung: "braucht die Ordnerauswahl des Browsers (Chrome/Edge am PC)", probe: "knoepfe-sicherheit" };
  if (e.komponente === "DictationButton") return { desktop: "✅ (gestellt)", handy: "✅ https", bemerkung: "Web Speech", probe: "knoepfe-start" };
  if (NAV.test(e.handlerAusdruck)) return { desktop: "✅ (Rundgang)", handy: "✅ (Rundgang)", bemerkung: "Navigation/Anzeige/Eingabe; Zielseiten im Rundgang ohne Fehler geladen, Eingaben in den Abläufen mitbenutzt", probe: "rundgang" };
  if (e.art === "Auswahlliste" || e.art === "Schalter") return { desktop: "✅ (Rundgang)", handy: "✅ (Rundgang)", bemerkung: "Eingabe-Element, in den Abläufen mitbenutzt", probe: "knoepfe-*" };
  return { desktop: "❓ nicht einzeln geklickt", handy: "❓", bemerkung: "Handler im Code vorhanden; nicht einzeln gemessen", probe: "–" };
}
function sonstige(e) {
  const text = `${e.beschriftung} ${e.ariaLabel} ${e.handlerAusdruck} ${e.className}`;
  if (ORDNER.test(e.handlerAusdruck) || /Ordner auswählen|Zielordner|Ordner wählen|Ordner verbinden/.test(text)) return "Firefox 🔒 · Safari 🔒 · claude.ai 🔒 · Einzeldatei 🔒 (keine Ordnerauswahl)";
  if (e.komponente === "DictationButton" || /Diktat/.test(text)) return "Firefox 🔒 · Safari ✅ (https) · claude.ai 🔒 · Einzeldatei 🔒 (Mikrofon gesperrt)";
  if (/window\.print/.test(text)) return "Firefox ✅ · Safari ✅ · claude.ai 🔒 · Einzeldatei ✅";
  if (/clipboard|kopieren/i.test(text)) return "Firefox ✅ · Safari ✅ · claude.ai ⚠️ (Berechtigung) · Einzeldatei ✅";
  if (/window\.open|neuem Fenster/.test(text)) return "Firefox ✅ · Safari ⚠️ (Popup) · claude.ai 🔒 · Einzeldatei ⚠️";
  if (/library-preview|öffnen$/.test(text) && e.komponente === "DocumentLibraryCard") return "alle: PDF nur mit Netz (cdnjs)";
  if (/capture/.test(text)) return "Firefox ✅ Dateiwahl · Safari ✅ · claude.ai ✅ · Einzeldatei ✅ Kamera";
  return "Firefox ✅ · Safari ✅ · claude.ai ✅ · Einzeldatei ✅ (aus Code: keine Browser-Sonderfunktion)";
}
function absicht(e) {
  const label = e.beschriftung.replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();
  const key = Object.keys(UI_HELP).find((k) => label === k || e.ariaLabel === `${k} erklären` || label.startsWith(k));
  if (key && /erklären/.test(e.ariaLabel)) return `Erklärt „${key}“: ${UI_HELP[key].slice(0, 140)}`;
  const go = e.handlerAusdruck.match(/go\("([^"]+)"/);
  if (go) return `Öffnet die Seite „${go[1]}“`;
  if (/scrollIntoView/.test(e.handlerAusdruck)) return "Rollt zum Abschnitt";
  if (key) return UI_HELP[key].slice(0, 160);
  if (e.fachfunktionen.length) return `Ruft ${e.fachfunktionen.map((f) => f.split(" ")[0]).join(", ")}`;
  return e.art === "Knopf" ? `„${label || e.ariaLabel}“ (Absicht aus Beschriftung)` : e.art;
}
const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
const zeilen = inventar.map((e) => {
  const b = bewertung(e);
  return { nr: e.nr, ort: ortVon(e), art: e.art, beschriftung: (/[A-Za-zÄÖÜäöüß]/.test(e.beschriftung) ? e.beschriftung.replace(/\s+/g, " ").slice(0, 90) : e.ariaLabel) || e.ariaLabel || "(ohne Text)", aria: e.ariaLabel, fundstelle: `${e.datei}:${e.zeile}`, handler: e.handler.slice(0, 90), fach: e.fachfunktionen.join("; "), absicht: absicht(e), desktop: b.desktop, handy: b.handy, sonstige: sonstige(e), bemerkung: b.bemerkung, probe: b.probe };
});
const kopf = ["Nr", "Ort/Seite", "Art", "Beschriftung", "aria-label", "Datei:Zeile", "Handler", "Fachfunktion (lib/ bzw. local-vault)", "Absicht", "Ergebnis Desktop-Chrome", "Ergebnis Handy-Ansicht", "Firefox/Safari/claude.ai/Einzeldatei (aus Code)", "Bemerkung", "Probe"];
writeFileSync(path.join(ROOT, "docs/analyse/FUNKTIONSMATRIX.csv"), "\uFEFF" + [kopf.map(csvEscape).join(";"), ...zeilen.map((z) => [z.nr, z.ort, z.art, z.beschriftung, z.aria, z.fundstelle, z.handler, z.fach, z.absicht, z.desktop, z.handy, z.sonstige, z.bemerkung, z.probe].map(csvEscape).join(";"))].join("\n"), "utf8");

// Zählung
const sym = (s) => s.startsWith("❌") ? "❌" : s.startsWith("⚠") ? "⚠️" : s.startsWith("🔒") ? "🔒" : s.startsWith("❓") ? "❓" : s.startsWith("–") ? "–" : "✅";
const zaehl = {}; for (const z of zeilen) { const k = sym(z.desktop); zaehl[k] = (zaehl[k] || 0) + 1; }
const zaehlH = {}; for (const z of zeilen) { const k = sym(z.handy); zaehlH[k] = (zaehlH[k] || 0) + 1; }
const proOrt = {}; for (const z of zeilen) (proOrt[z.ort] ||= []).push(z);
const laufendOrte = laufend.filter((s) => s.umgebung === "desktop").length;
const laufendElemente = new Set(laufend.flatMap((s) => s.elemente.map((e) => `${e.art}|${e.text}`))).size;
const artZaehl = Object.entries(inventar.reduce((a, e) => (a[e.art] = (a[e.art] || 0) + 1, a), {})).map(([k, v]) => `${v} × ${k}`).join(", ");
let md = `# Funktionsmatrix – alle Bedienelemente der Familienakte (Stand ${new Date().toISOString().slice(0, 10)})

Zwei Inventare, gegeneinander abgeglichen:

| Quelle | Werkzeug | Ergebnis |
| --- | --- | --- |
| Quelltext (\`app/*.tsx\`) | \`node tools/analyse/inventar-aus-code.mjs\` → \`docs/analyse/inventar-code.json\` | **${inventar.length} Bedienelemente**: ${artZaehl} |
| laufende App (Rundgang) | \`node tests/run-ui.mjs rundgang\` → \`docs/analyse/inventar-laufend.json\` | ${laufendOrte} Orte (Desktop) besucht, ${laufendElemente} verschiedene sichtbare Bedienelemente (Text + Art) |

Die Zahl aus dem Code ist höher als „rund 350 Knöpfe“ aus dem Auftrag, weil viele Knöpfe auf **einer** Quelltextzeile stehen (\`grep -c\` zählt Zeilen). Der Rundgang sieht andere Zahlen, weil ein Knopf im Code zu vielen Knöpfen auf dem Schirm wird (je Dokument, je Frist …) und umgekehrt viele Knöpfe nur in Dialogen oder bei bestimmten Zuständen erscheinen (Dubletten, offene Vorschläge, OneDrive verbunden, laufende Analyse, Fehlerbericht). Diese bedingten Knöpfe stehen in der CSV mit Handler und Bedingung in der Spalte „Bemerkung“.

**Ergebnis je Bedienelement (Desktop-Chrome, 1440 px):** ${Object.entries(zaehl).map(([k, v]) => `${k} ${v}`).join(" · ")}
**Handy-Ansicht (390 px, Chromium):** ${Object.entries(zaehlH).map(([k, v]) => `${k} ${v}`).join(" · ")}

Legende: ✅ funktioniert (gemessen) · ✅ (Rundgang) nur Navigation/Anzeige/Eingabe, Zielseite im Rundgang fehlerfrei · ⚠️ teilweise · ❌ defekt · 🔒 in dieser Umgebung gesperrt · ❓ Absicht unklar oder nicht einzeln gemessen · – nicht vorhanden in dieser Ansicht.
Die vollständige Tabelle mit Fundstelle, Handler, Fachfunktion und Absicht: [FUNKTIONSMATRIX.csv](FUNKTIONSMATRIX.csv) (Trennzeichen \`;\`, UTF-8 mit BOM, in Excel/LibreOffice direkt zu öffnen).

## Echte Defekte und Einschränkungen (mit Reproduktion)

| Nr | Befund | Reproduktion | Fundstelle | Schwere |
| --- | --- | --- | --- | --- |
| D1 | **„Beispieldaten entfernen“ ist mit der Maus nicht erreichbar** (Desktop ab ca. 1130 px Breite). Der Zierkreis des Startbanners (\`.family-hero:after\`, 310 px, \`top: -160px\`) liegt über dem Hinweis „Alle Daten sind Beispieldaten“ und fängt den Klick ab. Tastatur (Tab + Enter) funktioniert. | Startseite öffnen, auf den Knopf klicken → nichts passiert; \`document.elementFromPoint\` liefert \`section.family-hero\` | \`app/globals.css\` Zeile 501 (\`.family-hero:after\` ohne \`pointer-events: none\`); Hinweis aus PR #2 | hoch (Klaus’ erster Handgriff) |
| D2 | **PDF-Vorschau braucht Netz**: pdf.js wird von cdnjs.cloudflare.com geladen. Ohne Netz oder mit Internetschalter „aus“: „Die PDF-Vorschau ist hier nicht verfügbar.“ | Dokumentenbibliothek → Karte „öffnen“ bei getrenntem Netz | \`app/file-viewer.tsx\` (PDFJS von cdnjs) | hoch für den Offline-Bau (Teil 2: ins Paket legen) |
| D3 | **„Jetzt Abgleich durchführen“ (Sicherheitscenter) scheitert mit dem Browser-Datentresor** und springt nach „Bestand prüfen“: „Analyse-Hauptordner und Familienakten-Datentresor sind derselbe Ordner. Bitte … „SOFTWARE TESTORDNER“ auswählen.“ Der Text nennt den Testordner des Freundes. | Sicherheitscenter → „Jetzt Abgleich durchführen“ | \`app/health-portal.tsx\` \`startVaultInventoryComparison\` | mittel |
| D4 | **Systemprüfung ist immer ROT** (4 offene Punkte): Die „Abschlussprüfung 2.28.1“ verlangt den Entwicklungs-Pilot des Freundes (OneDrive-Testbestand, Bestandsanalyse pausieren/fortsetzen, 2 Lernsignale, Archivierung + Assistenz-Freigabe). Für Klaus ohne diesen Pilot nicht erreichbar; „Systemprüfung reparieren“ ändert daran nichts. | Hilfe → Systemprüfung → „Abschlussprüfung 2.28.1 starten“ | \`app/health-portal.tsx\` \`SystemCheck\`, \`lib/system-check-manifest.json\` | mittel (Verständnis) |
| D5 | **„Testumgebung automatisch einrichten und prüfen“** setzt den festen Windows-Pfad \`G:\\01GPT-SOFTWARE\\…\` voraus; im Browser-Tresor endet es mit einem technischen Fehlerbericht (136 Diagnoseereignisse). | Bestand prüfen → Knopf | \`app/local-vault.ts\` \`AUTOMATED_TEST_WINDOWS_BASE_PATH\` | niedrig (Entwicklerwerkzeug) |
| D6 | **„Ausloggen“ loggt nichts aus**: Es gibt kein Konto mehr; der Link lädt die Seite neu, alle Daten bleiben. Für Klaus irreführend, aber Wortlaut des Freundes. | Kopfzeile → Ausloggen | \`app/health-portal.tsx\` \`.logout-button\` | niedrig (Wortlaut) |
| D7 | **„Online-Bestand lokal kopieren“** bleibt immer gesperrt (kein Online-Altbestand mehr, Rest der Cloudflare-Fassung); „Abgleich prüfen“ nur mit OneDrive + PC-Ordner. | Sicherheitscenter | \`SecurityCenter\` | niedrig |
| D8 | **Sperren → leere Startseite**: Nach „Sperren“ des PC-/USB-Tresors ist bis zum Neuladen kein Datentresor verbunden; nach Neuladen ist der Browser-Datentresor automatisch wieder da (Beispieldaten erhalten). | Sicherheitscenter → Sperren → Startseite | \`lockLocalVault\` | niedrig (Verhalten dokumentieren) |
| D9 | **„Nicht übernehmen“ in der Eingangszentrale** ändert den Zustand des Eingangs, die Zahl „Eingänge“ bleibt gleich (Eingang bleibt in der Liste). | Eingangszentrale → Eingang ankreuzen → Nicht übernehmen | \`app/central-intake-center.tsx\` | niedrig |
| D10 | **Aktivitätszeilen nach Systemprüfung doppelt**: Beide Zeilen zeigen denselben Text „Systemprüfung abgeschlossen · ROT“ (Prüfung und automatische Reparatur melden gleich). | Systemprüfung starten, oben lesen | \`SystemCheck\` \`onCompleted\` | niedrig |

Umgebungsgrenzen (keine Defekte, aber für Klaus wichtig): Ordnerauswahl (Tresor, OneDrive, Eingangsordner, Bestand, Export, Sicherung) nur in Chrome/Edge am PC; Mikrofon nur über https (oder localhost) in Chrome/Edge/Safari; Drucken, neue Fenster und Downloads auf claude.ai nicht; Firefox ohne Spracherkennung. Alles weitere je Bedienelement in der CSV, Spalte „Firefox/Safari/claude.ai/Einzeldatei“.

## Proben (Playwright, Chromium, gegen \`vite preview\`)

\`node tests/run-ui.mjs\` fährt alle; einzeln mit Filter, z. B. \`node tests/run-ui.mjs knoepfe-start\`.

| Probe | Umfang | Stand |
| --- | --- | --- |
| \`rundgang\` | 8 Hauptmenüs, 35 Menüeinträge, 16 Fußzeilen-Einträge, 2 Dialoge, Handy-Navigation, Querlaufen | 73 grün |
| \`knoepfe-start\` | Kopf-/Fußzeile, Suche inkl. „Verstanden als:“, Diktat (gestellt), Drucken, Ausloggen, Objekt-Cockpit, Dokumenteneingang-Kacheln, Erinnerung erfassen, Beispieldaten entfernen/laden | 33 grün, 1 bekannter Defekt (D1) |
| \`knoepfe-cockpit\` | Cockpit (Kacheln, Dossier, Statuswechsel, Notiz, Verknüpfen), Fristen (Filter, Diktat, anlegen, erledigt, zurückstellen, Verweise), Tagebuch (Entwurf, Prüfen, Ergänzen, Löschen, Zusammenfassung, Memory bearbeiten/löschen, Verbindung lösen) | 27 grün |
| \`knoepfe-dokumente\` | Bibliothek (Suche, Filter, Vorschau, Kacheln), Ablage-Dialog (Vorschlag, Auswahlfenster, Speichern, Dublette), Eingangszentrale (4 Dateitypen, E-Mail-Anlage, Zustände, Sammelknöpfe), Dokument fotografieren (2 Seiten → PDF) | 22 grün, 1 bekannter Defekt (D2) |
| \`knoepfe-sicherheit\` | Sicherheitscenter (Abgleich, Export, Vollsicherung, Wiederherstellung, OneDrive, Ordner wechseln, Sperren), Hilfe-Verweise, Bestand prüfen (Ordner, Analyse, Archiv, Diagnose, Testumgebung, Testregister), Systemprüfung (voll, Änderungen, reparieren), Praktische Abnahme | 29 grün, 1 bekannter Defekt (D3) |
| \`kopieren\` | Aktivitätszeilen 1/2, „Auftrag kopieren“, Assistenz „Kopieren“, jeweils mit und ohne Zwischenablage-Berechtigung | 11 grün |
| \`knoepfe-assistenz\` | Assistenz (Modi, Diktat, Prüfung, Fakten, Schreiben, Textbausteine, Speichern), Unterseiten Gesundheit & Arbeit, Familie, Wohnen/Fahrzeuge/Käufe, Verzeichnis, Was gibt’s Neues, Unterlagen & Quellen | 22 grün |
| \`knoepfe-leer\` | Akte ohne Beispieldaten: 16 Seiten, Suche, Cockpit, Frist, Erinnerung, Systemprüfung, Beispieldaten wieder laden | 25 grün |

Gestellt (Ersatzobjekte in \`tests/ui/_stubs.mjs\`): Spracherkennung (beide Namen), Ordnerauswahl (echte OPFS-Ordner), \`window.print\`, \`window.open\`, gesperrte Zwischenablage. Nicht messbar headless: echtes Mikrofon, echte Kamera, Drag & Drop mit der Maus, Druckausgabe, Downloads auf dem Handy → [HANDPRUEFUNG.md](HANDPRUEFUNG.md).

## Bedienelemente je Seite

`;
for (const [ort, liste] of Object.entries(proOrt).sort((a, b) => b[1].length - a[1].length)) {
  const z = {}; for (const x of liste) { const k = sym(x.desktop); z[k] = (z[k] || 0) + 1; }
  md += `### ${ort} (${liste.length}: ${Object.entries(z).map(([k, v]) => `${k} ${v}`).join(" · ")})\n\n| Nr | Beschriftung | Handler → Fachfunktion | Desktop | Handy | Bemerkung |\n| --- | --- | --- | --- | --- | --- |\n`;
  for (const x of liste) md += `| ${x.nr} | ${x.beschriftung.replace(/\|/g, "/")}${x.aria && x.aria !== x.beschriftung ? ` (aria: ${x.aria})` : ""} | \`${x.handler.replace(/\|/g, "/").slice(0, 60) || "–"}\`${x.fach ? ` → ${x.fach.replace(/\|/g, "/").slice(0, 80)}` : ""} | ${x.desktop} | ${x.handy} | ${x.bemerkung.replace(/\|/g, "/").slice(0, 160)} |\n`;
  md += "\n";
}
writeFileSync(path.join(ROOT, "docs/analyse/FUNKTIONSMATRIX.md"), md, "utf8");
console.log(`CSV ${zeilen.length} Zeilen; Desktop`, zaehl, "Handy", zaehlH);
