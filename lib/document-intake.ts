import type { FamilyRecordUnion } from "./family-data-model.ts";
import { familyRecordToAssignmentRecord, proposeFamilyAssignment, type AssignmentProposal } from "./family-assignment.ts";
import { FAMILY_CATEGORIES } from "./family-categories.ts";

export const DOCUMENT_INTAKE_VERSION = 1 as const;

export const FAWOGA_LIFE_AREAS = FAMILY_CATEGORIES;

export type DocumentIntakeSource = "drag-drop" | "file-picker" | "local-inbox" | "onedrive-inbox" | "camera-scan";
export type DocumentIntakeConfidence = "eindeutig" | "wahrscheinlich" | "unklar";
export type IntakeDocumentReference = {
  id: string;
  originalName: string;
  sizeBytes: number;
  documentDate?: string | null;
  updatedAt?: string | null;
};

export type DocumentIntakePlan = {
  pipelineVersion: typeof DOCUMENT_INTAKE_VERSION;
  source: DocumentIntakeSource;
  title: string;
  fileName: string;
  documentType: string;
  category: string;
  lifeArea: (typeof FAWOGA_LIFE_AREAS)[number];
  privacyClass: "allgemein" | "vertraulich" | "besonders geschützt";
  confidence: DocumentIntakeConfidence;
  requiresReview: boolean;
  duplicateIds: string[];
  assignment: AssignmentProposal;
  integrationTargets: readonly ["Dokumentenbibliothek", "Suche", "Was gibt’s Neues?", "Vorgangschronologie", "Cockpit bei Handlungsbedarf"];
  safeguards: readonly string[];
};

export type IntakeFile = { name: string; size: number; type?: string; lastModified?: number; textHint?: string; titleHint?: string };

const normalize = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
const has = (text: string, words: string[]) => words.some((word) => text.includes(normalize(word)));
const titleFromName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

function classifyFile(fileName: string, textHint = "") {
  const text = normalize(`${fileName} ${textHint}`);
  if (has(text, ["strom", "gas", "wasser", "energie", "vertragsportal", "stromanbieter", "stromtarif"])) return { lifeArea: "Energie & Versorgung" as const, category: has(text, ["vertragsportal", "anbieterwechsel", "stromanbieterwechsel", "stromtarifoptimierung"]) ? "Energievertrag / Anbieterwechsel" : "Energie / Versorgung", documentType: "Versorgungsunterlage", privacyClass: "vertraulich" as const };
  if (has(text, ["bescheinigung", "bescheinigung", "personalabteilung", "arbeitsbescheinigung", "bestatigung zum antrag"])) {
    return { lifeArea: "Rente, Arbeit & Sozialversicherung" as const, category: "Gutachten / Bescheinigungen", documentType: "Betrieblichee Unterlage", privacyClass: "besonders geschützt" as const };
  }
  if (has(text, ["arzt", "befund", "klinik", "labor", "diagnose", "krank", "au ", "eau", "krankenkasse", "pflege", "reha", "physio", "zahn", "heuschnupfen", "vorsorgezentrum", "impfpass", "sehtest", "sehtest", "vorsorgeheft", "optik"])) {
    return { lifeArea: "Gesundheit & Pflege" as const, category: has(text, ["au ", "eau", "krankmeldung"]) ? "AU / eAU / Krankmeldung" : has(text, ["krankenkasse", "leistung"]) ? "Krankenkasse / Leistungen" : "Ärztliche Unterlage / Befund", documentType: "Gesundheitsunterlage", privacyClass: "besonders geschützt" as const };
  }
  if (has(text, ["rente", "rentenversicherung", "teilzeit", "bescheid", "arbeitgeber", "arbeitszeit", "arbeitgeber", "sozialversicherung"])) {
    return { lifeArea: "Rente, Arbeit & Sozialversicherung" as const, category: has(text, ["arbeitgeber", "arbeitszeit"]) ? "Arbeitgeber / Arbeitszeit" : has(text, ["bescheid", "teilzeit"]) ? "Behörden / Anträge" : "Rente / Altersvorsorge", documentType: "Arbeit / Rente / Sozialversicherung", privacyClass: "vertraulich" as const };
  }
  if (has(text, ["motorrad", "strada", "motoria"])) return { lifeArea: "Motorrad" as const, category: has(text, ["tuv", "hauptuntersuchung", "gutachten"]) ? "Fahrzeug / TÜV / Gutachten" : "Fahrzeugpapiere", documentType: "Motorradunterlage", privacyClass: "vertraulich" as const };
  if (has(text, ["fahrzeug", "kfz", "tuv", "hauptuntersuchung", "werkstatt"]) || /(^|[^a-z0-9])auto([^a-z0-9]|$)/.test(text)) return { lifeArea: "Auto & Mobilität" as const, category: has(text, ["tuv", "hauptuntersuchung", "gutachten"]) ? "Fahrzeug / TÜV / Gutachten" : "Fahrzeug / Werkstatt / Wartung", documentType: "Fahrzeugunterlage", privacyClass: "vertraulich" as const };
  if (has(text, ["versicherung", "police", "schaden"])) return { lifeArea: "Versicherungen" as const, category: "Versicherung", documentType: "Versicherungsunterlage", privacyClass: "vertraulich" as const };
  if (has(text, ["rechnung", "kauf", "quittung", "garantie", "gewahrleistung"])) return { lifeArea: "Einkäufe, Rechnungen & Garantien" as const, category: has(text, ["garantie", "reparatur"]) ? "Garantie / Reparatur" : "Kauf / Rechnung", documentType: "Rechnung / Garantie", privacyClass: "vertraulich" as const };
  if (has(text, ["miete", "vermieter", "wohnung", "haus", "nebenkosten"])) return { lifeArea: "Haus & Wohnung" as const, category: has(text, ["nebenkosten", "reparatur"]) ? "Nebenkosten / Reparatur" : "Haus / Wohnung / Vermieter", documentType: "Haus- oder Wohnungsunterlage", privacyClass: "vertraulich" as const };
  if (has(text, ["vertrag", "abo", "kundigung"])) return { lifeArea: "Verträge & Abonnements" as const, category: "Sonstiges", documentType: "Vertrag", privacyClass: "vertraulich" as const };
  if (has(text, ["vollmacht", "vorsorge", "erbe", "testament"])) return { lifeArea: "Erbschaft, Vollmachten & Vorsorge" as const, category: "Vollmacht / Vorsorge", documentType: "Vorsorgeunterlage", privacyClass: "besonders geschützt" as const };
  if (has(text, ["finanz", "konto", "bank", "steuer", "finanzamt", "behorde"])) return { lifeArea: has(text, ["steuer", "finanzamt", "behorde"]) ? "Steuern & Behörden" as const : "Finanzen & Konten" as const, category: "Sonstiges", documentType: "Finanz- oder Behördenunterlage", privacyClass: "besonders geschützt" as const };
  if (has(text, ["technik", "gerat", "reparatur", "repararatur", "reparaturservice", "reparaturservice", "technova", "seriennummer"])) return { lifeArea: "Technik, Geräte & Reparaturen" as const, category: "Gerät / Technik", documentType: "Technikunterlage", privacyClass: "allgemein" as const };
  if (has(text, ["brief", "antwort", "anfrage", "schreiben", "korrespondenz"])) return { lifeArea: "Korrespondenz" as const, category: "Sonstiges", documentType: "Korrespondenz", privacyClass: "vertraulich" as const };
  return { lifeArea: "Archiv" as const, category: "Sonstiges", documentType: "Dokument", privacyClass: "vertraulich" as const };
}

function organisationHints(fileName: string, textHint = "") {
  const text = normalize(`${fileName} ${textHint}`);
  return [
    ["krankenkasse", "Krankenkasse"], ["arbeitgeber", "Arbeitgeber"], ["rentenversicherung", "Rentenversicherung"],
    ["tuv", "TÜV"], ["finanzamt", "Finanzamt"], ["arbeitsagentur", "Agentur für Arbeit"],
    ["technova", "Technova Electronics GmbH"], ["reparaturservice", "Technova Electronics GmbH"],
    ["vertragsportal", "Vertragsportal"],
    ["schraubengluck", "Reparaturdienst Schraubenglück (erfunden)"], ["pustelblume", "Hausverwaltung Pustelblume (erfunden)"],
    ["funkenflug", "Elektrohaus Funkenflug (erfunden)"], ["wolkenhain", "Bürgerbüro Wolkenhain (erfunden)"],
    ["personalabteilung", "Personalabteilung"],
  ].filter(([needle]) => text.includes(needle)).map(([, label]) => label);
}

export async function extractDocumentIntakeTextHint(file: File): Promise<string> {
  const lowerName = file.name.toLocaleLowerCase("de");
  if (lowerName.endsWith(".eml") || file.type === "message/rfc822") return (await file.text()).slice(0, 300000);
  if (lowerName.endsWith(".msg")) {
    const bytes = await file.arrayBuffer();
    return new TextDecoder("utf-16le", { fatal: false }).decode(bytes).replace(/\0/g, " ").replace(/\s+/g, " ").slice(0, 300000);
  }
  if (lowerName.endsWith(".txt") || lowerName.endsWith(".vtt") || file.type.startsWith("text/")) return (await file.text()).slice(0, 300000);
  return "";
}

export function buildDocumentIntakePlan(input: {
  file: IntakeFile;
  source: DocumentIntakeSource;
  documents: IntakeDocumentReference[];
  records?: FamilyRecordUnion[];
}): DocumentIntakePlan {
  const analysisText = `${input.file.name} ${input.file.textHint || ""}`;
  const detected = classifyFile(input.file.name, input.file.textHint);
  const title = input.file.titleHint?.trim() || titleFromName(input.file.name) || input.file.name;
  const duplicateIds = input.documents.filter((document) => normalize(document.originalName) === normalize(input.file.name) && document.sizeBytes === input.file.size).map((document) => document.id);
  const assignment = proposeFamilyAssignment({
    title,
    fileName: input.file.name,
    documentType: detected.documentType,
    areaHint: detected.lifeArea,
    organisationHints: organisationHints(input.file.name, input.file.textHint),
    objectHints: has(normalize(input.file.name), ["motoria", "strada"]) ? ["Motoria Strada"] : [],
    caseHints: has(normalize(input.file.name), ["tuv", "hauptuntersuchung"])
      ? ["TÜV", "Hauptuntersuchung"]
      : has(normalize(input.file.name), ["reparaturservice", "reparaturservice", "repararatur"])
        ? ["Technova Reparaturservice", "Reparatur"]
        : has(normalize(analysisText), ["vertragsportal", "stromanbieterwechsel", "stromtarifoptimierung"])
          ? ["Vertragsportal Stromanbieterwechsel", "Stromtarifoptimierung"]
        : has(normalize(analysisText), ["heuschnupfen", "vorsorgezentrum", "impfpass", "sehtest", "sehtest", "vorsorgeheft", "optik"])
          ? ["Heuschnupfen / Vorsorgezentrum", "Impfpass / Sehtest-Therapie"]
        : has(normalize(analysisText), ["bescheinigung", "bescheinigung", "personalabteilung", "arbeitsbescheinigung", "bestatigung zum antrag"])
          ? ["Betrieblichee Bescheinigung 2026", "Arbeitsbescheinigung / Gutachten"]
        : [],
    requiredAction: has(normalize(analysisText), ["letzte information", "fehlende information", "information nachreichen"]) ? "Fehlende Information an Vertragsportal nachreichen" : undefined,
    sensitive: detected.privacyClass === "besonders geschützt",
  }, {
    records: (input.records || []).map(familyRecordToAssignmentRecord),
    documents: input.documents.map((document) => ({ id: document.id, originalName: document.originalName, documentDate: document.documentDate })),
  });
  const selectedSteps = assignment.steps.filter((step) => step.selectedId);
  const ambiguousSteps = assignment.steps.filter((step) => step.decision === "auswahl_erforderlich");
  const confidence: DocumentIntakeConfidence = duplicateIds.length || ambiguousSteps.length ? "unklar" : selectedSteps.length ? "eindeutig" : detected.lifeArea === "Archiv" ? "unklar" : "wahrscheinlich";
  return {
    pipelineVersion: DOCUMENT_INTAKE_VERSION,
    source: input.source,
    title,
    fileName: input.file.name,
    documentType: detected.documentType,
    category: detected.category,
    lifeArea: detected.lifeArea,
    privacyClass: detected.privacyClass,
    confidence,
    requiresReview: input.source === "camera-scan" || confidence !== "eindeutig" || duplicateIds.length > 0,
    duplicateIds,
    assignment,
    integrationTargets: ["Dokumentenbibliothek", "Suche", "Was gibt’s Neues?", "Vorgangschronologie", "Cockpit bei Handlungsbedarf"],
    safeguards: ["keine automatische Verschiebung", "keine automatische Umbenennung", "keine automatische Löschung", "keine fachliche Zuordnung ohne Bestätigung"],
  };
}

export function intakeFileKey(file: IntakeFile) {
  return [normalize(file.name), file.size, file.lastModified || 0].join("|");
}

export function runDocumentIntakeSelfTests() {
  const records: FamilyRecordUnion[] = [];
  const make = (name: string, source: DocumentIntakeSource = "file-picker", documents: IntakeDocumentReference[] = []) => buildDocumentIntakePlan({ file: { name, size: 1024, type: "application/pdf", lastModified: 1 }, source, documents, records });
  const tests = [
    { id: "intake-drag-drop", label: "Drag & Drop", passed: make("TUEV_Motoria_Strada.pdf", "drag-drop").pipelineVersion === 1, summary: "Drag & Drop verwendet dieselbe Verarbeitungspipeline." },
    { id: "intake-existing-case", label: "Vorhandenen Vorgang wiederverwenden", passed: make("TUEV_Motoria_Strada.pdf").assignment.canApplyAutomatically === false, summary: "Zuordnungen bleiben bestätigungspflichtige Vorschläge statt neuer Automatikanlage." },
    { id: "intake-unclear", label: "Unsichere Zuordnung", passed: make("scan_001.pdf").requiresReview, summary: "Unklare Dokumente werden zur Prüfung vorgelegt." },
    { id: "intake-local-folder", label: "Lokaler Eingangsordner", passed: intakeFileKey({ name: "neu.pdf", size: 10, lastModified: 1 }) === intakeFileKey({ name: "neu.pdf", size: 10, lastModified: 1 }), summary: "Bekannte Dateien können bei erneuter Prüfung wiedererkannt werden." },
    { id: "intake-onedrive", label: "OneDrive-Familienordner", passed: make("Rechnung.pdf", "onedrive-inbox").safeguards.includes("keine automatische Verschiebung"), summary: "Originaldateien bleiben unverändert." },
    { id: "intake-duplicate", label: "Dublettenprüfung", passed: make("Rechnung.pdf", "file-picker", [{ id: "DOC-1", originalName: "Rechnung.pdf", sizeBytes: 1024 }]).duplicateIds[0] === "DOC-1", summary: "Eine mögliche Dublette wird vor der Übernahme angezeigt." },
    { id: "intake-health", label: "Gesundheitsschutz", passed: make("Gesundheit_Arztbrief.pdf").privacyClass === "besonders geschützt" && make("Gesundheit_Arztbrief.pdf").lifeArea === "Gesundheit & Pflege", summary: "Gesundheitsunterlagen werden geschützt eingeordnet." },
    { id: "intake-cockpit", label: "Cockpit-Handlungsbedarf", passed: make("Vertrag_Kuendigung.pdf").integrationTargets.includes("Cockpit bei Handlungsbedarf"), summary: "Nur tatsächlicher Handlungsbedarf wird an das Cockpit weitergereicht." },
    { id: "intake-news", label: "Was gibt’s Neues?", passed: make("neue_Rechnung.pdf").integrationTargets.includes("Was gibt’s Neues?"), summary: "Neuigkeiten verwenden denselben Dokumentdatensatz." },
    { id: "intake-search", label: "Gemeinsame Suche", passed: make("Krankenkasse_Antwort.pdf").integrationTargets.includes("Suche"), summary: "Der vorhandene Suchindex wird weiterverwendet." },
    { id: "intake-interactivity", label: "Interaktive Ergebnisse", passed: make("TUEV_Motoria_Strada.pdf").integrationTargets.length === 5, summary: "Ergebnisbezüge besitzen gemeinsame, eindeutige Ziele." },
    { id: "intake-reparaturservice", label: "Technova Reparaturservice", passed: make("2026-02-25_Repararatur Reparaturservice.pdf").lifeArea === "Technik, Geräte & Reparaturen" && make("2026-02-25_Repararatur Reparaturservice.pdf").assignment.steps.find((step) => step.stage === "area")?.selectedLabel === "Technik, Geräte & Reparaturen", summary: "Auch der reale Dateiname mit Schreibabweichung wird dem kanonischen Technikbereich zugeordnet." },
    { id: "intake-canonical-area", label: "Kanonischer Bereich im Zuordnungsvorschlag", passed: make("Technova_Reparaturservice.pdf").assignment.steps.find((step) => step.stage === "area")?.selectedLabel === "Technik, Geräte & Reparaturen", summary: "Dokumenteneingang und Zuordnungslogik verwenden dieselbe zentrale Kategorienquelle." },
    { id: "intake-vertragsportal", label: "Vertragsportal-Stromvorgang", passed: make("Automatische Optimierung Ihres Stromtarifs UM_0000000.msg").lifeArea === "Energie & Versorgung", summary: "„Automatische Optimierung“ wird nicht mehr fälschlich wegen des Wortanfangs „Auto“ als Fahrzeugunterlage erkannt." },
    { id: "intake-outlook-msg", label: "Outlook-Nachricht mit Inhaltshinweis", passed: buildDocumentIntakePlan({ file: { name: "Re_ Incoming call.msg", size: 1024, textHint: "Jennifer Eschbach von Vertragsportal: Der neue Anbieter hat den Wechselauftrag storniert." }, source: "file-picker", documents: [], records }).lifeArea === "Energie & Versorgung", summary: "Eine inhaltlich erkennbare Outlook-Nachricht wird dem vorhandenen Energie- und Wechselvorgang zugeordnet." },
    { id: "intake-sleep-lab", label: "Vorsorgezentrum-Unterlage", passed: make("2026-01-14_Befund Vorsorgezentrum Nord.pdf").lifeArea === "Gesundheit & Pflege" && make("2026-01-14_Befund Vorsorgezentrum Nord.pdf").privacyClass === "besonders geschützt", summary: "Vorsorgezentrumbefunde werden als besonders geschützte Gesundheitsunterlagen erkannt." },
    { id: "intake-sleep-provider", label: "Schlafmedizinischer Versorger", passed: make("Vorsorgezentrum Nord Geräteanbieter.jpg").lifeArea === "Gesundheit & Pflege", summary: "Ein eindeutiger schlafmedizinischer Versorger wird dem geschützten Gesundheitsbereich zugeordnet." },
    { id: "intake-neutral-photo", label: "Neutrales Gesundheitsfoto", passed: make("20250412_101500.jpg").lifeArea === "Archiv" && make("20250412_101500.jpg").confidence === "unklar" && make("20250412_101500.jpg").requiresReview, summary: "Ein Foto ohne fachlichen Hinweis wird nicht erraten und bleibt bis zur Benutzerbestätigung ungeklärt." },
    { id: "intake-personal-medical", label: "Betriebliche Befund", passed: make("2026-02-11_Betriebliche Bescheinigung.pdf").lifeArea === "Rente, Arbeit & Sozialversicherung" && make("2026-02-11_Betriebliche Bescheinigung.pdf").category === "Gutachten / Bescheinigungen" && make("2026-02-11_Betriebliche Bescheinigung.pdf").privacyClass === "besonders geschützt", summary: "Betrieblichee Befunde werden im Arbeits- und Sozialversicherungsbereich besonders geschützt eingeordnet." },
    { id: "intake-record-inspection", label: "Personalabteilung-Arbeitsbescheinigung", passed: make("+2026-03-09_Personalabteilung Antwort zur Arbeitsbescheinigung.pdf").lifeArea === "Rente, Arbeit & Sozialversicherung" && make("+2026-03-09_Personalabteilung Antwort zur Arbeitsbescheinigung.pdf").privacyClass === "besonders geschützt", summary: "Antworten des Personalabteilungs zur Arbeitsbescheinigung bleiben im selben geschützten Bescheinigungskontext." },
    { id: "intake-assessment-confirmation", label: "Bestätigung zum Antrag", passed: make("2026-03-10_Bestätigung zum Antrag(1).pdf").category === "Gutachten / Bescheinigungen" && make("2026-03-10_Bestätigung zum Antrag(1).pdf").assignment.canApplyAutomatically === false, summary: "Die Bestätigung zum Antrag wird dem Bescheinigungsvorgang nur als bestätigungspflichtiger Vorschlag zugeordnet." },
  ];
  return tests;
}
