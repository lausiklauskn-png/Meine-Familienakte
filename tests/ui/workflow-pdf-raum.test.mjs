// Same document out and back. Real browser, PDF engine, IndexedDB and OPFS; only
// window opening is stubbed. No durable document write in the iframe is allowed.
import path from 'node:path';
import { startApp, launchBrowser, DESKTOP, ready, footer, step, check, summary, collectErrors, ROOT } from './_harness.mjs';
import { windowStub } from './_stubs.mjs';
const FORM = path.join(ROOT, 'tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf');
const NAME = 'Garantiebeleg_Waschautomat_Lavorix.pdf';
const app = await startApp(), browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: 'block' })).newPage();
  page.setDefaultTimeout(20000); await page.addInitScript(windowStub);
  await page.addInitScript(() => {
    if (window.parent !== window) {
      let kern;
      Object.defineProperty(window, '__wfpdf', { configurable: true, get: () => kern, set: v => {
        const original = v.importDateien;
        v.importDateien = async (...args) => { window.__raumImportWartet = true; while (window.parent.__halteRaumImport) await new Promise(r=>setTimeout(r,10)); return original(...args); };
        kern = v;
      } });
    }
  });
  const errors = collectErrors(page);
  const register = () => page.evaluate(async () => {
    const finde = async d => { for await (const [name,h] of d.entries()) { if(h.kind==='file'&&name==='Familienakte_Register.json') return JSON.parse(await (await h.getFile()).text()); if(h.kind==='directory'){ const r=await finde(h); if(r)return r; } } return null; };
    return finde(await navigator.storage.getDirectory());
  });
  const dateien = () => page.evaluate(async () => {
    const out=[]; const sammle=async(d,p='')=>{for await(const [n,h]of d.entries()){if(h.kind==='directory')await sammle(h,p+n+'/');else out.push(p+n)}};
    await sammle(await navigator.storage.getDirectory()); return out;
  });
  await page.goto(app.base, { waitUntil: 'networkidle' }); await ready(page);
  await footer(page, 'Eingangszentrale');
  await page.locator('.central-intake input[type=file]:not([accept])').setInputFiles([FORM]);
  await page.locator('.intake-queue-item', { hasText: 'Garantiebeleg' }).first().locator('button', { hasText: 'Zuordnung prüfen' }).click();
  await page.locator('.intake-modal button[type=submit]').click();
  await page.locator('.intake-modal').waitFor({state:'detached'});
  const vorher = await register(), original = vorher.documents.find(d=>d.originalName===NAME);
  if(!original)throw new Error('Testdokument fehlt');
  const pdfZahl = (await dateien()).filter(n=>/\.pdf$/i.test(n)).length;
  let raum;
  await step('Öffnen aus der Akte: temporärer PDF-Raum, keine zweite dauerhafte Bibliothek', async () => {
    await page.evaluate(() => {window.__halteRaumImport=true});
    await page.locator('.document-item', { hasText: NAME }).first().locator('[data-wfpdf-oeffnen]').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('iframe')].some(f=>f.contentWindow?.__raumImportWartet));
    if (!await page.locator('[data-wfpdf-zurueck]').isDisabled()) throw new Error('Rückgabe vor bestätigtem Arbeitsimport möglich');
    await page.evaluate(()=>{window.__halteRaumImport=false});
    await page.locator('[data-wfpdf-zurueck]:not([disabled])').waitFor();
    raum=page.frames().find(f=>f.url().includes('/apps/workflow-pdf/'));
    await raum.locator('#sc-ed.on').waitFor();
    const dbs=await page.evaluate(async()=> (await indexedDB.databases()).map(d=>d.name));
    if(dbs.includes('FamilienakteWFPDF1'))throw new Error('Zweite dauerhafte Bibliothek angelegt');
    return await raum.evaluate(async()=> window.FA_BRUECKE.arbeitsraum && (await window.WFP.DB.all('docs')).length===1);
  });
  await step('Fremde Ausgabe darf die geöffnete Unterlage nicht ersetzen', async () => {
    const abgewiesen = await raum.evaluate(async () => {
      try { await navigator.share({ files: [new File(['%PDF-1.7\\nFREMD'], 'fremd.pdf', { type: 'application/pdf' })] }); return false; }
      catch (e) { return /gehört nicht/.test(e.message); }
    });
    const stand = await register();
    return abgewiesen && stand.documents.find(d => d.id === original.id).checksum === original.checksum;
  });
  await step('Eintrag ausfüllen und unter derselben Dokumentkennung zurückspeichern', async () => {
    await raum.locator('#mBearbeiten').click();
    await raum.waitForFunction(()=>document.querySelector('#seiten canvas')?.width>100);
    await raum.locator('[data-t="text"]').click();
    await raum.locator('#seiten .lage').first().click({position:{x:180,y:240}});
    await raum.waitForFunction(()=>document.activeElement?.id==='eigLabel');
    await raum.locator('#eigLabel').fill('Rückgabeprobe');
    await raum.locator('#eigWert').fill('RUECKGABE_ERFUNDEN_42');
    // Inject a genuine OPFS register write failure; keep the room and source intact.
    await page.evaluate(() => {
      const original = FileSystemFileHandle.prototype.createWritable;
      FileSystemFileHandle.prototype.createWritable = function (...args) {
        if (this.name === 'Familienakte_Register.json') {
          FileSystemFileHandle.prototype.createWritable = original;
          throw new DOMException('Probe: Speicher voll', 'QuotaExceededError');
        }
        return original.apply(this, args);
      };
    });
    await page.locator('[data-wfpdf-zurueck]').click();
    await page.locator('[data-wfpdf-rueckfehler]').waitFor({ timeout: 30000 });
    const fehlstand = await register();
    if (fehlstand.documents.find(d => d.id === original.id).checksum !== original.checksum || !await page.locator('[data-wfpdf-rahmen]').count()) throw new Error('Fehlgeschlagene Rückgabe hat Quelle oder Arbeitsraum verloren');
    await page.locator('[data-wfpdf-zurueck]').click();
    await page.locator('[data-wfpdf-rahmen]').waitFor({state:'detached',timeout:30000});
    await page.locator('.document-item', {hasText:NAME}).first().waitFor();
    const nach=await register(), d=nach.documents.find(d=>d.id===original.id);
    if(nach.documents.length!==vorher.documents.length||d.checksum===original.checksum)throw new Error('Eintrag dupliziert oder Bytes nicht geändert');
    for(const k of ['id','originalName','category','documentDate','addedAt','notes'])if(d[k]!==original[k])throw new Error('Zuordnung geändert: '+k);
    if(JSON.stringify(nach.relations)!==JSON.stringify(vorher.relations))throw new Error('Beziehungen geändert');
    if((await dateien()).filter(n=>/\.pdf$/i.test(n)).length!==pdfZahl)throw new Error('Zusätzliche dauerhafte PDF-Datei');
    return 'gleicher Eintrag, gleiche Zuordnung, kein zusätzlicher Eingang und keine zweite PDF';
  });
  await step('Erneutes Öffnen liest den zurückgegebenen Inhalt; unveränderte Rückgabe bleibt ein Eintrag', async () => {
    const vor=await register(), d=vor.documents.find(d=>d.id===original.id);
    await page.locator('.document-item', {hasText:NAME}).first().locator('[data-wfpdf-oeffnen]').click();
    await page.locator('[data-wfpdf-zurueck]:not([disabled])').waitFor();
    raum=page.frames().find(f=>f.url().includes('/apps/workflow-pdf/'));
    const text=await raum.evaluate(async()=>{const p=await window.__wfpdf.S.pdf.getPage(1);return(await p.getTextContent()).items.map(t=>t.str||'').join('')});
    if(!text.includes('RUECKGABE_ERFUNDEN_42'))throw new Error('Alte Fassung geöffnet');
    await page.locator('[data-wfpdf-zurueck]').click();
    await page.locator('[data-wfpdf-rahmen]').waitFor({state:'detached',timeout:30000});
    const nach=await register();
    return nach.documents.length===vor.documents.length&&nach.documents.find(x=>x.id===d.id).storedPath===d.storedPath;
  });
  check(errors.length===0,'keine Seitenfehler',errors.join(' | '));
} finally { await browser.close(); await app.stop(); }
process.exit(summary('PDF als Arbeitsraum'));
