import { useState } from "react";
import { PRO_ZIELE, type ProZiel } from "./pro-verbund";
export function ProUebergabeKnopf({ onSenden }: { onSenden: (ziel: ProZiel) => Promise<void> }) {
  const [ziel,setZiel]=useState<ProZiel>("workflow-pdf-pro"),[offen,setOffen]=useState(false),[busy,setBusy]=useState(false);
  if(!offen)return <button type="button" className="button secondary compact-button" onClick={()=>setOffen(true)}>An Pro-App geben …</button>;
  return <div className="button-row" data-pro-weitergeben>
    <label>Ziel-App <select value={ziel} disabled={busy} onChange={e=>setZiel(e.target.value as ProZiel)}>{Object.entries(PRO_ZIELE).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    <button type="button" className="button secondary compact-button" disabled={busy} onClick={()=>{setBusy(true);void onSenden(ziel).finally(()=>setBusy(false));}}>{busy?"Weitergabe läuft …":"Ausgewählte Unterlage weitergeben"}</button>
    <button type="button" className="button secondary compact-button" disabled={busy} onClick={()=>setOffen(false)}>Schließen</button>
  </div>;
}
