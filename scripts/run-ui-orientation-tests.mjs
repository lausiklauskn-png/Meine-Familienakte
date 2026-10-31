import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createDictationSession, speechConstructor } from "../lib/browser-dictation.ts";
import { UI_HELP } from "../lib/ui-help.ts";

const read = (file) => readFileSync(file, "utf8");
let passed = 0;
const check = (name, test) => { test(); passed++; console.log(`🟢 ${name}`); };
function fixture(overrides = {}) {
  const instances = [], texts = [], states = [], hints = [], tasks = new Set();
  let online = true;
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.onstart?.(); }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  }
  const session = createDictationSession({ constructor: () => Recognition, online: () => online, onText: (text) => texts.push(text), onState: (state) => states.push(state), onHint: (text, error) => hints.push({ text, error }), schedule: (task) => { tasks.add(task); return task; }, cancel: (task) => tasks.delete(task), ...overrides });
  return { session, instances, texts, states, hints, tasks, offline: () => { online = false; session.offline(); } };
}
const result = (transcript, isFinal) => ({ isFinal, 0: { transcript }, length: 1 });
check("Browseranbieter: native und vorhandene Webkit-Erkennung", () => { const Native = class {}; assert.equal(speechConstructor({ SpeechRecognition: Native }), Native); assert.equal(speechConstructor({ webkitSpeechRecognition: Native }), Native); assert.equal(speechConstructor({}), undefined); });
check("Diktat fügt Text an, aktualisiert Zwischenstand und verdoppelt finale Ergebnisse nicht", () => {
  const f = fixture(); f.session.start("Vorhanden"); const r = f.instances[0];
  assert.equal(r.lang, "de-DE"); assert.ok(r.continuous && r.interimResults);
  r.onresult({ resultIndex: 0, results: [result("Ein Zwischenstand", false)] }); assert.equal(f.texts.at(-1), "Vorhanden Ein Zwischenstand");
  r.onresult({ resultIndex: 0, results: [result("Ein Satz", true)] }); r.onresult({ resultIndex: 0, results: [result("Ein Satz", true), result("Zweiter Satz", true)] });
  assert.equal(f.texts.at(-1), "Vorhanden Ein Satz Zweiter Satz"); f.session.stop();
});
check("Android-Chrome wiederholt den bisherigen Satz in jedem fertigen Stück: kein Echo (Klaus 2026-10-31)", () => {
  const f = fixture(); f.session.start(""); const r = f.instances[0];
  const stuecke = ["es", "es könnte", "es könnte sein", "es könnte sein dass", "es könnte sein dass die Mikrofonaufnahme nicht richtig"];
  stuecke.forEach((_, i) => r.onresult({ resultIndex: i, results: stuecke.slice(0, i + 1).map((t) => result(t, true)) }));
  assert.equal(f.texts.at(-1), "es könnte sein dass die Mikrofonaufnahme nicht richtig");
  r.onresult({ resultIndex: 5, results: [...stuecke.map((t) => result(t, true)), result("es könnte sein dass die Mikrofonaufnahme nicht richtig ist", false)] });
  assert.equal(f.texts.at(-1), "es könnte sein dass die Mikrofonaufnahme nicht richtig ist"); f.session.stop();
});
check("Suchdiktat ersetzt Suchtext, ohne vorherigen Suchbegriff anzuhängen", () => { const f = fixture(); f.session.start("Alt", false); f.instances[0].onresult({ results: [result("Neue Suche", true)], resultIndex: 0 }); assert.equal(f.texts.at(-1), "Neue Suche"); });
check("Browserunterbrechung setzt Diktat fort und erhält bestätigten Text", () => {
  const f = fixture(); f.session.start(""); f.instances[0].onresult({ results: [result("Erster Satz", true)], resultIndex: 0 }); f.instances[0].onend();
  assert.equal(f.tasks.size, 1); [...f.tasks][0](); f.instances[1].onresult({ results: [result("Zweiter Satz", true)], resultIndex: 0 }); assert.equal(f.texts.at(-1), "Erster Satz Zweiter Satz"); f.session.stop();
});
check("Beenden verwirft Neustart und schützt nachfolgende Tastatureingabe vor späten Ergebnissen", () => {
  const f = fixture(); f.session.start(""); const r = f.instances[0]; const late = r.onresult; r.onend(); f.session.stop(); assert.equal(f.tasks.size, 0); late({ results: [result("Zu spät", true)], resultIndex: 0 }); assert.equal(f.texts.length, 0); assert.equal(f.session.active, false); assert.equal(f.states.at(-1), false);
});
for (const [code, expected] of [["not-allowed", /verweigert/], ["service-not-allowed", /verweigert/], ["audio-capture", /Kein Mikrofon/], ["network", /nicht erreichbar/]]) {
  check(`Sprachfehler ${code}: beendet, deutscher Hinweis, kein Textverlust`, () => { const f = fixture(); f.session.start("Text"); f.instances[0].onerror({ error: code }); assert.equal(f.session.active, false); assert.match(f.hints.at(-1).text, expected); assert.equal(f.hints.at(-1).error, true); assert.equal(f.texts.length, 0); });
}
check("Offline vor Start und während Diktat: sicher beendet, Tastaturhinweis", () => { const f = fixture(); f.session.start(""); f.offline(); assert.equal(f.session.active, false); assert.match(f.hints.at(-1).text, /Offline.*tippen/); const g = fixture({ online: () => false }); g.session.start(""); assert.equal(g.instances.length, 0); });
check("Nicht unterstützter Browser und fehlschlagender Start bleiben bedienbar", () => { const f = fixture({ constructor: () => undefined }); f.session.start(""); assert.match(f.hints.at(-1).text, /nicht verfügbar.*tippen/); const g = fixture({ constructor: () => class { start() { throw Error("denied"); } stop() {} } }); g.session.start(""); assert.equal(g.session.active, false); assert.match(g.hints.at(-1).text, /konnte nicht starten/); });
check("Unmount beendet Erkennung, spätere Ergebnisse und Timer", () => { const f = fixture(); f.session.start(""); const r = f.instances[0]; f.session.dispose(); assert.ok(r.stopped); assert.equal(r.onresult, null); f.session.start(""); assert.equal(f.instances.length, 1); });

const controls = read("app/ui-controls.tsx"), portal = read("app/health-portal.tsx"), css = read("app/globals.css");
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const compile = (source, custom = {}) => ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from "([^"]+)"/g, (_all, specifier) => `from ${JSON.stringify(custom[specifier] || (specifier === "../lib/browser-dictation" ? new URL("../lib/browser-dictation.ts", import.meta.url).href : import.meta.resolve(specifier)))}`);
const activityModule = dataModule('export const useActivity = () => () => {};');
const ui = await import(dataModule(compile(controls, { "./ui-activity": activityModule })));
check("Echte React-Ausgabe: Freitext mit einem Mikrofon, Namen und Pflichtfeld erhalten", () => {
  const html = renderToStaticMarkup(React.createElement(ui.VoiceInput, { value: "Beispiel", onValueChange: () => {}, speechLabel: "Notiz", name: "notes", required: true }));
  assert.match(html, /name="notes"/); assert.match(html, /required=""/); assert.match(html, /value="Beispiel"/); assert.equal((html.match(/class="dictation-button /g) || []).length, 1); assert.match(html, /type="button"/);
});
check("Echte React-Ausgabe: Brief und Assistenz mehrzeilig, readonly ohne Mikrofon", () => {
  const props = { value: "Zeile eins\nZeile zwei", onValueChange: () => {}, speechLabel: "Brief", rows: 5 };
  const html = renderToStaticMarkup(React.createElement(ui.VoiceTextarea, props)); assert.match(html, /rows="5"/); assert.match(html, /Zeile eins/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(ui.VoiceTextarea, { ...props, readOnly: true })), /dictation-button/);
});
check("Echte React-Ausgabe: Fragezeichen mit eindeutigem Namen, initial geschlossen", () => { const html = renderToStaticMarkup(React.createElement(ui.InfoPopover, { label: "Archiv erklären", text: "Hilfe" })); assert.match(html, /aria-label="Archiv erklären"/); assert.match(html, /aria-expanded="false"/); assert.doesNotMatch(html, /role="note"/); });

// Execute the real popover handlers with deterministic React/DOM event doubles.
// This is not a browser or device test.
const events = new Map(), refs = [], cleanups = []; let hookState = false;
const add = (name, fn) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); };
const remove = (name, fn) => events.get(name)?.delete(fn);
const fire = (name, event) => [...events.get(name) || []].forEach((fn) => fn(event));
globalThis.__uiTestHooks = { useState: () => [hookState, (next) => { hookState = next; }], useRef: () => { const ref = { current: { contains: (target) => target === "inside" } }; refs.push(ref); return ref; }, useId: () => "test-info", useEffect: (callback) => { cleanups.push(callback()); } };
globalThis.document = { addEventListener: add, removeEventListener: remove };
globalThis.window = { addEventListener: add, removeEventListener: remove, dispatchEvent: (event) => { fire(event.type, event); return true; } };
const fakeReact = dataModule('export const {useState,useRef,useId,useEffect}=globalThis.__uiTestHooks;');
const fakeJSX = dataModule('export const jsx=(type,props)=>({type,props}); export const jsxs=jsx;');
const fakeIcons = dataModule('export const CircleHelp="help",Mic="mic",MicOff="mic-off",X="close";');
const simulated = await import(dataModule(compile(controls, { react: fakeReact, "react/jsx-runtime": fakeJSX, "lucide-react": fakeIcons, "./ui-activity": activityModule })));
const rerender = () => { cleanups.splice(0).forEach((cleanup) => cleanup?.()); return simulated.InfoPopover({ text: "Erklärung", label: "Hilfe" }); };
const clickInfo = (view) => view.props.children[0].props.onClick({ stopPropagation() {} });
check("Fragezeichen: Öffnen, derselbe Button schließt, Inhalt sichtbar", () => { let view = rerender(); clickInfo(view); view = rerender(); assert.equal(hookState, true); assert.equal(view.props.children[1].props.role, "note"); clickInfo(view); assert.equal(hookState, false); });
check("Fragezeichen: Klick innen bleibt offen, Pointer außen schließt auch auf Touch", () => { let view = rerender(); clickInfo(view); view = rerender(); fire("pointerdown", { target: "inside" }); assert.equal(hookState, true); fire("pointerdown", { target: "outside" }); assert.equal(hookState, false); });
check("Fragezeichen: Escape und anderes Infofenster schließen", () => { let view = rerender(); clickInfo(view); rerender(); fire("keydown", { key: "Escape" }); assert.equal(hookState, false); view = rerender(); clickInfo(view); rerender(); fire("family-info-open", { detail: "other-info" }); assert.equal(hookState, false); });
cleanups.splice(0).forEach((cleanup) => cleanup?.()); delete globalThis.document; delete globalThis.window; delete globalThis.__uiTestHooks;

check("Hilfe und Kontext verwenden dieselben Beschreibungen", () => { assert.ok(Object.keys(UI_HELP).length >= 40); assert.match(portal, /Object.entries\(UI_HELP\)/); assert.match(portal, /Spracherkennung des Browsers/); assert.match(controls, /family-info-open/); });
check("Browser-Sprache führt weder Audioablage noch zusätzlichen Dienst ein", () => { assert.doesNotMatch(read("lib/browser-dictation.ts") + controls, /fetch\(|MediaRecorder|localStorage|indexedDB|api\.openai/); });
check("Mikrofonstopp bei Tippen und Wechsel zum anderen Feld ist verdrahtet", () => { assert.match(controls, /family-dictation-typed/); assert.match(controls, /family-dictation-start/); assert.match(portal, /onInputCapture/); });
check("Schwarz aus, Rot aktiv plus Text; gelbe Eingaben, blaue Überschriften", () => { assert.match(css, /dictation-button \{[^}]*color: #111/); assert.match(css, /dictation-button.listening \{[^}]*color: #bb182d/); assert.match(controls, /Aufnahme läuft/); assert.match(css, /background: #fffdf0/); assert.match(css, /background: #edf5fc/); });
check("Responsive Regeln: zwei Spalten bis 900px und eine bis 620px; Text darf umbrechen", () => { assert.match(css, /@media \(max-width: 900px\)/); assert.match(css, /@media \(max-width: 620px\)/); assert.match(css, /grid-template-columns: minmax\(0,1fr\)/); assert.match(css, /overflow-wrap: anywhere/); assert.match(css, /width: 44px; height: 44px/); });
check("Assistenzkarten: Hauptaktion und Fragezeichen sind Geschwister, keine verschachtelten Buttons", () => { const source = read("app/assistant-center.tsx"); assert.match(source, /<article key=\{item.id\}/); assert.match(source, /<\/button><InfoPopover label=\{`\$\{item.label\} erklären`\}/); assert.match(source, /<VoiceTextarea rows=\{4\}/); assert.match(source, /speechLabel="Schreiben oder E-Mail"/); });
check("Datums-, Kennungs- und Auswahlfelder erhalten keine neu angelegte Sprachsteuerung", () => { for (const file of ["app/health-portal.tsx", "app/assistant-center.tsx", "app/document-scan-dialog.tsx"]) { const source = read(file); assert.doesNotMatch(source, /<VoiceInput[^>]*type="(?:date|checkbox|radio|file|number)"/); assert.doesNotMatch(source, /<VoiceInput[^>]*value=\{(?:personId|objectId|caseId|documentId)\}/); } });
check("Alle kontextuellen Hilfen sind unabhängig von Hauptbuttons und Links", () => {
  for (const file of ["app/health-portal.tsx", "app/assistant-center.tsx", "app/central-intake-center.tsx", "app/document-scan-dialog.tsx"]) {
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => { if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "InfoPopover") { let parent = node.parent; while (parent) { if (ts.isJsxElement(parent)) assert.ok(!["button", "a", "summary"].includes(parent.openingElement.tagName.getText(source)), `${file}: Hilfe in Hauptaktion verschachtelt`); parent = parent.parent; } } ts.forEachChild(node, visit); }; visit(source);
  }
});
console.log(`UI-Orientierung: ${passed}/${passed} technische Prüfungen bestanden. Reale Browser-, Mikrofon-, Windows- und Mobilgerät-Prüfung weiterhin offen.`);
