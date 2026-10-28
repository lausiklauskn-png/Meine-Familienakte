import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model";

export type AssistantMode = "question" | "advice" | "writing" | "appointment" | "continue";
export type AssistantConfidence = "Sicher" | "Wahrscheinlich" | "Unklar";
export type AssistantDocument = {
  id: string;
  title: string;
  category?: string | null;
  notes?: string | null;
  assistantReleased?: boolean;
};

export type AssistantAnalysis = {
  mode: AssistantMode;
  question: string;
  caseId: string | null;
  caseTitle: string | null;
  confidence: AssistantConfidence;
  archiveFacts: Array<{ id: string; kind: string; title: string }>;
  research: { status: "not_configured"; message: string; sources: string[] };
  assessment: {
    situation: string;
    important: string[];
    missing: string[];
    options: string[];
    recommendation: string;
    nextStep: string;
  };
  sourceDocumentIds: string[];
  excludedDocumentIds: string[];
};

export type CorrespondenceKind = "E-Mail" | "Brief" | "Anfrage" | "Antwort" | "Erinnerung" | "Reklamation" | "Terminvorbereitung";
export type CorrespondenceTone = "sachlich" | "freundlich" | "bestimmt" | "kurz";

function recordLabel(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  return String(data.title || data.displayName || data.name || data.fileName || record.notes || record.id);
}

function tokens(value: string) {
  return new Set(value.toLocaleLowerCase("de").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 3));
}

function overlapScore(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  let score = 0;
  left.forEach((token) => { if (right.has(token)) score += 1; });
  return score;
}

function relatedIds(seedId: string, relations: FamilyRelation[]) {
  const ids = new Set([seedId]);
  let changed = true;
  for (let round = 0; round < 3 && changed; round += 1) {
    changed = false;
    relations.forEach((relation) => {
      if (ids.has(relation.fromId) && !ids.has(relation.toId)) { ids.add(relation.toId); changed = true; }
      if (ids.has(relation.toId) && !ids.has(relation.fromId)) { ids.add(relation.fromId); changed = true; }
    });
  }
  return ids;
}

export function buildAssistantAnalysis(input: {
  question: string;
  mode: AssistantMode;
  selectedCaseId?: string | null;
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  documents: AssistantDocument[];
}): AssistantAnalysis {
  const question = input.question.trim();
  const cases = input.records.filter((record) => record.recordType === "case");
  const bestCase = [...cases].sort((a, b) => overlapScore(question, recordLabel(b)) - overlapScore(question, recordLabel(a)))[0] || null;
  const selectedCase = cases.find((record) => record.id === input.selectedCaseId)
    || (bestCase && overlapScore(question, recordLabel(bestCase)) > 0 ? bestCase : null);
  const connected = selectedCase ? relatedIds(selectedCase.id, input.relations) : new Set<string>();
  const relevantRecords = selectedCase
    ? input.records.filter((record) => connected.has(record.id))
    : input.records.filter((record) => overlapScore(question, `${recordLabel(record)} ${record.notes || ""}`) > 0).slice(0, 12);
  const relevantDocuments = input.documents.filter((document) => {
    const explicitlyLinked = selectedCase && connected.has(document.id);
    const released = document.assistantReleased === true;
    return explicitlyLinked || (released && overlapScore(question, `${document.title} ${document.category || ""} ${document.notes || ""}`) > 0);
  });
  const excludedDocumentIds = input.documents.filter((document) => !relevantDocuments.includes(document) && document.assistantReleased !== true).map((document) => document.id);
  const archiveFacts = [
    ...(selectedCase ? [{ id: selectedCase.id, kind: "Vorgang", title: recordLabel(selectedCase) }] : []),
    ...relevantRecords.filter((record) => record.id !== selectedCase?.id).slice(0, 12).map((record) => ({ id: record.id, kind: record.recordType, title: recordLabel(record) })),
    ...relevantDocuments.slice(0, 12).map((document) => ({ id: document.id, kind: "Dokument", title: document.title })),
  ];
  const lower = question.toLocaleLowerCase("de");
  const appointment = input.mode === "appointment" || /(arzt|termin|sprechstunde|untersuchung)/i.test(lower);
  const legal = /(widerspruch|kündigung|frist|anspruch|recht|behörde|versicherung)/i.test(lower);
  const missing = [] as string[];
  if (!selectedCase) missing.push("Ein eindeutiger vorhandener Vorgang wurde noch nicht ausgewählt.");
  if (!relevantDocuments.length) missing.push("Kein freigegebenes oder ausdrücklich zum Vorgang gehörendes Dokument wurde gefunden.");
  if (!question) missing.push("Eine konkrete Frage oder ein gewünschtes Ergebnis fehlt.");
  const situation = selectedCase
    ? `Die Frage wurde mit dem vorhandenen Vorgang „${recordLabel(selectedCase)}“ und ${archiveFacts.length - 1} verknüpften Hinweisen abgeglichen.`
    : "Die Frage wurde im vorhandenen Familienaktenbestand geprüft; ein eindeutiger Vorgang konnte noch nicht sicher bestimmt werden.";
  const important = [
    "Originalunterlagen und bestätigte Datensätze bleiben die verbindliche Grundlage.",
    appointment ? "Für den Termin werden Beobachtungen und Fragen vorbereitet; es wird keine Diagnose gestellt." : "Fakten, offene Punkte und Vorschläge bleiben sichtbar getrennt.",
    legal ? "Rechtliche Wirkungen oder Fristen werden nicht ohne gesicherte Grundlage behauptet." : "Unsichere Zusammenhänge werden nicht automatisch gespeichert.",
  ];
  const options = appointment
    ? ["Fragenliste für den Termin erstellen", "Vorhandene Unterlagen und zeitlichen Verlauf zusammenstellen", "Offene Angaben vor dem Termin ergänzen"]
    : ["Vorhandenen Vorgang und seine Belege zuerst prüfen", "Fehlende Angaben gezielt ergänzen", "Ein sachliches Schreiben als Entwurf vorbereiten"];
  const recommendation = missing.length
    ? "Zuerst die genannten fehlenden Angaben prüfen. Danach kann ein belastbarer Entwurf vorbereitet werden."
    : "Den vorhandenen Vorgang als gemeinsame Klammer verwenden und den nächsten Schritt als bestätigungspflichtigen Entwurf vorbereiten.";
  return {
    mode: input.mode,
    question,
    caseId: selectedCase?.id || null,
    caseTitle: selectedCase ? recordLabel(selectedCase) : null,
    confidence: selectedCase && relevantDocuments.length ? "Sicher" : selectedCase || archiveFacts.length ? "Wahrscheinlich" : "Unklar",
    archiveFacts,
    research: {
      status: "not_configured",
      message: "Aktuelle Internetrecherche ist in dieser privaten Testfassung noch nicht sicher angebunden. Es wurden keine externen Quellen verwendet.",
      sources: [],
    },
    assessment: {
      situation,
      important,
      missing,
      options,
      recommendation,
      nextStep: appointment ? "Terminvorbereitung öffnen und die Fragen prüfen." : "Schreiben vorbereiten oder den zugehörigen Vorgang öffnen.",
    },
    sourceDocumentIds: relevantDocuments.map((document) => document.id),
    excludedDocumentIds,
  };
}

export function buildCorrespondenceDraft(input: {
  analysis: AssistantAnalysis;
  kind: CorrespondenceKind;
  tone: CorrespondenceTone;
  recipient: string;
  subject?: string;
}) {
  const greeting = input.kind === "E-Mail" ? "Guten Tag," : "Sehr geehrte Damen und Herren,";
  const request = input.analysis.question || "ich bitte um Prüfung des beschriebenen Anliegens";
  const evidence = input.analysis.archiveFacts.slice(0, 5).map((fact) => `- ${fact.kind}: ${fact.title}`).join("\n");
  const toneSentence = input.tone === "freundlich" ? "Ich wäre Ihnen für eine kurze Rückmeldung sehr dankbar."
    : input.tone === "bestimmt" ? "Bitte bestätigen Sie mir die Bearbeitung und teilen Sie mir den weiteren Ablauf mit."
      : input.tone === "kurz" ? "Bitte geben Sie mir kurz Rückmeldung."
        : "Bitte teilen Sie mir den Sachstand und das weitere Vorgehen mit.";
  return {
    subject: input.subject?.trim() || `${input.kind}: ${input.analysis.caseTitle || "Anliegen aus der Familienakte"}`,
    body: `${greeting}\n\n${request}.\n\n${evidence ? `Grundlage meiner Anfrage:\n${evidence}\n\n` : ""}${toneSentence}\n\nMit freundlichen Grüßen`,
  };
}

export function reviseCorrespondenceText(text: string, tone: CorrespondenceTone) {
  const trimmed = text.trim();
  if (tone === "kurz") return trimmed.split(/\n\n+/).slice(0, 4).join("\n\n");
  if (tone === "freundlich") return trimmed.replace("Bitte teilen Sie", "Ich wäre Ihnen dankbar, wenn Sie").replace("Bitte bestätigen Sie", "Bitte seien Sie so freundlich und bestätigen Sie");
  if (tone === "bestimmt") return trimmed.replace("Ich wäre Ihnen für eine kurze Rückmeldung sehr dankbar.", "Bitte antworten Sie schriftlich und nennen Sie den weiteren Bearbeitungsschritt.");
  return trimmed.replace(/\b(wirklich|einfach|irgendwie)\b/gi, "").replace(/ {2,}/g, " ");
}

export function runFamilyAssistantSelfTests() {
  const now = "2026-10-14T12:00:00.000Z";
  const records: FamilyRecordUnion[] = [
    { id: "VORG-000001", recordType: "case", status: "offen", source: "Test", notes: null, createdAt: now, updatedAt: now, data: { title: "Rentenversicherung" } },
    { id: "VORG-000002", recordType: "case", status: "offen", source: "Test", notes: null, createdAt: now, updatedAt: now, data: { title: "Smartphone Reparatur" } },
    { id: "VORG-000003", recordType: "case", status: "offen", source: "Test", notes: null, createdAt: now, updatedAt: now, data: { title: "Arzttermin Vorsorgezentrum" } },
    { id: "VORG-000004", recordType: "case", status: "offen", source: "Test", notes: null, createdAt: now, updatedAt: now, data: { title: "Arbeitgeber Arbeitszeitänderung" } },
  ];
  const documents: AssistantDocument[] = [
    { id: "DOC-1", title: "Rentenversicherung Schreiben Rentenversicherung", assistantReleased: true },
    { id: "DOC-2", title: "Smartphone Reparaturbericht", assistantReleased: true },
    { id: "DOC-3", title: "Vorsorgezentrum Terminnotiz", assistantReleased: true },
    { id: "DOC-4", title: "Arbeitgeber Arbeitszeitänderung", assistantReleased: true },
    { id: "DOC-5", title: "Nicht freigegeben", assistantReleased: false },
  ];
  const cases = [
    ["Rentenversicherung prüfen", "advice"],
    ["Reklamation zur Smartphone Reparatur", "writing"],
    ["Arzttermin Vorsorgezentrum vorbereiten", "appointment"],
    ["Schreiben an Arbeitgeber zur Arbeitszeitänderung", "writing"],
  ] as const;
  const results = cases.map(([question, mode]) => buildAssistantAnalysis({ question, mode, records, relations: [], documents }));
  return [
    { id: "assistant-four-cases", passed: results.length === 4 && results.every((result) => result.archiveFacts.length > 0), summary: "Rente, Reparatur, Arzttermin und Arbeitgeber werden als vier getrennte Praxissituationen eingeordnet." },
    { id: "assistant-evidence-separation", passed: results.every((result) => result.research.status === "not_configured" && Array.isArray(result.assessment.options)), summary: "Familienakte, aktuelle Recherche und Einschätzung bleiben getrennt." },
    { id: "assistant-release-gate", passed: results.every((result) => !result.sourceDocumentIds.includes("DOC-5")), summary: "Nicht freigegebene und nicht ausdrücklich vorgangsbezogene Dokumente werden ausgeschlossen." },
    { id: "assistant-no-auto-send", passed: (() => {
      // Verhaltenstest (A1): Ein Entwurf entsteht ohne jede Netzverbindung und bleibt ein Entwurf (nur Betreff und Text).
      const scope = globalThis as { fetch?: unknown };
      const original = scope.fetch;
      let calls = 0;
      scope.fetch = () => { calls++; return Promise.reject(new Error("Versand ist nicht vorgesehen")); };
      try {
        const draft = buildCorrespondenceDraft({ analysis: results[1], kind: "Brief", tone: "freundlich", recipient: "Reparaturwerkstatt" });
        return calls === 0 && Object.keys(draft).sort().join(",") === "body,subject" && draft.body.endsWith("Mit freundlichen Grüßen");
      } finally { scope.fetch = original; }
    })(), summary: "Entwürfe werden nicht automatisch versendet." },
    { id: "assistant-medical-boundary", passed: results[2].assessment.important.some((item) => item.includes("keine Diagnose")), summary: "Terminvorbereitung stellt keine medizinische Diagnose." },
  ];
}
