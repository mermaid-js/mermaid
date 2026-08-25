/**
 * Slide an edge endpoint off a node corner onto a free slot on its own side.
 *
 * An endpoint that lands exactly on a corner belongs to two sides at once, so
 * nothing downstream can say which side the edge uses: the arrowhead points
 * into the join, the port-direction rules cannot be checked, and the drawing
 * reads as if the edge is attached to nothing in particular. `validateLayout`
 * flags it as `edge-corner-connection`, and nothing repaired it.
 *
 * `domus/mermaid-chart-architecture` was held at score 0 by exactly one of
 * these, the last issue on the whole fixture:
 *
 *     app_server box   [1772.5,-44.5 .. 1976.5,0.5]
 *     L_app_server_llm_0 starts (1772.5,0.0) then runs left
 *
 * The start point is the bottom-left corner. The edge departs westward, so it
 * wants a y somewhere along the west side — and the naive choice, the middle of
 * that side, does not work: the side is crowded. Measured, `-10` collides with
 * `prerender_server`, `-22` with `errorLogging`, `-30` with `analytics`, and
 * only `-15` is free. So this is not "nudge it off the corner", it is "find the
 * gap", and the pass has to try positions and let the checker judge each one.
 *
 * The endpoint moves together with its neighbour so the first (or last) segment
 * keeps its orientation: sliding a west-side port down the side means moving
 * the y of both the port and the vertex it runs to, which preserves a
 * horizontal departure. Anything that does not reduce the issue count is put
 * back.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

export interface CornerEscapeResult {
  /** Endpoints moved off a corner. */
  escaped: number;
  changed: boolean;
}

/** Fractions along the side, tried in this order: middle first, then outward. */
const SIDE_FRACTIONS = [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85, 0.4, 0.6, 0.3, 0.7];

/**
 * For every endpoint the checker reports as sitting on a node corner, slide it
 * along the side the edge actually uses until the checker is satisfied.
 */
export function escapeCornerConnections(
  layout: LayoutData,
  /**
   * Validation to start from. The repair before this one in the chain has
   * already paid for a full `checkLayout` and its result is still accurate when
   * that pass changed nothing, so passing it in saves one whole validation per
   * fixture.
   */
  known?: ReturnType<typeof checkLayout>
): CornerEscapeResult {
  let current = known ?? checkLayout(layout);
  const flagged = current.issues.filter((issue) => issue.type === 'edge-corner-connection');
  if (flagged.length === 0) {
    return { escaped: 0, changed: false };
  }

  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  let escaped = 0;
  for (const issue of flagged) {
    const edge = (layout.edges ?? []).find(
      (candidate) => (candidate as { id?: string }).id === issue.edgeId
    );
    const pts = (edge as { points?: Point[] } | undefined)?.points;
    if (!edge || !Array.isArray(pts) || pts.length < 2) {
      continue;
    }

    // Which end is on the corner? Compare against the reported point.
    const reported = (issue as { details?: { point?: Point } }).details?.point;
    if (!reported) {
      continue;
    }
    const atStart = Math.abs(pts[0].x - reported.x) < 1 && Math.abs(pts[0].y - reported.y) < 1;
    const tipIdx = atStart ? 0 : pts.length - 1;
    const nextIdx = atStart ? 1 : pts.length - 2;

    const nodeId = atStart ? (edge as { start?: string }).start : (edge as { end?: string }).end;
    const node = nodeId != null ? nodesById.get(nodeId) : undefined;
    if (!node) {
      continue;
    }
    const rect = rectForNode(node);

    // The departing segment's orientation names the side: a horizontal run
    // leaves a vertical side, so the port slides in y, and the reverse.
    const horizontal = Math.abs(pts[tipIdx].y - pts[nextIdx].y) < 1e-6;
    const before = pts.map((p) => ({ ...p }));

    let fixed = false;
    for (const fraction of SIDE_FRACTIONS) {
      if (horizontal) {
        const y = rect.top + (rect.bottom - rect.top) * fraction;
        pts[tipIdx].y = y;
        pts[nextIdx].y = y;
      } else {
        const x = rect.left + (rect.right - rect.left) * fraction;
        pts[tipIdx].x = x;
        pts[nextIdx].x = x;
      }
      const next = checkLayout(layout);
      if (next.issues.length < current.issues.length) {
        current = next;
        escaped++;
        fixed = true;
        break;
      }
    }

    if (!fixed) {
      (edge as { points: Point[] }).points = before;
    }
  }

  return { escaped, changed: escaped > 0 };
}
