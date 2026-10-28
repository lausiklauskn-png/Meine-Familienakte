"use client";
import { UI_HELP } from "../lib/ui-help";

import { ArrowDown, ArrowUp, Camera, CheckCircle2, Crop, FileImage, FileText, ImagePlus, LoaderCircle, RotateCw, Sparkles, Trash2, X } from "lucide-react";
import { VoiceInput, VoiceTextarea, InfoPopover } from "./ui-controls";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActivity, useActivityMessage } from "./ui-activity";
import { createDocumentScanPdf, moveScanPage, removeScanPage, replaceScanPage, rotateScanPage, type DocumentScanPdfFile, type ScanRotation } from "@/lib/document-scan";

type ScanPage = {
  id: string;
  file: File;
  previewUrl: string;
  rotation: ScanRotation;
  crop: "none" | "small";
  enhance: boolean;
};

function scanPage(file: File): ScanPage {
  return { id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), rotation: 0, crop: "none", enhance: false };
}

function readableImage(file: File) {
  return file.type.startsWith("image/");
}

export function DocumentScanDialog({ initialFiles, onClose, onComplete }: {
  initialFiles: File[];
  onClose: () => void;
  onComplete: (file: DocumentScanPdfFile) => void;
}) {
  const [pages, setPages] = useState<ScanPage[]>(() => initialFiles.filter(readableImage).map(scanPage));
  const [selectedId, setSelectedId] = useState<string | null>(() => pages[0]?.id || null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [titleHint, setTitleHint] = useState("");
  const [keepOriginals, setKeepOriginals] = useState(false);
  const [reviewReady, setReviewReady] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useActivityMessage("error", "Dokument fotografieren");
  const reportActivity = useActivity();
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  useEffect(() => () => pagesRef.current.forEach((page) => URL.revokeObjectURL(page.previewUrl)), []);

  const selected = useMemo(() => pages.find((page) => page.id === selectedId) || pages[0] || null, [pages, selectedId]);

  const addFiles = (files: FileList | null, replacement: number | null = null) => {
    const images = [...(files ? Array.from(files) : [])].filter(readableImage);
    if (!images.length) { setError("Bitte ein unterstütztes Foto auswählen."); return; }
    setReviewReady(false); setError("");
    if (replacement !== null) {
      const previous = pages[replacement];
      if (!previous) return;
      const next = scanPage(images[0]);
      URL.revokeObjectURL(previous.previewUrl);
      setPages((current) => replaceScanPage(current, replacement, next));
      setSelectedId(next.id);
      setReplaceIndex(null);
      return;
    }
    const additions = images.map(scanPage);
    setPages((current) => [...current, ...additions]);
    setSelectedId(additions[0].id);
    reportActivity({ kind: "info", text: `${additions.length} Fotoaufnahme${additions.length === 1 ? "" : "n"} zur Seitenprüfung hinzugefügt. Noch keine PDF gespeichert.` });
  };

  const updatePage = (id: string, update: (page: ScanPage) => ScanPage) => {
    setReviewReady(false);
    setPages((current) => current.map((page) => page.id === id ? update(page) : page));
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setReviewReady(false);
    setPages((current) => moveScanPage(current, index, target));
  };

  const removePage = (index: number) => {
    const removed = pages[index];
    if (!removed) return;
    URL.revokeObjectURL(removed.previewUrl);
    const next = removeScanPage(pages, index);
    setPages(next); setReviewReady(false);
    if (selectedId === removed.id) setSelectedId(next[Math.min(index, next.length - 1)]?.id || null);
  };

  const requestClose = () => {
    if (pages.length && !window.confirm("Scan verwerfen? Die aufgenommenen Seiten wurden noch nicht in der Familienakte gespeichert.")) return;
    onClose();
  };

  const buildPdf = async () => {
    if (!pages.length) { setError("Bitte zuerst mindestens eine Seite fotografieren oder auswählen."); return; }
    if (!reviewReady) { setError("Bitte zuerst „Aufnahme prüfen“ wählen und die Seiten kontrollieren."); return; }
    setBuilding(true); setError("");
    try {
      const file = await createDocumentScanPdf({ pages, titleHint, keepOriginals });
      reportActivity({ kind: "success", text: `PDF aus ${pages.length} geprüften Seiten erstellt und an den Dokumenteneingang übergeben. Noch nicht im Datentresor gespeichert.` });
      onComplete(file);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Die PDF konnte nicht erstellt werden. Die aufgenommenen Seiten bleiben zur erneuten Prüfung erhalten.");
      setBuilding(false);
    }
  };

  return <div className="modal-backdrop" role="presentation"><div className="modal scan-modal" role="dialog" aria-modal="true" aria-labelledby="scan-title">
    <div className="modal-head"><div><span className="badge success">Dokumentenscan</span><span className="ui-heading-help"><h2 id="scan-title">Dokument fotografieren</h2><InfoPopover label="Dokument fotografieren erklären" text={UI_HELP["Dokument fotografieren"]}/></span></div><button className="icon-button" onClick={requestClose} aria-label="Scan schließen"><X/></button></div>
    <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { addFiles(event.target.files, replaceIndex); event.currentTarget.value = ""; }} />
    <input ref={photoRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ""; }} />

    <div className="scan-actions-primary">
      <button className="button primary" type="button" onClick={() => { setReplaceIndex(null); cameraRef.current?.click(); }}><Camera size={18}/>{pages.length ? "Nächste Seite fotografieren" : "Erste Seite fotografieren"}</button>
      <button className="button secondary" type="button" onClick={() => photoRef.current?.click()}><ImagePlus size={18}/>Foto auswählen</button>
      <button className="button secondary" type="button" disabled={!pages.length} onClick={() => { setReviewReady(true); setError(""); }}><CheckCircle2 size={18}/>Aufnahme prüfen</button>
    </div>

    {!pages.length ? <div className="scan-empty"><Camera size={36}/><strong>Noch keine Seite aufgenommen</strong><span>Die Kamera wird nur nach deinem Klick geöffnet. Falls dein Browser keine Kamera anbietet, kannst du ein vorhandenes Foto auswählen.</span></div> : <>
      <div className="scan-workspace">
        <div className="scan-page-list" aria-label="Aufgenommene Seiten">
          {pages.map((page, index) => <article className={`scan-page-card ${selected?.id === page.id ? "selected" : ""}`} key={page.id}>
            <button className="scan-page-preview" type="button" onClick={() => setSelectedId(page.id)} aria-label={`Seite ${index + 1} öffnen`}><span>Seite {index + 1}</span><div className={`scan-image-frame crop-${page.crop}`}><img src={page.previewUrl} alt={`Vorschau Seite ${index + 1}`} style={{ transform: `rotate(${page.rotation}deg)${page.crop === "small" ? " scale(1.04)" : ""}`, filter: page.enhance ? "contrast(1.08) saturate(.96)" : "none" }}/></div></button>
            <div className="scan-page-controls">
              <button type="button" onClick={() => movePage(index, -1)} disabled={index === 0} aria-label={`Seite ${index + 1} nach oben`}><ArrowUp/></button>
              <button type="button" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1} aria-label={`Seite ${index + 1} nach unten`}><ArrowDown/></button>
              <button type="button" onClick={() => updatePage(page.id, (current) => ({ ...current, rotation: rotateScanPage(current.rotation) }))} aria-label={`Seite ${index + 1} drehen`}><RotateCw/></button>
              <button type="button" onClick={() => { setReplaceIndex(index); cameraRef.current?.click(); }} aria-label={`Seite ${index + 1} neu fotografieren`}><Camera/></button>
              <button type="button" onClick={() => removePage(index)} aria-label={`Seite ${index + 1} entfernen`}><Trash2/></button>
            </div>
          </article>)}
        </div>
        {selected && <section className="scan-large-preview" aria-label="Große Seitenvorschau"><div className={`scan-large-frame crop-${selected.crop}`}><img src={selected.previewUrl} alt="Ausgewählte Dokumentseite" style={{ transform: `rotate(${selected.rotation}deg)${selected.crop === "small" ? " scale(1.04)" : ""}`, filter: selected.enhance ? "contrast(1.08) saturate(.96)" : "none" }}/></div><div className="scan-edit-row"><button className="button secondary compact-button" type="button" onClick={() => updatePage(selected.id, (page) => ({ ...page, rotation: rotateScanPage(page.rotation) }))}><RotateCw size={16}/>Drehen</button><button className="button secondary compact-button" type="button" onClick={() => updatePage(selected.id, (page) => ({ ...page, crop: page.crop === "none" ? "small" : "none" }))}><Crop size={16}/>{selected.crop === "none" ? "Ränder behutsam zuschneiden" : "Zuschnitt zurücksetzen"}</button><button className="button secondary compact-button" type="button" onClick={() => updatePage(selected.id, (page) => ({ ...page, enhance: !page.enhance }))}><Sparkles size={16}/>{selected.enhance ? "Originaldarstellung" : "Lesbarkeit leicht verbessern"}</button></div><p>Zuschnitt und Lesbarkeitsverbesserung erfolgen nur nach deinem Klick. Es werden keine Texte ergänzt oder Bildinhalte erfunden.</p></section>}
      </div>

      <section className={`scan-review ${reviewReady ? "ready" : ""}`}><FileImage/><div><strong>{pages.length} Seite{pages.length === 1 ? "" : "n"} aufgenommen</strong><span>{reviewReady ? "Prüfung bestätigt: Seiten sind vollständig, lesbar, richtig ausgerichtet und in der gewünschten Reihenfolge." : "Bitte kontrolliere Vollständigkeit, Lesbarkeit, Ausrichtung und Reihenfolge."}</span></div></section>
      <label className="scan-title-hint"><span>Kurzer Hinweis für die spätere Zuordnung, optional</span><VoiceInput value={titleHint} onValueChange={(spokenValue) => setTitleHint(spokenValue)} placeholder="Zum Beispiel: Krankenkasse Schreiben Zuschuss" speechLabel="Hinweis zur Aufnahme"/><small>Dieser Hinweis wird nur für den vorläufigen PDF-Namen genutzt. Die endgültige Zuordnung prüfst du danach im vorhandenen Dokumenteneingang.</small></label>
      <fieldset className="scan-original-choice"><legend>Was soll mit den einzelnen Scan-Fotos geschehen?</legend><label><input type="radio" checked={!keepOriginals} onChange={() => setKeepOriginals(false)}/><span><strong>Nur PDF in der Familienakte verwenden</strong><small>Empfohlen: Es entstehen keine zusätzlichen sichtbaren Dokumenteinträge für einzelne Seiten.</small></span></label><label><input type="radio" checked={keepOriginals} onChange={() => setKeepOriginals(true)}/><span><strong>Originalaufnahmen zusätzlich behalten</strong><small>Die Fotos werden beim bewussten Speichern als Anlagen derselben PDF abgelegt, nicht als eigene Dokumente.</small></span></label></fieldset>
    </>}

    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="modal-actions"><button type="button" className="button secondary" onClick={requestClose}>Abbrechen</button><button type="button" className="button primary" disabled={!pages.length || building} onClick={buildPdf}>{building ? <><LoaderCircle className="spin" size={18}/>PDF wird erstellt …</> : <><FileText size={18}/>Fertig – PDF erstellen</>}</button></div>
  </div></div>;
}
