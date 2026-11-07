import { useState, type ReactNode } from "react";

/**
 * Flussbaum (Klaus 07.11.2026): ein Baum quer, Mitte als Stamm, links was hereinkommt, rechts wohin es weitergeht.
 * Die Pfeile sitzen auf den Ästen: einfacher Pfeil = Daten gehen nur in diese Richtung, Doppelpfeil = hin und zurück.
 * Ein Tipp auf einen Kasten hebt seinen Weg bis zur Mitte hervor und zeigt darunter, was dort geschieht.
 * Gedacht auch für den späteren Strukturbaum der ganzen App (Plan Sitzung 4).
 */
export type FlussStand = "heute" | "geplant" | "spaeter" | "nicht";
export type FlussAst = {
  id: string;
  titel: string;
  unter?: string;
  /** Mehr zum Kasten, erscheint nach dem Tipp. */
  mehr?: string;
  stand?: FlussStand;
  /** "hin" = Daten fließen nur in Leserichtung (links: zur Mitte, rechts: von der Mitte weg), "beide" = hin und zurück. */
  richtung?: "hin" | "beide";
  warnung?: boolean;
  ziel?: () => void;
  zielText?: string;
  kinder?: FlussAst[];
};

const STAND_WORT: Record<FlussStand, string> = { heute: "geht heute", geplant: "geplant", spaeter: "später", nicht: "nicht ohne Entscheidung" };

function suche(aeste: FlussAst[], id: string, weg: string[] = []): string[] | null {
  for (const a of aeste) {
    if (a.id === id) return [...weg, a.id];
    const t = a.kinder && suche(a.kinder, id, [...weg, a.id]);
    if (t) return t;
  }
  return null;
}
function finde(aeste: FlussAst[], id: string): FlussAst | null {
  for (const a of aeste) { if (a.id === id) return a; const t = a.kinder && finde(a.kinder, id); if (t) return t; }
  return null;
}

export function Flussbaum({ label, mitte, links, rechts, legende }: { label: string; mitte: FlussAst; links: FlussAst[]; rechts: FlussAst[]; legende?: ReactNode }) {
  const [aktiv, setAktiv] = useState<string | null>(null);
  const seite = aktiv ? (suche(links, aktiv) ? "links" : suche(rechts, aktiv) ? "rechts" : aktiv === mitte.id ? "mitte" : null) : null;
  const weg = new Set(aktiv ? (seite === "links" ? suche(links, aktiv) : seite === "rechts" ? suche(rechts, aktiv) : [mitte.id]) || [] : []);
  const gewaehlt = aktiv ? (aktiv === mitte.id ? mitte : finde(links, aktiv) || finde(rechts, aktiv)) : null;
  const wechsel = (id: string) => setAktiv((alt) => alt === id ? null : id);

  const kasten = (a: FlussAst, mitteKasten = false) => {
    const klassen = ["ablauf-knoten", "ablauf-link", "fb-kasten", `fb-${a.stand || "heute"}`];
    if (a.warnung) klassen.push("art-warnung");
    if (mitteKasten) klassen.push("art-hervor");
    if (weg.has(a.id)) klassen.push("fb-an");
    return <button type="button" className={klassen.join(" ")} data-fluss-id={a.id} aria-pressed={aktiv === a.id}
      aria-label={`${a.titel}${a.stand && a.stand !== "heute" ? ` (${STAND_WORT[a.stand]})` : ""} – Weg zeigen`} onClick={() => wechsel(a.id)}>
      <span className="ablauf-text"><strong>{a.titel}</strong>{a.unter && <small>{a.unter}</small>}</span>
      {a.stand && a.stand !== "heute" && <span className={`fb-chip fb-chip-${a.stand}`}>{STAND_WORT[a.stand]}</span>}
    </button>;
  };
  const ast = (a: FlussAst, rechtsSeite: boolean): ReactNode => <div key={a.id} className={`fb-ast${weg.has(a.id) ? " fb-an" : ""}`} data-fluss-ast={a.id}>
    <span className={`fb-linie fb-${a.richtung || "hin"}`} data-richtung={a.richtung || "hin"} aria-hidden="true"/>
    {kasten(a)}
    {a.kinder?.length ? <div className="fb-kinder">{a.kinder.map((k) => ast(k, rechtsSeite))}</div> : null}
  </div>;

  return <div className="flussbaum-rahmen" data-flussbaum>
    {legende}
    <div className="flussbaum-scroll">
      <div className="flussbaum" role="group" aria-label={label}>
        <div className="fb-seite fb-links">{links.map((a) => ast(a, false))}</div>
        <div className={`fb-mitte${weg.has(mitte.id) || seite ? " fb-an" : ""}`}>{kasten(mitte, true)}</div>
        <div className="fb-seite fb-rechts">{rechts.map((a) => ast(a, true))}</div>
      </div>
    </div>
    <div className="fb-info" aria-live="polite" data-fluss-info={gewaehlt?.id || ""}>
      {gewaehlt ? <>
        <strong>{gewaehlt.titel}</strong>
        {gewaehlt.stand && <span className={`fb-chip fb-chip-${gewaehlt.stand}`}>{STAND_WORT[gewaehlt.stand]}</span>}
        {gewaehlt.unter && <p>{gewaehlt.unter}</p>}
        {gewaehlt.mehr && <p>{gewaehlt.mehr}</p>}
        {gewaehlt.id !== mitte.id && <p className="fb-richtung">{gewaehlt.richtung === "beide" ? "⇄ Hier gehen Daten hin und zurück." : seite === "links" ? `→ Daten gehen nur in Richtung ${mitte.titel}.` : `→ Daten gehen nur in diese Richtung weiter.`}</p>}
        {gewaehlt.ziel && <button type="button" className="button secondary" onClick={gewaehlt.ziel}>{gewaehlt.zielText || "Hingehen"} ›</button>}
      </> : <span className="fb-tipp">Tipp auf einen Kasten zeigt seinen Weg und was dort geschieht.</span>}
    </div>
  </div>;
}
