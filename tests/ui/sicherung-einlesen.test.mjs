// P6 (Plan 07.11., Punkt 2b): Sicherung einlesen in der Android-App (natives Ordner-Plugin gestellt).
// Probe ohne Schreiben; nicht leere Akte und beschädigte Sicherung werden abgewiesen; in die leere Akte einlesen und vergleichen.
import { vaultFixture } from "./_vault-fixture.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { ordnerStub } from "./_ordner-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const context = await browser.newContext(DESKTOP);
await context.addInitScript(capacitorStub + "\n" + ordnerStub("android"));
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = collectErrors(page);
const dialog = page.locator("[data-sicherung-einlesen]");
const zaehlen = () => page.evaluate(async () => { const f = window.__vaultFixture; const d = await f.readLocalVaultData(await f.browserVault()); return { dokumente: d.documents.length, eintraege: d.records.length }; });
try {
  let vorher, sicherung;
  await step("Akte mit erfundener Familie, Vollsicherung auf die SD-Karte", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    vorher = await zaehlen();
    await footer(page, "Sicherheitscenter");
    await page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await page.waitForFunction(() => /Installationsdatei/.test(document.body.innerText), null, { timeout: 60000 });
    sicherung = await page.evaluate(() => window.__ordnerSichern());
    return `${vorher.dokumente} Dokumente, ${vorher.eintraege} Einträge`;
  });
  await step("Probe in der vollen Akte: bestanden, aber kein „Jetzt einlesen“ (nur in eine leere Akte)", async () => {
    await page.locator("[data-sicherung-einlesen-knopf]").click();
    await dialog.waitFor({ timeout: 60000 }).catch(async () => { throw new Error(((await page.locator("[aria-live], .notice").allInnerTexts()).join(" ")).slice(0, 300)); });
    const text = (await dialog.innerText()).replace(/\s+/g, " ");
    if (!/per Prüfsumme geprüft/.test(text) || /Fehler/.test(await dialog.locator("[data-einlesen-dateien]").innerText())) throw new Error(text.slice(0, 300));
    if (!(await dialog.locator("[data-einlesen-nicht-leer]").count()) || await dialog.locator("[data-einlesen-start]").count()) throw new Error("Einlesen in volle Akte angeboten");
    const titel = await page.evaluate(() => window.__ordner.gewaehlt.at(-1));
    // Keine Sackgasse: der nächste mögliche Schritt steht da, mit Knopf zur Eingangszentrale; kein interner Prüfstand.
    const weiter = await dialog.locator("[data-einlesen-naechster-schritt]").innerText().catch(() => "");
    if (!/01_Dokumente/.test(weiter) || !/geplant/.test(weiter) || !(await dialog.locator("[data-einlesen-zum-eingang]").count())) throw new Error(`nächster Schritt fehlt: ${weiter.slice(0, 200)}`);
    if (/Prüfstand|2\.28\.1/.test(text)) throw new Error("interne Fassung im Fenster");
    await dialog.locator("button", { hasText: "Schließen" }).click();
    return `${titel} · ${(await zaehlen()).dokumente} Dokumente unverändert`;
  });
  await step("Akte leeren (wie Neuinstallation), Sicherung wieder einsetzen", async () => {
    await page.evaluate(async () => { const f = window.__vaultFixture; await (await navigator.storage.getDirectory()).removeEntry(f.BROWSER_VAULT_NAME, { recursive: true }); });
    // Ohne ready(): das legt in Proben von selbst die erfundene Familie an; hier soll die Akte leer bleiben.
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version", { timeout: 120000 });
    await vaultFixture(page).catch(async (e) => { throw new Error(`${e.message.slice(0, 60)} · ${(await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 400)}`); });
    await page.evaluate((d) => window.__ordnerEinsetzen(d, "T2"), sicherung);
    const leer = await zaehlen(); if (leer.dokumente || leer.eintraege) throw new Error(JSON.stringify(leer));
  });
  await step("Beschädigte Datei: Probe nennt den Fehler, Einlesen wird nicht angeboten, nichts geschrieben", async () => {
    const schluessel = await page.evaluate(() => { const S = window.__ordner; const k = [...S.dateien.keys()].find((x) => x.includes("/Dateien/01_Dokumente/")); const u = S.dateien.get(k); S.__alt = u; const v = u.slice(); v[0] ^= 1; S.dateien.set(k, v); return k; });
    await footer(page, "Sicherheitscenter");
    await page.locator("[data-sicherung-einlesen-knopf]").click(); await dialog.waitFor({ timeout: 60000 });
    const f = await dialog.locator("[data-einlesen-fehler]").innerText();
    if (await dialog.locator("[data-einlesen-start]").count()) throw new Error("Einlesen trotz Fehler angeboten");
    await dialog.locator("button", { hasText: "Abbrechen" }).click();
    await page.evaluate((k) => { const S = window.__ordner; S.dateien.set(k, S.__alt); }, schluessel);
    if ((await zaehlen()).dokumente) throw new Error("geschrieben");
    return f.split("\n").slice(0, 2).join(" · ");
  });
  await step("Leere Akte: Probe bestanden, „Jetzt einlesen“ übernimmt alles, Zahlen stimmen", async () => {
    await page.locator("[data-sicherung-einlesen-knopf]").click(); await dialog.waitFor({ timeout: 60000 });
    await dialog.locator("[data-einlesen-start]").click();
    await dialog.waitFor({ state: "detached", timeout: 120000 });
    const nachher = await zaehlen();
    if (nachher.dokumente !== vorher.dokumente || nachher.eintraege !== vorher.eintraege) throw new Error(`${JSON.stringify(vorher)} → ${JSON.stringify(nachher)}`);
    // Die Erfolgsmeldung kommt kurz nach dem Schließen des Fensters; bis dahin steht noch „Probe läuft“ da.
    await page.waitForFunction(() => [...document.querySelectorAll("[aria-live], .notice")].some((e) => /eingelesen/.test(e.textContent || "")), null, { timeout: 30000 }).catch(() => {});
    const m = (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ");
    if (!/eingelesen/.test(m)) throw new Error(m.slice(0, 200));
    return m.match(/Sicherung[^.]*eingelesen[^.]*\./)?.[0] || m.slice(0, 120);
  });
  await step("Eingelesenes Original lässt sich öffnen und hat dieselbe Prüfsumme", async () => {
    const ok = await page.evaluate(async () => {
      const f = window.__vaultFixture, h = await f.browserVault(), d = await f.readLocalVaultData(h);
      const doc = d.documents.find((x) => x.checksum); const file = await f.readLocalDocumentFile(h, doc.id);
      const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((x) => x.toString(16).padStart(2, "0")).join("");
      return { name: doc.originalName, gleich: hex === doc.checksum || `sha256:${hex}` === doc.checksum, checksum: doc.checksum.slice(0, 20), hex: hex.slice(0, 12) };
    });
    if (!ok.gleich) throw new Error(JSON.stringify(ok));
    return ok.name;
  });
  await step("Zweites Einlesen in die nun volle Akte wird abgewiesen", async () => {
    await page.locator("[data-sicherung-einlesen-knopf]").click(); await dialog.waitFor({ timeout: 60000 });
    if (!(await dialog.locator("[data-einlesen-nicht-leer]").count())) throw new Error("nicht abgewiesen");
    await dialog.locator("[data-einlesen-zum-eingang]").click();
    await page.locator(".breadcrumb", { hasText: "Eingangszentrale" }).waitFor({ timeout: 5000 });
    return "abgewiesen, „Zur Eingangszentrale ›“ führt dorthin";
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); if (e.length) throw new Error(e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Sicherung einlesen"));
