// cspell:ignore Hegemann Kandinsky Siebenhaller
import type { Edge, Node } from '../../../types.js';
import {
  classifyThreeSegmentRoute,
  collectRealNodeBounds,
  getNodePairGeometry,
  segmentConflictsWithAnyEdge,
  segmentHitsAnyRect,
} from './geometry.js';

const EPS = 1e-6;
const MIN_PORT_SPACING = 8;
const PORT_SHIFT = MIN_PORT_SPACING / 2;
const LABEL_CLEARANCE_BUFFER = 3;

interface PointLite {
  x: number;
  y: number;
}

interface LabelDim {
  w: number;
  h: number;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

/**
 * Iter 12 — co-route sibling straight-line rescue.
 *
 * Fires only on the narrow "4-point U-detour around a collinear blocker
 * where the obvious straight line is geometrically clear" shape. For each
 * eligible edge, shifts the source and destination attach points by
 * MIN_PORT_SPACING/2 along the shared face and replaces the polyline
 * with a 2-point straight line. The shift direction is chosen by trying
 * both +delta and -delta and picking whichever doesn't introduce a new
 * edge crossing or leave the node's face span.
 *
 * Paper backing: Hegemann & Wolff "On the smoothing of orthogonal
 * connector layouts" (NotebookLM src b65b3d45) §4.2 / Fig. 11 —
 * joint-feasibility via port distribution rather than face exclusion.
 * Mermaid-specific narrowing: we only rescue the exact 4-point shape to
 * minimize blast radius.
 */
export function straightenCollinearSiblingDetours(edges: Edge[], nodes: Node[]): void {
  const { nodeInfoById, realNodeRects } = collectRealNodeBounds(nodes);
  // Side table of label-node dimensions so we can grow the rescue delta
  // far enough to clear a label sitting on the sibling line.
  const labelDimById = new Map<string, LabelDim>();
  for (const n of nodes) {
    const id = n.id;
    if (n.isGroup) {
      continue;
    }
    if (n.isEdgeLabel) {
      labelDimById.set(id, {
        w: n.width ?? 0,
        h: n.height ?? 0,
      });
      continue;
    }
  }

  // For a given (this-edge, axis) pair, find the largest label half-extent
  // among any edge sharing the same node pair (anti-parallel siblings) plus
  // this edge's own label. Used to grow the rescue shift past the label so
  // anchorLabelsToPolyline can place the label clear of the sibling.
  const labelClearanceFor = (
    thisEdge: Edge,
    thisSrcId: string,
    thisDstId: string,
    axis: 'x' | 'y'
  ): number => {
    const targetPair = pairKey(thisSrcId, thisDstId);
    let maxHalf = 0;
    const consider = (labelId: string | undefined) => {
      if (!labelId) {
        return;
      }
      const dim = labelDimById.get(labelId);
      if (!dim) {
        return;
      }
      const half = axis === 'x' ? dim.w / 2 : dim.h / 2;
      if (half > maxHalf) {
        maxHalf = half;
      }
    };
    consider(thisEdge.labelNodeId);
    for (const other of edges) {
      if (other === thisEdge) {
        continue;
      }
      if (other.isLayoutOnly) {
        continue;
      }
      const oSrc = other.start;
      const oDst = other.end;
      if (!oSrc || !oDst) {
        continue;
      }
      if (pairKey(oSrc, oDst) !== targetPair) {
        continue;
      }
      consider(other.labelNodeId);
    }
    return maxHalf > 0 ? maxHalf + LABEL_CLEARANCE_BUFFER : 0;
  };

  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const pts = edge.points;
    if (!classifyThreeSegmentRoute(pts, EPS)) {
      continue;
    }

    const nodePair = getNodePairGeometry(edge, nodeInfoById, EPS);
    if (!nodePair) {
      continue;
    }
    const { srcId, dstId, srcInfo, dstInfo, collinearX, collinearY } = nodePair;
    if (collinearX === collinearY) {
      continue;
    }

    let targetSrc: PointLite;
    let targetDst: PointLite;
    if (collinearX) {
      const dstBelow = dstInfo.cy > srcInfo.cy;
      targetSrc = { x: srcInfo.cx, y: dstBelow ? srcInfo.rect.bottom : srcInfo.rect.top };
      targetDst = { x: dstInfo.cx, y: dstBelow ? dstInfo.rect.top : dstInfo.rect.bottom };
    } else {
      const dstEast = dstInfo.cx > srcInfo.cx;
      targetSrc = { x: dstEast ? srcInfo.rect.right : srcInfo.rect.left, y: srcInfo.cy };
      targetDst = { x: dstEast ? dstInfo.rect.left : dstInfo.rect.right, y: dstInfo.cy };
    }

    if (segmentHitsAnyRect(targetSrc, targetDst, realNodeRects, [srcId, dstId], 1)) {
      continue;
    }

    // The rescue moves the line perpendicular to its own direction: a
    // horizontal rescued line shifts in y (so the label HEIGHT determines
    // clearance), a vertical one shifts in x (label WIDTH). collinearX
    // means the rescued line is vertical (nodes share a column).
    //
    // When the edge (or an anti-parallel sibling) carries a label, the
    // small PORT_SHIFT would leave the rescued straight inside the label's
    // bbox — the label would visually overlap this line. We grow the
    // shift to clear the label rect. If the wider shift won't fit on the
    // node face, the bounds check below rejects it and we fall through
    // without rescuing, which keeps the original 4-point detour — also
    // correct, since the detour routes far away from the label.
    const shiftAxis: 'x' | 'y' = collinearX ? 'x' : 'y';
    const labelShift = labelClearanceFor(edge, srcId, dstId, shiftAxis);
    const effectiveShift = labelShift > PORT_SHIFT ? labelShift : PORT_SHIFT;
    const deltas = [0, effectiveShift, -effectiveShift];
    for (const delta of deltas) {
      const shiftedSrc = { ...targetSrc };
      const shiftedDst = { ...targetDst };
      if (collinearX) {
        shiftedSrc.x += delta;
        shiftedDst.x += delta;
        if (shiftedSrc.x <= srcInfo.rect.left || shiftedSrc.x >= srcInfo.rect.right) {
          continue;
        }
        if (shiftedDst.x <= dstInfo.rect.left || shiftedDst.x >= dstInfo.rect.right) {
          continue;
        }
      } else {
        shiftedSrc.y += delta;
        shiftedDst.y += delta;
        if (shiftedSrc.y <= srcInfo.rect.top || shiftedSrc.y >= srcInfo.rect.bottom) {
          continue;
        }
        if (shiftedDst.y <= dstInfo.rect.top || shiftedDst.y >= dstInfo.rect.bottom) {
          continue;
        }
      }

      if (segmentHitsAnyRect(shiftedSrc, shiftedDst, realNodeRects, [srcId, dstId], 1)) {
        continue;
      }

      if (segmentConflictsWithAnyEdge(shiftedSrc, shiftedDst, edges, edge, { epsilon: EPS })) {
        continue;
      }

      edge.points = [shiftedSrc, shiftedDst];
      break;
    }
  }
}
