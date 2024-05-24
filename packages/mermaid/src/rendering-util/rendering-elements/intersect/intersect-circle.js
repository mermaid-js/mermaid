import intersectEllipse from './intersect-ellipse.js';

/**
 * @param node
 * @param rx
 * @param point
 */
function intersectCircle(node, rx, point) {
  return intersectEllipse(node, rx, rx, point);
}

export default intersectCircle;
