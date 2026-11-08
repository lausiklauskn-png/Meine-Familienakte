import type { FamilyRecordUnion, FamilyRelation } from "./family-data-model.ts";
import { ERINNERUNG_VORGABE, erinnerungAusDatum, erinnerungenOrdnen, type ErinnerungsWahl } from "./kalender.ts";

/**
 * Umzug 2.28.39 (Vorschau D, angenommen): Eine Aufgabe oder Frist trägt ihre Erinnerungen in sich selbst. Früher entstand
 * aus „Erinnerungsdatum“ ein zweiter Datensatz („Erinnerung: …“, Verknüpfung „erinnert an“). Beim Start zieht die App jede
 * solche Erinnerung einmal in ihre Aufgabe um: die Zeit wird eine eigene Erinnerungszeit („@Tag/Uhrzeit“), der alte
 * Datensatz bleibt als „archiviert“ mit Verweis `umgezogenIn` erhalten (nicht gelöscht). Freie Erinnerungen ohne Aufgabe
 * bleiben, wie sie sind. Rein: liefert Kopien, ändert die Eingabe nicht.
 */
export type ErinnerungsUmzug = { records: FamilyRecordUnion[]; relations: FamilyRelation[]; umgezogen: Array<{ erinnerung: string; ziel: string; zeit: ErinnerungsWahl | null }> };

export function erinnerungenUmziehen(records: FamilyRecordUnion[], relations: FamilyRelation[], vorgabe: ErinnerungsWahl[] = ERINNERUNG_VORGABE, jetzt = new Date().toISOString()): ErinnerungsUmzug {
  const neu = structuredClone(records);
  const umgezogen: ErinnerungsUmzug["umgezogen"] = [];
  const weg = new Set<string>();
  for (const rel of relations) {
    if (rel.fromType !== "reminder" || rel.relationType !== "erinnert an" || (rel.toType !== "task" && rel.toType !== "deadline")) continue;
    const rem = neu.find((r) => r.id === rel.fromId && r.recordType === "reminder");
    const ziel = neu.find((r) => r.id === rel.toId && (r.recordType === "task" || r.recordType === "deadline"));
    if (!rem || !ziel) continue;
    weg.add(rel.id);
    if (rem.status === "archiviert") continue;
    const offen = !["erledigt", "zurückgestellt"].includes(rem.status);
    const zeit = offen ? erinnerungAusDatum(String((rem.data as { remindAt?: string }).remindAt || "")) : null;
    if (zeit) {
      const d = ziel.data as { erinnerungen?: ErinnerungsWahl[] };
      d.erinnerungen = erinnerungenOrdnen([...(Array.isArray(d.erinnerungen) ? d.erinnerungen : vorgabe), zeit]);
      ziel.updatedAt = jetzt;
    }
    rem.status = "archiviert";
    rem.updatedAt = jetzt;
    (rem.data as Record<string, unknown>).umgezogenIn = ziel.id;
    umgezogen.push({ erinnerung: rem.id, ziel: ziel.id, zeit });
  }
  return { records: neu, relations: relations.filter((r) => !weg.has(r.id)), umgezogen };
}

export function runErinnerungsUmzugSelfTest() {
  const rec = (id: string, recordType: string, data: Record<string, unknown>, status = "offen") => ({ id, recordType, createdAt: "2026-11-01", updatedAt: "2026-11-01", status, source: "Test", notes: null, data }) as unknown as FamilyRecordUnion;
  const records = [
    rec("TASK-1", "task", { title: "Steuer", dueAt: "2026-11-20" }),
    rec("REM-1", "reminder", { title: "Erinnerung: Steuer", remindAt: "2026-11-18T10:00" }),
    rec("FRIST-2", "deadline", { title: "Antrag", dueAt: "2026-12-01", erinnerungen: ["1d"] }),
    rec("REM-2", "reminder", { title: "Erinnerung: Antrag", remindAt: "2026-11-25" }),
    rec("REM-3", "reminder", { title: "Erinnerung: Antrag alt", remindAt: "2026-11-20" }, "erledigt"),
    rec("REM-4", "reminder", { title: "frei", remindAt: "2026-11-21" }),
  ];
  const rel = (id: string, from: string, toType: string, to: string) => ({ id, fromType: "reminder", fromId: from, toType, toId: to, relationType: "erinnert an", createdAt: "x", source: null, notes: null }) as unknown as FamilyRelation;
  const relations = [rel("R1", "REM-1", "task", "TASK-1"), rel("R2", "REM-2", "deadline", "FRIST-2"), rel("R3", "REM-3", "deadline", "FRIST-2")];
  const vorher = JSON.stringify({ records, relations });
  const u = erinnerungenUmziehen(records, relations, ["7d", "1d"], "2026-11-08T00:00:00Z");
  const t1 = u.records.find((r) => r.id === "TASK-1")!.data as { erinnerungen?: string[] };
  const f2 = u.records.find((r) => r.id === "FRIST-2")!.data as { erinnerungen?: string[] };
  const zweit = erinnerungenUmziehen(u.records, u.relations);
  const ergebnisse = [
    { name: "Erinnerungszeit steht danach in der Aufgabe (mit Vorgabe)", ok: ["7d", "1d", "@2026-11-18T10:00"].every((w) => (t1.erinnerungen || []).includes(w)) },
    { name: "ohne Uhrzeit um 9 Uhr, eigene Wahl bleibt", ok: (f2.erinnerungen || []).includes("@2026-11-25T09:00") && (f2.erinnerungen || []).includes("1d") && !(f2.erinnerungen || []).includes("7d") },
    { name: "erledigte Erinnerung bringt keine Zeit mit", ok: !(f2.erinnerungen || []).includes("@2026-11-20T09:00") },
    { name: "alte Erinnerungen archiviert, nicht gelöscht", ok: ["REM-1", "REM-2", "REM-3"].every((id) => u.records.find((r) => r.id === id)?.status === "archiviert") && u.records.length === records.length },
    { name: "freie Erinnerung bleibt offen", ok: u.records.find((r) => r.id === "REM-4")?.status === "offen" },
    { name: "Verknüpfungen „erinnert an“ entfernt, Eingabe unverändert", ok: u.relations.length === 0 && JSON.stringify({ records, relations }) === vorher },
    { name: "zweiter Lauf ändert nichts", ok: zweit.umgezogen.length === 0 },
  ];
  return { ok: ergebnisse.every((e) => e.ok), ergebnisse };
}
