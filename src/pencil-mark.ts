import './pencil-mark.css';
import monogramArtwork from './assets/sg-monogram.svg?raw';

let markSequence = 0;

/** Two textured pencil gestures replace the header's typed initials. */
export function createPencilMark(initialMotion: boolean) {
  const wordmark = document.querySelector<HTMLAnchorElement>('.wordmark');
  const original = wordmark && [...wordmark.childNodes].find((node): node is Text =>
    node.nodeType === Node.TEXT_NODE && /^sg\.?$/i.test(node.textContent?.trim() ?? ''),
  );
  if (!wordmark || !original) return { setMotion(_enabled: boolean) {}, destroy() {} };

  const namespace = 'http://www.w3.org/2000/svg';
  const template = document.createElement('template');
  template.innerHTML = monogramArtwork;
  const svg = template.content.firstElementChild as unknown as SVGSVGElement;
  svg.classList.add('pencil-mark');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.removeAttribute('aria-label');
  svg.removeAttribute('role');
  const instance = ++markSequence;
  svg.querySelectorAll<SVGMaskElement>('mask[id]').forEach(mask => {
    const originalId = mask.id;
    mask.id = `${originalId}-${instance}`;
    svg.querySelectorAll(`[mask="url(#${originalId})"]`).forEach(element => element.setAttribute('mask', `url(#${mask.id})`));
  });
  const definitions = document.createElementNS(namespace, 'defs');
  const reveals = [...svg.querySelectorAll<SVGGElement>('.monogram-ink')].map((ink, index) => {
    const mask = document.createElementNS(namespace, 'mask');
    mask.id = `pencil-monogram-${instance}-${index}`;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', '136');
    mask.setAttribute('height', '96');
    const reveal = document.createElementNS(namespace, 'path');
    reveal.classList.add('pencil-mark-reveal');
    reveal.setAttribute('d', ink.dataset.drawing!);
    reveal.setAttribute('pathLength', '1');
    mask.append(reveal);
    definitions.append(mask);
    ink.setAttribute('mask', `url(#${mask.id})`);
    ink.removeAttribute('data-drawing');
    return reveal;
  });
  svg.prepend(definitions);
  original.replaceWith(svg);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let motion = initialMotion;
  let visible = true;
  let destroyed = false;
  let animations: Animation[] = [];
  const canDraw = () => motion && !reducedMotion.matches && finePointer.matches && !document.hidden && visible && !destroyed;

  function finish() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    reveals.forEach(reveal => { reveal.style.strokeDashoffset = '0'; });
  }

  function draw() {
    if (!canDraw() || animations.some(animation => animation.playState === 'running')) return;
    finish();
    animations = reveals.map((reveal, index) => reveal.animate([
      { strokeDashoffset: '1' },
      { strokeDashoffset: '0' },
    ], { duration: index === 0 ? 600 : 1100, delay: index * 380, fill: 'backwards', easing: 'cubic-bezier(.28,.08,.3,1)' }));
  }

  const onPointerEnter = (event: PointerEvent) => { if (event.pointerType === 'mouse') draw(); };
  const onFocus = () => { if (wordmark.matches(':focus-visible')) draw(); };
  const sync = () => { if (!canDraw()) finish(); };
  wordmark.addEventListener('pointerenter', onPointerEnter);
  wordmark.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (!visible) finish();
  });
  observer.observe(wordmark);
  draw();

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      sync();
    },
    destroy() {
      destroyed = true;
      finish();
      observer.disconnect();
      wordmark.removeEventListener('pointerenter', onPointerEnter);
      wordmark.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      finePointer.removeEventListener('change', sync);
      svg.replaceWith(original);
    },
  };
}
