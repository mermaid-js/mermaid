import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import {
  buildFlowConstraints,
  buildNonOverlapConstraints,
  buildOverlapRemovalConstraints,
  hasOverlaps,
  removeCyclicConstraints,
  resolveFlowAxis,
  X_AXIS,
  Y_AXIS,
} from './adapter/constraints.js';
import { buildIpsepColaGraph } from './adapter/graph.js';
import { computeInitialLayout } from './adapter/initialLayout.js';
import { writeBackLayout } from './adapter/writeBack.js';
import type { IpsepColaOptions } from './options.js';
import { resolveIpsepColaOptions } from './options.js';
import { BlockState } from './solver/blocks.js';
import { ipsepCola } from './solver/ipsepCola.js';
import { project } from './solver/project.js';
import type { Axis, Position } from './solver/stress.js';
import { idealDistances } from './solver/stress.js';
import type { SeparationConstraint } from './solver/types.js';

type ConstraintsForAxis = (axis: Axis, positions: readonly Position[]) => SeparationConstraint[];

export interface IpsepColaLayoutResult {
  /** Nodes handed to the solver (groups excluded). */
  variableCount: number;
  /** Outer stress-majorisation iterations actually run. */
  iterations: number;
  /** Stress of the final layout. */
  stress: number;
  options: IpsepColaOptions;
}

/**
 * Run IPSEP-COLA over already-measured `LayoutData`, mutating it in place.
 *
 * DOM-free by contract: every node and edge label size this reads must already
 * have been measured by the render pipeline's measure stage, which is what lets
 * the same entry point drive both the browser renderer and DOM-decoupled tests.
 */
export function runIpsepColaLayoutCore(
  data4Layout: LayoutData,
  overrides?: Partial<IpsepColaOptions>
): IpsepColaLayoutResult {
  const options = resolveIpsepColaOptions(data4Layout, overrides);
  const graph = buildIpsepColaGraph(data4Layout);

  if (graph.variables.length === 0) {
    return { variableCount: 0, iterations: 0, stress: 0, options };
  }

  const flow = resolveFlowAxis((data4Layout as { direction?: string }).direction);
  const positions = computeInitialLayout(graph, flow, options);
  const distances = idealDistances(
    graph.variables.length,
    graph.neighbors,
    options.idealEdgeLength
  );

  // Flow constraints are fixed for the whole run; non-overlap constraints are
  // rebuilt from the live layout on every call, which is why the solver treats
  // the constraint set as position-dependent.
  const flowConstraints = buildFlowConstraints(graph, flow, options);

  const constraintsForAxis: ConstraintsForAxis = (axis, livePositions) => {
    const constraints: SeparationConstraint[] =
      axis === flow.axis ? [...flowConstraints.constraints] : [];

    constraints.push(
      ...buildNonOverlapConstraints(
        graph,
        livePositions,
        axis,
        options,
        flowConstraints.constrainedPairs
      )
    );

    return removeCyclicConstraints(constraints, graph.variables.length);
  };

  const result = ipsepCola(
    {
      positions,
      distances,
      constraintsForAxis,
      constraintsDependOnPositions: true,
    },
    {
      maxIterations: options.maxIterations,
      convergenceTolerance: options.convergenceTolerance,
      qpsc: {
        tolerance: options.qpscTolerance,
        maxIterations: options.maxQpscIterations,
      },
    }
  );

  enforceSeparation(graph, result.positions, options, flow, flowConstraints.constrainedPairs);

  writeBackLayout(data4Layout, graph, result.positions, options);

  log.debug(
    `IPSEP-COLA: laid out ${graph.variables.length} node(s) and ${graph.links.length} link(s) ` +
      `in ${result.iterations} iteration(s)`
  );

  return {
    variableCount: graph.variables.length,
    iterations: result.iterations,
    stress: result.stress,
    options,
  };
}

/**
 * Guarantee the finished layout is free of node overlaps.
 *
 * `CONSTRAINTS_FOR_AXIS` builds its non-overlap constraints from the layout as
 * it stands at the *start* of an axis pass, so the solve that follows is free
 * to move nodes into overlaps that pass never saw. The outer majorisation loop
 * normally cleans those up next time round, but it can also converge first —
 * and a rendered diagram with stacked nodes is not an acceptable output.
 *
 * The repair runs on the axis across the flow, so it cannot disturb the rank
 * ordering the flow constraints established: those live on the flow axis, which
 * this projection never touches. §4 PROJECT returns the nearest feasible point,
 * making this the smallest correction that separates the nodes.
 */
function enforceSeparation(
  graph: ReturnType<typeof buildIpsepColaGraph>,
  positions: Position[],
  options: IpsepColaOptions,
  flow: ReturnType<typeof resolveFlowAxis>,
  flowConstrainedPairs: ReadonlySet<string>
): void {
  if (!hasOverlaps(graph, positions, options, flowConstrainedPairs)) {
    return;
  }

  const axis = flow.axis === Y_AXIS ? X_AXIS : Y_AXIS;
  const constraints = buildOverlapRemovalConstraints(graph, positions, axis, options);
  const coordinates = positions.map((position) => position[axis]);
  const projected = project(new BlockState(coordinates), coordinates, constraints);

  for (const [i, position] of positions.entries()) {
    if (Number.isFinite(projected[i])) {
      position[axis] = projected[i];
    }
  }

  if (hasOverlaps(graph, positions, options, flowConstrainedPairs)) {
    log.debug('IPSEP-COLA: overlaps remain after the separation pass');
  }
}
