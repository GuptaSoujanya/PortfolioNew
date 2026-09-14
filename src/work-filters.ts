import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './work-filters.css';

gsap.registerPlugin(ScrollTrigger);

const cardProperties = ['--filter-opacity', '--filter-shift'];
const sceneProperties = ['--filter-scene-opacity', '--filter-scene-shift', '--filter-scene-scale', '--filter-scene-mask'];

/** A short scene change between project collections, independent of scroll art. */
export function createWorkFilters(initialMotion: boolean) {
  const work = document.querySelector<HTMLElement>('#work');
  const controls = work?.querySelector<HTMLElement>('.work-filters');
  const collection = work?.querySelector<HTMLElement>('.case-collection');
  const status = work?.querySelector<HTMLElement>('#filter-status');
  if (!work || !controls || !collection) return { setMotion(_enabled: boolean) {}, destroy() {} };

  const buttons = [...controls.querySelectorAll<HTMLButtonElement>('.filter')];
  const cards = [...collection.querySelectorAll<HTMLElement>('.project-card')];
  const scenes = cards.map(card => card.querySelector<HTMLElement>('.case-scene')).filter((scene): scene is HTMLElement => Boolean(scene));
  const original = {
    busy: collection.getAttribute('aria-busy'),
    status: status?.textContent ?? '',
    cards: cards.map(card => ({ card, hidden: card.hidden, inert: card.inert })),
    buttons: buttons.map(button => ({ button, active: button.classList.contains('active'), pressed: button.getAttribute('aria-pressed') })),
  };
  const indicator = document.createElement('span');
  indicator.className = 'work-filter-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  controls.prepend(indicator);
  work.classList.add('work-filter-stage');
  work.dataset.filterState = 'idle';
  collection.setAttribute('aria-busy', 'false');

  let selected = buttons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.filter ?? 'all';
  let motion = initialMotion;
  let destroyed = false;
  let revision = 0;
  let timeline: gsap.core.Timeline | undefined;
  let indicatorTween: gsap.core.Tween | undefined;
  const cleanups: Array<() => void> = [];

  function listen(target: EventTarget, event: string, callback: EventListener) {
    target.addEventListener(event, callback);
    cleanups.push(() => target.removeEventListener(event, callback));
  }

  function matches(card: HTMLElement) {
    return selected === 'all' || (card.dataset.category ?? '').split(/\s+/).includes(selected);
  }

  function clearArtwork() {
    cards.forEach(card => cardProperties.forEach(property => card.style.removeProperty(property)));
    scenes.forEach(scene => sceneProperties.forEach(property => scene.style.removeProperty(property)));
  }

  function moveIndicator(animate: boolean) {
    if (destroyed) return;
    const button = buttons.find(button => button.dataset.filter === selected);
    if (!button) return;
    indicatorTween?.kill();
    const position = {
      x: button.offsetLeft + 14,
      y: button.offsetTop + button.offsetHeight - 3,
      width: Math.max(12, button.offsetWidth - 28),
    };
    if (animate && motion && !document.hidden) {
      indicatorTween = gsap.to(indicator, { ...position, duration: .46, ease: 'power3.out' });
    } else gsap.set(indicator, position);
  }

  function applyVisibility() {
    let count = 0;
    original.cards.forEach(({ card, inert }) => {
      card.hidden = !matches(card);
      card.inert = inert;
      if (!card.hidden) count++;
    });
    if (status) status.textContent = `${count} projects shown.`;
  }

  function settle() {
    revision++;
    timeline?.kill();
    timeline = undefined;
    clearArtwork();
    applyVisibility();
    collection!.setAttribute('aria-busy', 'false');
    work!.dataset.filterState = 'idle';
    moveIndicator(false);
    ScrollTrigger.refresh();
  }

  function select(button: HTMLButtonElement) {
    if (destroyed) return;
    const filter = button.dataset.filter;
    if (!filter || (filter === selected && timeline)) return;
    selected = filter;
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    moveIndicator(true);

    // A filter activated while focus is inside a project must retain a useful
    // focus destination when that project's subtree becomes unavailable.
    if (cards.some(card => card.contains(document.activeElement))) button.focus({ preventScroll: true });
    if (!motion || document.hidden) { settle(); return; }

    const current = ++revision;
    timeline?.kill();
    const outgoing = cards.filter(card => !card.hidden);
    const incoming = cards.filter(matches);
    const incomingScenes = incoming.map(card => card.querySelector<HTMLElement>('.case-scene')).filter((scene): scene is HTMLElement => Boolean(scene));
    const swapAt = outgoing.length ? .17 : 0;
    collection!.setAttribute('aria-busy', 'true');
    work!.dataset.filterState = 'leaving';
    outgoing.forEach(card => {
      card.inert = true;
      // A CSS var's fallback is not its computed custom-property value. Seed
      // first use so GSAP fades from the visible opacity instead of empty/zero.
      if (!card.style.getPropertyValue('--filter-opacity')) card.style.setProperty('--filter-opacity', '1');
      if (!card.style.getPropertyValue('--filter-shift')) card.style.setProperty('--filter-shift', '0px');
    });

    timeline = gsap.timeline({
      onComplete: () => {
        if (destroyed || current !== revision) return;
        timeline = undefined;
        clearArtwork();
        applyVisibility();
        collection!.setAttribute('aria-busy', 'false');
        work!.dataset.filterState = 'idle';
        ScrollTrigger.refresh();
      },
    });
    if (outgoing.length) {
      timeline.to(outgoing, {
        '--filter-opacity': 0, '--filter-shift': '-12px',
        duration: .15, stagger: .01, ease: 'power2.in',
      }, 0);
    }
    timeline.add(() => {
      if (destroyed || current !== revision) return;
      clearArtwork();
      applyVisibility();
      // Measure final document positions before transient entrance offsets are
      // applied, so each existing scroll illustration retains correct triggers.
      ScrollTrigger.refresh();
      work!.dataset.filterState = 'entering';
      incoming.forEach(card => { card.inert = true; });
      gsap.set(incoming, { '--filter-opacity': 0, '--filter-shift': '30px' });
      gsap.set(incomingScenes, {
        '--filter-scene-opacity': .3, '--filter-scene-shift': '22px',
        '--filter-scene-scale': .982, '--filter-scene-mask': '7%',
      });
    }, swapAt);
    timeline.to(incoming, {
      '--filter-opacity': 1, '--filter-shift': '0px',
      duration: .54, stagger: .065, ease: 'power3.out',
    }, swapAt);
    timeline.to(incomingScenes, {
      '--filter-scene-opacity': 1, '--filter-scene-shift': '0px',
      '--filter-scene-scale': 1, '--filter-scene-mask': '0%',
      duration: .66, stagger: .065, ease: 'power3.out',
    }, swapAt + .045);
  }

  buttons.forEach(button => listen(button, 'click', () => select(button)));
  listen(document, 'visibilitychange', () => { if (document.hidden && timeline) settle(); });
  listen(window, 'blur', () => { if (timeline) settle(); });

  const observer = new ResizeObserver(() => {
    // Resizing can change wrapping and every card's layout at once. Finish the
    // current selection instead of leaving artwork partway through a reveal.
    if (timeline) settle();
    else moveIndicator(false);
  });
  observer.observe(controls);
  buttons.forEach(button => observer.observe(button));
  moveIndicator(false);

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      if (!enabled) settle();
    },
    destroy() {
      destroyed = true;
      revision++;
      timeline?.kill();
      indicatorTween?.kill();
      observer.disconnect();
      cleanups.forEach(cleanup => cleanup());
      clearArtwork();
      original.cards.forEach(({ card, hidden, inert }) => { card.hidden = hidden; card.inert = inert; });
      original.buttons.forEach(({ button, active, pressed }) => {
        button.classList.toggle('active', active);
        if (pressed === null) button.removeAttribute('aria-pressed');
        else button.setAttribute('aria-pressed', pressed);
      });
      if (status) status.textContent = original.status;
      if (original.busy === null) collection.removeAttribute('aria-busy');
      else collection.setAttribute('aria-busy', original.busy);
      indicator.remove();
      work.classList.remove('work-filter-stage');
      delete work.dataset.filterState;
    },
  };
}
