import { expect, test } from '@playwright/test';

for (const width of [320, 390, 701, 768, 1024, 1440]) {
  test(`contact stays compact, readable, and clickable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#contact')).toHaveClass(/lower-curated/);
    await page.evaluate(() => document.fonts.ready);

    const postcard = page.getByRole('link', { name: 'Email Soujanya', exact: true });
    await postcard.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const { top, right, bottom, left, height, width } = document.querySelector(selector)!.getBoundingClientRect();
        return { top, right, bottom, left, height, width };
      };
      const card = document.querySelector('.contact-postcard')!;
      const bounds = card.getBoundingClientRect();
      return {
        title: rect('#contact-title'),
        note: rect('.contact-side-note'),
        card: rect('.contact-postcard'),
        details: rect('.contact-details'),
        section: rect('#contact'),
        cardReachable: card.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)),
      };
    });

    expect(geometry.card.left).toBeGreaterThanOrEqual(0);
    expect(geometry.card.right).toBeLessThanOrEqual(width);
    expect(geometry.card.width).toBeGreaterThanOrEqual(44);
    expect(geometry.card.height).toBeGreaterThanOrEqual(44);
    expect(geometry.cardReachable).toBe(true);
    expect(geometry.details.top - geometry.card.bottom).toBeGreaterThan(12);

    if (width >= 701) {
      expect(geometry.title.right + 8).toBeLessThan(geometry.card.left);
      expect(geometry.section.height).toBeLessThan(820);
    } else {
      expect(geometry.card.top).toBeGreaterThan(geometry.note.bottom + 8);
    }
  });
}
