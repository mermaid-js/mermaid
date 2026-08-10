/**
 * Minimal orthogonal bend sequences (guide §13.3).
 *
 * Given the vector between the two chain anchors, the direction the connector
 * must leave the start anchor in, and the direction it must arrive at the end
 * anchor from, enumerate every sequence of 90° turns of *minimum length* that
 * an orthogonal polyline can use. The result is a sequence of travel
 * directions, not one hard-coded L or Z polyline.
 *
 * Realisability test: with directions d₀…d_b and unknown positive segment
 * lengths l₀…l_b, the polyline reaches Δ exactly when
 *
 *     sum of horizontal l_i·sign_i = dx    and    sum of vertical l_i·sign_i = dy
 *
 * has a strictly positive solution. Because directions alternate H/V, each
 * axis group is independent, and a group with signs S and target T is solvable
 * with positive lengths exactly when:
 *   - S is empty and T is zero, or
 *   - S contains both signs (any T), or
 *   - S is all +1 and T is positive, or all −1 and T is negative.
 */

import type { Cardinal, Point } from '../model.js';
import { DIRECTION_VECTOR } from '../model.js';

export type Turn = 'left' | 'right';

const CLOCKWISE: Cardinal[] = ['E', 'S', 'W', 'N'];

/** Turning right in screen coordinates advances along E → S → W → N. */
export function turn(direction: Cardinal, side: Turn): Cardinal {
  const i = CLOCKWISE.indexOf(direction);
  const step = side === 'right' ? 1 : 3;
  return CLOCKWISE[(i + step) % 4];
}

export function isHorizontal(direction: Cardinal): boolean {
  return direction === 'E' || direction === 'W';
}

export function isRealisable(directions: Cardinal[], delta: Point): boolean {
  const horizontalSigns: number[] = [];
  const verticalSigns: number[] = [];
  for (const d of directions) {
    const v = DIRECTION_VECTOR[d];
    if (isHorizontal(d)) {
      horizontalSigns.push(Math.sign(v.x));
    } else {
      verticalSigns.push(Math.sign(v.y));
    }
  }
  return axisSolvable(horizontalSigns, delta.x) && axisSolvable(verticalSigns, delta.y);
}

const AXIS_EPSILON = 1e-9;

function axisSolvable(signs: number[], target: number): boolean {
  if (signs.length === 0) {
    return Math.abs(target) <= AXIS_EPSILON;
  }
  const hasPositive = signs.includes(1);
  const hasNegative = signs.includes(-1);
  if (hasPositive && hasNegative) {
    return true;
  }
  return hasPositive ? target > AXIS_EPSILON : target < -AXIS_EPSILON;
}

export interface BendSequence {
  /** Travel directions of the b+1 segments. */
  directions: Cardinal[];
  /** The b turns between them. */
  turns: Turn[];
}

const MAX_BENDS = 3;

/**
 * All minimum-length turn sequences taking a connector from `startDirection`
 * to `arrivalDirection` across `delta`.
 */
export function enumerateMinimalBendSequences(
  delta: Point,
  startDirection: Cardinal,
  arrivalDirection: Cardinal
): BendSequence[] {
  for (let bends = 0; bends <= MAX_BENDS; bends++) {
    const found: BendSequence[] = [];
    for (const turns of turnSequences(bends)) {
      const directions: Cardinal[] = [startDirection];
      for (const t of turns) {
        directions.push(turn(directions[directions.length - 1], t));
      }
      if (directions[directions.length - 1] !== arrivalDirection) {
        continue;
      }
      if (!isRealisable(directions, delta)) {
        continue;
      }
      found.push({ directions, turns });
    }
    if (found.length > 0) {
      return found;
    }
  }
  return [];
}

function turnSequences(length: number): Turn[][] {
  if (length === 0) {
    return [[]];
  }
  const shorter = turnSequences(length - 1);
  const result: Turn[][] = [];
  for (const prefix of shorter) {
    result.push([...prefix, 'left'], [...prefix, 'right']);
  }
  return result;
}
