import { mkdirSync, writeFileSync } from 'node:fs';

// Two original lowercase pencil gestures: an open s and a looped g whose
// descending stroke lifts into the signature's finishing sweep.
const letters = [
  [[50, 33], [49, 24, 38, 24, 31, 30], [22, 37, 28, 42, 38, 44], [50, 47, 48, 54, 40, 59], [30, 65, 18, 63, 17, 56]],
  [[89, 30], [87, 22, 75, 24, 67, 36], [59, 49, 62, 60, 72, 55], [81, 50, 89, 33, 92, 26], [93, 23.6, 93.7, 23.3, 93.2, 26], [90, 43, 85, 65, 77, 79], [70, 91, 57, 91, 57, 82], [58, 72, 82, 66, 118, 56]],
];
const number = value => Number(value.toFixed(2));
function artwork(segments) {
  let previous = segments[0];
  const samples = [];
  for (const coordinates of segments.slice(1)) {
    const [x0, y0] = previous;
    const [x1, y1, x2, y2, x3, y3] = coordinates;
    for (let step = samples.length ? 1 : 0; step <= 32; step++) {
      const t = step / 32, u = 1 - t;
      samples.push({
        x: u ** 3 * x0 + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3,
        y: u ** 3 * y0 + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3,
        dx: 3 * u ** 2 * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t ** 2 * (x3 - x2),
        dy: 3 * u ** 2 * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t ** 2 * (y3 - y2),
      });
    }
    previous = [x3, y3];
  }
  const sides = [1, -1].map(side => samples.map((point, index) => {
    const length = Math.hypot(point.dx, point.dy);
    const progress = index / (samples.length - 1);
    const end = Math.min(1, progress * 9, (1 - progress) * 9);
    const taper = .15 + .85 * end ** 2 * (3 - 2 * end);
    const pressure = (2.2 + .65 * Math.abs(point.dy / length) + .22 * Math.sin(index * .71) + .09 * Math.sin(index * 1.91)) * taper / 2;
    const grain = .065 * Math.sin(index * 1.37);
    return [number(point.x - point.dy / length * (side * pressure + grain)), number(point.y + point.dx / length * (side * pressure + grain))];
  }));
  const outline = [...sides[0], ...sides[1].reverse()];
  return {
    ink: `M${outline.map(point => point.join(' ')).join('L')}Z`,
    drawing: `M${segments[0].join(' ')}${segments.slice(1).map(segment => `C${segment.join(' ')}`).join('')}`,
    grain: samples.filter((_, index) => index % 2 === 0).map((point, index) => {
      const angle = Math.atan2(point.dy, point.dx) * 180 / Math.PI;
      const offset = .95 * Math.sin(index * 2.17);
      const x = number(point.x - point.dy / Math.hypot(point.dx, point.dy) * offset);
      const y = number(point.y + point.dx / Math.hypot(point.dx, point.dy) * offset);
      return `<ellipse cx="${x}" cy="${y}" rx="${number(.08 + .09 * (1 + Math.sin(index * 3.1)))}" ry="${number(.045 + .04 * (1 + Math.cos(index * 1.7)))}" transform="rotate(${number(angle)} ${x} ${y})" fill="black" opacity="${number(.19 + .17 * (1 + Math.sin(index * 2.3)))}"/>`;
    }).join(''),
  };
}
const shapes = letters.map(artwork);
const masks = shapes.map(({ grain }, index) => `<mask id="sg-grain-${index}" maskUnits="userSpaceOnUse" x="0" y="0" width="136" height="96"><rect width="136" height="96" fill="white"/>${grain}</mask>`).join('');
const paths = shapes.map(({ ink, drawing }, index) => `  <g class="monogram-ink" data-drawing="${drawing}"><path fill="currentColor" fill-opacity=".91" d="${ink}" mask="url(#sg-grain-${index})"/></g>`).join('\n');
mkdirSync(new URL('../src/assets/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/assets/sg-monogram.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 96" fill="none" aria-label="sg pencil signature" role="img">\n<defs>${masks}</defs>\n${paths}\n</svg>\n`);
// At tab-icon size, keep the same gestures without subpixel paper grain.
writeFileSync(new URL('../public/favicon.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112"><rect width="112" height="112" rx="22" fill="#eeece4"/><g transform="translate(-12 3)" fill="none" stroke="#292b26" stroke-width="3.4" stroke-linecap="round">${shapes.map(shape => `<path d="${shape.drawing}"/>`).join('')}</g></svg>\n`);
