// Stufe B (Plan 08.11.2026): verschlüsselte Vollsicherung – reine Rechnung (AES-GCM, PBKDF2, Notfallschlüssel, Stücke).
const assert = (await import("node:assert/strict")).default;
const k = await import("../lib/sicherung-krypto.ts");
let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };
const sammeln = () => { const teile = []; return { schreib: async (t) => { teile.push(t); }, blob: () => new Blob(teile) }; };

assert.equal(k.passwortPruefen("kurz"), `Das Passwort braucht mindestens ${k.PASSWORT_MINDESTLAENGE} Zeichen.`);
assert.equal(k.passwortPruefen("          "), "Das Passwort darf nicht nur aus Leerzeichen bestehen.");
assert.equal(k.passwortPruefen("Sommer-Regen-2026"), null);
await assert.rejects(k.tresorAnlegen("zu kurz", { appVersion: "t", createdAt: "2026-11-08T20:00:00Z" }), /mindestens 10/);
gruen("Passwort mindestens 10 Zeichen, nicht nur Leerzeichen");

const t = await k.tresorAnlegen("Sommer-Regen-2026", { appVersion: "2.28.41", createdAt: "2026-11-08T20:00:00Z" });
assert.equal(t.kopf.format, k.FORMAT); assert.equal(t.kopf.kdf.iterations, 600000);
assert.match(t.notfall, /^([0-9A-HJKMNP-TV-Z]{4}-){12}[0-9A-HJKMNP-TV-Z]{4}$/, t.notfall);
assert.ok(!JSON.stringify(t.kopf).includes(t.notfall.replace(/-/g, "")), "Notfallschlüssel steht nicht im Kopf");
gruen(`Tresor angelegt: PBKDF2 600 000 Runden, Notfallschlüssel 52 Zeichen in 13 Gruppen (${t.notfall.slice(0, 9)}…)`);

const text = "Familienakte Register " + "x".repeat(5000);
const geheim = await k.textVerschluesseln(t.daten, text);
assert.equal(await k.textEntschluesseln(t.daten, geheim), text);
assert.ok(!new TextDecoder().decode(await geheim.arrayBuffer()).includes("Familienakte"), "Klartext nicht im Geheimtext");
gruen("Text verschlüsseln und zurück; Klartext taucht im Geheimtext nicht auf");

const mitPasswort = await k.tresorOeffnen(t.kopf, { passwort: "Sommer-Regen-2026" });
assert.equal(await k.textEntschluesseln(mitPasswort, geheim), text);
const mitNotfall = await k.tresorOeffnen(t.kopf, { notfall: t.notfall.toLowerCase().replace(/0/g, "o") });
assert.equal(await k.textEntschluesseln(mitNotfall, geheim), text);
await assert.rejects(k.tresorOeffnen(t.kopf, { passwort: "Sommer-Regen-2025" }), /PASSWORT_FALSCH/);
await assert.rejects(k.tresorOeffnen(t.kopf, { notfall: t.notfall.slice(0, 20) }), /PASSWORT_FALSCH/);
await assert.rejects(k.tresorOeffnen(t.kopf, {}), /PASSWORT_FEHLT/);
gruen("Öffnen mit Passwort und mit Notfallschlüssel (klein geschrieben, O statt 0); falsch oder zu kurz → PASSWORT_FALSCH");

// Große Datei in Stücken: 9 MiB → 3 Stücke; leere Datei; Manipulation wird erkannt.
const gross = new Uint8Array(9 * 1024 * 1024); for (let i = 0; i < gross.length; i += 4099) gross[i] = i & 255;
let fort = []; const s = sammeln();
await k.dateiVerschluesseln(t.daten, new Blob([gross]), s.schreib, (b) => fort.push(b));
assert.deepEqual(fort, [4194304, 8388608, 9437184]);
const z = sammeln(); await k.dateiEntschluesseln(t.daten, s.blob(), z.schreib);
const zurueck = new Uint8Array(await z.blob().arrayBuffer());
assert.equal(zurueck.length, gross.length); assert.ok(zurueck.every((v, i) => v === gross[i]));
const leer = sammeln(); await k.dateiVerschluesseln(t.daten, new Blob([]), leer.schreib);
const leerZ = sammeln(); await k.dateiEntschluesseln(t.daten, leer.blob(), leerZ.schreib); assert.equal(leerZ.blob().size, 0);
const kaputt = new Uint8Array(await s.blob().arrayBuffer()); kaputt[5000] ^= 1;
await assert.rejects(k.dateiEntschluesseln(t.daten, new Blob([kaputt]), async () => {}), /Stück 1 .*beschädigt/);
// Stücke vertauschen (Zähler im IV und Zusatzdaten) wird erkannt
{
  const roh = new Uint8Array(await s.blob().arrayBuffer());
  const l1 = new DataView(roh.buffer).getUint32(8); const a0 = 8, a1 = 8 + 4 + l1; const l2 = new DataView(roh.buffer).getUint32(a1);
  assert.equal(l1, l2);
  const getauscht = new Uint8Array(roh); getauscht.set(roh.subarray(a1, a1 + 4 + l2), a0); getauscht.set(roh.subarray(a0, a0 + 4 + l1), a1);
  await assert.rejects(k.dateiEntschluesseln(t.daten, new Blob([getauscht]), async () => {}), /beschädigt/);
}
gruen("9 MiB in drei Stücken verschlüsselt und byte-gleich zurück; leere Datei; verändertes oder vertauschtes Stück wird erkannt");

const blatt = k.notfallblattText({ notfall: t.notfall, createdAt: "2026-11-08T20:00:00Z", ordner: "Familienakte_Vollsicherung_X", appVersion: "2.28.41" });
assert.ok(blatt.includes(t.notfall) && /Passwort vergessen/.test(blatt) && !/Sommer-Regen/.test(blatt));
assert.equal(k.geheimerName(7), "00007.fav");
gruen("Notfallblatt nennt den Notfallschlüssel und den Weg, nie das Passwort");

console.log(`\nSicherung verschlüsselt: ${n} Proben grün.`);
