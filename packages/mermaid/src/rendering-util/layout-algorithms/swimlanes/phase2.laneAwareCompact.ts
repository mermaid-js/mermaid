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
  let frontier = sortedZeroInDegreeNodes(indeg);
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

// Lane-aware compact layering: one node per (layer, lane); inter-lane edges can stay on same layer
export function assignLayers_LaneAwareCompact(gAcyclic: Graph, opts?: LayeringOptions): Layering {
  const g = normalizeGraph(gAcyclic);
  const order =
    opts?.direction === 'LR'
      ? (topoSortByGenerationIfAcyclic(g) ?? [...g.nodes].sort())
      : (topoSortIfAcyclic(g) ?? [...g.nodes].sort());

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

  for (const v of order) {
    const node = g.nodeById.get(v) as any;
    if (node?.isGroup) {
      continue;
    } // do not assign ranks/capacity to lane/group containers
    const preds = incoming(g, v);
    let base = 0;
    if (preds.length > 0) {
      for (const e of preds) {
        const u = e.src;
        const ru = rankOf[u] ?? 0;
        base = Math.max(base, ru + edgeWeight(u, v));
      }
    }
    const lane = laneOf(v);
    const nf = nextFree.get(lane) ?? 0;
    const L = Math.max(base, nf);
    rankOf[v] = L;
    nextFree.set(lane, L + 1);
  }

  const layers = buildLayersFromRanks(g, order, rankOf, { skipGroups: true });

  return { layers, rankOf, dummy: new Set<NodeId>() };
}
