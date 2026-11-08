import { Eye, EyeOff, Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState, useLayoutEffect, type ReactNode, type RefObject } from "react";

/**
 * Flache Zeile (Klaus 2026-11-06): am Handy lieber flach und breit als hoch und schmal. Ein langer Text steht in einer
 * Zeile als „Anfang … Ende“; das Auge klappt den ganzen Eintrag auf.
 * Knöpfe der Zeile (Klaus 2026-11-08): am Handy in einer Aufklappleiste am rechten Rand (Pfeil ‹ auf, › zu, auch per
 * Wischen); ist die Zeile breit genug, stehen sie direkt darin (CSS-Containerabfrage auf `.fz-voll`).
 */

/** Füllwörter, die nie als Hauptwort gelten (Zeitangaben und Gattungsnamen der App). */
const KEIN_HAUPTWORT = new Set(["uhr", "minute", "minuten", "stunde", "stunden", "tag", "tage", "tagen", "woche", "wochen", "monat", "monate", "jahr", "erinnerung", "erinnere", "aufgabe", "frist", "termin", "notiz", "heute", "morgen"]);

/**
 * Hauptwort eines Textes (Klaus 2026-11-08: „die ersten Worte … und das Hauptwort“): das großgeschriebene Wort, das am
 * häufigsten vorkommt (mindestens zweimal, nicht das erste Wort, ohne Füllwörter). Sonst `null`.
 */
export function hauptwort(text: string): string | null {
  const woerter = String(text || "").replace(/\s+/g, " ").trim().split(" ").map((w) => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""));
  const zahl = new Map<string, number>();
  woerter.forEach((w, i) => { if (i > 0 && w.length >= 4 && /^\p{Lu}\p{Ll}/u.test(w) && !KEIN_HAUPTWORT.has(w.toLowerCase())) zahl.set(w, (zahl.get(w) || 0) + 1); });
  let best: string | null = null; let n = 1;
  for (const [w, k] of zahl) if (k > n) { best = w; n = k; }
  return best;
}

/**
 * Teilt einen Text in Anfang und Ende. Mit Hauptwort: Anfang = alles vor seinem letzten Vorkommen, Ende = das Hauptwort,
 * dazwischen immer „…“. Sonst die Endworte (ohne das trennende Leerzeichen).
 */
export function anfangEnde(text: string): [string, string, boolean] {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const w = t.split(" ");
  if (w.length < 3) return [t, "", false];
  const hw = hauptwort(t);
  if (hw) {
    const stelle = t.lastIndexOf(hw);
    const anfang = t.slice(0, stelle).trim();
    if (anfang && stelle + hw.length < t.length - 1) return [anfang, hw, true];
  }
  // Endworte kurz halten (höchstens etwa 14 Zeichen), damit vom Anfang genug lesbar bleibt.
  let ende = w[w.length - 1];
  const zwei = w.slice(-2).join(" ");
  if (ende.length < 7 && w.length >= 4 && zwei.length <= 14) ende = zwei;
  return [t.slice(0, t.length - ende.length - 1), ende, false];
}

/** Text in einer Zeile: der Anfang wird bei Platzmangel mit „…“ gekürzt, das Ende (Hauptwort oder Endworte) bleibt sichtbar.
 * Trennzeichen als geschütztes Leerzeichen: ein normales fiel in der Flex-Zeile weg („126Wolkenpost“, 2.28.39). */
export function FlachText({ text }: { text: string }) {
  const [a, e, mitte] = anfangEnde(text);
  return <span className="flach" title={text}><span className="flach-a">{a}</span>{e && <>{mitte ? <span className="flach-p">{"\u00a0…\u00a0"}</span> : <span className="flach-l">{"\u00a0"}</span>}<span className="flach-e">{e}</span></>}</span>;
}

/** Stift direkt in der Zeile (Klaus 2026-11-08): öffnet sofort das Fenster zum Ändern. */
export function StiftKnopf({ titel, onClick, disabled, ...rest }: { titel: string; onClick: () => void; disabled?: boolean } & Record<`data-${string}`, string | boolean | undefined>) {
  return <button type="button" className="icon-button stift-knopf" onClick={onClick} disabled={disabled} aria-label={`„${titel}“ ändern`} title="Ändern" {...rest}><Pencil size={18}/></button>;
}

const LEISTE_AUF = "fa-zeilenleiste-auf";

/** Aufklappleiste für die Knöpfe einer Zeile; es ist immer nur eine offen. */
export function KnopfLeiste({ titel, children }: { titel: string; children: ReactNode }) {
  const id = useId();
  const [auf, setAuf] = useState(false);
  const leiste = useRef<HTMLSpanElement>(null);
  const setze = (wert: boolean) => { setAuf(wert); if (wert) window.dispatchEvent(new CustomEvent(LEISTE_AUF, { detail: id })); };
  useEffect(() => {
    const andere = (e: Event) => { if ((e as CustomEvent<string>).detail !== id) setAuf(false); };
    window.addEventListener(LEISTE_AUF, andere);
    // Wischen auf der Zeile: nach links öffnet, nach rechts schließt.
    const zeile = leiste.current?.parentElement;
    let x0: number | null = null;
    const runter = (e: PointerEvent) => { x0 = e.clientX; };
    const hoch = (e: PointerEvent) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (dx < -40) setze(true); else if (dx > 40) setAuf(false); };
    zeile?.addEventListener("pointerdown", runter); zeile?.addEventListener("pointerup", hoch);
    return () => { window.removeEventListener(LEISTE_AUF, andere); zeile?.removeEventListener("pointerdown", runter); zeile?.removeEventListener("pointerup", hoch); };
  }, [id]);
  useEffect(() => {
    if (!auf) return;
    const daneben = (e: PointerEvent) => { if (!leiste.current?.parentElement?.contains(e.target as Node)) setAuf(false); };
    document.addEventListener("pointerdown", daneben);
    return () => document.removeEventListener("pointerdown", daneben);
  }, [auf]);
  return <>
    <button type="button" className="fz-griff" onClick={() => setze(true)} aria-expanded={auf} aria-label={`Knöpfe zu „${titel}“ zeigen`} title="Knöpfe zeigen" data-fz-griff>‹</button>
    <span ref={leiste} className={`fz-leiste${auf ? " auf" : ""}`} data-fz-leiste={auf ? "auf" : "zu"}>
      <button type="button" className="fz-zu" onClick={() => setAuf(false)} aria-label="Knöpfe schließen" title="Schließen" data-fz-zu>›</button>
      {children}
    </span>
  </>;
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
