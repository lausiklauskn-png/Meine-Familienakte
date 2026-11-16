import type { Wert } from "./typen.ts";
import { englischesFeld, nameAusZeile, ocrRand } from "./erkennen.ts";
import { ABSENDERWAHL } from "./absenderwahl-daten.ts";

/**
 * Gelernte Wahl des Absenders unter den Kandidaten-Zeilen eines Schriftstücks (Rekursive Verbesserung, 15.11.2026,
 * docs/PRUEFSTAPEL-REKURSIV-REGELN.md). Greift nur, wenn die festen Regeln keinen sicheren Absender finden. Kandidaten sind
 * Namen aus den Zeilen des Kopfs und der Fußzeile sowie die Vorschläge der Regeln; jede Zeile bekommt Merkmale (Lage, Firmenwörter,
 * Anschrift darunter, Impressum, nach der Grußformel, Betreff- oder Empfängerart …), ein lineares Modell (gemitteltes Perzeptron,
 * gelernt aus Korrekturen: falsch gewählt → Gewichte zur richtigen Zeile hin) wählt. Gelernt von scripts/absenderwahl-lernen.mjs.
 */
export interface Absenderwahl { fassung: number; gewichte: Record<string, number> }

const norm = (s: string | null | undefined) => s == null || s === "" ? "" : String(s).toLowerCase().replace(/\b(gmbh|ag|e\.?\s?k\.?|kg|ohg|mbh|e\.?\s?v\.?|co\.?|&|und)\b/g, " ").replace(/[^a-zäöüß0-9]+/g, " ").trim();
const ADR = /\b\d{5}\b|postfach|straße|strasse|str\.|weg\s*\d|platz\s*\d|gasse|allee/i;
/** US-Anschriftzeile „San Francisco, CA 94104“ (15.11.2026): ein Ort, kein Absender. */
const US_ORT = /,\s*[A-Z]{2}\s+\d{5}(-\d{4})?\s*$/;
const IMPRESSUM = /\b(hrb|hra|amtsgericht|registergericht|ust-?id|steuernummer|geschäftsführ|vorstand|sitz der gesellschaft|bankverbindung)\b/i;
const GRUSS = /(grüße|grüßen|gruß|grüsse|hochachtungsvoll|herzlichst)/i;

interface Kandidat { wert: string; i: number; zeile: string; fuss: boolean }
export function absenderKandidaten(text: string): { zeilen: string[]; k: Map<string, Kandidat> } {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean), n = zeilen.length, k = new Map<string, Kandidat>();
  zeilen.forEach((z, i) => {
    if (i >= 25 && i < n - 10) return;
    for (const fuss of [false, true]) {
      let c = ""; try { c = nameAusZeile(ocrRand(z), fuss); } catch { c = ""; }
      if (c && c.length >= 3 && c.length <= 80 && !englischesFeld(c) && !US_ORT.test(z)) { const key = norm(c); if (key && !k.has(key)) k.set(key, { wert: c, i, zeile: z, fuss }); }
    }
  });
  return { zeilen, k };
}
export function kandidatMerkmale(c: Kandidat, zeilen: string[], regel: { kopf?: Wert; gruss?: Wert }): string[] {
  const f: string[] = [], n = zeilen.length, i = c.i, z = c.zeile, w = c.wert;
  const oben = i < 25, pos = oben ? "o" + Math.min(i, 12) : "u" + Math.min(n - 1 - i, 9);
  f.push("pos:" + pos, "fuss:" + c.fuss);
  const woerter = w.toLowerCase().match(/[a-zäöüß]{3,}/g) || [];
  for (const t of woerter) f.push("w:" + t);
  if (woerter[0]) f.push("w0:" + woerter[0]);
  f.push("len:" + Math.min(w.split(/\s+/).length, 6));
  if (/\d/.test(w)) f.push("ziffer");
  if (w === w.toUpperCase() && /[A-ZÄÖÜ]{3}/.test(w)) f.push("gross");
  if (/^(herr|frau|herrn|familie|an)\b/i.test(z)) f.push("empf");
  if (/ - |·|\|/.test(z) && ADR.test(z)) f.push("zeileMitAdresse");
  if (ADR.test(zeilen[i + 1] || "") || ADR.test(zeilen[i + 2] || "")) f.push("adrDarunter");
  if (IMPRESSUM.test(z)) f.push("impressum");
  if (IMPRESSUM.test(zeilen.slice(Math.max(0, i - 2), i + 3).join(" "))) f.push("impressumNah");
  if (GRUSS.test(zeilen[i - 1] || "") || GRUSS.test(zeilen[i - 2] || "")) f.push("nachGruss");
  if (/^(betreff|betr|ihre?|unser|zur|zum|vom|nr|rechnung|mahnung|bescheid|kündigung)\b/i.test(w)) f.push("betreffartig");
  if (/^[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+$/.test(w)) f.push("personartig");
  if (regel.kopf && norm(regel.kopf.wert) === norm(w)) f.push("rk", "rk:" + regel.kopf.sicher);
  if (regel.gruss && norm(regel.gruss.wert) === norm(w)) f.push("rg", "rg:" + regel.gruss.sicher);
  if (!regel.kopf && !regel.gruss) f.push("keineRegel");
  if (oben && regel.kopf) f.push("pos+rk:" + pos);
  return f;
}
/** Alle Kandidaten mit Merkmalen (auch zum Lernen). */
export function absenderBeispiele(text: string, regel: { kopf?: Wert; gruss?: Wert }): Array<{ key: string; wert: string; f: string[] }> {
  const { zeilen, k } = absenderKandidaten(text);
  for (const r of [regel.kopf, regel.gruss]) if (r?.wert && !k.has(norm(r.wert))) k.set(norm(r.wert), { wert: r.wert, i: 0, zeile: r.wert, fuss: false });
  return [...k.entries()].map(([key, c]) => ({ key, wert: c.wert, f: kandidatMerkmale(c, zeilen, regel) }));
}
export function absenderWaehlen(text: string, regel: { kopf?: Wert; gruss?: Wert }, modell: Absenderwahl = ABSENDERWAHL as Absenderwahl): Wert | undefined {
  const liste = absenderBeispiele(text, regel);
  let best: (typeof liste)[number] | undefined, bs = -Infinity;
  for (const x of liste) { const s = x.f.reduce((a, y) => a + (modell.gewichte[y] || 0), 0); if (s > bs) { bs = s; best = x; } }
  if (!best) return undefined;
  return { wert: best.wert, sicher: false, grund: "gelernte Wahl unter den Zeilen des Schriftstücks", quelle: "regel" };
}
