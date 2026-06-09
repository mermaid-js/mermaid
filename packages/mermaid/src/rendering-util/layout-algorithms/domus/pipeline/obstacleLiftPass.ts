/**
 * iter-38 — post-finalize obstacle-lift pass.
 *
 * The DOMUS shape-walk producer (`createEdgePathsFromShapeAtPorts` in
 * `domus/edgePaths.ts`) writes polylines from the SAT shape without
 * checking non-endpoint obstacles. On the iter-37 default-on reshuffle
 * of company-simp, the merged `L_USCompany_Expenses_0` edge ended up
 * with an interior horizontal segment at y=147 cutting through the
 * Wages pill (y∈[112.5, 157.5], x∈[447.9, 499.4]), tripping
 * `validateLayout`'s `edge-intersects-obstacle` rule.
 *
 * This pass runs AFTER `finalizeDummyLabelNodesToOverlayLabels`'s D2/D3
 * and detects any merged-edge interior segment that crosses a non-
 * endpoint node's interior. For each offending segment, it generates
 * two detour candidates by shifting the segment's perpendicular-axis
 * coord just outside the obstacle (above and below for horizontal
 * segments, left and right for vertical). The neighbour-endpoint shifts
 * propagate to keep the preceding / following segments orthogonal. The
 * candidate with the fewest bends (tie-break by Manhattan length) that
 * leaves the polyline obstacle-clear wins.
 *
 * Design note (iter-38): this is a Mermaid calibration, not a paper-
 * backed construct. DOMUS treats obstacle-awareness as a routing-phase
 * concern; the shape phase works on point vertices. Our rectangle-node
 * adaptation adds a post-hoc safety net, analogous to iter-34's
 * `trimPortTailHug` (non-port-segment variant). Paper anchor is loose:
 * Wybrow §3 OVG "no intervening object" invariant (source `e8804c93`).
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

export function liftObstacleIntersectingSegments(
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
    if (!Array.isArray(pts) || pts.length < 4) {
      continue;
    }
    const startId = (e as { start?: unknown }).start != null ? String((e as any).start) : null;
    const endId = (e as { end?: unknown }).end != null ? String((e as any).end) : null;

    const obstacleRects = [...rectsById.entries()].filter(([id]) => id !== startId && id !== endId);

    const result = tryLift(pts, obstacleRects, spacing);
    if (result) {
      (e as { points: Point[] }).points = result;
      changed += 1;
    }
  }
  return { changed };
}

function tryLift(pts: Point[], obstacleRects: [string, Rect][], spacing: number): Point[] | null {
  // Find the first interior segment (i ∈ [1, n-3]) that crosses any
  // obstacle — including the edge's own start/end. Only one correction per
  // pass — subsequent offenders are caught on a re-run if needed.
  let offendingIdx = -1;
  let offendingRect: Rect | null = null;
  outer: for (let i = 1; i < pts.length - 2; i++) {
    for (const [, rect] of obstacleRects) {
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

  // iter-50 — extend the "offending segment" to a collinear run. When the
  // downstream neighbour segment is also collinear with the offender (same
  // axis), treat them as one logical segment and shift all points in the
  // run together. This handles polylines that cross an obstacle spanning
  // multiple consecutive co-linear segments (e.g., a routing-graph Dijkstra
  // emitting pts[5]→pts[6]→pts[7] all at the same x, traversing two
  // obstacle boundaries). The pre-run neighbour is pts[runStart-1] and the
  // post-run neighbour is pts[runEnd+1]. Collinear run detection uses the
  // parallel-axis coord (for vertical offender: same x).
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
    // Collinear continuation: same axis AND same parallel-axis coord across
    // the whole run. For vertical: same x across pts[offendingIdx .. q2].
    if (isVertical && Math.abs(q2.x - p1.x) > 1e-6) {
      break;
    }
    if (isHorizontal && Math.abs(q2.y - p1.y) > 1e-6) {
      break;
    }
    runEnd += 1;
  }

  // Neighbour-endpoint shift strategy: move p1 and pts[offendingIdx+1..
  // runEnd] on the perpendicular axis to the detour coord. Pre-run and
  // post-run neighbours must be perpendicular to the offending axis.
  if (offendingIdx >= 1) {
    const prev = pts[offendingIdx - 1];
    if (isHorizontal) {
      if (Math.abs(prev.y - p1.y) < 1e-6) {
        return null;
      }
    } else {
      if (Math.abs(prev.x - p1.x) < 1e-6) {
        return null;
      }
    }
  }
  if (runEnd + 1 < pts.length) {
    const next = pts[runEnd + 1];
    const pLast = pts[runEnd];
    if (isHorizontal) {
      if (Math.abs(next.y - pLast.y) < 1e-6) {
        return null;
      }
    } else {
      if (Math.abs(next.x - pLast.x) < 1e-6) {
        return null;
      }
    }
  }
  // iter-50: if the run includes the last point (port), a simple
  // perpendicular-axis shift would move the port — unsafe. Case-B detour
  // (insert bridge waypoints + perpendicular stub) is a separate, larger
  // rewrite. Bail for now.
  if (runEnd === pts.length - 1) {
    return null;
  }

  const candidates: number[] = isHorizontal
    ? [offendingRect.top - spacing, offendingRect.bottom + spacing]
    : [offendingRect.left - spacing, offendingRect.right + spacing];

  let best: Point[] | null = null;
  let bestBends = Infinity;
  let bestLen = Infinity;
  for (const shifted of candidates) {
    const candidate = applyShiftRun(pts, offendingIdx, runEnd, isHorizontal, shifted);
    const sanitized = sanitizeOrthogonalPolylineForRendering(candidate, { spacing });
    if (!isObstacleClear(sanitized, obstacleRects)) {
      continue;
    }
    const bends = countBends(sanitized);
    const len = manhattanLength(sanitized);
    if (bends < bestBends || (bends === bestBends && len + 1e-6 < bestLen)) {
      best = sanitized;
      bestBends = bends;
      bestLen = len;
    }
  }
  return best;
}

/**
 * iter-50 — shift a collinear run of points [runStart..runEnd] to the
 * detour coord along the perpendicular axis. Points outside the run are
 * unchanged. The run is assumed collinear on the axis perpendicular to
 * `isHorizontal` (i.e., all points share the same perpendicular-axis
 * coord); shifting preserves their collinearity so the segments inside
 * the run remain straight.
 */
function applyShiftRun(
  pts: Point[],
  runStart: number,
  runEnd: number,
  isHorizontal: boolean,
  shifted: number
): Point[] {
  const out: Point[] = pts.map((p) => ({ x: p.x, y: p.y }));
  for (let i = runStart; i <= runEnd; i++) {
    if (isHorizontal) {
      out[i].y = shifted;
    } else {
      out[i].x = shifted;
    }
  }
  return out;
}

function isObstacleClear(pts: Point[], obstacleRects: [string, Rect][]): boolean {
  for (let i = 1; i < pts.length - 2; i++) {
    for (const [, rect] of obstacleRects) {
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
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
