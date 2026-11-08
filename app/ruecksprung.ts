/**
 * Rücksprung mit Markierung (Plan 07.11.2026, Punkt 4): Beim Weggehen merkt sich die Ansicht, was zuletzt angetippt war
 * und welche Abschnitte offen standen. Beim Zurückkommen klappt sie diese wieder auf, holt die Stelle in die Bildmitte
 * und markiert sie bis zum nächsten Tipp. Findet sich die Stelle nicht mehr (Liste geändert), bleibt es bei der Scroll-Höhe.
 */
export type Ruecksprung = { ziel: string | null; offen: string[] };

const WURZEL = "main.site-main";
const KANDIDAT = "[data-hilfe-thema] > summary, [data-sicherung-punkt], [data-sicherung-ziel], button, a, summary, [role=button], [tabindex]";
let letzterTipp: Element | null = null;
let installiert = false;

function wurzel() { return document.querySelector<HTMLElement>(WURZEL); }

/** Ein stabiler Weg von der Inhaltswurzel zum Element: Kennungen und data-Merkmale zuerst, sonst Stelle unter Geschwistern. */
export function pfadVon(el: Element, root = wurzel()): string | null {
  if (!root || !root.contains(el) || el === root) return null;
  const teile: string[] = [];
  for (let e: Element | null = el; e && e !== root; e = e.parentElement) {
    if (e.id && /^[A-Za-z][\w-]*$/.test(e.id)) { teile.unshift(`#${e.id}`); return teile.join(" > "); }
    const merkmal = ["data-hilfe-id", "data-hilfe-thema", "data-kartenhilfe-eintrag", "data-abnahme-frage", "data-sicherung-punkt", "data-sicherung-ziel", "data-klapp"].find((a) => e!.hasAttribute(a));
    if (merkmal) { const wert = e.getAttribute(merkmal) || ""; if (!/["\\\]]/.test(wert)) { teile.unshift(`${e.tagName.toLowerCase()}[${merkmal}${wert ? `="${wert}"` : ""}]`); continue; } }
    const tag = e.tagName.toLowerCase(), eltern = e.parentElement;
    const n = eltern ? [...eltern.children].filter((k) => k.tagName === e!.tagName).indexOf(e) + 1 : 1;
    teile.unshift(`${tag}:nth-of-type(${n})`);
  }
  return `${WURZEL} > ${teile.join(" > ")}`;
}

export function tippMerken() {
  if (installiert || typeof document === "undefined") return;
  installiert = true;
  const merken = (event: Event) => {
    if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return;
    const t = event.target instanceof Element ? event.target.closest(KANDIDAT) : null;
    // Der Pfad oben steht fest (sticky): ein Tipp darauf ist keine Stelle der Seite, die Scrollhöhe genügt (W15).
    if (t && wurzel()?.contains(t) && !t.closest(".breadcrumb")) letzterTipp = t;
  };
  document.addEventListener("pointerdown", merken, true);
  document.addEventListener("keydown", merken, true);
}

export function markeErstellen(): Ruecksprung | null {
  const root = wurzel(); if (!root) return null;
  const ziel = letzterTipp && letzterTipp.isConnected ? pfadVon(letzterTipp, root) : null;
  const offen = [...root.querySelectorAll("details[open]")].map((d) => pfadVon(d, root)).filter((p): p is string => Boolean(p));
  return ziel || offen.length ? { ziel, offen } : null;
}

function finden(pfad: string) { try { return document.querySelector<HTMLElement>(pfad); } catch { return null; } }

let aufheben: (() => void) | null = null;
/** Markierung bis zum nächsten Tipp oder Tastendruck. */
export function markieren(el: HTMLElement, klasse = "zurueck-hier") {
  aufheben?.();
  el.classList.add(klasse);
  // React setzt className bei jedem Neuzeichnen neu (z. B. wenn der Eintrag gleich aufklappt): Marke bis zum nächsten Tipp halten.
  const halten = typeof MutationObserver !== "undefined" ? new MutationObserver(() => { if (!el.classList.contains(klasse)) el.classList.add(klasse); }) : null;
  halten?.observe(el, { attributes: true, attributeFilter: ["class"] });
  const weg = () => { halten?.disconnect(); el.classList.remove(klasse); document.removeEventListener("pointerdown", weg, true); document.removeEventListener("keydown", weg, true); aufheben = null; };
  // Erst nach dem eigenen Sprung scharf schalten, damit der auslösende Tipp sie nicht gleich wieder entfernt.
  window.setTimeout(() => { if (el.classList.contains(klasse)) { document.addEventListener("pointerdown", weg, true); document.addEventListener("keydown", weg, true); } }, 250);
  aufheben = weg;
}

/** Wendet die Marke an; liefert die gefundene und markierte Stelle (sonst null). */
export function markeAnwenden(marke: Ruecksprung): HTMLElement | null {
  for (const pfad of marke.offen) { const d = finden(pfad); if (d instanceof HTMLDetailsElement) d.open = true; }
  if (!marke.ziel) return null;
  const el = finden(marke.ziel);
  if (!el || !el.getClientRects().length) return null;
  for (let d: HTMLElement | null = el.parentElement; d; d = d.parentElement) if (d instanceof HTMLDetailsElement) d.open = true;
  el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  el.focus?.({ preventScroll: true });
  markieren(el);
  return el;
}
