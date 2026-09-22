import type { Graph, NodeId } from './helpers.js';
import type { DrivingTree } from './driving-tree.js';

/**
 * Computes crossing counts for each parent/child pair in the driving tree.
 *
 * Uses a binary-lifting LCA over the driving tree and counts, for every edge,
 * how many layers it spans below the LCA. These per-layer counts are then
 * accumulated to obtain, for each parent -\> child edge in the tree, an
 * approximate "subtree crossing" score used when ordering children.
 */
export function computeSubtreeCrossCounts(
  g: Graph,
  rankOf: Record<NodeId, number>,
  tree: DrivingTree
): Map<NodeId, Map<NodeId, number>> {
  const nodes = [...g.nodes];
  const indexOf = new Map<NodeId, number>();
  for (const [i, node] of nodes.entries()) {
    indexOf.set(node, i);
  }
  const n = nodes.length;

  const parentIdx = new Array<number>(n).fill(-1);
  const depth = new Array<number>(n).fill(0);

  const queue: NodeId[] = [];
  const seen = new Set<NodeId>();

  // Seed BFS from roots
  for (const node of nodes) {
    const parentId = tree.parent.get(node) ?? null;
    const idx = indexOf.get(node);
    if (idx == null) {
      continue;
    }
    if (parentId == null) {
      parentIdx[idx] = -1;
      depth[idx] = 0;
      if (!seen.has(node)) {
        seen.add(node);
        queue.push(node);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentIdx = indexOf.get(current);
    if (currentIdx == null) {
      continue;
    }
    const childList = tree.children.get(current) ?? [];
    for (const child of childList) {
      if (seen.has(child)) {
        continue;
      }
      const childIdx = indexOf.get(child);
      if (childIdx == null) {
        continue;
      }
      parentIdx[childIdx] = currentIdx;
      depth[childIdx] = depth[currentIdx] + 1;
      seen.add(child);
      queue.push(child);
    }
  }

  // Ensure all nodes are represented even if disconnected in the tree
  for (const node of nodes) {
    if (seen.has(node)) {
      continue;
    }
    const idx = indexOf.get(node);
    if (idx == null) {
      continue;
    }
    parentIdx[idx] = -1;
    depth[idx] = 0;
    seen.add(node);
  }

  const maxLog = Math.max(1, Math.ceil(Math.log2(Math.max(1, n))) + 1);
  const up: number[][] = Array.from({ length: maxLog }, () => new Array<number>(n).fill(-1));
  for (let i = 0; i < n; i++) {
    up[0][i] = parentIdx[i];
  }
  for (let k = 1; k < maxLog; k++) {
    for (let i = 0; i < n; i++) {
      const prev = up[k - 1][i];
      up[k][i] = prev === -1 ? -1 : up[k - 1][prev];
    }
  }

  const lcaIndex = (aIdx: number, bIdx: number): number => {
    if (aIdx === -1 || bIdx === -1) {
      return -1;
    }
    if (depth[aIdx] < depth[bIdx]) {
      [aIdx, bIdx] = [bIdx, aIdx];
    }
    const diff = depth[aIdx] - depth[bIdx];
    for (let k = 0; k < maxLog; k++) {
      if ((diff >> k) & 1) {
        aIdx = up[k][aIdx];
        if (aIdx === -1) {
          return -1;
        }
      }
    }
    if (aIdx === bIdx) {
      return aIdx;
    }
    for (let k = maxLog - 1; k >= 0; k--) {
      const upA = up[k][aIdx];
      const upB = up[k][bIdx];
      if (upA === -1 || upB === -1) {
        continue;
      }
      if (upA !== upB) {
        aIdx = upA;
        bIdx = upB;
      }
    }
    return up[0][aIdx];
  };

  const ownCounts = Array.from({ length: n }, () => new Map<number, number>());

  // Count, for each LCA, how many edges pass through each layer below it.
  for (const edge of g.edges) {
    let src = edge.src;
    let dst = edge.dst;
    let ru = rankOf[src];
    let rv = rankOf[dst];
    if (ru == null || rv == null) {
      continue;
    }
    if (ru > rv) {
      [src, dst] = [dst, src];
      [ru, rv] = [rv, ru];
    }
    if (ru == null || rv == null || ru === rv) {
      continue;
    }
    const upperIdx = indexOf.get(src);
    const lowerIdx = indexOf.get(dst);
    if (upperIdx == null || lowerIdx == null) {
      continue;
    }
    const lca = lcaIndex(upperIdx, lowerIdx);
    if (lca === -1) {
      continue;
    }
    const bucket = ownCounts[lca];
    for (let layer = ru; layer < rv; layer++) {
      bucket.set(layer, (bucket.get(layer) ?? 0) + 1);
    }
  }

  const crossCounts = new Map<NodeId, Map<NodeId, number>>();

  const mergeInto = (target: Map<number, number>, source: Map<number, number>) => {
    if (source.size === 0) {
      return;
    }
    for (const [layer, value] of source) {
      target.set(layer, (target.get(layer) ?? 0) + value);
    }
  };

  const visited = new Set<NodeId>();
  const dfs = (node: NodeId): Map<number, number> => {
    const idx = indexOf.get(node);
    visited.add(node);
    const base = idx == null ? undefined : ownCounts[idx];
    const accumulator = base ? new Map<number, number>(base) : new Map<number, number>();
    const childList = tree.children.get(node) ?? [];
    for (const child of childList) {
      const childMap = dfs(child);
      const parentLayer = rankOf[node];
      if (parentLayer != null) {
        let map = crossCounts.get(node);
        if (!map) {
          map = new Map<NodeId, number>();
          crossCounts.set(node, map);
        }
        let value = childMap.get(parentLayer) ?? 0;
        const childLayer = rankOf[child];
        if (childLayer != null && childLayer > parentLayer) {
          value += 1;
        }
        map.set(child, value);
      }
      mergeInto(accumulator, childMap);
    }
    return accumulator;
  };

  for (const root of tree.roots) {
    if (!visited.has(root)) {
      dfs(root);
    }
  }
  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return crossCounts;
}
