/**
 * iter-51/52 — obstacle-detour insertion pass.
 *
 * Complement to iter-38/50's `obstacleLiftPass`. That pass handles the
 * "shift perpendicular axis" case; this one handles the multi-point
 * insertion case when a simple shift can't clear the geometry. Two
 * templates:
 *
 * **Case A (iter-51)** — non-port-inclusive offender. Canonical example:
 * Company.mmd `L_HongKongCompany_ExpensesHK_0` whose middle segment
 * `(947.5, 145) → (947.5, 230)` runs through ExpensesHK's interior.
 * Simple shift fails (shift puts pts[1] inside HKC or across Customer).
 * Remedy: insert 2-3 detour waypoints that bend perpendicular BEFORE the
 * obstacle, traverse past it, then reconnect to the post-offender anchor.
 *
 * **Case B (iter-52)** — port-inclusive offender. Canonical example:
 * Company.mmd `L_USCompany_Income_0` last segment (432.5, 135) → (432.5,
 * 210) passes through Tax (y∈[145,205]) with Income.top port at (432.5,
 * 210). No post-offender anchor — the port IS the final waypoint.
 * Remedy: insert 3 detour waypoints: bend perpendicular off, traverse
 * past obstacle, BRIDGE back to port parallel-coord at a point strictly
 * inside the gap between obstacle-far-boundary and port. The final stub
 * from bridge-y to port.y preserves port perpendicularity. Sanitize is
 * called with minSegmentLength:2 so narrow bridge bands (e.g. Tax/Income
 * 5u → 2.5u stub) don't get extended backwards INTO the obstacle.
 *
 * Paper anchors:
 * - Siebenhaller §2.3.2.1 edge-vertex disjointness (source `0fb2d84f`).
 * - Wybrow §3 OVG "no intervening object" invariant (source `e8804c93`).
 */
import type { LayoutData } from '../../../types.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';

interface Options {
  spacing?: number;
}

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;

export function applyObstacleDetourInsertPass(
  layout: LayoutData,
  opts: Options = {}
): { changed: number } {
  const spacing = opts.spacing ?? 10;

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

  let changed = 0;
  for (const e of layout.edges ?? []) {
    const pts = (e as { points?: Point[] }).points;
    // Case A needs ≥4 points (prefix + offender + post-offender anchor).
    // Case B needs ≥3 points (prefix + offender + port-as-anchor).
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const startId = (e as { start?: unknown }).start != null ? String((e as any).start) : null;
    const endId = (e as { end?: unknown }).end != null ? String((e as any).end) : null;
    // All non-group node rects. Endpoints excluded from OFFENDER check for
    // first/last segs (port-approach legitimacy) but INCLUDED for middle-
    // segment check (iter-46 partition: middle-seg crossing of own endpoint
    // node's interior IS a real violation).
    const allRects: [string, Rect][] = [...rectsById.entries()];

    const result = tryInsertDetour(pts, allRects, startId, endId, spacing);
    if (result) {
      (e as { points: Point[] }).points = result;
      changed += 1;
    }
  }
  return { changed };
}

function tryInsertDetour(
  pts: Point[],
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null,
  spacing: number
): Point[] | null {
  // Find first segment i ∈ [1, n-2] crossing an obstacle. For the offender
  // search, we check ALL rects (including endpoints) — a segment inside
  // the edge's own endpoint body is a real violation (iter-46 partition).
  // Port-approach segments (first=0 and last=n-2) target their own
  // endpoint by construction, but for Case B port-inclusive detection we
  // need to see the last seg as an offender when it crosses a DIFFERENT
  // rect (e.g., Tax on the USC→Income path). We exclude the edge's own
  // endpoints from the last-seg offender rects so port-approach isn't
  // falsely flagged.
  let offendingIdx = -1;
  let offendingRect: Rect | null = null;
  const lastSegIdx = pts.length - 2;
  outer: for (let i = 1; i <= lastSegIdx; i++) {
    for (const [id, rect] of allRects) {
      if (i === lastSegIdx && (id === startId || id === endId)) {
        continue;
      }
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
        offendingIdx = i;
        offendingRect = rect;
        break outer;
      }
    }
  }
  if (offendingIdx < 0 || !offendingRect) {
    return null;
  }

  const p1 = pts[offendingIdx];
  const p2 = pts[offendingIdx + 1];
  const isHorizontal = Math.abs(p1.y - p2.y) < 1e-6 && Math.abs(p1.x - p2.x) > 1e-6;
  const isVertical = Math.abs(p1.x - p2.x) < 1e-6 && Math.abs(p1.y - p2.y) > 1e-6;
  if (!isHorizontal && !isVertical) {
    return null;
  }

  // Extend the offending run downstream while consecutive segments share
  // the same parallel-axis coord (collinear run).
  let runEnd = offendingIdx + 1;
  while (runEnd + 1 < pts.length) {
    const q1 = pts[runEnd];
    const q2 = pts[runEnd + 1];
    const qHoriz = Math.abs(q1.y - q2.y) < 1e-6 && Math.abs(q1.x - q2.x) > 1e-6;
    const qVert = Math.abs(q1.x - q2.x) < 1e-6 && Math.abs(q1.y - q2.y) > 1e-6;
    if (isHorizontal && !qHoriz) {
      break;
    }
    if (isVertical && !qVert) {
      break;
    }
    if (isVertical && Math.abs(q2.x - p1.x) > 1e-6) {
      break;
    }
    if (isHorizontal && Math.abs(q2.y - p1.y) > 1e-6) {
      break;
    }
    runEnd += 1;
  }

  // Direction along parallel axis. For vertical offender at x=A, "down" =
  // y increases.
  const parallelCoord = isVertical ? p1.x : p1.y;
  const descending = isVertical ? p2.y > p1.y : p2.x > p1.x;

  // Case B — port-inclusive offender (iter-52). No post-offender anchor;
  // the port IS the final waypoint. Dispatch to Case B builder.
  if (runEnd === pts.length - 1) {
    return tryCaseBDetour(
      pts,
      allRects,
      startId,
      endId,
      spacing,
      offendingIdx,
      offendingRect,
      isVertical,
      descending
    );
  }

  // Case A — post-offender anchor = pts[runEnd + 1]. We'll drop
  // pts[offendingIdx+1..runEnd] and insert detour waypoints to bridge
  // pts[offendingIdx] to the anchor.
  const anchor = pts[runEnd + 1];

  // The "near" side of the obstacle along the parallel axis. If we're
  // descending (going down for vertical), the bend-before-obstacle coord
  // should be strictly ABOVE R.top (smaller y) but we also need clearance
  // from OTHER obstacles at nearby parallel-axis values. Enumerate multiple
  // near candidates and let the obstacle-clear check below pick one.
  const rNearTop = isVertical ? offendingRect.top : offendingRect.left;
  const rNearBottom = isVertical ? offendingRect.bottom : offendingRect.right;
  const nearCandidates: number[] = descending
    ? [rNearTop - spacing, rNearTop - Math.max(2, Math.floor(spacing / 2)), rNearTop - spacing * 2]
    : [
        rNearBottom + spacing,
        rNearBottom + Math.max(2, Math.floor(spacing / 2)),
        rNearBottom + spacing * 2,
      ];

  // DETOUR candidates on the perpendicular axis.
  const rPerpLow = isVertical ? offendingRect.left : offendingRect.top;
  const rPerpHigh = isVertical ? offendingRect.right : offendingRect.bottom;
  const detourCandidates = [rPerpLow - spacing, rPerpHigh + spacing];

  // Two obstacle sets: `nonEndpoints` for middle-segment checks (must be
  // strict — a middle seg cannot hug/cross any obstacle, including the
  // edge's own endpoints); `portApproach` for first/last port segments
  // (endpoint-own rects are excluded since the port sits on their
  // boundary by construction).
  const nonEndpointRects: [string, Rect][] = [];
  const portApproachRects: [string, Rect][] = [];
  for (const [id, rect] of allRects) {
    nonEndpointRects.push([id, rect]);
    if (id !== startId && id !== endId) {
      portApproachRects.push([id, rect]);
    }
  }

  let best: Point[] | null = null;
  let bestBends = Infinity;
  let bestLen = Infinity;
  for (const near of nearCandidates) {
    for (const detour of detourCandidates) {
      const candidate = buildCandidate(
        pts,
        offendingIdx,
        runEnd,
        isVertical,
        parallelCoord,
        near,
        detour,
        anchor
      );
      if (!candidate) {
        continue;
      }
      // Check clearance on the PRE-sanitize candidate so that port-approach
      // segments are still individually distinguishable. Sanitize collinear-
      // collapse can fuse a cross-obstacle bridge with a short port stub
      // (e.g., (830,230)→(970,230)→(960,230) collapses to (830,230)→(960,230)
      // which then evades the port-approach check that excludes the edge's
      // own endpoint from `portApproachRects`).
      if (!isCandidateClear(candidate, nonEndpointRects, portApproachRects)) {
        continue;
      }
      const sanitized = sanitizeOrthogonalPolylineForRendering(candidate, { spacing });
      const bends = countBends(sanitized);
      const len = manhattanLength(sanitized);
      if (bends < bestBends || (bends === bestBends && len + 1e-6 < bestLen)) {
        best = sanitized;
        bestBends = bends;
        bestLen = len;
      }
    }
  }
  return best;
}

function buildCandidate(
  pts: Point[],
  offendingIdx: number,
  runEnd: number,
  isVertical: boolean,
  parallelCoord: number,
  nearParallel: number,
  detour: number,
  anchor: Point
): Point[] | null {
  const prefix = pts.slice(0, offendingIdx + 1);
  const suffix = pts.slice(runEnd + 1);

  // Insert: (A, nearParallel), (detour, nearParallel), optional bridge if
  // the detour perpendicular-coord differs from the anchor's, then anchor.
  const insert: Point[] = [];
  if (isVertical) {
    insert.push({ x: parallelCoord, y: nearParallel });
    insert.push({ x: detour, y: nearParallel });
    if (Math.abs(detour - anchor.x) > 1e-6) {
      insert.push({ x: detour, y: anchor.y });
    }
  } else {
    insert.push({ x: nearParallel, y: parallelCoord });
    insert.push({ x: nearParallel, y: detour });
    if (Math.abs(detour - anchor.y) > 1e-6) {
      insert.push({ x: anchor.x, y: detour });
    }
  }

  return [...prefix, ...insert, ...suffix];
}

function isCandidateClear(
  pts: Point[],
  nonEndpointRects: [string, Rect][],
  portApproachRects: [string, Rect][]
): boolean {
  // Middle segments (i ∈ [1, n-3]) must clear ALL rects — even endpoints.
  for (let i = 1; i < pts.length - 2; i++) {
    for (const [, rect] of nonEndpointRects) {
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
        return false;
      }
    }
  }
  // Port-approach segments (first and last) skip the edge's own endpoint
  // rects by construction, so check them against portApproachRects only.
  if (pts.length >= 2) {
    for (const [, rect] of portApproachRects) {
      if (segmentIntersectsRectInterior(pts[0], pts[1], rect)) {
        return false;
      }
      if (segmentIntersectsRectInterior(pts[pts.length - 2], pts[pts.length - 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

function countBends(pts: Point[]): number {
  if (pts.length < 3) {
    return 0;
  }
  let n = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d1x = pts[i].x - pts[i - 1].x;
    const d1y = pts[i].y - pts[i - 1].y;
    const d2x = pts[i + 1].x - pts[i].x;
    const d2y = pts[i + 1].y - pts[i].y;
    if (Math.abs(d1x * d2y - d1y * d2x) > 1e-6) {
      n += 1;
    }
  }
  return n;
}

function manhattanLength(pts: Point[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
  }
  return len;
}

// iter-52 — Case B (port-inclusive) detour builder.
const MIN_BRIDGE_BAND = 2;

function tryCaseBDetour(
  pts: Point[],
  allRects: [string, Rect][],
  startId: string | null,
  endId: string | null,
  spacing: number,
  offendingIdx: number,
  offendingRect: Rect,
  isVertical: boolean,
  descending: boolean
): Point[] | null {
  const p1 = pts[offendingIdx];
  const port = pts[pts.length - 1];
  const parallelCoord = isVertical ? p1.x : p1.y;
  const portParallelCoord = isVertical ? port.x : port.y;

  // The offender is pts[offendingIdx]→...→port. The obstacle's "far" side
  // (direction we're heading) is the side the port lies beyond. Bridge band
  // must fit between obstacle-far-boundary and port.perpendicular-coord.
  const obsFarBoundary = isVertical
    ? descending
      ? offendingRect.bottom
      : offendingRect.top
    : descending
      ? offendingRect.right
      : offendingRect.left;
  const portPerp = isVertical ? port.y : port.x;

  const bandSize = descending ? portPerp - obsFarBoundary : obsFarBoundary - portPerp;
  if (bandSize < MIN_BRIDGE_BAND) {
    return null;
  }
  const bridgePerp = descending ? obsFarBoundary + bandSize / 2 : obsFarBoundary - bandSize / 2;

  // The "near" side of the obstacle along the parallel axis — for the
  // bend-before-obstacle insertion. Same enumeration as Case A.
  const rNearTop = isVertical ? offendingRect.top : offendingRect.left;
  const rNearBottom = isVertical ? offendingRect.bottom : offendingRect.right;
  const nearCandidates: number[] = descending
    ? [rNearTop - spacing, rNearTop - Math.max(2, Math.floor(spacing / 2)), rNearTop - spacing * 2]
    : [
        rNearBottom + spacing,
        rNearBottom + Math.max(2, Math.floor(spacing / 2)),
        rNearBottom + spacing * 2,
      ];

  // DETOUR candidates on the perpendicular axis.
  const rPerpLow = isVertical ? offendingRect.left : offendingRect.top;
  const rPerpHigh = isVertical ? offendingRect.right : offendingRect.bottom;
  const detourCandidates = [rPerpLow - spacing, rPerpHigh + spacing];

  const nonEndpointRects: [string, Rect][] = [];
  const portApproachRects: [string, Rect][] = [];
  for (const [id, rect] of allRects) {
    nonEndpointRects.push([id, rect]);
    if (id !== startId && id !== endId) {
      portApproachRects.push([id, rect]);
    }
  }

  let best: Point[] | null = null;
  let bestBends = Infinity;
  let bestLen = Infinity;
  for (const near of nearCandidates) {
    for (const detour of detourCandidates) {
      const candidate = buildCaseBCandidate(
        pts,
        offendingIdx,
        isVertical,
        parallelCoord,
        near,
        detour,
        bridgePerp,
        portParallelCoord,
        port
      );
      if (!candidate) {
        continue;
      }
      if (!isCandidateClear(candidate, nonEndpointRects, portApproachRects)) {
        continue;
      }
      // Use minSegmentLength:2 so the narrow-band final stub (e.g., 2.5u
      // between bridge-y and port at Tax.bottom=205 / Income.top=210) is
      // not extended backwards into the obstacle.
      const sanitized = sanitizeOrthogonalPolylineForRendering(candidate, {
        spacing,
        minSegmentLength: 2,
      });
      const bends = countBends(sanitized);
      const len = manhattanLength(sanitized);
      if (bends < bestBends || (bends === bestBends && len + 1e-6 < bestLen)) {
        best = sanitized;
        bestBends = bends;
        bestLen = len;
      }
    }
  }
  return best;
}

function buildCaseBCandidate(
  pts: Point[],
  offendingIdx: number,
  isVertical: boolean,
  parallelCoord: number,
  nearParallel: number,
  detour: number,
  bridgePerp: number,
  portParallelCoord: number,
  port: Point
): Point[] | null {
  const prefix = pts.slice(0, offendingIdx + 1);
  // Insert: (A, nearParallel) bend; (detour, nearParallel) traverse;
  //         (detour, bridgePerp) descend past obstacle;
  //         (port.parallel, bridgePerp) bridge back to port column/row;
  //         (port) final perpendicular stub.
  const insert: Point[] = [];
  if (isVertical) {
    insert.push({ x: parallelCoord, y: nearParallel });
    insert.push({ x: detour, y: nearParallel });
    insert.push({ x: detour, y: bridgePerp });
    insert.push({ x: portParallelCoord, y: bridgePerp });
  } else {
    insert.push({ x: nearParallel, y: parallelCoord });
    insert.push({ x: nearParallel, y: detour });
    insert.push({ x: bridgePerp, y: detour });
    insert.push({ x: bridgePerp, y: portParallelCoord });
  }
  return [...prefix, ...insert, port];
}
