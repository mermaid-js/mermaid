import type { Graph, Layering, NodeId } from './helpers.js';
import {
  buildLayersFromRanks,
  buildPredecessorSuccessorMaps,
  topoSortIfAcyclic,
  normalizeGraph,
} from './phase0.helpers.js';
import type { LayeringOptions } from './phase2.options.js';
import { createTopLaneResolver } from './phase2.options.js';
import { LAYERING } from './config.js';
import { assignLayers_LongestPath } from './phase2.longestPath.js';

// cspell:ignore acyclicity preds succs

/**
 * Gravity-based layering algorithm that minimizes edge lengths while maintaining acyclicity.
 */
export function assignLayers_Gravity(gAcyclic: Graph, opts?: LayeringOptions): Layering {
  const g = normalizeGraph(gAcyclic);
  // Initial ranks from longest path (gives feasible lower bounds)
  const base = assignLayers_LongestPath(g, {
    compactSingleInput: opts?.compactSingleInput,
    ignoreCrossLaneEdges: opts?.ignoreCrossLaneEdges,
    optimizeRanksByCrossings: opts?.optimizeRanksByCrossings,
  });
  const rankOf: Record<NodeId, number> = { ...base.rankOf } as any;

  const topLaneOf = createTopLaneResolver(g);

  const { preds, succs } = buildPredecessorSuccessorMaps(g, (e) => {
    if (opts?.ignoreCrossLaneEdges) {
      const laneSrc = topLaneOf(e.src);
      const laneDst = topLaneOf(e.dst);
      if (laneSrc && laneDst && laneSrc !== laneDst) {
        return false;
      }
    }
    return true;
  });

  const order = topoSortIfAcyclic(g) ?? [...g.nodes];
  const revOrder = [...order].reverse();

  const clampFeasible = (v: NodeId, desired: number): number => {
    // Lower bound from predecessors: max(rank[u] + 1)
    let lb = 0;
    for (const u of preds.get(v) ?? []) {
      lb = Math.max(lb, (rankOf[u] ?? 0) + 1);
    }
    // Upper bound from successors: min(rank[w] - 1)
    let ub = Number.POSITIVE_INFINITY;
    const s = succs.get(v) ?? [];
    if (s.length > 0) {
      ub = Math.min(...s.map((w) => (rankOf[w] ?? 0) - 1));
    }
    if (!Number.isFinite(ub)) {
      ub = Math.max(lb, desired);
    }
    return Math.min(Math.max(desired, lb), ub);
  };

  // Iterative relaxation
  const iters = LAYERING.GRAVITY_ITERATIONS;
  const relaxOrder = (nodeOrder: NodeId[]): boolean => {
    let changed = false;
    for (const v of nodeOrder) {
      const ps = preds.get(v) ?? [];
      const ss = succs.get(v) ?? [];
      if (ps.length === 0 && ss.length === 0) {
        continue;
      }
      const predAvg =
        ps.length > 0
          ? ps.reduce((a, u) => a + (rankOf[u] ?? 0) + 1, 0) / ps.length
          : (rankOf[v] ?? 0);
      const succAvg =
        ss.length > 0
          ? ss.reduce((a, w) => a + (rankOf[w] ?? 0) - 1, 0) / ss.length
          : (rankOf[v] ?? 0);
      const desired = Math.round((predAvg + succAvg) / 2);
      const clamped = clampFeasible(v, desired);
      if (clamped !== rankOf[v]) {
        rankOf[v] = clamped;
        changed = true;
      }
    }
    return changed;
  };

  for (let it = 0; it < iters; it++) {
    const forwardChanged = relaxOrder(order);
    // backward pass helps propagate upper bounds
    const backwardChanged = relaxOrder(revOrder);
    if (!forwardChanged && !backwardChanged) {
      break;
    }
  }

  // Final feasibility fix-ups (ensure r(v) >= r(u)+1)
  for (const v of order) {
    let lb = 0;
    for (const u of preds.get(v) ?? []) {
      lb = Math.max(lb, (rankOf[u] ?? 0) + 1);
    }
    if ((rankOf[v] ?? 0) < lb) {
      rankOf[v] = lb;
    }
  }
  for (const v of revOrder) {
    const s = succs.get(v) ?? [];
    if (s.length > 0) {
      const ub = Math.min(...s.map((w) => (rankOf[w] ?? 0) - 1));
      if ((rankOf[v] ?? 0) > ub) {
        rankOf[v] = ub;
      }
    }
  }

  const layers = buildLayersFromRanks(g, order, rankOf);

  return { layers, rankOf, dummy: new Set<NodeId>() };
}
