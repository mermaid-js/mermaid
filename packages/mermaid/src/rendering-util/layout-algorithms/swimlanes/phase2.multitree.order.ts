import type { Graph, NodeId } from './helpers.js';
import { buildDrivingTree } from './driving-tree.js';
import { computeSubtreeCrossCounts } from './phase2.crossCounts.js';
import {
  annotateMinimumLayers,
  compareByRankThenId,
  emitNodesInTreeOrder,
  deduplicateLayers,
} from './phase2.multitree.core.js';

// cspell:ignore multitree Multitree

/**
 * Creates a function that orders children by crossing counts and minimum layers.
 * Children in future layers are ordered by their minimum layer, while children
 * in the current layer are ordered by crossing counts.
 */
function createChildOrderer(
  children: Map<NodeId, NodeId[]>,
  rankOf: Record<NodeId, number>,
  crossCounts: Map<NodeId, Map<NodeId, number>>,
  minLayer: Map<NodeId, number>
): (node: NodeId) => NodeId[] {
  return (node: NodeId): NodeId[] => {
    const raw = children.get(node) ?? [];
    if (raw.length === 0) {
      return [];
    }
    const layer = rankOf[node] ?? 0;
    const future: { child: NodeId; min: number }[] = [];
    const present: NodeId[] = [];
    const crossMap = crossCounts.get(node);

    for (const child of raw) {
      const minL = minLayer.get(child) ?? layer;
      if (minL > layer) {
        future.push({ child, min: minL });
      } else {
        present.push(child);
      }
    }

    future.sort((a, b) => {
      if (a.min === b.min) {
        return a.child.localeCompare(b.child);
      }
      return a.min - b.min;
    });

    present.sort((a, b) => {
      const ca = crossMap?.get(a) ?? 0;
      const cb = crossMap?.get(b) ?? 0;
      if (ca !== cb) {
        return ca - cb;
      }
      const ma = minLayer.get(a) ?? layer;
      const mb = minLayer.get(b) ?? layer;
      if (ma !== mb) {
        return ma - mb;
      }
      return a.localeCompare(b);
    });

    return [...future.map((item) => item.child), ...present];
  };
}

/**
 * Builds a layering (array of layers) by traversing the driving tree in a
 * multitree order that tries to minimize crossings.
 */
export function buildMultitreeLayerOrder(
  g: Graph,
  rankOf: Record<NodeId, number>,
  laneOf: (id: NodeId) => string | null
): NodeId[][] {
  const tree = buildDrivingTree(g, {
    rankHint: rankOf,
    laneOf,
  });
  const { children, roots } = tree;

  // Ensure all nodes have a children entry
  for (const node of g.nodes) {
    if (!children.has(node)) {
      children.set(node, []);
    }
  }

  const crossCounts = computeSubtreeCrossCounts(g, rankOf, tree);

  const rootsSorted = [...roots].sort(compareByRankThenId(rankOf));

  // Annotate each node with the minimum layer in its subtree
  const minLayer = annotateMinimumLayers(rootsSorted, children, rankOf);

  // Create a function to order children by crossing counts
  const orderChildren = createChildOrderer(children, rankOf, crossCounts, minLayer);

  // Emit nodes in tree order
  let layers = emitNodesInTreeOrder(rootsSorted, g.nodes, rankOf, orderChildren);

  // Deduplicate each layer
  layers = deduplicateLayers(layers);

  return layers;
}
