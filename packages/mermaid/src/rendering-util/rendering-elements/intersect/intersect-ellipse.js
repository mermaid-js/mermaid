import { getLineIntersectionOrigin } from './intersection-query.js';

function intersectEllipse(node, rx, ry, point) {
  // Formulae from: https://mathworld.wolfram.com/Ellipse-LineIntersection.html

  var cx = node.x;
  var cy = node.y;
  const lineOrigin = getLineIntersectionOrigin(point, node);

  if (lineOrigin !== node) {
    const originX = lineOrigin.x - cx;
    const originY = lineOrigin.y - cy;
    const deltaX = point.x - lineOrigin.x;
    const deltaY = point.y - lineOrigin.y;
    const rxSquared = rx * rx;
    const rySquared = ry * ry;
    const a = (deltaX * deltaX) / rxSquared + (deltaY * deltaY) / rySquared;
    const b = (2 * originX * deltaX) / rxSquared + (2 * originY * deltaY) / rySquared;
    const c = (originX * originX) / rxSquared + (originY * originY) / rySquared - 1;
    const discriminant = b * b - 4 * a * c;

    if (a > 0 && discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      const intersections = [(-b - root) / (2 * a), (-b + root) / (2 * a)]
        .filter((value) => value >= 0 && value <= 1)
        .sort((first, second) => second - first);
      if (intersections.length) {
        const parameter = intersections[0];
        return {
          x: lineOrigin.x + parameter * deltaX,
          y: lineOrigin.y + parameter * deltaY,
        };
      }
    }
  }

  var px = cx - point.x;
  var py = cy - point.y;

  var det = Math.sqrt(rx * rx * py * py + ry * ry * px * px);

  var dx = Math.abs((rx * ry * px) / det);
  if (point.x < cx) {
    dx = -dx;
  }
  var dy = Math.abs((rx * ry * py) / det);
  if (point.y < cy) {
    dy = -dy;
  }

  return { x: cx + dx, y: cy + dy };
}

export default intersectEllipse;
