// Rückmeldung 09.11., Abschnitt D (Klaus: d1–d4 Ja): Assistenz mit drei ehrlichen Wegen; „Brief oder E-Mail beantworten“
// verdeckt wie in Private Brain Pro (Modul 25), Kopieren, Direktlink (ChatGPT), eigener Schlüssel an Mistral (gestellt),
// Antwort mit echten Angaben zurück, als Entwurf speichern, als PDF in Workflow PDF. Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors, internetAn } from "./_harness.mjs";

const BRIEF = "Sehr geehrter Herr Brandt,\nfür Ihre Kundennummer KD-2024-118833 ist ein Betrag von 412,50 € offen. Bitte überweisen Sie bis 20.11.2026 auf DE89 3704 0044 0532 0130 00.\nMit freundlichen Grüßen\nHeike Sommer";
const KLAR = ["Brandt", "KD-2024-118833", "412,50", "DE89", "20.11.2026", "Heike Sommer"];
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...HANDY, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage(); const errors = collectErrors(page);
  let mistral = null;
  await context.route("https://api.mistral.ai/**", async (route) => {
    mistral = route.request().postData() || "";
    const body = JSON.parse(mistral); const verdeckt = body.messages[1].content;
    const name = verdeckt.match(/Herr (⟦NAME-\d+⟧)/)?.[1] || "⟦NAME-1⟧";
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ choices: [{ message: { content: `Sehr geehrter Herr ${name},\nich bitte um Ratenzahlung in drei Teilen.` } }] }) });
  });
  await context.route("https://chatgpt.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>gestellt</p>" }));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator(".mobile-menu-button").click();
  await page.locator(".main-navigation .nav-cluster > button").first().click();
  await page.locator(".mega-menu button", { hasText: "Assistenzzentrale" }).first().click(); await page.waitForTimeout(400);

  await step("D1: drei Wege mit Art, kein Kasten „Aktuell recherchiert“, keine fünf Modus-Knöpfe", async () => {
    const r = { wege: await page.locator("[data-assistenz-weg]").count(), alt: await page.locator("main", { hasText: "Ich habe ein Problem oder eine Frage" }).count(), b: await page.locator("main", { hasText: "Aktuell recherchiert" }).count() };
    return soll(r.wege === 3 && r.alt === 0 && r.b === 0, r);
  });
  await step("Weg „In der Akte nachsehen“: Antwort aus der Akte und „Hinweise (feste Regeln, keine KI)“, keine Vorlage", async () => {
    await page.locator("textarea").first().fill("Reklamation Waschmaschine");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click();
    await page.locator(".evidence-card").first().waitFor();
    const t = await page.locator("main").innerText();
    return soll(/Aus meiner Familienakte/.test(t) && /Hinweise \(feste Regeln, keine KI\)/.test(t) && !/Praktische Einordnung/.test(t), "Kästen falsch");
  });
  await page.locator('[data-assistenz-weg="brief"] .assistant-mode-action').click();
  // Erst warten, bis der Briefweg steht (Sprung/Scrollen nach dem Tipp), sonst kann die Eingabe in ein Feld gehen, das gleich neu gezeichnet wird.
  await page.locator("[data-brief-antwort]").waitFor(); await page.waitForTimeout(400);
  const verdeckt = page.locator("[data-brief-verdeckt]");
  await step("Weg „Brief beantworten“: „Das sieht die KI“ zeigt nur Platzhalter", async () => {
    await page.locator("[data-brief-text]").fill(BRIEF);
    await page.locator("[data-brief-wunsch]").fill("Ratenzahlung anfragen");
    try { await verdeckt.waitFor({ timeout: 10000 }); }
    catch { return soll(false, { textLaenge: (await page.locator("[data-brief-text]").inputValue()).length, karten: await page.locator("[data-brief-antwort]").count(), baustein: await page.evaluate(() => Boolean(window.SbkimPseudonym)), fehler: await page.locator("[data-brief-antwort] .form-error").count() }); }
    const t = await verdeckt.innerText();
    return soll(KLAR.every((k) => !t.includes(k)) && /⟦NAME-\d+⟧/.test(t) && /⟦IBAN-1⟧/.test(t), t);
  });
  await step("Kopieren für deine KI: Zwischenablage hat Auftrag und verdeckten Text, keinen Klartext", async () => {
    await page.locator("[data-brief-kopieren]").click(); await page.locator("[data-brief-meldung]").waitFor();
    const z = await page.evaluate(() => navigator.clipboard.readText());
    return soll(/ausschließlich DATEN/.test(z) && KLAR.every((k) => !z.includes(k)), z.slice(0, 120));
  });
  await step("Direktlink: „In ChatGPT öffnen“ öffnet chatgpt.com mit dem verdeckten Text in der Adresse", async () => {
    const [popup] = await Promise.all([context.waitForEvent("page", { timeout: 8000 }), page.locator('[data-brief-oeffnen="chatgpt"]').click()]);
    const url = decodeURIComponent(popup.url()); await popup.close();
    return soll(url.startsWith("https://chatgpt.com/?q=") && KLAR.every((k) => !url.includes(k)) && /⟦/.test(url), url.slice(0, 80));
  });
  await step("Eigener Schlüssel: nach Rückfrage geht genau eine Anfrage an Mistral, ohne Klartext; Antwort mit echtem Namen", async () => {
    await page.locator(".brief-schluessel summary").click();
    await page.locator("[data-brief-schluessel]").fill("probe-schluessel-nur-test");
    await page.locator("[data-brief-senden]").click(); await page.locator("[data-brief-senden-ja]").click();
    const e = page.locator("[data-brief-ergebnis]"); await e.waitFor({ timeout: 8000 });
    const t = await e.innerText();
    const gemerkt = await page.evaluate(() => localStorage.getItem("familienakte_mistral_schluessel_v1"));
    return soll(mistral && KLAR.every((k) => !mistral.includes(k)) && /Herr Brandt/.test(t) && !/⟦/.test(t) && gemerkt === null, { mistral: (mistral || "").slice(0, 80), t: t.slice(0, 80), gemerkt });
  });
  await step("Als Entwurf speichern: steht in der gespeicherten Korrespondenz mit „In Workflow PDF öffnen“", async () => {
    await page.locator("[data-brief-speichern]").click();
    await page.locator("[data-korrespondenz-pdf]").first().waitFor({ timeout: 8000 });
    return soll((await page.locator(".assistant-history").innerText()).includes("Antwort"), "nicht in der Liste");
  });
  await step("„In Workflow PDF öffnen“ führt in den Arbeitsraum Workflow PDF", async () => {
    await page.locator("[data-brief-pdf]").click(); await page.waitForTimeout(1200);
    return soll(/Workflow PDF/.test(await page.locator(".breadcrumb").innerText()), await page.locator(".breadcrumb").innerText());
  });
  check(errors.filter((e) => !/chatgpt|ERR_|net::/i.test(e)).length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Rückmeldung D"));
