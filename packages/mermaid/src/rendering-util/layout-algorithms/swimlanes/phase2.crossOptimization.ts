import type { Graph, NodeId, EdgeRef } from './helpers.js';
import {
  buildLayerIndex,
  buildPredecessorSuccessorMaps,
  countInversions,
} from './phase0.helpers.js';
import { LAYERING } from './config.js';
import { createTopLaneResolver } from './phase2.options.js';
import { buildMultitreeLayerOrder } from './phase2.multitree.order.js';
// cspell:ignore acyclicity preds

function countCrossingsBetweenAdjacent(upper: NodeId[], lower: NodeId[], edges: EdgeRef[]): number {
  const upperSet = new Set(upper);
  const lowerSet = new Set(lower);
  const li = buildLayerIndex(lower);
  const vs: number[] = [];
  for (const e of edges) {
    if (upperSet.has(e.src) && lowerSet.has(e.dst)) {
      vs.push(li.get(e.dst)!);
    }
  }
  return countInversions(vs);
}

function totalCrossings(
  layers: NodeId[][],
  edges: EdgeRef[],
  rankOf: Record<NodeId, number>
): number {
  const expanded: EdgeRef[] = [];
  for (const e of edges) {
    const ru = rankOf[e.src];
    const rv = rankOf[e.dst];
    if (ru == null || rv == null || ru === rv) {
      continue;
    }
    let upper = e.src;
    let lower = e.dst;
    let rUpper = ru;
    let rLower = rv;
    if (ru > rv) {
      upper = e.dst;
      lower = e.src;
      rUpper = rv;
      rLower = ru;
    }
    for (let L = rUpper; L < rLower; L++) {
      expanded.push({ id: `${e.id}@${L}`, src: upper, dst: lower, ref: e.ref });
    }
  }
  let sum = 0;
  for (let i = 0; i + 1 < layers.length; i++) {
    sum += countCrossingsBetweenAdjacent(layers[i], layers[i + 1], expanded);
  }
  return sum;
}

/**
 * Greedy local search that tries to lift nodes to reduce crossings while
 * preserving acyclicity (rank(v) e= rank(u)+1 for every edge u-\>v).
 */
export function optimizeRanksByCrossings(
  g: Graph,
  initialRank: Record<NodeId, number>
): Record<NodeId, number> {
  const rankOf: Record<NodeId, number> = { ...initialRank } as any;
  const { preds } = buildPredecessorSuccessorMaps(g);

  const laneOf = createTopLaneResolver(g);

  const layers = buildMultitreeLayerOrder(g, rankOf, laneOf);
  let best = totalCrossings(layers, g.edges, rankOf);
  const maxPasses = LAYERING.MAX_CROSSING_OPTIMIZATION_PASSES;
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    const nodesByRank = [...g.nodes].sort((a, b) => (rankOf[b] ?? 0) - (rankOf[a] ?? 0));
    for (const v of nodesByRank) {
      const r = rankOf[v] ?? 0;
      if (r === 0) {
        continue;
      }
      let lb = 0;
      for (const u of preds.get(v) ?? []) {
        lb = Math.max(lb, (rankOf[u] ?? 0) + 1);
      }
      if (lb >= r) {
        continue;
      }
      const old = r;
      rankOf[v] = lb;
      const trialLayers = buildMultitreeLayerOrder(g, rankOf, laneOf);
      const score = totalCrossings(trialLayers, g.edges, rankOf);
      if (score < best) {
        best = score;
        changed = true;
      } else {
        rankOf[v] = old;
      }
    }
    if (!changed) {
      break;
    }
  }
  return rankOf;
}
