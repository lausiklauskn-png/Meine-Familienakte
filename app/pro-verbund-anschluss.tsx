import { useEffect, useState } from "react";
import { PRO_ZIELE, proVerbundFehler, proAusgaengeLesen, proAusgangPruefen, proEingangAufnehmen, proEingangLesen, type ProAusgang } from "./pro-verbund";
import type { ProUebergabe } from "./pro-uebergabe";
import type { ProTresorZustand } from "./pro-tresor";
import { InfoPopover } from "./ui-controls";
type Eingang = { entryId: string; vertrag?: ProUebergabe; fehler?: string };
export function ProVerbundAnschluss({ stand }: { stand: ProTresorZustand }) {
  const [eingang,setEingang]=useState<{vaultId:string;items:Eingang[]}|null>(null),[ausgaenge,setAusgaenge]=useState<ProAusgang[]>([]),[busy,setBusy]=useState(false),[meldung,setMeldung]=useState("");
  useEffect(()=>{let lebt=true;if(stand.id)void proAusgaengeLesen(stand.id).then(rows=>{if(lebt)setAusgaenge(rows)}).catch(()=>{if(lebt)setMeldung("Der gemerkte Ausgang konnte nicht gelesen werden.")});return()=>{lebt=false;};},[stand.id]);
  if(!stand.uebergaben)return null;
  async function tun(fn:()=>Promise<void>) {setBusy(true);setMeldung("");try{await fn();}catch(e){setMeldung(proVerbundFehler(e));}finally{setBusy(false);}}
  const offen=stand.status==="offen";
  return <div data-pro-verbund>
    <span className="ui-heading-help"><h4>Zusammenarbeit mit Pro-Apps</h4><InfoPopover label="Zusammenarbeit mit Pro-Apps erklären" text="Eine ausgewählte Unterlage kannst du in der Dokumentenbibliothek an Workflow PDF Pro, Private Brain Pro oder BookLedgerPro geben. Jede App bleibt einzeln nutzbar. Weitergegeben bedeutet noch nicht im Ziel aufgenommen. Gemeinsame Originale werden nicht gelöscht."/></span>
    <button type="button" className="button secondary" disabled={!offen||busy} onClick={()=>void tun(async()=>{setEingang(await proEingangLesen());})}>Pro-Eingang prüfen</button>
    {eingang && eingang.vaultId===stand.id && <div>{!eingang.items.length&&<p>Keine offenen Pro-Übergaben.</p>}{eingang.items.map(e=><div key={e.entryId} className="card">
      <p>{e.vertrag?.name||"Übergabe prüfen"} · {PRO_ZIELE[e.vertrag?.quelle as keyof typeof PRO_ZIELE]||"Herkunft noch ungeprüft"}</p>
      {e.fehler?<p role="alert">{proVerbundFehler(e.fehler)} Quelle bleibt unverändert.</p>:<button type="button" className="button secondary" disabled={!offen||busy} onClick={()=>void tun(async()=>{
        await proEingangAufnehmen(eingang.vaultId,e.entryId);
        window.dispatchEvent(new Event("familienakte:pro-eingang"));
        setEingang(await proEingangLesen());setMeldung("Dauerhaft im Eingang aufgenommen. Bitte in der Eingangszentrale die Zuordnung prüfen.");
      })}>In Familienakte-Eingang aufnehmen</button>}
    </div>)}</div>}
    {ausgaenge.some(a=>a.vaultId===stand.id)&&<div><h4>Gemerkter Ausgang</h4>{ausgaenge.filter(a=>a.vaultId===stand.id).map(a=><div key={a.id}>
      <p>{a.vertrag.name} → {PRO_ZIELE[a.vertrag.ziel as keyof typeof PRO_ZIELE]||a.vertrag.ziel}: {a.stand==="im-eingang"?"vom Ziel im Eingang bestätigt":a.stand==="weitergegeben"?"weitergegeben – Zielbestätigung offen":"noch offen – Unterlage erneut weitergeben"}</p>
      {a.entryId&&<button type="button" className="button secondary compact-button" disabled={!offen||busy} onClick={()=>void tun(async()=>{await proAusgangPruefen(a);setAusgaenge(await proAusgaengeLesen(a.vaultId));})}>Zielbestätigung prüfen</button>}
    </div>)}</div>}
    {meldung&&<p role="status">{meldung}</p>}
  </div>;
}
