import type { Matrix } from './linalg.js';

/**
 * Stress-majorisation ingredients: the quadratic form `A` and the
 * majorisation vector `b` that IPSEP-COLA hands to the QPSC solver (§1).
 *
 * Stress is `Σ_{i<j} w_ij · (‖p_i - p_j‖ - d_ij)²` with `w_ij = 1/d_ij²`.
 * Majorising it at the current layout yields, per axis, the convex quadratic
 * `½·x'Ax - b'x` that §2 minimises.
 */

export type Axis = 0 | 1;

/** A point in the plane, indexed by {@link Axis}. */
export type Position = [number, number];

/**
 * All-pairs shortest path lengths in hops, scaled by `idealEdgeLength`.
 *
 * Pairs in different connected components have no graph distance at all. They
 * get a finite stand-in — comfortably beyond the graph's own diameter — so the
 * components repel rather than collapse onto each other; the non-overlap
 * constraints then keep them properly apart.
 */
export function idealDistances(
  variableCount: number,
  neighbors: readonly (readonly number[])[],
  idealEdgeLength: number
): Matrix {
  const distances: Matrix = [];
  let maxHops = 1;

  for (let source = 0; source < variableCount; source++) {
    const row = new Array<number>(variableCount).fill(Number.POSITIVE_INFINITY);
    row[source] = 0;
    const queue = [source];
    // `for...of` sees nodes appended below, making this a BFS queue.
    for (const current of queue) {
      for (const neighbor of neighbors[current]) {
        if (row[neighbor] === Number.POSITIVE_INFINITY) {
          row[neighbor] = row[current] + 1;
          maxHops = Math.max(maxHops, row[neighbor]);
          queue.push(neighbor);
        }
      }
    }
    distances.push(row);
  }

  const disconnectedHops = maxHops * 1.5 + 1;
  for (let i = 0; i < variableCount; i++) {
    for (let j = 0; j < variableCount; j++) {
      const hops =
        distances[i][j] === Number.POSITIVE_INFINITY ? disconnectedHops : distances[i][j];
      distances[i][j] = hops * idealEdgeLength;
    }
  }

  return distances;
}

/**
 * A zero-length spring between two variables, added straight into `A`.
 *
 * Used for the two boundary variables of a subgraph frame: pulling them
 * together is what makes the frame close on its contents, while the containment
 * constraints stop it collapsing past them. The result is a frame that tracks
 * its children in both directions instead of only ever growing.
 */
export interface Spring {
  a: number;
  b: number;
  weight: number;
}

/**
 * §1 BUILD_STRESS_MATRIX — the weighted Laplacian of the stress model.
 *
 * `A_ij = -w_ij` off the diagonal and `A_ii = Σ_{j≠i} w_ij`, so `A` depends
 * only on the target distances: it is built once and reused for both axes and
 * every majorisation iteration.
 */
export function buildStressMatrix(
  distances: Matrix,
  variableCount = distances.length,
  springs: readonly Spring[] = []
): Matrix {
  const n = distances.length;
  const A: Matrix = Array.from({ length: variableCount }, () =>
    new Array<number>(variableCount).fill(0)
  );

  for (let i = 0; i < n; i++) {
    let diagonal = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) {
        continue;
      }
      const weight = stressWeight(distances[i][j]);
      A[i][j] = -weight;
      diagonal += weight;
    }
    A[i][i] = diagonal;
  }

  // Springs occupy the rows the graph-distance model never reaches. Without one
  // a variable has an all-zero row and an all-zero `b`, so the objective has no
  // opinion about it at all and only a constraint can ever move it — which for a
  // group frame means it grows to fit a child and then never shrinks again.
  for (const spring of springs) {
    A[spring.a][spring.a] += spring.weight;
    A[spring.b][spring.b] += spring.weight;
    A[spring.a][spring.b] -= spring.weight;
    A[spring.b][spring.a] -= spring.weight;
  }

  return A;
}

/**
 * §1 BUILD_MAJORISATION_VECTOR — the right-hand side of the current
 * majorisation subproblem for one axis.
 *
 * `b_i = Σ_{j≠i} w_ij · d_ij · (p_i[axis] - p_j[axis]) / ‖p_i - p_j‖`
 *
 * This is `L^Z·z` from the standard majorisation `L^w·x = L^Z·z`, where `L^w`
 * is {@link buildStressMatrix}: every other node contributes the displacement
 * that would put the pair exactly `d_ij` apart along the direction they
 * currently lie.
 *
 * Note there is deliberately no `p_j` term. That term belongs to the *localised*
 * (Gauss-Seidel) form of the update, where the off-diagonal `A` entries have
 * been moved to the right-hand side; adding it here as well would double-count
 * them and, worse, leave `b` with a component along `A`'s null space — which
 * makes `½·x'Ax - b'x` unbounded below under translation and the descent in §2
 * diverge.
 */
export function buildMajorisationVector(
  distances: Matrix,
  positions: readonly Position[],
  axis: Axis,
  variableCount = distances.length
): number[] {
  const n = distances.length;
  // Variables past the graph-distance model (group frames) keep `b = 0`: their
  // springs have a natural length of zero, so they contribute no target term.
  const b = new Array<number>(variableCount).fill(0);

  for (let i = 0; i < n; i++) {
    let total = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) {
        continue;
      }
      const weight = stressWeight(distances[i][j]);
      if (weight === 0) {
        continue;
      }

      const dx = positions[i][0] - positions[j][0];
      const dy = positions[i][1] - positions[j][1];
      const length = Math.hypot(dx, dy);
      // Coincident nodes give no usable direction, so they contribute nothing
      // this round; the separation constraints pull them apart and the next
      // iteration then has a direction to work with.
      if (length < 1e-9) {
        continue;
      }

      total += weight * distances[i][j] * ((positions[i][axis] - positions[j][axis]) / length);
    }
    b[i] = total;
  }

  return b;
}

/** Current value of the stress objective, used for the convergence test (§1). */
export function stress(distances: Matrix, positions: readonly Position[]): number {
  const n = distances.length;
  let total = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const weight = stressWeight(distances[i][j]);
      if (weight === 0) {
        continue;
      }
      const actual = Math.hypot(
        positions[i][0] - positions[j][0],
        positions[i][1] - positions[j][1]
      );
      const error = actual - distances[i][j];
      total += weight * error * error;
    }
  }

  return total;
}

function stressWeight(distance: number): number {
  return distance > 0 && Number.isFinite(distance) ? 1 / (distance * distance) : 0;
}
