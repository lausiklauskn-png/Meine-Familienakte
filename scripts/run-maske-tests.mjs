import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runMaskeSelfTests } from "../lib/maske.ts";

// Maske (Pseudo-Knopf): verbesserte Erkennung auf dem echten Modul 25 (byte-1:1, Pin in run-ki-auftrag-tests.mjs).
const fenster = {};
new Function("window", "self", "globalThis", readFileSync("public/native/25_pseudonym.js", "utf8"))(fenster, fenster, fenster);
const p = fenster.SbkimPseudonym || globalThis.SbkimPseudonym;
assert.ok(p, "Modul 25 hat sich nicht angemeldet.");
for (const test of runMaskeSelfTests(p)) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}
// Kein Netzweg: die Maske und der Knopf rufen nichts im Netz auf.
for (const datei of ["lib/maske.ts", "app/pseudo-knopf.tsx"]) {
  const q = readFileSync(datei, "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|import\(\s*["']https?:/.test(q), `${datei} enthält einen Netzaufruf.`);
}
console.log("🟢 Kein Netzweg in Maske und Pseudo-Knopf");
console.log("Maske: alles grün");
