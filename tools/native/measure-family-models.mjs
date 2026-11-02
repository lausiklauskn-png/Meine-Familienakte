// Integration probe: the production Java downloader, production model worker
// and real IndexedDB index, with invented documents. No private user data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {resolve,join,extname,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';
import {chromium} from 'playwright';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const data=resolve(process.argv[2]||join(root,'work/meaning-model-probe'));
await mkdir(data,{recursive:true});
execFileSync(process.execPath,['windows/tools/build-pro-tresor.mjs','--nur-jar'],{cwd:root,stdio:'inherit'});
const pins=JSON.parse(await readFile(join(root,'public/native/meaning-models.json'),'utf8'));
const runtime=join(root,'windows/src-tauri/pro-tresor');
const engine=spawn('java',['-Xmx256m','-Djava.awt.headless=true','-cp',['familienakte-tresor.jar','json-20250517.jar'].join(delimiter),'de.familyprojekt.privatebrain.pro.FamilyModelsEngine',join(data,'models')],{cwd:runtime,stdio:['pipe','pipe','inherit']});
const pending=[];
createInterface({input:engine.stdout}).on('line',line=>{const p=pending.shift();if(!p)return;try{const r=JSON.parse(line);if(r.error)p.reject(Error(r.error));else p.resolve(r.ok);}catch(e){p.reject(e);}});
engine.on('exit',code=>{for(const p of pending.splice(0))p.reject(Error('Model engine exited: '+code));});
const call=message=>new Promise((resolve,reject)=>{pending.push({resolve,reject});engine.stdin.write(JSON.stringify(message)+'\n');});
const types={'.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.onnx':'application/octet-stream'};
const missing=[];
const server=createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://local').pathname;
  if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Private Aktensuche – Modellprobe</title>');return;}
  if(path==='/index.js'){res.setHeader('Content-Type','text/javascript');res.end(transpileModule(await readFile(join(root,'app/private-meaning-index.ts'),'utf8'),{compilerOptions:{target:ScriptTarget.ES2022,module:ModuleKind.ESNext}}).outputText);return;}
  let file;
  if(path==='/worker.js')file=join(root,'public/native/familienakte-meaning-worker.js');
  else {
   const match=/^\/_fa_models\/(klein|mittel|gross)\/(.+)$/.exec(path);if(!match)throw Error('Not found');
   file=(await call({method:'asset',stage:match[1],path:match[2]})).path;
  }
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':(await stat(file)).size,'Cache-Control':'no-store'});createReadStream(file).pipe(res);
 } catch(e){missing.push([req.url,String(e)]);res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const texts=[
 'Rechnung der Zahnarztpraxis: professionelle Zahnreinigung und eine Füllung, Gesamtbetrag 214,50 Euro, zahlbar in 14 Tagen.',
 'Mietvertrag für die Wohnung im zweiten Stock, Kaltmiete 780 Euro, Nebenkostenvorauszahlung 190 Euro, Kaution drei Monatsmieten.',
 'Ihre Kfz-Haftpflicht und Teilkasko für das Fahrzeug mit dem Kennzeichen B-XY 123: Jahresbeitrag 612 Euro ab dem 1. Januar.',
 'Buchungsbestätigung: zwei Wochen Ferienhaus am Gardasee in Italien, Anreise 3. August, Abreise 17. August.',
 'Arztbrief der Hausarztpraxis: Blutbild unauffällig, Cholesterin leicht erhöht, Kontrolle in sechs Monaten empfohlen.',
 'Hiermit kündige ich meine Mitgliedschaft im Fitnessstudio fristgerecht zum Ende der Vertragslaufzeit.',
 'Stromabrechnung 2025: Verbrauch 2.430 Kilowattstunden, Nachzahlung 86 Euro, neuer Abschlag 72 Euro im Monat.',
 'Zeugnis der Grundschule: Deutsch gut, Mathematik sehr gut, Sachunterricht gut, Verhalten lobenswert.'
];
const questions=[['Was hat die Behandlung beim Zahnarzt gekostet?',0],['Wie hoch ist die Miete für die Wohnung?',1],['Was zahle ich für die Autoversicherung?',2],['Wann fahren wir in den Urlaub nach Italien?',3],['Wie waren meine Laborwerte?',4],['Sportstudio Vertrag beenden',5],['Wie viel Strom haben wir verbraucht?',6],['Noten meines Kindes',7],['How much was the dentist bill?',0],['When is our holiday at the lake?',3]];
const report={run:process.env.GITHUB_RUN_ID||'local',commit:process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),environment:'Headless Chromium, production Family Java downloader (256 MiB heap), worker and IndexedDB; invented documents; no physical device',stages:{}};
let browser;
try {
 assert.equal((await call({method:'getState'})).models.klein.dim,384);
 await assert.rejects(call({method:'install',stage:'klein'}),/APP_OFFLINE/);
 for(const stage of Object.keys(pins.models)) {
  const before=performance.now();await call({method:'network',offline:false});await call({method:'install',stage});
  let state;
  const deadline=Date.now()+12*60*1000;
  do {await pause(1000);state=(await call({method:'getState'})).models[stage];if(Date.now()>deadline)throw Error('Model download deadline: '+stage);}while(state.running);
  assert.equal(state.error,'',stage+' download failed: '+state.error);assert.equal(state.installed,true,stage+' not installed');
  const downloadMs=Math.round(performance.now()-before);await call({method:'network',offline:true});
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--enable-precise-memory-info']});
  const context=await browser.newContext({serviceWorkers:'block'}),outside=[],errors=[],page=await context.newPage();
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():(outside.push(route.request().url()),route.abort()));
  page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
  const session=await browser.newBrowserCDPSession();let rendererPeakKiB=0,sampling=false;
  const timer=setInterval(async()=>{if(sampling)return;sampling=true;try{const ps=await session.send('SystemInfo.getProcessInfo'),ids=ps.processInfo.filter(p=>p.type==='renderer').map(p=>String(p.id));if(ids.length){const rss=execFileSync('ps',['-o','rss=','-p',ids.join(',')],{encoding:'utf8'}).trim().split(/\s+/).map(Number).reduce((a,b)=>a+b,0);rendererPeakKiB=Math.max(rendererPeakKiB,rss);}}catch{/* Non-Linux runners report memory as unavailable. */}finally{sampling=false;}},250);
  let result;
  try {result=await page.evaluate(async({stage,model,texts,questions})=>{
   const index=await import('/index.js'),worker=new Worker('/worker.js'),pending=new Map();let id=0;
   worker.onmessage=({data})=>{const p=pending.get(data.id);pending.delete(data.id);if(data.error)p.reject(Error(data.error));else p.resolve(data.ok);};
   worker.onerror=()=>{for(const p of pending.values())p.reject(Error('Worker crashed'));pending.clear();};
   const call=data=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});worker.postMessage({...data,id:n});});
   try {
    const started=performance.now();await call({kind:'init',stage,model});const loadMs=Math.round(performance.now()-started);
    const embed=async text=>{const r=await call({kind:'embed',text});if(r.model.id!==model.id||r.model.revision!==model.revision||r.vector.length!==model.dim)throw Error('Wrong model identity');return r.vector;};
    const scope='invented-model-comparison',documents=texts.map((text,n)=>({id:String(n),text}));
    const t=performance.now();await index.buildMeaningIndex({scope,model,read:async()=>documents,currentScope:()=>scope,embed});const msPerSection=Math.round((performance.now()-t)/documents.length);
    const rankings=[];
    for(const [query,expected] of questions){const r=await index.searchMeaningIndex({scope,documents,query,currentScope:()=>scope,embed});rankings.push({expected,actual:Number(r.hits[0]?.id),margin:Number(((r.hits[0]?.score||0)-(r.hits[1]?.score||0)).toFixed(4))});}
    const wrong=await index.searchMeaningIndex({scope:'other-vault',documents,query:questions[0][0],currentScope:()=>'other-vault',embed});if(wrong.hits.length)throw Error('Other vault leaked');
    return {loadMs,msPerSection,dim:model.dim,correct:rankings.filter(r=>r.actual===r.expected).length,total:questions.length,rankings};
   } finally {worker.terminate();}
  },{stage,model:pins.models[stage],texts,questions});}finally{clearInterval(timer);}
  const measured=report.stages[stage]={...result,downloadMs,storedBytes:state.present,rendererPeakMiB:rendererPeakKiB?Math.round(rendererPeakKiB/1024):null,outsideRequests:outside,errors};
  console.log('FAMILY-MODEL '+stage+' '+JSON.stringify(measured));
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);assert.equal(result.correct,questions.length,'Invented retrieval regression: '+stage);
  await browser.close();browser=null;
 }
 assert.deepEqual(missing,[],'Missing or disallowed local model assets');
 report.complete=true;
} finally {
 await writeFile(join(data,'family-model-measured.json'),JSON.stringify(report,null,2)+'\n');
 await browser?.close();engine.stdin.end();server.close();
}
