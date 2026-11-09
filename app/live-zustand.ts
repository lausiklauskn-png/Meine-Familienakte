import { useEffect, useMemo, useState } from "react";
import { demoActive } from "../lib/demo-workspace.ts";
import { glockeIstAn } from "./app-glocke";
import { kalenderEinstLesen } from "./kalender-abgleich";
import { gemerkteLaufwerke } from "./laufwerk";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";
import { liveBerechnen, type LiveZustand } from "../lib/live-zustand";

export { liveBerechnen, SICHERUNG_TAGE, type Live, type LiveEingaben, type LiveFarbe, type LiveZustand } from "../lib/live-zustand";

/** Liest den Zustand dieses Geräts und hält ihn aktuell (Pro-Tresor, Sichtbarkeit, Tresor- und Laufwerkereignisse). */
export function useLiveZustand(datentresor?: string, letzteSicherung?: string | null): LiveZustand {
  const [pro, setPro] = useState<ProTresorZustand | null>(null);
  const [laufwerke, setLaufwerke] = useState(0);
  // Neu zeichnen nach jedem Lesen, damit Kalender und Glocke frisch gelesen werden.
  const [, setTakt] = useState(0);
  const nativ = proTresorVerfuegbar();
  useEffect(() => {
    let lebt = true;
    const lesen = () => {
      if (nativ) void proTresor.zustand().then((s) => { if (lebt) setPro(s); }).catch(() => { if (lebt) setPro({ status: "nicht_erreichbar" }); });
      void gemerkteLaufwerke().then((l) => { if (lebt) setLaufwerke(l.length); }).catch(() => { if (lebt) setLaufwerke(0); });
      setTakt((t) => t + 1);
    };
    lesen();
    const sichtbar = () => { if (document.visibilityState === "visible") lesen(); };
    const namen = ["familienakte:pro-tresor", "familienakte:laufwerk-pruefen", "familienakte:kalender", "familienakte:glocke"];
    document.addEventListener("visibilitychange", sichtbar);
    for (const n of namen) window.addEventListener(n, lesen);
    return () => { lebt = false; document.removeEventListener("visibilitychange", sichtbar); for (const n of namen) window.removeEventListener(n, lesen); };
  }, [nativ]);
  let kalender = false, glocke = false;
  try { kalender = Boolean(kalenderEinstLesen()); glocke = glockeIstAn(); } catch { /* ohne Speicher: nicht eingerichtet */ }
  const demo = demoActive();
  // Festes Objekt, solange sich nichts ändert: die Landkarte rechnet ihre Lage nur bei neuen Kästen neu.
  return useMemo(() => liveBerechnen({ datentresor, letzteSicherung, pro, nativ, kalender, glocke, laufwerke, demo }),
    [datentresor, letzteSicherung, pro, nativ, kalender, glocke, laufwerke, demo]);
}
