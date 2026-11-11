// Schriftgröße „A··A“ (Klaus 11.11.2026: wie in Workflow PDF): Knopf im Kopf öffnet einen Regler 85–150 %; die Schrift der ganzen
// App wächst, der Wert bleibt nach Neuladen; „Zurück auf 100 %“ setzt zurück. Am Handy steht der Knopf in der Aufklappleiste hinter ‹.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, fail, summary, collectErrors } from "./_harness.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); page.setDefaultTimeout(20000); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const schrift = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("main h1, main h2") || document.body).fontSize));
  const vorher = await schrift();
  await step("Kopf: Knopf „A··A“ sichtbar, Regler zunächst zu", async () => {
    const k = page.locator(".header-actions [data-pro-schrift-knopf]");
    soll(await k.isVisible() && (await k.innerText()).trim() === "A··A", "Knopf fehlt");
    return soll(await page.locator(".pro-schrift-feld").isHidden(), "Regler offen");
  });
  await step("Regler auf 130 %: Schrift wächst, Anzeige „130 %“", async () => {
    await page.locator("[data-pro-schrift-knopf]").click();
    const r = page.locator(".pro-schrift-feld input[type=range]"); await r.waitFor();
    await r.evaluate((e) => { e.value = "130"; e.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.waitForTimeout(200);
    const nachher = await schrift();
    soll(nachher > vorher * 1.2, { vorher, nachher });
    return soll((await page.locator(".pro-schrift-zahl").innerText()).trim() === "130 %", "Zahl falsch");
  });
  await step("Nach Neuladen bleibt 130 %", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    return soll(await page.evaluate(() => document.documentElement.dataset.proSchrift) === "130" && (await schrift()) > vorher * 1.2, "nicht gemerkt");
  });
  await step("„Zurück auf 100 %“ setzt zurück", async () => {
    await page.locator("[data-pro-schrift-knopf]").click();
    await page.getByRole("button", { name: "Zurück auf 100 %" }).click();
    await page.waitForTimeout(200);
    return soll(Math.abs((await schrift()) - vorher) < 0.5, "nicht zurück");
  });
  await step("Desktop: keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
  await context.close();

  const handy = await browser.newContext(HANDY);
  const p = await handy.newPage(); const err = collectErrors(p);
  await p.goto(app.base, { waitUntil: "networkidle" }); await ready(p);
  await step("Handy: Knopf erst hinter ‹ in der Aufklappleiste, Kopf ohne Überlauf", async () => {
    soll(!(await p.locator("[data-pro-schrift-knopf]").isVisible()), "Knopf schon sichtbar");
    await p.locator("[data-kopf-auf]").click(); await p.waitForTimeout(300);
    soll(await p.locator("[data-pro-schrift-knopf]").isVisible(), "nicht in der Leiste");
    const m = await p.evaluate(() => ({ ueber: document.documentElement.scrollWidth - innerWidth }));
    return soll(m.ueber <= 0, m);
  });
  await step("Handy: keine Seitenfehler", async () => { const e = err.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Schriftgröße"));
