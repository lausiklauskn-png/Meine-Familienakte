// Stapel-Ablage (Klaus 2026-11-01: „erstmal ungeprüft einpflegen und dann später, wenn ich Zeit habe, alle Dokumente einordnen“).
// Eigene kleine Datenbank im Browser des Geräts: die gescannten PDFs bleiben hier, bis „Einordnen“ sie an die Eingangszentrale gibt.
// Kein Klartext verlässt das Gerät; Einordnen (Text lesen, Embedding, Zusammenhang) geschieht erst auf Knopfdruck.
export type StapelEintrag = { id: string; name: string; sicher: boolean; grund: string; quelle: string; groesse: number; zeit: string; pdf: Blob; vorschau?: Blob };
const DB = "FamilienakteStapel1", FACH = "stapel";
function oeffnen() {
  return new Promise<IDBDatabase>((ok, nein) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(FACH)) r.result.createObjectStore(FACH, { keyPath: "id" }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error);
  });
}
async function tx<T>(modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await oeffnen();
  try { return await new Promise<T>((ok, nein) => { const r = f(db.transaction(FACH, modus).objectStore(FACH)); r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); }); }
  finally { db.close(); }
}
export const stapelAlle = async () => (await tx<StapelEintrag[]>("readonly", (s) => s.getAll() as IDBRequest<StapelEintrag[]>)).sort((a, b) => a.zeit.localeCompare(b.zeit));
export const stapelLegen = (e: StapelEintrag) => tx("readwrite", (s) => s.put(e));
export const stapelWeg = (id: string) => tx("readwrite", (s) => s.delete(id));
export const stapelDatei = (e: StapelEintrag) => new File([e.pdf], e.name, { type: "application/pdf" });
