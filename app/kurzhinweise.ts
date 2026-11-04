/**
 * Kurzhinweise an Knöpfen (Nutzerwunsch 2026-11-04): „Manche Knöpfe brauchen eine kurze Info, was das bedeutet. Wer sie
 * nicht haben will, schaltet sie in der Hilfe aus.“
 *
 * - An (Vorgabe): Am PC zeigt der Browser den Hinweistext (title) beim Darüberfahren. Am Tablet/Handy gibt es das nicht;
 *   dort zeigt ein langer Druck (0,5 s) auf einen Knopf eine kleine Blase mit seinem Hinweis. Der Klick danach wird
 *   geschluckt, damit der lange Druck nichts auslöst.
 * - Aus: Hinweistexte werden in `data-fa-titel` zurückgehalten (auch für später erscheinende Knöpfe) und beim
 *   Einschalten zurückgegeben. `aria-label` bleibt immer, Vorleser verlieren nichts.
 */
const SCHLUESSEL = "familienakte-kurzhinweise";
const EREIGNIS = "familienakte:kurzhinweise";
const LANG_MS = 500;

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
  aktiv = an;
  blaseWeg();
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
  const oben = r.top - b.height - 8 >= 8 ? r.top - b.height - 8 : r.bottom + 8;
  blase.style.left = `${links}px`; blase.style.top = `${oben}px`;
  window.setTimeout(blaseWeg, 4000);
}

/** Einmal beim Start aufrufen. */
export function initKurzhinweise() {
  if (typeof document === "undefined") return;
  anwenden(kurzhinweiseAn());
  let uhr = 0, schlucken = false, startX = 0, startY = 0;
  document.addEventListener("pointerdown", (e) => {
    blaseWeg(); startX = e.clientX; startY = e.clientY;
    if (!aktiv || e.pointerType === "mouse") return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("button, a, [role=button], summary");
    const text = el?.getAttribute("title") || "";
    if (!el || !text.trim()) return;
    uhr = window.setTimeout(() => { blaseZeigen(el, text); schlucken = true; }, LANG_MS);
  }, true);
  const abbrechen = () => { window.clearTimeout(uhr); };
  for (const n of ["pointerup", "pointercancel", "scroll"]) document.addEventListener(n, abbrechen, true);
  // Kleines Zittern des Fingers bricht nicht ab, erst echtes Wischen (über 10 px).
  document.addEventListener("pointermove", (e) => { if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) abbrechen(); }, true);
  document.addEventListener("click", (e) => { if (schlucken) { schlucken = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("contextmenu", (e) => { if (blase) e.preventDefault(); }, true);
}
