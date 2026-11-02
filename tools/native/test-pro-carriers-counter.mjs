// Deliberately break only the sender's completion authentication in a copy.
// The real Datei-Post server must reject it; no live checkout is mutated.
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const kim=resolve(process.argv[2]||'../work/Kim-sync'),post=resolve(process.argv[3]||'../work/Datei-Post'),temp=await mkdtemp(join(tmpdir(),'fa-carrier-counter-'));
try{
 await cp(kim,temp,{recursive:true,filter:p=>!relative(kim,p).split(/[\\/]/).some(x=>x==='.git'||x==='node_modules')});
 const file=join(temp,'index.html'),text=await readFile(file,'utf8');
 const correct="fetch(`${z.server}/api/kimsync/dateien/${id}/fertig`, { method: 'POST', headers: { 'x-schreib-token': schreibToken } })";
 assert.equal(text.split(correct).length,2,'Unique sender completion boundary');await writeFile(file,text.replace(correct,"fetch(`${z.server}/api/kimsync/dateien/${id}/fertig`, { method: 'POST' })"));
 const result=await new Promise((ok,no)=>{const p=spawn(process.execPath,['tools/native/test-pro-carriers.mjs',temp,post],{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',x=>stdout+=x);p.stderr.on('data',x=>stderr+=x);p.on('error',no);p.on('exit',code=>ok({code,stdout,stderr}));});
 assert.notEqual(result.code,0,'Broken sender unexpectedly passed');assert.match(result.stderr,/Server meldet die Datei nicht als vollständig \(403\)/,'Expected actual server rejection, not an unrelated test failure');
 console.log('PASS Missing completion write token rejected by real Datei-Post server; exactly the intended negative case detected');
}finally{await rm(temp,{recursive:true,force:true});}
