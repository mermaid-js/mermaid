import type { Axis } from '../model.js';

export type ConstraintId = number;

/**
 * `position(b) − position(a) = offset` on one axis. Offset is normally zero,
 * which is exactly "a and b share a centre line".
 */
export interface AlignmentConstraint {
  kind: 'alignment';
  axis: Axis;
  a: string;
  b: string;
  offset: number;
  /** Which pipeline stage created it — used by diagnostics and tests. */
  origin: ConstraintOrigin;
}

/**
 * `position(rightOrBelow) − position(leftOrAbove) ≥ gap` on one axis.
 * In Mermaid coordinates y grows downward, so "below" is the greater y.
 */
export interface SeparationConstraint {
  kind: 'separation';
  axis: Axis;
  leftOrAbove: string;
  rightOrBelow: string;
  gap: number;
  origin: ConstraintOrigin;
}

export type Constraint = AlignmentConstraint | SeparationConstraint;

export type ConstraintOrigin =
  | 'node-configuration'
  | 'chain-configuration'
  | 'overlap-removal'
  | 'opportunistic-alignment'
  | 'tree-placement'
  | 'face-expansion';

export interface ConstraintSnapshot {
  constraintIds: ConstraintId[];
  positions: Map<string, { x: number; y: number }>;
}

export interface ProjectionResult {
  feasible: boolean;
  /** Total squared displacement from the desired positions. */
  cost: number;
  /** Constraints the solver could not satisfy (cycles). */
  violated: Constraint[];
}

export function alignment(
  axis: Axis,
  a: string,
  b: string,
  origin: ConstraintOrigin,
  offset = 0
): AlignmentConstraint {
  return { kind: 'alignment', axis, a, b, offset, origin };
}

export function separation(
  axis: Axis,
  leftOrAbove: string,
  rightOrBelow: string,
  gap: number,
  origin: ConstraintOrigin
): SeparationConstraint {
  return { kind: 'separation', axis, leftOrAbove, rightOrBelow, gap, origin };
}
