import { capacitorStub } from "./_capacitor-stub.mjs";
// Gegen den belegten Löschfehler und die Trennung von echten Browserdateien.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createSamplePdf } from "../../lib/sample-pdf.ts";
import { startApp, launchBrowser, DESKTOP, HANDY, check, step, summary, footer, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const app = await startApp(), browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  if (process.env.DEMO_BACKEND === "indexeddb") await context.addInitScript(() => {
    localStorage.setItem("mmi-browser-speicher", "indexeddb");
    localStorage.setItem("Familienakte-Demo-v1:mmi-browser-speicher", "indexeddb");
  });
  const page = await context.newPage();
  const errors = collectErrors(page); page.setDefaultTimeout(20000);
  await page.goto(app.base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
  const pdf = createSamplePdf({ sender: "Erfundene eigene Ablage", place: "Wolkenhain, 04.11.2026", title: "Eigene Unterlage behalten", body: "Eindeutiger eigener Testbeleg. Keine Beispieldaten-Herkunft." });
  const bytes = Buffer.from(pdf), hash = createHash("sha256").update(bytes).digest("hex");
  async function fixture() { await vaultFixture(page); }
  async function documents() {
    await fixture();
    return page.evaluate(async () => {
      const f = window.__vaultFixture, handle = await f.browserVault(), data = await f.readLocalVaultData(handle);
      const documents = [];
      for (const item of data.documents) documents.push({ id: item.id, name: item.originalName, hash: await f.fileChecksum(await f.readLocalDocumentFile(handle, item.id)) });
      return documents;
    });
  }
  async function importFile(name, buffer = bytes, mimeType = "application/pdf") {
    await footer(page, "Dokumentenbibliothek");
    await page.getByRole("button", { name: "Neue Unterlage", exact: true }).first().click();
    await page.locator('.modal input[type="file"]').setInputFiles({ name, mimeType, buffer });
    const modal = page.locator(".modal").last();
    const skip = modal.getByRole("button", { name: "Nicht verknüpfen", exact: true });
    if (await skip.count()) await skip.click();
    await modal.getByRole("button", { name: "Geprüft lokal speichern", exact: true }).click();
    await page.locator('.modal input[type="file"]').waitFor({ state: "detached" });
  }
  await step("Eigene Akte startet ohne automatisch erzeugte Beispiele", async () => { assert.equal((await documents()).length, 0); });
  await importFile("Eigene_Pruefunterlage.pdf");
  const before = await documents(); assert.equal(before.length, 1); assert.equal(before[0].hash, hash);
  await step("Gegenprobe wiederholtes Laden/Entfernen: eigene Datei und Kennung bleiben", async () => {
    await fixture();
    await page.evaluate(async () => {
      const f = window.__vaultFixture, h = await f.browserVault();
      await f.seedSampleFamily(h, { force: true }); await f.removeSampleFamily(h);
      await f.seedSampleFamily(h, { force: true }); await f.removeSampleFamily(h);
    });
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual(await documents(), before);
  });
  await step("Vergiftete alte Löschliste darf eigene Kennungen nicht löschen", async () => {
    await page.evaluate((id) => localStorage.setItem("mmi-sample-family-ids", JSON.stringify([id])), before[0].id);
    await fixture(); await page.evaluate(async () => { const f = window.__vaultFixture; await f.removeSampleFamily(await f.browserVault()); });
    assert.deepEqual(await documents(), before);
  });
  await step("Alte gemischte Beispiele werden vor dem Demo-Einstieg bereinigt", async () => {
    await fixture();
    await page.evaluate(async () => {
      const f = window.__vaultFixture, h = await f.browserVault();
      await f.seedSampleFamily(h, { force: true });
      const index = await f.vaultInternalsForTests.readIndex(h);
      // Persistiertes Format vor 2.28.19: allgemeine Quellen bei generierten Ereignissen.
      for (const record of index.records) if (record.recordType === "event" && record.source === "Beispieldaten – frei erfunden") record.source = record.data.entryKind === "correspondence" ? "Assistenz- und Korrespondenzzentrale" : "Tagebuch & Erinnerungsprotokoll";
      await f.vaultInternalsForTests.writeIndex(h, index);
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Demo öffnen", exact: true }).click();
    await page.getByRole("button", { name: "Demo verlassen", exact: true }).waitFor();
    await page.getByRole("button", { name: "Demo verlassen", exact: true }).click();
    await page.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
    assert.deepEqual(await documents(), before);
    const records = await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; });
    assert.equal(records.length, 0);
  });
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).click();
  await page.locator('.sample-data-notice strong:has-text("Alle Daten")').waitFor();
  await step("Demo enthält wirkliche erfundene PDF-Dateien, keine eigene Unterlage", async () => {
    const demo = await documents(); assert.ok(demo.length >= 15); assert.ok(demo.every(d => d.hash.length === 64)); assert.ok(!demo.some(d => d.name === before[0].name));
  });
  await importFile("Nur_Demo_Import.txt", Buffer.from("Frei erfundener Testeingang für die getrennte Demo. Wolkenhain, 4. November 2026."), "text/plain");
  await step("Demo-Import über die echte Oberfläche überlebt Neuladen", async () => {
    await page.reload({ waitUntil: "networkidle" }); assert.ok((await documents()).some(d => d.name === "Nur_Demo_Import.txt"));
  });
  await step("Vollsicherung und Wiederherstellung in leerem getrenntem Browserziel", async () => {
    await fixture();
    const result = await page.evaluate(async () => {
      const f = window.__vaultFixture, h = await f.browserVault();
      const backupRoot = await h.getDirectoryHandle("Probe_Sicherungen", { create: true });
      const backup = await f.writeFullFamilyBackup({ source: h, destination: backupRoot, appVersion: "demo-test" });
      const backupHandle = await backupRoot.getDirectoryHandle(backup.folderName);
      const target = await h.getDirectoryHandle("Probe_Wiederherstellung", { create: true });
      await f.restoreFullFamilyBackup({ backup: backupHandle, emptyTarget: target });
      const a = await f.readLocalVaultData(h), b = await f.readLocalVaultData(target);
      const hashes = async (handle, docs) => Promise.all(docs.map(async d => [d.id, await f.fileChecksum(await f.readLocalDocumentFile(handle, d.id))]));
      return { a: await hashes(h, a.documents), b: await hashes(target, b.documents), recordsA: a.records, recordsB: b.records, relationsA: a.relations, relationsB: b.relations };
    });
    assert.deepEqual(result.b, result.a); assert.deepEqual(result.recordsB, result.recordsA); assert.deepEqual(result.relationsB, result.relationsA);
  });
  await page.getByRole("button", { name: "Demo verlassen", exact: true }).click();
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
  await step("Rückkehr zur eigenen Akte bewahrt Kennung und PDF-Bytes", async () => { assert.deepEqual(await documents(), before); });
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).click();
  await page.getByRole("button", { name: "Demo zurücksetzen", exact: true }).click();
  await page.getByRole("button", { name: "Ja, fortfahren", exact: true }).click();
  await page.waitForURL(url => url.searchParams.get("demo") === "1");
  await page.locator('.sample-data-notice strong:has-text("Alle Daten")').waitFor();
  await step("Zurücksetzen entfernt auch Testimporte, erneuert nur die Demo", async () => { assert.ok(!(await documents()).some(d => d.name === "Nur_Demo_Import.txt")); });
  await page.getByRole("button", { name: "Demo verlassen", exact: true }).click();
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
  await step("Eigene Akte bleibt auch nach Demo-Reset und Neustart unverändert", async () => { await page.reload({ waitUntil: "networkidle" }); assert.deepEqual(await documents(), before); });
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).click();
  await page.getByRole("button", { name: "Demo löschen und verlassen", exact: true }).click();
  await page.getByRole("button", { name: "Ja, fortfahren", exact: true }).click();
  await page.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
  await step("Demo vollständig löschen: nur der benannte Testbereich verschwindet", async () => {
    assert.deepEqual(await documents(), before);
    const remains = await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      return { folders: await Array.fromAsync(root.keys()), databases: (await indexedDB.databases()).map(db => db.name) };
    });
    assert.ok(!remains.folders.some(name => name.startsWith("Familienakte-Demo-v1:")));
    assert.ok(!remains.databases.some(name => name.startsWith("Familienakte-Demo-v1:")));
  });
  const nativeContext = await browser.newContext(HANDY);
  await nativeContext.addInitScript(capacitorStub);
  await nativeContext.addInitScript(() => {
    window.__demoNativeCalls = 0;
    window.Capacitor.Plugins.FamilienakteTresor = { zustand: async () => { window.__demoNativeCalls++; return { status: "offen", id: "echter-tresor" }; } };
    window.Capacitor.Plugins.FamilienakteShare.pending = async () => { window.__demoNativeCalls++; return { items: [] }; };
  });
  const mobile = await nativeContext.newPage();
  await mobile.goto(app.base + "?demo=1", { waitUntil: "networkidle" });
  await mobile.locator('.sample-data-notice strong:has-text("Alle Daten")').waitFor();
  await footer(mobile, "Sicherheitscenter");
  await step("Gestellte Android-Brücke: Demo liest weder echten Tresor noch Teilen-Eingang", async () => {
    await mobile.waitForTimeout(1800);
    assert.equal(await mobile.evaluate(() => window.__demoNativeCalls), 0);
  });
  await step("Demo-Schalter auf schmalem Bildschirm ohne seitliches Überlaufen", async () => {
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await mobile.getByRole("button", { name: "Demo verlassen", exact: true }).click();
    await mobile.getByRole("button", { name: "Demo öffnen", exact: true }).waitFor();
  });
  check(errors.length === 0, "Keine Browserfehler im Demo-/Echtwechsel", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Demo-Arbeitsbereich"));
