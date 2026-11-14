// Ansicht 👁 im Pseudo-Fenster (Klaus 14.11.: „echtes Seitenbild mit den verdeckten Stellen an ihrem Platz“): Aus der Textlage einer
// PDF-Seite (pdf.js getTextContent) werden Kästen für die verdeckten Werte berechnet – in Prozent der Seite, damit sie über dem
// gezeichneten Seitenbild liegen. Zeilen werden zusammengesetzt, weil ein Wert (IBAN, Name) oft über mehrere Textstücke läuft.
// Reine Rechnung ohne DOM (Probe scripts/run-pseudo-auftraege-tests.mjs).

/** Ein Textstück der Seite, schon in Seitenprozent: x/y = linke obere Ecke. */
export type TextStueck = { str: string; x: number; y: number; w: number; h: number };
export type Wert = { token: string; klar: string };
export type Kasten = { token: string; x: number; y: number; w: number; h: number };

const norm = (s: string) => s.replace(/\s+/g, " ");

/** Kästen für alle Vorkommen der Werte auf einer Seite. Werte mit Zeilenumbruch werden je Zeile gesucht. */
export function kaestenFuerSeite(stuecke: TextStueck[], werte: Wert[]): Kasten[] {
  // Zeilen: Stücke mit ähnlicher Oberkante (halbe Höhe Toleranz), links nach rechts.
  const sortiert = stuecke.filter((s) => s.str).slice().sort((a, b) => a.y - b.y || a.x - b.x);
  const zeilen: TextStueck[][] = [];
  for (const s of sortiert) {
    const z = zeilen.find((l) => Math.abs(l[0].y - s.y) <= Math.max(0.3, Math.min(l[0].h, s.h) / 2));
    if (z) z.push(s); else zeilen.push([s]);
  }
  const aus: Kasten[] = [];
  for (const z of zeilen) {
    z.sort((a, b) => a.x - b.x);
    // Zeilentext mit Lage je Zeichen: [stück, index im stück] (Lücke = Leerzeichen ohne Stück).
    let text = ""; const lage: Array<[number, number] | null> = [];
    z.forEach((s, i) => {
      if (i > 0) { const vor = z[i - 1]; if (s.x - (vor.x + vor.w) > 0.2 && !/\s$/.test(text) && !/^\s/.test(s.str)) { text += " "; lage.push(null); } }
      for (let k = 0; k < s.str.length; k++) { text += s.str[k]; lage.push([i, k]); }
    });
    const zeile = norm(text);
    // norm() ändert nur Längen von Leerzeichen-Folgen; Lage neu zuordnen.
    const karte: Array<[number, number] | null> = [];
    for (let k = 0, vorLeer = false; k < text.length; k++) { const leer = /\s/.test(text[k]); if (leer && vorLeer) continue; karte.push(lage[k]); vorLeer = leer; }
    for (const w of werte) {
      for (const teil of w.klar.split(/\n+/).map((t) => norm(t).trim()).filter((t) => t.length >= 2)) {
        let ab = 0;
        for (;;) {
          const i = zeile.indexOf(teil, ab);
          if (i < 0) break;
          ab = i + teil.length;
          const bis = i + teil.length - 1;
          const a = karte.slice(i, bis + 1).find(Boolean); const e = karte.slice(i, bis + 1).reverse().find(Boolean);
          if (!a || !e) continue;
          const sa = z[a[0]], se = z[e[0]];
          const x1 = sa.x + sa.w * (a[1] / Math.max(1, sa.str.length));
          const x2 = se.x + se.w * ((e[1] + 1) / Math.max(1, se.str.length));
          const ys = z.slice(a[0], e[0] + 1);
          const y = Math.min(...ys.map((s) => s.y)); const h = Math.max(...ys.map((s) => s.y + s.h)) - y;
          aus.push({ token: w.token, x: x1, y, w: Math.max(0.5, x2 - x1), h });
        }
      }
    }
  }
  return aus;
}
