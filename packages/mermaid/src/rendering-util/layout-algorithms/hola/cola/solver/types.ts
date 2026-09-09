/**
 * Core data types for the IPSEP-COLA solver.
 *
 * The solver is deliberately Mermaid-agnostic: variables are plain indices into
 * a coordinate array, so the same machinery runs for the x pass and the y pass.
 * Everything Mermaid-specific lives in `../adapter/`.
 */

/**
 * A separation constraint `position(left) + gap <= position(right)` (§1).
 *
 * Constraints are compared by object identity throughout the solver (they live
 * in `Set`s and act as edges of the active tree), so never clone one that is
 * already registered with a {@link BlockState}.
 */
export interface SeparationConstraint {
  /** Index of the variable that must stay on the low side. */
  left: number;
  /** Index of the variable that must stay on the high side. */
  right: number;
  /** Minimum distance from `left` to `right`. */
  gap: number;
}

/**
 * A maximal set of variables joined by active constraints (§3).
 *
 * The active constraints of a block form a spanning tree over its variables;
 * every variable sits at a fixed `offset` from the block's `referencePosition`,
 * so the whole block moves as one rigid body.
 */
export interface Block {
  /** Stable identifier, used only for logging and deterministic iteration. */
  id: number;
  variables: number[];
  variableCount: number;
  activeConstraints: Set<SeparationConstraint>;
  referencePosition: number;
  /** Set once the block's variables have been absorbed by another block. */
  empty: boolean;
}
