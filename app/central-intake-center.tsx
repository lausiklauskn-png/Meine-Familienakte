import { UI_HELP } from "../lib/ui-help";
import { InfoPopover } from "./ui-controls";

import { Camera, CheckCircle2, ChevronRight, Cloud, FileText, Folder, Mail, PenLine, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  centralIntakeDisplayTitle,
  type CentralIntakeQueueItem,
  type CentralIntakeStatus,
} from "@/lib/central-intake";
import type { DocumentIntakeSource } from "@/lib/document-intake";

const statusClass: Record<CentralIntakeStatus, string> = {
  "Neu": "neutral",
  "Analyse läuft": "warning",
  "Prüfung erforderlich": "warning",
  "Bereit zur Übernahme": "success",
  "Übernommen": "success",
  "Zurückgestellt": "neutral",
  "Nicht übernommen": "neutral",
};

const fmtBytes = (value: number) => value < 1024 * 1024
  ? `${Math.max(1, Math.round(value / 1024))} KB`
  : `${(value / 1024 / 1024).toFixed(1)} MB`;

export function CentralIntakeCenter({
  queue,
  storageReady,
  oneDriveConnected,
  inboxFolderName,
  busy,
  checkedAt,
  onFiles,
  onStartDocumentScan,
  onScanForm,
  onSelectInbox,
  onScanInbox,
  onScanOneDrive,
  onReview,
  onExtractAttachments,
  onToggle,
  onSetStatus,
  onGo,
}: {
  queue: CentralIntakeQueueItem[];
  storageReady: boolean;
  oneDriveConnected: boolean;
  inboxFolderName: string;
  busy: boolean;
  checkedAt: string | null;
  onFiles: (files: File[], source: DocumentIntakeSource) => void;
  onStartDocumentScan: (files: File[]) => void;
  onSelectInbox: () => void;
  onScanInbox: () => void;
  /** Formular scannen und gleich ausfüllen (Klaus 2026-10-31, Frage 1 aus Sitzung F). */
  onScanForm?: () => void;
  onScanOneDrive: () => void;
  onReview: (id: string) => void;
  onExtractAttachments: (id: string) => void;
  onToggle: (id: string) => void;
  onSetStatus: (ids: string[], status: CentralIntakeStatus) => void;
  onGo: (id: "help" | "documents" | "security") => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const activeQueue = queue.filter((item) => item.status !== "Übernommen" && item.status !== "Nicht übernommen");
  const selectedIds = activeQueue.filter((item) => item.selected).map((item) => item.id);
  const selectedImages = activeQueue.filter((item) => item.selected && item.analysis?.fileKind === "Foto / Bild");
  const counts = useMemo(() => ({
    total: queue.length,
    review: activeQueue.filter((item) => item.status === "Prüfung erforderlich").length,
    ready: activeQueue.filter((item) => item.status === "Bereit zur Übernahme").length,
    deferred: activeQueue.filter((item) => item.status === "Zurückgestellt").length,
  }), [queue, activeQueue]);
  const lastChecked = checkedAt ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(checkedAt)) : "noch nicht geprüft";
  const add = (files: FileList | null, source: DocumentIntakeSource) => {
    if (files?.length) onFiles(Array.from(files), source);
  };

  return <>
    <section className="page-title central-intake-title">
      <div className="page-title-icon"><Upload/></div>
      <span className="page-title-copy"><span className="eyebrow dark">Version 2.28.1 · gemeinsame Verarbeitung</span><h1>Eingangszentrale</h1><p>Neue Unterlagen einfach hineinziehen, prüfen, verstehen und kontrolliert der Familienakte zuordnen.</p></span>
    </section>

    <section className="card central-intake" aria-labelledby="central-intake-drop-title">
      <div className="card-heading"><div><span className="ui-heading-help"><h2 id="central-intake-drop-title">Neue Unterlagen erfassen</h2><InfoPopover label="Neue Unterlagen erfassen erklären" text={UI_HELP["Neue Unterlagen erfassen"]}/></span></div><button className="text-link" onClick={() => onGo("help")}>Hilfe <ChevronRight size={16}/></button></div>
      <input ref={inputRef} className="sr-only" type="file" multiple onChange={(event) => { add(event.target.files, "file-picker"); event.currentTarget.value = ""; }}/>
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={(event) => { const files = event.target.files ? Array.from(event.target.files) : []; if (files.length) onStartDocumentScan(files); event.currentTarget.value = ""; }}/>
      <div className={`central-drop ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files, "drag-drop"); }}>
        <Upload size={42}/><strong>Dateien hier hineinziehen</strong><span>PDF, Word, Foto, Scan, E-Mail oder mehrere Dateien gleichzeitig</span><button type="button" className="button primary" onClick={() => inputRef.current?.click()}>Datei auswählen</button>
      </div>
      <div className="central-source-grid">
        <button type="button" className="intake-source" onClick={() => storageReady ? onStartDocumentScan([]) : onGo("security")} data-dokument-scannen><Camera/><span><strong>Dokument fotografieren</strong><small>{storageReady ? "Vorhandene Mehrseiten- und PDF-Funktion" : "Zuerst lokalen Tresor verbinden"}</small></span><ChevronRight/></button>
        {onScanForm && <button type="button" className="intake-source" onClick={() => storageReady ? onScanForm() : onGo("security")} disabled={busy} data-formular-scannen><PenLine/><span><strong>Formular scannen und ausfüllen</strong><small>{storageReady ? "Papierformular scannen, dann gleich ausfüllen" : "Zuerst lokalen Tresor verbinden"}</small></span><ChevronRight/></button>}
        <button type="button" className="intake-source" onClick={inboxFolderName ? onScanInbox : onSelectInbox} disabled={busy}><Folder/><span><strong>{inboxFolderName ? "Eingangsordner jetzt prüfen" : "Eingangsordner auswählen"}</strong><small>{inboxFolderName ? `Freigegeben: ${inboxFolderName}` : "Nur den bewusst ausgewählten Ordner"}</small></span><ChevronRight/></button>
        <button type="button" className="intake-source" onClick={onScanOneDrive} disabled={busy}><Cloud/><span><strong>OneDrive-Familienordner prüfen</strong><small>{oneDriveConnected ? `Verbunden · letzte Prüfung: ${lastChecked}` : "Keine Dauerüberwachung · zuerst im Sicherheitscenter verbinden"}</small></span><ChevronRight/></button>
      </div>
      {busy && <div className="intake-progress" role="status"><RefreshCw className="spin"/><span>Die ausgewählten Unterlagen werden nur lesend geprüft. Originaldateien bleiben unverändert.</span></div>}
      <div className="info-notice intake-info"><span>Info</span><p>Die Familienakte überwacht weder Ordner noch Outlook dauerhaft. Eine Prüfung beginnt nur nach deinem Klick. Unbekannte Dateitypen bleiben erhalten und werden zur manuellen Prüfung vorgemerkt.</p></div>
    </section>

    <section className="card intake-queue" aria-labelledby="intake-queue-title">
      <div className="card-heading"><div><span className="eyebrow dark">Gemeinsame Warteschlange</span><span className="ui-heading-help"><h2 id="intake-queue-title">Eingänge prüfen</h2><InfoPopover label="Eingänge prüfen erklären" text={UI_HELP["Eingänge prüfen"]}/></span></div><button className="badge neutral queue-total" onClick={() => activeQueue.forEach((item) => !item.selected && onToggle(item.id))}>{counts.total} Eingänge</button></div>
      <div className="queue-summary">
        <button onClick={() => document.getElementById("intake-queue-list")?.scrollIntoView({ behavior: "smooth" })}><strong>{counts.ready}</strong><span>bereit</span></button>
        <button onClick={() => document.getElementById("intake-queue-list")?.scrollIntoView({ behavior: "smooth" })}><strong>{counts.review}</strong><span>prüfen</span></button>
        <button onClick={() => document.getElementById("intake-queue-list")?.scrollIntoView({ behavior: "smooth" })}><strong>{counts.deferred}</strong><span>zurückgestellt</span></button>
      </div>
      {selectedIds.length > 0 && <div className="queue-batch"><strong>{selectedIds.length} ausgewählt</strong>{selectedImages.length > 1 && selectedImages.length === selectedIds.length && <button className="button primary" onClick={() => onStartDocumentScan(selectedImages.map((item) => item.file))}>Als gemeinsames Scan-Dokument prüfen</button>}<button className="button secondary" onClick={() => onSetStatus(selectedIds, "Bereit zur Übernahme")}>Sichere Vorschläge vormerken</button><button className="button secondary" onClick={() => onSetStatus(selectedIds, "Zurückgestellt")}>Zurückstellen</button><button className="button secondary" onClick={() => onSetStatus(selectedIds, "Nicht übernommen")}>Nicht übernehmen</button></div>}
      {!queue.length ? <div className="empty-state"><FileText size={34}/><strong>Noch keine neuen Eingänge</strong><span>Ziehe oben Dateien hinein oder prüfe einen bewusst ausgewählten Ordner.</span></div> : <div className="intake-queue-list" id="intake-queue-list">
        {queue.map((item) => {
          const analysis = item.analysis;
          return <article className={`intake-queue-item status-${statusClass[item.status]}`} key={item.id}>
            <label className="queue-select" title="Für Sammelbearbeitung auswählen" aria-label="Für Sammelbearbeitung auswählen"><input type="checkbox" checked={item.selected} disabled={item.status === "Übernommen" || item.status === "Nicht übernommen"} onChange={() => onToggle(item.id)}/></label>
            <div className="queue-icon">{analysis?.email ? <Mail/> : <FileText/>}</div>
            <div className="queue-copy"><div className="queue-title-row"><strong>{analysis ? centralIntakeDisplayTitle(analysis) : item.file.name}</strong><span className={`badge ${statusClass[item.status]}`}>{item.status}</span></div>
              <small>{analysis ? `${analysis.fileKind} · ${analysis.plan.lifeArea} · ${fmtBytes(item.file.size)}` : `${fmtBytes(item.file.size)} · Analyse läuft`}</small>
              {analysis && <><p>{analysis.contentMessage}</p>{analysis.groupHint && <p><b>Zusammenhang:</b> {analysis.groupHint}</p>}{analysis.email && <p><b>E-Mail:</b> {analysis.plan.privacyClass === "besonders geschützt" ? "geschützte Absender- und Betreffdaten" : `${analysis.email.sender || "Absender unbekannt"} · ${analysis.email.attachmentNames.length} Anlage${analysis.email.attachmentNames.length === 1 ? "" : "n"}`}</p>}{analysis.possibleTask && <p><b>Aufgabe:</b> {analysis.possibleTask}</p>}{analysis.possibleDeadline && <p><b>Frist:</b> {analysis.possibleDeadline}</p>}{analysis.plan.duplicateIds.length > 0 && <p className="queue-warning"><b>Mögliche Dublette:</b> vorhandenes Dokument zuerst vergleichen.</p>}</>}
              {item.error && <p className="form-error">{item.error}</p>}
            </div>
            <div className="queue-actions">
              {analysis?.email?.attachmentNames.length ? <button className="text-link" onClick={() => onExtractAttachments(item.id)}>Anlagen in Warteschlange prüfen</button> : null}
              {item.status !== "Übernommen" && item.status !== "Nicht übernommen" && <button className="button primary" disabled={!analysis || item.status === "Analyse läuft"} onClick={() => onReview(item.id)}>Zuordnung prüfen</button>}
              {item.status !== "Übernommen" && item.status !== "Nicht übernommen" && <button className="button secondary" onClick={() => onSetStatus([item.id], "Zurückgestellt")}>Zurückstellen</button>}
              {item.status === "Zurückgestellt" && <button className="button secondary" onClick={() => onSetStatus([item.id], analysis?.plan.requiresReview ? "Prüfung erforderlich" : "Bereit zur Übernahme")}>Weiterbearbeiten</button>}
            </div>
          </article>;
        })}
      </div>}
      {queue.some((item) => item.status === "Übernommen") && <button className="intake-receipt" onClick={() => onGo("documents")}><CheckCircle2/><span><strong>Übernommene Dokumente anzeigen</strong><small>Bibliothek, Suche und Vorgänge verwenden denselben Dokumentdatensatz.</small></span><ChevronRight/></button>}
      <div className="queue-safety"><ShieldCheck/><span><strong>Kontrollierte Übernahme</strong><small>Originale werden nicht verschoben, umbenannt, überschrieben oder gelöscht. Aufgaben und Fristen entstehen erst nach deiner Bestätigung.</small></span></div>
    </section>
  </>;
}
