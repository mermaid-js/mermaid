import type { Point } from '../../types.js';
import intersectEllipse from './intersect-ellipse.js';

function intersectCircle(node: Point, rx: number, point: Point): Point {
  return intersectEllipse(node, rx, rx, point);
}

export default intersectCircle;
