import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { APP_BREITEN, APP_GRUPPEN, APP_KANTEN, APP_KNOTEN, APP_SPALTEN } from "../lib/app-landkarte";
import { APP_STAND } from "../lib/app-stand";
import { KartenLegende, Landkarte, type KartenChip, type KartenGruppe, type KartenKnoten, type KartenPunkt, type KartenStand } from "./landkarte";
import "./globals.css";

/**
 * Landkarte der App als eigene Datei (Klaus 10.11.2026, Geschenkbox: „beide Karten, mit der Funktion“).
 * Dieselbe Komponente und dieselben Listen wie in der App (lib/app-landkarte.ts, lib/app-stand.ts), aber ohne App drumherum:
 * kein Gerätezustand (keine rote Fläche), kein „Hingehen ›“. Gebaut von tools/landkarte-datei.mjs.
 */
const FASSUNG = (import.meta.env.VITE_FA_FASSUNG as string | undefined) || "";

/** Ohne Gerät gibt es kein „nicht eingerichtet“: was nur eingeschaltet werden muss, ist gebaut. */
function standOhneGeraet(id: string): KartenStand {
  const s = APP_STAND[id]?.stand || "fertig";
  return s === "aktivieren" ? "fertig" : s;
}
function mach<T extends KartenPunkt>(p: T & { seite?: unknown }): T {
  const { seite: _seite, ...rest } = p;
  const einschalten = APP_STAND[p.id]?.stand === "aktivieren";
  return { ...(rest as unknown as T), stand: standOhneGeraet(p.id), mehr: [p.mehr, einschalten ? "In der App einmal einzurichten." : ""].filter(Boolean).join(" ") || undefined };
}

function Seite() {
  const { gruppen, knoten } = useMemo(() => ({
    gruppen: APP_GRUPPEN.map((g) => ({ ...g, chips: g.chips.map((c) => mach(c) as KartenChip) })) as KartenGruppe[],
    knoten: APP_KNOTEN.map((k) => mach(k)) as KartenKnoten[],
  }), []);
  return <main className="landkarte-allein">
    <header className="landkarte-allein-kopf">
      <h1>Familienakte – Landkarte der App</h1>
      <p>{FASSUNG ? `Stand Fassung ${FASSUNG}. ` : ""}Tipp auf einen Kasten zeigt seine Wege. Tipp auf ein Feld der Legende hebt alle Kästen dieser Art hervor.</p>
    </header>
    <KartenLegende fuer="app" ohneGeraet/>
    <Landkarte id="app" label="Landkarte der ganzen App: von den Wegen hinein über Eingangszentrale und Akte bis zu Speicher und Ausgabe"
      gruppen={gruppen} knoten={knoten} kanten={APP_KANTEN} breiten={APP_BREITEN} spalten={APP_SPALTEN}/>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Seite/></StrictMode>);
