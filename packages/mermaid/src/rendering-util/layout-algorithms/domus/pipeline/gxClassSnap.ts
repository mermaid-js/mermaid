/**
 * iter-47: post-nudge Gx/Gy equivalence-class snap pass.
 *
 * DOMUS drawability builds Gx (resp. Gy) equivalence classes over U/D
 * (resp. L/R) labeled edges via union-find at `domus/drawability.ts:85-114`.
 * All vertices in one Gx class share the same x-coordinate per DOMUS §3
 * Theorem 2 (source `6784b3d1`) and Siebenhaller KM99 equality-arc semantics
 * (source `0fb2d84f` §2.3.2.1 / Def. 2.5). A vertical Kandinsky edge has
 * zero horizontal segments, contributing NO horizontal padding variable —
 * source and target x-coords MUST be exactly equal.
 *
 * The post-DOMUS pipeline runs several nudgers for minimum spacing and
 * overlap avoidance (minSpacingNudging, labelNeighborGapNudging,
 * edgeGapNudging, boxNudging). Those nudgers are class-unaware — they
 * shift individual nodes to resolve local spacing, breaking the paper
 * invariant and producing ~5u intra-class splay. On life-choices the
 * `n4` node ends up 5u LEFT of its chain siblings (nl/no/n6/ne) because
 * `nudgeConnectedPairsForMinGap` nudges n4 away from sibling `nr`.
 *
 * This pass re-aligns nodes inside each Gx/Gy class to the median of
 * their current coords, restoring paper invariant after nudging. Guarded
 * by a spread threshold so large (intentional) nudges aren't undone.
 */
import type { LayoutData, Node } from '../../../types.js';
import type { Shape, DomusGraph } from '../domus/types.js';

type AxisLabel = 'U' | 'D' | 'L' | 'R';

export interface GxClassSnapResult {
  /** classes touched */
  xClassesSnapped: number;
  yClassesSnapped: number;
  /** total nodes moved */
  xNodesMoved: number;
  yNodesMoved: number;
  /** max displacement applied */
  maxXDelta: number;
  maxYDelta: number;
}

/**
 * Build equivalence classes over axis-aligned edges using union-find.
 * U/D edges union their endpoints (both share x = Gx class).
 * L/R edges union their endpoints (both share y = Gy class).
 */
function buildEquivalenceClasses(
  graph: DomusGraph,
  shape: Shape,
  axis: 'x' | 'y'
): Map<string, string[]> {
  const parent = new Map<string, string>();
  const find = (v: string): string => {
    if (!parent.has(v)) {
      parent.set(v, v);
    }
    let root = parent.get(v)!;
    while (root !== parent.get(root)!) {
      const next = parent.get(root)!;
      parent.set(root, parent.get(next) ?? next);
      root = parent.get(root)!;
    }
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent.set(ra, rb);
    }
  };

  for (const v of graph.vertices) {
    find(v);
  }
  const sameAxisLabels: AxisLabel[] = axis === 'x' ? ['U', 'D'] : ['L', 'R'];
  for (const edge of graph.edges.values()) {
    const label = shape.labels.get(edge.id);
    if (label && sameAxisLabels.includes(label as AxisLabel)) {
      union(edge.from, edge.to);
    }
  }
  const classes = new Map<string, string[]>();
  for (const v of graph.vertices) {
    const r = find(v);
    if (!classes.has(r)) {
      classes.set(r, []);
    }
    classes.get(r)!.push(v);
  }
  return classes;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return 0;
  }
  if (n % 2 === 1) {
    return sorted[(n - 1) / 2];
  }
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * Snap vertex coordinates within each Gx/Gy equivalence class to the
 * class median, if the class's current spread is below a threshold
 * (suggesting nudger-induced drift rather than intentional placement).
 *
 * @param data - LayoutData whose `node.x` / `node.y` will be mutated.
 * @param graph - DomusGraph from domusResult.
 * @param shape - Shape assignment (edge label is L, R, U, or D).
 * @param spreadThreshold - Class is snapped only if max-min spread ≤ this.
 */
export function applyGxClassSnap(
  data: LayoutData,
  graph: DomusGraph,
  shape: Shape,
  spreadThreshold: number
): GxClassSnapResult {
  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    if (n?.id != null) {
      nodesById.set(String(n.id), n);
    }
  }

  const result: GxClassSnapResult = {
    xClassesSnapped: 0,
    yClassesSnapped: 0,
    xNodesMoved: 0,
    yNodesMoved: 0,
    maxXDelta: 0,
    maxYDelta: 0,
  };

  /**
   * Map a DOMUS graph vertex id back to a LayoutData node id.
   *
   * DOMUS port-expands any vertex with multiple edges on one side into
   * `${id}_core` plus `${id}_port_{side}_{idx}` (see
   * `domus/vertexExpansion.ts`). Port vertices have no LayoutData node
   * counterpart — they are geometry-only. Only the `_core` vertex maps
   * back to the original LayoutData node (see
   * `collapseExpandedVertices` at `vertexExpansion.ts:262-305`).
   *
   * Dummy bend vertices (e.g. `dummy_L_USCompany_HongKongCompany_0-from-label_0`)
   * also have no LayoutData node — they live inside polylines only.
   */
  const resolveLayoutNode = (vId: string): Node | undefined => {
    const direct = nodesById.get(vId);
    if (direct) {
      return direct;
    }
    if (vId.endsWith('_core')) {
      const baseId = vId.slice(0, -'_core'.length);
      return nodesById.get(baseId);
    }
    return undefined;
  };

  const snapAxis = (axis: 'x' | 'y'): void => {
    const classes = buildEquivalenceClasses(graph, shape, axis);
    for (const members of classes.values()) {
      if (members.length < 2) {
        continue;
      }
      const coords: number[] = [];
      const nodes: Node[] = [];
      for (const vId of members) {
        const n = resolveLayoutNode(vId);
        if (!n) {
          continue;
        }
        const c = axis === 'x' ? (n as { x?: number }).x : (n as { y?: number }).y;
        if (typeof c !== 'number' || !Number.isFinite(c)) {
          continue;
        }
        coords.push(c);
        nodes.push(n);
      }
      if (coords.length < 2) {
        continue;
      }
      const spread = Math.max(...coords) - Math.min(...coords);
      if (spread <= 0.0001) {
        continue;
      } // already aligned
      if (spread > spreadThreshold) {
        continue;
      } // nudger moved too far; leave alone
      const target = median(coords);
      let moved = 0;
      let maxDelta = 0;
      for (const [i, node] of nodes.entries()) {
        const c = coords[i];
        const delta = Math.abs(c - target);
        if (delta > 0.0001) {
          if (axis === 'x') {
            (node as { x: number }).x = target;
          } else {
            (node as { y: number }).y = target;
          }
          moved++;
          if (delta > maxDelta) {
            maxDelta = delta;
          }
        }
      }
      if (moved > 0) {
        if (axis === 'x') {
          result.xClassesSnapped++;
          result.xNodesMoved += moved;
          if (maxDelta > result.maxXDelta) {
            result.maxXDelta = maxDelta;
          }
        } else {
          result.yClassesSnapped++;
          result.yNodesMoved += moved;
          if (maxDelta > result.maxYDelta) {
            result.maxYDelta = maxDelta;
          }
        }
      }
    }
  };

  snapAxis('x');
  snapAxis('y');
  return result;
}
