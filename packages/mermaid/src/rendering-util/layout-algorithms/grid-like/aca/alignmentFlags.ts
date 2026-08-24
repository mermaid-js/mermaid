import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Axis, Position } from '../../ipsep-cola/solver/stress.js';
import type { SeparatedAlignment } from './separatedAlignment.js';

/**
 * §16 — the alignment and adjacency bookkeeping `CREATES_COINCIDENCE` runs on.
 *
 * The paper keeps a `|V| × |V|` flag array and updates its transitive closure
 * in `O(|V|)` per accepted alignment. Union-find gives the same answers for
 * less: alignment on one axis is an equivalence relation (it is equality of a
 * coordinate), so "aligned" is exactly "same class", already transitively
 * closed. Rebuilding after a rejection (§22) is then a matter of replaying the
 * surviving alignments, which is what makes {@link fromAlignments} cheap enough
 * to call on every rejection.
 */
export class AlignmentFlags {
  /** One union-find forest per axis; index 0 is x, 1 is y. */
  private readonly parent: [number[], number[]];
  private readonly adjacency: Set<string>;

  constructor(variableCount: number, links: readonly { source: number; target: number }[]) {
    const identity = () => Array.from({ length: variableCount }, (_, i) => i);
    this.parent = [identity(), identity()];
    this.adjacency = new Set(links.map((link) => edgeKey(link.source, link.target)));
  }

  /** Replay `alignments` onto a fresh set of flags (§22, after a rejection). */
  static fromAlignments(
    graph: IpsepColaGraph,
    alignments: readonly SeparatedAlignment[]
  ): AlignmentFlags {
    const flags = new AlignmentFlags(graph.variables.length, graph.links);
    for (const alignment of alignments) {
      flags.align(alignment.alignmentAxis, alignment.u, alignment.v);
    }
    return flags;
  }

  /** Whether an edge of the graph joins `a` and `b`. */
  isConnected(a: number, b: number): boolean {
    return this.adjacency.has(edgeKey(a, b));
  }

  /** Whether `a` and `b` are known to share a coordinate on `axis`. */
  isAligned(axis: Axis, a: number, b: number): boolean {
    return this.find(axis, a) === this.find(axis, b);
  }

  /** UPDATE_ALIGNMENT_FLAGS — record that `a` and `b` now share `axis` (§16). */
  align(axis: Axis, a: number, b: number): void {
    const rootA = this.find(axis, a);
    const rootB = this.find(axis, b);
    if (rootA !== rootB) {
      // Union by index keeps the structure deterministic across runs.
      this.parent[axis][Math.max(rootA, rootB)] = Math.min(rootA, rootB);
    }
  }

  private find(axis: Axis, v: number): number {
    const parent = this.parent[axis];
    let root = v;
    while (parent[root] !== root) {
      root = parent[root];
    }
    for (let node = v; parent[node] !== root; ) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  }
}

/**
 * §17–§18 CREATES_COINCIDENCE — would aligning `low` with `high` put an
 * existing edge on top of the new one?
 *
 * The paper states Theorem 1 for the eastward case and calls the other three
 * symmetric, so this is the eastward test with the coordinate axis passed in:
 * `separationAxis` plays the role of the paper's `x`, and two nodes count as
 * "horizontally aligned" when they share the alignment axis. `low`/`high` are
 * the endpoints in the order the alignment imposes along the separation axis,
 * which is the paper's assumption that `u` lies west of `v`.
 */
export function createsCoincidence(
  flags: AlignmentFlags,
  positions: readonly Position[],
  variableCount: number,
  low: number,
  high: number,
  alignmentAxis: Axis,
  separationAxis: Axis
): boolean {
  const coordinate = (index: number) => positions[index][separationAxis];

  for (let w = 0; w < variableCount; w++) {
    if (w === low || w === high) {
      continue;
    }
    if (!flags.isAligned(alignmentAxis, w, low) && !flags.isAligned(alignmentAxis, w, high)) {
      continue;
    }

    // (i) an edge leaving `low` that would end up on the shared line.
    if (
      flags.isConnected(low, w) &&
      (coordinate(low) < coordinate(w) || coordinate(high) < coordinate(w))
    ) {
      return true;
    }

    // (ii) an edge arriving at `high` from the same line.
    if (
      flags.isConnected(w, high) &&
      (coordinate(w) < coordinate(high) || coordinate(w) < coordinate(low))
    ) {
      return true;
    }
  }

  return false;
}

/** Axis-agnostic key, since the graph is undirected for these purposes. */
function edgeKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
