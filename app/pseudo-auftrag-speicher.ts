"use client";
// Wo die Aufträge des Pseudo-Fensters liegen (P10): Pro wie die Profile – Schlüssel aus dem eigenen Profil (Pro-Tresor oder
// App-Speicher), die verschlüsselte Zuordnung auf diesem Gerät. Tresor gesperrt: nichts lesen, neue Aufträge nur bis zum Schließen.
// Basic und Demo: nur bis zum Schließen (nichts gespeichert). Kein Netzweg.
import { useEffect, useState } from "react";
import { neueProfile } from "../lib/maske-profil.ts";
import {
  ablageAlsText, ablageAusText, ablegen, aufraeumen, auftragSchluessel, entfernen, entschluesseln, verschluesseln, type Ablage, type Auftrag,
} from "../lib/pseudo-auftraege.ts";
import { profilStand, profileSpeichern, useMaskeProfile, type ProfilOrt } from "./maske-profil-speicher";

const KEY = "familienakte_pseudo_auftraege_v1";
const EREIGNIS = "familienakte:pseudo-auftraege";

export type AuftragStand = { ort: ProfilOrt; dauerhaft: boolean; liste: Auftrag[]; nichtLesbar: number; fehler?: string };

let sitzung: Auftrag[] = [];
let stand: AuftragStand = { ort: "laedt", dauerhaft: false, liste: [], nichtLesbar: 0 };
const melden = (s: AuftragStand) => { stand = s; if (typeof window !== "undefined") window.dispatchEvent(new Event(EREIGNIS)); return s; };

const dauerhaftOrt = (o: ProfilOrt) => o === "tresor" || o === "geraet";
const ablageLesen = (): Ablage => { try { return ablageAusText(localStorage.getItem(KEY)); } catch { return ablageAusText(null); } };
const ablageSchreiben = (a: Ablage) => { try { localStorage.setItem(KEY, ablageAlsText(a)); } catch { throw new Error("Der App-Speicher nimmt die Aufträge nicht an."); } };

/** Liest und entschlüsselt alle Aufträge, die zu den Schlüsseln der eigenen Profile passen. */
export async function auftraegeLaden(): Promise<AuftragStand> {
  const p = profilStand();
  if (!dauerhaftOrt(p.ort)) return melden({ ort: p.ort, dauerhaft: false, liste: [...sitzung], nichtLesbar: 0 });
  const ablage = aufraeumen(ablageLesen());
  try { ablageSchreiben(ablage); } catch { /* lesen geht trotzdem */ }
  const liste: Auftrag[] = []; let nichtLesbar = 0;
  for (const v of ablage.eintraege) {
    const geheim = p.eigene?.schluessel[v.k];
    if (!geheim) { nichtLesbar++; continue; }
    try { liste.push(await entschluesseln(v, await auftragSchluessel(geheim))); } catch { nichtLesbar++; }
  }
  // Aus dieser Sitzung (z. B. vor dem Entsperren angelegt) bleibt dazu sichtbar, aber ungespeichert.
  const ids = new Set(liste.map((a) => a.id));
  return melden({ ort: p.ort, dauerhaft: true, liste: [...liste, ...sitzung.filter((a) => !ids.has(a.id))].sort((x, y) => y.geaendert - x.geaendert), nichtLesbar });
}

/** Legt einen Auftrag an oder ergänzt ihn (gleiche id). Gibt zurück, ob er dauerhaft gespeichert wurde. */
export async function auftragMerken(a: Omit<Auftrag, "nr" | "erstellt" | "geaendert"> & Partial<Pick<Auftrag, "nr" | "erstellt">>): Promise<{ auftrag: Auftrag; dauerhaft: boolean }> {
  const jetzt = Date.now();
  const alt = stand.liste.find((x) => x.id === a.id);
  const p = profilStand();
  if (dauerhaftOrt(p.ort)) {
    let profile = p.eigene;
    if (!profile) { profile = await neueProfile(); await profileSpeichern(profile); }
    const k = profile.eigenerSchluessel; const geheim = profile.schluessel[k];
    let ablage = aufraeumen(ablageLesen(), jetzt);
    const auftrag: Auftrag = { ...a, nr: alt?.nr ?? a.nr ?? ablage.naechsteNr, erstellt: alt?.erstellt ?? a.erstellt ?? jetzt, geaendert: jetzt };
    ablage = ablegen(ablage, await verschluesseln(auftrag, await auftragSchluessel(geheim), k));
    ablageSchreiben(ablage);
    sitzung = sitzung.filter((x) => x.id !== a.id);
    await auftraegeLaden();
    return { auftrag, dauerhaft: true };
  }
  const nr = alt?.nr ?? a.nr ?? (Math.max(0, ...sitzung.map((x) => x.nr)) + 1);
  const auftrag: Auftrag = { ...a, nr, erstellt: alt?.erstellt ?? a.erstellt ?? jetzt, geaendert: jetzt };
  sitzung = [auftrag, ...sitzung.filter((x) => x.id !== a.id)];
  melden({ ...stand, ort: p.ort, dauerhaft: false, liste: [auftrag, ...stand.liste.filter((x) => x.id !== a.id)] });
  return { auftrag, dauerhaft: false };
}

/** „Erledigt“: Zuordnung sofort löschen (gespeichert und in der Sitzung). */
export async function auftragErledigt(id: string): Promise<void> {
  sitzung = sitzung.filter((x) => x.id !== id);
  const ablage = ablageLesen();
  if (ablage.eintraege.some((v) => v.id === id)) ablageSchreiben(entfernen(ablage, id));
  melden({ ...stand, liste: stand.liste.filter((x) => x.id !== id) });
}

export function usePseudoAuftraege(basic: boolean): AuftragStand {
  const profil = useMaskeProfile(basic);
  const [s, setS] = useState<AuftragStand>(stand);
  useEffect(() => { const h = () => setS(stand); window.addEventListener(EREIGNIS, h); return () => window.removeEventListener(EREIGNIS, h); }, []);
  // Neu lesen, sobald sich Ort oder Profil-Schlüssel ändern (Entsperren, Übernehmen).
  const schluessel = profil.eigene ? Object.keys(profil.eigene.schluessel).join(",") : "";
  useEffect(() => { if (profil.ort !== "laedt") void auftraegeLaden(); }, [profil.ort, schluessel]);
  return s;
}
