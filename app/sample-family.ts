// Beispielfamilie für die Vorführung der Familienakte.
//
// ALLE INHALTE SIND FREI ERFUNDEN:
// - erfundene Namen, Orte, Straßen und Postleitzahlen (PLZ 00xxx gibt es nicht),
// - erfundene Marken, Modelle und Kennzeichen,
// - keine Ärzte, Praxen, Kliniken oder Fachrichtungen, keine Diagnosen oder Codes,
// - keine echten Firmen, Versicherungen, Behörden oder Arbeitgeber,
// - alle Nummern absichtlich ungültig (falsche Länge, Buchstaben, Nullen).
// Die Daten werden über dieselben Funktionen angelegt, die auch die Oberfläche benutzt.

import { buildMemoryAnalysis } from "@/lib/family-memory";
import type { FamilyRecordType, FamilyRecordUnion, FamilyRelation } from "@/lib/family-data-model";
import { createSamplePdf } from "@/lib/sample-pdf";
import {
  createLocalCorrespondenceBundle, createLocalFamilyRecord, createLocalFamilyRelation, createLocalMemoryBundle,
  createLocalScheduleBundle, readLocalVaultData, removeVaultEntries, saveLocalDocument, updateLocalStatus,
} from "./local-vault";

export const SAMPLE_FAMILY_NAME = "Familie Lindqvist-Arenberg";
export const SAMPLE_NOTICE = "Alle Daten sind Beispieldaten.";
const SAMPLE_FLAG = "mmi-sample-family-v1";
const SAMPLE_IDS = "mmi-sample-family-ids";
const SAMPLE_SOURCE = "Beispieldaten – frei erfunden";

export const SAMPLE_ADDRESS = "Pustelblumenweg 7 · 00917 Wolkenhain an der Fabel";

function day(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
function at(offset: number, hour = 10) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}
function german(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function sampleDataLoaded() {
  try { return localStorage.getItem(SAMPLE_FLAG) === "geladen"; } catch { return false; }
}
export function sampleDataDeclined() {
  try { return localStorage.getItem(SAMPLE_FLAG) === "entfernt"; } catch { return false; }
}
export function markSampleDataRemoved() {
  try { localStorage.setItem(SAMPLE_FLAG, "entfernt"); } catch { /* optional */ }
}

type DocSpec = {
  key: string;
  fileName: string;
  title: string;
  dateOffset: number;
  lifeArea: string;
  documentType: string;
  privacy: "allgemein" | "vertraulich" | "besonders geschützt";
  category: string;
  from: string;
  to?: string;
  body: string;
  links: Array<{ to: string; relationType: string }>;
  status?: "hochgeladen" | "abgleich_offen" | "geprüft" | "eingearbeitet";
};

let runningSeed: Promise<boolean> | null = null;

/** Legt die Beispielfamilie in einem leeren Datentresor an. Bereits vorhandene Daten bleiben unberührt.
 *  Gleichzeitige Aufrufe (z. B. doppelter Seitenstart) teilen sich denselben Vorgang. */
export function seedSampleFamily(handle: FileSystemDirectoryHandle, options: { force?: boolean } = {}) {
  if (!runningSeed) runningSeed = seedOnce(handle, options).finally(() => { runningSeed = null; });
  return runningSeed;
}

async function seedOnce(handle: FileSystemDirectoryHandle, options: { force?: boolean }) {
  const existing = await readLocalVaultData(handle);
  if (!options.force && (existing.documents.length || existing.records.length)) return false;
  if (!options.force && (sampleDataLoaded() || sampleDataDeclined())) return false;

  const ids = new Map<string, string>();
  const records: FamilyRecordUnion[] = [];
  const relations: FamilyRelation[] = [];
  const typeOf = new Map<string, FamilyRecordType>();

  const record = async <T extends FamilyRecordType>(key: string, recordType: T, data: Parameters<typeof createLocalFamilyRecord<T>>[1]["data"], status = "aktiv", notes: string | null = null) => {
    const created = await createLocalFamilyRecord(handle, { recordType, data, status, source: SAMPLE_SOURCE, notes });
    ids.set(key, created.id); typeOf.set(key, recordType); records.push(created as FamilyRecordUnion);
    return created;
  };
  const link = async (from: string, to: string, relationType: string) => {
    const relation = await createLocalFamilyRelation(handle, {
      fromType: typeOf.get(from)!, fromId: ids.get(from)!, toType: typeOf.get(to)!, toId: ids.get(to)!,
      relationType, source: SAMPLE_SOURCE, notes: null,
    });
    relations.push(relation);
  };

  // ── Personen ─────────────────────────────────────────────────────────────
  await record("jonna", "person", { displayName: "Jonna Lindqvist-Arenberg", birthDate: "1988-04-17" }, "aktiv", "Mutter · arbeitet in Teilzeit (Beispiel)");
  await record("mattis", "person", { displayName: "Mattis Lindqvist-Arenberg", birthDate: "1986-11-02" }, "aktiv", "Vater (Beispiel)");
  await record("ella", "person", { displayName: "Ella Lindqvist-Arenberg", birthDate: "2016-08-21" }, "aktiv", "Tochter · 4. Klasse (Beispiel)");
  await record("fiete", "person", { displayName: "Fiete Lindqvist-Arenberg", birthDate: "2019-03-09" }, "aktiv", "Sohn · lernt Fahrradfahren (Beispiel)");
  await record("oma", "person", { displayName: "Gerlinde Arenberg", birthDate: "1954-06-30" }, "aktiv", "Großmutter · wohnt in Kieselbrunn am Traumbach (erfunden)");
  for (const child of ["ella", "fiete"]) { await link(child, "jonna", "Kind von"); await link(child, "mattis", "Kind von"); }
  await link("jonna", "oma", "Tochter von");

  // ── Organisationen / Kontaktstellen (Fantasienamen) ──────────────────────
  await record("vermieter", "organisation", { name: "Hausverwaltung Pustelblume (erfunden)", contactType: "Vermieter" });
  await record("arbeitgeber", "organisation", { name: "Arbeitgeber Wolkenwerk (erfunden)", contactType: "Arbeitgeber" });
  await record("elektrohaus", "organisation", { name: "Elektrohaus Funkenflug (erfunden)", contactType: "Händler" });
  await record("reparatur", "organisation", { name: "Reparaturdienst Schraubenglück (erfunden)", contactType: "Kundendienst" });
  await record("radladen", "organisation", { name: "Radstube Speichenwind (erfunden)", contactType: "Händler" });
  await record("schule", "organisation", { name: "Grundschule am Fabelteich (erfunden)", contactType: "Schule" });
  await record("versicherung", "organisation", { name: "Schirmchen Versicherungsverein (erfunden)", contactType: "Versicherung" });
  await record("krankenversicherung", "organisation", { name: "Krankenversicherung (Oberbegriff, Beispiel)", contactType: "Krankenversicherung" });
  await record("bank", "organisation", { name: "Sparschwein-Bank Wolkenhain (erfunden)", contactType: "Bank" });
  await record("buergerbuero", "organisation", { name: "Bürgerbüro Wolkenhain (erfunden)", contactType: "Amt" });
  await record("werkstatt", "organisation", { name: "Autowerkstatt Ölkännchen (erfunden)", contactType: "Werkstatt" });

  // ── Objekte ──────────────────────────────────────────────────────────────
  await record("wohnung", "object", { name: "Wohnung Pustelblumenweg 7, 2. OG links", objectType: "Mietwohnung" }, "aktiv", "00917 Wolkenhain an der Fabel – Ort, Straße und PLZ sind erfunden.");
  await record("waschmaschine", "object", { name: "Waschmaschine Schleuderling Waschwunder 7", objectType: "Haushaltsgerät" }, "aktiv", "Seriennummer: BSP-0000-XX (ungültig)");
  await record("auto", "object", { name: "Brummwerk Kombi 300", objectType: "Auto" }, "aktiv", "Kennzeichen: BSP-FA 0 (erfunden, ungültig)");
  await record("kinderrad", "object", { name: "Kinderrad Speichenwind Flitzer 20", objectType: "Fahrrad" }, "aktiv", "Rahmennummer: RN-00-BSP (ungültig)");
  await record("brille", "object", { name: "Brille Mattis (Beispiel)", objectType: "Brille" });
  await link("wohnung", "vermieter", "vermietet von");
  await link("auto", "mattis", "gehört zu");
  await link("kinderrad", "fiete", "gehört zu");
  await link("brille", "mattis", "gehört zu");
  await link("waschmaschine", "wohnung", "steht in");

  // ── Vorgänge (Beispielgeschichten) ───────────────────────────────────────
  await record("fall-waschmaschine", "case", { title: "Waschmaschine – Garantiefall", caseType: "Reparatur / Garantie" }, "offen", "Die Maschine pumpt nicht mehr ab. Garantieanfrage ist gestellt.");
  await record("fall-umzug", "case", { title: "Umzug nach Wolkenhain", caseType: "Wohnen" }, "erledigt", "Mietvertrag, Übergabe und Ummeldung sind abgeschlossen.");
  await record("fall-fahrrad", "case", { title: "Fahrradkauf für Fiete", caseType: "Kauf" }, "erledigt");
  await record("fall-nebenkosten", "case", { title: "Nebenkostenabrechnung 2025", caseType: "Wohnen / Zahlung" }, "offen", "Nachzahlung prüfen und fristgerecht überweisen.");
  await record("fall-ausflug", "case", { title: "Schulausflug Klasse 4 zum Wolkensee", caseType: "Schule" }, "offen", "Einverständniserklärung und Fahrtgeld fehlen noch.");
  await record("fall-teilzeit", "case", { title: "Teilzeitantrag Jonna", caseType: "Arbeit" }, "offen", "Antwort des Arbeitgebers steht aus.");
  await link("fall-waschmaschine", "waschmaschine", "betrifft");
  await link("fall-waschmaschine", "reparatur", "mit");
  await link("fall-umzug", "wohnung", "betrifft");
  await link("fall-umzug", "jonna", "betrifft");
  await link("fall-umzug", "mattis", "betrifft");
  await link("fall-fahrrad", "kinderrad", "betrifft");
  await link("fall-fahrrad", "fiete", "betrifft");
  await link("fall-nebenkosten", "wohnung", "betrifft");
  await link("fall-nebenkosten", "vermieter", "mit");
  await link("fall-ausflug", "ella", "betrifft");
  await link("fall-ausflug", "schule", "mit");
  await link("fall-teilzeit", "jonna", "betrifft");
  await link("fall-teilzeit", "arbeitgeber", "mit");

  // ── Verträge, Garantien, Zahlungen ───────────────────────────────────────
  await record("mietvertrag", "contract", { title: "Mietvertrag Pustelblumenweg 7", contractNumber: "MV-00-BSP-7", startsOn: day(-410) });
  await record("hausrat", "contract", { title: "Hausratversicherung", contractNumber: "VN-0000-BSP-1", startsOn: day(-400), endsOn: day(330) });
  await record("kfz-vers", "contract", { title: "Kfz-Versicherung Brummwerk Kombi 300", contractNumber: "KFZ-00X-BSP", startsOn: day(-700), endsOn: day(62) });
  await record("girokonto", "contract", { title: "Familienkonto", contractNumber: "KTO 00-00-BSP (ungültig)", startsOn: day(-2000) });
  await link("mietvertrag", "vermieter", "mit");
  await link("mietvertrag", "wohnung", "betrifft");
  await link("hausrat", "versicherung", "mit");
  await link("kfz-vers", "versicherung", "mit");
  await link("kfz-vers", "auto", "betrifft");
  await link("girokonto", "bank", "mit");
  await record("garantie-wm", "warranty", { title: "Herstellergarantie Waschmaschine", startsOn: day(-610), expiresOn: day(120) });
  await record("garantie-rad", "warranty", { title: "Gewährleistung Kinderrad", startsOn: day(-75), expiresOn: day(655) });
  await link("garantie-wm", "waschmaschine", "gilt für");
  await link("garantie-rad", "kinderrad", "gilt für");
  await record("pay-nebenkosten", "payment", { title: "Nachzahlung Nebenkosten 2025", amountCents: 8417, currency: "EUR" }, "offen");
  await record("pay-ausflug", "payment", { title: "Fahrtgeld Schulausflug", amountCents: 1200, currency: "EUR" }, "offen");
  await record("pay-rad", "payment", { title: "Kinderrad Speichenwind Flitzer 20", amountCents: 32900, currency: "EUR" }, "erledigt");
  await link("pay-nebenkosten", "fall-nebenkosten", "gehört zu");
  await link("pay-ausflug", "fall-ausflug", "gehört zu");
  await link("pay-rad", "fall-fahrrad", "gehört zu");

  // ── Dokumente (selbst erzeugte Beispiel-PDFs) ────────────────────────────
  const familyHead = `${SAMPLE_FAMILY_NAME} · ${SAMPLE_ADDRESS}`;
  const docs: DocSpec[] = [
    { key: "doc-wm-rechnung", fileName: "Rechnung_Waschmaschine_Waschwunder_7.pdf", title: "Rechnung Waschmaschine Schleuderling Waschwunder 7", dateOffset: -610, lifeArea: "Einkäufe, Rechnungen & Garantien", documentType: "Rechnung / Garantie", privacy: "allgemein", category: "Kauf / Rechnung", from: "Elektrohaus Funkenflug (erfunden) · Funkenstraße 0 · 00917 Wolkenhain", to: familyHead.replace(" · ", "\n"), body: "Rechnungsnummer: RE-BSP-00X\n\n1 × Waschmaschine Schleuderling Waschwunder 7 (Fantasiemodell) – 549,00 €\n1 × Lieferung und Anschluss – 39,00 €\n\nGesamtbetrag: 588,00 € – bezahlt per Karte.\n\nHerstellergarantie: 2 Jahre ab Kaufdatum. Bitte diese Rechnung für einen Garantiefall aufbewahren.", links: [{ to: "fall-waschmaschine", relationType: "gehört zu" }, { to: "waschmaschine", relationType: "betrifft" }, { to: "elektrohaus", relationType: "von" }], status: "eingearbeitet" },
    { key: "doc-wm-anfrage", fileName: "Garantieanfrage_Waschmaschine_Pumpe.pdf", title: "Garantieanfrage – Waschmaschine pumpt nicht mehr ab", dateOffset: -9, lifeArea: "Technik, Geräte & Reparaturen", documentType: "Korrespondenz", privacy: "allgemein", category: "Garantie / Reparatur", from: familyHead, to: "Reparaturdienst Schraubenglück (erfunden)\nSchraubgasse 0\n00917 Wolkenhain an der Fabel", body: "Sehr geehrte Damen und Herren,\n\nunsere Waschmaschine Schleuderling Waschwunder 7 pumpt seit einigen Tagen das Wasser nicht mehr ab. Das Gerät ist noch in der Garantiezeit; die Rechnung liegt bei.\n\nBitte teilen Sie uns mit, wann ein Termin für die Reparatur möglich ist.\n\nMit freundlichen Grüßen\nJonna Lindqvist-Arenberg", links: [{ to: "fall-waschmaschine", relationType: "gehört zu" }, { to: "reparatur", relationType: "an" }], status: "geprüft" },
    { key: "doc-wm-auftrag", fileName: "Reparaturauftrag_Schraubenglueck.pdf", title: "Reparaturauftrag Waschmaschine – Terminbestätigung", dateOffset: -2, lifeArea: "Technik, Geräte & Reparaturen", documentType: "Rechnung / Garantie", privacy: "allgemein", category: "Garantie / Reparatur", from: "Reparaturdienst Schraubenglück (erfunden)", to: familyHead.replace(" · ", "\n"), body: `Auftragsnummer: AU-0-BSP\n\nWir bestätigen den Reparaturtermin am ${german(day(5))} zwischen 8 und 12 Uhr. Die Reparatur ist als Garantiefall vorgemerkt.\n\nBitte halten Sie die Rechnung bereit.`, links: [{ to: "fall-waschmaschine", relationType: "gehört zu" }, { to: "reparatur", relationType: "von" }] },
    { key: "doc-mietvertrag", fileName: "Mietvertrag_Pustelblumenweg_7.pdf", title: "Mietvertrag Wohnung Pustelblumenweg 7", dateOffset: -430, lifeArea: "Haus & Wohnung", documentType: "Vertrag", privacy: "vertraulich", category: "Haus / Wohnung / Vermieter", from: "Hausverwaltung Pustelblume (erfunden)", to: familyHead.replace(" · ", "\n"), body: "Mietobjekt: 3-Zimmer-Wohnung, 2. OG links, Pustelblumenweg 7, 00917 Wolkenhain an der Fabel (erfunden).\n\nMietbeginn: wie vereinbart. Kaltmiete und Vorauszahlungen siehe Anlage (Beispielwerte).\nKaution: drei Monatsmieten.\n\nAlle Angaben in diesem Dokument sind frei erfunden.", links: [{ to: "fall-umzug", relationType: "gehört zu" }, { to: "mietvertrag", relationType: "belegt" }, { to: "wohnung", relationType: "betrifft" }], status: "eingearbeitet" },
    { key: "doc-uebergabe", fileName: "Uebergabeprotokoll_Wohnung.pdf", title: "Übergabeprotokoll Wohnung", dateOffset: -402, lifeArea: "Haus & Wohnung", documentType: "Haus- oder Wohnungsunterlage", privacy: "allgemein", category: "Haus / Wohnung / Vermieter", from: "Hausverwaltung Pustelblume (erfunden)", body: "Übergabe der Wohnung mit 3 Schlüsseln für Haustür und Wohnung, 1 Briefkastenschlüssel.\n\nZählerstände (Beispielwerte): Strom 00000,0 · Wasser 000,00 · Heizung 0000.\n\nKleiner Kratzer im Flurboden vermerkt.", links: [{ to: "fall-umzug", relationType: "gehört zu" }, { to: "wohnung", relationType: "betrifft" }], status: "eingearbeitet" },
    { key: "doc-ummeldung", fileName: "Ummeldung_Buergerbuero_Wolkenhain.pdf", title: "Bestätigung der Ummeldung", dateOffset: -395, lifeArea: "Steuern & Behörden", documentType: "Finanz- oder Behördenunterlage", privacy: "vertraulich", category: "Behörden / Anträge", from: "Bürgerbüro Wolkenhain (erfunden)", to: familyHead.replace(" · ", "\n"), body: "Hiermit wird die Anmeldung der vier Familienmitglieder unter der neuen Anschrift bestätigt.\n\nVorgangsnummer: UM-BSP-0 (erfunden)", links: [{ to: "buergerbuero", relationType: "von" }], status: "eingearbeitet" },
    { key: "doc-nebenkosten", fileName: "Nebenkostenabrechnung_2025.pdf", title: "Nebenkostenabrechnung 2025", dateOffset: -12, lifeArea: "Haus & Wohnung", documentType: "Haus- oder Wohnungsunterlage", privacy: "vertraulich", category: "Nebenkosten / Reparatur", from: "Hausverwaltung Pustelblume (erfunden)", to: familyHead.replace(" · ", "\n"), body: `Abrechnungszeitraum: 01.01.2025 bis 31.12.2025\n\nHeizung und Warmwasser: 1.012,40 €\nWasser und Abwasser: 318,77 €\nMüll, Hausreinigung, Gartenpflege: 412,–  €\n\nSumme Kosten: 1.743,17 €\nGeleistete Vorauszahlungen: 1.659,00 €\n\nNachzahlung: 84,17 € – bitte bis ${german(day(16))} überweisen.`, links: [{ to: "fall-nebenkosten", relationType: "gehört zu" }, { to: "vermieter", relationType: "von" }] },
    { key: "doc-rad", fileName: "Kaufbeleg_Kinderrad_Flitzer_20.pdf", title: "Kaufbeleg Kinderrad Speichenwind Flitzer 20", dateOffset: -75, lifeArea: "Einkäufe, Rechnungen & Garantien", documentType: "Rechnung / Garantie", privacy: "allgemein", category: "Kauf / Rechnung", from: "Radstube Speichenwind (erfunden)", to: familyHead.replace(" · ", "\n"), body: "Belegnummer: KB-00-BSP\n\n1 × Kinderrad Speichenwind Flitzer 20 Zoll, Farbe Himmelblau – 299,00 €\n1 × Fahrradhelm Größe S – 30,00 €\n\nSumme: 329,00 € – bar bezahlt.\nErste Inspektion kostenlos nach 6 Wochen.", links: [{ to: "fall-fahrrad", relationType: "gehört zu" }, { to: "kinderrad", relationType: "betrifft" }, { to: "radladen", relationType: "von" }], status: "eingearbeitet" },
    { key: "doc-elternbrief", fileName: "Elternbrief_Schulausflug_Wolkensee.pdf", title: "Elternbrief: Schulausflug zum Wolkensee", dateOffset: -6, lifeArea: "Familie & persönliche Dokumente", documentType: "Korrespondenz", privacy: "allgemein", category: "Familie / Personenakte", from: "Grundschule am Fabelteich (erfunden) · Klasse 4b", to: "An die Eltern der Klasse 4b", body: `Liebe Eltern,\n\nam ${german(day(12))} fahren wir mit der Klasse zum Wolkensee (erfunden). Wir erkunden den Uferpfad und machen ein Picknick.\n\nBitte geben Sie die unterschriebene Einverständniserklärung bis ${german(day(1))} ab und geben Sie Ihrem Kind 12 € Fahrtgeld mit.\n\nViele Grüße\nIhr Klassenteam`, links: [{ to: "fall-ausflug", relationType: "gehört zu" }, { to: "ella", relationType: "betrifft" }, { to: "schule", relationType: "von" }] },
    { key: "doc-impfpass", fileName: "Impfpass_Ella_Kopie.pdf", title: "Impfpass Ella – Kopie (Beispiel)", dateOffset: -200, lifeArea: "Gesundheit & Pflege", documentType: "Gesundheitsunterlage", privacy: "besonders geschützt", category: "Gesundheit / eigene Notiz", from: familyHead, body: "Kopie des Impfpasses als Erinnerungshilfe.\n\nLetzter Eintrag: Auffrischung im Beispieljahr.\nNächste Auffrischung: im Familienkalender vorgemerkt.\n\nKeine medizinischen Angaben – reines Beispiel.", links: [{ to: "ella", relationType: "betrifft" }], status: "eingearbeitet" },
    { key: "doc-brille", fileName: "Beleg_Brille_Mattis.pdf", title: "Beleg neue Brille Mattis", dateOffset: -140, lifeArea: "Gesundheit & Pflege", documentType: "Rechnung / Garantie", privacy: "besonders geschützt", category: "Gesundheit / eigene Notiz", from: familyHead, body: "Neue Brille mit leichtem Gestell, Farbe Dunkelblau.\n\nBetrag: 180,00 € (Beispielwert).\nZuschuss der Krankenversicherung: angefragt.", links: [{ to: "brille", relationType: "betrifft" }, { to: "mattis", relationType: "betrifft" }], status: "eingearbeitet" },
    { key: "doc-gehalt", fileName: "Gehaltsabrechnung_Jonna.pdf", title: "Gehaltsabrechnung Jonna (Beispiel)", dateOffset: -27, lifeArea: "Rente, Arbeit & Sozialversicherung", documentType: "Arbeit / Rente / Sozialversicherung", privacy: "vertraulich", category: "Arbeitgeber / Arbeitszeit", from: "Arbeitgeber Wolkenwerk (erfunden)", to: "Jonna Lindqvist-Arenberg", body: "Personalnummer: P-0-BSP\n\nAlle Beträge auf dieser Abrechnung sind frei erfunden und dienen nur der Vorführung.", links: [{ to: "jonna", relationType: "betrifft" }, { to: "arbeitgeber", relationType: "von" }], status: "eingearbeitet" },
    { key: "doc-teilzeit", fileName: "Antrag_Teilzeit_Jonna.pdf", title: "Antrag auf Teilzeit – vier Arbeitstage pro Woche", dateOffset: -20, lifeArea: "Rente, Arbeit & Sozialversicherung", documentType: "Korrespondenz", privacy: "vertraulich", category: "Arbeitgeber / Arbeitszeit", from: "Jonna Lindqvist-Arenberg", to: "Arbeitgeber Wolkenwerk (erfunden)\nPersonalabteilung", body: "Sehr geehrte Damen und Herren,\n\nhiermit beantrage ich, meine Arbeitszeit ab dem nächsten Quartal auf vier Arbeitstage pro Woche zu verringern.\n\nÜber eine kurze Rückmeldung freue ich mich.\n\nMit freundlichen Grüßen\nJonna Lindqvist-Arenberg", links: [{ to: "fall-teilzeit", relationType: "gehört zu" }, { to: "arbeitgeber", relationType: "an" }], status: "geprüft" },
    { key: "doc-hausrat", fileName: "Versicherungsschein_Hausrat.pdf", title: "Versicherungsschein Hausratversicherung", dateOffset: -400, lifeArea: "Versicherungen", documentType: "Versicherungsunterlage", privacy: "vertraulich", category: "Versicherung", from: "Schirmchen Versicherungsverein (erfunden)", to: familyHead.replace(" · ", "\n"), body: "Versicherungsnummer: VN-0000-BSP-1 (ungültig)\nVersicherungsort: Pustelblumenweg 7, 00917 Wolkenhain an der Fabel (erfunden)\n\nJahresbeitrag: 96,00 € (Beispielwert). Kündigung mit drei Monaten Frist zum Ablauf.", links: [{ to: "hausrat", relationType: "belegt" }, { to: "versicherung", relationType: "von" }], status: "eingearbeitet" },
    { key: "doc-auto", fileName: "Fahrzeugschein_Brummwerk_Kombi_300.pdf", title: "Fahrzeugschein Brummwerk Kombi 300 (Beispiel)", dateOffset: -700, lifeArea: "Auto & Mobilität", documentType: "Fahrzeugunterlage", privacy: "vertraulich", category: "Fahrzeugpapiere", from: familyHead, body: "Hersteller: Brummwerk (erfunden)\nModell: Kombi 300 (erfunden)\nKennzeichen: BSP-FA 0 (ungültig)\nFahrzeug-Ident-Nr.: FIN-000-BSP (ungültig)\n\nNächste Hauptuntersuchung: siehe Fristen.", links: [{ to: "auto", relationType: "betrifft" }, { to: "mattis", relationType: "betrifft" }], status: "eingearbeitet" },
    { key: "doc-kontoauszug", fileName: "Kontoauszug_Familienkonto.pdf", title: "Kontoauszug Familienkonto (Beispiel)", dateOffset: -15, lifeArea: "Finanzen & Konten", documentType: "Finanz- oder Behördenunterlage", privacy: "vertraulich", category: "Sonstiges", from: "Sparschwein-Bank Wolkenhain (erfunden)", to: familyHead.replace(" · ", "\n"), body: "Konto: KTO 00-00-BSP (ungültig)\n\nMiete Pustelblumenweg 7 ........ −  (Beispiel)\nGehalt Wolkenwerk ............. +  (Beispiel)\nRadstube Speichenwind ......... −  329,00 €\n\nAlle Buchungen sind frei erfunden.", links: [{ to: "girokonto", relationType: "belegt" }, { to: "bank", relationType: "von" }] },
  ];
  for (const spec of docs) {
    const date = day(spec.dateOffset);
    const pdf = createSamplePdf({ sender: spec.from, recipient: spec.to, place: `Wolkenhain, ${german(date)}`, title: spec.title, body: spec.body });
    const file = new File([pdf], spec.fileName, { type: "application/pdf", lastModified: at(spec.dateOffset).getTime() });
    // Die Lebensbereiche „Familie & persönliche Dokumente“ und „Rente, Arbeit & Sozialversicherung“ würden von
    // der Schutzlogik wie Gesundheitsunterlagen verborgen (Schulpost, Teilzeitantrag) – dort genügt die Kategorie.
    const lifeAreaTag = ["Familie & persönliche Dokumente", "Rente, Arbeit & Sozialversicherung"].includes(spec.lifeArea) ? [] : [`FaWoGa: ${spec.lifeArea}`];
    const notes = [`${SAMPLE_SOURCE}: ${spec.title}`, ...lifeAreaTag, `Dokumentart: ${spec.documentType}`, `Datenschutz: ${spec.privacy}`, "Eingang: Dateiauswahl", "Intelligenter Vorschlag übernommen"].join(" · ");
    const saved = await saveLocalDocument(handle, file, {
      category: spec.category, documentDate: date, notes, allowDuplicate: true,
      assignmentLinks: spec.links.map((item) => ({ toType: typeOf.get(item.to)!, toId: ids.get(item.to)!, relationType: item.relationType })),
    });
    ids.set(spec.key, saved.id); typeOf.set(spec.key, "document");
    if (spec.status) await updateLocalStatus(handle, saved.id, spec.status);
  }

  // ── Fristen und Aufgaben ─────────────────────────────────────────────────
  type Ref = { recordType: FamilyRecordType; id: string; relationType: string };
  const refs = (...keys: string[]): Ref[] => keys.map((key) => ({ recordType: typeOf.get(key)!, id: ids.get(key)!, relationType: "betrifft" }));
  const schedules: Array<{ type: "deadline" | "task"; title: string; due: number; remind?: number; notes?: string; refs: string[] }> = [
    { type: "deadline", title: "Einverständniserklärung Schulausflug abgeben", due: 1, remind: 0, notes: "Unterschrieben in Ellas Postmappe legen.", refs: ["fall-ausflug", "ella", "doc-elternbrief"] },
    { type: "task", title: "12 € Fahrtgeld für den Schulausflug mitgeben", due: 11, remind: 10, refs: ["fall-ausflug", "pay-ausflug"] },
    { type: "task", title: "Zählerstände an die Hausverwaltung melden", due: -2, notes: "Fotos der Zähler machen und per E-Mail schicken.", refs: ["wohnung", "vermieter"] },
    { type: "deadline", title: "Nachzahlung Nebenkosten 84,17 € überweisen", due: 16, remind: 12, refs: ["fall-nebenkosten", "doc-nebenkosten", "pay-nebenkosten"] },
    { type: "task", title: "Nebenkostenabrechnung mit Vorjahr vergleichen", due: 6, refs: ["fall-nebenkosten", "doc-nebenkosten"] },
    { type: "task", title: "Reparaturtermin Waschmaschine – jemand muss zu Hause sein", due: 5, remind: 4, refs: ["fall-waschmaschine", "doc-wm-auftrag"] },
    { type: "deadline", title: "Garantie Waschmaschine läuft ab", due: 120, remind: 90, refs: ["garantie-wm", "waschmaschine"] },
    { type: "task", title: "Vorsorgetermin für Ella vereinbaren", due: 14, refs: ["ella"] },
    { type: "task", title: "Impfpass von Fiete auf nächste Auffrischung prüfen", due: 30, refs: ["fiete"] },
    { type: "deadline", title: "Prüftermin Brummwerk Kombi 300 fällig", due: 48, remind: 30, notes: "Termin bei der Autowerkstatt Ölkännchen (erfunden) ausmachen.", refs: ["auto", "werkstatt"] },
    { type: "deadline", title: "Kfz-Versicherung – Kündigungsfrist prüfen", due: 32, refs: ["kfz-vers"] },
    { type: "task", title: "Beim Arbeitgeber wegen Teilzeit nachfragen", due: 3, refs: ["fall-teilzeit", "arbeitgeber"] },
    { type: "task", title: "Fahrradhelm von Fiete nachstellen lassen", due: 21, refs: ["kinderrad", "fiete"] },
    { type: "task", title: "Geburtstagsgeschenk für Oma Gerlinde besorgen", due: 25, refs: ["oma"] },
  ];
  for (const item of schedules) {
    await createLocalScheduleBundle(handle, {
      recordType: item.type, title: item.title, dueAt: day(item.due), reminderAt: item.remind === undefined ? null : day(item.remind),
      source: SAMPLE_SOURCE, notes: item.notes || null, references: refs(...item.refs),
    });
  }

  // ── Tagebuch & Erinnerungen ──────────────────────────────────────────────
  const latest = await readLocalVaultData(handle);
  const memories: Array<{ text: string; offset: number; refs: string[] }> = [
    { text: "Fiete ist heute zum ersten Mal ohne Stützräder mit dem neuen Kinderrad gefahren – einmal um den ganzen Pustelblumenweg!", offset: -60, refs: ["fiete", "kinderrad", "fall-fahrrad"] },
    { text: "Die Waschmaschine pumpt das Wasser nicht mehr ab. Am Display blinkt ein Lämpchen. Garantieanfrage an den Reparaturdienst Schraubenglück geschickt.", offset: -9, refs: ["waschmaschine", "fall-waschmaschine"] },
    { text: "Erster Abend in der neuen Wohnung in Wolkenhain. Die Kisten stehen noch überall, aber Ella hat ihr Zimmer schon eingerichtet.", offset: -401, refs: ["fall-umzug", "ella"] },
    { text: "Ella freut sich sehr auf den Schulausflug zum Wolkensee. Elternbrief ist angekommen, Einverständniserklärung noch unterschreiben.", offset: -6, refs: ["ella", "fall-ausflug"] },
    { text: "Nebenkostenabrechnung 2025 ist gekommen: 84,17 € Nachzahlung. Wasser ist teurer als im Vorjahr – nachrechnen.", offset: -12, refs: ["fall-nebenkosten", "wohnung"] },
  ];
  for (const memory of memories) {
    const analysis = buildMemoryAnalysis({ originalText: memory.text, captureType: "text", records: latest.records, relations: latest.relations, now: at(memory.offset, 19) });
    await createLocalMemoryBundle(handle, {
      originalText: memory.text, captureType: "text", analysis: { ...analysis, sensitive: false }, mediaFiles: [],
      selectedReferences: memory.refs.map((key) => ({ recordType: typeOf.get(key) as "person" | "organisation" | "object" | "case" | "document", id: ids.get(key)! })),
    });
  }

  // ── Korrespondenz (Entwürfe und versendete Schreiben) ────────────────────
  const letters: Array<{ status: "Entwurf" | "Versendet" | "Antwort ausstehend" | "Erledigt"; kind: string; recipient: string; subject: string; body: string; offset: number; caseKey: string; docs: string[] }> = [
    { status: "Antwort ausstehend", kind: "Reklamation", recipient: "Reparaturdienst Schraubenglück (erfunden)", subject: "Garantiefall Waschmaschine Schleuderling Waschwunder 7", body: "Sehr geehrte Damen und Herren,\n\nunsere Waschmaschine pumpt das Wasser nicht mehr ab. Das Gerät ist noch in der Garantiezeit, die Rechnung hängt an.\n\nMit freundlichen Grüßen\nJonna Lindqvist-Arenberg", offset: -9, caseKey: "fall-waschmaschine", docs: ["doc-wm-anfrage", "doc-wm-rechnung"] },
    { status: "Entwurf", kind: "Anfrage", recipient: "Hausverwaltung Pustelblume (erfunden)", subject: "Nebenkostenabrechnung 2025 – Bitte um Belegeinsicht", body: "Sehr geehrte Damen und Herren,\n\nvielen Dank für die Nebenkostenabrechnung 2025. Die Wasserkosten sind deutlich gestiegen. Bitte teilen Sie mir mit, wann ich die Belege einsehen kann.\n\nMit freundlichen Grüßen\nMattis Lindqvist-Arenberg", offset: -1, caseKey: "fall-nebenkosten", docs: ["doc-nebenkosten"] },
    { status: "Antwort ausstehend", kind: "Brief", recipient: "Arbeitgeber Wolkenwerk (erfunden)", subject: "Antrag auf Teilzeit", body: "Sehr geehrte Damen und Herren,\n\nhiermit beantrage ich, meine Arbeitszeit auf vier Arbeitstage pro Woche zu verringern.\n\nMit freundlichen Grüßen\nJonna Lindqvist-Arenberg", offset: -20, caseKey: "fall-teilzeit", docs: ["doc-teilzeit"] },
  ];
  for (const letter of letters) {
    const sentAt = letter.status === "Entwurf" ? undefined : at(letter.offset).toISOString();
    await createLocalCorrespondenceBundle(handle, {
      status: letter.status, caseId: ids.get(letter.caseKey), documentIds: letter.docs.map((key) => ids.get(key)!),
      data: {
        title: letter.subject, eventAt: sentAt || at(letter.offset).toISOString(), entryKind: "correspondence",
        recipient: letter.recipient, subject: letter.subject, body: letter.body, correspondenceType: letter.kind,
        correspondenceStatus: letter.status, sentAt, caseReference: ids.get(letter.caseKey),
        attachmentDocumentIds: letter.docs.map((key) => ids.get(key)!), sourceDocumentIds: letter.docs.map((key) => ids.get(key)!),
        researchStatus: "not_configured", researchSources: [],
      },
    });
  }

  // Alle Kennungen merken, damit die Beispieldaten später mit einem Klick entfernt werden können.
  const seeded = await readLocalVaultData(handle);
  const sampleIds = [
    ...seeded.documents.map((item) => item.id), ...seeded.records.map((item) => item.id),
    ...seeded.relations.map((item) => item.id), ...seeded.memoryDrafts.map((item) => item.id),
  ];
  try { localStorage.setItem(SAMPLE_IDS, JSON.stringify(sampleIds)); localStorage.setItem(SAMPLE_FLAG, "geladen"); } catch { /* optional */ }
  void records; void relations;
  return true;
}

/** Entfernt nur die Beispieldaten – eigene Unterlagen und Einträge bleiben erhalten. */
export async function removeSampleFamily(handle: FileSystemDirectoryHandle) {
  let stored: string[] = [];
  try { stored = JSON.parse(localStorage.getItem(SAMPLE_IDS) || "[]") as string[]; } catch { stored = []; }
  const ids = new Set(stored);
  // Zusätzlich alles, was eindeutig als Beispiel gekennzeichnet ist (z. B. nach einer Wiederherstellung).
  const data = await readLocalVaultData(handle);
  for (const item of data.documents) if (item.notes?.startsWith(SAMPLE_SOURCE)) ids.add(item.id);
  for (const item of data.records) if (item.source === SAMPLE_SOURCE) ids.add(item.id);
  const result = await removeVaultEntries(handle, ids);
  markSampleDataRemoved();
  try { localStorage.removeItem(SAMPLE_IDS); } catch { /* optional */ }
  return result;
}

export function sampleDataPresent(data: { documents: Array<{ notes: string | null }>; records: Array<{ source: string | null }> }) {
  return data.documents.some((item) => item.notes?.startsWith(SAMPLE_SOURCE)) || data.records.some((item) => item.source === SAMPLE_SOURCE);
}
