import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// Diagnose eines echten Browserabbruchs, keine Änderung an den Zusicherungen.
process.env.DEBUG ||= 'pw:browser';
const { startApp, launchBrowser, chromium, DESKTOP, HANDY, step, summary, footer, collectErrors } = await import('./_harness.mjs');
import { capacitorStub } from './_capacitor-stub.mjs';
import { demoBereit, demoUmschalten } from './_demo.mjs';
const app=await startApp(),browser=await launchBrowser();mkdirSync('work',{recursive:true});
const errors=[];
const profile=mkdtempSync(path.join(tmpdir(),'familienakte-eigene-ordner-'));
let context;
async function ready(page){await demoBereit(page);}
async function ownHome(page){await page.locator('.main-navigation > button').first().click();await page.locator('.vault-action').waitFor();}
async function switchDemo(page,active){await demoUmschalten(page,active);}
async function neutral(page){await page.locator('.vault-action.state-pending').waitFor();assert.match(await page.locator('.vault-action').innerText(),/Eigenen Datentresor wählen/);}
try{
 // Reales dauerhaftes Profil: OPFS-Ordnerhandles im Register über Seitenwechsel erhalten.
 context=await chromium.launchPersistentContext(profile,{...DESKTOP,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=context.pages()[0];const pageErrors=collectErrors(page);
 await page.goto(app.base,{waitUntil:'networkidle'});await ready(page);
 await step('Eigener Start: automatischer Browserspeicher ist kein grün verbundener Tresor',async()=>{
  await neutral(page);assert.equal(await page.locator('.demo-knopf-schalter').count(),0);assert.equal(await page.locator('.site-header.demo-mode').count(),0);
  await page.locator('.vault-action').click();await page.getByRole('heading',{name:'Lokaler Browserspeicher',exact:true}).waitFor();
  const card=page.locator('.security-compare-card');assert.match(await card.innerText(),/Noch kein eigener Datentresor gewählt/);assert.equal(await card.locator('.badge.success').count(),0);
 });
 await switchDemo(page,true);
 await step('Demo: roter Rahmen und Wort DEMO bleiben oben sichtbar',async()=>{
  await page.locator('.vault-action.state-success').waitFor();assert.match(await page.locator('.vault-action').innerText(),/Demo-Ablage bereit/);
  const header=page.locator('.site-header.demo-mode');assert.equal((await header.locator('.demo-knopf-schalter').innerText()).trim(),'DEMO');
  const frame=await header.evaluate(e=>{const s=getComputedStyle(e);return {color:s.borderTopColor,width:s.borderTopWidth};});assert.equal(frame.color,'rgb(180, 35, 24)');assert.equal(frame.width,'3px');
  await page.screenshot({path:'work/demo-status-21-desktop.png'});
 });
 await step('Demo-Sicherheit: vorhandene Demo-Ablage erklären, keine eigenen Ordner verbinden anbieten',async()=>{
  await footer(page,'Sicherheitscenter');await page.locator('.demo-storage-card .badge.success').waitFor();
  assert.match(await page.locator('.demo-storage-card').innerText(),/keinen eigenen Datentresor anlegen/);
  assert.equal(await page.getByRole('button',{name:/^(Anderen )?PC-\/USB-Ordner|^OneDrive-Ordner verbinden/}).count(),0);
  await page.screenshot({path:'work/demo-status-21-sicherheit.png'});
 });
 await switchDemo(page,false);
 await step('Demo verlassen und Neuladen: eigener Tresor bleibt ungewählt und neutral',async()=>{
  await neutral(page);await page.reload({waitUntil:'networkidle'});await ready(page);await neutral(page);assert.equal(await page.locator('.site-header.demo-mode').count(),0);
 });
 await step('Bewusst gewählter eigener Ordner bleibt nach Demo und Neustart verbunden',async()=>{
  // Nur der OS-Auswahldialog ist gestellt; Handle, Dateien und IDB sind tatsächlich Chromium-OPFS.
  await page.evaluate(async()=>{window.showDirectoryPicker=async()=> {const h=await (await navigator.storage.getDirectory()).getDirectoryHandle('Erfundener-eigener-Auswahlordner',{create:true});const file=await h.getFileHandle('Eigenes-Original.txt',{create:true});const w=await file.createWritable();await w.write('Erfundenes eigenes Original außerhalb des Aktenregisters.');await w.close();return h;};});
  await page.locator('.vault-action').click();await page.getByRole('button',{name:'PC-/USB-Ordner verbinden',exact:true}).click();
  await ownHome(page);await page.locator('.vault-action.state-success').waitFor();assert.match(await page.locator('.vault-action').innerText(),/Erfundener-eigener-Auswahlordner/);
  await switchDemo(page,true);await switchDemo(page,false);await page.locator('.vault-action.state-success').waitFor();assert.match(await page.locator('.vault-action').innerText(),/Erfundener-eigener-Auswahlordner/);
  await page.reload({waitUntil:'networkidle'});await ready(page);await page.locator('.vault-action.state-success').waitFor();
  assert.equal(await page.evaluate(async()=>{const h=await (await navigator.storage.getDirectory()).getDirectoryHandle('Erfundener-eigener-Auswahlordner');return (await (await h.getFileHandle('Eigenes-Original.txt')).getFile()).text();}),'Erfundenes eigenes Original außerhalb des Aktenregisters.');
 });
 const mobile=await(await browser.newContext(HANDY)).newPage();const mobileErrors=collectErrors(mobile);await mobile.goto(app.base+'?demo=1',{waitUntil:'networkidle'});await ready(mobile);
 await step('Mobil: Demo-Rahmen und Kennzeichnung auch bei geschlossenem Menü sichtbar',async()=>{
  assert.equal(await mobile.locator('.main-navigation').isVisible(),false);/* Der rote Knopf hinter dem Namen kennzeichnet die Demo (2026-11-04), auch am Handy; der Name bleibt ganz lesbar. */assert.equal(await mobile.locator('.demo-knopf-schalter').isVisible(),true);assert.equal((await mobile.locator('.demo-knopf-schalter').innerText()).trim(),'DEMO');assert.ok(await mobile.locator('.site-brand strong').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'FAMILIENAKTE nicht abgeschnitten');
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await mobile.screenshot({path:'work/demo-status-21-mobil.png'});
  await switchDemo(mobile,false);assert.equal(await mobile.locator('.demo-knopf-schalter').count(),0);await neutral(mobile);
 });
 const native=await browser.newContext(DESKTOP);await native.addInitScript(capacitorStub+`
  window.__statusPro=JSON.parse(localStorage.getItem('erfundener-nativer-pro-zustand')||'{"status":"getrennt"}');
  window.__saveStatusPro=(s)=>{window.__statusPro=s;localStorage.setItem('erfundener-nativer-pro-zustand',JSON.stringify(s));return s;};
  window.Capacitor.Plugins.FamilienakteTresor={
   zustand:async()=>({...window.__statusPro}),
   verbinden:async()=>window.__saveStatusPro({status:'offen',id:'erfundener-eigener-pro-tresor',ort:'content://erfundener-testordner'}),
   sperren:async()=>window.__saveStatusPro({...window.__statusPro,status:'gesperrt'}),
   entsperren:async()=>window.__saveStatusPro({...window.__statusPro,status:'offen'})
  };`);
 const pro=await native.newPage();const proErrors=collectErrors(pro);await pro.goto(app.base,{waitUntil:'networkidle'});await ready(pro);await neutral(pro);
 await step('Nativer Anschluss allein wird nicht als gewählte Originalablage ausgegeben',async()=>{
  await pro.locator('.vault-action').click();await pro.getByRole('button',{name:'Vorhandenen Pro-Tresor verbinden …',exact:true}).click();
  await pro.locator('[data-pro-tresor-status]').getByText('Entsperrt',{exact:true}).waitFor();await ownHome(pro);await neutral(pro);
 });
 await step('Bewusst zugeordneter offener Pro-Tresor zeigt Grün und bleibt nach Neuladen gewählt',async()=>{
  await pro.locator('.vault-action').click();await pro.getByRole('button',{name:'Neue Originale in diesem Pro-Tresor ablegen',exact:true}).click();
  await ownHome(pro);await pro.locator('.vault-action.state-success').waitFor();assert.match(await pro.locator('.vault-action').innerText(),/Gewählter Pro-Tresor/);
  // Der native Zustand bleibt über den Seitenneustart offen, wie beim laufenden nativen Prozess.
  await pro.reload({waitUntil:'networkidle'});await ready(pro);await pro.locator('.vault-action.state-success').waitFor();
 });
 await step('Gesperrtes Pro-Ziel wird nicht grün; Demo-Wechsel erhält die eigene Zuordnung',async()=>{
  await pro.locator('.vault-action').click();await pro.getByRole('button',{name:'Pro-Tresor sperren',exact:true}).click();await ownHome(pro);await pro.locator('.vault-action.state-failed').waitFor();
  await switchDemo(pro,true);await pro.locator('.vault-action.state-success').waitFor();assert.match(await pro.locator('.vault-action').innerText(),/Demo-Ablage/);
  await switchDemo(pro,false);await pro.locator('.vault-action.state-failed').waitFor();assert.match(await pro.locator('.vault-action').innerText(),/Gewählten Pro-Tresor verbinden und entsperren/);
 });
 errors.push(...pageErrors,...mobileErrors,...proErrors);await step('Keine Seiten- oder Konsolenfehler im Statuswechsel',()=>assert.deepEqual(errors,[]));
}finally{await context?.close();await browser.close();await app.stop();rmSync(profile,{recursive:true,force:true});}
process.exit(summary('Demo-Kennzeichnung und bewusste Tresorwahl'));
