import { test, expect } from '@playwright/test';

test('loads a project-led hero without requesting an unrelated WebGL model', async ({ page }) => {
  const errors: string[] = [];
  const models: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/sculpture|three\.module/.test(request.url())) models.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Soujanya Gupta');
  await expect(page.locator('.idea-desk-project-name')).toHaveText('Agent evaluation platform');
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
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View Cohart project' })).toBeHidden();
  await page.getByRole('button', { name: 'Web experiences', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'View EvalAgentFlow project' })).toBeHidden();
  await page.getByRole('button', { name: /All projects/ }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(3);
  await expect(page.locator('#filter-status')).toHaveText('3 projects shown.');
});

test('opens project details, traps keyboard focus, and returns focus when closed', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'View Cohart project' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Cohart Study Guide', exact: true })).toBeVisible();
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
  const experience = page.locator('#career-role-2');
  await experience.locator('summary').click();
  await expect(experience).toHaveAttribute('open', '');
  await expect(experience.locator('.experience-detail')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email Soujanya', exact: true })).toHaveAttribute('href', 'mailto:semrisoujanya2003@gmail.com');
  await expect(page.locator('.social-links').getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/GuptaSoujanya');
});

test('copies the actual email address', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('#toast')).toContainText('Email copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('semrisoujanya2003@gmail.com');
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



for (const width of [360, 390, 768, 1024, 1440]) {
  test(`layout fits ${width}px and mobile navigation works`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.idea-desk-drawing')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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

test('the curriculum preview retains its interactive learning paths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI & ML', exact: true }).click();
  await expect(page.locator('#lesson-title')).toHaveText('Start with a question.');
  await expect(page.locator('#lesson-list')).toContainText('Generative AI engineering');
  await page.getByRole('button', { name: 'Interviews', exact: true }).click();
  await expect(page.locator('#lesson-list')).toContainText('Data structures & algorithms');
  await expect(page.getByRole('button', { name: 'AI & ML', exact: true })).toHaveAttribute('aria-pressed', 'false');

});

test('the pipeline illustration remains immediate with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Run the flow' }).click();
  await expect(page.locator('#pipeline-label')).toHaveText('FLOW COMPLETE / 08 OF 08');
  await expect(page.locator('#run-pipeline')).toBeEnabled();

});

for (const width of [390, 1440]) {
  test(`lower chapters render with motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const selector of ['.case-eval', '.case-cohart', '.case-ridemate', '#about', '#github', '#experience', '#contact']) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
