// The unchanged canonical DB module is loaded after the real Familienakte bridge.
// Any IndexedDB access by a bound edit session is a failure, not a mock success.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
const bruecke = readFileSync('public/apps/fa-wfpdf-bruecke.js', 'utf8');
const dbQuelle = readFileSync('public/apps/workflow-pdf/assets/db.js', 'utf8');
function raum(code = bruecke) {
  const context = createContext({ URLSearchParams, URL, structuredClone, setTimeout, clearTimeout, TextEncoder, console });
  runInContext(`
    const hooks = {}; const zugriffe = { db: 0 };
    class Storage { constructor(){this.backing=new Map()} getItem(k){return this.backing.get(String(k))??null} setItem(k,v){this.backing.set(String(k),String(v))} removeItem(k){this.backing.delete(String(k))} }
    class IDBFactory { open(){zugriffe.db++;throw new Error('Unerlaubter permanenter Dokumentzugriff')} deleteDatabase(){zugriffe.db++;throw new Error('Unerlaubtes Löschen')} }
    const location={search:'?akte=1',origin:'https://example.invalid',protocol:'https:'};
    const document={documentElement:{setAttribute(){}}};
    const navigator={}; const indexedDB=new IDBFactory();
    const window={parent:{postMessage(){}},Storage,IDBFactory,document,navigator,indexedDB,location,addEventListener(n,f){(hooks[n]??=[]).push(f)}};
    const localStorage=window.localStorage=new Storage(); const sessionStorage=window.sessionStorage=new Storage();
    globalThis.probe={window,localStorage,sessionStorage,zugriffe};
  `, context);
  runInContext(code, context);
  runInContext(dbQuelle, context);
  return context.probe;
}
async function messen(code) {
  const p = raum(code), db = p.window.WFP.DB;
  await db.put('docs', { id: 'quelle', name: 'Erfundene Bearbeitung' });
  await db.putFile('quelle', new Uint8Array([1, 2, 3]));
  assert.equal((await db.all('docs')).length, 1);
  const b = await db.getFile('quelle'); b[0] = 99;
  assert.equal((await db.getFile('quelle'))[0], 1, 'gelesene Kopie ändert keine Arbeitsbytes');
  await db.put('texte', { id: 'quelle', text: 'veraltet' });
  await db.put('vektoren', { id: 'quelle#00001', v: [1] });
  await db.putFile('quelle', new Uint8Array([4]));
  assert.equal(await db.get('texte', 'quelle'), undefined);
  assert.equal((await db.keys('vektoren')).length, 0);
  p.localStorage.setItem('wfpdf_notstand_v1', 'PRIVATE-ARBEITSWERTE');
  p.sessionStorage.setItem('wfpdf_weiter_v1', 'PRIVATE-ARBEITSKENNUNG');
  assert.equal(p.localStorage.getItem('wfpdf_notstand_v1'), 'PRIVATE-ARBEITSWERTE');
  assert.equal(p.localStorage.backing.size, 0); assert.equal(p.sessionStorage.backing.size, 0);
  p.localStorage.setItem('wfpdf_einst_v1', 'bewusst gemerkte Einstellungen');
  assert.equal(p.localStorage.backing.get('fa_wfpdf_einst_v1'), 'bewusst gemerkte Einstellungen');
  assert.equal(await db.persist(), false);
  assert.equal(p.zugriffe.db, 0, 'keine zweite dauerhafte Dokumentablage');
  assert.equal((await raum().window.WFP.DB.all('docs')).length, 0, 'neuer Raum übernimmt keinen privaten Arbeitsbestand');
}
await messen(bruecke);
const ohneRaum = bruecke.replace(/var arbeitsraum = [^;]+;/, 'var arbeitsraum = false;');
assert.notEqual(ohneRaum, bruecke);
await assert.rejects(() => messen(ohneRaum), /Unerlaubter permanenter Dokumentzugriff/, 'Gegenprobe muss eine zweite dauerhafte Bibliothek entdecken');
console.log('PDF-Arbeitsraum: echte Brücke + kanonisches DB-Modul, nur Speicher im Frame, keine Notstandsdaten auf Platte, getrennte Einstellungen, Ableitungen und Gegenprobe bestanden.');
