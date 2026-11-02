import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [java, jar, root, classes] = process.argv.slice(2);
const config = path.join(root, 'unverbunden.json');
const run = spawnSync(java, ['-Xmx256m', '-Djava.awt.headless=true', '-cp', jar,
  'de.familyprojekt.familienakte.ProTresorEngine', config], {
  input: '{"aktion":"zustand"}\n{"aktion":"shell"}\n', encoding: 'utf8', timeout: 30000,
});
assert.equal(run.status, 0, run.stderr || String(run.error || ''));
assert.deepEqual(run.stdout.trim().split(/\r?\n/).map(s => JSON.parse(s)),
  [{ ok: { status: 'getrennt' } }, { error: 'FA_TRESOR_AKTION_UNGUELTIG' }]);
assert.equal(existsSync(config), false, 'Abfrage legt keinen Ersatzbestand an');
console.log('Installierte Windows-Engine: echte Prozess-Pipe und EOF grün');

const { grossePipe } = await import("../../tools/native/pro-tresor-pipe-probe.mjs");
await grossePipe(java, jar, classes);
