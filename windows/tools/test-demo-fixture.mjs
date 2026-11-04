// Explicit opt-in through the normal installed app UI. The real private start
// remains empty; model/output assertions still use the same invented family.
// Since 04.11.2026 the demo starts at the end of the help page ("Demo ansehen").
export async function openDemoFixture(page) {
  await page.waitForSelector('.site-header[data-demo-bereit="ja"]', { state: 'attached', timeout: 120000 });
  if (new URL(page.url()).searchParams.get('demo') !== '1') {
    await page.locator('.footer-directory button', { hasText: 'Hilfe' }).first().click();
    const start = page.locator('.demo-starten').getByRole('button', { name: 'Demo ansehen', exact: true });
    await start.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('demo') === '1', { timeout: 120000 }),
      start.click(),
    ]);
  }
  await page.waitForSelector('.site-header[data-demo-beispiele="ja"][data-demo-bereit="ja"]', { state: 'attached', timeout: 120000 });
}
