import type { LayoutData, Node } from '../../../types.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

interface Options {
  spacing?: number;
  tolerance?: number;
  minShared?: number;
  maxNearbyDistance?: number;
  desiredGap?: number;
  skipAccepted?: boolean;
  onlyAccepted?: boolean;
  allowAcceptedEdgeIds?: string[];
}

export function applyParallelLaneSeparation(
  layout: LayoutData,
  opts: Options = {}
): { changedEdges: number } {
  const spacing = opts.spacing ?? 10;
  const tol = opts.tolerance ?? 0.75;
  const minShared = opts.minShared ?? spacing;
  const maxNearbyDistance = opts.maxNearbyDistance ?? spacing * 5;
  const desiredGap = opts.desiredGap ?? spacing * 4;
  const skipAccepted = opts.skipAccepted ?? false;
  const onlyAccepted = opts.onlyAccepted ?? false;
  const allowAcceptedEdgeIds = new Set(opts.allowAcceptedEdgeIds ?? []);
  let changedEdges = 0;
  const changed = new Set<number>();

  interface Seg {
    edgeIdx: number;
    segIdx: number;
    axis: 'H' | 'V';
    fixed: number;
    a1: number;
    a2: number;
    startId: string;
    endId: string;
  }

  const segs: Seg[] = [];
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
    if (!pts || pts.length < 2) {
      continue;
    }
    const startId = edge.start != null ? String(edge.start) : '';
    const endId = edge.end != null ? String(edge.end) : '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      if (Math.abs(p.y - q.y) <= tol && Math.abs(p.x - q.x) > tol) {
        segs.push({
          edgeIdx,
          segIdx: i,
          axis: 'H',
          fixed: p.y,
          a1: Math.min(p.x, q.x),
          a2: Math.max(p.x, q.x),
          startId,
          endId,
        });
      } else if (Math.abs(p.x - q.x) <= tol && Math.abs(p.y - q.y) > tol) {
        segs.push({
          edgeIdx,
          segIdx: i,
          axis: 'V',
          fixed: p.x,
          a1: Math.min(p.y, q.y),
          a2: Math.max(p.y, q.y),
          startId,
          endId,
        });
      }
    }
  }

  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const s1 = segs[i];
      const s2 = segs[j];
      if (s1.edgeIdx === s2.edgeIdx || s1.axis !== s2.axis) {
        continue;
      }
      const overlap = Math.min(s1.a2, s2.a2) - Math.max(s1.a1, s2.a1);
      if (overlap < minShared) {
        continue;
      }
      const dist = Math.abs(s1.fixed - s2.fixed);
      if (dist < 1e-6 || dist >= maxNearbyDistance - 1e-6) {
        continue;
      }
      const target = chooseTarget(layout, s1, s2);
      const away = s1.fixed <= s2.fixed ? (target === s1 ? -1 : 1) : target === s1 ? 1 : -1;
      const nextFixed = target.fixed + away * Math.max(spacing, desiredGap - dist + 2);
      if (tryShift(layout, target, nextFixed, tol)) {
        changed.add(target.edgeIdx);
        target.fixed = nextFixed;
      }
    }
  }

  changedEdges = changed.size;
  return { changedEdges };
}

function chooseTarget(layout: LayoutData, a: any, b: any) {
  const aPts = ((layout.edges ?? [])[a.edgeIdx] as { points?: Point[] })?.points ?? [];
  const bPts = ((layout.edges ?? [])[b.edgeIdx] as { points?: Point[] })?.points ?? [];
  const aInterior = a.segIdx > 0 && a.segIdx < aPts.length - 2;
  const bInterior = b.segIdx > 0 && b.segIdx < bPts.length - 2;
  if (aInterior && !bInterior) {
    return a;
  }
  if (bInterior && !aInterior) {
    return b;
  }
  return b;
}

function tryShift(layout: LayoutData, seg: any, nextFixed: number, _tol: number): boolean {
  const edge = (layout.edges ?? [])[seg.edgeIdx] as { points?: Point[] };
  const pts = edge?.points;
  if (!pts || seg.segIdx < 0 || seg.segIdx + 1 >= pts.length) {
    return false;
  }

  if (pts.length === 2) {
    const a = pts[0];
    const b = pts[1];
    const candidate =
      seg.axis === 'H'
        ? [
            { x: a.x, y: a.y },
            { x: a.x, y: nextFixed },
            { x: b.x, y: nextFixed },
            { x: b.x, y: b.y },
          ]
        : [
            { x: a.x, y: a.y },
            { x: nextFixed, y: a.y },
            { x: nextFixed, y: b.y },
            { x: b.x, y: b.y },
          ];
    if (!polylineClear(layout, candidate, seg.startId, seg.endId)) {
      return false;
    }
    pts.splice(0, pts.length, ...candidate);
    return true;
  }

  const candidate = pts.map((p) => ({ ...p }));
  if (seg.axis === 'H') {
    candidate[seg.segIdx].y = nextFixed;
    candidate[seg.segIdx + 1].y = nextFixed;
  } else {
    candidate[seg.segIdx].x = nextFixed;
    candidate[seg.segIdx + 1].x = nextFixed;
  }
  if (!polylineClear(layout, candidate, seg.startId, seg.endId)) {
    return false;
  }
  pts.splice(0, pts.length, ...candidate);
  return true;
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
