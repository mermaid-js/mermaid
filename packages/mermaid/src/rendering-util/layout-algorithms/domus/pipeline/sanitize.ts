import type { Point } from '../types.js';
import { approxEqual } from '../core/helpers.js';
import { normalizePolyline } from './polyline.js';

function manhattanDist(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function sanitizeOrthogonalPolylineForRendering(
  points: Point[],
  opts: { spacing: number; minSegmentLength?: number }
): Point[] {
  // Goal: remove tiny segments / micro-doglegs that become visible artifacts once
  // smoothing/corner-rounding is applied during rendering.
  //
  // This is intentionally conservative:
  // - preserve endpoints
  // - keep the polyline orthogonal
  // - avoid heavy global rerouting
  if (!points || points.length < 2) {
    return points;
  }

  const minSeg = Math.max(2, opts.minSegmentLength ?? Math.max(6, Math.min(20, opts.spacing)));
  const eq = (a: Point, b: Point) => approxEqual(a.x, b.x) && approxEqual(a.y, b.y);

  const orthogonalJoin = (a: Point, b: Point): Point[] => {
    if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
      return [a, b];
    }
    const e1: Point = { x: a.x, y: b.y };
    const e2: Point = { x: b.x, y: a.y };
    const score1 = Math.min(manhattanDist(a, e1), manhattanDist(e1, b));
    const score2 = Math.min(manhattanDist(a, e2), manhattanDist(e2, b));
    const elbow = score1 >= score2 ? e1 : e2;
    // If the chosen elbow degenerates (rare with rounding), fall back.
    if (eq(elbow, a) || eq(elbow, b)) {
      return [a, e2, b];
    }
    return [a, elbow, b];
  };

  // Protect the first/last two points (ports + immediate stubs/anchors) when present.
  const protectedIndex = (i: number, n: number) =>
    i === 0 || i === n - 1 || (n >= 4 && (i === 1 || i === n - 2));

  let pts = [...points];

  for (let iter = 0; iter < 6; iter++) {
    // 1) Drop consecutive duplicates.
    const dedup: Point[] = [];
    for (const p of pts) {
      const last = dedup[dedup.length - 1];
      if (last && eq(last, p)) {
        continue;
      }
      dedup.push(p);
    }
    pts = dedup;

    if (pts.length < 2) {
      return pts;
    }

    // 2) Collapse collinear interior points.
    const col: Point[] = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = col[col.length - 1];
      const b = pts[i];
      const c = pts[i + 1];
      const colX = approxEqual(a.x, b.x) && approxEqual(b.x, c.x);
      const colY = approxEqual(a.y, b.y) && approxEqual(b.y, c.y);
      if (colX || colY) {
        continue;
      }
      col.push(b);
    }
    col.push(pts[pts.length - 1]);
    pts = col;

    // 3) Fix/merge too-short segments.
    let changed = false;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = manhattanDist(a, b);
      if (len >= minSeg) {
        continue;
      }

      // Terminal segments: extend the first/last stub point outward to a minimum length.
      if (i === 0 && pts.length >= 2) {
        const port = pts[0];
        const p1 = pts[1];
        if (approxEqual(port.x, p1.x) && !approxEqual(port.y, p1.y)) {
          const dir = p1.y > port.y ? 1 : -1;
          pts[1] = { x: p1.x, y: port.y + dir * minSeg };
          changed = true;
          break;
        }
        if (approxEqual(port.y, p1.y) && !approxEqual(port.x, p1.x)) {
          const dir = p1.x > port.x ? 1 : -1;
          pts[1] = { x: port.x + dir * minSeg, y: p1.y };
          changed = true;
          break;
        }
      }
      if (i === pts.length - 2 && pts.length >= 2) {
        const port = pts[pts.length - 1];
        const pN = pts[pts.length - 2];
        if (approxEqual(port.x, pN.x) && !approxEqual(port.y, pN.y)) {
          const dir = pN.y > port.y ? 1 : -1;
          pts[pts.length - 2] = { x: pN.x, y: port.y + dir * minSeg };
          changed = true;
          break;
        }
        if (approxEqual(port.y, pN.y) && !approxEqual(port.x, pN.x)) {
          const dir = pN.x > port.x ? 1 : -1;
          pts[pts.length - 2] = { x: port.x + dir * minSeg, y: pN.y };
          changed = true;
          break;
        }
      }

      // Interior: remove a nearby unprotected point and re-orthogonalize locally.
      const n = pts.length;
      const removeIdx = !protectedIndex(i + 1, n) ? i + 1 : !protectedIndex(i, n) ? i : -1;
      if (removeIdx === -1) {
        continue;
      }
      if (removeIdx <= 0 || removeIdx >= n - 1) {
        continue;
      }
      const left = pts[removeIdx - 1];
      const right = pts[removeIdx + 1];
      const joined = orthogonalJoin(left, right);
      // Replace [left, removed, right] with joined (which includes endpoints).
      pts.splice(removeIdx - 1, 3, ...joined);
      changed = true;
      break;
    }

    if (!changed) {
      break;
    }
  }

  // Final pass: ensure we never emit diagonal segments (renderer + validator expect orthogonal).
  // If any diagonal segments remain due to upstream edits/rounding, expand them locally.
  const fixed: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = fixed[fixed.length - 1];
    const b = pts[i];
    if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
      fixed.push(b);
      continue;
    }
    const joined = orthogonalJoin(a, b);
    for (let j = 1; j < joined.length; j++) {
      fixed.push(joined[j]);
    }
  }

  // Drop duplicates/collinear again.
  return normalizePolyline(fixed);
}
