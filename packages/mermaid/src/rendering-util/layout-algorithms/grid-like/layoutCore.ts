import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import {
  buildFlowConstraints,
  buildOverlapRemovalConstraints,
  hasOverlaps,
  resolveFlowAxis,
  X_AXIS,
  Y_AXIS,
} from '../ipsep-cola/adapter/constraints.js';
import { buildIpsepColaGraph } from '../ipsep-cola/adapter/graph.js';
import { computeInitialLayout } from '../ipsep-cola/adapter/initialLayout.js';
import { writeBackLayout } from '../ipsep-cola/adapter/writeBack.js';
import { BlockState } from '../ipsep-cola/solver/blocks.js';
import { ipsepCola } from '../ipsep-cola/solver/ipsepCola.js';
import { project } from '../ipsep-cola/solver/project.js';
import type { Axis, Position } from '../ipsep-cola/solver/stress.js';
import { idealDistances } from '../ipsep-cola/solver/stress.js';
import type { SeparationConstraint } from '../ipsep-cola/solver/types.js';
import { adaptiveConstrainedAlignment } from './aca/aca.js';
import type { SeparatedAlignment } from './aca/separatedAlignment.js';
import { assembleAxisConstraints } from './gridConstraints.js';
import type { GridLikeOptions } from './options.js';
import { resolveGridLikeOptions, usesAca, usesGridSnap, usesNodeSnap } from './options.js';
import { snapLayout } from './snap/snapLayout.js';

export interface GridLikeLayoutResult {
  /** Nodes handed to the solver (groups excluded). */
  variableCount: number;
  /** Outer stress-majorisation iterations of the phase-1 layout. */
  iterations: number;
  /** Stress of the phase-1 layout. */
  stress: number;
  /** Separated alignments ACA made permanent (§22). */
  alignments: number;
  /** Alignments withdrawn because a definite constraint won (§21). */
  rejectedAlignments: number;
  /** Projected-gradient iterations of the snap phase, 0 if it did not run. */
  snapIterations: number;
  /** Value of the snap objective at the end, 0 if the snap phase did not run. */
  objective: number;
  options: GridLikeOptions;
}

/**
 * Grid-like layout (Kieffer, Dwyer, Marriott & Wybrow 2013) over already
 * measured `LayoutData`, mutating it in place.
 *
 * §26 PAPER_GRID_LAYOUT: an untangled constrained force-directed layout first,
 * then the selected grid-like beautification — hard alignments (ACA), soft snap
 * penalties, or, by default, both. Constrained force-directed layout is not
 * reimplemented here: it is the sibling IPSEP-COLA layout, which also supplies
 * the graph model, the initial layout, the separation constraints and the
 * write-back. See `KIEFFER-2013-Pseudocode.md`.
 *
 * DOM-free by contract: every node and edge label size this reads must already
 * have been measured by the render pipeline's measure stage, which is what lets
 * the same entry point drive both the browser renderer and DOM-decoupled tests.
 */
export function runGridLikeLayoutCore(
  data4Layout: LayoutData,
  overrides?: Partial<GridLikeOptions>
): GridLikeLayoutResult {
  const options = resolveGridLikeOptions(data4Layout, overrides);
  const graph = buildIpsepColaGraph(data4Layout);

  const empty: GridLikeLayoutResult = {
    variableCount: 0,
    iterations: 0,
    stress: 0,
    alignments: 0,
    rejectedAlignments: 0,
    snapIterations: 0,
    objective: 0,
    options,
  };
  if (graph.variables.length === 0) {
    return empty;
  }

  const flow = resolveFlowAxis((data4Layout as { direction?: string }).direction);
  const positions = computeInitialLayout(graph, flow, options);
  const distances = idealDistances(
    graph.variables.length,
    graph.neighbors,
    options.idealEdgeLength
  );
  const flowConstraints = buildFlowConstraints(graph, flow, options);

  // §26 step 1 — untangle with the definite ordering constraints only. The
  // paper disables non-overlap here on purpose: overlaps at this stage are
  // cheap to fix and letting nodes pass through each other is what stops the
  // untangling getting stuck. Every later phase enforces non-overlap again.
  const phaseOne = ipsepCola(
    {
      positions,
      distances,
      constraintsForAxis: (axis) => (axis === flow.axis ? [...flowConstraints.constraints] : []),
      constraintsDependOnPositions: false,
    },
    {
      maxIterations: options.maxIterations,
      convergenceTolerance: options.convergenceTolerance,
      qpsc: { tolerance: options.qpscTolerance, maxIterations: options.maxQpscIterations },
    }
  );

  const constraintsForAxis = (
    alignments: readonly SeparatedAlignment[]
  ): ((axis: Axis, live: readonly Position[]) => SeparationConstraint[]) => {
    return (axis, live) =>
      assembleAxisConstraints({
        graph,
        positions: live,
        axis,
        flow,
        flowConstraints,
        alignments,
        options,
      });
  };

  // §26 step 2 — grid-like beautification.
  let alignments: readonly SeparatedAlignment[] = [];
  let rejectedAlignments = 0;

  if (usesAca(options.mode)) {
    const aca = adaptiveConstrainedAlignment(
      graph,
      positions,
      distances,
      flow,
      // ACA is incremental (§9): every round starts from the layout the last
      // one produced and adds a single constraint, so the majorisation only has
      // to settle that constraint's neighbourhood — not re-solve the drawing.
      // Running it to full convergence once per accepted alignment costs |E|
      // full layouts and dominates everything else the algorithm does.
      (accepted) =>
        runCfdl(positions, distances, constraintsForAxis(accepted), options, options.acaIterations),
      options
    );
    alignments = aca.alignments;
    rejectedAlignments = aca.rejected;

    // One full solve at the end, now that the constraint set is settled.
    runCfdl(positions, distances, constraintsForAxis(alignments), options);
  }

  let snapIterations = 0;
  let objective = 0;

  if (usesGridSnap(options.mode) || usesNodeSnap(options.mode)) {
    const snapped = snapLayout(
      {
        graph,
        distances,
        positions,
        constraintsForAxis: constraintsForAxis(alignments),
      },
      options
    );
    snapIterations = snapped.iterations;
    objective = snapped.objective;
  } else if (!usesAca(options.mode)) {
    // Nothing selected: run the constrained layout so the result is at least a
    // feasible IPSEP-COLA drawing rather than the untangled phase-1 one.
    runCfdl(positions, distances, constraintsForAxis(alignments), options);
  }

  enforceSeparation(graph, positions, options, flow, flowConstraints.constrainedPairs, alignments);

  writeBackLayout(data4Layout, graph, positions, options);

  log.debug(
    `GRID-LIKE: laid out ${graph.variables.length} node(s) and ${graph.links.length} link(s) ` +
      `in mode ${options.mode} with ${alignments.length} alignment(s)`
  );

  return {
    variableCount: graph.variables.length,
    iterations: phaseOne.iterations,
    stress: phaseOne.stress,
    alignments: alignments.length,
    rejectedAlignments,
    snapIterations,
    objective,
    options,
  };
}

/** One CFDL call: IPSEP-COLA continuing from the layout it is handed (§30.1). */
function runCfdl(
  positions: Position[],
  distances: ReturnType<typeof idealDistances>,
  constraintsForAxis: (axis: Axis, live: readonly Position[]) => SeparationConstraint[],
  options: GridLikeOptions,
  maxIterations = options.maxIterations
): Position[] {
  return ipsepCola(
    {
      positions,
      distances,
      constraintsForAxis,
      constraintsDependOnPositions: true,
    },
    {
      maxIterations,
      convergenceTolerance: options.convergenceTolerance,
      qpsc: { tolerance: options.qpscTolerance, maxIterations: options.maxQpscIterations },
    }
  ).positions;
}

/**
 * Guarantee the finished layout is free of node overlaps.
 *
 * Same guarantee — and the same construction (Dwyer, Marriott & Stuckey, *Fast
 * Node Overlap Removal*) — as the IPSEP-COLA repair pass, with one addition:
 * the alignment equalities travel with it. Without them a repair on the axis
 * ACA aligned would pull apart the very columns the alignments were added to
 * create; with them, an aligned column moves as one block and the drawing keeps
 * its grid structure.
 */
function enforceSeparation(
  graph: ReturnType<typeof buildIpsepColaGraph>,
  positions: Position[],
  options: GridLikeOptions,
  flow: ReturnType<typeof resolveFlowAxis>,
  flowConstrainedPairs: ReadonlySet<string>,
  alignments: readonly SeparatedAlignment[]
): void {
  if (!hasOverlaps(graph, positions, options, flowConstrainedPairs)) {
    return;
  }

  const axis = flow.axis === Y_AXIS ? X_AXIS : Y_AXIS;
  const equalities = alignments
    .filter((alignment) => alignment.alignmentAxis === axis)
    .flatMap((alignment) => alignment.equality);
  const constraints = [
    ...equalities,
    ...buildOverlapRemovalConstraints(graph, positions, axis, options),
  ];

  const coordinates = positions.map((position) => position[axis]);
  const projected = project(new BlockState(coordinates), coordinates, constraints);

  for (const [i, position] of positions.entries()) {
    if (Number.isFinite(projected[i])) {
      position[axis] = projected[i];
    }
  }

  if (hasOverlaps(graph, positions, options, flowConstrainedPairs)) {
    log.debug('GRID-LIKE: overlaps remain after the separation pass');
  }
}
