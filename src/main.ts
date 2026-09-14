import './fonts.css';
import './style.css';
import './chapters.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { projects } from './projects';
import { createPlayground } from './playground';
import { createChapters } from './chapters';
import { createHeroStage } from './hero-stage';
import { createIdeaDesk } from './idea-desk';
import { createWorkStage } from './work-stage';
import { createWorkFilters } from './work-filters';
import { createLowerChapters } from './lower-chapters';
import { createCursor } from './cursor';
import { createCareerStage } from './career-stage';
import { createKineticType } from './kinetic-type';
import { createEditorialGraphics } from './editorial-graphics';
import { createMotionTrace } from './motion-trace';
import { createPencilMark } from './pencil-mark';
import './pencil-type.css';
import './section-density.css';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let userMotionEnabled = true;
try {
  if (localStorage.getItem('soujanya-motion') === 'off') userMotionEnabled = false;
} catch { /* The site works when browser storage is unavailable. */ }
let motionEnabled = userMotionEnabled && !reducedMotion.matches;

let playground: ReturnType<typeof createPlayground> | undefined;
let chapters: ReturnType<typeof createChapters> | undefined;
let heroStage: ReturnType<typeof createHeroStage> | undefined;
let ideaDesk: ReturnType<typeof createIdeaDesk> | undefined;
let workStage: ReturnType<typeof createWorkStage> | undefined;
let workFilters: ReturnType<typeof createWorkFilters> | undefined;
let lowerChapters: ReturnType<typeof createLowerChapters> | undefined;
let cursor: ReturnType<typeof createCursor> | undefined;
let careerStage: ReturnType<typeof createCareerStage> | undefined;
let kineticType: ReturnType<typeof createKineticType> | undefined;
let editorialGraphics: ReturnType<typeof createEditorialGraphics> | undefined;
let motionTrace: ReturnType<typeof createMotionTrace> | undefined;
let pencilMark: ReturnType<typeof createPencilMark> | undefined;
const motionButton = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
let animationContext: gsap.Context | undefined;
let animationsStarted = false;

function setMotion(enabled: boolean, persist = false) {
  motionEnabled = enabled && !reducedMotion.matches;
  document.documentElement.classList.toggle('no-motion', !motionEnabled);
  motionButton.setAttribute('aria-pressed', String(!motionEnabled));
  motionButton.querySelector('.motion-label')!.textContent = motionEnabled ? 'Motion on' : 'Motion off';
  motionButton.setAttribute('aria-label', motionEnabled ? 'Pause animations' : 'Enable animations');
  playground?.setMotion(motionEnabled);
  chapters?.setMotion(motionEnabled);
  heroStage?.setMotion(motionEnabled);
  ideaDesk?.setMotion(motionEnabled);
  workStage?.setMotion(motionEnabled);
  workFilters?.setMotion(motionEnabled);
  lowerChapters?.setMotion(motionEnabled);
  cursor?.setMotion(motionEnabled);
  careerStage?.setMotion(motionEnabled);
  kineticType?.setMotion(motionEnabled);
  editorialGraphics?.setMotion(motionEnabled);
  motionTrace?.setMotion(motionEnabled);
  pencilMark?.setMotion(motionEnabled);
  if (!motionEnabled) {
    animationContext?.revert();
    animationContext = undefined;
    gsap.set('.reveal', { clearProps: 'all' });
  } else if (animationsStarted && !animationContext) {
    setupAnimations(false);
  }
  if (persist) {
    userMotionEnabled = enabled;
    try { localStorage.setItem('soujanya-motion', motionEnabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
  }
}

setMotion(motionEnabled);
heroStage = createHeroStage(motionEnabled);
ideaDesk = createIdeaDesk(motionEnabled);
workStage = createWorkStage(motionEnabled);
workFilters = createWorkFilters(motionEnabled);
const revealDeskProject = (event: Event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('.idea-desk-explore');
  if (!link) return;
  const card = document.querySelector(link.hash)?.closest<HTMLElement>('.project-card');
  if (!card?.hidden) return;
  // Reveal the linked build before the browser resolves the anchor destination.
  workFilters?.setMotion(false);
  document.querySelector<HTMLButtonElement>('.filter[data-filter="all"]')?.click();
  workFilters?.setMotion(motionEnabled);
};
document.querySelector('#idea-desk')!.addEventListener('click', revealDeskProject);

lowerChapters = createLowerChapters(motionEnabled);
cursor = createCursor(motionEnabled);
careerStage = createCareerStage(motionEnabled);
editorialGraphics = createEditorialGraphics(motionEnabled);
pencilMark = createPencilMark(motionEnabled);

function setupAnimations(entrance = true) {
  if (!motionEnabled) return;
  animationsStarted = true;
  animationContext = gsap.context(() => {
    if (entrance) {
      gsap.from('.site-header, .hero-topline', { opacity: 0, y: -12, duration: 1, stagger: .12, ease: 'power2.out' });
      gsap.from('.hero-description, .hero-footer-note', { opacity: 0, duration: 1, delay: .8, ease: 'power2.out' });
    }
    document.querySelectorAll<HTMLElement>('.reveal').forEach((element) => {
      gsap.from(element, {
        y: 32, opacity: 0, duration: .85, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 94%', once: true },
      });
    });
    gsap.fromTo('.about-statement .word', { color: '#615d5a' }, {
      color: (_index, element: HTMLElement) => element.closest('em') ? '#c7b3e3' : '#f1eee7',
      stagger: .09, duration: .35,
      scrollTrigger: { trigger: '.about-statement', start: 'top 83%', end: 'bottom 59%', scrub: .5 },
    });
    document.querySelectorAll<HTMLElement>('.case-scene').forEach(scene => {
      const object = scene.querySelector('.scene-depth');
      gsap.fromTo(object, { y: 28 }, {
        y: -20, ease: 'none',
        scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: .7 },
      });
    });
    gsap.fromTo('.identity-card', { rotation: -7, y: 26 }, {
      rotation: 9, y: -12, ease: 'none',
      scrollTrigger: { trigger: '.identity-scene', start: 'top bottom', end: 'bottom top', scrub: .8 },
    });
    gsap.fromTo('.contact-postcard', { rotation: 15, y: 38 }, { rotation: 6, y: 0, ease: 'none', scrollTrigger: { trigger: '.contact-stage', start: 'top 90%', end: 'bottom 70%', scrub: .7 } });
  });
}

// Wrap only text nodes; the original emphasis and accessible reading order stay intact.
const statement = document.querySelector('.about-statement')!;
const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
const statementText: Text[] = [];
while (walker.nextNode()) statementText.push(walker.currentNode as Text);
statementText.forEach(text => {
  const fragment = document.createDocumentFragment();
  text.textContent!.split(/(\s+)/).forEach(part => {
    if (!part.trim()) fragment.append(document.createTextNode(part));
    else { const word = document.createElement('span'); word.className = 'word'; word.textContent = part; fragment.append(word); }
  });
  text.replaceWith(fragment);
});

setupAnimations();
kineticType = createKineticType(motionEnabled);
animationsStarted = true;
void document.fonts.ready.then(() => ScrollTrigger.refresh());
motionButton.addEventListener('click', () => {
  if (reducedMotion.matches && !motionEnabled) {
    showToast('Reduced motion is enabled in your device settings.');
    return;
  }
  setMotion(!motionEnabled, true);
});
reducedMotion.addEventListener('change', () => setMotion(userMotionEnabled));

playground = createPlayground(document.querySelector<HTMLElement>('#lab-bounds')!, motionEnabled);
motionTrace = createMotionTrace(motionEnabled);
document.querySelector('#shake-lab')!.addEventListener('click', () => playground?.shake());
document.querySelector('#reset-lab')!.addEventListener('click', () => playground?.reset());
document.querySelector<HTMLButtonElement>('#gravity-toggle')!.addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement;
  const enabled = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(enabled));
  button.innerHTML = `<span class="gravity-dot"></span>Gravity ${enabled ? 'on' : 'off'}`;
  playground?.setGravity(enabled);
});
chapters = createChapters(motionEnabled);

function updateTime() {
  const now = new Date();
  const time = document.querySelector<HTMLTimeElement>('#local-time')!;
  time.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(now) + ' IST';
  time.dateTime = now.toISOString();
}
updateTime();
const timeInterval = setInterval(updateTime, 60_000);

let scrollFrame = 0;
function updateScroll() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const extent = document.documentElement.scrollHeight - innerHeight;
    const progress = extent > 0 ? scrollY / extent : 0;
    document.querySelector<HTMLElement>('.scroll-progress > span')!.style.transform = `scaleY(${progress})`;
  });
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav')!;
function closeMenu(returnFocus = false) {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true); });
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target as Node) && !menuToggle.contains(event.target as Node)) closeMenu();
});
window.matchMedia('(min-width: 768px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const navLinks = document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-20% 0px -60% 0px' });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

const dialog = document.querySelector<HTMLDialogElement>('#project-dialog')!;
const dialogBody = dialog.querySelector<HTMLElement>('.dialog-body')!;
let projectOpener: HTMLButtonElement | undefined;
const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow-up-right" /></svg>';

document.querySelectorAll<HTMLButtonElement>('.project-open').forEach(button => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project!];
    if (!project) return;
    projectOpener = button;
    // All values below are local, authored project content; there is no user HTML.
    dialogBody.innerHTML = `
      <p class="eyebrow section-label">${project.category}</p>
      <h2 id="dialog-title">${project.title}</h2>
      <p class="dialog-subtitle">${project.subtitle}</p>
      <div class="project-tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      <h3>The idea</h3><p>${project.overview}</p>
      <h3>How it comes together</h3><p>${project.approach}</p>
      <div class="dialog-flow">${project.flow.map(step => `<span>${step}</span>`).join('')}</div>
      ${project.note ? `<p class="dialog-note">${project.note}</p>` : ''}
      <div class="dialog-actions">${project.link ? `<a class="button button-dark" href="${project.link.href}" target="_blank" rel="noreferrer">${project.link.label}${arrow}</a>` : ''}<a class="dialog-source" href="mailto:soujanyagupta.dev@gmail.com?subject=${encodeURIComponent(`Let's talk about ${project.title}`)}">Ask me about this project ↗</a></div>`;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  });
});

dialog.querySelector('.dialog-close')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  projectOpener?.focus({ preventScroll: true });
});

document.querySelectorAll('.experience-item').forEach(item => {
  item.addEventListener('toggle', () => ScrollTrigger.refresh());
});

let toastTimeout: ReturnType<typeof setTimeout>;
function showToast(message: string) {
  const toast = document.querySelector<HTMLElement>('#toast')!;
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3200);
}

document.querySelector<HTMLButtonElement>('.copy-email')!.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('soujanyagupta.dev@gmail.com');
    showToast('Email copied. Let’s make something good.');
  } catch {
    showToast('You can select the email address to copy it, or click it to write to me.');
  }
});

document.querySelector('#year')!.textContent = String(new Date().getFullYear());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    playground?.dispose();
    chapters?.dispose();
    heroStage?.destroy();
    ideaDesk?.destroy();
    document.querySelector('#idea-desk')!.removeEventListener('click', revealDeskProject);
    workStage?.destroy();
    workFilters?.destroy();
    lowerChapters?.destroy();
    cursor?.destroy();
    careerStage?.destroy();
    kineticType?.destroy();
    editorialGraphics?.destroy();
    motionTrace?.destroy();
    pencilMark?.destroy();
    clearInterval(timeInterval);
    cancelAnimationFrame(scrollFrame);
    window.removeEventListener('scroll', updateScroll);
    animationContext?.revert();
    sectionObserver.disconnect();
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  });
}
