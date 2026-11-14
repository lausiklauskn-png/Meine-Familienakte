"use client";
// Wo die Profile für die Maske liegen (Plan Pseudonymisieren, Stufe C):
// - Pro mit offenem Pro-Tresor: Fach „profile“ (verschlüsselt, alle Pro-Apps lesen) – app/pro-tresor.ts proTresorProfile.
// - Pro-Tresor verbunden, aber gesperrt/nicht erreichbar: nichts lesen, nichts still woanders speichern (Speicherregel 01.11.).
// - Pro ohne Pro-Tresor: im App-Speicher neben der Akte (gleicher Schutz wie die Akte), Hinweis „Tresor einrichten“.
// - Basic (PWA) und Demo: nichts gespeichert (P4).
// Ein gemeinsamer Stand für Profilseite und Pseudo-Fenster; kein Netzweg (Probe in scripts/run-maske-profil-tests.mjs).
import { useEffect, useState } from "react";
import { demoActive } from "../lib/demo-workspace.ts";
import { profilAlsText, profilAusText, type MaskeProfile } from "../lib/maske-profil.ts";
import { proTresor, proTresorProfile, proTresorVerfuegbar } from "./pro-tresor";

export type ProfilOrt = "tresor" | "geraet" | "gesperrt" | "basic" | "demo" | "laedt";
export type FremdeProfile = { schreiber: string; datum: number; profile?: MaskeProfile; fehler?: string };
export type ProfilStand = { ort: ProfilOrt; eigene: MaskeProfile | null; andere: FremdeProfile[]; vaultId?: string; fehler?: string };

const GERAET_KEY = "familienakte_maske_profile_v1";
const EREIGNIS = "familienakte:maske-profile";
let stand: ProfilStand = { ort: "laedt", eigene: null, andere: [] };
let laeuft: Promise<ProfilStand> | null = null;

const melden = (s: ProfilStand) => { stand = s; if (typeof window !== "undefined") window.dispatchEvent(new Event(EREIGNIS)); return s; };

function vomGeraet(): MaskeProfile | null {
  try { const t = localStorage.getItem(GERAET_KEY); return t ? profilAusText(t) : null; } catch { return null; }
}

/** Liest die Profile neu (bei Start, nach Entsperren, auf Knopf). */
export function profileLaden(basic: boolean): Promise<ProfilStand> {
  if (laeuft) return laeuft;
  laeuft = (async () => {
    if (demoActive()) return melden({ ort: "demo", eigene: null, andere: [] });
    if (basic) return melden({ ort: "basic", eigene: null, andere: [] });
    if (proTresorVerfuegbar()) {
      let z;
      try { z = await proTresor.zustand(); } catch { z = { status: "getrennt" as const }; }
      if (z.status === "offen" && z.id) {
        if (!proTresorProfile.verfuegbar()) return melden({ ort: "geraet", eigene: vomGeraet(), andere: [], fehler: "Diese App-Fassung kann Profile noch nicht im Tresor speichern; sie liegen vorerst auf diesem Gerät." });
        try {
          const items = await proTresorProfile.lesen(z.id);
          const lesen = (i: { schreiber: string; datum: number; text?: string; fehler?: string }): FremdeProfile => {
            if (!i.text) return { schreiber: i.schreiber, datum: i.datum, fehler: i.fehler || "nicht lesbar" };
            try { return { schreiber: i.schreiber, datum: i.datum, profile: profilAusText(i.text) }; }
            catch (e) { return { schreiber: i.schreiber, datum: i.datum, fehler: e instanceof Error ? e.message : String(e) }; }
          };
          const alle = items.map(lesen);
          const eigen = alle.find((x) => x.schreiber === "familienakte");
          return melden({ ort: "tresor", vaultId: z.id, eigene: eigen?.profile || null, andere: alle.filter((x) => x.schreiber !== "familienakte"), ...(eigen?.fehler ? { fehler: `Eigene Profil-Datei im Tresor ist nicht lesbar (${eigen.fehler}).` } : {}) });
        } catch (e) { return melden({ ort: "gesperrt", eigene: null, andere: [], fehler: e instanceof Error ? e.message : String(e) }); }
      }
      if (z.status !== "getrennt") return melden({ ort: "gesperrt", eigene: null, andere: [] });
    }
    return melden({ ort: "geraet", eigene: vomGeraet(), andere: [] });
  })().finally(() => { laeuft = null; });
  return laeuft;
}

/** Speichert die eigenen Profile dort, wo sie gelesen wurden. Nie still an einen anderen Ort. */
export async function profileSpeichern(p: MaskeProfile): Promise<void> {
  const text = profilAlsText({ ...p, schreiber: "familienakte" });
  if (stand.ort === "tresor" && stand.vaultId) {
    await proTresorProfile.schreiben(stand.vaultId, text);
  } else if (stand.ort === "geraet") {
    try { localStorage.setItem(GERAET_KEY, text); } catch { throw new Error("Der App-Speicher nimmt die Profile nicht an."); }
  } else if (stand.ort === "gesperrt") throw new Error("Der Pro-Tresor ist gesperrt oder nicht erreichbar. Bitte entsperren – die Profile werden nicht woanders gespeichert.");
  else throw new Error("Hier werden keine Profile gespeichert.");
  melden({ ...stand, eigene: profilAusText(text) });
}

export const profilStand = () => stand;

/** Gemeinsamer Stand für alle Ansichten; lädt beim ersten Gebrauch. */
export function useMaskeProfile(basic: boolean): ProfilStand {
  const [s, setS] = useState<ProfilStand>(stand);
  useEffect(() => {
    const h = () => setS(stand);
    window.addEventListener(EREIGNIS, h);
    if (stand.ort === "laedt") void profileLaden(basic); else h();
    return () => window.removeEventListener(EREIGNIS, h);
  }, [basic]);
  return s;
}
