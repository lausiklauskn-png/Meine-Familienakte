import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {CONFIG,train,prepare,predict,removeCompanies} from "./klassifikator.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash("sha256").update(read(p)).digest("hex");
const save=(p,obj,pretty=true)=>fs.writeFileSync(path.join(ROOT,p),JSON.stringify(obj,null,pretty?2:0)+"\n");
const ensure=(ok,msg)=>{if(!ok)throw Error(msg)};
const accounts=json("KONTENLISTE.json").map(x=>x.konto);
const known=new Set(accounts);
const sets=["A","B","C"].map(x=>"LEHRDATEN/AGENT-"+x+".json");
const modelFile=mode=>"SYSTEM/modell-"+(mode?"mit":"ohne")+"-firmennamen.json";
const resultFile=(stack,mode)=>"VORHERSAGEN-"+stack+(mode?"":"-OHNE-FIRMENNAME")+".json";
function validateRows(rows,label){
 ensure(rows.length===new Set(rows.map(r=>r.datei)).size,"Doppelte Dateien "+label);
 for(const r of rows){
  ensure(known.has(r.konto),"Unbekanntes Konto "+label+" "+r.datei);
  ensure(["einnahme","ausgabe"].includes(r.richtung),"Richtung "+r.datei);
  ensure(typeof r.text==="string"&&r.text.length>=150,"Text "+r.datei);
  ensure(Array.isArray(r.namen)&&Array.isArray(r.firmennamen),"Namenslisten "+r.datei);
  for(const n of r.firmennamen)ensure(n&&r.namen.includes(n)&&r.text.includes(n),"Firmenname "+r.datei+" "+n);
 }
}
function wilson(correct,n){
 if(!n)return null;
 const z=1.959963984540054,p=correct/n,d=1+z*z/n;
 const c=(p+z*z/(2*n))/d,h=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;
 return {lower:c-h,upper:c+h,level:0.95};
}
function scoreRows(gold,pred){
 const pm=new Map(pred.map(r=>[r.datei,r.konto]));
 ensure(pm.size===pred.length&&pred.length===gold.length,"Vorhersageumfang");
 const details=gold.map(g=>{ensure(pm.has(g.datei),"Fehlende Vorhersage "+g.datei);return {datei:g.datei,soll:g.konto,ist:pm.get(g.datei),richtig:g.konto===pm.get(g.datei)};});
 const correct=details.filter(x=>x.richtig).length;
 const perClass=accounts.map(k=>{const rows=details.filter(x=>x.soll===k);return {konto:k,n:rows.length,richtig:rows.filter(x=>x.richtig).length,trefferquote:rows.length?rows.filter(x=>x.richtig).length/rows.length:null};});
 const covered=perClass.filter(x=>x.n);
 const confusion=new Map();
 for(const row of details.filter(x=>!x.richtig)){const key=row.soll+" → "+row.ist;confusion.set(key,(confusion.get(key)||0)+1);}
 return {n:gold.length,richtig:correct,trefferquote:correct/gold.length,wilson95:wilson(correct,gold.length),
  makroRecall:covered.reduce((s,x)=>s+x.trefferquote,0)/covered.length,abgedeckteKonten:covered.length,
  jeKonto:perClass,verwechslungen:[...confusion].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),details};
}
const action=process.argv[2];
if(action==="selftest"){
 ensure(removeCompanies("ACME (Nord)+ GmbH zahlt; acme (nord)+ gmbh",["ACME (Nord)+ GmbH"]).trim()==="zahlt;","Literalmaske");
 const records=[
  {text:"papier heft bleistift ordner locher",konto:"4930",firmennamen:[]},
  {text:"briefmarke porto paket versand frankierung",konto:"4910",firmennamen:[]},
  {text:"papier ordner bleistift büro locher",konto:"4930",firmennamen:[]},
  {text:"paket porto versand briefmarke",konto:"4910",firmennamen:[]}
 ];
 const m=JSON.parse(JSON.stringify(train(records,true))),p=prepare(m);
 ensure(predict(p,"papier bleistift locher").konto==="4930","Büro-Smoke-Test");
 ensure(predict(p,"porto briefmarke paket").konto==="4910","Porto-Smoke-Test");
 ensure(predict(p,"").konto==="4910","Deterministischer leerer Text");
 console.log(JSON.stringify({selftest:"PASS",checks:4}));
}else if(action==="train"){
 const groups=sets.map(p=>({path:p,...json(p)}));
 for(const g of groups){validateRows(g.dateien,g.path);ensure(g.dateien.length===114,"114 je Agent");for(const k of accounts)ensure(g.dateien.filter(r=>r.konto===k).length===3,"Drei je Klasse "+g.path+" "+k);}
 const all=groups.flatMap(g=>g.dateien);validateRows(all,"gesamt");
 const validation={modell:"Codex (GPT-6)",zeit:new Date().toISOString(),dateien:all.length,agenten:groups.map(g=>({datei:g.path,betrieb:g.betrieb,gewerbe:g.gewerbe,n:g.dateien.length})),
  konten:accounts.length,jeKonto:9,zeichen:{min:Math.min(...all.map(x=>x.text.length)),max:Math.max(...all.map(x=>x.text.length))},
  hinweis:"Nur Lehrdaten und Kontenliste gelesen; keine Prüfbelege oder Goldlabels für das Training."};
 save("FORMPRUEFUNG-LEHRDATEN.json",validation);
 const sizes={};
 for(const mode of [true,false]){
  const model=train(all,mode);save(modelFile(mode),model,false);
  sizes[mode?"mit":"ohne"]={bytes:fs.statSync(path.join(ROOT,modelFile(mode))).size,vocabulary:model.vocabulary.length};
  ensure(sizes[mode?"mit":"ohne"].bytes<=350000,"Mobilmodell größer als 350 kB");
 }
 const sourceFiles=["SYSTEM/klassifikator.mjs","SYSTEM/lauf.mjs","SYSTEM/PRUEFPLAN.md","KONTENLISTE.json",...sets,...[true,false].map(modelFile)];
 const freeze={system:"Codex TF-IDF-Zentroid 1.0",modellErsteller:"Codex (GPT-6)",zeit:new Date().toISOString(),
  config:CONFIG,lehrbelege:all.length,modellGroessen:sizes,dateien:Object.fromEntries(sourceFiles.map(p=>[p,hash(p)])),
  leseregel:"Repo-Inhalte ausschließlich docs/fremdpruefung/; keine externe Recherche",
  testkenntnis:"Diese Train-Funktion liest keine Testdateien. Der Hauptagent hatte Claude-Stapel 4 zuvor in Auftrag 003 manuell gelesen; daraus wurden keine Merkmale, Regeln oder Gewichte gelernt."};
 save("SYSTEM/EINGEFROREN.json",freeze);
 const folds=[];
 for(const mode of [true,false])for(let fold=0;fold<groups.length;fold++){
  const trainRows=groups.filter((_,i)=>i!==fold).flatMap(g=>g.dateien),held=groups[fold].dateien;
  const p=prepare(train(trainRows,mode));
  const predictions=held.map(r=>({datei:r.datei,konto:predict(p,r.text,r.firmennamen).konto}));
  const s=scoreRows(held,predictions);
  folds.push({mitFirmenname:mode,ausgelassen:groups[fold].gewerbe,lehrbelege:trainRows.length,...s});
 }
 save("LEHRDATEN-KREUZVALIDIERUNG.json",{zweck:"Drei Gewerbewechsel zur Beschreibung; keine Hyperparameterwahl anhand der Ergebnisse.",folds});
 console.log(JSON.stringify({training:"PASS",count:all.length,sizes,crossValidation:folds.map(x=>({mitFirmenname:x.mitFirmenname,gewerbe:x.ausgelassen,richtig:x.richtig,n:x.n}))}));
}else if(action==="predict"){
 const frozen=json("SYSTEM/EINGEFROREN.json");
 for(const [p,h] of Object.entries(frozen.dateien))ensure(hash(p)===h,"Freeze verändert "+p);
 const meta=json("PRUEFSTAPEL/METADATEN.json");
 const own=meta.dateien.map(r=>{ensure(!r.datei.includes("/")&&!r.datei.includes(".."),"Unsicherer Pfad");return{datei:r.datei,text:read("PRUEFSTAPEL/"+r.datei),firmennamen:r.firmennamen};});
 const other=json("STAPEL-4-EINGABE.json").dateien;
 const inputHashes={};
 for(const [stack,rows] of [["EIGENER-STAPEL",own],["STAPEL-4",other]]){
  ensure(rows.length===120&&new Set(rows.map(x=>x.datei)).size===120,"120 eindeutige Texte "+stack);
  for(const row of rows){ensure(Array.isArray(row.firmennamen),"Firmenmaske "+row.datei);for(const n of row.firmennamen)ensure(n&&row.text.includes(n),"Maskenliteral "+row.datei);}
  inputHashes[stack]=crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  for(const mode of [true,false]){
   const model=prepare(json(modelFile(mode)));
   const predictions=rows.map(r=>({datei:r.datei,konto:predict(model,r.text,r.firmennamen).konto}));
   save(resultFile(stack,mode),{system:"Codex TF-IDF-Zentroid 1.0",mitFirmenname:mode,dateien:predictions});
  }
 }
 const outputs=["EIGENER-STAPEL","STAPEL-4"].flatMap(s=>[true,false].map(m=>resultFile(s,m)));
 save("VORHERSAGEN-MANIFEST.json",{zeit:new Date().toISOString(),freeze:hash("SYSTEM/EINGEFROREN.json"),eingaben:inputHashes,
  ausgaben:Object.fromEntries(outputs.map(p=>[p,hash(p)])),goldGelesen:false,
  hinweis:"Vorhersagen vor Auswertung erzeugt. ERWARTUNG.json wird erst im separaten evaluate-Schritt geöffnet."});
 console.log(JSON.stringify({prediction:"PASS",files:outputs,rowsPerFile:120,goldRead:false}));
}else if(action==="evaluate"){
 const manifest=json("VORHERSAGEN-MANIFEST.json");
 for(const [p,h] of Object.entries(manifest.ausgaben))ensure(hash(p)===h,"Vorhersagen verändert "+p);
 const gold=json("PRUEFSTAPEL/ERWARTUNG.json"),meta=json("PRUEFSTAPEL/METADATEN.json");
 ensure(gold.dateien.length===120&&new Set(gold.dateien.map(x=>x.datei)).size===120,"Goldumfang");
 for(const r of gold.dateien)ensure(known.has(r.konto)&&["einnahme","ausgabe"].includes(r.richtung),"Goldform");
 const tests=[true,false].map(mode=>{
  const s=scoreRows(gold.dateien,json(resultFile("EIGENER-STAPEL",mode)).dateien);
  const mm=new Map(meta.dateien.map(x=>[x.datei,x]));
  const tags=[...new Set(meta.dateien.flatMap(x=>x.merkmale||[]))].sort();
  return {mitFirmenname:mode,...s,merkmale:tags.map(tag=>{const rr=s.details.filter(r=>(mm.get(r.datei)?.merkmale||[]).includes(tag));return{merkmal:tag,n:rr.length,richtig:rr.filter(x=>x.richtig).length};})};
 });
 save("MESSWERTE.json",{system:"Codex TF-IDF-Zentroid 1.0",modellErsteller:"Codex (GPT-6)",zeit:new Date().toISOString(),
  betrieb:gold.betrieb,tests,fehlerband:"Wilson 95 Prozent unter vereinfachter Unabhängigkeitsannahme; synthetischer Einzelbetrieb, kein Beleg für reale Genauigkeit.",
  kreuztestClaudeStapel4:"Nicht gemessen: Mehrheits-Soll bleibt bei Claude.",
  claudeSystemEigenerStapel:"Nicht gemessen: ausstehender Gegenlauf durch Claude.",
  direktesSprachmodell:"Nicht gemessen: optionalen Zusatzlauf nicht durchgeführt."});
 console.log(JSON.stringify({evaluation:"PASS",tests:tests.map(x=>({mitFirmenname:x.mitFirmenname,richtig:x.richtig,n:x.n,trefferquote:x.trefferquote,wilson95:x.wilson95,makroRecall:x.makroRecall,abgedeckteKonten:x.abgedeckteKonten}))}));
}else{
 throw Error("Aufruf: node SYSTEM/lauf.mjs selftest|train|predict|evaluate");
}
