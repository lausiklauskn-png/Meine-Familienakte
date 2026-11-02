// Actual installed Tauri UI and Swing save dialog. No plugin or filesystem mock.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const out=resolve(process.argv[2]);await mkdir(out,{recursive:true});const report={checks:[]};
const browser=await chromium.connectOverCDP('http://127.0.0.1:9333');let page;
function dialog(destination='') {return new Promise((ok,no)=>{const p=spawn('powershell.exe',['-NoProfile','-STA','-File','windows/tools/output-dialog-probe.ps1',...(destination?['-Destination',destination]:[])],{stdio:['ignore','pipe','pipe']});let error='';p.stderr.on('data',b=>error+=b);p.on('error',no);p.on('exit',c=>c===0?ok():no(Error(error||'Native save dialog failed')));});}
try {
 page=browser.contexts().flatMap(c=>c.pages()).find(p=>/^https:\/\/tauri\.localhost\//.test(p.url()));assert.ok(page);
 await page.reload();await page.waitForSelector('.sample-data-notice strong',{timeout:120000});
 await page.locator('.footer-directory button',{hasText:'Sicherheitscenter'}).click();const panel=page.locator('.pro-geraetetransport');await panel.locator('select option').nth(1).waitFor({state:'attached'});
 await panel.locator('select').selectOption(await panel.locator('select option').nth(1).getAttribute('value'));await panel.getByLabel('Empfänger oder Zielgerät').fill('Erfundenes anderes Gerät');
 await Promise.all([dialog(),panel.getByRole('button',{name:'Übergabepaket speichern',exact:true}).click()]);await panel.getByRole('status').filter({hasText:'abgebrochen'}).waitFor();report.checks.push('Actual save dialog cancellation leaves pending outgoing');
 await page.reload();await page.waitForSelector('.sample-data-notice strong',{timeout:120000});await page.locator('.footer-directory button',{hasText:'Sicherheitscenter'}).click();
 const target=join(out,'native-output.familienakte-paket');
 await Promise.all([dialog(target),panel.getByRole('button',{name:'Dasselbe Paket erneut speichern',exact:true}).click()]);await panel.getByRole('status').filter({hasText:'Datei gespeichert'}).waitFor({timeout:30000});
 const bytes=await readFile(target),length=bytes.readUInt32BE(8),header=JSON.parse(bytes.subarray(12,12+length));assert.deepEqual([...bytes.subarray(0,8)],[70,65,80,82,79,49,10,0]);assert.equal(createHash('sha256').update(bytes.subarray(12+length)).digest('hex'),header.vertrag.sha256);assert.equal(bytes.length-12-length,header.vertrag.groesse);assert.equal(header.vertrag.ziel,'familienakte');
 const repeat=join(out,'native-output-repeat.familienakte-paket');await Promise.all([dialog(repeat),panel.getByRole('button',{name:'Dasselbe Paket erneut speichern',exact:true}).click()]);await panel.getByRole('status').filter({hasText:'Datei gespeichert'}).waitFor({timeout:30000});assert.deepEqual(await readFile(repeat),bytes);
 assert.match(await panel.innerText(),/Empfang offen/);report.checks.push('Real save, matching original hash and repeated identical packet after reload');report.complete=true;await page.screenshot({path:join(out,'windows-transport.png'),fullPage:true});
}catch(e){report.error=String(e);await page?.screenshot({path:join(out,'output-failure.png'),fullPage:true}).catch(()=>{});throw e;}
finally{await writeFile(join(out,'installed-output.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
