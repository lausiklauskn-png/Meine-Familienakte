import type { ReactNode } from "react";

/**
 * Erklärungen auf einen Blick (Nutzerwunsch 2026-11-04): Kästchen mit Linien wie in einem Ablaufplan, eine
 * Pfadangabe und ein Ordnerbaum. Kästchen mit Ziel sind Knöpfe: ein Tipp springt zur passenden Stelle.
 */
export type AblaufKnoten = {
  titel: string;
  unter?: string;
  /** CSS-Selektor einer Stelle auf derselben Seite, oder eine Funktion (z. B. Seitenwechsel). */
  ziel?: string | (() => void);
  art?: "normal" | "hervor" | "warnung" | "gut";
};

/** Zur Stelle springen, kurz markieren und fokussieren. Fehlt sie, passiert nichts. */
export function zurStelle(ziel: string | (() => void)) {
  if (typeof ziel === "function") { ziel(); return; }
  const el = document.querySelector<HTMLElement>(ziel);
  if (!el) return;
  // Liegt die Stelle in einem eingeklappten Bereich (oder ist selbst einer), wird er geöffnet.
  for (let d: HTMLElement | null = el; d; d = d.parentElement) if (d instanceof HTMLDetailsElement) d.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus?.({ preventScroll: true });
  el.classList.add("ablauf-ziel");
  window.setTimeout(() => el.classList.remove("ablauf-ziel"), 1800);
}

function Knoten({ k, nummer }: { k: AblaufKnoten; nummer?: number }) {
  const inhalt = <>{nummer !== undefined && <span className="ablauf-nr" aria-hidden="true">{nummer}</span>}<span className="ablauf-text"><strong>{k.titel}</strong>{k.unter && <small>{k.unter}</small>}</span></>;
  const klasse = `ablauf-knoten art-${k.art || "normal"}`;
  return k.ziel
    ? <button type="button" className={`${klasse} ablauf-link`} onClick={() => zurStelle(k.ziel!)} title={`${k.titel} – hierhin springen`}>{inhalt}<span className="ablauf-pfeil" aria-hidden="true">›</span></button>
    : <div className={klasse}>{inhalt}</div>;
}

/** Schritte nacheinander, mit Linien verbunden (quer auf breiten Schirmen, untereinander am Handy). */
export function Ablaufbild({ knoten, label }: { knoten: AblaufKnoten[]; label: string }) {
  return <ol className="ablaufbild" aria-label={label} data-ablaufbild>
    {knoten.map((k, i) => <li key={k.titel}><Knoten k={k} nummer={i + 1}/></li>)}
  </ol>;
}

/** Pfadangabe „Dokumente › Sicherheit … › …“; Teile mit Ziel sind antippbar. */
export function Pfad({ teile, label = "Weg in der App" }: { teile: { text: string; ziel?: string | (() => void) }[]; label?: string }) {
  return <nav className="pfadangabe" aria-label={label}><ol>
    {teile.map((t) => <li key={t.text}>{t.ziel ? <button type="button" onClick={() => zurStelle(t.ziel!)}>{t.text}</button> : <span>{t.text}</span>}</li>)}
  </ol></nav>;
}

export type BaumKnoten = AblaufKnoten & { kinder?: BaumKnoten[] };

/** Ordnerbaum mit Verbindungslinien. */
export function OrdnerBaum({ wurzel, label }: { wurzel: BaumKnoten; label: string }) {
  const zweig = (k: BaumKnoten): ReactNode => <li key={k.titel}><Knoten k={k}/>{k.kinder?.length ? <ul>{k.kinder.map(zweig)}</ul> : null}</li>;
  return <ul className="ordnerbaum" aria-label={label} data-ordnerbaum>{zweig(wurzel)}</ul>;
}
