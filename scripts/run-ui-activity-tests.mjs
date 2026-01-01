import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { activityEntry, appendActivity, copyActivityText, inventoryScanFeedback, inventoryAssignmentFeedback, inventoryArchiveFeedback, inventoryReleaseFeedback } from "../lib/ui-activity.ts";
import { scanInventoryFolder, readLocalVaultData, confirmInventoryAssignment, archiveInventoryItems, releaseInventoryItemsForAssistant } from "../app/local-vault.ts";

let count = 0;
function check(label, run) { run(); count++; console.log(`🟢 ${label}`); }
const source = (file) => readFileSync(resolve(file), "utf8");
const portal = source("app/health-portal.tsx");
const component = source("app/ui-activity.tsx");
const css = source("app/globals.css");
const entries = [];
let sequence = 0;
const report = (feedback) => { entries.splice(0, entries.length, ...appendActivity(entries, activityEntry(feedback, ++sequence))); };

check("Leere Meldung verändert die beiden Zeilen nicht", () => assert.equal(appendActivity(entries, activityEntry({ kind: "success", text: "  " }, 0)), entries));
report({ kind: "success", text: "Erste echte Rückmeldung" });
report({ kind: "error", text: "Zweite echte Rückmeldung" });
report({ kind: "info", text: "Dritte echte Rückmeldung" });
check("Genau zwei Ergebnisse, neuestes oben; ältestes verdrängt", () => { assert.equal(entries.length, 2); assert.match(entries[0].text, /Dritte/); assert.match(entries[1].text, /Zweite/); });
check("Erfolg, Fehler und Offenstatus werden nicht verwechselt", () => { assert.equal(entries[0].kind, "warning"); assert.equal(entries[1].kind, "error"); assert.equal(activityEntry({ kind: "success", text: "Archivkopie geprüft" }, 10).kind, "success"); });
check("Status bleibt ohne Farbwahrnehmung verständlich", () => { assert.match(entries[0].text, /^Prüfung erforderlich:/); assert.match(entries[1].text, /^Fehlgeschlagen:/); });
check("Gesundheitsdiagnosen werden nicht in globale Zeilen übernommen", () => { const entry = activityEntry({ kind: "error", text: "Ärztlicher_Bericht_Erkältung.pdf nicht lesbar" }, 11); assert.doesNotMatch(entry.text, /Erkältung|Ärztlicher/); assert.equal(entry.kind, "error"); });

const copied = [];
await copyActivityText(entries[0].text, async (text) => copied.push(text));
await copyActivityText(entries[1].text, async (text) => copied.push(text));
check("Beide Copy-Wege kopieren unabhängig ausschließlich den vollständigen Zeilentext", () => assert.deepEqual(copied, entries.map((entry) => entry.text)));
check("Copy verändert die Ergebnisreihenfolge nicht", () => assert.match(entries[0].text, /Dritte/));
await assert.rejects(copyActivityText(entries[0].text, async () => { throw new Error("Clipboard verweigert"); }), /Clipboard verweigert/);
count++; console.log("🟢 Verweigerte Zwischenablage meldet keinen Kopiererfolg");

// Render the actual shared React component without a browser or local files.
const js = ts.transpileModule(component, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from "([^"]+)"/g, (_all, specifier) => `from ${JSON.stringify(specifier === "../lib/ui-activity" ? new URL("../lib/ui-activity.ts", import.meta.url).href : import.meta.resolve(specifier))}`);
const { ActivityLinesView } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const markup = renderToStaticMarkup(React.createElement(ActivityLinesView, { entries }));
check("React-Ausgabe enthält genau zwei Aktivitätszeilen und zwei Copy-Buttons", () => { assert.equal((markup.match(/class="global-activity-row /g) || []).length, 2); assert.equal((markup.match(/>Copy<\/button>/g) || []).length, 2); });
check("React-Ausgabe verwendet tatsächliche Statusklassen und vollständige Texte", () => { assert.match(markup, /activity-warning/); assert.match(markup, /activity-error/); assert.match(markup, /Dritte echte Rückmeldung/); });
const emptyMarkup = renderToStaticMarkup(React.createElement(ActivityLinesView, { entries: [] }));
check("Ohne Aktion zeigen beide Zeilen ehrliche Platzhalter und inaktive Copy-Buttons", () => { assert.equal((emptyMarkup.match(/disabled=""/g) || []).length, 2); assert.match(emptyMarkup, /Noch keine Aktion ausgeführt/); });
check("Copy-Rückmeldung ist unabhängig, kurz und fehlertolerant", () => { assert.ok(component.includes('setCopyState("copied")') && component.includes('setCopyState("error")')); assert.ok(component.includes("2200") && component.includes('"Kopiert"')); });
check("Zentrale Anzeige steht genau einmal unter der Suche und vor Seiteninhalten", () => { assert.equal((portal.match(/<ActivityLines\/>/g) || []).length, 1); assert.ok(portal.indexOf("<ActivityLines/>") > portal.indexOf('className="search-command-bar"')); assert.ok(portal.indexOf("<ActivityLines/>") < portal.indexOf('className="breadcrumb"')); assert.ok(!portal.includes("{notice &&")); });
check("Meldungsspeicher bleibt über Menüwechsel erhalten und enthält keine fachliche Persistenz", () => { assert.match(portal, /<ActivityProvider><HealthPortalContent\/><\/ActivityProvider>/); assert.ok(!/localStorage|indexedDB|fetch\(/.test(component)); });

// In-memory File System Access adapter. Never touches the user's Windows drive.
class MemoryFile {
  kind = "file"; data = new Uint8Array(); modified = 1792050000000;
  constructor(name) { this.name = name; }
  async getFile() { return new File([this.data], this.name, { type: this.name.endsWith(".json") ? "application/json" : "text/plain", lastModified: this.modified }); }
  async createWritable() { return { write: async (value) => { this.data = new Uint8Array(await (value instanceof Blob ? value : new Blob([value])).arrayBuffer()); }, close: async () => {} }; }
}
class MemoryDirectory {
  kind = "directory"; entries = new Map(); permission = "granted";
  constructor(name) { this.name = name; }
  async queryPermission() { return this.permission; }
  async requestPermission() { return this.permission; }
  async isSameEntry(other) { return this === other; }
  async resolve(other) { if (other === this) return []; for (const [name, entry] of this.entries) { if (entry === other) return [name]; if (entry.kind === "directory") { const path = await entry.resolve(other); if (path) return [name, ...path]; } } return null; }
  async getDirectoryHandle(name, options = {}) { const entry = this.entries.get(name); if (entry?.kind === "directory") return entry; if (entry || !options.create) throw new DOMException(name, "NotFoundError"); const created = new MemoryDirectory(name); this.entries.set(name, created); return created; }
  async getFileHandle(name, options = {}) { const entry = this.entries.get(name); if (entry?.kind === "file") return entry; if (entry || !options.create) throw new DOMException(name, "NotFoundError"); const created = new MemoryFile(name); this.entries.set(name, created); return created; }
  async removeEntry(name) { if (!this.entries.delete(name)) throw new DOMException(name, "NotFoundError"); }
  async *values() { yield* this.entries.values(); }
}
const register = new MemoryDirectory("Testtresor");
const original = new MemoryDirectory("Synthetischer_Testbestand");
const subfolder = await original.getDirectoryHandle("Rechnungen", { create: true });
for (let index = 1; index <= 107; index++) { const file = await subfolder.getFileHandle(`Rechnung_${index}.txt`, { create: true }); const writer = await file.createWritable(); await writer.write(`SYNTHETISCHE TESTDATEI\nRechnung Testfirma ${index}\nRechnungsnummer R-${index}\nReparatur Smartphone\nBetrag 100 Euro\n`); await writer.close(); }
const before = await (await subfolder.getFileHandle("Rechnung_1.txt")).getFile().then((file) => file.text());
const first = await scanInventoryFolder({ source: original, register, sourceKind: "local" });
report(inventoryScanFeedback(first));
check("Realer Kern im Speichermodell: erster Lauf erfasst 107 synthetische Dateien", () => { assert.equal(first.processed, 107); assert.match(entries[0].text, /107 Dateien geprüft/); });
const second = await scanInventoryFolder({ source: original, register, sourceKind: "local" });
report(inventoryScanFeedback(second));
check("A: Inkrementeller Lauf zeigt 107 unverändert aus tatsächlichem Ergebnis", () => { assert.equal(second.unchanged, 107); assert.match(entries[0].text, /107 unverändert/); assert.match(entries[0].text, /Keine erneute vollständige Inhaltsanalyse/); });
const data = await readLocalVaultData(register);
const assigned = await confirmInventoryAssignment({ register, itemId: data.inventoryItems[0].id, canonicalLifeArea: "Technik, Geräte & Reparaturen", documentType: "Rechnung" });
report(inventoryAssignmentFeedback(assigned));
check("B: Bestätigte Zuordnung meldet erst nach gespeichertem Lernsignal Erfolg", () => { assert.match(entries[0].text, /Zuordnung bestätigt · Lernsignal gespeichert/); assert.ok(assigned.item.assignmentConfirmedAt); });
const archive = new MemoryDirectory("Testarchiv");
const archived = await archiveInventoryItems({ register, source: original, archive, itemIds: [assigned.item.id] });
report(inventoryArchiveFeedback(archived));
check("C: Archivmeldung entspricht tatsächlich geprüfter Archivkopie", () => { assert.equal(archived.archived, 1); assert.equal(archived.failed, 0); assert.match(entries[0].text, /1 Datei mit Prüfsumme archiviert/); });
const released = await releaseInventoryItemsForAssistant({ register, archive, itemIds: [assigned.item.id] });
report(inventoryReleaseFeedback(released));
check("D: Assistenzmeldung entspricht tatsächlichem Freigabeergebnis", () => { assert.equal(released.released + released.reused, 1); assert.match(entries[0].text, /1 Dokument für die Assistenz/); });
const persisted = await readLocalVaultData(register);
check("Archivierung und Freigabe behalten ihren fachlichen Status", () => assert.equal(persisted.inventoryItems.find((item) => item.id === assigned.item.id).state, "ASSISTENZ_FREIGEGEBEN"));
check("Synthetisches Original wurde nicht verändert", () => assert.equal(before, new TextDecoder().decode(subfolder.entries.get("Rechnung_1.txt").data)));
const denied = new MemoryDirectory("Archiv-ohne-Berechtigung"); denied.permission = "denied";
try { await archiveInventoryItems({ register, source: original, archive: denied, itemIds: [data.inventoryItems[1].id] }); assert.fail("Berechtigungsfehler erwartet"); } catch (reason) { report({ kind: "error", text: reason.message }); }
check("E: Fehlende Freigabe wird rot mit konkreter Ursache dargestellt", () => { assert.equal(entries[0].kind, "error"); assert.match(entries[0].text, /freigegeben/); });
report(inventoryArchiveFeedback({ archived: 1, alreadyArchived: 0, failed: 1 }));
check("Teilweise Archivierung wird nicht künstlich grün", () => assert.equal(entries[0].kind, "warning"));
check("Zwei Zeilen bleiben nach allen echten Kernaktionen begrenzt", () => assert.equal(entries.length, 2));

check("Überschriften haben drei definierte Ebenen, blauen Text und pastellblaue Hinterlegung", () => { assert.ok(css.includes('.app-shell :is(h1,h2,h3,h4)')); assert.ok(css.includes("background: #edf5fc") && css.includes("border: 1px solid #c9dceb")); assert.ok(css.includes(".app-shell h1") && css.includes(".app-shell h2") && css.includes(".app-shell h3")); });
check("Ansehen steht unter dem unveränderten Status und verwendet denselben Handler", () => { assert.ok(portal.includes('className="inventory-item-actions"')); assert.ok(portal.includes('onClick={() => setPreviewItemId(item.id)}><Eye size={15}/> Ansehen')); assert.ok(css.includes(".inventory-item-actions .inventory-preview-button")); });
check("Responsive Regeln erhalten Copy und verhindern unlesbare Textüberläufe", () => { assert.ok(css.includes(".global-activity-text { min-width: 0; overflow-wrap: anywhere; }")); assert.ok(css.includes("min-width: 63px") && css.includes("min-height: 42px")); });
console.log(`🟢 ${count} UI-/Stabilitätsprüfungen bestanden. React-Ausgabe und synthetische In-Memory-Abläufe geprüft; kein echter Windows-/Mobilbrowser nachgewiesen.`);
