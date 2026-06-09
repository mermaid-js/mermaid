/**
 * iter-42 — Rebuild pathologically long merged labelled edges.
 *
 * When the SAT shape picks port sides whose positions force a "wraparound"
 * polyline (e.g. USC.west → label (far west) → HKC.west, but USC is west
 * of HKC), the merged `-to-label` + `-from-label` polyline can exceed 10
 * bends. iter-39/40's `labelRelocationPass` returns null because the
 * builder requires a shared-coord L that the mixed-sign same-axis
 * configuration cannot produce.
 *
 * Trigger: merged labelled edge with bends \> `bendThresholdHigh` (default 8)
 * AND both endpoint ports on the same side (W/W, E/E, N/N, S/S) AND the
 * label anchor is on the opposite side of the port axis.
 *
 * Action: rebuild polyline using opposing ports (e.g. W/W → E/E for
 * horizontally separated nodes) as a 2-point straight or 3-point L.
 * Relocate the label to the midpoint of the new polyline. Bail if the
 * direct path intersects any non-endpoint obstacle.
 *
 * Paper anchor: NONE. Theory-agent analysis flagged post-routing port
 * swap as not paper-endorsed (Siebenhaller bend-stretching preserves
 * first/last directions; Wybrow nudging only moves non-end segments;
 * DOMUS shape-phase is one-way). Mermaid-calibration concession: the
 * alternative (re-run SAT with a forbidden-label clause) is heavy. Label
 * relocation after port swap is loosely analogous to Siebenhaller §5.6.
 */
import type { LayoutData } from '../../../types.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}
type Rect = ReturnType<typeof rectForNode>;
type Side = 'W' | 'E' | 'N' | 'S';

const AXIS_EPS = 0.5;

interface Options {
  /** Bend count above which the rebuild fires. Default 8. */
  bendThresholdHigh?: number;
  /**
   * iter-44 — port-normal stub length used to keep rebuilt polylines
   * Kandinsky-compliant (first/last segment parallel to port normal axis).
   * Clamped to [2, 20]. Default 10 (matches iter-11/iter-35 portStubs).
   */
  spacing?: number;
}

function normalX(side: Side): number {
  if (side === 'E') {
    return +1;
  }
  if (side === 'W') {
    return -1;
  }
  return 0;
}

function normalY(side: Side): number {
  if (side === 'S') {
    return +1;
  }
  if (side === 'N') {
    return -1;
  }
  return 0;
}

function classifySide(p: Point, rect: Rect): Side | null {
  if (Math.abs(p.x - rect.left) <= AXIS_EPS) {
    return 'W';
  }
  if (Math.abs(p.x - rect.right) <= AXIS_EPS) {
    return 'E';
  }
  if (Math.abs(p.y - rect.top) <= AXIS_EPS) {
    return 'N';
  }
  if (Math.abs(p.y - rect.bottom) <= AXIS_EPS) {
    return 'S';
  }
  return null;
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

function opposingSide(side: Side): Side {
  if (side === 'W') {
    return 'E';
  }
  if (side === 'E') {
    return 'W';
  }
  if (side === 'N') {
    return 'S';
  }
  return 'N';
}

function portOnSide(rect: Rect, side: Side, perp: number): Point {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  if (side === 'W') {
    return { x: rect.left, y: perp };
  }
  if (side === 'E') {
    return { x: rect.right, y: perp };
  }
  if (side === 'N') {
    return { x: perp, y: rect.top };
  }
  return { x: perp, y: rect.bottom };
  void cx;
  void cy;
}

function nodeCenter(rect: Rect): Point {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

function segmentsClear(pts: Point[], obstacles: Rect[]): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const r of obstacles) {
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], r)) {
        return false;
      }
    }
  }
  return true;
}

function isLabelBboxClear(
  cx: number,
  cy: number,
  lw: number,
  lh: number,
  allRects: Rect[]
): boolean {
  const hw = lw / 2;
  const hh = lh / 2;
  for (const r of allRects) {
    const overlapX = cx + hw > r.left && cx - hw < r.right;
    const overlapY = cy + hh > r.top && cy - hh < r.bottom;
    if (overlapX && overlapY) {
      return false;
    }
  }
  return true;
}

export function rebuildPathologicalLabelEdges(
  layout: LayoutData,
  opts: Options = {}
): { rebuilt: number } {
  const bendThresholdHigh = opts.bendThresholdHigh ?? 8;
  const stubLen = Math.max(2, Math.min(20, opts.spacing ?? 10));

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

  let rebuilt = 0;
  for (const edge of layout.edges ?? []) {
    const anchor = edge as { x?: unknown; y?: unknown; width?: number; height?: number };
    const pts = (edge as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const bends = countBends(pts);
    if (bends <= bendThresholdHigh) {
      continue;
    }
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      continue;
    }

    const startId =
      (edge as { start?: unknown }).start != null ? String((edge as any).start) : null;
    const endId = (edge as { end?: unknown }).end != null ? String((edge as any).end) : null;
    if (!startId || !endId) {
      continue;
    }
    const startRect = rectsById.get(startId);
    const endRect = rectsById.get(endId);
    if (!startRect || !endRect) {
      continue;
    }

    const p0 = pts[0];
    const pLast = pts[pts.length - 1];
    const startSide = classifySide(p0, startRect);
    const endSide = classifySide(pLast, endRect);
    if (!startSide || !endSide) {
      continue;
    }
    if (startSide !== endSide) {
      continue;
    }

    // Is the label on the OPPOSITE side of the port axis?
    const labelX = anchor.x as number;
    const labelY = anchor.y as number;
    const startC = nodeCenter(startRect);
    const endC = nodeCenter(endRect);
    let labelOnOpposite = false;
    if (startSide === 'W' || startSide === 'E') {
      // Ports exit horizontally. Label-opposite-side means label on the
      // opposite horizontal side (W label with E port, or E label with W
      // port) relative to the source node.
      if (startSide === 'W') {
        labelOnOpposite = labelX < startC.x - 20;
      } // label is further west
      else {
        labelOnOpposite = labelX > startC.x + 20;
      }
    } else {
      if (startSide === 'N') {
        labelOnOpposite = labelY < startC.y - 20;
      } else {
        labelOnOpposite = labelY > startC.y + 20;
      }
    }
    if (!labelOnOpposite) {
      continue;
    }

    // Source node relative to target: for W/W, we want target east of source
    // so E/E rebuild makes sense. For E/E, target west of source.
    const nodesHorizontallyApt =
      (startSide === 'W' && endC.x > startC.x) || (startSide === 'E' && endC.x < startC.x);
    const nodesVerticallyApt =
      (startSide === 'N' && endC.y > startC.y) || (startSide === 'S' && endC.y < startC.y);
    const horiz = startSide === 'W' || startSide === 'E';
    if (horiz && !nodesHorizontallyApt) {
      continue;
    }
    if (!horiz && !nodesVerticallyApt) {
      continue;
    }

    // Build opposing-side polyline.
    const newStartSide = opposingSide(startSide);
    const newPort0 = portOnSide(startRect, newStartSide, horiz ? startC.y : startC.x);
    const newPortLast = portOnSide(endRect, endSide, horiz ? endC.y : endC.x);

    // Candidate ordering (first obstacle-clear wins):
    //   1. Straight (2-point) when perpendicular coords match.
    //   2. iter-42 L-candidates (3-point, 2 bends): aesthetically minimal;
    //      may violate Kandinsky bend-or-end at one port but preferred when
    //      obstacle-clear and no validateLayout pass consumes the polyline.
    //   3. iter-44 Z-candidates (4-point, 2 bends): Kandinsky-compliant
    //      with vertical/horizontal column offset OUTSIDE both rects by
    //      `stubLen` along port normals.
    //   4. iter-44 6-point detours (4 bends) over/under or left/right of the
    //      obstacle band: Kandinsky-compliant port stubs at both ends.
    // Kandinsky invariant (Siebenhaller Def. 2.5, source 0fb2d84f): at ports
    // where the approach axis matters, first and last segments align with
    // port normal. iter-44 ensures the FALLBACK candidates are compliant so
    // that when iter-42 L's are blocked (render path on Company.mmd), the
    // rebuilt polyline no longer produces 6 validateLayout issues per edge.
    const candidates: Point[][] = [];
    const nxs = normalX(newStartSide);
    const nxe = normalX(endSide);
    const nys = normalY(newStartSide);
    const nye = normalY(endSide);

    const detourSpacing = 10;
    if (horiz) {
      if (Math.abs(newPort0.y - newPortLast.y) < 1e-3) {
        candidates.push([newPort0, newPortLast]);
      } else {
        // iter-42 L-candidates (2 bends; ports may hug target border on last segment).
        candidates.push([newPort0, { x: newPortLast.x, y: newPort0.y }, newPortLast]);
        candidates.push([newPort0, { x: newPort0.x, y: newPortLast.y }, newPortLast]);
      }
      // iter-44 Kandinsky Z-candidates (4-point, 2 bends, first/last seg
      // horizontal). Vertical columns offset OUTWARD from port by stubLen so
      // neither column hugs the source/target border.
      const xColStart = newPort0.x + nxs * stubLen;
      const xColEnd = newPortLast.x + nxe * stubLen;
      for (const xMid of [(xColStart + xColEnd) / 2, xColStart, xColEnd]) {
        candidates.push([
          newPort0,
          { x: xMid, y: newPort0.y },
          { x: xMid, y: newPortLast.y },
          newPortLast,
        ]);
      }
      // iter-44 Kandinsky 6-point detours (4 bends; first/last seg horizontal,
      // no border hug). Columns offset outward by stubLen — satisfies
      // Siebenhaller Def. 2.5 bend-or-end. Chosen over iter-42's port-column
      // detour because iter-42's version hugs source/target borders and
      // violates port-direction-mismatch on both ends.
      const yAbove1 = startRect.top - detourSpacing;
      const yAbove2 = endRect.top - detourSpacing;
      const yBelow1 = startRect.bottom + detourSpacing;
      const yBelow2 = endRect.bottom + detourSpacing;
      for (const yMid of [
        yAbove1,
        yAbove2,
        yBelow1,
        yBelow2,
        Math.min(yAbove1, yAbove2),
        Math.max(yBelow1, yBelow2),
      ]) {
        candidates.push([
          newPort0,
          { x: xColStart, y: newPort0.y },
          { x: xColStart, y: yMid },
          { x: xColEnd, y: yMid },
          { x: xColEnd, y: newPortLast.y },
          newPortLast,
        ]);
      }
    } else {
      if (Math.abs(newPort0.x - newPortLast.x) < 1e-3) {
        candidates.push([newPort0, newPortLast]);
      } else {
        candidates.push([newPort0, { x: newPortLast.x, y: newPort0.y }, newPortLast]);
        candidates.push([newPort0, { x: newPort0.x, y: newPortLast.y }, newPortLast]);
      }
      // iter-44 Kandinsky candidates for vertical (N/S) ports: mirror of
      // horizontal. Rows offset outward by stubLen; first/last seg vertical.
      const yRowStart = newPort0.y + nys * stubLen;
      const yRowEnd = newPortLast.y + nye * stubLen;
      for (const yMid of [(yRowStart + yRowEnd) / 2, yRowStart, yRowEnd]) {
        candidates.push([
          newPort0,
          { x: newPort0.x, y: yMid },
          { x: newPortLast.x, y: yMid },
          newPortLast,
        ]);
      }
      const xLeft1 = startRect.left - detourSpacing;
      const xLeft2 = endRect.left - detourSpacing;
      const xRight1 = startRect.right + detourSpacing;
      const xRight2 = endRect.right + detourSpacing;
      for (const xMid of [
        xLeft1,
        xLeft2,
        xRight1,
        xRight2,
        Math.min(xLeft1, xLeft2),
        Math.max(xRight1, xRight2),
      ]) {
        candidates.push([
          newPort0,
          { x: newPort0.x, y: yRowStart },
          { x: xMid, y: yRowStart },
          { x: xMid, y: yRowEnd },
          { x: newPortLast.x, y: yRowEnd },
          newPortLast,
        ]);
      }
    }

    const otherObstacles: Rect[] = [];
    for (const [id, r] of rectsById) {
      if (id === startId || id === endId) {
        continue;
      }
      otherObstacles.push(r);
    }

    // Pick the first clean candidate (lowest bend count first).
    let winner: Point[] | null = null;
    for (const c of candidates) {
      if (segmentsClear(c, otherObstacles)) {
        winner = c;
        break;
      }
    }
    if (!winner) {
      continue;
    }

    // Relocate label to midpoint of longest internal segment of the new
    // polyline. Fall back to midpoint of the entire path for 2-point.
    let midX: number;
    let midY: number;
    if (winner.length === 2) {
      midX = (winner[0].x + winner[1].x) / 2;
      midY = (winner[0].y + winner[1].y) / 2;
    } else {
      // Pick longest internal segment, skipping port-adjacent stub segments
      // (first and last segments) so the label sits on the crossing, not on a
      // short Kandinsky stub. For a 4-point Z the only internal segment is
      // seg 1; for a 6-point detour internals are segs 1, 2, 3.
      const firstInternalIdx = winner.length >= 4 ? 1 : 0;
      const lastInternalIdx = winner.length >= 4 ? winner.length - 3 : winner.length - 2;
      let bestIdx = firstInternalIdx;
      let bestLen = 0;
      for (let i = firstInternalIdx; i <= lastInternalIdx; i++) {
        const len =
          Math.abs(winner[i].x - winner[i + 1].x) + Math.abs(winner[i].y - winner[i + 1].y);
        if (len > bestLen) {
          bestLen = len;
          bestIdx = i;
        }
      }
      midX = (winner[bestIdx].x + winner[bestIdx + 1].x) / 2;
      midY = (winner[bestIdx].y + winner[bestIdx + 1].y) / 2;
    }
    const lw = Number.isFinite(anchor.width) ? anchor.width! : 0;
    const lh = Number.isFinite(anchor.height) ? anchor.height! : 0;
    const allRects: Rect[] = [...rectsById.values()];

    // Rebuild polyline unconditionally; only relocate label if its bbox is
    // clear on the new path. The old label position stays visible if not
    // clear (deliberate: much better routing still wins even if label
    // anchor gets visually disconnected — the alternative is a 14-bend
    // snake where the label still doesn't sit on the path anyway).
    (edge as { points: Point[] }).points = winner;
    if (isLabelBboxClear(midX, midY, lw, lh, allRects)) {
      (edge as { x: number }).x = midX;
      (edge as { y: number }).y = midY;
    }
    rebuilt++;
  }
  return { rebuilt };
}
