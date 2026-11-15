import { ARTMODELL } from "./artmodell-daten.ts";

/**
 * Gelerntes Modell für die Art eines Schriftstücks (Rekursive Verbesserung, 15.11.2026, docs/PRUEFSTAPEL-REKURSIV-REGELN.md):
 * lineares Modell (gemitteltes Perzeptron – lernt nur aus Fehlern: falsch geraten → Gewichte zur Korrektur hin verschoben) über
 * Wörtern nach ihrer Lage im Schriftstück (Kopf bis zur Anrede, Betreffzeile, ganzer Text) und wenigen Formmerkmalen.
 * Gelernt von scripts/artmodell-lernen.mjs aus erfundenen Lehrbriefen und verbrauchten Prüfstapeln; rechnet auf dem Gerät,
 * kein Sprachmodell, nichts verlässt das Gerät. Die Merkmale hier und in scripts/rekursiv-modell.mjs (dort wird gelernt)
 * müssen gleich bleiben – geprüft in scripts/run-kern-tests.mjs.
 */
export interface Artmodell { fassung: number; klassen: string[]; gewichte: Record<string, number[]> }

const STOPP = new Set("der die das und oder für von vom mit bei den dem des ein eine einer eines einem einen ist sind wird wurde werden auf aus zum zur nach bis über unter ihre ihr ihrem ihren ihres wir sie uns unser unsere unserer bitte danke vielen dank gmbh kg ohg ag mbh tel telefon fax mail www http https iban bic bank blz str straße strasse weg platz allee ring nr seite datum eur euro".split(" "));

export function artMerkmale(text: string): string[] {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  const w = (s: string) => (s.toLowerCase().match(/[a-zäöüß]{3,}/g) || []).filter((x) => !STOPP.has(x));
  const m = new Set<string>();
  const an = zeilen.findIndex((z) => /^(sehr geehrte|liebe|lieber|hallo|guten tag|moin)/i.test(z));
  const kopfEnde = an > 0 ? an : Math.min(12, zeilen.length);
  const kopf = w(zeilen.slice(0, kopfEnde).join(" ")), rumpf = w(zeilen.slice(kopfEnde).join(" "));
  const betr = zeilen.filter((z) => /^(betreff|betr\.|re:|aw:|wg\.|subject)/i.test(z)); if (an > 0) betr.push(...zeilen.slice(Math.max(0, an - 2), an));
  for (const x of kopf) m.add("k:" + x);
  for (const x of w(betr.join(" "))) m.add("b:" + x);
  for (const x of [...kopf, ...rumpf]) m.add("t:" + x);
  for (const x of w(zeilen.slice(-6).join(" "))) m.add("e:" + x);   // Briefende: Gruß, Rechtsbehelf, Zahlungsaufforderung (Runde 2)
  if (an >= 0) m.add("x:anrede"); if (/^(von|from):/im.test(text)) m.add("x:mail");
  if (/(?<![\d,.])19(?:[.,]0{1,2})?\s?%/.test(text)) m.add("x:19"); if (/(?<![\d,.])7(?:[.,]0{1,2})?\s?%/.test(text)) m.add("x:7");
  if (/\d+[.,]\d{2}\s*(€|eur)/i.test(text)) m.add("x:betrag"); if (zeilen.length < 15) m.add("x:kurz"); else if (zeilen.length > 60) m.add("x:lang");
  return [...m];
}

export interface ArtVorhersage { wert: string; zweites: string; abstand: number; grund: string[] }
export function artVorhersage(text: string, modell: Artmodell = ARTMODELL as Artmodell): ArtVorhersage | undefined {
  const ms = artMerkmale(text), s = new Array(modell.klassen.length).fill(0), treffer: string[] = [];
  for (const f of ms) { const g = modell.gewichte[f]; if (!g) continue; treffer.push(f); for (let i = 0; i < g.length; i += 2) s[g[i]] += g[i + 1]; }
  if (treffer.length < 2) return undefined;
  let a = 0; for (let k = 1; k < s.length; k++) if (s[k] > s[a]) a = k;
  let b = a ? 0 : 1; for (let k = 0; k < s.length; k++) if (k !== a && s[k] > s[b]) b = k;
  const anteil = (f: string) => { const g = modell.gewichte[f]; for (let i = 0; i < g.length; i += 2) if (g[i] === a) return g[i + 1]; return 0; };
  const grund = treffer.filter((f) => !f.startsWith("e:")).map((f) => [f, anteil(f)] as const).sort((x, y) => y[1] - x[1]).slice(0, 3).filter(([, v]) => v > 0).map(([f]) => f.slice(2));
  return { wert: modell.klassen[a], zweites: modell.klassen[b], abstand: s[a] - s[b], grund };
}

/** Ab diesem Abstand überstimmt das Modell eine sichere Regel; ab dem zweiten gilt es als sicher (reihum an verbrauchten Stapeln gewählt: Runde 2 mit Briefende-Wörtern: ab 25 sind 96,7 % richtig). */
export const ARTMODELL_VOR_REGEL = 8;
/** Eine unsichere Regel (auch „Unklar“) überstimmt das Modell erst ab diesem Abstand (reihum 86,99 statt 87,01 %, dafür bleibt der Testordner bei 93 %). */
export const ARTMODELL_MIN = 2;
export const ARTMODELL_SICHER = 25;
