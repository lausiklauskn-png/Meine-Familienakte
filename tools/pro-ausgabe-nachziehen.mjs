#!/usr/bin/env node
// Existing Android output boundary; no paths/URIs supplied by page code.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(process.argv[2]||resolve(root,'../Workflow-PDF-Pro'));
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Quell-Commit fehlt');
const prefix='android/app/src/main/java/de/familyprojekt/workflowpdf/pro/';
const prepared=['ProFilesPlugin.java','PluginWorker.java','PdfPrintAdapter.java'].map(name=>({path:prefix+name,bytes:execFileSync('git',['show',commit+':'+prefix+name],{cwd:source,maxBuffer:1024*1024})}));
const manifestPath=resolve(root,'native/HERKUNFT.json'),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
for(const {path,bytes} of prepared){
 const target=resolve(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);
 manifest.dateien[path]={repo:'lausiklauskn-png/Workflow-PDF-Pro',pfad:path,commit,sha256:createHash('sha256').update(bytes).digest('hex'),zweck:'Bewährte Android-Dateiausgabe mit Tickets, Systemdialog und Rückleseprüfung; Family-Adapter daneben'};
}
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Dateiausgabe '+commit.slice(0,7)+': '+prepared.length+' Dateien bytegleich übernommen');
