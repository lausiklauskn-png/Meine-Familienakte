// Einklappbare Karte (2.28.75, Klaus 19.11.2026: „Container einklappbar, ab Werk zu“; Vorbild klappTeil der Privaten Akte).
// Der Kopf ist ein Knopf mit Überschrift und Zahl; ein Tipp klappt auf, ein zweiter zu. Ist etwas passiert, steht es als
// eine kurze Zeile UNTER dem Knopf (unter), nicht als offener Block. Der Zustand wird je Gerät gemerkt (fa_klapp).
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { InfoPopover } from "./ui-controls";

const SCHLUESSEL = "fa_klapp";
function lesen(): Record<string, boolean> { try { return JSON.parse(localStorage.getItem(SCHLUESSEL) || "{}") || {}; } catch { return {}; } }
export function klappOffen(id: string, vorgabe = false) { const w = lesen()[id]; return typeof w === "boolean" ? w : vorgabe; }
export function klappSetzen(id: string, offen: boolean) { try { localStorage.setItem(SCHLUESSEL, JSON.stringify({ ...lesen(), [id]: offen })); } catch { /* nur Sitzung */ } }
/** Öffnet eine Karte von außen (z. B. Sprung aus der Hilfe oder der Suche). */
export const KLAPP_EREIGNIS = "familienakte:klapp";
export function klappAuf(id: string) { klappSetzen(id, true); window.dispatchEvent(new CustomEvent(KLAPP_EREIGNIS, { detail: id })); }

export function KlappKarte({ id, titel, zahl, unter, unterArt = "neutral", hilfe, rechts, vorgabe = false, className = "", children }: {
  id: string; titel: string; zahl?: number | string | null; unter?: ReactNode; unterArt?: "neutral" | "warnung" | "gut";
  hilfe?: string; rechts?: ReactNode; vorgabe?: boolean; className?: string; children: ReactNode;
}) {
  const [offen, setOffen] = useState(() => klappOffen(id, vorgabe));
  // Von außen geöffnet (klappAuf, Sprung aus Hilfe oder Suche).
  useEffect(() => { const h = (e: Event) => { if ((e as CustomEvent).detail === id) setOffen(true); }; window.addEventListener(KLAPP_EREIGNIS, h); return () => window.removeEventListener(KLAPP_EREIGNIS, h); }, [id]);
  const umschalten = () => { const n = !offen; setOffen(n); klappSetzen(id, n); };
  return <section className={`card klapp-karte ${offen ? "offen" : "zu"} ${className}`.trim()} data-klapp={id} data-klapp-offen={offen ? "ja" : "nein"}>
    <div className="klapp-kopf">
      <button type="button" className="klapp-knopf" onClick={umschalten} aria-expanded={offen} data-klapp-knopf={id}>
        <ChevronDown size={18} className="klapp-pfeil" aria-hidden="true"/>
        <span className="klapp-titel">{titel}</span>
        {zahl !== undefined && zahl !== null && zahl !== "" && <span className="klapp-zahl">{zahl}</span>}
      </button>
      {hilfe && <InfoPopover label={`${titel} erklären`} text={hilfe}/>}
      {rechts && <span className="klapp-rechts">{rechts}</span>}
    </div>
    {unter && !offen && <div className={`klapp-unter ${unterArt}`} data-klapp-unter={id}>{unter}</div>}
    {offen && <div className="klapp-inhalt">{children}</div>}
  </section>;
}

/** Schnellauswahl als flache Knöpfe (Vorbild kachelRaster der Akte): höchstens drei Reihen, dann seitlich schieben. */
export function ChipRaster({ children, label }: { children: ReactNode; label: string }) {
  return <div className="chip-raster" role="group" aria-label={label}>{children}</div>;
}
