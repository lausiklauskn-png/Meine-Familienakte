// Klaus 07.11.: Das Hilfe-Thema „Knopf „Neu““ zeigt eine kleine Nachbildung „● Neu“ wie im Kopf, nicht das Funkeln des KI-Knopfs.
import { startApp, launchBrowser, DESKTOP, ready, check, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Hilfe");
  const lage = await page.evaluate(() => {
    const s = [...document.querySelectorAll("summary")].find((x) => x.textContent.includes("Knopf „Neu“"));
    const ki = document.querySelector(".ki-fab svg");
    return { da: !!s, nachbild: !!s?.querySelector("[data-neu-nachbild] .neu-punkt"), text: s?.querySelector("[data-neu-nachbild]")?.textContent,
      funkeln: !!(ki && s && [...s.querySelectorAll("svg")].some((x) => x.getAttribute("class") === ki.getAttribute("class"))) };
  });
  check(lage.da, "Hilfe-Thema „Knopf „Neu““ ist da");
  check(lage.nachbild && lage.text === "Neu", "Es zeigt „● Neu“ wie der Knopf im Kopf");
  check(!lage.funkeln, "Kein KI-Funkeln am Thema");
  const s = page.locator("summary", { hasText: "Knopf „Neu“" }); await s.scrollIntoViewIfNeeded();
  await s.screenshot({ path: process.env.BILD || "/tmp/neu-symbol.png" });
  check(errors.length === 0, "Keine Seitenfehler");
} finally { await browser.close(); await app.stop(); }
summary("Hilfe Neu-Symbol");
