import type { Wert } from "./typen.ts";
import { WORTMODELL_ART, WORTMODELL_BEREICH } from "./wortmodell-daten.ts";

/**
 * Kleines gelerntes Wortmodell (Naive Bayes über Wörter, Wortpaare und Steuersatz) für Bereich und Art eines Schriftstücks.
 * Gelernt aus erfundenen Lehrbriefen (scripts/briefmodell-abstimmen.mjs); rechnet auf dem Gerät, kein Sprachmodell, nichts
 * verlässt das Gerät. Die Rechnung ist dieselbe wie in scripts/lehrer-modell.mjs (dort wird gelernt) – beide gleich halten.
 */
export interface Wortmodell { fassung: number; konten: string[]; vorab: number[]; gewichte: Record<string, number[]>; belege: number }

const STOPP = new Set("der die das und oder für von vom mit bei den dem des ein eine einer eines einem einen ist sind wird wurde werden auf aus zum zur nach bis über unter ihre ihr ihrem ihren ihres wir sie uns unser unsere unserer bitte danke vielen dank gmbh kg ohg ag mbh inh inhaber inhaberin tel telefon fax mail www http https iban bic bank konto blz str straße strasse weg platz allee ring nr no seite datum eur euro betrag summe gesamt netto brutto mwst ust umsatzsteuer steuernummer ustidnr idnr usb".split(" "));

export function merkmale(text: string): string[] {
  const w = (text.toLowerCase().match(/[a-zäöüß]{3,}/g) || []).filter((x) => !STOPP.has(x)), m = new Set(w);
  for (let i = 0; i + 1 < w.length; i++) m.add(w[i] + " " + w[i + 1]);
  if (/(?<![\d,.])19(?:[.,]0{1,2})?\s?%/.test(text)) m.add("§satz19");
  if (/(?<![\d,.])7(?:[.,]0{1,2})?\s?%/.test(text)) m.add("§satz7");
  return [...m];
}

export interface Vorhersage { wert: string; zweites: string; abstand: number; grund: string[] }
export function vorhersage(modell: Wortmodell, ms: string[]): Vorhersage | undefined {
  const s = modell.vorab.slice(), treffer: string[] = [];
  for (const f of ms) { const g = modell.gewichte[f]; if (!g) continue; treffer.push(f); for (let i = 0; i < g.length; i += 2) s[g[i]] += g[i + 1]; }
  if (!treffer.length) return undefined;
  let a = 0; for (let i = 1; i < s.length; i++) if (s[i] > s[a]) a = i;
  let b = -1; for (let i = 0; i < s.length; i++) if (i !== a && (b < 0 || s[i] > s[b])) b = i;
  const wert = (f: string) => { const g = modell.gewichte[f]; for (let i = 0; i < g.length; i += 2) if (g[i] === a) return g[i + 1]; return 0; };
  const grund = treffer.map((f) => [f, wert(f)] as const).sort((x, y) => y[1] - x[1]).slice(0, 3).filter(([, v]) => v > 0).map(([f]) => f);
  return { wert: modell.konten[a], zweites: modell.konten[b], abstand: s[a] - s[b], grund };
}

/** Ab diesem Abstand zum zweitbesten überstimmt das Modell eine sichere Regel (eine unsichere immer); ab dem zweiten gilt der Vorschlag als sicher. An Lehrdaten abgestimmt. */
export const MODELL_VOR_REGEL = 8;
export const MODELL_SICHER = 10;

/** Regel und Modell zusammenführen: klares Modell gewinnt; sonst die sichere Regel; sonst das Modell; sonst die Regel. */
/** Nur für Messungen: das Modell abschalten, um die Regeln allein zu sehen (scripts/briefmodell-abstimmen.mjs). */
export const wortmodellSchalter = { an: true };

export function mitModell(regel: Wert | undefined, modell: Wortmodell, text: string): Wert | undefined {
  if (!wortmodellSchalter.an) return regel;
  const v = vorhersage(modell, merkmale(text));
  // Zu dünne Grundlage (weniger als zwei sprechende Wörter für den Vorschlag): die Regel bleibt.
  // „Archiv“ schlägt das Modell nie vor: was abgelegt und erledigt ist, entscheidet der Nutzer.
  if (!v || v.grund.length < 2 || v.wert === "Archiv") return regel;
  const wort = v.grund.length ? `gelernte Wörter: ${v.grund.map((g) => `„${g}“`).join(", ")}` : "gelerntes Wortmodell";
  if (regel?.sicher && regel.wert === v.wert) return regel;
  if (v.abstand >= MODELL_VOR_REGEL || !regel?.sicher)
    return { wert: v.wert, sicher: v.abstand >= MODELL_SICHER, grund: v.abstand >= MODELL_VOR_REGEL ? wort : `${wort} (knapp vor „${v.zweites}“)`, quelle: "regel" };
  return regel;
}
export const bereichMitModell = (regel: Wert | undefined, text: string) => mitModell(regel, WORTMODELL_BEREICH as Wortmodell, text);
export const artMitModell = (regel: Wert | undefined, text: string) => mitModell(regel, WORTMODELL_ART as Wortmodell, text);
