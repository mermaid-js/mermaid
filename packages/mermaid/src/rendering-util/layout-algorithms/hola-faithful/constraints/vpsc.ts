/**
 * Variable Placement with Separation Constraints (VPSC).
 *
 * This is the solver HOLA's constraint layer is built on. It solves, for one
 * axis at a time:
 *
 *     minimise   Σ_i  w_i · (p_i − d_i)²
 *     subject to p_r − p_l ≥ gap   for every separation constraint (l, r, gap)
 *                p_r − p_l = gap   for every equality (alignment) constraint
 *
 * The algorithm is the block-based active-set method of
 * Dwyer, Marriott & Stuckey, *Fast Node Overlap Removal* (GD 2006), which is
 * also what Adaptagrams' `libvpsc` implements: variables joined by tight
 * ("active") constraints are grouped into blocks that move rigidly; blocks are
 * merged when a constraint is violated and split again when a block's internal
 * Lagrange multiplier goes negative, meaning the optimum lies apart.
 *
 * Guide §7 requires this rather than direct coordinate assignment, because
 * every later HOLA stage relies on being able to *project* an arbitrary desired
 * position onto the feasible region while moving nodes as little as possible.
 */

/** A block's optimal position is a weighted mean; these are the running sums. */
class PositionStats {
  weightedOffsetSum = 0;
  weightedDesiredSum = 0;
  weightSum = 0;

  reset(): void {
    this.weightedOffsetSum = 0;
    this.weightedDesiredSum = 0;
    this.weightSum = 0;
  }

  add(variable: Variable): void {
    this.weightedOffsetSum += variable.weight * variable.offset;
    this.weightedDesiredSum += variable.weight * variable.desiredPosition;
    this.weightSum += variable.weight;
  }

  /** argmin over the block reference position of Σ w·(posn + offset − desired)². */
  position(): number {
    if (this.weightSum === 0) {
      return 0;
    }
    return (this.weightedDesiredSum - this.weightedOffsetSum) / this.weightSum;
  }
}

export class Variable {
  /** Displacement from the reference position of the block this variable is in. */
  offset = 0;
  block!: Block;
  /** Constraints where this variable is the right (greater) side. */
  incoming: VpscConstraint[] = [];
  /** Constraints where this variable is the left (lesser) side. */
  outgoing: VpscConstraint[] = [];

  constructor(
    public desiredPosition: number,
    public weight = 1,
    /** Caller-supplied tag so results can be mapped back. */
    public readonly key = ''
  ) {}

  position(): number {
    return this.block.position + this.offset;
  }

  /** Derivative of this variable's own cost term at the current position. */
  gradient(): number {
    return 2 * this.weight * (this.position() - this.desiredPosition);
  }

  /** Walk the active constraints incident to this variable, skipping `from`. */
  visitActiveNeighbours(
    from: Variable | null,
    visit: (constraint: VpscConstraint, next: Variable) => void
  ): void {
    for (const c of this.outgoing) {
      if (c.active && c.right !== from) {
        visit(c, c.right);
      }
    }
    for (const c of this.incoming) {
      if (c.active && c.left !== from) {
        visit(c, c.left);
      }
    }
  }
}

export class VpscConstraint {
  active = false;
  /** Lagrange multiplier of this constraint while it is active. */
  lm = 0;
  /** Set when the constraint takes part in a cycle that cannot be satisfied. */
  unsatisfiable = false;

  constructor(
    public readonly left: Variable,
    public readonly right: Variable,
    public gap: number,
    /** Equality constraints are always held tight; they model alignment. */
    public readonly equality = false
  ) {}

  /** How much slack the constraint has; negative means violated. */
  slack(): number {
    return this.right.position() - this.gap - this.left.position();
  }
}

class Block {
  readonly variables: Variable[] = [];
  position = 0;
  private readonly stats = new PositionStats();

  constructor(seed: Variable) {
    seed.offset = 0;
    this.addVariable(seed);
  }

  addVariable(variable: Variable): void {
    variable.block = this;
    this.variables.push(variable);
    this.stats.add(variable);
    this.position = this.stats.position();
  }

  recomputePosition(): void {
    this.stats.reset();
    for (const v of this.variables) {
      this.stats.add(v);
    }
    this.position = this.stats.position();
  }

  cost(): number {
    let total = 0;
    for (const v of this.variables) {
      const d = v.position() - v.desiredPosition;
      total += v.weight * d * d;
    }
    return total;
  }

  /**
   * Absorb `other` into this block along the newly activated constraint,
   * shifting every one of `other`'s offsets by `shift`.
   */
  mergeAcross(other: Block, constraint: VpscConstraint, shift: number): void {
    constraint.active = true;
    for (const v of other.variables) {
      v.offset += shift;
      this.addVariable(v);
    }
    this.position = this.stats.position();
  }

  /**
   * Depth-first accumulation of ∂f/∂v over the active constraint tree, tagging
   * each active constraint with its Lagrange multiplier on the way back up.
   */
  private computeLagrangeMultipliers(
    node: Variable,
    from: Variable | null,
    after: (constraint: VpscConstraint) => void
  ): number {
    let derivative = node.gradient();
    node.visitActiveNeighbours(from, (constraint, next) => {
      const sub = this.computeLagrangeMultipliers(next, node, after);
      derivative += sub;
      constraint.lm = next === constraint.right ? sub : -sub;
      after(constraint);
    });
    return derivative;
  }

  /** The active constraint whose multiplier is most negative, if any. */
  findMostNegativeMultiplier(): VpscConstraint | null {
    if (this.variables.length <= 1) {
      return null;
    }
    let best: VpscConstraint | null = null;
    this.computeLagrangeMultipliers(this.variables[0], null, (constraint) => {
      if (!constraint.equality && (best === null || constraint.lm < best.lm)) {
        best = constraint;
      }
    });
    return best;
  }

  /** Walk the active tree from `node` to `to`, visiting the constraints used. */
  private findPath(
    node: Variable,
    from: Variable | null,
    to: Variable,
    visit: (constraint: VpscConstraint, next: Variable) => void
  ): boolean {
    let found = false;
    node.visitActiveNeighbours(from, (constraint, next) => {
      if (found) {
        return;
      }
      if (next === to || this.findPath(next, node, to, visit)) {
        found = true;
        visit(constraint, next);
      }
    });
    return found;
  }

  /**
   * The weakest active constraint on the tree path from `left` to `right` —
   * the one to release so that a violated constraint between two variables of
   * the *same* block can become satisfiable.
   */
  findMinimumMultiplierBetween(left: Variable, right: Variable): VpscConstraint | null {
    this.computeLagrangeMultipliers(left, null, () => {
      /* multipliers only */
    });
    let best: VpscConstraint | null = null;
    this.findPath(left, null, right, (constraint, next) => {
      if (
        !constraint.equality &&
        constraint.right === next &&
        (best === null || constraint.lm < best.lm)
      ) {
        best = constraint;
      }
    });
    return best;
  }

  isActiveDirectedPathBetween(from: Variable, to: Variable): boolean {
    if (from === to) {
      return true;
    }
    for (const c of from.outgoing) {
      if (c.active && this.isActiveDirectedPathBetween(c.right, to)) {
        return true;
      }
    }
    return false;
  }

  /** Deactivate `constraint` and rebuild the two blocks it was holding together. */
  static split(constraint: VpscConstraint): [Block, Block] {
    constraint.active = false;
    return [Block.buildFrom(constraint.left), Block.buildFrom(constraint.right)];
  }

  private static buildFrom(seed: Variable): Block {
    const block = new Block(seed);
    block.absorbConnected(seed, null);
    block.recomputePosition();
    return block;
  }

  private absorbConnected(node: Variable, from: Variable | null): void {
    node.visitActiveNeighbours(from, (constraint, next) => {
      next.offset = node.offset + (next === constraint.right ? constraint.gap : -constraint.gap);
      this.addVariable(next);
      this.absorbConnected(next, node);
    });
  }
}

class BlockSet {
  private readonly blocks = new Set<Block>();

  constructor(variables: Variable[]) {
    for (const v of variables) {
      this.blocks.add(new Block(v));
    }
  }

  insert(block: Block): void {
    this.blocks.add(block);
  }

  remove(block: Block): void {
    this.blocks.delete(block);
  }

  list(): Block[] {
    return [...this.blocks];
  }

  cost(): number {
    let total = 0;
    for (const b of this.blocks) {
      total += b.cost();
    }
    return total;
  }

  merge(constraint: VpscConstraint): void {
    const left = constraint.left.block;
    const right = constraint.right.block;
    const shift = constraint.right.offset - constraint.left.offset - constraint.gap;
    if (left.variables.length < right.variables.length) {
      right.mergeAcross(left, constraint, shift);
      this.remove(left);
    } else {
      left.mergeAcross(right, constraint, -shift);
      this.remove(right);
    }
  }

  /** Release every active constraint whose multiplier says the block should open up. */
  splitNegativeMultipliers(inactive: VpscConstraint[], tolerance: number): void {
    for (const block of this.list()) {
      const constraint = block.findMostNegativeMultiplier();
      if (constraint !== null && constraint.lm < tolerance) {
        const owner = constraint.left.block;
        for (const nb of Block.split(constraint)) {
          this.insert(nb);
        }
        this.remove(owner);
        inactive.push(constraint);
      }
    }
  }
}

const LAGRANGIAN_TOLERANCE = -1e-4;
const ZERO_UPPER_BOUND = -1e-10;
const COST_CONVERGENCE = 1e-6;
const MAX_SOLVE_ROUNDS = 512;

export interface VpscResult {
  /** True when every constraint could be satisfied. */
  feasible: boolean;
  /** Constraints that took part in an unsatisfiable cycle. */
  unsatisfiable: VpscConstraint[];
  cost: number;
}

/**
 * Solve one axis. Variable positions are read back with `variable.position()`.
 */
export function solveVpsc(variables: Variable[], constraints: VpscConstraint[]): VpscResult {
  for (const v of variables) {
    v.incoming = [];
    v.outgoing = [];
  }
  for (const c of constraints) {
    c.active = false;
    c.unsatisfiable = false;
    c.left.outgoing.push(c);
    c.right.incoming.push(c);
  }

  const blocks = new BlockSet(variables);
  const inactive = [...constraints];

  const mostViolated = (): VpscConstraint | null => {
    let minSlack = Number.MAX_VALUE;
    let found: VpscConstraint | null = null;
    let foundIndex = -1;
    for (const [i, c] of inactive.entries()) {
      if (c.unsatisfiable) {
        continue;
      }
      const slack = c.equality ? Number.NEGATIVE_INFINITY : c.slack();
      if (slack < minSlack) {
        minSlack = slack;
        found = c;
        foundIndex = i;
        if (c.equality) {
          break;
        }
      }
    }
    if (found !== null && (found.equality || (minSlack < ZERO_UPPER_BOUND && !found.active))) {
      inactive[foundIndex] = inactive[inactive.length - 1];
      inactive.pop();
      return found;
    }
    return null;
  };

  const satisfy = (): void => {
    blocks.splitNegativeMultipliers(inactive, LAGRANGIAN_TOLERANCE);
    let guard = 0;
    let violated = mostViolated();
    while (violated !== null && guard++ < constraints.length * 8 + 64) {
      const leftBlock = violated.left.block;
      const rightBlock = violated.right.block;
      if (leftBlock !== rightBlock) {
        blocks.merge(violated);
      } else if (leftBlock.isActiveDirectedPathBetween(violated.right, violated.left)) {
        // Activating this would close a cycle of tight constraints.
        violated.unsatisfiable = true;
      } else {
        const release = leftBlock.findMinimumMultiplierBetween(violated.left, violated.right);
        if (release === null) {
          violated.unsatisfiable = true;
        } else {
          for (const nb of Block.split(release)) {
            blocks.insert(nb);
          }
          blocks.remove(leftBlock);
          inactive.push(release);
          if (violated.slack() >= 0) {
            inactive.push(violated);
          } else {
            blocks.merge(violated);
          }
        }
      }
      violated = mostViolated();
    }
  };

  satisfy();
  let previousCost = Number.MAX_VALUE;
  let cost = blocks.cost();
  let rounds = 0;
  while (Math.abs(previousCost - cost) > COST_CONVERGENCE && rounds++ < MAX_SOLVE_ROUNDS) {
    satisfy();
    previousCost = cost;
    cost = blocks.cost();
  }

  const unsatisfiable = constraints.filter((c) => c.unsatisfiable);
  return { feasible: unsatisfiable.length === 0, unsatisfiable, cost };
}
