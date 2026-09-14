import './editorial-graphics.css';

const round = (value: number) => value.toFixed(2);

/** Authored, gently sheared contours; these are an illustration, not biometric data. */
function identityContours() {
  return Array.from({ length: 25 }, (_, index) => {
    const radius = 128 - index * 3.45;
    const points = Array.from({ length: 120 }, (_, sample) => {
      const angle = sample / 120 * Math.PI * 2;
      const distortion = 1 + .085 * Math.sin(angle * 2 + radius * .009) + .035 * Math.cos(angle * 3 - .7);
      const x = 151 + Math.cos(angle) * radius * distortion + Math.sin(angle * 2) * 6;
      const y = 128 + Math.sin(angle) * radius * .85 * distortion + Math.cos(angle * 2) * 8;
      return `${sample ? 'L' : 'M'}${round(x)},${round(y)}`;
    }).join('');
    return `<path d="${points}Z" pathLength="1" style="--contour-index:${index}" />`;
  }).join('');
}

export function createEditorialGraphics(initialMotion: boolean) {
  let motion = initialMotion;
  let frame = 0;
  let destroyed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const identity = document.querySelector<SVGSVGElement>('.identity-lines');
  const originalIdentity = identity?.innerHTML;
  const visible = new Set<Element>();

  if (identity) {
    identity.classList.add('identity-contours');
    identity.innerHTML = `<g class="identity-contour-field">${identityContours()}</g>`;
  }
  const artwork = identity ? [identity] : [];
  const enabled = () => motion && !reducedMotion.matches && !document.hidden;

  function render() {
    frame = 0;
    if (!enabled() || destroyed) return;
    const viewport = window.innerHeight;
    artwork.forEach(element => {
      if (!visible.has(element)) return;
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (viewport - bounds.top) / (viewport + bounds.height)));
      // Geometry stays static: only the artwork's wrapper moves when scrolling.
      element.style.setProperty('--graphic-travel', `${round((progress - .5) * 14)}px`);
      element.style.setProperty('--graphic-turn', `${round((progress - .5) * 5)}deg`);
    });
  }

  function schedule() {
    if (!enabled() || !visible.size || frame || destroyed) return;
    frame = requestAnimationFrame(render);
  }

  function syncMotion() {
    const active = enabled();
    artwork.forEach(element => {
      element.classList.toggle('graphic-motion', active);
      if (!active) {
        element.style.removeProperty('--graphic-travel');
        element.style.removeProperty('--graphic-turn');
      }
    });
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
      entry.target.classList.toggle('graphic-in-view', entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add('graphic-revealed');
    });
    schedule();
  }, { threshold: .08 });
  artwork.forEach(element => observer.observe(element));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      syncMotion();
    },
    destroy() {
      destroyed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', syncMotion);
      reducedMotion.removeEventListener('change', syncMotion);
      if (identity) {
        identity.innerHTML = originalIdentity ?? '';
        identity.classList.remove('identity-contours', 'graphic-motion', 'graphic-in-view', 'graphic-revealed');
        identity.style.removeProperty('--graphic-travel');
        identity.style.removeProperty('--graphic-turn');
      }
    },
  };
}
