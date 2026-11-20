// Kalender je Person (Klaus 20.11.2026, Vorschau docs/vorschau/kalender-person-familie.html, sein Ja: „so bauen, privat-Schalter passt“):
// jedes Handy gehört einer Person („Kalender von …“), „Fristen und Aufgaben“ zeigt die ganze Familie. Ein Termin kann für mehrere
// Personen gelten, ist fest oder vorläufig und kann privat sein (die anderen sehen dann nur „belegt“). Wer mitgemeint ist, antwortet
// „passt“ oder „passt nicht“. Reine Rechnung ohne DOM, geprüft in scripts/run-kalender-familie-tests.mjs.
import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";

export type Antwort = "passt" | "passt-nicht";
/** Liegt zusätzlich in den Daten des Termins (deadline/task); alles freiwillig, alte Einträge haben nichts davon. */
export type FamilienFelder = {
  /** Personen, für die der Termin gilt (Kennungen aus dem Register). */
  fuer?: string[];
  /** Wer ihn angelegt hat (Person des Handys). */
  von?: string;
  vorlaeufig?: boolean;
  privat?: boolean;
  antworten?: Record<string, Antwort>;
};
export type TerminStand = "fest" | "vorläufig" | "abgelehnt";

const liste = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

export function familienFelder(record: FamilyRecordUnion): FamilienFelder {
  const d = (record.data || {}) as Record<string, unknown>;
  const antworten: Record<string, Antwort> = {};
  if (d.antworten && typeof d.antworten === "object") for (const [k, v] of Object.entries(d.antworten as Record<string, unknown>)) if (v === "passt" || v === "passt-nicht") antworten[k] = v;
  return { fuer: liste(d.fuer), von: typeof d.von === "string" && d.von ? d.von : undefined, vorlaeufig: d.vorlaeufig === true, privat: d.privat === true, antworten };
}

/** Säubert die Eingabe für das Speichern: doppelte Personen weg, leere Felder fallen weg. */
export function familienEingabe(f: FamilienFelder): FamilienFelder {
  const out: FamilienFelder = {};
  const fuer = [...new Set(liste(f.fuer))];
  if (fuer.length) out.fuer = fuer;
  if (f.von) out.von = String(f.von);
  if (f.vorlaeufig) out.vorlaeufig = true;
  if (f.privat) out.privat = true;
  if (f.antworten && Object.keys(f.antworten).length) out.antworten = { ...f.antworten };
  return out;
}

/** Alle Personen eines Termins: „für“, wer ihn angelegt hat, und Personen über die Verknüpfung „betrifft“. */
export function personenVon(record: FamilyRecordUnion, relations: FamilyRelation[]): string[] {
  const f = familienFelder(record);
  const ueber = relations.filter((x) => x.fromId === record.id && x.toType === "person").map((x) => x.toId)
    .concat(relations.filter((x) => x.toId === record.id && x.fromType === "person").map((x) => x.fromId));
  return [...new Set([...(f.von ? [f.von] : []), ...(f.fuer || []), ...ueber])];
}

/** Gehört in „Mein Kalender“ der Person `ich`: ihre Termine und solche ohne Person (wie bisher); ohne Besitzer des Handys alles. */
export function gehoertMir(record: FamilyRecordUnion, relations: FamilyRelation[], ich: string | null): boolean {
  if (!ich) return true;
  const p = personenVon(record, relations);
  return !p.length || p.includes(ich);
}

/** Fest, vorläufig oder abgelehnt: ein „passt nicht“ lehnt ab; vorläufig wird fest, sobald alle Mitgemeinten „passt“ sagen. */
export function terminStand(record: FamilyRecordUnion): TerminStand {
  const f = familienFelder(record);
  const a = f.antworten || {};
  if (Object.values(a).includes("passt-nicht")) return "abgelehnt";
  if (!f.vorlaeufig) return "fest";
  const andere = (f.fuer || []).filter((p) => p !== f.von);
  return andere.length && andere.every((p) => a[p] === "passt") ? "fest" : "vorläufig";
}

/** Darf `ich` antworten? Nur wer mitgemeint ist und den Termin nicht selbst angelegt hat. */
export function darfAntworten(record: FamilyRecordUnion, ich: string | null): boolean {
  if (!ich) return false;
  const f = familienFelder(record);
  return (f.fuer || []).includes(ich) && f.von !== ich;
}

export function antwortSetzen(f: FamilienFelder, person: string, antwort: Antwort | null): FamilienFelder {
  const antworten = { ...(f.antworten || {}) };
  if (antwort) antworten[person] = antwort; else delete antworten[person];
  return { ...f, antworten };
}

/** Privat und nicht von mir: die anderen sehen nur „belegt“. */
export function nurBelegt(record: FamilyRecordUnion, relations: FamilyRelation[], ich: string | null): boolean {
  const f = familienFelder(record);
  if (!f.privat) return false;
  if (!ich) return false;
  return f.von ? f.von !== ich : !personenVon(record, relations).includes(ich);
}

const minuten = (zeit: string) => { const m = /^(\d{2}):(\d{2})$/.exec(zeit); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

/** Überschneidungen beim Anlegen: dieselbe Person am selben Tag, beide mit Uhrzeit, weniger als eine Stunde auseinander. */
export function ueberschneidungen(records: FamilyRecordUnion[], relations: FamilyRelation[], neu: { tag: string; zeit: string; personen: string[]; ausser?: string }, dauer = 60) {
  const start = minuten(neu.zeit);
  if (start === null || !neu.personen.length) return [] as Array<{ record: FamilyRecordUnion; person: string; zeit: string }>;
  const treffer: Array<{ record: FamilyRecordUnion; person: string; zeit: string }> = [];
  for (const r of records) {
    if (r.id === neu.ausser || (r.recordType !== "deadline" && r.recordType !== "task") || ["erledigt", "zurückgestellt", "archiviert"].includes(r.status)) continue;
    const d = r.data as { dueAt?: string; dueTime?: string };
    if (String(d.dueAt || "").slice(0, 10) !== neu.tag || !d.dueTime) continue;
    const m = minuten(d.dueTime);
    if (m === null || Math.abs(m - start) >= dauer || terminStand(r) === "abgelehnt") continue;
    const wer = personenVon(r, relations).find((p) => neu.personen.includes(p));
    if (wer) treffer.push({ record: r, person: wer, zeit: d.dueTime });
  }
  return treffer;
}

/** Farbe je Person: feste Reihe, nach der Reihenfolge im Register (gleiche Person = gleiche Farbe auf jedem Gerät mit derselben Akte). */
export const PERSONEN_FARBEN = ["#1f7a6d", "#b4561c", "#7a4fb0", "#2c6fb3", "#a23a5a", "#5f7a1f", "#8a6d1f", "#3a5f8a"];
export function personFarbe(personen: string[], id: string) { const i = personen.indexOf(id); return i < 0 ? "#6b7f8f" : PERSONEN_FARBEN[i % PERSONEN_FARBEN.length]; }
