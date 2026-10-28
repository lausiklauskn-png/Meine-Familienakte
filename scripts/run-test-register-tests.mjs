import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prepareReadableInventorySourceFiles, readableDirectoryAccessError, runPreparedTestRegisterSelfTests } from "../app/local-vault.ts";

const tests = runPreparedTestRegisterSelfTests();
assert.equal(tests.length, 7, "Für die Testregister-Vorschau müssen sieben technische Prüfungen vorhanden sein.");
for (const test of tests) assert.equal(test.passed, true, `${test.id}: ${test.summary}`);

const portal = await readFile(new URL("../app/health-portal.tsx", import.meta.url), "utf8");
const vault = await readFile(new URL("../app/local-vault.ts", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../lib/system-check-manifest.json", import.meta.url), "utf8"));

assert.ok(portal.includes("Testregister vorbereiten") && portal.includes("Testregister ausdrücklich übernehmen") && portal.includes("Vorschau verwerfen"), "Vorschau, ausdrückliche Übernahme oder Verwerfen fehlen in der Bedienoberfläche.");
assert.ok(portal.includes("Analysequelle:") && portal.includes("Testdatentresor:") && portal.includes("nur Vorschau"), "Die drei getrennten Rollen werden nicht verständlich angezeigt.");
assert.ok(vault.includes("prepareTestRegisterPreview") && vault.includes("savePreparedTestRegister") && vault.includes('state: "QUELLE_ANALYSIERT"'), "Vorbereitung oder bestätigte Speicherung im bestehenden Register fehlt.");
assert.ok(vault.includes("externalTransfer: false") && vault.includes("originalFilesChanged: false"), "Externe Übertragung oder Originalschutz sind nicht eindeutig ausgeschlossen.");
assert.ok(manifest.completedCapabilities.includes("Automatische Testregister-Vorschau 2.28.1"), "Die neue Funktion fehlt im konsolidierten Entwicklungsstand.");

const readable = new File(["lesbar"], "Rechnung.pdf", { type: "application/pdf", lastModified: 1 });
const vanished = new File(["nicht mehr erreichbar"], "Verschoben.pdf", { type: "application/pdf", lastModified: 2 });
const accessIssues = [];
const preparedFiles = await prepareReadableInventorySourceFiles([
  { path: "ABLAGE/Rechnung.pdf", file: readable },
  { path: "ALT/Verschoben.pdf", file: vanished },
], accessIssues, async (file) => {
  if (file.name === "Verschoben.pdf") throw new DOMException("Datei fehlt", "NotFoundError");
  return "a".repeat(64);
});
assert.equal(preparedFiles.length, 1, "Eine verschwundene Einzeldatei darf die gesamte Testregister-Vorbereitung nicht abbrechen.");
assert.equal(accessIssues.length, 1, "Der Einzeldateifehler muss als technischer Hinweis erhalten bleiben.");
assert.match(accessIssues[0].reason, /ALT\/Verschoben\.pdf.*erneut auswählen/, "Der Fehlerhinweis muss den konkreten Pfad und die Lösung nennen.");
assert.match(readableDirectoryAccessError(new DOMException("Referenz ungültig", "InvalidStateError"), "FAMILIENAKTE_TESTBESTAND", "Ordner lesen"), /gespeicherte Ordnerreferenz.*erneut auswählen/, "Ungültige gespeicherte Ordnerreferenzen benötigen einen deutschen Lösungshinweis.");
assert.ok(vault.includes("verifiedDirectoryPermission") && vault.includes("verifiedDirectoryRelationship") && vault.includes("prepareReadableInventorySourceFiles"), "Berechtigungen, Ordnerbeziehungen und Einzeldateifehler werden nicht vollständig abgesichert.");
assert.ok(portal.includes("Testdatentresor erneut verbinden") && portal.includes("Test-Hauptordner erneut auswählen"), "Die Oberfläche bietet keine gezielte Wiederfreigabe für Quelle und Datentresor an.");
const upperActions = portal.slice(portal.indexOf('<div className="test-workspace-actions">'), portal.indexOf('{sourceHandle && <small className="test-workspace-saved">'));
assert.ok(upperActions.includes("Testakte für Weiterentwicklung") && upperActions.includes("Testregister vorbereiten"), "Der Testregister-Button ist nicht dauerhaft direkt neben der Testakten-Auswahl angeordnet.");
assert.match(upperActions, /button primary test-register-action/, "Der dauerhaft sichtbare Testregister-Button verwendet nicht die hervorgehobene dunkelblaue Hauptaktion.");
assert.ok(portal.includes("if (!testWorkspaceReport)") && portal.includes("const report = await inspectTestWorkspace(sourceHandle, vaultHandle)"), "Ein gespeicherter, noch nicht erneut geprüfter Bestand wird vor der Vorbereitung nicht kontrolliert geprüft.");

console.log(`Automatische Testregister-Erstellung: ${tests.length + 14}/${tests.length + 14} Tests bestanden.`);
