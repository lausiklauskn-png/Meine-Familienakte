// Kalender-Kern (Klaus 2026-11-05): ICS mit Erinnerung, stabile UID, Abgleich (anlegen/ändern/entfernen), Gesundheit neutral.
// Läuft in fester Zeitzone Europe/Berlin, damit „9 Uhr“ prüfbar ist.
process.env.TZ = "Europe/Berlin";
const assert = (await import("node:assert/strict")).default;
const k = await import("../lib/kalender.ts");

let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };

const frist = (extra = {}, data = {}) => ({ id: "FRIST-000007", recordType: "deadline", createdAt: "2026-11-05T10:00:00.000Z", updatedAt: "2026-11-05T10:00:00.000Z", status: "offen", source: "Manuelle Eingabe", notes: "Kundennummer 4711 – geheim", ...extra, data: { title: "Rechnung Stadtwerke bezahlen", dueAt: "2026-11-20", kalenderEintragen: true, ...data } });

// Eintrag: 9 Uhr Ortszeit, 30 Minuten, Erinnerungen 7 Tage und 1 Tag vorher (Vorgabe), früheste zuerst.
const e = k.kalenderEintrag(frist());
assert.equal(e.beginn, "2026-11-20T08:00:00.000Z");
assert.equal(e.ende, "2026-11-20T08:30:00.000Z");
assert.deepEqual(e.erinnerungen, [10080, 1440]);
assert.equal(e.titel, "Rechnung Stadtwerke bezahlen");
assert.ok(!e.beschreibung.includes("4711"), "Notizen gehen nie hinaus");
gruen("Eintrag: ohne Uhrzeit 9 Uhr Ortszeit, 30 Minuten, Vorgabe 7 Tage + 1 Tag vorher, keine Notizen");

const mitZeit = k.kalenderEintrag(frist({}, { dueTime: "14:30", erinnerungen: ["tag9", "1d"] }));
assert.equal(mitZeit.beginn, "2026-11-20T13:30:00.000Z");
assert.deepEqual(mitZeit.erinnerungen, [1440, 330], "am Tag 9 Uhr = 5 h 30 vor 14:30");
const frueh = k.kalenderEintrag(frist({}, { dueTime: "08:00", erinnerungen: ["tag9"] }));
assert.deepEqual(frueh.erinnerungen, [0], "vor 9 Uhr: Erinnerung zum Beginn");
const falscheZeit = k.kalenderEintrag(frist({}, { dueTime: "25:99" }));
assert.equal(falscheZeit.beginn, "2026-11-20T08:00:00.000Z");
gruen("Uhrzeit frei: „am Tag, 9 Uhr“ richtig umgerechnet, ungültige Zeit fällt auf 9 Uhr zurück");

// Sommerzeit: 9 Uhr bleibt 9 Uhr Ortszeit.
assert.equal(k.kalenderEintrag(frist({}, { dueAt: "2026-07-01" })).beginn, "2026-07-01T07:00:00.000Z");
gruen("Sommerzeit: 9 Uhr Ortszeit im Juli");

// Verknüpfte Erinnerung (Erinnerungsdatum im Formular) kommt als weitere Erinnerung um 9 Uhr dazu.
const rem = { id: "REM-000003", recordType: "reminder", createdAt: "x", updatedAt: "x", status: "offen", source: "FRIST-000007", notes: null, data: { title: "Erinnerung", remindAt: "2026-11-17" } };
const rel = [{ id: "R1", fromType: "reminder", fromId: "REM-000003", toType: "deadline", toId: "FRIST-000007", relationType: "erinnert an", createdAt: "x", source: null, notes: null }];
const mitRem = k.kalenderEintrag(frist(), { records: [frist(), rem], relations: rel });
assert.deepEqual(mitRem.erinnerungen, [10080, 4320, 1440]);
gruen("Erinnerungsdatum aus dem Formular wird zur zusätzlichen Erinnerung (3 Tage vorher, 9 Uhr)");

// Stabile UID: gleiche Frist → gleich; gleiche Nummer in einer neuen Akte → anders.
assert.equal(k.kalenderUid(frist()), k.kalenderUid(frist({ updatedAt: "2026-12-01T00:00:00.000Z" })));
assert.notEqual(k.kalenderUid(frist()), k.kalenderUid(frist({ createdAt: "2027-01-01T00:00:00.000Z" })));
assert.match(k.kalenderUid(frist()), /^fa-frist-000007-[0-9a-f]{8}@familienakte$/);
gruen("UID stabil je Frist, verschieden bei gleicher Nummer in neuer Akte");

// Gesundheit: neutral, ohne Inhalt.
const g = frist({ source: "Hausarzt" }, { title: "Rezept Physiotherapie abholen" });
assert.equal(k.terminGeschuetzt(g), true);
const ge = k.kalenderEintrag(g);
assert.equal(ge.titel, "Frist");
assert.ok(!/physio|rezept|arzt/i.test(JSON.stringify([ge, k.googleEreignis(ge), k.graphEreignis(ge), k.icsDatei([ge])])));
assert.equal(k.kalenderEintrag(frist({ recordType: "task" }, { title: "Zahnarzt anrufen" })).titel, "Aufgabe");
assert.equal(k.terminGeschuetzt(frist(), ["Gesundheit"]), true, "verknüpfter Gesundheitsbereich zählt");
gruen("Gesundheit: Titel neutral („Frist“/„Aufgabe“), kein Inhalt in ICS, Google oder Microsoft");

// Abgleich.
const ziel = { anbieter: "google", kalenderId: "primary" };
const plan1 = k.abgleichPlan([frist(), frist({ id: "FRIST-000008" }, { kalenderEintragen: undefined }), rem], ziel);
assert.deepEqual(plan1.map((s) => [s.art, s.recordId]), [["anlegen", "FRIST-000007"]], "nicht angehakte Fristen werden nie still eingetragen");
const z = { anbieter: "google", kalenderId: "primary", eintragId: "abc", stand: e.stand, am: "2026-11-05" };
assert.deepEqual(k.abgleichPlan([frist({}, { kalender: [z] })], ziel).map((s) => s.art), ["gleich"]);
assert.deepEqual(k.abgleichPlan([frist({}, { kalender: [z], title: "Neu" })], ziel).map((s) => s.art), ["aendern"]);
assert.deepEqual(k.abgleichPlan([frist({ status: "erledigt" }, { kalender: [z] })], ziel).map((s) => s.art), ["entfernen"]);
assert.deepEqual(k.abgleichPlan([frist({ status: "zurückgestellt" }, { kalender: [z] })], ziel).map((s) => s.art), ["entfernen"]);
assert.deepEqual(k.abgleichPlan([frist({}, { kalender: [z], kalenderEintragen: false })], ziel).map((s) => s.art), ["entfernen"]);
assert.deepEqual(k.abgleichPlan([frist({}, { kalender: [z] })], { anbieter: "geraet", kalenderId: "3" }).map((s) => s.art), ["anlegen"], "anderer Kalender: eigener Eintrag, alter bleibt");
gruen("Abgleich: anlegen, gleich, ändern, entfernen bei erledigt/zurückgestellt/abgehakt; andere Kalender unberührt");

const liste = k.zuordnungSetzen([z, { ...z, anbieter: "ics", kalenderId: "datei" }], { ...z, eintragId: "neu" }, ziel);
assert.equal(liste.length, 2); assert.equal(liste.find((x) => x.anbieter === "google").eintragId, "neu");
assert.equal(k.zuordnungSetzen(liste, null, ziel).length, 1);
gruen("Zuordnung am Datensatz: ersetzt nur den eigenen Kalender, Entfernen lässt andere stehen");

// ICS.
const ics = k.icsDatei([e, mitZeit], { jetzt: new Date("2026-11-05T12:00:00Z"), abgesagt: [{ uid: "fa-frist-000001-00000000@familienakte", sequenz: 5 }] });
assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
assert.ok(!/[^\r]\n/.test(ics), "nur CRLF");
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 4);
assert.ok(ics.includes("DTSTART:20261120T080000Z"));
assert.ok(ics.includes("TRIGGER:-PT10080M") && ics.includes("TRIGGER:-PT1440M"));
assert.ok(ics.includes(`UID:${e.uid}`) && ics.includes("STATUS:CANCELLED"));
assert.ok(ics.split("\r\n").every((zeile) => new TextEncoder().encode(zeile).length <= 75), "Zeilen höchstens 75 Oktette");
const lang = k.kalenderEintrag(frist({}, { title: "Ä".repeat(80) + "; Komma, Strich\\" }));
const langIcs = k.icsDatei([lang]);
assert.ok(langIcs.split("\r\n").every((zeile) => new TextEncoder().encode(zeile).length <= 75));
const entfaltet = langIcs.replace(/\r\n /g, "");
assert.ok(entfaltet.includes("SUMMARY:" + "Ä".repeat(80) + "\\; Komma\\, Strich\\\\"));
gruen("ICS: VCALENDAR mit VEVENT, VALARM je Erinnerung, UTC-Zeiten, Absage, CRLF, Faltung ohne geteilte Umlaute, Escapes");

// Nutzlast je Anbieter.
const goo = k.googleEreignis(e);
assert.deepEqual(goo.reminders, { useDefault: false, overrides: [{ method: "popup", minutes: 10080 }, { method: "popup", minutes: 1440 }] });
assert.equal(goo.start.dateTime, e.beginn);
const gr = k.graphEreignis(e);
assert.equal(gr.reminderMinutesBeforeStart, 10080, "Microsoft: die früheste Erinnerung");
assert.equal(gr.start.dateTime, "2026-11-20T08:00:00"); assert.equal(gr.start.timeZone, "UTC");
const ger = k.geraetEreignis(e, "Europe/Berlin");
assert.equal(ger.beginn, Date.parse("2026-11-20T08:00:00Z")); assert.deepEqual(ger.erinnerungen, [10080, 1440]);
gruen("Nutzlast: Google (Erinnerungen popup), Microsoft (eine, früheste), Gerät (Millisekunden, Zeitzone)");

assert.equal(k.kalenderEintrag(frist({}, { dueAt: "" })), null);
assert.equal(k.kalenderEintrag(rem), null);
assert.deepEqual(k.erinnerungsMinuten(["7d", "7d", "1d"], "09:00", [99999, -5]), [40320, 10080, 1440]);
gruen("Grenzen: ohne Datum kein Eintrag, Erinnerungen doppelt/negativ/über 28 Tage bereinigt");

console.log(`Kalender-Kern: ${n} grün · 0 rot`);
