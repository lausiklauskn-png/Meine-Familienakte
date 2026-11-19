// 2.28.75 „Familienakte übersichtlich“ (Klaus 19.11.2026): Karten der Startseite ab Werk zu, schlanker Kopf, Lebensbereiche als
// kleine Knöpfe, keine Systemprüfung auf der Startseite, Personen mit Steckbrief (speichern, bleibt nach Neuladen), Suche nach Person.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, soll, summary, collectErrors, karten_ab_werk, allesAufklappen } from "./_harness.mjs";

karten_ab_werk();
const app = await startApp();
const browser = await launchBrowser();
let code = 1;
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  await step("Startseite: Karten sind Knöpfe und ab Werk zu", async () => {
    const zu = await page.locator('main [data-klapp][data-klapp-offen="nein"]').count();
    const offen = await page.locator('main [data-klapp][data-klapp-offen="ja"]').count();
    return soll(zu >= 4 && offen === 0, { zu, offen });
  });
  await step("Zeile unter dem Knopf: „Zuletzt wichtig“ nennt Überfälliges", async () => soll(/überfällig|heute fällig/.test(await page.locator('[data-klapp-unter="zuletzt-wichtig"]').innerText()), "keine Zeile"));
  await step("Aufklappen zeigt den Inhalt, Zustand wird gemerkt", async () => {
    await page.locator('[data-klapp-knopf="zuletzt-wichtig"]').click();
    const n = await page.locator('[data-klapp="zuletzt-wichtig"] .klapp-inhalt > button').count();
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector('[data-klapp="zuletzt-wichtig"]');
    return soll(n > 0 && (await page.getAttribute('[data-klapp="zuletzt-wichtig"]', "data-klapp-offen")) === "ja", { n });
  });
  await step("Keine Systemprüfung und keine gelbe Sicherungsleiste auf der Startseite", async () => soll(!(await page.locator("main .system-status-bar").count()) && !(await page.locator("main > .sicherung-erinnerung").count()), "noch da"));
  await step("Lebensbereiche als kleine Knöpfe; Tipp öffnet den Bereich", async () => {
    const chips = await page.locator("[data-bereich-chip]").count();
    await page.locator('[data-bereich-chip="Fahrzeuge"]').click(); await page.waitForTimeout(400);
    return soll(chips >= 6 && /Fahrzeuge/.test(await page.locator(".breadcrumb").innerText()), { chips });
  });
  await step("Kopf: kein „Neu“, kein „Pseudo“, kein „Buch“; Schrift und Abmelden hinter „‹“", async () => {
    const weg = (await page.locator(".header-actions .neu-knopf-schalter, .header-actions [data-tagebuch-knopf]").count()) + Number(await page.locator("[data-pseudo-knopf]").isVisible());
    const vorher = await page.locator(".header-actions .fa-schrift").isVisible();
    await page.locator("[data-kopf-auf]").click();
    const nachher = await page.locator(".header-actions .fa-schrift").isVisible();
    await page.locator("[data-kopf-zu]").click();
    return soll(weg === 0 && !vorher && nachher, { weg, vorher, nachher });
  });
  await step("Briefumschlag öffnet weiter das Pseudo-Fenster", async () => {
    await page.locator("[data-brief-knopf]").click();
    await page.locator("[data-pseudo-antwort], .pf-blatt, [data-pseudo-fenster]").first().waitFor({ state: "attached" }).catch(() => undefined);
    const da = await page.evaluate(() => localStorage.getItem("familienakte_pseudo_v1"));
    await page.evaluate(() => { localStorage.setItem("familienakte_pseudo_v1", "aus"); window.dispatchEvent(new Event("familienakte:pseudo")); });
    return soll(da === "an", da);
  });

  // --- Personen ---
  await step("Menü „Familie & Personen“ hat einen Eintrag „Personen“", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button").nth(3).click({ force: true });
    const eintraege = await page.locator(".mega-menu button strong").allInnerTexts();
    await page.locator(".mega-menu button", { hasText: "Personen" }).first().click();
    await page.locator("[data-personen-ansicht]").waitFor();
    return soll(eintraege.filter((t) => /Personen|Familienübersicht/.test(t)).length === 1, eintraege);
  });
  await allesAufklappen(page);
  const name = await page.locator("[data-person-zeile]").first().getAttribute("data-person-zeile");
  await step("Person antippen: Steckbrief und „Alles zu …“ mit Akten", async () => {
    await page.locator("[data-person-zeile]").first().click();
    await page.locator("[data-person-steckbrief]").waitFor();
    const gruppen = await page.locator("[data-person-steckbrief] .klapp-titel").allInnerTexts();
    return soll(gruppen.includes("Kontakt") && gruppen.includes("Ausweise & Nummern") && gruppen.some((g) => /Akten|Unterlagen|Termine|Tagebuch/.test(g)), gruppen);
  });
  await step("Ausweis und weiteren Eintrag speichern; nach Neuladen da, Nummer verdeckt", async () => {
    const sb = page.locator("[data-person-steckbrief]");
    if ((await sb.locator('[data-klapp="person-ausweise"]').getAttribute("data-klapp-offen")) !== "ja") await sb.locator('[data-klapp-knopf="person-ausweise"]').click();
    await sb.locator("[data-ausweis-neu]").click();
    await sb.locator("[data-ausweis-art]").last().fill("Personalausweis");
    await sb.locator("[data-ausweis-nummer]").last().fill("T22000129");
    await sb.locator("[data-ausweis-gueltig]").last().fill("2031-05-01");
    await sb.locator("[data-steckbrief-speichern]").first().click();
    await page.waitForTimeout(800);
    if ((await sb.locator('[data-klapp="person-eintraege"]').getAttribute("data-klapp-offen")) !== "ja") await sb.locator('[data-klapp-knopf="person-eintraege"]').click();
    await sb.locator("[data-eintrag-neu]").click();
    await sb.locator("[data-eintrag-name]").last().fill("Mitgliedsnummer ADAC");
    await sb.locator("[data-eintrag-wert]").last().fill("12345");
    await sb.locator("[data-steckbrief-speichern]").first().click();
    await page.waitForTimeout(800);
    const meldungen = await page.locator(".global-activity-lines").innerText().catch(() => "");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".main-navigation .nav-cluster > button").nth(3).click({ force: true });
    await page.locator(".mega-menu button", { hasText: "Personen" }).first().click();
    await page.locator(`[data-person-zeile="${name}"]`).click();
    const sb2 = page.locator("[data-person-steckbrief]"); await sb2.waitFor();
    const verdeckt = await sb2.locator("[data-ausweis-nummer-verdeckt]").first().inputValue();
    const eintrag = await sb2.locator("[data-eintrag-wert]").first().inputValue();
    return soll(verdeckt === "•••• 0129" && eintrag === "12345" && !meldungen.includes("T22000129"), { verdeckt, eintrag });
  });
  await step("Suche nach dem Vornamen: oben „Alles zu …“, Tipp öffnet den Steckbrief", async () => {
    const vorname = (name || "").split(/\s+/)[0];
    await page.locator(".global-search input").fill(vorname);
    await page.waitForSelector(".search-results");
    const erste = await page.locator(".search-results .such-zeile strong").first().innerText();
    await page.locator(".search-results .such-zeile-knopf", { hasText: "Alles zu" }).first().click();
    await page.locator(`[data-person-steckbrief="${name}"]`).waitFor();
    return soll(erste.startsWith("Alles zu"), erste);
  });
  await step("Netz (Mycel) nicht im Menü, aber im Fuß", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button").nth(7).click({ force: true });
    const menue = await page.locator(".mega-menu").innerText();
    await page.locator(".main-navigation .nav-cluster > button").nth(7).click({ force: true });
    return soll(!/Mycel/.test(menue) && (await page.locator("[data-fuss-netz]").count()) === 1, "Mycel im Menü");
  });
  await step("Desktop: keine Seitenfehler", async () => soll(!errors.filter((e) => !/favicon|net::ERR|Failed to load resource/.test(e)).length, errors));

  const handy = await browser.newContext(HANDY);
  const hp = await handy.newPage(); hp.setDefaultTimeout(10000);
  await step("Handy: Startseite ohne waagrechtes Rollen, Karten zu", async () => {
    await hp.goto(app.base, { waitUntil: "networkidle" }); await ready(hp);
    const breit = await hp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const offen = await hp.locator('main [data-klapp][data-klapp-offen="ja"]').count();
    return soll(breit <= 1 && offen === 0, { breit, offen });
  });
  code = summary("Familienakte übersichtlich");
} finally { await browser.close(); await app.stop(); }
process.exit(code);
