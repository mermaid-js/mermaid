import { log } from '../../../../logger.js';
import { BlockState } from './blocks.js';
import type { Matrix } from './linalg.js';
import type { QpscOptions } from './qpsc.js';
import { solveQpsc } from './qpsc.js';
import type { Axis, Position } from './stress.js';
import { buildMajorisationVector, buildStressMatrix, stress } from './stress.js';
import type { SeparationConstraint } from './types.js';

const AXES: Axis[] = [0, 1];

export interface IpsepColaOptions {
  /** Cap on outer stress-majorisation iterations. */
  maxIterations: number;
  /** Converged once the relative stress improvement drops below this. */
  convergenceTolerance: number;
  qpsc: QpscOptions;
}

export interface IpsepColaProblem {
  /** INITIAL_LAYOUT(G) — mutated in place and returned. */
  positions: Position[];
  /** Target distance `d_ij` for every pair. */
  distances: Matrix;
  /**
   * §1 CONSTRAINTS_FOR_AXIS — the separation constraints for one axis at the
   * current layout. Called once per axis per outer iteration.
   */
  constraintsForAxis: (axis: Axis, positions: readonly Position[]) => SeparationConstraint[];
  /**
   * Whether `constraintsForAxis` can return a different constraint set as the
   * layout moves (non-overlap constraints do; flow constraints do not). See
   * the note on block-state reuse in {@link ipsepCola}.
   */
  constraintsDependOnPositions: boolean;
}

export interface IpsepColaResult {
  positions: Position[];
  iterations: number;
  stress: number;
}

/**
 * §1 IPSEP_COLA — the outer stress-majorisation loop.
 *
 * Each iteration rebuilds the majorisation subproblem at the current layout and
 * solves it, one axis at a time, with the block-based QPSC solver of §2. The
 * axes are separable because every constraint is axis-aligned.
 *
 * Deviation from §11, deliberate: the pseudocode initialises the block state
 * once, outside the loop, which is only sound when the constraint set is fixed
 * — blocks hold references to constraint objects, so a regenerated set would
 * leave the active trees pointing at constraints nobody enforces any more.
 * Mermaid's non-overlap constraints are position-dependent (exactly what the
 * `positions` argument of `CONSTRAINTS_FOR_AXIS` signals), so the state is
 * re-seeded whenever the constraints are regenerated, and retained across
 * iterations when they are not.
 */
export function ipsepCola(problem: IpsepColaProblem, options: IpsepColaOptions): IpsepColaResult {
  const { positions, distances } = problem;
  const variableCount = positions.length;

  if (variableCount === 0) {
    return { positions, iterations: 0, stress: 0 };
  }

  const A = buildStressMatrix(distances);

  // §11 INITIALIZE_QPSC_STATE — one block per variable, per axis.
  const states: BlockState[] = AXES.map(
    (axis) => new BlockState(positions.map((position) => position[axis]))
  );

  let previousStress = stress(distances, positions);
  let iterations = 0;

  for (; iterations < options.maxIterations; iterations++) {
    for (const axis of AXES) {
      const b = buildMajorisationVector(distances, positions, axis);
      const C = problem.constraintsForAxis(axis, positions);

      const x = positions.map((position) => position[axis]);
      if (problem.constraintsDependOnPositions) {
        states[axis] = new BlockState(x);
      }

      const solved = solveQpsc(A, b, C, x, states[axis], options.qpsc);

      for (const [i, position] of positions.entries()) {
        if (Number.isFinite(solved[i])) {
          position[axis] = solved[i];
        }
      }
    }

    const currentStress = stress(distances, positions);
    const improvement = previousStress > 0 ? (previousStress - currentStress) / previousStress : 0;
    previousStress = currentStress;

    if (Math.abs(improvement) < options.convergenceTolerance) {
      iterations++;
      break;
    }
  }

  log.debug(
    `IPSEP-COLA: converged after ${iterations} majorisation iteration(s), stress ${previousStress.toFixed(4)}`
  );

  return { positions, iterations, stress: previousStress };
}
