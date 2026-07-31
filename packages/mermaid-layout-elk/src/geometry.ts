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
