import type { Graph, Edge, EdgeRef, NodeId } from './helpers.js';
import { normalizeGraph } from './phase0.helpers.js';
// cspell:ignore Graphviz acyc Eades

export interface CycleRemovalResult {
  acyclic: Graph;
  reversed: Edge[]; // edges that were reversed (original orientation)
}

// Deterministic DFS-based cycle removal (similar to Graphviz dot back-edge marking)
export function removeCycles_DFS(g: Graph): CycleRemovalResult {
  const gn = normalizeGraph(g);

  // Build adjacency with deterministic order
  const adj = new Map<NodeId, EdgeRef[]>();
  for (const v of gn.nodes) {
    adj.set(v, []);
  }
  for (const e of gn.edges) {
    adj.get(e.src)!.push(e);
  }
  for (const arr of adj.values()) {
    arr.sort((a, b) => (a.dst === b.dst ? a.id.localeCompare(b.id) : a.dst.localeCompare(b.dst)));
  }

  const color: Record<NodeId, 0 | 1 | 2> = Object.create(null);
  for (const v of gn.nodes) {
    color[v] = 0; // 0 white, 1 gray, 2 black
  }

  const reversed: EdgeRef[] = [];

  const dfs = (u: NodeId) => {
    color[u] = 1;
    for (const e of adj.get(u) ?? []) {
      const v = e.dst;
      if (color[v] === 0) {
        dfs(v);
      } else if (color[v] === 1) {
        // back-edge u->v; mark for reversal
        reversed.push(e);
      }
    }
    color[u] = 2;
  };

  // Visit in deterministic order
  const nodesSorted = [...gn.nodes].sort((a, b) => a.localeCompare(b));
  for (const v of nodesSorted) {
    if (color[v] === 0) {
      dfs(v);
    }
  }

  // Build acyclic edge set by reversing all marked edges
  const toReverse = new Set<string>(reversed.map((e) => `${e.id}:${e.src}->${e.dst}`));
  const acycEdges: EdgeRef[] = gn.edges.map((e) =>
    toReverse.has(`${e.id}:${e.src}->${e.dst}`)
      ? { id: e.id, src: e.dst, dst: e.src, weight: e.weight, ref: e.ref }
      : e
  );

  const acyclic: Graph = {
    nodes: [...gn.nodes],
    edges: acycEdges,
    layout: gn.layout,
    nodeById: new Map(gn.nodeById),
  };
  return { acyclic, reversed };
}
