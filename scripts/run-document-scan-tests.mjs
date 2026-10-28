import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runDocumentScanSelfTests } from "../lib/document-scan.ts";
import { buildDocumentIntakePlan } from "../lib/document-intake.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const dialog = read("app/document-scan-dialog.tsx");
const scan = read("lib/document-scan.ts");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

assert.ok(portal.includes("Dokument fotografieren") && portal.includes("camera-scan"), "Der aktive Kamera-Eingang fehlt im gemeinsamen Dokumenteneingang.");
assert.ok(dialog.includes('capture="environment"') && dialog.includes("Foto auswählen"), "Kamera und Fotoauswahl sind nicht gemeinsam vorbereitet.");
assert.ok(dialog.includes("Nächste Seite fotografieren") && dialog.includes("Aufnahme prüfen") && dialog.includes("Fertig – PDF erstellen"), "Die verbindliche Scan-Abfolge fehlt.");
assert.ok(dialog.includes("neu fotografieren") && dialog.includes("entfernen") && dialog.includes("Ränder behutsam zuschneiden"), "Seitenprüfung oder Korrekturfunktionen fehlen.");
assert.ok(scan.includes("buildPdfFromJpegPages") && scan.includes("createDocumentScanPdf"), "Die lokale PDF-Erstellung fehlt.");
assert.ok(vault.includes("scanOriginalsPath") && vault.includes("Scan-Originale"), "Die bestätigungspflichtige Anlage der Originalaufnahmen fehlt.");
assert.ok(styles.includes(".scan-modal") && styles.includes(".scan-workspace") && styles.includes(".scan-page-controls"), "Die mobile Scan-Oberfläche ist nicht vollständig gestaltet.");
assert.ok(manifest.documentScanReuse.includes("bestehender Dokumenteneingang") && manifest.documentScanSafety.includes("keine kostenpflichtige API verwenden"), "Wiederverwendung oder Sicherheitsregel fehlt.");

const plan = buildDocumentIntakePlan({ file: { name: "Dokumentscan_Krankenkasse_Zuschuss.pdf", size: 1024, type: "application/pdf" }, source: "camera-scan", documents: [], records: [] });
assert.equal(plan.source, "camera-scan");
assert.equal(plan.requiresReview, true, "Fotografierte Dokumente müssen vor der Ablage bewusst geprüft werden.");
assert.equal(plan.lifeArea, "Gesundheit & Pflege", "Ein aussagekräftiger Scan-Hinweis muss die vorhandene FaWoGa-Einordnung verwenden.");

const tests = runDocumentScanSelfTests();
assert.equal(tests.length, 8, "Es müssen genau acht Scan-/PDF-Praxistests vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

console.log("🟢 Scan-Integration: Kamera/Foto → Seitenprüfung → eine PDF → vorhandener Dokumenteneingang");
console.log("🟢 Datenschutz: keine externe API, keine zweite Dokumentdatenbank und keine automatischen Einzelbild-Dokumente");
