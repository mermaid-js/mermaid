import type { NodeId } from './helpers.js';

// cspell:ignore multitree
/**
 * Utilities shared by the multitree-based layer ordering logic.
 */
export function annotateMinimumLayers(
  nodes: NodeId[],
  children: Map<NodeId, NodeId[]>,
  rankOf: Record<NodeId, number>
): Map<NodeId, number> {
  const minLayer = new Map<NodeId, number>();

  const annotate = (node: NodeId) => {
    let minL = rankOf[node] ?? 0;
    const childList = [...(children.get(node) ?? [])];
    childList.sort(compareByRankThenId(rankOf));
    for (const child of childList) {
      annotate(child);
      const childMin = minLayer.get(child);
      if (childMin != null) {
        minL = Math.min(minL, childMin);
      }
    }
    minLayer.set(node, minL);
  };

  for (const node of nodes) {
    annotate(node);
  }

  return minLayer;
}

export function compareByRankThenId(rankOf: Record<NodeId, number>) {
  return (a: NodeId, b: NodeId) => {
    const ra = rankOf[a] ?? 0;
    const rb = rankOf[b] ?? 0;
    return ra === rb ? a.localeCompare(b) : ra - rb;
  };
}

/**
 * Emits nodes into layers in tree traversal order, using the provided
 * orderChildren function to determine the order of children.
 */
export function emitNodesInTreeOrder(
  roots: NodeId[],
  allNodes: NodeId[],
  rankOf: Record<NodeId, number>,
  orderChildren: (node: NodeId) => NodeId[]
): NodeId[][] {
  let maxRank = 0;
  for (const node of allNodes) {
    const r = rankOf[node] ?? 0;
    if (r > maxRank) {
      maxRank = r;
    }
  }

  const layers: NodeId[][] = Array.from({ length: maxRank + 1 }, () => []);
  const emitted = new Set<NodeId>();

  const emit = (node: NodeId) => {
    if (emitted.has(node)) {
      return;
    }
    emitted.add(node);
    const layer = rankOf[node] ?? 0;
    if (!layers[layer]) {
      layers[layer] = [];
    }
    layers[layer].push(node);
    for (const child of orderChildren(node)) {
      emit(child);
    }
  };

  for (const root of roots) {
    emit(root);
  }

  // Fallback for isolated nodes (if any were not connected through spanning forest)
  for (const node of allNodes) {
    if (!emitted.has(node)) {
      const layer = rankOf[node] ?? 0;
      if (!layers[layer]) {
        layers[layer] = [];
      }
      layers[layer].push(node);
      emitted.add(node);
    }
  }

  return layers;
}

/**
 * Removes duplicate nodes from each layer while preserving order.
 */
export function deduplicateLayers(layers: NodeId[][]): NodeId[][] {
  const result: NodeId[][] = [];
  for (const layer of layers) {
    const seen = new Set<NodeId>();
    const deduped: NodeId[] = [];
    for (const id of layer) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      deduped.push(id);
    }
    result.push(deduped);
  }
  return result;
}
