import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });

const ideas = [
  { name: 'EvalAgentFlow', caption: 'Eight agents. One clear result.', destination: '#eval-heading' },
  { name: 'Cohart', caption: 'Learn it. Try it. Build it.', destination: '#cohart-heading' },
  { name: 'Agent-Driven Portfolio', caption: 'An interface shaped by your intent.', destination: '#agui-heading' },
];

async function loadDesk(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#idea-desk').scrollIntoViewIfNeeded();
  await expect(page.locator('.idea-desk-drawing')).toBeVisible();
  await expect(page.locator('#desk-status')).toHaveText('EvalAgentFlow drawing complete.', { timeout: 8000 });
  await expect(page.locator('[data-desk-replay]')).toHaveAttribute('aria-busy', 'false');
}

function geometry(page: Page) {
  return page.locator('[data-desk-artwork] path').evaluateAll(paths => paths.map(path => path.getAttribute('d')));
}

async function expectCompletedDrawing(page: Page, name: string) {
  await expect(page.locator('#desk-status')).toHaveText(`${name} drawing complete.`, { timeout: 8000 });
  await expect(page.locator('[data-desk-replay]')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.idea-desk-drawing')).toHaveAccessibleName(new RegExp(name));
  await expect(page.locator('[data-desk-artwork]')).toBeVisible();
  await expect.poll(() => page.locator('.idea-form-surface').evaluateAll(surfaces =>
    surfaces.length > 0 && surfaces.every(surface => {
      const style = getComputedStyle(surface);
      return Number(style.opacity) === 1 && style.visibility === 'visible';
    }),
  ), { message: 'The completed diagram must show its panel content as well as its outlines.' }).toBe(true);
  await expect.poll(() => page.locator('[data-desk-artwork]').evaluate(artwork => {
    const strokes = [...artwork.querySelectorAll<SVGPathElement>('path')].filter(path => getComputedStyle(path).stroke !== 'none');
    return strokes.length > 0 && strokes.every(path => {
      const style = getComputedStyle(path);
      return path.getTotalLength() > 0 && style.visibility === 'visible'
        && Number(style.opacity) > 0 && Number(style.strokeOpacity) > 0
        && (style.strokeDasharray === 'none' || Math.abs(parseFloat(style.strokeDashoffset)) < .1);
    }) && Number(getComputedStyle(artwork).opacity) > 0;
  }), { message: 'A completed sketch must contain visible strokes with no remaining draw mask.' }).toBe(true);
}

test('project selections change the actual sketch, its accessible description, and project link', async ({ page }) => {
  await loadDesk(page);
  await expect(page.locator('.idea-desk-topline')).toContainText('PROJECT NOTES');
  await expect(page.locator('[data-project-node="agent"]')).toHaveCount(8);
  let previous = await geometry(page);

  for (const index of [1, 2, 0]) {
    const idea = ideas[index];
    const button = page.getByRole('button', { name: `Sketch ${idea.name}`, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#idea-desk button[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('#desk-caption')).toHaveText(idea.caption);
    await expect(page.locator('#desk-caption')).toBeVisible();
    await expect(page.getByRole('link', { name: `Explore ${idea.name}`, exact: true })).toHaveAttribute('href', idea.destination);
    await expect.poll(() => geometry(page), { message: 'Selecting a different project must replace the drawing geometry.' }).not.toEqual(previous);
    await expectCompletedDrawing(page, idea.name);
    if (index === 0) {
      await expect(page.locator('[data-project-node="agent"]')).toHaveCount(8);
      await expect(page.locator('[data-desk-artwork]')).toContainText('Evaluation');
      await expect(page.locator('[data-desk-artwork]')).toContainText('Findings');
    } else if (index === 1) {
      await expect(page.locator('[data-project-node="course"]')).toHaveCount(3);
      await expect(page.locator('[data-desk-artwork]')).toContainText('FOUNDATIONS');
      await expect(page.locator('[data-desk-artwork]')).toContainText('PRACTICE');
      await expect(page.locator('[data-desk-artwork]')).toContainText('BUILD');
    } else {
      for (const kind of ['conversation', 'action', 'interface']) {
        await expect(page.locator(`[data-project-node="${kind}"]`)).toHaveCount(1);
      }
      await expect(page.locator('[data-desk-artwork]')).toContainText('Keep it calm.');
    }
    previous = await geometry(page);
  }
});

test('replay draws the selected idea once and finishes with the complete sketch visible', async ({ page }) => {
  await loadDesk(page);
  const originalGeometry = await geometry(page);
  const replay = page.getByRole('button', { name: 'Replay drawing', exact: true });

  await replay.click();
  await expect(replay).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#desk-status')).toHaveText('Drawing EvalAgentFlow.');
  await expect.poll(() => page.locator('[data-desk-artwork] path').evaluateAll(paths => paths.some(path => {
    const style = getComputedStyle(path);
    return style.strokeDasharray !== 'none' && Math.abs(parseFloat(style.strokeDashoffset)) > .1;
  })), { message: 'Replay should redraw the sketch itself, not only update the button state.' }).toBe(true);
  await expect.poll(() => page.locator('[data-desk-artwork]').evaluate(artwork => {
    const active = [...artwork.querySelectorAll<SVGPathElement>('[data-ink]')].find(path => {
      const offset = parseFloat(getComputedStyle(path).strokeDashoffset);
      return offset > .1 && offset < path.getTotalLength() - .1;
    });
    if (!active) return false;
    const drawnLength = active.getTotalLength() - parseFloat(getComputedStyle(active).strokeDashoffset);
    const point = active.getPointAtLength(drawnLength);
    const pen = artwork.querySelector<SVGGElement>('.desk-pen')!.transform.baseVal.consolidate()!.matrix;
    const block = active.closest<HTMLElement>('.desk-solid');
    const expectedDepth = block ? parseFloat(block.style.getPropertyValue('--rise')) + 23 : 1;
    const depth = parseFloat(artwork.querySelector<SVGSVGElement>('.desk-pen-layer')!.style.transform.replace('translateZ(', ''));
    return Math.hypot(point.x - pen.e, point.y - pen.f) < .08 && Math.abs(depth - expectedDepth) < .1;
  }), { message: 'The pen must follow the drawn outline at the correct depth of each solid.' }).toBe(true);

  await expectCompletedDrawing(page, 'EvalAgentFlow');
  expect(await geometry(page)).toEqual(originalGeometry);
  await expect(page.locator('#desk-caption')).toHaveText(ideas[0].caption);
  const idleChanges = await page.locator('[data-desk-artwork]').evaluate(async svg => {
    let changes = 0;
    const observer = new MutationObserver(records => { changes += records.length; });
    observer.observe(svg, { attributes: true, subtree: true });
    await new Promise(resolve => setTimeout(resolve, 250));
    observer.disconnect();
    return changes;
  });
  expect(idleChanges, 'The completed project diagram should stay still until another interaction.').toBe(0);
});

test('a sketch link reveals its project when the current work filter hides it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadDesk(page);
  await page.getByRole('button', { name: 'AI & agents', exact: true }).click();
  await expect(page.locator('.case-cohart')).toBeHidden();
  await page.getByRole('button', { name: 'Sketch Cohart', exact: true }).click();
  await page.locator('#idea-desk').getByRole('link', { name: 'Explore Cohart', exact: true }).click();
  await expect(page).toHaveURL(/#cohart-heading$/);
  await expect(page.locator('.case-cohart')).toBeVisible();
  await expect(page.locator('.filter[data-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#cohart-heading')).toBeInViewport();
});

test('project panels have real side faces and pointer perspective settles or stops with motion preferences', async ({ page }) => {
  await loadDesk(page);
  const stage = page.locator('.idea-desk-stage');
  const world = page.locator('.desk-paper');
  const depth = await page.locator('.desk-solid').evaluateAll(blocks => blocks.map(block => ({
    sides: block.querySelectorAll('.solid-side').length,
    transform: getComputedStyle(block).transform,
    face: getComputedStyle(block.querySelector('.solid-face')!).transform,
    style: getComputedStyle(block).transformStyle,
  })));
  expect(depth).toHaveLength(10);
  depth.forEach(block => {
    expect(block.sides).toBe(4);
    expect(block.style).toBe('preserve-3d');
    expect(block.transform).toContain('matrix3d');
    expect(block.face).toContain('22, 1)');
  });
  const resting = await world.evaluate(element => getComputedStyle(element).transform);
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width * .82, box.y + box.height * .24);
  await expect(stage).toHaveClass(/is-exploring/);
  await expect.poll(() => world.evaluate(element => getComputedStyle(element).transform)).not.toBe(resting);
  await page.mouse.move(5, 5);
  await expect(stage).not.toHaveClass(/is-exploring/);
  await expect.poll(() => page.locator('.desk-camera').evaluate(element => {
    const style = (element as HTMLElement).style;
    return Math.abs(parseFloat(style.getPropertyValue('--look-x'))) + Math.abs(parseFloat(style.getPropertyValue('--look-y')));
  })).toBeLessThan(.03);

  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .25);
  await expect(stage).toHaveClass(/is-exploring/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).not.toHaveClass(/is-exploring/);
  await expect.poll(() => world.evaluate(element => getComputedStyle(element).transform)).toBe(resting);
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .7);
  expect(await world.evaluate(element => getComputedStyle(element).transform)).toBe(resting);
});

test('reduced motion renders each idea and replay immediately without continued drawing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadDesk(page);

  // Capture each result in the click's own task, before an animation frame can
  // hide an asynchronous transition behind an eventually passing assertion.
  const states = await page.locator('#idea-desk button[aria-pressed]').evaluateAll(buttons => buttons.map(button => {
    (button as HTMLButtonElement).click();
    const paths = [...document.querySelectorAll<SVGPathElement>('[data-desk-artwork] path')];
    return {
      caption: document.querySelector('#desk-caption')!.textContent,
      status: document.querySelector('#desk-status')!.textContent,
      pressed: button.getAttribute('aria-pressed'),
      busy: document.querySelector('[data-desk-replay]')!.getAttribute('aria-busy'),
      geometry: paths.map(path => path.getAttribute('d')),
      unfinished: paths.some(path => {
        const style = getComputedStyle(path);
        return Number(style.opacity) === 0 || (style.strokeDasharray !== 'none' && Math.abs(parseFloat(style.strokeDashoffset)) > .1);
      }),
    };
  }));
  expect(states).toHaveLength(ideas.length);
  expect(new Set(states.map(state => JSON.stringify(state.geometry))).size).toBe(ideas.length);
  states.forEach((state, index) => {
    expect(state).toMatchObject({
      caption: ideas[index].caption,
      status: `${ideas[index].name} drawing complete.`,
      pressed: 'true', busy: 'false', unfinished: false,
    });
  });

  const replayState = await page.getByRole('button', { name: 'Replay drawing', exact: true }).evaluate(button => {
    (button as HTMLButtonElement).click();
    return {
      busy: button.getAttribute('aria-busy'),
      status: document.querySelector('#desk-status')!.textContent,
      unfinished: [...document.querySelectorAll('[data-desk-artwork] path')].some(path => {
        const style = getComputedStyle(path);
        return Number(style.opacity) === 0 || (style.strokeDasharray !== 'none' && Math.abs(parseFloat(style.strokeDashoffset)) > .1);
      }),
    };
  });
  expect(replayState).toEqual({ busy: 'false', status: `${ideas[2].name} drawing complete.`, unfinished: false });
  await expectCompletedDrawing(page, ideas[2].name);
  expect(await geometry(page)).toEqual(states[2].geometry);

  const redraws = await page.locator('[data-desk-artwork]').evaluate(async artwork => {
    const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await nextFrame();
    await nextFrame();
    let changes = 0;
    const observer = new MutationObserver(records => { changes += records.length; });
    observer.observe(artwork, { attributes: true, childList: true, subtree: true });
    for (let frame = 0; frame < 6; frame++) await nextFrame();
    observer.disconnect();
    return changes;
  });
  expect(redraws, 'A completed reduced-motion drawing should stay idle.').toBe(0);
  await expect(page.locator('html')).toHaveClass(/no-motion/);
});
