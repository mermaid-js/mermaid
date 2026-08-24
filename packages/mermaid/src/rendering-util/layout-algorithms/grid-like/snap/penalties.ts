import { X_AXIS, Y_AXIS } from '../../ipsep-cola/adapter/constraints.js';
import type { IpsepColaGraph } from '../../ipsep-cola/adapter/graph.js';
import type { Matrix } from '../../ipsep-cola/solver/linalg.js';
import type { Axis, Position } from '../../ipsep-cola/solver/stress.js';
import type { GridLikeOptions } from '../options.js';
import { usesGridSnap, usesNodeSnap } from '../options.js';

/**
 * The soft-constraint terms of the paper (§3–§8), each as a value plus its
 * contribution to the gradient.
 *
 * Every accumulator takes the shared `gradient` and the term's weight `k`: the
 * value it returns is unweighted (the caller applies `k` when summing), while
 * what it writes into the gradient is already multiplied by `k`, so one pass
 * builds the gradient of the whole weighted objective.
 */

/** Per-node partial derivatives of the objective, indexed like `positions`. */
export type Gradient = [number, number][];

export function zeroGradient(count: number): Gradient {
  return Array.from({ length: count }, (): [number, number] => [0, 0]);
}

/**
 * §4 `q_σ(z, τ)` — the local quadratic snap penalty.
 *
 * Zero outside the snap radius, so a node feels nothing until it is close
 * enough to be worth pulling into exact alignment.
 */
export function qSigma(z: number, tau: number): number {
  if (tau <= 0 || Math.abs(z) > tau) {
    return 0;
  }
  return (z * z) / (tau * tau);
}

/** `dq_σ/dz`. */
export function qSigmaDerivative(z: number, tau: number): number {
  if (tau <= 0 || Math.abs(z) > tau) {
    return 0;
  }
  return (2 * z) / (tau * tau);
}

/**
 * §6.1 CLOSEST_GRID_POINT — the nearest point of `{(nσ, mσ)}`, ties broken in
 * favour of the point closer to the origin.
 */
export function closestGridPoint(x: number, y: number, sigma: number): [number, number] {
  const candidatesX = [Math.floor(x / sigma) * sigma, Math.ceil(x / sigma) * sigma];
  const candidatesY = [Math.floor(y / sigma) * sigma, Math.ceil(y / sigma) * sigma];

  let best: [number, number] = [candidatesX[0], candidatesY[0]];
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestOriginDistance = Number.POSITIVE_INFINITY;

  for (const a of candidatesX) {
    for (const b of candidatesY) {
      const distance = Math.hypot(x - a, y - b);
      const originDistance = Math.hypot(a, b);

      if (distance < bestDistance) {
        best = [a, b];
        bestDistance = distance;
        bestOriginDistance = originDistance;
      } else if (distance === bestDistance && originDistance < bestOriginDistance) {
        best = [a, b];
        bestOriginDistance = originDistance;
      }
    }
  }

  return best;
}

/**
 * §3 P_STRESS — stress that only penalises pairs for being *too close*, plus a
 * penalty for edges longer than the ideal length.
 *
 * That asymmetry is the point: unlike ordinary stress it does not drag distant
 * unconnected nodes back together, so the snap terms are free to move a node
 * onto a grid point without the rest of the drawing pulling it straight off
 * again.
 */
export function accumulatePStress(
  graph: IpsepColaGraph,
  distances: Matrix,
  positions: readonly Position[],
  idealEdgeLength: number,
  gradient?: Gradient
): number {
  const count = graph.variables.length;
  let total = 0;

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const ideal = distances[i][j];
      if (!(ideal > 0) || !Number.isFinite(ideal)) {
        continue;
      }

      const dx = positions[i][X_AXIS] - positions[j][X_AXIS];
      const dy = positions[i][Y_AXIS] - positions[j][Y_AXIS];
      const length = Math.hypot(dx, dy);
      const shortfall = ideal - length;
      if (shortfall <= 0 || length < 1e-9) {
        continue;
      }

      const weight = 1 / (ideal * ideal);
      total += weight * shortfall * shortfall;

      if (gradient) {
        // d/dp_i of w·(ideal - ‖p_i - p_j‖)² = -2w·shortfall·(p_i - p_j)/‖·‖
        const scale = (-2 * weight * shortfall) / length;
        gradient[i][X_AXIS] += scale * dx;
        gradient[i][Y_AXIS] += scale * dy;
        gradient[j][X_AXIS] -= scale * dx;
        gradient[j][Y_AXIS] -= scale * dy;
      }
    }
  }

  const edgeWeight = 1 / Math.max(idealEdgeLength, 1e-9);

  for (const link of graph.links) {
    const dx = positions[link.source][X_AXIS] - positions[link.target][X_AXIS];
    const dy = positions[link.source][Y_AXIS] - positions[link.target][Y_AXIS];
    const length = Math.hypot(dx, dy);
    const excess = length - idealEdgeLength;
    if (excess <= 0 || length < 1e-9) {
      continue;
    }

    total += edgeWeight * excess * excess;

    if (gradient) {
      const scale = (2 * edgeWeight * excess) / length;
      gradient[link.source][X_AXIS] += scale * dx;
      gradient[link.source][Y_AXIS] += scale * dy;
      gradient[link.target][X_AXIS] -= scale * dx;
      gradient[link.target][Y_AXIS] -= scale * dy;
    }
  }

  return total;
}

/** Value-only P-stress, for the ACA cost estimate of §13.1. */
export function pStress(
  graph: IpsepColaGraph,
  distances: Matrix,
  positions: readonly Position[],
  idealEdgeLength: number
): number {
  return accumulatePStress(graph, distances, positions, idealEdgeLength);
}

/**
 * §5 NS_STRESS — pull the endpoints of an edge onto a shared row or column.
 *
 * The radius is per-edge when `nodeSnapRadius` is `node-size` (§24): a single
 * `τ` larger than typical node dimensions is what made nodes clump in the
 * paper's interactive tool, and Mermaid's nodes are small next to the grid.
 */
export function accumulateNodeSnap(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: GridLikeOptions,
  gradient?: Gradient,
  weight = 1
): number {
  let total = 0;

  for (const link of graph.links) {
    const source = graph.variables[link.source];
    const target = graph.variables[link.target];

    const radiusX =
      options.nodeSnapRadius === 'node-size'
        ? (source.width + target.width) / 2
        : options.snapDistance;
    const radiusY =
      options.nodeSnapRadius === 'node-size'
        ? (source.height + target.height) / 2
        : options.snapDistance;

    const dx = positions[link.source][X_AXIS] - positions[link.target][X_AXIS];
    const dy = positions[link.source][Y_AXIS] - positions[link.target][Y_AXIS];

    total += qSigma(dx, radiusX) + qSigma(dy, radiusY);

    if (gradient) {
      const gx = weight * qSigmaDerivative(dx, radiusX);
      const gy = weight * qSigmaDerivative(dy, radiusY);
      gradient[link.source][X_AXIS] += gx;
      gradient[link.source][Y_AXIS] += gy;
      gradient[link.target][X_AXIS] -= gx;
      gradient[link.target][Y_AXIS] -= gy;
    }
  }

  return total;
}

/** §6.2 GS_STRESS — attract every node centre to its nearest grid point. */
export function accumulateGridSnap(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: GridLikeOptions,
  gradient?: Gradient,
  weight = 1
): number {
  let total = 0;
  const tau = options.snapDistance;

  for (let i = 0; i < graph.variables.length; i++) {
    const [a, b] = closestGridPoint(
      positions[i][X_AXIS],
      positions[i][Y_AXIS],
      options.gridSpacing
    );
    const zx = positions[i][X_AXIS] - a;
    const zy = positions[i][Y_AXIS] - b;

    total += qSigma(zx, tau) + qSigma(zy, tau);

    if (gradient) {
      gradient[i][X_AXIS] += weight * qSigmaDerivative(zx, tau);
      gradient[i][Y_AXIS] += weight * qSigmaDerivative(zy, tau);
    }
  }

  return total;
}

/**
 * §8 EN_SEP — keep nodes off axis-aligned edges.
 *
 * Only edges that are currently axis-aligned contribute, and only nodes whose
 * perpendicular actually meets the segment: everything else has `d = +∞` and so
 * contributes nothing. The reaction on the edge's own endpoints is split evenly
 * between them, which is what sliding the whole segment sideways amounts to.
 */
export function accumulateEdgeNodeSeparation(
  graph: IpsepColaGraph,
  positions: readonly Position[],
  options: GridLikeOptions,
  gradient?: Gradient,
  weight = 1
): number {
  const tau = options.snapDistance;
  if (tau <= 0) {
    return 0;
  }

  let total = 0;

  for (const link of graph.links) {
    const start = positions[link.source];
    const end = positions[link.target];

    // The axis the edge is aligned *across* — the one whose coordinates match.
    const acrossAxis = axisAlignedAcross(start, end, options.alignmentTolerance);
    if (acrossAxis === undefined) {
      continue;
    }
    const alongAxis = acrossAxis === X_AXIS ? Y_AXIS : X_AXIS;

    const line = (start[acrossAxis] + end[acrossAxis]) / 2;
    const low = Math.min(start[alongAxis], end[alongAxis]);
    const high = Math.max(start[alongAxis], end[alongAxis]);

    for (let u = 0; u < graph.variables.length; u++) {
      if (u === link.source || u === link.target) {
        continue;
      }
      const position = positions[u];
      if (position[alongAxis] < low || position[alongAxis] > high) {
        // No normal from `u` meets the segment: d = +∞ (§8).
        continue;
      }

      const distance = Math.abs(position[acrossAxis] - line);
      const z = Math.max(tau - distance, 0);
      if (z <= 0) {
        continue;
      }

      total += qSigma(z, tau);

      if (gradient) {
        // dq/dz · dz/dd · dd/dp: the node is pushed away from the line and the
        // segment recoils, half the force on each endpoint.
        const direction = position[acrossAxis] >= line ? 1 : -1;
        const magnitude = weight * qSigmaDerivative(z, tau) * direction;
        gradient[u][acrossAxis] -= magnitude;
        gradient[link.source][acrossAxis] += magnitude / 2;
        gradient[link.target][acrossAxis] += magnitude / 2;
      }
    }
  }

  return total;
}

/**
 * The complete phase-2 objective for the configured mode (§5, §6.4, §7).
 *
 * P-stress and EN-sep are always present; the snap terms are switched on by the
 * mode, which is exactly how the paper composes its soft variants.
 */
export function snapObjective(
  graph: IpsepColaGraph,
  distances: Matrix,
  positions: readonly Position[],
  options: GridLikeOptions,
  gradient?: Gradient
): number {
  let total = accumulatePStress(graph, distances, positions, options.idealEdgeLength, gradient);

  if (usesNodeSnap(options.mode)) {
    total +=
      options.nodeSnapWeight *
      accumulateNodeSnap(graph, positions, options, gradient, options.nodeSnapWeight);
  }

  if (usesGridSnap(options.mode)) {
    total +=
      options.gridSnapWeight *
      accumulateGridSnap(graph, positions, options, gradient, options.gridSnapWeight);
  }

  total +=
    options.edgeNodeSeparationWeight *
    accumulateEdgeNodeSeparation(
      graph,
      positions,
      options,
      gradient,
      options.edgeNodeSeparationWeight
    );

  return total;
}

/** Which axis two points share, within `tolerance`, or `undefined` if neither. */
function axisAlignedAcross(start: Position, end: Position, tolerance: number): Axis | undefined {
  if (Math.abs(start[X_AXIS] - end[X_AXIS]) <= tolerance) {
    return X_AXIS;
  }
  if (Math.abs(start[Y_AXIS] - end[Y_AXIS]) <= tolerance) {
    return Y_AXIS;
  }
  return undefined;
}
