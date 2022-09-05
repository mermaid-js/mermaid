/**
 * @param node
 * @param rx
 * @param ry
 * @param point
 */
function intersectEllipse(node, rx, ry, point) {
  // Formulae from: https://mathworld.wolfram.com/Ellipse-LineIntersection.html

  let cx = node.x;
  let cy = node.y;

  let px = cx - point.x;
  let py = cy - point.y;

  let det = Math.sqrt(rx * rx * py * py + ry * ry * px * px);

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
