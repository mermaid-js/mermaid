/**
 * The persistent constraint system every HOLA stage shares (guide §7.2).
 *
 * Nothing in the pipeline writes a coordinate directly once constraints exist:
 * a stage states where it *would like* nodes to be, and `project()` finds the
 * nearest feasible configuration. Alignments and separations added by an early
 * stage therefore survive every later optimisation, which is invariant 5 and
 * invariant 17 of guide §4.
 */

import type { Axis } from '../model.js';
import { Variable, VpscConstraint, solveVpsc } from './vpsc.js';
import type { Constraint, ConstraintId, ConstraintSnapshot, ProjectionResult } from './types.js';

interface Positioned {
  x: number;
  y: number;
}

const FEASIBILITY_EPSILON = 1e-6;

export class ConstraintSystem {
  private readonly constraints = new Map<ConstraintId, Constraint>();
  private nextId: ConstraintId = 1;

  /** Nodes the solver is allowed to move; anything else is ignored. */
  constructor(private readonly participants: Set<string> = new Set()) {}

  registerParticipant(id: string): void {
    this.participants.add(id);
  }

  unregisterParticipant(id: string): void {
    this.participants.delete(id);
  }

  hasParticipant(id: string): boolean {
    return this.participants.size === 0 || this.participants.has(id);
  }

  add(constraint: Constraint): ConstraintId {
    const id = this.nextId++;
    this.constraints.set(id, constraint);
    return id;
  }

  addAll(constraints: Constraint[]): ConstraintId[] {
    return constraints.map((c) => this.add(c));
  }

  remove(ids: ConstraintId[]): void {
    for (const id of ids) {
      this.constraints.delete(id);
    }
  }

  /** Withdraw every constraint matching `predicate`. */
  removeWhere(predicate: (constraint: Constraint) => boolean): number {
    let removed = 0;
    for (const [id, constraint] of [...this.constraints]) {
      if (predicate(constraint)) {
        this.constraints.delete(id);
        removed++;
      }
    }
    return removed;
  }

  all(): Constraint[] {
    return [...this.constraints.values()];
  }

  get size(): number {
    return this.constraints.size;
  }

  snapshot(nodes: Map<string, Positioned>): ConstraintSnapshot {
    const positions = new Map<string, { x: number; y: number }>();
    for (const [id, node] of nodes) {
      positions.set(id, { x: node.x, y: node.y });
    }
    return { constraintIds: [...this.constraints.keys()], positions };
  }

  restore(snapshot: ConstraintSnapshot, nodes: Map<string, Positioned>): void {
    const keep = new Set(snapshot.constraintIds);
    for (const id of [...this.constraints.keys()]) {
      if (!keep.has(id)) {
        this.constraints.delete(id);
      }
    }
    for (const [id, pos] of snapshot.positions) {
      const node = nodes.get(id);
      if (node) {
        node.x = pos.x;
        node.y = pos.y;
      }
    }
  }

  /**
   * Would the system still admit a solution if `additional` were added?
   * Runs on scratch variables, so neither positions nor the stored constraint
   * set are touched.
   */
  isFeasible(nodes: Map<string, Positioned>, additional: Constraint[] = []): boolean {
    const all = [...this.constraints.values(), ...additional];
    for (const axis of ['x', 'y'] as Axis[]) {
      const outcome = this.solveAxis(axis, nodes, all, undefined, /* writeBack */ false);
      if (!outcome.feasible) {
        return false;
      }
    }
    return true;
  }

  /**
   * Add constraints only if the system can still be satisfied *and* the
   * projection actually satisfies them; otherwise roll both the constraints and
   * the positions back.
   *
   * Guide invariant 17: constraints that exist must hold. Checking feasibility
   * in isolation is not enough, because a batch can be individually feasible
   * and jointly not; this is the single gate every stage goes through, so an
   * over-constrained moment degrades into a reported rejection instead of a
   * layout that quietly violates its own alignments.
   */
  tryAdd(nodes: Map<string, Positioned>, constraints: Constraint[]): boolean {
    if (constraints.length === 0) {
      return true;
    }
    const snapshot = this.snapshot(nodes);
    const ids = this.addAll(constraints);
    const projection = this.project(nodes);
    if (projection.feasible) {
      return true;
    }
    this.remove(ids);
    this.restore(snapshot, nodes);
    return false;
  }

  /**
   * Move nodes to the feasible point closest to `desired` (their current
   * positions when `desired` is omitted).
   */
  project(
    nodes: Map<string, Positioned>,
    desired?: Map<string, Positioned>,
    extra: Constraint[] = []
  ): ProjectionResult {
    const all = [...this.constraints.values(), ...extra];
    let cost = 0;
    let feasible = true;
    const violated: Constraint[] = [];

    for (const axis of ['x', 'y'] as Axis[]) {
      const outcome = this.solveAxis(axis, nodes, all, desired, /* writeBack */ true);
      cost += outcome.cost;
      if (!outcome.feasible) {
        feasible = false;
        violated.push(...outcome.violated);
      }
    }

    return { feasible, cost, violated };
  }

  /** Rotate every stored constraint by 90° (guide §18.3). */
  rotate90(direction: 'cw' | 'ccw'): void {
    for (const [id, c] of this.constraints) {
      this.constraints.set(id, rotateConstraint(c, direction));
    }
  }

  private solveAxis(
    axis: Axis,
    nodes: Map<string, Positioned>,
    constraints: Constraint[],
    desired: Map<string, Positioned> | undefined,
    writeBack: boolean
  ): { feasible: boolean; cost: number; violated: Constraint[] } {
    const variables = new Map<string, Variable>();
    const variableFor = (id: string): Variable | undefined => {
      if (!this.hasParticipant(id)) {
        return undefined;
      }
      let v = variables.get(id);
      if (!v) {
        const node = nodes.get(id);
        if (!node) {
          return undefined;
        }
        const target = desired?.get(id) ?? node;
        v = new Variable(axis === 'x' ? target.x : target.y, 1, id);
        variables.set(id, v);
      }
      return v;
    };

    // Every movable node becomes a variable so unconstrained nodes keep their
    // desired position exactly.
    for (const id of nodes.keys()) {
      variableFor(id);
    }

    const vpscConstraints: VpscConstraint[] = [];
    const originOf = new Map<VpscConstraint, Constraint>();

    for (const c of constraints) {
      if (c.axis !== axis) {
        continue;
      }
      if (c.kind === 'alignment') {
        const a = variableFor(c.a);
        const b = variableFor(c.b);
        if (!a || !b || a === b) {
          continue;
        }
        const vc = new VpscConstraint(a, b, c.offset, true);
        vpscConstraints.push(vc);
        originOf.set(vc, c);
      } else {
        const l = variableFor(c.leftOrAbove);
        const r = variableFor(c.rightOrBelow);
        if (!l || !r || l === r) {
          continue;
        }
        const vc = new VpscConstraint(l, r, c.gap, false);
        vpscConstraints.push(vc);
        originOf.set(vc, c);
      }
    }

    const result = solveVpsc([...variables.values()], vpscConstraints);

    // A cycle detection in the solver is only a *candidate* failure: verify
    // against the actual residuals so numerically-satisfied cycles pass.
    const violated: Constraint[] = [];
    for (const vc of vpscConstraints) {
      const residual = vc.equality
        ? Math.abs(vc.right.position() - vc.left.position() - vc.gap)
        : Math.max(0, -(vc.right.position() - vc.left.position() - vc.gap));
      if (residual > FEASIBILITY_EPSILON) {
        const source = originOf.get(vc);
        if (source) {
          violated.push(source);
        }
      }
    }

    if (writeBack) {
      for (const [id, variable] of variables) {
        const node = nodes.get(id);
        if (!node) {
          continue;
        }
        if (axis === 'x') {
          node.x = variable.position();
        } else {
          node.y = variable.position();
        }
      }
    }

    return { feasible: violated.length === 0, cost: result.cost, violated };
  }
}

/**
 * Constraint transform for a 90° rotation of the drawing.
 *
 * clockwise:         (x, y) → ( y, −x)
 * counter-clockwise: (x, y) → (−y,  x)
 */
export function rotateConstraint(constraint: Constraint, direction: 'cw' | 'ccw'): Constraint {
  const clockwise = direction === 'cw';
  if (constraint.kind === 'alignment') {
    if (constraint.axis === 'x') {
      return {
        ...constraint,
        axis: 'y',
        offset: clockwise ? -constraint.offset : constraint.offset,
      };
    }
    return {
      ...constraint,
      axis: 'x',
      offset: clockwise ? constraint.offset : -constraint.offset,
    };
  }

  if (constraint.axis === 'x') {
    // x(r) − x(l) ≥ gap
    return clockwise
      ? {
          ...constraint,
          axis: 'y',
          leftOrAbove: constraint.rightOrBelow,
          rightOrBelow: constraint.leftOrAbove,
        }
      : { ...constraint, axis: 'y' };
  }
  // y(r) − y(l) ≥ gap
  return clockwise
    ? { ...constraint, axis: 'x' }
    : {
        ...constraint,
        axis: 'x',
        leftOrAbove: constraint.rightOrBelow,
        rightOrBelow: constraint.leftOrAbove,
      };
}
