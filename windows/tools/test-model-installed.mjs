import {openDemoFixture} from './test-demo-fixture.mjs';
// Actual installed Windows app, WebView2 and bundled 256 MiB Java process.
// Uses only the invented sample family. No fake native plugin or model vectors.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {chromium} from 'playwright';
const out=resolve(process.argv[2]);await mkdir(out,{recursive:true});
const report={checks:[],assets:[],console:[],kind:'Installed Windows / WebView2 on CI, no physical user device'},errors=[];
let browser,page,lastConnectionError;
// Probe the same worker request boundary used by the product. The page's
// unchanged internet switch must not acquire a new generic network exception.
const asset = path => page.evaluate(path => new Promise((resolve,reject) => {
 const code = `onmessage=async e=>{try{const r=await fetch(e.data);postMessage({status:r.status,type:r.headers.get('content-type'),prefix:(await r.text()).slice(0,100)});}catch(e){postMessage({error:String(e)});}}`;
 const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'})),worker=new Worker(url);
 const end=()=>{worker.terminate();URL.revokeObjectURL(url);};
 const timer=setTimeout(()=>{end();reject(Error('Local asset probe timed out'));},10000);
 worker.onmessage=e=>{clearTimeout(timer);end();e.data.error?reject(Error(e.data.error)):resolve(e.data);};
 worker.onerror=e=>{clearTimeout(timer);end();reject(Error(e.message));};
 worker.postMessage('https://familienakte-model.localhost/_fa_models/klein/'+path);
}),path);
try {
 const deadline=Date.now()+60000;
 while(!browser&&Date.now()<deadline){try{browser=await chromium.connectOverCDP('http://127.0.0.1:9333',{timeout:3000});}catch(error){lastConnectionError=String(error);await pause(500);}}
 assert.ok(browser,'Installed WebView2 is reachable: '+lastConnectionError);
 const isMain=url=>/^https:\/\/tauri\.localhost\/(index\.html)?(\?[^#]*)?(#.*)?$/.test(url);
 const targets=()=>fetch('http://127.0.0.1:9333/json').then(r=>r.json()).then(list=>list.map(t=>t.url)).catch(()=>[]);
 let reconnected=false;
 // CDP may be ready before WebView2 publishes its main page. Reuse the same
 // startup budget and reconnect once if CDP knows a target Playwright missed.
 while(!page&&Date.now()<deadline){
  page=browser.contexts().flatMap(c=>c.pages()).find(p=>isMain(p.url()));if(page)break;
  if(!reconnected&&(await targets()).some(isMain)){
   reconnected=true;
   // A CDP browser close detaches this client. Leaving the first client alive
   // kept Node running after every model assertion had already passed.
   await browser.close();
   browser=await chromium.connectOverCDP('http://127.0.0.1:9333',{timeout:3000});
  }
  else await pause(250);
 }
 report.reconnected=reconnected;report.targets=await targets();report.pages=browser.contexts().flatMap(c=>c.pages()).map(p=>p.url());
 assert.ok(page,'Family window: '+JSON.stringify({pages:report.pages,targets:report.targets}));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(['error','warning'].includes(m.type()))report.console.push(m.text().slice(0,1000));});
 page.on('response',r=>{if(r.url().includes('/_fa_models/'))report.assets.push({url:r.url(),status:r.status(),type:r.headers()['content-type']});});
 page.on('requestfailed',r=>{if(r.url().includes('/_fa_models/'))report.assets.push({url:r.url(),failure:r.failure()});});
 await openDemoFixture(page);
 await page.waitForFunction(()=>window.PBNetwork?.ready&&window.Capacitor?.Plugins?.FamilyModels);
 const initial=await page.evaluate(async()=>{await window.PBNetwork.setOffline(true);return {state:await window.Capacitor.Plugins.FamilyModels.getState(),device:await window.Capacitor.Plugins.ProDevice.measure(),blocked:await window.Capacitor.Plugins.FamilyModels.install({stage:'klein'}).then(()=>false,()=>true)};});
 assert.equal(initial.state.localAssets,true);assert.equal(initial.device.platform,'windows');assert.equal(initial.blocked,true);assert.equal(initial.state.models.klein.installed,false);report.checks.push('Actual native device, route and offline download gate');
 await page.locator('.footer-directory button',{hasText:'Sicherheitscenter'}).click();
 const panel=page.locator('.private-meaning');await panel.getByRole('button',{name:'Gerät, Modelle und Suchindex',exact:true}).click();
 await panel.getByRole('button',{name:'Dieses Gerät prüfen',exact:true}).click();await panel.getByText(/Quelle: windows/).waitFor();
 await page.locator('.netz-schalter').click();await page.waitForSelector('.netz-schalter[data-netz="an"]');
 await panel.getByRole('button',{name:'Gewähltes Modell laden / fortsetzen',exact:true}).click();
 await panel.getByText(/Modell vollständig abgelegt/).waitFor({timeout:720000});
 await page.locator('.netz-schalter').click();await page.waitForSelector('.netz-schalter[data-netz="aus"]');
 report.checks.push('Explicit small model download with the bundled JRE');
 const config=await asset('model/config.json');
 report.localConfig=config;assert.equal(config.status,200,'Local verified config');assert.match(config.type||'',/json/,'Local route must return a model asset');
 await panel.getByRole('button',{name:'Index aufbauen / fortsetzen',exact:true}).click();await panel.getByRole('status').filter({hasText:'Suchindex bereit:'}).waitFor({timeout:240000});
 report.checks.push('Production Worker, actual pinned model and private IndexedDB activate the sample index');
 await page.reload();await openDemoFixture(page);
 await page.locator('.footer-directory button',{hasText:'Sicherheitscenter'}).click();await panel.getByRole('button',{name:'Gerät, Modelle und Suchindex',exact:true}).click();
 // Nach dem Neuladen öffnet die Demo-Akte asynchron; „Privaten Index löschen“ ist erst mit geöffneter Akte frei (wie „Nach Bedeutung suchen“).
 // Vorher tippte die Probe sofort und fand den Suchknopf in der CI gelegentlich 30 s lang gesperrt (09.11.: zweimal auf PR #144).
 await page.waitForFunction(()=>{const b=[...document.querySelectorAll('.private-meaning button')].find(x=>x.textContent.trim()==='Privaten Index löschen');return b&&!b.disabled;},null,{timeout:120000});
 await panel.getByLabel('Wonach suchst du?').fill('Waschautomat');
 const suchen=panel.getByRole('button',{name:'Nach Bedeutung suchen',exact:true});
 await page.waitForFunction(()=>{const b=[...document.querySelectorAll('.private-meaning button')].find(x=>x.textContent.trim()==='Nach Bedeutung suchen');return b&&!b.disabled;},null,{timeout:60000}).catch(async(e)=>{report.suchknopf=await page.evaluate(()=>({frage:document.querySelector('#bedeutung-frage')?.value,knoepfe:[...document.querySelectorAll('.private-meaning button')].map(b=>`${b.textContent.trim()}:${b.disabled?'aus':'an'}`),meldung:document.querySelector('.private-meaning [role=status]')?.textContent}));throw e;});
 await suchen.click();await panel.locator('.search-results button').first().waitFor({timeout:120000});
 assert.equal(await page.getAttribute('.netz-schalter','data-netz'),'aus');
 assert.equal((await asset('model/not-pinned.json')).status,404);
 report.checks.push('Offline search after reload, local missing asset fails closed');
 await page.screenshot({path:join(out,'private-meaning-windows.png'),fullPage:true});
 await panel.locator('.search-results button').first().click();await page.waitForFunction(()=>!document.querySelector('.private-meaning'));
 assert.deepEqual(errors,[]);report.checks.push('Actual result opens the document');report.complete=true;
} catch(error) {report.error=String(error);report.panel=await page?.locator('.private-meaning').innerText().catch(()=>null);await page?.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally {report.pageErrors=errors;await writeFile(join(out,'installed-model.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();}
