import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });

const expectedProjects = {
  all: ['evalagent', 'cohart', 'agui'],
  ai: ['evalagent', 'agui'],
  web: ['cohart', 'agui'],
};
type Filter = keyof typeof expectedProjects;

async function loadFilters(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('group', { name: 'Filter projects', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator('.work-filter-indicator')).toBeVisible();
}

async function expectSettled(page: Page, filter: Filter) {
  await expect(page.locator('#work')).toHaveAttribute('data-filter-state', 'idle');
  await expect(page.locator('.case-collection')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.filter[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator(`.filter[data-filter="${filter}"]`)).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.project-card:not([hidden]) .project-open').evaluateAll(buttons =>
    buttons.map(button => (button as HTMLElement).dataset.project),
  )).toEqual(expectedProjects[filter]);
  await expect(page.locator('#filter-status')).toHaveText(`${expectedProjects[filter].length} projects shown.`);
  const leftovers = await page.locator('.project-card, .case-scene').evaluateAll(elements => elements.flatMap(element => {
    const node = element as HTMLElement;
    const properties = Array.from(node.style).filter(property => property.startsWith('--filter-'));
    return node.inert || properties.length ? [{ className: node.className, inert: node.inert, properties }] : [];
  }));
  expect(leftovers, 'Finishing a filter change must restore interactive cards and remove transient artwork styles.').toEqual([]);
  for (const card of await page.locator('.project-card:not([hidden])').all()) {
    await expect(card).toHaveCSS('opacity', '1');
    await expect(card.locator('.case-scene')).toHaveCSS('opacity', '1');
  }
}

async function expectIndicatorAligned(page: Page) {
  const centers = await page.locator('.work-filters').evaluate(controls => {
    const active = controls.querySelector('.filter[aria-pressed="true"]')!.getBoundingClientRect();
    const indicator = controls.querySelector('.work-filter-indicator')!.getBoundingClientRect();
    return { active: active.x + active.width / 2, indicator: indicator.x + indicator.width / 2 };
  });
  expect(Math.abs(centers.active - centers.indicator)).toBeLessThan(1);
}

test('filters animate outgoing cards and incoming scenes while preserving categories and native keyboard controls', async ({ page }) => {
  await loadFilters(page);
  const samples = await page.getByRole('button', { name: 'AI & agents', exact: true }).evaluate(async button => {
    (button as HTMLButtonElement).click();
    const states: Array<{ phase: string | undefined; opacity: number }> = [];
    const deadline = performance.now() + 1200;
    while (performance.now() < deadline) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const phase = (document.querySelector('#work') as HTMLElement).dataset.filterState;
      const card = document.querySelector('.project-card:not([hidden])')!;
      states.push({ phase, opacity: Number(getComputedStyle(card).opacity) });
      if (phase === 'entering') break;
    }
    return states;
  });
  expect(samples.some(state => state.phase === 'leaving' && state.opacity > 0 && state.opacity < 1),
    'The project itself should visibly fade out rather than disappearing in one frame.').toBe(true);
  await expect(page.locator('.filter[data-filter="ai"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('.project-card:not([hidden]) .case-scene').evaluateAll(scenes =>
    scenes.some(scene => {
      const opacity = Number(getComputedStyle(scene).opacity);
      return opacity > 0 && opacity < 1;
    }),
  ), { message: 'Filtered illustrations should visibly render into their new collection.' }).toBe(true);
  await expectSettled(page, 'ai');
  await expectIndicatorAligned(page);

  const web = page.getByRole('button', { name: 'Web experiences', exact: true });
  await web.focus();
  await page.keyboard.press(' ');
  await expectSettled(page, 'web');
  await expect(web).toBeFocused();

  const all = page.getByRole('button', { name: /All work/ });
  await all.focus();
  await page.keyboard.press('Enter');
  await expectSettled(page, 'all');
  await expect(all).toBeFocused();
  await expectIndicatorAligned(page);
});

test('rapid filter changes settle on the latest category and keep project previews usable', async ({ page }) => {
  await loadFilters(page);
  await page.locator('.work-filters').evaluate(async controls => {
    // Both short gaps and longer gaps exercise interruption during the outgoing
    // transition and after the next collection has begun to appear.
    const changes: Array<[string, number]> = [
      ['ai', 35], ['web', 230], ['all', 35], ['ai', 240], ['web', 35], ['all', 35], ['web', 0],
    ];
    for (const [filter, delay] of changes) {
      (controls.querySelector(`[data-filter="${filter}"]`) as HTMLButtonElement).click();
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    }
  });
  await expectSettled(page, 'web');
  await expectIndicatorAligned(page);
  await page.locator('.case-cohart').getByRole('button', { name: 'AI & ML', exact: true }).click();
  await expect(page.locator('#lesson-title')).toHaveText('Start with a question.');
  await page.getByRole('button', { name: 'View Cohart project', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close project details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Cohart project', exact: true })).toBeFocused();
});

test('pause, reduced motion, and resizing finish the latest selection without stale animation styles', async ({ page }) => {
  await loadFilters(page);
  await page.getByRole('button', { name: 'Web experiences', exact: true }).dispatchEvent('click');
  await expect(page.locator('#work')).toHaveAttribute('data-filter-state', 'entering');
  const immediatelyPaused = await page.getByRole('button', { name: 'Pause animations', exact: true }).evaluate(button => {
    (button as HTMLButtonElement).click();
    return {
      phase: (document.querySelector('#work') as HTMLElement).dataset.filterState,
      busy: document.querySelector('.case-collection')!.getAttribute('aria-busy'),
      hidden: [...document.querySelectorAll<HTMLElement>('.project-card')].map(card => card.hidden),
      inert: [...document.querySelectorAll<HTMLElement>('.project-card')].some(card => card.inert),
    };
  });
  expect(immediatelyPaused).toEqual({ phase: 'idle', busy: 'false', hidden: [true, false, false], inert: false });
  await expectSettled(page, 'web');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const immediateSelections = await page.locator('.work-filters').evaluate(controls => ['ai', 'all', 'web'].map(filter => {
    (controls.querySelector(`[data-filter="${filter}"]`) as HTMLButtonElement).click();
    return {
      filter,
      phase: (document.querySelector('#work') as HTMLElement).dataset.filterState,
      projects: [...document.querySelectorAll<HTMLElement>('.project-card:not([hidden]) .project-open')].map(button => button.dataset.project),
    };
  }));
  expect(immediateSelections).toEqual((['ai', 'all', 'web'] as const).map(filter => ({ filter, phase: 'idle', projects: expectedProjects[filter] })));
  // Let a cancelled transition's original finish time pass: no stale callback
  // may restore an earlier category or disable the now-static controls.
  await page.waitForTimeout(1100);
  await expectSettled(page, 'web');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Enable animations', exact: true }).dispatchEvent('click');
  await page.getByRole('button', { name: /All work/ }).dispatchEvent('click');
  await expect(page.locator('#work')).toHaveAttribute('data-filter-state', 'entering');
  await page.setViewportSize({ width: 390, height: 900 });
  await expectSettled(page, 'all');
  await expectIndicatorAligned(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
