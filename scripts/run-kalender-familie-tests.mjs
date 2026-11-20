// Kalender je Person (Klaus 20.11.2026): wer gehört zu einem Termin, fest/vorläufig/abgelehnt, privat = „belegt“, Überschneidung.
const assert = (await import("node:assert/strict")).default;
const k = await import("../lib/kalender-familie.ts");
let n = 0; const gruen = (t) => { n++; console.log(`🟢 ${t}`); };
const termin = (id, data = {}) => ({ id, recordType: "task", status: "offen", createdAt: "", updatedAt: "", source: "", notes: null, data: { title: id, dueAt: "2026-11-22", ...data } });
const rel = (from, to) => ({ id: from + to, fromType: "task", fromId: from, toType: "person", toId: to, relationType: "betrifft", createdAt: "", source: null, notes: null });

const a = termin("T1", { fuer: ["anna", "bernd"], von: "anna", vorlaeufig: true });
assert.deepEqual(k.personenVon(a, []), ["anna", "bernd"]);
assert.deepEqual(k.personenVon(termin("T2"), [rel("T2", "clara")]), ["clara"]);
gruen("Personen eines Termins: für, von, Verknüpfung „betrifft“");

assert.equal(k.gehoertMir(a, [], "anna"), true); assert.equal(k.gehoertMir(a, [], "clara"), false);
assert.equal(k.gehoertMir(termin("T3"), [], "clara"), true); assert.equal(k.gehoertMir(a, [], null), true);
gruen("Mein Kalender: eigene Termine und solche ohne Person; ohne Besitzer alles");

assert.equal(k.terminStand(a), "vorläufig");
assert.equal(k.terminStand(termin("T4", { ...a.data, antworten: { bernd: "passt" } })), "fest");
assert.equal(k.terminStand(termin("T5", { ...a.data, antworten: { bernd: "passt-nicht" } })), "abgelehnt");
assert.equal(k.terminStand(termin("T6")), "fest");
gruen("Stand: vorläufig → fest, wenn alle passt sagen; passt nicht lehnt ab");

assert.equal(k.darfAntworten(a, "bernd"), true); assert.equal(k.darfAntworten(a, "anna"), false); assert.equal(k.darfAntworten(a, "clara"), false);
gruen("Antworten dürfen nur Mitgemeinte, nicht wer angelegt hat");

const p = termin("T7", { fuer: ["anna"], von: "anna", privat: true });
assert.equal(k.nurBelegt(p, [], "bernd"), true); assert.equal(k.nurBelegt(p, [], "anna"), false); assert.equal(k.nurBelegt(a, [], "bernd"), false);
gruen("Privat: die anderen sehen nur „belegt“");

const recs = [termin("F", { fuer: ["bernd"], von: "bernd", dueTime: "18:30" }), termin("G", { fuer: ["bernd"], dueTime: "21:00" })];
const ue = k.ueberschneidungen(recs, [], { tag: "2026-11-22", zeit: "19:00", personen: ["anna", "bernd"] });
assert.equal(ue.length, 1); assert.equal(ue[0].record.id, "F"); assert.equal(ue[0].person, "bernd");
assert.equal(k.ueberschneidungen(recs, [], { tag: "2026-11-23", zeit: "19:00", personen: ["bernd"] }).length, 0);
assert.equal(k.ueberschneidungen(recs, [], { tag: "2026-11-22", zeit: "", personen: ["bernd"] }).length, 0);
gruen("Überschneidung: selbe Person, selber Tag, unter einer Stunde");

const e = k.familienEingabe({ fuer: ["anna", "anna", ""], vorlaeufig: false, privat: true, antworten: {} });
assert.deepEqual(e, { fuer: ["anna"], privat: true });
assert.deepEqual(k.antwortSetzen({ antworten: { x: "passt" } }, "x", null).antworten, {});
gruen("Eingabe gesäubert, Antwort zurücknehmen");
console.log(`Kalender je Person: ${n} grün`);
