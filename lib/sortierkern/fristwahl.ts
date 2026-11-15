import type { Wert } from "./typen.ts";
import { datumeImText } from "./erkennen.ts";
import { FRISTWAHL } from "./fristwahl-daten.ts";

/**
 * Gelernte Wahl der Frist (Rekursive Verbesserung Runde 2, 15.11.2026, docs/PRUEFSTAPEL-REKURSIV-REGELN.md): Kandidaten sind alle Daten
 * im Text, der Vorschlag der festen Regeln und „keine Frist“; jeder Kandidat bekommt Merkmale aus seiner Umgebung (Wörter davor und
 * danach, Uhrzeit, Wochentag, Abstand zum Briefdatum, Lage). Ein lineares Modell (gemitteltes Perzeptron, gelernt aus Korrekturen)
 * wählt. Greift nur, wenn die feste Regel keine sichere Frist findet. Gelernt von scripts/fristwahl-lernen.mjs.
 */
export interface Fristwahl { fassung: number; gewichte: Record<string, number> }
const KEINE = "§keine";
const W = (s: string) => (s.toLowerCase().match(/[a-zäöüß]{2,}/g) || []);
const HINWEISE = ["bis", "spätestens", "fällig", "zahlbar", "termin", "frist", "uhr", "bitte", "überweisen", "abgebucht", "lastschrift", "einzug", "widerspruch", "einspruch", "erinnerung", "mahnung", "rücksendung", "kündigungsfrist", "laufzeit", "gültig", "vertragsbeginn"];

function tageZwischen(a: string, b: string) { return Math.round((Date.parse(a) - Date.parse(b)) / 864e5); }
function eimer(t: number) { return t < -30 ? "<-30" : t < 0 ? "<0" : t <= 7 ? "0-7" : t <= 21 ? "8-21" : t <= 45 ? "22-45" : t <= 120 ? "46-120" : t <= 400 ? "121-400" : ">400"; }

export function fristBeispiele(text: string, regel: Wert | undefined, datum?: { wert?: string; sicher?: boolean }): Array<{ key: string; f: string[] }> {
  const t = text.replace(/\s+/g, " "), n = Math.max(1, t.length), alle = datumeImText(t), gesehen = new Map<string, { iso: string; pos: number; zahl: number }>();
  alle.forEach((d) => { const g = gesehen.get(d.iso); if (g) g.zahl++; else gesehen.set(d.iso, { ...d, zahl: 1 }); });
  if (regel?.wert && /^\d{4}-\d{2}-\d{2}$/.test(regel.wert) && !gesehen.has(regel.wert)) gesehen.set(regel.wert, { iso: regel.wert, pos: -1, zahl: 0 });
  const sicherDatum = datum?.sicher && datum.wert ? datum.wert : undefined;
  const liste: Array<{ key: string; f: string[] }> = [];
  let k = 0;
  for (const d of gesehen.values()) {
    const f: string[] = ["D"];
    if (d.pos >= 0) {
      const vor = W(t.slice(Math.max(0, d.pos - 70), d.pos)).slice(-5), nach = W(t.slice(d.pos + 6, d.pos + 50)).slice(0, 3);
      vor.forEach((x) => f.push("v:" + x)); if (vor.length) f.push("v1:" + vor[vor.length - 1]); nach.forEach((x) => f.push("n:" + x));
      if (/^\S*\s*(?:\S+\s+)?(?:um\s+)?\d{1,2}[:.]\d{2}\s*(uhr)?/i.test(t.slice(d.pos + 6, d.pos + 30))) f.push("uhrzeit");
      if (/(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\.?,?\s*(den\s+)?$/i.test(t.slice(Math.max(0, d.pos - 15), d.pos))) f.push("wochentag");
      f.push("lage:" + Math.floor(5 * d.pos / n), "nr:" + Math.min(k, 4)); if (k === gesehen.size - 1) f.push("letztes");
      if (d.zahl > 1) f.push("mehrfach");
    } else f.push("gerechnet");
    if (sicherDatum) f.push("rel:" + eimer(tageZwischen(d.iso, sicherDatum))); else f.push("rel:?");
    if (regel?.wert === d.iso) f.push("rf", "rf:" + regel.sicher);
    liste.push({ key: d.iso, f }); k++;
  }
  const kf = ["K", "K:regel:" + (regel ? "ja" : "nein"), "K:n:" + Math.min(gesehen.size, 5)];
  const tw = new Set(W(t)); for (const h of HINWEISE) if (tw.has(h)) kf.push("K:t:" + h);
  liste.push({ key: KEINE, f: kf });
  return liste;
}
export function fristWaehlen(text: string, regel: Wert | undefined, datum?: { wert?: string; sicher?: boolean }, modell: Fristwahl = FRISTWAHL as Fristwahl): Wert | undefined {
  let best: { key: string; f: string[] } | undefined, bs = -Infinity;
  for (const x of fristBeispiele(text, regel, datum)) { const s = x.f.reduce((a, y) => a + (modell.gewichte[y] || 0), 0); if (s > bs) { bs = s; best = x; } }
  if (!best || best.key === KEINE) return undefined;
  if (regel?.wert === best.key) return regel;
  return { wert: best.key, sicher: false, grund: "gelernte Wahl unter den Daten im Text", quelle: "regel" };
}
export const FRIST_KEINE = KEINE;
