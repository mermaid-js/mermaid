import { log } from '../../../logger.js';
import { X_AXIS, Y_AXIS, pairKey, type FlowAxis } from '../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../ipsep-cola/adapter/graph.js';
import type { Axis, Position } from '../ipsep-cola/solver/stress.js';
import type { SeparationConstraint } from '../ipsep-cola/solver/types.js';
import type { SeparatedAlignment } from './aca/separatedAlignment.js';
import type { GridLikeOptions } from './options.js';
import { usesGridSnap } from './options.js';

/**
 * Constraint assembly for one axis of the grid-like layout.
 *
 * Three sources meet here: the definite constraints IPSEP-COLA already builds
 * (flow ordering and non-overlap, §19's "user-defined" set for Mermaid), the
 * tentative alignments ACA has accepted (§10), and — under Grid-Snap — the
 * strengthened separations of §6.3. The union of all three can close a cycle,
 * which no projection can satisfy, so the assembly ends by breaking cycles in
 * priority order.
 */

/** Priority of a constraint when a cycle has to be broken; lower survives. */
const FLOW = 0;
const ALIGNMENT = 1;
const NON_OVERLAP = 2;

export interface AxisConstraintInput {
  graph: IpsepColaGraph;
  positions: readonly Position[];
  axis: Axis;
  flow: FlowAxis;
  flowConstraints: { constraints: readonly SeparationConstraint[]; constrainedPairs: Set<string> };
  alignments: readonly SeparatedAlignment[];
  options: GridLikeOptions;
}

export function assembleAxisConstraints(input: AxisConstraintInput): SeparationConstraint[] {
  const { graph, positions, axis, flow, flowConstraints, alignments, options } = input;

  const equalities: SeparationConstraint[] = [];
  const ordered: { constraint: SeparationConstraint; priority: number }[] = [];

  if (axis === flow.axis) {
    for (const constraint of flowConstraints.constraints) {
      ordered.push({ constraint, priority: FLOW });
    }
  }

  for (const alignment of alignments) {
    if (alignment.alignmentAxis === axis) {
      equalities.push(...alignment.equality);
    } else {
      ordered.push({ constraint: alignment.separation, priority: ALIGNMENT });
    }
  }

  for (const constraint of buildNonOverlapConstraints(
    graph,
    positions,
    axis,
    options,
    flowConstraints.constrainedPairs
  )) {
    ordered.push({ constraint, priority: NON_OVERLAP });
  }

  return [...equalities, ...removeCycles(equalities, ordered, graph.variables.length)];
}

/**
 * Non-overlap constraints for one axis, regenerated from the current layout.
 *
 * This is IPSEP-COLA's construction with §6.3 folded in: when Grid-Snap is
 * running, the minimum separation rises to the grid spacing `σ`, so no two node
 * centres can settle on the same grid point. The pair is separated along
 * whichever axis needs the smaller correction, and the constraint is oriented
 * by the pair's current order, which is what keeps a freshly built set acyclic.
 */
export function buildNonOverlapConstraints(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  axis: Axis,
  options: GridLikeOptions,
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

      const separateOnX = overlapX <= overlapY;
      if ((axis === X_AXIS) !== separateOnX) {
        continue;
      }

      const [low, high] = positions[i][axis] <= positions[j][axis] ? [i, j] : [j, i];
      constraints.push({ left: low, right: high, gap: axis === X_AXIS ? requiredX : requiredY });
    }
  }

  return constraints;
}

/**
 * Centre-to-centre distance below which two boxes are too close on `axis`,
 * raised to `σ` while Grid-Snap is active (§6.3).
 */
function requiredSeparation(
  graph: IpsepColaGraph,
  i: number,
  j: number,
  axis: Axis,
  options: GridLikeOptions
): number {
  const a = graph.variables[i];
  const b = graph.variables[j];
  const extents = axis === X_AXIS ? (a.width + b.width) / 2 : (a.height + b.height) / 2;
  const spacing = axis === X_AXIS ? options.nodeSpacing : options.rankSpacing;
  const base = extents + spacing;

  return usesGridSnap(options.mode) ? Math.max(base, options.gridSpacing) : base;
}

/**
 * Break every cycle in the `left → right` digraph, dropping the lowest-priority
 * constraint the traversal can.
 *
 * Alignment equalities are not edges here: they merge their endpoints into one
 * quotient node, which is what they mean geometrically. Any other constraint
 * whose endpoints land in the same class is asking to separate two coordinates
 * an alignment has already made equal — infeasible, so it goes.
 *
 * Visiting each node's outgoing edges in priority order makes low-priority
 * constraints the ones found as back edges, so a non-overlap constraint is
 * dropped in preference to a flow constraint or an alignment. It is a bias, not
 * a guarantee: if an alignment does get dropped, the layout leaves it visibly
 * violated and ACA rejects it on the next residual check (§21), which is the
 * outcome §19 asks for anyway.
 */
function removeCycles(
  equalities: readonly SeparationConstraint[],
  ordered: readonly { constraint: SeparationConstraint; priority: number }[],
  variableCount: number
): SeparationConstraint[] {
  const parent = Array.from({ length: variableCount }, (_, i) => i);
  const find = (v: number): number => {
    let root = v;
    while (parent[root] !== root) {
      root = parent[root];
    }
    while (parent[v] !== root) {
      const next = parent[v];
      parent[v] = root;
      v = next;
    }
    return root;
  };
  for (const equality of equalities) {
    const a = find(equality.left);
    const b = find(equality.right);
    parent[Math.max(a, b)] = Math.min(a, b);
  }

  const candidates = [...ordered]
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index);

  const outgoing: { to: number; constraint: SeparationConstraint }[][] = Array.from(
    { length: variableCount },
    () => []
  );
  const dropped = new Set<SeparationConstraint>();

  for (const { constraint } of candidates) {
    const from = find(constraint.left);
    const to = find(constraint.right);
    if (from === to) {
      // Both endpoints are held equal by an alignment; a positive gap between
      // them cannot be satisfied.
      if (constraint.gap > 0) {
        dropped.add(constraint);
      }
      continue;
    }
    outgoing[from].push({ to, constraint });
  }

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const state = new Array<number>(variableCount).fill(UNVISITED);

  for (let root = 0; root < variableCount; root++) {
    if (state[root] !== UNVISITED || find(root) !== root) {
      continue;
    }
    // Iterative DFS: small graphs, but a long chain would still be a
    // stack-depth hazard.
    const stack: { node: number; edge: number }[] = [{ node: root, edge: 0 }];
    state[root] = ON_STACK;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (frame.edge >= outgoing[frame.node].length) {
        state[frame.node] = DONE;
        stack.pop();
        continue;
      }

      const { to, constraint } = outgoing[frame.node][frame.edge++];
      if (dropped.has(constraint)) {
        continue;
      }

      if (state[to] === ON_STACK) {
        dropped.add(constraint);
      } else if (state[to] === UNVISITED) {
        state[to] = ON_STACK;
        stack.push({ node: to, edge: 0 });
      }
    }
  }

  if (dropped.size > 0) {
    log.debug(`GRID-LIKE: dropped ${dropped.size} infeasible separation constraint(s)`);
  }

  return ordered.map((entry) => entry.constraint).filter((constraint) => !dropped.has(constraint));
}
