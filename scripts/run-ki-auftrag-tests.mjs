import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runKiAuftragSelfTests } from "../lib/ki-auftrag.ts";

// Modul 25 ist byte-1:1 aus Sage (über Private Brain Pro, modules/25_pseudonym.js) — nie hier ändern, dort pflegen und neu kopieren.
const PIN = "8c3092babee80b8fce2c6607cc4c8ced4bbef4addf31a5f0f3de6ba5c92c2ad7";
const quelle = readFileSync("public/native/25_pseudonym.js");
assert.equal(createHash("sha256").update(quelle).digest("hex"), PIN, "public/native/25_pseudonym.js weicht von der Kanon-Fassung ab.");
console.log("🟢 Modul 25 byte-gleich mit dem Kanon");
// Im selben Realm laufen lassen (instanceof RegExp), mit eigenem „window“.
const fenster = {};
new Function("window", "self", "globalThis", quelle.toString("utf8"))(fenster, fenster, fenster);
const p = fenster.SbkimPseudonym || globalThis.SbkimPseudonym;
assert.ok(p, "Modul 25 hat sich nicht angemeldet.");
for (const test of runKiAuftragSelfTests(p)) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
const html = readFileSync("index.html", "utf8");
assert.ok(html.indexOf("native/25_pseudonym.js") > 0 && html.indexOf("native/25_pseudonym.js") < html.indexOf("native/familienakte-app.js"), "index.html lädt Modul 25 nicht vor der Hülle.");
console.log("🟢 index.html lädt Modul 25");
