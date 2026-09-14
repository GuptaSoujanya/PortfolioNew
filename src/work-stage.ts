import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './work-stage.css';

gsap.registerPlugin(ScrollTrigger);

const worlds = [
  { name: 'THE SIGNAL ROOM', word: 'SIGNAL', detail: 'MANY AGENTS. ONE CLEAR IDEA.', kind: 'signal' },
  { name: 'THE POSSIBILITY CLUB', word: 'GROW', detail: 'SMALL STEPS. BIG POSSIBILITIES.', kind: 'growth' },
  { name: 'THE INTERFACE LAB', word: 'FEEL', detail: 'A DIFFERENT KIND OF CONVERSATION.', kind: 'portal' },
];

/** Art direction and motion for the three working project previews. */
export function createWorkStage(initialMotion: boolean) {
  const work = document.querySelector<HTMLElement>('#work');
  if (!work) return { setMotion(_enabled: boolean) {}, destroy() {} };

  let motion = initialMotion;
  let context: gsap.Context | undefined;
  const cleanups: (() => void)[] = [];
  const inserted: HTMLElement[] = [];
  const surfaces: HTMLElement[] = [];
  const cards = [...work.querySelectorAll<HTMLElement>('.case-study')];
  work.classList.add('work-stage');

  function appendMarkup(parent: Element, html: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const nodes = [...template.content.children] as HTMLElement[];
    parent.append(template.content);
    inserted.push(...nodes);
    return nodes;
  }

  cards.forEach((card, index) => {
    const scene = card.querySelector<HTMLElement>('.case-scene');
    if (!scene) return;
    const world = worlds[index];
    const surface = document.createElement('div');
    surface.className = 'work-surface';
    // Only artwork tilts. Demo controls keep stationary, dependable hit targets.
    // Keeping them outside the 3D context also preserves foreground paint order.
    const artwork = scene.querySelectorAll(':scope > .scene-grid, :scope > .scene-orbit, :scope > .pipeline-machine, :scope > .learning-sun, :scope > .learning-note, :scope > .interface-halo, :scope > .interface-window');
    surface.append(...artwork);
    scene.prepend(surface);
    surfaces.push(surface);

    appendMarkup(scene, `
      <div class="work-world work-world-${world.kind}" aria-hidden="true">
        <div class="work-world-word">${world.word}</div>
        <div class="work-world-form"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="work-world-cross">+</span>
      </div>
      <span class="work-scene-index" aria-hidden="true">0${index + 1}</span>
      <div class="work-scene-tab" aria-hidden="true"><i></i><span>${world.name}</span></div>
      <span class="work-scene-spine" aria-hidden="true">${world.detail}</span>
    `);

    appendMarkup(card, '<div class="work-read-progress" aria-hidden="true"><i></i></div>');

    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    function move(event: PointerEvent) {
      if (!motion || event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const rect = scene!.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!motion) return;
        gsap.to(surface, { rotationY: pointerX * 7, rotationX: -pointerY * 6, x: pointerX * 9, y: pointerY * 6, duration: .65, ease: 'power3.out', overwrite: true });
      });
    }
    function reset() {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      gsap.to(surface, { rotationY: 0, rotationX: 0, x: 0, y: 0, duration: motion ? .8 : 0, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
    }
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', reset);
    cleanups.push(() => {
      cancelAnimationFrame(pointerFrame);
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerleave', reset);
    });
  });

  function animate() {
    context?.revert();
    context = undefined;
    if (!motion) return;
    context = gsap.context(() => {
      cards.forEach((card, index) => {
        const scene = card.querySelector('.case-scene');
        // The project action stays still while surrounding copy enters.
        gsap.from(card.querySelectorAll('.case-wordmark, .case-copy h3, .case-copy > p'), {
          y: 35, opacity: .1, stagger: .07, duration: 1.05, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 83%', once: true },
        });
        gsap.fromTo(card.querySelector('.work-world-word'), { xPercent: index === 1 ? 6 : -7 }, {
          xPercent: index === 1 ? -6 : 7, ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        });
        gsap.fromTo(card.querySelector('.work-world-form'), { rotation: index === 1 ? -12 : -20, y: 18 }, {
          rotation: index === 1 ? 14 : 25, y: -24, ease: 'none',
          scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        });
        gsap.fromTo(card.querySelector('.work-read-progress i'), { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 80%', end: 'bottom 35%', scrub: .4 },
        });
      });
    }, work!);
  }

  animate();

  return {
    setMotion(enabled: boolean) {
      if (enabled === motion) return;
      motion = enabled;
      animate();
      if (!enabled) {
        gsap.killTweensOf(surfaces);
        gsap.set(surfaces, { clearProps: 'transform' });
      }
    },
    destroy() {
      context?.revert();
      cleanups.forEach(cleanup => cleanup());
      gsap.killTweensOf(surfaces);
      inserted.forEach(element => element.remove());
      surfaces.forEach(surface => surface.replaceWith(...surface.childNodes));
      work!.classList.remove('work-stage');
    },
  };
}
