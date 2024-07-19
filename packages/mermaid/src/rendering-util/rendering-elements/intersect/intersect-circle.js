import intersectEllipse from './intersect-ellipse.js';

function intersectCircle(node, rx, point) {
  return intersectEllipse(node, rx, rx, point);
}

export default intersectCircle;
