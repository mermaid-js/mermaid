/**
 * Push a final approach rail out of its end node's parallel band.
 *
 * `validateLayout` flags more than a short final segment near an endpoint. It
 * also flags the segment BEFORE it — the rail the route rides in on — when that
 * rail runs parallel to the side it is about to enter, within
 * `EPS_ENDPOINT_BAND` of it, while overlapping the node's own extent. A route
 * that skims down the side of its target and then turns in at the last moment
 * reads as though it is hugging the node, and the checker says so
 * (`edge-bend-near-endpoint`, `which: 'end-band'`).
 *
 * Nothing repaired it. `repairEndpointApproachesWhenIssuesImprove` collects
 * `edge-bend-near-endpoint` edges, but its remedies are aimed at the short-stub
 * form of that issue; the band form needs the opposite move — not a longer last
 * segment but a rail further out, which lengthens the last segment as a side
 * effect.
 *
 * `domus/architecture5-components` had two of these, and they were two of the
 * three issues keeping the whole fixture at score 0:
 *
 *     one edge ... (448,1460) (448,1240) (435,1240)
 *     another  ... (1091,1295) (1091,1180) (1078,1180)
 *
 * Both ride a rail exactly 13 units off the side they enter, against a
 * threshold of 18. Pushing each rail out clears both.
 *
 * The move is deliberately generous rather than minimal. Clearing the threshold
 * by a hair puts the rail one unit outside a band it was just inside, and the
 * measured result is that it lands on a NEIGHBOUR instead: at +8 the two edges
 * traded their band issues for four `edge-shared-subpath`, and at +12 for four
 * `edge-parallel-segment-too-close`. Only a push that clears the band AND the
 * traffic just outside it settles — at +20 both fixtures came clean. So the
 * pass asks for the threshold plus a full clearance, and accepts nothing that
 * makes the layout worse.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

export interface BandWideningResult {
  /** Edges whose approach rail was pushed clear. */
  widened: number;
  changed: boolean;
}

/**
 * For every edge the checker reports as riding its end node's parallel band,
 * push the approach rail away from that side. Monotone: a move that does not
 * reduce the issue count is put back.
 */
export function widenEndpointApproachBands(
  layout: LayoutData,
  options: { clearance?: number } = {}
): BandWideningResult {
  const clearance = Math.max(1, options.clearance ?? 10);
  let current = checkLayout(layout);

  const flagged = new Map<string, number>();
  for (const issue of current.issues) {
    const details = (issue as { details?: { which?: string; threshold?: number } }).details;
    if (issue.type !== 'edge-bend-near-endpoint' || details?.which !== 'end-band') {
      continue;
    }
    if (issue.edgeId != null) {
      flagged.set(String(issue.edgeId), Number(details?.threshold ?? 18));
    }
  }
  if (flagged.size === 0) {
    return { widened: 0, changed: false };
  }

  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  let widened = 0;
  for (const edge of layout.edges ?? []) {
    const id = (edge as { id?: string }).id ?? '';
    const threshold = flagged.get(id);
    if (threshold == null) {
      continue;
    }
    const pts = (edge as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const endNode = nodesById.get((edge as { end?: string }).end ?? '');
    if (!endNode) {
      continue;
    }
    const rect = rectForNode(endNode);

    // The rail is the segment before the final approach: points n-3 -> n-2.
    const n = pts.length;
    const railA = pts[n - 3];
    const railB = pts[n - 2];
    const tip = pts[n - 1];

    const railIsVertical = Math.abs(railA.x - railB.x) < 1e-6;
    const lastIsHorizontal = Math.abs(railB.y - tip.y) < 1e-6;
    if (railIsVertical !== lastIsHorizontal) {
      continue; // not the shape this repair understands
    }

    const before = pts.map((p) => ({ ...p }));
    const want = threshold + clearance;

    if (railIsVertical) {
      const side = railA.x > rect.right - 1e-6 ? 1 : -1;
      const edgeX = side === 1 ? rect.right : rect.left;
      const target = edgeX + side * want;
      if (Math.abs(target - railA.x) < 1e-6) {
        continue;
      }
      railA.x = target;
      railB.x = target;
    } else {
      const side = railA.y > rect.bottom - 1e-6 ? 1 : -1;
      const edgeY = side === 1 ? rect.bottom : rect.top;
      const target = edgeY + side * want;
      if (Math.abs(target - railA.y) < 1e-6) {
        continue;
      }
      railA.y = target;
      railB.y = target;
    }

    const next = checkLayout(layout);
    if (next.issues.length < current.issues.length) {
      current = next;
      widened++;
    } else {
      (edge as { points: Point[] }).points = before;
    }
  }

  return { widened, changed: widened > 0 };
}
