/**
 * Constrained stress optimisation by gradient projection (guide §7.3).
 *
 *     repeat until convergence:
 *         desired ← current − step · ∇stress
 *         current ← project(desired)          // VPSC, all hard constraints
 *         shrink step when the stress did not improve
 *
 * The first trial step comes from the exact minimiser of the second-order
 * model along the descent direction, so the search starts at the right scale
 * for the graph instead of at a hand-tuned learning rate. Every accepted
 * iterate is feasible and has strictly lower stress than the previous one.
 */

import type { ConstraintSystem } from '../constraints/solver.js';
import type { Positioned, StressModel } from './stressModel.js';
import { gradientNorm } from './stressModel.js';

export interface GradientProjectionOptions {
  maxIterations: number;
  /** Stop when the relative stress improvement drops below this. */
  tolerance: number;
  /** Stop when ‖∇stress‖ drops below this. */
  gradientTolerance?: number;
}

export interface GradientProjectionResult {
  iterations: number;
  initialStress: number;
  finalStress: number;
  converged: boolean;
}

const MIN_STEP_FACTOR = 1e-4;
const STEP_GROWTH = 1.6;
const STEP_SHRINK = 0.4;

export function gradientProjectStress(
  nodes: Map<string, Positioned>,
  model: StressModel,
  system: ConstraintSystem,
  options: GradientProjectionOptions
): GradientProjectionResult {
  const initialStress = model.value(nodes);
  if (model.pairs.length === 0 || nodes.size < 2) {
    return { iterations: 0, initialStress, finalStress: initialStress, converged: true };
  }

  // Start from a feasible point so every comparison below is like-for-like.
  const start = system.project(nodes);
  if (!start.feasible) {
    // The system was already over-constrained on entry; optimising from here
    // would only entrench the violation.
    return { iterations: 0, initialStress, finalStress: model.value(nodes), converged: false };
  }
  let stress = model.value(nodes);
  let stepScale = 1;
  let iterations = 0;
  let converged = false;

  const gradientTolerance = options.gradientTolerance ?? 1e-6;

  while (iterations < options.maxIterations) {
    iterations++;

    const gradient = model.gradient(nodes);
    const norm = gradientNorm(gradient);
    if (norm < gradientTolerance) {
      converged = true;
      break;
    }

    // Exact step of the quadratic model along the steepest-descent
    // direction: alpha = squared gradient norm over its directional curvature.
    const curvature = model.directionalCurvature(nodes, gradient);
    const newtonStep = curvature > 0 ? (norm * norm) / curvature : 1 / norm;

    let accepted = false;
    let factor = stepScale;

    while (factor > MIN_STEP_FACTOR) {
      const step = newtonStep * factor;
      const desired = new Map<string, Positioned>();
      for (const [id, node] of nodes) {
        const g = gradient.get(id) ?? { x: 0, y: 0 };
        desired.set(id, { x: node.x - step * g.x, y: node.y - step * g.y });
      }

      const before = snapshotPositions(nodes);
      const projection = system.project(nodes, desired);
      const candidateStress = model.value(nodes);

      // A projection the solver could not satisfy is not an iterate: accepting
      // it would leave the layout violating constraints an earlier stage
      // established (guide invariant 17), and every later snapshot would then
      // preserve the violation.
      if (projection.feasible && candidateStress < stress) {
        const improvement = (stress - candidateStress) / Math.max(stress, 1e-12);
        stress = candidateStress;
        accepted = true;
        stepScale = factor * STEP_GROWTH;
        if (improvement < options.tolerance) {
          converged = true;
        }
        break;
      }

      restorePositions(nodes, before);
      factor *= STEP_SHRINK;
    }

    if (!accepted) {
      // No feasible descent along −∇ at any usable step: we are at a
      // constrained stationary point.
      converged = true;
      break;
    }
    if (converged) {
      break;
    }
  }

  return { iterations, initialStress, finalStress: stress, converged };
}

function snapshotPositions(nodes: Map<string, Positioned>): Map<string, Positioned> {
  const copy = new Map<string, Positioned>();
  for (const [id, node] of nodes) {
    copy.set(id, { x: node.x, y: node.y });
  }
  return copy;
}

function restorePositions(nodes: Map<string, Positioned>, snapshot: Map<string, Positioned>): void {
  for (const [id, pos] of snapshot) {
    const node = nodes.get(id);
    if (node) {
      node.x = pos.x;
      node.y = pos.y;
    }
  }
}
