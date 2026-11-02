// Storage/protocol checks with synthetic vectors; this does not measure e5 quality.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
const server=createServer(async(req,res)=>{res.setHeader('Content-Type',req.url==='/index.js'?'text/javascript':'text/html');res.end(req.url==='/index.js'?transpileModule(await readFile(new URL('../../app/private-meaning-index.ts',import.meta.url),'utf8'),{compilerOptions:{target:ScriptTarget.ES2022,module:ModuleKind.ESNext}}).outputText:'<!doctype html><title>Private Indexprobe</title>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
try {
 const page=await browser.newPage(),outside=[];await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():(outside.push(r.request().url()),r.abort()));
 await page.goto('http://127.0.0.1:'+server.address().port);
 const results=await page.evaluate(async()=>{
  const I=await import('/index.js'),results=[];
  const small={id:'Xenova/multilingual-e5-small',revision:'a'.repeat(40),dim:384},base={id:'Xenova/multilingual-e5-base',revision:'b'.repeat(40),dim:768};
  let scope='akte-a',docs=[{id:'haus',text:'Miete der Wohnung'},{id:'auto',text:'Versicherung des Fahrzeugs'}],calls=0;
  const embed=async(text,model)=>{calls++;const vector=new Float32Array(model.dim);vector[/Miete|Wohnung/.test(text)?0:1]=1;return vector;};
  const opts=model=>({scope,model,read:async()=>structuredClone(docs),currentScope:()=>scope,embed});
  const check=(name,ok)=>{results.push([name,Boolean(ok)]);if(!ok)throw Error(name);};
  await I.buildMeaningIndex(opts(small));let r=await I.searchMeaningIndex({scope,documents:docs,query:'Wohnung',currentScope:()=>scope,embed});
  check('Real IDB: matching scope and model return document, not another record',r.hits[0]?.id==='haus'&&r.indexed===2&&r.model.dim===384);
  const abort=new AbortController();calls=0;
  try {await I.buildMeaningIndex({...opts(base),signal:abort.signal,progress:n=>{if(n===1)abort.abort();}});}catch(e){check('Model switch cancelled',e.name==='AbortError');}
  check('Previous usable index remains active',(await I.activeMeaningModel(scope)).id===small.id);
  calls=0;await I.buildMeaningIndex(opts(base));check('Restart resumes only missing vectors',calls===1&&(await I.activeMeaningModel(scope)).dim===768);
  const changed={...base,revision:'c'.repeat(40)};let reads=0;
  try {await I.buildMeaningIndex({...opts(changed),read:async()=>{reads++;return reads===1?docs:[{id:'haus',text:'Ein anderer Text'}];}});check('Changed corpus rejected',false);}catch(e){check('Changed corpus rejected',e.message==='INDEX_TEXT_CHANGED');}
  check('Changed corpus does not replace active generation',(await I.activeMeaningModel(scope)).revision===base.revision);
  r=await I.searchMeaningIndex({scope,documents:[{id:'haus',text:'Inzwischen geänderter Text'}],query:'Wohnung',currentScope:()=>scope,embed});
  check('Changed and deleted documents never yield stale results',r.hits.length===0);
  scope='akte-b';r=await I.searchMeaningIndex({scope,documents:docs,query:'Wohnung',currentScope:()=>scope,embed});
  check('Second vault cannot read first vault vectors',r.model===null&&r.hits.length===0);
  await I.buildMeaningIndex(opts(small));scope='akte-a';
  try {await I.buildMeaningIndex({...opts({...base,revision:'d'.repeat(40)}),embed:async(t,m)=>{scope='akte-b';return embed(t,m);}});check('Vault changed during embedding rejected',false);}catch(e){check('Vault changed during embedding rejected',e.message==='INDEX_SCOPE_CHANGED');}
  scope='akte-a';check('Scope change preserves old generation',(await I.activeMeaningModel(scope)).revision===base.revision);
  try {await I.buildMeaningIndex({...opts({...base,revision:'e'.repeat(40)}),embed:async()=>{const v=new Float32Array(384);v[0]=1;return v;}});check('Invalid dimension/norm rejected',false);}catch(e){check('Invalid dimension/norm rejected',e.message==='INDEX_VECTOR_INVALID');}
  for(const invalid of [0,NaN,Infinity]) {
   try {await I.buildMeaningIndex({...opts({...base,revision:'f'.repeat(40)}),embed:async()=>{const v=new Float32Array(768);v[0]=invalid;return v;}});check('Invalid norm or non-finite vector rejected',false);}catch(e){check('Invalid norm or non-finite vector rejected',e.message==='INDEX_VECTOR_INVALID');}
  }
  // Abort the final native IndexedDB transaction after the pointer's request
  // succeeds. Request success must not count as an activated generation.
  const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){const request=original.call(this,value,...args);if(this.name==='active')request.addEventListener('success',()=>this.transaction.abort());return request;};
  try {await I.buildMeaningIndex(opts(changed));check('Activation waits for transaction commit',false);}catch(e){check('Activation waits for transaction commit',/INDEX_ACTIVATION_ABORTED|Abort/.test(String(e)));}finally{IDBObjectStore.prototype.put=original;}
  check('Aborted pointer write preserves previous usable index',(await I.activeMeaningModel(scope)).revision===base.revision);
  const beforeCommit=new AbortController();
  IDBObjectStore.prototype.put=function(value,...args){const request=original.call(this,value,...args);if(this.name==='active')request.addEventListener('success',()=>beforeCommit.abort());return request;};
  try {await I.buildMeaningIndex({...opts(changed),signal:beforeCommit.signal});check('Cancellation before commit prevents activation',false);}catch(e){check('Cancellation before commit prevents activation',/INDEX_ACTIVATION_ABORTED|Abort/.test(String(e)));}finally{IDBObjectStore.prototype.put=original;}
  check('Cancelled activation preserves old pointer',(await I.activeMeaningModel(scope)).revision===base.revision);
  const afterCommit=new AbortController();
  IDBObjectStore.prototype.put=function(value,...args){const request=original.call(this,value,...args);if(this.name==='active')this.transaction.addEventListener('complete',()=>afterCommit.abort());return request;};
  try {const done=await I.buildMeaningIndex({...opts(changed),signal:afterCommit.signal});check('Cancellation after commit reports the durably active new index',done.documents===docs.length&&(await I.activeMeaningModel(scope)).revision===changed.revision);}finally{IDBObjectStore.prototype.put=original;}
  await I.buildMeaningIndex(opts(base));
  const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('FamilienakteBedeutung1',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
  const rows=await new Promise(resolve=>{const tx=db.transaction('vectors'),q=tx.objectStore('vectors').getAll();tx.oncomplete=()=>resolve(q.result);});
  check('Private cache contains model, revision, dimensions and text hashes; no source text',rows.every(r=>r.scope&&r.textHash.length===64&&r.model.revision.length===40&&r.vector.length===r.model.dim&&!('text' in r)));
  await new Promise((resolve,reject)=>{const tx=db.transaction('vectors','readwrite');for(const row of rows.filter(r=>r.scope===scope&&r.model.revision===base.revision))tx.objectStore('vectors').put({...row,vector:new Float32Array(384)});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
  r=await I.searchMeaningIndex({scope,documents:docs,query:'Wohnung',currentScope:()=>scope,embed});check('Damaged vectors never enter search',r.hits.length===0);
  const text='Anfang '+('Mitte '.repeat(20000))+' Schluss';const split=I.meaningSections(text);check('Bounded long-text coverage retains both ends and reports limit',split.limited&&split.texts.length===60&&split.texts[0].startsWith('Anfang')&&split.texts.at(-1).endsWith('Schluss'));
  await I.clearMeaningIndex('akte-a');check('Deleting rebuildable index preserves other vault',(await I.activeMeaningModel('akte-a'))===null&&(await I.activeMeaningModel('akte-b')).id===small.id);
  return results;
 });
 for(const [name,ok] of results){assert.equal(ok,true,name);console.log('PASS '+name);}assert.deepEqual(outside,[]);console.log('PASS no external request');
} finally {await browser.close();server.close();}
