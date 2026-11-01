// Aktenregister + echter Speichercode, gestellte native Brücke. Kryptografie separat in den JVM-Proben.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const merk = new Map();
globalThis.localStorage = { getItem: (k) => merk.get(k) ?? null, setItem: (k, v) => merk.set(k, String(v)), removeItem: (k) => merk.delete(k) };
Object.defineProperty(globalThis, "navigator", { value: { storage: {} }, configurable: true });
globalThis.window = globalThis; globalThis.indexedDB = {};
globalThis.FileReader = class {
  readAsDataURL(blob) { blob.arrayBuffer().then((bytes) => { this.result = `data:application/octet-stream;base64,${Buffer.from(bytes).toString("base64")}`; this.onload?.(); }).catch(() => this.onerror?.()); }
};
class Datei {
  constructor(name, dir) { this.kind = "file"; this.name = name; this.dir = dir; this.bytes = new Uint8Array(); }
  async getFile() { return new File([this.bytes], this.name); }
  async createWritable() {
    if (this.dir.fs.fail.delete(this.name)) throw new DOMException("Probe: Speicher voll", "QuotaExceededError");
    const parts = [];
    return { write: async (v) => parts.push(typeof v === "string" ? Buffer.from(v) : v instanceof Blob ? new Uint8Array(await v.arrayBuffer()) : v),
      close: async () => { this.bytes = Buffer.concat(parts.map((p) => Buffer.from(p))); } };
  }
}
class Ordner {
  constructor(name, fs) { this.kind = "directory"; this.name = name; this.fs = fs; this.inhalt = new Map(); }
  async getDirectoryHandle(name, o = {}) { let e = this.inhalt.get(name); if (!e && o.create) { e = new Ordner(name, this.fs); this.inhalt.set(name, e); } if (!e) throw new DOMException("fehlt", "NotFoundError"); assert.equal(e.kind, "directory"); return e; }
  async getFileHandle(name, o = {}) { let e = this.inhalt.get(name); if (!e && o.create) { e = new Datei(name, this); this.inhalt.set(name, e); } if (!e) throw new DOMException("fehlt", "NotFoundError"); assert.equal(e.kind, "file"); return e; }
  async removeEntry(name) { if (!this.inhalt.delete(name)) throw new DOMException("fehlt", "NotFoundError"); }
  async *values() { yield* this.inhalt.values(); }
  find(path) { return path.split("/").reduce((d, part) => d?.inhalt?.get(part) ?? null, this); }
}
function fs(name = "Erfundene Akte") { const f = { fail: new Set() }; f.root = new Ordner(name, f); return f; }
const summe = (b) => createHash("sha256").update(b).digest("hex");
const nativ = { status: "offen", id: "tresor-a", dateien: new Map(), aufrufe: 0, falsch: false, kaputt: false };
function offen(vaultId) { if (nativ.status !== "offen" || vaultId !== nativ.id) throw new Error("FA_TRESOR_GESPERRT_ODER_FREMD"); }
globalThis.Capacitor = { isNativePlatform: () => true, getPlatform: () => "windows", Plugins: { FamilienakteTresor: {
  zustand: async () => ({ status: nativ.status, id: nativ.id }),
  speichern: async (a) => {
    offen(a.vaultId); nativ.aufrufe++;
    const bytes = Buffer.from(a.data, "base64"), sha256 = summe(bytes);
    const entryId = `e-${summe(Buffer.from(JSON.stringify([a.documentId, a.name, a.mime, a.date, sha256]))).slice(0, 36)}`;
    nativ.dateien.set(`${a.vaultId}/${entryId}`, bytes);
    return { vaultId: nativ.falsch ? "fremd" : a.vaultId, entryId, sha256, size: bytes.length };
  },
  lesen: async (a) => { offen(a.vaultId); const bytes = nativ.dateien.get(`${a.vaultId}/${a.entryId}`); if (!bytes) throw new Error("fehlt"); return { data: (nativ.kaputt ? Buffer.from(bytes).fill(0) : bytes).toString("base64") }; },
} } };
const vault = await import("../app/local-vault.ts");
const { readIndex, writeIndex } = vault.vaultInternalsForTests;
const eingabe = { category: "Archiv", documentDate: "2026-11-01", notes: null };
const datei = () => new File(["Erfundener Pro-Brief 123"], "Erfundener-Pro-Brief.txt", { type: "text/plain", lastModified: 1 });
async function vorbereitet() { const f = fs(); await writeIndex(f.root, await readIndex(f.root)); await vault.setProDocumentVault(f.root, "tresor-a"); return f; }
let gruen = 0, rot = 0;
async function probe(name, fn) {
  nativ.id = "tresor-a"; nativ.status = "offen"; nativ.dateien.clear(); nativ.aufrufe = 0; nativ.falsch = false; nativ.kaputt = false;
  try { await fn(); console.log(`🟢 ${name}`); gruen++; } catch (e) { console.log(`🔴 ${name}: ${e.stack}`); rot++; }
}
await probe("Pro-Ablage: freiwillig je Arbeitsstand, vorhandene Dateien bleiben", async () => {
  const f = fs(), anderer = fs("Andere Akte");
  const alt = await vault.saveLocalDocument(f.root, new File(["Alt"], "Alt.txt"), eingabe);
  await vault.setProDocumentVault(f.root, "tresor-a");
  const neu = await vault.saveLocalDocument(f.root, datei(), eingabe);
  assert.ok(neu.storedPath.startsWith("pro-tresor://tresor-a/"));
  assert.equal(await (await vault.readLocalDocumentFile(f.root, neu.id)).text(), await datei().text());
  assert.ok(f.root.find(alt.storedPath), "altes Original bleibt");
  assert.equal([...f.root.find("Me_Myself_and_I_Familienakte/01_Dokumente/Archiv").inhalt.keys()].filter((n) => n.includes("Pro-Brief")).length, 0, "keine interne Zweitkopie");
  const separat = await vault.saveLocalDocument(anderer.root, datei(), eingabe);
  assert.ok(!separat.storedPath.startsWith("pro-tresor:"), "anderer Arbeitsstand bleibt unabhängig");
});
await probe("Pro-Ablage: gesperrt, entfernt oder anderer Tresor erzeugt keinen Ersatz", async () => {
  for (const status of ["gesperrt", "nicht_erreichbar", "offen"]) {
    const f = await vorbereitet(); nativ.status = status; if (status === "offen") nativ.id = "tresor-b";
    await assert.rejects(() => vault.saveLocalDocument(f.root, datei(), eingabe), /zu diesem Akten-Arbeitsstand/);
    assert.equal((await readIndex(f.root)).documents.length, 0);
    assert.equal(nativ.aufrufe, 0); assert.equal(f.root.find("Me_Myself_and_I_Familienakte/01_Dokumente"), null);
    nativ.id = "tresor-a"; nativ.status = "offen";
  }
});
await probe("Pro-Ablage: falsche Bestätigung und veränderte Bytes werden abgewiesen", async () => {
  const f = await vorbereitet(); nativ.falsch = true;
  await assert.rejects(() => vault.saveLocalDocument(f.root, datei(), eingabe), /nicht passend bestätigt/);
  assert.equal((await readIndex(f.root)).documents.length, 0);
  nativ.falsch = false; const saved = await vault.saveLocalDocument(f.root, datei(), eingabe);
  nativ.kaputt = true;
  await assert.rejects(() => vault.readLocalDocumentFile(f.root, saved.id), /stimmt nicht/);
});
await probe("Pro-Ablage: Registerabbruch behält Quelle und native Fassung, Wiederholung ohne Duplikat", async () => {
  const f = await vorbereitet(), quelle = datei(); f.fail.add("Familienakte_Register.json");
  await assert.rejects(() => vault.saveLocalDocument(f.root, quelle, eingabe));
  assert.equal((await readIndex(f.root)).documents.length, 0);
  assert.equal(nativ.dateien.size, 1); assert.equal(await quelle.text(), "Erfundener Pro-Brief 123");
  const saved = await vault.saveLocalDocument(f.root, quelle, eingabe);
  assert.equal(nativ.dateien.size, 1); assert.equal((await readIndex(f.root)).documents.length, 1);
  assert.equal(await (await vault.readLocalDocumentFile(f.root, saved.id)).text(), await quelle.text());
});
await probe("Pro-Ablage: Vollsicherung mit Scan-Originalen ist ohne Pro-Anschluss wiederherstellbar", async () => {
  const f = await vorbereitet(), ziel = fs("Sicherungen"), restore = fs("Leerer Test");
  const saved = await vault.saveLocalDocument(f.root, datei(), { ...eingabe, scanOriginals: [new File(["Erfundenes Bild"], "Seite.png", { type: "image/png" })] });
  const backup = await vault.writeFullFamilyBackup({ source: f.root, destination: ziel.root, appVersion: "2.28.14" });
  assert.equal(backup.manifest.files.length, 2, "Dokument und Scan-Original gesichert");
  assert.equal(await vault.readProDocumentVault(f.root), "tresor-a", "Quelle bleibt gebunden");
  nativ.status = "gesperrt"; nativ.dateien.clear();
  await vault.restoreFullFamilyBackup({ backup: await ziel.root.getDirectoryHandle(backup.folderName), emptyTarget: restore.root });
  const docs = (await readIndex(restore.root)).documents;
  assert.equal(await vault.readProDocumentVault(restore.root), null, "Sicherung braucht keinen fremden Anschluss");
  assert.ok(!docs[0].storedPath.startsWith("pro-tresor:"));
  assert.equal(await (await vault.readLocalDocumentFile(restore.root, saved.id)).text(), await datei().text());
  assert.ok(restore.root.find(docs[0].scanOriginalsPath), "Scan-Original wiederhergestellt");
});
await probe("Pro-Ablage: Entfernen löscht nur Aktenverweis, keine kanonischen Originale", async () => {
  const f = await vorbereitet(); const saved = await vault.saveLocalDocument(f.root, datei(), eingabe);
  const r = await vault.removeVaultEntries(f.root, new Set([saved.id]));
  assert.equal(r.retainedProOriginals, 1); assert.equal(r.removedFiles, 0); assert.equal(nativ.dateien.size, 1);
});
await probe("Pro-Einzug: ausgewählte Datei, Registerabbruch, Wiederaufnahme und ursprünglicher Bestand", async () => {
  const f = fs(); const alt = await vault.saveLocalDocument(f.root, datei(), eingabe);
  const ursprung = alt.storedPath;
  f.fail.add("Familienakte_Register.json");
  await assert.rejects(() => vault.copyLocalDocumentToPro(f.root, alt.id, "tresor-a"));
  assert.equal((await readIndex(f.root)).documents[0].storedPath, ursprung);
  assert.ok(f.root.find(ursprung)); assert.equal(nativ.dateien.size, 1);
  const neu = await vault.copyLocalDocumentToPro(f.root, alt.id, "tresor-a");
  assert.match(neu.storedPath, /^pro-tresor:/); assert.ok(f.root.find(ursprung)); assert.equal(nativ.dateien.size, 1);
  assert.equal(await (await vault.readLocalDocumentFile(f.root, neu.id)).text(), await datei().text());
  assert.ok(neu.storageLocations.some((l) => l.path === ursprung), "Rückverweis zur alten Quelle bleibt");
});
await probe("Pro-Sicherung: bewusst gewählte getrennte Ablage und keine Scheinsicherung im selben Tresor", async () => {
  const f = await vorbereitet(), ziel = fs("Getrennte Sicherung");
  const saved = await vault.saveLocalDocument(f.root, datei(), eingabe);
  const r = await vault.copyMissingDocuments(f.root, ziel.root);
  assert.equal(r.copiedDocuments, 1);
  nativ.status = "gesperrt";
  assert.equal(await (await vault.readLocalDocumentFile(ziel.root, saved.id)).text(), await datei().text());
  nativ.status = "offen";
  const schein = fs("Zweite Aktenansicht");
  await vault.setProDocumentVault(schein.root, "tresor-a");
  await vault.setProDocumentVault(f.root, null); // vorhandenes Original liegt trotzdem noch im Tresor A
  await assert.rejects(() => vault.compareVaults(f.root, schein.root), /denselben Pro-Tresor/);
  assert.equal((await readIndex(schein.root)).documents.length, 0);
});
await probe("Pro-Prüfung: Verweis und Aktenregister müssen denselben Inhalt beschreiben", async () => {
  const f = await vorbereitet(); const saved = await vault.saveLocalDocument(f.root, datei(), eingabe);
  let index = await readIndex(f.root); index.documents[0].checksum = "0".repeat(64); await writeIndex(f.root, index);
  await assert.rejects(() => vault.readLocalDocumentFile(f.root, saved.id), /nicht dieselbe Originaldatei/);
  index = await readIndex(f.root); index.documents[0].checksum = saved.checksum; index.documents[0].sizeBytes++; await writeIndex(f.root, index);
  await assert.rejects(() => vault.writeFullFamilyBackup({ source: f.root, destination: fs("Sicherung").root, appVersion: "2.28.14" }), /nicht dieselbe Originaldatei/);
  assert.equal(nativ.dateien.size, 1, "beschädigte Metadaten verändern keine Originale");
});
console.log(`Pro-Tresor Dokumente: ${gruen} grün · ${rot} rot`);
process.exitCode = rot ? 1 : 0;
