# Paket E: Technischer Baum der Familienakte

Stand 2026-10-28, gelesen im Quelltext von `main`. Jeder Weg geht **Knopf → Handler in `app/*.tsx` →
Fachlogik in `lib/` → Speicherfunktion in `app/local-vault.ts` → Ordner/Datei im Tresor**. Zeilennummern
ohne Dateiangabe beziehen sich auf `app/health-portal.tsx` (Handler) bzw. `app/local-vault.ts` (Tresor).

## 1. Schichten

```mermaid
flowchart TB
  subgraph UI["Oberfläche (React, app/)"]
    HP["health-portal.tsx<br/>Navigation, Seiten, 181 Knöpfe"]
    AC["assistant-center.tsx"]
    CI["central-intake-center.tsx"]
    DS["document-scan-dialog.tsx"]
    PA["practical-acceptance.tsx"]
    UC["ui-controls.tsx<br/>Diktat, ⓘ-Knopf"]
    PD["page-dialogs.tsx<br/>askConfirm, askPrompt"]
    FV["file-viewer.tsx<br/>Vorschau, pdf.js"]
  end
  subgraph LIB["Fachlogik (lib/, reine Funktionen, Node-Tests)"]
    L1["family-search · family-assistant · family-memory"]
    L2["document-intake · central-intake · document-scan"]
    L3["family-assignment · fawoga-inventory · document-library"]
    L4["family-cockpit · family-reminders · family-news · family-context-linking"]
    L5["family-export · family-backup · system-check · practical-acceptance"]
    L6["family-privacy · family-data-model · family-register"]
  end
  subgraph VAULT["Datentresor (app/local-vault.ts)"]
    RW["withRegisterWriteLock<br/>lesen → prüfen → sichern → temporär schreiben → prüfen → ersetzen"]
    FS["FileSystemDirectoryHandle"]
  end
  subgraph STORE["Speicher"]
    OPFS["Browser-Datentresor<br/>OPFS: navigator.storage.getDirectory"]
    IDB["IndexedDB-Rückfall<br/>app/idb-directory.ts (mmi-browser-dateien)"]
    DIR["Eigener Ordner<br/>showDirectoryPicker (nur Chrome/Edge PC)"]
    LS["localStorage<br/>Systemprüf-Berichte, Abnahme, Speicherwahl"]
    HD["health-data.json<br/>feste Beispieldaten (Gesundheit)"]
  end
  HP --> L1 & L2 & L3 & L4 & L5
  AC --> L1
  CI --> L2
  DS --> L2
  PA --> L5
  L1 & L2 & L3 & L4 & L5 --> RW
  L6 -.Maskierung.-> HP
  RW --> FS
  FS --> OPFS
  FS --> IDB
  FS --> DIR
  HP --> LS
  HP --> HD
```

**Datenschutz-Schicht:** `lib/family-privacy.ts` (`isSensitiveHealthText`, `protectedFamilyLabel`, Wortmuster
`HEALTH_TERMS`) und `lib/family-cockpit.ts` → `buildSensitiveIds` (Z. 189): markiert Dokumente und
Datensätze als sensibel und **vererbt** die Marke über Relationen auf Vorgänge, Aufgaben, Fristen und
Ereignisse. Wirkt nur auf die Anzeige (Cockpit, Suche, Neuigkeiten, Chronologie), nicht auf die Datei.

**Register-Schreibsperre:** `withRegisterWriteLock` (Z. 681): alle Schreibzugriffe laufen nacheinander.
Jeder Schreibvorgang (`writeIndexToRegisterDirectoryUnlocked`, Z. 703) sichert zuerst die vorhandene
Registerdatei nach `00_Register/Sicherungen/Familienakte_Register_<Zeit>.json` (5 Sicherungen bleiben),
schreibt eine temporäre Datei, prüft sie und ersetzt dann `Familienakte_Register.json`.

## 2. Tresor: Ordner und Dateien

Wurzel: `Me_Myself_and_I_Familienakte/` (`ROOT`, Z. 158) im gewählten Ordner oder im Browser-Datentresor.

| Ordner / Datei | Inhalt | schreibt | liest |
| --- | --- | --- | --- |
| `00_Register/Familienakte_Register.json` | das **eine** Register (`VaultIndex` v5): `documents`, `records` (Personen, Organisationen, Objekte, Vorgänge, Aufgaben, Fristen, Ereignisse, Korrespondenz), `relations`, `memoryDrafts`, `linkDecisions`, `inventoryItems`, `inventoryLearningSignals`, `sequences`, `auditLog` | jede Speicherfunktion über `writeIndex` | `readIndex`, `readLocalVaultData` |
| `00_Register/Sicherungen/Familienakte_Register_<Zeit>.json` | automatische Sicherung vor jedem Schreiben, 5 bleiben | `writeIndexToRegisterDirectoryUnlocked` | Systemprüfung/Reparatur |
| `00_Register/*.tmp` | temporäre Datei beim Schreiben (wird ersetzt) | dito | – |
| `00_Posteingang/` | Eingangsordner (nur OneDrive-Tresor) | – | `scanOneDriveInbox` (Z. 331) |
| `01_Dokumente/<Kategorie>/<Datei>` | Originalkopien abgelegter Dokumente | `saveLocalDocument` (Z. 2494), `archiveInventoryItems` (Z. 2341) | `readLocalDocumentFile` (Z. 755) |
| `01_Dokumente/<Kategorie>/Scan-Originale/<DOC-ID>/` | Einzelfotos eines Scans | `saveLocalDocument` mit `scanOriginals` (Z. 2514) | Vorschau |
| `02_Online-Bestand_gesichert/<Kategorie>/` | übernommene Dateien aus der alten Online-Ablage | `saveLocalDocument` mit `migration` (Z. 2502) | Vorschau |
| `03_Erinnerungsmedien/<EVENT-ID>/` | Fotos/Videos zu Tagebucheinträgen und Entwürfen | `createOrUpdateLocalMemoryDraft` (Z. 3128), `createLocalMemoryBundle` (Z. 3252) | `readLocalMemoryMediaFile`, `readLocalMemoryDraftFiles` |
| Export-Ziel `Familienakte_Export_<Zeit>/` (+ `Originaldokumente/`) | JSON + HTML + Kopien | `writeFamilyArchiveExport` (Z. 2613) | – |
| Sicherungs-Ziel `Familienakte_Vollsicherung_<Zeit>/Dateien/01…03` | Register + alle Dateien | `writeFullFamilyBackup` (Z. 2744) | `restoreFullFamilyBackup` (Z. 2791) |
| Archiv-Ziel `Familienakte_Archiv/<Bereich>/<Jahr>/` | geprüfte Kopien aus „Bestand prüfen“ | `archiveInventoryItems` (Z. 2269) | – |
| Testumgebung `Familienakte_Automatische_Testumgebung_2.28.1/01_Analysequelle … 06_Diagnose` | Entwicklerwerkzeug | `runAutomaticTestEnvironment` | – |
| `localStorage` `mmi-family-system-check*`, Abnahme, `mmi-browser-speicher` | Prüfberichte, Benutzerabnahme, Speicherwahl | Systemprüfung, Abnahme | dito |
| IndexedDB `mmi-local-vault/handles` | gemerkte Ordner-Handles (Tresor, OneDrive, Eingang, Bestand, Archiv, Entwicklung) | `chooseVaultFor` (Z. 212) | `rememberedVaultFor` (Z. 230) |

## 3. Assistenz

```mermaid
flowchart LR
  A1["Knopf: Analyse starten"] --> H1["assistant-center.tsx analyze"] --> F1["lib/family-assistant.ts<br/>buildAssistantAnalysis<br/>Wortüberlappung, research = not_configured"] --> R1["nur Anzeige, kein Schreiben"]
  A2["Knopf: Schreiben vorbereiten<br/>Kürzer · Freundlicher · Bestimmter · Sachlicher"] --> H2["prepareDraft / reviseCorrespondenceText"] --> F2["lib/family-assistant.ts<br/>buildCorrespondenceDraft"] --> R2["nur Anzeige"]
  A3["Knopf: Als Entwurf / versandbereit / versendet speichern"] --> H3["health-portal.tsx:974<br/>saveAssistantCorrespondence"] --> V3["local-vault.ts:2907<br/>createLocalCorrespondenceBundle"] --> T3["00_Register: records (Korrespondenz-Ereignis) + relations zum Vorgang"]
  A4["Knopf: Entwurf kopieren"] --> H4["copyDraft → navigator.clipboard"]
  A5["Mega-Menü: Vorgänge weiterbearbeiten"] --> H5["onGo cockpit"] --> C["siehe Familie & Personen: Cockpit"]
```

## 4. Gesundheit & Arbeit

```mermaid
flowchart LR
  G1["Seiten: Diagnosen, AU & ICD-Codes · Krankenkasse & Leistungen · Arbeit & Arbeitgeber · Anträge & Bescheide"] --> H1["health-portal.tsx:394–410, 3309–3335"] --> D1["app/health-data.json<br/>feste Beispieldaten, kein Tresor"]
  G2["Knopf: Anfragen & Antworten"] --> H2["onGo correspondence"] --> A["Assistenz: Korrespondenz"]
  G3["Knopf: Zugeordnete Arbeitsunterlagen öffnen"] --> H3["openDocument (Z. 1009)"] --> V3["local-vault.ts:755 readLocalDocumentFile"] --> T3["01_Dokumente"]
  P["lib/family-privacy.ts + buildSensitiveIds"] -.maskiert außerhalb dieses Bereichs.-> G1
```

Befund: Die Gesundheitsseiten lesen **keinen** Tresor-Datensatz; sie zeigen `app/health-data.json`. Das
Register kennt zwar Datensätze mit Gesundheitsbezug (Maskierung greift), aber keine Seite zeigt sie als
„Gesundheitsakte“ an.

## 5. Familie & Personen (Cockpit, Familienübersicht, Fristen, Tagebuch)

```mermaid
flowchart LR
  subgraph Cockpit
    C1["Knopf: To-do-Status ändern"] --> HC1["updateCockpitTask (Z. 1019)<br/>askConfirm"] --> VC1["local-vault.ts:3075 updateLocalScheduleStatus"] --> T["00_Register records + auditLog"]
    C2["Knopf: Notiz ergänzen"] --> HC2["appendCockpitNote (Z. 1025)"] --> VC2["local-vault.ts:3090 appendLocalFamilyRecordNote"] --> T
    C3["Knopf: Zusammenhang bestätigen / ablehnen / lösen / ändern"] --> HC3["confirmContextLink … changeContextLink (Z. 1031–1046)"] --> FC3["lib/family-context-linking.ts<br/>buildContextLinkSuggestions (Regeln)"] --> VC3["local-vault.ts:2953–3014<br/>confirmLocalContextLink, rejectLocalContextLink, removeLocalContextLink, changeLocalContextLink"] --> T2["00_Register relations + linkDecisions"]
    C0["Anzeige: Was ist jetzt wichtig? · Offene Vorgänge · Objektakten"] --> FC0["lib/family-cockpit.ts buildFamilyCockpit, buildCockpitDossier<br/>+ buildSensitiveIds"]
  end
  subgraph Fristen
    F1["Formular: Frist oder Aufgabe anlegen"] --> HF1["save (Z. 3269)"] --> FF1["lib/family-reminders.ts buildScheduleItems"] --> VF1["local-vault.ts:3035 createLocalScheduleBundle"] --> T
    F2["Knopf: offen / erledigt / zurückgestellt"] --> HF2["changeStatus (Z. 3290)"] --> VC1
  end
  subgraph Tagebuch
    M1["Knopf: In die Warteschlange / Prüfen"] --> HM1["queue, review (Z. 1465–1479)"] --> FM1["lib/family-memory.ts buildMemoryAnalysis<br/>Regeln: Lebensbereich, Ereignisart, offener Punkt, Aufgabe"] --> VM1["local-vault.ts:3156 createOrUpdateLocalMemoryDraft"] --> TM1["00_Register memoryDrafts + 03_Erinnerungsmedien"]
    M2["Knopf: Speichern (nach Bestätigung)"] --> HM2["save (Z. 1527)"] --> VM2["local-vault.ts:3239 createLocalMemoryBundle"] --> TM2["00_Register records (event, optional task, deadline) + relations + 03_Erinnerungsmedien"]
    M3["Knopf: Bearbeiten / Löschen / Status offener Punkt"] --> HM3["editSavedMemory, deleteSavedMemory, changeOpenStatus (Z. 1594–1615)"] --> VM3["local-vault.ts:3314–3359<br/>updateLocalMemoryOpenPointStatus, updateLocalMemoryRecord, deleteLocalMemoryRecord"] --> T
    M4["Knopf: Entwurf löschen"] --> HM4["removeMemoryDraft (Z. 958)"] --> VM4["local-vault.ts:3210 deleteLocalMemoryDraft"] --> TM1
  end
  subgraph Familienübersicht
    U1["Anzeige: Personen, gemeinsame Vorgänge"] --> HU1["readLocalVaultData"] --> T
  end
```

## 6. Wohnen · Fahrzeuge · Käufe & Garantien (Objektakten)

```mermaid
flowchart LR
  O1["Mega-Menü: Miet- & Vermieterunterlagen · Fahrzeugpapiere · Käufe & Rechnungen …"] --> HO1["onGo home / vehicles / purchases"] --> FO1["lib/family-cockpit.ts buildCockpitDossier<br/>lib/menu-optimization.ts menuPageActions, targetForRelation"] --> VO1["readLocalVaultData (Z. 2589)"] --> T["00_Register records + relations + documents"]
  O2["Knopf: Dokument öffnen"] --> HO2["openDocument (Z. 1009)"] --> VO2["readLocalDocumentFile (Z. 755)"] --> D["01_Dokumente / 02_Online-Bestand_gesichert"] --> FV["file-viewer.tsx Vorschau"]
  O3["Knopf: Vorgang / Aufgabe / Frist öffnen"] --> C["Cockpit-Dossier (Abschnitt 5)"]
```

Diese drei Hauptmenüs haben keine eigene Schreiblogik; sie sind Sichten auf das Register nach Kategorie
(`lib/family-categories.ts`, 18 Kategorien) und auf die Relationen.

## 7. Dokumente (Bibliothek, Bestand prüfen, Eingangszentrale, Sicherheit, Export)

```mermaid
flowchart LR
  subgraph Bibliothek
    B1["Filter, Sortierung, Suche"] --> HB1["loadDocuments (Z. 838)"] --> FB1["lib/document-library.ts buildDocumentLibraryItems, filterDocumentLibraryItems"] --> VB1["readLocalVaultData"] --> T["00_Register documents"]
    B2["Knopf: Status ändern"] --> HB2["changeStatus (Z. 857)"] --> VB2["local-vault.ts:2544 updateLocalStatus"] --> T
    B3["Knopf: Öffnen"] --> HB3["openDocument"] --> D["01_Dokumente"]
  end
  subgraph Eingang["Eingangszentrale"]
    E1["Hineinziehen · Dateien auswählen · Dokument fotografieren"] --> HE1["queueCentralIntakeFiles (Z. 607)"] --> FE1["lib/central-intake.ts analyzeCentralIntakeFile<br/>lib/document-intake.ts buildDocumentIntakePlan (Wortlisten, Dublette)"]
    E2["Knopf: E-Mail-Anhänge auslesen"] --> HE2["extractCentralEmailAttachments (Z. 635)"] --> FE2["lib/central-intake.ts extractEmlAttachments, parseEmlText"] --> HE1
    E3["Knopf: Eingangsordner wählen / prüfen"] --> HE3["selectInboxFolder, scanSelectedInbox (Z. 656–667)"] --> VE3["chooseInboxFolder, scanLocalInbox (Z. 274, 324)"] --> HE1
    E4["Knopf: OneDrive-Ordner prüfen"] --> HE4["checkOneDriveInbox (Z. 673)"] --> VE4["scanOneDriveInbox (Z. 331)"] --> PE["00_Posteingang"]
    FE1 --> E5["Formular: Zuordnung prüfen, Trotzdem übernehmen"] --> HE5["Übernahme (Z. 1264)"] --> VE5["local-vault.ts:2494 saveLocalDocument"] --> TE5["01_Dokumente/Kategorie + 00_Register documents (+ task/deadline nach Bestätigung)"]
    S1["Dokument fotografieren: Seiten, Drehen, Zuschneiden, PDF erstellen"] --> HS1["document-scan-dialog.tsx"] --> FS1["lib/document-scan.ts createDocumentScanPdf"] --> HE1
    FE1 --> FE6["lib/family-context-linking.ts suggestIncomingDocumentContext"]
  end
  subgraph Bestand["Bestand prüfen (FaWoGa)"]
    I1["Knopf: Quellordner / Archivordner wählen"] --> HI1["selectInventorySource, selectInventoryArchive (Z. 737–745)"] --> VI1["chooseInventorySourceFolder, chooseInventoryArchiveFolder (Z. 301–302)"] --> IDB["IndexedDB mmi-local-vault/handles"]
    I2["Knopf: Bestand prüfen / fortsetzen"] --> HI2["runInventoryScan (Z. 763)"] --> FI2["lib/fawoga-inventory.ts Prüfsummen, Gruppen, Lernsignale"] --> VI2["local-vault.ts:2097 scanInventoryFolder"] --> T2["00_Register inventoryItems"]
    I3["Knopf: Zuordnung bestätigen"] --> HI3["confirmInventoryLearningAssignment (Z. 816)"] --> FI3["lib/family-assignment.ts proposeFamilyAssignment"] --> VI3["local-vault.ts:2194 confirmInventoryAssignment"] --> T3["00_Register records neu + inventoryLearningSignals"]
    I4["Knopf: Dateien archivieren"] --> HI4["runInventoryArchive (Z. 780)"] --> VI4["local-vault.ts:2277 archiveInventoryItems"] --> T4["Familienakte_Archiv/Bereich/Jahr + 01_Dokumente + documents"]
    I5["Knopf: Assistenzfreigabe"] --> HI5["runInventoryRelease (Z. 792)"] --> VI5["local-vault.ts:2323 releaseInventoryItemsForAssistant"] --> T5["00_Register documents.assistantReleased = true"]
    I6["Knopf: Dateien zurücksetzen"] --> HI6["runInventoryReset (Z. 803)"] --> VI6["local-vault.ts:2369 resetInventoryItemsForRetest"] --> T2
  end
  subgraph Sicherheit["Sicherheitscenter"]
    K1["Knopf: PC/USB verbinden · OneDrive verbinden · sperren"] --> HK1["connectLocalVault, connectOneDrive, lockLocalVault, lockOneDrive (Z. 586–599)"] --> VK1["chooseVault, chooseOneDriveVault, forgetVault (Z. 248–355)"] --> IDB
    K2["Knopf: Abgleich prüfen / durchführen"] --> HK2["checkBackupSync, runBackupSync (Z. 697–706)"] --> VK2["compareVaults, copyMissingDocuments (Z. 3395–3419)"] --> T6["01_Dokumente Zieltresor"]
    K3["Knopf: Vollständige Sicherung"] --> HK3["runFullBackup (Z. 716)"] --> FK3["lib/family-backup.ts"] --> VK3["writeFullFamilyBackup (Z. 2744)"] --> T7["Familienakte_Vollsicherung_Zeit/Dateien"]
    K4["Knopf: Wiederherstellung testen"] --> HK4["runRestoreTest (Z. 726)"] --> VK4["restoreFullFamilyBackup (Z. 2791)"] --> T8["leerer Testordner"]
    K5["Knopf: Online-Bestand übernehmen"] --> HK5["migrateOnline (Z. 680)"] --> VK5["saveLocalDocument migration"] --> T9["02_Online-Bestand_gesichert"]
    K6["Knopf: Akte aktualisieren"] --> HK6["startComparison, finalizeUpdate (Z. 860–878)"] --> T
  end
  subgraph Export
    X1["Knopf: Zielordner wählen · Export starten"] --> HX1["selectDestination, startExport (Z. 3382–3386)"] --> FX1["lib/family-export.ts buildFamilyArchiveExport (JSON + HTML)"] --> VX1["chooseExportDestination (Z. 337), writeFamilyArchiveExport (Z. 2613)"] --> T10["Familienakte_Export_Zeit + Originaldokumente"]
  end
```

## 8. Hilfe (Hilfe, Systemprüfung, Was gibt’s Neues, Versionshistorie, Datentresor-Hilfe)

```mermaid
flowchart LR
  H1["Knopf: Vollständige Prüfung / Nur Änderungen"] --> HH1["runCheck, evaluateSystem (Z. 2219–2771)"] --> FH1["lib/system-check.ts + Selbsttests aller lib-Module<br/>system-check-manifest.json"] --> LS["localStorage mmi-family-system-check*"]
  H2["Knopf: Sicher reparieren"] --> HH2["runRepair (Z. 2722)"] --> VH2["writeIndex mit normalizeIndex"] --> T["00_Register (nur Struktur, keine Fachdaten)"]
  H3["Knopf: Prüfbericht kopieren"] --> HH3["navigator.clipboard"]
  H4["Praktische Benutzerabnahme: Ja / Nein / Nicht geprüft, Übermitteln"] --> HH4["practical-acceptance.tsx"] --> FH4["lib/practical-acceptance.ts"] --> LS
  H5["Was gibt’s Neues?"] --> HH5["buildFamilyNewsItems"] --> FH5["lib/family-news.ts (liest Register, maskiert)"] --> T
  H6["Versionshistorie"] --> HH6["feste Liste Z. 2835–2866"]
  H7["Hilfe: Suchbeispiele"] --> HH7["onSearch → Suche"] --> FH7["lib/family-search.ts interpretFamilySearchQuery"]
  H8["Mit ChatGPT arbeiten: Auftrag kopieren / ChatGPT öffnen"] --> HH8["ChatGPTEditDialog (Z. 3344) copyPrompt"] --> X["Zwischenablage + chatgpt.com (neuer Tab)"]
  H9["Beispieldaten entfernen / laden"] --> HH9["removeSampleData, loadSampleData (Z. 521–529)"] --> FH9["app/sample-family.ts"] --> VH9["removeVaultEntries (Z. 3463), createLocalFamilyRecord, saveLocalDocument"] --> T
```

## 9. Querschnitt: Kopfleiste, Suche, Diktat, Vorschau

```mermaid
flowchart LR
  Q1["Suchfeld + Mikrofon"] --> HQ1["setQuery (Z. 1090), DictationButton (ui-controls.tsx)"] --> FQ1["lib/browser-dictation.ts createDictationSession<br/>Web Speech API des Browsers (Audio geht an dessen Anbieter)"]
  Q1 --> FQ2["lib/family-search.ts interpretFamilySearchQuery, scoreFamilySearchText"] --> VQ2["readLocalVaultData"] --> T["00_Register"]
  Q3["Aktivitätszeilen: Copy"] --> HQ3["ui-activity.tsx → navigator.clipboard"]
  Q4["Dokument öffnen"] --> HQ4["file-viewer.tsx openFile"] --> PDF["pdf.js 3.11.174 von cdnjs (CDN!)"]
  Q5["Rückfragen"] --> HQ5["page-dialogs.tsx askConfirm, askPrompt (Dialog in der Seite)"]
```

## 10. Befunde aus dem Baum

1. **Ein Register für alles:** jede Speicherfunktion liest und schreibt die ganze
   `Familienakte_Register.json` unter der Schreibsperre. Sicher, aber langsam bei vielen Einträgen
   (Beispielfamilie: rund 7–8 s beim ersten Anlegen).
2. **Gesundheit & Arbeit hängt nicht am Tresor** (`app/health-data.json`).
3. **pdf.js kommt vom CDN** (`app/file-viewer.tsx`): offline und mit Internetschalter „aus“ gibt es keine
   PDF-Vorschau, bis die Bibliothek ins Paket kommt (Teil 2).
4. **Sechs Ordner-Handles** (Tresor, OneDrive, Eingang, Bestandsquelle, Archiv, Entwicklung) liegen in
   IndexedDB `mmi-local-vault`; alle brauchen `showDirectoryPicker` (nur Chrome/Edge am PC). Im
   Browser-Datentresor (OPFS/IndexedDB) gibt es nur den einen Tresor; Eingangsordner, Bestand prüfen,
   Abgleich, Vollsicherung, Wiederherstellung und Export sind dort nicht erreichbar.
5. **Die Datenschutz-Maskierung sitzt in der Anzeige** (`buildSensitiveIds`), nicht in der Datei. Für
   eine KI-Übergabe (Paket C) ist das keine Anonymisierung.
6. **Kein Weg verlässt das Gerät**, außer: Web-Speech-Diktat (Audio an den Browser-Anbieter), pdf.js vom
   CDN und der von Hand geöffnete ChatGPT-Tab.
