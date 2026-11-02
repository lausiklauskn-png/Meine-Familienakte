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
      self.fetch = (input, options) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        if (!url.href.startsWith(base)) throw Error('MODEL_REMOTE_DISABLED');
        return originalFetch(input, options);
      };
      const library = await import(base + 'lib/transformers.min.js');
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
