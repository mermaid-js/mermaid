import intersectLine from './intersect-line.js';

/**
 * Returns the point ({x, y}) at which the point argument intersects with the node argument assuming
 * that it has the shape specified by polygon.
 */
function intersectPolygon(node, polyPoints, point) {
  let x1 = node.x;
  let y1 = node.y;
  // console.trace('APA14 intersectPolygon', x1, y1, polyPoints, point);
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
  // console.log('APA13 intersectPolygon2 ', left, y1);
  for (let i = 0; i < polyPoints.length; i++) {
    let p1 = polyPoints[i];
    let p2 = polyPoints[i < polyPoints.length - 1 ? i + 1 : 0];
    let intersect = intersectLine(
      node,
      point,
      { x: left + p1.x, y: top + p1.y },
      { x: left + p2.x, y: top + p2.y }
    );
    // console.log('APA13 intersectPolygon3 ', intersect);
    if (intersect) {
      // console.log('APA13 intersectPolygon4 ', intersect);
      intersections.push(intersect);
    }
  }

  if (!intersections.length) {
    return node;
  }
  // console.log('APA12 intersectPolygon5 ');

  if (intersections.length > 1) {
    // More intersections, find the one nearest to edge end point
    intersections.sort(function (p, q) {
      let pdx = p.x - point.x;
      let pdy = p.y - point.y;
      let distp = Math.sqrt(pdx * pdx + pdy * pdy);

      let qdx = q.x - point.x;
      let qdy = q.y - point.y;
      let distq = Math.sqrt(qdx * qdx + qdy * qdy);

      // console.log('APA12 intersectPolygon6 ');

      return distp < distq ? -1 : distp === distq ? 0 : 1;
    });
  }
  return intersections[0];
}

export default intersectPolygon;
