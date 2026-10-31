// Sitzung F, Nachtrag: die drei Wege, die tests/ui/ausfuellen.test.mjs nicht fährt.
// 1. Foto-Unterlage ohne Textebene → Felder erkennen beschriftet über die Texterkennung (Tesseract, auf dem Gerät)
// 2. Ausfüllbares PDF: echte Formularfelder mit dem eingetragenen Wert
// 3. „Neu scannen“ öffnet den Scanner von Workflow PDF (Stil und Bausteine laden, Schließen geht)
// Alles erfunden: ein gezeichnetes „Foto“ eines Formulars der Stadt Musterstadt.
import { inflateSync } from "node:zlib";
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
const page = await (await browser.newContext({ ...DESKTOP, acceptDownloads: true })).newPage();
page.setDefaultTimeout(15000);
await page.addInitScript(windowStub);
const errors = collectErrors(page);
const dlg = page.locator("[data-af]");
const NAME = "Foto_Anmeldeformular_Musterstadt.png";

try {
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });
  const foto = Buffer.from((await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 1240; c.height = 1754;   // A4 bei 150 dpi
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#111"; x.strokeStyle = "#111"; x.lineWidth = 3; x.font = "40px sans-serif";
    x.fillText("Anmeldung Stadtbuecherei Musterstadt", 100, 180);
    [["Vorname:", 400], ["Nachname:", 520], ["Wohnort:", 640]].forEach(([t, y]) => { x.fillText(t, 100, y); x.beginPath(); x.moveTo(380, y + 8); x.lineTo(1100, y + 8); x.stroke(); });
    return c.toDataURL("image/png");
  })).split(",")[1], "base64");

  await step("Foto eines Formulars in der Akte ablegen", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([{ name: NAME, mimeType: "image/png", buffer: foto }]);
    await page.locator(".intake-queue-item", { hasText: "Foto Anmeldeformular Musterstadt" }).first().locator("button", { hasText: "Zuordnung prüfen" }).click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    await page.locator(".document-item", { hasText: NAME }).first().waitFor({ timeout: 20000 });
  });
  await step("Ausfüllen öffnet das Foto als Seite (umgewandelt in ein PDF)", async () => {
    await page.locator(".document-item", { hasText: NAME }).first().locator("[data-af-oeffnen]").click();
    await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    return `${await dlg.locator(".af-seite").count()} Seite`;
  });
  await step("Felder erkennen ohne Textebene: Beschriftungen kommen aus der Texterkennung", async () => {
    await dlg.locator("[data-af-erkennen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "vorgeschlagen" }).waitFor({ timeout: 120000 });
    const labels = await dlg.locator(".af-feld .af-label").allInnerTexts();
    if (labels.length < 3 || !labels.some((l) => /Vorname/i.test(l)) || !labels.some((l) => /Nachname/i.test(l))) throw new Error(`${labels.length} Felder: ${labels.join(" | ")}`);
    return labels.join(" | ");
  });
  await step("Ausfüllbares PDF: echte Formularfelder, Wert eingetragen", async () => {
    await dlg.locator("[role=tab]", { hasText: "Ausfüllen" }).click();
    const feld = dlg.locator("input[data-af-feld]").first();
    await feld.fill("Tabea");
    await dlg.locator("[data-af-ausfuellbar]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "neben dem Original" }).waitFor({ timeout: 30000 });
    const [dl] = await Promise.all([page.waitForEvent("download"), dlg.locator("[data-af-teilen]").click()]);
    const b = Buffer.concat(await (await dl.createReadStream()).toArray());
    const roh = b.toString("latin1");
    const alles = roh + [...roh.matchAll(/stream\r?\n([\s\S]*?)endstream/g)].map((m) => { try { return inflateSync(Buffer.from(m[1], "latin1")).toString("latin1"); } catch { return ""; } }).join("\n");
    const hex = Buffer.from("Tabea", "latin1").toString("hex").toUpperCase();
    const acro = /\/AcroForm/.test(alles), tx = /\/FT\s*\/Tx/.test(alles), wert = alles.includes("(Tabea)") || alles.toUpperCase().includes(`<${hex}>`);
    if (!acro || !tx || !wert) throw new Error(`AcroForm ${acro} · Textfeld ${tx} · Wert ${wert} · ${dl.suggestedFilename()}`);
    return `${dl.suggestedFilename()} · Formularfelder mit Wert`;
  });
  await step("Die neue Fassung heißt „…ausfuellbar…“ und trägt die Marke", async () => {
    await dlg.locator("button[aria-label='Ausfüllen schließen']").click();
    await page.locator(".document-item", { hasText: "ausfuellbar" }).first().waitFor({ timeout: 15000 });
    return /Ausgefüllte Fassung/.test(await page.locator(".document-item", { hasText: "ausfuellbar" }).first().innerText());
  });
  await step("„Neu scannen“ öffnet den Scanner von Workflow PDF (Stil geladen), Schließen geht", async () => {
    await page.locator(".document-item", { hasText: NAME }).filter({ hasNotText: "ausfuellbar" }).first().locator("[data-af-oeffnen]").click();
    await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    await dlg.locator("[role=tab]", { hasText: "Felder setzen" }).click();
    await dlg.locator("button", { hasText: "Neu scannen" }).click();
    await page.locator(".scan[role=dialog]").waitFor({ timeout: 20000 });
    const stil = await page.evaluate(() => { const s = document.querySelector(".scan"); return s ? getComputedStyle(s).getPropertyValue("--scan-rot").trim() : ""; });
    const titel = await page.locator(".scan .scan-titel").innerText();
    await page.locator(".scan [data-schliessen]").click();
    await page.locator(".scan[role=dialog]").waitFor({ state: "detached", timeout: 10000 });
    if (!stil) throw new Error("Scanner-Stil nicht geladen (--scan-rot leer)");
    return `${titel.trim()} · Farbe ${stil}`;
  });
  check(!errors.filter((e) => !/favicon|ERR_|net::/i.test(e)).length, "Keine Seitenfehler", errors.slice(0, 3).join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Ausfüllen: Foto, ausfüllbar, Scanner"));
