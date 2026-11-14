import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  auftragSchluessel, verschluesseln, entschluesseln, aufraeumen, ablegen, entfernen, ablageAlsText, ablageAusText, leereAblage, passendster,
  restTage, AUFTRAG_HOECHSTENS,
} from "../lib/pseudo-auftraege.ts";
import { neueProfile } from "../lib/maske-profil.ts";

// Zuordnung je Auftrag (P10), erfundene Daten.
const ok = (t) => console.log(`🟢 ${t}`);
const profil = await neueProfile();
const k = profil.eigenerSchluessel; const geheim = profil.schluessel[k];
const key = await auftragSchluessel(geheim);
const jetzt = Date.now();
const a = { id: "a-1", nr: 1, titel: "D01 PDF · D02 Mail", aufgabe: "Antwortbrief schreiben", erstellt: jetzt, geaendert: jetzt, map: { "⟦NAME-1⟧": "Mara Testfeld", "⟦IBAN-1⟧": "DE89 3704 0044 0532 0130 00" } };

const v = await verschluesseln(a, key, k);
const roh = ablageAlsText(ablegen(leereAblage(), v));
assert.ok(!/Testfeld|DE89|Antwortbrief|D01/.test(roh), "Klartext in der Ablage");
ok("Ablage enthält keinen Klartext (Name, IBAN, Titel)");

const zurueck = await entschluesseln(ablageAusText(roh).eintraege[0], key);
assert.deepEqual(zurueck.map, a.map); assert.equal(zurueck.titel, a.titel);
ok("Entschlüsseln liefert Zuordnung und Titel unverändert");

const fremd = await neueProfile();
await assert.rejects(entschluesseln(v, await auftragSchluessel(fremd.schluessel[fremd.eigenerSchluessel])));
ok("Fremder Schlüssel (anderes Profil) kann nicht lesen");

await assert.rejects(entschluesseln({ ...v, nr: 2 }, key));
ok("Vertauschte Nummer fällt auf (Zusatzdaten)");

const alt = await verschluesseln({ ...a, id: "a-alt", erstellt: jetzt - 91 * 864e5, geaendert: jetzt - 91 * 864e5 }, key, k);
let ab = ablegen(ablegen(leereAblage(), v), alt);
ab = aufraeumen(ab, jetzt);
assert.deepEqual(ab.eintraege.map((x) => x.id), ["a-1"]);
assert.equal(restTage({ erstellt: jetzt - 87 * 864e5 }, jetzt), 3);
ok("Nach 90 Tagen fällt ein Auftrag heraus; Resttage stimmen");

let viele = leereAblage();
for (let i = 0; i < AUFTRAG_HOECHSTENS + 5; i++) viele = ablegen(viele, { ...v, id: `x${i}`, nr: i + 1, geaendert: jetzt - i });
assert.equal(aufraeumen(viele, jetzt).eintraege.length, AUFTRAG_HOECHSTENS);
assert.equal(viele.naechsteNr, AUFTRAG_HOECHSTENS + 6);
ok("Höchstens 50 offene, Nummer zählt weiter");

assert.equal(entfernen(ab, "a-1").eintraege.length, 0);
ok("„erledigt“ entfernt den Auftrag");

const b = { ...a, id: "a-2", nr: 2, geaendert: jetzt + 1, map: { "⟦NAME-1⟧": "Ole Brink" } };
const p = passendster([a, b], "Sehr geehrte ⟦NAME-1⟧, Ihre ⟦IBAN-1⟧ …");
assert.equal(p.auftrag.id, "a-1"); assert.equal(p.bekannt, 2);
assert.equal(passendster([a, b], "Hallo ⟦NAME-1⟧").auftrag.id, "a-2");
assert.equal(passendster([a], "ohne Platzhalter"), null);
ok("Passender Auftrag: meiste bekannte Platzhalter, bei Gleichstand der neueste");

assert.deepEqual(ablageAusText("kaputt").eintraege, []);
assert.deepEqual(ablageAusText(JSON.stringify({ format: "x" })).eintraege, []);
ok("Beschädigte Ablage → leer, kein Absturz");

const quelle = readFileSync("lib/pseudo-auftraege.ts", "utf8") + readFileSync("app/pseudo-auftrag-speicher.ts", "utf8");
assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(quelle), "Netzweg im Auftragsspeicher");
ok("Kein Netzweg in Kern und Speicher");

// PDF-Seitenbild: Kästen an der Stelle des Wortes (Textlage erfunden).
const { kaestenFuerSeite } = await import("../lib/pdf-kaesten.ts");
const stuecke = [
  { str: "Sehr geehrte Frau ", x: 10, y: 20, w: 18, h: 2 },
  { str: "Mara Testfeld,", x: 28, y: 20.2, w: 14, h: 2 },
  { str: "IBAN: DE89 3704", x: 10, y: 30, w: 15, h: 2 },
  { str: "0044 0532 0130 00", x: 25.5, y: 30, w: 17, h: 2 },
  { str: "Mara Testfeld", x: 10, y: 50, w: 13, h: 2 },
];
const kaesten = kaestenFuerSeite(stuecke, [{ token: "⟦NAME-1⟧", klar: "Mara Testfeld" }, { token: "⟦IBAN-1⟧", klar: "DE89 3704 0044 0532 0130 00" }, { token: "⟦X-1⟧", klar: "fehlt" }]);
const namen = kaesten.filter((k) => k.token === "⟦NAME-1⟧");
assert.equal(namen.length, 2);
assert.ok(Math.abs(namen.find((k) => k.y < 30).x - 28) < 0.1 && namen.find((k) => k.y < 30).w > 10 && namen.find((k) => k.y < 30).w < 14);
const iban = kaesten.find((k) => k.token === "⟦IBAN-1⟧");
assert.ok(iban && iban.x > 15.5 && iban.x < 16.5 && iban.x + iban.w > 42, JSON.stringify(iban));
assert.ok(!kaesten.some((k) => k.token === "⟦X-1⟧"));
ok("PDF-Kästen: Name zweimal, IBAN über zwei Textstücke, Fehlendes ohne Kasten");

// ZIP: mit dem System-Werkzeug entpacken und vergleichen.
const { zipBauen, crc32 } = await import("../lib/zip-schreiben.ts");
assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
const { writeFileSync, mkdtempSync } = await import("node:fs");
const { execFileSync } = await import("node:child_process");
const { tmpdir } = await import("node:os"); const { join } = await import("node:path");
const ordner = mkdtempSync(join(tmpdir(), "zip-"));
writeFileSync(join(ordner, "a.zip"), zipBauen([{ name: "D01.txt", daten: new TextEncoder().encode("⟦NAME-1⟧ schreibt") }, { name: "LIES-MICH.txt", daten: new TextEncoder().encode("pseudonymisiert") }]));
try {
  // Inhalt als Hex ausgeben: die Windows-Konsole (cp1252) kann „⟦“ nicht schreiben.
  const [pruef, hex] = execFileSync("python3", ["-c", "import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip());print(z.read('D01.txt').hex())", join(ordner, "a.zip")]).toString().trim().split(/\r?\n/);
  assert.equal(pruef, "None");
  assert.equal(Buffer.from(hex, "hex").toString("utf8"), "⟦NAME-1⟧ schreibt");
  ok("ZIP: Prüfsumme stimmt, Inhalt mit Umlauten/Platzhaltern lesbar");
} catch (e) { if (e.code === "ENOENT") ok("ZIP: CRC geprüft (python3 fehlt zum Entpacken)"); else throw e; }
