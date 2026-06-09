export type CompactionObjective = 'min' | 'balanced';

export interface CompactionArc {
  from: string;
  to: string;
  distance: number;
}

export interface CompactionOptions {
  /**
   * Objective:
   * - 'min': minimal coordinates satisfying constraints (longest-path forward pass)
   * - 'balanced': also performs a backward pass and centers slack
   */
  objective?: CompactionObjective;

  /** Extra gap between disconnected components (default: 50). */
  componentGap?: number;
}

/**
 * Longest-path compaction on a DAG of separation constraints:
 * For each arc (u -\> v, d): coord[v] \>= coord[u] + d.
 *
 * This is the “difference constraints via constraint-graph” core used both by
 * DOMUS auxiliary-graph compaction and RP1-style nudging.
 */
export function longestPathCompaction(
  nodeIds: string[],
  arcs: CompactionArc[],
  options: CompactionOptions = {}
): Map<string, number> {
  const objective: CompactionObjective = options.objective ?? 'balanced';
  const componentGap = options.componentGap ?? 50;

  const coords = new Map<string, number>();
  const adj = new Map<string, { to: string; distance: number }[]>();
  const revAdj = new Map<string, { from: string; distance: number }[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodeIds) {
    adj.set(id, []);
    revAdj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const a of arcs) {
    if (!adj.has(a.from) || !adj.has(a.to)) {
      continue;
    }
    adj.get(a.from)!.push({ to: a.to, distance: a.distance });
    revAdj.get(a.to)!.push({ from: a.from, distance: a.distance });
    inDegree.set(a.to, (inDegree.get(a.to) ?? 0) + 1);
  }

  // Kahn order + longest path forward pass.
  const queue = nodeIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const deg = new Map(inDegree);

  let offset = 0;
  for (const s of queue) {
    coords.set(s, offset);
    offset += componentGap;
  }

  const topo: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topo.push(u);
    const base = coords.get(u) ?? 0;
    for (const { to, distance } of adj.get(u) ?? []) {
      const cand = base + distance;
      const cur = coords.get(to);
      if (cur === undefined || cand > cur) {
        coords.set(to, cand);
      }
      const nd = (deg.get(to) ?? 1) - 1;
      deg.set(to, nd);
      if (nd === 0) {
        queue.push(to);
      }
    }
  }

  if (objective === 'min') {
    return coords;
  }

  // Backward pass to compute max feasible coordinates given the component’s sinks.
  const maxCoords = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const id of nodeIds) {
    outDegree.set(id, (adj.get(id) ?? []).length);
  }
  const sinks = nodeIds.filter((id) => (outDegree.get(id) ?? 0) === 0);
  const outDeg = new Map(outDegree);

  for (const s of sinks) {
    maxCoords.set(s, coords.get(s) ?? 0);
  }

  const sinkQueue = [...sinks];
  while (sinkQueue.length > 0) {
    const v = sinkQueue.shift()!;
    const vMax = maxCoords.get(v) ?? 0;
    for (const { from, distance } of revAdj.get(v) ?? []) {
      const cand = vMax - distance;
      const cur = maxCoords.get(from);
      if (cur === undefined || cand < cur) {
        maxCoords.set(from, cand);
      }
      const nd = (outDeg.get(from) ?? 1) - 1;
      outDeg.set(from, nd);
      if (nd === 0) {
        sinkQueue.push(from);
      }
    }
  }

  const balanced = new Map<string, number>();
  for (const id of nodeIds) {
    const min = coords.get(id) ?? 0;
    const max = maxCoords.get(id) ?? min;
    balanced.set(id, (min + max) / 2);
  }
  return balanced;
}
