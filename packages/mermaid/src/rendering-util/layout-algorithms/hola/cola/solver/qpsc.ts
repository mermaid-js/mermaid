import type { BlockState } from './blocks.js';
import { dot, multiply, type Matrix } from './linalg.js';
import { project } from './project.js';
import type { SeparationConstraint } from './types.js';

export interface QpscOptions {
  /** Stop once a full iteration moves every variable less than this. */
  tolerance: number;
  /** Hard cap on descent iterations for one axis pass. */
  maxIterations: number;
}

/**
 * §2 SOLVE_QPSC — minimise `f(x) = ½·x'Ax - b'x` subject to the separation
 * constraints `C`.
 *
 * One iteration is: an unconstrained steepest-descent step to `targetX`, block
 * maintenance (§9), projection of `targetX` back onto the feasible region (§4),
 * and finally a line step from the old point toward the projected one, taking
 * the step length that minimises the objective without leaving `[0, 1]` (so the
 * result stays feasible, since the feasible region is convex and both ends of
 * the segment are feasible).
 */
export function solveQpsc(
  A: Matrix,
  b: readonly number[],
  C: readonly SeparationConstraint[],
  x: readonly number[],
  state: BlockState,
  options: QpscOptions
): number[] {
  // The line step below takes a convex combination of `oldX` and a projected
  // point, which only stays feasible if `oldX` already is. The pseudocode
  // inherits that from its caller; here the incoming coordinates are an
  // arbitrary layout, so they are projected once up front.
  let current = project(state, x, C);

  for (let iteration = 0; iteration < options.maxIterations; iteration++) {
    const gradient = computeGradient(A, b, current);

    const step = steepestDescentStep(A, gradient);

    const oldX = current;
    const targetX = oldX.map((value, i) => value - step * gradient[i]);

    const noSplitOccurred = state.splitBlocks(targetX);
    const projectedX = project(state, targetX, C);

    const direction = projectedX.map((value, i) => value - oldX[i]);
    const alpha = optimalFeasibleLineStep(A, b, oldX, direction);

    current = oldX.map((value, i) => value + alpha * direction[i]);

    let maxMove = 0;
    for (const [i, value] of current.entries()) {
      maxMove = Math.max(maxMove, Math.abs(value - oldX[i]));
    }
    if (maxMove < options.tolerance && noSplitOccurred) {
      break;
    }
  }

  return current;
}

/**
 * §2 `DOT(gradient, gradient) / DOT(gradient, A * gradient)` — the exact line
 * search along the steepest-descent direction.
 *
 * Returns 0 in the two degenerate cases, so the iteration still runs its block
 * maintenance and projection instead of bailing out: at the unconstrained
 * optimum the gradient vanishes but the point may not be feasible yet, and a
 * gradient lying in `A`'s null space (`A` is the singular weighted Laplacian,
 * whose null space is the pure translations) has no finite minimising step.
 */
function steepestDescentStep(A: Matrix, gradient: readonly number[]): number {
  const gradientNorm = dot(gradient, gradient);
  if (gradientNorm < 1e-18) {
    return 0;
  }

  const curvature = dot(gradient, multiply(A, gradient));
  if (!Number.isFinite(curvature) || Math.abs(curvature) < 1e-12) {
    return 0;
  }

  return gradientNorm / curvature;
}

/** Gradient of `½·x'Ax - b'x`. */
export function computeGradient(A: Matrix, b: readonly number[], x: readonly number[]): number[] {
  const Ax = multiply(A, x);
  return Ax.map((value, i) => value - b[i]);
}

/**
 * §2 OPTIMAL_FEASIBLE_LINE_STEP — the `α ∈ [0, 1]` minimising
 * `f(oldX + α·direction)`.
 *
 * Along a line the quadratic is again a parabola, so the unconstrained minimum
 * is `-d'(A·oldX - b) / (d'Ad)`; clamping to `[0, 1]` keeps the point on the
 * segment between the current (feasible) point and the projected one.
 */
export function optimalFeasibleLineStep(
  A: Matrix,
  b: readonly number[],
  oldX: readonly number[],
  direction: readonly number[]
): number {
  const curvature = dot(direction, multiply(A, direction));
  if (!Number.isFinite(curvature) || Math.abs(curvature) < 1e-12) {
    // Degenerate direction (e.g. a pure translation): take the whole step, which
    // is the projected — and therefore feasible — point.
    return 1;
  }

  const slope = dot(direction, computeGradient(A, b, oldX));
  const alpha = -slope / curvature;
  if (!Number.isFinite(alpha)) {
    return 1;
  }
  return Math.min(1, Math.max(0, alpha));
}
