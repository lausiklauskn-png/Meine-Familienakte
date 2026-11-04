// Echter Work-IndexedDB-Code; native Prozessgrenze gestellt, Kryptografie/Protokoll separat echte JVM.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { startApp, launchBrowser, DESKTOP, ready, footer, step, summary, ROOT } from './_harness.mjs';
import { capacitorStub } from './_capacitor-stub.mjs';
const app=await startApp(),browser=await launchBrowser();
try {
 const context=await browser.newContext({...DESKTOP,serviceWorkers:'block'});
 await context.addInitScript(capacitorStub);
 await context.addInitScript(() => {
   const state=window.__verbund={id:'tresor-a',marks:0,sends:[],peerConfirmed:false,failSend:true,failMark:false,incoming:null};
   window.Capacitor.Plugins.FamilienakteTresor={
     zustand:async()=>({status:'offen',id:state.id,uebergaben:true}),
     uebergabeSenden:async a=>{
       window.__verbund.sends.push({name:a.name,mime:a.mime});const calls=JSON.parse(localStorage.getItem('fixture-sends')||'[]');calls.push(a.transferId);localStorage.setItem('fixture-sends',JSON.stringify(calls));
       const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0));const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
       if(state.failSend){state.failSend=false;throw new Error('Erfundener Abbruch nach nativer Ablage');}
       return {vaultId:a.vaultId,entryId:'e-'+hash.slice(0,36),sha256:hash,size:bytes.length,stand:'weitergegeben'};
     },
     uebergabeStand:async()=>({bestaetigt:state.peerConfirmed}),
     uebergabeEingang:async()=>({items:state.incoming?[{entryId:'r-17',vertrag:state.incoming.vertrag}]:[]}),
     uebergabeLesen:async()=>state.incoming,
     uebergabeQuittieren:async()=>{
       // Selbst die gestellte native Grenze kontrolliert den bereits abgeschlossenen echten Datenbankstand.
       const r=indexedDB.open('FamilienakteStapel1'); const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
       try {await new Promise((ok,no)=>{const t=db.transaction(['eingang','eingang-dateien','uebergaben']);const a=t.objectStore('eingang').getAll(),b=t.objectStore('eingang-dateien').getAll(),c=t.objectStore('uebergaben').getAll();t.oncomplete=()=>a.result.length&&b.result.length&&c.result.some(x=>x.quittung)?ok():no(new Error('Vor dauerhafter Aufnahme markiert'));t.onabort=()=>no(t.error)});}finally{db.close();}
       if(state.failMark){state.failMark=false;throw new Error('Erfundene entfernte SD-Karte');}
       state.marks++;return {stand:'im-eingang'};
     },
   };
 });
 const page=await context.newPage();
 await page.route('**/lib/demo-workspace.ts', async route => {
   const {outputText}=ts.transpileModule(readFileSync(`${ROOT}/lib/demo-workspace.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
   await route.fulfill({contentType:'text/javascript',body:outputText});
 });
 await page.route(/\/__pro_probe\//,async route=>{
   const name=new URL(route.request().url()).pathname.split('/').pop();
   if(!['pro-verbund','pro-uebergabe','stapel-ablage','pro-tresor'].includes(name))return route.abort();
   const {outputText}=ts.transpileModule(readFileSync(`${ROOT}/app/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
   await route.fulfill({contentType:'text/javascript',body:outputText});
 });
 await page.goto(app.base);await ready(page);
 await step('Ausgang sichert Kennung vor nativer Ablage und nimmt beim Wiederholen dieselbe',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund');const f=new File(['Erfundene Nachricht 88'],'Erfunden.txt',{type:'text/plain'});
   let abbruch=false;try{await api.proDateiWeitergeben(f,'dok-88','private-brain');}catch{abbruch=true;}
   if(!abbruch)throw new Error('Abbruch nicht gemeldet');
   const a=await api.proDateiWeitergeben(f,'dok-88','private-brain');
   const ids=JSON.parse(localStorage.getItem('fixture-sends'));
   if(ids.length!==2||ids[0]!==ids[1]||a.stand!=='weitergegeben')throw new Error('Wiederholung/Quittungsgrenze falsch');
   return true;
 }));
 await page.reload();await ready(page);
 await step('Neustart behält Ausgang; erst echte Zielmarke ändert den Stand',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund');let rows=await api.proAusgaengeLesen('tresor-a');
   if(rows.length!==1||rows[0].stand!=='weitergegeben')throw new Error('Ausgang nicht wiederaufgenommen');
   if((await api.proAusgangPruefen(rows[0])).stand!=='weitergegeben')throw new Error('Zustellung als Zielannahme gewertet');
   window.__verbund.peerConfirmed=true;
   if((await api.proAusgangPruefen(rows[0])).stand!=='im-eingang')throw new Error('Zielmarke fehlt');
   window.__verbund.id='fremder-tresor';let falsch=false;try{await api.proAusgangPruefen(rows[0]);}catch{falsch=true;}window.__verbund.id='tresor-a';
   return falsch;
 }));
 await step('Empfang: gescheiterte Dateiablage setzt keine native Empfängermarke',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund');const {proUebergabeBauen}=await import('/__pro_probe/pro-uebergabe');
   const f=new File(['Erfundene Antwort 17'],'Antwort.txt',{type:'text/plain'});
   window.__verbund.incoming={vertrag:await proUebergabeBauen(f,'workflow-pdf-pro','familienakte','doc-17','rueck-17'),data:btoa(await f.text())};
   const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){if(this.name==='eingang-dateien')throw new DOMException('Speicher voll','QuotaExceededError');return put.apply(this,a)};
   let fehl=false;try{await api.proEingangAufnehmen('tresor-a','r-17');}catch{fehl=true;}finally{IDBObjectStore.prototype.put=put;}
   if(!fehl||window.__verbund.marks!==0)throw new Error('Trotz Abbruch quittiert');
   return true;
 }));
 await step('Empfang: Markerfehler bleibt wiederholbar, gespeicherter Eingang bleibt einfach',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund');window.__verbund.failMark=true;
   let fehl=false;try{await api.proEingangAufnehmen('tresor-a','r-17');}catch{fehl=true;}
   if(!fehl||window.__verbund.marks!==0)throw new Error('Markerfehler als Erfolg gemeldet');
   const a=await api.proEingangAufnehmen('tresor-a','r-17'),b=await api.proEingangAufnehmen('tresor-a','r-17');
   if(a.eingangId!==b.eingangId||window.__verbund.marks!==2)throw new Error('Wiederaufnahme falsch');
   const r=indexedDB.open('FamilienakteStapel1');await new Promise((ok,no)=>{r.onsuccess=()=>{const db=r.result,t=db.transaction('eingang'),q=t.objectStore('eingang').getAll();t.oncomplete=()=>{db.close();if(q.result.filter(x=>x.id===a.eingangId).length===1)ok();else no(new Error('Doppelter Eingang'))};};r.onerror=()=>no(r.error)});
   return true;
 }));
 await step('Dokumentenbibliothek: nur ausgewählte Unterlage weitergeben, Wiederholung behält Kennung',async()=>{
   await footer(page,'Dokumentenbibliothek');
   const index=await page.locator('.library-document-card').filter({has:page.getByRole('button',{name:'An Pro-App geben …',exact:true})}).first().evaluate(e=>[...document.querySelectorAll('.library-document-card')].indexOf(e));
   const karte=page.locator('.library-document-card').nth(index);
   const originalName=await karte.locator('.library-document-title').innerText();
   await karte.getByRole('button',{name:'An Pro-App geben …',exact:true}).click();
   await karte.locator('select').selectOption('private-brain');
   await karte.getByRole('button',{name:'Ausgewählte Unterlage weitergeben',exact:true}).click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('fixture-sends')||'[]').length===3);
   await karte.getByRole('button',{name:'Ausgewählte Unterlage weitergeben',exact:true}).click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('fixture-sends')||'[]').length===4);
   return page.evaluate(name=>{const ids=JSON.parse(localStorage.getItem('fixture-sends'));if(window.__verbund.sends.at(-1).name!==name)throw Error('Originalname geht bei Pro-Übergabe verloren');return ids[2]===ids[3]},originalName);
 });
 await step('Sicherheitscenter zeigt Pro-Eingang und gemerkten Ausgang mit offener Zielbestätigung',async()=>{
   await footer(page,'Sicherheitscenter');
   const panel=page.locator('[data-pro-verbund]');await panel.waitFor();
   await panel.getByRole('button',{name:'Pro-Eingang prüfen',exact:true}).click();
   await panel.getByRole('heading',{name:'Gemerkter Ausgang',exact:true}).waitFor();
   return /Zielbestätigung offen/.test(await panel.innerText());
 });
 await step('Rückweg behält Bezug; geänderte Bytes bekommen eine eigene Fassung',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund');window.__verbund.failSend=false;
   const a=await api.proDateiWeitergeben(new File(['Original'],'Rueckweg.pdf',{type:'application/pdf'}),'neu-17','workflow-pdf-pro','rueck-17');
   const b=await api.proDateiWeitergeben(new File(['Bearbeitete Fassung'],'Rueckweg.pdf',{type:'application/pdf'}),'neu-17','workflow-pdf-pro','rueck-17');
   if(a.vertrag.id===b.vertrag.id||a.vertrag.bezug!=='rueck-17'||b.vertrag.bezug!=='rueck-17')throw new Error('Fassung/Quellbezug verloren');
   const r=indexedDB.open('FamilienakteStapel1');const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
   try{return await new Promise((ok,no)=>{const t=db.transaction('eingang'),q=t.objectStore('eingang').getAll();t.oncomplete=()=>ok(q.result.some(x=>x.proUebergabe?.id==='rueck-17'&&x.proUebergabe?.dokumentId==='doc-17'));t.onabort=()=>no(t.error)});}finally{db.close();}
 }));
 await step('Unpassender Zieltyp geht vor nativer Weitergabe zurück',async()=>page.evaluate(async()=>{
   const api=await import('/__pro_probe/pro-verbund'),vorher=localStorage.getItem('fixture-sends');
   let fehler=0;
   for(const ziel of ['workflow-pdf-pro','bookledgerpro'])try{await api.proDateiWeitergeben(new File(['Text'],'Notiz.txt',{type:'text/plain'}),'ungeeignet',ziel);}catch{fehler++;}
   return fehler===2&&localStorage.getItem('fixture-sends')===vorher;
 }));
}finally{await browser.close();await app.stop();}
process.exit(summary('Eigenständiger Pro-Verbund – tatsächlicher Work-Speicher'));
