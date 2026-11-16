/**
 * Übernahme aus dem Datei-Organizer (Klaus 16.11.2026): liegt im Eingangsordner eine `organizer-index.json`, reisen die
 * Angaben des Organizers als Vorschlag mit jeder Datei mit – an derselben Stelle wie die Vorschläge anderer Apps
 * („Vorschläge aus …“ im Prüf-Fenster, `UebergabeVorschlag`). Nichts wird ohne Bestätigung übernommen, nichts überschrieben.
 * Was der Organizer als doppelt markiert hat, wird nicht geholt, wenn das Gegenstück im selben Ordner liegt.
 * Rein, ohne Browser. Der Index ist fremder Inhalt: nur schlichte Texte, feste Längen, keine Pfade.
 */
import type { UebergabeVorschlag } from "./uebergabe-vorschlaege";

export const ORGANIZER_INDEX = "organizer-index.json";
export const ORGANIZER_QUELLE = "Datei-Organizer";
/** Der Index trägt auf Wunsch den gelesenen Text jeder Datei – darum großzügig, aber begrenzt. */
export const ORGANIZER_INDEX_MAX = 64 * 1024 * 1024;

export type OrganizerDatei = { name: string; size: number };
export type OrganizerUebernahme = {
  ok: boolean; grund?: string;
  /** Schlüssel `name|größe` (Name klein geschrieben). */
  vorschlaege: Map<string, { vorschlag: UebergabeVorschlag; hinweis: string }>;
  /** Dateien, die der Organizer als doppelt markiert hat und deren Gegenstück im selben Ordner liegt. */
  doppelt: Set<string>;
};

export const organizerSchluessel = (f: OrganizerDatei) => `${f.name.toLocaleLowerCase("de")}|${f.size}`;
const plain = (v: unknown, max: number) => typeof v === "string" && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v) ? v.trim() : "";
const datum = (v: unknown) => { const s = plain(v, 40); const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? `${m[3]}.${m[2]}.${m[1]}` : ""; };
const leer = (): OrganizerUebernahme => ({ ok: false, vorschlaege: new Map(), doppelt: new Set() });
const FELD_NAME: Record<string, string> = { kategorie: "Bereich", schriftstueck: "Art", absender: "Absender", datum: "Datum", frist: "Frist", betrag: "Betrag", betrifft: "Person" };

export function organizerUebernahme(indexText: string, dateien: OrganizerDatei[], bereiche: readonly string[]): OrganizerUebernahme {
  const aus = leer();
  if (indexText.length > ORGANIZER_INDEX_MAX) return { ...aus, grund: "Index des Datei-Organizers ist zu groß." };
  let roh: unknown;
  try { roh = JSON.parse(indexText); } catch { return { ...aus, grund: "Index des Datei-Organizers ist nicht lesbar." }; }
  const o = roh as { format?: unknown; fassung?: unknown; dateien?: unknown };
  if (!o || typeof o !== "object" || o.format !== "datei-organizer-index") return { ...aus, grund: "Kein Index des Datei-Organizers." };
  if (typeof o.fassung !== "number" || o.fassung > 1) return { ...aus, grund: "Der Index stammt von einer neueren Fassung des Datei-Organizers." };
  if (!Array.isArray(o.dateien)) return { ...aus, grund: "Im Index fehlt die Dateiliste." };

  // Nur Dateien direkt im Ordner (der Eingangsordner wird nicht in die Tiefe gelesen); doppelte Einträge bleiben mehrdeutig.
  const imIndex = new Map<string, Record<string, unknown> | null>(), oben = new Set<string>();
  for (const e of o.dateien) {
    if (!e || typeof e !== "object") continue;
    const r = e as Record<string, unknown>, pfad = plain(r.pfad, 255);
    if (!pfad || /[\\/]/.test(pfad) || typeof r.groesse !== "number") continue;
    oben.add(pfad.toLocaleLowerCase("de"));
    const k = organizerSchluessel({ name: pfad, size: r.groesse });
    imIndex.set(k, imIndex.has(k) ? null : r);
  }
  const da = new Map<string, number>();
  for (const f of dateien) da.set(organizerSchluessel(f), (da.get(organizerSchluessel(f)) || 0) + 1);
  const namenDa = new Set(dateien.map((f) => f.name.toLocaleLowerCase("de")));

  for (const f of dateien) {
    const k = organizerSchluessel(f), r = imIndex.get(k);
    if (!r || da.get(k) !== 1) continue;
    const gegenstueck = plain(r.doppeltVon, 255).toLocaleLowerCase("de");
    if (r.pruefstand === "doppelt" && gegenstueck && gegenstueck !== f.name.toLocaleLowerCase("de") && oben.has(gegenstueck) && namenDa.has(gegenstueck)) { aus.doppelt.add(k); continue; }
    const vorschlag: UebergabeVorschlag = { quelle: ORGANIZER_QUELLE, name: f.name };
    const bereich = plain(r.kategorie, 100), art = plain(r.schriftstueck, 100);
    // Eigene Kategorie aus dem Organizer (Klaus 16.11.): nur wenn dort von Hand gesetzt oder daraus gelernt – sie entsteht hier mit dem Bestätigen.
    const sicherheit = r.sicherheit && typeof r.sicherheit === "object" ? r.sicherheit as Record<string, unknown> : {};
    const bekannt = bereiche.find((b) => b.toLocaleLowerCase("de") === bereich.toLocaleLowerCase("de"));
    const neuerBereich = !!bereich && !bekannt && bereich.length <= 60 && (sicherheit.kategorie === "von dir" || sicherheit.kategorie === "gelernt");
    if (bereich && (bekannt || neuerBereich)) vorschlag.lebensbereich = bekannt || bereich;
    if (art) vorschlag.dokumentart = art;
    const absender = plain(r.absender, 120), betrag = plain(r.betrag, 40), nummer = plain(r.archivnummer, 40), person = plain(r.betrifft, 80);
    const gesperrt = r.pruefstand === "auffällig" ? plain(r.auffaellig, 200) : "";
    const teile = [
      gesperrt ? `Im Organizer gesperrt: ${gesperrt}` : "",
      neuerBereich ? `Neuer Bereich aus dem Organizer: „${bereich}“ – entsteht hier mit dem Übernehmen` : "",
      absender && absender !== "unbekannt" ? `Absender: ${absender}` : "",
      datum(r.datum) ? `Datum: ${datum(r.datum)}` : "",
      datum(r.frist) ? `Frist: ${datum(r.frist)}` : "",
      betrag ? `Betrag: ${betrag}` : "",
      person && !["unbekannt", "allgemein"].includes(person) ? `Person: ${person}` : "",
      nummer ? `Archivnummer: ${nummer}` : "",
    ].filter(Boolean);
    const felder = (wert: string) => Object.keys(FELD_NAME).filter((feld) => sicherheit[feld] === wert).map((feld) => FELD_NAME[feld]);
    const vonDir = felder("von dir"), pruefen = felder("bitte prüfen");
    if (vonDir.length) teile.push(`Im Organizer von dir bestätigt: ${vonDir.join(", ")}`);
    if (pruefen.length) teile.push(`Dort noch unsicher: ${pruefen.join(", ")}`);
    if (teile.length) vorschlag.hinweis = teile.join(" · ").slice(0, 1000);
    if (!vorschlag.lebensbereich && !vorschlag.dokumentart && !vorschlag.hinweis) continue;
    aus.vorschlaege.set(k, { vorschlag, hinweis: gesperrt ? `Der Datei-Organizer hat diese Datei gesperrt: ${gesperrt}. Bitte vor dem Ablegen ansehen.` : "" });
  }
  aus.ok = true;
  return aus;
}
