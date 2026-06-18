import type { Graph, NodeId } from './helpers.js';
import { createTopLaneResolver } from './phase2.options.js';

/**
 * Heuristic to push nodes with only cross-lane outgoing edges downward so
 * that same-lane successors have room to appear above them.
 */
export function adjustCrossLaneSources(g: Graph, rankOf: Record<NodeId, number>): void {
  const topLaneOf = createTopLaneResolver(g);

  const nodesByRank = [...g.nodes].sort(
    (a, b) => (rankOf[a] ?? 0) - (rankOf[b] ?? 0) || a.localeCompare(b)
  );
  for (const v of nodesByRank) {
    const laneV = topLaneOf(v);
    if (!laneV) {
      continue;
    }
    const outEdges = g.edges.filter((e) => e.src === v);
    if (outEdges.length === 0) {
      continue;
    }
    let hasSameLaneSucc = false;
    let crossLaneCount = 0;
    for (const e of outEdges) {
      const laneDst = topLaneOf(e.dst);
      if (laneDst == null || laneDst === laneV) {
        hasSameLaneSucc = true;
      } else {
        crossLaneCount++;
      }
    }
    if (crossLaneCount === 0 || hasSameLaneSucc) {
      continue;
    }

    let crossLaneIncoming = 0;
    let hasSameLanePred = false;
    for (const e of g.edges) {
      if (e.dst !== v) {
        continue;
      }
      const laneSrc = topLaneOf(e.src);
      if (!laneSrc) {
        continue;
      }
      if (laneSrc === laneV) {
        hasSameLanePred = true;
      } else {
        crossLaneIncoming++;
      }
    }
    if (crossLaneIncoming > 0 || !hasSameLanePred) {
      continue;
    }
    const current = rankOf[v] ?? 0;
    const target = current + crossLaneCount;
    // Ensure we still respect predecessor constraints
    let lb = 0;
    for (const e of g.edges) {
      if (e.dst === v) {
        lb = Math.max(lb, (rankOf[e.src] ?? 0) + 1);
      }
    }
    const newRank = Math.max(current, lb, target);
    if (newRank !== current) {
      rankOf[v] = newRank;
    }
  }
}
