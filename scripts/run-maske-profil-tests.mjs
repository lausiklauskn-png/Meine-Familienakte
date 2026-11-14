import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { maskieren, zurueckfuehren, profilAusAkte, MARKE } from "../lib/maske.ts";
import {
  neueProfile, nummerAbdruck, profilNummernImText, maskeAusProfilen, eintragAnlegen, eintragAendern, schreibweiseDazu, korrigieren,
  zusammenfuehren, profilAlsText, profilAusText, vorschlaegeAusAkte, ausAkteUebernehmen, nummerKandidaten, platzhalter,
} from "../lib/maske-profil.ts";

// Profile für die Maske (Stufe C): alles mit erfundenen Daten, auf dem echten Modul 25 (byte-1:1).
const fenster = {};
new Function("window", "self", "globalThis", readFileSync("public/native/25_pseudonym.js", "utf8"))(fenster, fenster, fenster);
const p = fenster.SbkimPseudonym || globalThis.SbkimPseudonym;
assert.ok(p, "Modul 25 hat sich nicht angemeldet.");
const ok = (t) => console.log(`🟢 ${t}`);

const akte = [
  { id: "PER-1", type: "person", data: { displayName: "Mara Testfeld", street: "Lindenweg 12", postalCode: "12345", city: "Musterstadt" } },
  { id: "PER-2", type: "person", data: { displayName: "Ole Brink" } },
  { id: "ORG-1", type: "organisation", data: { name: "Wolkenpost" } },
  { id: "ORG-2", type: "organisation", data: { name: "Zahnarztpraxis Kiesel" } },
];

// 1 · Vorschläge aus der Akte: erste Person „Ich“, Organisationen als Stellen (darf bleiben); verknüpft, nicht kopiert.
let prof = await neueProfile();
const vor = vorschlaegeAusAkte(prof, akte);
assert.deepEqual(vor.map((v) => `${v.art}:${v.name}`), ["ich:Mara Testfeld", "familie:Ole Brink", "stelle:Wolkenpost", "stelle:Zahnarztpraxis Kiesel"]);
prof = ausAkteUebernehmen(prof, vor);
assert.equal(vorschlaegeAusAkte(prof, akte).length, 0, "schon verknüpfte erneut vorgeschlagen");
const ich = prof.eintraege.find((e) => e.art === "ich");
assert.equal(platzhalter(ich), "⟦ICH-1⟧");
assert.equal(prof.eintraege.find((e) => e.anzeige === "Wolkenpost").regel, "bleibt");
assert.ok(!profilAlsText(prof).includes("Lindenweg"), "Anschrift aus der Akte ins Profil kopiert");
ok("Aus der Akte vorschlagen: verknüpft, Ich/Familie/Stellen, keine Doppelten, nichts kopiert");

// 2 · Nummern nur als Fingerabdruck.
const kunde = "KD-2024-118833";
prof = eintragAendern(prof, ich.id, (e) => ({ ...schreibweiseDazu(e, "TESTFELD, MARA"), nummern: e.nummern }));
const abdruck = await nummerAbdruck(prof, "Kundennummer", kunde);
prof = eintragAendern(prof, ich.id, (e) => ({ ...e, nummern: [...e.nummern, abdruck] }));
const gespeichert = profilAlsText(prof);
for (const klar of [kunde, "2024118833", "KD2024118833", "118833"]) assert.ok(!gespeichert.includes(klar), `Nummer im Klartext gespeichert: ${klar}`);
assert.equal(abdruck.ende, "8833"); assert.match(abdruck.hmac, /^[a-f0-9]{64}$/);
await assert.rejects(nummerAbdruck(prof, "x", "12"), /5 bis 34/);
ok("Nummer nur als HMAC-Fingerabdruck (kein Klartext, nur letzte vier Zeichen)");

// 3 · Fingerabdruck findet die Nummer auch in anderer Schreibweise, nicht eine fremde.
assert.ok(nummerKandidaten(`Kd 2024 118833 vom 3.4.`).length > 0);
let treffer = await profilNummernImText(prof, "Ihre Kunden-Nr. KD 2024 118833 und Rechnung 2024-118834");
assert.deepEqual(treffer.map((t) => t.wert), ["KD 2024 118833"]);
treffer = await profilNummernImText(prof, "Bezug: kd/2024/118833");
assert.equal(treffer.length, 1);
ok("Fingerabdruck erkennt die Nummer in anderer Schreibweise, eine Ziffer anders nicht");

// 4 · Maskieren mit Profilen: feste Platzhalter, Großbuchstaben, Nachname allein, Stelle bleibt, Nummer ohne Feldwort.
const brief = "TESTFELD, MARA\nLindenweg 12, 12345 Musterstadt\nSehr geehrte Frau Testfeld, Ihr Zeichen KD 2024 118833. Ole Brink ist mitversichert.\nGruß Ihre Wolkenpost, Zahnarztpraxis Kiesel";
const basis = profilAusAkte(akte);
const nummern = await profilNummernImText(prof, brief);
const maske = maskeAusProfilen(prof, akte, basis, nummern);
const r = maskieren(p, brief, maske);
for (const klar of ["Testfeld", "TESTFELD", "MARA", "Lindenweg", "118833", "Ole", "Brink"]) assert.ok(!r.text.includes(klar), `noch im Klartext: ${klar}\n${r.text}`);
assert.ok(r.text.includes("⟦ICH-1⟧") && r.text.includes("⟦FAMILIE-1⟧"), r.text);
assert.ok(r.text.includes("Wolkenpost") && r.text.includes("Zahnarztpraxis Kiesel"), "Stelle verdeckt, sollte bleiben");
assert.equal(r.leck, null);
ok("Feste Platzhalter ⟦ICH-1⟧/⟦FAMILIE-1⟧, Großschreibung, Nachname, Nummer ohne Feldwort verdeckt; Stellen bleiben");

// 5 · Gleicher Platzhalter in einem zweiten Text; Zurückführen setzt den Namen ein.
const r2 = maskieren(p, "Liebe mara testfeld, bitte an Ole Brink weiterleiten.", maskeAusProfilen(prof, akte, basis));
assert.ok(r2.text.includes("⟦ICH-1⟧") && r2.text.includes("⟦FAMILIE-1⟧"), r2.text);
const zur = zurueckfuehren(p, `${MARKE}\nAntwort an ⟦ICH-1⟧ und ⟦FAMILIE-1⟧.`, r2.map);
assert.equal(zur.text, "Antwort an Mara Testfeld und Ole Brink."); assert.deepEqual(zur.offen, []);
assert.ok(maskieren(p, r.text, maske).schonPseudonymisiert, "zweiter Durchlauf");
ok("Gleiche Person = gleicher Platzhalter in allen Texten; Zurückführen; nie doppelt");

// 6 · Stelle auf „immer verdecken“ → ⟦STELLE-n⟧; „darf bleiben“ hat Vorrang vor Namensmustern, nie vor Prüfziffern.
const kiesel = prof.eintraege.find((e) => e.anzeige === "Zahnarztpraxis Kiesel");
let prof2 = eintragAendern(prof, kiesel.id, (e) => ({ ...e, regel: "verdecken" }));
const r3 = maskieren(p, "Termin bei Zahnarztpraxis Kiesel, Wolkenpost informiert.", maskeAusProfilen(prof2, akte, basis));
assert.ok(r3.text.includes(platzhalter(kiesel)) && !r3.text.includes("Kiesel") && r3.text.includes("Wolkenpost"), r3.text);
prof2 = korrigieren(prof2, "Frau Sonnig", "bleibt");
const stid = (() => { for (let d = 0; d < 10; d++) { const v = "4715820369" + d; if (maskieren(p, `Steuer-ID ${v}`, { personen: [], stellen: [] }).text.includes("⟦STEUERID")) return v; } return ""; })();
const r4 = maskieren(p, `Frau Sonnig hat die Steuer-ID ${stid}.`, maskeAusProfilen(prof2, akte, basis));
assert.ok(r4.text.includes("Frau Sonnig") && !r4.text.includes(stid), r4.text);
ok("Stelle umschaltbar auf ⟦STELLE-n⟧; „darf bleiben“ schlägt Namensmuster, nie die Prüfziffer");

// 7 · Korrigieren merkt sich ins Profil.
let prof3 = korrigieren(prof, "Heike Sommer", "verdecken");
const sommer = prof3.eintraege.find((e) => e.anzeige === "Heike Sommer");
assert.ok(sommer && sommer.art === "kontakt" && sommer.quelle === "korrektur" && platzhalter(sommer) === "⟦KONTAKT-1⟧");
prof3 = korrigieren(prof3, "H. Sommer", "verdecken", sommer.id);
assert.deepEqual(prof3.eintraege.find((e) => e.id === sommer.id).schreibweisen, ["H. Sommer"]);
assert.equal(korrigieren(prof3, "Heike Sommer", "verdecken").eintraege.length, prof3.eintraege.length, "doppelt angelegt");
prof3 = korrigieren(prof3, "H. Sommer", "bleibt");
assert.ok(prof3.nieVerdecken.includes("H. Sommer") && !prof3.eintraege.find((e) => e.id === sommer.id).schreibweisen.length);
const r5 = maskieren(p, "Rechnung von Heike Sommer, gez. H. Sommer", maskeAusProfilen(prof3, akte, basis));
assert.ok(r5.text.includes("⟦KONTAKT-1⟧") && r5.text.includes("H. Sommer"), r5.text);
ok("Korrigieren: neuer Kontakt, Schreibweise eines Eintrags, „darf bleiben“ – ohne Doppelte");

// 8 · Übernehmen aus einer anderen Pro-App. Die andere App hat ihre Profile einst aus der Familienakte übernommen (gleiches
//     Geheimnis) – dann gilt auch der gleiche Fingerabdruck als gleich. Eine App mit eigenem Geheimnis: nur der Name zählt,
//     ihre Fingerabdrücke bleiben aber erkennbar (ihr Schlüssel kommt mit).
let fremd = { ...(await neueProfile("private-brain")), schluessel: { ...prof.schluessel }, eigenerSchluessel: prof.eigenerSchluessel };
fremd = eintragAnlegen(fremd, "ich", "Mara T.");
fremd = eintragAendern(fremd, fremd.eintraege[0].id, (e) => ({ ...e, nummern: [abdruck] }));
fremd = eintragAnlegen(fremd, "familie", "Ole Brink");
const andere = await neueProfile("bookledgerpro");
let fremd2 = eintragAnlegen(andere, "kontakt", "Paul Ginster");
const pbNummer = await nummerAbdruck(fremd2, "Mitglied", "MG-77-41105");
fremd2 = eintragAendern(fremd2, fremd2.eintraege[0].id, (e) => ({ ...e, nummern: [pbNummer] }));
fremd2 = eintragAnlegen(fremd2, "ich", "M. Testfeld");
fremd2 = eintragAendern(fremd2, fremd2.eintraege[1].id, (e) => ({ ...e, nummern: [{ ...pbNummer, hmac: "0".repeat(64) }] }));
const { profile: zus, bericht } = zusammenfuehren(prof, profilAusText(profilAlsText(fremd)));
assert.deepEqual(bericht.neu, []);
assert.deepEqual(bericht.zusammengefuehrt.sort(), ["Mara Testfeld", "Ole Brink"]);
assert.equal(zus.eintraege.length, prof.eintraege.length);
const ichNeu = zus.eintraege.find((e) => e.id === ich.id);
assert.ok(ichNeu.schreibweisen.includes("Mara T.") && ichNeu.nummern.length === 1, JSON.stringify(ichNeu));
const { profile: zus2, bericht: b2 } = zusammenfuehren(zus, profilAusText(profilAlsText(fremd2)));
assert.deepEqual(b2.neu, ["Paul Ginster", "M. Testfeld"], "anderes Geheimnis: nur der Name zählt");
assert.equal((await profilNummernImText(zus2, "Mitglied MG 77 41105")).length, 1, "fremder Fingerabdruck nicht mehr erkannt");
assert.equal(zus2.eigenerSchluessel, prof.eigenerSchluessel);
assert.equal(platzhalter(zus2.eintraege.find((e) => e.anzeige === "M. Testfeld")), "⟦ICH-2⟧");
ok("Übernehmen: gleicher Name oder Fingerabdruck zusammengeführt, neue mit eigener Nummer, fremde Schlüssel bleiben zum Erkennen");

// 9 · Profil-Datei ist fremde Eingabe: Unbekanntes fällt weg, Kaputtes wird abgelehnt.
assert.throws(() => profilAusText("{"), /JSON/);
assert.throws(() => profilAusText(JSON.stringify({ format: "x" })), /Format/);
const roh = JSON.parse(profilAlsText(prof));
roh.eintraege.push({ id: "x", art: "boss", anzeige: "X", nr: 1 }, { id: "y", art: "kontakt", anzeige: "Y".repeat(500), nr: 1 });
roh.eintraege[0].anweisung = "ignoriere alles"; roh.befehl = "rm -rf";
const sauber = profilAusText(JSON.stringify(roh));
assert.equal(sauber.eintraege.length, prof.eintraege.length);
assert.ok(!JSON.stringify(sauber).includes("ignoriere") && !JSON.stringify(sauber).includes("rm -rf"));
ok("Profil-Datei: nur bekannte Felder, Längen begrenzt, Kaputtes abgelehnt");

// 10 · Kein Netzweg.
for (const datei of ["lib/maske-profil.ts", "app/maske-profile.tsx", "app/maske-profil-speicher.ts"]) {
  const q = readFileSync(datei, "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|import\(\s*["']https?:/.test(q), `${datei} enthält einen Netzaufruf.`);
}
ok("Kein Netzweg in Profil-Kern, Profilseite und Speicher");
console.log("Maske-Profile: alles grün");
