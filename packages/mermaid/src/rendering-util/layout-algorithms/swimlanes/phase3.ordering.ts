import type { Graph, Layering, OrderedLayers, NodeId, Edge } from './helpers.js';
import { buildLayerIndex, countInversions } from './phase0.helpers.js';
import { buildTopLaneOrder, createTopLaneResolver } from './phase2.options.js';

type SweepDirection = 'down' | 'up';

function median(values: number[]): number {
  const n = values.length;
  if (n === 0) {
    return Number.POSITIVE_INFINITY;
  }
  const a = [...values].sort((x, y) => x - y);
  if (n % 2 === 1) {
    return a[(n - 1) / 2];
  }
  return 0.5 * (a[n / 2 - 1] + a[n / 2]);
}

function barycenter(values: number[]): number {
  if (values.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  const s = values.reduce((acc, v) => acc + v, 0);
  return s / values.length;
}

function neighborPositionsFor(
  targetNodes: NodeId[],
  fixedIndex: Map<NodeId, number>,
  edges: Edge[],
  direction: SweepDirection
): Map<NodeId, number[]> {
  const neighborPositions = new Map<NodeId, number[]>();
  for (const v of targetNodes) {
    neighborPositions.set(v, []);
  }
  for (const e of edges) {
    if (direction === 'down') {
      if (fixedIndex.has(e.src) && neighborPositions.has(e.dst)) {
        neighborPositions.get(e.dst)!.push(fixedIndex.get(e.src)!);
      }
    } else if (fixedIndex.has(e.dst) && neighborPositions.has(e.src)) {
      neighborPositions.get(e.src)!.push(fixedIndex.get(e.dst)!);
    }
  }
  return neighborPositions;
}

function currentOrderTieBreak(
  a: NodeId,
  b: NodeId,
  currentLayerIndex: Map<NodeId, number>
): number {
  const ia = currentLayerIndex.get(a) ?? 0;
  const ib = currentLayerIndex.get(b) ?? 0;
  return ia !== ib ? ia - ib : a.localeCompare(b);
}

function countCrossingsBetweenAdjacent(upper: NodeId[], lower: NodeId[], edges: Edge[]): number {
  // Filter edges between these two layers
  const upperSet = new Set(upper);
  const lowerSet = new Set(lower);
  const upperIndex = buildLayerIndex(upper);
  const lowerIndex = buildLayerIndex(lower);
  const pairs: { u: number; v: number }[] = [];
  for (const e of edges) {
    if (upperSet.has(e.src) && lowerSet.has(e.dst)) {
      pairs.push({ u: upperIndex.get(e.src)!, v: lowerIndex.get(e.dst)! });
    }
  }
  // Sort by u, count inversions in v
  pairs.sort((a, b) => (a.u === b.u ? a.v - b.v : a.u - b.u));
  const vs = pairs.map((p) => p.v);
  return countInversions(vs);
}

export function totalCrossings(layers: NodeId[][], edges: Edge[]): number {
  let sum = 0;
  for (let i = 0; i + 1 < layers.length; i++) {
    sum += countCrossingsBetweenAdjacent(layers[i], layers[i + 1], edges);
  }
  return sum;
}

/**
 * Sort a subset of nodes by their median score relative to a fixed layer.
 * This is the core sorting logic extracted for reuse per-lane.
 */
function sortByHeuristic(
  nodes: NodeId[],
  neighborPositions: Map<NodeId, number[]>,
  currentLayerIndex: Map<NodeId, number>
): NodeId[] {
  return [...nodes].sort((a, b) => {
    const sa = median(neighborPositions.get(a) ?? []);
    const sb = median(neighborPositions.get(b) ?? []);
    if (sa === sb) {
      return currentOrderTieBreak(a, b, currentLayerIndex);
    }
    if (!isFinite(sa)) {
      return 1;
    }
    if (!isFinite(sb)) {
      return -1;
    }
    return sa - sb;
  });
}

function reorderLayer(
  fixedLayer: NodeId[],
  targetLayer: NodeId[],
  edges: Edge[],
  direction: SweepDirection,
  topLaneOf?: (id: NodeId) => string | null,
  laneOrder?: string[]
): NodeId[] {
  const fixedIndex = buildLayerIndex(fixedLayer);
  const currIndex = buildLayerIndex(targetLayer);
  const neighborPositions = neighborPositionsFor(targetLayer, fixedIndex, edges, direction);

  // If no lane info, fall back to flat reorder (original behavior)
  if (!topLaneOf || !laneOrder || laneOrder.length === 0) {
    return sortByHeuristic(targetLayer, neighborPositions, currIndex);
  }

  // Partition target layer nodes by lane
  const byLane = new Map<string | null, NodeId[]>();
  for (const id of targetLayer) {
    const lane = topLaneOf(id);
    const arr = byLane.get(lane) ?? [];
    arr.push(id);
    byLane.set(lane, arr);
  }

  // Reorder nodes within each lane independently
  const result: NodeId[] = [];

  // First, place lane-grouped nodes in lane order
  for (const lane of laneOrder) {
    const nodesInLane = byLane.get(lane);
    if (!nodesInLane || nodesInLane.length === 0) {
      continue;
    }
    const sorted = sortByHeuristic(nodesInLane, neighborPositions, currIndex);
    result.push(...sorted);
  }

  // Then, handle null-lane nodes (long-edge dummies without a parent).
  // Compute their barycenter and insert them adjacent to the lane whose
  // center position is closest to their barycenter.
  const nullNodes = byLane.get(null);
  if (nullNodes && nullNodes.length > 0) {
    // Sort null-lane nodes by their barycenter across the full layer
    const sorted = sortByHeuristic(nullNodes, neighborPositions, currIndex);

    // For each null-lane node, find the best insertion position
    // based on its connections to nodes already in the result
    for (const nid of sorted) {
      // Compute the barycenter position of this node's neighbors in the fixed layer
      const bc = barycenter(neighborPositions.get(nid) ?? []);

      // Find the best insertion point: scan result and insert where the
      // node's barycenter fits relative to its neighbors
      let bestIdx = result.length; // default: append at end
      if (isFinite(bc)) {
        // Find insertion point by comparing barycenter against positions of
        // nodes already placed. Insert before the first node whose fixed-layer
        // neighbor position is greater than this node's barycenter.
        for (const [i, rid] of result.entries()) {
          const rBc = barycenter(neighborPositions.get(rid) ?? []);
          if (bc < rBc) {
            bestIdx = i;
            break;
          }
        }
      }
      result.splice(bestIdx, 0, nid);
    }
  }

  return result;
}

function transposeImprove(
  upper: NodeId[],
  current: NodeId[],
  edges: Edge[],
  next?: NodeId[],
  topLaneOf?: (id: NodeId) => string | null
): NodeId[] {
  const best = [...current];
  const upperSet = new Set(upper);
  const layerSet = new Set(current);
  const nextSet = next ? new Set(next) : null;

  const edgesIn = edges.filter((e) => upperSet.has(e.src) && layerSet.has(e.dst));
  const edgesOut = nextSet
    ? edges.filter((e) => layerSet.has(e.src) && nextSet.has(e.dst))
    : undefined;

  const crossingScore = (order: NodeId[]): number => {
    let score = countCrossingsBetweenAdjacent(upper, order, edgesIn);
    if (edgesOut && next) {
      score += countCrossingsBetweenAdjacent(order, next, edgesOut);
    }
    return score;
  };

  // Precompute lane membership for same-lane check
  const laneOf = topLaneOf ? new Map<NodeId, string | null>() : null;
  if (topLaneOf && laneOf) {
    for (const id of current) {
      laneOf.set(id, topLaneOf(id));
    }
  }

  let improved = true;
  let bestScore = crossingScore(best);
  while (improved) {
    improved = false;
    for (let i = 0; i + 1 < best.length; i++) {
      // Only swap nodes in the same lane (or both null-lane)
      if (laneOf) {
        const laneA = laneOf.get(best[i]);
        const laneB = laneOf.get(best[i + 1]);
        if (laneA !== laneB) {
          continue; // never swap across lane boundaries
        }
      }

      const prev = bestScore;
      [best[i], best[i + 1]] = [best[i + 1], best[i]];
      const nextScore = crossingScore(best);
      if (nextScore < prev) {
        bestScore = nextScore;
        improved = true;
      } else {
        [best[i], best[i + 1]] = [best[i + 1], best[i]];
      }
    }
  }
  return best;
}

// Sugiyama phase 3: lane-aware median sweeps plus adjacent transpose improvements.
export function orderLayers(layering: Layering, gWithDummies: Graph): OrderedLayers {
  // Start with deterministic initial order per layer (preserve given order)
  const layers = layering.layers.map((l) => [...l]);
  const edges = gWithDummies.edges;

  // Compute lane order for lane-aware crossing minimization (Siebenhaller Lemma 4.4)
  const topLaneOf = createTopLaneResolver(gWithDummies);
  const laneOrder = buildTopLaneOrder(gWithDummies);

  // Perform top-down / bottom-up sweeps
  for (let s = 0; s < 3; s++) {
    // Top-down: reorder layer i based on neighbors in layer i-1
    for (let i = 1; i < layers.length; i++) {
      layers[i] = reorderLayer(layers[i - 1], layers[i], edges, 'down', topLaneOf, laneOrder);
      layers[i] = transposeImprove(layers[i - 1], layers[i], edges, layers[i + 1], topLaneOf);
    }
    // Bottom-up: reorder layer i based on neighbors in layer i+1
    for (let i = layers.length - 2; i >= 0; i--) {
      layers[i] = reorderLayer(layers[i + 1], layers[i], edges, 'up', topLaneOf, laneOrder);
      layers[i] = transposeImprove(layers[i + 1], layers[i], edges, layers[i - 1], topLaneOf);
    }
  }

  return { layers };
}
