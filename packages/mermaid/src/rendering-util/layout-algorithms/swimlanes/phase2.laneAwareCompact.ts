import type { Graph, Layering, NodeId } from './helpers.js';
import {
  buildInDegreeMap,
  buildLayersFromRanks,
  buildSortedSuccessorMap,
  incoming,
  normalizeGraph,
  sortedZeroInDegreeNodes,
  topoSortIfAcyclic,
} from './phase0.helpers.js';
import type { LayeringOptions } from './phase2.options.js';
import { createTopLaneResolver } from './phase2.options.js';

// cspell:ignore indeg preds topo

function topoSortByGenerationIfAcyclic(g: Graph): NodeId[] | null {
  const indeg = buildInDegreeMap(g);
  const adj = buildSortedSuccessorMap(g);
  let frontier = sortedZeroInDegreeNodes(g, indeg);
  const order: NodeId[] = [];

  while (frontier.length > 0) {
    const nextFrontier: NodeId[] = [];
    for (const u of frontier) {
      order.push(u);
      for (const v of adj.get(u) ?? []) {
        indeg.set(v, (indeg.get(v) ?? 0) - 1);
        if ((indeg.get(v) ?? 0) === 0) {
          nextFrontier.push(v);
        }
      }
    }
    frontier = nextFrontier.sort((a, b) => a.localeCompare(b));
  }

  return order.length === g.nodes.length ? order : null;
}

function topologicalOrder(g: Graph, direction: LayeringOptions['direction']): NodeId[] {
  const sorted = direction === 'LR' ? topoSortByGenerationIfAcyclic(g) : topoSortIfAcyclic(g);
  return sorted ?? [...g.nodes].sort();
}

/**
 * Hands out the lowest layer a node may use so that bands stack: a band starts below the
 * last layer any earlier band used. Without a `bandOf` every node's floor is layer 0.
 */
function createBandFloor(bandOf: LayeringOptions['bandOf']) {
  let currentBand: number | undefined;
  let floor = 0;
  let lowestUsed = -1;
  return {
    floorFor(id: NodeId): number {
      if (bandOf && bandOf(id) !== currentBand) {
        currentBand = bandOf(id);
        floor = lowestUsed + 1;
      }
      return floor;
    },
    record(rank: number): void {
      lowestUsed = Math.max(lowestUsed, rank);
    },
  };
}

// Lane-aware compact layering: one node per (layer, lane); inter-lane edges can stay on same layer
export function assignLayers_LaneAwareCompact(gAcyclic: Graph, opts?: LayeringOptions): Layering {
  const g = normalizeGraph(gAcyclic);
  const order = topologicalOrder(g, opts?.direction);
  // Bands are placed one after the other. Sorting is stable, so the order inside a band is the
  // topological one, and since every edge runs forward or inside a band it stays topological.
  const bandOf = opts?.bandOf;
  const visiting = bandOf ? [...order].sort((a, b) => bandOf(a) - bandOf(b)) : order;
  const bands = createBandFloor(bandOf);

  // Determine a lane id for each node: top-level parent id, or fall back to node id if none
  const topLaneOf = createTopLaneResolver(g);
  const laneOf = (id: NodeId): string => topLaneOf(id) ?? id;

  const rankOf: Record<NodeId, number> = Object.create(null);
  const nextFree = new Map<string, number>();

  // Helper: edge weight w(u,v) = 1 if same lane else 0, when ignoring cross-lane constraints;
  // otherwise 1 for all edges.
  const edgeWeight = (u: NodeId, v: NodeId): number => {
    const ignoreCrossLane = opts?.ignoreCrossLaneEdges ?? true;
    if (ignoreCrossLane) {
      return laneOf(u) === laneOf(v) ? 1 : 0;
    }
    return 1;
  };
  const rankFromPredecessors = (v: NodeId): number =>
    incoming(g, v).reduce(
      (base, e) => Math.max(base, (rankOf[e.src] ?? 0) + edgeWeight(e.src, v)),
      0
    );

  for (const v of visiting) {
    if (g.nodeById.get(v)?.isGroup) {
      continue; // do not assign ranks/capacity to lane/group containers
    }
    const lane = laneOf(v);
    const L = Math.max(rankFromPredecessors(v), nextFree.get(lane) ?? 0, bands.floorFor(v));
    rankOf[v] = L;
    nextFree.set(lane, L + 1);
    bands.record(L);
  }

  const layers = buildLayersFromRanks(g, order, rankOf, { skipGroups: true });

  return { layers, rankOf, dummy: new Set<NodeId>() };
}
