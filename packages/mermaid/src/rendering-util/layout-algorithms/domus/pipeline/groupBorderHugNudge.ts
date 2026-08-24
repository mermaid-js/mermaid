/**
 * Score-gated group-border-hug nudge (finalize stage).
 *
 * A long interior edge segment running flush ALONG a subgraph frame trips
 * `validateLayout`'s `edge-border-hugging` (checked against `groupBorderRects`).
 * The pre-finalize `alleyMidpointNudge` only nudges off LEAF-node borders —
 * group frames are excluded there because a frame is not a solid obstacle and a
 * blunt "always nudge away from the rect" rule pushes legitimately-inside
 * segments out of the group (see orthogonal.pipeline group-routing specs).
 *
 * This pass runs at finalize time and is fully score-gated: for each interior
 * segment flush on a group frame it tries shifting the segment off the frame in
 * BOTH directions, and keeps a candidate only when the unified validator score
 * strictly improves. Direction-agnostic + score-gated means it can fix the hug
 * (e.g. deploy-pipeline K-\>L exiting the Deploy Pipeline subgraph) without ever
 * making any layout worse.
 */
import type { LayoutData } from '../../../types.js';
import { approxEqual, rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;

/** Matches validateLayout's EPS_BORDER (2) plus a little slack. */
const EPS_ON_BORDER = 2.5;

function segmentInsideLeafNode(
  axis: 'x' | 'y',
  value: number,
  lo: number,
  hi: number,
  leafRects: Rect[]
): boolean {
  for (const r of leafRects) {
    if (axis === 'x') {
      if (value > r.left && value < r.right && Math.min(hi, r.bottom) - Math.max(lo, r.top) > 0) {
        return true;
      }
    } else if (
      value > r.top &&
      value < r.bottom &&
      Math.min(hi, r.right) - Math.max(lo, r.left) > 0
    ) {
      return true;
    }
  }
  return false;
}

export function nudgeSegmentsOffGroupBordersWhenScoreImproves(
  layout: LayoutData,
  spacing = 10
): void {
  const groupRects: Rect[] = [];
  const leafRects: Rect[] = [];
  for (const n of (layout.nodes ?? []) as any[]) {
    if (n?.id == null) {
      continue;
    }
    if (n.isGroup) {
      groupRects.push(rectForNode(n));
    } else if (!n.isEdgeLabel) {
      leafRects.push(rectForNode(n));
    }
  }
  if (groupRects.length === 0) {
    return;
  }

  const margin = Math.max(3, spacing / 2);
  let current = checkLayout(layout);
  if (!current.ok && current.issues.every((i) => i.type !== 'edge-border-hugging')) {
    // Nothing for this pass to fix; avoid churn on unrelated invalid layouts.
    return;
  }

  for (const edge of (layout.edges ?? []) as any[]) {
    const pts = edge.points as Point[] | undefined;
    if (!Array.isArray(pts) || pts.length < 4) {
      continue;
    }
    // Interior segments only (skip the first and last port stubs).
    for (let i = 1; i < pts.length - 2; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const isV = approxEqual(a.x, b.x) && !approxEqual(a.y, b.y);
      const isH = approxEqual(a.y, b.y) && !approxEqual(a.x, b.x);
      if (!isV && !isH) {
        continue;
      }
      const lo = isV ? Math.min(a.y, b.y) : Math.min(a.x, b.x);
      const hi = isV ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
      const coord = isV ? a.x : a.y;

      // On a group frame? (axis coord ≈ frame left/right for V, top/bottom for H,
      // with perpendicular-range overlap so it actually runs along the frame).
      let onFrame = false;
      for (const r of groupRects) {
        if (isV) {
          const overlapY = Math.min(hi, r.bottom) - Math.max(lo, r.top);
          if (
            overlapY > 1 &&
            (Math.abs(coord - r.left) <= EPS_ON_BORDER ||
              Math.abs(coord - r.right) <= EPS_ON_BORDER)
          ) {
            onFrame = true;
            break;
          }
        } else {
          const overlapX = Math.min(hi, r.right) - Math.max(lo, r.left);
          if (
            overlapX > 1 &&
            (Math.abs(coord - r.top) <= EPS_ON_BORDER ||
              Math.abs(coord - r.bottom) <= EPS_ON_BORDER)
          ) {
            onFrame = true;
            break;
          }
        }
      }
      if (!onFrame) {
        continue;
      }

      // Try both directions, nearest offsets first; keep the first that the
      // unified validator scores strictly higher.
      const offsets = [margin, -margin, 1.5 * margin, -1.5 * margin, 2 * margin, -2 * margin];
      for (const d of offsets) {
        const newCoord = coord + d;
        const axis = isV ? 'x' : 'y';
        if (segmentInsideLeafNode(axis, newCoord, lo, hi, leafRects)) {
          continue;
        }
        const oldA = { x: a.x, y: a.y };
        const oldB = { x: b.x, y: b.y };
        if (isV) {
          pts[i] = { x: newCoord, y: a.y };
          pts[i + 1] = { x: newCoord, y: b.y };
        } else {
          pts[i] = { x: a.x, y: newCoord };
          pts[i + 1] = { x: b.x, y: newCoord };
        }
        const next = checkLayout(layout);
        if (next.score > current.score) {
          current = next;
          break;
        }
        pts[i] = oldA;
        pts[i + 1] = oldB;
      }
    }
  }
}
