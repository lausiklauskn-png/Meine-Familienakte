// Read-only: compares the real sources, never treats native Pro adapters as PDF core.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const [quelle, pro] = process.argv.slice(2).map(p => resolve(p));
if (!quelle || !pro) throw new Error('Aufruf: node tools/pdf-abgleich.mjs Workflow-PDF Workflow-PDF-Pro');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
for (const cwd of [quelle, pro]) {
  if (git(cwd, 'status', '--porcelain', '--untracked-files=no')) throw new Error('Quelle hat lokale Änderungen');
}
const kern = JSON.parse(readFileSync('public/wfpdf/HERKUNFT.json', 'utf8'));
const app = JSON.parse(readFileSync('public/apps/HERKUNFT.json', 'utf8')).apps['workflow-pdf'];
if (kern.commit !== app.commit) throw new Error('Die beiden Familienakte-Kopien haben unterschiedliche Quellstände');
const baum = git(quelle, 'rev-parse', 'HEAD^{tree}');
const proBaum = git(pro, 'rev-parse', 'HEAD:upstream/workflow-pdf');
console.log(JSON.stringify({
  familienakte: kern.commit,
  workflowPdf: git(quelle, 'rev-parse', 'HEAD'),
  workflowPdfPro: git(pro, 'rev-parse', 'HEAD'),
  updateVorhanden: kern.commit !== git(quelle, 'rev-parse', 'HEAD'),
  gemeinsamerKernBytegleich: baum === proBaum,
  hinweis: 'Update-Patch nur zur Prüfung. Keine automatische Übernahme oder Veröffentlichung. HTML, CSS, Texte und Bedienwege vor Übernahme vergleichen; native Pro-Funktionen separat beurteilen.'
}, null, 2));
if (baum !== proBaum) throw new Error('Workflow-PDF und der eingebettete Pro-Kern weichen ab; zuerst Quelle klären');
