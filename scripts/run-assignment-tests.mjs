import assert from "node:assert/strict";
import {
  assignmentProposalHasNoAutomaticWrites,
  assignmentSequence,
  proposeFamilyAssignment,
} from "../lib/family-assignment.ts";

const records = [
  { id: "PER-000001", recordType: "person", label: "Gesundheitskontakt Nord", identifiers: ["B508403049"] },
  { id: "OBJ-000001", recordType: "object", label: "Motoria Strada 1200", identifiers: ["WL-SB-1200"] },
  { id: "VORG-000001", recordType: "case", label: "Wiederzulassung Motoria" },
  { id: "ORG-000001", recordType: "organisation", label: "TÜV Nord", aliases: ["TÜV"] },
  { id: "VORG-000002", recordType: "case", label: "Stromabrechnung 2026" },
  { id: "ORG-000002", recordType: "organisation", label: "Muster Energie GmbH", aliases: ["Muster Energie"] },
  { id: "OBJ-000002", recordType: "object", label: "Technova Notebook", identifiers: ["SN-2026-4711"] },
  { id: "VORG-000003", recordType: "case", label: "Volle Altersvorsorge" },
  { id: "ORG-000003", recordType: "organisation", label: "Rentenversicherung", aliases: ["Rentenversicherung"] },
];

const context = { records, now: "2026-10-07T17:45:00+02:00" };
const step = (proposal, stage) => proposal.steps.find((item) => item.stage === stage);

const vehicle = proposeFamilyAssignment({
  title: "TÜV-Bericht Motoria Strada 1200",
  fileName: "2025-06-23_TUEV_Motoria.pdf",
  documentType: "Hauptuntersuchung",
  personHints: ["Gesundheitskontakt Nord"],
  areaHint: "Motorrad",
  subareaHint: "TÜV & Versicherung",
  objectHints: ["Motoria Strada 1200"],
  caseHints: ["Wiederzulassung Motoria"],
  organisationHints: ["TÜV Nord"],
  identifiers: ["WL-SB-1200"],
  deadline: "2028-06-30",
  deadlineType: "TÜV/HU",
  requiredAction: "HU rechtzeitig vorbereiten",
}, context);
assert.equal(step(vehicle, "person")?.selectedId, "PER-000001");
assert.equal(step(vehicle, "object")?.selectedId, "OBJ-000001");
assert.equal(step(vehicle, "case")?.selectedId, "VORG-000001");
assert.equal(step(vehicle, "organisation")?.selectedId, "ORG-000001");
assert.equal(vehicle.deadlineProposal?.date, "2028-06-30");
assert.equal(vehicle.canApplyAutomatically, false);

const household = proposeFamilyAssignment({
  title: "Stromrechnung 2026",
  documentType: "Rechnung",
  personHints: ["Gesundheitskontakt Nord"],
  areaHint: "Haushalt",
  subareaHint: "Energie",
  caseHints: ["Stromabrechnung 2026"],
  organisationHints: ["Muster Energie"],
  amount: 164.32,
  currency: "EUR",
  paid: false,
  deadline: "2026-10-31",
  deadlineType: "Zahlungsfrist",
  contractNumber: "STROM-2026-88",
}, context);
assert.equal(step(household, "case")?.selectedId, "VORG-000002");
assert.equal(step(household, "organisation")?.selectedId, "ORG-000002");
assert.equal(household.paymentProposal?.status, "offen");
assert.equal(household.contractProposal?.number, "STROM-2026-88");

const purchase = proposeFamilyAssignment({
  title: "Rechnung Technova Notebook",
  fileName: "Technova_Notebook_Rechnung.pdf",
  documentType: "Kaufbeleg",
  areaHint: "Kauf und Garantie",
  subareaHint: "Geräte & Technik",
  objectHints: ["Technova Notebook"],
  identifiers: ["SN-2026-4711"],
  purchaseDate: "2026-07-14",
  warrantyEnd: "2028-07-14",
}, context);
assert.equal(step(purchase, "object")?.selectedId, "OBJ-000002");
assert.equal(purchase.warrantyProposal?.expiresOn, "2028-07-14");
assert.equal(purchase.deadlineProposal?.type, "Garantieende");

const health = proposeFamilyAssignment({
  title: "Schreiben zur Altersvorsorge",
  documentType: "Behördenschreiben",
  personHints: ["Gesundheitskontakt Nord"],
  areaHint: "Gesundheit",
  subareaHint: "Anträge & Bescheide",
  caseHints: ["Volle Altersvorsorge"],
  organisationHints: ["Rentenversicherung"],
  deadline: "2026-11-04",
  deadlineType: "Antwortfrist",
  requiredAction: "Schreiben beantworten",
  sensitive: true,
}, context);
assert.equal(health.protectedHealthArea, true);
assert.equal(health.sensitiveReferenceOnly, true);
assert.equal(step(health, "case")?.selectedId, "VORG-000003");
assert.equal(step(health, "organisation")?.selectedId, "ORG-000003");

for (const proposal of [vehicle, household, purchase, health]) {
  assert.deepEqual(proposal.sequence, assignmentSequence);
  assert.equal(assignmentProposalHasNoAutomaticWrites(proposal), true);
  assert.equal(proposal.requiresConfirmation, true);
}

console.log("🟢 Fahrzeug/TÜV: vorhandene Person, Objekt, Vorgang und Organisation wiederverwendet");
console.log("🟢 Haushalt/Stromrechnung: Vertrag, Rechnung, Zahlung und Frist als Vorschläge vorbereitet");
console.log("🟢 Kauf/Garantie: vorhandenes Objekt und Garantieende als Vorschlag vorbereitet");
console.log("🟢 Gesundheit/Behörde: geschützter Bereich nutzt nur Referenzen und notwendige Metadaten");
console.log("🟢 Sicherheitsregel: keine automatische Übernahme, Verschiebung, Kopie, Umbenennung, Löschung oder Zusammenführung");
