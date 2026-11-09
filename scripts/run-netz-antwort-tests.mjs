// Im eigenen Netz antworten (2026-11-09): Rechnung lib/netz-antwort.ts und Ablauf app/netz-antwort.ts mit dem ECHTEN Modul 04
// (public/sbkim/04_match.js, byte-1:1). Modul 03 (Sprachmodell) und Modul 23 (Rendezvous) sind gestellt; erfundene Unterlagen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const merk = new Map();
globalThis.localStorage = { getItem: (k) => merk.get(k) ?? null, setItem: (k, v) => merk.set(k, String(v)), removeItem: (k) => merk.delete(k) };
globalThis.window = globalThis;
vm.runInThisContext(readFileSync("public/sbkim/04_match.js", "utf8"), { filename: "04_match.js" });
const echt = globalThis.SbkimMatch;
assert.ok(echt && typeof echt.queryLocal === "function", "Modul 04 geladen");

// Gestelltes Sprachmodell: Wörter → feste Richtungen (384 Werte wie e5-small), gleiche Wörter = ähnliche Vektoren.
const DIM = 384;
function vektor(text) {
  const v = new Float32Array(DIM); v[0] = 3;   // gemeinsamer Anteil wie der hohe e5-Boden (Rohcosinus ~0,8 auch ohne gemeinsame Wörter)
  for (const w of String(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length >= 3)) {
    let h = 2166136261; for (const c of w) h = Math.imul(h ^ c.codePointAt(0), 16777619);
    v[1 + (Math.abs(h) % (DIM - 1))] += 1;
  }
  let n = Math.hypot(...v) || 1; for (let i = 0; i < DIM; i++) v[i] /= n;
  return v;
}
let liste = false;   // Gegenprobe: Modul 03 liefert eine gewöhnliche Liste
globalThis.SbkimEmbedding = { init: async () => {}, embedPassage: async (t) => (liste ? Array.from(vektor(t)) : vektor(t)), embedQuery: async (t) => vektor(t) };
const rdv = { _meta: { network: "oeffentlich", answering: false }, cfg: {}, configure(o) { Object.assign(this.cfg, o); },
  connectAndAnnounce: async () => ({ ok: true }), enableAnswering: async () => { rdv._meta.answering = true; return { ok: true }; }, disableAnswering() { rdv._meta.answering = false; } };
globalThis.SbkimRendezvous = rdv;

const lib = await import("../lib/netz-antwort.ts");
const appNetz = await import("../app/netz-antwort.ts");
const docs = [
  { id: "a1", originalName: "scan1.pdf", titel: "Rechnung Muster-Apotheke", category: "Gesundheit & Pflege", documentDate: "2026-10-20", textAuszug: "Muster-Apotheke Rechnung Erfundin 5 mg Diagnose geheim" },
  { id: "b2", originalName: "strom.pdf", titel: "Rechnung Stromanbieter Beispiel", category: "Energie & Versorgung", documentDate: "2026-09-01", textAuszug: "Abschlag Strom September Kundennummer 4711 Zählerstand" },
  { id: "c3", originalName: "alt.pdf", titel: "Rechnung Alt", category: "Archiv", documentDate: null, textAuszug: "Alt", aussortiert: { am: "x", vorherPfad: "y", verschoben: true } },
];
let gruen = 0;
const ok = (name) => { console.log(`🟢 ${name}`); gruen++; };

// Rechnung
let k = lib.netzKorpusEintraege(docs, { ausschnitt: false, gesundheit: false });
assert.deepEqual(k.map((e) => e.anchorId), ["fa:b2"], "Gesundheit und Aussortiertes bleiben draußen");
assert.equal(k[0].text, "Rechnung Stromanbieter Beispiel · Energie & Versorgung · 01.09.2026", "ohne Ausschnitt nur Titel · Bereich · Datum, kein Text");
ok("Korpus ohne Schalter: nur Titel · Bereich · Datum, ohne Gesundheit, ohne Aussortiertes");
k = lib.netzKorpusEintraege(docs, { ausschnitt: true, gesundheit: true });
assert.deepEqual(k.map((e) => e.anchorId), ["fa:a1", "fa:b2"]);
assert.match(k[1].text, /Kundennummer 4711/);
ok("Korpus mit Ausschnitt und Gesundheit: Apotheke dabei, Text im Vergleich");
const lab = lib.ausschnittLabel("Rechnung Stromanbieter Beispiel · Energie & Versorgung · 01.09.2026", docs[1].textAuszug, "Kundennummer Strom");
assert.ok(lab.length <= 200 && /— .*Kundennummer 4711/.test(lab), lab);
ok("Antwortzeile mit Ausschnitt um die Suchwörter, höchstens 200 Zeichen");

// Ablauf mit echtem Modul 04
let r = await appNetz.antwortenAn(docs, { ausschnitt: false, gesundheit: false });
assert.equal(r.ok, false); assert.match(r.reason, /nur im eigenen Netz/);
ok("Öffentliches Netz: Einschalten verweigert");
rdv._meta.network = "eigen";
r = await appNetz.antwortenAn(docs, { ausschnitt: false, gesundheit: true });
assert.equal(r.ok, true, r.reason); assert.equal(r.anzahl, 2);
let hits = await rdv.cfg.match.queryLocal("Apotheke Rechnung", 5);
assert.ok(hits.length >= 1 && hits[0].anchorId === "fa:a1", JSON.stringify(hits));
assert.equal(hits[0].label, "Rechnung Muster-Apotheke · Gesundheit & Pflege · 20.10.2026", "ohne Ausschnitt nur die Titelzeile");
assert.ok(!hits.some((h) => /Diagnose|Erfundin/.test(h.label)), "kein Text hinaus");
ok("Eigenes Netz: „Apotheke Rechnung“ findet die Apotheken-Rechnung (Titelzeile, kein Text)");
rdv._meta.network = "oeffentlich";
hits = await rdv.cfg.match.queryLocal("Apotheke Rechnung", 5);
assert.deepEqual(hits, [], "Netz gewechselt → keine Antwort");
ok("Netz während des Antwortens auf öffentlich gewechselt: Antwort leer (je Frage geprüft)");
rdv._meta.network = "eigen";
r = await appNetz.antwortenAn(docs, { ausschnitt: true, gesundheit: false });
hits = await rdv.cfg.match.queryLocal("Rechnung Stromanbieter Abschlag Strom Kundennummer", 5);
assert.ok(hits.every((h) => h.anchorId !== "fa:a1"), "Gesundheit aus → Apotheke nicht im Korpus");
assert.ok(/Kundennummer 4711/.test(hits[0]?.label || ""), JSON.stringify(hits));
ok("Mit Ausschnitt: Zeile trägt den Ausschnitt; Gesundheit aus → Apotheke fehlt");
liste = true;
r = await appNetz.antwortenAn(docs, { ausschnitt: false, gesundheit: false });
assert.equal(r.ok, true);
assert.doesNotThrow(() => echt.queryLocal("Strom", 3));
hits = await rdv.cfg.match.queryLocal("Rechnung Stromanbieter", 3);
assert.ok(hits.length >= 1, "auch bei Liste aus Modul 03: Float32Array für Modul 04");
liste = false;
ok("Vektoren werden Float32Array (Modul 04 validateCorpus), auch wenn Modul 03 eine Liste liefert");
appNetz.antwortenAus();
assert.equal(rdv._meta.answering, false); assert.equal(rdv.cfg.match, null);
ok("Aus: Antworten aus, Filter und Korpus weg");
console.log(`Netz-Antwort: ${gruen} grün · 0 rot`);
