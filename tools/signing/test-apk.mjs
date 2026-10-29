// Echte Android-Werkzeuge (FA_ANDROID_SDK mit build-tools 36.0.0 und platforms/android-36, in android.yml per sdkmanager):
// signiert künstliche APKs mit einer Wegwerf-Identität über denselben Weg wie der Release-Lauf (tools/signing/apk.mjs).
// Vorbild BookLedgerPro tools/signing/test-apk.mjs. Nie als App-Version veröffentlichen.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { APP_ID, createIdentity, saveNewIdentity, checked } from './identity.mjs';
import { signApk } from './apk.mjs';

const sdk = process.env.FA_ANDROID_SDK;
const skip = !sdk && 'FA_ANDROID_SDK fehlt (Android-SDK mit build-tools 36.0.0 und platforms/android-36); läuft in android.yml';
const tools = sdk ? path.join(sdk, 'build-tools/36.0.0') : '';
const signer = path.join(tools, 'apksigner'), aapt = path.join(tools, 'aapt');
const key = randomBytes(32).toString('hex'), commit = '7'.repeat(40);
let directory, counter = 0, envelope;
before(async () => { if (skip) return;
  directory = await mkdtemp(path.join(tmpdir(), 'fa-apk-probe-'));
  envelope = await createIdentity(key); await saveNewIdentity(directory, envelope);
});
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

async function fixture({ app = APP_ID, version = '2.28.3', code = 1, debug = false } = {}) {
  const folder = path.join(directory, 'apk-' + (++counter)); await mkdir(folder);
  const manifest = path.join(folder, 'AndroidManifest.xml');
  await writeFile(manifest, `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${app}" android:versionCode="${code}" android:versionName="${version}"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/><application android:label="Probe" android:hasCode="false" android:debuggable="${debug}"/></manifest>`);
  const raw = path.join(folder, 'raw.apk'), input = path.join(folder, 'unsigned.apk'), output = path.join(folder, 'signed.apk');
  checked(aapt, ['package', '-f', '-M', manifest, '-I', path.join(sdk, 'platforms/android-36/android.jar'), '-F', raw], {});
  checked(path.join(tools, 'zipalign'), ['-f', '-p', '4', raw, input], {});
  return { input, output, signer, aapt, tag: `android-v${version}`, commit, directory, key };
}

test('Echte APK wird signiert; Kennung, Version und Zertifikat stimmen', { skip }, async () => {
  const args = await fixture(), vorher = await readFile(args.input);
  const r = await signApk(args);
  assert.equal(r.applicationId, APP_ID); assert.equal(r.versionCode, 1); assert.equal(r.versionName, '2.28.3');
  assert.equal(r.certificateSha256, envelope.certificateSha256);
  assert.deepEqual(await readFile(args.input), vorher);
  assert.equal(spawnSync(signer, ['verify', args.output]).status, 0);
});
test('Tag mit Zusatz (android-v2.28.3-test.3) und höhere Buildnummer: dieselbe Identität', { skip }, async () => {
  const args = await fixture({ code: 7 }); const r = await signApk({ ...args, tag: 'android-v2.28.3-test.3' });
  assert.equal(r.versionCode, 7); assert.equal(r.certificateSha256, envelope.certificateSha256);
});
test('Fremde App wird nicht als Familienakte ausgeliefert', { skip }, async () => {
  const args = await fixture({ app: 'de.familyprojekt.bookledgerpro' });
  await assert.rejects(signApk(args), /nicht zur Familienakte/); await assert.rejects(access(args.output));
});
test('Debug-APK und falsche Version werden abgewiesen, ohne Ausgabe', { skip }, async () => {
  const debug = await fixture({ debug: true }); await assert.rejects(signApk(debug), /Debug-APK/); await assert.rejects(access(debug.output));
  const falsch = await fixture(); await assert.rejects(signApk({ ...falsch, tag: 'android-v9.0.0' }), /APK-Version/); await assert.rejects(access(falsch.output));
  const tag = await fixture(); await assert.rejects(signApk({ ...tag, tag: 'v2.28.3' }), /Release-Tag/);
});
test('Änderung an der signierten APK entdeckt der echte apksigner', { skip }, async () => {
  const args = await fixture(); await signApk(args);
  const bytes = await readFile(args.output); bytes[64] ^= 1; await writeFile(args.output, bytes);
  assert.notEqual(spawnSync(signer, ['verify', args.output], { stdio: 'pipe' }).status, 0);
});
test('Vorhandene Ausgabe bleibt; falsche Freigabe hinterlässt keine APK', { skip }, async () => {
  const da = await fixture(); await writeFile(da.output, 'vorhanden');
  await assert.rejects(signApk(da), /EEXIST/); assert.equal(await readFile(da.output, 'utf8'), 'vorhanden');
  const falsch = await fixture();
  await assert.rejects(signApk({ ...falsch, key: randomBytes(32).toString('hex') }), /Freigabe falsch/); await assert.rejects(access(falsch.output));
});
