import assert from "node:assert/strict";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, summary } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
const app=await startApp(), browser=await launchBrowser();
try {
  const page=await(await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(10000);await page.addInitScript(windowStub);
  await page.goto(app.base,{waitUntil:"networkidle"});await ready(page);
  const first=page.url();
  await footer(page,"Dokumentenbibliothek");await footer(page,"Hilfe");
  await step("Nativer Rückweg nutzt den vorhandenen Ansichtsverlauf",async()=>{
    await page.evaluate(()=>window.familienakteZurueck());await page.waitForURL("**/#documents");
  });
  await step("Maus-Zurück endet an der ersten Ansicht und verlässt die App nicht",async()=>{
    const cdp=await page.context().newCDPSession(page);
    for(let i=0;i<12;i++){
      for(const type of ["mousePressed","mouseReleased"])await cdp.send("Input.dispatchMouseEvent",{type,x:20,y:300,button:"back",buttons:type==="mousePressed"?8:0,clickCount:1});
      await page.waitForTimeout(70);
    }
    assert.equal(page.url(),first);assert.equal(await page.locator(".app-shell").count(),1);
    await cdp.detach();
  });
  await step("Zurück schließt zuerst die Dokumentvorschau und erhält die Listenposition",async()=>{
    await footer(page,"Dokumentenbibliothek");
    await page.getByRole("button",{name:"Alle ansehen",exact:true}).first().click();
    const preview=page.locator("button.library-preview, button.library-zeile-titel").first();await preview.scrollIntoViewIfNeeded();
    const y=await page.evaluate(()=>scrollY), url=page.url();await preview.click();
    await page.locator(".file-viewer").waitFor();
    await page.evaluate(()=>window.familienakteZurueck());
    await page.locator(".file-viewer").waitFor({state:"detached"});
    assert.equal(page.url(),url);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<4);
  });
} finally { await browser.close();await app.stop(); }
process.exit(summary("Zurück bis zum Anfang"));
