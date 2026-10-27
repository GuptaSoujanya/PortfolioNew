import { test, expect } from '@playwright/test';

test('contribution controls keep readable ink, stable geometry, and a native pointer on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  for (const product of ['mymandi', 'kuberha', 'morrow']) {
    const control = page.locator(`.case-link[data-project="${product}"]`);
    await control.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const before = await control.boundingBox();
    const ink = await control.evaluate(element => getComputedStyle(element).color);
    await control.hover();
    await expect(control).toHaveCSS('color', ink);
    await expect(page.locator('html')).not.toHaveClass(/cursor-live/);
    const after = await control.boundingBox();
    expect(after!.width).toBeCloseTo(before!.width, 1);
    expect(after!.height).toBeCloseTo(before!.height, 1);
    expect(ink).not.toBe('rgb(241, 238, 231)');
    await control.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(control).toBeFocused();
  }
});

test('integration logos scroll, pause locally, and settle into a readable list for reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const ribbon = page.locator('[data-integration-ribbon]');
  const track = page.locator('.integration-track');
  await ribbon.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const start = await track.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform)).not.toBe(start);
  await page.getByRole('button', { name: 'Pause integration logos', exact: true }).click();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await expect(page.locator('[data-integration-pause]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Resume integration logos', exact: true }).click();
  await expect(track).toHaveCSS('animation-play-state', 'running');
  await page.locator('.integration-window').hover();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.integration-clone')).toBeHidden();
  await expect(page.locator('[data-integration-pause]')).toBeDisabled();
  await expect(page.getByRole('list', { name: 'Integration examples and workflow categories' }).getByRole('listitem')).toHaveCount(6);
  await page.setViewportSize({ width: 320, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('product logos and the captured GitHub profile load with links to all four verified achievements', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const name of ['MyMandi', 'Kuberha']) {
    const logo = page.getByRole('img', { name: `${name} logo`, exact: true });
    await logo.scrollIntoViewIfNeeded();
    await expect.poll(() => logo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.locator('#github').scrollIntoViewIfNeeded();
  for (const name of ['Pull Shark', 'Pair Extraordinaire', 'Quickdraw', 'YOLO']) {
    const achievement = page.getByRole('link', { name: `View ${name} GitHub achievement`, exact: true });
    await expect(achievement).toHaveAttribute('href', /github\.com\/GuptaSoujanya\?achievement=.*tab=achievements/);
    await expect.poll(() => achievement.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const screenshot = page.locator('.github-preview-frame img');
  await screenshot.scrollIntoViewIfNeeded();
  await expect.poll(() => screenshot.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1440);
  await expect(page.locator('.repository-grid .repository-row')).toHaveCount(4);
});
