import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.creative-cursor')).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
});

test('mouse hints follow the actual action and clear over ordinary content', async ({ page }) => {
  const hint = page.locator('.cursor-badge');
  const text = page.locator('.cursor-label');
  const project = page.getByRole('button', { name: 'View EvalAgentFlow project' });

  await project.hover();
  await expect(hint).toHaveCSS('opacity', '1');
  await expect(text).toHaveText('VIEW');
  await expect(project).toHaveCSS('cursor', 'none');

  await page.locator('#eval-heading').hover();
  await expect(hint).toHaveCSS('opacity', '0');

  await page.locator('.social-links').getByRole('link', { name: 'GitHub' }).hover();
  await expect(text).toHaveText('OPEN');

  await page.locator('.email-row a').hover();
  await expect(hint).toHaveCSS('opacity', '1');
  await expect(text).toHaveText('EMAIL');

  // Keyboard navigation must restore the native pointer without moving the mouse.
  await page.locator('.email-row a').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.creative-cursor')).toHaveCSS('opacity', '0');
  await expect(page.locator('.email-row a')).not.toHaveCSS('cursor', 'none');
  await expect(page.locator('.cursor-hover')).toHaveCount(0);
});

test('motion preferences restore displaced controls and the native pointer', async ({ page }) => {
  const magnet = page.locator('.contact-nav');
  const originalTranslate = await magnet.evaluate(element => element.style.translate);

  await magnet.hover({ position: { x: 12, y: 12 } });
  await expect(magnet).toHaveCSS('cursor', 'none');
  await expect.poll(() => magnet.evaluate(element => element.style.translate)).not.toBe(originalTranslate);

  // Activate the real preference button without moving the mouse away from the
  // magnet: otherwise its normal pointerleave spring could conceal a reset bug.
  await page.getByRole('button', { name: 'Pause animations', exact: true }).dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Enable animations', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => magnet.evaluate(element => element.style.translate)).toBe(originalTranslate);
  await expect(magnet).not.toHaveCSS('cursor', 'none');
  await expect(page.locator('.creative-cursor')).toBeHidden();
  await expect(magnet).not.toHaveClass(/cursor-hover/);

  // Removing an OS restriction must not override a visitor's saved pause.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Enable animations', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.creative-cursor')).toBeHidden();

  await page.mouse.move(1, 1);
  await magnet.hover({ position: { x: 14, y: 14 } });
  await expect(magnet).not.toHaveCSS('cursor', 'none');
  expect(await magnet.evaluate(element => element.style.translate)).toBe(originalTranslate);

  await page.getByRole('button', { name: 'Enable animations', exact: true }).dispatchEvent('click');
  await page.mouse.move(1, 1);
  await magnet.hover({ position: { x: 12, y: 12 } });
  await expect(magnet).toHaveCSS('cursor', 'none');
  await expect.poll(() => magnet.evaluate(element => element.style.translate)).not.toBe(originalTranslate);

  // A system preference change must also stop an already active interaction.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(magnet).not.toHaveCSS('cursor', 'none');
  await expect.poll(() => magnet.evaluate(element => element.style.translate)).toBe(originalTranslate);
  await expect(page.locator('.creative-cursor')).toBeHidden();
});

test('hover visibly expands the cursor frame, press compresses it, and the parallax stage has an accurate hint', async ({ page }) => {
  const cursor = page.locator('.creative-cursor');
  const halo = page.locator('.cursor-halo');
  const filter = page.getByRole('button', { name: 'AI & agents', exact: true });

  await page.locator('.hero-description').hover();
  await expect(halo).toHaveCSS('width', '36px');
  await filter.hover();
  await expect(page.locator('.cursor-label')).toHaveText('FILTER');
  await expect(halo).toHaveCSS('width', '60px');
  await expect(halo).toHaveCSS('height', '48px');
  await expect(halo).toHaveCSS('border-radius', '15px');
  await expect(filter).toHaveCSS('scale', '1.035');
  const hoverWidth = (await halo.boundingBox())!.width;

  await page.mouse.down();
  await expect(cursor).toHaveClass(/is-pressed/);
  await expect.poll(async () => (await halo.boundingBox())!.width).toBeLessThan(hoverWidth * .85);
  await expect(filter).toHaveCSS('scale', '0.98');
  await page.mouse.up();
  await expect(cursor).not.toHaveClass(/is-pressed/);
  await expect.poll(async () => (await halo.boundingBox())!.width).toBeGreaterThan(hoverWidth * .98);
  await expect(filter).toHaveAttribute('aria-pressed', 'true');

  const stage = page.locator('.idea-desk-stage');
  await stage.hover();
  await expect(page.locator('.cursor-label')).toHaveText('TILT');
  await expect(cursor).toHaveAttribute('data-kind', 'tilt');
  await expect(halo).toHaveCSS('width', '76px');
  await expect(filter).not.toHaveClass(/cursor-hover/);

  const link = page.locator('.hero-work-link');
  await link.hover();
  await expect(link.locator('svg')).not.toHaveCSS('transform', 'none');
  await page.locator('.hero-description').hover();
  await expect(halo).toHaveCSS('width', '36px');
  await expect(cursor).not.toHaveClass(/is-action/);
  await expect(link).not.toHaveClass(/cursor-hover/);

  // Touch input must immediately retire the custom mouse companion even on a
  // hybrid device whose fine-pointer media query still matches.
  await stage.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 30 });
  await expect(cursor).toHaveCSS('opacity', '0');
  await expect(page.locator('html')).not.toHaveClass(/cursor-live/);
  await expect(page.locator('.cursor-hover')).toHaveCount(0);
});

test('project dialogs keep a native pointer and page hints resume after closing', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'View Cohart project' });
  const hint = page.locator('.cursor-badge');
  await opener.hover();
  await expect(hint).toHaveCSS('opacity', '1');
  await expect(page.locator('.cursor-label')).toHaveText('VIEW');

  // Successful activation also checks that the decorative cursor cannot steal clicks.
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Cohart Study Guide', exact: true })).toBeVisible();
  await expect(page.locator('.creative-cursor')).toHaveCSS('opacity', '0');

  const externalLink = dialog.getByRole('link', { name: 'Explore Cohart' });
  await externalLink.hover();
  await expect(externalLink).not.toHaveCSS('cursor', 'none');
  await expect(hint).toHaveCSS('opacity', '0');

  const close = dialog.getByRole('button', { name: 'Close project details' });
  await close.hover();
  await expect(close).not.toHaveCSS('cursor', 'none');
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.hover();
  await expect(opener).toHaveCSS('cursor', 'none');
  await expect(hint).toHaveCSS('opacity', '1');
  await expect(page.locator('.cursor-label')).toHaveText('VIEW');
});
