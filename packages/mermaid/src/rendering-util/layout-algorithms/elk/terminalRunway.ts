import type { Point } from '../../rendering-elements/lineJump.js';
import { markerOffsets } from '../../../utils/lineWithOffset.js';

export const TERMINAL_STRAIGHT_LEAD = 12;
export interface MarkerRunway {
  offset: number;
  back: number;
  lead: number;
}
export interface TerminalRunway {
  startBounds?: { left: number; right: number; top: number; bottom: number };
  endBounds?: { left: number; right: number; top: number; bottom: number };
  start?: MarkerRunway;
  end?: MarkerRunway;
  rounded?: boolean;
}

/** Marker dimensions are in SVG user units, not a fixed guessed arrow size. */
export function readTerminalRunway(
  path: SVGPathElement,
  edge: { arrowTypeStart?: string; arrowTypeEnd?: string; curve?: string }
): TerminalRunway {
  const svg = path.ownerSVGElement;
  const read = (side: 'start' | 'end', type?: string): MarkerRunway | undefined => {
    const value =
      path.getAttribute('marker-' + side) ||
      getComputedStyle(path).getPropertyValue('marker-' + side);
    const id = /#([^\s"')]+)/.exec(value)?.[1];
    const m = id && svg?.ownerDocument.getElementById(id);
    if (!m) {
      return;
    }
    const vb = (m.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    const width = parseFloat(m.getAttribute('markerWidth') || '3'),
      height = parseFloat(m.getAttribute('markerHeight') || '3');
    const ref = parseFloat(m.getAttribute('refX') || '0');
    let scale =
      vb.length === 4 && vb[2] > 0 && vb[3] > 0 ? Math.min(width / vb[2], height / vb[3]) : 1;
    if (m.getAttribute('preserveAspectRatio')?.includes('none') && vb[2] > 0) {
      scale = width / vb[2];
    }
    if (m.getAttribute('markerUnits') !== 'userSpaceOnUse') {
      scale *= parseFloat(getComputedStyle(path).strokeWidth) || 1;
    }
    // Both ends/auto-start-reverse are bounded conservatively. Two extra user
    // units cover stroked marker outlines and subpixel rounding.
    const boxes = [
      ...m.querySelectorAll<SVGGraphicsElement>('path,polygon,polyline,circle,ellipse,rect,line'),
    ]
      .filter((e) => typeof e.getBBox === 'function')
      .map((e) => e.getBBox())
      .filter((b) => b.width || b.height);
    const low = boxes.length ? Math.min(...boxes.map((b) => b.x)) : vb.length === 4 ? vb[0] : 0;
    const high = boxes.length
      ? Math.max(...boxes.map((b) => b.x + b.width))
      : vb.length === 4
        ? vb[0] + vb[2]
        : width;
    const back = Math.max(Math.abs(ref - low), Math.abs(high - ref)) * scale + 2;
    return {
      back,
      offset: (markerOffsets as Record<string, number>)[type || ''] || 0,
      lead: TERMINAL_STRAIGHT_LEAD,
    };
  };
  return {
    start: read('start', edge.arrowTypeStart),
    end: read('end', edge.arrowTypeEnd),
    rounded: edge.curve !== 'linear',
  };
}

function cut(a: Point, b: Point, c: Point, rounded: boolean): number {
  const u = { x: b.x - a.x, y: b.y - a.y },
    v = { x: c.x - b.x, y: c.y - b.y };
  const l1 = Math.hypot(u.x, u.y),
    l2 = Math.hypot(v.x, v.y);
  if (!rounded || !l1 || !l2) {
    return 0;
  }
  const angle = Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / (l1 * l2))));
  if (angle < 1e-5 || Math.abs(Math.PI - angle) < 1e-5) {
    return 0;
  }
  return Math.min(5 / Math.sin(angle / 2), l1 / 2, l2 / 2);
}

/** Available straight stroke between the last bend and the marker's back.
 * A completely straight edge has no bend to separate, so it is not lengthened.
 * Callers supply canonical points (zero/collinear waypoints removed).
 */
export function terminalClearance(
  points: Point[],
  policy: TerminalRunway,
  side: 'start' | 'end'
): number {
  const marker = policy[side];
  if (!marker || points.length < 3) {
    return Infinity;
  }
  const ps = (side === 'start' ? [...points].reverse() : points).map((p) => ({ ...p }));
  const n = ps.length,
    a = ps[n - 2],
    b = ps[n - 1],
    length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!length) {
    return -Infinity;
  }
  const painted = {
    x: b.x - ((b.x - a.x) * marker.offset) / length,
    y: b.y - ((b.y - a.y) * marker.offset) / length,
  };
  return (
    length - marker.offset - cut(ps[n - 3], a, painted, policy.rounded !== false) - marker.back
  );
}
export function terminalDeficit(points: Point[], policy: TerminalRunway): number {
  return (['start', 'end'] as const).reduce(
    (sum, side) =>
      sum + Math.max(0, (policy[side]?.lead || 0) - terminalClearance(points, policy, side)),
    0
  );
}
export function minimumRawLead(marker?: MarkerRunway): number {
  return marker ? Math.ceil(marker.offset + marker.back + marker.lead + Math.SQRT2 * 5 + 1) : 0;
}

/** Reserve real routing space before placement, rather than adding a tight
 * title-avoidance notch after placement. No public configuration is necessary.
 * Labels already consume their own strip; the added padding buys the marker
 * approach plus the title router's 14-unit detour clearance and a 2-unit margin.
 * All sides matter for horizontal/reversed groups and arrowed source ports.
 */
export function reserveTerminalLayoutSpace(
  graph: { layoutOptions?: Record<string, unknown>; children?: any[] },
  runway: number,
  root = true
): void {
  if (!runway) {
    return;
  }
  const options = (graph.layoutOptions ??= {});
  const base = Number(options['spacing.baseValue']) || 0;
  for (const group of [
    { aliases: ['elk.layered.spacing.edgeNodeBetweenLayers'], factor: 0.5 },
    { aliases: ['elk.spacing.edgeNode', 'spacing.edgeNode'], factor: 0.5 },
    { aliases: ['elk.spacing.nodeNode', 'spacing.nodeNode'], factor: 1.0 },
    { aliases: ['elk.layered.spacing.nodeNodeBetweenLayers'], factor: 1.0 },
  ]) {
    const { aliases, factor } = group;
    const hasExplicit = aliases.some((key) => Object.hasOwn(options, key));
    const current = Math.max(...aliases.map((key) => Number(options[key]) || 0));
    const derived = base * factor;
    if (!hasExplicit && runway <= derived) {
      continue;
    }
    const value = Math.max(current, runway);
    for (const key of aliases) {
      options[key] = value;
    }
  }
  if (!root && graph.children?.length) {
    const pad = runway + 16;
    const existing = typeof options['elk.padding'] === 'string' ? options['elk.padding'] : '';
    options['elk.padding'] =
      '[' +
      ['top', 'left', 'bottom', 'right']
        .map((side) => {
          const value = new RegExp(side + '\\s*=\\s*([0-9.]+)').exec(existing);
          return side + '=' + Math.max(pad, value ? Number(value[1]) : 0);
        })
        .join(',') +
      ']';
  }
  for (const node of graph.children || []) {
    if (node.children?.length) {
      reserveTerminalLayoutSpace(node, runway, false);
    }
  }
}

export const MIN_END_MARKER_SEGMENT_LENGTH = 12;

export function isPointNearBounds(
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
  p?: Point,
  tol = 0.5
): boolean {
  if (!bounds || !p) {
    return false;
  }
  const left = bounds.left !== undefined ? bounds.left : bounds.x! - bounds.width! / 2;
  const right = bounds.right !== undefined ? bounds.right : bounds.x! + bounds.width! / 2;
  const top = bounds.top !== undefined ? bounds.top : bounds.y! - bounds.height! / 2;
  const bottom = bounds.bottom !== undefined ? bounds.bottom : bounds.y! + bounds.height! / 2;

  const onLeft = Math.abs(p.x - left) <= tol && p.y >= top - tol && p.y <= bottom + tol;
  const onRight = Math.abs(p.x - right) <= tol && p.y >= top - tol && p.y <= bottom + tol;
  const onTop = Math.abs(p.y - top) <= tol && p.x >= left - tol && p.x <= right + tol;
  const onBottom = Math.abs(p.y - bottom) <= tol && p.x >= left - tol && p.x <= right + tol;
  return onLeft || onRight || onTop || onBottom;
}

export function ensureStartMarkerSegmentLength(
  points: Point[],
  startBounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
  markerOffset = 0,
  log?: { debug: (...args: unknown[]) => void }
): Point[] {
  if (markerOffset <= 0 || points.length < 3) {
    return points;
  }
  const start = points[0];
  const exit = points[1];
  const minLen = Math.max(MIN_END_MARKER_SEGMENT_LENGTH, markerOffset * 2);
  const segmentLength = Math.hypot(exit.x - start.x, exit.y - start.y);
  if (segmentLength >= minLen) {
    return points;
  }
  if (!isPointNearBounds(startBounds, exit, 2) && !isPointNearBounds(startBounds, start, 2)) {
    return points;
  }
  const adjusted = [start, ...points.slice(2)];
  log?.debug?.('UIO cutter2: removed short start marker segment', {
    before: points,
    after: adjusted,
    markerOffset,
    segmentLength,
  });
  return adjusted;
}

export function ensureEndMarkerSegmentLength(
  points: Point[],
  endBounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
  markerOffset = 0,
  log?: { debug: (...args: unknown[]) => void }
): Point[] {
  if (markerOffset <= 0 || points.length < 3) {
    return points;
  }

  const end = points[points.length - 1];
  const entry = points[points.length - 2];
  const minLen = Math.max(MIN_END_MARKER_SEGMENT_LENGTH, markerOffset * 2);
  const segmentLength = Math.hypot(end.x - entry.x, end.y - entry.y);
  if (segmentLength >= minLen) {
    return points;
  }
  if (!isPointNearBounds(endBounds, entry, 2) && !isPointNearBounds(endBounds, end, 2)) {
    return points;
  }

  const adjusted = [...points.slice(0, -2), end];
  log?.debug?.('UIO cutter2: removed short end marker segment', {
    before: points,
    after: adjusted,
    markerOffset,
    segmentLength,
  });
  return adjusted;
}
