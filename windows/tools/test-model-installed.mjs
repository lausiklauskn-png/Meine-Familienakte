// Actual installed Windows app, WebView2 and bundled 256 MiB Java process.
// Uses only the invented sample family. No fake native plugin or model vectors.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {chromium} from 'playwright';
const out=resolve(process.argv[2]);await mkdir(out,{recursive:true});
const report={checks:[],kind:'Installed Windows / WebView2 on CI, no physical user device'},errors=[];
let browser,page,lastConnectionError;
try {
 const deadline=Date.now()+60000;
 while(!browser&&Date.now()<deadline){try{browser=await chromium.connectOverCDP('http://127.0.0.1:9333',{timeout:3000});}catch(error){lastConnectionError=String(error);await pause(500);}}
 assert.ok(browser,'Installed WebView2 is reachable: '+lastConnectionError);
 page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://tauri.localhost/'));assert.ok(page,'Family window');
 page.on('pageerror',e=>errors.push(e.message));
 await page.waitForSelector('.sample-data-notice strong',{timeout:120000});
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
 await panel.getByRole('button',{name:'Index aufbauen / fortsetzen',exact:true}).click();await panel.getByRole('status').filter({hasText:'Suchindex bereit:'}).waitFor({timeout:240000});
 report.checks.push('Production Worker, actual pinned model and private IndexedDB activate the sample index');
 await page.reload();await page.waitForSelector('.sample-data-notice strong',{timeout:120000});
 await page.locator('.footer-directory button',{hasText:'Sicherheitscenter'}).click();await panel.getByRole('button',{name:'Gerät, Modelle und Suchindex',exact:true}).click();
 await panel.getByLabel('Frage an diese Akte').fill('Waschautomat');await panel.getByRole('button',{name:'In dieser Akte nach Bedeutung suchen',exact:true}).click();await panel.locator('.search-results button').first().waitFor({timeout:120000});
 assert.equal(await page.getAttribute('.netz-schalter','data-netz'),'aus');
 assert.equal(await page.evaluate(()=>fetch('/_fa_models/klein/model/not-pinned.json').then(r=>r.status)),404);
 report.checks.push('Offline search after reload, local missing asset fails closed');
 await page.screenshot({path:join(out,'private-meaning-windows.png'),fullPage:true});
 await panel.locator('.search-results button').first().click();await page.waitForFunction(()=>!document.querySelector('.private-meaning'));
 assert.deepEqual(errors,[]);report.checks.push('Actual result opens the document');report.complete=true;
} catch(error) {report.error=String(error);await page?.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally {report.pageErrors=errors;await writeFile(join(out,'installed-model.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();}
