import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, headless: true });
await mkdir('artifacts/v10', { recursive: true });
const errors = [];
for (const width of [360, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-desk-replay][aria-busy="false"]').waitFor();
  await page.locator('#home').screenshot({ path: `artifacts/v10/hero-${width}.png` });
  const state = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    headline: document.querySelector('.hero-display')?.textContent,
    titleBox: document.querySelector('.hero-display')?.getBoundingClientRect().toJSON(),
    heroHeight: document.querySelector('#home')?.getBoundingClientRect().height,
  }));
  console.log(JSON.stringify({ width, ...state }));
  if (width === 1440) {
    await page.getByRole('button', { name: 'Sketch Cohart', exact: true }).click();
    await page.locator('#home').screenshot({ path: 'artifacts/v10/hero-cohart.png' });
    await page.getByRole('button', { name: 'Sketch Agent-Driven Portfolio', exact: true }).click();
    await page.locator('#home').screenshot({ path: 'artifacts/v10/hero-interface.png' });
    if (await page.locator('#hero-experiment').count()) {
      await page.locator('#hero-experiment > summary').click();
      await page.locator('#sculpture.ready').waitFor();
      await page.locator('#hero-experiment').screenshot({ path: 'artifacts/v10/3d-notebook.png' });
    }
  }
  await page.close();
}
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:5173');
await page.locator('[data-replay-type][aria-busy="false"]').waitFor();
await page.locator('[data-replay-type]').click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'artifacts/v10/hero-in-motion.png' });
await page.locator('[data-replay-type][aria-busy="false"]').waitFor();
await page.screenshot({ path: 'artifacts/v10/hero-motion-rest.png' });
console.log(JSON.stringify({ errors }));
await browser.close();
if(errors.length) process.exitCode = 1;
