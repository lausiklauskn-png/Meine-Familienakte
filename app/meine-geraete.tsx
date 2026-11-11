"use client";
// Meine Geräte (2.28.61, Klaus 11.11.): dieses Gerät einmal per Knopf benennen, andere Geräte erscheinen von selbst
// mit ihrem eigenen Namen (Paket, gemeinsame Festplatte, eigenes Netz). Speicher wie SD-Karte oder Festplatte sind keine Geräte.

import { useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { gemerkteLaufwerke, geraetKennung, geraetUmbenennen } from "./laufwerk";
import { paketPartnerAlle } from "./paket";
import { InfoPopover } from "./ui-controls";

export const GERAETE_ARTEN = ["Handy", "Tablet", "PC", "Laptop"] as const;
const VORGABE_NAMEN = new Set(["Android-Gerät", "Windows-PC", "Browser"]);
/** Noch nie benannt: der Name ist der, den die App beim ersten Start vergeben hat. */
export const geraetUnbenannt = (name = geraetKennung().name) => VORGABE_NAMEN.has(name);
export function geraetName(art: string, zusatz: string) { const z = zusatz.trim(); return z ? `${art} ${z}` : art; }
export function geraetZerlegen(name: string) {
  const art = GERAETE_ARTEN.find((a) => name === a || name.startsWith(`${a} `)) || "";
  return { art, zusatz: art ? name.slice(art.length).trim() : "" };
}

export const MEINE_GERAETE_HILFE = "Ein Name je Gerät, überall gleich\n• Dieses Gerät benennst du einmal hier. Den Namen sehen deine anderen Geräte beim Paket, bei der gemeinsamen Festplatte und im eigenen Netz.\n• Andere Geräte trägst du nie selbst ein: Sie erscheinen von allein mit ihrem eigenen Namen, sobald ein Paket von ihnen eingelesen oder im Netz gekoppelt ist.\n• SD-Karte, USB-Stick und Festplatte sind keine Geräte, darauf läuft keine App. Sie stehen unter „Gemeinsame Festplatte“.";

type Eintrag = { id: string; name: string; wie: string; wann: string | null };
const datum = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); };

export function MeineGeraete({ busy }: { busy: boolean }) {
  const [name, setName] = useState(() => geraetKennung().name);
  const [aendern, setAendern] = useState(() => geraetUnbenannt());
  const start = geraetZerlegen(name);
  const [art, setArt] = useState(start.art);
  const [zusatz, setZusatz] = useState(start.zusatz);
  const [andere, setAndere] = useState<Eintrag[]>([]);
  useEffect(() => {
    if (busy) return;
    let aus = false;
    void Promise.all([paketPartnerAlle().catch(() => []), gemerkteLaufwerke().catch(() => [])]).then(([partner, laufwerke]) => {
      if (aus) return;
      const liste: Eintrag[] = partner.map((p) => ({ id: `paket-${p.geraetId}`, name: p.name, wie: "Paket", wann: [p.letzterEmpfang, p.letztesPaket].filter(Boolean).sort().pop() || null }));
      for (const l of laufwerke) if (l.netz) liste.push({ id: `netz-${l.kennung}`, name: l.netz.rolle === "gast" ? l.name : `${l.name} (Gastgeber hier)`, wie: "im eigenen Netz", wann: l.letzterAbgleich });
      setAndere(liste);
    });
    return () => { aus = true; };
  }, [busy]);
  const speichern = () => { if (!art) return; const g = geraetUmbenennen(geraetName(art, zusatz)); setName(g.name); setAendern(false); };
  return <article className="card security-action-card" data-meine-geraete data-hilfe-ziel="meine-geraete">
    <div className="security-card-heading"><span className="ui-heading-help"><h2><MonitorSmartphone size={18}/> Meine Geräte</h2><InfoPopover label="Meine Geräte erklären" text={MEINE_GERAETE_HILFE}/></span></div>
    {aendern ? <div className="geraet-benennen" data-geraet-benennen>
      <strong>Wie heißt dieses Gerät?</strong>
      <div className="chip-reihe" role="group" aria-label="Art des Geräts">{GERAETE_ARTEN.map((a) => <button key={a} type="button" className={`chip ${art === a ? "aktiv" : ""}`} aria-pressed={art === a} onClick={() => setArt(a)} data-geraet-art={a}>{a}</button>)}</div>
      <label>Zusatz, falls es zwei gleiche gibt (freiwillig)<input value={zusatz} maxLength={40} onChange={(e) => setZusatz(e.target.value)} placeholder="z. B. im Büro" data-geraet-zusatz/></label>
      <div className="button-row"><button type="button" className="button primary" disabled={!art} onClick={speichern} data-geraet-speichern>Speichern</button>{!geraetUnbenannt(name) && <button type="button" className="button secondary" onClick={() => setAendern(false)}>Abbrechen</button>}</div>
    </div> : null}
    <ul className="laufwerk-liste" data-geraete-liste>
      <li data-geraet-dieses><strong data-geraet-name>{geraetUnbenannt(name) ? "Dieses Gerät (noch ohne Namen)" : name}</strong><small>dieses Gerät</small>{!aendern && <span className="button-row"><button type="button" className="button secondary" onClick={() => setAendern(true)} data-geraet-aendern>Name ändern</button></span>}</li>
      {andere.map((g) => <li key={g.id} data-geraet-anderes={g.name}><strong>{g.name}</strong><small>zuletzt: {g.wie}{g.wann ? `, ${datum(g.wann)}` : ""}</small></li>)}
    </ul>
  </article>;
}
