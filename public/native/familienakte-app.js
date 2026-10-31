/* Familienakte: Klebstoff der Hülle (PWA, Android, Windows). Läuft NACH native/native-network.js.
   1. window.open nach außen nur bei eingeschaltetem Internet (ChatGPT-Seite, Links).
   2. Service Worker anmelden (Offline-Vorrat) und „Neue Version verfügbar“ anzeigen.
   3. Bau-Kennung aus <meta name="familienakte-build"> als Tipp an der Versionszeile.
   Die Oberfläche des Freundes bleibt unverändert; die Hinweisleiste hängt am <body>. */
(() => {
  'use strict';
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
  const BUILD = meta('familienakte-build'), VERSION = meta('familienakte-version');
  const isRemote = (value) => { try { const u = new URL(value, location.href); return /^(https?|wss?):$/.test(u.protocol) && u.origin !== location.origin; } catch { return true; } };
  const offline = () => !window.PBNetwork || !window.PBNetwork.ready || window.PBNetwork.offline;

  // In der Android- und der Windows-App läuft die Seite nicht im Browser: der Installieren-Knopf der PWA (installieren.js)
  // bleibt dort weg; im Browser verschwindet er von selbst, sobald die Seite als installierte App läuft.
  if (window.Capacitor?.isNativePlatform?.() || window.__TAURI__) document.documentElement.classList.add('app-installiert');

  // 1. Fremde Fenster nur mit Internet
  const originalOpen = window.open.bind(window);
  window.open = function (url, ...rest) {
    if (url && isRemote(String(url)) && offline()) {
      hinweis('Internet für die App ist aus. Oben in der Kopfleiste einschalten, dann erneut versuchen.', 6000);
      return null;
    }
    return originalOpen(url, ...rest);
  };

  // Hinweisleiste (eine Zeile unten), ohne Eingriff in die React-Oberfläche
  let leiste = null, leisteTimer = null;
  function hinweis(text, dauer, aktion) {
    if (!leiste) {
      leiste = document.createElement('div');
      leiste.className = 'familienakte-hinweis';
      leiste.setAttribute('role', 'status');
      leiste.innerHTML = '<span></span><button type="button"></button><button type="button" class="familienakte-hinweis-zu" aria-label="Hinweis schließen">×</button>';
      leiste.querySelector('.familienakte-hinweis-zu').addEventListener('click', () => leiste.remove());
      document.body.appendChild(leiste);
    } else if (!leiste.isConnected) document.body.appendChild(leiste);
    leiste.querySelector('span').textContent = text;
    const knopf = leiste.querySelector('button:not(.familienakte-hinweis-zu)');
    if (aktion) { knopf.hidden = false; knopf.textContent = aktion.text; knopf.onclick = aktion.run; } else knopf.hidden = true;
    clearTimeout(leisteTimer);
    if (dauer) leisteTimer = setTimeout(() => leiste.remove(), dauer);
  }

  // 2. Service Worker und Aktualisierung
  function neueVersion(registration) {
    hinweis('Neue Version verfügbar.', 0, { text: 'Jetzt neu laden', run: () => {
      const waiting = registration.waiting; if (!waiting) { location.reload(); return; }
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      waiting.postMessage({ typ: 'jetzt-aktivieren' });
    } });
  }
  if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.() && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) neueVersion(registration);
        registration.addEventListener('updatefound', () => {
          const neu = registration.installing; if (!neu) return;
          neu.addEventListener('statechange', () => { if (neu.state === 'installed' && navigator.serviceWorker.controller) neueVersion(registration); });
        });
        // Nur bei eingeschaltetem Internet nach einer neuen Fassung fragen (alle 6 Stunden und nach dem Einschalten).
        const pruefen = () => { if (!offline()) registration.update().catch(() => {}); };
        window.addEventListener('pb:network', (e) => { if (!e.detail?.offline) pruefen(); });
        setInterval(pruefen, 6 * 60 * 60 * 1000);
      }).catch(() => { /* ohne Worker läuft die App weiter, nur ohne Offline-Vorrat */ });
    });
  }

  // 3. Bau-Kennung sichtbar als Tipp
  const stempel = () => {
    const el = document.querySelector('.site-brand-version');
    if (el && BUILD && !el.title) el.title = `Fassung ${VERSION || ''} · Bau ${BUILD}`.replace(/\s+/g, ' ').trim();
  };
  new MutationObserver(stempel).observe(document.documentElement, { childList: true, subtree: true });
  stempel();
  // Übergabe von Dateien aus Hüllen (Android-Teilen, PWA share_target, Windows „Öffnen mit“) an die Eingangszentrale.
  // Die React-Seite meldet sich mit `familienakte:bereit`; bis dahin werden Dateien aufgehoben.
  let bereit = false; const wartend = [];
  window.addEventListener('familienakte:bereit', () => { bereit = true; for (const files of wartend.splice(0)) window.dispatchEvent(new CustomEvent('familienakte:dateien', { detail: { files } })); });
  async function dateienUebergeben(files) {
    if (!files?.length) return false;
    if (!bereit) { wartend.push(files); return true; }
    window.dispatchEvent(new CustomEvent('familienakte:dateien', { detail: { files } }));
    return true;
  }
  // PWA: Androids „Teilen“ kommt als POST an ./teilen-empfang (share_target); der Service Worker legt die
  // Dateien in den Vorrat „familienakte-geteilt“ und leitet auf ./?geteilt=1 weiter.
  if (new URLSearchParams(location.search).get('geteilt') === '1' && 'caches' in window) {
    (async () => {
      try {
        const cache = await caches.open('familienakte-geteilt');
        const files = [];
        for (const request of await cache.keys()) {
          const response = await cache.match(request);
          if (!response) continue;
          const name = decodeURIComponent(response.headers.get('x-name') || 'Geteilte Datei');
          files.push(new File([await response.blob()], name, { type: response.headers.get('content-type') || 'application/octet-stream' }));
          await cache.delete(request);
        }
        if (files.length) await dateienUebergeben(files);
      } catch { /* ohne Vorrat kam nichts an */ }
      try { history.replaceState(null, '', location.pathname); } catch { /* egal */ }
    })();
  }
  // Knopf „Aktualisieren“ oben (zwei Pfeile im Kreis): in den Apps dieselbe Prüfung wie der Tipp auf die Versionszeile,
  // in der PWA fragt der Service Worker nach einer neuen Fassung. Nur bei eingeschaltetem Internet.
  async function aktualisieren() {
    if (offline()) { hinweis('Internet für die App ist aus. Oben in der Kopfleiste einschalten, dann erneut prüfen.', 6000); return; }
    const app = window.FamilienakteAndroid || window.FamilienakteWindows;
    if (app?.updatePruefen) { app.updatePruefen(); return; }
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration().catch(() => null) : null;
    if (!reg) { location.reload(); return; }
    hinweis('Prüfung läuft …', 0);
    try { await reg.update(); } catch { /* unten gemeldet */ }
    if (reg.waiting || reg.installing) { if (reg.waiting) neueVersion(reg); else hinweis('Neue Fassung wird geladen …', 0); return; }
    hinweis(`Du verwendest die aktuelle Fassung ${VERSION || ''}.`.replace(' .', '.'), 6000);
  }
  window.FamilienakteApp = { build: BUILD, version: VERSION, hinweis, dateienUebergeben, aktualisieren };
})();
