import type { LayoutData, Node } from '../../../types.js';
import type { Point } from '../types.js';
import { approxEqual } from '../core/helpers.js';
import { polylineIntersectsAnyRect } from '../core/routing.js';

// Match validateLayout's edge-border-hugging threshold.
const L_MIN_BORDER = 12;

type Side = 'left' | 'right' | 'top' | 'bottom';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
}

function rectOf(n: Node): Rect {
  const cx = n.x! ?? 0;
  const cy = n.y! ?? 0;
  const w = n.width! ?? 0;
  const h = n.height! ?? 0;
  return {
    cx,
    cy,
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2,
  };
}

function sideOfPoint(p: Point, r: Rect): Side | null {
  if (approxEqual(p.x, r.left)) {
    return 'left';
  }
  if (approxEqual(p.x, r.right)) {
    return 'right';
  }
  if (approxEqual(p.y, r.top)) {
    return 'top';
  }
  if (approxEqual(p.y, r.bottom)) {
    return 'bottom';
  }
  return null;
}

function portOnSide(r: Rect, side: Side): Point {
  switch (side) {
    case 'left':
      return { x: r.left, y: r.cy };
    case 'right':
      return { x: r.right, y: r.cy };
    case 'top':
      return { x: r.cx, y: r.top };
    case 'bottom':
      return { x: r.cx, y: r.bottom };
  }
}

/**
 * Compute how much of a vertical segment at x=X would run flush on rect's
 * left/right side (returns 0 if the segment's x is not on either side).
 * For a horizontal segment at y=Y, checks top/bottom.
 */
function segmentHugLength(a: Point, b: Point, r: Rect): number {
  if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    // vertical segment
    if (!approxEqual(a.x, r.left) && !approxEqual(a.x, r.right)) {
      return 0;
    }
    const yLo = Math.min(a.y, b.y);
    const yHi = Math.max(a.y, b.y);
    return Math.max(0, Math.min(yHi, r.bottom) - Math.max(yLo, r.top));
  }
  if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
    // horizontal segment
    if (!approxEqual(a.y, r.top) && !approxEqual(a.y, r.bottom)) {
      return 0;
    }
    const xLo = Math.min(a.x, b.x);
    const xHi = Math.max(a.x, b.x);
    return Math.max(0, Math.min(xHi, r.right) - Math.max(xLo, r.left));
  }
  return 0;
}

/**
 * When redirecting to a new side, the new bend must lie outside the target
 * rectangle on the correct side of the chosen attach. E.g., altSide='top'
 * requires the bend's y to sit above rect.top (approach from above).
 * Otherwise the new approach segment would cross the rectangle interior.
 */
function bendIsOutsideOnApproachAxis(bend: Point, r: Rect, altSide: Side): boolean {
  switch (altSide) {
    case 'top':
      return bend.y <= r.top;
    case 'bottom':
      return bend.y >= r.bottom;
    case 'left':
      return bend.x <= r.left;
    case 'right':
      return bend.x >= r.right;
  }
}

/**
 * Kandinsky canonical invariant (Siebenhaller, Constraint-Kandinsky §5.2.1, Def. 2.5):
 * an incoming edge segment must enter perpendicular to the attached vertex side.
 * A vertical segment ends on top/bottom (horizontal sides); a horizontal segment
 * ends on left/right (vertical sides). When the pre-routing stage picks a port on
 * a parallel side, the final segment runs flush along the obstacle border.
 *
 * This pass detects that violation per edge endpoint and, when possible, moves the
 * offending port to the perpendicular side facing the approach direction, shifting
 * the adjacent bend so the new last/first segment still enters perpendicular. The
 * move is skipped if the alternative path would cross another obstacle.
 *
 * Returns the number of edges whose polyline was modified (0 or 1 per edge).
 */
export function reselectPortSideForPerpendicularEntry(
  data: LayoutData,
  nodesById: Map<string, Node>
): number {
  if (!data.edges) {
    return 0;
  }
  let changed = 0;

  for (const edge of data.edges) {
    if ((edge as any).__orthoCompound) {
      continue;
    }
    const pts = edge?.points as Point[] | undefined;
    if (!pts || pts.length < 2) {
      continue;
    }
    const startId = String(edge.start ?? '');
    const endId = String(edge.end ?? '');
    const sNode = nodesById.get(startId);
    const tNode = nodesById.get(endId);
    if (!sNode || !tNode) {
      continue;
    }
    if (startId === endId) {
      continue;
    } // self-loops have dedicated routing

    let edgeChanged = false;

    // --- End side (last segment) ---
    // Only reselect on 3-point pure L-shapes. Detour polylines (4+ points) can
    // legitimately include a flush last segment as part of the parallel-track
    // ordering step (see `orthogonal.pipeline.spec.ts > separates multiple
    // parallel edges even when routing requires a detour polyline`). Redirecting
    // those would break the inter-track spacing invariant.
    if (pts.length === 3) {
      const lastB = pts[pts.length - 1];
      const lastA = pts[pts.length - 2];
      const tRect = rectOf(tNode);
      const endSide = sideOfPoint(lastB, tRect);
      const segVertical = approxEqual(lastA.x, lastB.x) && !approxEqual(lastA.y, lastB.y);
      const segHorizontal = approxEqual(lastA.y, lastB.y) && !approxEqual(lastA.x, lastB.x);

      let flushEnd = false;
      let altSide: Side | null = null;
      if (endSide === 'left' || endSide === 'right') {
        // vertical side — segment must be horizontal; if vertical → flush
        if (segVertical && segmentHugLength(lastA, lastB, tRect) >= L_MIN_BORDER) {
          flushEnd = true;
          // coming from above (lastA.y < lastB.y) → target top; else bottom
          altSide = lastA.y < lastB.y ? 'top' : 'bottom';
        }
      } else if (
        (endSide === 'top' || endSide === 'bottom') && // horizontal side — segment must be vertical; if horizontal → flush
        segHorizontal &&
        segmentHugLength(lastA, lastB, tRect) >= L_MIN_BORDER
      ) {
        flushEnd = true;
        altSide = lastA.x < lastB.x ? 'left' : 'right';
      }

      if (flushEnd && altSide) {
        const newEnd = portOnSide(tRect, altSide);
        const newBend: Point =
          altSide === 'top' || altSide === 'bottom'
            ? { x: newEnd.x, y: lastA.y }
            : { x: lastA.x, y: newEnd.y };
        if (bendIsOutsideOnApproachAxis(newBend, tRect, altSide)) {
          const candidate: Point[] = [...pts.slice(0, -2), newBend, newEnd];
          if (!polylineIntersectsAnyRect(candidate, nodesById, startId, endId)) {
            edge.points = candidate;
            edgeChanged = true;
          }
        }
      }
    }

    // Start-side (first segment) reselect is intentionally NOT implemented in this
    // iteration. Upstream port-ordering passes (see reconcilePortsToLaneOrderRoutingGraph
    // / hk-left-inversion regression test) deliberately place exit ports on a side even
    // when the first segment runs flush for a short distance. Redirecting them would
    // break those port-order invariants. End-side reselect is safe because the last
    // segment's port choice is the terminal attach, not subject to lane ordering.

    if (edgeChanged) {
      changed++;
    }
  }

  return changed;
}
