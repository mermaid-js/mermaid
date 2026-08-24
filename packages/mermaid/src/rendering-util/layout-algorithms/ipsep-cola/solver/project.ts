import { log } from '../../../../logger.js';
import type { BlockState } from './blocks.js';
import type { SeparationConstraint } from './types.js';

/**
 * §4 PROJECT — move the blocks to their optimal positions for `targetX`, then
 * repeatedly repair the most violated constraint until none is left.
 *
 * Repairing means either merging the two blocks the constraint spans (§6) or,
 * when both endpoints already live in the same block, restructuring that
 * block's active tree (§7).
 */
export function project(
  state: BlockState,
  targetX: readonly number[],
  constraints: readonly SeparationConstraint[]
): number[] {
  for (const block of state.nonEmptyBlocks()) {
    state.updateBlockPosition(block, targetX);
  }

  // An infeasible constraint set would otherwise spin here forever. Constraints
  // that cannot be repaired are parked for the rest of this projection so the
  // remaining, satisfiable ones still get enforced.
  const unrepairable = new Set<SeparationConstraint>();

  // Each repair either merges two blocks (at most n - 1 times) or activates a
  // new constraint in place of an old one. The bound is generous on purpose:
  // tripping it is a bug signal, not a normal exit.
  let guard = 4 * (constraints.length + state.variableCount) + 100;

  let constraint = mostViolatedConstraint(state, constraints, unrepairable);
  while (constraint !== undefined && state.violation(constraint) > 0) {
    if (guard-- <= 0) {
      log.debug('IPSEP-COLA: PROJECT iteration guard tripped, leaving constraints unsatisfied');
      break;
    }

    const leftBlock = state.blockOf[constraint.left];
    const rightBlock = state.blockOf[constraint.right];

    if (leftBlock !== rightBlock) {
      state.mergeBlocks(leftBlock, rightBlock, constraint);
    } else if (!state.expandBlock(leftBlock, constraint, targetX)) {
      unrepairable.add(constraint);
    }

    constraint = mostViolatedConstraint(state, constraints, unrepairable);
  }

  return state.positions();
}

/**
 * §10 MOST_VIOLATED_CONSTRAINT — the constraint with the largest
 * `POSITION(left) + gap - POSITION(right)`.
 */
export function mostViolatedConstraint(
  state: BlockState,
  constraints: readonly SeparationConstraint[],
  skip?: ReadonlySet<SeparationConstraint>
): SeparationConstraint | undefined {
  let worst: SeparationConstraint | undefined;
  let worstViolation = 0;

  for (const constraint of constraints) {
    if (skip?.has(constraint)) {
      continue;
    }
    const violation = state.violation(constraint);
    if (violation > worstViolation) {
      worst = constraint;
      worstViolation = violation;
    }
  }

  return worst;
}
