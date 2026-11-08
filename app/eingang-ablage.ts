import type { CentralIntakeQueueItem } from "../lib/central-intake";
import { stapelDatenbank } from "./stapel-ablage";
import type { DocumentScanMetadata, DocumentScanPdfFile } from "../lib/document-scan";

type Stand = CentralIntakeQueueItem & { folge: number };
/** Stufe E: Dateien aus dem Eingangsordner werden bei Bedarf von dort gelesen (kein Doppel im Arbeitsspeicher). */
let ordnerLeser: ((name: string) => Promise<File | null>) | null = null;
export function eingangOrdnerLeserSetzen(fn: ((name: string) => Promise<File | null>) | null) { ordnerLeser = fn; }
export type EingangAenderung = (bisher: CentralIntakeQueueItem[]) => CentralIntakeQueueItem[];

/** Arbeitsspeicher: kleine, JSON-fähige Stände getrennt von den Originaldateien.
 *  Dieselbe Datenbank wie der Stapel: Empfang und Entfernen der Quellen sind EINE
 *  Transaktion. Bei Abbruch bleibt der Stapel vollständig erhalten. */
export async function eingangAblage(aendern?: EingangAenderung, stapelIds: string[] = []): Promise<CentralIntakeQueueItem[]> {
  const db = await stapelDatenbank();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction(["eingang", "eingang-dateien", ...(stapelIds.length ? ["stapel"] : [])], aendern ? "readwrite" : "readonly");
      const staende = t.objectStore("eingang"), dateien = t.objectStore("eingang-dateien");
      const s = staende.getAll() as IDBRequest<Stand[]>;
      let ergebnis: CentralIntakeQueueItem[] = [], fehler: unknown;
      t.oncomplete = () => resolve(ergebnis);
      t.onabort = () => reject(fehler || t.error || new Error("Eingang konnte nicht gespeichert werden."));
      // onabort ist die Bestätigung, dass auch vorher erfolgreiche Einzelanfragen zurückgerollt wurden.
      s.onsuccess = () => {
        try {
          const bisher = s.result.sort((a, b) => a.folge - b.folge).map(({ folge: _folge, ...item }) => item);
          ergebnis = aendern ? aendern(bisher) : bisher;
          if (!aendern) return;
          const behalten = new Set(ergebnis.map((e) => e.id));
          for (const e of bisher) if (!behalten.has(e.id)) { staende.delete(e.id); dateien.delete(e.id); }
          const vorher = new Map(bisher.map((e) => [e.id, e]));
          const reihenfolge = new Map(s.result.map((e) => [e.id, e.folge]));
          for (const [folge, e] of ergebnis.entries()) {
            if (vorher.get(e.id) === e && reihenfolge.get(e.id) === folge) continue;
            const { name, type, size, lastModified } = e.file;
            staende.put({ ...e, folge, file: { name, type, size, lastModified } });
            // Nach bestätigter Ablage nur den kleinen Arbeitsstand behalten.
            // Die Originaldatei wird bei Bedarf aus dem verbundenen Dokument-Tresor gelesen.
            if (e.status === "Übernommen" && e.savedDocumentId) dateien.delete(e.id);
            else if (e.file instanceof File && !e.ordnerDatei) {
              // Stufe H: Original-Fotos aus dem Stapel bleiben beim Arbeitsstand (eine Eigenschaft am File übersteht das Speichern nicht).
              const scan = (e.file as DocumentScanPdfFile).documentScan;
              dateien.put({ id: e.id, file: e.file, scan: scan ? { ...scan, originals: scan.originals.map((o) => ({ blob: o, name: o.name, typ: o.type })) } : undefined });
            }
          }
          for (const id of stapelIds) t.objectStore("stapel").delete(id);
        } catch (error) { fehler = error; t.abort(); }
      };

    });
  } finally { db.close(); }
}

/** Nur die gerade benötigte Arbeitsdatei laden, nicht alle PDFs beim App-Start. */
export async function eingangDatei(item: CentralIntakeQueueItem): Promise<File> {
  if (item.file instanceof File) return item.file;
  if (item.ordnerDatei) {
    const f = ordnerLeser ? await ordnerLeser(item.ordnerDatei) : null;
    if (!f) throw new Error(`„${item.ordnerDatei}“ liegt im Eingangsordner, der gerade nicht erreichbar ist. Ordner anschließen oder freigeben, dann weiter.`);
    return f;
  }
  const db = await stapelDatenbank();
  try {
    return await new Promise((resolve, reject) => {
      const t = db.transaction("eingang-dateien", "readonly");
      const r = t.objectStore("eingang-dateien").get(item.id);
      t.oncomplete = () => {
        if (!(r.result?.file instanceof File)) { reject(new Error("Die Arbeitsdatei des Eingangs ist nicht erreichbar.")); return; }
        const f = r.result.file as DocumentScanPdfFile; const scan = r.result.scan as (Omit<DocumentScanMetadata, "originals"> & { originals: Array<{ blob: Blob; name: string; typ: string }> }) | undefined;
        if (scan && !f.documentScan) f.documentScan = { ...scan, originals: scan.originals.map((o) => new File([o.blob], o.name, { type: o.typ })) };
        resolve(f);
      };
      t.onabort = () => reject(t.error || new Error("Die Arbeitsdatei konnte nicht geladen werden."));
    });
  } finally { db.close(); }
}
