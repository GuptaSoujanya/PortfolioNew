import { test, expect } from '@playwright/test';

test('loads a project-led hero without requesting an unrelated WebGL model', async ({ page }) => {
  const errors: string[] = [];
  const models: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/sculpture|three\.module/.test(request.url())) models.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Soujanya Gupta');
  await expect(page.locator('.idea-desk-project-name')).toHaveText('EvalAgentFlow');
  await expect(page.locator('#sculpture, #hero-experiment')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sketch Cohart', exact: true }).click();
  await expect(page.locator('.idea-desk-project-name')).toHaveText('Cohart');
  await expect(page.locator('.idea-desk-explore')).toHaveAttribute('href', '#cohart-heading');
  expect(models).toEqual([]);
  expect(errors).toEqual([]);
});

test('filters projects and restores the complete selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI & agents', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'View Cohart project' })).toBeHidden();
  await page.getByRole('button', { name: 'Web experiences', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'View EvalAgentFlow project' })).toBeHidden();
  await page.getByRole('button', { name: /All work/ }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(3);
  await expect(page.locator('#filter-status')).toHaveText('3 projects shown.');
});

test('opens project details, traps keyboard focus, and returns focus when closed', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'View Cohart project' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Cohart', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Explore Cohart' })).toHaveAttribute('href', 'https://course.soujanyalab.in/');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('experience details expand and contact links use verified destinations', async ({ page }) => {
  await page.goto('/');
  const experience = page.locator('details').filter({ hasText: 'Green Rider Technology' });
  await experience.locator('summary').click();
  await expect(experience).toHaveAttribute('open', '');
  await expect(experience.locator('.experience-detail')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email Soujanya', exact: true })).toHaveAttribute('href', 'mailto:soujanyagupta.dev@gmail.com');
  await expect(page.locator('.social-links').getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/GuptaSoujanya');
});

test('copies the actual email address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('#toast')).toContainText('Email copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('soujanyagupta.dev@gmail.com');
});

test('motion preference persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause animations', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/no-motion/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Enable animations', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Enable animations', exact: true }).click();
  await expect(page.locator('html')).not.toHaveClass(/no-motion/);
});

test('respects reduced motion while keeping content and controls usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/no-motion/);
  await expect(page.locator('.idea-desk-drawing')).toBeVisible();
  await page.getByRole('button', { name: 'View EvalAgentFlow project' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close project details' }).click();
  await expect(page.getByRole('heading', { name: /PROOF OF/ })).toBeVisible();
});

test('project previews remain usable when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).includes('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.idea-desk-drawing')).toBeVisible();
  await page.getByRole('button', { name: 'Sketch Cohart', exact: true }).click();
  await expect(page.locator('.idea-desk-explore')).toHaveAttribute('href', '#cohart-heading');
  await page.getByRole('button', { name: 'View Cohart project' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('playground supports keyboard movement and a reduced-motion shuffle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const token = page.getByRole('button', { name: 'Play with React token', exact: true });
  await token.scrollIntoViewIfNeeded();
  await token.focus();
  const before = await token.evaluate(element => element.style.transform);
  await page.keyboard.press('ArrowRight');
  expect(await token.evaluate(element => element.style.transform)).not.toBe(before);
  const positions = await page.locator('.lab-token').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.transform));
  await page.getByRole('button', { name: 'Give it a shake' }).click();
  expect(await page.locator('.lab-token').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.transform))).not.toEqual(positions);
  await expect(page.locator('html')).toHaveClass(/no-motion/);
});

test('playground tokens can be dragged', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const token = page.getByRole('button', { name: 'Play with TypeScript token', exact: true });
  await token.scrollIntoViewIfNeeded();
  const before = await token.evaluate(element => element.style.transform);
  const box = await token.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2 + 35, { steps: 8 });
  await page.mouse.up();
  expect(await token.evaluate(element => element.style.transform)).not.toBe(before);
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`layout fits ${width}px and mobile navigation works`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.idea-desk-drawing')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/v3-hero-${width}.png` });
    if (width < 768) {
      const open = page.getByRole('button', { name: 'Open navigation', exact: true });
      await open.click();
      await expect(page.getByRole('navigation', { name: 'Mobile navigation', exact: true })).toBeVisible();
      await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Selected work' }).click();
      await expect(page.locator('#mobile-nav')).toBeHidden();
      await expect(page).toHaveURL(/#work$/);
    }
    await page.locator('#contact').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/portfolio-${width}.png`, fullPage: true });
  });
}

test('pipeline illustration completes and can be replayed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Run the flow' }).click();
  await expect(page.locator('#run-pipeline')).toBeDisabled();
  await expect(page.locator('#pipeline-label')).toHaveText('FLOW COMPLETE / 08 OF 08', { timeout: 8000 });
  await expect(page.locator('.pipeline-progress .complete')).toHaveCount(8);
  await page.getByRole('button', { name: 'Run again' }).click();
  await expect(page.locator('#run-pipeline')).toBeDisabled();
});

test('project previews update the curriculum and the interface theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI & ML', exact: true }).click();
  await expect(page.locator('#lesson-title')).toHaveText('Start with a question.');
  await expect(page.locator('#lesson-list')).toContainText('Explore generative AI');
  await page.getByRole('button', { name: 'Interviews', exact: true }).click();
  await expect(page.locator('#lesson-list')).toContainText('Data structures & algorithms');
  await expect(page.getByRole('button', { name: 'AI & ML', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'More playful' }).click();
  await expect(page.locator('.interface-window')).toHaveAttribute('data-theme', 'play');
  await expect(page.locator('#interface-word')).toHaveText('wild idea.');
  await page.getByRole('button', { name: 'Keep it calm', exact: true }).click();
  await expect(page.locator('.interface-window')).toHaveAttribute('data-theme', 'paper');
  await expect(page.locator('#intent-status')).toHaveText('Paper style selected.');
});

test('new interactions remain immediate with reduced motion and playground resets', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Run the flow' }).click();
  await expect(page.locator('#pipeline-label')).toHaveText('FLOW COMPLETE / 08 OF 08');
  await expect(page.locator('#run-pipeline')).toBeEnabled();
  await page.locator('#play').scrollIntoViewIfNeeded();
  const positions = await page.locator('.lab-token').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.transform));
  await page.getByRole('button', { name: 'Gravity on', exact: true }).click();
  await expect(page.locator('#gravity-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Give it a shake' }).click();
  await page.getByRole('button', { name: 'Reset playground' }).click();
  expect(await page.locator('.lab-token').evaluateAll(elements => elements.map(element => (element as HTMLElement).style.transform))).toEqual(positions);
});

for (const width of [390, 1440]) {
  test(`lower chapters render with motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const selector of ['.case-eval', '.case-cohart', '.case-agui', '#about', '#play', '#experience', '#contact']) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await section.screenshot({ path: `artifacts/v3-${selector.replace(/[.#]/g, '')}-${width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
