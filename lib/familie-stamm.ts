// Punkt 8 der Neugestaltung 2.28.39: Personen, Organisationen, Objekte und Vorgänge selbst anlegen und ändern.
// Die Kennnummer (PER-000001 …) bleibt intern für Verknüpfungen; sichtbar ist überall der Name.
import { recordTypeDefinitions, type FamilyRecordPayloadMap, type FamilyRecordUnion } from "./family-data-model.ts";

export const STAMM_ARTEN = ["person", "organisation", "object", "case"] as const;
export type StammArt = (typeof STAMM_ARTEN)[number];
export type StammAngaben = { name: string; art: string; notiz: string };

export const STAMM_BESCHRIFTUNG: Record<StammArt, { knopf: string; einzahl: string; art: string; beispielName: string; beispielArt: string }> = {
  person: { knopf: "Person", einzahl: "Person", art: "Rolle", beispielName: "z. B. Gerda Beispiel", beispielArt: "z. B. Mutter, Ich selbst, Kind" },
  organisation: { knopf: "Organisation", einzahl: "Organisation", art: "Art", beispielName: "z. B. Hausarzt Dr. Beispiel", beispielArt: "z. B. Arztpraxis, Versicherung, Bank" },
  object: { knopf: "Objekt (Auto, Gerät …)", einzahl: "Objekt", art: "Art", beispielName: "z. B. Familienauto", beispielArt: "z. B. Auto, Waschmaschine, Wohnung" },
  case: { knopf: "Vorgang", einzahl: "Vorgang", art: "Art", beispielName: "z. B. Reparatur Waschmaschine", beispielArt: "z. B. Reklamation, Antrag" },
};

export const istStammArt = (wert: string): wert is StammArt => (STAMM_ARTEN as readonly string[]).includes(wert);

const sauber = (wert: string) => wert.replace(/\s+/g, " ").trim();

/** Name und Art eines Stammeintrags lesen – unabhängig davon, unter welchem Feld die Art gespeichert ist. */
export function stammLesen(record: FamilyRecordUnion): StammAngaben {
  const d = (record.data || {}) as Record<string, unknown>;
  const text = (wert: unknown) => (typeof wert === "string" ? wert : "");
  const name = record.recordType === "person" ? text(d.displayName) : record.recordType === "case" ? text(d.title) : text(d.name);
  const art = record.recordType === "person" ? text(d.rolle) : record.recordType === "organisation" ? text(d.contactType) : record.recordType === "object" ? text(d.objectType) : text(d.caseType);
  return { name, art, notiz: record.notes || "" };
}

/** Die Felder, die ins Register geschrieben werden. Vorhandene andere Angaben (z. B. Anschrift) bleiben erhalten. */
export function stammDaten<T extends StammArt>(typ: T, angaben: StammAngaben, vorher: Record<string, unknown> = {}): FamilyRecordPayloadMap[T] {
  const name = sauber(angaben.name); const art = sauber(angaben.art);
  const feld = typ === "person" ? ["displayName", "rolle"] : typ === "case" ? ["title", "caseType"] : typ === "organisation" ? ["name", "contactType"] : ["name", "objectType"];
  const daten: Record<string, unknown> = { ...vorher, [feld[0]]: name };
  if (art) daten[feld[1]] = art; else delete daten[feld[1]];
  return daten as FamilyRecordPayloadMap[T];
}

/** Prüft die Eingabe; gibt verständliche Meldungen zurück (leer = in Ordnung). */
export function stammPruefen(typ: StammArt, angaben: StammAngaben, vorhandene: FamilyRecordUnion[], eigeneId?: string): string[] {
  const fehler: string[] = [];
  const name = sauber(angaben.name);
  if (!name) fehler.push("Bitte einen Namen eingeben.");
  else if (name.length > 120) fehler.push("Der Name ist zu lang (höchstens 120 Zeichen).");
  if (sauber(angaben.art).length > 80) fehler.push("Die Art ist zu lang (höchstens 80 Zeichen).");
  if (angaben.notiz.length > 2000) fehler.push("Die Notiz ist zu lang (höchstens 2000 Zeichen).");
  const gleich = name && vorhandene.find((r) => r.recordType === typ && r.id !== eigeneId && r.status !== "archiviert" && sauber(stammLesen(r).name).toLocaleLowerCase("de") === name.toLocaleLowerCase("de"));
  if (gleich) fehler.push(`${STAMM_BESCHRIFTUNG[typ].einzahl} „${name}“ gibt es schon.`);
  return fehler;
}

export const stammTypLabel = (typ: StammArt) => recordTypeDefinitions[typ].label;

export function runFamilieStammSelfTests() {
  const r: Array<{ label: string; passed: boolean; summary: string }> = [];
  const rec = (id: string, recordType: StammArt, data: Record<string, unknown>, status = "aktiv") => ({ id, recordType, createdAt: "", updatedAt: "", status, source: null, notes: null, data }) as unknown as FamilyRecordUnion;
  const d = stammDaten("person", { name: "  Gerda   Beispiel ", art: "Mutter", notiz: "" }, { city: "Wolkenhain" });
  r.push({ label: "Person: Name, Rolle, Anschrift bleibt", passed: (d as Record<string, unknown>).displayName === "Gerda Beispiel" && (d as Record<string, unknown>).rolle === "Mutter" && (d as Record<string, unknown>).city === "Wolkenhain", summary: JSON.stringify(d) });
  const o = stammDaten("object", { name: "Auto", art: "", notiz: "" }, { name: "Alt", objectType: "Fahrzeug" });
  r.push({ label: "Objekt: leere Art entfernt das Feld", passed: (o as Record<string, unknown>).name === "Auto" && !("objectType" in (o as object)), summary: JSON.stringify(o) });
  const liste = [rec("ORG-000001", "organisation", { name: "Sparkasse Muster" }), rec("ORG-000002", "organisation", { name: "Alte Bank" }, "archiviert")];
  r.push({ label: "Doppelter Name wird gemeldet", passed: stammPruefen("organisation", { name: "sparkasse  muster", art: "", notiz: "" }, liste).length === 1, summary: "gleicher Name" });
  r.push({ label: "Eigener Eintrag und Archiviertes zählen nicht als doppelt", passed: stammPruefen("organisation", { name: "Sparkasse Muster", art: "", notiz: "" }, liste, "ORG-000001").length === 0 && stammPruefen("organisation", { name: "Alte Bank", art: "", notiz: "" }, liste).length === 0, summary: "ok" });
  r.push({ label: "Leerer Name wird abgewiesen", passed: stammPruefen("case", { name: "  ", art: "", notiz: "" }, []).length === 1, summary: "leer" });
  r.push({ label: "Lesen: Vorgang Titel und Art", passed: JSON.stringify(stammLesen(rec("VORG-000001", "case", { title: "Reparatur", caseType: "Reklamation" }))) === JSON.stringify({ name: "Reparatur", art: "Reklamation", notiz: "" }), summary: "lesen" });
  return r;
}
