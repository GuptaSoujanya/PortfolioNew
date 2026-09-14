import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const baseURL = process.argv[2] || 'http://127.0.0.1:5189';
const destination = process.argv[3] || 'artifacts/design-repair';
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [], metrics = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    await page.locator('.idea-desk-project-name').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#home').screenshot({ path: `${destination}/hero-${width}.png` });
    if (width === 1440) {
      for (const [project, name] of [['Cohart', 'learning'], ['Agent-Driven Portfolio', 'interface'], ['EvalAgentFlow', 'agents']]) {
        await page.getByRole('button', { name: `Sketch ${project}`, exact: true }).click();
        await page.locator('#home').screenshot({ path: `${destination}/hero-${name}.png` });
      }
    }
    if (width === 390 || width === 1440) {
      for (const [selector, name] of [['.case-eval', 'ai-project'], ['.case-cohart', 'learning-project'], ['.case-agui', 'interface-project'], ['#about', 'about'], ['#play', 'play'], ['#experience', 'experience'], ['#contact', 'contact']]) {
        await page.locator(selector).screenshot({ path: `${destination}/${name}-${width}.png` });
      }
      await page.screenshot({ path: `${destination}/full-page-${width}.png`, fullPage: true });
    }
    metrics.push(await page.evaluate(width => ({ width,
      overflow: document.documentElement.scrollWidth > innerWidth,
      overflowElements: document.documentElement.scrollWidth > innerWidth ? [...document.querySelectorAll('body *')].flatMap(element => {
        const box = element.getBoundingClientRect();
        if (box.right <= innerWidth + 1 || !box.width) return [];
        return [{ element: element.tagName.toLowerCase(), className: element.getAttribute('class'), left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) }];
      }) : [],
      pageHeight: document.documentElement.scrollHeight,
      sections: [...document.querySelectorAll('main section[id]')].map(section => ({ id: section.id, height: Math.round(section.getBoundingClientRect().height) })),
    }), width));
    await page.close();
  }
  const motionPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  motionPage.on('pageerror', error => errors.push(error.message));
  await motionPage.goto(baseURL);
  await motionPage.evaluate(() => document.fonts.ready);
  await motionPage.locator('[data-desk-replay][aria-busy="false"]').waitFor();
  await motionPage.locator('[data-replay-type][aria-busy="false"]').waitFor();
  await motionPage.locator('[data-replay-type]').click();
  await motionPage.waitForTimeout(250);
  await motionPage.locator('#home').screenshot({ path: `${destination}/hero-text-reveal.png` });
  await motionPage.locator('[data-replay-type][aria-busy="false"]').waitFor();
  const stage = await motionPage.locator('.idea-desk-stage').boundingBox();
  for (const [name, x, y] of [['left', .15, .25], ['right', .85, .7]]) {
    await motionPage.mouse.move(stage.x + stage.width * x, stage.y + stage.height * y);
    await motionPage.waitForTimeout(500);
    await motionPage.locator('#home').screenshot({ path: `${destination}/hero-hover-${name}.png` });
  }
  await motionPage.close();
  await writeFile(`${destination}/metrics.json`, JSON.stringify({ metrics, errors }, null, 2));
  console.log(JSON.stringify({ metrics, errors }));
  if (errors.length || metrics.some(row => row.overflow)) process.exitCode = 1;
} finally { await browser.close(); }
