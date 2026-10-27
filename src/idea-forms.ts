/** Shared project geometry becomes connected, extruded panels in the 3D desk. */
const roundedBox = (x: number, y: number, width: number, height: number, radius = 6) =>
  `M${x + radius} ${y}H${x + width - radius}Q${x + width} ${y} ${x + width} ${y + radius}V${y + height - radius}Q${x + width} ${y + height} ${x + width - radius} ${y + height}H${x + radius}Q${x} ${y + height} ${x} ${y + height - radius}V${y + radius}Q${x} ${y} ${x + radius} ${y}Z`;

const ink = (id: string, path: string, connection = false) =>
  `<path data-ink data-ink-id="${id}" class="${connection ? 'idea-form-connection' : 'idea-form-outline'}" d="${path}"/>`;

function panel(id: string, x: number, y: number, width: number, height: number, content: string, tone = 'paper', kind = '') {
  return `<g class="idea-form-panel" data-panel-box="${x},${y},${width},${height}" data-panel-tone="${tone}" ${kind ? `data-project-node="${kind}"` : ''}>
    <g class="idea-form-surface" data-reveal-for="${id}"><rect class="idea-form-fill fill-${tone}" x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 2}" rx="5"/>${content}</g>
    ${ink(id, roundedBox(x, y, width, height))}
  </g>`;
}

const label = (x: number, y: number, text: string, className = '') =>
  `<text x="${x}" y="${y}" class="idea-form-label ${className}">${text}</text>`;
const rule = (x: number, y: number, width: number) =>
  `<path class="idea-form-rule" d="M${x} ${y}h${width}"/>`;

export function signalForm() {
  const input = panel('evaluation-input', 14, 88, 118, 132,
    `${label(27, 112, 'INPUT', 'label-eyebrow')}${label(27, 141, 'Evaluation', 'label-title')}${label(27, 161, 'data', 'label-title')}${rule(27, 177, 91)}${label(27, 200, 'CSV / RESULTS', 'label-small')}`,
  );
  const rows = [54, 102, 150, 198];
  const agents = rows.map((y, row) => {
    const first = row * 2 + 1;
    return `${ink(`agent-input-${row}`, `M148 ${y + 19}H168`, true)}
      ${panel(`agent-${first}`, 168, y, 76, 38, label(206, y + 25, `0${first}`, 'label-agent'), 'lilac', 'agent')}
      ${ink(`agent-pair-${row}`, `M244 ${y + 19}H258`, true)}
      ${panel(`agent-${first + 1}`, 258, y, 76, 38, label(296, y + 25, `0${first + 1}`, 'label-agent'), 'lilac', 'agent')}
      ${ink(`agent-output-${row}`, `M334 ${y + 19}H357`, true)}`;
  }).join('');
  return `<g class="idea-project-diagram diagram-agents">
    ${label(14, 27, 'EVALUATION WORKFLOW', 'label-eyebrow')}${label(168, 273, '08 COORDINATED AGENTS', 'label-small')}
    ${input}${ink('input-bus', 'M132 154H148M148 73V217', true)}${agents}
    ${ink('output-bus', 'M357 73V217M357 154H384', true)}
    ${panel('evaluation-output', 384, 77, 122, 154,
      `${label(397, 102, 'OUTPUT', 'label-eyebrow')}${label(397, 133, 'Findings', 'label-title')}${rule(397, 148, 96)}<rect class="idea-form-result" x="397" y="163" width="71" height="7" rx="2"/><rect class="idea-form-result" x="397" y="180" width="93" height="7" rx="2"/><rect class="idea-form-result" x="397" y="197" width="53" height="7" rx="2"/>`, 'sage')}
    ${label(14, 273, 'RAW RESULTS', 'label-small')}${label(384, 273, 'USEFUL INSIGHT', 'label-small')}
  </g>`;
}

export function learningForm() {
  return `<g class="idea-project-diagram diagram-learning">
    ${label(14, 27, 'A PATH FROM LEARNING TO MAKING', 'label-eyebrow')}
    ${panel('learning-foundation', 14, 64, 146, 176,
      `${label(28, 89, '01 / FOUNDATIONS', 'label-eyebrow')}${label(28, 121, 'Understand.', 'label-title')}${rule(28, 137, 116)}${label(28, 160, 'HTML & the web', 'label-body')}${label(28, 182, 'Structure + style', 'label-body')}<rect class="idea-form-result" x="28" y="207" width="35" height="6" rx="2"/><rect class="idea-form-muted" x="68" y="207" width="76" height="6" rx="2"/>`, 'paper', 'course')}
    ${ink('learning-connection-one', 'M160 152H187', true)}
    ${panel('learning-practice', 187, 64, 146, 176,
      `${label(201, 89, '02 / PRACTICE', 'label-eyebrow')}${label(201, 121, 'Try it.', 'label-title')}${rule(201, 137, 116)}${label(201, 160, 'Small exercises', 'label-body')}${label(201, 182, 'A working idea', 'label-body')}<rect class="idea-form-result" x="201" y="207" width="76" height="6" rx="2"/><rect class="idea-form-muted" x="282" y="207" width="35" height="6" rx="2"/>`, 'sage', 'course')}
    ${ink('learning-connection-two', 'M333 152H360', true)}
    ${panel('learning-project', 360, 64, 146, 176,
      `${label(374, 89, '03 / BUILD', 'label-eyebrow')}${label(374, 121, 'Make it yours.', 'label-title')}${rule(374, 137, 116)}${label(374, 160, 'Your first project', 'label-body')}${label(374, 182, 'The next chapter', 'label-body')}<rect class="idea-form-result" x="374" y="207" width="116" height="6" rx="2"/>`, 'sage', 'course')}
    ${label(14, 273, 'ONE CLEAR STEP AT A TIME', 'label-small')}
  </g>`;
}

export function evaluationForm() {
  return `<g class="idea-project-diagram diagram-evaluation">
    ${label(14, 27, 'WILDCLAWBENCH / OPENCLAW', 'label-eyebrow')}
    ${panel('eval-routing', 14, 70, 146, 164,
      `${label(28, 96, '01 / ROUTE', 'label-eyebrow')}${label(28, 128, 'LiteLLM', 'label-title')}${rule(28, 145, 116)}${label(28, 169, 'Model providers', 'label-body')}${label(28, 193, 'Cost + caching', 'label-body')}`, 'paper', 'routing')}
    ${ink('route-to-run', 'M160 152H187', true)}
    ${panel('eval-environment', 187, 70, 146, 164,
      `${label(201, 96, '02 / EXECUTE', 'label-eyebrow')}${label(201, 128, 'Agent runs', 'label-title')}${rule(201, 145, 116)}${label(201, 169, '101 mock services', 'label-body')}${label(201, 193, 'State drift', 'label-body')}`, 'lilac', 'environment')}
    ${ink('run-to-grade', 'M333 152H360', true)}
    ${panel('eval-council', 360, 70, 146, 164,
      `${label(374, 96, '03 / GRADE', 'label-eyebrow')}${label(374, 128, '3 judges', 'label-title')}${rule(374, 145, 116)}${label(374, 169, 'Evidence budgets', 'label-body')}${label(374, 193, 'Weighted pytest', 'label-body')}`, 'sage', 'council')}
    ${label(14, 273, 'INTERNAL PLATFORM / ETHARA AI', 'label-small')}
  </g>`;
}
