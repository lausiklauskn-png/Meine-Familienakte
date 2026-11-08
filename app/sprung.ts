/**
 * Gemeinsamer Sprungweg (2.28.39): „Bereich öffnen → einmal zum Ziel → Ziel markieren“.
 * Statt „Seite wechseln, nach oben, per Zeitgeber wieder hinunter“ (80–500 ms) holt der Navigationsweg das Ziel direkt
 * nach dem Zeichnen ins Bild und markiert es wie die Rücksprung-Marke (bis zum nächsten Tipp).
 *
 * Ein Bereich, der eine Kennung bekommt, kennzeichnet das passende Element mit data-sprung-ziel="<Kennung>".
 * Für Bereiche mit fester Detailstelle steht der Selektor in SPRUNG_STELLE.
 */
import { klappOeffnen } from "./klapp";
import { markieren } from "./ruecksprung";
import type { SectionId } from "./portal-types";

/** Ein Ziel: CSS-Selektor einer Stelle oder eine Funktion, die true liefert, sobald sie das Ziel gefunden und gezeigt hat. */
export type Sprungziel = string | (() => boolean);
/** Zusatz zu einem Seitenwechsel: Stelle, zu der einmal gerollt und die markiert wird; Menübereich, über den man kam; Detail für den Pfad. */
export type SprungZusatz = { ziel?: Sprungziel | null; bereich?: string | null; detail?: string | null };
/** onGo mit gemeinsamem Sprungweg. */
export type GehMitZiel = (id: SectionId, targetId?: string, zusatz?: SprungZusatz) => void;

const esc = (wert: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(wert) : wert.replace(/["\\]/g, "\\$&"));
export const sprungSelektor = (kennung: string) => `[data-sprung-ziel="${esc(kennung)}"]`;

/** Bereiche, deren Detail an fester Stelle erscheint (die Kennung steht dort nicht als Merkmal). */
const SPRUNG_STELLE: Partial<Record<SectionId, (kennung: string) => string>> = {
  cockpit: () => "#cockpit-dossier",
  reminders: (kennung) => `#termin-${esc(kennung)}`,
};

/** Bereiche, die eine Kennung als Stelle zeigen (Detail, Zeile). Andere (Bibliothek: Direkttreffer oben, Assistenz: Vorgang
 * vorgewählt) bekommen die Kennung als Auswahl und öffnen oben. */
const MIT_STELLE = new Set<SectionId>(["cockpit", "reminders", "memory"]);

/** Wohin ein Sprung mit Kennung in diesem Bereich zielt (null: kein Sprung, Seite öffnet oben). */
export function zielFuerKennung(section: SectionId, kennung: string): string | null {
  // „bereich:<seite>“ filtert das Cockpit (Punkt 4) – das ist keine Akte, die Seite öffnet oben.
  if (!MIT_STELLE.has(section) || kennung.startsWith("bereich:")) return null;
  return SPRUNG_STELLE[section]?.(kennung) || sprungSelektor(kennung);
}

/** Höhe der festen Kopfzeilen (Pfad bleibt beim Scrollen stehen), damit das Ziel nicht darunter verschwindet. */
function kopfHoehe() {
  const kopf = document.querySelector<HTMLElement>(".site-header");
  const pfad = document.querySelector<HTMLElement>(".breadcrumb");
  const k = kopf && getComputedStyle(kopf).position === "sticky" ? kopf.getBoundingClientRect().height : 0;
  const p = pfad && getComputedStyle(pfad).position === "sticky" ? pfad.getBoundingClientRect().height : 0;
  return k + p + 12;
}

/** Eingeklappte Abschnitte (Knopf „alle“, <details>) rund um das Ziel öffnen. */
export function umgebungOeffnen(el: HTMLElement) {
  for (let k = el.closest<HTMLElement>(".klapp-zu[data-klapp]"); k; k = k.parentElement?.closest<HTMLElement>(".klapp-zu[data-klapp]") || null) klappOeffnen(k.dataset.klapp!);
  // Auch das Ziel selbst, wenn es ein Aufklapp-Abschnitt ist (z. B. „Akten sichern“ in der Hilfe).
  for (let d: HTMLElement | null = el; d; d = d.parentElement) if (d instanceof HTMLDetailsElement) d.open = true;
}

/** Zielhöhe: kleine Ziele in die Bildmitte, große mit ihrem Anfang unter den Pfad. */
function zielHoehe(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const frei = window.innerHeight - kopfHoehe();
  const oben = r.height > frei * 0.8 ? r.top - kopfHoehe() : r.top - kopfHoehe() - (frei - r.height) / 2;
  return Math.max(0, Math.round(window.scrollY + oben));
}

/** Liegt das Element schon vollständig (oder bei großen Elementen mit seinem Anfang) im Bild? */
export function imBild(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const kopf = kopfHoehe();
  return r.top >= kopf - 4 && (r.bottom <= window.innerHeight + 4 || (r.top < window.innerHeight * 0.6 && r.height > window.innerHeight * 0.6));
}

/** Ziel sofort zeigen (ohne weiches Rollen) und markieren. */
export function zielZeigen(el: HTMLElement, { nurWennNoetig = false, markierung = true }: { nurWennNoetig?: boolean; markierung?: boolean } = {}) {
  umgebungOeffnen(el);
  if (!nurWennNoetig || !imBild(el)) window.scrollTo({ left: 0, top: zielHoehe(el), behavior: "instant" as ScrollBehavior });
  el.focus?.({ preventScroll: true });
  if (markierung) markieren(el);
}

function finden(selektor: string) {
  try {
    const alle = [...document.querySelectorAll<HTMLElement>(selektor)];
    // Sichtbares zuerst; sonst das erste (liegt in einem zugeklappten Abschnitt, den zielZeigen öffnet).
    return alle.find((e) => e.getClientRects().length) || alle[0] || null;
  } catch { return null; }
}

/** Auf derselben Seite zu einer Stelle: einmal hin (nur wenn nötig) und markieren. */
export function hierZumZiel(ziel: string | HTMLElement | null | undefined, optionen?: { nurWennNoetig?: boolean }) {
  const el = typeof ziel === "string" ? finden(ziel) : ziel;
  if (!el) return false;
  zielZeigen(el, optionen);
  return true;
}

/** Nach einem Stand-Wechsel (setState) auf derselben Seite: im nächsten Bild zum Ziel. */
export function gleichZumZiel(selektor: string, optionen?: { nurWennNoetig?: boolean }) {
  let n = 0;
  const versuch = () => { if (hierZumZiel(selektor, optionen) || ++n > 20) return; window.requestAnimationFrame(versuch); };
  window.requestAnimationFrame(versuch);
}

/**
 * Nach einem Seitenwechsel: Ziel suchen, sobald es gezeichnet ist (höchstens 2,5 s), einmal hinrollen, markieren und
 * – solange die Seite noch wächst (Abschnitte laden nach) – an derselben Stelle halten. Jede eigene Eingabe beendet das.
 * Liefert eine Funktion zum Abbrechen.
 */
export function sprungFolgen(ziel: Sprungziel, { gefunden, nachSeitenwechsel = false }: { gefunden?: () => void; nachSeitenwechsel?: boolean } = {}): () => void {
  let fertig = false, getroffen: HTMLElement | null = null, ruhig = 0, letzte = -1, frame = 0;
  const start = performance.now();
  // Nach einem Seitenwechsel bleibt der Inhalt kurz unsichtbar, bis das Ziel gezeichnet ist (höchstens 600 ms) –
  // so sieht man nie erst den Seitenanfang und dann den Sprung nach unten.
  const html = document.documentElement;
  const zeigen = () => html.classList.remove("sprung-wartet");
  const stop = () => {
    zeigen();
    fertig = true; window.cancelAnimationFrame(frame);
    for (const e of ["wheel", "touchstart", "pointerdown", "keydown"] as const) window.removeEventListener(e, stop, true);
  };
  for (const e of ["wheel", "touchstart", "pointerdown", "keydown"] as const) window.addEventListener(e, stop, { capture: true, passive: true });
  const schritt = () => {
    if (fertig) return;
    const vergangen = performance.now() - start;
    if (vergangen > 2500) { stop(); return; }
    if (html.classList.contains("sprung-wartet") && vergangen > 600) { window.scrollTo({ left: 0, top: 0, behavior: "instant" as ScrollBehavior }); zeigen(); }
    if (typeof ziel === "function") {
      if (ziel()) { zeigen(); gefunden?.(); stop(); return; }
    } else if (!getroffen) {
      const el = finden(ziel);
      if (el) { getroffen = el; zielZeigen(el); zeigen(); gefunden?.(); }
    } else if (getroffen.isConnected) {
      // Nachführen, bis die Seite sich nicht mehr bewegt (zwei ruhige Bilder): kein sichtbares Springen.
      const soll = zielHoehe(getroffen);
      if (Math.abs(soll - window.scrollY) > 2) window.scrollTo({ left: 0, top: soll, behavior: "instant" as ScrollBehavior });
      ruhig = soll === letzte ? ruhig + 1 : 0; letzte = soll;
      if (ruhig >= 3) { stop(); return; }
    } else { stop(); return; }
    frame = window.requestAnimationFrame(schritt);
  };
  schritt();
  if (!fertig && !getroffen && nachSeitenwechsel) html.classList.add("sprung-wartet");
  return stop;
}
