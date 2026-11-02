import healthData from "./health-data.json";
import type { SectionId, UploadedDocument } from "./portal-types";
import type { LocalDocument } from "./local-vault";
import { fmtDate } from "./portal-format";
import { interpretFamilySearchQuery, scoreFamilySearchText } from "../lib/family-search";
import { type FamilyRecordUnion, type FamilyRelation, recordTypeDefinitions } from "../lib/family-data-model";
import { isSensitiveHealthText, protectedFamilyLabel } from "../lib/family-privacy";
import { cockpitRecordLabel } from "../lib/family-cockpit";
import { memoryData } from "../lib/family-memory";
import { buildScheduleItems, scheduleStatusLabels } from "../lib/family-reminders";

export type SearchNavigation = Array<{ id: string; label: string; groups: Array<{ title: string; items: Array<{ id: SectionId; label: string; detail: string }> }> }>;
export type SearchResult = { id: string; section: SectionId; targetId?: string; contextCaseId?: string; title: string; detail: string; kind: string; reason: string; score: number };

function linkedCaseId(sourceId: string, relations: FamilyRelation[]) {
  const link = relations.find((relation) => (relation.fromId === sourceId && relation.toType === "case") || (relation.toId === sourceId && relation.fromType === "case"));
  return link ? (link.fromType === "case" ? link.fromId : link.toId) : undefined;
}

export function buildPortalSearchResults(topNavigation: SearchNavigation, query: string, documents: UploadedDocument[], localDocuments: LocalDocument[], records: FamilyRecordUnion[] = [], relations: FamilyRelation[] = []): SearchResult[] {
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

