import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { workspaceStorage } from "../lib/demo-workspace.ts";

/**
 * Einklappbare Abschnitte (Klaus 2026-11-06): auf einer Seite lässt sich jeder Abschnitt mit einem Tipp auf seine
 * Überschrift schließen und wieder öffnen. Ein Knopf „alle“ unter dem „?“ im Seitenkopf zeigt, was ein Tipp bewirkt:
 * Ist etwas zu, klappt er alle auf; ist alles offen, klappt er alle zu (Klaus 2026-11-06). Abschnitte tragen data-klapp="<name>":
 * eine <section> mit .card-heading oder ein <details>. Der Stand wird je Seite gemerkt.
 */
const SCHLUESSEL = "familienakte.klapp.v1";
type Stand = Record<string, boolean>; // name → zu
function lesen(seite: string): Stand { try { return (JSON.parse(workspaceStorage.getItem(SCHLUESSEL) || "{}") || {})[seite] || {}; } catch { return {}; } }
function schreiben(seite: string, stand: Stand) { try { const alle = JSON.parse(workspaceStorage.getItem(SCHLUESSEL) || "{}") || {}; alle[seite] = stand; workspaceStorage.setItem(SCHLUESSEL, JSON.stringify(alle)); } catch { /* ohne Speicher geht es weiter */ } }

const GEAENDERT = "familienakte-klapp";
/** Die Seite, zu der der Knopf gehört: steht er im Seitenkopf, ist es das Element um den Kopf. */
function seitenWurzel(knopf: HTMLElement | null) { return (knopf?.closest(".page-title")?.parentElement || knopf?.parentElement || null) as HTMLElement | null; }
function abschnitte(knopf: HTMLElement | null) { return Array.from(seitenWurzel(knopf)?.querySelectorAll<HTMLElement>("[data-klapp]") || []); }
function istZu(el: HTMLElement) { return el instanceof HTMLDetailsElement ? !el.open : el.classList.contains("klapp-zu"); }
function setzen(el: HTMLElement, zu: boolean) {
  if (el instanceof HTMLDetailsElement) el.open = !zu;
  else { el.classList.toggle("klapp-zu", zu); el.querySelector(".card-heading h2")?.setAttribute("aria-expanded", String(!zu)); }
  try { window.dispatchEvent(new Event(GEAENDERT)); } catch { /* ohne Fenster nichts zu melden */ }
}

/** Öffnet einen Abschnitt von außen (z. B. Kalender-Knopf im Kopf). */
export function klappOeffnen(name: string) {
  const el = document.querySelector<HTMLElement>(`[data-klapp="${name}"]`);
  if (el) { setzen(el, false); const seite = el.closest<HTMLElement>("[data-klapp-seite]")?.dataset.klappSeite; if (seite) { const s = lesen(seite); s[name] = false; schreiben(seite, s); } }
}

export function KlappLeiste({ seite }: { seite: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [etwasZu, setEtwasZu] = useState(false);
  const pruefen = () => setEtwasZu(abschnitte(ref.current).some(istZu));
  const merken = () => { const s: Stand = {}; for (const el of abschnitte(ref.current)) s[el.dataset.klapp!] = istZu(el); schreiben(seite, s); pruefen(); };
  useEffect(() => {
    const wurzel = seitenWurzel(ref.current); if (!wurzel) return;
    wurzel.setAttribute("data-klapp-seite", seite);
    const stand = lesen(seite);
    const vorbereiten = () => {
      for (const el of abschnitte(ref.current)) {
        if (!el.dataset.klappBereit) {
          el.dataset.klappBereit = "1";
          if (stand[el.dataset.klapp!] !== undefined) setzen(el, stand[el.dataset.klapp!]);
          const h = el.querySelector<HTMLElement>(":scope > .card-heading h2");
          if (h) { h.setAttribute("role", "button"); h.tabIndex = 0; h.setAttribute("aria-expanded", String(!istZu(el))); h.title = "Antippen zum Auf- und Zuklappen"; }
        }
        if (el instanceof HTMLDetailsElement && !el.dataset.klappHoert) { el.dataset.klappHoert = "1"; el.addEventListener("toggle", merken); }
      }
      pruefen();
    };
    vorbereiten();
    window.addEventListener(GEAENDERT, pruefen);
    const beobachter = new MutationObserver(vorbereiten); beobachter.observe(wurzel, { childList: true });
    const klick = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      const h = (e.target as HTMLElement).closest?.(".card-heading h2"); if (!h) return;
      const el = h.closest<HTMLElement>("[data-klapp]"); if (!el || el instanceof HTMLDetailsElement || !wurzel.contains(el)) return;
      if ((e.target as HTMLElement).closest("button, a, input, select, [role=note]") && (e.target as HTMLElement) !== h) return;
      e.preventDefault(); setzen(el, !istZu(el)); merken();
    };
    wurzel.addEventListener("click", klick); wurzel.addEventListener("keydown", klick);
    return () => { window.removeEventListener(GEAENDERT, pruefen); beobachter.disconnect(); wurzel.removeEventListener("click", klick); wurzel.removeEventListener("keydown", klick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seite]);
  const alle = (zu: boolean) => { for (const el of abschnitte(ref.current)) setzen(el, zu); merken(); };
  // Im Knopf steht immer, was ein Tipp bewirkt.
  const name = etwasZu ? "Alle aufklappen" : "Alle zuklappen";
  return <button ref={ref} type="button" className="klapp-alle" onClick={() => alle(!etwasZu)} aria-label={name} title={name}
    data-klapp-alle={etwasZu ? "auf" : "zu"}>
    <small>alle</small>{etwasZu ? <ChevronsUpDown size={20}/> : <ChevronsDownUp size={20}/>}
  </button>;
}
