import { askConfirm, askPrompt } from "./page-dialogs";
import { useEingang } from "./use-eingang";
import { ProTresorAnschluss } from "./pro-tresor-anschluss";
import { ProDokumentKnopf } from "./pro-dokument-knopf";
import { istProOriginal, proTresor, proTresorVerfuegbar } from "./pro-tresor";
import { copyLocalDocumentToPro } from "./local-vault";
import { eingangDatei } from "./eingang-ablage";
import { openFile } from "./file-viewer";
import { lazy, Suspense } from "react";
import { PracticalAcceptance, StoredUserAcceptance } from "./practical-acceptance";
// E1: große Teilansichten werden erst beim Öffnen geladen (eigene Dateien im Build).
import { UI_HELP } from "../lib/ui-help";

import {
  Archive, BookOpen, BriefcaseMedical, Building2, Car, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardCheck, Download, FileClock,
  FileText, Folder, FolderHeart, HeartPulse, Home, Landmark, Menu, PackageCheck,
  Network, Plus, Printer, RefreshCw, Search, ShieldCheck, ShoppingBag, Upload, UserRound,
  Users, X, HardDrive, LockKeyhole, Usb, LogOut, HelpCircle, History, Cloud, LifeBuoy, Mic,
  Copy, ExternalLink, BookHeart, Camera, Video, NotebookPen, Trash2, CircleHelp, Tags, FolderSearch, Eye, ListChecks, Save, Bot, Sparkles,
  PenLine,
} from "lucide-react";
import { DictationButton, InfoPopover, VoiceInput, VoiceTextarea } from "./ui-controls";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityLines, ActivityProvider, useActivity, useActivityMessage } from "./ui-activity";
import { NetzSchalter } from "./netz-schalter";
import { KiAuftragDialog } from "./ki-auftrag-dialog";
import { inventoryScanFeedback, inventoryAssignmentFeedback, inventoryArchiveFeedback, inventoryReleaseFeedback } from "../lib/ui-activity";
import healthData from "./health-data.json";
import { assessmentGroups, categories, coreDocuments, portalAreas } from "./portal-data";
import { appendLocalFamilyRecordNote, archiveInventoryItems, buildAutomatedTestFailureReport, changeLocalContextLink, chooseDevelopmentBaseFolder, chooseExportDestination, chooseInboxFolder, chooseInventoryArchiveFolder, chooseInventorySourceFolder, chooseOneDriveVault, chooseVault, compareVaults, confirmInventoryAssignment, confirmLocalContextLink, copyMissingDocuments, createLocalFamilyRecord, createLocalMemoryBundle, createLocalScheduleBundle, createOrUpdateLocalMemoryDraft, deleteLocalMemoryDraft, deleteLocalMemoryRecord, forgetOneDriveVault, forgetVault, getLocalMemoryDeleteImpact, getVaultSummary, inspectTestWorkspace, inventorySourcePermission, type AutomatedStorageDiagnosticReport, type AutomatedTestFailureReport, type AutomatedTestEnvironmentReport, type IncomingFolderFile, type InventoryArchiveResult, type InventoryReferenceChoice, type InventoryScanProgress, type InventoryScanResult, linkLocalDocuments, LocalDocument, LocalScheduleStatus, prepareTestRegisterPreview, type PreparedTestRegister, readInventorySourcePreview, readLocalDocumentFile, readLocalMemoryDraftFiles, readLocalMemoryMediaFile, readLocalSystemSnapshot, readLocalVaultData, rejectLocalContextLink, releaseInventoryItemsForAssistant, rememberedDevelopmentBaseFolder, rememberedInboxFolder, rememberedInventoryArchiveFolder, rememberedInventorySourceFolder, rememberedOneDriveVault, rememberedVault, removeLocalContextLink, requestVaultPermission, resetAutomatedTestEnvironment, resetInventoryItemsForRetest, restoreFullFamilyBackup, runAutomatedStorageDiagnostic, runAutomatedTestEnvironmentSelfTests, runInventoryTextDecodingSelfTests, runPreparedTestRegisterSelfTests, runTestWorkspaceSelfTests, saveLocalDocument, savePreparedTestRegister, scanInventoryFolder, scanLocalInbox, scanOneDriveInbox, setupAutomatedTestEnvironment, type TestWorkspaceReport, updateLocalMemoryDraftStatus, updateLocalMemoryOpenPointStatus, updateLocalMemoryRecord, updateLocalScheduleStatus, updateLocalStatus, setLocalDocumentAusfuellen, updateLocalPersonContact, readAusfuellAblage, writeAusfuellAblage, VaultSummary, VaultSyncPreview, VaultSyncResult, vaultSupported, writeFamilyArchiveExport, writeFullFamilyBackup } from "./local-vault";
import { createFamilyRecord, FamilyRecordUnion, FamilyRelation, formatFamilyRecordId, recordTypeDefinitions } from "@/lib/family-data-model";
import { assignmentProposalHasNoAutomaticWrites, assignmentSequence, FAMILY_ASSIGNMENT_VERSION, proposeFamilyAssignment } from "@/lib/family-assignment";
import { allFamilyExportScopes, buildFamilyArchiveExport, familyExportScopeLabels, FamilyExportScope, runFamilyExportSelfTest } from "@/lib/family-export";
import { buildScheduleItems, runFamilyReminderSelfTest, scheduleStatusLabels } from "@/lib/family-reminders";
import { buildFamilyNewsItems, FamilyNewsItem, FamilyNewsPeriod, filterFamilyNews, runFamilyNewsSelfTest } from "@/lib/family-news";
import { ausfuellMarke, offeneAusfuellungen, type AusfuellInfo } from "@/lib/ausfuellen";
import type { AusfuellPerson } from "./ausfuellen-dialog";
import { PersonKontaktKasten } from "./person-kontakt";
import type { PersonKontakt } from "@/lib/person-kontakt";
import { buildCockpitDossier, buildFamilyCockpit, cockpitRecordLabel, FamilyCockpitDocument, runFamilyCockpitSelfTests, type CockpitPriorityItem, type CockpitReference, type CockpitTodoItem } from "@/lib/family-cockpit";
import { interpretFamilySearchQuery, runFamilySearchSelfTests, scoreFamilySearchText, type FamilySearchInterpretation } from "@/lib/family-search";
import { buildDocumentLibraryItems, filterDocumentLibraryItems, runDocumentLibrarySelfTests, type DocumentLibraryItem, type DocumentLibrarySort, type DocumentLibraryReference } from "@/lib/document-library";
import { dossierTypeOrder, menuPageActions, runMenuOptimizationSelfTests, targetForRelation, type MenuAction } from "@/lib/menu-optimization";
import { buildDocumentIntakePlan, extractDocumentIntakeTextHint, FAWOGA_LIFE_AREAS, type DocumentIntakePlan, type DocumentIntakeSource, runDocumentIntakeSelfTests } from "@/lib/document-intake";
import { buildIntakeChoiceOptions, buildStoredPersonalLifeAreas, INTAKE_PRIVACY_CLASSES, type IntakePrivacyClass } from "@/lib/document-intake-metadata";
import { analyzeCentralIntakeFile, extractEmlAttachments, groupCentralIntakeAnalyses, initialCentralIntakeStatus, runCentralIntakeSelfTests, type CentralIntakeQueueItem, type CentralIntakeStatus } from "@/lib/central-intake";
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
import { buildMemoryAnalysis, buildMemoryOpenPoints, buildTodayMemorySummary, isMemoryRecord, memoryData, runFamilyMemorySelfTests, runMemoryQueueSelfTests, sortMemoryDraftQueue, type MemoryAnalysis, type MemoryCaptureType, type MemoryDraftEntry, type MemoryDraftStatus, type MemoryOpenStatus, type MemoryStatementKind } from "@/lib/family-memory";
import { buildCaseOpenSummary, buildCaseTimeline, buildContextLinkSuggestions, buildRelatedContext, runContextLinkingSelfTests, suggestIncomingDocumentContext, suggestIncomingMemoryContext, type ContextDocument, type ContextLinkDecision, type ContextLinkSuggestion, type ContextSourceType } from "@/lib/family-context-linking";
import { StoredSystemCheck, SystemCheckArea, SystemCheckLevel, SystemCheckProblem, SystemCheckReport, systemCheckLevelLabel, systemCheckOverall, systemCheckOverallLabel } from "@/lib/system-check";
import { isSensitiveHealthText, protectedFamilyLabel } from "@/lib/family-privacy";
import { runCoreConsolidationSelfTests } from "@/lib/family-consolidation";
import { FAWOGA_INVENTORY_VERSION, inventoryPhotoSeries, inventoryPreviewMode, runFawogaInventorySelfTests, runFawogaLearningSelfTests, runFawogaOneDriveSelfTests, runInventoryPreviewSelfTests, summarizeInventory, type InventoryAssignmentReference, type InventoryItem, type InventoryReviewGroup } from "@/lib/fawoga-inventory";
import systemCheckManifest from "@/lib/system-check-manifest.json";
import releaseSystemCheckReport from "@/lib/release-system-check-report.json";
const AssistantCenter = lazy(() => import("./assistant-center").then((m) => ({ default: m.AssistantCenter })));
import { runFamilyAssistantSelfTests, type CorrespondenceKind } from "@/lib/family-assistant";
import { createLocalCorrespondenceBundle } from "./local-vault";
import { isBrowserVault, browserStorageKind } from "./local-vault";
import { removeSampleFamily, SAMPLE_FAMILY_NAME, SAMPLE_NOTICE, sampleDataPresent, seedSampleFamily } from "./sample-family";

// Welche Fassung läuft (Klaus 2026-10-31: „damit ich nicht nur am Icon erkenne, was es für eine Version ist“):
// in der Android- und der Windows-App „Pro“, im Browser (PWA) „Basic“ — wie BookLedgerPro / BookLedger Basic.
const APP_VARIANTE: "Pro" | "Basic" = typeof window !== "undefined" && ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() || "__TAURI__" in window) ? "Pro" : "Basic";

type UploadedDocument = {
  id: string; originalName: string; category: string; documentDate: string | null;
  mimeType: string; sizeBytes: number;
  status: "hochgeladen" | "abgleich_offen" | "geprüft" | "eingearbeitet";
  notes: string | null; uploadedAt: string; downloadUrl: string;
};
type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type SearchResult = { id: string; section: SectionId; targetId?: string; contextCaseId?: string; title: string; detail: string; kind: string; reason: string; score: number };
type ActionKey = "vault" | "upload" | "compare" | "update" | "chatgpt";
type ActionState = "pending" | "success" | "failed";
type DocumentLibraryRequest = { key: number; focusId: string | null; area: string; query: string };
type OpenDocumentLibrary = (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void;
type IntakeReceipt = { id: string; title: string; category: string; source: string };
type MemoryReceipt = { id: string; title: string; mediaCount: number };
type MemoryDraft = { draftId?: string; text: string; files: File[]; captureType: MemoryCaptureType; originalTranscript?: string; suggestedCaseId?: string };
type MemoryCompletion = { id: string; title: string; remaining: number; total: number };
type MemorySaveInput = Parameters<typeof createLocalMemoryBundle>[1] & { rejectedContext?: ContextLinkSuggestion };
type UiAutomatedTestFailureReport = Omit<AutomatedTestFailureReport, "websiteVersion"> & { websiteVersion: number };

type SectionId = "overview" | "netz" | "workflowpdf" | "stapel" | "documents" | "inventory" | "inbox" | "medical" | "benefits" | "work" |
  "assessment" | "correspondence" | "assistant" | "sources" | "health" | "family" |
  "home" | "vehicles" | "purchases" | "reminders" | "memory" | "cockpit" | "directory" | "security" | "help" | "changelog" | "versions" | "systemcheck";

const APP_VERSION = "2.28.1";
const APP_VERSION_DATE = "15.10.2026";
const HELP_CONTENT_VERSION = "2.28.1";
const SYSTEM_CHECK_STORAGE_KEY = "mmi-family-system-check";
const SYSTEM_CHECK_REPORTS_KEY = "mmi-family-system-check-reports";
const SYSTEM_CHECK_BACKUPS_KEY = "mmi-family-system-check-backups";
// Wird von der Systemprüfung (scripts/run-system-check.mjs) als Projektkennung erwartet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SITE_PROJECT_LINK = "sites-project://appgprj_demo";

const topNavigation: Array<{
  id: string; label: string; landing: SectionId;
  groups: Array<{ title: string; items: Array<{ id: SectionId; label: string; detail: string }> }>;
}> = [
  { id: "assistant", label: "Assistenz", landing: "assistant", groups: [
    { title: "Unterstützung", items: [
      { id: "assistant", label: "Assistenzzentrale", detail: "Fragen klären, Vorgänge prüfen und nächste Schritte vorbereiten" },
      { id: "correspondence", label: "Korrespondenz", detail: "Entwürfe, versendete Schreiben und Antworten im Zusammenhang" },
      { id: "cockpit", label: "Vorgänge weiterbearbeiten", detail: "Vorhandene Vorgänge, Belege, Aufgaben und Fristen öffnen" },
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
      { id: "cockpit", label: "Interaktives Cockpit", detail: "To-dos, offene Vorgänge, Fristen und neue Unterlagen" },
      { id: "family", label: "Familienübersicht", detail: "Personen, gemeinsame Vorgänge und wichtige Unterlagen" },
      { id: "reminders", label: "Fristen und Aufgaben", detail: "Offene, bald fällige und überfällige Punkte" },
      { id: "memory", label: "Tagebuch & Erinnerungen", detail: "Ereignisse, Beobachtungen und offene Punkte festhalten" },
      { id: "directory", label: "Gesamtes Verzeichnis", detail: "Alle Bereiche und Unterbereiche auf einen Blick" },
    ] },
    { title: "Später ergänzbar", items: [
      { id: "family", label: "Vollmachten & Vorsorge", detail: "Vorbereitet – noch ohne zugeordnete Unterlagen" },
      { id: "family", label: "Versicherungen & Verträge", detail: "Vorbereitet – noch ohne zugeordnete Unterlagen" },
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
      { id: "security", label: "Sicherheit & lokaler Tresor", detail: "PC/USB-Speicher, Sicherung und Zwei-Faktor-Schutz" },
      { id: "netz", label: "Netz (Mycel)", detail: "Mit anderen Geräten verbinden – nur wenn du es antippst" },
      { id: "sources", label: "Unterlagen & Quellen", detail: "Kerndokumente und Beweiswert" },
      { id: "directory", label: "Alle Bereiche", detail: "Vollständige Navigationsstruktur" },
    ] },
  ] },
  { id: "help", label: "Hilfe", landing: "help", groups: [
    { title: "Hilfe und Änderungen", items: [
      { id: "help", label: "Hilfe & erste Schritte", detail: "Einfache Erklärungen und praktische Beispiele" },
      { id: "systemcheck", label: "Systemprüfung", detail: "Lesende System- und Qualitätsprüfung starten" },
      { id: "changelog", label: "Was gibt’s Neues?", detail: "Neue Dokumente, Vorgänge und wichtige Veränderungen" },
      { id: "versions", label: "Versionshistorie", detail: "Vollständiger technischer Entwicklungsverlauf" },
      { id: "security", label: "Datentresor-Hilfe", detail: "Lokale Speicherung und Sicherheit verstehen" },
    ] },
  ] },
];

const sectionLabels: Record<SectionId, string> = {
  overview: "Startseite", health: "Gesundheit & Arbeit", medical: "Diagnosen, AU & ICD-Codes",
  benefits: "Krankenkasse & Leistungen", work: "Arbeit & Arbeitgeber", assessment: "Anträge & Bescheide",
  correspondence: "Anfragen & Antworten", assistant: "Assistenz", family: "Familie & Personen", home: "Wohnen",
  vehicles: "Fahrzeuge", purchases: "Käufe & Garantien", documents: "Dokumentenbibliothek", inventory: "Bestand prüfen", inbox: "Eingangszentrale",
  reminders: "Fristen und Aufgaben", cockpit: "Interaktives Cockpit",
  memory: "Tagebuch & Erinnerungsprotokoll",
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
const fmtDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00Z`))
  : "ohne Dokumentdatum";
const fmtBytes = (value: number) => value < 1024 * 1024
  ? `${Math.max(1, Math.round(value / 1024))} KB`
  : `${(value / 1024 / 1024).toFixed(1)} MB`;
type FillState = { stand: string; marke: string | null; fuellbar: boolean };
const fillStateOf = (item: LocalDocument): FillState => ({ stand: item.ausfuellen?.stand || "", marke: ausfuellMarke(item), fuellbar: (/^application\/pdf$|^image\/(jpeg|png|webp)$/.test(item.mimeType) || /\.(pdf|jpe?g|png|webp)$/i.test(item.originalName)) });
const visibleDocumentTitle = (item: { originalName: string; category?: string | null; notes?: string | null }) => protectedFamilyLabel({ label: item.originalName, category: item.category, notes: item.notes });

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
    const stored = JSON.parse(localStorage.getItem(SYSTEM_CHECK_REPORTS_KEY) || "[]") as StoredSystemCheck[];
    const builtIn = normalizeSystemReport(releaseSystemCheckReport as StoredSystemCheck);
    const reports = stored.map((item) => normalizeSystemReport(item)).filter((item): item is SystemCheckReport => !!item);
    if (builtIn && !reports.some((item) => item.id === builtIn.id)) reports.push(builtIn);
    if (reports.length) return reports.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
    const legacy = normalizeSystemReport(JSON.parse(localStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null);
    return legacy ? [legacy] : [];
  } catch { return []; }
}

function saveSystemCheckReport(report: SystemCheckReport, makeCurrent = report.kind === "check") {
  const existing = readSystemCheckReports();
  const reports = [report, ...existing.filter((item) => item.id !== report.id)]
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  localStorage.setItem(SYSTEM_CHECK_REPORTS_KEY, JSON.stringify(reports));
  if (makeCurrent) localStorage.setItem(SYSTEM_CHECK_STORAGE_KEY, JSON.stringify(report satisfies StoredSystemCheck));
  return reports;
}

function createSystemCheckBackup(source: SystemCheckReport) {
  const backups = (() => {
    try { return JSON.parse(localStorage.getItem(SYSTEM_CHECK_BACKUPS_KEY) || "[]") as SystemCheckBackup[]; }
    catch { return []; }
  })();
  const backup: SystemCheckBackup = {
    id: `backup-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceReportId: source.id,
    version: APP_VERSION,
    previousCurrent: (() => {
      try { return JSON.parse(localStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null; }
      catch { return null; }
    })(),
    previousReportCount: readSystemCheckReports().length,
  };
  localStorage.setItem(SYSTEM_CHECK_BACKUPS_KEY, JSON.stringify([backup, ...backups].slice(0, 20)));
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
    ...localDocuments.map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, status: item.status, createdAt: item.addedAt, updatedAt: item.updatedAt, mimeType: item.mimeType, notes: item.notes, storageType: item.storageType, storedPath: item.storedPath, relativePath: item.relativePath, oneDrivePath: item.oneDrivePath })),
    ...documents.map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, status: item.status, createdAt: item.uploadedAt, updatedAt: null, mimeType: item.mimeType, previewUrl: item.mimeType.startsWith("image/") ? item.downloadUrl : null, notes: item.notes, storageType: "online-r2", downloadUrl: item.downloadUrl })),
  ];
}

function contextDocuments(documents: UploadedDocument[], localDocuments: LocalDocument[]): ContextDocument[] {
  return cockpitDocuments(documents, localDocuments).map((item) => ({ id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, createdAt: item.createdAt, updatedAt: item.updatedAt, notes: item.notes }));
}

function linkedCaseId(sourceId: string, relations: FamilyRelation[]) {
  const link = relations.find((relation) => (relation.fromId === sourceId && relation.toType === "case") || (relation.toId === sourceId && relation.fromType === "case"));
  return link ? (link.fromType === "case" ? link.fromId : link.toId) : undefined;
}

function buildSearchResults(query: string, documents: UploadedDocument[], localDocuments: LocalDocument[], records: FamilyRecordUnion[] = [], relations: FamilyRelation[] = []): SearchResult[] {
  const interpretation = interpretFamilySearchQuery(query); if (!interpretation.terms.length && !interpretation.intents.length) return [];
  const candidates: SearchResult[] = [];
  const add = (result: Omit<SearchResult, "score">, searchable: string) => { const score = scoreFamilySearchText(searchable, interpretation); if (score) candidates.push({ ...result, score }); };
  interpretation.intents.forEach((intent, index) => candidates.push({
    id: `intent-${intent.id}`, section: intent.section as SectionId, title: intent.label, detail: intent.detail,
    kind: intent.kind, reason: intent.reason, score: 100 - index,
  }));
  topNavigation.forEach((area) => area.groups.forEach((group) => group.items.forEach((item) => add(
    { id: `nav-${area.id}-${item.label}`, section: item.id, title: item.label, detail: `${area.label} · ${item.detail}`, kind: "Bereich", reason: "Passender Bereich oder Hilfetext" },
    [area.label, group.title, item.label, item.detail].join(" "),
  ))));
  healthData.currentDiagnoses.forEach((item) => add(
    { id: `diag-${item.area}-${item.codes}`, section: "medical", title: "Geschützte Diagnose", detail: "Einzelheiten im geschützten Gesundheitsbereich", kind: "Diagnose", reason: "Passende Diagnose, ICD-Code oder ärztlicher Beleg" },
    [item.area, item.codes, item.diagnosis, item.evidence, item.status].join(" "),
  ));
  healthData.doctors.forEach((item) => add(
    { id: `doctor-${item.name}`, section: "medical", title: "Behandelnde Praxis", detail: "Einzelheiten im geschützten Gesundheitsbereich", kind: "Arzt/Praxis", reason: "Passende behandelnde Stelle" },
    [item.name, item.field, item.confirmed, item.open].join(" "),
  ));
  healthData.correspondence.forEach((item) => add(
    { id: `letter-${item.date}-${item.subject}`, section: "correspondence", title: item.subject, detail: `${item.date} · ${item.answer}`, kind: "Schriftverkehr", reason: "Passendes Schreiben oder beantwortetes Anliegen" },
    [item.date, item.type, item.subject, item.request, item.answer, item.status].join(" "),
  ));
  healthData.sickPay.forEach((item) => add(
    { id: `pay-${item.period}`, section: "benefits", title: `Leistung ${item.period}`, detail: `${item.group} · ${item.clarification}`, kind: "Leistung", reason: "Passender Leistung- oder Leistungszeitraum" },
    [item.period, item.group, item.amount, item.clarification, "Krankenkasse Leistung Zahlung"].join(" "),
  ));
  healthData.workHistory.forEach((item) => add(
    { id: `work-${item.period}-${item.entry}`, section: "work", title: `${item.period} · ${item.entry}`, detail: item.assessment, kind: "Arbeit", reason: "Passender Arbeitszeit- oder Belastungseintrag" },
    [item.period, item.entry, item.assessment, "Arbeitgeber Arbeit Arbeitszeit"].join(" "),
  ));
  [...localDocuments, ...documents].forEach((item) => add(
    { id: `doc-${item.id}`, section: isSensitiveHealthText(item.originalName, item.category, item.notes) ? "health" : "documents", targetId: item.id, contextCaseId: linkedCaseId(item.id, relations), title: protectedFamilyLabel({ label: item.originalName, category: item.category, notes: item.notes }), detail: isSensitiveHealthText(item.originalName, item.category, item.notes) ? "Einzelheiten im geschützten Gesundheitsbereich" : `${item.category} · ${fmtDate(item.documentDate)}`, kind: "Dokument", reason: "Dateiname, Kategorie, Datum oder Beschreibung passen" },
    [item.originalName, item.category, item.documentDate || "", item.notes || ""].join(" "),
  ));
  records.forEach((record) => {
    const title = cockpitRecordLabel(record);
    const memory = memoryData(record);
    const sensitive = memory?.sensitive || /(gesund|arzt|medizin|diagnos|krank|krankenkasse|rente|physio|pflege|heuschnupfen|erkält|rücken|heuschnupfen)/i.test(`${title} ${record.source || ""} ${record.notes || ""}`);
    const schedule = ["deadline", "task", "reminder"].includes(record.recordType)
      ? buildScheduleItems([record], [], new Date())[0]
      : null;
    const kind = recordTypeDefinitions[record.recordType].label;
    const detail = schedule ? `${scheduleStatusLabels[schedule.displayStatus]} · ${schedule.date ? fmtDate(schedule.date.slice(0, 10)) : "ohne Datum"}` : `${record.status} · Kennung ${record.id}`;
    add(
      { id: `record-${record.id}`, section: sensitive ? "health" : memory ? "memory" : "cockpit", targetId: record.id, contextCaseId: record.recordType === "case" ? record.id : linkedCaseId(record.id, relations), title: sensitive ? "Geschützter Gesundheitseintrag" : title, detail: memory ? `${memory.lifeArea} · ${memory.eventType}` : detail, kind: memory ? "Erinnerung" : kind, reason: memory ? "Passendes Ereignis aus dem Erinnerungsprotokoll" : "Passender Datensatz aus dem gemeinsamen Familienaktenmodell" },
      [record.id, title, record.recordType, record.status, record.source || "", record.notes || "", JSON.stringify(record.data)].join(" "),
    );
  });
  const unique = [...new Map(candidates.map((item) => [`${item.section}-${item.targetId || ""}-${item.title}`, item])).values()];
  return unique.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de")).slice(0, 20);
}

export default function HealthPortal() {
  return <ActivityProvider><HealthPortalContent/></ActivityProvider>;
}

function HealthPortalContent() {
  const reportActivity = useActivity();
  const [active, setActive] = useState<SectionId>("overview");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitialFile, setUploadInitialFile] = useState<File | null>(null);
  const [uploadSource, setUploadSource] = useState<DocumentIntakeSource>("file-picker");
  const [uploadFromStart, setUploadFromStart] = useState(false);
  const [uploadQueueId, setUploadQueueId] = useState<string | null>(null);
  const [lastIntakeReceipt, setLastIntakeReceipt] = useState<IntakeReceipt | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanInitialFiles, setScanInitialFiles] = useState<File[]>([]);
  const [scanQueueIds, setScanQueueIds] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null);
  const [memoryReviewOpen, setMemoryReviewOpen] = useState(false);
  const [lastMemoryReceipt, setLastMemoryReceipt] = useState<MemoryReceipt | null>(null);
  const [memoryFocusId, setMemoryFocusId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitialRequest, setEditInitialRequest] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [cockpitFocusId, setCockpitFocusId] = useState<string | null>(null);
  const [fillDocId, setFillDocId] = useState<string | null>(null);
  const [wfpdfOeffnen, setWfpdfOeffnen] = useState<File[] | null>(null);
  const [wfpdfScan, setWfpdfScan] = useState(false);
  const [wfpdfStart, setWfpdfStart] = useState(0);
  const [stapelNeu, setStapelNeu] = useState<File[] | null>(null);
  const [assistantCaseId, setAssistantCaseId] = useState<string | null>(null);
  const [documentLibraryFocusId, setDocumentLibraryFocusId] = useState<string | null>(null);
  const [documentLibraryRequest, setDocumentLibraryRequest] = useState<DocumentLibraryRequest>({ key: 0, focusId: null, area: "", query: "" });
  const [, setCheckRecommended] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = JSON.parse(localStorage.getItem(SYSTEM_CHECK_STORAGE_KEY) || "null") as StoredSystemCheck | null;
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
  const [sampleBusy, setSampleBusy] = useState(false);
  const samplePresent = useMemo(() => sampleDataPresent({ documents: localDocuments, records: familyRecords }), [localDocuments, familyRecords]);
  const removeSampleData = async () => {
    if (!vaultHandle) return;
    if (!await askConfirm("Alle Beispieldaten entfernen?\n\nEntfernt werden nur die erfundenen Beispieleinträge und Beispieldokumente. Deine eigenen Unterlagen und Einträge bleiben erhalten.")) return;
    setSampleBusy(true);
    try { const result = await removeSampleFamily(vaultHandle); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: `Beispieldaten entfernt: ${result.removedEntries} Einträge und ${result.removedFiles} Beispieldokumente. Die Familienakte ist jetzt bereit für deine eigenen Unterlagen.` }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Beispieldaten konnten nicht entfernt werden." }); }
    finally { setSampleBusy(false); }
  };
  const loadSampleData = async () => {
    if (!vaultHandle) { setNotice({ kind: "info", text: "Bitte zuerst den Datentresor verbinden." }); return; }
    setSampleBusy(true);
    try { await seedSampleFamily(vaultHandle, { force: true }); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Die erfundene Beispielfamilie wurde geladen. Eigene Einträge blieben unverändert." }); }
    catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Beispieldaten konnten nicht geladen werden." }); }
    finally { setSampleBusy(false); }
  };
  const oneDriveReachable = !!oneDriveHandle && !!oneDriveSummary;
  const localVaultReachable = !!localVaultHandle && !!localVaultSummary;
  const vaultReachable = oneDriveReachable || localVaultReachable;
  const vaultRemembered = !!oneDriveHandle || !!localVaultHandle;
  const setActionState = (action: ActionKey, state: ActionState) => {
    setActionStates((current) => ({ ...current, [action]: state }));
  };

  const applyLocalData = (data: Awaited<ReturnType<typeof readLocalVaultData>>) => {
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
          const data = await readLocalVaultData(oneDrive); applyLocalData(data); setOneDriveSummary(await getVaultSummary(oneDrive));
        }
      }
      if (local) {
        setLocalVaultHandle(local); setLocalVaultName(local.name);
        if (isBrowserVault(local)) {
          // A2: Der Browser konnte beim ersten Start nicht in den Dateispeicher schreiben und nutzt IndexedDB; das wird einmal gesagt.
          try { if (browserStorageKind() === "indexeddb" && !localStorage.getItem("mmi-browser-speicher-hinweis")) { localStorage.setItem("mmi-browser-speicher-hinweis", "1"); setNotice({ kind: "info", text: "Der Browser-Datentresor liegt in diesem Browser in IndexedDB, weil der Dateispeicher (OPFS) nicht beschreibbar war. Diese Wahl bleibt gespeichert; es wird nicht automatisch gewechselt." }); } } catch { /* optional */ }
        }
        if (isBrowserVault(local)) { setSampleBusy(true); await seedSampleFamily(local).catch((error) => { console.error("Beispieldaten konnten nicht geladen werden", error); return false; }); setSampleBusy(false); }
        if (await requestVaultPermission(local)) {
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
  const lockOneDrive = async () => { await forgetOneDriveVault(); setOneDriveHandle(null); setOneDriveName(""); setOneDriveSummary(null); setSyncPreview(null); setSyncResult(null); if (localVaultHandle && await requestVaultPermission(localVaultHandle)) { const data = await readLocalVaultData(localVaultHandle); applyLocalData(data); setActionState("vault", "success"); } else { setLocalDocuments([]); setFamilyRecords([]); setFamilyRelations([]); setMemoryDrafts([]); setLinkDecisions([]); setInventoryItems([]); setVaultAuditLog([]); setActionState("vault", "pending"); } setNotice({ kind: "info", text: "Die OneDrive-Ordnerfreigabe wurde in diesem Browser gesperrt. Dateien wurden nicht gelöscht." }); };
  const lockLocalVault = async () => { await forgetVault(); setLocalVaultHandle(null); setLocalVaultName(""); setLocalVaultSummary(null); setSyncPreview(null); setSyncResult(null); if (!oneDriveHandle) { setLocalDocuments([]); setFamilyRecords([]); setFamilyRelations([]); setMemoryDrafts([]); setLinkDecisions([]); setInventoryItems([]); setVaultAuditLog([]); setActionState("vault", "pending"); } else setActionState("vault", "success"); setNotice({ kind: "info", text: "Der PC-/USB-Tresor wurde in diesem Browser gesperrt. Dateien wurden nicht gelöscht." }); };
  const beginLocalUpload = (file: File | null, source: DocumentIntakeSource, fromStart: boolean, suggestedCaseId: string | null = null, queueId: string | null = null) => {
    if (!vaultHandle) { setActionState("upload", "failed"); go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-Ordner oder einen PC-/USB-Tresor verbinden." }); return; }
    setUploadInitialFile(file); setUploadSource(source); setUploadFromStart(fromStart); setUploadSuggestedCaseId(suggestedCaseId); setUploadQueueId(queueId); setActionState("upload", "pending"); setUploadOpen(true);
    reportActivity({ kind: "info", text: file ? "1 Unterlage zur Zuordnungsprüfung geöffnet. Es wurde noch nichts gespeichert." : "Dokumenteneingang geöffnet. Bitte eine Datei auswählen; es wurde noch nichts gespeichert." });
  };
  const openLocalUpload = () => beginLocalUpload(null, "file-picker", false);
  const openStartIntake = (file: File | null = null, source: DocumentIntakeSource = file ? "drag-drop" : "file-picker") => beginLocalUpload(file, source, true);
  const analyzeQueuedIntake = async (placeholders: CentralIntakeQueueItem[]) => {
    setIntakeBusy(true);
    try {
      const analyzed = groupCentralIntakeAnalyses(await Promise.all(placeholders.map(async (item) => analyzeCentralIntakeFile({ file: await eingangDatei(item), source: item.source, documents: [...localDocuments, ...documents], records: familyRecords }))));
      const checksumCounts = new Map<string, number>();
      analyzed.forEach((item) => checksumCounts.set(item.checksum, (checksumCounts.get(item.checksum) || 0) + 1));
      const saved = await setCentralIntakeQueue((current) => current.map((item) => {
        const position = placeholders.findIndex((candidate) => candidate.id === item.id);
        if (position < 0 || item.status !== "Analyse läuft") return item;
        const analysis = analyzed[position];
        const batchDuplicate = (checksumCounts.get(analysis.checksum) || 0) > 1;
        return { ...item, analysis, status: batchDuplicate ? "Prüfung erforderlich" : initialCentralIntakeStatus(analysis), error: batchDuplicate ? "Mögliche Dublette innerhalb dieser Auswahl – bitte vergleichen." : null };
      }));
      if (!saved) return;
      const reviewCount = analyzed.filter((analysis) => analysis.plan.requiresReview || analysis.plan.duplicateIds.length || (checksumCounts.get(analysis.checksum) || 0) > 1).length;
      setNotice({ kind: reviewCount ? "info" : "success", text: `${placeholders.length} Eingang${placeholders.length === 1 ? " wurde" : "sfälle wurden"} erkannt und in „Eingänge prüfen“ vorbereitet.${reviewCount ? ` ${reviewCount} erfordern eine Prüfung, beispielsweise wegen unklarer Zuordnung oder möglicher Dubletten.` : ""} Es wurde noch nichts übernommen.` });
    } catch (error) {
      await setCentralIntakeQueue((current) => current.map((item) => item.status === "Analyse läuft" && placeholders.some((candidate) => candidate.id === item.id) ? { ...item, status: "Prüfung erforderlich", error: error instanceof Error ? error.message : "Die Datei konnte nicht automatisch analysiert werden." } : item));
      setNotice({ kind: "error", text: "Mindestens ein Eingang konnte nicht vollständig analysiert werden. Die Originaldateien blieben unverändert." });
    } finally { setIntakeBusy(false); }
  };
  const queueCentralIntakeFiles = async (files: File[], source: DocumentIntakeSource, parentQueueId: string | null = null, stapelIds: string[] = []) => {
    if (!files.length) return false;
    const placeholders: CentralIntakeQueueItem[] = files.map((file) => ({ id: crypto.randomUUID(), file, source, status: "Analyse läuft", selected: false, addedAt: new Date().toISOString(), analysis: null, error: null, parentQueueId }));
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
      const detail = (event as CustomEvent<{ files?: File[]; bestaetigen?: (ok: boolean) => void }>).detail;
      const files = detail?.files || [];
      if (!files.length) { detail?.bestaetigen?.(false); return; }
      go("inbox");
      void queueFromShell.current(files, "file-picker").then(
        (ok) => detail?.bestaetigen?.(ok),
        () => detail?.bestaetigen?.(false),
      );
    };
    window.addEventListener("familienakte:dateien", handler);
    window.dispatchEvent(new Event("familienakte:bereit"));
    return () => window.removeEventListener("familienakte:dateien", handler);
  }, []);
  const reviewCentralIntake = async (id: string) => {
    const item = centralIntakeQueue.find((candidate) => candidate.id === id);
    if (!item) return;
    try { beginLocalUpload(await eingangDatei(item), item.source, false, null, item.id); }
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
  const toggleCentralIntake = (id: string) => setCentralIntakeQueue((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  // Workflow PDF als Klon (Stück 2): Unterlage hinein, Ergebnis zurück in den Eingang.
  const inWorkflowPdf = async (id: string) => {
    if (!vaultHandle) { go("security"); return; }
    try { setWfpdfOeffnen([await readLocalDocumentFile(vaultHandle, id)]); setWfpdfScan(false); setWfpdfStart((n) => n + 1); go("workflowpdf"); }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Die Unterlage konnte nicht geöffnet werden." }); }
  };
  const dateiInWorkflowPdf = (datei: File) => { setWfpdfOeffnen([datei]); setWfpdfScan(false); setWfpdfStart((n) => n + 1); go("workflowpdf"); };
  const inProTresor = async (id: string) => {
    if (!vaultHandle) return;
    try {
      const stand = await proTresor.zustand();
      if (stand.status !== "offen" || !stand.id) { go("security"); setNotice({ kind: "info", text: "Bitte zuerst den gewünschten Pro-Tresor verbinden und entsperren. Danach die einzelne Unterlage erneut wählen." }); return; }
      await copyLocalDocumentToPro(vaultHandle, id, stand.id); await refreshLocal(vaultHandle);
      setNotice({ kind: "success", text: "Das ausgewählte Original liegt geprüft im Pro-Tresor. Der bisherige Bestand wurde beibehalten." });
    } catch (e) { setNotice({ kind: "error", text: e instanceof Error ? e.message : "Das Original wurde nicht übernommen; die Quelle bleibt erhalten." }); }
  };
  const ausWorkflowPdf = ({ quelle, dateien }: WfpdfAblage) => {
    if (quelle === "scan" && dateien.length === 1) { beginLocalUpload(dateien[0], "camera-scan", true); return; }
    void queueCentralIntakeFiles(dateien, "file-picker");
    setNotice({ kind: "success", text: `${dateien.length} Datei${dateien.length === 1 ? "" : "en"} aus Workflow PDF liegen in der Eingangszentrale zur Prüfung.` });
  };
  const openDocumentScan = (files: File[]) => {
    if (!vaultHandle) { setActionState("upload", "failed"); go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-Ordner oder einen PC-/USB-Tresor verbinden. Erst danach wird die Kamera geöffnet." }); return; }
    // Klaus 2026-10-31: „überall der volle Scanner“ — ohne mitgebrachte Fotos öffnet „Dokument fotografieren“ den Scanner von
    // Workflow PDF (Ecken ziehen, gerade richten, Filter, Texterkennung); das fertige PDF geht in den Dokumenteneingang.
    // Seit 2.28.10 (Klaus 2026-11-01: „‚Dokument fotografieren‘ öffnet den Klon“): die ganze App Workflow PDF mit dem Scanner;
    // „PDF erstellen“ legt den Scan im Klon ab UND gibt ihn gleich an die Prüfung der Akte (Brücke, quelle „scan“).
    if (!files.length && !wfpdfAlt()) { setWfpdfOeffnen(null); setWfpdfScan(true); setWfpdfStart((n) => n + 1); setActionState("upload", "pending"); go("workflowpdf"); return; }
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
  const scanSelectedInbox = async (handle = inboxFolderHandle) => {
    if (!handle) return;
    setIntakeBusy(true);
    try {
      const found = await scanLocalInbox(handle, localDocuments); setIncomingFiles(found); setIntakeCheckedAt(new Date().toISOString());
      const fresh = found.filter((candidate) => !centralIntakeQueue.some((queued) => queued.file.name === candidate.name && queued.file.size === candidate.size && queued.file.lastModified === candidate.lastModified));
      if (fresh.length) await queueCentralIntakeFiles(fresh.map((item) => item.file), "local-inbox");
      setNotice({ kind: "info", text: found.length ? `${found.length} neue oder geänderte Datei${found.length === 1 ? " wurde" : "en wurden"} im freigegebenen Eingangsordner gefunden.` : "Im freigegebenen Eingangsordner wurden keine neuen Dateien gefunden." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Eingangsordner konnte nicht geprüft werden." }); }
    finally { setIntakeBusy(false); }
  };
  const selectInboxFolder = async () => {
    setIntakeBusy(true);
    try { const handle = await chooseInboxFolder(); setInboxFolderHandle(handle); setInboxFolderName(handle.name); const found = await scanLocalInbox(handle, localDocuments); setIncomingFiles(found); setIntakeCheckedAt(new Date().toISOString()); const fresh = found.filter((candidate) => !centralIntakeQueue.some((queued) => queued.file.name === candidate.name && queued.file.size === candidate.size && queued.file.lastModified === candidate.lastModified)); if (fresh.length) await queueCentralIntakeFiles(fresh.map((item) => item.file), "local-inbox"); setNotice({ kind: "success", text: `Nur der Ordner „${handle.name}“ wurde freigegeben und geprüft. ${fresh.length} neue Datei${fresh.length === 1 ? " wurde" : "en wurden"} in der Eingangszentrale vorbereitet.` }); }
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
  const runFullBackup = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den führenden lokalen Familienakten-Tresor verbinden." }); return; }
    setVaultBusy(true);
    try {
      const destination = await chooseExportDestination();
      const result = await writeFullFamilyBackup({ destination, source: vaultHandle, appVersion: APP_VERSION });
      setNotice({ kind: "success", text: `Die vollständige Familienakten-Sicherung „${result.folderName}“ wurde mit Register, Verknüpfungen, Memories, Medien und Prüfsummen erstellt. Für die endgültige Bestätigung folgt die Wiederherstellung in einem leeren Testordner.` });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") setNotice({ kind: "error", text: error instanceof Error ? error.message : "Die vollständige Sicherung konnte nicht erstellt werden." }); }
    finally { setVaultBusy(false); }
  };
  const runRestoreTest = async () => {
    setVaultBusy(true);
    try {
      const backup = await chooseExportDestination();
      const emptyTarget = await chooseExportDestination();
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
  const startVaultInventoryComparison = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst einen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    setInventorySourceHandle(vaultHandle);
    setInventoryProgress(null); setInventoryLastRun(null); setInventoryArchiveResult(null);
    go("inventory");
    setNotice({ kind: "info", text: `Der verbundene Ordner „${vaultHandle.name}“ wird jetzt einschließlich aller Unterordner mit der vorhandenen FaWoGa-Bestandsanalyse geprüft.` });
    await scanInventorySource(vaultHandle);
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

  const searchResults = useMemo(() => buildSearchResults(query, documents, localDocuments, familyRecords, familyRelations), [query, documents, localDocuments, familyRecords, familyRelations]);
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
      setActive("inbox");
      setNotice({ kind: "info", text: documents.length ? "Es gibt derzeit keine neu hochgeladene Unterlage. Offene Abgleiche findest du im Dokumenteneingang." : "Bitte lade zuerst eine neue Unterlage hoch." });
      if (!documents.length) setUploadOpen(true);
      return;
    }
    setBusy(true);
    try {
      await Promise.all(pending.map((item) => changeStatus(item.id, "abgleich_offen")));
      await loadDocuments(); setActive("inbox");
      setActionState("compare", "success");
      setNotice({ kind: "success", text: `${pending.length} Unterlage${pending.length === 1 ? " wurde" : "n wurden"} für den gemeinsamen Abgleich vorgemerkt. Medizinische Inhalte sind dadurch noch nicht bewertet.` });
    } catch (error) { setActionState("compare", "failed"); setNotice({ kind: "error", text: error instanceof Error ? error.message : "Abgleich konnte nicht vorgemerkt werden." }); }
    finally { setBusy(false); }
  };
  const finalizeUpdate = async () => {
    const reviewed = documents.filter((item) => item.status === "geprüft");
    setActive("inbox");
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
    const next = { key: Date.now(), focusId: request.focusId || null, area: request.area || "", query: request.query || "" };
    setCockpitFocusId(null); setDocumentLibraryFocusId(next.focusId); setDocumentLibraryRequest(next);
    setActive("documents"); setMobileOpen(false); setMegaOpen(null); setQuery("");
    window.history.replaceState(null, "", "#documents");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const saved = await createOrUpdateLocalMemoryDraft(vaultHandle, { draftId: draft.draftId, originalText: draft.text, originalTranscript: draft.originalTranscript || (draft.captureType === "sprache" || draft.captureType === "kombination" ? draft.text : undefined), captureType: draft.captureType, mediaFiles: draft.files, suggestedCaseId: draft.suggestedCaseId || memorySuggestedCaseId || undefined });
      setMemorySuggestedCaseId(null);
      setMemoryEditDraft(null);
      await refreshLocal(vaultHandle);
      setNotice({ kind: "success", text: "Die Erinnerung wartet jetzt sicher und getrennt auf ihre Prüfung. Es wurde noch kein endgültiger Memory-Eintrag angelegt." });
      return saved;
    } catch (reason) {
      setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Memory-Entwurf konnte nicht vorgemerkt werden." });
      return null;
    }
  };
  const openMemoryDraftForReview = async (draftId: string, supplied?: MemoryDraftEntry) => {
    if (!ensureMemoryVault() || !vaultHandle) return;
    const stored = supplied || memoryDrafts.find((item) => item.id === draftId);
    if (!stored) { setNotice({ kind: "error", text: "Der ausgewählte Memory-Entwurf wurde nicht gefunden." }); return; }
    try {
      await updateLocalMemoryDraftStatus(vaultHandle, draftId, "in_bearbeitung");
      const files = await readLocalMemoryDraftFiles(vaultHandle, draftId);
      setMemoryDraft({ draftId, text: stored.originalText, originalTranscript: stored.originalTranscript, files, captureType: stored.captureType, suggestedCaseId: stored.suggestedCaseId });
      setMemoryReviewOpen(true);
      await refreshLocal(vaultHandle);
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Memory-Entwurf konnte nicht geöffnet werden." }); }
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
      setMemoryEditDraft({ draftId, text: stored.originalText, originalTranscript: stored.originalTranscript, files, captureType: stored.captureType, suggestedCaseId: stored.suggestedCaseId });
      go("overview");
      window.setTimeout(() => document.getElementById("memory-capture-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Entwurf konnte nicht zum Ergänzen geöffnet werden." }); }
  };
  const removeMemoryDraft = async (draftId: string) => {
    if (!ensureMemoryVault() || !vaultHandle) return;
    if (!await askConfirm("Diesen noch nicht bearbeiteten Memory-Entwurf wirklich löschen?")) return;
    try { await deleteLocalMemoryDraft(vaultHandle, draftId); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Nur der ausgewählte Entwurf wurde gelöscht. Andere Entwürfe und gespeicherte Erinnerungen blieben unverändert." }); }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Entwurf konnte nicht gelöscht werden." }); }
  };
  const go = (id: SectionId, targetId?: string) => {
    setCockpitFocusId(id === "cockpit" ? targetId || null : null);
    setAssistantCaseId(id === "assistant" ? targetId || null : null);
    setMemoryFocusId(id === "memory" ? targetId || null : null);
    setDocumentLibraryFocusId(id === "documents" ? targetId || null : null);
    if (id === "documents") setDocumentLibraryRequest({ key: Date.now(), focusId: targetId || null, area: "", query: "" });
    setActive(id); setMobileOpen(false); setMegaOpen(null); setQuery("");
    window.history.replaceState(null, "", id === "overview" ? "#startseite" : `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
  // Ausfüllen (Sitzung F): neue Fassung neben dem Original, Original bleibt unverändert; Stand am Dokument im Register.
  const fillPersons: AusfuellPerson[] = useMemo(() => familyRecords.filter((r) => r.recordType === "person").map((r) => { const d = (r.data || {}) as Record<string, string | undefined>; return { id: r.id, name: d.displayName || r.id, angaben: { displayName: d.displayName, birthDate: d.birthDate, birthPlace: d.birthPlace, address: d.address, street: d.street, postalCode: d.postalCode, city: d.city, email: d.email, phone: d.phone } }; }), [familyRecords]);
  const fillStates = useMemo(() => Object.fromEntries(localDocuments.map((item) => [item.id, fillStateOf(item)])), [localDocuments]);
  const fillDocument = localDocuments.find((item) => item.id === fillDocId) || null;
  // Direkter Einstieg (Klaus 2026-10-31, Frage 1 aus Sitzung F): Papierformular scannen → als Unterlage ablegen → Ausfüllen öffnet sich.
  const scanFormular = async () => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    try {
      const { scannen } = await import("./wfpdf-kern");
      await scannen({ titel: "Formular scannen", fertigText: "Weiter zum Ausfüllen", name: `Formular ${new Date().toISOString().slice(0, 10)}`, fertig: async (file) => {
        const neu = await saveLocalDocument(vaultHandle, file, { category: "Formular", documentDate: new Date().toISOString().slice(0, 10), notes: "Gescanntes Formular zum Ausfüllen · Eingang: Scanner (Workflow PDF)", allowDuplicate: true });
        await refreshLocal(vaultHandle);
        setFillDocId(neu.id);
        setNotice({ kind: "success", text: "Der Scan liegt als Unterlage in der Akte. Jetzt die Felder erkennen und ausfüllen." });
      } });
    } catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Scanner konnte nicht geöffnet werden." }); }
  };
  const saveFillResult = async (original: LocalDocument, file: File, modus: "fest" | "ausfuellbar", info: AusfuellInfo) => {
    if (!vaultHandle) throw new Error("Bitte zuerst den Datentresor verbinden.");
    const links = familyRelations.filter((relation) => relation.fromType === "document" && relation.fromId === original.id).map((relation) => ({ toType: relation.toType, toId: relation.toId, relationType: relation.relationType }));
    const neu = await saveLocalDocument(vaultHandle, file, { category: original.category, documentDate: new Date().toISOString().slice(0, 10), notes: `Ausgefüllte Fassung (${modus === "fest" ? "fest" : "ausfüllbar"}) von „${original.originalName}“. Das Original bleibt unverändert.${isSensitiveHealthText(original.originalName, original.category, original.notes) && original.notes ? ` · ${original.notes}` : ""}`, allowDuplicate: true, assignmentLinks: links });
    await setLocalDocumentAusfuellen(vaultHandle, neu.id, { stand: "ergebnis", ausId: original.id, modus, geaendertAm: new Date().toISOString() });
    const alt = original.ausfuellen && "ergebnisIds" in original.ausfuellen ? original.ausfuellen.ergebnisIds || [] : [];
    if (info.stand !== "ergebnis") await setLocalDocumentAusfuellen(vaultHandle, original.id, { ...info, ergebnisIds: [...alt, neu.id] });
    await refreshLocal(vaultHandle);
  };
  const updateCockpitTask = async (id: string, status: LocalScheduleStatus) => {
    if (!vaultHandle) { go("security"); setNotice({ kind: "error", text: "Bitte zuerst den lokalen OneDrive-, PC- oder USB-Datentresor verbinden." }); return; }
    if (!await askConfirm(`Soll der Status von ${id} wirklich auf „${status.replaceAll("_", " ")}“ gesetzt werden?`)) return;
    try { await updateLocalScheduleStatus(vaultHandle, id, status); await refreshLocal(vaultHandle); setNotice({ kind: "success", text: "Der Aufgabenstatus wurde nach deiner Bestätigung aktualisiert und protokolliert." }); }
    catch (reason) { setNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Aufgabenstatus konnte nicht geändert werden." }); }
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
    setMemorySuggestedCaseId(caseId); go("overview");
    window.setTimeout(() => document.getElementById("memory-capture-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  const addDocumentToCase = (caseId: string) => beginLocalUpload(null, "file-picker", false, caseId);
  const openLifeAreas = () => {
    go("overview");
    window.setTimeout(() => document.getElementById("lebensbereiche")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  const openFooterSystemReports = () => {
    go("systemcheck");
    window.setTimeout(() => document.getElementById("pruefberichte")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  const parentArea = topNavigation.find((area) =>
    area.landing === active || area.groups.some((group) => group.items.some((item) => item.id === active)),
  );

  return (
    <div className="app-shell" onInputCapture={() => window.dispatchEvent(new Event("family-dictation-typed"))} onClick={() => megaOpen && setMegaOpen(null)}>
      <header className="site-header" onClick={(event) => event.stopPropagation()}>
        <div className="masthead">
          <button className="mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Hauptmenü öffnen"><Menu size={22}/></button>
          <button className="site-brand" onClick={() => go("overview")}><span className="brand-symbol brand-symbol-icon" data-variante={APP_VARIANTE.toLowerCase()}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 19.2727C22 20.779 20.779 22 19.2727 22H14.7273C13.221 22 12 20.779 12 19.2727V12H19.2727C20.779 12 22 13.221 22 14.7273V19.2727Z" fill="#68C4FF"/><path d="M20 2C21.1046 2 22 2.89543 22 4V7C22 8.10457 21.1046 9 20 9H17C15.8954 9 15 8.10457 15 7V4C15 2.89543 15.8954 2 17 2H20Z" fill="#0C79D8"/><path d="M7 15C8.10457 15 9 15.8954 9 17V20C9 21.1046 8.10457 22 7 22H4C2.89543 22 2 21.1046 2 20V17C2 15.8954 2.89543 15 4 15H7Z" fill="#0C79D8"/><path d="M12 12H4.72727C3.22104 12 2 10.779 2 9.27273V4.72727C2 3.22104 3.22104 2 4.72727 2H9.27273C10.779 2 12 3.22104 12 4.72727V12Z" fill="#2E9EFF"/></svg></span><span><strong>FAMILIENAKTE <span className="site-brand-variante" data-variante={APP_VARIANTE.toLowerCase()}>{APP_VARIANTE}</span></strong><small className="site-brand-version">Version {APP_VERSION}</small></span></button>
          <div className="header-actions"><NetzSchalter/><button className="icon-button" onClick={() => window.print()} title="Aktuelle Seite drucken"><Printer size={18}/></button><button type="button" className="icon-button aktualisieren-knopf" onClick={() => (window as unknown as { FamilienakteApp?: { aktualisieren?: () => void } }).FamilienakteApp?.aktualisieren?.()} title="Auf eine neue Fassung prüfen" aria-label="Auf eine neue Fassung prüfen"><RefreshCw size={18}/></button><a className="icon-button logout-button" href="./" onClick={(event) => { event.preventDefault(); window.location.reload(); }} title="Sicher aus der Familienakte ausloggen" aria-label="Ausloggen"><LogOut size={18}/></a></div>
        </div>
        <nav className={`main-navigation ${mobileOpen ? "mobile-open" : ""}`} aria-label="Hauptnavigation">
          <button className={active === "overview" ? "active" : ""} onClick={() => go("overview")}><Home size={17}/> Startseite</button>
          {topNavigation.map((area) => <div className="nav-cluster" key={area.id}>
            <button className={parentArea?.id === area.id ? "active" : ""} aria-expanded={megaOpen === area.id} onClick={() => setMegaOpen((value) => value === area.id ? null : area.id)}>{area.label}<ChevronDown size={15}/></button>
            {megaOpen === area.id && <div className="mega-menu">
              <div className="mega-intro"><span className="eyebrow">Hauptbereich</span><h2>{area.label}</h2><button className="text-link" onClick={() => go(area.landing)}>Bereich öffnen <ChevronRight size={17}/></button></div>
              {area.groups.map((group) => <div className="mega-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <button key={`${group.title}-${item.label}`} onClick={() => go(item.id)}><strong>{item.label}</strong><small>{item.detail}</small></button>)}</div>)}
            </div>}
          </div>)}
        </nav>
      </header>
      <main className="site-main">
        <section className="search-command-bar" aria-label="Familienakte durchsuchen und diktieren">
          <div className="search-command-label"><Search size={20}/><span><strong>In der Familienakte suchen</strong><small>Schreiben, Personen, Termine, Diagnosen oder Unterlagen</small></span></div>
          <label className="global-search"><Search size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zum Beispiel: Zeige mir meine Krankenkasse-Schreiben …" aria-label="Gesamte Akte in natürlichen Worten durchsuchen"/><DictationButton value={query} onChange={setQuery} label="Suche" append={false}/>{query && <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Suche löschen"><X size={16}/></button>}</label>
        </section>
        <ActivityLines/>
        {sampleBusy && !samplePresent && <section className="info-notice sample-data-notice" aria-live="polite"><span>Info</span><div><strong>Beispieldaten werden vorbereitet …</strong><div>Beim ersten Start legt die App eine frei erfundene Beispielfamilie im Browser-Datentresor an. Das dauert nur wenige Sekunden.</div></div></section>}
        {samplePresent && <section className="info-notice sample-data-notice" aria-label="Hinweis zu Beispieldaten"><span>Info</span><div><strong>{SAMPLE_NOTICE}</strong><div>Die {SAMPLE_FAMILY_NAME}, alle Orte, Firmen, Fahrzeuge und Nummern sind frei erfunden. Wenn du deine eigenen Unterlagen einpflegen möchtest, entferne die Beispieldaten mit einem Klick – eigene Einträge bleiben erhalten.</div></div><button type="button" className="button secondary" disabled={sampleBusy} onClick={() => void removeSampleData()}><Trash2 size={16}/> Beispieldaten entfernen</button></section>}
        <div className="breadcrumb"><button onClick={() => go("overview")}>Startseite</button>{active !== "overview" && <><ChevronRight size={14}/>{parentArea && parentArea.label !== sectionLabels[active] && <><button onClick={() => go(parentArea.landing)}>{parentArea.label}</button><ChevronRight size={14}/></>}<span>{sectionLabels[active]}</span></>}</div>
        {query && <SearchPanel query={query} results={searchResults} interpretation={searchInterpretation} onOpen={go}/>} 
        {!query && active === "overview" && <Overview
          documents={documents} localDocuments={localDocuments} oneDriveSummary={oneDriveSummary}
          oneDriveName={oneDriveName} localVaultName={localVaultName}
          oneDriveReachable={oneDriveReachable} localVaultReachable={localVaultReachable} vaultRemembered={vaultRemembered}
          familyRecords={familyRecords} familyRelations={familyRelations}
          busy={busy} actionStates={actionStates} onCompare={startComparison} onUpdate={finalizeUpdate}
          onGo={go} onOpenLifeArea={(area) => openDocumentLibrary({ area })}
          systemReport={lastSystemReport}
          onStartIntake={openStartIntake} onSelectInbox={selectInboxFolder} onScanInbox={() => scanSelectedInbox()}
          onScanOneDrive={checkOneDriveInbox} onStartDocumentScan={openDocumentScan} storageReady={vaultReachable} inboxFolderName={inboxFolderName} incomingFiles={incomingFiles}
          intakeBusy={intakeBusy} intakeCheckedAt={intakeCheckedAt} lastIntakeReceipt={lastIntakeReceipt}
          memoryDrafts={memoryDrafts} memoryEditDraft={memoryEditDraft} openMemoryPoints={buildMemoryOpenPoints(familyRecords).length}
          memorySuggestedCaseId={memorySuggestedCaseId}
          onQueueMemory={queueMemoryDraft} onReviewMemory={reviewMemoryDraft} onOpenMemoryQueue={() => go("memory")} lastMemoryReceipt={lastMemoryReceipt}
        />}
        {!query && active === "health" && <HealthHub onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "documents" && <DocumentLibrary key={`${documentLibraryRequest.key}-${documentLibraryFocusId || "document-library"}`}
          documents={cockpitDocuments(documents, localDocuments)} records={familyRecords} relations={familyRelations}
          initialFocusId={documentLibraryFocusId} initialArea={documentLibraryRequest.area} initialQuery={documentLibraryRequest.query}
          onPro={proTresorVerfuegbar() ? inProTresor : undefined} proKandidaten={new Set(localDocuments.filter((d) => !istProOriginal(d.storedPath)).map((d) => d.id))}
          fillStates={fillStates} onFill={setFillDocId} onWfpdf={(id) => void inWorkflowPdf(id)} onOpenDocument={openDocument} onGo={go} onUpload={openLocalUpload} onUnlink={unlinkContext} onChange={changeContextLink}
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
          onReview={reviewCentralIntake} onExtractAttachments={(id) => void extractCentralEmailAttachments(id)} onToggle={toggleCentralIntake} onSetStatus={setCentralIntakeStatus}
          onGo={(id) => go(id)}
        /></Suspense><Inbox compact documents={documents} localDocuments={localDocuments} loading={loadingDocs} onUpload={openLocalUpload} onOpenDocument={openDocument} onFill={setFillDocId} onWfpdf={(id) => void inWorkflowPdf(id)} onRefresh={async () => { await loadDocuments(); await refreshLocal(); }} onLocalStatus={async (id, status) => { if (!vaultHandle) return; await updateLocalStatus(vaultHandle, id, status); await refreshLocal(vaultHandle); }} onStatus={async (id, status) => {
          setBusy(true);
          try { await changeStatus(id, status); await loadDocuments(); setNotice({ kind: "success", text: `Bearbeitungsstand: ${statusLabel[status]}.` }); }
          catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "Speichern nicht möglich." }); }
          finally { setBusy(false); }
        }} busy={busy}/></>} 
        {!query && active === "stapel" && <Suspense fallback={null}><StapelSeite neu={stapelNeu} onNeuGenommen={() => setStapelNeu(null)} onWorkflowPdf={dateiInWorkflowPdf} onEinordnen={(dateien, ids) => queueCentralIntakeFiles(dateien, "camera-scan", null, ids)} kopf={<PageTitle icon={<Upload/>} title="Stapel (noch einordnen)" text="Viele Fotos oder Scans auf einmal: Workflow PDF findet je Bild das Blatt und zieht es gerade. Wo sich die Verfahren nicht einig sind, bleibt das ganze Foto stehen („Ecken prüfen“). Erst „Einordnen“ gibt die Unterlagen an die Eingangszentrale."/>}/></Suspense>}
        {!query && active === "workflowpdf" && <Suspense fallback={null}><WorkflowPdfSeite key={wfpdfStart} scan={wfpdfScan} oeffnen={wfpdfOeffnen} onAblegen={ausWorkflowPdf} onGeoeffnet={() => { setWfpdfOeffnen(null); setWfpdfScan(false); }} kopf={<PageTitle icon={<FileText/>} title="Workflow PDF" text="Das ganze Werkzeug von Workflow PDF in der Familienakte: scannen, zuschneiden, Felder erkennen und setzen, ausfüllen, Prüfbericht, PDF ausgeben. Eigene Bibliothek, getrennt von der Workflow-PDF-App; nichts geht ins Netz, bis du es selbst wählst."/>}/></Suspense>}
        {!query && active === "netz" && <Suspense fallback={null}><NetzSeite kopf={<PageTitle icon={<Network/>} title="Netz (Mycel)" text="Verbindet die Familienakte auf Wunsch mit anderen Geräten im SBKIM-Netz. Beim Öffnen der Akte geht nichts ins Netz; hinaus geht nur die Visitenkarte, keine Unterlagen."/>}/></Suspense>}
        {!query && active === "security" && <SecurityCenter
          aktenHandle={vaultHandle}
          oneDriveConnected={oneDriveReachable} oneDriveName={oneDriveName} oneDriveSummary={oneDriveSummary}
          localConnected={localVaultReachable} localVaultName={localVaultName} localVaultSummary={localVaultSummary}
          supported={vaultSupported()} onlineCount={documents.length} localCount={localDocuments.length} busy={vaultBusy || busy}
          syncPreview={syncPreview} syncResult={syncResult}
          onConnectOneDrive={connectOneDrive} onConnectLocal={connectLocalVault}
          onLockOneDrive={lockOneDrive} onLockLocal={lockLocalVault} onMigrate={migrateOnline} onHelp={() => go("help")}
          onCompare={startVaultInventoryComparison} onCheckSync={checkBackupSync} onRunSync={runBackupSync} onExport={() => { setExportOpen(true); reportActivity({ kind: "info", text: "Exportvorbereitung geöffnet. Noch keine Datei geschrieben; Umfang und Zielordner bitte prüfen." }); }} onFullBackup={runFullBackup} onRestoreTest={runRestoreTest}
        />}
        {!query && active === "medical" && <Medical diagnoses={filteredDiagnoses} query={query} onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "benefits" && <Benefits onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "work" && <Work onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "assessment" && <Assessment onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "assistant" && <Suspense fallback={null}><AssistantCenter
          records={familyRecords}
          relations={familyRelations}
          documents={localDocuments.map((document) => ({
            id: document.id,
            title: visibleDocumentTitle(document),
            category: document.category,
            notes: document.notes,
            assistantReleased: inventoryItems.some((item) => item.documentId === document.id && item.state === "ASSISTENZ_FREIGEGEBEN"),
          }))}
          initialCaseId={assistantCaseId}
          vaultReady={!!vaultHandle}
          onOpenRecord={(id) => go("cockpit", id)}
          onOpenDocument={(id) => void openDocument(id)}
          onSaveCorrespondence={saveAssistantCorrespondence}
          onNotice={setNotice}
        /></Suspense>}
        {!query && active === "correspondence" && <Correspondence onGo={go} onDocuments={openDocumentLibrary} onSearch={setQuery}/>}
        {!query && active === "sources" && <Sources onDocuments={openDocumentLibrary}/>}
        {!query && active === "family" && <FamilyArea onGo={go} onDocuments={openDocumentLibrary}/>}
        {!query && active === "reminders" && <ReminderCenter
          vaultHandle={vaultHandle} records={familyRecords} relations={familyRelations}
          onRefresh={async () => { if (vaultHandle) await refreshLocal(vaultHandle); }} onGo={go} onNotice={setNotice}
        />}
        {!query && active === "cockpit" && <InteractiveCockpit key={cockpitFocusId || "cockpit"}
          documents={documents} localDocuments={localDocuments} records={familyRecords} relations={familyRelations} decisions={linkDecisions}
          initialFocusId={cockpitFocusId} onGo={go} onOpenDocument={openDocument} onFill={setFillDocId}
          onTaskStatus={updateCockpitTask} onAddNote={appendCockpitNote} onSaveContact={savePersonContact} onAssistant={(caseId) => go("assistant", caseId)}
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
        {!query && active === "help" && <HelpCenter onGo={go} onSearch={(value) => { setQuery(value); window.scrollTo({ top: 0, behavior: "smooth" }); }}/>} 
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
          <div className="footer-brand-row"><div><strong>FAMILIENAKTE {APP_VARIANTE}</strong><span><b>Version {APP_VERSION}</b> · zuletzt aktualisiert am {APP_VERSION_DATE}</span></div><small>Originalunterlagen bleiben verbindlich. Vorbereitete Bereiche enthalten noch keine behaupteten Aktenbestände.</small></div>
          <nav className="footer-directory" aria-label="Weiterführende Bereiche der Familienakte">
            <section><h2>Familienakte</h2><ul><li><button onClick={() => go("cockpit")}>Interaktives Cockpit</button></li><li><button onClick={() => go("memory")}>Tagebuch & Erinnerungen</button></li><li><button onClick={() => go("reminders")}>Fristen und Aufgaben</button></li><li><button onClick={() => go("directory")}>Gesamtes Verzeichnis</button></li><li><button onClick={openLifeAreas}>Lebensbereiche</button></li></ul></section>
            <section><h2>Dokumente</h2><ul><li><button onClick={() => go("documents")}>Dokumentenbibliothek</button></li><li><button onClick={() => go("inbox")}>Eingangszentrale</button></li><li><button onClick={() => go("inventory")}>Bestand prüfen</button></li><li><button onClick={() => go("changelog")}>Was gibt’s Neues?</button></li></ul></section>
            <section><h2>Unterstützung</h2><ul><li><button onClick={() => go("help")}>Hilfe</button></li><li><button onClick={() => openChatGPTEdit()}>Mit KI arbeiten</button></li><li><button onClick={() => go("systemcheck")}>Systemprüfung</button></li><li><button onClick={openFooterSystemReports}>Prüfberichte</button></li></ul></section>
            <section><h2>Sicherheit und Verwaltung</h2><ul><li><button onClick={() => go("security")}>Sicherheitscenter</button></li><li><button onClick={() => { setExportOpen(true); reportActivity({ kind: "info", text: "Exportvorbereitung geöffnet. Umfang und Zielordner müssen vor dem Start ausdrücklich bestätigt werden; noch keine Datei geschrieben." }); }}>Familienakte exportieren</button></li><li><button onClick={() => go("versions")}>Versionshistorie</button></li></ul></section>
          </nav>
          <div className="footer-meta"><span>Me, Myself and I – Meine Familienakte{samplePresent ? ` · ${SAMPLE_NOTICE}` : ""}{!samplePresent && vaultHandle && <> · <button type="button" className="footer-sample-link" disabled={sampleBusy} onClick={() => void loadSampleData()}>Beispieldaten laden</button></>}</span><button onClick={() => go("security")}><LockKeyhole size={14}/> Datenschutz & Sicherheit</button></div>
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
      {uploadOpen && vaultHandle && <UploadDialog initialFile={uploadInitialFile} source={uploadSource} knownDocuments={[...localDocuments, ...documents]} records={familyRecords} relations={familyRelations} decisions={linkDecisions} suggestedCaseId={uploadSuggestedCaseId} onOpenExisting={async (id) => {
        const queued = uploadQueueId ? centralIntakeQueue.find((item) => item.id === uploadQueueId) : null;
        if (!await setCentralIntakeQueue((current) => current.map((item) => item.id === uploadQueueId ? { ...item, status: "Übernommen", selected: false, savedDocumentId: id, error: "Vorhandener Dokumentdatensatz wurde wiederverwendet; es wurde keine Kopie angelegt." } : item))) return;
        if (queued?.parentQueueId) {
          const parent = centralIntakeQueue.find((item) => item.id === queued.parentQueueId);
          if (parent?.savedDocumentId && localDocuments.some((item) => item.id === id)) void linkLocalDocuments(vaultHandle, parent.savedDocumentId, id, "enthält Anlage").catch(() => undefined);
        }
        setUploadOpen(false); setUploadQueueId(null); openDocumentLibrary({ focusId: id });
      }} onClose={() => { setUploadOpen(false); setUploadInitialFile(null); setUploadSuggestedCaseId(null); setUploadQueueId(null); }} onSave={async (file, data) => {
        try {
          const { newCaseTitle, rejectedContext, resolveOpenPointEventId, ...documentData } = data;
          const queued = uploadQueueId ? centralIntakeQueue.find((entry) => entry.id === uploadQueueId) : null;
          if (queued?.analysis?.email) {
            const email = queued.analysis.email;
            documentData.notes = [documentData.notes, `E-Mail-Herkunft: ${email.sender || "Absender unbekannt"}`, email.messageId ? `Message-ID: ${email.messageId}` : "", email.attachmentNames.length ? `Anlagen: ${email.attachmentNames.join(", ")}` : ""].filter(Boolean).join(" · ");
          }
          if (queued?.analysis) documentData.notes = [documentData.notes, `Eingangszentrale 2.28.0: ${queued.analysis.fileKind} · kontrolliert bestätigt`].filter(Boolean).join(" · ");
          if (newCaseTitle) {
            const createdCase = await createLocalFamilyRecord(vaultHandle, { recordType: "case", data: { title: newCaseTitle, caseType: "Benutzerbestätigter Vorgang" }, status: "offen", source: "Dokumenteneingang", notes: "Bewusst im Zusammenhangs-Dialog angelegt." });
            documentData.assignmentLinks = [...(documentData.assignmentLinks || []), { toType: "case", toId: createdCase.id, relationType: "gehört zu" }];
          }
          const scan = (file as DocumentScanPdfFile).documentScan;
          const item = await saveLocalDocument(vaultHandle, file, { ...documentData, scanPageCount: scan?.pageCount, scanOriginals: scan?.keepOriginals ? scan.originals : [] });
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
          setUploadOpen(false); setUploadInitialFile(null); setUploadSuggestedCaseId(null); setUploadQueueId(null); await refreshLocal(vaultHandle);
          setIncomingFiles((current) => current.filter((candidate) => !(candidate.name === file.name && candidate.size === file.size)));
          if (uploadFromStart) { setLastIntakeReceipt({ id: item.id, title: item.originalName, category: item.category, source: item.source || "Lokaler Datentresor" }); go("overview"); }
          else go("inbox");
          setActionState("upload", "success");
          setNotice({ kind: "success", text: scan ? `Das PDF aus ${scan.pageCount} Scan-Seite${scan.pageCount === 1 ? "" : "n"} wurde im freigegebenen Datentresor erfasst.${scan.keepOriginals ? " Die Originalaufnahmen wurden als Anlagen derselben PDF behalten." : " Es wurden keine zusätzlichen Scan-Fotos als Dokumente angelegt."}` : "Die Unterlage wurde im freigegebenen Datentresor erfasst. Die Originaldatei wurde nicht verschoben, umbenannt oder gelöscht." });
          return item;
        } catch (error) {
          setActionState("upload", "failed");
          throw error;
        }
      }}/>} 
      {fillDocument && vaultHandle && <Suspense fallback={null}><AusfuellenDialog dokument={fillDocument} geschuetzt={isSensitiveHealthText(fillDocument.originalName, fillDocument.category, fillDocument.notes)} personen={fillPersons} namen={kiNamen}
        leseDatei={() => readLocalDocumentFile(vaultHandle, fillDocument.id)}
        ablage={{ lesen: () => readAusfuellAblage(vaultHandle), schreiben: (teil) => writeAusfuellAblage(vaultHandle, teil) }}
        onVormerken={async (info) => { await setLocalDocumentAusfuellen(vaultHandle, fillDocument.id, info); await refreshLocal(vaultHandle); }}
        onErgebnis={(file, modus, info) => saveFillResult(fillDocument, file, modus, info)}
        onClose={() => setFillDocId(null)} onNotice={setNotice}/></Suspense>}
      {editOpen && <KiAuftragDialog seiteId={active} seite={sectionLabels[active] || "Startseite"} initialRequest={editInitialRequest} documents={localDocuments} namen={kiNamen} readDocument={(id) => vaultHandle ? readLocalDocumentFile(vaultHandle, id) : Promise.reject(new Error("Kein Tresor geöffnet."))} onSaveAnswer={(file) => window.dispatchEvent(new CustomEvent("familienakte:dateien", { detail: { files: [file] } }))} onClose={() => setEditOpen(false)} onNotice={setNotice} onStateChange={(state) => setActionState("chatgpt", state)}/>}
      <button type="button" className="ki-fab" onClick={() => openChatGPTEdit()} aria-label="Mit KI arbeiten" title={`Mit KI arbeiten – Seite „${sectionLabels[active] || "Startseite"}“`}><Sparkles size={20}/></button>
      {memoryReviewOpen && memoryDraft && vaultHandle && <MemoryReviewDialog
        draft={memoryDraft} documents={contextDocuments(documents, localDocuments)} records={familyRecords} relations={familyRelations} decisions={linkDecisions}
        onOpenDocument={openDocument}
        queuePosition={Math.max(1, sortMemoryDraftQueue(memoryDrafts).findIndex((item) => item.id === memoryDraft.draftId) + 1)} queueTotal={memoryDrafts.length}
        onClose={async (status = "unbehandelt") => { if (memoryDraft.draftId) { await updateLocalMemoryDraftStatus(vaultHandle, memoryDraft.draftId, status); await refreshLocal(vaultHandle); } setMemoryReviewOpen(false); setMemoryDraft(null); }}
        onSave={async (input) => {
          const total = memoryDrafts.length;
          const { rejectedContext, ...memoryInput } = input;
          const saved = await createLocalMemoryBundle(vaultHandle, { ...memoryInput, draftId: memoryDraft.draftId });
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
  );
}

function Overview({ documents, localDocuments, oneDriveSummary, oneDriveName, localVaultName, oneDriveReachable, localVaultReachable, vaultRemembered, familyRecords, familyRelations, busy, actionStates, onCompare, onUpdate, onGo, onOpenLifeArea, systemReport, onStartIntake, onSelectInbox, onScanInbox, onScanOneDrive, onStartDocumentScan, storageReady, inboxFolderName, incomingFiles, intakeBusy, intakeCheckedAt, lastIntakeReceipt, memoryDrafts, memoryEditDraft, memorySuggestedCaseId, openMemoryPoints, onQueueMemory, onReviewMemory, onOpenMemoryQueue, lastMemoryReceipt }: {
  documents: UploadedDocument[]; localDocuments: LocalDocument[]; oneDriveSummary: VaultSummary | null;
  oneDriveName: string; localVaultName: string; oneDriveReachable: boolean; localVaultReachable: boolean; vaultRemembered: boolean;
  familyRecords: FamilyRecordUnion[]; familyRelations: FamilyRelation[];
  busy: boolean; actionStates: Record<ActionKey, ActionState>; onCompare: () => void; onUpdate: () => void;
  onGo: (id: SectionId, targetId?: string) => void; onOpenLifeArea: (area: string) => void;
  systemReport: SystemCheckReport | null;
  onStartIntake: (file?: File | null, source?: DocumentIntakeSource) => void; onSelectInbox: () => void; onScanInbox: () => void; onScanOneDrive: () => void;
  onStartDocumentScan: (files: File[]) => void; storageReady: boolean;
  inboxFolderName: string; incomingFiles: IncomingFolderFile[]; intakeBusy: boolean; intakeCheckedAt: string | null; lastIntakeReceipt: IntakeReceipt | null;
  memoryDrafts: MemoryDraftEntry[]; memoryEditDraft: MemoryDraft | null; openMemoryPoints: number;
  memorySuggestedCaseId: string | null;
  onQueueMemory: (draft: MemoryDraft) => Promise<MemoryDraftEntry | null>; onReviewMemory: (draft?: MemoryDraft | null) => Promise<void>; onOpenMemoryQueue: () => void; lastMemoryReceipt: MemoryReceipt | null;
}) {
  const currentSystemReport = systemReport?.version === APP_VERSION ? systemReport : null;
  const systemStatus = currentSystemReport?.overall || "unchecked";
  const systemStatusText = !currentSystemReport ? "Noch nicht geprüft" : currentSystemReport.overall === "green" ? "Prüfung vollständig abgeschlossen – keine offenen Fehler oder Warnungen." : currentSystemReport.overall === "yellow" ? "Warnungen oder unvollständig umgesetzte Punkte sind vorhanden." : "Die Systemprüfung hat Fehler festgestellt.";
  const openProblems = currentSystemReport?.openProblems || [];
  const systemProblemSummary = !currentSystemReport
    ? "Für diese Version liegt noch kein vollständiges Prüfergebnis vor."
    : openProblems.length > 0
      ? `${openProblems.length} offene${openProblems.length === 1 ? "r Punkt" : " Punkte"} der Systemprüfung`
      : currentSystemReport.overall === "green"
        ? "Systemprüfung vollständig – keine offenen Punkte."
        : "Die Systemprüfung enthält Hinweise, die geprüft werden sollten.";
  const vaultConnected = oneDriveReachable || localVaultReachable;
  const connectedVaultDetails = [
    oneDriveReachable ? `OneDrive-Datentresor${oneDriveName ? `: ${oneDriveName}` : ""}` : "",
    localVaultReachable ? `USB-/PC-Tresor${localVaultName ? `: ${localVaultName}` : ""}` : "",
  ].filter(Boolean).join(" · ");
  const vaultActionState: ActionState = vaultConnected ? "success" : vaultRemembered ? "failed" : actionStates.vault;
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
  const latestUpdate = updatedCandidates[0] ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(updatedCandidates[0])) : APP_VERSION_DATE;
  const hasCockpitData = cockpit.objects.length > 0 || openCases.length > 0 || !!nextTask || !!nextDeadline || !!latestNews;
  return <>
    <section className="family-hero"><div><span className="eyebrow">Privater Aktenschrank</span><h1>Alles Wichtige an einem Ort</h1><p>Eine sichere Familienakte, die nicht nur dokumentiert und ordnet, sondern auch unterstützt, erinnert und mitdenkt – bei Unterlagen, Fragen, E-Mails, Terminen und allen wichtigen Familienbereichen.</p></div><div className="hero-cockpit"><div className="hero-cockpit-heading"><span><FolderHeart size={23}/><strong>Objekt-Cockpit</strong></span><InfoPopover label="Objekt-Cockpit erklären" text="Hier siehst du vorhandene Objekte, offene Vorgänge und die nächsten wichtigen Schritte. Ein Klick öffnet die gemeinsame Arbeitsübersicht."/></div><button className="hero-cockpit-open" onClick={() => onGo("cockpit")}>
      {hasCockpitData ? <div className="hero-cockpit-grid"><span><small>Aktive Objekte</small><strong>{cockpit.objects.length}</strong></span><span><small>Offene Vorgänge</small><strong>{openCases.length}</strong></span><span><small>Nächste Aufgabe</small><strong>{nextTask?.title || "Keine offene Aufgabe"}</strong></span><span><small>Nächste Frist</small><strong>{nextDeadline?.title || "Keine Frist vorgemerkt"}</strong></span><span><small>Zuletzt wichtig</small><strong>{latestNews?.sensitive ? "Geschützter neuer Eintrag" : latestNews?.title || "Kein neuer Eintrag"}</strong></span><span><small>Aktualisiert</small><strong>{latestUpdate}</strong></span></div> : <span className="hero-cockpit-empty">Noch keine aktuellen Objektinformationen vorhanden.</span>}
      <span className="hero-cockpit-link">Objekt-Cockpit öffnen <ChevronRight size={16}/></span>
    </button></div></section>
    <section className="card recent-card priority-recent"><div className="card-heading"><div><span className="eyebrow dark">Aktueller Stand</span><div className="start-title-row"><h2 className="start-section-title">Zuletzt wichtig</h2><InfoPopover label="Zuletzt wichtig erklären" text="Hier stehen vorhandene Punkte, die jetzt oder bald deine Aufmerksamkeit benötigen."/></div><p>Überfällige und heute fällige Punkte stehen zuerst. Erledigte Aufgaben werden hier nicht mehr angezeigt.</p></div><div className="recent-heading-actions"><button className="button secondary compact-button" onClick={() => onGo("cockpit")}>Arbeitsübersicht öffnen</button><button className="text-link news-entry-link" onClick={() => onGo("changelog")}>Was gibt’s Neues? <ChevronRight size={16}/></button></div></div>
      <div className="vault-actions-heading"><span>Datentresor &amp; Sicherung</span><InfoPopover label="Datentresor und Sicherung erklären" text="Hier verbindest du deinen Datentresor, legst Unterlagen ab und startest den kontrollierten Abgleich. Gelb bedeutet offen, Grün erfolgreich und Grau derzeit nicht möglich."/></div>
      <div className="quick-strip vault-action-strip" aria-label="Datentresor und Sicherung">
        <div className="vault-action-item"><button className={`vault-action state-${vaultActionState}`} onClick={() => onGo("security")} aria-label={`${vaultConnected ? "Datentresor verbunden" : vaultRemembered ? "Datentresor erneut verbinden" : "Datentresor verbinden"}. Status: ${actionStateLabel[vaultActionState]}`}><HardDrive/><span><strong>{vaultConnected ? "Datentresor verbunden" : vaultRemembered ? "Erneut verbinden" : "Datentresor verbinden"}</strong><small>{vaultConnected ? connectedVaultDetails : vaultRemembered ? "Zugriff erneut freigeben" : "OneDrive, PC oder USB"}</small></span></button><InfoPopover label="Datentresor verbinden erklären" text="Verbindet den von dir ausgewählten OneDrive-, PC- oder USB-Speicher. Die Familienakte erhält nur Zugriff auf den ausdrücklich freigegebenen Ordner. Ohne deinen Befehl werden keine Dateien verschoben, gelöscht oder synchronisiert."/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.upload}`} onClick={() => onStartIntake()} aria-label={`Neue Unterlage ablegen. Status: ${actionStateLabel[actionStates.upload]}`}><Upload/><span><strong>Neue Unterlage ablegen</strong><small>einzeln prüfen und speichern</small></span></button><InfoPopover label="Neue Unterlage ablegen erklären" text="Öffnet den bestehenden Dokumenteneingang für eine einzelne Datei oder ein neues Dokument. Die Unterlage wird erst nach deiner Prüfung und Bestätigung gespeichert; das Original bleibt unverändert."/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.compare}`} onClick={onCompare} disabled={busy} aria-label={`Abgleich durchführen. Status: ${actionStateLabel[actionStates.compare]}`}><ClipboardCheck/><span><strong>Abgleich durchführen</strong><small>{newDocumentCount ? `${newDocumentCount} neue Datei${newDocumentCount === 1 ? "" : "en"}` : "Ordner kontrolliert prüfen"}</small></span></button><InfoPopover label="Abgleich durchführen erklären" text="Prüft den verbundenen Ordner einschließlich seiner Unterordner auf neue oder geänderte Dateien. Die vorhandene FaWoGa-Bestandsanalyse wird verwendet; Originaldateien bleiben unverändert."/></div>
        <div className="vault-action-item"><button className={`state-${actionStates.update}`} onClick={onUpdate} disabled={busy} aria-label={`Akte aktualisieren. Status: ${actionStateLabel[actionStates.update]}`}><RefreshCw/><span><strong>Akte aktualisieren</strong><small>{reviewedDocumentCount ? `${reviewedDocumentCount} geprüft` : "bestätigte Angaben übernehmen"}</small></span></button><InfoPopover label="Akte aktualisieren erklären" text="Übernimmt ausschließlich bereits bestätigte Änderungen und Zuordnungen in die vorhandene Familienakte. Es entsteht keine zweite Dokumenten- oder Registerlogik."/></div>
      </div>
      {important.map((item) => <button onClick={() => onGo(item.sensitive ? "health" : item.sourceType === "document" ? "inbox" : "cockpit", item.sourceId)} key={item.id}><span className={`priority-dot urgency-${item.urgency}`} aria-hidden="true"/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]} · {item.detail}</small></span><ChevronRight/></button>)}
    </section>
    <DocumentIntakePanel oneDriveConnected={!!oneDriveSummary} storageReady={storageReady} inboxFolderName={inboxFolderName} incomingFiles={incomingFiles} busy={intakeBusy} checkedAt={intakeCheckedAt} receipt={lastIntakeReceipt} onFile={onStartIntake} onStartDocumentScan={onStartDocumentScan} onSelectInbox={onSelectInbox} onScanInbox={onScanInbox} onScanOneDrive={onScanOneDrive} onGo={onGo}/>
    <MemoryCapturePanel key={memoryEditDraft?.draftId || memorySuggestedCaseId || "new-memory"} initialDraft={memoryEditDraft} suggestedCaseId={memorySuggestedCaseId} queueCount={memoryDrafts.length} openPointCount={openMemoryPoints} onQueue={onQueueMemory} onReview={onReviewMemory} onOpenQueue={onOpenMemoryQueue} onGo={onGo} receipt={lastMemoryReceipt}/>
    <section className="section-heading" id="lebensbereiche"><div><span className="eyebrow dark">Lebensbereiche</span><div className="start-title-row"><h2 className="start-section-title">Direkt zur passenden Akte</h2><InfoPopover label="Lebensbereiche erklären" text="Hier wechselst du direkt in die thematisch passende Akte. Es werden nur die vorhandenen gemeinsamen Daten verwendet."/></div></div><button className="text-link" onClick={() => onGo("directory")}>Alle Unterbereiche <ChevronRight size={17}/></button></section>
    <section className="object-grid overview-life-grid">
      {objectAreas.map(({ id, title, text, status, Icon }) => <button className="object-card" key={id} onClick={() => onGo(id)}><div className="object-icon"><Icon/></div><span className={`badge ${status === "aktiv" ? "success" : "neutral"}`}>{status}</span><h3 className="start-card-title">{title}</h3><p>{text}</p><span className="open-label">Öffnen <ChevronRight size={16}/></span></button>)}
      {personalLifeAreas.map((area) => <button className="object-card personal-life-area-card" key={`personal-${area.name}`} onClick={() => onOpenLifeArea(area.name)}><div className="object-icon"><FolderHeart/></div><span className="badge success">persönlich</span><h3 className="start-card-title">{area.name}</h3><p>{area.documentCount} gespeicherte {area.documentCount === 1 ? "Unterlage ist" : "Unterlagen sind"} diesem Lebensbereich zugeordnet.</p><span className="open-label">Öffnen <ChevronRight size={16}/></span></button>)}
    </section>
    <section className={`system-status-bar status-${systemStatus}`} aria-label="Status der Systemprüfung">
      <div className="system-status-main"><span className="system-status-symbol" aria-hidden="true">{currentSystemReport ? levelSymbol[currentSystemReport.overall] : "⚪"}</span><div><div className="start-title-row"><h2 className="start-section-title">Systemprüfung</h2><InfoPopover label="Systemprüfung erklären" text="Die Systemprüfung kontrolliert, ob wichtige Bereiche der Familienakte, Verknüpfungen, Datenschutz, Dokumente und technische Funktionen ordnungsgemäß arbeiten."/></div><strong>{systemStatusText}</strong><small>{currentSystemReport ? `Letzte vollständige Prüfung: ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(currentSystemReport.checkedAt))} · Version ${currentSystemReport.version}` : `Für Version ${APP_VERSION} liegt noch kein vollständiges Prüfergebnis vor.`}</small><em>{systemProblemSummary}</em></div></div>
      <div className="system-open-card"><button className="button primary system-open-button" onClick={() => onGo("systemcheck")}><ShieldCheck size={18}/> Systemprüfung öffnen</button></div>
    </section>
  </>;
}

function DocumentIntakePanel({ oneDriveConnected, storageReady, inboxFolderName, incomingFiles, busy, checkedAt, receipt, onFile, onStartDocumentScan, onSelectInbox, onScanInbox, onScanOneDrive, onGo }: {
  oneDriveConnected: boolean; storageReady: boolean; inboxFolderName: string; incomingFiles: IncomingFolderFile[]; busy: boolean; checkedAt: string | null; receipt: IntakeReceipt | null;
  onFile: (file?: File | null, source?: DocumentIntakeSource) => void; onStartDocumentScan: (files: File[]) => void; onSelectInbox: () => void; onScanInbox: () => void; onScanOneDrive: () => void; onGo: (id: SectionId, targetId?: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const lastChecked = checkedAt ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(checkedAt)) : "noch nicht geprüft";
  const acceptFiles = (files: FileList | null, source: DocumentIntakeSource) => {
    const file = files?.[0];
    if (file) onFile(file, source);
  };
  return <section className="document-intake card" aria-labelledby="document-intake-title">
    <div className="card-heading document-intake-heading"><div><span className="eyebrow dark">Gemeinsamer Dokumenteneingang</span><div className="start-title-row"><h2 className="start-section-title" id="document-intake-title">Neue Dokumente erfassen</h2><InfoPopover label="Dokumenteneingang erklären" text="So nutzt du den Dokumenteneingang am besten: Einzelne Dateien kannst du direkt hineinziehen. Mehrere zusammengehörende Dateien wählst du gemeinsam aus. Auf dem Handy kannst du Dokumente fotografieren; am PC kannst du einen Eingangsordner oder einen OneDrive-Ordner verwenden. Die Familienakte schlägt Zuordnungen vor, du bestätigst die endgültige Zuordnung selbst. Originaldateien bleiben unverändert."/></div><p>Wähle den Eingangsweg, der zu deinem Gerät und deinen Unterlagen passt.</p></div><button className="text-link" onClick={() => onGo("help")}>Hilfe <ChevronRight size={16}/></button></div>
    <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip" onChange={(event) => acceptFiles(event.target.files, "file-picker")}/>
    <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { const files = event.target.files ? Array.from(event.target.files) : []; if (files.length) onStartDocumentScan(files); event.currentTarget.value = ""; }}/>
    <div className="document-intake-grid">
      <article className={`intake-method-card intake-drop ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFiles(event.dataTransfer.files, "drag-drop"); }}>
        <div className="intake-method-heading"><h3 className="start-card-title">Dokument hier hineinziehen</h3><InfoPopover label="Dateien hineinziehen erklären" text="Hier kannst du eine oder mehrere Dateien direkt hineinziehen. Die Familienakte erkennt den Dateityp und bereitet die Unterlagen zur Prüfung vor."/></div><div className="intake-method-action"><Upload size={26}/><span>Datei ablegen oder bewusst auswählen</span><button className="button primary compact-button" type="button" onClick={() => inputRef.current?.click()}>Datei auswählen</button></div>
      </article>
      <article className="intake-method-card intake-camera"><div className="intake-method-heading"><h3 className="start-card-title">Dokument fotografieren</h3><InfoPopover label="Dokument fotografieren erklären" text="Diese Funktion ist besonders für Smartphone und Tablet gedacht. Damit kannst du ein Papierdokument fotografieren und anschließend in der Familienakte prüfen und zuordnen."/></div><button className="intake-source" type="button" onClick={() => onStartDocumentScan([])} disabled={busy} data-dokument-scannen><Camera/><span><strong>Fotofunktion öffnen</strong><small>{storageReady ? "Eine oder mehrere Seiten als PDF prüfen" : "Zuerst lokalen Datentresor verbinden"}</small></span><ChevronRight/></button></article>
      <article className="intake-method-card intake-desktop"><div className="intake-method-heading"><h3 className="start-card-title">Eingangsordner auswählen</h3><InfoPopover label="Eingangsordner erklären" text="Diese Funktion ist besonders am PC praktisch. Wähle einen Ordner aus, dessen neue Unterlagen du prüfen möchtest."/></div><button className="intake-source" type="button" onClick={inboxFolderName ? onScanInbox : onSelectInbox} disabled={busy}><Folder/><span><strong>{inboxFolderName ? "Eingangsordner jetzt prüfen" : "Ordner auswählen"}</strong><small>{inboxFolderName ? `Freigegeben: ${inboxFolderName}` : "Nur den ausdrücklich ausgewählten lokalen Ordner"}</small></span><ChevronRight/></button></article>
      <article className="intake-method-card intake-desktop"><div className="intake-method-heading"><h3 className="start-card-title">OneDrive-Familienordner prüfen</h3><InfoPopover label="OneDrive-Ordner erklären" text="Hier kannst du einen bewusst ausgewählten OneDrive-Ordner prüfen lassen. Es werden keine anderen OneDrive-Ordner automatisch durchsucht."/></div><button className="intake-source" type="button" onClick={onScanOneDrive} disabled={busy}><Cloud/><span><strong>OneDrive-Ordner prüfen</strong><small>{oneDriveConnected ? `Verbunden · letzte Prüfung: ${lastChecked}` : "Noch kein lokaler OneDrive-Ordner verbunden"}</small></span><ChevronRight/></button></article>
    </div>
    {busy && <div className="intake-progress" role="status"><RefreshCw className="spin"/><span>Der freigegebene Ordner wird geprüft. Originaldateien bleiben unverändert.</span></div>}
    {incomingFiles.length > 0 && <div className="intake-results" id="intake-new-files"><button className="intake-count" onClick={() => setShowAll((value) => !value)}>{incomingFiles.length} neue oder geänderte Datei{incomingFiles.length === 1 ? "" : "en"} <ChevronRight size={16}/></button><div>{incomingFiles.slice(0, showAll ? incomingFiles.length : 5).map((item) => <button key={item.key} onClick={() => onFile(item.file, item.source)}><FileText/><span><strong>{item.name}</strong><small>{fmtBytes(item.size)} · prüfen und erfassen</small></span><ChevronRight/></button>)}</div>{incomingFiles.length > 5 && <button className="text-link" onClick={() => setShowAll((value) => !value)}>{showAll ? "Kompakt anzeigen" : "Alle Eingangsfälle ansehen"} <ChevronRight size={16}/></button>}</div>}
    {receipt && <button className="intake-receipt" onClick={() => onGo("documents", receipt.id)}><CheckCircle2/><span><strong>Dokument erfolgreich erfasst</strong><small>{receipt.title} · {receipt.category} · {receipt.source}</small></span><ChevronRight/></button>}
  </section>;
}

function MemoryCapturePanel({ initialDraft, suggestedCaseId, queueCount, openPointCount, onQueue, onReview, onOpenQueue, onGo, receipt }: {
  initialDraft: MemoryDraft | null; queueCount: number; openPointCount: number;
  suggestedCaseId?: string | null;
  onQueue: (draft: MemoryDraft) => Promise<MemoryDraftEntry | null>; onReview: (draft?: MemoryDraft | null) => Promise<void>;
  onOpenQueue: () => void; onGo: (id: SectionId, targetId?: string) => void; receipt: MemoryReceipt | null;
}) {
  const [text, setText] = useState(initialDraft?.text || "");
  const [files, setFiles] = useState<File[]>(initialDraft?.files || []);
  const [dictated, setDictated] = useState(initialDraft?.captureType === "sprache" || initialDraft?.captureType === "kombination");
  const [working, setWorking] = useState(false);
  const [hint, setHint] = useActivityMessage("error", "Erinnerung");
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
  const queue = async () => {
    if (!hasInput) { setHint("Bitte zuerst eine Erinnerung eingeben."); return; }
    setWorking(true); setHint("");
    const saved = await onQueue(currentDraft);
    if (saved) clear();
    setWorking(false);
  };
  const review = async () => {
    if (!hasInput && !queueCount) { setHint("Bitte zuerst eine Erinnerung eingeben."); return; }
    setWorking(true); setHint("");
    await onReview(hasInput ? currentDraft : null);
    if (hasInput) clear();
    setWorking(false);
  };
  const leaveToMemory = async () => {
    if (!hasInput) { onGo("memory"); return; }
    if (await askConfirm("Aktuelle Erinnerung wurde noch nicht übernommen. Soll sie jetzt in die Warteschlange gelegt werden?")) {
      const saved = await onQueue(currentDraft);
      if (saved) { clear(); onGo("memory"); }
      return;
    }
    if (await askConfirm("Aktuelle Eingabe verwerfen und das Tagebuch öffnen?")) onGo("memory");
  };
  return <section className="memory-capture card" aria-labelledby="memory-capture-title">
    <div className="card-heading"><div><span className="eyebrow dark">Lokales Erinnerungsprotokoll</span><div className="start-title-row"><h2 className="start-section-title" id="memory-capture-title">Was ist heute passiert?</h2><InfoPopover label="Erinnerungsprotokoll erklären" text="Hier kannst du ein Erlebnis, einen Gedanken oder eine Beobachtung schreiben, diktieren oder mit Fotos ergänzen."/></div><p>{initialDraft ? "Ergänze oder korrigiere diesen unbehandelten Entwurf." : "Erfasse mehrere Erinnerungen nacheinander und prüfe sie anschließend einzeln."}</p></div></div>
    {(initialDraft?.suggestedCaseId || suggestedCaseId) && <div className="context-prefill"><ClipboardCheck size={18}/><span><strong>Bezug zu Vorgang vorgeschlagen</strong><small>{initialDraft?.suggestedCaseId || suggestedCaseId} · wird vor dem endgültigen Speichern noch geprüft</small></span></div>}
    <div className="memory-capture-grid"><label className="memory-text"><span>Erlebnis, Beobachtung oder Gedanke</span><div><textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} placeholder="Zum Beispiel: Der Elektriker war heute da. Die zweite Lampe flackert weiterhin …"/><DictationButton value={text} onChange={setText} label="Erinnerung" onDictationStart={() => setDictated(true)}/></div></label><div className="memory-media-picker"><input ref={mediaRef} className="sr-only" type="file" multiple accept="image/*,video/*" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 12))}/><button className="button secondary" type="button" onClick={() => mediaRef.current?.click()}><Camera size={17}/> Fotos oder Videos</button><small>Bis zu 12 Dateien; Speicherung nur im verbundenen lokalen Tresor.</small>{files.length > 0 && <div className="memory-file-chips">{files.map((file) => <span key={`${file.name}-${file.size}`}>{file.type.startsWith("video/") ? <Video size={14}/> : <Camera size={14}/>} {file.name}</span>)}</div>}</div></div>
    <div className="memory-function-grid"><article className="memory-function-card"><div className="intake-method-heading"><h3 className="start-card-title">Tagebuch öffnen</h3><InfoPopover label="Tagebuch erklären" text="Hier findest du deine gespeicherten Erinnerungen, Ereignisse und Tagebucheinträge in zeitlicher Reihenfolge. Das Tagebuch hilft dir, frühere Ereignisse und Zusammenhänge später wiederzufinden."/></div><p>Gespeicherte Erinnerungen und Zusammenhänge ansehen.</p><button className="button secondary" onClick={() => void leaveToMemory()}><BookOpen size={17}/> Tagebuch öffnen</button></article><article className="memory-function-card"><h3 className="start-card-title">Nächste Eingabe</h3><p>Legt den aktuellen Inhalt als noch nicht geprüften Entwurf ab.</p><button className="button secondary" disabled={!hasInput || working} onClick={() => void queue()}><Plus size={17}/> Nächste Eingabe</button></article><article className="memory-function-card"><h3 className="start-card-title">Eintrag prüfen</h3><p>Öffnet den aktuellen Eintrag zur Prüfung, Ergänzung und endgültigen Zuordnung.</p><button className="button primary" disabled={(!hasInput && !queueCount) || working} onClick={() => void review()}><NotebookPen size={17}/> Eintrag prüfen</button></article></div>
    {hint && <div className="form-error">{hint}</div>}
    <div className="memory-counters"><button disabled={!queueCount} onClick={onOpenQueue}><strong>Unbehandelte Erinnerungen: {queueCount}</strong><small>{queueCount ? "Zur Bearbeitungswarteschlange" : "Zurzeit wartet kein Entwurf"}</small></button><button disabled={!openPointCount} onClick={() => onGo("memory")}><strong>Offene Memory-Fragen: {openPointCount}</strong><small>Bereits gespeicherte Einträge mit Klärungsbedarf</small></button></div>
    {receipt && <button className="intake-receipt" onClick={() => onGo("memory", receipt.id)}><CheckCircle2/><span><strong>Erinnerung gespeichert</strong><small>{receipt.title} · {receipt.mediaCount} Medium{receipt.mediaCount === 1 ? "" : "en"}</small></span><ChevronRight/></button>}
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
  const [selectedIds, setSelectedIds] = useState(() => new Set([...initial.selectedReferences.map((item) => item.id), ...(draft.suggestedCaseId ? [draft.suggestedCaseId] : [])]));
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
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useActivityMessage();
  const calculated = useMemo(() => buildMemoryAnalysis({ originalText: draft.text, followUpAnswer: followUp, captureType: draft.captureType, records, relations, mediaCount: draft.files.length }), [draft, followUp, records, relations]);
  const analysis: MemoryAnalysis = { ...calculated, title: title.trim() || calculated.title, lifeArea, eventType: eventType.trim() || calculated.eventType, statements: statementRows.filter((item) => item.included && item.text.trim()).map(({ included: _included, ...item }) => item) };
  const save = async () => {
    if (!confirmed) return setError("Bitte bestätige, dass dieser Eintrag mit den ausgewählten Angaben gespeichert werden darf.");
    setBusy(true); setError("");
    try {
      const references = analysis.candidates.filter((item) => selectedIds.has(item.id)).map((item) => ({ recordType: item.recordType, id: item.id }));
      if (chosenCaseId && !references.some((item) => item.recordType === "case" && item.id === chosenCaseId)) references.push({ recordType: "case", id: chosenCaseId });
      await onSave({ originalText: draft.text, originalTranscript: draft.captureType === "sprache" || draft.captureType === "kombination" ? draft.text : undefined, followUpAnswer: followUp, captureType: draft.captureType, analysis, mediaFiles: draft.files, selectedReferences: references, createTask, createDeadline, rejectedContext });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Der Erinnerungseintrag konnte nicht gespeichert werden."); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" role="presentation"><section className="modal memory-review" role="dialog" aria-modal="true" aria-labelledby="memory-review-title"><div className="modal-head"><div><span className="eyebrow dark">Memory {queuePosition} von {Math.max(queueTotal, 1)} · {confirmed ? "Bereit zum Speichern" : "In Bearbeitung"}</span><h2 id="memory-review-title">Erinnerung strukturieren</h2><p>Noch {Math.max(0, queueTotal - 1)} unbehandelte Ereignisse nach diesem Eintrag. Unklare Zuordnungen werden nicht automatisch übernommen.</p></div><button className="icon-button" onClick={() => void onClose(confirmed ? "bereit_zum_speichern" : "unbehandelt")} aria-label="Schließen"><X/></button></div>
    <div className="memory-original"><strong>Originaltext – bleibt unverändert</strong><p>{draft.text || "Nur Medien ausgewählt"}</p></div>
    {contextSuggestions.length > 0 && <section className="context-suggestion"><div><span className="eyebrow dark">Zusammenhang prüfen</span><h3>Passender vorhandener Vorgang gefunden</h3><p><strong>{contextSuggestions[0].caseLabel}</strong> · {contextSuggestions[0].confidence}</p><details><summary>Warum vorgeschlagen?</summary><ul>{contextSuggestions[0].reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div><div className="context-suggestion-actions"><button type="button" className="button primary" onClick={() => { setChosenCaseId(contextSuggestions[0].caseId); setRejectedContext(undefined); }}>Verknüpfen</button><label><span>Anderen Vorgang wählen</span><select value={chosenCaseId} onChange={(event) => { setChosenCaseId(event.target.value); setRejectedContext(undefined); }}><option value="">Noch nicht verknüpfen</option>{records.filter((record) => record.recordType === "case").map((record) => <option value={record.id} key={record.id}>{String((record.data as { title?: string }).title || record.id)}</option>)}</select></label><button type="button" className="button secondary" onClick={() => { setChosenCaseId(""); setRejectedContext(contextSuggestions[0]); }}>Nicht verknüpfen</button></div>{contextSuggestions[0].relatedDocumentIds.length > 0 && <div className="context-related-results"><strong>Passendes Dokument gefunden</strong>{contextSuggestions[0].relatedDocumentIds.map((id) => <button type="button" className="text-link" key={id} onClick={() => void onOpenDocument(id)}>{id} öffnen <ChevronRight size={15}/></button>)}</div>}</section>}
    <div className="form-grid"><label><span>Titel</span><VoiceInput value={title} onValueChange={(spokenValue) => setTitle(spokenValue)} speechLabel="Titel"/></label><label><span>Lebensbereich</span><select value={lifeArea} onChange={(event) => setLifeArea(event.target.value)}>{FAWOGA_LIFE_AREAS.map((area) => <option key={area}>{area}</option>)}</select></label><label><span>Ereignisart</span><VoiceInput value={eventType} onValueChange={(spokenValue) => setEventType(spokenValue)} speechLabel="Ereignisart"/></label><label><span>Zeitpunkt</span><input value={analysis.eventAt.replace("T", " ")} readOnly/></label></div>
    <section className="memory-statements"><span className="ui-heading-help"><h3>Erkannte Aussagen prüfen</h3><InfoPopover label="Erkannte Aussagen prüfen erklären" text={UI_HELP["Erkannte Aussagen prüfen"]}/></span>{statementRows.length ? statementRows.map((item, index) => <div className={!item.included ? "discarded" : ""} key={`statement-${index}`}><select aria-label={`Art der Aussage ${index + 1}`} value={item.kind} onChange={(event) => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, kind: event.target.value as MemoryStatementKind } : row))}><option value="tatsache">Tatsache</option><option value="beobachtung">Beobachtung</option><option value="einschätzung">Einschätzung</option></select><VoiceTextarea rows={2} value={item.text} onValueChange={(spokenValue) => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, text: spokenValue } : row))} speechLabel="Erkannte Aussage"/><button className="text-link" onClick={() => setStatementRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, included: !row.included } : row))}>{item.included ? "Verwerfen" : "Übernehmen"}</button></div>) : <p>Aus den ausgewählten Medien wurde noch keine Textaussage abgeleitet.</p>}</section>
    {analysis.candidates.length > 0 && <section><span className="ui-heading-help"><h3>Vorhandene Datensätze verknüpfen</h3><InfoPopover label="Vorhandene Datensätze verknüpfen erklären" text={UI_HELP["Vorhandene Datensätze verknüpfen"]}/></span><div className="memory-reference-list">{analysis.candidates.map((item) => <label key={item.id} className="check-row"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })}/><span><strong>{item.label}</strong><small>{recordTypeDefinitions[item.recordType].label} · {item.id} · {item.confidence}</small></span></label>)}</div></section>}
    {analysis.assistantQuestion && <label className="memory-follow-up"><span><CircleHelp size={15}/> Eine gezielte Rückfrage</span><strong>{analysis.assistantQuestion}</strong><div><textarea rows={2} value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Antwort ist freiwillig"/><DictationButton value={followUp} onChange={setFollowUp} label="Antwort"/></div></label>}
    {(analysis.taskProposal || analysis.deadlineProposal) && <section className="memory-proposals"><span className="ui-heading-help"><h3>Nur nach Bestätigung anlegen</h3><InfoPopover label="Nur nach Bestätigung anlegen erklären" text={UI_HELP["Nur nach Bestätigung anlegen"]}/></span>{analysis.taskProposal && <label className="check-row"><input type="checkbox" checked={createTask} onChange={(event) => setCreateTask(event.target.checked)}/><span><strong>Aufgabe anlegen</strong><small>{analysis.taskProposal}</small></span></label>}{analysis.deadlineProposal && <label className="check-row"><input type="checkbox" checked={createDeadline} onChange={(event) => setCreateDeadline(event.target.checked)}/><span><strong>Frist anlegen</strong><small>{fmtDate(analysis.deadlineProposal)}</small></span></label>}</section>}
    <div className="memory-review-summary"><strong>{analysis.openPoint ? "Offener Punkt erkannt" : "Kein offener Punkt erkannt"}</strong><span>{analysis.openPoint?.question || "Der Eintrag kann als abgeschlossenes Ereignis gespeichert werden."}</span><small>{analysis.sensitive ? "Gesundheitsbezug: Anzeige außerhalb des geschützten Bereichs wird datensparsam gehalten." : `Sicherheit der Einordnung: ${analysis.confidence}`}</small></div>
    <label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Ja, diesen Eintrag lokal speichern</strong><small>Erst dadurch entstehen Chronologie, Suche, Vorgangsbezug und gegebenenfalls bestätigte Aufgabe oder Frist.</small></span></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button className="button secondary" onClick={() => void onClose(confirmed ? "bereit_zum_speichern" : "unbehandelt")}>Zur Warteschlange</button><button className="button primary" disabled={busy} onClick={save}>{busy ? "Wird gespeichert …" : "Bestätigt speichern"}</button></div></section></div>;
}

function MemoryCompletionDialog({ result, onClose, onGo, onNext }: { result: MemoryCompletion; onClose: () => void; onGo: (id: SectionId, targetId?: string) => void; onNext: () => void }) {
  const complete = result.remaining === 0;
  return <div className="modal-backdrop" role="presentation"><section className="modal memory-completion" role="dialog" aria-modal="true" aria-labelledby="memory-completion-title"><div className="modal-head"><div><span className="eyebrow dark">{complete ? "Alle Memory-Ereignisse bearbeitet" : `${result.remaining} unbehandelte Ereignisse verbleiben`}</span><h2 id="memory-completion-title">✓ {complete ? "Alle Memory-Ereignisse bearbeitet" : "Memory-Ereignis bearbeitet und gespeichert"}</h2><p>{complete ? `${result.total} von ${result.total} Ereignissen geprüft und gespeichert.` : `„${result.title}“ wurde endgültig gespeichert. Die übrigen Entwürfe bleiben getrennt in der Warteschlange.`}</p></div><button className="icon-button" onClick={onClose} aria-label="Schließen"><X/></button></div>
    <div className="memory-completion-actions">{!complete && <button className="button primary" onClick={onNext}>Nächstes unbehandeltes Memory bearbeiten</button>}<button className="button secondary" onClick={onNext}>{complete ? "Chronologie anzeigen" : "Zur Übersicht der unbehandelten Ereignisse"}</button><button className="button secondary" onClick={() => onGo("overview")}>Zur Startseite</button>{complete && <button className="button secondary" onClick={() => onGo("memory", result.id)}>Tagesübersicht öffnen</button>}{complete && <button className="button primary" onClick={() => onGo("overview")}>Weitere Erinnerung erfassen</button>}</div>
  </section></div>;
}

const memoryStatusLabel: Record<MemoryOpenStatus, string> = { offen: "offen", wartet_auf_rückmeldung: "wartet auf Rückmeldung", weitere_beobachtung: "weiter beobachten", termin_ausstehend: "Termin ausstehend", teilweise_erledigt: "teilweise erledigt", erledigt: "erledigt", keine_weitere_erinnerung: "keine weitere Erinnerung", unklar: "unklar" };

function RelatedContextPanel({ sourceType, sourceId, documents, records, relations, onGo, onOpenDocument, onUnlink, onChange }: {
  sourceType: ContextSourceType; sourceId: string; documents: ContextDocument[]; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onGo: (id: SectionId, targetId?: string) => void; onOpenDocument: (id: string) => void | Promise<void>; onUnlink: (relationId: string) => void | Promise<void>;
  onChange: (sourceType: ContextSourceType, sourceId: string, previousRelationId: string | null, caseId: string) => void | Promise<void>;
}) {
  const related = buildRelatedContext(sourceId, { documents, records, relations });
  const caseRelation = relations.find((relation) => relation.fromId === sourceId && relation.fromType === sourceType && relation.toType === "case");
  const cases = records.filter((record) => record.recordType === "case");
  if (!related.length && !cases.length) return null;
  const openRelated = (item: ReturnType<typeof buildRelatedContext>[number]) => {
    if (item.sensitive) { onGo("health"); return; }
    if (item.type === "document") { void onOpenDocument(item.id); return; }
    if (item.type === "event") { onGo("memory", item.id); return; }
    if (item.type === "deadline" || item.type === "task" || item.type === "reminder") { onGo("reminders", item.id); return; }
    onGo("cockpit", item.id);
  };
  return <section className="related-context"><div className="card-heading"><div><span className="eyebrow dark">Gehört dazu</span><h3>Vorhandene Zusammenhänge</h3></div><span className="badge neutral">{related.length}</span></div>{related.length > 0 && <div className="related-context-list">{related.map((item) => <button key={`${item.type}-${item.id}`} onClick={() => openRelated(item)}><span className="badge neutral">{item.type === "case" ? "Vorgang" : item.type === "event" ? "Memory" : recordTypeDefinitions[item.type].label}</span><span><strong>{item.sensitive ? "Geschützter Eintrag" : item.label}</strong><small>{item.id}</small></span><ChevronRight size={16}/></button>)}</div>}<div className="context-link-controls"><label><span>Vorgangsbezug ändern</span><select value={caseRelation?.toId || ""} onChange={(event) => event.target.value && void onChange(sourceType, sourceId, caseRelation?.id || null, event.target.value)}><option value="">Kein Vorgang ausgewählt</option>{cases.map((record) => <option value={record.id} key={record.id}>{String((record.data as { title?: string }).title || record.id)}</option>)}</select></label>{caseRelation && <button className="text-link danger-link" onClick={() => void onUnlink(caseRelation.id)}>Verbindung lösen</button>}<small>Nur die Verbindung wird geändert oder gelöst. Die Datensätze selbst bleiben erhalten.</small></div></section>;
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
  const [showSummary, setShowSummary] = useState(false);
  const [draftDirection, setDraftDirection] = useState<"oldest" | "newest">("oldest");
  const selected = memories.find((item) => item.id === selectedId) || null;
  const selectedData = selected ? memoryData(selected) : null;
  const today = buildTodayMemorySummary(records);
  const orderedDrafts = sortMemoryDraftQueue(drafts, draftDirection);
  useEffect(() => { if (initialFocusId) setSelectedId(initialFocusId); }, [initialFocusId]);
  const changeOpenStatus = async (eventId: string, status: MemoryOpenStatus) => {
    if (!vaultHandle) { onGo("security"); return; }
    if (!await askConfirm(`Soll dieser offene Punkt wirklich auf „${memoryStatusLabel[status]}“ gesetzt werden?`)) return;
    try { await updateLocalMemoryOpenPointStatus(vaultHandle, eventId, status); await onRefresh(); onNotice({ kind: "success", text: "Der Memory-Status wurde nach deiner Bestätigung geändert und protokolliert." }); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Status konnte nicht geändert werden." }); }
  };
  const openMedia = async (eventId: string, mediaId: string) => {
    if (!vaultHandle) { onGo("security"); return; }
    try { const file = await readLocalMemoryMediaFile(vaultHandle, eventId, mediaId); openFile(file); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Das Medium konnte nicht geöffnet werden." }); }
  };
  const editSavedMemory = async () => {
    if (!vaultHandle || !selected || !selectedData) { onGo("security"); return; }
    const title = await askPrompt("Titel des Memory-Eintrags", selectedData.title);
    if (title === null) return;
    const originalText = await askPrompt("Gespeicherten Text ergänzen oder bearbeiten", selectedData.originalText);
    if (originalText === null) return;
    if (!await askConfirm("Diese Änderungen jetzt im gespeicherten Memory-Eintrag übernehmen?")) return;
    try { await updateLocalMemoryRecord(vaultHandle, selected.id, { title, originalText }); await onRefresh(); onNotice({ kind: "success", text: "Der gespeicherte Memory-Eintrag wurde aktualisiert und im Änderungsprotokoll vermerkt." }); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Memory-Eintrag konnte nicht bearbeitet werden." }); }
  };
  const deleteSavedMemory = async () => {
    if (!vaultHandle || !selected) { onGo("security"); return; }
    try {
      const impact = await getLocalMemoryDeleteImpact(vaultHandle, selected.id);
      if (!await askConfirm("Diesen gespeicherten Memory-Eintrag wirklich löschen? Gemeinsam verwendete Personen, Organisationen, Objekte, Vorgänge und Dokumente bleiben erhalten.")) return;
      let keepLinkedSchedules = true;
      if (impact.linkedScheduleCount) {
        const choice = await askPrompt(`${impact.linkedScheduleCount} verbundene Aufgabe(n) oder Frist(en) wurden gefunden. Bitte VERBLEIBEN, MITLÖSCHEN oder ABBRECHEN eingeben.`, "VERBLEIBEN");
        if (choice === null || choice.trim().toLocaleUpperCase("de") === "ABBRECHEN") return;
        if (!["VERBLEIBEN", "MITLÖSCHEN"].includes(choice.trim().toLocaleUpperCase("de"))) throw new Error("Bitte VERBLEIBEN, MITLÖSCHEN oder ABBRECHEN eingeben.");
        keepLinkedSchedules = choice.trim().toLocaleUpperCase("de") === "VERBLEIBEN";
      }
      await deleteLocalMemoryRecord(vaultHandle, selected.id, { keepLinkedSchedules });
      setSelectedId(null);
      await onRefresh();
      onNotice({ kind: "success", text: "Der Memory-Eintrag wurde nach Bestätigung gelöscht. Suche, Chronologie, Cockpit und offene Punkte wurden aus dem gemeinsamen Register aktualisiert." });
    } catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Memory-Eintrag konnte nicht gelöscht werden." }); }
  };
  return <><PageTitle icon={<BookHeart/>} title="Tagebuch & Erinnerungsprotokoll" text="Ereignisse, Beobachtungen, Fotos und offene Fragen – lokal gespeichert und mit vorhandenen Akten verknüpft."/>
    <MemoryCapturePanel initialDraft={null} queueCount={drafts.length} openPointCount={openPoints.length} onQueue={onQueue} onReview={onReview} onOpenQueue={() => document.getElementById("memory-draft-queue")?.scrollIntoView({ behavior: "smooth", block: "start" })} onGo={onGo} receipt={null}/>
    <section className="card memory-draft-queue" id="memory-draft-queue"><div className="card-heading"><div><span className="eyebrow dark">Temporäre Bearbeitungswarteschlange</span><span className="ui-heading-help"><h2>Unbehandelte Memory-Ereignisse</h2><InfoPopover label="Unbehandelte Memory-Ereignisse erklären" text={UI_HELP["Unbehandelte Memory-Ereignisse"]}/></span></div><div className="memory-queue-heading"><span className="badge neutral">{drafts.length}</span><button className="text-link" onClick={() => setDraftDirection((value) => value === "oldest" ? "newest" : "oldest")}>{draftDirection === "oldest" ? "Älteste zuerst" : "Neueste zuerst"}</button></div></div>
      {orderedDrafts.length ? <div className="memory-draft-list">{orderedDrafts.map((draft, index) => <article key={draft.id}><button className="memory-draft-main" onClick={() => void onOpenDraft(draft.id)}><span className="memory-draft-number">{index + 1}</span><span><small>Vorläufiger Titel</small><strong>{draft.provisionalTitle}</strong><em>{draft.originalText ? `${draft.originalText.slice(0, 150)}${draft.originalText.length > 150 ? "…" : ""}` : "Nur Medien ausgewählt"}</em><small>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.capturedAt))} · {draft.media.length} Medium{draft.media.length === 1 ? "" : "en"}</small></span><span className={`badge memory-draft-${draft.status}`}>{draft.status === "in_bearbeitung" ? "In Bearbeitung" : draft.status === "bereit_zum_speichern" ? "Bereit zum Speichern" : "Unbehandelt"}</span><ChevronRight/></button><div className="memory-draft-actions"><button className="text-link" onClick={() => void onOpenDraft(draft.id)}>Prüfen</button><button className="text-link" onClick={() => void onEditDraft(draft.id)}>Ergänzen</button><button className="text-link danger-link" onClick={() => void onDeleteDraft(draft.id)}>Entwurf löschen</button></div></article>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Keine unbehandelten Erinnerungen</strong><span>Neue Einträge können oben nacheinander erfasst werden.</span></div>}
    </section>
    <section className="memory-center-grid"><article className="card"><div className="card-heading"><div><h2>Heute im Überblick</h2><p>{fmtDate(today.date)} · {today.events.length} bestätigte Ereignisse · {drafts.length} noch zu prüfen</p></div><button className="button secondary compact-button" onClick={() => setShowSummary((value) => !value)}>{showSummary ? "Zusammenfassung schließen" : "Tag zusammenfassen"}</button></div>{showSummary && <div className="memory-day-summary">{today.events.length ? today.events.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)}><strong>{item.title}</strong><small>{item.eventAt.slice(11, 16)} Uhr</small></button>) : <p>Für heute ist noch kein bestätigtes Ereignis gespeichert.</p>}{drafts.length > 0 && <button onClick={() => document.getElementById("memory-draft-queue")?.scrollIntoView({ behavior: "smooth", block: "start" })}><strong>{drafts.length} Erinnerungen sind noch nicht geprüft</strong><small>Sie gehören noch nicht zur endgültigen Tageszusammenfassung.</small></button>}</div>}</article>
    <article className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Zwei getrennte Arbeitslisten</h2><InfoPopover label="Zwei getrennte Arbeitslisten erklären" text={UI_HELP["Zwei getrennte Arbeitslisten"]}/></span></div></div><div className="memory-counter-summary"><button onClick={() => document.getElementById("memory-draft-queue")?.scrollIntoView({ behavior: "smooth", block: "start" })}><strong>Unbehandelte Erinnerungen: {drafts.length}</strong><small>noch prüfen und endgültig speichern</small></button><button onClick={() => document.getElementById("memory-open-points")?.scrollIntoView({ behavior: "smooth", block: "start" })}><strong>Offene Memory-Fragen: {openPoints.length}</strong><small>gehören zu bereits gespeicherten Einträgen</small></button></div></article></section>
    <section className="card" id="memory-open-points"><div className="card-heading"><div><span className="ui-heading-help"><h2>Offene Memory-Punkte</h2><InfoPopover label="Offene Memory-Punkte erklären" text={UI_HELP["Offene Memory-Punkte"]}/></span></div><span className="badge neutral">{openPoints.length}</span></div>{openPoints.length ? <div className="memory-open-list">{openPoints.map((point) => <article key={point.eventId}><button onClick={() => point.sensitive ? onGo("health") : setSelectedId(point.eventId)}><span><strong>{point.title}</strong><small>{point.lifeArea} · {memoryStatusLabel[point.status]}</small><small>{point.sensitive ? "Einzelheiten im geschützten Gesundheitsbereich" : point.question}</small></span><ChevronRight/></button><div><button className="text-link" onClick={() => void changeOpenStatus(point.eventId, "erledigt")}>Als erledigt bestätigen</button><button className="text-link" onClick={() => void changeOpenStatus(point.eventId, "weitere_beobachtung")}>Weiter beobachten</button></div></article>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Keine offenen Memory-Punkte</strong><span>Abgeschlossene Ereignisse bleiben in der Chronologie erhalten.</span></div>}</section>
    <section className="memory-history"><article className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Chronologie</h2><InfoPopover label="Chronologie erklären" text={UI_HELP["Chronologie"]}/></span></div><span className="badge neutral">{memories.length}</span></div>{memories.length ? <div className="memory-event-list">{memories.map((record) => { const data = memoryData(record)!; return <button className={selectedId === record.id ? "active" : ""} key={record.id} onClick={() => data.sensitive ? onGo("health") : setSelectedId(record.id)}><span className="memory-event-icon">{data.media.some((item) => item.kind === "video") ? <Video/> : data.media.length ? <Camera/> : <BookHeart/>}</span><span><strong>{data.sensitive ? "Geschützter Gesundheitseintrag" : data.title}</strong><small>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.eventAt))} · {data.lifeArea}</small></span><ChevronRight/></button>; })}</div> : <div className="empty-state"><BookHeart size={32}/><strong>Noch keine Erinnerungen gespeichert</strong><span>Neue Einträge werden erst nach deiner Bestätigung angelegt.</span></div>}</article>
    <article className="card memory-detail">{selectedData && selected ? <><span className="eyebrow dark">{selected.id} · {selectedData.eventType}</span><h2>{selectedData.sensitive ? "Geschützter Gesundheitseintrag" : selectedData.title}</h2>{selectedData.sensitive ? <div className="protected-dossier"><ShieldCheck/><div><strong>Medizinische Einzelheiten bleiben geschützt</strong><p>Öffne den Gesundheitsbereich für diesen Inhalt.</p><button className="button secondary" onClick={() => onGo("health")}>Gesundheitsakte öffnen</button></div></div> : <><div className="memory-original"><strong>Originaltext</strong><p>{selectedData.originalText || "Kein Text hinterlegt"}</p></div><dl className="memory-meta"><div><dt>Lebensbereich</dt><dd>{selectedData.lifeArea}</dd></div><div><dt>Zeitpunkt</dt><dd>{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedData.eventAt))}</dd></div><div><dt>Einordnung</dt><dd>{selectedData.confidence}</dd></div></dl>{selectedData.media.length > 0 && <div className="memory-media-list"><h3>Lokale Medien</h3>{selectedData.media.map((item) => <button key={item.id} onClick={() => void openMedia(selected.id, item.id)}>{item.kind === "video" ? <Video/> : <Camera/>}<span><strong>{item.name}</strong><small>{fmtBytes(item.sizeBytes)} · lokal öffnen</small></span></button>)}</div>}{selectedData.openPoint && <div className="memory-review-summary"><strong>{memoryStatusLabel[selectedData.openPoint.status]}</strong><span>{selectedData.openPoint.question}</span><small>{selectedData.openPoint.reason}</small></div>}<RelatedContextPanel sourceType="event" sourceId={selected.id} documents={documents} records={records} relations={relations} onGo={onGo} onOpenDocument={onOpenDocument} onUnlink={onUnlink} onChange={onChange}/></>}<div className="memory-completion-actions"><button className="button secondary" onClick={() => void editSavedMemory()}>Memory bearbeiten</button><button className="button secondary danger-link" onClick={() => void deleteSavedMemory()}>Memory löschen</button></div></> : <div className="empty-state"><CircleHelp size={32}/><strong>Ein Ereignis auswählen</strong><span>Hier erscheinen Originaltext, Einordnung, Medien und offene Punkte.</span></div>}</article></section>
  </>;
}

function SearchPanel({ query, results, interpretation, onOpen }: {
  query: string;
  results: SearchResult[];
  interpretation: FamilySearchInterpretation;
  onOpen: (id: SectionId, targetId?: string) => void;
}) {
  return <><PageTitle icon={<Search/>} title={`Suche nach „${query}“`} text="Die Suche versteht häufige Alltagssätze und wertet sie nur innerhalb der Familienakte aus. Es werden dafür keine Daten an einen externen KI-Dienst gesendet."/>
    <section className="search-privacy"><ShieldCheck size={18}/><span><strong>Lokale interaktive Suche</strong> · berücksichtigt ähnliche Begriffe, Kategorien, Ärzte, Zeiträume, Diagnosen und Dokumentbeschreibungen.</span></section>
    {interpretation.labels.length > 0 && <section className="search-interpretation" aria-live="polite"><strong>Verstanden als:</strong><div>{interpretation.labels.map((label) => <span key={label}>{label}</span>)}</div></section>}
    <section className="card search-results">{results.length ? results.map((item) => <article key={item.id} className="search-result-with-context"><button onClick={() => onOpen(item.section, item.targetId)}><span className="badge neutral">{item.kind}</span><div><strong>{item.title}</strong><small>{item.detail}</small><em>{item.reason}</em></div><ChevronRight size={18}/></button>{item.contextCaseId && <button className="text-link context-open-link" onClick={() => onOpen("cockpit", item.contextCaseId)}>Zusammenhang öffnen <ChevronRight size={15}/></button>}</article>) : <div className="empty-state"><Search size={32}/><strong>Keine passende gespeicherte Angabe gefunden</strong><span>Versuche einen Namen, ein Jahr, einen ICD-Code oder einen allgemeineren Begriff. Die Familienakte erfindet keine Treffer.</span></div>}</section></>;
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
    <label><span>Vorhandenen Eintrag wählen</span><select value={value} onChange={(event) => { setter(event.target.value); if (event.target.value) newSetter(""); }}><option value="">Keine vorhandene Zuordnung</option>{optionsFor(type).map((record) => <option key={record.id} value={record.id}>{cockpitRecordLabel(record)} · {record.id}</option>)}</select></label>
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
      <div className="modal-head"><div><span className="eyebrow dark">Dokument ansehen</span><h2>{protectedTitle}</h2><p>{item.id}{sensitive ? " · Geschützter Speicherverweis" : ` · ${item.sourceRelativePath}`}</p></div><button className="icon-button" aria-label="Vorschau schließen" onClick={onClose}><X/></button></div>
      <dl className="inventory-preview-meta">
        <div><dt>Originaldatei</dt><dd>{sensitive ? "Geschützte Gesundheitsunterlage" : item.originalName}</dd></div><div><dt>Dokument-/Registernummer</dt><dd>{item.id}</dd></div>
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
  try { if (new URLSearchParams(window.location.search).get("experte") === "1") { localStorage.setItem("familienakte-experte", "1"); return true; } } catch { /* ohne Adresse */ }
  try { return localStorage.getItem("familienakte-experte") === "1"; } catch { return false; }
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
      const stored = window.localStorage.getItem(automaticTestFailureStorageKey) || window.localStorage.getItem(legacyAutomaticTestFailureStorageKey);
      if (stored) { setAutomaticTestFailure(JSON.parse(stored) as UiAutomatedTestFailureReport); setAutomaticTestFailureIsPrevious(true); }
      const storedDiagnostic = window.localStorage.getItem(storageDiagnosticStorageKey);
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
    try { window.localStorage.setItem(automaticTestFailureStorageKey, JSON.stringify(failure)); } catch { /* Bericht bleibt in dieser Sitzung sichtbar. */ }
  };
  const clearAutomaticTestFailure = () => {
    setAutomaticTestFailure(null);
    setAutomaticTestFailureIsPrevious(false);
    setAutomaticTestError("");
    setAutomaticTestFailureCopied(false);
    try { window.localStorage.removeItem(automaticTestFailureStorageKey); window.localStorage.removeItem(legacyAutomaticTestFailureStorageKey); } catch { /* Keine fachlichen Daten betroffen. */ }
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
    try { window.localStorage.removeItem(storageDiagnosticStorageKey); } catch { /* Keine fachlichen Daten betroffen. */ }
    try {
      const handle = developmentBase || await chooseDevelopmentBaseFolder();
      setDevelopmentBase(handle);
      const report = await runAutomatedStorageDiagnostic(handle);
      setStorageDiagnosticReport(report);
      try { window.localStorage.setItem(storageDiagnosticStorageKey, JSON.stringify(report)); } catch { /* Der Bericht bleibt in dieser Sitzung sichtbar. */ }
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
    <PageTitle icon={<FolderSearch/>} title="Bestand prüfen" text="Wähle einen großen Hauptordner aus. FaWoGa bezieht automatisch alle darin enthaltenen Unterordner und tiefer verschachtelten Dokumente ein."/>
    {expertenModus && <section className="card test-workspace-card">
      <div className="test-workspace-intro"><div className="test-workspace-icon"><FolderHeart/></div><div><span className="eyebrow">Private Testfassung 2.28.1</span><span className="ui-heading-help"><h2>Testakte für Weiterentwicklung</h2><InfoPopover label="Testakte für Weiterentwicklung erklären" text={UI_HELP["Testakte für Weiterentwicklung"]}/></span></div></div>
      <div className="test-workspace-actions"><button className="button primary automatic-test-action critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={busy || automaticTestBusy || storageDiagnosticBusy || automaticTestBlocked} onClick={() => void runAutomaticTestEnvironment()}><PackageCheck className={automaticTestBusy ? "spin" : ""}/> {automaticTestBusy ? "Testumgebung wird eingerichtet und geprüft …" : "Testumgebung automatisch einrichten und prüfen"}</button><button className="button primary diagnostic-test-action" disabled={busy || automaticTestBusy || storageDiagnosticBusy} onClick={() => void runStorageDiagnostic()}><ClipboardCheck className={storageDiagnosticBusy ? "spin" : ""}/> {storageDiagnosticBusy ? "Windows-Diagnose läuft …" : "Windows-Dateisystem diagnostizieren"}</button><button className="button primary" disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy} onClick={chooseAndInspectWorkspace}><FolderSearch/> Testakte für Weiterentwicklung</button><button className="button primary test-register-action critical-dependent" title={automaticTestBlocked ? "Durch kritischen Fehler gesperrt" : undefined} disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy || automaticTestBlocked} onClick={prepareTestRegister}><ListChecks/> {testRegisterBusy ? "Testregister wird vorbereitet …" : "Testregister vorbereiten"}</button>{sourceHandle && <button className="button secondary" disabled={busy || testWorkspaceBusy || testRegisterBusy || automaticTestBusy || storageDiagnosticBusy} onClick={() => { setTestWorkspaceOpen(true); void inspectWorkspace(sourceHandle); }}><RefreshCw className={testWorkspaceBusy ? "spin" : ""}/> {testWorkspaceBusy ? "Testakte wird geprüft …" : "Gespeicherte Testakte erneut prüfen"}</button>}</div>
      <small className="test-workspace-saved">{developmentBase ? <>Entwicklungsbasis: <strong>{developmentBase.name}</strong>. Der Browser prüft die Berechtigung bei jeder Verwendung erneut.</> : <>Beim ersten Klick bitte einmal den festen Ordner <strong>SOFTWARE TESTORDNER</strong> auswählen.</>}</small>
      <small className="test-workspace-saved">Der Diagnosemodus protokolliert technische Zielpfade und deren Länge, verwendet aber ausschließlich synthetische Testdaten. Persönliche Dokumentinhalte werden nicht protokolliert.</small>
      <section className="inventory-steps" aria-label="Bestandsprüfung in drei Schritten">
        <div><span className="eyebrow">1 · Quelle</span><h2>{sourceName || "Großen Hauptordner auswählen"}</h2><p>Alle Unterordner, weitere Unterordner und die darin verteilten Dateien werden automatisch mit durchsucht. Du musst nichts zusammensammeln.</p><button className={`button primary inventory-step-action${sourceName ? " step-complete" : ""}`} onClick={onSelectSource} disabled={busy}><Folder/> {sourceName ? "Anderen Hauptordner wählen" : "Hauptordner einschließlich Unterordner auswählen"}</button></div>
        <div><span className="eyebrow">2 · Analyse</span><span className="ui-heading-help"><h2>Inkrementell prüfen</h2><InfoPopover label="Inkrementell prüfen erklären" text={UI_HELP["Inkrementell prüfen"]}/></span><div className="button-row"><button className={`button primary inventory-step-action${analysisComplete ? " step-complete" : ""}`} onClick={onScan} disabled={busy || !vaultReady || !sourceName}><FolderSearch/> {busy ? "Analyse läuft …" : lastRun?.paused ? "Analyse fortsetzen" : "Bestand jetzt prüfen"}</button>{busy && <button className="button secondary" onClick={onPause}>Analyse pausieren</button>}</div>{!sourceName && <small className="form-guidance">Zuerst bei Schritt 1 den großen Hauptordner auswählen.</small>}{sourceName && !vaultReady && <small className="form-guidance">Der Hauptordner ist gewählt. Jetzt noch den Test-Datentresor über das Sicherheitscenter verbinden.</small>}</div>
        <div><span className="eyebrow">3 · Archiv</span><h2>{archiveName || "Archivdatenträger verbinden"}</h2><p>Kopien werden per Prüfsumme kontrolliert.</p><button className={`button primary inventory-step-action${archiveName ? " step-complete" : ""}`} onClick={onSelectArchive} disabled={busy}><HardDrive/> {archiveName ? "Archiv neu verbinden" : "Archivdatenträger auswählen"}</button></div>
      </section>
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

function HelpCenter({ onGo, onSearch }: { onGo: (id: SectionId) => void; onSearch: (value: string) => void }) {
  const examples = ["Schreiben der Krankenkasse zum Zuschuss", "Rechnung der Waschmaschine", "Mietvertrag Pustelblumenweg", "Impfpass und Vorsorge"];
  return <><PageTitle icon={<LifeBuoy/>} title="Hilfe" text="Kurze und verständliche Erklärungen zur Familienakte – ohne technische Fachsprache."/>
    <section className="help-start card"><div><span className="badge success">Erste Schritte</span><span className="ui-heading-help"><h2>Was möchtest du tun?</h2><InfoPopover label="Was möchtest du tun? erklären" text={UI_HELP["Was möchtest du tun?"]}/></span></div><div className="help-actions"><button onClick={() => onGo("documents")}><Archive/><span><strong>Dokumente finden</strong><small>Bibliothek durchsuchen und filtern</small></span></button><button onClick={() => onGo("inventory")}><FolderSearch/><span><strong>Bestand prüfen</strong><small>Testordner analysieren und bewerten</small></span></button><button onClick={() => onGo("inbox")}><Upload/><span><strong>Dokument ablegen</strong><small>lokal auf PC oder USB-Stick</small></span></button><button onClick={() => onGo("memory")}><BookHeart/><span><strong>Erinnerung festhalten</strong><small>diktieren, prüfen und lokal speichern</small></span></button><button onClick={() => onGo("security")}><HardDrive/><span><strong>Datentresor öffnen</strong><small>verbinden, prüfen oder sperren</small></span></button><button onClick={() => onGo("systemcheck")}><ShieldCheck/><span><strong>Systemprüfung</strong><small>prüfen, Bericht öffnen oder sicher reparieren</small></span></button><button onClick={() => onGo("changelog")}><History/><span><strong>Was gibt’s Neues?</strong><small>Neue Inhalte und wichtige Veränderungen</small></span></button></div></section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Wie suche ich etwas?</h2><InfoPopover label="Wie suche ich etwas? erklären" text={UI_HELP["Wie suche ich etwas?"]}/></span></div><span className="badge success">lokal</span></div><div className="search-examples">{examples.map((example) => <button key={example} onClick={() => onSearch(example)}><Search size={16}/>{example}</button>)}</div><p className="fine-print">Das Mikrofon schreibt Gesprochenes in das Suchfeld. Danach erkennt die Familienakte Themen wie Krankenkasse, Leistung, Schreiben, Ärzte, ICD-Codes, Aufgaben oder Fristen. Gesucht wird nur in bereits vorhandenen Angaben; PDF- oder Word-Inhalte werden nicht automatisch gelesen und es werden keine Treffer erfunden.</p></section>
    <section className="help-topics">
      <details><summary><ClipboardCheck/> Wie funktioniert die praktische Benutzerabnahme?</summary><div><p>Öffne Hilfe → Systemprüfung. Unter „Praktische Benutzerabnahme“ stehen drei Prüfblöcke mit je fünf Fragen. Wähle pro Frage Ja, Nein oder Nicht geprüft. Bei Nein kannst du eine kurze Fehlerbeobachtung eingeben. Alle fünf Antworten werden gemeinsam mit „Alle 5 Prüfergebnisse übermitteln“ bestätigt.</p><p>Mit „Ergebnisse speichern und Testphase unterbrechen“ bleibt der Block für später erhalten. Auch noch nicht abgesendete Antworten werden im vorhandenen Prüfbericht-Speicher dieses Browsers vorgemerkt. Beim nächsten Öffnen geht es dort weiter. Ein vorgemerktes Ja zählt erst nach dem Absenden als bestanden.</p><p>Gespeicherte Ja-Ergebnisse bleiben erledigt. Fehler und nicht geprüfte Punkte lassen sich einzeln wieder öffnen, ohne bestandene Nachbartests zurückzusetzen. Frühere Ergebnisse bleiben im Bericht nachvollziehbar. Auf anderen Geräten oder nach dem Löschen der Browserdaten sind diese lokalen Berichte nicht automatisch vorhanden.</p><p>Die Benutzerabnahme ist von der technischen Systemprüfung getrennt und erteilt keine Produktivfreigabe. Bestehende technische Nachweise, Lernsignale, Dokumente und Originaldateien bleiben unverändert.</p></div></details>
      <details><summary><Mic/> Wie nutze ich die gemeinsamen Eingabefelder?</summary><div><p>Zartgelbe Felder sind zum Schreiben oder Sprechen gedacht. Das Mikrofon ist schwarz, wenn es aus ist. Klicke darauf, um die Browserfreigabe zu erteilen. Rot und „Aufnahme läuft“ zeigen das aktive Diktat. Ein zweiter Klick beendet es. Tippen oder der Start eines anderen Mikrofons beendet das laufende Diktat ebenfalls.</p><p>Offline, ohne Browserunterstützung oder bei verweigertem Mikrofonzugriff kannst du jederzeit weiter tippen. Die Familienakte speichert keine Tonaufnahme und führt keinen zusätzlichen Sprachdienst ein. Die vorhandene Spracherkennung des Browsers kann je nach Browser eine Internetverbindung und Verarbeitung durch dessen Anbieter benötigen.</p></div></details>
      <details><summary><CircleHelp/> Hilfe zu Karten und Funktionen</summary><div>{Object.entries(UI_HELP).map(([title, text]) => <details key={title}><summary>{title}</summary><p>{text}</p></details>)}</div></details>
      <details><summary><ListChecks/> Was zeigen die zwei Aktivitätszeilen?</summary><div><p>Direkt unter der Suche stehen die letzten zwei tatsächlichen Rückmeldungen deiner laufenden Sitzung. Die neueste steht oben. Grün bedeutet erfolgreich, Rot fehlgeschlagen und Gelb noch zu prüfen. Ein geöffneter Dialog oder eine vorbereitete Datei bedeutet noch keine Speicherung.</p><p>„Copy“ kopiert nur den vollständigen Text der jeweiligen Zeile. „Kopiert“ bestätigt den Vorgang. Die beiden Schaltflächen arbeiten unabhängig und verändern keine Dokumente oder Prüfberichte. Nach einem vollständigen Neuladen sind die Zeilen wieder leer; die bestehenden Register und Prüfberichte bleiben erhalten. Gesundheitsbezogene Einzelheiten werden hier nicht offen angezeigt.</p></div></details>
      <details open><summary><Bot/> Wie arbeitet die Assistenz- und Korrespondenzzentrale?</summary><div><p>Die Assistenz verwendet die vorhandenen Vorgänge, Relationen, Dokumente, Personen, Organisationen, Aufgaben und Fristen. Sie führt keine zweite Datenbank und keine zweite Freigabelogik.</p><p>Jede Antwort trennt sichtbar zwischen <strong>Aus meiner Familienakte</strong>, <strong>Aktuell recherchiert</strong> und <strong>Einschätzung und Vorschlag</strong>. Eine aktuelle Internetrecherche ist in dieser privaten Testfassung noch nicht sicher eingerichtet und wird deshalb ausdrücklich als nicht verfügbar angezeigt.</p><p>Aktiv verwendet werden nur assistenzfreigegebene Dokumente oder Unterlagen, die ausdrücklich mit dem ausgewählten Vorgang verbunden sind. Schreiben und E-Mails bleiben Entwürfe, bis du Empfänger, Inhalt, Vorgang und Anlagen geprüft hast. Die Familienakte versendet niemals automatisch.</p><p>Mit „Als versendet speichern“ wird nur dokumentiert, was du außerhalb der Familienakte versendet hast. Der Eintrag wird im bestehenden Familienaktenregister gespeichert und mit vorhandenen Vorgängen und Dokumenten verknüpft.</p><button className="text-link" onClick={() => onGo("assistant")}>Assistenz öffnen</button></div></details>
      <details open><summary><FolderSearch/> Was ist „Bestand prüfen“?</summary><div><p>Du wählst selbst einen Test-, PC- oder lokalen OneDrive-Ordner aus. Die Familienakte liest nur diesen Ordner, bildet Prüfsummen und gruppiert wichtige Unterlagen, Prüfbedarf, mögliche Dubletten, geringe Relevanz und Fotoserien.</p><p>Mit <strong>„Ansehen“</strong> öffnest du vor der Zuordnung eine kompakte Vorschau. PDF-Dateien und Bilder werden direkt dargestellt; bei Text, Word und E-Mail erscheint soweit lesbar ein Textausschnitt. Mehrseitige PDF-Dateien lassen sich im Vorschaufenster durchblättern.</p><p>Vor einer Textanzeige prüft die Familienakte Zeichencodierung und Lesbarkeit. UTF-8, UTF-16 und Windows-1252 werden soweit möglich erkannt. Binärdaten, Hieroglyphen und offensichtlich falsch decodierte Inhalte werden nicht angezeigt. Stattdessen erscheint <strong>„Manuelle Prüfung erforderlich“</strong> mit der Möglichkeit, das unveränderte Original zu öffnen.</p><p>Person, Organisation, Objekt und Vorgang können aus bereits vorhandenen Familienakten-Einträgen gewählt werden. Eine freie Eingabe ist ebenfalls möglich, wird aber erst durch <strong>„Zuordnung bestätigen“</strong> angelegt. Vorher wird geprüft, ob ein gleichnamiger Eintrag bereits existiert. Kategorie, persönlicher Lebensbereich, Dokumentenart und wichtige Stichworte bleiben ebenfalls bis zur Bestätigung nur bearbeitbare Vorschläge.</p><p>Geschützte Gesundheitsinhalte werden in der allgemeinen Bestandsansicht nicht offen gezeigt. Ist keine Vorschau möglich, kannst du das erreichbare Original öffnen. Dabei wird die Originaldatei nicht verändert.</p><p><strong>Quelle analysiert</strong> bedeutet: nur erkannt und bewertet. <strong>Archiviert</strong> bedeutet: eine geprüfte Kopie liegt auf dem freigegebenen Archivdatenträger. <strong>Assistenz freigegeben</strong> bedeutet: Das Dokument darf zusätzlich in Bibliothek, Suche, Vorgängen und Familienassistent verwendet werden.</p><p>„Nicht übernehmen“ bedeutet niemals löschen. Originaldateien werden nicht verschoben, umbenannt, überschrieben oder entfernt. Sammelfreigaben benötigen deinen bewussten Klick.</p><button className="text-link" onClick={() => onGo("inventory")}>Bestand prüfen öffnen</button></div></details>
      <details open><summary><FolderHeart/> Was ist die „Testakte für Weiterentwicklung“?</summary><div><p>Mit „Testumgebung automatisch einrichten und prüfen“ wählst du einmal den festen Entwicklungsordner „SOFTWARE TESTORDNER“. Darin erzeugt die Familienakte ausschließlich im eindeutig gekennzeichneten Unterordner „Familienakte_Automatische_Testumgebung_2.28.1“ künstliche Testdokumente, ein vorhandenes Familienakten-Register, Sicherungen, eine Testwiederherstellung und einen Prüfbericht. Quelle und Testdatentresor bleiben getrennt.</p><p>Der Browser erlaubt keinen stillen Zugriff über den Windows-Pfad. Deshalb muss der Ordner beim ersten Mal bewusst ausgewählt werden; nach einem Browser- oder Laufwerkswechsel kann eine erneute Berechtigung nötig sein. Ungültige alte Verbindungen blockieren die neue Testumgebung nicht.</p><p>Scheitert eine notwendige Pflichtprüfung, zeigt ein rotes Feld deutlich Arbeitsschritt und Ursache. Nur die davon abhängigen Testaktionen werden grau gesperrt; Navigation, Hilfe und Systemprüfung bleiben verfügbar. „Allgemeinen technischen Fehlerbericht kopieren“ kopiert den Fehlerstatus der Testumgebung. „Windows-Diagnosebericht kopieren“ kopiert dagegen die fünf getrennten Dateisystemprüfungen einschließlich Pfad und technischer Ausnahme.</p><p>Die bisherigen manuellen Funktionen bleiben für gezielte Sonderprüfungen erhalten. „Testregister vorbereiten“ erzeugt weiterhin nur eine Vorschau. Erst „Testregister ausdrücklich übernehmen“ speichert neue Einträge als QUELLE_ANALYSIERT.</p><p>Ein kontrolliertes Zurücksetzen löscht ausschließlich den gekennzeichneten automatischen Testbereich und erzeugt ihn mit synthetischen Daten neu. FAMILIENAKTE_TESTBESTAND, andere Ordner, Originaldateien und die Produktivversion bleiben unverändert.</p><button className="text-link" onClick={() => onGo("inventory")}>Testakte öffnen</button></div></details>
      <details open><summary><Cloud/> Wie funktioniert die FaWoGa-OneDrive-Prüfung?</summary><div><p>FaWoGa ist die gemeinsame Bestands- und Zuordnungslogik der Familienakte. Du wählst unter <strong>Dokumente → Bestand prüfen</strong> nur den gewünschten großen Hauptordner aus. Die Familienakte durchsucht automatisch alle darin enthaltenen Unterordner, deren Unterordner und die dort verteilten Dateien. Du musst Dokumente nicht vorher in einem einzigen Ordner sammeln.</p><p>Andere OneDrive-Bereiche werden nicht durchsucht und es läuft keine Dauerüberwachung. Der ursprüngliche Unterordner und vollständige relative Herkunftspfad jedes Dokuments bleiben im Bestandsregister erhalten.</p><p>Beim ersten Lauf werden Dateien inventarisiert und soweit möglich inhaltlich ausgewertet. Spätere Läufe unterscheiden neue, unveränderte, geänderte, verschobene und nicht mehr erreichbare Dateien. Unveränderte Inhalte werden nicht unnötig erneut vollständig analysiert. Eine laufende Prüfung kann pausiert und später fortgesetzt werden.</p><p><strong>Prüfung erforderlich</strong> bedeutet, dass Bedeutung oder Zuordnung noch nicht sicher sind. <strong>Dublette</strong> bezeichnet eine möglicherweise bereits vorhandene gleiche Unterlage. Ähnliche Fassungen wie Nachtrag, Korrektur oder unterschriebene Version bleiben getrennt und werden miteinander verknüpft.</p><p>Kategorien, bestätigte persönliche Lebensbereiche, Personen, Organisationen, Objekte und Vorgänge stammen aus der bestehenden Familienakte. Sammelfreigaben gelten nur für sichere Gruppen. Originale bleiben unverändert. Erst <strong>ASSISTENZ_FREIGEGEBENE</strong> Unterlagen dürfen aktiv in Suche, Vorgängen und Familienassistent verwendet werden.</p><p>In der privaten Testfassung kannst du markierte, noch nicht fachlich verknüpfte Testdateien mit <strong>Auswahl zurücksetzen</strong> wieder auf „Quelle analysiert“ stellen. Dabei werden nur Testarchiv-Kopien und Assistenzfreigaben entfernt; Originaldateien bleiben erhalten.</p><button className="text-link" onClick={() => onGo("inventory")}>FaWoGa-OneDrive-Test öffnen</button></div></details>
      <details open><summary><Tags/> Wie lernt FaWoGa aus meinen Zuordnungen?</summary><div><p>Öffne bei einer analysierten Datei <strong>„Zuordnung prüfen und bestätigen“</strong>. Erst dein ausdrücklicher Klick auf „Zuordnung bestätigen“ speichert den Lebensbereich und die Dokumentenart als Lernhilfe im bestehenden Familienakten-Register.</p><p>Bei späteren ähnlichen Unterlagen berücksichtigt FaWoGa unter anderem Organisation, Absender, Dokumentenart, Begriffe, Vorgang, Objekt und Ordnerzusammenhang. Mindestens zwei passende bestätigte Entscheidungen sind nötig, bevor ein Lebensbereich bevorzugt vorgeschlagen wird. Eine einzelne Auswahl erzeugt keine starre Regel.</p><p>Ein gelernter Hinweis wird mit <strong>Sicher</strong>, <strong>Wahrscheinlich</strong> oder <strong>Unklar</strong> gekennzeichnet. Widerspricht der aktuelle Inhalt früheren Entscheidungen, bleibt die bestehende Einordnung erhalten und die Datei muss manuell geprüft werden. Persönliche Lebensbereiche werden genauso berücksichtigt.</p><button className="text-link" onClick={() => onGo("inventory")}>Lernfähige Zuordnung testen</button></div></details>
      <details open><summary><ShieldCheck/> Wie schützt Version 2.27.1 meine Daten?</summary><div><p>Das lokale Familienakten-Register bleibt der führende Datenbestand. Ist eine vorhandene Registerdatei beschädigt oder nicht lesbar, wird sie nicht durch eine leere Datei ersetzt. Der Schreibvorgang stoppt und die letzte gültige Sicherung bleibt erhalten.</p><p>Beim Speichern gilt: lesen, prüfen, sichern, vorläufig schreiben, erneut prüfen und erst danach ersetzen. Automatische Reparaturen dürfen weiterhin keine Dokumente, Gesundheitsdaten, Personen, Vorgänge, Aufgaben oder Fristen fachlich verändern.</p></div></details>
      <details open><summary><HardDrive/> Vollständige Sicherung und Wiederherstellung</summary><div><p>Eine Dokumentensicherung enthält nur ausgewählte Dateien. Die vollständige Familienakten-Sicherung enthält zusätzlich Register, Datensätze, Beziehungen, Memories, Entwürfe, offene Fragen, Aufgaben, Fristen, Medien, Protokolle und Speicherverweise.</p><p>Eine Sicherung gilt erst als geprüft, wenn sie in einen leeren Testordner wiederhergestellt und mit dem Sicherungsbericht verglichen wurde. Originaldateien im produktiven Tresor werden dabei nicht verändert.</p><button className="text-link" onClick={() => onGo("security")}>Sicherung im Sicherheitscenter öffnen</button></div></details>
      <details open><summary><HeartPulse/> Wie werden Gesundheitsangaben geschützt?</summary><div><p>Außerhalb der geschützten Gesundheitsakte zeigt die Familienakte für sensible Unterlagen nur neutrale Bezeichnungen. Diagnosen in Dateinamen, Suchtreffern, Vorschauen, Neuigkeiten, Cockpit und allgemeinen Chronologien werden dort nicht offen angezeigt.</p></div></details>
      <details><summary><Tags/> Einheitliche Kategorien und Verknüpfungen</summary><div><p>Alle Bereiche verwenden dieselben 18 Familienakten-Kategorien. Alte eindeutige Begriffe können als Suchhilfe dienen; mehrdeutige Altbezeichnungen werden nicht ungeprüft umgestellt.</p><p>Vorgang, Memory, Aufgabe und Frist bleiben einzelne Datensätze. Ihre Beziehungen sorgen dafür, dass zusammengehörende Angaben gemeinsam erscheinen, ohne Kopien anzulegen.</p></div></details>
      <details><summary><BookHeart/> Gespeicherte Memories bearbeiten oder löschen</summary><div><p>Ein gespeichertes Memory kann geöffnet, ergänzt, bearbeitet oder nach Bestätigung gelöscht werden. Beim Löschen werden gemeinsam verwendete Personen, Organisationen, Objekte, Vorgänge und Dokumente nicht entfernt. Bei verbundenen Aufgaben oder Fristen fragt die Familienakte, ob diese bestehen bleiben sollen.</p></div></details>
      <details><summary><Copy/> Ein Dokument an mehreren Speicherorten</summary><div><p>Liegt dieselbe Unterlage lokal, auf USB und in OneDrive, bleibt sie ein fachlicher Dokumentdatensatz mit mehreren Speicherverweisen. Prüfsumme und Herkunft helfen, unnötige Dokumentkopien im Register zu vermeiden.</p></div></details>
      <details><summary><CircleHelp/> Was bedeuten GRÜN, GELB und ROT?</summary><div><p><strong>GRÜN</strong> bedeutet: Alle Pflichtprüfungen wurden bestanden. <strong>GELB</strong> bedeutet: Es gibt eine nichtkritische Abweichung, die geprüft werden sollte. <strong>ROT</strong> bedeutet: Ein kritischer Daten-, Sicherungs-, Datenschutz- oder Relationsfehler verhindert die Freigabe.</p></div></details>
      <details open><summary><Search/> Wo finde ich Suche und Arbeitsaktionen?</summary><div><p>Die breite Suchleiste steht direkt unter dem Hauptmenü. Dort kannst du einen Suchbegriff schreiben oder über das Mikrofon diktieren. Auf der Startseite siehst du zuerst „Zuletzt wichtig“, danach den kompakten Dokumenteneingang, das Erinnerungsprotokoll und anschließend die Lebensbereiche. Später folgt der hellblaue Arbeitsbereich mit den ovalen Schaltflächen für Tresor, Abgleich, Aktualisierung und Änderungen mit ChatGPT.</p><p>Alle Schaltflächen haben einen dünnen blauen Rand. Zartgelb bedeutet „noch offen“, Hellgrün bedeutet „erfolgreich erledigt“ und Hellgrau bedeutet „beim letzten Versuch nicht möglich“. Auch graue und grüne Schaltflächen können jederzeit erneut betätigt werden.</p></div></details>
      <details open><summary><BookHeart/> Wie funktioniert Tagebuch & Erinnerungsprotokoll?</summary><div><p>Du kannst ein Ereignis frei schreiben oder diktieren und bis zu zwölf Fotos oder Videos auswählen. Vor dem Speichern trennt die Familienakte Tatsachen, Beobachtungen und persönliche Einschätzungen, schlägt einen vorhandenen Lebensbereich und passende bestehende Datensätze vor und stellt höchstens eine gezielte Rückfrage.</p><p>Der Originaltext bleibt unverändert erhalten. Unsichere Zuordnungen, Aufgaben und Fristen werden erst nach deiner Auswahl und ausdrücklichen Bestätigung gespeichert. Medien liegen ausschließlich im verbundenen lokalen OneDrive-, PC- oder USB-Tresor.</p><p>Offene Punkte erscheinen im Erinnerungsprotokoll und datensparsam im Cockpit. Gesundheitsbezüge zeigen außerhalb der geschützten Gesundheitsakte keine Diagnose oder vertrauliche Einzelheit. Die Strukturierung verwendet lokale, nachvollziehbare Regeln und keinen kostenpflichtigen API-Schlüssel.</p><button className="text-link" onClick={() => onGo("memory")}>Tagebuch & Erinnerungen öffnen</button></div></details>
      <details open><summary><Plus/> Mehrere Erinnerungen nacheinander erfassen</summary><div><p><strong>„Nächste Eingabe“</strong> legt die aktuelle Erinnerung zunächst als eigenen unbehandelten Entwurf in der lokalen Warteschlange ab. Das Eingabefeld wird danach frei für das nächste Ereignis. Text, Diktat, Fotos und Videos bleiben jeweils beim richtigen Entwurf.</p><p><strong>„Eintrag prüfen“</strong> sichert eine noch offene Eingabe ebenfalls und öffnet anschließend die unbehandelten Erinnerungen. Jeder Entwurf wird einzeln geprüft; mehrere Erlebnisse werden nicht vermischt oder automatisch zusammengeführt.</p><p><strong>„Bestätigt speichern“</strong> macht aus genau einem geprüften Entwurf einen endgültigen Memory-Eintrag. Erst dann werden Chronologie, Tagesübersicht, Suche, Vorgangsbezug und gegebenenfalls bestätigte Aufgaben oder Fristen aktualisiert.</p><p><strong>Unbehandelte Erinnerungen</strong> warten noch auf diese Prüfung. <strong>Offene Memory-Fragen</strong> gehören dagegen bereits zu endgültig gespeicherten Erinnerungen. Beide Listen und Zähler bleiben bewusst getrennt.</p><button className="text-link" onClick={() => onGo("memory")}>Bearbeitungswarteschlange öffnen</button></div></details>
      <details open><summary><ClipboardCheck/> Dokumente und Erinnerungen verbinden</summary><div><p>Ein <strong>Vorgang</strong> ist die gemeinsame Klammer für Dinge, die sachlich zusammengehören – zum Beispiel Telefonat, Termin, Handwerkerbesuch, Foto und Rechnung einer Reparatur.</p><p><strong>„Zusammenhang prüfen“</strong> bedeutet, dass die Familienakte einen bestehenden Vorgang gefunden hat, aber deine Entscheidung braucht. <strong>„Verknüpfen“</strong> stellt nur eine Beziehung her; Dokument und Erinnerung bleiben getrennte Originaldatensätze. <strong>„Nicht verknüpfen“</strong> merkt sich die Ablehnung, solange keine neuen wichtigen Angaben hinzukommen.</p><p>Eine falsche Verbindung kannst du unter <strong>„Gehört dazu“</strong> ändern oder lösen. Dabei werden weder Dokumente noch Memories, Vorgänge oder Originaldateien gelöscht. Offene Fragen und Teilabschlüsse werden nicht automatisch als erledigt behandelt.</p><button className="text-link" onClick={() => onGo("cockpit")}>Zusammenhänge im Cockpit prüfen</button></div></details>
      <details open><summary><Upload/> Wie benutze ich die Eingangszentrale?</summary><div><p>Öffne <strong>Dokumente → Eingangszentrale</strong>. Dort kannst du eine oder mehrere Dateien hineinziehen oder über „Datei auswählen“ öffnen. Du musst vorher nicht festlegen, ob es sich um PDF, Word, Foto, Scan, E-Mail oder einen anderen Dateityp handelt.</p><p>Jede Datei erscheint zunächst unter <strong>Eingänge prüfen</strong>. Die Familienakte erkennt den Dateityp, liest den Inhalt soweit technisch möglich, prüft Dubletten und sucht vorhandene Personen, Organisationen, Objekte, Vorgänge und Memory-Zusammenhänge. Unlesbare oder unbekannte Dateien werden nicht abgewiesen, sondern verständlich zur manuellen Prüfung gekennzeichnet.</p><p>Mehrere Bilder können als gemeinsames Scan-Dokument oder Fotoserie geprüft werden. Bei <strong>.eml</strong>-Dateien werden Absender, Empfänger, Betreff, Datum, Message-ID und erkennbare Anlagen erfasst. <strong>.msg</strong>-Dateien werden soweit der Export lesbar ist ausgewertet; andernfalls bleibt die Originaldatei zur manuellen Prüfung erhalten.</p><p>Eine mögliche Dublette wird nie automatisch kopiert oder zusammengeführt. „Mögliche Aufgabe“ und „Mögliche Frist“ sind nur Hinweise und werden erst nach deiner Bestätigung angelegt. Zurückgestellte Eingänge bleiben während der laufenden Arbeit in der Warteschlange.</p><p><strong>Assistenz freigegeben</strong> bedeutet, dass ein bereits archiviertes Dokument ausdrücklich für Suche, Zusammenhänge und Beratung freigegeben wurde. Nicht freigegebene Eingänge verwendet der Assistent nicht aktiv.</p><p>Lokale Ordner, OneDrive und E-Mail-Exporte werden ausschließlich nach deinem bewussten Befehl geprüft. Originaldateien werden nicht automatisch verschoben, umbenannt, überschrieben oder gelöscht.</p><button className="text-link" onClick={() => onGo("inbox")}>Eingangszentrale öffnen</button></div></details>
      <details open><summary><Camera/> Dokument fotografieren</summary><div><p>Tippe unter „Neue Dokumente erfassen“ auf „Dokument fotografieren“. Fotografiere die erste Seite und füge bei Bedarf weitere Seiten hinzu. Vor der PDF-Erstellung kannst du jede Seite öffnen, drehen, neu aufnehmen, entfernen, behutsam zuschneiden und in der Reihenfolge verschieben.</p><p>Wähle danach „Aufnahme prüfen“ und kontrolliere, ob die gesamte Seite sichtbar, der Text lesbar und die Reihenfolge richtig ist. Mit „Fertig – PDF erstellen“ werden alle Seiten zu genau einer PDF zusammengefügt. Erst anschließend öffnet sich die bekannte Dokumentenprüfung für Bereich, Datenschutz, vorhandenen Vorgang, Memory-Zusammenhang und mögliche Dubletten.</p><p>Die einzelnen Fotos sind bis dahin nur temporäre Scan-Seiten. Standardmäßig wird nur die PDF verwendet. Originalaufnahmen werden ausschließlich nach deiner bewussten Auswahl als Anlagen derselben PDF behalten und nie als eigene Dokumente registriert. Gesundheitsunterlagen bleiben im geschützten Gesundheitsbereich.</p></div></details>
      <details open><summary><Mic/> Wie funktioniert die interaktive Suche mit Mikrofon?</summary><div><p>Tippe einmal auf das Mikrofon und sprich in Ruhe. Das rote Mikrofon bleibt eingeschaltet, auch wenn du zwischendurch kurz nachdenkst oder eine Pause machst. Zum Beenden tippst du das rote Mikrofon noch einmal an. Sollte der Browser die Spracherkennung während einer Pause technisch unterbrechen, startet die Familienakte sie automatisch wieder.</p><p>Eine neue Spracheingabe ersetzt den vorherigen Suchsatz, damit alte und neue Begriffe nicht versehentlich vermischt werden. Die Familienakte erkennt häufige Themen wie Krankenkasse, Leistung, Schreiben, Ärzte, ICD-Codes, Aufgaben oder Fristen. Diese Auswertung läuft lokal und verwendet keinen kostenpflichtigen OpenAI-API-Schlüssel.</p></div></details>
      <details open><summary><BookOpen/> Was finde ich auf der Startseite und ganz unten?</summary><div><p>Oben zeigt das vergrößerte Objekt-Cockpit nur tatsächlich vorhandene Objekte, Vorgänge und nächste Schritte. Danach stehen „Zuletzt wichtig“, der gemeinsame Dokumenteneingang, das Erinnerungsprotokoll und die Lebensbereiche.</p><p>Die kleinen Info-Symbole öffnen kurze Erklärungen. Ein Klick oder Antippen außerhalb sowie die Escape-Taste schließen das Fenster wieder. Der lokale Aktenschrank wird nicht mehr als eigener Startseitenblock gezeigt; seine Funktionen bleiben im Sicherheitscenter erreichbar.</p><p>Im vereinfachten Systemstatus öffnest du direkt die vorhandene Systemprüfung. Die Funktion „Webseite bearbeiten“ bleibt an ihrer bisherigen Stelle unter Unterstützung erreichbar.</p></div></details>
      <details open><summary><ExternalLink/> Wie sind Menü- und Unterseiten aufgebaut?</summary><div><p>Auf jeder Unterseite stehen die wichtigsten und am häufigsten benötigten Aktionen zuerst. Anklickbare Titel, Karten und Beziehungen führen direkt zum passenden Dokument, Vorgang, Objekt, zur Person, Frist oder Aufgabe. Dabei werden die vorhandene Suche, Dokumentenbibliothek und das Cockpit gemeinsam verwendet.</p><p>Weiße Kästen mit der Kennzeichnung „Info“ enthalten nur notwendige Erklärungen und sehen bewusst nicht wie eine Schaltfläche aus. Medizinische Einzelheiten bleiben im geschützten Gesundheitsbereich. Die Startseite wurde bei dieser Optimierung nicht umgebaut.</p></div></details>
      <details open><summary><History/> Was zeigt „Was gibt’s Neues?“?</summary><div><p>Hier werden neue Dokumente, wichtige Vorgänge und Veränderungen der letzten Zeit übersichtlich angezeigt. Ein Klick auf einen Eintrag führt zum dazugehörigen Dokument, Vorgang oder Bereich.</p><p>„Zuletzt wichtig“ zeigt, was jetzt Aufmerksamkeit benötigt. „Was gibt’s Neues?“ zeigt dagegen, was neu aufgenommen oder verändert wurde. Die „Versionshistorie“ bleibt der vollständige technische Entwicklungsverlauf.</p><button className="text-link" onClick={() => onGo("changelog")}>Was gibt’s Neues? öffnen</button></div></details>
      <details open><summary><Archive/> Wie benutze ich die Dokumentenbibliothek?</summary><div><p>Unter „Dokumente“ findest du die neuesten vorhandenen Unterlagen und nur die Bereiche, in denen tatsächlich Dokumente gespeichert sind. „Alle ansehen“ öffnet die vollständige Ansicht. Dort kannst du nach Titel, Dateiname, Dokumentart, Person, Objekt, Vorgang, Nummer, Datum oder Beschreibung suchen und zusätzlich filtern oder sortieren.</p><p>Titel, Vorschau, Bereich, Datum und vorhandene Verknüpfungen sind anklickbar. Sie führen zum Dokument oder zum zugehörigen Personen-, Objekt-, Vorgangs-, Frist-, Vertrags- oder Garantiedatensatz. Gesundheitsunterlagen verwenden ein neutrales Symbol und öffnen den geschützten Gesundheitsbereich.</p><p>Cockpit, „Was gibt’s Neues?“, Vorgänge und Objektakten greifen auf dieselben Dokumentkennungen zu. Die Bibliothek speichert keine zweite Kopie und verändert keine Originaldatei.</p><button className="text-link" onClick={() => onGo("documents")}>Dokumentenbibliothek öffnen</button></div></details>
      <details open><summary><ClipboardCheck/> Wie benutze ich das Interaktive Cockpit?</summary><div><p>Das Cockpit verbindet vorhandene Aufgaben, Fristen, Vorgänge, Objektakten und neue Unterlagen zu einer gemeinsamen Arbeitsübersicht. Überfällige und heute fällige Punkte stehen zuerst. Erledigte Aufgaben verschwinden aus der aktiven Liste, bleiben aber in der Historie erhalten.</p><p>Statusänderungen und neue Notizen werden erst nach deiner Bestätigung gespeichert. Gesundheitsangaben erscheinen im allgemeinen Cockpit nur als datensparsame Hinweise; Diagnosen und medizinische Einzelheiten bleiben im geschützten Gesundheitsbereich.</p><p>„Neu hinzugekommen“ verwendet dieselben Ursprungsdatensätze wie „Was gibt’s Neues?“. Die ChatGPT-Hilfe bereitet nur einen Text mit vorhandenen Kennungen und Verknüpfungen vor; es wurde keine kostenpflichtige API eingebaut.</p><button className="text-link" onClick={() => onGo("cockpit")}>Interaktives Cockpit öffnen</button></div></details>
      <details open><summary><HelpCircle/> Was macht der lokale Datentresor?</summary><div><p>Du wählst selbst deinen lokal synchronisierten OneDrive-Ordner. Er wird zum primären Datentresor. Falls OneDrive nicht verbunden ist, kann die Familienakte ersatzweise einen PC- oder USB-Ordner verwenden. Neue Unterlagen werden direkt dorthin geschrieben und nicht über die Website hochgeladen.</p><button className="text-link" onClick={() => onGo("security")}>Datentresor verwalten</button></div></details>
      <details open><summary><Download/> Wie exportiere ich die Familienakte?</summary><div><p>Öffne „Sicherheit und Verwaltung“ und wähle „Familienakte exportieren“. Dort bestimmst du den lokalen Zielordner und welche Bereiche enthalten sein sollen. Originaldateien werden nur dann kopiert, wenn du einen lokalen Tresor freigegeben und die Option ausdrücklich eingeschaltet hast.</p><p>Vor dem Start wird angezeigt, dass die Familienakte selbst keine Verschlüsselung hinzufügt. Der Export legt einen neuen Ordner mit einer lesbaren Übersicht, einer maschinenlesbaren Datendatei und einem Exportbericht an. Ausgangsdateien werden nicht verändert.</p><button className="text-link" onClick={() => onGo("security")}>Export im Sicherheitscenter öffnen</button></div></details>
      <details open><summary><FileClock/> Wie verwalte ich Fristen und Erinnerungen?</summary><div><p>Öffne „Fristen und Aufgaben“. Dort kannst du eine Frist oder Aufgabe von Hand anlegen, ein Erinnerungsdatum ergänzen und vorhandene Personen-, Objekt-, Vorgangs- oder Dokumentkennungen verknüpfen. Erst dein bestätigter Speicherbefehl legt den Eintrag an.</p><p>Überfällige und bald fällige Punkte erscheinen auch unter „Zuletzt wichtig“. Erledigte oder zurückgestellte Einträge verschwinden aus den offenen Punkten. Jede Statusänderung wird im lokalen Register protokolliert.</p><button className="text-link" onClick={() => onGo("reminders")}>Fristen und Aufgaben öffnen</button></div></details>
      <details><summary><HelpCircle/> Was ist das gemeinsame Datenmodell?</summary><div><p>Es ist eine technische Grundlage im Hintergrund. Sie bereitet einheitliche Datensätze und spätere Verbindungen zwischen Personen, Objekten, Vorgängen, Dokumenten, Fristen und Aufgaben vor.</p><p>Die bestehende Oberfläche und deine bisherigen Unterlagen wurden dafür nicht umgeordnet. Auch automatische Dateianalyse, Fristenerkennung oder OneDrive-Sortierung sind dadurch noch nicht eingeschaltet.</p></div></details>
      <details open><summary><Archive/> Wie werden Dokumente zugeordnet?</summary><div><p>Die Zuordnungslogik v1 prüft neue Angaben immer in derselben Reihenfolge: Dokument, Person, Bereich, Unterbereich, Objekt, Vorgang, Organisation, Frist, Aufgabe und Speicherort.</p><p>Das Ergebnis ist zunächst nur ein Vorschlag. Vorhandene Personen, Objekte, Vorgänge und Organisationen werden über ihre Kennungen bevorzugt wiederverwendet. Bei mehreren möglichen Treffern musst du selbst auswählen; bei niedriger Sicherheit wird nichts übernommen.</p><p>Fristen, Aufgaben und ein möglicher OneDrive-Zielordner werden ebenfalls nur vorgeschlagen. Dateien werden nicht automatisch verschoben, kopiert, umbenannt oder gelöscht. Im Gesundheitsbereich werden nur Referenzen und notwendige Metadaten verwendet.</p></div></details>
      <details><summary><Archive/> Welches System ist künftig führend?</summary><div><p>Die bestehende „Me, Myself and I – Familienakte“ bleibt die einzige führende Benutzeroberfläche. Das vorbereitete Familienakte-/OneDrive-Cockpit wird nicht als zweites, konkurrierendes System weitergeführt.</p><p>Die Zuordnungslogik v1 wurde nun modular im Hintergrund ergänzt. Bestehende Strukturen werden weiterverwendet statt parallel neu angelegt.</p><p>Eine automatische OneDrive-Verarbeitung und automatische Dateiverschiebungen sind weiterhin nicht gestartet.</p></div></details>
      <details><summary><ShieldCheck/> Was prüft „Familienakte prüfen“?</summary><div><p>Die Systemprüfung kontrolliert nach einer neuen Version unter anderem Oberfläche, Datenzugriff, Gesundheitsakte, Datenmodell, Suche und Changelog. Jeder Prüf- und Reparaturlauf erhält unter „Hilfe → Systemprüfung → Prüfberichte“ einen eigenen Bericht. Frühere Berichte bleiben erhalten, der neueste steht oben.</p><p>Nach einer Prüfung darf die Familienakte nur sichere Prüf- und Berichtsdaten automatisch korrigieren. Vorher wird der bisherige Prüfzustand gesichert. Persönliche Daten, Gesundheitsdaten, Dokumente, Dateien, Verknüpfungen und Tresoreinstellungen bleiben unangetastet. Danach folgt immer eine vollständige Kontrollprüfung.</p><p>Bleiben offene Punkte bestehen und bringt ein weiterer Versuch keine Verbesserung, beendet die Familienakte die automatische Wiederholung und erklärt den notwendigen nächsten Schritt.</p><button className="text-link" onClick={() => onGo("systemcheck")}>Familienakte jetzt prüfen</button></div></details>
      <details><summary><ClipboardCheck/> Dauerhafte Entwicklungsregel</summary><div><p>Jede neue Erweiterung folgt künftig immer derselben Reihenfolge:</p><ol>{systemCheckManifest.developmentRule.map((step) => <li key={step}>{step}</li>)}</ol><p>Bestehende Prüfpunkte bleiben erhalten. Neue Funktionen erweitern den Prüfkatalog. Eine Version wird erst freigegeben, wenn kein kritischer Fehler festgestellt wurde.</p></div></details>
      <details><summary><HelpCircle/> Kann beim Verbinden etwas gelöscht werden?</summary><div><p>Nein. Beim Verbinden wird nur die Ordnerstruktur mit Register und Kennungsdatei angelegt. Auch „Tresor sperren“ löscht keine Dateien, sondern entfernt nur die gespeicherte Ordnerfreigabe aus diesem Browser.</p></div></details>
      <details><summary><HelpCircle/> Was bedeuten die Farben der Arbeitsknöpfe?</summary><div><p><b>Zartgelb</b> bedeutet: Die Aufgabe ist noch offen. <b>Hellgrün</b> bedeutet: Die Aufgabe wurde erfolgreich erledigt. <b>Hellgrau</b> bedeutet: Die Aufgabe konnte beim letzten Versuch nicht erledigt werden. Jeder Knopf bleibt weiterhin anklickbar.</p></div></details>
      <details><summary><Usb/> Wie sichere ich OneDrive auf PC oder USB?</summary><div><p>Verbinde zuerst den lokalen OneDrive-Ordner und danach einen PC- oder USB-Ordner. Öffne anschließend das Sicherheitscenter und wähle „Abgleich prüfen“. Die Familienakte zeigt dir zuerst, wie viele registrierte Dokumente noch fehlen. Erst mit „Fehlende Dateien jetzt sichern“ beginnt das Kopieren.</p><p>Der Abgleich läuft nur nach deinem Klick. Er kopiert ausschließlich fehlende Dateien von OneDrive zur Sicherung. Es wird nichts gelöscht und keine vorhandene Datei überschrieben.</p></div></details>
      <details><summary><HelpCircle/> Was funktioniert noch nicht vollständig?</summary><div><p>Die Zuordnungslogik v1, der vollständige Aktenexport, aktive Fristen und Erinnerungen sowie das Interaktive Cockpit sind jetzt als bestätigungspflichtige Funktionen umgesetzt. Eine automatische Dokumentenanalyse oder automatische Dateisortierung ist bewusst nicht aktiv.</p><p>Der kontrollierte OneDrive–PC/USB-Abgleich ist verfügbar, ein automatischer Hintergrundabgleich läuft jedoch nicht. Die vollständig portable Offline-Notfallversion gehört weiterhin zu einer späteren Ausbaustufe.</p></div></details>
      <details><summary><HelpCircle/> Wie werden persönliche Daten geschützt?</summary><div><p>Die Website ist privat angemeldet. Neue Originalunterlagen können lokal gespeichert werden. Passwörter und Einmalcodes werden nicht in der Familienakte gespeichert. Eine Übertragung an GPT erfolgt nicht automatisch.</p></div></details>
      <details><summary><Mic/> Wie benutze ich die Diktierfunktion?</summary><div><p>Tippe neben einem Eingabefeld auf das Mikrofon und erlaube beim ersten Mal den Mikrofonzugriff. Sprich anschließend auf Deutsch. Nach einer kurzen Pause wird der erkannte Text in das gewählte Feld übernommen. Ein leuchtendes Mikrofon zeigt an, dass die Spracheingabe läuft.</p><p>Die Familienakte speichert keine Tonaufnahme. Je nach Browser kann die Spracherkennung jedoch über den Dienst des Browseranbieters verarbeitet werden. Besonders vertrauliche Angaben kannst du deshalb weiterhin über die Tastatur eingeben.</p></div></details>
      <details><summary><HelpCircle/> Ich finde ein Dokument nicht</summary><div><ol><li>Gib oben einen Namen, ein Thema, einen ICD-Code oder ein Jahr ein.</li><li>Versuche einen allgemeineren Begriff, zum Beispiel „Rente“ statt eines vollständigen Dateinamens.</li><li>Öffne den Dokumenteneingang und prüfe lokale Unterlagen und Online-Altbestand getrennt.</li></ol></div></details>
    </section>
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
    const raw = localStorage.getItem(SYSTEM_CHECK_REPORTS_KEY);
    if (raw) {
      try { const entries = JSON.parse(raw) as StoredSystemCheck[]; if (!Array.isArray(entries) || entries.some((entry) => !normalizeSystemReport(entry))) throw new Error("invalid"); }
      catch { throw new Error("Die vorhandenen Prüfberichte sind nicht lesbar. Sie bleiben erhalten. Bitte den technischen Fehler zuerst prüfen lassen."); }
    }
    let updatedReports: SystemCheckReport[];
    try {
      updatedReports = saveSystemCheckReport(nextReport, false);
      const stored = JSON.parse(localStorage.getItem(SYSTEM_CHECK_REPORTS_KEY) || "[]") as SystemCheckReport[];
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
          "Erst Bestätigt speichern überführt genau einen Entwurf in die vorhandene Chronologie; unbehandelte Entwürfe und offene Memory-Fragen bleiben getrennt.",
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
        summary: contextLinkingReady ? "Dokumente, Memories und offene Punkte werden über vorhandene Vorgänge nachvollziehbar verbunden." : "Die Kontextverknüpfung oder mindestens ein praktischer Test ist unvollständig.",
        details: contextLinkingReady ? [
          "Dokumenteneingang, Memory, Relationsmodell, Suche, Cockpit und Vorgangschronologie werden gemeinsam wiederverwendet.",
          "Sichere, wahrscheinliche und unklare Vorschläge bleiben erklärbar; unsichere Verbindungen benötigen eine Benutzerentscheidung.",
          "Abgelehnte Vorschläge werden bei unverändertem Kontext nicht wiederholt; Verbindungen lassen sich lösen, ohne Datensätze zu löschen.",
          "Offene Memory-Punkte werden nur nach Bestätigung geschlossen. Teilabschlüsse bleiben offen und Gesundheitsdetails geschützt.",
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
      const successfulProbes = probeTerms.filter((term) => buildSearchResults(term, documents, localDocuments).length > 0).length;
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
        localStorage.setItem(probeKey, "bereit");
        localStorage.removeItem(probeKey);
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
      localStorage.setItem(SYSTEM_CHECK_STORAGE_KEY, JSON.stringify(repairedSource satisfies StoredSystemCheck));
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
  const periodLabels: Record<FamilyNewsPeriod, string> = { "7days": "Letzte 7 Tage", "30days": "Letzte 30 Tage", "60days": "Letzte 60 Tage", currentMonth: "Aktueller Monat", previousMonth: "Vorheriger Monat", custom: "Eigener Zeitraum" };
  return <><PageTitle icon={<History/>} title="Was gibt’s Neues in der Familienakte?" text="Neue Dokumente, wichtige Vorgänge und Veränderungen – aus dem vorhandenen gemeinsamen Datenmodell, neueste Einträge zuerst."/>
    <section className="card news-filter"><div><span className="eyebrow dark">Zeitraum</span><h2>{periodLabels[period]}</h2><p>Der Filter verändert keine Daten.</p></div><div className="news-filter-controls"><label><span>Anzeige</span><select value={period} onChange={(event) => setPeriod(event.target.value as FamilyNewsPeriod)}><option value="60days">Letzte 60 Tage</option><option value="7days">Letzte 7 Tage</option><option value="30days">Letzte 30 Tage</option><option value="currentMonth">Aktueller Monat</option><option value="previousMonth">Vorheriger Monat</option><option value="custom">Eigener Zeitraum</option></select></label>{period === "custom" && <><label><span>Von</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)}/></label><label><span>Bis</span><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)}/></label></>}</div></section>
    <section className="news-result-heading"><div><span className="eyebrow dark">Chronologische Übersicht</span><h2>{visibleItems.length} neue{visibleItems.length === 1 ? "r Eintrag" : " Einträge"}</h2></div><span className="badge neutral">neueste zuerst</span></section>
    {visibleItems.length ? <section className="news-list">{visibleItems.map((item) => { const open = () => { if (item.sensitive) return onGo("health"); if (item.sourceType === "version") return onGo("versions"); const target = targetForRelation(item.sourceType === "document" ? "document" : (records.find((record) => record.id === item.sourceId)?.recordType || "case"), item.sourceId); onGo(target.section as SectionId, target.targetId); }; return <article className="card news-item" key={item.id}><NewsPreview item={item} onOpen={open}/><div className="news-content"><time>{item.dateLabel}</time><span className="news-area">{item.area}</span><button className="news-title-link" onClick={open}>{item.title}</button><p>{item.summary}</p><small>{item.sensitive ? "Datenschutzgerechte Vorschau – Einzelheiten nur im geschützten Fachbereich." : `Quelle: ${item.sourceType === "version" ? "Versionshistorie" : item.sourceType === "document" ? "Dokumentenregister" : "gemeinsames Datenmodell"}`}</small></div><button className="news-open" onClick={open} aria-label={`${item.title} öffnen`}><ChevronRight/></button></article>; })}</section> : <section className="card empty-state news-empty"><History size={34}/><strong>In diesem Zeitraum gibt es keine neuen Einträge.</strong><span>Es werden keine künstlichen Beispielinhalte eingesetzt.</span></section>}
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Technische Änderungen</h2><InfoPopover label="Technische Änderungen erklären" text={UI_HELP["Technische Änderungen"]}/></span></div><button className="button secondary" onClick={() => onGo("versions")}><History size={17}/> Versionshistorie öffnen</button></section>
  </>;
}

function VersionHistory() {
  return <><PageTitle icon={<History/>} title="Versionshistorie" text="Der vollständige technische Entwicklungsverlauf. Die neuesten Versionen stehen oben."/>
    <section className="version-current card"><div><span>FAMILIENAKTE</span><strong>Version {APP_VERSION}</strong><small>Aktueller Stand: {APP_VERSION_DATE}</small></div><History size={42}/></section>
    <section className="changelog-list">{versionHistory.map((item) => <VersionCard item={item} key={item.version}/>)}</section>
  </>;
}

function InfoNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="info-notice"><span>Info</span><div><strong>{title}</strong><div>{children}</div></div></section>;
}

function SubpageActions({ actions, onGo, onDocuments }: {
  actions: MenuAction[];
  onGo: (id: SectionId, targetId?: string) => void;
  onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void;
}) {
  const open = (action: MenuAction) => {
    if (action.section === "documents") onDocuments({ area: action.area || "", query: action.query || "", focusId: action.targetId || null });
    else onGo(action.section as SectionId, action.targetId);
  };
  return <nav className="subpage-actions" aria-label="Wichtige Funktionen dieser Seite">{actions.map((action) => <button key={`${action.label}-${action.section}`} onClick={() => open(action)}><span><strong>{action.label}</strong><small>{action.detail}</small></span><ChevronRight/></button>)}</nav>;
}

function HealthHub({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void }) {
  return <><PageTitle icon={<HeartPulse/>} title="Gesundheit, Arbeit und Anträge" text="Der vollständige bisherige Gesundheitsbereich – jetzt als eigenes Fachmodul innerhalb der Familienakte."/>
    <SubpageActions actions={menuPageActions.health} onGo={onGo} onDocuments={onDocuments}/>
    <section className="area-grid">{portalAreas.map((area) => <button className="area-card" key={area.id} onClick={() => onGo(area.id as SectionId)}><div className="area-icon">{area.id === "assessment" ? <Users/> : area.id === "work" ? <Landmark/> : area.id === "benefits" ? <BriefcaseMedical/> : <HeartPulse/>}</div><div><span className="badge neutral">{area.count}</span><h3>{area.title}</h3><p>{area.text}</p></div><ChevronRight className="area-arrow"/></button>)}</section>
    <InfoNotice title="Regeln für die Gesundheitsakte"><p>Nur bestätigte Originalunterlagen übernehmen, chronologisch ordnen und Befund, eAU, betriebliche Krankmeldung sowie eigene Notiz klar voneinander unterscheiden.</p></InfoNotice>
  </>;
}

function FamilyArea({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void }) {
  const icons = [BookOpen, UserRound, Users, FileClock, Archive];
  const open = (action: MenuAction) => action.section === "documents" ? onDocuments({ area: action.area || "", query: action.query || "" }) : onGo(action.section as SectionId, action.targetId);
  return <><PageTitle icon={<Users/>} title="Familie und Personen" text="Vorbereitete Personen- und Familienakten. Namen und Inhalte werden erst aus bestätigten Unterlagen ergänzt."/>
    <InfoNotice title="Struktur vorbereitet – kein behaupteter Aktenbestand"><p>Personenbezogene Inhalte erscheinen erst, wenn sie aus bestätigten Unterlagen oder vorhandenen Datensätzen stammen.</p></InfoNotice>
    <section className="object-grid compact">{menuPageActions.family.map((action, index) => { const Icon = icons[index]; return <button className="object-card" key={action.label} onClick={() => open(action)}><div className="object-icon"><Icon/></div><span className="badge neutral">Öffnen</span><h3>{action.label}</h3><p>{action.detail}</p><span className="open-label">Anzeigen <ChevronRight size={16}/></span></button>; })}</section>
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Andere Lebensbereiche</h2><InfoPopover label="Andere Lebensbereiche erklären" text={UI_HELP["Andere Lebensbereiche"]}/></span></div><button className="button primary" onClick={() => onGo("directory")}>Gesamtes Verzeichnis</button></section>
  </>;
}

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

function PreparedArea({ kind, onUpload, onGo, onDocuments }: { kind: keyof typeof preparedContent; onUpload: () => void; onGo: (id: SectionId, targetId?: string) => void; onDocuments: (request?: Partial<Omit<DocumentLibraryRequest, "key">>) => void }) {
  const area = preparedContent[kind]; const Icon = area.icon;
  return <><PageTitle icon={<Icon/>} title={area.title} text={area.text}/>
    <InfoNotice title="Bereich für die schrittweise Befüllung vorbereitet"><p>Nicht vorhandene Inhalte werden nicht vermutet. Neue Originalunterlagen werden nur nach deinem bewussten Befehl abgelegt.</p></InfoNotice>
    <SubpageActions actions={menuPageActions[kind]} onGo={onGo} onDocuments={onDocuments}/>
    <section className="card action-row"><div><span className="ui-heading-help"><h2>Neue Unterlage</h2><InfoPopover label="Neue Unterlage erklären" text={UI_HELP["Neue Unterlage"]}/></span></div><button className="button primary" onClick={onUpload}><Plus size={17}/> Unterlage hinzufügen</button></section>
    <section className="topic-list">{area.items.map(([title, text], index) => <button key={title} onClick={() => onDocuments({ query: title, area: menuPageActions[kind][0]?.area || "" })}><span className="topic-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{text}</p></div><span className="badge neutral">Dokumente anzeigen</span><ChevronRight/></button>)}</section>
    <InfoNotice title="Angaben für eine verknüpfte Objektakte"><div className="field-chips"><span>Objekt / Person</span><span>Dokumentart</span><span>Datum</span><span>Frist / Termin</span><span>Garantie bis</span><span>Betrag</span><span>Status</span><span>Ereignisverlauf</span></div></InfoNotice>
  </>;
}

function Directory({ onGo }: { onGo: (id: SectionId) => void }) {
  return <><PageTitle icon={<BookOpen/>} title="Gesamtes Verzeichnis" text="Die vollständige Struktur der Familienakte – von den Hauptbereichen bis zu den vorbereiteten Unterthemen."/>
    <section className="directory-grid">{topNavigation.map((area) => <article className="directory-card" key={area.id}><button className="directory-title" onClick={() => onGo(area.landing)}><Folder/><span><strong>{area.label}</strong><small>Hauptbereich öffnen</small></span><ChevronRight/></button>{area.groups.map((group) => <div className="directory-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <button key={`${group.title}-${item.label}`} onClick={() => onGo(item.id)}><span>{item.label}</span><small>{item.detail}</small></button>)}</div>)}</article>)}</section>
  </>;
}

function DocumentLibraryAreaIcon({ area }: { area: string }) {
  if (area === "Gesundheit") return <HeartPulse aria-hidden="true"/>;
  if (["Fahrzeuge", "Motorrad"].includes(area)) return <Car aria-hidden="true"/>;
  if (area === "Haus & Wohnung") return <Home aria-hidden="true"/>;
  if (["Rechnungen & Garantien", "Technik & Geräte"].includes(area)) return <PackageCheck aria-hidden="true"/>;
  if (["Behörden", "Arbeit, Rente & Sozialversicherung"].includes(area)) return <Landmark aria-hidden="true"/>;
  if (["Versicherungen", "Finanzen", "Verträge"].includes(area)) return <ShieldCheck aria-hidden="true"/>;
  if (area === "Familie & persönliche Unterlagen") return <Users aria-hidden="true"/>;
  return <FileText aria-hidden="true"/>;
}

function DocumentLibraryCard({ item, fill, onFill, onWfpdf, onPro, onOpen, onArea, onType, onDate, onReference }: {
  item: DocumentLibraryItem;
  fill?: FillState;
  onFill?: () => void;
  onWfpdf?: () => void;
  onPro?: () => Promise<void>;
  onOpen: () => void;
  onArea: () => void;
  onType: () => void;
  onDate: () => void;
  onReference: (reference: DocumentLibraryReference) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return <article className={`library-document-card ${item.sensitive ? "sensitive" : ""}`}>
    <button className="library-preview" onClick={onOpen} aria-label={`${item.title} öffnen`}>
      {item.previewUrl && !imageFailed ? <img src={item.previewUrl} alt="" onError={() => setImageFailed(true)}/> : <DocumentLibraryAreaIcon area={item.area}/>}
      {item.protectedHealth && <span><LockKeyhole size={13}/> geschützt</span>}
    </button>
    <div className="library-document-copy">
      <div className="library-document-kicker"><button onClick={onArea}>{item.area}</button><button onClick={onType}>{item.documentType}</button></div>
      <button className="library-document-title" onClick={onOpen}>{item.title}</button>
      <div className="library-document-meta"><button onClick={onDate}>{item.date ? fmtDate(item.date) : "Ohne Dokumentdatum"}</button><button onClick={onOpen}>{statusLabel[item.status as keyof typeof statusLabel] || item.status}</button></div>
      <p>{item.description}</p>
      {onPro && <ProDokumentKnopf onUebernehmen={onPro}/>}
      {fill && (fill.marke || fill.fuellbar) && <div className="af-karte" data-af-karte>{fill.fuellbar && onWfpdf && !item.sensitive && <button type="button" className="button secondary compact-button" onClick={onWfpdf} data-wfpdf-oeffnen><FileText size={15}/> In Workflow PDF öffnen</button>}{fill.marke && <span className={`badge af-marke af-marke-${fill.stand}`} data-af-marke>{fill.marke}</span>}{fill.fuellbar && onFill && <button type="button" className="button secondary compact-button" onClick={onFill} data-af-oeffnen><PenLine size={15}/> Ausfüllen</button>}</div>}
      {item.references.length > 0 && <div className="library-reference-list" aria-label="Verknüpfte Datensätze">{item.references.slice(0, 4).map((reference) => <button key={`${reference.type}-${reference.id}`} onClick={() => onReference(reference)}><span>{recordTypeDefinitions[reference.type].label}</span><strong>{reference.label}</strong></button>)}</div>}
    </div>
    <button className="library-card-open" onClick={onOpen} aria-label={`${item.title} öffnen`}><ChevronRight/></button>
  </article>;
}

function DocumentLibrary({ documents, records, relations, initialFocusId, initialArea, initialQuery, fillStates, onFill, onWfpdf, onPro, proKandidaten, onOpenDocument, onGo, onUpload, onUnlink, onChange }: {
  documents: FamilyCockpitDocument[];
  fillStates: Record<string, FillState>;
  onFill: (id: string) => void;
  onWfpdf?: (id: string) => void;
  onPro?: (id: string) => Promise<void>;
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
  const [view, setView] = useState<"overview" | "all">(initialFocusId || initialArea || initialQuery ? "all" : "overview");
  const [query, setQuery] = useState(initialQuery);
  const [area, setArea] = useState(initialArea);
  const [documentType, setDocumentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<DocumentLibrarySort>("newest");
  const items = useMemo(() => buildDocumentLibraryItems(documents, records, relations), [documents, records, relations]);
  const areas = useMemo(() => [...new Set(items.map((item) => item.area))].sort((a, b) => a.localeCompare(b, "de")), [items]);
  const documentTypes = useMemo(() => [...new Set(items.map((item) => item.documentType))].sort((a, b) => a.localeCompare(b, "de")), [items]);
  const visible = useMemo(() => filterDocumentLibraryItems(items, { query, area, documentType, startDate, endDate, sort }), [items, query, area, documentType, startDate, endDate, sort]);
  const selected = initialFocusId ? items.find((item) => item.id === initialFocusId) || null : null;
  const grouped = useMemo(() => areas.map((name) => ({ name, items: filterDocumentLibraryItems(items, { area: name, sort: "newest" }) })).filter((group) => group.items.length), [areas, items]);
  const showAll = (next: Partial<{ area: string; documentType: string; startDate: string; endDate: string; query: string }> = {}) => {
    setArea(next.area ?? ""); setDocumentType(next.documentType ?? ""); setStartDate(next.startDate ?? ""); setEndDate(next.endDate ?? ""); setQuery(next.query ?? ""); setSort("newest"); setView("all"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openItem = (item: DocumentLibraryItem) => item.protectedHealth ? onGo("health") : void onOpenDocument(item.id);
  const openReference = (reference: DocumentLibraryReference) => onGo(reference.sensitive ? "health" : reference.section as SectionId, reference.id);
  const card = (item: DocumentLibraryItem) => <DocumentLibraryCard key={item.id} item={item} fill={fillStates[item.id]} onFill={() => onFill(item.id)} onWfpdf={onWfpdf ? () => onWfpdf(item.id) : undefined} onPro={onPro && proKandidaten?.has(item.id) ? () => onPro(item.id) : undefined} onOpen={() => openItem(item)} onArea={() => showAll({ area: item.area })} onType={() => showAll({ documentType: item.documentType })} onDate={() => item.date ? showAll({ startDate: item.date, endDate: item.date }) : openItem(item)} onReference={openReference}/>;
  return <><PageTitle icon={<Archive/>} title="Dokumentenbibliothek" text="Der zentrale Zugang zu deinen bereits vorhandenen Dokumenten – aus demselben Datenbestand wie Cockpit, Vorgänge und „Was gibt’s Neues?“."/>
    <section className="library-toolbar card"><label><span><Search size={17}/> Dokumente durchsuchen</span><div className="library-search"><Search size={18}/><input value={query} onChange={(event) => { setQuery(event.target.value); setView("all"); }} placeholder="Titel, Dateiname, Person, Vorgang, Aktenzeichen …"/><DictationButton value={query} onChange={(value) => { setQuery(value); setView("all"); }} label="Dokumentensuche" append={false}/>{query && <button onClick={() => setQuery("")} aria-label="Dokumentensuche löschen"><X size={16}/></button>}</div></label><div className="button-row"><button className="button secondary" onClick={() => showAll()}><Archive size={17}/> Alle ansehen</button><button className="button primary" onClick={onUpload}><Plus size={17}/> Neue Unterlage</button></div></section>
    <InfoNotice title="Datensparsame Dokumentvorschau"><p>Bei Gesundheits-, Behörden- und Finanzunterlagen werden keine lesbaren vertraulichen Miniaturen angezeigt. Gesundheitsdokumente öffnen den geschützten Gesundheitsbereich.</p></InfoNotice>
    {selected && <section className="library-selected"><div className="section-heading"><div><span className="eyebrow dark">Ausgewähltes Dokument</span><h2>Direkter Treffer</h2></div></div>{card(selected)}<section className="card"><RelatedContextPanel sourceType="document" sourceId={selected.id} documents={documents} records={records} relations={relations} onGo={onGo} onOpenDocument={onOpenDocument} onUnlink={onUnlink} onChange={onChange}/></section></section>}
    {view === "overview" ? <>
      <section className="section-heading"><div><span className="eyebrow dark">Zuletzt hinzugefügt oder bearbeitet</span><h2>Neueste Dokumente</h2></div><button className="text-link" onClick={() => showAll()}>Alle ansehen <ChevronRight size={17}/></button></section>
      {items.length ? <section className="library-document-grid">{filterDocumentLibraryItems(items, { sort: "newest" }).slice(0, 8).map(card)}</section> : <section className="card empty-state"><Archive size={34}/><strong>Noch keine erreichbaren Dokumente</strong><span>Verbinde den lokalen Datentresor oder füge eine neue Unterlage hinzu. Es werden keine Beispieldokumente erfunden.</span><button className="button primary" onClick={onUpload}><Plus size={17}/> Unterlage hinzufügen</button></section>}
      {grouped.length > 0 && <><section className="section-heading"><div><span className="eyebrow dark">Nur vorhandene Bestände</span><h2>Dokumentbereiche</h2></div></section><section className="library-area-grid">{grouped.map((group) => <button key={group.name} onClick={() => showAll({ area: group.name })}><DocumentLibraryAreaIcon area={group.name}/><span><strong>{group.name}</strong><small>{group.items.length} Dokument{group.items.length === 1 ? "" : "e"} · Alle ansehen</small></span><ChevronRight/></button>)}</section>{grouped.map((group) => <section className="library-area-section" key={`group-${group.name}`}><div className="section-heading"><div><span className="eyebrow dark">{group.name}</span><h2>Aktuelle Dokumente</h2></div><button className="text-link" onClick={() => showAll({ area: group.name })}>Alle ansehen <ChevronRight size={17}/></button></div><div className="library-document-grid compact">{group.items.slice(0, 3).map(card)}</div></section>)}</>}
    </> : <>
      <section className="card library-filters"><div className="card-heading"><div><span className="eyebrow dark">Vollständige Dokumentansicht</span><span className="ui-heading-help"><h2>Alle ansehen</h2><InfoPopover label="Alle ansehen erklären" text={UI_HELP["Alle ansehen"]}/></span></div><button className="text-link" onClick={() => { setView("overview"); setQuery(""); setArea(""); setDocumentType(""); setStartDate(""); setEndDate(""); }}>Zur Bibliotheksübersicht</button></div><div className="library-filter-grid"><label><span>Bereich</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="">Alle Bereiche</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Dokumentart</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="">Alle Dokumentarten</option>{documentTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Von</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label><label><span>Bis</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)}/></label><label><span>Sortierung</span><select value={sort} onChange={(event) => setSort(event.target.value as DocumentLibrarySort)}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="title">Titel A–Z</option><option value="area">Bereich</option><option value="updated">Zuletzt bearbeitet</option></select></label></div></section>
      <section className="news-result-heading"><div><span className="eyebrow dark">Gefilterter Bestand</span><h2>{visible.length} Dokument{visible.length === 1 ? "" : "e"}</h2></div><button className="badge neutral library-count-button" onClick={() => showAll()}>{visible.length} Datensätze anzeigen</button></section>
      {visible.length ? <section className="library-document-grid">{visible.map(card)}</section> : <section className="card empty-state"><Search size={34}/><strong>Keine passenden Dokumente gefunden</strong><span>Ändere Suche oder Filter. Die Bibliothek erfindet keine Treffer.</span><button className="button secondary" onClick={() => showAll()}>Filter zurücksetzen</button></section>}
    </>}
  </>;
}

function Inbox({ documents, localDocuments, loading, onUpload, onOpenDocument, onFill, onWfpdf, onRefresh, onStatus, onLocalStatus, busy, compact = false }: {
  onFill?: (id: string) => void;
  onWfpdf?: (id: string) => void;
  documents: UploadedDocument[]; localDocuments: LocalDocument[]; loading: boolean; compact?: boolean; onUpload: () => void; onOpenDocument: (id: string) => Promise<void>; onRefresh: () => void;
  onStatus: (id: string, status: UploadedDocument["status"]) => Promise<void>; onLocalStatus: (id: string, status: LocalDocument["status"]) => Promise<void>; busy: boolean;
}) {
  return <>
    {!compact && <PageTitle icon={<Upload/>} title="Eingangszentrale" text="Neue Unterlagen bleiben im lokalen Tresor auf deinem PC oder USB-Stick." />}
    <section className="card action-row"><div><h2>{compact ? "Übernommene Unterlagen" : "Neue Unterlage lokal hinzufügen"}</h2><p>{compact ? "Bereits bestätigte Eingänge erscheinen im gemeinsamen Dokumentregister." : "Die Originaldatei wird unverändert im gewählten Ordner gespeichert. Sie wird nicht an den Webserver übertragen."}</p></div><div className="button-row"><button className="button primary" onClick={onUpload}><Plus size={18}/> Einzelne Unterlage prüfen</button><button className="button secondary" onClick={onRefresh}><RefreshCw size={18}/> Neu laden</button></div></section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Lokale Unterlagen</h2><InfoPopover label="Lokale Unterlagen erklären" text={UI_HELP["Lokale Unterlagen"]}/></span></div><span className="badge success">{localDocuments.length} lokal</span></div>
      {localDocuments.length === 0 ? <div className="empty-state"><HardDrive size={34}/><strong>Noch keine lokale Unterlage</strong><span>Verbinde zuerst den lokalen Tresor im Sicherheitscenter.</span></div> : <div className="document-list">{localDocuments.map((item) => { const sensitive = isSensitiveHealthText(item.originalName, item.category, item.notes); return <article className="document-item" key={item.id}><div className="file-icon"><FileText size={22}/></div><div className="document-copy"><button className="document-title-link" onClick={() => void onOpenDocument(item.id)}>{visibleDocumentTitle(item)}</button><span>{sensitive ? "Geschützte Gesundheitsunterlage" : item.category} · {fmtDate(item.documentDate)} · {fmtBytes(item.sizeBytes)}</span>{sensitive ? <small>Speicherort und Einzelheiten sind nur im geschützten Gesundheitsbereich sichtbar.</small> : <><small>{istProOriginal(item.storedPath) ? "Gemeinsamer Pro-Tresor · Original verschlüsselt" : item.storedPath}</small>{item.notes && <small>{item.notes}</small>}</>}</div><span className={`badge status-${item.status}`}>{statusLabel[item.status]}</span>{!sensitive && ausfuellMarke(item) && <span className={`badge af-marke af-marke-${item.ausfuellen?.stand}`} data-af-marke>{ausfuellMarke(item)}</span>}<div className="document-actions">{onFill && fillStateOf(item).fuellbar && <button disabled={busy} onClick={() => onFill(item.id)} data-af-oeffnen>Ausfüllen</button>}{onWfpdf && !sensitive && fillStateOf(item).fuellbar && <button disabled={busy} onClick={() => onWfpdf(item.id)} data-wfpdf-oeffnen>In Workflow PDF öffnen</button>}{item.status === "hochgeladen" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "abgleich_offen")}>Abgleich vormerken</button>}{item.status === "abgleich_offen" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "geprüft")}>Als geprüft bestätigen</button>}{item.status === "geprüft" && <button disabled={busy} onClick={() => onLocalStatus(item.id, "eingearbeitet")}>Als eingearbeitet bestätigen</button>}</div></article>; })}</div>}
    </section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Online-Altbestand</h2><InfoPopover label="Online-Altbestand erklären" text={UI_HELP["Online-Altbestand"]}/></span></div><span className="badge warning">{documents.length} online</span></div>
      {loading ? <div className="empty-state">Unterlagen werden geladen …</div> : documents.length === 0 ? <div className="empty-state"><FolderHeart size={34}/><strong>Noch keine Unterlage über diese Seite hochgeladen</strong><span>Bereits vorhandene Aktenbestandteile findest du unter „Unterlagen“.</span></div> : <div className="document-list">{documents.map((item) => { const sensitive = isSensitiveHealthText(item.originalName, item.category, item.notes); return <article className="document-item" key={item.id}><div className="file-icon"><FileText size={22}/></div><div className="document-copy"><button className="document-title-link" onClick={() => void onOpenDocument(item.id)}>{visibleDocumentTitle(item)}</button><span>{sensitive ? "Geschützte Gesundheitsunterlage" : item.category} · {fmtDate(item.documentDate)} · {fmtBytes(item.sizeBytes)}</span>{!sensitive && item.notes && <small>{item.notes}</small>}</div><span className={`badge status-${item.status}`}>{statusLabel[item.status]}</span><div className="document-actions"><a className="icon-button" href={item.downloadUrl} title="Originaldatei herunterladen"><Download size={18}/></a>{item.status === "hochgeladen" && <button disabled={busy} onClick={() => onStatus(item.id, "abgleich_offen")}>Abgleich vormerken</button>}{item.status === "abgleich_offen" && <button disabled={busy} onClick={() => onStatus(item.id, "geprüft")}>Als geprüft bestätigen</button>}{item.status === "geprüft" && <button disabled={busy} onClick={() => onStatus(item.id, "eingearbeitet")}>Als eingearbeitet bestätigen</button>}</div></article>; })}</div>}
    </section>
    <section className="card caution"><ShieldCheck size={23}/><div><h3>Sicherer Ablauf</h3><p>„Abgleich offen“ ist nur ein Arbeitsstatus. Erst nach Prüfung der Originalunterlage darf „geprüft“ und anschließend „eingearbeitet“ gewählt werden. Die Website stellt keine Diagnose und entscheidet nicht über Leistung, Entgeltfortzahlung oder Rente.</p></div></section>
  </>;
}

function SecurityCenter({ aktenHandle, oneDriveConnected, oneDriveName, oneDriveSummary, localConnected, localVaultName, localVaultSummary, supported, onlineCount, localCount, busy, syncPreview, syncResult, onConnectOneDrive, onConnectLocal, onLockOneDrive, onLockLocal, onMigrate, onHelp, onCompare, onCheckSync, onRunSync, onExport, onFullBackup, onRestoreTest }: {
  aktenHandle: FileSystemDirectoryHandle | null;
  oneDriveConnected: boolean; oneDriveName: string; oneDriveSummary: VaultSummary | null; localConnected: boolean; localVaultName: string; localVaultSummary: VaultSummary | null; supported: boolean; onlineCount: number; localCount: number; busy: boolean;
  syncPreview: VaultSyncPreview | null; syncResult: VaultSyncResult | null;
  onConnectOneDrive: () => void; onConnectLocal: () => void; onLockOneDrive: () => void; onLockLocal: () => void; onMigrate: () => void; onHelp: () => void; onCompare: () => void; onCheckSync: () => void; onRunSync: () => void; onExport: () => void; onFullBackup: () => void; onRestoreTest: () => void;
}) {
  const activeStorage = oneDriveConnected ? "verbundenen OneDrive-Ordner" : "lokalen PC-/USB-Tresor";
  const vaultConnected = oneDriveConnected || localConnected;
  const connectedVaultLabel = oneDriveConnected
    ? (oneDriveName ? `OneDrive – ${oneDriveName}` : "OneDrive")
    : localConnected
      ? (localVaultName ? `PC/USB – ${localVaultName}` : "PC/USB")
      : "";
  return <><PageTitle icon={<ShieldCheck/>} title="Sicherheit und lokaler Tresor" text="Du wählst, wo neue Originalunterlagen abgelegt werden. Die Familienakte lädt sie nicht in den Webspeicher dieser Seite hoch."/>
    <ProTresorAnschluss aktenHandle={aktenHandle}/>
    <section className="security-grid security-grid-three">
      <article className="card security-card compact-security-card"><Cloud/><div><div className="security-card-heading"><h2>OneDrive-Ordner verbinden</h2><InfoPopover label="OneDrive-Verbindung erklären" text="Verbindet ausschließlich einen von dir gewählten, lokal synchronisierten OneDrive-Ordner. Die Familienakte erhält keinen Zugriff auf dein Microsoft-Passwort und durchsucht keine anderen OneDrive-Bereiche."/></div><span className={`badge ${oneDriveConnected ? "success" : "warning"}`}>{oneDriveConnected ? "verbunden" : "nicht verbunden"}</span><p>{oneDriveConnected ? oneDriveName : "Noch kein OneDrive-Ordner ausgewählt."}</p>{oneDriveSummary && <p className="vault-id"><strong>Tresor-Kennung:</strong> {oneDriveSummary.vaultId}</p>}<div className="button-row"><button className="button primary" disabled={!supported || busy} onClick={onConnectOneDrive}><Cloud size={17}/>{oneDriveConnected ? "Anderen OneDrive-Ordner wählen" : "OneDrive-Ordner verbinden"}</button>{oneDriveConnected && <button className="button secondary" disabled={busy} onClick={onLockOneDrive}><LockKeyhole size={17}/> Sperren</button>}</div>{!supported && <p className="form-error">Bitte diese Seite in Chrome oder Edge auf einem PC öffnen.</p>}</div></article>
      <article className="card security-card compact-security-card"><Usb/><div><div className="security-card-heading"><h2>PC-/USB-Ordner verbinden</h2><InfoPopover label="PC- oder USB-Verbindung erklären" text="Verbindet einen ausdrücklich ausgewählten PC-Ordner oder entsperrten USB-Datenträger. Dateien werden nur nach deinem Befehl gelesen oder als Sicherung kopiert; vorhandene Originale werden nicht überschrieben."/></div><span className={`badge ${localConnected ? "success" : "warning"}`}>{localConnected ? "verbunden" : "nicht verbunden"}</span><p>{localConnected ? localVaultName : "Noch kein PC-/USB-Ordner ausgewählt."}</p>{localVaultSummary && <p className="vault-id"><strong>Tresor-Kennung:</strong> {localVaultSummary.vaultId}</p>}<div className="button-row"><button className="button primary" disabled={!supported || busy} onClick={onConnectLocal}><Usb size={17}/>{localConnected ? "Anderen PC-/USB-Ordner wählen" : "PC-/USB-Ordner verbinden"}</button>{localConnected && <button className="button secondary" disabled={busy} onClick={onLockLocal}><LockKeyhole size={17}/> Sperren</button>}</div></div></article>
      <article className="card security-card compact-security-card security-compare-card"><ClipboardCheck/><div><div className="security-card-heading"><h2>Datentresor &amp; Abgleich</h2><InfoPopover label="Datentresor und Abgleich erklären" text="Zeigt den tatsächlich verbundenen Datentresor und startet die vorhandene FaWoGa-Bestandsanalyse. Der verbundene Ordner wird einschließlich Unterordnern geprüft; Originaldateien bleiben unverändert."/></div><span className={`badge ${vaultConnected ? "success" : "warning"}`}>{vaultConnected ? "Datentresor verbunden" : "Datentresor nicht verbunden"}</span><p>{vaultConnected ? connectedVaultLabel : "Verbinde zuerst einen Datentresor."}</p><div className="button-row">{vaultConnected ? <button className="button primary" disabled={!supported || busy} onClick={onCompare}><ClipboardCheck size={17}/> Jetzt Abgleich durchführen</button> : <button className="button primary" disabled={!supported || busy} onClick={onConnectLocal}><HardDrive size={17}/> Datentresor verbinden</button>}<button className="button secondary" onClick={onHelp}><HelpCircle size={17}/> Hilfe</button></div></div></article>
    </section>
    <section className="security-grid security-grid-two security-action-grid">
      <article className="card security-action-card"><div className="security-card-heading"><h2>Familienakte vollständig sichern und testen</h2><InfoPopover label="Vollständige Sicherung erklären" text="Erstellt nach deinem ausdrücklichen Befehl eine vollständige Sicherung von Register, Datensätzen, Verknüpfungen, Memories, Medien, Aufgaben, Fristen und freigegebenen Originaldateien. Die Wiederherstellung wird getrennt in einer leeren Testumgebung geprüft."/></div><div className="button-row"><button className="button primary" disabled={!supported || busy || (!oneDriveConnected && !localConnected)} onClick={onFullBackup}><Usb size={17}/> Vollständige Sicherung erstellen</button><button className="button primary" disabled={!supported || busy} onClick={onRestoreTest}><ClipboardCheck size={17}/> Wiederherstellung testen</button></div></article>
      <article className="card security-action-card"><div className="security-card-heading"><h2>Familienakte exportieren</h2><InfoPopover label="Export erklären" text="Bereitet die vorhandene Exportfunktion vor. Du wählst Bereiche und Zielordner bewusst aus und siehst vor dem Start Umfang, Originaldateien und Speicherstatus. Es wird kein Export vorgetäuscht oder automatisch gestartet."/></div><button className="button primary" disabled={!supported || busy} onClick={onExport}><Download size={17}/> Export vorbereiten</button></article>
    </section>
    <section className="card backup-sync"><div className="backup-sync-head"><div><span className="badge success">Neue Ausbaustufe</span><span className="ui-heading-help"><h2>OneDrive auf PC oder USB sichern</h2><InfoPopover label="OneDrive auf PC oder USB sichern erklären" text={UI_HELP["OneDrive auf PC oder USB sichern"]}/></span></div><ShieldCheck size={36}/></div>
      <div className="backup-steps"><span><b>1</b> Beide Ordner verbinden</span><span><b>2</b> Abgleich prüfen</span><span><b>3</b> Kopieren ausdrücklich bestätigen</span></div>
      <div className="button-row"><button className="button primary" disabled={!oneDriveConnected || !localConnected || busy} onClick={onCheckSync}>{busy ? "Prüfung läuft …" : "Abgleich prüfen"}</button>{syncPreview && syncPreview.missingDocuments > 0 && <button className="button secondary" disabled={busy} onClick={onRunSync}><Usb size={17}/> {syncPreview.missingDocuments} fehlende Datei{syncPreview.missingDocuments === 1 ? "" : "en"} jetzt sichern</button>}</div>
      {(!oneDriveConnected || !localConnected) && <p className="sync-message warning">Für den Abgleich müssen der OneDrive-Ordner und ein getrennter PC-/USB-Ordner verbunden sein.</p>}
      {syncPreview && <div className={`sync-message ${syncPreview.conflictingDocuments ? "error" : "success"}`}><strong>Prüfergebnis:</strong> {syncPreview.existingDocuments} bereits vorhanden, {syncPreview.missingDocuments} noch zu sichern{syncPreview.conflictingDocuments ? `, ${syncPreview.conflictingDocuments} widersprüchlich und deshalb nicht kopierbar` : ""}. Es wurde noch nichts verändert.</div>}
      {syncResult && <div className="sync-message success"><strong>Letzte Sicherung abgeschlossen:</strong> {syncResult.copiedDocuments} kopiert, {syncResult.skippedDocuments} bereits vorhanden. Zeitpunkt: {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(syncResult.completedAt))}.</div>}
      <p className="fine-print">Sicherheitsregel: Keine Datei wird gelöscht. Vorhandene Dateien werden nicht überschrieben. Bei widersprüchlichen Registereinträgen stoppt die Übernahme für diese Datei.</p>
    </section>
    <section className="card action-row"><div><h2>Online-Altbestand lokal sichern</h2><p>{onlineCount} bisher online gespeicherte Datei{onlineCount === 1 ? "" : "en"}; {localCount} Einträge befinden sich im aktiven Register. Ziel ist der {activeStorage}. Bei der Sicherung wird nichts online gelöscht.</p></div><button className="button primary" disabled={!(oneDriveConnected || localConnected) || busy || !onlineCount} onClick={onMigrate}>{busy ? "Sicherung läuft …" : "Online-Bestand lokal kopieren"}</button></section>
    <section className="card caution"><ShieldCheck size={23}/><div><h3>Wichtig vor dem Löschen</h3><p>Erst wenn du die lokalen Dateien auf dem PC oder USB-Stick geprüft hast, können die bisherigen Online-Kopien in einem zweiten Schritt gelöscht werden. Auch die derzeitige Gesundheitsübersicht der Website enthält noch personenbezogene Angaben und muss für eine vollständig lokale Lösung später ebenfalls in den Tresor verlagert werden.</p></div></section>
    <section className="card rules"><div><CheckCircle2/><span><strong>Ordnerfreigabe</strong><small>Der Browser sieht nur den Ordner, den du selbst auswählst.</small></span></div><div><CheckCircle2/><span><strong>USB-Verschlüsselung</strong><small>BitLocker oder VeraCrypt außerhalb der Website entsperren.</small></span></div><div><CheckCircle2/><span><strong>Lokales Register</strong><small>Familienakte_Register.json wird neben den Dokumenten gespeichert.</small></span></div><div><CheckCircle2/><span><strong>Keine automatische Cloud-Löschung</strong><small>Online-Dateien bleiben bis zu deiner ausdrücklichen Freigabe erhalten.</small></span></div></section>
  </>;
}

const cockpitRecordTypeLabel: Record<string, string> = {
  person: "Person", organisation: "Organisation", object: "Objekt", case: "Vorgang", document: "Dokument", deadline: "Frist", task: "Aufgabe", reminder: "Erinnerung", event: "Termin / Ereignis", payment: "Kosten", contract: "Vertrag", warranty: "Garantie",
};

function CockpitTodoRow({ item, onOpen, onStatus }: { item: CockpitTodoItem; onOpen: () => void; onStatus: (status: LocalScheduleStatus) => Promise<void> }) {
  const normalized = (["offen", "in_bearbeitung", "wartet_auf_antwort", "zurückgestellt", "erledigt"].includes(item.status) ? item.status : "offen") as LocalScheduleStatus;
  const [nextStatus, setNextStatus] = useState<LocalScheduleStatus>(normalized);
  const [busy, setBusy] = useState(false);
  const apply = async () => { if (nextStatus === normalized) return; setBusy(true); await onStatus(nextStatus); setBusy(false); };
  return <article className={`cockpit-todo urgency-${item.displayStatus === "overdue" ? "overdue" : item.dueAt && isDateToday(item.dueAt) ? "today" : item.displayStatus === "dueSoon" ? "dueSoon" : "open"}`}>
    <button className="cockpit-todo-main" onClick={onOpen}><span className={`priority-dot urgency-${item.displayStatus === "overdue" ? "overdue" : item.dueAt && isDateToday(item.dueAt) ? "today" : item.displayStatus === "dueSoon" ? "dueSoon" : "open"}`}/><span><strong>{item.title}</strong><small>{item.dueAt ? `Fällig: ${fmtDate(item.dueAt.slice(0, 10))}` : "Ohne Fälligkeitsdatum"} · Priorität {item.priority}</small><small>{item.references.length ? item.references.map((reference) => `${cockpitRecordTypeLabel[reference.type]} ${reference.id}`).join(" · ") : "Noch ohne weitere Zuordnung"}</small></span></button>
    <div className="cockpit-status-control"><label><span>Status</span><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as LocalScheduleStatus)}><option value="offen">offen</option><option value="in_bearbeitung">in Bearbeitung</option><option value="wartet_auf_antwort">wartet auf Antwort</option><option value="zurückgestellt">zurückgestellt</option><option value="erledigt">erledigt</option></select></label><button className="button secondary" disabled={busy || nextStatus === normalized} onClick={apply}>{busy ? "Wird gespeichert …" : "Status bestätigen"}</button></div>
  </article>;
}

function isDateToday(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function InteractiveCockpit({ documents, localDocuments, records, relations, decisions, initialFocusId, onGo, onOpenDocument, onFill, onTaskStatus, onAddNote, onSaveContact, onAssistant, onConfirmContext, onRejectContext, onAddMemoryToCase, onAddDocumentToCase }: {
  documents: UploadedDocument[];
  localDocuments: LocalDocument[];
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  decisions: ContextLinkDecision[];
  initialFocusId: string | null;
  onGo: (id: SectionId, targetId?: string) => void;
  onOpenDocument: (id: string) => Promise<void>;
  onFill: (id: string) => void;
  onTaskStatus: (id: string, status: LocalScheduleStatus) => Promise<void>;
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
  const snapshot = useMemo(() => buildFamilyCockpit(input), [input]);
  const contextInput = useMemo(() => ({ documents: contextDocuments(documents, localDocuments), records, relations, decisions }), [documents, localDocuments, records, relations, decisions]);
  const contextSuggestions = useMemo(() => buildContextLinkSuggestions(contextInput).filter((item) => !item.sensitive), [contextInput]);
  const [selectedId, setSelectedId] = useState<string | null>(initialFocusId);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const dossier = useMemo(() => selectedId ? buildCockpitDossier(input, selectedId) : null, [input, selectedId]);
  const caseTimeline = useMemo(() => dossier?.type === "case" ? buildCaseTimeline(dossier.id, contextInput) : [], [dossier, contextInput]);
  const caseOpen = useMemo(() => dossier?.type === "case" ? buildCaseOpenSummary(dossier.id, contextInput) : null, [dossier, contextInput]);
  const dossierGroups = useMemo(() => dossier ? dossierTypeOrder(dossier.type)
    .map((type) => ({ type, items: dossier.groups[type] || [] }))
    .filter((group) => group.items.length) : [], [dossier]);
  const focus = (id: string) => { setSelectedId(id); window.setTimeout(() => document.getElementById("cockpit-dossier")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); };
  const openReference = (reference: CockpitReference) => {
    if (reference.type === "document") { void onOpenDocument(reference.id); return; }
    if (reference.sensitive) { onGo("health"); return; }
    focus(reference.id);
  };
  const openPriority = (item: CockpitPriorityItem) => {
    if (item.sensitive) { onGo("health"); return; }
    if (item.sourceType === "document") { void onOpenDocument(item.sourceId); return; }
    focus(item.sourceId);
  };
  const saveNote = async () => {
    if (!dossier || !note.trim()) return;
    setSavingNote(true);
    if (await onAddNote(dossier.id, note)) setNote("");
    setSavingNote(false);
  };
  const counts = { urgent: snapshot.priorities.filter((item) => ["overdue", "today"].includes(item.urgency)).length, todos: snapshot.todos.length, cases: snapshot.cases.length, news: snapshot.relevantNews.length };
  return <><PageTitle icon={<ClipboardCheck/>} title="Interaktives Cockpit" text="Die zentrale Arbeitsübersicht zeigt nur tatsächlich vorhandene Aufgaben, Fristen, Vorgänge, Objekte und Unterlagen aus dem gemeinsamen Datenmodell."/>
    <section className="cockpit-summary" aria-label="Cockpit-Zusammenfassung"><button className="card" onClick={() => document.getElementById("cockpit-priorities")?.scrollIntoView({ behavior: "smooth" })}><small>Jetzt wichtig</small><strong>{counts.urgent}</strong><span>überfällig oder heute · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-todos")?.scrollIntoView({ behavior: "smooth" })}><small>Aktive To-dos</small><strong>{counts.todos}</strong><span>{snapshot.completedTaskCount} in der Historie erledigt · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-cases")?.scrollIntoView({ behavior: "smooth" })}><small>Offene Vorgänge</small><strong>{counts.cases}</strong><span>aus verknüpften Datensätzen · anzeigen</span></button><button className="card" onClick={() => document.getElementById("cockpit-news")?.scrollIntoView({ behavior: "smooth" })}><small>Neu hinzugekommen</small><strong>{counts.news}</strong><span>aktuell relevante Einträge · anzeigen</span></button></section>

    <section className="cockpit-layout">
      <article className="card cockpit-panel cockpit-priorities" id="cockpit-priorities"><div className="card-heading"><div><span className="eyebrow dark">Priorisiert</span><span className="ui-heading-help"><h2>Was ist jetzt wichtig?</h2><InfoPopover label="Was ist jetzt wichtig? erklären" text={UI_HELP["Was ist jetzt wichtig?"]}/></span></div><span className="badge neutral">{snapshot.priorities.length} Punkte</span></div>{snapshot.priorities.length ? <div className="cockpit-action-list">{snapshot.priorities.slice(0, 10).map((item) => <button key={item.id} onClick={() => openPriority(item)}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]} · {item.detail}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Nichts Dringendes offen</strong><span>Es werden keine Beispielaufgaben erzeugt.</span></div>}</article>
      {offeneAusfuellungen(localDocuments).length > 0 && <article className="card cockpit-panel" id="cockpit-ausfuellen" data-cockpit-ausfuellen><div className="card-heading"><div><span className="eyebrow dark">Formulare</span><span className="ui-heading-help"><h2>Muss noch ausgefüllt werden</h2><InfoPopover label="Muss noch ausgefüllt werden erklären" text="Unterlagen, die beim Ausfüllen als „Später ausfüllen“ vorgemerkt wurden. Die Felder sind gemerkt; ein Klick öffnet das Ausfüllen."/></span></div><span className="badge neutral">{offeneAusfuellungen(localDocuments).length}</span></div><div className="cockpit-action-list">{offeneAusfuellungen(localDocuments).map((item) => <button key={item.id} onClick={() => onFill(item.id)}><span className="priority-dot urgency-attention"/><span><strong>{visibleDocumentTitle(item)}</strong><small>{item.category} · vorgemerkt {fmtDate((item.ausfuellen?.geaendertAm || "").slice(0, 10) || null)}</small></span><ChevronRight/></button>)}</div></article>}

      <article className="card cockpit-panel" id="cockpit-todos"><div className="card-heading"><div><span className="eyebrow dark">Aktuelle Arbeit</span><span className="ui-heading-help"><h2>To-do-Liste</h2><InfoPopover label="To-do-Liste erklären" text={UI_HELP["To-do-Liste"]}/></span></div><button className="text-link" onClick={() => onGo("reminders")}>Alle Fristen und Aufgaben</button></div>{snapshot.todos.length ? <div className="cockpit-todo-list">{snapshot.todos.slice(0, 6).map((item) => <CockpitTodoRow key={`${item.id}-${item.status}`} item={item} onOpen={() => item.sensitive ? onGo("health") : focus(item.id)} onStatus={(status) => onTaskStatus(item.id, status)}/>)}</div> : <div className="empty-state compact-empty"><CheckCircle2 size={28}/><strong>Keine aktive Aufgabe</strong><span>Erledigte und zurückgestellte Aufgaben bleiben in der Historie erhalten.</span></div>}</article>
    </section>

    {contextSuggestions.length > 0 && <section className="card context-review-list" id="context-review"><div className="card-heading"><div><span className="eyebrow dark">Mögliche Zusammenhänge prüfen</span><span className="ui-heading-help"><h2>Dokumente, Memories und Vorgänge</h2><InfoPopover label="Dokumente, Memories und Vorgänge erklären" text={UI_HELP["Dokumente, Memories und Vorgänge"]}/></span></div><span className="badge warning">{contextSuggestions.length}</span></div>{contextSuggestions.slice(0, 6).map((suggestion) => <article key={suggestion.id}><div><span className="badge neutral">{suggestion.confidence}</span><strong>{suggestion.sourceLabel}</strong><small>Wahrscheinlich zugehörig: {suggestion.caseLabel}</small><details><summary>Warum diese Zuordnung?</summary><ul>{suggestion.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div><div className="button-row"><button className="button primary" onClick={() => void onConfirmContext(suggestion.sourceType, suggestion.sourceId, suggestion.caseId, suggestion.reasons.join(", "))}>Verknüpfen</button><button className="button secondary" onClick={() => focus(suggestion.caseId)}>Vorgang öffnen</button><button className="button secondary" onClick={() => void onRejectContext(suggestion)}>Nicht verknüpfen</button></div></article>)}</section>}

    <section className="section-heading"><div><span className="eyebrow dark">Zusammenhänge</span><h2>Offene Vorgänge und Objektakten</h2></div><button className="text-link" onClick={() => onGo("directory")}>Gesamtes Verzeichnis</button></section>
    <section className="cockpit-context-grid">
      <article className="card cockpit-panel" id="cockpit-cases"><div className="card-heading"><div><span className="ui-heading-help"><h2>Offene Vorgänge</h2><InfoPopover label="Offene Vorgänge erklären" text={UI_HELP["Offene Vorgänge"]}/></span></div><span className="badge neutral">{snapshot.cases.length}</span></div>{snapshot.cases.length ? <div className="cockpit-case-list">{snapshot.cases.slice(0, 6).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : focus(item.id)}><span><strong>{item.title}</strong><small>Status: {item.status} · zuletzt {new Intl.DateTimeFormat("de-DE").format(new Date(item.updatedAt))}</small><small>{item.nextTask ? `Nächste Aufgabe: ${item.nextTask.title}` : item.nextDeadline ? `Nächste Frist: ${item.nextDeadline.title}` : "Keine nächste Aufgabe oder Frist gespeichert"}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><Folder size={28}/><strong>Keine offenen Vorgänge gespeichert</strong><span>Es wird kein Aktenbestand vermutet.</span></div>}</article>
      <article className="card cockpit-panel"><div className="card-heading"><div><span className="ui-heading-help"><h2>Objektakten</h2><InfoPopover label="Objektakten erklären" text={UI_HELP["Objektakten"]}/></span></div><span className="badge neutral">{snapshot.objects.length}</span></div>{snapshot.objects.length ? <div className="cockpit-object-list">{snapshot.objects.slice(0, 6).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : focus(item.id)}><span><strong>{item.title}</strong><small>{item.objectType} · {item.caseCount} Vorgänge · {item.documentCount} Dokumente</small><small>{item.taskCount} Aufgaben · {item.deadlineCount} Fristen · {item.costCount} Kosten · {item.warrantyCount} Garantien</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><Archive size={28}/><strong>Noch keine Objektakte angelegt</strong><span>Vorbereitete Lebensbereiche bleiben weiterhin erreichbar.</span></div>}</article>
    </section>

    <section className="cockpit-context-grid">
      <article className="card cockpit-panel"><div className="card-heading"><div><span className="eyebrow dark">Erinnerungsprotokoll</span><span className="ui-heading-help"><h2>Offene Memory-Punkte</h2><InfoPopover label="Offene Memory-Punkte erklären" text={UI_HELP["Offene Memory-Punkte"]}/></span></div><button className="text-link" onClick={() => onGo("memory")}>Alle Erinnerungen</button></div>{snapshot.memoryOpenPoints.length ? <div className="cockpit-news-list">{snapshot.memoryOpenPoints.slice(0, 5).map((item) => <button key={item.id} onClick={() => onGo(item.sensitive ? "health" : "memory", item.sourceId)}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><BookHeart size={28}/><strong>Keine offenen Memory-Punkte</strong><span>Neue bestätigte Erinnerungspunkte erscheinen hier automatisch.</span></div>}</article>
      <article className="card cockpit-panel" id="cockpit-news"><div className="card-heading"><div><span className="eyebrow dark">Wiederverwendete Abfrage</span><span className="ui-heading-help"><h2>Neu hinzugekommen</h2><InfoPopover label="Neu hinzugekommen erklären" text={UI_HELP["Neu hinzugekommen"]}/></span></div><button className="text-link" onClick={() => onGo("changelog")}>Alle Neuigkeiten anzeigen</button></div>{snapshot.relevantNews.length ? <div className="cockpit-news-list">{snapshot.relevantNews.slice(0, 5).map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : item.sourceType === "document" ? void onOpenDocument(item.sourceId) : focus(item.sourceId)}><span className="badge neutral">{item.area}</span><span><strong>{item.sensitive ? "Neuer geschützter Eintrag" : item.title}</strong><small>{item.dateLabel} · {item.sensitive ? "Einzelheiten nur im geschützten Fachbereich" : item.summary}</small></span><ChevronRight/></button>)}</div> : <div className="empty-state compact-empty"><History size={28}/><strong>Keine aktuell relevanten neuen Einträge</strong><span>Die vollständige chronologische Übersicht bleibt unter „Was gibt’s Neues?“ erhalten.</span></div>}</article>
      <article className="card cockpit-panel protected-health-card"><div><ShieldCheck size={34}/><span><span className="eyebrow dark">Geschützter Fachbereich</span><h2>Gesundheit und Leistung</h2><p>{snapshot.healthNotices.length ? `${snapshot.healthNotices.length} datensparsame Hinweise benötigen möglicherweise Aufmerksamkeit.` : "Derzeit kein datensparsamer Gesundheitshinweis aus dem gemeinsamen Modell."}</p></span></div><ul>{snapshot.healthNotices.slice(0, 3).map((item) => <li key={item.id}><span className={`priority-dot urgency-${item.urgency}`}/><span><strong>{item.title}</strong><small>{cockpitUrgencyLabel[item.urgency]}</small></span></li>)}</ul><button className="button secondary" onClick={() => onGo("health")}>Geschützten Gesundheitsbereich öffnen</button><small>Diagnosen und medizinische Einzelheiten werden im allgemeinen Cockpit nicht angezeigt.</small></article>
    </section>

    {dossier && <section className={`card cockpit-dossier ${dossier.sensitive ? "sensitive" : ""}`} id="cockpit-dossier"><div className="card-heading"><div><span className="eyebrow dark">{cockpitRecordTypeLabel[dossier.type]} · {dossier.id}</span><h2>{dossier.title}</h2><p>Status: {dossier.status}{dossier.updatedAt ? ` · zuletzt geändert ${new Intl.DateTimeFormat("de-DE").format(new Date(dossier.updatedAt))}` : ""}</p></div><button className="icon-button" onClick={() => setSelectedId(null)} aria-label="Detailansicht schließen"><X/></button></div>{dossier.sensitive ? <div className="protected-dossier"><ShieldCheck/><div><strong>Vertrauliche Einzelheiten bleiben geschützt</strong><p>Im Cockpit werden nur Kennung, Status und die Anzahl vorhandener Verknüpfungen gezeigt.</p><button className="button secondary" onClick={() => onGo("health")}>Gesundheitsakte öffnen</button></div></div> : <><div className="dossier-meta"><div><small>Quelle</small><strong>{dossier.source || "nicht angegeben"}</strong></div><div><small>Speicherverweis</small><strong>{dossier.storageReference || "kein Dateipfad hinterlegt"}</strong></div><div><small>Verknüpfungen</small><strong>{dossier.related.length}</strong></div></div>{dossier.type === "case" && <><section className="case-open-summary"><div><strong>Noch offen</strong><button onClick={() => document.getElementById("case-open-details")?.scrollIntoView({ behavior: "smooth" })}>{caseOpen?.memoryQuestions || 0} Memory-Fragen</button><button onClick={() => document.getElementById("case-open-details")?.scrollIntoView({ behavior: "smooth" })}>{caseOpen?.tasks || 0} Aufgaben</button><button onClick={() => document.getElementById("case-open-details")?.scrollIntoView({ behavior: "smooth" })}>{caseOpen?.deadlines || 0} Fristen</button></div><div className="button-row"><button className="button secondary" onClick={() => onAssistant(dossier.id)}><Bot size={17}/> Assistenz fragen</button><button className="button secondary" onClick={() => onAddMemoryToCase(dossier.id)}><BookHeart size={17}/> Ereignis ergänzen</button><button className="button secondary" onClick={() => onAddDocumentToCase(dossier.id)}><Upload size={17}/> Dokument hinzufügen</button><button className="button primary" onClick={() => document.getElementById("case-open-details")?.scrollIntoView({ behavior: "smooth" })}>Was ist noch offen?</button></div></section><section className="case-timeline"><span className="ui-heading-help"><h3>Gemeinsame Vorgangschronologie</h3><InfoPopover label="Gemeinsame Vorgangschronologie erklären" text={UI_HELP["Gemeinsame Vorgangschronologie"]}/></span>{caseTimeline.length ? caseTimeline.map((item) => <button key={item.id} onClick={() => item.sensitive ? onGo("health") : item.type === "Dokument" ? void onOpenDocument(item.sourceId) : item.recordType === "event" ? onGo("memory", item.sourceId) : focus(item.sourceId)}><span className="badge neutral">{item.type}</span><span><strong>{item.title}</strong><small>{item.at ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.at)) : "Ohne Datum"}</small></span><ChevronRight size={16}/></button>) : <p>Noch keine chronologisch verknüpften Inhalte.</p>}</section><section className="case-open-details" id="case-open-details"><span className="ui-heading-help"><h3>Was ist noch offen?</h3><InfoPopover label="Was ist noch offen? erklären" text={UI_HELP["Was ist noch offen?"]}/></span><p>{caseOpen?.total ? `${caseOpen.memoryQuestions} offene Memory-Fragen, ${caseOpen.tasks} Aufgaben und ${caseOpen.deadlines} Fristen.` : "Aus den vorhandenen Verknüpfungen ergibt sich zurzeit kein offener Punkt."}</p></section></>}<div className="dossier-links" id="dossier-relations"><h3>{dossier.type === "case" ? "Aktueller Vorgang und seine Verknüpfungen" : dossier.type === "object" ? "Objektakte und ihre Verknüpfungen" : dossier.type === "person" ? "Personenakte und ihre Verknüpfungen" : "Zugehörige Informationen"}</h3>{dossierGroups.length ? dossierGroups.map((group) => <section className="dossier-link-group" key={group.type}><h4>{cockpitRecordTypeLabel[group.type]}</h4><div>{group.items.map((reference) => <button key={`${reference.type}-${reference.id}`} onClick={() => openReference(reference)}><span className="badge neutral">{cockpitRecordTypeLabel[reference.type]}</span><span><strong>{reference.label}</strong><small>{reference.id}</small></span><ChevronRight/></button>)}</div></section>) : <p>Für diesen Datensatz sind noch keine weiteren Verknüpfungen gespeichert.</p>}</div>{dossier.notes && <div className="dossier-notes"><span className="ui-heading-help"><h3>Vorhandene Notizen</h3><InfoPopover label="Vorhandene Notizen erklären" text={UI_HELP["Vorhandene Notizen"]}/></span><p>{dossier.notes}</p></div>}<div className="dossier-actions"><h3>Direkte Aktionen</h3><div className="button-row">{dossier.type === "case" && <button className="button secondary" onClick={() => onAssistant(dossier.id)}><Bot size={17}/> Assistenz &amp; Schreiben</button>}{dossier.type === "document" && <button className="button secondary" onClick={() => void onOpenDocument(dossier.id)}><FileText size={17}/> Dokument öffnen</button>}<button className="button secondary" onClick={() => document.getElementById("dossier-relations")?.scrollIntoView({ behavior: "smooth" })}><ClipboardCheck size={17}/> Zuordnung prüfen</button></div>{dossier.type === "person" && onSaveContact && <PersonKontaktKasten daten={((records.find((r) => r.id === dossier.id)?.data) || {}) as Record<string, unknown>} onSpeichern={(k) => onSaveContact(dossier.id, k)}/>}<label><span>Notiz ergänzen</span><VoiceTextarea rows={3} value={note} onValueChange={(spokenValue) => setNote(spokenValue)} placeholder="Nur bestätigte eigene Notiz eintragen" speechLabel="Vorgangsnotiz"/></label><button className="button primary" disabled={savingNote || !note.trim()} onClick={saveNote}>{savingNote ? "Wird gespeichert …" : "Notiz nach Bestätigung ergänzen"}</button></div></>}
    </section>}
  </>;
}

function ReminderCenter({ vaultHandle, records, relations, onRefresh, onGo, onNotice }: {
  vaultHandle: FileSystemDirectoryHandle | null;
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  onRefresh: () => Promise<void>;
  onGo: (id: SectionId, targetId?: string) => void;
  onNotice: (notice: Notice) => void;
}) {
  const [recordType, setRecordType] = useState<"deadline" | "task">("deadline");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [source, setSource] = useState("Manuelle Eingabe");
  const [notes, setNotes] = useState("");
  const [personId, setPersonId] = useState("");
  const [objectId, setObjectId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useActivityMessage("error", "Frist oder Aufgabe speichern");
  const [viewFilter, setViewFilter] = useState<"all" | "overdue" | "dueSoon" | "open">("all");
  const items = buildScheduleItems(records, relations, new Date());
  const active = items.filter((item) => !["done", "postponed"].includes(item.displayStatus));
  const completed = items.filter((item) => ["done", "postponed"].includes(item.displayStatus));
  const counts = { overdue: active.filter((item) => item.displayStatus === "overdue").length, dueSoon: active.filter((item) => item.displayStatus === "dueSoon").length, open: active.filter((item) => item.displayStatus === "open").length };
  const visibleActive = viewFilter === "all" ? active : active.filter((item) => item.displayStatus === viewFilter);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vaultHandle) return setError("Bitte zuerst im Sicherheitscenter einen lokalen Datentresor verbinden.");
    if (!confirmed) return setError("Bitte bestätige ausdrücklich, dass diese Frist oder Aufgabe angelegt werden soll.");
    setBusy(true); setError("");
    try {
      await createLocalScheduleBundle(vaultHandle, {
        recordType, title, dueAt, reminderAt: reminderAt || null, source: source || "Manuelle Eingabe", notes: notes || null,
        references: [
          { recordType: "person", id: personId, relationType: "betrifft" },
          { recordType: "object", id: objectId, relationType: "gehört zu" },
          { recordType: "case", id: caseId, relationType: "gehört zu" },
          { recordType: "document", id: documentId, relationType: "basiert auf" },
        ],
      });
      await onRefresh();
      setTitle(""); setDueAt(""); setReminderAt(""); setNotes(""); setPersonId(""); setObjectId(""); setCaseId(""); setDocumentId(""); setConfirmed(false);
      onNotice({ kind: "success", text: "Die Frist oder Aufgabe wurde nach deiner Bestätigung lokal angelegt und protokolliert." });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Der Eintrag konnte nicht angelegt werden."); }
    finally { setBusy(false); }
  };
  const changeStatus = async (id: string, status: "offen" | "erledigt" | "zurückgestellt") => {
    if (!vaultHandle) return;
    setBusy(true);
    try { await updateLocalScheduleStatus(vaultHandle, id, status); await onRefresh(); onNotice({ kind: "success", text: `Der Status wurde auf „${status}“ gesetzt und protokolliert.` }); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Status konnte nicht geändert werden." }); }
    finally { setBusy(false); }
  };
  const renderItem = (item: ReturnType<typeof buildScheduleItems>[number]) => <article className={`schedule-item schedule-${item.displayStatus}`} key={item.id}><div className="schedule-item-main"><span className={`badge schedule-badge-${item.displayStatus}`}>{scheduleStatusLabels[item.displayStatus]}</span><h3>{item.title}</h3><p><strong>{item.date ? fmtDate(item.date.slice(0, 10)) : "Ohne Fälligkeitsdatum"}</strong> · {item.recordType === "deadline" ? "Frist" : item.recordType === "task" ? "Aufgabe" : "Erinnerung"}</p><small>Quelle: {item.source || "nicht angegeben"} · Kennung: {item.id}</small>{item.notes && <p>{item.notes}</p>}</div><div className="schedule-links">{item.links.length ? item.links.map((link) => { const ownFrom = link.fromId === item.id; const type = ownFrom ? link.toType : link.fromType; const id = ownFrom ? link.toId : link.fromId; const target = targetForRelation(type, id); return <button key={link.id} className="text-link" onClick={() => onGo(target.section as SectionId, target.targetId)}>{recordTypeDefinitions[type].label}: {id}</button>; }) : <small>Keine zusätzliche Zuordnung</small>}</div><div className="button-row">{item.displayStatus !== "done" && <button className="button secondary" disabled={busy} onClick={() => changeStatus(item.id, "erledigt")}>Als erledigt markieren</button>}{item.displayStatus !== "postponed" && item.displayStatus !== "done" && <button className="button secondary" disabled={busy} onClick={() => changeStatus(item.id, "zurückgestellt")}>Zurückstellen</button>}{["done", "postponed"].includes(item.displayStatus) && <button className="button secondary" disabled={busy} onClick={() => changeStatus(item.id, "offen")}>Wieder öffnen</button>}</div></article>;
  return <><PageTitle icon={<FileClock/>} title="Fristen und Aufgaben" text="Offene, bald fällige und überfällige Punkte aus dem bestehenden Familienakten-Datenmodell. Änderungen erfolgen nur nach deinem Befehl."/>
    <section className="schedule-summary" aria-label="Fristen filtern"><button className={`card schedule-filter ${viewFilter === "overdue" ? "active" : ""}`} onClick={() => setViewFilter("overdue")}><small>Überfällig</small><strong>{counts.overdue}</strong><span>Anzeigen</span></button><button className={`card schedule-filter ${viewFilter === "dueSoon" ? "active" : ""}`} onClick={() => setViewFilter("dueSoon")}><small>Bald fällig</small><strong>{counts.dueSoon}</strong><span>Anzeigen</span></button><button className={`card schedule-filter ${viewFilter === "open" ? "active" : ""}`} onClick={() => setViewFilter("open")}><small>Offen</small><strong>{counts.open}</strong><span>Anzeigen</span></button></section>
    <section className="card schedule-create"><div className="card-heading"><div><span className="badge success">Manuelle Eingabe</span><span className="ui-heading-help"><h2>Frist oder Aufgabe anlegen</h2><InfoPopover label="Frist oder Aufgabe anlegen erklären" text={UI_HELP["Frist oder Aufgabe anlegen"]}/></span></div></div>{!vaultHandle && <div className="sync-message warning">Bitte zuerst im Sicherheitscenter einen lokalen PC-, USB- oder OneDrive-Ordner verbinden.</div>}<form onSubmit={save}><div className="form-grid"><label><span>Art</span><select value={recordType} onChange={(event) => setRecordType(event.target.value as "deadline" | "task")}><option value="deadline">Frist</option><option value="task">Aufgabe</option></select></label><label><span>Bezeichnung</span><VoiceInput value={title} required onValueChange={(spokenValue) => setTitle(spokenValue)} placeholder="Zum Beispiel: Antwort an Krankenkasse" speechLabel="Titel"/></label><label><span>Fälligkeitsdatum</span><input type="date" value={dueAt} required onChange={(event) => setDueAt(event.target.value)}/></label><label><span>Erinnerungsdatum, optional</span><input type="date" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)}/></label><label><span>Quelle</span><VoiceInput value={source} onValueChange={(spokenValue) => setSource(spokenValue)} placeholder="Zum Beispiel: Schreiben vom 07.10.2026" speechLabel="Quelle"/></label><label><span>Personen-ID, optional</span><input value={personId} onChange={(event) => setPersonId(event.target.value)} placeholder="PER-000001"/></label><label><span>Objekt-ID, optional</span><input value={objectId} onChange={(event) => setObjectId(event.target.value)} placeholder="OBJ-000001"/></label><label><span>Vorgangs-ID, optional</span><input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="VORG-000001"/></label><label><span>Dokument-ID, optional</span><input value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="DOC-000001 oder lokale Dokument-ID"/></label></div><label><span>Notizen, optional</span><VoiceTextarea rows={3} value={notes} onValueChange={(spokenValue) => setNotes(spokenValue)} speechLabel="Notizen"/></label><label className="check-row schedule-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Ja, diesen Eintrag nach dem Speichern anlegen</strong><small>Es wird nichts aus Dokumenten automatisch übernommen oder verändert.</small></span></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button className="button primary" disabled={busy || !vaultHandle}>{busy ? "Wird gespeichert …" : "Frist oder Aufgabe bestätigt anlegen"}</button></div></form></section>
    <section className="card" id="offene-fristen"><div className="card-heading"><div><span className="ui-heading-help"><h2>Offene Fristen und Aufgaben</h2><InfoPopover label="Offene Fristen und Aufgaben erklären" text={UI_HELP["Offene Fristen und Aufgaben"]}/></span></div><div className="button-row"><span className="badge neutral">{visibleActive.length} angezeigt</span>{viewFilter !== "all" && <button className="text-link" onClick={() => setViewFilter("all")}>Alle offenen anzeigen</button>}</div></div><div className="schedule-list">{visibleActive.length ? visibleActive.map(renderItem) : <div className="empty-state"><CheckCircle2 size={30}/><strong>Keine passenden offenen Fristen oder Aufgaben</strong><span>Der gewählte Filter enthält derzeit keinen Eintrag.</span></div>}</div></section>
    <section className="card"><details><summary><strong>Erledigte und zurückgestellte Punkte ({completed.length})</strong></summary><div className="schedule-list">{completed.length ? completed.map(renderItem) : <div className="empty-state">Noch keine erledigten oder zurückgestellten Punkte.</div>}</div></details></section>
  </>;
}

function Medical({ diagnoses, query, onGo, onDocuments, onSearch }: { diagnoses: typeof healthData.currentDiagnoses; query: string; onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) {
  return <><PageTitle icon={<HeartPulse/>} title="Medizinische Gesundheitsakte" text="Diagnosen, ICD-Codes, AU-Zeiten und behandelnde Stellen. Neueste Zeitangaben stehen oben; Einträge ohne Datum am Ende." />
    <SubpageActions actions={menuPageActions.medical} onGo={onGo} onDocuments={onDocuments}/>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Diagnosen und ICD-Codes</h2><InfoPopover label="Diagnosen und ICD-Codes erklären" text={UI_HELP["Diagnosen und ICD-Codes"]}/></span><p>Unverändert aus den berücksichtigten ärztlichen Unterlagen und Krankenkasse-Daten.</p></div><span className="badge neutral">{diagnoses.length} Treffer</span></div>{query && !diagnoses.length ? <div className="empty-state">Keine passende Diagnose gefunden.</div> : <div className="table-wrap"><table><thead><tr><th>Bereich</th><th>ICD-Code</th><th>Diagnose und Beleg</th><th>Status</th></tr></thead><tbody>{diagnoses.map((item) => <tr key={`${item.area}-${item.codes}`}><td>{item.area}</td><td><button className="data-link" onClick={() => onSearch(item.codes)}><code>{item.codes}</code></button></td><td><button className="data-link stacked" onClick={() => onSearch(item.diagnosis)}><strong>{item.diagnosis}</strong><small>{item.evidence}</small></button></td><td><span className="badge neutral">{item.status}</span></td></tr>)}</tbody></table></div>}</section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Behandelnde Ärzte und AU-Zuordnung</h2><InfoPopover label="Behandelnde Ärzte und AU-Zuordnung erklären" text={UI_HELP["Behandelnde Ärzte und AU-Zuordnung"]}/></span><p>Gesundheitskontakt Nord ist als Beispielkontakt hinterlegt.</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Fachgebiet</th><th>Gesichert dokumentiert</th><th>Noch offen</th></tr></thead><tbody>{healthData.doctors.map((item) => <tr key={item.name}><td><button className="data-link" onClick={() => onSearch(item.name)}><strong>{item.name}</strong></button></td><td>{item.field}</td><td>{item.confirmed}</td><td>{item.open}</td></tr>)}</tbody></table></div></section>
    <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Arbeitsunfähigkeitszeiten</h2><InfoPopover label="Arbeitsunfähigkeitszeiten erklären" text={UI_HELP["Arbeitsunfähigkeitszeiten"]}/></span><p>Sortiert nach Anfangsdatum, neueste Einträge zuerst.</p></div><span className="badge neutral">{healthData.auTimeline.length} Einträge</span></div><div className="table-wrap"><table><thead><tr><th>Beginn</th><th>Ende</th><th>ICD-Code(s)</th><th>Einordnung</th></tr></thead><tbody>{healthData.auTimeline.map((item) => <tr key={`${item.start}-${item.end}`}><td><strong>{item.start}</strong></td><td>{item.end}</td><td><button className="data-link" onClick={() => onSearch(item.codes)}><code>{item.codes}</code></button></td><td>{item.group}</td></tr>)}</tbody></table></div></section>
  </>;
}

function Benefits({ onGo, onDocuments, onSearch }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) { return <><PageTitle icon={<BriefcaseMedical/>} title="Arbeitsunfähigkeit, Leistung und Entgeltfortzahlung" text="Dokumentierte Leistungen, Fristen und frühere Zeiträume." />
  <SubpageActions actions={menuPageActions.benefits} onGo={onGo} onDocuments={onDocuments}/>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Leistungen der Krankenkasse</h2><InfoPopover label="Leistungen der Krankenkasse erklären" text={UI_HELP["Leistungen der Krankenkasse"]}/></span><p>Zeiträume und Beträge laut Krankenkasse-Leistungsauskunft.</p></div><span className="badge neutral">1 Beispielfall</span></div><div className="payment-list">{healthData.sickPay.map((item) => <button className="payment-row" key={item.period} onClick={() => onSearch(`${item.period} ${item.group}`)}><strong>{item.period}</strong><span><b>{item.group}</b><small>{item.clarification}</small></span><em>{item.amount}</em><ChevronRight/></button>)}</div></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Fristen</h2><InfoPopover label="Fristdiagnosen erklären" text={UI_HELP["Fristdiagnosen"]}/></span><p>Einordnung nach dem derzeit dokumentierten Krankenkasse-Stand.</p></div></div><div className="table-wrap"><table><thead><tr><th>Beispielfall</th><th>Frist</th><th>Einordnung</th></tr></thead><tbody>{healthData.blockCases.map((item) => <tr key={item.period}><td><strong>{item.period}</strong></td><td><button className="data-link stacked" onClick={() => onSearch(item.code)}><code>{item.code}</code><small>{item.diagnosis}</small></button></td><td>{item.detail}</td></tr>)}</tbody></table></div></section>
  <section className="card split-card"><div><h2>Offene Klärung</h2><p>Zuschuss für die neue Brille – Antwort liegt vor (Beispiel)</p></div><div className="callout warning"><FileClock/><div><strong>Antwort der Krankenkasse steht noch aus</strong><span>Die Beispielanfrage vom 02.03.2026 ist dokumentiert. Bis zur Antwort wird nichts ergänzt.</span></div></div></section></>; }

function Work({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary }) { const files = ["2026-03-02_Zeitkonto Anwesenheit 2026.pdf", "2025_Jahresübersicht Anwesenheit.pdf", "Anträge und Unterlagen zu Arbeitszeit und Urlaub"]; return <><PageTitle icon={<Landmark/>} title="Arbeit, Arbeitgeber und Arbeitszeiten" text="Arbeitszeitunterlagen, betriebliche Krankmeldungen und medizinische AU bleiben klar voneinander getrennt." />
  <SubpageActions actions={menuPageActions.work} onGo={onGo} onDocuments={onDocuments}/>
  <InfoNotice title="Wichtige Abgrenzung"><p>„KR“ belegt eine betriebliche Krankmeldung. Daraus lassen sich allein keine ärztlich bestätigte AU, Diagnose oder Leistungzahlung ableiten. Arbeitsstunden belegen Anwesenheit, nicht volle Arbeitsplanung.</p></InfoNotice>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Arbeitsverlauf</h2><InfoPopover label="Arbeitsverlauf erklären" text={UI_HELP["Arbeitsverlauf"]}/></span><p>Neueste Einträge stehen oben.</p></div><span className="badge neutral">Stand 14.03.2026</span></div><div className="table-wrap"><table><thead><tr><th>Zeitraum</th><th>Arbeitgeber-Eintrag</th><th>Einordnung</th></tr></thead><tbody>{healthData.workHistory.map((item) => <tr key={`${item.period}-${item.entry}`}><td><strong>{item.period}</strong></td><td><code>{item.entry}</code></td><td>{item.assessment}</td></tr>)}</tbody></table></div></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Zugeordnete Arbeitsunterlagen</h2><InfoPopover label="Zugeordnete Arbeitsunterlagen erklären" text={UI_HELP["Zugeordnete Arbeitsunterlagen"]}/></span><p>Für die Darstellung der Arbeitsphase berücksichtigt.</p></div></div><ul className="source-list interactive-source-list">{files.map((file) => <li key={file}><button onClick={() => onDocuments({ query: file })}><FileText size={16}/><span>{file}</span><ChevronRight/></button></li>)}<li className="source-missing"><span className="info-label">Info</span><span>Arbeitszeitunterlage 2025 (Beispiel)</span></li></ul></section></>; }

function Assessment({ onGo, onDocuments }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary }) { return <><PageTitle icon={<Users/>} title="Anträge, Bescheide und Behördenpost" text="Die zuvor getrennten Unterthemen sind hier als ein gemeinsamer Antrags- und Bescheinigungsbereich zusammengeführt." />
  <SubpageActions actions={menuPageActions.assessment} onGo={onGo} onDocuments={onDocuments}/>
  <InfoNotice title="Ein gesundheitliches Gesamtbild – getrennte Quellen"><p>Anträge, Bescheide und Schriftverkehr mit Ämtern werden gemeinsam betrachtet. Herkunft und Zweck bleiben erkennbar.</p></InfoNotice>
  <section className="group-grid">{assessmentGroups.map((group) => <article className="card" key={group.title}><div className="card-heading"><div><h2>{group.title}</h2><p>{group.description}</p></div></div><ul className="source-list interactive-source-list">{group.files.map((file) => <li key={file}><button onClick={() => onDocuments({ query: file })}><FileText size={16}/><span>{file}</span><ChevronRight/></button></li>)}</ul></article>)}</section></>; }

function Correspondence({ onGo, onDocuments, onSearch }: { onGo: (id: SectionId, targetId?: string) => void; onDocuments: OpenDocumentLibrary; onSearch: (value: string) => void }) { return <><PageTitle icon={<FileClock/>} title="Anfragen und Antworten" text="Was wurde gefragt, was wurde beantwortet und welche Punkte sind noch offen? Neueste Vorgänge stehen oben." />
  <SubpageActions actions={menuPageActions.correspondence} onGo={onGo} onDocuments={onDocuments}/>
  <section className="card timeline-list">{healthData.correspondence.map((item) => <article key={`${item.date}-${item.subject}`}><div className="timeline-dot"/><div><span>{item.date} · {item.type}</span><button className="timeline-title-link" onClick={() => onDocuments({ query: item.subject })}>{item.subject}<ChevronRight/></button><p><strong>Anliegen:</strong> {item.request}</p><p><strong>Ergebnis:</strong> {item.answer}</p><span className="badge neutral">{item.status}</span></div></article>)}</section>
  <section className="card"><div className="card-heading"><div><h2>Offene Punkte</h2><p>Diese Liste wird mit jeder neuen Antwort fortgeschrieben.</p></div></div><div className="open-items interactive-open-items">{healthData.openItems.map((item) => <button key={item.title} onClick={() => onSearch(item.title)}><FileClock size={18}/><span><strong>{item.title}</strong><small>{item.next}</small></span><span className="badge warning">{item.priority}</span><ChevronRight/></button>)}</div></section></>; }

function Sources({ onDocuments }: { onDocuments: OpenDocumentLibrary }) { return <><PageTitle icon={<Archive/>} title="Unterlagen und Quellen" text="Die Online-Übersicht verbindet die Aussagen. Verbindlich bleiben die Originaldokumente." />
  <section className="card action-row"><div><span className="ui-heading-help"><h2>Dokumentenbibliothek</h2><InfoPopover label="Dokumentenbibliothek erklären" text={UI_HELP["Dokumentenbibliothek"]}/></span></div><button className="button primary" onClick={() => onDocuments()}><Archive size={17}/> Alle Dokumente ansehen</button></section>
  <section className="card"><div className="card-heading"><div><span className="ui-heading-help"><h2>Zentrale Unterlagen</h2><InfoPopover label="Zentrale Unterlagen erklären" text={UI_HELP["Zentrale Unterlagen"]}/></span></div><span className="badge neutral">{coreDocuments.length} Kerndokumente</span></div><div className="table-wrap"><table><thead><tr><th>Datum</th><th>Unterlage</th><th>Bereich</th><th>Stand</th></tr></thead><tbody>{coreDocuments.map((item) => <tr key={`${item.date}-${item.name}`}><td><strong>{item.date}</strong></td><td><button className="data-link" onClick={() => onDocuments({ query: item.name })}>{item.name}</button></td><td><button className="data-link" onClick={() => onDocuments({ area: item.area })}>{item.area}</button></td><td><span className={`badge ${item.status === "Antwort offen" ? "warning" : "success"}`}>{item.status}</span></td></tr>)}</tbody></table></div></section>
  <InfoNotice title="Umgang mit Quellen"><p>Diagnosen, Zeiträume und Ärzte nur aus Originalunterlagen übernehmen. Neueste Einträge stehen oben; Fachbefund, eAU, betriebliche Krankmeldung und eigene Notiz bleiben getrennt.</p></InfoNotice></>; }

function PageTitle({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <header className="page-title"><div>{icon}</div><span className="ui-heading-help"><h1>{title}</h1><InfoPopover label={`${title} erklären`} text={text}/></span></header>; }


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

function UploadDialog({ initialFile, source, knownDocuments, records, relations, decisions, suggestedCaseId, onClose, onOpenExisting, onSave }: {
  initialFile: File | null; source: DocumentIntakeSource;
  knownDocuments: Array<{ id: string; originalName: string; sizeBytes: number; documentDate?: string | null; updatedAt?: string | null; category?: string | null; notes?: string | null }>;
  records: FamilyRecordUnion[]; relations: FamilyRelation[]; decisions: ContextLinkDecision[]; suggestedCaseId: string | null; onClose: () => void; onOpenExisting: (id: string) => void;
  onSave: (file: File, data: { category: string; documentDate: string | null; notes: string | null; allowDuplicate?: boolean; assignmentLinks?: Array<{ toType: FamilyRecordUnion["recordType"]; toId: string; relationType: string }>; newCaseTitle?: string; rejectedContext?: ContextLinkSuggestion; resolveOpenPointEventId?: string }) => Promise<LocalDocument>;
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
      if (!aus && a && !briefHand) { setBrief(a); setBriefNummern(nummernText(a.nummern)); if (a.datum) setDocumentDate((d) => d || a.datum); }
    })().catch(() => { /* ohne Baustein bleibt der alte Titel */ });
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
  useEffect(() => {
    let cancelled = false;
    if (!file) { setTextHint(""); return () => { cancelled = true; }; }
    // Klaus 2026-10-31: „die Texterkennung hat nur Dokumentenscan und Datum erfasst“ — PDFs und Fotos wurden gar nicht gelesen.
    // Jetzt: Textebene des PDF, sonst Texterkennung auf dem Gerät (Tesseract aus Workflow PDF, höchstens 5 Seiten). Nichts geht hinaus.
    void (async () => {
      let value = await extractDocumentIntakeTextHint(file).catch(() => "");
      const istPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf", istBild = /^image\/(jpeg|png|webp)$/.test(file.type);
      if (!value.trim() && (istPdf || istBild)) {
        if (!cancelled) setTextLesen(true);
        try {
          const { dokumentText, dokumentTextOcr } = await import("./ki-auftrag-dialog");
          if (istPdf) value = await dokumentText(file).catch(() => "");
          if (!value.trim() || value.trim().length < 20) value = await dokumentTextOcr(file).catch(() => value);
        } finally { if (!cancelled) setTextLesen(false); }
      }
      if (!cancelled) setTextHint(value.slice(0, 300000));
    })().catch(() => { if (!cancelled) { setTextHint(""); setTextLesen(false); } });
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
  const selbstGewaehlt = useRef(false);
  const waehle = (id: string) => { selbstGewaehlt.current = true; setSelectedCaseId(id); };
  useEffect(() => { if (selbstGewaehlt.current) return; const vorschlag = suggestedCaseId || vorgangAusNummer || contextSuggestions[0]?.caseId || ""; if (vorschlag && vorschlag !== selectedCaseId) setSelectedCaseId(vorschlag); }, [suggestedCaseId, vorgangAusNummer, contextSuggestions, selectedCaseId]);
  const selectFile = (selected: File | null) => {
    setFile(selected); setTextHint(""); setBriefHand(false); setBrief(null); setBriefNummern(""); setAllowDuplicate(false); setError(""); setChoiceField(null); setCustomChoice("");
    setOverrides({ lifeArea: false, documentType: false, privacyClass: false, category: false });
    if (selected) {
      const nextPlan = buildDocumentIntakePlan({ file: selected, source, documents: knownDocuments, records });
      setLifeArea(nextPlan.lifeArea); setDocumentType(nextPlan.documentType); setPrivacyClass(nextPlan.privacyClass); setCategory(nextPlan.category);
      reportActivity({ kind: "info", text: nextPlan.duplicateIds.length ? "Mögliche Dublette erkannt · vorhandenes Dokument vergleichen. Noch keine Datei gespeichert." : "1 Datei zur Zuordnungsprüfung ausgewählt. Noch keine Datei gespeichert; Originaldatei unverändert." });
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
    const intakeNotes = plan ? [`FaWoGa: ${lifeArea}`, `Dokumentart: ${documentType}`, `Datenschutz: ${privacyClass}`, `Eingang: ${source}`, manuallyAdjusted ? "Zuordnung vom Benutzer angepasst" : "Intelligenter Vorschlag übernommen", briefZeile(brief)].filter(Boolean).join(" · ") : "";
    const stageType: Partial<Record<string, FamilyRecordUnion["recordType"]>> = { person: "person", organisation: "organisation", object: "object", case: "case", deadline: "deadline", task: "task" };
    const assignmentLinks = (plan?.assignment.steps || []).filter((step) => step.selectedId && stageType[step.stage] && step.stage !== "case" && (step.stage !== "area" || step.selectedLabel === lifeArea)).map((step) => ({ toType: stageType[step.stage]!, toId: step.selectedId!, relationType: "betrifft" }));
    if (selectedCaseId) assignmentLinks.push({ toType: "case", toId: selectedCaseId, relationType: "gehört zu" });
    try { await onSave(file, { category: category || "Sonstiges", documentDate: String(form.get("documentDate") || "") || null, notes: [userNotes, intakeNotes].filter(Boolean).join(" · ") || null, allowDuplicate, assignmentLinks, newCaseTitle: newCaseTitle.trim() || undefined, rejectedContext, resolveOpenPointEventId: resolveOpenPointEventId || undefined }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Lokales Speichern nicht möglich."); setSubmitting(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal intake-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-head"><div><span className="badge success">Gemeinsamer Dokumenteneingang</span><span className="ui-heading-help"><h2 id="upload-title">Neue Unterlage prüfen und lokal ablegen</h2><InfoPopover label="Neue Unterlage prüfen und lokal ablegen erklären" text={UI_HELP["Neue Unterlage prüfen und lokal ablegen"]}/></span></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div><form onSubmit={submit}>
    <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.vtt,.msg,.zip" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
    <button type="button" className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0] || null); }}><Upload size={32}/><strong>{file ? file.name : "Datei hier ablegen oder auswählen"}</strong><span>{file ? `${fmtBytes(file.size)}${textLesen ? " · Text wird gelesen …" : textHint.trim() ? " · Text gelesen" : ""}` : "PDF, DOCX, XLSX, MSG, VTT, ZIP oder Bilddatei · höchstens 20 MB"}</span></button>
    {file && (brief || textHint.trim()) && <section className="intake-briefkopf" data-briefkopf aria-label="Aus dem Briefkopf"><strong>Aus dem Briefkopf</strong>{!brief && <small data-briefkopf-leer>Kein Briefkopf erkannt — die Angaben bleiben leer, nichts wird geraten.</small>}
      <label><span>Absender</span><input data-brief-feld="absender" value={brief?.absender || ""} onChange={(e) => briefAendern("absender", e.target.value)} placeholder="nicht erkannt"/></label>
      <label><span>Empfänger</span><input data-brief-feld="empfaenger" value={brief?.empfaenger || ""} onChange={(e) => briefAendern("empfaenger", e.target.value)} placeholder="nicht erkannt"/></label>
      <label><span>Kunden-/Aktennummer</span><input data-brief-feld="nummern" value={briefNummern} onChange={(e) => nummernAendern(e.target.value)} placeholder="z. B. Kundennummer 12345"/></label>
      {brief?.thema && <small data-brief-thema>Thema: {brief.thema}</small>}
      {gleich.length > 0 && <div className="intake-brief-gleich" data-brief-gleich>{gleich.map((g) => <span key={g.dokument.id}>{g.nummer.art} {g.nummer.wert} auch in <button type="button" className="text-link" onClick={() => onOpenExisting(g.dokument.id)}>{g.dokument.originalName}</button></span>)}{vorgangAusNummer && <small data-brief-vorgang>Vorgang dieser Unterlage vorgeschlagen.</small>}</div>}
    </section>}
    {plan && <section className={`intake-analysis confidence-${plan.confidence}`} aria-label="Vorschlag der Dokumentenverarbeitung"><div className="intake-analysis-head"><div><span>Zuordnung prüfen</span><strong>{plan.title}</strong><small>Quelle: {source === "camera-scan" ? "PDF aus fotografierten Dokumentseiten" : source === "onedrive-inbox" ? "OneDrive-Familienordner" : source === "local-inbox" ? "Lokaler Eingangsordner" : source === "drag-drop" ? "Drag & Drop" : "Dateiauswahl"}</small></div><span className="badge neutral">{plan.confidence}</span></div><dl className="intake-choice-grid"><div className="intake-choice-card"><dt>Lebensbereich</dt><dd>{lifeArea}<small>{overrides.lifeArea ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("lifeArea")} aria-label="Lebensbereich auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Dokumentenart</dt><dd>{documentType}<small>{overrides.documentType ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("documentType")} aria-label="Dokumentenart auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Datenschutz</dt><dd>{privacyClass}<small>{overrides.privacyClass ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("privacyClass")} aria-label="Datenschutzstufe auswählen"><Menu size={15}/></button></div><div className="intake-choice-card"><dt>Bereich</dt><dd>{category}<small>{overrides.category ? "von dir gewählt" : "Vorschlag der Software"}</small></dd><button type="button" className="intake-choice-tab" onClick={() => openChoice("category")} aria-label="Bereich auswählen"><Menu size={15}/></button></div></dl>
      {plan.assignment.steps.filter((step) => step.selectedId && step.stage !== "area").slice(0, 4).map((step) => <div className="intake-assignment" key={step.stage}><span>{step.stage}</span><strong>{step.selectedLabel}</strong><small>{step.message}</small></div>)}
      {plan.duplicateIds.length > 0 && <div className="duplicate-warning"><strong>Mögliche Dublette</strong><span>Ein gleich benanntes Dokument mit gleicher Dateigröße ist bereits registriert.</span>{plan.duplicateIds.map((id) => <button type="button" className="text-link" key={id} onClick={() => onOpenExisting(id)}>Vorhandenes Dokument {id} öffnen <ChevronRight size={15}/></button>)}<label className="check-row"><input type="checkbox" checked={allowDuplicate} onChange={(event) => { setAllowDuplicate(event.target.checked); reportActivity({ kind: "info", text: event.target.checked ? "Mögliche Dublette: „Trotzdem übernehmen“ von dir bestätigt. Erst der Speicherbefehl übernimmt die Datei." : "Zusätzliche Übernahme der möglichen Dublette nicht bestätigt. Noch keine Datei gespeichert." }); }}/><span><strong>Trotzdem übernehmen</strong><small>Nur auswählen, wenn es sich tatsächlich um eine andere Datei handelt.</small></span></label></div>}
    </section>}
    {file && contextSuggestions.length > 0 && <section className="context-suggestion"><div><span className="eyebrow dark">Möglicher vorhandener Zusammenhang</span><h3>{selectedCaseId && selectedCaseId !== contextSuggestions[0].caseId ? <>Wird verknüpft mit „{String((records.find((record) => record.id === selectedCaseId)?.data as { title?: string } | undefined)?.title || selectedCaseId)}“.</> : <>Dieses Dokument passt wahrscheinlich zu „{contextSuggestions[0].caseLabel}“.</>}</h3><p>Die Datensätze werden nur verknüpft und nicht zusammengeführt.</p><details><summary>Warum vorgeschlagen?</summary><ul>{contextSuggestions[0].reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div><div className="context-suggestion-actions"><button type="button" className="button primary" data-kontext-verknuepfen onClick={() => { waehle(selectedCaseId || contextSuggestions[0].caseId); setNewCaseTitle(""); setRejectedContext(undefined); }}>Verknüpfen</button><label><span>Anderen Vorgang wählen</span><select data-kontext-vorgang value={selectedCaseId} onChange={(event) => { waehle(event.target.value); setNewCaseTitle(""); setRejectedContext(undefined); }}><option value="">Noch nicht verknüpfen</option>{records.filter((record) => record.recordType === "case").map((record) => <option value={record.id} key={record.id}>{String((record.data as { title?: string }).title || record.id)}</option>)}</select></label><label><span>Neuen Vorgang nur bewusst anlegen</span><VoiceInput value={newCaseTitle} onValueChange={(spokenValue) => { setNewCaseTitle(spokenValue); waehle(""); setRejectedContext(undefined); }} placeholder="Bezeichnung des neuen Vorgangs" speechLabel="Neuer Vorgang"/></label><button type="button" className="button secondary" onClick={() => { waehle(""); setNewCaseTitle(""); setRejectedContext(contextSuggestions[0]); }}>Nicht verknüpfen</button></div>{contextSuggestions[0].openPointEventIds.length > 0 && <label className="check-row context-open-point"><input type="checkbox" checked={resolveOpenPointEventId === contextSuggestions[0].openPointEventIds[0]} onChange={(event) => setResolveOpenPointEventId(event.target.checked ? contextSuggestions[0].openPointEventIds[0] : "")}/><span><strong>Offener Punkt möglicherweise geklärt</strong><small>Erst nach dieser Bestätigung wird der ausgewählte Memory-Punkt als erledigt markiert.</small></span></label>}</section>}
    <div className="form-grid intake-date-row"><label><span>Dokumentdatum, falls bekannt</span><div className="dictation-field"><input name="documentDate" type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)}/><DictationButton value="" onChange={chooseSpokenDate} label="Dokumentdatum" append={false}/></div></label></div>
    <label><span>Kurzer Hinweis, optional</span><div className="dictation-field"><textarea name="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Zum Beispiel: Antwort auf meine Anfrage vom 02.10.2026"/><DictationButton value={notes} onChange={setNotes} label="Hinweistext"/></div></label>{dictationHint && <div className="dictation-hint" aria-live="polite"><Mic size={16}/>{dictationHint}</div>}{error && <div className="form-error">{error}</div>}
    <p className="fine-print">Originaldateien werden nicht automatisch verschoben, umbenannt, gelöscht oder überschrieben. Das Dokument wird erst durch deinen Speicherbefehl in den freigegebenen Datentresor übernommen.</p>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Abbrechen</button><button type="submit" className="button primary" disabled={submitting || !file}>{submitting ? "Wird lokal gespeichert …" : "Geprüft lokal speichern"}</button></div>
  </form>{choiceField && choiceConfig && <div className="intake-choice-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setChoiceField(null)}><section className="intake-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="intake-choice-title"><header><div><span className="eyebrow dark">Auswahl ändern</span><h3 id="intake-choice-title">{choiceConfig.label}</h3><p>Der intelligente Vorschlag ist markiert. Deine Auswahl wird beim lokalen Speichern übernommen.</p></div><button type="button" className="icon-button" onClick={() => setChoiceField(null)} aria-label="Auswahlfenster schließen"><X/></button></header><div className="intake-choice-options">{choiceConfig.options.map((option) => <button type="button" className={option === choiceConfig.value ? "selected" : ""} key={option} onClick={() => applyChoice(choiceField, option)}><span>{option}</span>{option === choiceConfig.value && <CheckCircle2 size={17}/>}</button>)}</div>{choiceConfig.custom && <div className="intake-custom-choice"><label><span>Eigene Bezeichnung hinzufügen</span><div className="dictation-field"><input value={customChoice} onChange={(event) => setCustomChoice(event.target.value)} placeholder={`Eigene ${choiceConfig.label.toLocaleLowerCase("de")} eingeben`}/><DictationButton value={customChoice} onChange={setCustomChoice} label={`Eigene ${choiceConfig.label}`}/></div></label><button type="button" className="button primary" disabled={!customChoice.trim()} onClick={() => applyChoice(choiceField, customChoice)}>Übernehmen</button></div>}<footer><button type="button" className="button secondary" onClick={() => setChoiceField(null)}>Ohne Änderung schließen</button></footer></section></div>}</div></div>;
}
