import type { Graph, EdgeRef, NodeId } from './helpers.js';
// cspell:ignore acyclicity topo indeg preds succs

// Normalize/validate a Graph view; ensure nodeById exists and edges refer to known nodes
export function normalizeGraph(g: Graph): Graph {
  const nodeById = new Map(g.nodeById);
  // Filter edges with unknown endpoints and de-duplicate by id+endpoints
  const seen = new Set<string>();
  const edges: EdgeRef[] = [];
  for (const e of g.edges) {
    if (!nodeById.has(e.src) || !nodeById.has(e.dst)) {
      continue;
    }
    const key = `${e.id}:${e.src}->${e.dst}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    edges.push(e);
  }
  const nodes = [...nodeById.keys()];
  return { nodes, edges, layout: g.layout, nodeById };
}

// Return incoming edges for v
export function incoming(g: Graph, v: NodeId): EdgeRef[] {
  return g.edges.filter((e) => e.dst === v);
}

// Return outgoing edges for v
export function outgoing(g: Graph, v: NodeId): EdgeRef[] {
  return g.edges.filter((e) => e.src === v);
}

export function buildSuccessorMap(g: Graph): Map<NodeId, NodeId[]> {
  const succs = new Map<NodeId, NodeId[]>();
  for (const v of g.nodes) {
    succs.set(v, []);
  }
  for (const e of g.edges) {
    succs.get(e.src)!.push(e.dst);
  }
  return succs;
}

export function buildSortedSuccessorMap(g: Graph): Map<NodeId, NodeId[]> {
  const succs = buildSuccessorMap(g);
  for (const successors of succs.values()) {
    successors.sort((a, b) => a.localeCompare(b));
  }
  return succs;
}

export function buildInDegreeMap(g: Graph): Map<NodeId, number> {
  const indeg = new Map<NodeId, number>();
  for (const v of g.nodes) {
    indeg.set(v, 0);
  }
  for (const e of g.edges) {
    indeg.set(e.dst, (indeg.get(e.dst) ?? 0) + 1);
  }
  return indeg;
}

export function sortedZeroInDegreeNodes(indeg: Map<NodeId, number>): NodeId[] {
  return [...indeg.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));
}

export function buildPredecessorSuccessorMaps(
  g: Graph,
  includeEdge: (edge: EdgeRef) => boolean = () => true
): { preds: Map<NodeId, NodeId[]>; succs: Map<NodeId, NodeId[]> } {
  const preds = new Map<NodeId, NodeId[]>();
  const succs = new Map<NodeId, NodeId[]>();
  for (const v of g.nodes) {
    preds.set(v, []);
    succs.set(v, []);
  }
  for (const e of g.edges) {
    if (!includeEdge(e)) {
      continue;
    }
    succs.get(e.src)!.push(e.dst);
    preds.get(e.dst)!.push(e.src);
  }
  return { preds, succs };
}

export function buildLayersFromRanks(
  g: Graph,
  order: NodeId[],
  rankOf: Record<NodeId, number>,
  opts?: { skipGroups?: boolean }
): NodeId[][] {
  let maxRank = 0;
  for (const v of g.nodes) {
    if (opts?.skipGroups && g.nodeById.get(v)?.isGroup) {
      continue;
    }
    maxRank = Math.max(maxRank, rankOf[v] ?? 0);
  }

  const layers: NodeId[][] = Array.from({ length: maxRank + 1 }, () => []);
  for (const v of order) {
    if (opts?.skipGroups && g.nodeById.get(v)?.isGroup) {
      continue;
    }
    layers[Math.max(0, rankOf[v] ?? 0)].push(v);
  }
  return layers;
}

// Detect acyclicity via DFS (white/gray/black sets)
export function isAcyclic(g: Graph): boolean {
  const color: Record<NodeId, 0 | 1 | 2> = Object.create(null);
  for (const v of g.nodes) {
    color[v] = 0; // 0 white, 1 gray, 2 black
  }

  const adj = buildSuccessorMap(g);

  const dfs = (u: NodeId): boolean => {
    color[u] = 1; // gray
    for (const v of adj.get(u) ?? []) {
      if (color[v] === 0 && !dfs(v)) {
        return false;
      }
      if (color[v] === 1) {
        // back-edge
        return false;
      }
    }
    color[u] = 2; // black
    return true;
  };

  for (const v of g.nodes) {
    if (color[v] === 0 && !dfs(v)) {
      return false;
    }
  }
  return true;
}

// Topological sort (Kahn). Returns null if cycles exist.
export function topoSortIfAcyclic(g: Graph): NodeId[] | null {
  const indeg = buildInDegreeMap(g);
  const queue = sortedZeroInDegreeNodes(indeg);
  const order: NodeId[] = [];
  const adj = buildSortedSuccessorMap(g);

  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      indeg.set(v, (indeg.get(v) ?? 0) - 1);
      if ((indeg.get(v) ?? 0) === 0) {
        // insert keeping sorted order for determinism
        let i = 0;
        while (i < queue.length && queue[i] < v) {
          i++;
        }
        queue.splice(i, 0, v);
      }
    }
  }

  return order.length === g.nodes.length ? order : null;
}

/**
 * Build an index map from node IDs to their positions in a layer.
 * This is used for efficient lookups during crossing minimization.
 */
export function buildLayerIndex(layer: NodeId[]): Map<NodeId, number> {
  const m = new Map<NodeId, number>();
  let index = 0;
  for (const id of layer) {
    m.set(id, index);
    index++;
  }
  return m;
}

export function countInversions(values: number[]): number {
  const tmp = new Array<number>(values.length);
  const count = (left: number, right: number): number => {
    if (right - left <= 1) {
      return 0;
    }
    const mid = (left + right) >> 1;
    let inversions = count(left, mid) + count(mid, right);
    let i = left;
    let j = mid;
    let k = left;
    while (i < mid || j < right) {
      if (j >= right || (i < mid && values[i] <= values[j])) {
        tmp[k++] = values[i++];
      } else {
        tmp[k++] = values[j++];
        inversions += mid - i;
      }
    }
    for (let t = left; t < right; t++) {
      values[t] = tmp[t];
    }
    return inversions;
  };
  return count(0, values.length);
}
