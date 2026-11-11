import {
  findEdgeIntersections,
  replaceEdgePath,
  type Point,
} from '../../rendering-elements/lineJump.js';
import { generateRoundedPath, applyMarkerOffsetsToPoints } from '../../rendering-elements/edges.js';
import type { CommonLayoutPaintContext } from '../common/index.js';
import type { LayoutData } from '../../types.js';
import { clusterPaintsTitle } from '../../rendering-elements/clusters.js';

export interface TitleBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const CLEARANCE = 10;

/** X intervals occupied by real edge geometry in the title's horizontal band. */
export function titleBlockedIntervals(points: Point[], title: TitleBox): [number, number][] {
  const intervals: [number, number][] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const low = Math.max(Math.min(a.y, b.y), title.top - CLEARANCE);
    const high = Math.min(Math.max(a.y, b.y), title.bottom + CLEARANCE);
    if (low > high) {
      continue;
    }
    if (Math.abs(b.y - a.y) < 1e-6) {
      intervals.push([Math.min(a.x, b.x) - CLEARANCE, Math.max(a.x, b.x) + CLEARANCE]);
    } else {
      const x1 = a.x + ((low - a.y) * (b.x - a.x)) / (b.y - a.y);
      const x2 = a.x + ((high - a.y) * (b.x - a.x)) / (b.y - a.y);
      intervals.push([Math.min(x1, x2) - CLEARANCE, Math.max(x1, x2) + CLEARANCE]);
    }
  }
  return intervals;
}

/** Closest safe horizontal title position INSIDE its frame; never hides a line. */
export function findTitlePosition(
  title: TitleBox,
  frame: TitleBox,
  blocked: [number, number][]
): number | null {
  const width = title.right - title.left;
  const left = frame.left + CLEARANCE;
  const right = frame.right - CLEARANCE;
  const intervals = blocked
    .map(([a, b]) => [Math.max(left, a), Math.min(right, b)])
    .filter(([a, b]) => a <= b)
    .sort((a, b) => a[0] - b[0]);
  let cursor = left;
  const slots: [number, number][] = [];
  for (const [a, b] of intervals) {
    if (a > cursor) {
      slots.push([cursor, a]);
    }
    cursor = Math.max(cursor, b);
  }
  if (cursor < right) {
    slots.push([cursor, right]);
  }
  const candidates = slots
    .filter(([a, b]) => b - a >= width)
    .map(([a, b]) => Math.max(a, Math.min(title.left, b - width)));
  candidates.sort((a, b) => Math.abs(a - title.left) - Math.abs(b - title.left) || a - b);
  return candidates[0] ?? null;
}

/** Proper intersection with a rectangle interior (touching its boundary is safe). */
export function segmentHitsTitle(a: Point, b: Point, box: TitleBox): boolean {
  let lo = 0;
  let hi = 1;
  for (const [v, delta, min, max] of [
    [a.x, b.x - a.x, box.left + 1e-4, box.right - 1e-4],
    [a.y, b.y - a.y, box.top + 1e-4, box.bottom - 1e-4],
  ]) {
    if (Math.abs(delta) < 1e-8) {
      if (v <= min || v >= max) {
        return false;
      }
    } else {
      const t1 = (min - v) / delta;
      const t2 = (max - v) / delta;
      lo = Math.max(lo, Math.min(t1, t2));
      hi = Math.min(hi, Math.max(t1, t2));
      if (hi <= lo) {
        return false;
      }
    }
  }
  return hi > lo;
}

function expand(box: TitleBox, amount: number): TitleBox {
  return {
    left: box.left - amount,
    right: box.right + amount,
    top: box.top - amount,
    bottom: box.bottom + amount,
  };
}

function inside(point: Point, box: TitleBox): boolean {
  return point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.bottom;
}

function compact(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    if (out.length && Math.hypot(p.x - out[out.length - 1].x, p.y - out[out.length - 1].y) < 1e-5) {
      continue;
    }
    while (out.length > 1) {
      const a = out[out.length - 2],
        b = out[out.length - 1];
      const cross = (b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x);
      const forward = (b.x - a.x) * (p.x - b.x) + (b.y - a.y) * (p.y - b.y);
      if (Math.abs(cross) > 1e-5 || forward < 0) {
        break;
      }
      out.pop();
    }
    out.push({ ...p });
  }
  return out;
}

/** Split only at the local safety envelope. This leaves remote, already-valid
 * portions of the route outside conservative shape bounding boxes untouched. */
function titleEnvelopeAnchors(input: Point[], box: TitleBox): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < input.length; i++) {
    const a = input[i - 1],
      b = input[i];
    out.push({ ...a });
    const cuts: number[] = [];
    for (const [delta, origin, lo, hi, otherOrigin, otherDelta, otherLo, otherHi] of [
      [b.x - a.x, a.x, box.left, box.right, a.y, b.y - a.y, box.top, box.bottom],
      [b.y - a.y, a.y, box.top, box.bottom, a.x, b.x - a.x, box.left, box.right],
    ]) {
      if (Math.abs(delta) < 1e-8) {
        continue;
      }
      for (const boundary of [lo, hi]) {
        const t = (boundary - origin) / delta,
          other = otherOrigin + t * otherDelta;
        if (
          t > 1e-6 &&
          t < 1 - 1e-6 &&
          other >= otherLo - 1e-6 &&
          other <= otherHi + 1e-6 &&
          !cuts.some((c) => Math.abs(c - t) < 1e-7)
        ) {
          cuts.push(t);
        }
      }
    }
    for (const t of cuts.sort((a, b) => a - b)) {
      out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
    }
  }
  if (input.length) {
    out.push({ ...input[input.length - 1] });
  }
  return out;
}

/** Local, orthogonal detour. Leaves endpoints fixed and rejects node/text collisions. */
export function routeAroundTitle(
  input: Point[],
  title: TitleBox,
  obstacles: TitleBox[] = [],
  otherRoutes: Point[][] = [],
  localized = false,
  clearance = 12
): Point[] {
  const safe = expand(title, clearance);
  let points = localized
    ? titleEnvelopeAnchors(input, expand(safe, 2))
    : input.map((p) => ({ ...p }));
  for (let attempt = 0; attempt < 8; attempt++) {
    const hit = points.findIndex(
      (p, i) => i + 1 < points.length && segmentHitsTitle(p, points[i + 1], safe)
    );
    if (hit < 0) {
      break;
    }
    let first = hit,
      last = hit + 1;
    while (first > 0 && inside(points[first], safe)) {
      first--;
    }
    while (last + 1 < points.length && inside(points[last], safe)) {
      last++;
    }
    const a = points[first],
      b = points[last];
    if (inside(a, safe) || inside(b, safe)) {
      break;
    }
    const candidates: Point[][] = [];
    for (const extra of [2, 14, 30]) {
      const box = expand(safe, extra);
      for (const x of [box.left, box.right]) {
        candidates.push([a, { x, y: a.y }, { x, y: b.y }, b]);
        for (const [y1, y2] of [
          [box.top, box.bottom],
          [box.bottom, box.top],
        ]) {
          candidates.push([a, { x: a.x, y: y1 }, { x, y: y1 }, { x, y: y2 }, { x: b.x, y: y2 }, b]);
        }
      }
      for (const y of [box.top, box.bottom]) {
        candidates.push([a, { x: a.x, y }, { x: b.x, y }, b]);
        for (const [x1, x2] of [
          [box.left, box.right],
          [box.right, box.left],
        ]) {
          candidates.push([a, { x: x1, y: a.y }, { x: x1, y }, { x: x2, y }, { x: x2, y: b.y }, b]);
        }
      }
    }
    const valid = candidates.map(compact).filter((route) => {
      for (let i = 1; i < route.length; i++) {
        if ([safe, ...obstacles].some((box) => segmentHitsTitle(route[i - 1], route[i], box))) {
          return false;
        }
      }
      // Preserve the departure/arrival direction at real path endpoints.
      if (first === 0 && input.length > 1) {
        const old = input[1],
          next = route[1];
        if ((old.x - a.x) * (next.x - a.x) + (old.y - a.y) * (next.y - a.y) <= 0) {
          return false;
        }
      }
      if (last === points.length - 1 && input.length > 1) {
        const old = input[input.length - 2],
          prev = route[route.length - 2];
        if ((old.x - b.x) * (prev.x - b.x) + (old.y - b.y) * (prev.y - b.y) <= 0) {
          return false;
        }
      }
      return true;
    });
    const cost = (route: Point[]) => {
      const crossings = otherRoutes.reduce(
        (sum, points) =>
          sum +
          findEdgeIntersections([
            { id: 'candidate', points: route },
            { id: 'other', points },
          ]).length,
        0
      );
      let overlap = 0;
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1],
          b = route[i];
        for (const other of otherRoutes) {
          for (let j = 1; j < other.length; j++) {
            const c = other[j - 1],
              d = other[j];
            if (
              Math.abs(a.x - b.x) < 1e-5 &&
              Math.abs(c.x - d.x) < 1e-5 &&
              Math.abs(a.x - c.x) < 1e-5
            ) {
              overlap += Math.max(
                0,
                Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) -
                  Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
              );
            } else if (
              Math.abs(a.y - b.y) < 1e-5 &&
              Math.abs(c.y - d.y) < 1e-5 &&
              Math.abs(a.y - c.y) < 1e-5
            ) {
              overlap += Math.max(
                0,
                Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) -
                  Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))
              );
            }
          }
        }
      }
      const length = route.reduce(
        (sum, p, i) => (i ? sum + Math.hypot(p.x - route[i - 1].x, p.y - route[i - 1].y) : 0),
        0
      );
      return (
        (overlap > 1 ? 100000 + overlap * 100 : 0) + crossings * 10000 + length + route.length * 8
      );
    };
    const ranked = valid
      .map((route) => ({ route, cost: cost(route) }))
      .sort((a, b) => a.cost - b.cost);
    if (!ranked.length) {
      if (!localized) {
        return routeAroundTitle(points, title, obstacles, otherRoutes, true, clearance);
      }
      break;
    }
    points = compact([...points.slice(0, first), ...ranked[0].route, ...points.slice(last + 1)]);
  }
  return compact(points);
}

/** Use measured title sizes during candidate selection; painted DOM is still
 * rechecked afterwards because HTML/SVG font metrics can differ slightly. */
export function protectedLayoutForScoring(
  data: LayoutData
): LayoutData & { titleObstacles: TitleBox[] } {
  const edges = data.edges.map((edge) => ({
    ...edge,
    points: edge.points?.map((p) => ({ ...p })),
  }));
  const nodes = data.nodes
    .filter((node) => !node.isGroup)
    .map((node) => ({
      left: node.x! - node.width! / 2,
      right: node.x! + node.width! / 2,
      top: node.y! - node.height! / 2,
      bottom: node.y! + node.height! / 2,
    }));
  const titles = data.nodes
    .filter(
      (node) =>
        node.isGroup &&
        clusterPaintsTitle(node.shape) &&
        node.labelBBox?.width &&
        node.labelBBox?.height
    )
    .map((node) => {
      const top =
        node.y! - node.height! / 2 + (data.config.flowchart?.subGraphTitleMargin?.top ?? 0);
      const title = {
        left: node.x! - node.labelBBox!.width / 2,
        right: node.x! + node.labelBBox!.width / 2,
        top,
        bottom: top + node.labelBBox!.height,
      };
      const frame = {
        left: node.x! - node.width! / 2,
        right: node.x! + node.width! / 2,
        top: node.y! - node.height! / 2,
        bottom: node.y! + node.height! / 2,
      };
      const blocked = edges.flatMap((edge) => titleBlockedIntervals(edge.points ?? [], title));
      for (const box of nodes) {
        if (box.bottom >= title.top - CLEARANCE && box.top <= title.bottom + CLEARANCE) {
          blocked.push([box.left - CLEARANCE, box.right + CLEARANCE]);
        }
      }
      const left = findTitlePosition(title, frame, blocked);
      return left === null ? title : { ...title, left, right: left + title.right - title.left };
    });
  for (const edge of edges) {
    if (!edge.points || (edge.curve && !['rounded', 'linear'].includes(edge.curve))) {
      continue;
    }
    for (const title of titles) {
      if (
        edge.points.some(
          (p, i) =>
            i + 1 < edge.points!.length &&
            segmentHitsTitle(p, edge.points![i + 1], expand(title, 3))
        )
      ) {
        edge.points = routeAroundTitle(
          edge.points,
          title,
          [...nodes, ...titles.filter((other) => other !== title).map((other) => expand(other, 3))],
          edges.filter((other) => other !== edge).map((other) => other.points ?? [])
        );
      }
    }
  }
  return { ...data, edges, titleObstacles: titles };
}

function boxInGroup(element: Element, inverse: DOMMatrix): TitleBox {
  const box = element.getBoundingClientRect();
  const a = new DOMPoint(box.left, box.top).matrixTransform(inverse);
  const b = new DOMPoint(box.right, box.bottom).matrixTransform(inverse);
  return {
    left: Math.min(a.x, b.x),
    right: Math.max(a.x, b.x),
    top: Math.min(a.y, b.y),
    bottom: Math.max(a.y, b.y),
  };
}

/**
 * ELK does not treat the painted cluster title as a routing obstacle. Reconcile
 * the title with final, clipped edge geometry after paint, before line hops.
 * Prefer an empty slot in the same header over adding bends to every edge.
 */
export function protectElkClusterTitles(
  _data: LayoutData,
  context: CommonLayoutPaintContext
): void {
  const group = context.measure.groups.edgePaths.node();
  if (!group || typeof group.getScreenCTM !== 'function' || typeof DOMPoint === 'undefined') {
    return;
  }
  const matrix = group.getScreenCTM();
  const svg = group.ownerSVGElement;
  if (!matrix || !svg) {
    return;
  }
  const inverse = matrix.inverse();
  const edges: Point[][] = [];
  for (const path of group.querySelectorAll('path[data-points]')) {
    try {
      edges.push(JSON.parse(atob(path.getAttribute('data-points')!)) as Point[]);
    } catch {
      /* Ignore paths without valid geometry. */
    }
  }
  const nodes = [...svg.querySelectorAll('g.node')].map((node) => boxInGroup(node, inverse));
  for (const label of svg.querySelectorAll<SVGGElement>('g.cluster-label')) {
    const frame = label.parentElement?.querySelector(':scope > rect');
    if (!frame) {
      continue;
    }
    const title = boxInGroup(label, inverse);
    if (title.right <= title.left || title.bottom <= title.top) {
      continue;
    }
    const blocked = edges.flatMap((points) => titleBlockedIntervals(points, title));
    for (const node of nodes) {
      if (node.bottom >= title.top - CLEARANCE && node.top <= title.bottom + CLEARANCE) {
        blocked.push([node.left - CLEARANCE, node.right + CLEARANCE]);
      }
    }
    const next = findTitlePosition(title, boxInGroup(frame, inverse), blocked);
    if (next === null || Math.abs(next - title.left) < 0.01) {
      continue;
    }
    const parentMatrix = (label.parentElement as unknown as SVGGraphicsElement).getScreenCTM();
    if (!parentMatrix) {
      continue;
    }
    const fromGroup = parentMatrix.inverse().multiply(matrix);
    const a = new DOMPoint(0, 0).matrixTransform(fromGroup);
    const b = new DOMPoint(next - title.left, 0).matrixTransform(fromGroup);
    const previous = label.getAttribute('transform') ?? '';
    label.setAttribute('transform', `translate(${b.x - a.x},${b.y - a.y}) ${previous}`);
    label.setAttribute('data-elk-title-protected', 'true');
  }
  // When no title-sized slot exists (e.g. a narrow orchestrator frame with
  // several input ports), route the edges around the actual painted text.
  const titles = [...svg.querySelectorAll('g.cluster-label')].map((label) =>
    boxInGroup(label, inverse)
  );
  const edgeById = new Map(_data.edges.map((edge) => [edge.id, edge]));
  const records = [...group.querySelectorAll<SVGPathElement>('path[data-points]')]
    .map((path) => {
      try {
        return { path, points: JSON.parse(atob(path.getAttribute('data-points')!)) as Point[] };
      } catch {
        return null;
      }
    })
    .filter((record): record is { path: SVGPathElement; points: Point[] } => record !== null);
  for (const record of records) {
    const edge = edgeById.get(record.path.getAttribute('data-id')!);
    if (!edge || (edge.curve && !['rounded', 'linear'].includes(edge.curve))) {
      continue;
    }
    let routed = record.points;
    for (const title of titles) {
      if (
        !routed.some(
          (p, i) => i + 1 < routed.length && segmentHitsTitle(p, routed[i + 1], expand(title, 3))
        )
      ) {
        continue;
      }
      routed = routeAroundTitle(
        routed,
        title,
        [...nodes, ...titles.filter((other) => other !== title).map((other) => expand(other, 3))],
        records.filter((other) => other !== record).map((other) => other.points)
      );
    }
    if (JSON.stringify(routed) === JSON.stringify(record.points)) {
      continue;
    }
    record.points = routed;
    edge.points = routed;
    edge.curve = 'rounded';
    record.path.setAttribute('data-points', btoa(JSON.stringify(routed)));
    replaceEdgePath(record.path, generateRoundedPath(applyMarkerOffsetsToPoints(routed, edge), 5));
    record.path.setAttribute('data-elk-title-detour', 'true');
  }
}
