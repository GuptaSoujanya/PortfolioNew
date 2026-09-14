import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });

async function loadHero(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Soujanya Gupta');
  await expect(page.locator('[data-replay-type]')).toHaveAttribute('aria-busy', 'false');
}

async function expectHeroReadable(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.hero-display')).toContainText('CODE.');
  await expect(page.locator('.hero-script')).toContainText('Curiosity.');
  await expect(page.locator('.hero-display .kinetic-unit').first()).toBeVisible();
  await expect.poll(() => page.locator('.hero-display .kinetic-unit, .hero-display .kinetic-word').evaluateAll(elements =>
    elements.filter(element => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return Number(style.opacity) < 1 || style.visibility !== 'visible' || style.display === 'none'
        || style.transform !== 'none' || style.clipPath !== 'none' || bounds.width <= 0 || bounds.height <= 0;
    }).map(element => element.textContent),
  ), { message: 'Every displayed hero word and glyph should be visible, unmasked, and at rest.' }).toEqual([]);
}

test('replaying the hero visibly animates its text and finishes with every word readable', async ({ page }) => {
  await loadHero(page);
  await expectHeroReadable(page);
  const replay = page.getByRole('button', { name: 'Replay the intro', exact: true });
  await expect(replay).toHaveAttribute('aria-disabled', 'false');

  await replay.click();
  await expect(replay).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => page.locator('.hero-display .kinetic-unit').evaluateAll(elements =>
    elements.some(element => {
      const style = getComputedStyle(element);
      return Number(style.opacity) < .99 || style.transform !== 'none';
    }),
  ), { message: 'Replay should animate the headline itself, not only its decorative button or artwork.' }).toBe(true);

  await expect(replay).toHaveAttribute('aria-busy', 'false');
  await expectHeroReadable(page);

  // Visual words and their rolling duplicates must retain a single name.
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(navigation.locator('a[href="#work"]')).toHaveAccessibleName('Work 03');
  await expect(navigation.locator('a[href="#about"]')).toHaveAccessibleName('Human');
  await expect(navigation.locator('a[href="#play"]')).toHaveAccessibleName('Play');
  await expect(navigation.locator('a[href="#experience"]')).toHaveAccessibleName('Journey');
  await expect(page.locator('.contact-nav')).toHaveAccessibleName('Let’s talk');
  await navigation.locator('a[href="#about"]').hover();
  await expect(navigation.locator('a[href="#about"]')).toHaveAccessibleName('Human');
  await expect(navigation.locator('a[href="#about"]')).toHaveAttribute('href', '#about');
});

test('headline replay clearly reveals intact words, settles completely, and responds with ink on hover', async ({ page }) => {
  await loadHero(page);
  const samples = await page.evaluate(async () => {
    const replay = document.querySelector<HTMLButtonElement>('[data-replay-type]')!;
    const headline = document.querySelector<HTMLElement>('.hero-display')!;
    const initialLayout = { width: headline.offsetWidth, height: headline.offsetHeight };
    const words = [...document.querySelectorAll<HTMLElement>('.hero-display .kinetic-unit')];
    const frames: { bounded: boolean; moved: boolean; hinged: boolean; revealing: boolean; clipped: boolean }[] = [];
    const started = performance.now();
    replay.click();
    while (replay.getAttribute('aria-busy') === 'true' && performance.now() - started < 2400) {
      frames.push(words.reduce((result, word) => {
        const style = getComputedStyle(word);
        const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
        result.bounded &&= Number(style.opacity) >= 0 && Number(style.opacity) <= 1
          && Math.abs(matrix.m11 - 1) < .001 && Math.abs(matrix.m41) < .001
          && Math.abs(matrix.m42) <= 40 && Math.abs(matrix.m23) < .35;
        result.moved ||= Math.abs(matrix.m42) > 20;
        result.hinged ||= Math.abs(matrix.m23) > .08;
        result.revealing ||= Number(style.opacity) < .8;
        result.clipped ||= getComputedStyle(word.parentElement!).clipPath !== 'none';
        return result;
      }, { bounded: true, moved: false, hinged: false, revealing: false, clipped: false }));
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
    return {
      frames,
      finished: replay.getAttribute('aria-busy') === 'false',
      layoutStable: headline.offsetWidth === initialLayout.width && headline.offsetHeight === initialLayout.height,
    };
  });
  expect(samples.finished).toBe(true);
  expect(samples.layoutStable).toBe(true);
  expect(samples.frames.length).toBeGreaterThan(1);
  expect(samples.frames.some(frame => frame.moved)).toBe(true);
  expect(samples.frames.some(frame => frame.hinged && frame.revealing && frame.clipped)).toBe(true);
  expect(samples.frames.every(frame => frame.bounded)).toBe(true);
  await expectHeroReadable(page);

  const word = page.locator('.hero-display-line .kinetic-word').first();
  const ink = word.locator('.kinetic-unit');
  await expect.poll(() => ink.evaluate(element => parseFloat(getComputedStyle(element).backgroundPositionX))).toBe(100);
  await word.hover();
  await expect.poll(() => ink.evaluate(element => parseFloat(getComputedStyle(element).backgroundPositionX))).toBe(0);
  await expectHeroReadable(page);
  await page.locator('.hero-pretitle').hover();
  await expect.poll(() => ink.evaluate(element => parseFloat(getComputedStyle(element).backgroundPositionX))).toBe(100);
});

test('pausing motion during a replay immediately restores readable static hero text', async ({ page }) => {
  await loadHero(page);
  const replay = page.locator('[data-replay-type]');
  await replay.click();
  await expect(replay).toHaveAttribute('aria-busy', 'true');

  // Activate the actual preference control without scrolling to the footer,
  // which could let the short replay finish before this cancellation is tested.
  await page.getByRole('button', { name: 'Pause animations', exact: true }).dispatchEvent('click');
  await expect(page.getByRole('button', { name: 'Enable animations', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(replay).toHaveAttribute('aria-busy', 'false');
  await expect(replay).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.hero')).not.toHaveClass(/is-magic/);
  await expectHeroReadable(page);

  // Even an activation delivered to the unavailable control must remain inert.
  await replay.dispatchEvent('click');
  await expect(replay).toHaveAttribute('aria-busy', 'false');
  await expectHeroReadable(page);
});

test('reduced motion keeps hero text readable and replay does not start animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadHero(page);
  const replay = page.locator('[data-replay-type]');
  await expect(replay).toHaveAttribute('aria-disabled', 'true');
  await expectHeroReadable(page);

  // aria-disabled communicates the unavailable action. Dispatch still exercises
  // its handler so this covers the guard, rather than Playwright refusing a click.
  await replay.dispatchEvent('click');
  await expect(replay).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.hero')).not.toHaveClass(/is-magic/);
  await expect(replay.locator('svg')).toHaveCSS('animation-name', 'none');
  await expectHeroReadable(page);
});
