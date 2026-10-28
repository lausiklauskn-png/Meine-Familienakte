import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Pause, Play, RotateCcw } from "lucide-react";
import type { SystemCheckReport } from "../lib/system-check";
import { USER_RESULTS, USER_TEST_BLOCKS, buildUserAcceptanceReport, canSubmitUserBlock, chooseUserResult, isUserAcceptanceRun, latestUserAcceptance, latestUserResult, newUserAcceptanceRun, noteUserFailure, reopenUserTest, submitUserBlock, userAcceptanceProgress, type UserAcceptanceRun, type UserResult } from "../lib/practical-acceptance";
import { InfoPopover, VoiceTextarea } from "./ui-controls";
import { useActivity } from "./ui-activity";

const formatTime = (value: string) => new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const resultClass = (value?: UserResult) => value === "Ja" ? "yes" : value === "Nein" ? "no" : "skipped";

type ViewProps = {
  run: UserAcceptanceRun; error?: string; savedAt?: string; unsaved?: boolean;
  onChoice: (id: string, result: UserResult) => void; onNote: (id: string, value: string) => void;
  onSubmit: (pause: boolean) => void; onResume: () => void; onBlock: (index: number) => void; onRetry: (id: string) => void;
};
export function PracticalAcceptanceView({ run, error, savedAt, unsaved, onChoice, onNote, onSubmit, onResume, onBlock, onRetry }: ViewProps) {
  const progress = userAcceptanceProgress(run);
  const block = USER_TEST_BLOCKS[run.currentBlock];
  const canSubmit = !run.paused && canSubmitUserBlock(run);
  return <section className="card user-acceptance" id="benutzerabnahme" aria-labelledby="user-acceptance-title">
    <div className="system-check-card-title"><div><span className="eyebrow dark">5 Tests · gemeinsam absenden</span><h2 id="user-acceptance-title">Praktische Benutzerabnahme</h2></div><InfoPopover label="Praktische Benutzerabnahme erklären" text="Prüfe fünf Fragen und wähle jeweils Ja, Nein oder Nicht geprüft. Bei Nein kannst du eine Beobachtung eintragen. Antworten werden im vorhandenen Prüfbericht-Speicher dieses Browsers vorgemerkt. Erst das gemeinsame Absenden bestätigt den Block. Bestandene Tests bleiben erledigt; fehlgeschlagene oder nicht geprüfte Tests kannst du einzeln wieder öffnen. Kein Versand, keine Änderung von Dokumenten und keine Produktivfreigabe. Auf einem anderen Gerät oder nach Löschen der Browserdaten sind diese Browserberichte nicht automatisch vorhanden."/></div>
    <div className="user-acceptance-progress" aria-live="polite"><strong>Prüfblock {run.currentBlock + 1} von 3</strong><span>{progress.passed} bestanden</span><span>{progress.failed} fehlgeschlagen</span><span>{progress.notChecked} nicht geprüft</span><span>Restaufwand: ca. {progress.remainingMinutes} Min. (Schätzung)</span></div>
    <nav className="user-block-tabs" aria-label="Benutzer-Prüfblöcke">{USER_TEST_BLOCKS.map((entry, index) => <button key={entry.id} type="button" aria-current={index === run.currentBlock ? "step" : undefined} disabled={run.paused} onClick={() => onBlock(index)}>{index + 1} · {entry.title}<small>{entry.tests.filter((test) => latestUserResult(run.answers[test.id])?.result === "Ja").length}/5 bestanden</small></button>)}</nav>
    <h3>{block.title}</h3>
    <p className="fine-print">Bereits bestandene Praxistests kannst du anhand deiner vorhandenen Nachweise bestätigen. Du musst die Aktionen dafür nicht erneut ausführen.</p>
    {run.paused && <div className="user-acceptance-paused" role="status"><span><Pause size={18}/> Testphase unterbrochen – Antworten sind gespeichert.</span><button className="button primary" type="button" onClick={onResume}><Play size={17}/> Prüfung fortsetzen</button></div>}
    {error && <div className="form-error" role="alert"><strong>Fehlermeldung:</strong> {error} Die Ergebnisse wurden nicht als erfolgreich gespeichert bestätigt.</div>}
    <ol className="user-acceptance-tests" start={block.tests[0].number}>{block.tests.map((test) => {
      const answer = run.answers[test.id];
      const previous = latestUserResult(answer);
      const locked = !!answer?.submittedAt;
      return <li key={test.id} className={`user-test ${locked ? `saved-${resultClass(previous?.result)}` : "draft"}`}>
        <span className="user-test-number" aria-hidden="true">{test.number}</span>
        <div className="user-test-content"><div className="user-test-title"><h4>{test.title}</h4>{locked && <span className={`user-test-result result-${resultClass(previous?.result)}`}>{previous?.result === "Ja" ? <><CheckCircle2 size={16}/> Erledigt · Ja</> : previous?.result === "Nein" ? "Fehlgeschlagen · Nein" : "Nicht geprüft"}</span>}</div>
          <p className="user-test-question">{test.question}</p><p className="user-test-instruction">{test.instruction}</p>
          {!locked && previous && <small>Erneute Prüfung · vorheriges Ergebnis: {previous.result}</small>}
          <fieldset className="user-result-options" disabled={locked || run.paused}><legend className="sr-only">{test.title}: Prüfergebnis</legend>{USER_RESULTS.map((value) => <label key={value} className={`user-result-option result-${resultClass(value)} ${answer?.result === value ? "selected" : ""}`}><input type="radio" name={`user-result-${test.id}`} value={value} checked={answer?.result === value} onChange={() => onChoice(test.id, value)}/><span>{value}</span></label>)}</fieldset>
          {answer?.result === "Nein" && <label className="user-failure-note"><span>Fehler / Beobachtung</span>{locked || run.paused ? <p>{answer.observation || "Keine Beobachtung eingetragen."}</p> : <VoiceTextarea value={answer.observation} onValueChange={(value) => onNote(test.id, value)} speechLabel={`Fehlerbeobachtung zu Test ${test.number}`} rows={2} maxLength={2000} placeholder="Was hat nicht funktioniert? Kurzer Hinweis genügt."/>}</label>}
          {locked && previous && <small>Gespeichert: {formatTime(previous.checkedAt)} · Website {previous.websiteVersion} · Familienakte {previous.familyVersion}</small>}
          {locked && previous?.result !== "Ja" && <button type="button" className="button secondary user-retry" disabled={run.paused} onClick={() => onRetry(test.id)}><RotateCcw size={16}/>{previous?.result === "Nein" ? "Diesen Test erneut prüfen" : "Diesen Test jetzt prüfen"}</button>}
        </div>
      </li>;
    })}</ol>
    <div className="user-acceptance-submit"><button className="button primary" type="button" disabled={!canSubmit} onClick={() => onSubmit(false)}><ClipboardCheck size={18}/> Alle 5 Prüfergebnisse übermitteln</button><button className="button secondary" type="button" disabled={!canSubmit} onClick={() => onSubmit(true)}><Pause size={18}/> Ergebnisse speichern und Testphase unterbrechen</button></div>
    <p className="fine-print" aria-live="polite">{unsaved ? "Noch nicht gespeichert – bitte die Fehlermeldung beachten." : savedAt ? `Im Browser gespeichert: ${formatTime(savedAt)}.` : "Wähle für jeden Test eine Antwort. Noch kein Benutzerergebnis gespeichert."} {!canSubmit && !run.paused && " Zum Absenden müssen alle fünf Tests beantwortet sein. Bereits gespeicherte Ja-Ergebnisse bleiben erledigt."}</p>
    {progress.complete && <div className="user-acceptance-complete" role="status">Alle 15 Benutzerprüfungen sind bestanden. Die technische Systemprüfung bleibt gesondert maßgeblich. Keine Produktivfreigabe.</div>}
  </section>;
}

export function PracticalAcceptance({ reports, onSave, websiteVersion, familyVersion }: {
  reports: SystemCheckReport[]; onSave: (report: SystemCheckReport) => void; websiteVersion: string; familyVersion: string;
}) {
  const activity = useActivity();
  const [run, setRun] = useState<UserAcceptanceRun | null>(null);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  useEffect(() => {
    const stored = latestUserAcceptance(reports, familyVersion);
    const now = new Date().toISOString();
    setRun(stored || newUserAcceptanceRun(`acceptance-${crypto.randomUUID()}`, familyVersion, now));
    setSavedAt(stored?.updatedAt || "");
    if (reports.some((report) => report.kind === "acceptance" && !isUserAcceptanceRun(report.userAcceptance))) setError("Ein früherer Benutzerbericht ist nicht lesbar. Er bleibt erhalten; Ergebnisse daraus werden nicht als bestanden gewertet.");
    // Initialize once per app version. A save updates the report list, not this draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyVersion]);
  if (!run) return <section className="card user-acceptance" id="benutzerabnahme"><h2>Praktische Benutzerabnahme</h2><p>Gespeicherte Prüfblöcke werden geladen …</p></section>;
  const persist = (next: UserAcceptanceRun, confirmed = false, message = "") => {
    try {
      onSave(buildUserAcceptanceReport(next));
      setRun(next); setSavedAt(next.updatedAt); setUnsaved(false); setError("");
      if (message) activity({ kind: "info", text: message });
    } catch (reason) {
      if (!confirmed) setRun(next);
      setUnsaved(true);
      const text = reason instanceof Error ? reason.message : "Die Browser-Speicherung ist nicht verfügbar. Bitte Browserfreigabe und freien Speicher prüfen und erneut absenden.";
      setError(text); activity({ kind: "error", text: `Benutzerabnahme · ${text}` });
    }
  };
  return <PracticalAcceptanceView run={run} error={error} savedAt={savedAt} unsaved={unsaved}
    onChoice={(id, result) => persist(chooseUserResult(run, id, result, websiteVersion, new Date().toISOString()))}
    onNote={(id, value) => persist(noteUserFailure(run, id, value, new Date().toISOString()))}
    onSubmit={(pause) => { const next = submitUserBlock(run, pause, new Date().toISOString()); const counts = userAcceptanceProgress(next); persist(next, true, `Benutzer-Prüfblock ${run.currentBlock + 1} gespeichert · ${counts.passed} bestanden · ${counts.failed} fehlgeschlagen · ${counts.notChecked} nicht geprüft.${pause ? " Testphase unterbrochen." : ""} Keine Produktivfreigabe.`); }}
    onResume={() => { const next = USER_TEST_BLOCKS.findIndex((block, index) => index > run.currentBlock && block.tests.some((test) => !run.answers[test.id]?.submittedAt)); persist({ ...run, paused: false, currentBlock: next >= 0 ? next : run.currentBlock, updatedAt: new Date().toISOString() }); }}
    onBlock={(index) => persist({ ...run, currentBlock: index, updatedAt: new Date().toISOString() })}
    onRetry={(id) => persist(reopenUserTest(run, id, new Date().toISOString()))}
  />;
}

export function StoredUserAcceptance({ report }: { report: SystemCheckReport }) {
  const run = report.userAcceptance;
  if (!isUserAcceptanceRun(run)) return <details><summary>Benutzerabnahme – Bericht nicht lesbar</summary><p>Dieser Bericht bleibt erhalten. Seine Ergebnisse werden nicht als bestanden gewertet.</p></details>;
  const progress = userAcceptanceProgress(run);
  return <details className="user-acceptance-report"><summary><span>{progress.failed ? "🔴" : progress.complete ? "🟢" : "🟡"}</span><div><strong>Praktische Benutzerabnahme</strong><small>{formatTime(run.updatedAt)} · {progress.passed}/15 bestanden{run.paused ? " · unterbrochen" : ""}</small></div><span>{progress.failed} fehlgeschlagen · {progress.notChecked} nicht geprüft</span></summary><div className="check-report-body"><p>Benutzerantworten im bestehenden Prüfbericht-Speicher. Keine technische Freigabe und keine Produktivfreigabe.</p>{USER_TEST_BLOCKS.map((block, index) => <section key={block.id}><h3>Prüfblock {index + 1} – {block.title}</h3><ol start={block.tests[0].number}>{block.tests.map((test) => {
    const answer = run.answers[test.id]; const entry = latestUserResult(answer);
    return <li key={test.id}><strong>{test.title}</strong>: {entry?.result || "Nicht geprüft"}{answer && !answer.submittedAt && <em> · Antwort vorgemerkt, noch nicht übermittelt</em>}{entry && <small> · {formatTime(entry.checkedAt)} · Website {entry.websiteVersion} · Familienakte {entry.familyVersion}</small>}{entry?.result === "Nein" && <p>Fehler / Beobachtung: {entry.observation || "Keine Beobachtung eingetragen."}</p>}{(answer?.history.length || 0) > 1 && <details><summary>Frühere Ergebnisse</summary><ul>{answer.history.slice(0,-1).map((old, i) => <li key={i}>{old.result} · {formatTime(old.checkedAt)} · Website {old.websiteVersion}{old.result === "Nein" && old.observation ? ` · ${old.observation}` : ""}</li>)}</ul></details>}</li>;
  })}</ol></section>)}</div></details>;
}
