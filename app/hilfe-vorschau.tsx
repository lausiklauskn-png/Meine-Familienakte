import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { SectionId } from "./portal-types";

/**
 * Vorschaufenster zur Hilfe (Klaus 07.11.2026, Sitzung 4, Weg A): Maus kurz auf ein Thema (Rechner) oder Tipp auf „▣“ (Tablet,
 * Handy) zeigt eine Skizze der Seite aus den echten Kartentiteln – nie Daten, kein gespeichertes Bild. Die Stelle ist rot.
 * „Hingehen ›“ springt hin und rahmt die Stelle rot (vorhandener Sprung).
 */
export type Vorschau = { seite: SectionId; titel: string; karten: string[]; karte?: string; hin: () => void };

const HOVER_MS = 650;
const kannSchweben = () => { try { return window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch { return false; } };

function Fenster({ v, festgehalten, zu, halten }: { v: Vorschau; festgehalten: boolean; zu: () => void; halten: (an: boolean) => void }) {
  const karten = v.karte && !v.karten.includes(v.karte) ? [v.karte, ...v.karten] : v.karten;
  useEffect(() => {
    const taste = (e: KeyboardEvent) => { if (e.key === "Escape") zu(); };
    document.addEventListener("keydown", taste);
    return () => document.removeEventListener("keydown", taste);
  }, [zu]);
  return <div className="hilfe-vorschau" role="dialog" aria-label={`Wo in der App: ${v.titel}`} data-hilfe-vorschau={v.seite}
    data-festgehalten={festgehalten ? "ja" : "nein"} onMouseEnter={() => halten(true)} onMouseLeave={() => halten(false)}>
    <div className="hv-kopf"><strong>Wo in der App</strong><button type="button" className="hv-zu" aria-label="Vorschau schließen" onClick={zu}>✕</button></div>
    <div className="hv-seite" aria-hidden="true">
      <span className="hv-leiste"/>
      <span className={`hv-titel${v.karte ? "" : " hv-ziel"}`}>{v.titel}</span>
      {karten.slice(0, 7).map((k) => <span key={k} className={`hv-karte${k === v.karte ? " hv-ziel" : ""}`} data-hv-ziel={k === v.karte ? "" : undefined}>{k}</span>)}
    </div>
    <p className="hv-text">{v.karte ? <>Rot: <b>{v.karte}</b> auf der Seite „{v.titel}“.</> : <>Die Seite „{v.titel}“.</>} Skizze ohne deine Daten.</p>
    <button type="button" className="button secondary" data-hv-hin onClick={() => { zu(); v.hin(); }}>Hingehen ›</button>
  </div>;
}

/** Knopf „▣“ für die Überschrift eines Themas, Schweben auf der Überschrift und das Fenster selbst. */
export function useHilfeVorschau(v?: Vorschau): { knopf: ReactNode; schweben: { onMouseEnter?: () => void; onMouseLeave?: () => void }; fenster: ReactNode } {
  const [offen, setOffen] = useState<"" | "schwebt" | "fest">("");
  const uhr = useRef<number | undefined>(undefined);
  const imFenster = useRef(false);
  useEffect(() => () => window.clearTimeout(uhr.current), []);
  if (!v) return { knopf: null, schweben: {}, fenster: null };
  const zu = () => { window.clearTimeout(uhr.current); setOffen(""); };
  const knopf = <button type="button" className="hv-knopf" aria-label="Bild der Stelle in der App zeigen" title="Wo in der App?" data-hv-knopf
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOffen((o) => o === "fest" ? "" : "fest"); }}>▣</button>;
  const schweben = kannSchweben() ? {
    onMouseEnter: () => { window.clearTimeout(uhr.current); uhr.current = window.setTimeout(() => setOffen((o) => o || "schwebt"), HOVER_MS); },
    onMouseLeave: () => { window.clearTimeout(uhr.current); uhr.current = window.setTimeout(() => { if (!imFenster.current) setOffen((o) => o === "schwebt" ? "" : o); }, 300); },
  } : {};
  const halten = (an: boolean) => { imFenster.current = an; if (!an) { window.clearTimeout(uhr.current); uhr.current = window.setTimeout(() => setOffen((o) => o === "schwebt" ? "" : o), 300); } };
  const fenster = offen && typeof document !== "undefined" ? createPortal(<Fenster v={v} festgehalten={offen === "fest"} zu={zu} halten={halten}/>, document.body) : null;
  return { knopf, schweben, fenster };
}
