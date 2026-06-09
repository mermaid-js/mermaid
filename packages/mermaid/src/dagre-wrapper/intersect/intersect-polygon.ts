/* eslint "no-console": off */

import type { Bounds, Point } from '../../types.js';
import intersectLine from './intersect-line.js';

export default intersectPolygon;

/**
 * Returns the point (`{x, y}`) at which the point argument intersects with the node argument assuming
 * that it has the shape specified by polygon.
 */
function intersectPolygon(node: Bounds, polyPoints: Point[], point: Point): Point {
  const x1 = node.x;
  const y1 = node.y;

  const intersections: Point[] = [];

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  if (typeof polyPoints.forEach === 'function') {
    polyPoints.forEach(function (entry) {
      minX = Math.min(minX, entry.x);
      minY = Math.min(minY, entry.y);
    });
  } else {
    minX = Math.min(minX, (polyPoints as unknown as Point).x);
    minY = Math.min(minY, (polyPoints as unknown as Point).y);
  }

  const left = x1 - node.width / 2 - minX;
  const top = y1 - node.height / 2 - minY;

  for (let i = 0; i < polyPoints.length; i++) {
    const p1 = polyPoints[i];
    const p2 = polyPoints[i < polyPoints.length - 1 ? i + 1 : 0];
    const intersect = intersectLine(
      node,
      point,
      { x: left + p1.x, y: top + p1.y },
      { x: left + p2.x, y: top + p2.y }
    );
    if (intersect) {
      intersections.push(intersect);
    }
  }

  if (!intersections.length) {
    // console.log('NO INTERSECTION FOUND, RETURN NODE CENTER', node);
    return node;
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
