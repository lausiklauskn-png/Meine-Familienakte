import type { ProUebergabe } from "./pro-verbund-vertrag";
import type { UebergabeVorschlag } from "./uebergabe-vorschlaege";
import type { FamilyRecordUnion } from "./family-data-model.ts";
import {
  buildDocumentIntakePlan,
  extractDocumentIntakeTextHint,
  type DocumentIntakePlan,
  type DocumentIntakeSource,
  type IntakeDocumentReference,
} from "./document-intake.ts";

export const CENTRAL_INTAKE_VERSION = "2.28.0" as const;

export type CentralIntakeFileKind =
  | "PDF"
  | "Word-Dokument"
  | "Foto / Bild"
  | "Text / Protokoll"
  | "E-Mail (.eml)"
  | "Outlook-E-Mail (.msg)"
  | "Tabelle"
  | "Archivdatei"
  | "Unbekannter Dateityp";

export type CentralIntakeStatus =
  | "Neu"
  | "Analyse läuft"
  | "Prüfung erforderlich"
  | "Bereit zur Übernahme"
  | "Übernommen"
  | "Zurückgestellt"
  | "Nicht übernommen";

export type IntakeEmailMetadata = {
  sender: string;
  recipients: string[];
  cc: string[];
  subject: string;
  sentAt: string | null;
  messageId: string | null;
  threadHint: string | null;
  attachmentNames: string[];
};

export type CentralIntakeAnalysis = {
  version: typeof CENTRAL_INTAKE_VERSION;
  source: DocumentIntakeSource;
  fileKind: CentralIntakeFileKind;
  originalName: string;
  sizeBytes: number;
  checksum: string;
  title: string;
  date: string | null;
  contentReadable: boolean;
  contentHint: string;
  contentMessage: string;
  email: IntakeEmailMetadata | null;
  plan: DocumentIntakePlan;
  possibleTask: string | null;
  possibleDeadline: string | null;
  groupHint: string | null;
  safeguards: readonly string[];
};

export type CentralIntakeQueueItem = {
  proUebergabe?: ProUebergabe;
  uebergabeVorschlag?: UebergabeVorschlag;
  uebergabeHinweis?: string;
  id: string;
  file: Pick<File, "name" | "type" | "size" | "lastModified">;
  source: DocumentIntakeSource;
  status: CentralIntakeStatus;
  selected: boolean;
  addedAt: string;
  analysis: CentralIntakeAnalysis | null;
  error: string | null;
  parentQueueId?: string | null;
  savedDocumentId?: string | null;
  /** Ausdrücklich als „Ist dasselbe“ abgeschlossen: kein neues Dokument, der Eingang zeigt auf das vorhandene. */
  dasselbe?: boolean;
};

type FileLike = Pick<File, "name" | "size" | "type">;

const normalize = (value: string) => value.toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
const extension = (name: string) => name.toLocaleLowerCase("de").match(/\.([a-z0-9]+)$/)?.[1] || "";

export function detectCentralIntakeFileKind(file: FileLike): CentralIntakeFileKind {
  const ext = extension(file.name);
  const mime = file.type.toLocaleLowerCase("de");
  if (ext === "pdf" || mime === "application/pdf") return "PDF";
  if (["doc", "docx", "odt", "rtf"].includes(ext) || mime.includes("wordprocessingml") || mime.includes("msword")) return "Word-Dokument";
  if (["jpg", "jpeg", "png", "webp", "heic", "heif", "tif", "tiff", "bmp"].includes(ext) || mime.startsWith("image/")) return "Foto / Bild";
  if (ext === "eml" || mime === "message/rfc822") return "E-Mail (.eml)";
  if (ext === "msg" || mime === "application/vnd.ms-outlook") return "Outlook-E-Mail (.msg)";
  if (["txt", "md", "vtt", "csv"].includes(ext) || mime.startsWith("text/")) return "Text / Protokoll";
  if (["xls", "xlsx", "ods"].includes(ext) || mime.includes("spreadsheet")) return "Tabelle";
  if (["zip", "7z", "rar"].includes(ext) || mime.includes("zip")) return "Archivdatei";
  return "Unbekannter Dateityp";
}

function unfoldHeaders(value: string) {
  return value.replace(/\r?\n[\t ]+/g, " ");
}

function decodeMimeWord(value: string) {
  return value.replace(/=\?([^?]+)\?([bqBQ])\?([^?]+)\?=/g, (_all, charset: string, encoding: string, encoded: string) => {
    try {
      if (encoding.toLocaleUpperCase("de") === "B") {
        const binary = atob(encoded);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        return new TextDecoder(charset || "utf-8", { fatal: false }).decode(bytes);
      }
      return encoded.replace(/_/g, " ").replace(/=([0-9a-f]{2})/gi, (_match: string, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
    } catch { return encoded; }
  });
}

function headerValue(headers: string, name: string) {
  const match = unfoldHeaders(headers).match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return decodeMimeWord(match?.[1]?.trim() || "");
}

function addressList(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

export function parseEmlText(raw: string): { metadata: IntakeEmailMetadata; bodyText: string } {
  const split = raw.search(/\r?\n\r?\n/);
  const headers = split >= 0 ? raw.slice(0, split) : raw;
  const body = split >= 0 ? raw.slice(split).replace(/^\r?\n\r?\n/, "") : "";
  const subject = headerValue(headers, "Subject");
  const messageId = headerValue(headers, "Message-ID") || null;
  const references = headerValue(headers, "References") || headerValue(headers, "In-Reply-To") || null;
  const attachmentNames = [...raw.matchAll(/(?:filename|name)\*?=(?:UTF-8''|"?)([^";\r\n]+)/gi)]
    .map((match) => decodeURIComponent(match[1].replace(/^"|"$/g, "").trim()))
    .filter((name, index, all) => name && all.indexOf(name) === index);
  const cleanedBody = body
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r?\n--[-_a-z0-9]+[\s\S]*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    metadata: {
      sender: headerValue(headers, "From"),
      recipients: addressList(headerValue(headers, "To")),
      cc: addressList(headerValue(headers, "Cc")),
      subject,
      sentAt: headerValue(headers, "Date") || null,
      messageId,
      threadHint: references || (subject ? normalize(subject).replace(/^(re|aw|fw|wg):\s*/i, "") : null),
      attachmentNames,
    },
    bodyText: cleanedBody,
  };
}

function quotedPrintableBytes(value: string) {
  const normalized = value.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index++) {
    if (normalized[index] === "=" && /^[0-9a-f]{2}$/i.test(normalized.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(normalized.slice(index + 1, index + 3), 16));
      index += 2;
    } else bytes.push(normalized.charCodeAt(index));
  }
  return new Uint8Array(bytes);
}

function decodedAttachmentBody(body: string, transferEncoding: string) {
  if (/base64/i.test(transferEncoding)) {
    const binary = atob(body.replace(/\s+/g, ""));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  if (/quoted-printable/i.test(transferEncoding)) return quotedPrintableBytes(body);
  return new TextEncoder().encode(body);
}

export async function extractEmlAttachments(file: File): Promise<File[]> {
  if (detectCentralIntakeFileKind(file) !== "E-Mail (.eml)") return [];
  const raw = await file.text();
  const boundary = unfoldHeaders(raw.slice(0, Math.min(raw.length, 20000))).match(/boundary\s*=\s*(?:"([^"]+)"|([^;\r\n]+))/i)?.slice(1).find(Boolean)?.trim();
  if (!boundary) return [];
  const parts = raw.split(`--${boundary}`);
  const result: File[] = [];
  for (const part of parts) {
    const split = part.search(/\r?\n\r?\n/);
    if (split < 0) continue;
    const headers = part.slice(0, split);
    const body = part.slice(split).replace(/^\r?\n\r?\n/, "").replace(/\r?\n$/, "");
    const disposition = headerValue(headers, "Content-Disposition");
    const contentType = headerValue(headers, "Content-Type") || "application/octet-stream";
    const nameMatch = `${disposition};${contentType}`.match(/(?:filename|name)\*?=(?:UTF-8''|"?)([^";\r\n]+)/i);
    const name = nameMatch ? decodeURIComponent(nameMatch[1].replace(/^"|"$/g, "").trim()) : "";
    if (!name || (!/attachment/i.test(disposition) && !/filename/i.test(disposition))) continue;
    try {
      result.push(new File([decodedAttachmentBody(body, headerValue(headers, "Content-Transfer-Encoding"))], name, { type: contentType.split(";")[0].trim() }));
    } catch { /* Eine unlesbare Anlage bleibt Bestandteil der Original-E-Mail. */ }
  }
  return result;
}

async function checksum(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function titleFromName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || name;
}

function dateFromText(value: string) {
  const iso = value.match(/\b(20\d{2})[-_.](0[1-9]|1[0-2])[-_.]([0-2]\d|3[01])\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const german = value.match(/\b([0-2]?\d|3[01])\.(0?\d|1[0-2])\.(20\d{2})\b/);
  return german ? `${german[3]}-${german[2].padStart(2, "0")}-${german[1].padStart(2, "0")}` : null;
}

function findPossibleTask(value: string) {
  const text = normalize(value);
  if (/(bitte|mussen|sollen|erforderlich).{0,70}(antwort|nachreich|einreich|ruckruf|zahlen|kundig)/.test(text) || /(antwort erforderlich|unterlagen nachreichen|ruckruf erbeten)/.test(text)) return "Mögliche Aufgabe erkannt – erst nach Bestätigung anlegen";
  return null;
}

/** Ob der Text nach einer Aufgabe klingt (Antwort, Nachreichen, Zahlen …); angelegt wird nur nach Bestätigung. */
export function erkenneAufgabe(value: string) { return Boolean(findPossibleTask(value)); }

/** TT.MM.JJJJ aus JJJJ-MM-TT (Klaus 08.11.2026: Datumsformat überall deutsch). */
export function deutschesDatum(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export type ErkannteFrist = { art: "frist" | "garantie"; datum: string | null; ausschnitt: string };

const DATUM = String.raw`(?:(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])|([0-2]?\d|3[01])\.\s?(0?[1-9]|1[0-2])\.\s?(20\d{2}))`;
const isoAus = (m: RegExpMatchArray, start: number) => m[start]
  ? `${m[start]}-${m[start + 1]}-${m[start + 2]}`
  : `${m[start + 5]}-${m[start + 4].padStart(2, "0")}-${m[start + 3].padStart(2, "0")}`;

/**
 * Frist und Garantie aus dem gelesenen Text (Prüfbericht 08.11.2026: das erste Datum war oft das Rechnungsdatum).
 * Bevorzugt wird das Datum direkt nach „bis zum“, „spätestens“, „zahlbar bis“, „fällig am“, „Frist“; „Garantie bis …“
 * wird getrennt erkannt. Steht nur ein Fristwort ohne Datum da, bleibt das Datum leer – nichts wird geraten.
 */
export function erkenneFristen(value: string): ErkannteFrist[] {
  const text = value.replace(/\s+/g, " ");
  const funde: ErkannteFrist[] = [];
  const garantie = text.match(new RegExp(String.raw`(garantie|gew(?:ä|ae)hrleistung)[^.;:\n]{0,40}?\b(?:bis|endet|l(?:ä|ae)uft(?: ab)?|g(?:ü|ue)ltig bis)\s*(?:zum|am)?\s*` + DATUM, "i"));
  if (garantie) funde.push({ art: "garantie", datum: isoAus(garantie, 2), ausschnitt: garantie[0].trim().slice(0, 120) });
  const fristMuster = new RegExp(String.raw`(sp(?:ä|ae)testens(?: (?:bis )?(?:zum|am))?|zahlbar bis(?: zum)?|f(?:ä|ae)llig (?:am|bis(?: zum)?)|bis (?:zum|sp(?:ä|ae)testens)|frist(?:ende)?(?: (?:bis|endet)(?: (?:zum|am))?)?:?|einzureichen bis(?: zum)?|antworten sie bis(?: zum)?|innerhalb .{0,20}?bis(?: zum)?)\s*` + DATUM, "gi");
  const ohneGarantie = garantie ? text.replace(garantie[0], " ") : text;
  const frist = [...ohneGarantie.matchAll(fristMuster)][0]
    || ohneGarantie.match(new RegExp(String.raw`(frist|f(?:ä|ae)llig|sp(?:ä|ae)testens)[^.!?]{0,60}?` + DATUM, "i"));
  if (frist) funde.push({ art: "frist", datum: isoAus(frist, 2), ausschnitt: frist[0].trim().slice(0, 120) });
  else if (/(frist|f(?:ä|ae)llig|sp(?:ä|ae)testens|bis zum|innerhalb)/i.test(ohneGarantie)) funde.push({ art: "frist", datum: null, ausschnitt: "" });
  return funde;
}

/** Dokumentdatum aus dem gelesenen Text: „Datum“, „Kaufdatum“, „Rechnungsdatum“, „vom“ zuerst, sonst das erste Datum, das keine Frist ist. */
export function erkenneDokumentDatum(value: string): string | null {
  const text = value.replace(/\s+/g, " ");
  const benannt = text.match(new RegExp(String.raw`(?:kaufdatum|rechnungsdatum|belegdatum|ausstellungsdatum|datum|vom)\s*:?\s*` + DATUM, "i"));
  if (benannt) return isoAus(benannt, 1);
  const fristen = new Set(erkenneFristen(text).map((f) => f.datum).filter(Boolean));
  for (const m of text.matchAll(new RegExp(DATUM, "g"))) { const iso = isoAus(m, 1); if (!fristen.has(iso)) return iso; }
  return null;
}

function findPossibleDeadline(value: string) {
  const frist = erkenneFristen(value).find((f) => f.art === "frist");
  if (!frist) return null;
  return frist.datum ? `Mögliche Frist am ${deutschesDatum(frist.datum)} – erst nach Bestätigung anlegen` : "Mögliche Frist erkannt – Datum bitte prüfen";
}

export async function analyzeCentralIntakeFile(input: {
  file: File;
  source: DocumentIntakeSource;
  documents: IntakeDocumentReference[];
  records?: FamilyRecordUnion[];
  /** Text, den die App schon gelesen hat (PDF-Textebene), damit Warteschlange und Prüfdialog dasselbe zeigen. */
  gelesenerText?: string;
}): Promise<CentralIntakeAnalysis> {
  const fileKind = detectCentralIntakeFileKind(input.file);
  let contentHint = input.gelesenerText?.trim() ? input.gelesenerText : await extractDocumentIntakeTextHint(input.file);
  let email: IntakeEmailMetadata | null = null;
  if (fileKind === "E-Mail (.eml)") {
    const parsed = parseEmlText(await input.file.text());
    email = parsed.metadata;
    contentHint = [parsed.metadata.sender, parsed.metadata.subject, parsed.bodyText, ...parsed.metadata.attachmentNames].filter(Boolean).join(" ").slice(0, 300000);
  }
  const title = email?.subject || titleFromName(input.file.name);
  const plan = buildDocumentIntakePlan({
    file: { name: input.file.name, size: input.file.size, type: input.file.type, lastModified: input.file.lastModified, textHint: contentHint, titleHint: title },
    source: input.source,
    documents: input.documents,
    records: input.records,
  });
  const readable = Boolean(contentHint.trim());
  const date = dateFromText(`${title} ${contentHint}`) || (email?.sentAt ? new Date(email.sentAt).toISOString().slice(0, 10) : null);
  return {
    version: CENTRAL_INTAKE_VERSION,
    source: input.source,
    fileKind,
    originalName: input.file.name,
    sizeBytes: input.file.size,
    checksum: await checksum(input.file),
    title,
    date,
    contentReadable: readable,
    contentHint: contentHint.slice(0, 300000),
    contentMessage: uebergabeHinweis(input.file.name) || (readable ? "Inhalt wurde für den Zuordnungsvorschlag gelesen." : fileKind === "PDF" || fileKind === "Foto / Bild" ? "Text wird beim Prüfen gelesen (Texterkennung auf diesem Gerät)." : "Inhalt konnte nicht automatisch gelesen werden. Die Datei kann trotzdem manuell geprüft werden."),
    email,
    plan,
    possibleTask: findPossibleTask(`${title} ${contentHint}`),
    possibleDeadline: findPossibleDeadline(`${title} ${contentHint}`),
    groupHint: null,
    safeguards: ["Original unverändert", "keine automatische fachliche Übernahme", "keine kostenpflichtige externe API", "ein gemeinsamer Dokumentdatensatz"],
  };
}

export function groupCentralIntakeAnalyses(analyses: CentralIntakeAnalysis[]) {
  const images = analyses.filter((item) => item.fileKind === "Foto / Bild");
  if (images.length < 2) return analyses;
  const imageNames = images.map((item) => normalize(item.originalName).replace(/\d+/g, "#").replace(/\.[^.]+$/, ""));
  const common = imageNames.every((name) => name === imageNames[0]);
  return analyses.map((item) => item.fileKind === "Foto / Bild"
    ? { ...item, groupHint: common ? `Mögliche mehrseitige Aufnahme oder Fotoserie mit ${images.length} Bildern` : `Mögliche Fotoserie mit ${images.length} Bildern` }
    : item);
}

export function initialCentralIntakeStatus(analysis: CentralIntakeAnalysis): CentralIntakeStatus {
  return analysis.plan.requiresReview || analysis.fileKind === "Unbekannter Dateityp" || analysis.plan.duplicateIds.length
    ? "Prüfung erforderlich"
    : "Bereit zur Übernahme";
}

export function centralIntakeDisplayTitle(analysis: CentralIntakeAnalysis) {
  return analysis.plan.privacyClass === "besonders geschützt" ? "Geschützter Eingang" : analysis.title;
}

export async function runCentralIntakeSelfTests() {
  const named = (name: string, type: string, text = "") => new File([text], name, { type, lastModified: 1 });
  const docs: IntakeDocumentReference[] = [{ id: "DOC-1", originalName: "vorhanden.pdf", sizeBytes: 7 }];
  const eml = named("antwort.eml", "message/rfc822", "From: service@example.de\r\nTo: lindqvist@example.de\r\nSubject: Rechnung und Antwort erforderlich\r\nMessage-ID: <abc@example.de>\r\nDate: Mon, 12 Oct 2026 10:00:00 +0200\r\nContent-Type: text/plain\r\n\r\nBitte antworten Sie bis zum 20.10.2026.");
  const emlAnalysis = await analyzeCentralIntakeFile({ file: eml, source: "file-picker", documents: [], records: [] });
  const unknown = await analyzeCentralIntakeFile({ file: named("beispiel.xyz", "application/octet-stream"), source: "drag-drop", documents: [], records: [] });
  const imageGroup = groupCentralIntakeAnalyses([
    await analyzeCentralIntakeFile({ file: named("scan_001.jpg", "image/jpeg"), source: "drag-drop", documents: [], records: [] }),
    await analyzeCentralIntakeFile({ file: named("scan_002.jpg", "image/jpeg"), source: "drag-drop", documents: [], records: [] }),
  ]);
  const duplicate = await analyzeCentralIntakeFile({ file: named("vorhanden.pdf", "application/pdf", "1234567"), source: "file-picker", documents: docs, records: [] });
  const kinds: Array<[string, string, CentralIntakeFileKind]> = [
    ["a.pdf", "application/pdf", "PDF"], ["a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word-Dokument"],
    ["a.jpg", "image/jpeg", "Foto / Bild"], ["a.txt", "text/plain", "Text / Protokoll"], ["a.eml", "message/rfc822", "E-Mail (.eml)"],
    ["a.msg", "application/vnd.ms-outlook", "Outlook-E-Mail (.msg)"], ["a.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Tabelle"],
    ["a.zip", "application/zip", "Archivdatei"], ["a.xyz", "application/octet-stream", "Unbekannter Dateityp"],
  ];
  const typeTests = kinds.map(([name, type, expected], index) => ({ id: `central-type-${index + 1}`, label: `Dateityp ${expected}`, passed: detectCentralIntakeFileKind({ name, type, size: 1 }) === expected, summary: `${expected} wird ohne Vorabauswahl erkannt.` }));
  return [
    ...typeTests,
    { id: "central-eml", label: "EML-Erfassung", passed: emlAnalysis.email?.sender === "service@example.de" && emlAnalysis.email.subject === "Rechnung und Antwort erforderlich", summary: "Absender und Betreff werden aus der Original-E-Mail gelesen." },
    { id: "central-email-task", label: "E-Mail-Aufgabe", passed: Boolean(emlAnalysis.possibleTask), summary: "Handlungsbedarf wird nur als möglicher Vorschlag gekennzeichnet." },
    { id: "central-email-deadline", label: "E-Mail-Frist", passed: Boolean(emlAnalysis.possibleDeadline?.includes("20.10.2026")), summary: "Eine mögliche Frist wird erkannt (TT.MM.JJJJ), aber nicht gespeichert." },
    { id: "central-deadline-bis", label: "Frist nach „bis zum“", passed: erkenneFristen("Rechnung vom 03.11.2026. Bitte zahlen Sie bis zum 01.12.2026.").find((f) => f.art === "frist")?.datum === "2026-12-01", summary: "Das Datum nach „bis zum“ gilt, nicht das Rechnungsdatum." },
    { id: "central-garantie", label: "Garantie bis", passed: erkenneFristen("Kaufdatum: 14.07.2026 · Garantie bis 14.07.2028").find((f) => f.art === "garantie")?.datum === "2028-07-14", summary: "„Garantie bis …“ wird als eigene Frist erkannt." },
    { id: "central-email-message-id", label: "Message-ID", passed: emlAnalysis.email?.messageId === "<abc@example.de>", summary: "Die technische Nachrichtenkennung bleibt für die Dublettenprüfung erhalten." },
    { id: "central-unknown", label: "Unbekannter Dateityp", passed: unknown.fileKind === "Unbekannter Dateityp" && initialCentralIntakeStatus(unknown) === "Prüfung erforderlich", summary: "Unbekannte Dateien führen zur manuellen Prüfung statt zum Absturz." },
    { id: "central-multi-image", label: "Mehrere Bilder", passed: imageGroup.every((item) => Boolean(item.groupHint)), summary: "Mehrere Bilder werden als mögliche Serie oder mehrseitige Aufnahme markiert." },
    { id: "central-duplicate", label: "Dublettenprüfung", passed: duplicate.plan.duplicateIds.includes("DOC-1"), summary: "Vorhandene Dokumente werden vor einer Neuanlage berücksichtigt." },
    { id: "central-shared-pipeline", label: "Gemeinsame Pipeline", passed: emlAnalysis.plan.pipelineVersion === 1 && emlAnalysis.plan.integrationTargets.includes("Suche"), summary: "Alle Eingangstypen verwenden den bestehenden Dokumentenplan und seine Ansichten." },
    { id: "central-categories", label: "Kanonische Kategorien", passed: emlAnalysis.plan.lifeArea.length > 0, summary: "Eingangsart und fachlicher Lebensbereich bleiben getrennt." },
    { id: "central-original-protection", label: "Originalschutz", passed: emlAnalysis.safeguards.includes("Original unverändert"), summary: "Die Analyse enthält keine Lösch-, Verschiebe- oder Umbenennungsaktion." },
    { id: "central-assistant-release", label: "Assistenzfreigabe", passed: emlAnalysis.safeguards.includes("keine automatische fachliche Übernahme"), summary: "Eine aktive Nutzung bleibt bestätigungspflichtig." },
    { id: "central-health", label: "Gesundheitsschutz", passed: (await analyzeCentralIntakeFile({ file: named("Ärztlicher_Bericht_Erkältung.pdf", "application/pdf"), source: "drag-drop", documents: [], records: [] })).plan.privacyClass === "besonders geschützt", summary: "Sensible Unterlagen verwenden den vorhandenen Gesundheitsschutz." },
    { id: "central-onedrive", label: "OneDrive bewusst", passed: (await analyzeCentralIntakeFile({ file: named("Rechnung.pdf", "application/pdf"), source: "onedrive-inbox", documents: [], records: [] })).source === "onedrive-inbox", summary: "OneDrive bleibt ein bewusst ausgelöster Eingangsweg." },
    { id: "central-local-folder", label: "Lokaler Ordner bewusst", passed: (await analyzeCentralIntakeFile({ file: named("Brief.pdf", "application/pdf"), source: "local-inbox", documents: [], records: [] })).source === "local-inbox", summary: "Lokale Ordner bleiben ein bewusst ausgelöster Eingangsweg." },
    { id: "central-no-paid-api", label: "Keine kostenpflichtige API", passed: emlAnalysis.safeguards.includes("keine kostenpflichtige externe API"), summary: "Die Eingangszentrale arbeitet ohne externen kostenpflichtigen Schlüssel." },
  ];
}

/** Übergabepaket oder Empfangsdatei einer anderen Familienakte (U5): nicht hier ablegen, sondern im Sicherheitscenter öffnen. */
export function uebergabeHinweis(name: string): string | null {
  if (/\.familienakte-paket$/i.test(name)) return "Das ist ein Übergabepaket einer anderen Familienakte, keine Unterlage. Bitte nicht hier ablegen, sondern unter Sicherheit › „Eine Unterlage an ein anderes Gerät geben“ › „Übergabepaket öffnen“ annehmen.";
  if (/\.familienakte-quittung$/i.test(name)) return "Das ist eine Empfangsdatei zu einem Übergabepaket, keine Unterlage. Bitte unter Sicherheit › „Eine Unterlage an ein anderes Gerät geben“ › „Empfangsdatei prüfen“ öffnen.";
  return null;
}
