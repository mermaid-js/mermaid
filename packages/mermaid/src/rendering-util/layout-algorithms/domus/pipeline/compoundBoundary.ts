import type { Node } from '../../../types.js';
import type { Point, Rect, PortSide } from '../types.js';
import { approxEqual, clamp, computeBoundaryPort, rectForNode } from '../core/helpers.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';

export interface CompoundBoundaryStep {
  groupId: string;
  side: PortSide;
  requestId: string;
  preferredT: number;
}

export function snapPoint(p: Point): Point {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

export function chooseSideBetweenPointAndRect(
  from: Point,
  rect: { cx: number; cy: number }
): 'E' | 'W' | 'N' | 'S' {
  const dx = rect.cx - from.x;
  const dy = rect.cy - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'W' : 'E';
  }
  return dy >= 0 ? 'N' : 'S';
}

function compoundBoundaryRequestKey(groupId: string, side: PortSide): string {
  return `${groupId}:${side}`;
}

function preferredTForSide(from: Point, r: Rect, side: PortSide): number {
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  // N/S: align with x; E/W: align with y
  switch (side) {
    case 'N':
    case 'S': {
      const w = Math.max(1e-9, r.right - r.left);
      return clamp01((from.x - r.left) / w);
    }
    case 'E':
    case 'W': {
      const h = Math.max(1e-9, r.bottom - r.top);
      return clamp01((from.y - r.top) / h);
    }
  }
}

export { preferredTForSide };

export function buildCompoundBoundarySteps(
  edgeId: string,
  startNode: Node,
  endNode: Node,
  nodesById: Map<string, Node>,
  startPort: Point
): CompoundBoundaryStep[] {
  const startAnc = ancestorGroupIds(startNode, nodesById);
  const endAnc = ancestorGroupIds(endNode, nodesById);
  const cp = commonPrefixLen(startAnc, endAnc);
  const leaving = startAnc.slice(cp).reverse(); // innermost -> outermost
  const entering = endAnc.slice(cp); // outermost -> innermost

  const steps: CompoundBoundaryStep[] = [];

  let prev = snapPoint(startPort);
  let idx = 0;

  for (const gid of leaving) {
    const g = nodesById.get(gid);
    if (!g) {
      continue;
    }
    const r = rectForNode(g);
    const side = chooseSideBetweenPointAndRect(prev, r) as PortSide;
    const preferredT = preferredTForSide(prev, r, side);
    const requestId = `${edgeId}:leave:${gid}:${idx++}`;
    steps.push({ groupId: gid, side, requestId, preferredT });
    // Update prev using the center port to keep side selection stable.
    prev = snapPoint(computeBoundaryPort(r, side));
  }
  for (const gid of entering) {
    const g = nodesById.get(gid);
    if (!g) {
      continue;
    }
    const r = rectForNode(g);
    const side = chooseSideBetweenPointAndRect(prev, r) as PortSide;
    const preferredT = preferredTForSide(prev, r, side);
    const requestId = `${edgeId}:enter:${gid}:${idx++}`;
    steps.push({ groupId: gid, side, requestId, preferredT });
    prev = snapPoint(computeBoundaryPort(r, side));
  }

  return steps;
}

export function allocateBoundaryTs(
  stepsByEdgeId: Map<string, CompoundBoundaryStep[]>
): Map<string, number> {
  const reqsByGroupSide = new Map<string, { requestId: string; preferredT: number }[]>();
  for (const steps of stepsByEdgeId.values()) {
    for (const s of steps) {
      const k = compoundBoundaryRequestKey(s.groupId, s.side);
      const arr = reqsByGroupSide.get(k) ?? [];
      arr.push({ requestId: s.requestId, preferredT: s.preferredT });
      reqsByGroupSide.set(k, arr);
    }
  }

  const tByRequestId = new Map<string, number>();
  for (const [k, reqs] of reqsByGroupSide) {
    // Deterministic ordering, but biased by preferredT so entry/exit aligns with approach.
    reqs.sort((a, b) => a.preferredT - b.preferredT || a.requestId.localeCompare(b.requestId));
    const n = reqs.length;
    const margin = 0.05; // avoid corners
    const delta = 1 / (n + 1);
    const centre = (n - 1) / 2;
    const medianPreferredT = reqs[Math.floor(n / 2)]?.preferredT ?? 0.5;
    const halfSpan = centre * delta;
    const base = clamp(medianPreferredT, margin + halfSpan, 1 - margin - halfSpan);
    for (let i = 0; i < n; i++) {
      const t = clamp(base + (i - centre) * delta, margin, 1 - margin);
      tByRequestId.set(reqs[i].requestId, t);
    }
    void k;
  }
  return tByRequestId;
}

export function concatPolylines(a: Point[], b: Point[]): Point[] {
  if (!a.length) {
    return b;
  }
  if (!b.length) {
    return a;
  }
  const lastA = a[a.length - 1];
  const firstB = b[0];
  if (approxEqual(lastA.x, firstB.x) && approxEqual(lastA.y, firstB.y)) {
    return [...a, ...b.slice(1)];
  }
  return [...a, ...b];
}

function snapToGrid(v: number, spacing: number): number {
  if (spacing <= 0) {
    return Math.round(v);
  }
  return Math.round(v / spacing) * spacing;
}

export function snapBoundaryPortAtT(rect: Rect, side: PortSide, t: number, spacing: number): Point {
  // Important: keep the coordinate that lies on the boundary EXACT (rect.left/right/top/bottom),
  // otherwise rounding can push the waypoint slightly outside the group and break containment.
  const p = computeBoundaryPortAtT(rect, side, t);
  switch (side) {
    case 'E':
      return { x: rect.right, y: clamp(snapToGrid(p.y, spacing), rect.top, rect.bottom) };
    case 'W':
      return { x: rect.left, y: clamp(snapToGrid(p.y, spacing), rect.top, rect.bottom) };
    case 'N':
      return { x: clamp(snapToGrid(p.x, spacing), rect.left, rect.right), y: rect.top };
    case 'S':
      return { x: clamp(snapToGrid(p.x, spacing), rect.left, rect.right), y: rect.bottom };
  }
}
