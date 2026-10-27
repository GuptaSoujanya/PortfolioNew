import { test, expect } from '@playwright/test';

test('Morrow is featured before professional work with source links and original artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-product-note a[href="#morrow"]')).toBeVisible();
  const feature = page.locator('#morrow');
  await feature.scrollIntoViewIfNeeded();
  await expect(feature.getByRole('heading', { name: 'morrow', exact: true })).toBeVisible();
  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().top;
    return top('#morrow') < top('#product-work') && top('#product-work') < top('#flagship');
  });
  expect(order).toBe(true);
  await expect(feature.locator('.morrow-source')).toHaveAttribute('href', 'https://github.com/GuptaSoujanya/Morrow');
  await expect(feature.locator('.morrow-brand img')).toHaveJSProperty('complete', true);
  expect(await feature.locator('.morrow-brand img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'View Morrow project', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('18 specialized agents');
  await expect(page.getByRole('dialog')).toContainText('free local beta');
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Morrow frontend source', exact: false })).toHaveAttribute('href', 'https://github.com/GuptaSoujanya/Morrow-frontend');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'View Morrow project', exact: true })).toBeFocused();
});

test('Morrow views and agent descriptions work with keyboard input without starting external actions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const mutations: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Explore Morrow interface' });
  await tabs.getByRole('tab', { name: 'Launchpad', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  const crew = tabs.getByRole('tab', { name: 'Bot Crew', exact: true });
  await expect(crew).toBeFocused();
  await expect(crew).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#morrow-panel-overview')).toBeHidden();
  await expect(page.locator('#morrow-panel-crew')).toBeVisible();
  await page.getByRole('button', { name: 'Preview Learning assistant agent', exact: true }).click();
  await expect(page.locator('#morrow-agent-detail')).toContainText('90-day study plan');
  await expect(page.locator('[data-preview-agent][aria-pressed="true"]')).toHaveCount(1);
  await crew.focus();
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'Learning', exact: true })).toBeFocused();
  await expect(page.locator('#morrow-panel-learning')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Launchpad', exact: true })).toBeFocused();
  await expect(page.locator('#morrow-panel-overview')).toBeVisible();
  expect(mutations).toEqual([]);
});

test('product illustrations visibly animate, settle, and immediately honor motion-off', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Replay MyMandi workflow', exact: true });
  const art = page.locator('[data-product-story="mymandi"]');
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => art.locator('.story-line').evaluateAll(paths => paths.some(path => parseFloat(getComputedStyle(path).strokeDashoffset) > .05))).toBe(true);
  await expect(button).toHaveAttribute('aria-busy', 'false');
  await expect(art).toHaveAttribute('data-motion-state', 'complete');
  await button.click();
  await page.getByRole('button', { name: 'Pause animations', exact: true }).dispatchEvent('click');
  await expect(button).toHaveAttribute('aria-busy', 'false');
  expect(await art.locator('.story-layer').evaluateAll(layers => layers.every(layer => getComputedStyle(layer).opacity === '1' && getComputedStyle(layer).transform === 'none'))).toBe(true);
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'false');
});

test('Morrow artwork tilts independently of controls and resets for reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const stage = page.locator('.morrow-stage');
  const plane = stage.locator('.showcase-tilt-plane');
  await stage.scrollIntoViewIfNeeded();
  const controlBefore = await page.locator('.morrow-tabs').boundingBox();
  const resting = await plane.evaluate(element => getComputedStyle(element).transform);
  await stage.hover({ position: { x: 50, y: 70 } });
  await expect(stage).toHaveClass(/is-exploring/);
  await expect.poll(() => plane.evaluate(element => getComputedStyle(element).transform)).not.toBe(resting);
  const controlAfter = await page.locator('.morrow-tabs').boundingBox();
  expect(controlAfter?.x).toBeCloseTo(controlBefore!.x, 1);
  expect(controlAfter?.y).toBeCloseTo(controlBefore!.y, 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).not.toHaveClass(/is-exploring/);
  await expect.poll(() => plane.evaluate(element => getComputedStyle(element).transform)).toBe(resting);
  await page.getByRole('tab', { name: 'Learning', exact: true }).click();
  await expect(page.locator('#morrow-panel-learning')).toHaveCSS('opacity', '1');
  await expect(page.locator('#morrow-panel-learning')).toHaveCSS('transform', 'none');
});

test('Morrow replays the selected view and rapid tab changes leave it readable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const replay = page.getByRole('button', { name: 'Replay Morrow illustration', exact: true });
  await page.getByRole('tab', { name: 'Bot Crew', exact: true }).click();
  await replay.click();
  await expect(replay).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => page.locator('#morrow-panel-crew .story-layer').evaluateAll(layers => layers.some(layer => parseFloat(getComputedStyle(layer).opacity) < .95))).toBe(true);
  await page.getByRole('tab', { name: 'Learning', exact: true }).click();
  await expect(replay).toHaveAttribute('aria-busy', 'false');
  await replay.click();
  await expect.poll(() => page.locator('#morrow-panel-learning .story-layer').evaluateAll(layers => layers.some(layer => parseFloat(getComputedStyle(layer).opacity) < .95))).toBe(true);
  await expect(replay).toHaveAttribute('aria-busy', 'false');
  expect(await page.locator('#morrow-panel-learning .story-layer').evaluateAll(layers => layers.every(layer => getComputedStyle(layer).opacity === '1'))).toBe(true);
  await page.getByRole('tab', { name: 'Bot Crew', exact: true }).click();
  expect(await page.locator('#morrow-panel-crew .story-layer').evaluateAll(layers => layers.every(layer => getComputedStyle(layer).opacity === '1'))).toBe(true);
});

for (const width of [320, 390, 768, 1440]) {
  test(`the new product previews fit ${width}px with usable controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const view of ['Launchpad', 'Bot Crew', 'Learning']) {
      const tab = page.getByRole('tab', { name: view, exact: true });
      await tab.click();
      const bounds = (await tab.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const frame = await page.locator('.morrow-screen').boundingBox();
      expect(frame!.x).toBeGreaterThanOrEqual(0);
      expect(frame!.x + frame!.width).toBeLessThanOrEqual(width);
    }
    await page.locator('.product-integrations').scrollIntoViewIfNeeded();
    await expect(page.locator('.integration-heading > strong')).toBeInViewport();
    await expect(page.locator('.product-integrations')).toContainText('100+');
    await expect(page.locator('.product-integrations')).toHaveCSS('opacity', '1');
    if (width === 1440) await page.locator('.product-integrations').screenshot({ path: 'artifacts/morrow-showcase/integration-highlight-1440.png' });
    expect(errors).toEqual([]);
  });
}
