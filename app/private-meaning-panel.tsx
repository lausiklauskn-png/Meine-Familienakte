import { useEffect, useRef, useState } from "react";
import { activeMeaningModel, buildMeaningIndex, clearMeaningIndex, searchMeaningIndex } from "./private-meaning-index";
import { readMeaningCorpus, type MeaningTarget } from "./private-meaning-corpus";
import { getVaultSummary } from "./local-vault";
import { MeaningRuntime, MEANING_MODELS, MODEL_STAGES, browserModelleEinhaengen, deviceModelName, modelDevice, modelImBrowser, modelPlugin, type DeviceMeasurement, type ModelStage, type NativeModelsState } from "./private-meaning-runtime";
import { browserModelle, browserModelleMoeglich } from "./browser-modelle";
import type { SectionId } from "./portal-types";
import { InfoPopover, SuchFeld } from "./ui-controls";

const mb = (bytes: number) => (bytes / 1048576).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " MiB";
function errorText(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (error instanceof DOMException && error.name === "AbortError") return "Angehalten. Der bisher nutzbare Index bleibt erhalten.";
  if (/APP_OFFLINE/.test(text)) return "Internet für die App ist aus. Zum Herunterladen oben bewusst einschalten; die fertige Suche funktioniert offline.";
  if (/INDEX_SCOPE_CHANGED/.test(text)) return "Die geöffnete Akte hat gewechselt. Bitte in der gewünschten Akte neu beginnen.";
  if (/INDEX_TEXT_CHANGED/.test(text)) return "Während des Aufbaus wurden Unterlagen geändert. Der bisherige Index bleibt nutzbar; Aufbau erneut starten.";
  if (/INDEX_/.test(text)) return "Der private Suchindex konnte nicht geprüft oder gespeichert werden. Der bisher verwendbare Stand bleibt erhalten.";
  if (/MODEL_NOT_INSTALLED/.test(text)) return "Das passende Modell ist noch nicht vollständig verfügbar. Bitte die Modellablage prüfen.";
  if (/MODEL/.test(text)) return "Das Modell konnte nicht verwendet werden. Speicher und Downloadstand prüfen oder eine kleinere Stufe wählen. Es wurde kein neuer Index freigegeben.";
  return text;
}

export function PrivateMeaningPanel({ handle, query = "", onOpen }: { handle: FileSystemDirectoryHandle | null; query?: string; onOpen?: (section: SectionId, id?: string) => void }) {
  const [expanded, setExpanded] = useState(false), [state, setState] = useState<NativeModelsState | null>(null);
  const [measurement, setMeasurement] = useState<DeviceMeasurement | null>(null), [stage, setStage] = useState<ModelStage>("klein");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [results, setResults] = useState<{ handle: FileSystemDirectoryHandle | null; items: MeaningTarget[] }>({ handle: null, items: [] }), [question, setQuestion] = useState(query);
  const hits = results.handle === handle ? results.items : [];
  const setHits = (items: MeaningTarget[]) => setResults({ handle, items });
  const runtime = useRef(new MeaningRuntime()), operation = useRef<AbortController | null>(null), currentHandle = useRef(handle);
  // Stufe G: Web-App ohne native Hülle – Modelle im Browser-Speicher, dieselben Knöpfe.
  if (!modelPlugin() && browserModelleMoeglich()) browserModelleEinhaengen(browserModelle);
  useEffect(() => { currentHandle.current = handle; return () => { operation.current?.abort(); runtime.current.stop(); }; }, [handle]);
  useEffect(() => { setQuestion(query); setHits([]); }, [query, handle]);
  const refresh = async () => { const next = await modelPlugin()?.getState(); if (next) setState(next); };
  useEffect(() => {
    if (!expanded) return;
    let live = true;
    const read = () => { void modelPlugin()?.getState().then(next => { if (live) setState(next); }).catch(error => { if (live) setMessage(errorText(error)); }); };
    read(); const timer = window.setInterval(read, 1000);
    window.addEventListener("familienakte:modelle", read);
    return () => { live = false; clearInterval(timer); window.removeEventListener("familienakte:modelle", read); };
  }, [expanded]);
  const [indexStand, setIndexStand] = useState<{ done: number; total: number } | null>(null);

  async function action(work: (signal: AbortSignal) => Promise<void>) {
    if (operation.current) return;
    const controller = new AbortController(); operation.current = controller; setBusy(true); setMessage(""); setHits([]);
    try { await work(controller.signal); }
    catch (error) { setMessage(errorText(error)); }
    finally { if (operation.current === controller) { operation.current = null; setBusy(false); } }
  }
  const measure = () => action(async () => { const device = modelDevice(); if (!device) throw Error("MODEL_DEVICE_UNAVAILABLE"); setMeasurement(await device.messen({ neu: true })); });
  const install = () => action(async () => {
    const device = modelDevice(); if (!device || !modelPlugin()) throw Error("MODEL_NATIVE_UNAVAILABLE");
    const measured = await device.messen(); setMeasurement(measured);
    if (!(await device.vorDemLaden(deviceModelName(stage))).weiter) return;
    const next = await modelPlugin()!.install({ stage }); setState(next);
    setMessage("Download läuft. Du kannst ihn anhalten und später fortsetzen. Der bisherige Suchindex bleibt erhalten.");
  });
  const build = () => action(async signal => {
    if (!handle) throw Error("Bitte zuerst eine Akte öffnen.");
    const scope = (await getVaultSummary(handle)).vaultId;
    const currentScope = () => !signal.aborted && currentHandle.current === handle ? scope : null;
    const check = () => { signal.throwIfAborted(); if (currentScope() !== scope) throw Error("INDEX_SCOPE_CHANGED"); };
    let coverage = "";
    // Stufe G (Entscheidung 10): gescannte Seiten ohne Text liest die Texterkennung einmal für den Index – auf diesem Gerät.
    const ocr = async (file: File) => { setMessage(`Texterkennung für „${file.name}“ (nur für den Index) …`); const { dokumentTextOcr } = await import("./ki-auftrag-dialog"); return dokumentTextOcr(file); };
    const read = async () => { const corpus = await readMeaningCorpus(handle, check, { ocr }); if (corpus.scope !== scope) throw Error("INDEX_SCOPE_CHANGED"); coverage = `${corpus.metadataOnly} Dateien nur nach Namen/Angaben, ${corpus.partial} Inhalte teilweise gelesen.`; return corpus.documents; };
    setIndexStand({ done: 0, total: 0 });
    try {
      const result = await buildMeaningIndex({ scope, model: MEANING_MODELS[stage], currentScope, signal, read,
        embed: (text, model) => runtime.current.embed(text, model), progress: (done, total) => { setIndexStand({ done, total }); setMessage(`Suchindex: ${done} von ${total} Abschnitten (${total ? Math.round(done / total * 100) : 0} %) …`); } });
      setMessage(`Suchindex bereit: ${result.documents} Einträge, ${result.sections} Abschnitte. ${coverage} ${result.limited.length} lange Texte nur auszugsweise indexiert.`);
    } finally { setIndexStand(null); }
  });
  const search = () => action(async signal => {
    if (!handle) throw Error("Bitte zuerst eine Akte öffnen.");
    const scope = (await getVaultSummary(handle)).vaultId;
    const currentScope = () => !signal.aborted && currentHandle.current === handle ? scope : null;
    const check = () => { signal.throwIfAborted(); if (currentScope() !== scope) throw Error("INDEX_SCOPE_CHANGED"); };
    if (!await activeMeaningModel(scope)) { setMessage("Für diese Akte wurde noch kein privater Suchindex aufgebaut."); return; }
    const corpus = await readMeaningCorpus(handle, check);
    if (corpus.scope !== scope) throw Error("INDEX_SCOPE_CHANGED");
    const result = await searchMeaningIndex({ scope, documents: corpus.documents, query: question.slice(0, 500), currentScope, embed: (text, model) => runtime.current.embed(text, model) });
    check(); setHits(result.hits.map(hit => corpus.targets.get(hit.id)).filter((hit): hit is MeaningTarget => Boolean(hit)));
    setMessage(`${result.indexed} von ${result.total} aktuellen Einträgen im Index. Neue oder geänderte Texte benötigen einen erneuten Aufbau. ${corpus.metadataOnly} Dateien nur nach Namen/Angaben; ${corpus.partial + result.limited.length} Begrenzungen beim Lesen oder Indexieren.`);
  });
  const clear = () => action(async () => {
    if (!handle) return; runtime.current.stop(); await clearMeaningIndex((await getVaultSummary(handle)).vaultId);
    setMessage("Suchindex dieser Akte gelöscht. Originaldateien und Modelle bleiben erhalten.");
  });
  const selected = state?.models[stage], downloading = state && MODEL_STAGES.some(s => state.models[s].running);
  return <section className="card private-meaning" aria-label="Private Bedeutungssuche">
    <span className="ui-heading-help"><h2>Private Bedeutungssuche</h2><InfoPopover label="Private Bedeutungssuche erklären" text="Findet ähnliche Inhalte in deiner Familienakte (alle Unterlagen, die du hier gespeichert hast), auch wenn die genauen Wörter fehlen. Modelle, Suchvektoren und Fragen bleiben auf diesem Gerät; das Mycel wird dafür nicht benutzt. Jede Modellstufe ist freiwillig; ein größeres Modell findet nicht automatisch besser. Die normale Wortsuche bleibt."/></span>
    <button className="button secondary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Einstellungen zuklappen" : "Gerät, Modelle und Suchindex"}</button>
    {expanded && <>
      <div className="button-row"><button className="button secondary" disabled={busy} onClick={measure}>Dieses Gerät prüfen</button></div>
      {measurement && <p role="status">{modelDevice()?.werteText(measurement)} · Rechenprobe {measurement.probeMs} ms · Quelle: {measurement.quelle}.</p>}
      {!modelPlugin() ? <p>Die Geräteprüfung funktioniert auch im Browser. Dieser Browser kann keine Modelle dauerhaft ablegen (kein eigener Dateispeicher); die Bedeutungssuche gibt es in Chrome, Edge oder der Android-/Windows-App.</p> : <>
        {modelImBrowser() && <p className="fine-print" data-modell-browser>Web-App: Modell und Suchindex liegen im Speicher dieses Browsers (Chrome/Edge) auf diesem Gerät. Der Download ist bewusst; er lässt sich anhalten und fortsetzen.</p>}
        <label>Modellstufe <select value={stage} disabled={busy || Boolean(downloading)} onChange={e => setStage(e.target.value as ModelStage)}>
          {MODEL_STAGES.map(s => <option key={s} value={s}>{({ klein: "Klein", mittel: "Mittel", gross: "Groß" })[s]} – {MEANING_MODELS[s].id.split("/")[1]}</option>)}
        </select></label>
        {measurement && <p>Geräteempfehlung: {({ passt: "passt", knapp: "knapp", nein: "nicht empfohlen" })[modelDevice()?.urteil(measurement, deviceModelName(stage)).stand as "passt" | "knapp" | "nein"] || "nicht bestimmbar"}. Die Werte sind eine Orientierung; die Messung am eigenen Gerät bleibt entscheidend.</p>}
        {selected && <p>{selected.installed ? "Modell vollständig abgelegt" : selected.running ? "Modell wird geladen" : "Modell noch nicht vollständig"}: {mb(selected.present)} von etwa {mb(selected.total)}. {selected.error && (selected.error === "CANCELLED" ? "Download angehalten; später fortsetzbar." : selected.error === "APP_OFFLINE" ? "Internet ausgeschaltet; später fortsetzbar." : "Download nicht abgeschlossen. Verbindung und freien Speicher prüfen; später fortsetzen.")}</p>}
        {selected && (selected.running || (!selected.installed && selected.present > 0)) && selected.total > 0 && <div className="modell-fortschritt" data-modell-fortschritt={Math.round(Math.min(selected.running ? selected.done : selected.present, selected.total) / selected.total * 100)}><progress max={selected.total} value={Math.min(selected.running ? selected.done : selected.present, selected.total)} aria-label="Download des Modells"/><span>{Math.round(Math.min(selected.running ? selected.done : selected.present, selected.total) / selected.total * 100)} % · {mb(selected.running ? selected.done : selected.present)} von {mb(selected.total)}{selected.source ? ` · von ${selected.source}` : ""}</span></div>}
        {selected?.error === "MODEL_CHECKSUM" && <p className="form-error" data-modell-pruefsumme>Eine Modelldatei trug nicht den festen Fingerabdruck und wurde verworfen. Bitte erneut laden; passt es wieder nicht, stimmt die Quelle nicht.</p>}
        {indexStand && indexStand.total > 0 && <div className="modell-fortschritt" data-index-fortschritt={Math.round(indexStand.done / indexStand.total * 100)}><progress max={indexStand.total} value={indexStand.done} aria-label="Aufbau des Suchindex"/><span>{Math.round(indexStand.done / indexStand.total * 100)} % · {indexStand.done} von {indexStand.total} Abschnitten</span></div>}
        {state && !state.localAssets && <p>Die lokale Modellbereitstellung ist in dieser Hülle nicht verfügbar. Die Akte und die Wortsuche bleiben nutzbar.</p>}
        <div className="button-row">
          <button className="button secondary" disabled={busy || Boolean(downloading) || !state?.localAssets} onClick={install}>{selected?.installed ? "Modelldateien erneut prüfen" : "Gewähltes Modell laden / fortsetzen"}</button>
          <button className="button secondary" disabled={!selected?.running} onClick={() => action(async () => { await modelPlugin()!.cancel({ stage }); await refresh(); })}>Download anhalten</button>
          <button className="button secondary" disabled={busy || Boolean(downloading) || !selected?.present} onClick={() => action(async () => { runtime.current.stop(); await modelPlugin()!.remove({ stage }); await refresh(); })}>Gewähltes Modell entfernen</button>
        </div>
        <span className="ui-heading-help"><strong>Suchindex</strong><InfoPopover label="Suchindex erklären" text="Der Suchindex wird aus deinen Unterlagen und dem gewählten Modell gebaut. Wechselst du das Modell, wird er neu gebaut; ein abgebrochener Wechsel lässt den bisherigen nutzbar. Gescannte Seiten ohne Textebene: der beim Eingang erkannte Text zählt mit; fehlt er, liest die Texterkennung beim Aufbau einmal auf diesem Gerät (auch Gesundheitsunterlagen – nur für den Index, nichts verlässt das Gerät)."/></span>
        <div className="button-row"><button className="button primary" disabled={busy || !handle || !selected?.installed || Boolean(downloading)} onClick={build}>Index aufbauen / fortsetzen</button><button className="button secondary" disabled={busy || !handle} onClick={clear}>Privaten Index löschen</button></div>
        <span className="ui-heading-help"><label htmlFor="bedeutung-frage">Wonach suchst du? <SuchFeld value={question} onChange={setQuestion} placeholder="z. B. Garantie Waschmaschine" ariaLabel="Wonach suchst du?" speechLabel="Bedeutungssuche" inputProps={{ maxLength: 500, id: "bedeutung-frage" }}/></label><InfoPopover label="Bedeutungssuche: wo wird gesucht?" text="Gesucht wird in deiner Familienakte, also in allen Unterlagen, die du hier gespeichert hast (in der Demo im Demo-Bestand). Du kannst in eigenen Worten fragen; die Treffer sind Vorschläge, das Original bitte selbst prüfen."/></span>
        <div className="button-row"><button className="button primary" disabled={busy || !handle || !question.trim()} onClick={search}>Nach Bedeutung suchen</button></div>
      </>}
      {busy && <button className="button secondary" onClick={() => { operation.current?.abort(); runtime.current.stop(); }}>Suche / Index anhalten</button>}
      {message && <p role="status">{message}</p>}
      {hits.length > 0 && <div className="search-results">{hits.map(hit => <button key={hit.targetId} className="button secondary" onClick={() => onOpen?.(hit.section, hit.targetId)}>{hit.title}</button>)}<p>Ähnliche Inhalte sind Vorschläge. Bitte den Originalbeleg selbst prüfen.</p></div>}
    </>}
  </section>;
}
