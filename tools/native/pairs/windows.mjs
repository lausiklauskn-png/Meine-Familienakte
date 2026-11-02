// Two separately installed products, native engines, a real shared folder and
// their ordinary durable inboxes. No actor sends or acknowledges either side.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as pause} from 'node:timers/promises';
import {adb,chooseFolder,saveFile,password as androidPassword} from './android-ui.mjs';
const android=process.env.PAIR_ANDROID==='1';
const partner=process.argv[2],out=resolve('work/pair-proof'),PASSWORD='Pair-Probe-2026-only';
assert.ok(['workflow-pdf-pro','private-brain','bookledgerpro'].includes(partner));
const report={partner,kind:android?'Two installed Android APKs, API 35 emulator, actual SAF picker; no physical user device':'Two NSIS-installed Windows apps on CI; no physical user device',checks:[],errors:[]};
const apps={},port=partner==='workflow-pdf-pro'?9222:9223;
await mkdir(out,{recursive:true});
const packages={family:'de.familyprojekt.familienakte',peer:partner==='private-brain'?'de.familyprojekt.privatebrain.pro.preview.debug':partner==='workflow-pdf-pro'?'de.familyprojekt.workflowpdf.pro.debug':'de.familyprojekt.bookledgerpro.debug'};
const activities={};
async function activate(which){if(android){
 // Debug APK IDs differ from production, while MainActivity keeps its Java
 // namespace. Resolve the installed launch activity instead of guessing it.
 if(!activities[which]){
  activities[which]=adb('shell','cmd','package','resolve-activity','--brief','-a','android.intent.action.MAIN','-c','android.intent.category.LAUNCHER',packages[which]).trim().split(/\r?\n/).at(-1);
  assert.ok(activities[which].startsWith(packages[which]+'/'),'Installed launcher for '+packages[which]);
 }
 adb('shell','am','start','-W','-n',activities[which]);
}}
const pass=message=>{report.checks.push(message);console.log('PASS '+message);};
async function until(check,label){
 const end=Date.now()+45000;
 do{if(await check())return;await pause(250);}while(Date.now()<end);
 assert.fail('Actual state did not arrive: '+label);
}
async function start(which){
 const endpoint=which==='family'?9333:port;
 let proc;
 if(android){
  await activate(which);let pid='';for(let i=0;i<30&&!pid;i++){pid=adb('shell','pidof',packages[which]).trim();if(!pid)await pause(500);}
  assert.match(pid,/^\d+$/);adb('forward','tcp:'+endpoint,'localabstract:webview_devtools_remote_'+pid);
 } else {
 const env={...process.env,WEBVIEW2_USER_DATA_FOLDER:join(process.env.PAIR_PROFILE_ROOT,which+'-profile')};
 if(which==='family')env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9333';
 proc=spawn(which==='family'?process.env.PAIR_FAMILY_EXE:process.env.PAIR_PARTNER_EXE,[],{env,stdio:'ignore'});
 }
 const state=apps[which]={proc};let last;
 for(let i=0;i<120;i++){
  // Android WebView has no Browser.setDownloadBehavior/context management.
  // Attach without desktop context overrides; all file output stays native.
  try{state.browser=await chromium.connectOverCDP('http://127.0.0.1:'+endpoint,{timeout:1500,noDefaults:android});break;}catch(e){last=e;await pause(500);}
 }
 assert.ok(state.browser,String(last));
 for(let i=0;i<120;i++){
  state.page=state.browser.contexts().flatMap(c=>c.pages()).find(p=>/^https:\/\/(?:tauri\.)?localhost\/(index\.html)?([?#].*)?$/.test(p.url()));
  if(state.page)break;
  // WebView2 can publish its page after CDP has connected.
  if(i===20){await state.browser.close();state.browser=await chromium.connectOverCDP('http://127.0.0.1:'+endpoint,{noDefaults:android});}
  await pause(500);
 }
 assert.ok(state.page,'Installed main window '+which);
 state.page.on('pageerror',e=>report.errors.push(which+': '+e.message));state.page.setDefaultTimeout(45000);
 if(which==='family')await state.page.waitForSelector('.sample-data-notice strong',{timeout:120000});
 else if(partner==='workflow-pdf-pro')await state.page.waitForFunction(()=>window.WFPProTransfers&&window.WFP?.DB&&!window.WFPNativeVault?.gate.blocked,null,{timeout:120000});
 else if(partner==='private-brain')await state.page.waitForFunction(()=>window.PBProVerbund&&window.PBWorkspace,null,{timeout:120000});
 else await state.page.waitForFunction(()=>window.BLPNative?.tresor,null,{timeout:120000});
 return state.page;
}
async function stop(which){const a=apps[which];if(!a)return;await a.browser?.close().catch(()=>{});try{if(android)adb('shell','am','force-stop',packages[which]);else execFileSync('taskkill',['/PID',String(a.proc.pid),'/T','/F'],{stdio:'ignore'});}catch{/* already stopped */}delete apps[which];await pause(1000);}
const fp=()=>apps.family.page,pp=()=>apps.peer.page;
const footer=async name=>{await activate('family');return fp().locator('.footer-directory button',{hasText:name}).click();};
const familyRows=()=>fp().evaluate(async()=>{const r=indexedDB.open('FamilienakteStapel1'),db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});try{return await new Promise((ok,no)=>{const t=db.transaction('uebergaben'),q=t.objectStore('uebergaben').getAll();t.oncomplete=()=>ok(q.result);t.onabort=()=>no(t.error);});}finally{db.close();}});
async function swing(kind,value){if(android)return kind==='folder'?chooseFolder():androidPassword(value);await new Promise((ok,no)=>{const p=spawn('pwsh.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File','tools/native/pairs/family-dialog.ps1','-Kind',kind,'-Value',value],{stdio:'inherit'});p.on('error',no);p.on('exit',c=>c===0?ok():no(Error('Native dialog failed: '+kind)));});}
async function connectFamily(first){
 await footer('Sicherheitscenter');const panel=fp().locator('[data-pro-tresor]');
 if(first){await panel.getByRole('button',{name:'Vorhandenen Pro-Tresor verbinden …',exact:true}).click();await swing('folder',process.env.PAIR_VAULT);}
 else await panel.getByRole('button',{name:'Pro-Tresor entsperren …',exact:true}).click();
 await swing('password',PASSWORD);await panel.getByRole('status').filter({hasText:/^Entsperrt$/}).waitFor();
 const state=await fp().evaluate(()=>window.Capacitor.Plugins.FamilienakteTresor.zustand());assert.equal(state.status,'offen');return state.id;
}
async function peerPassword(){
 if(android){await chooseFolder();await androidPassword(PASSWORD);return;}
 let d;for(let i=0;i<120;i++){d=apps.peer.browser.contexts().flatMap(c=>c.pages()).find(p=>/\/windows\/(kennwort.html|dialog\/index.html)/.test(p.url()));if(d)break;await pause(250);}assert.ok(d,'Actual native password window');
 if(partner==='workflow-pdf-pro'){await d.locator('#erstes').fill(PASSWORD);if(await d.locator('#zweites').isVisible())await d.locator('#zweites').fill(PASSWORD);if(await d.locator('#hinweis').isVisible())await d.locator('#hinweis').check();await d.locator('#merken').check();await d.locator('#weiter').click();}
 else {await d.locator('#password').fill(PASSWORD);if(await d.locator('#remember').isVisible())await d.locator('#remember').check();await d.locator('#submit').click();}
}
async function connectPeer(first){
 if(partner==='bookledgerpro'){
  // Ordinary onboarding/login must finish so the shell subscribes to route
  // changes. Calling setupVault alone leaves the app at its intro screen.
  await pp().locator('.intro-screen, .lock-form').first().waitFor();
  if(await pp().locator('.intro-screen').count()){
   const intro=pp().locator('.intro-screen');await intro.locator('input[type="checkbox"]').check();await intro.getByRole('button',{name:'Zur Anmeldung',exact:true}).click();
  }
  if(first){
   const form=pp().locator('.lock-form');await form.locator('input[type="password"]').nth(0).fill(PASSWORD);await form.locator('input[type="password"]').nth(1).fill(PASSWORD);await form.locator('button[type="submit"]').click();
   await pp().locator('.share-code').first().waitFor();const shares=await pp().locator('.share-code').allTextContents();assert.equal(shares.length,3);
   await writeFile(join(tmpdir(),'pair-invented-blp-recovery.txt'),shares.join('\n'),{mode:0o600});
   await pp().getByRole('button',{name:'Anteile gesichert – weiter',exact:true}).click();await pp().getByRole('button',{name:'Privat',exact:true}).click();
   await pp().getByRole('button',{name:'Verschlüsseltes Backup herunterladen',exact:true}).click();
   if(android)await saveFile();
   await pp().getByText(/^Gespeichert: /).waitFor();await pp().getByRole('button',{name:"Los geht's",exact:true}).click();
  }else{await pp().locator('.lock-form input[autocomplete="current-password"]').fill(PASSWORD);await pp().locator('.lock-form button[type="submit"]').click();}
  await pp().locator('.app #content').waitFor();
 }
 if(first){
  await pp().evaluate(async partner=>{
   window.__pairConnection=null;const promise=(async()=>{
   if(partner==='workflow-pdf-pro')return window.Capacitor.Plugins.WorkflowVault.tresorVerbinden({language:'de',neuWaehlen:true});
   else if(partner==='private-brain')return window.Capacitor.Plugins.ProVault.tresorEinziehen({nurVerbinden:true});
   else {await window.BLPNative.tresor.ordnerWaehlen();return window.BLPNative.tresor.entsperren(true);}
   })();
   void promise.then(value=>window.__pairConnection={value},error=>window.__pairConnection={error:String(error)});
  },partner);
  await peerPassword();await pp().waitForFunction(()=>window.__pairConnection,null,{timeout:120000});const result=await pp().evaluate(()=>window.__pairConnection);assert.equal(result.error,undefined);assert.equal(result.value.offen,true);
 }
 const state=await pp().evaluate(async partner=>partner==='workflow-pdf-pro'?window.Capacitor.Plugins.WorkflowVault.tresorZustand({}):partner==='private-brain'?window.Capacitor.Plugins.ProVault.tresorZustand({}):window.BLPNative.tresor.zustand(),partner);
 assert.equal(state.offen,true);return state.kennung;
}
async function sendFamily(index){
 await footer('Dokumentenbibliothek');
 const cards=fp().locator('.library-document-card').filter({has:fp().getByRole('button',{name:'An Pro-App geben …',exact:true})}).filter({has:fp().locator('.library-document-title').filter({hasText:/\.pdf$/i})});
 const position=await cards.nth(index).evaluate(e=>[...document.querySelectorAll('.library-document-card')].indexOf(e));
 // The closed chooser button disappears after opening. Keep the selected
 // document, rather than re-evaluating a filter for that now absent button.
 // Example documents can share a title. The ordinary library UI probe uses
 // the chosen card's absolute position for this reason, too.
 const card=fp().locator('.library-document-card').nth(position),name=await card.locator('.library-document-title').innerText();
 await card.getByRole('button',{name:'An Pro-App geben …',exact:true}).click();await card.locator('select').selectOption(partner);
 for(let n=0;n<2;n++){await card.getByRole('button',{name:'Ausgewählte Unterlage weitergeben',exact:true}).click();await card.getByRole('button',{name:'Ausgewählte Unterlage weitergeben',exact:true}).waitFor();await fp().getByText('An '+({'workflow-pdf-pro':'Workflow PDF Pro','private-brain':'Private Brain Pro',bookledgerpro:'BookLedgerPro'}[partner])+' weitergegeben.',{exact:false}).first().waitFor();}
 const rows=(await familyRows()).filter(r=>r.typ==='ausgang'&&r.vertrag.ziel===partner&&r.vertrag.name===name);assert.equal(rows.length,1);assert.equal(rows[0].stand,'weitergegeben');return rows[0];
}
async function receivePeer(source){
 await activate('peer');
 if(partner==='workflow-pdf-pro'){
  await pp().evaluate(()=>window.WFPProVerbund.dialog());await pp().locator(`[data-pro-entry="${source.entryId}"] input`).check();await pp().click('#nativeProVerbund [data-pro-action="receive"]');await pp().waitForFunction(()=>document.querySelector('#nativeProVerbund [data-pro-status]')?.textContent.includes('Auswahl gespeichert'));await pp().click('#nativeProVerbund [data-pro-action="close"]');
 }else if(partner==='private-brain'){
  const received=await pp().evaluate(()=>window.PBProVerbund.receive());assert.equal(received.failed,0);assert.equal(received.imported,1);
 }else {
  await pp().evaluate(async()=>{const {navigate}=await import('/src/state.js');navigate('tresorordner');});
  const row=pp().locator(`[data-tresor-eintrag="${source.entryId}"]`);await row.first().waitFor();await row.first().locator('[data-tresor-uebernehmen]').click();
  // Navigation happens only after saved bytes and the native receipt. An
  // async waitForFunction predicate can resolve its Promise(false) once
  // instead of polling, so wait for the actual completed UI state.
  await pp().locator('[data-nav="documents"][aria-current="page"]').waitFor();
 }
 const saved=await peerSaved(source);assert.equal(saved.count,1);assert.equal(saved.sha256,source.vertrag.sha256);return saved;
}
async function peerSaved(source){return pp().evaluate(async({partner,source})=>{
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes instanceof Blob?await bytes.arrayBuffer():bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(partner==='workflow-pdf-pro'){
  const rows=(await window.WFPProTransferStore.snapshot()).filter(r=>r.kind==='eingang'&&r.source.transfer===source.vertrag.id);const original=await window.WFP.DB.get('files',rows[0]?.docId+'~original');return {count:rows.length,id:rows[0]?.docId,sha256:await hash(original.bytes)};
 }if(partner==='private-brain'){
  const rows=(await window.PBProVerbund.receipts()).filter(r=>r.kind==='eingang'&&r.vertrag.id===source.vertrag.id&&r.stand==='gespeichert');const bytes=await window.PBOriginals.verifyStored(source.vertrag.sha256,source.vertrag.groesse);return {count:rows.length,id:rows[0]?.hashes[0],sha256:await hash(bytes)};
 }
 const docs=await import('/src/domain/documents.js'),rows=(await docs.listBelege()).filter(r=>r.proUebergabe?.id===source.vertrag.id);
 if(rows.length!==1||!rows[0].id)throw Error('Expected one actual BLP receipt for '+source.vertrag.id+', got '+JSON.stringify(rows));
 return {count:rows.length,id:rows[0].id,sha256:await hash(await docs.getBelegBytes(rows[0].id))};
 },{partner,source});}
async function familyConfirm(source){
 await footer('Sicherheitscenter');const p=fp().locator('[data-pro-verbund]');
 const line=p.locator('div').filter({has:fp().locator('p').filter({hasText:source.vertrag.name+' →'})}).filter({has:fp().getByRole('button',{name:'Zielbestätigung prüfen',exact:true})}).last();
 await line.getByRole('button',{name:'Zielbestätigung prüfen',exact:true}).click();
 await until(async()=>(await familyRows()).find(r=>r.id===source.id)?.stand==='im-eingang','Family durable receipt '+source.id);
}
async function returnEdited(source,saved){
 await activate('peer');
 if(partner==='workflow-pdf-pro'){
  await pp().evaluate(id=>{window.__pairShare={};void window.__wfpdf.dlg.teilenDocs([id]).then(()=>window.__pairShare.done=true,e=>window.__pairShare.error=String(e));},saved.id);
  await pp().click('#nativeProTarget [data-pro-action="familienakte"]');await pp().waitForSelector('#nativeProTarget',{state:'detached'});
  return (await pp().evaluate(()=>window.WFPProTransfers.outbox())).at(-1);
 }
 return pp().evaluate(async({partner,source,saved})=>{
  let bytes;
  if(partner==='private-brain')bytes=await window.PBOriginals.verifyStored(source.vertrag.sha256,source.vertrag.groesse);
  else bytes=await (await import('/src/domain/documents.js')).getBelegBytes(saved.id);
  // An invented PDF edit. The product sends it through its normal adapter.
  const file=new File([bytes,'\n% Bearbeitete Pair-Probe 2026\n'],'Antwort-'+source.vertrag.name,{type:'application/pdf'});
  if(partner==='private-brain')return window.PBProVerbund.send(file,saved.id,'familienakte');
  return (await import('/src/core/proVerbund.js')).proSenden(window.BLPNative.tresor,file,saved.id,'familienakte',source.vertrag.id);
 },{partner,source,saved});
}
async function peerConfirm(back){return pp().evaluate(async({partner,back})=>{
 if(partner==='workflow-pdf-pro')return window.WFPProTransfers.confirm(back.id);
 if(partner==='private-brain'){await window.PBProVerbund.confirm();return (await window.PBProVerbund.receipts()).find(r=>r.id===back.id);}
 return (await import('/src/core/proVerbund.js')).proBestaetigung(window.BLPNative.tresor,back);
 },{partner,back});}
try{
 await start('family');const vault=await connectFamily(true),first=await sendFamily(0);
 assert.equal((await fp().evaluate(async a=>window.Capacitor.Plugins.FamilienakteTresor.uebergabeStand({vaultId:a.vaultId,ziel:a.vertrag.ziel,entryId:a.entryId}),first)).bestaetigt,false);
 pass('Family UI sends exactly one selected PDF twice with one stable ID; target app has never started and no receipt exists');
 await stop('family');await start('family');await connectFamily(false);assert.equal((await familyRows()).find(r=>r.id===first.id).vertrag.id,first.vertrag.id);
 await start('peer');assert.equal(await connectPeer(true),vault);const received=await receivePeer(first);await familyConfirm(first);
 pass('Cold-started partner commits exact original in its ordinary library; only then does actual Family confirm');
 const second=await sendFamily(1);await receivePeer(second);await familyConfirm(second);
 pass('Warm target receives another selected PDF; both independent originals remain available');
 await stop('peer');await start('peer');assert.equal(await connectPeer(false),vault);assert.deepEqual(await peerSaved(first),received);
 pass('Partner process restart preserves document bytes and a single durable receipt');
 const back=await returnEdited(first,received);assert.equal(back.vertrag.bezug,first.vertrag.id);assert.equal(back.stand,'weitergegeben');assert.equal((await peerConfirm(back)).stand,'weitergegeben');
 pass('Partner returns a chosen PDF version with source relation; still open before Family acceptance');
 await stop('family');await start('family');await connectFamily(false);
 // Real native negative case: a forged digest must not acknowledge the return.
 const refused=await fp().evaluate(async a=>window.Capacitor.Plugins.FamilienakteTresor.uebergabeQuittieren({vaultId:a.vaultId,entryId:a.entryId,sha256:'0'.repeat(64)}).then(()=>false,()=>true),back);assert.equal(refused,true);assert.equal((await peerConfirm(back)).stand,'weitergegeben');
 const panel=fp().locator('[data-pro-verbund]');await panel.getByRole('button',{name:'Pro-Eingang prüfen',exact:true}).click();await panel.getByRole('button',{name:'In Familienakte-Eingang aufnehmen',exact:true}).click();await panel.getByRole('status').filter({hasText:'Dauerhaft im Eingang aufgenommen'}).waitFor();
 const records=(await familyRows()).filter(r=>r.vertrag?.id===back.vertrag.id&&r.quittung);assert.equal(records.length,1);assert.equal(records[0].quittung.sha256,back.vertrag.sha256);assert.equal((await peerConfirm(back)).stand,'im-eingang');
 pass('Cold Family inbox rejects forged confirmation, durably takes the actual return, and only then the installed sender confirms');
 await activate('family');await fp().screenshot({path:join(out,'family-'+partner+'.png'),fullPage:true});await activate('peer');await pp().screenshot({path:join(out,partner+'.png'),fullPage:true});
 assert.deepEqual(report.errors,[]);report.complete=true;
}catch(error){report.failure=String(error.stack||error);console.error(error);for(const [key,a] of Object.entries(apps)){report[key+'Body']=await a.page?.locator('body').innerText().catch(()=>null);await a.page?.screenshot({path:join(out,'failure-'+key+'.png'),fullPage:true}).catch(()=>{});}process.exitCode=1;}
finally{await writeFile(join(out,'pair.json'),JSON.stringify(report,null,2)+'\n');for(const key of Object.keys(apps))await stop(key);}
