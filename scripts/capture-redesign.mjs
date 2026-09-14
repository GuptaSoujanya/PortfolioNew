import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  headless: true,
});
await mkdir('artifacts/v4', { recursive: true });
const errors = [];
for (const width of [390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#sculpture.ready').waitFor();
  const hero = page.locator('#home');
  await hero.screenshot({ path: `artifacts/v4/hero-${width}.png` });
  if (width !== 768) {
    for (const section of ['work', 'about', 'play', 'experience', 'contact']) {
      await page.locator(`#${section}`).screenshot({ path: `artifacts/v4/${section}-${width}.png` });
    }
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(JSON.stringify({ width, overflow }));
  await page.close();
}
console.log(JSON.stringify({ errors }));
await browser.close();
if (errors.length) process.exitCode = 1;
