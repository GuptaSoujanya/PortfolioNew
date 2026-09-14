import './motion-trace.css';

type Point = { x: number; y: number };
type Gesture = {
  points: Point[];
  path: SVGPathElement;
  endpoint: SVGRectElement;
};

/** A record of direct hand input, with no animation loop or simulated motion. */
export function createMotionTrace(_initialMotion: boolean) {
  const bounds = document.querySelector<HTMLElement>('.play-arena .lab-bounds');
  const arena = bounds?.closest<HTMLElement>('.play-arena');
  if (!bounds || !arena) return { setMotion(_enabled: boolean) {}, destroy() {} };

  const namespace = 'http://www.w3.org/2000/svg';
  const layer = document.createElementNS(namespace, 'svg');
  layer.classList.add('motion-trace');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('focusable', 'false');
  layer.setAttribute('preserveAspectRatio', 'none');
  const alreadyEnabled = arena.classList.contains('trace-enabled');
  arena.classList.add('trace-enabled');
  bounds.prepend(layer);

  const gestures: Gesture[] = [];
  const cleanups: Array<() => void> = [];
  let session: { pointerId: number; token: HTMLButtonElement; gesture: Gesture } | undefined;
  let width = Math.max(1, bounds.clientWidth);
  let height = Math.max(1, bounds.clientHeight);

  function listen(target: EventTarget, name: string, listener: EventListener) {
    // Capture keeps input visible after a token takes pointer capture. These
    // passive listeners never change pointer capture, scrolling, or dragging.
    target.addEventListener(name, listener, { capture: true, passive: true });
    cleanups.push(() => target.removeEventListener(name, listener, true));
  }

  function coordinate(point: Point) {
    return `${(point.x * width).toFixed(1)} ${(point.y * height).toFixed(1)}`;
  }

  function paint(gesture: Gesture) {
    const points = gesture.points;
    const last = points[points.length - 1];
    if (!last) return;
    let path = `M ${coordinate(points[0])}`;
    for (let index = 1; index < points.length - 1; index++) {
      const point = points[index];
      const next = points[index + 1];
      path += ` Q ${coordinate(point)} ${coordinate({ x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 })}`;
    }
    if (points.length > 1) path += ` L ${coordinate(last)}`;
    gesture.path.setAttribute('d', path);
    gesture.endpoint.setAttribute('x', (last.x * width - 2.5).toFixed(1));
    gesture.endpoint.setAttribute('y', (last.y * height - 2.5).toFixed(1));
  }

  function sample(event: PointerEvent, force = false) {
    if (!session || session.pointerId !== event.pointerId) return;
    const rect = bounds!.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // Normalized coordinates preserve the drawing through responsive resizes
    // and account for scale applied by the surrounding chapter.
    const point = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
    const { gesture } = session;
    const previous = gesture.points[gesture.points.length - 1];
    const distance = previous ? Math.hypot((point.x - previous.x) * width, (point.y - previous.y) * height) : Infinity;
    if (distance < (force ? .5 : 3)) return;

    // Thin older samples while retaining the beginning and latest input, so a
    // long gesture remains complete without accumulating unbounded SVG data.
    if (gesture.points.length === 70) {
      gesture.points = gesture.points.filter((_, index) => index % 2 === 0 || index === 69);
    }
    gesture.points.push(point);
    paint(gesture);
  }

  function down(event: PointerEvent) {
    if (session || event.button !== 0 || !(event.target instanceof Element)) return;
    const token = event.target.closest<HTMLButtonElement>('.lab-token');
    if (!token || token.disabled || !bounds!.contains(token)) return;

    const path = document.createElementNS(namespace, 'path');
    path.classList.add('motion-trace-path');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    const endpoint = document.createElementNS(namespace, 'rect');
    endpoint.classList.add('motion-trace-endpoint');
    endpoint.setAttribute('width', '5');
    endpoint.setAttribute('height', '5');
    const gesture = { points: [], path, endpoint };
    gestures.push(gesture);
    layer.append(path, endpoint);
    if (gestures.length > 2) {
      const oldest = gestures.shift()!;
      oldest.path.remove();
      oldest.endpoint.remove();
    }
    gestures.forEach((entry, index) => {
      entry.path.classList.toggle('is-previous', index < gestures.length - 1);
      entry.endpoint.classList.toggle('is-previous', index < gestures.length - 1);
    });
    session = { pointerId: event.pointerId, token, gesture };
    sample(event, true);
  }

  function move(event: PointerEvent) {
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      session = undefined;
      return;
    }
    sample(event);
  }

  function end(event: PointerEvent) {
    if (!session || session.pointerId !== event.pointerId) return;
    // A new drag can begin before the previous token's capture-loss event is
    // delivered. Mouse gestures reuse a pointerId, so only the active owner's
    // actual capture loss should cancel this trace.
    if (event.type === 'lostpointercapture'
      && (event.target !== session.token || session.token.hasPointerCapture(event.pointerId))) return;
    if (event.type === 'pointerup') sample(event, true);
    session = undefined;
  }

  function clearSession() { session = undefined; }
  function clear() {
    clearSession();
    gestures.length = 0;
    layer.replaceChildren();
  }

  listen(bounds, 'pointerdown', down as EventListener);
  listen(document, 'pointermove', move as EventListener);
  listen(document, 'pointerup', end as EventListener);
  listen(document, 'pointercancel', end as EventListener);
  listen(document, 'lostpointercapture', end as EventListener);
  // The shared listener helper captures events. Ignore focus moving between
  // tokens: a descendant's blur reaches window immediately after pointerdown
  // and would otherwise erase the new token's gesture before its first move.
  listen(window, 'blur', event => { if (event.target === window) clearSession(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) clearSession(); });
  const reset = arena.querySelector('#reset-lab');
  if (reset) listen(reset, 'click', clear);

  function resize() {
    width = Math.max(1, bounds!.clientWidth);
    height = Math.max(1, bounds!.clientHeight);
    layer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    gestures.forEach(paint);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(bounds);
  resize();

  return {
    // Immediate pointer feedback remains available with reduced motion. This
    // module has no ambient movement, transitions, timers, or animation frames.
    setMotion(_enabled: boolean) {},
    destroy() {
      clear();
      observer.disconnect();
      cleanups.forEach(cleanup => cleanup());
      layer.remove();
      if (!alreadyEnabled) arena.classList.remove('trace-enabled');
    },
  };
}
