// Stufe A (Plan 08.11.2026): Zusammenführen zweier Akten-Stände – reine Regeln.
const assert = (await import("node:assert/strict")).default;
const a = await import("../lib/abgleich.ts");
let n = 0;
const gruen = (text) => { n++; console.log(`🟢 ${text}`); };
const leer = () => ({ documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {}, auditLog: [] });
const rec = (id, createdAt, title, updatedAt = createdAt) => ({ id, recordType: "deadline", createdAt, updatedAt, status: "offen", source: null, notes: null, data: { title } });
const doc = (id, checksum, name, updatedAt = "2026-11-01T10:00:00Z") => ({ id, checksum, originalName: name, storedPath: `Familienakte/01_Dokumente/${id}.pdf`, updatedAt });

// Fingerabdruck hängt nicht an der Reihenfolge der Felder.
assert.equal(a.fingerabdruck({ a: 1, b: [1, { c: 2, d: 3 }] }), a.fingerabdruck({ b: [1, { d: 3, c: 2 }], a: 1 }));
assert.notEqual(a.fingerabdruck({ a: 1 }), a.fingerabdruck({ a: 2 }));
assert.equal(a.fingerabdruck({ a: 1, b: undefined }), a.fingerabdruck({ a: 1 }));
gruen("Fingerabdruck: gleiche Inhalte gleich, unabhängig von der Feldreihenfolge");

// Nur dort neu → kommt dazu; nur hier → bleibt; nichts wird gelöscht.
{
  const hier = leer(), dort = leer();
  hier.records = [rec("FRI-000001", "2026-11-01T08:00:00Z", "Zahnarzt")];
  dort.records = [rec("FRI-000001", "2026-11-01T08:00:00Z", "Zahnarzt")];
  dort.documents = [doc("d-neu", "sum-1", "Rechnung.pdf")];
  hier.documents = [doc("d-alt", "sum-2", "Vertrag.pdf")];
  const plan = a.abgleichPlanen(hier, dort);
  assert.equal(plan.konflikte.length, 0); assert.equal(plan.zaehlung.neu, 1); assert.equal(plan.zaehlung.gleich, 1); assert.equal(plan.zaehlung.nurHier, 1);
  const { akte } = a.abgleichAnwenden(plan);
  assert.deepEqual(akte.documents.map((d) => d.id).sort(), ["d-alt", "d-neu"]);
  assert.equal(akte.records.length, 1);
  gruen("Neues kommt dazu, Gleiches bleibt einmal, nur hier Vorhandenes bleibt (nichts gelöscht)");
}

// Ohne gemerkten Stand: Unterschied = Frage, Vorschlag die jüngere Änderung; ohne Wahl bleibt hier.
{
  const hier = leer(), dort = leer();
  hier.records = [rec("FRI-000002", "2026-11-01T08:00:00Z", "Termin 10 Uhr", "2026-11-02T09:00:00Z")];
  dort.records = [rec("FRI-000002", "2026-11-01T08:00:00Z", "Termin 11 Uhr", "2026-11-03T09:00:00Z")];
  const plan = a.abgleichPlanen(hier, dort);
  assert.equal(plan.konflikte.length, 1); assert.equal(plan.konflikte[0].vorschlag, "dort");
  assert.equal(a.abgleichAnwenden(plan).akte.records[0].data.title, "Termin 10 Uhr", "ohne Wahl bleibt hier");
  assert.equal(a.abgleichAnwenden(plan, { [plan.konflikte[0].schluessel]: "dort" }).akte.records[0].data.title, "Termin 11 Uhr");
  gruen("Ohne gemerkten Stand: beide verschieden → Frage, Vorschlag jüngere Änderung, ohne Wahl bleibt hier");
}

// Mit gemerktem Stand: nur eine Seite geändert → still; beide geändert → Frage.
{
  const start = leer();
  start.records = [rec("AUF-000001", "2026-11-01T08:00:00Z", "Einkaufen"), rec("AUF-000002", "2026-11-01T08:00:00Z", "Anrufen"), rec("AUF-000003", "2026-11-01T08:00:00Z", "Packen")];
  const basis = a.basisAus(start);
  const hier = structuredClone(start), dort = structuredClone(start);
  hier.records[0].data.title = "Einkaufen (hier geändert)";
  dort.records[1].data.title = "Anrufen (dort geändert)";
  hier.records[2].data.title = "Packen A"; dort.records[2].data.title = "Packen B";
  const plan = a.abgleichPlanen(hier, dort, basis);
  assert.equal(plan.zaehlung.uebernommen, 1); assert.equal(plan.konflikte.length, 1); assert.equal(plan.konflikte[0].id, "AUF-000003");
  const { akte, basis: neueBasis } = a.abgleichAnwenden(plan, {}, basis);
  assert.deepEqual(akte.records.map((r) => r.data.title), ["Einkaufen (hier geändert)", "Anrufen (dort geändert)", "Packen A"]);
  assert.equal(neueBasis["records:AUF-000002"], a.fingerabdruck(akte.records[1]));
  gruen("Mit gemerktem Stand: nur hier → bleibt, nur dort → still übernommen, beide → Frage");
}

// Gleiche laufende Nummer, andere Anlagezeit = verschiedene Einträge; Verweise wandern mit.
{
  const hier = leer(), dort = leer();
  hier.records = [rec("PER-000001", "2026-11-01T08:00:00Z", "Anna")];
  hier.sequences = { PER: 1 };
  dort.records = [rec("PER-000001", "2026-11-05T08:00:00Z", "Bert")];
  dort.relations = [{ id: "rel-1", fromType: "document", fromId: "d-1", toType: "person", toId: "PER-000001", relationType: "betrifft", createdAt: "2026-11-05T08:00:00Z", source: null, notes: null }];
  dort.documents = [doc("d-1", "sum-x", "Ausweis.pdf")];
  const plan = a.abgleichPlanen(hier, dort);
  assert.equal(plan.umbenannt["PER-000001"], "PER-000002"); assert.equal(plan.konflikte.length, 0);
  const { akte } = a.abgleichAnwenden(plan);
  assert.deepEqual(akte.records.map((r) => `${r.id}:${r.data.title}`), ["PER-000001:Anna", "PER-000002:Bert"]);
  assert.equal(akte.relations[0].toId, "PER-000002", "Verknüpfung zeigt auf den umbenannten Eintrag");
  assert.equal(akte.sequences.PER, 2, "Zähler steht hinter der neuen Nummer");
  gruen("Gleiche Nummer, andere Anlagezeit → neue Nummer, Verknüpfungen und Zähler mitgeführt");
}

// Dieselbe Datei zweimal abgelegt (gleiche Prüfsumme, andere Kennung) → einmal, Verweise auf die vorhandene.
{
  const hier = leer(), dort = leer();
  hier.documents = [doc("d-hier", "sum-gleich", "Brief.pdf")];
  dort.documents = [doc("d-dort", "sum-gleich", "Brief (Handy).pdf")];
  dort.relations = [{ id: "rel-2", fromType: "document", fromId: "d-dort", toType: "case", toId: "VOR-000001", relationType: "gehört zu", createdAt: "x", source: null, notes: null }];
  const plan = a.abgleichPlanen(hier, dort);
  const { akte } = a.abgleichAnwenden(plan);
  assert.equal(akte.documents.length, 1); assert.equal(akte.relations[0].fromId, "d-hier");
  assert.ok(plan.liste.some((z) => z.art === "gleich-datei"));
  gruen("Gleiche Prüfsumme unter anderer Kennung → dieselbe Datei, Verknüpfung auf die vorhandene");
}

// Archiviert bleibt archiviert, wenn nur eine Seite es geändert hat; Protokolle werden vereinigt.
{
  const start = leer(); start.documents = [doc("d-a", "s", "Alt.pdf")]; const basis = a.basisAus(start);
  const hier = structuredClone(start), dort = structuredClone(start);
  hier.documents[0].aussortiert = { am: "2026-11-07T10:00:00Z", vorherPfad: "x", verschoben: false };
  hier.auditLog = [{ id: "l1", at: "2026-11-07T10:00:00Z" }]; dort.auditLog = [{ id: "l2", at: "2026-11-08T10:00:00Z" }, { id: "l1", at: "2026-11-07T10:00:00Z" }];
  const { akte } = a.abgleichAnwenden(a.abgleichPlanen(hier, dort, basis), {}, basis);
  assert.ok(akte.documents[0].aussortiert, "Archivierung geht nicht verloren");
  assert.deepEqual(akte.auditLog.map((e) => e.id), ["l2", "l1"]);
  gruen("Archivierung auf einer Seite bleibt erhalten; Protokolle vereinigt, jüngstes oben");
}

// Zweimal hintereinander zusammenführen ändert nichts mehr (stabil).
{
  const hier = leer(), dort = leer();
  hier.records = [rec("FRI-000001", "t1", "A")]; dort.records = [rec("FRI-000001", "t2", "B")]; dort.documents = [doc("d", "s", "X.pdf")];
  const erst = a.abgleichAnwenden(a.abgleichPlanen(hier, dort));
  const zweit = a.abgleichPlanen(erst.akte, dort, erst.basis);
  assert.equal(zweit.konflikte.length, 0); assert.equal(zweit.zaehlung.neu, 0);
  const wieder = a.abgleichAnwenden(zweit, {}, erst.basis);
  assert.equal(a.fingerabdruck(wieder.akte.records), a.fingerabdruck(erst.akte.records));
  gruen("Zweiter Abgleich mit demselben Stand: keine Frage, nichts Neues, Ergebnis unverändert");
}

console.log(`\nAbgleich: ${n} Proben grün.`);
