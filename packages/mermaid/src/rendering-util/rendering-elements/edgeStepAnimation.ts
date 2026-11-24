import { select } from 'd3';
import type { Selection } from 'd3';
// @ts-expect-error Incorrect khroma types
import { channel } from 'khroma';
import { EDGE_STEP_DURATION, getStepDuration, isStepEdge } from '../edgeStep.js';
import type { Edge } from '../types.js';
import type { SVGGroup } from '../../diagram-api/types.js';
import utils from '../../utils.js';

/** Where along an edge the step badge may sit, as fractions of its length, in order of preference. */
export const STEP_BADGE_FRACTIONS = [0.25, 0.35, 0.15, 0.65, 0.75, 0.5, 0.85, 0.1, 0.9];

/** Badge radius in diagram units; the badge keeps this size whatever the edge length. */
export const STEP_BADGE_RADIUS = 9;
/** Badge text size in diagram units. */
export const STEP_BADGE_FONT_SIZE = 11;

const STEP_BADGE_GAP = 2;
const STEP_BADGE_FALLBACK_FILL = '#333333';
const STEP_ARROWHEAD_LENGTH = 12;
const STEP_ARROWHEAD_HALF_WIDTH = 6;
const STEP_BADGE_OFFSET = 14;
const STEP_TANGENT_STEP = 0.01;
const MIN_TEXT_CONTRAST = 4.5;
const TRANSLATE = /translate\(\s*(-?[\d.e]+)[\s,]+(-?[\d.e]+)/i;

interface PathPoint {
  x: number;
  y: number;
}

/** Something on the diagram the badge must not cover: a box around a centre. */
export interface BadgeObstacle extends PathPoint {
  halfWidth: number;
  halfHeight: number;
}

interface PathGeometry {
  getTotalLength?: () => number;
  getPointAtLength?: (distance: number) => PathPoint;
}

export interface StepBadgeOptions {
  points: PathPoint[];
  pathNode?: PathGeometry | null;
  color?: string;
  textColors?: (string | undefined)[];
}

/** Stroke width of the highlight drawn over the edge while its step plays. */
export const STEP_HIGHLIGHT_STROKE_WIDTH = 4;
/** Stroke opacity of the step highlight, so the edge line stays visible under it. */
export const STEP_HIGHLIGHT_STROKE_OPACITY = 0.6;
/** Radius of the dot that travels along a step edge. */
export const STEP_DOT_RADIUS = 4;

export interface EdgeStepTiming {
  begin: number;
  dur: number;
  gap: number;
}

/** When the dot for `step` starts, how long it runs, and how long it waits before the next loop. */
export const getEdgeStepTiming = (
  step: number,
  stepCount: number,
  stepDuration = EDGE_STEP_DURATION
): EdgeStepTiming => {
  const count = Math.max(stepCount, step);
  return {
    begin: (step - 1) * stepDuration,
    dur: stepDuration,
    gap: (count - 1) * stepDuration,
  };
};

/** A distinct id safe in animation `begin` references: starts with a letter, keeps letters and digits, encodes every other character as `_hex_`. */
export const toAnimationId = (value: string) =>
  `step_${Array.from(value, (char) =>
    /[\dA-Za-z]/.test(char) ? char : `_${(char.codePointAt(0) ?? 0).toString(16)}_`
  ).join('')}`;

const pathStartTranslate = (pathData: string) => {
  const start = /^m\s*(-?[\d.e]+)[\s,]+(-?[\d.e]+)/i.exec(pathData.trim());
  return start ? `translate(${start[1]},${start[2]}) ` : '';
};

const escapeCssIdentifierFallback = (value: string) =>
  Array.from(value, (char, index) => {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0) {
      return '\uFFFD';
    }
    const isControl = code <= 0x1f || code === 0x7f;
    const isLeadingDigit =
      /\d/.test(char) && (index === 0 || (index === 1 && value.startsWith('-')));
    if (isControl || isLeadingDigit) {
      return `\\${code.toString(16)} `;
    }
    if (value === '-') {
      return '\\-';
    }
    return code >= 0x80 || /[\w-]/.test(char) ? char : `\\${char}`;
  }).join('');

/** Escapes a string for use as a CSS identifier, using `CSS.escape` when the environment has it. */
export const escapeCssIdentifier = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : escapeCssIdentifierFallback(value);

const ensureReducedMotionStyle = (elem: SVGGroup, diagramId: string) => {
  const node = elem.node();
  const svg = node?.ownerSVGElement ?? node?.closest?.('svg') ?? node;
  const scopeId = diagramId || svg?.getAttribute('id');
  // Never emit an unscoped rule: it would hide the dots of every other diagram on the page.
  if (!svg || !scopeId || svg.querySelector('style.edge-step-style')) {
    return;
  }
  const scope = `#${escapeCssIdentifier(scopeId)} `;
  // Appended as a raw <style>, outside compileCSS/stylis, so it must carry the diagram id scope itself.
  const style = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.setAttribute('class', 'edge-step-style');
  style.textContent = `@media (prefers-reduced-motion: reduce) { ${scope}.edge-step-dot, ${scope}.edge-step-highlight { display: none; } }`;
  svg.appendChild(style);
};

/** The point `fraction` of the way along the polyline through `points`, by length. */
export const pointAlongPolyline = (
  points: PathPoint[],
  fraction: number
): PathPoint | undefined => {
  const valid = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (valid.length === 0) {
    return undefined;
  }
  const lengths = valid
    .slice(1)
    .map((point, index) => Math.hypot(point.x - valid[index].x, point.y - valid[index].y));
  let remaining = lengths.reduce((total, length) => total + length, 0) * fraction;
  for (const [index, length] of lengths.entries()) {
    if (remaining <= length && length > 0) {
      const ratio = remaining / length;
      const from = valid[index];
      const to = valid[index + 1];
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
    }
    remaining -= length;
  }
  return valid[valid.length - 1];
};

/** Samples the rendered path by length, falling back to the routed points when it has no geometry. */
export const createPathSampler = (points: PathPoint[], pathNode?: PathGeometry | null) => {
  const length = typeof pathNode?.getTotalLength === 'function' ? pathNode.getTotalLength() : 0;
  const getPoint = pathNode?.getPointAtLength?.bind(pathNode);
  if (length > 0 && getPoint) {
    return (fraction: number): PathPoint | undefined => {
      const { x, y } = getPoint(length * fraction);
      return { x, y };
    };
  }
  return (fraction: number) => pointAlongPolyline(points, fraction);
};

const roomAround = (point: PathPoint, obstacles: BadgeObstacle[]) =>
  Math.min(
    Number.POSITIVE_INFINITY,
    ...obstacles.map((obstacle) => {
      const dx = Math.max(Math.abs(point.x - obstacle.x) - obstacle.halfWidth, 0);
      const dy = Math.max(Math.abs(point.y - obstacle.y) - obstacle.halfHeight, 0);
      return Math.hypot(dx, dy) - STEP_BADGE_RADIUS;
    })
  );

const besideThePath = (
  sample: (fraction: number) => PathPoint | undefined,
  fraction: number
): PathPoint[] => {
  const point = sample(fraction);
  const before = sample(Math.max(fraction - STEP_TANGENT_STEP, 0));
  const after = sample(Math.min(fraction + STEP_TANGENT_STEP, 1));
  if (!point || !before || !after) {
    return [];
  }
  const length = Math.hypot(after.x - before.x, after.y - before.y);
  if (length === 0) {
    return [];
  }
  const normal = { x: -(after.y - before.y) / length, y: (after.x - before.x) / length };
  return [1, -1].map((side) => ({
    x: point.x + normal.x * STEP_BADGE_OFFSET * side,
    y: point.y + normal.y * STEP_BADGE_OFFSET * side,
  }));
};

/** The first preferred spot on the edge clear of every obstacle, then beside it, else the roomiest. */
export const chooseBadgePosition = (
  sample: (fraction: number) => PathPoint | undefined,
  obstacles: BadgeObstacle[]
): PathPoint | undefined => {
  const candidates = [
    ...STEP_BADGE_FRACTIONS.map(sample),
    ...STEP_BADGE_FRACTIONS.flatMap((fraction) => besideThePath(sample, fraction)),
  ];
  let best: PathPoint | undefined;
  let bestRoom = Number.NEGATIVE_INFINITY;
  for (const point of candidates) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    const room = roomAround(point, obstacles);
    if (room >= STEP_BADGE_GAP) {
      return point;
    }
    if (room > bestRoom) {
      best = point;
      bestRoom = room;
    }
  }
  return best;
};

const square = (point: PathPoint, half: number): BadgeObstacle => ({
  ...point,
  halfWidth: half,
  halfHeight: half,
});

const translationOf = (node: Element): PathPoint => {
  const match = TRANSLATE.exec(node.getAttribute('transform') ?? '');
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
};

/** The summed `translate(...)` of `node` and its ancestors up to the SVG: its offset in SVG coordinates. */
const offsetInSvg = (node: Element | null | undefined): PathPoint => {
  const offset = { x: 0, y: 0 };
  for (
    let current = node;
    current && current.localName !== 'svg';
    current = current.parentElement
  ) {
    const { x, y } = translationOf(current);
    offset.x += x;
    offset.y += y;
  }
  return offset;
};

const boxedObstacle = (node: Element, origin: PathPoint): BadgeObstacle | undefined => {
  if (!TRANSLATE.test(node.getAttribute('transform') ?? '')) {
    return undefined;
  }
  const offset = offsetInSvg(node);
  const x = offset.x - origin.x;
  const y = offset.y - origin.y;
  const box = (node as SVGGraphicsElement).getBBox?.();
  if (!box) {
    return undefined;
  }
  return {
    x: x + box.x + box.width / 2,
    y: y + box.y + box.height / 2,
    halfWidth: box.width / 2,
    halfHeight: box.height / 2,
  };
};

const readPoints = (path: Element): PathPoint[] => {
  try {
    const points: unknown = JSON.parse(atob(path.getAttribute('data-points') ?? ''));
    return Array.isArray(points) ? (points as PathPoint[]) : [];
  } catch {
    return [];
  }
};

/** The box an arrowhead covers: from `tip` back towards `from` for the arrowhead's length. */
export const arrowheadObstacle = (tip: PathPoint, from: PathPoint): BadgeObstacle => {
  const length = Math.hypot(tip.x - from.x, tip.y - from.y);
  if (length === 0) {
    return square(tip, STEP_ARROWHEAD_LENGTH);
  }
  const along = { x: (tip.x - from.x) / length, y: (tip.y - from.y) / length };
  const half = STEP_ARROWHEAD_LENGTH / 2;
  return {
    x: tip.x - along.x * half,
    y: tip.y - along.y * half,
    halfWidth: Math.abs(along.x) * half + Math.abs(along.y) * STEP_ARROWHEAD_HALF_WIDTH,
    halfHeight: Math.abs(along.y) * half + Math.abs(along.x) * STEP_ARROWHEAD_HALF_WIDTH,
  };
};

const hasMarker = (path: Element, attribute: 'marker-start' | 'marker-end') => {
  const value = path.getAttribute(attribute);
  return !!value && value !== 'none';
};

const arrowheadObstacles = (path: Element, origin: PathPoint): BadgeObstacle[] => {
  const points = readPoints(path).filter(
    (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)
  );
  if (points.length === 0) {
    return [];
  }
  const offset = offsetInSvg(path);
  const toSvg = (point: PathPoint) => ({
    x: point.x + offset.x - origin.x,
    y: point.y + offset.y - origin.y,
  });
  const last = points.length - 1;
  const obstacles: BadgeObstacle[] = [];
  if (hasMarker(path, 'marker-start')) {
    obstacles.push(arrowheadObstacle(toSvg(points[0]), toSvg(points[Math.min(1, last)])));
  }
  if (hasMarker(path, 'marker-end')) {
    obstacles.push(arrowheadObstacle(toSvg(points[last]), toSvg(points[Math.max(last - 1, 0)])));
  }
  return obstacles;
};

/** What no badge may cover, in SVG coordinates: labels, nodes and the arrowheads at every edge's marked ends. */
export const collectBadgeObstacles = (root: Element | null | undefined): BadgeObstacle[] => {
  const origin = { x: 0, y: 0 };
  const boxed = [...(root?.querySelectorAll('.edgeLabel, .node') ?? [])]
    .map((obstacle) => boxedObstacle(obstacle, origin))
    .filter((obstacle): obstacle is BadgeObstacle => obstacle !== undefined);
  const arrowheads = [...(root?.querySelectorAll('path[data-edge="true"]') ?? [])].flatMap((path) =>
    arrowheadObstacles(path, origin)
  );
  return [...boxed, ...arrowheads];
};

const edgeLabelObstacles = (edge: Edge, points: PathPoint[]): BadgeObstacle[] => {
  if (!edge.label || points.length === 0) {
    return [];
  }
  const { x, y } = utils.calcLabelPosition(points);
  return [{ x, y, halfWidth: (edge.width ?? 0) / 2, halfHeight: (edge.height ?? 0) / 2 }];
};

const linearChannel = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (color: string): number | undefined => {
  try {
    const [r, g, b] = (['r', 'g', 'b'] as const).map((part) => linearChannel(channel(color, part)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return undefined;
  }
};

/** The WCAG contrast ratio of two colours, or 0 when either cannot be read. */
export const contrastRatio = (first: string, second: string): number => {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  if (a === undefined || b === undefined) {
    return 0;
  }
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/** The first candidate readable on `fill` (4.5:1), else the one with the most contrast. */
export const pickBadgeTextColor = (fill: string, candidates: (string | undefined)[]): string => {
  const options = [...candidates.filter((color): color is string => !!color), '#ffffff', '#000000'];
  const scored = options.map((color) => ({ color, ratio: contrastRatio(fill, color) }));
  const readable = scored.find(({ ratio }) => ratio >= MIN_TEXT_CONTRAST);
  return (readable ?? scored.reduce((best, next) => (next.ratio > best.ratio ? next : best))).color;
};

const bareColor = (color?: string) => {
  const bare = color?.replace(/^stroke:\s*/, '').trim();
  return bare === '' ? undefined : bare;
};

/**
 * Appends a badge with the step number on a step edge when `flowchart.stepNumbers` is on, clear of
 * `obstacles` (SVG coordinates). Returns the badge's own box in SVG coordinates.
 */
export const insertEdgeStepBadge = (
  elem: SVGGroup,
  edge: Edge,
  options: StepBadgeOptions,
  obstacles: BadgeObstacle[] = collectBadgeObstacles(elem.node()?.closest('svg'))
): BadgeObstacle | undefined => {
  if (!isStepEdge(edge) || !edge.showStepNumber) {
    return undefined;
  }
  const origin = offsetInSvg(elem.node());
  const local = obstacles.map((obstacle) => ({
    ...obstacle,
    x: obstacle.x - origin.x,
    y: obstacle.y - origin.y,
  }));
  const position = chooseBadgePosition(createPathSampler(options.points, options.pathNode), [
    ...local,
    ...edgeLabelObstacles(edge, options.points),
  ]);
  if (!position) {
    return undefined;
  }
  // A resolved colour, not currentColor, so the text contrast check below can read it.
  const fill = bareColor(options.color) ?? STEP_BADGE_FALLBACK_FILL;
  const badge = elem
    .append('g')
    .attr('class', 'edge-step-badge')
    .attr('transform', `translate(${position.x},${position.y})`)
    .attr('pointer-events', 'none')
    .attr('data-step', edge.step);
  badge.append('circle').attr('r', STEP_BADGE_RADIUS).attr('fill', fill);
  badge
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', STEP_BADGE_FONT_SIZE)
    .attr('fill', pickBadgeTextColor(fill, options.textColors ?? []))
    .text(String(edge.step));
  return square({ x: position.x + origin.x, y: position.y + origin.y }, STEP_BADGE_RADIUS);
};

/** Shows `target` only while the step's dot is moving, by lifting its parked `scale(0)`. */
const showWhileStepPlays = <E extends SVGElement>(
  target: Selection<E, unknown, Element | null, unknown>,
  motionId: string,
  dur: number
) => {
  // The parked transform keeps the target (the dot or the highlight) hidden at the path start. While
  // the step plays, this animateTransform replaces it with scale(1) (it is not additive), dropping
  // the translate so the highlight lies on its own path and animateMotion alone positions the dot;
  // fill="remove" restores the parked transform after.
  target
    .append('animateTransform')
    .attr('attributeName', 'transform')
    .attr('type', 'scale')
    .attr('values', '1;1')
    .attr('dur', `${dur}s`)
    .attr('begin', `${motionId}.begin`)
    .attr('fill', 'remove');
};

/**
 * Appends the dot that travels along a step edge and a highlight stroke shown while it travels,
 * plus the reduced-motion rule once per SVG.
 */
export const insertEdgeStepDot = (
  elem: SVGGroup,
  edge: Edge,
  pathData: string,
  diagramId: string,
  color?: string
) => {
  if (!isStepEdge(edge) || !pathData) {
    return;
  }
  const { begin, dur, gap } = getEdgeStepTiming(
    edge.step,
    edge.stepCount ?? edge.step,
    getStepDuration(edge.stepDuration)
  );
  const motionId = toAnimationId(`${diagramId}-${edge.id}-step`);
  const parked = `${pathStartTranslate(pathData)}scale(0)`;
  const fill = color?.replace(/^stroke:\s*/, '');
  const highlight = elem
    .append('path')
    .attr('class', 'edge-step-highlight')
    .attr('aria-hidden', 'true')
    .attr('d', pathData)
    .attr('fill', 'none')
    .attr('stroke', fill ?? 'currentColor')
    .attr('stroke-width', STEP_HIGHLIGHT_STROKE_WIDTH)
    .attr('stroke-linecap', 'round')
    .attr('stroke-opacity', STEP_HIGHLIGHT_STROKE_OPACITY)
    .attr('pointer-events', 'none')
    .attr('transform', parked)
    .attr('data-step', edge.step);
  showWhileStepPlays(highlight, motionId, dur);
  const dot = elem
    .append('circle')
    .attr('class', 'edge-step-dot')
    .attr('r', STEP_DOT_RADIUS)
    .attr('aria-hidden', 'true')
    .attr('transform', parked)
    .attr('data-step', edge.step);
  if (fill) {
    dot.attr('fill', fill).attr('stroke', 'none');
  }
  dot
    .append('animateMotion')
    .attr('id', motionId)
    .attr('path', pathData)
    .attr('dur', `${dur}s`)
    .attr('begin', `${begin}s;${motionId}.end+${gap}s`)
    .attr('fill', 'remove');
  showWhileStepPlays(dot, motionId, dur);
  ensureReducedMotionStyle(elem, diagramId);
};

interface QueuedBadge {
  elem: SVGGroup;
  edge: Edge;
  options: StepBadgeOptions;
}

const queuedBadges = new WeakMap<Element, QueuedBadge[]>();

const badgeLayer = (root: Element) => {
  const existing = root.querySelector(':scope > g.edge-step-badges');
  if (existing) {
    return existing;
  }
  const layer = root.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.setAttribute('class', 'edge-step-badges');
  return root.appendChild(layer);
};

/** Draws the badges queued for `svg` in a layer above everything else, once the whole diagram is in place. */
export const placeQueuedStepBadges = (svg: Element | null | undefined) => {
  const queued = svg ? queuedBadges.get(svg) : undefined;
  if (!svg || !queued) {
    return;
  }
  queuedBadges.delete(svg);
  const obstacles = collectBadgeObstacles(svg);
  for (const { elem, edge, options } of queued) {
    const root = elem.node()?.parentElement;
    if (!root) {
      continue;
    }
    const layer = select(badgeLayer(root) as SVGGElement) as unknown as SVGGroup;
    const placed = insertEdgeStepBadge(layer, edge, options, obstacles);
    if (placed) {
      obstacles.push(placed);
    }
  }
};

/** Draws a step edge's dot and highlight now and queues its badge for `placeQueuedStepBadges`. */
export const insertEdgeStepMarks = (
  elem: SVGGroup,
  edge: Edge,
  pathData: string,
  diagramId: string,
  badge: StepBadgeOptions
) => {
  insertEdgeStepDot(elem, edge, pathData, diagramId, badge.color);
  const node = elem.node();
  const svg = node?.ownerSVGElement ?? node;
  if (!svg || !isStepEdge(edge) || !edge.showStepNumber) {
    return;
  }
  queuedBadges.set(svg, [...(queuedBadges.get(svg) ?? []), { elem, edge, options: badge }]);
};
