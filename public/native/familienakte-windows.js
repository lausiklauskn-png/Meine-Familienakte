/* Familienakte: Klebstoff der Windows-Hülle (Tauri 2, WebView2). Läuft nur in der Windows-App (window.__TAURI__),
   MUSS vor familienakte-netz.js laufen: er stellt eine kleine Capacitor-Brücke, damit native-network.js (byte-gleich
   aus Private Brain Pro) die Tauri-IPC-Adressen als „eigenes Gerät“ erkennt und den Zustand aus dem localStorage nimmt.
   Außerdem: Diktat über die Windows-Spracherkennung (SAPI), „Öffnen mit“ (Startdateien) und der Update-Weg über die
   Versionszeile (Klaus 2026-10-28: „wie bei Private Brain Pro im Versionsknopf“). */
(() => {
  'use strict';
  const tauri = window.__TAURI__;
  if (!tauri?.core?.invoke) return;
  const invoke = tauri.core.invoke;
  const KEY = 'familienakte-internet';
  const read = () => { try { return localStorage.getItem(KEY) === 'an' ? false : true; } catch { return true; } };
  const write = (offline) => { try { localStorage.setItem(KEY, offline ? 'aus' : 'an'); } catch { /* bleibt aus */ } };
  window.Capacitor = {
    getPlatform: () => 'windows', isNativePlatform: () => true,
    Plugins: { ProNetwork: { async getState() { return { offline: read() }; }, async setOffline({ offline }) { if (typeof offline !== 'boolean') throw new Error('INVALID_INPUT'); write(offline); return { offline: read() }; } } }
  };

  // Diktat über SAPI, einmal je Tipp (oneShot), auch bei Internet „aus“ (läuft auf dem Gerät).
  class WindowsSpeech {
    constructor() { this.lang = 'de-DE'; this.interimResults = false; this.continuous = false; this.oneShot = true; this.onstart = null; this.onend = null; this.onresult = null; this.onerror = null; this._stopped = false; }
    start() {
      this._stopped = false; this.onstart?.();
      invoke('fa_diktat', { language: /^[a-z]{2}-[A-Z]{2}$/.test(this.lang) ? this.lang : 'de-DE' }).then((result) => {
        if (this._stopped) return;
        const text = (result?.text || '').trim();
        if (text) this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal: true, length: 1 })] });
        else this.onerror?.({ error: 'no-speech' });
        this.onend?.();
      }).catch((error) => {
        if (this._stopped) return;
        const code = String(error || '');
        this.onerror?.({ error: /UNAVAILABLE/.test(code) ? 'audio-capture' : /BUSY/.test(code) ? 'aborted' : 'not-allowed' });
        this.onend?.();
      });
    }
    stop() { this._stopped = true; invoke('fa_diktat_abbrechen').catch(() => {}); this.onend?.(); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = WindowsSpeech; window.webkitSpeechRecognition = WindowsSpeech;
  window.FamilienakteDiktat = { offlineFaehig: true, art: 'windows-sapi' };

  // „Öffnen mit“ und zweite Instanz: Dateien aus den Startargumenten in die Eingangszentrale.
  const bytes = (b64) => { const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
  const uebergeben = (liste) => { const files = (liste || []).map((d) => new File([bytes(d.data)], d.name)); if (files.length) window.FamilienakteApp?.dateienUebergeben?.(files); };
  const startdateien = () => invoke('fa_startdateien').then((r) => uebergeben(r?.dateien)).catch(() => {});
  window.addEventListener('familienakte:bereit', startdateien, { once: true });
  tauri.event?.listen?.('familienakte:startdateien', (ev) => uebergeben(ev?.payload?.dateien)).catch?.(() => {});

  // Update über die Versionszeile (Klaus 2026-10-28: „wie bei Private Brain Pro im Versionsknopf“, seit 2026-10-28 vom
  // eigenen Server wie BookLedgerPro): die Hülle holt aktuell-windows.json von family-projekt.de, glaubt nur der Ed25519-
  // Unterschrift, nimmt nur eine neuere Fassung, lädt das Setup mit Größe + SHA-256 und startet es. Nur bei Internet an.
  const offline = () => !window.PBNetwork || !window.PBNetwork.ready || window.PBNetwork.offline;
  const MELDUNG = {
    UPDATE_NICHT_ERREICHBAR: 'Updateprüfung derzeit nicht möglich. Verbindung prüfen und später erneut versuchen.',
    UPDATE_UNTERSCHRIFT_FALSCH: 'Die Update-Angaben auf dem Server sind nicht richtig unterschrieben. Es wird nichts geladen.',
    UPDATE_UNGUELTIG: 'Die Update-Angaben auf dem Server sind unvollständig. Es wird nichts geladen.',
    UPDATE_BESCHAEDIGT: 'Das geladene Setup stimmt nicht mit der Prüfsumme überein und wurde verworfen.',
    UPDATE_NICHT_EINGERICHTET: 'Updates vom Server sind in dieser Fassung noch nicht eingerichtet.',
    UPDATE_SPEICHER: 'Das Setup konnte nicht gespeichert werden.',
    UPDATE_START: 'Das Setup konnte nicht gestartet werden.',
    UPDATE_NICHT_GEPRUEFT: 'Bitte zuerst erneut auf eine neue Fassung prüfen.'
  };
  const fehler = (app, e) => app.hinweis(MELDUNG[String(e)] || MELDUNG.UPDATE_NICHT_ERREICHBAR, 8000);
  const mb = (n) => (n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' MB';
  tauri.event?.listen?.('familienakte:update-stand', (ev) => {
    const d = ev?.payload; if (d?.groesse) window.FamilienakteApp?.hinweis(`Setup wird geladen … ${mb(d.geladen)} von ${mb(d.groesse)}`, 0);
  })?.catch?.(() => {});
  async function installieren() {
    const app = window.FamilienakteApp; if (!app) return;
    if (offline()) { app.hinweis('Internet für die App ist aus – zum Laden oben einschalten.', 8000); return; }
    app.hinweis('Setup wird geladen …', 0);
    try { await invoke('fa_update_installieren'); } catch (e) { fehler(app, e); }
  }
  async function updatePruefen() {
    const app = window.FamilienakteApp; if (!app) return;
    const ich = await invoke('fa_plattform').then((p) => p?.fassung || app.version).catch(() => app.version);
    if (offline()) { app.hinweis(`Fassung ${ich} (Windows). Internet für die App ist aus – zum Prüfen auf eine neue Fassung oben einschalten.`, 8000); return; }
    app.hinweis(`Fassung ${ich} (Windows). Prüfung läuft …`, 0);
    try {
      const r = await invoke('fa_update_pruefen');
      if (r?.neu) app.hinweis(`Neu: Fassung ${r.neu} (du hast ${r.installiert}), ${mb(r.groesse)}.`, 0, { text: 'Laden und installieren', run: installieren });
      else app.hinweis(`Du verwendest die aktuelle Fassung ${r?.version || ich}.`, 6000);
    } catch (e) { fehler(app, e); }
  }
  const versionsknopf = () => {
    const el = document.querySelector('.site-brand-version');
    if (!el || el.dataset.update) return;
    el.dataset.update = '1'; el.style.cursor = 'pointer'; el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.title = 'Auf eine neue Fassung prüfen';
    const handler = (e) => { e.preventDefault(); e.stopPropagation(); updatePruefen(); };
    el.addEventListener('click', handler); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
  };
  new MutationObserver(versionsknopf).observe(document.documentElement, { childList: true, subtree: true });
  versionsknopf();
  window.FamilienakteWindows = { updatePruefen, installieren, uebergeben };
})();
