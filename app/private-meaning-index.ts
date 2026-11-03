import { workspaceName } from "../lib/demo-workspace.ts";
// Private, rebuildable search data. This module has no network or Mycel access.
export type MeaningModel = { id: string; revision: string; dim: number };
export type MeaningDocument = { id: string; text: string };
type Section = { id: string; textHash: string; key: string; text: string };
type VectorRow = { key: string; scope: string; id: string; textHash: string; model: MeaningModel; vector: Float32Array };
type Generation = { scope: string; model: MeaningModel; signature: string; rows: Array<Omit<Section, "text">>; documents: number; limited: string[] };
export type MeaningHit = { id: string; score: number };
const DB = "FamilienakteBedeutung1";
const digest = async (text: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2, "0")).join("");
const sameModel = (a: MeaningModel, b: MeaningModel) => Boolean(a && b && a.id === b.id && a.revision === b.revision && a.dim === b.dim);
const modelKey = (model: MeaningModel) => {
  if (!/^[A-Za-z0-9._/-]{1,150}$/.test(model.id) || !/^[a-f0-9]{40}$/.test(model.revision) || ![384, 768, 1024].includes(model.dim)) throw Error("INDEX_MODEL_INVALID");
  return [model.id, model.revision, model.dim];
};
function checkScope(scope: string) { if (!scope || scope.length > 160) throw Error("INDEX_SCOPE_INVALID"); }
function vectorValid(vector: unknown, dim: number): vector is Float32Array {
  if (!(vector instanceof Float32Array) || vector.length !== dim) return false;
  let norm = 0; for (const n of vector) { if (!Number.isFinite(n)) return false; norm += n * n; }
  return norm > 0 && Number.isFinite(norm);
}

// e5 has a bounded context. Long texts retain their beginning and end; the caller
// receives the affected document IDs and must identify the partial coverage.
export function meaningSections(text: string) {
  const normalized = text.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!normalized) return { texts: [] as string[], limited: false };
  const count = Math.max(1, Math.ceil((normalized.length - 200) / 1400));
  const selected = Math.min(60, count), starts = Array.from({ length: selected }, (_, i) => count <= 60 ? i * 1400 : Math.round(i * (normalized.length - 1600) / (selected - 1)));
  return { texts: starts.map(start => normalized.slice(start, start + 1600)), limited: count > 60 };
}
async function corpus(scope: string, model: MeaningModel, documents: MeaningDocument[]) {
  checkScope(scope); const mk = modelKey(model), ids = new Set<string>(), sections: Section[] = [], limited: string[] = [], texts: Array<[string, string]> = [];
  for (const document of [...documents].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!document.id || document.id.length > 160 || ids.has(document.id) || typeof document.text !== "string") throw Error("INDEX_DOCUMENT_INVALID");
    ids.add(document.id); const textHash = await digest(document.text), split = meaningSections(document.text); texts.push([document.id, textHash]);
    if (split.limited) limited.push(document.id);
    for (let i = 0; i < split.texts.length; i++) sections.push({ id: document.id, textHash, key: await digest(JSON.stringify([scope, mk, document.id, textHash, i])), text: split.texts[i] });
  }
  const signature = await digest(JSON.stringify([scope, mk, texts, sections.map(({ key }) => key)]));
  return { scope, model: { ...model }, signature, sections, documents: ids.size, limited };
}
let opened: Promise<IDBDatabase> | null = null;
function database() {
  if (!opened) opened = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(workspaceName(DB), 1);
    request.onupgradeneeded = () => { request.result.createObjectStore("vectors", { keyPath: "key" }); request.result.createObjectStore("active", { keyPath: "scope" }); };
    request.onerror = () => { opened = null; reject(request.error); };
    request.onblocked = () => { opened = null; reject(Error("INDEX_DATABASE_BLOCKED")); };
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); opened = null; }; resolve(db); };
  });
  return opened;
}
async function get<T>(table: "vectors" | "active", key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(table, "readonly"), request = tx.objectStore(table).get(key); let value: T | undefined;
    request.onsuccess = () => { value = request.result as T | undefined; };
    tx.oncomplete = () => resolve(value); tx.onabort = () => reject(tx.error || Error("INDEX_READ_ABORTED")); tx.onerror = () => {};
  });
}
async function put(table: "vectors" | "active", value: VectorRow | Generation) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(table, "readwrite"); tx.objectStore(table).put(value);
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error || Error("INDEX_WRITE_ABORTED")); tx.onerror = () => {};
  });
}
function rowValid(row: VectorRow | undefined, section: Omit<Section, "text">, generation: Pick<Generation, "scope" | "model">): row is VectorRow {
  return Boolean(row && row.key === section.key && row.scope === generation.scope && row.id === section.id && row.textHash === section.textHash
    && sameModel(row.model, generation.model) && vectorValid(row.vector, generation.model.dim));
}
let tail: Promise<unknown> = Promise.resolve();
function exclusive<T>(work: () => Promise<T>) {
  const locked = async (): Promise<T> => navigator.locks ? await navigator.locks.request("familienakte-private-meaning", { mode: "exclusive" }, work) : await work();
  const run = tail.then(locked, locked); tail = run.catch(() => {}); return run;
}
export async function buildMeaningIndex(options: {
  scope: string; model: MeaningModel; read: () => Promise<MeaningDocument[]>; currentScope: () => string | null;
  embed: (text: string, model: MeaningModel) => Promise<Float32Array>; signal?: AbortSignal;
  progress?: (done: number, total: number) => void;
}) {
  const build = async () => {
    const check = () => { options.signal?.throwIfAborted(); if (options.currentScope() !== options.scope) throw Error("INDEX_SCOPE_CHANGED"); };
    check(); const plan = await corpus(options.scope, options.model, await options.read()); check();
    let done = 0;
    for (const section of plan.sections) {
      check(); let row = await get<VectorRow>("vectors", section.key); check();
      if (!rowValid(row, section, plan)) {
        const vector = await options.embed("passage: " + section.text, plan.model); check();
        if (!vectorValid(vector, plan.model.dim)) throw Error("INDEX_VECTOR_INVALID");
        row = { key: section.key, scope: plan.scope, id: section.id, textHash: section.textHash, model: plan.model, vector };
        await put("vectors", row); check();
        if (!rowValid(await get<VectorRow>("vectors", section.key), section, plan)) throw Error("INDEX_VERIFY_FAILED");
      }
      options.progress?.(++done, plan.sections.length);
    }
    // The previous active generation survives cancellation, model failure, a full
    // disk and a changed corpus. Only this final committed pointer switches it.
    const latest = await corpus(options.scope, options.model, await options.read()); check();
    if (latest.signature !== plan.signature) throw Error("INDEX_TEXT_CHANGED");
    const generation: Generation = { scope: plan.scope, model: plan.model, signature: plan.signature,
      rows: plan.sections.map(({ id, key, textHash }) => ({ id, key, textHash })), documents: plan.documents, limited: plan.limited };
    const db = await database(); check();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["vectors", "active"], "readwrite"), rows = tx.objectStore("vectors");
      const abort = () => { try { tx.abort(); } catch { /* A completed commit remains valid. */ } };
      const cleanup = () => options.signal?.removeEventListener("abort", abort);
      options.signal?.addEventListener("abort", abort, { once: true });
      for (const section of generation.rows) {
        const r = rows.get(section.key); r.onsuccess = () => { if (options.signal?.aborted || options.currentScope() !== options.scope || !rowValid(r.result, section, generation)) tx.abort(); };
      }
      const activation = tx.objectStore("active").put(generation);
      activation.onsuccess = () => { if (options.signal?.aborted || options.currentScope() !== options.scope) abort(); };
      tx.oncomplete = () => { cleanup(); resolve(); }; tx.onabort = () => { cleanup(); reject(tx.error || Error("INDEX_ACTIVATION_ABORTED")); }; tx.onerror = () => {};
    });
    // Once committed, a later cancellation must not report that the old index
    // survived. The new generation is already valid and durably active.
    return { documents: generation.documents, sections: generation.rows.length, limited: generation.limited };
  };
  return exclusive(build);
}
export const activeMeaningModel = async (scope: string) => { checkScope(scope); return (await get<Generation>("active", scope))?.model || null; };
export async function searchMeaningIndex(options: {
  scope: string; documents: MeaningDocument[]; query: string; currentScope: () => string | null;
  embed: (text: string, model: MeaningModel) => Promise<Float32Array>;
}) {
  checkScope(options.scope); if (!options.query.trim()) return { hits: [] as MeaningHit[], indexed: 0, total: options.documents.length, model: null, limited: [] as string[] };
  const check = () => { if (options.currentScope() !== options.scope) throw Error("INDEX_SCOPE_CHANGED"); };
  check(); const active = await get<Generation>("active", options.scope); check();
  if (!active) return { hits: [] as MeaningHit[], indexed: 0, total: options.documents.length, model: null, limited: [] as string[] };
  if (active.scope !== options.scope) throw Error("INDEX_SCOPE_INVALID"); modelKey(active.model);
  const current = await corpus(options.scope, active.model, options.documents), valid = new Map(current.sections.map(section => [section.key, section]));
  const query = await options.embed("query: " + options.query.trim(), active.model); check();
  if (!vectorValid(query, active.model.dim)) throw Error("INDEX_QUERY_INVALID");
  const scores = new Map<string, number>(), queryNorm = Math.sqrt(query.reduce((sum, n) => sum + n * n, 0));
  for (const section of active.rows) {
    check(); const now = valid.get(section.key); if (!now) continue;
    const row = await get<VectorRow>("vectors", section.key); if (!rowValid(row, now, active)) continue;
    let dot = 0, norm = 0; for (let i = 0; i < query.length; i++) { dot += query[i] * row.vector[i]; norm += row.vector[i] * row.vector[i]; }
    const score = dot / (queryNorm * Math.sqrt(norm)); if (Number.isFinite(score)) scores.set(row.id, Math.max(scores.get(row.id) ?? -1, score));
  }
  check(); return { hits: [...scores].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score).slice(0, 20),
    indexed: scores.size, total: options.documents.length, model: active.model, limited: active.limited.filter(id => scores.has(id)) };
}
export async function clearMeaningIndex(scope: string) {
  checkScope(scope); return exclusive(async () => { const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["vectors", "active"], "readwrite"); tx.objectStore("active").delete(scope);
    const cursor = tx.objectStore("vectors").openCursor(); cursor.onsuccess = () => { const row = cursor.result; if (row) { if (row.value.scope === scope) row.delete(); row.continue(); } };
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error || Error("INDEX_CLEAR_ABORTED")); tx.onerror = () => {};
  });
  });
}
