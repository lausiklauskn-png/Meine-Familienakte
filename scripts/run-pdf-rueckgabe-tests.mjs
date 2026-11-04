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
      close: async () => { this.bytes = Buffer.concat(parts.map((p) => Buffer.from(p))); if(this.dir.fs.failAfterClose?.delete(this.name)) throw new DOMException("Probe: Rückmeldung nach Commit fehlt", "UnknownError"); } };
  }
}
class Ordner {
  constructor(name, fs) { this.kind = "directory"; this.name = name; this.fs = fs; this.inhalt = new Map(); }
  async getDirectoryHandle(name, o = {}) { let e = this.inhalt.get(name); if (!e && o.create) { e = new Ordner(name, this.fs); this.inhalt.set(name, e); } if (!e) throw new DOMException("fehlt", "NotFoundError"); assert.equal(e.kind, "directory"); return e; }
  async getFileHandle(name, o = {}) { let e = this.inhalt.get(name); if (!e && o.create) { e = new Datei(name, this); this.inhalt.set(name, e); } if (!e) throw new DOMException("fehlt", "NotFoundError"); assert.equal(e.kind, "file"); return e; }
  async removeEntry(name) { if(this.fs.failRemove?.delete(name))throw new DOMException("Probe: Datei noch gesperrt", "NoModificationAllowedError"); if (!this.inhalt.delete(name)) throw new DOMException("fehlt", "NotFoundError"); }
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
const vault = await import('../app/local-vault.ts');
const { readIndex, writeIndex } = vault.vaultInternalsForTests;
const daten = { category: 'Verträge', documentDate: '2026-10-12', notes: 'Erfundener Vorgang' };
const pdf = text => new File([`%PDF-1.4\n${text}\n%%EOF`], 'Bearbeitet.pdf', { type: 'application/pdf' });
const basis = async () => { const f = fs(); const d = await vault.saveLocalDocument(f.root, pdf('Quelle'), daten); return { f, d, ...(await vault.beginLocalPdfEdit(f.root, d.id)) }; };
let gruen = 0;
async function test(name, fn) { nativ.id = 'tresor-a'; nativ.status = 'offen'; nativ.falsch = nativ.kaputt = false; nativ.dateien.clear(); await fn(); gruen++; console.log('🟢 ' + name); }
await test('Eine Rückgabe ersetzt denselben Eintrag: Kennung, Datum, Kategorie, Notizen und Beziehungen bleiben', async () => {
  const { f, d, quelle } = await basis();
  const index = await readIndex(f.root);
  index.documents[0].ausfuellen = { stand: 'offen', felder: [{ id: 'alte-maske', value: '' }], seiten: [], geaendertAm: '2026-01-01' };
  index.relations.push({ id: 'bezug-probe', fromType: 'document', fromId: d.id, toType: 'person', toId: 'probe', relationType: 'gehört zu', createdAt: '2026-01-01', source: 'Probe', notes: null });
  await writeIndex(f.root, index);
  const r = await vault.saveLocalPdfEdit(f.root, quelle, pdf('Ausgefüllt'));
  const nach = await readIndex(f.root);
  assert.equal(nach.documents.length, 1); assert.equal(r.dokument.id, d.id);
  for (const k of ['category', 'documentDate', 'notes', 'addedAt', 'status', 'originalName']) assert.equal(r.dokument[k], d[k]);
  assert.deepEqual(nach.relations, index.relations);
  assert.deepEqual(r.dokument.ausfuellen.felder, [], 'PDF-Raum darf eine alte Maske des einfachen Dialogs nicht über neue PDF-Bytes legen');
  assert.equal(r.dokument.ausfuellen.stand, 'offen', 'vorhandene Vormerkung bleibt erhalten');
  assert.equal(r.dokument.storedPath.slice(0, r.dokument.storedPath.lastIndexOf('/')), d.storedPath.slice(0, d.storedPath.lastIndexOf('/')));
  assert.equal(f.root.find(d.storedPath), null, 'bisherige Datei erst nach bestätigtem Registerwechsel entfernt');
  assert.equal(await (await vault.readLocalDocumentFile(f.root, d.id)).text(), await pdf('Ausgefüllt').text());
  assert.equal(r.aufraeumenOffen, 0);
  const wieder = await vault.saveLocalPdfEdit(f.root, quelle, pdf('Ausgefüllt'));
  assert.equal(wieder.dokument.storedPath, r.dokument.storedPath);
  assert.equal((await readIndex(f.root)).documents.length, 1);
});
await test('Unveränderte Rückgabe erzeugt weder Datei noch zweiten Eintrag', async () => {
  const { f, d, quelle, file } = await basis();
  const r = await vault.saveLocalPdfEdit(f.root, quelle, file);
  assert.equal(r.dokument.storedPath, d.storedPath); assert.equal((await readIndex(f.root)).documents.length, 1);
});
await test('Zwei Bearbeitungsräume: spätere Rückgabe überschreibt die inzwischen gespeicherte Fassung nicht', async () => {
  const { f, d, quelle } = await basis(); const zweite = await vault.beginLocalPdfEdit(f.root, d.id);
  await vault.saveLocalPdfEdit(f.root, quelle, pdf('Neuere Fassung'));
  await assert.rejects(() => vault.saveLocalPdfEdit(f.root, zweite.quelle, pdf('Veraltet')), /inzwischen geändert/);
  assert.equal(await (await vault.readLocalDocumentFile(f.root, d.id)).text(), await pdf('Neuere Fassung').text());
});
await test('Andere Akte, gelöschtes Dokument und fremde Datei werden ohne Ersatz-Eintrag abgewiesen', async () => {
  const { f, d, quelle } = await basis(); const andere = await basis();
  await assert.rejects(() => vault.saveLocalPdfEdit(andere.f.root, quelle, pdf('Falsch')), /anderen Akte/);
  await assert.rejects(() => vault.saveLocalPdfEdit(f.root, quelle, new File(['kein PDF'], 'falsch.txt')), /PDF-Datei/);
  const index = await readIndex(f.root); index.documents = []; await writeIndex(f.root, index);
  await assert.rejects(() => vault.saveLocalPdfEdit(f.root, quelle, pdf('Gelöscht')), /nicht mehr vorhanden/);
  assert.equal((await readIndex(f.root)).documents.length, 0); assert.ok(f.root.find(d.storedPath));
});
await test('Registerfehler: Quelle bleibt lesbar, keine unregistrierte Ergebnisdatei', async () => {
  const { f, d, quelle } = await basis();
  f.fail.add('Familienakte_Register.json');
  await assert.rejects(() => vault.saveLocalPdfEdit(f.root, quelle, pdf('Noch nicht gespeichert')));
  assert.equal((await readIndex(f.root)).documents[0].storedPath, d.storedPath);
  assert.equal(await (await vault.readLocalDocumentFile(f.root, d.id)).text(), await pdf('Quelle').text());
  const ordner = f.root.find(d.storedPath.slice(0, d.storedPath.lastIndexOf('/')));
  assert.equal([...ordner.inhalt.values()].filter(e => e.kind === 'file').length, 1);
});
await test('Pro-Tresor: gleiche Dokumentkennung und gleicher Tresor; kein interner Ersatz bei gesperrtem Tresor', async () => {
  const f = fs(); await writeIndex(f.root, await readIndex(f.root)); await vault.setProDocumentVault(f.root, 'tresor-a');
  const d = await vault.saveLocalDocument(f.root, pdf('Quelle'), daten); const { quelle } = await vault.beginLocalPdfEdit(f.root, d.id);
  const r = await vault.saveLocalPdfEdit(f.root, quelle, pdf('Pro-Rückgabe'));
  assert.equal(r.dokument.id, d.id); assert.ok(r.dokument.storedPath.startsWith('pro-tresor://tresor-a/'));
  assert.equal((await readIndex(f.root)).documents.length, 1); assert.equal(f.root.find('Me_Myself_and_I_Familienakte/01_Dokumente'), null);
  nativ.status = 'gesperrt';
  await assert.rejects(() => vault.saveLocalPdfEdit(f.root, r.quelle, pdf('Gesperrt')));
  assert.equal((await readIndex(f.root)).documents[0].checksum, r.dokument.checksum);
});
await test('Register-Commit mit nachträglichem Rückmeldefehler verliert die neue Datei nicht', async () => {
  const { f, d, quelle } = await basis(); f.failAfterClose = new Set(['Familienakte_Register.json']);
  const r = await vault.saveLocalPdfEdit(f.root, quelle, pdf('Trotz Rückmeldefehler gespeichert'));
  assert.equal(r.dokument.id, d.id);
  assert.equal(await (await vault.readLocalDocumentFile(f.root, d.id)).text(), await pdf('Trotz Rückmeldefehler gespeichert').text());
  assert.equal((await readIndex(f.root)).documents.length, 1);
});
await test('Vorübergehend gesperrte Altdatei: gültiger Eintrag bleibt, Aufräumen wird nach Neustart nachgeholt', async () => {
  const { f, d, quelle } = await basis(); f.failRemove = new Set([d.storedPath.split('/').pop()]);
  const r = await vault.saveLocalPdfEdit(f.root, quelle, pdf('Neue bestätigte Fassung'));
  assert.equal(r.aufraeumenOffen, 1); assert.ok(f.root.find(d.storedPath));
  assert.equal((await readIndex(f.root)).pdfAltdateien.length, 1);
  await vault.beginLocalPdfEdit(f.root, d.id);
  assert.equal(f.root.find(d.storedPath), null); assert.equal((await readIndex(f.root)).pdfAltdateien.length, 0);
  assert.equal((await readIndex(f.root)).documents.length, 1);
});
await test('Eine von einem anderen Dokument weiterhin benutzte Datei wird nicht gelöscht', async () => {
  const { f, d, quelle } = await basis(); const index = await readIndex(f.root);
  index.documents.push({ ...d, id: 'andere-kennung' }); await writeIndex(f.root, index);
  await vault.saveLocalPdfEdit(f.root, quelle, pdf('Nur die gewählte Unterlage'));
  assert.ok(f.root.find(d.storedPath));
  assert.equal(await (await vault.readLocalDocumentFile(f.root, 'andere-kennung')).text(), await pdf('Quelle').text());
  assert.equal((await readIndex(f.root)).documents.length, 2);
});
console.log(`PDF-Rückgabe: ${gruen} Prüfgruppen grün; echtes Register-/Speicherverfahren, Dateisystem und native Brücke gestellt.`);
