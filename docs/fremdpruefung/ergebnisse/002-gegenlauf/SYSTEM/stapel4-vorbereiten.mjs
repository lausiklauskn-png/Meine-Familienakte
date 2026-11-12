import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const masks=JSON.parse(fs.readFileSync(path.join(root,"STAPEL-4-NAMEN.json"),"utf8"));
function build(raw){
 const blob=crypto.createHash("sha1").update("blob "+Buffer.byteLength(raw)+"\0").update(raw).digest("hex");
 if(blob!=="95f7439c61283243979f433194f9b8b424e3fe17")throw Error("Abweichender Quellstand");
 const names=new Map(masks.dateien.map(x=>[x.datei,x.firmennamen]));
 const parts=raw.split(/(?=^######## BELEG \d+ von 120 · Datei: )/m).filter(x=>x.startsWith("######## BELEG "));
 const dateien=parts.map(text=>{
  const m=text.match(/^######## BELEG (\d+) von 120 · Datei: (.+) ########/);
  if(!m||!names.has(m[2]))throw Error("Dateiname nicht in Firmenmaske");
  return {datei:m[2],text,firmennamen:names.get(m[2])};
 });
 if(dateien.length!==120||new Set(dateien.map(x=>x.datei)).size!==120)throw Error("Umfang");
 return {quelle:masks.quelle,modell:masks.modell,dateien};
}
if(process.argv[2]==="--check-current"){
 const saved=JSON.parse(fs.readFileSync(path.join(root,"STAPEL-4-EINGABE.json"),"utf8"));
 if(JSON.stringify(build(saved.dateien.map(x=>x.text).join("")))!==JSON.stringify(saved))throw Error("Rekonstruktion abweichend");
 console.log("PASS: identische lokale Eingabe, keine Veröffentlichung der Rohbelege");
}else{
 const input=process.argv[2];
 if(!input)throw Error("Originaldatei als Pfad übergeben");
 fs.writeFileSync(path.join(root,"STAPEL-4-EINGABE.json"),JSON.stringify(build(fs.readFileSync(input,"utf8")),null,2)+"\n");
 console.log("Lokale Arbeitskopie für die unveränderte Inferenz vorbereitet");
}
