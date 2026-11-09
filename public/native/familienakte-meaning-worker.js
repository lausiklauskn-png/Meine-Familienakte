/* Private e5 worker. No Mycel module, document upload, remote fallback or auto download. */
'use strict';
let pipeline = null, dimensions = 0, currentModel = null;
let queue = Promise.resolve();
self.onmessage = event => {
  const request = event.data;
  queue = queue.then(async () => {
    if (request.kind === 'init') {
      const { stage, model } = request;
      if (!['klein', 'mittel', 'gross'].includes(stage) || ![384, 768, 1024].includes(model.dim)) throw Error('MODEL_INVALID');
      // Windows' application host has an HTML fallback. Its separate virtual
      // model host is intercepted by WebView2; no DNS/server is used.
      const origin = location.origin === 'https://tauri.localhost' ? 'https://familienakte-model.localhost' : location.origin;
      const base = new URL('/_fa_models/' + stage + '/', origin).href;
      const originalFetch = self.fetch.bind(self);
      // Stufe G (Plan 08.11.): Web-App ohne native Hülle – Modell und Bibliothek liegen im Browser-Speicher (OPFS,
      // Familienakte-Modelle/<Stufe>/model/… und Familienakte-Modelle/lib/…), geprüft beim Laden durch den Browser-Lader.
      const browserDatei = async (rest) => {
        const root = await navigator.storage.getDirectory();
        const teile = rest.split('/').filter(Boolean);
        let dir = await root.getDirectoryHandle('Familienakte-Modelle');
        if (teile[0] === 'lib') dir = await dir.getDirectoryHandle('lib'); else { dir = await dir.getDirectoryHandle(stage); for (const t of teile.slice(0, -1)) dir = await dir.getDirectoryHandle(t); }
        if (teile[0] === 'lib') for (const t of teile.slice(1, -1)) dir = await dir.getDirectoryHandle(t);
        return (await dir.getFileHandle(teile[teile.length - 1])).getFile();
      };
      self.fetch = async (input, options) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        if (!url.href.startsWith(base)) throw Error('MODEL_REMOTE_DISABLED');
        if (request.browser) { const f = await browserDatei(url.href.slice(base.length)); return new Response(f, { status: 200, headers: { 'Content-Type': f.name.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Content-Length': String(f.size) } }); }
        return originalFetch(input, options);
      };
      const library = request.browser ? await import(URL.createObjectURL(await browserDatei('lib/transformers.min.js'))) : await import(base + 'lib/transformers.min.js');
      library.env.allowRemoteModels = false;
      library.env.allowLocalModels = true;
      library.env.useBrowserCache = false;
      library.env.localModelPath = base;
      library.env.backends.onnx.wasm.wasmPaths = base + 'lib/';
      library.env.backends.onnx.wasm.numThreads = 1;
      library.env.backends.onnx.wasm.proxy = false;
      pipeline = await library.pipeline('feature-extraction', 'model', { quantized: true });
      dimensions = model.dim; currentModel = model;
      return { model };
    }
    if (request.kind !== 'embed' || !pipeline || typeof request.text !== 'string' || request.text.length > 5000) throw Error('MODEL_INPUT_INVALID');
    const output = await pipeline(request.text, { pooling: 'mean', normalize: true });
    const vector = new Float32Array(output.data);
    if (vector.length !== dimensions || vector.some(x => !Number.isFinite(x))) throw Error('MODEL_VECTOR_INVALID');
    return { vector, model: currentModel };
  }).then(result => self.postMessage({ id: request.id, ok: result }), () => self.postMessage({ id: request.id, error: 'MODEL_RUNTIME_FAILED' }));
};
