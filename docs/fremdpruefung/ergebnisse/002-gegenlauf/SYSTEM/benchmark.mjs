import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {prepare,predict} from "./klassifikator.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const meta=JSON.parse(read("PRUEFSTAPEL/METADATEN.json"));
const rows=meta.dateien.map(x=>({...x,text:read("PRUEFSTAPEL/"+x.datei)}));
const runs=[];
for(const mode of ["mit","ohne"]){
 const start=performance.now();
 const prepared=prepare(JSON.parse(read("SYSTEM/modell-"+mode+"-firmennamen.json")));
 const loadMs=performance.now()-start;
 for(const row of rows.slice(0,10))predict(prepared,row.text,row.firmennamen);
 const times=[];
 for(const row of rows){const t=performance.now();predict(prepared,row.text,row.firmennamen);times.push(performance.now()-t);}
 times.sort((a,b)=>a-b);
 runs.push({mitFirmenname:mode==="mit",n:times.length,warmup:10,loadAndPrepareMs:loadMs,
  medianMs:times[Math.floor(times.length/2)],p95Ms:times[Math.ceil(times.length*0.95)-1],
  totalMs:times.reduce((s,x)=>s+x,0)});
}
const result={modellErsteller:"Codex (GPT-6)",zeit:new Date().toISOString(),runtime:process.version,
 umgebung:"Node im Ausführungsworkspace; keine Smartphone- oder Browsermessung",
 methode:"Ein Durchgang je Modell, 120 Dokumente, nach zehn Aufwärmvorhersagen; Textdateien zuvor eingelesen.",
 lesegrenze:"Repo-Inhalte ausschließlich docs/fremdpruefung/; keine externe Recherche",runs};
fs.writeFileSync(path.join(root,"LAUFZEIT-NODE.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result));
