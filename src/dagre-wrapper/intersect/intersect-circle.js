import intersectEllipse from './intersect-ellipse';

function intersectCircle(node, rx, point) {
  return intersectEllipse(node, rx, rx, point);
}

export default intersectCircle;
