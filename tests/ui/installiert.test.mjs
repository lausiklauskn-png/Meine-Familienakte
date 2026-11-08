// 2.28.38 (Klaus 08.11.2026): ist die Web-App auf dem Gerät schon installiert, verschwindet „Installieren“ auch im Browser-Tab.
// Chrome meldet das über navigator.getInstalledRelatedApps; hier gestellt, weil die Probe nichts installieren kann.
import { startApp, launchBrowser, DESKTOP, ready, check, summary, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, antwort] of [["nicht installiert", "[]"], ["installiert", '[{"platform":"webapp","url":"./manifest.webmanifest"}]']]) {
    const context = await browser.newContext(DESKTOP);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.addInitScript((a) => { navigator.getInstalledRelatedApps = async () => JSON.parse(a); }, antwort);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await page.waitForTimeout(600);
    const lage = await page.evaluate(() => ({ klasse: document.documentElement.classList.contains("pwa-installiert"),
      sichtbar: [...document.querySelectorAll(".familienakte-install")].some((k) => !k.hidden && getComputedStyle(k).display !== "none") }));
    if (name === "installiert") check(lage.klasse && !lage.sichtbar, "Web-App installiert: kein Knopf „Installieren“", JSON.stringify(lage));
    else check(!lage.klasse && lage.sichtbar, "Web-App nicht installiert: Knopf „Installieren“ bleibt", JSON.stringify(lage));
    const manifest = await page.evaluate(async () => (await (await fetch("./manifest.webmanifest")).json()).related_applications);
    if (name === "installiert") check(Array.isArray(manifest) && manifest[0]?.platform === "webapp", "Manifest nennt sich selbst unter related_applications");
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Installieren nur, wenn nötig"));
