export interface Vec {
  x: number;
  y: number;
}

/** Axis-aligned box given by its centre. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boxLeft(b: Box): number {
  return b.x - b.width / 2;
}
export function boxRight(b: Box): number {
  return b.x + b.width / 2;
}
export function boxTop(b: Box): number {
  return b.y - b.height / 2;
}
export function boxBottom(b: Box): number {
  return b.y + b.height / 2;
}

export function inflateBox(b: Box, margin: number): Box {
  return { x: b.x, y: b.y, width: b.width + 2 * margin, height: b.height + 2 * margin };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    boxLeft(a) < boxRight(b) &&
    boxRight(a) > boxLeft(b) &&
    boxTop(a) < boxBottom(b) &&
    boxBottom(a) > boxTop(b)
  );
}

export function boxCorners(b: Box): Vec[] {
  return [
    { x: boxLeft(b), y: boxTop(b) },
    { x: boxRight(b), y: boxTop(b) },
    { x: boxRight(b), y: boxBottom(b) },
    { x: boxLeft(b), y: boxBottom(b) },
  ];
}

/** Corners of a pointed-top hexagon centred on the origin, clockwise from the apex. */
export function hexagonPolygon(width: number, height: number, depth: number): Vec[] {
  const d = Math.min(depth, height / 2);
  return [
    { x: 0, y: -height / 2 },
    { x: width / 2, y: -height / 2 + d },
    { x: width / 2, y: height / 2 - d },
    { x: 0, y: height / 2 },
    { x: -width / 2, y: height / 2 - d },
    { x: -width / 2, y: -height / 2 + d },
  ];
}

export function polygonArea(poly: readonly Vec[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Whether `p` lies inside the convex polygon, shrunk by `margin` px (negative grows it). */
export function pointInConvex(poly: readonly Vec[], p: Vec, margin: number): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const dist = cross / len;
    if (sign === 0 && Math.abs(dist) > 1e-9) {
      sign = Math.sign(dist);
    }
    if (dist * sign < margin) {
      return false;
    }
  }
  return true;
}

/** Separating-axis test of a box against a convex polygon. */
export function boxIntersectsConvex(b: Box, poly: readonly Vec[]): boolean {
  const corners = boxCorners(b);
  const axes: Vec[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    axes.push({ x: -(c.y - a.y), y: c.x - a.x });
  }
  for (const axis of axes) {
    const project = (pts: readonly Vec[]) => {
      const dots = pts.map((p) => p.x * axis.x + p.y * axis.y);
      return [Math.min(...dots), Math.max(...dots)] as const;
    };
    const [minA, maxA] = project(corners);
    const [minB, maxB] = project(poly);
    if (maxA <= minB || maxB <= minA) {
      return false;
    }
  }
  return true;
}

/** Parameter interval of the segment a→b inside the box, or undefined when it misses. */
export function clipSegmentToBox(a: Vec, b: Vec, box: Box): [number, number] | undefined {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const left = box.x - box.width / 2;
  const right = box.x + box.width / 2;
  const top = box.y - box.height / 2;
  const bottom = box.y + box.height / 2;
  // Liang–Barsky: each side contributes (p, q) = (direction against the side, room to it).
  for (let side = 0; side < 4; side++) {
    const p = side === 0 ? -dx : side === 1 ? dx : side === 2 ? -dy : dy;
    const q =
      side === 0 ? a.x - left : side === 1 ? right - a.x : side === 2 ? a.y - top : bottom - a.y;
    if (p === 0) {
      if (q < 0) {
        return undefined;
      }
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) {
          return undefined;
        }
        t0 = Math.max(t0, r);
      } else {
        if (r < t0) {
          return undefined;
        }
        t1 = Math.min(t1, r);
      }
    }
  }
  return t0 <= t1 ? [t0, t1] : undefined;
}

export function segmentHitsBox(a: Vec, b: Vec, box: Box): boolean {
  const hw = box.width / 2;
  const hh = box.height / 2;
  if (
    Math.max(a.x, b.x) < box.x - hw ||
    Math.min(a.x, b.x) > box.x + hw ||
    Math.max(a.y, b.y) < box.y - hh ||
    Math.min(a.y, b.y) > box.y + hh
  ) {
    return false;
  }
  const hit = clipSegmentToBox(a, b, box);
  return hit !== undefined && hit[1] - hit[0] > 1e-9;
}

/** Point where the ray from the origin along `angle` leaves the convex polygon. */
export function rayExit(poly: readonly Vec[], angle: number): Vec {
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denom = dir.x * ey - dir.y * ex;
    if (Math.abs(denom) < 1e-12) {
      continue;
    }
    const t = (a.x * ey - a.y * ex) / denom;
    const u = (a.x * dir.y - a.y * dir.x) / denom;
    if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9) {
      best = Math.max(best, t);
    }
  }
  return { x: dir.x * best, y: dir.y * best };
}

export function angleOf(p: Vec): number {
  return Math.atan2(p.y, p.x);
}

/** Smallest absolute difference between two angles, in [0, π]. */
export function angleGap(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/** Mean direction of the angles; undefined for an empty list. */
export function circularMean(angles: readonly number[]): number | undefined {
  if (angles.length === 0) {
    return undefined;
  }
  const sx = angles.reduce((s, a) => s + Math.cos(a), 0);
  const sy = angles.reduce((s, a) => s + Math.sin(a), 0);
  return Math.atan2(sy, sx);
}

/**
 * Assigns each item to a distinct slot so the summed squared angular distance between an item's
 * target angle and its slot angle is smallest. Items without a target cost nothing anywhere.
 * Brute force: fine for the handful of nodes on one ring.
 */
export function assignToSlots(
  targets: readonly (number | undefined)[],
  slots: readonly number[]
): number[] {
  const n = targets.length;
  const used = new Array<boolean>(slots.length).fill(false);
  const current: number[] = [];
  let best: number[] = targets.map((_, i) => i);
  let bestCost = Number.POSITIVE_INFINITY;
  const walk = (i: number, cost: number): void => {
    if (cost >= bestCost) {
      return;
    }
    if (i === n) {
      bestCost = cost;
      best = [...current];
      return;
    }
    const target = targets[i];
    for (const [s, slot] of slots.entries()) {
      if (used[s]) {
        continue;
      }
      used[s] = true;
      current[i] = s;
      walk(i + 1, cost + (target === undefined ? 0 : angleGap(target, slot) ** 2));
      used[s] = false;
    }
  };
  walk(0, 0);
  return best;
}

export function pointAlong(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Whether the segments a–b and c–d cross at a point interior to both. */
export function segmentsCross(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  const side = (p: Vec, q: Vec, r: Vec) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = side(a, b, c);
  const d2 = side(a, b, d);
  const d3 = side(c, d, a);
  const d4 = side(c, d, b);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
}

/** Whether any side of the polygon passes through the box. */
export function outlineHitsBox(poly: readonly Vec[], box: Box): boolean {
  for (let i = 0; i < poly.length; i++) {
    if (segmentHitsBox(poly[i], poly[(i + 1) % poly.length], box)) {
      return true;
    }
  }
  return false;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function boundsOf(poly: readonly Vec[]): Bounds {
  return {
    minX: Math.min(...poly.map((p) => p.x)),
    maxX: Math.max(...poly.map((p) => p.x)),
    minY: Math.min(...poly.map((p) => p.y)),
    maxY: Math.max(...poly.map((p) => p.y)),
  };
}

export function boxTouchesBounds(b: Box, bounds: Bounds): boolean {
  return (
    b.x + b.width / 2 > bounds.minX &&
    b.x - b.width / 2 < bounds.maxX &&
    b.y + b.height / 2 > bounds.minY &&
    b.y - b.height / 2 < bounds.maxY
  );
}
