// Called only by the trusted scheduled/manual job, after all update tests pass.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const repo = 'lausiklauskn-png/Meine-Familienakte';
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const stand = JSON.parse(readFileSync('work/pdf-abgleich/stand.json', 'utf8'));
if (!stand.updateVorhanden || !stand.angewendet || !/^[a-f0-9]{40}$/.test(stand.quelle) || stand.designAenderungen.length) throw new Error('Kein geprüfter Updatevorschlag');
const branch = 'automation/pdf-' + stand.quelle;
const vorhanden = JSON.parse(run('gh', ['pr', 'list', '--repo', repo, '--head', branch, '--state', 'all', '--json', 'url,state']));
if (vorhanden.length) {
  console.log('Für diesen Quellstand besteht bereits ein Vorschlag: ' + vorhanden[0].url);
} else {
  if (run('git', ['status', '--porcelain', '--untracked-files=no'])) throw new Error('Arbeitsordner hat eigene Änderungen');
  const remote = run('git', ['ls-remote', '--heads', 'origin', 'refs/heads/' + branch]);
  run('git', ['apply', '--index', 'work/pdf-abgleich/update.patch']);
  const dateien = run('git', ['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean);
  if (!dateien.length || dateien.some(p => !p.startsWith('public/apps/workflow-pdf/') && !p.startsWith('public/wfpdf/') && p !== 'public/apps/HERKUNFT.json')) throw new Error('Update enthält unerlaubte Zielpfade');
  if (remote) {
    run('git', ['fetch', 'origin', 'refs/heads/' + branch]);
    if (run('git', ['rev-parse', 'FETCH_HEAD^{tree}']) !== run('git', ['write-tree'])) throw new Error('Vorhandener Updatezweig weicht ab; nicht überschreiben');
  } else {
    run('git', ['switch', '-c', branch]);
    run('git', ['config', 'user.name', 'github-actions[bot]']);
    run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
    run('git', ['commit', '-m', 'Workflow-PDF-Funktionen aus ' + stand.quelle.slice(0, 7) + ' nachziehen']);
    run('git', ['push', 'origin', branch]);
  }
  const body = `Gemeinsamer PDF-Kern: ${stand.bisher} → ${stand.quelle}. Pro-Referenz: ${stand.pro}.

Beide Familienakte-Kopien wurden gemeinsam mit den vorhandenen Kopierwerkzeugen vorbereitet. HTML, CSS, Manifest und Icons bleiben bis auf technische HTML-Versionsverweise unverändert. Brücke, Familienakte-Farben, React-Oberfläche und Nutzerdaten werden nicht ersetzt.

Automatisch geprüft: Updateweg samt Gegenproben, Funktionsvertrag, Herkunft, Ausfüllen, Build und Browserproben beider PDF-Zugänge. JavaScript kann ebenfalls sichtbare Inhalte erzeugen: diesen Entwurf vor Übernahme fachlich und visuell prüfen. Keine automatische Zusammenführung oder App-Veröffentlichung.
`;
  writeFileSync('work/pdf-abgleich/pr.md', body);
  console.log(run('gh', ['pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--draft', '--title', 'PDF-Funktionen aktualisieren: ' + stand.quelle.slice(0, 7), '--body-file', 'work/pdf-abgleich/pr.md']));
  // PRs created with GITHUB_TOKEN do not trigger ordinary PR workflows.
  // Explicit dispatch starts the real checks on the exact update branch.
}
if (!vorhanden.length || vorhanden[0].state === 'OPEN') {
  const kopf = run('git', ['ls-remote', '--heads', 'origin', 'refs/heads/' + branch]).split(/\s+/)[0];
  for (const workflow of ['ci.yml', 'android.yml', 'windows-app.yml']) {
    const runs = JSON.parse(run('gh', ['run', 'list', '--repo', repo, '--workflow', workflow, '--branch', branch, '--event', 'workflow_dispatch', '--limit', '1', '--json', 'headSha']));
    if (!runs.some(r => r.headSha === kopf)) run('gh', ['workflow', 'run', workflow, '--repo', repo, '--ref', branch]);
  }
}
