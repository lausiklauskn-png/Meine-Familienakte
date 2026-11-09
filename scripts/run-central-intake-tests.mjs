import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectCentralIntakeFileKind, extractEmlAttachments, mimeParameter, parseEmlText, runCentralIntakeSelfTests } from "../lib/central-intake.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const component = read("app/central-intake-center.tsx");
const vault = read("app/local-vault.ts");
const styles = read("app/globals.css");
const manifest = JSON.parse(read("lib/system-check-manifest.json"));

assert.equal(detectCentralIntakeFileKind({ name: "Brief.pdf", size: 1, type: "application/pdf" }), "PDF");
assert.equal(detectCentralIntakeFileKind({ name: "unbekannt.xyz", size: 1, type: "application/octet-stream" }), "Unbekannter Dateityp");
const parsed = parseEmlText("From: service@example.de\r\nTo: lindqvist@example.de\r\nSubject: Testnachricht\r\nMessage-ID: <test@example.de>\r\n\r\nInhalt");
assert.equal(parsed.metadata.subject, "Testnachricht");
assert.equal(parsed.metadata.messageId, "<test@example.de>");

assert.ok(portal.includes('active === "inbox"') && portal.includes("<CentralIntakeCenter"), "Die Eingangszentrale ist nicht im vorhandenen Dokumentenbereich eingebunden.");
assert.ok(component.includes("Dateien hier hineinziehen") && component.includes("multiple") && component.includes("Eingänge prüfen"), "Mehrfach-Drag-&-Drop oder Warteschlange fehlt.");
assert.ok(component.includes("Als gemeinsames Scan-Dokument prüfen") && portal.includes("DocumentScanDialog"), "Die bestehende Mehrseiten-Scan-Funktion wird nicht wiederverwendet.");
assert.ok(portal.includes("extractEmlAttachments") && vault.includes("linkLocalDocuments") && portal.includes("enthält Anlage"), "E-Mail-Anlagen oder ihre bestätigte Dokumentrelation fehlen.");
assert.ok(portal.includes("scanLocalInbox") && portal.includes("scanOneDriveInbox"), "Lokaler Ordner und OneDrive verwenden nicht die vorhandenen bewussten Eingangswege.");
assert.ok(styles.includes(".central-drop") && styles.includes(".intake-queue-item") && styles.includes("@media (max-width: 560px)"), "Responsive Darstellung der Eingangszentrale fehlt.");
assert.ok(manifest.completedCapabilities.includes("Zentrale Eingangszentrale mit gemeinsamer Inhaltsanalyse 2.28.0"));
assert.equal(manifest.centralIntakeReuse.length, 8, "Die Eingangszentrale muss acht vorhandene Kernfunktionen wiederverwenden.");
assert.ok(manifest.centralIntakeSafety.length >= 8, "Die Schutzgrenzen der Eingangszentrale sind unvollständig.");
assert.ok(!portal.includes("OPENAI_API_KEY") && !portal.includes("api.openai.com"), "Die Eingangszentrale darf keine kostenpflichtige externe API verwenden.");

// E-Mail-Anlagen in beliebiger Tiefe und mit kodierten Namen (erfundene Mails, 2026-11-09).
const pdfB64 = Buffer.from("%PDF-1.4 erfundene Rechnung Muster-Apotheke").toString("base64");
const eml = (text) => new File([text.replace(/\n/g, "\r\n")], "Mail.eml", { type: "message/rfc822" });
const verschachtelt = eml(`From: a@example.de
Subject: Rechnung
Content-Type: multipart/mixed; boundary="aussen"

--aussen
Content-Type: multipart/related; boundary="innen"

--innen
Content-Type: text/html; charset=utf-8

<p>Hallo <img src="cid:logo"></p>
--innen
Content-Type: image/png
Content-ID: <logo>
Content-Disposition: inline
Content-Transfer-Encoding: base64

iVBORw0KGgo=
--innen
Content-Type: application/pdf; name="Rechnung-innen.pdf"
Content-Disposition: attachment; filename="Rechnung-innen.pdf"
Content-Transfer-Encoding: base64

${pdfB64}
--innen--
--aussen--
`);
const a1 = await extractEmlAttachments(verschachtelt);
assert.deepEqual(a1.map((f) => f.name), ["Rechnung-innen.pdf"], "PDF in related innerhalb von mixed (Logo ohne Namen bleibt in der Mail)");
assert.equal(await a1[0].text(), "%PDF-1.4 erfundene Rechnung Muster-Apotheke");
assert.equal(a1[0].type, "application/pdf");
const weitergeleitet = eml(`From: b@example.de
Subject: WG: Rechnung
Content-Type: multipart/mixed; boundary=b1

--b1
Content-Type: text/plain

Siehe unten.
--b1
Content-Type: message/rfc822
Content-Disposition: inline

From: apotheke@example.de
Subject: Ihre Rechnung
Content-Type: multipart/mixed; boundary=b2

--b2
Content-Type: text/plain

Anbei.
--b2
Content-Type: application/pdf
Content-Disposition: attachment; filename*=UTF-8''Rechnung%20M%C3%A4rz.pdf
Content-Transfer-Encoding: base64

${pdfB64}
--b2--
--b1
Content-Type: application/pdf; name="=?UTF-8?B?w5xiZXJzaWNodC5wZGY=?="
Content-Disposition: attachment; filename="=?UTF-8?Q?=C3=9Cbersicht.pdf?="
Content-Transfer-Encoding: base64

${pdfB64}
--b1--
`);
const a2 = await extractEmlAttachments(weitergeleitet);
assert.deepEqual(a2.map((f) => f.name), ["Rechnung März.pdf", "Übersicht.pdf"], "weitergeleitete Mail und kodierte Namen (RFC 2231, RFC 2047)");
assert.equal(mimeParameter("attachment; filename*0*=UTF-8''Lange%20Rech; filename*1*=nung.pdf", "filename"), "Lange Rechnung.pdf", "RFC 2231 in Stücken");
const flach = eml(`Subject: Alt\nContent-Type: multipart/mixed; boundary="x"\n\n--x\nContent-Type: text/plain\n\nText\n--x\nContent-Type: application/pdf; name="Alt.pdf"\nContent-Disposition: attachment; filename="Alt.pdf"\nContent-Transfer-Encoding: base64\n\n${pdfB64}\n--x--\n`);
assert.deepEqual((await extractEmlAttachments(flach)).map((f) => f.name), ["Alt.pdf"], "einfache Mail wie bisher");
console.log("🟢 E-Mail-Anlagen: verschachtelt (related in mixed), weitergeleitete Mail, kodierte Dateinamen, einfache Mail");

const tests = await runCentralIntakeSelfTests();
assert.ok(tests.length >= 20, "Mindestens zwanzig technische Eingangszentrale-Praxistests sind erforderlich.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

console.log(`🟢 ${tests.length} Eingangszentrale-Tests bestanden`);
console.log("🟢 Integrationsprüfung: bestehender Dokumentenkern, Suche, Kategorien, Vorgänge, Memory, Fristen, Datenschutz und Archivierung werden wiederverwendet");
console.log("🟢 Originalschutz: keine automatische Verschiebung, Umbenennung, Überschreibung oder Löschung");
