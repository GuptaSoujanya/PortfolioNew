import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });

const chapters = [
  { company: 'Ethara AI', word: 'connect.', accent: 'rgb(213, 197, 238)', background: 'rgb(48, 43, 55)' },
  { company: 'Green Rider Technology', word: 'scale.', accent: 'rgb(212, 230, 169)', background: 'rgb(44, 52, 40)' },
  { company: 'CodeAlpha', word: 'make.', accent: 'rgb(241, 185, 148)', background: 'rgb(58, 46, 39)' },
  { company: 'Robrotronix India', word: 'begin.', accent: 'rgb(182, 212, 236)', background: 'rgb(41, 52, 60)' },
];

async function expectChapter(page: Page, index: number) {
  const chapter = chapters[index];
  await expect(page.locator('.career-role[open]')).toHaveCount(1);
  await expect(page.locator('.career-role[open] h3')).toHaveText(chapter.company);
  await expect(page.locator('.career-chapter-button[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: `Explore ${chapter.company} chapter`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.career-art-word')).toHaveText(chapter.word);
  await expect(page.locator('.career-figure-number')).toHaveText(String(index + 1).padStart(2, '0'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.career-artwork svg')).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.career-navigation').scrollIntoViewIfNeeded();
});

test('each career chapter changes the selected role, artwork, and visible palette; next wraps', async ({ page }) => {
  for (const [index, chapter] of chapters.entries()) {
    await page.getByRole('button', { name: `Explore ${chapter.company} chapter`, exact: true }).click();
    await expectChapter(page, index);
    await expect(page.locator('.career-art')).toHaveCSS('color', chapter.accent);
    await expect(page.locator('.career-art')).toHaveCSS('background-color', chapter.background);
    await expect(page.locator('.career-role[open]')).toHaveCSS('background-color', chapter.accent);
    await expect(page.locator('.career-live')).toHaveText(`Chapter ${index + 1} of 4: ${chapter.company}.`);
  }

  await page.getByRole('button', { name: 'Explore next career chapter', exact: true }).click();
  await expectChapter(page, 0);
  await expect(page.locator('.career-live')).toHaveText('Chapter 1 of 4: Ethara AI.');
});

test('arrow keys, Home, End, and native summaries keep chapter selection synchronized', async ({ page }) => {
  const buttons = page.locator('.career-chapter-button');
  await buttons.nth(0).focus();
  for (const [key, index] of [
    ['ArrowRight', 1], ['ArrowDown', 2], ['ArrowUp', 1],
    ['Home', 0], ['ArrowLeft', 3], ['ArrowRight', 0], ['End', 3],
  ] as const) {
    await page.keyboard.press(key);
    await expect(buttons.nth(index)).toBeFocused();
    await expectChapter(page, index);
  }

  const summary = page.locator('#career-role-2 > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expectChapter(page, 2);
  await expect(summary).toBeFocused();

  // Native details can be collapsed; choosing that same chapter reopens its story.
  await page.keyboard.press('Enter');
  await expect(page.locator('#career-role-2 .experience-detail')).toBeHidden();
  await buttons.nth(2).click();
  await expectChapter(page, 2);
  await expect(page.locator('#career-role-2 .experience-detail')).toBeVisible();
});

test('reduced motion switches chapters immediately with readable text and stationary artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveClass(/no-motion/);

  // Read immediately after activation, before a frame could animate hidden content in.
  const states = await page.locator('.career-chapter-button').evaluateAll(elements =>
    elements.map(element => {
      (element as HTMLButtonElement).click();
      const role = document.querySelector('.career-role[open]')!;
      const word = document.querySelector('.career-art-word')!;
      const art = document.querySelector('.career-artwork')!;
      const detail = role.querySelector('.experience-detail > p')!;
      return {
        company: role.querySelector('h3')!.textContent,
        word: word.textContent,
        textOpacity: getComputedStyle(word).opacity,
        detailOpacity: getComputedStyle(detail).opacity,
        artOpacity: getComputedStyle(art).opacity,
        artTransform: getComputedStyle(art).transform,
        artTransition: getComputedStyle(document.querySelector('.career-art')!).transitionDuration,
      };
    }),
  );

  expect(states).toEqual(chapters.map(chapter => ({
    company: chapter.company,
    word: chapter.word,
    textOpacity: '1',
    detailOpacity: '1',
    artOpacity: '1',
    artTransform: 'none',
    artTransition: '0s',
  })));
  await expectChapter(page, 3);
  await expect(page.locator('.career-geometry')).toHaveCSS('animation-name', 'none');
  for (const line of await page.locator('.career-title-line > span').all()) {
    await expect(line).toHaveCSS('opacity', '1');
    await expect(line).toHaveCSS('transform', 'none');
  }
});

test('rapid chapter changes settle on the final story without leaving content faded', async ({ page }) => {
  await page.getByRole('button', { name: 'Explore Green Rider Technology chapter', exact: true }).click();

  // Allow each entry animation to start, then interrupt it with another selection.
  await page.locator('.career-chapter-button').evaluateAll(async elements => {
    for (const index of [3, 1, 0, 2, 1, 3, 2]) {
      (elements[index] as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  });

  await expectChapter(page, 2);
  await expect(page.locator('.career-live')).toHaveText('Chapter 3 of 4: CodeAlpha.');
  for (const selector of ['.career-artwork', '.career-art-word', '.career-takeaway', '#career-role-2 .experience-detail > p']) {
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
    await expect(page.locator(selector)).toHaveCSS('transform', 'none');
  }
  await expect(page.locator('.career-art')).toHaveCSS('color', chapters[2].accent);
  await page.getByRole('button', { name: 'Explore next career chapter', exact: true }).click();
  await expectChapter(page, 3);
});
