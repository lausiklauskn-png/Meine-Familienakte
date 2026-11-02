import assert from "node:assert/strict";
import { uebergabeVorschlaege } from "../lib/uebergabe-vorschlaege.ts";

const original = new File(["Erfundene Originalbytes"], "Beleg.txt", { type: "text/plain" });
const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await original.arrayBuffer()))].map(n => n.toString(16).padStart(2, "0")).join("");
const row = { name: original.name, lebensbereich: "Wohnen", dokumentart: "Rechnung", vorgang: "Probe", hinweis: '<img src=x onerror="alert(1)">', sha256: hash, id: "fremde-id", pfad: "/fremd", automatischSpeichern: true };
const sidecar = (rows = [row], extra = {}) => new File([JSON.stringify({ vertrag: "familienakte-uebergabe/1", quelle: "Andere App", dateien: rows, ...extra })], "familienakte-uebergabe.json", { type: "application/json" });
let count = 0;
async function test(name, fn) { await fn(); count++; console.log(`🟢 ${name}`); }
await test("Metadaten: eindeutige Originaldatei und gültige Prüfsumme", async () => {
  const companion = sidecar(), r = await uebergabeVorschlaege([original, companion]);
  assert.deepEqual(r.vorschlaege.get(original), { quelle: "Andere App", name: original.name, lebensbereich: "Wohnen", dokumentart: "Rechnung", vorgang: "Probe", hinweis: row.hinweis });
  assert.match(r.hinweise.get(companion), /Original-Begleitdatei bleibt/);
  assert.equal(await original.text(), "Erfundene Originalbytes");
  assert.equal(JSON.parse(await companion.text()).dateien[0].pfad, "/fremd");
});
await test("Metadaten: veränderte Bytes ohne Zuordnung", async () => {
  const changed = new File(["Andere Bytes"], original.name);
  assert.equal((await uebergabeVorschlaege([changed, sidecar()])).vorschlaege.size, 0, "veränderte Bytes dürfen keine Vorschläge erhalten");
});
await test("Metadaten: doppelte Dateinamen bleiben mehrdeutig", async () => {
  assert.equal((await uebergabeVorschlaege([original, new File(["Zweit"], original.name), sidecar()])).vorschlaege.size, 0, "doppelte Dateinamen bleiben mehrdeutig");
});
await test("Metadaten: widersprechende Begleitdateien werden nicht ausgewählt", async () => {
  const r = await uebergabeVorschlaege([original, sidecar(), sidecar([{ ...row, lebensbereich: "Anders" }])]);
  assert.equal(r.vorschlaege.size, 0); assert.match(r.hinweise.get(original), /Mehrere/);
});
await test("Metadaten: fremder Vertrag, Pfad und unbekannte Datei bleiben wirkungslos", async () => {
  for (const s of [sidecar([row], { vertrag: "falsch" }), sidecar([{ ...row, name: "../Beleg.txt" }]), sidecar([{ ...row, name: "nicht-ausgewählt.txt" }])]) assert.equal((await uebergabeVorschlaege([original, s])).vorschlaege.size, 0);
});
await test("Metadaten: alte Begleitdatei ohne Hash bleibt kompatibel", async () => {
  const { sha256, ...legacy } = row; assert.equal(sha256, hash);
  assert.equal((await uebergabeVorschlaege([original, sidecar([legacy])])).vorschlaege.size, 1);
});
await test("Metadaten: Grenzen und beschädigte JSON erhalten Originaldatei", async () => {
  for (const s of [new File(["{"], "familienakte-uebergabe.json"), new File([" ".repeat(65537)], "familienakte-uebergabe.json"), sidecar(Array(31).fill(row))]) {
    const r = await uebergabeVorschlaege([original, s]); assert.equal(r.vorschlaege.size, 0); assert.match(r.hinweise.get(s), /Keine Metadaten übernommen/);
  }
  assert.equal((await uebergabeVorschlaege([original, sidecar([{ name: original.name, hinweis: "x".repeat(1001), lebensbereich: "a\nb" }])])).vorschlaege.size, 0);
});
await test("Metadaten: spätes Leseversagen lässt keine Teilvorschläge zurück", async () => {
  const broken = new File(["x"], "Fehler.txt"); broken.arrayBuffer = async () => { throw Error("Lesefehler"); };
  const r = await uebergabeVorschlaege([original, broken, sidecar([row, { ...row, name: broken.name }])]);
  assert.equal(r.vorschlaege.size, 0, "keine halben Vorschläge nach Lesefehler");
});
await test("Metadaten: große Dateien werden vor dem Hashen abgelehnt", async () => {
  const large = new File([new Uint8Array(20 * 1024 * 1024 + 1)], original.name);
  large.arrayBuffer = async () => { throw Error("darf nicht gelesen werden"); };
  const s = sidecar(), r = await uebergabeVorschlaege([large, s]);
  assert.equal(r.vorschlaege.size, 0); assert.doesNotMatch(r.hinweise.get(s), /darf nicht gelesen/);
});
console.log(`Metadaten: ${count} Proben bestanden`);
