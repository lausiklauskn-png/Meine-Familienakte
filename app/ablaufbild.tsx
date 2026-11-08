import type { ReactNode } from "react";
import { klappOeffnen } from "./klapp";

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
export function zurStelle(ziel: string | (() => void), optionen: { sofort?: boolean } = {}): boolean {
  if (typeof ziel === "function") { ziel(); return true; }
  const el = document.querySelector<HTMLElement>(ziel);
  if (!el) return false;
  zumElement(el, optionen.sofort);
  return true;
}

/** Zur Karte springen, deren „?“ den Titel trägt (InfoPopover-Label „‹Titel› erklären“). */
export function zurKarte(titel: string, optionen: { sofort?: boolean } = {}): boolean {
  const alle = [...document.querySelectorAll<HTMLElement>("main.site-main [aria-label]")].filter((e) => e.getAttribute("aria-label") === `${titel} erklären`);
  const knopf = alle.find((e) => e.getClientRects().length) || alle[0];
  const karte = knopf?.closest<HTMLElement>(".card, article, section, details") || knopf;
  if (!karte) return false;
  zumElement(karte, optionen.sofort);
  return true;
}

function zumElement(el: HTMLElement, sofort = false) {
  // Eingeklappte Abschnitte der Seite (Knopf „alle“) zuerst öffnen.
  for (let k = el.closest<HTMLElement>(".klapp-zu[data-klapp]"); k; k = k.parentElement?.closest<HTMLElement>(".klapp-zu[data-klapp]") || null) klappOeffnen(k.dataset.klapp!);
  // Liegt die Stelle in einem eingeklappten Bereich (oder ist selbst einer), wird er geöffnet.
  for (let d: HTMLElement | null = el; d; d = d.parentElement) if (d instanceof HTMLDetailsElement) d.open = true;
  rahmen(el);
  // Große Karten mit dem Anfang ins Bild, sonst wäre der Rahmen außerhalb (2.28.33).
  const gross = el.getBoundingClientRect().height > window.innerHeight * 0.7;
  // Nach einem Seitenwechsel (gemeinsamer Sprungweg) ohne weiches Rollen: kein sichtbares Hoch-Runter.
  el.scrollIntoView({ behavior: sofort ? "instant" as ScrollBehavior : "smooth", block: gross ? "start" : "center" });
  el.focus?.({ preventScroll: true });
}

let rahmenWeg: (() => void) | null = null;
/** Roter Rahmen am Ziel eines Hilfe-Sprungs (Klaus 07.11.2026): bleibt, bis man auf der Seite etwas tut (Tipp, Taste, Scrollen). */
function rahmen(el: HTMLElement) {
  rahmenWeg?.();
  // Ist am Ziel alles erledigt (data-ziel-stand="erledigt"), ist der Rahmen grün statt rot (Klaus 2026-11-07).
  el.classList.toggle("hilfe-ziel-gut", el.dataset.zielStand === "erledigt");
  el.classList.add("hilfe-ziel-rahmen");
  // Nach einem Seitenwechsel zeichnet React die Zielseite noch einmal (className neu): Rahmen bis zum Tun halten.
  const gut = el.classList.contains("hilfe-ziel-gut");
  const halten = typeof MutationObserver !== "undefined" ? new MutationObserver(() => { if (!el.classList.contains("hilfe-ziel-rahmen")) el.classList.add("hilfe-ziel-rahmen"); if (gut) el.classList.add("hilfe-ziel-gut"); }) : null;
  halten?.observe(el, { attributes: true, attributeFilter: ["class"] });
  const ereignisse = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
  const weg = () => { halten?.disconnect(); el.classList.remove("hilfe-ziel-rahmen", "hilfe-ziel-gut"); for (const e of ereignisse) document.removeEventListener(e, weg, true); window.clearTimeout(scharf); rahmenWeg = null; };
  // Erst nach dem eigenen weichen Scrollen scharf schalten, sonst nähme der auslösende Tipp den Rahmen gleich wieder weg.
  const scharf = window.setTimeout(() => { for (const e of ereignisse) document.addEventListener(e, weg, { capture: true, passive: true }); }, 600);
  rahmenWeg = weg;
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
