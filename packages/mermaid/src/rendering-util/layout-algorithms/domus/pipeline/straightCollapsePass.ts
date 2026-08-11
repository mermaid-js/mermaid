/**
 * iter-49 — straight-collapse pass.
 *
 * Post-routing remedy for two distinct pathologies surfaced on Company.mmd
 * (cycle-removal path → routing-graph Dijkstra → port-stub inflation):
 *
 * 1. Consecutive-duplicate points. `findShortestOrthogonalPathOnGraph`
 *    occasionally emits `...→(x,y)→(x,y)→...` (exactly the same point twice
 *    in a row). Any downstream pass that counts segments or bends is
 *    thrown off by these. Strip them.
 *
 * 2. Same-column / same-row node pairs whose polyline acquired a zigzag.
 *    When source.center.x == target.center.x (nodes vertically aligned)
 *    AND the direct straight segment between their facing-side midpoints
 *    is obstacle-clear, collapse the polyline to that 2-point segment.
 *    Symmetric for horizontally aligned pairs. This closes the Siebenhaller
 *    §2.3.2.1 edge-vertex disjointness pathology on Income↔Tax
 *    (Company.mmd: both at x=462.5, 5u gap; DOMUS produces a 5-point 2-bend
 *    zigzag through Income's own interior and back up to Tax).
 *
 * Paper anchors:
 * - Siebenhaller Def. 2.5 Bend-Or-End — perpendicular port entry.
 * - Siebenhaller §5.3 bend-stretching — post-routing pattern replacement
 *   that removes superfluous bends while preserving first/last directions.
 *   Source `0fb2d84f`.
 * - Wybrow §3 OVG "no intervening object" — valid route never passes
 *   through an obstacle's interior. Source `e8804c93`.
 *
 * The pass is safe-by-default: the collapse only fires when the direct
 * segment is obstacle-clear (excluding the edge's own start and end nodes).
 * It never adds bends; worst case is a no-op.
 *
 * Scope: Mermaid calibration — DOMUS's paper model is point-vertex, so the
 * same-column edge case reduces to a trivial shortest-path in canonical
 * Wybrow. This pass adapts the invariant to Mermaid's rectangle-node
 * model.
 */
import type { LayoutData, Node } from '../../../types.js';
import { approxEqual, rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Options {
  /** Tolerance for aligned-center detection. Default 1e-6. */
  axisTolerance?: number;
}

interface Point {
  x: number;
  y: number;
}

export function applyStraightCollapsePass(
  layout: LayoutData,
  opts: Options = {}
): { dedupedEdges: number; collapsedEdges: number } {
  const tol = opts.axisTolerance ?? 1e-6;

  const nodesById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  let dedupedEdges = 0;
  let collapsedEdges = 0;

  // Pre-compute sibling-port occupancy map so the collapse can avoid
  // colliding with another edge's existing attach point on the same
  // node-side. Key: `${nodeId}|${side}`, value: Set of coord-along-side.
  const portOccupancy = buildPortOccupancy(layout);

  for (const e of layout.edges ?? []) {
    const pts = (e as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const startId = (e as { start?: unknown }).start != null ? String((e as any).start) : null;
    const endId = (e as { end?: unknown }).end != null ? String((e as any).end) : null;
    if (!startId || !endId || startId === endId) {
      continue;
    }

    // (1) Consecutive-duplicate dedup. Runs on every edge.
    const deduped = dedupConsecutive(pts);
    if (deduped.length !== pts.length) {
      dedupedEdges += 1;
      (e as { points: Point[] }).points = deduped;
    }
    const currentPts = (e as { points: Point[] }).points;

    // (2) Same-column / same-row straight collapse. Only fires when current
    // polyline has ≥3 points AND has a U-turn pathology (consecutive
    // segments on the same axis going in opposite directions). The U-turn
    // guard avoids rewriting clean 2-bend L-shapes (e.g. Company.mmd's
    // Customer→USCompany) whose ports are intentionally offset by C1
    // port distribution to avoid collision with sibling edges.
    if (currentPts.length < 3) {
      continue;
    }
    if (!hasUTurn(currentPts)) {
      continue;
    }

    const startNode = nodesById.get(startId);
    const endNode = nodesById.get(endId);
    if (!startNode || !endNode) {
      continue;
    }
    if ((startNode as { isGroup?: boolean }).isGroup) {
      continue;
    }
    if ((endNode as { isGroup?: boolean }).isGroup) {
      continue;
    }

    const collapsed = tryCollapseToStraight(
      startNode,
      endNode,
      startId,
      endId,
      nodesById,
      portOccupancy,
      currentPts,
      tol
    );
    if (collapsed) {
      (e as { points: Point[] }).points = collapsed;
      collapsedEdges += 1;
    }
  }

  return { dedupedEdges, collapsedEdges };
}

function hasUTurn(pts: Point[]): boolean {
  for (let i = 0; i < pts.length - 2; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const c = pts[i + 2];
    // Same-axis U-turn: all three points share x OR all three share y, AND
    // the middle point's direction reverses.
    if (approxEqual(a.x, b.x) && approxEqual(b.x, c.x) && (b.y - a.y) * (c.y - b.y) < -1e-9) {
      return true;
    }
    if (approxEqual(a.y, b.y) && approxEqual(b.y, c.y) && (b.x - a.x) * (c.x - b.x) < -1e-9) {
      return true;
    }
  }
  return false;
}

/**
 * Build node-side port occupancy. Records each polyline endpoint's
 * (nodeId, side, coord) so the straight-collapse can check sibling
 * conflicts before moving an endpoint.
 *
 * Side inference: if the endpoint coord matches a node's left/right ±tol,
 * side is 'L'/'R'; if it matches top/bottom, side is 'T'/'B'. Endpoints
 * that don't sit on a node boundary (center-ish) are recorded as 'C' and
 * don't constrain the collapse.
 */
function buildPortOccupancy(layout: LayoutData): Map<string, Map<string, Set<number>>> {
  const result = new Map<string, Map<string, Set<number>>>();
  const nodesById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  const record = (nodeId: string, side: string, coord: number) => {
    let perNode = result.get(nodeId);
    if (!perNode) {
      perNode = new Map();
      result.set(nodeId, perNode);
    }
    let set = perNode.get(side);
    if (!set) {
      set = new Set();
      perNode.set(side, set);
    }
    set.add(coord);
  };

  for (const e of layout.edges ?? []) {
    const pts = (e as { points?: Point[] }).points;
    if (!Array.isArray(pts) || pts.length < 1) {
      continue;
    }
    const startId = (e as { start?: unknown }).start != null ? String((e as any).start) : null;
    const endId = (e as { end?: unknown }).end != null ? String((e as any).end) : null;
    if (startId) {
      const s = nodesById.get(startId);
      if (s) {
        const [side, coord] = inferSide(pts[0], s);
        if (side !== 'C') {
          record(startId, side, coord);
        }
      }
    }
    if (endId) {
      const t = nodesById.get(endId);
      if (t) {
        const [side, coord] = inferSide(pts[pts.length - 1], t);
        if (side !== 'C') {
          record(endId, side, coord);
        }
      }
    }
  }
  return result;
}

function inferSide(p: Point, node: Node): [string, number] {
  const r = {
    left: (node.x ?? 0) - (node.width ?? 0) / 2,
    right: (node.x ?? 0) + (node.width ?? 0) / 2,
    top: (node.y ?? 0) - (node.height ?? 0) / 2,
    bottom: (node.y ?? 0) + (node.height ?? 0) / 2,
  };
  const tol = 0.5;
  if (Math.abs(p.x - r.left) <= tol) {
    return ['L', p.y];
  }
  if (Math.abs(p.x - r.right) <= tol) {
    return ['R', p.y];
  }
  if (Math.abs(p.y - r.top) <= tol) {
    return ['T', p.x];
  }
  if (Math.abs(p.y - r.bottom) <= tol) {
    return ['B', p.x];
  }
  return ['C', 0];
}

function isPortOccupiedByOther(
  occupancy: Map<string, Map<string, Set<number>>>,
  nodeId: string,
  side: string,
  coord: number,
  selfCoord: number,
  minGap: number
): boolean {
  const perNode = occupancy.get(nodeId);
  if (!perNode) {
    return false;
  }
  const set = perNode.get(side);
  if (!set) {
    return false;
  }
  for (const c of set) {
    // skip self
    if (Math.abs(c - selfCoord) <= 1e-6) {
      continue;
    }
    if (Math.abs(c - coord) < minGap) {
      return true;
    }
  }
  return false;
}

function dedupConsecutive(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && approxEqual(last.x, p.x) && approxEqual(last.y, p.y)) {
      continue;
    }
    out.push(p);
  }
  return out;
}

/**
 * Return a 2-point straight polyline when the two nodes' centers share an
 * axis AND the facing-side segment is obstacle-clear; else null.
 *
 * Facing sides: for vertical alignment (same x), the segment runs from the
 * source's near-side (top or bottom, whichever faces the target) to the
 * target's near-side. Both endpoints share the common x coord (centers
 * aligned). This gives a perpendicular-entry at both ports by construction.
 */
function tryCollapseToStraight(
  startNode: Node,
  endNode: Node,
  startId: string,
  endId: string,
  nodesById: Map<string, Node>,
  portOccupancy: Map<string, Map<string, Set<number>>>,
  originalPts: Point[],
  tol: number
): Point[] | null {
  const s = rectForNode(startNode);
  const t = rectForNode(endNode);

  const alignedX = Math.abs(s.cx - t.cx) <= tol;
  const alignedY = Math.abs(s.cy - t.cy) <= tol;
  if (!alignedX && !alignedY) {
    return null;
  }

  let start: Point;
  let end: Point;
  let startSide: string;
  let endSide: string;
  let startCoordAlongSide: number;
  let endCoordAlongSide: number;
  if (alignedX) {
    const commonX = (s.cx + t.cx) / 2;
    if (s.cy <= t.cy) {
      start = { x: commonX, y: s.bottom };
      end = { x: commonX, y: t.top };
      startSide = 'B';
      endSide = 'T';
    } else {
      start = { x: commonX, y: s.top };
      end = { x: commonX, y: t.bottom };
      startSide = 'T';
      endSide = 'B';
    }
    startCoordAlongSide = commonX;
    endCoordAlongSide = commonX;
  } else {
    const commonY = (s.cy + t.cy) / 2;
    if (s.cx <= t.cx) {
      start = { x: s.right, y: commonY };
      end = { x: t.left, y: commonY };
      startSide = 'R';
      endSide = 'L';
    } else {
      start = { x: s.left, y: commonY };
      end = { x: t.right, y: commonY };
      startSide = 'L';
      endSide = 'R';
    }
    startCoordAlongSide = commonY;
    endCoordAlongSide = commonY;
  }

  if (approxEqual(start.x, end.x) && approxEqual(start.y, end.y)) {
    return null;
  }

  // Sibling-port conflict guard. Moving this edge's endpoint to the
  // center-aligned position would collide with another edge whose existing
  // attach point sits on the same side at a close coord. `minGap` matches
  // the validator's `edge-same-port-departure` threshold. Query with the
  // edge's CURRENT attach coord so we never treat self-conflict as a hit.
  const startCurSide = inferSide(originalPts[0], startNode);
  const endCurSide = inferSide(originalPts[originalPts.length - 1], endNode);
  const minGap = 4;
  if (
    isPortOccupiedByOther(
      portOccupancy,
      startId,
      startSide,
      startCoordAlongSide,
      startCurSide[0] === startSide ? startCurSide[1] : Number.NEGATIVE_INFINITY,
      minGap
    )
  ) {
    return null;
  }
  if (
    isPortOccupiedByOther(
      portOccupancy,
      endId,
      endSide,
      endCoordAlongSide,
      endCurSide[0] === endSide ? endCurSide[1] : Number.NEGATIVE_INFINITY,
      minGap
    )
  ) {
    return null;
  }

  // Obstacle check — strict interior intersection with any non-endpoint
  // non-group node.
  for (const [id, n] of nodesById) {
    if (id === startId || id === endId) {
      continue;
    }
    if ((n as { isGroup?: boolean }).isGroup) {
      continue;
    }
    const r = rectForNode(n);
    if (segmentIntersectsRectInterior(start, end, r)) {
      return null;
    }
  }

  return [start, end];
}
