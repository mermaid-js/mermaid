import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';

// iter-34 (R10) — trim trailing polyline tail that runs colinear with the
// target node's boundary. Resolves `edge-border-hugging` on port-APPROACH
// segments — not covered by alleyMidpointNudge (interior segments only) or
// postRouting nudges (explicit last-segment exclusion).
//
// Paper anchor: Siebenhaller §2.3 non-overlap invariant + §2.3.2.1 Kandinsky
// bend-or-end (first/last segment ⟂ port side). Source `0fb2d84f`.
// The trailing tail is a Kandinsky shape-level illegal symbol; the polyline
// is valid once the tail is popped because the prior bend already provides
// the perpendicular last segment.

const ON_BOUNDARY_TOLERANCE = 0.1;

/**
 * Trim the final polyline point when the last segment runs colinear with
 * the target node's boundary AND both endpoints lie strictly between the
 * rect's perpendicular extents. The "strictly between" guard distinguishes
 * the pathology (segment running along a boundary mid-stretch — the port
 * is spuriously extended from a legitimate perpendicular bend) from a
 * legitimate corner-entry approach where one endpoint sits outside the
 * rect's extent and the other lands on the target side.
 *
 * Example pathology (deploy-pipeline F→I label-edge):
 *   prev (30, 367), last (80, 367), F.top=367.05, F.left=0, F.right=154.17.
 *   Both y's ≈ F.top; both x's strictly in (0, 154.17) → trim.
 *
 * Example legitimate corner approach (A→C around B):
 *   prev (280, 70), last (280, 100), C.left=280, C.top=80, C.bottom=120.
 *   Both x's = C.left; prev.y=70 \< C.top=80 (NOT strictly inside) → do not trim.
 *
 * Skips:
 *   - edges with fewer than 3 points (no prior bend to rely on)
 *   - edges whose target is a group (group rects are legitimately enclosing)
 *   - self-loops (start === end)
 */
export function trimPortTailHug(data: LayoutData): { trimmed: number } {
  let trimmed = 0;
  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }
  const strictlyBetween = (v: number, lo: number, hi: number) =>
    v > lo + ON_BOUNDARY_TOLERANCE && v < hi - ON_BOUNDARY_TOLERANCE;
  for (const e of data.edges ?? []) {
    if (!e?.end) {
      continue;
    }
    if (e.start != null && String(e.start) === String(e.end)) {
      continue;
    }
    const pts = (e as { points?: { x: number; y: number }[] }).points;
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const tNode = nodesById.get(String(e.end));
    if (!tNode || (tNode as { isGroup?: boolean }).isGroup) {
      continue;
    }
    const r = rectForNode(tNode);
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dx = Math.abs(last.x - prev.x);
    const dy = Math.abs(last.y - prev.y);
    // Horizontal last segment colinear with target's top or bottom,
    // strictly between left and right.
    if (
      dy < ON_BOUNDARY_TOLERANCE &&
      dx > ON_BOUNDARY_TOLERANCE &&
      strictlyBetween(last.x, r.left, r.right) &&
      strictlyBetween(prev.x, r.left, r.right) &&
      ((Math.abs(last.y - r.top) < ON_BOUNDARY_TOLERANCE &&
        Math.abs(prev.y - r.top) < ON_BOUNDARY_TOLERANCE) ||
        (Math.abs(last.y - r.bottom) < ON_BOUNDARY_TOLERANCE &&
          Math.abs(prev.y - r.bottom) < ON_BOUNDARY_TOLERANCE))
    ) {
      pts.pop();
      trimmed++;
      continue;
    }
    // Vertical last segment colinear with target's left or right,
    // strictly between top and bottom.
    if (
      dx < ON_BOUNDARY_TOLERANCE &&
      dy > ON_BOUNDARY_TOLERANCE &&
      strictlyBetween(last.y, r.top, r.bottom) &&
      strictlyBetween(prev.y, r.top, r.bottom) &&
      ((Math.abs(last.x - r.left) < ON_BOUNDARY_TOLERANCE &&
        Math.abs(prev.x - r.left) < ON_BOUNDARY_TOLERANCE) ||
        (Math.abs(last.x - r.right) < ON_BOUNDARY_TOLERANCE &&
          Math.abs(prev.x - r.right) < ON_BOUNDARY_TOLERANCE))
    ) {
      pts.pop();
      trimmed++;
    }
  }
  return { trimmed };
}
