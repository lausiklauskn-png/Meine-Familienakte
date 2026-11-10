// Tooltips an Knöpfen (2026-11-04, Klaus 10.11.: „einfach nur Tooltips“): Haken in der Hilfe; aus = Hinweistexte zurückgehalten,
// an = zurück. Maus über einem Knopf zeigt nach einer halben Sekunde eine eigene Blase (auch in der Android-App, wo der Browser
// „title“ nie zeigt), der Hinweis des Browsers ist solange zurückgehalten. Finger: kein langer Druck mehr, ein Tipp löst aus.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  // 2.28.39: Drucker und ⟳ sind aus dem Kopf; geprüft wird am Knopf „Ablegen“ und am Kalender-Knopf.
  const HINWEIS = "Ablegen: fotografieren, Dateien oder Ordner wählen";
  const titel = () => page.locator(".ablegen-knopf-schalter").getAttribute("title");
  check((await titel()) === HINWEIS, "Ab Werk an: Knopf „Ablegen“ hat seinen Hinweis");
  await step("Maus über „Mein Kalender“: eigene Blase nach einer halben Sekunde, Browser-Hinweis solange zurückgehalten", async () => {
    await page.mouse.move(5, 5);
    await page.locator(".kalender-knopf-schalter").hover();
    const sofort = await page.locator(".kurzhinweis-blase").count();
    await page.waitForSelector(".kurzhinweis-blase", { timeout: 2000 }).catch(() => {});
    const r = await page.evaluate(() => { const k = document.querySelector(".kalender-knopf-schalter"); const b = document.querySelector(".kurzhinweis-blase");
      const kr = k.getBoundingClientRect(), br = b?.getBoundingClientRect();
      return { text: b?.textContent || "", title: k.getAttribute("title"), nah: br ? Math.abs(br.top - kr.bottom) < 60 || Math.abs(kr.top - br.bottom) < 60 : false }; });
    return soll(sofort === 0 && r.text === "Mein Kalender" && r.title === null && r.nah, { sofort, ...r });
  });
  await step("Maus weg: Blase verschwindet, Hinweis steht wieder am Knopf", async () => {
    await page.mouse.move(700, 700); await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({ blase: document.querySelectorAll(".kurzhinweis-blase").length, title: document.querySelector(".kalender-knopf-schalter").getAttribute("title") }));
    return soll(r.blase === 0 && r.title === "Mein Kalender", r);
  });
  await step("Klick mit der Maus löst den Knopf aus und nimmt die Blase weg", async () => {
    await page.locator(".kalender-knopf-schalter").hover(); await page.waitForTimeout(700);
    await page.locator(".kalender-knopf-schalter").click(); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ blase: document.querySelectorAll(".kurzhinweis-blase").length, kalender: !!document.querySelector("#mein-kalender, [data-mein-kalender]") }));
    return soll(r.blase === 0 && r.kalender, r);
  });
  await step("Knopf, dessen Hinweis nur die Beschriftung wiederholt: kein Tooltip", async () => {
    await page.mouse.move(700, 700);
    const id = await page.evaluate(() => { const b = document.createElement("button"); b.id = "probe-gleich"; b.textContent = "Speichern"; b.title = "Speichern";
      b.style.cssText = "position:fixed;left:20px;bottom:20px;z-index:9999"; document.body.appendChild(b); return b.id; });
    await page.locator("#" + id).hover(); await page.waitForTimeout(900);
    const n = await page.locator(".kurzhinweis-blase").count();
    await page.mouse.move(700, 700); await page.evaluate(() => document.getElementById("probe-gleich")?.remove());
    return soll(n === 0, `Blasen: ${n}`);
  });
  await footer(page, "Hilfe");
  const haken = page.getByLabel("Tooltips an Knöpfen anzeigen");
  await step("Aus: Hinweise werden zurückgehalten, auch nach Neuladen; Maus zeigt keine Blase", async () => {
    await haken.uncheck();
    if ((await titel()) !== null || (await page.locator(".ablegen-knopf-schalter").getAttribute("data-fa-titel")) !== HINWEIS) return false;
    await page.reload(); await ready(page);
    await page.locator(".kalender-knopf-schalter").hover(); await page.waitForTimeout(900);
    return soll((await titel()) === null && (await page.locator(".kurzhinweis-blase").count()) === 0, "Blase oder Hinweis trotz aus");
  });
  await step("An: Hinweise kommen zurück", async () => {
    await page.mouse.move(700, 700);
    await footer(page, "Hilfe"); await page.getByLabel("Tooltips an Knöpfen anzeigen").check();
    return (await titel()) === HINWEIS;
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));

  // Finger: ein Tipp löst sofort aus, kein langer Druck, keine Blase.
  const handy = await (await browser.newContext(HANDY)).newPage(); const fehlerHandy = collectErrors(handy);
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await step("Handy: Finger auf „Mein Kalender“ 0,7 s – keine Blase, der Knopf löst aus", async () => {
    const r = await handy.evaluate(async () => {
      const k = document.querySelector(".kalender-knopf-schalter"); let geklickt = 0;
      k.addEventListener("click", () => { geklickt++; });
      const kr = k.getBoundingClientRect(), o = { bubbles: true, pointerType: "touch", clientX: kr.x + 5, clientY: kr.y + 5 };
      k.dispatchEvent(new PointerEvent("pointerover", o)); k.dispatchEvent(new PointerEvent("pointerdown", o));
      await new Promise((f) => setTimeout(f, 700));
      const blase = document.querySelectorAll(".kurzhinweis-blase").length;
      k.dispatchEvent(new PointerEvent("pointerup", o)); k.click();
      return { blase, geklickt };
    });
    return soll(r.blase === 0 && r.geklickt === 1, r);
  });
  check(fehlerHandy.length === 0, "Handy: keine Seitenfehler", fehlerHandy.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Tooltips"));
