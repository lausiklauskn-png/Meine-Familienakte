// Inventar aller Bedienelemente aus dem Quelltext (Paket A der Analyse).
// Findet <button …>, <input type="file">, <select>, Schalter und Ablageflächen (onDrop) in app/*.tsx,
// bestimmt Beschriftung, Datei:Zeile, Komponente, Handler-Ausdruck und die aufgerufenen
// Fachfunktionen in lib/ bzw. app/local-vault.ts (Textanalyse, bestmöglich).
// Aufruf: node tools/analyse/inventar-aus-code.mjs   → schreibt docs/analyse/inventar-code.json
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appDir = path.join(ROOT, "app");
const libDir = path.join(ROOT, "lib");

// Exportierte Fachfunktionen in lib/ und app/local-vault.ts (Name → Datei)
const fachFunktionen = new Map();
for (const file of [...readdirSync(libDir).map((f) => path.join("lib", f)), "app/local-vault.ts", "app/browser-uploads.ts", "app/sample-family.ts", "app/portal-data.ts", "app/idb-directory.ts"]) {
  if (!/\.tsx?$/.test(file)) continue;
  const text = readFileSync(path.join(ROOT, file), "utf8");
  for (const m of text.matchAll(/^export (?:async )?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm)) fachFunktionen.set(m[1], file);
}

function lineOf(text, index) { let n = 1; for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++; return n; }

/** Liest ab `start` (zeigt auf '<') den Öffnungs-Tag bis zum passenden '>' (Klammern/Strings beachtet). */
function readOpeningTag(text, start) {
  let i = start, depth = 0, quote = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return { tag: text.slice(start, i + 1), end: i + 1, selfClosing: text[i - 1] === "/" };
  }
  return null;
}
/** Liest den Inhalt bis zum passenden </tag> (gleiche Tags verschachtelt). */
function readInner(text, from, tag) {
  const open = new RegExp(`<${tag}(?=[\\s/>])`, "g"), close = `</${tag}>`;
  let depth = 1, i = from;
  while (i < text.length) {
    const nextClose = text.indexOf(close, i);
    open.lastIndex = i; const o = open.exec(text);
    if (nextClose < 0) return null;
    if (o && o.index < nextClose) { depth++; i = o.index + 1; continue; }
    depth--; if (depth === 0) return { inner: text.slice(from, nextClose), end: nextClose + close.length };
    i = nextClose + close.length;
  }
  return null;
}
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|\\{\\s*(?:"([^"]*)"|'([^']*)'|\`([^\`]*)\`)\\s*\\}|\\{([^]*?)\\}(?=\\s[a-zA-Z-]+=|\\s*/?>))`));
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? m[4] ?? (m[5] ? `{${m[5].trim()}}` : null);
}
/** Ausdruck eines Attributs mit { … } (Klammern beachtet). */
function attrExpr(tag, name) {
  const at = tag.indexOf(` ${name}={`);
  if (at < 0) return null;
  let i = at + name.length + 3, depth = 1, quote = null;
  const start = i;
  for (; i < tag.length; i++) {
    const c = tag[i];
    if (quote) { if (c === quote && tag[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++; else if (c === "}") { depth--; if (!depth) return tag.slice(start, i); }
  }
  return null;
}
/** Sichtbarer Text aus JSX-Inhalt: Tags weg, Ausdrücke auf Zeichenketten reduzieren. */
function visibleText(inner) {
  let s = inner.replace(/<[A-Za-z][^>]*\/>/g, " ");
  s = s.replace(/<\/?[A-Za-z][^>]*>/g, " ");
  s = s.replace(/\{([^{}]*)\}/g, (_, expr) => {
    const strings = [...expr.matchAll(/"([^"]{2,})"|'([^']{2,})'|`([^`]{2,})`/g)].map((m) => m[1] ?? m[2] ?? m[3]);
    if (strings.length) return " " + strings.join(" / ") + " ";
    const ident = expr.trim().match(/^[\w.]+$/) ? `{${expr.trim()}}` : "";
    return ` ${ident} `;
  });
  return s.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function componentAt(text, index) {
  const before = text.slice(0, index);
  const re = /(?:^|\n)(?:export (?:default )?)?function ([A-Z][A-Za-z0-9]*)\s*\(|\n(?:export )?const ([A-Z][A-Za-z0-9]*) = (?:\(|\w)/g;
  let name = "?", m;
  while ((m = re.exec(before))) name = m[1] || m[2];
  return name;
}
const inventar = [];
const appFiles = readdirSync(appDir).filter((f) => f.endsWith(".tsx")).sort();
// Definitionen von Hilfsfunktionen in app/ (Name → Rumpf), um Prop-Handler eine Ebene weiter aufzulösen
const definitionen = new Map();
for (const f of appFiles) {
  const text = readFileSync(path.join(appDir, f), "utf8");
  for (const m of text.matchAll(/\n\s*(?:const|async function|function)\s+([a-z][\w$]*)\s*=?\s*(?:async\s*)?\(?[^\n]*\)?\s*(?:=>)?\s*\{?/g)) {
    const start = m.index;
    const body = text.slice(start, Math.min(text.length, start + 1800));
    const end = body.indexOf("\n  };");
    definitionen.set(m[1], end > 0 ? body.slice(0, end) : body.slice(0, 900));
  }
}
function fachAufrufe(expr, tiefe = 0) {
  if (!expr) return [];
  const found = new Set();
  const bare = expr.trim().match(/^([A-Za-z_$][\w$]*)$/);
  if (bare && tiefe < 1 && definitionen.has(bare[1])) for (const x of fachAufrufe(definitionen.get(bare[1]), tiefe + 1)) found.add(x);
  for (const m of expr.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    const n = m[1];
    if (fachFunktionen.has(n)) found.add(`${n} (${fachFunktionen.get(n)})`);
    else if (tiefe < 1 && definitionen.has(n)) for (const x of fachAufrufe(definitionen.get(n), tiefe + 1)) found.add(x);
  }
  return [...found];
}
function handlerKurz(expr) {
  if (!expr) return "";
  if (/^[A-Za-z_$][\w$.]*$/.test(expr.trim())) return expr.trim();
  const calls = [...expr.matchAll(/\b([A-Za-z_$][\w$.]*)\s*\(/g)].map((m) => m[1]).filter((n) => !["void", "setTimeout", "event.preventDefault", "event.stopPropagation", "window.setTimeout"].includes(n));
  const go = expr.match(/\bgo\("([^"]+)"/);
  return [...new Set(calls)].slice(0, 6).join(", ") + (go ? ` → Seite "${go[1]}"` : "");
}

for (const f of appFiles) {
  const text = readFileSync(path.join(appDir, f), "utf8");
  const re = /<(button|select|input|div|article|section|label|a)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(text))) {
    const tagName = m[1];
    const opening = readOpeningTag(text, m.index);
    if (!opening) continue;
    const tag = opening.tag;
    let art = null;
    if (tagName === "button") art = "Knopf";
    else if (tagName === "select") art = "Auswahlliste";
    else if (tagName === "input" && /type="file"/.test(tag)) art = "Datei-Eingang";
    else if (tagName === "a" && / onClick=/.test(tag)) art = "Link-Knopf";
    else if (/ onDrop=/.test(tag)) art = "Ablagefläche";
    else if (tagName === "input" && /type="(checkbox|radio)"/.test(tag)) art = "Schalter";
    if (!art) continue;
    let inner = "", end = opening.end;
    if (!opening.selfClosing && tagName !== "input") { const r = readInner(text, opening.end, tagName); if (r) { inner = r.inner; end = r.end; } }
    const onClick = attrExpr(tag, "onClick") || attrExpr(tag, "onChange") || attrExpr(tag, "onDrop") || "";
    const label = art === "Knopf" || art === "Link-Knopf" ? visibleText(inner) : (attr(tag, "aria-label") || attr(tag, "placeholder") || attr(tag, "accept") || attr(tag, "className") || "");
    const aria = attr(tag, "aria-label"); const title = attr(tag, "title");
    const disabled = attrExpr(tag, "disabled") || (/\sdisabled(\s|>)/.test(tag) ? "immer" : "");
    inventar.push({
      nr: inventar.length + 1, art, datei: `app/${f}`, zeile: lineOf(text, m.index), komponente: componentAt(text, m.index),
      beschriftung: label || aria || title || "(ohne Text)", ariaLabel: aria || "", title: title || "",
      className: attr(tag, "className") || "", disabled: disabled || "",
      handler: handlerKurz(onClick), handlerAusdruck: onClick.replace(/\s+/g, " ").slice(0, 300),
      fachfunktionen: fachAufrufe(onClick),
    });
    re.lastIndex = Math.max(re.lastIndex, Math.min(end, opening.end));
  }
}
mkdirSync(path.join(ROOT, "docs/analyse"), { recursive: true });
writeFileSync(path.join(ROOT, "docs/analyse/inventar-code.json"), JSON.stringify(inventar, null, 1));
const zaehl = {}; for (const e of inventar) zaehl[e.art] = (zaehl[e.art] || 0) + 1;
console.log(`${inventar.length} Bedienelemente aus dem Code:`, zaehl);
const proDatei = {}; for (const e of inventar) proDatei[e.datei] = (proDatei[e.datei] || 0) + 1;
console.log(proDatei);
