// B5 (Rückmeldung 09.11.): Alle „?“-Texte in einer Form – Hauptpunkt fett, darunter kurze Punkte statt Fließtext.
// Reine Rechnung ohne DOM: aus einem Text wird { kern, punkte }. Texte mit eigenen Punkten („• …“ oder „- …“ je Zeile)
// behalten sie; sonst wird nach Sätzen geteilt: der erste Satz ist der Kern, jeder weitere ein Punkt.
// **so** markiert eine fette Stelle innerhalb eines Satzes.

export type HinweisTeile = { kern: string; punkte: string[] };

const PUNKT = /^\s*(?:[•·▪◦]|-|–)\s+/;
// Satzende: . ! ? oder : vor Leerraum und einem Großbuchstaben, Anführungszeichen oder einer Ziffer.
// Abkürzungen wie „z. B.“, „ca.“, „Nr.“, „bzw.“ und Ordnungszahlen („3. Schritt“) teilen nicht.
const ABKUERZUNG = /(?:\b(?:z|d|u|o|s|v|i|bzw|ca|Nr|Dr|Prof|ggf|evtl|inkl|zzgl|usw|etc|vgl|max|min|Std|Min|Fr|Hr|St|Abs)|\b\d{1,2})\.$/i;

export function saetze(text: string): string[] {
  const teile: string[] = [];
  let rest = text.replace(/\s+/g, " ").trim();
  const muster = /([.!?])\s+(?=[A-ZÄÖÜ„"“(0-9])/g;
  let anfang = 0, m: RegExpExecArray | null;
  while ((m = muster.exec(rest))) {
    const bis = m.index + 1;
    const kandidat = rest.slice(anfang, bis);
    if (m[1] === "." && ABKUERZUNG.test(kandidat)) continue;
    teile.push(kandidat.trim()); anfang = bis;
  }
  rest = rest.slice(anfang).trim();
  if (rest) teile.push(rest);
  return teile.filter(Boolean);
}

export function hinweisTeile(text: string): HinweisTeile {
  const zeilen = String(text || "").split(/\n+/).map((z) => z.trim()).filter(Boolean);
  if (zeilen.some((z) => PUNKT.test(z))) {
    const kern = zeilen.filter((z) => !PUNKT.test(z)).join(" ");
    return { kern, punkte: zeilen.filter((z) => PUNKT.test(z)).map((z) => z.replace(PUNKT, "")) };
  }
  const s = saetze(zeilen.join(" "));
  return { kern: s[0] || "", punkte: s.slice(1) };
}

/** „**fett**“ in Stücke teilen: gerade Indizes normal, ungerade fett. */
export function fettStuecke(text: string): string[] {
  return text.split("**");
}
