// cspell:ignore Hegemann Wybrow penult
import {
  collectNodeRectEntries,
  dedupeConsecutivePoints,
  isHorizontalSegment,
  isVerticalSegment,
  orthogonalSegmentsStrictlyCross as segmentsCross,
  pointInsideRect,
  rectOfNodeBounds,
  sameX,
  sameY,
  segmentHitsAnyRect,
} from './geometry.js';
import type { Point } from './geometry.js';

/**
 * Iter 16 — collapse a short terminal stub at an edge's destination by
 * retargeting the destination face and dropping the corner. See the call-
 * site comment in `applySwimlaneDirectionTransform` for the user report and
 * paper backing (Siebenhaller `21f7ca55`; precedent in the retired
 * stale-port-offset straightener, Hegemann-Wolff `b65b3d45`).
 *
 * Shape handled:
 *   ... → prev → penult → end
 *                ~~~~~~~~~~~~~
 *                penult perpendicular to last; `|end - penult| < MIN_STUB`.
 *
 * Rewrite:
 *   ... → prev' → end'
 *   where prev' keeps prev's "far" coordinate and adopts the destination's
 *   face-center on the other axis, and end' is the destination face-center
 *   on the approach axis (i.e. bottom/top when penult is vertical;
 *   left/right when penult is horizontal — face chosen opposite to the
 *   approach direction).
 *
 * Safety:
 *   - Reject when the new prev'→end' segment would enter any real-node
 *     rect (excluding the dst itself), any label rect, or cross an
 *     existing segment of a different edge (excluding its own segments).
 *   - Reject when the new prev' lies inside the src node's rect.
 *   - Only applied to the dst end; applying symmetrically on src
 *     would need identical safety accounting and is out of scope here.
 */
export function collapseShortTerminalStub(edges: any[], nodeByIdMap: Map<string, any>): void {
  const MIN_STUB = 10;
  const EPS_LOCAL = 1e-3;
  const BUFFER = 2;

  type PointLite = Point;

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );

  for (const edge of edges) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const rawPts = (edge as { points?: PointLite[] }).points;
    if (!rawPts || rawPts.length < 4) {
      continue;
    }

    // Dedupe consecutive equal points so we measure the real last segment.
    const pts = dedupeConsecutivePoints(rawPts, EPS_LOCAL);
    if (pts.length < 4) {
      continue;
    }

    const nLast = pts.length - 1;
    const endPt = pts[nLast];
    const penultPt = pts[nLast - 1];
    const prevPt = pts[nLast - 2];

    // Last segment (penult → end): must be short.
    const lastDx = endPt.x - penultPt.x;
    const lastDy = endPt.y - penultPt.y;
    const lastLen = Math.hypot(lastDx, lastDy);
    if (lastLen >= MIN_STUB || lastLen < EPS_LOCAL) {
      continue;
    }

    // Penult segment (prev → penult): must be non-degenerate and
    // perpendicular to last.
    const penultDx = penultPt.x - prevPt.x;
    const penultDy = penultPt.y - prevPt.y;
    const penultLen = Math.hypot(penultDx, penultDy);
    if (penultLen < EPS_LOCAL) {
      continue;
    }

    const lastIsHoriz = isHorizontalSegment(penultPt, endPt, EPS_LOCAL);
    const lastIsVert = isVerticalSegment(penultPt, endPt, EPS_LOCAL);
    const penultIsHoriz = isHorizontalSegment(prevPt, penultPt, EPS_LOCAL);
    const penultIsVert = isVerticalSegment(prevPt, penultPt, EPS_LOCAL);
    if (!((lastIsHoriz && penultIsVert) || (lastIsVert && penultIsHoriz))) {
      continue;
    }

    const dstId = (edge as { end?: string }).end;
    const srcId = (edge as { start?: string }).start;
    const dst = dstId ? nodeByIdMap.get(dstId) : undefined;
    if (!dst) {
      continue;
    }
    const dstCx = (dst as { x?: number }).x ?? 0;
    const dstCy = (dst as { y?: number }).y ?? 0;
    const dstRect = rectOfNodeBounds(dst);
    if (!dstRect) {
      continue;
    }

    // Compute the new prev' and end'. The axis of approach is the
    // penult segment's axis; the new face is on the perpendicular to
    // the approach, opposite to the approach direction.
    let newPrev: { x: number; y: number };
    let newEnd: { x: number; y: number };
    if (penultIsVert) {
      // Vertical approach: penult goes up (penultDy<0) or down (penultDy>0).
      const approachFromBelow = penultDy < 0;
      newPrev = { x: dstCx, y: prevPt.y };
      newEnd = { x: dstCx, y: approachFromBelow ? dstRect.bottom : dstRect.top };
    } else {
      // Horizontal approach: penult goes right (penultDx>0) or left.
      const approachFromLeft = penultDx > 0;
      newPrev = { x: prevPt.x, y: dstCy };
      newEnd = { x: approachFromLeft ? dstRect.right : dstRect.left, y: dstCy };
    }

    // Reject if the new prev'→end' vertical/horizontal segment would cross
    // any real-node rect (other than dst itself).
    if (segmentHitsAnyRect(newPrev, newEnd, realNodeRects, dstId ? [dstId] : [], -BUFFER)) {
      continue;
    }

    // Reject if the new approach segment would run through any label rect.
    if (segmentHitsAnyRect(newPrev, newEnd, labelRects, [], -BUFFER)) {
      continue;
    }

    // Reject if new prev' lies inside the src node's rect (pathological).
    if (srcId) {
      const src = nodeByIdMap.get(srcId);
      const srcRect = src ? rectOfNodeBounds(src) : undefined;
      if (srcRect && pointInsideRect(newPrev, srcRect, BUFFER)) {
        continue;
      }
    }

    // Also reject if the new prev'→end' segment crosses any other edge's
    // existing segment (excluding our own segments we're about to replace).
    const ownSegmentKey = (a: PointLite, b: PointLite) =>
      `${a.x.toFixed(3)},${a.y.toFixed(3)}|${b.x.toFixed(3)},${b.y.toFixed(3)}`;
    const selfSegments = new Set<string>();
    for (let i = 0; i < pts.length - 1; i++) {
      selfSegments.add(ownSegmentKey(pts[i], pts[i + 1]));
    }

    const segmentCrossesOtherEdge = (from: PointLite, to: PointLite): boolean => {
      for (const other of edges) {
        if (other === edge) {
          continue;
        }
        if ((other as { isLayoutOnly?: boolean }).isLayoutOnly) {
          continue;
        }
        const oPts = (other as { points?: PointLite[] }).points;
        if (!oPts || oPts.length < 2) {
          continue;
        }
        for (let i = 0; i < oPts.length - 1; i++) {
          const a = oPts[i];
          const b = oPts[i + 1];
          if (selfSegments.has(ownSegmentKey(a, b))) {
            continue;
          }
          if (segmentsCross(from, to, a, b, EPS_LOCAL)) {
            return true;
          }
        }
      }
      return false;
    };

    if (segmentCrossesOtherEdge(newPrev, newEnd)) {
      continue;
    }

    // Also: if the new prev' segment (from prev-before-prev to newPrev) is
    // degenerate or crosses anything, reject. The segment before the
    // original prev (pts[nLast-3] → prev) becomes (pts[nLast-3] → newPrev)
    // when we shift prev's axis.
    if (nLast - 3 >= 0) {
      const beforePrev = pts[nLast - 3];
      // The pre-existing segment was beforePrev → prev on the axis perpendicular
      // to penult. Shifting prev to newPrev preserves that axis alignment
      // (only the axis we're shifting changes). Re-check for obstacles on
      // the NEW extended segment.
      const endpointIds = [srcId, dstId].filter((id): id is string => Boolean(id));
      if (segmentHitsAnyRect(beforePrev, newPrev, realNodeRects, endpointIds, -BUFFER)) {
        continue;
      }
      if (segmentCrossesOtherEdge(beforePrev, newPrev)) {
        continue;
      }
    }

    // Build rewritten polyline: pts[0..nLast-3] + newPrev + newEnd.
    // This drops the original prev, penult, and end; replaces with newPrev
    // and newEnd (one fewer bend).
    const head = pts.slice(0, nLast - 2);
    const newPts = [...head, newPrev, newEnd];
    (edge as { points: PointLite[] }).points = newPts;

    // Re-anchor the edge's label (if any) onto the new polyline. The
    // original anchorLabelsToPolyline pass ran earlier in the pipeline
    // and placed the label against the old geometry; validateLayout
    // requires the polyline to pass through its label node. Place the
    // label at the midpoint of the longest segment of the new polyline
    // whose orientation matches the label's aspect.
    const labelId = (edge as { labelNodeId?: string }).labelNodeId;
    if (labelId) {
      const labelNode = nodeByIdMap.get(labelId);
      if (labelNode) {
        const lw = (labelNode as { width?: number }).width ?? 0;
        const lh = (labelNode as { height?: number }).height ?? 0;
        if (lw > 0 && lh > 0) {
          // Find longest segment — use its midpoint. Prefer axis-aligned
          // segments whose length >= the label's corresponding dim so
          // the label fits inside the segment's bounding run.
          let bestMidX: number | undefined;
          let bestMidY: number | undefined;
          let bestLen = -1;
          for (let i = 0; i < newPts.length - 1; i++) {
            const a = newPts[i];
            const b = newPts[i + 1];
            const segLen = Math.hypot(b.x - a.x, b.y - a.y);
            const isHoriz = sameY(a, b, EPS_LOCAL);
            const isVert = sameX(a, b, EPS_LOCAL);
            // Require axis-aligned and long enough to hold the label.
            const fits = (isHoriz && segLen >= lw + 2) || (isVert && segLen >= lh + 2);
            if (!fits) {
              continue;
            }
            if (segLen > bestLen) {
              bestLen = segLen;
              bestMidX = (a.x + b.x) / 2;
              bestMidY = (a.y + b.y) / 2;
            }
          }
          if (bestMidX !== undefined && bestMidY !== undefined) {
            (labelNode as { x: number }).x = bestMidX;
            (labelNode as { y: number }).y = bestMidY;
          }
        }
      }
    }
  }
}
