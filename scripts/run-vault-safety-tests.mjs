// Datensicherheit des Tresors (A2–A6): gestreamte Prüfsumme, Register-Konflikt statt verlorener Änderung,
// gemerkter Stammordner, Rücknahme bei fehlgeschlagenem Registerschreiben, Aufräumen beim Entfernen.
// Läuft in Node mit einem Dateisystem im Speicher, das die benutzten Teile der File-System-Access-API nachbildet.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";

// Browser-Globale für app/local-vault.ts
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
Object.defineProperty(globalThis, "navigator", { value: { storage: {} }, configurable: true });
globalThis.window = globalThis; globalThis.indexedDB = {};

class FakeFile {
  constructor(name, dir) { this.kind = "file"; this.name = name; this.dir = dir; this.bytes = new Uint8Array(); this.lastModified = Date.now(); }
  async getFile() { const bytes = this.bytes; return new File([bytes], this.name, { lastModified: this.lastModified }); }
  async createWritable() {
    const file = this; const parts = [];
    if (file.dir.fs.failWrites.has(file.name)) { file.dir.fs.failWrites.delete(file.name); throw Object.assign(new Error("Simulierter Schreibfehler"), { name: "QuotaExceededError" }); }
    return { async write(data) { parts.push(typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : new Uint8Array(data)); }, async close() { const total = parts.reduce((n, p) => n + p.length, 0); const out = new Uint8Array(total); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } file.bytes = out; file.lastModified = Date.now(); } };
  }
}
class FakeDir {
  constructor(name, fs) { this.kind = "directory"; this.name = name; this.fs = fs; this.entries = new Map(); }
  async getDirectoryHandle(name, options = {}) { let e = this.entries.get(name); if (!e) { if (!options.create) throw Object.assign(new Error("not found"), { name: "NotFoundError" }); e = new FakeDir(name, this.fs); this.entries.set(name, e); } if (e.kind !== "directory") throw Object.assign(new Error("mismatch"), { name: "TypeMismatchError" }); return e; }
  async getFileHandle(name, options = {}) { let e = this.entries.get(name); if (!e) { if (!options.create) throw Object.assign(new Error("not found"), { name: "NotFoundError" }); e = new FakeFile(name, this); this.entries.set(name, e); } if (e.kind !== "file") throw Object.assign(new Error("mismatch"), { name: "TypeMismatchError" }); return e; }
  async removeEntry(name) { if (!this.entries.has(name)) throw Object.assign(new Error("not found"), { name: "NotFoundError" }); this.entries.delete(name); }
  async *values() { yield* this.entries.values(); }
  async *keys() { yield* this.entries.keys(); }
  async *entries_() { yield* this.entries.entries(); }
  find(path) { let d = this; for (const part of path.split("/")) { d = d.entries.get(part); if (!d) return null; } return d; }
}
const newFs = () => { const fs = { failWrites: new Set() }; fs.root = new FakeDir("Testordner", fs); return fs; };

const { fileChecksum, Sha256Stream, LIMITS, saveLocalDocument, removeVaultEntries, readLocalVaultData, vaultInternalsForTests, browserStorageKind, VaultRegisterError } = await import("../app/local-vault.ts");
const { readIndex, writeIndex } = vaultInternalsForTests;
let passed = 0; const fails = [];
const ok = (name) => { passed++; console.log(`🟢 ${name}`); };
const test = async (name, fn) => { try { await fn(); ok(name); } catch (error) { fails.push(name); console.log(`🔴 ${name}: ${error.message.slice(0, 200)}`); } };

await test("A6: gestreamte SHA-256 stimmt mit node:crypto überein (klein, Blockgrenzen, 9 MB)", async () => {
  for (const size of [0, 1, 55, 56, 63, 64, 65, 1000, 9 * 1024 * 1024 + 17]) {
    const bytes = randomBytes(size);
    const sha = new Sha256Stream(); for (let i = 0; i < bytes.length; i += 70000) sha.update(bytes.subarray(i, i + 70000));
    assert.equal(sha.digestHex(), createHash("sha256").update(bytes).digest("hex"), `Größe ${size}`);
  }
});
await test("A6: fileChecksum nutzt für große Dateien den Strom, Ergebnis gleich", async () => {
  const bytes = randomBytes(LIMITS.inMemoryDigestBytes + 3);
  let progress = 0;
  const sum = await fileChecksum(new Blob([bytes]), (done) => { progress = done; });
  assert.equal(sum, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(progress, bytes.length, "Fortschritt erreicht die Dateigröße");
  assert.equal(await fileChecksum(new Blob([bytes.subarray(0, 100)])), createHash("sha256").update(bytes.subarray(0, 100)).digest("hex"));
});
await test("A3: Register trägt eine Revision, die bei jedem Schreiben steigt", async () => {
  const fs = newFs(); const index = await readIndex(fs.root); assert.equal(index.revision, 0);
  await writeIndex(fs.root, index); assert.equal((await readIndex(fs.root)).revision, 1);
  await writeIndex(fs.root, await readIndex(fs.root)); assert.equal((await readIndex(fs.root)).revision, 2);
});
await test("A3: ein veralteter Stand (zweiter Tab, langer Lauf) wird mit REGISTER_CONFLICT abgewiesen, nichts überschrieben", async () => {
  const fs = newFs(); await writeIndex(fs.root, await readIndex(fs.root));
  const tabA = await readIndex(fs.root); const tabB = await readIndex(fs.root);
  tabA.auditLog.unshift({ id: "a", at: new Date().toISOString(), action: "Tab A", recordId: null, details: "" });
  await writeIndex(fs.root, tabA);
  tabB.auditLog.unshift({ id: "b", at: new Date().toISOString(), action: "Tab B", recordId: null, details: "" });
  await assert.rejects(() => writeIndex(fs.root, tabB), (error) => error instanceof VaultRegisterError && error.code === "REGISTER_CONFLICT" && /zweiten Fenster/.test(error.message));
  const now = await readIndex(fs.root);
  assert.equal(now.auditLog[0].action, "Tab A", "die Änderung aus Tab A bleibt erhalten");
  assert.equal(now.revision, 2);
});
await test("A3: ein Register ohne Revision (Altbestand) wird gelesen und beim ersten Schreiben auf Stand 1 gesetzt", async () => {
  const fs = newFs(); const dir = await (await fs.root.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true })).getDirectoryHandle("00_Register", { create: true });
  const file = await dir.getFileHandle("Familienakte_Register.json", { create: true });
  const w = await file.createWritable(); await w.write(JSON.stringify({ version: 5, modelVersion: "2.28.1", updatedAt: new Date().toISOString(), documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], inventoryItems: [], inventoryLearningSignals: [], sequences: {}, auditLog: [] })); await w.close();
  const index = await readIndex(fs.root); assert.equal(index.revision, 0);
  await writeIndex(fs.root, index); assert.equal((await readIndex(fs.root)).revision, 1);
});
await test("A5: schlägt das Registerschreiben fehl, bleibt keine Dateileiche zurück", async () => {
  const fs = newFs(); await writeIndex(fs.root, await readIndex(fs.root));
  fs.failWrites.add("Familienakte_Register.json");
  const file = new File([new TextEncoder().encode("Probe")], "Probe_Garantie.txt", { type: "text/plain" });
  await assert.rejects(() => saveLocalDocument(fs.root, file, { category: "Käufe", documentDate: "2026-10-28", notes: null }));
  const folder = fs.root.find("Me_Myself_and_I_Familienakte/01_Dokumente/Käufe");
  assert.equal(folder ? [...folder.entries.keys()].filter((n) => n.endsWith("Probe_Garantie.txt")).length : 0, 0, "Datei wurde zurückgenommen");
  assert.equal((await readIndex(fs.root)).documents.length, 0);
  const saved = await saveLocalDocument(fs.root, file, { category: "Käufe", documentDate: "2026-10-28", notes: null });
  assert.ok(saved.id);
});
await test("A5: Entfernen nimmt Scan-Originale und Erinnerungsmedien mit", async () => {
  const fs = newFs(); await writeIndex(fs.root, await readIndex(fs.root));
  const png = new File([randomBytes(50)], "seite.png", { type: "image/png" });
  const pdf = new File([new TextEncoder().encode("%PDF-1.4 Probe")], "Scan.pdf", { type: "application/pdf" });
  const saved = await saveLocalDocument(fs.root, pdf, { category: "Wohnen", documentDate: null, notes: null, scanPageCount: 1, scanOriginals: [png] });
  assert.ok(fs.root.find(`Me_Myself_and_I_Familienakte/01_Dokumente/Wohnen/Scan-Originale/${saved.id}`), "Scan-Original liegt da");
  const media = await (await (await fs.root.getDirectoryHandle("Me_Myself_and_I_Familienakte")).getDirectoryHandle("03_Erinnerungsmedien", { create: true })).getDirectoryHandle("EVT-1", { create: true });
  await media.getFileHandle("foto.jpg", { create: true });
  const index = await readIndex(fs.root); index.records.push({ id: "EVT-1", recordType: "memory", status: "aktiv", data: {}, createdAt: "", updatedAt: "" }); await writeIndex(fs.root, index);
  const result = await removeVaultEntries(fs.root, new Set([saved.id, "EVT-1"]), "Probe");
  assert.equal(result.removedFiles, 1);
  assert.equal(fs.root.find(`Me_Myself_and_I_Familienakte/01_Dokumente/Wohnen/Scan-Originale/${saved.id}`), null, "Scan-Originale weg");
  assert.equal(fs.root.find("Me_Myself_and_I_Familienakte/03_Erinnerungsmedien/EVT-1"), null, "Erinnerungsmedien weg");
});
await test("A4: der zuerst gewählte Stammordner bleibt gewählt, auch wenn ein tieferes Register später voller ist", async () => {
  const fs = newFs(); localStorage.clear();
  await writeIndex(fs.root, await readIndex(fs.root));
  assert.equal(localStorage.getItem("mmi-vault-root-depth:Testordner"), "1", "Stammordner liegt eine Ebene unter dem gewählten Ordner");
  // Ein versehentlich verschachteltes, volleres Register darf den gewählten Stand nicht mehr verdecken.
  const nested = await (await (await fs.root.getDirectoryHandle("Me_Myself_and_I_Familienakte")).getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true })).getDirectoryHandle("00_Register", { create: true });
  const file = await nested.getFileHandle("Familienakte_Register.json", { create: true });
  const w = await file.createWritable(); await w.write(JSON.stringify({ version: 5, revision: 9, modelVersion: "2.28.1", updatedAt: new Date().toISOString(), documents: [], records: [{ id: "X", recordType: "person", status: "aktiv", data: {}, createdAt: "", updatedAt: "" }], relations: [], memoryDrafts: [], linkDecisions: [], inventoryItems: [], inventoryLearningSignals: [], sequences: {}, auditLog: [] })); await w.close();
  assert.equal((await readIndex(fs.root)).records.length, 0, "liest weiter den gemerkten Stammordner");
  localStorage.clear();
  assert.equal((await readIndex(fs.root)).records.length, 1, "ohne Merker gewinnt wie bisher der vollständigste Bestand (erste Wahl)");
  assert.equal(localStorage.getItem("mmi-vault-root-depth:Testordner"), "2");
});
await test("A2: Speicherwahl wird gemerkt und ohne Entscheidung als null gemeldet", async () => {
  localStorage.clear(); assert.equal(browserStorageKind(), null);
  localStorage.setItem("mmi-browser-speicher", "indexeddb"); assert.equal(browserStorageKind(), "indexeddb");
  localStorage.setItem("mmi-browser-speicher", "unsinn"); assert.equal(browserStorageKind(), null);
});
await test("A6: Größengrenzen stehen an einer Stelle", async () => {
  assert.equal(LIMITS.documentBytes, 20 * 1024 * 1024); assert.equal(LIMITS.mediaVideoBytes, 200 * 1024 * 1024);
});
console.log(`Datensicherheit des Tresors: ${passed} bestanden · ${fails.length} fehlgeschlagen${fails.length ? ` (${fails.join(" | ")})` : ""}`);
process.exit(fails.length ? 1 : 0);
