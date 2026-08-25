import { log } from '../../../logger.js';
import type { LayoutData, Node } from '../../types.js';
import type { PrioritisedConstraint } from './adapter/constraints.js';
import {
  buildContainmentConstraints,
  buildFlowConstraints,
  buildOverlapRemovalConstraints,
  buildSeparationConstraints,
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
import type { Axis, Position, Spring } from './solver/stress.js';
import { idealDistances } from './solver/stress.js';

type ConstraintsForAxis = (axis: Axis, positions: readonly Position[]) => PrioritisedConstraint[];

export interface IpsepColaLayoutResult {
  /** Leaf nodes handed to the solver. */
  variableCount: number;
  /** Subgraph frames given boundary variables. */
  groupCount: number;
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
  const graph = buildIpsepColaGraph(data4Layout, { groups: true, titleHeightOf });

  if (graph.variables.length === 0) {
    return { variableCount: 0, groupCount: 0, iterations: 0, stress: 0, options };
  }

  const flow = resolveFlowAxis((data4Layout as { direction?: string }).direction);
  const positions = computeInitialLayout(graph, flow, options);
  const distances = idealDistances(
    graph.variables.length,
    graph.neighbors,
    options.idealEdgeLength
  );

  // Flow and containment are fixed for the whole run; separation constraints are
  // rebuilt from the live layout on every call, which is why the solver treats
  // the constraint set as position-dependent.
  const flowConstraints = buildFlowConstraints(graph, flow, options);
  const containment = new Map<Axis, PrioritisedConstraint[]>([
    [X_AXIS, buildContainmentConstraints(graph, X_AXIS, options)],
    [Y_AXIS, buildContainmentConstraints(graph, Y_AXIS, options)],
  ]);

  const constraintsForAxis: ConstraintsForAxis = (axis, livePositions) => {
    const constraints: PrioritisedConstraint[] = [...(containment.get(axis) ?? [])];
    if (axis === flow.axis) {
      constraints.push(...flowConstraints.constraints);
    }
    constraints.push(
      ...buildSeparationConstraints(
        graph,
        livePositions,
        axis,
        options,
        flowConstraints.constrainedPairs
      )
    );
    return removeCyclicConstraints(constraints, graph.variableCount);
  };

  const result = ipsepCola(
    {
      positions,
      distances,
      springs: frameSprings(graph, options),
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

  enforceSeparation(graph, result.positions, options, flow, flowConstraints.constrainedPairs, {
    containment,
  });

  writeBackLayout(data4Layout, graph, result.positions, options);

  log.debug(
    `IPSEP-COLA: laid out ${graph.variables.length} node(s), ${graph.groups.groups.length} ` +
      `subgraph(s) and ${graph.entityLinks.length} link(s) in ${result.iterations} iteration(s)`
  );

  return {
    variableCount: graph.variables.length,
    groupCount: graph.groups.groups.length,
    iterations: result.iterations,
    stress: result.stress,
    options,
  };
}

/**
 * Clearance a subgraph's title needs at the top of its frame.
 *
 * `measureGroupLabel` writes `labelBBox` during the measure stage, so this is a
 * real measurement in the browser. DOM-free runs have no label box and fall
 * back to plain padding, which is the right answer there — nothing is drawn.
 */
function titleHeightOf(group: Node): number {
  return group.labelBBox?.height ?? 0;
}

/**
 * One zero-length spring per subgraph frame, pulling its two boundary variables
 * together so the frame closes on its contents (see {@link Spring}).
 *
 * The weight is expressed in the same units as the stress model — the weight of
 * a one-hop pair — so it stays proportional as the ideal edge length changes.
 */
function frameSprings(
  graph: ReturnType<typeof buildIpsepColaGraph>,
  options: IpsepColaOptions
): Spring[] {
  const unitWeight = 1 / (options.idealEdgeLength * options.idealEdgeLength);
  return graph.groups.groups.map((group) => ({
    a: group.minIndex,
    b: group.maxIndex,
    weight: unitWeight * options.frameTightness,
  }));
}

/**
 * Guarantee the finished layout is free of node overlaps.
 *
 * `CONSTRAINTS_FOR_AXIS` builds its separation constraints from the layout as
 * it stands at the *start* of an axis pass, so the solve that follows is free
 * to move nodes into overlaps that pass never saw. The outer majorisation loop
 * normally cleans those up next time round, but it can also converge first —
 * and a rendered diagram with stacked nodes is not an acceptable output.
 *
 * The repair runs on the axis across the flow, so it cannot disturb the rank
 * ordering the flow constraints established: those live on the flow axis, which
 * this projection never touches. Containment travels with it, so a frame cannot
 * be left behind by the children it holds.
 */
function enforceSeparation(
  graph: ReturnType<typeof buildIpsepColaGraph>,
  positions: Position[],
  options: IpsepColaOptions,
  flow: ReturnType<typeof resolveFlowAxis>,
  flowConstrainedPairs: ReadonlySet<string>,
  { containment }: { containment: Map<Axis, PrioritisedConstraint[]> }
): void {
  if (!hasOverlaps(graph, positions, options, flowConstrainedPairs)) {
    return;
  }

  const axis = flow.axis === Y_AXIS ? X_AXIS : Y_AXIS;
  const constraints = removeCyclicConstraints(
    [
      ...(containment.get(axis) ?? []),
      ...buildOverlapRemovalConstraints(graph, positions, axis, options),
    ],
    graph.variableCount
  );

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
