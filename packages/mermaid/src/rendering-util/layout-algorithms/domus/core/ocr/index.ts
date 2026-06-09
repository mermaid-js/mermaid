import { log } from '../../../../../logger.js';
import { ORTHO_DEBUG } from '../../debug.js';
import type { Point, Rect } from '../../types.js';
import {
  approxEqual,
  manhattanDistance,
  manhattanLength,
  segmentIntersectsRectInterior,
} from '../helpers.js';
import { compressCollinear, inflateRect } from '../routing.js';
import { MinHeap } from '../minHeap.js';

type Dir = 'N' | 'E' | 'S' | 'W';

export interface OcrRouteOptions {
  /** Deterministic bound: maximum number of state expansions in A*. */
  maxExpansions: number;
}

export interface OcrRouteResult {
  points: Point[] | null;
  stats: { nodes: number; edges: number; expansions: number };
}

interface Vertex {
  id: string;
  x: number;
  y: number;
}

interface AdjEdge {
  to: number;
  dir: Dir;
  len: number;
}

interface Ovg {
  vertices: Vertex[];
  adj: AdjEdge[][];
  startIdx: number;
  endIdx: number;
}

function keyOfPoint(p: Point): string {
  // Deterministic stable IDs based solely on coordinates.
  return `v:${p.x}:${p.y}`;
}

function pointInAnyObstacleInterior(p: Point, obstacles: Rect[]): boolean {
  for (const r of obstacles) {
    if (p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom) {
      return true;
    }
  }
  return false;
}

function segmentHitsAnyObstacle(a: Point, b: Point, obstacles: Rect[]): boolean {
  for (const r of obstacles) {
    if (segmentIntersectsRectInterior(a, b, r)) {
      return true;
    }
  }
  return false;
}

function computeBounds(obstacles: Rect[], a: Point, b: Point, margin: number): Rect {
  let left = Math.min(a.x, b.x);
  let right = Math.max(a.x, b.x);
  let top = Math.min(a.y, b.y);
  let bottom = Math.max(a.y, b.y);
  for (const r of obstacles) {
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  }
  left -= margin;
  right += margin;
  top -= margin;
  bottom += margin;
  return {
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    left,
    right,
    top,
    bottom,
  };
}

function intersectsBounds(p: Point, bounds: Rect): boolean {
  return p.x >= bounds.left && p.x <= bounds.right && p.y >= bounds.top && p.y <= bounds.bottom;
}

function buildOvg(obstaclesRaw: Rect[], start: Point, end: Point, spacing: number): Ovg | null {
  // Use a small clearance around obstacles so OCR avoids “riding” on borders.
  // Deterministic: derived only from spacing.
  const clearance = Math.max(0, Math.min(10, Math.floor(spacing / 2)));
  const obstacles = obstaclesRaw.map((r) => inflateRect(r, clearance));

  const bounds = computeBounds(obstacles, start, end, Math.max(40, spacing * 4));

  // Interesting points: obstacle corners + ports + bounds corners.
  const ip: Point[] = [];
  const push = (p: Point) => {
    if (!intersectsBounds(p, bounds)) {
      return;
    }
    ip.push({ x: p.x, y: p.y });
  };
  push(start);
  push(end);
  push({ x: bounds.left, y: bounds.top });
  push({ x: bounds.right, y: bounds.top });
  push({ x: bounds.left, y: bounds.bottom });
  push({ x: bounds.right, y: bounds.bottom });
  for (const r of obstacles) {
    push({ x: r.left, y: r.top });
    push({ x: r.right, y: r.top });
    push({ x: r.left, y: r.bottom });
    push({ x: r.right, y: r.bottom });
  }

  // Dedup by coordinate (stable).
  const ipByKey = new Map<string, Point>();
  for (const p of ip) {
    ipByKey.set(keyOfPoint(p), p);
  }
  const points = [...ipByKey.values()].sort((a, b) => a.x - b.x || a.y - b.y);

  // Build “interesting segments” via ray casting from each point.
  interface Seg {
    o: 'H' | 'V';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  const segs: Seg[] = [];

  const stopH = (p: Point): { left: number; right: number } => {
    let left = bounds.left;
    let right = bounds.right;
    for (const r of obstacles) {
      if (p.y < r.top || p.y > r.bottom) {
        continue;
      }
      // obstacle blocks horizontal ray if its vertical span covers p.y
      if (r.right <= p.x) {
        left = Math.max(left, r.right);
      }
      if (r.left >= p.x) {
        right = Math.min(right, r.left);
      }
    }
    return { left, right };
  };

  const stopV = (p: Point): { top: number; bottom: number } => {
    let top = bounds.top;
    let bottom = bounds.bottom;
    for (const r of obstacles) {
      if (p.x < r.left || p.x > r.right) {
        continue;
      }
      if (r.bottom <= p.y) {
        top = Math.max(top, r.bottom);
      }
      if (r.top >= p.y) {
        bottom = Math.min(bottom, r.top);
      }
    }
    return { top, bottom };
  };

  for (const p of points) {
    if (pointInAnyObstacleInterior(p, obstacles)) {
      continue;
    }
    const h = stopH(p);
    segs.push({ o: 'H', x1: h.left, y1: p.y, x2: h.right, y2: p.y });
    const v = stopV(p);
    segs.push({ o: 'V', x1: p.x, y1: v.top, x2: p.x, y2: v.bottom });
  }

  // Compute vertices = IP ∪ (HI ∩ VI).
  const vByKey = new Map<string, Point>();
  const addV = (p: Point) => {
    if (pointInAnyObstacleInterior(p, obstacles)) {
      return;
    }
    vByKey.set(keyOfPoint(p), p);
  };
  for (const p of points) {
    addV(p);
  }

  const horiz = segs.filter((s) => s.o === 'H');
  const vert = segs.filter((s) => s.o === 'V');
  for (const h of horiz) {
    const y = h.y1;
    const xLo = Math.min(h.x1, h.x2);
    const xHi = Math.max(h.x1, h.x2);
    for (const v of vert) {
      const x = v.x1;
      const yLo = Math.min(v.y1, v.y2);
      const yHi = Math.max(v.y1, v.y2);
      if (x < xLo || x > xHi || y < yLo || y > yHi) {
        continue;
      }
      addV({ x, y });
    }
  }

  const vertsPts = [...vByKey.values()].sort((a, b) => a.x - b.x || a.y - b.y);
  if (vertsPts.length < 2) {
    return null;
  }

  const vertices: Vertex[] = vertsPts.map((p) => ({ id: keyOfPoint(p), x: p.x, y: p.y }));
  const idxById = new Map<string, number>();
  for (const [i, vertex] of vertices.entries()) {
    idxById.set(vertex.id, i);
  }

  const startIdx = idxById.get(keyOfPoint(start));
  const endIdx = idxById.get(keyOfPoint(end));
  if (startIdx == null || endIdx == null) {
    return null;
  }

  const adj: AdjEdge[][] = Array.from({ length: vertices.length }, () => []);

  // Connect nearest visible neighbors per direction by scanning same-x and same-y lines.
  const byX = new Map<number, number[]>();
  const byY = new Map<number, number[]>();
  for (const [i, v] of vertices.entries()) {
    (byX.get(v.x) ?? byX.set(v.x, []).get(v.x)!).push(i);
    (byY.get(v.y) ?? byY.set(v.y, []).get(v.y)!).push(i);
  }
  for (const list of byX.values()) {
    list.sort(
      (i, j) => vertices[i].y - vertices[j].y || vertices[i].id.localeCompare(vertices[j].id)
    );
    for (let k = 0; k < list.length - 1; k++) {
      const aIdx = list[k];
      const bIdx = list[k + 1];
      const aP = { x: vertices[aIdx].x, y: vertices[aIdx].y };
      const bP = { x: vertices[bIdx].x, y: vertices[bIdx].y };
      if (segmentHitsAnyObstacle(aP, bP, obstacles)) {
        continue;
      }
      const len = Math.abs(bP.y - aP.y);
      adj[aIdx].push({ to: bIdx, dir: 'S', len });
      adj[bIdx].push({ to: aIdx, dir: 'N', len });
    }
  }
  for (const list of byY.values()) {
    list.sort(
      (i, j) => vertices[i].x - vertices[j].x || vertices[i].id.localeCompare(vertices[j].id)
    );
    for (let k = 0; k < list.length - 1; k++) {
      const aIdx = list[k];
      const bIdx = list[k + 1];
      const aP = { x: vertices[aIdx].x, y: vertices[aIdx].y };
      const bP = { x: vertices[bIdx].x, y: vertices[bIdx].y };
      if (segmentHitsAnyObstacle(aP, bP, obstacles)) {
        continue;
      }
      const len = Math.abs(bP.x - aP.x);
      adj[aIdx].push({ to: bIdx, dir: 'E', len });
      adj[bIdx].push({ to: aIdx, dir: 'W', len });
    }
  }

  // Deterministic adjacency ordering for tie-breaking in A*.
  const dirOrder: Record<Dir, number> = { N: 0, E: 1, S: 2, W: 3 };
  for (const element of adj) {
    element.sort((a, b) => a.len - b.len || dirOrder[a.dir] - dirOrder[b.dir] || a.to - b.to);
  }

  return { vertices, adj, startIdx, endIdx };
}

function minBendsLowerBound(cur: Point, goal: Point, arrival: Dir | null): number {
  const aligned = approxEqual(cur.x, goal.x) || approxEqual(cur.y, goal.y);
  if (aligned) {
    if (arrival == null) {
      return 0;
    }
    if (approxEqual(cur.x, goal.x)) {
      const needed: Dir = goal.y >= cur.y ? 'S' : 'N';
      return arrival === needed ? 0 : 1;
    }
    const needed: Dir = goal.x >= cur.x ? 'E' : 'W';
    return arrival === needed ? 0 : 1;
  }
  // Not aligned: at least 1 bend, possibly 2 if we must turn immediately.
  if (arrival == null) {
    return 1;
  }
  // Any move changes either x or y; if arrival is incompatible with both axes direction,
  // conservatively return 2.
  const canContinueHoriz = arrival === 'E' || arrival === 'W';
  const canContinueVert = arrival === 'N' || arrival === 'S';
  return canContinueHoriz || canContinueVert ? 1 : 2;
}

export function findOcrPathBetweenPortsWithObstacles(
  startPort: Point,
  endPort: Point,
  obstacleRects: Rect[],
  spacing: number,
  opts: Partial<OcrRouteOptions> = {}
): OcrRouteResult {
  const maxExpansions = opts.maxExpansions ?? 50_000;

  // Rule 1: straight shot fast path.
  if (
    (approxEqual(startPort.x, endPort.x) || approxEqual(startPort.y, endPort.y)) &&
    !segmentHitsAnyObstacle(startPort, endPort, obstacleRects)
  ) {
    return {
      points: [startPort, endPort],
      stats: { nodes: 0, edges: 0, expansions: 0 },
    };
  }

  const ovg = buildOvg(obstacleRects, startPort, endPort, spacing);
  if (!ovg) {
    return { points: null, stats: { nodes: 0, edges: 0, expansions: 0 } };
  }

  const { vertices, adj, startIdx, endIdx } = ovg;
  const edgesCount = adj.reduce((s, a) => s + a.length, 0) / 2;

  // Cost: bends first, then length.
  const boundsLmax =
    Math.max(
      1,
      Math.abs(vertices[startIdx].x - vertices[endIdx].x) +
        Math.abs(vertices[startIdx].y - vertices[endIdx].y)
    ) +
    1 +
    // Inflate with graph scale so "bends dominate" always holds.
    Math.ceil(
      manhattanLength(vertices.map((v) => ({ x: v.x, y: v.y }))) / Math.max(1, vertices.length)
    );
  const Lmax = Math.max(boundsLmax, 10_000);

  // State is (nodeIdx, arrivalDirIndex) where arrivalDirIndex in [0..3], plus 4 for null.
  const ARR_NULL = 4;
  const dirToIdx: Record<Dir, number> = { N: 0, E: 1, S: 2, W: 3 };
  const idxToDir: (Dir | null)[] = ['N', 'E', 'S', 'W', null];

  const totalStates = vertices.length * 5;
  const dist = new Array<number>(totalStates).fill(Number.POSITIVE_INFINITY);
  const bends = new Array<number>(totalStates).fill(Number.POSITIVE_INFINITY);
  const lens = new Array<number>(totalStates).fill(Number.POSITIVE_INFINITY);
  const prev = new Array<number>(totalStates).fill(-1);
  const prevDir = new Array<number>(totalStates).fill(-1);

  const startState = startIdx * 5 + ARR_NULL;
  dist[startState] = 0;
  bends[startState] = 0;
  lens[startState] = 0;

  const goalPoint = { x: vertices[endIdx].x, y: vertices[endIdx].y };

  interface PQ {
    state: number;
    f: number;
    g: number;
    b: number;
    l: number;
    node: number;
    ad: number;
  }
  const heap = new MinHeap<PQ>((x, y) => {
    if (x.f !== y.f) {
      return x.f < y.f;
    }
    if (x.g !== y.g) {
      return x.g < y.g;
    }
    if (x.b !== y.b) {
      return x.b < y.b;
    }
    if (x.l !== y.l) {
      return x.l < y.l;
    }
    if (x.node !== y.node) {
      return x.node < y.node;
    }
    return x.ad < y.ad;
  });

  const hFor = (nodeIdx: number, arrival: Dir | null): number => {
    const p = { x: vertices[nodeIdx].x, y: vertices[nodeIdx].y };
    const hLen = manhattanDistance(p, goalPoint);
    const hB = minBendsLowerBound(p, goalPoint, arrival);
    return hB * Lmax + hLen;
  };

  heap.push({
    state: startState,
    g: 0,
    f: hFor(startIdx, null),
    b: 0,
    l: 0,
    node: startIdx,
    ad: ARR_NULL,
  });

  let expansions = 0;
  const goalStates: number[] = [];

  while (heap.size > 0) {
    const cur = heap.pop()!;
    if (cur.g !== dist[cur.state]) {
      continue;
    }
    expansions++;
    if (expansions > maxExpansions) {
      break;
    }

    const nodeIdx = cur.node;
    const arrivalDir = idxToDir[cur.ad];

    if (nodeIdx === endIdx) {
      goalStates.push(cur.state);
      // Keep searching a bit to ensure deterministic "best" across arrival dirs.
      // But since our tie-breaking is strict and we pop in f-order, the first goal is optimal.
      break;
    }

    for (const e of adj[nodeIdx]) {
      const nextNode = e.to;
      const nextDir = e.dir;
      const bendInc = arrivalDir == null || arrivalDir === nextDir ? 0 : 1;
      const nb = cur.b + bendInc;
      const nl = cur.l + e.len;
      const ng = nb * Lmax + nl;
      const nextState = nextNode * 5 + dirToIdx[nextDir];

      if (
        ng < dist[nextState] ||
        (ng === dist[nextState] &&
          (nb < bends[nextState] || (nb === bends[nextState] && nl < lens[nextState])))
      ) {
        dist[nextState] = ng;
        bends[nextState] = nb;
        lens[nextState] = nl;
        prev[nextState] = cur.state;
        prevDir[nextState] = cur.ad;
        const h = hFor(nextNode, nextDir);
        heap.push({
          state: nextState,
          g: ng,
          f: ng + h,
          b: nb,
          l: nl,
          node: nextNode,
          ad: dirToIdx[nextDir],
        });
      }
    }
  }

  // Pick best goal among visited arrival directions.
  let bestGoal = -1;
  for (let d = 0; d < 4; d++) {
    const st = endIdx * 5 + d;
    if (!Number.isFinite(dist[st])) {
      continue;
    }
    if (
      bestGoal === -1 ||
      dist[st] < dist[bestGoal] ||
      (dist[st] === dist[bestGoal] &&
        (bends[st] < bends[bestGoal] ||
          (bends[st] === bends[bestGoal] && lens[st] < lens[bestGoal])))
    ) {
      bestGoal = st;
    }
  }
  if (bestGoal === -1) {
    return { points: null, stats: { nodes: vertices.length, edges: edgesCount, expansions } };
  }

  const path: Point[] = [];
  let cur = bestGoal;
  while (cur !== -1) {
    const node = Math.floor(cur / 5);
    path.push({ x: vertices[node].x, y: vertices[node].y });
    cur = prev[cur];
  }
  path.reverse();

  const pts = compressCollinear(path);
  log.debug(ORTHO_DEBUG, 'OCR_ROUTE', {
    ok: Boolean(pts && pts.length >= 2),
    nodes: vertices.length,
    edges: edgesCount,
    expansions,
    bends: bends[bestGoal],
    length: lens[bestGoal],
  });

  return { points: pts, stats: { nodes: vertices.length, edges: edgesCount, expansions } };
}
