import type { LayoutData, Node } from '../../../types.js';
import { approxEqual, rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

interface Options {
  spacing?: number;
  tolerance?: number;
  skipAccepted?: boolean;
  onlyAccepted?: boolean;
  allowAcceptedEdgeIds?: string[];
}

export function applyBorderHugClearance(
  layout: LayoutData,
  opts: Options = {}
): { changedEdges: number } {
  const spacing = opts.spacing ?? 10;
  const tol = opts.tolerance ?? 0.75;
  const skipAccepted = opts.skipAccepted ?? false;
  const onlyAccepted = opts.onlyAccepted ?? false;
  const allowAcceptedEdgeIds = new Set(opts.allowAcceptedEdgeIds ?? []);
  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null && !node.isGroup) {
      nodesById.set(String(node.id), node);
    }
  }

  let changedEdges = 0;
  for (const [edgeIdx, edge] of (layout.edges ?? []).entries()) {
    const edgeId = String((edge as { id?: string | number }).id ?? '');
    const accepted = Boolean((edge as { __libavoidAccepted?: boolean }).__libavoidAccepted);
    if (onlyAccepted && !accepted && !allowAcceptedEdgeIds.has(edgeId)) {
      continue;
    }
    if (skipAccepted && accepted && !allowAcceptedEdgeIds.has(edgeId)) {
      continue;
    }
    const pts = (edge as { points?: Point[] }).points;
    const startId = edge.start != null ? String(edge.start) : '';
    const endId = edge.end != null ? String(edge.end) : '';
    const startNode = nodesById.get(startId);
    const endNode = nodesById.get(endId);
    if (!pts || pts.length < 2 || !startNode || !endNode) {
      continue;
    }
    const rs = rectForNode(startNode);
    const re = rectForNode(endNode);
    let changed = false;

    if (pts.length === 2) {
      const candidate = buildDoglegCandidate(layout, edgeIdx, pts, startId, endId, spacing, tol);
      if (candidate) {
        pts.splice(0, pts.length, ...candidate);
        changed = true;
      }
    }

    for (let i = 1; i < pts.length - 2; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (approxEqual(a.x, b.x, tol) && approxEqual(a.y, b.y, tol)) {
        continue;
      }

      // Horizontal middle segment hugging top/bottom of both endpoint boxes.
      if (approxEqual(a.y, b.y, tol)) {
        const y = a.y;
        const hugsTop = approxEqual(y, rs.top, tol) || approxEqual(y, re.top, tol);
        const hugsBottom = approxEqual(y, rs.bottom, tol) || approxEqual(y, re.bottom, tol);
        if (!hugsTop && !hugsBottom) {
          continue;
        }
        const shiftedY = hugsTop ? y - spacing : y + spacing;
        if (
          tryShiftHorizontalSegment(pts, i, shiftedY, layout, startId, endId) &&
          !segmentOverlapsEndpointBorder(pts[i], pts[i + 1], rs, re, tol)
        ) {
          changed = true;
        }
        continue;
      }

      // Vertical middle segment hugging left/right of endpoint boxes.
      if (approxEqual(a.x, b.x, tol)) {
        const x = a.x;
        const hugsLeft = approxEqual(x, rs.left, tol) || approxEqual(x, re.left, tol);
        const hugsRight = approxEqual(x, rs.right, tol) || approxEqual(x, re.right, tol);
        if (!hugsLeft && !hugsRight) {
          continue;
        }
        const shiftedX = hugsLeft ? x - spacing : x + spacing;
        if (
          tryShiftVerticalSegment(pts, i, shiftedX, layout, startId, endId) &&
          !segmentOverlapsEndpointBorder(pts[i], pts[i + 1], rs, re, tol)
        ) {
          changed = true;
        }
      }
    }

    if (changed) {
      changedEdges++;
    }
  }

  return { changedEdges };
}

function tryShiftHorizontalSegment(
  pts: Point[],
  segIdx: number,
  newY: number,
  layout: LayoutData,
  startId: string,
  endId: string
): boolean {
  const candidate = pts.map((p) => ({ ...p }));
  candidate[segIdx].y = newY;
  candidate[segIdx + 1].y = newY;
  if (segIdx - 1 >= 0) {
    candidate[segIdx].x = pts[segIdx].x;
  }
  if (segIdx + 2 < candidate.length) {
    candidate[segIdx + 1].x = pts[segIdx + 1].x;
  }
  if (polylineClear(candidate, layout, startId, endId)) {
    pts.splice(0, pts.length, ...candidate);
    return true;
  }
  return false;
}

function tryShiftVerticalSegment(
  pts: Point[],
  segIdx: number,
  newX: number,
  layout: LayoutData,
  startId: string,
  endId: string
): boolean {
  const candidate = pts.map((p) => ({ ...p }));
  candidate[segIdx].x = newX;
  candidate[segIdx + 1].x = newX;
  if (polylineClear(candidate, layout, startId, endId)) {
    pts.splice(0, pts.length, ...candidate);
    return true;
  }
  return false;
}

function buildDoglegCandidate(
  layout: LayoutData,
  edgeIdx: number,
  pts: Point[],
  startId: string,
  endId: string,
  spacing: number,
  tol: number
): Point[] | null {
  const [a, b] = pts;
  const offsets = [spacing * 2, -spacing * 2, spacing * 3, -spacing * 3, spacing * 4, -spacing * 4];
  const baselinePenalty = parallelPenalty(layout, edgeIdx, a, b, tol);
  let best: { pts: Point[]; penalty: number; offsetAbs: number } | null = null;

  if (approxEqual(a.y, b.y, tol) && Math.abs(a.x - b.x) > spacing * 4) {
    for (const delta of offsets) {
      const midY = a.y + delta;
      const candidate = [
        { x: a.x, y: a.y },
        { x: a.x, y: midY },
        { x: b.x, y: midY },
        { x: b.x, y: b.y },
      ];
      if (!polylineClear(candidate, layout, startId, endId)) {
        continue;
      }
      const penalty = parallelPenalty(layout, edgeIdx, candidate[1], candidate[2], tol);
      if (
        !best ||
        penalty < best.penalty ||
        (penalty === best.penalty && Math.abs(delta) < best.offsetAbs)
      ) {
        best = { pts: candidate, penalty, offsetAbs: Math.abs(delta) };
      }
    }
  } else if (approxEqual(a.x, b.x, tol) && Math.abs(a.y - b.y) > spacing * 4) {
    for (const delta of offsets) {
      const midX = a.x + delta;
      const candidate = [
        { x: a.x, y: a.y },
        { x: midX, y: a.y },
        { x: midX, y: b.y },
        { x: b.x, y: b.y },
      ];
      if (!polylineClear(candidate, layout, startId, endId)) {
        continue;
      }
      const penalty = parallelPenalty(layout, edgeIdx, candidate[1], candidate[2], tol);
      if (
        !best ||
        penalty < best.penalty ||
        (penalty === best.penalty && Math.abs(delta) < best.offsetAbs)
      ) {
        best = { pts: candidate, penalty, offsetAbs: Math.abs(delta) };
      }
    }
  }

  if (!best) {
    return null;
  }
  return best.penalty < baselinePenalty ||
    (edgeSeemsLibavoidAccepted(layout, edgeIdx) && best.penalty <= baselinePenalty)
    ? best.pts
    : null;
}

function edgeSeemsLibavoidAccepted(layout: LayoutData, edgeIdx: number): boolean {
  const edge = (layout.edges ?? [])[edgeIdx] as { __libavoidAccepted?: boolean } | undefined;
  return Boolean(edge?.__libavoidAccepted);
}

function parallelPenalty(
  layout: LayoutData,
  edgeIdx: number,
  a: Point,
  b: Point,
  tol: number
): number {
  let penalty = 0;
  const horizontal = approxEqual(a.y, b.y, tol);
  const vertical = approxEqual(a.x, b.x, tol);
  if (!horizontal && !vertical) {
    return Number.POSITIVE_INFINITY;
  }
  for (const [otherIdx, edge] of (layout.edges ?? []).entries()) {
    if (otherIdx === edgeIdx) {
      continue;
    }
    const otherPts = (edge as { points?: Point[] }).points;
    if (!otherPts || otherPts.length < 2) {
      continue;
    }
    for (let i = 0; i < otherPts.length - 1; i++) {
      const p = otherPts[i];
      const q = otherPts[i + 1];
      if (horizontal && approxEqual(p.y, q.y, tol)) {
        const overlap =
          Math.min(Math.max(a.x, b.x), Math.max(p.x, q.x)) -
          Math.max(Math.min(a.x, b.x), Math.min(p.x, q.x));
        if (overlap > 0) {
          const dist = Math.abs(a.y - p.y);
          penalty += overlap / Math.max(dist, 1);
        }
      } else if (vertical && approxEqual(p.x, q.x, tol)) {
        const overlap =
          Math.min(Math.max(a.y, b.y), Math.max(p.y, q.y)) -
          Math.max(Math.min(a.y, b.y), Math.min(p.y, q.y));
        if (overlap > 0) {
          const dist = Math.abs(a.x - p.x);
          penalty += overlap / Math.max(dist, 1);
        }
      }
    }
  }
  return penalty;
}

function polylineClear(pts: Point[], layout: LayoutData, startId: string, endId: string): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const node of layout.nodes ?? []) {
      if (node?.id == null || node.isGroup) {
        continue;
      }
      const id = String(node.id);
      if (id === startId || id === endId) {
        continue;
      }
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rectForNode(node))) {
        return false;
      }
    }
  }
  return true;
}

function segmentOverlapsEndpointBorder(
  a: Point,
  b: Point,
  rs: ReturnType<typeof rectForNode>,
  re: ReturnType<typeof rectForNode>,
  tol: number
): boolean {
  if (approxEqual(a.y, b.y, tol)) {
    return (
      approxEqual(a.y, rs.top, tol) ||
      approxEqual(a.y, rs.bottom, tol) ||
      approxEqual(a.y, re.top, tol) ||
      approxEqual(a.y, re.bottom, tol)
    );
  }
  if (approxEqual(a.x, b.x, tol)) {
    return (
      approxEqual(a.x, rs.left, tol) ||
      approxEqual(a.x, rs.right, tol) ||
      approxEqual(a.x, re.left, tol) ||
      approxEqual(a.x, re.right, tol)
    );
  }
  return false;
}
