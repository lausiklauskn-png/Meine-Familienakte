import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=p=>JSON.parse(read(p));
const sha256=p=>crypto.createHash("sha256").update(read(p)).digest("hex");
const ensure=(ok,msg)=>{if(!ok)throw Error(msg)};
const allowed=new Set(json("KONTENLISTE.json").map(x=>x.konto));
const frozen=json("SYSTEM/EINGEFROREN.json");
for(const [p,h] of Object.entries(frozen.dateien))ensure(sha256(p)===h,"Freeze geändert: "+p);
const predManifest=json("VORHERSAGEN-MANIFEST.json");
for(const [p,h] of Object.entries(predManifest.ausgaben))ensure(sha256(p)===h,"Vorhersage geändert: "+p);
ensure(sha256("PRUEFSTAPEL/ERWARTUNG.json")==="153e703869ccc5b18130aa41d461707f996f935e933e1bcb7163cbfac6a8e87f","Soll geändert");
const own=json("PRUEFSTAPEL/ERWARTUNG.json").dateien;
const source=json("STAPEL-4-EINGABE.json").dateien;
const meta=json("PRUEFSTAPEL/METADATEN.json").dateien;
const txt=fs.readdirSync(path.join(root,"PRUEFSTAPEL")).filter(x=>x.endsWith(".txt")).sort();
ensure(txt.length===120&&JSON.stringify(txt)===JSON.stringify(own.map(x=>x.datei).sort()),"Prüfdateien");
ensure(JSON.stringify(txt)===JSON.stringify(meta.map(x=>x.datei).sort()),"Metadaten-Dateinamen");
for(const rows of [own,source])ensure(rows.length===120&&new Set(rows.map(x=>x.datei)).size===120,"120 eindeutige Eingaben");
for(const stack of ["EIGENER-STAPEL","STAPEL-4"]){
 const expected=(stack==="EIGENER-STAPEL"?own:source).map(x=>x.datei).sort();
 for(const mode of [true,false]){
  const p="VORHERSAGEN-"+stack+(mode?"":"-OHNE-FIRMENNAME")+".json";
  const d=json(p);
  ensure(d.mitFirmenname===mode&&d.dateien.length===120,"Vorhersage-Form");
  ensure(JSON.stringify(d.dateien.map(x=>x.datei).sort())===JSON.stringify(expected),"Vorhersage-Dateinamen");
  for(const r of d.dateien)ensure(Object.keys(r).sort().join(",")==="datei,konto"&&allowed.has(r.konto),"Vorhersagekonto");
 }
}
const raw=source.map(x=>x.text).join("");
const blob=crypto.createHash("sha1").update("blob "+Buffer.byteLength(raw)+"\0").update(raw).digest("hex");
ensure(blob==="95f7439c61283243979f433194f9b8b424e3fe17","Quelltext von Claude verändert");
const files=[];
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  ensure(!entry.isSymbolicLink(),"Kein Symlink erlaubt");
  if(entry.isDirectory())walk(full);
  else {
   const rel=path.relative(root,full).split(path.sep).join("/");
   if(rel==="VEROEFFENTLICHUNG.json"||rel==="STAPEL-4-EINGABE.json")continue;
   const data=fs.readFileSync(full);
   if(rel.endsWith(".json"))JSON.parse(data.toString("utf8"));
   files.push({pfad:rel,bytes:data.length,sha256:crypto.createHash("sha256").update(data).digest("hex"),
     gitBlobSha:crypto.createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex")});
  }
 }
}
walk(root);files.sort((a,b)=>a.pfad.localeCompare(b.pfad,"en"));
const bytes=files.reduce((s,x)=>s+x.bytes,0);
ensure(bytes<5000000,"Paket größer als 5 MB");
const out={modell:"Codex (GPT-6)",utc:new Date().toISOString(),lesegrenze:"Repo-Inhalte ausschließlich docs/fremdpruefung/; keine anderen Repos, keine externe Recherche.",
 zweig:"codex/fremdpruefung",claudePuls:6,formpruefung:"PASS",lehrbelege:342,pruefbelege:120,vorhersagedateien:4,vorhersagenJeDatei:120,
 eingefroreneDateienUnveraendert:true,sollUnveraendert:true,claudeQuelltextUnveraendert:true,
 bytesOhneDiesesManifest:bytes,dateienOhneDiesesManifest:files};
fs.writeFileSync(path.join(root,"VEROEFFENTLICHUNG.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({validation:"PASS",filesIncludingManifest:files.length+1,bytesIncludingManifest:bytes+fs.statSync(path.join(root,"VEROEFFENTLICHUNG.json")).size,
 freezeUnchanged:true,goldUnchanged:true,sourceBlob:blob,predictions:4*120}));
