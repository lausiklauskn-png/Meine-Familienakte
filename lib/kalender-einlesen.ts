/** Stufe D (Plan 08.11.2026, Klaus: „das möchte ich umgesetzt haben“): Termine aus dem verbundenen Kalender in die Akte holen.
 *
 *  Regeln wie beim Geräte-Abgleich (lib/abgleich.ts):
 *  - Ein fremder Termin wird einmal angelegt (Frist mit Quelle) und danach an seiner Kennung beim Anbieter wiedererkannt.
 *  - Nur im Kalender geändert → still übernehmen. Nur in der Akte geändert → geht beim nächsten Hinausschreiben in den Kalender.
 *    Beide geändert → Frage. Im Kalender gelöscht → in der Akte archiviert, nie endgültig gelöscht.
 *  - Eigene Einträge der Familienakte (fa-…@familienakte, Beschreibung „Aus der Familienakte“, bekannte Zuordnung) werden
 *    beim Einlesen übersprungen – sie kommen ja aus der Akte.
 *  Reine Rechnung ohne Netz und ohne Dateizugriff. */
import type { FamilyRecordUnion } from "./family-data-model.ts";
import { kalenderFelder, kurzHash, type KalenderAnbieter, type KalenderQuelle } from "./kalender.ts";

export type FremdTermin = {
  eintragId: string; kalenderId: string; titel: string;
  /** Beginn/Ende als ISO-Zeitpunkt (UTC) oder bei ganztägigen Terminen „JJJJ-MM-TT“. */
  beginn: string; ende?: string | null; ganztags: boolean;
  beschreibung?: string | null; uid?: string | null; geaendert?: string | null; geloescht?: boolean;
  /** Eigener Vermerk der Familienakte beim Anbieter (Google extendedProperties). */
  familienakte?: string | null;
};
export type EinleseSchritt =
  | { art: "anlegen"; termin: FremdTermin; felder: TerminFelder }
  | { art: "aendern"; recordId: string; termin: FremdTermin; felder: TerminFelder }
  | { art: "archivieren"; recordId: string; termin: FremdTermin }
  | { art: "konflikt"; recordId: string; termin: FremdTermin; felder: TerminFelder; hier: TerminFelder; hierZeit: string | null; dortZeit: string | null; vorschlag: "hier" | "dort" }
  | { art: "gleich"; recordId: string }
  | { art: "eigener"; eintragId: string };
export type TerminFelder = { title: string; dueAt: string; dueTime: string | null };

const pad = (n: number) => String(n).padStart(2, "0");
/** Fremder Termin → Felder der Frist in Ortszeit dieses Geräts. */
export function felderAus(t: FremdTermin): TerminFelder {
  const title = (t.titel || "Termin").trim().slice(0, 200) || "Termin";
  if (t.ganztags || /^\d{4}-\d{2}-\d{2}$/.test(t.beginn)) return { title, dueAt: t.beginn.slice(0, 10), dueTime: null };
  const d = new Date(t.beginn);
  if (Number.isNaN(d.getTime())) return { title, dueAt: t.beginn.slice(0, 10), dueTime: null };
  return { title, dueAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, dueTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
export const fremdStand = (t: FremdTermin) => kurzHash(JSON.stringify({ t: (t.titel || "").trim(), b: t.beginn, e: t.ende || null, g: Boolean(t.ganztags) }));
export const lokalStand = (f: TerminFelder) => kurzHash(JSON.stringify({ t: (f.title || "").trim(), d: f.dueAt, u: f.dueTime || null }));
export function lokaleFelder(record: FamilyRecordUnion): TerminFelder {
  const d = record.data as { title?: string; dueAt?: string; dueTime?: string | null };
  return { title: d.title || "", dueAt: d.dueAt || "", dueTime: d.dueTime || null };
}

/** Eigene Einträge der Akte beim Anbieter erkennen (nicht noch einmal einlesen). */
export function istEigener(t: FremdTermin, records: FamilyRecordUnion[], anbieter: KalenderAnbieter) {
  if (t.familienakte || (t.uid && /^fa-.*@familienakte$/.test(t.uid))) return true;
  if (t.beschreibung && /Aus der Familienakte/.test(t.beschreibung)) return true;
  return records.some((r) => (kalenderFelder(r).kalender || []).some((z) => z.anbieter === anbieter && z.eintragId === t.eintragId && !kalenderFelder(r).kalenderQuelle));
}

/** Plant das Einlesen einer Liste fremder Termine eines Anbieters. */
export function einlesePlan(records: FamilyRecordUnion[], termine: FremdTermin[], anbieter: KalenderAnbieter): EinleseSchritt[] {
  const plan: EinleseSchritt[] = [];
  const quelle = new Map<string, FamilyRecordUnion>();
  for (const r of records) { const q = kalenderFelder(r).kalenderQuelle; if (q && q.anbieter === anbieter) quelle.set(q.eintragId, r); }
  for (const t of termine) {
    const da = quelle.get(t.eintragId);
    if (!da) {
      if (t.geloescht || istEigener(t, records, anbieter)) { if (!t.geloescht) plan.push({ art: "eigener", eintragId: t.eintragId }); continue; }
      plan.push({ art: "anlegen", termin: t, felder: felderAus(t) }); continue;
    }
    const q = kalenderFelder(da).kalenderQuelle!;
    if (t.geloescht) { if (da.status !== "archiviert") plan.push({ art: "archivieren", recordId: da.id, termin: t }); else plan.push({ art: "gleich", recordId: da.id }); continue; }
    const hier = lokaleFelder(da), dort = felderAus(t);
    const hierGeaendert = lokalStand(hier) !== q.standLokal, dortGeaendert = fremdStand(t) !== q.stand;
    if (!dortGeaendert) { plan.push({ art: "gleich", recordId: da.id }); continue; }
    if (!hierGeaendert) { plan.push({ art: "aendern", recordId: da.id, termin: t, felder: dort }); continue; }
    const hz = da.updatedAt || null, dz = t.geaendert || null;
    plan.push({ art: "konflikt", recordId: da.id, termin: t, felder: dort, hier, hierZeit: hz, dortZeit: dz, vorschlag: hz && dz && dz > hz ? "dort" : "hier" });
  }
  return plan;
}

export function quelleAus(t: FremdTermin, anbieter: KalenderAnbieter, felder: TerminFelder, kalenderName?: string): KalenderQuelle {
  return { anbieter, kalenderId: t.kalenderId, eintragId: t.eintragId, stand: fremdStand(t), standLokal: lokalStand(felder), am: new Date().toISOString(), kalenderName: kalenderName || null };
}
export function einleseZaehlung(plan: EinleseSchritt[]) {
  const z = { anlegen: 0, aendern: 0, archivieren: 0, konflikte: 0, gleich: 0, eigene: 0 };
  for (const s of plan) { if (s.art === "anlegen") z.anlegen++; else if (s.art === "aendern") z.aendern++; else if (s.art === "archivieren") z.archivieren++; else if (s.art === "konflikt") z.konflikte++; else if (s.art === "gleich") z.gleich++; else z.eigene++; }
  return z;
}
