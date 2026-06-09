import type { Point } from '../../types.js';

function intersectNode(node: { intersect: (point: Point) => Point }, point: Point): Point {
  // console.info('Intersect Node');
  return node.intersect(point);
}

export default intersectNode;
