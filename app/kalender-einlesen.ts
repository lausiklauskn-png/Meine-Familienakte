/** Stufe D: Termine aus den gewählten Kalendern des verbundenen Anbieters holen (Google, Microsoft, Gerätekalender).
 *  Plan aus lib/kalender-einlesen.ts, Übernahme über local-vault; Merker je Kalender (syncToken/deltaLink) in den Einstellungen. */
import { einlesePlan, einleseZaehlung, type EinleseSchritt, type FremdTermin } from "../lib/kalender-einlesen";
import type { FamilyRecordUnion } from "../lib/family-data-model";
import { ANBIETER, KalenderFehler } from "./kalender-anbieter";
import { kalenderEinstSchreiben, type KalenderEinst } from "./kalender-abgleich";
import { kalenderTermineEinlesen } from "./local-vault";

/** Nie zwei Kalenderläufe zugleich (automatischer Lauf und Knopf): jeder liest und schreibt das Register für sich. */
let kette: Promise<unknown> = Promise.resolve();
export function exklusiv<T>(fn: () => Promise<T>): Promise<T> { const p = kette.then(fn, fn); kette = p.catch(() => undefined); return p; }

export type EinleseVorschau = { schritte: Array<EinleseSchritt & { kalenderName: string }>; zaehlung: ReturnType<typeof einleseZaehlung>; staende: Record<string, string | null>; fehler: string[] };

/** Liest alle gewählten Kalender und plant; schreibt nichts. */
export async function einlesenVorbereiten(records: FamilyRecordUnion[], einst: KalenderEinst): Promise<EinleseVorschau> {
  const a = ANBIETER[einst.anbieter];
  const e = einst.einlesen;
  if (!a.lesen || !e?.an || !e.kalender.length) return { schritte: [], zaehlung: einleseZaehlung([]), staende: e?.staende || {}, fehler: [] };
  if (!a.verbunden()) await a.verbinden();
  const schritte: EinleseVorschau["schritte"] = []; const staende = { ...e.staende }; const fehler: string[] = [];
  for (const k of e.kalender) {
    try {
      const r = await a.lesen(k.id, staende[k.id] || null);
      let termine: FremdTermin[] = r.termine;
      // Vollständiges Lesen (kein Merker): Einträge, die im Fenster nicht mehr vorkommen, gelten als im Kalender gelöscht.
      if (r.voll) {
        const da = new Set(r.termine.map((t) => t.eintragId));
        for (const rec of records) {
          const q = (rec.data as { kalenderQuelle?: { anbieter: string; kalenderId: string; eintragId: string } }).kalenderQuelle;
          if (q && q.anbieter === einst.anbieter && q.kalenderId === k.id && !da.has(q.eintragId) && rec.status !== "archiviert") termine = [...termine, { eintragId: q.eintragId, kalenderId: k.id, titel: "", beginn: "", ganztags: false, geloescht: true }];
        }
      }
      for (const s of einlesePlan(records, termine, einst.anbieter)) schritte.push({ ...s, kalenderName: k.name });
      staende[k.id] = r.stand;
    } catch (g) {
      fehler.push(`${k.name}: ${g instanceof Error ? g.message : String(g)}`);
      if (g instanceof KalenderFehler && (g.code === "KALENDER_NEU_ANMELDEN" || g.code === "netz")) break;
    }
  }
  return { schritte, zaehlung: einleseZaehlung(schritte), staende, fehler };
}

/** Übernimmt die Vorschau (ohne Fragen oder mit Wahl), merkt die Stände. */
export async function einlesenAusfuehren(handle: FileSystemDirectoryHandle, einst: KalenderEinst, vorschau: EinleseVorschau, wahl: Record<string, "hier" | "dort"> = {}) {
  const jeKalender = new Map<string, EinleseSchritt[]>();
  for (const s of vorschau.schritte) { const liste = jeKalender.get(s.kalenderName) || []; liste.push(s); jeKalender.set(s.kalenderName, liste); }
  const summe = { angelegt: 0, geaendert: 0, archiviert: 0, konflikteDort: 0, konflikteHier: 0 };
  for (const [name, liste] of jeKalender) {
    const z = await kalenderTermineEinlesen(handle, liste, einst.anbieter, name, wahl);
    for (const k of Object.keys(summe) as Array<keyof typeof summe>) summe[k] += z[k];
  }
  kalenderEinstSchreiben({ ...einst, einlesen: { ...einst.einlesen!, staende: vorschau.staende, zuletzt: new Date().toISOString(), fehler: vorschau.fehler[0] || null } });
  return summe;
}
export const einleseText = (z: { angelegt: number; geaendert: number; archiviert: number; konflikteDort: number; konflikteHier: number }) =>
  `${z.angelegt} neu aus dem Kalender, ${z.geaendert} geändert, ${z.archiviert} archiviert${z.konflikteDort || z.konflikteHier ? `, ${z.konflikteDort + z.konflikteHier} Unterschiede entschieden` : ""}.`;
