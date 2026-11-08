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

  // Fähnchen „Update verfügbar“ an der Versionszeile (2.28.39, Klaus 08.11.2026: kein Update-Knopf im Kopf mehr; die App
  // prüft selbst beim Start und gelegentlich, nur bei eingeschaltetem Internet). Die Oberfläche liest den Stand aus
  // <html data-update-verfuegbar> und dem Ereignis „familienakte:update“ (app/update-fahne.tsx).
  let updateNeu = '';
  function fahne(an, neu) {
    updateNeu = an ? String(neu || '') : '';
    if (an) document.documentElement.dataset.updateVerfuegbar = updateNeu || 'ja';
    else delete document.documentElement.dataset.updateVerfuegbar;
    window.dispatchEvent(new CustomEvent('familienakte:update', { detail: { verfuegbar: !!an, neu: updateNeu } }));
  }
  // 2. Service Worker und Aktualisierung
  let wartendeRegistrierung = null;
  function jetztNeuLaden(registration) {
    const waiting = registration?.waiting; if (!waiting) { location.reload(); return; }
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    waiting.postMessage({ typ: 'jetzt-aktivieren' });
  }
  // Eine neue Fassung der Web-App wartet: nur das Fähnchen, keine Leiste (Antippen lädt neu).
  function neueVersion(registration) { wartendeRegistrierung = registration; fahne(true); }
  if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.() && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) neueVersion(registration);
        registration.addEventListener('updatefound', () => {
          const neu = registration.installing; if (!neu) return;
          neu.addEventListener('statechange', () => { if (neu.state === 'installed' && navigator.serviceWorker.controller) neueVersion(registration); });
        });
        // Nur bei eingeschaltetem Internet nach einer neuen Fassung fragen (beim Start, alle 6 Stunden und nach dem Einschalten).
        const pruefen = () => { if (!offline()) registration.update().catch(() => {}); };
        window.addEventListener('pb:network', (e) => { if (!e.detail?.offline) pruefen(); });
        setInterval(pruefen, 6 * 60 * 60 * 1000);
        window.PBNetwork?.initialized?.then(pruefen).catch(() => {});
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
  const zustellen = ({ files, resolve }) => {
    window.dispatchEvent(new CustomEvent('familienakte:dateien', { detail: { files, bestaetigen: resolve } }));
  };
  window.addEventListener('familienakte:bereit', () => { bereit = true; for (const auftrag of wartend.splice(0)) zustellen(auftrag); });
  async function dateienUebergeben(files) {
    // Externe echte Eingänge gehören zur eigenen Akte, nie automatisch zur Demo.
    if (new URLSearchParams(location.search).has('demo') || !files?.length) return false;
    return new Promise((resolve) => {
      const auftrag = { files, resolve };
      if (!bereit) wartend.push(auftrag);
      else zustellen(auftrag);
    });
  }
  // PWA: Androids „Teilen“ kommt als POST an ./teilen-empfang (share_target); der Service Worker legt die
  // Dateien in den Vorrat „familienakte-geteilt“ und leitet auf ./?geteilt=1 weiter.
  if (new URLSearchParams(location.search).get('geteilt') === '1' && 'caches' in window) {
    (async () => {
      try {
        const cache = await caches.open('familienakte-geteilt');
        const files = []; const requests = [];
        for (const request of await cache.keys()) {
          const response = await cache.match(request);
          if (!response) continue;
          const name = decodeURIComponent(response.headers.get('x-name') || 'Geteilte Datei');
          files.push(new File([await response.blob()], name, { type: response.headers.get('content-type') || 'application/octet-stream' }));
          requests.push(request);
        }
        if (files.length && await dateienUebergeben(files)) {
          for (const request of requests) await cache.delete(request);
        } else return;
      } catch { return; /* Vorrat und Wiederaufnahme-Adresse bleiben erhalten */ }
      try { history.replaceState(history.state, '', location.pathname + location.hash); } catch { /* egal */ }
    })();
  }
  // Update auf Wunsch (Tipp auf das Fähnchen „Update verfügbar“): in den Apps dieselbe Prüfung wie der Tipp auf die
  // Versionszeile; in der PWA lädt eine wartende Fassung sofort neu, sonst fragt der Service Worker. Nur bei Internet an.
  async function aktualisieren() {
    if (wartendeRegistrierung?.waiting) { hinweis('Neue Fassung wird geladen …', 0); jetztNeuLaden(wartendeRegistrierung); return; }
    if (offline()) { hinweis('Internet für die App ist aus. Oben in der Kopfleiste einschalten, dann erneut prüfen.', 6000); return; }
    const app = window.FamilienakteAndroid || window.FamilienakteWindows;
    if (app?.updatePruefen) { app.updatePruefen(); return; }
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration().catch(() => null) : null;
    if (!reg) { location.reload(); return; }
    hinweis('Prüfung läuft …', 0);
    try { await reg.update(); } catch { /* unten gemeldet */ }
    if (reg.waiting) { hinweis('Neue Fassung wird geladen …', 0); jetztNeuLaden(reg); return; }
    if (reg.installing) { hinweis('Neue Fassung wird geladen …', 0); return; }
    fahne(false);
    hinweis(`Du verwendest die aktuelle Fassung ${VERSION || ''}.`.replace(' .', '.'), 6000);
  }
  window.FamilienakteApp = { build: BUILD, version: VERSION, hinweis, dateienUebergeben, aktualisieren, fahne, updateVerfuegbar: () => !!document.documentElement.dataset.updateVerfuegbar };
})();
