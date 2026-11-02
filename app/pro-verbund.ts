import { stapelDatenbank } from "./stapel-ablage";
import { proUebergabeAnnehmen, proUebergabeBauen, type ProApp, type ProUebergabe } from "./pro-uebergabe";
import { proTresor, proTresorUebergaben } from "./pro-tresor";
export type ProZiel = Exclude<ProApp, "familienakte">;
export const PRO_ZIELE: Record<ProZiel,string> = { "workflow-pdf-pro": "Workflow PDF Pro", "private-brain": "Private Brain Pro", bookledgerpro: "BookLedgerPro" };
export function proVerbundFehler(error: unknown): string {
  const wert = typeof error === "string" ? error : error && typeof error === "object" ? String((error as { code?: string; message?: string }).code || (error as { message?: string }).message || "") : "";
  if (/ZU_GROSS/.test(wert)) return "Die Übergabe überschreitet 20 MiB. Bitte eine kleinere Datei auswählen.";
  if (/PRUEFSUMME|KONFLIKT/.test(wert)) return "Inhalt und Übergabekennung stimmen nicht überein. Bitte die Quelldatei prüfen und eine geänderte Fassung neu weitergeben.";
  if (/VERTRAG|KENNUNG|ZIEL_UNBEKANNT/.test(wert)) return "Diese Datei enthält noch keinen passenden Pro-Übergabevertrag. Bitte in der Quell-App die aktuelle Weitergabe verwenden.";
  if (/GESPERRT|FREMD|NICHT_ERREICHBAR|FEHLT|BERECHTIGUNG/.test(wert)) return "Bitte den zugehörigen Pro-Tresor entsperren sowie Speicher und Ordnerfreigabe prüfen. Die Übergabe bleibt wiederholbar.";
  return wert && !/^(?:FA_|TRESOR_)/.test(wert) ? wert : "Die Übergabe ist noch nicht bestätigt. Bitte Speicher und Ordnerfreigabe prüfen und erneut versuchen. Die Quelle bleibt erhalten.";
}
export type ProAusgang = { id: string; typ: "ausgang"; vaultId: string; vertrag: ProUebergabe; entryId?: string; stand: "offen" | "weitergegeben" | "im-eingang" };
async function ausgangAendern(key: string, update: (alt?: ProAusgang) => ProAusgang): Promise<ProAusgang> {
  const db=await stapelDatenbank();
  try { return await new Promise((resolve,reject) => {
    const t=db.transaction("uebergaben","readwrite"), fach=t.objectStore("uebergaben"), r=fach.get(key);
    let result: ProAusgang; let fehler: unknown;
    t.oncomplete=()=>resolve(result);t.onabort=()=>reject(fehler||t.error||new Error("Ausgang nicht gespeichert."));
    r.onsuccess=()=>{try{result=update(r.result);fach.put(result);}catch(e){fehler=e;t.abort();}};
  }); } finally {db.close();}
}
async function offen() {
  const stand=await proTresor.zustand();
  if(stand.status!=="offen" || !stand.id || !stand.uebergaben) throw new Error("Bitte den gemeinsamen Pro-Tresor in der aktuellen Android-/Windows-App verbinden und entsperren.");
  return stand.id;
}
export async function proDateiWeitergeben(file: File,dokumentId: string,ziel: ProZiel,bezug?: string): Promise<ProAusgang> {
  const vaultId=await offen();
  const pdf=file.type==="application/pdf"||/\.pdf$/i.test(file.name),bild=file.type.startsWith("image/")||/\.(jpe?g|png|webp|gif|heic|heif|tiff?)$/i.test(file.name),mail=file.type==="message/rfc822"||/\.eml$/i.test(file.name);
  if(ziel==="workflow-pdf-pro"&&!pdf&&!bild)throw new Error("Workflow PDF Pro nimmt über diesen Weg PDF und Bilder an.");
  if(ziel==="bookledgerpro"&&(!file.size||(!pdf&&!bild&&!mail)))throw new Error("BookLedgerPro nimmt über diesen Weg nicht leere PDF, Bilder und E-Mails (.eml) an.");
  const m=await proUebergabeBauen(file,"familienakte",ziel,dokumentId);
  if(bezug)m.bezug=bezug;
  const key="ausgang:"+JSON.stringify([vaultId,dokumentId,ziel,m.name,m.mime,m.sha256,m.bezug||""]);
  // Kennung vor der nativen Ablage sichern. Ein Prozessabbruch darf sie nicht wechseln.
  const auftrag=await ausgangAendern(key,alt=>alt||{id:key,typ:"ausgang",vaultId,vertrag:m,stand:"offen"});
  const receipt=await proTresorUebergaben.senden(vaultId,auftrag.vertrag,file);
  return ausgangAendern(key,alt=>{
    if(!alt || alt.vertrag.id!==auftrag.vertrag.id) throw new Error("Der gemerkte Ausgang hat sich geändert.");
    return {...alt,entryId:receipt.entryId,stand:alt.stand==="im-eingang"?"im-eingang":"weitergegeben"};
  });
}
export async function proAusgaengeLesen(vaultId: string): Promise<ProAusgang[]> {
  const db=await stapelDatenbank();
  try {return await new Promise((resolve,reject)=>{const t=db.transaction("uebergaben"),r=t.objectStore("uebergaben").getAll();t.oncomplete=()=>resolve(r.result.filter((x): x is ProAusgang=>x.typ==="ausgang"&&x.vaultId===vaultId));t.onabort=()=>reject(t.error);});}
  finally {db.close();}
}
export async function proAusgangPruefen(auftrag: ProAusgang): Promise<ProAusgang> {
  if(await offen()!==auftrag.vaultId || !auftrag.entryId) throw new Error("Bitte den zu dieser Übergabe gehörenden Tresor öffnen und die Datei erneut weitergeben.");
  const {bestaetigt}=await proTresorUebergaben.stand(auftrag.vaultId,auftrag.vertrag.ziel,auftrag.entryId);
  if(!bestaetigt) return auftrag;
  return ausgangAendern(auftrag.id,alt=>{if(!alt || alt.entryId!==auftrag.entryId)throw new Error("Ausgang verändert.");return {...alt,stand:"im-eingang"};});
}
export async function proEingangLesen() {
  const vaultId=await offen();return {vaultId,...await proTresorUebergaben.eingang(vaultId)};
}
export async function proEingangAufnehmen(vaultId: string,entryId: string) {
  if(await offen()!==vaultId) throw new Error("Die Übergabe gehört zu einem anderen Tresor.");
  const {vertrag,file}=await proTresorUebergaben.lesen(vaultId,entryId);
  // Empfang erst nach bestätigter Datei + Datensatz + wiederholbarer Quittung.
  const quittung=await proUebergabeAnnehmen(vertrag,file);
  await proTresorUebergaben.quittieren(vaultId,entryId,quittung.sha256);
  return quittung;
}
