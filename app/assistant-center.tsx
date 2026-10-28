"use client";
import { UI_HELP } from "../lib/ui-help";

import { VoiceInput, VoiceTextarea, InfoPopover } from "./ui-controls";
import { useEffect, useMemo, useState } from "react";
import { useActivity } from "./ui-activity";
import { CalendarCheck, CheckCircle2, ClipboardCheck, Copy, FilePenLine, Mail, MessageSquareText, SearchCheck, ShieldCheck } from "lucide-react";
import type { FamilyRecordUnion, FamilyRelation } from "@/lib/family-data-model";
import {
  buildAssistantAnalysis,
  buildCorrespondenceDraft,
  reviseCorrespondenceText,
  type AssistantAnalysis,
  type AssistantDocument,
  type AssistantMode,
  type CorrespondenceKind,
  type CorrespondenceTone,
} from "@/lib/family-assistant";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

const modes: Array<{ id: AssistantMode; label: string; hint: string; icon: React.ReactNode }> = [
  { id: "question", label: "Ich habe ein Problem oder eine Frage", hint: "Vorhandene Akte und Zusammenhänge prüfen", icon: <MessageSquareText/> },
  { id: "advice", label: "Mich beraten lassen", hint: "Möglichkeiten und nächsten Schritt ordnen", icon: <SearchCheck/> },
  { id: "writing", label: "Schreiben oder E-Mail erstellen", hint: "Bestätigbaren Entwurf vorbereiten", icon: <Mail/> },
  { id: "appointment", label: "Termin vorbereiten", hint: "Fragen und Unterlagen zusammenstellen", icon: <CalendarCheck/> },
  { id: "continue", label: "Bestehenden Vorgang weiterbearbeiten", hint: "Vorhandenen Vorgang als Klammer nutzen", icon: <ClipboardCheck/> },
];

function labelOf(record: FamilyRecordUnion) {
  const data = record.data as Record<string, unknown>;
  return String(data.title || data.displayName || data.name || record.notes || record.id);
}

export function AssistantCenter({ records, relations, documents, initialCaseId, vaultReady, onOpenRecord, onOpenDocument, onSaveCorrespondence, onNotice }: {
  records: FamilyRecordUnion[];
  relations: FamilyRelation[];
  documents: AssistantDocument[];
  initialCaseId?: string | null;
  vaultReady: boolean;
  onOpenRecord: (id: string) => void;
  onOpenDocument: (id: string) => void;
  onSaveCorrespondence: (input: {
    status: "Entwurf" | "Versandbereit" | "Versendet" | "Antwort ausstehend" | "Antwort eingegangen" | "Erledigt";
    kind: CorrespondenceKind;
    recipient: string;
    subject: string;
    body: string;
    caseId: string | null;
    documentIds: string[];
    sentAt?: string | null;
  }) => Promise<void>;
  onNotice: (notice: Notice) => void;
}) {
  const reportActivity = useActivity();
  const [mode, setMode] = useState<AssistantMode>("question");
  const [question, setQuestion] = useState("");
  const [caseId, setCaseId] = useState(initialCaseId || "");
  const [analysis, setAnalysis] = useState<AssistantAnalysis | null>(null);
  const [kind, setKind] = useState<CorrespondenceKind>("E-Mail");
  const [tone, setTone] = useState<CorrespondenceTone>("sachlich");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const cases = useMemo(() => records.filter((record) => record.recordType === "case"), [records]);
  const storedCorrespondence = useMemo(() => records.filter((record) => record.recordType === "event" && (record.data as Record<string, unknown>).entryKind === "correspondence").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [records]);

  useEffect(() => { if (initialCaseId) setCaseId(initialCaseId); }, [initialCaseId]);

  const analyze = () => {
    const next = buildAssistantAnalysis({ question, mode, selectedCaseId: caseId || null, records, relations, documents });
    setAnalysis(next);
    reportActivity({ kind: next.sourceDocumentIds.length ? "success" : "info", text: `Assistenzvorschlag aus vorhandenen Akteninformationen vorbereitet · ${next.sourceDocumentIds.length} Dokumente verwendet · ${next.excludedDocumentIds.length} nicht freigegebene Dokumente nicht aktiv verwendet. Keine aktuelle Internetrecherche und kein automatischer Versand.` });
    if (next.caseId) setCaseId(next.caseId);
    if (["writing", "appointment"].includes(mode)) {
      const defaultKind: CorrespondenceKind = mode === "appointment" ? "Terminvorbereitung" : kind;
      setKind(defaultKind);
      const draft = buildCorrespondenceDraft({ analysis: next, kind: defaultKind, tone, recipient });
      setSubject(draft.subject); setBody(draft.body);
    }
  };

  const prepareDraft = () => {
    if (!analysis) return;
    const draft = buildCorrespondenceDraft({ analysis, kind, tone, recipient, subject });
    setSubject(draft.subject); setBody(draft.body);
    document.getElementById("assistant-draft")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
      onNotice({ kind: "success", text: "Der geprüfte Entwurf wurde kopiert. Es wurde nichts versendet." });
    } catch { onNotice({ kind: "error", text: "Der Entwurf konnte nicht kopiert werden. Bitte den Text markieren und von Hand kopieren." }); }
  };

  const save = async (status: "Entwurf" | "Versandbereit" | "Versendet") => {
    if (!analysis || !confirmed) return onNotice({ kind: "info", text: "Bitte bestätige zuerst Inhalt, Empfänger und Zuordnung." });
    if (!vaultReady) return onNotice({ kind: "info", text: "Bitte zuerst den lokalen Datentresor verbinden." });
    setBusy(true);
    try {
      await onSaveCorrespondence({ status, kind, recipient, subject, body, caseId: analysis.caseId, documentIds: analysis.sourceDocumentIds, sentAt: status === "Versendet" ? new Date().toISOString() : null });
      setConfirmed(false);
    } catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Das Schreiben konnte nicht gespeichert werden." }); }
    finally { setBusy(false); }
  };

  return <>
    <header className="page-title"><div><MessageSquareText/></div><span><h1>Assistenz</h1><p>Fragen klären, Vorgänge weiterbearbeiten und Schreiben vorbereiten – mit vorhandenen Daten, klaren Quellen und deiner Entscheidung.</p></span></header>

    <section className="assistant-mode-grid" aria-label="Assistenzweg auswählen">
      {modes.map((item) => <article key={item.id} className={`card assistant-mode ${mode === item.id ? "active" : ""}`}><button type="button" className="assistant-mode-action" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>{item.icon}<strong>{item.label}</strong></button><InfoPopover label={`${item.label} erklären`} text={`${item.hint} Wähle diesen Weg und beschreibe dein Anliegen. Vorhandene freigegebene Angaben werden berücksichtigt; gespeichert wird erst nach deiner Bestätigung.`}/></article>)}
    </section>

    <section className="card assistant-question-card">
      <div className="card-heading"><div><span className="eyebrow dark">Gemeinsamer Familienakten-Kern</span><span className="ui-heading-help"><h2>Was möchtest du klären?</h2><InfoPopover label="Was möchtest du klären? erklären" text={UI_HELP["Was möchtest du klären?"]}/></span></div><span className="badge neutral">Benutzer entscheidet</span></div>
      <div className="assistant-question-grid">
        <label><span>Vorhandener Vorgang, optional</span><select value={caseId} onChange={(event) => setCaseId(event.target.value)}><option value="">Automatisch passenden Vorgang suchen</option>{cases.map((record) => <option key={record.id} value={record.id}>{labelOf(record)} · {record.id}</option>)}</select></label>
        <label className="assistant-question"><span>Frage oder gewünschtes Ergebnis</span><VoiceTextarea rows={4} value={question} onValueChange={(spokenValue) => setQuestion(spokenValue)} placeholder="Zum Beispiel: Welche Unterlagen fehlen für meine Reklamation und wie formuliere ich die E-Mail?" speechLabel="Assistenzfrage"/></label>
      </div>
      <button className="button primary" disabled={!question.trim()} onClick={analyze}><SearchCheck size={18}/> Familienakte prüfen und Vorschlag vorbereiten</button>
    </section>

    {analysis && <>
      <section className="assistant-evidence-grid">
        <article className="card evidence-card"><div className="assistant-card-title"><ShieldCheck/><h2>A · Aus meiner Familienakte</h2></div><span className={`badge ${analysis.confidence === "Sicher" ? "success" : analysis.confidence === "Wahrscheinlich" ? "warning" : "neutral"}`}>{analysis.confidence}</span>{analysis.archiveFacts.length ? <ul>{analysis.archiveFacts.map((fact) => <li key={`${fact.kind}-${fact.id}`}><button className="text-link" onClick={() => fact.kind === "Dokument" ? onOpenDocument(fact.id) : onOpenRecord(fact.id)}><strong>{fact.kind}</strong> · {fact.title}</button></li>)}</ul> : <p>Keine passende bestätigte Grundlage gefunden.</p>}<small>{analysis.excludedDocumentIds.length} nicht freigegebene Dokumente wurden nicht aktiv verwendet.</small></article>
        <article className="card evidence-card research-unavailable"><div className="assistant-card-title"><SearchCheck/><h2>B · Aktuell recherchiert</h2></div><span className="badge warning">Nicht eingerichtet</span><p>{analysis.research.message}</p><small>Keine Quelle und keine Aktualität wird erfunden.</small></article>
        <article className="card evidence-card"><div className="assistant-card-title"><MessageSquareText/><h2>C · Einschätzung und Vorschlag</h2></div><p>{analysis.assessment.recommendation}</p><small>Dies ist eine Arbeitshilfe, keine Rechtsberatung oder medizinische Diagnose.</small></article>
      </section>

      <section className="card assistant-analysis-card">
        <div className="card-heading"><div><span className="ui-heading-help"><h2>Praktische Einordnung</h2><InfoPopover label="Praktische Einordnung erklären" text={UI_HELP["Praktische Einordnung"]}/></span></div>{analysis.caseId && <button className="button secondary" onClick={() => onOpenRecord(analysis.caseId!)}>Vorgang öffnen</button>}</div>
        <div className="assistant-analysis-grid"><article><h3>Situation</h3><p>{analysis.assessment.situation}</p></article><article><h3>Wichtig</h3><ul>{analysis.assessment.important.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>Fehlende Informationen</h3>{analysis.assessment.missing.length ? <ul>{analysis.assessment.missing.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Keine offensichtliche Pflichtangabe fehlt.</p>}</article><article><h3>Möglichkeiten</h3><ul>{analysis.assessment.options.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>Empfehlung</h3><p>{analysis.assessment.recommendation}</p></article><article><h3>Nächster Schritt</h3><p>{analysis.assessment.nextStep}</p></article></div>
        <button className="button primary" onClick={prepareDraft}><FilePenLine size={18}/> Schreiben vorbereiten</button>
      </section>

      <section className="card assistant-draft" id="assistant-draft">
        <div className="card-heading"><div><span className="eyebrow dark">Korrespondenzzentrale</span><span className="ui-heading-help"><h2>Schreiben / E-Mail erstellen</h2><InfoPopover label="Schreiben / E-Mail erstellen erklären" text={UI_HELP["Schreiben / E-Mail erstellen"]}/></span></div><span className="badge warning">Nicht versendet</span></div>
        <div className="form-grid"><label><span>Schreibentyp</span><select value={kind} onChange={(event) => setKind(event.target.value as CorrespondenceKind)}>{["E-Mail", "Brief", "Anfrage", "Antwort", "Erinnerung", "Reklamation", "Terminvorbereitung"].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Ton</span><select value={tone} onChange={(event) => setTone(event.target.value as CorrespondenceTone)}>{["sachlich", "freundlich", "bestimmt", "kurz"].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Empfänger</span><VoiceInput value={recipient} onValueChange={(spokenValue) => setRecipient(spokenValue)} placeholder="Person oder Organisation" speechLabel="Empfänger"/></label><label><span>Betreff</span><VoiceInput value={subject} onValueChange={(spokenValue) => setSubject(spokenValue)} speechLabel="Betreff"/></label></div>
        <label><span>Entwurf</span><VoiceTextarea rows={12} value={body} onValueChange={(spokenValue) => setBody(spokenValue)} speechLabel="Schreiben oder E-Mail"/></label>
        <div className="button-row assistant-edit-buttons"><button className="button secondary" onClick={() => setBody(reviseCorrespondenceText(body, "kurz"))}>Kürzer</button><button className="button secondary" onClick={() => setBody(reviseCorrespondenceText(body, "freundlich"))}>Freundlicher</button><button className="button secondary" onClick={() => setBody(reviseCorrespondenceText(body, "bestimmt"))}>Bestimmter</button><button className="button secondary" onClick={() => setBody(reviseCorrespondenceText(body, "sachlich"))}>Sachlicher</button><button className="button secondary" onClick={copyDraft}><Copy size={17}/> Kopieren</button></div>
        <div className="assistant-source-summary"><strong>Grundlage dieser Antwort</strong><span>{analysis.archiveFacts.length} Aktenhinweise · {analysis.research.sources.length} externe Quellen · {analysis.assessment.missing.length} ungeklärte Punkte</span></div>
        <label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><strong>Ich habe Empfänger, Inhalt, Vorgang und Anlagen geprüft.</strong><small>Erst danach darf der Entwurf gespeichert oder als versendet dokumentiert werden.</small></span></label>
        <div className="button-row"><button className="button secondary" disabled={busy || !confirmed} onClick={() => void save("Entwurf")}>Als Entwurf speichern</button><button className="button secondary" disabled={busy || !confirmed} onClick={() => void save("Versandbereit")}>Als versandbereit speichern</button><button className="button primary" disabled={busy || !confirmed} onClick={() => void save("Versendet")}><CheckCircle2 size={17}/> Als versendet speichern</button></div>
      </section>
    </>}

    <section className="card assistant-history"><div className="card-heading"><div><span className="ui-heading-help"><h2>Gespeicherte Korrespondenz</h2><InfoPopover label="Gespeicherte Korrespondenz erklären" text={UI_HELP["Gespeicherte Korrespondenz"]}/></span></div><span className="badge neutral">{storedCorrespondence.length}</span></div>{storedCorrespondence.length ? <div className="cockpit-action-list">{storedCorrespondence.map((record) => { const data = record.data as Record<string, unknown>; return <button key={record.id} onClick={() => onOpenRecord(String(data.caseReference || record.id))}><span><strong>{String(data.subject || data.title || record.id)}</strong><small>{String(data.correspondenceType || "Schreiben")} · {String(data.correspondenceStatus || record.status)} · {String(data.recipient || "Empfänger offen")}</small></span></button>; })}</div> : <div className="empty-state"><FilePenLine size={28}/><strong>Noch keine Korrespondenz gespeichert</strong><span>Entwürfe erscheinen hier erst nach deiner Bestätigung.</span></div>}</section>
  </>;
}
