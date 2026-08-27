/* Geometry utilities extracted from render.ts for reuse and testing */

export interface P {
  x: number;
  y: number;
}

export interface RectLike {
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  padding?: number;
}

export interface NodeLike {
  intersect?: (p: P) => P | null;
}

export const EPS = 1;
export const PUSH_OUT = 10;

export const onBorder = (bounds: RectLike, p: P, tol = 0.5): boolean => {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  const onLeft = Math.abs(p.x - left) <= tol && p.y >= top - tol && p.y <= bottom + tol;
  const onRight = Math.abs(p.x - right) <= tol && p.y >= top - tol && p.y <= bottom + tol;
  const onTop = Math.abs(p.y - top) <= tol && p.x >= left - tol && p.x <= right + tol;
  const onBottom = Math.abs(p.y - bottom) <= tol && p.x >= left - tol && p.x <= right + tol;
  return onLeft || onRight || onTop || onBottom;
};

/**
 * Compute intersection between a rectangle (center x/y, width/height) and the line
 * segment from insidePoint -\> outsidePoint. Returns the point on the rectangle border.
 *
 * This version avoids snapping to outsidePoint when certain variables evaluate to 0
 * (previously caused vertical top/bottom cases to miss the border). It only enforces
 * axis-constant behavior for purely vertical/horizontal approaches.
 */
export const intersection = (node: RectLike, outsidePoint: P, insidePoint: P): P => {
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  const w = node.width / 2;
  let r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  const h = node.height / 2;

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);

  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) {
    // Intersection is top or bottom of rect.
    const q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    r = (R * q) / Q;
    const res = {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x - R + r,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + Q - q : insidePoint.y - Q + q,
    };

    // Keep axis-constant special-cases only
    if (R === 0) {
      res.x = outsidePoint.x;
    }
    if (Q === 0) {
      res.y = outsidePoint.y;
    }
    return res;
  } else {
    // Intersection on sides of rect
    if (insidePoint.x < outsidePoint.x) {
      r = outsidePoint.x - w - x;
    } else {
      r = x - w - outsidePoint.x;
    }
    const q = (Q * r) / R;
    let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - R + r;
    let _y = insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q;

    // Only handle axis-constant cases
    if (R === 0) {
      _x = outsidePoint.x;
    }
    if (Q === 0) {
      _y = outsidePoint.y;
    }

    return { x: _x, y: _y };
  }
};

export const outsideNode = (node: RectLike, point: P): boolean => {
  const x = node.x;
  const y = node.y;
  const dx = Math.abs(point.x - x);
  const dy = Math.abs(point.y - y);
  const w = node.width / 2;
  const h = node.height / 2;
  return dx >= w || dy >= h;
};

export const ensureTrulyOutside = (bounds: RectLike, p: P, push = PUSH_OUT): P => {
  const dx = Math.abs(p.x - bounds.x);
  const dy = Math.abs(p.y - bounds.y);
  const w = bounds.width / 2;
  const h = bounds.height / 2;
  if (Math.abs(dx - w) < EPS || Math.abs(dy - h) < EPS) {
    const dirX = p.x - bounds.x;
    const dirY = p.y - bounds.y;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) {
      return {
        x: bounds.x + (dirX / len) * (len + push),
        y: bounds.y + (dirY / len) * (len + push),
      };
    }
  }
  return p;
};

export const makeInsidePoint = (bounds: RectLike, outside: P, center: P): P => {
  const isVertical = Math.abs(outside.x - bounds.x) < EPS;
  const isHorizontal = Math.abs(outside.y - bounds.y) < EPS;
  return {
    x: isVertical
      ? outside.x
      : outside.x < bounds.x
        ? bounds.x - bounds.width / 4
        : bounds.x + bounds.width / 4,
    y: isHorizontal ? outside.y : center.y,
  };
};

export const tryNodeIntersect = (node: NodeLike, bounds: RectLike, outside: P): P | null => {
  if (!node?.intersect) {
    return null;
  }
  const res = node.intersect(outside);
  if (!res) {
    return null;
  }
  const wrongSide =
    (outside.x < bounds.x && res.x > bounds.x) || (outside.x > bounds.x && res.x < bounds.x);
  if (wrongSide) {
    return null;
  }
  const dist = Math.hypot(outside.x - res.x, outside.y - res.y);
  if (dist <= EPS) {
    return null;
  }
  return res;
};

export const fallbackIntersection = (bounds: RectLike, outside: P, center: P): P => {
  const inside = makeInsidePoint(bounds, outside, center);
  return intersection(bounds, outside, inside);
};

/**
 * Bisection steps used to walk a ray onto the node outline.
 *
 * Each step halves the bracket and costs one `node.intersect()` call, and both
 * endpoints of every edge run this — so the count is paid twice per edge. 20
 * steps take a 200px starting bracket to about 2e-4px, which is four orders of
 * magnitude below anything that can be rendered; going further only buys
 * precision that the SVG coordinate is rounded away from anyway.
 */
const OUTLINE_RAY_STEPS = 20;

/**
 * Whether a point lies inside the node's outline.
 *
 * Derived from `intersect` alone, so it needs no per-shape knowledge: the
 * shape's `intersect` returns where the ray from the node CENTRE through the
 * probe leaves the outline, so the probe is inside exactly when it is no
 * further from the centre than that crossing is. Valid for any outline that is
 * star-shaped about its centre, which every built-in shape is.
 */
const insideOutline = (node: NodeLike, centre: P, probe: P): boolean => {
  const crossing = node.intersect?.(probe);
  if (!crossing) {
    return false;
  }
  const probeDist = Math.hypot(probe.x - centre.x, probe.y - centre.y);
  const outlineDist = Math.hypot(crossing.x - centre.x, crossing.y - centre.y);
  return probeDist <= outlineDist + 1e-9;
};

/**
 * Where the node's outline meets the ray that runs into the node from `port`,
 * against the direction the edge departs in.
 *
 * ELK routes to ports on the node's BOUNDING BOX, and always leaves one
 * perpendicular to the side it sits on. For a rectangle that port is already
 * the attachment point. For anything else the outline is inside the box, so the
 * attachment has to move inwards — and the direction it moves in decides
 * whether the edge stays orthogonal.
 *
 * Moving along the centre ray (what `intersect` does on its own) lands on the
 * outline at a DIFFERENT offset along the side than the port, so the opening
 * segment comes out diagonal and the edge visibly kinks as it leaves the shape.
 * Moving along the departure axis instead keeps the attachment collinear with
 * ELK's own stub: the edge leaves the outline, crosses the box, and carries on
 * in one straight line.
 *
 * Returns null when the ray cannot be resolved — no `intersect`, a departure
 * direction that is not axis-aligned, or an interior sample that is not
 * actually inside — leaving the caller on its existing path.
 */
export const outlineAttachPoint = (
  node: NodeLike,
  bounds: RectLike,
  port: P,
  next: P
): P | null => {
  if (!node?.intersect) {
    return null;
  }

  const dx = next.x - port.x;
  const dy = next.y - port.y;
  if (dx === 0 && dy === 0) {
    return null;
  }

  const centre = { x: bounds.x, y: bounds.y };
  // The departure axis. A diagonal departure has no single axis to preserve, so
  // there is nothing here to improve on.
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const along = (t: number): P => (horizontal ? { x: t, y: port.y } : { x: port.x, y: t });

  // Walk in from the centre-line towards the port: inside at one end, on or
  // outside the outline at the other.
  let inner = horizontal ? centre.x : centre.y;
  let outer = horizontal ? port.x : port.y;
  if (!insideOutline(node, centre, along(inner))) {
    return null;
  }
  if (insideOutline(node, centre, along(outer))) {
    // The port itself is on or inside the outline — it IS the attachment.
    return { ...port };
  }

  for (let step = 0; step < OUTLINE_RAY_STEPS; step++) {
    const mid = (inner + outer) / 2;
    if (insideOutline(node, centre, along(mid))) {
      inner = mid;
    } else {
      outer = mid;
    }
  }
  return along(inner);
};

export const computeNodeIntersection = (
  node: NodeLike,
  bounds: RectLike,
  outside: P,
  center: P
): P => {
  const outside2 = ensureTrulyOutside(bounds, outside);
  return tryNodeIntersect(node, bounds, outside2) ?? fallbackIntersection(bounds, outside2, center);
};

export const replaceEndpoint = (
  points: P[],
  which: 'start' | 'end',
  value: P | null | undefined,
  tol = 0.1
) => {
  if (!value || points.length === 0) {
    return;
  }

  if (which === 'start') {
    if (
      points.length > 0 &&
      Math.abs(points[0].x - value.x) < tol &&
      Math.abs(points[0].y - value.y) < tol
    ) {
      // duplicate start remove it
      points.shift();
    } else {
      points[0] = value;
    }
  } else {
    const last = points.length - 1;
    if (
      points.length > 0 &&
      Math.abs(points[last].x - value.x) < tol &&
      Math.abs(points[last].y - value.y) < tol
    ) {
      // duplicate end remove it
      points.pop();
    } else {
      points[last] = value;
    }
  }
};
