// cspell:ignore Battista Eades Eiglsperger Hegemann Kandinsky segs Siebenhaller Tamassia Tollis Fößmeier
import type { Edge, Node } from '../../../types.js';
import {
  classifyThreeSegmentRoute,
  collectRealNodeBounds,
  dedupeConsecutivePoints,
  getNodePairGeometry,
  samePoint,
  segmentConflictsWithAnyEdge,
  segmentHitsAnyRect,
} from './geometry.js';

const EPS = 1e-6;
// δ_s — the Kandinsky port-spacing constant (Fößmeier–Kaufmann 1995;
// Siebenhaller dissertation §6.1.2.2). When this pass places a second
// edge on a face already occupied by a sibling centered at delta=0,
// the canonical pairing is (0, ±δ_s) — full δ_s separation between
// port centers, not δ_s/2. `straightenCollinearSiblingDetours` uses δ_s/2
// because that pass shifts BOTH members of a collinear pair
// symmetrically (to ±δ_s/2, separation δ_s); this pass shifts only
// the single edge being swapped, so it must move the full δ_s to
// preserve the same canonical spacing.
const MIN_PORT_SPACING = 8;
const PORT_SHIFT = MIN_PORT_SPACING;
const TRY_DELTAS = [0, PORT_SHIFT, -PORT_SHIFT, 2 * PORT_SHIFT, -2 * PORT_SHIFT];

interface PointLite {
  x: number;
  y: number;
}

/**
 * Iter 17 — port-swap a 4-point H-V-H / V-H-V edge to a 3-point L-shape
 * when the current src port is "straight-through" (parallel to the
 * incoming edge) but a perpendicular src face permits a one-bend reach
 * to the existing dst port.
 *
 * Motivating case (user report 2026-04-16, 8-query-process-2.mmd):
 *   L_A2_E_0 currently:
 *     (A2.east=355.2, 0) → (gutter=402.3, 0)
 *       → (402.3, 213.4) → (E.west=844.1, 213.4)
 *   i.e. exits A2 on the east face (parallel to incoming A→A2), bends
 *   south, bends east — 2 interior bends. The south face of A2 points
 *   directly toward E's lane, so exiting south gives a 1-bend L-shape:
 *     (A2.south=cx±δ, 69.3) → (cx±δ, 213.4) → (E.west=844.1, 213.4)
 *   Saves one bend.
 *
 * Paper backing:
 *   - Tamassia's bend-minimization flow (1987, and
 *     Di Battista–Eades–Tamassia–Tollis §5): port/face assignment is a
 *     free variable and the optimum switches faces whenever it saves a
 *     bend.
 *   - Kandinsky port distribution (Fößmeier–Kaufmann 1995;
 *     Siebenhaller dissertation §2.3–§2.5): decision-diamond outgoing
 *     edges favor distinct perpendicular faces.
 *   - Siebenhaller §3.3 "Port Assignment" + §4.1 "Bend optimization":
 *     local port-swap accepted iff (a) bends strictly decrease, (b) no
 *     new crossings, (c) Kandinsky face-capacity preserved.
 *   - Hegemann–Wolff §4.2 joint-feasibility (paper src `b65b3d45`):
 *     the formal crossings + capacity guard set.
 *
 * Shape handled (src, dst NOT collinear):
 *   H-V-H:  p0 → p1 (horiz) → p2 (vert) → p3 (horiz);
 *           src face E/W (parallel to seg01); swap to N/S.
 *   V-H-V:  p0 → p1 (vert)  → p2 (horiz) → p3 (vert);
 *           src face N/S (parallel to seg01); swap to E/W.
 *
 * Rewrite (H-V-H):
 *   new_src_port = (src.cx + δ, dst-below ? src.bottom : src.top)
 *   new_polyline = [ new_src_port, (src.cx + δ, p3.y), p3 ]
 * (V-H-V symmetric across axes.)
 *
 * Safety (the six guards from the iter-17 plan):
 *   1. Strict bend-count decrease   — enforced by the 4-point → 3-point
 *                                     rewrite.
 *   2. No new edge-edge crossings    — orthogonalSegmentsCross vs every other
 *                                     non-self segment.
 *   3. No new edge-node collisions   — segment-vs-node guard (both new segs,
 *                                     excluding src for seg-1 and dst
 *                                     for seg-2).
 *   4. Kandinsky face capacity       — port-offset delta chosen from
 *                                     0, ±PORT_SHIFT, ±2·PORT_SHIFT;
 *                                     each candidate must lie strictly
 *                                     within the src face span; the
 *                                     collinear-axis overlap check
 *                                     (shared axis + overlapping range)
 *                                     rejects δ values that collide
 *                                     with an existing sibling port.
 *   5. No label-rect overlap on new  — re-done by anchorLabelsToPolyline
 *      segments                        which runs after this pass.
 *   6. Monotonic on fixture suite    — enforced externally by the DDLT
 *                                     contract (no spec's totalBends or
 *                                     crossings may increase).
 *
 * Distinct from `straightenCollinearSiblingDetours` (iter 12) which handles
 * the COLLINEAR case (4-point → 2-point straight). This pass handles
 * the non-collinear case (4-point → 3-point L). The two are disjoint
 * by the collinearX === collinearY guard: coRoute runs first and
 * converts collinear edges to 2-point straights which this pass then
 * skips by shape filter.
 *
 * Distinct from Eiglsperger bend-stretching (cited in iter 16
 * collapseShortTerminalStub): that pass requires the first and last
 * direction to be preserved; this pass explicitly CHANGES the first
 * direction — the whole point.
 */
export function portSwapToLShape(edges: Edge[], nodes: Node[]): void {
  const { nodeInfoById, realNodeRects } = collectRealNodeBounds(nodes);

  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const pts = edge.points;
    if (!pts || pts.length < 4) {
      continue;
    }

    // Dedupe consecutive identical points (raykov / endpoint-clip can
    // produce duplicates). We operate on the DEDUPED polyline but write
    // back without duplicates too — the rendering-handoff pass later
    // re-duplicates endpoints for the intersect-rect guard.
    const route = classifyThreeSegmentRoute(dedupeConsecutivePoints(pts, EPS), EPS);
    if (!route) {
      continue;
    }

    const { p3 } = route;
    const isHVH = route.kind === 'HVH';

    const nodePair = getNodePairGeometry(edge, nodeInfoById, EPS);
    if (!nodePair) {
      continue;
    }
    const { srcId, dstId, srcInfo, dstInfo, collinearX, collinearY } = nodePair;

    // Skip collinear src/dst — straightenCollinearSiblingDetours handles those.
    if (collinearX || collinearY) {
      continue;
    }

    // Build candidate new polyline.
    // H-V-H: swap src E/W face → N/S face. Preserve dst port (p3).
    //   new p0 = (src.cx + δ, dst-below ? src.bottom : src.top)
    //   new p1 = (src.cx + δ, p3.y)
    //   new p2 = p3
    // V-H-V symmetric.
    let newPts: PointLite[] | undefined;
    const srcRect = srcInfo.rect;

    for (const delta of TRY_DELTAS) {
      let np0: PointLite;
      let np1: PointLite;
      let np2: PointLite;

      if (isHVH) {
        const dstBelow = dstInfo.cy > srcInfo.cy;
        const newSrcY = dstBelow ? srcRect.bottom : srcRect.top;
        const newSrcX = srcInfo.cx + delta;
        // Must lie strictly within src face span (exclusive of corners).
        if (newSrcX <= srcRect.left + EPS || newSrcX >= srcRect.right - EPS) {
          continue;
        }
        np0 = { x: newSrcX, y: newSrcY };
        np1 = { x: newSrcX, y: p3.y };
        np2 = { x: p3.x, y: p3.y };
      } else {
        // isVHV
        const dstEast = dstInfo.cx > srcInfo.cx;
        const newSrcX = dstEast ? srcRect.right : srcRect.left;
        const newSrcY = srcInfo.cy + delta;
        if (newSrcY <= srcRect.top + EPS || newSrcY >= srcRect.bottom - EPS) {
          continue;
        }
        np0 = { x: newSrcX, y: newSrcY };
        np1 = { x: p3.x, y: newSrcY };
        np2 = { x: p3.x, y: p3.y };
      }

      // Degenerate: if np1 === np2, the "L" collapses to a straight line.
      // Accept it (even better than a 1-bend L), but keep it as 2 pts.
      const firstSegDegenerate = samePoint(np0, np1, EPS);
      const secondSegDegenerate = samePoint(np1, np2, EPS);
      if (firstSegDegenerate && secondSegDegenerate) {
        continue;
      }

      // Guard 3: no edge-node collisions. Seg 1 may touch src; seg 2 may
      // touch dst. Excluding those ids from the hit check.
      if (!firstSegDegenerate && segmentHitsAnyRect(np0, np1, realNodeRects, [srcId], 1)) {
        continue;
      }
      if (!secondSegDegenerate && segmentHitsAnyRect(np1, np2, realNodeRects, [dstId], 1)) {
        continue;
      }

      // Guard 5: label overlap is checked by anchorLabelsToPolyline which
      // runs AFTER this pass and re-anchors each label onto its owning
      // edge's polyline (with along-segment parametric retry from iter
      // 14). At this pipeline stage labels still sit at stale Sugiyama
      // positions so a label-rect check here would reject against
      // positions that will imminently be moved. If anchorLabelsToPolyline
      // cannot find any legal anchor on the rewritten polyline,
      // validateLayout's label-on-edge-segment invariant will flag it at
      // DDLT level 1. Deliberately not checked here.

      // Guards 2 + 4: check every other edge's every segment for a
      // perpendicular crossing or a collinear-axis overlap with EITHER
      // of the new segments.
      const firstSegConflicts =
        !firstSegDegenerate &&
        segmentConflictsWithAnyEdge(np0, np1, edges, edge, {
          epsilon: EPS,
          skipDegenerateOther: true,
        });
      const secondSegConflicts =
        !secondSegDegenerate &&
        segmentConflictsWithAnyEdge(np1, np2, edges, edge, {
          epsilon: EPS,
          skipDegenerateOther: true,
        });
      if (firstSegConflicts || secondSegConflicts) {
        continue;
      }

      // All guards pass. Build the final polyline.
      if (firstSegDegenerate) {
        newPts = [np1, np2];
      } else if (secondSegDegenerate) {
        newPts = [np0, np1];
      } else {
        newPts = [np0, np1, np2];
      }
      break;
    }

    if (newPts) {
      edge.points = newPts;
    }
  }
}
