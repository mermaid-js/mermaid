/**
 * iter-53 — shared-subpath nudge pass.
 *
 * Closes the gap between iter-9 R3 (port distribution produces distinct
 * port y's) and iter-11 R14 (port stubs pin stub x to `boundary ± spacing`)
 * left-over: two edges whose ports sit on the same node side converge on
 * the same stub column, so their post-stub middle segments overlap on
 * perp-axis.
 *
 * Example (Company.mmd):
 * - L_USCompany_Expenses_0 and L_USCompany_Income_0 both exit USC.west
 *   via stub at x=625 (USC.left=635 − spacing=10). The next vertical
 *   segment traverses x=625 in different y-ranges; they share 22.5u.
 * - L_HongKongCompany_ExpensesHK_0 and L_USCompany_HongKongCompany_0
 *   both use x=947.5 as their last-mile approach to HKC.left=957.5.
 *
 * Remedy: Wybrow §5.2 separation-constrained nudging (source
 * `e8804c93`). Adapted from the paper's OVG + variable-placement
 * separation constraint solver to a greedy pairwise shift on
 * crystallised polylines: detect parallel colinear segments of
 * distinct edges overlapping on perp-axis; shift one of them by
 * `minSpacing` to a free alley (mid between flanking obstacles),
 * clamped to clear all non-endpoint obstacles. Ports (`pts[0]`,
 * `pts[n-1]`) are pinned — nudging extends or shortens adjacent port
 * stubs, never moves the port itself.
 */
import type { LayoutData } from '../../../types.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Options {
  spacing?: number;
  minShared?: number;
  onlyAccepted?: boolean;
  allowAcceptedEdgeIds?: string[];
}

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;

interface VSeg {
  edgeIdx: number; // index into layout.edges
  segIdx: number; // index of the segment's FIRST point in edge.points
  x: number;
  y1: number;
  y2: number;
  startId: string | null;
  endId: string | null;
}

interface HSeg {
  edgeIdx: number;
  segIdx: number;
  y: number;
  x1: number;
  x2: number;
  startId: string | null;
  endId: string | null;
}

export function applySharedSubpathNudge(
  layout: LayoutData,
  opts: Options = {}
): { nudged: number } {
  const spacing = opts.spacing ?? 10;
  const minShared = opts.minShared ?? spacing;
  const onlyAccepted = opts.onlyAccepted ?? false;
  const allowAcceptedEdgeIds = new Set(opts.allowAcceptedEdgeIds ?? []);

  const rectsById = new Map<string, Rect>();
  for (const n of layout.nodes ?? []) {
    if (n?.id == null) {
      continue;
    }
    if ((n as { isGroup?: boolean }).isGroup) {
      continue;
    }
    if ((n as { isEdgeLabel?: boolean }).isEdgeLabel) {
      continue;
    }
    rectsById.set(String(n.id), rectForNode(n));
  }
  const allRects: [string, Rect][] = [...rectsById.entries()];

  // Collect vertical and horizontal segments from all edges.
  const vSegs: VSeg[] = [];
  const hSegs: HSeg[] = [];
  const edges = layout.edges ?? [];
  for (const [ei, edge] of edges.entries()) {
    const edgeId = String((edge as { id?: string | number }).id ?? '');
    const accepted = Boolean((edge as { __libavoidAccepted?: boolean }).__libavoidAccepted);
    if (onlyAccepted && !accepted && !allowAcceptedEdgeIds.has(edgeId)) {
      continue;
    }
    const e = edge as {
      points?: Point[];
      start?: string | number | null;
      end?: string | number | null;
    };
    const pts = e.points;
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const startId = e.start != null ? String(e.start) : null;
    const endId = e.end != null ? String(e.end) : null;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) > 1e-6) {
        vSegs.push({
          edgeIdx: ei,
          segIdx: i,
          x: a.x,
          y1: Math.min(a.y, b.y),
          y2: Math.max(a.y, b.y),
          startId,
          endId,
        });
      } else if (Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.x - b.x) > 1e-6) {
        hSegs.push({
          edgeIdx: ei,
          segIdx: i,
          y: a.y,
          x1: Math.min(a.x, b.x),
          x2: Math.max(a.x, b.x),
          startId,
          endId,
        });
      }
    }
  }

  let nudged = 0;

  // Vertical overlaps: same x, perp-axis (y) range overlap.
  for (let i = 0; i < vSegs.length; i++) {
    for (let j = i + 1; j < vSegs.length; j++) {
      const s1 = vSegs[i];
      const s2 = vSegs[j];
      if (s1.edgeIdx === s2.edgeIdx) {
        continue;
      }
      if (Math.abs(s1.x - s2.x) > 1e-6) {
        continue;
      }
      const ymin = Math.max(s1.y1, s2.y1);
      const ymax = Math.min(s1.y2, s2.y2);
      if (ymax - ymin < minShared - 1e-6) {
        continue;
      }
      // Pick the segment that is NOT a port stub to nudge. A port stub
      // is `segIdx === 0` (first seg, pts[0]=port) or `segIdx ===
      // pts.length - 2` (last seg, pts[n-1]=port).
      const pick = pickNudgeTarget(edges, s1, s2, 'V');
      if (!pick) {
        continue;
      }
      const { target, other } = pick;
      const targetPts = (edges[target.edgeIdx] as { points: Point[] }).points;
      const desiredX = alleyMidpointVertical(
        target.x,
        target.y1,
        target.y2,
        allRects,
        target.startId,
        target.endId,
        spacing
      );
      const candidates = unique([
        desiredX,
        target.x - spacing,
        target.x + spacing,
        target.x - spacing * 1.5,
        target.x + spacing * 1.5,
      ]).filter((x) => Math.abs(x - other.x) >= spacing - 1e-6);
      let applied = false;
      for (const cx of candidates) {
        if (
          !isShiftClearVertical(
            targetPts,
            target.segIdx,
            cx,
            allRects,
            target.startId,
            target.endId
          )
        ) {
          continue;
        }
        shiftVerticalSegment(targetPts, target.segIdx, cx);
        applied = true;
        break;
      }
      if (applied) {
        nudged += 1;
      }
    }
  }

  // Horizontal overlaps: same y, perp-axis (x) range overlap.
  for (let i = 0; i < hSegs.length; i++) {
    for (let j = i + 1; j < hSegs.length; j++) {
      const s1 = hSegs[i];
      const s2 = hSegs[j];
      if (s1.edgeIdx === s2.edgeIdx) {
        continue;
      }
      if (Math.abs(s1.y - s2.y) > 1e-6) {
        continue;
      }
      const xmin = Math.max(s1.x1, s2.x1);
      const xmax = Math.min(s1.x2, s2.x2);
      if (xmax - xmin < minShared - 1e-6) {
        continue;
      }
      const pick = pickNudgeTarget(edges, s1, s2, 'H');
      if (!pick) {
        continue;
      }
      const { target, other } = pick;
      const targetPts = (edges[target.edgeIdx] as { points: Point[] }).points;
      const desiredY = alleyMidpointHorizontal(
        target.y,
        target.x1,
        target.x2,
        allRects,
        target.startId,
        target.endId,
        spacing
      );
      const candidates = unique([
        desiredY,
        target.y - spacing,
        target.y + spacing,
        target.y - spacing * 1.5,
        target.y + spacing * 1.5,
      ]).filter((y) => Math.abs(y - other.y) >= spacing - 1e-6);
      let applied = false;
      for (const cy of candidates) {
        if (
          !isShiftClearHorizontal(
            targetPts,
            target.segIdx,
            cy,
            allRects,
            target.startId,
            target.endId
          )
        ) {
          continue;
        }
        shiftHorizontalSegment(targetPts, target.segIdx, cy);
        applied = true;
        break;
      }
      if (applied) {
        nudged += 1;
      }
    }
  }

  return { nudged };
}

function pickNudgeTarget<T extends VSeg | HSeg>(
  edges: any[],
  s1: T,
  s2: T,
  _axis: 'V' | 'H'
): { target: T; other: T } | null {
  const isPortStub = (s: T) => {
    const pts = (edges[s.edgeIdx] as { points: Point[] }).points;
    return s.segIdx === 0 || s.segIdx === pts.length - 2;
  };
  const s1Port = isPortStub(s1);
  const s2Port = isPortStub(s2);
  // Prefer to nudge the non-port-stub segment (interior).
  if (!s1Port && s2Port) {
    return { target: s1, other: s2 };
  }
  if (s1Port && !s2Port) {
    return { target: s2, other: s1 };
  }
  // Both port-stub or both interior: pick the longer polyline's segment
  // (more room to rearrange adjacent segs), tiebreak by edgeIdx.
  const len1 = (edges[s1.edgeIdx] as { points: Point[] }).points.length;
  const len2 = (edges[s2.edgeIdx] as { points: Point[] }).points.length;
  if (len1 > len2) {
    return { target: s1, other: s2 };
  }
  if (len2 > len1) {
    return { target: s2, other: s1 };
  }
  return { target: s2, other: s1 };
}

function alleyMidpointVertical(
  currentX: number,
  y1: number,
  y2: number,
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null,
  spacing: number
): number {
  // Alley: for segment at x=currentX with y-range [y1,y2], find the
  // nearest obstacle rects whose y-range overlaps and compute the mid
  // x between their closest x-boundaries.
  let nearestLeft = -Infinity;
  let nearestRight = Infinity;
  for (const [id, r] of allRects) {
    if (id === startId || id === endId) {
      continue;
    }
    const yOverlap = !(r.bottom <= y1 + 1e-6 || r.top >= y2 - 1e-6);
    if (!yOverlap) {
      continue;
    }
    if (r.right <= currentX + 1e-6 && r.right > nearestLeft) {
      nearestLeft = r.right;
    }
    if (r.left >= currentX - 1e-6 && r.left < nearestRight) {
      nearestRight = r.left;
    }
  }
  if (!isFinite(nearestLeft) || !isFinite(nearestRight)) {
    return currentX;
  }
  const alleyWidth = nearestRight - nearestLeft;
  if (alleyWidth < spacing * 2) {
    return currentX;
  }
  return (nearestLeft + nearestRight) / 2;
}

function alleyMidpointHorizontal(
  currentY: number,
  x1: number,
  x2: number,
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null,
  spacing: number
): number {
  let nearestTop = -Infinity;
  let nearestBottom = Infinity;
  for (const [id, r] of allRects) {
    if (id === startId || id === endId) {
      continue;
    }
    const xOverlap = !(r.right <= x1 + 1e-6 || r.left >= x2 - 1e-6);
    if (!xOverlap) {
      continue;
    }
    if (r.bottom <= currentY + 1e-6 && r.bottom > nearestTop) {
      nearestTop = r.bottom;
    }
    if (r.top >= currentY - 1e-6 && r.top < nearestBottom) {
      nearestBottom = r.top;
    }
  }
  if (!isFinite(nearestTop) || !isFinite(nearestBottom)) {
    return currentY;
  }
  const alleyHeight = nearestBottom - nearestTop;
  if (alleyHeight < spacing * 2) {
    return currentY;
  }
  return (nearestTop + nearestBottom) / 2;
}

function shiftVerticalSegment(pts: Point[], segIdx: number, newX: number): void {
  // Shift pts[segIdx].x and pts[segIdx+1].x. Adjacent orthogonal segs
  // (if present) will have one endpoint (the shifted one) move on x.
  // The other endpoint of those adjacent segs stays — so the adjacent
  // segs become possibly longer/shorter horizontals.
  pts[segIdx] = { ...pts[segIdx], x: newX };
  pts[segIdx + 1] = { ...pts[segIdx + 1], x: newX };
}

function shiftHorizontalSegment(pts: Point[], segIdx: number, newY: number): void {
  pts[segIdx] = { ...pts[segIdx], y: newY };
  pts[segIdx + 1] = { ...pts[segIdx + 1], y: newY };
}

function isShiftClearVertical(
  pts: Point[],
  segIdx: number,
  newX: number,
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null
): boolean {
  // Simulate the shift in a copy and check obstacle clearance for the
  // shifted segment AND the two adjacent segments (which get their
  // shared endpoint dragged along). Also reject degenerate results:
  // after the shift, an adjacent point must not collide with a
  // non-adjacent point.
  const copy = pts.map((p) => ({ ...p }));
  copy[segIdx].x = newX;
  copy[segIdx + 1].x = newX;
  // Reject if the shift creates a duplicate point (e.g., pts[segIdx+1]
  // collapses onto pts[segIdx+2]).
  if (segIdx + 2 < copy.length) {
    const p2 = copy[segIdx + 1];
    const p3 = copy[segIdx + 2];
    if (Math.abs(p2.x - p3.x) < 1e-6 && Math.abs(p2.y - p3.y) < 1e-6) {
      return false;
    }
  }
  if (segIdx - 1 >= 0) {
    const p0 = copy[segIdx - 1];
    const p1 = copy[segIdx];
    if (Math.abs(p0.x - p1.x) < 1e-6 && Math.abs(p0.y - p1.y) < 1e-6) {
      return false;
    }
  }
  // Check the shifted seg + adjacent segs (if any).
  const start = Math.max(0, segIdx - 1);
  const end = Math.min(copy.length - 2, segIdx + 1);
  for (let i = start; i <= end; i++) {
    const a = copy[i];
    const b = copy[i + 1];
    for (const [id, rect] of allRects) {
      // Port-approach segs (i=0 or i=n-2) exclude edge's own endpoints.
      if ((i === 0 || i === copy.length - 2) && (id === startId || id === endId)) {
        continue;
      }
      if (segmentIntersectsRectInterior(a, b, rect)) {
        return false;
      }
    }
  }
  return true;
}

function isShiftClearHorizontal(
  pts: Point[],
  segIdx: number,
  newY: number,
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null
): boolean {
  const copy = pts.map((p) => ({ ...p }));
  copy[segIdx].y = newY;
  copy[segIdx + 1].y = newY;
  if (segIdx + 2 < copy.length) {
    const p2 = copy[segIdx + 1];
    const p3 = copy[segIdx + 2];
    if (Math.abs(p2.x - p3.x) < 1e-6 && Math.abs(p2.y - p3.y) < 1e-6) {
      return false;
    }
  }
  if (segIdx - 1 >= 0) {
    const p0 = copy[segIdx - 1];
    const p1 = copy[segIdx];
    if (Math.abs(p0.x - p1.x) < 1e-6 && Math.abs(p0.y - p1.y) < 1e-6) {
      return false;
    }
  }
  const start = Math.max(0, segIdx - 1);
  const end = Math.min(copy.length - 2, segIdx + 1);
  for (let i = start; i <= end; i++) {
    const a = copy[i];
    const b = copy[i + 1];
    for (const [id, rect] of allRects) {
      if ((i === 0 || i === copy.length - 2) && (id === startId || id === endId)) {
        continue;
      }
      if (segmentIntersectsRectInterior(a, b, rect)) {
        return false;
      }
    }
  }
  return true;
}

function unique(xs: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const x of xs) {
    const k = Math.round(x * 1000) / 1000;
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    out.push(x);
  }
  return out;
}
