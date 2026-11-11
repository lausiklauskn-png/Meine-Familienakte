"use client";
// Dateiort an jeder Unterlage (2.28.61, Klaus 11.11.): wo die Datei liegt, „Pfad kopieren“, unter Windows „Im Explorer zeigen ›“.
// Android und Browser können keinen Ordner im Dateimanager öffnen; dort bleibt das Kopieren.

import { useEffect, useState } from "react";
import { istProOriginal, proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";
import { InfoPopover } from "./ui-controls";
import { dateiOrtAngabe } from "../lib/datei-ort";

export const DATEI_ORT_HILFE = "Ordner ansehen ja – umbenennen oder verschieben bitte nur in der App\n• Den Titel änderst du in der App. Wer die Datei draußen umbenennt oder verschiebt, trennt sie von der Akte.\n• Im Pro-Tresor sind die Dateien verschlüsselt und heißen nach Nummern; dort nichts von Hand ändern.\n• Ordner öffnen kann nur die Windows-App. Am Handy: Pfad kopieren und in „Eigene Dateien“ suchen.";

let akteName = "";
/** Name des Akten-Ordners (vom gewählten Speicher); leer = Speicher der App. */
export function akteOrtSetzen(handle: { name?: string } | null | undefined) { akteName = handle?.name || ""; }

let tresorStand: Promise<ProTresorZustand | null> | null = null, tresorZeit = 0;
function tresorZustand(): Promise<ProTresorZustand | null> {
  if (!proTresorVerfuegbar()) return Promise.resolve(null);
  if (!tresorStand || Date.now() - tresorZeit > 30000) { tresorZeit = Date.now(); tresorStand = proTresor.zustand().then((z) => z as ProTresorZustand).catch(() => null); }
  return tresorStand;
}

const tauriInvoke = () => (window as unknown as { __TAURI__?: { core?: { invoke: (c: string, a: unknown) => Promise<unknown> } } }).__TAURI__?.core?.invoke;

export function DateiOrt({ storedPath, ohneDateiname = false }: { storedPath: string; ohneDateiname?: boolean }) {
  const [tresorOrt, setTresorOrt] = useState<string | null>(null);
  const [meldung, setMeldung] = useState("");
  useEffect(() => { let aus = false; if (istProOriginal(storedPath)) void tresorZustand().then((z) => { if (!aus) setTresorOrt(z?.ort || null); }); return () => { aus = true; }; }, [storedPath]);
  if (!storedPath) return null;
  const a = dateiOrtAngabe(storedPath, akteName, tresorOrt, ohneDateiname);
  const kopieren = async () => {
    try { await navigator.clipboard.writeText(a.kopie); setMeldung("Kopiert."); }
    catch { setMeldung("Kopieren ging nicht – bitte den Pfad oben markieren."); }
  };
  const zeigen = async () => {
    const invoke = tauriInvoke();
    if (!invoke || !a.explorer) return;
    try { await invoke("fa_ordner_zeigen", { pfad: a.explorer }); setMeldung(""); }
    catch (e) { setMeldung(String(e).includes("NOT_FOUND") ? "Der Ordner ist gerade nicht erreichbar (Laufwerk eingesteckt?)." : "Der Explorer ließ sich nicht öffnen."); }
  };
  return <div className="datei-ort" data-datei-ort>
    <span className="ui-heading-help"><small>Gespeichert in:</small><InfoPopover label="Dateiort erklären" text={DATEI_ORT_HILFE}/></span>
    <span className="datei-ort-pfad" data-datei-ort-pfad>{a.anzeige}</span>
    <span className="button-row">
      <button type="button" className="button secondary compact-button" onClick={() => void kopieren()} data-datei-ort-kopieren>Pfad kopieren</button>
      {a.explorer && tauriInvoke() && <button type="button" className="button secondary compact-button" onClick={() => void zeigen()} data-datei-ort-explorer>Im Explorer zeigen ›</button>}
    </span>
    {meldung && <small role="status" data-datei-ort-meldung>{meldung}</small>}
  </div>;
}
