// Stück 3 (Klaus 2026-11-01): „Stapel direkt übernehmen“ — viele Fotos/Scans, Blatt automatisch finden und gerade ziehen, schlanke Liste,
// große Vorschau erst beim Antippen, „Einordnen“ rechts oben, Anhalten/Weiter/Abbrechen beim Einscannen, bleibt bis zum Einordnen liegen.
// Erfundene Bilder, im Browser gezeichnet: schräges helles Blatt auf dunklem Tisch (sicher, A4) · Bild ohne Blatt (ganzes Foto, „Ecken prüfen“) · PDF.
import { readFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const PDF = path.join(ROOT, "tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf");
const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(30000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const bilder = await page.evaluate(async () => {
    const png = async (c) => Array.from(new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, "image/png"))).arrayBuffer()));
    const a = document.createElement("canvas"); a.width = 1200; a.height = 1600; let g = a.getContext("2d");
    g.fillStyle = "#3a3a3a"; g.fillRect(0, 0, a.width, a.height);
    g.save(); g.translate(600, 800); g.rotate(0.12); g.fillStyle = "#fafafa"; g.fillRect(-380, -537, 760, 1074);
    g.fillStyle = "#222"; for (let i = 0; i < 18; i++) g.fillRect(-300, -460 + i * 50, 420 + (i % 3) * 60, 10); g.restore();
    const b = document.createElement("canvas"); b.width = 1000; b.height = 700; g = b.getContext("2d");
    for (let i = 0; i < 300; i++) { g.fillStyle = `hsl(${(i * 37) % 360},60%,${30 + (i % 40)}%)`; g.fillRect((i * 97) % 1000, (i * 53) % 700, 60, 40); }
    return { blatt: await png(a), ohne: await png(b) };
  });
  const dateien = [
    { name: "Stapel-01.png", mimeType: "image/png", buffer: Buffer.from(bilder.blatt) },
    { name: "Stapel-02.png", mimeType: "image/png", buffer: Buffer.from(bilder.ohne) },
    { name: "Stapel-03.pdf", mimeType: "application/pdf", buffer: readFileSync(PDF) },
  ];
  await step("Eingangszentrale → „Stapel direkt übernehmen“: drei Dateien, Seite „Stapel“ mit Fortschritt", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator("[data-stapel-start]").setInputFiles(dateien);
    await page.locator("[data-stapel-seite]").waitFor();
    await page.locator('[data-stapel-lauf="fertig"]').waitFor({ timeout: 90000 });
    return await page.locator("[data-stapel-lauf]").innerText();
  });
  check(/3 übernommen, davon 1 mit „Ecken prüfen“/.test(await page.locator("[data-stapel-lauf]").innerText()), "Zusammenfassung: 3 übernommen, 1 zum Nacharbeiten");
  const zeilen = page.locator("[data-stapel-zeile]");
  check(await zeilen.count() === 3, "Liste mit drei Zeilen", String(await zeilen.count()));
  check(await page.locator("[data-stapel-liste] img").count() === 0, "Liste ohne Vorschaubilder");
  const st = await page.evaluate(() => window.__faStapel);
  const a = st?.find((e) => /Stapel-01/.test(e.name)), v = a?.seite ? Math.max(...a.seite) / Math.min(...a.seite) : 0;
  check(a?.sicher === true && Math.abs(v - Math.SQRT2) < 0.02, "Schräges Blatt: sicher erkannt, gerade gezogen, Seite im A4-Verhältnis", JSON.stringify(a));
  const b = st?.find((e) => /Stapel-02/.test(e.name));
  check(b?.sicher === false && b?.seite && Math.abs(b.seite[0] / b.seite[1] - 1000 / 700) < 0.02 && await zeilen.filter({ hasText: "Stapel-02 (Ecken prüfen)" }).count() === 1, "Bild ohne Blatt: ganzes Foto, „Ecken prüfen“", JSON.stringify(b));
  await step("Antippen zeigt die große Vorschau und die Knöpfe", async () => {
    await zeilen.filter({ hasText: "Stapel-01" }).locator(".fa-stapel-name").click();
    const img = page.locator("[data-stapel-vorschau]");
    await img.waitFor();
    const w = await img.evaluate((i) => i.naturalWidth);
    return w > 600 && await page.locator("[data-stapel-wfpdf]").count() === 1 && await page.locator("[data-stapel-einzeln]").count() === 1 ? `Vorschau ${w} px breit` : false;
  });
  await step("Nach dem Neuladen liegt der Stapel noch da (erst später einordnen)", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await page.locator(".mega-menu button", { hasText: "Stapel (noch einordnen)" }).first().click();
    await page.locator("[data-stapel-zeile]").nth(2).waitFor();
    return `${await page.locator("[data-stapel-zeile]").count()} Zeilen`;
  });
  await step("„Einordnen (3)“ rechts oben gibt alle an die Eingangszentrale, der Stapel ist leer", async () => {
    const k = page.locator("[data-stapel-einordnen]");
    if (!/Einordnen \(3\)/.test(await k.innerText())) throw new Error(await k.innerText());
    await k.click();
    await page.locator(".fa-stapel-leer").waitFor();
    await footer(page, "Eingangszentrale");
    await page.locator(".intake-queue-item", { hasText: "Stapel 03" }).first().waitFor({ timeout: 60000 });
    return `${await page.locator(".intake-queue-item", { hasText: "Stapel 0" }).count()} in der Eingangszentrale`;
  });
  await step("Anhalten · Weiter beim Einscannen", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await page.locator(".mega-menu button", { hasText: "Stapel (noch einordnen)" }).first().click();
    const viele = Array.from({ length: 5 }, (_, i) => ({ name: `Viele-${i}.png`, mimeType: "image/png", buffer: Buffer.from(bilder.blatt) }));
    await page.locator("[data-stapel-eingabe]").setInputFiles(viele);
    await page.locator("[data-stapel-anhalten]").click();
    await page.locator('[data-stapel-lauf="angehalten"]').waitFor();
    await page.waitForTimeout(2500);   // das Blatt, das gerade gerechnet wird, darf noch fertig werden
    const halt = await page.locator("[data-stapel-zeile]").count();
    await page.waitForTimeout(2500);
    const still = await page.locator("[data-stapel-zeile]").count();
    await page.locator("[data-stapel-weiter]").click();
    await page.locator('[data-stapel-lauf="fertig"]').waitFor({ timeout: 90000 });
    return still === halt && still < 5 && await page.locator("[data-stapel-zeile]").count() === 5 ? `angehalten bei ${halt}, danach 5` : false;
  });
  await step("Abbrechen behält die fertigen, der Rest kommt nicht", async () => {
    const viele = Array.from({ length: 6 }, (_, i) => ({ name: `Abbruch-${i}.png`, mimeType: "image/png", buffer: Buffer.from(bilder.blatt) }));
    await page.locator("[data-stapel-eingabe]").setInputFiles(viele);
    await page.locator("[data-stapel-abbrechen]").click();
    await page.locator('[data-stapel-lauf="abgebrochen"]').waitFor();
    await page.waitForTimeout(2500);
    const n = await page.locator("[data-stapel-zeile]", { hasText: "Abbruch-" }).count();
    return n < 6 ? `${n} von 6 übernommen` : false;
  });
  const handy = await (await browser.newContext({ ...HANDY, serviceWorkers: "block" })).newPage();
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await step("Handy 390 px: Stapel-Seite ohne Querrollen, „Einordnen“ sichtbar", async () => {
    await handy.evaluate(() => window.scrollTo(0, 0));
    await handy.locator(".mobile-menu-button").click();
    await handy.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await handy.locator(".mega-menu .mega-group button", { hasText: "Stapel (noch einordnen)" }).first().click({ force: true });
    await handy.locator("[data-stapel-seite]").waitFor();
    const ueber = await handy.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    return ueber <= 1 && await handy.locator("[data-stapel-einordnen]").isVisible() ? `Überlauf ${ueber} px` : false;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Stapel direkt übernehmen"));
