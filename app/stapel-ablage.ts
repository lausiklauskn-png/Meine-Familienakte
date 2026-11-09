import { workspaceName } from "../lib/demo-workspace.ts";
import type { DocumentScanPdfFile } from "../lib/document-scan";
// Stapel-Ablage (Klaus 2026-11-01: „erstmal ungeprüft einpflegen und dann später, wenn ich Zeit habe, alle Dokumente einordnen“).
// Eigene kleine Datenbank im Browser des Geräts: die gescannten PDFs bleiben hier, bis „Einordnen“ sie an die Eingangszentrale gibt.
// Kein Klartext verlässt das Gerät; Einordnen (Text lesen, Embedding, Zusammenhang) geschieht erst auf Knopfdruck.
export type StapelOriginal = { blob: Blob; name: string; typ: string };
export type StapelEintrag = { id: string; name: string; sicher: boolean; grund: string; quelle: string; groesse: number; zeit: string; pdf: Blob; vorschau?: Blob;
  /** Stufe H: Original-Fotos (bei zusammengefügten Blättern alle) und der Vermerk, was bearbeitet wurde. */
  originale?: StapelOriginal[]; bearbeitung?: string;
  pruefung?: { stand: "warnung" | "sauber" | "ungeprueft"; funde: Array<{ name: string; satz: string }>; hinweise: string[]; zeit: string } };
const DB = "FamilienakteStapel1", FACH = "stapel";
export function stapelDatenbank() {
  return new Promise<IDBDatabase>((ok, nein) => {
    const r = indexedDB.open(workspaceName(DB), 3);
    r.onupgradeneeded = () => {
      for (const fach of [FACH, "eingang", "eingang-dateien", "uebergaben"]) {
        if (!r.result.objectStoreNames.contains(fach)) r.result.createObjectStore(fach, { keyPath: "id" });
      }
    };
    r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); ok(r.result); };
    r.onerror = () => nein(r.error);
  });
}
async function tx<T>(modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await stapelDatenbank();
  try { return await new Promise<T>((ok, nein) => {
    const t = db.transaction(FACH, modus);
    const r = f(t.objectStore(FACH));
    t.oncomplete = () => ok(r.result);
    t.onabort = () => nein(t.error || new Error("Stapel konnte nicht gespeichert werden."));
    t.onerror = () => nein(t.error);
  }); }
  finally { db.close(); }
}
export const stapelAlle = async () => (await tx<StapelEintrag[]>("readonly", (s) => s.getAll() as IDBRequest<StapelEintrag[]>)).sort((a, b) => a.zeit.localeCompare(b.zeit));
export const stapelLegen = (e: StapelEintrag) => tx("readwrite", (s) => s.put(e));
export const stapelWeg = (id: string) => tx("readwrite", (s) => s.delete(id));
export const stapelDatei = (e: StapelEintrag) => {
  const f = new File([e.pdf], e.name, { type: "application/pdf" }) as DocumentScanPdfFile;
  // Die Originale wandern mit zur Eingangszentrale und werden beim Speichern als „Scan-Originale“ neben das PDF gelegt.
  if (e.originale?.length || e.bearbeitung) f.documentScan = { source: "stapel", pageCount: Math.max(1, e.originale?.length || 1), keepOriginals: Boolean(e.originale?.length), originals: (e.originale || []).map((o) => new File([o.blob], o.name, { type: o.typ })), bearbeitung: e.bearbeitung };
  return f;
};
