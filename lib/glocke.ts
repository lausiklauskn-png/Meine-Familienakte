import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { ERINNERUNG_VORGABE, type ErinnerungsWahl, gueltigeUhrzeit, istTermin, kalenderEintrag, STANDARD_UHRZEIT } from "./kalender.ts";

/**
 * App-Glocke (Klaus 2026-11-05): eigene Erinnerung nach der Uhr des Geräts, mit denselben Zeiten wie im Kalender.
 * Jede offene Frist und Aufgabe läutet (2.28.39, auch Altbestand und Fristen aus dem Tagebuch): mit ihren eigenen
 * Erinnerungen, sonst mit der Vorgabe; eine leer gewählte Liste heißt „keine Erinnerung“. Freie Erinnerungen (ohne Aufgabe)
 * läuten zu ihrem Zeitpunkt. Erledigte, zurückgestellte und gelöschte nicht.
 */
export type GlockenZeit = { schluessel: string; recordId: string; titel: string; beginn: string; um: string; vorherMinuten: number };

export function glockenZeiten(records: FamilyRecordUnion[], relations: FamilyRelation[] = [], vorgabe: ErinnerungsWahl[] = ERINNERUNG_VORGABE): GlockenZeit[] {
  const aus: GlockenZeit[] = [];
  for (const r of records) {
    if (!istTermin(r) || ["erledigt", "zurückgestellt", "archiviert"].includes(r.status)) continue;
    const e = kalenderEintrag(r, { vorgabe, relations, records });
    if (!e) continue;
    const beginn = Date.parse(e.beginn);
    for (const min of e.erinnerungen) {
      const um = new Date(beginn - min * 60000).toISOString();
      aus.push({ schluessel: `${r.id}|${um}`, recordId: r.id, titel: (r.data.title || "Termin").trim(), beginn: e.beginn, um, vorherMinuten: min });
    }
  }
  const verknuepft = new Set(relations.filter((x) => x.fromType === "reminder" && x.relationType === "erinnert an").map((x) => x.fromId));
  for (const r of records) {
    if (r.recordType !== "reminder" || ["erledigt", "zurückgestellt", "archiviert"].includes(r.status) || verknuepft.has(r.id)) continue;
    const at = String((r.data as { remindAt?: string }).remindAt || "");
    if (!/^\d{4}-\d{2}-\d{2}/.test(at)) continue;
    const [j, m, t] = at.slice(0, 10).split("-").map(Number); const [h, min] = (gueltigeUhrzeit(at.slice(11, 16)) || STANDARD_UHRZEIT).split(":").map(Number);
    const um = new Date(j, m - 1, t, h, min).toISOString();
    aus.push({ schluessel: `${r.id}|${um}`, recordId: r.id, titel: ((r.data as { title?: string }).title || "Erinnerung").trim(), beginn: um, um, vorherMinuten: 0 });
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
    rec("TASK-2", { dueAt: "2026-11-10", dueTime: "15:00", erinnerungen: [] }), // ausdrücklich keine Erinnerung: keine Glocke
    rec("TASK-3", { dueAt: "2026-11-10", dueTime: "15:00", erinnerungen: ["0m"] }, "erledigt"),
  ];
  const z = glockenZeiten(records);
  // Altbestand (U11): Frist ohne Kalenderfelder läutet mit der Vorgabe; freie Erinnerung zu ihrer Zeit.
  const alt = glockenZeiten([rec("FRIST-9", { dueAt: "2026-11-20" }), { ...rec("REM-9", { remindAt: "2026-11-12T08:30" }), recordType: "reminder" } as unknown as FamilyRecordUnion]);
  const um = new Date(2026, 10, 10, 14, 45).toISOString();
  const jetzt = new Date(2026, 10, 10, 14, 46);
  const f = faelligeGlocken(z, jetzt, new Set(), 0);
  const ergebnisse = [
    { name: "eigene Erinnerungen, leere Liste läutet nicht, erledigte nicht", ok: z.length === 2 && z.every((x) => x.recordId === "TASK-1") },
    { name: "Frist ohne Felder läutet mit der Vorgabe, freie Erinnerung zu ihrer Zeit", ok: alt.filter((x) => x.recordId === "FRIST-9").length === 2 && alt.some((x) => x.recordId === "REM-9" && x.um === new Date(2026, 10, 12, 8, 30).toISOString()) },
    { name: "15 Minuten vorher fällig, zur Uhrzeit noch nicht", ok: f.length === 1 && f[0].um === um },
    { name: "schon geläutet läutet nicht noch einmal", ok: faelligeGlocken(z, jetzt, new Set([f[0]?.schluessel]), 0).length === 0 },
    { name: "vor dem Einschalten fällige läuten nicht nach", ok: faelligeGlocken(z, jetzt, new Set(), jetzt.getTime()).length === 0 },
    { name: "älter als das Fenster läutet nicht mehr", ok: faelligeGlocken(z, new Date(2026, 10, 11, 9, 0), new Set(), 0).length === 0 },
  ];
  return { ok: ergebnisse.every((e) => e.ok), ergebnisse };
}
