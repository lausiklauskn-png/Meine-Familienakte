// 2.28.65: Sicherung an einem zweiten Ort – Aufbewahrung, eigene Kennung, Fälligkeit. Reine Regeln; der Ablauf mit echten
// Ordnern läuft in der UI-Probe `zweiter-ort` (Browser-Dateispeicher), der native Löschbefehl in SicherungEntfernenTest (JUnit).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const z = await import("../lib/zweiter-ort.ts");
let n = 0; const gruen = (t) => { n++; console.log(`🟢 ${t}`); };
const K = "11111111-2222-3333-4444-555555555555";
const m = (erstellt, kennung = K, ziel = "zweit") => z.markeBauen({ kennung, ziel, erstellt, appVersion: "2.28.65", verschluesselt: true });
const name = (t) => `Familienakte_Vollsicherung_${t.replace(/[:.]/g, "-")}_verschluesselt`;
const a = "2026-11-10T08:00:00.000Z", b = "2026-11-11T08:00:00.000Z", c = "2026-11-12T08:00:00.000Z";
const da = [{ name: name(a), marke: m(a) }, { name: name(b), marke: m(b) }, { name: name(c), marke: m(c) }];

assert.deepEqual(z.aufraeumen(da, K, name(c), 1).sort(), [name(a), name(b)].sort());
gruen("Zweiter Ort: genau eine bleibt – die neue; beide älteren eigenen werden entfernt");
assert.deepEqual(z.aufraeumen(da, K, name(c), 2), [name(a)]);
gruen("Gerät: zwei bleiben (neue und davor), die dritte wird entfernt");
assert.deepEqual(z.aufraeumen(da.slice(0, 2), K, name(c), 1).sort(), [name(a), name(b)].sort());
assert.deepEqual(z.aufraeumen([], K, name(c), 2), []);
gruen("Die neue Sicherung wird nie entfernt, auch wenn sie in der Liste fehlt");

const fremd = [
  { name: "Fotos", marke: null },
  { name: name(a), marke: null },                       // eigene Form, aber keine Kennungsdatei (z. B. Vollsicherung von Hand)
  { name: name(b), marke: m(b, "99999999-0000-0000-0000-000000000000") }, // anderes Gerät / andere Einrichtung
  { name: "Familienakte_Vollsicherung_x", marke: m(a) }, // Kennung passt, Name nicht
];
assert.deepEqual(z.aufraeumen([...fremd, { name: name(c), marke: m(c) }], K, name(c), 1), []);
gruen("Gegenprobe: fremde Ordner, Sicherungen ohne Kennungsdatei oder mit fremder Kennung bleiben immer");

assert.equal(z.markeLesen(JSON.stringify(m(a))).kennung, K);
assert.equal(z.markeLesen("{}"), null); assert.equal(z.markeLesen("kein json"), null);
assert.equal(z.markeLesen(JSON.stringify({ ...m(a), format: "anderes" })), null);
assert.throws(() => z.markeBauen({ kennung: "../x", ziel: "zweit", erstellt: a, appVersion: "x", verschluesselt: false }));
gruen("Kennungsdatei: nur eigenes Format gilt; ungültige Kennung wird abgelehnt");

const fp = "s1", jetzt = Date.parse("2026-11-12T12:00:00Z");
const l = (zeit, f = fp, ok = true) => ({ zeit, ordner: "x", ok, fingerabdruck: f });
assert.equal(z.jetztFaellig({ letzte: null, letzteGelungen: null, fingerabdruck: fp, hatDaten: true, jetzt }), true);
assert.equal(z.jetztFaellig({ letzte: null, letzteGelungen: null, fingerabdruck: fp, hatDaten: false, jetzt }), false);
assert.equal(z.jetztFaellig({ letzte: l("2026-11-10T00:00:00Z"), letzteGelungen: l("2026-11-10T00:00:00Z"), fingerabdruck: fp, hatDaten: true, jetzt }), false, "nichts geändert");
assert.equal(z.jetztFaellig({ letzte: l("2026-11-10T00:00:00Z", "alt"), letzteGelungen: l("2026-11-10T00:00:00Z", "alt"), fingerabdruck: fp, hatDaten: true, jetzt }), true, "geändert, über einen Tag her");
assert.equal(z.jetztFaellig({ letzte: l("2026-11-12T08:00:00Z", "alt"), letzteGelungen: l("2026-11-12T08:00:00Z", "alt"), fingerabdruck: fp, hatDaten: true, jetzt }), false, "geändert, aber heute schon gesichert");
assert.equal(z.jetztFaellig({ letzte: l("2026-11-12T08:00:00Z", fp, false), letzteGelungen: null, fingerabdruck: fp, hatDaten: true, jetzt }), false, "Fehlschlag heute: erst morgen wieder von selbst");
gruen("Von selbst nur bei Änderung, höchstens einmal am Tag; nach einem Fehler nicht in Schleife");

const java = readFileSync(new URL("../android/app/src/main/java/de/familyprojekt/familienakte/FamilienakteOrdnerPlugin.java", import.meta.url), "utf8");
const win = readFileSync(new URL("../windows/java/de/familyprojekt/familienakte/FamilyFolders.java", import.meta.url), "utf8");
const muster = z.SICHERUNG_NAME.source.replace(/^\^|\$$/g, "");
for (const [wo, text] of [["Android", java], ["Windows", win]]) {
  assert.ok(text.includes(`Pattern.compile("${muster.replace(/\\/g, "\\\\")}")`), `${wo}: Namensmuster weicht ab`);
  assert.ok(text.includes('"familienakte-zweiter-ort\\""') && text.includes(`"${z.MARKE_DATEI}"`), `${wo}: prüft die Kennungsdatei nicht`);
}
assert.ok(/sicherungEntfernen/.test(readFileSync(new URL("../windows/src-tauri/src/pro_tresor.rs", import.meta.url), "utf8")));
gruen("Nativer Löschbefehl: gleiches Namensmuster und Kennungsprüfung in Android und Windows, in der Rust-Freigabe eingetragen");

assert.match(z.zustandSatz({ eingerichtet: false, letzte: null, letzteGelungen: null, jetzt }), /Noch kein zweiter Ort/);
assert.match(z.zustandSatz({ eingerichtet: true, name: "OneDrive", letzte: l("2026-11-12T08:00:00Z", fp, false), letzteGelungen: null, jetzt }), /nicht gelungen/);
assert.match(z.zustandSatz({ eingerichtet: true, name: "OneDrive", letzte: l("2026-11-12T08:00:00Z"), letzteGelungen: l("2026-11-12T08:00:00Z"), jetzt }), /heute/);
gruen("Zustand in einer Zeile");
console.log(`\n${n} Gruppen grün.`);
