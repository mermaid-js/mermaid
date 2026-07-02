/**
 * Direct compound routing: one whole-edge graph search in which ONLY the
 * groups on the start/end ancestry chains stop being obstacles —
 * Siebenhaller's tree-path rule (an edge may cross exactly the cluster
 * boundaries on the v→w path of the cluster tree) — while the route stays
 * inside the common ancestors' region via four slab obstacles.
 *
 * Shared by `routeEdges` (primary compound attempt) and
 * `flaggedEdgeRemediation` (repair candidates for edges the initial pass got
 * wrong).
 */
import type { Node } from '../../../types.js';
import type { Point, Rect } from '../types.js';
import { rectForNode } from '../core/helpers.js';
import { findRoutingGraphPathBetweenPortsWithObstacles } from '../core/routing.js';
import { allowedRectForInsideGroups } from './containment.js';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';
import { isEdgeLabelNode } from '../core/labels.js';

const OUTER = 1_000_000;

function mkRect(left: number, top: number, right: number, bottom: number): Rect {
  return { left, top, right, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
}

export function findDirectCompoundRoute(args: {
  startNode: Node;
  endNode: Node;
  startPort: Point;
  endPort: Point;
  nodesById: Map<string, Node>;
  spacing: number;
  clearance?: number;
  model?: 'grid' | 'representatives' | 'channels';
  /**
   * Skip edge-label dummy nodes as obstacles. Used when routing a label pair
   * as one semantic edge: dummies get repositioned onto the routes afterwards,
   * so routing against their provisional rects is routing against stale data.
   */
  ignoreEdgeLabelObstacles?: boolean;
}): Point[] | null {
  const { startNode, endNode, startPort, endPort, nodesById, spacing } = args;
  const clearance = args.clearance ?? spacing;
  const model = args.model ?? 'channels';

  const startId = String(startNode.id);
  const endId = String(endNode.id);
  const startAnc = ancestorGroupIds(startNode, nodesById);
  const endAnc = ancestorGroupIds(endNode, nodesById);
  const cp = commonPrefixLen(startAnc, endAnc);
  const chainGroupIds = new Set<string>([...startAnc, ...endAnc]);
  const commonAncestors = new Set<string>(startAnc.slice(0, cp));
  const allowed = allowedRectForInsideGroups(commonAncestors, nodesById);

  const obstacles: Rect[] = [];
  for (const [id, node] of nodesById) {
    if (id === startId || id === endId) {
      continue;
    }
    if ((node as { isGroup?: boolean }).isGroup && chainGroupIds.has(id)) {
      continue;
    }
    if (args.ignoreEdgeLabelObstacles && isEdgeLabelNode(node)) {
      continue;
    }
    obstacles.push(rectForNode(node));
  }
  const baseLength = obstacles.length;

  if (allowed) {
    const pad = Math.max(0, clearance) + Math.max(0, spacing);
    obstacles.push(
      mkRect(allowed.left - OUTER, allowed.top - OUTER, allowed.right + OUTER, allowed.top - pad),
      mkRect(
        allowed.left - OUTER,
        allowed.bottom + pad,
        allowed.right + OUTER,
        allowed.bottom + OUTER
      ),
      mkRect(allowed.left - OUTER, allowed.top - pad, allowed.left - pad, allowed.bottom + pad),
      mkRect(allowed.right + pad, allowed.top - pad, allowed.right + OUTER, allowed.bottom + pad)
    );
  }
  const slabsLength = obstacles.length;

  // Prefer blocking the endpoints' interiors (deflated so the border ring
  // stays routable) — prevents routes that cross their own terminal node.
  for (const endpointId of [startId, endId]) {
    const endpointNode = nodesById.get(endpointId);
    if (!endpointNode || (endpointNode as { isGroup?: boolean }).isGroup) {
      continue;
    }
    const r = rectForNode(endpointNode);
    const deflate = Math.max(0, clearance) + 1;
    if (r.right - r.left > 2 * deflate && r.bottom - r.top > 2 * deflate) {
      obstacles.push(
        mkRect(r.left + deflate, r.top + deflate, r.right - deflate, r.bottom - deflate)
      );
    }
  }

  if (obstacles.length === 0) {
    return null;
  }

  const strict = findRoutingGraphPathBetweenPortsWithObstacles(
    startPort,
    endPort,
    obstacles,
    spacing,
    { model }
  );
  if (strict) {
    return strict;
  }
  // Endpoint-interior blocking can strand a port in tight geometries; retry
  // without it (keeping the containment slabs), then bare (chain obstacles
  // only) as the last resort.
  if (obstacles.length > slabsLength) {
    const noEndpointBlock = findRoutingGraphPathBetweenPortsWithObstacles(
      startPort,
      endPort,
      obstacles.slice(0, slabsLength),
      spacing,
      { model }
    );
    if (noEndpointBlock) {
      return noEndpointBlock;
    }
  }
  if (slabsLength > baseLength && baseLength > 0) {
    return findRoutingGraphPathBetweenPortsWithObstacles(
      startPort,
      endPort,
      obstacles.slice(0, baseLength),
      spacing,
      { model }
    );
  }
  return null;
}
