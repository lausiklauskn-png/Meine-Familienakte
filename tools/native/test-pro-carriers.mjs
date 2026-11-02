// Integration: real Family packet/IDB, real Kim-sync clients/admission service,
// real Datei-Post encryption/server. Only the relay delivery is a local fixture.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import ts from 'typescript';
import {startApp,launchBrowser,ROOT,ready} from '../../tests/ui/_harness.mjs';
const kim=resolve(process.argv[2]||'../work/Kim-sync'),post=resolve(process.argv[3]||'../work/Datei-Post');
const tmp=await mkdtemp(join(tmpdir(),'fa-carriers-'));
const {starten,einstellungen,hauptcodeSetzen}=await import(pathToFileURL(join(post,'server.mjs')));
const K=await import(pathToFileURL(join(post,'public/krypto.js')));
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const kimServer=http.createServer(async(q,r)=>{try{let p=new URL(q.url,'http://fixture').pathname;if(p.endsWith('/'))p+='index.html';const path=resolve(kim,'.'+p);if(!path.startsWith(kim+'/'))throw Error();r.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');r.end(await readFile(path));}catch{r.writeHead(404);r.end();}});
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+s.address().port)));
const kimBase=await listen(kimServer),master='Invented-'+randomUUID();await hauptcodeSetzen(join(tmp,'dateipost'),master);
const postServer=starten(einstellungen({DATEN:join(tmp,'dateipost'),KIMSYNC_HERKUNFT:kimBase})),postBase=await listen(postServer);
const {Zulassung,server:admissionServer}=await import(pathToFileURL(join(kim,'server/zulassung/zulassung.mjs')));
const admission=admissionServer(new Zulassung({daten:join(tmp,'admission'),vorlage:join(kim,'server/zulassung/config.vorlage.toml'),ziel:join(tmp,'config.toml')})),admissionBase=await listen(admission);
const relay={events:[],subscriptions:new Set()};
const relayAddress='wss://relay.family-projekt.de';
const matches=(f,e)=>(!f.kinds||f.kinds.includes(e.kind))&&(!f['#t']||e.tags.some(t=>t[0]==='t'&&f['#t'].includes(t[1])))&&(!f.since||e.created_at>=f.since);
async function roomContext(browser){
 const c=await browser.newContext({serviceWorkers:'block',acceptDownloads:true,viewport:{width:1100,height:850}});
 await c.routeWebSocket('**',ws=>ws.close());
 await c.routeWebSocket(/^wss:\/\/relay\.family-projekt\.de\/?$/,ws=>{
  const sub={ws,filters:new Map()};relay.subscriptions.add(sub);ws.onClose(()=>relay.subscriptions.delete(sub));
  ws.onMessage(raw=>{const m=JSON.parse(raw);
   if(m[0]==='REQ'){sub.filters.set(m[1],m[2]);for(const event of relay.events)if(matches(m[2],event))ws.send(JSON.stringify(['EVENT',m[1],event]));ws.send(JSON.stringify(['EOSE',m[1]]));}
   if(m[0]==='CLOSE')sub.filters.delete(m[1]);
   if(m[0]==='EVENT'){const event=m[1];if(event.kind===5){const ids=event.tags.filter(t=>t[0]==='e').map(t=>t[1]);relay.events=relay.events.filter(e=>e.pubkey!==event.pubkey||!ids.includes(e.id));}
    else if(!relay.events.some(e=>e.id===event.id)){assert.ok(Buffer.byteLength(JSON.stringify(event))<=128*1024);relay.events.push(event);for(const s of relay.subscriptions)for(const [id,f]of s.filters)if(matches(f,event))s.ws.send(JSON.stringify(['EVENT',id,event]));}
    ws.send(JSON.stringify(['OK',event.id,true,'']));}
  });
 });
 await c.route('https://relay.family-projekt.de/zulassung/**',async route=>{const q=route.request(),url=new URL(q.url()),r=await fetch(admissionBase+url.pathname,{method:q.method(),headers:{'content-type':'application/json'},body:q.method()==='POST'?q.postData():undefined});await route.fulfill({status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()});});
 await c.addInitScript(address=>localStorage.setItem('kimsync_relais',JSON.stringify([address])),relayAddress);
 const page=await c.newPage();return {context:c,page};
}
const app=await startApp(),browser=await launchBrowser();let A,B;const postRequests=[];postServer.on('request',(q,r)=>{r.on('finish',()=>postRequests.push({path:q.url,status:r.statusCode}));});
async function family(){const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await context.route('**/__carrier_probe/*',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();if(!['pro-geraetetransport','pro-uebergabe','stapel-ablage'].includes(name))return route.abort();const r=ts.transpileModule(readFileSync(join(ROOT,'app',name+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});await route.fulfill({contentType:'text/javascript',body:r.outputText});});
 await page.goto(app.base);await ready(page);return page;}
const readyKim=p=>p.waitForFunction(()=>window.__kimsync?.bereit===true,null,{timeout:30000});
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
 const source=await family(),target=await family();
 const packet=await source.evaluate(async()=>{const api=await import('/__carrier_probe/pro-geraetetransport'),bytes=new Uint8Array(20*1024*1024);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;bytes.set(new TextEncoder().encode('ErfundeneOriginalbytesFamilienakteTransport2026'));
  const original=new File([bytes],'Erfundenes-Original.jpg',{type:'image/jpeg'}),out=await api.geraeteAusgangVorbereiten('erfundene-quellakte',original,'original-1','Erfundenes Zielgerät'),file=await api.geraetePaket(out,original);
  const data=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));return {name:file.name,base64:btoa(binary),sha:out.vertrag.sha256,id:out.vertrag.id};});
 const bytes=Buffer.from(packet.base64,'base64');assert.ok(bytes.length>20*1024*1024,'Packet header must exercise existing large-file connection');
 A=await roomContext(browser);B=await roomContext(browser);
 await A.page.goto(kimBase+'/');await readyKim(A.page);await A.page.fill('#nameFeld','Erfundener Sender');await A.page.click('#neuerRaum');await A.page.waitForFunction(()=>document.querySelector('#einladen').open);const code=(await A.page.textContent('#einladenCode')).trim();await A.page.click('#einladen [data-schliessen]');
 await B.page.goto(kimBase+'/#raum='+code.replaceAll('-',''));await readyKim(B.page);await B.page.fill('#nameFeld','Erfundenes Ziel');await B.page.click('#beitreten');
 const pub=await B.page.evaluate(()=>window.__kimsync.ich);await A.page.locator('#einlassListe [data-einlass="'+pub+'"]').waitFor({timeout:30000});await A.page.locator('#einlassListe [data-einlass="'+pub+'"]').click();await B.page.waitForFunction(()=>window.__kimsync.rs()&&!window.__kimsync.wartet(),null,{timeout:30000});
 // The real server gets only derived access identifiers and encrypted secrets.
 const mainKey=await K.ableiten(master,'haupt'),auth=await fetch(postBase+'/api/anmelden',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kennung:mainKey.kennung})}).then(r=>r.json());assert.ok(auth.token);
 const access=K.neuerCode(),identity=await K.ableiten(K.normalisiereCode(access),'kimsync');const created=await fetch(postBase+'/api/kimsync-codes',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+auth.token},body:JSON.stringify({kennung:identity.kennung,codeHaupt:await K.textEinpacken(access,mainKey.schluessel,'code')})});assert.equal(created.status,201);
 await A.page.click('#einstellungenKnopf');await A.page.fill('#gvServer',postBase);await A.page.fill('#gvCode',access);await A.page.click('#gvSpeichern');await A.page.waitForFunction(()=>document.querySelector('#gvStand').dataset.gvStand==='an');await A.page.keyboard.press('Escape');
 await B.page.waitForFunction(()=>Boolean(window.__kimsync.dp()?.kennung),null,{timeout:30000});
 await A.page.setInputFiles('#dateiwahl',{name:packet.name,mimeType:'application/octet-stream',buffer:bytes});await A.page.click('#senden');
 const card=B.page.locator('.nachricht:not(.eigen) .grosskarte').last();await Promise.race([card.waitFor({timeout:90000}),A.page.waitForFunction(()=>document.getElementById('meldung')?.textContent.startsWith('Senden ging nicht:'),null,{timeout:90000}).then(async()=>{throw Error(await A.page.locator('#meldung').innerText());})]);await card.locator('.btn').last().click();
 await B.page.locator('.nachricht:not(.eigen) .dateikarte .name').filter({hasText:packet.name}).waitFor({timeout:90000});
 const link=B.page.locator('.nachricht:not(.eigen) .aktionen a[data-laden]').last();const [download]=await Promise.all([B.page.waitForEvent('download'),link.click()]);const received=await readFile(await download.path());assert.equal(hash(received),hash(bytes));
 assert.equal(await source.evaluate(async()=>{const a=await import('/__carrier_probe/pro-geraetetransport');return (await a.geraeteAusgaenge('erfundene-quellakte'))[0].stand;}),'offen','Kim delivery is not Family receipt');
 console.log('PASS Family 20 MiB original → Kim-sync original-file UI → actual Datei-Post server → second Kim client, exact packet bytes; Family still unconfirmed');
 const returned=await target.evaluate(async data=>{const api=await import('/__carrier_probe/pro-geraetetransport'),file=new File([Uint8Array.from(atob(data),x=>x.charCodeAt(0))],'received.familienakte-paket');const first=await api.geraetePaketAnnehmen(file),again=await api.geraetePaketAnnehmen(file);if(first.eingangId!==again.eingangId)throw Error('Duplicate Family input');const entries=await api.geraeteEingaenge();if(entries.length!==1)throw Error('Duplicate durable receipt');const receipt=api.geraeteQuittung(entries[0]);return {name:receipt.name,text:await receipt.text()};},received.toString('base64'));
 await B.page.setInputFiles('#dateiwahl',{name:returned.name,mimeType:'application/json',buffer:Buffer.from(returned.text)});await B.page.click('#senden');await A.page.locator('.nachricht:not(.eigen) .dateikarte .name').filter({hasText:returned.name}).waitFor({timeout:30000});
 const [reply]=await Promise.all([A.page.waitForEvent('download'),A.page.locator('.nachricht:not(.eigen) .aktionen a[data-laden]').last().click()]);const replyBytes=await readFile(await reply.path());assert.equal(replyBytes.toString(),returned.text);
 assert.equal(await source.evaluate(async text=>{const api=await import('/__carrier_probe/pro-geraetetransport');const accepted=await api.geraeteQuittungAnnehmen(new File([text],'receipt.familienakte-quittung'),'erfundene-quellakte');return accepted.stand;},replyBytes.toString()),'im-eingang');
 console.log('PASS Family target commits once, matching receipt returns through Kim relay fixture and only then confirms original outgoing');
 const marker='ErfundeneOriginalbytesFamilienakteTransport2026';assert.ok(!JSON.stringify(relay.events).includes(marker));assert.ok(!JSON.stringify(relay.events).includes(packet.name));
 for(const entry of await readdir(join(tmp,'dateipost'),{recursive:true,withFileTypes:true}))if(entry.isFile()){const stored=await readFile(join(entry.parentPath,entry.name));assert.ok(!stored.includes(Buffer.from(marker))&&!stored.includes(Buffer.from(packet.name)),'Carrier storage contains plaintext original/name');}
 console.log('PASS Relay events and real Datei-Post storage contain no original plaintext or packet filename. Synthetic local services only, not a live public-relay or physical-device claim.');
}catch(error){console.error(JSON.stringify({phase:'carrier failure',postRequests,sender:await A?.page.locator('#meldung').innerText().catch(()=>null),recipient:await B?.page.locator('#meldung').innerText().catch(()=>null),preview:await A?.page.locator('#vorschau').innerText().catch(()=>null)},null,2));throw error;}finally{await browser.close();await app.stop();kimServer.closeAllConnections();postServer.closeAllConnections();admission.closeAllConnections();await Promise.all([new Promise(r=>kimServer.close(r)),new Promise(r=>postServer.close(r)),new Promise(r=>admission.close(r))]);await rm(tmp,{recursive:true,force:true});}
