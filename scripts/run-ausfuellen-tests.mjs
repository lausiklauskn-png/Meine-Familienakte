// Proben für „Ausfüllen“ (Sitzung F): Pins des Workflow-PDF-Kerns und die reine Rechnung in lib/ausfuellen.ts.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { runAusfuellenSelfTests } from "../lib/ausfuellen.ts";
import { runPersonKontaktSelfTests } from "../lib/person-kontakt.ts";

const herkunft = JSON.parse(readFileSync("public/wfpdf/HERKUNFT.json", "utf8"));
assert.equal(herkunft.repo, "lausiklauskn-png/Workflow-PDF");
assert.match(herkunft.commit, /^[0-9a-f]{40}$/, "HERKUNFT.json nennt keinen Commit.");
const dateien = Object.entries(herkunft.dateien);
for (const pflicht of ["scanner.js", "scan-bild.js", "blatt.js", "erkennung.js", "export.js", "reinigung.js", "schluesseltresor.js", "pdf-lib.min.js", "vendor/tesseract/tesseract.min.js", "vendor/tesseract/lang/deu.traineddata", "vendor/scanic/scanic.js"]) {
  assert.ok(herkunft.dateien[`public/wfpdf/${pflicht}`], `HERKUNFT.json pinnt ${pflicht} nicht.`);
}
for (const [ziel, { sha256 }] of dateien) {
  assert.ok(existsSync(ziel), `${ziel} fehlt.`);
  assert.equal(createHash("sha256").update(readFileSync(ziel)).digest("hex"), sha256, `${ziel} weicht vom Pin ab — nie von Hand ändern, sondern node tools/wfpdf-nachziehen.mjs.`);
}
console.log(`🟢 Workflow-PDF-Kern: ${dateien.length} Dateien byte-gleich mit ${herkunft.commit.slice(0, 7)}`);
// Gleich mit der Quelle daneben, wenn ein Klon da ist (wie BookLedgerPro).
const klon = process.env.WFPDF_KLON || "../Workflow-PDF";
if (existsSync(`${klon}/assets/scanner.js`)) {
  let anders = 0;
  for (const [ziel, { quelle }] of dateien) if (existsSync(`${klon}/${quelle}`) && !readFileSync(`${klon}/${quelle}`).equals(readFileSync(ziel))) { anders++; console.log(`🟡 ${ziel} ist im Klon inzwischen anders (nachziehen?)`); }
  if (!anders) console.log("🟢 Gleich mit dem Workflow-PDF-Klon daneben");
}
for (const test of [...runAusfuellenSelfTests(), ...runPersonKontaktSelfTests()]) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
