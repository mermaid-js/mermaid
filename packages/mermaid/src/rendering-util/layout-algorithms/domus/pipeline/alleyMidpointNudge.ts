/**
 * Alley-midpoint nudging for orthogonal routing.
 *
 * Wybrow et al. "Orthogonal Connector Routing" §5.2: after shortest-path routing
 * on a channel-based routing graph, S/Z-bend middle segments should be shifted
 * to the centre of the free alley between adjacent obstacles. Our channel builder
 * (`core/routing.ts` `buildRoutingGraphFromChannels`) emits raw obstacle-side
 * coordinates as legal grid columns, so Dijkstra can land a segment flush on a
 * non-endpoint obstacle's side. `validateLayout` flags these as
 * `edge-intersects-obstacle` (the interior test is inclusive on the boundary)
 * and/or `edge-border-hugging`.
 *
 * This post-routing pass detects any interior (non-port) segment whose axis
 * coordinate matches a non-endpoint obstacle's side and the segment's
 * perpendicular range overlaps that obstacle's perpendicular range. It shifts
 * the segment a half-spacing away from the obstacle centre so the segment sits
 * in the clearance alley rather than on the boundary.
 *
 * Scope boundaries:
 * - Only interior segments are considered. The first and last polyline segments
 *   attach to the port on the endpoint node; those are allowed to lie on the
 *   endpoint's own border (that's the port).
 * - The nudge is skipped if the shifted position would lie inside another
 *   non-endpoint obstacle.
 * - Neighboring orthogonal segments remain orthogonal after the nudge because
 *   both endpoints of the target segment shift by the same delta along the
 *   segment's axis coordinate.
 */
import type { LayoutData, Node } from '../../../types.js';
import type { Point, Rect } from '../types.js';
import { approxEqual, rectForNode } from '../core/helpers.js';

const L_ATTACH = 8;

interface ObstacleEntry {
  id: string;
  rect: Rect;
}

function within(a: Point, b: Point, d: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= d * d;
}

function buildObstacles(nodesByIdNoGroups: Map<string, Node>): ObstacleEntry[] {
  const out: ObstacleEntry[] = [];
  for (const node of nodesByIdNoGroups.values()) {
    if (node?.isGroup) {
      continue;
    }
    if ((node as { isEdgeLabel?: boolean })?.isEdgeLabel) {
      continue;
    }
    if (node?.id == null) {
      continue;
    }
    out.push({ id: String(node.id), rect: rectForNode(node) });
  }
  return out;
}

function yOverlapLength(aY: number, bY: number, rect: Rect): number {
  const lo = Math.min(aY, bY);
  const hi = Math.max(aY, bY);
  return Math.min(hi, rect.bottom) - Math.max(lo, rect.top);
}

function xOverlapLength(aX: number, bX: number, rect: Rect): number {
  const lo = Math.min(aX, bX);
  const hi = Math.max(aX, bX);
  return Math.min(hi, rect.right) - Math.max(lo, rect.left);
}

function positionInsideAnyObstacle(
  obstacles: ObstacleEntry[],
  excludeIds: Set<string>,
  axis: 'x' | 'y',
  value: number,
  segLo: number,
  segHi: number
): boolean {
  for (const { id, rect } of obstacles) {
    if (excludeIds.has(id)) {
      continue;
    }
    if (axis === 'x') {
      const insideX = value > rect.left && value < rect.right;
      const overlapsY = Math.min(segHi, rect.bottom) - Math.max(segLo, rect.top) > 0;
      if (insideX && overlapsY) {
        return true;
      }
    } else {
      const insideY = value > rect.top && value < rect.bottom;
      const overlapsX = Math.min(segHi, rect.right) - Math.max(segLo, rect.left) > 0;
      if (insideY && overlapsX) {
        return true;
      }
    }
  }
  return false;
}

export function nudgeSegmentsOffObstacleBorders(
  data: LayoutData,
  nodesByIdNoGroups: Map<string, Node>,
  spacing: number
): number {
  const obstacles = buildObstacles(nodesByIdNoGroups);
  if (obstacles.length === 0) {
    return 0;
  }
  const margin = Math.max(2, spacing / 2);
  let nudges = 0;

  for (const edge of data.edges ?? []) {
    const pts = edge.points as Point[] | undefined;
    if (!pts || pts.length < 4) {
      continue;
    }
    const startAttach = pts[0];
    const endAttach = pts[pts.length - 1];

    for (let i = 1; i < pts.length - 2; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const isVertical = approxEqual(a.x, b.x) && !approxEqual(a.y, b.y);
      const isHorizontal = approxEqual(a.y, b.y) && !approxEqual(a.x, b.x);
      if (!isVertical && !isHorizontal) {
        continue;
      }
      // Mirror validateLayout's attachment corridor: segments with both endpoints
      // within L_ATTACH of the port attachment are legitimate port geometry and
      // must not be moved. All other interior segments are fair game, even when
      // they coincide with the edge's own endpoint-node border (that's exactly
      // the loop-back-into-target case validateLayout flags).
      const nearStart = within(a, startAttach, L_ATTACH) && within(b, startAttach, L_ATTACH);
      const nearEnd = within(a, endAttach, L_ATTACH) && within(b, endAttach, L_ATTACH);
      if (nearStart || nearEnd) {
        continue;
      }

      const excludeIds = new Set<string>();

      for (const { id, rect } of obstacles) {
        if (excludeIds.has(id)) {
          continue;
        }

        if (isVertical) {
          const overlap = yOverlapLength(a.y, b.y, rect);
          if (overlap <= 1e-6) {
            continue;
          }
          const onLeft = approxEqual(a.x, rect.left);
          const onRight = approxEqual(a.x, rect.right);
          if (!onLeft && !onRight) {
            continue;
          }
          const nudgedX = onLeft ? rect.left - margin : rect.right + margin;
          const segLo = Math.min(a.y, b.y);
          const segHi = Math.max(a.y, b.y);
          if (positionInsideAnyObstacle(obstacles, excludeIds, 'x', nudgedX, segLo, segHi)) {
            continue;
          }
          pts[i] = { x: nudgedX, y: a.y };
          pts[i + 1] = { x: nudgedX, y: b.y };
          nudges++;
          break;
        }

        if (isHorizontal) {
          const overlap = xOverlapLength(a.x, b.x, rect);
          if (overlap <= 1e-6) {
            continue;
          }
          const onTop = approxEqual(a.y, rect.top);
          const onBottom = approxEqual(a.y, rect.bottom);
          if (!onTop && !onBottom) {
            continue;
          }
          const nudgedY = onTop ? rect.top - margin : rect.bottom + margin;
          const segLo = Math.min(a.x, b.x);
          const segHi = Math.max(a.x, b.x);
          if (positionInsideAnyObstacle(obstacles, excludeIds, 'y', nudgedY, segLo, segHi)) {
            continue;
          }
          pts[i] = { x: a.x, y: nudgedY };
          pts[i + 1] = { x: b.x, y: nudgedY };
          nudges++;
          break;
        }
      }
    }
  }

  return nudges;
}
