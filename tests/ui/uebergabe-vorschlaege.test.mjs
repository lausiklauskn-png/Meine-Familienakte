// Reale Eingangsablage und sichtbarer Ablage-Dialog, ausschließlich erfundene Texte.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, DESKTOP, startApp, footer, ready, step, summary } from "./_harness.mjs";

const file = { name: "Unbekannte-Unterlage.txt", mimeType: "text/plain", buffer: Buffer.from("Erfundene Unterlage ohne automatische Einordnung.") };
const hint = '<img src=x onerror="window.__fremd=true">';
const metadata = { vertrag: "familienakte-uebergabe/1", quelle: "Erfundene Partner-App", dateien: [{ name: file.name, sha256: createHash("sha256").update(file.buffer).digest("hex"), lebensbereich: "Probe-Lebensbereich", dokumentart: "Probe-Dokumentart", vorgang: "Erfundener Vorgang", hinweis: hint, automatischSpeichern: true, toId: "fremd" }] };
const companion = { name: "familienakte-uebergabe.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(metadata)) };
const app = await startApp(), profile = mkdtempSync(path.join(tmpdir(), "fa-metadata-"));
let context, page;
const errors = [];
async function start() {
  context = await chromium.launchPersistentContext(profile, { ...DESKTOP, serviceWorkers: "block", ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  page = context.pages()[0]; page.setDefaultTimeout(20000); page.on("pageerror", e => errors.push(e.message));
  await page.goto(app.base); await page.waitForSelector(".site-brand-version");
}
async function rows() { return page.evaluate(() => new Promise((resolve, reject) => {
  const r = indexedDB.open("FamilienakteStapel1"); r.onerror = () => reject(r.error);
  r.onsuccess = () => { const db = r.result, t = db.transaction(["eingang", "eingang-dateien"]), e = t.objectStore("eingang").getAll(), f = t.objectStore("eingang-dateien").getAll();
    t.oncomplete = async () => { db.close(); resolve({ rows: e.result, files: await Promise.all(f.result.map(async x => ({ id: x.id, name: x.file.name, text: await x.file.text() }))) }); }; t.onabort = () => reject(t.error); };
})); }
async function open() {
  await footer(page, "Eingangszentrale");
  await page.locator(".intake-queue-item", { hasText: "Fremde Einordnungsvorschläge" }).getByRole("button", { name: "Zuordnung prüfen", exact: true }).click();
  await page.locator("[data-uebergabe-vorschlag]").waitFor();
}
try {
  await start(); await ready(page);
  await step("Metadaten: Auswahl speichert Originale und Vorschläge getrennt von der Akte", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([file, companion]);
    await page.getByText("Fremde Einordnungsvorschläge", { exact: false }).waitFor();
    const r = await rows(); assert.equal(r.rows.length, 2); assert.equal(r.rows.filter(x => x.savedDocumentId).length, 0);
    assert.equal(r.files.find(x => x.name === file.name).text, file.buffer.toString());
    assert.equal(r.files.find(x => x.name === companion.name).text, companion.buffer.toString());
    assert.equal(r.rows.find(x => x.file.name === file.name).uebergabeVorschlag.lebensbereich, "Probe-Lebensbereich");
  });
  await context.close(); await start();
  await step("Metadaten: echter Browser-Neustart erhält Vorschlag und unbearbeitete Originale", async () => {
    await open(); const m = page.locator(".intake-modal"), card = m.locator("[data-uebergabe-vorschlag]");
    assert.match(await card.innerText(), /Erfundene Partner-App/);
    assert.ok((await card.innerText()).includes(hint)); assert.equal(await card.locator("img").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(window.__fremd)), false);
    assert.equal(await m.locator("textarea[name=notes]").inputValue(), "");
    assert.doesNotMatch(await m.locator(".intake-choice-grid").innerText(), /Probe-Lebensbereich|Probe-Dokumentart/);
    assert.equal((await rows()).files.length, 2);
  });
  await step("Metadaten: erst bewusste Übernahme ändert Formular; keine automatische Ablage", async () => {
    const m = page.locator(".intake-modal");
    await m.getByRole("button", { name: "Vorschläge in das Formular übernehmen", exact: true }).click();
    assert.match(await m.locator(".intake-choice-grid").innerText(), /Probe-Lebensbereich/);
    assert.match(await m.locator(".intake-choice-grid").innerText(), /Probe-Dokumentart/);
    assert.ok((await m.locator("textarea[name=notes]").inputValue()).includes(hint));
    assert.equal((await rows()).rows.filter(x => x.savedDocumentId).length, 0);
    await m.locator("textarea[name=notes]").fill("Von mir geprüfter Hinweis");
    await m.getByRole("button", { name: "Fenster schließen", exact: true }).click();
    await open(); assert.equal(await page.locator(".intake-modal textarea[name=notes]").inputValue(), "");
  });
  await step("Metadaten: Dateiaustausch trägt keinen fremden Hinweis in die neue Datei", async () => {
    const m = page.locator(".intake-modal");
    await m.getByRole("button", { name: "Vorschläge in das Formular übernehmen", exact: true }).click();
    await m.locator("input[type=file]").setInputFiles({ name: "Zweite-Unterlage.txt", mimeType: "text/plain", buffer: Buffer.from("Andere erfundene Unterlage") });
    assert.equal(await m.locator("[data-uebergabe-vorschlag]").count(), 0);
    assert.equal(await m.locator("textarea[name=notes]").inputValue(), "");
    assert.doesNotMatch(await m.locator(".intake-choice-grid").innerText(), /Probe-Lebensbereich/);
    await m.getByRole("button", { name: "Fenster schließen", exact: true }).click();
  });
  await step("Metadaten: manuell korrigiert und ausdrücklich gespeichert; Begleitdatei bleibt erhalten", async () => {
    await open(); const m = page.locator(".intake-modal");
    await m.getByRole("button", { name: "Vorschläge in das Formular übernehmen", exact: true }).click();
    await m.locator("textarea[name=notes]").fill("Von mir geprüfter Hinweis");
    await m.getByRole("button", { name: "Geprüft lokal speichern", exact: true }).click(); await m.waitFor({ state: "detached" });
    const r = await rows(); assert.ok(r.rows.find(x => x.file.name === file.name).savedDocumentId);
    assert.equal(r.files.length, 1); assert.equal(r.files[0].text, companion.buffer.toString());
    assert.equal(errors.length, 0, errors.join(" | "));
  });
} finally { if (context) await context.close(); await app.stop(); rmSync(profile, { recursive: true, force: true }); }
process.exit(summary("Fremde Einordnungsvorschläge"));
