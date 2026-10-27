import gsap from 'gsap';

const learningPaths = {
  web: { category: 'THE WEB DEVELOPMENT PATH', title: 'Build the whole stack.', lessons: ['React & Next.js architecture', 'Node.js & MongoDB backends', 'System design fundamentals'] },
  ai: { category: 'THE AI & ML PATH', title: 'Start with a question.', lessons: ['Generative AI engineering', 'LLM application architecture', 'Evaluation & retrieval'] },
  interview: { category: 'THE INTERVIEW PREP PATH', title: 'Think it through.', lessons: ['Data structures & algorithms', 'Reason about systems', 'Practice the conversation'] },
};

const pipelineStages = [
  'Bring the evaluation data together.',
  'Clean the input. Keep the context.',
  'Look for patterns in the numbers.',
  'Flag the unexpected.',
  'Compare the evaluation signals.',
  'Put the findings in context.',
  'Turn observations into insights.',
  'A clearer story, ready to explore.',
];

export function createChapters(initialMotion: boolean) {
  let motion = initialMotion;
  let timer = 0;
  let running = false;
  let stage = 0;
  const cleanups: (() => void)[] = [];
  const animations = new Set<gsap.core.Tween>();
  const pipeline = document.querySelector<HTMLElement>('.case-eval')!;
  const run = document.querySelector<HTMLButtonElement>('#run-pipeline')!;
  const label = document.querySelector<HTMLElement>('#pipeline-label')!;
  const result = document.querySelector<HTMLElement>('#pipeline-result')!;
  const bars = [...document.querySelectorAll<HTMLElement>('.pipeline-progress i')];

  function listen<E extends HTMLElement>(element: E, event: string, callback: EventListener) {
    element.addEventListener(event, callback);
    cleanups.push(() => element.removeEventListener(event, callback));
  }

  function animate(target: gsap.TweenTarget, vars: gsap.TweenVars) {
    const tween = gsap.to(target, { ...vars, onComplete: () => animations.delete(tween) });
    animations.add(tween);
  }

  function finishPipeline() {
    clearTimeout(timer);
    running = false;
    pipeline.classList.remove('is-running');
    bars.forEach(bar => bar.classList.add('complete'));
    label.textContent = 'FLOW COMPLETE / 08 OF 08';
    result.textContent = pipelineStages[7];
    run.disabled = false;
    run.querySelector('span:nth-child(2)')!.textContent = 'Run again';
  }

  function nextStage() {
    if (!running) return;
    bars[stage].classList.add('complete');
    label.textContent = `FOLLOWING THE FLOW / 0${stage + 1} OF 08`;
    result.textContent = pipelineStages[stage];
    stage++;
    if (stage === 8) { finishPipeline(); return; }
    timer = window.setTimeout(nextStage, 520);
  }

  listen(run, 'click', () => {
    bars.forEach(bar => bar.classList.remove('complete'));
    if (!motion) { finishPipeline(); return; }
    running = true;
    stage = 0;
    run.disabled = true;
    run.querySelector('span:nth-child(2)')!.textContent = 'Following the flow';
    pipeline.classList.add('is-running');
    nextStage();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-path]').forEach(button => {
    listen(button, 'click', () => {
      const path = learningPaths[button.dataset.path as keyof typeof learningPaths];
      document.querySelector('#lesson-category')!.textContent = path.category;
      document.querySelector('#lesson-title')!.textContent = path.title;
      const list = document.querySelector('#lesson-list')!;
      list.replaceChildren(...path.lessons.map((lesson, index) => {
        const item = document.createElement('li');
        const number = document.createElement('span');
        const arrow = document.createElement('span');
        number.textContent = `0${index + 1}`;
        arrow.textContent = '↗';
        item.append(number, document.createTextNode(lesson), arrow);
        return item;
      }));
      document.querySelectorAll('[data-path]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (motion) {
        gsap.set('.lesson-preview', { y: 5, opacity: .65 });
        animate('.lesson-preview', { y: 0, opacity: 1, duration: .3, overwrite: true, clearProps: 'transform,opacity' });
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(surface => {
    const object = surface.querySelector<HTMLElement>('.identity-card') || surface;
    listen(surface, 'pointermove', ((event: PointerEvent) => {
      if (!motion || event.pointerType !== 'mouse' || !matchMedia('(pointer: fine)').matches) return;
      const rect = surface.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      animate(object, { rotationY: x * 16 - 10, rotationX: -y * 12, duration: .5, ease: 'power2.out', overwrite: true });
    }) as EventListener);
    listen(surface, 'pointerleave', () => {
      if (!motion) return;
      animate(object, { rotationY: -10, rotationX: 0, duration: .8, ease: 'power3.out', overwrite: true });
    });
  });

  return {
    setMotion(enabled: boolean) {
      motion = enabled;
      if (!enabled) {
        if (running) finishPipeline();
        animations.forEach(tween => tween.kill());
        animations.clear();
        gsap.set('.identity-card, .contact-postcard, .lesson-preview', { clearProps: 'transform,opacity' });
      }
    },
    dispose() {
      clearTimeout(timer);
      animations.forEach(tween => tween.kill());
      cleanups.forEach(cleanup => cleanup());
    },
  };
}
