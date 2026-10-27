import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`the project-led opening stays compact and its controls remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.idea-desk-project-name')).toHaveText('Agent evaluation platform');
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => ({
      heroHeight: document.querySelector('#home')!.getBoundingClientRect().height,
      overflow: document.documentElement.scrollWidth > innerWidth,
      modelCount: document.querySelectorAll('#sculpture, #hero-experiment').length,
      framed: (() => {
        const frame = document.querySelector('.hero-desk-wrap')!.getBoundingClientRect();
        const stage = document.querySelector('.idea-desk-stage')!.getBoundingClientRect();
        const board = document.querySelector('.desk-board')!.getBoundingClientRect();
        return [stage, board].every(box => box.left >= frame.left - 1 && box.right <= frame.right + 1);
      })(),
    }));
    expect(geometry.overflow).toBe(false);
    expect(geometry.modelCount).toBe(0);
    expect(geometry.framed, 'The 3D board must fit its panel even when the page clips horizontal overflow.').toBe(true);
    expect(geometry.heroHeight).toBeLessThan(width < 768 ? 1200 : 900);
    const category = page.getByRole('button', { name: 'Sketch Cohart', exact: true });
    await category.scrollIntoViewIfNeeded();
    expect(await category.evaluate(element => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    })).toBe(true);
    await category.click();
    await expect(page.locator('.idea-desk-project-name')).toHaveText('Cohart');
    await expect(page.locator('.idea-desk-explore')).toHaveAttribute('href', '#cohart-heading');
  });
}
