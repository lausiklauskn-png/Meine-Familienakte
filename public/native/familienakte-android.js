/* Familienakte: Klebstoff der Android-Hülle (Capacitor). Läuft nur in der App, nie im Browser.
   1. Diktat: Androids Sprachfenster (Plugin ProSpeech) als Ersatz für die fehlende Web Speech API, als
      Einmal-Erkennung (oneShot) an den vorhandenen Diktatknöpfen; erlaubt auch bei Internet „aus“ (Gerät).
   2. Teilen → Familienakte: geteilte Dateien (Plugin FamilienakteShare) landen in der Eingangszentrale.
   3. Updates vom eigenen Server (Plugin FamilienakteUpdates, Klaus 2026-10-28): Tipp auf die Versionszeile.
   Offener Vertrag für andere Apps: docs/UEBERGABE.md. */
(() => {
  'use strict';
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  const P = cap.Plugins || {};

  // 1 · Diktat über das Sprachfenster des Systems
  // Die Android-WebView hat keine Web Speech API; in der App ersetzt das Sprachfenster sie immer.
  if (P.ProSpeech?.listen) {
    class FamilienakteSpeech {
      constructor() { this.lang = 'de-DE'; this.interimResults = false; this.continuous = false; this.oneShot = true; this.onstart = null; this.onend = null; this.onresult = null; this.onerror = null; this._stopped = false; }
      start() {
        this._stopped = false;
        this.onstart?.();
        P.ProSpeech.listen({ language: /^[a-z]{2}-[A-Z]{2}$/.test(this.lang) ? this.lang : 'de-DE', prompt: 'Sprechen Sie jetzt' }).then((result) => {
          if (this._stopped) return;
          const text = (result?.text || '').trim();
          if (text) this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal: true, length: 1 })] });
          else this.onerror?.({ error: 'no-speech' });
          this.onend?.();
        }).catch((error) => {
          if (this._stopped) return;
          const code = String(error?.code || error?.message || '');
          this.onerror?.({ error: /UNAVAILABLE/.test(code) ? 'audio-capture' : /BUSY/.test(code) ? 'aborted' : 'not-allowed' });
          this.onend?.();
        });
      }
      stop() { this._stopped = true; this.onend?.(); }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = FamilienakteSpeech; window.webkitSpeechRecognition = FamilienakteSpeech;
    window.FamilienakteDiktat = { offlineFaehig: true, art: 'android-sprachfenster' };
    // Schon gezeichnete Diktatknöpfe prüfen ihre Verfügbarkeit bei diesem Ereignis neu.
    window.dispatchEvent(new Event('pb:network'));
  }

  // 2 · Geteilte Dateien in die Eingangszentrale
  const share = P.FamilienakteShare;
  function bytesFromBase64(text) { const bin = atob(text); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  async function readShared(item) {
    const parts = []; let offset = 0;
    for (;;) { const { data } = await share.read({ id: item.id, offset }); if (!data) break; const bytes = bytesFromBase64(data); if (!bytes.length) break; parts.push(bytes); offset += bytes.length; if (offset >= item.size) break; }
    return new File(parts, item.name, { type: item.mime || 'application/octet-stream' });
  }
  let holt = false;
  async function abholen() {
    if (!share?.pending || holt) return; holt = true;
    try {
      const { items = [], refused = 0 } = await share.pending();
      const files = [];
      for (const item of items) { try { files.push(await readShared(item)); } catch { /* bleibt im Eingang der App, nächster Versuch */ } }
      if (files.length) {
        const zugestellt = await window.FamilienakteApp?.dateienUebergeben?.(files);
        if (zugestellt) for (const item of items) { try { await share.done({ id: item.id }); } catch { /* wird beim nächsten Start geräumt */ } }
      }
      if (refused) window.FamilienakteApp?.hinweis?.(`${refused} geteilte Datei(en) konnten nicht gelesen werden.`, 8000);
    } finally { holt = false; }
  }
  if (share) {
    share.addListener?.('shared', () => { abholen(); });
    window.addEventListener('familienakte:bereit', () => { abholen(); }, { once: true });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') abholen(); });
    setTimeout(abholen, 1500);
  }
  // 3 · Updates vom eigenen Server: Tipp auf die Versionszeile. Die Hülle glaubt nur der Ed25519-Unterschrift, nimmt nur eine
  // neuere Fassung (Name und versionCode), lädt mit Größe + SHA-256 und öffnet Androids Installieren-Fenster erst, wenn
  // Paket und Zertifikat der neuen APK zur installierten App passen. Nur bei Internet an.
  const upd = P.FamilienakteUpdates;
  const offline = () => !window.PBNetwork || !window.PBNetwork.ready || window.PBNetwork.offline;
  const MELDUNG = {
    UPDATE_NICHT_ERREICHBAR: 'Updateprüfung derzeit nicht möglich. Verbindung prüfen und später erneut versuchen.',
    UPDATE_OFFLINE: 'Internet für die App ist aus – zum Prüfen auf eine neue Fassung oben einschalten.',
    UPDATE_UNTERSCHRIFT_FALSCH: 'Die Update-Angaben auf dem Server sind nicht richtig unterschrieben. Es wird nichts geladen.',
    UPDATE_UNGUELTIG: 'Die Update-Angaben auf dem Server sind unvollständig. Es wird nichts geladen.',
    UPDATE_BESCHAEDIGT: 'Die geladene APK stimmt nicht mit der Prüfsumme überein und wurde verworfen.',
    UPDATE_ZERTIFIKAT: 'Die geladene APK ist nicht mit demselben Schlüssel unterschrieben wie diese App. Es wird nichts installiert.',
    UPDATE_NICHT_GEPRUEFT: 'Bitte zuerst erneut auf eine neue Fassung prüfen.'
  };
  const fehler = (e) => window.FamilienakteApp?.hinweis(MELDUNG[String(e?.code || e?.message || e)] || MELDUNG.UPDATE_NICHT_ERREICHBAR, 8000);
  const mb = (n) => (n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' MB';
  async function installieren() {
    const app = window.FamilienakteApp; if (!app) return;
    if (offline()) { app.hinweis(MELDUNG.UPDATE_OFFLINE, 8000); return; }
    app.hinweis('APK wird geladen …', 0);
    try {
      const r = await upd.installieren();
      if (r?.erlaubnis) app.hinweis('Bitte „Apps aus dieser Quelle installieren“ erlauben, zurückkehren und noch einmal auf die Versionszeile tippen.', 0);
      else app.hinweis('Android fragt jetzt, ob die neue Fassung installiert werden soll.', 8000);
    } catch (e) { fehler(e); }
  }
  async function updatePruefen() {
    const app = window.FamilienakteApp; if (!app) return;
    if (offline()) { app.hinweis(`${app.version ? `Fassung ${app.version} (Android). ` : ''}${MELDUNG.UPDATE_OFFLINE}`, 8000); return; }
    app.hinweis('Prüfung läuft …', 0);
    try {
      const r = await upd.pruefen();
      if (r?.neu) app.hinweis(`Neu: Fassung ${r.neu} (du hast ${r.installiert}), ${mb(r.groesse)}.`, 0, { text: 'Laden und installieren', run: installieren });
      else app.hinweis(`Du verwendest die aktuelle Fassung ${r?.version || app.version || ''}.`, 6000);
    } catch (e) { fehler(e); }
  }
  if (upd?.pruefen) {
    upd.addListener?.('stand', (d) => { if (d?.groesse) window.FamilienakteApp?.hinweis(`APK wird geladen … ${mb(d.geladen)} von ${mb(d.groesse)}`, 0); });
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
  }
  window.FamilienakteAndroid = { abholen, updatePruefen, installieren };
})();
