import { getVaultSummary, inventoryTextHint, readLocalDocumentFile, readLocalVaultData } from "./local-vault";
import { loadPdfJs } from "./file-viewer";
import { cockpitRecordLabel } from "../lib/family-cockpit";
import { memoryData } from "../lib/family-memory";
import { isSensitiveHealthText, protectedFamilyLabel } from "../lib/family-privacy";
import type { MeaningDocument } from "./private-meaning-index";
import type { SectionId } from "./portal-types";
export type MeaningTarget = { title: string; section: SectionId; targetId: string };
export type MeaningCorpus = { scope: string; documents: MeaningDocument[]; targets: Map<string, MeaningTarget>; metadataOnly: number; partial: number };

async function pdfLayer(file: File, check: () => void) {
  const library = await loadPdfJs(); check();
  type TextPdf = { numPages: number; getPage: (page: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }>; destroy: () => Promise<void> };
  const pdf = await library.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise as unknown as TextPdf;
  try {
    const count = Math.min(60, pdf.numPages), texts: string[] = []; let length = 0;
    for (let i = 0; i < count; i++) {
      check(); const page = count < pdf.numPages ? 1 + Math.round(i * (pdf.numPages - 1) / (count - 1)) : i + 1;
      const text = (await (await pdf.getPage(page)).getTextContent()).items.map(item => item.str || "").join(" ");
      texts.push(text.slice(0, Math.max(0, 300000 - length))); length += text.length;
      if (length >= 300000) break;
    }
    return { text: texts.join("\n"), partial: pdf.numPages > 60 || length >= 300000 };
  } finally { await pdf.destroy(); }
}

/** Read only after the user's search/index command. No stored plaintext copy, no external extraction service, no automatic
 * scan of unrelated folders. OCR (Stufe G) only on request of the index build, on this device, for documents without text. */
/** Text eines Dokuments für den Index: Angaben plus gelesener oder erkannter Inhalt. */
export function indexText(document: { originalName: string; category: string; documentDate: string | null; notes: string | null; titel?: string | null; textAuszug?: string | null }, gelesen: string) {
  return [document.titel, document.originalName, document.category, document.documentDate, document.notes, gelesen.trim() || document.textAuszug || ""].filter(Boolean).join("\n");
}
export async function readMeaningCorpus(handle: FileSystemDirectoryHandle, check: () => void, opt: { ocr?: (file: File) => Promise<string> } = {}): Promise<MeaningCorpus> {
  check(); const scope = (await getVaultSummary(handle)).vaultId, data = await readLocalVaultData(handle); check();
  const documents: MeaningDocument[] = [], targets = new Map<string, MeaningTarget>(); let metadataOnly = 0, partial = 0;
  for (const document of data.documents) {
    check(); const file = await readLocalDocumentFile(handle, document.id); check();
    let text = "", limited = false;
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      try { const result = await pdfLayer(file, check); text = result.text; limited = result.partial; } catch { text = ""; }
    } else {
      const result = await inventoryTextHint(file); text = result.textHint;
      limited = result.contentStatus === "teilweise_gelesen" || text.length >= 300000;
    }
    // Stufe G (Entscheidung 10): gescannte Seiten – der beim Eingang erkannte Text (textAuszug) zählt mit; fehlt er (z. B.
    // Gesundheitsunterlagen, dort wird er nicht gespeichert), liest die Texterkennung hier einmal für den Index auf dem Gerät.
    if (!text.trim() && document.textAuszug) text = document.textAuszug;
    if (!text.trim() && opt.ocr && (file.type === "application/pdf" || /\.(pdf|png|jpe?g|webp)$/i.test(file.name))) { try { text = (await opt.ocr(file)).slice(0, 300000); } catch { text = ""; } }
    check(); if (!text.trim()) metadataOnly++; if (limited) partial++;
    const id = "d:" + document.id;
    documents.push({ id, text: indexText(document, text) });
    const sensitive = isSensitiveHealthText(document.originalName, document.category, document.notes);
    targets.set(id, { targetId: document.id, section: sensitive ? "health" : "documents", title: protectedFamilyLabel({ label: document.originalName, category: document.category, notes: document.notes }) });
  }
  for (const record of data.records) {
    check(); const title = cockpitRecordLabel(record), content = JSON.stringify(record.data), id = "r:" + record.id;
    const sensitive = isSensitiveHealthText(title, record.source, record.notes, content);
    if (content.length > 300000) partial++;
    documents.push({ id, text: [title, record.recordType, record.status, record.notes, content.slice(0, 300000)].filter(Boolean).join("\n") });
    targets.set(id, { targetId: record.id, section: sensitive ? "health" : memoryData(record) ? "memory" : "cockpit", title: sensitive ? "Geschützter Gesundheitseintrag" : title });
  }
  check(); if ((await getVaultSummary(handle)).vaultId !== scope) throw Error("INDEX_SCOPE_CHANGED");
  return { scope, documents, targets, metadataOnly, partial };
}
