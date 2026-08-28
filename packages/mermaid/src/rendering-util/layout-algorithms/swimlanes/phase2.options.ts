import type { Graph, NodeId } from './helpers.js';
import { buildLaneModel, readLaneIndex } from './lanes.js';

/**
 * Options controlling how layers are assigned in the Sugiyama pipeline.
 */
export interface LayeringOptions {
  /** If true, a node with exactly one incoming edge inherits its predecessor's layer. */
  compactSingleInput?: boolean;
  /** If true, ignore edges from other lanes when calculating layer positions. */
  ignoreCrossLaneEdges?: boolean;
  /** If true, try to lift nodes to reduce crossings between layers. */
  optimizeRanksByCrossings?: boolean;
  /** Diagram direction, used by lane-aware rank heuristics with direction-specific failure modes. */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}

/**
 * Computes the "top lane" (outermost group container) for each node.
 *
 * Returns a map from node id -\> lane id (top-level group) or null if the node
 * does not belong to any lane.
 */
export function buildTopLaneMap(g: Graph): Map<NodeId, string | null> {
  const model = buildLaneModel(g.layout.nodes ?? []);
  const cache = new Map<NodeId, string | null>();
  for (const id of g.nodes) {
    cache.set(id, model.laneIdOf(id));
  }
  return cache;
}

export function createTopLaneResolver(g: Graph): (id: NodeId) => string | null {
  const topLaneMap = buildTopLaneMap(g);
  return (id: NodeId): string | null => topLaneMap.get(id) ?? null;
}

export function buildTopLaneOrder(g: Graph): string[] {
  const nodes = g.layout.nodes ?? [];
  const model = buildLaneModel(nodes);
  const laneNodes = nodes.filter((node) => model.isLane(node.id));

  // A diagram can state the order outright. That is honoured only when every lane says
  // where it goes, so a partially numbered diagram falls back to one consistent rule
  // rather than mixing two.
  const indexed = laneNodes.filter((node) => readLaneIndex(node) !== undefined);
  if (indexed.length > 0 && indexed.length === laneNodes.length) {
    return [...indexed]
      .sort((a, b) => (readLaneIndex(a) ?? 0) - (readLaneIndex(b) ?? 0))
      .map((node) => node.id);
  }

  // Otherwise the order is inferred from the node array, and reversed because flowchart
  // emits its subgraphs back to front (`flowDb.getData`), which is the only producer
  // that inference was written against.
  if (!model.hasPools) {
    return [...new Set(laneNodes.map((node) => node.id))].reverse();
  }

  // With pools, walk the top-level containers and expand each pool into its own lanes,
  // so a later reordering pass cannot interleave the lanes of two pools.
  const lanes: string[] = [];
  for (const node of nodes) {
    if (node.parentId) {
      continue;
    }
    if (model.isPool(node.id)) {
      lanes.push(...(model.lanesByPool.get(node.id) ?? []));
    } else if (model.isLane(node.id)) {
      lanes.push(node.id);
    }
  }
  return [...new Set(lanes)].reverse();
}

export function resolveTopLaneOrder(g: Graph, preferredOrder?: string[]): string[] {
  const sourceOrder = buildTopLaneOrder(g);
  if (!preferredOrder || preferredOrder.length === 0) {
    return sourceOrder;
  }

  const sourceLaneIds = new Set(sourceOrder);
  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const laneId of preferredOrder) {
    if (!sourceLaneIds.has(laneId) || seen.has(laneId)) {
      continue;
    }
    seen.add(laneId);
    resolved.push(laneId);
  }
  for (const laneId of sourceOrder) {
    if (seen.has(laneId)) {
      continue;
    }
    resolved.push(laneId);
  }
  return resolved;
}
