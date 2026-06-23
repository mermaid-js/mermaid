// cspell:ignore Helmers Wybrow
import type { Edge, Node } from '../../../types.js';
import {
  inflateRect,
  rectContainsRect,
  rectFromCenterSize,
  rectOfNodeBounds,
  rectsOverlap,
  segmentBoundsOverlapRect,
} from './geometry.js';
import type { RectBounds } from './geometry.js';

const EPS = 1e-3;

export function anchorLabelsToPolyline(edges: Edge[], nodeByIdMap: Map<string, Node>): void {
  // Build a set of foreign polylines once for overlap checks. Labelled
  // originals that haven't been anchored yet are still included — their
  // polylines exist, even if their labels haven't moved.
  type RectLite = RectBounds;
  interface SegmentLite {
    edgeId: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  }
  const allEdgeSegments: SegmentLite[] = [];
  for (const other of edges) {
    if (other.isLayoutOnly) {
      continue;
    }
    const pts = other.points;
    if (!pts || pts.length < 2) {
      continue;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      allEdgeSegments.push({ edgeId: other.id, p1: pts[i], p2: pts[i + 1] });
    }
  }

  const foreignNodeRects: { nodeId: string; rect: RectLite }[] = [];
  // Collect top-level lane groups so we can re-assign a label's parentId to
  // whichever lane geometrically contains its anchored position. Without
  // this, labels whose anchor crosses a lane boundary are reported as
  // node-overlap violations against sibling lane groups.
  const laneGroups: { id: string; rect: RectLite }[] = [];
  for (const n of nodeByIdMap.values()) {
    const isGroup = n.isGroup;
    const parentId = n.parentId;
    if (isGroup && !parentId) {
      const rect = rectOfNodeBounds(n);
      if (rect) {
        laneGroups.push({
          id: n.id,
          rect,
        });
      }
      continue;
    }
    if (isGroup) {
      continue;
    }
    if (n.isEdgeLabel) {
      continue;
    }
    const rect = rectOfNodeBounds(n);
    if (!rect) {
      continue;
    }
    foreignNodeRects.push({
      nodeId: n.id,
      rect,
    });
  }

  // Inflation margin for foreign-edge / foreign-node proximity. The layout
  // validator's `edge-border-hugging` check fires when a polyline runs
  // within ~2u of a label's visual border (EPS_BORDER). Inflate the label
  // rect we test by a little more than that when rejecting candidates, so
  // no chosen placement will trigger the hug check. 3u preserves the buffer
  // used by the old pre-label detour pass.
  const LABEL_PLACEMENT_BUFFER = 3;

  const labelOverlapsAnything = (labelId: string, edgeId: string, rect: RectLite): boolean => {
    const buffered = inflateRect(rect, LABEL_PLACEMENT_BUFFER);
    for (const { nodeId, rect: nr } of foreignNodeRects) {
      if (nodeId === labelId) {
        continue;
      }
      if (rectsOverlap(buffered, nr)) {
        return true;
      }
    }
    for (const s of allEdgeSegments) {
      if (s.edgeId === edgeId) {
        continue;
      }
      if (segmentBoundsOverlapRect(s.p1, s.p2, buffered)) {
        return true;
      }
    }
    return false;
  };

  const placedLabelRects: { labelId: string; rect: RectLite }[] = [];

  const findContainingLane = (rect: RectLite): string | undefined => {
    for (const { id, rect: laneRect } of laneGroups) {
      if (rectContainsRect(laneRect, rect)) {
        return id;
      }
    }
    return undefined;
  };

  const overlapsPlacedLabel = (labelId: string, rect: RectLite): boolean =>
    placedLabelRects.some(
      (placed) => placed.labelId !== labelId && rectsOverlap(rect, placed.rect)
    );

  interface SegmentCandidate {
    idx: number;
    length: number;
    orientation: 'horizontal' | 'vertical';
    midX: number;
    midY: number;
  }

  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const labelId = edge.labelNodeId;
    if (!labelId) {
      continue;
    }
    const labelNode = nodeByIdMap.get(labelId);
    if (!labelNode) {
      continue;
    }
    const pts = edge.points;
    if (!pts || pts.length < 2) {
      continue;
    }
    const lw = labelNode.width ?? 0;
    const lh = labelNode.height ?? 0;
    if (lw <= 0 || lh <= 0) {
      continue;
    }

    // Collect every non-zero segment with orientation.
    const segments: SegmentCandidate[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      if (dx < EPS && dy < EPS) {
        continue;
      }
      if (dx >= EPS && dy >= EPS) {
        continue; // non-orthogonal — should not happen post-orthogonalize
      }
      segments.push({
        idx: i,
        length: dx + dy,
        orientation: dx >= EPS ? 'horizontal' : 'vertical',
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      });
    }

    if (segments.length === 0) {
      continue;
    }

    // §118: middle segments only (exclude first and last). Fall back to
    // any segment if the polyline has fewer than 3 segments (the paper is
    // silent on degenerate cases — Mermaid calibration).
    const middleSegments =
      segments.length >= 3
        ? segments.filter((s) => s.idx > 0 && s.idx < segments.length - 1)
        : segments;
    const poolBase = middleSegments.length > 0 ? middleSegments : segments;

    // Label long axis: horizontal if wider than tall, else vertical. The
    // label is drawn horizontally inside its bbox regardless, so the long
    // axis only drives preference, not hard filtering.
    const labelLongAxis: 'horizontal' | 'vertical' = lw >= lh ? 'horizontal' : 'vertical';

    // Candidate ranking: (a) length >= labelExtent + 2, (b) orientation
    // matching label long axis preferred, (c) longest tie-break.
    const rankSegments = (pool: SegmentCandidate[]): SegmentCandidate[] => {
      return [...pool].sort((a, b) => {
        const aFits = a.length >= (a.orientation === 'horizontal' ? lw : lh) + 2;
        const bFits = b.length >= (b.orientation === 'horizontal' ? lw : lh) + 2;
        if (aFits !== bFits) {
          return aFits ? -1 : 1;
        }
        const aLongAxis = a.orientation === labelLongAxis;
        const bLongAxis = b.orientation === labelLongAxis;
        if (aLongAxis !== bLongAxis) {
          return aLongAxis ? -1 : 1;
        }
        return b.length - a.length;
      });
    };

    // Try the middle-segment pool first (§118), then expand to include
    // every orthogonal segment if the middle-only pool yields no
    // lane-containing, overlap-free candidate. The "any segment" expansion
    // is a Mermaid-specific adaptation for cross-lane edges whose only
    // middle segment is the vertical lane-crossing leg (which by
    // construction straddles a lane boundary and cannot host the label).
    //
    // Per-segment, if the midpoint (t=0.5) collides with a foreign edge
    // or label, walk along the segment at additional parametric positions
    // t ∈ {0.25, 0.75, 0.15, 0.85} before moving on. Helmers diss.pdf
    // §118 requires "one of e's middle segments" but is silent on the
    // exact anchor position along that segment, so along-segment shift is
    // consistent with the paper (Mermaid adaptation). Paper-adjacent to
    // Wybrow-Marriott alley-midpoint centering (src `e8804c93`), which
    // picks the placement with widest clearance to foreign geometry.
    const ALONG_SEGMENT_TS = [0.5, 0.25, 0.75, 0.15, 0.85];
    const anchorAtT = (seg: SegmentCandidate, t: number): { midX: number; midY: number } => {
      const a = pts[seg.idx];
      const b = pts[seg.idx + 1];
      return {
        midX: a.x + (b.x - a.x) * t,
        midY: a.y + (b.y - a.y) * t,
      };
    };
    const tryPool = (
      pool: SegmentCandidate[]
    ): { laneId: string; anchor: { midX: number; midY: number } } | undefined => {
      const rankedPool = rankSegments(pool);
      for (const seg of rankedPool) {
        for (const t of ALONG_SEGMENT_TS) {
          const anchor = anchorAtT(seg, t);
          const rect = rectFromCenterSize(anchor.midX, anchor.midY, lw, lh);
          const laneId = findContainingLane(rect);
          if (!laneId) {
            continue;
          }
          if (overlapsPlacedLabel(labelId, rect)) {
            continue;
          }
          if (!labelOverlapsAnything(labelId, edge.id, rect)) {
            return { laneId, anchor };
          }
        }
      }
      return undefined;
    };

    const findLaneContainingFallback = (
      pool: SegmentCandidate[]
    ): { laneId: string; anchor: { midX: number; midY: number } } | undefined => {
      const rankedPool = rankSegments(pool);
      for (const seg of rankedPool) {
        const rect = rectFromCenterSize(seg.midX, seg.midY, lw, lh);
        const laneId = findContainingLane(rect);
        if (laneId && !overlapsPlacedLabel(labelId, rect)) {
          return { laneId, anchor: { midX: seg.midX, midY: seg.midY } };
        }
      }
      return undefined;
    };

    const chosen =
      tryPool(poolBase) ??
      (poolBase.length < segments.length ? tryPool(segments) : undefined) ??
      findLaneContainingFallback(segments);

    if (chosen) {
      labelNode.x = chosen.anchor.midX;
      labelNode.y = chosen.anchor.midY;
      labelNode.parentId = chosen.laneId;
      const chosenRect = rectFromCenterSize(chosen.anchor.midX, chosen.anchor.midY, lw, lh);
      const priorIdx = placedLabelRects.findIndex((placed) => placed.labelId === labelId);
      if (priorIdx >= 0) {
        placedLabelRects[priorIdx] = { labelId, rect: chosenRect };
      } else {
        placedLabelRects.push({ labelId, rect: chosenRect });
      }
    }
  }
}
