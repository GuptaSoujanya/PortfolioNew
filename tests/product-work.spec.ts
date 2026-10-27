import { test, expect } from '@playwright/test';

test('new product work is additive to the original illustrated template', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-display')).toContainText('BUILD.');
  await expect(page.locator('.hero-script')).toContainText('Understand.');
  await expect(page.locator('.idea-desk-stage')).toBeVisible();
  await expect(page.locator('.hero-product-note')).toContainText('MyMandi & Kuberha');
  await expect(page.locator('.product-integrations')).toContainText('100+');
  await expect(page.locator('.product-integrations')).toContainText('across both products');
  await page.getByRole('button', { name: 'AI & agents', exact: true }).click();
  await expect(page.locator('#product-work')).toBeVisible();
  await expect(page.locator('#flagship')).toBeVisible();
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await page.getByRole('link', { name: 'Explore the role', exact: false }).click();
  await expect(page.locator('#career-role-2')).toHaveAttribute('open', '');
  await expect(page.locator('#career-role-2')).toContainText('MyMandi');
  await expect(page.locator('#career-role-2')).toContainText('Kuberha');
});

for (const product of ['MyMandi', 'Kuberha']) {
  test(`${product} details explain the confirmed scope and retain accessible dialog behavior`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const opener = page.getByRole('button', { name: `View ${product} project`, exact: true });
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: product, exact: true })).toBeVisible();
    await expect(dialog).toContainText('100+');
    await expect(dialog).toContainText('Google Sheets');
    await expect(dialog).toContainText('Shiprocket');
    await expect(dialog).toContainText('AI features');
    await expect(dialog.getByRole('link', { name: `Official ${product} product listing`, exact: false })).toHaveAttribute('href', /play\.google\.com/);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
}

test('the print-friendly résumé retains the additional product experience', async ({ page }) => {
  await page.goto('/resume.html');
  await expect(page.locator('body')).toContainText('MyMandi');
  await expect(page.locator('body')).toContainText('Kuberha');
  await expect(page.locator('body')).toContainText('100+');
  await expect(page.locator('body')).toContainText('Shiprocket');
});
