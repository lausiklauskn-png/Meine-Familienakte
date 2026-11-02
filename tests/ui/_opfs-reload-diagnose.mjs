// Kleine Browserprobe ohne App: im OPFS gewählten Ordner nach Seitenneustart aus IndexedDB lesen.
import { startApp, launchBrowser } from './_harness.mjs';
const app = await startApp(), browser = await launchBrowser({ channel: 'chromium' });
try {
  const page = await browser.newPage();
  page.on('console', m => console.log('OPFS:', m.text()));
  await page.route('**/opfs-probe.html', r => r.fulfill({ contentType: 'text/html', body: '<html><body>OPFS-Probe</body></html>' }));
  await page.goto(app.base + 'opfs-probe.html');
  async function db() {
    return new Promise((ok, no) => { const r = indexedDB.open('opfs-reload', 1); r.onupgradeneeded = () => r.result.createObjectStore('handles'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  }
  await page.evaluate('window.openTestDb = ' + db.toString());
  await page.evaluate(async () => {
    const d = await window.openTestDb(), h = await (await navigator.storage.getDirectory()).getDirectoryHandle('Erfundener-Ordner', { create: true });
    await new Promise((ok, no) => { const t = d.transaction('handles', 'readwrite'); t.objectStore('handles').put(h, 'probe'); t.oncomplete = ok; t.onabort = no; }); d.close();
  });
  console.log('OPFS: Ordner gespeichert');
  await page.reload();
  await page.evaluate('window.openTestDb = ' + db.toString());
  await page.evaluate(async () => {
    const d = await window.openTestDb(); console.log('DB offen');
    const h = await new Promise((ok, no) => { const r = d.transaction('handles').objectStore('handles').get('probe'); r.onsuccess = () => ok(r.result); r.onerror = no; });
    console.log('Handle gelesen', h.name); console.log('Berechtigung', await h.queryPermission({ mode: 'readwrite' }));
    await h.getFileHandle('Probe.txt', { create: true }); console.log('Datei anlegbar'); d.close();
  });
} finally { await browser.close(); await app.stop(); }
