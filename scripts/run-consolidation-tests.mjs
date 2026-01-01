import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONSOLIDATION_VERSION, LEADING_DATA_AUTHORITY, runCoreConsolidationSelfTests } from "../lib/family-consolidation.ts";
import { readLocalSystemSnapshot, restoreFullFamilyBackup, writeFullFamilyBackup } from "../app/local-vault.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const vault = read("app/local-vault.ts");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

const notFound = (name) => new DOMException(`Nicht gefunden: ${name}`, "NotFoundError");
class MemoryFileHandle {
  kind = "file";
  data = new Uint8Array();
  constructor(name) { this.name = name; }
  async getFile() { return new File([this.data], this.name, { type: this.name.endsWith(".json") ? "application/json" : "application/octet-stream" }); }
  async createWritable() {
    return {
      write: async (value) => {
        const blob = typeof value === "string" ? new Blob([value]) : value instanceof Blob ? value : new Blob([value]);
        this.data = new Uint8Array(await blob.arrayBuffer());
      },
      close: async () => {},
    };
  }
}
class MemoryDirectoryHandle {
  kind = "directory";
  entries = new Map();
  constructor(name) { this.name = name; }
  async queryPermission() { return "granted"; }
  async requestPermission() { return "granted"; }
  async isSameEntry(other) { return this === other; }
  async getDirectoryHandle(name, options = {}) {
    const existing = this.entries.get(name);
    if (existing?.kind === "directory") return existing;
    if (existing || !options.create) throw notFound(name);
    const directory = new MemoryDirectoryHandle(name);
    this.entries.set(name, directory);
    return directory;
  }
  async getFileHandle(name, options = {}) {
    const existing = this.entries.get(name);
    if (existing?.kind === "file") return existing;
    if (existing || !options.create) throw notFound(name);
    const file = new MemoryFileHandle(name);
    this.entries.set(name, file);
    return file;
  }
  async removeEntry(name, options = {}) {
    const existing = this.entries.get(name);
    if (!existing) throw notFound(name);
    if (existing.kind === "directory" && existing.entries.size && !options.recursive) throw new DOMException("Ordner nicht leer", "InvalidModificationError");
    this.entries.delete(name);
  }
  async *values() { yield* this.entries.values(); }
}

async function writeVirtualFile(directory, name, contents) {
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function runRealBackupRestoreTest() {
  const source = new MemoryDirectoryHandle("Quelle-2.27.1");
  const destination = new MemoryDirectoryHandle("Sicherungen");
  const restoreTarget = new MemoryDirectoryHandle("Leerer-Testordner");
  const root = await source.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const register = await root.getDirectoryHandle("00_Register", { create: true });
  const documents = await root.getDirectoryHandle("01_Dokumente", { create: true });
  const storedPath = "Me_Myself_and_I_Familienakte/01_Dokumente/Testunterlage.pdf";
  const documentData = new TextEncoder().encode("Geprüfte Testunterlage 2.27.1");
  const checksum = await crypto.subtle.digest("SHA-256", documentData).then((value) => [...new Uint8Array(value)].map((part) => part.toString(16).padStart(2, "0")).join(""));
  const index = {
    version: 5,
    modelVersion: 1,
    updatedAt: "2026-10-10T20:00:00.000Z",
    documents: [{ id: "DOC-TEST-000001", originalName: "Testunterlage.pdf", category: "Familie & persönliche Dokumente", documentDate: "2026-10-10", mimeType: "application/pdf", sizeBytes: documentData.byteLength, status: "geprüft", notes: null, addedAt: "2026-10-10T20:00:00.000Z", storedPath, source: "Regressionstest", updatedAt: "2026-10-10T20:00:00.000Z", storageType: "local", checksum, storageLocations: [{ id: "LOC-DOC-TEST-000001-local", storageType: "local", path: storedPath, source: "Regressionstest", checksum, fileSize: documentData.byteLength, verifiedAt: "2026-10-10T20:00:00.000Z" }] }],
    records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {}, auditLog: [],
  };
  await writeVirtualFile(register, "Familienakte_Register.json", JSON.stringify(index, null, 2));
  await writeVirtualFile(documents, "Testunterlage.pdf", documentData);
  const backup = await writeFullFamilyBackup({ source, destination, appVersion: "2.27.1", createdAt: "2026-10-10T20:00:00.000Z" });
  const backupFolder = await destination.getDirectoryHandle(backup.folderName);
  const restored = await restoreFullFamilyBackup({ backup: backupFolder, emptyTarget: restoreTarget });
  assert.equal(restored.verification?.ok, true, "Die echte Testwiederherstellung muss vollständig bestätigt sein.");
  assert.equal(restored.manifest.counts.documents, 1, "Die wiederhergestellte Dokumentenzahl stimmt nicht.");
  assert.equal(restored.manifest.counts.files, 1, "Die wiederhergestellte Originaldatei fehlt.");
  return restored;
}

async function runCorruptedRegisterProtectionTest() {
  const vault = new MemoryDirectoryHandle("Beschädigtes-Testregister");
  const root = await vault.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const register = await root.getDirectoryHandle("00_Register", { create: true });
  const brokenText = "{ beschädigtes Register";
  await writeVirtualFile(register, "Familienakte_Register.json", brokenText);
  const snapshot = await readLocalSystemSnapshot(vault);
  const preserved = await (await (await register.getFileHandle("Familienakte_Register.json")).getFile()).text();
  assert.equal(snapshot.registerState, "corrupted", "Ein beschädigtes Register muss eindeutig erkannt werden.");
  assert.equal(snapshot.integrityLevel, "red", "Ein beschädigtes Register muss die Freigabe auf ROT setzen.");
  assert.equal(preserved, brokenText, "Das beschädigte Register darf beim Öffnen nicht überschrieben werden.");
}

async function runNestedVaultDetectionTest() {
  const selectedFolder = new MemoryDirectoryHandle("Ausgewählter-Tresorordner");
  const firstRoot = await selectedFolder.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const emptyRegister = await firstRoot.getDirectoryHandle("00_Register", { create: true });
  await writeVirtualFile(emptyRegister, "Familienakte_Register.json", JSON.stringify({
    version: 5, modelVersion: 1, updatedAt: "2026-10-12T16:30:00.000Z", documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], inventoryItems: [], sequences: {}, auditLog: [],
  }));
  const actualRoot = await firstRoot.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const actualRegister = await actualRoot.getDirectoryHandle("00_Register", { create: true });
  await writeVirtualFile(actualRegister, "Familienakte_Register.json", JSON.stringify({
    version: 5,
    modelVersion: 1,
    updatedAt: "2026-10-12T16:31:00.000Z",
    documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {}, auditLog: [],
    inventoryItems: [
      { id: "INV-ANALYSED", state: "QUELLE_ANALYSIERT" },
      { id: "INV-ARCHIVED", state: "ARCHIVIERT" },
      { id: "INV-RELEASED", state: "ASSISTENZ_FREIGEGEBEN" },
    ],
  }));
  const snapshot = await readLocalSystemSnapshot(selectedFolder);
  assert.equal(snapshot.inventoryCount, 3, "Ein verschachtelter vorhandener Registerbestand muss gefunden werden.");
  assert.equal(snapshot.archivedInventoryCount, 2, "Archivierte Einträge im verschachtelten Register müssen erkannt werden.");
  assert.equal(snapshot.assistantReleasedInventoryCount, 1, "Freigegebene Einträge im verschachtelten Register müssen erkannt werden.");

  const reverseSelectedFolder = new MemoryDirectoryHandle("Ausgewählter-Tresorordner-mit-Daten-oben");
  const populatedRoot = await reverseSelectedFolder.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const populatedRegister = await populatedRoot.getDirectoryHandle("00_Register", { create: true });
  await writeVirtualFile(populatedRegister, "Familienakte_Register.json", JSON.stringify({
    version: 5,
    modelVersion: 1,
    updatedAt: "2026-10-12T16:31:00.000Z",
    documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {}, auditLog: [],
    inventoryItems: [
      { id: "INV-ANALYSED", state: "QUELLE_ANALYSIERT" },
      { id: "INV-ARCHIVED", state: "ARCHIVIERT" },
      { id: "INV-RELEASED", state: "ASSISTENZ_FREIGEGEBEN" },
    ],
  }));
  const laterEmptyRoot = await populatedRoot.getDirectoryHandle("Me_Myself_and_I_Familienakte", { create: true });
  const laterEmptyRegister = await laterEmptyRoot.getDirectoryHandle("00_Register", { create: true });
  await writeVirtualFile(laterEmptyRegister, "Familienakte_Register.json", JSON.stringify({
    version: 5, modelVersion: 1, updatedAt: "2026-10-12T16:32:00.000Z", documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], inventoryItems: [], sequences: {}, auditLog: [],
  }));
  const reverseSnapshot = await readLocalSystemSnapshot(reverseSelectedFolder);
  assert.equal(reverseSnapshot.inventoryCount, 3, "Ein später erzeugtes leeres Unterregister darf einen vorhandenen Pilotbestand nicht verdecken.");
  assert.equal(reverseSnapshot.assistantReleasedInventoryCount, 1, "Der vollständigste gültige Registerbestand muss verwendet werden.");
}

assert.equal(CONSOLIDATION_VERSION, "2.27.1");
assert.equal(LEADING_DATA_AUTHORITY, "Lokales Familienakten-Register");
assert.equal(manifest.leadingDataAuthority, LEADING_DATA_AUTHORITY);
assert.equal(manifest.canonicalCategoryCount, 18);
assert.ok(manifest.requiredAreaIds.includes("coreconsolidation"));
assert.ok(manifest.completedCapabilities.includes("Konsolidierung, Datensicherheit und gemeinsame Kernlogik 2.27.1"));
assert.ok(vault.includes("class VaultRegisterError"), "Beschädigte Register müssen ausdrücklich blockiert werden.");
assert.ok(vault.includes("writeFullFamilyBackup") && vault.includes("restoreFullFamilyBackup"), "Vollständige Sicherung und Testwiederherstellung fehlen.");
assert.ok(vault.includes("deleteLocalMemoryRecord") && vault.includes("updateLocalMemoryRecord"), "Der vollständige Memory-Lebenszyklus fehlt.");
assert.ok(portal.includes("Wie schützt Version 2.27.1 meine Daten?"), "Die Hilfe zum Registerschutz fehlt.");
assert.ok(portal.includes("Vollständige Sicherung und Wiederherstellung"), "Die Hilfe zur vollständigen Sicherung fehlt.");
assert.ok(portal.includes("Was bedeuten GRÜN, GELB und ROT?"), "Die Hilfe zur Freigabebewertung fehlt.");

const results = runCoreConsolidationSelfTests();
assert.equal(results.length, 12, "Es müssen genau zwölf Konsolidierungs- und Regressionstests vorhanden sein.");
for (const result of results) {
  assert.equal(result.passed, true, `${result.label}: ${result.summary}`);
  console.log(`🟢 ${result.label}: ${result.summary}`);
}

const realRestore = await runRealBackupRestoreTest();
console.log(`🟢 Echte Testwiederherstellung: ${realRestore.manifest.counts.documents} Dokument und ${realRestore.manifest.counts.files} Originaldatei in leerer Testumgebung bestätigt.`);
await runCorruptedRegisterProtectionTest();
console.log("🟢 Echter Registerschutz: beschädigte vorhandene Datei erkannt, unverändert erhalten und Prüfstatus ROT.");
await runNestedVaultDetectionTest();
console.log("🟢 Tresorerkennung: Der vollständigste vorhandene Registerbestand wird auch bei doppelt verschachtelten Familienakten-Ordnern gefunden.");

console.log("🟢 Standard-Testbefehl: pnpm check:consolidation");
console.log("🟢 Produktive Originaldaten werden von diesem Testlauf nicht verändert.");
