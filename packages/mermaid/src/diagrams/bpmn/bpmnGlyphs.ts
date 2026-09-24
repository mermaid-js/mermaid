import type { SVG } from '../../diagram-api/types.js';
import type { BpmnModel, BpmnNode } from './bpmnTypes.js';

/**
 * Post-render decoration: BPMN glyphs the base shapes don't carry. Runs after the
 * unified renderer has drawn and positioned the nodes, so it only appends marker
 * paths and external labels relative to each shape's centre — it never moves nodes.
 * Every step is defensive (getBBox may be unavailable under jsdom in unit tests).
 */

// marker markup, centred on the shape origin (0,0)
const MESSAGE = `<rect x="-8" y="-5.5" width="16" height="11" class="bpmn-glyph"/><path d="M-8,-5.5 L0,1 L8,-5.5" class="bpmn-glyph"/>`;
const TIMER = `<circle cx="0" cy="0" r="6.5" class="bpmn-glyph"/><path d="M0,0 L0,-4.5 M0,0 L3,1.5" class="bpmn-glyph"/><path d="M0,-6.5 L0,-5.5 M0,6.5 L0,5.5 M-6.5,0 L-5.5,0 M6.5,0 L5.5,0" class="bpmn-glyph"/>`;

const GATEWAY_MARKER: Record<string, string> = {
  exclusive: `<path d="M-6,-6 L6,6 M-6,6 L6,-6" class="bpmn-glyph bpmn-glyph-bold"/>`,
  parallel: `<path d="M0,-9 L0,9 M-9,0 L9,0" class="bpmn-glyph bpmn-glyph-bold"/>`,
  inclusive: `<circle cx="0" cy="0" r="8" class="bpmn-glyph bpmn-glyph-bold"/>`,
  event: `<polygon points="0,-8 7.6,-2.5 4.7,6.5 -4.7,6.5 -7.6,-2.5" class="bpmn-glyph"/>`,
};

const TASK_ICON: Record<string, string> = {
  user: `<circle cx="0" cy="-3" r="3" class="bpmn-glyph"/><path d="M-4.5,5 C-4.5,-0.5 4.5,-0.5 4.5,5" class="bpmn-glyph"/>`,
  service: `<circle cx="0" cy="0" r="3.4" class="bpmn-glyph"/><path d="M0,-6 L0,-4 M0,6 L0,4 M-6,0 L-4,0 M6,0 L4,0 M-4.2,-4.2 L-2.8,-2.8 M4.2,4.2 L2.8,2.8 M-4.2,4.2 L-2.8,2.8 M4.2,-4.2 L2.8,-2.8" class="bpmn-glyph"/>`,
  script: `<rect x="-4" y="-5.5" width="8" height="11" class="bpmn-glyph"/><path d="M-2,-2.5 L2,-2.5 M-2,0 L2,0 M-2,2.5 L2,2.5" class="bpmn-glyph"/>`,
};

const setMarkup = (parent: any, markup: string, transform?: string): void => {
  try {
    const g = parent.append('g').attr('class', 'bpmn-glyph-layer');
    if (transform) {
      g.attr('transform', transform);
    }
    const el = g.node();
    if (el) {
      el.innerHTML = markup;
    }
  } catch {
    // decoration is best-effort; never break the render
  }
};

const bboxOf = (sel: any): { width: number; height: number } | undefined => {
  try {
    const el = sel.node();
    const box = el?.getBBox?.();
    if (box && Number.isFinite(box.width) && box.width > 0) {
      return { width: box.width, height: box.height };
    }
  } catch {
    /* jsdom */
  }
  return undefined;
};

const externalLabel = (g: any, text: string, belowY: number): void => {
  if (!text) {
    return;
  }
  try {
    const t = g
      .append('text')
      .attr('class', 'bpmn-ext-label')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', belowY);
    t.text(text);
  } catch {
    /* ignore */
  }
};

const decorateEvent = (g: any, node: Extract<BpmnNode, { kind: 'event' }>): void => {
  const circle = g.select('circle');
  const r = Number.parseFloat(circle.attr('r')) || 18;
  if (node.trigger === 'message') {
    setMarkup(g, MESSAGE);
  } else if (node.trigger === 'timer') {
    setMarkup(g, TIMER);
  }
  externalLabel(g, node.label ?? '', r + 14);
};

const decorateGateway = (g: any, node: Extract<BpmnNode, { kind: 'gateway' }>): void => {
  setMarkup(g, GATEWAY_MARKER[node.gateway] ?? GATEWAY_MARKER.exclusive);
  const box = bboxOf(g.select('polygon'));
  const halfH = box ? box.height / 2 : 25;
  externalLabel(g, node.label ?? '', halfH + 14);
};

const decorateTask = (g: any, node: Extract<BpmnNode, { kind: 'task' }>): void => {
  const icon = TASK_ICON[node.subtype];
  if (!icon) {
    return;
  }
  const rect = g.select('rect');
  const w = Number.parseFloat(rect.attr('width')) || 100;
  const h = Number.parseFloat(rect.attr('height')) || 60;
  setMarkup(g, icon, `translate(${-w / 2 + 11}, ${-h / 2 + 11})`);
};

export function decorateBpmn(svg: SVG, diagramId: string, model: BpmnModel): void {
  for (const node of model.nodes) {
    const g = svg.select<SVGGElement>(`g[id="${diagramId}-${node.id}"]`);
    if (g.empty()) {
      continue;
    }
    if (node.kind === 'event') {
      decorateEvent(g, node);
    } else if (node.kind === 'gateway') {
      decorateGateway(g, node);
    } else if (node.kind === 'task') {
      decorateTask(g, node);
    }
  }
}
