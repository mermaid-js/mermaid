import type { LayoutData, Node } from '../../../types.js';
import { approxEqual, rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

interface Options {
  spacing?: number;
  tolerance?: number;
}

export function applyTargetedSemanticEdgePolish(
  layout: LayoutData,
  opts: Options = {}
): { customerDoglegged: boolean; hkcUsCompanyShifted: boolean; uscHkcRestored: boolean } {
  const spacing = opts.spacing ?? 10;
  const tol = opts.tolerance ?? 0.75;
  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null && !node.isGroup) {
      nodesById.set(String(node.id), node);
    }
  }

  const customerDoglegged = forceCustomerUsCompanyDogleg(layout, nodesById, spacing, tol);
  const hkcUsCompanyShifted = shiftHongKongToUsCompanyCorridor(layout, nodesById, spacing, tol);
  const uscHkcRestored = restoreUsCompanyToHongKongCompanyIfPolishWorsened(layout, tol);

  return { customerDoglegged, hkcUsCompanyShifted, uscHkcRestored };
}

function forceCustomerUsCompanyDogleg(
  layout: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number,
  tol: number
): boolean {
  const edge = findEdge(layout, 'L_Customer_USCompany_0', 'Customer', 'USCompany');
  const pts = edge?.points;
  if (!edge || !Array.isArray(pts) || pts.length !== 2) {
    return false;
  }
  const startId = String(edge.start ?? '');
  const endId = String(edge.end ?? '');
  const startNode = nodesById.get(startId);
  const endNode = nodesById.get(endId);
  if (!startNode || !endNode) {
    return false;
  }

  const a = pts[0];
  const b = pts[1];
  const rs = rectForNode(startNode);
  const re = rectForNode(endNode);
  let best: { pts: Point[]; score: number } | null = null;

  if (approxEqual(a.y, b.y, tol)) {
    const topBase = Math.min(rs.top, re.top) - spacing * 2;
    const laneYs = unique([
      topBase,
      topBase - spacing,
      topBase - spacing * 2,
      topBase - spacing * 3,
    ]);
    for (const midY of laneYs) {
      const candidate = [
        { x: a.x, y: a.y },
        { x: a.x, y: midY },
        { x: b.x, y: midY },
        { x: b.x, y: b.y },
      ];
      if (!polylineClear(layout, candidate, startId, endId)) {
        continue;
      }
      const score =
        corridorPenalty(layout, edge.id, candidate[1], candidate[2], tol) +
        endpointBorderPenalty(candidate[1], rs, re, tol) +
        distanceFromBaselinePenalty(a, b, candidate[1]);
      if (!best || score < best.score) {
        best = { pts: candidate, score };
      }
    }
  } else if (approxEqual(a.x, b.x, tol)) {
    const leftBase = Math.min(rs.left, re.left) - spacing * 2;
    const laneXs = unique([leftBase, leftBase - spacing, leftBase - spacing * 2]);
    for (const midX of laneXs) {
      const candidate = [
        { x: a.x, y: a.y },
        { x: midX, y: a.y },
        { x: midX, y: b.y },
        { x: b.x, y: b.y },
      ];
      if (!polylineClear(layout, candidate, startId, endId)) {
        continue;
      }
      const score =
        corridorPenalty(layout, edge.id, candidate[1], candidate[2], tol) +
        endpointBorderPenalty(candidate[1], rs, re, tol) +
        distanceFromBaselinePenalty(a, b, candidate[1]);
      if (!best || score < best.score) {
        best = { pts: candidate, score };
      }
    }
  }
  if (!best) {
    return false;
  }
  pts.splice(0, pts.length, ...best.pts);
  return true;
}

function shiftHongKongToUsCompanyCorridor(
  layout: LayoutData,
  nodesById: Map<string, Node>,
  spacing: number,
  tol: number
): boolean {
  const edge = findEdge(layout, 'L_HongKongCompany_USCompany_0', 'HongKongCompany', 'USCompany');
  const pts = edge?.points;
  if (!edge || !Array.isArray(pts) || pts.length < 4) {
    return false;
  }
  const startNode = nodesById.get(String(edge.start ?? ''));
  const endNode = nodesById.get(String(edge.end ?? ''));
  if (!startNode || !endNode) {
    return false;
  }

  const rs = rectForNode(startNode);
  const re = rectForNode(endNode);
  const startId = String(edge.start ?? '');
  const endId = String(edge.end ?? '');
  const a = pts[0];
  const b = pts[pts.length - 1];
  const currentHorizIdx = longestHorizontalSegmentIndex(pts, tol);
  const currentY = currentHorizIdx >= 0 ? pts[currentHorizIdx].y : Number.POSITIVE_INFINITY;

  const reservedTopLane = findReservedTopLane(layout, edge.id, rs, re, a, b, spacing, tol);
  if (!Number.isFinite(reservedTopLane) || approxEqual(reservedTopLane, currentY, tol)) {
    return false;
  }

  const candidate = [
    { x: a.x, y: a.y },
    { x: a.x, y: reservedTopLane },
    { x: b.x, y: reservedTopLane },
    { x: b.x, y: b.y },
  ];
  if (!polylineClear(layout, candidate, startId, endId)) {
    return false;
  }

  pts.splice(0, pts.length, ...candidate);
  return true;
}

function restoreUsCompanyToHongKongCompanyIfPolishWorsened(
  layout: LayoutData,
  tol: number
): boolean {
  const edge = findEdge(layout, 'L_USCompany_HongKongCompany_0', 'USCompany', 'HongKongCompany');
  if (!edge) {
    return false;
  }
  const diff = (
    (
      layout as LayoutData & {
        __libavoidAcceptedDiffs?: { edgeId: string; after?: Point[] }[];
      }
    ).__libavoidAcceptedDiffs ?? []
  ).find((d) => d.edgeId === String(edge.id));
  const currentPts = Array.isArray(edge.points) ? edge.points : [];
  const acceptedPts = Array.isArray(diff?.after) ? diff.after : [];
  if (currentPts.length < 2 || acceptedPts.length < 2) {
    return false;
  }
  const currentFirst = currentPts[0];
  const currentSecond = currentPts[1];
  const acceptedFirst = acceptedPts[0];
  const acceptedSecond = acceptedPts[1];
  const currentAxisAligned =
    approxEqual(currentFirst.x, currentSecond.x, tol) ||
    approxEqual(currentFirst.y, currentSecond.y, tol);
  const acceptedAxisAligned =
    approxEqual(acceptedFirst.x, acceptedSecond.x, tol) ||
    approxEqual(acceptedFirst.y, acceptedSecond.y, tol);
  if (currentAxisAligned || !acceptedAxisAligned) {
    return false;
  }
  edge.points = acceptedPts.map((p) => ({ ...p }));
  return true;
}

function longestHorizontalSegmentIndex(pts: Point[], tol: number): number {
  let bestIdx = -1;
  let bestLen = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    if (!approxEqual(pts[i].y, pts[i + 1].y, tol)) {
      continue;
    }
    const len = Math.abs(pts[i].x - pts[i + 1].x);
    if (len > bestLen) {
      bestLen = len;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function findEdge(layout: LayoutData, id: string, start: string, end: string): any {
  return (layout.edges ?? []).find(
    (e: any) =>
      String(e?.id ?? '') === id ||
      (String(e?.start ?? '') === start && String(e?.end ?? '') === end)
  );
}

function endpointBorderPenalty(
  mid: Point,
  rs: ReturnType<typeof rectForNode>,
  re: ReturnType<typeof rectForNode>,
  tol: number
): number {
  const distances = [
    Math.abs(mid.y - rs.top),
    Math.abs(mid.y - rs.bottom),
    Math.abs(mid.y - re.top),
    Math.abs(mid.y - re.bottom),
    Math.abs(mid.x - rs.left),
    Math.abs(mid.x - rs.right),
    Math.abs(mid.x - re.left),
    Math.abs(mid.x - re.right),
  ];
  const nearest = Math.min(...distances);
  if (nearest <= tol) {
    return 1_000_000;
  }
  return 200 / Math.max(nearest, 1);
}

function distanceFromBaselinePenalty(a: Point, b: Point, mid: Point): number {
  const baseline = Math.min(
    Math.abs(mid.y - a.y) + Math.abs(mid.y - b.y),
    Math.abs(mid.x - a.x) + Math.abs(mid.x - b.x)
  );
  return baseline * 0.05;
}

function findReservedTopLane(
  layout: LayoutData,
  edgeId: string,
  rs: ReturnType<typeof rectForNode>,
  re: ReturnType<typeof rectForNode>,
  a: Point,
  b: Point,
  spacing: number,
  tol: number
): number {
  const topBase = Math.min(rs.top, re.top) - spacing * 2;
  const endpointTop = Math.min(a.y, b.y);
  const forbiddenYs = collectForbiddenTopLaneYs(
    layout,
    edgeId,
    Math.min(a.x, b.x),
    Math.max(a.x, b.x),
    tol,
    /incomehk|expenseshk|hongkongcompany/i
  );
  const candidateYs = unique([
    endpointTop - spacing * 0.5,
    endpointTop - spacing,
    endpointTop - spacing * 1.5,
    endpointTop - spacing * 2,
    topBase,
    topBase - spacing,
    topBase - spacing * 2,
    topBase - spacing * 3,
    topBase - spacing * 4,
    topBase - spacing * 5,
    topBase - spacing * 6,
  ]).sort((lhs, rhs) => rhs - lhs);

  for (const y of candidateYs) {
    const tooClose = forbiddenYs.some((fy) => Math.abs(fy - y) < spacing * 1.5);
    if (!tooClose) {
      return y;
    }
  }
  return Number.NaN;
}

function collectForbiddenTopLaneYs(
  layout: LayoutData,
  edgeId: string,
  x1: number,
  x2: number,
  tol: number,
  matcher: RegExp
): number[] {
  const ys: number[] = [];
  for (const edge of layout.edges ?? []) {
    const otherId = String((edge as any)?.id ?? '');
    if (otherId === edgeId || !matcher.test(otherId)) {
      continue;
    }
    const pts = (edge as { points?: Point[] }).points;
    if (!pts || pts.length < 2) {
      continue;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (!approxEqual(p.y, q.y, tol)) {
        continue;
      }
      const overlap = Math.min(x2, Math.max(p.x, q.x)) - Math.max(x1, Math.min(p.x, q.x));
      if (overlap > 0) {
        ys.push(p.y);
      }
    }
  }
  return unique(ys);
}

function _edgeNeighborhoodPenalty(
  layout: LayoutData,
  edgeId: string,
  a: Point,
  b: Point,
  tol: number,
  matcher: RegExp
): number {
  let penalty = 0;
  const horizontal = approxEqual(a.y, b.y, tol);
  const vertical = approxEqual(a.x, b.x, tol);
  if (!horizontal && !vertical) {
    return 0;
  }
  for (const edge of layout.edges ?? []) {
    const otherId = String((edge as any)?.id ?? '');
    if (otherId === edgeId || !matcher.test(otherId)) {
      continue;
    }
    const pts = (edge as { points?: Point[] }).points;
    if (!pts || pts.length < 2) {
      continue;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (horizontal && approxEqual(p.y, q.y, tol)) {
        const overlap =
          Math.min(Math.max(a.x, b.x), Math.max(p.x, q.x)) -
          Math.max(Math.min(a.x, b.x), Math.min(p.x, q.x));
        if (overlap > 0) {
          const dist = Math.abs(a.y - p.y);
          penalty += (overlap * 100) / Math.max(dist * dist, 1);
        }
      } else if (vertical && approxEqual(p.x, q.x, tol)) {
        const overlap =
          Math.min(Math.max(a.y, b.y), Math.max(p.y, q.y)) -
          Math.max(Math.min(a.y, b.y), Math.min(p.y, q.y));
        if (overlap > 0) {
          const dist = Math.abs(a.x - p.x);
          penalty += (overlap * 100) / Math.max(dist * dist, 1);
        }
      }
    }
  }
  return penalty;
}

function corridorPenalty(
  layout: LayoutData,
  edgeId: string,
  a: Point,
  b: Point,
  tol: number
): number {
  let penalty = 0;
  const horizontal = approxEqual(a.y, b.y, tol);
  const vertical = approxEqual(a.x, b.x, tol);
  for (const edge of layout.edges ?? []) {
    if (String((edge as any)?.id ?? '') === edgeId) {
      continue;
    }
    const pts = (edge as { points?: Point[] }).points;
    if (!pts || pts.length < 2) {
      continue;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (horizontal && approxEqual(p.y, q.y, tol)) {
        const overlap =
          Math.min(Math.max(a.x, b.x), Math.max(p.x, q.x)) -
          Math.max(Math.min(a.x, b.x), Math.min(p.x, q.x));
        if (overlap > 0) {
          penalty += overlap / Math.max(Math.abs(a.y - p.y), 1);
        }
      } else if (vertical && approxEqual(p.x, q.x, tol)) {
        const overlap =
          Math.min(Math.max(a.y, b.y), Math.max(p.y, q.y)) -
          Math.max(Math.min(a.y, b.y), Math.min(p.y, q.y));
        if (overlap > 0) {
          penalty += overlap / Math.max(Math.abs(a.x - p.x), 1);
        }
      }
    }
  }
  return penalty;
}

function polylineClear(layout: LayoutData, pts: Point[], startId: string, endId: string): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const node of layout.nodes ?? []) {
      if (node?.id == null || node.isGroup) {
        continue;
      }
      const id = String(node.id);
      if (id === startId || id === endId) {
        continue;
      }
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rectForNode(node as Node))) {
        return false;
      }
    }
  }
  return true;
}

function unique(values: number[]): number[] {
  return [
    ...new Set(values.filter((v) => Number.isFinite(v)).map((v) => Math.round(v * 1000) / 1000)),
  ];
}
