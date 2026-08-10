/**
 * HOLA Step 4c: orientation adjustment (guide §18.3).
 *
 * A portrait component is rotated a quarter turn. The direction is chosen from
 * the *recorded growth direction of each placed tree* — not from directed roots
 * inferred from edge orientation — so the choice maximises trees that end up
 * growing SOUTH, which is what makes a rotated drawing still read naturally.
 *
 * Everything rotates together: node centres, route points, dummy positions,
 * placeholders, mandatory waypoints and the constraint system. Node rectangles
 * keep their measured width and height.
 */

import type { Bounds, Cardinal, HolaNode, Point } from '../model.js';
import { nodeBounds, unionBounds } from '../model.js';
import type { ConstraintSystem } from '../constraints/solver.js';

export type RotationDirection = 'cw' | 'ccw';

/** Clockwise on screen: (x, y) → (y, −x). */
export function rotatePointBy(p: Point, direction: RotationDirection): Point {
  return direction === 'cw' ? { x: p.y, y: -p.x } : { x: -p.y, y: p.x };
}

const CLOCKWISE_GROWTH: Record<Cardinal, Cardinal> = { S: 'E', E: 'N', N: 'W', W: 'S' };
const COUNTER_CLOCKWISE_GROWTH: Record<Cardinal, Cardinal> = { S: 'W', W: 'N', N: 'E', E: 'S' };

export function rotateGrowth(growth: Cardinal, direction: RotationDirection): Cardinal {
  return direction === 'cw' ? CLOCKWISE_GROWTH[growth] : COUNTER_CLOCKWISE_GROWTH[growth];
}

export interface RotationTargets {
  entities: Map<string, HolaNode>;
  /** Every polyline that must rotate with the drawing. */
  polylines: Point[][];
  /** Growth direction of each placed tree, used to choose the direction. */
  treeGrowths: Cardinal[];
  /**
   * Entities that stand for a *region* rather than a node — tree placeholders.
   * A node keeps its measured width and height under rotation (guide §18.3),
   * but a region turns with the drawing, so its extents swap.
   */
  regionIds?: Set<string>;
  system: ConstraintSystem;
}

export interface RotationOutcome {
  rotated: boolean;
  direction?: RotationDirection;
  southBefore: number;
  southAfter: number;
}

export function boundsOfEntities(entities: Map<string, HolaNode>): Bounds | undefined {
  return unionBounds([...entities.values()].map((n) => nodeBounds(n)));
}

/**
 * Rotate when the drawing is taller than it is wide. Returns without touching
 * anything for a landscape or square component.
 */
export function rotateLandscapeIfNeeded(targets: RotationTargets): RotationOutcome {
  const bounds = boundsOfEntities(targets.entities);
  const southBefore = targets.treeGrowths.filter((g) => g === 'S').length;
  if (!bounds) {
    return { rotated: false, southBefore, southAfter: southBefore };
  }

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width >= height) {
    return { rotated: false, southBefore, southAfter: southBefore };
  }

  const southIfClockwise = targets.treeGrowths.filter((g) => rotateGrowth(g, 'cw') === 'S').length;
  const southIfCounter = targets.treeGrowths.filter((g) => rotateGrowth(g, 'ccw') === 'S').length;

  // Deterministic tie-break: clockwise.
  const direction: RotationDirection = southIfClockwise >= southIfCounter ? 'cw' : 'ccw';

  const regions = targets.regionIds ?? new Set<string>();
  for (const node of targets.entities.values()) {
    const p = rotatePointBy({ x: node.x, y: node.y }, direction);
    node.x = p.x;
    node.y = p.y;
    if (regions.has(node.id)) {
      const width = node.width;
      node.width = node.height;
      node.height = width;
    }
    // Real node width/height deliberately untouched (guide §18.3 item 3).
  }
  for (const polyline of targets.polylines) {
    for (let i = 0; i < polyline.length; i++) {
      polyline[i] = rotatePointBy(polyline[i], direction);
    }
  }
  targets.system.rotate90(direction);

  return {
    rotated: true,
    direction,
    southBefore,
    southAfter: direction === 'cw' ? southIfClockwise : southIfCounter,
  };
}
