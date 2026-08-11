/**
 * Sub-pixel endpoint snap. When an orthogonal edge endpoint sits at a
 * tiny offset (under the snap tolerance) from the source/target node's
 * nearest boundary side, snap it onto the boundary along the perpendicular axis
 * so downstream `repairShortEndpointStubs` can recognize the side.
 *
 * Background:
 * `pipeline/endpointStubRepair.ts:sideFromBoundaryPoint` uses
 * `approxEqual` with `tol = 1e-6` (effectively strict equality) to map
 * an endpoint to a node side. After the cyclic-routing nudgers and
 * routing-graph fallback run, port placements can drift by 0.4–0.5 px
 * (e.g. `deploy-pipeline.mmd`: `L_K_L_0` start endpoint sits 0.5 px
 * inside K from K.top; `L_D_F_0` last endpoint sits 0.44 px below
 * F.bottom). The strict-equality side detection skips these cases and
 * the entire repair family (start stub, end stub, end-band slide) never
 * fires.
 *
 * What this does:
 * For each edge endpoint, find the nearest node-boundary side. If the
 * perpendicular distance is in (0, tolerance], snap the endpoint
 * coordinate to the boundary (perpendicular axis only). If snapping
 * would break orthogonality of the immediate-adjacent segment (e.g. the
 * adjacent bend's perpendicular coord still matches the unsnapped port)
 * also snap that bend's perpendicular coord to keep the segment
 * orthogonal. Then run a `collapseCollinear` pass to remove now-redundant
 * 3-point collinear runs.
 *
 * Scope:
 * - Only operates on the first and last point of each polyline.
 * - Does nothing if the endpoint already sits exactly on a boundary
 *   (delta = 0) — preserves existing on-boundary endpoints.
 * - Does nothing if the perpendicular distance exceeds `tolerance`
 *   (default 1.5 px) — won't disturb endpoints that are intentionally
 *   placed off-boundary.
 *
 * Single log prefix: `SNAP_ENDPOINT_DBG`.
 */
import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { approxEqual, rectForNode } from '../core/helpers.js';

const DEBUG_PREFIX = 'SNAP_ENDPOINT_DBG';

interface Point {
  x: number;
  y: number;
}

type Axis = 'x' | 'y';

interface NearestSide {
  axis: Axis;
  delta: number; // signed: positive means port is outside (further along axis); 0 means on boundary
  target: number;
  absDelta: number;
}

export interface SnapEndpointsToBoundariesOptions {
  tolerance?: number;
}

export interface SnapEndpointsToBoundariesResult {
  snapped: number;
}

export function snapEndpointsToBoundaries(
  layout: LayoutData,
  options: SnapEndpointsToBoundariesOptions = {}
): SnapEndpointsToBoundariesResult {
  const tolerance = options.tolerance ?? 1.5;

  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  let snapped = 0;
  for (const edge of layout.edges ?? []) {
    const points = (edge as { points?: Point[] }).points;
    if (!Array.isArray(points) || points.length < 2) {
      continue;
    }

    const startId = edge.start != null ? String(edge.start) : null;
    const endId = edge.end != null ? String(edge.end) : null;
    const startNode = startId ? nodesById.get(startId) : undefined;
    const endNode = endId ? nodesById.get(endId) : undefined;

    let nextPoints: Point[] = points.map((p) => ({ x: p.x, y: p.y }));

    if (startNode && snapEndpoint(nextPoints, 0, 1, startNode, tolerance)) {
      snapped++;
    }
    if (endNode) {
      const lastIdx = nextPoints.length - 1;
      const adjIdx = lastIdx - 1;
      if (snapEndpoint(nextPoints, lastIdx, adjIdx, endNode, tolerance)) {
        snapped++;
      }
    }

    nextPoints = collapseCollinear(nextPoints);

    (edge as { points: Point[] }).points = nextPoints;
  }

  if (snapped > 0) {
    log.debug(`${DEBUG_PREFIX}: snap pass`, { snapped });
  }
  return { snapped };
}

/**
 * Snap a single endpoint (in place) when it is within `tolerance` of a
 * node side along the perpendicular axis. Returns true when a snap was
 * applied.
 */
function snapEndpoint(
  points: Point[],
  endpointIdx: number,
  adjacentIdx: number,
  node: Node,
  tolerance: number
): boolean {
  if (endpointIdx < 0 || endpointIdx >= points.length) {
    return false;
  }
  if (adjacentIdx < 0 || adjacentIdx >= points.length) {
    return false;
  }

  const port = points[endpointIdx];
  const adj = points[adjacentIdx];
  const rect = rectForNode(node);

  const sides: NearestSide[] = [
    {
      axis: 'x',
      delta: rect.left - port.x,
      target: rect.left,
      absDelta: Math.abs(rect.left - port.x),
    },
    {
      axis: 'x',
      delta: rect.right - port.x,
      target: rect.right,
      absDelta: Math.abs(rect.right - port.x),
    },
    {
      axis: 'y',
      delta: rect.top - port.y,
      target: rect.top,
      absDelta: Math.abs(rect.top - port.y),
    },
    {
      axis: 'y',
      delta: rect.bottom - port.y,
      target: rect.bottom,
      absDelta: Math.abs(rect.bottom - port.y),
    },
  ];

  let nearest: NearestSide = sides[0];
  for (const s of sides) {
    if (s.absDelta < nearest.absDelta) {
      nearest = s;
    }
  }

  if (nearest.absDelta === 0 || nearest.absDelta > tolerance) {
    return false;
  }

  const wasSegmentOrthogonal = isSegmentOrthogonal(port, adj);
  const snappedPort: Point =
    nearest.axis === 'x' ? { x: nearest.target, y: port.y } : { x: port.x, y: nearest.target };

  points[endpointIdx] = snappedPort;

  if (wasSegmentOrthogonal && !isSegmentOrthogonal(snappedPort, adj)) {
    // Snapping the perpendicular coord broke the adjacent segment's
    // orthogonality. Move the adjacent bend's perpendicular coord to
    // match the snapped port so the segment stays orthogonal.
    const adjustedAdj: Point =
      nearest.axis === 'x' ? { x: snappedPort.x, y: adj.y } : { x: adj.x, y: snappedPort.y };
    points[adjacentIdx] = adjustedAdj;
  }

  return true;
}

function isSegmentOrthogonal(a: Point, b: Point): boolean {
  return approxEqual(a.x, b.x) || approxEqual(a.y, b.y);
}

function collapseCollinear(points: Point[]): Point[] {
  const collapsed: Point[] = [];
  for (const point of points) {
    const prev = collapsed.at(-1);
    if (prev && approxEqual(prev.x, point.x) && approxEqual(prev.y, point.y)) {
      continue;
    }
    collapsed.push(point);
    while (collapsed.length >= 3) {
      const a = collapsed[collapsed.length - 3];
      const b = collapsed[collapsed.length - 2];
      const c = collapsed[collapsed.length - 1];
      if (
        (approxEqual(a.x, b.x) && approxEqual(b.x, c.x)) ||
        (approxEqual(a.y, b.y) && approxEqual(b.y, c.y))
      ) {
        collapsed.splice(-2, 1);
      } else {
        break;
      }
    }
  }
  return collapsed;
}
