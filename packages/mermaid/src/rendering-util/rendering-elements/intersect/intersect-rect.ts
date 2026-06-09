import type { Point } from '../../../types.js';

/**
 * A node-like object with a center position and dimensions. The properties are
 * optional so that a `Node` is assignable, but they must have been set by the
 * layout engine before the intersection is calculated.
 */
export interface RectLikeNode {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const intersectRect = (node: RectLikeNode, point: Point): Point => {
  const x = node.x!;
  const y = node.y!;

  // Rectangle intersection algorithm from:
  // https://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  const dx = point.x - x;
  const dy = point.y - y;
  let w = node.width! / 2;
  let h = node.height! / 2;

  let sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : (h * dx) / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : (w * dy) / dx;
  }

  return { x: x + sx, y: y + sy };
};

export default intersectRect;
