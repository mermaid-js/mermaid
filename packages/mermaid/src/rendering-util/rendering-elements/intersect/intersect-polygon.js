import intersectLine from './intersect-line.js';

/**
 * Returns the point ({x, y}) at which the point argument intersects with the node argument assuming
 * that it has the shape specified by polygon.
 */
function intersectPolygon(node, polyPoints, point) {
  let x1 = node.x;
  let y1 = node.y;

  let intersections = [];

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  if (typeof polyPoints.forEach === 'function') {
    polyPoints.forEach(function (entry) {
      minX = Math.min(minX, entry.x);
      minY = Math.min(minY, entry.y);
    });
  } else {
    minX = Math.min(minX, polyPoints.x);
    minY = Math.min(minY, polyPoints.y);
  }

  let left = x1 - node.width / 2 - minX;
  let top = y1 - node.height / 2 - minY;

  for (let i = 0; i < polyPoints.length; i++) {
    let p1 = polyPoints[i];
    let p2 = polyPoints[i < polyPoints.length - 1 ? i + 1 : 0];
    let intersect = intersectLine(
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
    return node;
  }

  if (intersections.length > 1) {
    // More intersections, find the one nearest to edge end point
    intersections.sort(function (p, q) {
      let pdx = p.x - point.x;
      let pdy = p.y - point.y;
      let distp = Math.sqrt(pdx * pdx + pdy * pdy);

      let qdx = q.x - point.x;
      let qdy = q.y - point.y;
      let distq = Math.sqrt(qdx * qdx + qdy * qdy);

      return distp < distq ? -1 : distp === distq ? 0 : 1;
    });
  }
  return intersections[0];
}

export default intersectPolygon;
