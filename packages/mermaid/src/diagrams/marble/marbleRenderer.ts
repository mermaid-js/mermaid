import rough from 'roughjs';
import type { Diagram } from '../../Diagram.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { createRoundedRectPathD } from '../../rendering-util/rendering-elements/shapes/roundedRectPath.js';
import { setupViewPortForSVG } from '../../rendering-util/setupViewPortForSVG.js';
import {
  FONT_SIZE,
  PALETTE_SIZE,
  groupedTerminalShift,
  labelRowOffset,
  layoutMarble,
  stackOffset,
  stackPitch,
} from './marbleLayout.js';
import type { LaidOutLane, MarbleLayout } from './marbleLayout.js';
import type { MarbleDB, MarbleItem, MarbleLabel, MarbleSpanItem } from './marbleTypes.js';
import { eventColors, spanColors } from './styles.js';

export const colorClass = (label: MarbleLabel | undefined): string =>
  label ? ` marble-color-${label.colorIndex % PALETTE_SIZE}` : '';

type ThemeVariables = Record<string, string | undefined>;

/**
 * Draws through rough.js in hand-drawn mode and as plain SVG otherwise. Rough.js needs
 * concrete colours, so in that mode they are read from the theme variables, the same
 * values the stylesheet uses.
 */
class Pen {
  private readonly rough: ReturnType<typeof rough.svg> | undefined;

  constructor(
    svg: SVG,
    private readonly themeVariables: ThemeVariables,
    private readonly seed: number,
    handDrawn: boolean
  ) {
    this.rough = handDrawn ? rough.svg(svg.node()!) : undefined;
  }

  /** Stroke and fill for an element, by its marble role and palette slot. */
  private colors(role: 'line' | 'event' | 'span' | 'terminal', label?: MarbleLabel) {
    const v = this.themeVariables;
    const slot = label ? label.colorIndex % PALETTE_SIZE : undefined;
    switch (role) {
      case 'event': {
        if (slot === undefined) {
          return { stroke: v.marbleEventStroke, fill: v.marbleEventFill };
        }
        const { stroke, fill } = eventColors(v, slot);
        return { stroke, fill };
      }
      case 'span': {
        const { stroke, fill } = spanColors(v, slot);
        return { stroke, fill };
      }
      case 'line':
        return { stroke: v.marbleLaneColor, fill: undefined };
      case 'terminal':
        return { stroke: v.marbleCompleteColor, fill: undefined };
    }
  }

  private roughOptions(role: Parameters<Pen['colors']>[0], label?: MarbleLabel) {
    const { stroke, fill } = this.colors(role, label);
    return {
      roughness: 0.7,
      seed: this.seed,
      stroke: stroke ?? 'currentColor',
      fill,
      fillStyle: 'solid',
      strokeWidth: role === 'line' ? 1.5 : 1,
    };
  }

  line(
    group: SVGGroup,
    className: string,
    [x1, y1, x2, y2]: [number, number, number, number],
    role: 'line' | 'terminal' = 'line'
  ) {
    if (this.rough) {
      const node = this.rough.line(x1, y1, x2, y2, this.roughOptions(role));
      node.setAttribute('class', className);
      group.node()?.appendChild(node);
      return;
    }
    group
      .append('line')
      .attr('class', className)
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
  }

  circle(
    group: SVGGroup,
    className: string,
    cx: number,
    cy: number,
    r: number,
    label?: MarbleLabel
  ) {
    if (this.rough) {
      const node = this.rough.circle(cx, cy, r * 2, this.roughOptions('event', label));
      node.setAttribute('class', className);
      group.node()?.appendChild(node);
      return;
    }
    group.append('circle').attr('class', className).attr('cx', cx).attr('cy', cy).attr('r', r);
  }

  rect(
    group: SVGGroup,
    className: string,
    [x, y, width, height]: [number, number, number, number],
    label?: MarbleLabel
  ) {
    const radius = Math.min(height, width) / 2;
    if (this.rough) {
      // A pill, like the plain rect with rx below; rough.rectangle would square it off.
      const node = this.rough.path(
        createRoundedRectPathD(x, y, width, height, radius),
        this.roughOptions('span', label)
      );
      node.setAttribute('class', className);
      group.node()?.appendChild(node);
      return;
    }
    group
      .append('rect')
      .attr('class', className)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', radius);
  }

  /** An unfilled rounded box, such as the bracket around a `( )` group. */
  outline(
    group: SVGGroup,
    className: string,
    [x, y, width, height]: [number, number, number, number],
    radius: number
  ) {
    if (this.rough) {
      const node = this.rough.path(createRoundedRectPathD(x, y, width, height, radius), {
        ...this.roughOptions('line'),
        strokeWidth: 1,
      });
      node.setAttribute('class', className);
      group.node()?.appendChild(node);
      return;
    }
    group
      .append('rect')
      .attr('class', className)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', radius);
  }
}

/** `^`: a short upright stroke across the lane with a caret beneath it. */
const drawSubscribe = (group: SVGGroup, cx: number, cy: number, extent: number) => {
  const bottom = cy + extent + 2;
  group
    .append('path')
    .attr('class', 'marble-subscribe-mark')
    .attr(
      'd',
      `M${cx} ${cy - extent - 2} L${cx} ${bottom} M${cx - 4} ${bottom + 5} L${cx} ${bottom} L${cx + 4} ${bottom + 5}`
    );
};

const drawSpan = (
  group: SVGGroup,
  pen: Pen,
  item: MarbleSpanItem,
  laid: LaidOutLane,
  layout: MarbleLayout,
  label: MarbleLabel | undefined,
  height: number
) => {
  const x1 = layout.x(item.from);
  const x2 = layout.x(item.to);
  const g = group
    .append('g')
    .attr('class', `marble-span marble-span-${item.end}${colorClass(label)}`)
    .attr('data-symbol', item.symbol);
  pen.rect(g, 'marble-span-body', [x1, laid.y - height / 2, Math.max(0, x2 - x1), height], label);
  if (item.subscription) {
    drawSubscribe(g, x1, laid.y, height / 2);
  }
  if (item.end === 'open') {
    const tip = x2 - 4;
    g.append('path')
      .attr('class', 'marble-span-arrow')
      .attr('d', `M${tip - 10} ${laid.y - 4} l4 4 l-4 4 M${tip - 5} ${laid.y - 4} l4 4 l-4 4`);
  }
  if (label && laid.innerSpanLabels.has(item)) {
    g.append('text')
      .attr('class', 'marble-span-label')
      .attr('x', (x1 + x2) / 2 - (item.end === 'open' ? 6 : 0))
      .attr('y', laid.y)
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'middle')
      .text(label.text);
  }
};

const cross = (cx: number, cy: number, size: number) =>
  `M${cx - size} ${cy - size} L${cx + size} ${cy + size} M${cx + size} ${cy - size} L${cx - size} ${cy + size}`;

const drawTerminal = (
  group: SVGGroup,
  pen: Pen,
  item: Extract<MarbleItem, { kind: 'complete' | 'error' | 'cancel' }>,
  laid: LaidOutLane,
  layout: MarbleLayout,
  radius: number
) => {
  // A terminal in a `( )` group happens in the same frame as the group's values, so it is
  // drawn just after the stack rather than on top of it.
  const cx = layout.x(item.col) + (item.grouped ? groupedTerminalShift(radius) : 0);
  const g = group.append('g').attr('class', `marble-${item.kind}`).attr('data-col', item.col);
  if (item.kind === 'complete') {
    pen.line(g, 'marble-complete-bar', [cx, laid.y - radius, cx, laid.y + radius], 'terminal');
    return;
  }
  const size = item.kind === 'error' ? radius * 0.7 : radius * 0.55;
  g.append('path')
    .attr('class', `marble-${item.kind}-mark`)
    .attr('d', cross(cx, laid.y, size));
};

const drawBreaks = (group: SVGGroup, laid: LaidOutLane, layout: MarbleLayout, breaks: number[]) => {
  for (const col of breaks) {
    if (!laid.lane.segments.some(({ from, to }) => from <= col && col <= to)) {
      continue;
    }
    breakMark(group, 'marble-break', layout.x(col), laid.y).attr('data-col', col);
  }
};

/** The `//` mark of a break in time, over a gap in the lane line. */
const breakMark = (group: SVGGroup, className: string, cx: number, cy: number) => {
  const g = group.append('g').attr('class', className);
  g.append('rect')
    .attr('class', 'marble-break-gap')
    .attr('x', cx - 4)
    .attr('y', cy - 3)
    .attr('width', 8)
    .attr('height', 6);
  g.append('path')
    .attr('class', 'marble-break-mark')
    .attr(
      'd',
      `M${cx - 7} ${cy + 7} L${cx - 1} ${cy - 7} M${cx + 1} ${cy + 7} L${cx + 7} ${cy - 7}`
    );
  return g;
};

const drawLane = (
  svg: SVG,
  pen: Pen,
  laid: LaidOutLane,
  layout: MarbleLayout,
  db: MarbleDB,
  breaks: number[]
) => {
  const { marbleRadius: radius, laneLabelGap } = db.getConfig();
  const { lane } = laid;
  const group = svg.append('g').attr('class', 'marble-lane').attr('data-lane', lane.name);

  group
    .append('text')
    .attr('class', 'marble-lane-label')
    .attr('x', layout.left - laneLabelGap - radius)
    .attr('y', laid.y)
    .attr('dominant-baseline', 'central')
    .attr('text-anchor', 'end')
    .text(lane.name);

  for (const { from, to } of lane.segments) {
    if (to > from) {
      pen.line(group, 'marble-lane-line', [layout.x(from), laid.y, layout.x(to), laid.y]);
    }
  }
  drawBreaks(group, laid, layout, breaks);
  for (const item of lane.items) {
    if (item.kind === 'span') {
      drawSpan(group, pen, item, laid, layout, db.getLabel(item.symbol), radius * 1.6);
    }
  }
  for (const item of lane.items) {
    if (item.kind === 'time') {
      // RxJS time progression: drawn like a `/` break on this lane, its duration as a label.
      breakMark(group, 'marble-break marble-time', layout.x(item.col), laid.y)
        .attr('data-col', item.col)
        .attr('data-duration', item.text);
    }
  }

  for (const item of lane.items) {
    if (item.kind === 'complete' || item.kind === 'error' || item.kind === 'cancel') {
      drawTerminal(group, pen, item, laid, layout, radius);
    }
  }
  for (const item of lane.items) {
    if (item.kind === 'subscribe') {
      const g = group.append('g').attr('class', 'marble-subscribe').attr('data-col', item.col);
      drawSubscribe(g, layout.x(item.col), laid.y, radius);
    }
    if (item.kind === 'group') {
      const half = item.size > 1 ? ((item.size - 1) * stackPitch(radius)) / 2 + radius : radius;
      const cx = layout.x(item.col);
      const g = group
        .append('g')
        .attr('class', 'marble-group')
        .attr('data-col', item.col)
        .attr('data-size', item.size);
      pen.outline(
        g,
        'marble-group-box',
        [cx - radius - 3, laid.y - half - 3, 2 * radius + 6, 2 * half + 6],
        radius + 3
      );
    }
  }
  for (const item of lane.items) {
    if (item.kind !== 'event') {
      continue;
    }
    const label = db.getLabel(item.symbol);
    const cx = layout.x(item.col);
    const cy = laid.y + (item.stack ? stackOffset(item.stack.index, item.stack.size, radius) : 0);
    const g = group
      .append('g')
      .attr('class', `marble-event${colorClass(label)}`)
      .attr('data-symbol', item.symbol)
      .attr('data-col', item.col);
    pen.circle(g, 'marble-event-circle', cx, cy, radius, label);
    g.append('text')
      .attr('class', 'marble-event-symbol')
      .attr('x', cx)
      .attr('y', cy)
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'middle')
      .text(item.symbol);
  }

  for (const placed of laid.labels) {
    const offset = labelRowOffset(placed.row, laid.extent);
    const g = group
      .append('g')
      .attr(
        'class',
        `marble-label${placed.colorIndex === undefined ? '' : ` marble-color-${placed.colorIndex % PALETTE_SIZE}`}`
      );
    if (placed.row > 1) {
      g.append('line')
        .attr('class', 'marble-label-leader')
        .attr('x1', placed.anchorX)
        .attr('y1', laid.y + laid.extent + 2)
        .attr('x2', placed.anchorX)
        .attr('y2', laid.y + offset - FONT_SIZE.label);
    }
    g.append('text')
      .attr('class', 'marble-label-text')
      .attr('x', placed.x)
      .attr('y', laid.y + offset)
      .attr('text-anchor', 'middle')
      .text(placed.text);
  }
};

export const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as MarbleDB;
  const config = db.getConfig();
  const { themeVariables, look, handDrawnSeed } = getConfig();
  const title = db.getDiagramTitle();
  const timeline = db.getTimeline();
  const layout = layoutMarble(timeline, db.getLabels(), config, title);

  const svg: SVG = selectSvgElement(id);
  const pen = new Pen(
    svg,
    (themeVariables ?? {}) as ThemeVariables,
    handDrawnSeed ?? 0,
    look === 'handDrawn'
  );

  if (layout.axisY !== undefined) {
    const axis = svg.append('g').attr('class', 'marble-axis');
    for (const tick of timeline.ticks) {
      const x = layout.x(tick.col);
      axis
        .append('line')
        .attr('class', 'marble-grid')
        .attr('x1', x)
        .attr('y1', layout.top - 6)
        .attr('x2', x)
        .attr('y2', layout.bottom);
      axis
        .append('text')
        .attr('class', 'marble-tick')
        .attr('x', x)
        .attr('y', layout.axisY)
        .attr('dominant-baseline', 'hanging')
        .attr('text-anchor', 'middle')
        .text(tick.text);
    }
  }

  for (const laid of layout.lanes) {
    drawLane(svg, pen, laid, layout, db, timeline.breaks);
  }

  if (layout.titleY !== undefined) {
    svg
      .append('text')
      .attr('class', 'marble-title')
      .attr('x', (layout.left + layout.right) / 2)
      .attr('y', layout.titleY)
      .attr('dominant-baseline', 'hanging')
      .attr('text-anchor', 'middle')
      .text(title);
  }

  setupViewPortForSVG(svg, config.padding, 'marbleDiagram', config.useMaxWidth);
};

export const renderer: DiagramRenderer = { draw };
