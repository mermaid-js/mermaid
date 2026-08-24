import { log } from '../../../../logger.js';
import type { Block, SeparationConstraint } from './types.js';

/**
 * Block-based projection machinery for IPSEP-COLA — §3, §5–§10 of the
 * pseudocode.
 *
 * `BlockState` owns the three parallel structures the pseudocode keeps as
 * globals (`blockOf`, `offset`, `lagrangeMultiplier`) plus the block list, for
 * ONE axis. The x pass and the y pass therefore each get their own instance,
 * which is what makes the state survive between stress-majorisation iterations
 * (§11 "incremental reuse").
 */
export class BlockState {
  /** Every block ever created; absorbed ones stay here with `empty: true`. */
  readonly blocks: Block[] = [];
  /** `blockOf[v]` — the block currently containing variable `v` (§3). */
  readonly blockOf: Block[] = [];
  /** `offset[v]` — displacement of `v` from its block reference position (§3). */
  readonly offset: number[] = [];
  /** Multipliers written by {@link computeLagrangeMultipliers} (§8). */
  readonly lagrangeMultiplier = new Map<SeparationConstraint, number>();

  private nextBlockId = 0;

  /**
   * §11 INITIALIZE_QPSC_STATE — one singleton block per variable.
   */
  constructor(initialPositions: readonly number[]) {
    for (const position of initialPositions) {
      const block = this.createBlock([], position);
      const v = this.blockOf.length;
      block.variables.push(v);
      block.variableCount = 1;
      this.blockOf.push(block);
      this.offset.push(0);
    }
  }

  get variableCount(): number {
    return this.blockOf.length;
  }

  private createBlock(variables: number[], referencePosition: number): Block {
    const block: Block = {
      id: this.nextBlockId++,
      variables,
      variableCount: variables.length,
      activeConstraints: new Set<SeparationConstraint>(),
      referencePosition,
      empty: false,
    };
    this.blocks.push(block);
    return block;
  }

  /** §3 POSITION(v). */
  position(v: number): number {
    return this.blockOf[v].referencePosition + this.offset[v];
  }

  /** §4 VIOLATION(c) — positive means the constraint is currently broken. */
  violation(c: SeparationConstraint): number {
    return this.position(c.left) + c.gap - this.position(c.right);
  }

  /** Snapshot of every variable's position, i.e. the `x` PROJECT returns (§4). */
  positions(): number[] {
    const out = new Array<number>(this.variableCount);
    for (let v = 0; v < out.length; v++) {
      out[v] = this.position(v);
    }
    return out;
  }

  /** Blocks that still own variables, in creation order (deterministic). */
  nonEmptyBlocks(): Block[] {
    return this.blocks.filter((block) => !block.empty && block.variableCount > 0);
  }

  /**
   * §5 UPDATE_BLOCK_POSITION — move the block to the position that minimises
   * the squared distance of its (rigidly offset) variables to `targetX`.
   */
  updateBlockPosition(block: Block, targetX: readonly number[]): void {
    if (block.variableCount === 0) {
      return;
    }
    let total = 0;
    for (const v of block.variables) {
      total += targetX[v] - this.offset[v];
    }
    block.referencePosition = total / block.variableCount;
  }

  /**
   * §6 MERGE_BLOCKS — absorb `rightBlock` into `leftBlock`, making `c` active.
   *
   * `shift` is exactly the displacement that turns `c` into an equality, so
   * after the merge every variable of R keeps its relative geometry and `c`
   * holds with zero violation.
   */
  mergeBlocks(leftBlock: Block, rightBlock: Block, c: SeparationConstraint): void {
    const L = leftBlock;
    const R = rightBlock;

    const shift = this.offset[c.left] + c.gap - this.offset[c.right];

    L.referencePosition =
      (L.referencePosition * L.variableCount + (R.referencePosition - shift) * R.variableCount) /
      (L.variableCount + R.variableCount);

    for (const constraint of R.activeConstraints) {
      L.activeConstraints.add(constraint);
    }
    L.activeConstraints.add(c);

    for (const v of R.variables) {
      this.blockOf[v] = L;
      this.offset[v] += shift;
    }

    L.variables.push(...R.variables);
    L.variableCount = L.variables.length;

    R.variables = [];
    R.variableCount = 0;
    R.activeConstraints = new Set<SeparationConstraint>();
    R.empty = true;
  }

  /**
   * §7 EXPAND_BLOCK — the violated constraint joins two variables that already
   * share a block, so the active tree has to be restructured: drop the weakest
   * active edge on the tree path between the endpoints, slide the freed
   * component far enough to satisfy the violation, then activate the violated
   * constraint in its place.
   *
   * Returns `false` when no forward-directed active edge exists on the path.
   * The pseudocode leaves that case undefined; it can only arise for an
   * unsatisfiable constraint set, and PROJECT uses the `false` to drop the
   * constraint rather than spin forever.
   */
  expandBlock(
    block: Block,
    violatedConstraint: SeparationConstraint,
    targetX: readonly number[]
  ): boolean {
    const active = new Set(block.activeConstraints);

    this.computeLagrangeMultipliers(violatedConstraint.left, active, targetX);

    const path = findTreePath(violatedConstraint.left, violatedConstraint.right, active);
    if (!path) {
      return false;
    }

    const incident = buildIncidenceMap(active);
    const candidateSplitConstraints: SeparationConstraint[] = [];
    for (let i = 0; i + 1 < path.length; i++) {
      for (const c of incident.get(path[i]) ?? []) {
        if (c.left === path[i] && c.right === path[i + 1]) {
          candidateSplitConstraints.push(c);
        }
      }
    }
    if (candidateSplitConstraints.length === 0) {
      return false;
    }

    let splitConstraint = candidateSplitConstraints[0];
    for (const c of candidateSplitConstraints) {
      if (
        (this.lagrangeMultiplier.get(c) ?? 0) < (this.lagrangeMultiplier.get(splitConstraint) ?? 0)
      ) {
        splitConstraint = c;
      }
    }
    active.delete(splitConstraint);

    const rightComponent = variablesConnectedTo(violatedConstraint.right, active);

    // Read the violation BEFORE the offsets move — it is the exact amount the
    // freed component has to travel.
    const amount = this.violation(violatedConstraint);
    for (const v of rightComponent) {
      this.offset[v] += amount;
    }

    active.add(violatedConstraint);
    block.activeConstraints = active;

    this.updateBlockPosition(block, targetX);
    return true;
  }

  /**
   * §8 — fill `lagrangeMultiplier` for every constraint in `activeConstraints`
   * reachable from `startVariable`, by a post-order walk of the active tree.
   *
   * The multiplier of an active constraint measures how hard it is pulling; a
   * negative value means the constraint is holding two variables together that
   * the unconstrained objective would rather separate, which is what §9 uses to
   * decide where to split.
   */
  computeLagrangeMultipliers(
    startVariable: number,
    activeConstraints: ReadonlySet<SeparationConstraint>,
    targetX: readonly number[]
  ): void {
    const incident = buildIncidenceMap(activeConstraints);
    this.computeDerivative(startVariable, incident, undefined, targetX);
  }

  /** §8 COMPUTE_DERIVATIVE. */
  private computeDerivative(
    variable: number,
    incident: Map<number, SeparationConstraint[]>,
    parentVariable: number | undefined,
    targetX: readonly number[]
  ): number {
    let derivative = this.position(variable) - targetX[variable];

    for (const c of incident.get(variable) ?? []) {
      const neighbor = c.left === variable ? c.right : c.left;
      if (neighbor === parentVariable) {
        continue;
      }

      if (c.left === variable) {
        const childDerivative = this.computeDerivative(c.right, incident, variable, targetX);
        this.lagrangeMultiplier.set(c, childDerivative);
        derivative += childDerivative;
      } else if (c.right === variable) {
        const childDerivative = this.computeDerivative(c.left, incident, variable, targetX);
        this.lagrangeMultiplier.set(c, -childDerivative);
        derivative += childDerivative;
      }
    }

    return derivative;
  }

  /**
   * §9 SPLIT_BLOCKS — projection never undoes an old merge on its own, so
   * before the next projection every active constraint with a negative
   * multiplier is removed, splitting its block in two.
   *
   * Returns `noSplitOccurred`, which SOLVE_QPSC (§2) folds into its termination
   * test: the solver may only stop when the block structure has also settled.
   */
  splitBlocks(targetX: readonly number[]): boolean {
    let noSplitOccurred = true;

    // Snapshot: splitting appends new blocks, and the pseudocode's `for each
    // non-empty block` iterates the blocks present when the pass started (the
    // new right-hand block is fully handled by the inner while loop).
    for (const block of this.nonEmptyBlocks()) {
      if (block.empty || block.variableCount === 0) {
        continue;
      }
      this.updateBlockPosition(block, targetX);

      let active = new Set(block.activeConstraints);
      this.computeLagrangeMultipliers(block.variables[0], active, targetX);

      let guard = active.size + 1;
      let splitConstraint = this.mostNegativeMultiplier(active);
      while (splitConstraint !== undefined && guard-- > 0) {
        noSplitOccurred = false;
        active.delete(splitConstraint);

        const rightVariables = variablesConnectedTo(splitConstraint.right, active);
        const leftVariables = block.variables.filter((v) => !rightVariables.has(v));

        const right = this.createBlock([...rightVariables], block.referencePosition);
        block.variables = leftVariables;
        block.variableCount = leftVariables.length;
        right.variableCount = right.variables.length;

        for (const v of right.variables) {
          this.blockOf[v] = right;
        }

        const leftSet = new Set(block.variables);
        block.activeConstraints = filterConstraintsWithin(active, leftSet);
        right.activeConstraints = filterConstraintsWithin(active, rightVariables);

        this.updateBlockPosition(block, targetX);
        this.updateBlockPosition(right, targetX);

        active = block.activeConstraints;
        if (block.variableCount > 0) {
          this.computeLagrangeMultipliers(block.variables[0], active, targetX);
        }
        splitConstraint = this.mostNegativeMultiplier(active);
      }

      if (guard < 0) {
        log.debug('IPSEP-COLA: split loop guard tripped for block', block.id);
      }
    }

    return noSplitOccurred;
  }

  private mostNegativeMultiplier(
    active: ReadonlySet<SeparationConstraint>
  ): SeparationConstraint | undefined {
    let worst: SeparationConstraint | undefined;
    let worstValue = 0;
    for (const c of active) {
      const value = this.lagrangeMultiplier.get(c) ?? 0;
      if (value < worstValue) {
        worst = c;
        worstValue = value;
      }
    }
    return worst;
  }
}

/** Adjacency over the active-constraint tree, keyed by variable. */
function buildIncidenceMap(
  constraints: ReadonlySet<SeparationConstraint>
): Map<number, SeparationConstraint[]> {
  const incident = new Map<number, SeparationConstraint[]>();
  for (const c of constraints) {
    let left = incident.get(c.left);
    if (!left) {
      left = [];
      incident.set(c.left, left);
    }
    left.push(c);

    let right = incident.get(c.right);
    if (!right) {
      right = [];
      incident.set(c.right, right);
    }
    right.push(c);
  }
  return incident;
}

/** Active constraints with both endpoints inside `variables`. */
function filterConstraintsWithin(
  constraints: ReadonlySet<SeparationConstraint>,
  variables: ReadonlySet<number>
): Set<SeparationConstraint> {
  const out = new Set<SeparationConstraint>();
  for (const c of constraints) {
    if (variables.has(c.left) && variables.has(c.right)) {
      out.add(c);
    }
  }
  return out;
}

/**
 * §10 FIND_TREE_PATH — the unique path through the active tree, as a variable
 * sequence starting at `start` and ending at `end`. `undefined` when the two
 * are not connected.
 */
export function findTreePath(
  start: number,
  end: number,
  activeConstraints: ReadonlySet<SeparationConstraint>
): number[] | undefined {
  if (start === end) {
    return [start];
  }
  const incident = buildIncidenceMap(activeConstraints);
  const predecessor = new Map<number, number>([[start, start]]);
  const queue = [start];

  // A `for...of` over an array observes elements appended during iteration, so
  // this is a BFS queue, not a fixed-length scan.
  for (const variable of queue) {
    if (variable === end) {
      break;
    }
    for (const c of incident.get(variable) ?? []) {
      const neighbor = c.left === variable ? c.right : c.left;
      if (predecessor.has(neighbor)) {
        continue;
      }
      predecessor.set(neighbor, variable);
      queue.push(neighbor);
    }
  }

  if (!predecessor.has(end)) {
    return undefined;
  }

  const path = [end];
  let current = end;
  while (current !== start) {
    current = predecessor.get(current)!;
    path.push(current);
  }
  return path.reverse();
}

/** §10 VARIABLES_CONNECTED_TO — everything reachable from `start`. */
export function variablesConnectedTo(
  start: number,
  activeConstraints: ReadonlySet<SeparationConstraint>
): Set<number> {
  const incident = buildIncidenceMap(activeConstraints);
  const reachable = new Set<number>([start]);
  const queue = [start];

  // See `findTreePath`: iterating the array is what makes this a BFS queue.
  for (const variable of queue) {
    for (const c of incident.get(variable) ?? []) {
      const neighbor = c.left === variable ? c.right : c.left;
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return reachable;
}
