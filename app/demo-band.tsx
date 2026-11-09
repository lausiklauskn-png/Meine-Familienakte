import { demoActive, switchDemo } from "../lib/demo-workspace.ts";

/** Klaus 09.11. (l4): Demo an → rotes Band über den Hilfekarten; die Farben zeigen dann die Kopie. „Demo verlassen ›“ direkt dort. */
export function DemoBand({ text = "Die Farben zeigen den Zustand der Demo-Kopie, nicht deiner Akte." }: { text?: string }) {
  if (!demoActive()) return null;
  return <div className="demo-band" role="note" data-demo-band>
    <span><span className="demo-band-marke">DEMO</span> {text}</span>
    <button type="button" className="button secondary" onClick={() => switchDemo(false)} data-demo-band-verlassen>Demo verlassen ›</button>
  </div>;
}
