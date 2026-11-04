import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";

/**
 * Aus- und Einloggen (Nutzerwunsch 2026-11-04): mit offenem Pro-Tresor sperrt „Ausloggen“ ihn und lädt die App neu,
 * mit gesperrtem Pro-Tresor zeigt der Knopf „Einloggen“ (Pfeil hinein) und fragt im nativen Fenster das Passwort ab.
 * Ohne Pro-Tresor (Browser-Fassung) lädt „Ausloggen“ nur neu, wie bisher.
 */
export function AnmeldeKnopf({ art }: { art: "kopf" | "menue" }) {
  const [stand, setStand] = useState<ProTresorZustand["status"] | null>(null);
  const [busy, setBusy] = useState(false);
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
      try { if (proTresorVerfuegbar()) await proTresor.sperren(); } catch { /* nicht verbunden: trotzdem neu laden */ }
      window.location.reload();
    } finally { setBusy(false); }
  }
  const text = einloggen ? "Einloggen" : "Ausloggen";
  const titel = einloggen ? "Einloggen: Pro-Tresor mit dem Passwort entsperren" : stand === "offen" ? "Ausloggen: Pro-Tresor sperren und die App neu laden" : "Ausloggen: die App neu laden";
  const Symbol = einloggen ? LogIn : LogOut;
  if (art === "menue") return <button type="button" disabled={busy} onClick={() => void tippen()} title={titel}><Symbol size={17}/> {einloggen ? "Einloggen (Tresor entsperren)" : "Ausloggen (sperren und neu starten)"}</button>;
  return <a className={`icon-button ${einloggen ? "login-button" : "logout-button"}`} href="./" aria-disabled={busy} onClick={(event) => { event.preventDefault(); void tippen(); }} title={titel} aria-label={text}><Symbol size={18}/></a>;
}
