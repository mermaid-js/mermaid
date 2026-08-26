/**
 * HOLA Step 1: topological decomposition (guide §10).
 *
 * Undirected leaf peeling, nothing else. In particular:
 *   - no cycle is broken first (invariant 1);
 *   - edge labels are not vertices, so they cannot change a degree (invariant 2);
 *   - the core is *not* derived from a directed topological sort;
 *   - `rho` is recorded when a node is pruned and never path-compressed, so a
 *     pruned node remembers the neighbour it actually hung from.
 */

import type { HolaEdge, HolaGraph, HolaNode } from '../model.js';
import { addEdge, addNode, createGraph, degree } from '../model.js';
import { rootCopyId, topologicalEdgeId } from '../ids.js';

export interface DecomposedTree {
  id: string;
  /** Pruned nodes plus one copy of the core node the tree hangs from. */
  graph: HolaGraph;
  /** Id of the copied root inside `graph`. */
  rootCopyId: string;
  /** The core node the copy stands for. */
  coreNodeId: string;
}

export interface Decomposition {
  /** Empty when the whole component is a tree. */
  core: HolaGraph;
  trees: DecomposedTree[];
  /** Set when the component has no cycle: the whole component is one tree. */
  pureTree?: { graph: HolaGraph; rootId: string };
}

/**
 * A connected simple graph is a tree exactly when it has |V| − 1 edges
 * (guide §10.1). Self-loops and parallel edges have already been collapsed
 * out of the topology, so this test is exact.
 */
export function isPureTree(graph: HolaGraph): boolean {
  return graph.edges.size === graph.nodes.size - 1;
}

/**
 * Deterministic root for an acyclic component: the tree centre, found by
 * repeatedly stripping leaves. One or two vertices survive; with two, the one
 * declared first in the Mermaid source wins.
 */
export function selectPureTreeRoot(graph: HolaGraph): string {
  const ids = [...graph.nodes.keys()];
  if (ids.length === 0) {
    throw new Error('selectPureTreeRoot called on an empty graph');
  }
  if (ids.length <= 2) {
    return firstByInputOrder(graph, ids);
  }

  const remainingDegree = new Map<string, number>();
  for (const id of ids) {
    remainingDegree.set(id, degree(graph, id));
  }
  let remaining = ids.length;
  let layer = ids.filter((id) => (remainingDegree.get(id) ?? 0) <= 1);

  while (remaining > 2 && layer.length > 0) {
    const next: string[] = [];
    remaining -= layer.length;
    for (const id of layer) {
      remainingDegree.set(id, 0);
      for (const neighbour of graph.adjacency.get(id) ?? []) {
        const d = remainingDegree.get(neighbour) ?? 0;
        if (d <= 0) {
          continue;
        }
        remainingDegree.set(neighbour, d - 1);
        if (d - 1 === 1) {
          next.push(neighbour);
        }
      }
    }
    layer = next;
  }

  const centres = layer.length > 0 ? layer : ids;
  return firstByInputOrder(graph, centres);
}

export interface DecomposeOptions {
  /**
   * Nodes that must not be peeled, however few neighbours they have left.
   *
   * Peeling is a purely topological rule, and there are groupings it cannot see. A
   * caller that draws subgraph containers has one: pulling a node out of a container
   * whose other members stay in the core splits that container between the core and
   * a tree, and no later stage can put it back together — the two halves are laid
   * out by different algorithms and placed by different rules.
   *
   * Naming the members is enough to keep the whole branch: a protected leaf keeps
   * its parent's degree above one, so nothing between it and the core becomes a leaf
   * either. Empty by default, which is plain HOLA (guide §10).
   */
  keepInCore?: ReadonlySet<string>;
}

export function decompose(graph: HolaGraph, options?: DecomposeOptions): Decomposition {
  if (isPureTree(graph)) {
    return {
      core: createGraph(),
      trees: [],
      pureTree: { graph, rootId: selectPureTreeRoot(graph) },
    };
  }

  // ---- iterative leaf peeling -------------------------------------------
  const active = new Set(graph.nodes.keys());
  const liveDegree = new Map<string, number>();
  for (const id of active) {
    liveDegree.set(id, degree(graph, id));
  }

  const pruned: string[] = [];
  const prunedSet = new Set<string>();
  const rho = new Map<string, string>();

  for (;;) {
    const leaves = [...active].filter(
      (id) => liveDegree.get(id) === 1 && !options?.keepInCore?.has(id)
    );
    if (leaves.length === 0) {
      break;
    }

    // Record every attachment for the whole round before removing anything,
    // so two leaves peeled in the same round cannot steal each other's parent.
    for (const leaf of leaves) {
      const parent = [...(graph.adjacency.get(leaf) ?? [])].find((n) => active.has(n));
      if (parent !== undefined) {
        rho.set(leaf, parent);
      }
    }

    for (const leaf of leaves) {
      active.delete(leaf);
      pruned.push(leaf);
      prunedSet.add(leaf);
      for (const neighbour of graph.adjacency.get(leaf) ?? []) {
        if (active.has(neighbour)) {
          liveDegree.set(neighbour, (liveDegree.get(neighbour) ?? 1) - 1);
        }
      }
    }
  }

  if (active.size === 0) {
    // Defensive: a connected simple graph with a cycle always keeps a core.
    return {
      core: createGraph(),
      trees: [],
      pureTree: { graph, rootId: selectPureTreeRoot(graph) },
    };
  }

  // ---- core --------------------------------------------------------------
  const core = createGraph();
  for (const id of orderByInput(graph, [...active])) {
    addNode(core, cloneNode(graph.nodes.get(id)!));
  }
  for (const edge of graph.edges.values()) {
    if (active.has(edge.source) && active.has(edge.target)) {
      addEdge(core, cloneEdge(edge));
    }
  }

  // ---- pruned forest H ---------------------------------------------------
  const forest = createGraph();
  for (const id of orderByInput(graph, pruned)) {
    addNode(forest, cloneNode(graph.nodes.get(id)!));
  }
  for (const edge of graph.edges.values()) {
    if (prunedSet.has(edge.source) && prunedSet.has(edge.target)) {
      addEdge(forest, cloneEdge(edge));
    }
  }

  // ---- one tree per component of H, rooted at a copy of its core node ----
  const trees: DecomposedTree[] = [];
  for (const componentIds of connectedComponents(forest)) {
    const attachments = new Set<string>();
    for (const id of componentIds) {
      const parent = rho.get(id);
      if (parent !== undefined && active.has(parent)) {
        attachments.add(parent);
      }
    }
    if (attachments.size === 0) {
      continue;
    }

    // Leaf peeling guarantees a single attachment point per component. Should a
    // future topology break that assumption, split rather than mis-root.
    const single = attachments.size === 1;
    for (const coreNodeId of [...attachments].sort()) {
      const members = single
        ? componentIds
        : componentIds.filter((id) => rho.get(id) === coreNodeId);
      if (members.length === 0) {
        continue;
      }
      trees.push(buildTree(graph, forest, members, coreNodeId, rho, trees.length));
    }
  }

  return { core, trees };
}

function buildTree(
  source: HolaGraph,
  forest: HolaGraph,
  memberIds: string[],
  coreNodeId: string,
  rho: Map<string, string>,
  treeIndex: number
): DecomposedTree {
  const graph = createGraph();
  const copyId = rootCopyId(coreNodeId, treeIndex);
  const coreNode = source.nodes.get(coreNodeId)!;
  addNode(graph, { ...coreNode, id: copyId, x: 0, y: 0 });

  const members = new Set(memberIds);
  for (const id of orderByInput(forest, memberIds)) {
    addNode(graph, cloneNode(forest.nodes.get(id)!));
  }
  for (const edge of forest.edges.values()) {
    if (members.has(edge.source) && members.has(edge.target)) {
      addEdge(graph, cloneEdge(edge));
    }
  }

  // Re-attach the pruned nodes that hung directly off the core node, rewired to
  // the copy. The original Mermaid edge bundle travels with the rewired edge so
  // final routing can restore it.
  for (const id of orderByInput(forest, memberIds)) {
    if (rho.get(id) !== coreNodeId) {
      continue;
    }
    const original = findTopologicalEdge(source, id, coreNodeId);
    addEdge(graph, {
      id: topologicalEdgeId(id, copyId),
      source: copyId,
      target: id,
      originalEdgeIds: original ? [...original.originalEdgeIds] : [],
      route: [],
      mandatoryWaypoints: [],
    });
  }

  return { id: `tree:${treeIndex}:${coreNodeId}`, graph, rootCopyId: copyId, coreNodeId };
}

export function findTopologicalEdge(graph: HolaGraph, a: string, b: string): HolaEdge | undefined {
  for (const edge of graph.edges.values()) {
    if ((edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)) {
      return edge;
    }
  }
  return undefined;
}

export function connectedComponents(graph: HolaGraph): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const id of graph.nodes.keys()) {
    if (seen.has(id)) {
      continue;
    }
    const stack = [id];
    const component: string[] = [];
    seen.add(id);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);
      for (const neighbour of graph.adjacency.get(current) ?? []) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          stack.push(neighbour);
        }
      }
    }
    components.push(component);
  }
  return components;
}

function orderByInput(graph: HolaGraph, ids: string[]): string[] {
  return [...ids].sort(
    (a, b) => (graph.nodes.get(a)?.inputOrder ?? 0) - (graph.nodes.get(b)?.inputOrder ?? 0)
  );
}

function firstByInputOrder(graph: HolaGraph, ids: string[]): string {
  return orderByInput(graph, ids)[0];
}

function cloneNode(node: HolaNode): HolaNode {
  return { ...node };
}

function cloneEdge(edge: HolaEdge): HolaEdge {
  return {
    ...edge,
    originalEdgeIds: [...edge.originalEdgeIds],
    route: [],
    mandatoryWaypoints: [],
  };
}
