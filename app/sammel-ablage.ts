// Sammelbestätigung in der Eingangszentrale (2.28.39, Punkt 6): viele Eingänge mit einem Knopf ablegen, ohne für jeden den
// Prüfdialog zu öffnen. Abgelegt wird nur, was angehakt ist. Die Angaben entstehen genau wie im Einzel-Prüfdialog
// (Titel aus dem Briefkopf, Dokumentdatum, Bereich, Textauszug, Gesundheitsschutz); nur von Hand Geändertes fehlt.
import { briefAngaben, briefTitel, briefZeile, type BriefAngaben, type BriefkopfRoh } from "../lib/briefkopf-titel";
import { erkenneDokumentDatum, erkenneFristen, type CentralIntakeQueueItem } from "../lib/central-intake";
import { buildDocumentIntakePlan, type DocumentIntakeSource, type IntakeDocumentReference } from "../lib/document-intake";
import { isSensitiveHealthText } from "../lib/family-privacy";
import type { FamilyRecordUnion } from "../lib/family-data-model";
import { TEXTAUSZUG_MAX } from "./local-vault";

export const quelleName = (source: DocumentIntakeSource) => source === "camera-scan" ? "Foto oder Scan" : source === "onedrive-inbox" ? "OneDrive-Familienordner" : source === "local-inbox" ? "Lokaler Eingangsordner" : source === "drag-drop" ? "Hineingezogen" : "Dateiauswahl";

export type SammelLage = {
  /** Darf mit „✓ N ausgewählte ablegen“ abgelegt werden. */
  ablegbar: boolean;
  /** Sicherer Vorschlag: steht von selbst angehakt. */
  sicher: boolean;
  /** Warum nicht sicher bzw. nicht ablegbar – steht in der Zeile. */
  grund: string | null;
};

/** Ob ein Eingang in die Sammelbestätigung darf. Dubletten, zu große Dateien und Unbekanntes nur einzeln (✎). */
export function sammelLage(item: CentralIntakeQueueItem, grenzeBytes: number): SammelLage {
  const a = item.analysis;
  if (item.status === "Übernommen" || item.status === "Nicht übernommen") return { ablegbar: false, sicher: false, grund: null };
  if (!a || item.status === "Analyse läuft") return { ablegbar: false, sicher: false, grund: "wird noch gelesen" };
  if (a.plan.duplicateIds.length) return { ablegbar: false, sicher: false, grund: "mögliche Dublette – bitte einzeln prüfen (✎)" };
  if (item.error) return { ablegbar: false, sicher: false, grund: "bitte einzeln prüfen (✎)" };
  if (item.file.size > grenzeBytes) return { ablegbar: false, sicher: false, grund: "zu groß für dieses Gerät – einzeln prüfen und verkleinern (✎)" };
  if (a.fileKind === "Unbekannter Dateityp") return { ablegbar: false, sicher: false, grund: "unbekannter Dateityp – bitte einzeln prüfen (✎)" };
  if (a.plan.privacyClass === "besonders geschützt") return { ablegbar: true, sicher: false, grund: "geschützt – bitte ansehen" };
  if (!a.contentReadable) return { ablegbar: true, sicher: false, grund: "Text noch nicht gelesen – Titel ist der Dateiname" };
  // Sicher: als „Bereit zur Übernahme“ eingestuft, oder Text gelesen und Bereich wahrscheinlich (nicht „Archiv“, kein
  // Kamerafoto). „wahrscheinlich“ heißt nur, dass keine Person/Organisation aus dem Bestand passte – verknüpft wird ohnehin nichts.
  const wahrscheinlich = a.plan.confidence === "wahrscheinlich" && a.plan.lifeArea !== "Archiv" && item.source !== "camera-scan";
  if (item.status === "Zurückgestellt" || !(item.status === "Bereit zur Übernahme" || wahrscheinlich)) return { ablegbar: true, sicher: false, grund: "unsicher – bitte ansehen" };
  return { ablegbar: true, sicher: true, grund: null };
}

/** Erkannte Frist mit Datum (für das Kästchen „Frist anlegen“ in der Zeile); ohne Datum wird nichts geraten. */
export function sammelFrist(item: CentralIntakeQueueItem): string | null {
  const a = item.analysis; if (!a) return null;
  return erkenneFristen(`${a.title} ${a.contentHint}`).find((f) => f.art === "frist" && f.datum)?.datum || null;
}

export type SammelDaten = {
  category: string; documentDate: string | null; notes: string | null; assignmentLinks: [];
  titel: string | null; textAuszug: string | null;
  fristen: Array<{ recordType: "deadline"; title: string; dueAt: string }>;
};

/** Briefkopf lesen wie der Prüfdialog (briefkopf.js aus Workflow PDF); Fehler ändern nichts, es wird nichts geraten. */
export async function briefkopfAusText(text: string): Promise<{ titel: string; brief: BriefAngaben | null }> {
  if (!text.trim()) return { titel: "", brief: null };
  try {
    const { briefkopfLesen } = await import("./wfpdf-kern");
    const kopf = await briefkopfLesen(text.split(/\r?\n/));
    return { titel: briefTitel(kopf) || "", brief: briefAngaben(kopf as BriefkopfRoh) };
  } catch { return { titel: "", brief: null }; }
}

/** Dieselben Felder wie „Geprüft lokal speichern“ im Prüfdialog, ohne Änderungen von Hand. */
export function sammelDaten(input: {
  item: CentralIntakeQueueItem; text: string; briefTitel: string; brief: BriefAngaben | null; fristAnlegen: boolean;
  documents: IntakeDocumentReference[]; records: FamilyRecordUnion[];
}): SammelDaten {
  const { item, text, brief } = input;
  const plan = buildDocumentIntakePlan({ file: { name: item.file.name, size: item.file.size, type: item.file.type, lastModified: item.file.lastModified, textHint: text, titleHint: input.briefTitel || (item.analysis?.email ? item.analysis.title : undefined), brief }, source: item.source, documents: input.documents, records: input.records });
  const category = plan.category || "Sonstiges";
  const notes = [`FaWoGa: ${plan.lifeArea}`, `Dokumentart: ${plan.documentType}`, `Datenschutz: ${plan.privacyClass}`, `Eingang: ${quelleName(item.source)}`, "Intelligenter Vorschlag übernommen (Sammelbestätigung)", briefZeile(brief)].filter(Boolean).join(" · ");
  const geschuetzt = plan.lifeArea === "Gesundheit & Pflege" || isSensitiveHealthText(item.file.name, category, plan.title, text.slice(0, TEXTAUSZUG_MAX));
  const datum = brief?.datum || erkenneDokumentDatum(text) || null;
  const frist = input.fristAnlegen ? erkenneFristen(text).find((f) => f.art === "frist" && f.datum) : undefined;
  return {
    category, documentDate: datum, notes, assignmentLinks: [],
    titel: geschuetzt ? null : plan.title.trim() || null,
    textAuszug: geschuetzt ? null : text.slice(0, TEXTAUSZUG_MAX) || null,
    fristen: frist?.datum ? [{ recordType: "deadline", title: `Frist: ${plan.title.trim() || item.file.name}`, dueAt: frist.datum }] : [],
  };
}
