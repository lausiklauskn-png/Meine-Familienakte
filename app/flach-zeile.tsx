import { Eye, EyeOff } from "lucide-react";
import { useLayoutEffect, type RefObject } from "react";

/**
 * Flache Zeile (Klaus 2026-11-06): am Handy lieber flach und breit als hoch und schmal. Ein langer Text steht in einer
 * Zeile als „Anfang … Ende“; das Auge klappt den ganzen Eintrag auf.
 */

/** Teilt einen Text in Anfang und Endworte (ohne das trennende Leerzeichen). */
export function anfangEnde(text: string): [string, string] {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const w = t.split(" ");
  if (w.length < 3) return [t, ""];
  // Endworte kurz halten (höchstens etwa 14 Zeichen), damit vom Anfang genug lesbar bleibt.
  let ende = w[w.length - 1];
  const zwei = w.slice(-2).join(" ");
  if (ende.length < 7 && w.length >= 4 && zwei.length <= 14) ende = zwei;
  return [t.slice(0, t.length - ende.length - 1), ende];
}

/** Text in einer Zeile: der Anfang wird bei Platzmangel mit „…“ gekürzt, die Endworte bleiben sichtbar. */
export function FlachText({ text }: { text: string }) {
  const [a, e] = anfangEnde(text);
  return <span className="flach" title={text}><span className="flach-a">{a}</span>{e && <><span className="flach-l"> </span><span className="flach-e">{e}</span></>}</span>;
}

/** Auge zum Ansehen: klappt den ganzen Eintrag auf und wieder zu. */
export function AugeKnopf({ offen, titel, onClick, ...rest }: { offen: boolean; titel: string; onClick: () => void } & Record<`data-${string}`, string | boolean | undefined>) {
  return <button type="button" className="icon-button auge-knopf" onClick={onClick} aria-expanded={offen}
    aria-label={offen ? `„${titel}“ zuklappen` : `„${titel}“ ganz ansehen`} title={offen ? "Zuklappen" : "Ganz ansehen"} {...rest}>
    {offen ? <EyeOff size={18}/> : <Eye size={18}/>}
  </button>;
}

/**
 * Überschrift immer in EINER Zeile (Klaus 2026-11-06): passt sie nicht, wird die Schrift kleiner, bis sie passt
 * (nicht kleiner als `minPx`; darunter kürzt CSS mit „…“). Neu gemessen, wenn sich die Breite ändert.
 */
export function useEinzeilig(ref: RefObject<HTMLElement | null>, minPx = 14) {
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const passen = () => {
      el.style.fontSize = "";
      let px = parseFloat(getComputedStyle(el).fontSize) || 24;
      while (el.scrollWidth > el.clientWidth + 1 && px > minPx) { px -= 1; el.style.fontSize = `${px}px`; }
    };
    passen();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(passen) : null;
    ro?.observe(el); window.addEventListener("resize", passen);
    void document.fonts?.ready.then(passen).catch(() => undefined);
    return () => { ro?.disconnect(); window.removeEventListener("resize", passen); };
  }, [ref, minPx]);
}
