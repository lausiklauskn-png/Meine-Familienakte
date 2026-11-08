import pins from "../public/native/meaning-models.json";
import type { MeaningModel } from "./private-meaning-index";
export type ModelStage = "klein" | "mittel" | "gross";
export const MODEL_STAGES: ModelStage[] = ["klein", "mittel", "gross"];
export const MEANING_MODELS = pins.models;
export type ModelState = MeaningModel & { installed: boolean; running: boolean; present: number; total: number; done: number; error: string; source: string };
export type NativeModelsState = { models: Record<ModelStage, ModelState>; localAssets: boolean };
type ModelPlugin = {
  getState: () => Promise<NativeModelsState>;
  install: (options: { stage: ModelStage }) => Promise<NativeModelsState>;
  cancel: (options: { stage: ModelStage }) => Promise<NativeModelsState>;
  remove: (options: { stage: ModelStage }) => Promise<NativeModelsState>;
};
export type DeviceMeasurement = { quelle: string; zeit: number; stufe: string; ramGB?: number; ramMindGB?: number; freiGB?: number; kerne: number; probeMs: number };
type Device = {
  messen: (options?: { neu?: boolean }) => Promise<DeviceMeasurement>;
  werteText: (measurement: DeviceMeasurement) => string;
  urteil: (measurement: DeviceMeasurement, name: string) => { stand: string };
  vorDemLaden: (name: string) => Promise<{ weiter: boolean }>;
};
type MeaningWindow = Window & { Capacitor?: { Plugins?: { FamilyModels?: ModelPlugin } }; ProGeraet?: Device };
const nativePlugin = () => (window as MeaningWindow).Capacitor?.Plugins?.FamilyModels || null;
// Stufe G: ohne native Hülle übernimmt der Browser-Lader (OPFS) dieselbe Schnittstelle – die Web-App kann so selbst suchen.
let browserPlugin: ModelPlugin | null = null;
export function browserModelleEinhaengen(p: ModelPlugin) { browserPlugin = p; }
export const modelPlugin = () => nativePlugin() || browserPlugin;
export const modelImBrowser = () => !nativePlugin() && Boolean(browserPlugin);
export const modelDevice = () => (window as MeaningWindow).ProGeraet;
export const deviceModelName = (stage: ModelStage) => ({ klein: "bedeutung", mittel: "bedeutungMittel", gross: "bedeutungGross" })[stage];
export function modelStage(model: MeaningModel): ModelStage {
  const stage = MODEL_STAGES.find(stage => { const p = pins.models[stage]; return p.id === model.id && p.revision === model.revision && p.dim === model.dim; });
  if (!stage) throw Error("MODEL_IDENTITY_CHANGED"); return stage;
}

export class MeaningRuntime {
  private worker: Worker | null = null;
  private model: MeaningModel | null = null;
  private pending = new Map<number, { resolve: (value: { vector?: Float32Array; model: MeaningModel }) => void; reject: (error: Error) => void }>();
  private sequence = 0;
  private generation = 0;
  private loading: Promise<void> | null = null;
  stop() {
    this.generation++;
    this.worker?.terminate(); this.worker = null; this.model = null; this.loading = null;
    for (const request of this.pending.values()) request.reject(new DOMException("Modell angehalten", "AbortError")); this.pending.clear();
  }
  private call(data: Record<string, unknown>) {
    const worker = this.worker; if (!worker) return Promise.reject(Error("MODEL_NOT_LOADED"));
    return new Promise<{ vector?: Float32Array; model: MeaningModel }>((resolve, reject) => {
      const id = ++this.sequence; this.pending.set(id, { resolve, reject }); worker.postMessage({ ...data, id });
    });
  }
  async load(model: MeaningModel) {
    if (this.model?.id === model.id && this.model.revision === model.revision && this.model.dim === model.dim) {
      await this.loading; return;
    }
    this.stop();
    const generation = this.generation;
    const stage = modelStage(model), plugin = modelPlugin(); if (!plugin) throw Error("MODEL_NATIVE_UNAVAILABLE");
    const state = await plugin.getState(), actual = state.models[stage];
    if (generation !== this.generation) throw new DOMException("Modell angehalten", "AbortError");
    if (!state.localAssets || !actual?.installed || actual.running || actual.id !== model.id || actual.revision !== model.revision || actual.dim !== model.dim) throw Error("MODEL_NOT_INSTALLED");
    this.model = { ...model }; const worker = new Worker(new URL("native/familienakte-meaning-worker.js", document.baseURI)); this.worker = worker;
    const browser = modelImBrowser();
    worker.onmessage = event => {
      const message = event.data, request = this.pending.get(message.id); if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(Error(message.error)); else request.resolve(message.ok);
    };
    worker.onerror = () => { if (this.worker !== worker) return; for (const request of this.pending.values()) request.reject(Error("MODEL_RUNTIME_FAILED")); this.stop(); };
    this.loading = this.call({ kind: "init", stage, model, browser }).then(() => {});
    try { await this.loading; } catch (error) { if (this.worker === worker) this.stop(); throw error; }
  }
  async embed(text: string, model: MeaningModel) {
    await this.load(model); const response = await this.call({ kind: "embed", text });
    if (!response.vector || response.model.id !== model.id || response.model.revision !== model.revision || response.model.dim !== model.dim) throw Error("MODEL_IDENTITY_CHANGED");
    return response.vector;
  }
}
