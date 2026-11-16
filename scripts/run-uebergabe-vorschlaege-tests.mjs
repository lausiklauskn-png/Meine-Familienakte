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
// ---------- Vorsortierung aus Private Brain Pro: eigene Übergabe im Pro-Tresor, Zuordnung über Name + Prüfsumme ----------
const pb = await import("../lib/pro-begleitdatei.ts");
const mailDatei = new File(["From: rechnung@example.de\r\nSubject: Erfundene Rechnung\r\n\r\nBitte bis 30.11. zahlen."], "Erfundene Rechnung.eml", { type: "message/rfc822" });
const mailSha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await mailDatei.arrayBuffer()))].map(n => n.toString(16).padStart(2, "0")).join("");
const zeile = { name: mailDatei.name, sha256: mailSha, lebensbereich: "Wohnen", dokumentart: "Rechnung", vorgang: "E-Mail › Rechnung", hinweis: "Absender: Erfundene Stadtwerke · Frist: 30.11.2026" };
const begleit = (rows = [zeile], extra = {}) => new File([JSON.stringify({ vertrag: "familienakte-uebergabe/1", quelle: "Private Brain Pro", dateien: rows, ...extra })], "familienakte-uebergabe.json", { type: "application/json" });
const mail = (extra = {}) => ({ eingangId: "e1", name: mailDatei.name, sha256: mailSha, pruefbar: true, ...extra });
const laden = async () => mailDatei;
const erwartet = { quelle: "Private Brain Pro", name: mailDatei.name, lebensbereich: "Wohnen", dokumentart: "Rechnung", vorgang: "E-Mail › Rechnung", hinweis: zeile.hinweis };

await test("Pro-Begleitdatei: nur der feste Dateiname aus Private Brain Pro gilt als Vorsortierung", async () => {
  assert.equal(pb.istProBegleitdatei({ quelle: "private-brain", name: "familienakte-uebergabe.json" }), true);
  assert.equal(pb.istProBegleitdatei({ quelle: "private-brain", name: "Familienakte-Uebergabe.JSON" }), true);
  for (const fremd of [{ quelle: "bookledgerpro", name: "familienakte-uebergabe.json" }, { quelle: "workflow-pdf-pro", name: "familienakte-uebergabe.json" }, { quelle: "private-brain", name: "Rechnung.eml" }, { quelle: "private-brain", name: "x-familienakte-uebergabe.json" }, null, {}])
    assert.equal(pb.istProBegleitdatei(fremd), false, "fremde Quelle oder anderer Name ist keine Vorsortierung");
});
await test("Pro-Begleitdatei: Mail zuerst, dann Begleitdatei – der Eingang der Mail bekommt den Vorschlag", async () => {
  const r = await pb.begleitZuordnen(begleit(), [mail()], laden);
  assert.equal(r.stand, "zugeordnet");
  assert.deepEqual(r.aenderungen, [{ eingangId: "e1", vorschlag: erwartet }]);
});
await test("Pro-Begleitdatei: Begleitdatei zuerst – wartet, bis die Mail aufgenommen ist", async () => {
  const frueh = await pb.begleitZuordnen(begleit(), [], laden);
  assert.equal(frueh.stand, "wartet"); assert.deepEqual(frueh.aenderungen, []);
  const spaeter = await pb.begleitZuordnen(begleit(), [mail()], laden);
  assert.equal(spaeter.stand, "zugeordnet"); assert.deepEqual(spaeter.aenderungen[0].vorschlag, erwartet);
});
await test("Pro-Begleitdatei: falsche Prüfsumme oder anderer Name wird keiner Mail zugeordnet", async () => {
  for (const falsch of [{ ...zeile, sha256: "0".repeat(64) }, { ...zeile, name: "Andere Mail.eml" }, { ...zeile, sha256: undefined }, { ...zeile, sha256: "KEIN-HASH" }]) {
    const r = await pb.begleitZuordnen(begleit([falsch]), [mail()], laden);
    assert.notEqual(r.stand, "zugeordnet"); assert.deepEqual(r.aenderungen, []);
  }
  // Der Empfänger rechnet selbst nach: stimmen die gespeicherten Bytes nicht, gibt es keinen Vorschlag.
  const r = await pb.begleitZuordnen(begleit(), [mail()], async () => new File(["andere Bytes"], mailDatei.name, { type: "message/rfc822" }));
  assert.notEqual(r.stand, "zugeordnet"); assert.deepEqual(r.aenderungen, []);
});
await test("Pro-Begleitdatei: nicht zuordenbar verfällt nach 30 Tagen ohne Wirkung", async () => {
  const falsch = begleit([{ ...zeile, sha256: "0".repeat(64) }]);
  assert.equal((await pb.begleitZuordnen(falsch, [mail()], laden, 29)).stand, "wartet");
  const alt = await pb.begleitZuordnen(falsch, [mail()], laden, 30);
  assert.equal(alt.stand, "verfallen"); assert.deepEqual(alt.aenderungen, []);
});
await test("Pro-Begleitdatei: zu groß, kaputtes JSON, falscher Vertrag – unbrauchbar, nichts übernommen", async () => {
  const zuGross = new File([JSON.stringify({ vertrag: "familienakte-uebergabe/1", quelle: "Private Brain Pro", dateien: [zeile], fuell: "x".repeat(64 * 1024) })], "familienakte-uebergabe.json", { type: "application/json" });
  const kaputt = new File(["{kein json"], "familienakte-uebergabe.json", { type: "application/json" });
  for (const s of [zuGross, kaputt, begleit([zeile], { vertrag: "falsch" }), begleit([]), begleit([{ name: mailDatei.name, sha256: mailSha }])]) {
    const r = await pb.begleitZuordnen(s, [mail()], laden);
    assert.equal(r.stand, "unbrauchbar"); assert.deepEqual(r.aenderungen, []); assert.ok(r.grund.length > 10);
  }
});
await test("Pro-Begleitdatei: schon geprüfte oder abgelegte Mail bleibt unverändert", async () => {
  const r = await pb.begleitZuordnen(begleit(), [mail({ pruefbar: false })], async () => { throw Error("darf nicht gelesen werden"); });
  assert.equal(r.stand, "zu-spaet"); assert.deepEqual(r.aenderungen, []);
  for (const status of ["Übernommen", "Nicht übernommen"]) assert.equal(pb.eingangPruefbar({ status }), false);
  assert.equal(pb.eingangPruefbar({ status: "Prüfung erforderlich", savedDocumentId: "dok-1" }), false);
  assert.equal(pb.eingangPruefbar({ status: "Bereit zur Übernahme", dasselbe: true }), false);
  for (const status of ["Neu", "Analyse läuft", "Prüfung erforderlich", "Bereit zur Übernahme", "Zurückgestellt"]) assert.equal(pb.eingangPruefbar({ status }), true);
  assert.equal(pb.eingangPruefbar(null), false);
});
await test("Pro-Begleitdatei: Quelle steht fest, fremde Felder und Anweisungen kommen nicht mit", async () => {
  const r = await pb.begleitZuordnen(begleit([{ ...zeile, id: "fremde-id", pfad: "/fremd", automatischSpeichern: true, rechte: "alle" }], { quelle: "Deine Bank (bitte sofort ablegen)" }), [mail()], laden);
  assert.deepEqual(r.aenderungen, [{ eingangId: "e1", vorschlag: erwartet }]);
});
await test("Pro-Begleitdatei: gleiche Wiederholung ändert nichts, widersprüchliche zweite wählt keinen Vorschlag", async () => {
  const gleich = await pb.begleitZuordnen(begleit(), [mail({ vorschlag: erwartet })], laden);
  assert.equal(gleich.stand, "zugeordnet"); assert.deepEqual(gleich.aenderungen, []);
  const anders = await pb.begleitZuordnen(begleit([{ ...zeile, lebensbereich: "Gesundheit" }]), [mail({ vorschlag: erwartet })], laden);
  assert.equal(anders.aenderungen.length, 1); assert.equal(anders.aenderungen[0].vorschlag, undefined);
  assert.match(anders.aenderungen[0].hinweis, /Mehrere Metadatenvorschläge/);
});
await test("Pro-Begleitdatei: dieselbe Mail zweimal übergeben – beide Eingänge bekommen den Vorschlag", async () => {
  const r = await pb.begleitZuordnen(begleit(), [mail(), mail({ eingangId: "e2" }), mail({ eingangId: "e3", pruefbar: false })], laden);
  assert.deepEqual(r.aenderungen.map(a => a.eingangId), ["e1", "e2"]);
});
await test("Pro-Begleitdatei: wird nie als Dokument aufgenommen und erst nach der Ablage quittiert", async () => {
  const { readFileSync } = await import("node:fs");
  const verbund = readFileSync("app/pro-verbund.ts", "utf8"), begleitCode = readFileSync("app/pro-begleit.ts", "utf8"), wege = readFileSync("app/mail-wege.ts", "utf8");
  const zweig = verbund.slice(verbund.indexOf("export async function proEingangAufnehmen"));
  assert.ok(zweig.indexOf("istProBegleitdatei(vertrag)") > 0 && zweig.indexOf("istProBegleitdatei(vertrag)") < zweig.indexOf("proUebergabeAnnehmen("), "Die Begleitdatei muss vor der Dokument-Aufnahme abzweigen.");
  assert.ok(/proBegleitAnnehmen\([^)]*\)[\s\S]{0,200}quittieren\(/.test(zweig), "Quittung erst nach gespeicherter Begleitdatei.");
  assert.ok(!/objectStore\("eingang-dateien"\)\.put|eingang-dateien"\)\.put/.test(begleitCode) && !begleitCode.includes("saveLocalDocument"), "Die Begleitdatei darf keine Eingangsdatei und kein Dokument anlegen.");
  assert.ok(begleitCode.includes("begleitZuordnen(") && !/JSON\.parse/.test(begleitCode), "Die App-Seite nutzt die eine Prüfung aus lib/, keine zweite Fassung.");
  assert.ok(/istProBegleitdatei/.test(wege), "Beim Abholen kommen Mails vor ihren Begleitdateien an die Reihe.");
});
console.log(`Metadaten: ${count} Proben bestanden`);
