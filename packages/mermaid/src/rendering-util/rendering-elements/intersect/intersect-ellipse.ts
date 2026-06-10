import type { Point } from '../../../types.js';

function intersectEllipse(
  node: { x?: number; y?: number },
  rx: number,
  ry: number,
  point: Point
): Point {
  // Formulae from: https://mathworld.wolfram.com/Ellipse-LineIntersection.html

  // The layout engine has populated the node center before intersections are computed.
  const { x: cx, y: cy } = node as Required<typeof node>;

  const px = cx - point.x;
  const py = cy - point.y;

  const det = Math.sqrt(rx * rx * py * py + ry * ry * px * px);

  let dx = Math.abs((rx * ry * px) / det);
  if (point.x < cx) {
    dx = -dx;
  }
  let dy = Math.abs((rx * ry * py) / det);
  if (point.y < cy) {
    dy = -dy;
  }

  return { x: cx + dx, y: cy + dy };
}

export default intersectEllipse;
