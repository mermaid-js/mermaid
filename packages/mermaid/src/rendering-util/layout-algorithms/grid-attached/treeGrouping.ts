/**
 * One tree per core node.
 *
 * HOLA's decomposition returns one tree per connected component of the pruned
 * forest (guide §10), and that is the right definition — but it means a core node
 * with five pendant leaves yields *five* trees, because five isolated leaves are
 * five components. Placement then makes five independent decisions for them: each
 * competes for the same wedges at the same node, each commits a footprint the next
 * has to avoid, and the later ones are pushed further and further out. In HOLA's own
 * main example that produced 97 trees on 39 core nodes, 41 of them placed with a
 * flaw and connectors sliding up to 1500px across the drawing — which is what a
 * reader sees as tangle.
 *
 * Merging them costs nothing and fixes the cause. Everything hanging off one core
 * node becomes one rooted tree, so:
 *
 *   - the symmetric tree layout sees a star and lays its leaves out as one balanced
 *     fan, which is what they are;
 *   - placement makes one decision for the whole fan instead of five that cannot see
 *     each other;
 *   - the connectors become one fan on one side of the node, so the comb in
 *     `treeConnectors` spaces them out instead of five separate single connectors
 *     each taking the centre of whatever side it landed on.
 *
 * This is a grouping choice, not a change to the decomposition: the same nodes and
 * the same edges are drawn, rooted at the same core node. It is also what the
 * paper's own figures show — pendant leaves fanned neatly around their node.
 */

import type { DecomposedTree } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import { addEdge, addNode, createGraph } from '../hola-faithful/model.js';

/**
 * Merge every tree that hangs off the same core node into one.
 *
 * A core node with a single tree is passed through untouched, so the common case
 * costs nothing and the result is HOLA's own.
 */
export function mergeTreesByRoot(trees: DecomposedTree[]): DecomposedTree[] {
  const byRoot = new Map<string, DecomposedTree[]>();
  for (const tree of trees) {
    const group = byRoot.get(tree.coreNodeId);
    if (group) {
      group.push(tree);
    } else {
      byRoot.set(tree.coreNodeId, [tree]);
    }
  }

  const merged: DecomposedTree[] = [];
  for (const [coreNodeId, group] of byRoot) {
    merged.push(group.length === 1 ? group[0] : mergeGroup(coreNodeId, group));
  }
  return merged;
}

function mergeGroup(coreNodeId: string, group: DecomposedTree[]): DecomposedTree {
  const first = group[0];
  const rootCopyId = first.rootCopyId;
  const graph = createGraph();

  // One copy of the core node stands for all of them; the copies the other trees
  // were rooted on are the same node, so they collapse onto this one.
  const root = first.graph.nodes.get(rootCopyId);
  if (root) {
    addNode(graph, { ...root });
  }

  for (const tree of group) {
    for (const node of tree.graph.nodes.values()) {
      if (node.id === tree.rootCopyId) {
        continue;
      }
      addNode(graph, { ...node });
    }
  }

  for (const tree of group) {
    for (const edge of tree.graph.edges.values()) {
      addEdge(graph, {
        ...edge,
        source: edge.source === tree.rootCopyId ? rootCopyId : edge.source,
        target: edge.target === tree.rootCopyId ? rootCopyId : edge.target,
        originalEdgeIds: [...edge.originalEdgeIds],
      });
    }
  }

  return { id: `tree:${coreNodeId}`, graph, rootCopyId, coreNodeId };
}
