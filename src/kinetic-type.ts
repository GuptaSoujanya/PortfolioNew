import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './kinetic-type.css';

gsap.registerPlugin(ScrollTrigger);

type TextStyle = 'hero' | 'script' | 'editorial' | 'human' | 'play' | 'contact';
type TextScene = {
  element: HTMLElement;
  units: HTMLElement[];
  style: TextStyle;
  revealed: boolean;
  entering: boolean;
  order: number;
  entrance?: gsap.core.Tween;
  trigger?: ScrollTrigger;
};

/** Intact words reveal in sequence while their original text remains accessible. */
export function createKineticType(initialMotion: boolean) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups: (() => void)[] = [];
  const replacements: { original: Text; wrapper: HTMLElement }[] = [];
  const scenes: TextScene[] = [];
  const navLinks: HTMLElement[] = [];
  const replayControls = [...document.querySelectorAll<HTMLElement>('[data-replay-type]')];
  const replayAttributes = replayControls.map(element => ({ element, busy: element.getAttribute('aria-busy'), disabled: element.getAttribute('aria-disabled') }));
  let requestedMotion = initialMotion;
  let motion = initialMotion && !reducedMotion.matches;
  let destroyed = false;

  function updateReplayState() {
    const busy = scenes.some(scene => (scene.style === 'hero' || scene.style === 'script') && scene.entering);
    replayControls.forEach(control => {
      control.setAttribute('aria-busy', String(busy));
      control.setAttribute('aria-disabled', String(!motion));
    });
  }

  function listen(target: EventTarget, name: string, callback: EventListener) {
    target.addEventListener(name, callback);
    cleanups.push(() => target.removeEventListener(name, callback));
  }

  function splitText(element: HTMLElement) {
    const units: HTMLElement[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.textContent?.trim() && !node.parentElement?.closest('sup, [aria-hidden="true"], .kinetic-run')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    nodes.forEach(original => {
      const wrapper = document.createElement('span');
      wrapper.className = 'kinetic-run';
      // Assistive technology receives each original phrase once, without having
      // to reconstruct individual letters. The actual <em> and <br> stay in place.
      const accessible = document.createElement('span');
      accessible.className = 'kinetic-accessible';
      accessible.textContent = original.data;
      const visual = document.createElement('span');
      visual.className = 'kinetic-visual';
      visual.setAttribute('aria-hidden', 'true');
      const isScript = Boolean(original.parentElement?.closest('em, .hero-script'));

      original.data.split(/(\s+)/).forEach(part => {
        if (!part.trim()) {
          visual.append(document.createTextNode(part));
          return;
        }
        const word = document.createElement('span');
        word.className = 'kinetic-word';
        // All styles keep words intact, preserving their spacing and kerning.
        const unit = document.createElement('span');
        unit.className = `kinetic-unit${isScript ? ' kinetic-script-unit' : ''}`;
        unit.textContent = part;
        word.append(unit);
        units.push(unit);
        visual.append(word);
      });

      wrapper.append(accessible, visual);
      original.replaceWith(wrapper);
      replacements.push({ original, wrapper });
    });
    return units;
  }

  const targets: [string, TextStyle][] = [
    ['.hero-display-line > span', 'hero'],
    ['.hero-script', 'script'],
    ['#work-title, .case-copy h3', 'editorial'],
    ['#about-title', 'human'],
    ['#experience-title', 'editorial'],
    ['#play-title', 'play'],
    ['#contact-title', 'contact'],
  ];

  targets.forEach(([selector, style]) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element, order) => {
      const units = splitText(element);
      if (!units.length) return;
      element.classList.add('kinetic-type');
      const scene: TextScene = { element, units, style, revealed: false, entering: false, order };
      scenes.push(scene);
    });
  });

  // Roll only the label text. Link destinations, superscripts, hit areas, and
  // keyboard semantics remain on the original navigation element.
  document.querySelectorAll<HTMLElement>('.desktop-nav a, .contact-nav, .mobile-nav a').forEach(link => {
    const text = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) as Text | undefined;
    if (!text) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'kinetic-nav-window';
    const current = document.createElement('span');
    current.className = 'kinetic-nav-label';
    current.setAttribute('aria-hidden', 'true');
    current.textContent = text.data;
    const next = current.cloneNode(true) as HTMLElement;
    next.className = 'kinetic-nav-next';
    next.setAttribute('aria-hidden', 'true');
    const accessible = document.createElement('span');
    accessible.className = 'kinetic-accessible';
    accessible.textContent = text.data;
    wrapper.append(accessible, current, next);
    text.replaceWith(wrapper);
    replacements.push({ original: text, wrapper });
    link.classList.add('kinetic-nav');
    navLinks.push(link);
  });

  function reveal(scene: TextScene, replay = false) {
    if (!motion || document.hidden || (scene.revealed && !replay) || destroyed) return;
    scene.entrance?.kill();
    gsap.killTweensOf(scene.units);
    gsap.set(scene.units, { clearProps: 'transform,opacity,color,clipPath' });
    scene.revealed = true;
    scene.entering = true;
    scene.element.classList.add('kinetic-entering');
    updateReplayState();
    scene.entrance = gsap.fromTo(scene.units, {
      y: scene.style === 'script' ? 28 : 36,
      rotationX: scene.style === 'script' ? -8 : -16,
      opacity: 0,
    }, {
      y: 0, rotationX: 0, opacity: 1,
      duration: scene.style === 'hero' ? .88 : .82,
      delay: scene.style === 'hero' ? Math.min(scene.order * .13, .26) : scene.style === 'script' ? .24 : 0,
      stagger: { amount: Math.min(.24, Math.max(0, scene.units.length - 1) * .055), from: 'start' },
      ease: 'power3.out', overwrite: true,
      clearProps: 'transform,opacity,clipPath',
      onComplete: () => {
        scene.entering = false;
        scene.element.classList.remove('kinetic-entering');
        updateReplayState();
      },
    });
  }

  function configureMotion() {
    motion = requestedMotion && !reducedMotion.matches;
    scenes.forEach(scene => {
      scene.trigger?.kill();
      scene.trigger = undefined;
      scene.entrance?.kill();
      scene.entering = false;
      scene.element.classList.remove('kinetic-entering');
      scene.element.classList.toggle('kinetic-motion', motion);
      gsap.killTweensOf(scene.units);
      gsap.set(scene.units, { clearProps: 'transform,opacity,color,clipPath' });
      if (!motion || scene.revealed) return;
      const rect = scene.element.getBoundingClientRect();
      if (rect.bottom <= 0) {
        scene.revealed = true;
      } else if (rect.top < innerHeight * .92) {
        reveal(scene);
      } else {
        // Start motion on entry; never leave offscreen text pre-hidden while
        // fonts load, the user jumps chapters, or a project filter changes.
        scene.trigger = ScrollTrigger.create({
          trigger: scene.element,
          start: 'top 92%',
          once: true,
          onEnter: () => reveal(scene),
        });
      }
    });
    navLinks.forEach(link => link.classList.toggle('kinetic-motion', motion));
    updateReplayState();
  }

  replayControls.forEach(control => {
    listen(control, 'click', () => {
      const heroScenes = scenes.filter(scene => scene.style === 'hero' || scene.style === 'script');
      if (!motion || destroyed || heroScenes.some(scene => scene.entering)) return;
      heroScenes.forEach(scene => reveal(scene, true));
    });
  });

  listen(reducedMotion, 'change', configureMotion);
  listen(document, 'visibilitychange', () => {
    if (!document.hidden) { configureMotion(); return; }
    scenes.forEach(scene => {
      scene.entrance?.progress(1);
      gsap.killTweensOf(scene.units);
      gsap.set(scene.units, { clearProps: 'transform,opacity,color,clipPath' });
    });
  });

  // A quick chapter jump should leave already-entering text settled, with no
  // offscreen tweens left running behind the section the visitor is reading.
  const sceneByElement = new Map(scenes.map(scene => [scene.element, scene]));
  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const scene = sceneByElement.get(entry.target as HTMLElement);
      if (scene?.entering && !entry.isIntersecting) scene.entrance?.progress(1);
    });
  });
  scenes.forEach(scene => visibilityObserver.observe(scene.element));
  configureMotion();

  return {
    setMotion(enabled: boolean) {
      if (destroyed) return;
      requestedMotion = enabled;
      configureMotion();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      visibilityObserver.disconnect();
      cleanups.forEach(cleanup => cleanup());
      scenes.forEach(scene => {
        scene.trigger?.kill();
        scene.entrance?.kill();
        gsap.killTweensOf(scene.units);
        scene.element.classList.remove('kinetic-type', 'kinetic-motion', 'kinetic-entering');
      });
      navLinks.forEach(link => link.classList.remove('kinetic-nav', 'kinetic-motion'));
      replayAttributes.forEach(({ element, busy, disabled }) => {
        if (busy === null) element.removeAttribute('aria-busy'); else element.setAttribute('aria-busy', busy);
        if (disabled === null) element.removeAttribute('aria-disabled'); else element.setAttribute('aria-disabled', disabled);
      });
      replacements.forEach(({ original, wrapper }) => wrapper.replaceWith(original));
    },
  };
}
