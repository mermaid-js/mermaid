/**
 * Orthogonal connector router (guide §14.1 contract, §19 API).
 *
 * The search space is an *orthogonal visibility grid* in the style of libavoid:
 * only the coordinates that matter — obstacle boundaries expanded by the
 * clearance, port positions and mandatory waypoints — become grid lines, so the
 * grid is O(n) lines per axis rather than a pixel raster. A* over that grid
 * with a bend penalty and a crossing penalty gives short, low-bend, obstacle-
 * free Manhattan routes.
 *
 * Contract highlights required by the guide:
 *   - rectangular obstacles, never routed through;
 *   - locked or allowed endpoint sides;
 *   - ordered mandatory waypoints, routed pairwise and concatenated (§19.3),
 *     and never simplified away (§19.4);
 *   - alternatives with cost exposed so the two-side invariant can be enforced
 *     (§19.5).
 */

import type { Bounds, Point, Rect, Side } from '../model.js';
import { nodeBounds } from '../model.js';

export interface RouterObstacle {
  id: string;
  rect: Rect;
}

export interface OrthogonalRouteRequest {
  edgeId: string;
  source: RouterObstacle;
  target: RouterObstacle;
  allowedSourceSides?: Side[];
  allowedTargetSides?: Side[];
  lockedSourceSide?: Side;
  lockedTargetSide?: Side;
  mandatoryWaypoints?: Point[];
  obstacles: RouterObstacle[];
  /** Segments of already routed edges, used for the crossing penalty. */
  existingSegments?: Segment[];
  /**
   * Shift the port along its side. Parallel edges between the same pair get
   * distinct offsets so their routes separate instead of overlapping.
   */
  sourcePortOffset?: number;
  targetPortOffset?: number;
}

export interface OrthogonalRouteResult {
  points: Point[];
  sourceSide: Side;
  targetSide: Side;
  bendCount: number;
  length: number;
  crossings: number;
  /** Total search cost; lower is better. Used to rank alternatives. */
  cost: number;
}

export interface Segment {
  a: Point;
  b: Point;
}

export interface RouterConfig {
  clearance: number;
  bendPenalty: number;
  crossingPenalty: number;
  maxExpansions: number;
}

const ALL_SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
const EPSILON = 1e-7;

export function portPoint(rect: Rect, side: Side, offset = 0): Point {
  // Keep the port on the side, never past a corner.
  const alongX = Math.max(-rect.width / 2 + 1, Math.min(rect.width / 2 - 1, offset));
  const alongY = Math.max(-rect.height / 2 + 1, Math.min(rect.height / 2 - 1, offset));
  switch (side) {
    case 'top':
      return { x: rect.x + alongX, y: rect.y - rect.height / 2 };
    case 'bottom':
      return { x: rect.x + alongX, y: rect.y + rect.height / 2 };
    case 'left':
      return { x: rect.x - rect.width / 2, y: rect.y + alongY };
    case 'right':
      return { x: rect.x + rect.width / 2, y: rect.y + alongY };
  }
}

function outwardStep(side: Side, distance: number): Point {
  switch (side) {
    case 'top':
      return { x: 0, y: -distance };
    case 'bottom':
      return { x: 0, y: distance };
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
  }
}

function inflate(bounds: Bounds, by: number): Bounds {
  return {
    minX: bounds.minX - by,
    minY: bounds.minY - by,
    maxX: bounds.maxX + by,
    maxY: bounds.maxY + by,
  };
}

/** Does an axis-aligned segment pass through the *interior* of `rect`? */
export function segmentCrossesInterior(a: Point, b: Point, rect: Bounds): boolean {
  if (Math.abs(a.y - b.y) < EPSILON) {
    const y = a.y;
    if (y <= rect.minY + EPSILON || y >= rect.maxY - EPSILON) {
      return false;
    }
    const lo = Math.min(a.x, b.x);
    const hi = Math.max(a.x, b.x);
    return hi > rect.minX + EPSILON && lo < rect.maxX - EPSILON;
  }
  if (Math.abs(a.x - b.x) < EPSILON) {
    const x = a.x;
    if (x <= rect.minX + EPSILON || x >= rect.maxX - EPSILON) {
      return false;
    }
    const lo = Math.min(a.y, b.y);
    const hi = Math.max(a.y, b.y);
    return hi > rect.minY + EPSILON && lo < rect.maxY - EPSILON;
  }
  return false;
}

/** Number of proper crossings between an axis-aligned segment and a set. */
export function countCrossings(a: Point, b: Point, segments: Segment[]): number {
  const horizontal = Math.abs(a.y - b.y) < EPSILON;
  let count = 0;
  for (const other of segments) {
    const otherHorizontal = Math.abs(other.a.y - other.b.y) < EPSILON;
    if (horizontal === otherHorizontal) {
      continue;
    }
    const h = horizontal ? { a, b } : other;
    const v = horizontal ? other : { a, b };
    const y = h.a.y;
    const x = v.a.x;
    const hLo = Math.min(h.a.x, h.b.x);
    const hHi = Math.max(h.a.x, h.b.x);
    const vLo = Math.min(v.a.y, v.b.y);
    const vHi = Math.max(v.a.y, v.b.y);
    if (x > hLo + EPSILON && x < hHi - EPSILON && y > vLo + EPSILON && y < vHi - EPSILON) {
      count++;
    }
  }
  return count;
}

/**
 * How many already-routed segments this move would run along, sharing a stretch of
 * the same line rather than merely touching at a point.
 */
export function countCollinearOverlaps(a: Point, b: Point, segments: Segment[]): number {
  const horizontal = Math.abs(a.y - b.y) < EPSILON;
  const at = horizontal ? a.y : a.x;
  const lo = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
  const hi = horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y);

  let count = 0;
  for (const other of segments) {
    const otherHorizontal = Math.abs(other.a.y - other.b.y) < EPSILON;
    if (otherHorizontal !== horizontal) {
      continue;
    }
    const otherAt = horizontal ? other.a.y : other.a.x;
    if (Math.abs(otherAt - at) > EPSILON) {
      continue;
    }
    const otherLo = horizontal ? Math.min(other.a.x, other.b.x) : Math.min(other.a.y, other.b.y);
    const otherHi = horizontal ? Math.max(other.a.x, other.b.x) : Math.max(other.a.y, other.b.y);
    // Meeting at a single point is fine — two routes may share a corner.
    if (Math.min(hi, otherHi) - Math.max(lo, otherLo) > EPSILON) {
      count++;
    }
  }
  return count;
}

interface Grid {
  xs: number[];
  ys: number[];
  indexX: Map<number, number>;
  indexY: Map<number, number>;
}

/**
 * Grid lines are deduplicated on a 1e-3 key so nearly-equal coordinates merge,
 * but the value stored is the *exact* coordinate of the first contributor.
 * Ports and mandatory waypoints are contributed first, so a route line that a
 * port sits on carries the port's exact coordinate — otherwise the first and
 * last segments would come out a fraction of a pixel off-axis and the whole
 * route would be rejected as non-orthogonal.
 */
function buildGrid(
  request: OrthogonalRouteRequest,
  config: RouterConfig,
  exactPoints: Point[]
): Grid {
  const xs = new Map<number, number>();
  const ys = new Map<number, number>();
  const remember = (map: Map<number, number>, value: number): void => {
    const key = round(value);
    if (!map.has(key)) {
      map.set(key, value);
    }
  };

  for (const p of exactPoints) {
    remember(xs, p.x);
    remember(ys, p.y);
  }

  for (const obstacle of request.obstacles) {
    const b = nodeBounds(obstacle.rect);
    const exempt = obstacle.id === request.source.id || obstacle.id === request.target.id;
    const inflated = exempt ? b : inflate(b, config.clearance);
    remember(xs, inflated.minX);
    remember(xs, inflated.maxX);
    remember(ys, inflated.minY);
    remember(ys, inflated.maxY);
    // Centre lines let a route line up with a node centre, which reads best.
    remember(xs, obstacle.rect.x);
    remember(ys, obstacle.rect.y);
  }

  const sortedX = [...xs.values()].sort((a, b) => a - b);
  const sortedY = [...ys.values()].sort((a, b) => a - b);
  const indexX = new Map<number, number>();
  const indexY = new Map<number, number>();
  sortedX.forEach((v, i) => indexX.set(round(v), i));
  sortedY.forEach((v, i) => indexY.set(round(v), i));
  return { xs: sortedX, ys: sortedY, indexX, indexY };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

interface SearchNode {
  xi: number;
  yi: number;
  /** 0 = none, 1 = horizontal, 2 = vertical. */
  axis: number;
  g: number;
  f: number;
  parent: SearchNode | null;
}

class MinHeap {
  private readonly items: SearchNode[] = [];

  get size(): number {
    return this.items.length;
  }

  push(node: SearchNode): void {
    this.items.push(node);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].f <= this.items[i].f) {
        break;
      }
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop(): SearchNode | undefined {
    if (this.items.length === 0) {
      return undefined;
    }
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let best = i;
        if (l < this.items.length && this.items[l].f < this.items[best].f) {
          best = l;
        }
        if (r < this.items.length && this.items[r].f < this.items[best].f) {
          best = r;
        }
        if (best === i) {
          break;
        }
        [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
        i = best;
      }
    }
    return top;
  }
}

/**
 * A* between two grid points. Returns the polyline including both endpoints.
 */
function searchGrid(
  grid: Grid,
  from: Point,
  to: Point,
  blocked: (a: Point, b: Point) => boolean,
  existingSegments: Segment[],
  config: RouterConfig
): { points: Point[]; cost: number; crossings: number } | null {
  const sx = grid.indexX.get(round(from.x));
  const sy = grid.indexY.get(round(from.y));
  const tx = grid.indexX.get(round(to.x));
  const ty = grid.indexY.get(round(to.y));
  if (sx === undefined || sy === undefined || tx === undefined || ty === undefined) {
    return null;
  }

  const width = grid.xs.length;
  const key = (xi: number, yi: number, axis: number): number => (yi * width + xi) * 3 + axis;
  const bestG = new Map<number, number>();
  const open = new MinHeap();

  const heuristic = (xi: number, yi: number): number =>
    Math.abs(grid.xs[xi] - to.x) + Math.abs(grid.ys[yi] - to.y);

  const start: SearchNode = { xi: sx, yi: sy, axis: 0, g: 0, f: heuristic(sx, sy), parent: null };
  open.push(start);
  bestG.set(key(sx, sy, 0), 0);

  let expansions = 0;
  const crossingsAt = new Map<SearchNode, number>();
  crossingsAt.set(start, 0);

  while (open.size > 0 && expansions < config.maxExpansions) {
    const current = open.pop()!;
    expansions++;
    if (current.xi === tx && current.yi === ty) {
      return {
        points: reconstruct(current, grid),
        cost: current.g,
        crossings: crossingsAt.get(current) ?? 0,
      };
    }
    const currentKey = key(current.xi, current.yi, current.axis);
    if ((bestG.get(currentKey) ?? Infinity) < current.g - EPSILON) {
      continue;
    }

    const here: Point = { x: grid.xs[current.xi], y: grid.ys[current.yi] };
    const neighbours: { xi: number; yi: number; axis: number }[] = [
      { xi: current.xi - 1, yi: current.yi, axis: 1 },
      { xi: current.xi + 1, yi: current.yi, axis: 1 },
      { xi: current.xi, yi: current.yi - 1, axis: 2 },
      { xi: current.xi, yi: current.yi + 1, axis: 2 },
    ];

    for (const n of neighbours) {
      if (n.xi < 0 || n.xi >= grid.xs.length || n.yi < 0 || n.yi >= grid.ys.length) {
        continue;
      }
      const there: Point = { x: grid.xs[n.xi], y: grid.ys[n.yi] };
      if (blocked(here, there)) {
        continue;
      }
      const distance = Math.abs(there.x - here.x) + Math.abs(there.y - here.y);
      const bend = current.axis !== 0 && current.axis !== n.axis ? config.bendPenalty : 0;
      const crossed =
        existingSegments.length > 0 ? countCrossings(here, there, existingSegments) : 0;
      // Running *along* an already-routed segment is at least as bad as crossing it:
      // the two are drawn on top of each other and read as one thicker line. A
      // crossing count cannot see it, because it only looks at perpendicular
      // segments, and the detour that avoids it is usually one grid step sideways.
      const shared =
        existingSegments.length > 0 ? countCollinearOverlaps(here, there, existingSegments) : 0;
      const g = current.g + distance + bend + (crossed + shared) * config.crossingPenalty;
      const nk = key(n.xi, n.yi, n.axis);
      if (g >= (bestG.get(nk) ?? Infinity) - EPSILON) {
        continue;
      }
      bestG.set(nk, g);
      const node: SearchNode = {
        xi: n.xi,
        yi: n.yi,
        axis: n.axis,
        g,
        f: g + heuristic(n.xi, n.yi),
        parent: current,
      };
      crossingsAt.set(node, (crossingsAt.get(current) ?? 0) + crossed);
      open.push(node);
    }
  }

  return null;
}

function reconstruct(node: SearchNode, grid: Grid): Point[] {
  const points: Point[] = [];
  let current: SearchNode | null = node;
  while (current) {
    points.push({ x: grid.xs[current.xi], y: grid.ys[current.yi] });
    current = current.parent;
  }
  points.reverse();
  return simplifyCollinear(points);
}

/** Drop points that lie on a straight run. Endpoints are always kept. */
export function simplifyCollinear(points: Point[], keep: Point[] = []): Point[] {
  if (points.length <= 2) {
    return points;
  }
  const mustKeep = (p: Point): boolean =>
    keep.some((k) => Math.abs(k.x - p.x) < EPSILON && Math.abs(k.y - p.y) < EPSILON);

  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const previous = result[result.length - 1];
    const current = points[i];
    const next = points[i + 1];
    const collinear =
      (Math.abs(previous.x - current.x) < EPSILON && Math.abs(current.x - next.x) < EPSILON) ||
      (Math.abs(previous.y - current.y) < EPSILON && Math.abs(current.y - next.y) < EPSILON);
    if (!collinear || mustKeep(current)) {
      result.push(current);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

export function countBends(points: Point[]): number {
  let bends = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const beforeHorizontal = Math.abs(points[i].y - points[i - 1].y) < EPSILON;
    const afterHorizontal = Math.abs(points[i + 1].y - points[i].y) < EPSILON;
    if (beforeHorizontal !== afterHorizontal) {
      bends++;
    }
  }
  return bends;
}

export function pathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return length;
}

/**
 * Route one edge with a fixed pair of sides, through every mandatory waypoint
 * in order.
 */
export function routeWithSides(
  request: OrthogonalRouteRequest,
  sourceSide: Side,
  targetSide: Side,
  config: RouterConfig
): OrthogonalRouteResult | null {
  const start = portPoint(request.source.rect, sourceSide, request.sourcePortOffset ?? 0);
  const end = portPoint(request.target.rect, targetSide, request.targetPortOffset ?? 0);
  const waypoints = request.mandatoryWaypoints ?? [];

  // A short stub outside each port guarantees the route leaves and enters
  // through the intended side instead of sliding along the node boundary.
  const stub = Math.max(config.clearance, 1);
  const startStub = addPoint(start, outwardStep(sourceSide, stub));
  const endStub = addPoint(end, outwardStep(targetSide, stub));

  const legPoints = [startStub, ...waypoints, endStub];
  const grid = buildGrid(request, config, [start, end, ...legPoints]);

  const obstacleBounds = request.obstacles.map((o) => ({
    id: o.id,
    bounds:
      o.id === request.source.id || o.id === request.target.id
        ? nodeBounds(o.rect)
        : inflate(nodeBounds(o.rect), config.clearance),
  }));

  const blocked = (a: Point, b: Point): boolean =>
    obstacleBounds.some((o) => segmentCrossesInterior(a, b, o.bounds));

  const existing = request.existingSegments ?? [];
  const assembled: Point[] = [start];
  let cost = 0;
  let crossings = 0;

  for (let i = 0; i < legPoints.length - 1; i++) {
    const leg = searchGrid(grid, legPoints[i], legPoints[i + 1], blocked, existing, config);
    if (leg === null) {
      return null;
    }
    cost += leg.cost;
    crossings += leg.crossings;
    const points = i === 0 ? leg.points : leg.points.slice(1);
    assembled.push(...points);
  }
  assembled.push(end);

  const points = simplifyCollinear(dedupe(assembled), waypoints);
  if (!isOrthogonal(points)) {
    return null;
  }

  return {
    points,
    sourceSide,
    targetSide,
    bendCount: countBends(points),
    length: pathLength(points),
    crossings,
    cost: cost + countBends(points) * config.bendPenalty,
  };
}

/** Every allowed side pair, cheapest first (guide §19.5). */
export function routeAlternatives(
  request: OrthogonalRouteRequest,
  config: RouterConfig
): OrthogonalRouteResult[] {
  const sourceSides = request.lockedSourceSide
    ? [request.lockedSourceSide]
    : (request.allowedSourceSides ?? ALL_SIDES);
  const targetSides = request.lockedTargetSide
    ? [request.lockedTargetSide]
    : (request.allowedTargetSides ?? ALL_SIDES);

  const results: OrthogonalRouteResult[] = [];
  for (const s of sourceSides) {
    for (const t of targetSides) {
      const result = routeWithSides(request, s, t, config);
      if (result) {
        results.push(result);
      }
    }
  }
  return results.sort(compareRoutes);
}

export function compareRoutes(a: OrthogonalRouteResult, b: OrthogonalRouteResult): number {
  if (a.crossings !== b.crossings) {
    return a.crossings - b.crossings;
  }
  if (a.bendCount !== b.bendCount) {
    return a.bendCount - b.bendCount;
  }
  if (Math.abs(a.length - b.length) > 1e-6) {
    return a.length - b.length;
  }
  return a.cost - b.cost;
}

export function route(
  request: OrthogonalRouteRequest,
  config: RouterConfig
): OrthogonalRouteResult | null {
  return routeAlternatives(request, config)[0] ?? null;
}

function addPoint(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function dedupe(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const p of points) {
    const last = result[result.length - 1];
    if (!last || Math.abs(last.x - p.x) > EPSILON || Math.abs(last.y - p.y) > EPSILON) {
      result.push(p);
    }
  }
  return result;
}

export function isOrthogonal(points: Point[]): boolean {
  for (let i = 1; i < points.length; i++) {
    const dx = Math.abs(points[i].x - points[i - 1].x);
    const dy = Math.abs(points[i].y - points[i - 1].y);
    if (dx > EPSILON && dy > EPSILON) {
      return false;
    }
  }
  return true;
}

export function segmentsOf(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 1; i < points.length; i++) {
    segments.push({ a: points[i - 1], b: points[i] });
  }
  return segments;
}
