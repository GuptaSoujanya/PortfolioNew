import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './career-stage.css';

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  { company: 'Ethara AI', word: 'connect.', kicker: 'INTELLIGENT SYSTEMS', thread: 'A good system is more than\nthe sum of its parts.', formula: 'IDEAS → SYSTEMS → POSSIBILITIES' },
  { company: 'Green Rider Technology', word: 'scale.', kicker: 'STRONG FOUNDATIONS', thread: 'Build with care.\nMake room for what comes next.', formula: 'STRUCTURE → CRAFT → SCALE' },
  { company: 'CodeAlpha', word: 'make.', kicker: 'LEARNING BY DOING', thread: 'Every small interaction\nis a chance to make things better.', formula: 'CURIOSITY → PRACTICE → PROGRESS' },
  { company: 'Robrotronix India', word: 'begin.', kicker: 'THE FIRST SPARK', thread: 'The best way to understand it?\nMake something with it.', formula: 'QUESTION → EXPERIMENT → DISCOVERY' },
];

function artwork(index: number) {
  let shapes = '';
  if (index === 0) {
    shapes = Array.from({ length: 16 }, (_, i) => `<ellipse cx="240" cy="240" rx="165" ry="68" transform="rotate(${i * 11.25} 240 240)"/>`).join('');
    shapes += '<circle cx="240" cy="240" r="18" class="career-core"/><circle cx="240" cy="75" r="6" class="career-satellite"/>';
  } else if (index === 1) {
    shapes = Array.from({ length: 13 }, (_, i) => `<rect x="${85 + i * 7}" y="${85 + i * 7}" width="${310 - i * 14}" height="${310 - i * 14}" rx="3" transform="rotate(${i * 5 - 30} 240 240)"/>`).join('');
    shapes += '<path d="M60 240h360M240 60v360" stroke-dasharray="2 9"/>';
  } else if (index === 2) {
    shapes = Array.from({ length: 14 }, (_, i) => `<ellipse cx="240" cy="240" rx="${165 - i * 8}" ry="${165 - i * 3}" transform="rotate(${i * 9} 240 240)"/>`).join('');
    shapes += '<path d="m166 218-24 22 24 22m148-44 24 22-24 22m-60-42-27 84" stroke-width="4"/>';
  } else {
    shapes = Array.from({ length: 24 }, (_, i) => `<path d="M240 75v105m0-83 12 12-12 12" transform="rotate(${i * 15} 240 240)"/>`).join('');
    shapes += '<circle cx="240" cy="240" r="52"/><circle cx="240" cy="240" r="39"/><path d="m247 215-23 30h19l-10 23 30-35h-20z" class="career-core"/>';
  }
  return `<svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg"><g class="career-geometry">${shapes}</g></svg>`;
}

export function createCareerStage(initialMotion: boolean) {
  const section = document.querySelector<HTMLElement>('#experience')!;
  const roles = [...section.querySelectorAll<HTMLDetailsElement>('.career-role')];
  const buttons = [...section.querySelectorAll<HTMLButtonElement>('.career-chapter-button')];
  const art = section.querySelector<HTMLElement>('.career-artwork')!;
  const artSurface = section.querySelector<HTMLElement>('.career-art')!;
  const word = section.querySelector<HTMLElement>('.career-art-word')!;
  const takeaway = section.querySelector<HTMLElement>('.career-takeaway')!;
  let motion = initialMotion;
  let active = 0;
  let context: gsap.Context | undefined;
  let swap: gsap.core.Timeline | undefined;
  let detailTween: gsap.core.Tween | undefined;
  let pointerTween: gsap.core.Tween | undefined;
  let refreshFrame = 0;
  const cleanups: (() => void)[] = [];

  function listen(target: EventTarget, event: string, listener: EventListener) {
    target.addEventListener(event, listener);
    cleanups.push(() => target.removeEventListener(event, listener));
  }

  function refresh() {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function renderChapter(index: number, animate: boolean) {
    const chapter = chapters[index];
    section.dataset.career = String(index);
    section.querySelector('.career-figure-number')!.textContent = String(index + 1).padStart(2, '0');
    section.querySelector('.career-ghost-number')!.textContent = String(index + 1).padStart(2, '0');
    section.querySelector('.career-art-kicker')!.textContent = chapter.kicker;
    section.querySelector('.career-art-bottom > span')!.textContent = chapter.formula;
    art.innerHTML = artwork(index);
    word.textContent = chapter.word;
    takeaway.textContent = chapter.thread;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
    swap?.kill();
    if (motion && animate) {
      swap = gsap.timeline()
        .fromTo(art, { opacity: 0, scale: .76, rotation: -14 }, { opacity: 1, scale: 1, rotation: 0, duration: .85, ease: 'power3.out', clearProps: 'transform,opacity' })
        .fromTo(word, { yPercent: 65, opacity: 0, rotation: 5 }, { yPercent: 0, opacity: 1, rotation: 0, duration: .65, ease: 'power3.out', clearProps: 'transform,opacity' }, .06)
        .fromTo(takeaway, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, clearProps: 'transform,opacity' }, .12);
    } else gsap.set([art, word, takeaway], { clearProps: 'transform,opacity' });
  }

  function select(index: number, announce = true) {
    const changed = index !== active;
    active = index;
    roles.forEach((role, i) => { role.open = i === index; });
    if (changed) renderChapter(index, true);
    if (announce) section.querySelector('.career-live')!.textContent = `Chapter ${index + 1} of 4: ${chapters[index].company}.`;
    refresh();
  }

  buttons.forEach((button, index) => {
    listen(button, 'click', () => select(index));
    listen(button, 'keydown', ((event: KeyboardEvent) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus({ preventScroll: true });
      select(next);
    }) as EventListener);
  });

  roles.forEach((role, index) => {
    listen(role, 'toggle', () => {
      if (role.open) {
        if (active !== index) select(index);
        detailTween?.kill();
        if (motion) detailTween = gsap.fromTo(role.querySelectorAll('.experience-detail > *'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, stagger: .055, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
      refresh();
    });
  });
  listen(section.querySelector('.career-next')!, 'click', () => select((active + 1) % chapters.length));

  listen(artSurface, 'pointermove', ((event: PointerEvent) => {
    if (!motion || event.pointerType !== 'mouse') return;
    const rect = artSurface.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    pointerTween?.kill();
    pointerTween = gsap.to(artSurface.querySelector('svg'), { x: x * 18, y: y * 18, rotationY: x * 16, rotationX: -y * 16, duration: .7, ease: 'power2.out', overwrite: true });
  }) as EventListener);
  listen(artSurface, 'pointerleave', () => {
    pointerTween?.kill();
    if (motion) pointerTween = gsap.to(artSurface.querySelector('svg'), { x: 0, y: 0, rotationY: 0, rotationX: 0, duration: .8, ease: 'power3.out', clearProps: 'transform' });
  });

  function setupMotion() {
    context?.revert();
    context = undefined;
    swap?.kill();
    detailTween?.kill();
    pointerTween?.kill();
    gsap.set([art, word, takeaway, ...section.querySelectorAll('.experience-detail > *, .career-artwork svg')], { clearProps: 'transform,opacity' });
    if (!motion) return;
    context = gsap.context(() => {
      gsap.from('.career-chapter-button', { opacity: 0, y: 20, stagger: .07, duration: .6, ease: 'power3.out', scrollTrigger: { trigger: '.career-navigation', start: 'top 95%', once: true } });
      gsap.fromTo('.career-ghost-number', { y: -20 }, { y: 24, ease: 'none', scrollTrigger: { trigger: '.career-body', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      gsap.fromTo('.career-art-title', { y: 10 }, { y: -12, ease: 'none', scrollTrigger: { trigger: '.career-body', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }, section);
  }

  renderChapter(0, false);
  setupMotion();

  return {
    setMotion(enabled: boolean) { if (motion === enabled) return; motion = enabled; setupMotion(); },
    destroy() {
      context?.revert();
      swap?.kill();
      detailTween?.kill();
      pointerTween?.kill();
      cancelAnimationFrame(refreshFrame);
      cleanups.forEach(cleanup => cleanup());
    },
  };
}
