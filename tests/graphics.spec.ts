import { test, expect } from '@playwright/test';

test('the original signature and identity artwork remain visible with motion disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.wordmark svg')).toBeVisible();
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(page.locator('.identity-card')).toBeVisible();
  await expect(page.locator('.identity-contour-field path')).toHaveCount(25);
  await expect(page.locator('.identity-lines')).not.toHaveClass(/graphic-motion/);
  await expect(page.locator('.contact-postcard')).toHaveAttribute('href', 'mailto:semrisoujanya2003@gmail.com');
});
