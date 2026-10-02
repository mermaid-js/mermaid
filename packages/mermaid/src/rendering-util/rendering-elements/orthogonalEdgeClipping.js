// Clips only terminal legs. Interior bends remain router-owned so label reservations, line hops,
// and validation continue to observe the same orthogonal topology.
const ENDPOINT_EPSILON = 1e-6;

const isFinitePoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y);

const samePoint = (first, second) =>
  Math.abs(first.x - second.x) <= ENDPOINT_EPSILON &&
  Math.abs(first.y - second.y) <= ENDPOINT_EPSILON;

const appendDistinctPoint = (points, point) => {
  if (!points.length || !samePoint(points.at(-1), point)) {
    points.push(point);
  }
};

const outlineEndpoint = (node, port, adjacent) => {
  if (!node?.intersect) {
    return undefined;
  }
  // Intersect from the adjacent bend toward the node so shape-specific boundaries, not bounding
  // boxes, determine the visible endpoint.
  const outline = node.intersect(adjacent);
  if (
    !isFinitePoint(outline) ||
    (Number.isFinite(node.x) &&
      Number.isFinite(node.y) &&
      samePoint(outline, { x: node.x, y: node.y }))
  ) {
    return undefined;
  }
  const vertical = Math.abs(port.x - adjacent.x) <= ENDPOINT_EPSILON;
  const horizontal = Math.abs(port.y - adjacent.y) <= ENDPOINT_EPSILON;
  if (!vertical && !horizontal) {
    return undefined;
  }
  const inwardDirection = vertical
    ? Math.sign(port.y - adjacent.y)
    : Math.sign(port.x - adjacent.x);
  const inwardDepth = vertical
    ? (outline.y - port.y) * inwardDirection
    : (outline.x - port.x) * inwardDirection;
  // Ports on rectangular nodes already sit on the outline. Only replace ports whose shape
  // boundary is inward, otherwise clipping can push an endpoint outward or reverse its segment.
  if (inwardDepth <= ENDPOINT_EPSILON) {
    return undefined;
  }
  return {
    outline,
    elbow: vertical ? { x: outline.x, y: adjacent.y } : { x: adjacent.x, y: outline.y },
  };
};

export const clipOrthogonalEndpointsToNodeOutlines = (points, tail, head) => {
  if (!Array.isArray(points) || points.length < 2) {
    return points;
  }

  // Source and target decisions are independent: mixed shapes may require clipping at one end
  // while the other endpoint is already on its outline.
  const first = points[0];
  const second = points[1];
  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  const source = outlineEndpoint(tail, first, second);
  const target = outlineEndpoint(head, last, penultimate);
  if (!source && !target) {
    return points;
  }
  const clipped = [];

  if (points.length === 2) {
    const clippedFirst = source?.outline ?? first;
    const clippedLast = target?.outline ?? last;
    const vertical = Math.abs(first.x - last.x) <= ENDPOINT_EPSILON;
    const horizontal = Math.abs(first.y - last.y) <= ENDPOINT_EPSILON;
    if (!vertical && !horizontal) {
      return points;
    }
    // Add a midpoint dogleg so clipping differently shaped endpoints cannot create a diagonal.
    appendDistinctPoint(clipped, clippedFirst);
    if (vertical) {
      const middleY = (clippedFirst.y + clippedLast.y) / 2;
      appendDistinctPoint(clipped, { x: clippedFirst.x, y: middleY });
      appendDistinctPoint(clipped, { x: clippedLast.x, y: middleY });
    } else {
      const middleX = (clippedFirst.x + clippedLast.x) / 2;
      appendDistinctPoint(clipped, { x: middleX, y: clippedFirst.y });
      appendDistinctPoint(clipped, { x: middleX, y: clippedLast.y });
    }
    appendDistinctPoint(clipped, clippedLast);
    return clipped;
  }

  if (source) {
    appendDistinctPoint(clipped, source.outline);
    appendDistinctPoint(clipped, source.elbow);
  } else {
    appendDistinctPoint(clipped, first);
  }
  for (const point of points.slice(1, -1)) {
    appendDistinctPoint(clipped, point);
  }
  if (target) {
    appendDistinctPoint(clipped, target.elbow);
    appendDistinctPoint(clipped, target.outline);
  } else {
    appendDistinctPoint(clipped, last);
  }

  return clipped;
};
