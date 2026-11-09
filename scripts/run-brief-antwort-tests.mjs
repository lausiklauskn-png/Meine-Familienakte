import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runBriefAntwortSelfTests } from "../lib/brief-antwort.ts";

// Abschnitt D: „Brief oder E-Mail beantworten“ mit dem echten Modul 25 (byte-1:1, Pin in run-ki-auftrag-tests.mjs).
const fenster = {};
new Function("window", "self", "globalThis", readFileSync("public/native/25_pseudonym.js", "utf8"))(fenster, fenster, fenster);
const p = fenster.SbkimPseudonym || globalThis.SbkimPseudonym;
assert.ok(p, "Modul 25 hat sich nicht angemeldet.");
for (const test of runBriefAntwortSelfTests(p)) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
console.log("Brief beantworten: alles grün");
const { runTextPdfSelfTests } = await import("../lib/text-pdf.ts");
for (const test of runTextPdfSelfTests()) { assert.equal(test.passed, true, `${test.label}: ${test.summary}`); console.log(`🟢 PDF ${test.label}: ${test.summary}`); }
