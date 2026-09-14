import './cursor.css';

type Magnetic = {
  element: HTMLElement;
  originalTranslate: string;
  originalPriority: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rect: DOMRect | null;
};

/** A pointer companion that only runs while a mouse or its springs are moving. */
export function createCursor(initialMotion: boolean) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const html = document.documentElement;
  const cursor = document.createElement('div');
  cursor.className = 'creative-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<div class="cursor-reticle"><span class="cursor-halo"></span></div><span class="cursor-point"></span><span class="cursor-badge"><span class="cursor-label"></span><span class="cursor-symbol"></span></span>';
  document.body.append(cursor);

  const point = cursor.querySelector<HTMLElement>('.cursor-point')!;
  const reticle = cursor.querySelector<HTMLElement>('.cursor-reticle')!;
  const badge = cursor.querySelector<HTMLElement>('.cursor-badge')!;
  const label = cursor.querySelector<HTMLElement>('.cursor-label')!;
  const symbol = cursor.querySelector<HTMLElement>('.cursor-symbol')!;
  const magnets = new Map<HTMLElement, Magnetic>();
  const cleanup: (() => void)[] = [];
  let motion = initialMotion;
  let destroyed = false;
  let focused = true;
  let overlay = false;
  let visible = false;
  let pressed = false;
  let frame = 0;
  let lastTime = 0;
  let x = 0;
  let y = 0;
  let followX = 0;
  let followY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let viewportWidth = innerWidth;
  let viewportHeight = innerHeight;
  let activeMagnet: Magnetic | null = null;
  let context: Element | null = null;
  let contextUsable = false;
  let contextLabel: string | null = null;
  let hoverTarget: Element | null = null;
  let needsHitTest = false;
  let boundsDirty = false;
  // Watch only the current action. A changed hint can wake one frame even when
  // the mouse has stopped, without observing every attribute on the page.
  const contextObserver = new MutationObserver(() => {
    needsHitTest = true;
    wake();
  });

  function listen(target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function available() {
    return !destroyed && motion && finePointer.matches && !reducedMotion.matches && focused && !document.hidden && !overlay;
  }

  function restoreMagnet(magnet: Magnetic) {
    magnet.element.style.removeProperty('translate');
    if (magnet.originalTranslate) magnet.element.style.setProperty('translate', magnet.originalTranslate, magnet.originalPriority);
    magnet.x = magnet.y = magnet.vx = magnet.vy = 0;
    magnet.rect = null;
  }

  function hide() {
    visible = false;
    pressed = false;
    context = null;
    contextUsable = false;
    contextLabel = null;
    contextObserver.disconnect();
    activeMagnet = null;
    lastTime = 0;
    velocityX = velocityY = 0;
    cancelAnimationFrame(frame);
    frame = 0;
    html.classList.remove('cursor-live');
    cursor.classList.remove('is-visible', 'is-action', 'is-labelled', 'is-pressed');
    hoverTarget?.classList.remove('cursor-hover');
    hoverTarget = null;
    magnets.forEach(restoreMagnet);
  }

  function wake() {
    if (!frame && visible && available()) frame = requestAnimationFrame(render);
  }

  function updateContext(target: Element | null) {
    if (target?.closest('input, textarea, select, [contenteditable="true"], [data-cursor="native"]')) {
      hide();
      return false;
    }
    const chapter = target?.closest('main section[id]')?.id ?? 'home';
    if (cursor.dataset.chapter !== chapter) cursor.dataset.chapter = chapter;
    const interactive = target?.closest('a[href], button, summary, [role="button"], [data-cursor-label]') ?? null;
    const usable = interactive && !interactive.matches(':disabled, [aria-disabled="true"]');
    const nextLabel = interactive?.getAttribute('data-cursor-label') ?? null;
    if (context !== interactive || contextUsable !== !!usable || contextLabel !== nextLabel) {
      if (context !== interactive) {
        contextObserver.disconnect();
        if (interactive) contextObserver.observe(interactive, { attributes: true, attributeFilter: ['data-cursor-label', 'disabled', 'aria-disabled'] });
      }
      context = interactive;
      contextUsable = !!usable;
      contextLabel = nextLabel;
      let text = '';
      let kind = 'link';
      if (usable) {
        if (interactive.matches('.lab-token')) { text = 'DRAG'; kind = 'drag'; }
        else if (interactive.matches('.career-chapter-button')) { text = 'EXPLORE'; kind = 'chapter'; }
        else if (interactive.matches('.project-open')) text = 'VIEW';
        else if (interactive.matches('.filter')) text = 'FILTER';
        else if (interactive.matches('[data-desk-project]')) text = 'SELECT';
        else if (interactive.matches('[data-desk-replay], [data-replay-type]')) text = 'REPLAY';
        else if (interactive.matches('[data-desk-next]')) text = 'NEXT';
        else if (interactive.matches('a[href^="mailto:"]')) { text = 'EMAIL'; kind = 'email'; }
        else if (interactive.matches('a[target="_blank"]')) text = 'OPEN';
        else if (interactive.matches('.copy-email')) text = 'COPY';
        if (nextLabel !== null) text = nextLabel.slice(0, 12);
        if (text === 'TILT') kind = 'tilt';
      }
      label.textContent = text;
      symbol.textContent = kind === 'drag' ? '↔' : kind === 'chapter' ? '→' : text === 'COPY' ? '+' : '↗';
      cursor.dataset.kind = kind;
      cursor.classList.toggle('is-labelled', !!text);
      cursor.classList.toggle('is-action', !!usable);
      hoverTarget?.classList.remove('cursor-hover');
      hoverTarget = usable ? interactive : null;
      hoverTarget?.classList.add('cursor-hover');
    }

    const magneticElement = usable ? target?.closest<HTMLElement>('[data-magnetic]') ?? null : null;
    if (magneticElement !== activeMagnet?.element) {
      activeMagnet = null;
      if (magneticElement) {
        let magnet = magnets.get(magneticElement);
        if (!magnet) {
          magnet = {
            element: magneticElement,
            originalTranslate: magneticElement.style.getPropertyValue('translate'),
            originalPriority: magneticElement.style.getPropertyPriority('translate'),
            x: 0, y: 0, vx: 0, vy: 0, rect: null,
          };
          magnets.set(magneticElement, magnet);
        }
        activeMagnet = magnet;
        boundsDirty = true;
      }
    }
    return true;
  }

  function render(time: number) {
    frame = 0;
    if (!available() || !visible) { hide(); return; }
    // All geometry reads happen before the pointer and magnetic style writes.
    if (needsHitTest && !pressed) {
      needsHitTest = false;
      if (!updateContext(document.elementFromPoint(x, y))) return;
    }
    if (boundsDirty && activeMagnet) {
      const bounds = activeMagnet.element.getBoundingClientRect();
      activeMagnet.rect = new DOMRect(bounds.x - activeMagnet.x, bounds.y - activeMagnet.y, bounds.width, bounds.height);
    }
    boundsDirty = false;
    const step = lastTime ? Math.min(2, Math.max(.5, (time - lastTime) / 16.667)) : 1;
    lastTime = time;
    const damping = Math.pow(.62, step);
    velocityX = (velocityX + (x - followX) * .19 * step) * damping;
    velocityY = (velocityY + (y - followY) * .19 * step) * damping;
    followX += velocityX * step;
    followY += velocityY * step;

    let unsettled = Math.abs(x - followX) + Math.abs(y - followY) + Math.abs(velocityX) + Math.abs(velocityY) > .15;
    if (!unsettled) { followX = x; followY = y; velocityX = velocityY = 0; }
    const speed = Math.hypot(velocityX, velocityY);
    // Hover geometry remains aligned with the control. Only free movement has
    // a slight elastic response; there is no rotating ornament or idle trail.
    const stretch = contextUsable ? 0 : Math.min(.12, speed * .004);
    point.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    reticle.style.transform = `translate3d(${followX}px, ${followY}px, 0) scale(${1 + stretch}, ${1 - stretch * .6})`;
    const badgeX = Math.min(viewportWidth - 104, Math.max(10, followX + (x > viewportWidth - 124 ? -112 : 20)));
    const badgeY = Math.min(viewportHeight - 46, Math.max(10, followY + 19));
    badge.style.transform = `translate3d(${badgeX}px, ${badgeY}px, 0)`;

    magnets.forEach(magnet => {
      let targetX = 0;
      let targetY = 0;
      if (magnet === activeMagnet && magnet.rect) {
        targetX = Math.max(-10, Math.min(10, (x - magnet.rect.left - magnet.rect.width / 2) * .16));
        targetY = Math.max(-7, Math.min(7, (y - magnet.rect.top - magnet.rect.height / 2) * .16));
      }
      if (!targetX && !targetY && !magnet.x && !magnet.y && !magnet.vx && !magnet.vy) return;
      magnet.vx = (magnet.vx + (targetX - magnet.x) * .13 * step) * Math.pow(.68, step);
      magnet.vy = (magnet.vy + (targetY - magnet.y) * .13 * step) * Math.pow(.68, step);
      magnet.x += magnet.vx * step;
      magnet.y += magnet.vy * step;
      const settling = Math.abs(targetX - magnet.x) + Math.abs(targetY - magnet.y) + Math.abs(magnet.vx) + Math.abs(magnet.vy) > .05;
      unsettled ||= settling;
      if (!settling && magnet !== activeMagnet) restoreMagnet(magnet);
      else magnet.element.style.setProperty('translate', `${magnet.x.toFixed(3)}px ${magnet.y.toFixed(3)}px`);
    });
    if (unsettled) wake();
    else lastTime = 0;
  }

  function onPointer(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || !available()) { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    if (x < 0 || y < 0 || x >= viewportWidth || y >= viewportHeight) { hide(); return; }
    pressed = event.buttons !== 0;
    cursor.classList.toggle('is-pressed', pressed);
    if (!updateContext(event.target instanceof Element ? event.target : null)) return;
    if (!visible) {
      visible = true;
      followX = x;
      followY = y;
      html.classList.add('cursor-live');
      cursor.classList.add('is-visible');
    }
    wake();
  }

  function refreshAvailability() {
    overlay = !!document.querySelector('dialog[open], #mobile-nav:not([hidden])');
    if (!available()) hide();
  }

  const overlayObserver = new MutationObserver(refreshAvailability);
  document.querySelectorAll('dialog, #mobile-nav').forEach(element => {
    overlayObserver.observe(element, { attributes: true, attributeFilter: ['open', 'hidden'] });
  });
  refreshAvailability();

  listen(document, 'pointermove', onPointer as EventListener, { passive: true });
  listen(document, 'pointerover', onPointer as EventListener, { passive: true });
  listen(document, 'pointerout', ((event: PointerEvent) => {
    if (!event.relatedTarget) hide();
  }) as EventListener, { passive: true });
  listen(document, 'pointerdown', ((event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !available()) { hide(); return; }
    pressed = true;
    cursor.classList.add('is-pressed');
  }) as EventListener, { passive: true });
  listen(document, 'pointerup', () => {
    pressed = false;
    cursor.classList.remove('is-pressed');
    needsHitTest = true;
    wake();
  }, { passive: true });
  listen(document, 'pointercancel', hide);
  listen(window, 'blur', () => { focused = false; hide(); });
  listen(window, 'focus', () => { focused = true; refreshAvailability(); });
  listen(window, 'pagehide', hide);
  listen(window, 'pageshow', refreshAvailability);
  listen(document, 'visibilitychange', refreshAvailability);
  listen(document, 'keydown', ((event: KeyboardEvent) => { if (event.key === 'Tab' || event.key === 'Escape') hide(); }) as EventListener);
  listen(window, 'scroll', () => { boundsDirty = true; needsHitTest = true; wake(); }, { passive: true, capture: true });
  listen(window, 'resize', () => {
    viewportWidth = innerWidth;
    viewportHeight = innerHeight;
    boundsDirty = true;
    needsHitTest = true;
    wake();
  }, { passive: true });
  listen(finePointer, 'change', refreshAvailability);
  listen(reducedMotion, 'change', refreshAvailability);

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      refreshAvailability();
    },
    destroy() {
      destroyed = true;
      hide();
      cleanup.forEach(remove => remove());
      overlayObserver.disconnect();
      magnets.clear();
      cursor.remove();
    },
  };
}
