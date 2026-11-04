// Two independent installed-like browser profiles, actual IDB/OPFS and downloads.
// Carrier server/relay is tested separately; this test does not claim native UI.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { chromium, startApp, DESKTOP, ready, footer, step, summary, ROOT } from './_harness.mjs';
const app=await startApp(),profiles=[0,1].map(()=>mkdtempSync(path.join(tmpdir(),'fa-transport-'))),contexts=[],pages=[],errors=[],external=[];
async function start(i){
 const c=contexts[i]=await chromium.launchPersistentContext(profiles[i],{...DESKTOP,downloadsPath:path.join(profiles[i],'downloads'),serviceWorkers:'block',acceptDownloads:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=pages[i]=c.pages()[0];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 await c.route('**/lib/demo-workspace.ts', async route => {
  const {outputText}=ts.transpileModule(readFileSync(path.join(ROOT,'lib/demo-workspace.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  await route.fulfill({contentType:'text/javascript',body:outputText});
 });
 await c.route('**/__transport_probe/*',async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop();
  if(!['pro-geraetetransport','pro-uebergabe','stapel-ablage','dateiausgabe'].includes(name))return route.abort();
  const result=ts.transpileModule(readFileSync(path.join(ROOT,'app',name+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  await route.fulfill({contentType:'text/javascript',body:result.outputText});
 });
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(app.base))external.push(r.url());});
 await page.goto(app.base);await ready(page);await footer(page,'Sicherheitscenter');
 await page.locator('.pro-geraetetransport select option').nth(1).waitFor({state:'attached'});
}
const panel=i=>pages[i].locator('.pro-geraetetransport');
async function download(i,button){const [d]=await Promise.all([pages[i].waitForEvent('download'),button.click()]);return {name:d.suggestedFilename(),mimeType:'application/octet-stream',buffer:readFileSync(await d.path())};}
async function database(i){return pages[i].evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('FamilienakteStapel1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,t=db.transaction(['eingang','eingang-dateien','uebergaben']),a=t.objectStore('eingang').getAll(),b=t.objectStore('eingang-dateien').getAll(),c=t.objectStore('uebergaben').getAll();t.oncomplete=async()=>{db.close();resolve({incoming:a.result,files:await Promise.all(b.result.map(async x=>({id:x.id,name:x.file.name,bytes:[...new Uint8Array(await x.file.arrayBuffer())]}))),transfers:c.result});};t.onabort=()=>reject(t.error);};}));}
let packet,receipt;
try{
 await start(0);await start(1);
 await step('Gerätetransport: nur gewähltes Original, stabiler Ausgang vor der Dateiausgabe',async()=>{
  const p=panel(0);const value=await p.locator('select option').nth(1).getAttribute('value');await p.locator('select').selectOption(value);await p.getByLabel('Empfänger oder Zielgerät').fill('Erfundener Windows-PC');
  packet=await download(0,p.getByRole('button',{name:'Übergabepaket speichern',exact:true}));
  const db=await database(0),out=db.transfers.filter(x=>x.typ==='geraete-ausgang');assert.equal(out.length,1);assert.equal(out[0].stand,'offen');assert.equal(out[0].vertrag.dokumentId,value);assert.equal(out[0].vertrag.ziel,'familienakte');assert.equal(out[0].vertrag.name,await p.locator('select option:checked').innerText(),'Originalname bleibt beim Gerätewechsel erhalten');
  assert.equal(Object.values(out[0]).some(x=>x instanceof Blob),false);
  const decoded=await pages[0].evaluate(async p=>{const api=await import('/__transport_probe/pro-geraetetransport'),r=await api.geraetePaketLesen(new File([new Uint8Array(p)],'transport.familienakte-paket'));return {name:r.file.name,size:r.file.size,hash:r.vertrag.sha256};},[...packet.buffer]);
  assert.equal(decoded.hash,out[0].vertrag.sha256);assert.equal(decoded.size,out[0].vertrag.groesse);assert.equal(decoded.name,out[0].vertrag.name);
 });
 await contexts[0].close();await start(0);
 await step('Gerätetransport: echter Sender-Neustart und Wiederholung ergeben dasselbe Paket',async()=>{
  const again=await download(0,panel(0).getByRole('button',{name:'Dasselbe Paket erneut speichern',exact:true}));assert.deepEqual(again.buffer,packet.buffer);
 });
 await step('Gerätetransport: Ziel zeigt Vorschau; erst ausdrückliche Aufnahme speichert und quittiert',async()=>{
  await panel(1).getByLabel('Übergabepaket öffnen').setInputFiles(packet);
  await panel(1).getByRole('button',{name:'Dauerhaft in den Eingang übernehmen',exact:true}).waitFor();assert.equal((await database(1)).transfers.filter(x=>x.rueckkanal).length,0);
  await panel(1).getByRole('button',{name:'Dauerhaft in den Eingang übernehmen',exact:true}).click();await panel(1).getByRole('button',{name:'Empfangsdatei speichern',exact:true}).waitFor();
  const db=await database(1),entry=db.transfers.find(x=>x.rueckkanal);assert.ok(entry.quittung.eingangId);assert.ok(db.incoming.some(x=>x.id===entry.quittung.eingangId));assert.ok(db.files.some(x=>x.id===entry.quittung.eingangId));
  assert.equal((await database(0)).transfers.find(x=>x.typ==='geraete-ausgang').stand,'offen');
 });
 await contexts[1].close();await start(1);
 await step('Gerätetransport: Ziel-Neustart, doppelte Sendung und wiederholbare Quittung ohne Doppeleingang',async()=>{
  const before=await database(1);await panel(1).getByLabel('Übergabepaket öffnen').setInputFiles(packet);await panel(1).getByRole('button',{name:'Dauerhaft in den Eingang übernehmen',exact:true}).click();
  await panel(1).getByRole('status').filter({hasText:'Dauerhaft im Eingang'}).waitFor();
  const after=await database(1);assert.deepEqual(after.files,before.files);assert.equal(after.incoming.length,before.incoming.length);
  receipt=await download(1,panel(1).getByRole('button',{name:'Empfangsdatei speichern',exact:true}));assert.equal(JSON.parse(receipt.buffer).quittung.eingangId,before.transfers.find(x=>x.rueckkanal).quittung.eingangId);
 });
 await step('Gerätetransport: falsche Kennung, Prüfsumme, Ziel, Empfänger und Nonce bestätigen nichts',async()=>{
  const r=JSON.parse(receipt.buffer);
  for(const change of [v=>v.quittung.id='fremd',v=>v.quittung.sha256='0'.repeat(64),v=>v.quittung.ziel='private-brain',v=>v.rueckkanal.empfaenger='Anderes Gerät',v=>v.rueckkanal.nonce='0'.repeat(64)]){
   const wrong=structuredClone(r);change(wrong);await panel(0).getByLabel('Empfangsdatei prüfen').setInputFiles({name:receipt.name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(wrong))});
   await panel(0).getByRole('status').filter({hasText:'passt nicht'}).waitFor();assert.equal((await database(0)).transfers.find(x=>x.typ==='geraete-ausgang').stand,'offen');
  }
 });
 await step('Gerätetransport: nur passende dauerhafte Empfangsdatei schließt den gemerkten Ausgang',async()=>{
  await panel(0).getByLabel('Empfangsdatei prüfen').setInputFiles(receipt);await panel(0).getByRole('status').filter({hasText:'Passende Rückbestätigung'}).waitFor();
  assert.equal((await database(0)).transfers.find(x=>x.typ==='geraete-ausgang').stand,'im-eingang');
  await panel(0).getByLabel('Empfangsdatei prüfen').setInputFiles(receipt);await panel(0).getByRole('status').filter({hasText:'Passende Rückbestätigung'}).waitFor();
 });
 await step('Gerätetransport: voller Speicher und Abbruch nach letzter Schreibanforderung erzeugen keine Quittung',async()=>pages[1].evaluate(async()=>{
  const api=await import('/__transport_probe/pro-geraetetransport');
  for(const mode of ['quota','abort']){
   const file=new File(['Erfundene Datei '+mode],'Abbruch.txt',{type:'text/plain'}),out=await api.geraeteAusgangVorbereiten('probe-abbruch',file,'dok-'+mode,'Einzelgerät'),p=await api.geraetePaket(out,file);
   const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){
    if(mode==='quota'&&this.name==='eingang-dateien')throw new DOMException('Erfundener voller Speicher','QuotaExceededError');
    const r=put.apply(this,args);if(mode==='abort'&&this.name==='uebergaben')r.addEventListener('success',()=>this.transaction.abort());return r;
   };
   let rejected=false;try{await api.geraetePaketAnnehmen(p);}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}
   if(!rejected||(await api.geraeteEingaenge()).some(x=>x.vertrag.id===out.vertrag.id))throw Error('Quittung vor Transaktionsende oder trotz vollem Speicher');
  }
 }));
 await step('Gerätetransport: manipulierte Bytes, falsches Ziel, Paketkopf und übergroße Originale werden abgelehnt',async()=>pages[1].evaluate(async bytes=>{
  const api=await import('/__transport_probe/pro-geraetetransport'),bad=[];
  const changed=new Uint8Array(bytes);changed[changed.length-1]^=1;bad.push(new File([changed],'falsch'));
  const original=new Uint8Array(bytes),length=new DataView(original.buffer).getUint32(8),header=JSON.parse(new TextDecoder().decode(original.slice(12,12+length)));
  header.vertrag.ziel='private-brain';const encoded=new TextEncoder().encode(JSON.stringify(header)),prefix=original.slice(0,12);new DataView(prefix.buffer).setUint32(8,encoded.length);bad.push(new File([prefix,encoded,original.slice(12+length)],'ziel'));
  const hugeHeader=original.slice();new DataView(hugeHeader.buffer).setUint32(8,8193);bad.push(new File([hugeHeader],'kopf'));
  bad.push(new File([new Uint8Array(20*1024*1024+8192+13)],'zu-gross'));
  for(const f of bad){let reject=false;try{await api.geraetePaketAnnehmen(f);}catch{reject=true;}if(!reject)throw Error('Ungültiges Paket angenommen: '+f.name);}
  const giant=new File([new Uint8Array(20*1024*1024+1)],'Gross.bin');let rejected=false;try{await api.geraeteAusgangVorbereiten('akte',giant,'gross','Gerät');}catch{rejected=true;}if(!rejected)throw Error('20 MiB Grenze übergangen');
 },[...packet.buffer]));
 await step('Gerätetransport: getrennte Akten und Empfänger; neue Fassung hat neue Kennung und Quellbezug',async()=>pages[0].evaluate(async()=>{
  const api=await import('/__transport_probe/pro-geraetetransport'),a=new File(['Erfundene Fassung'],'Version.txt',{type:'text/plain'}),b=new File(['Geänderte erfundene Fassung'],'Version.txt',{type:'text/plain'});
  const one=await api.geraeteAusgangVorbereiten('akte-1',a,'doc-1','Gerät 1');
  const repeat=await api.geraeteAusgangVorbereiten('akte-1',a,'doc-1','Gerät 1');if(repeat.vertrag.id!==one.vertrag.id||repeat.rueckkanal.nonce!==one.rueckkanal.nonce)throw Error('Wiederholung wechselt Kennung');
  const two=await api.geraeteAusgangVorbereiten('akte-1',a,'doc-1','Gerät 2'),other=await api.geraeteAusgangVorbereiten('akte-2',a,'doc-1','Gerät 1'),next=await api.geraeteAusgangVorbereiten('akte-1',b,'doc-1','Gerät 1',one.vertrag.id);
  if(new Set([one,two,other,next].map(x=>x.vertrag.id)).size!==4||next.vertrag.bezug!==one.vertrag.id)throw Error('Fassung/Empfänger/Akte verwechselt');
  let rejected=false;try{await api.geraetePaket(one,b);}catch{rejected=true;}if(!rejected)throw Error('Verändertes Original mit alter Kennung gesendet');
 }));
 await step('Gerätetransport: gleicher Transfer mit anderem Rückkanal wird abgelehnt',async()=>pages[1].evaluate(async bytes=>{
  const api=await import('/__transport_probe/pro-geraetetransport'),p=new Uint8Array(bytes),n=new DataView(p.buffer).getUint32(8),h=JSON.parse(new TextDecoder().decode(p.slice(12,12+n)));h.rueckkanal.nonce='a'.repeat(64);const e=new TextEncoder().encode(JSON.stringify(h)),prefix=p.slice(0,12);new DataView(prefix.buffer).setUint32(8,e.length);
  let rejected=false;try{await api.geraetePaketAnnehmen(new File([prefix,e,p.slice(12+n)],'fremd'));}catch{rejected=true;}if(!rejected)throw Error('Fremden Rückkanal übernommen');
 },[...packet.buffer]));
 await step('Gerätetransport: Exportadapter meldet Abbruch ehrlich und räumt Android-Tickets nach Fehlern auf',async()=>pages[0].evaluate(async()=>{
  const {dateiAusgeben}=await import('/__transport_probe/dateiausgabe');const old=window.Capacitor;let aborts=0,attempts=0;
  try{
   window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',Plugins:{WorkflowFiles:{begin:async()=>({id:'erfunden'}),append:async a=>({size:a.offset+atob(a.data).length}),finish:async a=>({size:a.size}),save:async()=>{if(attempts++)throw Error('Erfundener Schreibfehler');return {cancelled:true}},abort:async()=>{aborts++;}}}};
   if(await dateiAusgeben(new File(['x'],'probe.bin'))!=='abgebrochen')throw Error('Abbruch als Erfolg');let rejected=false;try{await dateiAusgeben(new File(['x'],'probe.bin'));}catch{rejected=true;}if(!rejected||aborts!==2)throw Error('Tickets nicht bereinigt');
  }finally{window.Capacitor=old;}
 }));
 await step('Gerätetransport: keine Übertragung ohne Transportwahl und keine Seitenfehler',async()=>{assert.deepEqual(external,[]);assert.deepEqual(errors,[]);});
}finally{for(const c of contexts)await c?.close().catch(()=>{});await app.stop();for(const p of profiles)rmSync(p,{recursive:true,force:true});}
process.exit(summary('Gerätetransport mit zwei Browserprofilen'));
