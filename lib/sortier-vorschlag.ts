/**
 * Anschluss des Sortier-Kerns (Datei-Organizer, byte-gleich in lib/sortierkern/) an den Eingang der Familienakte.
 * Klaus 13.11.2026: der Kern sortiert nachweislich besser als die Stichwortliste – also hereinziehen.
 * Nachweis (Datei-Organizer docs/PRUEFSTAPEL-VERMIETERIN-REGELN.md, „Einbau in die Familienakte“): an sechs fremden Stapeln
 * Bereich und Frist gesichert besser als der bisherige Eingang. Rein, ohne Browser; nichts verlässt das Gerät.
 */
import { siebe } from "./sortierkern/siebe.ts";
import { erkenneDatum, erkenneFrist } from "./sortierkern/erkennen.ts";
import type { Datei } from "./sortierkern/typen.ts";

/** Ab dieser Textlänge gilt der Kern; darunter (Dateiname, kurzer Hinweis) bleibt die bisherige Zuordnung. */
export const KERN_AB_ZEICHEN = 200;

export type KernVorschlag = { bereich: string | null; bereichSicher: boolean; schriftstueck: string | null; absender: string | null; frist: string | null; grund: string };

export function kernVorschlag(name: string, text: string): KernVorschlag | null {
  const voll = String(text || "");
  if (voll.trim().length < KERN_AB_ZEICHEN) return null;
  const d: Datei = { pfad: name, name, groesse: voll.length, geaendert: 0, art: "text", volltext: voll, kopfText: voll.slice(0, 1500), textQuelle: "text", stufe: 0, felder: {} };
  const f = siebe(d, 5).felder || {};
  const bereich = f.kategorie?.wert && f.kategorie.wert !== "Archiv" ? f.kategorie.wert : null;
  const absender = f.absender?.wert && f.absender.wert !== "unbekannt" ? f.absender.wert : null;
  return { bereich, bereichSicher: !!f.kategorie?.sicher, schriftstueck: f.schriftstueck?.wert || null, absender, frist: f.frist?.wert || null, grund: f.kategorie?.grund || "" };
}

/** Frist aus dem ganzen Text (Kern). null = keine Handlungsfrist erkannt; undefined = Text zu kurz, der Kern gilt nicht. */
export function kernFrist(text: string): { datum: string; grund: string } | null | undefined {
  const voll = String(text || "");
  if (voll.trim().length < KERN_AB_ZEICHEN) return undefined;
  const datum = erkenneDatum(voll.slice(0, 1500));
  const w = erkenneFrist(voll, datum?.wert, datum?.sicher !== false);
  return w?.wert ? { datum: w.wert, grund: w.grund } : null;
}

/**
 * Absender aus dem Kern statt aus dem Briefkopf-Baustein (Punkt 4 der Empfehlung, 13.11.2026): an sechs fremden Stapeln traf der Kern
 * den Absender in rund 87 % der Fälle, der Briefkopf-Baustein in rund 35 %. Gilt nur mit gelesenem Text (ab KERN_AB_ZEICHEN); findet der
 * Kern keinen, bleibt der Baustein. Datum, Empfänger, Nummern und Thema bleiben beim Baustein. Daraus folgt auch der Titel „Brief von …“.
 */
export function mitKernAbsender<T extends { absender?: { wert?: unknown } | null } | null | undefined>(kopf: T, text: string): T {
  const voll = String(text || "");
  if (voll.trim().length < KERN_AB_ZEICHEN) return kopf;
  const d: Datei = { pfad: "x", name: "x", groesse: voll.length, geaendert: 0, art: "text", volltext: voll, kopfText: voll.slice(0, 1500), textQuelle: "text", stufe: 0, felder: {} };
  const a = siebe(d, 4).felder?.absender;
  if (!a?.wert || a.wert === "unbekannt") return kopf;
  return { ...(kopf || {}), absender: { ...((kopf && kopf.absender) || {}), wert: a.wert, quelle: "Sortier-Kern" } } as T;
}
