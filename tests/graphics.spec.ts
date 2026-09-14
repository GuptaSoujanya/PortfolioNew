import { test, expect } from '@playwright/test';

test('real token drags leave bounded gesture traces without covering controls, and reset clears them', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const token = page.getByRole('button', { name: 'Play with TypeScript token', exact: true });
  await token.scrollIntoViewIfNeeded();
  const layer = page.locator('.motion-trace');
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await expect(layer).toHaveCSS('pointer-events', 'none');
  await expect(layer).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('.motion-trace-path')).toHaveCount(0);

  const originalPosition = await token.evaluate(element => element.style.transform);
  const reset = page.getByRole('button', { name: 'Reset playground', exact: true });
  for (const [index, [dx, dy]] of [[260, 80], [-150, 30], [70, -65]].entries()) {
    // Pointerdown focuses the token after starting its trace. A capturing
    // window blur listener must not mistake the control losing focus for the
    // entire window losing focus and cancel the new gesture before it moves.
    await reset.evaluate(button => (button as HTMLButtonElement).focus({ preventScroll: true }));
    const box = await token.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: index === 0 ? 85 : 20 });
    await page.mouse.up();
    await expect(page.locator('.motion-trace-path')).toHaveCount(Math.min(index + 1, 2));
    if (index === 0) {
      // Check the long gesture before bounded history replaces it on drag three.
      const longTrace = await page.locator('.motion-trace-path').evaluate(path => ({
        samples: (path.getAttribute('d')!.match(/[MLQ]/g) ?? []).length,
        length: (path as unknown as SVGPathElement).getTotalLength(),
      }));
      expect(longTrace.samples).toBeLessThanOrEqual(70);
      expect(longTrace.length).toBeGreaterThan(200);
    }
  }
  expect(await token.evaluate(element => element.style.transform)).not.toBe(originalPosition);
  await expect(page.locator('.motion-trace-endpoint')).toHaveCount(2);

  const traceGeometry = await layer.evaluate(svg => {
    const viewBox = (svg as unknown as SVGSVGElement).viewBox.baseVal;
    return [...svg.querySelectorAll<SVGPathElement>('path')].map(path => {
      const box = path.getBBox();
      return {
        length: path.getTotalLength(),
        commands: (path.getAttribute('d')!.match(/[MLQ]/g) ?? []).length,
        withinBounds: box.x >= -.1 && box.y >= -.1
          && box.x + box.width <= viewBox.width + .1 && box.y + box.height <= viewBox.height + .1,
      };
    });
  });
  traceGeometry.forEach(trace => {
    expect(trace.length).toBeGreaterThan(40);
    expect(trace.commands).toBeLessThanOrEqual(70);
    expect(trace.withinBounds).toBe(true);
  });

  await reset.scrollIntoViewIfNeeded();
  expect(await reset.evaluate(button => {
    const box = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await reset.click();
  await expect(page.locator('.motion-trace-path, .motion-trace-endpoint')).toHaveCount(0);
  expect(await token.evaluate(element => element.style.transform)).toBe(originalPosition);
});
