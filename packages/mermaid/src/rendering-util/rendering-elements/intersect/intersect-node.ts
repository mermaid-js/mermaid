import type { Point } from '../../../types.js';

function intersectNode(node: { intersect: (point: Point) => Point }, point: Point): Point {
  return node.intersect(point);
}

export default intersectNode;
