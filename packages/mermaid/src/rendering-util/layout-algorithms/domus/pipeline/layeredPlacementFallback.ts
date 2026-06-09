/**
 * Deterministic layered placement fallback used when DOMUS placement
 * (`runDomusRouting({ useExistingPositions: false, placementOnly: true })`)
 * returns `success: false` on the cyclic-routing leg of `domusBackend.ts`.
 *
 * Why this exists:
 * The cyclic leg unconditionally continues to the nudge / route stages
 * regardless of whether DOMUS placement succeeded. When DOMUS UNSAT (e.g.
 * `multiple-edges` fixture: 3 parallel a→b multi-edges plus the 2-cycle
 * a↔b plus the 3-cycle a→b→c→a) the runner (`domus/runner.ts:212-221`)
 * returns early before `updateNodePositions`, so every leaf node ends up
 * with `y === undefined`. Downstream nudgers and the routing-graph
 * fallback then operate on a layout where every routed segment collapses
 * to y ≈ 0, which produces a cascade of intersect / share-subpath /
 * port-direction-mismatch violations.
 *
 * What this does:
 * Sugiyama-style longest-path layering (paper anchor: Sugiyama et al.
 * 1981 §3.1, also referenced in `diss.md` §2.4.1 "Cycle Removal" which
 * already drives the cycle-removal step on the same path) on the
 * already-cycle-removed `edgesLayout`, then assigns deterministic
 * `(x, y)` per leaf node. Group / edge-label nodes are left untouched —
 * those are placed by other passes (`finalizeOverlayLabels`, cluster
 * boundary expansion).
 *
 * Output: every non-group / non-edge-label leaf node has finite `x` and
 * `y`. Existing `width` / `height` are preserved; this never resizes.
 *
 * Single log prefix: `MULTI_FALLBACK_DBG`.
 */
import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';

const DEBUG_PREFIX = 'MULTI_FALLBACK_DBG';

export interface LayeredPlacementFallbackOptions {
  /** Centre-to-centre x distance between adjacent ranks (column step). */
  xStep?: number;
  /** Centre-to-centre y distance between adjacent ranks (row step). */
  yStep?: number;
  /** Anchor of the placement (centre of layered grid). Defaults to `(0, 0)`. */
  baseOffset?: { x: number; y: number };
}

export interface LayeredPlacementFallbackInputs {
  vertexIds: readonly string[];
  edgesLayout: readonly { id: string; from: string; to: string }[];
}

export interface LayeredPlacementFallbackResult {
  placedNodeIds: string[];
  rankCount: number;
  maxRankSize: number;
}

/**
 * Compute a deterministic per-vertex (rank, column) placement and write
 * `node.x` / `node.y` for every leaf node referenced by `vertexIds`.
 *
 * Determinism guarantees:
 * - The ranking uses a longest-path BFS that breaks ties by sorted
 *   vertex id (lexicographic).
 * - Within a rank, vertices are sorted lexicographically.
 * - Edge order does not affect the assigned ranks (we sort `edgesLayout`
 *   internally by `from`, then `to`, then `id`).
 */
export function applyLayeredPlacementFallback(
  data: LayoutData,
  inputs: LayeredPlacementFallbackInputs,
  options: LayeredPlacementFallbackOptions = {}
): LayeredPlacementFallbackResult {
  const xStep = options.xStep ?? 120;
  const yStep = options.yStep ?? 120;
  const baseOffset = options.baseOffset ?? { x: 0, y: 0 };

  const sortedVertexIds = [...inputs.vertexIds].sort();
  const sortedEdges = [...inputs.edgesLayout].sort((a, b) => {
    if (a.from !== b.from) {
      return a.from < b.from ? -1 : 1;
    }
    if (a.to !== b.to) {
      return a.to < b.to ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const ranks = computeLongestPathRanks(sortedVertexIds, sortedEdges);

  const byRank = new Map<number, string[]>();
  for (const id of sortedVertexIds) {
    const r = ranks.get(id) ?? 0;
    if (!byRank.has(r)) {
      byRank.set(r, []);
    }
    byRank.get(r)!.push(id);
  }
  for (const list of byRank.values()) {
    list.sort();
  }

  const rankCount = byRank.size;
  let maxRankSize = 0;
  for (const list of byRank.values()) {
    if (list.length > maxRankSize) {
      maxRankSize = list.length;
    }
  }

  const nodesById = new Map<string, Node>();
  for (const node of data.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  const placedNodeIds: string[] = [];
  const sortedRanks = [...byRank.keys()].sort((a, b) => a - b);
  const yMid = (sortedRanks.length - 1) / 2;

  for (const [i, r] of sortedRanks.entries()) {
    const list = byRank.get(r)!;
    const xMid = (list.length - 1) / 2;
    for (const [j, id] of list.entries()) {
      const node = nodesById.get(id);
      if (!node || node.isGroup) {
        continue;
      }
      const isEdgeLabel = Boolean((node as { isEdgeLabel?: boolean }).isEdgeLabel);
      if (isEdgeLabel) {
        continue;
      }
      const x = baseOffset.x + (j - xMid) * xStep;
      const y = baseOffset.y + (i - yMid) * yStep;
      (node as { x?: number; y?: number }).x = x;
      (node as { x?: number; y?: number }).y = y;
      placedNodeIds.push(id);
    }
  }

  log.debug(`${DEBUG_PREFIX}: applyLayeredPlacementFallback`, {
    placed: placedNodeIds.length,
    ranks: rankCount,
    maxRankSize,
    xStep,
    yStep,
  });

  return {
    placedNodeIds,
    rankCount,
    maxRankSize,
  };
}

/**
 * Longest-path layering with deterministic tie-breaking.
 *
 * Returns a map vertexId → rank where rank 0 holds the source layer and
 * higher ranks lie below. Edges should already be cycle-removed (the
 * cyclic leg in domusBackend.ts performs DFS reverse on back-edges
 * before calling us).
 *
 * Algorithm:
 * - Vertices with no incoming edges → rank 0.
 * - For each vertex `v`, rank(v) = 1 + max(rank(u)) over `u → v`.
 * - We compute via memoised DFS over a sorted adjacency list, so the
 *   result is independent of input order.
 */
function computeLongestPathRanks(
  vertexIds: readonly string[],
  edges: readonly { from: string; to: string }[]
): Map<string, number> {
  const incoming = new Map<string, string[]>();
  for (const id of vertexIds) {
    incoming.set(id, []);
  }
  for (const e of edges) {
    if (e.from === e.to) {
      continue;
    }
    if (!incoming.has(e.to)) {
      incoming.set(e.to, []);
    }
    if (!incoming.has(e.from)) {
      incoming.set(e.from, []);
    }
    incoming.get(e.to)!.push(e.from);
  }
  for (const list of incoming.values()) {
    list.sort();
  }

  const ranks = new Map<string, number>();
  const visiting = new Set<string>();

  const rankOf = (id: string): number => {
    const cached = ranks.get(id);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(id)) {
      // Defensive: shouldn't happen because the caller passes the
      // already-cycle-removed `edgesLayout`. If a residual back-edge
      // sneaks in, treat it as rank 0 to avoid stack overflow.
      return 0;
    }
    visiting.add(id);
    const predecessors = incoming.get(id) ?? [];
    let r = 0;
    for (const u of predecessors) {
      r = Math.max(r, rankOf(u) + 1);
    }
    visiting.delete(id);
    ranks.set(id, r);
    return r;
  };

  for (const id of vertexIds) {
    rankOf(id);
  }
  return ranks;
}
