import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, summary, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { directoryPickerStub, schliesseDialoge } from "./_stubs.mjs";
const app = await startApp(), browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + directoryPickerStub + `
    const gespeichert = JSON.parse(localStorage.getItem('pro-test-ort') || 'null');
    window.__proDok = { status: gespeichert ? 'gesperrt' : 'getrennt', id: gespeichert?.id, ort: 'content://erfunden/Pro-Tresor', reads: 0, writes: 0 };
    const daten = () => JSON.parse(localStorage.getItem('pro-test-originale') || '{}');
    const pruefen = (id) => { if (window.__proDok.status !== 'offen' || id !== window.__proDok.id) throw new Error('Pro-Tresor gesperrt oder fremd'); };
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ ...window.__proDok }),
      verbinden: async () => { window.__proDok.id = 'erfundener-tresor-a'; window.__proDok.status = 'offen'; localStorage.setItem('pro-test-ort', JSON.stringify({ id: window.__proDok.id })); return { ...window.__proDok }; },
      entsperren: async () => { window.__proDok.status = 'offen'; return { ...window.__proDok }; },
      sperren: async () => { window.__proDok.status = 'gesperrt'; },
      speichern: async (a) => {
        pruefen(a.vaultId); window.__proDok.writes++;
        const bytes = Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
        const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2,'0')).join('');
        const entryId = 'e-' + sha256.slice(0,36), files = daten(); files[entryId] = a.data;
        localStorage.setItem('pro-test-originale', JSON.stringify(files));
        return { vaultId: a.vaultId, entryId, sha256, size: bytes.length };
      },
      lesen: async (a) => { pruefen(a.vaultId); window.__proDok.reads++; return { data: daten()[a.entryId] }; },
    };`);
  const page = await context.newPage(); const errors = collectErrors(page);
  async function probe(name, fn) {
    const ok = await step(name, async () => {
      try { return await fn(); }
      catch (e) {
        console.error("Pro-Dokumentenfehler:", e.stack || String(e));
        mkdirSync("work", { recursive: true });
        writeFileSync("work/pro-dokumente-fehler.json", JSON.stringify({ name, error: e.stack, text: await page.locator("body").innerText().catch(() => "Seite nicht mehr erreichbar") }, null, 2));
        throw e;
      }
    });
    if (ok === false) throw new Error(name);
  }
  page.setDefaultTimeout(15000);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Sicherheitscenter");
  await page.evaluate(() => { window.__naechsterOrdner = "Pro-Akten-Probe"; });
  await page.getByRole("button", { name: /(?:PC-\/USB-Ordner verbinden|Anderen PC-\/USB-Ordner wählen)/ }).click();
  await page.locator("main", { hasText: "Pro-Akten-Probe" }).waitFor();
  const panel = page.locator("[data-pro-tresor]");
  await probe("Pro-Dokumente: Anschluss allein verschiebt noch keine Ablage", async () => {
    await panel.getByRole("button", { name: "Vorhandenen Pro-Tresor verbinden …", exact: true }).click();
    await panel.getByText("Entsperrt", { exact: true }).waitFor();
    assert.match(await panel.locator("[data-pro-ablage]").innerText(), /bisherigen Aktenordner/);
    await panel.getByRole("button", { name: "Neue Originale in diesem Pro-Tresor ablegen", exact: true }).click();
    await panel.locator("[data-pro-ablage]", { hasText: "erfundener-tresor-a" }).waitFor();
  });
  async function hochladen(name, inhalt) {
    await footer(page, "Dokumentenbibliothek");
    await page.getByRole("button", { name: "Neue Unterlage", exact: true }).first().click();
    await page.locator('.modal input[type="file"]').setInputFiles({ name, mimeType: "text/plain", buffer: Buffer.from(inhalt) });
    const modal = page.locator(".modal").last();
    const ohne = modal.getByRole("button", { name: "Nicht verknüpfen", exact: true });
    if (await ohne.count()) await ohne.click();
    await modal.getByRole("button", { name: "Geprüft lokal speichern", exact: true }).click();
  }
  async function bestand(aktenName = "Pro-Akten-Probe") {
    return page.evaluate(async (aktenName) => {
      const root = await navigator.storage.getDirectory();
      const akte = await root.getDirectoryHandle(aktenName);
      const basis = await akte.getDirectoryHandle("Me_Myself_and_I_Familienakte");
      const register = await (await basis.getDirectoryHandle("00_Register")).getFileHandle("Familienakte_Register.json");
      const dateien = [];
      async function sammeln(d, p = "") { for await (const h of d.values()) { if (h.kind === "directory") await sammeln(h, p + h.name + "/"); else dateien.push(p + h.name); } }
      await sammeln(basis);
      return { register: JSON.parse(await (await register.getFile()).text()), dateien };
    }, aktenName);
  }
  await probe("Pro-Dokumente: bestätigte Ablage schreibt nur den nativen Originalverweis", async () => {
    await hochladen("Pro-Original.txt", "Nur erfundene Originalbytes für die Pro-Probe.");
    await page.locator(".modal").waitFor({ state: "detached" });
    const b = await bestand();
    assert.equal(b.register.documents.length, 1);
    assert.match(b.register.documents[0].storedPath, /^pro-tresor:\/\/erfundener-tresor-a\//);
    assert.ok(!b.dateien.some((p) => p.includes("Pro-Original")), "keine dauerhafte interne Zweitkopie");
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button.library-preview").first().click();
    await page.locator(".file-viewer").waitFor();
    assert.ok(await page.evaluate(() => window.__proDok.reads > 0));
    await schliesseDialoge(page);
  });
  await probe("Pro-Dokumente: gesperrter Tresor lässt Quelle und Register unbestätigt", async () => {
    await page.evaluate(() => { window.__proDok.status = 'gesperrt'; });
    await hochladen("Nicht-abgelegt.txt", "Erfundene Datei, deren Ablage absichtlich scheitert.");
    await page.locator(".modal .form-error").waitFor();
    assert.equal((await bestand()).register.documents.length, 1);
    assert.equal(await page.evaluate(() => window.__proDok.writes), 1);
    assert.match(await page.locator(".modal").last().innerText(), /Nicht-abgelegt/);
    await schliesseDialoge(page);
  });
  await probe("Pro-Dokumente: Neustart behält Zuordnung, Original nach Entsperren wieder lesbar", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.locator(".site-brand-version").first().waitFor(); await footer(page, "Sicherheitscenter");
    await panel.getByText("Gesperrt", { exact: true }).waitFor();
    await panel.locator("[data-pro-ablage]", { hasText: "erfundener-tresor-a" }).waitFor();
    assert.match(await panel.locator("[data-pro-ablage]").innerText(), /erfundener-tresor-a/);
    await panel.getByRole("button", { name: "Pro-Tresor entsperren …", exact: true }).click();
    await panel.getByText("Entsperrt", { exact: true }).waitFor();
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button.library-preview").first().click(); await page.locator(".file-viewer").waitFor();
    assert.ok(await page.evaluate(() => window.__proDok.reads > 0)); await schliesseDialoge(page);
  });
  await probe("Pro-Dokumente: anderer Akten-Arbeitsstand übernimmt die Ablagewahl nicht", async () => {
    await footer(page, "Sicherheitscenter");
    await page.evaluate(() => { window.__naechsterOrdner = "Pro-Anderer-Arbeitsstand"; });
    await page.getByRole("button", { name: /(?:PC-\/USB-Ordner verbinden|Anderen PC-\/USB-Ordner wählen)/ }).click();
    await page.locator("main", { hasText: "Pro-Anderer-Arbeitsstand" }).waitFor();
    await panel.locator("[data-pro-ablage]", { hasText: "bisherigen Aktenordner" }).waitFor();
    assert.equal((await bestand()).register.proTresorId, "erfundener-tresor-a", "erste Akte bleibt unverändert verbunden");
  });
  await probe("Pro-Dokumente: einzelne bestehende Unterlage übernehmen und Quelle behalten", async () => {
    await hochladen("Bestand-Original.txt", "Erfundener bisheriger Bestand, der erhalten bleibt.");
    await page.locator(".modal").waitFor({ state: "detached" });
    const vorher = await bestand("Pro-Anderer-Arbeitsstand");
    const alterPfad = vorher.register.documents[0].storedPath;
    assert.ok(!alterPfad.startsWith("pro-tresor:"));
    await footer(page, "Dokumentenbibliothek");
    await page.getByRole("button", { name: "In Pro-Tresor übernehmen", exact: true }).first().click();
    await page.locator(".global-activity-row", { hasText: "Das ausgewählte Original liegt geprüft im Pro-Tresor. Der bisherige Bestand wurde beibehalten." }).first().waitFor();
    const danach = await bestand("Pro-Anderer-Arbeitsstand");
    assert.match(danach.register.documents[0].storedPath, /^pro-tresor:/);
    assert.ok(danach.dateien.includes(alterPfad.split("/").slice(1).join("/")));
    assert.ok(danach.register.proTresorId == null, "Einzelübernahme stellt nicht ungefragt die gesamte Ablage um");
  });
  await probe("Pro-Dokumente: keine unbehandelten Seitenfehler", () => assert.deepEqual(errors, []));
} finally { await browser.close(); await app.stop(); }
process.exitCode = summary("Pro-Tresor Dokumente im Browser");
