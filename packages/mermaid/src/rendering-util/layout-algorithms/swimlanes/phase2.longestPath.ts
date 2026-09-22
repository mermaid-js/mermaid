import type { Graph, Layering, NodeId } from './helpers.js';
import { incoming, topoSortIfAcyclic, normalizeGraph } from './phase0.helpers.js';
import type { LayeringOptions } from './phase2.options.js';
import { createTopLaneResolver } from './phase2.options.js';
import { optimizeRanksByCrossings } from './phase2.crossOptimization.js';
import { adjustCrossLaneSources } from './phase2.crossLaneAdjust.js';
import { buildMultitreeLayerOrder } from './phase2.multitree.order.js';

/**
 * Classic longest-path layering with optional compaction and lane awareness.
 */
export function assignLayers_LongestPath(gAcyclic: Graph, opts?: LayeringOptions): Layering {
  const g = normalizeGraph(gAcyclic);
  const order = topoSortIfAcyclic(g) ?? [...g.nodes].sort();
  const compact = opts?.compactSingleInput ?? false;

  const topLaneOf = createTopLaneResolver(g);

  let rankOf: Record<NodeId, number> = Object.create(null);
  for (const v of order) {
    const incAll = incoming(g, v);
    const inc = opts?.ignoreCrossLaneEdges
      ? incAll.filter((e) => {
          const laneSrc = topLaneOf(e.src);
          const laneDst = topLaneOf(v);
          if (!laneSrc || !laneDst) {
            return true;
          }
          return laneSrc === laneDst;
        })
      : incAll;
    if (inc.length === 0) {
      rankOf[v] = 0;
    } else if (compact && inc.length === 1) {
      const u = inc[0].src;
      // Only compact if predecessor is in a different lane than v
      const laneU = topLaneOf(u);
      const laneV = topLaneOf(v);
      if (laneU !== laneV) {
        rankOf[v] = rankOf[u] ?? 0;
      } else {
        rankOf[v] = (rankOf[u] ?? 0) + 1;
      }
    } else {
      let mx = -Infinity;
      for (const e of inc) {
        mx = Math.max(mx, (rankOf[e.src] ?? 0) + 1);
      }
      rankOf[v] = mx === -Infinity ? 0 : mx;
    }
  }

  // Optional: revisit ranks using a greedy crossing reduction respecting precedence constraints
  if (opts?.optimizeRanksByCrossings ?? false) {
    rankOf = optimizeRanksByCrossings(g, rankOf);
  }

  if (opts?.ignoreCrossLaneEdges) {
    adjustCrossLaneSources(g, rankOf);
  }

  const layers = buildMultitreeLayerOrder(g, rankOf, topLaneOf);

  return { layers, rankOf, dummy: new Set<NodeId>() };
}
