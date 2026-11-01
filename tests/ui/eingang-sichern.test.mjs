// Nur erfundene Unterlagen. Echter Browser mit wieder geöffnetem Profil:
// Arbeitsstand, Originalbytes, unterbrochene Analyse und Transaktionsabbruch.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, DESKTOP, ROOT, startApp, ready, footer, step, summary } from "./_harness.mjs";

const app = await startApp();
const profil = mkdtempSync(path.join(tmpdir(), "fa-eingang-"));
const pdf = Array.from(readFileSync(path.join(ROOT, "tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf")));
let context, page, fehlgeschlagen = false;
const fehler = [], konsole = [];
async function probe(name, fn) {
  if (await step(name, fn) === false) {
    fehlgeschlagen = true;
    const info = { name, profil, url: page.url(), fehler, konsole, text: await page.locator("body").innerText().catch(() => "nicht lesbar") };
    writeFileSync(path.join(tmpdir(), "fa-eingang-fehler.json"), JSON.stringify(info, null, 2));
    console.error("Neustart-Diagnose:", JSON.stringify(info));
    throw new Error(name);
  }
}
async function starten() {
  context = await chromium.launchPersistentContext(profil, {
    ...DESKTOP, serviceWorkers: "block",
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  page = context.pages()[0]; page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => fehler.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") konsole.push(m.text()); });
}
async function lesen() {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const r = indexedDB.open("FamilienakteStapel1");
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result, t = db.transaction(["stapel", "eingang", "eingang-dateien"]);
      const s = t.objectStore("stapel").getAll(), e = t.objectStore("eingang").getAll(), d = t.objectStore("eingang-dateien").getAll();
      t.oncomplete = () => { db.close(); resolve({ stapel: s.result.map((x) => x.id), eingang: e.result, dateien: d.result.map((x) => x.id) }); };
      t.onabort = () => { db.close(); reject(t.error); };
    };
  }));
}
async function eingang() { await page.goto(app.base); await ready(page); await footer(page, "Eingangszentrale"); }
try {
  await starten();
  // Vor dem ersten App-Start die alte Datenbankfassung mit einem echten PDF anlegen.
  await page.goto(new URL("manifest.webmanifest", app.base).href);
  await page.evaluate((bytes) => new Promise((resolve, reject) => {
    const r = indexedDB.open("FamilienakteStapel1", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("stapel", { keyPath: "id" });
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result, t = db.transaction("stapel", "readwrite");
      t.objectStore("stapel").put({ id: "alt-1", name: "Garantiebeleg_Waschautomat_Lavorix.pdf", pdf: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), sicher: true, grund: "Erfundene Probe", quelle: "pdf", groesse: bytes.length, zeit: new Date().toISOString() });
      t.oncomplete = () => { db.close(); resolve(); }; t.onabort = () => reject(t.error);
    };
  }), pdf);
  await eingang();
  await probe("Alte Stapel-Ablage wird ohne Verlust übernommen", async () => {
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await page.locator(".mega-menu button", { hasText: "Stapel (noch einordnen)" }).first().click();
    await page.locator("[data-stapel-zeile]").waitFor();
    assert.equal(await page.locator("[data-stapel-zeile]").count(), 1);
  });
  await probe("Einordnen bestätigt Originaldatei und Arbeitsstand zusammen", async () => {
    await page.locator("[data-stapel-einordnen]").click();
    await page.locator(".fa-stapel-leer").waitFor();
    const state = await lesen();
    assert.equal(state.eingang.length, 1); assert.equal(state.dateien.length, 1); assert.equal(state.stapel.length, 0);
    assert.equal(state.eingang[0].file.size, pdf.length);
    assert.deepEqual(Object.keys(state.eingang[0].file).sort(), ["lastModified", "name", "size", "type"]);
    await footer(page, "Eingangszentrale");
    await page.waitForFunction(() => document.querySelector(".intake-queue-item button.primary")?.disabled === false);
  });
  await context.close();
  await starten(); await eingang();
  await probe("Neustart erhält den Eingang und die Originaldatei bytegleich", async () => {
    await page.locator(".intake-queue-item button", { hasText: "Zuordnung prüfen" }).waitFor();
    await page.waitForFunction(() => document.querySelector(".intake-queue-item button.primary")?.disabled === false);
    const bytes = await page.evaluate(() => new Promise((resolve, reject) => {
      const r = indexedDB.open("FamilienakteStapel1");
      r.onsuccess = () => {
        const db = r.result, t = db.transaction("eingang-dateien"), d = t.objectStore("eingang-dateien").getAll();
        t.oncomplete = async () => { db.close(); try { resolve(Array.from(new Uint8Array(await d.result[0].file.arrayBuffer()))); } catch (e) { reject(e); } };
      };
    }));
    assert.deepEqual(bytes, pdf);
  });
  await probe("Zurückgestellter Arbeitsstand bleibt nach Neuladen erhalten", async () => {
    await page.locator(".intake-queue-item button", { hasText: "Zurückstellen" }).click();
    await page.locator(".intake-queue-item .badge", { hasText: "Zurückgestellt" }).waitFor();
    await eingang();
    await page.locator(".intake-queue-item .badge", { hasText: "Zurückgestellt" }).waitFor();
  });
  await probe("Nach bestätigter Übernahme wird die Arbeitskopie freigegeben", async () => {
    await page.locator(".intake-queue-item button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached" });
    await page.locator(".intake-queue-item .badge", { hasText: "Übernommen" }).waitFor();
    const state = await lesen();
    assert.equal(state.dateien.length, 0); assert.ok(state.eingang[0].savedDocumentId);
    await eingang();
    await page.locator(".intake-queue-item .badge", { hasText: "Übernommen" }).waitFor();
    assert.equal((await lesen()).dateien.length, 0);
  });
  await probe("Unterbrochene Analyse wird nach Browser-Neustart fortgesetzt", async () => {
    await page.evaluate(() => {
      // Nur diese Analyse anhalten, nicht die Kryptografie anderer Start-/Speichervorgänge.
      const lesen = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = function () {
        return this.name === "Neustart-Probe.txt" ? new Promise(() => {}) : lesen.call(this);
      };
      window.dispatchEvent(new CustomEvent("familienakte:dateien", { detail: { files: [new File(["Erfundener Arbeitsstand"], "Neustart-Probe.txt", { type: "text/plain" })] } }));
    });
    await page.locator(".intake-queue-item", { hasText: "Neustart-Probe.txt" }).waitFor();
    assert.equal((await lesen()).dateien.length, 1);
    await context.close(); await starten(); await eingang();
    await page.waitForFunction(() => [...document.querySelectorAll(".intake-queue-item")].some((e) => /Neustart.Probe/.test(e.textContent) && !e.querySelector("button.primary")?.disabled));
    const state = await lesen();
    assert.ok(state.eingang.find((e) => e.file.name === "Neustart-Probe.txt")?.analysis);
  });
  await probe("Abbruch nach erfolgreicher Schreibanfrage behält den Stapel und bestätigt keinen Eingang", async () => {
    await page.locator("[data-stapel-start]").setInputFiles({ name: "Speicherfehler-Probe.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdf) });
    await page.locator('[data-stapel-lauf="fertig"]').waitFor();
    const vorher = await lesen();
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        const r = put.apply(this, args);
        if (this.name === "eingang-dateien") r.addEventListener("success", () => { window.__faAborted = true; this.transaction.abort(); }, { once: true });
        return r;
      };
    });
    await page.locator("[data-stapel-einordnen]").click();
    await page.waitForFunction(() => window.__faAborted);
    await page.waitForFunction(() => document.querySelector("[data-stapel-einordnen]")?.disabled === false);
    await page.locator(".global-activity-row.activity-error").first().waitFor();
    assert.deepEqual(await lesen(), vorher);
    assert.equal(await page.locator("[data-stapel-zeile]").count(), 1);
    await footer(page, "Eingangszentrale");
    assert.equal(await page.locator(".intake-queue-item", { hasText: "Speicherfehler" }).count(), 0);
  });
  await probe("Reihenfolge einer Dateiauswahl bleibt nach Neuladen erhalten", async () => {
    await eingang();
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([
      { name: "Reihenfolge-Alpha.txt", mimeType: "text/plain", buffer: Buffer.from("Erfundener erster Brief") },
      { name: "Reihenfolge-Beta.txt", mimeType: "text/plain", buffer: Buffer.from("Erfundener zweiter Brief") },
    ]);
    await page.waitForFunction(() => [...document.querySelectorAll(".intake-queue-item")].filter((e) => /Reihenfolge/.test(e.textContent) && e.querySelector("button.primary")?.disabled === false).length === 2);
    const namen = () => page.locator(".intake-queue-item .queue-title-row > strong").allTextContents();
    const vorher = await namen();
    assert.match(vorher[0], /Alpha/); assert.match(vorher[1], /Beta/);
    await eingang();
    await page.locator(".intake-queue-item", { hasText: "Reihenfolge" }).first().waitFor();
    assert.deepEqual(await namen(), vorher);
  });
  await probe("Keine unbehandelten Seitenfehler", () => assert.deepEqual(fehler, []));
} finally { await context?.close(); await app.stop(); if (!fehlgeschlagen) rmSync(profil, { recursive: true, force: true }); }
process.exitCode = summary("Eingang sichern");
