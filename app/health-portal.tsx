import { DateiOrt, akteOrtSetzen } from "./datei-ort";
import { demoActive, switchDemo } from "../lib/demo-workspace.ts";
import { aktuelleGrenze, grenzeMessen, mbText } from "../lib/geraete-grenze";
import { verkleinerbar } from "./verkleinern";
import { programmBeilegen } from "./sicherung-programm";
import { SicherungEinlesenDialog } from "./sicherung-einlesen";
import { NotfallblattDialog, PapierkorbLeerenDialog, SicherungAnlegenDialog, SicherungErinnerung, SicherungPasswortDialog } from "./sicherung-dialoge";
import { LaufwerkKarte } from "./laufwerk-karte";
import { BLOCK, blockText, dateiSchluessel, gesehenMerken, inBloecke, mbText as mbBlock, neueImOrdner, speicherReicht } from "../lib/eingang-bloecke";
import { arbeitDienst } from "./arbeit-dienst";
import { eingangOrdnerLeserSetzen } from "./eingang-ablage";
import { dateiAusEingangsordner } from "./local-vault";
import { ordnerFehlerText } from "./nativer-ordner";
import { DemoUebernahmeDialog, DEMO_NEU_MERKER, DEMO_UEBERNAHME_MERKER } from "./demo-uebernahme";
import { DEMO_QUELLE_SCHLUESSEL, demoQuelleLesen } from "../lib/demo-kopie";
import { resetDemoStorage } from "../lib/demo-workspace.ts";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import { beginLocalPdfEdit, saveLocalPdfEdit } from "./local-vault";
import type { PdfQuelle } from "../lib/pdf-bearbeitung";
import type { SectionId, UploadedDocument } from "./portal-types";
import { PrivateMeaningPanel } from "./private-meaning-panel";
import { ProGeraetetransportPanel } from "./pro-geraetetransport-panel";
import { fmtDate } from "./portal-format";
import { LISTEN_SEITE, useSeiten, WeitereAnzeigen } from "./seiten";
import { buildPortalSearchResults, groupSearchResults, SEARCH_AREA_GROUP, type SearchResult } from "./portal-suche";
import { ProUebergabeKnopf } from "./pro-uebergabe-knopf";
import { proDateiWeitergeben, proVerbundFehler, PRO_ZIELE, type ProZiel } from "./pro-verbund";
import { proUebergabeAnnehmen } from "./pro-uebergabe";
import { uebergabeVorschlaege, type UebergabeVorschlag } from "../lib/uebergabe-vorschlaege";
import { askConfirm } from "./page-dialogs";
import { AuswahlKaestchen, AuswahlLeiste } from "./auswahl-leiste";
import { briefkopfAusText, quelleName, sammelDaten, sammelLage } from "./sammel-ablage";
import { useEingang } from "./use-eingang";
import { usePortalNavigation, type NavigationsZusatz, type PortalNavigation } from "./use-portal-navigation";
import { gleichZumZiel, hierZumZiel, type GehMitZiel } from "./sprung";
import { OffenePunkte, zuOffenerGruppe } from "./vorgang-offen";
import { useProDestination, type ProDestination } from "./use-pro-destination";
import { ProTresorAnschluss } from "./pro-tresor-anschluss";
import { ProTresorWoLiegtWas } from "./pro-tresor-hilfe";
import { AktensicherungHilfe } from "./aktensicherung-hilfe";
import { EmailHilfe } from "./email-hilfe";
import { AppLandkarteHilfe, landkarteAufmachen } from "./app-landkarte-hilfe";
import { DEMO_VERLASSEN, useLiveZustand } from "./live-zustand";
import { ProVerbundHilfe } from "./pro-verbund-hilfe";
import type { Vorschau } from "./hilfe-vorschau";
import { SEITEN_KARTEN } from "../lib/hilfe-seiten";
import { Ablaufbild, BildThema, DatenmodellKarte, FristenKarte, KastenReihe, SichernKarte, sprung, ablaufAssistenz, ablaufEingang, ablaufExport, ablaufFoto } from "./hilfe-bilder";
import { ProDokumentKnopf } from "./pro-dokument-knopf";
import { istProOriginal, proTresor, proTresorVerfuegbar } from "./pro-tresor";
import { copyLocalDocumentToPro } from "./local-vault";
import { eingangDatei } from "./eingang-ablage";
import { openFile } from "./file-viewer";
import { dateiTeilen, teilenText } from "./teilen";
import { lazy, Suspense } from "react";
import { PracticalAcceptance, StoredUserAcceptance } from "./practical-acceptance";
// E1: große Teilansichten werden erst beim Öffnen geladen (eigene Dateien im Build).
import { UI_HELP } from "../lib/ui-help";

import {
  Archive, BookOpen, BriefcaseMedical, Building2, Car, CheckCircle2,
  ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ClipboardCheck, Download, FileClock,
  FileText, Folder, FolderHeart, HeartPulse, Home, Landmark, Menu, PackageCheck,
  Network, Plus, Printer, RefreshCw, Search, ShieldCheck, ShoppingBag, Upload, UserRound,
  Users, X, HardDrive, LockKeyhole, Usb, HelpCircle, History, Cloud, LifeBuoy, Mic,
  Copy, ExternalLink, BookHeart, Camera, Video, NotebookPen, CircleHelp, Tags, FolderSearch, Eye, ListChecks, Save, Bot, Sparkles,
  PenLine, CalendarDays, Check, Pencil, Share2,
} from "lucide-react";
import { DictationButton, InfoPopover, InfoZeile, SuchFeld, VoiceInput, VoiceTextarea } from "./ui-controls";
import { FormEvent, Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityLines, ActivityProvider, useActivity, useActivityMessage } from "./ui-activity";
import { NetzSchalter } from "./netz-schalter";
import { AnmeldeKnopf } from "./anmelde-knopf";
import { KurzhinweiseSchalter } from "./kurzhinweise-schalter";
import { DemoKnopf, DemoStarten } from "./demo-knopf";
import { DatumFeld } from "./datum-feld";
import { NeuKnopf } from "./neu-knopf";
import { KalenderHilfe } from "./kalender-hilfe";
import { zurKarte, zurStelle } from "./ablaufbild";
import { ErinnernTeil, KALENDER_OEFFNEN, type ErinnernWert } from "./erinnern-teil";
import { NotizKnopf } from "./notiz-knopf";
import { AblegenKnopf, ABLEGEN_OEFFNEN } from "./ablegen-knopf";
import { ErsteSchritte, type ErsterSchritt } from "./erste-schritte";
import { UpdateFahne } from "./update-fahne";
import { HilfeThemaEintrag, NEUE_HILFE_THEMEN } from "./hilfe-themen";
import { HilfeOrdnungAnsicht, hilfeEingerichtet, type HilfeThemaEl } from "./hilfe-ordnung";
import { FASSUNGEN } from "../lib/fassungen";
import { BenutzerabnahmeHilfe } from "./benutzerabnahme-hilfe";
import { UI_HELP_ZIEL } from "../lib/ui-help-ziele";
import { Seitenleiste } from "./seitenleiste";
import { latestUserAcceptance, latestUserResult } from "../lib/practical-acceptance";
import { KlappLeiste, klappOeffnen } from "./klapp";
import { AugeKnopf, FlachText, KnopfLeiste, StiftKnopf, useEinzeilig } from "./flach-zeile";
import { ErinnerungLoeschen, NotizLoeschen } from "./loesch-knopf";
import { PapierkorbKarte } from "./papierkorb-karte";
import { AppGlocke, MeinKalender, meinKalenderOeffnen } from "./mein-kalender";
import { ErinnerungKasten, MemoryBearbeiten } from "./memory-bearbeiten";
import { TerminBearbeiten } from "./termin-bearbeiten";
import { kalenderEinstLesen } from "./kalender-abgleich";
import { fristAusHinweis, fristVorschlagNehmen, KalenderAnmeldeHinweis, KalenderFormTeil, KalenderVerbinden, type KalenderWahl, useKalenderAutoAbgleich, useKalenderEinst } from "./kalender-karte";
import { ERINNERUNG_VORGABE, erinnerungsName, erinnerungsZeiten, kalenderFelder, type ErinnerungsWahl } from "../lib/kalender";
import { KiAuftragDialog } from "./ki-auftrag-dialog";
import { inventoryScanFeedback, inventoryAssignmentFeedback, inventoryArchiveFeedback, inventoryReleaseFeedback } from "../lib/ui-activity";
import healthData from "./health-data.json";
import { assessmentGroups, categories, coreDocuments, portalAreas } from "./portal-data";
import { appendLocalFamilyRecordNote, archiveInventoryItems, buildAutomatedTestFailureReport, changeLocalContextLink, checkVaultHoldings, chooseDevelopmentBaseFolder, chooseExportDestination, chooseInboxFolder, chooseInventoryArchiveFolder, chooseInventorySourceFolder, chooseOneDriveVault, chooseVault, compareVaults, confirmInventoryAssignment, confirmLocalContextLink, copyMissingDocuments, createLocalFamilyRecord, createLocalMemoryBundle, createLocalScheduleBundle, createOrUpdateLocalMemoryDraft, deleteLocalMemoryDraft, deleteLocalMemoryRecord, forgetOneDriveVault, forgetVault, getLocalMemoryDeleteImpact, getVaultSummary, inspectTestWorkspace, inventorySourcePermission, type AutomatedStorageDiagnosticReport, type AutomatedTestFailureReport, type AutomatedTestEnvironmentReport, type IncomingFolderFile, type InventoryArchiveResult, type InventoryReferenceChoice, type InventoryScanProgress, type InventoryScanResult, linkLocalDocuments, LocalDocument, LocalScheduleStatus, prepareTestRegisterPreview, type PreparedTestRegister, readInventorySourcePreview, readLocalDocumentFile, readLocalMemoryDraftFiles, readLocalMemoryMediaFile, readLocalSystemSnapshot, readLocalVaultData, erinnerungenInAufgabenUmziehen, rejectLocalContextLink, releaseInventoryItemsForAssistant, rememberedDevelopmentBaseFolder, rememberedInboxFolder, rememberedInventoryArchiveFolder, rememberedInventorySourceFolder, rememberedOneDriveVault, rememberedVault, removeLocalContextLink, requestVaultPermission, resetAutomatedTestEnvironment, resetInventoryItemsForRetest, restoreFullFamilyBackup, runAutomatedStorageDiagnostic, runAutomatedTestEnvironmentSelfTests, runInventoryTextDecodingSelfTests, runPreparedTestRegisterSelfTests, runTestWorkspaceSelfTests, saveLocalDocument, savePreparedTestRegister, dokumenteAussortieren, dokumenteZurueckholen, dokumenteBereichSetzen, dokumenteZuordnen, type AussortierErgebnis, TEXTAUSZUG_MAX, scanInventoryFolder, scanLocalInbox, scanOneDriveInbox, setupAutomatedTestEnvironment, type TestWorkspaceReport, updateLocalMemoryDraftStatus, updateLocalMemoryOpenPointStatus, updateLocalScheduleStatus, updateLocalStatus, setLocalDocumentAusfuellen, updateLocalPersonContact, readAusfuellAblage, writeAusfuellAblage, VaultSummary, VaultSyncPreview, VaultSyncResult, vaultSupported, writeFamilyArchiveExport, writeFullFamilyBackup, sicherungEinlesen, sicherungProben, sicherungArt, dokumenteEndgueltigLoeschen, type SicherungsZugang, type LoeschErgebnis, type EinleseProbe, demoKopieAnlegen, demoNochPassend, demoUebernahmePlan, demoUebernehmen } from "./local-vault";
import { sicherungsOrdnerWaehlbar } from "./local-vault";
import { createFamilyRecord, FamilyRecordUnion, FamilyRelation, type FamilyRecordType, formatFamilyRecordId, recordTypeDefinitions } from "@/lib/family-data-model";
import { assignmentProposalHasNoAutomaticWrites, assignmentSequence, FAMILY_ASSIGNMENT_VERSION, proposeFamilyAssignment } from "@/lib/family-assignment";
import { allFamilyExportScopes, buildFamilyArchiveExport, familyExportScopeLabels, FamilyExportScope, runFamilyExportSelfTest } from "@/lib/family-export";
import { buildScheduleItems, runFamilyReminderSelfTest, scheduleStatusLabels } from "@/lib/family-reminders";
import { buildFamilyNewsItems, FamilyNewsItem, FamilyNewsPeriod, filterFamilyNews, runFamilyNewsSelfTest } from "@/lib/family-news";
import { ausfuellMarke, offeneAusfuellungen, type AusfuellInfo } from "@/lib/ausfuellen";
import type { AusfuellPerson } from "./ausfuellen-dialog";
import { PersonKontaktKasten } from "./person-kontakt";
import { FamilieStamm, StammBearbeitenFenster, istStamm } from "./familie-anlegen";
import { istStammArt, stammLesen } from "../lib/familie-stamm";
import type { PersonKontakt } from "@/lib/person-kontakt";
import { buildCockpitDossier, buildFamilyCockpit, cockpitRecordLabel, FamilyCockpitDocument, runFamilyCockpitSelfTests, type CockpitPriorityItem, type CockpitReference, type CockpitTodoItem } from "@/lib/family-cockpit";
import { interpretFamilySearchQuery, runFamilySearchSelfTests, type FamilySearchInterpretation } from "@/lib/family-search";
import { buildDocumentLibraryItems, filterDocumentLibraryItems, runDocumentLibrarySelfTests, textauszugVon, type DocumentLibraryItem, type DocumentLibrarySort, type DocumentLibraryReference } from "@/lib/document-library";
import { cockpitBereichAus, dossierTypeOrder, menuPageActions, passtZumBereich, runMenuOptimizationSelfTests, targetForRelation, zielFuerDatensatz, type MenuAction, type MenuTarget } from "@/lib/menu-optimization";
import { buildDocumentIntakePlan, extractDocumentIntakeTextHint, FAWOGA_LIFE_AREAS, type DocumentIntakePlan, type DocumentIntakeSource, runDocumentIntakeSelfTests } from "@/lib/document-intake";
import { buildIntakeChoiceOptions, buildStoredPersonalLifeAreas, INTAKE_PRIVACY_CLASSES, type IntakePrivacyClass } from "@/lib/document-intake-metadata";
import { analyzeCentralIntakeFile, deutschesDatum, erkenneAufgabe, erkenneDokumentDatum, erkenneFristen, extractEmlAttachments, groupCentralIntakeAnalyses, initialCentralIntakeStatus, runCentralIntakeSelfTests, type CentralIntakeAnalysis, type CentralIntakeQueueItem, type CentralIntakeStatus } from "@/lib/central-intake";
const CentralIntakeCenter = lazy(() => import("./central-intake-center").then((m) => ({ default: m.CentralIntakeCenter })));
import { runDocumentScanSelfTests, type DocumentScanPdfFile } from "@/lib/document-scan";
import { briefTitel, briefAngaben, briefZeile, gleicheNummer, vorgangVon, nummernAusText, nummernText, type BriefAngaben, type BriefkopfRoh } from "@/lib/briefkopf-titel";
const NetzSeite = lazy(() => import("./netz-seite").then((m) => ({ default: m.NetzSeite })));
const StapelSeite = lazy(() => import("./stapel-seite").then((m) => ({ default: m.StapelSeite })));
const WorkflowPdfSeite = lazy(() => import("./workflow-pdf-seite").then((m) => ({ default: m.WorkflowPdfSeite })));
import type { WfpdfAblage } from "./workflow-pdf-seite";
// Einzeldatei: dort gibt es den Klon nicht — „Dokument fotografieren“ behält den Scanner allein.
const wfpdfAlt = () => !!(window as Window & { __FA_KERN_EINGEBETTET?: string[] }).__FA_KERN_EINGEBETTET;
const AusfuellenDialog = lazy(() => import("./ausfuellen-dialog").then((m) => ({ default: m.AusfuellenDialog })));
const DocumentScanDialog = lazy(() => import("./document-scan-dialog").then((m) => ({ default: m.DocumentScanDialog })));
import { STIMMUNGEN, type Stimmung, buildMemoryAnalysis, erinnerungAusText, erinnerungsTitel, buildMemoryOpenPoints, buildTodayMemorySummary, isMemoryRecord, memoryData, runFamilyMemorySelfTests, runMemoryQueueSelfTests, sortMemoryDraftQueue, type MemoryAnalysis, type MemoryCaptureType, type MemoryDraftEntry, type MemoryDraftStatus, type MemoryOpenStatus, type MemoryStatementKind } from "@/lib/family-memory";
import { buildCaseOpenSummary, buildCaseTimeline, buildContextLinkSuggestions, buildRelatedContext, runContextLinkingSelfTests, suggestIncomingDocumentContext, suggestIncomingMemoryContext, type ContextDocument, type ContextLinkDecision, type ContextLinkSuggestion, type ContextSourceType } from "@/lib/family-context-linking";
import { StoredSystemCheck, SystemCheckArea, SystemCheckLevel, SystemCheckProblem, SystemCheckReport, systemCheckLevelLabel, systemCheckOverall, systemCheckOverallLabel } from "@/lib/system-check";
import { isSensitiveHealthText, protectedFamilyLabel } from "@/lib/family-privacy";
import { runCoreConsolidationSelfTests } from "@/lib/family-consolidation";
import { FAWOGA_INVENTORY_VERSION, inventoryPhotoSeries, inventoryPreviewMode, runFawogaInventorySelfTests, runFawogaLearningSelfTests, runFawogaOneDriveSelfTests, runInventoryPreviewSelfTests, summarizeInventory, type InventoryAssignmentReference, type InventoryItem, type InventoryReviewGroup } from "@/lib/fawoga-inventory";
import systemCheckManifest from "@/lib/system-check-manifest.json";
import releaseSystemCheckReport from "@/lib/release-system-check-report.json";
// Sichtbare Versionszeile oben/unten = technische Fassung der App (Klaus 2026-11-04); APP_VERSION bleibt der interne Prüfstand.
import { version as APP_FASSUNG } from "../package.json";
const AssistantCenter = lazy(() => import("./assistant-center").then((m) => ({ default: m.AssistantCenter })));
import { runFamilyAssistantSelfTests, type CorrespondenceKind } from "@/lib/family-assistant";
import { createLocalCorrespondenceBundle } from "./local-vault";
import { isBrowserVault, browserStorageKind, folderPickerSupported } from "./local-vault";
import { beispielIdsVon, removeSampleFamily, SAMPLE_NOTICE, sampleDataPresent, seedSampleFamily } from "./sample-family";
import { BspEcke, BspProvider } from "./bsp-ecke";

// Welche Fassung läuft (Klaus 2026-10-31: „damit ich nicht nur am Icon erkenne, was es für eine Version ist“):
// in der Android- und der Windows-App „Pro“, im Browser (PWA) „Basic“ — wie BookLedgerPro / BookLedger Basic.
const APP_VARIANTE: "Pro" | "Basic" = typeof window !== "undefined" && ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() || "__TAURI__" in window) ? "Pro" : "Basic";

type Notice = { kind: "success" | "error" | "info"; text: string; issue?: string; laeuft?: boolean } | null;
type ActionKey = "vault" | "upload" | "compare" | "update" | "chatgpt";
type ActionState = "pending" | "success" | "failed";
type DocumentLibraryRequest = { key: number; focusId: string | null; area: string; query: string };
type OpenDocumentLibrary = (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void;
type IntakeReceipt = { id: string; title: string; category: string; source: string };
type MemoryReceipt = { id: string; title: string; mediaCount: number };
type MemoryDraft = { draftId?: string; text: string; files: File[]; captureType: MemoryCaptureType; originalTranscript?: string; suggestedCaseId?: string; stimmung?: Stimmung; verknuepft?: string[] };
type MemoryCompletion = { id: string; title: string; remaining: number; total: number };
type MemorySaveInput = Parameters<typeof createLocalMemoryBundle>[1] & { rejectedContext?: ContextLinkSuggestion };
type UiAutomatedTestFailureReport = Omit<AutomatedTestFailureReport, "websiteVersion"> & { websiteVersion: number };



const APP_VERSION = "2.28.1";
const APP_VERSION_DATE = "15.10.2026";
const HELP_CONTENT_VERSION = "2.28.1";
const SYSTEM_CHECK_STORAGE_KEY = "mmi-family-system-check";
const SYSTEM_CHECK_REPORTS_KEY = "mmi-family-system-check-reports";
const SYSTEM_CHECK_BACKUPS_KEY = "mmi-family-system-check-backups";
// Wird von der Systemprüfung (scripts/run-system-check.mjs) als Projektkennung erwartet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SITE_PROJECT_LINK = "sites-project://appgprj_demo";

/** U6: Ziel eines Datensatzes aus Startseite, Cockpit und Neuigkeiten – überall dieselbe Zuordnung (lib/menu-optimization.ts). */
function datensatzZiel(records: FamilyRecordUnion[], art: string, id: string, geschuetzt = false): MenuTarget {
  const record = records.find((item) => item.id === id);
  const typ = art === "document" ? "document" : art === "record" || !(art in recordTypeDefinitions) ? record?.recordType || "case" : art as FamilyRecordUnion["recordType"];
  if (geschuetzt || (record && isMemoryRecord(record))) return zielFuerDatensatz(typ, id, { geschuetzt, tagebuch: true });
  return targetForRelation(typ, id);
}

/** „Mein Kalender“ öffnen, sobald „Fristen und Aufgaben“ gezeichnet ist (gemeinsamer Sprungweg statt 450-ms-Zeitgeber). */
const kalenderZiel = (tag?: string, id?: string): NavigationsZusatz => ({ detail: "Mein Kalender", ziel: () => { if (!document.querySelector("#mein-kalender[data-mk-bereit]")) return false; meinKalenderOeffnen(tag, id); return true; } });

const topNavigation: Array<{
  id: string; label: string; landing: SectionId;
  // kalender: der Eintrag öffnet „Mein Kalender“ (Fenster über „Fristen und Aufgaben“), kein eigener Bereich.
  // suche: der Eintrag öffnet die Bibliothek mit dieser Suche (noch kein eigener Bereich); anker: Stelle auf der Zielseite.
  groups: Array<{ title: string; items: Array<{ id: SectionId; label: string; detail: string; kalender?: true; suche?: string; anker?: string }> }>;
}> = [
  { id: "assistant", label: "Assistenz", landing: "assistant", groups: [
    { title: "Unterstützung", items: [
      { id: "assistant", label: "Assistenzzentrale", detail: "Fragen klären, Vorgänge prüfen und nächste Schritte vorbereiten" },
      // Ein Name je Stelle (Pfad-Regel 2): Menü, Pfad und Seitentitel heißen „Anfragen & Antworten“.
      { id: "correspondence", label: "Anfragen & Antworten", detail: "Korrespondenz: Entwürfe, versendete Schreiben und Antworten im Zusammenhang" },
    ] },
  ] },
  // 2.28.39 (Klaus 08.11.2026, Vorschau neugestaltung Punkt 4 und 5): ein Cockpit statt zwei Menüpunkten, eigene Gruppe
  // „Termine & Aufgaben“ – nur Ordnung, keine neuen Funktionen.
  { id: "termine", label: "Termine & Aufgaben", landing: "cockpit", groups: [
    { title: "Termine & Aufgaben", items: [
      { id: "cockpit", label: "Cockpit", detail: "Was jetzt wichtig ist: Fristen, Aufgaben, Vorgänge" },
      { id: "reminders", label: "Fristen und Aufgaben", detail: "Offene, bald fällige und überfällige Punkte" },
      { id: "reminders", label: "Mein Kalender", detail: "Termine und Erinnerungen nach Tagen", kalender: true },
      { id: "memory", label: "Tagebuch", detail: "Ereignisse, Beobachtungen und offene Punkte festhalten" },
    ] },
  ] },
  { id: "health", label: "Gesundheit & Arbeit", landing: "health", groups: [
    { title: "Gesundheit", items: [
      { id: "medical", label: "Diagnosen, AU & ICD-Codes", detail: "Befunde, Ärzte und chronologische AU-Zeiten" },
      { id: "benefits", label: "Krankenkasse & Leistungen", detail: "Zahlungen, Fristen und offene Klärungen" },
    ] },
    { title: "Arbeit und Anträge", items: [
      { id: "work", label: "Arbeit & Arbeitgeber", detail: "Arbeitszeiten, Urlaub und Krankmeldungen" },
      { id: "assessment", label: "Anträge & Bescheide", detail: "Anträge, Bescheide und Behördenpost" },
      { id: "correspondence", label: "Anfragen & Antworten", detail: "Schriftverkehr mit Krankenkasse, Ämtern und Arbeitgeber" },
    ] },
  ] },
  { id: "family", label: "Familie & Personen", landing: "family", groups: [
    { title: "Personenakten", items: [
      { id: "family", label: "Familienübersicht", detail: "Personen, gemeinsame Vorgänge und wichtige Unterlagen" },
      { id: "family", label: "Personen", detail: "Personen, Organisationen und Objekte – anlegen und öffnen", anker: "#familie-stamm" },
    ] },
    { title: "Später ergänzbar", items: [
      { id: "documents", label: "Vollmachten & Vorsorge", detail: "Noch kein eigener Bereich – passende Unterlagen in der Bibliothek suchen", suche: "Vollmacht oder Vorsorge oder Patientenverfügung" },
      { id: "documents", label: "Versicherungen & Verträge", detail: "Noch kein eigener Bereich – passende Unterlagen in der Bibliothek suchen", suche: "Versicherung oder Vertrag oder Police" },
    ] },
  ] },
  { id: "home", label: "Wohnen", landing: "home", groups: [
    { title: "Haus und Wohnung", items: [
      { id: "home", label: "Miet- & Vermieterunterlagen", detail: "Verträge, Übergaben und Schriftverkehr" },
      { id: "home", label: "Nebenkosten & Zahlungen", detail: "Abrechnungen, Fristen und Belege" },
      { id: "home", label: "Mängel & Reparaturen", detail: "Meldungen, Angebote, Rechnungen und Verlauf" },
    ] },
  ] },
  { id: "vehicles", label: "Fahrzeuge", landing: "vehicles", groups: [
    { title: "Fahrzeugakten", items: [
      { id: "vehicles", label: "Fahrzeugpapiere", detail: "Zulassung, Kauf und technische Nachweise" },
      { id: "vehicles", label: "Werkstatt & Wartung", detail: "Reparaturen, Rechnungen und Ereignishistorie" },
      { id: "vehicles", label: "TÜV & Versicherung", detail: "Termine, Gutachten, Policen und Fristen" },
    ] },
  ] },
  { id: "purchases", label: "Käufe & Garantien", landing: "purchases", groups: [
    { title: "Objektakten", items: [
      { id: "purchases", label: "Käufe & Rechnungen", detail: "Kaufdatum, Betrag und Beleg" },
      { id: "purchases", label: "Garantie & Reparatur", detail: "Garantieende, Schäden und Serviceverlauf" },
      { id: "purchases", label: "Geräte & Technik", detail: "Seriennummern, Zubehör und Unterlagen" },
    ] },
  ] },
  { id: "documents", label: "Dokumente", landing: "documents", groups: [
    { title: "Dokumentenablage", items: [
      { id: "documents", label: "Dokumentenbibliothek", detail: "Vorhandene Dokumente suchen, filtern und im Zusammenhang öffnen" },
      { id: "inventory", label: "Bestand prüfen", detail: "Ausgewählte Test-, PC- oder OneDrive-Ordner kontrolliert analysieren" },
      { id: "inbox", label: "Eingangszentrale", detail: "PDF, Word, Fotos, Scans und E-Mails gemeinsam prüfen" },
      { id: "workflowpdf", label: "Workflow PDF", detail: "Scannen, zuschneiden, Felder setzen, ausfüllen, prüfen, PDF ausgeben" },
      { id: "stapel", label: "Stapel (noch einordnen)", detail: "Viele Fotos/Scans auf einmal: gerade gezogen, erst später einordnen" },
      { id: "security", label: "Sicherheit & lokaler Tresor", detail: "Speicherort, Sicherung, Export und Übergabe einer Unterlage" },
      { id: "netz", label: "Netz (Mycel)", detail: "Visitenkarte im SBKIM-Netz zeigen – kein Abgleich deiner Daten" },
      { id: "sources", label: "Unterlagen & Quellen", detail: "Kerndokumente und Beweiswert" },
      { id: "directory", label: "Gesamtes Verzeichnis", detail: "Alle Bereiche: vollständige Navigationsstruktur" },
    ] },
  ] },
  { id: "help", label: "Hilfe", landing: "help", groups: [
    { title: "Hilfe und Änderungen", items: [
      { id: "help", label: "Hilfe & erste Schritte", detail: "Einfache Erklärungen und praktische Beispiele" },
      { id: "systemcheck", label: "Systemprüfung", detail: "Lesende System- und Qualitätsprüfung starten" },
      { id: "changelog", label: "Was gibt’s Neues?", detail: "Neue Dokumente, Vorgänge und wichtige Veränderungen" },
      { id: "versions", label: "Versionshistorie", detail: "Vollständiger technischer Entwicklungsverlauf" },
      { id: "security", label: "Sicherheit & lokaler Tresor", detail: "Datentresor & Sicherung: Speicherort und Sicherung verstehen" },
    ] },
  ] },
];

const sectionLabels: Record<SectionId, string> = {
  overview: "Startseite", health: "Gesundheit & Arbeit", medical: "Diagnosen, AU & ICD-Codes",
  benefits: "Krankenkasse & Leistungen", work: "Arbeit & Arbeitgeber", assessment: "Anträge & Bescheide",
  correspondence: "Anfragen & Antworten", assistant: "Assistenz", family: "Familie & Personen", home: "Wohnen",
  vehicles: "Fahrzeuge", purchases: "Käufe & Garantien", documents: "Dokumentenbibliothek", inventory: "Bestand prüfen", inbox: "Eingangszentrale",
  reminders: "Fristen und Aufgaben", cockpit: "Cockpit",
  memory: "Tagebuch",
  sources: "Unterlagen & Quellen", directory: "Gesamtes Verzeichnis",
  security: "Sicherheit & lokaler Tresor", netz: "Netz (Mycel)", workflowpdf: "Workflow PDF", stapel: "Stapel (noch einordnen)",
  help: "Hilfe", systemcheck: "Systemprüfung", changelog: "Was gibt’s Neues?", versions: "Versionshistorie",
};

const statusLabel: Record<UploadedDocument["status"], string> = {
  hochgeladen: "neu hochgeladen", abgleich_offen: "Abgleich offen", geprüft: "geprüft", eingearbeitet: "eingearbeitet",
};
const actionStateLabel: Record<ActionState, string> = {
  pending: "noch offen", success: "erfolgreich erledigt", failed: "zuletzt nicht möglich",
};
const cockpitUrgencyLabel: Record<CockpitPriorityItem["urgency"], string> = {
  overdue: "überfällig", today: "heute", dueSoon: "bald fällig", attention: "Handlungsbedarf", open: "offen", new: "neu",
};
const buildSearchResults = buildPortalSearchResults.bind(null, topNavigation);
const fmtBytes = (value: number) => value < 1024 * 1024
  ? `${Math.max(1, Math.round(value / 1024))} KB`
  : `${(value / 1024 / 1024).toFixed(1)} MB`;
type FillState = { stand: string; marke: string | null; fuellbar: boolean };
const fillStateOf = (item: LocalDocument): FillState => ({ stand: item.ausfuellen?.stand || "", marke: ausfuellMarke(item), fuellbar: (/^application\/pdf$|^image\/(jpeg|png|webp)$/.test(item.mimeType) || /\.(pdf|jpe?g|png|webp)$/i.test(item.originalName)) });
/** Titel eines lokalen Dokuments: der im Prüfdialog bestätigte Titel, sonst der Dateiname. Geschützte Unterlagen behalten den Dateinamen. */
const dokumentTitel = (item: { originalName: string; category?: string | null; notes?: string | null; titel?: string | null }) =>
  item.titel && !isSensitiveHealthText(item.originalName, item.category, item.notes) ? item.titel : item.originalName;
const visibleDocumentTitle = (item: { originalName: string; category?: string | null; notes?: string | null; titel?: string | null }) => protectedFamilyLabel({ label: dokumentTitel(item), category: item.category, notes: item.notes, sensitive: isSensitiveHealthText(item.originalName, item.category, item.notes) });

type SystemCheckBackup = {
  id: string;
  createdAt: string;
  sourceReportId: string;
  version: string;
  previousCurrent: StoredSystemCheck | null;
  previousReportCount: number;
};

const newSystemReportId = (kind: "check" | "repair") => `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function buildSystemProblems(areas: SystemCheckArea[]): SystemCheckProblem[] {
  const guidance: Partial<Record<SystemCheckArea["id"], { cause: string; nextStep: string }>> = {
    data: { cause: "Ein verbundener lokaler Datentresor war beim Prüflauf nicht vollständig lesbar.", nextStep: "Ordnerfreigabe im Sicherheitscenter erneut bestätigen und die Prüfung wiederholen." },
    documents: { cause: "Eine Dokumentreferenz ist unvollständig oder es gibt eine mögliche Dublette.", nextStep: "Betroffene Dokumente im Dokumenteneingang ansehen; die Familienakte ändert sie nicht automatisch." },
    documentintake: { cause: "Mindestens ein Eingangsweg, eine Integrationsverknüpfung oder ein Schutztest ist unvollständig.", nextStep: "Gemeinsame Pipeline, Ordnerfreigabe, Dublettenprüfung und Zielverknüpfungen prüfen; keine Originaldatei automatisch verändern." },
    centralintake: { cause: "Mindestens ein Dateityp, eine E-Mail-Verknüpfung oder ein Warteschlangen-Test ist unvollständig.", nextStep: "Eingangszentrale, Dateityperkennung und gemeinsame Analyse gezielt prüfen; keine Originaldatei automatisch verändern." },
    fawogainventory: { cause: "Im aktuell verbundenen lokalen Register ist noch kein vollständig abgeschlossener Bestandsanalyse-Lauf nachgewiesen.", nextStep: "Unter Dokumente → Bestand prüfen den vorbereiteten Pilotordner auswählen, analysieren und anschließend nur Testkopien bewusst archivieren und freigeben." },
    fawogaonedrive: { cause: "Mindestens ein verpflichtender Schritt der Abschlussprüfung 2.28.1 ist im verbundenen Testbestand noch nicht nachgewiesen.", nextStep: "Nur die im Prüfbereich ausdrücklich als offen gekennzeichneten Teilnachweise durchführen und danach die Abschlussprüfung erneut starten." },
    documentscan: { cause: "Mindestens ein Schritt von der Fotoaufnahme bis zur gemeinsamen PDF ist unvollständig.", nextStep: "Kamerafreigabe, Seitenverwaltung, PDF-Erstellung und Übergabe an den vorhandenen Dokumenteneingang prüfen; keine Scan-Fotos automatisch als eigene Dokumente speichern." },
    memory: { cause: "Mindestens ein Memory-Ablauf, eine Verknüpfung oder eine Schutzregel ist unvollständig.", nextStep: "Erfassung, Rückfrage, lokale Medienablage, offene Punkte und Wiederverwendung der vorhandenen Modelle gezielt prüfen." },
    contextlinking: { cause: "Mindestens ein Dokument-Memory-Vorgangsbezug oder eine Schutzregel ist unvollständig.", nextStep: "Vorschläge, Ablehnungen, lösbare Beziehungen, offene Punkte und gemeinsame Chronologie prüfen; keine fachliche Zuordnung automatisch korrigieren." },
    relations: { cause: "Die technische Grundlage ist vorhanden, konkrete Zuordnungen wurden aber noch nicht angelegt.", nextStep: "Die geplante Ausbaustufe „Zuordnungslogik v1“ umsetzen." },
    search: { cause: "Mindestens eine interne Testsuche lieferte kein erwartetes Ergebnis.", nextStep: "Suchbegriff und betroffenen Datenbereich prüfen und danach erneut testen." },
    export: { cause: "Ein vollständiger Aktenexport ist noch nicht umgesetzt.", nextStep: "Exportfunktion in einer eigenen, geprüften Ausbaustufe ergänzen." },
    news: { cause: "Die Neuigkeiten-Abfrage oder ein Zeitraumfilter konnte nicht vollständig bestätigt werden.", nextStep: "Modulare Datenabfrage, Sortierung, Verlinkung und Datenschutzvorschau prüfen." },
    cockpit: { cause: "Mindestens ein Cockpit-Ablauf oder eine Schutzregel konnte nicht vollständig bestätigt werden.", nextStep: "Cockpit-Verknüpfungen, praktische Testfälle und den Schutz der Gesundheitsdaten prüfen; keine fachlichen Daten automatisch verändern." },
    reminders: { cause: "Fristen und Erinnerungen sind im Datenmodell vorbereitet, aber noch kein vollständiger Arbeitsablauf.", nextStep: "Fristen- und Erinnerungslogik in einer späteren Ausbaustufe fertigstellen." },
    interface: { cause: "Ein erwarteter sichtbarer Bereich fehlt oder ist nicht registriert.", nextStep: "Oberfläche in einer neuen Version gezielt prüfen und ergänzen." },
    navigation: { cause: "Ein erwarteter Navigationsweg ist nicht erreichbar.", nextStep: "Navigation in einer neuen Version gezielt prüfen und korrigieren." },
    health: { cause: "Ein erwarteter Hauptbestandteil der Gesundheitsakte ist nicht erreichbar.", nextStep: "Quellstruktur prüfen; Gesundheitsdaten nicht automatisch verändern." },
    model: { cause: "Ein Datentyp, Systemfeld oder die Kennungslogik fehlt.", nextStep: "Datenmodell im Quellstand korrigieren und erneut vollständig prüfen." },
    changelog: { cause: "Version, Changelog oder Prüfziele passen nicht vollständig zusammen.", nextStep: "Versionsangaben und Änderungsbeschreibung im nächsten Entwicklungsdurchlauf abgleichen." },
    help: { cause: "Die Hilfe ist nicht auf dem Stand der aktuellen Version.", nextStep: "Hilfetext aktualisieren und die Systemprüfung erneut ausführen." },
    reports: { cause: "Die lokale Berichtshistorie ist nicht vollständig verfügbar.", nextStep: "Browser-Speicher freigeben und die Systemprüfung erneut starten." },
    repair: { cause: "Der sichere Reparaturrahmen ist nicht vollständig eingerichtet.", nextStep: "Reparaturregeln im nächsten Entwicklungsdurchlauf prüfen." },
    consolidation: { cause: "Führendes System, gemeinsamer Bestand oder Integrationsgrenzen sind nicht vollständig festgeschrieben.", nextStep: "Konsolidierungsregeln prüfen; keine Zuordnungs- oder OneDrive-Automatik starten." },
    assignment: { cause: "Mindestens ein Bestandteil der Vorschlags- oder Sicherheitslogik ist unvollständig.", nextStep: "Zuordnungslogik und die vier Pflicht-Testfälle prüfen; keine Zuordnung automatisch übernehmen." },
    menuoptimization: { cause: "Mindestens ein Menü-, Detailseiten- oder Verknüpfungstest ist unvollständig.", nextStep: "Betroffene Aktion und Zielverknüpfung prüfen; nur den ausdrücklich freigegebenen Startseitenbereich verändern." },
    systemcheck: { cause: "Der verpflichtende Prüfkatalog ist unvollständig.", nextStep: "Prüfkatalog und Freigaberegel im Quellstand ergänzen." },
  };
  return areas.filter((area): area is SystemCheckArea & { level: "yellow" | "red" } => area.level !== "green").map((area) => {
    const openDetails = area.id === "fawogaonedrive"
      ? area.details.filter((detail) => detail.startsWith("Offen:")).map((detail) => detail.replace(/^Offen:\s*/, ""))
      : [];
    return {
      areaId: area.id,
      areaLabel: area.label,
      level: area.level,
      summary: area.summary,
      cause: guidance[area.id]?.cause || "Der Prüfbereich konnte nicht vollständig bestätigt werden.",
      nextStep: openDetails.length
        ? `${openDetails.join(" ")} Danach die Abschlussprüfung erneut starten.`
        : guidance[area.id]?.nextStep || "Prüfbereich gezielt ansehen und danach erneut prüfen.",
    };
  });
}

function normalizeSystemReport(value: StoredSystemCheck | null): SystemCheckReport | null {
  if (!value?.areas?.length || !value.mode) return null;
  const overall = value.overall;
  return {
    ...value,
    areas: value.areas,
    id: value.id || `legacy-${value.checkedAt}`,
    mode: value.mode,
    kind: value.kind || "check",
    repairs: value.repairs || [],
    greenPoints: value.greenPoints || value.areas.filter((area) => area.level === "green").map((area) => ({ areaId: area.id, areaLabel: area.label, summary: area.summary })),
    testCases: value.testCases || [],
    openProblems: value.openProblems || buildSystemProblems(value.areas),
    releaseStatus: value.releaseStatus || (overall === "green" ? "freigegeben" : overall === "yellow" ? "prüfung_empfohlen" : "nicht_freigegeben"),
  };
}

function runAssignmentSystemTests(): SystemCheckReport["testCases"] {
  const records = [
    { id: "PER-000001", recordType: "person" as const, label: "Musterperson", identifiers: ["TEST-PER-1"] },
    { id: "OBJ-000001", recordType: "object" as const, label: "Motoria Strada 1200", identifiers: ["TEST-FAHRZEUG-1"] },
    { id: "VORG-000001", recordType: "case" as const, label: "Wiederzulassung Motoria" },
    { id: "ORG-000001", recordType: "organisation" as const, label: "TÜV Nord", aliases: ["TÜV"] },
    { id: "VORG-000002", recordType: "case" as const, label: "Stromabrechnung 2026" },
    { id: "ORG-000002", recordType: "organisation" as const, label: "Muster Energie" },
    { id: "OBJ-000002", recordType: "object" as const, label: "Notebook", identifiers: ["TEST-GERAET-1"] },
    { id: "VORG-000003", recordType: "case" as const, label: "Teilzeitantrag" },
    { id: "ORG-000003", recordType: "organisation" as const, label: "Rentenversicherung", aliases: ["Rentenversicherung"] },
  ];
  const context = { records, now: "2026-10-07T17:45:00+02:00" };
  const selected = (proposal: ReturnType<typeof proposeFamilyAssignment>, stage: typeof assignmentSequence[number]) => proposal.steps.find((item) => item.stage === stage)?.selectedId;
  const safe = (proposal: ReturnType<typeof proposeFamilyAssignment>) => assignmentProposalHasNoAutomaticWrites(proposal);
  try {
    const vehicle = proposeFamilyAssignment({ title: "TÜV-Bericht", personHints: ["Musterperson"], areaHint: "Motorrad", objectHints: ["Motoria Strada 1200"], caseHints: ["Wiederzulassung Motoria"], organisationHints: ["TÜV"], identifiers: ["TEST-FAHRZEUG-1"], deadline: "2028-06-30", requiredAction: "HU vorbereiten" }, context);
    const household = proposeFamilyAssignment({ title: "Stromrechnung", personHints: ["Musterperson"], areaHint: "Haushalt", caseHints: ["Stromabrechnung 2026"], organisationHints: ["Muster Energie"], amount: 100, paid: false, deadline: "2026-10-31", contractNumber: "TEST-STROM-1" }, context);
    const purchase = proposeFamilyAssignment({ title: "Geräterechnung", areaHint: "Kauf und Garantie", objectHints: ["Notebook"], identifiers: ["TEST-GERAET-1"], purchaseDate: "2026-07-14", warrantyEnd: "2028-07-14" }, context);
    const health = proposeFamilyAssignment({ title: "Behördenschreiben", personHints: ["Musterperson"], areaHint: "Gesundheit", caseHints: ["Teilzeitantrag"], organisationHints: ["Rentenversicherung"], deadline: "2026-11-04", requiredAction: "Schreiben beantworten", sensitive: true }, context);
    return [
      { id: "fahrzeug", label: "Fahrzeug / TÜV", status: selected(vehicle, "object") === "OBJ-000001" && selected(vehicle, "case") === "VORG-000001" && !!vehicle.deadlineProposal && safe(vehicle) ? "bestanden" : "fehlgeschlagen", summary: "Person, Objekt, Vorgang, TÜV, Frist und Sicherheitsgrenzen geprüft." },
      { id: "haushalt", label: "Haushalt / Stromrechnung", status: selected(household, "case") === "VORG-000002" && !!household.paymentProposal && !!household.contractProposal && safe(household) ? "bestanden" : "fehlgeschlagen", summary: "Energie, Vertrag, Rechnung, Zahlung und Frist geprüft." },
      { id: "kauf", label: "Kauf / Garantie", status: selected(purchase, "object") === "OBJ-000002" && purchase.warrantyProposal?.expiresOn === "2028-07-14" && safe(purchase) ? "bestanden" : "fehlgeschlagen", summary: "Objekt, Kaufdatum und Garantieende geprüft." },
      { id: "gesundheit", label: "Gesundheit / Behörde", status: health.protectedHealthArea && health.sensitiveReferenceOnly && selected(health, "case") === "VORG-000003" && safe(health) ? "bestanden" : "fehlgeschlagen", summary: "Geschützter Bereich, Referenzen, Vorgang, Frist und Aufgabe geprüft." },
    ];
  } catch {
    return [
      { id: "fahrzeug", label: "Fahrzeug / TÜV", status: "fehlgeschlagen", summary: "Testlauf konnte nicht abgeschlossen werden." },
      { id: "haushalt", label: "Haushalt / Stromrechnung", status: "fehlgeschlagen", summary: "Testlauf konnte nicht abgeschlossen werden." },
      { id: "kauf", label: "Kauf / Garantie", status: "fehlgeschlagen", summary: "Testlauf konnte nicht abgeschlossen werden." },
      { id: "gesundheit", label: "Gesundheit / Behörde", status: "fehlgeschlagen", summary: "Testlauf konnte nicht abgeschlossen werden." },
    ];
  }
}

function readSystemCheckReports(): SystemCheckReport[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_REPORTS_KEY) || "[]") as StoredSystemCheck[];
    const builtIn = normalizeSystemReport(releaseSystemCheckReport as StoredSystemCheck);
    const reports = stored.map((item) => normalizeSystemReport(item)).filter((item): item is SystemCheckReport => !!item);
    if (builtIn && !reports.some((item) => item.id === builtIn.id)) reports.push(builtIn);
    if (reports.length) return reports.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
    const legacy = normalizeSystemReport(JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null);
    return legacy ? [legacy] : [];
  } catch { return []; }
}

function saveSystemCheckReport(report: SystemCheckReport, makeCurrent = report.kind === "check") {
  const existing = readSystemCheckReports();
  const reports = [report, ...existing.filter((item) => item.id !== report.id)]
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  workspaceStorage.setItem(SYSTEM_CHECK_REPORTS_KEY, JSON.stringify(reports));
  if (makeCurrent) workspaceStorage.setItem(SYSTEM_CHECK_STORAGE_KEY, JSON.stringify(report satisfies StoredSystemCheck));
  return reports;
}

function createSystemCheckBackup(source: SystemCheckReport) {
  const backups = (() => {
    try { return JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_BACKUPS_KEY) || "[]") as SystemCheckBackup[]; }
    catch { return []; }
  })();
  const backup: SystemCheckBackup = {
    id: `backup-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceReportId: source.id,
    version: APP_VERSION,
    previousCurrent: (() => {
      try { return JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null; }
      catch { return null; }
    })(),
    previousReportCount: readSystemCheckReports().length,
  };
  workspaceStorage.setItem(SYSTEM_CHECK_BACKUPS_KEY, JSON.stringify([backup, ...backups].slice(0, 20)));
  return backup;
}

const normalizeSearch = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9.]+/g, " ").trim();

function parseGermanDate(value: string) {
  const normalized = normalizeSearch(value).replace(/\s+/g, " ");
  const numeric = normalized.match(/\b(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{2,4})\b/);
  const months: Record<string, number> = { januar: 1, februar: 2, marz: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12 };
  const named = normalized.match(/\b(\d{1,2})[. ]+([a-z]+)[ ]+(\d{2,4})\b/);
  const day = Number(numeric?.[1] || named?.[1]);
  const month = Number(numeric?.[2] || (named ? months[named[2]] : 0));
  let year = Number(numeric?.[3] || named?.[3]);
  if (year > 0 && year < 100) year += 2000;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (!day || !month || !year || candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}
const objectAreas = [
  { id: "health" as SectionId, title: "Gesundheit & Leistung", text: "Gesundheitsakte, Arbeitsunfähigkeit, Krankenkasse, Arbeitgeber, Rente und Teilzeit.", status: "aktiv", Icon: HeartPulse },
  { id: "family" as SectionId, title: "Familie & Personen", text: "Personenbezogene Unterlagen, gemeinsame Vorgänge, Vorsorge und Versicherungen.", status: "vorbereitet", Icon: Users },
  { id: "home" as SectionId, title: "Haus & Wohnung", text: "Mietvertrag, Vermieter, Nebenkosten, Mängel, Reparaturen und Übergaben.", status: "vorbereitet", Icon: Home },
  { id: "vehicles" as SectionId, title: "Fahrzeuge", text: "Fahrzeugpapiere, Kauf, Werkstatt, Wartung, TÜV, Gutachten und Versicherung.", status: "vorbereitet", Icon: Car },
  { id: "purchases" as SectionId, title: "Käufe & Garantien", text: "Rechnungen, Verträge, Garantiefristen, Reparaturen und Geräteakten.", status: "vorbereitet", Icon: PackageCheck },
  { id: "inbox" as SectionId, title: "Dokumenteneingang", text: "Neue Unterlagen zentral hochladen, einem Bereich zuordnen und gemeinsam prüfen.", status: "aktiv", Icon: Upload },
];

function cockpitDocuments(documents: UploadedDocument[], localDocuments: LocalDocument[]): FamilyCockpitDocument[] {
  return [
    // Titel aus dem Prüfdialog statt Dateiname (2.28.39); geschützte Gesundheitsunterlagen behalten den Dateinamen und ihren Schutz.
    // „Aus der Akte nehmen“ (2.28.39): aussortierte Dokumente stehen nur noch unter „Aussortiert (n)“ in der Bibliothek.
    ...localDocuments.filter((item) => !item.aussortiert).map((item) => ({ id: item.id, originalName: dokumentTitel(item), dateiname: item.titel ? item.originalName : null, textAuszug: item.textAuszug || null, category: item.category, documentDate: item.documentDate, status: item.status, createdAt: item.addedAt, updatedAt: item.updatedAt, mimeType: item.mimeType, notes: item.notes, storageType: item.storageType, storedPath: item.storedPath, relativePath: item.relativePath, oneDrivePath: item.oneDrivePath })),
    ...documents.map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, status: item.status, createdAt: item.uploadedAt, updatedAt: null, mimeType: item.mimeType, previewUrl: item.mimeType.startsWith("image/") ? item.downloadUrl : null, notes: item.notes, storageType: "online-r2", downloadUrl: item.downloadUrl })),
  ];
}

function contextDocuments(documents: UploadedDocument[], localDocuments: LocalDocument[]): ContextDocument[] {
  return cockpitDocuments(documents, localDocuments).map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, createdAt: item.createdAt, updatedAt: item.updatedAt, notes: item.notes }));
}


export default function HealthPortal() {
  return <ActivityProvider><HealthPortalContent/></ActivityProvider>;
}

function HealthPortalContent() {
  const reportActivity = useActivity();
  const navigation = usePortalNavigation(sectionLabels);
  const { section: active, query } = navigation.view;
  const setQuery = navigation.setQuery;
  const cockpitFocusId = active === "cockpit" ? navigation.view.targetId : null;
  const memoryFocusId = active === "memory" ? navigation.view.targetId : null;
  const remindersFocusId = active === "reminders" ? navigation.view.targetId : null;
  const assistantCaseId = active === "assistant" ? navigation.view.targetId : null;
  const documentLibraryFocusId = active === "documents" ? navigation.view.targetId : null;
  const documentLibraryRequest = navigation.view.library;
  const [mobileOpen, setMobileOpen] = useState(false);
  // Kopf bis 900 px (Klaus 08.11.2026): Drucken, Installieren, Abmelden hinter dem Pfeil ‹ in einer Leiste, › schließt.
  const [kopfAuf, setKopfAuf] = useState(false);
  // Name im Kopf immer ganz (Klaus 08.11.2026): ist es eng (Handy, geteilter Bildschirm), wird die Schrift kleiner.
  const markenName = useRef<HTMLElement>(null);
  useEinzeilig(markenName, 10);
  useEffect(() => {
    if (!kopfAuf) return;
    const daneben = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.(".header-actions")) setKopfAuf(false); };
    const taste = (e: KeyboardEvent) => { if (e.key === "Escape") setKopfAuf(false); };
    document.addEventListener("pointerdown", daneben); document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("pointerdown", daneben); document.removeEventListener("keydown", taste); };
  }, [kopfAuf]);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitialFile, setUploadInitialFile] = useState<File | null>(null);
  const [uploadSource, setUploadSource] = useState<DocumentIntakeSource>("file-picker");
  const [uploadFromStart, setUploadFromStart] = useState(false);
  const [uploadQueueId, setUploadQueueId] = useState<string | null>(null);
  // Prüfbericht 08.11.2026 (M3, M4, M6): nach dem Speichern dorthin zurück, wo die Unterlage begonnen wurde.
  const [uploadZurueck, setUploadZurueck] = useState<SectionId>("inbox");
  const [uploadFristVorgabe, setUploadFristVorgabe] = useState<{ datum: string | null; angehakt: boolean } | null>(null);
  const nachSpeichernAusfuellen = useRef(false);
  const scanZurueck = useRef<SectionId>("overview");
  const [scanRueckweg, setScanRueckweg] = useState<SectionId | null>(null);
  const [lastIntakeReceipt, setLastIntakeReceipt] = useState<IntakeReceipt | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanInitialFiles, setScanInitialFiles] = useState<File[]>([]);
  const [scanQueueIds, setScanQueueIds] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null);
  const [memoryReviewOpen, setMemoryReviewOpen] = useState(false);
  const [lastMemoryReceipt, setLastMemoryReceipt] = useState<MemoryReceipt | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitialRequest, setEditInitialRequest] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [demoPlan, setDemoPlan] = useState<Awaited<ReturnType<typeof demoUebernahmePlan>> | null>(null);
  const [einlesen, setEinlesen] = useState<{ gewaehlt: FileSystemDirectoryHandle; probe: EinleseProbe; zugang?: SicherungsZugang } | null>(null);
  // Stufe B: Art der Sicherung wählen, Notfallblatt zeigen, Passwort für eine verschlüsselte Sicherung erfragen.
  const [sicherungWahl, setSicherungWahl] = useState(false);
  const [notfallblatt, setNotfallblatt] = useState<{ notfall: string; ordner: string; erstellt: string } | null>(null);
  const [passwortDialog, setPasswortDialog] = useState<{ gewaehlt: FileSystemDirectoryHandle; name: string; fehler: string; laeuft: boolean } | null>(null);
  const [letzteSicherung, setLetzteSicherung] = useState<string | null>(null);
  const [fillDocId, setFillDocId] = useState<string | null>(null);
  const [wfpdfOeffnen, setWfpdfOeffnen] = useState<File[] | null>(null);
  const [wfpdfScan, setWfpdfScan] = useState(false);
  const [wfpdfStart, setWfpdfStart] = useState(0);
  const [wfpdfSitzung, setWfpdfSitzung] = useState<{ quelle: PdfQuelle; zurueck: SectionId } | null>(null);
  const wfpdfAnfrage = useRef(0);
  const [stapelNeu, setStapelNeu] = useState<File[] | null>(null);
  const [, setCheckRecommended] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null;
      return saved?.version !== APP_VERSION;
    } catch { return true; }
  });
  const [lastSystemReport, setLastSystemReport] = useState<SystemCheckReport | null>(() =>
    readSystemCheckReports().find((item) => item.kind === "check") || normalizeSystemReport(releaseSystemCheckReport as unknown as StoredSystemCheck),
  );
  // Kein Online-Speicher mehr (B3): die frühere Cloudflare-Liste ist dauerhaft leer; die Anzeige bleibt unverändert.
  const documents: UploadedDocument[] = useMemo(() => [], []);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [busy, setBusy] = useState(false);
  const setNotice = useCallback((next: Notice) => {
    if (next) reportActivity(next);
  }, [reportActivity]);
  const [centralIntakeQueue, setCentralIntakeQueue] = useEingang((error) => setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Eingang konnte nicht im Arbeitsspeicher gesichert werden." }));
  const intakeAnalyses = useRef(new Set<string>());
  const [oneDriveHandle, setOneDriveHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [localVaultHandle, setLocalVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [inboxFolderHandle, setInboxFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [inboxFolderName, setInboxFolderName] = useState("");
  const [inventorySourceHandle, setInventorySourceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [inventoryArchiveHandle, setInventoryArchiveHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryProgress, setInventoryProgress] = useState<InventoryScanProgress | null>(null);
  const [inventoryLastRun, setInventoryLastRun] = useState<InventoryScanResult | null>(null);
  const inventoryPauseRequested = useRef(false);
  const [inventoryArchiveResult, setInventoryArchiveResult] = useState<InventoryArchiveResult | null>(null);
  const [inventoryBusy, setInventoryBusy] = useState(false);
  const [incomingFiles, setIncomingFiles] = useState<IncomingFolderFile[]>([]);
  const [intakeBusy, setIntakeBusy] = useState(false);
  const [intakeCheckedAt, setIntakeCheckedAt] = useState<string | null>(null);
  const [oneDriveName, setOneDriveName] = useState("");
  const [localVaultName, setLocalVaultName] = useState("");
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [familyRecords, setFamilyRecords] = useState<FamilyRecordUnion[]>([]);
  const [familyRelations, setFamilyRelations] = useState<FamilyRelation[]>([]);
  const [linkDecisions, setLinkDecisions] = useState<ContextLinkDecision[]>([]);
  const [memoryDrafts, setMemoryDrafts] = useState<MemoryDraftEntry[]>([]);
  const [vaultAuditLog, setVaultAuditLog] = useState<unknown[]>([]);
  const [memoryEditDraft, setMemoryEditDraft] = useState<MemoryDraft | null>(null);
  const [memoryCompletion, setMemoryCompletion] = useState<MemoryCompletion | null>(null);
  const [vaultBusy, setVaultBusy] = useState(false);
  const [oneDriveSummary, setOneDriveSummary] = useState<VaultSummary | null>(null);
  const [localVaultSummary, setLocalVaultSummary] = useState<VaultSummary | null>(null);
  const [syncPreview, setSyncPreview] = useState<VaultSyncPreview | null>(null);
  const [syncResult, setSyncResult] = useState<VaultSyncResult | null>(null);
  const [uploadSuggestedCaseId, setUploadSuggestedCaseId] = useState<string | null>(null);
  const [memorySuggestedCaseId, setMemorySuggestedCaseId] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<ActionKey, ActionState>>({
    vault: "pending", upload: "pending", compare: "pending", update: "pending", chatgpt: "pending",
  });
  const vaultHandle = oneDriveHandle || localVaultHandle;
  akteOrtSetzen(vaultHandle);
  const [sampleBusy, setSampleBusy] = useState(false);
  const samplePresent = useMemo(() => sampleDataPresent({ documents: localDocuments, records: familyRecords }), [localDocuments, familyRecords]);
  // „Aus der Akte nehmen“ (2.28.39): aussortierte Dokumente fehlen in Suche, Assistenz, Cockpit und Bibliotheksliste.
  const aktenDokumente = useMemo(() => localDocuments.filter((d) => !d.aussortiert), [localDocuments]);
  const removeSampleData = async (fragen = true) => {
    if (!vaultHandle) return;
    if (fragen && !await askConfirm("Alle Beispieldaten entfernen?\n\nEntfernt werden nur die erfundenen Beispieleinträge und Beispieldokumente. Deine eigenen Unterlagen und Einträge bleiben erhalten.")) return;
    setSampleBusy(true);
    try { const result = await removeSampleFamily(vaultHandle); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: `Bsp. entfernt: ${result.removedEntries} Einträge, ${result.removedFiles} Unterlagen.` }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Beispieldaten konnten nicht entfernt werden." }); }
    finally { setSampleBusy(false); }
  };
  // Klaus 11.11.: „+ Bsp.“ legt die erfundene Beispielfamilie in die eigene Akte (gespeichert), „− Bsp.“ nimmt nur sie heraus.
  const addSampleData = async () => {
    if (!vaultHandle || demoActive()) return;
    setSampleBusy(true);
    try { await seedSampleFamily(vaultHandle, { force: true }); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Bsp. angelegt: erfundene Beispielfamilie in allen Bereichen, mit rotem Dreieck markiert." }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Bsp. konnten nicht angelegt werden." }); }
    finally { setSampleBusy(false); }
  };
  const loadSampleData = async () => {
    if (!vaultHandle) return;
    setSampleBusy(true);
    try {
      // Nur den tatsächlich aktiven Bestand bereinigen; keine anderen Speicherorte.
      const data = await readLocalVaultData(vaultHandle);
      if (sampleDataPresent(data)) await removeSampleFamily(vaultHandle);
      // P7: Sind eigene Daten da, arbeitet die Demo an einer Kopie davon; sonst Beispielfamilie. Der Demo-Bereich wird vorher geleert.
      setNotice({ kind: "info", laeuft: true, text: "Demo wird vorbereitet: eigene Daten werden in den getrennten Demo-Bereich kopiert. Das Original bleibt unverändert." });
      // Eine passende Demo läuft weiter (mit ihren Testimporten); sonst neu: Kopie oder Beispielfamilie.
      if (await demoNochPassend(vaultHandle, demoQuelleLesen(localStorage))) { switchDemo(true); return; }
      await resetDemoStorage();
      const quelle = await demoKopieAnlegen(vaultHandle);
      try { localStorage.setItem(DEMO_QUELLE_SCHLUESSEL, JSON.stringify(quelle)); } catch { /* ohne Merker startet die Beispielfamilie */ }
      switchDemo(true);
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der bisherige Beispielbestand konnte nicht sicher bereinigt werden." }); }
    finally { setSampleBusy(false); }
  };

  const oneDriveReachable = !!oneDriveHandle && !!oneDriveSummary;
  const localVaultReachable = !!localVaultHandle && !!localVaultSummary;
  const vaultReachable = oneDriveReachable || localVaultReachable;
  const browserStorage = isBrowserVault(localVaultHandle);
  const { destination: proDestination, refresh: refreshProDestination } = useProDestination((oneDriveHandle ? oneDriveReachable : localVaultReachable) ? vaultHandle : null);
  const vaultRemembered = !!oneDriveHandle || (!!localVaultHandle && !browserStorage) || !!proDestination;
  const setActionState = (action: ActionKey, state: ActionState) => {
    setActionStates((current) => ({ ...current, [action]: state }));
  };

  // 2.28.39: Erinnerungen, die zu einer Aufgabe gehören, einmal in diese umziehen (Sicherung vorher); ein Fehler hält den Start nicht auf.
  const erinnerungenUmziehenLeise = async (handle: FileSystemDirectoryHandle) => {
    try { const n = await erinnerungenInAufgabenUmziehen(handle, kalenderEinstLesen()?.erinnerungen || ERINNERUNG_VORGABE); if (n) setNotice({ kind: "info", text: `${n} Erinnerung${n === 1 ? "" : "en"} stehen jetzt direkt in ihrer Aufgabe oder Frist. Vorher wurde eine Sicherung des Registers angelegt.` }); }
    catch (error) { console.error("Umzug der Erinnerungen", error); }
  };
  const applyLocalData = (data: Awaited<ReturnType<typeof readLocalVaultData>>) => {
    setLetzteSicherung(data.letzteVollsicherung ?? null);
    setLocalDocuments(data.documents); setFamilyRecords(data.records); setFamilyRelations(data.relations); setMemoryDrafts(data.memoryDrafts); setLinkDecisions(data.linkDecisions); setInventoryItems(data.inventoryItems); setVaultAuditLog(data.auditLog);
  };

  const refreshLocal = async (handle = vaultHandle, kind: "onedrive" | "local" = oneDriveHandle ? "onedrive" : "local") => {
    if (!handle) { setLocalDocuments([]); setFamilyRecords([]); setFamilyRelations([]); setMemoryDrafts([]); setLinkDecisions([]); setInventoryItems([]); setVaultAuditLog([]); return; }
    const summary = await getVaultSummary(handle);
    if (kind === "onedrive") setOneDriveSummary(summary); else setLocalVaultSummary(summary);
    if (kind === "onedrive" || !oneDriveHandle) {
      const data = await readLocalVaultData(handle);
      applyLocalData(data);
    }
  };
  useEffect(() => {
    Promise.all([rememberedOneDriveVault(), rememberedVault()]).then(async ([oneDrive, local]) => {
      if (oneDrive) {
        setOneDriveHandle(oneDrive); setOneDriveName(oneDrive.name);
        if (await requestVaultPermission(oneDrive)) {
          await erinnerungenUmziehenLeise(oneDrive);
          const data = await readLocalVaultData(oneDrive); applyLocalData(data); setOneDriveSummary(await getVaultSummary(oneDrive));
        }
      }
      if (local) {
        setLocalVaultHandle(local); setLocalVaultName(local.name);
        if (isBrowserVault(local)) {
          // A2: Der Browser konnte beim ersten Start nicht in den Dateispeicher schreiben und nutzt IndexedDB; das wird einmal gesagt.
          try { if (browserStorageKind() === "indexeddb" && !workspaceStorage.getItem("mmi-browser-speicher-hinweis")) { workspaceStorage.setItem("mmi-browser-speicher-hinweis", "1"); setNotice({ kind: "info", text: "Der Browser-Datentresor liegt in diesem Browser in IndexedDB, weil der Dateispeicher (OPFS) nicht beschreibbar war. Diese Wahl bleibt gespeichert; es wird nicht automatisch gewechselt." }); } } catch { /* optional */ }
        }
        if (demoActive() && isBrowserVault(local) && demoQuelleLesen(localStorage)?.art !== "kopie") { setSampleBusy(true); await seedSampleFamily(local).catch((error) => { console.error("Beispieldaten konnten nicht geladen werden", error); return false; }); setSampleBusy(false); }
        if (await requestVaultPermission(local)) {
          await erinnerungenUmziehenLeise(local);
          if (!oneDrive) { const data = await readLocalVaultData(local); applyLocalData(data); }
          setLocalVaultSummary(await getVaultSummary(local));
        }
      }
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    rememberedInboxFolder().then((handle) => {
      if (handle) { setInboxFolderHandle(handle); setInboxFolderName(handle.name); }
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    Promise.all([rememberedInventorySourceFolder(), rememberedInventoryArchiveFolder()]).then(([source, archive]) => {
      if (source) setInventorySourceHandle(source);
      if (archive) setInventoryArchiveHandle(archive);
    }).catch(() => undefined);
  }, []);
  const connectOneDrive = async () => {
    setVaultBusy(true);
    try { const handle = await chooseOneDriveVault(); setOneDriveHandle(handle); setOneDriveName(handle.name); const data = await readLocalVaultData(handle); applyLocalData(data); setOneDriveSummary(await getVaultSummary(handle)); setSyncPreview(null); setSyncResult(null); setActionState("vault", "success"); setNotice({ kind: "success", text: "Der lokale OneDrive-Ordner ist jetzt der primäre Datentresor. Neue Dateien werden direkt dort abgelegt und nicht an die Website hochgeladen." }); }
    catch (error) { if ((error as DOMException)?.name !== "AbortError") { setActionState("vault", "failed"); setNotice({ kind: "error", text: error instanceof Error ? error.message : "Ordner konnte nicht verbunden werden." }); } }
    finally { setVaultBusy(false); }
  };
  const connectLocalVault = async () => {
    setVaultBusy(true);
    try { const handle = await chooseVault(); setLocalVaultHandle(handle); setLocalVaultName(handle.name); const summary = await getVaultSummary(handle); setLocalVaultSummary(summary); setSyncPreview(null); setSyncResult(null); if (!oneDriveHandle) { const data = await readLocalVaultData(handle); applyLocalData(data); } setActionState("vault", "success"); setNotice({ kind: "success", text: oneDriveHandle ? "Der PC-/USB-Tresor ist verbunden. Du kannst den kontrollierten Sicherungsabgleich jetzt prüfen." : "Der lokale Tresor ist verbunden. Neue Dateien bleiben auf diesem PC oder USB-Stick." }); }
    catch (error) { if ((error as DOMException)?.name !== "AbortError") { setActionState("vault", "failed"); setNotice({ kind: "error", text: error instanceof Error ? error.message : "Ordner konnte nicht verbunden werden." }); } }
    finally { setVaultBusy(false); }
  };
  useKalenderAutoAbgleich(vaultHandle, familyRecords, familyRelations, async () => { if (vaultHandle) await refreshLocal(vaultHandle); }, setNotice);
  const lockOneDrive = async () => { await forgetOneDriveVault(); setOneDriveHandle(null); setOneDriveName(""); setOneDriveSummary(null); setSyncPreview(null); setSyncResult(null); if (localVaultHandle && await requestVaultPermission(localVaultHandle)) { const data = await readLocalVaultData(localVaultHandle); applyLocalData(data); setActionState("vault", "success"); } else { setLocalDocuments([]); setFamilyRecords([]); setFamilyRelations([]); setMemoryDrafts([]); setLinkDecisions([]); setInventoryItems([]); setVaultAuditLog([]); setActionState("vault", "pending"); } setNotice({ kind: "info", text: "Die OneDrive-Ordnerfreigabe wurde in diesem Browser gesperrt. Dateien wurden nicht gelöscht." }); };
  const lockLocalVault = async () => { await forgetVault(); setLocalVaultHandle(null); setLocalVaultName(""); setLocalVaultSummary(null); setSyncPreview(null); setSyncResult(null); if (!oneDriveHandle) { setLocalDocuments([]); setFamilyRecords([]); setFamilyRelations([]); setMemoryDrafts([]); setLinkDecisions([]); setInventoryItems([]); setVaultAuditLog([]); setActionState("vault", "pending"); } else setActionState("vault", "success"); setNotice({ kind: "info", text: "Der PC-/USB-Tresor wurde in diesem Browser gesperrt. Dateien wurden nicht gelöscht." }); };
  const beginLocalUpload = (file: File | null, source: DocumentIntakeSource, fromStart: boolean, suggestedCaseId: string | null = null, queueId: string | null = null, optionen: { fristAngehakt?: boolean; zurueck?: SectionId } = {}) => {
    if (!vaultHandle) { setActionState("upload", "failed"); go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-Ordner oder einen PC-/USB-Tresor verbinden." }); return; }
    const frist = queueId ? centralIntakeQueue.find((item) => item.id === queueId)?.analysis?.possibleDeadline : null;
    setUploadFristVorgabe(frist || optionen.fristAngehakt ? { datum: frist ? fristAusHinweis(frist) : null, angehakt: Boolean(optionen.fristAngehakt) } : null);
    setUploadZurueck(optionen.zurueck || (queueId ? "inbox" : active));
    setUploadInitialFile(file); setUploadSource(source); setUploadFromStart(fromStart); setUploadSuggestedCaseId(suggestedCaseId); setUploadQueueId(queueId); setActionState("upload", "pending"); setUploadOpen(true);
    // Eine Meldung je Prüfung (issue): „Gespeichert“ ersetzt danach „noch nichts gespeichert“ statt sich darunter zu stapeln (M10).
    reportActivity({ kind: "info", issue: "eingang-pruefung", text: file ? "1 Unterlage zur Zuordnungsprüfung geöffnet. Es wurde noch nichts gespeichert." : "Dokumenteneingang geöffnet. Bitte eine Datei auswählen; es wurde noch nichts gespeichert." });
  };
  const openLocalUpload = () => beginLocalUpload(null, "file-picker", false);
  // Knopf „Ablegen“ im Kopf (2.28.39): Fotos, Dateien oder ein ganzer Ordner gehen in die Eingangszentrale zur Prüfung.
  const ablegenAusKopf = (files: File[], quelle: DocumentIntakeSource, wahl: "foto" | "dateien" | "ordner") => {
    go("inbox");
    void queueCentralIntakeFiles(files, quelle).then((ok) => {
      const was = wahl === "foto" ? `${files.length} Foto${files.length === 1 ? "" : "s"}` : wahl === "ordner" ? `${files.length} Datei${files.length === 1 ? "" : "en"} aus dem Ordner` : `${files.length} Datei${files.length === 1 ? "" : "en"}`;
      setNotice(ok ? { kind: "success", text: `${was} in der Eingangszentrale. Bitte prüfen und ablegen; gespeichert wird erst nach deiner Bestätigung.` } : { kind: "error", text: "Die Auswahl konnte nicht in die Eingangszentrale übernommen werden. Bitte erneut versuchen." });
    }, (error) => setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Auswahl konnte nicht übernommen werden." }));
  };
  const openStartIntake = (file: File | null = null, source: DocumentIntakeSource = file ? "drag-drop" : "file-picker") => beginLocalUpload(file, source, true);
  const analyzeQueuedIntake = async (placeholders: CentralIntakeQueueItem[]) => {
    setIntakeBusy(true);
    try {
      // Prüfbericht M7: die Warteschlange liest die Textebene eines PDF wie der Prüfdialog (ohne Texterkennung, die bleibt
      // dem Dialog); so widersprechen sich „nicht gelesen“ in der Zeile und „Text gelesen“ im Dialog nicht mehr.
      const textEbene = async (file: File) => {
        if (!(/\.pdf$/i.test(file.name) || file.type === "application/pdf")) return "";
        try { const { dokumentText } = await import("./ki-auftrag-dialog"); return (await dokumentText(file)).slice(0, 300000); } catch { return ""; }
      };
      // Stufe E (Plan 08.11., Entscheidung 9): Block für Block (20), jede Datei nacheinander statt alle zugleich; vor jedem Block
      // der freie Speicher; jeder fertige Block wird sofort festgehalten, ein Abbruch kostet höchstens den laufenden Block.
      const bloecke = inBloecke(placeholders, BLOCK);
      const analyzedAll: CentralIntakeAnalysis[] = [];
      const checksumCounts = new Map<string, number>();
      let abbruch: string | null = null;
      if (bloecke.length > 1) await arbeitDienst.start(`${placeholders.length} Dateien in ${bloecke.length} Blöcken`);
      try {
        for (const [bi, block] of bloecke.entries()) {
          const bytes = block.reduce((n, item) => n + (item.file.size || 0), 0);
          const stand = await navigator.storage?.estimate?.().catch(() => null);
          const platz = speicherReicht(stand ?? null, bytes);
          if (!platz.ok) { abbruch = `Zu wenig freier Speicher für ${blockText(bi + 1, bloecke.length, block.length)}: ${mbBlock(platz.frei || 0)} frei, ${mbBlock(platz.noetig)} nötig. Bitte Platz schaffen (Papierkorb leeren, Sicherung auf eine Festplatte) und erneut prüfen.`; break; }
          if (bloecke.length > 1) { setNotice({ kind: "info", laeuft: true, text: `Eingang: ${blockText(bi + 1, bloecke.length, block.length)} wird gelesen …` }); await arbeitDienst.update(`${blockText(bi + 1, bloecke.length, block.length)}`, bi, bloecke.length); }
          const analyzedBlock: CentralIntakeAnalysis[] = [];
          for (const item of block) { const file = await eingangDatei(item); analyzedBlock.push(await analyzeCentralIntakeFile({ file, source: item.source, documents: [...localDocuments, ...documents], records: familyRecords, gelesenerText: await textEbene(file) })); }
          const grouped = groupCentralIntakeAnalyses(analyzedBlock);
          grouped.forEach((a) => checksumCounts.set(a.checksum, (checksumCounts.get(a.checksum) || 0) + 1));
          analyzedAll.push(...grouped);
          const saved = await setCentralIntakeQueue((current) => current.map((item) => {
            const position = block.findIndex((candidate) => candidate.id === item.id);
            if (position < 0 || item.status !== "Analyse läuft") return item;
            const analysis = grouped[position];
            const batchDuplicate = (checksumCounts.get(analysis.checksum) || 0) > 1;
            const fertig: CentralIntakeQueueItem = { ...item, analysis, status: batchDuplicate ? "Prüfung erforderlich" : initialCentralIntakeStatus(analysis), error: batchDuplicate ? "Mögliche Dublette innerhalb dieser Auswahl – bitte vergleichen." : null };
            // Sammelbestätigung: sichere Vorschläge stehen angehakt, unsichere abgewählt (2.28.39, Punkt 6).
            return { ...fertig, selected: sammelLage(fertig, aktuelleGrenze().bytes).sicher };
          }));
          if (!saved) return;
        }
      } finally { await arbeitDienst.stop(); }
      if (abbruch) {
        const offen = new Set(placeholders.slice(analyzedAll.length).map((item) => item.id));
        await setCentralIntakeQueue((current) => current.map((item) => offen.has(item.id) && item.status === "Analyse läuft" ? { ...item, status: "Prüfung erforderlich", error: abbruch } : item));
        offen.forEach((id) => intakeAnalyses.current.delete(id));
        setNotice({ kind: "error", text: abbruch });
        return;
      }
      const analyzed = analyzedAll;
      const reviewCount = analyzed.filter((analysis) => analysis.plan.requiresReview || analysis.plan.duplicateIds.length || (checksumCounts.get(analysis.checksum) || 0) > 1).length;
      setNotice({ kind: reviewCount ? "info" : "success", text: `${placeholders.length} Eingang${placeholders.length === 1 ? " wurde" : "sfälle wurden"} erkannt und in „Eingänge prüfen“ vorbereitet.${reviewCount ? ` ${reviewCount} erfordern eine Prüfung, beispielsweise wegen unklarer Zuordnung oder möglicher Dubletten.` : ""} Es wurde noch nichts übernommen.` });
    } catch (error) {
      await setCentralIntakeQueue((current) => current.map((item) => item.status === "Analyse läuft" && placeholders.some((candidate) => candidate.id === item.id) ? { ...item, status: "Prüfung erforderlich", error: error instanceof Error ? error.message : "Die Datei konnte nicht automatisch analysiert werden." } : item));
      setNotice({ kind: "error", text: "Mindestens ein Eingang konnte nicht vollständig analysiert werden. Die Originaldateien blieben unverändert." });
    } finally { setIntakeBusy(false); }
  };
  const queueCentralIntakeFiles = async (files: File[], source: DocumentIntakeSource, parentQueueId: string | null = null, stapelIds: string[] = []) => {
    if (!files.length) return false;
    const metadata = await uebergabeVorschlaege(files);
    // Stufe E: Dateien aus dem Eingangsordner bleiben dort und werden bei Bedarf gelesen – keine zweite Kopie im Arbeitsspeicher.
    const ordnerDatei = source === "local-inbox" ? (file: File) => file.name : () => null;
    const placeholders: CentralIntakeQueueItem[] = files.map((file) => ({ id: crypto.randomUUID(), file, source, status: "Analyse läuft", selected: false, addedAt: new Date().toISOString(), analysis: null, error: null, parentQueueId, ordnerDatei: ordnerDatei(file), uebergabeVorschlag: metadata.vorschlaege.get(file), uebergabeHinweis: metadata.hinweise.get(file) }));
    placeholders.forEach((item) => intakeAnalyses.current.add(item.id));
    // Erst die bestätigte Transaktion darf den Stapel freigeben; Analyse darf später fertig werden.
    if (!await setCentralIntakeQueue((current) => [...placeholders, ...current], stapelIds)) return false;
    void analyzeQueuedIntake(placeholders);
    return true;
  };
  const resumeIntake = useRef(analyzeQueuedIntake); resumeIntake.current = analyzeQueuedIntake;
  useEffect(() => {
    const pending = centralIntakeQueue.filter((item) => item.status === "Analyse läuft" && !intakeAnalyses.current.has(item.id));
    if (!pending.length) return;
    pending.forEach((item) => intakeAnalyses.current.add(item.id));
    void resumeIntake.current(pending);
  }, [centralIntakeQueue]);
  // Dateien aus der Hülle (Android „Teilen → Familienakte“, PWA share_target, Windows „Öffnen mit“): wie Dateiauswahl
  // in die Eingangszentrale, nichts wird ohne Bestätigung übernommen. Klebstoff: public/native/familienakte-app.js.
  const queueFromShell = useRef(queueCentralIntakeFiles); queueFromShell.current = queueCentralIntakeFiles;
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ files?: File[]; quelle?: DocumentIntakeSource; bestaetigen?: (ok: boolean) => void }>).detail;
      const files = detail?.files || [];
      if (demoActive() || !files.length) { detail?.bestaetigen?.(false); return; }
      go("inbox");
      void queueFromShell.current(files, detail?.quelle || "file-picker").then(
        (ok) => detail?.bestaetigen?.(ok),
        () => detail?.bestaetigen?.(false),
      );
    };
    window.addEventListener("familienakte:dateien", handler);
    window.dispatchEvent(new Event("familienakte:bereit"));
    return () => window.removeEventListener("familienakte:dateien", handler);
  }, []);
  const reviewCentralIntake = async (id: string, fristAngehakt = false) => {
    const item = centralIntakeQueue.find((candidate) => candidate.id === id);
    if (!item) return;
    try { beginLocalUpload(await eingangDatei(item), item.source, false, null, item.id, { fristAngehakt }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Arbeitsdatei konnte nicht geladen werden." }); }
  };
  const extractCentralEmailAttachments = async (id: string) => {
    const item = centralIntakeQueue.find((candidate) => candidate.id === id);
    if (!item) return;
    setIntakeBusy(true);
    try {
      const file = item.savedDocumentId && item.status === "Übernommen"
        ? await readLocalDocumentFile(vaultHandle!, item.savedDocumentId) : await eingangDatei(item);
      const attachments = await extractEmlAttachments(file);
      if (!attachments.length) setNotice({ kind: "error", text: "Die E-Mail nennt Anlagen, sie konnten aus dieser Exportdatei aber nicht automatisch herausgelöst werden. Die Original-E-Mail bleibt vollständig erhalten." });
      else await queueCentralIntakeFiles(attachments, item.source, item.id);
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die E-Mail-Anlagen konnten nicht gelesen werden." }); }
    finally { setIntakeBusy(false); }
  };
  const setCentralIntakeStatus = async (ids: string[], status: CentralIntakeStatus) => {
    if (!await setCentralIntakeQueue((current) => current.map((item) => ids.includes(item.id) ? { ...item, status, selected: false } : item))) return;
    reportActivity({ kind: "info", text: `${ids.length} Eingang${ids.length === 1 ? " wurde" : "sfälle wurden"} als „${status}“ vorgemerkt. Es wurde keine Datei gespeichert oder gelöscht.` });
  };
  // Sammelbestätigung (2.28.39, Punkt 6): angehakte Eingänge nacheinander ablegen – dieselben Felder wie im Prüfdialog.
  const sammelAblegen = async (ids: string[], fristIds: string[], fortschritt: (fertig: number) => void) => {
    if (!vaultHandle) { go("security"); return { abgelegt: 0, fehler: ["Bitte zuerst einen Speicherort verbinden."] }; }
    const fehler: string[] = []; const neu: LocalDocument[] = []; const gespeichertAls = new Map<string, string>();
    let abgelegt = 0; let fristen = 0;
    for (const id of ids) {
      const queued = centralIntakeQueue.find((entry) => entry.id === id);
      const name = queued?.analysis ? queued.analysis.title : queued?.file.name || id;
      if (!queued?.analysis || !sammelLage(queued, aktuelleGrenze().bytes).ablegbar) { fehler.push(`„${name}“: bitte einzeln prüfen (✎).`); continue; }
      try {
        const file = await eingangDatei(queued);
        const text = queued.analysis.contentHint?.trim() ? queued.analysis.contentHint : await dokumentTextLesen(file);
        const kopf = await briefkopfAusText(text);
        const daten = sammelDaten({ item: queued, text, briefTitel: kopf.titel, brief: kopf.brief, fristAnlegen: fristIds.includes(id), documents: [...localDocuments, ...neu, ...documents], records: familyRecords });
        const item = await saveLocalDocument(vaultHandle, file, { category: daten.category, documentDate: daten.documentDate, notes: eingangNotizen(queued, daten.notes), assignmentLinks: [], titel: daten.titel, textAuszug: daten.textAuszug, proUebergabe: queued.proUebergabe });
        neu.push(item); gespeichertAls.set(id, item.id);
        const elternId = queued.parentQueueId ? gespeichertAls.get(queued.parentQueueId) || centralIntakeQueue.find((entry) => entry.id === queued.parentQueueId)?.savedDocumentId : null;
        if (elternId) await linkLocalDocuments(vaultHandle, elternId, item.id, "enthält Anlage").catch(() => undefined);
        for (const kind of centralIntakeQueue.filter((entry) => entry.parentQueueId === id && entry.savedDocumentId)) await linkLocalDocuments(vaultHandle, item.id, kind.savedDocumentId!, "enthält Anlage").catch(() => undefined);
        for (const frist of daten.fristen) {
          try { await createLocalScheduleBundle(vaultHandle, { recordType: frist.recordType, title: frist.title, dueAt: frist.dueAt, reminderAt: null, source: `Eingang: ${dokumentTitel(item)}`, notes: null, references: [{ recordType: "document", id: item.id, relationType: "basiert auf" }] }); fristen++; }
          catch (reason) { fehler.push(`Frist zu „${dokumentTitel(item)}“ nicht angelegt: ${reason instanceof Error ? reason.message : "unbekannter Fehler"}`); }
        }
        if (!await setCentralIntakeQueue((current) => current.map((entry) => entry.id === id ? { ...entry, status: "Übernommen", selected: false, savedDocumentId: item.id, error: null } : entry))) fehler.push(`„${dokumentTitel(item)}“ ist abgelegt, der Arbeitsstand konnte noch nicht bestätigt werden.`);
        abgelegt++;
      } catch (reason) { fehler.push(`„${name}“: ${reason instanceof Error ? reason.message : "nicht abgelegt"}`); }
      fortschritt(abgelegt);
    }
    if (abgelegt) await refreshLocal(vaultHandle);
    setNotice({ kind: fehler.length ? (abgelegt ? "info" : "error") : "success", issue: "eingang-pruefung", text: `${abgelegt ? `Gespeichert ✓ ${abgelegt} ${abgelegt === 1 ? "Dokument liegt" : "Dokumente liegen"} im Datentresor.${fristen ? ` ${fristen} ${fristen === 1 ? "Frist wurde" : "Fristen wurden"} mit dem Dokument verknüpft angelegt.` : ""}` : "Nichts abgelegt."}${fehler.length ? ` ${fehler.length} nicht abgelegt – bitte einzeln prüfen.` : ""} Originaldateien wurden nicht verschoben oder gelöscht.` });
    return { abgelegt, fehler };
  };
  // „Löschen“ im Eingang (Punkt 6): nur noch nicht abgelegte Eingänge, nach Rückfrage, wirklich aus der Warteschlange.
  const eingaengeLoeschen = async (ids: string[]) => {
    const weg = centralIntakeQueue.filter((item) => ids.includes(item.id) && item.status !== "Übernommen");
    if (!weg.length) return false;
    const namen = weg.slice(0, 3).map((item) => `„${item.analysis?.title || item.file.name}“`).join(", ");
    if (!await askConfirm(`${weg.length} ${weg.length === 1 ? "Eingang" : "Eingänge"} aus der Warteschlange löschen?\n\n${namen}${weg.length > 3 ? " …" : ""}\n\nSie werden nicht abgelegt. Abgelegte Dokumente und Originaldateien im Eingangsordner bleiben unberührt.`)) return false;
    const wegIds = new Set(weg.map((item) => item.id));
    if (!await setCentralIntakeQueue((current) => current.filter((item) => !wegIds.has(item.id)))) return false;
    reportActivity({ kind: "success", text: `Gelöscht ✓ ${weg.length} ${weg.length === 1 ? "Eingang" : "Eingänge"} aus der Warteschlange entfernt.` });
    return true;
  };
  const toggleCentralIntake = (id: string) => setCentralIntakeQueue((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  // PDF-Raum: Bestandsdokumente kehren zum selben Eintrag zurück; neue/ungebundene Dateien gehen in den Eingang.
  const inWorkflowPdf = async (id: string) => {
    if (!vaultHandle) { go("security"); return; }
    const anfrage = ++wfpdfAnfrage.current;
    try {
      const original = localDocuments.find(d => d.id === id);
      if (!original || isSensitiveHealthText(original.originalName, original.category, original.notes)) throw new Error("Diese Unterlage wird im geschützten Ausfülldialog bearbeitet.");
      const arbeit = await beginLocalPdfEdit(vaultHandle, id);
      if (anfrage !== wfpdfAnfrage.current) return;
      setWfpdfSitzung({ quelle: arbeit.quelle, zurueck: active }); setWfpdfOeffnen([arbeit.file]); setWfpdfScan(false); setWfpdfStart((n) => n + 1); go("workflowpdf");
    }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Die Unterlage konnte nicht geöffnet werden." }); }
  };
  const dateiInWorkflowPdf = (datei: File) => { wfpdfAnfrage.current++; setWfpdfSitzung(null); setWfpdfOeffnen([datei]); setWfpdfScan(false); setWfpdfStart((n) => n + 1); go("workflowpdf"); };
  const inProTresor = async (id: string) => {
    if (!vaultHandle) return;
    try {
      const stand = await proTresor.zustand();
      if (stand.status !== "offen" || !stand.id) { go("security"); setNotice({ kind: "info", issue: "pro-tresor-anschluss", text: "Bitte zuerst den gewünschten Pro-Tresor verbinden und entsperren. Danach die einzelne Unterlage erneut wählen." }); return; }
      await copyLocalDocumentToPro(vaultHandle, id, stand.id); await refreshLocal(vaultHandle);
      setNotice({ kind: "success", issue: "pro-tresor-anschluss", text: "Das ausgewählte Original liegt geprüft im Pro-Tresor. Der bisherige Bestand wurde beibehalten." });
    } catch (e) { setNotice({ kind: "error", text: e instanceof Error ? e.message : "Das Original wurde nicht übernommen; die Quelle bleibt erhalten." }); }
  };
  const anProApp = async (id: string, ziel: ProZiel) => {
    if (!vaultHandle) return;
    try {
      const document = localDocuments.find(d => d.id === id);
      if (!document) throw new Error("Die ausgewählte Unterlage ist nicht mehr im geöffneten Bestand.");
      const stored = await readLocalDocumentFile(vaultHandle, id);
      const file = new File([stored], document.originalName, { type: document.mimeType || stored.type, lastModified: stored.lastModified });
      const r = await proDateiWeitergeben(file, id, ziel, document.proUebergabe?.id || document.proBezug);
      setNotice({ kind: "success", text: r.stand === "im-eingang" ? `${PRO_ZIELE[ziel]} hat diese Fassung bereits im Eingang bestätigt. Die Quelle bleibt erhalten.` : `An ${PRO_ZIELE[ziel]} weitergegeben. Die Zielbestätigung ist noch offen; die Quelle bleibt erhalten. Im Sicherheitscenter kannst du die Bestätigung prüfen.` });
    } catch (e) { setNotice({ kind: "error", text: proVerbundFehler(e) }); }
  };
  const ausWorkflowPdf = async ({ quelle, dateien, vertraege, bearbeitung }: WfpdfAblage) => {
    if (bearbeitung) {
      const sitzung = wfpdfSitzung;
      if (!vaultHandle || !sitzung || sitzung.quelle.sitzung !== bearbeitung || dateien.length !== 1) throw new Error("Die Rückgabe ist nicht an das geöffnete Dokument gebunden.");
      const r = await saveLocalPdfEdit(vaultHandle, sitzung.quelle, dateien[0]);
      await refreshLocal(vaultHandle);
      setWfpdfSitzung(aktuell => aktuell?.quelle.sitzung === bearbeitung ? { ...aktuell, quelle: r.quelle } : aktuell);
      setNotice({ kind: "success", text: `Die PDF wurde im selben Dokument in der Akte gespeichert.${r.aufraeumenOffen ? " Eine alte Arbeitsdatei wird beim nächsten Öffnen erneut bereinigt." : ""}` });
      return r;
    }
    if (wfpdfSitzung) throw new Error("Der Bearbeitungsraum darf keinen neuen Eingang statt einer Rückgabe erzeugen.");
    const quittungen = [];
    for (const [i, file] of dateien.entries()) quittungen.push(await proUebergabeAnnehmen(vertraege[i], file));
    if (!await setCentralIntakeQueue(current => current)) throw new Error("Eingang gespeichert, Anzeige konnte nicht neu geladen werden. Erneutes Senden bleibt möglich.");
    if (quelle === "scan" && dateien.length === 1) beginLocalUpload(dateien[0], "camera-scan", scanZurueck.current === "overview", null, quittungen[0].eingangId, { zurueck: scanZurueck.current });
    else setNotice({ kind: "success", text: `${dateien.length} Datei${dateien.length === 1 ? "" : "en"} aus Workflow PDF liegen in der Eingangszentrale zur Prüfung.` });
    return quittungen;
  };
  const openDocumentScan = (files: File[]) => {
    wfpdfAnfrage.current++; setWfpdfSitzung(null);
    if (!vaultHandle) { setActionState("upload", "failed"); go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-Ordner oder einen PC-/USB-Tresor verbinden. Erst danach wird die Kamera geöffnet." }); return; }
    // Klaus 2026-10-31: „überall der volle Scanner“ — ohne mitgebrachte Fotos öffnet „Dokument fotografieren“ den Scanner von
    // Workflow PDF (Ecken ziehen, gerade richten, Filter, Texterkennung); das fertige PDF geht in den Dokumenteneingang.
    // Seit 2.28.10 (Klaus 2026-11-01: „‚Dokument fotografieren‘ öffnet den Klon“): die ganze App Workflow PDF mit dem Scanner;
    // „PDF erstellen“ legt den Scan im Klon ab UND gibt ihn gleich an die Prüfung der Akte (Brücke, quelle „scan“).
    if (!files.length && !wfpdfAlt()) { scanZurueck.current = active === "workflowpdf" ? scanZurueck.current : active; setScanRueckweg(scanZurueck.current); setWfpdfOeffnen(null); setWfpdfScan(true); setWfpdfStart((n) => n + 1); setActionState("upload", "pending"); go("workflowpdf"); return; }
    if (!files.length) { void (async () => {
      try {
        const { scannen } = await import("./wfpdf-kern");
        setActionState("upload", "pending");
        await scannen({ titel: "Dokument scannen", fertigText: "Weiter zur Prüfung", name: `Dokumentscan ${new Date().toISOString().slice(0, 10)}`, fertig: (file) => { beginLocalUpload(file, "camera-scan", true); } });
      } catch (reason) { setActionState("upload", "failed"); setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Scanner konnte nicht geöffnet werden." }); }
    })(); return; }
    setScanInitialFiles(files); setScanQueueIds(centralIntakeQueue.filter((item) => files.some((file) => file === item.file)).map((item) => item.id)); setScanOpen(true); setActionState("upload", "pending");
    reportActivity({ kind: "info", text: `Dokumentfotografie geöffnet · ${files.length} Aufnahme${files.length === 1 ? "" : "n"} zur Prüfung vorbereitet. Es wurde noch nichts gespeichert.` });
  };
  // Stufe E: der Eingangsordner wird in Blöcken zu 20 geholt; was schon einmal geholt wurde, merkt sich das Gerät (auch Verworfenes
  // kommt nicht wieder). Läuft von Hand („Jetzt prüfen“) und von selbst (beim Start, beim Zurückkehren, alle 60 Sekunden).
  const GESEHEN_SCHLUESSEL = "familienakte-eingangsordner-gesehen-v1";
  const gesehenLesen = (): string[] => { try { const v = JSON.parse(workspaceStorage.getItem(GESEHEN_SCHLUESSEL) || "[]"); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };
  const scanSelectedInbox = async (handle = inboxFolderHandle, leise = false) => {
    if (!handle) return;
    setIntakeBusy(true);
    try {
      const found = await scanLocalInbox(handle, localDocuments); setIncomingFiles(found); setIntakeCheckedAt(new Date().toISOString());
      const gesehen = gesehenLesen();
      const inWarteschlange = new Set(centralIntakeQueue.map((queued) => dateiSchluessel(queued.file)));
      const fresh = neueImOrdner(found, new Set(gesehen), inWarteschlange, BLOCK);
      const weitere = found.filter((f) => !gesehen.includes(dateiSchluessel(f)) && !inWarteschlange.has(dateiSchluessel(f))).length - fresh.length;
      if (fresh.length) {
        try { workspaceStorage.setItem(GESEHEN_SCHLUESSEL, JSON.stringify(gesehenMerken(gesehen, fresh.map(dateiSchluessel)))); } catch { /* dann beim nächsten Mal erneut angeboten */ }
        await queueCentralIntakeFiles(fresh.map((item) => item.file), "local-inbox");
      }
      if (!leise || fresh.length) setNotice({ kind: "info", text: fresh.length ? `${fresh.length} Datei${fresh.length === 1 ? "" : "en"} aus dem Eingangsordner „${handle.name}“ in die Eingangszentrale geholt${weitere > 0 ? `; ${weitere} weitere folgen Block für Block` : ""}.` : "Im Eingangsordner wurden keine neuen Dateien gefunden." });
    } catch (error) { if (!leise) setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Eingangsordner konnte nicht geprüft werden." }); }
    finally { setIntakeBusy(false); }
  };
  // Von selbst: solange die App offen ist (Android mit Dauer-Meldung während eines Blocks), nie zwei Läufe zugleich.
  const scanRef = useRef(scanSelectedInbox); scanRef.current = scanSelectedInbox;
  const intakeBusyRef = useRef(intakeBusy); intakeBusyRef.current = intakeBusy;
  const inboxBusyRef = useRef(false);
  useEffect(() => {
    if (!inboxFolderHandle || demoActive()) return;
    eingangOrdnerLeserSetzen((name) => dateiAusEingangsordner(inboxFolderHandle, name));
    // Nur Takt, Sichtbarkeit und ausdrücklicher Anstoß – nicht jede Zustandsänderung, sonst liefe die Prüfung in einer Schleife.
    const lauf = async () => { if (inboxBusyRef.current || intakeBusyRef.current || document.visibilityState !== "visible") return; inboxBusyRef.current = true; try { await scanRef.current(inboxFolderHandle, true); } finally { inboxBusyRef.current = false; } };
    const takt = window.setInterval(() => void lauf(), 60000);
    const sichtbar = () => { if (document.visibilityState === "visible") void lauf(); };
    document.addEventListener("visibilitychange", sichtbar);
    window.addEventListener("familienakte:eingangsordner-pruefen", sichtbar);
    return () => { window.clearInterval(takt); document.removeEventListener("visibilitychange", sichtbar); window.removeEventListener("familienakte:eingangsordner-pruefen", sichtbar); eingangOrdnerLeserSetzen(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxFolderHandle]);
  const selectInboxFolder = async () => {
    setIntakeBusy(true);
    try { const handle = await chooseInboxFolder(); setInboxFolderHandle(handle); setInboxFolderName(handle.name); setIntakeBusy(false); await scanSelectedInbox(handle); }
    catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Eingangsordner konnte nicht ausgewählt werden." }); }
    finally { setIntakeBusy(false); }
  };
  const checkOneDriveInbox = async () => {
    if (!oneDriveHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-Familienordner im Sicherheitscenter verbinden." }); return; }
    setIntakeBusy(true);
    try { const found = await scanOneDriveInbox(oneDriveHandle, localDocuments); setIncomingFiles(found); setIntakeCheckedAt(new Date().toISOString()); const fresh = found.filter((candidate) => !centralIntakeQueue.some((queued) => queued.file.name === candidate.name && queued.file.size === candidate.size && queued.file.lastModified === candidate.lastModified)); if (fresh.length) await queueCentralIntakeFiles(fresh.map((item) => item.file), "onedrive-inbox"); setNotice({ kind: "info", text: found.length ? `${found.length} neue oder geänderte OneDrive-Datei${found.length === 1 ? " wurde" : "en wurden"} gefunden. ${fresh.length} davon wurden in der Warteschlange vorbereitet.` : "Im freigegebenen OneDrive-Posteingang wurden keine neuen Dateien gefunden." }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der OneDrive-Familienordner konnte nicht geprüft werden." }); }
    finally { setIntakeBusy(false); }
  };
  const migrateOnline = async () => {
    if (!vaultHandle) return;
    setVaultBusy(true);
    try {
      // Es gibt keinen Online-Bestand mehr; die Sicherung bleibt als Weg erhalten und meldet ehrlich den Stand.
      await refreshLocal(vaultHandle);
      setNotice({ kind: "success", text: "Der Online-Bestand war bereits lokal gesichert." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die lokale Sicherung ist fehlgeschlagen." }); }
    finally { setVaultBusy(false); }
  };
  const checkBackupSync = async () => {
    if (!oneDriveHandle || !localVaultHandle) return;
    setVaultBusy(true); setSyncResult(null);
    try {
      const preview = await compareVaults(oneDriveHandle, localVaultHandle); setSyncPreview(preview);
      setNotice({ kind: "info", text: preview.missingDocuments ? `${preview.missingDocuments} Datei${preview.missingDocuments === 1 ? " fehlt" : "en fehlen"} noch in der PC-/USB-Sicherung. Es wurde noch nichts kopiert.` : "Der PC-/USB-Tresor enthält bereits alle registrierten OneDrive-Dokumente." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Sicherungsabgleich konnte nicht geprüft werden." }); }
    finally { setVaultBusy(false); }
  };
  const runBackupSync = async () => {
    if (!oneDriveHandle || !localVaultHandle || !syncPreview) return;
    setVaultBusy(true);
    try {
      const result = await copyMissingDocuments(oneDriveHandle, localVaultHandle); setSyncResult(result); setSyncPreview(null);
      setLocalVaultSummary(await getVaultSummary(localVaultHandle));
      setNotice({ kind: "success", text: result.copiedDocuments ? `${result.copiedDocuments} Datei${result.copiedDocuments === 1 ? " wurde" : "en wurden"} von OneDrive in den PC-/USB-Tresor kopiert. Es wurde nichts gelöscht oder überschrieben.` : "Die PC-/USB-Sicherung war bereits vollständig." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Sicherung konnte nicht abgeschlossen werden." }); }
    finally { setVaultBusy(false); }
  };
  const runFullBackup = () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den führenden lokalen Familienakten-Tresor verbinden." }); return; }
    setSicherungWahl(true);
  };
  // Stufe B: verschlüsselt (Passwort) oder lesbar (null, bewusst gewählt).
  const runFullBackupMit = async (passwort: string | null) => {
    setSicherungWahl(false);
    if (!vaultHandle) return;
    setVaultBusy(true);
    try {
      const destination = await chooseExportDestination("Ordner für die Vollsicherung wählen (getrennt vom Pro-Tresor)");
      setNotice({ kind: "info", laeuft: true, text: passwort ? "Sicherung läuft: jede Datei wird verschlüsselt, zurückgelesen und per Prüfsumme bestätigt." : "Sicherung läuft: jede Datei wird kopiert und per Prüfsumme bestätigt." });
      // Bsp. (Klaus 11.11.): nicht mitsichern – die Vorlage steckt in der App.
      // Besteht die Akte nur aus Bsp., wird sie normal gesichert – sonst wäre die Sicherung leer.
      const bestand = samplePresent ? await readLocalVaultData(vaultHandle) : null;
      const bspIdsSicherung = bestand ? beispielIdsVon(bestand) : null;
      const eigeneDa = Boolean(bestand && bspIdsSicherung && [...bestand.documents, ...bestand.records].some((x) => !bspIdsSicherung.has(x.id)));
      const ohne = eigeneDa ? bspIdsSicherung! : undefined;
      const result = await writeFullFamilyBackup({ destination, source: vaultHandle, appVersion: APP_VERSION, passwort, ohne });
      // Frage s: Programm dazu, getrennt von den Daten. Android legt die eigene APK bei, Windows einen Lies-mich mit Download und SHA-256.
      let programm = "";
      try { programm = await programmBeilegen(destination, result.folderName, APP_FASSUNG); }
      catch (error) { programm = ` Das Programm konnte nicht beigelegt werden (${error instanceof Error ? error.message : "unbekannt"}).`; }
      await refreshLocal();
      setNotice({ kind: "success", text: `Die vollständige Familienakten-Sicherung „${result.folderName}“ wurde ${passwort ? "verschlüsselt " : ""}mit Register, Verknüpfungen, Tagebuch-Einträge, Medien und Prüfsummen erstellt.${result.ausgelassen ? " Bsp. nicht mitgesichert." : ""}${programm}${passwort ? "" : " Für die endgültige Bestätigung folgt die Wiederherstellung in einem leeren Testordner."}` });
      if (result.notfall) setNotfallblatt({ notfall: result.notfall, ordner: result.folderName, erstellt: result.manifest.createdAt });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: `Vollsicherung nicht erstellt: ${error instanceof Error ? ordnerFehlerText(error) : "unbekannter Fehler."}` }); else setNotice(null); }
    finally { setVaultBusy(false); }
  };
  // P6: Sicherung einlesen – Probe ohne Schreiben; leere Akte ganz, volle Akte zusammengeführt (Stufe A).
  const runEinlesenProbe = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den führenden lokalen Familienakten-Tresor verbinden." }); return; }
    setVaultBusy(true);
    try {
      const gewaehlt = await chooseExportDestination("Vollsicherung zum Einlesen wählen");
      const art = await sicherungArt(gewaehlt);
      if (art.verschluesselt) { setPasswortDialog({ gewaehlt, name: art.name, fehler: "", laeuft: false }); return; }
      setNotice({ kind: "info", laeuft: true, text: "Probe läuft: Register und jede Datei werden per Prüfsumme gelesen. Es wird nichts geschrieben." });
      setEinlesen({ gewaehlt, probe: await sicherungProben(gewaehlt, vaultHandle) });
      setNotice(null);
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Sicherung konnte nicht geprüft werden." }); }
    finally { setVaultBusy(false); }
  };
  // Stufe B: verschlüsselte Sicherung – Passwort oder Notfallschlüssel, dann die Probe wie sonst.
  const runEinlesenZugang = async (zugang: SicherungsZugang) => {
    if (!vaultHandle || !passwortDialog) return;
    setPasswortDialog({ ...passwortDialog, laeuft: true, fehler: "" });
    try {
      const probe = await sicherungProben(passwortDialog.gewaehlt, vaultHandle, zugang);
      setEinlesen({ gewaehlt: passwortDialog.gewaehlt, probe, zugang }); setPasswortDialog(null);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      setPasswortDialog({ ...passwortDialog, laeuft: false, fehler: text === "PASSWORT_FALSCH" ? (zugang.notfall ? "Der Notfallschlüssel passt nicht zu dieser Sicherung." : "Das Passwort ist falsch.") : text || "Die Sicherung konnte nicht geöffnet werden." });
    }
  };
  const runEinlesen = async (wahl: Record<string, "hier" | "dort">) => {
    if (!vaultHandle || !einlesen) return;
    const r = await sicherungEinlesen(einlesen.gewaehlt, vaultHandle, wahl, einlesen.probe.zusammen?.revision, einlesen.zugang);
    setEinlesen(null); await refreshLocal();
    const z = r.zusammengefuehrt;
    setNotice({ kind: "success", text: z
      ? `Sicherung „${r.ordner}“ zusammengeführt: ${z.neu} neu${z.uebernommen ? `, ${z.uebernommen} übernommen` : ""}${z.konflikteDort ? `, ${z.konflikteDort} Fassungen aus der Sicherung gewählt` : ""}; ${r.kopiert} Dateien kopiert und per Prüfsumme bestätigt. Nichts wurde gelöscht.${r.warnungen.length ? ` ${r.warnungen.length} Hinweise: ${r.warnungen.slice(0, 2).join(" · ")}` : ""}`
      : `Sicherung „${r.ordner}“ eingelesen: ${r.kopiert} Dateien per Prüfsumme bestätigt, ${r.zaehlung.documents} Dokumente und ${r.zaehlung.records} Einträge übernommen.` });
  };
  // P7: Übernehmen der Demo-Kopie – in der eigenen Akte, mit der Liste „Was ändert sich?“ vorher (Frage g).
  useEffect(() => {
    if (demoActive() || !vaultHandle) return;
    let merker = null; try { merker = sessionStorage.getItem(DEMO_UEBERNAHME_MERKER); sessionStorage.removeItem(DEMO_UEBERNAHME_MERKER); } catch { /* ohne Merker nichts */ }
    if (!merker) return;
    demoUebernahmePlan(vaultHandle, demoQuelleLesen(localStorage)).then(setDemoPlan).catch((error) => setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Demo lässt sich nicht übernehmen." }));
  }, [vaultHandle]);
  const runDemoUebernehmen = async () => {
    if (!vaultHandle) return;
    const r = await demoUebernehmen(vaultHandle, demoQuelleLesen(localStorage));
    setDemoPlan(null); await refreshLocal();
    setNotice({ kind: "success", text: `Demo übernommen: ${r.neu} neu, ${r.geaendert} geändert, ${r.entfernt} entfernt${r.neueDateien ? `, ${r.neueDateien} neue Dateien` : ""}. Das vorige Register liegt in der Registersicherung; keine Originaldatei wurde gelöscht.${r.kalender ? ` ${r.kalender} Kalender-Einträge werden beim nächsten Abgleich angepasst.` : ""}` });
  };
  const runRestoreTest = async () => {
    setVaultBusy(true);
    try {
      const backup = await chooseExportDestination("Vorhandene Vollsicherung wählen");
      const emptyTarget = await chooseExportDestination("Leeren Testordner wählen");
      const result = await restoreFullFamilyBackup({ backup, emptyTarget });
      setNotice({ kind: "success", text: `Die Sicherung wurde in „${result.folderName}“ vollständig wiederhergestellt und per Register- und Dateiprüfsummen bestätigt.` });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Wiederherstellungstest konnte nicht abgeschlossen werden." }); }
    finally { setVaultBusy(false); }
  };

  const selectInventorySource = async () => {
    try {
      const handle = await chooseInventorySourceFolder();
      setInventorySourceHandle(handle); setInventoryProgress(null); setInventoryLastRun(null); setInventoryArchiveResult(null);
      setNotice({ kind: "success", text: `Nur der Ordner „${handle.name}“ wurde als Analysequelle freigegeben. Es wurde noch keine Datei übernommen.` });
      return handle;
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Bestandsordner konnte nicht ausgewählt werden." }); return undefined; }
  };
  const selectInventoryArchive = async () => {
    try {
      const handle = await chooseInventoryArchiveFolder();
      setInventoryArchiveHandle(handle); setInventoryArchiveResult(null);
      setNotice({ kind: "success", text: `Der Ordner „${handle.name}“ ist als Archivdatenträger verbunden. Es wurde noch nichts kopiert.` });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Archivdatenträger konnte nicht ausgewählt werden." }); }
  };
  const scanInventorySource = async (source: FileSystemDirectoryHandle) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den führenden lokalen Familienakten-Tresor verbinden." }); return; }
    inventoryPauseRequested.current = false; setInventoryBusy(true); setInventoryArchiveResult(null);
    try {
      const result = await scanInventoryFolder({ source, register: vaultHandle, onProgress: setInventoryProgress, shouldPause: () => inventoryPauseRequested.current, sourceKind: /onedrive/i.test(source.name) ? "onedrive" : "local" });
      setInventoryLastRun(result);
      await refreshLocal(vaultHandle);
      reportActivity(inventoryScanFeedback(result));
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Bestand konnte nicht analysiert werden." }); }
    finally { setInventoryBusy(false); }
  };
  const runInventoryScan = async () => {
    if (!inventorySourceHandle) { setNotice({ kind: "error", text: "Bitte zuerst den vorbereiteten Pilotordner auswählen." }); return; }
    await scanInventorySource(inventorySourceHandle);
  };
  // Prüft den verbundenen Datentresor SELBST (nur lesend): Register lesbar, jede registrierte Originaldatei vorhanden
  // und unverändert. Früher wurde der Tresor zugleich als Analysequelle und Register an die Bestandsanalyse gegeben –
  // deren Selbstanalyse-Schutz lehnte das jedes Mal ab. Getrennte Ordner prüft weiterhin „Bestand prüfen“.
  const startVaultInventoryComparison = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst einen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    const name = vaultHandle.name || "Browser-Datentresor";
    setVaultBusy(true);
    try {
      const r = await checkVaultHoldings(vaultHandle);
      if (r.registerState === "corrupted") { setNotice({ kind: "error", text: `Prüfung fehlgeschlagen: Die Registerdatei im Datentresor „${name}“ ist beschädigt oder nicht lesbar. Es wurde nichts verändert; bitte eine geprüfte Sicherung verwenden.` }); return; }
      const beispiele = (namen: string[]) => namen.slice(0, 3).map((n) => `„${n}“`).join(", ") + (namen.length > 3 ? ` und ${namen.length - 3} weitere` : "");
      const teile = [
        r.missing.length ? `${r.missing.length} fehlen oder sind nicht lesbar (${beispiele(r.missing)})` : "",
        r.changed.length ? `${r.changed.length} weichen vom Register ab (${beispiele(r.changed)})` : "",
      ].filter(Boolean);
      const pro = r.proNotCheckable ? ` ${r.proNotCheckable} Original${r.proNotCheckable === 1 ? " liegt" : "e liegen"} im Pro-Tresor, der gerade nicht verbunden oder gesperrt ist – nach dem Entsperren erneut prüfen.` : "";
      const integritaet = r.integrityLevel !== "green" && r.integrityIssues.length ? ` Hinweise im Register: ${r.integrityIssues.length}.` : "";
      const geprueft = `${r.confirmed} von ${r.documentCount} Original${r.documentCount === 1 ? "" : "en"} vorhanden und unverändert`;
      if (teile.length) setNotice({ kind: "error", text: `Prüfung des Datentresors „${name}“: ${geprueft}; ${teile.join("; ")}.${pro}${integritaet} Es wurde nichts verändert oder gelöscht.` });
      else setNotice({ kind: r.proNotCheckable ? "info" : "success", text: `Prüfung abgeschlossen: Datentresor „${name}“ – Register lesbar, ${geprueft}.${pro}${integritaet} Es wurde nichts verändert. Einen getrennten Ordner (z. B. einen alten Dokumentenordner) prüfst du am PC unter Dokumente → Bestand prüfen.` });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Datentresor konnte nicht geprüft werden." }); }
    finally { setVaultBusy(false); }
  };
  const pauseInventoryScan = () => {
    inventoryPauseRequested.current = true;
    setInventoryProgress((current) => current ? { ...current, currentName: "Analyse wird sicher pausiert …", phase: "pausiert" } : current);
    reportActivity({ kind: "info", text: "Pause angefordert. Die laufende Datei wird zuerst abgeschlossen; der gespeicherte Pausenstand folgt danach." });
  };
  const runInventoryArchive = async (ids: string[]) => {
    if (!vaultHandle || !inventorySourceHandle || !inventoryArchiveHandle) { setNotice({ kind: "error", text: `Archivierung nicht ausgeführt · nicht verbunden: ${[!vaultHandle && "Familienakten-Tresor", !inventorySourceHandle && "Analysequelle", !inventoryArchiveHandle && "Archivdatenträger"].filter(Boolean).join(", ")}.` }); return; }
    if (!ids.length) { setNotice({ kind: "error", text: "Bitte zuerst mindestens eine noch nicht archivierte Datei über das kleine Auswahlkästchen markieren. Dubletten und Dateien mit geringer Relevanz werden nicht versehentlich archiviert." }); return; }
    if (!await askConfirm(`${ids.length} ausgewählte Datei${ids.length === 1 ? "" : "en"} als geprüfte Kopie archivieren? Die Originale bleiben unverändert.`)) return;
    setInventoryBusy(true);
    try {
      const result = await archiveInventoryItems({ register: vaultHandle, source: inventorySourceHandle, archive: inventoryArchiveHandle, itemIds: ids, onProgress: setInventoryProgress });
      setInventoryArchiveResult(result); await refreshLocal(vaultHandle);
      reportActivity(inventoryArchiveFeedback(result));
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Archivierung konnte nicht abgeschlossen werden." }); }
    finally { setInventoryBusy(false); }
  };
  const runInventoryRelease = async (ids: string[]) => {
    if (!vaultHandle || !inventoryArchiveHandle) { setNotice({ kind: "error", text: `Assistenzfreigabe nicht ausgeführt · nicht verbunden: ${[!vaultHandle && "Familienakten-Tresor", !inventoryArchiveHandle && "Archivdatenträger"].filter(Boolean).join(", ")}.` }); return; }
    if (!ids.length || !await askConfirm(`${ids.length} archivierte Datei${ids.length === 1 ? "" : "en"} für Bibliothek, Suche und Familienassistent freigeben?`)) return;
    setInventoryBusy(true);
    try {
      const result = await releaseInventoryItemsForAssistant({ register: vaultHandle, archive: inventoryArchiveHandle, itemIds: ids });
      await refreshLocal(vaultHandle);
      reportActivity(inventoryReleaseFeedback(result));
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Assistenzfreigabe konnte nicht gespeichert werden." }); }
    finally { setInventoryBusy(false); }
  };
  const runInventoryReset = async (ids: string[]) => {
    if (!vaultHandle || !inventoryArchiveHandle) { setNotice({ kind: "error", text: "Bitte Familienakten-Tresor und Testarchiv verbinden." }); return; }
    if (!ids.length) { setNotice({ kind: "error", text: "Bitte zuerst mindestens eine archivierte oder assistenzfreigegebene Testdatei markieren." }); return; }
    if (!await askConfirm(`${ids.length} markierte Testdatei${ids.length === 1 ? "" : "en"} auf „Quelle analysiert“ zurücksetzen? Die zugehörigen Testarchiv-Kopien und Assistenzfreigaben werden entfernt. Originaldateien bleiben unverändert.`)) return;
    setInventoryBusy(true);
    try {
      const result = await resetInventoryItemsForRetest({ register: vaultHandle, archive: inventoryArchiveHandle, itemIds: ids });
      setInventoryArchiveResult(null);
      await refreshLocal(vaultHandle);
      setNotice({ kind: "success", text: `${result.reset} Testdatei${result.reset === 1 ? " wurde" : "en wurden"} auf „Quelle analysiert“ zurückgesetzt. ${result.archiveCopiesRemoved} Testarchiv-Kopie${result.archiveCopiesRemoved === 1 ? " wurde" : "n wurden"} entfernt; Originaldateien blieben unverändert.` });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Testauswahl konnte nicht zurückgesetzt werden." }); }
    finally { setInventoryBusy(false); }
  };
  const confirmInventoryLearningAssignment = async (itemId: string, canonicalLifeArea: string, personalLifeArea: string, documentType: string, keywords: string[], referenceChoices: InventoryReferenceChoice[]) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den Familienakten-Tresor verbinden." }); return; }
    setInventoryBusy(true);
    try {
      const result = await confirmInventoryAssignment({ register: vaultHandle, itemId, canonicalLifeArea, personalLifeArea, documentType, keywords, referenceChoices });
      await refreshLocal(vaultHandle);
      reportActivity(inventoryAssignmentFeedback(result));
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die bestätigte Zuordnung konnte nicht gespeichert werden." }); }
    finally { setInventoryBusy(false); }
  };

  const filteredDiagnoses = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("de");
    if (!q) return healthData.currentDiagnoses;
    return healthData.currentDiagnoses.filter((item) =>
      [item.area, item.codes, item.diagnosis, item.evidence, item.status].join(" ").toLocaleLowerCase("de").includes(q),
    );
  }, [query]);

  // Feste Beispielangaben (health-data.json) nur in der Demo bzw. solange die Beispielfamilie im Bestand ist.
  const searchBeispiele = demoActive() || samplePresent;
  // Bsp. (Klaus 11.11.): Kennungen für das rote Dreieck; in der Demo nicht nötig, dort ist alles Beispiel.
  const bspIds = useMemo<ReadonlySet<string>>(() => demoActive() || !samplePresent ? new Set() : new Set([...beispielIdsVon({ documents: localDocuments, records: familyRecords, relations: familyRelations }), ...documents.map((d) => d.id)]),
    [samplePresent, localDocuments, familyRecords, familyRelations, documents]);
  const searchResults = useMemo(() => buildSearchResults(query, documents, aktenDokumente, familyRecords, familyRelations, { beispiele: searchBeispiele }), [query, documents, aktenDokumente, familyRecords, familyRelations, searchBeispiele]);
  const searchInterpretation = useMemo(() => interpretFamilySearchQuery(query), [query]);

  const loadDocuments = async () => { setLoadingDocs(false); };
  useEffect(() => { setLoadingDocs(false); }, []);

  const changeStatus = async (id: string, status: UploadedDocument["status"]) => {
    void id; void status;
    throw new Error("Unterlagen werden im Datentresor bearbeitet. Ein Online-Speicher wird nicht verwendet.");
  };
  const startComparison = async () => {
    const pending = documents.filter((item) => item.status === "hochgeladen");
    if (!pending.length) {
      setActionState("compare", "failed");
      go("inbox");
      setNotice({ kind: "info", text: documents.length ? "Es gibt derzeit keine neu hochgeladene Unterlage. Offene Abgleiche findest du im Dokumenteneingang." : "Bitte lade zuerst eine neue Unterlage hoch." });
      if (!documents.length) setUploadOpen(true);
      return;
    }
    setBusy(true);
    try {
      await Promise.all(pending.map((item) => changeStatus(item.id, "abgleich_offen")));
      await loadDocuments(); go("inbox");
      setActionState("compare", "success");
      setNotice({ kind: "success", text: `${pending.length} Unterlage${pending.length === 1 ? " wurde" : "n wurden"} für den gemeinsamen Abgleich vorgemerkt. Medizinische Inhalte sind dadurch noch nicht bewertet.` });
    } catch (error) { setActionState("compare", "failed"); setNotice({ kind: "error", text: error instanceof Error ? error.message : "Abgleich konnte nicht vorgemerkt werden." }); }
    finally { setBusy(false); }
  };
  const finalizeUpdate = async () => {
    const reviewed = documents.filter((item) => item.status === "geprüft");
    go("inbox");
    if (!reviewed.length) {
      setActionState("update", "failed");
      setNotice({ kind: "info", text: "Eine Unterlage kann erst übernommen werden, nachdem der inhaltliche Abgleich abgeschlossen und als geprüft bestätigt wurde." });
      return;
    }
    setBusy(true);
    try {
      await Promise.all(reviewed.map((item) => changeStatus(item.id, "eingearbeitet")));
      await loadDocuments();
      setActionState("update", "success");
      setNotice({ kind: "success", text: `${reviewed.length} geprüfte Unterlage${reviewed.length === 1 ? " wurde" : "n wurden"} als eingearbeitet gekennzeichnet.` });
    } catch (error) { setActionState("update", "failed"); setNotice({ kind: "error", text: error instanceof Error ? error.message : "Aktualisierung konnte nicht gespeichert werden." }); }
    finally { setBusy(false); }
  };
  // Namen, die vor dem KI-Auftrag unkenntlich werden: Personen, Firmen, Objekte, Vertragsnummern und Empfänger der Akte.
  const kiNamen = useMemo(() => familyRecords.flatMap((r) => { const d = (r as unknown as { data?: Record<string, unknown> }).data || {}; return ["displayName", "name", "contractNumber", "recipient", "recipientEmail"].map((k) => d[k]).filter((v): v is string => typeof v === "string" && v.trim().length >= 3); }), [familyRecords]);
  const openChatGPTEdit = (initialRequest = "") => { setActionState("chatgpt", "pending"); setEditInitialRequest(initialRequest); setEditOpen(true); };
  const openDocumentLibrary = (request: Partial<Omit<DocumentLibraryRequest, "key">> = {}) => {
    navigation.navigate("documents", request.focusId || null, { area: request.area || "", query: request.query || "" });
    setMobileOpen(false); setMegaOpen(null);
  };
  const ensureMemoryVault = () => {
    if (vaultHandle) return true;
    go("security");
    setNotice({ kind: "info", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden. Erinnerungen und Medien bleiben dort lokal." });
    return false;
  };
  const queueMemoryDraft = async (draft: MemoryDraft) => {
    if (!ensureMemoryVault() || !vaultHandle) return null;
    try {
      const saved = await createOrUpdateLocalMemoryDraft(vaultHandle, { draftId: draft.draftId, originalText: draft.text, originalTranscript: draft.originalTranscript || (draft.captureType === "sprache" || draft.captureType === "kombination" ? draft.text : undefined), captureType: draft.captureType, mediaFiles: draft.files, stimmung: draft.stimmung, verknuepft: draft.verknuepft, suggestedCaseId: draft.suggestedCaseId || memorySuggestedCaseId || undefined });
      setMemorySuggestedCaseId(null);
      setMemoryEditDraft(null);
      await refreshLocal(vaultHandle);
      setNotice({ kind: "success", text: "Zur Seite gelegt: Der Eintrag wartet unter „Noch zu prüfende Tagebuch-Einträge“." });
      return saved;
    } catch (reason) {
      setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Tagebuch-Entwurf konnte nicht vorgemerkt werden." });
      return null;
    }
  };
  const openMemoryDraftForReview = async (draftId: string, supplied?: MemoryDraftEntry) => {
    if (!ensureMemoryVault() || !vaultHandle) return;
    const stored = supplied || memoryDrafts.find((item) => item.id === draftId);
    if (!stored) { setNotice({ kind: "error", text: "Der ausgewählte Tagebuch-Entwurf wurde nicht gefunden." }); return; }
    try {
      await updateLocalMemoryDraftStatus(vaultHandle, draftId, "in_bearbeitung");
      const files = await readLocalMemoryDraftFiles(vaultHandle, draftId);
      setMemoryDraft({ draftId, text: stored.originalText, originalTranscript: stored.originalTranscript, files, captureType: stored.captureType, suggestedCaseId: stored.suggestedCaseId, stimmung: stored.stimmung, verknuepft: stored.verknuepft });
      setMemoryReviewOpen(true);
      await refreshLocal(vaultHandle);
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Tagebuch-Entwurf konnte nicht geöffnet werden." }); }
  };
  const reviewMemoryDraft = async (draft?: MemoryDraft | null) => {
    if (draft && (draft.text.trim() || draft.files.length)) {
      const saved = await queueMemoryDraft(draft);
      if (!saved) return;
      const predicted = [...memoryDrafts.filter((item) => item.id !== saved.id), saved];
      if (predicted.length === 1) await openMemoryDraftForReview(saved.id, saved);
      else go("memory");
      return;
    }
    if (memoryDrafts.length === 1) await openMemoryDraftForReview(memoryDrafts[0].id);
    else if (memoryDrafts.length > 1) go("memory");
  };
  const editMemoryDraft = async (draftId: string) => {
    if (!ensureMemoryVault() || !vaultHandle) return;
    const stored = memoryDrafts.find((item) => item.id === draftId);
    if (!stored) return;
    try {
      const files = await readLocalMemoryDraftFiles(vaultHandle, draftId);
      setMemoryEditDraft({ draftId, text: stored.originalText, originalTranscript: stored.originalTranscript, files, captureType: stored.captureType, suggestedCaseId: stored.suggestedCaseId, stimmung: stored.stimmung, verknuepft: stored.verknuepft });
      go("overview", undefined, { ziel: "#memory-capture-title" });
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Entwurf konnte nicht zum Ergänzen geöffnet werden." }); }
  };
  const removeMemoryDraft = async (draftId: string) => {
    if (!ensureMemoryVault() || !vaultHandle) return;
    if (!await askConfirm("Diesen noch nicht bearbeiteten Tagebuch-Entwurf wirklich löschen?")) return;
    try { await deleteLocalMemoryDraft(vaultHandle, draftId); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Nur der ausgewählte Entwurf wurde gelöscht. Andere Entwürfe und gespeicherte Erinnerungen blieben unverändert." }); }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Entwurf konnte nicht gelöscht werden." }); }
  };
  const go = (id: SectionId, targetId?: string, zusatz?: NavigationsZusatz) => {
    navigation.navigate(id, targetId || null, undefined, zusatz);
    setMobileOpen(false); setMegaOpen(null);
  };
  useEffect(() => { setMobileOpen(false); setMegaOpen(null); }, [navigation.visitKey]);
  // Pfad bleibt beim Scrollen sichtbar: er klebt direkt unter dem (ebenfalls festen) Kopf, dessen Höhe hier gemessen wird.
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>(".site-header");
    if (!kopf || typeof ResizeObserver === "undefined") return;
    const setzen = () => document.documentElement.style.setProperty("--kopf-hoehe", `${Math.round(kopf.getBoundingClientRect().height)}px`);
    setzen(); const beobachter = new ResizeObserver(setzen); beobachter.observe(kopf);
    return () => beobachter.disconnect();
  }, []);
  // Kalender-Knopf in „Erinnern lassen“: zu Fristen und Aufgaben, Karte „Kalender verbinden“ auf.
  const goRef = useRef(go); goRef.current = go;
  // Klaus 10.11.: Adresse „?ansicht=landkarte“ (Geschenkbox) öffnet gleich die Landkarte der App – ohne Umweg über die Startseite.
  useEffect(() => {
    let ziel = "";
    try { ziel = new URLSearchParams(window.location.search).get("ansicht") || ""; } catch { /* ohne Adresse */ }
    if (ziel !== "landkarte") return;
    try { const u = new URL(window.location.href); u.searchParams.delete("ansicht"); window.history.replaceState(window.history.state, "", u.toString()); } catch { /* nur Komfort */ }
    const t = window.setTimeout(() => { landkarteAufmachen(true); goRef.current("help", undefined, { ziel: "[data-app-landkarte]" }); }, 0);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    const oeffnen = () => goRef.current("reminders", undefined, { ziel: "#kalender-verbinden" });
    window.addEventListener(KALENDER_OEFFNEN, oeffnen);
    return () => window.removeEventListener(KALENDER_OEFFNEN, oeffnen);
  }, []);
  useEffect(() => { if (active !== "workflowpdf") { setWfpdfSitzung(null); setWfpdfOeffnen(null); setScanRueckweg(null); } }, [active]);
  const saveAssistantCorrespondence = async (input: {
    status: "Entwurf" | "Versandbereit" | "Versendet" | "Antwort ausstehend" | "Antwort eingegangen" | "Erledigt";
    kind: CorrespondenceKind;
    recipient: string;
    subject: string;
    body: string;
    caseId: string | null;
    documentIds: string[];
    sentAt?: string | null;
  }) => {
    if (!vaultHandle) throw new Error("Bitte zuerst den lokalen Datentresor verbinden.");
    await createLocalCorrespondenceBundle(vaultHandle, {
      status: input.status,
      caseId: input.caseId,
      documentIds: input.documentIds,
      data: {
        title: input.subject || `${input.kind} an ${input.recipient || "Empfänger offen"}`,
        eventAt: input.sentAt || new Date().toISOString(),
        entryKind: "correspondence",
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        correspondenceType: input.kind,
        correspondenceStatus: input.status,
        sentAt: input.sentAt || undefined,
        caseReference: input.caseId || undefined,
        attachmentDocumentIds: input.documentIds,
        sourceDocumentIds: input.documentIds,
        researchStatus: "not_configured",
        researchSources: [],
      },
    });
    await refreshLocal(vaultHandle);
    setNotice({ kind: "success", text: input.status === "Versendet" ? "Das geprüfte Schreiben wurde als versendet dokumentiert und mit dem Vorgang verknüpft. Es wurde nicht automatisch verschickt." : `Der geprüfte Korrespondenzeintrag wurde als „${input.status}“ im vorhandenen Familienaktenregister gespeichert.` });
  };
  const openDocument = async (id: string) => {
    const local = localDocuments.find((item) => item.id === id);
    if (!local || !vaultHandle) { go("inbox"); setNotice({ kind: "error", text: "Bitte den zugehörigen Datentresor verbinden und das Dokument im Dokumenteneingang öffnen." }); return; }
    try {
      const file = await readLocalDocumentFile(vaultHandle, id);
      openFile(file, local.originalName);
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Das Dokument konnte nicht geöffnet werden." }); }
  };
  // Stufe H: „Teilen“ an der Unterlage – die Datei geht an die App, die der Nutzer wählt; die Akte verschickt nichts von selbst.
  const teileDokument = async (id: string) => {
    const local = localDocuments.find((item) => item.id === id);
    if (!local || !vaultHandle) { setNotice({ kind: "error", text: "Bitte den zugehörigen Datentresor verbinden." }); return; }
    try {
      const file = await readLocalDocumentFile(vaultHandle, id);
      const r = await dateiTeilen(new File([file], local.originalName, { type: file.type || local.mimeType }));
      const t = teilenText(r, local.originalName); if (t) setNotice({ kind: r === "geteilt" ? "success" : "info", text: t });
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Die Datei konnte nicht geteilt werden." }); }
  };
  // Ausfüllen (Sitzung F): neue Fassung neben dem Original, Original bleibt unverändert; Stand am Dokument im Register.
  const fillPersons: AusfuellPerson[] = useMemo(() => familyRecords.filter((r) => r.recordType === "person").map((r) => { const d = (r.data || {}) as Record<string, string | undefined>; return { id: r.id, name: d.displayName || r.id, angaben: { displayName: d.displayName, birthDate: d.birthDate, birthPlace: d.birthPlace, address: d.address, street: d.street, postalCode: d.postalCode, city: d.city, email: d.email, phone: d.phone } }; }), [familyRecords]);
  const fillStates = useMemo(() => Object.fromEntries(localDocuments.map((item) => [item.id, fillStateOf(item)])), [localDocuments]);
  const fillDocument = localDocuments.find((item) => item.id === fillDocId) || null;
  // Direkter Einstieg (Klaus 2026-10-31, Frage 1 aus Sitzung F): Papierformular scannen → als Unterlage ablegen → Ausfüllen öffnet sich.
  const scanFormular = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    try {
      const { scannen } = await import("./wfpdf-kern");
      // Prüfbericht M6: auch das gescannte Formular geht durch den Prüfdialog (Titel, Bereich, Vorgang); erst nach
      // „Geprüft lokal speichern“ liegt es in der Akte, danach öffnet sich das Ausfüllen.
      await scannen({ titel: "Formular scannen", fertigText: "Weiter zur Prüfung", name: `Formular ${deutschesDatum(new Date().toISOString().slice(0, 10))}`, fertig: async (file) => {
        nachSpeichernAusfuellen.current = true;
        beginLocalUpload(file, "camera-scan", false, null, null, { zurueck: active });
      } });
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Scanner konnte nicht geöffnet werden." }); }
  };
  const saveFillResult = async (original: LocalDocument, file: File, _modus: "fest" | "ausfuellbar", info: AusfuellInfo, quelle: PdfQuelle) => {
    if (!vaultHandle || quelle.dokumentId !== original.id) throw new Error("Die Bearbeitung gehört nicht zum geöffneten Dokument.");
    const r = await saveLocalPdfEdit(vaultHandle, quelle, file, info);
    await refreshLocal(vaultHandle);
    return r.quelle;
  };
  const updateCockpitTask = async (id: string, status: LocalScheduleStatus) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    if (!await askConfirm(`Soll der Status von ${id} wirklich auf „${status.replaceAll("_", " ")}“ gesetzt werden?`)) return false;
    return updateCockpitTaskDirekt(id, status);
  };
  /** ✓ und „Rückgängig“ (2.28.39): wie in der Fristenliste ohne Rückfrage – die Meldung an der Stelle bietet „Rückgängig“. */
  const updateCockpitTaskDirekt = async (id: string, status: LocalScheduleStatus) => {
    if (!vaultHandle) { go("security"); return false; }
    try { await updateLocalScheduleStatus(vaultHandle, id, status); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Der Aufgabenstatus wurde nach deiner Bestätigung aktualisiert und protokolliert." }); return true; }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Aufgabenstatus konnte nicht geändert werden." }); return false; }
  };
  const savePersonContact = async (id: string, kontakt: PersonKontakt) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return false; }
    try { await updateLocalPersonContact(vaultHandle, id, kontakt); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Anschrift und Kontakt gespeichert. Beim Ausfüllen werden sie als Vorschlag eingesetzt." }); return true; }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Die Angaben konnten nicht gespeichert werden." }); return false; }
  };
  const appendCockpitNote = async (id: string, note: string) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return false; }
    if (!await askConfirm("Soll diese Notiz wirklich beim ausgewählten Datensatz ergänzt werden?")) return false;
    try { await appendLocalFamilyRecordNote(vaultHandle, id, note); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Die Notiz wurde nach deiner Bestätigung ergänzt und protokolliert." }); return true; }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Die Notiz konnte nicht ergänzt werden." }); return false; }
  };
  const confirmContextLink = async (sourceType: ContextSourceType, sourceId: string, caseId: string, reason?: string) => {
    if (!vaultHandle) { go("security"); return; }
    try { await confirmLocalContextLink(vaultHandle, { sourceType, sourceId, caseId, reason }); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Der Zusammenhang wurde bestätigt. Die beteiligten Datensätze bleiben getrennt erhalten." }); }
    catch (reasonValue) { setNotice({ kind: "error", text: reasonValue instanceof Error ? reasonValue.message : "Der Zusammenhang konnte nicht gespeichert werden." }); }
  };
  const rejectContextLink = async (suggestion: ContextLinkSuggestion) => {
    if (!vaultHandle) { go("security"); return; }
    try { await rejectLocalContextLink(vaultHandle, { sourceType: suggestion.sourceType, sourceId: suggestion.sourceId, caseId: suggestion.caseId, contextHash: suggestion.contextHash }); await refreshLocal(vaultHandle); setNotice({ kind: "info", text: "Dieser Zuordnungsvorschlag wird bei unverändertem Zusammenhang nicht erneut gezeigt." }); }
    catch (reasonValue) { setNotice({ kind: "error", text: reasonValue instanceof Error ? reasonValue.message : "Die Entscheidung konnte nicht gespeichert werden." }); }
  };
  const unlinkContext = async (relationId: string) => {
    if (!vaultHandle || !await askConfirm("Nur diese Verbindung lösen? Dokument, Erinnerung und Vorgang bleiben vollständig erhalten.")) return;
    try { await removeLocalContextLink(vaultHandle, relationId); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Nur die Verbindung wurde gelöst. Kein Datensatz und keine Originaldatei wurde gelöscht." }); }
    catch (reasonValue) { setNotice({ kind: "error", text: reasonValue instanceof Error ? reasonValue.message : "Die Verbindung konnte nicht gelöst werden." }); }
  };
  const changeContextLink = async (sourceType: ContextSourceType, sourceId: string, previousRelationId: string | null, caseId: string) => {
    if (!vaultHandle) { go("security"); return; }
    try { await changeLocalContextLink(vaultHandle, { sourceType, sourceId, previousRelationId, caseId }); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Der Vorgangsbezug wurde geändert; die Originaldatensätze blieben unverändert." }); }
    catch (reasonValue) { setNotice({ kind: "error", text: reasonValue instanceof Error ? reasonValue.message : "Der Vorgangsbezug konnte nicht geändert werden." }); }
  };
  const addMemoryToCase = (caseId: string) => {
    setMemorySuggestedCaseId(caseId); go("overview", undefined, { ziel: "#memory-capture-title" });
  };
  const addDocumentToCase = (caseId: string) => beginLocalUpload(null, "file-picker", false, caseId);
  const openLifeAreas = () => go("overview", undefined, { ziel: "#lebensbereiche" });
  const openFooterSystemReports = () => go("systemcheck", undefined, { ziel: "#pruefberichte" });
  // Pfad (Regeln 1–3, 2.28.39): Steht eine Seite in mehreren Menübereichen, zeigt der Pfad den Bereich, über den man kam;
  // ohne solchen Weg (z. B. von der Startseite) keinen erfundenen Bereich. Das letzte Glied ist, was man sieht.
  const bereicheDerSeite = topNavigation.filter((area) => area.landing === active || area.groups.some((group) => group.items.some((item) => item.id === active)));
  const parentArea = active === "overview" ? undefined : bereicheDerSeite.find((area) => area.id === navigation.bereich)
    ?? (bereicheDerSeite.length === 1 ? bereicheDerSeite[0] : bereicheDerSeite.find((area) => area.landing === navigation.herkunft) ?? bereicheDerSeite.find((area) => area.landing === active));
  const pfadZiel = (() => {
    if (navigation.detail) return navigation.detail;
    const id = navigation.view.targetId;
    if (active === "documents") {
      if (id) { const d = [...localDocuments, ...documents].find((item) => item.id === id); return d ? visibleDocumentTitle(d) : null; }
      const { area, query: suche } = navigation.view.library;
      return area || (suche ? `„${suche}“` : null);
    }
    if (!id || active === "health") return null;
    const record = familyRecords.find((item) => item.id === id);
    if (!record) return null;
    if (isMemoryRecord(record)) { const m = memoryData(record); return m?.sensitive ? "Geschützter Eintrag" : m?.title || null; }
    const name = cockpitRecordLabel(record);
    return isSensitiveHealthText(name, record.notes || "") ? "Geschützter Eintrag" : name;
  })();

  const demoGesperrt = sampleBusy || vaultBusy || intakeBusy || inventoryBusy || !vaultHandle;
  const demoZuruecksetzen = async () => {
    // P7: Eine Kopie wird frisch aus der eigenen Akte gezogen (Demo löschen, in der eigenen Akte neu starten).
    if (demoQuelleLesen(localStorage)?.art === "kopie") { if (await askConfirm("Die Demo-Kopie verwerfen und frisch aus deiner Akte kopieren? Deine Akte bleibt unverändert.")) { try { sessionStorage.setItem(DEMO_NEU_MERKER, "1"); } catch { /* dann nur löschen */ } const url = new URL(location.href); url.searchParams.set("demo", "delete"); location.assign(url.href); } return; }
    if (await askConfirm("Den gesamten getrennten Demobestand einschließlich deiner dort importierten Testdateien löschen und neu anlegen? Deine echte Akte bleibt erhalten. Externe Sicherungen bleiben erhalten.")) { const url = new URL(location.href); url.searchParams.set("demo", "reset"); location.assign(url.href); } };
  useEffect(() => {
    if (demoActive() || !vaultHandle || demoGesperrt) return;
    let neu = null; try { neu = sessionStorage.getItem(DEMO_NEU_MERKER); sessionStorage.removeItem(DEMO_NEU_MERKER); } catch { /* nichts */ }
    if (neu) void loadSampleData();
  }, [vaultHandle, demoGesperrt]);
  const demoLoeschen = async () => { if (await askConfirm("Den gesamten getrennten Demobestand einschließlich Testimporten löschen und zur eigenen Akte zurückkehren? Externe Sicherungen bleiben erhalten.")) { const url = new URL(location.href); url.searchParams.set("demo", "delete"); location.assign(url.href); } };
  return (<BspProvider value={bspIds}>
    <div className="app-shell" onInputCapture={() => window.dispatchEvent(new Event("family-dictation-typed"))} onClick={() => megaOpen && setMegaOpen(null)}>
      <header className={`site-header${demoActive() ? " demo-mode" : ""}`} data-demo-bereit={demoGesperrt ? "nein" : "ja"} data-demo-beispiele={demoActive() && samplePresent ? "ja" : undefined} onClick={(event) => event.stopPropagation()}>
        <div className="masthead">
          <button className="mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Hauptmenü öffnen"><Menu size={22}/></button>
          <button className="site-brand" onClick={() => go("overview")}><span className="brand-symbol brand-symbol-icon" data-variante={APP_VARIANTE.toLowerCase()}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 19.2727C22 20.779 20.779 22 19.2727 22H14.7273C13.221 22 12 20.779 12 19.2727V12H19.2727C20.779 12 22 13.221 22 14.7273V19.2727Z" fill="#68C4FF"/><path d="M20 2C21.1046 2 22 2.89543 22 4V7C22 8.10457 21.1046 9 20 9H17C15.8954 9 15 8.10457 15 7V4C15 2.89543 15.8954 2 17 2H20Z" fill="#0C79D8"/><path d="M7 15C8.10457 15 9 15.8954 9 17V20C9 21.1046 8.10457 22 7 22H4C2.89543 22 2 21.1046 2 20V17C2 15.8954 2.89543 15 4 15H7Z" fill="#0C79D8"/><path d="M12 12H4.72727C3.22104 12 2 10.779 2 9.27273V4.72727C2 3.22104 3.22104 2 4.72727 2H9.27273C10.779 2 12 3.22104 12 4.72727V12Z" fill="#2E9EFF"/></svg></span><span><strong ref={markenName}>FAMILIENAKTE</strong><span className="site-brand-zeile"><span className="site-brand-variante" data-variante={APP_VARIANTE.toLowerCase()}>{APP_VARIANTE}</span><small className="site-brand-version"><span className="version-wort">Version </span>{APP_FASSUNG}</small><UpdateFahne/></span></span></button>
          {demoActive() && <DemoKnopf gesperrt={demoGesperrt} verlassen={() => switchDemo(false)} zuruecksetzen={() => void demoZuruecksetzen()} loeschen={() => void demoLoeschen()} kopie={demoQuelleLesen(localStorage)?.art === "kopie"} uebernehmen={() => { try { sessionStorage.setItem(DEMO_UEBERNAHME_MERKER, "1"); } catch { /* ohne Merker kein Übernehmen */ } switchDemo(false); }}/>}
          <div className={`header-actions${kopfAuf ? " kopf-auf" : ""}`} data-kopf-leiste={kopfAuf ? "auf" : "zu"}><button type="button" className="icon-button kopf-pfeil kopf-pfeil-zu" onClick={() => setKopfAuf(false)} aria-label="Weitere Knöpfe schließen" title="Schließen" data-kopf-zu>›</button><NeuKnopf ziel={(z) => { if (z === "kalender") go("reminders", undefined, { ziel: "#kalender-verbinden" }); else if (z === "hilfe") go("help"); else if (z === "hilfe-email") go("help", undefined, { ziel: '[data-hilfe-id="email"] > details' }); else if (z === "hilfe-landkarte") { landkarteAufmachen(); go("help", undefined, { ziel: "[data-app-landkarte]" }); } else go("help", undefined, { ziel: "details.aktensicherung" }); }}/><NetzSchalter/><AblegenKnopf onDateien={(files, quelle, wahl) => ablegenAusKopf(files, quelle, wahl)}/><NotizKnopf vaultHandle={vaultHandle} records={familyRecords} relations={familyRelations} onGespeichert={async (text) => { if (vaultHandle) await refreshLocal(vaultHandle); reportActivity({ kind: "success", text }); }} onFehler={(text) => reportActivity({ kind: "error", text })} onKalender={(tag) => go("reminders", undefined, kalenderZiel(tag))}/><button type="button" className="icon-button kalender-knopf-schalter" onClick={() => go("reminders", undefined, kalenderZiel())} title="Mein Kalender" aria-label="Mein Kalender" data-mein-kalender-knopf><CalendarDays size={18}/><span className="kopf-wort" aria-hidden="true">Kalender</span></button><button type="button" className="icon-button tagebuch-knopf-schalter" onClick={() => go("memory", undefined, { ziel: () => { const feld = document.querySelector<HTMLTextAreaElement>("main [data-tagebuch-text]"); if (!feld) return false; feld.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); return true; } })} title="Tagebuch: Was ist heute passiert?" aria-label="Tagebuch" data-tagebuch-knopf><BookOpen size={18}/><span className="kopf-wort" aria-hidden="true">Buch</span></button><AnmeldeKnopf art="kopf"/><button type="button" className="icon-button kopf-pfeil kopf-pfeil-auf" onClick={() => setKopfAuf(true)} aria-expanded={kopfAuf} aria-label="Weitere Knöpfe: Installieren, Abmelden" title="Weitere Knöpfe" data-kopf-auf>‹</button></div>
        </div>
        <nav className={`main-navigation ${mobileOpen ? "mobile-open" : ""}`} aria-label="Hauptnavigation">
          <button className={active === "overview" ? "active" : ""} onClick={() => go("overview")}><Home size={17}/> Startseite</button>
          {topNavigation.map((area) => <div className="nav-cluster" key={area.id}>
            <button className={parentArea?.id === area.id ? "active" : ""} aria-expanded={megaOpen === area.id} onClick={() => setMegaOpen((value) => value === area.id ? null : area.id)}>{area.label}<ChevronDown size={15}/></button>
            {megaOpen === area.id && <div className="mega-menu">
              <div className="mega-intro"><span className="eyebrow">Hauptbereich</span><h2>{area.label}</h2><button className="text-link" onClick={() => go(area.landing, undefined, { bereich: area.id })}>Bereich öffnen <ChevronRight size={17}/></button></div>
              {area.groups.map((group) => <div className="mega-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <button key={`${group.title}-${item.label}`} onClick={() => item.suche ? (navigation.navigate("documents", null, { area: "", query: item.suche }, { bereich: area.id, detail: item.label }), setMobileOpen(false), setMegaOpen(null)) : go(item.id, undefined, item.kalender ? { ...kalenderZiel(), bereich: area.id } : { bereich: area.id, ziel: item.anker, detail: item.anker ? item.label : undefined })}><strong>{item.label}</strong><small>{item.detail}</small></button>)}</div>)}
            </div>}
          </div>)}
          {mobileOpen && <div className="mobile-menu-extra" aria-label="Weitere Aktionen">
            {mobileOpen && typeof document !== "undefined" && document.querySelector<HTMLElement>(".header-actions .familienakte-install:not([hidden])") && !document.documentElement.classList.contains("pwa-installiert") && <button type="button" onClick={() => { setMobileOpen(false); document.querySelector<HTMLElement>(".header-actions .familienakte-install")?.click(); }}><Download size={17}/> App installieren</button>}
            <button type="button" onClick={() => { setMobileOpen(false); seiteDrucken(); }}><Printer size={17}/> Seite drucken</button>
            <AnmeldeKnopf art="menue"/>
          </div>}
        </nav>
      </header>
      <main className="site-main">
        <AppGlocke records={familyRecords} relations={familyRelations} onOeffnen={(z) => go("reminders", undefined, kalenderZiel(String(new Date(z.beginn).toLocaleDateString("sv-SE")), z.recordId))}
          onErledigt={async (z) => { if (!vaultHandle) return; try { await updateLocalScheduleStatus(vaultHandle, z.recordId, "erledigt"); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: `Erledigt: ${z.titel}` }); } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Status konnte nicht geändert werden." }); } }}/>
        <KalenderAnmeldeHinweis vaultHandle={vaultHandle} records={familyRecords} relations={familyRelations} onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onNotice={setNotice}/>
        <section className="search-command-bar" aria-label="Familienakte durchsuchen und diktieren">
          <div className="search-command-label"><span><strong>In der Familienakte suchen</strong></span></div>
          <SuchFeld className="global-search" value={query} onChange={setQuery} placeholder="Schreiben, Personen, Termine, Unterlagen …" ariaLabel="Gesamte Akte in natürlichen Worten durchsuchen" speechLabel="Suche"/>
        </section>
        <ActivityLines/>
        {sampleBusy && !samplePresent && <section className="info-notice sample-data-notice" aria-live="polite"><span>Info</span><div><strong>Beispieldaten werden vorbereitet …</strong><div>Die Demo legt eine frei erfundene Beispielfamilie im getrennten Demobestand an. Das dauert nur wenige Sekunden.</div></div></section>}
        {samplePresent && !demoActive() && <section className="info-notice sample-data-notice" aria-label="Hinweis zu Beispieldaten"><span>Info</span><div><strong>Bsp. in deiner Akte</strong></div><button type="button" className="button secondary" disabled={sampleBusy} onClick={() => void removeSampleData(false)} data-bsp-weg>− Bsp.</button></section>}
        <div className="breadcrumb">
          {(navigation.canBack || navigation.canForward) && <span className="navigation-history" aria-label="Ansichtsverlauf">
            <button type="button" onClick={navigation.back} disabled={!navigation.canBack} aria-label="Zur vorherigen Ansicht" title="Zurück (Strg+Z)"><ArrowLeft size={15}/><span>Zurück</span></button>
            <button type="button" onClick={navigation.forward} disabled={!navigation.canForward} aria-label="Zur nächsten Ansicht" title="Vorwärts (Strg+Umschalt+Z)"><ArrowRight size={15}/></button>
          </span>}
          <nav className="pfad" aria-label="Du bist hier" data-pfad>{query
            ? <><button className="pfad-start" onClick={() => go("overview")}>Startseite</button><ChevronRight className="pfad-start" size={14}/><span className="pfad-ende" aria-current="page">Suche „{query}“</span></>
            : <><button className={active !== "overview" ? "pfad-start" : undefined} onClick={() => go("overview")}>Startseite</button>{active !== "overview" && <><ChevronRight className="pfad-start" size={14}/>{parentArea && parentArea.label !== sectionLabels[active] && <><button onClick={() => go(parentArea.landing, undefined, { bereich: parentArea.id })} data-pfad-bereich={parentArea.id}>{parentArea.label}</button><ChevronRight size={14}/></>}{pfadZiel ? <><button onClick={() => go(active, undefined, { bereich: parentArea?.id })}>{sectionLabels[active]}</button><ChevronRight size={14}/><span className="pfad-ende" aria-current="page" data-pfad-detail>{pfadZiel}</span></> : <span className="pfad-ende" aria-current="page">{sectionLabels[active]}</span>}</>}</>}
          </nav>
        </div>
        {query && <><SearchPanel query={query} results={searchResults} interpretation={searchInterpretation} onOpen={go} onDocuments={openDocumentLibrary}/><PrivateMeaningPanel handle={vaultHandle} query={query} onOpen={go}/></>}
        {!query && active === "overview" && <Overview
          documents={documents} localDocuments={localDocuments} oneDriveSummary={oneDriveSummary}
          oneDriveName={oneDriveName} localVaultName={localVaultName}
          oneDriveReachable={oneDriveReachable} localVaultReachable={localVaultReachable && !browserStorage && !oneDriveHandle} vaultRemembered={vaultRemembered} proDestination={proDestination}
          familyRecords={familyRecords} familyRelations={familyRelations}
          busy={busy} actionStates={actionStates} onCompare={startComparison} onUpdate={finalizeUpdate}
          onGo={go} onOpenLifeArea={(area) => openDocumentLibrary({ area })}
          systemReport={lastSystemReport}
          onStartIntake={openStartIntake} onSelectInbox={selectInboxFolder} onScanInbox={() => scanSelectedInbox()}
          onScanOneDrive={checkOneDriveInbox} onStartDocumentScan={openDocumentScan} storageReady={vaultReachable} inboxFolderName={inboxFolderName} incomingFiles={incomingFiles}
          intakeBusy={intakeBusy} intakeCheckedAt={intakeCheckedAt} lastIntakeReceipt={lastIntakeReceipt}
          memoryDrafts={memoryDrafts} memoryEditDraft={memoryEditDraft} openMemoryPoints={buildMemoryOpenPoints(familyRecords).length}
          memorySuggestedCaseId={memorySuggestedCaseId}
          onQueueMemory={queueMemoryDraft} onReviewMemory={reviewMemoryDraft} onOpenMemoryQueue={() => go("memory", undefined, { ziel: "#memory-draft-queue" })} lastMemoryReceipt={lastMemoryReceipt}
          onErsterSchritt={(schritt) => { if (schritt === "speicher") go("security"); else if (schritt === "dokument") window.dispatchEvent(new Event(ABLEGEN_OEFFNEN)); else go("reminders", undefined, kalenderZiel()); }}
          letzteSicherung={letzteSicherung} onSichern={() => { go("security"); runFullBackup(); }}
        />}
        {!query && active === "health" && <HealthHub onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "documents" && <DocumentLibrary key={`library-${navigation.visitKey}`} navigation={navigation}
          documents={cockpitDocuments(documents, localDocuments)} records={familyRecords} relations={familyRelations}
          initialFocusId={documentLibraryFocusId} initialArea={documentLibraryRequest.area} initialQuery={documentLibraryRequest.query}
          onUebergabe={proTresorVerfuegbar() ? anProApp : undefined} onPro={proTresorVerfuegbar() ? inProTresor : undefined} onTeilen={teileDokument} proKandidaten={new Set(localDocuments.filter((d) => !istProOriginal(d.storedPath)).map((d) => d.id))}
          fillStates={fillStates} onFill={setFillDocId} onWfpdf={(id) => void inWorkflowPdf(id)} onOpenDocument={openDocument} onGo={go} onUpload={openLocalUpload} onUnlink={unlinkContext} onChange={changeContextLink}
          lokaleIds={new Set(localDocuments.filter((d) => !d.aussortiert).map((d) => d.id))} aussortiert={localDocuments.filter((d) => d.aussortiert)}
          bereichsWahl={[...new Set([...categories, ...localDocuments.map((d) => d.category)])].sort((a, b) => a.localeCompare(b, "de"))}
          sammel={vaultHandle ? {
            aussortieren: async (ids) => { const r = await dokumenteAussortieren(vaultHandle, ids); await refreshLocal(vaultHandle); return r; },
            zurueckholen: async (ids) => { const r = await dokumenteZurueckholen(vaultHandle, ids); await refreshLocal(vaultHandle); return r; },
            loeschen: async (ids) => { const r = await dokumenteEndgueltigLoeschen(vaultHandle, ids); await refreshLocal(vaultHandle); return r; },
            bereich: async (ids, bereich) => { const n = await dokumenteBereichSetzen(vaultHandle, ids, bereich); await refreshLocal(vaultHandle); return n; },
            person: async (ids, personId) => { const n = await dokumenteZuordnen(vaultHandle, ids, { type: "person", id: personId }); await refreshLocal(vaultHandle); return n; },
          } : undefined}
        />}
        {!query && active === "inventory" && <InventoryCenter
          vaultReady={!!vaultHandle}
          vaultHandle={vaultHandle}
          sourceHandle={inventorySourceHandle}
          sourceName={inventorySourceHandle?.name || ""}
          archiveName={inventoryArchiveHandle?.name || ""}
          items={inventoryItems}
          records={familyRecords}
          busy={inventoryBusy}
          progress={inventoryProgress}
          lastRun={inventoryLastRun}
          archiveResult={inventoryArchiveResult}
          onSelectSource={selectInventorySource}
          onSelectArchive={selectInventoryArchive}
          onScan={runInventoryScan}
          onPause={pauseInventoryScan}
          onArchive={runInventoryArchive}
          onRelease={runInventoryRelease}
          onReset={runInventoryReset}
          onConfirmAssignment={confirmInventoryLearningAssignment}
          onTestRegisterSaved={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }}
          onGo={go}
        />}
        {!query && active === "inbox" && <><Suspense fallback={null}><CentralIntakeCenter
          onScanQueued={async (ids) => {
            try {
              const files = await Promise.all(ids.map((id) => eingangDatei(centralIntakeQueue.find((item) => item.id === id)!)));
              openDocumentScan(files); setScanQueueIds(ids);
            } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Arbeitsdateien konnten nicht geladen werden." }); }
          }}
          queue={centralIntakeQueue} storageReady={!!vaultHandle} oneDriveConnected={!!oneDriveHandle} inboxFolderName={inboxFolderName} busy={intakeBusy} checkedAt={intakeCheckedAt}
          onFiles={(files, source) => void queueCentralIntakeFiles(files, source)} onStartDocumentScan={openDocumentScan} onScanForm={() => void scanFormular()} onStapel={(files) => { setStapelNeu(files); go("stapel"); }}
          onSelectInbox={selectInboxFolder} onScanInbox={() => void scanSelectedInbox()} onScanOneDrive={checkOneDriveInbox}
          onReview={reviewCentralIntake} onExtractAttachments={(id) => void extractCentralEmailAttachments(id)} onToggle={toggleCentralIntake} onSetStatus={setCentralIntakeStatus} onSammelAblegen={sammelAblegen} onLoeschen={eingaengeLoeschen} grenzeBytes={aktuelleGrenze().bytes}
          onGo={(id, targetId) => go(id, targetId)}
        /></Suspense><Inbox compact documents={documents} localDocuments={localDocuments.filter((d) => !d.aussortiert)} loading={loadingDocs} onUpload={openLocalUpload} onOpenDocument={openDocument} onFill={setFillDocId} onWfpdf={(id) => void inWorkflowPdf(id)} onRefresh={async () => { await loadDocuments(); await refreshLocal(); }} onLocalStatus={async (id, status) => { if (!vaultHandle) return; await updateLocalStatus(vaultHandle, id, status); await refreshLocal(vaultHandle); }} onStatus={async (id, status) => {
          setBusy(true);
          try { await changeStatus(id, status); await loadDocuments(); setNotice({ kind: "success", text: `Bearbeitungsstand: ${statusLabel[status]}.` }); }
          catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Speichern nicht möglich." }); }
          finally { setBusy(false); }
        }} busy={busy}/></>} 
        {!query && active === "stapel" && <Suspense fallback={null}><StapelSeite neu={stapelNeu} onNeuGenommen={() => setStapelNeu(null)} onWorkflowPdf={dateiInWorkflowPdf} onEinordnen={async (dateien, ids) => {
          // Prüfbericht M5: der Zusatz „(Ecken prüfen)“ ist ein Arbeitsstand im Stapel, kein Name; danach zur Eingangszentrale.
          const ohneZusatz = dateien.map((d) => /\s*\(Ecken prüfen\)/.test(d.name) ? new File([d], d.name.replace(/\s*\(Ecken prüfen\)/, ""), { type: d.type, lastModified: d.lastModified }) : d);
          const ok = await queueCentralIntakeFiles(ohneZusatz, "camera-scan", null, ids);
          if (ok) { go("inbox"); setNotice({ kind: "info", issue: "eingang-stapel", text: `${dateien.length} Unterlage${dateien.length === 1 ? " steht" : "n stehen"} jetzt oben in „Eingänge prüfen“. Es wurde noch nichts gespeichert.` }); }
          return ok;
        }} kopf={<PageTitle icon={<Upload/>} title="Stapel (noch einordnen)" text="Viele Fotos oder Scans auf einmal: Workflow PDF findet je Bild das Blatt und zieht es gerade. Wo sich die Verfahren nicht einig sind, bleibt das ganze Foto stehen („Ecken prüfen“). Erst „Einordnen“ gibt die Unterlagen an die Eingangszentrale."/>}/></Suspense>}
        {!query && active === "workflowpdf" && demoActive() && <p>Workflow PDF hat eine eigene Bibliothek. Bitte die Demo verlassen, um sie zu verwenden.</p>}
        {!query && active === "workflowpdf" && !demoActive() && <Suspense fallback={null}><WorkflowPdfSeite key={wfpdfStart} scan={wfpdfScan} oeffnen={wfpdfOeffnen} bindung={wfpdfSitzung?.quelle} onZurueck={() => { const sitzung = wfpdfSitzung; setWfpdfSitzung(null); setWfpdfOeffnen(null); if (sitzung) go(sitzung.zurueck, sitzung.quelle.dokumentId); }} onAblegen={ausWorkflowPdf} onGeoeffnet={() => { setWfpdfOeffnen(null); setWfpdfScan(false); }} kopf={<PageTitle icon={<FileText/>} title="Workflow PDF" extra={scanRueckweg && !wfpdfSitzung ? <button type="button" className="button secondary compact-button" onClick={() => go(scanRueckweg)} data-scan-zurueck><ArrowLeft size={15}/> Zurück: {scanRueckweg === "overview" ? "Startseite" : sectionLabels[scanRueckweg] || "Eingangszentrale"}</button> : undefined} text={scanRueckweg && !wfpdfSitzung ? "Dokument fotografieren: Seiten aufnehmen und „PDF erstellen“ tippen – danach öffnet sich die Prüfung für die Akte. Zurück führt ohne Scan an die Stelle, von der du kamst." : wfpdfSitzung ? "PDF bearbeiten und an dieselbe Stelle in der Akte zurückspeichern. Keine dauerhafte Zweitablage im PDF-Raum." : "Das ganze Werkzeug von Workflow PDF in der Familienakte: scannen, zuschneiden, Felder erkennen und setzen, ausfüllen, Prüfbericht, PDF ausgeben. Eigene Bibliothek, getrennt von der Workflow-PDF-App; nichts geht ins Netz, bis du es selbst wählst."}/>}/></Suspense>}
        {!query && active === "netz" && <Suspense fallback={null}><NetzSeite vaultHandle={vaultHandle} kopf={<PageTitle icon={<Network/>} title="Netz (Mycel)" text="Zeigt dieses Gerät auf Wunsch mit einer Visitenkarte im offenen Netz der SBKIM-Apps. Es gleicht keine Daten zwischen deinen Geräten ab. Beim Öffnen der Akte geht nichts ins Netz."/>}/></Suspense>}
        {!query && active === "security" && <SecurityCenter onDokumente={() => go("documents")}
          aktenHandle={vaultHandle} onMeaningOpen={go} onProChange={refreshProDestination} proDestination={proDestination} browserStorage={browserStorage} folderSelectionSupported={folderPickerSupported()}
          oneDriveConnected={oneDriveReachable} oneDriveName={oneDriveName} oneDriveSummary={oneDriveSummary}
          localConnected={localVaultReachable} localVaultName={localVaultName} localVaultSummary={localVaultSummary}
          supported={vaultSupported()} onlineCount={documents.length} localCount={localDocuments.length} busy={vaultBusy || busy}
          syncPreview={syncPreview} syncResult={syncResult}
          onConnectOneDrive={connectOneDrive} onConnectLocal={connectLocalVault}
          onLockOneDrive={lockOneDrive} onLockLocal={lockLocalVault} onMigrate={migrateOnline} onHelp={() => go("help")}
          onCompare={startVaultInventoryComparison} onCheckSync={checkBackupSync} onRunSync={runBackupSync} onExport={() => { setExportOpen(true); reportActivity({ kind: "info", text: "Exportvorbereitung geöffnet. Noch keine Datei geschrieben; Umfang und Zielordner bitte prüfen." }); }} onFullBackup={runFullBackup} onRestoreTest={runRestoreTest} onEinlesen={runEinlesenProbe} letzteSicherung={letzteSicherung} hatDaten={localDocuments.length + familyRecords.length > 0}
          laufwerkKarte={<LaufwerkKarte aktiv={vaultHandle} appVersion={APP_FASSUNG} busy={vaultBusy} onBusy={setVaultBusy} onNotice={setNotice} onRefresh={() => refreshLocal()} onDrucken={seiteDrucken}/>}
          ordnerWahl={sicherungsOrdnerWaehlbar()} onEingang={() => go("inbox")}
        />}
        {!query && active === "medical" && <Medical diagnoses={filteredDiagnoses} query={query} onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "benefits" && <Benefits onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "work" && <Work onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "assessment" && <Assessment onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "assistant" && <Suspense fallback={null}><AssistantCenter
          records={familyRecords}
          relations={familyRelations}
          documents={aktenDokumente.map((document) => ({
            id: document.id,
            title: visibleDocumentTitle(document),
            category: document.category,
            notes: document.notes,
            documentDate: document.documentDate,
            textauszug: textauszugVon(document) || null,
            assistantReleased: inventoryItems.some((item) => item.documentId === document.id && item.state === "ASSISTENZ_FREIGEGEBEN"),
          }))}
          initialCaseId={assistantCaseId}
          vaultReady={!!vaultHandle}
          onOpenRecord={(id) => { const record = familyRecords.find((item) => item.id === id); go(record && ["deadline", "task", "reminder"].includes(record.recordType) ? "reminders" : "cockpit", id); }}
          onOpenDocument={(id) => void openDocument(id)}
          onOpenInventory={() => go("inventory")}
          onSaveCorrespondence={saveAssistantCorrespondence}
          onNotice={setNotice}
          namen={kiNamen}
          onWorkflowPdf={demoActive() ? undefined : (file) => { setWfpdfSitzung(null); setWfpdfOeffnen([file]); setWfpdfScan(false); setWfpdfStart((n) => n + 1); go("workflowpdf"); }}
        /></Suspense>}
        {!query && active === "correspondence" && <Correspondence onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "sources" && <Sources onDocuments={openDocumentLibrary} beispiele={searchBeispiele}/>}
        {!query && active === "family" && <FamilyArea onGo={go} onDocuments={openDocumentLibrary} records={familyRecords} vaultHandle={vaultHandle} onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onSaveContact={savePersonContact}/>}
        {!query && active === "reminders" && <ReminderCenter
          vaultHandle={vaultHandle} records={familyRecords} relations={familyRelations} documents={localDocuments} focusId={remindersFocusId}
          onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onGo={go} onNotice={setNotice}
        />}
        {!query && active === "cockpit" && <InteractiveCockpit key={`cockpit-${navigation.visitKey}`} navigation={navigation}
          documents={documents} localDocuments={localDocuments} records={familyRecords} relations={familyRelations} decisions={linkDecisions}
          initialFocusId={cockpitFocusId} onGo={go} onOpenDocument={openDocument} onFill={setFillDocId}
          onTaskStatus={updateCockpitTask} onTaskStatusDirekt={updateCockpitTaskDirekt} vaultHandle={vaultHandle} onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onNotice={setNotice} onAddNote={appendCockpitNote} onSaveContact={savePersonContact} onAssistant={(caseId) => go("assistant", caseId)}
          onConfirmContext={confirmContextLink} onRejectContext={rejectContextLink} onAddMemoryToCase={addMemoryToCase} onAddDocumentToCase={addDocumentToCase}
        />}
        {!query && active === "memory" && <MemoryCenter
          documents={contextDocuments(documents, localDocuments)} records={familyRecords} relations={familyRelations} drafts={memoryDrafts} initialFocusId={memoryFocusId} vaultHandle={vaultHandle}
          onQueue={queueMemoryDraft} onReview={reviewMemoryDraft} onOpenDraft={openMemoryDraftForReview} onEditDraft={editMemoryDraft} onDeleteDraft={removeMemoryDraft}
          onGo={go} onOpenDocument={openDocument} onUnlink={unlinkContext} onChange={changeContextLink} onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onNotice={setNotice}
        />}
        {!query && active === "home" && <PreparedArea kind="home" onUpload={openLocalUpload} onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "vehicles" && <PreparedArea kind="vehicles" onUpload={openLocalUpload} onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "purchases" && <PreparedArea kind="purchases" onUpload={openLocalUpload} onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "directory" && <Directory onGo={go}/>} 
        {!query && active === "help" && <HelpCenter onGo={go} herkunft={navigation.vorher} letzteSicherung={letzteSicherung} speicher={demoActive() ? undefined : proDestination ? (proDestination.ready ? undefined : "pro-gesperrt") : !oneDriveReachable && localVaultReachable && browserStorage ? "app" : undefined} ordnerWahl={folderPickerSupported()} datentresor={demoActive() ? undefined : (proDestination ? (proDestination.ready ? "Pro-Tresor" : "") : oneDriveReachable ? (oneDriveName || "OneDrive") : localVaultReachable && !browserStorage ? localVaultName : "") || undefined} onSearch={(value) => { setQuery(value); window.scrollTo({ top: 0, behavior: "smooth" }); }} demo={<DemoStarten aktiv={demoActive()} gesperrt={demoGesperrt} grund={!vaultHandle ? "Zuerst im Sicherheitscenter einen Datentresor wählen, dann lässt sich die Demo starten." : undefined} starten={() => void loadSampleData()} bsp={{ da: samplePresent, busy: sampleBusy, umschalten: () => void (samplePresent ? removeSampleData(false) : addSampleData()) }}/>}/>} 
        {!query && active === "systemcheck" && <SystemCheck
          documents={documents}
          localDocuments={localDocuments}
          vaultHandle={vaultHandle}
          onCompleted={(completedReport) => { setCheckRecommended(false); setLastSystemReport(completedReport); reportActivity({ kind: completedReport.overall === "green" ? "success" : completedReport.overall === "red" ? "error" : "info", text: `Systemprüfung abgeschlossen · ${completedReport.overall === "green" ? "GRÜN" : completedReport.overall === "red" ? "ROT" : "GELB"} · ${completedReport.openProblems.length} offene Prüfpunkte. Prüfbericht gespeichert; keine Produktivübernahme.` }); }}
        />}
        {!query && active === "changelog" && <WhatsNew documents={documents} localDocuments={localDocuments} records={familyRecords} relations={familyRelations} onGo={go}/>}
        {!query && active === "versions" && <VersionHistory/>}
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-row"><div><strong>FAMILIENAKTE {APP_VARIANTE}</strong><span><b>Version {APP_FASSUNG}</b></span></div><small>Originalunterlagen bleiben verbindlich. Vorbereitete Bereiche enthalten noch keine behaupteten Aktenbestände.</small></div>
          <nav className="footer-directory" aria-label="Weiterführende Bereiche der Familienakte">
            <section><h2>Familienakte</h2><ul><li><button onClick={() => go("cockpit")}>Cockpit</button></li><li><button onClick={() => go("memory")}>Tagebuch</button></li><li><button onClick={() => go("reminders")}>Fristen und Aufgaben</button></li><li><button onClick={() => go("directory")}>Gesamtes Verzeichnis</button></li><li><button onClick={openLifeAreas}>Lebensbereiche</button></li></ul></section>
            <section><h2>Dokumente</h2><ul><li><button onClick={() => go("documents")}>Dokumentenbibliothek</button></li><li><button onClick={() => go("inbox")}>Eingangszentrale</button></li><li><button onClick={() => go("inventory")}>Bestand prüfen</button></li><li><button onClick={() => go("changelog")}>Was gibt’s Neues?</button></li></ul></section>
            <section><h2>Unterstützung</h2><ul><li><button onClick={() => go("help")}>Hilfe</button></li><li><button onClick={() => openChatGPTEdit()}>Mit KI arbeiten</button></li><li><button onClick={() => go("systemcheck")}>Systemprüfung</button></li><li><button onClick={openFooterSystemReports}>Prüfberichte</button></li></ul></section>
            <section><h2>Sicherheit und Verwaltung</h2><ul><li><button onClick={() => go("security")}>Sicherheitscenter</button></li><li><button onClick={() => { setExportOpen(true); reportActivity({ kind: "info", text: "Exportvorbereitung geöffnet. Umfang und Zielordner müssen vor dem Start ausdrücklich bestätigt werden; noch keine Datei geschrieben." }); }}>Familienakte exportieren</button></li><li><button onClick={() => go("versions")}>Versionshistorie</button></li><li><a href="./datenschutz.html">Impressum &amp; Datenschutz</a></li></ul></section>
          </nav>
          <div className="footer-meta"><span>Me, Myself and I – Meine Familienakte{samplePresent ? ` · ${SAMPLE_NOTICE}` : ""}</span><button onClick={() => go("security")}><LockKeyhole size={14}/> Datenschutz & Sicherheit</button></div>
        </div>
      </footer>
      {scanOpen && (<Suspense fallback={null}>
        <DocumentScanDialog
          initialFiles={scanInitialFiles}
          onClose={() => {
            setScanOpen(false);
            setScanInitialFiles([]);
            setScanQueueIds([]);
          }}
          onComplete={(file) => {
            setScanOpen(false);
            setScanInitialFiles([]);
            beginLocalUpload(file, "camera-scan", true);
          }}
        />
      </Suspense>)}
      {uploadOpen && vaultHandle && <UploadDialog initialFile={uploadInitialFile} uebergabeVorschlag={centralIntakeQueue.find(item => item.id === uploadQueueId)?.uebergabeVorschlag} source={uploadSource} knownDocuments={[...localDocuments, ...documents]} records={familyRecords} relations={familyRelations} decisions={linkDecisions} suggestedCaseId={uploadSuggestedCaseId} fristVorgabe={uploadFristVorgabe}
        onAnsehen={(id) => void openDocument(id)}
        onDasselbe={async (id) => {
        // Nur auf ausdrückliche Wahl „Ist dasselbe“ (Prüfbericht H1): der Eingang zeigt auf das vorhandene Dokument, nichts wird kopiert.
        const queued = uploadQueueId ? centralIntakeQueue.find((item) => item.id === uploadQueueId) : null;
        if (uploadQueueId && !await setCentralIntakeQueue((current) => current.map((item) => item.id === uploadQueueId ? { ...item, status: "Übernommen", selected: false, savedDocumentId: id, error: null, dasselbe: true } : item))) return;
        if (queued?.parentQueueId) {
          const parent = centralIntakeQueue.find((item) => item.id === queued.parentQueueId);
          if (parent?.savedDocumentId && localDocuments.some((item) => item.id === id)) void linkLocalDocuments(vaultHandle, parent.savedDocumentId, id, "enthält Anlage").catch(() => undefined);
        }
        setUploadOpen(false); setUploadInitialFile(null); setUploadSuggestedCaseId(null); setUploadQueueId(null); setActionState("upload", "success");
        setNotice({ kind: "success", issue: "eingang-pruefung", text: "Nicht noch einmal abgelegt: der Eingang ist mit dem vorhandenen Dokument abgeschlossen. Es wurde keine Kopie angelegt." });
      }} onClose={() => { setUploadOpen(false); setUploadInitialFile(null); setUploadSuggestedCaseId(null); setUploadQueueId(null); nachSpeichernAusfuellen.current = false; reportActivity({ kind: "info", issue: "eingang-pruefung", text: "Prüfung abgebrochen. Es wurde nichts gespeichert." }); }} onSave={async (file, data) => {
        try {
          const { newCaseTitle, rejectedContext, resolveOpenPointEventId, fristen = [], ...documentData } = data;
          const queued = uploadQueueId ? centralIntakeQueue.find((entry) => entry.id === uploadQueueId) : null;
          documentData.notes = eingangNotizen(queued, documentData.notes);
          if (newCaseTitle) {
            const createdCase = await createLocalFamilyRecord(vaultHandle, { recordType: "case", data: { title: newCaseTitle, caseType: "Benutzerbestätigter Vorgang" }, status: "offen", source: "Dokumenteneingang", notes: "Bewusst im Zusammenhangs-Dialog angelegt." });
            documentData.assignmentLinks = [...(documentData.assignmentLinks || []), { toType: "case", toId: createdCase.id, relationType: "gehört zu" }];
          }
          const scan = (file as DocumentScanPdfFile).documentScan;
          // Stufe H: Vermerk „bearbeitet“ und Original-Foto (aus dem Stapel) am Dokument – das Original liegt als Scan-Original daneben.
          if (scan?.bearbeitung) documentData.notes = [documentData.notes, `Scan bearbeitet: ${scan.bearbeitung}.${scan.keepOriginals && scan.originals.length ? ` Original-Foto liegt bei (${scan.originals.length}).` : ""}`].filter(Boolean).join("\n");
          const item = await saveLocalDocument(vaultHandle, file, { ...documentData, scanPageCount: scan?.pageCount, scanOriginals: scan?.keepOriginals ? scan.originals : [], proUebergabe: queued?.proUebergabe });
          if (queued?.parentQueueId) {
            const parent = centralIntakeQueue.find((entry) => entry.id === queued.parentQueueId);
            if (parent?.savedDocumentId) await linkLocalDocuments(vaultHandle, parent.savedDocumentId, item.id, "enthält Anlage");
          }
          if (uploadQueueId) {
            const children = centralIntakeQueue.filter((entry) => entry.parentQueueId === uploadQueueId && entry.savedDocumentId);
            for (const child of children) await linkLocalDocuments(vaultHandle, item.id, child.savedDocumentId!, "enthält Anlage");
            if (!await setCentralIntakeQueue((current) => current.map((entry) => entry.id === uploadQueueId ? { ...entry, status: "Übernommen", selected: false, savedDocumentId: item.id, error: null } : entry))) throw new Error("Das Dokument ist abgelegt, der Arbeitsstand konnte noch nicht bestätigt werden.");
          }
          if (scan?.pageCount && scanQueueIds.length) {
            if (!await setCentralIntakeQueue((current) => current.map((entry) => scanQueueIds.includes(entry.id) ? { ...entry, status: "Übernommen", selected: false, savedDocumentId: item.id, error: "Als Seiten desselben PDF-Dokuments übernommen." } : entry))) throw new Error("Das Scan-Dokument ist abgelegt, der Arbeitsstand konnte noch nicht bestätigt werden.");
            setScanQueueIds([]);
          }
          if (rejectedContext) {
            const actualSuggestion = buildContextLinkSuggestions({ documents: contextDocuments(documents, [...localDocuments, item]), records: familyRecords, relations: familyRelations })
              .find((suggestion) => suggestion.sourceId === item.id && suggestion.caseId === rejectedContext.caseId);
            await rejectLocalContextLink(vaultHandle, { sourceType: "document", sourceId: item.id, caseId: rejectedContext.caseId, contextHash: actualSuggestion?.contextHash || rejectedContext.contextHash });
          }
          if (resolveOpenPointEventId) await updateLocalMemoryOpenPointStatus(vaultHandle, resolveOpenPointEventId, "erledigt");
          // Erkannte und angehakte Frist, Garantie oder Aufgabe: angelegt und mit dem Dokument (und dem Vorgang) verknüpft (H3).
          const vorgangId = documentData.assignmentLinks?.find((link) => link.toType === "case")?.toId || "";
          let fristenAngelegt = 0; let fristFehler = "";
          for (const frist of fristen) {
            try {
              await createLocalScheduleBundle(vaultHandle, { recordType: frist.recordType, title: frist.title, dueAt: frist.dueAt, reminderAt: null, source: `Eingang: ${dokumentTitel(item)}`, notes: null,
                references: [{ recordType: "document", id: item.id, relationType: "basiert auf" }, { recordType: "case", id: vorgangId, relationType: "gehört zu" }] });
              fristenAngelegt++;
            } catch (reason) { fristFehler = reason instanceof Error ? reason.message : "Frist konnte nicht angelegt werden."; }
          }
          const queueIdFertig = uploadQueueId;
          setUploadOpen(false); setUploadInitialFile(null); setUploadSuggestedCaseId(null); setUploadQueueId(null); await refreshLocal(vaultHandle);
          setIncomingFiles((current) => current.filter((candidate) => !(candidate.name === file.name && candidate.size === file.size)));
          if (uploadFromStart) { setLastIntakeReceipt({ id: item.id, title: dokumentTitel(item), category: item.category, source: item.source || "Lokaler Datentresor" }); go("overview"); }
          else if (queueIdFertig || uploadZurueck === "inbox") {
            go("inbox");
            // „Gespeichert ✓“ steht an der Zeile; dorthin zurück statt irgendwo auf der Seite (M10).
            if (queueIdFertig) window.setTimeout(() => document.getElementById(`eingang-${queueIdFertig}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
          }
          else if (uploadZurueck === "documents") openDocumentLibrary({ focusId: item.id });
          else go(uploadZurueck);
          if (nachSpeichernAusfuellen.current) { nachSpeichernAusfuellen.current = false; setFillDocId(item.id); }
          setActionState("upload", "success");
          const fristText = fristenAngelegt ? ` ${fristenAngelegt === 1 ? "1 Frist oder Aufgabe wurde" : `${fristenAngelegt} Fristen oder Aufgaben wurden`} mit dem Dokument verknüpft angelegt.` : "";
          setNotice({ kind: fristFehler ? "error" : "success", issue: "eingang-pruefung", text: (scan ? `Gespeichert ✓ Das PDF aus ${scan.pageCount} Scan-Seite${scan.pageCount === 1 ? "" : "n"} wurde im freigegebenen Datentresor erfasst.${scan.keepOriginals ? " Die Originalaufnahmen wurden als Anlagen derselben PDF behalten." : " Es wurden keine zusätzlichen Scan-Fotos als Dokumente angelegt."}` : `Gespeichert ✓ „${dokumentTitel(item)}“ liegt im Datentresor. Die Originaldatei wurde nicht verschoben, umbenannt oder gelöscht.`) + fristText + (fristFehler ? ` Eine Frist wurde nicht angelegt: ${fristFehler}` : "") });
          return item;
        } catch (error) {
          setActionState("upload", "failed");
          throw error;
        }
      }}/>} 
      {fillDocument && vaultHandle && <Suspense fallback={null}><AusfuellenDialog key={fillDocument.id} dokument={fillDocument} geschuetzt={isSensitiveHealthText(fillDocument.originalName, fillDocument.category, fillDocument.notes)} personen={fillPersons} namen={kiNamen}
        leseDatei={() => beginLocalPdfEdit(vaultHandle, fillDocument.id)}
        ablage={{ lesen: () => readAusfuellAblage(vaultHandle), schreiben: (teil) => writeAusfuellAblage(vaultHandle, teil) }}
        onVormerken={async (info) => { await setLocalDocumentAusfuellen(vaultHandle, fillDocument.id, info); await refreshLocal(vaultHandle); }}
        onErgebnis={(file, modus, info, quelle) => saveFillResult(fillDocument, file, modus, info, quelle)}
        onClose={() => setFillDocId(null)} onNotice={setNotice}/></Suspense>}
      {editOpen && <KiAuftragDialog seiteId={active} seite={sectionLabels[active] || "Startseite"} initialRequest={editInitialRequest} documents={localDocuments} namen={kiNamen} readDocument={(id) => vaultHandle ? readLocalDocumentFile(vaultHandle, id) : Promise.reject(new Error("Kein Tresor geöffnet."))} onSaveAnswer={(file) => window.dispatchEvent(new CustomEvent("familienakte:dateien", { detail: { files: [file] } }))} onClose={() => setEditOpen(false)} onNotice={setNotice} onStateChange={(state) => setActionState("chatgpt", state)}/>}
      <Seitenleiste seite={active} zurStartseite={() => go("overview")} zurAuswahl={() => go("directory")} zurHilfe={() => go("help")} zurueck={() => { window.familienakteZurueck?.(); }} kannZurueck={navigation.canBack}/>
      <button type="button" className="ki-fab" onClick={() => openChatGPTEdit()} aria-label="Mit KI arbeiten" title={`Mit KI arbeiten – Seite „${sectionLabels[active] || "Startseite"}“`}><Sparkles size={20}/></button>
      {memoryReviewOpen && memoryDraft && vaultHandle && <MemoryReviewDialog
        draft={memoryDraft} documents={contextDocuments(documents, localDocuments)} records={familyRecords} relations={familyRelations} decisions={linkDecisions}
        onOpenDocument={openDocument}
        queuePosition={Math.max(1, sortMemoryDraftQueue(memoryDrafts).findIndex((item) => item.id === memoryDraft.draftId) + 1)} queueTotal={memoryDrafts.length}
        onClose={async (status = "unbehandelt") => { if (memoryDraft.draftId) { await updateLocalMemoryDraftStatus(vaultHandle, memoryDraft.draftId, status); await refreshLocal(vaultHandle); } setMemoryReviewOpen(false); setMemoryDraft(null); }}
        onSave={async (input) => {
          const total = memoryDrafts.length;
          const { rejectedContext, ...memoryInput } = input;
          const saved = await createLocalMemoryBundle(vaultHandle, { ...memoryInput, draftId: memoryDraft.draftId, stimmung: memoryDraft.stimmung });
          if (rejectedContext) {
            const actualSuggestion = buildContextLinkSuggestions({ documents: contextDocuments(documents, localDocuments), records: [...familyRecords, saved.event], relations: familyRelations })
              .find((suggestion) => suggestion.sourceId === saved.event.id && suggestion.caseId === rejectedContext.caseId);
            await rejectLocalContextLink(vaultHandle, { sourceType: "event", sourceId: saved.event.id, caseId: rejectedContext.caseId, contextHash: actualSuggestion?.contextHash || rejectedContext.contextHash });
          }
          setMemoryReviewOpen(false); setMemoryDraft(null);
          setLastMemoryReceipt({ id: saved.event.id, title: memoryData(saved.event)?.title || saved.event.id, mediaCount: saved.media.length });
          await refreshLocal(vaultHandle);
          setMemoryCompletion({ id: saved.event.id, title: memoryData(saved.event)?.title || saved.event.id, remaining: Math.max(0, total - 1), total });
          reportActivity({ kind: "success", text: `1 Erinnerung mit ${saved.media.length} Medien im bestehenden Register gespeichert und verknüpft.` });
        }}
      />}
      {memoryCompletion && <MemoryCompletionDialog
        result={memoryCompletion}
        onClose={() => setMemoryCompletion(null)}
        onGo={(id, targetId) => { setMemoryCompletion(null); go(id, targetId); }}
        onNext={() => { setMemoryCompletion(null); go("memory"); }}
      />}
      {demoPlan && <DemoUebernahmeDialog plan={demoPlan} onUebernehmen={runDemoUebernehmen} onClose={() => setDemoPlan(null)}/>}
      {einlesen && <SicherungEinlesenDialog probe={einlesen.probe} onEinlesen={runEinlesen} onClose={() => setEinlesen(null)} onEingang={() => { setEinlesen(null); go("inbox"); }}/>}
      {sicherungWahl && <SicherungAnlegenDialog onStart={(pw) => void runFullBackupMit(pw)} onClose={() => setSicherungWahl(false)}/>}
      {notfallblatt && <NotfallblattDialog notfall={notfallblatt.notfall} ordner={notfallblatt.ordner} erstellt={notfallblatt.erstellt} appVersion={APP_FASSUNG} onDrucken={seiteDrucken} onClose={() => setNotfallblatt(null)}/>}
      {passwortDialog && <SicherungPasswortDialog ordner={passwortDialog.name} fehler={passwortDialog.fehler} laeuft={passwortDialog.laeuft} onZugang={(z) => void runEinlesenZugang(z)} onClose={() => setPasswortDialog(null)}/>}
      {exportOpen && <ExportDialog
        sourceHandle={vaultHandle}
        documents={documents}
        localDocuments={localDocuments}
        records={familyRecords}
        relations={familyRelations}
        auditLog={vaultAuditLog}
        onClose={() => setExportOpen(false)}
        onNotice={setNotice}
      />}
    </div>
    </BspProvider>
  );
}

function Overview({ documents, localDocuments, oneDriveSummary, oneDriveName, localVaultName, oneDriveReachable, localVaultReachable, vaultRemembered, proDestination = null, familyRecords, familyRelations, busy, actionStates, onCompare, onUpdate, onGo, onOpenLifeArea, systemReport, onStartIntake, onSelectInbox, onScanInbox, onScanOneDrive, onStartDocumentScan, storageReady, inboxFolderName, incomingFiles, intakeBusy, intakeCheckedAt, lastIntakeReceipt, memoryDrafts, memoryEditDraft, memorySuggestedCaseId, openMemoryPoints, onQueueMemory, onReviewMemory, onOpenMemoryQueue, lastMemoryReceipt, onErsterSchritt, letzteSicherung = null, onSichern }: {
  documents: UploadedDocument[]; localDocuments: LocalDocument[]; oneDriveSummary: VaultSummary | null;
  oneDriveName: string; localVaultName: string; oneDriveReachable: boolean; localVaultReachable: boolean; vaultRemembered: boolean; proDestination?: ProDestination | null;
  familyRecords: FamilyRecordUnion[]; familyRelations: FamilyRelation[];
  busy: boolean; actionStates: Record<ActionKey, ActionState>; onCompare: () => void; onUpdate: () => void;
  onGo: GehMitZiel; onOpenLifeArea: (area: string) => void;
  systemReport: SystemCheckReport | null;
  onStartIntake: (file?: File | null, source?: DocumentIntakeSource) => void; onSelectInbox: () => void; onScanInbox: () => void; onScanOneDrive: () => void;
  onStartDocumentScan: (files: File[]) => void; storageReady: boolean;
  inboxFolderName: string; incomingFiles: IncomingFolderFile[]; intakeBusy: boolean; intakeCheckedAt: string | null; lastIntakeReceipt: IntakeReceipt | null;
  memoryDrafts: MemoryDraftEntry[]; memoryEditDraft: MemoryDraft | null; openMemoryPoints: number;
  memorySuggestedCaseId: string | null;
  onQueueMemory: (draft: MemoryDraft) => Promise<MemoryDraftEntry | null>; onReviewMemory: (draft?: MemoryDraft | null) => Promise<void>; onOpenMemoryQueue: () => void; lastMemoryReceipt: MemoryReceipt | null;
  onErsterSchritt: (schritt: ErsterSchritt) => void;
  letzteSicherung?: string | null; onSichern?: () => void;
}) {
  // Der mitgelieferte Prüfbericht der Entwicklung (13.10.) ist kein Ergebnis auf diesem Gerät; er steht nur unter Systemprüfung (Plan 2.28.39).
  const currentSystemReport = systemReport?.version === APP_VERSION && systemReport.id !== releaseSystemCheckReport.id ? systemReport : null;
  const systemStatus = currentSystemReport?.overall || "unchecked";
  const systemStatusText = !currentSystemReport ? "Auf diesem Gerät noch nicht geprüft" : currentSystemReport.overall === "green" ? "Prüfung vollständig abgeschlossen – keine offenen Fehler oder Warnungen." : currentSystemReport.overall === "yellow" ? "Warnungen oder unvollständig umgesetzte Punkte sind vorhanden." : "Die Systemprüfung hat Fehler festgestellt.";
  const openProblems = currentSystemReport?.openProblems || [];
  const systemProblemSummary = !currentSystemReport
    ? "Die Prüfung startest du mit „Systemprüfung öffnen“."
    : openProblems.length > 0
      ? `${openProblems.length} offene${openProblems.length === 1 ? "r Punkt" : " Punkte"} der Systemprüfung`
      : currentSystemReport.overall === "green"
        ? "Systemprüfung vollständig – keine offenen Punkte."
        : "Die Systemprüfung enthält Hinweise, die geprüft werden sollten.";
  const vaultConnected = demoActive() ? storageReady : proDestination ? proDestination.ready : oneDriveReachable || localVaultReachable;
  const connectedVaultDetails = demoActive() ? "Getrennter lokaler Demobestand" : proDestination ? (proDestination.ready ? "Gewählter Pro-Tresor · Originalablage verbunden" : "Gewählten Pro-Tresor verbinden und entsperren") : [
    oneDriveReachable ? `OneDrive-Datentresor${oneDriveName ? `: ${oneDriveName}` : ""}` : "",
    localVaultReachable ? `USB-/PC-Tresor${localVaultName ? `: ${localVaultName}` : ""}` : "",
  ].filter(Boolean).join(" · ");
  const vaultActionState: ActionState = vaultConnected ? "success" : vaultRemembered ? "failed" : "pending";
  const newDocumentCount = documents.filter((item) => item.status === "hochgeladen").length;
  const reviewedDocumentCount = documents.filter((item) => item.status === "geprüft").length;
  const cockpit = buildFamilyCockpit({ records: familyRecords, relations: familyRelations, documents: cockpitDocuments(documents, localDocuments), versions: versionHistory, now: new Date() });
  const important = cockpit.priorities.slice(0, 6);
  const openCases = cockpit.cases.filter((item) => !/(erledigt|abgeschlossen|geschlossen|archiviert)/i.test(item.status));
  const nextTask = cockpit.todos.find((item) => item.displayStatus !== "done");
  const nextDeadline = cockpit.priorities.find((item) => item.sourceType === "deadline");
  const latestNews = cockpit.relevantNews[0];
  const personalLifeAreas = buildStoredPersonalLifeAreas([...localDocuments, ...documents]);
  const updatedCandidates = [...cockpit.objects.map((item) => item.updatedAt), ...cockpit.cases.map((item) => item.updatedAt), ...cockpit.relevantNews.map((item) => item.occurredAt)]
    .filter((value) => value && !Number.isNaN(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const latestUpdate = updatedCandidates[0] ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(updatedCandidates[0])) : "–";
  const hasCockpitData = cockpit.objects.length > 0 || openCases.length > 0 || !!nextTask || !!nextDeadline || !!latestNews;
  // U6/U10/U11: jeder genannte Punkt öffnet genau diesen Punkt an seinem Zuhause (Termin → Fristen, Dokument → Bibliothek).
  const oeffne = (art: string, id: string, geschuetzt = false) => { const ziel = datensatzZiel(familyRecords, art, id, geschuetzt); onGo(ziel.section as SectionId, ziel.targetId); };
  // 2.28.39 (Klaus 08.11.2026): „So fängst du an“ ganz oben – Speicherort, erstes Dokument, erste Erinnerung.
  const ersteSchritte = { speicher: vaultConnected, dokument: localDocuments.length + documents.length > 0, erinnerung: familyRecords.some((r) => ["reminder", "deadline", "task"].includes(r.recordType)) };
  return <>
    <ErsteSchritte erledigt={ersteSchritte} onSchritt={onErsterSchritt}/>
    {onSichern && <SicherungErinnerung letzte={letzteSicherung} hatDaten={localDocuments.length + familyRecords.length > 0} onSichern={onSichern}/>}
    <section className="family-hero"><div><span className="eyebrow">Privater Aktenschrank</span><h1>Alles Wichtige an einem Ort</h1><p>Eine sichere Familienakte, die nicht nur dokumentiert und ordnet, sondern auch unterstützt, erinnert und mitdenkt – bei Unterlagen, Fragen, E-Mails, Terminen und allen wichtigen Familienbereichen.</p></div><div className="hero-cockpit"><div className="hero-cockpit-heading"><span><FolderHeart size={23}/><strong>Cockpit</strong></span><InfoPopover label="Cockpit erklären" text="Hier siehst du vorhandene Objekte, offene Vorgänge und die nächsten wichtigen Schritte. Ein Tipp auf einen Punkt öffnet genau diesen Punkt."/></div><div className="hero-cockpit-open">
      {hasCockpitData ? <div className="hero-cockpit-grid"><button type="button" onClick={() => onGo("cockpit", undefined, { ziel: "#cockpit-objects" })} data-hero-ziel="objekte"><small>Aktive Objekte</small><strong>{cockpit.objects.length}</strong></button><button type="button" onClick={() => onGo("cockpit", undefined, { ziel: "#cockpit-cases" })} data-hero-ziel="vorgaenge"><small>Offene Vorgänge</small><strong>{openCases.length}</strong></button>{nextTask ? <button type="button" onClick={() => oeffne("task", nextTask.id, nextTask.sensitive)} data-hero-ziel="aufgabe"><small>Nächste Aufgabe</small><strong>{nextTask.title}</strong></button> : <span><small>Nächste Aufgabe</small><strong>Keine offene Aufgabe</strong></span>}{nextDeadline ? <button type="button" onClick={() => oeffne(nextDeadline.sourceType, nextDeadline.sourceId, nextDeadline.sensitive)} data-hero-ziel="frist"><small>Nächste Frist</small><strong>{nextDeadline.title}</strong></button> : <span><small>Nächste Frist</small><strong>Keine Frist vorgemerkt</strong></span>}{latestNews ? <button type="button" onClick={() => oeffne(latestNews.sourceType, latestNews.sourceId, latestNews.sensitive)} data-hero-ziel="neu"><small>Zuletzt wichtig</small><strong>{latestNews.sensitive ? "Geschützter neuer Eintrag" : latestNews.title}</strong></button> : <span><small>Zuletzt wichtig</small><strong>Kein neuer Eintrag</strong></span>}<span><small>Aktualisiert</small><strong>{latestUpdate}</strong></span></div> : <span className="hero-cockpit-empty">Noch keine aktuellen Objektinformationen vorhanden.</span>}
      <button type="button" className="hero-cockpit-link" onClick={() => onGo("cockpit")}>Cockpit öffnen <ChevronRight size={16}/></button>
    </div></div></section>
    <section className="card recent-card priority-recent"><div className="card-heading"><div><span className="eyebrow dark">Aktueller Stand</span><div className="start-title-row"><h2 className="start-section-title">Zuletzt wichtig</h2><InfoPopover label="Zuletzt wichtig erklären" text="Hier stehen vorhandene Punkte, die jetzt oder bald deine Aufmerksamkeit benötigen. Überfällige und heute fällige Punkte stehen zuerst. Erledigte Aufgaben werden hier nicht mehr angezeigt."/></div></div><div className="recent-heading-actions"><button className="button secondary compact-button" onClick={() => onGo("cockpit")}>Arbeitsübersicht öffnen</button><button className="text-link news-entry-link" onClick={() => onGo("changelog")}>Was gibt’s Neues? <ChevronRight size={16}/></button></div></div>
      <div className="vault-actions-heading"><span>Datentresor &amp; Sicherung</span><InfoPopover label="Datentresor und Sicherung erklären" text="Hier verbindest du deinen Datentresor, legst Unterlagen ab und startest den kontrollierten Abgleich. Gelb bedeutet offen, Grün erfolgreich und Grau derzeit nicht möglich."/></div>
      <div className="quick-strip vault-action-strip" aria-label="Datentresor und Sicherung">
        <div className="vault-action-item"><button className={`vault-action state-${vaultActionState}`} onClick={() => onGo("security")} aria-label={`${demoActive() ? "Demo-Ablage bereit" : vaultConnected ? "Datentresor verbunden" : vaultRemembered ? "Datentresor erneut verbinden" : "Eigenen Datentresor wählen"}. Status: ${actionStateLabel[vaultActionState]}`}><HardDrive/><span><strong>{demoActive() ? "Demo-Ablage bereit" : vaultConnected ? "Datentresor verbunden" : vaultRemembered ? "Erneut verbinden" : "Eigenen Datentresor wählen"}</strong><small>{demoActive() || proDestination || vaultConnected ? connectedVaultDetails : vaultRemembered ? "Zugriff erneut freigeben" : "Noch kein eigener Datentresor gewählt"}</small></span></button><InfoPopover label="Datentresor verbinden erklären" text={demoActive() ? "Die Demo verwendet ausschließlich ihren getrennten lokalen Testbestand. Wähle deinen eigenen Datentresor erst nach Demo verlassen." : "Datentresor verbinden: Wähle deinen eigenen Ordner oder Pro-Tresor für Originalunterlagen. Der automatisch verfügbare Browserspeicher ist noch keine solche Auswahl. Vorhandene Dateien bleiben erhalten."}/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.upload}`} onClick={() => onStartIntake()} aria-label={`Neue Unterlage ablegen. Status: ${actionStateLabel[actionStates.upload]}`}><Upload/><span><strong>Neue Unterlage ablegen</strong></span></button><InfoPopover label="Neue Unterlage ablegen erklären" text="Öffnet den bestehenden Dokumenteneingang für eine einzelne Datei oder ein neues Dokument. Die Unterlage wird erst nach deiner Prüfung und Bestätigung gespeichert; das Original bleibt unverändert."/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.compare}`} onClick={onCompare} disabled={busy} aria-label={`Abgleich durchführen. Status: ${actionStateLabel[actionStates.compare]}`}><ClipboardCheck/><span><strong>Abgleich durchführen</strong><small>{newDocumentCount ? `${newDocumentCount} neue Datei${newDocumentCount === 1 ? "" : "en"}` : ""}</small></span></button><InfoPopover label="Abgleich durchführen erklären" text="Prüft den verbundenen Ordner einschließlich seiner Unterordner auf neue oder geänderte Dateien. Die vorhandene FaWoGa-Bestandsanalyse wird verwendet; Originaldateien bleiben unverändert."/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.update}`} onClick={onUpdate} disabled={busy} aria-label={`Akte aktualisieren. Status: ${actionStateLabel[actionStates.update]}`}><RefreshCw/><span><strong>Akte aktualisieren</strong><small>{reviewedDocumentCount ? `${reviewedDocumentCount} geprüft` : ""}</small></span></button><InfoPopover label="Akte aktualisieren erklären" text="Übernimmt ausschließlich bereits bestätigte Änderungen und Zuordnungen in die vorhandene Familienakte. Es entsteht keine zweite Dokumenten- oder Registerlogik."/></div>
      </div>
      {important.map((item) => <button onClick={() => oeffne(item.sourceType, item.sourceId, item.sensitive)} key={item.id}><span className={`priority-dot urgency-${item.urgency}`} aria-hidden="true"/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]} · {item.detail}</small></span><ChevronRight/></button>)}
    </section>
    <DocumentIntakePanel oneDriveConnected={!!oneDriveSummary} storageReady={storageReady} inboxFolderName={inboxFolderName} incomingFiles={incomingFiles} busy={intakeBusy} checkedAt={intakeCheckedAt} receipt={lastIntakeReceipt} onFile={onStartIntake} onStartDocumentScan={onStartDocumentScan} onSelectInbox={onSelectInbox} onScanInbox={onScanInbox} onScanOneDrive={onScanOneDrive} onGo={onGo}/>
    <MemoryCapturePanel key={memoryEditDraft?.draftId || memorySuggestedCaseId || "new-memory"} initialDraft={memoryEditDraft} suggestedCaseId={memorySuggestedCaseId} caseName={(() => { const id = memoryEditDraft?.suggestedCaseId || memorySuggestedCaseId; const r = id ? familyRecords.find((x) => x.id === id) : undefined; return r && cockpitRecordLabel(r) !== r.id ? cockpitRecordLabel(r) : undefined; })()} queueCount={memoryDrafts.length} openPointCount={openMemoryPoints} onQueue={onQueueMemory} onReview={onReviewMemory} onOpenQueue={onOpenMemoryQueue} onGo={onGo} receipt={lastMemoryReceipt} stammListe={stammListeAus(familyRecords)}/>
    <section className="section-heading" id="lebensbereiche"><div><span className="eyebrow dark">Lebensbereiche</span><div className="start-title-row"><h2 className="start-section-title">Direkt zur passenden Akte</h2><InfoPopover label="Lebensbereiche erklären" text="Hier wechselst du direkt in die thematisch passende Akte. Es werden nur die vorhandenen gemeinsamen Daten verwendet."/></div></div><button className="text-link" onClick={() => onGo("directory")}>Alle Unterbereiche <ChevronRight size={17}/></button></section>
    <section className="object-grid overview-life-grid">
      {objectAreas.map(({ id, title, text, status, Icon }) => <button className="object-card" key={id} onClick={() => onGo(id)}><div className="object-icon"><Icon/></div><span className={`badge ${status === "aktiv" ? "success" : "neutral"}`}>{status}</span><h3 className="start-card-title">{title}</h3><p>{text}</p><span className="open-label">Öffnen <ChevronRight size={16}/></span></button>)}
      {personalLifeAreas.map((area) => <button className="object-card personal-life-area-card" key={`personal-${area.name}`} onClick={() => onOpenLifeArea(area.name)}><div className="object-icon"><FolderHeart/></div><span className="badge success">persönlich</span><h3 className="start-card-title">{area.name}</h3><p>{area.documentCount} gespeicherte {area.documentCount === 1 ? "Unterlage ist" : "Unterlagen sind"} diesem Lebensbereich zugeordnet.</p><span className="open-label">Öffnen <ChevronRight size={16}/></span></button>)}
    </section>
    <section className={`system-status-bar status-${systemStatus}`} aria-label="Status der Systemprüfung">
      <div className="system-status-main"><span className="system-status-symbol" aria-hidden="true">{currentSystemReport ? levelSymbol[currentSystemReport.overall] : "⚪"}</span><div><div className="start-title-row"><h2 className="start-section-title">Systemprüfung</h2><InfoPopover label="Systemprüfung erklären" text="Die Systemprüfung kontrolliert, ob wichtige Bereiche der Familienakte, Verknüpfungen, Datenschutz, Dokumente und technische Funktionen ordnungsgemäß arbeiten."/></div><strong>{systemStatusText}</strong><small>{currentSystemReport ? `Letzte vollständige Prüfung: ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(currentSystemReport.checkedAt))}` : "Noch kein Prüfergebnis auf diesem Gerät."}</small><em>{systemProblemSummary}</em></div></div>
      <div className="system-open-card"><button className="button primary system-open-button" onClick={() => onGo("systemcheck")}><ShieldCheck size={18}/> Systemprüfung öffnen</button></div>
    </section>
  </>;
}

function DocumentIntakePanel({ oneDriveConnected, storageReady, inboxFolderName, incomingFiles, busy, checkedAt, receipt, onFile, onStartDocumentScan, onSelectInbox, onScanInbox, onScanOneDrive, onGo }: {
  oneDriveConnected: boolean; storageReady: boolean; inboxFolderName: string; incomingFiles: IncomingFolderFile[]; busy: boolean; checkedAt: string | null; receipt: IntakeReceipt | null;
  onFile: (file?: File | null, source?: DocumentIntakeSource) => void; onStartDocumentScan: (files: File[]) => void; onSelectInbox: () => void; onScanInbox: () => void; onScanOneDrive: () => void; onGo: (id: SectionId, targetId?: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const lastChecked = checkedAt ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(checkedAt)) : "noch nicht geprüft";
  // Prüfbericht H4: eine Datei → gleich der Prüfdialog; mehrere → alle in die Eingangszentrale (vorher ging nur die erste
  // weiter). Derselbe Weg wie „Teilen → Familienakte“ (Ereignis familienakte:dateien): Warteschlange, dann Eingangszentrale.
  const acceptFiles = (files: FileList | null, source: DocumentIntakeSource) => {
    const alle = files ? Array.from(files) : [];
    if (alle.length === 1) onFile(alle[0], source);
    else if (alle.length > 1) window.dispatchEvent(new CustomEvent("familienakte:dateien", { detail: { files: alle, quelle: source } }));
  };
  return <section className="document-intake card" aria-labelledby="document-intake-title">
    <div className="card-heading document-intake-heading"><div><span className="eyebrow dark">Gemeinsamer Dokumenteneingang</span><div className="start-title-row"><h2 className="start-section-title" id="document-intake-title">Neue Dokumente erfassen</h2><InfoPopover label="Dokumenteneingang erklären" text="So nutzt du den Dokumenteneingang am besten: Einzelne Dateien kannst du direkt hineinziehen. Mehrere zusammengehörende Dateien wählst du gemeinsam aus. Auf dem Handy kannst du Dokumente fotografieren; am PC kannst du einen Eingangsordner oder einen OneDrive-Ordner verwenden. Die Familienakte schlägt Zuordnungen vor, du bestätigst die endgültige Zuordnung selbst. Originaldateien bleiben unverändert."/></div></div><button className="text-link" onClick={() => onGo("help")}>Hilfe <ChevronRight size={16}/></button></div>
    <input ref={inputRef} className="sr-only" type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.eml,.zip" onChange={(event) => { acceptFiles(event.target.files, "file-picker"); event.currentTarget.value = ""; }}/>
    <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { const files = event.target.files ? Array.from(event.target.files) : []; if (files.length) onStartDocumentScan(files); event.currentTarget.value = ""; }}/>
    <div className="document-intake-grid">
      <article className={`intake-method-card intake-drop ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFiles(event.dataTransfer.files, "drag-drop"); }}>
        <div className="intake-method-heading"><h3 className="start-card-title">Dokument hier hineinziehen</h3><InfoPopover label="Dateien hineinziehen erklären" text="Hier kannst du eine oder mehrere Dateien direkt hineinziehen. Die Familienakte erkennt den Dateityp und bereitet die Unterlagen zur Prüfung vor."/></div><div className="intake-method-action"><Upload size={26}/><span>Datei ablegen oder bewusst auswählen</span><button className="button primary compact-button" type="button" onClick={() => inputRef.current?.click()}>Datei auswählen</button></div>
      </article>
      <article className="intake-method-card intake-camera"><div className="intake-method-heading"><h3 className="start-card-title">Dokument fotografieren</h3><InfoPopover label="Dokument fotografieren erklären" text="Diese Funktion ist besonders für Smartphone und Tablet gedacht. Damit kannst du ein Papierdokument fotografieren und anschließend in der Familienakte prüfen und zuordnen."/></div><button className="intake-source" type="button" onClick={() => onStartDocumentScan([])} disabled={busy} data-dokument-scannen><Camera/><span><strong>Fotofunktion öffnen</strong>{!storageReady && <small>Zuerst lokalen Datentresor verbinden</small>}</span><ChevronRight/></button></article>
      <article className="intake-method-card intake-desktop"><div className="intake-method-heading"><h3 className="start-card-title">Eingangsordner auswählen</h3><InfoPopover label="Eingangsordner erklären" text="Ein Ordner, in den du PDFs und Scans nur hineinkopierst (PC, SD-Karte, USB, Netzordner). Die App holt sie von selbst in Blöcken zu 20 in die Eingangszentrale, prüft vorher den freien Speicher und macht nach einem Abbruch weiter – solange die App offen ist, in der Android-App mit Dauer-Meldung. Was schon geholt wurde, kommt nicht noch einmal. Abgelegt wird erst nach deiner Bestätigung (Sammelbestätigung)."/></div><button className="intake-source" type="button" onClick={inboxFolderName ? onScanInbox : onSelectInbox} disabled={busy}><Folder/><span><strong>{inboxFolderName ? "Eingangsordner jetzt prüfen" : "Ordner auswählen"}</strong>{inboxFolderName && <small>„{inboxFolderName}“</small>}</span><ChevronRight/></button></article>
      <article className="intake-method-card intake-desktop"><div className="intake-method-heading"><h3 className="start-card-title">OneDrive-Familienordner prüfen</h3><InfoPopover label="OneDrive-Ordner erklären" text="Hier kannst du einen bewusst ausgewählten OneDrive-Ordner prüfen lassen. Es werden keine anderen OneDrive-Ordner automatisch durchsucht."/></div><button className="intake-source" type="button" onClick={onScanOneDrive} disabled={busy}><Cloud/><span><strong>OneDrive-Ordner prüfen</strong><small>{oneDriveConnected ? `Verbunden · letzte Prüfung: ${lastChecked}` : "Noch kein lokaler OneDrive-Ordner verbunden"}</small></span><ChevronRight/></button></article>
    </div>
    {busy && <div className="intake-progress" role="status"><RefreshCw className="spin"/><span>Der freigegebene Ordner wird geprüft. Originaldateien bleiben unverändert.</span></div>}
    {/* Prüfbericht M1: eine Liste – die Eingangszentrale. Die Startseite zählt nur und führt dorthin. */}
    {incomingFiles.length > 0 && <div className="intake-results" id="intake-new-files"><button className="intake-count" onClick={() => onGo("inbox")} data-zur-eingangszentrale>{incomingFiles.length} neue Datei{incomingFiles.length === 1 ? " wartet" : "en warten"} in der Eingangszentrale <ChevronRight size={16}/></button></div>}
    {receipt && <button className="intake-receipt" onClick={() => onGo("documents", receipt.id)} data-gespeichert><CheckCircle2/><span><strong>Gespeichert ✓ – Dokument erfasst</strong><small>{receipt.title} · {receipt.category} · {receipt.source}</small></span><ChevronRight/></button>}
  </section>;
}

/** C: Personen und Organisationen zum Verknüpfen eines Tagebuch-Eintrags. */
function stammListeAus(records: FamilyRecordUnion[]) {
  return records.filter((r) => (r.recordType === "person" || r.recordType === "organisation") && r.status !== "archiviert")
    .map((r) => ({ id: r.id, name: stammLesen(r).name || cockpitRecordLabel(r) })).filter((x) => x.name && x.name !== x.id).sort((a, b) => a.name.localeCompare(b.name, "de"));
}
function MemoryCapturePanel({ initialDraft, suggestedCaseId, caseName, queueCount, onQueue, onReview, onGo, receipt, onChronologie, stammListe }: {
  /** C: Personen und Organisationen zum Verknüpfen beim Erfassen. */
  stammListe?: Array<{ id: string; name: string }>;
  /** B7: Name des vorgeschlagenen Vorgangs statt seiner Kennnummer. */
  caseName?: string;
  /** A3 (09.11.): Auf der Tagebuch-Seite selbst führt „Tagebuch öffnen“ zur Chronologie (vorher: Seitenwechsel auf dieselbe Seite = nichts). */
  onChronologie?: () => void;
  initialDraft: MemoryDraft | null; queueCount: number; openPointCount?: number;
  suggestedCaseId?: string | null;
  onQueue: (draft: MemoryDraft) => Promise<MemoryDraftEntry | null>; onReview: (draft?: MemoryDraft | null) => Promise<void>;
  onOpenQueue?: () => void; onGo: GehMitZiel; receipt: MemoryReceipt | null;
}) {
  const [text, setText] = useState(initialDraft?.text || "");
  const [files, setFiles] = useState<File[]>(initialDraft?.files || []);
  const [dictated, setDictated] = useState(initialDraft?.captureType === "sprache" || initialDraft?.captureType === "kombination");
  const [working, setWorking] = useState(false);
  const [hint, setHint] = useActivityMessage("error", "Tagebuch");
  const mediaRef = useRef<HTMLInputElement>(null);
  const captureType: MemoryCaptureType = text.trim() && files.length ? "kombination" : files.some((file) => file.type.startsWith("video/")) ? "video" : files.length ? "foto" : dictated ? "sprache" : "text";
  const hasInput = !!text.trim() || files.length > 0;
  const currentDraft: MemoryDraft = { draftId: initialDraft?.draftId, text, files, captureType, originalTranscript: dictated ? text : undefined, suggestedCaseId: initialDraft?.suggestedCaseId || suggestedCaseId || undefined };
  useEffect(() => {
    if (!hasInput) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [hasInput]);
  const clear = () => { setText(""); setFiles([]); setDictated(false); setHint(""); if (mediaRef.current) mediaRef.current.value = ""; };
  const leaveToMemory = async () => {
    if (!hasInput) { if (onChronologie) onChronologie(); else onGo("memory"); return; }
    if (await askConfirm("Dieser Tagebuch-Eintrag ist noch nicht gespeichert. Als Entwurf zur Seite legen?")) {
      const saved = await onQueue(currentDraft);
      if (saved) { clear(); if (onChronologie) onChronologie(); else onGo("memory"); }
      return;
    }
    if (await askConfirm("Aktuelle Eingabe verwerfen und das Tagebuch öffnen?")) { if (onChronologie) onChronologie(); else onGo("memory"); }
  };
  const [stimmung, setStimmung] = useState<Stimmung | undefined>(initialDraft?.stimmung);
  const [verknuepft, setVerknuepft] = useState<string[]>(initialDraft?.verknuepft || []);
  const draftMitZusatz: MemoryDraft = { ...currentDraft, stimmung, verknuepft: verknuepft.length ? verknuepft : undefined };
  const leeren = () => { clear(); setStimmung(undefined); setVerknuepft([]); };
  const nochEinen = async () => {
    if (!hasInput) { setHint("Bitte zuerst etwas eingeben."); return; }
    setWorking(true); setHint("");
    if (await onQueue(draftMitZusatz)) leeren();
    setWorking(false);
  };
  const pruefen = async () => {
    if (!hasInput && !queueCount) { setHint("Bitte zuerst etwas eingeben."); return; }
    setWorking(true); setHint("");
    await onReview(hasInput ? draftMitZusatz : null);
    if (hasInput) leeren();
    setWorking(false);
  };
  const auswahl = (stammListe || []).filter((item) => !verknuepft.includes(item.id));
  // C (Rückmeldung 09.11.): ein Block statt drei Karten – Feld mit Mikrofon, Foto, Stimmung, Person/Organisation,
  // darunter „Eintrag prüfen“ und klein „Noch einen erfassen“. Erklärungen stehen im „?“, Zähler nur auf der Tagebuch-Seite.
  return <section className="memory-capture card" aria-labelledby="memory-capture-title" data-tagebuch-erfassen>
    <div className="card-heading"><div><div className="start-title-row"><h2 className="start-section-title" id="memory-capture-title">Was ist heute passiert?</h2><InfoPopover label="Was ist heute passiert? erklären" text="Dein privates Tagebuch: schreiben oder einsprechen, Fotos dazu, Stimmung wählen. Ein Tagebuch-Eintrag hat keine Glocke und keine Frist. „Eintrag prüfen“ zeigt Titel, Datum und Bezüge, bevor gespeichert wird. „Noch einen erfassen“ legt den Text als Entwurf zur Seite und macht das Feld frei für den nächsten. Verknüpfte Personen und Organisationen zeigen den Eintrag beim nächsten Termin mit ihnen wieder."/></div></div>{!onChronologie && <button className="text-link" onClick={() => void leaveToMemory()} data-zum-tagebuch>Zum Tagebuch <ChevronRight size={16}/></button>}</div>
    {(initialDraft?.suggestedCaseId || suggestedCaseId) && <div className="context-prefill"><ClipboardCheck size={18}/><span><strong>Bezug zu Vorgang vorgeschlagen</strong><small>{caseName ? `„${caseName}“ · ` : ""}wird vor dem endgültigen Speichern noch geprüft</small></span></div>}
    <label className="memory-text"><span className="sr-only">Was ist heute passiert?</span><div><textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} placeholder="Zum Beispiel: Besuch bei der Firma. Nächstes Mal eine Flasche Wein als Dankeschön mitbringen." data-tagebuch-text/><DictationButton value={text} onChange={setText} label="Tagebuch" onDictationStart={() => setDictated(true)}/></div></label>
    <div className="tagebuch-zusatz">
      <input ref={mediaRef} className="sr-only" type="file" multiple accept="image/*,video/*" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 12))}/>
      <button className="button secondary compact-button" type="button" onClick={() => mediaRef.current?.click()} data-tagebuch-foto><Camera size={17}/> Foto</button>
      <span className="tagebuch-stimmung" role="radiogroup" aria-label="Stimmung (freiwillig)">{STIMMUNGEN.map((s) => <button key={s.wert} type="button" role="radio" aria-checked={stimmung === s.wert} className={stimmung === s.wert ? "gewaehlt" : ""} onClick={() => setStimmung(stimmung === s.wert ? undefined : s.wert)} aria-label={`Stimmung ${s.wort}`} title={s.wort} data-stimmung={s.wert}>{s.zeichen}</button>)}</span>
      {auswahl.length > 0 && <select className="tagebuch-person" value="" onChange={(event) => { const id = event.target.value; if (id) setVerknuepft((liste) => [...liste, id]); }} aria-label="Person oder Organisation verknüpfen" data-tagebuch-person><option value="">+ Person oder Organisation</option>{auswahl.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
    </div>
    {(files.length > 0 || verknuepft.length > 0) && <div className="memory-file-chips">{files.map((file) => <span key={`${file.name}-${file.size}`}>{file.type.startsWith("video/") ? <Video size={14}/> : <Camera size={14}/>} {file.name}</span>)}{verknuepft.map((id) => <span key={id} data-tagebuch-verknuepft={id}>{stammListe?.find((item) => item.id === id)?.name || "Verknüpfung"} <button type="button" className="icon-button" onClick={() => setVerknuepft((liste) => liste.filter((x) => x !== id))} aria-label="Verknüpfung entfernen"><X size={13}/></button></span>)}</div>}
    {hint && <div className="form-error">{hint}</div>}
    <div className="tagebuch-aktionen"><button className="button primary" disabled={(!hasInput && !queueCount) || working} onClick={() => void pruefen()} data-tagebuch-pruefen><NotebookPen size={17}/> Eintrag prüfen</button><button className="text-link" disabled={!hasInput || working} onClick={() => void nochEinen()} data-tagebuch-noch-einen><Plus size={15}/> Noch einen erfassen</button></div>
    {receipt && <button className="intake-receipt" onClick={() => onGo("memory", receipt.id)}><CheckCircle2/><span><strong>Tagebuch-Eintrag gespeichert</strong><small>{receipt.title}{receipt.mediaCount ? ` · ${receipt.mediaCount} Foto${receipt.mediaCount === 1 ? "" : "s"}` : ""}</small></span><ChevronRight/></button>}
  </section>;
}

function MemoryReviewDialog({ draft, documents, records, relations, decisions, queuePosition, queueTotal, onClose, onOpenDocument, onSave }: {
  draft: MemoryDraft; documents: ContextDocument[]; records: FamilyRecordUnion[]; relations: FamilyRelation[]; decisions: ContextLinkDecision[]; queuePosition: number; queueTotal: number; onClose: (status?: MemoryDraftStatus) => void | Promise<void>;
  onOpenDocument: (id: string) => void | Promise<void>; onSave: (input: MemorySaveInput) => Promise<void>;
}) {
  const initial = useMemo(() => buildMemoryAnalysis({ originalText: draft.text, captureType: draft.captureType, records, relations, mediaCount: draft.files.length }), [draft, records, relations]);
  const [title, setTitle] = useState(initial.title);
  const [lifeArea, setLifeArea] = useState(initial.lifeArea);
  const [eventType, setEventType] = useState(initial.eventType);
  const [followUp, setFollowUp] = useState("");
  const [statementRows, setStatementRows] = useState(() => initial.statements.map((statement) => ({ ...statement, included: true })));
  const [selectedIds, setSelectedIds] = useState(() => new Set([...initial.selectedReferences.map((item) => item.id), ...(draft.suggestedCaseId ? [draft.suggestedCaseId] : []), ...(draft.verknuepft || [])]));
  const contextSuggestions = useMemo(() => {
    const suggestions = suggestIncomingMemoryContext({ documents, records, relations, decisions, text: draft.text, eventAt: initial.eventAt });
    if (!draft.suggestedCaseId || suggestions.some((item) => item.caseId === draft.suggestedCaseId)) return suggestions;
    const existingCase = records.find((record) => record.recordType === "case" && record.id === draft.suggestedCaseId);
    if (!existingCase) return suggestions;
    const label = String((existingCase.data as { title?: string }).title || existingCase.id);
    return [{ id: `event:incoming:${existingCase.id}`, sourceType: "event" as const, sourceId: "incoming-event:context", sourceLabel: draft.text.slice(0, 90) || "Neue Erinnerung", caseId: existingCase.id, caseLabel: label, confidence: "wahrscheinlich" as const, score: 60, reasons: ["aus diesem Vorgang heraus erfasst"], contextHash: `prefill-${existingCase.id}`, relatedMemoryIds: [], relatedDocumentIds: [], openPointEventIds: [], sensitive: false, requiresConfirmation: true as const }, ...suggestions];
  }, [documents, records, relations, decisions, draft.text, draft.suggestedCaseId, initial.eventAt]);
  const [chosenCaseId, setChosenCaseId] = useState(draft.suggestedCaseId || contextSuggestions[0]?.caseId || "");
  const [rejectedContext, setRejectedContext] = useState<ContextLinkSuggestion | undefined>();
  const [createTask, setCreateTask] = useState(false);
  const [createDeadline, setCreateDeadline] = useState(false);
  // „Erinnern lassen“ (Klaus 2026-11-05): erkannt aus „erinnere mich …“ oder von Hand; wird eine Aufgabe mit Termin und Kalender.
  const erkannt = useMemo(() => erinnerungAusText(draft.text), [draft.text]);
  const [erinnerung, setErinnerung] = useState<ErinnernWert | null>(null);
  const erinnern = Boolean(erinnerung);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [error, setError] = useActivityMessage();
  const calculated = useMemo(() => buildMemoryAnalysis({ originalText: draft.text, followUpAnswer: followUp, captureType: draft.captureType, records, relations, mediaCount: draft.files.length }), [draft, followUp, records, relations]);
  // C (09.11.): beim Erfassen gewählte Personen/Organisationen stehen in der Liste, auch wenn der Text sie nicht nennt.
  const mitVorwahl = (liste: MemoryAnalysis["candidates"]) => [...liste, ...(draft.verknuepft || []).filter((id) => !liste.some((x) => x.id === id)).flatMap((id) => { const r = records.find((x) => x.id === id && (x.recordType === "person" || x.recordType === "organisation")); return r ? [{ id: r.id, recordType: r.recordType as "person" | "organisation", label: cockpitRecordLabel(r), confidence: "bestätigt" as const }] : []; })];
  const analysis: MemoryAnalysis = { ...calculated, candidates: mitVorwahl(calculated.candidates), title: title.trim() || calculated.title, lifeArea, eventType: eventType.trim() || calculated.eventType, statements: statementRows.filter((item) => item.included && item.text.trim()).map(({ included: _included, ...item }) => item) };
  const close = async () => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setError("");
    try { await onClose(confirmed ? "bereit_zum_speichern" : "unbehandelt"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Der Entwurf konnte nicht zurückgestellt werden. Bitte erneut versuchen."); }
    finally { operation.current = false; setBusy(false); }
  };
  const save = async () => {
    if (operation.current) return;
    if (!confirmed) return setError("Bitte bestätige, dass dieser Eintrag mit den ausgewählten Angaben gespeichert werden darf.");
    operation.current = true; setBusy(true); setError("");
    try {
      const references = analysis.candidates.filter((item) => selectedIds.has(item.id)).map((item) => ({ recordType: item.recordType, id: item.id }));
      if (chosenCaseId && !references.some((item) => item.recordType === "case" && item.id === chosenCaseId)) references.push({ recordType: "case", id: chosenCaseId });
      await onSave({ originalText: draft.text, originalTranscript: draft.captureType === "sprache" || draft.captureType === "kombination" ? draft.text : undefined, followUpAnswer: followUp, captureType: draft.captureType, analysis, mediaFiles: draft.files, selectedReferences: references, createTask: createTask && !erinnern, createDeadline, rejectedContext, erinnerung: erinnerung || undefined });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Der Erinnerungseintrag konnte nicht gespeichert werden."); }
    finally { operation.current = false; setBusy(false); }
  };
  return <div className="modal-backdrop" role="presentation"><section className="modal memory-review" role="dialog" aria-modal="true" aria-labelledby="memory-review-title"><div className="modal-head"><div><span className="eyebrow dark">Memory {queuePosition} von {Math.max(queueTotal, 1)} · {confirmed ? "Bereit zum Speichern" : "In Bearbeitung"}</span><h2 id="memory-review-title">Erinnerung strukturieren</h2><p>Noch {Math.max(0, queueTotal - 1)} unbehandelte Ereignisse nach diesem Eintrag. Unklare Zuordnungen werden nicht automatisch übernommen.</p></div><button className="icon-button" disabled={busy} onClick={() => void close()} aria-label="Schließen"><X/></button></div>
    <div className="memory-original"><strong>Originaltext – bleibt unverändert</strong><p>{draft.text || "Nur Medien ausgewählt"}</p></div>
    {contextSuggestions.length > 0 && <section className="context-suggestion"><div><span className="eyebrow dark">Zusammenhang prüfen</span><h3>Passender vorhandener Vorgang gefunden</h3><p><strong>{contextSuggestions[0].caseLabel}</strong> · {contextSuggestions[0].confidence}</p><details><summary>Warum vorgeschlagen?</summary><ul>{contextSuggestions[0].reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div><div className="context-suggestion-actions"><button type="button" className="button primary" onClick={() => { setChosenCaseId(contextSuggestions[0].caseId); setRejectedContext(undefined); }}>Verknüpfen</button><label><span>Anderen Vorgang wählen</span><select value={chosenCaseId} onChange={(event) => { setChosenCaseId(event.target.value); setRejectedContext(undefined); }}><option value="">Noch nicht verknüpfen</option>{records.filter((record) => record.recordType === "case").map((record) => <option value={record.id} key={record.id}>{String((record.data as { title?: string }).title || record.id)}</option>)}</select></label><button type="button" className="button secondary" onClick={() => { setChosenCaseId(""); setRejectedContext(contextSuggestions[0]); }}>Nicht verknüpfen</button></div>{contextSuggestions[0].relatedDocumentIds.length > 0 && <div className="context-related-results"><strong>Passendes Dokument gefunden</strong>{contextSuggestions[0].relatedDocumentIds.map((id) => <button type="button" className="text-link" key={id} onClick={() => void onOpenDocument(id)}>{id} öffnen <ChevronRight size={15}/></button>)}</div>}</section>}
    <div className="form-grid"><label><span>Titel</span><VoiceInput value={title} onValueChange={(spokenValue) => setTitle(spokenValue)} speechLabel="Titel"/></label><label><span>Lebensbereich</span><select value={lifeArea} onChange={(event) => setLifeArea(event.target.value)}>{FAWOGA_LIFE_AREAS.map((area) => <option key={area}>{area}</option>)}</select></label><label><span>Ereignisart</span><VoiceInput value={eventType} onValueChange={(spokenValue) => setEventType(spokenValue)} speechLabel="Ereignisart"/></label><label><span>Zeitpunkt</span><input value={analysis.eventAt.replace("T", " ")} readOnly/></label></div>
    <section className="memory-statements"><span className="ui-heading-help"><h3>Erkannte Aussagen prüfen</h3><InfoPopover label="Erkannte Aussagen prüfen erklären" text={UI_HELP["Erkannte Aussagen prüfen"]}/></span>{statementRows.length ? statementRows.map((item, index) => <div className={!item.included ? "discarded" : ""} key={`statement-${index}`}><select aria-label={`Art der Aussage ${index + 1}`} value={item.kind} onChange={(event) => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, kind: event.target.value as MemoryStatementKind } : row))}><option value="tatsache">Tatsache</option><option value="beobachtung">Beobachtung</option><option value="einschätzung">Einschätzung</option></select><VoiceTextarea rows={2} value={item.text} onValueChange={(spokenValue) => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, text: spokenValue } : row))} speechLabel="Erkannte Aussage"/><button className="text-link" onClick={() => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, included: !row.included } : row))}>{item.included ? "Verwerfen" : "Übernehmen"}</button></div>) : <p>Aus den ausgewählten Medien wurde noch keine Textaussage abgeleitet.</p>}</section>
    {analysis.candidates.length > 0 && <section><span className="ui-heading-help"><h3>Vorhandene Datensätze verknüpfen</h3><InfoPopover label="Vorhandene Datensätze verknüpfen erklären" text={UI_HELP["Vorhandene Datensätze verknüpfen"]}/></span><div className="memory-reference-list">{analysis.candidates.map((item) => <label key={item.id} className="check-row"><input type="checkbox" value={item.id} checked={selectedIds.has(item.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })}/><span><strong>{item.label}</strong><small>{recordTypeDefinitions[item.recordType].label} · {item.confidence}</small></span></label>)}</div></section>}
    {analysis.assistantQuestion && <label className="memory-follow-up"><span><CircleHelp size={15}/> Eine gezielte Rückfrage</span><strong>{analysis.assistantQuestion}</strong><div><textarea rows={2} value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Antwort ist freiwillig"/><DictationButton value={followUp} onChange={setFollowUp} label="Antwort"/></div></label>}
    <ErinnernTeil erkannt={erkannt} titelVorschlag={erkannt?.wunsch ? erinnerungsTitel(draft.text) : analysis.taskProposal || analysis.title} onChange={setErinnerung} onKalender={() => { void close().then(() => window.dispatchEvent(new Event(KALENDER_OEFFNEN))); }}/>
    {(analysis.taskProposal || analysis.deadlineProposal) && <section className="memory-proposals"><span className="ui-heading-help"><h3>Nur nach Bestätigung anlegen</h3><InfoPopover label="Nur nach Bestätigung anlegen erklären" text={UI_HELP["Nur nach Bestätigung anlegen"]}/></span>{analysis.taskProposal && !erinnern && <label className="check-row"><input type="checkbox" checked={createTask} onChange={(event) => setCreateTask(event.target.checked)}/><span><strong>Aufgabe anlegen</strong><small>{analysis.taskProposal}</small></span></label>}{analysis.deadlineProposal && <label className="check-row"><input type="checkbox" checked={createDeadline} onChange={(event) => setCreateDeadline(event.target.checked)}/><span><strong>Frist anlegen</strong><small>{fmtDate(analysis.deadlineProposal)}</small></span></label>}</section>}
    <div className="memory-review-summary"><strong>{analysis.openPoint ? "Offener Punkt erkannt" : "Kein offener Punkt erkannt"}</strong><span>{analysis.openPoint?.question || "Der Eintrag kann als abgeschlossenes Ereignis gespeichert werden."}</span><small>{analysis.sensitive ? "Gesundheitsbezug: Anzeige außerhalb des geschützten Bereichs wird datensparsam gehalten." : `Sicherheit der Einordnung: ${analysis.confidence}`}</small></div>
    <label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Ja, diesen Eintrag lokal speichern</strong><small>Erst dadurch entstehen Chronologie, Suche, Vorgangsbezug und gegebenenfalls bestätigte Aufgabe oder Frist.</small></span></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => void close()}>Zur Warteschlange</button><button className="button primary" disabled={busy} onClick={save}>{busy ? "Wird gespeichert …" : "Bestätigt speichern"}</button></div></section></div>;
}

function MemoryCompletionDialog({ result, onClose, onGo, onNext }: { result: MemoryCompletion; onClose: () => void; onGo: (id: SectionId, targetId?: string) => void; onNext: () => void }) {
  const complete = result.remaining === 0;
  return <div className="modal-backdrop" role="presentation"><section className="modal memory-completion" role="dialog" aria-modal="true" aria-labelledby="memory-completion-title"><div className="modal-head"><div><span className="eyebrow dark">{complete ? "Alle Tagebuch-Einträge geprüft" : `${result.remaining} unbehandelte Ereignisse verbleiben`}</span><h2 id="memory-completion-title">✓ {complete ? "Alle Tagebuch-Einträge geprüft" : "Tagebuch-Eintrag bearbeitet und gespeichert"}</h2><p>{complete ? `${result.total} von ${result.total} Ereignissen geprüft und gespeichert.` : `„${result.title}“ wurde endgültig gespeichert. Die übrigen Entwürfe bleiben getrennt in der Warteschlange.`}</p></div><button className="icon-button" onClick={onClose} aria-label="Schließen"><X/></button></div>
    <div className="memory-completion-actions">{!complete && <button className="button primary" onClick={onNext}>Nächstes unbehandeltes Eintrag ändern</button>}<button className="button secondary" onClick={onNext}>{complete ? "Chronologie anzeigen" : "Zur Übersicht der unbehandelten Ereignisse"}</button><button className="button secondary" onClick={() => onGo("overview")}>Zur Startseite</button>{complete && <button className="button secondary" onClick={() => onGo("memory", result.id)}>Tagesübersicht öffnen</button>}{complete && <button className="button primary" onClick={() => onGo("overview")}>Weitere Erinnerung erfassen</button>}</div>
  </section></div>;
}

const memoryStatusLabel: Record<MemoryOpenStatus, string> = { offen: "offen", wartet_auf_rückmeldung: "wartet auf Rückmeldung", weitere_beobachtung: "weiter beobachten", termin_ausstehend: "Termin ausstehend", teilweise_erledigt: "teilweise erledigt", erledigt: "erledigt", keine_weitere_erinnerung: "keine weitere Erinnerung", unklar: "unklar" };

function RelatedContextPanel({ sourceType, sourceId, documents, records, relations, onGo, onOpenDocument, onUnlink, onChange, onTermin }: {
  sourceType: ContextSourceType; sourceId: string; documents: ContextDocument[]; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onGo: (id: SectionId, targetId?: string) => void; onOpenDocument: (id: string) => void | Promise<void>; onUnlink: (relationId: string) => void | Promise<void>;
  onChange: (sourceType: ContextSourceType, sourceId: string, previousRelationId: string | null, caseId: string) => void | Promise<void>;
  /** Aufgaben/Fristen an Ort und Stelle öffnen statt die Seite zu wechseln (Klaus 2026-11-05: kein Hin- und Herspringen). */
  onTermin?: (id: string) => void;
}) {
  const related = buildRelatedContext(sourceId, { documents, records, relations });
  const caseRelation = relations.find((relation) => relation.fromId === sourceId && relation.fromType === sourceType && relation.toType === "case");
  const cases = records.filter((record) => record.recordType === "case");
  if (!related.length && !cases.length) return null;
  const openRelated = (item: ReturnType<typeof buildRelatedContext>[number]) => {
    if (item.sensitive) { onGo("health"); return; }
    if (item.type === "document") { void onOpenDocument(item.id); return; }
    if (item.type === "event") { onGo("memory", item.id); return; }
    if ((item.type === "deadline" || item.type === "task") && onTermin) { onTermin(item.id); return; }
    if (item.type === "deadline" || item.type === "task" || item.type === "reminder") { onGo("reminders", item.id); return; }
    onGo("cockpit", item.id);
  };
  return <section className="related-context"><div className="card-heading"><div><span className="eyebrow dark">Gehört dazu</span><h3>Vorhandene Zusammenhänge</h3></div><span className="badge neutral">{related.length}</span></div>{related.length > 0 && <div className="related-context-list">{related.map((item) => <button key={`${item.type}-${item.id}`} onClick={() => openRelated(item)}><span className="badge neutral">{item.type === "case" ? "Vorgang" : item.type === "event" ? "Memory" : recordTypeDefinitions[item.type].label}</span><span><strong>{item.sensitive ? "Geschützter Eintrag" : item.label}</strong></span><ChevronRight size={16}/></button>)}</div>}<div className="context-link-controls"><label><span>Vorgangsbezug ändern</span><select value={caseRelation?.toId || ""} onChange={(event) => event.target.value && void onChange(sourceType, sourceId, caseRelation?.id || null, event.target.value)}><option value="">Kein Vorgang ausgewählt</option>{cases.map((record) => <option value={record.id} key={record.id}>{String((record.data as { title?: string }).title || record.id)}</option>)}</select></label>{caseRelation && <button className="text-link danger-link" onClick={() => void onUnlink(caseRelation.id)}>Verbindung lösen</button>}<small>Nur die Verbindung wird geändert oder gelöst. Die Datensätze selbst bleiben erhalten.</small></div></section>;
}

function MemoryCenter({ documents, records, relations, drafts, initialFocusId, vaultHandle, onQueue, onReview, onOpenDraft, onEditDraft, onDeleteDraft, onGo, onOpenDocument, onUnlink, onChange, onRefresh, onNotice }: {
  documents: ContextDocument[]; records: FamilyRecordUnion[]; relations: FamilyRelation[]; drafts: MemoryDraftEntry[]; initialFocusId: string | null; vaultHandle: FileSystemDirectoryHandle | null;
  onQueue: (draft: MemoryDraft) => Promise<MemoryDraftEntry | null>; onReview: (draft?: MemoryDraft | null) => Promise<void>; onOpenDraft: (draftId: string) => Promise<void>;
  onEditDraft: (draftId: string) => Promise<void>; onDeleteDraft: (draftId: string) => Promise<void>; onGo: (id: SectionId, targetId?: string) => void; onOpenDocument: (id: string) => void | Promise<void>;
  onUnlink: (relationId: string) => void | Promise<void>; onChange: (sourceType: ContextSourceType, sourceId: string, previousRelationId: string | null, caseId: string) => void | Promise<void>;
  onRefresh: () => Promise<void>; onNotice: (notice: Notice) => void;
}) {
  const memories = records.filter(isMemoryRecord).sort((a, b) => memoryData(b)!.eventAt.localeCompare(memoryData(a)!.eventAt));
  const openPoints = buildMemoryOpenPoints(records);
  const [selectedId, setSelectedId] = useState(initialFocusId || memories[0]?.id || null);
  const [notizAuf, setNotizAuf] = useState<string | null>(null); // Auge in der Chronologie (Klaus 2026-11-06)
  const [showSummary, setShowSummary] = useState(false);
  const [draftDirection, setDraftDirection] = useState<"oldest" | "newest">("oldest");
  const selected = memories.find((item) => item.id === selectedId) || null;
  const selectedData = selected ? memoryData(selected) : null;
  const today = buildTodayMemorySummary(records);
  const orderedDrafts = sortMemoryDraftQueue(drafts, draftDirection);
  useEffect(() => { if (initialFocusId) setSelectedId(initialFocusId); }, [initialFocusId]);
  // U5: Auswahl auf derselben Seite – Detailkarte ins Bild holen (am Handy liegt sie sonst außerhalb) und markieren.
  const zeigeEintrag = (id: string) => { setSelectedId(id); gleichZumZiel(".memory-detail", { nurWennNoetig: true }); };
  const changeOpenStatus = async (eventId: string, status: MemoryOpenStatus) => {
    if (!vaultHandle) { onGo("security"); return; }
    if (!await askConfirm(`Soll dieser offene Punkt wirklich auf „${memoryStatusLabel[status]}“ gesetzt werden?`)) return;
    try { await updateLocalMemoryOpenPointStatus(vaultHandle, eventId, status); await onRefresh(); onNotice({ kind: "success", text: "Der Status des Tagebuch-Eintrags wurde nach deiner Bestätigung geändert und protokolliert." }); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Status konnte nicht geändert werden." }); }
  };
  const openMedia = async (eventId: string, mediaId: string) => {
    if (!vaultHandle) { onGo("security"); return; }
    try { const file = await readLocalMemoryMediaFile(vaultHandle, eventId, mediaId); openFile(file); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Das Medium konnte nicht geöffnet werden." }); }
  };
  // Klaus 2026-11-05: jederzeit änderbar – eigenes Fenster statt zweier Abfragen.
  const [bearbeiten, setBearbeiten] = useState(false);
  const [terminId, setTerminId] = useState<string | null>(null);
  const terminRecord = terminId ? records.find((r) => r.id === terminId) || null : null;
  const editSavedMemory = async () => {
    if (!vaultHandle || !selected || !selectedData) { onGo("security"); return; }
    setBearbeiten(true);
  };
  // Glocke in der Chronologie: aktive Erinnerung mit Tag und Uhrzeit (Klaus 2026-11-05)
  const erinnerungZu = (eventId: string) => {
    // U17: dieselbe Regel wie Glocke und Kalender – zurückgestellte und gelöschte läuten nicht, also auch kein 🔔.
    const t = records.find((r) => (r.recordType === "task" || r.recordType === "deadline") && !["erledigt", "zurückgestellt", "archiviert"].includes(r.status) && relations.some((rel) => rel.fromId === r.id && rel.toId === eventId));
    const d = t?.data as { dueAt?: string; dueTime?: string } | undefined;
    return d?.dueAt ? `${new Date(`${d.dueAt}T00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}${d.dueTime ? `, ${d.dueTime} Uhr` : ""}` : null;
  };
  const verknuepfteAufgaben = selected ? records.filter((r) => (r.recordType === "task" || r.recordType === "deadline") && r.status !== "erledigt" && relations.some((rel) => rel.fromId === r.id && rel.toId === selected.id)) : [];
  const deleteSavedMemory = async () => {
    if (!vaultHandle || !selected) { onGo("security"); return; }
    try {
      const impact = await getLocalMemoryDeleteImpact(vaultHandle, selected.id);
      // U10: eine Regel wie am Mülleimer – die Notiz geht mit ihrer Erinnerung (Aufgabe aus der Notiz).
      const n = impact.linkedScheduleCount;
      if (!await askConfirm(`Diesen Tagebuch-Eintrag${n ? ` und ${n === 1 ? "seine Erinnerung" : `seine ${n} Erinnerungen`}` : ""} löschen? Er kommt in den Papierkorb und lässt sich von dort zurückholen. Gemeinsam verwendete Personen, Organisationen, Objekte, Vorgänge und Dokumente bleiben erhalten.`)) return;
      await deleteLocalMemoryRecord(vaultHandle, selected.id, { keepLinkedSchedules: false });
      setSelectedId(null);
      await onRefresh();
      onNotice({ kind: "success", text: "Der Tagebuch-Eintrag liegt im Papierkorb (unten auf dieser Seite) und lässt sich dort wiederherstellen." });
    } catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Tagebuch-Eintrag konnte nicht gelöscht werden." }); }
  };
  return <><PageTitle icon={<BookHeart/>} title="Tagebuch" text="Dein privates Tagebuch: Ereignisse, Beobachtungen, Fotos und Stimmung – lokal gespeichert und mit vorhandenen Akten verknüpft."/>
    <MemoryCapturePanel initialDraft={null} queueCount={drafts.length} openPointCount={openPoints.length} onQueue={onQueue} onReview={onReview} onOpenQueue={() => hierZumZiel("#memory-draft-queue")} onGo={onGo} receipt={null} onChronologie={() => hierZumZiel("#memory-chronologie")} stammListe={stammListeAus(records)}/>
    {(drafts.length > 0 || openPoints.length > 0) && <div className="tagebuch-zaehler" data-tagebuch-zaehler>{drafts.length > 0 && <button type="button" onClick={() => hierZumZiel("#memory-draft-queue")} data-zaehler-entwuerfe><strong>{drafts.length}</strong> Noch zu prüfende Tagebuch-Einträge</button>}{openPoints.length > 0 && <button type="button" onClick={() => hierZumZiel("#memory-open-points")} data-zaehler-rueckfragen><strong>{openPoints.length}</strong> Rückfragen zu gespeicherten Einträgen</button>}</div>}
    {drafts.length > 0 && <section className="card memory-draft-queue" id="memory-draft-queue"><div className="card-heading"><div><span className="ui-heading-help"><h2>Noch zu prüfende Tagebuch-Einträge</h2><InfoPopover label="Noch zu prüfende Tagebuch-Einträge erklären" text={UI_HELP["Noch zu prüfende Tagebuch-Einträge"]}/></span></div><div className="memory-queue-heading"><span className="badge neutral">{drafts.length}</span><button className="text-link" onClick={() => setDraftDirection((value) => value === "oldest" ? "newest" : "oldest")}>{draftDirection === "oldest" ? "Älteste zuerst" : "Neueste zuerst"}</button></div></div>
      {orderedDrafts.length ? <div className="memory-draft-list">{orderedDrafts.map((draft, index) => <article key={draft.id}><button className="memory-draft-main" onClick={() => void onOpenDraft(draft.id)}><span className="memory-draft-number">{index + 1}</span><span><small>Vorläufiger Titel</small><strong>{draft.provisionalTitle}</strong><em>{draft.originalText ? `${draft.originalText.slice(0, 150)}${draft.originalText.length > 150 ? "…" : ""}` : "Nur Medien ausgewählt"}</em><small>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.capturedAt))} · {draft.media.length} Medium{draft.media.length === 1 ? "" : "en"}</small></span><span className={`badge memory-draft-${draft.status}`}>{draft.status === "in_bearbeitung" ? "In Bearbeitung" : draft.status === "bereit_zum_speichern" ? "Bereit zum Speichern" : "Unbehandelt"}</span><ChevronRight/></button><div className="memory-draft-actions"><button className="text-link" onClick={() => void onOpenDraft(draft.id)}>Prüfen</button><button className="text-link" onClick={() => void onEditDraft(draft.id)}>Ergänzen</button><button className="text-link danger-link" onClick={() => void onDeleteDraft(draft.id)}>Entwurf löschen</button></div></article>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Nichts mehr zu prüfen</strong></div>}
    </section>}
    <section className="memory-center-grid"><article className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Heute im Überblick</h2><InfoPopover label="Heute im Überblick erklären" text="Was heute im Tagebuch steht. „Tag zusammenfassen“ zeigt die bestätigten Einträge des Tages mit Uhrzeit. Noch nicht geprüfte Einträge zählen erst nach dem Speichern mit."/></span><p>{fmtDate(today.date)} · {today.events.length} bestätigte Ereignisse · {drafts.length} noch zu prüfen</p></div><button className="button secondary compact-button" onClick={() => setShowSummary((value) => !value)}>{showSummary ? "Zusammenfassung schließen" : "Tag zusammenfassen"}</button></div>{showSummary && <div className="memory-day-summary">{today.events.length ? today.events.map((item) => <button key={item.id} onClick={() => zeigeEintrag(item.id)}><strong>{item.title}</strong><small>{item.eventAt.slice(11, 16)} Uhr</small></button>) : <p>Für heute ist noch kein bestätigtes Ereignis gespeichert.</p>}{drafts.length > 0 && <button onClick={() => hierZumZiel("#memory-draft-queue")}><strong>{drafts.length} Tagebuch-Einträge sind noch nicht geprüft</strong><small>Sie gehören noch nicht zur endgültigen Tageszusammenfassung.</small></button>}</div>}</article>
</section>
    {openPoints.length > 0 && <section className="card" id="memory-open-points"><div className="card-heading"><div><span className="ui-heading-help"><h2>Rückfragen zu gespeicherten Einträgen</h2><InfoPopover label="Rückfragen zu gespeicherten Einträgen erklären" text={UI_HELP["Rückfragen zu gespeicherten Einträgen"]}/></span></div><span className="badge neutral">{openPoints.length}</span></div>{openPoints.length ? <div className="memory-open-list">{openPoints.map((point) => <article key={point.eventId}><button onClick={() => point.sensitive ? onGo("health") : zeigeEintrag(point.eventId)}><span><strong>{point.title}</strong><small>{point.lifeArea} · {memoryStatusLabel[point.status]}</small><small>{point.sensitive ? "Einzelheiten im geschützten Gesundheitsbereich" : point.question}</small></span><ChevronRight/></button><div><button className="text-link" onClick={() => void changeOpenStatus(point.eventId, "erledigt")}>Als erledigt bestätigen</button><button className="text-link" onClick={() => void changeOpenStatus(point.eventId, "weitere_beobachtung")}>Weiter beobachten</button></div></article>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Keine Rückfragen</strong></div>}</section>}
    <section className="memory-history"><article className="card" id="memory-chronologie"><div className="card-heading"><div><span className="ui-heading-help"><h2>Chronologie</h2><InfoPopover label="Chronologie erklären" text={UI_HELP["Chronologie"]}/></span></div><span className="badge neutral">{memories.length}</span></div>{memories.length ? <div className="memory-event-list">{memories.map((record) => { const data = memoryData(record)!; return <div className={`memory-event-zeile${notizAuf === record.id ? " offen" : ""}`} key={record.id}>{(() => { const titel = data.sensitive ? "Geschützter Gesundheitseintrag" : data.title; const wann = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.eventAt)); const glocke = erinnerungZu(record.id); const auf = notizAuf === record.id; return <><div className="fz-kopf fz-voll"><button className={selectedId === record.id ? "active" : ""} onClick={() => data.sensitive ? onGo("health") : zeigeEintrag(record.id)}><span className="memory-event-icon">{data.media.some((item) => item.kind === "video") ? <Video/> : data.media.length ? <Camera/> : <BookHeart/>}</span><span className="mk-text"><strong><FlachText text={titel} ganz={auf}/></strong><small>{wann} · {data.lifeArea}{glocke ? <span className="memory-glocke" data-memory-glocke> · 🔔 {glocke}</span> : null}</small></span></button>{!data.sensitive && <KnopfLeiste titel={titel}>{vaultHandle && <StiftKnopf titel={titel} onClick={() => { setSelectedId(record.id); setBearbeiten(true); }} data-memory-aendern={record.id}/>}{vaultHandle && <NotizLoeschen id={record.id} titel={data.title} vaultHandle={vaultHandle} onGeloescht={async (text) => { setNotizAuf(null); if (selectedId === record.id) setSelectedId(null); await onRefresh(); onNotice({ kind: "success", text }); }}/>}<AugeKnopf offen={auf} titel={titel} onClick={() => setNotizAuf(auf ? null : record.id)} data-memory-auge/></KnopfLeiste>}</div>{auf && <div className="fz-offen" data-memory-offen><div className="button-row"><button type="button" className="button secondary" onClick={() => zeigeEintrag(record.id)}><BookHeart size={16}/> Öffnen</button></div></div>}</>; })()}</div>; })}</div> : <div className="empty-state"><BookHeart size={32}/><strong>Noch keine Tagebuch-Einträge</strong><span>Neue Einträge werden erst nach deiner Bestätigung angelegt.</span></div>}</article>
    <article className="card memory-detail" data-sprung-ziel={selected?.id}>{selectedData && selected ? <><span className="eyebrow dark">{selectedData.eventType}</span><h2>{selectedData.sensitive ? "Geschützter Gesundheitseintrag" : selectedData.title}</h2>{selectedData.sensitive ? <div className="protected-dossier"><ShieldCheck/><div><strong>Medizinische Einzelheiten bleiben geschützt</strong><p>Öffne den Gesundheitsbereich für diesen Inhalt.</p><button className="button secondary" onClick={() => onGo("health")}>Gesundheitsakte öffnen</button></div></div> : <><div className="memory-original"><strong>Originaltext</strong><p>{selectedData.originalText || "Kein Text hinterlegt"}</p></div><dl className="memory-meta"><div><dt>Lebensbereich</dt><dd>{selectedData.lifeArea}</dd></div><div><dt>Aufgenommen</dt><dd>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedData.eventAt))}</dd></div><div><dt>Einordnung</dt><dd>{selectedData.confidence}</dd></div></dl><ErinnerungKasten aufgaben={verknuepfteAufgaben} onAendern={() => void editSavedMemory()}/>{selectedData.media.length > 0 && <div className="memory-media-list"><h3>Lokale Medien</h3>{selectedData.media.map((item) => <button key={item.id} onClick={() => void openMedia(selected.id, item.id)}>{item.kind === "video" ? <Video/> : <Camera/>}<span><strong>{item.name}</strong><small>{fmtBytes(item.sizeBytes)} · lokal öffnen</small></span></button>)}</div>}{selectedData.openPoint && <div className="memory-review-summary"><strong>{memoryStatusLabel[selectedData.openPoint.status]}</strong><span>{selectedData.openPoint.question}</span><small>{selectedData.openPoint.reason}</small></div>}<RelatedContextPanel sourceType="event" sourceId={selected.id} documents={documents} records={records} relations={relations} onGo={onGo} onOpenDocument={onOpenDocument} onUnlink={onUnlink} onChange={onChange} onTermin={(id) => setTerminId(id)}/></>}<div className="memory-completion-actions"><button className="button secondary" onClick={() => void editSavedMemory()}>Eintrag ändern</button><button className="button secondary danger-link" onClick={() => void deleteSavedMemory()}>Eintrag löschen</button></div>{terminRecord && vaultHandle && <TerminBearbeiten record={terminRecord} vaultHandle={vaultHandle} onZu={() => setTerminId(null)} onGespeichert={async (text) => { await onRefresh(); onNotice({ kind: "success", text }); }}/>}{bearbeiten && vaultHandle && <MemoryBearbeiten event={selected} data={selectedData} aufgaben={verknuepfteAufgaben} vaultHandle={vaultHandle} onZu={() => setBearbeiten(false)} onGespeichert={async (text) => { await onRefresh(); onNotice({ kind: "success", text }); }}/>}</> : <div className="empty-state"><CircleHelp size={32}/><strong>Ein Ereignis auswählen</strong><span>Hier erscheinen Originaltext, Einordnung, Medien und offene Punkte.</span></div>}</article></section>
    <PapierkorbKarte vaultHandle={vaultHandle} stand={records} onRefresh={onRefresh} onNotice={onNotice}/>
  </>;
}

// Ausgeklappte Trefferzahl je Suchwort und Gruppe: bleibt beim Zurück aus einem Treffer erhalten.
const suchMehr = new Map<string, number>();
const SUCH_SEITE = 5;
const SUCH_MEHR = 20;

function SearchPanel({ query, results, interpretation, onOpen, onDocuments }: {
  query: string;
  results: SearchResult[];
  interpretation: FamilySearchInterpretation;
  onOpen: (id: SectionId, targetId?: string) => void;
  onDocuments: OpenDocumentLibrary;
}) {
  const [, setStand] = useState(0);
  const groups = groupSearchResults(results);
  const zeigen = (gruppe: string) => suchMehr.get(`${query}\u0000${gruppe}`) || SUCH_SEITE;
  const mehr = (gruppe: string, anzahl: number) => { suchMehr.set(`${query}\u0000${gruppe}`, anzahl); setStand((n) => n + 1); };
  const datenTreffer = results.filter((item) => item.group !== SEARCH_AREA_GROUP).length;
  const datumHinweis = interpretation.date || interpretation.alternatives.find((part) => part.date)?.date || null;
  const oeffnen = (item: SearchResult) => item.library ? onDocuments({ area: item.library.area || "", query: item.library.query || "" }) : onOpen(item.section, item.targetId);
  return <><PageTitle icon={<Search/>} title={`Suche nach „${query}“`} text="Die Suche versteht häufige Alltagssätze, gleichbedeutende Wörter (Bankauszug = Kontoauszug), Monate und deutsche Daten. Mehrere Wörter grenzen ein, „oder“ verbindet. Ausgewertet wird nur innerhalb der Familienakte; es werden keine Daten an einen externen KI-Dienst gesendet."/>
    <section className="search-privacy"><ShieldCheck size={18}/><span><strong>Lokale interaktive Suche</strong> · berücksichtigt ähnliche Begriffe, Kategorien, Zeiträume, Dokumentbeschreibungen und gespeicherte Textauszüge.</span></section>
    {(interpretation.labels.length > 0 || datumHinweis) && <section className="search-interpretation" aria-live="polite"><strong>Verstanden als:</strong><div>{interpretation.labels.map((label) => <span key={label}>{label}</span>)}{datumHinweis && <span data-such-datum>Zeitraum: {datumHinweis.label}</span>}</div></section>}
    <section className="card search-results" data-such-anzahl={datenTreffer}>{results.length ? <>
      <p className="search-total" data-such-gesamt>{datenTreffer ? `${datenTreffer} Treffer in der Akte` : "Keine Einträge in der Akte gefunden"}{results.length > datenTreffer ? ` · ${results.length - datenTreffer} passende Bereiche der App` : ""} · nach Art getrennt, neueste zuerst</p>
      {groups.map((group) => { const n = zeigen(group.name); const rest = group.items.length - n; return <div className="search-group" key={group.name} data-such-gruppe={group.name}>
        <h3 className="eyebrow dark">{group.name} ({group.items.length})</h3>
        {/* Punkt 9 (2.28.39): eine kompakte Zeile je Treffer – Datum · Titel · Bereich bzw. Art. Die Art steht in der Gruppe. */}
        {group.items.slice(0, n).map((item) => <article key={item.id} className="such-zeile" data-such-art={item.kind}><button className="such-zeile-knopf" onClick={() => oeffnen(item)} title={item.reason}><span className="such-datum">{item.date ? fmtDate(item.date.slice(0, 10)) : ""}</span><strong>{item.title}</strong><small>{item.bereich || item.kind}</small><ChevronRight size={16}/></button>{item.contextCaseId && <button className="text-link context-open-link such-zusammenhang" onClick={() => onOpen("cockpit", item.contextCaseId)} aria-label={`Zusammenhang zu „${item.title}“ öffnen`}>Zusammenhang <ChevronRight size={14}/></button>}</article>)}
        {(rest > 0 || (group.name === "Dokumente" && group.items.length > 1)) && <div className="button-row search-more">{rest > 0 && <button className="button secondary" data-such-mehr onClick={() => mehr(group.name, n + SUCH_MEHR)}>Weitere Ergebnisse ({rest})</button>}{group.name === "Dokumente" && group.items.length > 1 && <button className="text-link" onClick={() => onDocuments({ query })}>Alle in der Dokumentenbibliothek <ChevronRight size={15}/></button>}</div>}
      </div>; })}
    </> : <div className="empty-state"><Search size={32}/><strong>Keine passende gespeicherte Angabe gefunden</strong><span>Versuche weniger Wörter, einen Namen, ein Datum (15.03.2026, März 2026) oder einen allgemeineren Begriff. Die Familienakte erfindet keine Treffer.</span></div>}</section></>;
}

function InventoryAssignmentEditor({ item, areaOptions, records, busy, onConfirm }: { item: InventoryItem; areaOptions: string[]; records: FamilyRecordUnion[]; busy: boolean; onConfirm: (itemId: string, canonicalLifeArea: string, personalLifeArea: string, documentType: string, keywords: string[], referenceChoices: InventoryReferenceChoice[]) => Promise<void> }) {
  const [lifeArea, setLifeArea] = useState(item.canonicalLifeArea);
  const [personalArea, setPersonalArea] = useState(item.personalLifeArea || "");
  const [documentType, setDocumentType] = useState(item.documentType);
  const [keywords, setKeywords] = useState((item.confirmedKeywords.length ? item.confirmedKeywords : item.learningFeatures.keywords.slice(0, 12)).join(", "));
  const initialReference = (type: InventoryAssignmentReference["recordType"]) => item.assignmentReferences.find((reference) => reference.recordType === type)?.id || "";
  const [personId, setPersonId] = useState(initialReference("person"));
  const [organisationId, setOrganisationId] = useState(initialReference("organisation"));
  const [objectId, setObjectId] = useState(initialReference("object"));
  const [caseId, setCaseId] = useState(initialReference("case"));
  const [newPerson, setNewPerson] = useState("");
  const [newOrganisation, setNewOrganisation] = useState("");
  const [newObject, setNewObject] = useState("");
  const [newCase, setNewCase] = useState("");
  useEffect(() => {
    setLifeArea(item.canonicalLifeArea);
    setPersonalArea(item.personalLifeArea || "");
    setDocumentType(item.documentType);
    setKeywords((item.confirmedKeywords.length ? item.confirmedKeywords : item.learningFeatures.keywords.slice(0, 12)).join(", "));
    setPersonId(initialReference("person")); setOrganisationId(initialReference("organisation")); setObjectId(initialReference("object")); setCaseId(initialReference("case"));
    setNewPerson(""); setNewOrganisation(""); setNewObject(""); setNewCase("");
  }, [item.id, item.canonicalLifeArea, item.personalLifeArea, item.documentType, item.confirmedKeywords.join("|")]);
  const optionsFor = (type: InventoryAssignmentReference["recordType"]) => records.filter((record) => record.recordType === type);
  const confidence = item.learningSuggestion?.confidence || (item.confidence === "eindeutig" ? "Sicher" : item.confidence === "wahrscheinlich" ? "Wahrscheinlich" : "Unklar");
  const buildChoices = (): InventoryReferenceChoice[] => {
    const choices: InventoryReferenceChoice[] = [];
    for (const [recordType, existingId, newLabel] of [
      ["person", personId, newPerson], ["organisation", organisationId, newOrganisation], ["object", objectId, newObject], ["case", caseId, newCase],
    ] as Array<[InventoryAssignmentReference["recordType"], string, string]>) {
      if (newLabel.trim()) choices.push({ recordType, newLabel: newLabel.trim() });
      else if (existingId) choices.push({ recordType, existingId });
    }
    return choices;
  };
  const referenceField = ({ label, type, value, setter, newValue, newSetter, placeholder }: { label: string; type: InventoryAssignmentReference["recordType"]; value: string; setter: (value: string) => void; newValue: string; newSetter: (value: string) => void; placeholder: string }) => <fieldset className="inventory-reference-field">
    <legend>{label} <small>Vorschlag · {confidence}</small></legend>
    <label><span>Vorhandenen Eintrag wählen</span><select value={value} onChange={(event) => { setter(event.target.value); if (event.target.value) newSetter(""); }}><option value="">Keine vorhandene Zuordnung</option>{optionsFor(type).map((record) => <option key={record.id} value={record.id}>{cockpitRecordLabel(record)}</option>)}</select></label>
    <label><span>Oder neuen Vorschlag eingeben</span><VoiceInput value={newValue} onValueChange={(spokenValue) => { newSetter(spokenValue); if (spokenValue) setter(""); }} placeholder={placeholder} speechLabel="Neuer Eintrag"/><small>Wird erst mit „Zuordnung bestätigen“ angelegt. Ein gleichnamiger vorhandener Eintrag wird wiederverwendet.</small></label>
  </fieldset>;
  const keywordList = keywords.split(/[,;\n]+/).map((value) => value.trim()).filter(Boolean);
  return <section className="inventory-assignment-editor">
    <div className="inventory-assignment-heading"><div><span className="ui-heading-help"><h3>Zuordnung prüfen und bestätigen</h3><InfoPopover label="Zuordnung prüfen und bestätigen erklären" text={UI_HELP["Zuordnung prüfen und bestätigen"]}/></span></div><span className={`badge ${confidence === "Sicher" ? "success" : confidence === "Wahrscheinlich" ? "warning" : "neutral"}`}>{confidence}</span></div>
    <div className="inventory-assignment-fields">
      <label><span>Kategorie <small>Vorschlag · {confidence}</small></span><select value={lifeArea} onChange={(event) => setLifeArea(event.target.value)}>{FAWOGA_LIFE_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
      <label><span>Persönlicher Lebensbereich</span><VoiceInput list={`personal-areas-${item.id}`} value={personalArea} onValueChange={(spokenValue) => setPersonalArea(spokenValue)} placeholder="Optional auswählen oder neu eingeben" speechLabel="Persönlicher Lebensbereich"/><datalist id={`personal-areas-${item.id}`}>{areaOptions.filter((area) => !FAWOGA_LIFE_AREAS.includes(area as (typeof FAWOGA_LIFE_AREAS)[number])).map((area) => <option key={area} value={area}/>)}</datalist></label>
      <label><span>Dokumentenart <small>Vorschlag · {confidence}</small></span><VoiceInput list={`document-types-${item.id}`} value={documentType} onValueChange={(spokenValue) => setDocumentType(spokenValue)} placeholder="Zum Beispiel Rechnung" speechLabel="Dokumentenart"/><datalist id={`document-types-${item.id}`}><option value="Rechnung"/><option value="Vertrag"/><option value="Reparaturbericht"/><option value="Versicherungsschreiben"/><option value="Bescheid"/><option value="Foto"/><option value="E-Mail"/></datalist></label>
      <label className="inventory-keyword-field"><span>Wichtige Stichworte</span><VoiceTextarea value={keywords} onValueChange={(spokenValue) => setKeywords(spokenValue)} placeholder="Stichworte durch Komma trennen" speechLabel="Wichtige Stichworte"/><small>Automatische Vorschläge dürfen ergänzt, geändert oder entfernt werden.</small></label>
      {referenceField({ label: "Person", type: "person", value: personId, setter: setPersonId, newValue: newPerson, newSetter: setNewPerson, placeholder: "Zum Beispiel: Ich selbst, Mutter" })}
      {referenceField({ label: "Organisation", type: "organisation", value: organisationId, setter: setOrganisationId, newValue: newOrganisation, newSetter: setNewOrganisation, placeholder: "Zum Beispiel: Versicherung oder Handwerksfirma" })}
      {referenceField({ label: "Objekt", type: "object", value: objectId, setter: setObjectId, newValue: newObject, newSetter: setNewObject, placeholder: "Zum Beispiel: Haus, Auto, Smartphone" })}
      {referenceField({ label: "Vorgang", type: "case", value: caseId, setter: setCaseId, newValue: newCase, newSetter: setNewCase, placeholder: "Zum Beispiel: Smartphone-Reparatur" })}
      <button className="button primary inventory-confirm-assignment" disabled={busy || item.state !== "QUELLE_ANALYSIERT" || !lifeArea || !documentType.trim()} onClick={() => void onConfirm(item.id, lifeArea, personalArea.trim(), documentType.trim(), keywordList, buildChoices())}><CheckCircle2/> Zuordnung bestätigen</button>
    </div>
    <small>Erst dieser Button speichert die Änderungen und legt bestätigte neue Einträge an. Nur bestätigte Zuordnungen werden als Lernhilfe verwendet; Originaldatei und bestehende Datensätze bleiben unverändert.</small>
  </section>;
}

function InventoryThumbnail({ item, sourceHandle }: { item: InventoryItem; sourceHandle: FileSystemDirectoryHandle | null }) {
  const host = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState("");
  const protectedItem = inventoryPreviewMode(item) === "protected" || isSensitiveHealthText(`${item.lifeArea} ${item.originalName}`);
  useEffect(() => {
    if (!host.current || visible) return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: "120px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    let active = true; let objectUrl = "";
    if (!visible || !sourceHandle || protectedItem || inventoryPreviewMode(item) !== "image") return;
    readInventorySourcePreview(sourceHandle, item).then((result) => { if (!active) return; objectUrl = URL.createObjectURL(result.file); setUrl(objectUrl); }).catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [visible, sourceHandle, item.id, protectedItem]);
  return <div ref={host} className={`inventory-icon${url ? " has-thumbnail" : ""}`}>{url ? <img src={url} alt="Datensparsame Dokumentminiatur"/> : protectedItem ? <ShieldCheck/> : item.mimeType.startsWith("image/") ? <Camera/> : <FileText/>}</div>;
}

function InventoryPreviewDialog({ item, sourceHandle, areaOptions, records, busy, onClose, onConfirm, onGo }: {
  item: InventoryItem;
  sourceHandle: FileSystemDirectoryHandle | null;
  areaOptions: string[];
  records: FamilyRecordUnion[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, canonicalLifeArea: string, personalLifeArea: string, documentType: string, keywords: string[], referenceChoices: InventoryReferenceChoice[]) => Promise<void>;
  onGo: (id: SectionId) => void;
}) {
  const reportActivity = useActivity();
  const [preview, setPreview] = useState<{ url: string; text: string; changed: boolean; textReadable: boolean; detectedEncoding: string; requiresManualReview: boolean } | null>(null);
  const [error, setError] = useActivityMessage("error", "Dokumentvorschau");
  const mode = inventoryPreviewMode(item);
  const sensitive = mode === "protected" || isSensitiveHealthText(`${item.lifeArea} ${item.originalName}`);
  useEffect(() => {
    let active = true; let objectUrl = "";
    if (!sourceHandle) { setError("Der ursprüngliche Analyseordner ist derzeit nicht verbunden."); return; }
    setError(""); setPreview(null);
    readInventorySourcePreview(sourceHandle, item).then((result) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(result.file);
      setPreview({ url: objectUrl, text: result.textExcerpt, changed: result.changedSinceAnalysis, textReadable: result.textReadable, detectedEncoding: result.detectedEncoding, requiresManualReview: result.requiresManualReview });
      reportActivity({ kind: "info", text: result.changedSinceAnalysis ? "Dokumentvorschau geladen · Quelldatei seit der Analyse verändert. Bestand vor der Zuordnungsbestätigung erneut prüfen." : result.requiresManualReview ? "Dokument zur manuellen Prüfung geöffnet · Inhalt nicht zuverlässig darstellbar. Noch keine Zuordnung gespeichert." : "Dokumentvorschau geöffnet · Zuordnung kann geprüft werden. Noch keine Änderung gespeichert." });
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : "Die Vorschau konnte nicht geöffnet werden."));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, sourceHandle]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const date = item.detectedMetadata.dates[0] || new Date(item.lastModified).toLocaleDateString("de-DE");
  const people = item.assignmentReferences.filter((reference) => reference.recordType === "person").map((reference) => reference.label);
  const organisations = item.assignmentReferences.filter((reference) => reference.recordType === "organisation").map((reference) => reference.label);
  const objects = item.assignmentReferences.filter((reference) => reference.recordType === "object").map((reference) => reference.label);
  const cases = item.assignmentReferences.filter((reference) => reference.recordType === "case").map((reference) => reference.label);
  const isPdf = mode === "pdf";
  const isImage = mode === "image";
  const isEmail = mode === "email";
  const protectedTitle = protectedFamilyLabel({ label: item.originalName, category: item.lifeArea });
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal inventory-preview-modal" role="dialog" aria-modal="true" aria-label={`Dokumentvorschau ${protectedTitle}`}>
      <div className="modal-head"><div><span className="eyebrow dark">Dokument ansehen</span><h2>{protectedTitle}</h2><p>{sensitive ? "Geschützter Speicherverweis" : item.sourceRelativePath}</p></div><button className="icon-button" aria-label="Vorschau schließen" onClick={onClose}><X/></button></div>
      <dl className="inventory-preview-meta">
        <div><dt>Originaldatei</dt><dd>{sensitive ? "Geschützte Gesundheitsunterlage" : item.originalName}</dd></div>
        <div><dt>Dateityp</dt><dd>{item.mimeType || "Unbekannter Dateityp"}</dd></div><div><dt>Dateigröße</dt><dd>{fmtBytes(item.sizeBytes)}</dd></div>
        <div><dt>Erkanntes Datum</dt><dd>{date}</dd></div><div><dt>Dokumentenart</dt><dd>{item.documentType}</dd></div>
        <div><dt>Person / Organisation</dt><dd>{[...people, ...organisations].join(" · ") || "Noch nicht erkannt"}</dd></div><div><dt>Objekt / Vorgang</dt><dd>{[...objects, ...cases].join(" · ") || "Noch nicht erkannt"}</dd></div><div><dt>Wichtige Stichworte</dt><dd>{sensitive ? "Geschützt" : (item.confirmedKeywords.length ? item.confirmedKeywords : item.learningFeatures.keywords.slice(0, 8)).join(", ") || "Keine sicheren Stichworte"}</dd></div>
        <div><dt>Vorgeschlagene Kategorie</dt><dd>{item.canonicalLifeArea}</dd></div><div><dt>Persönlicher Lebensbereich</dt><dd>{item.personalLifeArea || "Keiner vorgeschlagen"}</dd></div>
        <div><dt>Sicherheit</dt><dd>{item.learningSuggestion?.confidence || (item.confidence === "eindeutig" ? "Sicher" : item.confidence === "wahrscheinlich" ? "Wahrscheinlich" : "Unklar")}</dd></div>
      </dl>
      {preview?.changed && <div className="inventory-preview-warning">Die Originaldatei wurde seit der letzten Analyse verändert. Bitte den Bestand erneut prüfen, bevor du die Zuordnung bestätigst.</div>}
      <section className="inventory-preview-content">
        {sensitive ? <div className="protected-dossier"><ShieldCheck/><div><strong>Gesundheitsinhalt geschützt</strong><p>Vertrauliche Einzelheiten werden in dieser allgemeinen Vorschau nicht angezeigt.</p><button className="button secondary" onClick={() => { onClose(); onGo("health"); }}>Geschützte Gesundheitsakte öffnen</button></div></div>
          : error ? <div className="empty-state compact-empty"><FileText/><strong>Vorschau nicht verfügbar</strong><span>{error}</span></div>
          : !preview ? <div className="empty-state compact-empty"><RefreshCw className="spin"/><strong>Vorschau wird geladen …</strong></div>
          : isPdf ? <iframe title={`PDF-Vorschau ${item.originalName}`} src={preview.url}/>
          : isImage ? <a href={preview.url} target="_blank" rel="noreferrer"><img src={preview.url} alt={`Vorschau von ${item.originalName}`}/><span>Zum Vergrößern anklicken</span></a>
          : preview.requiresManualReview ? <div className="empty-state compact-empty inventory-manual-review"><FileText/><strong>{mode === "unsupported" ? "Vorschau nicht verfügbar – bitte Original öffnen." : "Inhalt konnte nicht sinnvoll als Text dargestellt werden."}</strong><span>Die Datei wurde als „manuelle Prüfung erforderlich“ gekennzeichnet. Es werden keine Rohdaten oder falsch decodierten Zeichen angezeigt.</span></div>
          : preview.textReadable && preview.text ? <div className="inventory-text-preview"><strong>{isEmail ? "E-Mail-Inhalt" : "Textausschnitt"}</strong>{preview.detectedEncoding !== "nicht erkannt" && <small>Erkannte Zeichencodierung: {preview.detectedEncoding}</small>}<p>{preview.text}</p></div>
          : <div className="empty-state compact-empty"><FileText/><strong>Vorschau nicht verfügbar – bitte Original öffnen.</strong><span>Für diesen Dateityp ist keine zuverlässige Vorschau vorhanden.</span></div>}
      </section>
      <div className="inventory-preview-actions"><button className="button primary" disabled={!preview || sensitive} onClick={() => preview && window.open(preview.url, "_blank", "noopener,noreferrer")}><ExternalLink/> Original öffnen</button>{isPdf && preview && !sensitive && <small>Im PDF-Fenster kannst du durch alle Seiten blättern.</small>}</div>
      <InventoryAssignmentEditor item={item} areaOptions={areaOptions} records={records} busy={busy || Boolean(preview?.changed)} onConfirm={onConfirm}/>
    </section>
  </div>;
}

// B2: Entwicklungs- und Testwerkzeuge (Testakten-Verwaltung, automatische Testumgebung, Windows-Dateisystem-Diagnose)
// gehören zur Entwicklungsumgebung des Freundes. Sie erscheinen im Entwicklungsmodus (npm run dev) oder im Expertenmodus
// (Adresse mit ?experte=1 oder localStorage familienakte-experte=1), nicht in PWA, APK und Windows-App für Privatnutzer.
const expertenModus = (() => {
  if (import.meta.env.DEV) return true;
  try { if (new URLSearchParams(window.location.search).get("experte") === "1") { workspaceStorage.setItem("familienakte-experte", "1"); return true; } } catch { /* ohne Adresse */ }
  try { return workspaceStorage.getItem("familienakte-experte") === "1"; } catch { return false; }
})();
function InventoryCenter({ vaultReady, vaultHandle, sourceHandle, sourceName, archiveName, items, records, busy, progress, lastRun, archiveResult, onSelectSource, onSelectArchive, onScan, onPause, onArchive, onRelease, onReset, onConfirmAssignment, onTestRegisterSaved, onGo }: {
  vaultReady: boolean;
  vaultHandle: FileSystemDirectoryHandle | null;
  sourceHandle: FileSystemDirectoryHandle | null;
  sourceName: string;
  archiveName: string;
  items: InventoryItem[];
  records: FamilyRecordUnion[];
  busy: boolean;
  progress: InventoryScanProgress | null;
  lastRun: InventoryScanResult | null;
  archiveResult: InventoryArchiveResult | null;
  onSelectSource: () => Promise<FileSystemDirectoryHandle | undefined>;
  onSelectArchive: () => void;
  onScan: () => void;
  onPause: () => void;
  onArchive: (ids: string[]) => void;
  onRelease: (ids: string[]) => void;
  onReset: (ids: string[]) => void;
  onConfirmAssignment: (itemId: string, canonicalLifeArea: string, personalLifeArea: string, documentType: string, keywords: string[], referenceChoices: InventoryReferenceChoice[]) => Promise<void>;
  onTestRegisterSaved: () => Promise<void>;
  onGo: (id: SectionId) => void;
}) {
  const reportActivity = useActivity();
  const [group, setGroup] = useState<InventoryReviewGroup | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [testWorkspaceOpen, setTestWorkspaceOpen] = useState(false);
  const [testWorkspaceBusy, setTestWorkspaceBusy] = useState(false);
  const [testWorkspaceReport, setTestWorkspaceReport] = useState<TestWorkspaceReport | null>(null);
  const [testWorkspacePermission, setTestWorkspacePermission] = useState<PermissionState | "unsupported">("prompt");
  const [testWorkspaceError, setTestWorkspaceError] = useActivityMessage("error", "Testakte prüfen");
  const [testRegisterPreview, setTestRegisterPreview] = useState<PreparedTestRegister | null>(null);
  const [testRegisterBusy, setTestRegisterBusy] = useState(false);
  const [testRegisterError, setTestRegisterError] = useActivityMessage("error", "Testregister");
  const [testRegisterSaved, setTestRegisterSaved] = useActivityMessage("success", "Testregister");
  const [developmentBase, setDevelopmentBase] = useState<FileSystemDirectoryHandle | null>(null);
  const [automaticTestBusy, setAutomaticTestBusy] = useState(false);
  const [automaticTestError, setAutomaticTestError] = useActivityMessage("error", "Automatische Testumgebung");
  const [automaticTestReport, setAutomaticTestReport] = useState<AutomatedTestEnvironmentReport | null>(null);
  const [automaticTestFailure, setAutomaticTestFailure] = useState<UiAutomatedTestFailureReport | null>(null);
  const [automaticTestFailureIsPrevious, setAutomaticTestFailureIsPrevious] = useState(false);
  const [automaticTestFailureCopied, setAutomaticTestFailureCopied] = useState(false);
  const [storageDiagnosticBusy, setStorageDiagnosticBusy] = useState(false);
  const [storageDiagnosticReport, setStorageDiagnosticReport] = useState<AutomatedStorageDiagnosticReport | null>(null);
  const [storageDiagnosticCopied, setStorageDiagnosticCopied] = useState(false);
  const automaticTestFailureStorageKey = "family-auto-test-critical-v32";
  const legacyAutomaticTestFailureStorageKey = "family-auto-test-critical-v31";
  const storageDiagnosticStorageKey = "family-storage-diagnostic-v32";
  const automaticTestBlocked = Boolean(automaticTestFailure);
  const summary = useMemo(() => summarizeInventory(items), [items]);
  const photoSeries = useMemo(() => inventoryPhotoSeries(items), [items]);
  const visible = items.filter((item) => group === "all" || item.reviewGroup === group).sort((a, b) => b.priority.localeCompare(a.priority, "de") || b.lastModified - a.lastModified);
  const selectedItems = items.filter((item) => selected.includes(item.id));
  const archiveIds = selectedItems.filter((item) => item.state === "QUELLE_ANALYSIERT" && item.reviewGroup !== "duplicate" && item.reviewGroup !== "low").map((item) => item.id);
  const releaseIds = selectedItems.filter((item) => item.state === "ARCHIVIERT").map((item) => item.id);
  const resetIds = selectedItems.filter((item) => item.state === "ARCHIVIERT" || item.state === "ASSISTENZ_FREIGEGEBEN").map((item) => item.id);
  const allSelectedReleaseEligible = selectedItems.length > 0 && selectedItems.every((item) => item.state === "ARCHIVIERT");
  const archiveReady = archiveIds.length > 0 && vaultReady && Boolean(sourceName) && Boolean(archiveName) && !busy;
  const releaseReady = allSelectedReleaseEligible && vaultReady && Boolean(archiveName) && !busy;
  const analysisComplete = Boolean((lastRun && !lastRun.paused) || items.length > 0);
  const personalAreas = items.map((item) => item.personalLifeArea || item.lifeArea).filter((area) => area && !FAWOGA_LIFE_AREAS.includes(area as (typeof FAWOGA_LIFE_AREAS)[number]));
  const areaOptions = [...new Set([...FAWOGA_LIFE_AREAS, ...personalAreas])];
  const previewItem = items.find((item) => item.id === previewItemId) || null;
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectVisible = () => setSelected(visible.map((item) => item.id));
  const groupLabels: Record<InventoryReviewGroup | "all", string> = { all: "Alle", recommended: "Zur Übernahme empfohlen", review: "Noch prüfen", duplicate: "Mögliche Dubletten", low: "Geringe Relevanz" };
  const openGroup = (nextGroup: InventoryReviewGroup | "all") => {
    setGroup(nextGroup);
    setSelected([]);
    window.requestAnimationFrame(() => document.getElementById("inventory-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  useEffect(() => {
    inventorySourcePermission(sourceHandle).then(setTestWorkspacePermission).catch(() => setTestWorkspacePermission("prompt"));
  }, [sourceHandle]);
  useEffect(() => {
    rememberedDevelopmentBaseFolder().then(setDevelopmentBase).catch(() => setDevelopmentBase(null));
  }, []);
  useEffect(() => {
    try {
      const stored = workspaceStorage.getItem(automaticTestFailureStorageKey) || workspaceStorage.getItem(legacyAutomaticTestFailureStorageKey);
      if (stored) { setAutomaticTestFailure(JSON.parse(stored) as UiAutomatedTestFailureReport); setAutomaticTestFailureIsPrevious(true); }
      const storedDiagnostic = workspaceStorage.getItem(storageDiagnosticStorageKey);
      if (storedDiagnostic) setStorageDiagnosticReport(JSON.parse(storedDiagnostic) as AutomatedStorageDiagnosticReport);
    } catch { /* Ein nicht lesbarer UI-Diagnosestatus blockiert weder Navigation noch Hilfe. */ }
  }, []);
  const storeAutomaticTestFailure = (error: unknown, baseName?: string | null) => {
    const failure = { ...buildAutomatedTestFailureReport(error, { developmentBaseName: baseName || developmentBase?.name || null, browser: navigator.userAgent }), websiteVersion: 40 };
    setAutomaticTestFailure(failure);
    setAutomaticTestFailureIsPrevious(false);
    setAutomaticTestError(failure.cause);
    setAutomaticTestReport(null);
    setAutomaticTestFailureCopied(false);
    try { workspaceStorage.setItem(automaticTestFailureStorageKey, JSON.stringify(failure)); } catch { /* Bericht bleibt in dieser Sitzung sichtbar. */ }
  };
  const clearAutomaticTestFailure = () => {
    setAutomaticTestFailure(null);
    setAutomaticTestFailureIsPrevious(false);
    setAutomaticTestError("");
    setAutomaticTestFailureCopied(false);
    try { workspaceStorage.removeItem(automaticTestFailureStorageKey); workspaceStorage.removeItem(legacyAutomaticTestFailureStorageKey); } catch { /* Keine fachlichen Daten betroffen. */ }
  };
  const copyAutomaticTestFailure = async () => {
    if (!automaticTestFailure) return;
    const report = `FAMILIENAKTE 2.28.1 – TECHNISCHER FEHLERBERICHT\n${JSON.stringify(automaticTestFailure, null, 2)}`;
    try {
      await navigator.clipboard.writeText(report);
      setAutomaticTestFailureCopied(true);
    } catch {
      setAutomaticTestError("Der Fehlerbericht konnte nicht automatisch kopiert werden. Bitte die sichtbaren Angaben markieren und kopieren.");
    }
  };
  const copyStorageDiagnostic = async () => {
    if (!storageDiagnosticReport) return;
    const report = `FAMILIENAKTE 2.28.1 – WINDOWS-DATEISYSTEM-DIAGNOSE\n${JSON.stringify(storageDiagnosticReport, null, 2)}`;
    try {
      await navigator.clipboard.writeText(report);
      setStorageDiagnosticCopied(true);
    } catch {
      setAutomaticTestError("Der Diagnosebericht konnte nicht automatisch kopiert werden. Bitte die sichtbaren Angaben markieren und kopieren.");
    }
  };
  const runStorageDiagnostic = async () => {
    setStorageDiagnosticBusy(true); setAutomaticTestError(""); setStorageDiagnosticCopied(false);
    setStorageDiagnosticReport(null);
    try { workspaceStorage.removeItem(storageDiagnosticStorageKey); } catch { /* Keine fachlichen Daten betroffen. */ }
    try {
      const handle = developmentBase || await chooseDevelopmentBaseFolder();
      setDevelopmentBase(handle);
      const report = await runAutomatedStorageDiagnostic(handle);
      setStorageDiagnosticReport(report);
      try { workspaceStorage.setItem(storageDiagnosticStorageKey, JSON.stringify(report)); } catch { /* Der Bericht bleibt in dieser Sitzung sichtbar. */ }
      if (report.outcome === "FEHLER_REPRODUZIERT") {
        storeAutomaticTestFailure(new Error(report.observedFailure || "Der Windows-Dateisystem-Diagnoselauf ist fehlgeschlagen."), handle.name);
      } else { clearAutomaticTestFailure(); reportActivity({ kind: report.automaticEnvironmentCompleted ? "success" : "info", text: `Windows-Dateisystem-Diagnose abgeschlossen · ${report.phases.filter((phase) => phase.status === "bestanden").length} Phasen bestanden. ${report.automaticEnvironmentCompleted ? "Sicherung und Wiederherstellung im Testbereich bestätigt." : "Vollständigen Wiederherstellungsnachweis im Diagnosebericht prüfen."}` }); }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") storeAutomaticTestFailure(error);
    } finally { setStorageDiagnosticBusy(false); }
  };
  const runAutomaticTestEnvironment = async (chooseAgain = false) => {
    if (automaticTestBlocked) return;
    setAutomaticTestBusy(true); setAutomaticTestError("");
    try {
      const handle = chooseAgain || !developmentBase ? await chooseDevelopmentBaseFolder() : developmentBase;
      setDevelopmentBase(handle);
      const result = await setupAutomatedTestEnvironment(handle);
      setAutomaticTestReport(result);
      reportActivity({ kind: result.checks.every((check) => check.status === "bestanden") ? "success" : "info", text: `Automatische Testumgebung geprüft · ${result.checks.filter((check) => check.status === "bestanden").length} von ${result.checks.length} Prüfungen bestanden · Sicherung/Wiederherstellung ${result.backupRestoreVerified ? "bestätigt" : "noch offen"}. Dateien außerhalb des Testbereichs unverändert.` });
      clearAutomaticTestFailure();
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") storeAutomaticTestFailure(error);
    } finally { setAutomaticTestBusy(false); }
  };
  const resetAutomaticTestWorkspace = async () => {
    if (automaticTestBlocked || !developmentBase || !await askConfirm("Nur der eindeutig gekennzeichnete Ordner „Familienakte_Automatische_Testumgebung_2.28.1“ wird gelöscht und vollständig mit synthetischen Testdaten neu erstellt. Fortfahren?")) return;
    setAutomaticTestBusy(true); setAutomaticTestError("");
    try { const result = await resetAutomatedTestEnvironment(developmentBase); setAutomaticTestReport(result); clearAutomaticTestFailure(); reportActivity({ kind: result.checks.every((check) => check.status === "bestanden") ? "success" : "info", text: `Eigene automatische Testumgebung kontrolliert neu erstellt und geprüft · ${result.checks.filter((check) => check.status === "bestanden").length} von ${result.checks.length} Prüfungen bestanden. Dateien außerhalb des Testbereichs unverändert.` }); }
    catch (error) { storeAutomaticTestFailure(error); }
    finally { setAutomaticTestBusy(false); }
  };
  const inspectWorkspace = async (handle: FileSystemDirectoryHandle) => {
    setTestWorkspaceBusy(true); setTestWorkspaceError("");
    try { const result = await inspectTestWorkspace(handle, vaultHandle); setTestWorkspaceReport(result); setTestWorkspacePermission("granted"); reportActivity({ kind: "success", text: "Testakte lesend geprüft. Die erkannten Dateien, Register und Sicherungen stehen in der Bestandsübersicht; Originaldateien unverändert." }); }
    catch (error) { setTestWorkspaceError(error instanceof Error ? error.message : "Die Testakte konnte nicht geprüft werden."); }
    finally { setTestWorkspaceBusy(false); }
  };
  const chooseAndInspectWorkspace = async () => {
    setTestWorkspaceOpen(true);
    const handle = await onSelectSource();
    if (handle) { setTestRegisterPreview(null); setTestRegisterSaved(""); await inspectWorkspace(handle); }
  };
  const prepareTestRegister = async () => {
    if (automaticTestBlocked) return;
    if (!sourceHandle || !vaultHandle) { setTestRegisterError("Bitte zuerst „FAMILIENAKTE_TESTBESTAND“ als Analysequelle und „FaWoGa_Test_2.28.1“ als Testdatentresor verbinden."); return; }
    setTestRegisterBusy(true); setTestRegisterError(""); setTestRegisterSaved("");
    try {
      if (!testWorkspaceReport) {
        setTestWorkspaceOpen(true); setTestWorkspaceBusy(true); setTestWorkspaceError("");
        const report = await inspectTestWorkspace(sourceHandle, vaultHandle);
        setTestWorkspaceReport(report); setTestWorkspacePermission("granted");
      }
      const preview = await prepareTestRegisterPreview({ source: sourceHandle, register: vaultHandle });
      setTestRegisterPreview(preview);
      reportActivity({ kind: "info", text: `Testregister mit ${preview.recognizedDocuments} Dokumenten als Vorschau vorbereitet. Noch keine Übernahme; Originaldateien unverändert.` });
    }
    catch (error) { setTestRegisterError(error instanceof Error ? error.message : "Das Testregister konnte nicht vorbereitet werden."); }
    finally { setTestRegisterBusy(false); setTestWorkspaceBusy(false); }
  };
  const confirmPreparedTestRegister = async () => {
    if (!testRegisterPreview || !vaultHandle) return;
    const sensitiveNote = testRegisterPreview.sensitiveDocuments ? `\n\n${testRegisterPreview.sensitiveDocuments} sensible Unterlage${testRegisterPreview.sensitiveDocuments === 1 ? " wurde" : "n wurden"} erkannt. Verwende für weitere Funktionstests möglichst anonymisierte oder synthetische Daten.` : "";
    if (!await askConfirm(`${testRegisterPreview.recognizedDocuments} vorbereitete Testdokumente jetzt in das bestehende Testregister übernehmen? Neue Einträge erhalten ausschließlich den Status QUELLE_ANALYSIERT. Originaldateien werden nicht verändert, kopiert, archiviert oder für die Assistenz freigegeben.${sensitiveNote}`)) return;
    setTestRegisterBusy(true); setTestRegisterError("");
    try {
      const result = await savePreparedTestRegister({ register: vaultHandle, preview: testRegisterPreview });
      await onTestRegisterSaved();
      setTestRegisterSaved(`${result.added} neue Testdokumente wurden als QUELLE_ANALYSIERT gespeichert; ${result.reused} bekannte Einträge wurden wiederverwendet. Originaldateien blieben unverändert.`);
    } catch (error) { setTestRegisterError(error instanceof Error ? error.message : "Das vorbereitete Testregister konnte nicht gespeichert werden."); }
    finally { setTestRegisterBusy(false); }
  };
  return <>
    <PageTitle icon={<FolderSearch/>} title="Bestand prüfen" text="Wähle einen großen Hauptordner aus. FaWoGa, die Ordnungshilfe der Familienakte, bezieht automatisch alle darin enthaltenen Unterordner und tiefer verschachtelten Dokumente ein."/>
    {/* Die drei Schritte sind das eigentliche „Bestand prüfen“, kein Testwerkzeug; seit #11 lagen sie versehentlich im Expertenbereich. */}
    <section className="inventory-steps" aria-label="Bestandsprüfung in drei Schritten">
        <div><span className="eyebrow">1 · Quelle</span><h2>{sourceName || "Großen Hauptordner auswählen"}</h2><p>Alle Unterordner, weitere Unterordner und die darin verteilten Dateien werden automatisch mit durchsucht. Du musst nichts zusammensammeln.</p><button className={`button primary inventory-step-action${sourceName ? " step-complete" : ""}`} onClick={onSelectSource} disabled={busy}><Folder/> {sourceName ? "Anderen Hauptordner wählen" : "Hauptordner einschließlich Unterordner auswählen"}</button></div>
        <div><span className="eyebrow">2 · Analyse</span><span className="ui-heading-help"><h2>Nur Neues prüfen</h2><InfoPopover label="Nur Neues prüfen erklären" text={UI_HELP["Nur Neues prüfen"]}/></span><div className="button-row"><button className={`button primary inventory-step-action${analysisComplete ? " step-complete" : ""}`} onClick={onScan} disabled={busy || !vaultReady || !sourceName}><FolderSearch/> {busy ? "Analyse läuft …" : lastRun?.paused ? "Analyse fortsetzen" : "Bestand jetzt prüfen"}</button>{busy && <button className="button secondary" onClick={onPause}>Analyse pausieren</button>}</div>{!sourceName && <small className="form-guidance">Zuerst bei Schritt 1 den großen Hauptordner auswählen.</small>}{sourceName && !vaultReady && <small className="form-guidance">Der Hauptordner ist gewählt. Jetzt noch den Test-Datentresor über das Sicherheitscenter verbinden.</small>}</div>
        <div><span className="eyebrow">3 · Archiv</span><h2>{archiveName || "Archivdatenträger verbinden"}</h2><p>Kopien werden per Prüfsumme kontrolliert.</p><button className={`button primary inventory-step-action${archiveName ? " step-complete" : ""}`} onClick={onSelectArchive} disabled={busy}><HardDrive/> {archiveName ? "Archiv neu verbinden" : "Archivdatenträger auswählen"}</button></div>
    </section>
    {expertenModus && <section className="card test-workspace-card">
      <div className="test-workspace-intro"><div className="test-workspace-icon"><FolderHeart/></div><div><span className="eyebrow">Private Testfassung 2.28.1</span><span className="ui-heading-help"><h2>Testakte für Weiterentwicklung</h2><InfoPopover label="Testakte für Weiterentwicklung erklären" text={UI_HELP["Testakte für Weiterentwicklung"]}/></span></div></div>
      <div className="test-workspace-actions"><button className="button primary automatic-test-action critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={busy || automaticTestBusy || storageDiagnosticBusy || automaticTestBlocked} onClick={() => void runAutomaticTestEnvironment()}><PackageCheck className={automaticTestBusy ? "spin" : ""}/> {automaticTestBusy ? "Testumgebung wird eingerichtet und geprüft …" : "Testumgebung automatisch einrichten und prüfen"}</button><button className="button primary diagnostic-test-action" disabled={busy || automaticTestBusy || storageDiagnosticBusy} onClick={() => void runStorageDiagnostic()}><ClipboardCheck className={storageDiagnosticBusy ? "spin" : ""}/> {storageDiagnosticBusy ? "Windows-Diagnose läuft …" : "Windows-Dateisystem diagnostizieren"}</button><button className="button primary" disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy} onClick={chooseAndInspectWorkspace}><FolderSearch/> Testakte für Weiterentwicklung</button><button className="button primary test-register-action critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy || automaticTestBlocked} onClick={prepareTestRegister}><ListChecks/> {testRegisterBusy ? "Testregister wird vorbereitet …" : "Testregister vorbereiten"}</button>{sourceHandle && <button className="button secondary" disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy} onClick={() => { setTestWorkspaceOpen(true); void inspectWorkspace(sourceHandle); }}><RefreshCw className={testWorkspaceBusy ? "spin" : ""}/> {testWorkspaceBusy ? "Testakte wird geprüft …" : "Gespeicherte Testakte erneut prüfen"}</button>}</div>
      <small className="test-workspace-saved">{developmentBase ? <>Entwicklungsbasis: <strong>{developmentBase.name}</strong>. Der Browser prüft die Berechtigung bei jeder Verwendung erneut.</> : <>Beim ersten Klick bitte einmal den festen Ordner <strong>SOFTWARE TESTORDNER</strong> auswählen.</>}</small>
      <small className="test-workspace-saved">Der Diagnosemodus protokolliert technische Zielpfade und deren Länge, verwendet aber ausschließlich synthetische Testdaten. Persönliche Dokumentinhalte werden nicht protokolliert.</small>
      {automaticTestFailure && <section className="critical-test-error" role="alert" aria-live="assertive">
        <div><span className="critical-error-label">{automaticTestFailureIsPrevious ? "Vorheriger Fehler – noch nicht erneut geprüft" : "Fehlermeldung:"}</span><h3>Kritische Pflichtprüfung fehlgeschlagen</h3></div>
        <p><strong>Arbeitsschritt:</strong> {automaticTestFailure.workStep}</p>
        <p><strong>Ursache:</strong> {automaticTestFailure.cause}</p>
        <p><strong>Erforderliche Korrektur:</strong> {automaticTestFailure.requiredAction}. Abhängige Aktionen sind bis zu einer korrigierten Website-Version gesperrt.</p>
        <p><strong>Sicherheit:</strong> Produktivversion und Dateien außerhalb der automatischen Testumgebung wurden nicht verändert.</p>
        <div className="button-row">{storageDiagnosticReport && <button className="button light" onClick={() => void copyStorageDiagnostic()}><ClipboardCheck/> {storageDiagnosticCopied ? "Windows-Diagnosebericht kopiert" : "Windows-Diagnosebericht kopieren"}</button>}<button className="button glass" onClick={() => void copyAutomaticTestFailure()}><Copy/> {automaticTestFailureCopied ? "Allgemeiner Fehlerbericht kopiert" : "Allgemeinen technischen Fehlerbericht kopieren"}</button><button className="button glass" onClick={() => onGo("help")}><HelpCircle/> Hilfe öffnen</button><button className="button glass" onClick={() => onGo("systemcheck")}><ShieldCheck/> Systemprüfung öffnen</button></div>
      </section>}
      {automaticTestError && !automaticTestFailure && <div className="test-workspace-panel"><p className="form-error">{automaticTestError}</p></div>}
      {storageDiagnosticReport && <section className="test-workspace-panel automated-test-report" aria-live="polite">
        <div className="test-workspace-result-heading"><div><strong>Windows-Dateisystem-Diagnose</strong><span>Website-Version 40 · {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(storageDiagnosticReport.completedAt))}</span></div><span className={`badge ${storageDiagnosticReport.outcome === "BESTANDEN" ? "success" : "warning"}`}>{storageDiagnosticReport.outcome === "BESTANDEN" ? "LAUF BESTANDEN" : "FEHLER ERFASST"}</span></div>
        <div className="test-workspace-details"><p><strong>Direktschreiben ohne Wiederherstellung:</strong> {storageDiagnosticReport.directWriteWithoutRestore}</p><p><strong>Vollständiger Ablauf mit verkürztem Pfad:</strong> {storageDiagnosticReport.automaticEnvironmentCompleted ? "abgeschlossen" : "am protokollierten Fehler gestoppt"}</p><p><strong>Pfadvergleich:</strong> kurz {storageDiagnosticReport.pathComparison.shortPathLength} Zeichen ({storageDiagnosticReport.pathComparison.shortPathStatus}) · lang {storageDiagnosticReport.pathComparison.longPathLength} Zeichen ({storageDiagnosticReport.pathComparison.longPathStatus}) · Vergleichsgrenze {storageDiagnosticReport.pathComparison.legacyLimit} Zeichen.</p><p><strong>Ergebnis des Pfadvergleichs:</strong> {storageDiagnosticReport.pathComparison.conclusion === "PFADLÄNGE_BESTÄTIGT" ? `Pfadlänge lokal bestätigt${storageDiagnosticReport.pathComparison.longPathFailedOperation ? ` – Fehler bei „${storageDiagnosticReport.pathComparison.longPathFailedOperation}“` : ""}.` : storageDiagnosticReport.pathComparison.conclusion === "PFADLÄNGE_NICHT_BESTÄTIGT" ? "Beide Vergleichspfade waren beschreibbar; Pfadlänge ist auf diesem System nicht als Ursache bestätigt." : "Vergleich noch nicht vollständig."}</p><p><strong>Codeprüfung:</strong> Wiederherstellung löscht, leert oder benennt keine Ordner um; Registerordner werden frisch aufgelöst und Schreibvorgänge nacheinander ausgeführt.</p><p><strong>Tatsächlich belegte Ursache:</strong> {storageDiagnosticReport.provenRootCause || "Noch nicht belegt – der Bericht enthält den beobachteten Fehler und die Zustände unmittelbar davor."}</p>{storageDiagnosticReport.observedFailure && <p><strong>Beobachteter Fehler:</strong> {storageDiagnosticReport.observedFailure}</p>}<p><strong>Diagnoseereignisse:</strong> {storageDiagnosticReport.events.length} · <strong>Bericht im Testbereich:</strong> {storageDiagnosticReport.reportSavedInTestArea ? "gespeichert und wieder eingelesen" : "nicht speicherbar – bitte kopieren"}</p><p><strong>Persönliche Dokumentinhalte enthalten:</strong> NEIN · <strong>Dateien außerhalb des Testbereichs verändert:</strong> NEIN</p></div>
        <div className="automatic-test-checks">{storageDiagnosticReport.phases.map((phase) => <article key={phase.id}>{phase.status === "bestanden" ? <CheckCircle2/> : <CircleHelp/>}<div><strong>{phase.label}: {phase.status === "bestanden" ? "bestanden" : phase.status === "fehlgeschlagen" ? "fehlgeschlagen" : "übersprungen"}</strong><span>{phase.fullPath} · {phase.pathLength} Zeichen{phase.technicalErrorDetail ? ` · ${phase.technicalErrorName}: ${phase.technicalErrorDetail}` : ""}</span></div></article>)}</div>
        <div className="button-row"><button className="button secondary" onClick={() => void copyStorageDiagnostic()}><ClipboardCheck/> {storageDiagnosticCopied ? "Windows-Diagnosebericht kopiert" : "Windows-Diagnosebericht kopieren"}</button></div>
      </section>}
      {automaticTestReport && <section className="test-workspace-panel automated-test-report" aria-live="polite">
        <div className="test-workspace-result-heading"><div><strong>Automatische Testumgebung eingerichtet und geprüft</strong><span>{automaticTestReport.workspaceName} · {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(automaticTestReport.completedAt))}</span></div><span className={`badge ${automaticTestReport.checks.every((check) => check.status === "bestanden") ? "success" : "warning"}`}>{automaticTestReport.checks.every((check) => check.status === "bestanden") ? "GRÜN" : "PRÜFEN"}</span></div>
        <div className="test-workspace-summary"><span><strong>{automaticTestReport.syntheticDocuments}</strong>synthetische Dateien</span><span><strong>{automaticTestReport.recognizedDocuments}</strong>erkannt</span><span><strong>{automaticTestReport.assignedSuggestions}</strong>zugeordnet</span><span><strong>{automaticTestReport.openAssignments}</strong>noch prüfen</span><span><strong>{automaticTestReport.changedFilesDetected}</strong>Änderungen erkannt</span><span><strong>{automaticTestReport.unavailableFilesDetected}</strong>Fehlerfall erkannt</span></div>
        <div className="test-workspace-details"><p><strong>Entwicklungsbasis:</strong> {automaticTestReport.developmentBaseName}</p><p><strong>Analysequelle:</strong> {automaticTestReport.sourceName} · <strong>Testdatentresor:</strong> {automaticTestReport.vaultName}</p><p><strong>Alter Testbestand:</strong> {automaticTestReport.existingTestStockDetected ? "FAMILIENAKTE_TESTBESTAND erkannt und unverändert erhalten" : "nicht vorhanden – für die automatische Testumgebung nicht erforderlich"}</p><p><strong>Sicherung/Wiederherstellung:</strong> {automaticTestReport.backupRestoreVerified ? "erfolgreich per Prüfsumme bestätigt" : "nicht vollständig bestätigt"}</p><p><strong>Prüfbericht:</strong> {automaticTestReport.reportPath}</p><p><strong>Externe Übertragung:</strong> NEIN · <strong>Dateien außerhalb des Testbereichs verändert:</strong> NEIN</p></div>
        <div className="automatic-test-checks">{automaticTestReport.checks.map((check) => <article key={check.id}><CheckCircle2/><div><strong>{check.label}</strong><span>{check.detail}</span></div></article>)}</div>
        {automaticTestReport.technicalIssues.length > 0 && <p className="test-workspace-warning"><strong>Technische Hinweise:</strong> {automaticTestReport.technicalIssues.join(" · ")}</p>}
        <div className="button-row"><button className="button secondary critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={automaticTestBusy || automaticTestBlocked} onClick={() => void runAutomaticTestEnvironment()}><RefreshCw/> Erneut prüfen</button><button className="button secondary critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={automaticTestBusy || automaticTestBlocked} onClick={resetAutomaticTestWorkspace}><History/> Testumgebung kontrolliert zurücksetzen</button></div>
      </section>}
      {sourceHandle && !testWorkspaceReport && <small className="test-workspace-saved">Vor der Testregister-Vorschau wird der gespeicherte Bestand kontrolliert erneut geprüft.</small>}
      {sourceHandle && <small className="test-workspace-saved">Gespeicherter Testordner: <strong>{sourceName}</strong> · Browserzugriff: {testWorkspacePermission === "granted" ? "freigegeben" : testWorkspacePermission === "denied" ? "nicht freigegeben" : testWorkspacePermission === "unsupported" ? "in diesem Browser nicht dauerhaft prüfbar" : "beim nächsten Prüfen erneut bestätigen"}</small>}
      {testWorkspaceOpen && <div className="test-workspace-panel" aria-live="polite">
        {!testWorkspaceReport && !testWorkspaceBusy && !testWorkspaceError && <p>Wähle den vorhandenen Testordner. Es werden nur der ausdrücklich freigegebene Ordner und seine Unterordner gelesen. Dateien werden nicht angelegt, verändert, verschoben oder gelöscht.</p>}
        {testWorkspaceError && <div><p className="form-error">{testWorkspaceError}</p><button className="button secondary" disabled={busy || testWorkspaceBusy} onClick={chooseAndInspectWorkspace}><FolderSearch/> Test-Hauptordner erneut auswählen</button></div>}
        {testWorkspaceReport && <>
          <div className="test-workspace-result-heading"><div><strong>{testWorkspaceReport.recommendation}</strong><span>Prüfung am {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(testWorkspaceReport.checkedAt))}</span></div><span className="badge success">nur gelesen</span></div>
          <div className="test-workspace-summary">
            <span><strong>{testWorkspaceReport.totalFiles}</strong>Dateien</span><span><strong>{testWorkspaceReport.totalDirectories}</strong>Unterordner</span><span><strong>{testWorkspaceReport.registerFiles}</strong>Register</span><span><strong>{testWorkspaceReport.documentFiles}</strong>Dokumente</span><span><strong>{testWorkspaceReport.backupFiles}</strong>Sicherungen</span><span><strong>{testWorkspaceReport.reportFiles}</strong>Prüfberichte</span>
          </div>
          <div className="test-workspace-details"><p><strong>Erkannte Versionen:</strong> {testWorkspaceReport.versions.length ? testWorkspaceReport.versions.join(", ") : "keine Versionsnummer erkannt"}</p><p><strong>Mögliche doppelte Bestandteile:</strong> {testWorkspaceReport.possibleDuplicateFiles}</p><p><strong>Online-/OneDrive-Hinweise:</strong> {testWorkspaceReport.onlineReferences} – es wurde keine Online-Verbindung hergestellt.</p>{testWorkspaceReport.excludedPaths.length > 0 && <p><strong>Geschützter Datentresor ausgeschlossen:</strong> {testWorkspaceReport.excludedPaths.join(" · ")}</p>}{testWorkspaceReport.accessIssues.length > 0 && <div className="test-workspace-warning"><strong>{testWorkspaceReport.accessIssues.length} Pfad{testWorkspaceReport.accessIssues.length === 1 ? "" : "e"} nicht vollständig lesbar:</strong><ul>{testWorkspaceReport.accessIssues.slice(0, 5).map((issue) => <li key={`${issue.operation}-${issue.path}`}>{issue.reason}</li>)}</ul>{testWorkspaceReport.accessIssues.length > 5 && <p>Weitere {testWorkspaceReport.accessIssues.length - 5} Hinweise wurden protokolliert.</p>}<button className="text-link" onClick={chooseAndInspectWorkspace}>Test-Hauptordner erneut auswählen</button></div>}{testWorkspaceReport.missingComponents.length ? <p className="test-workspace-warning"><strong>Noch prüfen:</strong> {testWorkspaceReport.missingComponents.join(" · ")}</p> : <p><strong>Grundstruktur:</strong> Register, Testdokumente, Sicherung und Prüfbericht wurden erkannt.</p>}</div>
          <p className="test-workspace-safety">Die Untersuchung war lesend. Für Anlegen, Überschreiben, Verschieben oder Löschen ist weiterhin eine eigene ausdrückliche Bestätigung erforderlich.</p>
        </>}
      </div>}
      {testRegisterError && <div className="test-workspace-panel"><p className="form-error">{testRegisterError}</p><div className="button-row"><button className="button secondary" disabled={busy || testRegisterBusy} onClick={chooseAndInspectWorkspace}><FolderSearch/> Test-Hauptordner erneut auswählen</button><button className="button secondary" disabled={busy || testRegisterBusy} onClick={() => onGo("security")}><HardDrive/> Testdatentresor erneut verbinden</button></div></div>}
      {testRegisterPreview && <section className="test-workspace-panel" aria-live="polite">
        <div className="test-workspace-result-heading"><div><strong>Vorbereitetes Testregister – nur Vorschau</strong><span>Analysequelle: {testRegisterPreview.sourceRootName} · Testdatentresor: {testRegisterPreview.vaultName}</span></div><span className="badge neutral">nicht gespeichert</span></div>
        <div className="test-workspace-summary">
          <span><strong>{testRegisterPreview.recognizedDocuments}</strong>Dokumente erkannt</span><span><strong>{testRegisterPreview.assignedDocuments}</strong>sinnvoll vorgeschlagen</span><span><strong>{testRegisterPreview.openAssignments}</strong>noch prüfen</span><span><strong>{testRegisterPreview.possibleDuplicates}</strong>mögliche Dubletten</span><span><strong>{testRegisterPreview.sensitiveDocuments}</strong>sensibel</span><span><strong>{testRegisterPreview.accessIssues.length}</strong>technische Hinweise</span>
        </div>
        <div className="test-workspace-details"><p><strong>Registerstatus:</strong> {testRegisterPreview.registerStatus}</p><p><strong>Speicherstatus:</strong> {testRegisterPreview.storageStatus}</p><p><strong>Sicherheitsprüfung:</strong> {testRegisterPreview.securityStatus}{testRegisterPreview.sensitiveDocuments ? " – sensible personenbezogene Testunterlagen vor einer Übernahme kontrollieren; für Funktionstests möglichst anonymisierte oder synthetische Daten verwenden." : " – keine sensiblen Testunterlagen anhand der Vorschläge erkannt."}</p><p><strong>Externe Übertragung:</strong> NEIN</p>{testRegisterPreview.accessIssues.length > 0 && <p className="test-workspace-warning"><strong>Technische Hinweise:</strong> {testRegisterPreview.accessIssues.slice(0, 3).map((issue) => issue.reason).join(" · ")}</p>}</div>
        <details><summary>Vorgeschlagene Dokumentzuordnungen ansehen</summary><div className="test-register-preview-list">{testRegisterPreview.items.slice(0, 20).map((item) => <article className="record-row" key={item.id}><div><strong>{item.originalName}</strong><span>{item.sourceRelativePath}</span><small>{item.canonicalLifeArea}{item.personalLifeArea ? ` → ${item.personalLifeArea}` : ""} · {item.documentType} · {item.confidence === "eindeutig" ? "Sicher" : item.confidence === "wahrscheinlich" ? "Wahrscheinlich" : "Unklar"}</small></div><span className={`badge ${item.confidence === "unklar" ? "warning" : "neutral"}`}>{item.reviewGroup === "duplicate" ? "Dublette prüfen" : item.confidence === "unklar" ? "Zuordnung prüfen" : "Vorschlag"}</span></article>)}{testRegisterPreview.items.length > 20 && <p>Weitere {testRegisterPreview.items.length - 20} Vorschläge sind im vorbereiteten Register enthalten.</p>}</div></details>
        <div className="button-row"><button className="button primary" disabled={testRegisterBusy} onClick={confirmPreparedTestRegister}><Save/> Testregister ausdrücklich übernehmen</button><button className="button secondary" disabled={testRegisterBusy} onClick={() => { setTestRegisterPreview(null); setTestRegisterSaved(""); }}>Vorschau verwerfen</button></div>
        <p className="test-workspace-safety">Erst „Testregister ausdrücklich übernehmen“ speichert neue Vorschläge im bestehenden Register. Dabei entstehen keine Archivkopien und keine Assistenzfreigaben.</p>
      </section>}
      {testRegisterSaved && <div className="test-register-success" role="status"><CheckCircle2/><span>{testRegisterSaved}</span></div>}
    </section>}
    {!vaultReady && <section className="info-note"><span>Info</span><p>Bitte zuerst den führenden lokalen Familienakten-Tresor verbinden. Analyseergebnisse werden nur im bestehenden Register gespeichert.</p><button className="text-link" onClick={() => onGo("security")}>Sicherheitscenter öffnen</button></section>}
    {progress && (busy || progress.phase === "pausiert") && <section className="card inventory-progress" aria-live="polite"><RefreshCw className={busy ? "spin" : ""}/><div><strong>{progress.currentName}</strong><p>{progress.processed} von {progress.discovered} Dateien geprüft{progress.skippedUnchanged ? ` · ${progress.skippedUnchanged} unverändert wiedererkannt` : ""}</p><progress value={progress.processed} max={Math.max(1, progress.discovered)}/></div></section>}
    {!!items.length && <>
      <section className="inventory-summary" aria-label="Ergebnis der Bestandsanalyse">
        <button className={group === "all" ? "active" : ""} aria-pressed={group === "all"} onClick={() => openGroup("all")}><strong>{summary.total}</strong><span>Dateien analysiert</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.newFiles}</strong><span>neu</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.unchanged}</strong><span>unverändert</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.changed}</strong><span>verändert</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.moved}</strong><span>verschoben erkannt</span></button>
        <button className={group === "recommended" ? "active" : ""} aria-pressed={group === "recommended"} onClick={() => openGroup("recommended")}><strong>{summary.recommended}</strong><span>empfohlen</span></button>
        <button className={group === "review" ? "active" : ""} aria-pressed={group === "review"} onClick={() => openGroup("review")}><strong>{summary.review}</strong><span>noch prüfen</span></button>
        <button className={group === "duplicate" ? "active" : ""} aria-pressed={group === "duplicate"} onClick={() => openGroup("duplicate")}><strong>{summary.duplicate}</strong><span>Dubletten</span></button>
        <button className={group === "low" ? "active" : ""} aria-pressed={group === "low"} onClick={() => openGroup("low")}><strong>{summary.low}</strong><span>geringe Relevanz</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.archived}</strong><span>archiviert</span></button>
        <button onClick={() => openGroup("all")}><strong>{summary.assistantReleased}</strong><span>Assistenz freigegeben</span></button>
      </section>
      <section className="card inventory-toolbar" id="inventory-results" tabIndex={-1}>
        <div><span className="eyebrow">Ausgewählte Ansicht</span><h2>{groupLabels[group]} · {visible.length} Datei{visible.length === 1 ? "" : "en"}</h2></div>
        <div className="filter-buttons">{(Object.keys(groupLabels) as Array<InventoryReviewGroup | "all">).map((id) => <button key={id} className={group === id ? "active" : ""} onClick={() => openGroup(id)}>{groupLabels[id]}</button>)}</div>
        <div className="inventory-actions">
          <div className="inventory-action-card">
            <button className="button tertiary" disabled={!visible.length || busy} onClick={selectVisible}><CheckCircle2/> Dateien auswählen</button>
            <div className="inventory-action-help"><InfoPopover label="Dateien auswählen erklären" text="Markiert alle Dateien der gerade angezeigten Ansicht. Ein gewählter Filter begrenzt die Auswahl auf genau diese sichtbaren Dateien."/></div>
          </div>
          <div className="inventory-action-card">
            <button className={`button ${selected.length && !busy ? "tertiary" : "secondary inventory-action-inactive"}`} disabled={!selected.length || busy} onClick={() => setSelected([])}><X/> Auswahl aufheben</button>
            <div className="inventory-action-help"><InfoPopover label="Auswahl aufheben erklären" text="Entfernt nur die gesetzten Auswahlhäkchen. Bereits archivierte Dateien, Assistenzfreigaben und Originaldateien bleiben unverändert."/></div>
          </div>
          <div className="inventory-action-card">
            <button className={`button ${archiveReady ? "primary" : "secondary inventory-action-inactive"}`} disabled={!archiveReady} onClick={() => onArchive(archiveIds)}><Archive/> {archiveIds.length ? `${archiveIds.length} Dateien archivieren` : "Dateien archivieren"}</button>
            <div className="inventory-action-help"><InfoPopover label="Archivierung erklären" text="Kopiert die markierten, noch nicht archivierten Dateien mit Prüfsummenkontrolle in das verbundene Testarchiv. Die Originaldateien bleiben unverändert. Nach erfolgreicher Archivierung wird die Assistenzfreigabe verfügbar."/></div>
          </div>
          <div className="inventory-action-card">
            <button className={`button ${releaseReady ? "primary" : "secondary inventory-action-inactive"}`} disabled={!releaseReady} onClick={() => onRelease(releaseIds)}><ShieldCheck/> Assistenzfreigabe</button>
            <div className="inventory-action-help"><InfoPopover label="Assistenzfreigabe erklären" text="Damit erlaubst du der Familienakte, die von dir ausgewählten und bereits archivierten Dokumente in der vorhandenen Suche, in Vorgängen, Chronologien und bei passenden Fragen des Familienassistenten zu berücksichtigen. Die Originaldateien werden dabei nicht verändert oder an einen kostenpflichtigen externen Dienst übertragen. Nicht freigegebene Dokumente bleiben von dieser aktiven Nutzung ausgeschlossen."/></div>
          </div>
          <div className="inventory-action-card">
            <button className={`button ${resetIds.length && !busy ? "secondary reset-ready" : "secondary inventory-action-inactive"}`} disabled={!resetIds.length || busy || !archiveName} onClick={() => onReset(resetIds)}><RefreshCw/> {resetIds.length ? `${resetIds.length} Dateien zurücksetzen` : "Dateien zurücksetzen"}</button>
            <div className="inventory-action-help"><InfoPopover label="Dateien zurücksetzen erklären" text="Setzt nur die markierten archivierten oder assistenzfreigegebenen Testdateien wieder auf „Quelle analysiert“. Die zugehörigen Kopien im verbundenen Testarchiv und die Assistenzfreigaben werden nach Bestätigung entfernt. Originaldateien bleiben unverändert. Fachlich verknüpfte Dokumente werden aus Sicherheitsgründen nicht automatisch zurückgesetzt."/></div>
          </div>
        </div>
        <small className="inventory-selection-status" aria-live="polite">{!vaultReady || !sourceName || !archiveName ? "Quelle, Datentresor und Testarchiv müssen verbunden sein." : !selected.length ? "Markiere zuerst mindestens eine Datei über das Auswahlkästchen. Dann wird „Dateien archivieren“ blau." : archiveReady ? `${archiveIds.length} noch nicht archivierte Datei${archiveIds.length === 1 ? " ist" : "en sind"} ausgewählt. „${archiveIds.length} Dateien archivieren“ ist jetzt blau und kann betätigt werden.${selectedItems.length > archiveIds.length ? ` ${selectedItems.length - archiveIds.length} weitere markierte Datei${selectedItems.length - archiveIds.length === 1 ? " ist" : "en sind"} bereits weiter bearbeitet und werden nicht erneut archiviert.` : ""}` : releaseReady ? `${selectedItems.length} Datei${selectedItems.length === 1 ? " ist bereits archiviert" : "en sind bereits archiviert"}. Deshalb ist jetzt „Assistenzfreigabe“ blau.` : selectedItems.some((item) => item.state === "ASSISTENZ_FREIGEGEBEN") ? "Mindestens eine markierte Datei ist bereits für die Assistenz freigegeben." : "Die markierten Dateien können in ihrem aktuellen Zustand nicht archiviert oder freigegeben werden."}</small>
        <small className="inventory-process-hint"><strong>Hinweis:</strong> Nach „Dateien archivieren“ benötigt die Prüfung einige Sekunden. Sobald die Archivierung abgeschlossen ist, wird „Assistenzfreigabe“ blau. Das gilt auch für später zusätzlich ausgewählte Dateien. Nach der Assistenzfreigabe wird die Schaltfläche wieder weiß.</small>
        {archiveResult && <section className={`inventory-archive-feedback ${archiveResult.failed ? "has-warning" : "is-success"}`} role="status"><strong>{archiveResult.failed ? "Archivierung mit offenen Punkten" : "Archivierung abgeschlossen"}</strong><span>{archiveResult.archived} Dateien archiviert · {archiveResult.alreadyArchived} bereits vorhanden · {archiveResult.failed} offen. Originaldateien blieben unverändert.</span></section>}
      </section>
      <section className="inventory-list">{visible.map((item) => {
        const protectedTitle = protectedFamilyLabel({ label: item.originalName, category: item.lifeArea });
        return <article className="card inventory-item" key={item.id}>
          <label className="inventory-select"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)}/><span>Datei auswählen</span></label>
          <InventoryThumbnail item={item} sourceHandle={sourceHandle}/>
          <div className="inventory-body"><span className="eyebrow">{item.lifeArea}</span><h3>{protectedTitle}</h3><p>{item.reason}</p><small>{fmtBytes(item.sizeBytes)} · {item.documentType} · {item.confidence}</small><small>Bestand: {item.sourceStatus.replaceAll("_", " ")} · Inhalt: {item.contentStatus.replaceAll("_", " ")}{item.versionOfInventoryIds.length ? ` · ${item.versionOfInventoryIds.length} verwandte Version(en)` : ""}</small>{item.assignmentReferences.length > 0 && <small>Vorgeschlagene Bezüge: {item.assignmentReferences.map((reference) => reference.label).join(", ")}</small>}{item.learningSuggestion && <div className={`inventory-learning-hint ${item.learningSuggestion.confidence === "Unklar" ? "needs-review" : ""}`}><strong>{item.learningSuggestion.confidence}: {item.learningSuggestion.suggestedLifeArea}</strong><span>{item.learningSuggestion.reason}</span><small>{item.learningSuggestion.supportCount} frühere bestätigte Zuordnungen berücksichtigt</small></div>}{item.assignmentConfirmedAt && !item.learningSuggestion && <small className="inventory-confirmed-assignment">✓ Von dir bestätigt – dient künftig als Lernhilfe.</small>}</div>
          <div className="inventory-item-actions"><div className={`inventory-state state-${item.state.toLocaleLowerCase("de")}`}>{item.state === "QUELLE_ANALYSIERT" ? "Quelle analysiert" : item.state === "ARCHIVIERT" ? "Archiviert" : "Assistenz freigegeben"}</div><button className="button secondary inventory-preview-button" onClick={() => setPreviewItemId(item.id)}><Eye size={15}/> Ansehen</button></div>
        </article>;
      })}</section>
      {!!photoSeries.length && <section className="card"><span className="eyebrow">Fotoserien</span><h2>{photoSeries.length} Dokumentationsgruppe{photoSeries.length === 1 ? "" : "n"} erkannt</h2><p>Ähnliche Fotos bleiben einzeln auffindbar, können aber gemeinsam geprüft werden.</p></section>}
      {lastRun && <section className="info-note"><span>Info</span><p>Letzter Bestandslauf: {lastRun.processed} von {lastRun.discovered} Dateien geprüft · {lastRun.newFiles} neu · {lastRun.changed} verändert · {lastRun.unchanged} unverändert · {lastRun.paused ? "pausiert und fortsetzbar" : "abgeschlossen"}. Originaldateien blieben unverändert.</p></section>}
      {previewItem && <InventoryPreviewDialog item={previewItem} sourceHandle={sourceHandle} areaOptions={areaOptions} records={records} busy={busy} onClose={() => setPreviewItemId(null)} onConfirm={async (...args) => { await onConfirmAssignment(...args); setPreviewItemId(null); }} onGo={onGo}/>}
    </>}
    {!items.length && !busy && <section className="info-note"><span>Info</span><p>Verwende den bereits vorbereiteten und verbundenen Testbestand. Die ZIP-Ausgangsdatei selbst soll nicht als analysierter Bestand verwendet werden.</p></section>}
  </>;
}

/** Seite drucken: in der Android-App über Androids Druckdienst (die WebView kennt window.print nicht), sonst wie bisher. */
function seiteDrucken() {
  const druck = (window as unknown as { Capacitor?: { Plugins?: { FamilienakteDruck?: { seite: (o: { titel: string }) => Promise<unknown> } } } }).Capacitor?.Plugins?.FamilienakteDruck;
  if (druck) { void druck.seite({ titel: document.title || "Familienakte" }).catch(() => window.print()); return; }
  window.print();
}

/** Stand der Benutzerabnahme für das Bild in der Hilfe (nur lesen). */
function abnahmeErgebnisse() {
  const run = latestUserAcceptance(readSystemCheckReports(), APP_VERSION);
  return Object.fromEntries(Object.entries(run?.answers || {}).map(([id, antwort]) => [id, latestUserResult(antwort)?.result]));
}
function HelpCenter({ onGo, onSearch, demo, datentresor, herkunft, letzteSicherung = null, speicher, ordnerWahl = false }: { onGo: GehMitZiel; onSearch: (value: string) => void; demo?: React.ReactNode; datentresor?: string; herkunft?: SectionId; letzteSicherung?: string | null; speicher?: "pro-gesperrt" | "app"; ordnerWahl?: boolean }) {
  const eingerichtet = useMemo(() => hilfeEingerichtet(datentresor), [datentresor]);
  // Klaus 09.11.: Landkarte und „Akten sichern“ zeigen den Zustand dieses Geräts (grün, rot, gelb, grau) mit „Beheben ›“.
  const live = useLiveZustand(datentresor, letzteSicherung, speicher, ordnerWahl);
  // 2.28.62: „Demo verlassen ›“ am Demo-Kasten der Landkarte – wie der Eintrag im DEMO-Menü.
  useEffect(() => { const verlassen = () => switchDemo(false); window.addEventListener(DEMO_VERLASSEN, verlassen); return () => window.removeEventListener(DEMO_VERLASSEN, verlassen); }, []);
  // Vorschaufenster (Sitzung 4): Skizze der Zielseite aus den echten Kartentiteln, Sprung mit rotem Rahmen.
  const vs = (seite: SectionId, karte?: string): Vorschau => ({ seite, karte, titel: sectionLabels[seite],
    karten: SEITEN_KARTEN[seite] || [], hin: sprung(onGo, seite, karte) });
  const VORSCHAU_NEU: Record<string, [SectionId, string?]> = { "mein-kalender": ["reminders", "Mein Kalender"], "app-glocke": ["reminders", "Mein Kalender"], "umzug": ["security", "Vollständige Sicherung"], "internet": ["overview"], "zu-gross": ["inbox", "Eingänge prüfen"], "notiz": ["overview"], "auge": ["reminders", "Offene Fristen und Aufgaben"], "loeschen": ["reminders", "Offene Fristen und Aufgaben"], "einklappen": ["reminders", "Offene Fristen und Aufgaben"], "neu": ["overview"], "update": ["overview"], "teilen": ["inbox", "Neue Unterlagen erfassen"], "workflow-pdf": ["workflowpdf"], "drucken": ["overview"] };
  const themen: HilfeThemaEl[] = [
    { id: "wo-liegt-was", titel: "Wo liegt was?", el: <ProTresorWoLiegtWas onVerbinden={() => onGo("security")} onDokumente={() => onGo("documents")}/> },
    { id: "akten-sichern", titel: "Akten sichern – Plan zum Abhaken", el: <AktensicherungHilfe onSicherheit={(ziel) => onGo("security", undefined, ziel ? { ziel } : undefined)} onDokumente={() => onGo("documents")} datentresor={datentresor} live={live}/> },
    { id: "fristen-kalender", titel: "Fristen im Kalender", el: <KalenderHilfe zurKarte={() => onGo("reminders", undefined, { ziel: () => zurStelle("#kalender-verbinden", { sofort: true }) })}/> },
    { id: "email", titel: "E-Mail in die Familienakte", el: <EmailHilfe onEingang={() => onGo("inbox")} onSchreiben={() => onGo("assistant")}/> },
    { id: "pro-verbund", titel: "Pro-App-Verbund (Vorschau)", el: <ProVerbundHilfe/> },
    ...NEUE_HILFE_THEMEN.map((t) => ({ id: t.id, titel: t.titel, el: <HilfeThemaEintrag thema={t} vorschau={VORSCHAU_NEU[t.id] ? vs(...VORSCHAU_NEU[t.id]!) : undefined}/> })),
    { id: "benutzerabnahme", titel: "Praktische Benutzerabnahme (für Prüfer)", el: <BenutzerabnahmeHilfe ergebnisse={abnahmeErgebnisse()} zurAbnahme={(id) => { const t0 = performance.now(); onGo("systemcheck", undefined, { ziel: () => (id ? zurStelle(`[data-user-test="${id}"]`, { sofort: true }) : false) || ((!id || performance.now() - t0 > 1500) && zurStelle("#benutzerabnahme", { sofort: true })) }); }}/> },
    { id: "kartenhilfe", titel: "Hilfe zu Karten und Funktionen", el: <details data-kartenhilfe><summary><CircleHelp/> Hilfe zu Karten und Funktionen</summary><div>{Object.entries(UI_HELP).map(([title, text]) => { const ziel = UI_HELP_ZIEL[title]; return <details key={title} data-kartenhilfe-eintrag={title}><summary>{title}</summary><p>{text}</p>{ziel && <button type="button" className="hilfe-sprung" data-kartenhilfe-ziel={ziel} onClick={() => onGo(ziel, undefined, { ziel: () => zurKarte(title, { sofort: true }) })}>{sectionLabels[ziel]} › {title} <span aria-hidden="true">›</span></button>}</details>; })}</div></details> },
    { id: "aktivitaet", titel: "Was zeigen die zwei Aktivitätszeilen?", el: <BildThema id="aktivitaet" symbol={<ListChecks/>} titel="Was zeigen die zwei Aktivitätszeilen?" weg="Startseite › direkt unter der Suche" bild={<Ablaufbild label="Was die Aktivitätszeilen zeigen" knoten={[{ titel: "Du tust etwas" }, { titel: "Zeile erscheint", unter: "neueste oben", art: "hervor" }, { titel: "Farbe", unter: "grün erledigt · gelb prüfen · rot fehlgeschlagen" }, { titel: "Kopieren", unter: "kopiert nur diese Zeile" }]}/>}
      merk={[<><b>Nur deine laufende Sitzung</b>; nach dem Neuladen sind die Zeilen leer.</>, <><b>Ein offener Dialog ist noch nicht gespeichert.</b></>, <><b>Kopieren</b> verändert nichts.</>]} vorschau={vs("overview")}
      ausfuehrlich={<><p>Direkt unter der Suche stehen die letzten zwei tatsächlichen Rückmeldungen deiner laufenden Sitzung. Die neueste steht oben. Grün bedeutet erfolgreich, Rot fehlgeschlagen und Gelb noch zu prüfen. Ein geöffneter Dialog oder eine vorbereitete Datei bedeutet noch keine Speicherung.</p><p>„Kopieren“ kopiert nur den vollständigen Text der jeweiligen Zeile. „Kopiert“ bestätigt den Vorgang. Die beiden Schaltflächen arbeiten unabhängig und verändern keine Dokumente oder Prüfberichte. Nach einem vollständigen Neuladen sind die Zeilen wieder leer; die bestehenden Register und Prüfberichte bleiben erhalten. Gesundheitsbezogene Einzelheiten werden hier nicht offen angezeigt.</p></>}/> },
    { id: "assistenz", titel: "Wie arbeitet die Assistenz- und Korrespondenzzentrale?", el: <BildThema id="assistenz" symbol={<Bot/>} titel="Wie arbeitet die Assistenz- und Korrespondenzzentrale?" weg="Assistenz › Schreiben / E-Mail" bild={<Ablaufbild label="Von der Frage zum Schreiben" knoten={ablaufAssistenz(onGo)}/>}
      merk={[<><b>Nur freigegebene</b> oder mit dem Vorgang verbundene Dokumente.</>, <><b>Die Familienakte versendet nie selbst.</b></>, <><b>Briefe beantworten mit deiner KI:</b> vorher verdeckt.</>]} vorschau={vs("assistant")} ziel={{ text: "Zur Assistenz", los: () => onGo("assistant") }}
      ausfuehrlich={<><p>Die Assistenz verwendet die vorhandenen Vorgänge, Relationen, Dokumente, Personen, Organisationen, Aufgaben und Fristen. Sie führt keine zweite Datenbank und keine zweite Freigabelogik.</p><p>Drei Wege: <strong>In der Akte nachsehen</strong> (Antwort aus deinen Unterlagen mit Fundstellen, ohne KI und ohne Internet), <strong>Brief oder E-Mail beantworten</strong> (Namen, Anschriften, Nummern, Beträge und Daten werden zu Platzhaltern; du kopierst den verdeckten Text in deine eigene KI, öffnest ChatGPT oder Claude per Link oder sendest ihn mit eigenem Schlüssel an Mistral in der EU; die Antwort bekommt die echten Angaben zurück) und <strong>Vorgang oder Termin vorbereiten</strong> (was offen ist, was fehlt, ein Schreiben aus Vorlagen).</p><p>Ein Antwortbrief lässt sich als Entwurf speichern oder als PDF in Workflow PDF öffnen (Briefkopf, Unterschrift, Drucken).</p><p>Aktiv verwendet werden nur assistenzfreigegebene Dokumente oder Unterlagen, die ausdrücklich mit dem ausgewählten Vorgang verbunden sind. Schreiben und E-Mails bleiben Entwürfe, bis du Empfänger, Inhalt, Vorgang und Anlagen geprüft hast. Die Familienakte versendet niemals automatisch. E-Mails aus deiner Mail-App kommen über „Teilen an die Familienakte“ in die Eingangszentrale.</p><p>Mit „Als versendet speichern“ wird nur dokumentiert, was du außerhalb der Familienakte versendet hast. Der Eintrag wird im bestehenden Familienaktenregister gespeichert und mit vorhandenen Vorgängen und Dokumenten verknüpft.</p></>}/> },
    { id: "bestand-pruefen", titel: "Was ist „Bestand prüfen“?", el: <BildThema id="bestand-pruefen" symbol={<FolderSearch/>} titel="Was ist „Bestand prüfen“?" weg="Dokumente › Bestand prüfen" bild={<Ablaufbild label="Bestand prüfen Schritt für Schritt" knoten={[{ titel: "Ordner wählen", unter: "Test-, PC- oder OneDrive-Ordner", ziel: sprung(onGo, "inventory") }, { titel: "Lesen und sortieren", unter: "wichtig · prüfen · doppelt · Fotoserie" }, { titel: "Ansehen", unter: "Vorschau, PDF blättern" }, { titel: "Zuordnung bestätigen", unter: "erst jetzt wird angelegt", art: "hervor", ziel: sprung(onGo, "inventory") }, { titel: "Archivieren", unter: "Kopie auf dem Archiv-Laufwerk", art: "gut" }]}/>}
      merk={[<><b>Nur lesen:</b> Originale werden nie verschoben, umbenannt oder gelöscht.</>, <><b>Alles nur Vorschlag</b>, bis du „Zuordnung bestätigen“ tippst.</>, <><b>„Nicht übernehmen“</b> heißt nie löschen.</>]} ziel={{ text: "Bestand prüfen öffnen", los: () => onGo("inventory") }} vorschau={vs("inventory")}
      ausfuehrlich={<><p>Du wählst selbst einen Test-, PC- oder lokalen OneDrive-Ordner aus. Die Familienakte liest nur diesen Ordner, bildet Prüfsummen und gruppiert wichtige Unterlagen, Prüfbedarf, mögliche Dubletten, geringe Relevanz und Fotoserien.</p><p>Mit <strong>„Ansehen“</strong> öffnest du vor der Zuordnung eine kompakte Vorschau. PDF-Dateien und Bilder werden direkt dargestellt; bei Text, Word und E-Mail erscheint soweit lesbar ein Textausschnitt. Mehrseitige PDF-Dateien lassen sich im Vorschaufenster durchblättern.</p><p>Vor einer Textanzeige prüft die Familienakte Zeichencodierung und Lesbarkeit. UTF-8, UTF-16 und Windows-1252 werden soweit möglich erkannt. Binärdaten, Hieroglyphen und offensichtlich falsch decodierte Inhalte werden nicht angezeigt. Stattdessen erscheint <strong>„Manuelle Prüfung erforderlich“</strong> mit der Möglichkeit, das unveränderte Original zu öffnen.</p><p>Person, Organisation, Objekt und Vorgang können aus bereits vorhandenen Familienakten-Einträgen gewählt werden. Eine freie Eingabe ist ebenfalls möglich, wird aber erst durch <strong>„Zuordnung bestätigen“</strong> angelegt. Vorher wird geprüft, ob ein gleichnamiger Eintrag bereits existiert. Kategorie, persönlicher Lebensbereich, Dokumentenart und wichtige Stichworte bleiben ebenfalls bis zur Bestätigung nur bearbeitbare Vorschläge.</p><p>Geschützte Gesundheitsinhalte werden in der allgemeinen Bestandsansicht nicht offen gezeigt. Ist keine Vorschau möglich, kannst du das erreichbare Original öffnen. Dabei wird die Originaldatei nicht verändert.</p><p><strong>Quelle analysiert</strong> bedeutet: nur erkannt und bewertet. <strong>Archiviert</strong> bedeutet: eine geprüfte Kopie liegt auf dem freigegebenen Archivdatenträger. <strong>Assistenz freigegeben</strong> bedeutet: Das Dokument darf zusätzlich in Bibliothek, Suche, Vorgängen und Familienassistent verwendet werden.</p><p>„Nicht übernehmen“ bedeutet niemals löschen. Originaldateien werden nicht verschoben, umbenannt, überschrieben oder entfernt. Sammelfreigaben benötigen deinen bewussten Klick.</p></>}/> },
    { id: "testakte", titel: "Was ist die „Testakte für Weiterentwicklung“?", el: <BildThema id="testakte" symbol={<FolderHeart/>} titel="Was ist die „Testakte für Weiterentwicklung“?" weg="Bestand prüfen › Testumgebung automatisch einrichten und prüfen" bild={<Ablaufbild label="Testakte Schritt für Schritt" knoten={[{ titel: "Testordner wählen", unter: "einmal, bewusst", ziel: sprung(onGo, "inventory") }, { titel: "Testumgebung anlegen", unter: "eigener Unterordner, künstliche Daten" }, { titel: "Prüfen", unter: "Sicherung · Wiederherstellung · Bericht" }, { titel: "Rot?", unter: "zeigt Schritt und Ursache", art: "warnung" }]}/>}
      merk={[<><b>Nur künstliche Daten</b> in einem eigenen Unterordner.</>, <><b>Deine Akte und die Originale</b> bleiben unverändert.</>, <><b>Rot sperrt nur das Abhängige</b>; Navigation, Hilfe und Systemprüfung gehen weiter.</>]} ziel={{ text: "Testakte öffnen", los: () => onGo("inventory") }} vorschau={vs("inventory")}
      ausfuehrlich={<><p>Mit „Testumgebung automatisch einrichten und prüfen“ wählst du einmal den festen Entwicklungsordner „SOFTWARE TESTORDNER“. Darin erzeugt die Familienakte ausschließlich im eindeutig gekennzeichneten Unterordner „Familienakte_Automatische_Testumgebung_2.28.1“ künstliche Testdokumente, ein vorhandenes Familienakten-Register, Sicherungen, eine Testwiederherstellung und einen Prüfbericht. Quelle und Testdatentresor bleiben getrennt.</p><p>Der Browser erlaubt keinen stillen Zugriff über den Windows-Pfad. Deshalb muss der Ordner beim ersten Mal bewusst ausgewählt werden; nach einem Browser- oder Laufwerkswechsel kann eine erneute Berechtigung nötig sein. Ungültige alte Verbindungen blockieren die neue Testumgebung nicht.</p><p>Scheitert eine notwendige Pflichtprüfung, zeigt ein rotes Feld deutlich Arbeitsschritt und Ursache. Nur die davon abhängigen Testaktionen werden grau gesperrt; Navigation, Hilfe und Systemprüfung bleiben verfügbar. „Allgemeinen technischen Fehlerbericht kopieren“ kopiert den Fehlerstatus der Testumgebung. „Windows-Diagnosebericht kopieren“ kopiert dagegen die fünf getrennten Dateisystemprüfungen einschließlich Pfad und technischer Ausnahme.</p><p>Die bisherigen manuellen Funktionen bleiben für gezielte Sonderprüfungen erhalten. „Testregister vorbereiten“ erzeugt weiterhin nur eine Vorschau. Erst „Testregister ausdrücklich übernehmen“ speichert neue Einträge als QUELLE_ANALYSIERT.</p><p>Ein kontrolliertes Zurücksetzen löscht ausschließlich den gekennzeichneten automatischen Testbereich und erzeugt ihn mit synthetischen Daten neu. FAMILIENAKTE_TESTBESTAND, andere Ordner, Originaldateien und die Produktivversion bleiben unverändert.</p></>}/> },
    { id: "fawoga-onedrive", titel: "Wie funktioniert die FaWoGa-OneDrive-Prüfung?", el: <BildThema id="fawoga-onedrive" symbol={<Cloud/>} titel="Wie funktioniert die FaWoGa-OneDrive-Prüfung?" weg="Dokumente › Bestand prüfen" bild={<Ablaufbild label="FaWoGa-Prüfung" knoten={[{ titel: "Hauptordner wählen", unter: "nur dieser", ziel: sprung(onGo, "inventory") }, { titel: "Alle Unterordner lesen", unter: "Herkunftspfad bleibt" }, { titel: "Sortieren", unter: "neu · geändert · verschoben · doppelt", art: "hervor" }, { titel: "Freigeben", unter: "nur sichere Gruppen", art: "gut" }]}/>}
      merk={[<><b>Nur der gewählte Ordner</b>, keine Dauerüberwachung.</>, <><b>Originale bleiben unverändert.</b></>, <><b>Spätere Läufe</b> prüfen nur Neues und Geändertes; Pause möglich.</>]} ziel={{ text: "FaWoGa-OneDrive-Test öffnen", los: () => onGo("inventory") }} vorschau={vs("inventory", "Nur Neues prüfen")}
      ausfuehrlich={<><p>FaWoGa ist der Name der Ordnungshilfe der Familienakte: sie liest einen Ordnerbestand und schlägt vor, wohin jede Datei gehört. Du wählst unter <strong>Dokumente → Bestand prüfen</strong> nur den gewünschten großen Hauptordner aus. Die Familienakte durchsucht automatisch alle darin enthaltenen Unterordner, deren Unterordner und die dort verteilten Dateien. Du musst Dokumente nicht vorher in einem einzigen Ordner sammeln.</p><p>Andere OneDrive-Bereiche werden nicht durchsucht und es läuft keine Dauerüberwachung. Der ursprüngliche Unterordner und vollständige relative Herkunftspfad jedes Dokuments bleiben im Bestandsregister erhalten.</p><p>Beim ersten Lauf werden Dateien inventarisiert und soweit möglich inhaltlich ausgewertet. Spätere Läufe unterscheiden neue, unveränderte, geänderte, verschobene und nicht mehr erreichbare Dateien. Unveränderte Inhalte werden nicht unnötig erneut vollständig analysiert. Eine laufende Prüfung kann pausiert und später fortgesetzt werden.</p><p><strong>Prüfung erforderlich</strong> bedeutet, dass Bedeutung oder Zuordnung noch nicht sicher sind. <strong>Dublette</strong> bezeichnet eine möglicherweise bereits vorhandene gleiche Unterlage. Ähnliche Fassungen wie Nachtrag, Korrektur oder unterschriebene Version bleiben getrennt und werden miteinander verknüpft.</p><p>Kategorien, bestätigte persönliche Lebensbereiche, Personen, Organisationen, Objekte und Vorgänge stammen aus der bestehenden Familienakte. Sammelfreigaben gelten nur für sichere Gruppen. Originale bleiben unverändert. Erst <strong>ASSISTENZ_FREIGEGEBENE</strong> Unterlagen dürfen aktiv in Suche, Vorgängen und Familienassistent verwendet werden.</p><p>In der privaten Testfassung kannst du markierte, noch nicht fachlich verknüpfte Testdateien mit <strong>Auswahl zurücksetzen</strong> wieder auf „Quelle analysiert“ stellen. Dabei werden nur Testarchiv-Kopien und Assistenzfreigaben entfernt; Originaldateien bleiben erhalten.</p></>}/> },
    { id: "fawoga-lernt", titel: "Wie lernt FaWoGa aus meinen Zuordnungen?", el: <BildThema id="fawoga-lernt" symbol={<Tags/>} titel="Wie lernt FaWoGa aus meinen Zuordnungen?" weg="Bestand prüfen › Zuordnung prüfen und bestätigen" bild={<Ablaufbild label="Wie FaWoGa lernt" knoten={[{ titel: "Zuordnung prüfen", ziel: sprung(onGo, "inventory") }, { titel: "„Zuordnung bestätigen“", unter: "wird Lernhilfe", art: "hervor" }, { titel: "Ab zwei gleichen Entscheidungen", unter: "Vorschlag bevorzugt" }, { titel: "Hinweis", unter: "Sicher · Wahrscheinlich · Unklar", art: "gut" }]}/>}
      merk={[<><b>Gelernt wird nur aus deinem Bestätigen.</b></>, <><b>Eine einzelne Wahl</b> wird keine feste Regel.</>, <><b>Widerspruch:</b> die alte Einordnung bleibt, du prüfst selbst.</>]} ziel={{ text: "Lernfähige Zuordnung testen", los: () => onGo("inventory") }} vorschau={vs("inventory")}
      ausfuehrlich={<><p>Öffne bei einer analysierten Datei <strong>„Zuordnung prüfen und bestätigen“</strong>. Erst dein ausdrücklicher Klick auf „Zuordnung bestätigen“ speichert den Lebensbereich und die Dokumentenart als Lernhilfe im bestehenden Familienakten-Register.</p><p>Bei späteren ähnlichen Unterlagen berücksichtigt FaWoGa unter anderem Organisation, Absender, Dokumentenart, Begriffe, Vorgang, Objekt und Ordnerzusammenhang. Mindestens zwei passende bestätigte Entscheidungen sind nötig, bevor ein Lebensbereich bevorzugt vorgeschlagen wird. Eine einzelne Auswahl erzeugt keine starre Regel.</p><p>Ein gelernter Hinweis wird mit <strong>Sicher</strong>, <strong>Wahrscheinlich</strong> oder <strong>Unklar</strong> gekennzeichnet. Widerspricht der aktuelle Inhalt früheren Entscheidungen, bleibt die bestehende Einordnung erhalten und die Datei muss manuell geprüft werden. Persönliche Lebensbereiche werden genauso berücksichtigt.</p></>}/> },
    { id: "datenschutz-register", titel: "Wie schützt die Familienakte meine Daten?", el: <BildThema id="datenschutz-register" symbol={<ShieldCheck/>} titel="Wie schützt die Familienakte meine Daten?" weg={`Stand Fassung ${APP_FASSUNG}`} bild={<Ablaufbild label="Jedes Speichern" knoten={[{ titel: "Lesen" }, { titel: "Prüfen" }, { titel: "Sichern", art: "hervor" }, { titel: "Vorläufig schreiben" }, { titel: "Erneut prüfen" }, { titel: "Ersetzen", art: "gut" }]}/>}
      merk={[<><b>Das Register auf deinem Gerät führt.</b></>, <><b>Beschädigt?</b> Nie durch eine leere Datei ersetzt; die letzte gültige Sicherung bleibt.</>, <><b>Reparaturen</b> ändern keine Inhalte.</>]} vorschau={vs("security")}
      ausfuehrlich={<><p>Stand Fassung {APP_FASSUNG}. Das lokale Familienakten-Register bleibt der führende Datenbestand. Ist eine vorhandene Registerdatei beschädigt oder nicht lesbar, wird sie nicht durch eine leere Datei ersetzt. Der Schreibvorgang stoppt und die letzte gültige Sicherung bleibt erhalten.</p><p>Beim Speichern gilt: lesen, prüfen, sichern, vorläufig schreiben, erneut prüfen und erst danach ersetzen. Automatische Reparaturen dürfen weiterhin keine Dokumente, Gesundheitsdaten, Personen, Vorgänge, Aufgaben oder Fristen fachlich verändern.</p></>}/> },
    { id: "vollsicherung", titel: "Vollständige Sicherung und Wiederherstellung", el: <BildThema id="vollsicherung" symbol={<HardDrive/>} titel="Vollständige Sicherung und Wiederherstellung" weg="Sicherheit › sichern und testen" bild={<SichernKarte onGo={onGo}/>}
      merk={[<><b>Enthält alles:</b> Register, Einträge, Fristen, Tagebuch-Einträge, Medien und Dateien.</>, <><b>Geprüft</b> ist sie erst nach dem Test in einen leeren Ordner.</>, <><b>Plan zum Abhaken:</b> Hilfe › Akten sichern.</>]} vorschau={vs("security", "Vollständige Sicherung")} ziel={{ text: "Zum Sicherheitscenter", los: () => onGo("security") }}
      ausfuehrlich={<><p>Eine Dokumentensicherung enthält nur ausgewählte Dateien. Die vollständige Familienakten-Sicherung enthält zusätzlich Register, Datensätze, Beziehungen, Tagebuch-Einträge, Entwürfe, offene Fragen, Aufgaben, Fristen, Medien, Protokolle und Speicherverweise.</p><p>Eine Sicherung gilt erst als geprüft, wenn sie in einen leeren Testordner wiederhergestellt und mit dem Sicherungsbericht verglichen wurde. Originaldateien im produktiven Tresor werden dabei nicht verändert.</p><p>Ziel ist ein frei gewählter Ordner, getrennt vom Pro-Tresor: in der Android-App Gerät, SD-Karte oder USB, in der Windows-App jedes Laufwerk oder ein Netzordner, im Browser die Ordnerwahl von Chrome oder Edge am Rechner. Die Web-App am Handy oder Tablet kann keinen Ordner wählen; dort sind die Knöpfe aus. Die Android-App legt ihre Installationsdatei (APK) daneben, die Windows-App einen Lies-mich mit Download-Adresse und SHA-256.</p><p>Zwei Knöpfe, zwei Aufgaben: „Wiederherstellung testen“ prüft die Sicherung nur in einem leeren Testordner und holt nichts in die Akte. „Sicherung einlesen“ holt sie in die Akte zurück – in eine leere Akte ganz, in eine benutzte zusammengeführt. Plan zum Abhaken: Hilfe › Akten sichern.</p></>}/> },
    { id: "gesundheit-schutz", titel: "Wie werden Gesundheitsangaben geschützt?", el: <BildThema id="gesundheit-schutz" symbol={<HeartPulse/>} titel="Wie werden Gesundheitsangaben geschützt?" weg="Gesundheit & Arbeit" bild={<KastenReihe label="Wo Gesundheitsangaben zu sehen sind" knoten={[{ titel: "Gesundheitsakte", unter: "geschützt, mit Einzelheiten", art: "gut", ziel: () => onGo("medical") }, { titel: "Überall sonst", unter: "Suche, Cockpit, Neuigkeiten: nur neutrale Namen" }]}/>}
      merk={[<><b>Außerhalb der Gesundheitsakte</b> nur neutrale Bezeichnungen.</>, <><b>Keine Diagnosen</b> in Dateinamen, Treffern, Vorschauen, Cockpit und Neuigkeiten.</>]} vorschau={vs("medical")}/> },
    { id: "kategorien", titel: "Einheitliche Kategorien und Verknüpfungen", el: <BildThema id="kategorien" symbol={<Tags/>} titel="Einheitliche Kategorien und Verknüpfungen" bild={<Ablaufbild label="Kategorien und Beziehungen" knoten={[{ titel: "18 Kategorien", unter: "überall dieselben" }, { titel: "Einträge bleiben einzeln", unter: "Vorgang, Memory, Aufgabe, Frist" }, { titel: "Beziehungen", unter: "zeigen Zusammengehöriges gemeinsam", art: "gut" }]}/>}
      merk={[<><b>Keine Kopien:</b> Zusammengehöriges erscheint über Beziehungen.</>, <><b>Alte Begriffe</b> helfen bei der Suche; mehrdeutige werden nicht ungeprüft umgestellt.</>]} vorschau={vs("documents")}
      ausfuehrlich={<><p>Alle Bereiche verwenden dieselben 18 Familienakten-Kategorien. Alte eindeutige Begriffe können als Suchhilfe dienen; mehrdeutige Altbezeichnungen werden nicht ungeprüft umgestellt.</p><p>Vorgang, Memory, Aufgabe und Frist bleiben einzelne Datensätze. Ihre Beziehungen sorgen dafür, dass zusammengehörende Angaben gemeinsam erscheinen, ohne Kopien anzulegen.</p></>}/> },
    { id: "memories-bearbeiten", titel: "Tagebuch-Einträge ändern oder löschen", el: <BildThema id="memories-bearbeiten" symbol={<BookHeart/>} titel="Tagebuch-Einträge ändern oder löschen" weg="Tagebuch" bild={<Ablaufbild label="Memory ändern" knoten={[{ titel: "Memory öffnen", ziel: sprung(onGo, "memory", "Chronologie") }, { titel: "Ergänzen oder ändern" }, { titel: "Löschen", unter: "nach Bestätigung", art: "warnung" }]}/>}
      merk={[<><b>Gemeinsame Einträge bleiben:</b> Personen, Vorgänge, Dokumente.</>, <><b>Verbundene Aufgaben und Fristen:</b> die App fragt.</>]} vorschau={vs("memory", "Chronologie")}
      ausfuehrlich={<><p>Ein gespeichertes Memory kann geöffnet, ergänzt, bearbeitet oder nach Bestätigung gelöscht werden. Beim Löschen werden gemeinsam verwendete Personen, Organisationen, Objekte, Vorgänge und Dokumente nicht entfernt. Bei verbundenen Aufgaben oder Fristen fragt die Familienakte, ob diese bestehen bleiben sollen.</p></>}/> },
    { id: "mehrere-orte", titel: "Ein Dokument an mehreren Speicherorten", el: <BildThema id="mehrere-orte" symbol={<Copy/>} titel="Ein Dokument an mehreren Speicherorten" bild={<Ablaufbild label="Ein Dokument, mehrere Orte" knoten={[{ titel: "Gleiche Datei an mehreren Orten", unter: "lokal · USB · OneDrive" }, { titel: "Prüfsumme erkennt sie", art: "hervor" }, { titel: "Ein Eintrag", unter: "mit mehreren Verweisen", art: "gut" }]}/>}
      merk={[<><b>Keine doppelten Einträge</b> im Register.</>]} vorschau={vs("security")}/> },
    { id: "ampel", titel: "Was bedeuten GRÜN, GELB und ROT?", el: <BildThema id="ampel" symbol={<CircleHelp/>} titel="Was bedeuten GRÜN, GELB und ROT?" weg="Systemprüfung" bild={<KastenReihe label="Ampel der Systemprüfung" knoten={[{ titel: "GRÜN", unter: "alle Pflichtprüfungen bestanden", art: "gut" }, { titel: "GELB", unter: "Abweichung, bitte prüfen", art: "hervor" }, { titel: "ROT", unter: "kritischer Fehler, keine Freigabe", art: "warnung" }]}/>}
      merk={[<><b>Rot</b> verhindert die Freigabe einer Fassung.</>]} vorschau={vs("systemcheck")}/> },
    { id: "suche-arbeitsaktionen", titel: "Wo finde ich Suche und Arbeitsaktionen?", el: <BildThema id="suche-arbeitsaktionen" symbol={<Search/>} titel="Wo finde ich Suche und Arbeitsaktionen?" weg="Startseite" bild={<Ablaufbild label="Startseite von oben nach unten" knoten={[{ titel: "Suchleiste", unter: "tippen oder sprechen", art: "hervor", ziel: sprung(onGo, "overview") }, { titel: "Zuletzt wichtig" }, { titel: "Dokumenteneingang" }, { titel: "Erinnerungsprotokoll" }, { titel: "Lebensbereiche" }, { titel: "Arbeitsbereich", unter: "ovale Knöpfe" }]}/>}
      merk={[<><b>Suchen:</b> oben unter dem Menü, tippen oder sprechen.</>, <><b>Knopffarben:</b> zartgelb offen · hellgrün erledigt · hellgrau zuletzt nicht möglich.</>, <><b>Jeder Knopf</b> bleibt antippbar.</>]} vorschau={vs("overview")}
      ausfuehrlich={<><p>Die breite Suchleiste steht direkt unter dem Hauptmenü. Dort kannst du einen Suchbegriff schreiben oder über das Mikrofon diktieren. Auf der Startseite siehst du zuerst „Zuletzt wichtig“, danach den kompakten Dokumenteneingang, das Erinnerungsprotokoll und anschließend die Lebensbereiche. Später folgt der hellblaue Arbeitsbereich mit den ovalen Schaltflächen für Tresor, Abgleich, Aktualisierung und Änderungen mit ChatGPT.</p><p>Alle Schaltflächen haben einen dünnen blauen Rand. Zartgelb bedeutet „noch offen“, Hellgrün bedeutet „erfolgreich erledigt“ und Hellgrau bedeutet „beim letzten Versuch nicht möglich“. Auch graue und grüne Schaltflächen können jederzeit erneut betätigt werden.</p></>}/> },
    { id: "tagebuch", titel: "Wie funktioniert das Tagebuch?", el: <BildThema id="tagebuch" symbol={<BookHeart/>} titel="Wie funktioniert das Tagebuch?" weg="Termine & Aufgaben › Tagebuch" bild={<Ablaufbild label="Ein Erlebnis festhalten" knoten={[{ titel: "Schreiben oder diktieren", unter: "bis zu 12 Fotos oder Videos", ziel: sprung(onGo, "memory") }, { titel: "Vorschlag", unter: "Tatsache · Beobachtung · Einschätzung" }, { titel: "Höchstens eine Rückfrage" }, { titel: "Bestätigt speichern", art: "gut" }]}/>}
      merk={[<><b>Dein Originaltext bleibt unverändert.</b></>, <><b>Aufgaben und Fristen</b> nur nach deiner Bestätigung.</>, <><b>Ohne KI-Dienst:</b> lokale Regeln, kein API-Schlüssel.</>]} ziel={{ text: "Tagebuch öffnen", los: () => onGo("memory") }} vorschau={vs("memory", "Tagebuch")}
      ausfuehrlich={<><p>Du kannst ein Ereignis frei schreiben oder diktieren und bis zu zwölf Fotos oder Videos auswählen. Vor dem Speichern trennt die Familienakte Tatsachen, Beobachtungen und persönliche Einschätzungen, schlägt einen vorhandenen Lebensbereich und passende bestehende Datensätze vor und stellt höchstens eine gezielte Rückfrage.</p><p>Der Originaltext bleibt unverändert erhalten. Unsichere Zuordnungen, Aufgaben und Fristen werden erst nach deiner Auswahl und ausdrücklichen Bestätigung gespeichert. Medien liegen im gewählten Speicher: auf diesem Gerät, im Pro-Tresor oder im verbundenen Ordner.</p><p>Offene Punkte erscheinen im Erinnerungsprotokoll und datensparsam im Cockpit. Gesundheitsbezüge zeigen außerhalb der geschützten Gesundheitsakte keine Diagnose oder vertrauliche Einzelheit. Die Strukturierung verwendet lokale, nachvollziehbare Regeln und keinen kostenpflichtigen API-Schlüssel.</p></>}/> },
    { id: "mehrere-erinnerungen", titel: "Mehrere Tagebuch-Einträge nacheinander erfassen", el: <BildThema id="mehrere-erinnerungen" symbol={<Plus/>} titel="Mehrere Tagebuch-Einträge nacheinander erfassen" weg="Tagebuch" bild={<Ablaufbild label="Mehrere Tagebuch-Einträge nacheinander" knoten={[{ titel: "Tagebuch-Eintrag eingeben", ziel: sprung(onGo, "memory") }, { titel: "„Noch einen erfassen“", unter: "wird Entwurf, Feld frei" }, { titel: "„Eintrag prüfen“", unter: "Entwürfe einzeln", art: "hervor" }, { titel: "„Bestätigt speichern“", art: "gut" }]}/>}
      merk={[<><b>Jeder Entwurf bleibt für sich</b>; nichts wird vermischt.</>, <><b>Erst „Bestätigt speichern“</b> macht einen Tagebuch-Eintrag daraus.</>, <><b>Zwei Listen:</b> unbehandelte Tagebuch-Einträge und offene Fragen bleiben getrennt.</>]} ziel={{ text: "Tagebuch öffnen", los: () => onGo("memory") }} vorschau={vs("memory", "Was ist heute passiert?")}
      ausfuehrlich={<><p><strong>„Noch einen erfassen“</strong> legt den aktuellen Tagebuch-Eintrag zunächst als eigenen unbehandelten Entwurf in der lokalen Warteschlange ab. Das Eingabefeld wird danach frei für das nächste Ereignis. Text, Diktat, Fotos und Videos bleiben jeweils beim richtigen Entwurf.</p><p><strong>„Eintrag prüfen“</strong> sichert eine noch offene Eingabe ebenfalls und öffnet anschließend die unbehandelten Tagebuch-Einträge. Jeder Entwurf wird einzeln geprüft; mehrere Erlebnisse werden nicht vermischt oder automatisch zusammengeführt.</p><p><strong>„Bestätigt speichern“</strong> macht aus genau einem geprüften Entwurf einen endgültigen Tagebuch-Eintrag. Erst dann werden Chronologie, Tagesübersicht, Suche, Vorgangsbezug und gegebenenfalls bestätigte Aufgaben oder Fristen aktualisiert.</p><p><strong>Unbehandelte Tagebuch-Einträge</strong> warten noch auf diese Prüfung. <strong>Rückfragen zu gespeicherten Einträgen</strong> gehören dagegen bereits zu endgültig gespeicherten Tagebuch-Einträgen. „Erinnerung“ heißt in der App nur die Weckzeit an einer Aufgabe oder Frist. Beide Listen und Zähler bleiben bewusst getrennt.</p></>}/> },
    { id: "verbinden", titel: "Dokumente und Erinnerungen verbinden", el: <BildThema id="verbinden" symbol={<ClipboardCheck/>} titel="Dokumente und Erinnerungen verbinden" weg="Cockpit › Zusammenhang prüfen" bild={<Ablaufbild label="Verbinden" knoten={[{ titel: "Zusammenhang prüfen", unter: "Vorschlag", ziel: sprung(onGo, "cockpit", "Offene Vorgänge") }, { titel: "Verknüpfen oder nicht", art: "hervor" }, { titel: "„Gehört dazu“", unter: "ändern oder lösen" }]}/>}
      merk={[<><b>Verknüpfen</b> stellt nur eine Beziehung her; nichts wird kopiert.</>, <><b>Lösen löscht nichts.</b></>, <><b>„Nicht verknüpfen“</b> wird gemerkt.</>]} ziel={{ text: "Zusammenhänge im Cockpit prüfen", los: () => onGo("cockpit") }} vorschau={vs("cockpit", "Offene Vorgänge")}
      ausfuehrlich={<><p>Ein <strong>Vorgang</strong> ist die gemeinsame Klammer für Dinge, die sachlich zusammengehören – zum Beispiel Telefonat, Termin, Handwerkerbesuch, Foto und Rechnung einer Reparatur.</p><p><strong>„Zusammenhang prüfen“</strong> bedeutet, dass die Familienakte einen bestehenden Vorgang gefunden hat, aber deine Entscheidung braucht. <strong>„Verknüpfen“</strong> stellt nur eine Beziehung her; Dokument und Erinnerung bleiben getrennte Originaldatensätze. <strong>„Nicht verknüpfen“</strong> merkt sich die Ablehnung, solange keine neuen wichtigen Angaben hinzukommen.</p><p>Eine falsche Verbindung kannst du unter <strong>„Gehört dazu“</strong> ändern oder lösen. Dabei werden weder Dokumente noch Tagebuch-Einträge, Vorgänge oder Originaldateien gelöscht. Offene Fragen und Teilabschlüsse werden nicht automatisch als erledigt behandelt.</p></>}/> },
    { id: "eingangszentrale", titel: "Wie benutze ich die Eingangszentrale?", el: <BildThema id="eingangszentrale" symbol={<Upload/>} titel="Wie benutze ich die Eingangszentrale?" weg="Kopf › Ablegen · Dokumente › Eingangszentrale" bild={<Ablaufbild label="Weg durch die Eingangszentrale" knoten={ablaufEingang(onGo)}/>}
      merk={[<><b>Das Original bleibt unverändert</b>; nichts wird verschoben oder gelöscht.</>, <><b>Doppeltes und Fristen</b> sind nur Hinweise – angelegt wird erst nach deinem Ja.</>, <><b>E-Mail als .eml:</b> Absender, Betreff, Datum und Anlagen werden erfasst.</>]} vorschau={vs("inbox", "Eingänge prüfen")} ziel={{ text: "Zur Eingangszentrale", los: () => onGo("inbox") }}
      ausfuehrlich={<><p>Der schnellste Weg: oben im Kopf <strong>Ablegen</strong> (Fach mit Pfeil nach unten) antippen und „Fotografieren“, „Dateien wählen“ oder „Ordner“ nehmen; alles landet hier zur Prüfung. Oder öffne <strong>Dokumente → Eingangszentrale</strong>. Dort kannst du eine oder mehrere Dateien hineinziehen oder über „Datei auswählen“ öffnen. Du musst vorher nicht festlegen, ob es sich um PDF, Word, Foto, Scan, E-Mail oder einen anderen Dateityp handelt.</p><p>Jede Datei erscheint zunächst unter <strong>Eingänge prüfen</strong>. Die Familienakte erkennt den Dateityp, liest den Inhalt soweit technisch möglich, prüft Dubletten und sucht vorhandene Personen, Organisationen, Objekte, Vorgänge und Tagebuch-Zusammenhänge. Unlesbare oder unbekannte Dateien werden nicht abgewiesen, sondern verständlich zur manuellen Prüfung gekennzeichnet.</p><p>Mehrere Bilder können als gemeinsames Scan-Dokument oder Fotoserie geprüft werden. Bei <strong>.eml</strong>-Dateien werden Absender, Empfänger, Betreff, Datum, Message-ID und erkennbare Anlagen erfasst. <strong>.msg</strong>-Dateien werden soweit der Export lesbar ist ausgewertet; andernfalls bleibt die Originaldatei zur manuellen Prüfung erhalten.</p><p>Eine mögliche Dublette wird nie automatisch kopiert oder zusammengeführt. „Mögliche Aufgabe“ und „Mögliche Frist“ sind nur Hinweise und werden erst nach deiner Bestätigung angelegt. Zurückgestellte Eingänge bleiben während der laufenden Arbeit in der Warteschlange.</p><p><strong>Assistenz freigegeben</strong> bedeutet, dass ein bereits archiviertes Dokument ausdrücklich für Suche, Zusammenhänge und Beratung freigegeben wurde. Nicht freigegebene Eingänge verwendet der Assistent nicht aktiv.</p><p>Lokale Ordner, OneDrive und E-Mail-Exporte werden ausschließlich nach deinem bewussten Befehl geprüft. Originaldateien werden nicht automatisch verschoben, umbenannt, überschrieben oder gelöscht.</p></>}/> },
    { id: "fotografieren", titel: "Dokument fotografieren", el: <BildThema id="fotografieren" symbol={<Camera/>} titel="Dokument fotografieren" weg="Eingangszentrale › Neue Dokumente erfassen" bild={<Ablaufbild label="Vom Foto zur PDF" knoten={ablaufFoto(onGo)}/>}
      merk={[<><b>Gespeichert wird die PDF</b>; die einzelnen Fotos sind nur Zwischenstand.</>, <><b>Originalfotos</b> bleiben nur auf deinen Wunsch, als Anlage derselben PDF.</>, <><b>Zu groß?</b> Dann „Verkleinern“ (Thema „Datei zu groß“).</>]} vorschau={vs("inbox", "Neue Unterlagen erfassen")} ziel={{ text: "Zur Eingangszentrale", los: () => onGo("inbox") }}
      ausfuehrlich={<><p>Tippe unter „Neue Dokumente erfassen“ auf „Dokument fotografieren“. Fotografiere die erste Seite und füge bei Bedarf weitere Seiten hinzu. Vor der PDF-Erstellung kannst du jede Seite öffnen, drehen, neu aufnehmen, entfernen, behutsam zuschneiden und in der Reihenfolge verschieben.</p><p>Wähle danach „Aufnahme prüfen“ und kontrolliere, ob die gesamte Seite sichtbar, der Text lesbar und die Reihenfolge richtig ist. Mit „Fertig – PDF erstellen“ werden alle Seiten zu genau einer PDF zusammengefügt. Erst anschließend öffnet sich die bekannte Dokumentenprüfung für Bereich, Datenschutz, vorhandenen Vorgang, Tagebuch-Zusammenhang und mögliche Dubletten.</p><p>Die einzelnen Fotos sind bis dahin nur temporäre Scan-Seiten. Standardmäßig wird nur die PDF verwendet. Originalaufnahmen werden ausschließlich nach deiner bewussten Auswahl als Anlagen derselben PDF behalten und nie als eigene Dokumente registriert. Gesundheitsunterlagen bleiben im geschützten Gesundheitsbereich.</p></>}/> },
    { id: "startseite", titel: "Was finde ich auf der Startseite und ganz unten?", el: <BildThema id="startseite" symbol={<BookOpen/>} titel="Was finde ich auf der Startseite und ganz unten?" weg="Startseite" bild={<Ablaufbild label="Startseite von oben nach unten" knoten={[{ titel: "Kopf", unter: "Neu · Ablegen · Notiz · Kalender" }, { titel: "So fängst du an", unter: "bis alles erledigt ist" }, { titel: "Cockpit" }, { titel: "Zuletzt wichtig" }, { titel: "Dokumenteneingang" }, { titel: "Erinnerungsprotokoll" }, { titel: "Lebensbereiche" }]}/>}
      merk={[<><b>Info-Symbole</b> öffnen kurze Erklärungen; Tipp daneben oder Esc schließt.</>, <><b>Am Handy</b> steht unter jedem Kopf-Symbol ein Wort; „Seite drucken“ liegt im Menü.</>, <><b>Systemstatus</b> führt zur Systemprüfung.</>]} vorschau={vs("overview")}
      ausfuehrlich={<><p>Ganz oben steht „So fängst du an“ mit drei Schritten: Speicherort wählen, erstes Dokument ablegen, erste Erinnerung anlegen. Jeder Schritt lässt sich überspringen; der Kasten verschwindet, sobald alle drei erledigt oder übersprungen sind.</p><p>Darunter zeigt das Cockpit nur tatsächlich vorhandene Objekte, Vorgänge und nächste Schritte. Danach stehen „Zuletzt wichtig“, der gemeinsame Dokumenteneingang, das Erinnerungsprotokoll und die Lebensbereiche.</p><p>Die kleinen Info-Symbole öffnen kurze Erklärungen. Ein Klick oder Antippen außerhalb sowie die Escape-Taste schließen das Fenster wieder. Der lokale Aktenschrank wird nicht mehr als eigener Startseitenblock gezeigt; seine Funktionen bleiben im Sicherheitscenter erreichbar.</p><p>Im vereinfachten Systemstatus öffnest du direkt die vorhandene Systemprüfung. Oben im Kopf stehen die Knöpfe Neu, Internet, Ablegen, Notiz und Kalender; am Handy mit einem Wort darunter. „Seite drucken“ liegt im Menü (am PC auch Strg+P).</p></>}/> },
    { id: "menue", titel: "Wie sind Menü- und Unterseiten aufgebaut?", el: <BildThema id="menue" symbol={<ExternalLink/>} titel="Wie sind Menü- und Unterseiten aufgebaut?" weg="jede Seite" bild={<Ablaufbild label="Aufbau jeder Seite" knoten={[{ titel: "Kopfzeile", unter: "Symbol · Titel · Knöpfe" }, { titel: "„?“ an der Überschrift", unter: "erklärt sie", art: "hervor" }, { titel: "Wichtigstes zuerst" }, { titel: "Lange Abschnitte", unter: "einklappbar" }]}/>}
      merk={[<><b>Titel, Karten, Beziehungen</b> sind antippbar und führen zum Ziel.</>, <><b>Weiße „Info“-Kästen</b> sind Erklärungen, keine Knöpfe.</>, <><b>Gesundheit</b> bleibt im geschützten Bereich.</>]} vorschau={vs("directory")}
      ausfuehrlich={<><p>Auf jeder Unterseite stehen die wichtigsten und am häufigsten benötigten Aktionen zuerst. Anklickbare Titel, Karten und Beziehungen führen direkt zum passenden Dokument, Vorgang, Objekt, zur Person, Frist oder Aufgabe. Dabei werden die vorhandene Suche, Dokumentenbibliothek und das Cockpit gemeinsam verwendet.</p><p>Weiße Kästen mit der Kennzeichnung „Info“ enthalten nur notwendige Erklärungen und sehen bewusst nicht wie eine Schaltfläche aus. Medizinische Einzelheiten bleiben im geschützten Gesundheitsbereich.</p><p>Das Menü ist nach Themen geordnet: Assistenz, Termine &amp; Aufgaben (Cockpit, Fristen und Aufgaben, Mein Kalender, Tagebuch), Gesundheit &amp; Arbeit, Familie &amp; Personen, Wohnen, Fahrzeuge, Käufe &amp; Garantien, Dokumente und Hilfe.</p><p>Jede Seite beginnt mit einer Kopfzeile: Symbol, Titel und Knöpfe auf einer Linie. Das kleine „?“ oben rechts an einer Überschrift erklärt sie. Lange Abschnitte lassen sich einklappen.</p></>}/> },
    { id: "was-gibts-neues", titel: "Was zeigt „Was gibt’s Neues?“?", el: <BildThema id="was-gibts-neues" symbol={<History/>} titel="Was zeigt „Was gibt’s Neues?“?" weg="Hilfe › Was gibt’s Neues?" bild={<KastenReihe label="Drei Listen" knoten={[{ titel: "Zuletzt wichtig", unter: "braucht jetzt Aufmerksamkeit", ziel: () => onGo("overview") }, { titel: "Was gibt’s Neues?", unter: "neu oder geändert", art: "hervor", ziel: () => onGo("changelog") }, { titel: "Versionshistorie", unter: "alle Fassungen", ziel: () => onGo("versions") }]}/>}
      merk={[<><b>Ein Tipp</b> auf einen Eintrag führt zum Dokument oder Vorgang.</>]} ziel={{ text: "Was gibt’s Neues? öffnen", los: () => onGo("changelog") }} vorschau={vs("changelog", "Was gibt’s Neues in der Familienakte?")}
      ausfuehrlich={<><p>Hier werden neue Dokumente, wichtige Vorgänge und Veränderungen der letzten Zeit übersichtlich angezeigt. Ein Klick auf einen Eintrag führt zum dazugehörigen Dokument, Vorgang oder Bereich.</p><p>„Zuletzt wichtig“ zeigt, was jetzt Aufmerksamkeit benötigt. „Was gibt’s Neues?“ zeigt dagegen, was neu aufgenommen oder verändert wurde. Die „Versionshistorie“ bleibt der vollständige technische Entwicklungsverlauf.</p></>}/> },
    { id: "bibliothek", titel: "Wie benutze ich die Dokumentenbibliothek?", el: <BildThema id="bibliothek" symbol={<Archive/>} titel="Wie benutze ich die Dokumentenbibliothek?" weg="Dokumente › Dokumentenbibliothek" bild={<Ablaufbild label="In der Bibliothek finden" knoten={[{ titel: "Dokumente", unter: "neueste, Bereiche", ziel: sprung(onGo, "documents") }, { titel: "„Alle ansehen“", ziel: sprung(onGo, "documents") }, { titel: "Suchen · filtern · sortieren", art: "hervor" }, { titel: "Tipp führt zum Eintrag", art: "gut" }]}/>}
      merk={[<><b>Keine zweite Kopie</b>; Originale bleiben unverändert.</>, <><b>Suchen nach</b> Titel, Person, Objekt, Vorgang, Nummer, Datum.</>, <><b>Gesundheit:</b> neutrales Symbol, öffnet den geschützten Bereich.</>]} ziel={{ text: "Dokumentenbibliothek öffnen", los: () => onGo("documents") }} vorschau={vs("documents")}
      ausfuehrlich={<><p>Unter „Dokumente“ findest du die neuesten vorhandenen Unterlagen und nur die Bereiche, in denen tatsächlich Dokumente gespeichert sind. „Alle ansehen“ öffnet die vollständige Ansicht. Dort kannst du nach Titel, Dateiname, Dokumentart, Person, Objekt, Vorgang, Nummer, Datum oder Beschreibung suchen und zusätzlich filtern oder sortieren.</p><p>Titel, Vorschau, Bereich, Datum und vorhandene Verknüpfungen sind anklickbar. Sie führen zum Dokument oder zum zugehörigen Personen-, Objekt-, Vorgangs-, Frist-, Vertrags- oder Garantiedatensatz. Gesundheitsunterlagen verwenden ein neutrales Symbol und öffnen den geschützten Gesundheitsbereich.</p><p>Cockpit, „Was gibt’s Neues?“, Vorgänge und Objektakten greifen auf dieselben Dokumentkennungen zu. Die Bibliothek speichert keine zweite Kopie und verändert keine Originaldatei.</p></>}/> },
    { id: "cockpit", titel: "Wie benutze ich das Cockpit?", el: <BildThema id="cockpit" symbol={<ClipboardCheck/>} titel="Wie benutze ich das Cockpit?" weg="Termine & Aufgaben › Cockpit" bild={<Ablaufbild label="Cockpit von oben nach unten" knoten={[{ titel: "Überfällig und heute", unter: "stehen zuerst", art: "hervor", ziel: sprung(onGo, "cockpit", "Was ist jetzt wichtig?") }, { titel: "Aufgaben · Fristen · Vorgänge" }, { titel: "Neu hinzugekommen" }, { titel: "Erledigt", unter: "in der Historie", art: "gut" }]}/>}
      merk={[<><b>Änderungen</b> erst nach deiner Bestätigung.</>, <><b>Gesundheit</b> nur als knapper Hinweis.</>, <><b>ChatGPT-Hilfe</b> bereitet nur Text vor; keine bezahlte Schnittstelle.</>]} ziel={{ text: "Cockpit öffnen", los: () => onGo("cockpit") }} vorschau={vs("cockpit", "Was ist jetzt wichtig?")}
      ausfuehrlich={<><p>Das Cockpit verbindet vorhandene Aufgaben, Fristen, Vorgänge, Objektakten und neue Unterlagen zu einer gemeinsamen Arbeitsübersicht. Überfällige und heute fällige Punkte stehen zuerst. Erledigte Aufgaben verschwinden aus der aktiven Liste, bleiben aber in der Historie erhalten.</p><p>„Im Cockpit anzeigen“ in einem Bereich (zum Beispiel Arbeit oder Krankenkasse) öffnet das Cockpit nur mit den passenden Einträgen; „Alle anzeigen“ hebt den Filter auf.</p><p>Statusänderungen und neue Notizen werden erst nach deiner Bestätigung gespeichert. Gesundheitsangaben erscheinen im allgemeinen Cockpit nur als datensparsame Hinweise; Diagnosen und medizinische Einzelheiten bleiben im geschützten Gesundheitsbereich.</p><p>„Neu hinzugekommen“ verwendet dieselben Ursprungsdatensätze wie „Was gibt’s Neues?“. Die ChatGPT-Hilfe bereitet nur einen Text mit vorhandenen Kennungen und Verknüpfungen vor; es wurde keine kostenpflichtige API eingebaut.</p></>}/> },
    { id: "datentresor", titel: "Was macht der lokale Datentresor?", el: <BildThema id="datentresor" symbol={<HelpCircle/>} titel="Was macht der lokale Datentresor?" weg="Dokumente › Sicherheit & lokaler Tresor" bild={<Ablaufbild label="Wohin deine Akte geht" knoten={[{ titel: "Ort wählen", ziel: () => onGo("security") }, { titel: "Gerät · Pro-Tresor · Ordner", unter: "auch SD-Karte, USB, OneDrive", art: "hervor" }, { titel: "Neue Unterlagen", unter: "direkt dorthin", art: "gut" }]}/>}
      merk={[<><b>Du wählst den Ort</b>; nichts geht auf einen Server.</>, <><b>Nicht erreichbar?</b> Die App schreibt nicht still woanders hin.</>, <><b>Mehr:</b> Hilfe › Wo liegt was?</>]} ziel={{ text: "Datentresor verwalten", los: () => onGo("security") }} vorschau={vs("security", "Datentresor prüfen")}
      ausfuehrlich={<><ul className="kalender-hilfe-punkte"><li>Der Datentresor ist der Ort, an dem deine Akte liegt. Du wählst ihn selbst.</li><li>Möglich sind: der Speicher dieses Geräts, der gemeinsame Pro-Tresor (in den Apps, auch auf SD-Karte) oder ein Ordner am Rechner, auf USB oder in OneDrive.</li><li>Neue Unterlagen werden direkt dorthin geschrieben, nicht auf einen Server hochgeladen.</li><li>Ist der gewählte Ort gerade nicht erreichbar, schreibt die App nicht still woanders hin.</li><li>Solange nur der Browserspeicher dieses Geräts benutzt wird, ist noch kein eigener Datentresor gewählt: die Akte liegt im Browser und ginge beim Löschen der Browserdaten verloren. Die Sicherheitsseite zeigt dann „nicht verbunden“.</li><li>Mehr dazu: Hilfe › Wo liegt was?</li></ul></>}/> },
    { id: "export", titel: "Wie exportiere ich die Familienakte?", el: <BildThema id="export" symbol={<Download/>} titel="Wie exportiere ich die Familienakte?" weg="Sicherheit › Familienakte exportieren" bild={<Ablaufbild label="Export Schritt für Schritt" knoten={ablaufExport(onGo)}/>}
      merk={[<><b>Keine eigene Verschlüsselung</b> im Export.</>, <><b>Originaldateien</b> nur mit freigegebenem Tresor und eingeschaltetem Schalter.</>, <><b>Die Ausgangsdaten</b> bleiben unverändert.</>]} vorschau={vs("security", "Export")} ziel={{ text: "Zum Sicherheitscenter", los: () => onGo("security") }}
      ausfuehrlich={<><p>Öffne „Sicherheit und Verwaltung“ und wähle „Familienakte exportieren“. Dort bestimmst du den lokalen Zielordner und welche Bereiche enthalten sein sollen. Originaldateien werden nur dann kopiert, wenn du einen lokalen Tresor freigegeben und die Option ausdrücklich eingeschaltet hast.</p><p>Vor dem Start wird angezeigt, dass die Familienakte selbst keine Verschlüsselung hinzufügt. Der Export legt einen neuen Ordner mit einer lesbaren Übersicht, einer maschinenlesbaren Datendatei und einem Exportbericht an. Ausgangsdateien werden nicht verändert.</p><p>Der Export schreibt in einen frei gewählten Ordner: in der Android- und der Windows-App über den Ordnerdialog des Geräts, im Browser über die Ordnerwahl von Chrome oder Edge am Rechner.</p></>}/> },
    { id: "fristen-verwalten", titel: "Wie verwalte ich Fristen und Erinnerungen?", el: <BildThema id="fristen-verwalten" symbol={<FileClock/>} titel="Wie verwalte ich Fristen und Erinnerungen?" weg="Fristen und Aufgaben" bild={<FristenKarte onGo={onGo} eingerichtet={eingerichtet}/>}
      merk={[<><b>Haken in der Zeile</b> = erledigt, kurz mit „Rückgängig“.</>, <><b>Eine Zeile je Frist:</b> das Erinnerungsdatum steht als 🔔-Zeit darin.</>, <><b>Mülleimer</b> = archivieren; ein Kalender-Eintrag wird mit entfernt.</>]} vorschau={vs("reminders", "Frist oder Aufgabe anlegen")} ziel={{ text: "Zu Fristen und Aufgaben", los: () => onGo("reminders") }}
      ausfuehrlich={<><p>Öffne „Fristen und Aufgaben“. Dort kannst du eine Frist oder Aufgabe von Hand anlegen, ein Erinnerungsdatum ergänzen und vorhandene Personen, Objekte, Vorgänge oder Dokumente aus einer Auswahl verknüpfen. Erst dein bestätigter Speicherbefehl legt den Eintrag an.</p><p>Die Erinnerung gehört zur Frist selbst: Es entsteht keine zweite Zeile. Das Erinnerungsdatum steht als 🔔-Zeit bei der Frist, im Stift-Fenster als eigener Knopf; verschiebst du die Frist, zieht es um dieselben Tage mit, und mit „erledigt“ endet auch die Erinnerung. Ältere, getrennt gespeicherte Erinnerungen hat die App beim ersten Start von 2.28.39 einmal in ihre Frist übernommen (mit Sicherung vorher).</p><p>Überfällige und bald fällige Punkte erscheinen auch unter „Zuletzt wichtig“. Erledigte oder zurückgestellte Einträge verschwinden aus den offenen Punkten. Jede Statusänderung wird im lokalen Register protokolliert.</p><p>Der Haken in der Zeile hakt eine Frist als erledigt ab. Mehr dazu in den Themen Fristen im Kalender, Mein Kalender, App-Glocke, Listen mit Leiste, Löschen mit dem Mülleimer sowie Einklappen und Knopf „alle“.</p></>}/> },
    { id: "datenmodell", titel: "Was ist das gemeinsame Datenmodell?", el: <BildThema id="datenmodell" symbol={<HelpCircle/>} titel="Was ist das gemeinsame Datenmodell?" bild={<DatenmodellKarte onGo={onGo}/>}
      merk={[<><b>Technische Grundlage</b> für die Verbindungen zwischen allem.</>, <><b>Deine Unterlagen bleiben, wie sie sind.</b></>, <><b>Noch nicht eingeschaltet:</b> automatisches Einsortieren und OneDrive-Sortierung. Frist-Vorschläge aus Briefen gibt es in der Eingangszentrale, immer erst nach deinem Ja.</>]}
      ausfuehrlich={<><p>Es ist eine technische Grundlage im Hintergrund. Sie bereitet einheitliche Datensätze und spätere Verbindungen zwischen Personen, Objekten, Vorgängen, Dokumenten, Fristen und Aufgaben vor.</p><p>Die bestehende Oberfläche und deine bisherigen Unterlagen wurden dafür nicht umgeordnet. Automatisches Einsortieren und eine OneDrive-Sortierung sind nicht eingeschaltet. Die Eingangszentrale liest neue Unterlagen und schlägt eine mögliche Frist vor; übernommen wird sie erst nach deinem Ja.</p></>}/> },
    { id: "zuordnung", titel: "Wie werden Dokumente zugeordnet?", el: <BildThema id="zuordnung" symbol={<Archive/>} titel="Wie werden Dokumente zugeordnet?" weg="Eingangszentrale · Bestand prüfen" bild={<Ablaufbild label="Reihenfolge der Zuordnung" knoten={[{ titel: "Dokument" }, { titel: "Person · Bereich" }, { titel: "Objekt · Vorgang · Organisation" }, { titel: "Frist · Aufgabe" }, { titel: "Speicherort" }, { titel: "Vorschlag", unter: "du bestätigst", art: "gut", ziel: sprung(onGo, "inventory") }]}/>}
      merk={[<><b>Alles nur Vorschlag</b>; bei niedriger Sicherheit wird nichts übernommen.</>, <><b>Mehrere Treffer:</b> du wählst.</>, <><b>Dateien</b> werden nie verschoben, kopiert, umbenannt oder gelöscht.</>]} vorschau={vs("inventory")}
      ausfuehrlich={<><p>Die Zuordnung prüft neue Angaben immer in derselben Reihenfolge: Dokument, Person, Bereich, Unterbereich, Objekt, Vorgang, Organisation, Frist, Aufgabe und Speicherort.</p><p>Das Ergebnis ist zunächst nur ein Vorschlag. Vorhandene Personen, Objekte, Vorgänge und Organisationen werden über ihre Kennungen bevorzugt wiederverwendet. Bei mehreren möglichen Treffern musst du selbst auswählen; bei niedriger Sicherheit wird nichts übernommen.</p><p>Fristen, Aufgaben und ein möglicher OneDrive-Zielordner werden ebenfalls nur vorgeschlagen. Dateien werden nicht automatisch verschoben, kopiert, umbenannt oder gelöscht. Im Gesundheitsbereich werden nur Referenzen und notwendige Metadaten verwendet.</p></>}/> },
    { id: "fuehrend", titel: "Welches System ist künftig führend?", el: <BildThema id="fuehrend" symbol={<Archive/>} titel="Welches System ist künftig führend?" bild={<KastenReihe label="Welches System führt" knoten={[{ titel: "Familienakte", unter: "die eine Oberfläche", art: "gut" }, { titel: "Zuordnung", unter: "im Hintergrund" }, { titel: "OneDrive-Cockpit", unter: "nicht weitergeführt", art: "warnung" }]}/>}
      merk={[<><b>Ein System</b>, keine zweite Oberfläche.</>, <><b>Keine automatische</b> OneDrive-Verarbeitung und keine Dateiverschiebung.</>]}
      ausfuehrlich={<><p>Die Familienakte bleibt die einzige führende Oberfläche. Das vorbereitete Familienakte-/OneDrive-Cockpit wird nicht als zweites, konkurrierendes System weitergeführt.</p><p>Die Zuordnung arbeitet im Hintergrund. Bestehende Strukturen werden weiterverwendet statt parallel neu angelegt.</p><p>Eine automatische OneDrive-Verarbeitung und automatische Dateiverschiebungen sind weiterhin nicht gestartet.</p></>}/> },
    { id: "familienakte-pruefen", titel: "Was prüft „Familienakte prüfen“?", el: <BildThema id="familienakte-pruefen" symbol={<ShieldCheck/>} titel="Was prüft „Familienakte prüfen“?" weg="Hilfe › Systemprüfung" bild={<Ablaufbild label="Ein Prüflauf" knoten={[{ titel: "Prüfen", unter: "Oberfläche, Daten, Gesundheit, Suche", ziel: () => onGo("systemcheck") }, { titel: "Bericht", unter: "neuester oben" }, { titel: "Sichere Korrektur", unter: "nur Prüfdaten", art: "hervor" }, { titel: "Kontrollprüfung", art: "gut" }]}/>}
      merk={[<><b>Deine Daten bleiben unangetastet:</b> Dokumente, Gesundheit, Verknüpfungen, Tresor.</>, <><b>Jeder Lauf</b> bekommt einen eigenen Bericht.</>, <><b>Kein Fortschritt?</b> Die App hört auf und nennt den nächsten Schritt.</>]} ziel={{ text: "Familienakte jetzt prüfen", los: () => onGo("systemcheck") }} vorschau={vs("systemcheck")}
      ausfuehrlich={<><p>Die Systemprüfung kontrolliert nach einer neuen Version unter anderem Oberfläche, Datenzugriff, Gesundheitsakte, Datenmodell, Suche und Changelog. Jeder Prüf- und Reparaturlauf erhält unter „Hilfe → Systemprüfung → Prüfberichte“ einen eigenen Bericht. Frühere Berichte bleiben erhalten, der neueste steht oben.</p><p>Nach einer Prüfung darf die Familienakte nur sichere Prüf- und Berichtsdaten automatisch korrigieren. Vorher wird der bisherige Prüfzustand gesichert. Persönliche Daten, Gesundheitsdaten, Dokumente, Dateien, Verknüpfungen und Tresoreinstellungen bleiben unangetastet. Danach folgt immer eine vollständige Kontrollprüfung.</p><p>Bleiben offene Punkte bestehen und bringt ein weiterer Versuch keine Verbesserung, beendet die Familienakte die automatische Wiederholung und erklärt den notwendigen nächsten Schritt.</p></>}/> },
    { id: "entwicklungsregel", titel: "Dauerhafte Entwicklungsregel", el: <BildThema id="entwicklungsregel" symbol={<ClipboardCheck/>} titel="Dauerhafte Entwicklungsregel" bild={<Ablaufbild label="Reihenfolge jeder Erweiterung" knoten={systemCheckManifest.developmentRule.map((titel) => ({ titel: String(titel) }))}/>}
      merk={[<><b>Bestehende Prüfpunkte bleiben.</b></>, <><b>Freigabe</b> nur ohne kritischen Fehler.</>]}
      ausfuehrlich={<><p>Jede neue Erweiterung folgt künftig immer derselben Reihenfolge:</p><ol>{systemCheckManifest.developmentRule.map((step) => <li key={step}>{step}</li>)}</ol><p>Bestehende Prüfpunkte bleiben erhalten. Neue Funktionen erweitern den Prüfkatalog. Eine Version wird erst freigegeben, wenn kein kritischer Fehler festgestellt wurde.</p></>}/> },
    { id: "verbinden-loeschen", titel: "Kann beim Verbinden etwas gelöscht werden?", el: <BildThema id="verbinden-loeschen" symbol={<HelpCircle/>} titel="Kann beim Verbinden etwas gelöscht werden?" weg="Sicherheit" bild={<KastenReihe label="Was Verbinden und Sperren tun" knoten={[{ titel: "Verbinden", unter: "legt Register und Kennung an", art: "gut" }, { titel: "Sperren", unter: "entfernt nur die Freigabe im Browser · nur bei eigenem Ordner" }]}/>}
      merk={[<><b>Nein, dabei wird nichts gelöscht.</b></>, <><b>„Sperren“</b> steht nur da, wenn ein eigener OneDrive- oder PC-/USB-Ordner verbunden ist.</>]} vorschau={vs("security")}/> },
    { id: "knopf-farben", titel: "Was bedeuten die Farben der Arbeitsknöpfe?", el: <BildThema id="knopf-farben" symbol={<HelpCircle/>} titel="Was bedeuten die Farben der Arbeitsknöpfe?" bild={<KastenReihe label="Farben der Arbeitsknöpfe" knoten={[{ titel: "Zartgelb", unter: "noch offen", art: "hervor" }, { titel: "Hellgrün", unter: "erledigt", art: "gut" }, { titel: "Hellgrau", unter: "zuletzt nicht möglich" }]}/>}
      merk={[<><b>Jeder Knopf</b> bleibt antippbar, auch grüne und graue.</>]}/> },
    { id: "onedrive-usb", titel: "Wie sichere ich OneDrive auf PC oder USB?", el: <BildThema id="onedrive-usb" symbol={<Usb/>} titel="Wie sichere ich OneDrive auf PC oder USB?" weg="Sicherheit › Fehlende Dateien suchen (nur am PC)" bild={<Ablaufbild label="OneDrive sichern" knoten={[{ titel: "OneDrive-Ordner verbinden", ziel: () => onGo("security") }, { titel: "PC- oder USB-Ordner verbinden" }, { titel: "„Fehlende Dateien suchen“", unter: "zeigt, was fehlt", art: "hervor" }, { titel: "„Fehlende Dateien jetzt sichern“", art: "gut" }]}/>}
      merk={[<><b>Nur auf deinen Tipp.</b></>, <><b>Kopiert nur Fehlendes</b>; nichts gelöscht, nichts überschrieben.</>]} vorschau={vs("security", "OneDrive auf PC oder USB sichern")}
      ausfuehrlich={<><p>Verbinde zuerst den lokalen OneDrive-Ordner und danach einen PC- oder USB-Ordner. Öffne anschließend das Sicherheitscenter und wähle „Fehlende Dateien suchen“. Das geht nur am PC in Chrome oder Edge. Die Familienakte zeigt dir zuerst, wie viele registrierte Dokumente noch fehlen. Erst mit „Fehlende Dateien jetzt sichern“ beginnt das Kopieren.</p><p>Die Suche läuft nur nach deinem Klick. Er kopiert ausschließlich fehlende Dateien von OneDrive zur Sicherung. Es wird nichts gelöscht und keine vorhandene Datei überschrieben.</p></>}/> },
    { id: "noch-nicht", titel: "Was funktioniert noch nicht vollständig?", el: <BildThema id="noch-nicht" symbol={<HelpCircle/>} titel="Was funktioniert noch nicht vollständig?" bild={<KastenReihe label="Was noch fehlt" knoten={[{ titel: "E-Mail abholen und senden", unter: "geplant", art: "warnung", ziel: () => zurStelle('[data-hilfe-id="email"] > details') }, { titel: "Einlesen in volle Akte", unter: "noch nicht, nur in leere", art: "warnung" }, { titel: "Abgleich zwischen Geräten", unter: "geplant", art: "warnung" }, { titel: "Automatisch sortieren", unter: "bewusst nicht" }]}/>}
      merk={[<><b>Bis dahin:</b> Anhang oder Mail aus der Mail-App teilen.</>, <><b>Die App tut nur, was du bestätigst.</b></>]}
      ausfuehrlich={<><ul className="kalender-hilfe-punkte"><li>E-Mails direkt aus einem Postfach abholen oder senden: geplant, siehe „E-Mail in die Familienakte“. Bis dahin: Anhang oder Mail aus der Mail-App an die Familienakte teilen.</li><li>Eine Sicherung in eine schon gefüllte Akte einlesen (zusammenführen): noch nicht, nur in eine leere Akte.</li><li>Einträge, Fristen und Erinnerungen zwischen zwei benutzten Geräten abgleichen: geplant. Eine einzelne Unterlage gibst du über „Teilen“ an der Unterlage weiter; die ganze Akte gleichst du unter Sicherheit › „Meine Geräte“ ab.</li><li>Sichern, Einlesen und Exportieren in der Web-App am Handy oder Tablet: geht dort nicht (keine Ordnerwahl). Dafür die Pro-App oder Chrome bzw. Edge am PC.</li><li>Archivierte Erinnerungen und Notizen ansehen oder zurückholen: noch nicht.</li><li>E-Mail-Anlagen automatisch prüfen, die Mail-App mit Entwurf öffnen, über Microsoft senden: geplant.</li><li>Aktuelle Recherche im Internet für die Assistenz: noch nicht eingerichtet.</li><li>Bewusst nicht: automatische Dateisortierung und ein Abgleich im Hintergrund. Die App tut nur, was du bestätigst.</li></ul></>}/> },
    { id: "persoenliche-daten", titel: "Wie werden persönliche Daten geschützt?", el: <BildThema id="persoenliche-daten" symbol={<HelpCircle/>} titel="Wie werden persönliche Daten geschützt?" bild={<KastenReihe label="Wohin deine Daten gehen" knoten={[{ titel: "Akte und Originale", unter: "auf deinem Gerät oder im gewählten Ordner", art: "gut" }, { titel: "Kalender", unter: "nur Titel, Zeit, Erinnerung" }, { titel: "KI und Dienste", unter: "nichts automatisch" }]}/>}
      merk={[<><b>Notizen</b> gehen nie in einen Kalender.</>, <><b>Passwörter und Einmalcodes</b> speichert die App nicht.</>]}
      ausfuehrlich={<><ul className="kalender-hilfe-punkte"><li>Deine Akte und die Originale bleiben auf deinem Gerät oder in dem Ordner, den du gewählt hast.</li><li>In einen verbundenen Kalender gehen nur Titel, Zeit und Erinnerung von Fristen, die du angehakt hast. Notizen nie.</li><li>Passwörter und Einmalcodes werden nicht in der Familienakte gespeichert.</li><li>Nichts geht automatisch an eine KI oder einen anderen Dienst.</li></ul></>}/> },
    { id: "mikrofon", titel: "Mikrofon und Diktat", el: <BildThema id="mikrofon" symbol={<Mic/>} titel="Mikrofon und Diktat" weg="zartgelbe Felder" bild={<Ablaufbild label="Diktieren" knoten={[{ titel: "Mikrofon antippen", unter: "beim ersten Mal erlauben" }, { titel: "Rot: „Aufnahme läuft“", art: "hervor" }, { titel: "Tipp aufs rote Mikrofon", unter: "beendet" }]}/>}
      merk={[<><b>Startet nie von selbst.</b></>, <><b>Keine Tonaufnahme</b> wird gespeichert; Vertrauliches lieber tippen.</>, <><b>Ohne Mikrofon</b> geht es immer mit der Tastatur.</>]} vorschau={vs("overview")}
      ausfuehrlich={<><ul className="kalender-hilfe-punkte"><li>Zartgelbe Felder sind zum Schreiben oder Sprechen. Daneben steht ein Mikrofon.</li><li>Antippen: Beim ersten Mal den Mikrofonzugriff erlauben, dann auf Deutsch sprechen. Rot mit „Aufnahme läuft“ heißt: es hört zu.</li><li>Ein Tipp auf das rote Mikrofon beendet das Diktat. Auch Tippen in ein Feld oder ein anderes Mikrofon beendet es.</li><li>Kurze Pausen beim Sprechen sind kein Problem; bricht die Erkennung ab, startet die App sie wieder. Ein neues Diktat in der Suche ersetzt den alten Suchsatz.</li><li>Das Mikrofon startet nie von selbst, auch nicht im Knopf „Notiz“.</li><li>Die Familienakte speichert keine Tonaufnahme. Die vorhandene Spracherkennung des Browsers oder Geräts kann je nach Anbieter eine Internetverbindung und Verarbeitung durch diesen Anbieter benötigen; Vertrauliches lieber tippen.</li><li>Ohne Mikrofon oder offline geht es immer mit der Tastatur weiter.</li></ul></>}/> },
    { id: "nicht-finden", titel: "Ich finde ein Dokument nicht", el: <BildThema id="nicht-finden" symbol={<HelpCircle/>} titel="Ich finde ein Dokument nicht" bild={<Ablaufbild label="Ein Dokument wiederfinden" knoten={[{ titel: "Oben suchen", unter: "Name, Thema, ICD, Jahr", ziel: sprung(onGo, "overview") }, { titel: "Allgemeiner fragen", unter: "„Rente“ statt Dateiname" }, { titel: "Bedeutungssuche", unter: "wenn eingerichtet" }, { titel: "Bibliothek filtern", unter: "nach Bereich oder Datum", art: "gut", ziel: sprung(onGo, "documents") }]}/>}
      merk={[<><b>Ein allgemeines Wort</b> findet mehr als ein Dateiname.</>]} vorschau={vs("documents")}
      ausfuehrlich={<><ol><li>Gib oben einen Namen, ein Thema, einen ICD-Code oder ein Jahr ein.</li><li>Versuche einen allgemeineren Begriff, zum Beispiel „Rente“ statt eines vollständigen Dateinamens.</li><li>Unter den Treffern steht die Private Bedeutungssuche. Ist sie auf dem Gerät eingerichtet, findet sie auch Dokumente mit ähnlichem Sinn – in der Android- und Windows-App und seit 2.28.46 auch in der Web-App (Chrome, Edge): Modell einmal unter Sicherheit › Private Bedeutungssuche laden, Ladebalken in Prozent, alles bleibt auf dem Gerät.</li><li>Öffne die Dokumentenbibliothek und filtere nach Bereich oder Datum.</li></ol></>}/> },
  ];
  const examples = ["Schreiben der Krankenkasse zum Zuschuss", "Rechnung der Waschmaschine", "Mietvertrag Pustelblumenweg", "Impfpass und Vorsorge"];
  return <><PageTitle icon={<LifeBuoy/>} title="Hilfe" text="Kurze und verständliche Erklärungen zur Familienakte – ohne technische Fachsprache."/>
    <HilfeOrdnungAnsicht themen={themen} herkunft={herkunft} eingerichtet={eingerichtet} oben={<AppLandkarteHilfe onGo={onGo} eingerichtet={eingerichtet} demo={demo} live={live} aktenSichern={() => zurStelle("details.aktensicherung")}/>} zwischen={<>
    <section className="help-start card"><div><span className="badge success">Erste Schritte</span><span className="ui-heading-help"><h2>Was möchtest du tun?</h2><InfoPopover label="Was möchtest du tun? erklären" text={UI_HELP["Was möchtest du tun?"]}/></span></div><div className="help-actions"><button onClick={() => onGo("documents")}><Archive/><span><strong>Dokumente finden</strong></span></button><button onClick={() => onGo("inventory")}><FolderSearch/><span><strong>Bestand prüfen</strong></span></button><button onClick={() => onGo("inbox")}><Upload/><span><strong>Dokument ablegen</strong></span></button><button onClick={() => onGo("memory")}><BookHeart/><span><strong>Tagebuch schreiben</strong></span></button><button onClick={() => onGo("security")}><HardDrive/><span><strong>Datentresor öffnen</strong></span></button><button onClick={() => onGo("systemcheck")}><ShieldCheck/><span><strong>Systemprüfung</strong></span></button><button onClick={() => onGo("changelog")}><History/><span><strong>Was gibt’s Neues?</strong></span></button></div></section>
    <details className="card help-suche"><summary><Search size={18}/> Wie suche ich etwas?</summary><div className="search-examples">{examples.map((example) => <button key={example} onClick={() => onSearch(example)}><Search size={16}/>{example}</button>)}</div><p className="fine-print">Das Mikrofon schreibt Gesprochenes in das Suchfeld. Danach erkennt die Familienakte Themen wie Krankenkasse, Leistung, Schreiben, Ärzte, ICD-Codes, Aufgaben oder Fristen. Gesucht wird nur in bereits vorhandenen Angaben; PDF- oder Word-Inhalte werden nicht automatisch gelesen und es werden keine Treffer erfunden.</p></details>
    <KurzhinweiseSchalter/>
    </>}/>
  </>;
}

type SystemCheckApiSummary = {
  documentCount: number;
  duplicateDocumentHashes: number;
  familyRecordCount: number;
  familyRecordTypes: string[];
  relationCount: number;
  relationPairs: string[];
};

const levelSymbol: Record<SystemCheckLevel, string> = { green: "🟢", yellow: "🟡", red: "🔴" };

function SystemCheck({ documents, localDocuments, vaultHandle, onCompleted }: {
  documents: UploadedDocument[];
  localDocuments: LocalDocument[];
  vaultHandle: FileSystemDirectoryHandle | null;
  onCompleted: (report: SystemCheckReport) => void;
}) {
  const [report, setReport] = useState<SystemCheckReport | null>(() => {
    return readSystemCheckReports().find((item) => item.kind === "check") || normalizeSystemReport(releaseSystemCheckReport as unknown as StoredSystemCheck);
  });
  const [reports, setReports] = useState<SystemCheckReport[]>(() => readSystemCheckReports());
  const [running, setRunning] = useState<"full" | "changes" | "repair" | "verification" | null>(null);
  const [repairProgress, setRepairProgress] = useState<{ percent: number; area: string; attempt: number } | null>(null);
  const [runError, setRunError] = useActivityMessage("error", "Systemprüfung");
  const lastCheck: StoredSystemCheck | null = report;

  const saveUserAcceptance = (nextReport: SystemCheckReport) => {
    // Reuse the existing report store, but never overwrite an unreadable report collection.
    const raw = workspaceStorage.getItem(SYSTEM_CHECK_REPORTS_KEY);
    if (raw) {
      try { const entries = JSON.parse(raw) as StoredSystemCheck[]; if (!Array.isArray(entries) || entries.some((entry) => !normalizeSystemReport(entry))) throw new Error("invalid"); }
      catch { throw new Error("Die vorhandenen Prüfberichte sind nicht lesbar. Sie bleiben erhalten. Bitte den technischen Fehler zuerst prüfen lassen."); }
    }
    let updatedReports: SystemCheckReport[];
    try {
      updatedReports = saveSystemCheckReport(nextReport, false);
      const stored = JSON.parse(workspaceStorage.getItem(SYSTEM_CHECK_REPORTS_KEY) || "[]") as SystemCheckReport[];
      if (JSON.stringify(stored.find((item) => item.id === nextReport.id)?.userAcceptance) !== JSON.stringify(nextReport.userAcceptance)) throw new Error("verify");
    } catch { throw new Error("Die Prüfergebnisse konnten im Browser nicht sicher gespeichert und wieder gelesen werden. Bitte die Browser-Speicherberechtigung und freien Speicher prüfen und erneut absenden."); }
    setReports(updatedReports);
  };

  const evaluateSystem = async (mode: "full" | "changes"): Promise<SystemCheckReport> => {
      // Kein Online-Speicher (B3): die Bestandsprüfung ist ausschließlich lokal und nur lesend.
      const online: SystemCheckApiSummary = { documentCount: 0, duplicateDocumentHashes: 0, familyRecordCount: 0, familyRecordTypes: [], relationCount: 0, relationPairs: [] };
      const local = vaultHandle ? await readLocalSystemSnapshot(vaultHandle) : null;
      const areas: SystemCheckArea[] = [];
      const addArea = (area: SystemCheckArea) => areas.push(area);

      const navigationIds = new Set(topNavigation.flatMap((area) => [area.landing, ...area.groups.flatMap((group) => group.items.map((item) => item.id))]));
      const expectedSections: SectionId[] = ["overview", "cockpit", "assistant", "documents", "inventory", "health", "medical", "benefits", "work", "assessment", "correspondence", "family", "home", "vehicles", "purchases", "reminders", "memory", "inbox", "security", "sources", "directory", "help", "changelog", "versions", "systemcheck"];
      const missingSurfaceSections = expectedSections.filter((id) => !sectionLabels[id]);
      addArea({
        id: "interface", label: "Oberfläche", level: missingSurfaceSections.length ? "red" : "green",
        summary: missingSurfaceSections.length ? "Erwartete sichtbare Bereiche fehlen." : "Startseite, Karten, Fachbereiche und Statusdarstellungen sind registriert.",
        details: missingSurfaceSections.length ? [`Fehlende Bereiche: ${missingSurfaceSections.join(", ")}`] : ["Die bestehende ruhige Karten-, Farb- und Seitenlogik bleibt eingebunden.", "Die Systemprüfung verändert die Gestaltung nicht."],
      });

      const missingNavigation = expectedSections.filter((id) => id !== "overview" && !navigationIds.has(id));
      const helpMenu = topNavigation.find((area) => area.id === "help");
      const visibleSystemCheck = helpMenu?.groups.some((group) => group.items.some((item) => item.id === "systemcheck" && item.label === "Systemprüfung"));
      addArea({
        id: "navigation", label: "Navigation", level: missingNavigation.length || !visibleSystemCheck ? "red" : "green",
        summary: missingNavigation.length || !visibleSystemCheck ? "Mindestens ein erwarteter Navigationsweg fehlt." : "Alle Hauptwege einschließlich Hilfe → Systemprüfung sind vorhanden.",
        details: missingNavigation.length ? [`Nicht erreichbare Bereiche: ${missingNavigation.join(", ")}`] : ["Startseite, Hauptnavigation, Hilfe und Gesamtes Verzeichnis sind verknüpft.", "Der Eintrag „Systemprüfung“ ist unter Hilfe deutlich sichtbar."],
      });

      addArea({
        id: "data", label: "Bestehende Daten", level: local?.registerState === "corrupted" || local?.integrityLevel === "red" ? "red" : local?.integrityLevel === "yellow" ? "yellow" : "green",
        summary: local?.registerState === "corrupted" ? "Die vorhandene Registerdatei ist beschädigt. Sie wurde nicht überschrieben." : local?.integrityLevel === "red" ? "Der lokale Bestand enthält einen kritischen Integritätsfehler." : local?.integrityLevel === "yellow" ? "Der lokale Bestand enthält eine nichtkritische Abweichung, die geprüft werden sollte." : "Vorhandene Register und allgemeine Datensätze sind weiterhin erreichbar.",
        details: [
          `${online.familyRecordCount + (local?.recordCount || 0)} allgemeine Datensätze und ${online.relationCount + (local?.relationCount || 0)} Verknüpfungen lesend erfasst.`,
          vaultHandle ? (local?.registerState === "valid" ? "Der verbundene lokale Registerbestand ist lesbar." : local?.registerState === "missing" ? "Noch keine Registerdatei vorhanden; ein leerer neuer Tresor ist zulässig." : "Das beschädigte Register blieb unverändert; bitte eine gültige Sicherung zur Wiederherstellung auswählen.") : "Kein lokaler Tresor verbunden; dies ist kein Fehler.",
          ...(local?.integrityIssues || []),
          "Es wurde keine Migration, Reparatur oder Neustrukturierung ausgeführt.",
        ],
      });

      const healthReady = healthData.currentDiagnoses.length > 0 && healthData.doctors.length > 0 && healthData.auTimeline.length > 0 && coreDocuments.length > 0;
      addArea({
        id: "health", label: "Gesundheitsakte", level: healthReady ? "green" : "red",
        summary: healthReady ? "Gesundheitsakte, AU-Zeiten und Quellenstruktur sind weiterhin vorhanden." : "Ein erwarteter Hauptbestandteil der Gesundheitsakte fehlt.",
        details: healthReady ? ["Diagnose-, Ärzte-, AU- und Quellenbereiche sind erreichbar.", "Die Prüfung zeigt keine Diagnosen oder persönlichen Gesundheitsinhalte an.", "Das gemeinsame Datenmodell hat die bestehende Gesundheitsstruktur nicht ersetzt."] : ["Bitte die fehlende Struktur prüfen. Es wurde keine automatische Reparatur ausgeführt."],
      });

      const brokenOnlineReferences = documents.filter((item) => !item.id || !item.downloadUrl).length;
      const brokenLocalReferences = localDocuments.filter((item) => !item.id || !item.storedPath).length;
      const duplicateCount = online.duplicateDocumentHashes + (local?.duplicateDocumentIds || 0) + (local?.duplicateStoredPaths || 0);
      const documentLevel: SystemCheckLevel = brokenOnlineReferences || brokenLocalReferences ? "red" : duplicateCount ? "yellow" : "green";
      addArea({
        id: "documents", label: "Dokumente", level: documentLevel,
        summary: documentLevel === "red" ? "Mindestens eine Dokumentreferenz ist unvollständig." : documentLevel === "yellow" ? "Mögliche Dubletten sollten manuell angesehen werden." : "Erreichbare Dokumentreferenzen sind vollständig und unauffällig.",
        details: [
          `${online.documentCount} geschützte Online-Referenz${online.documentCount === 1 ? "" : "en"} lesend geprüft.`,
          vaultHandle ? (local ? `${local.documentCount} lokale Registerreferenz${local.documentCount === 1 ? "" : "en"} lesend geprüft.` : "Lokale Dokumentreferenzen konnten nicht gelesen werden.") : "Kein lokaler Tresor verbunden; die Prüfung beschränkt sich auf erreichbare Register.",
          duplicateCount ? `${duplicateCount} mögliche Dubletten-Auffälligkeit${duplicateCount === 1 ? "" : "en"}; keine automatische Bereinigung.` : "Keine offensichtlichen Dubletten in den erreichbaren Registern erkannt.",
        ],
      });

      const documentLibrarySelfTest = runDocumentLibrarySelfTests();
      const documentLibraryTest = { id: "document-library" as const, label: "Dokumentenbibliothek v1", status: documentLibrarySelfTest.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: documentLibrarySelfTest.summary };
      const documentLibraryReady = documentLibrarySelfTest.passed && systemCheckManifest.completedCapabilities.includes("Dokumentenbibliothek v1");
      addArea({
        id: "documentlibrary", label: "Dokumentenbibliothek", level: documentLibraryReady ? "green" : "red",
        summary: documentLibraryReady ? "Die Bibliothek verwendet den vorhandenen Dokumentbestand und ihre praktischen Kernfunktionen wurden erfolgreich geprüft." : "Die Dokumentenbibliothek oder mindestens ein praktischer Bibliothekstest ist unvollständig.",
        details: documentLibraryReady ? ["Neueste Dokumente, Bereiche, vollständige Ansicht, Suche, Filter und Sortierung sind eingerichtet.", "Titel, Vorschauen, Bereiche, Zähler und vorhandene Beziehungen führen zu einem passenden Ziel.", "Gesundheitsunterlagen verwenden eine datensparsame Darstellung und führen in den geschützten Fachbereich.", "Cockpit, Neuigkeiten, Vorgänge und Bibliothek verwenden dieselben Dokumentkennungen; es entstand keine zweite Datenbank.", "Mobile Karten und Filter wurden vorbereitet; Originaldateien und vorhandene Verknüpfungen bleiben unverändert.", documentLibrarySelfTest.summary] : [documentLibrarySelfTest.summary],
      });

      const documentIntakeTests = runDocumentIntakeSelfTests();
      const documentIntakeReady = documentIntakeTests.length === 21
        && documentIntakeTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Intelligenter Dokumenteneingang v1")
        && systemCheckManifest.architectureRule === "Ein Datensatz – eine Quelle – mehrere Verknüpfungen und Ansichten."
        && systemCheckManifest.documentIntakeReuse.length === 7;
      addArea({
        id: "documentintake", label: "Dokumenteneingang", level: documentIntakeReady ? "green" : "red",
        summary: documentIntakeReady ? "Alle Eingangswege verwenden dieselbe lokale Verarbeitung, Zuordnung und Dokumentquelle." : "Die gemeinsame Verarbeitung oder mindestens ein praktischer Eingangstest ist unvollständig.",
        details: documentIntakeReady ? [
          "Drag & Drop, Dateiauswahl, Dokumentenfoto, lokaler Eingangsordner und lokaler OneDrive-Posteingang führen in dieselbe Pipeline.",
          "Dokumentenbibliothek, gemeinsame Suche, FaWoGa-Zuordnung, Cockpit, Neuigkeiten, Vorgangschronologie und Gesundheitsakte werden wiederverwendet.",
          "Bestehende Kennungen werden zuerst geprüft; unsichere Zuordnungen und mögliche Dubletten benötigen eine bewusste Bestätigung.",
          "Ordner werden nur auf Benutzerbefehl geprüft. Originaldateien werden nicht automatisch verschoben, umbenannt, gelöscht oder überschrieben.",
          `${documentIntakeTests.length} von ${documentIntakeTests.length} Dokumenteneingangs-Praxistests bestanden.`,
        ] : documentIntakeTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const centralIntakeTests = await runCentralIntakeSelfTests();
      const centralIntakeReady = centralIntakeTests.length >= 20
        && centralIntakeTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Zentrale Eingangszentrale mit gemeinsamer Inhaltsanalyse 2.28.0")
        && systemCheckManifest.centralIntakeReuse.length >= 8
        && systemCheckManifest.centralIntakeSafety.length >= 8;
      const centralIntakePilotComplete = Boolean(local?.centralIntakeDocumentCount);
      addArea({
        id: "centralintake", label: "Zentrale Eingangszentrale und gemeinsame Inhaltsanalyse", level: !centralIntakeReady ? "red" : centralIntakePilotComplete ? "green" : "yellow",
        summary: !centralIntakeReady ? "Die Eingangszentrale oder mindestens eine ihrer Pflichtprüfungen ist unvollständig." : centralIntakePilotComplete ? "Technik und praktischer Pilot der gemeinsamen Eingangszentrale sind bestätigt." : "Die technische Umsetzung ist geprüft; ein bewusster Testimport in dieser Testfassung steht noch aus.",
        details: centralIntakeReady ? [
          "Drag & Drop und Dateiauswahl nehmen einzelne oder mehrere Dateien ohne vorherige Typauswahl an.",
          "PDF, Word, Bilder, Text, EML, MSG, Tabellen, Archive und unbekannte Typen werden unterschieden; unlesbare Inhalte bleiben sichtbar ungeklärt.",
          "E-Mail-Metadaten und extrahierbare Anlagen werden getrennt erfasst und nach bestätigter Übernahme miteinander verknüpft.",
          "Lokale Ordner und OneDrive werden nur nach bewusstem Benutzerbefehl geprüft; es läuft keine Dauerüberwachung.",
          "Dokumentenbibliothek, Suche, Kategorien, Vorgänge, Memory, Aufgaben, Fristen, Datenschutz und Archivierung werden wiederverwendet.",
          `${centralIntakeTests.length} von ${centralIntakeTests.length} Eingangszentrale-Praxistests bestanden.`,
          centralIntakePilotComplete ? `${local?.centralIntakeDocumentCount || 0} Testdokument${local?.centralIntakeDocumentCount === 1 ? " wurde" : "e wurden"} über die neue Eingangszentrale bestätigt.` : "Für GRÜN bitte in der privaten Testseite zuerst eine PDF-Testkopie über Dokumente → Eingangszentrale bewusst prüfen und übernehmen.",
        ] : centralIntakeTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const fawogaInventoryTests = runFawogaInventorySelfTests();
      const fawogaInventoryTechnicalReady = fawogaInventoryTests.length === 8
        && fawogaInventoryTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("FaWoGa-Bestandsanalyse und sichere Archivablage 2.27.2")
        && systemCheckManifest.fawogaInventoryReuse.length >= 7
        && systemCheckManifest.fawogaInventorySafety.length >= 8;
      const fawogaPilotComplete = Boolean(local
        && local.inventoryCount > 0
        && local.archivedInventoryCount > 0
        && local.assistantReleasedInventoryCount > 0);
      addArea({
        id: "fawogainventory",
        label: "FaWoGa-Bestandsanalyse und Archivintegrität",
        level: !fawogaInventoryTechnicalReady ? "red" : fawogaPilotComplete ? "green" : "yellow",
        summary: !fawogaInventoryTechnicalReady
          ? "Die Bestandsanalyse oder mindestens eine technische Schutzprüfung ist unvollständig."
          : fawogaPilotComplete
            ? "Analyse, geprüfte Archivkopie und ausdrückliche Assistenzfreigabe wurden im verbundenen Testbestand bestätigt."
            : "Die technische Grundlage ist geprüft; der praktische Pilot mit deinem Testordner steht noch aus.",
        details: [
          `${fawogaInventoryTests.filter((test) => test.passed).length} von ${fawogaInventoryTests.length} technischen Bestandsanalyse-Tests bestanden.`,
          "Quelle analysiert, archiviert und Assistenz freigegeben bleiben drei getrennte Zustände.",
          "Originaldateien werden nur gelesen und niemals automatisch verschoben, umbenannt, überschrieben oder gelöscht.",
          "Archivkopien werden per Prüfsumme kontrolliert; aktive Dokumente entstehen erst nach bewusster Freigabe.",
          fawogaPilotComplete
            ? `${local?.inventoryCount || 0} Dateien analysiert, ${local?.archivedInventoryCount || 0} archiviert und ${local?.assistantReleasedInventoryCount || 0} für die Assistenz freigegeben.`
            : "Für GRÜN muss der vorbereitete Pilotordner in der Familienakte praktisch analysiert, archiviert und mit mindestens einer Testkopie freigegeben werden.",
        ],
      });

      const fawogaOneDriveTests = runFawogaOneDriveSelfTests();
      const fawogaLearningTests = runFawogaLearningSelfTests();
      const inventoryPreviewTests = runInventoryPreviewSelfTests();
      const inventoryTextDecodingTests = runInventoryTextDecodingSelfTests();
      const testWorkspaceTests = runTestWorkspaceSelfTests();
      const preparedTestRegisterTests = runPreparedTestRegisterSelfTests();
      const automatedTestEnvironmentTests = runAutomatedTestEnvironmentSelfTests();
      const fawogaOneDriveTechnicalReady = fawogaOneDriveTests.length === 30
        && fawogaOneDriveTests.every((test) => test.passed)
        && fawogaLearningTests.length === 5
        && fawogaLearningTests.every((test) => test.passed)
        && inventoryPreviewTests.length === 6
        && inventoryPreviewTests.every((test) => test.passed)
        && inventoryTextDecodingTests.length === 5
        && inventoryTextDecodingTests.every((test) => test.passed)
        && testWorkspaceTests.length > 0
        && testWorkspaceTests.every((test) => test.passed)
        && preparedTestRegisterTests.length > 0
        && preparedTestRegisterTests.every((test) => test.passed)
        && automatedTestEnvironmentTests.length > 0
        && automatedTestEnvironmentTests.every((test) => test.passed)
        && FAWOGA_INVENTORY_VERSION === "2.28.1"
        && systemCheckManifest.completedCapabilities.includes("FaWoGa-OneDrive-Vollintegration und intelligente Bestandszuordnung 2.28.1")
        && systemCheckManifest.completedCapabilities.includes("Datenschutzgerechte Dokumentvorschau bei Bestand prüfen 2.28.1")
        && systemCheckManifest.completedCapabilities.includes("Vollständige bestätigungspflichtige Dokumentzuordnung 2.28.1")
        && systemCheckManifest.completedCapabilities.includes("Lesbarkeits- und Zeichencodierungsschutz für Dokumentvorschauen 2.28.1")
        && systemCheckManifest.completedCapabilities.includes("Testakte für Weiterentwicklung 2.28.1")
        && systemCheckManifest.completedCapabilities.includes("Automatische wiederverwendbare Testumgebung 2.28.1")
        && systemCheckManifest.fawogaOneDriveReuse.length >= 7
        && systemCheckManifest.fawogaOneDriveSafety.length >= 10;
      const completedInventoryScans = local?.completedOneDriveScanCounts || [];
      const repeatedInventoryCheckComplete = completedInventoryScans.length >= 2 && (local?.inventoryUnchangedCount || 0) > 0;
      const pauseResumeComplete = (local?.pausedInventoryScanCount || 0) > 0 && completedInventoryScans.length > 0;
      const practicalLearningComplete = (local?.inventoryLearningSignalCount || 0) >= 2 && (local?.confirmedInventoryAssignmentCount || 0) >= 2;
      const archiveAndReleaseComplete = (local?.archivedInventoryCount || 0) > 0 && (local?.assistantReleasedInventoryCount || 0) > 0;
      const fawogaOneDrivePilotComplete = Boolean(local?.inventoryCount)
        && repeatedInventoryCheckComplete
        && pauseResumeComplete
        && practicalLearningComplete
        && archiveAndReleaseComplete;
      addArea({
        id: "fawogaonedrive",
        label: "FaWoGa-OneDrive-Integration und intelligente Bestandszuordnung",
        level: !fawogaOneDriveTechnicalReady ? "red" : fawogaOneDrivePilotComplete ? "green" : "yellow",
        summary: !fawogaOneDriveTechnicalReady
          ? "Die inkrementelle OneDrive-Bestandslogik oder eine technische Schutzprüfung ist unvollständig."
          : fawogaOneDrivePilotComplete
            ? "Technik und vollständiger Abschlusslauf mit dem verbundenen Testbestand wurden bestätigt."
            : "Die technische Umsetzung ist geprüft; mindestens ein praktischer Schritt der Abschlussprüfung steht noch aus.",
        details: [
          `${fawogaOneDriveTests.filter((test) => test.passed).length} von ${fawogaOneDriveTests.length} technischen FaWoGa-OneDrive-Prüfungen bestanden.`,
          `${fawogaLearningTests.filter((test) => test.passed).length} von ${fawogaLearningTests.length} Prüfungen der lernfähigen, bestätigungspflichtigen Zuordnung bestanden.`,
          `${inventoryPreviewTests.filter((test) => test.passed).length} von ${inventoryPreviewTests.length} Vorschau- und Datenschutzwegen bestanden.`,
          `${inventoryTextDecodingTests.filter((test) => test.passed).length} von ${inventoryTextDecodingTests.length} Prüfungen für Zeichencodierung, Binärschutz und unlesbare Inhalte bestanden.`,
          `${testWorkspaceTests.filter((test) => test.passed).length} von ${testWorkspaceTests.length} technischen Prüfungen der lesenden Testakten-Verwaltung und ${preparedTestRegisterTests.filter((test) => test.passed).length} von ${preparedTestRegisterTests.length} Prüfungen der Testregister-Vorschau bestanden.`,
          `${automatedTestEnvironmentTests.filter((test) => test.passed).length} von ${automatedTestEnvironmentTests.length} Schutz- und Integrationsprüfungen der automatischen Testumgebung bestanden.`,
          "Person, Organisation, Objekt und Vorgang verwenden vorhandene Datensätze zuerst; neue Vorschläge entstehen ausschließlich nach Bestätigung und werden zuvor auf gleichnamige Datensätze geprüft.",
          "Kategorie, persönlicher Lebensbereich, Dokumentenart und Stichworte sind direkt im Vorschaufenster bearbeitbar. Nur bestätigte Werte fließen in die Lernhilfe ein.",
          "Bestandsregister, stabile Datei-IDs, inkrementelle Prüfung, Pause/Fortsetzung, Kategorien, persönliche Lebensbereiche, Dubletten und Versionen verwenden die bestehende Familienaktenlogik.",
          "Originaldateien werden nicht verschoben, umbenannt, überschrieben oder gelöscht; es läuft keine OneDrive-Dauerüberwachung.",
          local?.inventoryCount ? `${local.inventoryCount} Dateien des bereits verbundenen Testbestands sind im Bestandsregister erfasst.` : "Offen: den bereits verbundenen Testbestand vollständig abgleichen.",
          repeatedInventoryCheckComplete ? "Ein erneuter inkrementeller Abgleich mit unveränderten Dateien ist nachgewiesen." : "Offen: nach den Prüfungen nochmals abgleichen und unveränderte Dateien bestätigen.",
          pauseResumeComplete ? "Unterbrechung und anschließende Fortsetzung sind im Prüfprotokoll nachgewiesen." : "Offen: eine Analyse pausieren und anschließend fortsetzen.",
          practicalLearningComplete
            ? `${local?.inventoryLearningSignalCount || 0} bestätigte Lernsignale sind vorhanden.`
            : `Offen: ${Math.max(0, 2 - (local?.confirmedInventoryAssignmentCount || 0))} weitere bestätigte Zuordnung${Math.max(0, 2 - (local?.confirmedInventoryAssignmentCount || 0)) === 1 ? "" : "en"} und ${Math.max(0, 2 - (local?.inventoryLearningSignalCount || 0))} weitere${Math.max(0, 2 - (local?.inventoryLearningSignalCount || 0)) === 1 ? "s" : ""} Lernsignal${Math.max(0, 2 - (local?.inventoryLearningSignalCount || 0)) === 1 ? "" : "e"} erforderlich.`,
          archiveAndReleaseComplete ? `${local?.archivedInventoryCount || 0} Dokumente sind archiviert; ${local?.assistantReleasedInventoryCount || 0} davon für die Assistenz freigegeben.` : "Offen: mindestens ein geeignetes Testdokument archivieren und anschließend bewusst für die Assistenz freigeben.",
        ],
      });

      const documentScanTests = runDocumentScanSelfTests();
      const documentScanReady = documentScanTests.length === 8
        && documentScanTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Dokument fotografieren → PDF → Dokumenteneingang")
        && systemCheckManifest.documentScanReuse.length >= 7
        && systemCheckManifest.documentScanSafety.length >= 7;
      addArea({
        id: "documentscan", label: "Dokument fotografieren", level: documentScanReady ? "green" : "red",
        summary: documentScanReady ? "Fotoaufnahme, Mehrseitenprüfung und PDF-Erstellung verwenden den vorhandenen Dokumenteneingang." : "Die Scan-Seitenverwaltung, PDF-Erstellung oder Übergabe an die bestehende Pipeline ist unvollständig.",
        details: documentScanReady ? [
          "Die Kamera beziehungsweise Fotoauswahl startet nur nach einer bewussten Benutzeraktion.",
          "Seiten können geöffnet, neu aufgenommen, gedreht, behutsam zugeschnitten, verbessert, entfernt und neu sortiert werden.",
          "Eine oder mehrere Seiten werden zu genau einer PDF zusammengeführt; die Scan-Fotos werden nicht als eigene Dokumente registriert.",
          "Die PDF verwendet anschließend dieselbe Dubletten-, Zuordnungs-, Vorgangs-, Memory-, Such- und Gesundheitslogik wie andere Dokumente.",
          "Originalaufnahmen werden nur nach ausdrücklicher Auswahl als Anlagen derselben PDF behalten.",
          `${documentScanTests.length} von ${documentScanTests.length} Scan-/PDF-Praxistests bestanden.`,
        ] : documentScanTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const baseMemoryTests = runFamilyMemorySelfTests();
      const memoryQueueTests = runMemoryQueueSelfTests();
      const memoryTests = [...baseMemoryTests, ...memoryQueueTests];
      const memoryReady = baseMemoryTests.length === 12
        && memoryQueueTests.length === 10
        && memoryTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Memory, Erinnerungsprotokoll und interaktiver KI-Assistent v1")
        && systemCheckManifest.completedCapabilities.includes("Memory v1.3 – Mehrfacherfassung und Bearbeitungswarteschlange")
        && systemCheckManifest.memoryReuse.length >= 7
        && systemCheckManifest.memorySafety.length >= 7;
      addArea({
        id: "memory", label: "Memory & Erinnerungsprotokoll", level: memoryReady ? "green" : "red",
        summary: memoryReady ? "Erinnerungen werden lokal erfasst, strukturiert und über vorhandene Datensätze sicher verknüpft." : "Der Memory-Ablauf oder mindestens ein praktischer Test ist unvollständig.",
        details: memoryReady ? [
          "Text, Dauerdiktat, Fotos und Videos führen in dieselbe bestätigungspflichtige Erfassung.",
          "Originaltext, Tatsachen, Beobachtungen und Einschätzungen bleiben nachvollziehbar getrennt.",
          "Vorhandene Ereignisse, Personen, Organisationen, Objekte, Vorgänge, Aufgaben und Fristen werden wiederverwendet; es entstand keine zweite Datenbank.",
          "Mehrere Eingaben bleiben als getrennte lokale Entwürfe erhalten; Medien, Reihenfolge und Bearbeitungsstatus sind eindeutig zugeordnet.",
          "Erst Bestätigt speichern überführt genau einen Entwurf in die vorhandene Chronologie; unbehandelte Entwürfe und Rückfragen zu gespeicherten Einträgen bleiben getrennt.",
          "Gesundheitsbezüge bleiben außerhalb des geschützten Bereichs datensparsam; lokale Medien werden nicht an einen externen KI-Dienst übertragen.",
          `${memoryTests.length} von ${memoryTests.length} Memory-Praxistests bestanden, davon ${memoryQueueTests.length} Mehrfacherfassungstests.`,
        ] : memoryTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const contextLinkingTests = runContextLinkingSelfTests();
      const contextLinkingReady = contextLinkingTests.length === 7
        && contextLinkingTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Intelligente Dokument-Memory-Vorgangsverknüpfung v1")
        && systemCheckManifest.contextLinkingReuse.length >= 7
        && systemCheckManifest.contextLinkingSafety.length >= 8;
      addArea({
        id: "contextlinking", label: "Dokument-Memory-Vorgangsverknüpfung", level: contextLinkingReady ? "green" : "red",
        summary: contextLinkingReady ? "Dokumente, Tagebuch-Einträge und offene Punkte werden über vorhandene Vorgänge nachvollziehbar verbunden." : "Die Kontextverknüpfung oder mindestens ein praktischer Test ist unvollständig.",
        details: contextLinkingReady ? [
          "Dokumenteneingang, Memory, Relationsmodell, Suche, Cockpit und Vorgangschronologie werden gemeinsam wiederverwendet.",
          "Sichere, wahrscheinliche und unklare Vorschläge bleiben erklärbar; unsichere Verbindungen benötigen eine Benutzerentscheidung.",
          "Abgelehnte Vorschläge werden bei unverändertem Kontext nicht wiederholt; Verbindungen lassen sich lösen, ohne Datensätze zu löschen.",
          "Rückfragen zu gespeicherten Einträgen werden nur nach Bestätigung geschlossen. Teilabschlüsse bleiben offen und Gesundheitsdetails geschützt.",
          `${contextLinkingTests.length} von ${contextLinkingTests.length} Verknüpfungstests bestanden.`,
        ] : contextLinkingTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const consolidationTests = runCoreConsolidationSelfTests();
      const coreConsolidationReady = consolidationTests.length === 12
        && consolidationTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Konsolidierung, Datensicherheit und gemeinsame Kernlogik 2.27.1")
        && systemCheckManifest.leadingDataAuthority === "Lokales Familienakten-Register";
      addArea({
        id: "coreconsolidation", label: "Kernlogik und Datensicherheit 2.27.1", level: coreConsolidationReady ? "green" : "red",
        summary: coreConsolidationReady ? "Registerschutz, vollständige Sicherung, Datenschutz, Relationen, Kategorien und Memory-Lebenszyklus wurden gemeinsam geprüft." : "Mindestens eine verpflichtende Konsolidierungsprüfung ist fehlgeschlagen.",
        details: consolidationTests.map((test) => `${test.label}: ${test.passed ? "bestanden" : "fehlgeschlagen"} – ${test.summary}`),
      });

      const requiredTypes = ["person", "organisation", "object", "case", "document", "deadline", "task", "reminder", "event", "payment", "contract", "warranty"];
      const missingTypes = requiredTypes.filter((type) => !(type in recordTypeDefinitions));
      const testRecord = createFamilyRecord({ id: formatFamilyRecordId("person", 1), recordType: "person", status: "aktiv", source: "Systemprüfung", notes: null, data: {} });
      const fieldsReady = [testRecord.id, testRecord.recordType, testRecord.createdAt, testRecord.updatedAt, testRecord.status, testRecord.source].every((value) => value !== undefined) && "notes" in testRecord;
      const modelReady = !missingTypes.length && fieldsReady && testRecord.id === "PER-000001";
      addArea({
        id: "model", label: "Datenmodell", level: modelReady ? "green" : "red",
        summary: modelReady ? "Alle zwölf Datentypen, Systemfelder und die ID-Logik sind vorbereitet." : "Das gemeinsame Datenmodell ist nicht vollständig vorbereitet.",
        details: modelReady ? ["Kennungen wie PER-000001 können erzeugt werden.", `${online.familyRecordCount + (local?.recordCount || 0)} bereits angelegte allgemeine Datensätze gefunden; auch ein leerer Bestand ist in dieser Ausbaustufe zulässig.`] : [`Fehlende Typen: ${missingTypes.join(", ") || "Systemfelder oder ID-Logik"}`],
      });

      const assignmentTests = runAssignmentSystemTests();
      const assignmentReady = FAMILY_ASSIGNMENT_VERSION === 1
        && assignmentSequence.join("→") === "document→person→area→subarea→object→case→organisation→deadline→task→storage"
        && assignmentTests.every((test) => test.status === "bestanden");
      addArea({
        id: "assignment", label: "Zuordnungslogik v1", level: assignmentReady ? "green" : "red",
        summary: assignmentReady ? "Zuordnungen werden in fester Reihenfolge nur als bestätigungspflichtige Vorschläge vorbereitet." : "Zuordnungslogik oder Pflicht-Testfälle sind unvollständig.",
        details: assignmentReady ? [
          "Dokument → Person → Bereich → Unterbereich → Objekt → Vorgang → Organisation → Frist → Aufgabe → Speicherort.",
          "Bestehende Kennungen werden wiederverwendet; mögliche Dubletten und unsichere Treffer verlangen eine Auswahl.",
          "Fristen, Aufgaben und OneDrive-Ziele bleiben Vorschläge. Dateien und Datensätze werden nicht automatisch verändert.",
          "Der Gesundheitsbereich verwendet nur Referenzen und notwendige Metadaten.",
          ...assignmentTests.map((test) => `${test.label}: ${test.status}.`),
        ] : assignmentTests.map((test) => `${test.label}: ${test.status} – ${test.summary}`),
      });

      const relationshipPairs = ["Person → Objekt", "Person → Vorgang", "Objekt → Vorgang", "Objekt → Dokument", "Vorgang → Dokument", "Vorgang → Frist", "Vorgang → Aufgabe", "Dokument → Frist", "Dokument → Aufgabe", "Frist → Erinnerung"];
      const storedRelations = online.relationCount + (local?.relationCount || 0);
      addArea({
        id: "relations", label: "Verknüpfungen", level: assignmentReady ? "green" : "yellow",
        summary: assignmentReady ? "Beziehungen können als Vorschlag vorbereitet werden; gespeichert wird erst nach Bestätigung." : "Die technische Beziehungsgrundlage ist vorhanden, die Vorschlagslogik aber nicht vollständig bestätigt.",
        details: [`Das flexible Relationsmodell unterstützt technisch ${relationshipPairs.length} vorgesehene Beziehungstypen.`, storedRelations ? `${storedRelations} gespeicherte Verknüpfung${storedRelations === 1 ? "" : "en"} gefunden.` : "Der leere Verknüpfungsbestand ist zulässig; es wird keine Verknüpfung ohne Bestätigung angelegt."],
      });

      const probeTerms = [topNavigation[0]?.label, healthData.doctors[0]?.name, healthData.correspondence[0]?.subject, healthData.currentDiagnoses[0]?.codes, (localDocuments[0] || documents[0])?.originalName].filter((value): value is string => !!value && value !== "–"); // „–“ ist ein Platzhalter (keine Codes in Beispieldaten), kein Suchbegriff
      const successfulProbes = probeTerms.filter((term) => buildSearchResults(term, documents, localDocuments, [], [], { beispiele: true }).length > 0).length;
      const assistantTests = runFamilyAssistantSelfTests();
      const searchOnlyTests = runFamilySearchSelfTests();
      const searchTests = [...searchOnlyTests, ...assistantTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.summary, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary }))];
      const interactiveSearchReady = searchOnlyTests.every((test) => test.status === "bestanden");
      const searchLevel: SystemCheckLevel = probeTerms.length && successfulProbes === probeTerms.length && interactiveSearchReady ? "green" : successfulProbes || interactiveSearchReady ? "yellow" : "red";
      addArea({
        id: "search", label: "Suche", level: searchLevel,
        summary: searchLevel === "green" ? "Wörtliche und interaktive Suchabfragen lieferten die erwarteten Bereiche." : searchLevel === "yellow" ? "Mindestens eine wörtliche oder interaktive Testabfrage blieb unvollständig." : "Die Testabfragen lieferten kein verwertbares Ergebnis.",
        details: [`${successfulProbes} von ${probeTerms.length} vorhandenen Aktenbegriffen erfolgreich.`, `${searchOnlyTests.filter((test) => test.status === "bestanden").length} von ${searchOnlyTests.length} Alltagssätzen richtig verstanden.`, "Geprüft wurden nur Suchwege und Treffer, nicht die sensiblen Inhalte selbst."],
      });

      const exportSelfTest = runFamilyExportSelfTest();
      const exportTest = { id: "export" as const, label: "Vollständiger Aktenexport", status: exportSelfTest.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: exportSelfTest.summary };
      addArea({
        id: "export", label: "Export", level: exportSelfTest.passed ? "green" : "red",
        summary: exportSelfTest.passed ? "Der manuell gestartete Aktenexport ist vollständig umgesetzt und praktisch getestet." : "Der praktische Exporttest ist fehlgeschlagen.",
        details: exportSelfTest.passed ? ["Bereichsauswahl, Version, Exportdatum, Datensätze und Verknüpfungen wurden geprüft.", "Der Testexport erzeugte lesbares HTML, maschinenlesbares JSON und einen Exportbericht.", "Originaldateien bleiben unverändert; fehlender Zugriff wird als unvollständig gekennzeichnet.", "Die Familienakte behauptet keine eigene Verschlüsselung."] : [exportSelfTest.summary],
      });

      const newsSelfTest = runFamilyNewsSelfTest();
      const newsTest = { id: "news" as const, label: "Was gibt’s Neues?", status: newsSelfTest.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: newsSelfTest.summary };
      addArea({
        id: "news", label: "Was gibt’s Neues?", level: newsSelfTest.passed ? "green" : "red",
        summary: newsSelfTest.passed ? "Die chronologische Monatsübersicht ist aus dem bestehenden Datenmodell aufgebaut und praktisch getestet." : "Der praktische Test der Neuigkeiten-Übersicht ist fehlgeschlagen.",
        details: newsSelfTest.passed ? ["Standardzeitraum 60 Tage sowie weitere Zeitraumfilter wurden geprüft.", "Datum, Bereich, Titel, Kurzbeschreibung, Ersatzsymbol und Zielverknüpfung sind vorhanden.", "Neueste Tage stehen zuerst; Benutzerereignisse haben am selben Tag Vorrang vor Softwareänderungen.", "Sensible Inhalte erhalten keine lesbare Vorschau.", "Es wurde keine zweite Datenbank angelegt und keine bestehende Unterlage verändert."] : [newsSelfTest.summary],
      });

      const cockpitTests = runFamilyCockpitSelfTests();
      const cockpitReady = cockpitTests.length === 5
        && cockpitTests.every((test) => test.status === "bestanden")
        && systemCheckManifest.completedCapabilities.includes("Interaktives Cockpit v1")
        && systemCheckManifest.completedCapabilities.includes("Dokumentenbibliothek v1")
        && systemCheckManifest.interactiveCockpitIntegrated === true;
      addArea({
        id: "cockpit", label: "Interaktives Cockpit", level: cockpitReady ? "green" : "red",
        summary: cockpitReady ? "Das Cockpit verwendet das gemeinsame Datenmodell und alle fünf praktischen Abläufe wurden erfolgreich geprüft." : "Das Cockpit oder mindestens ein praktischer Testablauf ist unvollständig.",
        details: cockpitReady ? [
          "Zuletzt wichtig, To-dos, offene Vorgänge, Objektakten, Fristen und neue Unterlagen verwenden vorhandene Datensätze und Kennungen.",
          "Aufgabenstatus und Notizen benötigen eine eindeutige Bestätigung; erledigte Aufgaben bleiben in der Historie.",
          "Gesundheitshinweise bleiben datensparsam und führen in den geschützten Gesundheitsbereich.",
          "Die Neuigkeiten-Abfrage und die bestehende Fristenlogik werden wiederverwendet; es entstand keine zweite Datenbank.",
          ...cockpitTests.map((test) => `${test.label}: ${test.status}.`),
        ] : cockpitTests.map((test) => `${test.label}: ${test.status} – ${test.summary}`),
      });

      const assistantReady = assistantTests.length >= 5
        && assistantTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Assistenz- und Korrespondenzzentrale 2.28.1");
      addArea({
        id: "assistantcorrespondence", label: "Assistenz- und Korrespondenzzentrale", level: assistantReady ? "green" : "red",
        summary: assistantReady ? "Assistenz, Quellenabgrenzung und bestätigungspflichtige Korrespondenz verwenden den vorhandenen Familienakten-Kern." : "Mindestens eine verpflichtende Assistenz- oder Korrespondenzprüfung ist fehlgeschlagen.",
        details: assistantReady ? [
          "Vorgänge, Dokumentfreigaben, Relationen, Suche, Aufgaben und Fristen werden wiederverwendet; es entstand keine zweite Datenbank.",
          "Familienaktenwissen, aktuelle Recherche und Einschätzung werden sichtbar getrennt. Nicht eingerichtete Recherche wird nicht vorgetäuscht.",
          "Schreiben werden nur als Entwurf vorbereitet und erst nach ausdrücklicher Benutzerbestätigung gespeichert oder als versendet dokumentiert.",
          "Nicht assistenzfreigegebene und nicht ausdrücklich vorgangsbezogene Dokumente werden von der aktiven Auswertung ausgeschlossen.",
          ...assistantTests.map((test) => `${test.summary}`),
        ] : assistantTests.filter((test) => !test.passed).map((test) => test.summary),
      });

      const menuOptimizationTests = runMenuOptimizationSelfTests();
      const menuOptimizationReady = menuOptimizationTests.length === 18
        && menuOptimizationTests.every((test) => test.passed)
        && systemCheckManifest.completedCapabilities.includes("Optimierung aller Menüseiten und Unterseiten");
      addArea({
        id: "menuoptimization", label: "Menü- und Unterseiten", level: menuOptimizationReady ? "green" : "red",
        summary: menuOptimizationReady ? "Menü- und Unterseiten sind priorisiert, platzsparend und durchgehend interaktiv verknüpft." : "Mindestens eine Menüaktion oder Detailverknüpfung ist unvollständig.",
        details: menuOptimizationReady ? [
          "Wichtige Aktionen stehen vor ergänzenden Informationen; doppelte und funktionslose Elemente wurden vermieden.",
          "Dokumente, Personen, Objekte, Vorgänge, Fristen, Aufgaben, Verträge und Garantien führen mit vorhandenen Kennungen zu ihrem Ziel.",
          "Notwendige nicht interaktive Hinweise verwenden einheitliche weiße Info-Felder mit dunkelblauer Schrift.",
          "Gesundheitsdetails bleiben geschützt; bestehende Daten, Kennungen und die gemeinsame Suchlogik wurden nicht verändert.",
          "Die ausdrücklich freigegebene Startseitenänderung wird durch einen neuen Referenz-Hash geschützt.",
          `${menuOptimizationTests.length} von ${menuOptimizationTests.length} Interaktivitäts-Praxistests bestanden.`,
        ] : menuOptimizationTests.filter((test) => !test.passed).map((test) => `${test.label}: ${test.summary}`),
      });

      const currentRelease = versionHistory[0];
      const releaseTargets = currentRelease?.regressionTargets || [];
      const plannedCheckLabels = new Set([...areas.map((area) => area.label), "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"]);
      const coveredTargets = releaseTargets.every((target) => plannedCheckLabels.has(target));
      const changelogReady = currentRelease?.version === APP_VERSION && !!currentRelease.newItems.length && !!currentRelease.improved.length && coveredTargets;
      addArea({
        id: "changelog", label: "Version und Changelog", level: changelogReady ? "green" : "red",
        summary: changelogReady ? "Versionsnummer, letzte Änderung und betroffene Prüfbereiche passen zusammen." : "Version, Changelog oder Prüfziele sind nicht vollständig aufeinander abgestimmt.",
        details: [
          `Aktuelle Version: ${APP_VERSION}; letzter Changelog-Eintrag: ${currentRelease?.version || "fehlt"}.`,
          mode === "changes" ? `Änderungsfokus geprüft: ${releaseTargets.join(", ") || "nicht dokumentiert"}.` : "Vollständige Systemprüfung anhand des aktuellen Changelogs ausgeführt.",
          coveredTargets ? "Alle im Changelog genannten betroffenen Bereiche sind im Prüflauf enthalten." : "Mindestens ein betroffener Bereich fehlt im Prüflauf.",
        ],
      });

      const helpReady = HELP_CONTENT_VERSION === APP_VERSION && visibleSystemCheck && systemCheckManifest.developmentRule.length === 7;
      addArea({
        id: "help", label: "Hilfe", level: helpReady ? "green" : "red",
        summary: helpReady ? "Hilfebereich, Systemprüfungs-Erklärung und Entwicklungsregel sind aktuell." : "Der Hilfebereich wurde für diese Version nicht vollständig aktualisiert.",
        details: helpReady ? ["Die Systemprüfung ist als eigener Hilfe-Einstieg vorhanden.", "Die dauerhafte Reihenfolge von Entwicklung bis Freigabe ist dokumentiert."] : [`Hilfe-Version: ${HELP_CONTENT_VERSION}; Anwendungs-Version: ${APP_VERSION}.`],
      });

      const reminderSelfTest = runFamilyReminderSelfTest();
      const reminderTest = { id: "reminders" as const, label: "Aktive Fristen und Erinnerungen", status: reminderSelfTest.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: reminderSelfTest.summary };
      addArea({
        id: "reminders", label: "Erinnerungen und Fristen", level: reminderSelfTest.passed ? "green" : "red",
        summary: reminderSelfTest.passed ? "Aktive Fristen, Aufgaben und Erinnerungen sind umgesetzt und praktisch getestet." : "Der praktische Fristen- und Erinnerungstest ist fehlgeschlagen.",
        details: reminderSelfTest.passed ? ["Offene, bald fällige und überfällige Einträge werden unterschieden.", "Erledigte und zurückgestellte Punkte erscheinen nicht mehr unter den offenen Punkten.", "Quellen und Verknüpfungen zu Dokumenten, Vorgängen, Objekten und Personen bleiben erhalten.", "Anlage und Statusänderungen benötigen einen Benutzerbefehl und werden protokolliert."] : [reminderSelfTest.summary],
      });

      let reportStorageReady = true;
      try {
        const probeKey = `${SYSTEM_CHECK_REPORTS_KEY}-probe`;
        workspaceStorage.setItem(probeKey, "bereit");
        workspaceStorage.removeItem(probeKey);
      } catch { reportStorageReady = false; }
      addArea({
        id: "reports", label: "Prüfberichte", level: reportStorageReady ? "green" : "red",
        summary: reportStorageReady ? "Prüf- und Reparaturberichte können lokal gespeichert und chronologisch angezeigt werden." : "Der lokale Speicher für Prüfberichte ist nicht verfügbar.",
        details: reportStorageReady ? [`${reports.length} bisherige${reports.length === 1 ? "r Bericht" : " Berichte"} im Browser erreichbar.`, "Die neuesten Berichte werden zuerst angezeigt; Gesundheitsinhalte werden nicht in Prüfberichte kopiert."] : ["Bitte lokalen Browser-Speicher freigeben. Persönliche Unterlagen wurden nicht verändert."],
      });

      const repairReady = systemCheckManifest.safeRepairScopes.length > 0 && systemCheckManifest.allowedAutomaticRepairs.length === 4 && systemCheckManifest.protectedScopes.length >= 6 && systemCheckManifest.confirmationRequiredActions.length >= 9 && systemCheckManifest.maxAutomaticRepairAttempts === 2;
      addArea({
        id: "repair", label: "Automatische Reparatur", level: repairReady ? "green" : "red",
        summary: repairReady ? "Der Reparaturrahmen ist auf sichere Prüf- und Berichtsdaten begrenzt." : "Die Sicherheitsgrenzen für automatische Reparaturen sind unvollständig.",
        details: repairReady ? ["Vor jedem Reparaturlauf wird der vorherige Prüfzustand gesichert.", "Nutzerdaten, Gesundheitsdaten, Dokumente, Beziehungen, Dateien und Tresoreinstellungen bleiben geschützt.", `Höchstens ${systemCheckManifest.maxAutomaticRepairAttempts} automatische Reparaturversuche; ohne Verbesserung wird beendet.`] : ["Automatische Reparatur bleibt gesperrt, bis die Schutzregeln vollständig sind."],
      });

      const consolidatedTypes = ["Person", "Organisation", "Objekt", "Vorgang", "Dokument", "Frist", "Aufgabe", "Erinnerung", "Ereignis", "Zahlung / Kosten", "Vertrag", "Garantie"];
      const consolidationReady = systemCheckManifest.leadingSystem === "Me, Myself and I – Meine Familienakte"
        && consolidatedTypes.every((item) => systemCheckManifest.consolidatedComponents.includes(item))
        && systemCheckManifest.integrationPrinciple.includes("nicht als zweites System")
        && systemCheckManifest.completedCapabilities.includes("Familienakte Zuordnungslogik v1")
        && systemCheckManifest.completedCapabilities.includes("Vollständiger Aktenexport")
        && systemCheckManifest.completedCapabilities.includes("Aktive Fristen und Erinnerungen")
        && systemCheckManifest.completedCapabilities.includes("Interaktive Monatsübersicht Was gibt’s Neues?")
        && systemCheckManifest.completedCapabilities.includes("Interaktives Cockpit v1")
        && systemCheckManifest.interactiveCockpitIntegrated === true
        && systemCheckManifest.pausedCapabilities.includes("OneDrive-Automatik")
        && systemCheckManifest.pausedCapabilities.includes("automatische Dateiverschiebung")
        && systemCheckManifest.preMergeAudit.length === 5;
      addArea({
        id: "consolidation", label: "Konsolidierter Entwicklungsstand", level: consolidationReady ? "green" : "red",
        summary: consolidationReady ? "Die bestehende Familienakte ist als führendes System festgeschrieben; parallele Strukturen und vorzeitige Automatiken sind gesperrt." : "Der gemeinsame Entwicklungsstand oder seine Integrationsgrenzen sind unvollständig.",
        details: consolidationReady ? ["Die bestehende Oberfläche, Navigation, Gesundheitsakte, Hilfe und Funktionen bleiben führend.", "Die Zuordnungslogik v1 ist modular in die bestehende Familienakte eingebunden, nicht als zweites Cockpit.", "OneDrive-Automatik und automatische Dateiverschiebung bleiben ausgeschaltet.", "Vor einer späteren Erweiterung bleibt die Bestands- und Dublettenprüfung verpflichtend."] : ["Bitte Führungs-, Pausen- und Bestandsprüfungsregeln vervollständigen."],
      });

      const implementedIds = new Set([...areas.map((area) => area.id), "systemcheck"]);
      const missingChecks = systemCheckManifest.requiredAreaIds.filter((id) => !implementedIds.has(id as SystemCheckArea["id"]));
      const systemCheckReady = !missingChecks.length && systemCheckManifest.developmentRule.length === 7 && systemCheckManifest.releaseGate.includes("Keine kritischen Fehler");
      addArea({
        id: "systemcheck", label: "Systemprüfung", level: systemCheckReady ? "green" : "red",
        summary: systemCheckReady ? "Der dauerhafte Prüfkatalog und die Freigaberegel sind vollständig eingebunden." : "Der dauerhafte Prüfkatalog ist unvollständig.",
        details: systemCheckReady ? [`${systemCheckManifest.requiredAreaIds.length} verpflichtende Prüfpunkte sind registriert.`, "Neue Funktionen müssen den Prüfkatalog erweitern; bestehende Prüfpunkte bleiben erhalten.", `Freigaberegel: ${systemCheckManifest.releaseGate}.`] : [`Fehlende Prüfpunkte: ${missingChecks.join(", ") || "Entwicklungs- oder Freigaberegel"}.`],
      });

      const overall = systemCheckOverall(areas);
      const releaseSummary = {
        websiteVersion: "40 · private Testfassung 2.28.1",
        sourceReference: "veröffentlichter Sites-Quellstand der Abschlussprüfung 2.28.1",
        analyzedFiles: local?.inventoryCount || 0,
        newFiles: local?.inventoryNewCount || 0,
        unchangedFiles: local?.inventoryUnchangedCount || 0,
        changedFiles: local?.inventoryChangedCount || 0,
        movedFiles: local?.inventoryMovedCount || 0,
        unavailableFiles: local?.inventoryUnavailableCount || 0,
        duplicateFiles: local?.inventoryDuplicateCount || 0,
        versionFiles: local?.inventoryVersionCount || 0,
        recommendedFiles: local?.inventoryRecommendedCount || 0,
        reviewFiles: local?.inventoryReviewCount || 0,
        archivedFiles: local?.archivedInventoryCount || 0,
        assistantReleasedFiles: local?.assistantReleasedInventoryCount || 0,
        learningStatus: practicalLearningComplete ? "bestanden" as const : "offen" as const,
        previewStatus: inventoryPreviewTests.every((test) => test.passed) && inventoryTextDecodingTests.every((test) => test.passed) ? "bestanden" as const : "offen" as const,
        relationStatus: local?.integrityLevel === "green" && assignmentReady ? "bestanden" as const : "offen" as const,
        privacyStatus: healthReady && inventoryPreviewTests.every((test) => test.passed) ? "bestanden" as const : "offen" as const,
        originalProtection: fawogaOneDriveTechnicalReady ? "bestanden" as const : "offen" as const,
        buildStatus: areas.every((area) => area.level !== "red") ? "bestanden" as const : "offen" as const,
      };
      return {
        id: newSystemReportId("check"), version: APP_VERSION, checkedAt: new Date().toISOString(), mode, kind: "check",
        overall, areas, repairs: [],
        greenPoints: areas.filter((area) => area.level === "green").map((area) => ({ areaId: area.id, areaLabel: area.label, summary: area.summary })),
        testCases: [...assignmentTests, exportTest, reminderTest, newsTest, ...cockpitTests, ...searchTests, documentLibraryTest, ...menuOptimizationTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...documentIntakeTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...centralIntakeTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...fawogaInventoryTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...fawogaOneDriveTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...fawogaLearningTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...inventoryPreviewTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...inventoryTextDecodingTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...documentScanTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...memoryTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...contextLinkingTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary })), ...consolidationTests.map((test) => ({ id: test.id as SystemCheckReport["testCases"][number]["id"], label: test.label, status: test.passed ? "bestanden" as const : "fehlgeschlagen" as const, summary: test.summary }))],
        openProblems: buildSystemProblems(areas),
        releaseStatus: overall === "green" ? "freigegeben" : overall === "yellow" ? "prüfung_empfohlen" : "nicht_freigegeben",
        releaseSummary,
      };
  };

  // Der begrenzte Reparaturlauf wird absichtlich nur über Ereignisse und nicht als Render-Abhängigkeit ausgeführt.
   
  const runRepair = async (source: SystemCheckReport, automatic: boolean, attempt = 1): Promise<void> => {
    setRunning("repair"); setRunError("");
    const startedAt = new Date().toISOString();
    try {
      createSystemCheckBackup(source);
      const problems = source.openProblems.length ? source.openProblems : buildSystemProblems(source.areas);
      const totalSteps = Math.max(1, problems.length + 2);
      setRepairProgress({ percent: 5, area: "Prüfzustand sichern", attempt });
      await new Promise((resolve) => window.setTimeout(resolve, 100));

      for (let index = 0; index < problems.length; index++) {
        const problem = problems[index];
        setRepairProgress({ percent: Math.round(((index + 1) / totalSteps) * 75), area: problem.areaLabel, attempt });
        await new Promise((resolve) => window.setTimeout(resolve, 90));
      }

      const repairedSource: SystemCheckReport = { ...source, openProblems: buildSystemProblems(source.areas) };
      workspaceStorage.setItem(SYSTEM_CHECK_STORAGE_KEY, JSON.stringify(repairedSource satisfies StoredSystemCheck));
      const repairs = ["Prüfstatus und Verknüpfung zum neuesten Prüfbericht sicher neu aufgebaut."];
      setRepairProgress({ percent: 84, area: "Vollständige Kontrollprüfung", attempt });
      setRunning("verification");
      const verification = await evaluateSystem("full");
      const levelWeight: Record<SystemCheckLevel, number> = { green: 0, yellow: 1, red: 2 };
      const improved = levelWeight[verification.overall] < levelWeight[source.overall] || verification.openProblems.length < problems.length;
      const repairReport: SystemCheckReport = {
        id: newSystemReportId("repair"), version: APP_VERSION, checkedAt: startedAt, mode: "full", kind: "repair",
        overall: verification.overall, areas: source.areas, repairs,
        greenPoints: verification.greenPoints, testCases: verification.testCases, openProblems: verification.openProblems, releaseStatus: verification.releaseStatus,
        sourceReportId: source.id, automatic, attempt, improved, backupCreated: true,
        releaseSummary: verification.releaseSummary,
      };
      saveSystemCheckReport(repairReport, false);
      const updatedReports = saveSystemCheckReport(verification, true);
      setReports(updatedReports); setReport(verification); onCompleted(verification);
      setRepairProgress({ percent: 100, area: "Kontrollprüfung abgeschlossen", attempt });

      if (verification.overall === "red" && improved && attempt < systemCheckManifest.maxAutomaticRepairAttempts) {
        await runRepair(verification, true, attempt + 1);
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Der sichere Reparaturdurchlauf konnte nicht abgeschlossen werden.");
    } finally {
      setRepairProgress(null); setRunning(null);
    }
  };

   
  const runCheck = async (mode: "full" | "changes") => {
    setRunning(mode); setRunError("");
    try {
      const checked = await evaluateSystem(mode);
      const updatedReports = saveSystemCheckReport(checked, true);
      setReports(updatedReports); setReport(checked); onCompleted(checked);
      if (checked.overall !== "green") await runRepair(checked, true, 1);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Die Systemprüfung konnte nicht gestartet werden.");
    } finally { setRunning(null); }
  };

  return <>
    <PageTitle icon={<ShieldCheck/>} title="Systemprüfung" text="Prüfstatus, Freigabe und gespeicherte Berichte."/>
    <Suspense fallback={null}>    <PracticalAcceptance reports={reports} onSave={saveUserAcceptance} websiteVersion="40" familyVersion={APP_VERSION}/></Suspense>
    <section className="system-check-facts" aria-label="Stand der Systemprüfung">
      <article className="card"><small>Aktuelle Version</small><strong>{APP_VERSION}</strong></article>
      <article className="card"><small>Letzte Systemprüfung</small><strong>{lastCheck ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastCheck.checkedAt)) : "Noch nicht durchgeführt"}</strong></article>
      <article className="card"><small>Gespeicherte Prüfberichte</small><strong>{reports.length}</strong></article>
    </section>
    <section className="system-check-control-grid">
      <article className="card system-check-control-card">
        <div className="system-check-card-title"><div><span className="badge success">Version 2.28.1</span><h2>Vollständige Freigabeprüfung</h2></div><InfoPopover label="Freigabeprüfung erklären" text="Prüft den vorhandenen Testbestand, Vorschau, Zuordnungen, Lernfunktion, Dubletten, Archivierung, Assistenzfreigabe, Suche, Datenschutz und die technischen Regressionstests. Persönliche Originaldateien werden dabei nicht verändert."/></div>
        <div className="system-check-button-row">
          <button className="button primary" disabled={!!running} onClick={() => runCheck("full")}><ShieldCheck size={17}/>{running === "full" ? "Prüfung läuft …" : "Abschlussprüfung 2.28.1 starten"}</button>
          <button className="button primary" disabled={!!running} onClick={() => runCheck("changes")}><History size={17}/>{running === "changes" ? "Prüfung läuft …" : "Änderungen prüfen"}</button>
          <details className="final-test-scope"><summary>Prüfumfang anzeigen</summary><ol><li>Bestehenden Testbestand verwenden</li><li>Bestandsabgleich einschließlich Unterordner</li><li>Dokumentvorschau und Original öffnen</li><li>Vollständige bestätigte Zuordnung</li><li>Lernfähige Vorschläge</li><li>Sammelprüfung</li><li>Dubletten und Versionen</li><li>Kontrollierte Archivierung</li><li>Assistenzfreigabe</li><li>Suche und Zusammenhänge</li><li>Unterbrechung und Fortsetzung</li><li>Erneuter inkrementeller Abgleich</li><li>Datenschutz und Originalschutz</li><li>System- und Regressionstests</li><li>Gespeicherter Abschlussbericht</li></ol></details>
        </div>
      </article>
      <article className="card system-check-control-card system-check-safety-card">
        <div className="system-check-card-title"><div><span className="system-check-card-icon"><LockKeyhole size={21}/></span><h2>Feste Sicherheitsregeln</h2></div><InfoPopover label="Sicherheitsregeln erklären" text="Automatische Reparaturen sind nur bei lokalen Prüf- und Berichtsdaten zulässig. Persönliche Daten, Gesundheitsdaten, Dokumente, Dateien, Verknüpfungen und Tresoreinstellungen werden nicht automatisch verändert."/></div>
        <span className="badge success">Schutzregeln aktiv</span>
      </article>
    </section>
    {repairProgress && <section className="card repair-progress" aria-live="polite"><div><RefreshCw className="spin" size={22}/><span><strong>Reparaturdurchlauf {repairProgress.attempt}</strong><small>Aktueller Bereich: {repairProgress.area}</small></span><b>{repairProgress.percent}%</b></div><progress max="100" value={repairProgress.percent}>{repairProgress.percent}%</progress></section>}
    {runError && <section className="card check-error"><strong>Systemprüfung nicht abgeschlossen</strong><p>{runError}</p><p>Persönliche Unterlagen und Nutzerdaten wurden nicht verändert.</p></section>}
    {report && <>
      <section className="system-check-result-grid">
        <article className={`card system-check-result-card level-${report.overall}`}><div className="system-check-card-title"><div><span className="eyebrow dark">Gesamtergebnis</span><h2>{levelSymbol[report.overall]} {systemCheckOverallLabel[report.overall]}</h2></div><InfoPopover label="Gesamtergebnis erklären" text={`Geprüft am ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.checkedAt))}. Grün bedeutet vollständig bestanden, Gelb bedeutet Prüfung empfohlen und Rot bedeutet nicht freigegeben. Interaktives Cockpit v1 erfolgreich integriert: JA.`}/></div><strong className="release-decision">VERSION 2.28.1 FÜR PRODUKTIVÜBERNAHME FREIGEGEBEN: {report.overall === "green" ? "JA" : "NEIN"}</strong></article>
        <article className="card system-findings"><div className="system-check-card-title"><div><h2>Warnungen und Fehler</h2><span className={`badge check-${report.openProblems.length ? report.overall : "green"}`}>{report.openProblems.length ? `${report.openProblems.length} offen` : "Keine offenen Punkte"}</span></div><InfoPopover label="Warnungen und Fehler erklären" text="Hier erscheinen ausschließlich offene Abweichungen mit Ursache und nächstem Schritt. Ist die Karte grün, bestehen im aktuellen Prüfbericht keine offenen Warnungen oder Fehler."/></div>{report.overall !== "green" && <button className="button primary system-check-repair-button" disabled={!!running} onClick={() => runRepair(report, false, 1)}><RefreshCw size={17}/> Systemprüfung reparieren</button>}{report.openProblems.length ? <ul>{report.openProblems.map((problem) => <li key={`${problem.areaId}-${problem.summary}`}><span>{levelSymbol[problem.level]}</span><div><strong>{problem.areaLabel}</strong><small>{problem.summary}</small><em>Ursache: {problem.cause}</em><em>Nächster Schritt: {problem.nextStep}</em></div></li>)}</ul> : <div className="system-check-clear"><CheckCircle2 size={24}/><strong>Keine Warnungen oder Fehler</strong></div>}</article>
      </section>
      <section className="check-area-section"><div className="system-check-section-heading"><h2>Geprüfte Bereiche</h2><InfoPopover label="Geprüfte Bereiche erklären" text="Jede Karte steht für einen geprüften Funktionsbereich. Das Fragezeichen in der jeweiligen Karte zeigt Zusammenfassung und Einzelheiten, ohne die Übersicht dauerhaft zu verlängern."/></div><div className="check-area-grid">{report.areas.map((area) => <article className={`card check-area level-${area.level}`} key={area.id}><div className="check-area-head"><span className="check-symbol" aria-hidden="true">{levelSymbol[area.level]}</span><div><h3>{area.label}</h3><span className={`badge check-${area.level}`}>{systemCheckLevelLabel[area.level]}</span></div><InfoPopover label={`${area.label} erklären`} text={`${area.summary} ${area.details.join(" ")}`}/></div></article>)}</div></section>
    </>}
      <section className="card check-reports" id="pruefberichte"><div className="system-check-card-title"><div><span className="eyebrow dark">Prüfberichte</span><h2>Gespeicherte Ergebnisse</h2></div><div className="system-check-title-actions"><span className="version-badge">{reports.length} Bericht{reports.length === 1 ? "" : "e"}</span><InfoPopover label="Prüfberichte erklären" text="Frühere Prüf- und Reparaturberichte bleiben erhalten. Der neueste Bericht steht oben und kann bei Bedarf aufgeklappt werden."/></div></div>{reports.length ? <div className="check-report-list">{reports.map((item) => item.kind === "acceptance" ? <StoredUserAcceptance key={item.id} report={item}/> : <details key={item.id}><summary><span>{levelSymbol[item.overall]}</span><div><strong>{item.kind === "repair" ? `Reparaturdurchlauf ${item.attempt || 1}` : item.mode === "changes" ? "Änderungsprüfung" : "Vollständige Systemprüfung"}</strong><small>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.checkedAt))} · Version {item.version}</small></div><span className={`badge check-${item.overall}`}>{systemCheckLevelLabel[item.overall]}</span></summary><div className="check-report-body"><p><strong>Prüf-ID:</strong> {item.id}</p><p><strong>Gesamtergebnis:</strong> {systemCheckOverallLabel[item.overall]}</p><p><strong>Freigabestatus:</strong> {item.releaseStatus === "freigegeben" ? "Freigegeben" : item.releaseStatus === "prüfung_empfohlen" ? "Prüfung empfohlen" : "Nicht freigegeben"}</p>{item.releaseSummary && <><p><strong>Website-Version:</strong> {item.releaseSummary.websiteVersion}</p><p><strong>Quellstand:</strong> {item.releaseSummary.sourceReference}</p><p><strong>Bestand:</strong> {item.releaseSummary.analyzedFiles} analysiert · {item.releaseSummary.newFiles} neu · {item.releaseSummary.unchangedFiles} unverändert · {item.releaseSummary.changedFiles} geändert · {item.releaseSummary.movedFiles} verschoben · {item.releaseSummary.unavailableFiles} nicht erreichbar</p><p><strong>Bewertung:</strong> {item.releaseSummary.recommendedFiles} empfohlen · {item.releaseSummary.reviewFiles} noch zu prüfen · {item.releaseSummary.duplicateFiles} Dubletten · {item.releaseSummary.versionFiles} Versionen</p><p><strong>Freigaben:</strong> {item.releaseSummary.archivedFiles} archiviert · {item.releaseSummary.assistantReleasedFiles} assistenzfreigegeben</p><p><strong>Funktionsstatus:</strong> Lernfunktion {item.releaseSummary.learningStatus} · Vorschau {item.releaseSummary.previewStatus} · Relationen {item.releaseSummary.relationStatus} · Datenschutz {item.releaseSummary.privacyStatus} · Originalschutz {item.releaseSummary.originalProtection} · Build {item.releaseSummary.buildStatus}</p></>}<p><strong>Geprüfte Bereiche:</strong> {item.areas.map((area) => area.label).join(", ")}</p><p><strong>Grüne Prüfpunkte:</strong> {item.greenPoints.length ? item.greenPoints.map((point) => point.areaLabel).join(", ") : "Keine."}</p><p><strong>Praktische Testfälle:</strong> {item.testCases.length ? item.testCases.map((test) => `${test.label}: ${test.status}`).join(" · ") : "In diesem älteren Bericht noch nicht enthalten."}</p><p><strong>Warnungen und Fehler:</strong> {item.openProblems.length ? item.openProblems.map((problem) => `${problem.areaLabel}: ${problem.summary}`).join(" · ") : "Keine."}</p><p><strong>Durchgeführte Reparaturen:</strong> {item.repairs.length ? item.repairs.join(" · ") : "Keine Reparatur in diesem Lauf."}</p><p><strong>Weiterhin offen:</strong> {item.openProblems.length ? item.openProblems.map((problem) => `${problem.areaLabel} – ${problem.nextStep}`).join(" · ") : "Keine offenen Punkte."}</p><p><strong>VERSION 2.28.1 FÜR PRODUKTIVÜBERNAHME FREIGEGEBEN:</strong> {item.overall === "green" ? "JA" : "NEIN"}</p>{item.kind === "repair" && <p><strong>Sicherung:</strong> {item.backupCreated ? "Prüfzustand wurde vor der Reparatur gesichert." : "Keine Sicherung vermerkt."} {item.improved === false ? "Ohne messbare Verbesserung wurde die automatische Wiederholung beendet." : item.improved ? "Die anschließende Prüfung bestätigte eine Verbesserung." : ""}</p>}</div></details>)}</div> : <div className="empty-state"><FileClock size={30}/><strong>Noch keine Prüfberichte</strong></div>}</section>
  </>;
}

type VersionEntry = {
  version: string;
  date: string;
  label: string;
  newItems: string[];
  improved: string[];
  note: string;
  helpUpdated?: boolean;
  regressionTargets?: string[];
};

const versionHistory: VersionEntry[] = [
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 40 – interaktive Benutzerabnahme in fünf Klicktests", newItems: ["Drei praktische Prüfblöcke mit jeweils fünf Fragen und Ja / Nein / Nicht geprüft", "Gemeinsames Absenden, Fehlerbeobachtungen sowie Unterbrechen und Wiederaufnahme"], improved: ["Vorhandener Prüfbericht-Speicher wird wiederverwendet; keine zweite Testdatenbank", "Bestandene Benutzerprüfungen bleiben erledigt, fehlgeschlagene und nicht geprüfte Tests können einzeln wiederholt werden", "Ergebnisse und frühere Fehlversuche bleiben mit Datum, Website- und Familienakten-Version nachvollziehbar"], note: "Ausschließlich private Testversion. Antworten werden im Browser gespeichert; keine automatische Übertragung auf andere Geräte. Benutzerantworten verändern weder technische Prüfnachweise noch Dokumente, Register oder Produktivversion. Keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Prüfberichte", "Systemprüfung", "Hilfe", "Version und Changelog"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 39 – gemeinsames UI-, Hilfe- und Spracheingabesystem", newItems: [], improved: ["Gemeinsame Eingabefelder mit vorhandener Browser-Spracheingabe, sichtbarem Mikrofonstatus und Tastatur-Fallback", "Pastellblaue Überschriftenhierarchie, kompakte Karten und einheitliche Bedienelemente", "Bestehende Hilfen zentral wiederverwendet; Assistenzwege mit getrennten Fragezeichen"], note: "Nur private Testfassung. Zwei Aktivitätszeilen und Copy bleiben erhalten. Datenmodelle, Originaldateien und Praxistestnachweise bleiben unverändert. Reale Windows-, Android-/Fold- und Mikrofontests stehen noch aus; keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Suche", "Hilfe", "Version und Changelog"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 38 – dezente pastellblaue Überschriften", newItems: [], improved: ["Gelbliche Hinterlegung der appweiten Überschriften und Bestands-Bereichsüberschriften durch leichtes Pastellblau mit passendem dezentem Rahmen ersetzt"], note: "Ausschließlich Darstellung in der privaten Testfassung. Status-, Warn- und Fehlerfarben, Funktionen, Daten und Produktivversion bleiben unverändert. Keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Version und Changelog"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 37 – globale Aktivitätszeilen und harmonisierte Überschriften", newItems: ["Zwei globale, über Menüwechsel erhaltene UI-Aktivitätszeilen direkt unter dem Suchfeld", "Unabhängige Copy-Schaltfläche je Zeile mit kurzer Kopiert-Rückmeldung"], improved: ["Bestehende zentrale Rückmeldungen und lokale Dialogfehler speisen denselben auf zwei Ergebnisse begrenzten UI-Zwischenspeicher", "Erfolg, Fehler und offene Zustände sind zusätzlich zur Farbe im Text erkennbar", "Bestandslauf, Zuordnung, Archivierung und Assistenzfreigabe zeigen tatsächliche Ergebniszahlen", "Appweite abgestufte blaue Überschriften auf dezent gelblichem Hintergrund", "Ansehen kompakt direkt unter dem Dokumentstatus"], note: "Nur private Testfassung. Keine zweite Ereignisverwaltung, keine Registeränderung und keine Änderung der Fach-, Lern-, Archiv- oder Speicherlogik. Aktivitätszeilen werden nicht dauerhaft gespeichert. Bestehende Praxistestnachweise und Produktivversion bleiben unverändert. Die lokale Windows-Wiederherstellung bleibt bis zum tatsächlichen Praxistest offen. Keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Dokumente", "FaWoGa-OneDrive-Integration und intelligente Bestandszuordnung", "Zentrale Eingangszentrale und gemeinsame Inhaltsanalyse", "Systemprüfung"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 36 – Status- und Metadatenkorrektur der Systemprüfung", newItems: ["Keine neue Funktion; vorhandene technische und praktische Nachweise werden jetzt aus ihren bestehenden Datenquellen korrekt ausgewertet"], improved: ["Technische Testreihen werden nicht mehr mit veralteten festen Sollzahlen verglichen", "Abgeschlossene lokale und OneDrive-Bestandsläufe werden gleichermaßen als gültige inkrementelle Prüfungen berücksichtigt", "FaWoGa-Hinweise nennen nur noch die tatsächlich offenen Teilnachweise", "Eingangszentrale und Webseite-bearbeiten-Verweis verwenden den aktuellen Stand 2.28.1"], note: "Nur private Testfassung. Keine Testdaten wurden verändert, keine Praxistests künstlich erzeugt und keine Produktivfreigabe vorgenommen.", helpUpdated: true, regressionTargets: ["FaWoGa-OneDrive-Integration und intelligente Bestandszuordnung", "Zentrale Eingangszentrale und gemeinsame Inhaltsanalyse", "Version und Changelog", "Systemprüfung"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 35 – Assistenz- und Korrespondenzzentrale", newItems: ["Eigener Hauptbereich Assistenz für Fragen, Beratung, Schreiben, Terminvorbereitung und vorhandene Vorgänge", "Dreigeteilte Antwortgrundlage: Familienakte, aktuelle Recherche sowie Einschätzung und Vorschlag", "Bestätigungspflichtige Korrespondenz mit Entwurf, Versandbereit und Als versendet speichern", "Fünf automatisierte Assistenz-Kernprüfungen für Rente, Reparatur, Arzttermin, Arbeitgeber und Datenschutzgrenzen"], improved: ["Vorhandene Vorgänge, Dokumentfreigaben, Relationen, Suche, Aufgaben und Fristen werden wiederverwendet", "Das Cockpit öffnet die Assistenz direkt mit dem ausgewählten Vorgang", "Nur assistenzfreigegebene oder ausdrücklich vorgangsbezogene Dokumente werden aktiv ausgewertet", "Nicht eingerichtete aktuelle Recherche wird deutlich als offen angezeigt und niemals vorgetäuscht", "Gespeicherte Korrespondenz bleibt ein Ereignisdatensatz im gemeinsamen Familienaktenregister"], note: "Nur private Testfassung. Keine zweite Datenbank, keine zweite Suche, kein automatischer Versand, keine externe KI- oder Recherche-API und keine Produktivfreigabe. Die lokale Windows-Wiederherstellung bleibt bis zum praktischen Nachweis offen.", helpUpdated: true, regressionTargets: ["Assistenz- und Korrespondenzzentrale", "Interaktives Cockpit", "Verknüpfungen", "Dokumente", "Suche", "Gesundheitsakte", "Hilfe", "Systemprüfung"] },
    { version: "2.28.1", date: "15.10.2026", label: "Website-Version 34 – harmonische Systemprüfung", newItems: ["Symmetrische Kartenstruktur für Freigabeprüfung, Sicherheitsregeln, Gesamtergebnis sowie Warnungen und Fehler", "Eigenständige Fragezeichen-Hilfen für Prüfaktionen, Sicherheitsregeln, Ergebnisse, Prüfbereiche und Prüfberichte"], improved: ["Doppelte Anzeige von ‚Prüfung empfohlen‘ entfernt; das Gesamtergebnis erscheint nur noch einmal", "Lange Erklärungen der Prüfbereiche aus der Daueransicht entfernt und in die jeweiligen Hilfen verlagert", "Alle Hauptaktionen der Freigabeprüfung stehen in einer Linie, besitzen gleiche Höhe und eine einheitliche dunkelblaue Gestaltung", "Geprüfte Bereiche werden als kompakte, gleichmäßige Statuskarten mit fetten Überschriften dargestellt", "Prüfberichte bleiben vollständig erhalten, sind aber zunächst platzsparend geschlossen"], note: "Nur private Testfassung. Reine Überarbeitung der Systemprüfungsoberfläche; Prüfwerte, Freigabelogik, Fehlerstatus, Reparaturablauf und gespeicherte Berichte bleiben unverändert. Keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Systemprüfung", "Prüfberichte", "Automatische Reparatur", "Kritische Fehlersperre", "Responsive Bedienung"] },
    { version: "2.28.1", date: "14.10.2026", label: "Website-Version 33 – vollständige optische und bedienungsbezogene Optimierung", newItems: ["Koordiniertes Gestaltungssystem für Typografie, Hauptaktionen, Hilfen, Status- und Fehleranzeigen", "Kompakte Drei-Karten-Anordnung für Quelle, Analyse und Archiv unter der Testakten-Verwaltung", "Dreiteilige Tresor-Verbindung sowie getrennte Sicherungs- und Exportkarten im Sicherheitscenter"], improved: ["Startseitensuche ist bei unveränderter Höhe deutlich ovaler", "Schnellzugriffe zeigen kurze Statusangaben und öffnen ausführliche Erklärungen nur über eigenständige Info-Schaltflächen", "Dokumenteneingang verwendet kompakte Karten und klar erkennbare dunkelblaue Hauptaktionen", "Windows-Dateisystem-Diagnose bleibt direkt unter Quelle, Analyse und Archiv sichtbar", "Kritische Fehlersperren, Statusfarben und sämtliche vorhandenen Speicher- und Registerfunktionen bleiben erhalten", "Systemprüfung und Dokumentvorschau sind kompakter und klarer bedienbar", "Desktop-, Tablet- und Smartphone-Layouts vermeiden abgeschnittene Schaltflächen und unnötige waagerechte Scrollbereiche"], note: "Nur private Testfassung. Reine Darstellung und Bedienbarkeit; keine Datenmigration, keine neue Speicher-, Register-, Such-, Aufgaben-, Fristen- oder Synchronisierungslogik. Die lokale Windows-Wiederherstellung gilt weiterhin erst nach dem praktischen Windows-Test als nachgewiesen. Keine Produktivfreigabe.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Dokumenteneingang", "FaWoGa-Bestandsanalyse und Archivintegrität", "Windows-Dateisystem-Diagnose", "Sicherheit und lokaler Tresor", "Dokumentvorschau", "Systemprüfung", "Datenschutz"] },
    { version: "2.28.1", date: "14.10.2026", label: "Website-Version 32 – Windows-Pfadlängenprüfung", newItems: ["Siebenphasige Windows-Dateisystem-Diagnose mit kontrolliertem Kurz-/Langpfadvergleich", "Vollständiger Windows-Zielpfad und Zeichenanzahl vor jedem kritischen Registerschreiben", "Protokollierung von Dateihandle, Schreibstrom, Schreiben und Schließen als getrennte Operationen"], improved: ["Interner automatischer Wiederherstellungsordner wurde von 04_Wiederherstellung auf 04_R verkürzt", "Kurze Wiederherstellungsnamen und kurze temporäre Registernamen senken den bekannten Testpfad von 293 auf ungefähr 202 Zeichen", "Der vollständige Sicherungs- und Wiederherstellungstest verwendet den verkürzten Pfad, ohne den festgelegten Hauptordner zu verändern", "Ein absichtlich langer Vergleichspfad darf die Diagnose bestätigen, ohne eine erfolgreich verkürzte Pflichtprüfung fälschlich zu sperren"], note: "Nur private Testfassung. Die Pfadlänge gilt erst nach dem kontrollierten Kurz-/Langpfadvergleich auf dem Windows-PC als lokal bestätigt. Das optische Gesamtpaket bleibt zurückgestellt. Keine Produktivfreigabe und keine Änderungen außerhalb der automatischen Testumgebung.", helpUpdated: true, regressionTargets: ["Automatische Testumgebung 2.28.1", "Windows-Dateisystem-Diagnose", "Sicherung und Wiederherstellung", "Registerintegrität", "Kritische Fehlersperre"] },
    { version: "2.28.1", date: "14.10.2026", label: "FaWoGa-OneDrive-Vollintegration und intelligente Bestandszuordnung", newItems: ["Nachhaltiges OneDrive-Bestandsregister mit stabilen Datei-IDs und vollständiger Herkunft", "Inkrementelle Bestandsprüfung für neue, unveränderte, geänderte, verschobene und nicht erreichbare Dateien", "Pausierbare und fortsetzbare Analyse mit nachvollziehbarem Fortschritt", "Dokumentübergreifende Zuordnung zu Kategorien, persönlichen Lebensbereichen, Personen, Organisationen, Objekten und Vorgängen", "Unterscheidung von identischen Dubletten, ähnlichen Dateien und relevanten Versionen", "Sammelprüfung, kontrollierte Archivierung und getrennte Assistenzfreigabe", "Testakte für Weiterentwicklung mit wiederverwendbarer Ordnerfreigabe und lesender Strukturprüfung", "Fünfphasige Windows-Dateisystem-Diagnose mit dauerhaft kopierbarem Bericht"], improved: ["Bestehende FaWoGa-, Dokumenten-, Such-, Archiv-, Relations- und Datenschutzlogik wird wiederverwendet", "Unveränderte Dateien werden bei späteren Läufen nicht unnötig erneut vollständig analysiert", "Fotoserien, Rechnungs-, Vertrags- und Aktenzeichen sowie mögliche Aufgaben und Fristen werden als überprüfbare Hinweise vorbereitet", "Bestätigte persönliche Lebensbereiche werden bei neuen Vorschlägen berücksichtigt", "Bestätigte Kategorie- und Lebensbereichsentscheidungen dienen als Lernhilfe für ähnliche neue Dokumente", "Widersprüchliche Inhalte bleiben trotz bekannter Organisation zur Prüfung offen", "Dokumente können vor der Zuordnungsbestätigung datenschutzgerecht angesehen und direkt im Vorschaufenster zugeordnet werden", "Im Fenster Dokument ansehen sind Person, Organisation, Objekt, Vorgang, Kategorie, persönlicher Lebensbereich, Dokumentart und Stichworte jetzt vollständig bearbeitbar", "Neue Personen, Organisationen, Objekte und Vorgänge werden erst nach Bestätigung angelegt; gleichnamige vorhandene Datensätze werden wiederverwendet", "UTF-8, UTF-16 und Windows-1252 werden vor der Textvorschau geprüft; Binärdaten und falsch decodierte Zeichen werden ausgeblendet und zur manuellen Prüfung gekennzeichnet", "Eine gemeinsame Abschlussprüfung verwendet den vorhandenen Testbestand und erzeugt einen vollständigen Freigabebericht", "Vorhandene Testordner werden bevorzugt wiederverwendet; Register, Sicherungen, Prüfberichte, Versionsstände und mögliche Dubletten werden ohne Dateiveränderung erkannt", "Die automatische Testumgebung trennt Register-Commit und TEMP-Datei-Aufräumen; eine kurz gesperrte TEMP-Datei erzeugt keine falsche Speicherfehlermeldung mehr", "Sicherungsquelle und Wiederherstellungsziel werden für jeden Pflichtschritt neu aus ihren stabilen Elternordnern aufgelöst und vor dem Register-Commit durch eine Schreibprobe kontrolliert", "Bei kritischen Pflichtfehlern werden abhängige Aktionen sichtbar gesperrt; Navigation, Hilfe und beide getrennten Kopierberichte bleiben verfügbar", "Die Windows-Diagnose führt Zugriff, Zielordner, kleine Testdatei, temporäres Register sowie Sicherung und Wiederherstellung als unabhängige Phasen aus", "Ein fehlgeschlagener Einzelschritt beendet den Diagnosebericht nicht; Ergebnis, relativer Pfad und technische Ausnahme bleiben pro Phase erhalten", "Der Windows-Diagnosebericht wird im Browser zwischengespeichert und bleibt nach einem Neuladen kopierbar", "Allgemeiner technischer Fehlerbericht und Windows-Diagnosebericht sind eindeutig getrennt", "Eine Windows-Ursache wird nur als belegt bezeichnet, wenn sie im lokalen Diagnoselauf tatsächlich beobachtet wurde"], note: "2.28.1 ist eine getrennte private Testfassung. Website-Version 31 vervollständigt ausschließlich die Windows-Diagnose. Automatisierte Architektur- und Regressionstests sind bestanden; die tatsächliche Ursache des lokalen Windows-Schreibfehlers bleibt bis zum Diagnosebericht des Benutzer-PCs offen. Keine Produktivfreigabe, keine Dauerüberwachung, keine Veränderung von Originaldateien, keine zweite Datenbank und keine kostenpflichtige externe API.", helpUpdated: true, regressionTargets: ["FaWoGa-OneDrive-Integration und intelligente Bestandszuordnung", "FaWoGa-Bestandsanalyse und Archivintegrität", "Testakte für Weiterentwicklung", "Windows-Dateisystem-Diagnose", "Dokumente", "Dokumentenbibliothek", "Suche", "Vorgänge", "Datenschutz", "Systemprüfung"] },
    { version: "2.28.0", date: "12.10.2026", label: "Zentrale Eingangszentrale mit gemeinsamer Inhaltsanalyse", newItems: ["Eigener Bereich Eingangszentrale unter Dokumente", "Drag & Drop und Dateiauswahl für einzelne oder mehrere Dateien ohne vorherige Typauswahl", "Gemeinsame Warteschlange Eingänge prüfen mit Zurückstellen, Sammelvormerkung und kontrollierter Übernahme", "Dateityperkennung für PDF, Word, Fotos, Text, EML, MSG, Tabellen, Archive und unbekannte Formate", "EML-Metadaten, erkennbare Anlagen und bestätigte E-Mail-Anlagen-Verknüpfung", "Mögliche Aufgaben und Fristen als unbestätigte Hinweise"], improved: ["Dokumenteneingang, Scan, lokale Ordner, OneDrive, Bibliothek, Suche und Zuordnungslogik verwenden weiterhin denselben Familienakten-Kern", "Mehrere Bilder können mit der vorhandenen Scan-Funktion als gemeinsames PDF geprüft werden", "Unbekannte oder nicht lesbare Dateien werden verständlich zur manuellen Prüfung vorgemerkt", "Sensible Betreffzeilen und Dateinamen bleiben außerhalb des geschützten Gesundheitsbereichs datensparsam"], note: "2.28.0 wurde nach vollständig grüner technischer Prüfung und praktischem PDF-/Bild-Pilot am 12.10.2026 produktiv freigegeben. Es gibt keine automatische Postfach- oder OneDrive-Dauerüberwachung, keine zweite Datenbank, keine automatische fachliche Übernahme, keine kostenpflichtige externe API und keine Veränderung der Originaldateien.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Zentrale Eingangszentrale und gemeinsame Inhaltsanalyse", "FaWoGa-Bestandsanalyse und Archivintegrität", "Dokument fotografieren", "Memory & Erinnerungsprotokoll", "Dokument-Memory-Vorgangsverknüpfung", "Kernlogik und Datensicherheit 2.27.1", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.27.2", date: "12.10.2026", label: "FaWoGa-Bestandsanalyse, Dokumentenauswahl und sichere Archivablage", newItems: ["Eigener Unterbereich ‚Bestand prüfen‘ unter Dokumente", "Drei getrennte Zustände Quelle analysiert, archiviert und Assistenz freigegeben", "Nachvollziehbare Bewertung nach Aufbewahrungs-, Beweis- und Vorgangsrelevanz", "Sammelgruppen für Empfehlungen, Prüfbedarf, mögliche Dubletten und geringe Relevanz", "Fotoserien als gemeinsame Dokumentationsgruppen", "Archivkopien mit Prüfsummen und dauerhafter Archivkennung"], improved: ["Vorhandener Dokumenteneingang, 18 Kategorien, Bibliothek, Suche und Zuordnungslogik werden wiederverwendet", "Originalordner werden ausschließlich nach bewusster Freigabe und nur lesend analysiert", "Aktive Dokumentdatensätze entstehen erst nach Archivierung und ausdrücklicher Assistenzfreigabe", "Ein fachlicher Dokumentdatensatz kann den Familienakten-Tresor und den Archivdatenträger als mehrere Speicherorte führen"], note: "Der praktische Pilotlauf mit 59 Dateien wurde erfolgreich abgeschlossen: 10 ausgewählte Dateien wurden mit Prüfsumme archiviert und freigegeben; Bibliothek, Suche und vollständiges Öffnen eines PDFs wurden geprüft. Die Originaldateien blieben unverändert. Nach abschließender grüner Systemprüfung wurde die produktive Übernahme am 12.10.2026 ausdrücklich freigegeben. Keine automatische Löschung, Verschiebung oder Umbenennung und keine kostenpflichtige API.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "FaWoGa-Bestandsanalyse und Archivintegrität", "Dokumentenbibliothek", "Dokumenteneingang", "Kernlogik und Datensicherheit 2.27.1", "Suche", "Version und Changelog", "Hilfe", "Systemprüfung"] },
    { version: "2.27.1", date: "10.10.2026", label: "Konsolidierung, Datensicherheit und gemeinsame Kernlogik", newItems: ["Schutz vor dem Überschreiben beschädigter Registerdateien", "Vollständige Familienakten-Sicherung mit Wiederherstellungstest in einem leeren Testordner", "Zentrale Datenschutzfunktion für sensible Gesundheitsbezeichnungen", "Gemeinsame Relationsauflösung von Vorgang, Memory, Aufgabe und Frist", "Zentrale Quelle für die 18 Familienakten-Kategorien", "Mehrere Speicherorte für einen fachlichen Dokumentdatensatz"], improved: ["Gespeicherte Memories können geöffnet, bearbeitet und kontrolliert gelöscht werden", "Offene Memory-Fragen werden nur noch passend vorgeschlagen und niemals automatisch geschlossen", "Registerintegrität prüft doppelte und verwaiste Kennungen, Medien-, Dokument- und Speicherreferenzen", "Ein reproduzierbarer Standard-Testlauf umfasst zwölf neue Konsolidierungs- und Negativtests"], note: "Testkopie auf Grundlage von 2.27.0. Keine E-Mail-/Outlook-Integration, keine zweite Datenbank, keine kostenpflichtige API und keine neue OneDrive-Automatik. Die produktive Version 2.27.0 bleibt bis zur ausdrücklichen Freigabe unverändert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Dokument fotografieren", "Memory & Erinnerungsprotokoll", "Dokument-Memory-Vorgangsverknüpfung", "Kernlogik und Datensicherheit 2.27.1", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.27.0", date: "08.10.2026", label: "Dokument fotografieren → PDF → Dokumenteneingang", newItems: ["Aktiver Kamera-Eingang im bestehenden Bereich ‚Neue Dokumente erfassen‘", "Mehrseitige Scan-Übersicht mit großer Vorschau, Reihenfolge, Drehung, Neuaufnahme, Entfernung und optionaler Bildverbesserung", "Lokale PDF-Erstellung aus einer oder mehreren fotografierten Seiten ohne kostenpflichtige Erweiterung", "Eigener Systemprüfbereich mit acht Scan-/PDF-Praxistests"], improved: ["Die erzeugte PDF durchläuft dieselbe Dubletten-, FaWoGa-, Vorgangs-, Memory-, Such- und Gesundheitslogik wie hochgeladene Dokumente", "Scan-Fotos bleiben bis zur PDF-Erstellung temporär und werden nicht als eigene Dokumentdatensätze angelegt", "Originalaufnahmen werden nur nach ausdrücklicher Auswahl als Anlagen derselben PDF behalten", "Kamera- und Ordnerzugriffe erfolgen weiterhin ausschließlich nach bewusster Benutzeraktion"], note: "Die Fotofunktion ist ausschließlich ein neuer Eingangsweg. Dokumentenbibliothek, Dokumentregister, Suche, Zuordnung und Vorgänge bleiben die bestehenden gemeinsamen Systeme. Es wurden keine kostenpflichtige API, keine zweite Dokumentendatenbank und keine automatische OneDrive-Ablage eingebaut.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Dokument fotografieren", "Memory & Erinnerungsprotokoll", "Dokument-Memory-Vorgangsverknüpfung", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.26.0", date: "08.10.2026", label: "Dokumente, Memory und Vorgänge intelligent verbunden", newItems: ["Gemeinsame Kontext- und Verknüpfungslogik für Dokumente, Memories, offene Punkte und bestehende Vorgänge", "Nachvollziehbare Vorschläge in den Stufen sicher, wahrscheinlich und unklar mit der Erklärung ‚Warum vorgeschlagen?‘", "Gemeinsame chronologische Vorgangsansicht für Memory, Dokument, Foto, Termin, Aufgabe und Frist", "Kompakter Bereich ‚Gehört dazu‘ sowie die Vorgangsabfrage ‚Was ist noch offen?‘"], improved: ["Dokumenteneingang prüft vorhandene Memories und Memory-Eingaben prüfen vorhandene Dokumente", "Abgelehnte Zuordnungen werden bei unverändertem Kontext nicht erneut vorgeschlagen", "Verbindungen können geändert oder gelöst werden, ohne Dokumente, Memories oder Vorgänge zu löschen", "Offene Memory-Punkte und Teilabschlüsse werden berücksichtigt, aber niemals voreilig automatisch geschlossen"], note: "Die Erweiterung nutzt das bestehende Dokument-, Memory-, Vorgangs-, Relations-, Such- und Chronologiesystem. Sie stellt ausschließlich Verbindungen her, führt keine Datensätze zusammen, schützt Gesundheitsdetails und verwendet weder eine parallele Datenbank noch einen kostenpflichtigen API-Schlüssel.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Memory & Erinnerungsprotokoll", "Dokument-Memory-Vorgangsverknüpfung", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.25.0", date: "08.10.2026", label: "Memory v1.3 – Mehrfacherfassung und Bearbeitungswarteschlange", newItems: ["Mehrere unterschiedliche Erinnerungen nacheinander als getrennte lokale Entwürfe erfassen", "Anklickbare Warteschlange mit Erfassungsreihenfolge, vorläufigem Titel, Vorschau, Medienzahl und Bearbeitungsstatus", "Einzelne Entwürfe prüfen, ergänzen oder nach Bestätigung löschen", "Abschlussdialog für verbleibende Entwürfe und vollständig bearbeitete Tageserfassung"], improved: ["Nächste Eingabe und Eintrag prüfen sichern den aktuellen Inhalt ohne endgültige Chronologie- oder Cockpit-Einträge", "Medien, Originaltext, Diktat und Ereignisdatum bleiben beim jeweiligen Entwurf", "Unbehandelte Erinnerungen und offene Fragen bereits gespeicherter Memories werden mit getrennten Zählern angezeigt", "Zehn zusätzliche Mehrfacherfassungstests ergänzen die zwölf bestehenden Memory-Praxistests"], note: "Die Warteschlange erweitert das vorhandene lokale Memory-Register. Es entstanden keine zweite Memory-Datenbank, keine zweite Chronologie, keine neue Aufgabenverwaltung und keine kostenpflichtige oder externe API.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Memory & Erinnerungsprotokoll", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.24.0", date: "08.10.2026", label: "Memory, Erinnerungsprotokoll und lokaler Assistent v1", newItems: ["Kompakte Erfassung von Text, Dauerdiktat, Fotos und Videos", "Prüfansicht mit Originaltext, Lebensbereich, Ereignisart, vorhandenen Beziehungen und höchstens einer gezielten Rückfrage", "Eigener Bereich Tagebuch & Erinnerungen mit Chronologie, Tagesübersicht und offenen Memory-Punkten", "Zwölf praktische Memory-Testfälle mit eigenem Systemprüfbereich"], improved: ["Vorhandene Ereignis-, Vorgangs-, Aufgaben-, Fristen-, Such-, Cockpit- und Neuigkeitenlogik wird wiederverwendet", "Tatsachen, Beobachtungen und persönliche Einschätzungen bleiben getrennt", "Gesundheitsbezogene Einträge werden außerhalb des geschützten Bereichs datensparsam angezeigt", "Originaltext und lokale Medien bleiben erhalten; unsichere Zuordnungen benötigen Bestätigung"], note: "Der Assistent strukturiert mit lokalen, nachvollziehbaren Regeln. Es wurden keine kostenpflichtige API, keine externe KI-Übertragung, keine zweite Datenbank und keine automatische Dateiänderung eingebaut.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Memory & Erinnerungsprotokoll", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.23.0", date: "08.10.2026", label: "Startseite Teil 1 – intelligenter Dokumenteneingang", newItems: ["Kompakter gemeinsamer Dokumenteneingang direkt unter ‚Zuletzt wichtig‘", "Drag & Drop, bewusste Dateiauswahl, ausdrücklich freigegebener lokaler Eingangsordner und lokaler OneDrive-Posteingang", "FaWoGa-Erstzuordnung mit 18 vorhandenen Lebensbereichen, Datenschutzklasse und kontrollierter Dublettenprüfung", "Eigener Prüfbereich Dokumenteneingang mit elf praktischen Abläufen"], improved: ["Obere Navigation verwendet ruhige weiße Regular-Schrift mit gleichmäßigen Abständen", "Dokumentenbibliothek, Suche, Zuordnungslogik, Cockpit, Neuigkeiten und Vorgangschronologie werden gemeinsam wiederverwendet", "Unsichere Zuordnungen und mögliche Dubletten verlangen eine bewusste Prüfung", "Ordnerprüfungen erfolgen nur auf Befehl; Originaldateien werden nicht automatisch verschoben, umbenannt, gelöscht oder überschrieben"], note: "Die Verarbeitung verwendet vorhandene lokale Funktionen und keinen kostenpflichtigen API-Schlüssel. Es entstand keine zweite Dokumentendatenbank, Suche, Fristen- oder Zuordnungslogik. OneDrive bleibt ein ausdrücklich freigegebener lokaler Speicherort ohne Hintergrundüberwachung.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Dokumenteneingang", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.22.0", date: "08.10.2026", label: "Optimierte Menü- und Unterseiten", newItems: ["Einheitliche Hauptaktionen auf den Lebens-, Gesundheits-, Arbeits- und Dokumentenseiten", "Direkte Zielverknüpfungen für Dokumente, Personen, Objekte, Vorgänge, Fristen, Aufgaben, Verträge und Garantien", "Einheitliche weiße Info-Hinweise mit dunkelblauer Kennzeichnung", "Eigener Prüfbereich für Menü- und Unterseiten mit 18 Interaktivitäts-Praxistests"], improved: ["Wichtige und häufig genutzte Funktionen stehen vor ergänzenden Informationen", "Vorgangs-, Objekt- und Personenakten ordnen aktive Aufgaben, Fristen und Dokumente vor technischen Zusatzangaben", "Doppelte oder funktionslos wirkende Elemente wurden zusammengeführt beziehungsweise eindeutig als Information dargestellt", "Mobile Unterseiten verwenden kompakte Aktionsfelder und ausreichend große Berührungsflächen"], note: "Die Optimierung verwendet ausschließlich die vorhandene Suche, Dokumentenbibliothek, Cockpit- und Fristenlogik. Bestehende Daten, Kennungen und fachliche Zuordnungen wurden nicht verändert. Die Startseiten-Komponente blieb unverändert; kostenpflichtige Erweiterungen und OneDrive-Automatik wurden nicht eingebaut.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Menü- und Unterseiten", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.21.0", date: "08.10.2026", label: "Dokumentenbibliothek v1", newItems: ["Eigener Hauptbereich Dokumente mit zentraler Dokumentenbibliothek", "Neueste Dokumente, vorhandene Dokumentbereiche und vollständige Ansicht mit Suche, Filtern und Sortierung", "Interaktive Dokumentkarten mit Verknüpfungen zu Personen, Objekten, Vorgängen, Fristen, Verträgen und Garantien", "Datenschutzgerechte Darstellung sensibler Unterlagen mit geschütztem Gesundheitszugang"], improved: ["Dokumentensuche verwendet die bestehende lokale Suchlogik und denselben Datenbestand wie Cockpit und Was gibt’s Neues?", "Dokumenttreffer der globalen Suche führen in den passenden Bibliothekskontext", "Dokumentenverweise aus Vorgängen, Objektakten, Fristen und Neuigkeiten verwenden weiterhin die vorhandenen Kennungen", "Mobile Karten, kompakte Filter sowie anklickbare Titel, Vorschauen, Bereiche, Zähler und Verknüpfungen ergänzt"], note: "Die Dokumentenbibliothek erzeugt keine zweite Dokumentendatenbank. Sie liest ausschließlich vorhandene Dokumente, Datensätze und Verknüpfungen. Die Startseite, Originaldateien und fachlichen Zuordnungen wurden nicht verändert; es wurde keine kostenpflichtige Erweiterung und keine OneDrive-Automatik aktiviert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Dokumentenbibliothek", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.20.1", date: "07.10.2026", label: "Dauerdiktat bis zum manuellen Beenden", newItems: ["Mikrofon bleibt nach kurzen Sprechpausen eingeschaltet", "Automatischer Neustart, falls der Browser eine laufende Erkennung unbeabsichtigt beendet", "Vorläufig erkannte Wörter erscheinen bereits während des Sprechens"], improved: ["Diktat endet erst nach erneutem Antippen des roten Mikrofons", "Längere Suchsätze und Formulierungen können ohne Zeitdruck gesprochen werden", "Mikrofonfehler und verweigerte Berechtigungen werden weiterhin verständlich angezeigt"], note: "Die tatsächliche Spracherkennung stellt weiterhin der verwendete Browser bereit. Die Familienakte hält die Aufnahme jedoch aktiv und startet sie bei einer bloßen Sprechpause erneut. Es wurde kein kostenpflichtiger Dienst ergänzt.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Suche", "Version und Changelog", "Hilfe", "Systemprüfung"] },
    { version: "2.20.0", date: "07.10.2026", label: "Lokale interaktive Suche", newItems: ["Verständnis häufiger Alltagssätze in der oberen Suchleiste", "Direkte Zuordnung zu Krankenkasse/Leistung, Schriftverkehr, Ärzten, ICD-Codes, Aufgaben, Fristen und weiteren Familienbereichen", "Sichtbare Anzeige, als welche Themen der Suchsatz verstanden wurde", "Vier praktische Suchtests für Spracheingabe, Aufgaben, Suchhilfe sowie Ärzte und ICD-Codes"], improved: ["Mikrofontext wird nicht mehr nur als wortwörtliche Zeichenfolge behandelt", "Eine neue Spracheingabe ersetzt den vorherigen Suchsatz und verhindert vermischte Suchbegriffe", "Die Eingabe ‚Interaktive Suche‘ führt nun zur passenden Hilfe statt zu einer leeren Trefferliste", "Vorhandene Akteninhalte, Datenschutz und lokale Suchweise bleiben unverändert"], note: "Die Auswertung erfolgt lokal anhand transparenter Begriffe und Bereiche. Es wurde kein kostenpflichtiger OpenAI-API-Schlüssel eingebaut, keine externe KI-Suche aktiviert und kein Akteninhalt verändert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.19.0", date: "07.10.2026", label: "Interaktives Cockpit v1", newItems: ["Zentrale Arbeitsübersicht für aktuelle Prioritäten, aktive To-dos, offene Vorgänge und Objektakten", "Interaktive Vorgangs- und Objektakten aus vorhandenen Personen-, Organisations-, Dokument-, Fristen-, Aufgaben-, Kosten-, Vertrags- und Garantiedaten", "Bestätigte Statusänderung für Aufgaben sowie bestätigtes Ergänzen eigener Notizen im lokalen Datentresor", "Datensparsame Gesundheitsverweise und kontextbezogene ChatGPT-Hilfe ohne kostenpflichtige API"], improved: ["‚Zuletzt wichtig‘ verwendet jetzt die priorisierten echten Daten des Cockpits", "‚Neu hinzugekommen‘ verwendet dieselbe Abfrage und dieselben Ursprungsdatensätze wie ‚Was gibt’s Neues?‘", "Suche führt zusätzlich direkt zu Personen, Objekten, Vorgängen, Aufgaben, Fristen, Verträgen und Garantien", "Mobile Darstellung ordnet Prioritäten, To-dos, Vorgänge und Detailakten untereinander"], note: "Das Cockpit verwendet ausschließlich das bestehende gemeinsame Datenmodell und vorhandene Kennungen. Es wurde keine zweite Datenbank angelegt, keine Gesundheitsunterlage dupliziert und keine OneDrive-Automatik oder kostenpflichtige Erweiterung aktiviert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Interaktives Cockpit", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.18.0", date: "07.10.2026", label: "Interaktive Monatsübersicht ‚Was gibt’s Neues?‘", newItems: ["Chronologische Übersicht aus vorhandenen Dokumenten, Vorgängen, Objekten, Fristen, Aufgaben und Versionsinformationen", "Zeitraumfilter für 7, 30 und 60 Tage, aktuellen Monat, Vormonat und einen eigenen Zeitraum", "Datenschutzgerechte Vorschaubilder oder neutrale Bereichssymbole", "Direkte Verlinkung zum sachlich passenden Dokument-, Vorgangs- oder Fachbereich"], improved: ["Neuer Einstieg neben ‚Zuletzt wichtig‘ und weiterhin in der unteren Navigation", "Benutzerereignisse stehen am selben Tag vor technischen Softwareänderungen", "Sensible Gesundheits-, Behörden- und Finanzinhalte erscheinen nicht als lesbare Miniatur", "Modulare Abfrage- und Darstellungslogik kann später vom Interaktiven Cockpit v1 wiederverwendet werden"], note: "Die Übersicht verwendet ausschließlich das bestehende gemeinsame Datenmodell. Es wurde keine zweite Ereignis- oder Dokumentendatenbank angelegt und keine bestehende Unterlage verändert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Was gibt’s Neues?", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.17.0", date: "07.10.2026", label: "Aktive Fristen und Erinnerungen", newItems: ["Eigener Bereich Fristen und Aufgaben mit manueller, bestätigter Anlage", "Status offen, bald fällig, überfällig, erledigt und zurückgestellt", "Erinnerungsdatum sowie Verknüpfungen zu Person, Objekt, Vorgang und Dokument", "Aktuelle Fristen erscheinen unter Zuletzt wichtig"], improved: ["Erledigte und zurückgestellte Einträge verschwinden aus den offenen Punkten", "Jede Anlage und Statusänderung wird im lokalen Register protokolliert", "Medizinische und behördliche Fristen werden niemals ungefragt übernommen", "Praktischer Testlauf prüft Status, Quellenverknüpfung und unveränderten Ausgangsbestand"], note: "Fristen werden nur manuell oder nach ausdrücklicher Bestätigung angelegt. Die Familienakte versendet keine externen E-Mails oder SMS und verwendet keine kostenpflichtigen Dienste.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.16.0", date: "07.10.2026", label: "Vollständiger Aktenexport", newItems: ["Bewusst gestarteter Export unter Sicherheit und Verwaltung", "Auswahl einzelner Aktenbereiche oder der gesamten Familienakte", "Lesbare HTML-Übersicht, maschinenlesbare JSON-Daten und eigener Exportbericht", "Optionales Kopieren freigegebener lokaler Originaldateien"], improved: ["Speicherort, Auswahl, Originalumfang und unverschlüsselter Zustand werden vor dem Start angezeigt", "Fehlende Originaldateien werden im Exportbericht eindeutig als unvollständig gekennzeichnet", "Vorhandene Exportordner und Ausgangsdokumente werden nicht überschrieben", "Praktischer Testexport schreibt und liest die drei Exportdateien"], note: "Der Export startet ausschließlich nach einem bewussten Klick. Die Familienakte verschiebt, löscht oder benennt Originale nicht um und behauptet keinen Passwort- oder Verschlüsselungsschutz.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.15.0", date: "07.10.2026", label: "Ruhige Startseite und Servicenavigation", newItems: ["Abschnitt „Zuletzt wichtig“ direkt unter der Hauptüberschrift und oberhalb der Lebensbereiche", "Vier Linkgruppen am Seitenende: Familienakte, Unterstützung, Informationen sowie Sicherheit und Verwaltung", "Eigene technische Versionshistorie neben der verständlichen Seite „Was ist neu?“"], improved: ["Gesamtes Verzeichnis, ChatGPT, Hilfe und Was ist neu? wirken nicht mehr wie gleichrangige Hauptaktionen", "Vorhandene neue Unterlagen, offene Abgleiche und offene Systemprüfpunkte können in „Zuletzt wichtig“ erscheinen", "Mobile Darstellung ordnet die Linkgruppen übersichtlich untereinander", "Bestehende Ziele und Funktionen aller Links bleiben erhalten"], note: "Die Gestaltung übernimmt die ruhige Informationshierarchie des gewünschten jw.org-Musters, ohne die Website zu kopieren. Daten, Gesundheitsakte, Zugriffsrechte und Zuordnungslogik bleiben unverändert.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.14.0", date: "07.10.2026", label: "Zuordnungslogik v1", newItems: ["Einheitliche Vorschlagsreihenfolge von Dokument bis Speicherort", "Wiederverwendung bestehender Personen-, Objekt-, Vorgangs- und Organisationskennungen", "Sicherheitsstufen für eindeutige, mehrdeutige und unsichere Treffer", "Vier feste Testfälle für Fahrzeug, Haushalt, Kauf/Garantie sowie Gesundheit/Behörde"], improved: ["Dublettenprüfung vor vorgeschlagener Neuanlage", "Fristen, Aufgaben, Zahlungen, Verträge, Garantien und Speicherorte werden nur vorgeschlagen", "Gesundheitsunterlagen bleiben im geschützten Bereich und werden nur über notwendige Referenzen verbunden", "Prüfberichte enthalten jetzt die Ergebnisse der Zuordnungs-Testfälle"], note: "Die Zuordnungslogik übernimmt nichts automatisch. Dateien werden nicht verschoben, kopiert, umbenannt oder gelöscht. Eine automatische OneDrive-Dateiverarbeitung bleibt ausgeschaltet; bestehende Optik, Navigation, Daten und Gesundheitsakte wurden nicht umgebaut.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Zuordnungslogik v1", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.13.0", date: "07.10.2026", label: "Entwicklungsstand konsolidiert", newItems: ["Me, Myself and I – Familienakte als einziges führendes System festgeschrieben", "Gemeinsamer Bestand aus Datenmodell, zwölf Datentypen, Systemprüfung, Prüfberichten, Startseitenstatus, Hilfe, Changelog und Versionsverwaltung dokumentiert", "Eigener Prüfpunkt „Konsolidierter Entwicklungsstand“", "Prüfberichte um Prüf-ID, grüne Prüfpunkte und Freigabestatus ergänzt"], improved: ["Spätere Cockpit-Funktionen werden modular in bestehende Strukturen integriert statt parallel neu aufgebaut", "Bestands-, Funktions- und Dublettenprüfung vor jeder späteren Zusammenführung verbindlich festgelegt", "Sichere und bestätigungspflichtige Reparaturen klar voneinander getrennt", "Entwicklungsregel um den verpflichtenden gespeicherten Prüfbericht ergänzt"], note: "Die Zuordnungslogik v1, eine OneDrive-Automatik und automatische Dateiverschiebungen wurden in dieser Version ausdrücklich nicht gestartet. Bestehende Optik, Navigation, Gesundheitsakte, Daten und Funktionen bleiben erhalten.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Konsolidierter Entwicklungsstand", "Systemprüfung"] },
    { version: "2.12.0", date: "07.10.2026", label: "Prüfberichte und sichere automatische Reparatur", newItems: ["Automatische Berichtshistorie unter Hilfe → Systemprüfung → Prüfberichte", "Zusätzliche Systemprüfungsleiste am Ende der Startseite", "Aufklappbare offene Punkte mit betroffenem Bereich, Ursache und nächstem Schritt", "Begrenzter automatischer Reparaturdurchlauf mit Fortschrittsanzeige und anschließender vollständiger Kontrollprüfung"], improved: ["Jeder Prüf- und Reparaturlauf bleibt mit Datum, Uhrzeit, Version und Ergebnis erhalten", "Vor einer Reparatur wird der bisherige Prüfzustand gesichert", "Automatische Reparaturen sind strikt auf lokale Prüf- und Berichtsdaten begrenzt", "Ohne messbare Verbesserung endet die automatische Wiederholung; der Reparaturknopf bleibt verfügbar"], note: "Persönliche Unterlagen, Gesundheitsdaten, Dokumente, Dateien, Verknüpfungen, Ordner und Tresoreinstellungen werden niemals automatisch repariert. Grün wird nur angezeigt, wenn eine vollständige Prüfung keine offenen Fehler oder Warnungen bestätigt.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Verknüpfungen", "Suche", "Export", "Version und Changelog", "Hilfe", "Erinnerungen und Fristen", "Prüfberichte", "Automatische Reparatur", "Systemprüfung"] },
    { version: "2.11.0", date: "07.10.2026", label: "Systemprüfung dauerhaft integriert", newItems: ["Deutlich sichtbarer Menüpunkt Hilfe → Systemprüfung", "Eigene Statusübersicht mit aktueller Version, letztem Prüfdatum und letztem Ergebnis", "Dauerhafter Prüfkatalog für Oberfläche, Navigation, Daten, Gesundheitsakte, Dokumente, Suche, Export, Changelog, Hilfe, Datenmodell, Verknüpfungen sowie Erinnerungen und Fristen", "Verpflichtende Entwicklungs- und Freigaberegel für alle künftigen Versionen"], improved: ["Bestehende Prüfpunkte werden geschützt und bei neuen Funktionen erweitert", "Warnungen und Fehler erscheinen zusätzlich in einer einfachen Zusammenfassung", "Der letzte vollständige Prüfbericht bleibt in diesem Browser sichtbar", "Technische Abnahmeprüfung kann vor jedem Build als eigener Prüfschritt ausgeführt werden"], note: "Die Systemprüfung bleibt vollständig lesend. Sie verändert keine Nutzerdaten, Dateien, Strukturen oder Einstellungen. Die Zuordnungslogik v1 beginnt erst nach dieser geprüften Grundlage.", helpUpdated: true, regressionTargets: ["Oberfläche", "Navigation", "Bestehende Daten", "Gesundheitsakte", "Dokumente", "Datenmodell", "Verknüpfungen", "Suche", "Export", "Hilfe", "Erinnerungen und Fristen", "Systemprüfung"] },
    { version: "2.10.0", date: "07.10.2026", label: "Systemprüfung und Regressionstest v1", newItems: ["Lesende Systemprüfung mit Ampelübersicht und Gesamtergebnis", "Prüfung von Oberfläche, Datenbestand, Gesundheitsakte, Datenmodell, Suche, Changelog, Verknüpfungen, Export sowie Fristen und Erinnerungen", "Freiwillige Prüfaufforderung nach einem Versionswechsel"], improved: ["Changelog dient als Grundlage für die Abnahme der aktuellen Änderung", "Noch nicht umgesetzte Funktionen werden klar benannt und nicht automatisch als Fehler gewertet", "Gesundheitsinhalte werden in der Prüfung nicht unnötig ausgegeben"], note: "Die Systemprüfung liest, vergleicht und berichtet ausschließlich. Sie löscht, verschiebt, benennt, migriert oder repariert keine Daten und verändert keine Einstellungen.", helpUpdated: true, regressionTargets: ["Oberfläche", "Datenbestand", "Gesundheitsakte", "Datenmodell", "Suche", "Changelog"] },
    { version: "2.9.0", date: "07.10.2026", label: "Gemeinsames Datenmodell vorbereitet", newItems: ["Technische Grundtypen für Personen, Organisationen, Objekte, Vorgänge, Dokumente, Fristen, Aufgaben, Erinnerungen, Ereignisse, Zahlungen, Verträge und Garantien", "Einheitliche Systemfelder, Kennungslogik und flexible Querverbindungen im Hintergrund", "Optionale Speicherverweise für OneDrive, lokale Ordner, USB und den bisherigen Online-Altbestand"], improved: ["Bestehendes Dokumentenregister kompatibel erweitert statt ersetzt", "Vorhandene Dokument-IDs, Gesundheitsdaten, Dateipfade und Bedienabläufe bleiben erhalten", "Lokales Register kann die neue Datenmodellstruktur aufnehmen, ohne bestehende Dokumente umzubenennen"], note: "Dieser Entwicklungsschritt schafft nur die technische Grundlage. Es wurden keine Dateien automatisch analysiert, verschoben oder zugeordnet und keine neue sichtbare Navigation eingeführt." },
    { version: "2.8.2", date: "07.10.2026", label: "Ruhige Statusfarben", newItems: ["Dünner blauer Rahmen für alle ovalen Arbeitsknöpfe", "Zartgelb für offen, Hellgrün für erfolgreich und Hellgrau für zuletzt nicht möglich"], improved: ["Deutlich dezentere Farben ohne aufdringliche Vollflächen", "Alle Arbeitsknöpfe bleiben in jedem Status erneut anklickbar", "Statuswechsel sind an den tatsächlichen Abschluss der jeweiligen Aktion gekoppelt"], note: "Ein abgebrochener Vorgang bleibt offen. Grau bedeutet nur, dass der letzte Versuch nicht abgeschlossen werden konnte; die Aktion kann jederzeit erneut gestartet werden." },
    { version: "2.8.1", date: "07.10.2026", label: "Ovale Schnellaktionen", newItems: ["Eigener hellblauer Arbeitsbereich unter der Startüberschrift", "Ovale, farblich getrennte und weiterhin interaktive Aktionsschaltflächen"], improved: ["Sichtbarer Abstand zwischen dem privaten Aktenschrank und den Arbeitsaktionen", "Bessere optische Unterscheidung von Tresor, Ablage, Abgleich, Aktualisierung und ChatGPT"], note: "Dies ist eine reine Gestaltungsverbesserung. Funktionen, Daten, Datenschutz und Zugriffsrechte bleiben unverändert." },
    { version: "2.8.0", date: "07.10.2026", label: "Klare Such- und Arbeitsleiste", newItems: ["Breite Such- und Diktierleiste direkt unter der Hauptnavigation", "Gemeinsame Arbeitsleiste unter der blauen Startüberschrift", "Tresorstatus wechselt sichtbar von Gelb auf Grün", "ChatGPT-Änderungszugang als fester Bestandteil der Arbeitsleiste"], improved: ["Schwebende ChatGPT-Schaltfläche entfernt, damit kein Inhalt verdeckt wird", "Tresor verbinden, Unterlagen ablegen, Abgleich und Aktualisierung nicht mehr doppelt direkt nebeneinander", "Navigation und Inhaltsblöcke ruhiger und klarer nach dem Grundmuster von jw.org gegliedert", "Hilfe an die neue Anordnung angepasst"], note: "Es wurde keine kostenpflichtige Erweiterung und kein OpenAI-API-Schlüssel eingebaut. Die bestehende private Anmeldung und die lokale Speicherung bleiben unverändert." },
    { version: "2.7.0", date: "07.10.2026", label: "Kontrollierte Sicherung und ChatGPT-Änderungszugang", newItems: ["OneDrive-Inhalt vor der Sicherung mit dem PC-/USB-Tresor vergleichen", "Nur fehlende registrierte Dokumente nach ausdrücklicher Bestätigung kopieren", "Feste Schaltfläche unten rechts für neue Änderungswünsche über ChatGPT"], improved: ["Sicherungsstand wird vor dem Kopieren angezeigt", "Kein automatisches Löschen oder Überschreiben", "Hilfe und Datentresor-Status an die neue Ausbaustufe angepasst"], note: "Der Sicherungsabgleich läuft nur nach deinem Klick und nur vom OneDrive-Ordner zum PC-/USB-Tresor. Die ChatGPT-Schaltfläche nutzt keinen kostenpflichtigen API-Schlüssel; sie erstellt lediglich einen kopierbaren Änderungsauftrag." },
    { version: "2.6.0", date: "07.10.2026", label: "Diktieren in Eingabefeldern", newItems: ["Mikrofon in der allgemeinen Suche", "Spracheingabe für Bereich, Dokumentdatum und Hinweis beim lokalen Ablegen", "Deutsche Spracherkennung mit sichtbarer Aufnahme-Anzeige"], improved: ["Gesprochenes Datum wird vor der Übernahme geprüft", "Nicht erkannte Bereiche oder Daten werden nicht ungeprüft eingetragen", "Verständliche Hilfe zu Mikrofonfreigabe und Datenschutz"], note: "Die Familienakte speichert keine Tonaufnahme. Die Spracherkennung wird vom verwendeten Browser bereitgestellt und kann je nach Browser über dessen Anbieter verarbeitet werden." },
    { version: "2.5.0", date: "07.10.2026", label: "OneDrive als primärer Datentresor", newItems: ["Lokalen OneDrive-Ordner ausdrücklich auswählen und verbinden", "Neue Unterlagen vorrangig direkt im verbundenen OneDrive-Ordner ablegen", "OneDrive- und PC-/USB-Tresor getrennt anzeigen und sperren"], improved: ["Klare Anzeige des tatsächlich verwendeten Speicherorts", "PC-/USB-Tresor bleibt als lokaler Ersatz und Vorbereitung für die spätere Sicherung erhalten"], note: "Die Website lädt neue Dateien nicht in einen eigenen Onlinespeicher hoch. Die Cloud-Synchronisierung des gewählten Ordners übernimmt die OneDrive-App auf dem PC. Der automatische OneDrive-/USB-Abgleich ist noch nicht aktiv." },
    { version: "2.4.1", date: "07.10.2026", label: "Neue Hauptüberschrift", newItems: ["Die Startseite beschreibt jetzt klarer, dass die Familienakte nicht nur ordnet, sondern auch unterstützt, erinnert und bei Fragen, E-Mails und Terminen hilft."], improved: ["Persönlichere und verständlichere Beschreibung des gesamten Aufgabenbereichs"], note: "An Funktionen und gespeicherten Daten wurde durch diese Textänderung nichts verändert." },
    { version: "2.4.0", date: "07.10.2026", label: "Neue Ausbaustufe", newItems: ["Eigene Versionsanzeige und dauerhafte Versionshistorie", "Neuer Hilfebereich mit einfachen Erklärungen und Suchbeispielen", "Erweiterte lokale Freitextsuche über Diagnosen, Ärzte, Schriftverkehr, Leistungen, Arbeit und Dokumente", "Datentresor-Status auf der Startseite", "Kopierbare Kennungsdatei für den PC-/USB-Datentresor"], improved: ["Datenschutzanzeige der Suche", "Kennzeichnung noch nicht verfügbarer OneDrive- und Offline-Funktionen"], note: "Die direkte OneDrive-Synchronisation und die portable Offline-Version folgen in späteren Ausbaustufen." },
    { version: "2.3.1", date: "05.10.2026", label: "Sicher abmelden", newItems: ["Ausloggen-Schaltfläche rechts oben"], improved: ["Bedienung auf kleinen Bildschirmen"], note: "Beim Ausloggen wird die private Sitzung beendet; lokale Dateien bleiben erhalten." },
    { version: "2.3.0", date: "05.10.2026", label: "Lokaler Datentresor", newItems: ["Lokale Speicherung auf PC oder USB-Stick", "Lokale Registerdatei", "Sicherung des bisherigen Online-Bestands ohne automatische Löschung", "Sicherheitscenter und Hinweise zur Zwei-Faktor-Anmeldung"], improved: ["Trennung zwischen lokalen Unterlagen und Online-Altbestand"], note: "Online-Kopien werden erst nach geprüfter lokaler Sicherung und ausdrücklicher Freigabe gelöscht." },
    { version: "2.2.0", date: "02.10.2026", label: "Familienstruktur", newItems: ["Familienakte mit Bereichen für Gesundheit, Personen, Wohnen, Fahrzeuge, Käufe und Dokumente", "Mehrstufige Navigation und Gesamtes Verzeichnis"], improved: ["Gesundheits- und Leistungsakte als eigenes Fachmodul"], note: "Vorbereitete Bereiche enthalten keine erfundenen Aktenbestände." },
  ];

versionHistory[0].improved.push(
  "Analyse-Hauptordner und Datentresor werden eindeutig unterschieden; ein eingebetteter Datentresor wird geschützt ausgeschlossen",
  "Ungültige oder verweigerte Datei- und Ordnerreferenzen werden pfadbezogen auf Deutsch gemeldet und können gezielt erneut freigegeben werden",
  "Die Testregister-Vorbereitung überspringt einzelne verschwundene oder unlesbare Dateien kontrolliert, statt die gesamte Vorschau abzubrechen",
  "Gespeicherte Berechtigungen und Registerzugriffe werden vor der Vorbereitung geprüft; Lösungen werden verständlich auf Deutsch angeboten",
  "„Testregister vorbereiten“ ist dauerhaft in der oberen Aktionsreihe erreichbar und prüft einen gespeicherten Bestand bei Bedarf zuerst kontrolliert erneut",
  "Eine einmal freigegebene Entwicklungsbasis ersetzt die wiederkehrende manuelle Verwaltung mehrerer Testordner und prüft Browserberechtigungen vor jeder Verwendung",
);
versionHistory[0].newItems.push(
  "Automatische Testregister-Vorschau aus dem ausdrücklich freigegebenen Testbestand",
  "Getrennte Anzeige von Analysequelle, aktivem Testdatentresor und noch nicht gespeichertem Testregister",
  "Ausdrücklich bestätigte Übernahme neuer Vorschläge ausschließlich als QUELLE_ANALYSIERT in das bestehende Register",
  "Automatische, wiederverwendbare Testumgebung mit synthetischen Dokumenten, getrenntem Testdatentresor, bestehendem Registerformat, Sicherung, Wiederherstellung und gespeichertem Prüfbericht",
);

function VersionCard({ item }: { item: VersionEntry }) {
  return <article className="card"><div className="changelog-head"><div><span className="version-badge">Version {item.version}</span><h2>{item.label}</h2></div><time>{item.date}</time></div><div className="change-columns"><div><h3>Neu</h3><ul>{item.newItems.map((entry) => <li key={entry}><CheckCircle2/>{entry}</li>)}</ul></div><div><h3>Verbessert</h3><ul>{item.improved.map((entry) => <li key={entry}><RefreshCw/>{entry}</li>)}</ul></div></div><p className="change-note"><HelpCircle size={16}/><span><strong>Bitte beachten:</strong> {item.note}</span></p></article>;
}

function NewsPreview({ item, onOpen }: { item: FamilyNewsItem; onOpen: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = item.preview.kind === "software" ? History : item.area.includes("GESUND") || item.sensitive ? ShieldCheck : item.area.includes("FAHRZEUG") ? Car : item.area.includes("HAUS") ? Home : item.area.includes("FRIST") || item.area.includes("AUFGAB") || item.area.includes("ERINNER") ? FileClock : FileText;
  // Die Vorschau kann aus einer lokalen Blob-URL stammen und wird deshalb nicht über einen externen Bildoptimierer geladen.
  const imagePreview = item.preview.kind === "image" && item.preview.url && !imageFailed ? <img src={item.preview.url} alt="" onError={() => setImageFailed(true)}/> : null;
  return <button className={`news-preview ${item.sensitive ? "sensitive" : ""}`} onClick={onOpen} aria-label={`${item.preview.label}: ${item.title}`}>
    {imagePreview || <Icon aria-hidden="true"/>}
  </button>;
}

function WhatsNew({ documents, localDocuments, records, relations, onGo }: {
  documents: UploadedDocument[];
  localDocuments: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  onGo: (id: SectionId, targetId?: string) => void;
}) {
  const [period, setPeriod] = useState<FamilyNewsPeriod>("60days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const newsDocuments = useMemo(() => cockpitDocuments(documents, localDocuments), [documents, localDocuments]);
  const allItems = useMemo(() => buildFamilyNewsItems({ documents: newsDocuments, records, relations, versions: versionHistory }), [newsDocuments, records, relations]);
  const visibleItems = useMemo(() => filterFamilyNews(allItems, period, new Date(), customStart, customEnd), [allItems, period, customStart, customEnd]);
  const [newsGezeigt, newsMehr] = useSeiten(visibleItems.length, `${period}|${customStart}|${customEnd}`);
  const periodLabels: Record<FamilyNewsPeriod, string> = { "7days": "Letzte 7 Tage", "30days": "Letzte 30 Tage", "60days": "Letzte 60 Tage", currentMonth: "Aktueller Monat", previousMonth: "Vorheriger Monat", custom: "Eigener Zeitraum" };
  return <><PageTitle icon={<History/>} title="Was gibt’s Neues in der Familienakte?" text="Neue Dokumente, wichtige Vorgänge und Veränderungen – aus dem vorhandenen gemeinsamen Datenmodell, neueste Einträge zuerst."/>
    <section className="card news-filter"><div><span className="eyebrow dark">Zeitraum</span><h2>{periodLabels[period]}</h2><p>Der Filter verändert keine Daten.</p></div><div className="news-filter-controls"><label><span>Anzeige</span><select value={period} onChange={(event) => setPeriod(event.target.value as FamilyNewsPeriod)}><option value="60days">Letzte 60 Tage</option><option value="7days">Letzte 7 Tage</option><option value="30days">Letzte 30 Tage</option><option value="currentMonth">Aktueller Monat</option><option value="previousMonth">Vorheriger Monat</option><option value="custom">Eigener Zeitraum</option></select></label>{period === "custom" && <><label><span>Von</span><DatumFeld value={customStart} onChange={(event) => setCustomStart(event.target.value)}/></label><label><span>Bis</span><DatumFeld value={customEnd} onChange={(event) => setCustomEnd(event.target.value)}/></label></>}</div></section>
    <section className="news-result-heading"><div><span className="eyebrow dark">Chronologische Übersicht</span><h2>{visibleItems.length} neue{visibleItems.length === 1 ? "r Eintrag" : " Einträge"}</h2></div><span className="badge neutral">neueste zuerst</span></section>
    {visibleItems.length ? <><section className="news-list">{visibleItems.slice(0, newsGezeigt).map((item) => { const open = () => { if (item.sensitive) return onGo("health"); if (item.sourceType === "version") return onGo("versions"); const target = datensatzZiel(records, item.sourceType === "document" ? "document" : "record", item.sourceId); onGo(target.section as SectionId, target.targetId); }; return <article className="card news-item" key={item.id}><NewsPreview item={item} onOpen={open}/><div className="news-content"><time>{item.dateLabel}</time><span className="news-area">{item.area}</span><button className="news-title-link" onClick={open}>{item.title}</button><p>{item.summary}</p><small>{item.sensitive ? "Datenschutzgerechte Vorschau – Einzelheiten nur im geschützten Fachbereich." : `Quelle: ${item.sourceType === "version" ? "Versionshistorie" : item.sourceType === "document" ? "Dokumentenregister" : "gemeinsames Datenmodell"}`}</small></div><button className="news-open" onClick={open} aria-label={`${item.title} öffnen`}><ChevronRight/></button></article>; })}</section><WeitereAnzeigen gezeigt={newsGezeigt} gesamt={visibleItems.length} onMehr={newsMehr}/></> : <section className="card empty-state news-empty"><History size={34}/><strong>In diesem Zeitraum gibt es keine neuen Einträge.</strong><span>Es werden keine künstlichen Beispielinhalte eingesetzt.</span></section>}
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Technische Änderungen</h2><InfoPopover label="Technische Änderungen erklären" text={UI_HELP["Technische Änderungen"]}/></span></div><button className="button secondary" onClick={() => onGo("versions")}><History size={17}/> Versionshistorie öffnen</button></section>
  </>;
}

function VersionHistory() {
  return <><PageTitle icon={<History/>} title="Versionshistorie" text="Der vollständige technische Entwicklungsverlauf. Die neuesten Versionen stehen oben."/>
    <section className="version-current card"><div><span>FAMILIENAKTE</span><strong>Version {APP_FASSUNG}</strong><small>Interner Prüfstand {APP_VERSION} vom {APP_VERSION_DATE}</small></div><History size={42}/></section>
    <section className="card fassungen-liste" data-fassungen><h2>Ausgegebene Fassungen</h2><ul>{FASSUNGEN.map((f) => <li key={f.fassung}><strong>{f.fassung}</strong> <small>{f.datum}</small><span>{f.inhalt}</span></li>)}</ul><p className="klein-hinweis">Darunter der ältere technische Verlauf bis {APP_VERSION}.</p></section>
    <section className="changelog-list">{versionHistory.map((item) => <VersionCard item={item} key={item.version}/>)}</section>
  </>;
}

// B2 (09.11.): feste Info-Kästen sind jetzt Info-Zeilen (gemeinsamer Baustein in ui-controls).
const InfoNotice = InfoZeile;

function SubpageActions({ actions, onGo, onDocuments }: {
  actions: MenuAction[];
  onGo: GehMitZiel;
  onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void;
}) {
  const open = (action: MenuAction) => {
    if (action.section === "documents") onDocuments({ area: action.area || "", query: action.query || "", focusId: action.targetId || null });
    else onGo(action.section as SectionId, action.targetId, action.anker ? { ziel: action.anker } : undefined);
  };
  return <nav className="subpage-actions" aria-label="Wichtige Funktionen dieser Seite">{actions.map((action) => <button key={`${action.label}-${action.section}`} onClick={() => open(action)}><span><strong>{action.label}</strong><small>{action.detail}</small></span><ChevronRight/></button>)}</nav>;
}

function HealthHub({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void }) {
  return <><PageTitle icon={<HeartPulse/>} title="Gesundheit & Arbeit" text="Der vollständige bisherige Gesundheitsbereich – jetzt als eigenes Fachmodul innerhalb der Familienakte."/>
    <SubpageActions actions={menuPageActions.health} onGo={onGo} onDocuments={onDocuments}/>
    <section className="area-grid">{portalAreas.map((area) => <button className="area-card" key={area.id} onClick={() => onGo(area.id as SectionId)}><div className="area-icon">{area.id === "assessment" ? <Users/> : area.id === "work" ? <Landmark/> : area.id === "benefits" ? <BriefcaseMedical/> : <HeartPulse/>}</div><div><span className="badge neutral">{area.count}</span><h3>{area.title}</h3><p>{area.text}</p></div><ChevronRight className="area-arrow"/></button>)}</section>
    <InfoNotice title="Regeln für die Gesundheitsakte"><p>Nur bestätigte Originalunterlagen übernehmen, chronologisch ordnen und Befund, eAU, betriebliche Krankmeldung sowie eigene Notiz klar voneinander unterscheiden.</p></InfoNotice>
  </>;
}

function FamilyArea({ onGo, onDocuments, records, vaultHandle, onRefresh, onSaveContact }: { onGo: GehMitZiel; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void; records: FamilyRecordUnion[]; vaultHandle: FileSystemDirectoryHandle | null; onRefresh: () => Promise<void>; onSaveContact: (id: string, kontakt: PersonKontakt) => Promise<boolean> }) {
  const icons = [BookOpen, UserRound, Users, FileClock, Archive];
  const open = (action: MenuAction) => action.section === "documents" ? onDocuments({ area: action.area || "", query: action.query || "" }) : onGo(action.section as SectionId, action.targetId, action.anker ? { ziel: action.anker } : undefined);
  return <><PageTitle icon={<Users/>} title="Familie & Personen" text="Personen, Organisationen, Objekte und Vorgänge der Familie. Einträge entstehen nur, wenn du sie speicherst oder eine Zuordnung bestätigst."/>
    <FamilieStamm records={records} vaultHandle={vaultHandle} onRefresh={onRefresh} onOpen={(id) => onGo("cockpit", id)} onSaveContact={onSaveContact} onVerbinden={() => onGo("security")}/>
    <section className="object-grid compact">{menuPageActions.family.map((action, index) => { const Icon = icons[index]; return <button className="object-card" key={action.label} onClick={() => open(action)}><div className="object-icon"><Icon/></div><span className="badge neutral">Öffnen</span><h3>{action.label}</h3><p>{action.detail}</p><span className="open-label">Anzeigen <ChevronRight size={16}/></span></button>; })}</section>
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Andere Lebensbereiche</h2><InfoPopover label="Andere Lebensbereiche erklären" text={UI_HELP["Andere Lebensbereiche"]}/></span></div><button className="button primary" onClick={() => onGo("directory")}>Gesamtes Verzeichnis</button></section>
  </>;
}

// Thema → Suchwörter, mit „oder“ verbunden: der Thementitel selbst steht in keinem Dateinamen.
const preparedTopicQueries: Record<string, string> = {
  "Mietvertrag & Übergaben": "Mietvertrag oder Übergabe oder Schlüssel",
  "Vermieter & Schriftverkehr": "Vermieter oder Schreiben oder Anfrage oder Antwort",
  "Nebenkosten & Zahlungen": "Nebenkosten oder Abrechnung oder Zahlung",
  "Mängel & Reparaturen": "Mangel oder Mängel oder Reparatur oder Handwerker",
  Fahrzeugpapiere: "Fahrzeugschein oder Fahrzeugbrief oder Zulassung oder Kaufvertrag",
  "Werkstatt & Wartung": "Werkstatt oder Wartung oder Inspektion oder Reparatur",
  "TÜV & Gutachten": "TÜV oder Hauptuntersuchung oder Gutachten oder Prüfbericht",
  Versicherung: "Versicherung oder Police oder Schaden oder Beitrag",
  "Kauf & Rechnung": "Kauf oder Rechnung oder Beleg",
  Garantie: "Garantie",
  "Reparatur & Service": "Reparatur oder Service oder Reklamation",
  "Geräte & Technik": "Gerät oder Technik oder Anleitung oder Seriennummer",
};

const preparedContent = {
  home: { icon: Building2, title: "Haus, Wohnung und Vermieter", text: "Eine gemeinsame Objektakte für Verträge, Abrechnungen, Schriftverkehr, Schäden und Reparaturen.", items: [
    ["Mietvertrag & Übergaben", "Vertrag, Nachträge, Übergabeprotokolle und Schlüssel"],
    ["Vermieter & Schriftverkehr", "Anfragen, Antworten, Vereinbarungen und Nachweise"],
    ["Nebenkosten & Zahlungen", "Abrechnungen, Belege, Fristen und Klärungen"],
    ["Mängel & Reparaturen", "Meldung, Verlauf, Handwerker, Angebote und Rechnungen"],
  ] },
  vehicles: { icon: Car, title: "Fahrzeuge", text: "Für jedes Fahrzeug eine eigene Akte mit Dokumenten, Terminen, Kosten und Ereignishistorie.", items: [
    ["Fahrzeugpapiere", "Zulassung, Kaufvertrag und technische Unterlagen"],
    ["Werkstatt & Wartung", "Inspektion, Reparaturen, Teile und Rechnungen"],
    ["TÜV & Gutachten", "Prüftermine, Berichte und Fristen"],
    ["Versicherung", "Police, Beiträge, Schadenfälle und Schriftverkehr"],
  ] },
  purchases: { icon: ShoppingBag, title: "Käufe, Garantien und Geräte", text: "Objektakten für wichtige Anschaffungen – vom Kaufbeleg bis zum Garantie- oder Reparaturfall.", items: [
    ["Kauf & Rechnung", "Kaufdatum, Verkäufer, Betrag und Beleg"],
    ["Garantie", "Garantie bis, Bedingungen und Nachweise"],
    ["Reparatur & Service", "Fehler, Schriftverkehr, Kosten und Ergebnis"],
    ["Geräte & Technik", "Seriennummer, Zubehör, Anleitungen und Vertrag"],
  ] },
} as const;

function PreparedArea({ kind, onUpload, onGo, onDocuments }: { kind: keyof typeof preparedContent; onUpload: () => void; onGo: GehMitZiel; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void }) {
  const area = preparedContent[kind]; const Icon = area.icon;
  return <><PageTitle icon={<Icon/>} title={area.title} text={area.text}/>
    <InfoNotice title="Bereich für die schrittweise Befüllung vorbereitet"><p>Nicht vorhandene Inhalte werden nicht vermutet. Neue Originalunterlagen werden nur nach deinem bewussten Befehl abgelegt.</p></InfoNotice>
    <SubpageActions actions={menuPageActions[kind]} onGo={onGo} onDocuments={onDocuments}/>
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Neue Unterlage</h2><InfoPopover label="Neue Unterlage erklären" text={UI_HELP["Neue Unterlage"]}/></span></div><button className="button primary" onClick={onUpload}><Plus size={17}/> Unterlage hinzufügen</button></section>
    <section className="topic-list">{area.items.map(([title, text], index) => <button key={title} onClick={() => onDocuments({ query: preparedTopicQueries[title] || title, area: menuPageActions[kind][0]?.area || "" })}><span className="topic-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{text}</p></div><span className="badge neutral">Dokumente anzeigen</span><ChevronRight/></button>)}</section>
    <InfoNotice title="Angaben für eine verknüpfte Objektakte"><div className="field-chips"><span>Objekt / Person</span><span>Dokumentart</span><span>Datum</span><span>Frist / Termin</span><span>Garantie bis</span><span>Betrag</span><span>Status</span><span>Ereignisverlauf</span></div></InfoNotice>
  </>;
}

function Directory({ onGo }: { onGo: (id: SectionId) => void }) {
  return <><PageTitle icon={<BookOpen/>} title="Gesamtes Verzeichnis" text="Die vollständige Struktur der Familienakte – von den Hauptbereichen bis zu den vorbereiteten Unterthemen."/>
    <section className="directory-grid">{topNavigation.map((area) => <article className="directory-card" key={area.id}><button className="directory-title" onClick={() => onGo(area.landing)}><Folder/><span><strong>{area.label}</strong><small>Hauptbereich öffnen</small></span><ChevronRight/></button>{area.groups.map((group) => <div className="directory-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <button key={`${group.title}-${item.label}`} onClick={() => { onGo(item.id); if (item.kalender) window.setTimeout(() => meinKalenderOeffnen(), 450); }}><span>{item.label}</span><small>{item.detail}</small></button>)}</div>)}</article>)}</section>
  </>;
}

function DocumentLibraryAreaIcon({ area }: { area: string }) {
  if (["Gesundheit & Pflege", "Gesundheit"].includes(area)) return <HeartPulse aria-hidden="true"/>;
  if (["Auto & Mobilität", "Motorrad", "Fahrzeuge"].includes(area)) return <Car aria-hidden="true"/>;
  if (["Haus & Wohnung", "Garten & Grundstück", "Energie & Versorgung"].includes(area)) return <Home aria-hidden="true"/>;
  if (["Einkäufe, Rechnungen & Garantien", "Technik, Geräte & Reparaturen", "Käufe & Garantien"].includes(area)) return <PackageCheck aria-hidden="true"/>;
  if (["Steuern & Behörden", "Rente, Arbeit & Sozialversicherung"].includes(area)) return <Landmark aria-hidden="true"/>;
  if (["Versicherungen", "Finanzen & Konten", "Verträge & Abonnements"].includes(area)) return <ShieldCheck aria-hidden="true"/>;
  if (["Familie & persönliche Dokumente", "Erbschaft, Vollmachten & Vorsorge"].includes(area)) return <Users aria-hidden="true"/>;
  return <FileText aria-hidden="true"/>;
}

function DocumentLibraryCard({ item, fill, onFill, onWfpdf, onPro, onUebergabe, onTeilen, onOpen, onArea, onType, onDate, onReference }: {
  item: DocumentLibraryItem;
  /** Stufe H: Datei an eine andere App geben (Mail, Messenger, Dateien); nicht bei geschützten Gesundheitsunterlagen. */
  onTeilen?: () => Promise<void>;
  fill?: FillState;
  onFill?: () => void;
  onWfpdf?: () => void;
  onPro?: () => Promise<void>;
  onUebergabe?: (ziel: ProZiel) => Promise<void>;
  onOpen: () => void;
  onArea: () => void;
  onType: () => void;
  onDate: () => void;
  onReference: (reference: DocumentLibraryReference) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return <article className={`library-document-card ${item.sensitive ? "sensitive" : ""}`}><BspEcke id={item.id}/>
    <button className="library-preview" onClick={onOpen} aria-label={`${item.title} öffnen`}>
      {item.previewUrl && !imageFailed ? <img src={item.previewUrl} alt="" onError={() => setImageFailed(true)}/> : <DocumentLibraryAreaIcon area={item.area}/>}
      {item.protectedHealth && <span><LockKeyhole size={13}/> geschützt</span>}
    </button>
    <div className="library-document-copy">
      <div className="library-document-kicker"><button onClick={onArea}>{item.area}</button><button onClick={onType}>{item.documentType}</button></div>
      <button className="library-document-title" onClick={onOpen}>{item.title}</button>
      {item.source.dateiname && !item.protectedHealth && <small className="library-dateiname" data-dateiname>Datei: {item.source.dateiname}</small>}
      <div className="library-document-meta"><button onClick={onDate}>{item.date ? fmtDate(item.date) : "Ohne Dokumentdatum"}</button><button onClick={onOpen}>{statusLabel[item.status as keyof typeof statusLabel] || item.status}</button></div>
      <p>{item.description}</p>
      {item.source.storedPath && <DateiOrt storedPath={item.source.storedPath} ohneDateiname={item.protectedHealth}/>}
      {onPro && <ProDokumentKnopf onUebernehmen={onPro}/>}
      {onTeilen && !item.protectedHealth && <TeilenKnopf onTeilen={onTeilen}/>}
      {onUebergabe && !item.sensitive && <ProUebergabeKnopf onSenden={onUebergabe}/>}
      {fill && (fill.marke || fill.fuellbar) && <div className="af-karte" data-af-karte>{fill.fuellbar && onWfpdf && !item.sensitive && <button type="button" className="button secondary compact-button" onClick={onWfpdf} data-wfpdf-oeffnen><FileText size={15}/> In Workflow PDF öffnen</button>}{fill.marke && <span className={`badge af-marke af-marke-${fill.stand}`} data-af-marke>{fill.marke}</span>}{fill.fuellbar && onFill && <button type="button" className="button secondary compact-button" onClick={onFill} data-af-oeffnen><PenLine size={15}/> Ausfüllen</button>}</div>}
      {item.references.length > 0 && <div className="library-reference-list" aria-label="Verknüpfte Datensätze">{item.references.slice(0, 4).map((reference) => <button key={`${reference.type}-${reference.id}`} onClick={() => onReference(reference)}><span>{recordTypeDefinitions[reference.type].label}</span><strong>{reference.label}</strong></button>)}</div>}
    </div>
    <button className="library-card-open" onClick={onOpen} aria-label={`${item.title} öffnen`}><ChevronRight/></button>
  </article>;
}

/** Stufe H: „Teilen“ an der Unterlage – gibt die Datei an eine andere App (Android-Teilen-Fenster, Web Share, sonst Download). */
function TeilenKnopf({ onTeilen }: { onTeilen: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return <button type="button" className="button secondary compact-button" disabled={busy} data-dokument-teilen onClick={() => { setBusy(true); void onTeilen().finally(() => setBusy(false)); }}><Share2 size={15}/> {busy ? "Teilen …" : "Teilen"}</button>;
}

/** Kompakte Zeile der Bibliothek (2.28.39, Punkt 7): Datum · Titel · Bereich; Karten bleiben wählbar. */
function DocumentLibraryZeile({ item, gewaehlt, onWahl, onOpen, onArea, karte }: { item: DocumentLibraryItem; gewaehlt?: boolean; onWahl?: () => void; onOpen: () => void; onArea: () => void; karte?: React.ReactNode }) {
  const [auf, setAuf] = useState(false);
  return <><article className={`library-zeile${item.sensitive ? " sensitive" : ""}${gewaehlt ? " gewaehlt" : ""}`} data-bibliothek-zeile={item.id}><BspEcke id={item.id}/>
    {onWahl ? <AuswahlKaestchen an={!!gewaehlt} onWechsel={onWahl} titel={item.title} data-bibliothek-wahl={item.id}/> : <span className="auswahl-platz"/>}
    <span className="library-zeile-datum">{item.date ? fmtDate(item.date) : "ohne Datum"}</span>
    <button type="button" className="library-zeile-titel" onClick={onOpen} title={item.title}>{item.protectedHealth && <LockKeyhole size={13} aria-label="geschützt"/>}<FlachText text={item.title}/></button>
    <button type="button" className="library-zeile-bereich" onClick={onArea} title={`Alle aus „${item.area}“`}>{item.area}</button>
    {/* Auge wie in den übrigen Listen: klappt die volle Karte mit allen Knöpfen (Ausfüllen, Workflow PDF, Pro-Tresor …) darunter auf. */}
    {karte ? <AugeKnopf offen={auf} titel={item.title} onClick={() => setAuf(!auf)} data-bibliothek-auge={item.id}/> : <button type="button" className="icon-button library-zeile-auf" onClick={onOpen} aria-label={`${item.title} öffnen`}><ChevronRight size={17}/></button>}
  </article>{auf && karte && <div className="library-zeile-karte" data-bibliothek-karte={item.id}>{karte}</div>}</>;
}

type BibliothekSammel = {
  aussortieren: (ids: string[]) => Promise<AussortierErgebnis>;
  zurueckholen: (ids: string[]) => Promise<AussortierErgebnis>;
  /** Stufe B: Papierkorb leeren – nur Aussortiertes, nur nach Rückfrage. */
  loeschen: (ids: string[]) => Promise<LoeschErgebnis>;
  bereich: (ids: string[], bereich: string) => Promise<number>;
  person: (ids: string[], personId: string) => Promise<number>;
};

/** Ehrlicher Satz, wohin die Dateien gegangen sind (Pro-Tresor kann nicht verschieben). */
function aussortierText(r: AussortierErgebnis, zurueck: boolean) {
  const n = r.verschoben + r.nurArchiviert;
  return [
    `Gespeichert ✓ ${n} ${n === 1 ? "Dokument" : "Dokumente"} ${zurueck ? "wieder in der Akte" : "aus der Akte genommen"}.`,
    r.verschoben ? `${r.verschoben} ${r.verschoben === 1 ? "Datei liegt" : "Dateien liegen"} jetzt im Ordner „${zurueck ? "01_Dokumente" : "Aussortiert"}“.` : "",
    r.nurArchiviert ? (zurueck ? `${r.nurArchiviert} ${r.nurArchiviert === 1 ? "Datei blieb" : "Dateien blieben"} an ihrem Platz.` : `${r.nurArchiviert} ${r.nurArchiviert === 1 ? "Datei" : "Dateien"} konnte die App nicht verschieben (z. B. im gemeinsamen Pro-Tresor) – ${r.nurArchiviert === 1 ? "sie liegt" : "sie liegen"} unverändert an ${r.nurArchiviert === 1 ? "ihrem" : "ihrem"} Platz und ${r.nurArchiviert === 1 ? "ist" : "sind"} nur aus der Akte genommen.`) : "",
    r.altLiegtNoch ? `${r.altLiegtNoch} alte ${r.altLiegtNoch === 1 ? "Kopie liegt" : "Kopien liegen"} noch am bisherigen Ort.` : "",
  ].filter(Boolean).join(" ");
}

function DocumentLibrary({ documents, records, relations, initialFocusId, initialArea, initialQuery, navigation, fillStates, onFill, onWfpdf, onPro, onUebergabe, onTeilen, proKandidaten, onOpenDocument, onGo, onUpload, onUnlink, onChange, lokaleIds = new Set<string>(), aussortiert = [], bereichsWahl = [], sammel }: {
  navigation: PortalNavigation;
  /** Nur Dokumente im eigenen Datentresor sind für Sammelaktionen wählbar. */
  lokaleIds?: Set<string>;
  aussortiert?: LocalDocument[];
  bereichsWahl?: string[];
  sammel?: BibliothekSammel;
  documents: FamilyCockpitDocument[];
  fillStates: Record<string, FillState>;
  onFill: (id: string) => void;
  onWfpdf?: (id: string) => void;
  onPro?: (id: string) => Promise<void>;
  onUebergabe?: (id: string, ziel: ProZiel) => Promise<void>;
  onTeilen?: (id: string) => Promise<void>;
  proKandidaten?: Set<string>;
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  initialFocusId: string | null;
  initialArea: string;
  initialQuery: string;
  onOpenDocument: (id: string) => Promise<void>;
  onGo: (id: SectionId, targetId?: string) => void;
  onUpload: () => void;
  onUnlink: (relationId: string) => void | Promise<void>;
  onChange: (sourceType: ContextSourceType, sourceId: string, previousRelationId: string | null, caseId: string) => void | Promise<void>;
}) {
  const saved = navigation.readUi("library", { view: (initialFocusId || initialArea || initialQuery ? "all" : "overview") as "all" | "overview", query: initialQuery, area: initialArea, documentType: "", startDate: "", endDate: "", sort: "newest" as DocumentLibrarySort, anzahl: LISTEN_SEITE, ansicht: "zeilen" as "zeilen" | "karten" });
  const [ansicht, setAnsicht] = useState<"zeilen" | "karten">(saved.ansicht || "zeilen");
  const [view, setView] = useState(saved.view);
  const [query, setQuery] = useState(saved.query);
  const [area, setArea] = useState(saved.area);
  const [documentType, setDocumentType] = useState(saved.documentType);
  const [startDate, setStartDate] = useState(saved.startDate);
  const [endDate, setEndDate] = useState(saved.endDate);
  const [sort, setSort] = useState(saved.sort);
  const saveUi = navigation.saveUi;
  const items = useMemo(() => buildDocumentLibraryItems(documents, records, relations), [documents, records, relations]);
  const areas = useMemo(() => [...new Set(items.map((item) => item.area))].sort((a, b) => a.localeCompare(b, "de")), [items]);
  const documentTypes = useMemo(() => [...new Set(items.map((item) => item.documentType))].sort((a, b) => a.localeCompare(b, "de")), [items]);
  const visible = useMemo(() => filterDocumentLibraryItems(items, { query, area, documentType, startDate, endDate, sort }), [items, query, area, documentType, startDate, endDate, sort]);
  // Seitenweise: 50 je Seite, „Weitere anzeigen“; die Zahl bleibt beim Zurück erhalten.
  const [gezeigt, mehrZeigen] = useSeiten(visible.length, [query, area, documentType, startDate, endDate, sort].join("|"), saved.anzahl || LISTEN_SEITE);
  useEffect(() => { saveUi("library", { view, query, area, documentType, startDate, endDate, sort, anzahl: Math.max(gezeigt, LISTEN_SEITE), ansicht }); }, [saveUi, view, query, area, documentType, startDate, endDate, sort, gezeigt, ansicht]);
  // Mehrfachauswahl (Punkt 6/7): dieselbe Auswahl-Leiste wie im Eingang; gewählt werden nur sichtbare eigene Dokumente.
  const [wahl, setWahl] = useState<Set<string>>(() => new Set());
  const waehlbar = useMemo(() => sammel ? visible.slice(0, gezeigt).filter((item) => lokaleIds.has(item.id)).map((item) => item.id) : [], [sammel, visible, gezeigt, lokaleIds]);
  const gewaehlt = waehlbar.filter((id) => wahl.has(id));
  const wechsel = (id: string) => setWahl((alt) => { const neu = new Set(alt); if (neu.has(id)) neu.delete(id); else neu.add(id); return neu; });
  const [sammelForm, setSammelForm] = useState<"bereich" | "person" | null>(null);
  const [sammelWert, setSammelWert] = useState("");
  const [sammelLaeuft, setSammelLaeuft] = useState(false);
  const [sammelMeldung, setSammelMeldung] = useState<{ ok: boolean; text: string; wo: "liste" | "aussortiert" } | null>(null);
  const [rausWahl, setRausWahl] = useState<Set<string>>(() => new Set());
  const [papierkorb, setPapierkorb] = useState<string[] | null>(null);
  const personen = useMemo(() => records.filter((r) => r.recordType === "person" && r.status !== "archiviert").sort((a, b) => cockpitRecordLabel(a).localeCompare(cockpitRecordLabel(b), "de")), [records]);
  const fuehre = async (wo: "liste" | "aussortiert", arbeit: () => Promise<string>) => {
    setSammelLaeuft(true); setSammelMeldung(null);
    try { setSammelMeldung({ ok: true, text: await arbeit(), wo }); setWahl(new Set()); setRausWahl(new Set()); setSammelForm(null); setSammelWert(""); }
    catch (reason) { setSammelMeldung({ ok: false, text: reason instanceof Error ? reason.message : "Nicht gespeichert.", wo }); }
    finally { setSammelLaeuft(false); }
  };
  const aussortieren = async () => {
    if (!sammel || !gewaehlt.length) return;
    if (!await askConfirm(`${gewaehlt.length} ${gewaehlt.length === 1 ? "Dokument" : "Dokumente"} aus der Akte nehmen?\n\nNichts wird gelöscht: die ${gewaehlt.length === 1 ? "Datei wandert" : "Dateien wandern"} in den Ordner „Aussortiert“ und ${gewaehlt.length === 1 ? "steht" : "stehen"} unten unter „Aussortiert“ mit „Zurückholen“. Liegt ein Original im gemeinsamen Pro-Tresor, bleibt es dort an seinem Platz.`)) return;
    await fuehre("liste", async () => aussortierText(await sammel.aussortieren(gewaehlt), false));
  };
  const leiste = sammel && view === "all" ? <><AuswahlLeiste name="Dokumente" gesamt={waehlbar.length} gewaehlt={gewaehlt.length} onAlle={(alle) => setWahl(alle ? new Set(waehlbar) : new Set())}
    aktionen={[
      { key: "bereich", label: "Bereich ändern", disabled: sammelLaeuft, onClick: () => { setSammelForm("bereich"); setSammelWert(""); setSammelMeldung(null); } },
      { key: "person", label: "Person zuordnen", disabled: sammelLaeuft || !personen.length, title: personen.length ? undefined : "Noch keine Person angelegt", onClick: () => { setSammelForm("person"); setSammelWert(""); setSammelMeldung(null); } },
      { key: "aussortieren", label: "Aus der Akte nehmen", gefahr: true, disabled: sammelLaeuft, onClick: () => void aussortieren() },
    ]}>
    {sammelForm && gewaehlt.length > 0 && <form className="auswahl-form" data-sammel-form={sammelForm} onSubmit={(event) => { event.preventDefault(); if (!sammelWert) return; void fuehre("liste", async () => sammelForm === "bereich" ? `Gespeichert ✓ Bereich „${sammelWert}“ für ${await sammel.bereich(gewaehlt, sammelWert)} ${gewaehlt.length === 1 ? "Dokument" : "Dokumente"} gesetzt.` : `Gespeichert ✓ ${await sammel.person(gewaehlt, sammelWert)} ${gewaehlt.length === 1 ? "Dokument" : "Dokumente"} „${cockpitRecordLabel(personen.find((p) => p.id === sammelWert)!)}“ zugeordnet.`); }}>
      <label><span>{sammelForm === "bereich" ? "Neuer Bereich" : "Person"}</span><select value={sammelWert} onChange={(event) => setSammelWert(event.target.value)} data-sammel-wert><option value="">Bitte wählen</option>{sammelForm === "bereich" ? bereichsWahl.map((b) => <option key={b} value={b}>{b}</option>) : personen.map((p) => <option key={p.id} value={p.id}>{cockpitRecordLabel(p)}</option>)}</select></label>
      <button type="button" className="button secondary" onClick={() => setSammelForm(null)}>Abbrechen</button>
      <button type="submit" className="button primary" disabled={!sammelWert || sammelLaeuft} data-sammel-speichern>{sammelLaeuft ? "Wird gespeichert …" : "✓ Speichern"}</button>
    </form>}
  </AuswahlLeiste>{sammelMeldung?.wo === "liste" && <p className={sammelMeldung.ok ? "notiz-gespeichert" : "form-error"} role="status" data-bibliothek-meldung>{sammelMeldung.text}</p>}</> : null;
  const filterText = [area && `Bereich „${area}“`, documentType && `Art „${documentType}“`, query && `Suche „${query}“`, (startDate || endDate) && `Zeitraum ${startDate ? fmtDate(startDate) : "…"} bis ${endDate ? fmtDate(endDate) : "…"}`].filter(Boolean).join(" · ");
  const selected = initialFocusId ? items.find((item) => item.id === initialFocusId) || null : null;
  const grouped = useMemo(() => areas.map((name) => ({ name, items: filterDocumentLibraryItems(items, { area: name, sort: "newest" }) })).filter((group) => group.items.length), [areas, items]);
  const showAll = (next: Partial<{ area: string; documentType: string; startDate: string; endDate: string; query: string }> = {}) => {
    setSammelMeldung(null); setArea(next.area ?? ""); setDocumentType(next.documentType ?? ""); setStartDate(next.startDate ?? ""); setEndDate(next.endDate ?? ""); setQuery(next.query ?? ""); setSort("newest"); setView("all"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openItem = (item: DocumentLibraryItem) => item.protectedHealth ? onGo("health") : void onOpenDocument(item.id);
  const openReference = (reference: DocumentLibraryReference) => onGo(reference.sensitive ? "health" : reference.section as SectionId, reference.id);
  const zeile = (item: DocumentLibraryItem, mitWahl = false) => <DocumentLibraryZeile key={item.id} item={item} gewaehlt={wahl.has(item.id)} onWahl={mitWahl && sammel && lokaleIds.has(item.id) ? () => wechsel(item.id) : undefined} onOpen={() => openItem(item)} onArea={() => showAll({ area: item.area })} karte={card(item)}/>;
  const liste = (eintraege: DocumentLibraryItem[], mitWahl = false, kompakt = false) => ansicht === "zeilen" ? <section className="library-zeilen" data-bibliothek-ansicht="zeilen">{eintraege.map((item) => zeile(item, mitWahl))}</section> : <section className={`library-document-grid${kompakt ? " compact" : ""}`} data-bibliothek-ansicht="karten">{eintraege.map(card)}</section>;
  const umschalter = <div className="ansicht-umschalter" role="group" aria-label="Ansicht"><button type="button" aria-pressed={ansicht === "zeilen"} className={ansicht === "zeilen" ? "active" : ""} onClick={() => setAnsicht("zeilen")} data-ansicht="zeilen">Zeilen</button><button type="button" aria-pressed={ansicht === "karten"} className={ansicht === "karten" ? "active" : ""} onClick={() => setAnsicht("karten")} data-ansicht="karten">Karten</button></div>;
  const card = (item: DocumentLibraryItem) => <DocumentLibraryCard key={item.id} item={item} fill={fillStates[item.id]} onFill={() => onFill(item.id)} onWfpdf={onWfpdf ? () => onWfpdf(item.id) : undefined} onPro={onPro && proKandidaten?.has(item.id) ? () => onPro(item.id) : undefined} onUebergabe={onUebergabe ? (ziel) => onUebergabe(item.id, ziel) : undefined} onTeilen={onTeilen && lokaleIds.has(item.id) ? () => onTeilen(item.id) : undefined} onOpen={() => openItem(item)} onArea={() => showAll({ area: item.area })} onType={() => showAll({ documentType: item.documentType })} onDate={() => item.date ? showAll({ startDate: item.date, endDate: item.date }) : openItem(item)} onReference={openReference}/>;
  return <><PageTitle icon={<Archive/>} title="Dokumentenbibliothek" text="Der zentrale Zugang zu deinen bereits vorhandenen Dokumenten – aus demselben Datenbestand wie Cockpit, Vorgänge und „Was gibt’s Neues?“."/>
    <section className="library-toolbar card"><div className="library-suche-block"><label htmlFor="bibliothek-suche"><span><Search size={17}/> Dokumente durchsuchen</span></label><SuchFeld inputProps={{ id: "bibliothek-suche" }} className="library-search" value={query} onChange={(value) => { setQuery(value); setView("all"); }} placeholder="Titel, Dateiname, Person, Vorgang, Aktenzeichen …" ariaLabel="Dokumente durchsuchen" speechLabel="Dokumentensuche" clearLabel="Dokumentensuche löschen"/></div><div className="button-row"><button className="button secondary" onClick={() => showAll()}><Archive size={17}/> Alle ansehen</button><button className="button primary" onClick={onUpload}><Plus size={17}/> Neue Unterlage</button></div></section>
    <InfoNotice title="Datensparsame Dokumentvorschau"><p>Bei Gesundheits-, Behörden- und Finanzunterlagen werden keine lesbaren vertraulichen Miniaturen angezeigt. Gesundheitsdokumente öffnen den geschützten Gesundheitsbereich.</p></InfoNotice>
    {selected && <section className="library-selected"><div className="section-heading"><div><span className="eyebrow dark">Ausgewähltes Dokument</span><h2>Direkter Treffer</h2></div></div>{card(selected)}<section className="card"><RelatedContextPanel sourceType="document" sourceId={selected.id} documents={documents} records={records} relations={relations} onGo={onGo} onOpenDocument={onOpenDocument} onUnlink={onUnlink} onChange={onChange}/></section></section>}
    {view === "overview" ? <>
      <section className="section-heading"><div><span className="eyebrow dark">Zuletzt hinzugefügt oder bearbeitet</span><h2>Neueste Dokumente</h2></div><button className="text-link" onClick={() => showAll()}>Alle ansehen <ChevronRight size={17}/></button></section>
      {items.length ? <>{umschalter}{liste(filterDocumentLibraryItems(items, { sort: "updated" }).slice(0, 8))}</> : <section className="card empty-state"><Archive size={34}/><strong>Noch keine erreichbaren Dokumente</strong><span>Verbinde den lokalen Datentresor oder füge eine neue Unterlage hinzu. Es werden keine Beispieldokumente erfunden.</span><button className="button primary" onClick={onUpload}><Plus size={17}/> Unterlage hinzufügen</button></section>}
      {grouped.length > 0 && <><section className="section-heading"><div><span className="eyebrow dark">Nur vorhandene Bestände</span><h2>Dokumentbereiche</h2></div></section><section className="library-area-grid">{grouped.map((group) => <button key={group.name} onClick={() => showAll({ area: group.name })}><DocumentLibraryAreaIcon area={group.name}/><span><strong>{group.name}</strong><small>{group.items.length} Dokument{group.items.length === 1 ? "" : "e"} · Alle ansehen</small></span><ChevronRight/></button>)}</section>{grouped.map((group) => <section className="library-area-section" key={`group-${group.name}`}><div className="section-heading"><div><span className="eyebrow dark">{group.name}</span><h2>Aktuelle Dokumente</h2></div><button className="text-link" onClick={() => showAll({ area: group.name })}>Alle ansehen <ChevronRight size={17}/></button></div>{liste(group.items.slice(0, 3), false, true)}</section>)}</>}
    </> : <>
      <section className="card library-filters"><div className="card-heading"><div><span className="eyebrow dark">Vollständige Dokumentansicht</span><span className="ui-heading-help"><h2>Alle ansehen</h2><InfoPopover label="Alle ansehen erklären" text={UI_HELP["Alle ansehen"]}/></span></div><button className="text-link" onClick={() => { setView("overview"); setQuery(""); setArea(""); setDocumentType(""); setStartDate(""); setEndDate(""); }}>Zur Bibliotheksübersicht</button></div><div className="library-filter-grid"><label><span>Bereich</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="">Alle Bereiche</option>{area && !areas.includes(area) && <option value={area}>{area}</option>}{areas.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Dokumentart</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="">Alle Dokumentarten</option>{documentTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Von</span><DatumFeld value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label><label><span>Bis</span><DatumFeld value={endDate} onChange={(event) => setEndDate(event.target.value)}/></label><label><span>Sortierung</span><select value={sort} onChange={(event) => setSort(event.target.value as DocumentLibrarySort)}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="title">Titel A–Z</option><option value="area">Bereich</option><option value="updated">Zuletzt bearbeitet</option></select></label></div></section>
      <section className="news-result-heading"><div><span className="eyebrow dark">Gefilterter Bestand</span><h2>{visible.length} Dokument{visible.length === 1 ? "" : "e"}</h2></div><button className="badge neutral library-count-button" onClick={() => showAll()}>{visible.length} Datensätze anzeigen</button></section>
      {filterText && <p className="library-filter-active" data-filter-aktiv><span>Gefiltert nach {filterText}</span><button className="text-link" onClick={() => showAll()}>Filter aufheben</button></p>}
      {visible.length ? <>{umschalter}{leiste}{liste(visible.slice(0, gezeigt), true)}<WeitereAnzeigen gezeigt={gezeigt} gesamt={visible.length} onMehr={mehrZeigen}/></> : <section className="card empty-state"><Search size={34}/><strong>Keine passenden Dokumente gefunden</strong><span>Ändere Suche oder Filter. Die Bibliothek erfindet keine Treffer.</span><button className="button secondary" onClick={() => showAll()}>Filter zurücksetzen</button></section>}
    </>}
    {(aussortiert.length > 0 || sammelMeldung?.wo === "aussortiert") && <section className="card library-aussortiert" id="aussortiert" data-aussortiert={aussortiert.length}><details open={sammelMeldung?.wo === "aussortiert" || undefined}><summary><strong>Aussortiert ({aussortiert.length})</strong><small>aus der Akte genommen, nicht gelöscht</small></summary>
      {sammel && <AuswahlLeiste name="aussortierte Dokumente" gesamt={aussortiert.length} gewaehlt={aussortiert.filter((d) => rausWahl.has(d.id)).length} onAlle={(alle) => setRausWahl(alle ? new Set(aussortiert.map((d) => d.id)) : new Set())}
        aktionen={[{ key: "zurueckholen", haupt: true, disabled: sammelLaeuft, label: sammelLaeuft ? "Wird zurückgeholt …" : "Zurückholen", onClick: () => { const ids = aussortiert.filter((d) => rausWahl.has(d.id)).map((d) => d.id); void fuehre("aussortiert", async () => aussortierText(await sammel.zurueckholen(ids), true)); } },
          { key: "loeschen", gefahr: true, disabled: sammelLaeuft, label: "Endgültig löschen …", title: "Papierkorb leeren: nach Rückfrage endgültig entfernen", onClick: () => setPapierkorb(aussortiert.filter((d) => rausWahl.has(d.id)).map((d) => d.id)) }]}/>}
      {papierkorb && sammel && <PapierkorbLeerenDialog anzahl={papierkorb.length} onClose={() => setPapierkorb(null)} onLoeschen={async () => { const ids = papierkorb; setPapierkorb(null); await fuehre("aussortiert", async () => { const r = await sammel.loeschen(ids); setRausWahl(new Set()); return `${r.geloescht} ${r.geloescht === 1 ? "Dokument" : "Dokumente"} endgültig gelöscht, ${r.dateienEntfernt} ${r.dateienEntfernt === 1 ? "Datei" : "Dateien"} entfernt.${r.dateiBlieb.length ? ` Datei blieb liegen: ${r.dateiBlieb.join(", ")}.` : ""}${r.fehler.length ? ` ${r.fehler.join(" · ")}` : ""}`; }); }}/>}
      {sammelMeldung?.wo === "aussortiert" && <p className={sammelMeldung.ok ? "notiz-gespeichert" : "form-error"} role="status" data-aussortiert-meldung>{sammelMeldung.text}</p>}
      <div className="library-zeilen">{aussortiert.map((d) => { const titel = isSensitiveHealthText(d.originalName, d.category, d.notes) ? "Geschützte Gesundheitsunterlage" : visibleDocumentTitle(d); return <article className="library-zeile" key={d.id} data-aussortiert-zeile={d.id}>
        {sammel ? <AuswahlKaestchen an={rausWahl.has(d.id)} titel={titel} onWechsel={() => setRausWahl((alt) => { const neu = new Set(alt); if (neu.has(d.id)) neu.delete(d.id); else neu.add(d.id); return neu; })} data-aussortiert-wahl={d.id}/> : <span className="auswahl-platz"/>}
        <span className="library-zeile-datum">{d.documentDate ? fmtDate(d.documentDate) : "ohne Datum"}</span>
        <span className="library-zeile-titel"><FlachText text={titel}/></span>
        <small className="library-zeile-bereich">{d.aussortiert?.verschoben ? "im Ordner „Aussortiert“" : "Datei blieb an ihrem Platz"}</small>
      </article>; })}</div>
    </details></section>}
  </>;
}

function Inbox({ documents, localDocuments, loading, onUpload, onOpenDocument, onFill, onWfpdf, onRefresh, onStatus, onLocalStatus, busy, compact = false }: {
  onFill?: (id: string) => void;
  onWfpdf?: (id: string) => void;
  documents: UploadedDocument[]; localDocuments: LocalDocument[]; loading: boolean; compact?: boolean; onUpload: () => void; onOpenDocument: (id: string) => Promise<void>; onRefresh: () => void;
  onStatus: (id: string, status: UploadedDocument["status"]) => Promise<void>; onLocalStatus: (id: string, status: LocalDocument["status"]) => Promise<void>; busy: boolean;
}) {
  const [lokalGezeigt, lokalMehr] = useSeiten(localDocuments.length, "lokal");
  return <>
    {!compact && <PageTitle icon={<Upload/>} title="Eingangszentrale" text="Neue Unterlagen bleiben im lokalen Tresor auf deinem PC oder USB-Stick." />}
    <section className="card action-row"><div><h2>{compact ? "Übernommene Unterlagen" : "Neue Unterlage lokal hinzufügen"}</h2><p>{compact ? "Bereits bestätigte Eingänge erscheinen im gemeinsamen Dokumentregister." : "Die Originaldatei wird unverändert im gewählten Ordner gespeichert. Sie wird nicht an den Webserver übertragen."}</p></div><div className="button-row"><button className="button primary" onClick={onUpload}><Plus size={18}/> Einzelne Unterlage prüfen</button><button className="button secondary" onClick={onRefresh}><RefreshCw size={18}/> Neu laden</button></div></section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Lokale Unterlagen</h2><InfoPopover label="Lokale Unterlagen erklären" text={UI_HELP["Lokale Unterlagen"]}/></span></div><span className="badge success">{localDocuments.length} lokal</span></div>
      {localDocuments.length === 0 ? <div className="empty-state"><HardDrive size={34}/><strong>Noch keine lokale Unterlage</strong><span>Verbinde zuerst den lokalen Tresor im Sicherheitscenter.</span></div> : <div className="document-list">{localDocuments.slice(0, lokalGezeigt).map((item) => { const sensitive = isSensitiveHealthText(item.originalName, item.category, item.notes); return <article className="document-item" key={item.id}><div className="file-icon"><FileText size={22}/></div><div className="document-copy"><button className="document-title-link" onClick={() => void onOpenDocument(item.id)}>{visibleDocumentTitle(item)}</button><span>{sensitive ? "Geschützte Gesundheitsunterlage" : item.category} · {fmtDate(item.documentDate)} · {fmtBytes(item.sizeBytes)}</span>{sensitive ? <small>Speicherort und Einzelheiten sind nur im geschützten Gesundheitsbereich sichtbar.</small> : <><small>{istProOriginal(item.storedPath) ? "Gemeinsamer Pro-Tresor · Original verschlüsselt" : item.storedPath}</small>{item.notes && <small>{item.notes}</small>}</>}</div><span className={`badge status-${item.status}`}>{statusLabel[item.status]}</span>{!sensitive && ausfuellMarke(item) && <span className={`badge af-marke af-marke-${item.ausfuellen?.stand}`} data-af-marke>{ausfuellMarke(item)}</span>}<div className="document-actions">{onFill && fillStateOf(item).fuellbar && <button disabled={busy} onClick={() => onFill(item.id)} data-af-oeffnen>Ausfüllen</button>}{onWfpdf && !sensitive && fillStateOf(item).fuellbar && <button disabled={busy} onClick={() => onWfpdf(item.id)} data-wfpdf-oeffnen>In Workflow PDF öffnen</button>}{item.status === "hochgeladen" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "abgleich_offen")}>Abgleich vormerken</button>}{item.status === "abgleich_offen" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "geprüft")}>Als geprüft bestätigen</button>}{item.status === "geprüft" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "eingearbeitet")}>Als eingearbeitet bestätigen</button>}</div></article>; })}<WeitereAnzeigen gezeigt={lokalGezeigt} gesamt={localDocuments.length} onMehr={lokalMehr}/></div>}
    </section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Online-Altbestand</h2><InfoPopover label="Online-Altbestand erklären" text={UI_HELP["Online-Altbestand"]}/></span></div><span className="badge warning">{documents.length} online</span></div>
      {loading ? <div className="empty-state">Unterlagen werden geladen …</div> : documents.length === 0 ? <div className="empty-state"><FolderHeart size={34}/><strong>Noch keine Unterlage über diese Seite hochgeladen</strong><span>Bereits vorhandene Aktenbestandteile findest du unter „Unterlagen“.</span></div> : <div className="document-list">{documents.map((item) => { const sensitive = isSensitiveHealthText(item.originalName, item.category, item.notes); return <article className="document-item" key={item.id}><div className="file-icon"><FileText size={22}/></div><div className="document-copy"><button className="document-title-link" onClick={() => void onOpenDocument(item.id)}>{visibleDocumentTitle(item)}</button><span>{sensitive ? "Geschützte Gesundheitsunterlage" : item.category} · {fmtDate(item.documentDate)} · {fmtBytes(item.sizeBytes)}</span>{!sensitive && item.notes && <small>{item.notes}</small>}</div><span className={`badge status-${item.status}`}>{statusLabel[item.status]}</span><div className="document-actions"><a className="icon-button" href={item.downloadUrl} title="Originaldatei herunterladen"><Download size={18}/></a>{item.status === "hochgeladen" && <button disabled={busy} onClick={() => onStatus(item.id, "abgleich_offen")}>Abgleich vormerken</button>}{item.status === "abgleich_offen" && <button disabled={busy} onClick={() => onStatus(item.id, "geprüft")}>Als geprüft bestätigen</button>}{item.status === "geprüft" && <button disabled={busy} onClick={() => onStatus(item.id, "eingearbeitet")}>Als eingearbeitet bestätigen</button>}</div></article>; })}</div>}
    </section>
    <section className="card caution"><ShieldCheck size={23}/><div><h3>Sicherer Ablauf</h3><p>„Abgleich offen“ ist nur ein Arbeitsstatus. Erst nach Prüfung der Originalunterlage darf „geprüft“ und anschließend „eingearbeitet“ gewählt werden. Die Website stellt keine Diagnose und entscheidet nicht über Leistung, Entgeltfortzahlung oder Rente.</p></div></section>
  </>;
}

function SecurityCenter({ aktenHandle, onDokumente, onMeaningOpen, onProChange, proDestination = null, browserStorage = false, folderSelectionSupported = true, oneDriveConnected, oneDriveName, oneDriveSummary, localConnected, localVaultName, localVaultSummary, supported, onlineCount, localCount, busy, syncPreview, syncResult, onConnectOneDrive, onConnectLocal, onLockOneDrive, onLockLocal, onMigrate, onHelp, onCompare, onCheckSync, onRunSync, onExport, onFullBackup, onRestoreTest, onEinlesen, ordnerWahl = true, onEingang, letzteSicherung = null, hatDaten = false, laufwerkKarte = null }: {
  aktenHandle: FileSystemDirectoryHandle | null; onDokumente?: () => void;
  onMeaningOpen: (section: SectionId, targetId?: string) => void;
  onProChange?: () => void; proDestination?: ProDestination | null; browserStorage?: boolean; folderSelectionSupported?: boolean;
  oneDriveConnected: boolean; oneDriveName: string; oneDriveSummary: VaultSummary | null; localConnected: boolean; localVaultName: string; localVaultSummary: VaultSummary | null; supported: boolean; onlineCount: number; localCount: number; busy: boolean;
  syncPreview: VaultSyncPreview | null; syncResult: VaultSyncResult | null;
  onConnectOneDrive: () => void; onConnectLocal: () => void; onLockOneDrive: () => void; onLockLocal: () => void; onMigrate: () => void; onHelp: () => void; onCompare: () => void; onCheckSync: () => void; onRunSync: () => void; onExport: () => void; onFullBackup: () => void; onRestoreTest: () => void; onEinlesen: () => void; letzteSicherung?: string | null; hatDaten?: boolean; laufwerkKarte?: ReactNode;
  /** Ordner wählbar (native App oder Chrome/Edge am PC); sonst sind Sichern, Testen, Einlesen und Export hier nicht möglich (U2). */
  ordnerWahl?: boolean; onEingang?: () => void;
}) {
  const activeStorage = demoActive() ? "getrennte lokale Demobestand" : proDestination?.ready ? "gewählte Pro-Tresor" : oneDriveConnected ? "verbundene OneDrive-Ordner" : browserStorage ? "lokale Browserspeicher auf diesem Gerät" : "lokale PC-/USB-Tresor";
  const localFolderConnected = localConnected && !browserStorage;
  const vaultConnected = proDestination ? proDestination.ready : oneDriveConnected || localFolderConnected;
  const connectedVaultLabel = proDestination ? (proDestination.ready ? "Gewählter Pro-Tresor für Originalunterlagen" : "Gewählten Pro-Tresor verbinden und entsperren.") : oneDriveConnected
    ? (oneDriveName ? `OneDrive – ${oneDriveName}` : "OneDrive")
    : localFolderConnected
      ? (localVaultName ? `PC/USB – ${localVaultName}` : "PC/USB")
      : "";
  return <><PageTitle icon={<ShieldCheck/>} title="Sicherheit & lokaler Tresor" text="Du wählst, wo neue Originalunterlagen abgelegt werden. Die Familienakte lädt sie nicht in den Webspeicher dieser Seite hoch."/>
    <ProTresorAnschluss aktenHandle={aktenHandle} onChange={onProChange} onDokumente={onDokumente}/>
    <PrivateMeaningPanel handle={aktenHandle} onOpen={onMeaningOpen}/>
    <ProGeraetetransportPanel handle={aktenHandle} onEingang={onEingang}/>
    {!demoActive() && browserStorage && !proDestination && <section className="card browser-storage-notice"><span className="ui-heading-help"><h2>Lokaler Browserspeicher</h2><InfoPopover label="Lokaler Browserspeicher erklären" text="Deine bisherigen Unterlagen bleiben auf diesem Gerät gespeichert. Ein eigener Datentresor für Originalunterlagen ist noch nicht gewählt. Wähle unten einen eigenen Ordner oder oben in der Pro-App den gemeinsamen Pro-Tresor. Vorhandene Dateien werden nicht automatisch verschoben."/></span><span className="badge warning">Noch kein eigener Datentresor</span></section>}
    {demoActive() ? <section className="card demo-storage-card"><h2>Demo-Ablage</h2><span className={`badge ${localConnected ? "success" : "warning"}`}>{localConnected ? "Demo-Ablage bereit" : "Demo-Ablage wird vorbereitet"}</span><p>Die Beispieldateien liegen im getrennten lokalen Demobestand auf diesem Gerät. Dafür musst du keinen eigenen Datentresor anlegen oder verbinden.</p><p>Deinen eigenen Datentresor wählst du nach <strong>Demo verlassen</strong>. Seine Verbindung und Dateien bleiben von der Demo getrennt.</p></section> : <>
    <section className="security-grid security-grid-three">
      {(folderSelectionSupported || oneDriveConnected) && <article className="card security-card compact-security-card"><Cloud/><div><div className="security-card-heading"><h2>OneDrive-Ordner verbinden</h2><InfoPopover label="OneDrive-Verbindung erklären" text="Verbindet ausschließlich einen von dir gewählten, lokal synchronisierten OneDrive-Ordner. Die Familienakte erhält keinen Zugriff auf dein Microsoft-Passwort und durchsucht keine anderen OneDrive-Bereiche."/></div><span className={`badge ${oneDriveConnected ? "success" : "warning"}`}>{oneDriveConnected ? "verbunden" : "nicht verbunden"}</span><p>{oneDriveConnected ? oneDriveName : "Noch kein OneDrive-Ordner ausgewählt."}</p>{oneDriveSummary && <p className="vault-id"><strong>Tresor-Kennung:</strong> {oneDriveSummary.vaultId}</p>}<div className="button-row"><button className="button primary" disabled={!folderSelectionSupported || busy} onClick={onConnectOneDrive}><Cloud size={17}/>{oneDriveConnected ? "Anderen OneDrive-Ordner wählen" : "OneDrive-Ordner verbinden"}</button>{oneDriveConnected && <button className="button secondary" disabled={busy} onClick={onLockOneDrive}><LockKeyhole size={17}/> Sperren</button>}</div>{!folderSelectionSupported && <p>Eine lokale OneDrive-Ordnerwahl benötigt Chrome oder Edge am PC.</p>}</div></article>}
      <article className="card security-card compact-security-card" data-hilfe-ziel="datentresor"><Usb/><div><div className="security-card-heading"><h2>PC-/USB-Ordner verbinden</h2><InfoPopover label="PC- oder USB-Verbindung erklären" text="Verbindet einen ausdrücklich ausgewählten PC-Ordner oder entsperrten USB-Datenträger. Dateien werden nur nach deinem Befehl gelesen oder als Sicherung kopiert; vorhandene Originale werden nicht überschrieben."/></div><span className={`badge ${localFolderConnected ? "success" : "warning"}`}>{localFolderConnected ? "verbunden" : "nicht verbunden"}</span><p>{localFolderConnected ? localVaultName : "Noch kein PC-/USB-Ordner ausgewählt."}</p>{localFolderConnected && localVaultSummary && <p className="vault-id"><strong>Tresor-Kennung:</strong> {localVaultSummary.vaultId}</p>}<div className="button-row"><button className="button primary" disabled={!folderSelectionSupported || busy} onClick={onConnectLocal}><Usb size={17}/>{localFolderConnected ? "Anderen PC-/USB-Ordner wählen" : "PC-/USB-Ordner verbinden"}</button>{localFolderConnected && <button className="button secondary" disabled={busy} onClick={onLockLocal}><LockKeyhole size={17}/> Sperren</button>}</div>{!folderSelectionSupported && <p>Für einen eigenen Geräte-, SD- oder USB-Tresor nutze in der Pro-App den Abschnitt „Gemeinsamer Pro-Tresor“. Eine PC-Ordnerwahl benötigt Chrome oder Edge am PC.</p>}</div></article>
      <article className="card security-card compact-security-card security-compare-card"><ClipboardCheck/><div><div className="security-card-heading"><h2>Datentresor prüfen</h2><InfoPopover label="Datentresor prüfen erklären" text="Zeigt den tatsächlich verbundenen Datentresor und prüft ihn selbst (das ist kein Abgleich mit anderen Geräten): Register lesbar, jede registrierte Originaldatei vorhanden und unverändert (Größe und Prüfsumme). Es wird nichts verändert. Einen getrennten Ordner, etwa einen alten Dokumentenbestand, prüfst du am PC unter Dokumente → Bestand prüfen."/></div><span className={`badge ${vaultConnected ? "success" : "warning"}`}>{vaultConnected ? "Datentresor verbunden" : "Datentresor nicht verbunden"}</span><p>{vaultConnected ? connectedVaultLabel : (proDestination ? connectedVaultLabel : "Noch kein eigener Datentresor gewählt.")}</p><div className="button-row">{vaultConnected ? <button className="button primary" disabled={!supported || busy} onClick={onCompare}><ClipboardCheck size={17}/> Datentresor jetzt prüfen</button> : <button className="button primary" disabled={!folderSelectionSupported || busy} onClick={onConnectLocal}><HardDrive size={17}/> Eigenen Datentresor wählen</button>}<button className="button secondary" onClick={onHelp}><HelpCircle size={17}/> Hilfe</button></div></div></article>
    </section>
    </>}
    <section className="security-grid security-grid-two security-action-grid">
      <article className="card security-action-card" data-hilfe-ziel="vollsicherung"><div className="security-card-heading"><h2>Familienakte vollständig sichern und testen</h2><InfoPopover label="Vollständige Sicherung erklären" text="Erstellt nach deinem ausdrücklichen Befehl eine vollständige Sicherung von Register, Datensätzen, Verknüpfungen, Tagebuch-Einträge, Medien, Aufgaben, Fristen und freigegebenen Originaldateien in einem frei gewählten Ordner – verschlüsselt mit Passwort und Notfallblatt (empfohlen) oder lesbar. Zwei Wege zurück: „Wiederherstellung testen“ ist nur eine Probe in einen leeren Testordner und holt nichts in die Akte. „Sicherung einlesen“ holt eine Sicherung zurück: in eine leere Akte ganz, in eine benutzte Akte zusammengeführt – Neues kommt dazu, bei Unterschieden wählst du, gelöscht wird nichts."/></div><div className="button-row"><button className="button primary" disabled={!supported || !ordnerWahl || busy || (!oneDriveConnected && !localConnected)} onClick={onFullBackup}><Usb size={17}/> Vollständige Sicherung erstellen</button><button className="button primary" disabled={!supported || !ordnerWahl || busy} onClick={onRestoreTest}><ClipboardCheck size={17}/> Wiederherstellung testen</button><button className="button secondary" data-sicherung-einlesen-knopf disabled={!supported || !ordnerWahl || busy} onClick={onEinlesen}><Download size={17}/> Sicherung einlesen</button></div><SicherungErinnerung letzte={letzteSicherung} hatDaten={hatDaten} onSichern={onFullBackup} kompakt/>{letzteSicherung && <p className="fine-print" data-letzte-sicherung>Letzte Vollsicherung: {new Date(letzteSicherung).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}.</p>}{ordnerWahl ? <p className="fine-print" data-zwei-wege>„Wiederherstellung testen“ prüft nur in einem leeren Testordner und holt nichts in die Akte. „Sicherung einlesen“ holt die Akte zurück oder führt sie mit deiner zusammen.</p> : <p className="sync-message warning" data-sicherung-nicht-hier>Hier nicht möglich: Die Web-App kann auf diesem Gerät keinen Ordner wählen. Sichern, Testen und Einlesen gehen in der Pro-App (Android, Windows) oder am PC in Chrome oder Edge.</p>}</article>
      {laufwerkKarte}
      <article className="card security-action-card"><div className="security-card-heading"><h2>Familienakte exportieren</h2><InfoPopover label="Export erklären" text="Bereitet die vorhandene Exportfunktion vor. Du wählst Bereiche und Zielordner bewusst aus und siehst vor dem Start Umfang, Originaldateien und Speicherstatus. Es wird kein Export vorgetäuscht oder automatisch gestartet."/></div><button className="button primary" disabled={!supported || !ordnerWahl || busy} onClick={onExport}><Download size={17}/> Export vorbereiten</button>{!ordnerWahl && <p className="sync-message warning" data-export-nicht-hier>Hier nicht möglich: Exportieren geht in der Pro-App oder am PC in Chrome oder Edge.</p>}</article>
    </section>
    {!demoActive() && (folderSelectionSupported || oneDriveConnected) && <section className="card backup-sync"><div className="backup-sync-head"><div><span className="ui-heading-help"><h2>OneDrive auf PC oder USB sichern</h2><InfoPopover label="OneDrive auf PC oder USB sichern erklären" text={UI_HELP["OneDrive auf PC oder USB sichern"]}/></span></div><ShieldCheck size={36}/></div>
      <div className="backup-steps"><span><b>1</b> Beide Ordner verbinden</span><span><b>2</b> Fehlende Dateien suchen</span><span><b>3</b> Kopieren ausdrücklich bestätigen</span></div>
      <div className="button-row"><button className="button primary" disabled={!oneDriveConnected || !localFolderConnected || busy} onClick={onCheckSync}>{busy ? "Prüfung läuft …" : "Fehlende Dateien suchen"}</button>{syncPreview && syncPreview.missingDocuments > 0 && <button className="button secondary" disabled={busy} onClick={onRunSync}><Usb size={17}/> {syncPreview.missingDocuments} fehlende Datei{syncPreview.missingDocuments === 1 ? "" : "en"} jetzt sichern</button>}</div>
      {(!oneDriveConnected || !localFolderConnected) && <p className="sync-message warning">Dafür müssen der OneDrive-Ordner und ein getrennter PC-/USB-Ordner verbunden sein.</p>}
      {syncPreview && <div className={`sync-message ${syncPreview.conflictingDocuments ? "error" : "success"}`}><strong>Prüfergebnis:</strong> {syncPreview.existingDocuments} bereits vorhanden, {syncPreview.missingDocuments} noch zu sichern{syncPreview.conflictingDocuments ? `, ${syncPreview.conflictingDocuments} widersprüchlich und deshalb nicht kopierbar` : ""}. Es wurde noch nichts verändert.</div>}
      {syncResult && <div className="sync-message success"><strong>Letzte Sicherung abgeschlossen:</strong> {syncResult.copiedDocuments} kopiert, {syncResult.skippedDocuments} bereits vorhanden. Zeitpunkt: {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(syncResult.completedAt))}.</div>}
      <p className="fine-print">Sicherheitsregel: Keine Datei wird gelöscht. Vorhandene Dateien werden nicht überschrieben. Bei widersprüchlichen Registereinträgen stoppt die Übernahme für diese Datei.</p>
    </section>}
    {onlineCount > 0 && <section className="card action-row"><div><h2>Online-Altbestand lokal sichern</h2><p>{onlineCount} bisher online gespeicherte Datei{onlineCount === 1 ? "" : "en"}; {localCount} Einträge befinden sich im aktiven Register. Ziel ist der {activeStorage}. Bei der Sicherung wird nichts online gelöscht.</p></div><button className="button primary" disabled={!(oneDriveConnected || localConnected) || busy || !onlineCount} onClick={onMigrate}>{busy ? "Sicherung läuft …" : "Online-Bestand lokal kopieren"}</button></section>}
    {onlineCount > 0 && <section className="card caution"><ShieldCheck size={23}/><div><h3>Wichtig vor dem Löschen</h3><p>Erst wenn du die lokalen Dateien auf dem PC oder USB-Stick geprüft hast, können die bisherigen Online-Kopien in einem zweiten Schritt gelöscht werden. Auch die derzeitige Gesundheitsübersicht der Website enthält noch personenbezogene Angaben und muss für eine vollständig lokale Lösung später ebenfalls in den Tresor verlagert werden.</p></div></section>}
    <section className="card rules"><div><CheckCircle2/><span><strong>Ordnerfreigabe</strong><small>Der Browser sieht nur den Ordner, den du selbst auswählst.</small></span></div><div><CheckCircle2/><span><strong>USB-Verschlüsselung</strong><small>BitLocker oder VeraCrypt außerhalb der Website entsperren.</small></span></div><div><CheckCircle2/><span><strong>Lokales Register</strong><small>Familienakte_Register.json wird neben den Dokumenten gespeichert.</small></span></div><div><CheckCircle2/><span><strong>Keine automatische Cloud-Löschung</strong><small>Online-Dateien bleiben bis zu deiner ausdrücklichen Freigabe erhalten.</small></span></div></section>
  </>;
}

const cockpitRecordTypeLabel: Record<string, string> = {
  person: "Person", organisation: "Organisation", object: "Objekt", case: "Vorgang", document: "Dokument", deadline: "Frist", task: "Aufgabe", reminder: "Erinnerung", event: "Termin / Ereignis", payment: "Kosten", contract: "Vertrag", warranty: "Garantie",
};

function CockpitTodoRow({ item, onOpen, onStatus }: { item: CockpitTodoItem; onOpen: () => void; onStatus: (status: LocalScheduleStatus) => Promise<boolean | void> }) {
  const normalized = (["offen", "in_bearbeitung", "wartet_auf_antwort", "zurückgestellt", "erledigt"].includes(item.status) ? item.status : "offen") as LocalScheduleStatus;
  const [nextStatus, setNextStatus] = useState<LocalScheduleStatus>(normalized);
  const [busy, setBusy] = useState(false);
  const apply = async () => { if (nextStatus === normalized) return; setBusy(true); await onStatus(nextStatus); setBusy(false); };
  return <article className={`cockpit-todo urgency-${item.displayStatus === "overdue" ? "overdue" : item.dueAt && isDateToday(item.dueAt) ? "today" : item.displayStatus === "dueSoon" ? "dueSoon" : "open"}`}><BspEcke id={item.id}/>
    <button className="cockpit-todo-main" onClick={onOpen}><span className={`priority-dot urgency-${item.displayStatus === "overdue" ? "overdue" : item.dueAt && isDateToday(item.dueAt) ? "today" : item.displayStatus === "dueSoon" ? "dueSoon" : "open"}`}/><span><strong>{item.title}</strong><small>{item.dueAt ? `Fällig: ${fmtDate(item.dueAt.slice(0, 10))}` : "Ohne Fälligkeitsdatum"} · Priorität {item.priority}</small><small>{item.references.length ? item.references.map((reference) => reference.label && reference.label !== reference.id ? `${cockpitRecordTypeLabel[reference.type]} „${reference.label}“` : cockpitRecordTypeLabel[reference.type]).join(" · ") : "Noch ohne weitere Zuordnung"}</small></span></button>
    <div className="cockpit-status-control"><label><span>Status</span><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as LocalScheduleStatus)}><option value="offen">offen</option><option value="in_bearbeitung">in Bearbeitung</option><option value="wartet_auf_antwort">wartet auf Antwort</option><option value="zurückgestellt">zurückgestellt</option><option value="erledigt">erledigt</option></select></label><button className="button secondary" disabled={busy || nextStatus === normalized} onClick={apply}>{busy ? "Wird gespeichert …" : "Status bestätigen"}</button></div>
  </article>;
}

/** Meldung „✓ erledigt … Rückgängig“ an der Stelle (Vorschau E). */
function ErledigtMeldung({ titel, jetzt, wo, onRueckgaengig }: { titel: string; jetzt: string; wo: string; onRueckgaengig: () => void }) {
  return <p className="erledigt-meldung" role="status" data-erledigt-meldung><Check size={16}/><span><strong>{jetzt === "zurückgestellt" ? "Zurückgestellt" : "Erledigt"}:</strong> <FlachText text={titel}/> <small>{wo}</small></span><button type="button" className="button secondary" onClick={onRueckgaengig} data-erledigt-rueckgaengig>Rückgängig</button></p>;
}
function terminTag(r: FamilyRecordUnion) { const d = r.data as { dueAt?: string; remindAt?: string }; const t = String(d.dueAt || d.remindAt || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null; }
const kurzZeit = (iso: string) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
/** Zweite Zeile einer Verknüpfung: bei Terminen Tag und Stand statt nur der Kennung. */
/** Sichtbarer Name eines verknüpften Eintrags statt seiner Kennnummer (2.28.39, Punkt 8). */
function bezugName(type: FamilyRecordType, id: string, records: FamilyRecordUnion[], documents: LocalDocument[]) {
  if (type === "document") { const d = documents.find((x) => x.id === id); return d ? visibleDocumentTitle(d) : "Dokument"; }
  const r = records.find((x) => x.id === id);
  if (!r) return "nicht mehr vorhanden";
  const label = cockpitRecordLabel(r);
  return label === r.id ? recordTypeDefinitions[type].label : label;
}
/** B7 (09.11.): Quelle mit Namen statt interner Kennnummer („EVENT-000005“) und Sprung dorthin. */
function quelleAnzeige(source: string | null | undefined, records: FamilyRecordUnion[], documents: LocalDocument[]): { text: string; ziel?: MenuTarget } | null {
  const s = String(source || "").trim();
  if (!s) return null;
  const d = documents.find((x) => x.id === s);
  if (d) return { text: `Aus der Unterlage „${visibleDocumentTitle(d)}“`, ziel: { section: "documents", targetId: d.id } as MenuTarget };
  const r = records.find((x) => x.id === s);
  if (r) {
    const ziel = datensatzZiel(records, r.recordType, r.id);
    if (r.recordType === "event") { const at = String((r.data as { eventAt?: string }).eventAt || r.createdAt || "").slice(0, 10); return { text: `Aus deiner Notiz${at ? ` vom ${fmtDate(at)}` : ""}`, ziel }; }
    return { text: `Aus ${recordTypeDefinitions[r.recordType]?.label || "Eintrag"} „${bezugName(r.recordType, r.id, records, documents)}“`, ziel };
  }
  if (s === "Tagebuch & Erinnerungsprotokoll") return { text: "Tagebuch" };
  // Eine Kennnummer ohne Datensatz (gelöscht) zeigt nichts; freie Angaben („Lokaler Datentresor“, „Kalender“) bleiben lesbar.
  if (/^[A-Z]{2,}[-_]\d{3,}/.test(s)) return null;
  return { text: s };
}
/**
 * C (Rückmeldung 09.11., Klaus c3): Tagebuch-Einträge, die mit derselben Person oder Organisation verknüpft sind, stehen beim
 * Termin oder in der Akte wieder da („Aus deinem Tagebuch“) – nicht in der Glocke. Neueste zuerst, höchstens drei.
 */
function tagebuchZu(id: string, records: FamilyRecordUnion[], relations: FamilyRelation[]) {
  const nachbarn = (x: string) => relations.flatMap((r) => r.fromId === x ? [r.toId] : r.toId === x ? [r.fromId] : []);
  const r = records.find((x) => x.id === id);
  if (!r) return [];
  const stamm = r.recordType === "person" || r.recordType === "organisation" ? [id] : nachbarn(id).filter((n) => records.some((x) => x.id === n && (x.recordType === "person" || x.recordType === "organisation")));
  if (!stamm.length) return [];
  const ereignisse = new Set(stamm.flatMap(nachbarn));
  return records.filter((x) => ereignisse.has(x.id) && isMemoryRecord(x) && x.id !== id && x.status !== "archiviert" && !memoryData(x)?.sensitive)
    .sort((a, b) => String(memoryData(b)?.eventAt).localeCompare(String(memoryData(a)?.eventAt))).slice(0, 3);
}
function TagebuchHinweise({ id, records, relations, onGo }: { id: string; records: FamilyRecordUnion[]; relations: FamilyRelation[]; onGo: (id: SectionId, targetId?: string) => void }) {
  const liste = tagebuchZu(id, records, relations);
  if (!liste.length) return null;
  return <div className="tagebuch-hinweise" data-tagebuch-hinweise>
    <span className="kicker-klein">Aus deinem Tagebuch</span>
    {liste.map((e) => { const d = memoryData(e)!; const text = (d.originalText || d.title || "").replace(/\s+/g, " ").trim(); return <button key={e.id} type="button" className="text-link" onClick={() => onGo("memory", e.id)} data-tagebuch-hinweis={e.id}><span>{text.length > 140 ? `${text.slice(0, 140)} …` : text}</span><small>{fmtDate(String(d.eventAt).slice(0, 10))}</small></button>; })}
  </div>;
}
function QuelleZeile({ source, records, documents, onGo }: { source?: string | null; records: FamilyRecordUnion[]; documents: LocalDocument[]; onGo: (id: SectionId, targetId?: string) => void }) {
  const q = quelleAnzeige(source, records, documents);
  if (!q) return null;
  return q.ziel ? <button type="button" className="text-link quelle-link" onClick={() => onGo(q.ziel!.section as SectionId, q.ziel!.targetId)} data-quelle>{q.text} ›</button> : <small data-quelle>Quelle: {q.text}</small>;
}
function referenzKurz(reference: CockpitReference, records: FamilyRecordUnion[]) {
  const r = records.find((x) => x.id === reference.id);
  if (!r || reference.sensitive) return "";
  if (istStammArt(r.recordType)) return stammLesen(r).art;
  if (!["task", "deadline", "reminder"].includes(r.recordType)) return "";
  const tag = terminTag(r);
  return [tag ? fmtDate(tag) : "", r.status === "offen" ? "" : r.status.replaceAll("_", " ")].filter(Boolean).join(" · ");
}
/** Aufgeklappter Teil einer Verknüpfung (Vorschau B): das Wichtigste ohne Seitenwechsel. */
function referenzDetail(reference: CockpitReference, records: FamilyRecordUnion[], vorgabe: ErinnerungsWahl[]) {
  if (reference.sensitive) return <small>Einzelheiten nur im geschützten Gesundheitsbereich.</small>;
  const r = records.find((x) => x.id === reference.id);
  if (!r) return <small>{cockpitRecordTypeLabel[reference.type] || "Dokument"} · {reference.label}</small>;
  const tag = terminTag(r);
  // B6: Titel und Art stehen schon auf dem Knopf darüber – hier nur, was neu ist.
  return <><small>{[tag ? fmtDate(tag) : "", r.status.replaceAll("_", " ")].filter(Boolean).join(" · ")}</small>{["task", "deadline", "reminder"].includes(r.recordType) && <TerminErinnerungen record={r} vorgabe={vorgabe} kurz/>}{r.notes && <small>{r.notes}</small>}</>;
}
/** Vorschau A: alle Erinnerungen einer Aufgabe/Frist, kommende oben, vergangene durchgestrichen unten. */
function TerminErinnerungen({ record, vorgabe, kurz = false }: { record: FamilyRecordUnion; vorgabe: ErinnerungsWahl[]; kurz?: boolean }) {
  const fertig = ["erledigt", "zurückgestellt", "archiviert"].includes(record.status);
  if (record.recordType === "reminder") {
    const at = String((record.data as { remindAt?: string }).remindAt || "");
    return at ? <div className="dossier-erinnerungen-box" data-termin-erinnerungen={record.id}>{!kurz && <h3>Erinnerung</h3>}<ul className="dossier-erinnerungen"><li className={fertig ? "vorbei" : undefined}><strong>🔔 {fmtDate(at.slice(0, 10))}, {at.length > 10 ? at.slice(11, 16) : "09:00"} Uhr</strong><small>{record.status}</small></li></ul></div> : null;
  }
  const zeiten = erinnerungsZeiten(record, vorgabe);
  const jetzt = Date.now();
  const vorbei = (um: string) => fertig || Date.parse(um) <= jetzt;
  const liste = [...zeiten.filter((z) => !vorbei(z.um)), ...zeiten.filter((z) => vorbei(z.um))];
  return <div className="dossier-erinnerungen-box" data-termin-erinnerungen={record.id}>{!kurz && <h3>Erinnerungen dieser {record.recordType === "deadline" ? "Frist" : "Aufgabe"}</h3>}
    {liste.length ? <ul className="dossier-erinnerungen">{liste.map((z) => <li key={z.wahl} className={vorbei(z.um) ? "vorbei" : undefined} data-erinnerung-zeit={z.wahl}><strong>🔔 {kurzZeit(z.um)} Uhr</strong><small>{erinnerungsName(z.wahl)}{z.vorgabe ? " · Vorgabe" : ""}{vorbei(z.um) ? " · vorbei" : ""}</small></li>)}</ul> : <small>🔕 ohne Erinnerung</small>}
  </div>;
}

function isDateToday(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function InteractiveCockpit({ documents, localDocuments, records, relations, decisions, initialFocusId, navigation, onGo, onOpenDocument, onFill, onTaskStatus, onTaskStatusDirekt, vaultHandle = null, onRefresh, onNotice, onAddNote, onSaveContact, onAssistant, onConfirmContext, onRejectContext, onAddMemoryToCase, onAddDocumentToCase }: {
  navigation: PortalNavigation;
  documents: UploadedDocument[];
  localDocuments: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  decisions: ContextLinkDecision[];
  initialFocusId: string | null;
  onGo: (id: SectionId, targetId?: string) => void;
  onOpenDocument: (id: string) => Promise<void>;
  onFill: (id: string) => void;
  onTaskStatus: (id: string, status: LocalScheduleStatus) => Promise<boolean | void>;
  onTaskStatusDirekt?: (id: string, status: LocalScheduleStatus) => Promise<boolean>;
  vaultHandle?: FileSystemDirectoryHandle | null;
  onRefresh?: () => Promise<void>;
  onNotice?: (notice: Notice) => void;
  onAddNote: (id: string, note: string) => Promise<boolean>;
  onSaveContact?: (id: string, kontakt: PersonKontakt) => Promise<boolean>;
  onAssistant: (caseId: string) => void;
  onConfirmContext: (sourceType: ContextSourceType, sourceId: string, caseId: string, reason?: string) => void | Promise<void>;
  onRejectContext: (suggestion: ContextLinkSuggestion) => void | Promise<void>;
  onAddMemoryToCase: (caseId: string) => void;
  onAddDocumentToCase: (caseId: string) => void;
}) {
  const modelDocuments = useMemo(() => cockpitDocuments(documents, localDocuments), [documents, localDocuments]);
  const input = useMemo(() => ({ records, relations, documents: modelDocuments, versions: versionHistory, now: new Date() }), [records, relations, modelDocuments]);
  const snapshotAlle = useMemo(() => buildFamilyCockpit(input), [input]);
  // „Im Cockpit anzeigen“ aus einem Bereich (2.28.39): Ziel „bereich:<seite>“ filtert die Listen, „Alle anzeigen“ hebt auf.
  const bereich = cockpitBereichAus(initialFocusId);
  const snapshot = useMemo(() => {
    if (!bereich) return snapshotAlle;
    const passt = (eintrag: { section?: string; sensitive?: boolean; text: string }) => passtZumBereich(bereich, eintrag);
    const refs = (liste: CockpitReference[]) => liste.map((r) => r.label).join(" ");
    return {
      ...snapshotAlle,
      priorities: snapshotAlle.priorities.filter((p) => passt({ section: p.section, sensitive: p.sensitive, text: `${p.title} ${p.detail}` })),
      todos: snapshotAlle.todos.filter((t) => passt({ sensitive: t.sensitive, text: `${t.title} ${refs(t.references)}` }) || t.references.some((r) => passt({ section: r.section, sensitive: r.sensitive, text: r.label }))),
      cases: snapshotAlle.cases.filter((c) => passt({ sensitive: c.sensitive, text: `${c.title} ${refs([...c.persons, ...c.objects, ...c.organisations, ...c.documents])}` })),
      objects: snapshotAlle.objects.filter((o) => passt({ sensitive: o.sensitive, text: `${o.title} ${o.objectType}` })),
      relevantNews: snapshotAlle.relevantNews.filter((n) => passt({ text: JSON.stringify(n) })),
    };
  }, [snapshotAlle, bereich?.id]);
  const contextInput = useMemo(() => ({ documents: contextDocuments(documents, localDocuments), records, relations, decisions }), [documents, localDocuments, records, relations, decisions]);
  const contextSuggestions = useMemo(() => buildContextLinkSuggestions(contextInput).filter((item) => !item.sensitive), [contextInput]);
  const selectedId = bereich ? null : initialFocusId;
  const [note, setNote] = useState(() => navigation.readUi("cockpit-note", ""));
  const saveUi = navigation.saveUi;
  useEffect(() => { saveUi("cockpit-note", note); }, [saveUi, note]);
  // Zum Detail rollt der gemeinsame Sprungweg (app/sprung.ts, Ziel #cockpit-dossier) – kein Zeitgeber mehr.
  const [savingNote, setSavingNote] = useState(false);
  const dossier = useMemo(() => selectedId ? buildCockpitDossier(input, selectedId) : null, [input, selectedId]);
  // Vorschau B: Tipp auf Verknüpftes klappt an Ort und Stelle auf; „Eigene Seite ›“ öffnet ganz.
  const [aufRef, setAufRef] = useState<string | null>(null);
  useEffect(() => { setAufRef(null); }, [selectedId]);
  // Vorschau C: Aufgabe/Frist/Erinnerung bekommen ✓ ✎ 🗑 „Im Kalender ›“; ✎ öffnet das Fenster hier.
  const [aendernId, setAendernId] = useState<string | null>(null);
  const aendernRecord = aendernId ? records.find((r) => r.id === aendernId) || null : null;
  // Vorschau E: „Erledigt“ bleibt einige Sekunden mit „Rückgängig“ stehen.
  const [zuletzt, setZuletzt] = useState<{ id: string; titel: string; vorher: LocalScheduleStatus; jetzt: LocalScheduleStatus } | null>(null);
  useEffect(() => { if (!zuletzt) return; const t = window.setTimeout(() => setZuletzt(null), 8000); return () => window.clearTimeout(t); }, [zuletzt]);
  const statusMitRueckgaengig = async (id: string, titel: string, vorher: string, jetzt: LocalScheduleStatus, direkt: boolean) => {
    const ok = direkt && onTaskStatusDirekt ? await onTaskStatusDirekt(id, jetzt) : await onTaskStatus(id, jetzt);
    if (ok !== false && (jetzt === "erledigt" || jetzt === "zurückgestellt")) setZuletzt({ id, titel, vorher: (["offen", "in_bearbeitung", "wartet_auf_antwort"].includes(vorher) ? vorher : "offen") as LocalScheduleStatus, jetzt });
    return ok;
  };
  const rueckgaengig = () => { const z = zuletzt; if (!z) return; setZuletzt(null); void onTaskStatusDirekt?.(z.id, z.vorher); };
  const dossierRecord = dossier ? records.find((r) => r.id === dossier.id) || null : null;
  const dossierTermin = dossierRecord && ["task", "deadline", "reminder"].includes(dossierRecord.recordType) ? dossierRecord : null;
  const vorgabe = kalenderEinstLesen()?.erinnerungen || ERINNERUNG_VORGABE;
  const caseTimeline = useMemo(() => dossier?.type === "case" ? buildCaseTimeline(dossier.id, contextInput) : [], [dossier, contextInput]);
  const caseOpen = useMemo(() => dossier?.type === "case" ? buildCaseOpenSummary(dossier.id, contextInput) : null, [dossier, contextInput]);
  const dossierGroups = useMemo(() => dossier ? dossierTypeOrder(dossier.type)
    .map((type) => ({ type, items: dossier.groups[type] || [] }))
    .filter((group) => group.items.length) : [], [dossier]);
  const focus = (id: string) => onGo("cockpit", id);
  // A5 (09.11.): Bearbeitbares öffnet direkt die Bearbeitung als Fenster – Schließen lässt das Cockpit an derselben Stelle.
  const [stammId, setStammId] = useState<string | null>(null);
  const stammRecord = stammId ? records.find((r) => r.id === stammId) || null : null;
  const bearbeiten = (id: string) => {
    const r = records.find((x) => x.id === id);
    if (vaultHandle && r && ["task", "deadline", "reminder"].includes(r.recordType)) { setAendernId(id); return; }
    if (vaultHandle && istStamm(r)) { setStammId(id); return; }
    focus(id);
  };
  // A2 (09.11.): „Zuordnung prüfen“ führt sichtbar zu den Verknüpfungen, klappt die erste auf und markiert sie;
  // ohne Verknüpfung sagt es das an derselben Stelle.
  const zuordnungPruefen = () => {
    const erste = dossierGroups[0]?.items[0];
    if (erste) { setAufRef(`${erste.type}-${erste.id}`); gleichZumZiel(`[data-dossier-ref="${erste.id}"]`); return; }
    hierZumZiel("#dossier-relations");
    onNotice?.({ kind: "info", text: "Noch nichts verknüpft. Über „Dokument hinzufügen“ oder „Ereignis ergänzen“ verbindest du Unterlagen und Ereignisse mit dieser Akte." });
  };
  const openReference = (reference: CockpitReference) => {
    if (reference.type === "document") { void onOpenDocument(reference.id); return; }
    if (reference.sensitive) { onGo("health"); return; }
    focus(reference.id);
  };
  const openPriority = (item: CockpitPriorityItem) => {
    if (item.sensitive) { onGo("health"); return; }
    if (item.sourceType === "document") { void onOpenDocument(item.sourceId); return; }
    // U6: Termine und Tagebuch-Punkte öffnen an ihrem Zuhause, wie überall sonst.
    const rec = records.find((r) => r.id === item.sourceId);
    if (vaultHandle && (istStamm(rec) || (rec && ["task", "deadline", "reminder"].includes(rec.recordType)))) { bearbeiten(item.sourceId); return; }
    const ziel = datensatzZiel(records, item.sourceType, item.sourceId);
    if (ziel.section !== "cockpit") { onGo(ziel.section as SectionId, ziel.targetId); return; }
    focus(item.sourceId);
  };
  const saveNote = async () => {
    if (!dossier || !note.trim()) return;
    setSavingNote(true);
    if (await onAddNote(dossier.id, note)) setNote("");
    setSavingNote(false);
  };
  const counts = { urgent: snapshot.priorities.filter((item) => ["overdue", "today"].includes(item.urgency)).length, todos: snapshot.todos.length, cases: snapshot.cases.length, news: snapshot.relevantNews.length };
  return <><PageTitle icon={<ClipboardCheck/>} title="Cockpit" text="Die zentrale Arbeitsübersicht zeigt nur tatsächlich vorhandene Aufgaben, Fristen, Vorgänge, Objekte und Unterlagen aus dem gemeinsamen Datenmodell."/>
    {bereich && <section className="info-notice cockpit-bereich" aria-label="Cockpit gefiltert" data-cockpit-bereich={bereich.id}><span>Filter</span><div><strong>Nur {bereich.name}</strong><div>Fristen, Aufgaben, Vorgänge und Objekte, die zu diesem Bereich passen.</div></div><button type="button" className="button secondary" onClick={() => onGo("cockpit")} data-cockpit-alle>Alle anzeigen</button></section>}
    <section className="cockpit-summary" aria-label="Cockpit-Zusammenfassung"><button className="card" onClick={() => document.getElementById("cockpit-priorities")?.scrollIntoView({ behavior: "smooth" })}><small>Jetzt wichtig</small><strong>{counts.urgent}</strong><span>überfällig oder heute · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-todos")?.scrollIntoView({ behavior: "smooth" })}><small>Aktive To-dos</small><strong>{counts.todos}</strong><span>{snapshot.completedTaskCount} in der Historie erledigt · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-cases")?.scrollIntoView({ behavior: "smooth" })}><small>Offene Vorgänge</small><strong>{counts.cases}</strong><span>aus verknüpften Datensätzen · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-news")?.scrollIntoView({ behavior: "smooth" })}><small>Neu hinzugekommen</small><strong>{counts.news}</strong><span>aktuell relevante Einträge · anzeigen</span></button></section>

    <section className="cockpit-layout">
      <article className="card cockpit-panel cockpit-priorities" id="cockpit-priorities"><div className="card-heading"><div><span className="eyebrow dark">Priorisiert</span><span className="ui-heading-help"><h2>Was ist jetzt wichtig?</h2><InfoPopover label="Was ist jetzt wichtig? erklären" text={UI_HELP["Was ist jetzt wichtig?"]}/></span></div><span className="badge neutral">{snapshot.priorities.length} Punkte</span></div>{snapshot.priorities.length ? <div className="cockpit-action-list">{snapshot.priorities.slice(0, 10).map((item) => <button key={item.id} onClick={() => openPriority(item)}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]} · {item.detail}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Nichts Dringendes offen</strong><span>Es werden keine Beispielaufgaben erzeugt.</span></div>}</article>
      {offeneAusfuellungen(localDocuments).length > 0 && <article className="card cockpit-panel" id="cockpit-ausfuellen" data-cockpit-ausfuellen><div className="card-heading"><div><span className="eyebrow dark">Formulare</span><span className="ui-heading-help"><h2>Muss noch ausgefüllt werden</h2><InfoPopover label="Muss noch ausgefüllt werden erklären" text="Unterlagen, die beim Ausfüllen als „Später ausfüllen“ vorgemerkt wurden. Die Felder sind gemerkt; ein Klick öffnet das Ausfüllen."/></span></div><span className="badge neutral">{offeneAusfuellungen(localDocuments).length}</span></div><div className="cockpit-action-list">{offeneAusfuellungen(localDocuments).map((item) => <button key={item.id} onClick={() => onFill(item.id)}><span className="priority-dot urgency-attention"/><span><strong>{visibleDocumentTitle(item)}</strong><small>{item.category} · vorgemerkt {fmtDate((item.ausfuellen?.geaendertAm || "").slice(0, 10) || null)}</small></span><ChevronRight/></button>)}</div></article>}

      <article className="card cockpit-panel" id="cockpit-todos"><div className="card-heading"><div><span className="eyebrow dark">Aktuelle Arbeit</span><span className="ui-heading-help"><h2>To-do-Liste</h2><InfoPopover label="To-do-Liste erklären" text={UI_HELP["To-do-Liste"]}/></span></div><button className="text-link" onClick={() => onGo("reminders")}>Alle Fristen und Aufgaben</button></div>{zuletzt && <ErledigtMeldung titel={zuletzt.titel} jetzt={zuletzt.jetzt} wo="steht jetzt bei den erledigten Aufgaben" onRueckgaengig={rueckgaengig}/>}{snapshot.todos.length ? <div className="cockpit-todo-list">{snapshot.todos.slice(0, 6).map((item) => <CockpitTodoRow key={`${item.id}-${item.status}`} item={item} onOpen={() => item.sensitive ? onGo("health") : bearbeiten(item.id)} onStatus={(status) => statusMitRueckgaengig(item.id, item.title, item.status, status, false)}/>)}</div> : zuletzt ? null : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Keine aktive Aufgabe</strong><span>Erledigte und zurückgestellte Aufgaben bleiben in der Historie erhalten.</span></div>}</article>
    </section>

    {contextSuggestions.length > 0 && <section className="card context-review-list" id="context-review"><div className="card-heading"><div><span className="eyebrow dark">Mögliche Zusammenhänge prüfen</span><span className="ui-heading-help"><h2>Dokumente, Tagebuch-Einträge und Vorgänge</h2><InfoPopover label="Dokumente, Tagebuch-Einträge und Vorgänge erklären" text={UI_HELP["Dokumente, Tagebuch-Einträge und Vorgänge"]}/></span></div><span className="badge warning">{contextSuggestions.length}</span></div>{contextSuggestions.slice(0, 6).map((suggestion) => <article key={suggestion.id}><div><span className="badge neutral">{suggestion.confidence}</span><strong>{suggestion.sourceLabel}</strong><small>Wahrscheinlich zugehörig: {suggestion.caseLabel}</small><details><summary>Warum diese Zuordnung?</summary><ul>{suggestion.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div><div className="button-row"><button className="button primary" onClick={() => void onConfirmContext(suggestion.sourceType, suggestion.sourceId, suggestion.caseId, suggestion.reasons.join(", "))}>Verknüpfen</button><button className="button secondary" onClick={() => focus(suggestion.caseId)}>Vorgang öffnen</button><button className="button secondary" onClick={() => void onRejectContext(suggestion)}>Nicht verknüpfen</button></div></article>)}</section>}

    <section className="section-heading"><div><span className="eyebrow dark">Zusammenhänge</span><h2>Offene Vorgänge und Objektakten</h2></div><button className="text-link" onClick={() => onGo("directory")}>Gesamtes Verzeichnis</button></section>
    <section className="cockpit-context-grid">
      <article className="card cockpit-panel" id="cockpit-cases"><div className="card-heading"><div><span className="ui-heading-help"><h2>Offene Vorgänge</h2><InfoPopover label="Offene Vorgänge erklären" text={UI_HELP["Offene Vorgänge"]}/></span></div><span className="badge neutral">{snapshot.cases.length}</span></div>{snapshot.cases.length ? <div className="cockpit-case-list">{snapshot.cases.slice(0, 6).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : bearbeiten(item.id)} data-cockpit-eintrag={item.id}><span><strong>{item.title}</strong><small>Status: {item.status} · zuletzt {new Intl.DateTimeFormat("de-DE").format(new Date(item.updatedAt))}</small><small>{item.nextTask ? `Nächste Aufgabe: ${item.nextTask.title}` : item.nextDeadline ? `Nächste Frist: ${item.nextDeadline.title}` : "Keine nächste Aufgabe oder Frist gespeichert"}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><Folder size={28}/><strong>Keine offenen Vorgänge gespeichert</strong><span>Es wird kein Aktenbestand vermutet.</span></div>}</article>
      <article className="card cockpit-panel" id="cockpit-objects"><div className="card-heading"><div><span className="ui-heading-help"><h2>Objektakten</h2><InfoPopover label="Objektakten erklären" text={UI_HELP["Objektakten"]}/></span></div><span className="badge neutral">{snapshot.objects.length}</span></div>{snapshot.objects.length ? <div className="cockpit-object-list">{snapshot.objects.slice(0, 6).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : bearbeiten(item.id)} data-cockpit-eintrag={item.id}><span><strong>{item.title}</strong><small>{item.objectType} · {item.caseCount} Vorgänge · {item.documentCount} Dokumente</small><small>{item.taskCount} Aufgaben · {item.deadlineCount} Fristen · {item.costCount} Kosten · {item.warrantyCount} Garantien</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><Archive size={28}/><strong>Noch keine Objektakte angelegt</strong><span>Vorbereitete Lebensbereiche bleiben weiterhin erreichbar.</span></div>}</article>
    </section>

    <section className="cockpit-context-grid">
      <article className="card cockpit-panel"><div className="card-heading"><div><span className="eyebrow dark">Tagebuch</span><span className="ui-heading-help"><h2>Rückfragen zu gespeicherten Einträgen</h2><InfoPopover label="Rückfragen zu gespeicherten Einträgen erklären" text={UI_HELP["Rückfragen zu gespeicherten Einträgen"]}/></span></div><button className="text-link" onClick={() => onGo("memory")}>Ganzes Tagebuch</button></div>{snapshot.memoryOpenPoints.length ? <div className="cockpit-news-list">{snapshot.memoryOpenPoints.slice(0, 5).map((item) => <button key={item.id} onClick={() => onGo(item.sensitive ? "health" : "memory", item.sourceId)}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><BookHeart size={28}/><strong>Keine Rückfragen</strong><span>Neue bestätigte Erinnerungspunkte erscheinen hier automatisch.</span></div>}</article>
      <article className="card cockpit-panel" id="cockpit-news"><div className="card-heading"><div><span className="eyebrow dark">Wiederverwendete Abfrage</span><span className="ui-heading-help"><h2>Neu hinzugekommen</h2><InfoPopover label="Neu hinzugekommen erklären" text={UI_HELP["Neu hinzugekommen"]}/></span></div><button className="text-link" onClick={() => onGo("changelog")}>Alle Neuigkeiten anzeigen</button></div>{snapshot.relevantNews.length ? <div className="cockpit-news-list">{snapshot.relevantNews.slice(0, 5).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : item.sourceType === "document" ? void onOpenDocument(item.sourceId) : bearbeiten(item.sourceId)}><span className="badge neutral">{item.area}</span><span><strong>{item.sensitive ? "Neuer geschützter Eintrag" : item.title}</strong><small>{item.dateLabel} · {item.sensitive ? "Einzelheiten nur im geschützten Fachbereich" : item.summary}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><History size={28}/><strong>Keine aktuell relevanten neuen Einträge</strong><span>Die vollständige chronologische Übersicht bleibt unter „Was gibt’s Neues?“ erhalten.</span></div>}</article>
      {aendernRecord && vaultHandle && <TerminBearbeiten record={aendernRecord} vaultHandle={vaultHandle} onZu={() => setAendernId(null)} onGespeichert={async (t) => { await onRefresh?.(); onNotice?.({ kind: "success", text: t }); }} onAkte={dossier?.id === aendernRecord.id ? undefined : () => focus(aendernRecord.id)}/>}
      {stammRecord && vaultHandle && <StammBearbeitenFenster record={stammRecord} records={records} vaultHandle={vaultHandle} onZu={() => setStammId(null)} onGespeichert={async (t) => { await onRefresh?.(); onNotice?.({ kind: "success", text: t }); }} onAkte={dossier?.id === stammRecord.id ? undefined : () => focus(stammRecord.id)} onSaveContact={onSaveContact}/>}
      <article className="card cockpit-panel protected-health-card"><div><ShieldCheck size={34}/><span><span className="eyebrow dark">Geschützter Fachbereich</span><h2>Gesundheit und Leistung</h2><p>{snapshot.healthNotices.length ? `${snapshot.healthNotices.length} datensparsame Hinweise benötigen möglicherweise Aufmerksamkeit.` : "Derzeit kein datensparsamer Gesundheitshinweis aus dem gemeinsamen Modell."}</p></span></div><ul>{snapshot.healthNotices.slice(0, 3).map((item) => <li key={item.id}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]}</small></span></li>)}</ul><button className="button secondary" onClick={() => onGo("health")}>Geschützten Gesundheitsbereich öffnen</button><small>Diagnosen und medizinische Einzelheiten werden im allgemeinen Cockpit nicht angezeigt.</small></article>
    </section>

    {dossier && <section className={`card cockpit-dossier ${dossier.sensitive ? "sensitive" : ""}`} id="cockpit-dossier"><BspEcke id={dossier.id}/><div className="card-heading"><div><span className="eyebrow dark">{cockpitRecordTypeLabel[dossier.type]}</span><h2>{dossier.title}</h2><p>Status: {dossier.status}{dossier.updatedAt ? ` · zuletzt geändert ${new Intl.DateTimeFormat("de-DE").format(new Date(dossier.updatedAt))}` : ""}</p></div><button className="button secondary" onClick={() => navigation.canBack ? navigation.back() : onGo("cockpit")} aria-label="Detailansicht schließen"><ArrowLeft size={17}/> Zurück</button></div>{dossier.sensitive ? <div className="protected-dossier"><ShieldCheck/><div><strong>Vertrauliche Einzelheiten bleiben geschützt</strong><p>Im Cockpit werden nur Art, Status und die Anzahl vorhandener Verknüpfungen gezeigt.</p><button className="button secondary" onClick={() => onGo("health")}>Gesundheitsakte öffnen</button></div></div> : <><div className="dossier-meta"><div><small>Quelle</small>{(() => { const q = quelleAnzeige(dossier.source, records, localDocuments); return !q ? <strong>nicht angegeben</strong> : q.ziel ? <button type="button" className="text-link quelle-link" onClick={() => onGo(q.ziel!.section as SectionId, q.ziel!.targetId)} data-quelle>{q.text} ›</button> : <strong data-quelle>{q.text}</strong>; })()}</div><div><small>Speicherverweis</small><strong>{dossier.storageReference || "kein Dateipfad hinterlegt"}</strong></div><div><small>Verknüpfungen</small><strong>{dossier.related.length}</strong></div></div>{dossier.type === "case" && <><section className="case-open-summary"><div><strong>Noch offen</strong><button onClick={zuOffenerGruppe(caseOpen?.memoryQuestions ? "memory" : null)}>{caseOpen?.memoryQuestions || 0} Rückfragen</button><button onClick={zuOffenerGruppe(caseOpen?.tasks ? "task" : null)}>{caseOpen?.tasks || 0} Aufgaben</button><button onClick={zuOffenerGruppe(caseOpen?.deadlines ? "deadline" : null)}>{caseOpen?.deadlines || 0} Fristen</button></div><div className="button-row"><button className="button secondary" onClick={() => onAssistant(dossier.id)}><Bot size={17}/> Assistenz fragen</button><button className="button secondary" onClick={() => onAddMemoryToCase(dossier.id)}><BookHeart size={17}/> Ereignis ergänzen</button><button className="button secondary" onClick={() => onAddDocumentToCase(dossier.id)}><Upload size={17}/> Dokument hinzufügen</button><button className="button primary" onClick={zuOffenerGruppe(null)}>Was ist noch offen?</button></div></section><section className="case-timeline"><span className="ui-heading-help"><h3>Gemeinsame Vorgangschronologie</h3><InfoPopover label="Gemeinsame Vorgangschronologie erklären" text={UI_HELP["Gemeinsame Vorgangschronologie"]}/></span>{caseTimeline.length ? caseTimeline.map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : item.type === "Dokument" ? void onOpenDocument(item.sourceId) : item.recordType === "event" ? onGo("memory", item.sourceId) : focus(item.sourceId)}><span className="badge neutral">{item.type}</span><span><strong>{item.title}</strong><small>{item.at ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.at)) : "Ohne Datum"}</small></span><ChevronRight size={16}/></button>) : <p>Noch keine chronologisch verknüpften Inhalte.</p>}</section><section className="case-open-details" id="case-open-details"><span className="ui-heading-help"><h3>Was ist noch offen?</h3><InfoPopover label="Was ist noch offen? erklären" text={UI_HELP["Was ist noch offen?"]}/></span><OffenePunkte eintraege={caseOpen?.eintraege || []} onGo={onGo}/></section></>}{dossierTermin && <TerminErinnerungen record={dossierTermin} vorgabe={vorgabe}/>}{dossierRecord && !dossier.sensitive && <TagebuchHinweise id={dossierRecord.id} records={records} relations={relations} onGo={onGo}/>}<div className="dossier-links" id="dossier-relations"><h3>{dossier.type === "case" ? "Aktueller Vorgang und seine Verknüpfungen" : dossier.type === "object" ? "Objektakte und ihre Verknüpfungen" : dossier.type === "person" ? "Personenakte und ihre Verknüpfungen" : "Zugehörige Informationen"}</h3>{dossierGroups.length ? dossierGroups.map((group) => <section className="dossier-link-group" key={group.type}><h4>{cockpitRecordTypeLabel[group.type]}</h4><div>{group.items.map((reference) => { const k = `${reference.type}-${reference.id}`; const auf = aufRef === k; const rec = records.find((r) => r.id === reference.id); return <Fragment key={k}><button onClick={() => setAufRef(auf ? null : k)} aria-expanded={auf} data-dossier-ref={reference.id}><span className="badge neutral">{cockpitRecordTypeLabel[reference.type]}</span><span><strong>{reference.label}</strong><small>{referenzKurz(reference, records)}</small></span>{auf ? <ChevronDown/> : <ChevronRight/>}</button>{auf && <div className="dossier-auf" data-dossier-auf={reference.id}>{referenzDetail(reference, records, vorgabe)}<div className="button-row">{!reference.sensitive && rec && ["task", "deadline", "reminder"].includes(rec.recordType) && !["erledigt", "archiviert"].includes(rec.status) && onTaskStatusDirekt && <button type="button" className="button secondary" onClick={() => void statusMitRueckgaengig(rec.id, reference.label, rec.status, "erledigt", true)} data-dossier-ref-erledigt={reference.id}><Check size={16}/> erledigt</button>}<button type="button" className="button secondary" onClick={() => openReference(reference)} data-dossier-ref-oeffnen={reference.id}>{reference.type === "document" ? "Dokument öffnen ›" : "Eigene Seite ›"}</button></div></div>}</Fragment>; })}</div></section>) : <p>Für diesen Datensatz sind noch keine weiteren Verknüpfungen gespeichert.</p>}</div>{dossier.notes && <div className="dossier-notes"><span className="ui-heading-help"><h3>Vorhandene Notizen</h3><InfoPopover label="Vorhandene Notizen erklären" text={UI_HELP["Vorhandene Notizen"]}/></span><p>{dossier.notes}</p></div>}<div className="dossier-actions"><h3>Direkte Aktionen</h3><div className="button-row">{dossier.type === "case" && <button className="button secondary" onClick={() => onAssistant(dossier.id)}><Bot size={17}/> Assistenz &amp; Schreiben</button>}{dossier.type === "document" && <button className="button secondary" onClick={() => void onOpenDocument(dossier.id)}><FileText size={17}/> Dokument öffnen</button>}{dossierTermin ? <>{!["erledigt", "archiviert"].includes(dossierTermin.status) && <button className="button secondary" onClick={() => void statusMitRueckgaengig(dossierTermin.id, dossier.title, dossierTermin.status, "erledigt", true)} data-dossier-erledigt><Check size={17}/> erledigt</button>}{vaultHandle && <button className="button secondary" onClick={() => setAendernId(dossierTermin.id)} data-dossier-aendern><Pencil size={17}/> ändern</button>}{vaultHandle && <ErinnerungLoeschen id={dossierTermin.id} titel={dossier.title} vaultHandle={vaultHandle} mitText onGeloescht={async (t) => { await onRefresh?.(); onNotice?.({ kind: "success", text: t }); if (navigation.canBack) navigation.back(); else onGo("cockpit"); }}/>}<button className="button secondary" onClick={() => { const at = terminTag(dossierTermin); onGo("reminders"); window.setTimeout(() => meinKalenderOeffnen(at || undefined, dossierTermin.id), 450); }} data-dossier-kalender><CalendarDays size={17}/> Im Kalender ›</button></> : <>{vaultHandle && dossierRecord && istStamm(dossierRecord) && <button className="button secondary" onClick={() => setStammId(dossierRecord.id)} data-dossier-stamm-aendern><Pencil size={17}/> ändern</button>}<button className="button secondary" onClick={zuordnungPruefen} data-dossier-zuordnung><ClipboardCheck size={17}/> Zuordnung prüfen</button></>}</div>{zuletzt && dossierTermin && zuletzt.id === dossierTermin.id && <ErledigtMeldung titel={zuletzt.titel} jetzt={zuletzt.jetzt} wo="steht jetzt bei den erledigten Aufgaben" onRueckgaengig={rueckgaengig}/>}{dossier.type === "person" && onSaveContact && <PersonKontaktKasten daten={((records.find((r) => r.id === dossier.id)?.data) || {}) as Record<string, unknown>} onSpeichern={(k) => onSaveContact(dossier.id, k)}/>}<label><span>Notiz ergänzen</span><VoiceTextarea rows={3} value={note} onValueChange={(spokenValue) => setNote(spokenValue)} placeholder="Nur bestätigte eigene Notiz eintragen" speechLabel="Vorgangsnotiz"/></label><button className="button primary" disabled={savingNote || !note.trim()} onClick={saveNote}>{savingNote ? "Wird gespeichert …" : "Notiz nach Bestätigung ergänzen"}</button></div></>}
    </section>}
  </>;
}

function terminZeit(records: FamilyRecordUnion[], id: string) { const r = records.find((x) => x.id === id); const t = r ? kalenderFelder(r).dueTime : ""; return t ? `, ${t} Uhr` : ""; }
/** Kurz für die flache Zeile: nur die Glocke. */
function terminGlockeKurz(records: FamilyRecordUnion[], id: string) { const r = records.find((x) => x.id === id); return r ? glockeText(r) : ""; }
/** Erinnerungszeiten wie die App-Glocke sie nimmt (2.28.39): eigene, sonst die Vorgabe; leer gewählt = keine. */
function glockeText(r: FamilyRecordUnion) {
  if (r.recordType === "reminder") { const at = String((r.data as { remindAt?: string }).remindAt || ""); return at ? `🔔 ${fmtDate(at.slice(0, 10)).slice(0, 6)}${at.length > 10 ? `, ${at.slice(11, 16)} Uhr` : ""}` : ""; }
  if (r.recordType !== "task" && r.recordType !== "deadline") return "";
  const e = kalenderFelder(r).erinnerungen;
  if (Array.isArray(e)) return e.length ? `🔔 ${e.map(erinnerungsName).join(", ")}` : "🔕 ohne Erinnerung";
  return `🔔 ${(kalenderEinstLesen()?.erinnerungen || ERINNERUNG_VORGABE).map(erinnerungsName).join(", ")}`;
}
const arbeitsStand: Record<string, string> = { in_bearbeitung: "in Bearbeitung", wartet_auf_antwort: "wartet auf Antwort" };
/** Im Auge nur der Kalender-Stand; die Glocke steht schon in der Zeile (2.28.39). */
function kalenderStand(records: FamilyRecordUnion[], id: string) {
  const r = records.find((x) => x.id === id); if (!r) return null;
  const k = kalenderFelder(r);
  return k.kalenderEintragen ? <p className="termin-erinnerung" data-termin-erinnerung>{(k.kalender || []).length ? "im Kalender" : "geht in den Kalender"}</p> : null;
}

function ReminderCenter({ vaultHandle, records, relations, documents = [], focusId, onRefresh, onGo, onNotice }: {
  vaultHandle: FileSystemDirectoryHandle | null;
  documents?: LocalDocument[];
  focusId?: string | null;
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  onRefresh: () => Promise<void>;
  onGo: (id: SectionId, targetId?: string) => void;
  onNotice: (notice: Notice) => void;
}) {
  const kalender = useKalenderEinst();
  const [vorschlag] = useState(() => fristVorschlagNehmen());
  const [recordType, setRecordType] = useState<"deadline" | "task">("deadline");
  const [title, setTitle] = useState(vorschlag?.titel || "");
  const [dueAt, setDueAt] = useState(vorschlag?.datum || "");
  const [dueTime, setDueTime] = useState("");
  const [kalenderEintragen, setKalenderEintragen] = useState(Boolean(kalender));
  const [erinnerungen, setErinnerungen] = useState<ErinnerungsWahl[]>(kalender?.erinnerungen || ERINNERUNG_VORGABE);
  const [kalenderWahl, setKalenderWahl] = useState<KalenderWahl | null>(null);
  useEffect(() => { setKalenderEintragen(Boolean(kalender)); setErinnerungen(kalender?.erinnerungen || ERINNERUNG_VORGABE); }, [kalender?.anbieter, kalender?.kalenderId, kalender?.erinnerungen?.join()]);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderTime, setReminderTime] = useState(""); // Klaus 2026-11-05: eigene Uhrzeit statt fest 9 Uhr
  const [source, setSource] = useState(vorschlag?.quelle || "Manuelle Eingabe");
  const [notes, setNotes] = useState("");
  const [personId, setPersonId] = useState("");
  const [objectId, setObjectId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [documentId, setDocumentId] = useState(vorschlag?.dokumentId || "");
  const [confirmed, setConfirmed] = useState(false);
  // Prüfbericht M2: ein Vorschlag (vorausgefülltes Formular) wird ins Bild gerollt und kurz hervorgehoben.
  useEffect(() => {
    if (!vorschlag) return undefined;
    const t = window.setTimeout(() => { const el = document.querySelector<HTMLElement>(".schedule-create"); if (!el) return; el.closest("details")?.setAttribute("open", ""); el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("hervorgehoben"); window.setTimeout(() => el.classList.remove("hervorgehoben"), 2600); }, 350);
    return () => window.clearTimeout(t);
  }, [vorschlag]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useActivityMessage("error", "Frist oder Aufgabe speichern");
  const bezugListe = (type: "person" | "object" | "case") => records.filter((r) => r.recordType === type && r.status !== "archiviert").sort((a, b) => cockpitRecordLabel(a).localeCompare(cockpitRecordLabel(b), "de"));
  // „Gespeichert ✓“ an derselben Stelle (U8) und „erledigt – Rückgängig“ an der Liste (E).
  const [gespeichert, setGespeichert] = useState("");
  useEffect(() => { if (!gespeichert) return; const t = window.setTimeout(() => setGespeichert(""), 6000); return () => window.clearTimeout(t); }, [gespeichert]);
  const [erledigtZuletzt, setErledigtZuletzt] = useState<{ id: string; titel: string; vorher: "offen" | "erledigt" | "zurückgestellt"; jetzt: string } | null>(null);
  useEffect(() => { if (!erledigtZuletzt) return; const t = window.setTimeout(() => setErledigtZuletzt(null), 8000); return () => window.clearTimeout(t); }, [erledigtZuletzt]);
  // Frist aus dem Eingang (U12): gleich zum vorausgefüllten Formular springen statt oben im Kalender stehen zu bleiben.
  useEffect(() => { if (!vorschlag) return; const t = window.setTimeout(() => { klappOeffnen("anlegen"); document.querySelector("[data-frist-vorschlag]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 400); return () => window.clearTimeout(t); }, [vorschlag]);
  // Fristenliste mit Suchfeld und Filtern (2.28.39, Punkt 10): Offen · Diese Woche · Überfällig · Erledigt, 50 je Seite.
  const [viewFilter, setViewFilter] = useState<"all" | "overdue" | "dueSoon" | "open" | "woche">("all");
  const [suche, setSuche] = useState("");
  // Klaus 2026-11-05: kein Hin und Her – der angesprungene Eintrag wird gezeigt und hervorgehoben, „Ändern“ bearbeitet ihn hier.
  const [terminId, setTerminId] = useState<string | null>(null);
  const terminRecord = terminId ? records.find((r) => r.id === terminId) || null : null;
  // Auge (Klaus 2026-11-06): welche Einträge ganz aufgeklappt sind; ein angesprungener Eintrag steht offen.
  const [aufIds, setAufIds] = useState<Set<string>>(() => new Set());
  // Zähler-Kästchen (Klaus 2026-11-06): filtern, den Abschnitt „Offene Fristen und Aufgaben“ aufklappen und dorthin springen.
  const zuDenFristen = (f: "overdue" | "dueSoon" | "open") => { setViewFilter(f); klappOeffnen("offen"); gleichZumZiel("#offene-fristen"); };
  const augeTippen = (id: string) => setAufIds((alt) => { const neu = new Set(alt); if (neu.has(id)) neu.delete(id); else neu.add(id); return neu; });
  useEffect(() => {
    if (!focusId) return;
    // Sprung an #termin-<id> (auch auf einer späteren Seite oder hinter einem Filter): Filter und Suche geben ihn frei.
    // Hinrollen und Markieren übernimmt der gemeinsame Sprungweg (app/sprung.ts).
    setViewFilter("all"); setSuche("");
    setAufIds((alt) => new Set(alt).add(focusId));
  }, [focusId]);
  const items = buildScheduleItems(records, relations, new Date());
  const active = items.filter((item) => !["done", "postponed"].includes(item.displayStatus));
  const completed = items.filter((item) => ["done", "postponed"].includes(item.displayStatus));
  const counts = { overdue: active.filter((item) => item.displayStatus === "overdue").length, dueSoon: active.filter((item) => item.displayStatus === "dueSoon").length, open: active.filter((item) => item.displayStatus === "open").length };
  const woche = (() => { const heute = new Date(); const tag = (heute.getDay() + 6) % 7; const mo = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - tag); const so = new Date(mo.getFullYear(), mo.getMonth(), mo.getDate() + 6); const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return [iso(mo), iso(so)] as const; })();
  const linkName = (type: FamilyRecordUnion["recordType"], id: string) => {
    if (type === "document") { const d = documents.find((x) => x.id === id); return d ? (isSensitiveHealthText(d.originalName, d.category, d.notes) ? "Geschützte Gesundheitsunterlage" : visibleDocumentTitle(d)) : "Dokument"; }
    const r = records.find((x) => x.id === id); return r ? cockpitRecordLabel(r) : "nicht mehr vorhanden";
  };
  const sucheNorm = suche.trim().toLocaleLowerCase("de");
  const passt = (item: (typeof items)[number]) => !sucheNorm || [item.title, item.source, item.notes, ...item.links.map((link) => { const own = link.fromId === item.id; return linkName(own ? link.toType : link.fromType, own ? link.toId : link.fromId); })].filter(Boolean).join(" ").toLocaleLowerCase("de").includes(sucheNorm);
  const visibleActive = (viewFilter === "all" ? active : viewFilter === "woche" ? active.filter((item) => { const t = item.date?.slice(0, 10) || ""; return t >= woche[0] && t <= woche[1]; }) : active.filter((item) => item.displayStatus === viewFilter)).filter(passt);
  const visibleCompleted = completed.filter(passt);
  const fokusOffen = focusId ? visibleActive.findIndex((item) => item.id === focusId) + 1 : 0;
  const fokusErledigt = focusId ? visibleCompleted.findIndex((item) => item.id === focusId) + 1 : 0;
  const [offenGezeigt, offenMehr] = useSeiten(visibleActive.length, `${viewFilter}|${sucheNorm}`, LISTEN_SEITE, fokusOffen);
  const [erledigtGezeigt, erledigtMehr] = useSeiten(visibleCompleted.length, sucheNorm, LISTEN_SEITE, fokusErledigt);
  const zeilenDatum = (iso: string) => iso.slice(0, 4) === String(new Date().getFullYear()) ? fmtDate(iso).slice(0, 6) : fmtDate(iso);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vaultHandle) return setError("Bitte zuerst im Sicherheitscenter einen lokalen Datentresor verbinden.");
    if (!confirmed) return setError("Bitte bestätige ausdrücklich, dass diese Frist oder Aufgabe angelegt werden soll.");
    setBusy(true); setError("");
    try {
      await createLocalScheduleBundle(vaultHandle, {
        recordType, title, dueAt, reminderAt: reminderAt ? (reminderTime ? `${reminderAt}T${reminderTime}` : reminderAt) : null, source: source || "Manuelle Eingabe", notes: notes || null,
        // U5: ohne verbundenen Kalender „noch offen“ (nicht „nein“) – „Einmal alle offenen eintragen“ nimmt sie später mit.
        dueTime: dueTime || null, kalenderEintragen: kalender ? kalenderEintragen : undefined, erinnerungen, kalenderWahl,
        references: [
          { recordType: "person", id: personId, relationType: "betrifft" },
          { recordType: "object", id: objectId, relationType: "gehört zu" },
          { recordType: "case", id: caseId, relationType: "gehört zu" },
          { recordType: "document", id: documentId, relationType: "basiert auf" },
        ],
      });
      await onRefresh();
      setTitle(""); setDueAt(""); setDueTime(""); setReminderAt(""); setReminderTime(""); setKalenderEintragen(Boolean(kalender)); setErinnerungen(kalender?.erinnerungen || ERINNERUNG_VORGABE); setKalenderWahl(null); setNotes(""); setPersonId(""); setObjectId(""); setCaseId(""); setDocumentId(""); setConfirmed(false);
      setGespeichert(`Gespeichert ✓ ${title.trim()} – steht unter „Offene Fristen und Aufgaben“.`);
      onNotice({ kind: "success", text: "Die Frist oder Aufgabe wurde nach deiner Bestätigung lokal angelegt und protokolliert." });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Der Eintrag konnte nicht angelegt werden."); }
    finally { setBusy(false); }
  };
  const changeStatus = async (id: string, status: "offen" | "erledigt" | "zurückgestellt") => {
    if (!vaultHandle) return;
    setBusy(true);
    const vorher = records.find((r) => r.id === id);
    try { await updateLocalScheduleStatus(vaultHandle, id, status); await onRefresh();
      if (vorher && status !== "offen") setErledigtZuletzt({ id, titel: String((vorher.data as { title?: string }).title || id), vorher: (["offen", "erledigt", "zurückgestellt"].includes(vorher.status) ? vorher.status : "offen") as "offen", jetzt: status }); onNotice({ kind: "success", text: `Der Status wurde auf „${status}“ gesetzt und protokolliert.` }); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Status konnte nicht geändert werden." }); }
    finally { setBusy(false); }
  };
  // Flache Zeile (Klaus 2026-11-06): Datum, „Anfang … Ende“, Haken für erledigt, Auge; der Rest hinter dem Auge.
  const renderItem = (item: ReturnType<typeof buildScheduleItems>[number]) => { const auf = aufIds.has(item.id); const art = item.recordType === "deadline" ? "Frist" : item.recordType === "task" ? "Aufgabe" : "Erinnerung"; const uhr = terminZeit(records, item.id).replace(/^, /, "").replace(/ Uhr$/, "");
    return <article className={`schedule-item schedule-flach schedule-${item.displayStatus}${auf ? " offen" : ""}`} key={item.id} id={`termin-${item.id}`}><BspEcke id={item.id}/>
    <div className="fz-kopf fz-voll">
      <span className="mk-zeit">{item.date ? zeilenDatum(item.date.slice(0, 10)) : "–"}{uhr && <small>{uhr}</small>}</span>
      <span className="mk-text"><strong><FlachText text={item.title} ganz={auf}/></strong><small>{[scheduleStatusLabels[item.displayStatus], arbeitsStand[item.status], art, terminGlockeKurz(records, item.id)].filter(Boolean).join(" · ")}</small></span>
      <KnopfLeiste titel={item.title}>
        {item.displayStatus !== "done" && <button type="button" className="icon-button" disabled={busy} onClick={() => changeStatus(item.id, "erledigt")} aria-label={`„${item.title}“ als erledigt markieren`} title="Als erledigt markieren" data-termin-erledigt={item.id}><Check size={18}/></button>}
        {vaultHandle && <StiftKnopf titel={item.title} disabled={busy} onClick={() => setTerminId(item.id)} data-termin-aendern={item.id}/>}
        {vaultHandle && <ErinnerungLoeschen id={item.id} titel={item.title} vaultHandle={vaultHandle} onGeloescht={async (text) => { await onRefresh(); onNotice({ kind: "success", text }); }}/>}
        <AugeKnopf offen={auf} titel={item.title} onClick={() => augeTippen(item.id)} data-termin-auge={item.id}/>
      </KnopfLeiste>
    </div>
    {auf && <div className="fz-offen schedule-item-main" data-termin-offen>
      {/* Auge (2.28.39, Punkt 10): nur, was nicht schon in der Zeile steht – keine Doppelung von Titel, Datum, Art und Glocke. */}
      <TagebuchHinweise id={item.id} records={records} relations={relations} onGo={onGo}/>{kalenderStand(records, item.id)}<QuelleZeile source={item.source} records={records} documents={documents} onGo={onGo}/>{item.notes && <p>{item.notes}</p>}
      <div className="schedule-links">{item.links.length ? item.links.map((link) => { const ownFrom = link.fromId === item.id; const type = ownFrom ? link.toType : link.fromType; const id = ownFrom ? link.toId : link.fromId; const target = datensatzZiel(records, type, id); return <button key={link.id} className="text-link" onClick={() => onGo(target.section as SectionId, target.targetId)} data-termin-verweis={type}>{recordTypeDefinitions[type].label}: {bezugName(type, id, records, documents)}</button>; }) : <small>Keine zusätzliche Zuordnung</small>}</div><div className="button-row">{item.displayStatus !== "postponed" && item.displayStatus !== "done" && <button className="button secondary" disabled={busy} onClick={() => changeStatus(item.id, "zurückgestellt")}>Zurückstellen</button>}{["done", "postponed"].includes(item.displayStatus) && <button className="button secondary" disabled={busy} onClick={() => changeStatus(item.id, "offen")}>Wieder öffnen</button>}</div>
    </div>}
  </article>; };
  return <><PageTitle icon={<FileClock/>} title="Fristen und Aufgaben" text="Offene, bald fällige und überfällige Punkte aus dem bestehenden Familienakten-Datenmodell. Änderungen erfolgen nur nach deinem Befehl." extra={<KlappLeiste seite="fristen"/>}/>
    <MeinKalender vaultHandle={vaultHandle} records={records} relations={relations} onRefresh={onRefresh} onNotice={onNotice}/>
    <section className="schedule-summary" aria-label="Fristen filtern"><button className={`card schedule-filter ${viewFilter === "overdue" ? "active" : ""}`} onClick={() => zuDenFristen("overdue")} data-zaehler-sprung="overdue"><strong>{counts.overdue}</strong><small>Überfällig</small></button><button className={`card schedule-filter ${viewFilter === "dueSoon" ? "active" : ""}`} onClick={() => zuDenFristen("dueSoon")} data-zaehler-sprung="dueSoon"><strong>{counts.dueSoon}</strong><small>Bald fällig</small></button><button className={`card schedule-filter ${viewFilter === "open" ? "active" : ""}`} onClick={() => zuDenFristen("open")} data-zaehler-sprung="open"><strong>{counts.open}</strong><small>Offen</small></button></section>
    <section className="card schedule-create" data-klapp="anlegen"><div className="card-heading"><div><span className="badge success">Manuelle Eingabe</span><span className="ui-heading-help"><h2>Frist oder Aufgabe anlegen</h2><InfoPopover label="Frist oder Aufgabe anlegen erklären" text={UI_HELP["Frist oder Aufgabe anlegen"]}/></span></div></div>{!vaultHandle && <div className="sync-message warning">Bitte zuerst im Sicherheitscenter einen lokalen PC-, USB- oder OneDrive-Ordner verbinden.</div>}<form onSubmit={save}>{vorschlag && <p className="kalender-vorschlag" data-frist-vorschlag>{vorschlag.hinweis} – bitte prüfen.</p>}<div className="form-grid"><label><span>Art</span><select value={recordType} onChange={(event) => setRecordType(event.target.value as "deadline" | "task")}><option value="deadline">Frist</option><option value="task">Aufgabe</option></select></label><label><span>Bezeichnung</span><VoiceInput value={title} required onValueChange={(spokenValue) => setTitle(spokenValue)} placeholder="Zum Beispiel: Antwort an Krankenkasse" speechLabel="Titel"/></label><label><span>Fälligkeitsdatum</span><DatumFeld value={dueAt} required onChange={(event) => setDueAt(event.target.value)}/></label><label><span>Uhrzeit, frei</span><DatumFeld art="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} data-frist-uhrzeit/></label><label><span>Erinnerungsdatum, optional</span><DatumFeld value={reminderAt} onChange={(event) => setReminderAt(event.target.value)}/></label><label><span>Erinnerungsuhrzeit, optional</span><DatumFeld art="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} disabled={!reminderAt} data-erinnerung-uhrzeit/></label><label><span>Quelle</span><VoiceInput value={source} onValueChange={(spokenValue) => setSource(spokenValue)} placeholder="Zum Beispiel: Schreiben vom 07.10.2026" speechLabel="Quelle"/></label>{/* 2.28.39: Auswahl mit Namen statt eingetippter Kennung; gespeichert wird die Kennung. */}
<label><span>Person, optional</span><select value={personId} onChange={(event) => setPersonId(event.target.value)} data-frist-bezug="person"><option value="">Keine Person</option>{bezugListe("person").map((r) => <option key={r.id} value={r.id}>{cockpitRecordLabel(r)}</option>)}</select></label><label><span>Objekt, optional</span><select value={objectId} onChange={(event) => setObjectId(event.target.value)} data-frist-bezug="object"><option value="">Kein Objekt</option>{bezugListe("object").map((r) => <option key={r.id} value={r.id}>{cockpitRecordLabel(r)}</option>)}</select></label><label><span>Vorgang, optional</span><select value={caseId} onChange={(event) => setCaseId(event.target.value)} data-frist-bezug="case"><option value="">Kein Vorgang</option>{bezugListe("case").map((r) => <option key={r.id} value={r.id}>{cockpitRecordLabel(r)}</option>)}</select></label><label><span>Dokument, optional</span><select value={documentId} onChange={(event) => setDocumentId(event.target.value)} data-frist-bezug="document"><option value="">Kein Dokument</option>{documents.map((d) => <option key={d.id} value={d.id}>{visibleDocumentTitle(d)}{d.documentDate ? ` · ${fmtDate(d.documentDate)}` : ""}</option>)}</select></label></div><label><span>Notizen, optional</span><VoiceTextarea rows={3} value={notes} onValueChange={(spokenValue) => setNotes(spokenValue)} speechLabel="Notizen"/></label><KalenderFormTeil einst={kalender} eintragen={kalenderEintragen} setEintragen={setKalenderEintragen} erinnerungen={erinnerungen} setErinnerungen={setErinnerungen} kalenderWahl={kalenderWahl} setKalenderWahl={setKalenderWahl}/><label className="check-row schedule-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Ja, diesen Eintrag nach dem Speichern anlegen</strong><small>Es wird nichts aus Dokumenten automatisch übernommen oder verändert.</small></span></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button className="button primary" disabled={busy || !vaultHandle}>{busy ? "Wird gespeichert …" : "✓ Frist oder Aufgabe bestätigt anlegen"}</button></div>{gespeichert && <p className="notiz-gespeichert" role="status" data-frist-gespeichert>{gespeichert}</p>}</form></section>
    <KalenderVerbinden vaultHandle={vaultHandle} records={records} relations={relations} onRefresh={onRefresh} onNotice={onNotice}/>
    <section className="card" id="offene-fristen" data-klapp="offen" data-ziel-stand={active.length ? "offen" : "erledigt"}><div className="card-heading"><div><span className="ui-heading-help"><h2>Offene Fristen und Aufgaben</h2><InfoPopover label="Offene Fristen und Aufgaben erklären" text={UI_HELP["Offene Fristen und Aufgaben"]}/></span></div><div className="button-row"><span className="badge neutral">{visibleActive.length} angezeigt</span>{(viewFilter !== "all" || suche) && <button className="text-link" onClick={() => { setViewFilter("all"); setSuche(""); }}>Alle offenen anzeigen</button>}</div></div>
      <div className="fristen-filter" data-fristen-filter>
        <SuchFeld className="fristen-suche" lupe value={suche} onChange={setSuche} placeholder="In Fristen suchen" ariaLabel="In Fristen suchen" speechLabel="Fristensuche" inputProps={{ type: "search", "data-fristen-suche": true } as React.ComponentPropsWithoutRef<"input">}/>
        <span className="fristen-chips" role="group" aria-label="Fristen filtern">
          <button type="button" aria-pressed={viewFilter === "all"} className={viewFilter === "all" ? "active" : ""} onClick={() => setViewFilter("all")} data-fristen-chip="offen">Offen ({active.length})</button>
          <button type="button" aria-pressed={viewFilter === "woche"} className={viewFilter === "woche" ? "active" : ""} onClick={() => setViewFilter("woche")} data-fristen-chip="woche">Diese Woche</button>
          <button type="button" aria-pressed={viewFilter === "overdue"} className={viewFilter === "overdue" ? "active" : ""} onClick={() => setViewFilter("overdue")} data-fristen-chip="ueberfaellig">Überfällig ({counts.overdue})</button>
          <button type="button" onClick={() => { klappOeffnen("erledigt"); window.setTimeout(() => document.getElementById("erledigte-fristen")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }} data-fristen-chip="erledigt">Erledigt ({completed.length}) ›</button>
        </span>
      </div>{erledigtZuletzt && <p className="erledigt-meldung" role="status" data-erledigt-meldung={erledigtZuletzt.id}><Check size={16}/><span><strong>{erledigtZuletzt.jetzt === "erledigt" ? "Erledigt" : "Zurückgestellt"}:</strong> <FlachText text={erledigtZuletzt.titel}/> <small>steht jetzt unter „Erledigte und zurückgestellte Punkte“</small></span><button type="button" className="button secondary" disabled={busy} onClick={() => { const z = erledigtZuletzt; setErledigtZuletzt(null); void changeStatus(z.id, z.vorher).then(() => setErledigtZuletzt(null)); }} data-erledigt-rueckgaengig>Rückgängig</button></p>}<div className="schedule-list">{visibleActive.length ? visibleActive.slice(0, offenGezeigt).map(renderItem) : <div className="empty-state"><CheckCircle2 size={30}/><strong>Keine passenden offenen Fristen oder Aufgaben</strong><span>{suche ? `Nichts zu „${suche}“ im gewählten Filter.` : "Der gewählte Filter enthält derzeit keinen Eintrag."}</span></div>}</div><WeitereAnzeigen gezeigt={offenGezeigt} gesamt={visibleActive.length} onMehr={offenMehr}/></section>
    <section className="card" id="erledigte-fristen"><details data-klapp="erledigt"><summary><strong>Erledigte und zurückgestellte Punkte ({suche ? `${visibleCompleted.length} von ${completed.length}` : completed.length})</strong></summary><div className="schedule-list">{visibleCompleted.length ? visibleCompleted.slice(0, erledigtGezeigt).map(renderItem) : <div className="empty-state">{suche ? `Nichts zu „${suche}“.` : "Noch keine erledigten oder zurückgestellten Punkte."}</div>}</div><WeitereAnzeigen gezeigt={erledigtGezeigt} gesamt={visibleCompleted.length} onMehr={erledigtMehr}/></details></section>
    <PapierkorbKarte vaultHandle={vaultHandle} stand={records} onRefresh={onRefresh} onNotice={onNotice}/>
    {terminRecord && vaultHandle && <TerminBearbeiten record={terminRecord} vaultHandle={vaultHandle} onZu={() => setTerminId(null)} onGespeichert={async (text) => { await onRefresh(); onNotice({ kind: "success", text }); }}/>}
  </>;
}

function Medical({ diagnoses, query, onGo, onDocuments, onSearch }: { diagnoses: typeof healthData.currentDiagnoses; query: string; onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) {
  return <><PageTitle icon={<HeartPulse/>} title="Diagnosen, AU & ICD-Codes" text="Medizinische Gesundheitsakte: Diagnosen, ICD-Codes, AU-Zeiten und behandelnde Stellen. Neueste Zeitangaben stehen oben; Einträge ohne Datum am Ende." />
    <SubpageActions actions={menuPageActions.medical} onGo={onGo} onDocuments={onDocuments}/>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Diagnosen und ICD-Codes</h2><InfoPopover label="Diagnosen und ICD-Codes erklären" text={UI_HELP["Diagnosen und ICD-Codes"]}/></span><p>Unverändert aus den berücksichtigten ärztlichen Unterlagen und Krankenkasse-Daten.</p></div><span className="badge neutral">{diagnoses.length} Treffer</span></div>{query && !diagnoses.length ? <div className="empty-state">Keine passende Diagnose gefunden.</div> : <div className="table-wrap"><table><thead><tr><th>Bereich</th><th>ICD-Code</th><th>Diagnose und Beleg</th><th>Status</th></tr></thead><tbody>{diagnoses.map((item) => <tr key={`${item.area}-${item.codes}`}><td>{item.area}</td><td><button className="data-link" onClick={() => onSearch(item.codes)}><code>{item.codes}</code></button></td><td><button className="data-link stacked" onClick={() => onSearch(item.diagnosis)}><strong>{item.diagnosis}</strong><small>{item.evidence}</small></button></td><td><span className="badge neutral">{item.status}</span></td></tr>)}</tbody></table></div>}</section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Behandelnde Ärzte und AU-Zuordnung</h2><InfoPopover label="Behandelnde Ärzte und AU-Zuordnung erklären" text={UI_HELP["Behandelnde Ärzte und AU-Zuordnung"]}/></span><p>Gesundheitskontakt Nord ist als Beispielkontakt hinterlegt.</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Fachgebiet</th><th>Gesichert dokumentiert</th><th>Noch offen</th></tr></thead><tbody>{healthData.doctors.map((item) => <tr key={item.name}><td><button className="data-link" onClick={() => onSearch(item.name)}><strong>{item.name}</strong></button></td><td>{item.field}</td><td>{item.confirmed}</td><td>{item.open}</td></tr>)}</tbody></table></div></section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Arbeitsunfähigkeitszeiten</h2><InfoPopover label="Arbeitsunfähigkeitszeiten erklären" text={UI_HELP["Arbeitsunfähigkeitszeiten"]}/></span><p>Sortiert nach Anfangsdatum, neueste Einträge zuerst.</p></div><span className="badge neutral">{healthData.auTimeline.length} Einträge</span></div><div className="table-wrap"><table><thead><tr><th>Beginn</th><th>Ende</th><th>ICD-Code(s)</th><th>Einordnung</th></tr></thead><tbody>{healthData.auTimeline.map((item) => <tr key={`${item.start}-${item.end}`}><td><strong>{item.start}</strong></td><td>{item.end}</td><td><button className="data-link" onClick={() => onSearch(item.codes)}><code>{item.codes}</code></button></td><td>{item.group}</td></tr>)}</tbody></table></div></section>
  </>;
}

function Benefits({ onGo, onDocuments, onSearch }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) { return <><PageTitle icon={<BriefcaseMedical/>} title="Krankenkasse & Leistungen" text="Arbeitsunfähigkeit, Leistung und Entgeltfortzahlung: Dokumentierte Leistungen, Fristen und frühere Zeiträume." />
  <SubpageActions actions={menuPageActions.benefits} onGo={onGo} onDocuments={onDocuments}/>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Leistungen der Krankenkasse</h2><InfoPopover label="Leistungen der Krankenkasse erklären" text={UI_HELP["Leistungen der Krankenkasse"]}/></span><p>Zeiträume und Beträge laut Krankenkasse-Leistungsauskunft.</p></div><span className="badge neutral">1 Beispielfall</span></div><div className="payment-list">{healthData.sickPay.map((item) => <button className="payment-row" key={item.period} onClick={() => onSearch(`${item.period} ${item.group}`)}><strong>{item.period}</strong><span><b>{item.group}</b><small>{item.clarification}</small></span><em>{item.amount}</em><ChevronRight/></button>)}</div></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Fristen</h2><InfoPopover label="Fristdiagnosen erklären" text={UI_HELP["Fristdiagnosen"]}/></span><p>Einordnung nach dem derzeit dokumentierten Krankenkasse-Stand.</p></div></div><div className="table-wrap"><table><thead><tr><th>Beispielfall</th><th>Frist</th><th>Einordnung</th></tr></thead><tbody>{healthData.blockCases.map((item) => <tr key={item.period}><td><strong>{item.period}</strong></td><td><button className="data-link stacked" onClick={() => onSearch(item.code)}><code>{item.code}</code><small>{item.diagnosis}</small></button></td><td>{item.detail}</td></tr>)}</tbody></table></div></section>
  <section className="card split-card"><div><h2>Offene Klärung</h2><p>Zuschuss für die neue Brille – Antwort liegt vor (Beispiel)</p></div><div className="callout warning"><FileClock/><div><strong>Antwort der Krankenkasse steht noch aus</strong><span>Die Beispielanfrage vom 02.03.2026 ist dokumentiert. Bis zur Antwort wird nichts ergänzt.</span></div></div></section></>; }

function Work({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary }) { const files = ["2026-03-02_Zeitkonto Anwesenheit 2026.pdf", "2025_Jahresübersicht Anwesenheit.pdf", "Anträge und Unterlagen zu Arbeitszeit und Urlaub"]; return <><PageTitle icon={<Landmark/>} title="Arbeit & Arbeitgeber" text="Arbeitszeitunterlagen, betriebliche Krankmeldungen und medizinische AU bleiben klar voneinander getrennt." />
  <SubpageActions actions={menuPageActions.work} onGo={onGo} onDocuments={onDocuments}/>
  <InfoNotice title="Wichtige Abgrenzung"><p>„KR“ belegt eine betriebliche Krankmeldung. Daraus lassen sich allein keine ärztlich bestätigte AU, Diagnose oder Leistungzahlung ableiten. Arbeitsstunden belegen Anwesenheit, nicht volle Arbeitsplanung.</p></InfoNotice>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Arbeitsverlauf</h2><InfoPopover label="Arbeitsverlauf erklären" text={UI_HELP["Arbeitsverlauf"]}/></span><p>Neueste Einträge stehen oben.</p></div><span className="badge neutral">Stand 14.03.2026</span></div><div className="table-wrap"><table><thead><tr><th>Zeitraum</th><th>Arbeitgeber-Eintrag</th><th>Einordnung</th></tr></thead><tbody>{healthData.workHistory.map((item) => <tr key={`${item.period}-${item.entry}`}><td><strong>{item.period}</strong></td><td><code>{item.entry}</code></td><td>{item.assessment}</td></tr>)}</tbody></table></div></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Zugeordnete Arbeitsunterlagen</h2><InfoPopover label="Zugeordnete Arbeitsunterlagen erklären" text={UI_HELP["Zugeordnete Arbeitsunterlagen"]}/></span><p>Für die Darstellung der Arbeitsphase berücksichtigt.</p></div></div><ul className="source-list interactive-source-list">{files.map((file) => <li key={file}><button onClick={() => onDocuments({ query: file })}><FileText size={16}/><span>{file}</span><ChevronRight/></button></li>)}<li className="source-missing"><span className="info-label">Info</span><span>Arbeitszeitunterlage 2025 (Beispiel)</span></li></ul></section></>; }

function Assessment({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary }) { return <><PageTitle icon={<Users/>} title="Anträge & Bescheide" text="Die zuvor getrennten Unterthemen sind hier als ein gemeinsamer Antrags- und Bescheinigungsbereich zusammengeführt." />
  <SubpageActions actions={menuPageActions.assessment} onGo={onGo} onDocuments={onDocuments}/>
  <InfoNotice title="Ein gesundheitliches Gesamtbild – getrennte Quellen"><p>Anträge, Bescheide und Schriftverkehr mit Ämtern werden gemeinsam betrachtet. Herkunft und Zweck bleiben erkennbar.</p></InfoNotice>
  <section className="group-grid">{assessmentGroups.map((group) => <article className="card" key={group.title}><div className="card-heading"><div><h2>{group.title}</h2><p>{group.description}</p></div></div><ul className="source-list interactive-source-list">{group.files.map((file) => <li key={file}><button onClick={() => onDocuments({ query: file })}><FileText size={16}/><span>{file}</span><ChevronRight/></button></li>)}</ul></article>)}</section></>; }

function Correspondence({ onGo, onDocuments, onSearch }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) { return <><PageTitle icon={<FileClock/>} title="Anfragen & Antworten" text="Was wurde gefragt, was wurde beantwortet und welche Punkte sind noch offen? Neueste Vorgänge stehen oben." />
  <SubpageActions actions={menuPageActions.correspondence} onGo={onGo} onDocuments={onDocuments}/>
  <section className="card timeline-list">{healthData.correspondence.map((item) => <article key={`${item.date}-${item.subject}`}><div className="timeline-dot"/><div><span>{item.date} · {item.type}</span><button className="timeline-title-link" onClick={() => onDocuments({ query: item.subject })}>{item.subject}<ChevronRight/></button><p><strong>Anliegen:</strong> {item.request}</p><p><strong>Ergebnis:</strong> {item.answer}</p><span className="badge neutral">{item.status}</span></div></article>)}</section>
  <section className="card"><div className="card-heading"><div><h2>Offene Punkte</h2><p>Diese Liste wird mit jeder neuen Antwort fortgeschrieben.</p></div></div><div className="open-items interactive-open-items">{healthData.openItems.map((item) => <button key={item.title} onClick={() => onSearch(item.title)}><FileClock size={18}/><span><strong>{item.title}</strong><small>{item.next}</small></span><span className="badge warning">{item.priority}</span><ChevronRight/></button>)}</div></section></>; }

function Sources({ onDocuments, beispiele }: { onDocuments: OpenDocumentLibrary; beispiele: boolean }) { return <><PageTitle icon={<Archive/>} title="Unterlagen & Quellen" text="Unterlagen und Quellen: Die Online-Übersicht verbindet die Aussagen. Verbindlich bleiben die Originaldokumente." />
  <section className="card action-row"><div><span className="ui-heading-help"><h2>Dokumentenbibliothek</h2><InfoPopover label="Dokumentenbibliothek erklären" text={UI_HELP["Dokumentenbibliothek"]}/></span></div><button className="button primary" onClick={() => onDocuments()}><Archive size={17}/> Alle Dokumente ansehen</button></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Zentrale Unterlagen</h2><InfoPopover label="Zentrale Unterlagen erklären" text={UI_HELP["Zentrale Unterlagen"]}/></span></div><span className="badge neutral">{beispiele ? `${coreDocuments.length} Kerndokumente (Beispiel)` : "eigene Akte"}</span></div>{!beispiele ? <div className="empty-state" data-quellen-leer><Archive size={30}/><strong>Keine festen Beispielunterlagen in deiner Akte</strong><span>Deine eigenen Unterlagen stehen vollständig in der Dokumentenbibliothek – nach Bereich, Art und Datum sortierbar.</span><button className="button secondary" onClick={() => onDocuments()}><Archive size={17}/> Dokumentenbibliothek öffnen</button></div> : <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Unterlage</th><th>Bereich</th><th>Stand</th></tr></thead><tbody>{coreDocuments.map((item) => <tr key={`${item.date}-${item.name}`}><td><strong>{item.date}</strong></td><td><button className="data-link" onClick={() => onDocuments({ query: item.name })}>{item.name}</button></td><td><button className="data-link" onClick={() => onDocuments({ area: item.area })}>{item.area}</button></td><td><span className={`badge ${item.status === "Antwort offen" ? "warning" : "success"}`}>{item.status}</span></td></tr>)}</tbody></table></div>}</section>
  <InfoNotice title="Umgang mit Quellen"><p>Diagnosen, Zeiträume und Ärzte nur aus Originalunterlagen übernehmen. Neueste Einträge stehen oben; Fachbefund, eAU, betriebliche Krankmeldung und eigene Notiz bleiben getrennt.</p></InfoNotice></>; }

// Klaus 2026-11-06: Symbol, Titel und Knopf der Seite (z. B. „alle auf/zu“) auf einer Linie; das „?“ klein rechts oben am Titel wie ein ©.
function PageTitle({ icon, title, text, extra }: { icon: React.ReactNode; title: string; text: string; extra?: React.ReactNode }) { const t = useRef<HTMLSpanElement>(null); useEinzeilig(t); return <header className="page-title kopf-flach"><div>{icon}</div><h1 data-einzeilig><span ref={t} className="kopf-text">{title}</span><span className="kopf-frage"><InfoPopover label={`${title} erklären`} text={text}/></span></h1>{extra && <span className="page-title-rechts">{extra}</span>}</header>; }


function ExportDialog({ sourceHandle, documents, localDocuments, records, relations, auditLog, onClose, onNotice }: {
  sourceHandle: FileSystemDirectoryHandle | null;
  documents: UploadedDocument[];
  localDocuments: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  auditLog: unknown[];
  onClose: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [selected, setSelected] = useState<FamilyExportScope[]>(allFamilyExportScopes);
  const [destination, setDestination] = useState<FileSystemDirectoryHandle | null>(null);
  const [includeOriginals, setIncludeOriginals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useActivityMessage("error", "Export");
  const allSelected = selected.length === allFamilyExportScopes.length;
  const toggle = (scope: FamilyExportScope) => setSelected((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  const selectDestination = async () => {
    try { setDestination(await chooseExportDestination()); setError(""); }
    catch (reason) { if ((reason as DOMException)?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Der Zielordner konnte nicht geöffnet werden."); }
  };
  const startExport = async () => {
    if (!destination) return setError("Bitte zuerst einen lokalen Zielordner auswählen.");
    if (!selected.length) return setError("Bitte mindestens einen Bereich auswählen.");
    setSubmitting(true); setError("");
    const exportedAt = new Date().toISOString();
    try {
      const references = [
        ...localDocuments.map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, status: item.status, storageType: item.storageType, storedPath: item.storedPath, relativePath: item.relativePath, source: item.source })),
        ...documents.map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, status: item.status, storageType: "online-r2", storedPath: null, relativePath: null, source: "Online-Altbestand" })),
      ];
      const archive = buildFamilyArchiveExport({
        appVersion: APP_VERSION,
        exportedAt,
        selectedScopes: selected,
        includeOriginals,
        storageName: destination.name,
        healthData,
        documents: references,
        records,
        relations,
        auditLog,
        systemReports: readSystemCheckReports(),
        versionHistory,
      });
      const result = await writeFamilyArchiveExport({ destination, source: sourceHandle, json: archive.json, html: archive.html, includeOriginals, exportedAt });
      onNotice({ kind: result.complete ? "success" : "info", text: result.complete ? `Der Export wurde vollständig im Ordner „${result.folderName}“ gespeichert. Ausgangsdaten blieben unverändert.` : `Der Export wurde im Ordner „${result.folderName}“ gespeichert und im Exportbericht eindeutig als unvollständig gekennzeichnet.` });
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Der Export konnte nicht abgeschlossen werden."); }
    finally { setSubmitting(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="modal-head"><div><span className="badge success">Lokaler Export</span><span className="ui-heading-help"><h2 id="export-title">Familienakte exportieren</h2><InfoPopover label="Familienakte exportieren erklären" text={UI_HELP["Familienakte exportieren"]}/></span></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>
    <section className="export-step"><h3>1. Umfang auswählen</h3><label className="check-row"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : allFamilyExportScopes)}/><span><strong>Gesamte Familienakte</strong><small>Alle nachfolgenden Bereiche auswählen</small></span></label><div className="export-scope-grid">{allFamilyExportScopes.map((scope) => <label className="check-row" key={scope}><input type="checkbox" checked={selected.includes(scope)} onChange={() => toggle(scope)}/><span>{familyExportScopeLabels[scope]}</span></label>)}</div></section>
    <section className="export-step"><h3>2. Speicherort und Originale</h3><button className="button secondary" type="button" onClick={selectDestination}><Folder size={17}/>{destination ? `Ziel: ${destination.name}` : "Lokalen Zielordner auswählen"}</button><label className="check-row"><input type="checkbox" checked={includeOriginals} disabled={!sourceHandle} onChange={(event) => setIncludeOriginals(event.target.checked)}/><span><strong>Freigegebene lokale Originaldokumente einbeziehen</strong><small>{sourceHandle ? "Originaldateien werden kopiert; der Ausgangsbestand bleibt unverändert." : "Dafür muss zuerst ein lokaler PC-, USB- oder OneDrive-Ordner verbunden sein."}</small></span></label></section>
    <section className="export-review"><h3>Vor dem Export</h3><dl><div><dt>Speicherort</dt><dd>{destination?.name || "noch nicht ausgewählt"}</dd></div><div><dt>Ausgewählte Bereiche</dt><dd>{selected.length} von {allFamilyExportScopes.length}</dd></div><div><dt>Originaldokumente</dt><dd>{includeOriginals ? "werden aus dem freigegebenen lokalen Tresor kopiert" : "nicht enthalten"}</dd></div><div><dt>Verschlüsselung durch die Familienakte</dt><dd><strong>Nein – der Export wird unverschlüsselt gespeichert</strong></dd></div></dl></section>
    <p className="fine-print">Es wird ein neuer Exportordner angelegt. Vorhandene Dateien werden nicht gelöscht, verschoben, umbenannt oder überschrieben. Fehlender Dateizugriff wird im Exportbericht verständlich aufgeführt.</p>{error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><button className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" disabled={submitting || !destination || !selected.length} onClick={startExport}><Download size={17}/>{submitting ? "Export wird erstellt …" : "Export jetzt bewusst starten"}</button></div>
  </div></div>;
}

type IntakeFristWahl = { recordType: "deadline" | "task"; title: string; dueAt: string };
const ZUORDNUNG_NAMEN: Record<string, string> = { person: "Person", organisation: "Organisation", object: "Objekt", deadline: "Frist", task: "Aufgabe" };

/** Text einer Unterlage wie im Prüfdialog: Textebene, sonst Texterkennung auf dem Gerät (Tesseract aus Workflow PDF). Nichts geht hinaus.
 *  Klaus 2026-10-31: „die Texterkennung hat nur Dokumentenscan und Datum erfasst“ – PDFs und Fotos werden darum ganz gelesen.
 *  Die Sammelbestätigung (2.28.39) liest mit derselben Funktion, damit beide Wege dieselben Angaben speichern. */
async function dokumentTextLesen(file: File, ocrLaeuft: (an: boolean) => void = () => undefined) {
  let value = await extractDocumentIntakeTextHint(file).catch(() => "");
  const istPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf", istBild = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!value.trim() && (istPdf || istBild)) {
    ocrLaeuft(true);
    try {
      const { dokumentText, dokumentTextOcr } = await import("./ki-auftrag-dialog");
      if (istPdf) value = await dokumentText(file).catch(() => "");
      if (!value.trim() || value.trim().length < 20) value = await dokumentTextOcr(file).catch(() => value);
    } finally { ocrLaeuft(false); }
  }
  return value.slice(0, 300000);
}

/** Hinweise, die jede Ablage aus der Eingangszentrale bekommt (Prüfdialog und Sammelbestätigung gleich). */
function eingangNotizen(queued: CentralIntakeQueueItem | null | undefined, notes: string | null) {
  let text = notes;
  if (queued?.analysis?.email) {
    const email = queued.analysis.email;
    text = [text, `E-Mail-Herkunft: ${email.sender || "Absender unbekannt"}`, email.messageId ? `Message-ID: ${email.messageId}` : "", email.attachmentNames.length ? `Anlagen: ${email.attachmentNames.join(", ")}` : ""].filter(Boolean).join(" · ");
  }
  // Ohne Versionsnummer in der sichtbaren Notiz (Klaus 08.11.2026: interne Angaben aus der Oberfläche); die Systemprüfung zählt beide Schreibweisen.
  if (queued?.analysis) text = [text, `Eingangszentrale: ${queued.analysis.fileKind} · kontrolliert bestätigt`].filter(Boolean).join(" · ");
  return text;
}

function UploadDialog({ initialFile, uebergabeVorschlag, source, knownDocuments, records, relations, decisions, suggestedCaseId, fristVorgabe, onClose, onAnsehen, onDasselbe, onSave }: {
  initialFile: File | null; source: DocumentIntakeSource;
  uebergabeVorschlag?: UebergabeVorschlag;
  knownDocuments: Array<{ id: string; originalName: string; sizeBytes: number; documentDate?: string | null; updatedAt?: string | null; category?: string | null; notes?: string | null; titel?: string | null }>;
  records: FamilyRecordUnion[]; relations: FamilyRelation[]; decisions: ContextLinkDecision[]; suggestedCaseId: string | null;
  /** Aus der Warteschlange: erkannte Frist (Datum oder leer); angehakt, wenn „Als Frist übernehmen“ getippt wurde. */
  fristVorgabe?: { datum: string | null; angehakt: boolean } | null;
  onClose: () => void;
  /** Vorhandenes Dokument nur ansehen – der Prüfdialog bleibt offen (Prüfbericht H1). */
  onAnsehen: (id: string) => void;
  /** „Ist dasselbe“: nichts neu ablegen, den Eingang mit dem vorhandenen Dokument abschließen. */
  onDasselbe: (id: string) => void;
  onSave: (file: File, data: { category: string; documentDate: string | null; notes: string | null; allowDuplicate?: boolean; assignmentLinks?: Array<{ toType: FamilyRecordUnion["recordType"]; toId: string; relationType: string }>; newCaseTitle?: string; rejectedContext?: ContextLinkSuggestion; resolveOpenPointEventId?: string; titel?: string | null; textAuszug?: string | null; fristen?: IntakeFristWahl[] }) => Promise<LocalDocument>;
}) {
  const reportActivity = useActivity();
  const initialPlan = initialFile ? buildDocumentIntakePlan({ file: initialFile, source, documents: knownDocuments, records }) : null;
  const inputRef = useRef<HTMLInputElement>(null); const [file, setFile] = useState<File | null>(initialFile);
  const [textHint, setTextHint] = useState("");
  const [textLesen, setTextLesen] = useState(false);
  // Klaus 2026-11-01 (Antwort 4): „Brief von …, Datum“ als Titel-Vorschlag — aus dem gelesenen Text mit briefkopf.js (Workflow PDF)
  const [briefTitelHint, setBriefTitelHint] = useState("");
  // Klaus 2026-11-01: Absender · Empfänger · Datum · Nummern sichtbar und änderbar; von Hand Geändertes überschreibt kein neues Lesen.
  const [brief, setBrief] = useState<BriefAngaben | null>(null);
  const [briefHand, setBriefHand] = useState(false);
  const [briefNummern, setBriefNummern] = useState("");
  const [dragging, setDragging] = useState(false); const [submitting, setSubmitting] = useState(false); const [error, setError] = useActivityMessage("error", "Unterlage lokal speichern");
  const [category, setCategory] = useState(initialPlan?.category || "Ärztliche Unterlage / Befund");
  const [documentDate, setDocumentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [dictationHint, setDictationHint] = useState("");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const plan: DocumentIntakePlan | null = useMemo(() => file ? buildDocumentIntakePlan({ file: { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, textHint, titleHint: briefTitelHint || undefined, brief }, source, documents: knownDocuments, records }) : null, [file, textHint, briefTitelHint, brief, source, knownDocuments, records]);
  useEffect(() => {
    let aus = false; setBriefTitelHint("");
    if (!briefHand) { setBrief(null); setBriefNummern(""); }
    if (!textHint.trim()) return () => { aus = true; };
    void (async () => {
      const { briefkopfLesen } = await import("./wfpdf-kern");
      const kopf = await briefkopfLesen(textHint.split(/\r?\n/));
      const t = briefTitel(kopf);
      if (!aus && t) setBriefTitelHint(t);
      const a = briefAngaben(kopf as BriefkopfRoh);
      if (!aus && a && !briefHand) { setBrief(a); setBriefNummern(nummernText(a.nummern)); }
      // Dokumentdatum: Briefkopf zuerst, sonst „Kaufdatum“, „Datum“, „vom“ … aus dem gelesenen Text (Prüfbericht H5).
      const datum = a?.datum || erkenneDokumentDatum(textHint);
      if (!aus && datum) setDocumentDate((d) => d || datum);
    })().catch(() => { const datum = erkenneDokumentDatum(textHint); if (!aus && datum) setDocumentDate((d) => d || datum); });
    return () => { aus = true; };
    // briefHand absichtlich nicht als Abhängigkeit: von Hand Geändertes soll nicht neu gelesen werden
  }, [textHint]);
  const briefAendern = (feld: "absender" | "empfaenger", wert: string) => { setBriefHand(true); setBrief((b) => ({ ...(b || { absender: "", empfaenger: "", datum: "", nummern: [], thema: "", betreff: "" }), [feld]: wert })); };
  const nummernAendern = (text: string) => { setBriefHand(true); setBriefNummern(text); setBrief((b) => ({ ...(b || { absender: "", empfaenger: "", datum: "", nummern: [], thema: "", betreff: "" }), nummern: nummernAusText(text) })); };
  // Frühere Unterlagen mit derselben Nummer — und deren Vorgang als Vorschlag
  const gleich = useMemo(() => gleicheNummer(knownDocuments, brief?.nummern || []).slice(0, 3), [knownDocuments, brief]);
  const vorgangAusNummer = useMemo(() => vorgangVon(relations, gleich.map((g) => g.dokument.id)), [relations, gleich]);
  const [lifeArea, setLifeArea] = useState<string>(initialPlan?.lifeArea || "Archiv");
  const [documentType, setDocumentType] = useState<string>(initialPlan?.documentType || "Dokument");
  const [privacyClass, setPrivacyClass] = useState<IntakePrivacyClass>(initialPlan?.privacyClass || "vertraulich");
  const [choiceField, setChoiceField] = useState<"lifeArea" | "documentType" | "privacyClass" | "category" | null>(null);
  const [customChoice, setCustomChoice] = useState("");
  const [overrides, setOverrides] = useState({ lifeArea: false, documentType: false, privacyClass: false, category: false });
  const choiceOptions = useMemo(() => buildIntakeChoiceOptions(knownDocuments, categories), [knownDocuments]);
  const contextSuggestions = useMemo(() => file ? suggestIncomingDocumentContext({ documents: knownDocuments.map((item) => ({ id: item.id, originalName: item.originalName, documentDate: item.documentDate, updatedAt: item.updatedAt })), records, relations, decisions, fileName: file.name, notes: [notes, documentType === "Dokument" ? "" : documentType, textHint.slice(0, 2000)].filter(Boolean).join(" "), date: documentDate || undefined }) : [], [file, knownDocuments, records, relations, decisions, notes, documentDate, documentType, textHint]);
  const [selectedCaseId, setSelectedCaseId] = useState(suggestedCaseId || "");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [rejectedContext, setRejectedContext] = useState<ContextLinkSuggestion | undefined>();
  const [resolveOpenPointEventId, setResolveOpenPointEventId] = useState("");
  const [fremdVerwendet, setFremdVerwendet] = useState(false);
  // P4: sichere Größe aus der Geräteprüfung; darüber nur „Verkleinern“ oder „Abbrechen“ (Klaus 07.11., Frage t).
  const [grenze, setGrenze] = useState(() => aktuelleGrenze());
  const [kleinSchritt, setKleinSchritt] = useState(""); const [kleinFehler, setKleinFehler] = useState(""); const [kleinLaeuft, setKleinLaeuft] = useState(false);
  const [kleinNotiz, setKleinNotiz] = useState("");
  useEffect(() => { let aus = false; void grenzeMessen().then((g) => { if (!aus) setGrenze(g); }); return () => { aus = true; }; }, []);
  const zuGross = !!file && file.size > grenze.bytes;
  const kleinMachen = async () => {
    if (!file) return; setKleinLaeuft(true); setKleinFehler(""); setKleinSchritt("Verkleinern beginnt …");
    try {
      const { verkleinern } = await import("./verkleinern");
      const r = await verkleinern(file, grenze.bytes, setKleinSchritt);
      if (r.ok) { setFile(r.file); setKleinNotiz(r.notiz); setKleinSchritt(""); reportActivity({ kind: "info", text: `Datei ${r.notiz}. Noch nicht gespeichert.` }); }
      else { setKleinFehler(r.text); setKleinSchritt(""); }
    } catch (reason) { setKleinFehler(reason instanceof Error ? `Verkleinern nicht möglich: ${reason.message}` : "Verkleinern nicht möglich."); setKleinSchritt(""); }
    finally { setKleinLaeuft(false); }
  };
  useEffect(() => {
    let cancelled = false;
    if (!file) { setTextHint(""); return () => { cancelled = true; }; }
    // Klaus 2026-10-31: „die Texterkennung hat nur Dokumentenscan und Datum erfasst“ — PDFs und Fotos wurden gar nicht gelesen.
    // Jetzt: Textebene des PDF, sonst Texterkennung auf dem Gerät (Tesseract aus Workflow PDF, höchstens 5 Seiten). Nichts geht hinaus.
    void dokumentTextLesen(file, (an) => { if (!cancelled) setTextLesen(an); }).then((value) => { if (!cancelled) setTextHint(value); })
      .catch(() => { if (!cancelled) { setTextHint(""); setTextLesen(false); } });
    return () => { cancelled = true; };
  }, [file]);
  useEffect(() => {
    if (!plan) return;
    if (!overrides.lifeArea) setLifeArea(plan.lifeArea);
    if (!overrides.documentType) setDocumentType(plan.documentType);
    if (!overrides.privacyClass) setPrivacyClass(plan.privacyClass);
    if (!overrides.category) setCategory(plan.category);
  }, [plan, overrides]);
  // Die Auswahl folgt dem Vorschlag, bis jemand selbst wählt (Klaus 2026-10-31: „wird jedes Mal wieder zurückgesetzt“). Vorher setzte
  // eine Automatik jede leere Auswahl sofort wieder auf den Vorschlag; „Nicht verknüpfen“ war wirkungslos.
  // Prüfbericht 08.11.2026 (H2): Ein Vorschlag wird nur gezeigt; verknüpft wird erst nach „Verknüpfen“ oder eigener Wahl.
  // Vorbelegt ist nur ein Vorgang, aus dem heraus man die Unterlage bewusst hinzufügt (suggestedCaseId).
  const selbstGewaehlt = useRef(false);
  const waehle = (id: string) => { selbstGewaehlt.current = true; setSelectedCaseId(id); };
  // Zuordnungen zu Person, Organisation, Objekt: nur angehakte werden gespeichert (vorher still als „betrifft“).
  const [zuordnungWahl, setZuordnungWahl] = useState<Set<string>>(() => new Set());
  const zuordnungKey = (step: { stage: string; selectedId?: string | null }) => `${step.stage}:${step.selectedId}`;
  // Punkt 8 (2.28.39): selbst angelegte Personen, Organisationen und Objekte auch ohne Vorschlag zuordnen – mit Namen.
  const [weitereZuordnung, setWeitereZuordnung] = useState("");
  const zuordnungListen = useMemo(() => (["person", "organisation", "object"] as const).map((typ) => ({ typ, items: records.filter((r) => r.recordType === typ && r.status !== "archiviert").sort((x, y) => cockpitRecordLabel(x).localeCompare(cockpitRecordLabel(y), "de")) })).filter((g) => g.items.length), [records]);
  // Titel: folgt dem Vorschlag, bis jemand ihn ändert.
  const [titel, setTitel] = useState(""); const [titelHand, setTitelHand] = useState(false);
  useEffect(() => { if (!titelHand && plan) setTitel(plan.title); }, [plan, titelHand]);
  // Erkannte Frist, Garantie und Aufgabe (Prüfbericht H3): angezeigt, angelegt wird nur Angehaktes – verknüpft mit dem Dokument.
  const erkannt = useMemo(() => {
    const funde = erkenneFristen(textHint);
    const zeilen: Array<{ key: string; art: "Frist" | "Garantie" | "Aufgabe"; recordType: "deadline" | "task"; datum: string; ausschnitt: string }> = [];
    const garantie = funde.find((f) => f.art === "garantie");
    const frist = funde.find((f) => f.art === "frist");
    if (frist || fristVorgabe) zeilen.push({ key: "frist", art: "Frist", recordType: "deadline", datum: frist?.datum || fristVorgabe?.datum || "", ausschnitt: frist?.ausschnitt || "" });
    if (garantie) zeilen.push({ key: "garantie", art: "Garantie", recordType: "deadline", datum: garantie.datum || "", ausschnitt: garantie.ausschnitt });
    if (erkenneAufgabe(textHint)) zeilen.push({ key: "aufgabe", art: "Aufgabe", recordType: "task", datum: frist?.datum || fristVorgabe?.datum || "", ausschnitt: "" });
    return zeilen;
  }, [textHint, fristVorgabe]);
  const [fristWahl, setFristWahl] = useState<Record<string, { an?: boolean; title?: string; datum?: string }>>((): Record<string, { an?: boolean; title?: string; datum?: string }> => fristVorgabe?.angehakt ? { frist: { an: true } } : {});
  const fristZeile = (z: (typeof erkannt)[number]) => {
    const w = fristWahl[z.key] || {};
    const name = titel.trim() || plan?.title || "Unterlage";
    return { ...z, an: Boolean(w.an), title: w.title ?? (z.art === "Garantie" ? `Garantie endet: ${name}` : z.art === "Aufgabe" ? `Erledigen: ${name}` : `Frist: ${name}`), datum: w.datum ?? z.datum };
  };
  const setFrist = (key: string, teil: { an?: boolean; title?: string; datum?: string }) => setFristWahl((alt) => ({ ...alt, [key]: { ...alt[key], ...teil } }));
  const fristRef = useRef<HTMLElement>(null);
  useEffect(() => { if (!fristVorgabe?.angehakt) return undefined; const t = window.setTimeout(() => fristRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400); return () => window.clearTimeout(t); }, [fristVorgabe?.angehakt]);
  const selectFile = (selected: File | null) => {
    setFile(selected); setKleinNotiz(""); setKleinFehler(""); setKleinSchritt(""); setTextHint(""); setBriefHand(false); setBrief(null); setBriefNummern(""); setAllowDuplicate(false); setError(""); setChoiceField(null); setCustomChoice("");
    setNotes(""); setDocumentDate(""); setFremdVerwendet(false);
    setSelectedCaseId(suggestedCaseId || ""); setNewCaseTitle(""); setRejectedContext(undefined); setResolveOpenPointEventId(""); selbstGewaehlt.current = false;
    setZuordnungWahl(new Set()); setTitelHand(false); setTitel(""); setFristWahl({});
    setOverrides({ lifeArea: false, documentType: false, privacyClass: false, category: false });
    if (selected) {
      const nextPlan = buildDocumentIntakePlan({ file: selected, source, documents: knownDocuments, records });
      setLifeArea(nextPlan.lifeArea); setDocumentType(nextPlan.documentType); setPrivacyClass(nextPlan.privacyClass); setCategory(nextPlan.category);
      reportActivity({ kind: "info", issue: "eingang-pruefung", text: nextPlan.duplicateIds.length ? "Mögliche Dublette erkannt · vorhandenes Dokument ansehen. Noch keine Datei gespeichert." : "1 Datei zur Zuordnungsprüfung ausgewählt. Noch keine Datei gespeichert; Originaldatei unverändert." });
    }
  };
  const chooseSpokenDate = (spoken: string) => {
    const parsed = parseGermanDate(spoken);
    if (parsed) { setDocumentDate(parsed); setDictationHint(`Dokumentdatum ${fmtDate(parsed)} wurde übernommen.`); }
    else setDictationHint("Das Datum wurde nicht sicher erkannt. Bitte zum Beispiel „7. Oktober 2026“ sagen.");
  };
  const choiceConfig = choiceField ? {
    lifeArea: { label: "Lebensbereich", value: lifeArea, options: choiceOptions.lifeAreas, custom: true },
    documentType: { label: "Dokumentenart", value: documentType, options: choiceOptions.documentTypes, custom: true },
    privacyClass: { label: "Datenschutz", value: privacyClass, options: INTAKE_PRIVACY_CLASSES, custom: false },
    category: { label: "Bereich", value: category, options: choiceOptions.categories, custom: true },
  }[choiceField] : null;
  const openChoice = (field: NonNullable<typeof choiceField>) => { setCustomChoice(""); setChoiceField(field); };
  const applyChoice = (field: NonNullable<typeof choiceField>, value: string) => {
    const clean = value.replace(/[·\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100); if (!clean) return;
    if (field === "lifeArea") setLifeArea(clean);
    if (field === "documentType") setDocumentType(clean);
    if (field === "privacyClass") setPrivacyClass(clean as IntakePrivacyClass);
    if (field === "category") setCategory(clean);
    setOverrides((current) => ({ ...current, [field]: true }));
    setChoiceField(null); setCustomChoice(""); setError("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!file) return setError("Bitte zuerst eine Datei auswählen.");
    if (plan?.duplicateIds.length && !allowDuplicate) return setError("Bitte die mögliche Dublette zuerst öffnen und vergleichen oder ausdrücklich „Trotzdem übernehmen“ bestätigen.");
    setSubmitting(true); setError(""); const form = new FormData(event.currentTarget);
    const userNotes = String(form.get("notes") || "").trim();
    const manuallyAdjusted = Object.values(overrides).some(Boolean);
    const intakeNotes = plan ? [`FaWoGa: ${lifeArea}`, `Dokumentart: ${documentType}`, `Datenschutz: ${privacyClass}`, `Eingang: ${quelleName(source)}`, manuallyAdjusted ? "Zuordnung vom Benutzer angepasst" : "Intelligenter Vorschlag übernommen", briefZeile(brief)].filter(Boolean).join(" · ") : "";
    const stageType: Partial<Record<string, FamilyRecordUnion["recordType"]>> = { person: "person", organisation: "organisation", object: "object", case: "case", deadline: "deadline", task: "task" };
    // Nur ausdrücklich angehakte Zuordnungen und der gewählte Vorgang werden gespeichert (Prüfbericht H2, K8).
    const assignmentLinks = (plan?.assignment.steps || []).filter((step) => step.selectedId && stageType[step.stage] && step.stage !== "case" && step.stage !== "area" && zuordnungWahl.has(zuordnungKey(step))).map((step) => ({ toType: stageType[step.stage]!, toId: step.selectedId!, relationType: "betrifft" }));
    if (selectedCaseId) assignmentLinks.push({ toType: "case", toId: selectedCaseId, relationType: "gehört zu" });
    const weitere = records.find((r) => r.id === weitereZuordnung);
    if (weitere && !assignmentLinks.some((link) => link.toId === weitere.id)) assignmentLinks.push({ toType: weitere.recordType, toId: weitere.id, relationType: "betrifft" });
    const fristen = erkannt.map(fristZeile).filter((z) => z.an);
    const unvollstaendig = fristen.find((z) => !z.title.trim() || !z.datum);
    if (unvollstaendig) { setSubmitting(false); return setError(`${unvollstaendig.art}: bitte Bezeichnung und Datum eintragen oder den Haken entfernen.`); }
    // Titel und kurzer Textauszug für die Suche; bei Gesundheitsunterlagen bleibt beides weg (Gesundheitsschutz unverändert).
    const geschuetzt = lifeArea === "Gesundheit & Pflege" || isSensitiveHealthText(file.name, category, titel, textHint.slice(0, TEXTAUSZUG_MAX));
    try { await onSave(file, { category: category || "Sonstiges", documentDate: String(form.get("documentDate") || "") || null, notes: [userNotes, kleinNotiz, intakeNotes].filter(Boolean).join(" · ") || null, allowDuplicate, assignmentLinks, newCaseTitle: newCaseTitle.trim() || undefined, rejectedContext, resolveOpenPointEventId: resolveOpenPointEventId || undefined,
      titel: geschuetzt ? null : titel.trim() || null, textAuszug: geschuetzt ? null : textHint.slice(0, TEXTAUSZUG_MAX) || null,
      fristen: fristen.map((z) => ({ recordType: z.recordType, title: z.title.trim(), dueAt: z.datum })) }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Lokales Speichern nicht möglich."); setSubmitting(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal intake-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-head"><div><span className="badge success">Gemeinsamer Dokumenteneingang</span><span className="ui-heading-help"><h2 id="upload-title">Neue Unterlage prüfen und lokal ablegen</h2><InfoPopover label="Neue Unterlage prüfen und lokal ablegen erklären" text={UI_HELP["Neue Unterlage prüfen und lokal ablegen"]}/></span></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div><form onSubmit={submit}>
    <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
    <button type="button" className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0] || null); }}><Upload size={32}/><strong>{file ? file.name : "Datei hier ablegen oder auswählen"}</strong><span>{file ? `${fmtBytes(file.size)}${textLesen ? " · Text wird gelesen …" : textHint.trim() ? " · Text gelesen" : ""}` : `PDF, DOCX, XLSX, MSG, VTT, ZIP oder Bilddatei · höchstens ${mbText(grenze.bytes)}`}</span></button>
    {zuGross && file && <section className="card zu-gross-karte" data-zu-gross role="alert" aria-label="Datei zu groß für dieses Gerät"><strong>Die Datei hat {mbText(file.size)}. Dieses Gerät schafft sicher {mbText(grenze.bytes)}.</strong>{verkleinerbar(file) ? <ul><li>Verkleinern behält mindestens 300 dpi.</li><li>Danach liest die Texterkennung beide Fassungen; leidet der Text, wird die kleine verworfen.</li></ul> : <p>Diese Datei besteht nicht aus Fotos und lässt sich nicht verkleinern. Bitte am Rechner ablegen.</p>}{kleinSchritt && <p aria-live="polite" data-verkleinern-schritt>{kleinSchritt}</p>}{kleinFehler && <p className="form-error" data-verkleinern-fehler>{kleinFehler}</p>}<div className="button-row">{verkleinerbar(file) && !kleinFehler && <button type="button" className="button primary" data-verkleinern disabled={kleinLaeuft} onClick={() => void kleinMachen()}>{kleinLaeuft ? "Verkleinert …" : "Verkleinern"}</button>}<button type="button" className="button secondary" data-zu-gross-abbrechen disabled={kleinLaeuft} onClick={() => selectFile(null)}>Abbrechen</button></div></section>}
    {kleinNotiz && <p className="badge success" data-verkleinert>{kleinNotiz}</p>}
    {file && file === initialFile && uebergabeVorschlag && <section className="card" data-uebergabe-vorschlag aria-label="Vorschläge der anderen App">
      <strong>Vorschläge aus „{uebergabeVorschlag.quelle}“</strong>
      <p>Diese Angaben kommen aus einer anderen App. Prüfe sie selbst; sie bestätigen weder den Inhalt noch die Ablage.</p>
      <dl>{([['lebensbereich', 'Lebensbereich'], ['dokumentart', 'Dokumentenart'], ['vorgang', 'Vorgang'], ['hinweis', 'Hinweis']] as const).map(([key, label]) => uebergabeVorschlag[key] && <div key={key}><dt>{label}</dt><dd>{uebergabeVorschlag[key]}</dd></div>)}</dl>
      <button type="button" className="button secondary" disabled={fremdVerwendet} onClick={() => {
        if (!selbstGewaehlt.current) waehle("");
        if (uebergabeVorschlag.lebensbereich) applyChoice("lifeArea", uebergabeVorschlag.lebensbereich);
        if (uebergabeVorschlag.dokumentart) applyChoice("documentType", uebergabeVorschlag.dokumentart);
        const hint = [uebergabeVorschlag.vorgang ? `Vorgang laut ${uebergabeVorschlag.quelle}: ${uebergabeVorschlag.vorgang}` : "", uebergabeVorschlag.hinweis].filter(Boolean).join(" · ");
        if (hint) setNotes(previous => [previous, hint].filter(Boolean).join(" · "));
        setFremdVerwendet(true);
      }}>{fremdVerwendet ? "Vorschläge im Formular – weiter änderbar" : "Vorschläge in das Formular übernehmen"}</button>
      <p>Ein genannter Vorgang wird als Hinweis eingetragen. Eine Verknüpfung oder ein neuer Vorgang entsteht erst durch deine Auswahl und den Speicherbefehl.</p>
    </section>}
    {file && (brief || textHint.trim()) && <section className="intake-briefkopf" data-briefkopf aria-label="Aus dem Briefkopf"><strong>Aus dem Briefkopf</strong>{!brief && <small data-briefkopf-leer>Kein Briefkopf erkannt — die Angaben bleiben leer, nichts wird geraten.</small>}
      <label><span>Absender</span><input data-brief-feld="absender" value={brief?.absender || ""} onChange={(e) => briefAendern("absender", e.target.value)} placeholder="nicht erkannt"/></label>
      <label><span>Empfänger</span><input data-brief-feld="empfaenger" value={brief?.empfaenger || ""} onChange={(e) => briefAendern("empfaenger", e.target.value)} placeholder="nicht erkannt"/></label>
      <label><span>Kunden-/Aktennummer</span><input data-brief-feld="nummern" value={briefNummern} onChange={(e) => nummernAendern(e.target.value)} placeholder="z. B. Kundennummer 12345"/></label>
      {brief?.thema && <small data-brief-thema>Thema: {brief.thema}</small>}
      {gleich.length > 0 && <div className="intake-brief-gleich" data-brief-gleich>{gleich.map((g) => <span key={g.dokument.id}>{g.nummer.art} {g.nummer.wert} auch in <button type="button" className="text-link" onClick={() => onAnsehen(g.dokument.id)} title="Nur ansehen – diese Prüfung bleibt offen">{dokumentTitel(g.dokument)}</button></span>)}{vorgangAusNummer && <small data-brief-vorgang>{selectedCaseId === vorgangAusNummer ? <>Wird mit dem Vorgang dieser Unterlage verknüpft.</> : <>Vorgang dieser Unterlage: „{String((records.find((record) => record.id === vorgangAusNummer)?.data as { title?: string } | undefined)?.title || "Vorgang")}“ <button type="button" className="text-link" onClick={() => { waehle(vorgangAusNummer); setNewCaseTitle(""); setRejectedContext(undefined); }} data-brief-vorgang-waehlen>Verknüpfen</button></>}</small>}</div>}
    </section>}
    {plan && <section className={`intake-analysis confidence-${Object.values(overrides).some(Boolean) ? "angepasst" : plan.confidence}`} data-zuordnung-karte aria-label="Vorschlag der Dokumentenverarbeitung"><div className="intake-analysis-head"><div><span>Zuordnung prüfen</span><strong data-zuordnung-titel>{titel.trim() || plan.title}</strong><small>Quelle: {quelleName(source)}</small></div><div className="zuordnung-stand"><span className="badge neutral" data-zuordnung-stand>{Object.values(overrides).every(Boolean) ? "bestätigt" : Object.values(overrides).some(Boolean) ? "von dir angepasst" : plan.confidence === "unklar" ? "bitte prüfen" : plan.confidence}</span><label className="check-row zuordnung-stimmt"><input type="checkbox" data-zuordnung-stimmt checked={Object.values(overrides).every(Boolean)} onChange={(event) => setOverrides(event.target.checked ? { lifeArea: true, documentType: true, privacyClass: true, category: true } : { lifeArea: false, documentType: false, privacyClass: false, category: false })}/><span className="zuordnung-stimmt-text">Zuordnung stimmt</span></label></div></div><dl className="intake-choice-grid"><div className="intake-choice-card"><dt>Lebensbereich</dt><dd>{lifeArea}<small>{overrides.lifeArea ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("lifeArea")} aria-label="Lebensbereich auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Dokumentenart</dt><dd>{documentType}<small>{overrides.documentType ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("documentType")} aria-label="Dokumentenart auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Datenschutz</dt><dd>{privacyClass}<small>{overrides.privacyClass ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("privacyClass")} aria-label="Datenschutzstufe auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Bereich</dt><dd>{category}<small>{overrides.category ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("category")} aria-label="Bereich auswählen"><Menu size={15}/></button></div></dl>
      {plan.assignment.steps.filter((step) => step.selectedId && step.stage !== "area" && step.stage !== "case" && ZUORDNUNG_NAMEN[step.stage]).slice(0, 4).map((step) => <label className="intake-assignment intake-zuordnung" key={step.stage} data-zuordnung={step.stage}><input type="checkbox" checked={zuordnungWahl.has(zuordnungKey(step))} onChange={(event) => setZuordnungWahl((alt) => { const neu = new Set(alt); if (event.target.checked) neu.add(zuordnungKey(step)); else neu.delete(zuordnungKey(step)); return neu; })}/><span>{ZUORDNUNG_NAMEN[step.stage]}</span><strong>{step.selectedLabel}</strong><small>{zuordnungWahl.has(zuordnungKey(step)) ? "wird verknüpft" : "Vorschlag – nur mit Haken verknüpfen"}</small></label>)}
      {zuordnungListen.length > 0 && <label className="intake-weitere-zuordnung"><span>Person, Organisation oder Objekt zuordnen</span><select value={weitereZuordnung} onChange={(event) => setWeitereZuordnung(event.target.value)} data-zuordnung-wahl><option value="">Keine weitere Zuordnung</option>{zuordnungListen.map((g) => <optgroup key={g.typ} label={recordTypeDefinitions[g.typ].label}>{g.items.map((r) => <option key={r.id} value={r.id}>{cockpitRecordLabel(r)}</option>)}</optgroup>)}</select></label>}
      {plan.duplicateIds.length > 0 && <div className="duplicate-warning"><strong>Mögliche Dublette</strong><span>Ein gleich benanntes Dokument mit gleicher Dateigröße ist bereits registriert.</span>{plan.duplicateIds.map((id) => { const vorhanden = knownDocuments.find((d) => d.id === id); const name = vorhanden ? protectedFamilyLabel({ label: dokumentTitel(vorhanden), category: vorhanden.category, notes: vorhanden.notes }) : "vorhandenes Dokument"; return <span className="dublette-zeile" key={id} data-dublette={id}><button type="button" className="text-link" onClick={() => onAnsehen(id)} data-dublette-ansehen>„{name}“{vorhanden?.documentDate ? ` vom ${fmtDate(vorhanden.documentDate)}` : ""} ansehen <ChevronRight size={15}/></button><button type="button" className="button secondary compact-button" onClick={() => onDasselbe(id)} data-dublette-dasselbe>Ist dasselbe – nicht noch einmal ablegen</button></span>; })}<small>„Ansehen“ öffnet nur das vorhandene Dokument; diese Prüfung bleibt offen.</small><label className="check-row"><input type="checkbox" checked={allowDuplicate} onChange={(event) => { setAllowDuplicate(event.target.checked); reportActivity({ kind: "info", issue: "eingang-pruefung", text: event.target.checked ? "Mögliche Dublette: „Trotzdem übernehmen“ von dir bestätigt. Erst der Speicherbefehl übernimmt die Datei." : "Zusätzliche Übernahme der möglichen Dublette nicht bestätigt. Noch keine Datei gespeichert." }); }}/><span><strong>Trotzdem übernehmen</strong><small>Nur auswählen, wenn es sich tatsächlich um eine andere Datei handelt.</small></span></label></div>}
    </section>}
    {file && <section className="context-suggestion" data-kontext>{(() => { const v = contextSuggestions[0]; const gewaehlt = selectedCaseId ? String((records.find((record) => record.id === selectedCaseId)?.data as { title?: string } | undefined)?.title || selectedCaseId) : "";
      return <><div><span className="eyebrow dark">{v ? "Möglicher vorhandener Zusammenhang" : "Zu einem Vorgang zuordnen (freiwillig)"}</span><h3 data-kontext-stand={selectedCaseId ? "verknuepft" : "offen"}>{selectedCaseId ? <>Wird verknüpft mit „{gewaehlt}“.</> : v ? <>Dieses Dokument passt vielleicht zu „{v.caseLabel}“ – noch nicht verknüpft.</> : <>Noch keinem Vorgang zugeordnet.</>}</h3><p>{v ? "Verknüpft wird erst nach „Verknüpfen“ oder deiner Auswahl. Die Datensätze werden nur verknüpft und nicht zusammengeführt." : records.some((record) => record.recordType === "case") ? "Wähle einen vorhandenen Vorgang oder lege bewusst einen neuen an – oder lass es offen." : "Freiwillig: Die Unterlage wird auch ohne Vorgang gespeichert."}</p>{v && <details><summary>Warum vorgeschlagen?</summary><ul>{v.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>}</div><div className="context-suggestion-actions">{v && <button type="button" className="button primary" data-kontext-verknuepfen onClick={() => { waehle(selectedCaseId || v.caseId); setNewCaseTitle(""); setRejectedContext(undefined); }}>Verknüpfen</button>}{records.some((record) => record.recordType === "case") ? <label><span>{v ? "Anderen Vorgang wählen" : "Vorgang wählen"}</span><select data-kontext-vorgang value={selectedCaseId} onChange={(event) => { waehle(event.target.value); setNewCaseTitle(""); setRejectedContext(undefined); }}><option value="">Noch nicht verknüpfen</option>{records.filter((record) => record.recordType === "case").map((record) => ({ id: record.id, title: String((record.data as { title?: string }).title || record.id) })).sort((a, b) => a.title.localeCompare(b.title, "de")).map((record) => <option value={record.id} key={record.id}>{record.title}</option>)}</select></label> : <p className="kontext-ohne-vorgang" data-kontext-ohne-vorgang><strong>Noch kein Vorgang angelegt.</strong> Ein Vorgang bündelt Unterlagen zu einer Sache, z. B. „Nebenkosten 2026“ oder „Autokauf“. Darunter kannst du einen anlegen – oder es offen lassen.</p>}<label><span>Neuen Vorgang nur bewusst anlegen</span><VoiceInput value={newCaseTitle} onValueChange={(spokenValue) => { setNewCaseTitle(spokenValue); waehle(""); setRejectedContext(undefined); }} placeholder="Bezeichnung des neuen Vorgangs" speechLabel="Neuer Vorgang"/></label>{v && <button type="button" className="button secondary" onClick={() => { waehle(""); setNewCaseTitle(""); setRejectedContext(v); }}>Nicht verknüpfen</button>}</div>{v && v.openPointEventIds.length > 0 && <label className="check-row context-open-point"><input type="checkbox" checked={resolveOpenPointEventId === v.openPointEventIds[0]} onChange={(event) => setResolveOpenPointEventId(event.target.checked ? v.openPointEventIds[0] : "")}/><span><strong>Offener Punkt möglicherweise geklärt</strong><small>Erst nach dieser Bestätigung wird der ausgewählte Rückfrage als erledigt markiert.</small></span></label>}</>; })()}</section>}
    <div className="form-grid intake-date-row">{file && <label><span>Titel</span><input data-intake-titel value={titel} onChange={(event) => { setTitelHand(true); setTitel(event.target.value); }} placeholder="Wie soll die Unterlage heißen?"/></label>}<label><span>Dokumentdatum, falls bekannt</span><div className="dictation-field"><DatumFeld name="documentDate" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)}/><DictationButton value="" onChange={chooseSpokenDate} label="Dokumentdatum" append={false}/></div></label></div>
    {file && erkannt.length > 0 && <section className="intake-fristen" ref={fristRef} data-intake-fristen aria-label="Im Text erkannt"><strong>Im Text erkannt – angelegt wird nur, was du anhakst</strong>{erkannt.map(fristZeile).map((z) => <div className={`intake-frist${z.an ? " an" : ""}`} key={z.key} data-intake-frist={z.key}><label className="check-row"><input type="checkbox" checked={z.an} onChange={(event) => setFrist(z.key, { an: event.target.checked })} data-intake-frist-an={z.key}/><span><strong>{z.art} anlegen</strong><small>{z.ausschnitt ? `„${z.ausschnitt}“` : z.datum ? `Datum ${deutschesDatum(z.datum)}` : "Datum bitte eintragen"} · wird mit diesem Dokument verknüpft</small></span></label>{z.an && <div className="form-grid"><label><span>Bezeichnung</span><input value={z.title} onChange={(event) => setFrist(z.key, { title: event.target.value })} data-intake-frist-titel={z.key}/></label><label><span>{z.art === "Garantie" ? "Garantie endet am" : "Fällig am"}</span><DatumFeld value={z.datum} onChange={(event) => setFrist(z.key, { datum: event.target.value })} data-intake-frist-datum={z.key}/></label></div>}</div>)}</section>}
    <label><span>Kurzer Hinweis, optional</span><div className="dictation-field"><textarea name="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Zum Beispiel: Antwort auf meine Anfrage vom 02.10.2026"/><DictationButton value={notes} onChange={setNotes} label="Hinweistext"/></div></label>{dictationHint && <div className="dictation-hint" aria-live="polite"><Mic size={16}/>{dictationHint}</div>}{error && <div className="form-error">{error}</div>}
    <p className="fine-print">Originaldateien werden nicht automatisch verschoben, umbenannt, gelöscht oder überschrieben. Das Dokument wird erst durch deinen Speicherbefehl in den freigegebenen Datentresor übernommen.</p>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" className="button primary" disabled={submitting || !file || zuGross || kleinLaeuft}>{submitting ? "Wird lokal gespeichert …" : "Geprüft lokal speichern"}</button></div>
  </form>{choiceField && choiceConfig && <div className="intake-choice-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setChoiceField(null)}><section className="intake-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="intake-choice-title"><header><div><span className="eyebrow dark">Auswahl ändern</span><h3 id="intake-choice-title">{choiceConfig.label}</h3><p>Der intelligente Vorschlag ist markiert. Deine Auswahl wird beim lokalen Speichern übernommen.</p></div><button type="button" className="icon-button" onClick={() => setChoiceField(null)} aria-label="Auswahlfenster schließen"><X/></button></header><div className="intake-choice-options">{choiceConfig.options.map((option) => <button type="button" className={option === choiceConfig.value ? "selected" : ""} key={option} onClick={() => applyChoice(choiceField, option)}><span>{option}</span>{option === choiceConfig.value && <CheckCircle2 size={17}/>}</button>)}</div>{choiceConfig.custom && <div className="intake-custom-choice"><label><span>Eigene Bezeichnung hinzufügen</span><div className="dictation-field"><input value={customChoice} onChange={(event) => setCustomChoice(event.target.value)} placeholder={`Eigene ${choiceConfig.label.toLocaleLowerCase("de")} eingeben`}/><DictationButton value={customChoice} onChange={setCustomChoice} label={`Eigene ${choiceConfig.label}`}/></div></label><button type="button" className="button primary" disabled={!customChoice.trim()} onClick={() => applyChoice(choiceField, customChoice)}>Übernehmen</button></div>}<footer><button type="button" className="button secondary" onClick={() => setChoiceField(null)}>Ohne Änderung schließen</button></footer></section></div>}</div></div>;
}
