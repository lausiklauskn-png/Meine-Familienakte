import { stapelDatenbank } from "./stapel-ablage";
import { proUebergabeAnnehmen, proUebergabeBauen, proUebergabePruefen } from "./pro-uebergabe";
import type { ProQuittung, ProRueckkanal, ProUebergabe } from "../lib/pro-verbund-vertrag";

const MAGIC = new Uint8Array([70, 65, 80, 82, 79, 49, 10, 0]);
const MAX_HEADER = 8192, MAX_DOCUMENT = 20 * 1024 * 1024;
const text = (x: unknown, n: number): x is string => typeof x === "string" && x.length > 0 && x.length <= n && !/[\u0000-\u001f]/.test(x);
const nonce = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
export type GeraeteAusgang = {
  id: string; typ: "geraete-ausgang"; vaultId: string; vertrag: ProUebergabe; rueckkanal: ProRueckkanal;
  stand: "offen" | "im-eingang"; quittung?: ProQuittung;
};
export type GeraeteEingang = { id: string; vertrag: ProUebergabe; quittung: ProQuittung; rueckkanal: ProRueckkanal };
type Packet = { format: "familienakte-paket/1"; vertrag: ProUebergabe; rueckkanal: ProRueckkanal };
type Receipt = { format: "familienakte-empfang/1"; vertrag: ProUebergabe; rueckkanal: ProRueckkanal; quittung: ProQuittung };
function rueckkanalPruefen(value: ProRueckkanal) {
  if (!value || !/^[a-f0-9]{64}$/.test(value.nonce) || !text(value.empfaenger, 80)) throw Error("Das Paket hat keinen gültigen Rückkanal.");
  return { nonce: value.nonce, empfaenger: value.empfaenger };
}
async function aendern<T>(key: string, fn: (old?: T) => T): Promise<T> {
  const db = await stapelDatenbank();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction("uebergaben", "readwrite"), store = tx.objectStore("uebergaben"), read = store.get(key);
    let result: T, error: unknown;
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(error || tx.error || Error("Die Übergabe konnte nicht dauerhaft gespeichert werden."));
    read.onsuccess = () => { try { result = fn(read.result); store.put(result); } catch (e) { error = e; tx.abort(); } };
  }); } finally { db.close(); }
}
async function alle(): Promise<Array<GeraeteAusgang | GeraeteEingang>> {
  const db = await stapelDatenbank();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction("uebergaben"), read = tx.objectStore("uebergaben").getAll();
    tx.oncomplete = () => resolve(read.result); tx.onabort = () => reject(tx.error);
  }); } finally { db.close(); }
}
export async function geraeteAusgaenge(vaultId: string): Promise<GeraeteAusgang[]> {
  return (await alle()).filter((x): x is GeraeteAusgang => "typ" in x && x.typ === "geraete-ausgang" && x.vaultId === vaultId);
}
export async function geraeteEingaenge(): Promise<GeraeteEingang[]> {
  return (await alle()).filter((x): x is GeraeteEingang => !("typ" in x) && Boolean(x.rueckkanal && x.quittung?.stand === "im-eingang"));
}
/** Only identifiers are persisted at source. The saved original remains in its
 * selected vault; a retry checks those bytes again, with no second PDF collection. */
export async function geraeteAusgangVorbereiten(vaultId: string, file: File, dokumentId: string, empfaenger: string, bezug?: string): Promise<GeraeteAusgang> {
  empfaenger = empfaenger.trim();
  if (!text(vaultId, 200) || !text(empfaenger, 80)) throw Error("Bitte die geöffnete Akte und genau einen Empfänger oder ein Zielgerät wählen.");
  const built = await proUebergabeBauen(file, "familienakte", "familienakte", dokumentId);
  if (bezug) built.bezug = bezug;
  const vertrag = await proUebergabePruefen(built, file, "familienakte");
  const id = "geraete-ausgang:" + JSON.stringify([vaultId, dokumentId, empfaenger, vertrag.name, vertrag.mime, vertrag.sha256, vertrag.bezug || ""]);
  return aendern<GeraeteAusgang>(id, old => old || { id, typ: "geraete-ausgang", vaultId, vertrag, rueckkanal: { nonce: nonce(), empfaenger }, stand: "offen" });
}
export async function geraetePaket(ausgang: GeraeteAusgang, file: File): Promise<File> {
  const vertrag = await proUebergabePruefen(ausgang.vertrag, file, "familienakte");
  const header: Packet = { format: "familienakte-paket/1", vertrag, rueckkanal: rueckkanalPruefen(ausgang.rueckkanal) };
  const encoded = new TextEncoder().encode(JSON.stringify(header));
  if (encoded.length > MAX_HEADER) throw Error("Der Übergabevertrag ist zu groß.");
  const prefix = new Uint8Array(12); prefix.set(MAGIC); new DataView(prefix.buffer).setUint32(8, encoded.length);
  // Der Name der Unterlage steht im Dateinamen, damit man das Paket unterwegs wiedererkennt (U12); die Kennung hält ihn eindeutig.
  const stamm = vertrag.name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  return new File([prefix, encoded, file], `Familienakte-${stamm ? stamm + "-" : ""}${vertrag.id}.familienakte-paket`, { type: "application/octet-stream" });
}
export async function geraetePaketLesen(packet: File): Promise<{ vertrag: ProUebergabe; rueckkanal: ProRueckkanal; file: File }> {
  if (packet.size < 12 || packet.size > MAX_DOCUMENT + MAX_HEADER + 12) throw Error("Das Paket ist unvollständig oder überschreitet 20 MiB Originaldatei.");
  const prefix = new Uint8Array(await packet.slice(0, 12).arrayBuffer());
  if (!MAGIC.every((x, i) => prefix[i] === x)) throw Error("Bitte eine Familienakte-Paketdatei auswählen.");
  const length = new DataView(prefix.buffer).getUint32(8);
  if (!length || length > MAX_HEADER || length + 12 > packet.size) throw Error("Der Paketkopf ist beschädigt.");
  let header: Packet;
  try { header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await packet.slice(12, 12 + length).arrayBuffer())); }
  catch { throw Error("Der Paketkopf kann nicht gelesen werden."); }
  if (!header || header.format !== "familienakte-paket/1" || !header.vertrag || !text(header.vertrag.name, 255) || !text(header.vertrag.mime || "application/octet-stream", 200)) throw Error("Unbekanntes Paketformat.");
  const rueckkanal = rueckkanalPruefen(header.rueckkanal);
  const file = new File([packet.slice(12 + length)], header.vertrag.name, { type: header.vertrag.mime });
  const vertrag = await proUebergabePruefen(header.vertrag, file, "familienakte");
  return { vertrag, rueckkanal, file };
}
export async function geraetePaketAnnehmen(packet: File): Promise<ProQuittung> {
  const { vertrag, rueckkanal, file } = await geraetePaketLesen(packet);
  // Original, queue row, nonce and repeatable receipt commit in one transaction.
  return proUebergabeAnnehmen(vertrag, file, rueckkanal);
}
export function geraeteQuittung(eingang: GeraeteEingang): File {
  const receipt: Receipt = { format: "familienakte-empfang/1", vertrag: eingang.vertrag, rueckkanal: eingang.rueckkanal, quittung: eingang.quittung };
  return new File([JSON.stringify(receipt)], "Empfang-" + eingang.vertrag.sha256.slice(0, 16) + ".familienakte-quittung", { type: "application/json" });
}
export async function geraeteQuittungAnnehmen(file: File, vaultId: string): Promise<GeraeteAusgang> {
  if (file.size > MAX_HEADER) throw Error("Die Empfangsdatei ist zu groß.");
  let receipt: Receipt;
  try { receipt = JSON.parse(await file.text()); } catch { throw Error("Die Empfangsdatei ist beschädigt."); }
  if (!receipt || receipt.format !== "familienakte-empfang/1" || !receipt.vertrag || !receipt.quittung) throw Error("Bitte eine Familienakte-Empfangsdatei auswählen.");
  const channel = rueckkanalPruefen(receipt.rueckkanal);
  const outgoing = (await geraeteAusgaenge(vaultId)).find(x => x.vertrag.id === receipt.vertrag.id);
  if (!outgoing) throw Error("Diese Bestätigung gehört zu keiner Übergabe der geöffneten Akte.");
  return aendern<GeraeteAusgang>(outgoing.id, old => {
    const q = receipt.quittung;
    if (!old || JSON.stringify(old.vertrag) !== JSON.stringify(receipt.vertrag) || old.rueckkanal.nonce !== channel.nonce || old.rueckkanal.empfaenger !== channel.empfaenger ||
      q.id !== old.vertrag.id || q.quelle !== old.vertrag.quelle || q.ziel !== old.vertrag.ziel || q.sha256 !== old.vertrag.sha256 || q.groesse !== old.vertrag.groesse ||
      q.stand !== "im-eingang" || !text(q.eingangId, 160) || (old.quittung && old.quittung.eingangId !== q.eingangId)) throw Error("Die Bestätigung passt nicht zu dieser Übergabe.");
    return { ...old, stand: "im-eingang", quittung: { id: q.id, quelle: q.quelle, ziel: q.ziel, sha256: q.sha256, groesse: q.groesse, eingangId: q.eingangId, stand: q.stand } };
  });
}
