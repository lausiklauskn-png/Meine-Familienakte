/** Stufe I (Plan 08.11.2026, Punkt 10b): Paket per Teilen. Eine Datei (.fav) mit den Änderungen seit dem letzten Abgleich mit
 *  genau diesem Gerät (Einträge, Notizen, Verknüpfungen; Originale auf Wunsch), immer verschlüsselt. Sie geht über Mail,
 *  Messenger oder einen Stick an das andere Gerät; dort liest „Paket einlesen“ sie mit demselben Drei-Wege-Abgleich ein wie
 *  die Festplatte. Der Schlüssel je Partner wird nach dem ersten Mal auf beiden Geräten gemerkt (eigener App-Speicher). */
import { abgleichAnwenden, abgleichPlanen, basisAus, BEREICHE, fingerabdruck, ohneLokaleFelder, schluessel as schl, type AbgleichPlan, type Akte, type Basis, type Bereich, type Seite } from "../lib/abgleich";
import { b64, dateiEntschluesseln, dateiVerschluesseln, schluesselExportieren, schluesselImportieren, tresorAnlegen, tresorOeffnen, unb64, type SicherungsKopf } from "../lib/sicherung-krypto";
import { akteFuerAbgleich, akteNachAbgleichSchreiben, dokumentDateiAblegen, dokumentDateiOderNull, fileChecksum, type LocalDocument } from "./local-vault";
import { geraetKennung, laufwerkTx, type Geraet } from "./laufwerk";

export const PAKET_FORMAT = "familienakte-paket";
export const PAKET_GRENZE = 100 * 1024 * 1024;
export type PaketPartner = { geraetId: string; name: string; schluessel: string | null; kopf: SicherungsKopf | null; basis: Basis; letztesPaket: string | null; letzterEmpfang: string | null; angelegt: string };
export type PaketKopf = { format: typeof PAKET_FORMAT; version: 1; von: Geraet; an: Geraet | null; zeit: string; fassung: string; kopf: SicherungsKopf; originale: number; eintraege: number };
type Original = { id: string; checksum: string; name: string; typ: string; b64: string };
export type PaketInhalt = { akte: Akte; originale: Original[] };

export const paketPartnerAlle = () => laufwerkTx<PaketPartner[]>("pakete", "readonly", (s) => s.getAll());
export const paketPartnerMerken = (p: PaketPartner) => laufwerkTx("pakete", "readwrite", (s) => s.put(p));
export const paketPartnerVergessen = (geraetId: string) => laufwerkTx("pakete", "readwrite", (s) => s.delete(geraetId));
const leereAkte = (): Akte => ({ documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {} });
const enc = new TextEncoder(), dec = new TextDecoder();
export const paketName = (von: Geraet, zeit: string) => `Familienakte-Paket_${von.name.replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 30)}_${zeit.slice(0, 16).replace(/[:T]/g, "-")}.fav`;

/** Welche Einträge seit dem gemerkten Stand neu oder geändert sind (alles, wenn kein Stand gemerkt ist oder `alles` gewünscht). */
export function aenderungenSeit(akte: Akte, basis: Basis | null): { akte: Akte; anzahl: number } {
  const out = leereAkte(); let anzahl = 0;
  for (const bereich of BEREICHE) {
    const liste = (akte[bereich] || []).filter((x) => { const alt = basis?.[schl(bereich, x.id)]; return !alt || alt !== fingerabdruck(ohneLokaleFelder(bereich, x)); });
    out[bereich] = liste; anzahl += liste.length;
  }
  out.sequences = akte.sequences;
  return { akte: out, anzahl };
}

export type PaketErgebnis = { file: File; eintraege: number; originale: number; notfall: string | null; partner: PaketPartner; zuGross: string[] };
/** Erstellt das Paket für einen Partner. Neuer Partner: Passwort nötig (Schlüssel entsteht, Notfallblatt kommt zurück). */
export async function paketErstellen(aktiv: FileSystemDirectoryHandle, partner: PaketPartner | { name: string; passwort: string }, wahl: { originale: boolean; alles: boolean }, appVersion: string): Promise<PaketErgebnis | null> {
  const { akte } = await akteFuerAbgleich(aktiv);
  const bekannt = "geraetId" in partner ? partner : null;
  const basis = bekannt && !wahl.alles && Object.keys(bekannt.basis).length ? bekannt.basis : null;
  const { akte: teil, anzahl } = aenderungenSeit(akte as unknown as Akte, basis);
  if (!anzahl) return null;
  const zeit = new Date().toISOString(); const von = geraetKennung();
  let daten: CryptoKey, kopf: SicherungsKopf, notfall: string | null = null, p: PaketPartner;
  if (bekannt?.schluessel && bekannt.kopf) { daten = await schluesselImportieren(bekannt.schluessel); kopf = bekannt.kopf; p = bekannt; }
  else {
    const passwort = "passwort" in partner ? partner.passwort : "";
    if (!passwort) throw new Error("Für dieses Gerät ist noch kein Schlüssel gemerkt – bitte ein Passwort für das Paket festlegen.");
    const t = await tresorAnlegen(passwort, { appVersion, createdAt: zeit });
    daten = await tresorOeffnen(t.kopf, { passwort }, true); kopf = t.kopf; notfall = t.notfall;
    p = { geraetId: bekannt?.geraetId || `neu-${crypto.randomUUID()}`, name: partner.name, schluessel: await schluesselExportieren(daten), kopf, basis: bekannt?.basis || {}, letztesPaket: null, letzterEmpfang: null, angelegt: bekannt?.angelegt || zeit };
  }
  const originale: Original[] = []; const zuGross: string[] = []; let groesse = 0;
  if (wahl.originale) {
    for (const d of teil.documents as unknown as LocalDocument[]) {
      const f = await dokumentDateiOderNull(aktiv, d); if (!f) continue;
      if (groesse + f.size > PAKET_GRENZE) { zuGross.push(d.titel || d.originalName); continue; }
      groesse += f.size;
      originale.push({ id: d.id, checksum: d.checksum || await fileChecksum(f), name: d.originalName, typ: f.type || d.mimeType || "application/octet-stream", b64: b64(new Uint8Array(await f.arrayBuffer())) });
    }
  }
  const inhalt: PaketInhalt = { akte: teil, originale };
  const teile: Uint8Array[] = []; await dateiVerschluesseln(daten, new Blob([enc.encode(JSON.stringify(inhalt))]), async (t) => { teile.push(t); });
  const pk: PaketKopf = { format: PAKET_FORMAT, version: 1, von, an: bekannt && !bekannt.geraetId.startsWith("neu-") ? { id: bekannt.geraetId, name: bekannt.name } : null, zeit, fassung: appVersion, kopf, originale: originale.length, eintraege: anzahl };
  const file = new File([enc.encode(JSON.stringify(pk) + "\n"), ...(teile as BlobPart[])], paketName(von, zeit), { type: "application/octet-stream" });
  // Gemerkt wird der Stand, den dieses Paket trägt – kommt es nicht an, hilft „Alles senden“.
  p = { ...p, basis: basisAus(akte as unknown as Akte), letztesPaket: zeit };
  await paketPartnerMerken(p);
  return { file, eintraege: anzahl, originale: originale.length, notfall, partner: p, zuGross };
}

/** Liest nur den Kopf (unverschlüsselt): wer schickt, wann, wie viel. */
export async function paketKopfLesen(file: File): Promise<{ kopf: PaketKopf; geheim: Blob }> {
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 64 * 1024)).arrayBuffer());
  const nl = bytes.indexOf(10);
  if (nl < 0) throw new Error("Das ist kein Familienakte-Paket.");
  let k: PaketKopf;
  try { k = JSON.parse(dec.decode(bytes.subarray(0, nl))) as PaketKopf; } catch { throw new Error("Das ist kein Familienakte-Paket."); }
  if (k?.format !== PAKET_FORMAT || k.version !== 1 || !k.kopf?.schluessel || !k.von?.id) throw new Error("Das ist kein Familienakte-Paket oder es hat ein unbekanntes Format.");
  return { kopf: k, geheim: file.slice(nl + 1) };
}
/** Öffnet den Inhalt – mit gemerktem Schlüssel, Passwort oder Notfallschlüssel. */
export async function paketOeffnen(kopf: PaketKopf, geheim: Blob, zugang: { passwort?: string; notfall?: string; schluessel?: string }): Promise<{ inhalt: PaketInhalt; schluessel: string }> {
  // Der gemerkte Schlüssel wird nicht extrahierbar eingelesen; gemerkt wird darum die Textform.
  const daten = zugang.schluessel ? await schluesselImportieren(zugang.schluessel) : await tresorOeffnen(kopf.kopf, zugang, true);
  const schluessel = zugang.schluessel || await schluesselExportieren(daten);
  const teile: Uint8Array[] = [];
  try { await dateiEntschluesseln(daten, geheim, async (t) => { teile.push(t); }); }
  catch { throw new Error(zugang.schluessel ? "SCHLUESSEL_PASST_NICHT" : "PASSWORT_FALSCH"); }
  const inhalt = JSON.parse(dec.decode(await new Blob(teile as BlobPart[]).arrayBuffer())) as PaketInhalt;
  if (!inhalt?.akte?.documents) throw new Error("Der Inhalt des Pakets ist unvollständig.");
  return { inhalt, schluessel };
}

/** Der gemerkte Partner zu einem Paket: an der Gerätekennung oder – beim ersten Rücklauf – am gemeinsamen Schlüsselkopf (Salt). */
export function partnerFuer(kopf: PaketKopf, alle: PaketPartner[]): PaketPartner | null {
  return alle.find((p) => p.geraetId === kopf.von.id) || alle.find((p) => p.kopf?.kdf.salt === kopf.kopf.kdf.salt) || null;
}
export type PaketVorschau = { plan: AbgleichPlan; revision: number; originale: number; fehlen: number };
export async function paketVorbereiten(aktiv: FileSystemDirectoryHandle, inhalt: PaketInhalt, partner: PaketPartner | null): Promise<PaketVorschau> {
  const { akte: hier, revision } = await akteFuerAbgleich(aktiv);
  const dort = { ...leereAkte(), ...inhalt.akte };
  const basis = partner?.basis && Object.keys(partner.basis).length ? partner.basis : null;
  const plan = abgleichPlanen(hier as unknown as Akte, dort, basis);
  const mitDatei = new Set(inhalt.originale.map((o) => o.checksum));
  let fehlen = 0;
  for (const d of plan.dortAngepasst.documents as unknown as LocalDocument[]) { if (!(await dokumentDateiOderNull(aktiv, d)) && !(d.checksum && mitDatei.has(d.checksum))) fehlen++; }
  return { plan, revision, originale: inhalt.originale.length, fehlen };
}
export type PaketUebernahme = { neu: number; uebernommen: number; konflikteDort: number; abgelegt: number; fehlen: number };
export async function paketAnwenden(aktiv: FileSystemDirectoryHandle, kopf: PaketKopf, inhalt: PaketInhalt, schluessel: string, vorschau: PaketVorschau, wahl: Record<string, Seite>, partner: PaketPartner | null): Promise<PaketUebernahme> {
  const basis = partner?.basis && Object.keys(partner.basis).length ? partner.basis : null;
  const { akte } = abgleichAnwenden(vorschau.plan, wahl, basis);
  const dokumente = akte.documents as unknown as LocalDocument[];
  const nachSumme = new Map(inhalt.originale.map((o) => [o.checksum, o]));
  let abgelegt = 0, fehlen = 0;
  for (let i = 0; i < dokumente.length; i++) {
    const d = dokumente[i];
    if (await dokumentDateiOderNull(aktiv, d)) continue;
    const o = d.checksum ? nachSumme.get(d.checksum) : undefined;
    if (!o) { fehlen++; continue; }
    const file = new File([unb64(o.b64) as BlobPart], d.originalName || o.name, { type: o.typ });
    dokumente[i] = await dokumentDateiAblegen(aktiv, d, file); abgelegt++;
  }
  const konflikteDort = vorschau.plan.konflikte.filter((k) => wahl[k.schluessel] === "dort").length;
  await akteNachAbgleichSchreiben(aktiv, akte as never, vorschau.revision, "Paket eingelesen", `Paket von „${kopf.von.name}“ (${kopf.zeit}): ${vorschau.plan.zaehlung.neu} neu, ${vorschau.plan.zaehlung.uebernommen} übernommen, ${vorschau.plan.konflikte.length} Unterschiede (${konflikteDort} aus dem Paket gewählt), ${abgelegt} Originale abgelegt.`);
  const { akte: frisch } = await akteFuerAbgleich(aktiv);
  const zeit = new Date().toISOString();
  // Ein vorläufiger Eintrag („neu-…“, Partner kannte seine Kennung noch nicht) wird durch die echte Kennung ersetzt.
  if (partner && partner.geraetId !== kopf.von.id) await paketPartnerVergessen(partner.geraetId);
  await paketPartnerMerken({ geraetId: kopf.von.id, name: kopf.von.name, schluessel, kopf: kopf.kopf, basis: basisAus(frisch as unknown as Akte), letztesPaket: partner?.letztesPaket || null, letzterEmpfang: zeit, angelegt: partner?.angelegt || zeit });
  return { neu: vorschau.plan.zaehlung.neu, uebernommen: vorschau.plan.zaehlung.uebernommen, konflikteDort, abgelegt, fehlen };
}
/** Bereiche, in denen das Paket etwas trägt – für die Anzeige. */
export const paketBereiche = (inhalt: PaketInhalt) => BEREICHE.filter((b: Bereich) => (inhalt.akte[b] || []).length);
