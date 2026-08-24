import { log } from '../../../../logger.js';
import type { Axis, Position } from '../solver/stress.js';
import type { SeparationConstraint } from '../solver/types.js';
import type { IpsepColaOptions } from '../options.js';
import type { IpsepColaGraph } from './graph.js';

export const X_AXIS: Axis = 0;
export const Y_AXIS: Axis = 1;

/** Which axis the diagram flows along, and whether edges run along it or against it. */
export interface FlowAxis {
  axis: Axis;
  /** `false` for `BT`/`RL`, where an edge's target sits on the low side. */
  forward: boolean;
}

export function resolveFlowAxis(direction: string | undefined): FlowAxis {
  switch ((direction ?? 'TB').trim().toUpperCase()) {
    case 'LR':
      return { axis: X_AXIS, forward: true };
    case 'RL':
      return { axis: X_AXIS, forward: false };
    case 'BT':
      return { axis: Y_AXIS, forward: false };
    case 'TB':
    case 'TD':
    default:
      return { axis: Y_AXIS, forward: true };
  }
}

/** Size of a variable along one axis. */
function extent(graph: IpsepColaGraph, index: number, axis: Axis): number {
  const variable = graph.variables[index];
  return axis === X_AXIS ? variable.width : variable.height;
}

/** Centre-to-centre distance below which two boxes touch on `axis`. */
function requiredSeparation(
  graph: IpsepColaGraph,
  i: number,
  j: number,
  axis: Axis,
  options: IpsepColaOptions
): number {
  return extent(graph, i, axis) / 2 + extent(graph, j, axis) / 2 + options.nodeSpacing;
}

/**
 * Whether any pair of node boxes still overlaps.
 *
 * Pairs in `skipPairs` are joined by a flow constraint whose gap already covers
 * their half-extents, so a satisfied constraint system keeps them clear.
 */
export function hasOverlaps(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: IpsepColaOptions,
  skipPairs: ReadonlySet<string>
): boolean {
  const count = graph.variables.length;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (skipPairs.has(pairKey(i, j))) {
        continue;
      }
      const overlapX =
        requiredSeparation(graph, i, j, X_AXIS, options) -
        Math.abs(positions[i][X_AXIS] - positions[j][X_AXIS]);
      const overlapY =
        requiredSeparation(graph, i, j, Y_AXIS, options) -
        Math.abs(positions[i][Y_AXIS] - positions[j][Y_AXIS]);
      if (overlapX > 1e-6 && overlapY > 1e-6) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Directed separation constraints along the flow axis, one per edge.
 *
 * The gap is the two half-extents plus `rankSpacing`, so a satisfied flow
 * constraint already guarantees the pair does not overlap on that axis — which
 * is why `buildNonOverlapConstraints` skips these pairs.
 *
 * Cycles in the edge set would make the constraint system infeasible, so back
 * edges are dropped: the cycle still exists in the drawing, its edge simply
 * does not dictate an ordering.
 */
export function buildFlowConstraints(
  graph: IpsepColaGraph,
  flow: FlowAxis,
  options: IpsepColaOptions
): { constraints: SeparationConstraint[]; constrainedPairs: Set<string> } {
  const constraints: SeparationConstraint[] = [];
  const constrainedPairs = new Set<string>();

  if (!options.respectDirection) {
    return { constraints, constrainedPairs };
  }

  for (const link of acyclicLinks(graph)) {
    const [low, high] = flow.forward ? [link.source, link.target] : [link.target, link.source];

    constraints.push({
      left: low,
      right: high,
      gap:
        extent(graph, low, flow.axis) / 2 +
        extent(graph, high, flow.axis) / 2 +
        options.rankSpacing,
    });
    constrainedPairs.add(pairKey(link.source, link.target));
  }

  return { constraints, constrainedPairs };
}

/**
 * Non-overlap constraints for one axis, regenerated from the current layout.
 *
 * For every pair whose bounding boxes currently overlap on both axes, the pair
 * is separated along whichever axis needs the smaller correction — pushing on
 * the other one would move the nodes further than necessary. The constraint is
 * oriented by the pair's current order along the axis, which is what keeps a
 * freshly generated set free of cycles.
 */
export function buildNonOverlapConstraints(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  axis: Axis,
  options: IpsepColaOptions,
  skipPairs: ReadonlySet<string>
): SeparationConstraint[] {
  const constraints: SeparationConstraint[] = [];
  const count = graph.variables.length;

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (skipPairs.has(pairKey(i, j))) {
        continue;
      }

      const requiredX = requiredSeparation(graph, i, j, X_AXIS, options);
      const requiredY = requiredSeparation(graph, i, j, Y_AXIS, options);

      const overlapX = requiredX - Math.abs(positions[i][X_AXIS] - positions[j][X_AXIS]);
      const overlapY = requiredY - Math.abs(positions[i][Y_AXIS] - positions[j][Y_AXIS]);
      if (overlapX <= 0 || overlapY <= 0) {
        continue;
      }

      // Separate along the cheaper axis only; the other pass sees the pair as
      // already resolved.
      const separateOnX = overlapX <= overlapY;
      if ((axis === X_AXIS) !== separateOnX) {
        continue;
      }

      const gap = axis === X_AXIS ? requiredX : requiredY;
      const [low, high] = positions[i][axis] <= positions[j][axis] ? [i, j] : [j, i];
      constraints.push({ left: low, right: high, gap });
    }
  }

  return constraints;
}

/**
 * A constraint set whose projection removes **every** node overlap in one pass.
 *
 * `buildNonOverlapConstraints` only constrains pairs that overlap on both axes,
 * which is the right touch during majorisation but does not converge as a
 * repair: separating one pair along an axis shoves its neighbours into fresh
 * overlaps, and the next round plays the same game with different pairs.
 *
 * This is the standard construction instead (Dwyer, Marriott & Stuckey, *Fast
 * Node Overlap Removal*): constrain every pair that shares a band on the
 * **other** axis, whether or not it currently overlaps. Because the projection
 * moves `axis` only, the set of band-sharing pairs cannot change while it runs,
 * so afterwards each pair is either clear on the other axis or separated on
 * this one — no overlaps, guaranteed, with no iteration. Pairs that are already
 * far enough apart yield satisfied constraints, which cost the projection
 * nothing.
 *
 * Ordering each constraint by the pair's current position along `axis` makes
 * the set a total order, and therefore always feasible.
 */
export function buildOverlapRemovalConstraints(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  axis: Axis,
  options: IpsepColaOptions
): SeparationConstraint[] {
  const otherAxis = axis === X_AXIS ? Y_AXIS : X_AXIS;
  const constraints: SeparationConstraint[] = [];
  const count = graph.variables.length;

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const bandOverlap =
        requiredSeparation(graph, i, j, otherAxis, options) -
        Math.abs(positions[i][otherAxis] - positions[j][otherAxis]);
      if (bandOverlap <= 0) {
        continue;
      }

      const [low, high] = positions[i][axis] <= positions[j][axis] ? [i, j] : [j, i];
      constraints.push({
        left: low,
        right: high,
        gap: requiredSeparation(graph, i, j, axis, options),
      });
    }
  }

  return constraints;
}

/**
 * Drop constraints that close a cycle in the `left → right` digraph.
 *
 * A cyclic separation system has no feasible point, and PROJECT (§4) would keep
 * repairing constraints that break each other. Flow constraints alone are made
 * acyclic upstream and non-overlap constraints agree with the current ordering,
 * but the union of the two can still close a cycle once a flow constraint is
 * violated at the current layout. Dropping the closing edge is the cheapest way
 * to guarantee feasibility, and it self-heals: the next iteration regenerates
 * the non-overlap set from the repaired layout.
 */
export function removeCyclicConstraints(
  constraints: readonly SeparationConstraint[],
  variableCount: number
): SeparationConstraint[] {
  const outgoing: number[][] = Array.from({ length: variableCount }, () => []);
  const constraintsByIndex: SeparationConstraint[][] = Array.from(
    { length: variableCount },
    () => []
  );
  for (const constraint of constraints) {
    outgoing[constraint.left].push(constraint.right);
    constraintsByIndex[constraint.left].push(constraint);
  }

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const state = new Array<number>(variableCount).fill(UNVISITED);
  const dropped = new Set<SeparationConstraint>();

  for (let root = 0; root < variableCount; root++) {
    if (state[root] !== UNVISITED) {
      continue;
    }
    // Iterative DFS: graphs are small, but a recursive walk would still be a
    // stack-depth hazard on a long chain.
    const stack: { node: number; edge: number }[] = [{ node: root, edge: 0 }];
    state[root] = ON_STACK;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.edge >= outgoing[frame.node].length) {
        state[frame.node] = DONE;
        stack.pop();
        continue;
      }

      const edgeIndex = frame.edge++;
      const constraint = constraintsByIndex[frame.node][edgeIndex];
      if (dropped.has(constraint)) {
        continue;
      }
      const next = outgoing[frame.node][edgeIndex];

      if (state[next] === ON_STACK) {
        dropped.add(constraint);
      } else if (state[next] === UNVISITED) {
        state[next] = ON_STACK;
        stack.push({ node: next, edge: 0 });
      }
    }
  }

  if (dropped.size > 0) {
    log.debug(`IPSEP-COLA: dropped ${dropped.size} cyclic separation constraint(s)`);
  }

  return constraints.filter((constraint) => !dropped.has(constraint));
}

export function pairKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * The link set with cycles broken, as a DFS spanning structure minus its back
 * edges. Deterministic: links are visited in `data4Layout.edges` order.
 */
function acyclicLinks(graph: IpsepColaGraph): { source: number; target: number }[] {
  const outgoing: number[][] = graph.variables.map(() => []);
  for (const [index, link] of graph.links.entries()) {
    outgoing[link.source].push(index);
  }

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const state = new Array<number>(graph.variables.length).fill(UNVISITED);
  const isBackEdge = new Array<boolean>(graph.links.length).fill(false);

  for (let root = 0; root < graph.variables.length; root++) {
    if (state[root] !== UNVISITED) {
      continue;
    }
    const stack: { node: number; edge: number }[] = [{ node: root, edge: 0 }];
    state[root] = ON_STACK;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.edge >= outgoing[frame.node].length) {
        state[frame.node] = DONE;
        stack.pop();
        continue;
      }

      const linkIndex = outgoing[frame.node][frame.edge++];
      const next = graph.links[linkIndex].target;

      if (state[next] === ON_STACK) {
        isBackEdge[linkIndex] = true;
      } else if (state[next] === UNVISITED) {
        state[next] = ON_STACK;
        stack.push({ node: next, edge: 0 });
      }
    }
  }

  return graph.links.filter((_, index) => !isBackEdge[index]);
}
