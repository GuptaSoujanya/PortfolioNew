import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const destination = 'public/assets/github';
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1, colorScheme: 'light' });
  const response = await page.goto('https://github.com/GuptaSoujanya', { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!response?.ok()) throw new Error(`GitHub returned ${response?.status()}`);
  await page.locator('.vcard-username').waitFor();
  await page.locator('.achievement-badge-sidebar').first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(image => image.getBoundingClientRect().top < innerHeight).map(image => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: `${destination}/profile-snapshot.jpg`, type: 'jpeg', quality: 88 });
  const achievements = await page.locator('.achievement-badge-sidebar').evaluateAll(images => [...new Set(images.map(image => image.getAttribute('alt')))]);
  await writeFile(`${destination}/snapshot.json`, JSON.stringify({ source: page.url(), capturedAt: new Date().toISOString(), achievements, viewport: { width: 1440, height: 1050 }, note: 'Unedited screenshot of the public profile in a signed-out browser.' }, null, 2));
  console.log(JSON.stringify({ snapshot: `${destination}/profile-snapshot.jpg`, achievements }));
} finally {
  await browser.close();
}
