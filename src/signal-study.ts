import gsap from 'gsap';
import './signal-study.css';

type Point = [number, number, number];
type Surface = Point[][];

const studies = [
  { name: 'Signal', field: 'AI SYSTEMS', description: 'Independent paths. Shared intelligence.', color: '#d2bff2' },
  { name: 'Structure', field: 'WEB PLATFORMS', description: 'A framework for connected experiences.', color: '#d4e5b1' },
  { name: 'Flow', field: 'INTERFACE DESIGN', description: 'One continuous exchange of information.', color: '#efb69a' },
];

// The same topology becomes a twisted ribbon, an architectural shell, and a loop.
// Compatible points let every line transform continuously between the studies.
function surfacePoint(mode: number, u: number, v: number): Point {
  const t = u * Math.PI * 2;
  if (mode === 0) {
    const angle = t * .86 - .7;
    return [(u - .5) * 3.3, Math.sin(angle) * .63 + v * .92 * Math.cos(angle), Math.cos(angle) * .66 + v * .92 * Math.sin(angle)];
  }
  if (mode === 1) {
    const angle = u * Math.PI;
    return [Math.cos(angle) * 1.4, v * 1.5, Math.sin(angle) * (.95 + .2 * Math.cos(v * Math.PI * 2)) - .4];
  }
  const radius = 1.03 + v * .62 * Math.cos(t / 2);
  return [Math.cos(t) * radius * 1.25, Math.sin(t) * radius * .88, Math.sin(t * 2) * .27 + v * .75 * Math.sin(t / 2)];
}

function createSurface(mode: number): Surface {
  const strands = Array.from({ length: 31 }, (_, row) =>
    Array.from({ length: 73 }, (_, column) => surfacePoint(mode, column / 72, row / 30 - .5)),
  );
  const crossLines = Array.from({ length: 13 }, (_, column) =>
    Array.from({ length: 31 }, (_, row) => surfacePoint(mode, column / 12, row / 30 - .5)),
  );
  return [...strands, ...crossLines];
}

export function createSignalStudy(initialMotion: boolean) {
  const host = document.querySelector<HTMLElement>('.work-intro-note')!;
  const figure = document.createElement('figure');
  figure.className = 'signal-study';
  figure.dataset.study = 'signal';
  figure.innerHTML = `
    <div class="signal-study-heading"><span>FORM FOLLOWS CURIOSITY</span><span class="signal-study-index">01 / 03</span></div>
    <div class="signal-study-surface" role="img" aria-label="Signal: a woven ribbon representing connected AI systems">
      <svg viewBox="0 0 500 310" aria-hidden="true">
        <defs><linearGradient id="signal-thread-gradient" x1="0" y1="0" x2="1" y2=".8"><stop offset="0" stop-color="#eee6ff"/><stop offset=".48" stop-color="#cbb4e9"/><stop offset="1" stop-color="#a785c4"/></linearGradient></defs>
        <path class="signal-ground" d="M45 265H455"/>
        <g class="signal-mesh"></g>
        <g class="signal-measure"><path d="M45 255v20M455 255v20M250 261v8"/><text x="45" y="292">GENERATIVE STUDY</text><text x="455" y="292" text-anchor="end">SG / 2026</text></g>
      </svg>
      <span class="signal-surface-hint">MOVE TO EXPLORE</span>
    </div>
    <div class="signal-study-controls" role="group" aria-label="Choose a graphic study">
      ${studies.map((study, index) => `<button type="button" data-study="${index}" aria-pressed="${index === 0}" aria-label="Explore ${study.name.toLowerCase()} graphic"><span>0${index + 1}</span>${study.name}</button>`).join('')}
    </div>
    <figcaption><span class="signal-study-field">AI SYSTEMS</span><span class="signal-study-caption">${studies[0].description}</span></figcaption>
    <span class="sr-only signal-study-status" role="status" aria-live="polite"></span>
  `;
  host.prepend(figure);
  host.classList.add('with-signal-study');

  const mesh = figure.querySelector<SVGGElement>('.signal-mesh')!;
  const surface = figure.querySelector<HTMLElement>('.signal-study-surface')!;
  const buttons = [...figure.querySelectorAll<HTMLButtonElement>('[data-study]')];
  const modes = studies.map((_, index) => createSurface(index));
  let geometry = modes[0];
  let origin = geometry;
  let destination = geometry;
  let selected = 0;
  let motion = initialMotion;
  let visible = false;
  let frame = 0;
  let transformTween: gsap.core.Tween | undefined;
  let morphTween: gsap.core.Tween | undefined;
  const pose = { yaw: -.28, pitch: -.48, blend: 1 };
  const resting = { yaw: -.28, pitch: -.48 };
  const cleanups: (() => void)[] = [];
  const paths = geometry.map((_, index) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add(index < 31 ? 'signal-thread' : 'signal-crossline');
    if (index === 0 || index === 30) path.classList.add('signal-selvedge');
    mesh.append(path);
    return path;
  });

  function listen(target: EventTarget, name: string, callback: EventListener) {
    target.addEventListener(name, callback);
    cleanups.push(() => target.removeEventListener(name, callback));
  }

  function draw() {
    const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
    const cx = Math.cos(pose.pitch), sx = Math.sin(pose.pitch);
    geometry = origin.map((line, i) => line.map((point, j) => point.map((value, k) => value + (destination[i][j][k] - value) * pose.blend) as Point));
    const projected = geometry.map(line => line.map(([x, y, z]) => {
        const px = x * cy + z * sy;
        const pz = z * cy - x * sy;
        const py = y * cx - pz * sx;
        const depth = y * sx + pz * cx;
        const perspective = 5.6 / (5.6 - depth);
        return [px * perspective, py * perspective];
    }));
    const points = projected.flat();
    const left = Math.min(...points.map(point => point[0]));
    const right = Math.max(...points.map(point => point[0]));
    const top = Math.min(...points.map(point => point[1]));
    const bottom = Math.max(...points.map(point => point[1]));
    const scale = Math.min(115, 422 / (right - left), 220 / (bottom - top));
    const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
    projected.forEach((line, index) => {
      const d = line.map(([x, y], i) => `${i ? 'L' : 'M'}${(250 + (x - centerX) * scale).toFixed(2)},${(139 + (y - centerY) * scale).toFixed(2)}`).join(' ');
      paths[index].setAttribute('d', d);
    });
  }

  function settle() {
    cancelAnimationFrame(frame);
    frame = 0;
    transformTween?.kill();
    morphTween?.kill();
    origin = destination = modes[selected];
    pose.blend = 1;
    Object.assign(pose, resting);
    draw();
  }

  function select(index: number) {
    if (index === selected) return;
    selected = index;
    const study = studies[index];
    figure.dataset.study = study.name.toLowerCase();
    figure.style.setProperty('--study-accent', study.color);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
    figure.querySelector('.signal-study-index')!.textContent = `0${index + 1} / 03`;
    figure.querySelector('.signal-study-field')!.textContent = study.field;
    figure.querySelector('.signal-study-caption')!.textContent = study.description;
    figure.querySelector('.signal-study-status')!.textContent = `${study.name}. ${study.field.toLowerCase()}. ${study.description}`;
    surface.setAttribute('aria-label', `${study.name}: an original line sculpture inspired by ${study.field.toLowerCase()}`);
    morphTween?.kill();
    origin = geometry;
    destination = modes[index];
    pose.blend = 0;
    if (!motion || !visible || document.hidden) { settle(); return; }
    morphTween = gsap.to(pose, { blend: 1, duration: 1.05, ease: 'power3.inOut', onUpdate: draw });
  }

  buttons.forEach((button, index) => {
    listen(button, 'click', () => select(index));
    listen(button, 'keydown', ((event: KeyboardEvent) => {
      const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
      if (next < 0) return;
      event.preventDefault();
      buttons[next].focus({ preventScroll: true });
      select(next);
    }) as EventListener);
  });

  let pointerX = 0, pointerY = 0;
  listen(surface, 'pointermove', ((event: PointerEvent) => {
    if (!motion || !visible || document.hidden || event.pointerType !== 'mouse') return;
    const bounds = surface.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - .5;
    pointerY = (event.clientY - bounds.top) / bounds.height - .5;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!motion || !visible || document.hidden) return;
      transformTween?.kill();
      transformTween = gsap.to(pose, { yaw: resting.yaw + pointerX * .75, pitch: resting.pitch + pointerY * .5, duration: .65, ease: 'power3.out', onUpdate: draw });
    });
  }) as EventListener);
  listen(surface, 'pointerleave', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    transformTween?.kill();
    if (!motion || document.hidden || !visible) { settle(); return; }
    transformTween = gsap.to(pose, { ...resting, duration: 1, ease: 'power3.out', onUpdate: draw });
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) settle();
  });
  observer.observe(figure);
  listen(document, 'visibilitychange', () => { if (document.hidden) settle(); });
  listen(window, 'blur', settle);
  draw();

  return {
    setMotion(enabled: boolean) { motion = enabled; if (!enabled) settle(); },
    destroy() {
      settle();
      observer.disconnect();
      cleanups.forEach(cleanup => cleanup());
      figure.remove();
      host.classList.remove('with-signal-study');
    },
  };
}
