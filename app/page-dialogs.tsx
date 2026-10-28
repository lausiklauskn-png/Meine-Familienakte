// Rückfragen und Eingaben als Dialog innerhalb der Seite.
// Ersetzt window.confirm() und window.prompt(), die in eingebetteten Seiten
// (z. B. als Link auf claude.ai) vom Browser unterdrückt werden.

import { useEffect, useRef, useState } from "react";

type DialogRequest = {
  id: number;
  kind: "confirm" | "prompt";
  message: string;
  defaultValue: string;
  resolve: (value: boolean | string | null) => void;
};

let nextId = 1;
let queue: DialogRequest[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function enqueue(kind: DialogRequest["kind"], message: string, defaultValue = "") {
  return new Promise<boolean | string | null>((resolve) => {
    queue = [...queue, { id: nextId++, kind, message, defaultValue, resolve }];
    notify();
  });
}

/** Ja/Nein-Rückfrage innerhalb der Seite. */
export function askConfirm(message: string): Promise<boolean> {
  return enqueue("confirm", message) as Promise<boolean>;
}

/** Texteingabe innerhalb der Seite; null bei „Abbrechen“. */
export function askPrompt(message: string, defaultValue = ""): Promise<string | null> {
  return enqueue("prompt", message, defaultValue) as Promise<string | null>;
}

function finish(request: DialogRequest, value: boolean | string | null) {
  queue = queue.filter((item) => item.id !== request.id);
  request.resolve(value);
  notify();
}

export function PageDialogHost() {
  const [, setVersion] = useState(0);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const listener = () => setVersion((current) => current + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    setValue(current.defaultValue);
    window.setTimeout(() => (current.kind === "prompt" ? inputRef.current?.focus() : confirmRef.current?.focus()), 0);
  }, [current?.id]);  
  if (!current) return null;
  const cancel = () => finish(current, current.kind === "prompt" ? null : false);
  const accept = () => finish(current, current.kind === "prompt" ? value : true);
  const [headline, ...rest] = current.message.split("\n");
  return <div className="modal-backdrop page-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && cancel()} onKeyDown={(event) => { if (event.key === "Escape") cancel(); }}>
    <div className="modal page-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`page-dialog-${current.id}`}>
      <div className="modal-head"><div><span className="badge neutral">{current.kind === "prompt" ? "Eingabe" : "Bitte bestätigen"}</span><h2 id={`page-dialog-${current.id}`}>{headline}</h2>{rest.filter((line) => line.trim()).map((line, index) => <p key={index}>{line}</p>)}</div></div>
      <form onSubmit={(event) => { event.preventDefault(); accept(); }}>
        {current.kind === "prompt" && <label><span>Eingabe</span><textarea ref={inputRef} id={`page-dialog-input-${current.id}`} rows={Math.min(8, Math.max(2, value.split("\n").length + 1))} value={value} onChange={(event) => setValue(event.target.value)}/></label>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={cancel}>Abbrechen</button><button ref={confirmRef} type="submit" className="button primary">{current.kind === "prompt" ? "Übernehmen" : "Ja, fortfahren"}</button></div>
      </form>
    </div>
  </div>;
}
