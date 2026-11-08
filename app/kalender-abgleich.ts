// Kalender-Abgleich (Klaus 2026-11-05): Einstellung je Gerät (Demo getrennt), Plan aus dem Kern, Ausführung beim Anbieter,
// Zuordnung zurück ins Register. Läuft nur, wenn der Nutzer einen Kalender verbunden hat; nichts geschieht still.
import { workspaceStorage } from "../lib/demo-workspace.ts";
import { abgleichPlan, ERINNERUNG_VORGABE, erinnerungenOrdnen, icsDatei, kalenderEintrag, kalenderFelder, kalenderUid, soll, type ErinnerungsWahl, type KalenderAnbieter, type KalenderEintrag } from "../lib/kalender";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { ANBIETER, KalenderFehler } from "./kalender-anbieter";
import { dateiAusgeben } from "./dateiausgabe";
import { updateLocalScheduleKalender } from "./local-vault";

export const KALENDER_EINST_SCHLUESSEL = "familienakte-kalender-v1";
export type KalenderEinst = {
  anbieter: KalenderAnbieter;
  kalenderId: string;
  kalenderName: string;
  konto?: string;
  erinnerungen: ErinnerungsWahl[];
  letzterAbgleich?: string;
  letzterFehler?: string | null;
  /** Stufe D: Termine aus dem Kalender holen – welche Kalender, Merker je Kalender, letzter Lauf. */
  einlesen?: { an: boolean; kalender: Array<{ id: string; name: string }>; staende: Record<string, string | null>; zuletzt?: string | null; fehler?: string | null };
};

export function kalenderEinstLesen(): KalenderEinst | null {
  try {
    const e = JSON.parse(workspaceStorage.getItem(KALENDER_EINST_SCHLUESSEL) || "null") as KalenderEinst | null;
    if (!e || !(e.anbieter in ANBIETER) || typeof e.kalenderId !== "string") return null;
    return { ...e, erinnerungen: Array.isArray(e.erinnerungen) ? erinnerungenOrdnen(e.erinnerungen) : ERINNERUNG_VORGABE };
  } catch { return null; }
}
export function kalenderEinstSchreiben(e: KalenderEinst | null) {
  try { if (e) workspaceStorage.setItem(KALENDER_EINST_SCHLUESSEL, JSON.stringify(e)); else workspaceStorage.removeItem(KALENDER_EINST_SCHLUESSEL); } catch { /* nur für diese Sitzung */ }
  window.dispatchEvent(new Event("familienakte-kalender"));
}

export type AbgleichErgebnis = { angelegt: number; geaendert: number; entfernt: number; gleich: number; fehler: string[] };

/**
 * Führt den Plan aus. Jeder Schritt einzeln: ein Fehler bei einer Frist hält die anderen nicht auf und wird mit Grund
 * gemeldet. Die Zuordnung wird danach in einem Schreibvorgang ins Register übernommen.
 */
export async function kalenderAbgleichen(handle: FileSystemDirectoryHandle, records: FamilyRecordUnion[], relations: FamilyRelation[], einst: KalenderEinst): Promise<AbgleichErgebnis> {
  const anbieter = ANBIETER[einst.anbieter];
  const ziel = { anbieter: einst.anbieter, kalenderId: einst.kalenderId };
  const plan = abgleichPlan(records, ziel, { vorgabe: einst.erinnerungen, relations });
  const ergebnis: AbgleichErgebnis = { angelegt: 0, geaendert: 0, entfernt: 0, gleich: 0, fehler: [] };
  const aenderungen: Parameters<typeof updateLocalScheduleKalender>[1] = [];
  const am = new Date().toISOString();
  for (const schritt of plan) {
    try {
      if (schritt.art === "gleich") { ergebnis.gleich++; continue; }
      const hier = { anbieter: einst.anbieter, kalenderId: schritt.kalenderId }; // je Eintrag eigener Kalender möglich
      if (schritt.art === "entfernen") {
        await anbieter.entfernen(schritt.kalenderId, schritt.zuordnung.eintragId);
        aenderungen.push({ id: schritt.recordId, ziel: hier, zuordnung: null }); ergebnis.entfernt++; continue;
      }
      const eintragId = await anbieter.schreiben(schritt.kalenderId, schritt.eintrag, schritt.art === "aendern" ? schritt.zuordnung.eintragId : undefined);
      aenderungen.push({ id: schritt.recordId, ziel: hier, zuordnung: { ...hier, eintragId, stand: schritt.eintrag.stand, am } });
      if (schritt.art === "anlegen") ergebnis.angelegt++; else ergebnis.geaendert++;
    } catch (grund) {
      ergebnis.fehler.push(`${schritt.recordId}: ${grund instanceof Error ? grund.message : String(grund)}`);
      if (grund instanceof KalenderFehler && (grund.code === "KALENDER_NEU_ANMELDEN" || grund.code === "netz" || grund.code === "FA_KALENDER_KEIN_RECHT")) break;
    }
  }
  if (aenderungen.length) await updateLocalScheduleKalender(handle, aenderungen);
  kalenderEinstSchreiben({ ...einst, letzterAbgleich: am, letzterFehler: ergebnis.fehler[0] || null });
  return ergebnis;
}

/** Kalenderdatei mit allen angehakten offenen Fristen; früher übergebene, inzwischen erledigte gehen als abgesagt mit. */
export async function kalenderDateiAusgeben(handle: FileSystemDirectoryHandle | null, records: FamilyRecordUnion[], relations: FamilyRelation[], einst: KalenderEinst) {
  const eintraege: KalenderEintrag[] = [];
  const abgesagt: Array<{ uid: string; sequenz: number }> = [];
  const aenderungen: Parameters<typeof updateLocalScheduleKalender>[1] = [];
  const ziel = { anbieter: "ics" as const, kalenderId: "datei" };
  const am = new Date().toISOString();
  for (const record of records) {
    const vorher = (kalenderFelder(record).kalender || []).find((z) => z.anbieter === "ics");
    const e = soll(record) ? kalenderEintrag(record, { vorgabe: einst.erinnerungen, relations, records }) : null;
    if (e) { eintraege.push(e); aenderungen.push({ id: record.id, ziel, zuordnung: { ...ziel, eintragId: e.uid, stand: e.stand, am } }); }
    else if (vorher) { abgesagt.push({ uid: kalenderUid(record), sequenz: Math.floor(Date.now() / 1000) % 2147483647 }); aenderungen.push({ id: record.id, ziel, zuordnung: null }); }
  }
  const text = icsDatei(eintraege, { abgesagt });
  const datum = am.slice(0, 10);
  const ergebnis = await dateiAusgeben(new File([text], `Familienakte-Fristen-${datum}.ics`, { type: "text/calendar" }));
  if (ergebnis !== "abgebrochen" && handle && aenderungen.length) await updateLocalScheduleKalender(handle, aenderungen);
  kalenderEinstSchreiben({ ...einst, letzterAbgleich: am, letzterFehler: null });
  return { ergebnis, anzahl: eintraege.length, abgesagt: abgesagt.length };
}
