// Echte Chromium-IndexedDB: atomare Aufnahme, Wiederholung, Konflikte und Abbruch.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { startApp, launchBrowser, DESKTOP, ready, step, summary, ROOT } from './_harness.mjs';
const app = await startApp(); const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: 'block' })).newPage();
  await page.route(/\/__pro_probe\//, async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    if (!['pro-uebergabe', 'stapel-ablage', 'eingang-ablage'].includes(name)) return route.abort();
    const source = readFileSync(`${ROOT}/app/${name}.ts`, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await route.fulfill({ contentType: 'text/javascript', body: outputText });
  });
  await page.goto(app.base); await ready(page);
  await step('Übergabevertrag: Bytes, Ziel und Größe prüfen; unveränderte Eingangsquellen', async () => page.evaluate(async () => {
    const api = await import('/__pro_probe/pro-uebergabe');
    const file = new File(['Erfundene Übergabe 17'], 'Erfunden.txt', { type: 'text/plain' });
    const m = await api.proUebergabeBauen(file, 'workflow-pdf-pro', 'familienakte', 'dok-17', 'transfer-17');
    for (const [wert, datei] of [[{...m, ziel:'bookledgerpro'}, file], [{...m, groesse:999}, file], [{...m, sha256:'0'.repeat(64)}, file], [m, new File(['andere Bytes'], file.name, {type:file.type})]]) {
      let rejected = false; try { await api.proUebergabeAnnehmen(wert, datei); } catch { rejected = true; }
      if (!rejected) throw new Error('Ungültige Übergabe angenommen');
    }
    window.__uebergabeProbe = { file, m };
    return true;
  }));
  await step('Atomarer Abbruch behält alle drei Fächer unverändert; Wiederholung klappt', async () => page.evaluate(async () => {
    const api = await import('/__pro_probe/pro-uebergabe');
    const { stapelDatenbank } = await import('/__pro_probe/stapel-ablage');
    const counts = async () => { const db = await stapelDatenbank(); try { return await Promise.all(['eingang','eingang-dateien','uebergaben'].map(n => new Promise((ok,no) => { const t=db.transaction(n);const r=t.objectStore(n).count();t.oncomplete=()=>ok(r.result);t.onabort=()=>no(t.error); }))); } finally { db.close(); } };
    const vorher = await counts(); const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(...args) { if(this.name==='uebergaben') throw new DOMException('Erfundener voller Speicher','QuotaExceededError'); return put.apply(this,args); };
    let rejected = false;
    try { await api.proUebergabeAnnehmen(window.__uebergabeProbe.m, window.__uebergabeProbe.file); } catch { rejected=true; }
    finally { IDBObjectStore.prototype.put=put; }
    if (!rejected || JSON.stringify(vorher)!==JSON.stringify(await counts())) throw new Error('Teilablage nach Abbruch');
    const {m,file}=window.__uebergabeProbe;
    const [a,b] = await Promise.all([api.proUebergabeAnnehmen(m,file),api.proUebergabeAnnehmen(m,file)]);
    if (a.eingangId!==b.eingangId || a.stand!=='im-eingang') throw new Error('Doppelte oder falsche Quittung');
    const nachher=await counts(); if(nachher.some((n,i)=>n!==vorher[i]+1)) throw new Error('Mehr als ein Eingang');
    window.__uebergabeProbe.quittung=a;
    return true;
  }));
  await step('Gleiche Übergabekennung mit anderem Inhalt wird abgelehnt', async () => page.evaluate(async () => {
    const api=await import('/__pro_probe/pro-uebergabe'); const {m}=window.__uebergabeProbe;
    const file=new File(['Neuer Inhalt'],m.name,{type:m.mime});
    const neu=await api.proUebergabeBauen(file,m.quelle,m.ziel,m.dokumentId,m.id);
    try { await api.proUebergabeAnnehmen(neu,file); } catch(e) { return /anderen Inhalt/.test(e.message); }
    return false;
  }));
  await step('Quittung bleibt nach Entfernen des Eingangs und Neustart wiederholbar', async () => {
    const saved = await page.evaluate(async () => {
      const { eingangAblage }=await import('/__pro_probe/eingang-ablage'); const {m,quittung}=window.__uebergabeProbe;
      await eingangAblage(current=>current.filter(e=>e.id!==quittung.eingangId)); return {m,quittung};
    });
    await page.reload(); await ready(page);
    return page.evaluate(async saved => {
      const api=await import('/__pro_probe/pro-uebergabe'); const {eingangAblage}=await import('/__pro_probe/eingang-ablage');
      const file=new File(['Erfundene Übergabe 17'],saved.m.name,{type:saved.m.mime});
      const q=await api.proUebergabeAnnehmen(saved.m,file);
      if(q.eingangId!==saved.quittung.eingangId || (await eingangAblage()).some(e=>e.id===q.eingangId)) throw new Error('Erneut eingefügt statt quittiert');
      return true;
    }, saved);
  });
} finally { await browser.close(); await app.stop(); }
process.exit(summary('Pro-Übergabe in echter Browser-Datenbank'));
