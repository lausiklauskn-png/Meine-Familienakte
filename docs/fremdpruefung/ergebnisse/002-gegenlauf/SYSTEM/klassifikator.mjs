// Reiner JavaScript-Klassifikator: keine Bibliotheken, kein Netz, kein Sprachmodell.
// Trainieren ist offline möglich; predict(model, text, firmennamen) läuft im Browser.
export const CONFIG = Object.freeze({
  version: "centroid-1.0", maxFeatures: 6000, minDF: 2,
  maxClassFeatures: 160, charWeight: 0.35, wordWeight: 1,
  charMin: 3, charMax: 5, quantization: 32767
});
export function removeCompanies(text, names) {
  let out = text;
  for (const name of [...new Set(names)].filter(Boolean).sort((a,b)=>b.length-a.length)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "giu"), " ");
  }
  return out;
}
export function features(text, companyNames=[], withNames=true) {
  // Die Sammeldatei-Kopfzeile mit Dateiname ist kein OCR-Beleginhalt.
  text = text.replace(/^######## BELEG \d+ von \d+ · Datei: .* ########\r?\n/gm, "");
  if (!withNames) text = removeCompanies(text, companyNames);
  text = text.normalize("NFKC").toLocaleLowerCase("de-DE")
    .replace(/https?:\/\/\S+|\b[^\s@]+@[^\s@]+/gu," ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/gu," datum ")
    .replace(/\d{3,}/gu," zahl ");
  const tokens = text.match(/[\p{L}]+|\d{1,2}/gu) || [];
  const tf = new Map();
  const add=(feature,weight)=>tf.set(feature,(tf.get(feature)||0)+weight);
  for(let i=0;i<tokens.length;i++) {
    const word=tokens[i];
    add("w:"+word, CONFIG.wordWeight);
    if(i) add("b:"+tokens[i-1]+" "+word,CONFIG.wordWeight);
    if(word.length>=3 && !/^\d+$/.test(word)) {
      const bounded="^"+word+"$";
      for(let n=CONFIG.charMin;n<=CONFIG.charMax;n++)
        for(let p=0;p+n<=bounded.length;p++) add("c:"+bounded.slice(p,p+n),CONFIG.charWeight);
    }
  }
  return tf;
}
function vector(tf, index, idf) {
  const values=[];
  let norm=0;
  for(const [feature,count] of tf) {
    const j=index.get(feature);
    if(j===undefined) continue;
    const value=Math.sqrt(count)*idf[j];
    values.push([j,value]);norm+=value*value;
  }
  norm=Math.sqrt(norm)||1;
  return values.map(([j,value])=>[j,value/norm]);
}
export function train(records, withNames=true) {
  const documents=records.map(r=>features(r.text,r.firmennamen||[],withNames));
  const df=new Map();
  for(const doc of documents) for(const feature of doc.keys()) df.set(feature,(df.get(feature)||0)+1);
  const vocabulary=[...df].filter(([,n])=>n>=CONFIG.minDF)
    .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"en"))
    .slice(0,CONFIG.maxFeatures).map(([f])=>f);
  const idf=vocabulary.map(f=>Number(Math.log(1+records.length/df.get(f)).toFixed(6)));
  const index=new Map(vocabulary.map((f,i)=>[f,i]));
  const sums=new Map();
  for(let i=0;i<records.length;i++) {
    const account=records[i].konto;
    if(!sums.has(account)) sums.set(account,new Map());
    const sum=sums.get(account);
    for(const [j,value] of vector(documents[i],index,idf)) sum.set(j,(sum.get(j)||0)+value);
  }
  const classes=[...sums].sort((a,b)=>a[0].localeCompare(b[0])).map(([konto,sum])=>{
    const selected=[...sum].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,CONFIG.maxClassFeatures);
    const norm=Math.sqrt(selected.reduce((s,[,v])=>s+v*v,0))||1;
    return {konto,weights:selected.map(([j,v])=>[j,Math.round(v/norm*CONFIG.quantization)])};
  });
  return {system:"Codex TF-IDF-Zentroid 1.0",mitFirmenname:withNames,config:CONFIG,
    trainingCount:records.length,vocabulary,idf,classes};
}
export function prepare(model) {
  if(model.config.version!==CONFIG.version) throw Error("Unbekannte Modellversion");
  return {model,index:new Map(model.vocabulary.map((f,i)=>[f,i]))};
}
export function predict(prepared, text, companyNames=[]) {
  const {model,index}=prepared;
  const v=new Map(vector(features(text,companyNames,model.mitFirmenname),index,model.idf));
  const scores=model.classes.map(c=>({konto:c.konto,score:c.weights.reduce((s,[j,w])=>s+(v.get(j)||0)*w/CONFIG.quantization,0)}))
    .sort((a,b)=>b.score-a.score||a.konto.localeCompare(b.konto));
  return {konto:scores[0].konto,score:scores[0].score,margin:scores[0].score-(scores[1]?.score||0)};
}
