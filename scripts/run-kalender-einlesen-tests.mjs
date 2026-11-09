// Stufe D (Plan 08.11.2026): Termine aus dem Kalender einlesen – reine Regeln.
const assert = (await import("node:assert/strict")).default;
const e = await import("../lib/kalender-einlesen.ts");
const k = await import("../lib/kalender.ts");
let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };
const frist = (id, data, extra = {}) => ({ id, recordType: "deadline", createdAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-01T08:00:00Z", status: "offen", source: null, notes: null, data, ...extra });
const termin = (eintragId, titel, beginn, extra = {}) => ({ eintragId, kalenderId: "primary", titel, beginn, ende: null, ganztags: false, ...extra });

// Felder in Ortszeit; ganztägig ohne Uhrzeit.
{
  const f = e.felderAus(termin("1", "Zahnarzt", "2026-11-20T13:30:00.000Z"));
  const d = new Date("2026-11-20T13:30:00.000Z");
  assert.equal(f.dueAt, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  assert.equal(f.dueTime, `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  assert.deepEqual(e.felderAus(termin("2", "Urlaub", "2026-12-24", { ganztags: true })), { title: "Urlaub", dueAt: "2026-12-24", dueTime: null });
  assert.equal(e.felderAus(termin("3", "   ", "2026-12-24", { ganztags: true })).title, "Termin");
  gruen("Fremder Termin → Frist: Datum und Uhrzeit in Ortszeit, ganztägig ohne Uhrzeit, leerer Titel wird „Termin“");
}

// Neue fremde Termine werden angelegt; eigene Einträge der Akte übersprungen.
{
  const eigen = frist("FRI-000001", { title: "Antwort Krankenkasse", dueAt: "2026-11-20", kalenderEintragen: true, kalender: [{ anbieter: "google", kalenderId: "primary", eintragId: "ev1", stand: "x", am: "t" }] });
  const plan = e.einlesePlan([eigen], [
    termin("ev1", "Antwort Krankenkasse", "2026-11-20T08:00:00Z"),
    termin("g2", "Elternabend", "2026-11-25T18:00:00Z"),
    termin("g3", "Irgendwas", "2026-11-26T18:00:00Z", { uid: `${k.kalenderUid(eigen)}` }),
    termin("g4", "Aus der App", "2026-11-27T18:00:00Z", { beschreibung: "Aus der Familienakte (FRI-000009)." }),
    termin("g5", "Mit Vermerk", "2026-11-28T18:00:00Z", { familienakte: "fa-x@familienakte" }),
    termin("g6", "Schon weg", "2026-11-29T18:00:00Z", { geloescht: true }),
  ], "google");
  assert.deepEqual(plan.map((s) => s.art), ["eigener", "anlegen", "eigener", "eigener", "eigener"]);
  assert.equal(plan[1].felder.title, "Elternabend");
  gruen("Neuer fremder Termin wird angelegt; eigene Einträge (Zuordnung, UID, Beschreibung, Vermerk) und gelöschte Unbekannte übersprungen");
}

// Wiedererkennen an der Quelle: nur Kalender geändert → ändern; nur Akte → gleich (geht beim Hinausschreiben); beide → Frage; gelöscht → archivieren.
{
  const t0 = termin("g2", "Elternabend", "2026-11-25T18:00:00Z");
  const felder = e.felderAus(t0);
  const q = e.quelleAus(t0, "google", felder, "Familie");
  const rec = frist("FRI-000002", { ...felder, kalenderEintragen: true, kalenderQuelle: q, kalender: [{ anbieter: "google", kalenderId: "primary", eintragId: "g2", stand: q.stand, am: q.am }] });
  assert.deepEqual(e.einlesePlan([rec], [t0], "google").map((s) => s.art), ["gleich"]);
  const t1 = { ...t0, titel: "Elternabend Klasse 3", geaendert: "2026-11-10T10:00:00Z" };
  const p1 = e.einlesePlan([rec], [t1], "google"); assert.equal(p1[0].art, "aendern"); assert.equal(p1[0].felder.title, "Elternabend Klasse 3");
  const recLokal = { ...rec, data: { ...rec.data, title: "Elternabend (verschoben)" }, updatedAt: "2026-11-09T10:00:00Z" };
  assert.deepEqual(e.einlesePlan([recLokal], [t0], "google").map((s) => s.art), ["gleich"], "nur hier geändert → nichts einlesen");
  const p2 = e.einlesePlan([recLokal], [t1], "google"); assert.equal(p2[0].art, "konflikt"); assert.equal(p2[0].vorschlag, "dort", "jüngere Änderung vorgeschlagen");
  const p3 = e.einlesePlan([rec], [{ ...t0, geloescht: true }], "google"); assert.equal(p3[0].art, "archivieren");
  assert.deepEqual(e.einleseZaehlung([...p1, ...p2, ...p3]), { anlegen: 0, aendern: 1, archivieren: 1, konflikte: 1, gleich: 0, eigene: 0 });
  gruen("Quelle wiedererkannt: Kalender geändert → ändern, Akte geändert → nichts, beide → Frage (jüngere vorgeschlagen), gelöscht → archivieren");
}

// Hinausschreiben (lib/kalender abgleichPlan): eingelesene Termine werden nie entfernt; eine Änderung in der Akte geht nur mit Titel und Zeit zurück.
{
  const t0 = termin("g2", "Elternabend", "2026-11-25T18:00:00Z");
  const felder = e.felderAus(t0); const q = e.quelleAus(t0, "google", felder, "Familie");
  const rec = frist("FRI-000002", { ...felder, kalenderEintragen: true, kalenderQuelle: q, kalender: [{ anbieter: "google", kalenderId: "primary", eintragId: "g2", stand: "irgendwas", am: q.am }] });
  const ziel = { anbieter: "google", kalenderId: "arbeit" };
  assert.deepEqual(k.abgleichPlan([rec], ziel).map((s) => s.art), ["gleich"], "unverändert: nichts, auch wenn der Stand-Hash nicht passt");
  assert.deepEqual(k.abgleichPlan([{ ...rec, status: "erledigt" }], ziel).map((s) => s.art), ["gleich"], "erledigt löscht den Termin des Nutzers nicht");
  const plan = k.abgleichPlan([{ ...rec, data: { ...rec.data, title: "Elternabend 19 Uhr" } }], ziel);
  assert.equal(plan[0].art, "aendern"); assert.equal(plan[0].kalenderId, "primary", "in seinem Kalender, nicht im Zielkalender der Einstellung");
  assert.equal(plan[0].eintrag.quelle, true);
  const g = k.googleEreignis(plan[0].eintrag); assert.deepEqual(Object.keys(g).sort(), ["end", "start", "summary"]);
  const m = k.graphEreignis(plan[0].eintrag); assert.deepEqual(Object.keys(m).sort(), ["end", "start", "subject"]);
  const d = k.geraetEreignis(plan[0].eintrag, "Europe/Berlin"); assert.deepEqual(Object.keys(d).sort(), ["beginn", "ende", "titel", "zeitzone"]);
  gruen("Hinausschreiben: eingelesener Termin wird nie entfernt; Änderung geht nur mit Titel und Zeit zurück (Google, Microsoft, Gerät)");
}

console.log(`\nKalender einlesen: ${n} Proben grün.`);
