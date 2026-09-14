type Token = {
  element: HTMLButtonElement;
  x: number; y: number; vx: number; vy: number;
  width: number; height: number; angle: number; spin: number;
};

export function createPlayground(container: HTMLElement, initialMotion: boolean) {
  let motion = initialMotion;
  let gravity = true;
  let inView = false;
  let frameId = 0;
  let lastFrame = 0;
  let dragged: Token | undefined;
  let dragOffset = { x: 0, y: 0 };
  let lastPointer = { x: 0, y: 0, time: 0 };
  let width = 0;
  let height = 0;
  let activeFrames = 0;
  const listeners: Array<() => void> = [];
  const tokens: Token[] = [...container.querySelectorAll<HTMLButtonElement>('.lab-token')].map(element => ({
    element, x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, angle: 0, spin: 0,
  }));

  function paint(token: Token) {
    token.element.style.transform = `translate3d(${token.x}px, ${token.y}px, 0) rotate(${token.angle}deg)`;
  }

  function constrain(token: Token) {
    // Use unscaled dimensions conservatively: rotated tokens stay inside the tray.
    const inset = 8;
    const right = Math.max(inset, width - token.width - inset);
    const bottom = Math.max(inset, height - token.height - inset);
    if (token.x < inset) { token.x = inset; token.vx = Math.abs(token.vx) * .6; }
    if (token.x > right) { token.x = right; token.vx = -Math.abs(token.vx) * .6; }
    if (token.y < inset) { token.y = inset; token.vy = Math.abs(token.vy) * .55; }
    if (token.y > bottom) { token.y = bottom; token.vy = -Math.abs(token.vy) * .47; token.vx *= .975; token.spin *= .95; }
  }

  function layout() {
    width = container.clientWidth;
    height = container.clientHeight;
    const positions = width < 600
      ? [[.03,.015],[.94,.03],[.01,.38],[.96,.4],[.03,.8],[.95,.82]]
      : [[.03,.43],[.24,.25],[.37,.52],[.56,.33],[.72,.6],[.89,.26]];
    tokens.forEach((token,index) => {
      token.width = token.element.offsetWidth;
      token.height = token.element.offsetHeight;
      token.x = positions[index][0] * Math.max(0, width - token.width);
      token.y = positions[index][1] * Math.max(0, height - token.height);
      token.angle = [-17, 11, -9, 19, -10, 10][index];
      token.vx = 0; token.vy = 0; token.spin = 0;
      constrain(token);
      paint(token);
    });
    activeFrames = 0;
  }

  function tick(now: number) {
    frameId = 0;
    const dt = Math.min((now - lastFrame) / 16.667 || 1, 2);
    lastFrame = now;
    let energy = 0;
    for (const token of tokens) {
      if (token === dragged) continue;
      if (gravity) token.vy += .2 * dt;
      else token.vy *= .997;
      token.vx *= .993;
      token.x += token.vx * dt;
      token.y += token.vy * dt;
      token.angle += token.spin * dt;
      token.spin *= .99;
      constrain(token);
      energy += Math.abs(token.vx) + Math.abs(token.vy);
    }
    for (let a = 0; a < tokens.length; a++) {
      for (let b = a + 1; b < tokens.length; b++) {
        const one = tokens[a], two = tokens[b];
        const dx = two.x + two.width / 2 - one.x - one.width / 2;
        const dy = two.y + two.height / 2 - one.y - one.height / 2;
        const distance = Math.hypot(dx, dy) || 1;
        const minimum = Math.min(one.width,one.height) * .42 + Math.min(two.width,two.height) * .42;
        if (distance >= minimum) continue;
        const nx = dx / distance, ny = dy / distance;
        const overlap = (minimum - distance) / 2;
        if (one !== dragged) { one.x -= nx * overlap; one.y -= ny * overlap; }
        if (two !== dragged) { two.x += nx * overlap; two.y += ny * overlap; }
        const relativeVelocity = (two.vx - one.vx) * nx + (two.vy - one.vy) * ny;
        if (relativeVelocity < 0) {
          const impulse = relativeVelocity * .7;
          if (one !== dragged) { one.vx += impulse * nx; one.vy += impulse * ny; }
          if (two !== dragged) { two.vx -= impulse * nx; two.vy -= impulse * ny; }
        }
      }
    }
    tokens.forEach(token => { constrain(token); paint(token); });
    activeFrames++;
    if (motion && inView && !document.hidden && (dragged || energy > .8) && activeFrames < 800) {
      frameId = requestAnimationFrame(tick);
    }
  }

  function wake() {
    if (!motion || !inView || document.hidden || frameId) return;
    activeFrames = 0;
    lastFrame = performance.now();
    frameId = requestAnimationFrame(tick);
  }

  function stop() { cancelAnimationFrame(frameId); frameId = 0; }

  tokens.forEach(token => {
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      const rect = container.getBoundingClientRect();
      dragged = token;
      token.element.setPointerCapture(event.pointerId);
      dragOffset = { x: event.clientX - rect.left - token.x, y: event.clientY - rect.top - token.y };
      lastPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
      token.vx = token.vy = token.spin = 0;
      token.element.style.zIndex = '10';
      wake();
    }
    function move(event: PointerEvent) {
      if (dragged !== token) return;
      const rect = container.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(8, now - lastPointer.time);
      token.vx = Math.max(-18,Math.min(18,(event.clientX - lastPointer.x) / dt * 12));
      token.vy = Math.max(-18,Math.min(18,(event.clientY - lastPointer.y) / dt * 12));
      token.x = event.clientX - rect.left - dragOffset.x;
      token.y = event.clientY - rect.top - dragOffset.y;
      token.angle += token.vx * .09;
      lastPointer = { x: event.clientX, y: event.clientY, time: now };
      constrain(token); paint(token);
    }
    function up(event: PointerEvent) {
      if (dragged !== token) return;
      dragged = undefined;
      token.spin = token.vx * .08;
      token.element.style.zIndex = '';
      if (token.element.hasPointerCapture(event.pointerId)) token.element.releasePointerCapture(event.pointerId);
      wake();
    }
    function keyboard(event: KeyboardEvent) {
      const keys: Record<string,[number,number]> = { ArrowLeft: [-18,0], ArrowRight: [18,0], ArrowUp: [0,-18], ArrowDown: [0,18] };
      const movement = keys[event.key];
      if (!movement && event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (movement) { token.x += movement[0]; token.y += movement[1]; token.vx = 0; token.vy = 0; }
      else if (motion) { token.vy = -10; token.spin += .7; wake(); }
      else { token.angle += 15; }
      constrain(token); paint(token);
    }
    token.element.addEventListener('pointerdown', down);
    token.element.addEventListener('pointermove', move);
    token.element.addEventListener('pointerup', up);
    token.element.addEventListener('pointercancel', up);
    token.element.addEventListener('keydown', keyboard);
    listeners.push(() => {
      token.element.removeEventListener('pointerdown', down);
      token.element.removeEventListener('pointermove', move);
      token.element.removeEventListener('pointerup', up);
      token.element.removeEventListener('pointercancel', up);
      token.element.removeEventListener('keydown', keyboard);
    });
  });

  const observer = new ResizeObserver(layout);
  observer.observe(container);
  const intersection = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) stop();
  });
  intersection.observe(container);
  function visibility() { if (document.hidden) stop(); }
  document.addEventListener('visibilitychange', visibility);
  layout();

  return {
    reset() { stop(); layout(); },
    setGravity(enabled: boolean) {
      gravity = enabled;
      if (!enabled) tokens.forEach((token, index) => {
        token.vx = index % 2 ? 1.2 : -1.2;
        token.vy = index % 2 ? -1 : .7;
        token.spin = (index % 2 ? 1 : -1) * .12;
      });
      wake();
    },
    shake() {
      if (!motion) {
        tokens.forEach((token,index) => { token.x = (width - token.width) * ((index * .17 + Math.random() * .2) % 1); token.y = (height - token.height) * Math.random(); token.angle = Math.random() * 32 - 16; constrain(token); paint(token); });
        return;
      }
      tokens.forEach(token => { token.vx = (Math.random() - .5) * 16; token.vy = -7 - Math.random() * 9; token.spin = (Math.random() - .5) * 3; });
      wake();
    },
    setMotion(enabled: boolean) { motion = enabled; if (!enabled) stop(); },
    dispose() { stop(); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); listeners.forEach(cleanup => cleanup()); },
  };
}
