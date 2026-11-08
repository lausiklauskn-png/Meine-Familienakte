// Stufe E (Plan 08.11.2026): große Mengen in Blöcken – reine Regeln.
const assert = (await import("node:assert/strict")).default;
const b = await import("../lib/eingang-bloecke.ts");
let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };

assert.equal(b.BLOCK, 20);
assert.deepEqual(b.inBloecke([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
assert.deepEqual(b.inBloecke([], 20), []);
assert.equal(b.inBloecke(Array.from({ length: 45 }, (_, i) => i)).length, 3);
gruen("Blöcke zu 20: 45 Dateien → 3 Blöcke (20, 20, 5)");

assert.deepEqual(b.speicherReicht({ usage: 100, quota: 1e9 }, 10e6), { ok: true, frei: 1e9 - 100, noetig: 20e6 + b.SPEICHER_RESERVE });
assert.equal(b.speicherReicht({ usage: 990e6, quota: 1e9 }, 10e6).ok, false, "zu wenig frei");
assert.deepEqual(b.speicherReicht(null, 10e6), { ok: true, frei: null, noetig: 20e6 + b.SPEICHER_RESERVE }, "ohne Messung läuft es weiter, frei = null");
assert.equal(b.mbText(16 * 1048576), "16 MB");
gruen("Speicherprüfung: doppelte Blockgröße plus 50 MB Reserve; ohne Messung ehrlich „nicht gemessen“");

const dateien = Array.from({ length: 30 }, (_, i) => ({ name: `Scan ${i}.pdf`, size: 1000 + i, lastModified: 1700000000000 + i }));
const gesehen = new Set(dateien.slice(0, 5).map(b.dateiSchluessel));
const warte = new Set([b.dateiSchluessel(dateien[5])]);
const neu = b.neueImOrdner(dateien, gesehen, warte);
assert.equal(neu.length, 20); assert.equal(neu[0].name, "Scan 6.pdf"); assert.equal(neu[19].name, "Scan 25.pdf");
assert.equal(b.neueImOrdner(dateien, new Set(dateien.map(b.dateiSchluessel)), new Set()).length, 0);
assert.equal(b.dateiSchluessel({ name: "A.PDF", size: 1, lastModified: 2 }), "a.pdf|1|2");
gruen("Neu im Ordner: gesehene und wartende fallen weg, höchstens ein Block, Schlüssel ohne Groß/Klein");

const liste = b.gesehenMerken(["a", "b"], ["b", "c"]);
assert.deepEqual(liste, ["a", "b", "c"]);
assert.equal(b.gesehenMerken(Array.from({ length: 5000 }, (_, i) => `k${i}`), ["neu"]).length, 5000);
assert.equal(b.blockText(2, 3, 20), "Block 2 von 3 (20 Dateien)"); assert.equal(b.blockText(1, 1, 1), "1 Datei");
gruen("Gemerkte Schlüssel ohne Doppelte, Obergrenze 5000; Blocktext");

console.log(`\nEingang in Blöcken: ${n} Proben grün.`);
