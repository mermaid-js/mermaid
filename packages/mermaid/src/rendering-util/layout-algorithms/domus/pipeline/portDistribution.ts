import type { LayoutData, Node } from '../../../types.js';
import type { Point, PortSide } from '../types.js';
import { rectForNode } from '../core/helpers.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';
import { assignPortsForEdge } from '../core/portAssignment.js';
import type { PortPlan } from '../domus/edgePaths.js';

/**
 * Resolve the (startSide, endSide) pair for an edge, preferring the
 * shape-derived portPlan when available. Falls back to
 * `assignPortsForEdge`'s positional heuristic for self-loops, edges
 * without a walked shape, or when portPlan is not provided.
 *
 * Paper anchor (iter-19 / Phase B): DOMUS §3 — label λ IS the segment
 * direction, so the first/last segment labels ARE the port sides.
 * Positional `|dx|>=|dy|` is Mermaid-specific fallback only.
 */
function resolvePortSides(
  edgeId: string,
  startNode: Node,
  endNode: Node,
  portPlan: PortPlan | undefined
): { startSide: PortSide; endSide: PortSide } {
  const planned = portPlan?.get(edgeId);
  if (planned) {
    return { startSide: planned.startSide, endSide: planned.endSide };
  }
  const ports = assignPortsForEdge(startNode, endNode);
  return { startSide: ports.startSide, endSide: ports.endSide };
}

function allocateTs(count: number): number[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [0.5];
  }
  // Keep within the central portion of the side to avoid corner crowding.
  const lo = 0.2;
  const hi = 0.8;
  const step = (hi - lo) / (count - 1);
  return Array.from({ length: count }, (_, i) => lo + i * step);
}

/**
 * Spread `count` values evenly across `[lo, hi]`. For count=1, returns
 * the midpoint; for count=0 returns []. Mirrors `allocateTs` but over
 * an arbitrary sub-range.
 */
function allocateTsInRange(count: number, lo: number, hi: number): number[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [(lo + hi) / 2];
  }
  const step = (hi - lo) / (count - 1);
  return Array.from({ length: count }, (_, i) => lo + i * step);
}

/**
 * C2 / iter-20 — Kandinsky bend-or-end allocator.
 *
 * Given a sorted endpoint list on one side of a vertex and an optional
 * pinned endpoint key, pin that key at t=0.5 and distribute the rest
 * off-centre:
 *
 * - Records sorted *before* the pinned index → `[0.2, 0.45]`
 * - Records sorted *after* the pinned index  → `[0.55, 0.8]`
 *
 * When `pinnedKey` is null, falls back to `allocateTs` (the pre-C2
 * uniform distribution across `[0.2, 0.8]`).
 *
 * Paper anchor: Siebenhaller Def 2.5 (source `0fb2d84f`) — "at most one
 * straight-line edge per vertex side ... assigned to the κ-th fine
 * grid line". The centre t=0.5 IS κ.
 */
function allocateTsWithOptionalPin(
  recs: readonly { edgeId: string; endpoint: 'start' | 'end' }[],
  pinnedKey: string | null
): number[] {
  if (pinnedKey === null) {
    return allocateTs(recs.length);
  }
  const pinIndex = recs.findIndex((r) => `${r.edgeId}|${r.endpoint}` === pinnedKey);
  if (pinIndex < 0) {
    // Shouldn't happen if pinnedKey was selected from recs, but defend.
    return allocateTs(recs.length);
  }
  const result = new Array<number>(recs.length);
  result[pinIndex] = 0.5;
  const belowCount = pinIndex;
  const aboveCount = recs.length - pinIndex - 1;
  const belowTs = allocateTsInRange(belowCount, 0.2, 0.45);
  const aboveTs = allocateTsInRange(aboveCount, 0.55, 0.8);
  for (let i = 0; i < belowCount; i++) {
    result[i] = belowTs[i];
  }
  for (let i = 0; i < aboveCount; i++) {
    result[pinIndex + 1 + i] = aboveTs[i];
  }
  return result;
}

/** Opposite side helper (E↔W, N↔S). */
function oppositePortSide(side: PortSide): PortSide {
  switch (side) {
    case 'E':
      return 'W';
    case 'W':
      return 'E';
    case 'N':
      return 'S';
    case 'S':
      return 'N';
  }
}

/**
 * C2 / iter-20 — find straight-through partner pairs per (node, axis).
 *
 * Walks `byNodeSide` and for each (nodeId, side) looks at the opposite
 * side. A strict straight-line partner exists when an endpoint on each
 * side shares the same `orderCoord` (within 1e-6). Deterministic order:
 * iterate sorted `byNodeSide` keys; within each side, iterate the
 * pre-sorted recs in order; first strict match wins. At most one pair
 * is pinned per (node, axis).
 *
 * Returns a map from `"nodeId|side"` → the `"edgeId|endpoint"` key to
 * pin on that side at t=0.5.
 */
function findStraightThroughPartners<
  R extends { edgeId: string; endpoint: 'start' | 'end'; orderCoord: number },
>(byNodeSide: Map<string, R[]>): Map<string, string> {
  const pinnedKeyByNodeSide = new Map<string, string>();
  const EPS = 1e-6;
  const sortedKeys = [...byNodeSide.keys()].sort();
  for (const key of sortedKeys) {
    if (pinnedKeyByNodeSide.has(key)) {
      continue;
    }
    const [nodeId, sideStr] = key.split('|');
    const side = sideStr as PortSide;
    const oppKey = `${nodeId}|${oppositePortSide(side)}`;
    if (pinnedKeyByNodeSide.has(oppKey)) {
      continue;
    }
    const oppRecs = byNodeSide.get(oppKey);
    if (!oppRecs || oppRecs.length === 0) {
      continue;
    }
    const thisRecs = byNodeSide.get(key);
    if (!thisRecs || thisRecs.length === 0) {
      continue;
    }
    let matched = false;
    for (const r of thisRecs) {
      for (const or of oppRecs) {
        if (Math.abs(r.orderCoord - or.orderCoord) < EPS) {
          pinnedKeyByNodeSide.set(key, `${r.edgeId}|${r.endpoint}`);
          pinnedKeyByNodeSide.set(oppKey, `${or.edgeId}|${or.endpoint}`);
          matched = true;
          break;
        }
      }
      if (matched) {
        break;
      }
    }
  }
  return pinnedKeyByNodeSide;
}

export function createPortTAllocator(args: {
  data: LayoutData;
  nodesById: Map<string, Node>;
  /**
   * Optional per-edge port plan (iter-19 / Phase B). When provided and
   * containing an entry for an edge, the plan's `startSide` / `endSide`
   * override `assignPortsForEdge`'s positional heuristic. See
   * `resolvePortSides` and DOMUS §3 for paper anchoring.
   */
  portPlan?: PortPlan;
}): {
  tByEdgeEndpointKey: Map<string, number>;
  ensureTsForNodeSide: (nodeId: string, side: PortSide) => void;
} {
  const { data, nodesById, portPlan } = args;
  interface EndpointRec {
    edgeId: string;
    endpoint: 'start' | 'end';
    side: PortSide;
    orderCoord: number;
  }

  // Important: validateLayout checks “same-port-departure” for *all* incident edges on a node,
  // including edges where the node is the end-point. So we must distribute ports across both
  // outgoing and incoming endpoints on the same side to avoid collisions.
  const byNodeSide = new Map<string, EndpointRec[]>();
  const tByEdgeEndpointKey = new Map<string, number>(); // `${edgeId}|start` or `${edgeId}|end`

  for (const edge of data.edges ?? []) {
    if (!(edge as any).start || !(edge as any).end) {
      continue;
    }
    const startNodeId = String((edge as any).start);
    const endNodeId = String((edge as any).end);
    const startNode = nodesById.get(startNodeId);
    const endNode = nodesById.get(endNodeId);
    if (!startNode || !endNode) {
      continue;
    }
    if ((startNode as any).isGroup || (endNode as any).isGroup) {
      continue;
    }

    const edgeId = String((edge as any).id ?? `${startNodeId}->${endNodeId}`);
    const ports = resolvePortSides(edgeId, startNode, endNode, portPlan);
    const rs = rectForNode(startNode);
    const re = rectForNode(endNode);
    const startOrderCoord = ports.startSide === 'E' || ports.startSide === 'W' ? re.cy : re.cx;
    const endOrderCoord = ports.endSide === 'E' || ports.endSide === 'W' ? rs.cy : rs.cx;
    const outKey = `${startNodeId}|${ports.startSide}`;
    const inKey = `${endNodeId}|${ports.endSide}`;
    (byNodeSide.get(outKey) ?? byNodeSide.set(outKey, []).get(outKey)!).push({
      edgeId,
      endpoint: 'start',
      side: ports.startSide,
      orderCoord: startOrderCoord,
    });
    (byNodeSide.get(inKey) ?? byNodeSide.set(inKey, []).get(inKey)!).push({
      edgeId,
      endpoint: 'end',
      side: ports.endSide,
      orderCoord: endOrderCoord,
    });
  }

  for (const [_key, list] of byNodeSide) {
    list.sort((a, b) => {
      if (a.orderCoord !== b.orderCoord) {
        return a.orderCoord - b.orderCoord;
      }
      const ak = `${a.edgeId}|${a.endpoint}`;
      const bk = `${b.edgeId}|${b.endpoint}`;
      return ak.localeCompare(bk);
    });
  }

  // C2 / iter-20 — find straight-through partners across (node, axis)
  // pairs. See `findStraightThroughPartners` + `allocateTsWithOptionalPin`
  // for Kandinsky Def 2.5 anchoring. Runs after sort because strict-match
  // scan relies on deterministic rec order.
  const pinnedKeyByNodeSide = findStraightThroughPartners(byNodeSide);

  for (const [key, list] of byNodeSide) {
    const pinnedKey = pinnedKeyByNodeSide.get(key) ?? null;
    const ts = allocateTsWithOptionalPin(list, pinnedKey);
    for (const [i, element] of list.entries()) {
      tByEdgeEndpointKey.set(`${element.edgeId}|${element.endpoint}`, ts[i]);
    }
  }

  // Defensive: if port t-allocations end up missing for some reason, compute them lazily
  // per node+side when routing needs them (still deterministic).
  const ensureTsForNodeSide = (nodeId: string, side: PortSide) => {
    const recs: { edgeId: string; endpoint: 'start' | 'end'; orderCoord: number }[] = [];
    for (const e of data.edges ?? []) {
      if ((e as any)?.start == null || (e as any)?.end == null) {
        continue;
      }
      const sId = String((e as any).start);
      const tId = String((e as any).end);
      if (sId !== nodeId && tId !== nodeId) {
        continue;
      }
      const sNode = nodesById.get(sId);
      const tNode = nodesById.get(tId);
      if (!sNode || !tNode) {
        continue;
      }
      if ((sNode as any).isGroup || (tNode as any).isGroup) {
        continue;
      }
      const edgeId = String((e as any).id ?? `${sId}->${tId}`);
      const ports = resolvePortSides(edgeId, sNode, tNode, portPlan);
      if (sId === nodeId) {
        if (ports.startSide !== side) {
          continue;
        }
        const other = rectForNode(tNode);
        const orderCoord = side === 'E' || side === 'W' ? other.cy : other.cx;
        recs.push({ edgeId, endpoint: 'start', orderCoord });
      } else {
        if (ports.endSide !== side) {
          continue;
        }
        const other = rectForNode(sNode);
        const orderCoord = side === 'E' || side === 'W' ? other.cy : other.cx;
        recs.push({ edgeId, endpoint: 'end', orderCoord });
      }
    }
    if (recs.length === 0) {
      return;
    }
    recs.sort(
      (a, b) =>
        a.orderCoord - b.orderCoord ||
        `${a.edgeId}|${a.endpoint}`.localeCompare(`${b.edgeId}|${b.endpoint}`)
    );
    const ts = allocateTs(recs.length);
    for (const [i, rec] of recs.entries()) {
      tByEdgeEndpointKey.set(`${rec.edgeId}|${rec.endpoint}`, ts[i]);
    }
  };

  return { tByEdgeEndpointKey, ensureTsForNodeSide };
}

/**
 * R3 / Phase C1 — push DOMUS-emitted centre endpoints onto per-side
 * distributed ports.
 *
 * DOMUS (§6, source `6784b3d1`) treats vertices as points and delegates
 * port distribution to downstream vertex-expansion. For Mermaid's
 * rectangle nodes, we realise that expansion by reusing the
 * `createPortTAllocator` allocation (t ∈ [0.2, 0.8]) already used by
 * the non-DOMUS backend and replacing the first and last points of
 * each polyline with boundary ports. Interior bends are preserved.
 *
 * Paper anchor: Siebenhaller diss.pdf §2.3.2.1 Kandinsky bend-or-end +
 * κ fine-grid (source `0fb2d84f`). This pass ships distribution-only
 * — the 270°-bend-for-non-straight-edges half is Phase C2, which is
 * not yet implemented. k ≥ 2 sides will therefore still render as
 * parallel off-centre departures rather than centred-straight + bent
 * siblings; that is the correct staged behaviour.
 *
 * Self-loops (routed via `runner.ts:routeSelfLoops`), edges with a
 * group endpoint, and polylines shorter than 2 points are skipped.
 *
 * Micro-segment guard: if pushing an endpoint to the boundary would
 * leave the adjacent segment shorter than 4 Manhattan-units, that
 * endpoint is left at the centre. Protects the `no micro-segments`
 * invariant checked by the DDLT L1 assertions.
 */
export function applyDomusPortDistribution(
  data: LayoutData,
  nodesById: Map<string, Node>,
  portPlan?: PortPlan
): {
  startsAdjusted: number;
  endsAdjusted: number;
  startElbowsInserted: number;
  endElbowsInserted: number;
} {
  const { tByEdgeEndpointKey } = createPortTAllocator({ data, nodesById, portPlan });
  let startsAdjusted = 0;
  let endsAdjusted = 0;
  let startElbowsInserted = 0;
  let endElbowsInserted = 0;
  const MICRO_SEGMENT = 4;
  const EPS = 1e-6;

  for (const edge of data.edges ?? []) {
    const startRaw = (edge as any)?.start;
    const endRaw = (edge as any)?.end;
    if (startRaw == null || endRaw == null) {
      continue;
    }
    const startId = String(startRaw);
    const endId = String(endRaw);
    if (startId === endId) {
      continue;
    }
    const startNode = nodesById.get(startId);
    const endNode = nodesById.get(endId);
    if (!startNode || !endNode) {
      continue;
    }
    if ((startNode as any).isGroup || (endNode as any).isGroup) {
      continue;
    }
    const points = (edge as any).points as Point[] | undefined;
    if (!points || points.length < 2) {
      continue;
    }
    const edgeId = String((edge as any).id ?? `${startId}->${endId}`);

    const ports = resolvePortSides(edgeId, startNode, endNode, portPlan);
    const rs = rectForNode(startNode);
    const re = rectForNode(endNode);
    const tStart = tByEdgeEndpointKey.get(`${edgeId}|start`) ?? 0.5;
    const tEnd = tByEdgeEndpointKey.get(`${edgeId}|end`) ?? 0.5;
    const newStart = computeBoundaryPortAtT(rs, ports.startSide, tStart);
    const newEnd = computeBoundaryPortAtT(re, ports.endSide, tEnd);

    // Start side — replace points[0] with newStart, and if the resulting
    // first segment would be diagonal (off-axis from the next interior
    // point), insert an orthogonal elbow. R14 / iter-10: A1's shape walk
    // anchors bends at the old centre-axis; off-centre ports need a
    // corner to stay axis-aligned.
    const neighborStart = points[1];
    const startSegLen =
      Math.abs(newStart.x - neighborStart.x) + Math.abs(newStart.y - neighborStart.y);
    if (startSegLen >= MICRO_SEGMENT) {
      const startElbow = computeOrthogonalElbow(newStart, neighborStart, ports.startSide, EPS);
      if (startElbow === null) {
        points[0] = newStart;
        startsAdjusted += 1;
      } else {
        const elbowToPort =
          Math.abs(startElbow.x - newStart.x) + Math.abs(startElbow.y - newStart.y);
        const elbowToNeighbor =
          Math.abs(startElbow.x - neighborStart.x) + Math.abs(startElbow.y - neighborStart.y);
        if (elbowToPort >= MICRO_SEGMENT && elbowToNeighbor >= MICRO_SEGMENT) {
          points[0] = newStart;
          points.splice(1, 0, startElbow);
          startsAdjusted += 1;
          startElbowsInserted += 1;
        } else {
          points[0] = newStart;
          startsAdjusted += 1;
        }
      }
    }

    // End side — symmetric. Use post-start-mutation length so we index
    // from the updated points array.
    const n = points.length;
    const neighborEnd = points[n - 2];
    const endSegLen = Math.abs(newEnd.x - neighborEnd.x) + Math.abs(newEnd.y - neighborEnd.y);
    if (endSegLen >= MICRO_SEGMENT) {
      const endElbow = computeOrthogonalElbow(newEnd, neighborEnd, ports.endSide, EPS);
      if (endElbow === null) {
        points[n - 1] = newEnd;
        endsAdjusted += 1;
      } else {
        const elbowToPort = Math.abs(endElbow.x - newEnd.x) + Math.abs(endElbow.y - newEnd.y);
        const elbowToNeighbor =
          Math.abs(endElbow.x - neighborEnd.x) + Math.abs(endElbow.y - neighborEnd.y);
        if (elbowToPort >= MICRO_SEGMENT && elbowToNeighbor >= MICRO_SEGMENT) {
          points[n - 1] = newEnd;
          points.splice(n - 1, 0, endElbow);
          endsAdjusted += 1;
          endElbowsInserted += 1;
        } else {
          points[n - 1] = newEnd;
          endsAdjusted += 1;
        }
      }
    }
  }

  return { startsAdjusted, endsAdjusted, startElbowsInserted, endElbowsInserted };
}

/**
 * Compute the corner point that keeps a segment `port → neighbour`
 * axis-aligned when the port's side imposes a fixed exit axis. Returns
 * `null` when the segment is already axis-aligned (no elbow needed).
 *
 * For side E/W the port exits horizontally → elbow at `(neighbour.x, port.y)`.
 * For side N/S the port exits vertically → elbow at `(port.x, neighbour.y)`.
 */
function computeOrthogonalElbow(
  port: Point,
  neighbour: Point,
  side: PortSide,
  eps: number
): Point | null {
  const dx = Math.abs(port.x - neighbour.x);
  const dy = Math.abs(port.y - neighbour.y);
  if (dx < eps || dy < eps) {
    return null;
  }
  if (side === 'E' || side === 'W') {
    return { x: neighbour.x, y: port.y };
  }
  return { x: port.x, y: neighbour.y };
}
