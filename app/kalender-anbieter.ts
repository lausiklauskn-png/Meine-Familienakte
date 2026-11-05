// Anbieter für den Kalender (Klaus 2026-11-05). Gerät (Android, CalendarContract), Google- und Microsoft-Konto (Browser und
// Windows), Kalenderdatei (.ics, überall). Zugänge liegen nur im Speicher dieser Sitzung (Windows: Erneuerungsschlüssel im
// Speicher des Programms), nie im Register, in der Sicherung oder im localStorage. Ohne Client-ID: „noch nicht eingerichtet“.
import { KALENDER_KONTEN } from "../lib/kalender-konten";
import { geraetEreignis, googleEreignis, graphEreignis, type KalenderAnbieter, type KalenderEintrag } from "../lib/kalender";

export type KalenderInfo = { id: string; name: string; konto?: string; haupt?: boolean };
export type AnbieterZustand = { bereit: true } | { bereit: false; grund: string; art: "einrichtung" | "plattform" | "internet" };

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: Record<string, Record<string, (a?: unknown) => Promise<unknown>>> };
const cap = () => (window as unknown as { Capacitor?: Cap }).Capacitor;
export function plattform(): "android" | "windows" | "web" {
  const c = cap();
  if (c?.isNativePlatform?.() && c.getPlatform?.() === "android") return "android";
  if ("__TAURI__" in window || c?.getPlatform?.() === "windows") return "windows";
  return "web";
}
const internetAus = () => { const b = (window as unknown as { PBNetwork?: { ready: boolean; offline: boolean } }).PBNetwork; return !b || !b.ready || b.offline; };

/** Öffentliche Kennungen; eine Seite kann sie zum Vorführen oder Prüfen ergänzen (window.FamilienakteKalenderKonten). */
function konten() {
  const extra = (window as unknown as { FamilienakteKalenderKonten?: Partial<{ googleWeb: string; googleDesktop: string; microsoft: string }> }).FamilienakteKalenderKonten || {};
  return {
    googleWeb: extra.googleWeb ?? KALENDER_KONTEN.google.webClientId,
    googleDesktop: extra.googleDesktop ?? KALENDER_KONTEN.google.desktopClientId,
    microsoft: extra.microsoft ?? KALENDER_KONTEN.microsoft.clientId,
  };
}

export class KalenderFehler extends Error {
  constructor(public code: string, text: string) { super(text); }
}
const fehlerText: Record<string, string> = {
  FA_KALENDER_KEIN_RECHT: "Die Familienakte darf den Kalender nicht benutzen. In den Android-Einstellungen bei der App „Kalender“ erlauben.",
  FA_KALENDER_LESEN: "Die Kalender auf dem Gerät konnten nicht gelesen werden.",
  FA_KALENDER_SCHREIBEN: "Der Termin konnte nicht in den Kalender geschrieben werden.",
  KALENDER_ZEIT_ABGELAUFEN: "Die Anmeldung wurde nicht innerhalb von 5 Minuten abgeschlossen.",
  KALENDER_ABGELEHNT: "Die Anmeldung wurde abgelehnt oder abgebrochen.",
  KALENDER_STATE_FALSCH: "Die Anmeldung kam nicht von diesem Vorgang zurück und wurde verworfen.",
  KALENDER_TAUSCH_ABGELEHNT: "Das Konto hat die Anmeldung nicht bestätigt (Einrichtung prüfen).",
  KALENDER_NICHT_ERREICHBAR: "Der Anmeldedienst ist nicht erreichbar.",
  KALENDER_NEU_ANMELDEN: "Bitte neu anmelden.",
  KALENDER_BROWSER: "Der Browser für die Anmeldung konnte nicht geöffnet werden.",
};
function alsFehler(grund: unknown, ersatz = "Der Kalender hat nicht geantwortet."): KalenderFehler {
  if (grund instanceof KalenderFehler) return grund;
  const code = typeof grund === "string" ? grund : (grund as { message?: string; code?: string })?.code || (grund as Error)?.message || "";
  return new KalenderFehler(code, fehlerText[code] || ersatz);
}

export interface Anbieter {
  art: KalenderAnbieter;
  zustand(): AnbieterZustand;
  verbunden(): boolean;
  verbinden(): Promise<{ konto?: string }>;
  kalender(): Promise<KalenderInfo[]>;
  schreiben(kalenderId: string, eintrag: KalenderEintrag, eintragId?: string): Promise<string>;
  entfernen(kalenderId: string, eintragId: string): Promise<void>;
  trennen(): Promise<void>;
  /** Nach dem Neustart: ohne Rückfrage feststellen, ob der Zugang noch gilt (Gerät: Recht noch erteilt). */
  wiederaufnehmen?(): Promise<boolean>;
}

// ---------- Gerät (Android) ----------

const geraetPlugin = () => cap()?.Plugins?.FamilienakteKalender;
let geraetErlaubt = false;
const geraet: Anbieter = {
  art: "geraet",
  zustand: () => plattform() === "android" && geraetPlugin() ? { bereit: true } : { bereit: false, art: "plattform", grund: "Nur in der Android-App. Unter Windows und im Browser Google, Microsoft oder die Kalenderdatei wählen." },
  verbunden: () => geraetErlaubt,
  async verbinden() {
    const p = geraetPlugin(); if (!p) throw new KalenderFehler("plattform", "Nur in der Android-App.");
    const r = await p.erlauben().catch((g) => { throw alsFehler(g); }) as { erlaubt?: boolean };
    geraetErlaubt = Boolean(r?.erlaubt);
    if (!geraetErlaubt) throw new KalenderFehler("FA_KALENDER_KEIN_RECHT", fehlerText.FA_KALENDER_KEIN_RECHT);
    return {};
  },
  async kalender() {
    const p = geraetPlugin(); if (!p) return [];
    const r = await p.kalender().catch((g) => { throw alsFehler(g); }) as { kalender?: KalenderInfo[] };
    geraetErlaubt = true;
    return (r?.kalender || []).map((k) => ({ id: String(k.id), name: k.name || "Kalender", konto: k.konto, haupt: k.haupt }));
  },
  async schreiben(kalenderId, eintrag, eintragId) {
    const p = geraetPlugin(); if (!p) throw new KalenderFehler("plattform", "Nur in der Android-App.");
    const zeitzone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
    const r = await p.schreiben({ kalenderId, eintragId, ...geraetEreignis(eintrag, zeitzone) }).catch((g) => { throw alsFehler(g); }) as { eintragId?: string };
    if (!r?.eintragId) throw new KalenderFehler("FA_KALENDER_SCHREIBEN", fehlerText.FA_KALENDER_SCHREIBEN);
    return r.eintragId;
  },
  async entfernen(_kalenderId, eintragId) { await geraetPlugin()?.entfernen({ eintragId }).catch((g) => { throw alsFehler(g); }); },
  async trennen() { geraetErlaubt = false; },
  async wiederaufnehmen() {
    const r = await geraetPlugin()?.zustand().catch(() => null) as { erlaubt?: boolean } | null;
    geraetErlaubt = Boolean(r?.erlaubt);
    return geraetErlaubt;
  },
};

// ---------- Konten: Anmeldung ----------

type Zugang = { token: string; bis: number; konto?: string };
const zugaenge: Partial<Record<"google" | "microsoft", Zugang>> = {};

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const zufall = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
async function pkce() { const verifier = zufall(48); const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)))); return { verifier, challenge }; }
export function rueckkehrAdresse() { return `${location.origin}${location.pathname.replace(/[^/]*$/, "")}`; }

export const KALENDER_KANAL = "familienakte-kalender-anmeldung";

/** Läuft im Anmeldefenster nach dem Rücksprung (src/main.tsx): Ergebnis an das Hauptfenster, dann schließen. */
export function anmeldeRueckkehr(): boolean {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const such = new URLSearchParams(location.search);
  const state = hash.get("state") || such.get("state");
  if (!state || !state.startsWith("fa-kal-")) return false;
  const nachricht = { state, accessToken: hash.get("access_token"), expiresIn: hash.get("expires_in"), code: such.get("code"), error: hash.get("error") || such.get("error") };
  try { const kanal = new BroadcastChannel(KALENDER_KANAL); kanal.postMessage(nachricht); kanal.close(); } catch { /* ohne BroadcastChannel unten */ }
  try { (window.opener as Window | null)?.postMessage({ familienakteKalender: nachricht }, location.origin); } catch { /* Fenster ohne Opener */ }
  history.replaceState(null, "", location.pathname);
  document.body.textContent = "Anmeldung abgeschlossen. Dieses Fenster kann geschlossen werden.";
  setTimeout(() => window.close(), 300);
  return true;
}

type Rueckmeldung = { state: string; accessToken: string | null; expiresIn: string | null; code: string | null; error: string | null };
function warteAufRueckkehr(state: string, fenster: Window | null, ms = 300000) {
  return new Promise<Rueckmeldung>((resolve, reject) => {
    let kanal: BroadcastChannel | null = null;
    const fertig = (n: Rueckmeldung) => { if (n?.state !== state) return; aufraeumen(); if (n.error) reject(new KalenderFehler("KALENDER_ABGELEHNT", fehlerText.KALENDER_ABGELEHNT)); else resolve(n); };
    const nachricht = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.familienakteKalender) fertig(e.data.familienakteKalender); };
    const uhr = setTimeout(() => { aufraeumen(); reject(new KalenderFehler("KALENDER_ZEIT_ABGELAUFEN", fehlerText.KALENDER_ZEIT_ABGELAUFEN)); }, ms);
    const aufraeumen = () => { clearTimeout(uhr); kanal?.close(); window.removeEventListener("message", nachricht); try { fenster?.close(); } catch { /* fremd */ } };
    try { kanal = new BroadcastChannel(KALENDER_KANAL); kanal.onmessage = (e) => fertig(e.data); } catch { /* nur postMessage */ }
    window.addEventListener("message", nachricht);
  });
}

const fensterOeffnen = (url: string) => window.open(url, "familienakte-anmeldung", "popup,width=520,height=680");

async function windowsAufruf(anfrage: Record<string, unknown>) {
  const invoke = (window as unknown as { __TAURI__?: { core?: { invoke: (c: string, a: unknown) => Promise<unknown> } } }).__TAURI__?.core?.invoke;
  if (!invoke) throw new KalenderFehler("plattform", "Nur in der Windows-App.");
  try { return await invoke("fa_kalender", { anfrage }) as { zugang?: string; gueltigSek?: number }; } catch (g) { throw alsFehler(g); }
}

/** Erneut anmelden (Klaus 2026-11-05: „1 Tipp“): ohne Kontoauswahl; Google/Microsoft nehmen das angemeldete Konto. */
export async function kalenderNeuAnmelden(art: "google" | "microsoft") { zugaenge[art] = await anmelden(art, true); }

async function anmelden(art: "google" | "microsoft", erneut = false): Promise<Zugang> {
  const k = konten();
  const scope = art === "google" ? KALENDER_KONTEN.google.scope : KALENDER_KONTEN.microsoft.scope;
  const state = `fa-kal-${zufall(16)}`;
  if (plattform() === "windows") {
    const { verifier, challenge } = await pkce();
    const r = await windowsAufruf({ aktion: "anmelden", anbieter: art, clientId: art === "google" ? k.googleDesktop : k.microsoft, scope, state, challenge, verifier });
    if (!r.zugang) throw new KalenderFehler("KALENDER_TAUSCH", "Die Anmeldung hat keinen Zugang geliefert.");
    return { token: r.zugang, bis: Date.now() + (Number(r.gueltigSek) || 3600) * 1000 - 60000 };
  }
  const ziel = rueckkehrAdresse();
  if (art === "google") {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: k.googleWeb, redirect_uri: ziel, response_type: "token", scope, state, include_granted_scopes: "true", ...(erneut ? {} : { prompt: "select_account" }) })}`;
    const fenster = fensterOeffnen(url);
    if (!fenster) throw new KalenderFehler("popup", "Das Anmeldefenster wurde blockiert. Bitte Pop-ups für die Familienakte erlauben.");
    const n = await warteAufRueckkehr(state, fenster);
    if (!n.accessToken) throw new KalenderFehler("KALENDER_ABGELEHNT", fehlerText.KALENDER_ABGELEHNT);
    return { token: n.accessToken, bis: Date.now() + (Number(n.expiresIn) || 3600) * 1000 - 60000 };
  }
  const { verifier, challenge } = await pkce();
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({ client_id: k.microsoft, redirect_uri: ziel, response_type: "code", response_mode: "query", scope, state, code_challenge: challenge, code_challenge_method: "S256", ...(erneut ? {} : { prompt: "select_account" }) })}`;
  const fenster = fensterOeffnen(url);
  if (!fenster) throw new KalenderFehler("popup", "Das Anmeldefenster wurde blockiert. Bitte Pop-ups für die Familienakte erlauben.");
  const n = await warteAufRueckkehr(state, fenster);
  if (!n.code) throw new KalenderFehler("KALENDER_ABGELEHNT", fehlerText.KALENDER_ABGELEHNT);
  const antwort = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: k.microsoft, grant_type: "authorization_code", code: n.code, redirect_uri: ziel, code_verifier: verifier, scope }) });
  const daten = await antwort.json().catch(() => ({})) as { access_token?: string; expires_in?: number };
  if (!antwort.ok || !daten.access_token) throw new KalenderFehler("KALENDER_TAUSCH_ABGELEHNT", fehlerText.KALENDER_TAUSCH_ABGELEHNT);
  return { token: daten.access_token, bis: Date.now() + (daten.expires_in || 3600) * 1000 - 60000 };
}

async function zugang(art: "google" | "microsoft") {
  const z = zugaenge[art];
  if (z && z.bis > Date.now()) return z.token;
  if (z && plattform() === "windows") {
    const k = konten();
    try {
      const r = await windowsAufruf({ aktion: "erneuern", anbieter: art, clientId: art === "google" ? k.googleDesktop : k.microsoft, scope: art === "google" ? KALENDER_KONTEN.google.scope : KALENDER_KONTEN.microsoft.scope });
      if (r.zugang) { zugaenge[art] = { ...z, token: r.zugang, bis: Date.now() + (Number(r.gueltigSek) || 3600) * 1000 - 60000 }; return r.zugang; }
    } catch { /* unten */ }
  }
  delete zugaenge[art];
  throw new KalenderFehler("KALENDER_NEU_ANMELDEN", "Die Anmeldung ist abgelaufen. Bitte „Neu anmelden“ tippen.");
}

async function api(art: "google" | "microsoft", url: string, init: RequestInit = {}) {
  const token = await zugang(art);
  let antwort: Response;
  try { antwort = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) } }); }
  catch { throw new KalenderFehler("netz", internetAus() ? "Internet für die App ist aus. Oben im Kopf einschalten." : "Der Kalender ist gerade nicht erreichbar."); }
  if (antwort.status === 401) { delete zugaenge[art]; throw new KalenderFehler("KALENDER_NEU_ANMELDEN", "Die Anmeldung ist abgelaufen. Bitte „Neu anmelden“ tippen."); }
  return antwort;
}
async function apiJson<T>(art: "google" | "microsoft", url: string, init: RequestInit = {}): Promise<T> {
  const antwort = await api(art, url, init);
  if (!antwort.ok) throw new KalenderFehler(`http-${antwort.status}`, `Der Kalender hat abgelehnt (${antwort.status}).`);
  return antwort.status === 204 ? ({} as T) : antwort.json() as Promise<T>;
}

/**
 * Löschen antwortet mit 204 ohne Inhalt. Der Internetschalter (native-network.js, byte-gleich aus Private Brain Pro) baut
 * jede Antwort neu und scheitert an 204; der Aufruf meldet dann „nicht erreichbar“, obwohl gelöscht wurde. Darum wird nach
 * einem solchen Abbruch nachgefragt, ob der Termin noch da ist. null = bestätigt gelöscht.
 */
async function loeschen(art: "google" | "microsoft", url: string, weg: () => Promise<boolean>) {
  try { return await api(art, url, { method: "DELETE" }); }
  catch (g) {
    if (!(g instanceof KalenderFehler) || g.code !== "netz" || internetAus()) throw g;
    if (await weg().catch(() => false)) return null;
    throw g;
  }
}

function kontoZustand(art: "google" | "microsoft"): AnbieterZustand {
  const k = konten();
  const id = art === "google" ? (plattform() === "windows" ? k.googleDesktop : k.googleWeb) : k.microsoft;
  if (plattform() === "android") return { bereit: false, art: "plattform", grund: "In der Android-App über „Kalender auf diesem Gerät“: Google- und Outlook-Konten des Geräts stehen dort zur Wahl." };
  if (!id) return { bereit: false, art: "einrichtung", grund: "Noch nicht eingerichtet." };
  if (internetAus()) return { bereit: false, art: "internet", grund: "Internet für die App ist aus. Oben im Kopf einschalten." };
  return { bereit: true };
}

const GOOGLE = "https://www.googleapis.com/calendar/v3";
const google: Anbieter = {
  art: "google",
  zustand: () => kontoZustand("google"),
  verbunden: () => Boolean(zugaenge.google && zugaenge.google.bis > Date.now()),
  async verbinden() { zugaenge.google = await anmelden("google"); return {}; },
  async kalender() {
    try {
      const r = await apiJson<{ items?: Array<{ id: string; summary?: string; summaryOverride?: string; primary?: boolean }> }>("google", `${GOOGLE}/users/me/calendarList?minAccessRole=writer`);
      const liste = (r.items || []).map((k) => ({ id: k.id, name: k.summaryOverride || k.summary || k.id, haupt: Boolean(k.primary) }));
      if (liste.length) return liste;
    } catch (g) { if ((g as KalenderFehler).code === "KALENDER_NEU_ANMELDEN") throw g; }
    return [{ id: "primary", name: "Hauptkalender", haupt: true }];
  },
  async schreiben(kalenderId, eintrag, eintragId) {
    const basis = `${GOOGLE}/calendars/${encodeURIComponent(kalenderId)}/events`;
    if (eintragId) {
      const r = await api("google", `${basis}/${encodeURIComponent(eintragId)}`, { method: "PUT", body: JSON.stringify(googleEreignis(eintrag)) });
      if (r.ok) return ((await r.json()) as { id: string }).id;
      if (r.status !== 404 && r.status !== 410) throw new KalenderFehler(`http-${r.status}`, `Der Kalender hat abgelehnt (${r.status}).`);
    }
    return (await apiJson<{ id: string }>("google", basis, { method: "POST", body: JSON.stringify(googleEreignis(eintrag)) })).id;
  },
  async entfernen(kalenderId, eintragId) {
    const url = `${GOOGLE}/calendars/${encodeURIComponent(kalenderId)}/events/${encodeURIComponent(eintragId)}`;
    const r = await loeschen("google", url, async () => { const g = await api("google", url); return g.status === 404 || g.status === 410 || (g.ok && ((await g.json()) as { status?: string }).status === "cancelled"); });
    if (r && !r.ok && r.status !== 404 && r.status !== 410) throw new KalenderFehler(`http-${r.status}`, `Der Kalender hat abgelehnt (${r.status}).`);
  },
  async trennen() {
    const t = zugaenge.google?.token; delete zugaenge.google;
    if (plattform() === "windows") await windowsAufruf({ aktion: "abmelden", anbieter: "google" }).catch(() => undefined);
    if (t) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t)}`, { method: "POST" }).catch(() => undefined);
  },
};

const GRAPH = "https://graph.microsoft.com/v1.0";
const microsoft: Anbieter = {
  art: "microsoft",
  zustand: () => kontoZustand("microsoft"),
  verbunden: () => Boolean(zugaenge.microsoft && zugaenge.microsoft.bis > Date.now()),
  async verbinden() { zugaenge.microsoft = await anmelden("microsoft"); return {}; },
  async kalender() {
    const r = await apiJson<{ value?: Array<{ id: string; name?: string; canEdit?: boolean; isDefaultCalendar?: boolean }> }>("microsoft", `${GRAPH}/me/calendars?$select=id,name,canEdit,isDefaultCalendar`);
    return (r.value || []).filter((k) => k.canEdit !== false).map((k) => ({ id: k.id, name: k.name || "Kalender", haupt: Boolean(k.isDefaultCalendar) }));
  },
  async schreiben(kalenderId, eintrag, eintragId) {
    if (eintragId) {
      const r = await api("microsoft", `${GRAPH}/me/events/${encodeURIComponent(eintragId)}`, { method: "PATCH", body: JSON.stringify(graphEreignis(eintrag)) });
      if (r.ok) return ((await r.json()) as { id: string }).id;
      if (r.status !== 404) throw new KalenderFehler(`http-${r.status}`, `Der Kalender hat abgelehnt (${r.status}).`);
    }
    return (await apiJson<{ id: string }>("microsoft", `${GRAPH}/me/calendars/${encodeURIComponent(kalenderId)}/events`, { method: "POST", body: JSON.stringify(graphEreignis(eintrag)) })).id;
  },
  async entfernen(_kalenderId, eintragId) {
    const url = `${GRAPH}/me/events/${encodeURIComponent(eintragId)}`;
    const r = await loeschen("microsoft", url, async () => (await api("microsoft", `${url}?$select=id`)).status === 404);
    if (r && !r.ok && r.status !== 404) throw new KalenderFehler(`http-${r.status}`, `Der Kalender hat abgelehnt (${r.status}).`);
  },
  async trennen() { delete zugaenge.microsoft; if (plattform() === "windows") await windowsAufruf({ aktion: "abmelden", anbieter: "microsoft" }).catch(() => undefined); },
};

/** Kalenderdatei: kein Konto, kein Abgleich übers Netz; die Datei enthält alle angehakten offenen Fristen. */
const ics: Anbieter = {
  art: "ics",
  zustand: () => ({ bereit: true }),
  verbunden: () => true,
  async verbinden() { return {}; },
  async kalender() { return [{ id: "datei", name: "Kalenderdatei (.ics)" }]; },
  async schreiben(_k, eintrag) { return eintrag.uid; },
  async entfernen() { /* in der nächsten Datei als abgesagt */ },
  async trennen() { /* nichts gespeichert */ },
};

export const ANBIETER: Record<KalenderAnbieter, Anbieter> = { geraet, google, microsoft, ics };
