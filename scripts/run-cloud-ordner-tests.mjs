// 2.28.65: Cloud-Ordner hereinholen – reine Regeln (neu, geändert = neue Fassung, Pakete, Übergehen, Herkunft, Geräte).
import assert from "node:assert/strict";
const c = await import("../lib/cloud-ordner.ts");
let n = 0; const gruen = (t) => { n++; console.log(`🟢 ${t}`); };
const g = (pfad, size = 10, lastModified = 1) => ({ pfad, name: pfad.split("/").pop(), size, lastModified });

const bekannt = { "Auto/Police.pdf": { size: 10, lastModified: 1 }, "Arzt/Befund.pdf": { size: 5, lastModified: 1 } };
const e = c.einordnen([g("Auto/Police.pdf"), g("Arzt/Befund.pdf", 6), g("Neu/Brief.pdf"), g("Familienakte-Paket_Handy_2026-11-11-10-00.fav"), g("Alt/schon.pdf", 7)], bekannt, new Set(["schon.pdf|7"]));
assert.deepEqual(e.neu.map((x) => x.pfad), ["Neu/Brief.pdf"]);
assert.deepEqual(e.geaendert.map((x) => x.pfad), ["Arzt/Befund.pdf"]);
assert.deepEqual(e.pakete.map((x) => x.pfad), ["Familienakte-Paket_Handy_2026-11-11-10-00.fav"]);
assert.equal(e.schonInAkte, 1);
gruen("Unverändert Bekanntes bleibt draußen; geändert = neue Fassung; Pakete getrennt; schon in der Akte wird wiedererkannt");

for (const [name, ordner] of [[".versteckt", false], ["~$Brief.docx", false], ["desktop.ini", false], ["x.tmp", false], ["Familienakte_Vollsicherung_2026", true], ["Familienakte-Abgleich", true]]) assert.ok(c.uebergehen(name, ordner), name);
for (const [name, ordner] of [["Brief.pdf", false], ["Auto", true], ["Familienakte_Vollsicherung_2026.pdf", false]]) assert.ok(!c.uebergehen(name, ordner), name);
gruen("Übergangen: versteckte, Sperr- und Teildateien, eigene Sicherungs- und Abgleichordner (Gegenprobe: normale Dateien und Ordner bleiben)");

assert.equal(c.herkunft("OneDrive", "Auto/Versicherung/Police.pdf"), "OneDrive › Auto › Versicherung");
assert.equal(c.herkunft("OneDrive", "Police.pdf"), "OneDrive");
assert.match(c.hinweisFuer("OneDrive", g("Auto/Police.pdf"), true), /neue Fassung.*bisherige bleibt/);
gruen("Herkunft als Pfad „OneDrive › Auto › Versicherung“, Hinweis „neue Fassung“");

assert.ok(c.istPaket("Familienakte-Paket_Galaxy_2026-11-11-10-00.fav")); assert.ok(!c.istPaket("Paket.fav")); assert.ok(!c.istPaket("Familienakte-Paket_x.pdf"));
gruen("Paket vom Handy am Namen erkannt");

assert.equal(c.geraetSatz({ plattform: "browser-ohne" }).geht, false);
assert.match(c.geraetSatz({ plattform: "android" }).satz, /OneDrive-App keinen Ordner/);
assert.equal(c.geraetSatz({ plattform: "windows" }).geht, true);
gruen("Je Gerät ein Satz, was geht");

const viele = Array.from({ length: c.MAX_DATEIEN + 3 }, (_, i) => g(`d${i}.pdf`));
const m = c.bekanntMerken({}, viele);
assert.equal(Object.keys(m).length, c.MAX_DATEIEN); assert.ok(m[`d${c.MAX_DATEIEN + 2}.pdf`]); assert.ok(!m["d0.pdf"]);
gruen("Gemerkte Pfade begrenzt, die ältesten fallen weg");
console.log(`\n${n} Gruppen grün.`);
