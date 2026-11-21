/**
 * Lesbarer Text aus einer HTML-Datei (Klaus 20.11.2026, Bild vom Tablet: unter „Erkannter Text“ standen Stilangaben und Tags,
 * als Absender „doctype html>“). Stil, Skripte, Kommentare und Tags fallen weg, Absätze werden Zeilen, Zeichen-Verweise
 * (&amp;, &auml;, &#228; …) werden Zeichen. Der Seitentitel steht vorne, weil er oft sagt, was die Seite ist. Ohne DOM, läuft
 * im Browser und in Node.
 */
const NAMEN: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", shy: "", euro: "€", sect: "§", copy: "©", reg: "®",
  auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", eacute: "é", egrave: "è", agrave: "à",
  ndash: "–", mdash: "—", hellip: "…", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", laquo: "«", raquo: "»", middot: "·", bull: "•",
};
const zeichen = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (ganz, k: string) => {
  if (k[0] === "#") { const n = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ganz; }
  return NAMEN[k] ?? ganz;
});

export function istHtml(name: string, text: string): boolean {
  return /\.(html?|xhtml)$/i.test(name) || /^\s*(<!doctype html|<html[\s>])/i.test(text.slice(0, 500));
}

export function htmlText(roh: string): string {
  const titel = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(roh)?.[1]?.replace(/<[^>]+>/g, " ").trim() || "";
  const koerper = roh
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|head|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!doctype[^>]*>/gi, " ")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|header|footer|blockquote|pre|ul|ol|dl|dt|dd|address)\s*>/gi, "\n")
    .replace(/<\/(td|th)\s*>/gi, "\t")
    .replace(/<[^>]*>/g, " ");
  const text = zeichen(koerper).replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const t = zeichen(titel).replace(/\s+/g, " ");
  return t && !text.startsWith(t) ? `${t}\n\n${text}` : text;
}
