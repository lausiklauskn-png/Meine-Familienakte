// Prüft den tatsächlichen Hüllenklebstoff: Ereignisversand ist noch keine dauerhafte Annahme.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
class CustomEvent extends Event { constructor(name, options) { super(name); this.detail = options?.detail; } }
const window = new EventTarget(); window.open = () => null;
const context = vm.createContext({ window, document: { querySelector: () => null, documentElement: {}, },
  MutationObserver: class { observe() {} }, navigator: {}, location: { search: '', protocol: 'https:' }, URL, URLSearchParams, CustomEvent,
  setTimeout, clearTimeout, setInterval });
vm.runInContext(readFileSync('public/native/familienakte-app.js', 'utf8'), context);
let empfang = null;
window.addEventListener('familienakte:dateien', event => { empfang = event.detail; });
let fertig = false;
const vorher = window.FamilienakteApp.dateienUebergeben([{ name: 'Erfundene.pdf' }]).then(ok => { fertig = true; return ok; });
await Promise.resolve(); assert.equal(fertig, false); assert.equal(empfang, null);
window.dispatchEvent(new Event('familienakte:bereit'));
assert.equal(empfang.files[0].name, 'Erfundene.pdf');
await Promise.resolve(); assert.equal(fertig, false, 'Ereignisversand ist keine Annahme');
empfang.bestaetigen(false); assert.equal(await vorher, false);
const angenommen = window.FamilienakteApp.dateienUebergeben([{ name: 'Erfunden2.pdf' }]);
empfang.bestaetigen(true); assert.equal(await angenommen, true);
assert.equal(await window.FamilienakteApp.dateienUebergeben([]), false);
console.log('Hülleneingang: vor Bereitschaft warten, Annahme abwarten, Fehler/Erfolg weitergeben grün');
