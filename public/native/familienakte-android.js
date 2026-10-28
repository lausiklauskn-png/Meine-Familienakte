/* Familienakte: Klebstoff der Android-Hülle (Capacitor). Läuft nur in der App, nie im Browser.
   1. Diktat: Androids Sprachfenster (Plugin ProSpeech) als Ersatz für die fehlende Web Speech API, als
      Einmal-Erkennung (oneShot) an den vorhandenen Diktatknöpfen; erlaubt auch bei Internet „aus“ (Gerät).
   2. Teilen → Familienakte: geteilte Dateien (Plugin FamilienakteShare) landen in der Eingangszentrale.
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
  window.FamilienakteAndroid = { abholen };
})();
