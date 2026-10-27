import gsap from 'gsap';
import './product-showcase.css';

type Story = {
  element: HTMLElement;
  played: boolean;
  timeline?: gsap.core.Timeline;
  button?: HTMLButtonElement;
};

/** Finite product illustrations. These previews never run a bot or call a product API. */
export function createProductShowcase(initialMotion: boolean) {
  const root = document.querySelector<HTMLElement>('#work');
  if (!root) return { setMotion(_enabled: boolean) {}, destroy() {} };
  const abort = new AbortController();
  const { signal } = abort;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let motion = initialMotion;
  let disposed = false;
  const panelTweens = new Set<gsap.core.Tween>();
  const ribbon = root.querySelector<HTMLElement>('[data-integration-ribbon]');
  const pauseRibbon = root.querySelector<HTMLButtonElement>('[data-integration-pause]');
  const group = ribbon?.querySelector('.integration-group');
  const clone = group?.cloneNode(true) as HTMLElement | undefined;
  let ribbonVisible = false;
  let ribbonPaused = false;
  if (clone) {
    clone.classList.add('integration-clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('aria-label');
    clone.inert = true;
    group?.parentElement?.append(clone);
  }
  function updateRibbon() {
    if (ribbon) ribbon.dataset.running = String(motion && ribbonVisible && !ribbonPaused && !document.hidden && !disposed);
    if (!pauseRibbon) return;
    pauseRibbon.disabled = !motion;
    pauseRibbon.setAttribute('aria-pressed', String(ribbonPaused));
    pauseRibbon.setAttribute('aria-label', !motion ? 'Integration logo motion is off' : `${ribbonPaused ? 'Resume' : 'Pause'} integration logos`);
    const label = pauseRibbon.querySelector('span');
    if (label) label.textContent = !motion ? 'Motion off' : ribbonPaused ? 'Resume' : 'Pause';
  }
  const ribbonObserver = new IntersectionObserver(entries => {
    ribbonVisible = entries[0]?.isIntersecting ?? false;
    updateRibbon();
  }, { threshold: .1 });
  if (ribbon) ribbonObserver.observe(ribbon);
  pauseRibbon?.addEventListener('click', () => { ribbonPaused = !ribbonPaused; updateRibbon(); }, { signal });
  updateRibbon();
  const stories: Story[] = [...root.querySelectorAll<HTMLElement>('[data-product-story]')].map(element => ({
    element,
    played: false,
    button: root.querySelector<HTMLButtonElement>(`[data-story-replay="${element.dataset.productStory}"]`) ?? undefined,
  }));

  function clearStory(story: Story) {
    story.timeline?.kill();
    story.timeline = undefined;
    gsap.set(story.element.querySelectorAll('.story-layer'), { clearProps: 'transform,opacity' });
    gsap.set(story.element.querySelectorAll('.story-line'), { strokeDashoffset: 0 });
    gsap.set(story.element.querySelectorAll('.story-bar'), { clearProps: 'transform,opacity' });
    story.element.dataset.motionState = 'complete';
    story.button?.setAttribute('aria-busy', 'false');
  }

  function playStory(story: Story, requested = false) {
    clearStory(story);
    story.played = true;
    if (!motion || document.hidden || disposed) return;
    story.element.dataset.motionState = 'playing';
    story.button?.setAttribute('aria-busy', 'true');
    const visible = (selector: string) => [...story.element.querySelectorAll(selector)].filter(element => !element.closest('[hidden]'));
    const layers = visible('.story-layer');
    const lines = visible('.story-line');
    const bars = visible('.story-bar');
    if (requested) {
      const status = root!.querySelector('#showcase-status');
      if (status) status.textContent = '';
    }
    story.timeline = gsap.timeline({
      onComplete: () => {
        clearStory(story);
        if (requested) {
          const status = root!.querySelector('#showcase-status');
          if (status) status.textContent = `${story.element.dataset.storyLabel ?? 'Product'} illustration complete.`;
        }
      },
    });
    if (layers.length) story.timeline.fromTo(layers,
      { y: 26, opacity: 0, rotation: -2 },
      { y: 0, opacity: 1, rotation: 0, duration: .75, stagger: .12, ease: 'power3.out' }, 0);
    if (lines.length) story.timeline.fromTo(lines,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.15, stagger: .14, ease: 'power2.inOut' }, .25);
    if (bars.length) story.timeline.fromTo(bars,
      { scaleY: .08, transformOrigin: 'center bottom' },
      { scaleY: 1, duration: .65, stagger: .045, ease: 'power3.out', clearProps: 'transform' }, .4);
  }

  const storyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const story = stories.find(item => item.element === entry.target);
      if (!story) return;
      if (entry.isIntersecting && !story.played) playStory(story);
      else if (!entry.isIntersecting && story.timeline) clearStory(story);
    });
  }, { threshold: .18 });
  stories.forEach(story => {
    storyObserver.observe(story.element);
    story.button?.addEventListener('click', () => playStory(story, true), { signal });
  });

  // Artwork moves independently; tabs, links, and replay controls keep stable hit targets.
  const tiltStates = [...root.querySelectorAll<HTMLElement>('[data-showcase-tilt]')].map(surface => {
    const plane = surface.querySelector<HTMLElement>('.showcase-tilt-plane')!;
    let frame = 0;
    let x = 0;
    let y = 0;
    plane.style.setProperty('--tilt-x', '0deg');
    plane.style.setProperty('--tilt-y', '0deg');
    function reset(immediate = false) {
      cancelAnimationFrame(frame);
      frame = 0;
      surface.classList.remove('is-exploring');
      gsap.killTweensOf(plane);
      gsap.to(plane, { '--tilt-x': '0deg', '--tilt-y': '0deg', duration: immediate || !motion ? 0 : .45, ease: 'power3.out' });
    }
    surface.addEventListener('pointermove', event => {
      if (!motion || !finePointer.matches || event.pointerType !== 'mouse' || document.hidden) return;
      const box = surface.getBoundingClientRect();
      x = ((event.clientX - box.left) / box.width - .5) * 7;
      y = -((event.clientY - box.top) / box.height - .5) * 6;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!motion || disposed) return;
        surface.classList.add('is-exploring');
        gsap.to(plane, { '--tilt-x': `${y}deg`, '--tilt-y': `${x}deg`, duration: .35, ease: 'power2.out', overwrite: true });
      });
    }, { signal });
    surface.addEventListener('pointerleave', () => reset(), { signal });
    finePointer.addEventListener('change', () => reset(true), { signal });
    return { plane, reset };
  });

  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-morrow-view]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-morrow-panel]')];
  function selectView(tab: HTMLButtonElement, focus = false) {
    const view = tab.dataset.morrowView;
    const story = stories.find(item => item.element.dataset.productStory === 'morrow');
    if (story) clearStory(story);
    panelTweens.forEach(tween => tween.kill());
    panelTweens.clear();
    panels.forEach(panel => {
      panel.hidden = panel.dataset.morrowPanel !== view;
      gsap.set(panel, { clearProps: 'transform,opacity' });
      if (!panel.hidden && motion) {
        const tween = gsap.fromTo(panel, { opacity: .35, y: 10 }, { opacity: 1, y: 0, duration: .32, ease: 'power2.out', clearProps: 'transform,opacity' });
        panelTweens.add(tween);
      }
    });
    tabs.forEach(button => {
      const active = button === tab;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    root!.querySelectorAll<HTMLElement>('[data-morrow-nav]').forEach(item => item.classList.toggle('active', item.dataset.morrowNav === view));
    const location = root!.querySelector('[data-morrow-location]');
    if (location) location.textContent = tab.textContent;
    const feature = root!.querySelector<HTMLElement>('#morrow');
    if (feature) feature.dataset.view = view;
    if (focus) tab.focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectView(tab), { signal });
    tab.addEventListener('keydown', event => {
      const keys: Record<string, number> = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      selectView(tabs[keys[event.key]], true);
    }, { signal });
  });

  const agents = [...root.querySelectorAll<HTMLButtonElement>('[data-preview-agent]')];
  agents.forEach(button => button.addEventListener('click', () => {
    agents.forEach(agent => agent.setAttribute('aria-pressed', String(agent === button)));
    const detail = root!.querySelector('#morrow-agent-detail');
    if (detail) detail.textContent = button.dataset.agentDescription ?? '';
  }, { signal }));

  document.addEventListener('visibilitychange', () => {
    updateRibbon();
    if (!document.hidden) return;
    stories.forEach(clearStory);
    tiltStates.forEach(state => state.reset(true));
    panelTweens.forEach(tween => tween.progress(1));
  }, { signal });

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      updateRibbon();
      if (enabled) return;
      stories.forEach(clearStory);
      tiltStates.forEach(state => state.reset(true));
      panelTweens.forEach(tween => tween.progress(1));
      panels.forEach(panel => gsap.set(panel, { clearProps: 'transform,opacity' }));
    },
    destroy() {
      disposed = true;
      abort.abort();
      ribbonObserver.disconnect();
      clone?.remove();
      updateRibbon();
      storyObserver.disconnect();
      stories.forEach(clearStory);
      tiltStates.forEach(state => { state.reset(true); gsap.killTweensOf(state.plane); });
      panelTweens.forEach(tween => tween.kill());
    },
  };
}
