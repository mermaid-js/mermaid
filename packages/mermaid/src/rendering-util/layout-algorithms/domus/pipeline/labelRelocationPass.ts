/**
 * iter-39 — post-finalize label relocation pass.
 *
 * When DOMUS compaction places a labelled edge's anchor far from the
 * natural L-path between the edge's endpoints, the merged polyline
 * detours massively to visit the anchor (e.g. company-simp USC→HKC at
 * ratio 2.66 because the label sits 80u west of both endpoints). This
 * pass detects that case and:
 *   1. Tries the two canonical L-shape candidates between the ports,
 *      preserving each port's first/last segment direction (so the
 *      Kandinsky perpendicular-port-entry invariant stays intact).
 *   2. Checks obstacle clearance on the interior (non-port) segments.
 *   3. Relocates the label anchor (`edge.x`, `edge.y`) to the midpoint
 *      of the longest internal segment on the simpler polyline, but
 *      only if the label's bbox at that midpoint doesn't overlap any
 *      non-endpoint node.
 *   4. Replaces the polyline and updates edge.x / edge.y.
 *
 * Paper anchor: loose. Siebenhaller §5.6 (label placement post-
 * orthogonalisation, source `0fb2d84f`) permits label placement on any
 * middle segment of an edge after routing. We extend this to re-place
 * the label when a simpler polyline is available.
 *
 * Design note: the iter-36 D2 label-waypoint shortcut generates
 * candidates that PASS THROUGH the current label anchor. That's the
 * right approach when the label anchor is sensibly placed. When it's
 * not (this iter-39 case), D2 can't help. This pass is the escape
 * hatch: "the label is misplaced, move it to a better spot."
 */
import type { LayoutData } from '../../../types.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';

interface Options {
  spacing?: number;
  /** Trigger when current Manhattan/straightLine \> this (default 2.0). */
  ratioThreshold?: number;
  /**
   * iter-40: also trigger when bend count \> this. Enables simplification of
   * high-bend polylines whose ratio is within threshold (e.g. USC→Expenses
   * 5-bend detour at ratio 1.73 on company-simp — the obstacle-lift pass's
   * per-segment shift leaves residual zigzags that ratio-only triggering
   * misses). Undefined = bend trigger disabled (iter-39 default).
   */
  bendThreshold?: number;
}

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
type Dir = 'L' | 'R' | 'U' | 'D' | null;

export function relocateLabelsForSimplification(
  layout: LayoutData,
  opts: Options = {}
): { changed: number } {
  const spacing = opts.spacing ?? 10;
  const ratioThreshold = opts.ratioThreshold ?? 2.0;
  const bendThreshold = opts.bendThreshold;

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
    const anchor = e as { x?: unknown; y?: unknown; width?: number; height?: number };
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      continue;
    }
    const pts = (e as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const startId = (e as { start?: unknown }).start != null ? String((e as any).start) : null;
    const endId = (e as { end?: unknown }).end != null ? String((e as any).end) : null;

    const a = pts[0];
    const b = pts[pts.length - 1];
    const sLen = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    if (sLen < 1e-6) {
      continue;
    }
    const mLen = manhattanLength(pts);
    const currentRatio = mLen / sLen;
    const currentBends = countBends(pts);
    const ratioTriggered = currentRatio > ratioThreshold;
    const bendTriggered = bendThreshold !== undefined && currentBends > bendThreshold;
    if (!ratioTriggered && !bendTriggered) {
      continue;
    }

    const firstDir = segDir(pts[0], pts[1]);
    const lastDir = segDir(pts[pts.length - 2], pts[pts.length - 1]);
    if (!firstDir || !lastDir) {
      continue;
    }

    const lw = Number.isFinite(anchor.width) ? anchor.width! : 0;
    const lh = Number.isFinite(anchor.height) ? anchor.height! : 0;

    const obstacleRects: [string, Rect][] = [];
    for (const [id, rect] of rectsById) {
      if (id === startId || id === endId) {
        continue;
      }
      obstacleRects.push([id, rect]);
    }

    const firstAxis = firstDir === 'L' || firstDir === 'R' ? 'x' : 'y';
    const lastAxis = lastDir === 'L' || lastDir === 'R' ? 'x' : 'y';

    const candidate =
      firstAxis === lastAxis
        ? buildLShapePreservingDirections(a, b, firstDir, lastDir, spacing, obstacleRects)
        : buildMixedAxisDetourPreservingDirections(a, b, firstDir, lastDir, spacing, obstacleRects);
    if (!candidate) {
      continue;
    }
    const candMLen = manhattanLength(candidate);
    const candRatio = candMLen / sLen;
    const candBends = countBends(candidate);
    // Accept when the candidate improves on the metric that triggered us.
    // Ratio-triggered: require strictly lower ratio.
    // Bend-triggered (and ratio-OK): require strictly fewer bends. A bend-
    // only acceptance may allow the ratio to stay equal.
    const ratioBetter = candRatio < currentRatio - 1e-6;
    const bendBetter = candBends < currentBends;
    if (ratioTriggered && !ratioBetter) {
      continue;
    }
    if (!ratioTriggered && bendTriggered && !bendBetter) {
      continue;
    }

    // Pick midpoint on the LONGEST internal segment; verify label bbox
    // at midpoint clears all obstacles (endpoint nodes too — a label
    // partially overlapping the edge's own endpoint looks broken).
    const allRects = [...rectsById.entries()];
    const midpoint = pickLabelMidpoint(candidate, lw, lh, allRects);
    if (!midpoint) {
      continue;
    }

    (e as { points: Point[] }).points = candidate;
    (e as { x: number; y: number }).x = midpoint.x;
    (e as { y: number }).y = midpoint.y;
    changed += 1;
  }
  return { changed };
}

function buildLShapePreservingDirections(
  a: Point,
  b: Point,
  firstDir: Dir,
  lastDir: Dir,
  spacing: number,
  obstacleRects: [string, Rect][]
): Point[] | null {
  // Two canonical L-shapes: VH (vertical first, horizontal second) and HV.
  // Each either preserves or violates the port directions. Select the one
  // whose first and last segments match firstDir/lastDir.
  //
  // VH candidate: a → (a.x, b.y) → b.
  //   firstSeg: a → (a.x, b.y) = vertical (U if b.y < a.y else D).
  //   lastSeg:  (a.x, b.y) → b = horizontal (R if b.x > a.x else L).
  // HV candidate: a → (b.x, a.y) → b.
  //   firstSeg: a → (b.x, a.y) = horizontal (R if b.x > a.x else L).
  //   lastSeg:  (b.x, a.y) → b = vertical (U if b.y < a.y else D).
  //
  // The L-per-leg candidate needs 4 points (a, b1, b2, b): b1 on firstDir
  // axis at spacing+ from a, b2 vertically/horizontally aligned with b.
  // Specifically: if firstDir is L/R (horizontal exit), b1 = (a.x + sign*d, a.y).
  // Then b2 = (b1.x, b.y). Then b. Last seg from b2 to b is
  // horizontal-aligned if b2.y == b.y (yes by construction). Its direction
  // depends on b.x vs b2.x.
  //
  // For preservation: select b1 such that:
  //   - firstSeg a → b1 has direction firstDir
  //   - lastSeg b2 → b has direction lastDir
  //   - middle segment b1 → b2 is orthogonal + obstacle-clear
  //
  // We parameterise with t = how far b1 is from a on firstDir axis.
  // Minimum t = min-seg threshold (spacing/2.5 = 4) to avoid micro-seg.
  // We pick t such that the final L-per-leg configuration respects
  // lastDir constraints too.

  const firstAxis = firstDir === 'L' || firstDir === 'R' ? 'x' : 'y';
  const firstSign = firstDir === 'R' || firstDir === 'D' ? 1 : -1;
  const lastAxis = lastDir === 'L' || lastDir === 'R' ? 'x' : 'y';
  const lastSign = lastDir === 'R' || lastDir === 'D' ? 1 : -1;

  // For a 4-point L-per-leg polyline [a, b1, b2, b]:
  //   - a → b1: along firstAxis in firstSign direction.
  //     If firstAxis='x': b1 = (a.x + firstSign*d1, a.y).
  //     If firstAxis='y': b1 = (a.x, a.y + firstSign*d1).
  //   - b2 → b: along lastAxis in lastSign direction.
  //     If lastAxis='x': b2 = (b.x - lastSign*d2, b.y) and segment (b2.y, b.y) is parallel → must be zero. So b1.y == b.y.
  //       Combined: b1 = (a.x + firstSign*d1, a.y), b2 = (b.x - lastSign*d2, b.y).
  //       Middle seg b1 → b2 must be orthogonal. Only way: b1 and b2 share an axis.
  //       If firstAxis='x' and lastAxis='x': b1.y = a.y, b2.y = b.y. If a.y != b.y, the middle seg is diagonal → not valid.
  //         Unless d1 and d2 are chosen so b1.x == b2.x (then middle seg is vertical). b1.x = a.x + firstSign*d1, b2.x = b.x - lastSign*d2.
  //         Solve: a.x + firstSign*d1 = b.x - lastSign*d2.
  //         One solution: shared_x = some value, d1 = firstSign*(shared_x - a.x), d2 = lastSign*(b.x - shared_x).
  //         Constraints: d1 >= min_seg, d2 >= min_seg, middle seg (b1.y → b2.y) respects direction (arbitrary up or down).
  //     If firstAxis='x' and lastAxis='y': b1 = (a.x + firstSign*d1, a.y), b2 = (b.x, b.y - lastSign*d2).
  //       Middle seg b1 → b2: diff on both axes, must be orthogonal. Only if b1.x == b2.x OR b1.y == b2.y.
  //         b1.x == b2.x: a.x + firstSign*d1 = b.x. So d1 = firstSign*(b.x - a.x). Constrained by sign (must match firstSign).
  //         b1.y == b2.y: a.y = b.y - lastSign*d2. d2 = lastSign*(b.y - a.y). Constrained by sign.
  //       etc. (Many sub-cases.)

  // For this iteration, handle the most common case: firstAxis == lastAxis
  // (both horizontal or both vertical). That covers company-simp USC→HKC
  // (both L, both W-side ports).
  if (firstAxis !== lastAxis) {
    return null;
  }

  const minSeg = 4;

  if (firstAxis === 'x') {
    // Shared middle vertical at x=shared_x. Must satisfy:
    //   sign(shared_x - a.x) == firstSign  (i.e. (shared_x - a.x) * firstSign > 0)
    //   sign(b.x - shared_x) == lastSign
    // Minimum-length: shared_x as close to endpoints as possible.
    // If firstSign == lastSign == -1 (both going L):
    //   shared_x < a.x AND shared_x < b.x → shared_x < min(a.x, b.x).
    // If firstSign == 1 and lastSign == -1:
    //   shared_x > a.x AND shared_x < b.x → a.x < shared_x < b.x.
    // etc.
    let low = -Infinity;
    let high = Infinity;
    if (firstSign === 1) {
      low = Math.max(low, a.x + minSeg);
    } else {
      high = Math.min(high, a.x - minSeg);
    }
    if (lastSign === 1) {
      high = Math.min(high, b.x - minSeg);
    } else {
      low = Math.max(low, b.x + minSeg);
    }
    if (low > high) {
      return null;
    }
    // Pick shared_x closest to max(a.x, b.x) (if firstSign/lastSign both
    // positive) or min (both negative), effectively minimising detour.
    let shared_x: number;
    if (firstSign === -1 && lastSign === -1) {
      // Both going LEFT; shared_x < both. Pick as close to min(a.x, b.x) as possible.
      shared_x = high - spacing; // use `spacing` as safe distance
      // But respect the low bound.
      if (shared_x < low) {
        shared_x = high;
      }
    } else if (firstSign === 1 && lastSign === 1) {
      shared_x = low + spacing;
      if (shared_x > high) {
        shared_x = low;
      }
    } else {
      // Mixed signs (straddle).
      shared_x = (a.x + b.x) / 2;
      if (shared_x < low) {
        shared_x = low;
      }
      if (shared_x > high) {
        shared_x = high;
      }
    }
    const b1 = { x: shared_x, y: a.y };
    const b2 = { x: shared_x, y: b.y };
    const candidate = [a, b1, b2, b];
    const sanitized = sanitizeOrthogonalPolylineForRendering(candidate as any, { spacing });
    if (!isInteriorClear(sanitized as Point[], obstacleRects)) {
      return null;
    }
    return sanitized as Point[];
  }

  // firstAxis === 'y' case.
  let low = -Infinity;
  let high = Infinity;
  if (firstSign === 1) {
    low = Math.max(low, a.y + minSeg);
  } else {
    high = Math.min(high, a.y - minSeg);
  }
  if (lastSign === 1) {
    high = Math.min(high, b.y - minSeg);
  } else {
    low = Math.max(low, b.y + minSeg);
  }
  if (low > high) {
    return null;
  }
  let shared_y: number;
  if (firstSign === -1 && lastSign === -1) {
    shared_y = high - spacing;
    if (shared_y < low) {
      shared_y = high;
    }
  } else if (firstSign === 1 && lastSign === 1) {
    shared_y = low + spacing;
    if (shared_y > high) {
      shared_y = low;
    }
  } else {
    shared_y = (a.y + b.y) / 2;
    if (shared_y < low) {
      shared_y = low;
    }
    if (shared_y > high) {
      shared_y = high;
    }
  }
  const b1 = { x: a.x, y: shared_y };
  const b2 = { x: b.x, y: shared_y };
  const candidate = [a, b1, b2, b];
  const sanitized = sanitizeOrthogonalPolylineForRendering(candidate as any, { spacing });
  if (!isInteriorClear(sanitized as Point[], obstacleRects)) {
    return null;
  }
  return sanitized as Point[];
}

/**
 * iter-40 — mixed-axis (e.g. horizontal exit + vertical entry) 3-bend detour.
 *
 * When first/last ports are on perpendicular axes, a 1-bend L is only
 * possible when the geometric corner (b.x, a.y) or (a.x, b.y) happens to
 * produce matching port directions — rarely the case (see labelRelocation
 * tests). Otherwise the minimum-bend obstacle-free path has 3 bends:
 *   [a, k1, k2, k3, b]
 * with
 *   firstAxis='x', lastAxis='y' → k1 = (cx, a.y), k2 = (cx, cy), k3 = (b.x, cy)
 *   firstAxis='y', lastAxis='x' → k1 = (a.x, cy), k2 = (cx, cy), k3 = (cx, b.y)
 *
 * We enumerate a discrete (cx, cy) candidate set (close-to-a / close-to-b
 * along the first axis, alley-midpoint along the second — Wybrow §5.2)
 * and pick the minimum-Manhattan obstacle-free polyline. All segments
 * must respect the first/last port direction signs and Kandinsky min-seg.
 *
 * Paper anchor: Siebenhaller bend-stretching (source `0fb2d84f`, via
 * Klau/Mutzel [67] pattern-replacement) + Wybrow §5.2 alley-midpoint
 * (source `e8804c93`).
 */
function buildMixedAxisDetourPreservingDirections(
  a: Point,
  b: Point,
  firstDir: Dir,
  lastDir: Dir,
  spacing: number,
  obstacleRects: [string, Rect][]
): Point[] | null {
  if (!firstDir || !lastDir) {
    return null;
  }
  const firstAxis = firstDir === 'L' || firstDir === 'R' ? 'x' : 'y';
  const firstSign = firstDir === 'R' || firstDir === 'D' ? 1 : -1;
  const lastAxis = lastDir === 'L' || lastDir === 'R' ? 'x' : 'y';
  const lastSign = lastDir === 'R' || lastDir === 'D' ? 1 : -1;
  if (firstAxis === lastAxis) {
    return null;
  }

  const minSeg = 4;

  const cxCandidates: number[] = [];
  const cyCandidates: number[] = [];

  if (firstAxis === 'x') {
    // cx free on first axis; cy free on last axis.
    for (const d of [spacing * 2, spacing * 4, spacing * 6, spacing * 8]) {
      cxCandidates.push(a.x + firstSign * d);
    }
    // Also try cx near b.x when b.x is on firstSign side of a.x.
    if ((b.x - a.x) * firstSign > minSeg * 2) {
      cxCandidates.push(b.x - firstSign * spacing * 2);
    }
    for (const d of [spacing * 2, spacing * 4, spacing * 6]) {
      cyCandidates.push(b.y - lastSign * d);
    }
    cyCandidates.push((a.y + b.y) / 2);
  } else {
    // firstAxis === 'y', lastAxis === 'x'
    for (const d of [spacing * 2, spacing * 4, spacing * 6, spacing * 8]) {
      cyCandidates.push(a.y + firstSign * d);
    }
    if ((b.y - a.y) * firstSign > minSeg * 2) {
      cyCandidates.push(b.y - firstSign * spacing * 2);
    }
    for (const d of [spacing * 2, spacing * 4, spacing * 6]) {
      cxCandidates.push(b.x - lastSign * d);
    }
    cxCandidates.push((a.x + b.x) / 2);
  }

  let best: Point[] | null = null;
  let bestLen = Infinity;

  for (const cx of cxCandidates) {
    for (const cy of cyCandidates) {
      // Validate direction + min-seg constraints.
      if (firstAxis === 'x') {
        // First seg a → (cx, a.y)
        if ((cx - a.x) * firstSign < minSeg) {
          continue;
        }
        // Middle vertical (cx, a.y) → (cx, cy): needs |cy - a.y| >= minSeg
        if (Math.abs(cy - a.y) < minSeg) {
          continue;
        }
        // Middle horizontal (cx, cy) → (b.x, cy): needs |b.x - cx| >= minSeg
        if (Math.abs(b.x - cx) < minSeg) {
          continue;
        }
        // Last seg (b.x, cy) → b with direction lastSign on y
        if ((b.y - cy) * lastSign < minSeg) {
          continue;
        }
      } else {
        if ((cy - a.y) * firstSign < minSeg) {
          continue;
        }
        if (Math.abs(cx - a.x) < minSeg) {
          continue;
        }
        if (Math.abs(b.y - cy) < minSeg) {
          continue;
        }
        if ((b.x - cx) * lastSign < minSeg) {
          continue;
        }
      }

      const points: Point[] =
        firstAxis === 'x'
          ? [a, { x: cx, y: a.y }, { x: cx, y: cy }, { x: b.x, y: cy }, b]
          : [a, { x: a.x, y: cy }, { x: cx, y: cy }, { x: cx, y: b.y }, b];

      const sanitized = sanitizeOrthogonalPolylineForRendering(points as any, { spacing });
      if (!isInteriorClear(sanitized as Point[], obstacleRects)) {
        continue;
      }

      // Must still be a 3-bend (or fewer) polyline after sanitize.
      if (countBends(sanitized as Point[]) > 3) {
        continue;
      }

      const len = manhattanLength(sanitized as Point[]);
      if (len < bestLen) {
        best = sanitized as Point[];
        bestLen = len;
      }
    }
  }
  return best;
}

function countBends(pts: Point[]): number {
  let bends = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d1x = pts[i].x - pts[i - 1].x;
    const d1y = pts[i].y - pts[i - 1].y;
    const d2x = pts[i + 1].x - pts[i].x;
    const d2y = pts[i + 1].y - pts[i].y;
    if (Math.abs(d1x * d2y - d1y * d2x) > 1e-6) {
      bends++;
    }
  }
  return bends;
}

function isInteriorClear(pts: Point[], obstacleRects: [string, Rect][]): boolean {
  for (let i = 1; i < pts.length - 2; i++) {
    for (const [, rect] of obstacleRects) {
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

function pickLabelMidpoint(
  pts: Point[],
  lw: number,
  lh: number,
  allRects: [string, Rect][]
): Point | null {
  // Find the longest internal segment (exclude first/last = port stubs).
  // If fewer than 3 segments, fall back to the middle of the polyline.
  let bestIdx = -1;
  let bestLen = 0;
  const startIdx = pts.length >= 4 ? 1 : 0;
  const endIdx = pts.length >= 4 ? pts.length - 2 : pts.length - 1;
  for (let i = startIdx; i < endIdx; i++) {
    const len = Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
    if (len > bestLen) {
      bestLen = len;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) {
    return null;
  }
  const p1 = pts[bestIdx];
  const p2 = pts[bestIdx + 1];
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const lhw = lw / 2;
  const lhh = lh / 2;
  // Check label bbox against all nodes (endpoints included).
  for (const [, rect] of allRects) {
    const overlapX = mx + lhw > rect.left && mx - lhw < rect.right;
    const overlapY = my + lhh > rect.top && my - lhh < rect.bottom;
    if (overlapX && overlapY) {
      return null;
    }
  }
  return { x: mx, y: my };
}

function segDir(a: Point, b: Point): Dir {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const eps = 1e-6;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) {
    return null;
  }
  if (Math.abs(dx) < eps) {
    return dy > 0 ? 'D' : 'U';
  }
  if (Math.abs(dy) < eps) {
    return dx > 0 ? 'R' : 'L';
  }
  return null;
}

function manhattanLength(pts: Point[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.abs(pts[i].x - pts[i + 1].x) + Math.abs(pts[i].y - pts[i + 1].y);
  }
  return len;
}
