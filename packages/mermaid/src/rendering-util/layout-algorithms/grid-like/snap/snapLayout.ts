import { log } from '../../../../logger.js';
import { X_AXIS, Y_AXIS } from '../../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import { BlockState } from '../../ipsep-cola/solver/blocks.js';
import type { Matrix } from '../../ipsep-cola/solver/linalg.js';
import { project } from '../../ipsep-cola/solver/project.js';
import type { Axis, Position } from '../../ipsep-cola/solver/stress.js';
import type { SeparationConstraint } from '../../ipsep-cola/solver/types.js';
import type { GridLikeOptions } from '../options.js';
import type { Gradient } from './penalties.js';
import { snapObjective, zeroGradient } from './penalties.js';

const AXES: Axis[] = [X_AXIS, Y_AXIS];

export interface SnapProblem {
  graph: IpsepColaGraph;
  /** Ideal graph-theoretic distances `d_uv`, as IPSEP-COLA builds them. */
  distances: Matrix;
  /** Mutated in place and returned. */
  positions: Position[];
  /** The feasible region: §19's definite constraints plus ACA's alignments. */
  constraintsForAxis: (axis: Axis, positions: readonly Position[]) => SeparationConstraint[];
}

export interface SnapResult {
  positions: Position[];
  iterations: number;
  objective: number;
}

/**
 * MINIMIZE_WITH_CONSTRAINTS for the soft-constraint objective of §5–§8.
 *
 * The paper leaves the numerical method open (§30.3), so this is projected
 * gradient descent: step along `-∇f`, project the result back onto the
 * separation constraints with IPSEP-COLA's block solver (§4 `PROJECT`), and
 * accept the step only if the objective actually falls, halving it until it
 * does. That combination is what keeps the snap terms honest — they are allowed
 * to pull a node toward a grid point, but never through another node.
 *
 * The first trial step is scaled so the largest node moves about one snap
 * radius: the objective's units are arbitrary (a sum of weighted squares over
 * pixels), so a fixed step length would be meaningless.
 */
export function snapLayout(problem: SnapProblem, options: GridLikeOptions): SnapResult {
  const { graph, distances, positions } = problem;
  const count = positions.length;

  if (count === 0) {
    return { positions, iterations: 0, objective: 0 };
  }

  // The incoming layout comes from a constrained solve, but Grid-Snap
  // strengthens the separations (§6.3), so it may not be feasible for *these*
  // constraints yet.
  applyProjection(problem, positions);

  let objective = snapObjective(graph, distances, positions, options);
  let iterations = 0;

  for (; iterations < options.snapIterations; iterations++) {
    const gradient = zeroGradient(count);
    snapObjective(graph, distances, positions, options, gradient);

    const largest = largestComponent(gradient);
    if (largest < 1e-12) {
      break;
    }

    // Scale the trial step so the node feeling the strongest pull moves about
    // one snap radius. The objective is a sum of weighted squares with no
    // natural unit, so a fixed step length would mean nothing; rescaling every
    // iteration also keeps the search from stalling at a length that happened
    // to work once.
    const step = options.snapDistance / largest;

    const outcome = lineSearch(problem, options, positions, gradient, step, objective);
    if (!outcome) {
      break;
    }

    let maxMove = 0;
    for (const [i, position] of positions.entries()) {
      maxMove = Math.max(
        maxMove,
        Math.abs(outcome.positions[i][X_AXIS] - position[X_AXIS]),
        Math.abs(outcome.positions[i][Y_AXIS] - position[Y_AXIS])
      );
      position[X_AXIS] = outcome.positions[i][X_AXIS];
      position[Y_AXIS] = outcome.positions[i][Y_AXIS];
    }

    objective = outcome.objective;

    if (maxMove < options.snapTolerance) {
      iterations++;
      break;
    }
  }

  log.debug(
    `GRID-LIKE: snap phase (${options.mode}) ran ${iterations} iteration(s), objective ${objective.toFixed(4)}`
  );

  return { positions, iterations, objective };
}

/**
 * Backtracking line search: halve the step until the projected point improves
 * on the current objective, or give up and let the caller stop.
 */
function lineSearch(
  problem: SnapProblem,
  options: GridLikeOptions,
  positions: readonly Position[],
  gradient: Gradient,
  initialStep: number,
  objective: number
): { positions: Position[]; objective: number } | undefined {
  let step = initialStep;

  for (let attempt = 0; attempt < 16; attempt++) {
    const candidate = positions.map(
      (position, i): Position => [
        position[X_AXIS] - step * gradient[i][X_AXIS],
        position[Y_AXIS] - step * gradient[i][Y_AXIS],
      ]
    );

    applyProjection(problem, candidate);

    const value = snapObjective(problem.graph, problem.distances, candidate, options);
    if (value < objective) {
      return { positions: candidate, objective: value };
    }

    step /= 2;
  }

  return undefined;
}

/** §4 PROJECT, per axis — the nearest point of the feasible region. */
function applyProjection(problem: SnapProblem, positions: Position[]): void {
  for (const axis of AXES) {
    const constraints = problem.constraintsForAxis(axis, positions);
    if (constraints.length === 0) {
      continue;
    }

    const coordinates = positions.map((position) => position[axis]);
    const projected = project(new BlockState(coordinates), coordinates, constraints);

    for (const [i, position] of positions.entries()) {
      if (Number.isFinite(projected[i])) {
        position[axis] = projected[i];
      }
    }
  }
}

function largestComponent(gradient: Gradient): number {
  let largest = 0;
  for (const [dx, dy] of gradient) {
    largest = Math.max(largest, Math.abs(dx), Math.abs(dy));
  }
  return largest;
}
