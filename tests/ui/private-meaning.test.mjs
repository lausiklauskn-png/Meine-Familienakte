// Real built Family UI, original-file reader and IndexedDB. Device/download
// methods and e5 output are fixtures here; real models are measured separately.
import {readFileSync} from 'node:fs';
import {startApp,launchBrowser,DESKTOP,ready,footer,internetAn,step,check,summary,ROOT} from './_harness.mjs';
import {capacitorStub} from './_capacitor-stub.mjs';
const models=JSON.parse(readFileSync(`${ROOT}/public/native/meaning-models.json`)).models;
const app=await startApp(),browser=await launchBrowser();
try {
  const context=await browser.newContext({...DESKTOP,serviceWorkers:'block'});
  await context.addInitScript(capacitorStub);
  await context.addInitScript(({models})=>{
    const calls=window.__meaningProbe={measure:0,installs:[],embeds:[],workers:0,badDimension:false};
    const saved=()=>JSON.parse(localStorage.getItem('fixture-meaning-installed')||'[]');
    const state=()=>({localAssets:true,models:Object.fromEntries(Object.entries(models).map(([stage,m])=>[stage,{...m,installed:saved().includes(stage),running:false,present:saved().includes(stage)?1048576:0,total:1048576,done:0,error:'',source:''}]))});
    window.Capacitor.Plugins.ProDevice={measure:async()=>{calls.measure++;return {platform:'android',ramBytes:16*1073741824,cores:8,freeBytes:10*1073741824,gpu:[]};}};
    window.Capacitor.Plugins.FamilyModels={getState:async()=>state(),install:async({stage})=>{
      if(window.__capState.offline)throw Error('APP_OFFLINE');calls.installs.push(stage);localStorage.setItem('fixture-meaning-installed',JSON.stringify([...new Set([...saved(),stage])]));return state();
    },cancel:async()=>state(),remove:async({stage})=>{localStorage.setItem('fixture-meaning-installed',JSON.stringify(saved().filter(s=>s!==stage)));return state();}};
    const RealWorker=window.Worker;
    window.Worker=class {
      constructor(url,options){if(!String(url).includes('familienakte-meaning-worker'))return new RealWorker(url,options);calls.workers++;this.stopped=false;}
      terminate(){this.stopped=true;}
      postMessage(request){queueMicrotask(()=>{
        if(this.stopped)return;
        if(request.kind==='init'){this.model=request.model;this.onmessage?.({data:{id:request.id,ok:{model:this.model}}});return;}
        calls.embeds.push(request.text);
        const vector=new Float32Array(calls.badDimension?17:this.model.dim);vector[/Wasch|Nebenkosten|Miete/i.test(request.text)?0:1]=1;
        this.onmessage?.({data:{id:request.id,ok:{model:this.model,vector}}});
      });}
    };
  },{models});
  const outside=[];await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{outside.push(route.request().url());return route.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(app.base);await ready(page);
  await step('Start lädt kein Modell, misst nicht und baut keinen privaten Index',async()=>page.evaluate(()=>window.__meaningProbe.workers===0&&window.__meaningProbe.measure===0&&window.__meaningProbe.installs.length===0));
  await footer(page,'Sicherheitscenter');
  const panel=page.locator('.private-meaning');await panel.getByRole('button',{name:'Gerät, Modelle und Suchindex',exact:true}).click();
  await step('Geräteprüfung erfolgt auf Befehl über vorhandenen ProDevice-Baustein',async()=>{
    await panel.getByRole('button',{name:'Dieses Gerät prüfen',exact:true}).click();
    await panel.getByText(/Rechenprobe.*Quelle: android/).waitFor();
    return page.evaluate(()=>window.__meaningProbe.measure===1&&window.__meaningProbe.installs.length===0);
  });
  await step('Ausgeschaltetes Internet verhindert den Download mit verständlicher Meldung',async()=>{
    await panel.getByRole('button',{name:'Gewähltes Modell laden / fortsetzen',exact:true}).click();
    await panel.getByRole('status').filter({hasText:'Internet für die App ist aus'}).waitFor();
    return page.evaluate(()=>window.__meaningProbe.installs.length===0&&window.__meaningProbe.workers===0);
  });
  await internetAn(page);
  await step('Nur das bewusst gewählte Modell wird geladen; Index bleibt getrennt',async()=>{
    await panel.locator('select').selectOption('mittel');
    await panel.getByRole('button',{name:'Gewähltes Modell laden / fortsetzen',exact:true}).click();
    await panel.getByText(/Modell vollständig abgelegt/).waitFor();
    return page.evaluate(()=>window.__meaningProbe.installs.join(',')==='mittel'&&window.__meaningProbe.workers===0);
  });
  await step('Sichtbarer Indexknopf liest vorhandene Unterlagen und aktiviert den privaten Index',async()=>{
    await panel.getByRole('button',{name:'Index aufbauen / fortsetzen',exact:true}).click();
    await panel.getByRole('status').filter({hasText:'Suchindex bereit:'}).waitFor({timeout:120000});
    return page.evaluate(()=>window.__meaningProbe.workers===1&&window.__meaningProbe.embeds.some(t=>t.startsWith('passage: ')));
  });
  await step('Bedeutungssuche funktioniert mit Internet aus und zeigt echte Aktenziele',async()=>{
    await page.click('.netz-schalter');await page.waitForSelector('.netz-schalter[data-netz="aus"]');
    await panel.getByLabel('Wonach suchst du?').fill('Waschautomat');
    await panel.getByRole('button',{name:'Nach Bedeutung suchen',exact:true}).click();
    await panel.locator('.search-results button').first().waitFor();
    return await page.evaluate(()=>window.__meaningProbe.embeds.includes('query: Waschautomat'))&&await panel.locator('.search-results button').count()>0;
  });
  await step('Gefundene Unterlage lässt sich aus dem Sicherheitscenter öffnen',async()=>{
    await panel.locator('.search-results button').first().click();
    await page.waitForFunction(()=>!document.querySelector('.private-meaning'));
    return true;
  });
  await page.reload();await ready(page);await footer(page,'Sicherheitscenter');
  await panel.getByRole('button',{name:'Gerät, Modelle und Suchindex',exact:true}).click();
  await step('Kaltstart verwendet den vorhandenen Index mit dessen Modell',async()=>{
    await panel.getByLabel('Wonach suchst du?').fill('Nebenkosten');
    await panel.getByRole('button',{name:'Nach Bedeutung suchen',exact:true}).click();
    await panel.locator('.search-results button').first().waitFor();
    return page.evaluate(()=>window.__meaningProbe.installs.length===0&&window.__meaningProbe.embeds.every(t=>t.startsWith('query: ')));
  });
  await step('Neue Modellstufe mit falscher Vektordimension ersetzt keinen nutzbaren Index',async()=>{
    await internetAn(page);await panel.locator('select').selectOption('gross');
    await panel.getByRole('button',{name:'Gewähltes Modell laden / fortsetzen',exact:true}).click();await panel.getByText(/Modell vollständig abgelegt/).waitFor();
    await page.evaluate(()=>window.__meaningProbe.badDimension=true);await panel.getByRole('button',{name:'Index aufbauen / fortsetzen',exact:true}).click();
    await panel.getByRole('status').filter({hasText:'Der private Suchindex konnte nicht'}).waitFor();
    await page.evaluate(()=>window.__meaningProbe.badDimension=false);
    await panel.getByRole('button',{name:'Nach Bedeutung suchen',exact:true}).click();await panel.locator('.search-results button').first().waitFor();return true;
  });
  await step('Modellwahl und Ergebnisliste passen in ein schmales Fenster',async()=>{await page.setViewportSize({width:390,height:844});return page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);});
  check(outside.length===0,'Keine externe Anfrage bei privatem Aufbau oder Suche',outside.join(',').slice(0,200));
  check(errors.length===0,'Keine unbehandelten Seitenfehler',errors.join(' | '));
} finally {await browser.close();await app.stop();}
process.exit(summary('Private Aktensuche – echte Oberfläche, Modellvektoren gestellt'));
