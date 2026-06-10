/**
 * iter-62 — generic edge-jog simplification (labeled and unlabeled edges).
 *
 * The shape-walk producer can emit routes with redundant interior jogs
 * (e.g. multiple-edges' b→c: down, jog toward center, down the corridor,
 * then sideways into the target — 5 points where a 2-bend... 1-bend L
 * suffices). The labeled-edge cleanup tail in `finalizeOverlayLabels.ts`
 * never sees unlabeled layouts (it early-returns when no label nodes
 * exist), so these jogs survived every prior pass.
 *
 * For each edge with 4–6 points, try the minimal candidates that keep the
 * SAME endpoints (ports are fixed) and the SAME first/last segment
 * directions (Kandinsky port-side invariant): a straight 2-point route or
 * one of the two L-shapes. A candidate must clear every non-endpoint
 * node's interior; it is kept only when the unified validator stays valid
 * and the headline score strictly improves. Paper anchor: optimal
 * orthogonal connector routing minimizes a monotone penalty in
 * (length, bends) — an obstacle-free L is the minimum for both (Wybrow,
 * sources `e8804c93` / `32fe421c`).
 */
import type { LayoutData } from '../../../types.js';
import { approxEqual, rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';
import { validateLayout } from '../../layout-utils/validateLayout.js';

interface Point {
  x: number;
  y: number;
}

type Dir = 'H' | 'V' | null;

function segDir(a: Point, b: Point): Dir {
  if (approxEqual(a.y, b.y)) {
    return 'H';
  }
  if (approxEqual(a.x, b.x)) {
    return 'V';
  }
  return null;
}

function samePoint(a: Point, b: Point): boolean {
  return approxEqual(a.x, b.x) && approxEqual(a.y, b.y);
}

/**
 * Strict direction match for first and last segments (orientation + sign).
 * Each route is measured against its OWN endpoints — port-slide candidates
 * have a repositioned start point.
 */
function endpointDirectionsMatch(before: Point[], after: Point[]): boolean {
  const sgn = (v: number): number => (v > 1e-3 ? 1 : v < -1e-3 ? -1 : 0);
  const exitB = { x: before[1].x - before[0].x, y: before[1].y - before[0].y };
  const exitA = { x: after[1].x - after[0].x, y: after[1].y - after[0].y };
  const pnB = before[before.length - 1];
  const pnA = after[after.length - 1];
  const enterB = { x: pnB.x - before[before.length - 2].x, y: pnB.y - before[before.length - 2].y };
  const enterA = { x: pnA.x - after[after.length - 2].x, y: pnA.y - after[after.length - 2].y };
  return (
    sgn(exitB.x) === sgn(exitA.x) &&
    sgn(exitB.y) === sgn(exitA.y) &&
    sgn(enterB.x) === sgn(enterA.x) &&
    sgn(enterB.y) === sgn(enterA.y)
  );
}

/**
 * Minimum terminal-stub length for a slid rail. The validator's
 * parallel-band rule flags a rail whose distance to the endpoint node's
 * border is at most EPS_ENDPOINT_BAND(18) + EPS(1), so the first safe
 * integer distance is 20; use 21 for margin.
 */
const STUB_MIN = 21;
/** Keep repositioned ports this far from node corners (matches iter-61). */
const CORNER_MARGIN = 6;
/** Minimum spacing to sibling ports on the same node side. */
const SIBLING_CLEARANCE = 6;

export function simplifyEdgeJogsWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  if (!current.ok) {
    return;
  }

  const obstacles: { id: string; rect: ReturnType<typeof rectForNode> }[] = [];
  const rectById = new Map<string, ReturnType<typeof rectForNode>>();
  for (const n of (layout.nodes ?? []) as any[]) {
    if (n?.id == null || n.isGroup) {
      continue;
    }
    const r = rectForNode(n);
    obstacles.push({ id: String(n.id), rect: r });
    rectById.set(String(n.id), r);
  }

  const edges = (layout.edges ?? []) as any[];

  /** True when another edge's attachment on `nodeId`'s H-side (top/bottom at
   * `sideY`) sits within SIBLING_CLEARANCE of `x` (mirrored for V-sides). */
  const siblingPortClash = (
    nodeId: string,
    skipEdge: any,
    axis: 'x' | 'y',
    sideCoord: number,
    target: number
  ): boolean => {
    for (const other of edges) {
      if (other === skipEdge) {
        continue;
      }
      const opts = other?.points as Point[] | undefined;
      if (!Array.isArray(opts) || opts.length === 0) {
        continue;
      }
      const ends: [string, Point][] = [
        [other?.start != null ? String(other.start) : '', opts[0]],
        [other?.end != null ? String(other.end) : '', opts[opts.length - 1]],
      ];
      for (const [nid, p] of ends) {
        if (nid !== nodeId) {
          continue;
        }
        const onSide = axis === 'x' ? approxEqual(p.y, sideCoord) : approxEqual(p.x, sideCoord);
        const coord = axis === 'x' ? p.x : p.y;
        if (onSide && Math.abs(coord - target) < SIBLING_CLEARANCE) {
          return true;
        }
      }
    }
    return false;
  };

  for (const e of edges) {
    const pts = e?.points as Point[] | undefined;
    if (!Array.isArray(pts) || pts.length < 4 || pts.length > 6) {
      continue;
    }
    const p0 = pts[0];
    const pn = pts[pts.length - 1];
    const startId = e?.start != null ? String(e.start) : '';
    const endId = e?.end != null ? String(e.end) : '';

    const candidates: Point[][] = [];
    if (approxEqual(p0.x, pn.x) || approxEqual(p0.y, pn.y)) {
      candidates.push([p0, pn]);
    } else {
      candidates.push([p0, { x: p0.x, y: pn.y }, pn], [p0, { x: pn.x, y: p0.y }, pn]);
    }

    // Port-slide candidates: the plain L often fails only because its
    // terminal stub into `pn` would be a hair under the validator's 10px
    // minimum (the producer's jog exists to lengthen that stub). Slide the
    // START port along its own side so the single rail clears STUB_MIN,
    // then route as straight/L. Constraints: port stays on the same side,
    // CORNER_MARGIN inside the side span, clear of sibling ports.
    const startRect = rectById.get(startId);
    const firstDir = segDir(p0, pts[1]);
    const lastDir = segDir(pts[pts.length - 2], pn);
    if (
      startRect &&
      firstDir === 'V' &&
      (approxEqual(p0.y, startRect.top) || approxEqual(p0.y, startRect.bottom))
    ) {
      const lo = startRect.left + CORNER_MARGIN;
      const hi = startRect.right - CORNER_MARGIN;
      let targetX: number | null = null;
      if (lastDir === 'H') {
        // End enters horizontally: rail must sit STUB_MIN away from pn on
        // the approach side (sign taken from the original last segment).
        const approach = Math.sign(pn.x - pts[pts.length - 2].x);
        targetX = pn.x - approach * STUB_MIN;
      } else if (lastDir === 'V') {
        // Both ends vertical: align the start port with pn for a straight.
        targetX = pn.x;
      }
      if (
        targetX != null &&
        !approxEqual(targetX, p0.x) &&
        targetX >= lo &&
        targetX <= hi &&
        !siblingPortClash(startId, e, 'x', p0.y, targetX)
      ) {
        const newP0 = { x: targetX, y: p0.y };
        candidates.push(lastDir === 'V' ? [newP0, pn] : [newP0, { x: targetX, y: pn.y }, pn]);
      }
    } else if (
      startRect &&
      firstDir === 'H' &&
      (approxEqual(p0.x, startRect.left) || approxEqual(p0.x, startRect.right))
    ) {
      const lo = startRect.top + CORNER_MARGIN;
      const hi = startRect.bottom - CORNER_MARGIN;
      let targetY: number | null = null;
      if (lastDir === 'V') {
        const approach = Math.sign(pn.y - pts[pts.length - 2].y);
        targetY = pn.y - approach * STUB_MIN;
      } else if (lastDir === 'H') {
        targetY = pn.y;
      }
      if (
        targetY != null &&
        !approxEqual(targetY, p0.y) &&
        targetY >= lo &&
        targetY <= hi &&
        !siblingPortClash(startId, e, 'y', p0.x, targetY)
      ) {
        const newP0 = { x: p0.x, y: targetY };
        candidates.push(lastDir === 'H' ? [newP0, pn] : [newP0, { x: pn.x, y: targetY }, pn]);
      }
    }

    const clearOfObstacles = (route: Point[]): boolean => {
      for (let i = 0; i < route.length - 1; i++) {
        if (segDir(route[i], route[i + 1]) === null && !samePoint(route[i], route[i + 1])) {
          return false; // non-orthogonal candidate segment
        }
        for (const ob of obstacles) {
          if (ob.id === startId || ob.id === endId) {
            continue;
          }
          if (segmentIntersectsRectInterior(route[i], route[i + 1], ob.rect)) {
            return false;
          }
        }
      }
      return true;
    };

    for (const candidate of candidates) {
      if (candidate.length >= pts.length) {
        continue;
      }
      if (!endpointDirectionsMatch(pts, candidate)) {
        continue;
      }
      if (!clearOfObstacles(candidate)) {
        continue;
      }
      const oldPoints = e.points;
      e.points = candidate as any;
      const next = validateLayout(layout);
      if (next.ok && next.score > current.score) {
        current = next;
        break;
      }
      e.points = oldPoints;
    }
  }
}
