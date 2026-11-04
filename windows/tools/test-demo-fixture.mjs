// Explicit opt-in through the normal installed app UI. The real private start
// remains empty; model/output assertions still use the same invented family.
export async function openDemoFixture(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('.demo-workspace button');
    return button && !button.disabled;
  }, null, { timeout: 120000 });
  if (new URL(page.url()).searchParams.get('demo') !== '1') {
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('demo') === '1', { timeout: 120000 }),
      page.getByRole('button', { name: 'Demo öffnen', exact: true }).click(),
    ]);
  }
  await page.waitForSelector('.demo-workspace.sample-data-notice strong', { timeout: 120000 });
  await page.waitForFunction(() => !document.querySelector('.demo-workspace button')?.disabled, null, { timeout: 120000 });
}
