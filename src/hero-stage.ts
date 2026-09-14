import './hero-stage.css';

/** Chapter navigation stays independent of the hero's optional experiments. */
export function createHeroStage(initialMotion: boolean) {
  const hero = document.querySelector<HTMLElement>('#home')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let requestedMotion = initialMotion;
  let destroyed = false;

  const nav = document.createElement('nav');
  nav.className = 'chapter-nav';
  nav.setAttribute('aria-label', 'Explore chapters');
  nav.setAttribute('aria-hidden', 'true');
  nav.inert = true;

  const chapters = [
    ['work', 'Selected work'], ['about', 'The human'], ['play', 'The playground'],
    ['experience', 'The journey'], ['contact', 'Contact'],
  ];
  const links = chapters.map(([id, label], index) => {
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = `0${index + 1}`;
    link.setAttribute('aria-label', label);
    link.title = label;
    nav.append(link);
    return link;
  });
  document.body.append(nav);

  const chapterObserver = new IntersectionObserver(entries => {
    if (destroyed) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-10% 0px -50% 0px' });
  chapters.forEach(([id]) => {
    const section = document.getElementById(id);
    if (section) chapterObserver.observe(section);
  });

  const heroObserver = new IntersectionObserver(entries => {
    if (destroyed) return;
    const entry = entries[0];
    const visible = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
    nav.classList.toggle('is-visible', visible);
    nav.inert = !visible;
    nav.setAttribute('aria-hidden', String(!visible));
  });
  heroObserver.observe(hero);

  function setMotion(enabled: boolean) {
    if (destroyed) return;
    requestedMotion = enabled;
    // Navigation has only a CSS entrance; no scene animation or frame loop.
    if (enabled && !reducedMotion.matches) nav.style.removeProperty('transition');
    else nav.style.transition = 'none';
  }
  const onReducedMotion = () => setMotion(requestedMotion);
  reducedMotion.addEventListener('change', onReducedMotion);
  setMotion(initialMotion);

  return {
    setMotion,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      chapterObserver.disconnect();
      heroObserver.disconnect();
      reducedMotion.removeEventListener('change', onReducedMotion);
      nav.remove();
    },
  };
}
