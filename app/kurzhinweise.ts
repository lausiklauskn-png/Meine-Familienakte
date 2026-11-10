/**
 * Kurzhinweise an Knöpfen (Nutzerwunsch 2026-11-04): „Manche Knöpfe brauchen eine kurze Info, was das bedeutet. Wer sie
 * nicht haben will, schaltet sie in der Hilfe aus.“
 *
 * - An (Vorgabe): Tooltips (Klaus 10.11.2026): Maus (oder Stift) kurz über einem Knopf zeigt eine eigene Blase mit seinem
 *   Hinweis – in der Android-App (dort zeigt der Browser „title“ nie, z. B. mit Maus unter DeX), unter Windows und im
 *   Browser gleich. Der Hinweis des Browsers wird solange zurückgehalten, damit nichts doppelt erscheint. Kein langer Druck
 *   mehr (bis 2.28.56): ein zu kurzer Druck löste den Knopf aus. Ohne „title“ zeigt ein reiner Symbol-Knopf sein aria-label.
 * - Aus: Hinweistexte werden in `data-fa-titel` zurückgehalten (auch für später erscheinende Knöpfe) und beim
 *   Einschalten zurückgegeben. `aria-label` bleibt immer, Vorleser verlieren nichts.
 */
const SCHLUESSEL = "familienakte-kurzhinweise";
const EREIGNIS = "familienakte:kurzhinweise";
const WARTE_MS = 500;
const KNOPF = "button, a, [role=button], summary, label";

export function kurzhinweiseAn(): boolean {
  try { return localStorage.getItem(SCHLUESSEL) !== "aus"; } catch { return true; }
}

export function setKurzhinweise(an: boolean) {
  try { localStorage.setItem(SCHLUESSEL, an ? "an" : "aus"); } catch { /* ohne Speicher gilt es bis zum Neuladen */ }
  anwenden(an);
  window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: an }));
}

export function aufKurzhinweise(fn: (an: boolean) => void) {
  const h = (e: Event) => fn((e as CustomEvent<boolean>).detail);
  window.addEventListener(EREIGNIS, h);
  return () => window.removeEventListener(EREIGNIS, h);
}

let beobachter: MutationObserver | null = null;
let aktiv = true;

function zurueckhalten(wurzel: ParentNode) {
  wurzel.querySelectorAll<HTMLElement>("[title]").forEach((el) => { el.setAttribute("data-fa-titel", el.getAttribute("title") || ""); el.removeAttribute("title"); });
}
function zurueckgeben() {
  document.querySelectorAll<HTMLElement>("[data-fa-titel]").forEach((el) => { el.setAttribute("title", el.getAttribute("data-fa-titel") || ""); el.removeAttribute("data-fa-titel"); });
}

function anwenden(an: boolean) {
  verlassen();
  aktiv = an;
  if (an) { beobachter?.disconnect(); beobachter = null; zurueckgeben(); return; }
  zurueckhalten(document);
  if (!beobachter) {
    beobachter = new MutationObserver((liste) => {
      for (const m of liste) {
        if (m.type === "attributes" && m.target instanceof HTMLElement && m.target.hasAttribute("title")) zurueckhalten(m.target.parentElement || document);
        m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) { if (n.hasAttribute("title")) zurueckhalten(n.parentElement || document); zurueckhalten(n); } });
      }
    });
    beobachter.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["title"] });
  }
}

let blase: HTMLDivElement | null = null;
function blaseWeg() { blase?.remove(); blase = null; }
function blaseZeigen(el: HTMLElement, text: string) {
  blaseWeg();
  const r = el.getBoundingClientRect();
  blase = document.createElement("div");
  blase.className = "kurzhinweis-blase";
  blase.setAttribute("role", "tooltip");
  blase.textContent = text;
  document.body.appendChild(blase);
  const b = blase.getBoundingClientRect();
  const links = Math.max(8, Math.min(r.left + r.width / 2 - b.width / 2, window.innerWidth - b.width - 8));
  // Unter dem Knopf, wie üblich; passt es dort nicht, darüber.
  const oben = r.bottom + 8 + b.height <= window.innerHeight - 8 ? r.bottom + 8 : Math.max(8, r.top - b.height - 8);
  blase.style.left = `${links}px`; blase.style.top = `${oben}px`;
}

/** Knopf, über dem die Maus gerade steht; sein „title“ liegt solange in data-fa-hinweis. */
let ueber: HTMLElement | null = null;
let uhr = 0;
const glatt = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();
/** Tooltip vor allem für Knöpfe ohne Beschriftung (Klaus 10.11.); einer, der nur die Beschriftung wiederholt, entfällt. */
function hinweisVon(el: HTMLElement): string {
  const sichtbar = glatt(el.innerText || "");
  const t = el.getAttribute("title")?.trim();
  if (t) return glatt(t) === sichtbar ? "" : t;
  // Reiner Symbol-Knopf ohne Hinweis: sein Vorlese-Name.
  return sichtbar ? "" : (el.getAttribute("aria-label") || "").trim();
}
function verlassen() {
  window.clearTimeout(uhr); blaseWeg();
  const el = ueber; ueber = null;
  if (el && el.dataset.faHinweis !== undefined) { if (aktiv && !el.hasAttribute("title")) el.setAttribute("title", el.dataset.faHinweis); delete el.dataset.faHinweis; }
}

/** Einmal beim Start aufrufen. */
export function initKurzhinweise() {
  if (typeof document === "undefined") return;
  anwenden(kurzhinweiseAn());
  document.addEventListener("pointerover", (e) => {
    if (!aktiv || e.pointerType === "touch") return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(KNOPF);
    if (el === ueber) return;
    verlassen();
    if (!el) return;
    const text = hinweisVon(el);
    if (!text) return;
    ueber = el;
    if (el.hasAttribute("title")) { el.dataset.faHinweis = el.getAttribute("title") || ""; el.removeAttribute("title"); }
    uhr = window.setTimeout(() => { if (ueber === el && el.isConnected) blaseZeigen(el, text); }, WARTE_MS);
  }, true);
  document.addEventListener("pointerout", (e) => {
    if (!ueber) return;
    const nach = e.relatedTarget;
    if (nach instanceof Node && ueber.contains(nach)) return;
    verlassen();
  }, true);
  for (const n of ["pointerdown", "keydown", "scroll", "blur"]) (n === "blur" ? window : document).addEventListener(n, verlassen, true);
}
