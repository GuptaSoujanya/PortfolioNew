import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const directory = 'artifacts/benchmark';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true });
const references = [
  ['akash', 'https://akashux.framer.website/'],
  ['florent', 'https://heyflorent.com/'],
  ['namrata', 'https://namy.design/'],
];
await Promise.allSettled(references.map(async ([name, url]) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(10000);
    await page.mouse.click(1420, 970);
    await page.waitForTimeout(2500);
    const text = await page.locator('body').innerText();
    await writeFile(`${directory}/${name}.txt`, text);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 750) {
      await page.mouse.wheel(0, 750);
      await page.waitForTimeout(300);
    }
    for (const [label, fraction] of [['work', .25], ['middle', .53], ['end', 1]]) {
      await page.evaluate(f => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${directory}/${name}-${label}.png` });
    }
    console.log(JSON.stringify({ name, title: await page.title(), height, text: text.slice(0, 2500) }));
  } catch (error) { console.log(name, String(error)); }
  await page.close();
}));
await browser.close();
