// Seite „Netz (Mycel)“ (Sitzung B, Stück 2a, Klaus 2026-10-31: „Eigene Seite Netz“, kein schwebender Knopf).
// Lädt den Klebstoff public/native/familienakte-mycel.js erst hier; der lädt die Kanon-Module. Nichts geht ins Netz,
// bis jemand im Kanon-Fenster selbst verbindet. Siegel und Lampen kommen in einem eigenen Stück auf diese Seite.
import { useEffect, useState } from "react";

type MycelZustand = { geladen: boolean; verbunden: boolean; relais: number; antwortet: boolean; name: string; geraetename: string; fensterOffen: boolean; internet: boolean };
type MycelApi = { starten: () => Promise<boolean>; oeffnen: () => Promise<void>; schliessen: () => void; zustand: () => MycelZustand; setzeGeraetename: (v: string) => void; geraetename: () => string };
const api = () => (window as Window & { FamilienakteMycel?: MycelApi }).FamilienakteMycel;

function klebstoffLaden(): Promise<MycelApi> {
  const da = api(); if (da) return Promise.resolve(da);
  return new Promise((ok, nein) => {
    const s = document.createElement("script");
    s.src = new URL("native/familienakte-mycel.js", document.baseURI).href;
    s.onload = () => { const a = api(); if (a) ok(a); else nein(new Error("Mycel-Klebstoff nicht geladen.")); };
    s.onerror = () => nein(new Error("Mycel-Klebstoff fehlt."));
    document.head.appendChild(s);
  });
}

export function NetzSeite({ kopf }: { kopf: React.ReactNode }) {
  const [z, setZ] = useState<MycelZustand | null>(null);
  const [fehler, setFehler] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    let aus = false;
    const neu = () => { const a = api(); if (a && !aus) setZ(a.zustand()); };
    window.addEventListener("familienakte:mycel", neu);
    window.addEventListener("pb:network", neu);
    const uhr = window.setInterval(neu, 2000);
    klebstoffLaden().then((a) => { setName(a.geraetename()); return a.starten(); }).then(neu).catch((e: Error) => { if (!aus) setFehler(e.message); });
    return () => { aus = true; window.removeEventListener("familienakte:mycel", neu); window.removeEventListener("pb:network", neu); window.clearInterval(uhr); api()?.schliessen(); };
  }, []);
  const zeile = (label: string, wert: string, gut: boolean | null) => <div className="fa-netz-zeile"><span>{label}</span><strong className={gut === null ? "" : gut ? "gut" : "aus"}>{wert}</strong></div>;
  return <>
    {kopf}
    <section className="card fa-netz" data-netz-seite>
      <div className="card-heading"><div><h2>Mit anderen Geräten verbinden</h2></div></div>
      <p className="fa-netz-satz">Beim Öffnen der Akte geht nichts ins Netz. Verbunden wird nur, wenn du unten „Verbinden …“ antippst und im Fenster selbst verbindest. Hinaus geht dann nur die Visitenkarte (Name und die Liste der Lebensbereiche) – keine Unterlagen.</p>
      {fehler && <p className="fa-netz-fehler" role="alert">{fehler}</p>}
      <div className="fa-netz-zustand" data-netz-zustand>
        {zeile("Bausteine", z?.geladen ? "bereit" : fehler ? "fehlen" : "werden geladen …", z ? z.geladen : null)}
        {zeile("Internet für die App", z ? (z.internet ? "an" : "aus") : "…", z ? z.internet : null)}
        {zeile("Verbindung", z?.verbunden ? `verbunden (${z.relais})` : "keine", z ? z.verbunden : null)}
      </div>
      <label className="fa-netz-geraet"><span>Gerätename</span>
        <input type="text" maxLength={40} value={name} data-sbkim-geraetename="1" placeholder="z. B. Tablet Küche (frei wählbar)"
          onChange={(e) => { setName(e.target.value); api()?.setzeGeraetename(e.target.value); }}/>
      </label>
      {z && !z.internet && <p className="fa-netz-hinweis">Das Internet für die App ist aus. Zum Verbinden oben einschalten.</p>}
      <button type="button" className="button primary" disabled={!z?.geladen} onClick={() => void api()?.oeffnen()} data-netz-verbinden>Verbinden …</button>
    </section>
  </>;
}
