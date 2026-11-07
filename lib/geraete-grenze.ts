/** P4 (Plan 07.11., Punkt 1): sichere Dateigröße je Gerät aus der vorhandenen Geräteprüfung (`window.ProGeraet.messen`,
 *  Android `ProDevicePlugin`, Windows `DesktopGeraet`). Kein zweites Messverfahren. Dazu die reinen Regeln fürs Verkleinern:
 *  nie unter 300 dpi bezogen auf A4, Texterkennungs-Gegenprobe mit Richtwert 98 % der Wörter. */
export const MB = 1024 * 1024;
/** Ohne Messwert gilt die bisherige Grenze. */
export const GRUND_GRENZE = 20 * MB;
/** Der gemeinsame Pro-Tresor-Baustein überträgt in einem Stück; dort bleibt es bei 20 MB, die Messung kann nur senken. */
export const PRO_TRESOR_GRENZE = 20 * MB;
export const GRENZ_STUFEN = [
  { bisRamGB: 3, bytes: 15 * MB, text: "unter 3 GB Arbeitsspeicher" },
  { bisRamGB: 6, bytes: 20 * MB, text: "3 bis 6 GB Arbeitsspeicher" },
  { bisRamGB: Infinity, bytes: 40 * MB, text: "ab 6 GB Arbeitsspeicher" },
] as const;
export const HOECHSTE_GRENZE = 40 * MB;
/** 300 dpi auf der langen A4-Seite (297 mm = 11,69 Zoll). */
export const MIN_KANTE_300DPI = 3508;
export const OCR_RICHTWERT = 0.98;

export type GeraeteMessung = { ramGB?: number; ramMindGB?: number; quelle?: string };
export type Grenze = { bytes: number; grund: string; gemessen: boolean };

export function sichereGroesse(messung?: GeraeteMessung | null, proTresor = false): Grenze {
  const ram = messung?.ramGB ?? messung?.ramMindGB;
  let grenze: Grenze;
  if (!ram || !Number.isFinite(ram) || ram <= 0) grenze = { bytes: GRUND_GRENZE, grund: "ohne Messwert", gemessen: false };
  else {
    const stufe = GRENZ_STUFEN.find((s) => ram < s.bisRamGB) || GRENZ_STUFEN[GRENZ_STUFEN.length - 1];
    grenze = { bytes: stufe.bytes, grund: stufe.text, gemessen: true };
  }
  if (proTresor && grenze.bytes > PRO_TRESOR_GRENZE) grenze = { ...grenze, bytes: PRO_TRESOR_GRENZE, grund: `${grenze.grund}, Pro-Tresor höchstens 20 MB` };
  return grenze;
}

let letzteMessung: GeraeteMessung | null = null;
type GeraetFenster = { ProGeraet?: { messen: (o?: { neu?: boolean }) => Promise<GeraeteMessung> } };
/** Liest die gemerkte Messung (die Geräteprüfung hält sie 30 Tage); misst nur, wenn noch keine da ist. */
export async function grenzeMessen(): Promise<Grenze> {
  try {
    const geraet = typeof window === "undefined" ? undefined : (window as unknown as GeraetFenster).ProGeraet;
    if (geraet) letzteMessung = await geraet.messen();
  } catch { /* ohne Messung gilt die Grundgrenze */ }
  return aktuelleGrenze();
}
export const aktuelleGrenze = (proTresor = false) => sichereGroesse(letzteMessung, proTresor);
/** Nur für Proben. */
export function messungSetzen(messung: GeraeteMessung | null) { letzteMessung = messung; }

export const mbText = (bytes: number) => `${(bytes / MB).toLocaleString("de-DE", { maximumFractionDigits: bytes < 10 * MB ? 1 : 0 })} MB`;

/** Stufen fürs Verkleinern eines Bildes: erst Qualität ohne Auflösungsverlust, dann kleinere Kante, nie unter 300 dpi (A4). */
export function verkleinerStufen(breite: number, hoehe: number): Array<{ kante: number; qualitaet: number }> {
  const lang = Math.max(breite, hoehe);
  const stufen: Array<{ kante: number; qualitaet: number }> = [{ kante: lang, qualitaet: 0.8 }, { kante: lang, qualitaet: 0.72 }];
  if (lang <= MIN_KANTE_300DPI) return stufen;
  for (let kante = Math.floor(lang * 0.85); kante > MIN_KANTE_300DPI; kante = Math.floor(kante * 0.85)) stufen.push({ kante, qualitaet: 0.8 });
  stufen.push({ kante: MIN_KANTE_300DPI, qualitaet: 0.8 }, { kante: MIN_KANTE_300DPI, qualitaet: 0.72 });
  return stufen;
}

export function woerter(text: string): string[] {
  return (text.toLocaleLowerCase("de").match(/[\p{L}\p{N}]{3,}/gu) || []);
}
/** Anteil der Wörter des Originals, die die verkleinerte Fassung ebenfalls erkennt (gezählt mit Vielfachheit). */
export function trefferQuote(original: string, klein: string): { quote: number; original: number; klein: number } {
  const a = woerter(original), b = woerter(klein);
  if (!a.length) return { quote: 1, original: 0, klein: b.length };
  const vorrat = new Map<string, number>();
  for (const w of b) vorrat.set(w, (vorrat.get(w) || 0) + 1);
  let treffer = 0;
  for (const w of a) { const n = vorrat.get(w) || 0; if (n > 0) { treffer++; vorrat.set(w, n - 1); } }
  return { quote: treffer / a.length, original: a.length, klein: b.length };
}
/** Unter 20 erkannten Wörtern ist das Bild kein Textdokument; dann gibt es nichts zu schützen. */
export const textGeprueft = (q: { quote: number; original: number }) => q.original < 20 || q.quote >= OCR_RICHTWERT;

export function verkleinertNotiz(vonBytes: number, q: { original: number }) {
  return `verkleinert von ${mbText(vonBytes)}, ${q.original < 20 ? "kein Text im Bild" : "Text geprüft"}`;
}
