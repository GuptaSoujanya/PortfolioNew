import './idea-desk.css';
import { signalForm, learningForm, interfaceForm } from './idea-forms';

type ProjectKey = 'evalagent' | 'cohart' | 'agui';
type Sketch = { key: ProjectKey; name: string; caption: string; href: string; label: string; artwork: () => string };
type InkPath = { element: SVGPathElement; length: number; start: number; offset: number; block?: HTMLElement };
type DiagramReveal = { element: SVGElement; at: number; opacity: number };
type Solid = { element: HTMLElement; at: number; rise: number; shown: number };

const sketches: Sketch[] = [
  { key: 'evalagent', name: 'EvalAgentFlow', caption: 'Eight agents. One clear result.', href: '#eval-heading', label: 'Agents', artwork: signalForm },
  { key: 'cohart', name: 'Cohart', caption: 'Learn it. Try it. Build it.', href: '#cohart-heading', label: 'Learning', artwork: learningForm },
  { key: 'agui', name: 'Agent-Driven Portfolio', caption: 'An interface shaped by your intent.', href: '#agui-heading', label: 'Interfaces', artwork: interfaceForm },
];

/** A finite, real SVG drawing sequence; the pen follows the visible ink exactly. */
export function createIdeaDesk(initialMotion: boolean) {
  const container = document.querySelector<HTMLElement>('#idea-desk');
  if (!container) return { setMotion(_enabled: boolean) {}, destroy() {} };
  const original = [...container.childNodes];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let requestedMotion = initialMotion;
  let motion = initialMotion && !reducedMotion.matches;
  let selected = 0;
  let disposed = false;
  let visible = true;
  let drawing = false;
  let progress = 0;
  let frameId = 0;
  let lastTime = 0;
  let totalLength = 0;
  let paths: InkPath[] = [];
  let reveals: DiagramReveal[] = [];
  let solids: Solid[] = [];
  let tiltFrame = 0;
  let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cleanups: (() => void)[] = [];

  container.innerHTML = `<div class="idea-desk">
    <div class="idea-desk-topline"><span>PROJECT NOTES</span><span class="desk-edition"><b class="desk-sheet-index">001</b> / 003</span></div>
    <div class="idea-desk-stage" data-cursor-label="TILT">
      <span class="desk-view-note" aria-hidden="true">A CLOSER LOOK</span>
      <div class="desk-camera">
        <div class="desk-paper" data-desk-artwork>
          <div class="desk-board" aria-hidden="true"></div>
          <svg class="idea-desk-drawing" viewBox="0 0 520 300" role="img" aria-labelledby="desk-drawing-title">
            <title id="desk-drawing-title"></title><g data-desk-floor aria-hidden="true"></g>
          </svg>
          <div class="desk-solids" aria-hidden="true"></div>
          <svg class="desk-pen-layer" viewBox="0 0 520 300" aria-hidden="true"><g class="desk-pen"><circle r="2.5"/></g></svg>
        </div>
      </div>
      <span class="desk-tilt-note" aria-hidden="true">MOVE TO EXPLORE <svg viewBox="0 0 20 20"><path d="M2 10h16M10 2v16M2 10l3-3M2 10l3 3M18 10l-3-3M18 10l-3 3"/></svg></span>
    </div>
    <div class="idea-desk-projects" role="group" aria-label="Choose a sketch">${sketches.map((sketch, index) => `<button data-desk-project="${sketch.key}" aria-label="Sketch ${sketch.name}" aria-pressed="${index === 0}"><span>0${index + 1}</span>${sketch.label}</button>`).join('')}<button data-desk-replay aria-label="Replay drawing" aria-busy="false" title="Replay drawing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7"/></svg></button></div>
    <div class="idea-desk-caption"><div><span class="idea-desk-project-name"></span><p id="desk-caption"></p></div><a class="idea-desk-explore"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a></div>
    <button data-desk-next><span>Next project</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg></button>
    <p id="desk-status" class="desk-accessible-status" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;

  const desk = container.querySelector<HTMLElement>('.idea-desk')!;
  const stage = container.querySelector<HTMLElement>('.idea-desk-stage')!;
  const camera = container.querySelector<HTMLElement>('.desk-camera')!;
  const artwork = container.querySelector<HTMLElement>('[data-desk-artwork]')!;
  const floor = container.querySelector<SVGGElement>('[data-desk-floor]')!;
  const solidLayer = container.querySelector<HTMLElement>('.desk-solids')!;
  const penLayer = container.querySelector<SVGSVGElement>('.desk-pen-layer')!;
  const pen = container.querySelector<SVGGElement>('.desk-pen')!;
  const replay = container.querySelector<HTMLButtonElement>('[data-desk-replay]')!;
  const status = container.querySelector<HTMLElement>('#desk-status')!;
  const selectors = [...container.querySelectorAll<HTMLButtonElement>('[data-desk-project]')];

  function listen(target: EventTarget, name: string, callback: EventListener) {
    target.addEventListener(name, callback);
    cleanups.push(() => target.removeEventListener(name, callback));
  }
  function movePen(x: number, y: number) {
    pen.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  }
  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    tiltX = tiltY = targetX = targetY = 0;
    camera.style.setProperty('--look-x', '0deg');
    camera.style.setProperty('--look-y', '0deg');
    stage.classList.remove('is-exploring');
  }
  function tilt() {
    tiltFrame = 0;
    if (!motion || !visible || document.hidden || !finePointer.matches) { resetTilt(); return; }
    tiltX += (targetX - tiltX) * .14;
    tiltY += (targetY - tiltY) * .14;
    camera.style.setProperty('--look-x', `${tiltX.toFixed(3)}deg`);
    camera.style.setProperty('--look-y', `${tiltY.toFixed(3)}deg`);
    if (Math.abs(targetX - tiltX) + Math.abs(targetY - tiltY) > .015) tiltFrame = requestAnimationFrame(tilt);
  }
  function startTilt() { if (!tiltFrame) tiltFrame = requestAnimationFrame(tilt); }
  function stopFrame() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
  }
  function finish() {
    stopFrame();
    drawing = false;
    progress = 1;
    paths.forEach(path => { path.element.style.strokeDashoffset = '0'; path.offset = 0; });
    reveals.forEach(reveal => { reveal.element.style.opacity = '1'; reveal.opacity = 1; });
    solids.forEach(solid => {
      solid.element.style.setProperty('--rise', `${solid.rise}px`);
      solid.element.style.setProperty('--solid-opacity', '1');
      solid.shown = 1;
    });
    desk.classList.remove('is-drawing');
    replay.setAttribute('aria-busy', 'false');
    status.textContent = `${sketches[selected].name} drawing complete.`;
  }
  function paint() {
    // Labels and panel fills arrive with their outline, making the sequence a
    // readable explanation of the workflow instead of a global model fade.
    for (const reveal of reveals) {
      const opacity = Math.max(0, Math.min(1, (progress - reveal.at) / .045));
      if (Math.abs(reveal.opacity - opacity) > .001) {
        reveal.element.style.opacity = opacity.toFixed(3);
        reveal.opacity = opacity;
      }
    }
    for (const solid of solids) {
      const shown = Math.max(0, Math.min(1, (progress - solid.at) / .11));
      if (Math.abs(solid.shown - shown) > .001) {
        solid.element.style.setProperty('--rise', `${(solid.rise * (1 - Math.pow(1 - shown, 3))).toFixed(2)}px`);
        solid.element.style.setProperty('--solid-opacity', shown.toFixed(3));
        solid.shown = shown;
      }
    }
    const length = progress * totalLength;
    let active = paths[paths.length - 1];
    for (const path of paths) {
      const offset = Math.max(0, Math.min(path.length, path.start + path.length - length));
      if (Math.abs(path.offset - offset) > .01) {
        path.element.style.strokeDashoffset = String(offset);
        path.offset = offset;
      }
      if (length >= path.start && length <= path.start + path.length) active = path;
    }
    if (active) {
      const point = active.element.getPointAtLength(Math.max(0, Math.min(active.length, length - active.start)));
      movePen(point.x, point.y);
      const rise = active.block ? parseFloat(active.block.style.getPropertyValue('--rise')) || 0 : -22;
      penLayer.style.transform = `translateZ(${rise + 23}px)`;
    }
  }
  function frame(time: number) {
    frameId = 0;
    if (disposed || !drawing || !motion || !visible || document.hidden) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .06) : 0;
    lastTime = time;
    progress = Math.min(1, progress + delta / 2.1);
    paint();
    if (progress >= 1) finish();
    else frameId = requestAnimationFrame(frame);
  }
  function resume() {
    if (drawing && motion && visible && !document.hidden && !frameId && !disposed) frameId = requestAnimationFrame(frame);
  }
  function draw() {
    stopFrame();
    if (!motion || !paths.length) { finish(); return; }
    drawing = true;
    progress = 0;
    paths.forEach(path => {
      path.offset = path.length;
      path.element.style.strokeDasharray = String(path.length);
      path.element.style.strokeDashoffset = String(path.length);
    });
    desk.classList.add('is-drawing');
    replay.setAttribute('aria-busy', 'true');
    status.textContent = `Drawing ${sketches[selected].name}.`;
    paint();
    resume();
  }
  function select(index: number) {
    stopFrame();
    selected = index;
    const sketch = sketches[index];
    desk.dataset.project = sketch.key;
    floor.innerHTML = sketch.artwork();
    solidLayer.replaceChildren();
    solids = [...floor.querySelectorAll<SVGGElement>('[data-panel-box]')].map((panel, panelIndex) => {
      const [x, y, width, height] = panel.dataset.panelBox!.split(',').map(Number);
      const block = document.createElement('div');
      const rise = panel.dataset.projectNode === 'agent' ? 16 + (panelIndex % 2) * 9 : 8 + (panelIndex % 3) * 12;
      block.className = `desk-solid solid-${panel.dataset.panelTone}`;
      block.style.cssText = `left:${x}px;top:${y}px;width:${width}px;height:${height}px;--rise:0px;--solid-opacity:0;`;
      // Each face owns a local viewport. A translated group keeps the drawing
      // coordinates shared without stale SVG text offsets after reparenting.
      block.innerHTML = `<i class="solid-shadow"></i><i class="solid-side side-bottom"></i><i class="solid-side side-right"></i><i class="solid-side side-left"></i><i class="solid-side side-top"></i><div class="solid-face"><svg viewBox="0 0 ${width} ${height}"><g transform="translate(${-x} ${-y})">${panel.outerHTML}</g></svg></div>`;
      panel.remove();
      solidLayer.append(block);
      return { element: block, at: 0, rise, shown: -1 };
    });
    container!.querySelector('#desk-drawing-title')!.textContent = `${sketch.name} — ${sketch.caption}`;
    container!.querySelector('.idea-desk-project-name')!.textContent = sketch.name;
    container!.querySelector('#desk-caption')!.textContent = sketch.caption;
    container!.querySelector('.desk-sheet-index')!.textContent = `00${index + 1}`;
    const explore = container!.querySelector<HTMLAnchorElement>('.idea-desk-explore')!;
    explore.href = sketch.href;
    explore.setAttribute('aria-label', `Explore ${sketch.name}`);
    selectors.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(index === buttonIndex)));
    totalLength = 0;
    paths = [...artwork.querySelectorAll<SVGPathElement>('[data-ink]')].map(element => {
      const length = element.getTotalLength();
      const path = { element, length, start: totalLength, offset: length, block: element.closest<HTMLElement>('.desk-solid') || undefined };
      totalLength += length;
      return path;
    });
    reveals = [...artwork.querySelectorAll<SVGElement>('[data-reveal-for]')].map(element => {
      const path = paths.find(path => path.element.dataset.inkId === element.dataset.revealFor);
      return { element, at: path && totalLength ? (path.start + path.length * .7) / totalLength : 0, opacity: -1 };
    });
    solids.forEach(solid => {
      const path = paths.find(path => path.block === solid.element);
      solid.at = path && totalLength ? path.start / totalLength : 0;
    });
    draw();
  }

  selectors.forEach((button, index) => listen(button, 'click', () => select(index)));
  listen(replay, 'click', draw);
  listen(container.querySelector('[data-desk-next]')!, 'click', () => select((selected + 1) % sketches.length));
  listen(stage, 'pointermove', ((event: PointerEvent) => {
    if (!motion || !finePointer.matches || event.pointerType === 'touch') return;
    const box = stage.getBoundingClientRect();
    targetX = -((event.clientY - box.top) / box.height - .5) * 12;
    targetY = ((event.clientX - box.left) / box.width - .5) * 16;
    stage.classList.add('is-exploring');
    startTilt();
  }) as EventListener);
  listen(stage, 'pointerleave', () => { targetX = targetY = 0; stage.classList.remove('is-exploring'); startTilt(); });
  listen(finePointer, 'change', resetTilt);
  listen(document, 'visibilitychange', () => { if (document.hidden) { stopFrame(); resetTilt(); } else resume(); });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) resume(); else { stopFrame(); resetTilt(); }
  }, { rootMargin: '60px' });
  observer.observe(container);
  function sizeStage() {
    const scale = Math.min((stage.clientWidth - 12) / 555, (stage.clientHeight - 40) / 335);
    camera.style.setProperty('--desk-scale', String(Math.max(.25, scale)));
  }
  sizeStage();
  const resizeObserver = new ResizeObserver(sizeStage);
  resizeObserver.observe(stage);
  function configureMotion() {
    motion = requestedMotion && !reducedMotion.matches;
    if (!motion && drawing) finish();
    else resume();
    if (!motion) resetTilt();
  }
  listen(reducedMotion, 'change', configureMotion);
  select(0);

  return {
    setMotion(enabled: boolean) { if (disposed) return; requestedMotion = enabled; configureMotion(); },
    destroy() {
      if (disposed) return;
      disposed = true;
      stopFrame();
      resetTilt();
      observer.disconnect();
      resizeObserver.disconnect();
      cleanups.forEach(cleanup => cleanup());
      container.replaceChildren(...original);
    },
  };
}
