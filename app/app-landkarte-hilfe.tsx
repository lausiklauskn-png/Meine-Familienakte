import { Map as KartenSymbol } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { APP_BREITEN, APP_GRUPPEN, APP_KANTEN, APP_KNOTEN, APP_SPALTEN, type KartenSeite } from "../lib/app-landkarte";
import { standVon } from "../lib/app-stand";
import { KartenLegende, Landkarte, type KartenChip, type KartenGruppe, type KartenKnoten, type KartenPunkt } from "./landkarte";
import type { SectionId } from "./portal-types";

/**
 * „Landkarte der App“ ganz oben in der Hilfe (Klaus 07.11.2026, Sitzung 4, Fragen A–C): die ganze App als Karte, Stand je Kasten
 * aus lib/app-stand.ts, Geändertes golden bis zum Antippen, am Handy als Liste. „Hingehen ›“ springt zur Seite.
 */
export function AppLandkarteHilfe({ onGo, eingerichtet }: { onGo: (id: SectionId) => void; eingerichtet: ReadonlySet<string> }) {
  const [frisch, setFrisch] = useState(0);
  const geh = useRef(onGo); geh.current = onGo;
  const { gruppen, knoten } = useMemo(() => {
    const mach = <T extends KartenPunkt & KartenSeite>(p: T): T => ({ ...p, stand: standVon(p.id, eingerichtet),
      ...(p.seite ? { ziel: () => geh.current(p.seite!), zielText: "Hingehen" } : {}) });
    const gruppen: KartenGruppe[] = APP_GRUPPEN.map((g) => ({ ...g, chips: g.chips.map((c) => mach(c) as KartenChip) }));
    const knoten: KartenKnoten[] = APP_KNOTEN.map((k) => mach(k));
    return { gruppen, knoten };
  }, [eingerichtet]);
  const zaehlen = useCallback((n: number) => setFrisch(n), []);
  return <details className="card wo-liegt-was app-landkarte-hilfe" data-app-landkarte>
    <summary><KartenSymbol/> Landkarte der App{frisch > 0 && <span className="lk-gold" data-lk-gold={frisch}>{frisch} geändert</span>}</summary>
    <div>
      <p>Woher etwas kommt und wohin es geht. Tipp auf einen Kasten zeigt die Wege und führt hin.</p>
      <KartenLegende/>
      <Landkarte id="app" label="Landkarte der ganzen App: von den Wegen hinein über Eingangszentrale und Akte bis zu Speicher und Ausgabe"
        gruppen={gruppen} knoten={knoten} kanten={APP_KANTEN} breiten={APP_BREITEN} spalten={APP_SPALTEN} onFrisch={zaehlen}/>
    </div>
  </details>;
}
