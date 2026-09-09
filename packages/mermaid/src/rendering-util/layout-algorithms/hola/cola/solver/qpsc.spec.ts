import { describe, expect, it } from 'vitest';
import { BlockState } from './blocks.js';
import type { Matrix } from './linalg.js';
import { project } from './project.js';
import { solveQpsc } from './qpsc.js';
import type { SeparationConstraint } from './types.js';

/**
 * `½·x'Ax - b'x` with `A = I` and `b = desired` is `½·Σ(x_i - desired_i)²` up to
 * a constant, so its constrained minimum is the closest feasible point to
 * `desired` — the textbook check for a separation-constraint solver.
 */
function identityProblem(desired: number[]): { A: Matrix; b: number[] } {
  const A: Matrix = desired.map((_, i) => desired.map((__, j) => (i === j ? 1 : 0)));
  return { A, b: [...desired] };
}

function satisfies(x: readonly number[], constraints: readonly SeparationConstraint[]): boolean {
  return constraints.every((c) => x[c.left] + c.gap - x[c.right] <= 1e-6);
}

const OPTIONS = { tolerance: 1e-9, maxIterations: 200 };

describe('§4 PROJECT', () => {
  it('leaves an already feasible point untouched', () => {
    const targetX = [0, 20, 40];
    const constraints: SeparationConstraint[] = [
      { left: 0, right: 1, gap: 10 },
      { left: 1, right: 2, gap: 10 },
    ];
    const state = new BlockState(targetX);

    expect(project(state, targetX, constraints)).toEqual(targetX);
  });

  it('separates coincident variables symmetrically', () => {
    const targetX = [0, 0];
    const constraints: SeparationConstraint[] = [{ left: 0, right: 1, gap: 10 }];
    const state = new BlockState(targetX);

    const projected = project(state, targetX, constraints);

    expect(projected[0]).toBeCloseTo(-5);
    expect(projected[1]).toBeCloseTo(5);
  });

  it('satisfies a chain of constraints and preserves the centre of mass', () => {
    const targetX = [0, 0, 0, 0];
    const constraints: SeparationConstraint[] = [
      { left: 0, right: 1, gap: 10 },
      { left: 1, right: 2, gap: 10 },
      { left: 2, right: 3, gap: 10 },
    ];
    const state = new BlockState(targetX);

    const projected = project(state, targetX, constraints);

    expect(satisfies(projected, constraints)).toBe(true);
    expect(projected.reduce((total, value) => total + value, 0) / 4).toBeCloseTo(0);
  });

  it('repairs a constraint whose endpoints landed in the same block (§7)', () => {
    // 0 and 2 are pulled into one block by the chain, then a direct 0 -> 2
    // constraint demands more room than the chain provides.
    const targetX = [0, 0, 0];
    const constraints: SeparationConstraint[] = [
      { left: 0, right: 1, gap: 10 },
      { left: 1, right: 2, gap: 10 },
      { left: 0, right: 2, gap: 100 },
    ];
    const state = new BlockState(targetX);

    const projected = project(state, targetX, constraints);

    expect(satisfies(projected, constraints)).toBe(true);
    expect(projected[2] - projected[0]).toBeGreaterThanOrEqual(100 - 1e-6);
  });

  it('terminates on an infeasible (cyclic) constraint set', () => {
    const targetX = [0, 0];
    const constraints: SeparationConstraint[] = [
      { left: 0, right: 1, gap: 10 },
      { left: 1, right: 0, gap: 10 },
    ];
    const state = new BlockState(targetX);

    // No feasible point exists; the guard must return rather than spin.
    expect(() => project(state, targetX, constraints)).not.toThrow();
  });
});

describe('§2 SOLVE_QPSC', () => {
  it('reaches the unconstrained optimum when no constraint binds', () => {
    const desired = [10, 40, 90];
    const { A, b } = identityProblem(desired);
    const state = new BlockState(desired);

    const x = solveQpsc(A, b, [], [0, 0, 0], state, OPTIONS);

    expect(x[0]).toBeCloseTo(10, 3);
    expect(x[1]).toBeCloseTo(40, 3);
    expect(x[2]).toBeCloseTo(90, 3);
  });

  it('finds the closest feasible point when constraints bind', () => {
    // Both want 0, but must stay 10 apart: the closest feasible point is ±5.
    const desired = [0, 0];
    const { A, b } = identityProblem(desired);
    const constraints: SeparationConstraint[] = [{ left: 0, right: 1, gap: 10 }];
    const state = new BlockState(desired);

    const x = solveQpsc(A, b, constraints, [0, 0], state, OPTIONS);

    expect(satisfies(x, constraints)).toBe(true);
    expect(x[0]).toBeCloseTo(-5, 3);
    expect(x[1]).toBeCloseTo(5, 3);
  });

  it('enforces an ordering the objective would otherwise invert', () => {
    // The objective wants 1 to the left of 0; the constraint forbids it.
    const desired = [50, 0];
    const { A, b } = identityProblem(desired);
    const constraints: SeparationConstraint[] = [{ left: 0, right: 1, gap: 10 }];
    const state = new BlockState(desired);

    const x = solveQpsc(A, b, constraints, [...desired], state, OPTIONS);

    expect(satisfies(x, constraints)).toBe(true);
    // Closest feasible point to (50, 0) on the line x1 = x0 + 10 is (20, 30).
    expect(x[0]).toBeCloseTo(20, 3);
    expect(x[1]).toBeCloseTo(30, 3);
  });

  it('releases a constraint once it stops binding (§9 feeds back into §2)', () => {
    // Start from a point where the pair is merged, then solve for targets that
    // pull them well apart: the block must split for the optimum to be reached.
    const desired = [0, 500];
    const { A, b } = identityProblem(desired);
    const constraints: SeparationConstraint[] = [{ left: 0, right: 1, gap: 10 }];
    const state = new BlockState([0, 0]);
    state.mergeBlocks(state.blockOf[0], state.blockOf[1], constraints[0]);

    const x = solveQpsc(A, b, constraints, [0, 0], state, OPTIONS);

    expect(x[0]).toBeCloseTo(0, 3);
    expect(x[1]).toBeCloseTo(500, 3);
    expect(state.blockOf[0]).not.toBe(state.blockOf[1]);
  });
});
