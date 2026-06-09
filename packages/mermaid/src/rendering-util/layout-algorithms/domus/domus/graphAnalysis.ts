/**
 * Graph Analysis Algorithms for DOMUS
 *
 * Implements:
 * - Biconnected component detection
 * - Cycle basis computation via BFS tree
 *
 * Reference: (DOMUS, p.10, §4.3)
 */

import type { DomusGraph, SimpleCycle, CycleSet } from './types.js';
import { createCycleSet } from './types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';

const DOMUS_DEBUG = ORTHO_DEBUG;

/**
 * Represents a biconnected component of the graph.
 *
 * A biconnected component is maximal biconnected subgraph.
 * A trivial component consists of a single edge.
 */
export interface BiconnectedComponent {
  /** Edges in this component */
  edges: Set<string>;
  /** Vertices in this component */
  vertices: Set<string>;
  /** Whether this is a trivial component (single edge) */
  isTrivial: boolean;
}

/**
 * Find all biconnected components of a graph using the Tarjan algorithm.
 *
 * Reference: (DOMUS, p.10, §4.3) mentions non-trivial biconnected components
 * for cycle basis initialization.
 *
 * @param graph - The graph to analyze
 * @returns List of biconnected components
 */
export function findBiconnectedComponents(graph: DomusGraph): BiconnectedComponent[] {
  const components: BiconnectedComponent[] = [];

  // Tarjan algorithm state
  const disc = new Map<string, number>(); // Discovery time
  const low = new Map<string, number>(); // Low-link value
  const parent = new Map<string, string | null>(); // Parent in DFS tree
  const edgeStack: { from: string; to: string; edgeId: string }[] = [];
  let time = 0;

  /**
   * Extract a biconnected component from the edge stack up to and including
   * the edge (u, v).
   */
  function extractComponent(u: string, v: string, edgeId: string): void {
    const compEdges = new Set<string>();
    const compVertices = new Set<string>();

    while (edgeStack.length > 0) {
      const top = edgeStack[edgeStack.length - 1];
      edgeStack.pop();
      compEdges.add(top.edgeId);
      compVertices.add(top.from);
      compVertices.add(top.to);

      if (
        (top.from === u && top.to === v && top.edgeId === edgeId) ||
        (top.from === v && top.to === u && top.edgeId === edgeId)
      ) {
        break;
      }
    }

    if (compEdges.size > 0) {
      components.push({
        edges: compEdges,
        vertices: compVertices,
        isTrivial: compEdges.size === 1,
      });
    }
  }

  /**
   * DFS for Tarjan's biconnected components algorithm.
   */
  function dfs(u: string, parentEdgeId: string | null): void {
    disc.set(u, time);
    low.set(u, time);
    time++;

    const adj = graph.adjacency.get(u) ?? [];
    let children = 0;

    for (const { neighbor: v, edgeId } of adj) {
      if (edgeId === parentEdgeId) {
        // Skip the edge we came from (but allow parallel edges)
        continue;
      }

      if (!disc.has(v)) {
        // Tree edge
        children++;
        parent.set(v, u);
        edgeStack.push({ from: u, to: v, edgeId });

        dfs(v, edgeId);

        // Update low-link
        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        // Check for articulation point
        const uDisc = disc.get(u)!;
        const vLow = low.get(v)!;

        // If u is root and has 2+ children, or u is not root and low[v] >= disc[u]
        const isRoot = parent.get(u) === null;
        if ((isRoot && children >= 2) || (!isRoot && vLow >= uDisc)) {
          extractComponent(u, v, edgeId);
        }
      } else if (disc.get(v)! < disc.get(u)!) {
        // Back edge
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
        edgeStack.push({ from: u, to: v, edgeId });
      }
    }
  }

  // Run DFS from each unvisited vertex
  for (const v of graph.vertices) {
    if (!disc.has(v)) {
      parent.set(v, null);
      dfs(v, null);

      // Remaining edges on stack form a component
      if (edgeStack.length > 0) {
        const compEdges = new Set<string>();
        const compVertices = new Set<string>();

        while (edgeStack.length > 0) {
          const e = edgeStack.pop()!;
          compEdges.add(e.edgeId);
          compVertices.add(e.from);
          compVertices.add(e.to);
        }

        if (compEdges.size > 0) {
          components.push({
            edges: compEdges,
            vertices: compVertices,
            isTrivial: compEdges.size === 1,
          });
        }
      }
    }
  }

  return components;
}

/**
 * Build a BFS tree from the graph starting at the given root.
 *
 * @param graph - The graph
 * @param root - The root vertex
 * @returns Tree edges and non-tree edges
 */
function buildBFSTree(
  graph: DomusGraph,
  root: string
): {
  treeEdges: Set<string>;
  nonTreeEdges: { edgeId: string; from: string; to: string }[];
  parent: Map<string, string | null>;
  depth: Map<string, number>;
} {
  const treeEdges = new Set<string>();
  const nonTreeEdges: { edgeId: string; from: string; to: string }[] = [];
  const parent = new Map<string, string | null>();
  const depth = new Map<string, number>();
  const visited = new Set<string>();

  const queue: string[] = [root];
  visited.add(root);
  parent.set(root, null);
  depth.set(root, 0);

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uDepth = depth.get(u)!;
    const adj = graph.adjacency.get(u) ?? [];

    for (const { neighbor: v, edgeId } of adj) {
      if (!visited.has(v)) {
        // Tree edge
        visited.add(v);
        parent.set(v, u);
        depth.set(v, uDepth + 1);
        treeEdges.add(edgeId);
        queue.push(v);
      } else if (!treeEdges.has(edgeId)) {
        // Non-tree edge (only add once)
        // Check if this edge creates a fundamental cycle
        const foundNonTree = nonTreeEdges.find((e) => e.edgeId === edgeId);
        if (!foundNonTree) {
          nonTreeEdges.push({ edgeId, from: u, to: v });
        }
      }
    }
  }

  return { treeEdges, nonTreeEdges, parent, depth };
}

/**
 * Find the path from a vertex to the root in a BFS/DFS tree.
 */
function pathToRoot(vertex: string, parent: Map<string, string | null>): string[] {
  const path: string[] = [];
  let current: string | null = vertex;

  while (current !== null) {
    path.push(current);
    current = parent.get(current) ?? null;
  }

  return path;
}

/**
 * Find the lowest common ancestor of two vertices in a tree.
 */
function findLCA(
  u: string,
  v: string,
  parent: Map<string, string | null>,
  _depth: Map<string, number>
): string {
  const pathU = pathToRoot(u, parent);
  const pathV = pathToRoot(v, parent);

  const setU = new Set(pathU);

  for (const vertex of pathV) {
    if (setU.has(vertex)) {
      return vertex;
    }
  }

  // Should not happen in a connected graph
  return pathU[pathU.length - 1];
}

/**
 * Construct the fundamental cycle for a non-tree edge.
 *
 * The cycle is formed by the non-tree edge (u, v) plus the paths
 * from u and v to their LCA in the tree.
 *
 * Reference: (DOMUS, p.10, §4.3)
 */
function constructFundamentalCycle(
  nonTreeEdge: { edgeId: string; from: string; to: string },
  graph: DomusGraph,
  parent: Map<string, string | null>,
  depth: Map<string, number>,
  treeEdges: Set<string>
): SimpleCycle {
  const { from: u, to: v, edgeId: nonTreeEdgeId } = nonTreeEdge;

  // Find LCA
  const lca = findLCA(u, v, parent, depth);

  // Build path from u to LCA
  const pathU: string[] = [];
  let current: string | null = u;
  while (current !== null && current !== lca) {
    pathU.push(current);
    current = parent.get(current) ?? null;
  }
  pathU.push(lca);

  // Build path from v to LCA
  const pathV: string[] = [];
  current = v;
  while (current !== null && current !== lca) {
    pathV.push(current);
    current = parent.get(current) ?? null;
  }
  // Don't add LCA again

  // Combine: u -> ... -> LCA -> ... -> v -> u
  // The cycle vertices are: pathU + reverse(pathV)
  const cycleVertices = [...pathU, ...pathV.reverse()];

  // Find edge IDs for the cycle
  const cycleEdgeIds: string[] = [];

  for (let i = 0; i < cycleVertices.length; i++) {
    const from = cycleVertices[i];
    const to = cycleVertices[(i + 1) % cycleVertices.length];

    // Find the edge between from and to
    const adj = graph.adjacency.get(from) ?? [];
    let foundEdge: string | null = null;

    for (const { neighbor, edgeId } of adj) {
      if (neighbor === to) {
        // Prefer tree edge if multiple edges exist
        if (treeEdges.has(edgeId)) {
          foundEdge = edgeId;
          break;
        } else if (edgeId === nonTreeEdgeId) {
          foundEdge = edgeId;
        } else if (!foundEdge) {
          foundEdge = edgeId;
        }
      }
    }

    if (foundEdge) {
      cycleEdgeIds.push(foundEdge);
    }
  }

  return {
    vertices: cycleVertices,
    edgeIds: cycleEdgeIds,
  };
}

/**
 * Compute a cycle basis for a graph using BFS tree construction.
 *
 * For each non-tree edge (u, v), we add the fundamental cycle formed by
 * (u, v) and the unique paths from u and v to their LCA in the tree.
 *
 * The resulting cycle basis has size |E| - |V| + 1 for a connected graph.
 *
 * Reference: (DOMUS, p.10, §4.3)
 *
 * @param graph - The graph
 * @param relevantEdges - Optional set of edge IDs to consider (defaults to all)
 * @returns Cycle set containing the basis cycles
 */
export function computeCycleBasis(graph: DomusGraph, relevantEdges?: Set<string>): CycleSet {
  const cycleSet = createCycleSet();

  // Find connected components
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const v of graph.vertices) {
    if (!visited.has(v)) {
      const component: string[] = [];
      const queue = [v];
      visited.add(v);

      while (queue.length > 0) {
        const u = queue.shift()!;
        component.push(u);

        const adj = graph.adjacency.get(u) ?? [];
        for (const { neighbor } of adj) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      components.push(component);
    }
  }

  // Process each connected component
  for (const component of components) {
    if (component.length === 0) {
      continue;
    }

    const root = component[0];
    const { treeEdges, nonTreeEdges, parent, depth } = buildBFSTree(graph, root);

    // For each non-tree edge, construct a fundamental cycle
    for (const nonTreeEdge of nonTreeEdges) {
      // Skip if this edge is not in the relevant set
      if (relevantEdges && !relevantEdges.has(nonTreeEdge.edgeId)) {
        continue;
      }

      const cycle = constructFundamentalCycle(nonTreeEdge, graph, parent, depth, treeEdges);

      // Only add non-trivial cycles (length >= 3)
      if (cycle.vertices.length >= 3) {
        cycleSet.add(cycle);
      }
    }
  }

  return cycleSet;
}

/**
 * Compute the initial cycle set C for DOMUS.
 *
 * Uses the cycle basis covering all edges in non-trivial biconnected components.
 *
 * Reference: (DOMUS, p.10, §4.3)
 *
 * @param graph - The graph
 * @param debug - Whether to log debug info
 * @returns The initial cycle set
 */
export function computeInitialCycleSet(graph: DomusGraph, debug = false): CycleSet {
  // Find biconnected components
  const components = findBiconnectedComponents(graph);

  // Collect edges from non-trivial components
  const relevantEdges = new Set<string>();
  let trivialCount = 0;
  let nonTrivialCount = 0;

  for (const comp of components) {
    if (!comp.isTrivial) {
      nonTrivialCount++;
      for (const edgeId of comp.edges) {
        relevantEdges.add(edgeId);
      }
    } else {
      trivialCount++;
    }
  }

  if (debug) {
    log.debug(DOMUS_DEBUG, 'domus_biconnected_components', {
      total: components.length,
      trivial: trivialCount,
      nonTrivial: nonTrivialCount,
      relevantEdges: relevantEdges.size,
    });
  }

  // Compute cycle basis for non-trivial components
  const cycleSet = computeCycleBasis(graph, relevantEdges);

  if (debug) {
    log.debug(DOMUS_DEBUG, 'domus_initial_cycle_set', {
      numCycles: cycleSet.cycles.length,
      expectedSize: `|E| - |V| + 1 = ${graph.edges.size} - ${graph.vertices.size} + 1`,
    });
  }

  return cycleSet;
}

/**
 * Get the degree of a vertex in the graph.
 */
export function getVertexDegree(graph: DomusGraph, vertex: string): number {
  return (graph.adjacency.get(vertex) ?? []).length;
}

/**
 * Get all neighbors of a vertex.
 */
export function getNeighbors(
  graph: DomusGraph,
  vertex: string
): { neighbor: string; edgeId: string }[] {
  return graph.adjacency.get(vertex) ?? [];
}

/**
 * Check if the graph is connected.
 */
export function isConnected(graph: DomusGraph): boolean {
  if (graph.vertices.size === 0) {
    return true;
  }

  const visited = new Set<string>();
  const start = graph.vertices.values().next().value;
  if (start === undefined) {
    return true;
  }
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const u = queue.shift()!;
    const adj = graph.adjacency.get(u) ?? [];

    for (const { neighbor } of adj) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === graph.vertices.size;
}
