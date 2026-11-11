import { useEffect, useMemo, useState } from "react";
import { demoActive } from "../lib/demo-workspace.ts";
import { glockeIstAn } from "./app-glocke";
import { kalenderEinstLesen } from "./kalender-abgleich";
import { gemerkteLaufwerke } from "./laufwerk";
import { zweiterOrtLesen } from "./zweiter-ort";
import { cloudOrdnerLesen } from "./cloud-ordner";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";
import { liveBerechnen, type LiveZustand } from "../lib/live-zustand";

export { DEMO_VERLASSEN, liveBerechnen, SICHERUNG_TAGE, type Live, type LiveEingaben, type LiveFarbe, type LiveZustand } from "../lib/live-zustand";

/** Liest den Zustand dieses Geräts und hält ihn aktuell (Pro-Tresor, Sichtbarkeit, Tresor- und Laufwerkereignisse). */
export function useLiveZustand(datentresor?: string, letzteSicherung?: string | null, speicher?: "pro-gesperrt" | "app", ordnerWahl = false): LiveZustand {
  const [pro, setPro] = useState<ProTresorZustand | null>(null);
  const [laufwerke, setLaufwerke] = useState(0);
  const [zweiterOrt, setZweiterOrt] = useState<{ name: string; letzteGelungen: string | null; fehler: string | null } | null>(null);
  const [cloudOrdner, setCloudOrdner] = useState<string | null>(null);
  // Neu zeichnen nach jedem Lesen, damit Kalender und Glocke frisch gelesen werden.
  const [, setTakt] = useState(0);
  const nativ = proTresorVerfuegbar();
  useEffect(() => {
    let lebt = true;
    const lesen = () => {
      if (nativ) void proTresor.zustand().then((s) => { if (lebt) setPro(s); }).catch(() => { if (lebt) setPro({ status: "nicht_erreichbar" }); });
      void gemerkteLaufwerke().then((l) => { if (lebt) setLaufwerke(l.length); }).catch(() => { if (lebt) setLaufwerke(0); });
      void zweiterOrtLesen().then((z) => { if (lebt) setZweiterOrt(z ? { name: z.name, letzteGelungen: z.letzteGelungen?.zeit || null, fehler: z.letzte && !z.letzte.ok ? z.letzte.grund || "Fehler" : null } : null); }).catch(() => {});
      void cloudOrdnerLesen().then((c) => { if (lebt) setCloudOrdner(c?.name || null); }).catch(() => {});
      setTakt((t) => t + 1);
    };
    lesen();
    const sichtbar = () => { if (document.visibilityState === "visible") lesen(); };
    const namen = ["familienakte:pro-tresor", "familienakte:laufwerk-pruefen", "familienakte:kalender", "familienakte:glocke", "familienakte:zweiter-ort", "familienakte:cloud-ordner"];
    document.addEventListener("visibilitychange", sichtbar);
    for (const n of namen) window.addEventListener(n, lesen);
    return () => { lebt = false; document.removeEventListener("visibilitychange", sichtbar); for (const n of namen) window.removeEventListener(n, lesen); };
  }, [nativ]);
  let kalender = false, glocke = false;
  try { kalender = Boolean(kalenderEinstLesen()); glocke = glockeIstAn(); } catch { /* ohne Speicher: nicht eingerichtet */ }
  const demo = demoActive();
  // Festes Objekt, solange sich nichts ändert: die Landkarte rechnet ihre Lage nur bei neuen Kästen neu.
  return useMemo(() => liveBerechnen({ datentresor, speicher, ordnerWahl, letzteSicherung, pro, nativ, kalender, glocke, laufwerke, demo, zweiterOrt, cloudOrdner }),
    [datentresor, speicher, ordnerWahl, letzteSicherung, pro, nativ, kalender, glocke, laufwerke, demo, zweiterOrt, cloudOrdner]);
}
