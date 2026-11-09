import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogIn, LogOut } from "lucide-react";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";

/**
 * Aus- und Einloggen (Nutzerwunsch 2026-11-04): mit gesperrtem Pro-Tresor zeigt der Knopf „Einloggen“ (Pfeil hinein) und fragt
 * im nativen Fenster das Passwort ab.
 * „Ausloggen“ (Klaus 09.11.2026: „Türchen auf, raus, App schließen“ – vorher lud es nur neu, die App flackerte): Pro-Tresor sperren,
 * dann die App schließen – Android beendet sich (FamilienakteApp.beenden), Windows schließt das Fenster. Im Browser darf eine Seite
 * ihren Tab nicht schließen: dort deckt eine Abmeldeseite alles zu, bis man „Wieder öffnen“ tippt.
 */
type AppHuelle = { Capacitor?: { Plugins?: { FamilienakteApp?: { beenden: () => Promise<unknown> } } }; __TAURI__?: { window?: { getCurrentWindow?: () => { close: () => Promise<void> } } } };

/** Schließt die App, wo das geht; liefert false im Browser. */
export async function appSchliessen(w: Window = window): Promise<boolean> {
  const h = w as unknown as AppHuelle;
  const android = h.Capacitor?.Plugins?.FamilienakteApp;
  if (android) { try { await android.beenden(); return true; } catch { /* ältere App ohne Plugin: Abmeldeseite */ } }
  const fenster = h.__TAURI__?.window?.getCurrentWindow?.();
  if (fenster) { try { await fenster.close(); return true; } catch { /* Fenster lässt es nicht zu: Abmeldeseite */ } }
  return false;
}
export function AnmeldeKnopf({ art }: { art: "kopf" | "menue" }) {
  const [stand, setStand] = useState<ProTresorZustand["status"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [abgemeldet, setAbgemeldet] = useState<{ tresorZu: boolean } | null>(null);
  useEffect(() => {
    if (!proTresorVerfuegbar()) return;
    let lebt = true;
    const lesen = () => { void proTresor.zustand().then((s) => { if (lebt) setStand(s.status); }).catch(() => { if (lebt) setStand(null); }); };
    lesen();
    const sichtbar = () => { if (document.visibilityState === "visible") lesen(); };
    document.addEventListener("visibilitychange", sichtbar);
    window.addEventListener("familienakte:pro-tresor", lesen);
    return () => { lebt = false; document.removeEventListener("visibilitychange", sichtbar); window.removeEventListener("familienakte:pro-tresor", lesen); };
  }, []);
  const einloggen = stand === "gesperrt";
  async function tippen() {
    if (busy) return;
    setBusy(true);
    try {
      if (einloggen) {
        const neu = await proTresor.entsperren().catch(() => null);
        setStand(neu?.status ?? (await proTresor.zustand().then((s) => s.status).catch(() => null)));
        window.dispatchEvent(new Event("familienakte:pro-tresor"));
        return;
      }
      let tresorZu = false;
      try { if (proTresorVerfuegbar()) { await proTresor.sperren(); tresorZu = true; } } catch { /* nicht verbunden: trotzdem abmelden */ }
      window.dispatchEvent(new Event("familienakte:pro-tresor"));
      if (await appSchliessen()) return;
      setAbgemeldet({ tresorZu });
    } finally { setBusy(false); }
  }
  const text = einloggen ? "Einloggen" : "Ausloggen";
  const titel = einloggen ? "Einloggen: Pro-Tresor mit dem Passwort entsperren" : stand === "offen" ? "Ausloggen: Pro-Tresor sperren und die App schließen" : "Ausloggen: die App schließen";
  const Symbol = einloggen ? LogIn : LogOut;
  // Am Handy liegt der Knopf in der aufklappbaren Kopfleiste, die nach dem Tipp zuklappt: die Seite hängt darum am <body>.
  const seite = abgemeldet && typeof document !== "undefined" && createPortal(<div className="abgemeldet-seite" role="dialog" aria-modal="true" aria-labelledby="abgemeldet-titel" data-abgemeldet>
    <div><LogOut size={42} aria-hidden="true"/><h1 id="abgemeldet-titel">Abgemeldet</h1>
      <p>{abgemeldet.tresorZu ? "Der Pro-Tresor ist gesperrt. " : ""}Die Familienakte ist geschlossen. Du kannst dieses Fenster jetzt schließen.</p>
      <button type="button" className="button primary" onClick={() => window.location.reload()} data-wieder-oeffnen>Wieder öffnen</button></div>
  </div>, document.body);
  if (art === "menue") return <><button type="button" disabled={busy} onClick={() => void tippen()} title={titel}><Symbol size={17}/> {einloggen ? "Einloggen (Tresor öffnen)" : "Ausloggen und App schließen"}</button>{seite}</>;
  return <><a className={`icon-button ${einloggen ? "login-button" : "logout-button"}`} href="./" aria-disabled={busy} onClick={(event) => { event.preventDefault(); void tippen(); }} title={titel} aria-label={text}><Symbol size={18}/></a>{seite}</>;
}
