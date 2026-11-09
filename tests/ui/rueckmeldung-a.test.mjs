// Rückmeldung 09.11., Abschnitt A: weiße Fläche (A1), „Zuordnung prüfen“ (A2), Tagebuch öffnen (A3), Textüberlauf in der
// Assistenz (A4), Cockpit öffnet direkt die Bearbeitung und Schließen lässt die Stelle stehen (A5). Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors, footer } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  await step("A1: Startkopf-Kacheln deckend, nirgends ein Unschärfe-Filter", async () => {
    const r = await page.evaluate(() => {
      const deckend = (el) => { const c = getComputedStyle(el).backgroundColor; const m = c.match(/rgba?\(([^)]+)\)/); const t = m ? m[1].split(",").map(Number) : []; return t.length < 4 || t[3] === 1; };
      const kacheln = [...document.querySelectorAll(".hero-cockpit, .hero-cockpit-grid > *")];
      const filter = [...document.querySelectorAll("body *")].filter((e) => { const s = getComputedStyle(e); return (s.backdropFilter && s.backdropFilter !== "none") || (s.webkitBackdropFilter && s.webkitBackdropFilter !== "none"); }).length;
      return { kacheln: kacheln.length, durchscheinend: kacheln.filter((k) => !deckend(k)).length, filter };
    });
    return soll(r.kacheln > 0 && r.durchscheinend === 0 && r.filter === 0, r);
  });

  await footer(page, "Cockpit");
  const fenster = page.locator("[data-stamm-fenster]");
  await step("A5: Tipp auf einen Vorgang im Cockpit öffnet direkt „Vorgang ändern“, Seite bleibt an der Stelle", async () => {
    const knopf = page.locator("#cockpit-cases [data-cockpit-eintrag]").first();
    await knopf.scrollIntoViewIfNeeded(); const y0 = await page.evaluate(() => scrollY);
    await knopf.click(); await fenster.waitFor({ timeout: 5000 });
    const kopf = await fenster.locator(".stamm-formular-kopf").innerText();
    const name = await fenster.locator('[data-stamm-feld="name"]').inputValue();
    await fenster.locator("button.button", { hasText: "Abbrechen" }).click(); await fenster.waitFor({ state: "detached" });
    const y1 = await page.evaluate(() => scrollY);
    return soll(/Vorgang ändern/.test(kopf) && name.length > 0 && Math.abs(y1 - y0) < 4, { kopf, name, y0, y1 });
  });
  await step("A5: Namen ändern und speichern – steht danach in der Liste", async () => {
    const knopf = page.locator("#cockpit-cases [data-cockpit-eintrag]").first();
    await knopf.click(); await fenster.waitFor();
    const feld = fenster.locator('[data-stamm-feld="name"]'); const alt = await feld.inputValue();
    await feld.fill(`${alt} geprüft`); await fenster.locator("[data-stamm-speichern]").click(); await fenster.waitFor({ state: "detached", timeout: 8000 });
    await page.waitForFunction((t) => [...document.querySelectorAll("#cockpit-cases [data-cockpit-eintrag]")].some((b) => b.textContent.includes(t)), `${alt} geprüft`, { timeout: 8000 });
    return true;
  });
  await step("A5: Tipp auf eine Aufgabe der To-do-Liste öffnet direkt das Ändern-Fenster", async () => {
    const knopf = page.locator("#cockpit-todos .cockpit-todo-main").first();
    await knopf.scrollIntoViewIfNeeded(); const y0 = await page.evaluate(() => scrollY);
    await knopf.click(); const dlg = page.locator(".modal-backdrop .modal").last(); await dlg.waitFor({ timeout: 5000 });
    const text = await dlg.innerText();
    await page.keyboard.press("Escape").catch(() => {});
    await dlg.getByRole("button", { name: /Abbrechen|Schließen/ }).first().click().catch(() => {});
    await page.locator(".modal-backdrop").waitFor({ state: "detached", timeout: 5000 });
    const y1 = await page.evaluate(() => scrollY);
    return soll(/Woran erinnern/.test(text) && Math.abs(y1 - y0) < 4, { text: text.slice(0, 80), y0, y1 });
  });
  await step("A2: „Zuordnung prüfen“ klappt die erste Verknüpfung auf und holt sie ins Bild", async () => {
    const knopf = page.locator("#cockpit-cases [data-cockpit-eintrag]").first();
    await knopf.click(); await fenster.waitFor();
    await fenster.locator("[data-stamm-akte]").click(); await page.locator("#cockpit-dossier").waitFor();
    const z = page.locator("[data-dossier-zuordnung]"); await z.scrollIntoViewIfNeeded(); await z.click();
    await page.locator("[data-dossier-auf]").first().waitFor({ timeout: 4000 });
    const r = await page.evaluate(() => { const b = document.querySelector("button[data-dossier-ref][aria-expanded=true]"); const q = b?.getBoundingClientRect(); return { da: !!b, imBild: q ? q.top >= 0 && q.bottom <= innerHeight : false, markiert: b?.classList.contains("zurueck-hier") }; });
    return soll(r.da && r.imBild && r.markiert, r);
  });

  await footer(page, "Tagebuch");
  await step("A3: „Tagebuch öffnen“ auf der Tagebuch-Seite führt zur Chronologie", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator("button", { hasText: "Tagebuch öffnen" }).first().click(); await page.waitForTimeout(400);
    const r = await page.evaluate(() => { const c = document.getElementById("memory-chronologie").getBoundingClientRect(); return { top: Math.round(c.top), y: scrollY }; });
    return soll(r.y > 200 && r.top < 400, r);
  });
  await step("A3: Tipp auf einen Tagebuch-Eintrag zeigt ihn im Bild, markiert", async () => {
    const zeile = page.locator(".memory-event-zeile").nth(1);
    await zeile.locator(".fz-kopf > button").first().click(); await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const d = document.querySelector(".memory-detail"); const q = d.getBoundingClientRect(); return { top: Math.round(q.top), h: d.querySelector("h2")?.textContent, markiert: d.classList.contains("zurueck-hier") }; });
    return soll(r.top >= 0 && r.top < 500 && r.h && r.markiert, r);
  });

  await page.evaluate(() => scrollTo(0, 0));
  await page.locator(".mobile-menu-button").click();
  await page.locator(".main-navigation .nav-cluster > button").first().click();
  await page.locator(".mega-menu button", { hasText: "Assistenzzentrale" }).first().click(); await page.waitForTimeout(400);
  await step("A4: Kasten „A · Aus meiner Familienakte“ ragt nicht über den Rand", async () => {
    await page.locator("textarea").first().fill("Reklamation Waschmaschine Fernwärmeversorgungsunternehmensabrechnung");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click();
    await page.locator(".evidence-card").first().waitFor({ timeout: 8000 });
    const r = await page.evaluate(() => [...document.querySelectorAll(".evidence-card")].map((k) => ({ breit: k.scrollWidth - k.clientWidth, kinder: [...k.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > k.getBoundingClientRect().right + 1).length })));
    return soll(r.length > 0 && r.every((k) => k.breit <= 1 && k.kinder === 0), r);
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Rückmeldung A"));
