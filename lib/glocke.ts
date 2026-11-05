import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { ERINNERUNG_VORGABE, type ErinnerungsWahl, istTermin, kalenderEintrag, kalenderFelder } from "./kalender.ts";

/**
 * App-Glocke (Klaus 2026-11-05): eigene Erinnerung nach der Uhr des Geräts, mit denselben Zeiten wie im Kalender.
 * Gezählt wird, was auch in den Kalender geht oder eigene Erinnerungen trägt; erledigte und zurückgestellte nicht.
 */
export type GlockenZeit = { schluessel: string; recordId: string; titel: string; beginn: string; um: string; vorherMinuten: number };

export function glockenZeiten(records: FamilyRecordUnion[], relations: FamilyRelation[] = [], vorgabe: ErinnerungsWahl[] = ERINNERUNG_VORGABE): GlockenZeit[] {
  const aus: GlockenZeit[] = [];
  for (const r of records) {
    if (!istTermin(r) || ["erledigt", "zurückgestellt", "archiviert"].includes(r.status)) continue;
    const k = kalenderFelder(r);
    if (k.kalenderEintragen !== true && !Array.isArray(k.erinnerungen)) continue;
    const e = kalenderEintrag(r, { vorgabe, relations, records });
    if (!e) continue;
    const beginn = Date.parse(e.beginn);
    for (const min of e.erinnerungen) {
      const um = new Date(beginn - min * 60000).toISOString();
      aus.push({ schluessel: `${r.id}|${um}`, recordId: r.id, titel: (r.data.title || "Termin").trim(), beginn: e.beginn, um, vorherMinuten: min });
    }
  }
  return aus.sort((a, b) => a.um.localeCompare(b.um));
}

/** Fällig: Zeitpunkt erreicht, nicht älter als das Fenster (Gerät war aus), nach dem Einschalten, noch nicht geläutet. */
export function faelligeGlocken(zeiten: GlockenZeit[], jetzt: Date, geläutet: ReadonlySet<string>, seit: number, fensterMinuten = 360) {
  const t = jetzt.getTime();
  return zeiten.filter((z) => { const um = Date.parse(z.um); return um <= t && um > t - fensterMinuten * 60000 && um >= seit && !geläutet.has(z.schluessel); });
}

/** Nächste anstehende Glocke (für die Anzeige „nächste Erinnerung“). */
export function naechsteGlocke(zeiten: GlockenZeit[], jetzt: Date) { return zeiten.find((z) => Date.parse(z.um) > jetzt.getTime()) || null; }

export function runGlockeSelfTest() {
  const rec = (id: string, data: Record<string, unknown>, status = "offen") => ({ id, recordType: "task", createdAt: "2026-11-01", updatedAt: "2026-11-01", status, source: "Test", notes: null, data: { title: id, ...data } }) as unknown as FamilyRecordUnion;
  const records = [
    rec("TASK-1", { dueAt: "2026-11-10", dueTime: "15:00", erinnerungen: ["15m", "0m"] }),
    rec("TASK-2", { dueAt: "2026-11-10", dueTime: "15:00" }), // weder Kalender noch eigene Erinnerung: keine Glocke
    rec("TASK-3", { dueAt: "2026-11-10", dueTime: "15:00", erinnerungen: ["0m"] }, "erledigt"),
  ];
  const z = glockenZeiten(records);
  const um = new Date(2026, 10, 10, 14, 45).toISOString();
  const jetzt = new Date(2026, 10, 10, 14, 46);
  const f = faelligeGlocken(z, jetzt, new Set(), 0);
  const ergebnisse = [
    { name: "nur Einträge mit Kalender oder eigener Erinnerung, nicht erledigte", ok: z.length === 2 && z.every((x) => x.recordId === "TASK-1") },
    { name: "15 Minuten vorher fällig, zur Uhrzeit noch nicht", ok: f.length === 1 && f[0].um === um },
    { name: "schon geläutet läutet nicht noch einmal", ok: faelligeGlocken(z, jetzt, new Set([f[0]?.schluessel]), 0).length === 0 },
    { name: "vor dem Einschalten fällige läuten nicht nach", ok: faelligeGlocken(z, jetzt, new Set(), jetzt.getTime()).length === 0 },
    { name: "älter als das Fenster läutet nicht mehr", ok: faelligeGlocken(z, new Date(2026, 10, 11, 9, 0), new Set(), 0).length === 0 },
  ];
  return { ok: ergebnisse.every((e) => e.ok), ergebnisse };
}
