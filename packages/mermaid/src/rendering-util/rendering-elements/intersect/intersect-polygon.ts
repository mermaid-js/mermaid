import type { Point } from '../../../types.js';
import intersectLine from './intersect-line.js';
import type { RectLikeNode } from './intersect-rect.js';

/**
 * Returns the point (`x`, `y`) at which the point argument intersects with the node argument assuming
 * that it has the shape specified by polygon.
 */
function intersectPolygon(node: RectLikeNode, polyPoints: Point[], point: Point): Point {
  // The layout engine has populated the node geometry before intersections are computed.
  const { x: x1, y: y1, width, height } = node as Required<RectLikeNode>;

  const intersections = [];

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  if (typeof polyPoints.forEach === 'function') {
    polyPoints.forEach(function (entry) {
      minX = Math.min(minX, entry.x);
      minY = Math.min(minY, entry.y);
    });
  } else {
    const singlePoint = polyPoints as unknown as Point;
    minX = Math.min(minX, singlePoint.x);
    minY = Math.min(minY, singlePoint.y);
  }

  const left = x1 - width / 2 - minX;
  const top = y1 - height / 2 - minY;

  for (let i = 0; i < polyPoints.length; i++) {
    const p1 = polyPoints[i];
    const p2 = polyPoints[i < polyPoints.length - 1 ? i + 1 : 0];
    const intersect = intersectLine(
      node as Point,
      point,
      { x: left + p1.x, y: top + p1.y },
      { x: left + p2.x, y: top + p2.y }
    );
    if (intersect) {
      intersections.push(intersect);
    }
  }

  if (!intersections.length) {
    return node as Point;
  }

  if (intersections.length > 1) {
    // More intersections, find the one nearest to edge end point
    intersections.sort(function (p, q) {
      const pdx = p.x - point.x;
      const pdy = p.y - point.y;
      const distp = Math.sqrt(pdx * pdx + pdy * pdy);

      const qdx = q.x - point.x;
      const qdy = q.y - point.y;
      const distq = Math.sqrt(qdx * qdx + qdy * qdy);

      return distp < distq ? -1 : distp === distq ? 0 : 1;
    });
  }
  return intersections[0];
}

export default intersectPolygon;
