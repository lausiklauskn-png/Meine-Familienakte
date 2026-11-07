/** P7 (Plan 07.11., Punkt 3; Klaus 07.11.): Es gibt eine Demo. Sind eigene Daten da, arbeitet sie an einer Kopie davon;
 *  das Original bleibt unverändert. Ohne eigene Daten nimmt sie die Beispielfamilie. Vor einem Übernehmen zeigt die App die
 *  Liste „Was ändert sich?“ (Frage g). Hier die reinen Regeln, ohne Dateizugriff. */
export const DEMO_PRAEFIX = "Familienakte-Demo-v1:";
/** Merker im Demo-Bereich: woher der Demo-Bestand stammt. */
export const DEMO_QUELLE_SCHLUESSEL = `${DEMO_PRAEFIX}demo-quelle`;
export type DemoQuelle = { art: "kopie" | "beispiel"; zeit: string; revision?: number; dokumente?: number; eintraege?: number; proVerweise?: number };

type Doc = { id: string; originalName?: string; notes?: string | null; updatedAt?: string | null } & Record<string, unknown>;
type Rec = { id: string; recordType?: string; source?: string | null; data?: Record<string, unknown> } & Record<string, unknown>;
type Rel = { id: string } & Record<string, unknown>;
export type Bestand = { documents: Doc[]; records: Rec[]; relations: Rel[] };
export type Aenderung = { art: "neu" | "geaendert" | "entfernt"; bereich: "Dokument" | "Eintrag" | "Verknüpfung"; titel: string; kalender: boolean };

const BEISPIEL = "Beispieldaten";
/** Eigene Daten = alles, was nicht aus der erfundenen Beispielfamilie stammt. */
export function eigeneDatenDa(b: Bestand) {
  return b.documents.some((d) => !String(d.notes || "").startsWith(BEISPIEL)) || b.records.some((r) => !String(r.source || "").startsWith(BEISPIEL));
}

const RECORD_ART: Record<string, string> = { person: "Person", organisation: "Organisation", object: "Objekt", case: "Vorgang", deadline: "Frist", task: "Aufgabe", memory: "Memory", note: "Notiz" };
export function eintragTitel(r: Rec) {
  const d = r.data || {};
  const name = [d.title, d.name, d.fullName, d.displayName, d.label, d.text].find((x) => typeof x === "string" && x.trim()) as string | undefined;
  return `${RECORD_ART[r.recordType || ""] || r.recordType || "Eintrag"}: ${(name || r.id).slice(0, 80)}`;
}
const imKalender = (r: Rec) => r.recordType === "deadline" || r.data?.kalenderEintragen === true || !!r.data?.kalender;
const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function wasAendertSich(alt: Bestand, neu: Bestand) {
  const liste: Aenderung[] = [];
  const vergleiche = <T extends { id: string }>(a: T[], b: T[], bereich: Aenderung["bereich"], titel: (x: T) => string, kal: (x: T) => boolean) => {
    const altMap = new Map(a.map((x) => [x.id, x])), neuMap = new Map(b.map((x) => [x.id, x]));
    for (const x of b) { const vorher = altMap.get(x.id); if (!vorher) liste.push({ art: "neu", bereich, titel: titel(x), kalender: kal(x) }); else if (!gleich(vorher, x)) liste.push({ art: "geaendert", bereich, titel: titel(x), kalender: kal(x) || kal(vorher) }); }
    for (const x of a) if (!neuMap.has(x.id)) liste.push({ art: "entfernt", bereich, titel: titel(x), kalender: kal(x) });
  };
  vergleiche(alt.documents, neu.documents, "Dokument", (d) => `Dokument: ${d.originalName || d.id}`, () => false);
  vergleiche(alt.records, neu.records, "Eintrag", eintragTitel, imKalender);
  vergleiche(alt.relations, neu.relations, "Verknüpfung", () => "Verknüpfung", () => false);
  const reihenfolge = { entfernt: 0, geaendert: 1, neu: 2 } as const;
  liste.sort((x, y) => reihenfolge[x.art] - reihenfolge[y.art] || x.titel.localeCompare(y.titel, "de"));
  const zaehlung = { neu: liste.filter((x) => x.art === "neu").length, geaendert: liste.filter((x) => x.art === "geaendert").length, entfernt: liste.filter((x) => x.art === "entfernt").length };
  return { liste, zaehlung, kalender: liste.filter((x) => x.kalender && x.art !== "neu").length };
}

export function demoQuelleLesen(speicher: Pick<Storage, "getItem"> | null): DemoQuelle | null {
  try { const w = JSON.parse(speicher?.getItem(DEMO_QUELLE_SCHLUESSEL) || "null"); return w && (w.art === "kopie" || w.art === "beispiel") ? w : null; } catch { return null; }
}
