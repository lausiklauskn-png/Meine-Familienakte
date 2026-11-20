import healthData from "./health-data.json";
import type { SectionId, UploadedDocument } from "./portal-types";
import type { LocalDocument } from "./local-vault";
import { fmtDate } from "./portal-format";
import { hasFamilySearchContent, interpretFamilySearchQuery, scoreFamilySearchText } from "../lib/family-search";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { isSensitiveHealthText } from "../lib/family-privacy";
import { cockpitRecordLabel } from "../lib/family-cockpit";
import { memoryData } from "../lib/family-memory";
import { buildScheduleItems, scheduleStatusLabels } from "../lib/family-reminders";
import { zielFuerDatensatz } from "../lib/menu-optimization";
import { istStammArt, stammLesen } from "../lib/familie-stamm";
import { familyDocumentSearchText, familyRecordKindLabel, familyRecordSearchText } from "../lib/family-search-text";

export type SearchNavigation = Array<{ id: string; label: string; groups: Array<{ title: string; items: Array<{ id: SectionId; label: string; detail: string }> }> }>;
/** library: Treffer öffnet die Dokumentenbibliothek mit diesem Filter (z. B. zusammengefasste Gesundheitsunterlagen). */
export type SearchResult = { id: string; section: SectionId; targetId?: string; contextCaseId?: string; title: string; detail: string; kind: string; group: string; reason: string; score: number; date?: string | null; /** kurze Angabe für die Trefferzeile (Bereich oder Art), 2.28.39 */ bereich?: string; library?: { area?: string; query?: string } };
export type SearchResultGroup = { name: string; items: SearchResult[] };
/** beispiele: nur in der Demo bzw. bei vorhandener Beispielfamilie werden die festen Beispielangaben (health-data.json) durchsucht. */
export type PortalSearchOptions = { beispiele?: boolean; now?: Date };

export const SEARCH_AREA_GROUP = "Bereiche der App";

function linkedCaseId(sourceId: string, relations: FamilyRelation[]) {
  const link = relations.find((relation) => (relation.fromId === sourceId && relation.toType === "case") || (relation.toId === sourceId && relation.fromType === "case"));
  return link ? (link.fromType === "case" ? link.fromId : link.toId) : undefined;
}

const healthRecordPattern = /(gesund|arzt|medizin|diagnos|krank|krankenkasse|rente|physio|pflege|heuschnupfen|erkält|rücken)/i;

/** 2.28.75 (Klaus 19.11.: „Fahrzeuggarantie“ → alles zur Garantie des Fahrzeugs): findet ein zusammengesetztes Wort nichts,
 * wird es einmal in zwei Teile zerlegt („Fahrzeug Garantie“, Fugen-s fällt weg) und damit gesucht. Nur die Hülle der Suche;
 * die Wortsuche selbst (lib/family-search) bleibt unverändert. */
export function buildPortalSearchResults(topNavigation: SearchNavigation, query: string, documents: UploadedDocument[], localDocuments: LocalDocument[], records: FamilyRecordUnion[] = [], relations: FamilyRelation[] = [], options: PortalSearchOptions = {}): SearchResult[] {
  const direkt = suchenEinmal(topNavigation, query, documents, localDocuments, records, relations, options);
  if (direkt.some((r) => r.group !== SEARCH_AREA_GROUP)) return direkt;
  const woerter = query.trim().split(/\s+/);
  for (let w = 0; w < woerter.length; w++) {
    const wort = woerter[w]; if (wort.length < 9) continue;
    for (let i = 4; i <= wort.length - 4; i++) {
      const links = wort.slice(0, i).replace(/s$/i, ""); const rechts = wort.slice(i);
      if (links.length < 4) continue;
      const neu = [...woerter.slice(0, w), links, rechts, ...woerter.slice(w + 1)].join(" ");
      const treffer = suchenEinmal(topNavigation, neu, documents, localDocuments, records, relations, options);
      if (treffer.some((r) => r.group !== SEARCH_AREA_GROUP)) return treffer;
    }
  }
  return direkt;
}

function suchenEinmal(topNavigation: SearchNavigation, query: string, documents: UploadedDocument[], localDocuments: LocalDocument[], records: FamilyRecordUnion[] = [], relations: FamilyRelation[] = [], options: PortalSearchOptions = {}): SearchResult[] {
  const interpretation = interpretFamilySearchQuery(query, options.now); if (!hasFamilySearchContent(interpretation) && !interpretation.intents.length) return [];
  const candidates: SearchResult[] = [];
  const add = (result: Omit<SearchResult, "score">, searchable: string, dates: Array<string | null | undefined> = []) => { const score = scoreFamilySearchText(searchable, interpretation, dates); if (score) candidates.push({ ...result, score }); };
  interpretation.intents.forEach((intent, index) => candidates.push({
    id: `intent-${intent.id}`, section: intent.section as SectionId, title: intent.label, detail: intent.detail,
    kind: intent.kind, group: SEARCH_AREA_GROUP, reason: intent.reason, score: 100 - index,
  }));
  topNavigation.forEach((area) => area.groups.forEach((group) => group.items.forEach((item) => add(
    { id: `nav-${area.id}-${item.label}`, section: item.id, title: item.label, detail: `${area.label} · ${item.detail}`, kind: "Bereich", group: SEARCH_AREA_GROUP, reason: "Passender Bereich oder Hilfetext", bereich: area.label },
    [area.label, group.title, item.label, item.detail].join(" "),
  ))));
  if (options.beispiele) {
    healthData.currentDiagnoses.forEach((item) => add(
      { id: `diag-${item.area}-${item.codes}`, section: "medical", title: "Geschützte Diagnose", detail: "Einzelheiten im geschützten Gesundheitsbereich", kind: "Diagnose", group: "Diagnose", reason: "Passende Diagnose, ICD-Code oder ärztlicher Beleg" },
      [item.area, item.codes, item.diagnosis, item.evidence, item.status].join(" "),
    ));
    healthData.doctors.forEach((item) => add(
      { id: `doctor-${item.name}`, section: "medical", title: "Behandelnde Praxis", detail: "Einzelheiten im geschützten Gesundheitsbereich", kind: "Arzt/Praxis", group: "Arzt/Praxis", reason: "Passende behandelnde Stelle" },
      [item.name, item.field, item.confirmed, item.open].join(" "),
    ));
    healthData.correspondence.forEach((item) => add(
      { id: `letter-${item.date}-${item.subject}`, section: "correspondence", title: item.subject, detail: `${item.date} · ${item.answer}`, kind: "Schriftverkehr", group: "Schriftverkehr", reason: "Passendes Schreiben oder beantwortetes Anliegen" },
      [item.date, item.type, item.subject, item.request, item.answer, item.status].join(" "),
    ));
    healthData.sickPay.forEach((item) => add(
      { id: `pay-${item.period}`, section: "benefits", title: `Leistung ${item.period}`, detail: `${item.group} · ${item.clarification}`, kind: "Leistung", group: "Leistung", reason: "Passender Leistungszeitraum" },
      [item.period, item.group, item.amount, item.clarification, "Krankenkasse Leistung Zahlung"].join(" "),
    ));
    healthData.workHistory.forEach((item) => add(
      { id: `work-${item.period}-${item.entry}`, section: "work", title: `${item.period} · ${item.entry}`, detail: item.assessment, kind: "Arbeit", group: "Arbeit", reason: "Passender Arbeitszeit- oder Belastungseintrag" },
      [item.period, item.entry, item.assessment, "Arbeitgeber Arbeit Arbeitszeit"].join(" "),
    ));
  }
  // Geschützte Gesundheitsunterlagen: ein zusammengefasster Treffer statt N gleich lautender Zeilen.
  const healthDocs: Array<{ score: number; date: string | null }> = [];
  [...localDocuments, ...documents].forEach((item) => {
    const geschuetzt = isSensitiveHealthText(item.originalName, item.category, item.notes);
    const lokal = item as Partial<LocalDocument>;
    // Titel aus dem Prüfdialog (2.28.39) mitsuchen und zeigen; geschützte Unterlagen bleiben beim Dateinamen.
    const titel = !geschuetzt && lokal.titel ? lokal.titel : item.originalName;
    const searchable = familyDocumentSearchText(geschuetzt
      ? { id: item.id, originalName: item.originalName, category: item.category, documentDate: item.documentDate, notes: item.notes }
      : { ...item, originalName: titel === item.originalName ? item.originalName : `${titel} ${item.originalName}` });
    if (geschuetzt) {
      const score = scoreFamilySearchText(searchable, interpretation, [item.documentDate]);
      if (score) healthDocs.push({ score, date: item.documentDate });
      return;
    }
    add(
      { id: `doc-${item.id}`, section: "documents", targetId: item.id, contextCaseId: linkedCaseId(item.id, relations), title: titel, detail: `${item.category} · ${fmtDate(item.documentDate)}`, kind: "Dokument", group: "Dokumente", reason: "Dateiname, Kategorie, Datum, Beschreibung oder Textauszug passen", date: item.documentDate, bereich: item.category || undefined },
      searchable, [item.documentDate],
    );
  });
  if (healthDocs.length) {
    const newest = healthDocs.map((item) => item.date).filter((value): value is string => !!value).sort().pop() || null;
    candidates.push({
      id: "health-documents", section: "documents", title: `${healthDocs.length} geschützte Gesundheitsunterlage${healthDocs.length === 1 ? "" : "n"}`,
      detail: `Namen bleiben geschützt${newest ? ` · neueste vom ${fmtDate(newest)}` : ""} · in der Bibliothek nach Datum`, kind: "Dokument", group: "Dokumente",
      reason: "Passende Gesundheitsunterlagen, zusammengefasst", score: Math.max(...healthDocs.map((item) => item.score)), date: newest, bereich: "Gesundheit & Pflege",
      library: { area: "Gesundheit & Pflege", query },
    });
  }
  let healthRecords = 0; let healthRecordScore = 0;
  const now = options.now || new Date();
  // Gelöschte und umgezogene (archivierte) Einträge erscheinen nicht: eine Zeile je Aufgabe (2.28.39).
  records.filter((record) => record.status !== "archiviert").forEach((record) => {
    const title = cockpitRecordLabel(record);
    const memory = memoryData(record);
    const searchable = familyRecordSearchText(record);
    const sensitive = memory?.sensitive || healthRecordPattern.test(`${title} ${record.source || ""} ${record.notes || ""}`);
    if (sensitive) {
      const score = scoreFamilySearchText(searchable, interpretation);
      if (score) { healthRecords += 1; healthRecordScore = Math.max(healthRecordScore, score); }
      return;
    }
    const schedule = ["deadline", "task", "reminder"].includes(record.recordType) ? buildScheduleItems([record], [], now)[0] : null;
    const kind = familyRecordKindLabel(record);
    const date = schedule?.date ? schedule.date.slice(0, 10) : memory?.eventAt ? memory.eventAt.slice(0, 10) : null;
    const detail = memory ? `${memory.lifeArea} · ${memory.eventType}${date ? ` · ${fmtDate(date)}` : ""}` : schedule ? `${scheduleStatusLabels[schedule.displayStatus]} · ${schedule.date ? fmtDate(schedule.date.slice(0, 10)) : "ohne Datum"}` : record.status;
    const bereich = memory ? memory.lifeArea : schedule ? scheduleStatusLabels[schedule.displayStatus] : istStammArt(record.recordType) ? stammLesen(record).art || kind : kind;
    // U6: dieselbe Zuordnung wie Startseite, Cockpit und Verknüpfungen (lib/menu-optimization.ts zielFuerDatensatz).
    const ziel = zielFuerDatensatz(record.recordType, record.id, { tagebuch: Boolean(memory) });
    add(
      { id: `record-${record.id}`, section: ziel.section as SectionId, targetId: ziel.targetId, contextCaseId: record.recordType === "case" ? record.id : linkedCaseId(record.id, relations), title, detail, kind, group: kind, reason: memory ? "Passender Tagebucheintrag" : "Passender Eintrag aus der Familienakte", date, bereich },
      searchable,
    );
  });
  // 2.28.75 (Klaus 19.11.: „‚Klaus‘ eingeben → alles zu der Person“): passt der Name einer Person, steht oben „Alles zu …“
  // (öffnet ihren Steckbrief unter Familie & Personen), und was mit ihr verknüpft ist, kommt mit in die Treffer –
  // auch wenn der Name in der Unterlage selbst nicht vorkommt. Geschützte Gesundheitseinträge bleiben zusammengefasst.
  records.filter((r) => r.recordType === "person" && r.status !== "archiviert").forEach((person) => {
    const name = stammLesen(person).name; if (!name) return;
    const punkte = scoreFamilySearchText(name, interpretation); if (!punkte) return;
    const alt = candidates.findIndex((c) => c.id === `record-${person.id}`); if (alt >= 0) candidates.splice(alt, 1);
    candidates.push({ id: `person-${person.id}`, section: "family", targetId: person.id, title: `Alles zu ${name}`, detail: "Steckbrief, Akten, Unterlagen, Termine und Tagebuch", kind: "Person", group: "Personen", reason: "Passende Person", score: punkte + 60, bereich: "Person" });
    const verknuepft = new Set(relations.flatMap((rel) => rel.fromId === person.id ? [rel.toId] : rel.toId === person.id ? [rel.fromId] : []));
    verknuepft.forEach((id) => {
      const vorhanden = candidates.find((c) => c.targetId === id && c.section !== "family");
      if (vorhanden) { vorhanden.score = Math.max(vorhanden.score, punkte + 1); vorhanden.reason = `Gehört zu ${name}`; return; }
      const doc = [...localDocuments, ...documents].find((d) => d.id === id);
      if (doc) {
        if (isSensitiveHealthText(doc.originalName, doc.category, doc.notes)) return;
        const titel = (doc as Partial<LocalDocument>).titel || doc.originalName;
        candidates.push({ id: `doc-${doc.id}`, section: "documents", targetId: doc.id, contextCaseId: linkedCaseId(doc.id, relations), title: titel, detail: `${doc.category} · ${fmtDate(doc.documentDate)}`, kind: "Dokument", group: "Dokumente", reason: `Gehört zu ${name}`, score: punkte + 1, date: doc.documentDate, bereich: doc.category });
        return;
      }
      const rec = records.find((r) => r.id === id && r.status !== "archiviert");
      if (!rec || rec.recordType === "person") return;
      const titel = cockpitRecordLabel(rec); const memory = memoryData(rec);
      if (memory?.sensitive || healthRecordPattern.test(`${titel} ${rec.source || ""} ${rec.notes || ""}`)) return;
      const ziel = zielFuerDatensatz(rec.recordType, rec.id, { tagebuch: Boolean(memory) });
      const kind = familyRecordKindLabel(rec);
      candidates.push({ id: `record-${rec.id}`, section: ziel.section as SectionId, targetId: ziel.targetId, contextCaseId: rec.recordType === "case" ? rec.id : linkedCaseId(rec.id, relations), title: titel, detail: kind, kind, group: kind, reason: `Gehört zu ${name}`, score: punkte + 1, bereich: kind });
    });
  });
  if (healthRecords) candidates.push({ id: "health-records", section: "health", title: `${healthRecords} geschützte${healthRecords === 1 ? "r" : ""} Gesundheitseintr${healthRecords === 1 ? "ag" : "äge"}`, detail: "Einzelheiten im geschützten Gesundheitsbereich", kind: "Gesundheit", group: "Gesundheit", reason: "Passende Gesundheitseinträge, zusammengefasst", score: healthRecordScore });
  // „Erinnerung: X“ neben der Frist/Aufgabe „X“ verdoppelt nur die Liste; die Erinnerung steht bei ihrer Frist.
  const terminTitel = new Set(candidates.filter((item) => item.kind === "Frist" || item.kind === "Aufgabe").map((item) => item.title));
  const ohneDoppel = candidates.filter((item) => !(item.kind === "Erinnerung" && terminTitel.has(item.title.replace(/^Erinnerung:\s*/, ""))));
  const unique = [...new Map(ohneDoppel.map((item) => [`${item.section}-${item.targetId || ""}-${item.title}`, item])).values()];
  // Neueste zuerst bei gleicher Punktzahl; alle Treffer bleiben erreichbar (keine Kappung).
  return unique.sort((a, b) => b.score - a.score || (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title, "de"));
}

/** Treffer nach Art gruppieren; Datengruppen nach bestem Treffer, die Bereiche der App zuletzt.
 * Innerhalb einer Datengruppe neueste zuerst (Punkt 9, 2.28.39); Einträge ohne Datum danach, nach Treffergüte. */
export function groupSearchResults(results: SearchResult[]): SearchResultGroup[] {
  const groups = new Map<string, SearchResult[]>();
  results.forEach((item) => { const list = groups.get(item.group) || []; list.push(item); groups.set(item.group, list); });
  groups.forEach((items, name) => { if (name !== SEARCH_AREA_GROUP) items.sort((a, b) => Number(!a.date) - Number(!b.date) || (b.date || "").localeCompare(a.date || "") || b.score - a.score || a.title.localeCompare(b.title, "de")); });
  const best = (items: SearchResult[]) => Math.max(...items.map((item) => item.score));
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
    .sort((a, b) => Number(a.name === SEARCH_AREA_GROUP) - Number(b.name === SEARCH_AREA_GROUP) || best(b.items) - best(a.items) || a.name.localeCompare(b.name, "de"));
}
