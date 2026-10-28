// tools/signing/cli.mjs — dauerhafte Android-Signieridentität der Familienakte (Klaus 2026-10-28: „bereite den festen
// Signaturschlüssel vor … so wie immer“). Übernommen aus BookLedgerPro (tools/signing, Stand f6633c8), dort aus Workflow PDF Pro.
// init (einmal, nur im Workflow „Dauerhafte Familienakte-Signieridentität“), check, sign-apk (im Release-Workflow).
// Eigener Schlüssel nur für die Familienakte, nie der einer anderen App. Kein Schlüsselinhalt verlässt den Runner.
import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNLOCK_NAME, createIdentity, saveNewIdentity, verifyPinnedIdentity } from './identity.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.join(root, 'signing');
const [command, ...args] = process.argv.slice(2);
const key = process.env[UNLOCK_NAME];
try {
  if (command === 'init') {
    for (const name of ['android-release.enc.json', 'android-certificate.json']) {
      try { await lstat(path.join(directory, name)); throw new Error('Signieridentität vorhanden; Initialisierung abgebrochen.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const envelope = await createIdentity(key);
    await saveNewIdentity(directory, envelope);
    await verifyPinnedIdentity(directory, key);
    console.log('Eigene Signieridentität erstellt und Wiederherstellung geprüft. Zertifikat SHA-256: ' + envelope.certificateSha256);
  } else if (command === 'check') {
    await verifyPinnedIdentity(directory, key, identity => { console.log('Identität wiederhergestellt; Zertifikat SHA-256: ' + identity.fingerprint); });
  } else if (command === 'sign-apk') {
    const [input, output] = args;
    const { signApk } = await import('./apk.mjs');
    const receipt = await signApk({ input, output, directory, key,
      signer: process.env.FA_APKSIGNER, aapt: process.env.FA_AAPT,
      tag: process.env.FA_RELEASE_TAG, commit: process.env.FA_RELEASE_COMMIT });
    console.log('APK-Signatur, Zertifikat, App-Kennung und Version geprüft. SHA-256: ' + receipt.apkSha256);
  } else {
    throw new Error('Aufruf: node tools/signing/cli.mjs init | check | sign-apk <unsigned.apk> <neue.apk>');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
