import type { Diagram } from '../../Diagram.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { VsmDB, VsmStep, VsmQueue, VsmFlowItem, VsmSummary, VsmDuration } from './types.js';

const STEP_WIDTH = 140;
const MIN_STEP_HEIGHT = 50;
const QUEUE_WIDTH = 60;
const ARROW_WIDTH = 40;
const ENDPOINT_WIDTH = 100;
const ENDPOINT_HEIGHT = 60;
const TIMELINE_HEIGHT = 60;
const PADDING = 20;
const TIMELINE_Y_OFFSET = 30;

function formatDuration(d: VsmDuration): string {
  if (d.max) {
    return `${d.min}-${d.max}`;
  }
  return d.min;
}

export function parseDurationToMinutes(val: string): number {
  const match = /^(\d+)([dhmsw])$/.exec(val);
  if (!match) {
    return 0;
  }
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return num / 60;
    case 'm':
      return num;
    case 'h':
      return num * 60;
    case 'd':
      return num * 60 * 24;
    case 'w':
      return num * 60 * 24 * 7;
    default:
      return 0;
  }
}

function buildOrderedElements(
  flow: VsmFlowItem[],
  steps: VsmStep[],
  queues: VsmQueue[]
): { type: 'endpoint' | 'step' | 'queue' | 'arrow'; data?: any }[] {
  const elements: { type: 'endpoint' | 'step' | 'queue' | 'arrow'; data?: any }[] = [];
  const stepMap = new Map(steps.map((s) => [s.name, s]));
  let queueIndex = 0;

  for (let i = 0; i < flow.length; i++) {
    const item = flow[i];
    if (item.kind === 'endpoint') {
      elements.push({ type: 'endpoint', data: item.data });
    } else {
      const step = stepMap.get(item.name);
      if (step) {
        elements.push({ type: 'step', data: step });
      }
    }

    // Add arrow between items (not after the last)
    if (i < flow.length - 1) {
      elements.push({ type: 'arrow' });
    }

    // Add queue after steps (except the last step before an endpoint)
    if (item.kind === 'process' && queueIndex < queues.length) {
      elements.push({ type: 'queue', data: queues[queueIndex] });
      queueIndex++;
      elements.push({ type: 'arrow' });
    }
  }

  return elements;
}

function drawEndpoint(g: SVGGroup, x: number, y: number, label: string): number {
  const group = g.append('g').attr('transform', `translate(${x}, ${y})`);

  group
    .append('rect')
    .attr('class', 'vsm-endpoint')
    .attr('width', ENDPOINT_WIDTH)
    .attr('height', ENDPOINT_HEIGHT)
    .attr('rx', 5);

  group
    .append('text')
    .attr('class', 'vsm-endpoint-text')
    .attr('x', ENDPOINT_WIDTH / 2)
    .attr('y', ENDPOINT_HEIGHT / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text(label);

  return ENDPOINT_WIDTH;
}

function wrapText(
  textEl: d3.Selection<SVGTextElement, unknown, Element | null, unknown>,
  maxWidth: number
): number {
  const words = textEl.text().split(/\s+/);
  textEl.text(null);

  let line: string[] = [];
  let lineNumber = 0;
  const lineHeight = 14;
  const x = textEl.attr('x');
  const baseY = parseFloat(textEl.attr('y'));

  let tspan = textEl.append('tspan').attr('x', x).attr('dy', '0');

  for (const word of words) {
    line.push(word);
    tspan.text(line.join(' '));
    const node = tspan.node();
    if (node && node.getComputedTextLength() > maxWidth && line.length > 1) {
      line.pop();
      tspan.text(line.join(' '));
      line = [word];
      lineNumber++;
      tspan = textEl.append('tspan').attr('x', x).attr('dy', `${lineHeight}`).text(word);
    }
  }

  const totalLines = lineNumber + 1;

  // Shift the text block up so it's vertically centered around baseY
  if (totalLines > 1) {
    const offset = ((totalLines - 1) * lineHeight) / 2;
    textEl.attr('y', baseY - offset);
  }

  return totalLines;
}

function drawStep(g: SVGGroup, x: number, y: number, step: VsmStep, stepHeight: number): number {
  const group = g.append('g').attr('transform', `translate(${x}, ${y})`);

  group
    .append('rect')
    .attr('class', 'vsm-step')
    .attr('width', STEP_WIDTH)
    .attr('height', stepHeight)
    .attr('rx', 2);

  const titleText = group
    .append('text')
    .attr('class', 'vsm-step-title')
    .attr('x', STEP_WIDTH / 2)
    .attr('y', stepHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text(step.label);

  wrapText(titleText, STEP_WIDTH - 16);

  return STEP_WIDTH;
}

function drawQueue(g: SVGGroup, x: number, y: number, _queue: VsmQueue): number {
  const group = g.append('g').attr('transform', `translate(${x}, ${y})`);
  const w = QUEUE_WIDTH;
  const h = 40;
  const r = 4;

  // Tray shape: U-shaped container with rounded bottom corners
  group
    .append('path')
    .attr('class', 'vsm-queue')
    .attr('d', `M0,0 L0,${h - r} Q0,${h} ${r},${h} L${w - r},${h} Q${w},${h} ${w},${h - r} L${w},0`)
    .attr('fill', 'none');

  return QUEUE_WIDTH;
}

function drawArrow(g: SVGGroup, x: number, y: number, height: number): number {
  const group = g.append('g').attr('transform', `translate(${x}, ${y})`);
  const midY = height / 2;

  group
    .append('line')
    .attr('class', 'vsm-arrow')
    .attr('x1', 0)
    .attr('y1', midY)
    .attr('x2', ARROW_WIDTH - 10)
    .attr('y2', midY);

  // Arrowhead
  group
    .append('polygon')
    .attr('class', 'vsm-arrowhead')
    .attr(
      'points',
      `${ARROW_WIDTH - 10},${midY - 5} ${ARROW_WIDTH},${midY} ${ARROW_WIDTH - 10},${midY + 5}`
    );

  return ARROW_WIDTH;
}

function drawTimeline(
  g: SVGGroup,
  x: number,
  y: number,
  totalWidth: number,
  steps: VsmStep[],
  queues: VsmQueue[],
  stepPositions: { x: number; width: number }[],
  queuePositions: { x: number; width: number }[]
): void {
  const group = g.append('g').attr('transform', `translate(0, ${y})`);

  // Draw the stepped timeline line
  group
    .append('line')
    .attr('class', 'vsm-timeline-line')
    .attr('x1', x)
    .attr('y1', TIMELINE_HEIGHT / 2)
    .attr('x2', x + totalWidth)
    .attr('y2', TIMELINE_HEIGHT / 2);

  // Center queue durations under queue boxes
  for (const [i, queue] of queues.entries()) {
    if (i < queuePositions.length) {
      const pos = queuePositions[i];
      group
        .append('text')
        .attr('class', 'vsm-timeline-queue')
        .attr('x', pos.x + pos.width / 2)
        .attr('y', TIMELINE_HEIGHT / 2 - 8)
        .attr('text-anchor', 'middle')
        .text(formatDuration(queue.value));
    }
  }

  // Center cycle times under step boxes
  for (const [i, step] of steps.entries()) {
    if (step.cycletime && i < stepPositions.length) {
      const pos = stepPositions[i];
      group
        .append('text')
        .attr('class', 'vsm-timeline-process')
        .attr('x', pos.x + pos.width / 2)
        .attr('y', TIMELINE_HEIGHT / 2 + 18)
        .attr('text-anchor', 'middle')
        .text(formatDuration(step.cycletime));
    }
  }
}

export function computeSummaryValues(
  steps: VsmStep[],
  queues: VsmQueue[]
): {
  leadtimeMin: number;
  leadtimeMax: number;
  processtimeMin: number;
  processtimeMax: number;
  wasteMin: number;
  wasteMax: number;
} {
  let processtimeMin = 0;
  let processtimeMax = 0;
  let wasteMin = 0;
  let wasteMax = 0;

  for (const step of steps) {
    if (step.cycletime) {
      processtimeMin += parseDurationToMinutes(step.cycletime.min);
      processtimeMax += parseDurationToMinutes(step.cycletime.max ?? step.cycletime.min);
    }
  }

  for (const queue of queues) {
    wasteMin += parseDurationToMinutes(queue.value.min);
    wasteMax += parseDurationToMinutes(queue.value.max ?? queue.value.min);
  }

  return {
    leadtimeMin: processtimeMin + wasteMin,
    leadtimeMax: processtimeMax + wasteMax,
    processtimeMin,
    processtimeMax,
    wasteMin,
    wasteMax,
  };
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  if (minutes < 60 * 24) {
    return `${(minutes / 60).toFixed(1)}h`;
  }
  if (minutes < 60 * 24 * 7) {
    return `${(minutes / (60 * 24)).toFixed(1)}d`;
  }
  return `${(minutes / (60 * 24 * 7)).toFixed(1)}w`;
}

function formatRange(min: number, max: number): string {
  if (min === max) {
    return formatMinutes(min);
  }
  return `${formatMinutes(min)} - ${formatMinutes(max)}`;
}

function buildSummaryRows(
  summary: VsmSummary,
  steps: VsmStep[],
  queues: VsmQueue[]
): { label: string; value: string }[] {
  const values = computeSummaryValues(steps, queues);
  const items: VsmSummary['items'] = summary.all
    ? ['leadtime', 'processtime', 'waste', 'efficiency']
    : summary.items;

  return items.map((item) => {
    switch (item) {
      case 'leadtime':
        return { label: 'Lead Time', value: formatRange(values.leadtimeMin, values.leadtimeMax) };
      case 'processtime':
        return {
          label: 'Processing Time',
          value: formatRange(values.processtimeMin, values.processtimeMax),
        };
      case 'waste':
        return { label: 'Wait (Waste)', value: formatRange(values.wasteMin, values.wasteMax) };
      case 'efficiency': {
        const worstLeadtime = values.processtimeMin + values.wasteMax;
        const bestLeadtime = values.processtimeMax + values.wasteMin;
        const effMin =
          worstLeadtime > 0 ? ((values.processtimeMin / worstLeadtime) * 100).toFixed(1) : '0';
        const effMax =
          bestLeadtime > 0 ? ((values.processtimeMax / bestLeadtime) * 100).toFixed(1) : '0';
        const val = effMin === effMax ? `${effMin}%` : `${effMin}% - ${effMax}%`;
        return { label: 'Efficiency', value: val };
      }
    }
  });
}

const SUMMARY_BOX_WIDTH = 220;

function drawSummary(
  g: SVGGroup,
  centerX: number,
  y: number,
  summary: VsmSummary,
  steps: VsmStep[],
  queues: VsmQueue[]
): number {
  const rows = buildSummaryRows(summary, steps, queues);
  const rowHeight = 18;
  const boxHeight = rows.length * rowHeight + 12;
  const x = centerX - SUMMARY_BOX_WIDTH / 2;

  const group = g.append('g').attr('transform', `translate(${x}, ${y})`);

  group
    .append('rect')
    .attr('class', 'vsm-data-box')
    .attr('width', SUMMARY_BOX_WIDTH)
    .attr('height', boxHeight)
    .attr('rx', 2);

  for (let r = 0; r < rows.length; r++) {
    const rowY = 16 + r * rowHeight;

    group
      .append('text')
      .attr('class', 'vsm-data-label')
      .attr('x', 8)
      .attr('y', rowY)
      .text(rows[r].label);

    group
      .append('text')
      .attr('class', 'vsm-data-value')
      .attr('x', SUMMARY_BOX_WIDTH - 8)
      .attr('y', rowY)
      .attr('text-anchor', 'end')
      .text(rows[r].value);

    if (r < rows.length - 1) {
      group
        .append('line')
        .attr('class', 'vsm-data-divider')
        .attr('x1', 4)
        .attr('y1', rowY + 6)
        .attr('x2', SUMMARY_BOX_WIDTH - 4)
        .attr('y2', rowY + 6);
    }
  }

  return boxHeight;
}

function drawDataBoxes(
  g: SVGGroup,
  y: number,
  steps: VsmStep[],
  stepPositions: { x: number; width: number }[]
): number {
  const rowHeight = 18;
  const rows = [
    {
      label: 'Cycle Time',
      getValue: (s: VsmStep) => (s.cycletime ? formatDuration(s.cycletime) : '-'),
    },
    {
      label: 'Changeover',
      getValue: (s: VsmStep) => (s.changeover ? formatDuration(s.changeover) : '-'),
    },
    { label: 'Uptime', getValue: (s: VsmStep) => (s.uptime !== undefined ? `${s.uptime}%` : '-') },
    { label: 'Batch', getValue: (s: VsmStep) => (s.batch !== undefined ? `${s.batch}` : '-') },
    { label: 'Flow', getValue: (s: VsmStep) => (s.flowType ? s.flowType.toUpperCase() : '-') },
  ];
  const boxHeight = rows.length * rowHeight + 12;
  const labelX = 8;
  const valueX = (pos: { width: number }) => pos.width - 8;

  for (const [i, step] of steps.entries()) {
    if (i >= stepPositions.length) {
      break;
    }
    const pos = stepPositions[i];
    const group = g.append('g').attr('transform', `translate(${pos.x}, ${y})`);

    group
      .append('rect')
      .attr('class', 'vsm-data-box')
      .attr('width', pos.width)
      .attr('height', boxHeight)
      .attr('rx', 2);

    for (let r = 0; r < rows.length; r++) {
      const rowY = 16 + r * rowHeight;

      // Heading (bold, left-aligned)
      group
        .append('text')
        .attr('class', 'vsm-data-label')
        .attr('x', labelX)
        .attr('y', rowY)
        .text(rows[r].label);

      // Value (right-aligned)
      group
        .append('text')
        .attr('class', 'vsm-data-value')
        .attr('x', valueX(pos))
        .attr('y', rowY)
        .attr('text-anchor', 'end')
        .text(rows[r].getValue(step));

      // Row separator (except after last row)
      if (r < rows.length - 1) {
        group
          .append('line')
          .attr('class', 'vsm-data-divider')
          .attr('x1', 4)
          .attr('y1', rowY + 6)
          .attr('x2', pos.width - 4)
          .attr('y2', rowY + 6);
      }
    }
  }

  return boxHeight;
}

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const vsmDb = diagram.db as VsmDB;
  const flow = vsmDb.getFlow();
  const steps = vsmDb.getSteps();
  const queues = vsmDb.getQueues();
  const summary = vsmDb.getSummary();
  const title = vsmDb.getDiagramTitle();

  const svg: SVG = selectSvgElement(id);
  const g = svg.append('g').attr('class', 'vsm');

  // Measure step labels to compute dynamic step height based on text wrapping
  let maxLines = 1;
  if (steps.length > 0) {
    const measureText = g
      .append('text')
      .attr('class', 'vsm-step-title')
      .attr('visibility', 'hidden');
    for (const step of steps) {
      measureText.text(step.label);
      const lines = wrapText(measureText, STEP_WIDTH - 16);
      if (lines > maxLines) {
        maxLines = lines;
      }
      // Reset for next measurement
      measureText.selectAll('tspan').remove();
      measureText.text(step.label);
    }
    measureText.remove();
  }
  const stepHeight = Math.max(MIN_STEP_HEIGHT, 20 + maxLines * 16 + 10);

  let currentX = PADDING;
  const currentY = PADDING + (title ? 30 : 0);

  // Title is drawn after layout so we can center it

  // Build and draw ordered elements, tracking positions for the timeline
  const elements = buildOrderedElements(flow, steps, queues);
  const stepPositions: { x: number; width: number }[] = [];
  const queuePositions: { x: number; width: number }[] = [];

  for (const element of elements) {
    switch (element.type) {
      case 'endpoint':
        currentX +=
          drawEndpoint(
            g,
            currentX,
            currentY + (stepHeight - ENDPOINT_HEIGHT) / 2,
            element.data.label
          ) + 5;
        break;
      case 'step':
        stepPositions.push({ x: currentX, width: STEP_WIDTH });
        currentX += drawStep(g, currentX, currentY, element.data, stepHeight) + 5;
        break;
      case 'queue':
        queuePositions.push({ x: currentX, width: QUEUE_WIDTH });
        currentX += drawQueue(g, currentX, currentY + (stepHeight - 55) / 2, element.data) + 5;
        break;
      case 'arrow':
        currentX += drawArrow(g, currentX, currentY, stepHeight) + 5;
        break;
    }
  }

  const totalWidth = currentX + PADDING;
  let totalHeight = currentY + stepHeight + PADDING;

  // Draw title centered
  if (title) {
    g.append('text')
      .attr('class', 'vsm-title')
      .attr('x', totalWidth / 2)
      .attr('y', PADDING + 10)
      .attr('text-anchor', 'middle')
      .text(title);
  }

  // Draw timeline
  if (steps.length > 0 && queues.length > 0) {
    drawTimeline(
      g,
      PADDING,
      totalHeight,
      totalWidth - 2 * PADDING,
      steps,
      queues,
      stepPositions,
      queuePositions
    );
    totalHeight += TIMELINE_HEIGHT + TIMELINE_Y_OFFSET;
  }

  // Draw data boxes below the timeline only if any step has more than just cycletime
  const hasExtraMetrics = steps.some(
    (s) => s.changeover || s.uptime !== undefined || s.batch !== undefined || s.flowType
  );
  if (steps.length > 0 && hasExtraMetrics) {
    const dataBoxHeight = drawDataBoxes(g, totalHeight, steps, stepPositions);
    if (dataBoxHeight > 0) {
      totalHeight += dataBoxHeight + PADDING;
    }
  }

  // Draw summary centered at the bottom
  if (summary) {
    const summaryHeight = drawSummary(g, totalWidth / 2, totalHeight, summary, steps, queues);
    totalHeight += summaryHeight + PADDING;
  }

  totalHeight += PADDING;

  configureSvgSize(svg, totalHeight, totalWidth, true);
  svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
};

export const renderer: DiagramRenderer = { draw };
