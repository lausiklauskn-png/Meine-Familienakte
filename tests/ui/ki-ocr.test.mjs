// Sitzung F: „Mit KI arbeiten“ liest Fotos und gescannte Seiten jetzt per Texterkennung auf dem Gerät (Tesseract aus Workflow PDF)
// und schickt sie unkenntlich gemacht mit. Erfundenes Foto eines Briefs, im Browser auf eine Leinwand gezeichnet.
import { startApp, launchBrowser, DESKTOP, ready, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
const page = await (await browser.newContext(DESKTOP)).newPage();
page.setDefaultTimeout(15000);
await page.addInitScript(windowStub);
const errors = collectErrors(page);
try {
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });
  const foto = Buffer.from((await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 1400; c.height = 700;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#111"; x.font = "44px sans-serif";
    ["Stadt Musterstadt Buergeramt", "Sehr geehrter Herr Tommy Flinkfuss,", "Ihr Antrag auf Bewohnerparkausweis ist eingegangen.", "Bitte reichen Sie die Fahrzeugpapiere nach."].forEach((t, i) => x.fillText(t, 60, 120 + i * 120));
    return c.toDataURL("image/png");
  })).split(",")[1], "base64");
  await step("„Mit KI arbeiten“ → Unterlage bearbeiten → Foto wählen: Texterkennung liest es", async () => {
    await page.locator(".ki-fab").click();
    await page.locator("button[role=radio]", { hasText: "Unterlage bearbeiten" }).click();
    await page.locator(".ki-datei input[type=file]").setInputFiles([{ name: "Brief_Foto_erfunden.png", mimeType: "image/png", buffer: foto }]);
    await page.locator("p.fine-print", { hasText: "per Texterkennung gelesen" }).waitFor({ timeout: 90000 });
  });
  await step("Vorschau „Das sieht die KI“: Text aus dem Foto, der Name unkenntlich", async () => {
    await page.locator("textarea").first().fill("Bitte fasse den Brief kurz zusammen.");
    const vorschau = await page.locator(".edit-prompt-preview textarea").inputValue();
    if (!/Bewohnerparkausweis/i.test(vorschau)) throw new Error(vorschau.replace(/\s+/g, " ").slice(0, 300));
    if (/Flinkfuss/.test(vorschau)) throw new Error("Name im Klartext: " + vorschau.replace(/\s+/g, " ").slice(0, 300));
    return vorschau.replace(/\s+/g, " ").match(/Herr[^,]{0,40}/)?.[0] || "gelesen";
  });
  await step("Keine Seitenfehler", async () => !errors.filter((e) => !/favicon|ERR_|net::/i.test(e)).length || errors.slice(0, 2).join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("KI mit Texterkennung"));
