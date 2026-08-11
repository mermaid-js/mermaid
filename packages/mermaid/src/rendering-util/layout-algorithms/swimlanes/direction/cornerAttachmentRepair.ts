import { rectOfNodeBounds } from './geometry.js';
import type { Point, RectBounds } from './geometry.js';

const EPS = 1e-3;
/** validateLayout flags attachments whose corner distance is 3 or less (EPS_CORNER). */
const FLAG_DISTANCE = 5;
/** Repaired attachments end up at least this far from the nearest corner. */
const CORNER_MARGIN = 6;
/** Minimum clearance to keep from sibling attachments on the same side. */
const SIBLING_CLEARANCE = 6;

type SideAxis = 'vertical' | 'horizontal';

interface Attachment {
  side: SideAxis;
  /** Coordinate along the side (y for vertical sides, x for horizontal). */
  along: number;
  lo: number;
  hi: number;
}

function attachmentFor(p: Point, r: RectBounds): Attachment | null {
  const onLeft = Math.abs(p.x - r.left) <= EPS;
  const onRight = Math.abs(p.x - r.right) <= EPS;
  const onTop = Math.abs(p.y - r.top) <= EPS;
  const onBottom = Math.abs(p.y - r.bottom) <= EPS;
  if ((onLeft || onRight) && p.y >= r.top - EPS && p.y <= r.bottom + EPS) {
    return { side: 'vertical', along: p.y, lo: r.top, hi: r.bottom };
  }
  if ((onTop || onBottom) && p.x >= r.left - EPS && p.x <= r.right + EPS) {
    return { side: 'horizontal', along: p.x, lo: r.left, hi: r.right };
  }
  return null;
}

/**
 * Slide edge attachment points that sit within `FLAG_DISTANCE` of a node
 * corner inboard along their side (validateLayout: `edge-corner-connection`,
 * threshold 3). The terminal rail — every consecutive point sharing the
 * endpoint's cross-axis coordinate — moves with the endpoint so the polyline
 * stays orthogonal. The shift is skipped when the side is too short, when a
 * sibling attachment on the same node side would end up closer than
 * `SIBLING_CLEARANCE`, or when the rail's far end is itself a terminal
 * attachment that the shift would push out of its own side's safe range.
 */
export function repairCornerAttachments(edges: any[], nodeByIdMap: Map<string, any>): void {
  for (const edge of edges) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    for (const atStart of [true, false]) {
      const pts = (edge as { points?: Point[] }).points;
      if (!pts || pts.length < 2) {
        continue;
      }
      const nodeId = atStart
        ? String((edge as { start?: string }).start ?? '')
        : String((edge as { end?: string }).end ?? '');
      const node = nodeByIdMap.get(nodeId);
      if (!node || (node as { isGroup?: boolean }).isGroup) {
        continue;
      }
      const r = rectOfNodeBounds(node);
      if (!r) {
        continue;
      }
      const endpoint = atStart ? pts[0] : pts[pts.length - 1];
      const att = attachmentFor(endpoint, r);
      if (!att) {
        continue;
      }
      const cornerDist = Math.min(att.along - att.lo, att.hi - att.along);
      if (cornerDist > FLAG_DISTANCE) {
        continue;
      }
      const sideLength = att.hi - att.lo;
      if (sideLength < 2 * CORNER_MARGIN) {
        continue;
      }
      const target =
        att.along - att.lo <= att.hi - att.along ? att.lo + CORNER_MARGIN : att.hi - CORNER_MARGIN;
      const delta = target - att.along;
      if (Math.abs(delta) <= EPS) {
        continue;
      }

      // The terminal rail: consecutive points sharing the endpoint's
      // cross-axis coordinate (y for vertical-side attach, x for horizontal).
      const railIdxs: number[] = [];
      const idxOrder = atStart ? [...pts.keys()] : [...pts.keys()].reverse();
      for (const i of idxOrder) {
        const same =
          att.side === 'vertical'
            ? Math.abs(pts[i].y - endpoint.y) <= EPS
            : Math.abs(pts[i].x - endpoint.x) <= EPS;
        if (!same) {
          break;
        }
        railIdxs.push(i);
      }
      if (railIdxs.length === 0) {
        continue;
      }

      // If the rail spans the whole polyline, the far end is also a terminal
      // attachment — verify the shift keeps it inside ITS side's safe range.
      if (railIdxs.length === pts.length) {
        const farNodeId = atStart
          ? String((edge as { end?: string }).end ?? '')
          : String((edge as { start?: string }).start ?? '');
        const farNode = nodeByIdMap.get(farNodeId);
        if (!farNode) {
          continue;
        }
        const fr = rectOfNodeBounds(farNode);
        if (!fr) {
          continue;
        }
        const farEndpoint = atStart ? pts[pts.length - 1] : pts[0];
        const farAtt = attachmentFor(farEndpoint, fr);
        if (!farAtt || farAtt.side !== att.side) {
          continue;
        }
        const farAfter = farAtt.along + delta;
        if (farAfter < farAtt.lo + CORNER_MARGIN || farAfter > farAtt.hi - CORNER_MARGIN) {
          continue;
        }
      }

      // Sibling clearance: no other edge attached to the same node side may
      // end up within SIBLING_CLEARANCE of the repaired coordinate.
      let clashes = false;
      for (const other of edges) {
        if (other === edge) {
          continue;
        }
        const opts = (other as { points?: Point[] }).points;
        if (!opts || opts.length === 0) {
          continue;
        }
        for (const [oi, op] of [
          [0, opts[0]],
          [opts.length - 1, opts[opts.length - 1]],
        ] as [number, Point][]) {
          const otherNodeId =
            oi === 0
              ? String((other as { start?: string }).start ?? '')
              : String((other as { end?: string }).end ?? '');
          if (otherNodeId !== nodeId) {
            continue;
          }
          const oAtt = attachmentFor(op, r);
          if (!oAtt || oAtt.side !== att.side) {
            continue;
          }
          const sameEdgeCoord =
            att.side === 'vertical'
              ? Math.abs(op.x - endpoint.x) <= EPS
              : Math.abs(op.y - endpoint.y) <= EPS;
          if (sameEdgeCoord && Math.abs(oAtt.along - target) < SIBLING_CLEARANCE) {
            clashes = true;
            break;
          }
        }
        if (clashes) {
          break;
        }
      }
      if (clashes) {
        continue;
      }

      for (const i of railIdxs) {
        if (att.side === 'vertical') {
          pts[i] = { ...pts[i], y: pts[i].y + delta };
        } else {
          pts[i] = { ...pts[i], x: pts[i].x + delta };
        }
      }
    }
  }
}
