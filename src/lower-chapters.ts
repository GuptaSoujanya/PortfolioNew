import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './lower-chapters.css';

gsap.registerPlugin(ScrollTrigger);

/** The lower half of the portfolio is a series of little exhibitions. */
export function createLowerChapters(initialMotion: boolean) {
  let motion = initialMotion;
  let context: gsap.Context | undefined;
  let frame = 0;
  const cleanups: (() => void)[] = [];
  const additions: HTMLElement[] = [];
  const chapters = [...document.querySelectorAll<HTMLElement>('.human-chapter, .play-chapter, .journey-chapter, .contact-chapter')];

  function add(selector: string, className: string, html: string, prepend = false) {
    const parent = document.querySelector<HTMLElement>(selector);
    if (!parent) return;
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = html;
    if (prepend) parent.prepend(element);
    else parent.append(element);
    additions.push(element);
    return element;
  }

  function listen(element: EventTarget, event: string, listener: EventListener) {
    element.addEventListener(event, listener);
    cleanups.push(() => element.removeEventListener(event, listener));
  }

  chapters.forEach(chapter => chapter.classList.add('lower-curated'));

  add('.human-chapter', 'human-background-word', 'HUMAN');
  add('.identity-scene', 'identity-planet', '<i></i><i></i><span>01 / IN ORBIT</span>', true);
  add('.identity-scene', 'identity-type-orbit', `<svg viewBox="0 0 600 600"><defs><path id="human-circular-type" d="M300,300m-265,0a265,265 0 1,1 530,0a265,265 0 1,1 -530,0" /></defs><text><textPath href="#human-circular-type" textLength="1660">SOFTWARE ENGINEER. &nbsp; AI AGENT EVALUATION. &nbsp; LLM TOOLING. &nbsp; </textPath></text></svg>`, true);
  add('.identity-scene', 'identity-coordinate coordinate-one', '<i></i>CODE<br><span>MEETS CURIOSITY</span>');
  add('.identity-scene', 'identity-coordinate coordinate-two', 'INDORE, INDIA<br><span>SOFTWARE ENGINEERING ↗</span>');
  add('.human-principles > div:nth-child(1)', 'principle-mark', '<svg viewBox="0 0 72 72"><path d="M8 18h56M8 36h56M8 54h56M18 8v56M36 8v56M54 8v56" /></svg>');
  add('.human-principles > div:nth-child(2)', 'principle-mark', '<svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="25" /><circle cx="36" cy="36" r="16" /><circle cx="36" cy="36" r="7" /></svg>');
  add('.human-principles > div:nth-child(3)', 'principle-mark', '<svg viewBox="0 0 72 72"><path d="M12 58V40h12v18M30 58V28h12v30M48 58V14h12v44" /></svg>');

  add('.contact-stage', 'contact-orbit-stamp', `<svg viewBox="0 0 160 160"><defs><path id="contact-circular-type" d="M80,80m-63,0a63,63 0 1,1 126,0a63,63 0 1,1 -126,0" /></defs><text><textPath href="#contact-circular-type" textLength="393">GOOD THINGS START WITH A CONVERSATION. • </textPath></text></svg><span>↗</span>`);
  add('.contact-chapter', 'contact-colophon', '<span>THE NEXT CHAPTER IS UNWRITTEN.</span><span>LET’S SEE WHERE IT GOES. ↗</span>');

  function setupMotion() {
    context?.revert();
    context = undefined;
    if (!motion) return;
    context = gsap.context(() => {
      gsap.to('.identity-type-orbit', {
        rotation: 60, ease: 'none',
        scrollTrigger: { trigger: '.human-chapter', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
      gsap.fromTo('.human-background-word', { xPercent: -5 }, {
        xPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.human-chapter', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
      gsap.from('.identity-coordinate', {
        y: 28, opacity: 0, stagger: .15, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: '.identity-scene', start: 'top 85%', once: true },
      });
      gsap.from('.human-principles > div', {
        y: 35, opacity: 0, stagger: .12, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: '.human-principles', start: 'top 94%', once: true },
      });
      gsap.to('.contact-orbit-stamp svg', {
        rotation: 100, ease: 'none',
        scrollTrigger: { trigger: '.contact-chapter', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('lower-in-view', entry.isIntersecting));
  }, { rootMargin: '80px' });
  chapters.forEach(chapter => observer.observe(chapter));

  document.querySelectorAll<HTMLDetailsElement>('.journey-ticket').forEach(ticket => {
    listen(ticket, 'toggle', () => {
      // Native details keeps the disclosure accessible; refresh the scroll art
      // after its height changes so the next chapter still reveals on time.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  });

  setupMotion();

  return {
    setMotion(enabled: boolean) {
      if (motion === enabled) return;
      motion = enabled;
      setupMotion();
    },
    destroy() {
      context?.revert();
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanups.forEach(cleanup => cleanup());
      additions.forEach(element => element.remove());
      chapters.forEach(chapter => chapter.classList.remove('lower-curated', 'lower-in-view'));
    },
  };
}
