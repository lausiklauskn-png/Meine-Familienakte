/** 2.28.65: E-Mail-Wege zur Laufzeit – Wahl merken, Mail-App öffnen (Weg B), Microsoft-Postfach (Weg C), Abholen aus
 *  Private Brain Pro über das Tresor-Fach „eingang-familienakte“ (Weg F). Weg H (eigenes Mail-Programm mit dem Mail-Kern aus
 *  Private Brain) ist nur vorbereitet: die Schnittstelle `EigenesPostfach` unten, in der Wahl „geplant“. */
import { MAIL_WAHL_SCHLUESSEL, emlName, microsoftFehler, mailtoAdresse, wahlLesen, type MailWahl } from "../lib/mail-wege";
import { workspaceStorage } from "../lib/demo-workspace";
import { microsoftMailAbruf } from "./kalender-anbieter";
import { proEingangAufnehmen, proEingangLesen } from "./pro-verbund";
import { proTresor } from "./pro-tresor";
import { nativePlattform } from "./nativer-ordner";

export const mailWahl = (): MailWahl => { try { return wahlLesen(workspaceStorage.getItem(MAIL_WAHL_SCHLUESSEL)); } catch { return wahlLesen(null); } };
export function mailWahlSetzen(w: MailWahl) { try { workspaceStorage.setItem(MAIL_WAHL_SCHLUESSEL, JSON.stringify(w)); } catch { /* nur diese Sitzung */ } window.dispatchEvent(new Event("familienakte:mail-wahl")); }

// ---------- Weg B: Mail-App öffnen ----------
type SharePlugin = { teilenStueck(a: { id: string; data: string }): Promise<void>; mailOeffnen?(a: { an: string; betreff: string; text: string; anlagen: Array<{ id: string; name: string; mime: string }> }): Promise<{ geoeffnet: boolean }> };
const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const STUECK = 768 * 1024;
function sharePlugin(): SharePlugin | null {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { FamilienakteShare?: Partial<SharePlugin> } } }).Capacitor;
  const p = cap?.Plugins?.FamilienakteShare;
  return cap?.isNativePlatform?.() && p?.teilenStueck && p.mailOeffnen ? p as SharePlugin : null;
}
export type MailAppErgebnis = "geoeffnet" | "geteilt" | "kopiert" | "abgebrochen";
/** Android: Auswahl nur mit Mail-Apps, Anlagen über die geschützte Dateifreigabe. Browser: Teilen mit Dateien, ohne Anlagen mailto:.
 *  Windows (e4): kein sicheres „Mail-App mit Anlage öffnen“ – Text wird kopiert, Anlagen gespeichert, die Mail-App öffnet ohne Anlagen. */
export async function inMailAppOeffnen(m: { an: string; betreff: string; text: string; anlagen: File[] }): Promise<MailAppErgebnis> {
  const p = sharePlugin();
  if (p?.mailOeffnen) {
    const anlagen: Array<{ id: string; name: string; mime: string }> = [];
    for (const f of m.anlagen) {
      const id = crypto.randomUUID(); const u = new Uint8Array(await f.arrayBuffer());
      for (let o = 0; o < u.length || o === 0; o += STUECK) { await p.teilenStueck({ id, data: b64(u.subarray(o, o + STUECK)) }); if (!u.length) break; }
      anlagen.push({ id, name: f.name, mime: f.type || "application/octet-stream" });
    }
    await p.mailOeffnen({ an: m.an, betreff: m.betreff, text: m.text, anlagen });
    return "geoeffnet";
  }
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (m.anlagen.length && nativePlattform() !== "windows" && nav.share && nav.canShare?.({ files: m.anlagen })) {
    try { await nav.share({ files: m.anlagen, title: m.betreff, text: `An: ${m.an}\n\n${m.text}` }); return "geteilt"; }
    catch (e) { if ((e as Error).name === "AbortError") return "abgebrochen"; }
  }
  if (m.anlagen.length) {
    try { await navigator.clipboard.writeText(`An: ${m.an}\nBetreff: ${m.betreff}\n\n${m.text}`); } catch { /* ohne Zwischenablage */ }
    for (const f of m.anlagen) { const url = URL.createObjectURL(f); const a = document.createElement("a"); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
    mailtoOeffnen(m.an, m.betreff, m.text);
    return "kopiert";
  }
  mailtoOeffnen(m.an, m.betreff, m.text);
  return "geoeffnet";
}
function mailtoOeffnen(an: string, betreff: string, text: string) {
  const a = document.createElement("a"); a.href = mailtoAdresse(an, betreff, text.slice(0, 1800)); a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
}

// ---------- Weg C: Microsoft-Postfach ----------
export type MailKopf = { id: string; betreff: string; von: string; empfangen: string; anhaenge: boolean };
const GRAPH = "https://graph.microsoft.com/v1.0/me";
async function graphFehler(r: Response): Promise<never> {
  const j = await r.json().catch(() => ({})) as { error?: { code?: string } };
  throw new Error(microsoftFehler(r.status, j.error?.code || ""));
}
/** e5: nur auf Tipp, die letzten 30 Tage, im Postfach wird nichts verändert (kein „gelesen“, kein Verschieben). */
export async function microsoftMailsListen(tage = 30): Promise<MailKopf[]> {
  const ab = new Date(Date.now() - tage * 86400000).toISOString();
  const q = new URLSearchParams({ $top: "50", $select: "id,subject,from,receivedDateTime,hasAttachments", $filter: `receivedDateTime ge ${ab}`, $orderby: "receivedDateTime desc" });
  const r = await microsoftMailAbruf(`${GRAPH}/mailFolders/inbox/messages?${q.toString().replace(/\+/g, "%20")}`);
  if (!r.ok) await graphFehler(r);
  const j = await r.json() as { value?: Array<{ id: string; subject?: string; from?: { emailAddress?: { name?: string; address?: string } }; receivedDateTime?: string; hasAttachments?: boolean }> };
  return (j.value || []).map((m) => ({ id: m.id, betreff: m.subject || "Ohne Betreff", von: m.from?.emailAddress?.name || m.from?.emailAddress?.address || "", empfangen: m.receivedDateTime || "", anhaenge: Boolean(m.hasAttachments) }));
}
/** Eine Mail unverändert (MIME mit Anhängen) als .eml – geht in die Eingangszentrale, Anhänge lassen sich dort herauslösen. */
export async function microsoftMailAlsEml(k: MailKopf): Promise<File> {
  const r = await microsoftMailAbruf(`${GRAPH}/messages/${encodeURIComponent(k.id)}/$value`);
  if (!r.ok) await graphFehler(r);
  return new File([await r.blob()], emlName(k.betreff, k.empfangen), { type: "message/rfc822" });
}
const alsB64 = async (f: File) => b64(new Uint8Array(await f.arrayBuffer()));
/** Senden nur nach Bestätigungsfenster; liegt danach in „Gesendete Elemente“. Ist unklar, ob gesendet wurde, nie von selbst wiederholen. */
export async function microsoftMailSenden(m: { an: string[]; betreff: string; text: string; anlagen: File[] }): Promise<void> {
  const nachricht = { message: { subject: m.betreff, body: { contentType: "Text", content: m.text }, toRecipients: m.an.map((address) => ({ emailAddress: { address } })),
    attachments: await Promise.all(m.anlagen.map(async (f) => ({ "@odata.type": "#microsoft.graph.fileAttachment", name: f.name, contentType: f.type || "application/octet-stream", contentBytes: await alsB64(f) }))) }, saveToSentItems: true };
  let r: Response;
  try { r = await microsoftMailAbruf(`${GRAPH}/sendMail`, { method: "POST", body: JSON.stringify(nachricht) }); }
  catch (e) { throw new Error(`${e instanceof Error ? e.message : "Netzfehler"} Unklar, ob gesendet wurde – bitte in „Gesendete Elemente“ nachsehen; die App wiederholt nicht von selbst.`); }
  if (r.status !== 202 && !r.ok) await graphFehler(r);
}

// ---------- Weg F: Private Brain Pro übergibt Mails über das Tresor-Fach ----------
/** Holt offene Übergaben aus „eingang-familienakte“ in die Eingangszentrale (nur wenn der Pro-Tresor offen ist). */
export async function proEingangAbholen(): Promise<{ geholt: number; fehler: number; offen: boolean }> {
  const stand = await proTresor.zustand().catch(() => null);
  if (!stand || stand.status !== "offen" || !stand.uebergaben) return { geholt: 0, fehler: 0, offen: false };
  const { vaultId, items } = await proEingangLesen();
  let geholt = 0, fehler = 0;
  for (const e of items) {
    if (e.fehler || !e.vertrag) { fehler++; continue; }
    try { await proEingangAufnehmen(vaultId, e.entryId); geholt++; } catch { fehler++; }
  }
  if (geholt) window.dispatchEvent(new Event("familienakte:pro-eingang"));
  return { geholt, fehler, offen: true };
}

/** Weg H (vorbereitet, nicht gebaut): eigenes Postfach in der Familienakte mit dem Mail-Kern aus Private Brain Pro
 *  (MailEngine, MailAccount, MailProvider, ProMailPlugin, GmailMessages, GmailTokenCache; Windows DesktopService) – byte-gleich,
 *  Pin in native/HERKUNFT.json. Zugänge nur im Android-Keystore bzw. Windows-Schutz. Die PWA kann kein IMAP. */
export interface EigenesPostfach {
  konten(): Promise<Array<{ id: string; adresse: string }>>;
  abrufen(konto: string, tage: number): Promise<MailKopf[]>;
  alsEml(konto: string, id: string): Promise<File>;
}
export const eigenesPostfach = (): EigenesPostfach | null => null;
