import { ArrowDown, ArrowLeft, ArrowUp, ChevronsDownUp, ChevronsUpDown, CircleHelp, House, LayoutGrid, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mitwandernde Seitenleiste rechts (Klaus 07.11.2026, Plan Punkt 9): ein schmaler Griff am rechten Rand, mittig, wandert beim
 * Scrollen mit. Ein Tipp öffnet die Knöpfe, die hier sinnvoll sind: alle auf/zu, nach oben, nach unten, zurück, Startseite,
 * Seite wählen, Hilfe. Die Belegung ist ein Vorschlag und wird mit Klaus getrennt festgelegt; darum steht sie als Liste hier.
 * Die rechte Maustaste bleibt frei (Menü des Browsers: Kopieren, Einfügen).
 */
type Knopf = { id: string; text: string; symbol: ReactNode; tun: () => void; aus?: boolean };

function wurzel() { return document.querySelector<HTMLElement>("main.site-main"); }
/** Aufklappbare Abschnitte der Seite: Knopf „alle“ im Seitenkopf, sonst die <details> der Seite (Hilfe-Themen). */
function klappStand() {
  const alleKnopf = wurzel()?.querySelector<HTMLButtonElement>("[data-klapp-alle]");
  if (alleKnopf) return { anzahl: 1, offen: alleKnopf.dataset.klappAlle === "zu" ? 1 : 0, knopf: alleKnopf };
  const details = [...(wurzel()?.querySelectorAll<HTMLDetailsElement>("details") || [])].filter((d) => d.getClientRects().length);
  return { anzahl: details.length, offen: details.filter((d) => d.open).length, knopf: null as HTMLButtonElement | null };
}

export function Seitenleiste({ seite, zurStartseite, zurAuswahl, zurHilfe, zurueck, kannZurueck }: {
  seite: string; zurStartseite: () => void; zurAuswahl: () => void; zurHilfe: () => void; zurueck: () => void; kannZurueck: boolean;
}) {
  const [offen, setOffen] = useState(false);
  const [klapp, setKlapp] = useState({ anzahl: 0, offen: 0 });
  const rahmen = useRef<HTMLElement>(null);
  useEffect(() => { setOffen(false); }, [seite]);
  useEffect(() => {
    if (!offen) return;
    const s = klappStand(); setKlapp({ anzahl: s.anzahl, offen: s.offen });
    const weg = (event: Event) => { if (!rahmen.current?.contains(event.target as Node)) setOffen(false); };
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") setOffen(false); };
    document.addEventListener("pointerdown", weg); document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", taste); };
  }, [offen]);
  const schliessen = (tun: () => void) => () => { setOffen(false); tun(); };
  const alleZu = klapp.offen > 0;
  const knoepfe: Knopf[] = [
    ...(klapp.anzahl ? [{ id: "alle", text: alleZu ? "Alle zuklappen" : "Alle aufklappen", symbol: alleZu ? <ChevronsDownUp size={20}/> : <ChevronsUpDown size={20}/>, tun: () => {
      const s = klappStand();
      if (s.knopf) { s.knopf.click(); return; }
      const details = [...(wurzel()?.querySelectorAll<HTMLDetailsElement>("details") || [])];
      if (s.offen) { for (const d of details) d.open = false; wurzel()?.querySelector(".help-topics, .page-title")?.scrollIntoView({ block: "start", behavior: "smooth" }); }
      else for (const d of details) if (d.parentElement?.closest("details") === null) d.open = true;
    } }] : []),
    { id: "oben", text: "Nach oben", symbol: <ArrowUp size={20}/>, tun: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "unten", text: "Nach unten", symbol: <ArrowDown size={20}/>, tun: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }) },
    { id: "zurueck", text: "Zurück", symbol: <ArrowLeft size={20}/>, tun: zurueck, aus: !kannZurueck },
    { id: "start", text: "Startseite", symbol: <House size={20}/>, tun: zurStartseite, aus: seite === "overview" },
    { id: "auswahl", text: "Seite wählen", symbol: <LayoutGrid size={20}/>, tun: zurAuswahl, aus: seite === "directory" },
    { id: "hilfe", text: "Hilfe", symbol: <CircleHelp size={20}/>, tun: zurHilfe, aus: seite === "help" },
  ];
  return <aside ref={rahmen} className={`seitenleiste${offen ? " offen" : ""}`} aria-label="Seitenleiste" data-seitenleiste={offen ? "offen" : "zu"}>
    {offen
      ? <div className="seitenleiste-knoepfe" role="menu">
          <button type="button" className="seitenleiste-zu" onClick={() => setOffen(false)} aria-label="Seitenleiste schließen"><X size={18}/></button>
          {knoepfe.filter((k) => !k.aus).map((k) => <button key={k.id} type="button" role="menuitem" data-leiste={k.id} onClick={schliessen(k.tun)} title={k.text}>{k.symbol}<span>{k.text}</span></button>)}
        </div>
      : <button type="button" className="seitenleiste-griff" onClick={() => setOffen(true)} aria-label="Seitenleiste öffnen: alle auf/zu, nach oben, zurück …" title="Seitenleiste"><span aria-hidden="true"/></button>}
  </aside>;
}
