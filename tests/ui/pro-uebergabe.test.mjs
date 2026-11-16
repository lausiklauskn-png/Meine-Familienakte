// Echte Chromium-IndexedDB: atomare Aufnahme, Wiederholung, Konflikte und Abbruch.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { startApp, launchBrowser, DESKTOP, ready, step, summary, ROOT } from './_harness.mjs';
const app = await startApp(); const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: 'block' })).newPage();
  await page.route('**/lib/demo-workspace.ts', async route => {
    const {outputText}=ts.transpileModule(readFileSync(`${ROOT}/lib/demo-workspace.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
    await route.fulfill({contentType:'text/javascript',body:outputText});
  });
  await page.route(/\/__pro_probe\//, async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    if (!['pro-uebergabe', 'stapel-ablage', 'eingang-ablage', 'pro-begleit'].includes(name)) return route.abort();
    const source = readFileSync(`${ROOT}/app/${name}.ts`, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await route.fulfill({ contentType: 'text/javascript', body: outputText });
  });
  await page.route(/\/lib\/(pro-begleitdatei|uebergabe-vorschlaege)(\.ts)?$/, async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop().replace(/\.ts$/, '');
    const { outputText } = ts.transpileModule(readFileSync(`${ROOT}/lib/${name}.ts`, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
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

  // ---------- Vorsortierung aus Private Brain Pro (eigene Übergabe „familienakte-uebergabe.json“) ----------
  await page.evaluate(async () => {
    const api = await import('/__pro_probe/pro-uebergabe'), begleit = await import('/__pro_probe/pro-begleit');
    const { stapelDatenbank } = await import('/__pro_probe/stapel-ablage'); const { eingangAblage } = await import('/__pro_probe/eingang-ablage');
    const sha = async f => [...new Uint8Array(await crypto.subtle.digest('SHA-256', await f.arrayBuffer()))].map(x => x.toString(16).padStart(2, '0')).join('');
    const zahl = async () => { const db = await stapelDatenbank(); try { return await Promise.all(['eingang', 'eingang-dateien'].map(n => new Promise((ok, no) => { const t = db.transaction(n), r = t.objectStore(n).count(); t.oncomplete = () => ok(r.result); t.onabort = () => no(t.error); }))); } finally { db.close(); } };
    const beleg = async id => { const db = await stapelDatenbank(); try { return await new Promise((ok, no) => { const t = db.transaction('uebergaben'), r = t.objectStore('uebergaben').get(id); t.oncomplete = () => ok(r.result); t.onabort = () => no(t.error); }); } finally { db.close(); } };
    let nr = 0;
    window.__b = { api, begleit, eingangAblage, zahl, beleg,
      // Eine erfundene Mail aus Private Brain Pro aufnehmen (wie proEingangAufnehmen ohne Tresor).
      mail: async (text) => { const n = ++nr, file = new File([`From: probe${n}@example.de\r\nSubject: Probe ${n}\r\n\r\n${text}`], `Probe ${n}.eml`, { type: 'message/rfc822' });
        const m = await api.proUebergabeBauen(file, 'private-brain', 'familienakte', `mail-${n}`, `t-mail-${n}`); return { file, m, sha256: m.sha256, annehmen: () => api.proUebergabeAnnehmen(m, file) }; },
      // Die Begleitdatei als zweite Übergabe; `zeile` überschreibt einzelne Felder, `roh` ersetzt den ganzen Inhalt.
      begleitdatei: async (mail, zeile = {}, { roh, quelle = 'private-brain' } = {}) => {
        const inhalt = roh ?? JSON.stringify({ vertrag: 'familienakte-uebergabe/1', quelle: 'Private Brain Pro', dateien: [{ name: mail.file.name, sha256: mail.sha256, lebensbereich: 'Wohnen', dokumentart: 'Rechnung', vorgang: 'E-Mail › Rechnung', hinweis: 'Absender: Erfundene Stadtwerke', ...zeile }] });
        const file = new File([inhalt], 'familienakte-uebergabe.json', { type: 'application/json' });
        const m = await api.proUebergabeBauen(file, quelle, 'familienakte', `vorsortierung-${++nr}`, `t-begleit-${nr}`); return { file, m }; },
      fall: async id => (await eingangAblage()).find(e => e.id === id),
      istGleich: async () => sha,
    };
  });
  await step('Vorsortierung: Mail zuerst, dann Begleitdatei – Vorschlag steht am Eingang der Mail, kein neuer Eingang', async () => page.evaluate(async () => {
    const b = window.__b, mail = await b.mail('Bitte zahlen.'), q = await mail.annehmen(), vorher = await b.zahl();
    const s = await b.begleitdatei(mail), g = await b.begleit.proBegleitAnnehmen(s.m, s.file);
    await b.begleit.proBegleitAnnehmen(s.m, s.file); // wiederholbar
    const lauf = await b.begleit.proBegleitAbgleichen(), fall = await b.fall(q.eingangId), rec = await b.beleg(g.id);
    if (JSON.stringify(vorher) !== JSON.stringify(await b.zahl())) throw new Error('Begleitdatei wurde als Eingang oder Datei angelegt');
    if (lauf.staende[g.id]?.stand !== 'zugeordnet' || rec.stand !== 'zugeordnet' || rec.file) throw new Error('Stand ' + JSON.stringify(lauf));
    const v = fall.uebergabeVorschlag;
    if (!v || v.quelle !== 'Private Brain Pro' || v.lebensbereich !== 'Wohnen' || v.dokumentart !== 'Rechnung' || v.vorgang !== 'E-Mail › Rechnung' || !fall.proUebergabe) throw new Error('Vorschlag ' + JSON.stringify(v));
    if ((await b.eingangAblage()).some(e => /familienakte-uebergabe\.json/i.test(e.file.name))) throw new Error('Begleitdatei steht im Eingang');
    return true;
  }));
  await step('Vorsortierung: Begleitdatei zuerst – wartet, nach der Mail steht der Vorschlag da', async () => page.evaluate(async () => {
    const b = window.__b, mail = await b.mail('Kommt später.'), s = await b.begleitdatei(mail, { lebensbereich: 'Gesundheit' });
    const g = await b.begleit.proBegleitAnnehmen(s.m, s.file), frueh = await b.begleit.proBegleitAbgleichen();
    if (frueh.staende[g.id]?.stand !== 'wartet' || !((await b.beleg(g.id)).file instanceof File)) throw new Error('wartet nicht: ' + JSON.stringify(frueh));
    const q = await mail.annehmen(), spaet = await b.begleit.proBegleitAbgleichen(), fall = await b.fall(q.eingangId);
    if (spaet.staende[g.id]?.stand !== 'zugeordnet' || fall.uebergabeVorschlag?.lebensbereich !== 'Gesundheit') throw new Error(JSON.stringify([spaet, fall.uebergabeVorschlag]));
    return true;
  }));
  await step('Vorsortierung: schon geprüfte oder abgelegte Mail bleibt unverändert', async () => page.evaluate(async () => {
    const b = window.__b, mail = await b.mail('Schon abgelegt.'), q = await mail.annehmen();
    await b.eingangAblage(alle => alle.map(e => e.id === q.eingangId ? { ...e, status: 'Übernommen', savedDocumentId: 'dok-erfunden' } : e));
    const vorher = JSON.stringify(await b.fall(q.eingangId)), s = await b.begleitdatei(mail), g = await b.begleit.proBegleitAnnehmen(s.m, s.file);
    const lauf = await b.begleit.proBegleitAbgleichen();
    if (lauf.staende[g.id]?.stand !== 'zu-spaet' || vorher !== JSON.stringify(await b.fall(q.eingangId))) throw new Error(JSON.stringify(lauf));
    // Auch ein inzwischen entfernter Eingang wird nicht wieder angelegt.
    const weg = await b.mail('Entfernt.'), qw = await weg.annehmen(); await b.eingangAblage(alle => alle.filter(e => e.id !== qw.eingangId));
    const sw = await b.begleitdatei(weg), gw = await b.begleit.proBegleitAnnehmen(sw.m, sw.file), lw = await b.begleit.proBegleitAbgleichen();
    if (lw.staende[gw.id]?.stand !== 'zu-spaet' || await b.fall(qw.eingangId)) throw new Error(JSON.stringify(lw));
    return true;
  }));
  await step('Vorsortierung: falsche Prüfsumme wartet ohne Wirkung und verfällt nach 30 Tagen', async () => page.evaluate(async () => {
    const b = window.__b, mail = await b.mail('Falsche Summe.'), q = await mail.annehmen();
    const s = await b.begleitdatei(mail, { sha256: '0'.repeat(64) }), g = await b.begleit.proBegleitAnnehmen(s.m, s.file);
    const jetzt = await b.begleit.proBegleitAbgleichen();
    if (jetzt.staende[g.id]?.stand !== 'wartet' || (await b.fall(q.eingangId)).uebergabeVorschlag) throw new Error(JSON.stringify(jetzt));
    const spaeter = await b.begleit.proBegleitAbgleichen(Date.now() + 31 * 86400000), rec = await b.beleg(g.id);
    if (spaeter.staende[g.id]?.stand !== 'verfallen' || rec.stand !== 'verfallen' || rec.file || (await b.fall(q.eingangId)).uebergabeVorschlag) throw new Error(JSON.stringify(spaeter));
    return true;
  }));
  await step('Vorsortierung: kaputtes JSON, zu groß und fremde Quelle legen nichts an', async () => page.evaluate(async () => {
    const b = window.__b, mail = await b.mail('Unbrauchbar.'), q = await mail.annehmen(), vorher = await b.zahl();
    for (const roh of ['{kein json', JSON.stringify({ vertrag: 'familienakte-uebergabe/1', dateien: [], fuell: 'x'.repeat(64 * 1024) }), JSON.stringify({ vertrag: 'falsch', dateien: [] })]) {
      const s = await b.begleitdatei(mail, {}, { roh }), g = await b.begleit.proBegleitAnnehmen(s.m, s.file), rec = await b.beleg(g.id);
      if (rec.stand !== 'unbrauchbar' || rec.file || !rec.grund) throw new Error('nicht als unbrauchbar gemerkt: ' + JSON.stringify(rec));
    }
    const fremd = await b.begleitdatei(mail, {}, { quelle: 'bookledgerpro' }); let abgelehnt = false;
    try { await b.begleit.proBegleitAnnehmen(fremd.m, fremd.file); } catch { abgelehnt = true; }
    await b.begleit.proBegleitAbgleichen();
    if (!abgelehnt || JSON.stringify(vorher) !== JSON.stringify(await b.zahl()) || (await b.fall(q.eingangId)).uebergabeVorschlag) throw new Error('fremde Quelle oder unbrauchbare Datei hatte Wirkung');
    return true;
  }));
} finally { await browser.close(); await app.stop(); }
process.exit(summary('Pro-Übergabe in echter Browser-Datenbank'));
