import { Map as KartenSymbol } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { APP_BREITEN, APP_GRUPPEN, APP_KANTEN, APP_KNOTEN, APP_SPALTEN, type KartenSeite } from "../lib/app-landkarte";
import { standVon } from "../lib/app-stand";
import { KartenLegende, Landkarte, type KartenChip, type KartenGruppe, type KartenKnoten, type KartenPunkt } from "./landkarte";
import type { LiveZustand } from "./live-zustand";
import type { GehMitZiel } from "./sprung";
import { DemoBand } from "./demo-band";
import { InfoPopover } from "./ui-controls";

/**
 * Kasten ganz oben in der Hilfe (Klaus 08.11.2026): „Demo starten“ und das Landkarten-Symbol, „?“ oben rechts. Das Symbol klappt
 * die „Interaktive Landkarte der App“ auf: die ganze App als Karte (auch am Handy, seitlich wischbar), Stand je Kasten aus
 * lib/app-stand.ts, Geändertes golden bis zum Antippen. „Hingehen ›“ springt zur Seite.
 */
const KARTE_HILFE = "• Die ganze App auf einer Karte: von den Wegen hinein bis zu Speicher und Ausgabe.\n• Tipp auf einen Kasten zeigt seine Wege; „Hingehen ›“ führt an die Stelle.\n• **Fläche = dieses Gerät:** grün eingerichtet, rot fehlt, gelb gesperrt oder veraltet, grau freiwillig oder nicht hier. Rot und gelb: antippen, „Beheben ›“.\n• Rahmen = Baustand: blau fertig, lila gestrichelt im Bau, grau gestrichelt geplant. Blauer Punkt „neu“ = seit dem letzten Besuch geändert.\n• Gestrichelter Weg: einer der beiden Kästen ist noch nicht da.";

/** Zustand beim „Hingehen ›“: beim nächsten Aufbau der Hilfe (Zurück) ist die Karte wieder offen und der Kasten gewählt. */
let beimHingehen: { kasten: string } | null = null;

export function AppLandkarteHilfe({ onGo, eingerichtet, demo, live = {} }: { onGo: GehMitZiel; eingerichtet: ReadonlySet<string>; demo?: ReactNode; live?: LiveZustand }) {
  const [frisch, setFrisch] = useState(0);
  const [start] = useState(() => beimHingehen);
  const [offen, setOffen] = useState(Boolean(start));
  useEffect(() => { beimHingehen = null; }, []);
  const geh = useRef(onGo); geh.current = onGo;
  const { gruppen, knoten } = useMemo(() => {
    const mach = <T extends KartenPunkt & KartenSeite>(p: T): T => {
      const l = live[p.id];
      const beheben = l?.los && l.seite ? { ziel: () => { beimHingehen = { kasten: p.id }; geh.current(l.seite!, undefined, l.ziel ? { ziel: l.ziel } : undefined); }, zielText: l.los } : null;
      return { ...p, stand: standVon(p.id, eingerichtet), ...(l ? { live: l } : {}),
        ...(beheben || (p.seite ? { ziel: () => { beimHingehen = { kasten: p.id }; geh.current(p.seite!); }, zielText: "Hingehen" } : {})) };
    };
    const gruppen: KartenGruppe[] = APP_GRUPPEN.map((g) => ({ ...g, chips: g.chips.map((c) => mach(c) as KartenChip) }));
    const knoten: KartenKnoten[] = APP_KNOTEN.map((k) => mach(k));
    return { gruppen, knoten };
  }, [eingerichtet, live]);
  const zaehlen = useCallback((n: number) => setFrisch(n), []);
  return <section className="card demo-starten hilfe-oben app-landkarte-hilfe" aria-label="Demo und Landkarte" data-app-landkarte={offen ? "offen" : "zu"}>
    <div className="demo-starten-zeile">
      {demo}
      <button type="button" className="hilfe-oben-karte-knopf" aria-expanded={offen} aria-controls="hilfe-oben-karte" onClick={() => setOffen((x) => !x)}
        aria-label={offen ? "Interaktive Landkarte der App zuklappen" : "Interaktive Landkarte der App öffnen"} title="Interaktive Landkarte der App" data-app-landkarte-knopf>
        <KartenSymbol size={22}/>{frisch > 0 && <span className="lk-gold" data-lk-gold={frisch}>{frisch}</span>}
      </button>
    </div>
    <div id="hilfe-oben-karte" className="hilfe-oben-karte" hidden={!offen} data-app-landkarte-inhalt>
      <div className="hilfe-oben-karte-kopf"><KartenSymbol size={18}/><h3>Interaktive Landkarte der App</h3><InfoPopover label="Landkarte erklären" text={KARTE_HILFE}/></div>
      <DemoBand/>
      <KartenLegende live/>
      <Landkarte id="app" label="Landkarte der ganzen App: von den Wegen hinein über Eingangszentrale und Akte bis zu Speicher und Ausgabe"
        gruppen={gruppen} knoten={knoten} kanten={APP_KANTEN} breiten={APP_BREITEN} spalten={APP_SPALTEN} onFrisch={zaehlen} startAktiv={start?.kasten}/>
    </div>
  </section>;
}
