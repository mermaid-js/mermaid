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
import { checkLayout } from '../validateLayoutProxy.js';

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

function unitDirection(a: Point, b: Point): Point | null {
  if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    return { x: 0, y: b.y > a.y ? 1 : -1 };
  }
  if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
    return { x: b.x > a.x ? 1 : -1, y: 0 };
  }
  return null;
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

function segmentDirectionMatches(
  beforeA: Point,
  beforeB: Point,
  afterA: Point,
  afterB: Point
): boolean {
  const sgn = (v: number): number => (v > 1e-3 ? 1 : v < -1e-3 ? -1 : 0);
  return (
    sgn(beforeB.x - beforeA.x) === sgn(afterB.x - afterA.x) &&
    sgn(beforeB.y - beforeA.y) === sgn(afterB.y - afterA.y)
  );
}

function terminalDirectionsAllowed(before: Point[], after: Point[]): boolean {
  const sameStart = samePoint(before[0], after[0]);
  const sameEnd = samePoint(before[before.length - 1], after[after.length - 1]);
  if (sameStart && sameEnd) {
    return endpointDirectionsMatch(before, after);
  }
  if (sameStart && !segmentDirectionMatches(before[0], before[1], after[0], after[1])) {
    return false;
  }
  if (
    sameEnd &&
    !segmentDirectionMatches(
      before[before.length - 2],
      before[before.length - 1],
      after[after.length - 2],
      after[after.length - 1]
    )
  ) {
    return false;
  }
  return true;
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

function uniqueNumbers(values: number[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    if (!out.some((existing) => approxEqual(existing, value))) {
      out.push(value);
    }
  }
  return out;
}

function uniqueCoordinates(values: number[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue;
    }
    if (!out.some((existing) => approxEqual(existing, value))) {
      out.push(value);
    }
  }
  return out;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function pushUniqueCandidate(out: Point[][], route: Point[]): void {
  if (route.length < 2) {
    return;
  }
  for (let i = 0; i < route.length - 1; i++) {
    if (samePoint(route[i], route[i + 1])) {
      return;
    }
  }
  const key = route.map((p) => `${Math.round(p.x * 10)},${Math.round(p.y * 10)}`).join('|');
  const seen = out.some(
    (candidate) =>
      candidate.map((p) => `${Math.round(p.x * 10)},${Math.round(p.y * 10)}`).join('|') === key
  );
  if (!seen) {
    out.push(route);
  }
}

function terminalStubCandidates(pts: Point[]): Point[][] {
  const first = unitDirection(pts[0], pts[1]);
  const last = unitDirection(pts[pts.length - 2], pts[pts.length - 1]);
  if (!first || !last) {
    return [];
  }

  const p0 = pts[0];
  const pn = pts[pts.length - 1];
  const firstAxis = first.x !== 0 ? 'x' : 'y';
  const lastAxis = last.x !== 0 ? 'x' : 'y';
  if (firstAxis !== lastAxis) {
    return [];
  }

  const firstLen = Math.abs(pts[1].x - p0.x) + Math.abs(pts[1].y - p0.y);
  const lastLen = Math.abs(pn.x - pts[pts.length - 2].x) + Math.abs(pn.y - pts[pts.length - 2].y);
  const distances = uniqueNumbers([firstLen, lastLen, 20, STUB_MIN, 25, 30]);
  const out: Point[][] = [];

  for (const d of distances) {
    if (firstAxis === 'y') {
      const y = pn.y - last.y * d;
      const a = { x: p0.x, y };
      const b = { x: pn.x, y };
      if ((a.y - p0.y) * first.y > 0 && (pn.y - b.y) * last.y > 0) {
        pushUniqueCandidate(out, [{ ...p0 }, a, b, { ...pn }]);
      }
    } else {
      const x = pn.x - last.x * d;
      const a = { x, y: p0.y };
      const b = { x, y: pn.y };
      if ((a.x - p0.x) * first.x > 0 && (pn.x - b.x) * last.x > 0) {
        pushUniqueCandidate(out, [{ ...p0 }, a, b, { ...pn }]);
      }
    }
  }

  return out;
}

function startSideExitCandidates(
  pts: Point[],
  startRect: ReturnType<typeof rectForNode>,
  siblingPortClash: (axis: 'x' | 'y', sideCoord: number, target: number) => boolean
): Point[][] {
  if (pts.length < 5) {
    return [];
  }
  const first = unitDirection(pts[0], pts[1]);
  if (!first) {
    return [];
  }

  const out: Point[][] = [];
  const p1 = pts[1];
  const p2 = pts[2];
  const p3 = pts[3];

  if (first.x !== 0 && segDir(p1, p2) === 'V' && segDir(p2, p3) === 'H') {
    const sideY =
      p2.y < startRect.top - 1
        ? startRect.top
        : p2.y > startRect.bottom + 1
          ? startRect.bottom
          : null;
    if (sideY == null) {
      return out;
    }
    const lo = startRect.left + CORNER_MARGIN;
    const hi = startRect.right - CORNER_MARGIN;
    for (const x of uniqueCoordinates([
      clamp(p1.x, lo, hi),
      clamp(pts[0].x, lo, hi),
      startRect.cx,
    ])) {
      if (siblingPortClash('x', sideY, x)) {
        continue;
      }
      pushUniqueCandidate(out, [{ x, y: sideY }, { x, y: p2.y }, ...pts.slice(3)]);
    }
  } else if (first.y !== 0 && segDir(p1, p2) === 'H' && segDir(p2, p3) === 'V') {
    const sideX =
      p2.x < startRect.left - 1
        ? startRect.left
        : p2.x > startRect.right + 1
          ? startRect.right
          : null;
    if (sideX == null) {
      return out;
    }
    const lo = startRect.top + CORNER_MARGIN;
    const hi = startRect.bottom - CORNER_MARGIN;
    for (const y of uniqueCoordinates([
      clamp(p1.y, lo, hi),
      clamp(pts[0].y, lo, hi),
      startRect.cy,
    ])) {
      if (siblingPortClash('y', sideX, y)) {
        continue;
      }
      pushUniqueCandidate(out, [{ x: sideX, y }, { x: p2.x, y }, ...pts.slice(3)]);
    }
  }

  return out;
}

function endSideEntryCandidates(pts: Point[], endRect: ReturnType<typeof rectForNode>): Point[][] {
  const first = unitDirection(pts[0], pts[1]);
  if (!first) {
    return [];
  }

  const p0 = pts[0];
  const out: Point[][] = [];
  if (first.x < 0) {
    const end = { x: endRect.right, y: endRect.cy };
    for (const d of [20, STUB_MIN, 25, 30]) {
      const railX = endRect.right + d;
      if (railX < p0.x) {
        pushUniqueCandidate(out, [{ ...p0 }, { x: railX, y: p0.y }, { x: railX, y: end.y }, end]);
      }
    }
  } else if (first.x > 0) {
    const end = { x: endRect.left, y: endRect.cy };
    for (const d of [20, STUB_MIN, 25, 30]) {
      const railX = endRect.left - d;
      if (railX > p0.x) {
        pushUniqueCandidate(out, [{ ...p0 }, { x: railX, y: p0.y }, { x: railX, y: end.y }, end]);
      }
    }
  } else if (first.y < 0) {
    const end = { x: endRect.cx, y: endRect.bottom };
    for (const d of [20, STUB_MIN, 25, 30]) {
      const railY = endRect.bottom + d;
      if (railY < p0.y) {
        pushUniqueCandidate(out, [{ ...p0 }, { x: p0.x, y: railY }, { x: end.x, y: railY }, end]);
      }
    }
  } else if (first.y > 0) {
    const end = { x: endRect.cx, y: endRect.top };
    for (const d of [20, STUB_MIN, 25, 30]) {
      const railY = endRect.top - d;
      if (railY > p0.y) {
        pushUniqueCandidate(out, [{ ...p0 }, { x: p0.x, y: railY }, { x: end.x, y: railY }, end]);
      }
    }
  }
  return out;
}

function labelAnchors(pts: Point[], oldX: number, oldY: number): Point[] {
  const out: Point[] = [{ x: oldX, y: oldY }];
  const anchors: { x: number; y: number; len: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    for (const t of [0.5, 0.35, 0.65, 0.25, 0.75]) {
      anchors.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, len });
    }
  }
  anchors.sort((a, b) => b.len - a.len);
  for (const { x, y } of anchors) {
    if (!out.some((p) => approxEqual(p.x, x) && approxEqual(p.y, y))) {
      out.push({ x, y });
    }
  }
  return out;
}

export function simplifyEdgeJogsWhenScoreImproves(layout: LayoutData): void {
  let current = checkLayout(layout);
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

  for (let pass = 0; pass < 3; pass++) {
    let changedThisPass = false;
    for (const e of edges) {
      const pts = e?.points as Point[] | undefined;
      if (!Array.isArray(pts) || pts.length < 4 || pts.length > 6) {
        continue;
      }
      const p0 = pts[0];
      const pn = pts[pts.length - 1];
      const startId = e?.start != null ? String(e.start) : '';
      const endId = e?.end != null ? String(e.end) : '';

      // Validity pre-screen set for the accept test below.
      const focusEdgeIds = e?.id != null ? new Set([String(e.id)]) : undefined;

      const candidates: Point[][] = [];
      if (approxEqual(p0.x, pn.x) || approxEqual(p0.y, pn.y)) {
        candidates.push([p0, pn]);
      } else {
        candidates.push([p0, { x: p0.x, y: pn.y }, pn], [p0, { x: pn.x, y: p0.y }, pn]);
      }
      candidates.push(...terminalStubCandidates(pts));
      const endRect = rectById.get(endId);
      if (endRect) {
        candidates.push(...endSideEntryCandidates(pts, endRect));
      }
      const startRect = rectById.get(startId);
      if (startRect) {
        const startSideCandidates = startSideExitCandidates(
          pts,
          startRect,
          (axis, sideCoord, target) => siblingPortClash(startId, e, axis, sideCoord, target)
        );
        candidates.push(...startSideCandidates);
      }

      // Port-slide candidates: the plain L often fails only because its
      // terminal stub into `pn` would be a hair under the validator's 10px
      // minimum (the producer's jog exists to lengthen that stub). Slide the
      // START port along its own side so the single rail clears STUB_MIN,
      // then route as straight/L. Constraints: port stays on the same side,
      // CORNER_MARGIN inside the side span, clear of sibling ports.
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
        if (!terminalDirectionsAllowed(pts, candidate)) {
          continue;
        }
        if (!clearOfObstacles(candidate)) {
          continue;
        }
        const oldPoints = e.points;
        const oldX = e.x;
        const oldY = e.y;
        const hasLabel = Number.isFinite(oldX) && Number.isFinite(oldY);
        e.points = candidate as any;
        let accepted = false;
        const anchors = hasLabel ? labelAnchors(candidate, oldX, oldY) : [{ x: 0, y: 0 }];
        for (const anchor of anchors) {
          if (hasLabel) {
            e.x = anchor.x;
            e.y = anchor.y;
          }
          // Acceptance needs `next.ok`, and `current` is always an ok result,
          // so only an issue involving THIS edge can invalidate the layout —
          // every check is a pure function of geometry and nothing else moved.
          // A focused run answers that over this edge's handful of issues
          // instead of re-deriving `domus/architecture`'s ~200, and only the
          // survivors pay for the full run, which is the only thing that can
          // produce a score comparable with the baseline's.
          if (focusEdgeIds && !checkLayout(layout, { focusEdgeIds }).ok) {
            continue;
          }
          const next = checkLayout(layout);
          if (next.ok && next.score > current.score) {
            current = next;
            changedThisPass = true;
            accepted = true;
            break;
          }
        }
        if (accepted) {
          break;
        }
        e.points = oldPoints;
        e.x = oldX;
        e.y = oldY;
      }
    }
    if (!changedThisPass) {
      break;
    }
  }
}
